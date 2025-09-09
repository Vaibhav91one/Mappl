"use client";

import { useState } from 'react';
import IconTransitionButton from '@/components/ui/IconTransitionButton';
import CircularLoader from '@/components/ui/CircularLoader';
import { FlipText } from '@/components/animation';
import { Circle, Search } from 'lucide-react';
import EventCard from './EventCard';

interface EventItem {
  id: string;
  title: string;
  description?: string;
  code?: string;
  location: { lat: number; lng: number };
  genre?: string[];
}

interface EventsGridProps {
  events: EventItem[];
  loadingEvents: boolean;
  userLoc?: { lat: number; lng: number };
  searchEvents: string;
  onSearchOpen: () => void;
  onJoin: (event: EventItem) => void;
  onChat: (event: EventItem) => void;
  onView: (event: EventItem) => void;
  title?: string;
  showSearchButton?: boolean;
  maxItems?: number;
}

export default function EventsGrid({
  events,
  loadingEvents,
  userLoc,
  searchEvents,
  onSearchOpen,
  onJoin,
  onChat,
  onView,
  title = "All Events",
  showSearchButton = true,
  maxItems
}: EventsGridProps) {
  const filteredEvents = events
    .slice()
    .sort((a, b) => {
      if (!userLoc) return 0;
      const da = Math.hypot(a.location.lat - userLoc.lat, a.location.lng - userLoc.lng);
      const db = Math.hypot(b.location.lat - userLoc.lat, b.location.lng - userLoc.lng);
      return da - db;
    })
    .filter((e) => 
      !searchEvents || 
      e.title.toLowerCase().includes(searchEvents.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchEvents.toLowerCase()) ||
      e.code?.toLowerCase().includes(searchEvents.toLowerCase())
    )
    .slice(0, maxItems);

  return (
    <div className="space-y-6">
      <div className="text-center gap-2 flex flex-col items-center justify-center mb-6">
        <FlipText
          className="text-3xl font-semibold mb-6 inline-block"
          duration={0.5}
          stagger={0.02}
        >
          {title}
        </FlipText>
        
        {showSearchButton && (
          <IconTransitionButton
            onClick={onSearchOpen}
            defaultIcon={Circle}
            hoverIcon={Search}
            variant="outline"
            size="sm"
          >
            Search events
          </IconTransitionButton>
        )}
      </div>

      {loadingEvents ? (
        <div className="flex items-center justify-center py-12">
          <CircularLoader size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              userLoc={userLoc}
              onJoin={onJoin}
              onChat={onChat}
              onView={onView}
            />
          ))}
        </div>
      )}

      {!loadingEvents && filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No events found.
        </div>
      )}
    </div>
  );
}
