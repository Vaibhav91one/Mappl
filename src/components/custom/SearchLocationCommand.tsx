"use client";

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Suggestion = { label: string; lat: number; lng: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (loc: { lat: number; lng: number; label: string }) => void;
  title?: string;
};

export default function SearchLocationCommand({ open, onOpenChange, onSelect, title = 'Search location' }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const debounceRef = useRef<number | null>(null);
  const [fallbackLoc, setFallbackLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSuggestions([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setSuggestions([]);
      setFallbackLoc(null);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
        const data: Array<{ lat: string; lon: string; display_name: string }> = await res.json();
        const mapped: Suggestion[] = data.slice(0, 8).map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
        setSuggestions(mapped);
        // Fallback: parse "lat,lng" input
        if (mapped.length === 0) {
          const m = query.trim().match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
          if (m) {
            const lat = parseFloat(m[1]);
            const lng = parseFloat(m[2]);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              setFallbackLoc({ lat, lng });
            } else {
              setFallbackLoc(null);
            }
          } else {
            setFallbackLoc(null);
          }
        } else {
          setFallbackLoc(null);
        }
      } catch (e) {
        setSuggestions([]);
        setFallbackLoc(null);
      }
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] sm:max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div>
          <Input
            autoFocus
            placeholder="Type a place to search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-2 max-h-60 overflow-auto rounded border">
            {suggestions.length === 0 && !fallbackLoc && (
              <div className="p-3 text-sm text-gray-500">No results</div>
            )}
            {fallbackLoc && (
              <button
                className="w-full text-left p-2 hover:bg-gray-50 text-sm"
                onClick={() => {
                  onSelect({ lat: fallbackLoc.lat, lng: fallbackLoc.lng, label: `${fallbackLoc.lat}, ${fallbackLoc.lng}` });
                  onOpenChange(false);
                }}
              >
                Use coordinates: {fallbackLoc.lat}, {fallbackLoc.lng}
              </button>
            )}
            {suggestions.map((s) => (
              <button
                key={`${s.lat}-${s.lng}`}
                className="w-full text-left p-2 hover:bg-gray-50"
                onClick={() => {
                  onSelect({ lat: s.lat, lng: s.lng, label: s.label });
                  onOpenChange(false);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


