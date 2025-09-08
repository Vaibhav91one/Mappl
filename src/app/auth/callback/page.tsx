"use client";

import { useEffect, useState } from 'react';
import { account } from '@/lib/appwrite';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    account.get()
      .then(async (u) => {
        setStatus('success');
        toast.success('Signed in successfully');
        try {
          // Derive avatar from provider
          let avatarUrl: string | undefined;
          try {
            const sess: any = await account.getSession('current');
            if (sess?.provider === 'google' && sess?.providerAccessToken) {
              const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${sess.providerAccessToken}` },
              });
              const g = await r.json();
              avatarUrl = g?.picture;
            } else if (sess?.provider === 'github' && sess?.providerUid) {
              avatarUrl = `https://avatars.githubusercontent.com/u/${sess.providerUid}`;
            }
            if (avatarUrl) {
              await account.updatePrefs({ avatar: avatarUrl });
            }
          } catch {}

          await fetch('/api/users/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: u.$id, name: u.name, email: u.email, avatarUrl: avatarUrl || (u as any)?.prefs?.avatar || '', raw: u }),
          });
        } catch {}
      })
      .catch(() => {
        setStatus('error');
        toast.error('Sign-in failed');
      })
      .finally(() => {
        const next = new URLSearchParams(window.location.search).get('next') || '/events';
        setTimeout(() => {
          window.location.replace(next);
        }, 400);
      });
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      {status === 'loading' && <div>Completing sign-in…</div>}
      {status === 'success' && <div>Signed in! Redirecting…</div>}
      {status === 'error' && <div>Could not verify session. Redirecting…</div>}
    </div>
  );
}


