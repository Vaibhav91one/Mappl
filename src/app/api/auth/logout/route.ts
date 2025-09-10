import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

export async function POST(req: NextRequest) {
  try {
    if (!projectId) {
      throw new Error('Missing project ID');
    }
    
    // Clear the session cookie
    const cookieStore = await cookies();
    const cookieName = `a_session_${projectId}`;
    
    cookieStore.delete(cookieName);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
