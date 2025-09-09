import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '5';

    if (!query) {
      return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build Nominatim API URL
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('q', query);
    nominatimUrl.searchParams.set('limit', limit);
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('dedupe', '1');

    console.log('Proxying search request to:', nominatimUrl.toString());

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
      console.log('Nominatim search response received successfully:', data.length, 'results');
      
    } catch (fetchError: any) {
      console.error('Search fetch request failed:', fetchError.message || fetchError);
      
      // Try to parse the query as lat,lng coordinates as fallback
      const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const [, lat, lng] = coordMatch;
        const fallbackResponse = [{
          display_name: `Coordinates: ${lat}, ${lng}`,
          lat: lat,
          lon: lng,
          place_id: 0,
          licence: 'Fallback coordinate parsing',
          osm_type: 'fallback',
          osm_id: 0,
          class: 'place',
          type: 'coordinate',
          importance: 0.5,
          addresstype: 'coordinate',
          address: {
            coordinates: `${lat}, ${lng}`,
            country: 'Unknown',
          },
          error: 'Network error - parsed coordinates'
        }];
        
        return new Response(JSON.stringify(fallbackResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Fallback': 'true',
          },
        });
      }
      
      // Return empty results if no coordinate fallback possible
      return new Response(JSON.stringify([]), {
        status: 200,
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
    console.error('Forward geocoding error:', error);
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
