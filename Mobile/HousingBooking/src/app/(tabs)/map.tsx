import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, Modal, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, BadgeView } from '@/components/ui';
import { Colors, Spacing, Radius, FUTA_GATE } from '@/constants/theme';
import { useFeed } from '@/lib/store';
import { listingsApi } from '@/lib/api';
import { REGION_COLORS, REGION_LABELS } from '@/lib/types';
import type { Listing } from '@/lib/types';

const GOOGLE_DIRECTIONS_API_KEY = '';

type LatLng = { latitude: number; longitude: number };

type RouteState = {
  listingId: string;
  listingName: string;
  points: LatLng[];
  distanceText: string;
  durationText: string;
  gps: boolean;
};

function decodePolyline(t: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < t.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = t.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

function haversineM(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function MapScreen() {
  const router = useRouter();
  const { listings, setListings } = useFeed();
  const [selected, setSelected] = useState<Listing | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState<RouteState | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    listingsApi.list({}).then((d) => setListings(d.listings || [])).catch(console.error);
  }, []);

  const flyTo = (l: Listing, delta = 0.008) => {
    mapRef.current?.animateToRegion(
      { latitude: l.lat!, longitude: l.lng!, latitudeDelta: delta, longitudeDelta: delta },
      800
    );
  };

  const locateUser = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Permission denied');
      const pos = await Location.getCurrentPositionAsync({});
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setUserLoc(loc);
      mapRef.current?.animateToRegion(
        { latitude: loc.latitude, longitude: loc.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 },
        800
      );
    } catch {
      Alert.alert('Location unavailable', 'Could not get your location, showing FUTA main gate.');
    } finally {
      setLocating(false);
    }
  };

  const getDirections = async (l: Listing) => {
    let origin = userLoc;
    let gps = !!origin;
    if (!origin) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          origin = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          gps = true;
          setUserLoc(origin);
        }
      } catch {
        // fall through to gate origin
      }
    }
    if (!origin) origin = { latitude: FUTA_GATE.lat, longitude: FUTA_GATE.lng };

    const dest: LatLng = { latitude: l.lat!, longitude: l.lng! };
    let points: LatLng[] = [];
    let distanceText = '';
    let durationText = '';

    if (GOOGLE_DIRECTIONS_API_KEY) {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${dest.latitude},${dest.longitude}&mode=walking&key=${GOOGLE_DIRECTIONS_API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes?.[0]) {
          points = decodePolyline(json.routes[0].overview_polyline?.points || '');
          const leg = json.routes[0].legs?.[0];
          distanceText = leg?.distance?.text || '';
          durationText = leg?.duration?.text || '';
        }
      } catch {
        // fall back to estimate below
      }
    }

    if (points.length === 0) {
      points = [origin, dest];
      if (!distanceText) {
        const m = Math.round(haversineM(origin, dest));
        distanceText = m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
        durationText = `${Math.max(1, Math.round(m / 80))} min`;
      }
    }

    setRoute({ listingId: l.id, listingName: l.name, points, distanceText, durationText, gps });
    flyTo(l, 0.01);
  };

  const showMiniCard = (l: Listing) => {
    setSelected(l);
    flyTo(l);
  };

  const activeRoute = route?.listingId === selected?.id ? route : null;

  return (
    <Screen scroll={false} bg={Colors.light.surface}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: FUTA_GATE.lat, longitude: FUTA_GATE.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        {userLoc && (
          <Marker coordinate={userLoc} title="You">
            <View style={styles.userDot} />
          </Marker>
        )}
        {route && route.points.length > 0 && (
          <Polyline
            coordinates={route.points}
            strokeColor={Colors.light.primary}
            strokeWidth={4}
            lineDashPattern={[1, 0]}
          />
        )}
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

      {/* My location button */}
      <TouchableOpacity
        style={[styles.locBtn, { bottom: sheetOpen ? 200 : 92 }]}
        onPress={locateUser}
        disabled={locating}
      >
        <MaterialIcons name="my-location" size={20} color={userLoc ? Colors.light.primary : Colors.light.text} />
      </TouchableOpacity>

      {/* Hostel bottom sheet */}
      <View style={styles.sheet}>
        <TouchableOpacity style={styles.sheetHeader} onPress={() => setSheetOpen((v) => !v)}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.light.text }}>
            Hostels near FUTA ({listings.length})
          </Text>
          <MaterialIcons name={sheetOpen ? 'expand-more' : 'expand-less'} size={22} color={Colors.light.textSoft} />
        </TouchableOpacity>
        {sheetOpen && (
          <ScrollView style={{ maxHeight: '42%' }} nestedScrollEnabled>
            {listings.filter((l) => l.lat && l.lng).map((l) => (
              <TouchableOpacity key={l.id} style={styles.sheetRow} onPress={() => showMiniCard(l)}>
                <Image source={{ uri: l.photos?.[0] || 'https://picsum.photos/seed/placeholder/400/300' }} style={styles.sheetImg} />
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={{ fontWeight: '600', fontSize: 13, color: Colors.light.text }} numberOfLines={1}>{l.name}</Text>
                  <Text style={{ color: Colors.light.primary, fontWeight: '700', fontSize: 12 }}>{l.price_display}</Text>
                </View>
                <BadgeView color={l.region === 'west_gate' ? 'blue' : l.region === 'south_gate' ? 'green' : 'orange'}>
                  {REGION_LABELS[l.region]}
                </BadgeView>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
                  {selected.walk_minutes != null && (
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>🕐 ~{selected.walk_minutes} min walk from gate</Text>
                  )}
                </View>
              </View>

              {activeRoute ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, backgroundColor: Colors.light.surface, borderRadius: Radius.md, padding: Spacing.md }}>
                  <MaterialIcons name="directions-walk" size={20} color={Colors.light.primary} />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <Text style={{ color: Colors.light.text, fontWeight: '700', fontSize: 13 }}>
                      ≈ {activeRoute.distanceText} · {activeRoute.durationText} walk
                    </Text>
                    <Text style={{ color: Colors.light.textSoft, fontSize: 12 }}>
                      {activeRoute.gps ? 'From your current location' : 'From FUTA main gate'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setRoute(null)} style={{ padding: 4 }}>
                    <MaterialIcons name="close" size={18} color={Colors.light.textSoft} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.viewBtn, { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.primary, marginTop: Spacing.md }]}
                  onPress={() => getDirections(selected)}
                >
                  <MaterialIcons name="directions-walk" size={16} color={Colors.light.primary} style={{ marginRight: 6 }} />
                  <Text style={{ color: Colors.light.primary, fontWeight: '600', fontSize: 14 }}>Get Directions</Text>
                </TouchableOpacity>
              )}

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
  legend: { position: 'absolute', top: Spacing.lg, right: Spacing.md, backgroundColor: Colors.light.white, borderRadius: Radius.md, padding: Spacing.md, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4, zIndex: 5 },
  locBtn: { position: 'absolute', right: Spacing.md, backgroundColor: Colors.light.white, borderRadius: Radius.pill, padding: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, zIndex: 6 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: Colors.light.white, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 8, zIndex: 5, paddingBottom: 28 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  sheetRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  sheetImg: { width: 44, height: 44, borderRadius: Radius.sm },
  userDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.light.primary, borderWidth: 3, borderColor: Colors.light.white },
  bottomSheet: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.15)' },
  miniCard: { backgroundColor: Colors.light.white, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.lg, paddingBottom: 40 },
  miniImg: { width: 72, height: 72, borderRadius: Radius.md },
  viewBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.primary, paddingVertical: 12, borderRadius: Radius.md, marginTop: Spacing.sm },
});