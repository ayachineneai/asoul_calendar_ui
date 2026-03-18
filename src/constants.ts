import type { Member } from './types';

export const MEMBERS: Member[] = [
  { code: '嘉然', name: '嘉然', color: '#4CAF50', uid: 672328094 },
  { code: '贝拉', name: '贝拉', color: '#2196F3', uid: 672353429 },
  { code: '乃琳', name: '乃琳', color: '#FFC107', uid: 672342685 },
  { code: '思诺', name: '思诺', color: '#00BCD4', uid: 3537115310721781 },
  { code: '心宜', name: '心宜', color: '#FF6B9D', uid: 3537115310721181 },
];

export const MEMBER_MAP = new Map<string, Member>(MEMBERS.map((m) => [m.code, m]));

export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';
