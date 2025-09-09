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

    // Make server-side request to Nominatim
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'Mappl/1.0 (https://mappl.appwrite.network)', // Required by Nominatim
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Geocoding service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Nominatim response:', data);

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
