import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, CreditCard, DollarSign, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuthStore, useBookingStore } from '../../store';
import { listingsApi, bookingsApi } from '../../api';
import { Button, Badge, Card, Input, Select } from '../../components/ui';
import type { Listing, Booking, Region, RoomType } from '../../types';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, REGION_LABELS } from '../../types';

export function AgentDashboard() {
  const { user, agent, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'earnings' | 'new'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const { agentBookings, setAgentBookings } = useBookingStore();

  const load = async () => {
    try {
      const [l, b] = await Promise.all([listingsApi.list(), bookingsApi.agent()]);
      setListings(l.listings || []);
      setAgentBookings(b.bookings || []);
    } catch (err) {
      console.error('Agent dashboard load failed', err);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'agent') navigate('/');
    load();
  }, [user]);

  const tabs = [
    { id: 'listings' as const, icon: Building2, label: 'My Listings' },
    { id: 'bookings' as const, icon: CreditCard, label: 'Bookings' },
    { id: 'earnings' as const, icon: DollarSign, label: 'Earnings' },
    { id: 'new' as const, icon: Plus, label: 'New Listing' },
  ];

  return (
    <div className="min-h-screen bg-surf">
      <header className="bg-white border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">{agent?.business_name || 'Agent Dashboard'}</h1>
            <p className="text-xs text-ink-soft">{agent?.verified ? '✓ Verified' : 'Pending Approval'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-soft">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>← App</Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        <nav className="w-48 bg-white border-r border-line p-3 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                ${activeTab === t.id ? 'bg-primary text-white' : 'text-ink-soft hover:bg-surf'}`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'listings' && <AgentListings listings={listings} onRefresh={load} />}
          {activeTab === 'bookings' && <AgentBookings bookings={agentBookings} onRefresh={load} />}
          {activeTab === 'earnings' && <AgentEarnings bookings={agentBookings} />}
          {activeTab === 'new' && <NewListingForm onDone={() => { setActiveTab('listings'); load(); }} />}
        </div>
      </div>
    </div>
  );
}

function AgentListings({ listings, onRefresh }: { listings: Listing[]; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const handleToggle = async (id: string, available: boolean) => {
    await listingsApi.update(id, { available: !available });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await listingsApi.remove(id);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {listings.length === 0 ? (
        <p className="text-center text-sm text-ink-soft py-8">No listings yet. Create one!</p>
      ) : listings.map((l) => (
        <Card key={l.id} className="p-4">
          <div className="flex gap-4">
            <img src={l.photos?.[0] || 'https://picsum.photos/seed/ph/400/300'} className="w-24 h-24 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{l.name}</h3>
                  <p className="text-sm text-ink-soft">{l.address}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={
                      l.region === 'west_gate' ? 'blue' : l.region === 'south_gate' ? 'green' : 'orange'
                    }>
                      {REGION_LABELS[l.region]}
                    </Badge>
                    <Badge variant={l.available ? 'green' : 'red'}>{l.available ? 'Active' : 'Inactive'}</Badge>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">₦{l.price.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" onClick={() => handleToggle(l.id, l.available)}>
                  {l.available ? <><EyeOff size={14} className="mr-1" /> Deactivate</> : <><Eye size={14} className="mr-1" /> Activate</>}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(l.id)}>
                  <Trash2 size={14} className="mr-1" /> Delete
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AgentBookings({ bookings, onRefresh }: { bookings: Booking[]; onRefresh: () => void }) {
  const handleConfirm = async (id: string) => {
    await bookingsApi.confirm(id);
    onRefresh();
  };

  return (
    <div className="space-y-3">
      {bookings.length === 0 ? (
        <p className="text-center text-sm text-ink-soft py-8">No bookings yet</p>
      ) : bookings.map((b) => (
        <Card key={b.id} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{b.listing_name}</h3>
              <p className="text-sm text-ink-soft">{b.student_name} | {b.room_type.replace('_', ' ')} | Move-in: {b.move_in_date}</p>
              <p className="text-xs text-ink-soft mt-1">{REGION_LABELS[b.region]} | ₦{b.total_amount.toLocaleString()}</p>
            </div>
            <Badge className={BOOKING_STATUS_COLORS[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge>
          </div>
          {b.status === 'paid' && (
            <Button size="sm" className="mt-3" onClick={() => handleConfirm(b.id)}>Confirm Booking</Button>
          )}
        </Card>
      ))}
    </div>
  );
}

function AgentEarnings({ bookings }: { bookings: Booking[] }) {
  const completed = bookings.filter((b) => ['completed', 'active'].includes(b.status));
  const totalReceived = completed.reduce((sum, b) => sum + Number(b.rent_amount), 0);
  const pendingPayout = bookings.filter((b) => b.status === 'active').reduce((sum, b) => sum + Number(b.rent_amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-ink-soft">Total Received</p>
          <p className="text-2xl font-bold text-primary">₦{totalReceived.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-ink-soft">Pending Payout</p>
          <p className="text-2xl font-bold text-orange-600">₦{pendingPayout.toLocaleString()}</p>
        </Card>
      </div>
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surf border-b border-line">
            <tr><th className="text-left p-3">Listing</th><th className="text-left p-3">Student</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody>
            {completed.map((b) => (
              <tr key={b.id} className="border-b border-line">
                <td className="p-3">{b.listing_name}</td>
                <td className="p-3">{b.student_name}</td>
                <td className="p-3">₦{Number(b.rent_amount).toLocaleString()}</td>
                <td className="p-3"><Badge className={BOOKING_STATUS_COLORS[b.status]}>{BOOKING_STATUS_LABELS[b.status]}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewListingForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    name: '', region: 'west_gate' as Region, address: '', description: '',
    price: '', room_types: ['shared'] as RoomType[], amenities: [] as string[],
    photos: [] as string[], available_rooms: 1, lat: '', lng: '', walk_minutes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allAmenities = ['Water', '24hr Light', 'Security', 'Fence', 'Parking', 'Wi-Fi'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await listingsApi.create({
        ...form,
        price: Number(form.price),
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        walk_minutes: form.walk_minutes ? Number(form.walk_minutes) : undefined,
        amenities: form.amenities,
        photos: form.photos.length ? form.photos : ['https://picsum.photos/seed/' + form.name.replace(/\s/g, '') + '/800/600'],
      });
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="font-bold text-xl mb-4">Post New Listing</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-line p-6 space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</p>}
        <Input label="Hostel Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Region"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value as Region })}
            options={[{ label: 'West Gate', value: 'west_gate' }, { label: 'South Gate', value: 'south_gate' }, { label: 'North Gate', value: 'north_gate' }]}
          />
          <Input label="Price/month (₦)" type="number" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        </div>
        <Input label="Address" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[80px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude" type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <Input label="Longitude" type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
        </div>
        <Input label="Available Rooms" type="number" value={String(form.available_rooms)} onChange={(e) => setForm({ ...form, available_rooms: Number(e.target.value) })} />
        {/* Room types */}
        <div>
          <label className="block text-sm font-medium mb-1">Room Types</label>
          <div className="flex flex-wrap gap-2">
            {(['self_contain', '1_bedroom', '2_bedroom', 'shared'] as RoomType[]).map((rt) => (
              <button key={rt} type="button"
                onClick={() => {
                  const next = form.room_types.includes(rt)
                    ? form.room_types.filter((x) => x !== rt)
                    : [...form.room_types, rt];
                  if (next.length) setForm({ ...form, room_types: next });
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                  ${form.room_types.includes(rt) ? 'bg-primary text-white border-primary' : 'border-line text-ink-soft hover:border-primary/50'}`}
              >
                {rt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium mb-1">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {allAmenities.map((a) => (
              <button key={a} type="button"
                onClick={() => {
                  const next = form.amenities.includes(a)
                    ? form.amenities.filter((x) => x !== a)
                    : [...form.amenities, a];
                  setForm({ ...form, amenities: next });
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                  ${form.amenities.includes(a) ? 'bg-primary text-white border-primary' : 'border-line text-ink-soft hover:border-primary/50'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full">Create Listing</Button>
      </form>
    </div>
  );
}