import {
  delay,
  loginLocal,
  signupStudentLocal,
  signupAgentLocal,
  updateUserLocal,
  changePasswordLocal,
  getCurrentUser,
  getCurrentAgent,
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
  conversationsLocal,
  startConversationLocal,
  messagesLocal,
  sendMessageLocal,
  bookingInviteLocal,
  allAgentsLocal,
  reviewAgentLocal,
  moderateListingLocal,
  adminBookingsLocal,
  adminTransactionsLocal,
  adminUsersLocal,
  adminAdminsLocal,
} from './mock';

export const API_MODE = 'mock';

const resolve = async <T>(value: T): Promise<T> => {
  await delay(220);
  return value;
};

// Auth
export const authApi = {
  signupStudent: (d: any) => resolve({ ...signupStudentLocal(d), agent: null }),
  signupAgent: (d: any) => resolve(signupAgentLocal(d)),
  login: (d: { email: string; password: string }) => {
    const r = loginLocal(d.email, d.password);
    if (!r) throw Object.assign(new Error('Invalid credentials'), { response: { data: { error: 'Invalid email or password' } } });
    return resolve(r);
  },
  me: () => {
    const user = getCurrentUser();
    if (!user) throw Object.assign(new Error('Not authenticated'), { response: { status: 401 } });
    const agent = getCurrentAgent();
    const { password: _pw, ...safeUser } = user;
    return resolve({ user: safeUser, agent });
  },
  updateProfile: (d: any) => {
    const user = getCurrentUser();
    if (!user) throw Object.assign(new Error('Not authenticated'), { response: { status: 401 } });
    return resolve(updateUserLocal(user.id, d));
  },
  changePassword: (d: any) => {
    const user = getCurrentUser();
    if (!user) throw Object.assign(new Error('Not authenticated'), { response: { status: 401 } });
    if (!changePasswordLocal(user.id, d.current_password, d.new_password))
      throw Object.assign(new Error('Current password is incorrect'), { response: { data: { error: 'Current password is incorrect' } } });
    return resolve({ success: true });
  },
  forgotPassword: (d: any) => resolve({ message: 'Reset link sent' }),
  resetPassword: (d: any) => resolve({ message: 'Password reset' }),
};

// Listings
export const listingsApi = {
  list: (params?: Record<string, string>) => resolve({ listings: listListingsLocal(params) }),
  get: (id: string) => {
    const listing = getListingLocal(id);
    if (!listing) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return resolve({ listing });
  },
  create: (d: any) => resolve({ listing: createListingLocal(d) }),
  update: (id: string, d: any) => resolve({ listing: updateListingLocal(id, d) }),
  remove: (id: string) => {
    removeListingLocal(id);
    return resolve({ success: true });
  },
  save: (id: string) => {
    saveListingLocal(id);
    return resolve({ saved: true });
  },
  unsave: (id: string) => {
    unsaveListingLocal(id);
    return resolve({ saved: false });
  },
  saved: () => resolve({ listings: savedListingsLocal() }),
};

// Bookings
export const bookingsApi = {
  create: (d: any) => {
    const booking = createBookingLocal(d);
    if (!booking) throw Object.assign(new Error('Listing not found'), { response: { status: 404 } });
    return resolve({ booking });
  },
  my: () => resolve({ bookings: myBookingsLocal() }),
  agent: () => resolve({ bookings: agentBookingsLocal() }),
  get: (id: string) => {
    const b = myBookingsLocal().find((x) => x.id === id) ?? agentBookingsLocal().find((x) => x.id === id);
    if (!b) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return resolve({ booking: b });
  },
  confirm: (id: string) => resolve({ booking: setBookingStatusLocal(id, 'confirmed') }),
  moveIn: (id: string) => resolve({ booking: setBookingStatusLocal(id, 'active') }),
  dispute: (id: string, reason: string) => resolve({ booking: setBookingStatusLocal(id, 'disputed') }),
  cancel: (id: string) => resolve({ booking: setBookingStatusLocal(id, 'cancelled') }),
};

// Payments
export const paymentsApi = {
  initialize: (booking_id: string) => {
    setBookingStatusLocal(booking_id, 'pending_payment');
    return resolve({
      authorization_url: `https://checkout.paystack.com/mock/${booking_id}`,
      reference: `DEMO-${booking_id}`,
    });
  },
  status: (bookingId: string) => {
    const b = myBookingsLocal().find((x) => x.id === bookingId) ?? agentBookingsLocal().find((x) => x.id === bookingId);
    return resolve({ status: b?.status ?? 'unknown' });
  },
};

// Messages
export const messagesApi = {
  conversations: () => resolve({ conversations: conversationsLocal() }),
  start: (listing_id: string) => {
    const conversation = startConversationLocal(listing_id);
    if (!conversation) throw Object.assign(new Error('Could not start conversation'), { response: { status: 400 } });
    return resolve({ conversation });
  },
  list: (conversationId: string) => resolve({ messages: messagesLocal(conversationId) }),
  send: (d: { conversation_id: string; content: string; type?: string; meta?: any }) => {
    const message = sendMessageLocal(d.conversation_id, d.content);
    return resolve({ message });
  },
  bookingInvite: (d: { conversation_id: string; booking_id: string }) => {
    bookingInviteLocal(d.conversation_id, d.booking_id);
    return resolve({ success: true });
  },
};

// Admin
export const adminApi = {
  pendingAgents: () => resolve({ agents: allAgentsLocal().filter((a) => a.status === 'pending') }),
  allAgents: () => resolve({ agents: allAgentsLocal() }),
  reviewAgent: (id: string, action: string, note?: string) => {
    reviewAgentLocal(id, action, note);
    return resolve({ success: true });
  },
  allListings: () => resolve({ listings: listListingsLocal() }),
  moderateListing: (id: string, action: string) => {
    moderateListingLocal(id, action);
    return resolve({ success: true });
  },
  bookings: () => resolve({ bookings: adminBookingsLocal() }),
  transactions: () => resolve(adminTransactionsLocal()),
  users: (role?: string) => resolve({ users: adminUsersLocal(role) }),
  admins: () => resolve({ admins: adminAdminsLocal() }),
};