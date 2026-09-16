import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Avatar } from '@/components/ui';
import { useChat } from '@/lib/store';
import { messagesApi } from '@/lib/api';
import { Colors, Spacing, Radius } from '@/constants/theme';

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function ChatListScreen() {
  const router = useRouter();
  const { conversations, setConversations } = useChat();

  useEffect(() => {
    messagesApi.conversations().then((d) => setConversations(d.conversations || [])).catch(console.error);
  }, []);

  return (
    <Screen scroll={false}>
      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/chat/${item.id}`)}
            style={styles.row}
          >
            <Avatar name={item.peer.name} src={item.peer.avatar} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '600', color: Colors.light.text, fontSize: 14, flex: 1 }} numberOfLines={1}>{item.peer.name}</Text>
                <Text style={{ color: Colors.light.textMuted, fontSize: 11 }}>{item.last_message ? timeAgo(item.last_message.created_at) : ''}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                <Text style={{ color: Colors.light.textSoft, fontSize: 12, flex: 1 }} numberOfLines={1}>
                  {item.last_message?.type === 'system' ? '📋 ' : ''}
                  {item.last_message?.content || 'No messages yet'}
                </Text>
                {Number(item.unread_count) > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={{ color: Colors.light.white, fontSize: 11, fontWeight: '600' }}>{item.unread_count}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: Colors.light.textMuted }}>Conversation is empty.{'\n'}Tap "Message Agent" on a listing to start chatting.</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: Spacing.md, borderRadius: Radius.md },
  unreadBadge: { backgroundColor: Colors.light.primary, borderRadius: 12, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
});