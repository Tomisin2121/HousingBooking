import { useEffect, useState, useRef } from 'react';
import { Send, ArrowLeft, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { useChatStore, useAuthStore } from '../../store';
import { messagesApi } from '../../api';
import { Avatar, Badge } from '../../components/ui';
import type { Conversation, Message } from '../../types';

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

// ─── Conversation List (left sidebar) ────────────────────────────────────────
export function ConversationList() {
  const { conversations, activeConvId, selectConversation } = useChatStore();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    !search || c.peer.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.listing_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-line">
        <h2 className="font-bold text-lg">Chats</h2>
      </div>
      <div className="px-3 py-2 border-b border-line">
        <input
          className="w-full border border-line rounded-lg px-3 py-2 text-sm placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center text-sm text-ink-soft py-8">No conversations yet</div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full px-4 py-3 flex gap-3 hover:bg-surf transition-colors text-left
                ${activeConvId === c.id ? 'bg-primary-light border-l-3 border-primary' : 'border-l-3 border-transparent'}`}
            >
              <Avatar name={c.peer.name} src={c.peer.avatar} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm truncate">{c.peer.name}</span>
                  <span className="text-xs text-ink-soft shrink-0">
                    {c.last_message?.created_at ? timeAgo(c.last_message.created_at) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-ink-soft truncate max-w-[180px]">
                    {c.last_message?.type === 'system' ? '📋 ' : ''}
                    {c.last_message?.content || 'No messages yet'}
                  </p>
                  {Number(c.unread_count) > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Chat View (right panel) ──────────────────────────────────────────────────
export function ChatView() {
  const { activeConvId, messages, conversations, socket } = useChatStore();
  const { user } = useAuthStore();
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);

  const conversation = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    if (!activeConvId) return;
    useChatStore.getState().setMessages([]);
    messagesApi.list(activeConvId).then((d) => useChatStore.getState().setMessages(d.messages));
    useChatStore.getState().markRead(activeConvId);
  }, [activeConvId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeConvId) return;
    const content = input.trim();
    setInput('');
    socket?.emit('typing', { conversationId: activeConvId, isTyping: false });
    setTyping(false);
    try {
      await messagesApi.send({ conversation_id: activeConvId, content });
    } catch (err) {
      console.error('Send failed');
    }
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (!typing && activeConvId) {
      socket?.emit('typing', { conversationId: activeConvId, isTyping: true });
      setTyping(true);
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit('typing', { conversationId: activeConvId, isTyping: false });
      setTyping(false);
    }, 1500);
  };

  if (!activeConvId || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-ink-soft">
        <div className="text-center">
          <MessageCircle size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-line flex items-center gap-3 bg-white">
        <button
          className="lg:hidden text-ink-soft"
          onClick={() => useChatStore.getState().selectConversation(null)}
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar name={conversation.peer.name} src={conversation.peer.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{conversation.peer.name}</span>
            {conversation.peer.verified && <Badge variant="green">✓</Badge>}
          </div>
          <p className="text-xs text-ink-soft truncate">{conversation.listing_name}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 bg-[#e5ddd5]">
        <div className="space-y-1.5">
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === user?.id;
            const isSystem = msg.type === 'system';
            const isInvite = msg.type === 'booking_invite';

            if (isSystem || isInvite) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-white/80 px-4 py-1.5 rounded-lg text-xs text-ink-soft shadow-sm">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-xl text-sm shadow-sm
                    ${isMe ? 'bg-[#dcf8c6]' : 'bg-white'}
                    ${messages[i + 1]?.sender_id === msg.sender_id ? 'rounded-t-md' : ''}
                    ${messages[i - 1]?.sender_id !== msg.sender_id ? 'rounded-t-md' : ''}
                  `}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : ''}`}>
                    <span className="text-[10px] text-ink-soft/70">
                      {new Date(msg.created_at).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      msg.read_at ? <CheckCheck size={13} className="text-blue-500" /> : <Check size={13} className="text-ink-soft/50" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-line bg-white flex items-center gap-3">
        <button className="text-ink-soft hover:text-ink"><ImageIcon size={20} /></button>
        <input
          className="flex-1 border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-primary-dark transition-all"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

function MessageCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className || ''}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/>
    </svg>
  );
}