export type Message = {
  id: string;
  code: string;
  userId: string;
  text: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
};

export async function listMessages(code: string, opts?: { limit?: number; cursor?: string }) {
  const params = new URLSearchParams();
  params.set('code', code);
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.cursor) params.set('cursor', opts.cursor);
  const r = await fetch(`/api/messages?${params.toString()}`);
  if (!r.ok) return [] as Message[];
  return (await r.json()) as Message[];
}

export async function sendMessage(payload: { code: string; userId: string; text: string }) {
  const r = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Failed to send message');
  return (await r.json()) as Message;
}


