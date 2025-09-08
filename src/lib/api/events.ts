export type EventDTO = {
  id: string;
  title: string;
  description?: string;
  location: { lat: number; lng: number };
  joiners?: string[];
  imageUrl?: string;
  code?: string;
  date?: string;
  creatorId?: string;
  genre?: string[];
};

export async function listEvents(params?: { creatorId?: string; joinedBy?: string; code?: string }) {
  const qs = new URLSearchParams();
  if (params?.creatorId) qs.set('creatorId', params.creatorId);
  if (params?.joinedBy) qs.set('joinedBy', params.joinedBy);
  if (params?.code) qs.set('code', params.code);
  const res = await fetch(`/api/events${qs.toString() ? `?${qs.toString()}` : ''}`);
  if (!res.ok) return [] as EventDTO[];
  return (await res.json()) as EventDTO[];
}

export async function createEvent(payload: Omit<EventDTO, 'id'>) {
  const res = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Create failed');
  return (await res.json()) as EventDTO;
}

export async function updateEvent(id: string, updates: Partial<EventDTO>) {
  const res = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Update failed');
  return (await res.json()) as EventDTO;
}

export async function deleteEvent(id: string) {
  const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('Delete failed');
  return true;
}

export async function joinEvent(id: string, userId: string) {
  const res = await fetch(`/api/events/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error('Join failed');
  return (await res.json()) as EventDTO;
}


