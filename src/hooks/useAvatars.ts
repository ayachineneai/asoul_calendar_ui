import { useState, useEffect } from 'react';
import { MEMBERS } from '../constants';

// code -> avatar URL
type AvatarMap = Map<string, string>;

async function fetchAvatar(uid: number): Promise<string | null> {
  try {
    const res = await fetch(`/bilibili/x/web-interface/card?mid=${uid}&photo=true`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.card?.face ?? null;
  } catch {
    return null;
  }
}

export function useAvatars(): AvatarMap {
  const [avatars, setAvatars] = useState<AvatarMap>(new Map());

  useEffect(() => {
    Promise.all(
      MEMBERS.map(async (m) => {
        const url = await fetchAvatar(m.uid);
        return [m.code, url] as const;
      }),
    ).then((entries) => {
      const map = new Map<string, string>();
      for (const [code, url] of entries) {
        if (url) map.set(code, url);
      }
      setAvatars(map);
    });
  }, []);

  return avatars;
}
