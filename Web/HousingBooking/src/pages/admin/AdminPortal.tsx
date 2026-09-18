import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Building2, CreditCard, DollarSign } from 'lucide-react';
import { adminApi } from '../../api';
import { useAuthStore } from '../../store';
import { Button, Badge, Card } from '../../components/ui';
import type { BookingStatus } from '../../types';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../types';

export function AdminPortal() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'agents' | 'listings' | 'bookings' | 'transactions' | 'users'>('agents');
  const [stats, setStats] = useState({ agents: 0, listings: 0, bookings: 0, users: 0, revenue: 0 });

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user]);

  const tabs = [
    { id: 'agents' as const, icon: Shield, label: 'Agents' },
    { id: 'listings' as const, icon: Building2, label: 'Listings' },
    { id: 'bookings' as const, icon: CreditCard, label: 'Bookings' },
    { id: 'transactions' as const, icon: DollarSign, label: 'Transactions' },
    { id: 'users' as const, icon: Users, label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-surf">
      {/* Header */}
      <header className="bg-white border-b border-line px-4 lg:px-6 py-3 lg:py-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Shield size={18} className="text-white" />
          </div>
          <h1 className="font-bold text-sm lg:text-lg">Admin Portal</h1>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-3 flex-wrap">
          <span className="hidden lg:inline text-sm text-ink-soft">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>← Back to App</Button>
          <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </div>
      </header>

      <div className="lg:h-[calc(100vh-65px)] lg:flex">
        {/* Tab nav (desktop) */}
        <nav className="hidden lg:block w-52 bg-white border-r border-line p-3 space-y-1">
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

        {/* Tab nav (mobile) */}
        <nav className="lg:hidden sticky top-0 z-10 bg-white border-b border-line px-4 py-2.5 flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-all
                ${activeTab === t.id ? 'bg-primary text-white' : 'text-ink-soft hover:bg-surf border border-line'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          {activeTab === 'agents' && <AgentsPanel />}
          {activeTab === 'listings' && <ListingsPanel />}
          {activeTab === 'bookings' && <BookingsPanel />}
          {activeTab === 'transactions' && <TransactionsPanel />}
          {activeTab === 'users' && <UsersPanel />}
        </div>
      </div>
    </div>
  );
}

function AgentsPanel() {
  const [agents, setAgents] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [all, pend] = await Promise.all([adminApi.allAgents(), adminApi.pendingAgents()]);
      setAgents(all.agents || []);
      setPending(pend.agents || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleReview = async (id: string, action: string) => {
    const note = prompt(`${action} note:`) || '';
    await adminApi.reviewAgent(id, action, note);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this agent account, all their listings and bookings? This cannot be undone.')) return;
    await adminApi.deleteAgent(id);
    load();
  };

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h3 className="font-bold mb-3">Pending Approvals ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map((a) => (
              <Card key={a.id} className="p-4 border-yellow-200 bg-yellow-50">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium">{a.business_name}</p>
                    <p className="text-sm text-ink-soft">{a.name} | {a.email} | {a.phone}</p>
                    <a href={a.id_document_url} target="_blank" className="text-sm text-primary underline">View ID Document</a>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => handleReview(a.id, 'approve')}>Approve</Button>
                    <Button variant="danger" size="sm" onClick={() => handleReview(a.id, 'ban')}>Reject</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(a.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-3">All Agents</h3>
        <div className="bg-white rounded-xl border border-line overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-surf border-b border-line">
              <tr><th className="text-left p-3">Agent</th><th className="text-left p-3">Status</th><th className="text-left p-3">Listings</th><th className="text-left p-3">Actions</th></tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-line">
                  <td className="p-3"><p className="font-medium">{a.business_name}</p><p className="text-xs text-ink-soft">{a.email}</p></td>
                  <td className="p-3"><Badge variant={a.status === 'approved' ? 'green' : a.status === 'pending' ? 'orange' : 'red'}>{a.status}</Badge></td>
                  <td className="p-3">{a.listing_count}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {a.status === 'approved' ? (
                        <Button variant="danger" size="sm" onClick={() => handleReview(a.id, 'suspend')}>Suspend</Button>
                      ) : a.status === 'suspended' ? (
                        <Button size="sm" onClick={() => handleReview(a.id, 'approve')}>Approve</Button>
                      ) : null}
                      <Button variant="danger" size="sm" onClick={() => handleDelete(a.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsPanel() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const d = await adminApi.allListings();
    setListings(d.listings || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleModerate = async (id: string, action: string) => {
    await adminApi.moderateListing(id, action);
    load();
  };

  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead className="bg-surf border-b border-line">
          <tr><th className="text-left p-3">Listing</th><th className="text-left p-3">Agent</th><th className="text-left p-3">Price</th><th className="text-left p-3">Region</th><th className="text-left p-3">Available</th><th className="text-left p-3">Actions</th></tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l.id} className="border-b border-line">
              <td className="p-3 font-medium">{l.name}</td>
              <td className="p-3 text-ink-soft">{l.business_name}</td>
              <td className="p-3">₦{Number(l.price).toLocaleString()}</td>
              <td className="p-3">{l.region}</td>
              <td className="p-3">{l.available ? '✓' : '✗'}</td>
              <td className="p-3">
                <div className="flex gap-2 flex-wrap">
                  {l.available ? (
                    <Button variant="danger" size="sm" onClick={() => handleModerate(l.id, 'flag')}>Flag</Button>
                  ) : (
                    <Button size="sm" onClick={() => handleModerate(l.id, 'unflag')}>Unflag</Button>
                  )}
                  <Button variant="danger" size="sm" onClick={() => handleModerate(l.id, 'remove')}>Remove</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function BookingsPanel() {
  const [bookings, setBookings] = useState<any[]>([]);
  useEffect(() => {
    adminApi.bookings().then((d) => setBookings(d.bookings || []));
  }, []);
  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead className="bg-surf border-b border-line">
          <tr><th className="text-left p-3">Student</th><th className="text-left p-3">Listing</th><th className="text-left p-3">Total</th><th className="text-left p-3">Status</th></tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-line">
              <td className="p-3">{b.student_name}</td>
              <td className="p-3">{b.listing_name}</td>
              <td className="p-3">₦{Number(b.total_amount).toLocaleString()}</td>
              <td className="p-3"><Badge className={BOOKING_STATUS_COLORS[b.status as BookingStatus]}>{BOOKING_STATUS_LABELS[b.status as BookingStatus]}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function TransactionsPanel() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { adminApi.transactions().then(setData); }, []);
  return (
    <div className="space-y-4">
      {data?.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          {[
            { label: 'Gross Revenue', value: `₦${data.summary.grossRevenue.toLocaleString()}`, color: 'text-primary' },
            { label: 'Platform Fees', value: `₦${data.summary.platformFees.toLocaleString()}`, color: 'text-blue-600' },
            { label: 'Released to Agents', value: `₦${data.summary.released.toLocaleString()}`, color: 'text-green-600' },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-sm text-ink-soft">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-surf border-b border-line">
            <tr><th className="text-left p-3">Reference</th><th className="text-left p-3">Student</th><th className="text-left p-3">Listing</th><th className="text-left p-3">Amount</th><th className="text-left p-3">Status</th></tr>
          </thead>
          <tbody>
            {(data?.transactions || []).map((t: any) => (
              <tr key={t.id} className="border-b border-line">
                <td className="p-3 font-mono text-xs">{t.paystack_ref}</td>
                <td className="p-3">{t.student_name}</td>
                <td className="p-3">{t.listing_name}</td>
                <td className="p-3">₦{Number(t.amount).toLocaleString()}</td>
                <td className="p-3"><Badge variant={t.status === 'success' || t.status === 'released' ? 'green' : 'orange'}>{t.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [role, setRole] = useState('');
  useEffect(() => {
    adminApi.users(role || undefined).then((d) => setUsers(d.users || []));
  }, [role]);
  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden">
      <div className="p-3 border-b border-line flex gap-2">
        {['', 'student', 'agent', 'admin'].map((r) => (
          <button key={r} onClick={() => setRole(r)} className={`px-3 py-1 rounded-full text-xs font-medium ${role === r ? 'bg-primary text-white' : 'bg-surf text-ink-soft hover:bg-gray-200'}`}>
            {r || 'All'}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead className="bg-surf border-b border-line">
          <tr><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Role</th><th className="text-left p-3">Joined</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-line">
              <td className="p-3 font-medium">{u.name}</td>
              <td className="p-3 text-ink-soft">{u.email}</td>
              <td className="p-3"><Badge variant={u.role === 'admin' ? 'purple' : u.role === 'agent' ? 'blue' : 'default'}>{u.role}</Badge></td>
              <td className="p-3 text-xs text-ink-soft">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}