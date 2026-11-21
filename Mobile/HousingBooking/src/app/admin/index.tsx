import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Button, BadgeView } from '@/components/ui';
import { useAuth } from '@/lib/store';
import { adminApi } from '@/lib/api';
import { Colors, Spacing, Radius } from '@/constants/theme';
import type { BookingStatus } from '@/lib/types';

interface AdminAgent {
  id: string;
  name?: string;
  email?: string;
  business_name: string;
  phone?: string;
  verified: boolean;
  status: string;
  listing_count: number;
}

interface AdminListing {
  id: string;
  name: string;
  business_name: string;
  price: number;
  region: string;
  available: boolean;
}

interface AdminBooking {
  id: string;
  student_name: string;
  listing_name: string;
  total_amount: number;
  status: BookingStatus;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const REGION_LABELS: Record<string, string> = { west_gate: 'West Gate', south_gate: 'South Gate', north_gate: 'North Gate' };

const BOOKING_STATUS_LABELS: Record<string, string> = {
  requested: 'Requested', pending_payment: 'Pending Payment', paid: 'Paid', confirmed: 'Confirmed',
  active: 'Active', completed: 'Completed', cancelled: 'Cancelled', disputed: 'Disputed',
};

function statusColor(s: string): 'green' | 'orange' | 'red' {
  if (['confirmed', 'active', 'completed'].includes(s)) return 'green';
  if (['requested', 'pending_payment', 'paid'].includes(s)) return 'orange';
  return 'red';
}

function roleColor(r: string): 'default' | 'green' | 'blue' | 'orange' | 'red' | 'purple' {
  if (r === 'admin') return 'purple';
  if (r === 'agent') return 'blue';
  return 'default';
}

export default function AdminPortalScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'agents' | 'listings' | 'bookings' | 'transactions' | 'users'>('agents');
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [transactions, setTransactions] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');

  const load = useCallback(async () => {
    try {
      const [a, l, b, t, u] = await Promise.all([
        adminApi.allAgents(),
        adminApi.allListings(),
        adminApi.bookings(),
        adminApi.transactions(),
        adminApi.users(),
      ]);
      setAgents(a.agents || []);
      setListings(l.listings || []);
      setBookings(b.bookings || []);
      setTransactions(t);
      setUsers(u.users || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.role !== 'admin') router.replace('/(tabs)/feed');
  }, [user, router]);

  useEffect(() => {
    if (tab !== 'users') return;
    adminApi.users(userRole || undefined).then((d) => setUsers(d.users || []));
  }, [tab, userRole]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (user?.role !== 'admin') return null;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleApprove = (a: AdminAgent) => {
    Alert.alert('Approve Agent', `Approve "${a.business_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => { await adminApi.reviewAgent(a.id, 'approve'); load(); } },
    ]);
  };

  const handleReject = (a: AdminAgent) => {
    Alert.alert('Reject Agent', `Reject "${a.business_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', onPress: async () => { await adminApi.reviewAgent(a.id, 'ban'); load(); } },
    ]);
  };

  const handleSuspend = (a: AdminAgent) => {
    Alert.alert('Suspend Agent', `Suspend "${a.business_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Suspend', style: 'destructive', onPress: async () => { await adminApi.reviewAgent(a.id, 'suspend'); load(); } },
    ]);
  };

  const handleDelete = (a: AdminAgent) => {
    Alert.alert(
      'Delete Agent',
      `Delete "${a.business_name}" and ALL their listings and bookings? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await adminApi.deleteAgent(a.id); load(); } },
      ]
    );
  };

  const handleModerate = (l: AdminListing) => {
    const action = l.available ? 'Flag' : 'Unflag';
    Alert.alert(`${action} Listing`, `${action} "${l.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action,
        style: action === 'Flag' ? 'destructive' : 'default',
        onPress: async () => { await adminApi.moderateListing(l.id, action.toLowerCase()); load(); },
      },
    ]);
  };

  const handleRemove = (l: AdminListing) => {
    Alert.alert('Remove Listing', `Remove "${l.name}" from the platform?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await adminApi.moderateListing(l.id, 'remove'); load(); } },
    ]);
  };

  const pending = agents.filter((a) => a.status === 'pending');

  const tabs = [
    { id: 'agents' as const, icon: 'store' as const, label: 'Agents' },
    { id: 'listings' as const, icon: 'home' as const, label: 'Listings' },
    { id: 'bookings' as const, icon: 'receipt' as const, label: 'Bookings' },
    { id: 'transactions' as const, icon: 'payments' as const, label: 'Transactions' },
    { id: 'users' as const, icon: 'people' as const, label: 'Users' },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.light.text, flex: 1 }}>Admin Portal</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
          <Text style={{ color: Colors.light.textSoft, fontSize: 13 }}>{user?.name}</Text>
          <Button size="sm" variant="ghost" onPress={handleLogout}>Logout</Button>
        </View>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tabChip, tab === t.id && styles.tabChipActive]}
          >
            <MaterialIcons name={t.icon} size={15} color={tab === t.id ? Colors.light.white : Colors.light.textSoft} />
            <Text style={[styles.tabLabel, tab === t.id && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {tab === 'agents' && (
          <>
            {pending.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending Approvals ({pending.length})</Text>
                {pending.map((a) => (
                  <View key={a.id} style={[styles.card, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{a.business_name}</Text>
                        <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
                          {a.name} | {a.email} | {a.phone}
                        </Text>
                      </View>
                      <BadgeView color="orange">{a.status}</BadgeView>
                    </View>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' }}>
                      <Button size="sm" onPress={() => handleApprove(a)}>Approve</Button>
                      <Button size="sm" variant="danger" onPress={() => handleReject(a)}>Reject</Button>
                      <Button size="sm" variant="danger" onPress={() => handleDelete(a)}>Delete</Button>
                    </View>
                  </View>
                ))}
              </>
            )}
            <Text style={styles.sectionTitle}>All Agents</Text>
            {agents.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No agents yet</Text>
            ) : agents.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{a.business_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{a.email}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{a.listing_count} listings</Text>
                  </View>
                  <BadgeView color={statusColor(a.status)}>{a.status}</BadgeView>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' }}>
                  {a.status === 'approved' && <Button size="sm" variant="danger" onPress={() => handleSuspend(a)}>Suspend</Button>}
                  {a.status === 'suspended' && <Button size="sm" onPress={() => handleApprove(a)}>Approve</Button>}
                  <Button size="sm" variant="danger" onPress={() => handleDelete(a)}>Delete</Button>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'listings' && (
          <>
            <Text style={styles.sectionTitle}>All Listings</Text>
            {listings.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No listings yet</Text>
            ) : listings.map((l) => (
              <View key={l.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{l.name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{l.business_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
                      {REGION_LABELS[l.region] ?? l.region} | ₦{l.price.toLocaleString()}
                    </Text>
                  </View>
                  <BadgeView color={l.available ? 'green' : 'red'}>{l.available ? 'Active' : 'Inactive'}</BadgeView>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' }}>
                  <Button size="sm" variant={l.available ? 'danger' : 'secondary'} onPress={() => handleModerate(l)}>
                    {l.available ? 'Flag' : 'Unflag'}
                  </Button>
                  <Button size="sm" variant="danger" onPress={() => handleRemove(l)}>Remove</Button>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'bookings' && (
          <>
            <Text style={styles.sectionTitle}>All Bookings</Text>
            {bookings.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No bookings yet</Text>
            ) : bookings.map((b) => (
              <View key={b.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{b.student_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{b.listing_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>₦{Number(b.total_amount).toLocaleString()}</Text>
                  </View>
                  <BadgeView color={statusColor(b.status)}>{BOOKING_STATUS_LABELS[b.status] ?? b.status}</BadgeView>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'transactions' && (
          <>
            {transactions?.summary && (
              <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg, flexWrap: 'wrap' }}>
                {[
                  { label: 'Gross Revenue', value: `₦${Number(transactions.summary.grossRevenue).toLocaleString()}`, color: Colors.light.primary },
                  { label: 'Platform Fees', value: `₦${Number(transactions.summary.platformFees).toLocaleString()}`, color: '#2563EB' },
                  { label: 'Released to Agents', value: `₦${Number(transactions.summary.released).toLocaleString()}`, color: '#16A34A' },
                ].map((s) => (
                  <View key={s.label} style={[styles.card, { flexBasis: 140, flexGrow: 1 }]}>
                    <Text style={{ fontSize: 12, color: Colors.light.textSoft }}>{s.label}</Text>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: s.color, marginTop: 4 }}>{s.value}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.sectionTitle}>Transactions</Text>
            {(transactions?.transactions || []).length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No transactions yet</Text>
            ) : (transactions?.transactions || []).map((t: any) => (
              <View key={t.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 13 }}>{t.student_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{t.listing_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>{t.paystack_ref}</Text>
                    <Text style={{ color: Colors.light.text, fontSize: 13, marginTop: 4, fontWeight: '600' }}>₦{Number(t.amount).toLocaleString()}</Text>
                  </View>
                  <BadgeView color={t.status === 'success' || t.status === 'released' || t.status === 'active' || t.status === 'completed' ? 'green' : 'orange'}>{t.status}</BadgeView>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'users' && (
          <>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' }}>
              {['', 'student', 'agent', 'admin'].map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setUserRole(r)}
                  style={[styles.chip, userRole === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, userRole === r && styles.chipTextActive]}>{r || 'All'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionTitle}>Users</Text>
            {users.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No users yet</Text>
            ) : users.map((u) => (
              <View key={u.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{u.name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{u.email}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 11, marginTop: 2 }}>
                      Joined {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                  <BadgeView color={roleColor(u.role)}>{u.role}</BadgeView>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.lg, backgroundColor: Colors.light.white, borderBottomWidth: 1, borderBottomColor: Colors.light.line },
  tabBar: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.light.white, borderBottomWidth: 1, borderBottomColor: Colors.light.line },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.line },
  tabChipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  tabLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.textSoft },
  tabLabelActive: { color: Colors.light.white },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginBottom: Spacing.md, marginTop: Spacing.lg },
  card: { backgroundColor: Colors.light.white, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.light.line, marginBottom: Spacing.md },
  chip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.line },
  chipActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.light.textSoft },
  chipTextActive: { color: Colors.light.white },
});