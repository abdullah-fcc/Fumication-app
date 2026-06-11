'use client';

// Must be loaded via: dynamic(() => import('@/components/MapPicker'), { ssr: false })

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search } from '@/components/icons';

// Fix Leaflet's broken default icon paths in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY!;

interface Suggestion {
  formatted: string;
  lat: number;
  lon: number;
  result_type: string;
}

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markerRef    = useRef<L.Marker | null>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery]             = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState('');

  // ── Init map once on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initLat  = lat ?? 31.5204; // Default: Lahore
    const initLng  = lng ?? 74.3587;
    const initZoom = lat != null ? 14 : 6;

    const map = L.map(containerRef.current).setView([initLat, initLng], initZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Pre-fill marker if coords already exist
    if (lat != null && lng != null) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        onChange(round(p.lat), round(p.lng));
      });
    }

    // Click to drop / move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const rLat = round(e.latlng.lat);
      const rLng = round(e.latlng.lng);

      if (markerRef.current) {
        markerRef.current.setLatLng([rLat, rLng]);
      } else {
        markerRef.current = L.marker([rLat, rLng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const p = markerRef.current!.getLatLng();
          onChange(round(p.lat), round(p.lng));
        });
      }
      onChange(rLat, rLng);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync when parent updates lat/lng (edit-form prefill) ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || lat == null || lng == null) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        onChange(round(p.lat), round(p.lng));
      });
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 14));
  }, [lat, lng, onChange]);

  // ── Live autocomplete suggestions as the user types ───────────────────────
  function handleQueryChange(value: string) {
    setQuery(value);
    setSearchError('');

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const url =
          `https://api.geoapify.com/v1/geocode/autocomplete` +
          `?text=${encodeURIComponent(value)}` +
          `&filter=countrycode:pk` +
          `&format=json` +
          `&limit=5` +
          `&apiKey=${GEOAPIFY_KEY}`;

        const res  = await fetch(url);
        const data = await res.json();
        setSuggestions(data.results ?? []);
        setShowSuggestions(true);
      } catch {
        // Silently ignore — user can still hit Search
      }
    }, 300);
  }

  // ── Jump map to a chosen suggestion (user still places exact pin) ─────────
  function selectSuggestion(s: Suggestion) {
    setQuery(s.formatted);
    setSuggestions([]);
    setShowSuggestions(false);

    const numLat = round(s.lat);
    const numLng = round(s.lon);
    const map = mapRef.current;
    if (!map) return;

    map.setView([numLat, numLng], zoomForType(s.result_type));

    if (markerRef.current) {
      markerRef.current.setLatLng([numLat, numLng]);
    } else {
      markerRef.current = L.marker([numLat, numLng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const p = markerRef.current!.getLatLng();
        onChange(round(p.lat), round(p.lng));
      });
    }
    onChange(numLat, numLng);
  }

  // ── Fallback: search button / Enter key ────────────────────────────────────
  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setShowSuggestions(false);
    try {
      const url =
        `https://api.geoapify.com/v1/geocode/search` +
        `?text=${encodeURIComponent(query)}` +
        `&filter=countrycode:pk` +
        `&format=json` +
        `&limit=1` +
        `&apiKey=${GEOAPIFY_KEY}`;

      const res  = await fetch(url);
      const data = await res.json();

      if (!data.results?.length) {
        setSearchError('Not found — try a nearby landmark or area, then drag the pin to your exact spot');
        return;
      }

      const result = data.results[0];
      const numLat = round(result.lat);
      const numLng = round(result.lon);
      onChange(numLat, numLng);
      mapRef.current?.setView([numLat, numLng], zoomForType(result.result_type));

      if (mapRef.current) {
        if (markerRef.current) {
          markerRef.current.setLatLng([numLat, numLng]);
        } else {
          markerRef.current = L.marker([numLat, numLng], { draggable: true }).addTo(mapRef.current);
          markerRef.current.on('dragend', () => {
            const p = markerRef.current!.getLatLng();
            onChange(round(p.lat), round(p.lng));
          });
        }
      }
    } catch {
      setSearchError('Search failed. Check your connection.');
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. DHA Phase 5 Karachi, Packages Mall Lahore…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-[1000] mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectSuggestion(s)}
                  className="flex w-full items-start gap-2 px-3.5 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
                >
                  <Search size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>{s.formatted}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchError && <p className="text-xs text-red-600">{searchError}</p>}

      {/* Map canvas */}
      <div
        ref={containerRef}
        className="w-full rounded-lg border border-gray-200 overflow-hidden"
        style={{ height: 320 }}
      />

      {/* Coordinates */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <MapPin size={12} className="text-indigo-500 flex-shrink-0" />
        {lat != null && lng != null ? (
          <span>
            Pin at <span className="font-medium text-gray-700">{lat}, {lng}</span>
            {' '}— drag the pin to your exact spot
          </span>
        ) : (
          <span>Pick a suggestion or click the map, then drag the pin to your exact spot</span>
        )}
      </div>

    </div>
  );
}

function round(n: number) {
  return parseFloat(n.toFixed(6));
}

// Geoapify result_type → reasonable zoom level so we don't over- or under-zoom
function zoomForType(type: string): number {
  switch (type) {
    case 'amenity':
    case 'building':
    case 'street':
      return 17;
    case 'suburb':
    case 'neighbourhood':
    case 'district':
      return 15;
    case 'city':
      return 13;
    default:
      return 12;
  }
}
