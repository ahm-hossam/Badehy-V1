import { io, Socket } from 'socket.io-client';
import { getStoredUser } from './auth';

let socket: Socket | null = null;

export const initializeSocket = (): Socket | null => {
  if (socket?.connected) {
    return socket;
  }

  const user = getStoredUser();
  if (!user) {
    return null;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  
  socket = io(API_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Authenticate with user ID when connected
  socket.on('connect', () => {
    // For dashboard trainers, we'll pass the user ID as a simple token
    // The backend will accept trainerId from the token or fallback to user ID
    socket?.emit('authenticate', {
      userId: user.id,
      userType: 'trainer'
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

