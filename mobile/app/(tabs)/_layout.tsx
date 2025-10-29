import { Tabs } from 'expo-router';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { TokenStorage } from '../../lib/storage';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

function MessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let intervalId: NodeJS.Timeout;

    const fetchUnreadCount = async () => {
      try {
        let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
        if (!token) {
          token = (await TokenStorage.getAccessToken()) || undefined;
        }
        if (!token) return;

        // Get client info first
        const meRes = await fetch(`${API}/mobile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const meData = await meRes.json();
        if (!meRes.ok || !meData.client) return;

        const trainerId = meData.client.trainerId;
        const clientId = meData.client.id;

        if (!trainerId || !clientId) return;

        // Get unread count for this client
        const res = await fetch(`${API}/api/messages/unread-count-client?trainerId=${trainerId}&clientId=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok && !cancelled) {
          const data = await res.json();
          setUnreadCount(Number(data.unread || 0));
        }
      } catch (e) {
        // Silent fail
      }
    };

    fetchUnreadCount();
    intervalId = setInterval(fetchUnreadCount, 5000); // Poll every 5 seconds

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      {unreadCount > 0 && <View style={styles.dot} />}
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111827',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          height: Math.max(60, (Platform.OS === 'ios' ? 56 : 56) + insets.bottom),
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
          paddingHorizontal: 8,
          borderTopWidth: 0.5,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        },
        tabBarItemStyle: { paddingVertical: 4, marginHorizontal: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition-outline" color={color} size={size ?? 22} />,
        }}
      />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color, size, focused }) => (
                <View style={{ position: 'relative' }}>
                  <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} color={color} size={size ?? 22} />
                  <MessagesBadge />
                </View>
              ),
            }}
          />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size ?? 22} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});


