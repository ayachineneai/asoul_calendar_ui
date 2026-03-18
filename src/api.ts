import type { Live } from './types';
import { API_BASE } from './constants';

export async function fetchLives(members: string[] = []): Promise<Live[]> {
  const params = new URLSearchParams();
  for (const m of members) params.append('members', m);
  const res = await fetch(`${API_BASE}/lives?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
