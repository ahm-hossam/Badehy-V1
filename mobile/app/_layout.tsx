import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import { NotificationProvider } from '../contexts/NotificationContext';

export default function RootLayout() {
  const [client] = useState(() => new QueryClient());

  useEffect(() => {
    // Setup notification listeners when app starts
    const listeners = NotificationService.setupNotificationListeners();

    // Cleanup listeners when component unmounts
    return () => {
      NotificationService.removeNotificationListeners(listeners);
    };
  }, []);

  return (
    <QueryClientProvider client={client}>
      <NotificationProvider>
        <Slot />
      </NotificationProvider>
    </QueryClientProvider>
  );
}


