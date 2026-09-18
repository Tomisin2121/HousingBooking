import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { MapPin, Navigation, X } from 'lucide-react';
import { Badge } from '../../components/ui';
import type { Listing, Region } from '../../types';
import { REGION_LABELS, REGION_COLORS } from '../../types';

const FUTA_GATE: [number, number] = [7.3086, 5.137];

const iconMap: Record<string, L.DivIcon> = {};

function createIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function getIcon(region: Region) {
  const color = REGION_COLORS[region] || '#16A34A';
  if (!iconMap[region]) iconMap[region] = createIcon(color);
  return iconMap[region];
}

const userIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 6px rgba(37,99,235,0.6)"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function FLY_TO({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { duration: 1 });
  }, [center, map]);
  return null;
}

function RoutingLayer({ route, onResult }: {
  route: { origin: [number, number]; dest: [number, number] } | null;
  onResult: (info: { distanceM: number; timeS: number } | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!route) {
      onResult(null);
      return;
    }
    let control: any;
    try {
      control = L.Routing.control({
        waypoints: [L.latLng(route.origin[0], route.origin[1]), L.latLng(route.dest[0], route.dest[1])],
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
        lineOptions: {
          styles: [{ color: '#2563EB', weight: 5, opacity: 0.85 }],
        } as any,
        createMarker: () => null,
        show: false,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: false,
        autoRoute: true,
      } as any);
      control.addTo(map);
      control.on('routesfound', (e: any) => {
        const routes = e.routes || [];
        if (routes[0]?.summary) {
          onResult({ distanceM: routes[0].summary.totalDistance, timeS: routes[0].summary.totalTime });
        }
      });
    } catch (err) {
      console.error('Directions failed', err);
      onResult(null);
    }
    return () => {
      if (control) {
        try { map.removeControl(control); } catch { /* noop */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, map]);

  return null;
}

function formatRouteInfo(distanceM: number, timeS: number) {
  const km = distanceM / 1000;
  const distance = km >= 1 ? `${km.toFixed(1)} km` : `${Math.round(distanceM)} m`;
  const minutes = timeS <= 0 ? 0 : Math.max(1, Math.round(timeS / 60));
  return { distance, minutes };
}

export function MapPanel({ listings, selectedId, onSelect }: {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [flyTarget, setFlyTarget] = useState<[number, number] | undefined>();
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState<{ origin: [number, number]; dest: [number, number]; name: string; gps: boolean } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceM: number; timeS: number } | null>(null);

  const selected = useMemo(() => listings.find((l) => l.id === selectedId), [listings, selectedId]);

  useEffect(() => {
    if (selected?.lat && selected?.lng) {
      setFlyTarget([selected.lat, selected.lng]);
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPosition = (): Promise<[number, number]> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve([pos.coords.latitude, pos.coords.longitude]),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const locateMe = async () => {
    setLocating(true);
    try {
      const pos = await getPosition();
      setUserLoc(pos);
      setFlyTarget(pos);
    } catch (err: any) {
      console.error('Location failed', err?.message || err);
    } finally {
      setLocating(false);
    }
  };

  const getDirections = async (l: Listing) => {
    let origin = userLoc;
    if (!origin) {
      try {
        origin = await getPosition();
        setUserLoc(origin);
        setFlyTarget(origin);
      } catch {
        origin = FUTA_GATE;
      }
    }
    setRoute({
      origin,
      dest: [l.lat!, l.lng!],
      name: l.name,
      gps: origin !== FUTA_GATE,
    });
  };

  const info = routeInfo ? formatRouteInfo(routeInfo.distanceM, routeInfo.timeS) : null;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={FUTA_GATE}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FLY_TO center={flyTarget} />
        {userLoc && <Marker position={userLoc} icon={userIcon} zIndexOffset={1000} />}
        {listings
          .filter((l) => l.lat && l.lng)
          .map((l) => (
            <Marker
              key={l.id}
              position={[l.lat!, l.lng!]}
              icon={getIcon(l.region)}
              eventHandlers={{ click: () => onSelect(l.id) }}
            >
              <Popup>
                <div className="min-w-[200px] p-1">
                  {l.photos?.[0] && (
                    <img src={l.photos[0]} alt="" className="w-full h-20 object-cover rounded-lg mb-2" />
                  )}
                  <p className="font-semibold text-sm">{l.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-primary font-semibold">{l.price_display}</span>
                    <Badge>{REGION_LABELS[l.region]}</Badge>
                  </div>
                  {l.walk_minutes != null && (
                    <p className="text-xs text-ink-soft mt-0.5">🕐 ~{l.walk_minutes} min walk from gate</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); getDirections(l); }}
                      className="flex-1 text-xs bg-primary text-white rounded-lg py-1.5 font-medium hover:opacity-90"
                    >
                      Get Directions
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(l.id); }}
                      className="flex-1 text-xs border border-primary text-primary rounded-lg py-1.5 font-medium hover:bg-primary/5"
                    >
                      View Listing
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        <RoutingLayer route={route} onResult={setRouteInfo} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1">
        {Object.entries(REGION_LABELS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: REGION_COLORS[k as Region] }} />
            <span>{v}</span>
          </div>
        ))}
      </div>

      {/* Route summary card */}
      {route && (
        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3 z-[1000] max-w-[240px]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-soft flex items-center gap-1">
                <Navigation size={12} /> Walking route
              </p>
              <p className="text-sm font-semibold truncate">{route.name}</p>
              {info ? (
                <p className="text-xs text-primary font-medium mt-0.5">≈ {info.distance} · {info.minutes} min walk</p>
              ) : (
                <p className="text-xs text-ink-soft mt-0.5">Calculating route…</p>
              )}
              <p className="text-[11px] text-ink-soft mt-1">
                {route.gps ? 'From your current location' : 'From FUTA main gate'}
              </p>
            </div>
            <button onClick={() => { setRoute(null); setRouteInfo(null); }} className="text-ink-soft hover:text-ink" title="Clear route">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* My location button */}
      <button
        className="absolute bottom-8 right-4 z-[1000] bg-white rounded-full shadow-lg p-3 hover:bg-gray-50 disabled:opacity-50"
        title="My Location"
        onClick={locateMe}
        disabled={locating}
      >
        <Navigation size={18} className={userLoc ? 'text-primary' : ''} />
      </button>

      {/* Gate anchor note */}
      <div className="absolute bottom-8 left-4 z-[1000] bg-white/90 rounded-full shadow px-3 py-1.5 text-xs text-ink-soft flex items-center gap-1">
        <MapPin size={12} className="text-primary" /> FUTA Main Gate
      </div>
    </div>
  );
}