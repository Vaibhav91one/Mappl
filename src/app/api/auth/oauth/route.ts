import { NextRequest } from 'next/server';
import { Client, Account, OAuthProvider } from 'node-appwrite';

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
    const provider = searchParams.get('provider') || 'google';
    const next = searchParams.get('next') || '/events';
    
    const account = new Account(adminClient);
    
    // Determine the OAuth provider
    let oauthProvider: OAuthProvider;
    switch (provider.toLowerCase()) {
      case 'github':
        oauthProvider = OAuthProvider.Github;
        break;
      case 'google':
        oauthProvider = OAuthProvider.Google;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unsupported provider' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
    
    // Create OAuth2 token with proper URLs
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const successUrl = `${baseUrl}/api/auth/oauth/success?next=${encodeURIComponent(next)}`;
    const failureUrl = `${baseUrl}/auth?error=oauth_failed`;
    
    const redirectUrl = await account.createOAuth2Token(
      oauthProvider,
      successUrl,
      failureUrl
    );
    
    // Redirect to OAuth provider
    return Response.redirect(redirectUrl);
    
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'OAuth initiation failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
