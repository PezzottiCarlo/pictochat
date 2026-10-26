/** Message media: downloaded on demand, cached in IndexedDB (LRU, ~200 MB) and memory. */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { PeerId } from '@/core/types';
import { getMediaBlob, putMediaBlob } from '@/services/storage';
import { messaging } from './service';
import { ObjectUrlCache, type UrlEntry } from './urlCache';

export const mediaCache = new ObjectUrlCache(60);

const mediaKey = (chatId: PeerId, messageId: number) => `${chatId}:${messageId}`;

function ensureMedia(chatId: PeerId, messageId: number): Promise<void> {
  const key = mediaKey(chatId, messageId);
  const entry = mediaCache.get(key);
  if (entry?.url || entry?.none) return Promise.resolve();
  return mediaCache.dedupe(key, async () => {
    mediaCache.patch(key, { loading: true, error: false });
    try {
      let blob = await getMediaBlob(key);
      if (!blob) {
        blob = (await messaging.downloadMedia(chatId, messageId)) ?? undefined;
        if (blob) void putMediaBlob(key, blob);
      }
      mediaCache.setBlob(key, blob ?? null, Date.now());
    } catch {
      mediaCache.patch(key, { loading: false, error: true });
    }
  });
}

const IDLE: { url?: string; loading: boolean; error?: boolean } = { loading: false };

/** Downloads (once) and returns an object URL for a message's media. */
export function useMediaUrl(
  chatId: PeerId,
  messageId: number,
  enabled = true,
): { url?: string; loading: boolean; error?: boolean } {
  const active = enabled && messageId > 0;
  const key = mediaKey(chatId, messageId);
  const subscribe = useCallback((cb: () => void) => mediaCache.subscribe(key, cb), [key]);
  const entry: UrlEntry | undefined = useSyncExternalStore(subscribe, () => mediaCache.get(key));

  useEffect(() => {
    if (!active) return;
    const release = mediaCache.retain(key);
    void ensureMedia(chatId, messageId);
    return release;
  }, [active, chatId, messageId, key]);

  if (!active) return IDLE;
  if (!entry) return { loading: true };
  return {
    url: entry.url,
    loading: !!entry.loading || (!entry.url && !entry.none && !entry.error),
    error: entry.error || undefined,
  };
}

/** Retries media on screen that failed (e.g. after reconnecting). */
export function retryVisibleMedia(): void {
  for (const key of mediaCache.retainedKeys()) {
    if (!mediaCache.get(key)?.error) continue;
    const i = key.lastIndexOf(':');
    void ensureMedia(key.slice(0, i), Number(key.slice(i + 1)));
  }
}
