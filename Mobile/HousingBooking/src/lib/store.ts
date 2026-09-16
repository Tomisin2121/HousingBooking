import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from './api';
import type { User, Agent, Conversation, Message, Booking, Listing } from './types';
import { bus, hydrateMock, setCurrentUserId, getCurrentUser, getCurrentAgent } from './mock';
import type { MockSocket } from './mock';

function parseUserId(token: string): string | null {
  return token.startsWith('demo-token-') ? token.slice('demo-token-'.length) : null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  agent: Agent | null;
  loading: boolean;
  restore: () => Promise<void>;
  setAuth: (token: string, user: User, agent?: Agent | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  agent: null,
  loading: true,
  restore: async () => {
    await hydrateMock();
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    let user: User | null = null;
    let agent: Agent | null = null;
    if (token) {
      const id = parseUserId(token);
      if (id) {
        setCurrentUserId(id);
        const me = getCurrentUser();
        if (me) {
          const { password: _pw, ...safe } = me;
          user = safe;
        }
        agent = getCurrentAgent();
      }
    }
    set({ token, user, agent, loading: false });
  },
  setAuth: (token, user, agent = null) => {
    AsyncStorage.setItem(TOKEN_KEY, token);
    const id = parseUserId(token);
    if (id) setCurrentUserId(id);
    set({ token, user, agent });
  },
  logout: () => {
    AsyncStorage.removeItem(TOKEN_KEY);
    setCurrentUserId(null);
    set({ token: null, user: null, agent: null });
  },
}));

interface ChatState {
  conversations: Conversation[];
  socket: MockSocket | null;
  setConversations: (c: Conversation[]) => void;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  addMessage: (conversationId: string, msg: Message) => void;
  markRead: (conversationId: string) => void;
}

let newMessageHandler: ((data: any) => void) | null = null;

export const useChat = create<ChatState>((set, get) => ({
  conversations: [],
  socket: null,
  setConversations: (conversations) => set({ conversations }),
  connectSocket: (token) => {
    const id = parseUserId(token);
    if (id) setCurrentUserId(id);
    const state = get();
    if (state.socket) return;
    newMessageHandler = ({ conversation_id, message }: { conversation_id: string; message: Message }) =>
      get().addMessage(conversation_id, message);
    bus.on('new_message', newMessageHandler);
    set({ socket: bus });
  },
  disconnectSocket: () => {
    if (newMessageHandler) {
      bus.off('new_message', newMessageHandler);
      newMessageHandler = null;
    }
    set({ socket: null });
  },
  addMessage: (conversationId, msg) => {
    const state = get();
    set({
      conversations: state.conversations
        .map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message: { content: msg.content, type: msg.type, created_at: msg.created_at, sender_id: msg.sender_id },
                unread_count: msg.sender_id === useAuth.getState().user?.id ? c.unread_count : Number(c.unread_count) + 1,
                last_message_at: msg.created_at,
              }
            : c
        )
        .sort(
          (a, b) =>
            new Date(b.last_message_at || b.last_message?.created_at || 0).getTime() -
            new Date(a.last_message_at || a.last_message?.created_at || 0).getTime()
        ),
    });
  },
  markRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
    })),
}));

interface FeedState {
  listings: Listing[];
  filters: { region: string; room_type: string; max_price: string; available: string };
  setListings: (l: Listing[]) => void;
  setFilter: (k: string, v: string) => void;
}

export const useFeed = create<FeedState>((set) => ({
  listings: [],
  filters: { region: 'all', room_type: 'all', max_price: '', available: 'true' },
  setListings: (listings) => set({ listings }),
  setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v } })),
}));

interface BookingState {
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
}

export const useBookings = create<BookingState>((set) => ({
  bookings: [],
  setBookings: (bookings) => set({ bookings }),
}));