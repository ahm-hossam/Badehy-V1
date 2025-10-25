import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all notifications for a trainer (history)
router.get('/', async (req, res) => {
  try {
    const { trainerId, page = 1, limit = 20 } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { trainerId: Number(trainerId) },
        include: {
          recipients: {
            include: {
              client: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({
        where: { trainerId: Number(trainerId) }
      })
    ]);

    // Calculate delivery statistics for each notification
    const notificationsWithStats = notifications.map(notification => {
      const totalRecipients = notification.recipients.length;
      const delivered = notification.recipients.filter(r => r.status === 'delivered' || r.status === 'sent').length;
      const failed = notification.recipients.filter(r => r.status === 'failed').length;
      const sent = notification.recipients.filter(r => r.status === 'sent').length;
      const opened = notification.recipients.filter(r => r.readAt !== null).length;

      return {
        ...notification,
        stats: {
          totalRecipients,
          delivered,
          failed,
          sent,
          opened,
          deliveryRate: totalRecipients > 0 ? Math.round((delivered / totalRecipients) * 100) : 0,
          openedRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0
        }
      };
    });

    res.json({
      notifications: notificationsWithStats,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get trainer's clients for notification targeting
router.get('/clients', async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const clients = await prisma.trainerClient.findMany({
      where: { trainerId: Number(trainerId) },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        pushToken: {
          select: {
            token: true,
            platform: true,
            isActive: true
          }
        }
      },
      orderBy: { fullName: 'asc' }
    });

    res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Send notification
router.post('/send', async (req, res) => {
  try {
    const { trainerId, title, message, type = 'general', clientIds } = req.body;

    if (!trainerId || !title || !message) {
      return res.status(400).json({ error: 'Trainer ID, title, and message are required' });
    }

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({ error: 'At least one client must be selected' });
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        trainerId: Number(trainerId),
        title,
        message,
        type,
      }
    });

    // Get clients with push tokens
    const clients = await prisma.trainerClient.findMany({
      where: {
        id: { in: clientIds.map(id => Number(id)) },
        trainerId: Number(trainerId)
      },
      include: {
        pushToken: true
      }
    });

    // Create notification recipients and collect push tokens
    const pushTokens: { token: string; platform: string; clientId: number }[] = [];
    const recipientPromises = clients.map(async (client) => {
      // Add push token if available
      if (client.pushToken && client.pushToken.isActive) {
        pushTokens.push({
          token: client.pushToken.token,
          platform: client.pushToken.platform,
          clientId: client.id
        });
      }

      // Create recipient record
      return prisma.notificationRecipient.create({
        data: {
          notificationId: notification.id,
          clientId: client.id,
          status: 'sent'
        }
      });
    });

    await Promise.all(recipientPromises);

    // Send push notifications
    const pushResults = await sendPushNotifications(pushTokens, {
      title,
      message,
      data: {
        notificationId: notification.id.toString(),
        type
      }
    });

    // Update recipient statuses based on push results
    for (const result of pushResults) {
      if (result.clientId) {
        await prisma.notificationRecipient.updateMany({
          where: {
            notificationId: notification.id,
            clientId: result.clientId
          },
          data: {
            status: result.success ? 'delivered' : 'failed',
            deliveredAt: result.success ? new Date() : null
          }
        });
      }
    }

    res.json({
      success: true,
      notification: {
        id: notification.id,
        title,
        message,
        type,
        sentAt: notification.sentAt,
        recipientCount: clients.length,
        pushSent: pushResults.filter(r => r.success).length,
        pushFailed: pushResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Helper function to send push notifications
async function sendPushNotifications(
  tokens: { token: string; platform: string; clientId: number }[],
  notification: { title: string; message: string; data?: any }
): Promise<{ success: boolean; clientId: number; error?: string }[]> {
  const results: { success: boolean; clientId: number; error?: string }[] = [];

  // Prepare messages for Expo Push Notification service
  const messages = tokens.map(tokenData => ({
    to: tokenData.token,
    title: notification.title,
    body: notification.message,
    data: notification.data,
    sound: 'default',
    badge: 1,
  }));

  try {
    // Send to Expo Push Notification service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const responseData = await response.json();
    console.log('Expo push response:', responseData);

    // Process response for each token
    if (Array.isArray(responseData.data)) {
      responseData.data.forEach((result: any, index: number) => {
        const tokenData = tokens[index];
        if (result.status === 'ok') {
          results.push({
            success: true,
            clientId: tokenData.clientId
          });
          console.log(`Push notification sent successfully to client ${tokenData.clientId}`);
        } else {
          results.push({
            success: false,
            clientId: tokenData.clientId,
            error: result.message || result.details?.error || 'Unknown error'
          });
          console.error(`Failed to send push notification to client ${tokenData.clientId}:`, result);
        }
      });
    } else {
      // Single message response
      const tokenData = tokens[0];
      if (responseData.status === 'ok') {
        results.push({
          success: true,
          clientId: tokenData.clientId
        });
      } else {
        results.push({
          success: false,
          clientId: tokenData.clientId,
          error: responseData.message || 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error('Error sending push notifications:', error);
    // Mark all as failed if the request itself failed
    tokens.forEach(tokenData => {
      results.push({
        success: false,
        clientId: tokenData.clientId,
        error: error instanceof Error ? error.message : 'Network error'
      });
    });
  }

  return results;
}

// Register/update push token for a client
router.post('/register-token', async (req, res) => {
  try {
    const { clientId, token, platform } = req.body;

    if (!clientId || !token || !platform) {
      return res.status(400).json({ error: 'Client ID, token, and platform are required' });
    }

    // Upsert push token
    await prisma.pushToken.upsert({
      where: { clientId: Number(clientId) },
      update: {
        token,
        platform,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        clientId: Number(clientId),
        token,
        platform,
        isActive: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// Get notifications for a specific client (mobile endpoint)
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const notifications = await prisma.notificationRecipient.findMany({
      where: { clientId: Number(clientId) },
      include: {
        notification: {
          select: {
            id: true,
            title: true,
            message: true,
            type: true,
            sentAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedNotifications = notifications.map(recipient => ({
      id: recipient.notification.id,
      title: recipient.notification.title,
      message: recipient.notification.message,
      type: recipient.notification.type,
      sentAt: recipient.notification.sentAt,
      status: recipient.status,
      readAt: recipient.readAt,
      deliveredAt: recipient.deliveredAt,
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Error fetching client notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read (mobile endpoint)
router.post('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { clientId } = req.body;

    if (!notificationId || !clientId) {
      return res.status(400).json({ error: 'Notification ID and Client ID are required' });
    }

    await prisma.notificationRecipient.updateMany({
      where: {
        notificationId: Number(notificationId),
        clientId: Number(clientId)
      },
      data: {
        readAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Test endpoint to simulate push notifications in development
router.post('/test-push/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { title = 'Test Notification', message = 'This is a test notification' } = req.body;

    console.log(`Simulating push notification for client ${clientId}:`);
    console.log(`Title: ${title}`);
    console.log(`Message: ${message}`);

    // In development, we'll just log the notification
    // In production, this would send an actual push notification
    
    res.json({
      success: true,
      message: 'Test notification simulated successfully',
      clientId: Number(clientId),
      notification: { title, message }
    });
  } catch (error) {
    console.error('Error simulating push notification:', error);
    res.status(500).json({ error: 'Failed to simulate push notification' });
  }
});

export default router;
