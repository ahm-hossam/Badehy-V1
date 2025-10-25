import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
}

interface NotificationBannerProps {
  notification: Notification | null;
  isVisible: boolean;
  onDismiss: () => void;
  onTap?: () => void;
}

const { width } = Dimensions.get('window');

export default function NotificationBanner({ notification, isVisible, onDismiss, onTap }: NotificationBannerProps) {
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    console.log('🎨 NotificationBanner useEffect:', { isVisible, hasNotification: !!notification, title: notification?.title });
    
    if (isVisible && notification) {
      console.log('📱 Showing notification banner:', notification.title);
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        console.log('⏰ Auto-dismissing notification banner');
        handleDismiss();
      }, 4000);

      return () => clearTimeout(timer);
    } else if (!isVisible) {
      console.log('📱 Hiding notification banner');
      // Slide up when not visible
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [isVisible, notification]);

  const handleDismiss = () => {
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      onDismiss();
    });
  };

  const handleTap = () => {
    if (onTap) {
      onTap();
    }
    handleDismiss();
  };

  if (!isVisible || !notification) {
    console.log('🚫 NotificationBanner not rendering:', { isVisible, hasNotification: !!notification });
    return null;
  }

  console.log('✅ NotificationBanner rendering:', notification.title);
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.notification}
        onPress={handleTap}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="notifications" size={24} color="#fff" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Below status bar with more padding
    left: 16,
    right: 16,
    zIndex: 99999, // Higher z-index
  },
  notification: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12, // Higher elevation for Android
    borderWidth: 1,
    borderColor: '#374151',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 18,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
});
