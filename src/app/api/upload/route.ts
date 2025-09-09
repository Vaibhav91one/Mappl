import { NextRequest } from 'next/server';
import { Client, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

export const runtime = 'nodejs';

// Initialize client with proper environment variable validation
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

const client = new Client();
if (endpoint) client.setEndpoint(endpoint);
if (projectId) client.setProject(projectId);
if (apiKey) client.setKey(apiKey);

const storage = new Storage(client);
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID as string | undefined;

export async function POST(req: NextRequest) {
  if (!BUCKET_ID) return new Response('Bucket not configured', { status: 500 });
  try {
    const form = await req.formData();
    const file = form.get('file') as unknown as File | null;
    const creatorId = (form.get('creatorId') as string) || 'guest';
    if (!file) return new Response('No file', { status: 400 });
    const arrayBuffer = await (file as any).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const input = InputFile.fromBuffer(buffer, (file as any).name || 'upload.bin');
    const adminTeamId = process.env.NEXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID;
    const permissions = [
      'read("any")',
      `update("user:${creatorId}")`,
      `delete("user:${creatorId}")`,
      ...(adminTeamId ? [`update("team:${adminTeamId}")`, `delete("team:${adminTeamId}")`] : []),
    ];
    const created: any = await storage.createFile(BUCKET_ID, ID.unique(), input, permissions as any);
    const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${created.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    return Response.json({ fileId: created.$id, url });
  } catch (e: any) {
    return new Response(e?.message || 'Upload failed', { status: 500 });
  }
}


