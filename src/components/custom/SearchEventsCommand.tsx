"use client";

import { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search } from 'lucide-react';

interface SearchEventsCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: Array<{
    id: string;
    title: string;
    description?: string;
    code?: string;
    location: { lat: number; lng: number };
  }>;
  onSelect: (event: any) => void;
  userLoc?: { lat: number; lng: number };
}

export default function SearchEventsCommand({ 
  open, 
  onOpenChange, 
  events, 
  onSelect, 
  userLoc 
}: SearchEventsCommandProps) {
  const [searchValue, setSearchValue] = useState('');

  const filteredEvents = events
    .filter((event) => 
      event.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      event.code?.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      if (!userLoc) return 0;
      const da = Math.hypot(a.location.lat - userLoc.lat, a.location.lng - userLoc.lng);
      const db = Math.hypot(b.location.lat - userLoc.lat, b.location.lng - userLoc.lng);
      return da - db;
    });

  const handleSelect = (event: any) => {
    onSelect(event);
    onOpenChange(false);
    setSearchValue('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Events</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput
            placeholder="Search events by title, description, or code..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No events found.</CommandEmpty>
            <CommandGroup>
              {filteredEvents.map((event) => (
                <CommandItem
                  key={event.id}
                  onSelect={() => handleSelect(event)}
                  className="flex flex-col items-start gap-1 p-3"
                >
                  <div className="font-medium">{event.title}</div>
                  {event.description && (
                    <div className="text-sm text-gray-600">{event.description}</div>
                  )}
                  {event.code && (
                    <div className="text-xs text-gray-500">Code: {event.code}</div>
                  )}
                  {userLoc && (
                    <div className="text-xs text-gray-500">
                      {Math.round(
                        Math.hypot(event.location.lat - userLoc.lat, event.location.lng - userLoc.lng) * 111
                      )} km away
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
