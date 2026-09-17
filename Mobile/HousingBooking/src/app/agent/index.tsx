import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Button, Input, Chip, BadgeView } from '@/components/ui';
import { useAuth } from '@/lib/store';
import { listingsApi, bookingsApi } from '@/lib/api';
import type { Listing, Booking, Region, RoomType } from '@/lib/types';
import { BOOKING_STATUS_LABELS, REGION_LABELS } from '@/lib/types';
import { Colors, Spacing, Radius } from '@/constants/theme';

const REGIONS: { label: string; value: Region }[] = [
  { label: 'West Gate', value: 'west_gate' },
  { label: 'South Gate', value: 'south_gate' },
  { label: 'North Gate', value: 'north_gate' },
];

const ROOM_TYPES: RoomType[] = ['self_contain', '1_bedroom', '2_bedroom', 'shared'];
const AMENITIES = ['Water', '24hr Light', 'Security', 'Fence', 'Parking', 'Wi-Fi'];

type Tab = 'listings' | 'new' | 'bookings';

export default function AgentDashboardScreen() {
  const router = useRouter();
  const { user, agent } = useAuth();
  const [tab, setTab] = useState<Tab>('new');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [l, b] = await Promise.all([listingsApi.list(), bookingsApi.agent()]);
      setListings(l.listings || []);
      setBookings(b.bookings || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.role !== 'agent') router.replace('/(tabs)/feed');
  }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (user?.role !== 'agent') return null;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, alignSelf: 'flex-start' }}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialIcons name="arrow-back" size={22} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.light.text, flex: 1 }}>{agent?.business_name || 'Agent Dashboard'}</Text>
            </View>
            <View style={{ marginTop: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
              <Text style={{ color: Colors.light.textSoft, fontSize: 13 }}>{user?.name}</Text>
              <BadgeView color={agent?.verified ? 'green' : 'orange'}>{agent?.verified ? '✓ Verified Agent' : 'Pending Approval'}</BadgeView>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            {([['new', 'Post Listing'], ['listings', 'My Listings'], ['bookings', 'Bookings']] as [Tab, string][]).map(([k, label]) => (
              <TouchableOpacity key={k} onPress={() => setTab(k)} style={[styles.tabBtn, tab === k && styles.tabActive]}>
                <Text style={{ color: tab === k ? Colors.light.primary : Colors.light.textSoft, fontWeight: '600', fontSize: 13 }}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ paddingHorizontal: Spacing.lg }}>
            {tab === 'listings' && (
              listings.length === 0 ? (
                <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 48 }}>
                  No listings yet. Tap "New Listing" to post one.
                </Text>
              ) : listings.map((l) => (
                <View key={l.id} style={styles.card}>
                  <View style={{ flexDirection: 'row' }}>
                    <Image source={{ uri: l.photos?.[0] || 'https://picsum.photos/seed/ph/400/300' }} style={{ width: 72, height: 72, borderRadius: Radius.sm }} />
                    <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{l.name}</Text>
                      <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>{l.address}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <BadgeView color={l.region === 'west_gate' ? 'blue' : l.region === 'south_gate' ? 'green' : 'orange'}>{REGION_LABELS[l.region]}</BadgeView>
                        <BadgeView color={l.available ? 'green' : 'red'}>{l.available ? 'Active' : 'Inactive'}</BadgeView>
                      </View>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.md }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.primary, fontSize: 15 }}>₦{l.price.toLocaleString()}</Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <Button size="sm" variant="secondary" onPress={() => handleToggle(l)}>
                        {l.available ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="danger" onPress={() => handleDelete(l)}>Delete</Button>
                    </View>
                  </View>
                </View>
              ))
            )}

            {tab === 'new' && (
              <NewListingForm onPosted={() => { setTab('listings'); load(); }} />
            )}

            {tab === 'bookings' && (
              bookings.length === 0 ? (
                <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 48 }}>No bookings yet</Text>
              ) : bookings.map((b) => (
                <View key={b.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{b.listing_name}</Text>
                      <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
                        {b.student_name} | {b.room_type.replace('_', ' ')} | Move-in: {b.move_in_date}
                      </Text>
                      <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>{REGION_LABELS[b.region]} | ₦{b.total_amount.toLocaleString()}</Text>
                    </View>
                    <BadgeView color={
                      b.status === 'paid' ? 'blue' : ['confirmed', 'active', 'completed'].includes(b.status) ? 'green' : b.status === 'pending_payment' ? 'orange' : 'red'
                    }>
                      {BOOKING_STATUS_LABELS[b.status]}
                    </BadgeView>
                  </View>
                  {b.status === 'paid' && (
                    <Button size="sm" onPress={async () => { await bookingsApi.confirm(b.id); load(); }} style={{ marginTop: Spacing.md }}>
                      Confirm Booking
                    </Button>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );

  async function handleToggle(l: Listing) {
    try {
      await listingsApi.update(l.id, { available: !l.available });
      load();
    } catch {}
  }

  async function handleDelete(l: Listing) {
    Alert.alert('Delete Listing', `Delete "${l.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await listingsApi.remove(l.id); load(); } },
    ]);
  }
}

function NewListingForm({ onPosted }: { onPosted: () => void }) {
  const [form, setForm] = useState({
    name: '', region: 'west_gate' as Region, address: '', description: '',
    price: '', room_types: ['shared'] as RoomType[], amenities: [] as string[],
    available_rooms: '1', walk_minutes: '', lat: '', lng: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const toggleInArray = <T,>(arr: T[], v: T, keepOne = false): T[] => {
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    return keepOne ? (next.length ? next : arr) : next;
  };

  const submit = async () => {
    if (!form.name || !form.address || !form.price) { setError('Name, address and price are required'); return; }
    setError('');
    setLoading(true);
    try {
      await listingsApi.create({
        name: form.name,
        region: form.region,
        address: form.address,
        description: form.description,
        price: Number(form.price),
        room_types: form.room_types,
        amenities: form.amenities,
        available_rooms: Number(form.available_rooms || 1),
        walk_minutes: form.walk_minutes ? Number(form.walk_minutes) : undefined,
        lat: form.lat ? Number(form.lat) : undefined,
        lng: form.lng ? Number(form.lng) : undefined,
        photos: [],
      });
      Alert.alert('Posted!', 'Your listing is now live on the feed.');
      onPosted();
    } catch {
      setError('Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ marginTop: Spacing.sm }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: Spacing.md }}>Post New Listing</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Input label="Hostel Name" value={form.name} onChangeText={(t) => set({ name: t })} placeholder="e.g. White Walls Hostel" />

      <Text style={styles.label}>Region</Text>
      <View style={{ flexDirection: 'row', marginBottom: Spacing.md }}>
        {REGIONS.map((r) => (
          <Chip key={r.value} label={r.label} active={form.region === r.value} onPress={() => set({ region: r.value })} />
        ))}
      </View>

      <Input label="Price / month (₦)" value={form.price} onChangeText={(t) => set({ price: t })} keyboardType="numeric" placeholder="45000" />
      <Input label="Address" value={form.address} onChangeText={(t) => set({ address: t })} placeholder="4 White Walls Road, West Gate" />
      <Input label="Description" value={form.description} onChangeText={(t) => set({ description: t })} multiline placeholder="Describe the hostel, utilities, security..." />

      <Text style={styles.label}>Room Types</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md }}>
        {ROOM_TYPES.map((rt) => (
          <View key={rt} style={{ marginBottom: Spacing.sm }}>
            <Chip label={rt.replace('_', ' ')} active={form.room_types.includes(rt)} onPress={() => set({ room_types: toggleInArray(form.room_types, rt, true) })} />
          </View>
        ))}
      </View>

      <Text style={styles.label}>Amenities</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md }}>
        {AMENITIES.map((a) => (
          <View key={a} style={{ marginBottom: Spacing.sm }}>
            <Chip label={a} active={form.amenities.includes(a)} onPress={() => set({ amenities: toggleInArray(form.amenities, a) })} />
          </View>
        ))}
      </View>

      <Input label="Available Rooms" value={form.available_rooms} onChangeText={(t) => set({ available_rooms: t })} keyboardType="numeric" />
      <Input label="Minutes walk to gate" value={form.walk_minutes} onChangeText={(t) => set({ walk_minutes: t })} keyboardType="numeric" placeholder="10" />
      <View style={{ flexDirection: 'row', gap: Spacing.md }}>
        <View style={{ flex: 1 }}>
          <Input label="Latitude" value={form.lat} onChangeText={(t) => set({ lat: t })} keyboardType="decimal-pad" placeholder="7.2868" />
        </View>
        <View style={{ flex: 1 }}>
          <Input label="Longitude" value={form.lng} onChangeText={(t) => set({ lng: t })} keyboardType="decimal-pad" placeholder="5.1298" />
        </View>
      </View>

      <Button onPress={submit} loading={loading} style={{ marginTop: Spacing.sm }}>Publish Listing</Button>
      <Text style={{ color: Colors.light.textMuted, fontSize: 11, textAlign: 'center', marginTop: Spacing.sm }}>
        Your post will appear on the student feed immediately.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.lg, backgroundColor: Colors.light.white, borderBottomWidth: 1, borderBottomColor: Colors.light.line },
  backBtn: { padding: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, backgroundColor: Colors.light.white },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: Colors.light.line },
  tabActive: { borderBottomColor: Colors.light.primary },
  card: { backgroundColor: Colors.light.white, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.light.line, marginBottom: Spacing.md },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6, color: Colors.light.text },
  error: { backgroundColor: '#FEE2E2', color: Colors.light.red, fontSize: 13, textAlign: 'center', padding: 10, borderRadius: Radius.sm, marginBottom: Spacing.md },
});