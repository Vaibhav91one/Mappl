import { NextRequest } from 'next/server';
import { Client, Databases, Query, ID } from 'node-appwrite';
import { authenticateRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/auth-middleware';

// Initialize client with proper environment variable validation
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);
if (apiKey) client.setKey(apiKey);

const databases = new Databases(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COL = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

export async function POST(req: NextRequest) {
  // Authenticate the user
  let user;
  try {
    user = await authenticateRequest(req);
  } catch (error: any) {
    return createUnauthorizedResponse(error.message);
  }

  try {
    const body = await req.json();
    const { userId, name, email, avatarUrl, raw } = body as { userId: string; name?: string; email?: string; avatarUrl?: string; raw?: any };
    
    // Check if the authenticated user is trying to update their own profile
    if (userId !== user.$id) {
      return createForbiddenResponse('You can only update your own profile');
    }

    const found: any = await databases.listDocuments(DB_ID, USERS_COL, [Query.equal('userId', userId)]);
    if (found.documents && found.documents.length > 0) {
      const doc = found.documents[0];
      const res = await databases.updateDocument(DB_ID, USERS_COL, doc.$id, {
        name: name ?? doc.name,
        email: email ?? doc.email,
        avatarUrl: avatarUrl ?? doc.avatarUrl,
      });
      return Response.json(res);
    }
    const res = await databases.createDocument(DB_ID, USERS_COL, ID.unique(), {
      userId,
      name: name ?? '',
      email: email ?? '',
      avatarUrl: avatarUrl ?? '',
      joinedEventIds: [],
      createdEventIds: [],
    });
    return Response.json(res, { status: 201 });
  } catch (e: any) {
    return new Response(e?.message || 'Upsert failed', { status: 500 });
  }
}


