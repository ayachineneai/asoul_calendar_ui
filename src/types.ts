export interface Live {
  start_time: string;
  title: string;
  members: string[];
  host: string;
  tag: string;
  kind: 'schedule' | 'unplanned';
  slug: string;
  hide: boolean;
}

export interface Member {
  code: string;
  name: string;
  color: string;
  uid: number;
}

export type BroadcastKind = 'solo' | 'duo' | 'group';

export function getBroadcastKind(members: string[]): BroadcastKind {
  if (members.length >= 3) return 'group';
  if (members.length === 2) return 'duo';
  return 'solo';
}

export const BROADCAST_LABELS: Record<BroadcastKind, string> = {
  solo: '单播',
  duo: '双播',
  group: '团播',
};
