import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Platform, Alert, TouchableOpacity, Linking, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Button, BadgeView, Avatar, Modal, Input, Chip } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { listingsApi, bookingsApi, paymentsApi, messagesApi } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { REGION_LABELS } from '@/lib/types';

const AMENITY_ICONS: Record<string, string> = {
  'Water': '💧', '24hr Light': '⚡', 'Security': '🛡️', 'Fence': '🔒', 'Parking': '🅿️', 'Wi-Fi': '📶',
};

const AMENITY_LABELS: Record<string, string> = {
  'Water': 'Water',
  '24hr Light': 'Light',
  'Security': 'Security',
  'Fence': 'Fence',
  'Parking': 'Parking',
  'Wi-Fi': 'Wi-Fi',
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

function regionColor(region: string): 'blue' | 'green' | 'orange' {
  return region === 'west_gate' ? 'blue' : region === 'south_gate' ? 'green' : 'orange';
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [roomType, setRoomType] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (id) listingsApi.get(id).then((d) => {
      setListing(d.listing);
      setRoomType(d.listing.room_types?.[0] || 'shared');
      setLoading(false);
    }).catch(console.error);
  }, [id]);

  const photos = listing?.photos?.length ? listing.photos : ['https://picsum.photos/seed/placeholder/800/600'];
  const imgHeight = Math.round((windowWidth * 9) / 16);
  const amenityItemWidth = (windowWidth - Spacing.lg * 2 - Spacing.sm * 2) / 3;

  if (!listing) {
    return (
      <Screen><View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}><Text style={{ color: Colors.light.textMuted }}>{loading ? 'Loading...' : 'Listing not found'}</Text></View></Screen>
    );
  }

  const handleMessage = async () => {
    try {
      const { conversation } = await messagesApi.start(listing.id);
      router.push(`/chat/${conversation.id}`);
    } catch {
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (listing.is_saved) await listingsApi.unsave(listing.id);
      else await listingsApi.save(listing.id);
      setListing({ ...listing, is_saved: !listing.is_saved });
    } finally { setSaving(false); }
  };

  const handleBook = async () => {
    if (!moveIn) { Alert.alert('Move-in date required'); return; }
    try {
      const { booking } = await bookingsApi.create({ listing_id: listing.id, room_type: roomType, move_in_date: moveIn });
      const pay = await paymentsApi.initialize(booking.id);
      setBookingOpen(false);
      Alert.alert('Booking Created!', `Booking confirmed. Redirect to Paystack:\n${pay.authorization_url}`);
    } catch (e: any) {
      Alert.alert('Booking failed', e?.response?.data?.error || 'Try again');
    }
  };

  return (
    <Screen scroll={false} bg={Colors.light.background}>
      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / windowWidth);
            setPhotoIndex(Math.max(0, Math.min(i, photos.length - 1)));
          }}
        >
          {photos.map((p, i) => (
            <Image key={i} source={{ uri: p }} style={{ width: windowWidth, height: imgHeight }} />
          ))}
        </ScrollView>
        {photos.length > 1 && (
          <View style={[styles.dots, { top: imgHeight - 20 }]}>
            {photos.map((_, i) => (
              <View key={i} style={[styles.dot, i === photoIndex && styles.dotActive]} />
            ))}
          </View>
        )}
        {/* Save */}
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <MaterialIcons name={listing.is_saved ? 'bookmark' : 'bookmark-border'} size={22} color={listing.is_saved ? Colors.light.primary : Colors.light.textSoft} />
        </TouchableOpacity>

        <View style={{ padding: Spacing.lg }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: Spacing.md }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.light.text }}>{listing.name}</Text>
              <Text style={{ color: Colors.light.textSoft, fontSize: 13, marginTop: 2 }}>{listing.business_name}</Text>
            </View>
            <BadgeView color={regionColor(listing.region)}>{REGION_LABELS[listing.region]}</BadgeView>
          </View>

          {/* Verified + walk */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm }}>
            {listing.agent_verified ? <BadgeView color="green">✓ Verified Agent</BadgeView> : null}
            <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>~{listing.walk_minutes || '?'} min walk to FUTA gate</Text>
          </View>

          {/* Price */}
          <View style={{ marginTop: Spacing.md }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: Colors.light.primary }}>
              ₦{listing.price.toLocaleString()}<Text style={{ fontSize: 13, fontWeight: '400', color: Colors.light.textSoft }}> / month</Text>
            </Text>
            <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
              Platform fee ₦{listing.platform_fee.toLocaleString()} · Caution ₦{listing.caution_fee.toLocaleString()}
            </Text>
          </View>

          {/* Address + map link */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg }}
            onPress={() => {
              if (listing.lat && listing.lng) Linking.openURL(`https://www.google.com/maps?q=${listing.lat},${listing.lng}`).catch(() => {});
            }}
          >
            <MaterialIcons name="location-on" size={18} color={Colors.light.textSoft} />
            <Text style={{ flex: 1, color: Colors.light.text, fontSize: 13 }}>{listing.address}</Text>
            {listing.lat && listing.lng && <Text style={{ color: Colors.light.primary, fontSize: 13, fontWeight: '600' }}>View on map</Text>}
          </TouchableOpacity>

          {/* Description */}
          {listing.description ? (
            <Text style={{ color: Colors.light.textSoft, fontSize: 14, marginTop: Spacing.lg, lineHeight: 20 }}>{listing.description}</Text>
          ) : null}

          {/* Amenities grid */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {(listing.amenities || []).map((a) => (
              <View key={a} style={[styles.amenityItem, { width: amenityItemWidth }]}>
                <Text style={{ fontSize: 16 }}>{AMENITY_ICONS[a] || '✓'}</Text>
                <Text style={styles.amenityLabel} numberOfLines={1}>{AMENITY_LABELS[a] || a}</Text>
              </View>
            ))}
          </View>

          {/* Room types + prices */}
          <Text style={styles.sectionTitle}>Room types</Text>
          <View style={{ gap: Spacing.sm }}>
            {listing.room_types.map((rt) => (
              <View key={rt} style={styles.roomRow}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.light.text }}>{ROOM_TYPE_LABELS[rt] || rt.replace('_', ' ')}</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.light.primary }}>₦{roomPrice(rt, listing.price).toLocaleString()}/mo</Text>
              </View>
            ))}
          </View>

          {/* Agent card */}
          <View style={styles.agentCard}>
            <Avatar name={listing.agent_name} src={listing.agent_avatar} />
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 15 }}>{listing.agent_name}</Text>
                {listing.agent_verified ? <BadgeView color="green">Verified Agent</BadgeView> : null}
              </View>
              <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 1 }}>{listing.business_name}</Text>
              <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 1 }}>Usually replies within 1 hour</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed bottom CTA bar */}
      <View style={styles.ctaBar}>
        <Button variant="secondary" style={{ flex: 1 }} onPress={handleMessage}>
          💬 Message Agent
        </Button>
        <Button style={{ flex: 1 }} onPress={() => setBookingOpen(true)}>Book Now</Button>
      </View>

      {/* Booking modal */}
      <Modal visible={bookingOpen} onClose={() => setBookingOpen(false)} title={`Book ${listing.name}`}>
        <Text style={{ fontSize: 13, color: Colors.light.textSoft, marginBottom: Spacing.sm }}>Room Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.lg }}>
          {listing.room_types.map((rt) => (
            <Chip key={rt} label={rt.replace('_', ' ')} active={roomType === rt} onPress={() => setRoomType(rt)} />
          ))}
        </View>
        <Input label="Move-in Date" placeholder="YYYY-MM-DD" value={moveIn} onChangeText={setMoveIn} />
        <View style={{ backgroundColor: Colors.light.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.lg }}>
          {[
            ['Rent', `₦${listing.price.toLocaleString()}`],
            ['Platform fee (2%)', `₦${listing.platform_fee.toLocaleString()}`],
            ['Caution fee', `₦${listing.caution_fee.toLocaleString()}`],
          ].map(([k, v]) => (
            <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: Colors.light.textSoft, fontSize: 13 }}>{k}</Text>
              <Text style={{ color: Colors.light.text, fontSize: 13 }}>{v}</Text>
            </View>
          ))}
          <View style={{ borderTopWidth: 1, borderTopColor: Colors.light.line, marginTop: 4, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', color: Colors.light.text }}>Total</Text>
            <Text style={{ fontWeight: '700', color: Colors.light.primary }}>₦{listing.total_estimate.toLocaleString()}</Text>
          </View>
        </View>
        <Button onPress={handleBook} style={{ width: '100%' }}>Pay & Book</Button>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  dots: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#ffffff', width: 18 },
  saveBtn: { position: 'absolute', top: 12, right: Spacing.lg, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: 8 },
  amenityItem: { backgroundColor: Colors.light.primaryLight, borderWidth: 1, borderColor: 'rgba(27,94,32,0.15)', borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', paddingHorizontal: 4 },
  amenityLabel: { fontSize: 12, fontWeight: '500', color: Colors.light.text, marginTop: 4 },
  roomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: Colors.light.line, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 12 },
  agentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.surface, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.xl },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.light.white, borderTopWidth: 1, borderTopColor: Colors.light.line },
});