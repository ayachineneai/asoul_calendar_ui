import type { Live } from './types';
import { API_BASE } from './constants';

export async function fetchLives(token?: string): Promise<Live[]> {
  const res = await fetch(`${API_BASE}/lives`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface LiveBody {
  start_time: string;
  title: string;
  members: string[];
  host: string;
  tag: string;
  kind: 'schedule' | 'unplanned';
}

export async function adminCreateLive(token: string, body: LiveBody): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/lives`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function adminUpdateLive(token: string, slug: string, body: LiveBody): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/lives/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function adminSetLiveHide(token: string, slug: string, hide: boolean): Promise<void> {
  const res = await fetch(
    `${API_BASE}/admin/lives/${encodeURIComponent(slug)}/hide?hide=${hide}`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function adminDeleteLive(token: string, slug: string): Promise<void> {
  const params = new URLSearchParams();
  params.append('slugs', slug);
  const res = await fetch(`${API_BASE}/admin/lives?${params}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
