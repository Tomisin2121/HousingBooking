import type { User, Agent, Listing, Conversation, Message, Booking, Region, RoomType } from './types';

export const DEMO_CREDENTIALS = [
  { role: 'Student', email: 'student@housingbooking.app', password: 'Password123!' },
  { role: 'Agent', email: 'agent1@housingbooking.app', password: 'Password123!' },
  { role: 'Admin', email: 'supresident@student.futa.edu.ng', password: 'Password123!' },
];

interface DBUser extends User {
  password: string;
  created_at?: string;
}

interface ConvRecord {
  id: string;
  listing_id: string;
  participants: [string, string];
  unread: Record<string, number>;
  created_at: string;
}

interface DB {
  users: DBUser[];
  agents: Agent[];
  listings: Listing[];
  saved: Record<string, string[]>;
  conversations: ConvRecord[];
  messages: Record<string, Message[]>;
  bookings: Booking[];
}

const STORAGE_KEY = 'hb_mock_db_v2';

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const now = Date.now();
const iso = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

const naira = (n: number) => `₦${n.toLocaleString()}`;

function buildListing(
  id: string,
  agent: Agent,
  agentUser: User,
  p: Partial<Listing> & { name: string; region: Region; address: string; lat: number; lng: number; price: number; room_types: RoomType[] }
): Listing {
  const price = p.price;
  const platformFee = Math.round(price * 0.02);
  const caution = 5000;
  return {
    id,
    agent_id: agent.id,
    agent_record_id: agent.id,
    description: p.description ?? 'A comfortable, secure hostel close to FUTA main gate with reliable utilities and easy access to campus.',
    amenities: p.amenities ?? ['Water', '24hr Light', 'Security'],
    photos: p.photos ?? [`https://picsum.photos/seed/${id}/800/600`, `https://picsum.photos/seed/${id}b/800/600`],
    available_rooms: p.available_rooms ?? 6,
    available: p.available ?? true,
    walk_minutes: p.walk_minutes ?? 12,
    business_name: agent.business_name,
    agent_verified: agent.verified,
    agent_name: agentUser.name,
    agent_avatar: agentUser.avatar,
    price_display: `${naira(price)}/mo`,
    platform_fee: platformFee,
    caution_fee: caution,
    total_estimate: price + platformFee + caution,
    created_at: p.created_at ?? iso(0),
    ...p,
  };
}

function buildSeed(): DB {
  const student1: DBUser = {
    id: 'u_student', name: 'Tunde Adebayo', matric_no: 'FUT/2022/0012', department: 'Computer Science',
    email: 'student@housingbooking.app', role: 'student', password: 'Password123!',
  };
  const student2: DBUser = {
    id: 'u_student2', name: 'Aminat Yusuf', matric_no: 'FUT/2022/0451', department: 'Electrical Engineering',
    email: 'student2@housingbooking.app', role: 'student', password: 'Password123!',
  };

  const agent1User: DBUser = {
    id: 'u_ag1', name: 'Chinedu Okafor', email: 'agent1@housingbooking.app', role: 'agent', password: 'Password123!',
  };
  const agent2User: DBUser = {
    id: 'u_ag2', name: 'Bimbo Adeleke', email: 'agent2@housingbooking.app', role: 'agent', password: 'Password123!',
  };
  const agent3User: DBUser = {
    id: 'u_ag3', name: 'Femi Akinola', email: 'agent3@housingbooking.app', role: 'agent', password: 'Password123!',
  };

  const admin1: DBUser = {
    id: 'u_admin1', name: 'Happiness Ebuara', email: 'supresident@student.futa.edu.ng', role: 'admin', password: 'Password123!',
  };
  const admin2: DBUser = {
    id: 'u_admin2', name: 'Platform Owner', email: 'owner@housingbooking.app', role: 'admin', password: 'Password123!',
  };

  const agents: Agent[] = [
    { id: 'ag_1', user_id: 'u_ag1', business_name: 'Alpha Hostels', phone: '0803 000 0001', id_document_url: 'https://picsum.photos/seed/id1/400/300', verified: true, status: 'approved', created_at: iso(60 * 24 * 90) },
    { id: 'ag_2', user_id: 'u_ag2', business_name: 'GateView Estates', phone: '0803 000 0002', id_document_url: 'https://picsum.photos/seed/id2/400/300', verified: false, status: 'pending', created_at: iso(60 * 24 * 3) },
    { id: 'ag_3', user_id: 'u_ag3', business_name: 'Campus Comfy', phone: '0803 000 0003', id_document_url: 'https://picsum.photos/seed/id3/400/300', verified: true, status: 'approved', created_at: iso(60 * 24 * 120) },
  ];

  const listings: Listing[] = [
    buildListing('l_whitewalls', agents[0], agent1User, { name: 'White Walls Hostel', region: 'south_gate', address: 'Araromi Street, South Gate', lat: 7.3068, lng: 5.139, price: 45000, room_types: ['self_contain', '1_bedroom'], amenities: ['Water', '24hr Light', 'Security', 'Fence'], walk_minutes: 4, available_rooms: 4, created_at: iso(60 * 2) }),
    buildListing('l_lobito', agents[0], agent1User, { name: 'Lobito Lodge', region: 'south_gate', address: 'Lobito Road, South Gate', lat: 7.3061, lng: 5.1399, price: 18000, room_types: ['shared'], amenities: ['Water', 'Security'], walk_minutes: 3, available_rooms: 8, created_at: iso(60 * 24 * 6) }),
    buildListing('l_southgate', agents[0], agent1User, { name: 'Southgate Lodge', region: 'south_gate', address: '21 South Gate Road', lat: 7.3057, lng: 5.1403, price: 25000, room_types: ['shared', '1_bedroom'], amenities: ['Water', 'Security', 'Fence'], walk_minutes: 5, available_rooms: 5, created_at: iso(60 * 24) }),
    buildListing('l_easywalk', agents[0], agent1User, { name: 'Easy Walk Lodge', region: 'south_gate', address: '9 Oke Aro Close, South Gate', lat: 7.3053, lng: 5.1394, price: 40000, room_types: ['self_contain'], amenities: ['Water', '24hr Light', 'Security', 'Wi-Fi'], walk_minutes: 6, available_rooms: 3, created_at: iso(60 * 24 * 4) }),
    buildListing('l_goolf', agents[2], agent3User, { name: 'Goolf Hostel', region: 'south_gate', address: '2 Goolf Estate, South Gate', lat: 7.3049, lng: 5.1383, price: 55000, room_types: ['1_bedroom'], amenities: ['Water', '24hr Light', 'Security', 'Fence', 'Parking'], walk_minutes: 8, available_rooms: 1, created_at: iso(60 * 3) }),
    buildListing('l_emmabol', agents[0], agent1User, { name: 'EMMABOL Hostel', region: 'south_gate', address: 'EMMABOL Complex, South Gate Road', lat: 7.3055, lng: 5.1387, price: 30000, room_types: ['self_contain'], amenities: ['Water', 'Security', 'Parking'], walk_minutes: 5, available_rooms: 4, created_at: iso(60 * 24 * 9) }),
    buildListing('l_peace', agents[2], agent3User, { name: 'Peace Hostel', region: 'south_gate', address: 'Peace Avenue, South Gate', lat: 7.305, lng: 5.1396, price: 35000, room_types: ['self_contain', 'shared'], amenities: ['Water', '24hr Light', 'Security'], walk_minutes: 7, available_rooms: 6, created_at: iso(60 * 24 * 11) }),
    buildListing('l_equity', agents[0], agent1User, { name: 'Equity Hostel', region: 'south_gate', address: 'Equity Estate, South Gate', lat: 7.3047, lng: 5.1381, price: 22000, room_types: ['shared', '1_bedroom'], amenities: ['Water', 'Security', 'Fence'], walk_minutes: 9, available_rooms: 7, created_at: iso(60 * 24 * 5) }),
    buildListing('l_fedpo', agents[0], agent1User, { name: 'Fedpo Walk Hostel', region: 'west_gate', address: '3 Fedpo Road, West Gate', lat: 7.3036, lng: 5.1288, price: 60000, room_types: ['2_bedroom', '1_bedroom'], amenities: ['Water', '24hr Light', 'Security', 'Parking'], walk_minutes: 15, available_rooms: 2, created_at: iso(60 * 24 * 30) }),
    buildListing('l_alumni', agents[2], agent3User, { name: 'Alumni Lodge', region: 'west_gate', address: '5 Alumni Avenue, West Gate', lat: 7.3044, lng: 5.1302, price: 35000, room_types: ['self_contain'], amenities: ['Water', '24hr Light', 'Security', 'Fence', 'Parking'], walk_minutes: 12, available_rooms: 6, created_at: iso(60 * 24 * 8) }),
    buildListing('l_northgate', agents[2], agent3User, { name: 'Northgate Comfort', region: 'north_gate', address: '15 North Gate Road', lat: 7.313, lng: 5.1432, price: 65000, room_types: ['2_bedroom'], amenities: ['Water', '24hr Light', 'Security', 'Parking', 'Wi-Fi'], walk_minutes: 10, available_rooms: 2, created_at: iso(60 * 24 * 12) }),
    buildListing('l_futuremasters', agents[2], agent3User, { name: 'Future Masters Lodge', region: 'north_gate', address: '31 Igoba Road, North Gate', lat: 7.3152, lng: 5.1452, price: 20000, room_types: ['shared'], amenities: ['Water', 'Security'], walk_minutes: 18, available_rooms: 10, created_at: iso(60 * 24 * 2) }),
  ];

  const conversations: ConvRecord[] = [
    { id: 'conv_1', listing_id: 'l_whitewalls', participants: ['u_student', 'u_ag1'], unread: { u_student: 1 }, created_at: iso(60 * 26) },
    { id: 'conv_2', listing_id: 'l_goolf', participants: ['u_student', 'u_ag3'], unread: { u_student: 0 }, created_at: iso(60 * 50) },
    { id: 'conv_3', listing_id: 'l_lobito', participants: ['u_student', 'u_ag1'], unread: { u_student: 0 }, created_at: iso(60 * 24 * 6) },
  ];

  const msg = (id: string, convId: string, senderId: string, content: string, minsAgo: number, type: Message['type'] = 'text', extra: Partial<Message> = {}): Message => ({
    id, conversation_id: convId, sender_id: senderId, content, type, created_at: iso(minsAgo), ...extra,
  });

  const messages: Record<string, Message[]> = {
    conv_1: [
      msg('m1', 'conv_1', 'u_ag1', 'Hello! Welcome to White Walls Hostel. How can I help you?', 60 * 26),
      msg('m2', 'conv_1', 'u_student', 'Hi, is the self-contain still available?', 60 * 25),
      msg('m3', 'conv_1', 'u_ag1', 'Yes it is. ₦45,000 per month including water and constant light.', 60 * 24),
      msg('m4', 'conv_1', 'u_student', 'Great, can I come view it tomorrow morning?', 60 * 22),
      msg('m5', 'conv_1', 'u_ag1', 'Sure! I will send you a booking request. Let me know if you need directions.', 60 * 1),
    ],
    conv_2: [
      msg('n1', 'conv_2', 'u_ag3', 'Good day, Goolf Hostel is one of the best maintained in South Gate.', 60 * 50),
      msg('n2', 'conv_2', 'u_student', 'How spacious are the 1-bedrooms?', 60 * 48),
      msg('n3', 'conv_2', 'u_ag3', 'Very spacious with a separate kitchen. Rent is ₦55,000/month.', 60 * 47),
    ],
    conv_3: [
      msg('o1', 'conv_3', 'u_ag1', 'Lobito Lodge has affordable shared rooms close to the gate.', 60 * 24 * 6),
      msg('o2', 'conv_3', 'u_student', 'Do you accept part payment?', 60 * 24 * 5),
      msg('o3', 'conv_3', 'u_ag1', 'Rent is paid fully upfront for the session, I am sorry.', 60 * 24 * 5),
    ],
  };

  const bk = (
    id: string, listing: Listing, studentName: string, roomType: RoomType, status: Booking['status'],
    moveIn: string, createdMinsAgo: number
  ): Booking => ({
    id, student_id: 'u_student', listing_id: listing.id, room_type: roomType, move_in_date: moveIn, status,
    rent_amount: listing.price, platform_fee: listing.platform_fee, caution_fee: listing.caution_fee,
    total_amount: listing.total_estimate, listing_name: listing.name, region: listing.region,
    address: listing.address, photos: listing.photos, student_name: studentName,
    business_name: listing.business_name, created_at: iso(createdMinsAgo),
  });

  const bookings: Booking[] = [
    bk('bk_1', listings[0], 'Tunde Adebayo', 'self_contain', 'paid', '2026-10-02', 60 * 24 * 3),
    bk('bk_2', listings[5], 'Tunde Adebayo', '1_bedroom', 'active', '2026-09-01', 60 * 24 * 20),
    bk('bk_3', listings[3], 'Tunde Adebayo', 'shared', 'pending_payment', '2026-10-15', 60),
    bk('bk_4', listings[1], 'Tunde Adebayo', 'shared', 'completed', '2026-04-12', 60 * 24 * 60),
  ];

  return {
    users: [student1, student2, agent1User, agent2User, agent3User, admin1, admin2],
    agents,
    listings,
    saved: { u_student: ['l_whitewalls', 'l_easywalk'] },
    conversations,
    messages,
    bookings,
  };
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch { /* ignore */ }
  const db = buildSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}

const db: DB = loadDB();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch { /* ignore */ }
}

export function userIdFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const m = token.match(/^demo-token-(.+)$/);
  return m ? m[1] : null;
}

export function getCurrentUser(): DBUser | null {
  const id = userIdFromToken();
  return id ? db.users.find((u) => u.id === id) ?? null : null;
}

export function getCurrentAgent(): Agent | null {
  const u = getCurrentUser();
  if (u?.role !== 'agent') return null;
  return db.agents.find((a) => a.user_id === u.id) ?? null;
}

function makeToken(userId: string) {
  return `demo-token-${userId}`;
}

export function loginLocal(email: string, password: string): { token: string; user: User; agent: Agent | null } | null {
  if (password !== 'Password123!') return null;
  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: `u_${Math.random().toString(36).slice(2, 9)}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      role: 'student',
      password: 'Password123!',
    };
    db.users.push(user);
    persist();
  }
  const agent = db.agents.find((a) => a.user_id === user!.id) ?? null;
  const { password: _pw, ...safeUser } = user;
  return { token: makeToken(user.id), user: safeUser, agent };
}

export function signupStudentLocal(data: { name: string; email: string; password: string; matric_no?: string; department?: string }) {
  const user: DBUser = {
    id: `u_${Math.random().toString(36).slice(2, 9)}`,
    name: data.name, email: data.email, password: data.password || 'Password123!',
    role: 'student', matric_no: data.matric_no, department: data.department,
  };
  db.users.push(user);
  persist();
  const { password: _pw, ...safeUser } = user;
  return { token: makeToken(user.id), user: safeUser };
}

export function signupAgentLocal(data: { name: string; email: string; password: string; business_name: string; phone: string; id_document_url: string }) {
  const user: DBUser = {
    id: `u_${Math.random().toString(36).slice(2, 9)}`,
    name: data.name, email: data.email, password: data.password || 'Password123!', role: 'agent',
  };
  const agent: Agent = {
    id: `ag_${Math.random().toString(36).slice(2, 9)}`,
    user_id: user.id, business_name: data.business_name, phone: data.phone,
    id_document_url: data.id_document_url, verified: false, status: 'pending', created_at: iso(0),
  };
  db.users.push(user);
  db.agents.push(agent);
  persist();
  const { password: _pw, ...safeUser } = user;
  return { token: makeToken(user.id), user: safeUser, agent };
}

export function updateUserLocal(id: string, patch: Partial<DBUser>) {
  const u = db.users.find((x) => x.id === id);
  if (u) Object.assign(u, patch);
  persist();
  const { password: _pw, ...safeUser } = u!;
  return { user: safeUser };
}

export function changePasswordLocal(id: string, current: string, next: string): boolean {
  const u = db.users.find((x) => x.id === id);
  if (!u || u.password !== current) return false;
  u.password = next;
  persist();
  return true;
}

export function listListingsLocal(params: Record<string, string> = {}): Listing[] {
  const agent = getCurrentAgent();
  let out = db.listings;
  if (agent) out = out.filter((l) => l.agent_record_id === agent.id);
  if (params.region && params.region !== 'all') out = out.filter((l) => l.region === params.region);
  if (params.room_type && params.room_type !== 'all') out = out.filter((l) => l.room_types.includes(params.room_type as RoomType));
  if (params.max_price) out = out.filter((l) => l.price <= Number(params.max_price));
  if (params.available !== 'false' && params.available !== 'all') out = out.filter((l) => l.available);
  const me = getCurrentUser();
  const savedIds = me ? db.saved[me.id] ?? [] : [];
  return out.map((l) => ({ ...l, is_saved: savedIds.includes(l.id) }));
}

export function getListingLocal(id: string): Listing | null {
  const l = db.listings.find((x) => x.id === id);
  if (!l) return null;
  const me = getCurrentUser();
  const savedIds = me ? db.saved[me.id] ?? [] : [];
  return { ...l, is_saved: savedIds.includes(id) };
}

export function createListingLocal(data: any): Listing {
  const agent = getCurrentAgent()!;
  const agentUser = db.users.find((u) => u.id === agent.user_id)!;
  const listing = buildListing(`l_${Math.random().toString(36).slice(2, 9)}`, agent, agentUser, {
    name: data.name, region: data.region, address: data.address, price: Number(data.price),
    room_types: data.room_types ?? ['shared'], description: data.description,
    amenities: data.amenities ?? [], photos: data.photos?.length ? data.photos : [`https://picsum.photos/seed/${data.name.replace(/\s/g, '')}/800/600`],
    available_rooms: Number(data.available_rooms ?? 1), lat: data.lat, lng: data.lng,
    walk_minutes: data.walk_minutes ? Number(data.walk_minutes) : undefined,
    available: data.available ?? true,
  });
  db.listings.unshift(listing);
  persist();
  return listing;
}

export function updateListingLocal(id: string, data: any): Listing | null {
  const l = db.listings.find((x) => x.id === id);
  if (!l) return null;
  Object.assign(l, data);
  if (data.price != null) {
    const price = Number(data.price);
    l.price = price;
    l.platform_fee = Math.round(price * 0.02);
    l.total_estimate = price + l.platform_fee + l.caution_fee;
    l.price_display = `${naira(price)}/mo`;
  }
  persist();
  return l;
}

export function removeListingLocal(id: string) {
  db.listings = db.listings.filter((l) => l.id !== id);
  persist();
}

function toggleSave(id: string, on: boolean) {
  const me = getCurrentUser();
  if (!me) return;
  const set = new Set(db.saved[me.id] ?? []);
  if (on) set.add(id); else set.delete(id);
  db.saved[me.id] = Array.from(set);
  persist();
}

export function saveListingLocal(id: string) { toggleSave(id, true); }
export function unsaveListingLocal(id: string) { toggleSave(id, false); }

export function savedListingsLocal(): Listing[] {
  const me = getCurrentUser();
  if (!me) return [];
  const ids = db.saved[me.id] ?? [];
  return db.listings.filter((l) => ids.includes(l.id));
}

function computeBooking(listing: Listing, roomType: RoomType, moveIn: string): Booking {
  const me = getCurrentUser()!;
  return {
    id: `bk_${Math.random().toString(36).slice(2, 9)}`,
    student_id: me.id,
    listing_id: listing.id,
    room_type: roomType,
    move_in_date: moveIn,
    status: 'pending_payment',
    rent_amount: listing.price,
    platform_fee: listing.platform_fee,
    caution_fee: listing.caution_fee,
    total_amount: listing.total_estimate,
    listing_name: listing.name,
    region: listing.region,
    address: listing.address,
    photos: listing.photos,
    student_name: me.name,
    business_name: listing.business_name,
    created_at: iso(0),
  };
}

export function createBookingLocal(data: { listing_id: string; room_type: RoomType; move_in_date: string }): Booking | null {
  const listing = db.listings.find((l) => l.id === data.listing_id);
  if (!listing) return null;
  const booking = computeBooking(listing, data.room_type, data.move_in_date);
  db.bookings.unshift(booking);
  persist();
  inlineUserMsg(listing.agent_id, `👋 I just requested a booking for ${listing.name} (${data.room_type.replace('_', ' ')}).`)
  return booking;
}

export function myBookingsLocal(): Booking[] {
  const me = getCurrentUser();
  if (!me) return [];
  return db.bookings.filter((b) => b.student_id === me.id).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function agentBookingsLocal(): Booking[] {
  const agent = getCurrentAgent();
  if (!agent) return [];
  const ids = db.listings.filter((l) => l.agent_record_id === agent.id).map((l) => l.id);
  return db.bookings.filter((b) => ids.includes(b.listing_id)).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
}

export function setBookingStatusLocal(id: string, status: Booking['status']) {
  const b = db.bookings.find((x) => x.id === id);
  if (b) b.status = status;
  persist();
  return b;
}

// ─── Conversations / Messages ────────────────────────────────────────────────

export function conversationsLocal(): Conversation[] {
  const me = getCurrentUser();
  if (!me) return [];
  const out: Conversation[] = [];
  for (const c of db.conversations) {
    if (!c.participants.includes(me.id)) continue;
    const peerId = c.participants.find((p) => p !== me.id)!;
    const peerUser = db.users.find((u) => u.id === peerId);
    if (!peerUser) continue;
    const peerAgent = db.agents.find((a) => a.user_id === peerId) ?? null;
    const listing = db.listings.find((l) => l.id === c.listing_id);
    const msgs = db.messages[c.id] ?? [];
    const last = msgs[msgs.length - 1];
    out.push({
      id: c.id,
      listing_id: c.listing_id,
      listing_name: listing?.name ?? 'Listing',
      peer: {
        id: peerUser.id,
        name: peerUser.name,
        avatar: peerUser.avatar,
        business_name: peerAgent?.business_name,
        verified: peerAgent?.verified,
      },
      last_message: last ? { content: last.content, type: last.type, created_at: last.created_at, sender_id: last.sender_id } : undefined,
      unread_count: c.unread[me.id] ?? 0,
      last_message_at: last?.created_at,
    });
  }
  return out.sort((a, b) => +new Date(b.last_message_at || 0) - +new Date(a.last_message_at || 0));
}

export function startConversationLocal(listingId: string): Conversation | null {
  const me = getCurrentUser();
  if (!me) return null;
  const listing = db.listings.find((l) => l.id === listingId);
  if (!listing) return null;
  const agentUser = db.agents.find((a) => a.id === listing.agent_record_id)?.user_id;
  if (!agentUser) return null;
  let conv = db.conversations.find(
    (c) => c.listing_id === listingId && c.participants.includes(me.id)
  );
  if (!conv) {
    conv = { id: `conv_${Math.random().toString(36).slice(2, 9)}`, listing_id: listingId, participants: [me.id, agentUser], unread: {}, created_at: iso(0) };
    db.conversations.unshift(conv);
    persist();
  }
  return conversationsLocal().find((c) => c.id === conv!.id) ?? null;
}

export function messagesLocal(convId: string): Message[] {
  return db.messages[convId] ?? [];
}

function inlineUserMsg(agentRecordId: string, content: string) {
  const me = getCurrentUser();
  if (!me) return;
  const conv = db.conversations.find((c) => c.participants.includes(me.id) && db.listings.find((l) => l.id === c.listing_id)?.agent_record_id === agentRecordId);
  if (!conv) return;
  db.messages[conv.id] = db.messages[conv.id] ?? [];
  db.messages[conv.id].push({
    id: `m_${Math.random().toString(36).slice(2, 9)}`,
    conversation_id: conv.id,
    sender_id: me.id,
    content,
    type: 'text',
    created_at: iso(0),
  });
  conv.unread[me.id] = 0;
  persist();
}

export function sendMessageLocal(convId: string, content: string): Message {
  const me = getCurrentUser()!;
  const conv = db.conversations.find((c) => c.id === convId)!;
  const msg: Message = {
    id: `m_${Math.random().toString(36).slice(2, 9)}`,
    conversation_id: convId,
    sender_id: me.id,
    content,
    type: 'text',
    created_at: iso(0),
  };
  db.messages[convId] = db.messages[convId] ?? [];
  db.messages[convId].push(msg);
  persist();
  scheduleAgentReply(convId);
  return msg;
}

const cannedReplies: Record<string, string[]> = {
  ag_1: [
    'That works for me. Feel free to stop by anytime today.',
    'Yes, the room is still available. Do you want to proceed with the booking?',
    'We have 24hr light and water. You can come see the place tomorrow.',
    'Alright, I will confirm your booking once payment reflects. Thanks!',
  ],
  ag_3: ['Noted. Let me know when you want to schedule a viewing.', 'The 1-bedroom comes with a kitchen and constant water. Great choice!'],
};

let replyIndex = 0;

function scheduleAgentReply(convId: string) {
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) return;
  const agentUserId = conv.participants.find((p) => p !== getCurrentUser()?.id);
  if (!agentUserId) return;
  const agent = db.agents.find((a) => a.user_id === agentUserId);
  if (!agent) return;
  const pool = cannedReplies[agent.id] ?? cannedReplies.ag_1;
  const reply = pool[replyIndex++ % pool.length];
  const peerId = agentUserId;

  setTimeout(() => bus.emit('typing', { conversationId: convId, isTyping: true, userId: peerId }), 900);
  setTimeout(() => {
    bus.emit('typing', { conversationId: convId, isTyping: false, userId: peerId });
    const msg: Message = {
      id: `m_${Math.random().toString(36).slice(2, 9)}`,
      conversation_id: convId,
      sender_id: peerId,
      content: reply,
      type: 'text',
      created_at: iso(0),
    };
    db.messages[convId] = db.messages[convId] ?? [];
    db.messages[convId].push(msg);
    const me = getCurrentUser();
    if (me && peerId !== me.id) {
      conv.unread[me.id] = (conv.unread[me.id] ?? 0) + 1;
    }
    persist();
    bus.emit('new_message', { conversation_id: convId, message: msg });
  }, 1800);
}

export function bookingInviteLocal(convId: string, bookingId: string) {
  const booking = db.bookings.find((b) => b.id === bookingId);
  db.messages[convId] = db.messages[convId] ?? [];
  db.messages[convId].push({
    id: `m_${Math.random().toString(36).slice(2, 9)}`,
    conversation_id: convId,
    sender_id: getCurrentUser()?.id,
    content: booking
      ? `📋 Booking invite: ${booking.listing_name} (${booking.room_type.replace('_', ' ')}), ₦${booking.total_amount.toLocaleString()}. Status: ${booking.status}.`
      : '📋 Booking invite',
    type: 'booking_invite',
    meta: { booking_id: bookingId },
    created_at: iso(0),
  });
  persist();
}

// ─── Admin helpers ───────────────────────────────────────────────────────────

export function allAgentsLocal() {
  return db.agents.map((a) => {
    const u = db.users.find((x) => x.id === a.user_id);
    return { ...a, name: u?.name, email: u?.email, listing_count: db.listings.filter((l) => l.agent_record_id === a.id).length };
  });
}

export function reviewAgentLocal(id: string, action: string, note?: string) {
  const a = db.agents.find((x) => x.id === id);
  if (!a) return;
  if (action === 'approve') { a.verified = true; a.status = 'approved'; }
  else if (action === 'suspend') { a.status = 'suspended'; }
  else if (action === 'ban') { a.status = 'banned'; a.verified = false; }
  a.approval_note = note;
  persist();
  bus.emit('agent_status', { agentId: id, status: a.status });
}

export function deleteAgentLocal(id: string): boolean {
  const agent = db.agents.find((a) => a.id === id);
  if (!agent) return false;
  const userId = agent.user_id;
  const listingIds = db.listings.filter((l) => l.agent_record_id === id).map((l) => l.id);
  const convIds = db.conversations.filter((c) => c.participants.includes(userId)).map((c) => c.id);

  db.agents = db.agents.filter((a) => a.id !== id);
  db.users = db.users.filter((u) => u.id !== userId);
  db.listings = db.listings.filter((l) => !listingIds.includes(l.id));
  db.bookings = db.bookings.filter((b) => !listingIds.includes(b.listing_id));
  db.conversations = db.conversations.filter((c) => !convIds.includes(c.id));
  convIds.forEach((cid) => { delete db.messages[cid]; });
  Object.keys(db.saved).forEach((uid) => {
    db.saved[uid] = (db.saved[uid] ?? []).filter((lid) => !listingIds.includes(lid));
  });
  persist();
  bus.emit('agent_status', { agentId: id, status: 'deleted' });
  return true;
}

export function moderateListingLocal(id: string, action: string) {
  const l = db.listings.find((x) => x.id === id);
  if (!l) return;
  if (action === 'flag') l.available = false;
  else if (action === 'unflag') l.available = true;
  else if (action === 'remove') db.listings = db.listings.filter((x) => x.id !== id);
  persist();
}

export function adminBookingsLocal() {
  return db.bookings;
}

export function adminTransactionsLocal() {
  const finances = ['paid', 'confirmed', 'active', 'completed', 'disputed'];
  const tx = db.bookings
    .filter((b) => finances.includes(b.status))
    .map((b, i) => ({
      id: `tx_${b.id}`,
      paystack_ref: `PSK_${b.id.toUpperCase()}${i}Z`,
      student_name: b.student_name,
      listing_name: b.listing_name,
      amount: b.total_amount,
      status: b.status,
    }));
  return {
    summary: {
      grossRevenue: tx.reduce((s, t) => s + t.amount, 0),
      platformFees: db.bookings.reduce((s, b) => s + b.platform_fee, 0),
      released: db.bookings.filter((b) => ['active', 'completed'].includes(b.status)).reduce((s, b) => s + b.rent_amount, 0),
    },
    transactions: tx,
  };
}

export function adminUsersLocal(role?: string) {
  return db.users
    .filter((u) => !role || u.role === role)
    .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: u.created_at ?? iso(60 * 24 * 90) }));
}

export function adminAdminsLocal() {
  return db.users.filter((u) => u.role === 'admin');
}

// ─── Mock "socket" bus ───────────────────────────────────────────────────────

type Handler = (data: any) => void;

export interface MockSocket {
  on: (event: string, cb: Handler) => void;
  off: (event: string, cb: Handler) => void;
  emit: (event: string, data?: any) => void;
  disconnect: () => void;
}

export const bus: MockSocket & { listeners: Record<string, Set<Handler>> } = {
  listeners: {},
  on(event, cb) {
    (this.listeners[event] ??= new Set()).add(cb);
  },
  off(event, cb) {
    this.listeners[event]?.delete(cb);
  },
  emit(event, data) {
    this.listeners[event]?.forEach((cb) => cb(data));
  },
  disconnect() {
    this.listeners = {};
  },
};

export { delay, naira };