'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import StackedAvatars from '@/components/ui/StackedAvatars';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin } from 'lucide-react';

type EventItem = {
  id: string;
  title: string;
  description?: string;
  location: { lat: number; lng: number };
  joiners?: string[];
  imageUrl?: string;
  code?: string;
  date?: string;
  time?: string;
  placeName?: string;
};

const DefaultIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

const RedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: '/leaflet/marker-shadow.png',
});

type Props = {
  events: EventItem[];
  onMapClick?: (lat: number, lng: number) => void;
  onJoinClick?: (event: EventItem) => void;
  searchMarker?: { lat: number; lng: number };
  center?: { lat: number; lng: number };
  zoom?: number;
  currentUserId?: string;
};

function CenterController({ center, zoom = 13 }: { center?: { lat: number; lng: number }; zoom?: number }) {
  const map = useMap();
  if (center) {
    map.setView([center.lat, center.lng], zoom);
  }
  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function EventMap({ events, onMapClick, onJoinClick, searchMarker, center, zoom = 15, currentUserId }: Props) {
  const defaultCenter: [number, number] = [51.505, -0.09];

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border" style={{ zIndex: 0 }}>
      <MapContainer center={center ? [center.lat, center.lng] : defaultCenter} zoom={zoom} style={{ height: '100%', width: '100%', cursor: 'crosshair', zIndex: 0 }}>
        <CenterController center={center} zoom={zoom} />
        <ClickHandler onMapClick={onMapClick} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {searchMarker && (
          <Marker position={[searchMarker.lat, searchMarker.lng]} icon={RedIcon} />
        )}
        {events.map((event) => (
          <Marker key={event.id} position={[event.location.lat, event.location.lng]} icon={DefaultIcon}>
            <Popup>
              <div className="space-y-3 w-64">
                {/* Event Image */}
                {event.imageUrl && (
                  <img src={event.imageUrl} alt={event.title} className="w-full h-32 object-cover rounded-lg" />
                )}
                
                {/* Event Title */}
                <div className="font-semibold text-lg">{event.title}</div>
                
                {/* Date and Time */}
                {(event.date || event.time) && (
                  <div className="space-y-1">
                    {event.date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(event.date), 'EEE, MMM d, yyyy')}</span>
                      </div>
                    )}
                    {event.time && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Location */}
                {event.placeName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{event.placeName}</span>
                  </div>
                )}
                
                {/* Stacked Avatars for Joiners */}
                {event.joiners && event.joiners.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">People joining:</span>
                    <StackedAvatars 
                      userIds={[...new Set(event.joiners)]} 
                      maxVisible={3}
                      size="sm"
                    />
                  </div>
                )}
                
                {/* Join Button */}
                <div className="flex justify-end pt-2">
                  <Button 
                    size="sm" 
                    disabled={Array.isArray(event.joiners) && !!currentUserId && event.joiners.includes(currentUserId)} 
                    onClick={() => onJoinClick?.(event)}
                    className="w-full"
                  >
                    {Array.isArray(event.joiners) && !!currentUserId && event.joiners.includes(currentUserId) ? 'Joined' : 'Join Event'}
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}


