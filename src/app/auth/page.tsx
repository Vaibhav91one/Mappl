"use client";

import { account } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const googleRedirect = process.env.NEXT_PUBLIC_APPWRITE_GOOGLE_OAUTH || '';
const githubRedirect = process.env.NEXT_PUBLIC_APPWRITE_GITHUB_OAUTH || googleRedirect || '';
const failureRedirect = typeof window !== 'undefined' ? window.location.origin + '/auth?error=oauth' : googleRedirect;

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user]);
  async function loginWith(provider: 'google' | 'github') {
    // Use environment variable for production, fallback to window.location.origin
    const origin = process.env.NEXT_PUBLIC_APPWRITE_SITE_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const success = `${origin}/auth/callback?next=/dashboard`;
    const failure = `${origin}/`;
    const mapped = provider === 'google' ? OAuthProvider.Google : OAuthProvider.Github;
    try {
      await account.createOAuth2Session({ provider: mapped, success, failure, scopes: provider === 'google' ? ['openid','email','profile'] : ['read:user','user:email'] });
      toast.success('Redirecting to provider…');
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


