import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useChat } from '@/lib/store';
import { authApi, messagesApi } from '@/lib/api';

export default function RootLayout() {
  const { restore, token, setAuth } = useAuth();
  const { connectSocket, disconnectSocket } = useChat();

  useEffect(() => {
    restore();
  }, [restore]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await authApi.me();
        setAuth(token, data.user, data.agent);
        connectSocket(token);
        const cd = await messagesApi.conversations();
        useChat.getState().setConversations(cd.conversations || []);
      } catch {
        // token invalid
      }
    })();
  }, [token, setAuth, connectSocket]);

  useEffect(() => {
    if (!token) disconnectSocket();
  }, [token, disconnectSocket]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="listing/[id]" options={{ headerShown: true, title: 'Listing' }} />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="agent" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}