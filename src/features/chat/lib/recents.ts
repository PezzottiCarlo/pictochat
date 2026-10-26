/**
 * Recently used pictograms (composer "Recenti" tab), persisted in localStorage.
 * Only ids are stored: ARASAAC urls depend on the appearance setting and personal
 * pictogram urls are object URLs, so both are resolved again when read.
 */
import type { Pictogram } from '@/core/types';

export interface RecentRef {
  id: string;
  word: string;
  source: Pictogram['source'];
  category?: string;
}

const KEY = 'pictochat:chat:recent-pictograms';
export const RECENTS_MAX = 24;

/** Pure: puts the used pictograms first (most recent first), without duplicates. */
export function pushRecents(current: readonly RecentRef[], used: readonly RecentRef[], max = RECENTS_MAX): RecentRef[] {
  const next: RecentRef[] = [];
  const seen = new Set<string>();
  for (const r of [...[...used].reverse(), ...current]) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    next.push(r);
    if (next.length >= max) break;
  }
  return next;
}

export const toRecentRef = (p: Pictogram): RecentRef => ({
  id: p.id,
  word: p.word,
  source: p.source,
  ...(p.category ? { category: p.category } : {}),
});

export function readRecents(): RecentRef[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RecentRef =>
        !!r &&
        typeof r === 'object' &&
        typeof (r as RecentRef).id === 'string' &&
        typeof (r as RecentRef).word === 'string',
    );
  } catch {
    return [];
  }
}

export function writeRecents(list: readonly RecentRef[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage full or blocked: recents are a convenience only
  }
}
