import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../lib/auth';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { token, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/(auth)/sign-in');
    }
  }, [token, isLoading]);

  if (isLoading) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#f8f6f1',
          borderTopColor: '#e8e4dc',
          paddingBottom: 4,
        },
        tabBarActiveTintColor: '#2d6a4f',
        tabBarInactiveTintColor: '#7a6652',
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
        },
        headerStyle: { backgroundColor: '#f8f6f1' },
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          color: '#1b4332',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Add Bench',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
