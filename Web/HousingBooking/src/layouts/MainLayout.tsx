import { useEffect, useState } from 'react';
import {
  Search, MessageCircle, MapPin, X, Building2, Map, User, LogOut, Check, ChevronLeft, ChevronRight, Bookmark, CalendarClock, Sliders
} from 'lucide-react';
import { useAuthStore, useFeedStore, useUIStore, useChatStore } from '../store';
import { listingsApi } from '../api';
import { Badge, Button, Input, Select, Avatar } from '../components/ui';
import type { Listing, Region } from '../types';
import { REGION_LABELS } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AMENITY_LABELS: Record<string, string> = {
  'Water': 'Water',
  '24hr Light': 'Light',
  'Security': 'Security',
  'Fence': 'Fence',
  'Parking': 'Parking',
  'Wi-Fi': 'Wi-Fi',
};

const AMENITY_ICONS: Record<string, string> = {
  'Water': '💧', '24hr Light': '⚡', 'Security': '🛡️', 'Fence': '🔒', 'Parking': '🅿️', 'Wi-Fi': '📶',
};

const ROOM_TYPE_LABELS: Record<string, string> = {
  self_contain: 'Self-contain',
  '1_bedroom': '1-Bedroom',
  '2_bedroom': '2-Bedroom',
  shared: 'Shared',
};

const ROOM_PRICE_FACTORS: Record<string, number> = {
  shared: 0.7,
  self_contain: 1,
  '1_bedroom': 1.1,
  '2_bedroom': 1.25,
};

function roomPrice(roomType: string, base: number): number {
  const raw = base * (ROOM_PRICE_FACTORS[roomType] ?? 1);
  return Math.round(raw / 1000) * 1000;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

function isNewListing(created_at?: string): boolean {
  if (!created_at) return false;
  return Date.now() - new Date(created_at).getTime() < 24 * 60 * 60 * 1000;
}

function listingAmenities(listing: Listing): string[] {
  return (listing.amenities || []).map((a) => AMENITY_LABELS[a] || a).slice(0, 4);
}

function RegionBadge({ region, className = '' }: { region: Region; className?: string }) {
  const map: Record<Region, string> = {
    west_gate: 'bg-blue-100 text-blue-700',
    south_gate: 'bg-green-100 text-green-700',
    north_gate: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${map[region]} ${className}`}>
      {REGION_LABELS[region]}
    </span>
  );
}

function placeholder(id: string) {
  return `https://picsum.photos/seed/${id}/800/600`;
}

// ─── App Sidebar (left rail) ─────────────────────────────────────────────────
export function AppSidebar({ onSelect, onLogout }: {
  onSelect: (tab: 'feed' | 'map' | 'chat' | 'profile') => void;
  onLogout: () => void;
}) {
  const { activeTab } = useUIStore();
  const { user } = useAuthStore();
  const { conversations } = useChatStore();
  const unread = conversations.reduce((n, c) => n + Number(c.unread_count || 0), 0);
  const tabs = [
    { id: 'feed' as const, icon: Building2, label: 'Feed' },
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <aside className="hidden lg:flex w-[220px] shrink-0 border-r border-line bg-white flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5 border-b border-line">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
          <Building2 size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[15px] leading-tight">HostelBook</p>
          <p className="text-[10px] text-ink-soft leading-tight">FUTA Housing</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 flex flex-col gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === t.id ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:bg-surf hover:text-ink'}`}
          >
            <t.icon size={18} />
            {t.label}
            {t.id === 'chat' && unread > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* User card */}
      <div className="m-3 p-3 rounded-xl bg-surf border border-line flex items-center gap-3">
        <Avatar name={user?.name || 'U'} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink truncate">{user?.name || 'User'}</p>
          <p className="text-[11px] text-ink-soft capitalize">{user?.role || ''}</p>
        </div>
        <button
          onClick={onLogout}
          className="text-ink-soft hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

// ─── Bottom navigation (mobile) ───────────────────────────────────────────────
export function BottomNav({ onSelect }: {
  onSelect: (tab: 'feed' | 'map' | 'chat' | 'profile') => void;
}) {
  const { activeTab } = useUIStore();
  const { conversations } = useChatStore();
  const unread = conversations.reduce((n, c) => n + Number(c.unread_count || 0), 0);
  const tabs = [
    { id: 'feed' as const, icon: Building2, label: 'Feed' },
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line lg:hidden">
      <div className="flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`relative flex-1 flex flex-col items-center gap-0.5 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] text-[10px] font-medium transition-colors
              ${activeTab === t.id ? 'text-primary' : 'text-ink-soft'}`}
          >
            <span className={`relative p-1 rounded-full ${activeTab === t.id ? 'bg-primary-light' : ''}`}>
              <t.icon size={20} />
              {t.id === 'chat' && unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Listing Card (center feed) ───────────────────────────────────────────────
function FeedCard({ listing, onOpen, onMessage, onBook }: {
  listing: Listing;
  onOpen: () => void;
  onMessage: () => void;
  onBook: () => void;
}) {
  const isNew = isNewListing(listing.created_at);
  const lowRooms = listing.available_rooms <= 2;
  const amenities = listingAmenities(listing);
  const photo = listing.photos?.[0] || placeholder(listing.id);

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-line overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-md transition-all animate-fade-in"
    >
      {/* Header */}
      <div className="px-4 pt-3 flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
        <Avatar name={listing.agent_name} src={listing.agent_avatar} size="sm" />
        <span className="text-[13px] font-medium text-ink truncate flex-1 min-w-0">{listing.agent_name}</span>
        <RegionBadge region={listing.region} />
        {isNew && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
            New
          </span>
        )}
        <span className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-ink-soft whitespace-nowrap shrink-0">
          <MapPin size={11} /> {listing.walk_minutes || '?'} min walk
        </span>
        <span className="hidden sm:flex items-center gap-1 text-[11px] text-ink-soft whitespace-nowrap shrink-0" title={listing.created_at}>
          <CalendarClock size={11} /> {timeAgo(listing.created_at)}
        </span>
      </div>

      {/* Photo */}
      <div className="px-4 mt-2.5">
        <img src={photo} alt={listing.name} className="w-full aspect-video rounded-lg object-cover" loading="lazy" />
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-[16px] font-semibold text-ink leading-snug truncate">{listing.name}</h3>
        <p className="text-[13px] text-ink-soft mt-0.5 truncate">{listing.address}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[17px] font-bold text-primary">{listing.price_display}</span>
          {lowRooms && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium">
              Only {listing.available_rooms} rooms left
            </span>
          )}
        </div>
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {amenities.map((a) => (
              <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-50 text-primary text-[11px] font-medium">
                <Check size={10} strokeWidth={3} />
                {a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={(e) => { e.stopPropagation(); onMessage(); }}
        >
          <MessageCircle size={14} className="mr-1.5" /> Message Agent
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={(e) => { e.stopPropagation(); onBook(); }}
        >
          Book Now
        </Button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            listingsApi[listing.is_saved ? 'unsave' : 'save'](listing.id);
            useFeedStore.getState().setListings(
              useFeedStore.getState().listings.map((l) => l.id === listing.id ? { ...l, is_saved: !l.is_saved } : l)
            );
          }}
          className={`p-2 rounded-lg border transition-colors shrink-0 ${
            listing.is_saved
              ? 'border-primary text-primary bg-primary-light'
              : 'border-line text-ink-soft hover:text-primary hover:border-primary/40'
          }`}
          title={listing.is_saved ? 'Unsaved' : 'Save listing'}
        >
          <Bookmark size={16} fill={listing.is_saved ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}

// ─── Center feed column ───────────────────────────────────────────────────────
export function FeedColumn({ onSelectListing, onMessageListing, onOpenFilters }: {
  onSelectListing: (id: string) => void;
  onMessageListing: (id: string) => void;
  onOpenFilters: () => void;
}) {
  const { listings, loading, filters } = useFeedStore();
  const [search, setSearch] = useState('');
  const [bookingListing, setBookingListing] = useState<Listing | null>(null);

  useEffect(() => {
    useFeedStore.getState().setLoading(true);
    listingsApi.list(filters).then((d) => {
      useFeedStore.getState().setListings(d.listings);
      useFeedStore.getState().setLoading(false);
    }).catch(() => useFeedStore.getState().setLoading(false));
  }, [filters]);

  const filtered = listings.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase()) ||
    l.agent_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="w-full lg:w-[600px] shrink-0 lg:border-r border-line bg-[#f3f5f3] flex flex-col h-full min-w-0">
      {/* Search pinned */}
      <div className="px-4 pt-4 pb-3 bg-white lg:border-b border-line flex items-center gap-2">
        <Input
          icon={Search}
          placeholder="Search hostels, addresses or agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <button
          onClick={onOpenFilters}
          className="lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-line text-sm font-medium text-ink hover:bg-surf"
        >
          <Sliders size={15} /> Filters
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="text-center text-sm text-ink-soft py-10">Loading listings...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-sm text-ink-soft py-10">No listings found</div>
        ) : (
          filtered.map((l) => (
            <FeedCard
              key={l.id}
              listing={l}
              onOpen={() => onSelectListing(l.id)}
              onMessage={() => onMessageListing(l.id)}
              onBook={() => setBookingListing(l)}
            />
          ))
        )}
      </div>

      {/* Booking modal */}
      {bookingListing && (
        <BookingModal listing={bookingListing} onClose={() => setBookingListing(null)} />
      )}
    </section>
  );
}

// ─── Right filter column ──────────────────────────────────────────────────────
export function FilterColumn({ onClose }: { onClose?: () => void }) {
  const { filters, setFilter } = useFeedStore();
  const maxPrice = filters.max_price ? Number(filters.max_price) : 100000;

  const regions = [
    { label: 'All', value: 'all' },
    { label: 'West Gate', value: 'west_gate' },
    { label: 'South Gate', value: 'south_gate' },
    { label: 'North Gate', value: 'north_gate' },
  ];
  const roomTypes = [
    { label: 'All', value: 'all' },
    { label: 'Self-contain', value: 'self_contain' },
    { label: '1-Bedroom', value: '1_bedroom' },
    { label: '2-Bedroom', value: '2_bedroom' },
    { label: 'Shared', value: 'shared' },
  ];

  const toggleBtn = (active: boolean) =>
    `w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${
      active
        ? 'border-primary bg-primary-light text-primary font-semibold'
        : 'border-line text-ink hover:bg-surf'
    }`;

  return (
    <aside className={`bg-white h-full overflow-y-auto px-5 py-5 ${onClose ? 'w-full' : 'w-full lg:w-[280px] hidden lg:block shrink-0'} space-y-6`}>
      {onClose && (
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-[15px]">Filters</h4>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-soft hover:bg-surf">
            <X size={18} />
          </button>
        </div>
      )}

      <div>
        <h4 className="text-[13px] font-semibold text-ink mb-2">Region</h4>
        <div className="space-y-1.5">
          {regions.map((r) => (
            <button
              key={r.value}
              onClick={() => setFilter('region', r.value)}
              className={toggleBtn(filters.region === r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="text-[13px] font-semibold text-ink">Price range</h4>
          <span className="text-[13px] font-bold text-primary">₦{maxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100000}
          step={5000}
          value={maxPrice}
          onChange={(e) => setFilter('max_price', e.target.value)}
          className="w-full accent-[#1B5E20]"
        />
        <div className="flex justify-between text-[11px] text-ink-soft mt-1">
          <span>₦0</span>
          <span>₦100,000</span>
        </div>
      </div>

      <div>
        <h4 className="text-[13px] font-semibold text-ink mb-2">Room type</h4>
        <div className="space-y-1.5">
          {roomTypes.map((rt) => (
            <button
              key={rt.value}
              onClick={() => setFilter('room_type', rt.value)}
              className={toggleBtn(filters.room_type === rt.value)}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={filters.available !== 'all'}
          onChange={(e) => setFilter('available', e.target.checked ? 'true' : 'all')}
          className="w-4 h-4 accent-[#1B5E20]"
        />
        <span className="text-sm text-ink">Show available only</span>
      </label>
    </aside>
  );
}

// ─── Listing Detail (full-page modal) ─────────────────────────────────────────
export function ListingDetailModal({ listing, onClose, onChat }: {
  listing: Listing;
  onClose: () => void;
  onChat: (listingId: string) => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [booking, setBooking] = useState(false);
  const photos = listing.photos?.length ? listing.photos : [placeholder(listing.id)];

  const prev = () => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setPhotoIndex((i) => (i + 1) % photos.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Gallery */}
          <div className="relative aspect-video bg-gray-200">
            <img src={photos[photoIndex]} alt={listing.name} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-ink rounded-full p-2 shadow"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-ink rounded-full p-2 shadow"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-ink leading-tight">{listing.name}</h2>
                <p className="text-[13px] text-ink-soft mt-0.5">{listing.business_name}</p>
              </div>
              <RegionBadge region={listing.region} className="mt-1" />
            </div>

            {/* Verified + price */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {listing.agent_verified && <Badge variant="green">✓ Verified Agent</Badge>}
              <span className="text-sm text-ink-soft">~{listing.walk_minutes || '?'} min walk to FUTA gate</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">₦{listing.price.toLocaleString()}</span>
              <span className="text-sm text-ink-soft">/ month</span>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              Platform fee ₦{listing.platform_fee.toLocaleString()} · Caution ₦{listing.caution_fee.toLocaleString()}
            </p>

            {/* Address + map link */}
            <div className="mt-4 flex items-center gap-2">
              <MapPin size={15} className="text-ink-soft shrink-0" />
              <span className="text-sm text-ink flex-1">{listing.address}</span>
              {listing.lat && listing.lng && (
                <a
                  href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] font-medium text-primary hover:underline shrink-0"
                >
                  View on map
                </a>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <p className="mt-4 text-sm text-ink-soft leading-relaxed">{listing.description}</p>
            )}

            {/* Amenities grid */}
            <h4 className="font-semibold text-sm mt-6 mb-2">Amenities</h4>
            <div className="grid grid-cols-3 gap-2">
              {(listing.amenities?.length ? listing.amenities : []).map((a) => (
                <div key={a} className="bg-primary-50 border border-primary/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <span className="text-base">{AMENITY_ICONS[a] || '✓'}</span>
                  <span className="text-[13px] font-medium text-ink truncate">{AMENITY_LABELS[a] || a}</span>
                </div>
              ))}
            </div>

            {/* Room types with individual prices */}
            <h4 className="font-semibold text-sm mt-6 mb-2">Room types</h4>
            <div className="space-y-2">
              {listing.room_types.map((rt) => (
                <div key={rt} className="flex items-center justify-between border border-line rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-ink">{ROOM_TYPE_LABELS[rt] || rt.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-primary">₦{roomPrice(rt, listing.price).toLocaleString()}/mo</span>
                </div>
              ))}
            </div>

            {/* Agent card */}
            <div className="mt-6 p-4 bg-surf rounded-xl border border-line">
              <div className="flex items-center gap-3">
                <Avatar name={listing.agent_name} src={listing.agent_avatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-ink truncate">{listing.agent_name}</span>
                    {listing.agent_verified && <Badge variant="green">Verified Agent</Badge>}
                  </div>
                  <p className="text-xs text-ink-soft truncate">{listing.business_name}</p>
                  <p className="text-xs text-ink-soft mt-0.5">Usually replies within 1 hour</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom CTA bar */}
        <div className="border-t border-line px-5 py-3 bg-white flex items-center gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onChat(listing.id)}
          >
            <MessageCircle size={16} className="mr-2" /> Message Agent
          </Button>
          <Button className="flex-1" onClick={() => setBooking(true)}>
            Book Now
          </Button>
        </div>
      </div>

      {/* Booking modal */}
      {booking && (
        <BookingModal listing={listing} onClose={() => setBooking(false)} />
      )}
    </div>
  );
}

// ─── Booking Modal ────────────────────────────────────────────────────────────
function BookingModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const [roomType, setRoomType] = useState<string>(listing.room_types[0] || 'shared');
  const [moveIn, setMoveIn] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form');

  const handleBook = async () => {
    if (!moveIn) return;
    setLoading(true);
    try {
      const { bookingsApi } = await import('../api');
      const { booking } = await bookingsApi.create({
        listing_id: listing.id,
        room_type: roomType,
        move_in_date: moveIn,
      });
      await (await import('../api')).paymentsApi.initialize(booking.id);
      setStep('payment');
      setTimeout(() => setStep('done'), 1800);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md p-6 animate-fade-in shadow-2xl">
        {step === 'form' && (
          <>
            <h3 className="font-bold text-lg mb-4">Book {listing.name}</h3>
            <div className="space-y-4">
              <Select
                label="Room Type"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                options={listing.room_types.map((r) => ({ label: ROOM_TYPE_LABELS[r] || r.replace('_', ' '), value: r }))}
              />
              <Input
                label="Move-in Date"
                type="date"
                value={moveIn}
                onChange={(e) => setMoveIn(e.target.value)}
              />
              <div className="bg-surf rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-soft">Rent</span><span>₦{listing.price.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Platform fee (2%)</span><span>₦{listing.platform_fee.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-ink-soft">Caution fee</span><span>₦{listing.caution_fee.toLocaleString()}</span></div>
                <div className="border-t border-line pt-2 flex justify-between font-bold">
                  <span>Total</span><span className="text-primary">₦{listing.total_estimate.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleBook} loading={loading} className="flex-1">Pay & Book</Button>
              </div>
            </div>
          </>
        )}
        {step === 'payment' && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-ink-soft">Redirecting to Paystack...</p>
          </div>
        )}
        {step === 'done' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-bold text-lg mb-2">Booking Created!</h3>
            <p className="text-sm text-ink-soft">Check your bookings for status updates.</p>
            <Button className="mt-6" onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </div>
  );
}