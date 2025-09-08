"use client";

import { useAuth } from '@/providers/AuthProvider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FlipText } from '@/components/animation';

export default function NavBar() {
  const { user, signOut, loading } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (!user) { 
      setAvatarUrl(null); 
      setShowLoader(false);
      return; 
    }
    
    // Show loader for at least 2 seconds
    const loaderTimeout = setTimeout(() => {
      setShowLoader(false);
    }, 2000);
    
    fetch(`/api/users/${user.$id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((doc) => {
        setAvatarUrl(doc?.avatarUrl || null);
        // Hide loader after avatar is loaded (or after 2 seconds, whichever is longer)
        setTimeout(() => setShowLoader(false), 100);
      })
      .catch(() => {
        setAvatarUrl(null);
        // Hide loader after error (or after 2 seconds, whichever is longer)
        setTimeout(() => setShowLoader(false), 100);
      });
      
    return () => clearTimeout(loaderTimeout);
  }, [user]);

  return (
    <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <Image src="/logos/mappl_logo.svg" alt="Mappl" width={32} height={32} />
        <FlipText 
          href="/" 
          className="font-semibold text-md cursor-pointer"
          as="a"
          duration={0.5}
          stagger={0.02}
        >
          Mappl
        </FlipText>
      </div>
      <div className="flex items-center gap-6">
        <FlipText 
          href="/events" 
          className="text-sm font-medium"
          as="a"
          duration={0.5}
          stagger={0.01}
        >
          Events
        </FlipText>
        <FlipText 
          href="/dashboard" 
          className="text-sm font-medium"
          as="a"
          duration={0.5}
          stagger={0.01}
        >
          Dashboard
        </FlipText>
        {loading ? null : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild className='outline-none'>
              <Button variant="outline" className="flex items-center gap-2 shadow-none border-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                {showLoader ? (
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                  </div>
                ) : avatarUrl ? (
                  <div className="relative">
                    <Image
                      src={avatarUrl.includes('avatars.githubusercontent.com') ? `${avatarUrl}?s=64` : avatarUrl}
                      alt="avatar"
                      width={36}
                      height={36}
                      className="rounded-full"
                      onError={() => {
                        setAvatarUrl(null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                    {user.name ? (
                      <span className="text-sm font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : user.email ? (
                      <span className="text-sm font-medium text-gray-700">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">U</span>
                    )}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/events">Events</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <FlipText 
            href="/auth" 
            className="text-sm font-medium"
            as="a"
            duration={0.5}
            stagger={0.01}
          >
            Sign-in
          </FlipText>
        )}
      </div>
    </nav>
  );
}


