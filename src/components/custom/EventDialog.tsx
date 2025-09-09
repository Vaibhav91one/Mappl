"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import IconTransitionButton from '@/components/ui/IconTransitionButton';
import StackedAvatars from '@/components/ui/StackedAvatars';
import ShareEvent from '@/components/custom/ShareEvent';
import GenrePill from '@/components/ui/GenrePill';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDownIcon, MapPin, UserPlus, Check, Calendar as CalendarIcon, Clock, X, Save, Trash2, Plus } from 'lucide-react';
import SearchLocationCommand from '@/components/custom/SearchLocationCommand';
import CircularLoader from '@/components/ui/CircularLoader';

type MiniMapPickerProps = {
  location: { lat: number; lng: number } | null;
  onChange: (loc: { lat: number; lng: number } | null) => void;
  highlight?: boolean;
};

const MiniMapPicker = dynamic<MiniMapPickerProps>(() => import('@/components/custom/MiniMapPicker'), { ssr: false });

type BaseEvent = {
  id?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  code?: string;
  joiners?: string[];
  date?: string;
  location?: { lat: number; lng: number };
  genre?: string[];
};

type Mode = 'create' | 'edit' | 'view' | 'join' | 'search';

type EventDialogProps = {
  open: boolean;
  mode: Mode;
  title?: string; // dialog title override
  descriptionNode?: React.ReactNode; // extra info under title
  eventData?: BaseEvent | null;
  content?: React.ReactNode; // custom content area; when provided, overrides default body UI
  includeDateTime?: boolean;
  includeLocationPicker?: boolean;
  initialLocation?: { lat: number; lng: number } | null;
  disablePrimary?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  currentUserId?: string; // Add current user ID to check if already joined
  onOpenChange: (open: boolean) => void;
  onPrimary?: (payload: { title?: string; description?: string; genre?: string[]; file?: File | null; removeImage?: boolean; date?: Date; time?: string; location?: { lat: number; lng: number } | null }) => void | Promise<void>;
  onSecondary?: () => void;
};

export default function EventDialog({
  open,
  mode,
  title,
  descriptionNode,
  eventData,
  content,
  includeDateTime,
  includeLocationPicker,
  initialLocation,
  disablePrimary,
  primaryLabel,
  secondaryLabel = 'Close',
  currentUserId,
  onOpenChange,
  onPrimary,
  onSecondary,
}: EventDialogProps) {
  const [localTitle, setLocalTitle] = useState('');
  const [localDesc, setLocalDesc] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [when, setWhen] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('10:30:00');
  const [dateOpen, setDateOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [placeResolving, setPlaceResolving] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isEditable = mode === 'create' || mode === 'edit';

  // Premade genre options
  const premadeGenres = [
    'Music', 'Sports', 'Food', 'Art', 'Technology', 'Business', 'Education', 'Health',
    'Travel', 'Gaming', 'Fitness', 'Photography', 'Dance', 'Theater', 'Comedy',
    'Networking', 'Workshop', 'Conference', 'Meetup', 'Party', 'Festival'
  ];

  // Genre handling functions
  const addGenre = (genreToAdd: string) => {
    if (!genre.includes(genreToAdd)) {
      setGenre([...genre, genreToAdd]);
    }
  };

  const removeGenre = (genreToRemove: string) => {
    setGenre(genre.filter(g => g !== genreToRemove));
  };

  const handleGenreInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && genreInput.trim()) {
      addGenre(genreInput.trim());
      setGenreInput('');
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setLocalTitle(eventData?.title || '');
    setLocalDesc(eventData?.description || '');
    setGenre(eventData?.genre || []);
    setFile(null);
    setRemoveImage(false);
    setPreviewUrl(null);
    // initialize date/time
    if (eventData?.date) {
      const d = new Date(eventData.date);
      if (!isNaN(d.getTime())) {
        setWhen(d);
        const hh = `${d.getHours()}`.padStart(2, '0');
        const mm = `${d.getMinutes()}`.padStart(2, '0');
        const ss = `${d.getSeconds()}`.padStart(2, '0');
        setTime(`${hh}:${mm}:${ss}`);
      } else {
        setWhen(undefined);
        setTime('10:30:00');
      }
    } else {
      setWhen(undefined);
      setTime('10:30:00');
    }
    // initialize location
    setLocation(initialLocation || eventData?.location || null);
  }, [open, eventData]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    let ignore = false;
    const loc = location || eventData?.location || null;
    if (!loc) {
      setPlace(null);
      setPlaceResolving(false);
      return;
    }
    setPlaceResolving(true);
    (async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data: { display_name?: string } = await res.json();
        if (!ignore) setPlace(data.display_name || null);
      } catch {
        if (!ignore) setPlace(null);
      } finally {
        if (!ignore) setPlaceResolving(false);
      }
    })();
    return () => { ignore = true; };
  }, [location, eventData?.location]);

  const resolvedDialogTitle = title ||
    (mode === 'create' ? 'Create Event' :
     mode === 'edit' ? 'Edit Event' :
     mode === 'join' ? (eventData?.title || 'Event') :
     mode === 'search' ? 'Search location' : 'Event');

  const resolvedPrimaryLabel = primaryLabel ||
    (mode === 'create' ? 'Create' :
     mode === 'edit' ? 'Save' :
     mode === 'join' ? 'Join' :
     'OK');

  // Check if current user has already joined the event
  const hasUserJoined = currentUserId && eventData?.joiners?.includes(currentUserId);
  const isAuthenticated = !!currentUserId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={(mode === 'create' ? 'z-[10000] ' : '') + (mode === 'join' ? 'max-h-[90vh] w-[95vw] sm:max-w-4xl overflow-hidden' : 'max-h-[90vh] w-[95vw] sm:max-w-2xl overflow-hidden overflow-y-auto')}>
        <DialogHeader>
          {mode === 'join' ? (
            <VisuallyHidden>
              <DialogTitle>{resolvedDialogTitle}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <>
              <DialogTitle>{resolvedDialogTitle}</DialogTitle>
              {descriptionNode ? (
                <DialogDescription asChild>
                  <div>{descriptionNode}</div>
                </DialogDescription>
              ) : null}
            </>
          )}
        </DialogHeader>

        {content ? content : null}

        {!content && mode === 'view' && (
          <div className="space-y-3">
            {eventData?.imageUrl && (
              <img src={eventData.imageUrl} alt={eventData.title || 'event'} className="w-full h-40 object-cover rounded" />
            )}
            {eventData?.description && (
              <div className="text-sm text-gray-700">{eventData.description}</div>
            )}
            {eventData?.date && (
              <div className="text-xs">When: {new Date(eventData.date).toLocaleString()}</div>
            )}
            {(eventData?.location || location) && (
              <div className="text-xs">
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <div className="flex items-center gap-2">
                    {placeResolving && <CircularLoader size="sm" />}
                    <span>Place: {placeResolving ? 'Resolving…' : (place || 'Unknown place')}</span>
                  </div>
                </div>
              </div>
            )}
            {eventData?.code && (
              <div className="text-xs">Code: {eventData.code}</div>
            )}
            {typeof eventData?.joiners?.length === 'number' && (
              <div className="text-xs">People joining: {eventData.joiners?.length ?? 0}</div>
            )}
            
            {/* Share Button for View Mode */}
            {eventData && (
              <div className="pt-3">
                <ShareEvent
                  event={eventData}
                  variant="outline"
                  size="sm"
                />
              </div>
            )}
          </div>
        )}

        {!content && mode === 'join' && (
          <div className="flex h-[600px]">
            {/* Left side - Event Image/Poster */}
            <div className="flex-1 relative">
              {eventData?.imageUrl ? (
                <img 
                  src={eventData.imageUrl} 
                  alt={eventData.title || 'event'} 
                  className="w-full h-full object-cover rounded-xl border border-1" 
                />
              ) : (
                <div className="w-full h-full bg-gray-200 rounded-l-lg flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </div>

            {/* Right side - Event Details */}
            <div className="flex-1 p-6 bg-white rounded-r-lg flex flex-col justify-between">
              <div className="space-y-4">
                {/* Event Title */}
                <h2 className="text-2xl font-bold text-black">
                  {eventData?.title || 'Event'}
                </h2>


                {/* Date & Time */}
                {eventData?.date && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {(() => {
                        try {
                          const date = new Date(eventData.date);
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                          const day = date.getDate();
                          const month = date.toLocaleDateString('en-US', { month: 'short' });
                          const time = date.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          });
                          return `${dayName}, ${day} ${month}, ${time}`;
                        } catch {
                          return new Date(eventData.date).toLocaleString();
                        }
                      })()}
                    </span>
                  </div>
                )}

                {/* Location */}
                {(eventData?.location || location) && (
                  <div className="flex items-center gap-2">
                  
                    <div className="flex items-center gap-2">
                      {placeResolving && <CircularLoader size="sm" />}
                      <span className="text-sm text-gray-600">
                        {placeResolving ? 'Resolving location...' : (place || 'Unknown location')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Genre */}
                {eventData?.genre && eventData.genre.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Genre:</span>
                    <div className="flex flex-wrap gap-2">
                      {eventData.genre.map((g, index) => (
                        <GenrePill key={index} genre={g} />
                      ))}
                    </div>
                  </div>
                )}

                {/* About the Event */}
                {eventData?.description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-black mb-2">About the Event</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {eventData.description}
                    </p>
                  </div>
                )}

                {/* Event Code */}
                {eventData?.code && (
                  <div className="text-xs text-gray-500">
                    Event Code: {eventData.code}
                  </div>
                )}

                {/* People Joining - Stacked Avatars */}
                {eventData?.joiners && eventData.joiners.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Joined by:</span>
                    <StackedAvatars 
                      userIds={eventData.joiners} 
                      maxVisible={2}
                      size="md"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-start items-center gap-2">
                <IconTransitionButton
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.location.href = '/auth';
                      return;
                    }
                    onPrimary?.({});
                  }}
                  defaultIcon={!isAuthenticated ? UserPlus : hasUserJoined ? Check : UserPlus}
                  hoverIcon={!isAuthenticated ? UserPlus : hasUserJoined ? Check : Check}
                  variant={!isAuthenticated ? "outline" : hasUserJoined ? "secondary" : "primary"}
                  size="sm"
                  disabled={!!hasUserJoined}
                  className="focus:outline-none focus:ring-0 shadow-none "
                >
                  {!isAuthenticated ? 'Sign in to join' : hasUserJoined ? 'ALREADY JOINED' : 'JOIN EVENT'}
                </IconTransitionButton>
                
                {/* Share Button */}
                {eventData && (
                  <ShareEvent
                    event={eventData}
                    variant="outline"
                    size="sm"
                    className="justify-center "
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {!content && isEditable && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="py-2 "  htmlFor="title">Title</Label>
              <Input id="title" value={localTitle} onChange={(e) => setLocalTitle(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="py-2" htmlFor="desc">Description</Label>
              <Textarea id="desc" rows={3} value={localDesc} onChange={(e) => setLocalDesc(e.target.value)} />
            </div>
            <div className="space-y-3">
              <Label className="py-2" htmlFor="genre">Genre</Label>
              
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
              <div className="space-y-2 py-2 ">
                <Label className="text-sm text-gray-600">Or select from popular genres:</Label>
                <div className="flex flex-wrap gap-2">
                  {premadeGenres.map((premadeGenre) => (
                    <button
                      key={premadeGenre}
                      type="button"
                      onClick={() => addGenre(premadeGenre)}
                      disabled={genre.includes(premadeGenre)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        genre.includes(premadeGenre)
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
              {genre.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Selected genres:</Label>
                  <div className="flex flex-wrap gap-3">
                    {genre.map((g, index) => (
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
            {includeDateTime && (
              <div className="space-y-1">
                <Label className="py-2 px-1">Date & Time</Label>
                <div className="flex gap-4 justify-start">
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} className="text-gray-500" />
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          id="date-picker"
                          className="w-32 justify-between font-normal"
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
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <Input
                      type="time"
                      id="time-picker"
                      step="1"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-32 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                  </div>
                </div>
              </div>
            )}
            {includeLocationPicker && (
              <div className="space-y-2 py-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    {mounted ? (
                      <MiniMapPicker location={location} onChange={setLocation} highlight />
                    ) : (
                      <div className="h-64 w-full flex items-center justify-center bg-gray-100 rounded-lg">
                        <CircularLoader size="lg" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    {location ? (
                      <>
                        <div className="flex items-center gap-1 py-2">
                          <MapPin size={12} />
                          <span>Location: ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {placeResolving && <CircularLoader size="sm" />}
                          <span className="text-[11px]">
                            {placeResolving ? 'Resolving place name…' : (place || 'Unknown place')}
                          </span>
                        </div>
                      </>
                    ) : (
                      'Click on the map to choose a location.'
                    )}
                  </div>
                  <div className="flex justify-center py-2">
                    <IconTransitionButton
                      size="sm"
                      variant="outline"
                      defaultIcon={MapPin}
                      hoverIcon={MapPin}
                      onClick={() => setSearchOpen(true)}
                    >
                      Search Location
                    </IconTransitionButton>
                  </div>
                </div>
                <SearchLocationCommand
                  open={searchOpen}
                  onOpenChange={setSearchOpen}
                  onSelect={({ lat, lng }) => setLocation({ lat, lng })}
                />
              </div>
            )}
            <div className="space-y-3">
              <Input 
                id="file" 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="hidden"
              />

              {/* Image Display - Shows current image or new preview */}
              {(eventData?.imageUrl && !removeImage && !previewUrl) || previewUrl ? (
                <div className="relative group">
                  <img 
                    src={previewUrl || eventData?.imageUrl} 
                    alt={previewUrl ? "preview" : "current"} 
                    className="w-full h-48 rounded-lg object-cover" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg">
                    <IconTransitionButton
                      onClick={() => document.getElementById('file')?.click()}
                      defaultIcon={Plus}
                      hoverIcon={Plus}
                      variant="outline"
                      size="sm"
                      className="bg-white text-black hover:bg-gray-100 rounded-full"
                    >
                      Replace Image
                    </IconTransitionButton>
                  </div>
                  {previewUrl && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ) : null}

              {/* Remove Image Confirmation */}
              {removeImage && (
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <div className="text-sm text-red-600">Image will be removed</div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode !== 'join' && (
          <DialogFooter>
            <IconTransitionButton
              variant="ghost"
              defaultIcon={X}
              hoverIcon={X}
              onClick={() => onSecondary ? onSecondary() : onOpenChange(false)}
            >
              {secondaryLabel}
            </IconTransitionButton>
            {onPrimary && (
              <IconTransitionButton
                variant={mode === 'edit' ? 'primary' : 'primary'}
                defaultIcon={mode === 'edit' ? Save : (mode === 'create' ? Plus : Check)}
                hoverIcon={mode === 'edit' ? Save : (mode === 'create' ? Plus : Check)}
                disabled={Boolean(disablePrimary)}
                onClick={() => {
                  onPrimary({ title: localTitle, description: localDesc, genre, file, removeImage, date: when, time, location });
                }}
              >
                {resolvedPrimaryLabel}
              </IconTransitionButton>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


