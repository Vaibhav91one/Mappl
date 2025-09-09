import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const lng = searchParams.get('lng'); // Also accept 'lng' for compatibility

    if (!lat || (!lon && !lng)) {
      return new Response(JSON.stringify({ error: 'Missing lat/lon parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Use lon or lng, prefer lon
    const longitude = lon || lng;

    if (!longitude) {
      return new Response(JSON.stringify({ error: 'Missing longitude parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build Nominatim API URL
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('lat', lat);
    nominatimUrl.searchParams.set('lon', longitude);
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('zoom', '16');

    console.log('Proxying request to:', nominatimUrl.toString());

    let response;
    let data;
    
    try {
      // Make server-side request to Nominatim with timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      response = await fetch(nominatimUrl.toString(), {
        headers: {
          'User-Agent': 'Mappl/1.0 (https://mappl.appwrite.network)', // Required by Nominatim
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('Nominatim API HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      data = await response.json();
      console.log('Nominatim response received successfully');
      
    } catch (fetchError: any) {
      console.error('Fetch request failed:', fetchError.message || fetchError);
      
      // Provide a fallback response with basic location info
      const fallbackResponse = {
        display_name: `Location: ${lat}, ${longitude}`,
        lat: lat,
        lon: longitude,
        place_id: 0,
        licence: 'Fallback response due to network error',
        osm_type: 'fallback',
        osm_id: 0,
        class: 'place',
        type: 'coordinate',
        importance: 0,
        addresstype: 'coordinate',
        address: {
          coordinates: `${lat}, ${longitude}`,
          country: 'Unknown',
        },
        error: 'Network error - showing coordinates only'
      };
      
      return new Response(JSON.stringify(fallbackResponse), {
        status: 200, // Return 200 with fallback data instead of error
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Fallback': 'true',
        },
      });
    }

    // Return the data with proper CORS headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
