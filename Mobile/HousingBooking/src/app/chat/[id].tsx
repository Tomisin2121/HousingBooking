import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, BadgeView, Button } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { messagesApi } from '@/lib/api';
import { useChat, useAuth } from '@/lib/store';
import type { Message } from '@/lib/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { socket, conversations, markRead } = useChat();
  const conversation = conversations.find((c) => c.id === id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    messagesApi.list(id).then((d) => setMessages(d.messages || []));
    markRead(id);
    socket?.emit('join_conversation', id);

    const onMsg = ({ conversation_id, message }: { conversation_id: string; message: Message }) => {
      if (conversation_id === id) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      }
    };
    const onTyping = ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      if (conversationId === id) setTyping(isTyping);
    };
    socket?.on('new_message', onMsg);
    socket?.on('typing', onTyping);

    return () => {
      socket?.off('new_message', onMsg);
      socket?.off('typing', onTyping);
      socket?.emit('leave_conversation', id);
    };
  }, [id, socket]);

  useEffect(() => {
    if (messages.length) flatRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || !id) return;
    setInput('');
    socket?.emit('typing', { conversationId: id, isTyping: false });
    setSending(true);
    try {
      await messagesApi.send({ conversation_id: id, content });
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (val: string) => {
    setInput(val);
    socket?.emit('typing', { conversationId: id, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('typing', { conversationId: id, isTyping: false }), 1500);
  };

  const renderBubble = ({ item: msg, index }: { item: Message; index: number }) => {
    if (msg.type === 'system' || msg.type === 'booking_invite') {
      return (
        <View style={{ alignItems: 'center', marginVertical: 6 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.sm }}>
            <Text style={{ fontSize: 11, color: Colors.light.textSoft, textAlign: 'center' }}>{msg.content}</Text>
          </View>
        </View>
      );
    }
    const isMe = msg.sender_id === user?.id;
    const prev = messages[index - 1];
    const sameSender = prev?.sender_id === msg.sender_id;
    return (
      <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start', marginVertical: 1 }}>
        <View style={[
          styles.bubble,
          { backgroundColor: isMe ? Colors.light.whatsappGreen : Colors.light.white },
          sameSender ? (isMe ? styles.bubbleEndMe : styles.bubbleEndOther) : {},
        ]}>
          <Text style={{ fontSize: 14, color: Colors.light.text }}>{msg.content}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2 }}>
            <Text style={{ fontSize: 10, color: Colors.light.textMuted }}>
              {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && <MaterialIcons name={msg.read_at ? 'done-all' : 'done'} size={13} color={msg.read_at ? Colors.light.blue : Colors.light.textMuted} style={{ marginLeft: 3 }} />}
          </View>
        </View>
      </View>
    );
  };

  if (!conversation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.light.line }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: Spacing.md }}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <Avatar name={conversation.peer.name} src={conversation.peer.avatar} size="sm" />
        <View style={{ marginLeft: Spacing.md, flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: Colors.light.text, fontSize: 14 }}>{conversation.peer.name}</Text>
            {conversation.peer.verified ? <BadgeView color="green" >✓</BadgeView> : null}
          </View>
          <Text style={{ color: Colors.light.textSoft, fontSize: 11 }} numberOfLines={1}>{conversation.listing_name}</Text>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.chatBg}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderBubble}
            contentContainerStyle={{ padding: Spacing.md, flexGrow: 1, justifyContent: 'flex-end' }}
          />
          {typing && (
            <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: 4 }}>
              <Text style={{ color: Colors.light.textMuted, fontSize: 11 }}>typing...</Text>
            </View>
          )}
        </View>

        {/* Input bar */}
        <View style={[styles.inputBar, { borderTopColor: Colors.light.line }]}>
          <TextInput
            placeholder="Type a message..."
            placeholderTextColor={Colors.light.textMuted}
            value={input}
            onChangeText={handleTyping}
            multiline
            style={styles.inputField}
          />
          <TouchableOpacity onPress={sendMessage} disabled={!input.trim() || sending} style={[styles.sendBtn, { backgroundColor: Colors.light.primary }, (!input.trim() || sending) && { opacity: 0.3 }]}>
            <MaterialIcons name="send" size={16} color={Colors.light.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  chatBg: { flex: 1, backgroundColor: Colors.light.chatBg },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 2, elevation: 0 },
  bubbleEndMe: { borderTopRightRadius: 4 },
  bubbleEndOther: { borderTopLeftRadius: 4 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, borderTopWidth: 1, backgroundColor: Colors.light.background },
  inputField: { flex: 1, borderWidth: 1, borderColor: Colors.light.line, borderRadius: Radius.pill, paddingHorizontal: Spacing.md, paddingVertical: Platform.OS === 'ios' ? 10 : 8, marginRight: Spacing.md, fontSize: 14, maxHeight: 100, color: Colors.light.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});