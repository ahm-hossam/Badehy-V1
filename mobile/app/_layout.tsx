import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NotificationService from '../services/NotificationService';
import { NotificationProvider } from '../contexts/NotificationContext';
import { TokenStorage } from '../lib/storage';

export default function RootLayout() {
  const [client] = useState(() => new QueryClient());

  useEffect(() => {
    // Preload token when app starts
    const preloadToken = async () => {
      try {
        await TokenStorage.getAccessToken();
      } catch (error) {
        console.error('Error preloading token:', error);
      }
    };
    preloadToken();

    // Setup notification listeners when app starts
    const listeners = NotificationService.setupNotificationListeners();

    // Handle app state changes to reload token when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Reload token when app becomes active
        preloadToken();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup listeners when component unmounts
    return () => {
      NotificationService.removeNotificationListeners(listeners);
      subscription.remove();
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


