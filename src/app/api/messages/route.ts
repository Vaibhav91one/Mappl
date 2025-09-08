import { NextRequest } from 'next/server';
import { Client, Databases, ID, Query } from 'node-appwrite';

// Initialize client with proper environment variable validation
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);
if (apiKey) client.setKey(apiKey);

const databases = new Databases(client);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string | undefined;
const MSG_COL = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined;
const USERS_COL = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string | undefined;
const EVENTS_COL = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID as string | undefined;
const ADMIN_TEAM_ID = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID;

export async function GET(req: NextRequest) {
  if (!DB_ID || !MSG_COL) return Response.json([], { status: 200 });
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const limit = Number(searchParams.get('limit') || 30);
    const cursor = searchParams.get('cursor');
    if (!code) return Response.json([], { status: 200 });
    const queries: any[] = [
      Query.equal('code', code),
      Query.orderDesc('createdAt'),
      Query.limit(Math.max(1, Math.min(limit, 100))),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const res: any = await databases.listDocuments(DB_ID, MSG_COL, queries);
    const docs = res.documents || [];
    const mapped = docs.map((d: any) => ({
      id: d.$id,
      code: d.code,
      userId: d.userId,
      text: d.text,
      createdAt: d.createdAt,
      userName: d.userName,
      userAvatar: d.userAvatar,
    }));
    return Response.json(mapped);
  } catch (e) {
    return Response.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  if (!DB_ID || !MSG_COL) return new Response('Database not configured', { status: 500 });
  try {
    const body = await req.json();
    const code: string | undefined = body.code;
    const userId: string | undefined = body.userId;
    const text: string | undefined = (body.text || '').toString().slice(0, 2048);
    if (!code || !userId || !text) return new Response('Missing fields', { status: 400 });

    // Permission: only creator or joined users can send
    if (EVENTS_COL) {
      try {
        const foundEvt: any = await databases.listDocuments(DB_ID!, EVENTS_COL, [Query.equal('code', code)]);
        const evt = foundEvt.documents?.[0];
        const joiners: string[] = Array.isArray(evt?.joiners) ? evt.joiners : [];
        const creatorId: string | undefined = evt?.creatorId;
        const allowed = Boolean(creatorId === userId || joiners.includes(userId));
        if (!allowed) {
          return new Response('Forbidden', { status: 403 });
        }
      } catch {
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Resolve user profile from users collection
    let userName: string | undefined;
    let userAvatar: string | undefined;
    if (USERS_COL) {
      try {
        const found: any = await databases.listDocuments(DB_ID!, USERS_COL, [Query.equal('userId', userId)]);
        if (found.documents?.length) {
          userName = found.documents[0].name || undefined;
          userAvatar = found.documents[0].avatarUrl || undefined;
        }
      } catch {}
    }

    const data: any = {
      code,
      userId,
      text,
      createdAt: new Date().toISOString(),
      userName,
      userAvatar,
    };

    const permissions = [
      'read("users")',
      `update("user:${userId}")`,
      `delete("user:${userId}")`,
      ...(ADMIN_TEAM_ID ? [`update("team:${ADMIN_TEAM_ID}")`, `delete("team:${ADMIN_TEAM_ID}")`] : []),
    ];

    const doc: any = await databases.createDocument(DB_ID, MSG_COL, ID.unique(), data, permissions);
    const created = {
      id: doc.$id,
      code: doc.code,
      userId: doc.userId,
      text: doc.text,
      createdAt: doc.createdAt,
      userName: doc.userName,
      userAvatar: doc.userAvatar,
    };
    return new Response(JSON.stringify(created), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(e?.message || 'Create failed', { status: 500 });
  }
}


