import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, BadgeView } from '@/components/ui';
import { Colors, Spacing, Radius, FUTA_GATE } from '@/constants/theme';
import { useFeed } from '@/lib/store';
import { listingsApi } from '@/lib/api';
import { REGION_COLORS, REGION_LABELS } from '@/lib/types';
import type { Listing } from '@/lib/types';

export default function MapScreen() {
  const router = useRouter();
  const { listings, setListings } = useFeed();
  const [selected, setSelected] = useState<Listing | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    listingsApi.list({}).then((d) => setListings(d.listings || [])).catch(console.error);
  }, []);

  const flyTo = (l: Listing) => {
    mapRef.current?.animateToRegion({ latitude: l.lat!, longitude: l.lng!, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 800);
  };

  const showMiniCard = (l: Listing) => {
    setSelected(l);
    flyTo(l);
  };

  return (
    <Screen scroll={false} bg={Colors.light.surface}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: FUTA_GATE.lat, longitude: FUTA_GATE.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        {listings.filter((l) => l.lat && l.lng).map((l) => (
          <Marker
            key={l.id}
            coordinate={{ latitude: l.lat!, longitude: l.lng! }}
            pinColor={REGION_COLORS[l.region]}
            onPress={() => showMiniCard(l)}
          />
        ))}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        {(Object.keys(REGION_LABELS) as (keyof typeof REGION_LABELS)[]).map((k) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: REGION_COLORS[k], marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: Colors.light.text }}>{REGION_LABELS[k]}</Text>
          </View>
        ))}
      </View>

      {/* Mini card popup */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.bottomSheet}>
          {selected && (
            <View style={styles.miniCard}>
              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <Image source={{ uri: selected.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300' }} style={styles.miniImg} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '700', fontSize: 15, color: Colors.light.text, flex: 1 }} numberOfLines={1}>{selected.name}</Text>
                    <BadgeView color={selected.region === 'west_gate' ? 'blue' : selected.region === 'south_gate' ? 'green' : 'orange'}>
                      {REGION_LABELS[selected.region]}
                    </BadgeView>
                  </View>
                  <Text style={{ color: Colors.light.primary, fontWeight: '700', marginTop: 4 }}>{selected.price_display}</Text>
                  {selected.walk_minutes ? (
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>🕐 {selected.walk_minutes} min walk</Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewBtn}
                onPress={() => { setSelected(null); router.push(`/listing/${selected.id}`); }}
              >
                <Text style={{ color: Colors.light.white, fontWeight: '600', fontSize: 14 }}>View Listing</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { position: 'absolute', top: Spacing.lg, right: Spacing.md, backgroundColor: Colors.light.white, borderRadius: Radius.md, padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  bottomSheet: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.15)' },
  miniCard: { backgroundColor: Colors.light.white, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.lg, paddingBottom: 40 },
  miniImg: { width: 72, height: 72, borderRadius: Radius.md },
  viewBtn: { backgroundColor: Colors.light.primary, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.lg },
});