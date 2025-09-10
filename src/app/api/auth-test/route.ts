import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        $id: user.$id,
        name: user.name,
        email: user.email
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
