import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, MapPin, Navigation } from 'lucide-react';
import { Button, Badge } from '../../components/ui';
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

function FLY_TO({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 16, { duration: 1 });
  }, [center, map]);
  return null;
}

export function MapPanel({ listings, selectedId, onSelect }: {
  listings: Listing[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [flyTarget, setFlyTarget] = React.useState<[number, number] | undefined>();

  const selected = useMemo(() => listings.find((l) => l.id === selectedId), [listings, selectedId]);

  useEffect(() => {
    if (selected?.lat && selected?.lng) {
      setFlyTarget([selected.lat, selected.lng]);
    }
  }, [selectedId]);

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
                <div className="min-w-[180px] p-1">
                  <div className="flex gap-2 items-start">
                    {l.photos?.[0] && (
                      <img src={l.photos[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{l.name}</p>
                      <p className="text-xs text-ink-soft">{l.price_display}</p>
                      {l.walk_minutes && <p className="text-xs text-ink-soft">{l.walk_minutes} min walk</p>}
                      <button
                        onClick={(e) => { e.stopPropagation(); onSelect(l.id); }}
                        className="mt-1 text-xs font-medium text-primary hover:underline"
                      >
                        View Listing →
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
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
      {/* My location button */}
      <button
        className="absolute bottom-8 right-4 z-[1000] bg-white rounded-full shadow-lg p-3 hover:bg-gray-50"
        title="My Location"
        onClick={() => setFlyTarget(FUTA_GATE)}
      >
        <Navigation size={18} />
      </button>
    </div>
  );
}