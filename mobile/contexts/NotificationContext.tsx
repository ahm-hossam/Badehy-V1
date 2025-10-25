import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBanner from '../components/NotificationBanner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  clearNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    console.log('🎯 showNotification called:', notification.title);
    
    const id = Date.now().toString();
    const newNotification = {
      ...notification,
      id,
    };
    console.log('🎯 Setting notification state:', newNotification);
    setCurrentNotification(newNotification);
    setIsVisible(true);
    console.log('🎯 Set isVisible to true');

    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Auto-dismiss after 4 seconds
    const newTimeoutId = setTimeout(() => {
      console.log('🎯 Auto-dismissing notification');
      setIsVisible(false);
      setCurrentNotification(null);
    }, 4000);
    setTimeoutId(newTimeoutId);
  };

  const clearNotification = () => {
    setIsVisible(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setCurrentNotification(null);
  };

  const handleNotificationTap = () => {
    if (currentNotification) {
      console.log('Notification tapped:', currentNotification);
      // Handle navigation based on notification type
      switch (currentNotification.type) {
        case 'workout':
          // Navigate to workout tab
          console.log('Navigate to workout');
          break;
        case 'nutrition':
          // Navigate to nutrition tab
          console.log('Navigate to nutrition');
          break;
        default:
          console.log('General notification tapped');
          break;
      }
    }
  };

  // Track shown notifications to prevent duplicates
  const [shownNotificationIds, setShownNotificationIds] = useState<Set<number>>(new Set());

  // Poll for new notifications and show them as banners
  useEffect(() => {
    const pollForNotifications = async () => {
      try {
        const token = await AsyncStorage.getItem('clientToken');
        if (!token) return;

        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'}/api/notifications/client/2`);
        if (response.ok) {
          const data = await response.json();
          const notifications = data.notifications || [];
          
          // Find the latest unread notification
          const latestUnread = notifications
            .filter((n: any) => !n.readAt)
            .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())[0];

          if (latestUnread && !shownNotificationIds.has(latestUnread.id)) {
            console.log('📬 Found new notification:', latestUnread.title);
            showNotification({
              title: latestUnread.title,
              message: latestUnread.message,
              type: latestUnread.type,
            });
            setShownNotificationIds(prev => new Set([...prev, latestUnread.id]));
          }
        }
      } catch (error) {
        console.error('Error polling for notifications:', error);
      }
    };

    // Poll every 10 seconds
    const interval = setInterval(pollForNotifications, 10000);
    
    // Initial poll
    pollForNotifications();

    return () => clearInterval(interval);
  }, [shownNotificationIds]);

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      <NotificationBanner
        notification={currentNotification}
        isVisible={isVisible}
        onDismiss={clearNotification}
        onTap={handleNotificationTap}
      />
    </NotificationContext.Provider>
  );
};
