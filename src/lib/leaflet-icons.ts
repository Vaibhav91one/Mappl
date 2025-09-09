import L from 'leaflet';
import { MapPin, Search } from 'lucide-react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

/**
 * Create a custom Leaflet icon from a Lucide React icon
 */
function createLucideIcon(
  IconComponent: React.ComponentType<{ size?: number; color?: string; className?: string }>,
  options: {
    size?: number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    shadowColor?: string;
  } = {}
) {
  const {
    size = 32,
    color = '#ffffff',
    backgroundColor = '#3b82f6',
    borderColor = '#ffffff',
    shadowColor = '#00000040'
  } = options;

  // Create SVG string from Lucide icon
  const iconSvg = renderToString(
    createElement(IconComponent, {
      size: size * 0.6, // Make icon 60% of the marker size
      color: color,
      className: 'lucide-icon'
    })
  );

  // Create the complete SVG with background circle
  const svgString = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow circle -->
      <circle cx="${size/2 + 2}" cy="${size/2 + 2}" r="${size/2 - 2}" fill="${shadowColor}" />
      <!-- Main circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${backgroundColor}" stroke="${borderColor}" stroke-width="2" />
      <!-- Icon -->
      <g transform="translate(${size/2}, ${size/2})" style="transform-origin: center;">
        ${iconSvg.replace(/<svg[^>]*>|<\/svg>/g, '').replace(/width="[^"]*"|height="[^"]*"/g, '')}
      </g>
    </svg>
  `;

  // Convert SVG to data URL
  const svgDataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;

  return L.icon({
    iconUrl: svgDataUrl,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2],
    shadowUrl: undefined, // We're including shadow in the SVG
    shadowSize: [0, 0],
    shadowAnchor: [0, 0],
    className: 'lucide-marker'
  });
}

// Predefined icon configurations
export const EventMarkerIcon = createLucideIcon(MapPin, {
  size: 40,
  color: '#ffffff',
  backgroundColor: '#3b82f6', // Blue
  borderColor: '#ffffff',
});

export const SearchMarkerIcon = createLucideIcon(Search, {
  size: 40,
  color: '#ffffff',
  backgroundColor: '#ef4444', // Red
  borderColor: '#ffffff',
});

export const JoinedEventMarkerIcon = createLucideIcon(MapPin, {
  size: 40,
  color: '#ffffff',
  backgroundColor: '#10b981', // Green
  borderColor: '#ffffff',
});

// Create a custom icon with any Lucide component
export function createCustomMarkerIcon(
  IconComponent: React.ComponentType<{ size?: number; color?: string; className?: string }>,
  options?: {
    size?: number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    shadowColor?: string;
  }
) {
  return createLucideIcon(IconComponent, options);
}

// Default fallback icon (if needed)
export const DefaultMarkerIcon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});
