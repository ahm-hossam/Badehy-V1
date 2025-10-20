import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
        name="checkins"
        options={{
          title: 'Check-ins',
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done-outline" color={color} size={size ?? 22} />,
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


