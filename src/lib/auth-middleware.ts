import { NextRequest } from 'next/server';
import { Client, Account } from 'node-appwrite';
import { cookies } from 'next/headers';

// Initialize the session client
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error('Missing required Appwrite environment variables');
}

export interface AuthenticatedUser {
  $id: string;
  name: string;
  email: string;
}

export async function authenticateRequest(req: NextRequest): Promise<AuthenticatedUser> {
  // According to Appwrite SSR docs: https://appwrite.io/docs/products/auth/server-side-rendering
  // The session cookie should be named `a_session_<PROJECT_ID>` and contain the session secret
  const sessionCookieName = `a_session_${projectId}`;
  
  const cookieStore = await cookies();
  const session = cookieStore.get(sessionCookieName)?.value;

  // If the session cookie is not present, throw an error
  if (!session) {
    throw new Error('Unauthorized - No session cookie found');
  }

  try {
    // Create a new client instance for this request (as recommended by Appwrite docs)
    const sessionClient = new Client()
      .setEndpoint(endpoint!)
      .setProject(projectId!);
    
    // Pass the session secret to the Appwrite client
    // According to Appwrite SSR docs, the cookie should contain the session secret
    sessionClient.setSession(session);
    
    // Now, you can make authenticated requests to the Appwrite API
    const account = new Account(sessionClient);
    const user = await account.get();

    return {
      $id: user.$id,
      name: user.name,
      email: user.email,
    };
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message || 'Invalid session'}`);
  }
}

export function createUnauthorizedResponse(message: string = 'Unauthorized') {
  return new Response(JSON.stringify({ 
    success: false, 
    error: message 
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export function createForbiddenResponse(message: string = 'Forbidden') {
  return new Response(JSON.stringify({ 
    success: false, 
    error: message 
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
