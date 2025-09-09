"use client";

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { listEvents, createEvent as apiCreateEvent, updateEvent, joinEvent } from '@/lib/api/events';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatISO } from 'date-fns';
import { ChevronDownIcon, MapPin, Search, Plus, MessageCircle, Eye, Circle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import EventDialog from '@/components/custom/EventDialog';
import SearchLocationCommand from '@/components/custom/SearchLocationCommand';
import SearchEventsCommand from '@/components/custom/SearchEventsCommand';
import GenrePill from '@/components/ui/GenrePill';
import EventsGrid from '@/components/custom/EventsGrid';
import ChatWindow from '@/components/custom/ChatWindow';
import IconTransitionButton from '@/components/ui/IconTransitionButton';
import CircularLoader from '@/components/ui/CircularLoader';
import { FlipText } from '@/components/animation';

const EventMap = dynamic(() => import('@/components/EventMap'), { 
  ssr: false,
  loading: () => (
    <div className="h-96 w-full flex items-center justify-center bg-gray-100 rounded-lg">
      <CircularLoader size="lg" />
    </div>
  )
});

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

type Suggestion = { label: string; lat: number; lng: number };

function EventsPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);

  const [center, setCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);
  const [locationPermission, setLocationPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [isGettingLocation, setIsGettingLocation] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [pendingPlaceName, setPendingPlaceName] = useState<string | null>(null);
  const [placeResolving, setPlaceResolving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', genre: [] as string[] });
  const [genreInput, setGenreInput] = useState('');
  const [when, setWhen] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('10:30:00');
  const [dateOpen, setDateOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [searchEvents, setSearchEvents] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [open, setOpen] = useState(false);
  const [searchEventsOpen, setSearchEventsOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  
  // Premade genre options
  const premadeGenres = [
    'Music', 'Sports', 'Food', 'Art', 'Technology', 'Business', 'Education', 'Health',
    'Travel', 'Gaming', 'Fitness', 'Photography', 'Dance', 'Theater', 'Comedy',
    'Networking', 'Workshop', 'Conference', 'Meetup', 'Party', 'Festival'
  ];

  // Genre handling functions
  const addGenre = (genreToAdd: string) => {
    if (!form.genre.includes(genreToAdd)) {
      setForm(prev => ({ ...prev, genre: [...prev.genre, genreToAdd] }));
    }
  };

  const removeGenre = (genreToRemove: string) => {
    setForm(prev => ({ ...prev, genre: prev.genre.filter(g => g !== genreToRemove) }));
  };

  const handleGenreInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && genreInput.trim()) {
      addGenre(genreInput.trim());
      setGenreInput('');
    }
  };

  // Using API routes for data access
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [chatOpen, setChatOpen] = useState(false);

  function onMapClick(lat: number, lng: number) {
    setPendingLatLng({ lat, lng });
    setModalOpen(true);
  }

  async function createEvent() {
    if (!pendingLatLng || !form.title.trim()) return;
    let isoDate: string | undefined = undefined;
    if (when) {
      const [hh = '00', mm = '00', ss = '00'] = (time || '00:00:00').split(':');
      const dt = new Date(when);
      dt.setHours(Number(hh), Number(mm), Number(ss), 0);
      isoDate = formatISO(dt);
    }
    let uploadedUrl: string | undefined = undefined;
    if (imageFile) {
      const fd = new FormData();
      fd.append('file', imageFile);
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      if (r.ok) {
        const json = await r.json();
        uploadedUrl = json.url as string;
      }
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      genre: form.genre,
      location: { lat: pendingLatLng.lat, lng: pendingLatLng.lng },
      date: isoDate,
      imageUrl: uploadedUrl,
      creatorId: user?.$id || 'guest',
      joiners: [],
    };
    apiCreateEvent(payload as any)
      .then((created: any) => {
        setEvents((prev) => [created, ...prev]);
        setModalOpen(false);
        setPendingLatLng(null);
        setPendingPlaceName(null);
        setForm({ title: '', description: '', genre: [] });
        setGenreInput('');
        setWhen(undefined);
        setImageFile(null);
        setImagePreview(undefined);
      })
      .catch(() => setModalOpen(false));
  }

  async function handleJoinEvent(eventId: string) {
    if (!user?.$id) return;
    try {
      const updatedEvent = await joinEvent(eventId, user.$id);
      // Update the active event if it's the same one
      if (activeEvent && activeEvent.id === eventId) {
        setActiveEvent(updatedEvent);
      }
      // Refresh events list to show updated join status
      const eventsData = await listEvents();
      setEvents(eventsData as any);
    } catch (error) {
      // Handle error silently
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check geolocation support on client side only
    const geolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    setHasGeolocation(geolocationSupported);
    
    if (geolocationSupported) {
      // Check permission status
      if ('permissions' in navigator) {
        navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
          setLocationPermission(result.state);
        }).catch(() => {
          setLocationPermission('prompt');
        });
      } else {
        setLocationPermission('prompt');
      }
      
      // Try to get current position
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          setCenter(loc);
          setLocationPermission('granted');
          setIsGettingLocation(false);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission('denied');
          } else {
            setLocationPermission('prompt');
          }
          setIsGettingLocation(false);
        },
        { enableHighAccuracy: true, maximumAge: 60000, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    setLoadingEvents(true);
    listEvents()
      .then((data) => setEvents(data as any))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, []);

  // Function to find event by code
  const findEventByCode = (code: string): EventItem | null => {
    return events.find(event => event.code === code) || null;
  };

  // Handle URL parameters to open event modal
  useEffect(() => {
    if (!mounted || !searchParams) return;
    
    const eventCode = searchParams.get('event');
    if (eventCode && events.length > 0) {
      const event = findEventByCode(eventCode);
      if (event) {
        setSelectedEvent(event);
        setEventModalOpen(true);
        // Clear the URL parameter
        const url = new URL(window.location.href);
        url.searchParams.delete('event');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [mounted, searchParams, events]);

  function selectSuggestion(s: { lat: number; lng: number; label: string }) {
    setCenter({ lat: s.lat, lng: s.lng });
    setSearchMarker({ lat: s.lat, lng: s.lng });
    setPendingLatLng({ lat: s.lat, lng: s.lng });
    setOpen(false);
  }

  useEffect(() => {
    let ignore = false;
    if (!pendingLatLng) {
      setPendingPlaceName(null);
      setPlaceResolving(false);
      return;
    }
    setPlaceResolving(true);
    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pendingLatLng.lat}&lon=${pendingLatLng.lng}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data: { display_name?: string } = await res.json();
        if (!ignore) {
          setPendingPlaceName(data.display_name || null);
        }
      } catch (e) {
        if (!ignore) setPendingPlaceName(null);
      } finally {
        if (!ignore) setPlaceResolving(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [pendingLatLng]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="flex flex-col items-center space-y-6 my-8">
        <FlipText
          className="text-3xl font-semibold mb-6"
          duration={0.5}
          stagger={0.02}
        >
          Events
        </FlipText>
        
        <div className="flex items-center gap-2">
        <IconTransitionButton
          onClick={() => {
            if (userLoc) {
              // If we already have location, just center the map
              setCenter(userLoc);
            } else if (hasGeolocation && locationPermission !== 'denied') {
              // If we don't have location but geolocation is supported and not denied, request it
              setIsGettingLocation(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                  setUserLoc(loc);
                  setCenter(loc);
                  setLocationPermission('granted');
                  setIsGettingLocation(false);
                },
                (error) => {
                  if (error.code === error.PERMISSION_DENIED) {
                    setLocationPermission('denied');
                  }
                  setIsGettingLocation(false);
                },
                { enableHighAccuracy: true, maximumAge: 60000, timeout: 5000 }
              );
            }
          }}
          defaultIcon={Circle}
          hoverIcon={MapPin}
          variant="secondary"
          size="sm"
          disabled={!hasGeolocation || locationPermission === 'denied' || isGettingLocation}
        >
          {(() => {
            if (isGettingLocation) return 'Using location...';
            if (locationPermission === 'denied') return 'Location denied';
            if (userLoc) return 'Using Location';
            return 'Use my location';
          })()}
        </IconTransitionButton>
        
        <IconTransitionButton
          onClick={() => setOpen(true)}
          defaultIcon={Circle}
          hoverIcon={Search}
          variant="primary"
          size="sm"
        >
          Search location
        </IconTransitionButton>
        
        <HoverCard>
          <HoverCardTrigger asChild>
            <span>
              <IconTransitionButton
                onClick={() => setModalOpen(true)}
                defaultIcon={Circle}
                hoverIcon={Plus}
                variant="primary"
                size="sm"
                disabled={!pendingLatLng}
              >
                New Event
              </IconTransitionButton>
            </span>
          </HoverCardTrigger>
          {!pendingLatLng && (
            <HoverCardContent className="w-64">
              Click on the map to select a location. The New Event button will enable once a location is chosen.
            </HoverCardContent>
          )}
        </HoverCard>
        </div>
      </div>

      {mounted && (
        <EventMap
          events={events}
          onMapClick={onMapClick}
          onJoinClick={(ev) => { setActiveEvent(ev); setJoinOpen(true); }}
          searchMarker={searchMarker}
          center={center}
          currentUserId={user?.$id}
        />
      )}

      <EventDialog
        open={joinOpen}
        mode="join"
        eventData={activeEvent || undefined}
        includeDateTime={false}
        includeLocationPicker={false}
        currentUserId={user?.$id}
        onOpenChange={setJoinOpen}
        secondaryLabel="Close"
        onPrimary={() => {
          if (!activeEvent) return;
          if (user && activeEvent.joiners?.includes(user.$id)) return;
          const already = new Set(activeEvent.joiners || []);
          const uid = user?.$id || 'guest';
          already.add(uid);
          updateEvent(activeEvent.id, { joiners: Array.from(already) } as any)
            .then((updated: any) => {
              setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
              setActiveEvent(updated);
            });
        }}
      />

      <SearchLocationCommand open={open} onOpenChange={setOpen} onSelect={selectSuggestion} />
      
      <SearchEventsCommand
        open={searchEventsOpen}
        onOpenChange={setSearchEventsOpen}
        events={events}
        onSelect={(event) => {
          setActiveEvent(event);
          setJoinOpen(true);
        }}
        userLoc={userLoc}
      />

      {/* Events Section */}
      <div className="mt-18">
        <EventsGrid
          events={events}
          loadingEvents={loadingEvents}
          userLoc={userLoc}
          searchEvents={searchEvents}
          onSearchOpen={() => setSearchEventsOpen(true)}
          onJoin={(event) => { setActiveEvent(event); setJoinOpen(true); }}
          onChat={(event) => { setActiveEvent(event); setChatOpen(true); }}
          onView={(event) => { setActiveEvent(event); setJoinOpen(true); }}
          title="All-Events"
          showSearchButton={true}
        />
      </div>

      

      <EventDialog
        open={modalOpen}
        mode="create"
        includeDateTime
        includeLocationPicker
        initialLocation={pendingLatLng}
        onOpenChange={setModalOpen}
        content={(
          <div className="space-y-3 overflow-y-auto">
            <DialogDescription asChild>
              {pendingLatLng ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    <span>Location: ({pendingLatLng.lat.toFixed(5)}, {pendingLatLng.lng.toFixed(5)})</span>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {placeResolving && <CircularLoader size="sm" />}
                    <p className="text-xs text-gray-600">
                      {placeResolving ? 'Resolving place name…' : pendingPlaceName || 'Unknown place'}
                    </p>
                  </div>
                </div>
              ) : (
                <span>Click on the map to choose a location.</span>
              )}
            </DialogDescription>

            <div className="space-y-1">
              <Label htmlFor="title" className="py-2">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desc" className="py-2">Description</Label>
              <Textarea id="desc" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-3">
              <Label htmlFor="genre" className="py-2">Genre</Label>
              
              {/* Custom genre input */}
              <div className="space-y-2">
                <Input 
                  id="genre" 
                  placeholder="Type a custom genre and press Enter"
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  onKeyPress={handleGenreInputKeyPress}
                />
              </div>

              {/* Premade genre pills */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Or select from popular genres:</Label>
                <div className="flex flex-wrap gap-2">
                  {premadeGenres.map((premadeGenre) => (
                    <button
                      key={premadeGenre}
                      type="button"
                      onClick={() => addGenre(premadeGenre)}
                      disabled={form.genre.includes(premadeGenre)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        form.genre.includes(premadeGenre)
                          ? 'bg-blue-500 text-white border-blue-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {premadeGenre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected genres */}
              {form.genre.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Selected genres:</Label>
                  <div className="flex flex-wrap gap-3">
                    {form.genre.map((g, index) => (
                      <GenrePill
                        key={index}
                        genre={g}
                        size="md"
                        removable={true}
                        onRemove={removeGenre}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="py-2" htmlFor="date-picker">Date & Time</Label>
              <div className="flex gap-4 items-end">
                <div className="flex flex-col gap-2">
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date-picker"
                        className="w-32 justify-between font-normal h-10"
                      >
                        {when ? when.toLocaleDateString() : 'Select date'}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="z-[10000] w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={when}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                          setWhen(d);
                          setDateOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <Input
                    type="time"
                    id="time-picker"
                    step="1"
                    defaultValue="10:30:00"
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none h-10 w-32"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="file" className="py-2">Image</Label>
              <Input id="file" type="file" accept="image/*" onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
                setImagePreview(f ? URL.createObjectURL(f) : undefined);
              }} />
              {uploading && (
                <div className="flex items-center justify-center py-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
                </div>
              )}
              {imagePreview && <img src={imagePreview} alt="preview" className="h-24 rounded object-cover" />}
            </div>
          </div>
        )}
        onPrimary={createEvent}
        primaryLabel="Create"
        secondaryLabel="Cancel"
        disablePrimary={!pendingLatLng || !form.title.trim()}
      />

      <EventDialog
        open={chatOpen}
        mode="view"
        title={activeEvent?.title ? `Chat — ${activeEvent.title}` : 'Chat'}
        onOpenChange={setChatOpen}
        content={activeEvent?.code ? (
          <div className="pt-2">
            <ChatWindow 
              code={activeEvent.code} 
              currentUserId={user?.$id}
              hasUserJoined={activeEvent.joiners?.includes(user?.$id || '') || false}
              isAuthenticated={!!user}
              onJoinEvent={() => handleJoinEvent(activeEvent.id)}
            />
          </div>
        ) : (
          <div className="p-2 text-sm text-gray-500">No event selected</div>
        )}
        secondaryLabel="Close"
      />

      {/* Event Modal for URL parameters */}
      <EventDialog
        open={eventModalOpen}
        mode="join"
        eventData={selectedEvent || undefined}
        includeDateTime={false}
        includeLocationPicker={false}
        currentUserId={user?.$id}
        onOpenChange={setEventModalOpen}
        secondaryLabel="Close"
        onPrimary={() => {
          if (!selectedEvent) return;
          if (user && selectedEvent.joiners?.includes(user.$id)) return;
          const already = new Set(selectedEvent.joiners || []);
          const uid = user?.$id || 'guest';
          already.add(uid);
          updateEvent(selectedEvent.id, { joiners: Array.from(already) } as any)
            .then(() => {
              setEvents(prev => prev.map(e => 
                e.id === selectedEvent.id 
                  ? { ...e, joiners: Array.from(already) }
                  : e
              ));
              setSelectedEvent(prev => prev ? { ...prev, joiners: Array.from(already) } : null);
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
      </div>
    }>
      <EventsPageContent />
    </Suspense>
  );
}
