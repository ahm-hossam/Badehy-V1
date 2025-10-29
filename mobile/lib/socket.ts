import { io, Socket } from 'socket.io-client';
import { TokenStorage } from './storage';

let socket: Socket | null = null;

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export const initializeSocket = async (): Promise<Socket | null> => {
  if (socket?.connected) {
    return socket;
  }

  let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
  if (!token) {
    token = (await TokenStorage.getAccessToken()) || undefined;
  }

  if (!token) {
    return null;
  }

  socket = io(API, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Authenticate with JWT token when connected
  socket.on('connect', () => {
    socket?.emit('authenticate', {
      token
    });
  });

  return socket;
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

// Helper to join a conversation room
export const joinConversation = (trainerId: number, clientId: number) => {
  if (socket) {
    socket.emit('join_conversation', { trainerId, clientId });
  }
};

// Helper to leave a conversation room
export const leaveConversation = (trainerId: number, clientId: number) => {
  if (socket) {
    socket.emit('leave_conversation', { trainerId, clientId });
  }
};

