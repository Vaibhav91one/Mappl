import { NextRequest } from 'next/server';
import { Client, Databases, Query } from 'node-appwrite';

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

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const res: any = await databases.listDocuments(DB_ID, USERS_COL, [Query.equal('userId', id)]);
    if (!res.documents?.length) return new Response('Not found', { status: 404 });
    return Response.json(res.documents[0]);
  } catch (e: any) {
    return new Response(e?.message || 'Failed', { status: 500 });
  }
}


