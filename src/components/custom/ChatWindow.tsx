"use client";

import { useEffect, useRef, useState } from 'react';
import { listMessages, sendMessage, Message } from '@/lib/api/messages';
import { client, account } from '@/lib/appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MessageCard from '@/components/custom/MessageCard';
import IconTransitionButton from '@/components/ui/IconTransitionButton';
import { UserPlus, LogIn } from 'lucide-react';

type Props = {
  code: string;
  currentUserId?: string;
  hasUserJoined?: boolean;
  isAuthenticated?: boolean;
  onJoinEvent?: () => void;
};

export default function ChatWindow({ code, currentUserId, hasUserJoined = false, isAuthenticated = false, onJoinEvent }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const subRef = useRef<(() => void) | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    listMessages(code, { limit: 30 })
      .then((msgs) => {
        const ordered = msgs.reverse();
        setMessages(ordered);
      })
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (!code || !currentUserId) return;
    
    const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const MSG_COL = process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID;
    
    if (!DB_ID || !MSG_COL) return;
    
    // Clean up previous subscription
    if (subRef.current) {
      try { subRef.current(); } catch {}
      subRef.current = null;
    }
    
    const channel = `databases.${DB_ID}.collections.${MSG_COL}.documents`;
    
    try {
      const unsubscribe = (client as any).subscribe(
        channel,
        (event: any) => {
          // Handle connection/ping events
          if (event?.type === 'connected' || event?.type === 'ping' || event?.type === 'pong') {
            return;
          }
          
          // Process document creation events with matching code
          const isCreateEvent = Array.isArray(event?.events) && event.events.some((e: string) => e.endsWith('.create'));
          const isMatchingCode = event?.payload?.code === code;
          
          if (isCreateEvent && isMatchingCode) {
            setMessages((prev) => {
              // Check if message already exists to prevent duplicates
              const exists = prev.some(m => m.id === event.payload.$id);
              if (exists) return prev;
              
              // Don't add messages from the current user via realtime if they were sent optimistically
              // (they should already be in the list from the optimistic update)
              const isFromCurrentUser = event.payload.userId === currentUserId;
              if (isFromCurrentUser) {
                // Replace any temporary message with the real one
                const tempMessageExists = prev.some(m => m.id.startsWith('temp-') && m.userId === currentUserId && m.text === event.payload.text);
                if (tempMessageExists) {
                  return prev.map(m => 
                    m.id.startsWith('temp-') && m.userId === currentUserId && m.text === event.payload.text
                      ? {
                          id: event.payload.$id,
                          code: event.payload.code,
                          userId: event.payload.userId,
                          text: event.payload.text,
                          createdAt: event.payload.createdAt,
                          userName: event.payload.userName,
                          userAvatar: event.payload.userAvatar,
                        }
                      : m
                  );
                }
                // If no temp message found, don't add it (avoid duplication)
                return prev;
              }
              
              // For messages from other users, add them normally
              return [...prev, {
                id: event.payload.$id,
                code: event.payload.code,
                userId: event.payload.userId,
                text: event.payload.text,
                createdAt: event.payload.createdAt,
                userName: event.payload.userName,
                userAvatar: event.payload.userAvatar,
              }];
            });
          }
        }
      );
      
      subRef.current = unsubscribe;
    } catch (e) {
      // Handle subscription error silently
    }
    
    return () => {
      if (subRef.current) {
        try { subRef.current(); } catch {}
        subRef.current = null;
      }
    };
  }, [code, currentUserId]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  async function handleSend() {
    const value = text.trim();
    if (!value || !currentUserId) return;
    if (sending) return;
    setSending(true);
    setText('');
    
    // Create optimistic message
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const temp: Message = {
      id: tempId,
      code,
      userId: currentUserId,
      text: value,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, temp]);
    
    try {
      const saved = await sendMessage({ code, userId: currentUserId, text: value });
      
      // Replace temporary message with the saved one
      // Note: The realtime subscription will handle this replacement automatically
      // if it receives the event, but we do it here as a fallback
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
      
      // Clean up any potential duplicates after a short delay
      setTimeout(() => {
        setMessages((prev) => {
          const seen = new Set<string>();
          return prev.filter((m) => {
            // Keep unique messages based on ID or text+userId for temp messages
            const key = m.id.startsWith('temp-') ? `${m.text}-${m.userId}` : m.id;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
      }, 100);
    } catch (error) {
      // Remove the temporary message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally { 
      setSending(false); 
    }
  }

  return (
    <div className="flex h-80 flex-col rounded border bg-white">
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500">Loading messages…</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-gray-500">No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              isCurrentUser={m.userId === currentUserId}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
      <div className="border-t p-3 bg-gray-50">
        {!isAuthenticated ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">Please sign in to join the conversation</p>
            <IconTransitionButton
              onClick={() => window.location.href = '/auth'}
              defaultIcon={LogIn}
              hoverIcon={LogIn}
              variant="primary"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 rounded-full"
            >
              Sign In
            </IconTransitionButton>
          </div>
        ) : !hasUserJoined ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 mb-2">Join the event to participate in the chat</p>
            <IconTransitionButton
              onClick={() => onJoinEvent?.()}
              defaultIcon={UserPlus}
              hoverIcon={UserPlus}
              variant="primary"
              size="sm"
              className="bg-green-600 hover:bg-green-700 rounded-full"
            >
              Join Event
            </IconTransitionButton>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
            />
            <Button 
              onClick={handleSend} 
              disabled={!text.trim() || !currentUserId || sending}
              size="sm"
            >
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


