/**
 * Client-side geocoding fallback utilities
 * These can be used when the server-side proxy fails
 */

export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    [key: string]: string;
  };
  place_id?: number;
  error?: string;
}

/**
 * Format coordinates as a readable location string
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Create a fallback geocoding result from coordinates
 */
export function createCoordinateFallback(lat: number, lng: number): GeocodingResult {
  return {
    display_name: formatCoordinates(lat, lng),
    lat: lat.toString(),
    lon: lng.toString(),
    address: {
      coordinates: `${lat}, ${lng}`,
      country: 'Unknown Location',
    },
    place_id: 0,
    error: 'Using coordinates only - geocoding unavailable'
  };
}

/**
 * Try to reverse geocode with fallback to coordinates
 */
export async function reverseGeocodeWithFallback(lat: number, lng: number): Promise<GeocodingResult> {
  try {
    // First try our proxy API
    const response = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lng}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.display_name) {
        return data;
      }
    }
    
    // If proxy fails, return coordinate fallback
    return createCoordinateFallback(lat, lng);
    
  } catch (error) {
    console.warn('Reverse geocoding failed, using coordinates:', error);
    return createCoordinateFallback(lat, lng);
  }
}

/**
 * Try to search for locations with fallback to coordinate parsing
 */
export async function searchLocationsWithFallback(query: string): Promise<GeocodingResult[]> {
  try {
    // First try our proxy API
    const response = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
    
    // Try to parse as coordinates (lat,lng or lng,lat)
    const coordMatch = query.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const [, first, second] = coordMatch;
      const lat = parseFloat(first);
      const lng = parseFloat(second);
      
      // Basic validation for reasonable coordinate ranges
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return [{
          display_name: `Coordinates: ${formatCoordinates(lat, lng)}`,
          lat: lat.toString(),
          lon: lng.toString(),
          address: {
            coordinates: `${lat}, ${lng}`,
            country: 'Parsed Coordinates',
          },
          place_id: 0,
          error: 'Parsed from coordinate input'
        }];
      }
    }
    
    // No results found
    return [];
    
  } catch (error) {
    console.warn('Location search failed:', error);
    
    // Still try coordinate parsing as final fallback
    const coordMatch = query.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const [, first, second] = coordMatch;
      const lat = parseFloat(first);
      const lng = parseFloat(second);
      
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return [{
          display_name: `Coordinates: ${formatCoordinates(lat, lng)}`,
          lat: lat.toString(),
          lon: lng.toString(),
          address: {
            coordinates: `${lat}, ${lng}`,
          },
          place_id: 0,
          error: 'Network error - parsed coordinates'
        }];
      }
    }
    
    return [];
  }
}

/**
 * Get a human-readable location name from geocoding result
 */
export function getLocationDisplayName(result: GeocodingResult): string {
  if (!result.display_name) {
    return formatCoordinates(parseFloat(result.lat), parseFloat(result.lon));
  }
  
  // If it's a fallback result, show the formatted name
  if (result.error) {
    return result.display_name;
  }
  
  // For real geocoding results, try to extract meaningful parts
  const address = result.address || {};
  const parts = [];
  
  // Try to get the most specific location first
  if (address.amenity || address.building || address.road) {
    parts.push(address.amenity || address.building || address.road);
  }
  if (address.suburb || address.neighbourhood) {
    parts.push(address.suburb || address.neighbourhood);
  }
  if (address.city || address.town || address.village) {
    parts.push(address.city || address.town || address.village);
  }
  
  if (parts.length > 0) {
    return parts.join(', ');
  }
  
  return result.display_name;
}
