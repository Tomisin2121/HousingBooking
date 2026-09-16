import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Platform, Alert, TouchableOpacity, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Button, BadgeView, Avatar, Modal, Input, Chip } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { listingsApi, bookingsApi, paymentsApi, messagesApi } from '@/lib/api';
import { useAuth } from '@/lib/store';
import type { Listing } from '@/lib/types';
import { REGION_LABELS, REGION_COLORS } from '@/lib/types';

const AMENITY_ICONS: Record<string, string> = {
  'Water': '💧', '24hr Light': '⚡', 'Security': '🛡️', 'Fence': '🔒', 'Parking': '🅿️', 'Wi-Fi': '📶',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [roomType, setRoomType] = useState('');
  const [moveIn, setMoveIn] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) listingsApi.get(id).then((d) => {
      setListing(d.listing);
      setRoomType(d.listing.room_types?.[0] || 'shared');
      setLoading(false);
    }).catch(console.error);
  }, [id]);

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
      // MVP: show confirmation (Paystack redirect handled on web)
      setBookingOpen(false);
      Alert.alert('Booking Created!', `Booking confirmed. Redirect to Paystack:\n${pay.authorization_url}`);
    } catch (e: any) {
      Alert.alert('Booking failed', e?.response?.data?.error || 'Try again');
    }
  };

  return (
    <Screen scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Gallery */}
          <View style={{ height: 240 }}>{listing.photos?.[0] && <Image source={{ uri: listing.photos[0] }} style={{ width: '100%', height: 240 }} />}</View>

          <View style={{ padding: Spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.light.text }}>{listing.name}</Text>
                <Text style={{ color: Colors.light.textSoft, fontSize: 13 }}>{listing.address}</Text>
              </View>
              <BadgeView color={listing.region === 'west_gate' ? 'blue' : listing.region === 'south_gate' ? 'green' : 'orange'}>
                {REGION_LABELS[listing.region]}
              </BadgeView>
            </View>

            <TouchableOpacity onPress={handleSave} style={{ position: 'absolute', top: Spacing.lg, right: 0, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name={listing.is_saved ? 'bookmark' : 'bookmark-border'} size={20} color={listing.is_saved ? Colors.light.primary : Colors.light.textSoft} />
            </TouchableOpacity>

            {/* Price */}
            <View style={{ backgroundColor: Colors.light.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.md }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.light.primary }}>₦{listing.price.toLocaleString()}<Text style={{ fontSize: 13, fontWeight: '400' }}> / month</Text></Text>
              <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
                Platform fee ₦{listing.platform_fee.toLocaleString()} · Caution ₦{listing.caution_fee.toLocaleString()}
              </Text>
            </View>

            {listing.walk_minutes ? (
              <Text style={{ color: Colors.light.textSoft, fontSize: 13, marginTop: Spacing.md }}>🕐 {listing.walk_minutes} min walk from FUTA main gate</Text>
            ) : null}

            {listing.description ? (
              <Text style={{ color: Colors.light.textSoft, fontSize: 14, marginTop: Spacing.lg, lineHeight: 20 }}>{listing.description}</Text>
            ) : null}

            {/* Room types */}
            <Text style={styles.sectionTitle}>Room Types</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {listing.room_types.map((rt) => <BadgeView key={rt}>{rt.replace('_', ' ')}</BadgeView>)}
            </View>

            {/* Amenities */}
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              {listing.amenities.map((a) => <BadgeView key={a} color="green">{AMENITY_ICONS[a] || '✓'} {a}</BadgeView>)}
            </View>

            {/* Agent card */}
            <View style={{ backgroundColor: Colors.light.surface, borderRadius: Radius.md, padding: Spacing.lg, marginTop: Spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={listing.agent_name} src={listing.agent_avatar} />
                <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontWeight: '600', color: Colors.light.text, fontSize: 14 }}>{listing.agent_name}</Text>
                    {listing.agent_verified ? <BadgeView color="green">Verified</BadgeView> : null}
                  </View>
                  <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>{listing.business_name}</Text>
                  <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>Usually replies within 1 hour</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl }}>
              <Button variant="secondary" style={{ flex: 1 }} onPress={handleMessage}>
                💬 Message Agent
              </Button>
              <Button style={{ flex: 1 }} onPress={() => setBookingOpen(true)}>Book Now</Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
});