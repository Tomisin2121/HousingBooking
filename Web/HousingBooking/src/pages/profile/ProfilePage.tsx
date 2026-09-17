import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, BookOpen, CreditCard, Settings, LogOut, Bookmark, Shield, Building2, DollarSign, ChevronRight, Upload, Edit2, LayoutDashboard } from 'lucide-react';
import { useAuthStore, useBookingStore } from '../../store';
import { bookingsApi, listingsApi, authApi, paymentsApi } from '../../api';
import { Avatar, Badge, Button, Card, Input, Modal } from '../../components/ui';
import type { Booking } from '../../types';
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from '../../types';

export function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const { user, agent, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saved, setSaved] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'bookings' | 'saved' | 'settings'>('bookings');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    bookingsApi.my().then((d) => setBookings(d.bookings || []));
    listingsApi.saved().then((d) => setSaved(d.listings || []));
  }, []);

  return (
    <div className="h-full overflow-y-auto bg-surf">
      {/* Header */}
      <div className="bg-white p-6 text-center border-b border-line">
        <Avatar name={user?.name || 'User'} size="lg" className="mx-auto mb-3" />
        <h2 className="font-bold text-lg">{user?.name}</h2>
        <p className="text-sm text-ink-soft">{user?.email}</p>
        {user?.role === 'student' && user?.matric_no && (
          <p className="text-xs text-ink-soft mt-1">Matric: {user.matric_no} | {user.department}</p>
        )}
        {user?.role === 'agent' && agent && (
          <div className="mt-2">
            <Badge variant={agent.verified ? 'green' : 'orange'}>
              {agent.verified ? '✓ Verified Agent' : 'Pending Approval'}
            </Badge>
            <p className="text-xs text-ink-soft mt-1">{agent.business_name}</p>
          </div>
        )}
        <div className="flex gap-2 justify-center mt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowEditModal(true)}>
            <Edit2 size={14} className="mr-1" /> Edit Profile
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowPasswordModal(true)}>
            <Shield size={14} className="mr-1" /> Change Password
          </Button>
          {user?.role === 'agent' && (
            <Button size="sm" onClick={() => navigate('/agent')}>
              <LayoutDashboard size={14} className="mr-1" /> Agent Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-line">
        {[
          { key: 'bookings' as const, icon: CreditCard, label: 'My Bookings' },
          { key: 'saved' as const, icon: Bookmark, label: 'Saved' },
          { key: 'settings' as const, icon: Settings, label: 'Settings' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSection(t.key)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all
              ${activeSection === t.key ? 'border-primary text-primary' : 'border-transparent text-ink-soft hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeSection === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-8">No bookings yet</p>
            ) : (
              bookings.map((b) => (
                <Card key={b.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{b.listing_name}</h3>
                      <p className="text-xs text-ink-soft">{b.room_type.replace('_', ' ')} | {b.move_in_date}</p>
                    </div>
                    <Badge className={BOOKING_STATUS_COLORS[b.status]}>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <span className="font-bold text-primary">₦{b.total_amount.toLocaleString()}</span>
                    <span className="text-xs text-ink-soft">{b.business_name}</span>
                  </div>
                  {b.status === 'active' && (
                    <Button variant="ghost" size="sm" className="mt-2 w-full border border-red-200 text-red-600 hover:bg-red-50"
                      onClick={async () => {
                        const reason = prompt('Dispute reason:');
                        if (reason) { await bookingsApi.dispute(b.id, reason); alert('Dispute filed'); }
                      }}
                    >
                      File Dispute
                    </Button>
                  )}
                </Card>
              ))
            )}
          </div>
        )}
        {activeSection === 'saved' && (
          <div className="space-y-3">
            {saved.length === 0 ? (
              <p className="text-sm text-ink-soft text-center py-8">No saved listings</p>
            ) : (
              saved.map((l: any) => (
                <Card key={l.id} className="p-3 flex gap-3">
                  <img src={l.photos?.[0] || 'https://picsum.photos/seed/ph/400/300'} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{l.name}</h4>
                    <p className="text-xs text-ink-soft">₦{Number(l.price).toLocaleString()}/month</p>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
        {activeSection === 'settings' && (
          <div className="space-y-2">
            <Card className="p-4 hover:bg-surf cursor-pointer" onClick={onLogout}>
              <div className="flex items-center gap-3 text-red-600">
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal open={showEditModal} onClose={() => setShowEditModal(false)} />
      <ChangePasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} />
    </div>
  );
}

function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, setAuth } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { user: updated } = await authApi.updateProfile({ name, department, avatar: avatarUrl });
      setAuth(localStorage.getItem('token')!, updated, null);
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
        <Input label="Avatar URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
        <Button onClick={handleSave} loading={loading} className="w-full">Save Changes</Button>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await authApi.changePassword({ current_password: current, new_password: newPass });
      alert('Password updated');
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Password">
      <div className="space-y-4">
        <Input label="Current Password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Input label="New Password" type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
        <Button onClick={handleSave} loading={loading} className="w-full">Update Password</Button>
      </div>
    </Modal>
  );
}