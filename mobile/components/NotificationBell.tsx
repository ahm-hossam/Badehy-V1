import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  sentAt: string;
  readAt: string | null;
}

interface NotificationBellProps {
  clientId?: number;
}

export default function NotificationBell({ clientId = 2 }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const markingAsRead = useRef<Set<number>>(new Set()); // Track which notifications are being marked as read
  const isMarkingAllRead = useRef(false); // Track if mark all read is in progress

  const fetchNotifications = async () => {
    // Don't fetch if mark all read is in progress
    if (isMarkingAllRead.current) {
      console.log('⏸️ Skipping fetch - mark all read in progress');
      return;
    }

    try {
      const response = await fetch(`${API}/api/notifications/client/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        const notificationList = data.notifications || [];
        setNotifications(notificationList);
        
        // Count unread notifications
        const unread = notificationList.filter((n: Notification) => !n.readAt).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    // Check if already marked as read or currently being marked
    const notification = notifications.find(n => n.id === notificationId);
    if (notification?.readAt || markingAsRead.current.has(notificationId)) {
      return; // Already read or being processed
    }

    // Add to processing set
    markingAsRead.current.add(notificationId);

    try {
      const response = await fetch(`${API}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });
      
      if (response.ok) {
        // Update local state immediately
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      // Remove from processing set
      markingAsRead.current.delete(notificationId);
    }
  };

  const markAllAsRead = async () => {
    if (loading || isMarkingAllRead.current) return; // Prevent multiple calls
    
    setLoading(true);
    isMarkingAllRead.current = true; // Set flag to prevent fetch interference
    
    try {
      // Get all unread notifications
      const unreadNotifications = notifications.filter(n => !n.readAt);
      
      if (unreadNotifications.length === 0) {
        setLoading(false);
        isMarkingAllRead.current = false;
        return;
      }

      console.log('🔄 Marking all notifications as read:', unreadNotifications.length);

      // Update local state FIRST for immediate UI feedback
      const currentTime = new Date().toISOString();
      setNotifications(prev => {
        const updated = prev.map(n => ({
          ...n,
          readAt: n.readAt || currentTime
        }));
        console.log('📝 Updated local state - all notifications now have readAt');
        return updated;
      });
      setUnreadCount(0);
      console.log('🔢 Set unread count to 0');

      // Then make API calls in parallel
      const promises = unreadNotifications.map(notification => 
        fetch(`${API}/api/notifications/${notification.id}/read`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId }),
        })
      );

      const results = await Promise.all(promises);
      
      // Check if any API calls failed
      const failedCalls = results.filter(response => !response.ok);
      if (failedCalls.length > 0) {
        console.error('Some notifications failed to mark as read:', failedCalls.length);
        // Optionally revert state or show error message
      } else {
        console.log('✅ All notifications marked as read successfully');
      }
      
      // Wait a bit before allowing fetches again
      setTimeout(() => {
        isMarkingAllRead.current = false;
      }, 1000);
      
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Revert state on error
      isMarkingAllRead.current = false;
      fetchNotifications();
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    console.log('🔔 Bell icon tapped - opening modal');
    console.log('🔔 Current modal state:', { isModalVisible, isDetailModalVisible });
    
    // Close detail modal if open
    if (isDetailModalVisible) {
      console.log('🔔 Closing detail modal first');
      setIsDetailModalVisible(false);
      setSelectedNotification(null);
    }
    
    // Open main modal
    setIsModalVisible(true);
    fetchNotifications(); // Refresh when opening
  };

  const closeModal = () => {
    console.log('🔔 Closing main modal');
    setIsModalVisible(false);
    // Reset detail modal state as well
    setIsDetailModalVisible(false);
    setSelectedNotification(null);
  };

  const openNotificationDetail = (notification: Notification) => {
    console.log('🔍 Opening notification detail:', notification.title);
    console.log('🔍 Notification message length:', notification.message.length);
    
    // Close main modal first
    setIsModalVisible(false);
    
    // Set detail modal state
    setSelectedNotification(notification);
    setIsDetailModalVisible(true);
    console.log('🔍 Detail modal should be visible now');
    
    // Mark as read when opening detail
    if (!notification.readAt) {
      markAsRead(notification.id);
    }
  };

  const closeNotificationDetail = () => {
    console.log('🔍 Closing notification detail');
    setIsDetailModalVisible(false);
    setSelectedNotification(null);
    // Don't reopen main modal automatically - let user tap bell again if needed
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return 'barbell';
      case 'nutrition':
        return 'nutrition';
      case 'program_update':
        return 'refresh';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'workout':
        return '#4F46E5';
      case 'nutrition':
        return '#10B981';
      case 'program_update':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  // Fetch notifications on mount and when modal closes
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [clientId]);

  // Refresh notifications when modal closes to update badge count
  useEffect(() => {
    if (!isModalVisible && !loading) {
      // Only refresh if not currently processing mark all read
      // Small delay to ensure backend has processed the read status
      setTimeout(() => {
        if (!loading) {
          fetchNotifications();
        }
      }, 500);
    }
  }, [isModalVisible, loading]);

  // Debug detail modal state
  useEffect(() => {
    console.log('🔍 Detail modal state changed:', { isDetailModalVisible, selectedNotification: selectedNotification?.title });
  }, [isDetailModalVisible, selectedNotification]);

  return (
    <>
      {/* Bell Icon Button */}
      <Pressable 
        onPress={openModal} 
        style={styles.bellContainer}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
      >
        <Ionicons name="notifications-outline" size={24} color="#111827" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Notifications Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            <View style={styles.modalActions}>
              {unreadCount > 0 && (
                <Pressable 
                  onPress={markAllAsRead} 
                  style={[
                    styles.markAllButton,
                    loading && styles.markAllButtonDisabled
                  ]}
                  disabled={loading}
                >
                  <Text style={[
                    styles.markAllText,
                    loading && styles.markAllTextDisabled
                  ]}>
                    {loading ? 'Marking...' : 'Mark All Read'}
                  </Text>
                </Pressable>
              )}
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#111827" />
              </Pressable>
            </View>
          </View>

          {/* Notifications List */}
          <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  You'll see your trainer's messages here
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <Pressable
                  key={notification.id}
                  style={[
                    styles.notificationItem,
                    !notification.readAt && styles.unreadNotification,
                    markingAsRead.current.has(notification.id) && styles.processingNotification
                  ]}
                  onPress={() => openNotificationDetail(notification)}
                  disabled={markingAsRead.current.has(notification.id)}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <View style={styles.notificationIconContainer}>
                        <Ionicons 
                          name={getNotificationIcon(notification.type) as any} 
                          size={20} 
                          color={getNotificationColor(notification.type)} 
                        />
                      </View>
                      <View style={styles.notificationMeta}>
                        <Text style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notificationTime}>
                          {formatDate(notification.sentAt)}
                        </Text>
                      </View>
                      {!notification.readAt && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    <Text style={styles.notificationMessage}>
                      {truncateMessage(notification.message)}
                    </Text>
                    {notification.message.length > 80 && (
                      <Text style={styles.readMoreText}>Tap to read more</Text>
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Notification Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={isDetailModalVisible}
        onRequestClose={closeNotificationDetail}
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={[styles.detailModalContainer, { paddingTop: insets.top }]}>
          <View style={styles.detailModalHeader}>
            <Pressable onPress={closeNotificationDetail} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </Pressable>
            <Text style={styles.detailModalTitle}>Notification</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedNotification && (
            <ScrollView style={styles.detailModalContent}>
              <View style={styles.detailNotificationCard}>
                <View style={styles.detailNotificationHeader}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons 
                      name={getNotificationIcon(selectedNotification.type) as any} 
                      size={24} 
                      color="#4F46E5" 
                    />
                  </View>
                  <View style={styles.detailNotificationMeta}>
                    <Text style={styles.detailNotificationTitle}>
                      {selectedNotification.title}
                    </Text>
                    <Text style={styles.detailNotificationTime}>
                      {formatDate(selectedNotification.sentAt)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.detailNotificationMessage}>
                  {selectedNotification.message}
                </Text>
                
                <View style={styles.detailNotificationFooter}>
                  <View style={styles.detailNotificationTypeContainer}>
                    <Text style={styles.detailNotificationTypeLabel}>Type:</Text>
                    <Text style={styles.detailNotificationTypeValue}>
                      {selectedNotification.type.charAt(0).toUpperCase() + selectedNotification.type.slice(1)}
                    </Text>
                  </View>
                  {selectedNotification.readAt && (
                    <Text style={styles.detailNotificationReadStatus}>
                      Read on {new Date(selectedNotification.readAt).toLocaleDateString()} at {new Date(selectedNotification.readAt).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
    marginRight: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  markAllText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  markAllButtonDisabled: {
    opacity: 0.6,
  },
  markAllTextDisabled: {
    color: '#9CA3AF',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  processingNotification: {
    opacity: 0.6,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationMeta: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginLeft: 8,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  readMoreText: {
    color: '#4F46E5',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Detail Modal Styles
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  detailModalContent: {
    flex: 1,
    padding: 20,
  },
  detailNotificationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailNotificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailNotificationMeta: {
    flex: 1,
  },
  detailNotificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  detailNotificationTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailNotificationMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 20,
  },
  detailNotificationFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  detailNotificationTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailNotificationTypeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 8,
  },
  detailNotificationTypeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    textTransform: 'capitalize',
  },
  detailNotificationReadStatus: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
