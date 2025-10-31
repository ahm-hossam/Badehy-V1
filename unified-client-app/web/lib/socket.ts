import { io, Socket } from 'socket.io-client';
import { TokenStorage } from './storage';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket | null> => {
  if (socket?.connected) {
    return socket;
  }

  try {
    const token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
    if (!token) {
      console.error('No token available for socket connection');
      return null;
    }

    socket = io(API, {
      transports: ['websocket', 'polling'],
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      socket?.emit('authenticate', {
        token: token,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Error initializing socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinConversation = (trainerId: number, clientId: number) => {
  if (socket) {
    socket.emit('join_conversation', { trainerId, clientId });
  }
};

export const leaveConversation = (trainerId: number, clientId: number) => {
  if (socket) {
    socket.emit('leave_conversation', { trainerId, clientId });
  }
};

