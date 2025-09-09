"use client";

import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { EventMarkerIcon, SearchMarkerIcon } from '@/lib/leaflet-icons';

// Use Lucide React-based icons
const DefaultIcon = EventMarkerIcon;
const RedIcon = SearchMarkerIcon;

type Props = {
  location: { lat: number; lng: number } | null;
  onChange: (loc: { lat: number; lng: number } | null) => void;
  highlight?: boolean; // show red marker when true
};

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MiniMapPicker({ location, onChange, highlight }: Props) {
  const center: [number, number] = location ? [location.lat, location.lng] : [20.0, 0.0];
  return (
    <div className="h-56 w-full overflow-hidden rounded border" style={{ zIndex: 0 }}>
      <MapContainer center={center} zoom={location ? 12 : 2} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickCapture onPick={(lat, lng) => onChange({ lat, lng })} />
        {location && <Marker position={[location.lat, location.lng]} icon={highlight ? RedIcon : DefaultIcon} />}
      </MapContainer>
    </div>
  );
}


