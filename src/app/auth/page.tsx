"use client";

import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user]);
  async function loginWith(provider: 'google' | 'github') {
    try {
      const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
      const oauthUrl = `/api/auth/oauth?provider=${provider}&next=${encodeURIComponent(next)}`;
      
      toast.success('Redirecting to provider…');
      // Redirect to our server-side OAuth endpoint
      window.location.href = oauthUrl;
    } catch (e: any) {
      toast.error('OAuth failed to start');
    }
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button onClick={() => loginWith('google')}>Continue with Google</Button>
        <Button variant="outline" onClick={() => loginWith('github')}>Continue with GitHub</Button>
      </div>
      <p className="text-xs text-gray-500 mt-4">Make sure your redirect URLs are allowed in Appwrite Console OAuth settings.</p>
    </div>
  );
}


