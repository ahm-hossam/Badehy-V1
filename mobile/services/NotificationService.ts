// Simplified notification service for development
// Push notifications removed to avoid native module issues
import { Platform } from 'react-native';

export interface PushToken {
  token: string;
  platform: string;
}

class NotificationService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
  }

  /**
   * Register for push notifications (simplified for development)
   */
  async registerForPushNotifications(): Promise<string | null> {
    console.log('Push notifications disabled in development mode');
    return null;
  }

  /**
   * Register push token with backend
   */
  async registerTokenWithBackend(clientId: number, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          token,
          platform: Platform.OS,
        }),
      });

      if (response.ok) {
        console.log('Push token registered successfully');
        return true;
      } else {
        console.error('Failed to register push token:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  /**
   * Setup notification listeners (simplified for development)
   */
  setupNotificationListeners() {
    console.log('Notification listeners disabled in development mode');
    return {
      notificationListener: null,
      responseListener: null,
    };
  }

  /**
   * Handle notification tap based on type
   */
  private handleNotificationTap(type: string, data: any) {
    switch (type) {
      case 'workout':
        // Navigate to workout tab
        console.log('Navigate to workout');
        break;
      case 'nutrition':
        // Navigate to nutrition tab
        console.log('Navigate to nutrition');
        break;
      case 'program_update':
        // Navigate to programs
        console.log('Navigate to programs');
        break;
      default:
        // General notification - could show a modal or navigate to notifications
        console.log('General notification tapped');
        break;
    }
  }

  /**
   * Remove notification listeners (simplified for development)
   */
  removeNotificationListeners(listeners: any) {
    console.log('Notification listeners cleanup disabled in development mode');
  }

  /**
   * Get all notifications for a client (from backend)
   */
  async getClientNotifications(clientId: number): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/client/${clientId}`);
      
      if (response.ok) {
        const data = await response.json();
        return data.notifications || [];
      } else {
        console.error('Failed to fetch notifications:', await response.text());
        return [];
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: number, clientId: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
}

export default new NotificationService();
