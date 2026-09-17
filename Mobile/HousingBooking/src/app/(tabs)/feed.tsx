import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Chip, BadgeView, Avatar, Button } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useFeed } from '@/lib/store';
import { listingsApi, messagesApi } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { REGION_LABELS } from '@/lib/types';

const AMENITY_LABELS: Record<string, string> = {
  'Water': 'Water',
  '24hr Light': 'Light',
  'Security': 'Security',
  'Fence': 'Fence',
  'Parking': 'Parking',
  'Wi-Fi': 'Wi-Fi',
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
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

function regionColor(region: string): 'blue' | 'green' | 'orange' {
  return region === 'west_gate' ? 'blue' : region === 'south_gate' ? 'green' : 'orange';
}

function ListingCardView({ listing, onOpen, onMessage, onBook }: {
  listing: Listing;
  onOpen: () => void;
  onMessage: () => void;
  onBook: () => void;
}) {
  const isNew = isNewListing(listing.created_at);
  const lowRooms = listing.available_rooms <= 2;
  const amenities = (listing.amenities || []).map((a) => AMENITY_LABELS[a] || a).slice(0, 4);

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onOpen} style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Avatar name={listing.agent_name} src={listing.agent_avatar} size="sm" />
        <Text style={styles.agentName} numberOfLines={1}>{listing.agent_name}</Text>
        <BadgeView color={regionColor(listing.region)}>{REGION_LABELS[listing.region]}</BadgeView>
        {isNew && (
          <View style={styles.newChip}>
            <View style={styles.newDot} />
            <Text style={styles.newText}>New</Text>
          </View>
        )}
      </View>
      {/* Meta */}
      <View style={styles.headerMeta}>
        <Text style={styles.cardMeta}>{listing.walk_minutes || '?'} min walk</Text>
        <Text style={styles.metaSep}>·</Text>
        <Text style={styles.cardMeta}>{listing.available_rooms} rooms</Text>
        <Text style={styles.metaSep}>·</Text>
        <Text style={styles.cardMeta}>{timeAgo(listing.created_at)}</Text>
      </View>

      {/* Photo */}
      <Image source={{ uri: listing.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300' }} style={styles.cardImg} />

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{listing.name}</Text>
        <Text style={styles.cardSub} numberOfLines={1}>{listing.address}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <Text style={styles.cardPrice}>{listing.price_display}</Text>
          {lowRooms && (
            <View style={styles.lowChip}>
              <Text style={styles.lowText}>Only {listing.available_rooms} rooms left</Text>
            </View>
          )}
        </View>
        {amenities.length > 0 && (
          <View style={styles.amenitiesRow}>
            {amenities.map((a) => (
              <View key={a} style={styles.amenityChip}>
                <MaterialIcons name="check" size={10} color={Colors.light.primary} />
                <Text style={styles.amenityText}>{a}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Button variant="secondary" size="sm" style={{ flex: 1 }} onPress={onMessage}>Message Agent</Button>
        <Button size="sm" style={{ flex: 1 }} onPress={onBook}>Book Now</Button>
      </View>
    </TouchableOpacity>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { listings, filters, setListings, setFilter } = useFeed();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    listingsApi.list(filters)
      .then((d) => setListings(d.listings || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const filtered = listings.filter(
    (l) => !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.address.toLowerCase().includes(search.toLowerCase())
  );

  const regions = [
    { label: 'All', value: 'all' },
    { label: 'West Gate', value: 'west_gate' },
    { label: 'South Gate', value: 'south_gate' },
    { label: 'North Gate', value: 'north_gate' },
  ];

  const handleMessage = async (id: string) => {
    try {
      const { conversation } = await messagesApi.start(id);
      router.push(`/chat/${conversation.id}`);
    } catch {
      // could not open conversation
    }
  };
  const handleBook = (l: Listing) => router.push(`/listing/${l.id}`);

  return (
    <Screen scroll={false}>
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color={Colors.light.textMuted} />
          <TextInput
            placeholder="Search hostels..."
            placeholderTextColor={Colors.light.textMuted}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: Colors.light.text }]}
          />
        </View>
      </View>
      <View style={styles.chipsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {regions.map((r) => (
            <Chip key={r.value} label={r.label} active={filters.region === r.value} onPress={() => setFilter('region', r.value)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCardView
            listing={item}
            onOpen={() => router.push(`/listing/${item.id}`)}
            onMessage={() => handleMessage(item.id)}
            onBook={() => handleBook(item)}
          />
        )}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ color: Colors.light.textMuted }}>{loading ? 'Loading...' : 'No listings found'}</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.surface, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  searchInput: { flex: 1, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 14, marginLeft: Spacing.sm },
  chipsWrap: { height: 40, marginBottom: Spacing.md },
  chipsRow: { paddingHorizontal: Spacing.md, alignItems: 'center' },
  card: { backgroundColor: Colors.light.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.light.line, marginBottom: Spacing.lg, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.md, paddingBottom: 0 },
  agentName: { fontSize: 13, fontWeight: '600', color: Colors.light.text, flexShrink: 1 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 4, marginBottom: 4 },
  cardMeta: { fontSize: 11, color: Colors.light.textSoft },
  metaSep: { fontSize: 11, color: Colors.light.textMuted, marginHorizontal: 4 },
  cardImg: { width: '100%', height: 200 },
  cardBody: { padding: Spacing.md, paddingBottom: 0 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  cardSub: { fontSize: 12, color: Colors.light.textSoft, marginTop: 2 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  lowChip: { marginLeft: Spacing.sm, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA' },
  lowText: { fontSize: 10, fontWeight: '600', color: Colors.light.red },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.sm },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill, backgroundColor: Colors.light.primaryLight },
  amenityText: { fontSize: 11, fontWeight: '500', color: Colors.light.primary },
  cardFooter: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, marginTop: 2 },
  newChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill, backgroundColor: '#DCFCE7' },
  newDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.green },
  newText: { fontSize: 9, fontWeight: '700', color: Colors.light.green },
});