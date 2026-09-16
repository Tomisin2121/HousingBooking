import { create } from 'zustand';
import { bus, type MockSocket } from './mock';
import type { User, Agent, Listing, Conversation, Message, Booking } from './types';

interface AuthState {
  token: string | null;
  user: User | null;
  agent: Agent | null;
  setAuth: (token: string, user: User, agent?: Agent | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  agent: null,
  setAuth: (token, user, agent = null) => {
    localStorage.setItem('token', token);
    set({ token, user, agent });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, agent: null });
  },
}));

interface FeedState {
  listings: Listing[];
  selectedId: string | null;
  loading: boolean;
  filters: { region: string; max_price: string; room_type: string; available: string };
  setListings: (l: Listing[]) => void;
  select: (id: string | null) => void;
  setLoading: (v: boolean) => void;
  setFilter: (k: string, v: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  listings: [],
  selectedId: null,
  loading: false,
  filters: { region: 'all', max_price: '', room_type: 'all', available: 'true' },
  setListings: (listings) => set({ listings }),
  select: (selectedId) => set({ selectedId }),
  setLoading: (loading) => set({ loading }),
  setFilter: (k, v) => set((s) => ({ filters: { ...s.filters, [k]: v } })),
}));

interface ChatState {
  conversations: Conversation[];
  activeConvId: string | null;
  messages: Message[];
  socket: MockSocket | null;
  connected: boolean;
  setConversations: (c: Conversation[]) => void;
  selectConversation: (id: string | null) => void;
  setMessages: (m: Message[]) => void;
  addMessage: (conversationId: string, msg: Message) => void;
  connectSocket: (token: string) => void;
  disconnectSocket: () => void;
  incrementUnread: (conversationId: string) => void;
  markRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConvId: null,
  messages: [],
  socket: null,
  connected: false,
  setConversations: (conversations) => set({ conversations }),
  selectConversation: (activeConvId) => {
    set({ activeConvId, messages: [] });
    if (activeConvId) {
      get().socket?.emit('join_conversation', activeConvId);
    }
  },
  setMessages: (messages) => set({ messages }),
  addMessage: (conversationId, msg) => {
    const state = get();
    const update: Partial<ChatState> = {};
    // if viewing this conversation, add to messages array
    if (conversationId === state.activeConvId) {
      update.messages = [...state.messages, msg];
    }
    // update conversation's last_message and move to top
    update.conversations = state.conversations.map((c) =>
      c.id === conversationId
        ? { ...c, last_message: { content: msg.content, type: msg.type, created_at: msg.created_at, sender_id: msg.sender_id }, unread_count: msg.sender_id === useAuthStore.getState().user?.id ? c.unread_count : Number(c.unread_count) + 1 }
        : c
    );
    // sort: most recent first
    update.conversations = (update.conversations || state.conversations).sort(
      (a, b) => new Date(b.last_message_at || b.last_message?.created_at || 0).getTime() - new Date(a.last_message_at || a.last_message?.created_at || 0).getTime()
    );
    set(update as any);
  },
  connectSocket: (token) => {
    bus.on('new_message', ({ conversation_id, message }) => {
      get().addMessage(conversation_id, message);
    });
    bus.on('booking_update', () => {});
    bus.on('messages_read', () => {});
    bus.emit('connect', { token });
    set({ socket: bus, connected: true });
  },
  disconnectSocket: () => {
    bus.disconnect();
    set({ socket: null, connected: false });
  },
  incrementUnread: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: Number(c.unread_count) + 1 } : c
      ),
    })),
  markRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),
}));

interface BookingState {
  bookings: Booking[];
  agentBookings: Booking[];
  setBookings: (b: Booking[]) => void;
  setAgentBookings: (b: Booking[]) => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  agentBookings: [],
  setBookings: (bookings) => set({ bookings }),
  setAgentBookings: (agentBookings) => set({ agentBookings }),
}));

interface UIState {
  activeTab: 'feed' | 'map' | 'chat' | 'profile';
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  setActiveTab: (t: UIState['activeTab']) => void;
  toggleSidebar: () => void;
  setRightPanel: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTab: 'feed',
  sidebarOpen: true,
  rightPanelOpen: false,
  setActiveTab: (activeTab) => set({ activeTab, rightPanelOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setRightPanel: (v) => set({ rightPanelOpen: v }),
}));