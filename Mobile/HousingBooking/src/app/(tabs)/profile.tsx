import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Avatar, BadgeView, Button } from '@/components/ui';
import { useAuth, useBookings } from '@/lib/store';
import { bookingsApi, listingsApi } from '@/lib/api';
import type { Booking } from '@/lib/types';
import { BOOKING_STATUS_LABELS, REGION_LABELS } from '@/lib/types';
import { Colors, Spacing, Radius } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, agent, logout } = useAuth();
  const { bookings, setBookings } = useBookings();
  const [saved, setSaved] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'bookings' | 'saved'>('bookings');

  const load = async () => {
    try {
      const [b, s] = await Promise.all([bookingsApi.my(), listingsApi.saved()]);
      setBookings(b.bookings || []);
      setSaved(s.listings || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleDispute = (b: Booking) => {
    Alert.prompt('Dispute Booking', 'Reason:', async (reason) => {
      if (reason) {
        await bookingsApi.dispute(b.id, reason);
        load();
      }
    });
  };

  return (
    <Screen scroll>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View style={styles.header}>
          <Avatar name={user?.name || 'U'} src={user?.avatar} size="lg" />
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.light.text, marginTop: Spacing.md }}>{user?.name}</Text>
          <Text style={{ color: Colors.light.textSoft, fontSize: 13 }}>{user?.email}</Text>
          {user?.role === 'student' && user?.matric_no ? (
            <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>{user.matric_no} | {user.department}</Text>
          ) : null}
          {user?.role === 'agent' ? (
            <View style={{ marginTop: Spacing.sm }}>
              <BadgeView color={agent?.verified ? 'green' : 'orange'}>{agent?.verified ? '✓ Verified Agent' : 'Pending Approval'}</BadgeView>
              <Text style={{ color: Colors.light.textSoft, fontSize: 12, textAlign: 'center', marginTop: 4 }}>{agent?.business_name}</Text>
            </View>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['bookings', 'saved'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabActive]}>
              <Text style={{ color: tab === t ? Colors.light.primary : Colors.light.textSoft, fontWeight: '600', fontSize: 13 }}>
                {t === 'bookings' ? 'My Bookings' : 'Saved'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {tab === 'bookings' ? (
          <View>
            {bookings.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No bookings yet</Text>
            ) : bookings.map((b) => (
              <View key={b.id} style={styles.bookingCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{b.listing_name}</Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
                      {b.room_type.replace('_', ' ')} | {b.move_in_date} | {REGION_LABELS[b.region]}
                    </Text>
                  </View>
                  <BadgeView color={
                    b.status === 'paid' ? 'blue' : ['confirmed', 'active', 'completed'].includes(b.status) ? 'green' : b.status === 'pending_payment' ? 'orange' : 'red'
                  }>
                    {BOOKING_STATUS_LABELS[b.status]}
                  </BadgeView>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md }}>
                  <Text style={{ fontWeight: '700', color: Colors.light.primary, fontSize: 14 }}>₦{b.total_amount.toLocaleString()}</Text>
                  <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>{b.business_name}</Text>
                </View>
                {b.status === 'active' && (
                  <Button variant="ghost" size="sm" onPress={() => handleDispute(b)} style={styles.disputeBtn}>
                    File Dispute
                  </Button>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View>
            {saved.length === 0 ? (
              <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No saved listings</Text>
            ) : saved.map((l: any) => (
              <TouchableOpacity key={l.id} style={styles.bookingCard} onPress={() => router.push(`/listing/${l.id}`)}>
                <View style={{ flexDirection: 'row' }}>
                  <Image source={{ uri: l.photos?.[0] || 'https://picsum.photos/seed/ph/400/300' }} style={{ width: 64, height: 64, borderRadius: Radius.sm }} />
                  <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: Colors.light.text }}>{l.name}</Text>
                    <Text style={{ color: Colors.light.primary, fontSize: 13 }}>₦{l.price.toLocaleString()}/month</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Role entry points */}
        {user?.role === 'agent' && (
          <Button variant="primary" onPress={() => router.push('/agent/index')} style={styles.entryBtn}>
            <MaterialIcons name="storefront" size={16} color={Colors.light.white} style={{ marginRight: 6 }} /> Agent Dashboard
          </Button>
        )}
        {user?.role === 'admin' && (
          <Button variant="primary" onPress={() => router.push('/admin/index')} style={styles.entryBtn}>
            <MaterialIcons name="shield" size={16} color={Colors.light.white} style={{ marginRight: 6 }} /> Admin Portal
          </Button>
        )}

        {/* Logout */}
        <Button variant="danger" onPress={() => { logout(); router.replace('/login'); }} style={{ marginTop: Spacing.xl }}>
          <MaterialIcons name="logout" size={16} color={Colors.light.white} style={{ marginRight: 6 }} /> Logout
        </Button>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: Spacing.xl, paddingTop: Spacing.xxl },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 2, borderBottomColor: Colors.light.line },
  tabActive: { borderBottomColor: Colors.light.primary },
  bookingCard: { backgroundColor: Colors.light.white, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.light.line, marginBottom: Spacing.md, marginHorizontal: Spacing.md },
  disputeBtn: { marginTop: Spacing.sm, borderWidth: 1, borderColor: '#FECACA' },
  entryBtn: { marginHorizontal: Spacing.md, marginTop: Spacing.sm },
});