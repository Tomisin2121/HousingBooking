import { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Chip, BadgeView } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useFeed } from '@/lib/store';
import { listingsApi } from '@/lib/api';
import type { Listing } from '@/lib/types';
import { REGION_LABELS } from '@/lib/types';

function ListingCardView({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.card}>
      <Image source={{ uri: listing.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300' }} style={styles.cardImg} />
      <View style={{ flex: 1, padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{listing.name}</Text>
          <BadgeView color={listing.region === 'west_gate' ? 'blue' : listing.region === 'south_gate' ? 'green' : 'orange'}>
            {REGION_LABELS[listing.region]}
          </BadgeView>
        </View>
        <Text style={styles.cardSub} numberOfLines={1}>{listing.address}</Text>
        <Text style={styles.cardPrice}>{listing.price_display}</Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <Text style={styles.cardMeta}>🕐 {listing.walk_minutes || '?'} min walk</Text>
          <Text style={[styles.cardMeta, { marginLeft: Spacing.md }]}>🗂 {listing.available_rooms} rooms</Text>
        </View>
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
      <View style={styles.chipsRow}>
        {regions.map((r) => (
          <Chip key={r.value} label={r.label} active={filters.region === r.value} onPress={() => setFilter('region', r.value)} />
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCardView listing={item} onPress={() => router.push(`/listing/${item.id}`)} />}
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
  chipsRow: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  card: { flexDirection: 'row', backgroundColor: Colors.light.white, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.light.line, marginBottom: Spacing.md, overflow: 'hidden' },
  cardImg: { width: 96, height: 106 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, flex: 1, marginRight: Spacing.sm },
  cardSub: { fontSize: 12, color: Colors.light.textSoft, marginTop: 2 },
  cardPrice: { fontSize: 14, fontWeight: '700', color: Colors.light.primary, marginTop: 6 },
  cardMeta: { fontSize: 11, color: Colors.light.textSoft },
});