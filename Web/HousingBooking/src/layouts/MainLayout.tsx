import { useEffect, useState } from 'react';
import {
  Search, MessageCircle, MapPin, X, Building2, Map, User, LogOut
} from 'lucide-react';
import { useAuthStore, useFeedStore, useUIStore } from '../store';
import { listingsApi } from '../api';
import { Badge, Button, Card, Input, Select, Avatar } from '../components/ui';
import type { Listing, RoomType } from '../types';
import { REGION_LABELS } from '../types';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ onSelect }: { onSelect: (tab: 'feed' | 'map' | 'chat' | 'profile') => void }) {
  const { activeTab } = useUIStore();
  const { user } = useAuthStore();
  const tabs = [
    { id: 'feed' as const, icon: Building2, label: 'Feed' },
    { id: 'map' as const, icon: Map, label: 'Map' },
    { id: 'chat' as const, icon: MessageCircle, label: 'Chat' },
    { id: 'profile' as const, icon: User, label: 'Profile' },
  ];

  return (
    <div className="w-16 bg-[#1a1f1a] flex flex-col items-center py-4 gap-1 shrink-0 h-full">
      {/* User avatar */}
      <div className="mb-4">
        <Avatar name={user?.name || 'U'} size="md" />
      </div>
      {/* Tabs */}
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all
            ${activeTab === t.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          title={t.label}
        >
          <t.icon size={22} />
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => useAuthStore.getState().logout()}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
}

// ─── Listing Card (sidebar list) ─────────────────────────────────────────────
function ListingCard({ listing, active, onClick }: { listing: Listing; active: boolean; onClick: () => void }) {
  return (
    <Card
      active={active}
      onClick={onClick}
      className={`p-3 animate-fade-in ${active ? 'border-primary' : ''}`}
    >
      <div className="flex gap-3">
        <img
          src={listing.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300'}
          alt={listing.name}
          className="w-20 h-20 rounded-lg object-cover shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight truncate">{listing.name}</h3>
            <Badge variant={
              listing.region === 'west_gate' ? 'blue' :
              listing.region === 'south_gate' ? 'green' : 'orange'
            }>
              {REGION_LABELS[listing.region]}
            </Badge>
          </div>
          <p className="text-xs text-ink-soft mt-0.5 truncate">{listing.address}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-primary">{listing.price_display}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-ink-soft">
            {listing.walk_minutes && <span className="flex items-center gap-0.5"><MapPin size={11} /> {listing.walk_minutes} min walk</span>}
            <span>{listing.available_rooms} rooms</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function Filters() {
  const { filters, setFilter } = useFeedStore();
  const regions = [
    { label: 'All', value: 'all' },
    { label: 'West Gate', value: 'west_gate' },
    { label: 'South Gate', value: 'south_gate' },
    { label: 'North Gate', value: 'north_gate' },
  ];
  return (
    <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-b border-line">
      {regions.map((r) => (
        <button
          key={r.value}
          onClick={() => setFilter('region', r.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all
            ${filters.region === r.value ? 'bg-primary text-white' : 'bg-surf text-ink-soft hover:bg-gray-200'}`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

// ─── Feed Panel (left sidebar list) ──────────────────────────────────────────
export function FeedPanel({ onSelectListing }: { onSelectListing: (id: string) => void }) {
  const { listings, loading, filters } = useFeedStore();
  const { selectedId } = useFeedStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    useFeedStore.getState().setLoading(true);
    listingsApi.list(filters).then((d) => {
      useFeedStore.getState().setListings(d.listings);
      useFeedStore.getState().setLoading(false);
    }).catch(() => useFeedStore.getState().setLoading(false));
  }, [filters]);

  const filtered = listings.filter((l) =>
    !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      <div className="px-3 py-3 border-b border-line">
        <Input
          icon={Search}
          placeholder="Search hostels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Filters />
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-sm text-ink-soft">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-ink-soft">No listings found</div>
        ) : (
          filtered.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              active={selectedId === l.id}
              onClick={() => onSelectListing(l.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Listing Detail (right panel) ────────────────────────────────────────────
export function ListingDetail({ listing, onBack, onChat }: { listing: Listing; onBack?: () => void; onChat?: (listingId: string) => void }) {
  const { user } = useAuthStore();
  const [bookingModal, setBookingModal] = useState(false);

  const amenityIcons: Record<string, string> = {
    'Water': '💧', '24hr Light': '⚡', 'Security': '🛡️', 'Fence': '🔒', 'Parking': '🅿️', 'Wi-Fi': '📶',
  };

  return (
    <div className="h-full overflow-y-auto animate-slide-in-right">
      {/* Gallery */}
      <div className="relative h-64 bg-gray-200">
        {listing.photos?.[0] && (
          <img src={listing.photos[0]} alt={listing.name} className="w-full h-full object-cover" />
        )}
        {onBack && (
          <button onClick={onBack} className="absolute top-3 left-3 bg-black/50 text-white rounded-full p-2 hover:bg-black/70">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{listing.name}</h2>
            <p className="text-sm text-ink-soft mt-0.5">{listing.address}</p>
          </div>
          <Badge variant={
            listing.region === 'west_gate' ? 'blue' :
            listing.region === 'south_gate' ? 'green' : 'orange'
          } className="text-sm">{REGION_LABELS[listing.region]}</Badge>
        </div>

        {/* Price */}
        <div className="mt-4 p-3 bg-primary-50 rounded-xl">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">₦{listing.price.toLocaleString()}</span>
            <span className="text-sm text-ink-soft">/ month</span>
          </div>
          <div className="text-xs text-ink-soft mt-1">
            Platform fee: ₦{listing.platform_fee.toLocaleString()} | Caution: ₦{listing.caution_fee.toLocaleString()}
          </div>
        </div>

        {/* Walk distance */}
        {listing.walk_minutes && (
          <div className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <MapPin size={14} />
            {listing.walk_minutes} minutes walk from FUTA main gate
          </div>
        )}

        {/* Description */}
        {listing.description && (
          <p className="mt-4 text-sm text-ink-soft leading-relaxed">{listing.description}</p>
        )}

        {/* Room types */}
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2">Room Types</h4>
          <div className="flex flex-wrap gap-2">
            {listing.room_types.map((rt) => (
              <Badge key={rt} variant="default">{rt.replace('_', '-')}</Badge>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="mt-4">
          <h4 className="font-semibold text-sm mb-2">Amenities</h4>
          <div className="flex flex-wrap gap-2">
            {listing.amenities.map((a) => (
              <Badge key={a} variant="green">
                <span className="mr-1">{amenityIcons[a] || '✓'}</span>{a}
              </Badge>
            ))}
          </div>
        </div>

        {/* Agent card */}
        <div className="mt-6 p-4 bg-surf rounded-xl">
          <div className="flex items-center gap-3">
            <Avatar name={listing.agent_name} src={listing.agent_avatar} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm">{listing.agent_name}</span>
                {listing.agent_verified && <Badge variant="green">Verified</Badge>}
              </div>
              <p className="text-xs text-ink-soft">{listing.business_name}</p>
              <p className="text-xs text-ink-soft mt-0.5">Usually replies within 1 hour</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onChat?.(listing.id)}
          >
            <MessageCircle size={16} className="mr-2" /> Message Agent
          </Button>
          <Button
            className="flex-1"
            onClick={() => setBookingModal(true)}
          >
            Book Now
          </Button>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModal && (
        <BookingModal listing={listing} onClose={() => setBookingModal(false)} />
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
      const payRes = await (await import('../api')).paymentsApi.initialize(booking.id);
      // redirect to Paystack (in MVP, show success)
      setStep('payment');
      setTimeout(() => setStep('done'), 2000);
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
                options={listing.room_types.map((r) => ({ label: r.replace('_', ' '), value: r }))}
              />
              <Input
                label="Move-in Date"
                type="date"
                value={moveIn}
                onChange={(e) => setMoveIn(e.target.value)}
              />
              {/* Price breakdown */}
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