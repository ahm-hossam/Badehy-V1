import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken'; // Keep for mobile app token verification

interface SocketUser {
  userId: number;
  userType: 'trainer' | 'client';
  trainerId?: number;
  clientId?: number;
}

export class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, SocketUser> = new Map();

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // In production, specify allowed origins
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      // Authenticate user from token or user ID
      socket.on('authenticate', async (data: { token?: string; userId?: number; userType?: 'trainer' | 'client' }) => {
        try {
          let userId: number | null = null;
          let userType: 'trainer' | 'client' = 'trainer';

          // Method 1: Direct userId and userType (for dashboard)
          if (data.userId && data.userType) {
            userId = data.userId;
            userType = data.userType;
          }
          // Method 2: JWT token (for mobile app)
          else if (data.token) {
            const decoded = jwt.verify(data.token, process.env.JWT_SECRET || 'dev-secret') as any;
            
            if (decoded.clientId) {
              userId = decoded.clientId;
              userType = 'client';
            } else if (decoded.trainerId || decoded.id) {
              userId = decoded.trainerId || decoded.id;
              userType = 'trainer';
            }
          }

          if (!userId) {
            throw new Error('No user ID found');
          }

          const user: SocketUser = {
            userId,
            userType,
            ...(userType === 'client' ? { clientId: userId } : { trainerId: userId })
          };
          
          this.connectedUsers.set(socket.id, user);
          
          if (userType === 'client') {
            socket.join(`client:${userId}`);
            socket.emit('authenticated', { userType: 'client', userId });
            console.log(`Client ${userId} connected`);
          } else {
            socket.join(`trainer:${userId}`);
            socket.emit('authenticated', { userType: 'trainer', userId });
            console.log(`Trainer ${userId} connected`);
          }
        } catch (error) {
          console.error('Socket authentication error:', error);
          socket.emit('authentication_error', { message: 'Invalid credentials' });
        }
      });

      // Join a conversation room
      socket.on('join_conversation', (data: { trainerId: number; clientId: number }) => {
        const room = `conversation:${data.trainerId}:${data.clientId}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      // Leave a conversation room
      socket.on('leave_conversation', (data: { trainerId: number; clientId: number }) => {
        const room = `conversation:${data.trainerId}:${data.clientId}`;
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        this.connectedUsers.delete(socket.id);
      });
    });

    return this.io;
  }

  // Broadcast new message to conversation room
  broadcastMessage(trainerId: number, clientId: number, message: any) {
    if (!this.io) return;
    
    const room = `conversation:${trainerId}:${clientId}`;
    this.io.to(room).emit('new_message', message);
    
    // Also notify in user-specific rooms for unread counts
    this.io.to(`trainer:${trainerId}`).emit('message_update', { 
      clientId, 
      lastMessage: message 
    });
    this.io.to(`client:${clientId}`).emit('message_update', { 
      trainerId, 
      lastMessage: message 
    });
  }

  // Broadcast when messages are marked as read
  broadcastReadStatus(trainerId: number, clientId: number, readBy: 'trainer' | 'client') {
    if (!this.io) return;
    
    const room = `conversation:${trainerId}:${clientId}`;
    this.io.to(room).emit('messages_read', { trainerId, clientId, readBy });
  }

  getIO(): SocketIOServer | null {
    return this.io;
  }
}

export const socketManager = new SocketManager();

