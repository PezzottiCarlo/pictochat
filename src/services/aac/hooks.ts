import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { PictogramToken, ReplySuggestion } from '@/core/types';
import { useSettings } from '@/stores/settings';
import { aac } from './engine';
import { usePersonalStore } from './personal/store';

const isReady = () => aac.isReady();

/** True once the vocabulary is loaded; triggers the (idempotent) lazy load on mount. */
export function useAacReady(): boolean {
  const ready = useSyncExternalStore(aac.subscribe, isReady, isReady);
  useEffect(() => {
    aac.ready().catch(() => undefined);
  }, []);
  return ready;
}

/** Bumps when the vocabulary loads or personal pictograms change. */
const useAacVersion = () => useSyncExternalStore(aac.subscribe, aac.getVersion, aac.getVersion);

/** Pictogram translation of a message; undefined while the vocabulary is loading. */
export function usePictogramTokens(text: string | undefined): PictogramToken[] | undefined {
  const ready = useAacReady();
  const version = useAacVersion();
  const appearance = useSettings((s) => s.appearance);
  return useMemo(() => {
    void version;
    if (!ready || text === undefined) return undefined;
    return text.trim() ? aac.tokensSync(text, appearance) : [];
  }, [ready, version, text, appearance]);
}

const NO_SUGGESTIONS: ReplySuggestion[] = [];

/** Reply suggestions for the last incoming message ([] while loading or without a message). */
export function useReplySuggestions(lastIncoming: string | undefined): ReplySuggestion[] {
  const ready = useAacReady();
  const version = useAacVersion();
  const appearance = useSettings((s) => s.appearance);
  return useMemo(() => {
    void version;
    if (!ready || !lastIncoming?.trim()) return NO_SUGGESTIONS;
    return aac.suggestSync(lastIncoming, appearance) ?? NO_SUGGESTIONS;
  }, [ready, version, lastIncoming, appearance]);
}

/** The user's personal pictograms (IndexedDB-backed) and their mutations. */
export function usePersonalPictograms() {
  const items = usePersonalStore((s) => s.items);
  const add = usePersonalStore((s) => s.add);
  const remove = usePersonalStore((s) => s.remove);
  const update = usePersonalStore((s) => s.update);
  useEffect(() => {
    usePersonalStore.getState().init().catch(() => undefined);
  }, []);
  return useMemo(() => ({ items, add, remove, update }), [items, add, remove, update]);
}
