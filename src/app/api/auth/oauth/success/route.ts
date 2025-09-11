import { NextRequest } from 'next/server';
import { Client, Account } from 'node-appwrite';
import { cookies } from 'next/headers';

// Initialize admin client with proper environment variable validation
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_APPWRITE_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error('Missing required Appwrite environment variables');
}

const adminClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const secret = searchParams.get('secret');
    const next = searchParams.get('next') || '/events';
    
    if (!userId || !secret) {
      return Response.redirect(`${req.nextUrl.origin}/auth?error=missing_params`);
    }
    
    const account = new Account(adminClient);
    
    // Create the session using the Appwrite client
    const session = await account.createSession(userId, secret);
    
    // Set the session cookie using Next.js cookies
    const cookieStore = await cookies();
    const cookieName = `a_session_${projectId}`;
    
    // Set cookie with proper options
    cookieStore.set(cookieName, session.secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor((new Date(session.expire).getTime() - Date.now()) / 1000),
      path: '/',
    });
    
    // Get user info and upsert to our database
    try {
      // Create a session client to get user info
      const sessionClient = new Client()
        .setEndpoint(endpoint!)
        .setProject(projectId!)
        .setSession(session.secret);
      
      const sessionAccount = new Account(sessionClient);
      const user = await sessionAccount.get();
      
      // Try to get avatar from provider
      let avatarUrl: string | undefined;
      try {
        const currentSession: any = await sessionAccount.getSession('current');
        if (currentSession?.provider === 'google' && currentSession?.providerAccessToken) {
          const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${currentSession.providerAccessToken}` },
          });
          const g = await r.json();
          avatarUrl = g?.picture;
        } else if (currentSession?.provider === 'github' && currentSession?.providerUid) {
          avatarUrl = `https://avatars.githubusercontent.com/u/${currentSession.providerUid}`;
        }
        
        // Update user preferences with avatar
        if (avatarUrl) {
          await sessionAccount.updatePrefs({ avatar: avatarUrl });
        }
      } catch (avatarError) {
        // Avatar fetch failed, continue without avatar
      }
      
      // Upsert user to our database
      const userPayload = {
        userId: user.$id,
        name: user.name,
        email: user.email,
        avatarUrl: avatarUrl || (user as any)?.prefs?.avatar || '',
        raw: user
      };
      
      // Make internal API call to upsert user
      const baseUrl = process.env.NEXT_PUBLIC_APPWRITE_SITE_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      const upsertResponse = await fetch(`${baseUrl}/api/users/upsert`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': `${cookieName}=${session.secret}` // Pass the session cookie
        },
        body: JSON.stringify(userPayload),
      });
      
      // User upserted (or failed silently)
      
    } catch (userError) {
      // User processing failed, continue with redirect
    }
    
    // Redirect to the next URL
    const redirectOrigin = process.env.NEXT_PUBLIC_APPWRITE_SITE_URL || req.nextUrl.origin;
    return Response.redirect(`${redirectOrigin}${next}`);
    
  } catch (error: any) {
    const errorOrigin = process.env.NEXT_PUBLIC_APPWRITE_SITE_URL || req.nextUrl.origin;
    return Response.redirect(`${errorOrigin}/auth?error=session_failed`);
  }
}
