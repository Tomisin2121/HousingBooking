import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Agent } from './types';
import {
  delay,
  loginLocal,
  signupStudentLocal,
  signupAgentLocal,
  getCurrentUser,
  getCurrentAgent,
  setCurrentUserId,
  updateUserLocal,
  changePasswordLocal,
  listListingsLocal,
  getListingLocal,
  createListingLocal,
  updateListingLocal,
  removeListingLocal,
  saveListingLocal,
  unsaveListingLocal,
  savedListingsLocal,
  createBookingLocal,
  myBookingsLocal,
  agentBookingsLocal,
  setBookingStatusLocal,
  allBookingsLocal,
  conversationsLocal,
  startConversationLocal,
  messagesLocal,
  sendMessageLocal,
  bookingInviteLocal,
  allAgentsLocal,
  reviewAgentLocal,
  deleteAgentLocal,
} from './mock';

export const TOKEN_KEY = 'hb_token';

export const storeToken = (token: string) => AsyncStorage.setItem(TOKEN_KEY, token);
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const clearToken = () => AsyncStorage.removeItem(TOKEN_KEY);

function fail(message: string, status = 400): never {
  const err: any = new Error(message);
  err.response = { status, data: { error: message } };
  throw err;
}

function strip(user: User & { password?: string }): User {
  const { password: _pw, ...safe } = user;
  return safe;
}

async function currentUser(): Promise<(User & { password?: string }) | null> {
  const token = await getToken();
  if (token?.startsWith('demo-token-')) {
    setCurrentUserId(token.slice('demo-token-'.length));
  }
  return getCurrentUser();
}

export const authApi = {
  async signupStudent(d: any) {
    await delay();
    return signupStudentLocal(d);
  },
  async signupAgent(d: any) {
    await delay();
    return signupAgentLocal(d);
  },
  async login(d: { email: string; password: string }) {
    await delay();
    const res = loginLocal(d.email, d.password);
    if (!res) fail('Invalid email or password', 400);
    return res;
  },
  async me() {
    await delay(100);
    const me = await currentUser();
    if (!me) fail('Not authenticated', 401);
    const agent = getCurrentAgent();
    return { user: strip(me), agent };
  },
  async updateProfile(d: any) {
    await delay();
    const me = await currentUser();
    if (!me) fail('Not authenticated', 401);
    Object.assign(me, d);
    updateUserLocal(me.id, d);
    return { user: strip(me) };
  },
  async changePassword(d: { current: string; next: string }) {
    await delay();
    const me = await currentUser();
    if (!me) fail('Not authenticated', 401);
    const ok = changePasswordLocal(me.id, d.current, d.next);
    if (!ok) fail('Current password is incorrect', 400);
    return { success: true };
  },
};

export const listingsApi = {
  async list(params?: Record<string, string>) {
    await delay();
    await currentUser();
    return { listings: listListingsLocal(params ?? {}) };
  },
  async get(id: string) {
    await delay();
    await currentUser();
    const listing = getListingLocal(id);
    if (!listing) fail('Listing not found', 404);
    return { listing };
  },
  async create(d: any) {
    await delay();
    const listing = createListingLocal(d);
    return { listing };
  },
  async update(id: string, d: any) {
    await delay();
    const listing = updateListingLocal(id, d);
    if (!listing) fail('Listing not found', 404);
    return { listing };
  },
  async remove(id: string) {
    await delay();
    removeListingLocal(id);
    return { success: true };
  },
  async save(id: string) {
    await delay();
    await currentUser();
    saveListingLocal(id);
    return { success: true };
  },
  async unsave(id: string) {
    await delay();
    await currentUser();
    unsaveListingLocal(id);
    return { success: true };
  },
  async saved() {
    await delay();
    await currentUser();
    return { listings: savedListingsLocal() };
  },
};

export const bookingsApi = {
  async create(d: { listing_id: string; room_type: any; move_in_date: string }) {
    await delay();
    const booking = createBookingLocal(d as any);
    if (!booking) fail('Listing not found', 404);
    return { booking };
  },
  async my() {
    await delay();
    await currentUser();
    return { bookings: myBookingsLocal() };
  },
  async agent() {
    await delay();
    await currentUser();
    return { bookings: agentBookingsLocal() };
  },
  async confirm(id: string) {
    await delay();
    const booking = setBookingStatusLocal(id, 'confirmed');
    if (!booking) fail('Booking not found', 404);
    return { booking };
  },
  async moveIn(id: string) {
    await delay();
    const booking = setBookingStatusLocal(id, 'active');
    if (!booking) fail('Booking not found', 404);
    return { booking };
  },
  async dispute(id: string, reason: string) {
    await delay();
    const booking = setBookingStatusLocal(id, 'disputed');
    if (!booking) fail('Booking not found', 404);
    return { booking };
  },
  async cancel(id: string) {
    await delay();
    const booking = setBookingStatusLocal(id, 'cancelled');
    if (!booking) fail('Booking not found', 404);
    return { booking };
  },
};

export const paymentsApi = {
  async initialize(bookingId: string) {
    await delay();
    const reference = `pay_${Math.random().toString(36).slice(2, 12)}`;
    const booking = allBookingsLocal().find((b) => b.id === bookingId);
    if (!booking) fail('Booking not found', 404);
    return {
      authorization_url: `https://paystack.com/pay/${reference}`,
      reference,
      status: 'unpaid',
    };
  },
};

export const messagesApi = {
  async conversations() {
    await delay();
    await currentUser();
    return { conversations: conversationsLocal() };
  },
  async start(listingId: string) {
    await delay();
    await currentUser();
    const conversation = startConversationLocal(listingId);
    if (!conversation) fail('Could not start conversation', 400);
    return { conversation };
  },
  async list(conversationId: string) {
    await delay();
    return { messages: messagesLocal(conversationId) };
  },
  async send(d: { conversation_id: string; content: string; type?: string; meta?: any }) {
    await delay();
    const message = sendMessageLocal(d.conversation_id, d.content);
    return { message };
  },
  async bookingInvite(d: { conversation_id: string; booking_id: string }) {
    await delay();
    bookingInviteLocal(d.conversation_id, d.booking_id);
    return { success: true };
  },
};

export const adminApi = {
  async allAgents() {
    await delay();
    await currentUser();
    return { agents: allAgentsLocal() };
  },
  async reviewAgent(id: string, action: string, note?: string) {
    await delay();
    await currentUser();
    reviewAgentLocal(id, action, note);
    return { success: true };
  },
  async deleteAgent(id: string) {
    await delay();
    await currentUser();
    deleteAgentLocal(id);
    return { success: true };
  },
};