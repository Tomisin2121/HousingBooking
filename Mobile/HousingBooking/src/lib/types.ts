export interface User {
  id: string;
  name: string;
  matric_no?: string;
  department?: string;
  email: string;
  role: 'student' | 'agent' | 'admin';
  avatar?: string;
}

export interface Agent {
  id: string;
  user_id: string;
  business_name: string;
  phone: string;
  verified: boolean;
  status: 'pending' | 'approved' | 'suspended' | 'banned';
  created_at: string;
}

export type Region = 'west_gate' | 'south_gate' | 'north_gate';
export type RoomType = 'self_contain' | '1_bedroom' | '2_bedroom' | 'shared';

export interface Listing {
  id: string;
  agent_id: string;
  name: string;
  region: Region;
  address: string;
  description: string;
  price: number;
  room_types: RoomType[];
  amenities: string[];
  photos: string[];
  available_rooms: number;
  available: boolean;
  lat?: number;
  lng?: number;
  walk_minutes?: number;
  business_name: string;
  agent_verified: boolean;
  agent_name: string;
  agent_avatar?: string;
  agent_record_id: string;
  price_display: string;
  platform_fee: number;
  caution_fee: number;
  total_estimate: number;
  is_saved?: boolean;
}

export type BookingStatus = 'requested' | 'pending_payment' | 'paid' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed';

export interface Booking {
  id: string;
  student_id: string;
  listing_id: string;
  room_type: RoomType;
  move_in_date: string;
  status: BookingStatus;
  rent_amount: number;
  platform_fee: number;
  caution_fee: number;
  total_amount: number;
  listing_name: string;
  region: Region;
  address: string;
  photos: string[];
  student_name: string;
  business_name: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  listing_id: string;
  listing_name: string;
  peer: {
    id: string;
    name: string;
    avatar?: string;
    business_name?: string;
    verified?: boolean;
  };
  last_message?: {
    content: string;
    type: string;
    created_at: string;
    sender_id?: string;
  };
  unread_count: number | string;
  last_message_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  content: string;
  type: 'text' | 'image' | 'system' | 'booking_invite';
  meta?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export const REGION_LABELS: Record<Region, string> = {
  west_gate: 'West Gate',
  south_gate: 'South Gate',
  north_gate: 'North Gate',
};

export const REGION_COLORS: Record<Region, string> = {
  west_gate: '#2563EB',
  south_gate: '#16A34A',
  north_gate: '#EA580C',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'Requested',
  pending_payment: 'Awaiting Payment',
  paid: 'Paid (Escrow)',
  confirmed: 'Confirmed',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};