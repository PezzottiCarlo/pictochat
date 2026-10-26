/**
 * One-time import of thesis v1 personal pictograms: localStorage `personalPictograms`
 * held `{ name, category, photoUrl }` with base64 data URLs.
 */
import type { PersonalPictogram } from '@/core/types';
import { DEFAULT_CATEGORY, resolveCategory } from '../categories';
import { normalizePersonalWord } from '../share';

const LEGACY_KEY = 'personalPictograms';

interface LegacyPictogram {
  name?: unknown;
  category?: unknown;
  photoUrl?: unknown;
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  const type = m[1] || 'application/octet-stream';
  try {
    if (!m[2]) return new Blob([decodeURIComponent(m[3])], { type });
    const bin = atob(m[3]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type });
  } catch {
    return null;
  }
}

/** Reads the legacy key (if any); `commit()` removes it once the items are safely stored. */
export function readLegacyPictograms(newId: () => string): { items: PersonalPictogram[]; commit(): void } | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = [];
  }
  const now = Date.now();
  const items: PersonalPictogram[] = [];
  for (const [i, p] of (Array.isArray(parsed) ? (parsed as LegacyPictogram[]) : []).entries()) {
    if (typeof p?.name !== 'string' || typeof p.photoUrl !== 'string') continue;
    const image = dataUrlToBlob(p.photoUrl);
    const word = normalizePersonalWord(p.name);
    if (!image || !word) continue;
    const category = (typeof p.category === 'string' && resolveCategory(p.category)) || DEFAULT_CATEGORY;
    items.push({ id: newId(), word, category, image, createdAt: now + i, origin: 'manual' });
  }
  return {
    items,
    commit: () => {
      try {
        localStorage.removeItem(LEGACY_KEY);
      } catch {
        /* ignore */
      }
    },
  };
}
