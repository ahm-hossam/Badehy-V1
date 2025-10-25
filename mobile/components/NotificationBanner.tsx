import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🎨 NotificationBanner useEffect:', { isVisible, hasNotification: !!notification, title: notification?.title });
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
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
      timerRef.current = setTimeout(() => {
        console.log('⏰ Auto-dismissing notification banner');
        handleDismiss();
      }, 4000);
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

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isVisible, notification]);

  const handleDismiss = () => {
    console.log('🚫 Banner dismiss button pressed');
    // Clear timer if it exists
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    Animated.spring(slideAnim, {
      toValue: -100,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      console.log('🚫 Banner animation complete, calling onDismiss');
      onDismiss();
    });
  };

  const handleTap = () => {
    console.log('👆 Banner tapped');
    // Clear timer if it exists
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
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
          paddingTop: insets.top + 8, // Apply safe area insets
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

        <Pressable
          style={styles.dismissButton}
          onPress={(e) => {
            console.log('🚫 Close button pressed!');
            e.stopPropagation();
            handleDismiss();
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, // Will use paddingTop from insets
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
    padding: 12,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'transparent', // Removed background
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
