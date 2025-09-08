import { NextRequest } from 'next/server';
import { Client, Databases, Query, Storage } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.NEXT_PUBLIC_APPWRITE_API_KEY!);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string | undefined;
const EVENTS_COL = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID as string | undefined;
const MSG_COL = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID as string | undefined;

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!DB_ID || !EVENTS_COL) return new Response('Database not configured', { status: 500 });
  try {
    const { id } = await params;
    const d: any = await databases.getDocument(DB_ID, EVENTS_COL, id);
    const mapped = {
      id: d.$id,
      title: d.title,
      description: d.description,
      location: { lat: d.location_lat, lng: d.location_lng },
      joiners: d.joiners || [],
      imageUrl: d.imageUrl,
      date: d.date,
      code: d.code,
      creatorId: d.creatorId,
      genre: d.genre || [],
    };
    return Response.json(mapped);
  } catch (e: any) {
    return new Response('Not found', { status: 404 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!DB_ID || !EVENTS_COL) return new Response('Database not configured', { status: 500 });
  const body = await req.json();
  const updates: any = { ...body };
  if (body.location && typeof body.location.lat === 'number' && typeof body.location.lng === 'number') {
    updates.location_lat = body.location.lat;
    updates.location_lng = body.location.lng;
    delete updates.location;
  }
  // If imageUrl is being cleared, remove previous file from storage
  let shouldDeleteFile = false;
  try {
    if (body.imageUrl === '') {
      const { id } = await ctx.params;
      const existing: any = await databases.getDocument(DB_ID!, EVENTS_COL!, id);
      if (existing?.imageUrl) {
        const u = new URL(existing.imageUrl);
        const parts = u.pathname.split('/');
        const fileIdx = parts.findIndex((p) => p === 'files');
        const fileId = fileIdx >= 0 ? parts[fileIdx + 1] : undefined;
        const bucketIdx = parts.findIndex((p) => p === 'buckets');
        const bucketId = bucketIdx >= 0 ? parts[bucketIdx + 1] : process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
        if (fileId && bucketId) {
          await storage.deleteFile(bucketId, fileId);
          shouldDeleteFile = true;
        }
      }

    }
  } catch {}
  try {
    const { id } = await ctx.params;
    const d: any = await databases.updateDocument(DB_ID, EVENTS_COL, id, updates);
    // if joiners updated, reflect in user's joinedEventIds
    try {
      if (Array.isArray(updates.joiners)) {
        const usersCol = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
        for (const uid of updates.joiners as string[]) {
          const found: any = await databases.listDocuments(DB_ID, usersCol, [Query.equal('userId', uid)]);
          if (found.documents?.length) {
            const udoc = found.documents[0];
            const ids: string[] = Array.isArray(udoc.joinedEventIds) ? udoc.joinedEventIds : [];
            if (!ids.includes(id)) {
              await databases.updateDocument(DB_ID, usersCol, udoc.$id, { joinedEventIds: [...ids, id] });
            }
          }
        }
      }
    } catch {}
    const mapped = {
      id: d.$id,
      title: d.title,
      description: d.description,
      location: { lat: d.location_lat, lng: d.location_lng },
      joiners: d.joiners || [],
      imageUrl: d.imageUrl,
      date: d.date,
      code: d.code,
      creatorId: d.creatorId,
      genre: d.genre || [],
    };
    return Response.json(mapped);
  } catch (e: any) {
    return new Response('Not found', { status: 404 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!DB_ID || !EVENTS_COL) return new Response('Database not configured', { status: 500 });
  try {
    const { id } = await ctx.params;
    // Fetch doc to remove associated image and get event code
    let eventCode: string | undefined;
    try {
      const d: any = await databases.getDocument(DB_ID, EVENTS_COL, id);
      eventCode = d?.code;
      const imageUrl: string | undefined = d?.imageUrl;
      if (imageUrl) {
        try {
          const u = new URL(imageUrl);
          const parts = u.pathname.split('/');
          // /storage/buckets/{bucket}/files/{fileId}/view
          const fileIdx = parts.findIndex((p) => p === 'files');
          const fileId = fileIdx >= 0 ? parts[fileIdx + 1] : undefined;
          const bucketIdx = parts.findIndex((p) => p === 'buckets');
          const bucketId = bucketIdx >= 0 ? parts[bucketIdx + 1] : process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!;
          if (fileId && bucketId) {
            await storage.deleteFile(bucketId, fileId);
          }
        } catch {}
      }
    } catch {}

    // Delete associated messages if event code exists
    if (eventCode && MSG_COL) {
      try {
        // Get all messages for this event
        const messages: any = await databases.listDocuments(DB_ID, MSG_COL, [
          Query.equal('code', eventCode),
          Query.limit(1000) // Get up to 1000 messages
        ]);
        
        // Delete all messages in batches
        const messageIds = messages.documents?.map((msg: any) => msg.$id) || [];
        for (const msgId of messageIds) {
          try {
            await databases.deleteDocument(DB_ID, MSG_COL, msgId);
          } catch (deleteError) {
            console.warn(`Failed to delete message ${msgId}:`, deleteError);
          }
        }
      } catch (msgError) {
        console.warn('Failed to delete associated messages:', msgError);
      }
    }

    await databases.deleteDocument(DB_ID, EVENTS_COL, id);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response('Not found', { status: 404 });
  }
}



