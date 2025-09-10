import { NextRequest } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';
import { authenticateRequest, createUnauthorizedResponse } from '@/lib/auth-middleware';

// Initialize client with proper environment variable validation
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);
if (apiKey) client.setKey(apiKey);

const databases = new Databases(client);
const ADMIN_TEAM_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID;

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string | undefined;
const EVENTS_COL = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID as string | undefined;

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(req: NextRequest) {

  if (!DB_ID || !EVENTS_COL) {
    return new Response(JSON.stringify({ error: 'Database not configured', data: [] }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }

  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    const joinedBy = searchParams.get('joinedBy');
    const code = searchParams.get('code');
    const queries: any[] = [];
    if (creatorId) queries.push(Query.equal('creatorId', creatorId));
    if (joinedBy) queries.push(Query.equal('joiners', joinedBy));
    if (code) queries.push(Query.equal('code', code));
    
    const res: any = await databases.listDocuments(DB_ID, EVENTS_COL, queries.length ? queries : undefined);
    const docs = res.documents || [];
    
    const mapped = docs.map((d: any) => ({
      id: d.$id,
      title: d.title,
      description: d.description,
      location: { lat: d.location_lat, lng: d.location_lng },
      joiners: d.joiners || [],
      imageUrl: d.imageUrl,
      code: d.code,
      date: d.date,
      creatorId: d.creatorId,
      genre: d.genre || [],
    }));
    
    return new Response(JSON.stringify({ data: mapped, success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch events', 
      data: [], 
      success: false 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

export async function POST(req: NextRequest) {
  if (!DB_ID || !EVENTS_COL) return new Response('Database not configured', { status: 500 });
  
  // Authenticate the user
  let user;
  try {
    user = await authenticateRequest(req);
  } catch (error: any) {
    return createUnauthorizedResponse(error.message);
  }
  
  const body = await req.json();
  const genCode = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? (crypto as any).randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()
    : Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase();
  const data: any = {
    title: body.title,
    description: body.description || undefined,
    location_lat: body.location?.lat ?? null,
    location_lng: body.location?.lng ?? null,
    date: body.date || undefined,
    imageUrl: body.imageUrl || '',
    joiners: Array.isArray(body.joiners) ? body.joiners : [],
    genre: Array.isArray(body.genre) ? body.genre : [],
    code: body.code || genCode,
    creatorId: user.$id, // Use authenticated user's ID
  };
  try {
    const permissions = [
      'read("users")',
      `update("user:${data.creatorId}")`,
      `delete("user:${data.creatorId}")`,
      ...(ADMIN_TEAM_ID ? [`update("team:${ADMIN_TEAM_ID}")`, `delete("team:${ADMIN_TEAM_ID}")`] : []),
    ];
    const doc: any = await databases.createDocument(DB_ID, EVENTS_COL, ID.unique(), data, permissions);
    // update user's createdEventIds
    try {
      const usersCol = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
      const found: any = await databases.listDocuments(DB_ID, usersCol, [Query.equal('userId', data.creatorId)]);
      if (found.documents?.length) {
        const udoc = found.documents[0];
        const ids: string[] = Array.isArray(udoc.createdEventIds) ? udoc.createdEventIds : [];
        if (!ids.includes(doc.$id)) {
          await databases.updateDocument(DB_ID, usersCol, udoc.$id, { createdEventIds: [...ids, doc.$id] });
        }
      }
    } catch {}
    const created = {
      id: doc.$id,
      title: doc.title,
      description: doc.description,
      location: { lat: doc.location_lat, lng: doc.location_lng },
      joiners: doc.joiners || [],
      imageUrl: doc.imageUrl,
      code: doc.code,
      date: doc.date,
      creatorId: doc.creatorId,
      genre: doc.genre || [],
    };
    return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(e?.message || 'Create failed', { status: 500 });
  }
}


