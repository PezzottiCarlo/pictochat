import { useEffect, useState } from 'react';
import type { Pictogram } from '@/core/types';
import { aac } from '@/services/aac';

/** Debounced ARASAAC search (bundled vocabulary, online API as a fallback). Only ARASAAC results. */
export function useArasaacSearch(query: string, limit = 36): { results: Pictogram[]; loading: boolean } {
  const [results, setResults] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const id = window.setTimeout(() => {
      aac
        .search(q, { limit, online: navigator.onLine })
        .then((r) => alive && setResults(r.filter((p) => p.source === 'arasaac')))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [q, limit]);

  return { results, loading };
}

/** ARASAAC pictograms of one composer category. */
export function useCategoryPictograms(categoryId: string | null): { items: Pictogram[]; loading: boolean } {
  const [items, setItems] = useState<Pictogram[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!categoryId) return;
    let alive = true;
    setLoading(true);
    aac
      .byCategory(categoryId)
      .then((r) => alive && setItems(r.filter((p) => p.source === 'arasaac')))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [categoryId]);
  return { items, loading };
}
