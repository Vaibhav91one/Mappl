"use client";

import { useEffect, useState } from 'react';
import { storage } from '@/lib/appwrite';
import { listEvents, updateEvent, deleteEvent, joinEvent } from '@/lib/api/events';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import EventDialog from '@/components/custom/EventDialog';
import EventCard from '@/components/custom/EventCard';
import ChatWindow from '@/components/custom/ChatWindow';
import IconTransitionButton from '@/components/ui/IconTransitionButton';
import { Edit, Trash2, Eye } from 'lucide-react';
import Image from 'next/image';
import { FlipText } from '@/components/animation';

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID as string | undefined;
const EVENTS_COL = process.env.NEXT_PUBLIC_APPWRITE_EVENTS_COLLECTION_ID as string | undefined;
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID as string | undefined;

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [created, setCreated] = useState<any[]>([]);
  const [joined, setJoined] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [edit, setEdit] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genre, setGenre] = useState<string[]>([]);
  const [loadingCreated, setLoadingCreated] = useState(false);
  const [loadingJoined, setLoadingJoined] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<any | null>(null);
  const [joinOpen, setJoinOpen] = useState(false);

  const hasDbEnv = Boolean(DB_ID && EVENTS_COL);

  async function handleJoinEvent(eventId: string) {
    if (!user?.$id) return;
    try {
      const updatedEvent = await joinEvent(eventId, user.$id);
      // Update the active event if it's the same one
      if (activeEvent && (activeEvent.id === eventId || activeEvent.$id === eventId)) {
        setActiveEvent(updatedEvent);
      }
      // Refresh both created and joined events lists
      const [createdData, joinedData] = await Promise.all([
        listEvents({ creatorId: user.$id }),
        listEvents({ joinedBy: user.$id })
      ]);
      setCreated(createdData as any);
      setJoined(joinedData as any);
    } catch (error) {
      console.error('Failed to join event:', error);
    }
  }

  useEffect(() => {
    if (!user || !hasDbEnv) return;
    setLoadingCreated(true);
    setLoadingJoined(true);
    listEvents({ creatorId: user.$id })
      .then((data) => setCreated(data as any))
      .finally(() => setLoadingCreated(false));
    listEvents({ joinedBy: user.$id })
      .then((data) => setJoined(data as any))
      .finally(() => setLoadingJoined(false));
  }, [user, hasDbEnv]);

  async function startEdit(doc: any) {
    setEdit(doc);
    setTitle(doc.title || '');
    setDescription(doc.description || '');
    setGenre(doc.genre || []);
  }

  async function saveEdit() {
    if (!edit) return;
    let imageUrl = edit.imageUrl || '';
    try {
      if (file && BUCKET_ID) {
        const fileRes: any = await storage.createFile(BUCKET_ID, 'unique()', file);
        imageUrl = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileRes.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
      }
      const res: any = await updateEvent(edit.id || edit.$id, { title, description, imageUrl, genre } as any);
      setCreated((prev) => prev.map((d: any) => ((d.id || d.$id) === res.id ? res : d)));
    } catch {
      // swallow until backend is configured
    } finally {
      setEdit(null);
      setFile(null);
    }
  }

  if (loading) return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
    </div>
  );
  if (!user) return <div className="p-6">Please <a className="underline" href="/auth">sign in</a>.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <UserHeader userId={user.$id} fallbackName={user.name || user.email} />
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </div>

      <section>
        <FlipText
          className="text-lg font-semibold mb-4"
          duration={0.5}
          stagger={0.02}
        >
          Your-Events
        </FlipText>
        {!hasDbEnv && (
          <div className="text-sm text-gray-500 mb-2">Database not configured yet. Showing empty state.</div>
        )}
        {loadingCreated ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        ) : (
          <>
            {created.length === 0 && <div className="text-sm text-gray-500">No events planned yet.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {created.map((e: any) => (
                <div key={e.id || e.$id} className="relative group">
                  <EventCard
                    event={{
                      id: e.id || e.$id,
                      title: e.title,
                      description: e.description,
                      code: e.code,
                      location: e.location,
                      date: e.date,
                      time: e.time,
                      placeName: e.placeName,
                      imageUrl: e.imageUrl,
                      joiners: e.joiners || [],
                      genre: e.genre || []
                    }}
                    onJoin={() => {}} // Not used in dashboard
                    onChat={(event) => { setActiveEvent(event); setChatOpen(true); }}
                    onView={() => startEdit(e)} // Edit on click
                  />
                  
                  {/* Action buttons overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <IconTransitionButton
                      size="sm"
                      variant="secondary"
                      defaultIcon={Edit}
                      hoverIcon={Edit}
                      onClick={(ev) => { ev?.stopPropagation(); startEdit(e); }}
                      className="bg-white/90 backdrop-blur-sm rounded-full"
                    >
                      Edit
                    </IconTransitionButton>
                    <IconTransitionButton
                      size="sm"
                      variant="secondary"
                      defaultIcon={Trash2}
                      hoverIcon={Trash2}
                      onClick={async (ev) => { 
                        ev?.stopPropagation(); 
                        await deleteEvent(e.id || e.$id);
                        // Remove from created events
                        setCreated((prev) => prev.filter((d: any) => (d.id || d.$id) !== (e.id || e.$id)));
                        // Also remove from joined events if it exists there
                        setJoined((prev) => prev.filter((d: any) => (d.id || d.$id) !== (e.id || e.$id)));
                      }}
                      className="bg-red-500/90 backdrop-blur-sm text-white hover:bg-red-600 rounded-full"
                    >
                      Delete
                    </IconTransitionButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <FlipText
          className="text-lg font-semibold mb-4"
          duration={0.5}
          stagger={0.02}
        >
          Joined-Events
        </FlipText>
        {loadingJoined ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"></div>
          </div>
        ) : (
          <>
            {joined.length === 0 && <div className="text-sm text-gray-500">No joined events yet.</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {joined.map((e: any) => (
                <EventCard
                  key={e.id || e.$id}
                  event={{
                    id: e.id || e.$id,
                    title: e.title,
                    description: e.description,
                    code: e.code,
                    location: e.location,
                    date: e.date,
                    time: e.time,
                    placeName: e.placeName,
                    imageUrl: e.imageUrl,
                    joiners: e.joiners || [],
                    genre: e.genre || []
                  }}
                  onJoin={() => {}} // Not used in dashboard
                  onChat={(event) => { setActiveEvent(event); setChatOpen(true); }}
                  onView={(event) => { setActiveEvent(event); setJoinOpen(true); }}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <EventDialog
        open={!!edit}
        mode="edit"
        eventData={edit}
        includeDateTime
        includeLocationPicker
        initialLocation={edit?.location || null}
        onOpenChange={(v) => { if (!v) setEdit(null); }}
        onPrimary={async ({ title: t, description: d, genre: g, file: f, removeImage, date, time, location }) => {
          if (!edit) return;
          let imageUrl = edit.imageUrl || '';
          try {
            // Helper function to delete old image
            const deleteOldImage = async () => {
              if (edit.imageUrl) {
                try {
                  const oldUrl = new URL(edit.imageUrl);
                  const parts = oldUrl.pathname.split('/');
                  const fileIdx = parts.findIndex((p) => p === 'files');
                  const fileId = fileIdx >= 0 ? parts[fileIdx + 1] : undefined;
                  if (fileId && BUCKET_ID) {
                    await storage.deleteFile(BUCKET_ID, fileId);
                  }
                } catch (deleteError) {
                  console.warn('Failed to delete old image:', deleteError);
                }
              }
            };

            if (removeImage) {
              imageUrl = '';
              await deleteOldImage();
            } else if (f && BUCKET_ID) {
              // Delete old image before uploading new one
              await deleteOldImage();
              // Upload new image using the same method as events page
              const fd = new FormData();
              fd.append('file', f);
              const r = await fetch('/api/upload', { method: 'POST', body: fd });
              if (r.ok) {
                const json = await r.json();
                imageUrl = json.url as string;
              } else {
                console.error('Upload failed:', r.status, r.statusText);
              }
            }
            let isoDate: string | undefined = undefined;
            if (date) {
              const [hh = '00', mm = '00', ss = '00'] = (time || '00:00:00').split(':');
              const dt = new Date(date);
              dt.setHours(Number(hh), Number(mm), Number(ss), 0);
              isoDate = dt.toISOString();
            }
            const res: any = await updateEvent(edit.id || edit.$id, { title: t, description: d, genre: g, imageUrl, date: isoDate, location } as any);
            setCreated((prev) => prev.map((doc: any) => {
              if ((doc.id || doc.$id) === res.id) {
                return res;
              }
              return doc;
            }));
          } finally {
            setEdit(null);
            setFile(null);
          }
        }}
      />

      {/* Chat Dialog */}
      <EventDialog
        open={chatOpen}
        mode="view"
        title={activeEvent?.title ? `Chat — ${activeEvent.title}` : 'Chat'}
        onOpenChange={setChatOpen}
        content={activeEvent?.code ? (
          <div className="pt-2">
            <ChatWindow 
              code={activeEvent.code} 
              currentUserId={user?.$id}
              hasUserJoined={activeEvent.joiners?.includes(user?.$id || '') || false}
              isAuthenticated={!!user}
              onJoinEvent={() => handleJoinEvent(activeEvent.id || activeEvent.$id)}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No chat available for this event.
          </div>
        )}
      />

      {/* Join Dialog */}
      <EventDialog
        open={joinOpen}
        mode="join"
        eventData={activeEvent || undefined}
        includeDateTime={false}
        includeLocationPicker={false}
        currentUserId={user?.$id}
        onOpenChange={setJoinOpen}
        secondaryLabel="Close"
        onPrimary={() => {
          // Join functionality - could be implemented if needed
          setJoinOpen(false);
        }}
      />
    </div>
  );
}

function UserHeader({ userId, fallbackName }: { userId: string; fallbackName?: string }) {
  const [doc, setDoc] = useState<any>(null);
  useEffect(() => {
    fetch(`/api/users/${userId}`).then((r) => r.ok ? r.json() : null).then(setDoc).catch(() => setDoc(null));
  }, [userId]);
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
        {doc?.avatarUrl ? (
          <img
            src={doc.avatarUrl.includes('avatars.githubusercontent.com') 
              ? `${doc.avatarUrl}&s=64` 
              : doc.avatarUrl.includes('lh3.googleusercontent.com')
              ? `https://images.weserv.nl/?url=${encodeURIComponent(doc.avatarUrl.replace(/=s\d+-c$/, '=s64-c'))}`
              : doc.avatarUrl
            }
            alt="avatar"
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => {
              console.error('Avatar image failed to load:', doc.avatarUrl);
              // Hide the image and show fallback
              (e.target as HTMLImageElement).style.display = 'none';
              const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
            onLoad={() => {
            }}
          />
        ) : null}
        <div 
          className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center absolute"
          style={{ display: doc?.avatarUrl ? 'none' : 'flex' }}
        >
          <span className="text-gray-500 text-xs font-medium">
            {doc?.name?.charAt(0) || fallbackName?.charAt(0) || 'U'}
          </span>
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="text-sm text-gray-600">Signed in as {doc?.name || fallbackName} ({userId})</div>
      </div>
    </div>
  );
}


