import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { socketManager } from '../socket';

const router = Router();
const prisma = new PrismaClient();

// GET /api/messages?trainerId=X&clientId=Y - Get all messages between trainer and client
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId } = req.query;

    if (!trainerId || !clientId) {
      return res.status(400).json({ error: 'trainerId and clientId are required' });
    }

    const messages = await prisma.message.findMany({
      where: {
        trainerId: Number(trainerId),
        clientId: Number(clientId)
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/conversations?trainerId=X - Get all conversations for a trainer with last message and unread count
router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'trainerId is required' });
    }

    // Get all clients for this trainer (not just those with messages)
    const allClients = await prisma.trainerClient.findMany({
      where: {
        trainerId: Number(trainerId)
      },
      select: {
        id: true,
        fullName: true,
        email: true
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    // For each client, get the last message and unread count
    const conversations = await Promise.all(
      allClients.map(async (client) => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            trainerId: Number(trainerId),
            clientId: client.id
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        const unreadCount = await prisma.message.count({
          where: {
            trainerId: Number(trainerId),
            clientId: client.id,
            senderType: 'client',
            isRead: false
          }
        });

        return {
          client,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderType: lastMessage.senderType,
            createdAt: lastMessage.createdAt
          } : null,
          unreadCount
        };
      })
    );

    // Sort conversations: first by whether they have messages (those with messages first),
    // then by last message time (most recent first), then alphabetically by client name
    conversations.sort((a, b) => {
      // Clients with messages come first
      if (a.lastMessage && !b.lastMessage) return -1;
      if (!a.lastMessage && b.lastMessage) return 1;
      
      // If both have messages, sort by most recent
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      
      // If neither has messages, sort alphabetically by client name
      return a.client.fullName.localeCompare(b.client.fullName);
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/messages/unread-count?trainerId=X - Total unread messages for a trainer
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.query;
    if (!trainerId) {
      return res.status(400).json({ error: 'trainerId is required' });
    }
    const count = await prisma.message.count({
      where: {
        trainerId: Number(trainerId),
        senderType: 'client',
        isRead: false,
      },
    });
    res.json({ unread: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// GET /api/messages/unread-count-client?trainerId=X&clientId=Y - Get unread messages for a client (from trainer)
router.get('/unread-count-client', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId } = req.query;

    if (!trainerId || !clientId) {
      return res.status(400).json({ error: 'trainerId and clientId are required' });
    }

    const unreadCount = await prisma.message.count({
      where: {
        trainerId: Number(trainerId),
        clientId: Number(clientId),
        senderType: 'trainer', // Messages from trainer to this client
        isRead: false
      }
    });

    res.json({ unread: unreadCount });
  } catch (error) {
    console.error('Error fetching client unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// POST /api/messages - Send a message
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId, senderType, content, attachmentUrl, attachmentType, attachmentName } = req.body;

    if (!trainerId || !clientId || !senderType) {
      return res.status(400).json({ error: 'trainerId, clientId, and senderType are required' });
    }

    if (!content && !attachmentUrl) {
      return res.status(400).json({ error: 'Either content or attachment is required' });
    }

    if (senderType !== 'trainer' && senderType !== 'client') {
      return res.status(400).json({ error: 'senderType must be "trainer" or "client"' });
    }

    // Verify the client belongs to the trainer
    const client = await prisma.trainerClient.findFirst({
      where: {
        id: Number(clientId),
        trainerId: Number(trainerId)
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found or does not belong to this trainer' });
    }

    const message = await prisma.message.create({
      data: {
        trainerId: Number(trainerId),
        clientId: Number(clientId),
        senderType,
        content: content?.trim() || '',
        attachmentUrl: attachmentUrl || null,
        attachmentType: attachmentType || null,
        attachmentName: attachmentName || null
      },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Broadcast new message via WebSocket
    socketManager.broadcastMessage(Number(trainerId), Number(clientId), message);

    res.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// PATCH /api/messages/:id/read - Mark a message as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { readBy } = req.body; // 'trainer' or 'client'

    if (!readBy || (readBy !== 'trainer' && readBy !== 'client')) {
      return res.status(400).json({ error: 'readBy must be "trainer" or "client"' });
    }

    const message = await prisma.message.findUnique({
      where: { id: Number(id) }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only mark as read if the message sender is different from the reader
    // (e.g., trainer marks client's messages as read, or client marks trainer's messages as read)
    const shouldMarkRead = 
      (readBy === 'trainer' && message.senderType === 'client') ||
      (readBy === 'client' && message.senderType === 'trainer');

    if (!shouldMarkRead) {
      return res.status(400).json({ error: 'Cannot mark own message as read' });
    }

    const updated = await prisma.message.update({
      where: { id: Number(id) },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// PATCH /api/messages/mark-all-read - Mark all messages as read for a conversation
router.patch('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId, readBy } = req.body;

    if (!trainerId || !clientId || !readBy) {
      return res.status(400).json({ error: 'trainerId, clientId, and readBy are required' });
    }

    if (readBy !== 'trainer' && readBy !== 'client') {
      return res.status(400).json({ error: 'readBy must be "trainer" or "client"' });
    }

    // Mark all unread messages as read where sender is the opposite
    const senderType = readBy === 'trainer' ? 'client' : 'trainer';

    const result = await prisma.message.updateMany({
      where: {
        trainerId: Number(trainerId),
        clientId: Number(clientId),
        senderType,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Broadcast read status via WebSocket
    if (result.count > 0) {
      socketManager.broadcastReadStatus(Number(trainerId), Number(clientId), readBy);
    }

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;

