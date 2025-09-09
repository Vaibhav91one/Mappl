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

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string | undefined;
const EVENTS_COL = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID as string | undefined;
const USERS_COL = process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID as string | undefined;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!DB_ID || !EVENTS_COL || !USERS_COL) {
    return new Response('Database not configured', { status: 500 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response('User ID required', { status: 400 });
    }

    // Get the event
    const event: any = await databases.getDocument(DB_ID, EVENTS_COL, id);
    const currentJoiners = Array.isArray(event.joiners) ? event.joiners : [];

    // Check if user is already joined
    if (currentJoiners.includes(userId)) {
      return new Response('User already joined', { status: 400 });
    }

    // Add user to joiners
    const updatedJoiners = [...currentJoiners, userId];
    const updatedEvent: any = await databases.updateDocument(DB_ID, EVENTS_COL, id, {
      joiners: updatedJoiners
    });

    // Update user's joinedEventIds
    try {
      const found: any = await databases.listDocuments(DB_ID, USERS_COL, [Query.equal('userId', userId)]);
      if (found.documents?.length) {
        const userDoc = found.documents[0];
        const joinedEventIds: string[] = Array.isArray(userDoc.joinedEventIds) ? userDoc.joinedEventIds : [];
        if (!joinedEventIds.includes(id)) {
          await databases.updateDocument(DB_ID, USERS_COL, userDoc.$id, { 
            joinedEventIds: [...joinedEventIds, id] 
          });
        }
      }
    } catch (userError) {
      // Handle user update error silently
    }

    // Return updated event
    const mapped = {
      id: updatedEvent.$id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      location: { lat: updatedEvent.location_lat, lng: updatedEvent.location_lng },
      joiners: updatedEvent.joiners || [],
      imageUrl: updatedEvent.imageUrl,
      date: updatedEvent.date,
      code: updatedEvent.code,
      creatorId: updatedEvent.creatorId,
      genre: updatedEvent.genre || [],
    };

    return Response.json(mapped);
  } catch (e: any) {
    return new Response('Join failed', { status: 500 });
  }
}
