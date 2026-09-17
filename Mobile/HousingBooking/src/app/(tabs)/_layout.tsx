import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useChat } from '@/lib/store';

export default function TabsLayout() {
  const conversations = useChat((s) => s.conversations);
  const unread = conversations.reduce((n, c) => n + Number(c.unread_count || 0), 0);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textMuted,
        headerStyle: { backgroundColor: Colors.light.background },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: ({ color }) => <MaterialIcons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: ({ color }) => <MaterialIcons name="map" size={22} color={color} /> }} />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={22} color={color} />,
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: Colors.light.red, color: '#ffffff', fontSize: 10, fontWeight: '700' },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <MaterialIcons name="person" size={22} color={color} /> }} />
    </Tabs>
  );
}