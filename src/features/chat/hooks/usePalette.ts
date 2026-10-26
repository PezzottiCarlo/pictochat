/** Pictograms shown in the composer grid for the current view (category, recents, search). */
import { useEffect, useState } from 'react';
import type { Pictogram } from '@/core/types';
import { CATEGORIES, aac } from '@/services/aac';

export type PaletteView =
  { kind: 'category'; id: string; verb?: string } | { kind: 'search'; query: string } | { kind: 'recent' };

/** Categories offered for the "Cosa?" step (everything but people and actions). */
export const OBJECT_CATEGORIES = CATEGORIES.filter((c) => c.id !== 'persone' && c.id !== 'verbi');

const SEARCH_DELAY = 250;

export function usePalette(view: PaletteView, recents: Pictogram[]): { items: Pictogram[]; loading: boolean } {
  const [state, setState] = useState<{ key: string; items: Pictogram[] }>({
    key: '',
    items: [],
  });
  const key =
    view.kind === 'category'
      ? `c:${view.id}:${view.verb ?? ''}`
      : view.kind === 'search'
        ? `s:${view.query.trim()}`
        : 'r';

  useEffect(() => {
    if (view.kind === 'recent') return;
    let cancelled = false;
    const run = async () => {
      let items: Pictogram[] = [];
      try {
        if (view.kind === 'category')
          items = await aac.byCategory(view.id, view.verb ? { verb: view.verb } : undefined);
        else if (view.query.trim()) {
          items = await aac.search(view.query, { limit: 40 });
          if (!items.length && navigator.onLine) items = await aac.search(view.query, { limit: 40, online: true });
        }
      } catch {
        items = [];
      }
      if (!cancelled) setState({ key, items });
    };
    const id = window.setTimeout(() => void run(), view.kind === 'search' ? SEARCH_DELAY : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
    // `key` captures everything that matters in `view`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (view.kind === 'recent') return { items: recents, loading: false };
  return {
    items: state.key === key ? state.items : [],
    loading: state.key !== key,
  };
}

/** The object category that best fits a verb ("andare" → luoghi), if the vocabulary knows one. */
export async function objectCategoryFor(verb: string): Promise<string | undefined> {
  for (const c of OBJECT_CATEGORIES) {
    const [narrowed, all] = await Promise.all([aac.byCategory(c.id, { verb }), aac.byCategory(c.id)]);
    if (narrowed.length && narrowed.length < all.length) return c.id;
  }
  return undefined;
}
