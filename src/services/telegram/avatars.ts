/** Profile photos: memory → IndexedDB → network, stale-while-revalidate (24 h). */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import type { PeerId } from '@/core/types';
import { getAvatarRecord, putAvatarRecord } from '@/services/storage';
import { messaging } from './service';
import { useMessagingStore } from './store';
import { ObjectUrlCache } from './urlCache';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
/** Don't hammer the network after a failure. */
const RETRY_AFTER_MS = 5 * 60 * 1000;

export const avatarCache = new ObjectUrlCache(200);
const failedAt = new Map<string, number>();

const avatarKey = (peerId: PeerId, big: boolean) => `${peerId}:${big ? 'b' : 's'}`;

function fromNetwork(key: string, peerId: PeerId, big: boolean): Promise<void> {
  return avatarCache.dedupe(key, async () => {
    try {
      const blob = await messaging.getAvatar(peerId, { big });
      const fetchedAt = Date.now();
      avatarCache.setBlob(key, blob, fetchedAt);
      failedAt.delete(key);
      void putAvatarRecord({ key, blob, fetchedAt });
    } catch {
      failedAt.set(key, Date.now());
    }
  });
}

async function ensureAvatar(peerId: PeerId, big: boolean): Promise<void> {
  const key = avatarKey(peerId, big);
  let entry = avatarCache.get(key);
  if (!entry?.fetchedAt) {
    await avatarCache.dedupe(`idb:${key}`, async () => {
      const rec = await getAvatarRecord(key);
      if (rec && !avatarCache.get(key)?.fetchedAt) avatarCache.setBlob(key, rec.blob, rec.fetchedAt);
    });
    entry = avatarCache.get(key);
  }
  const fresh = entry?.fetchedAt !== undefined && Date.now() - entry.fetchedAt < MAX_AGE_MS;
  const recentlyFailed = Date.now() - (failedAt.get(key) ?? 0) < RETRY_AFTER_MS;
  if (!fresh && !recentlyFailed) await fromNetwork(key, peerId, big);
}

/** Object URL of the peer's profile photo, or undefined (no photo / not loaded yet). */
export function useAvatar(peerId: PeerId | undefined, opts?: { big?: boolean }): string | undefined {
  const big = !!opts?.big;
  const key = peerId ? avatarKey(peerId, big) : '';
  // Chats known to have no photo never hit the network.
  const knownNoPhoto = useMessagingStore((s) =>
    peerId ? s.chats.find((c) => c.id === peerId)?.hasPhoto === false : false,
  );

  const subscribe = useCallback((cb: () => void) => (key ? avatarCache.subscribe(key, cb) : () => {}), [key]);
  const url = useSyncExternalStore(subscribe, () => (key ? avatarCache.get(key)?.url : undefined));

  useEffect(() => {
    if (!peerId || knownNoPhoto) return;
    const release = avatarCache.retain(key);
    void ensureAvatar(peerId, big);
    return release;
  }, [peerId, big, key, knownNoPhoto]);

  return knownNoPhoto ? undefined : url;
}

/** Retries avatars on screen that failed while offline. */
export function retryVisibleAvatars(): void {
  for (const key of avatarCache.retainedKeys()) {
    if (!failedAt.has(key)) continue;
    failedAt.delete(key);
    const [peerId, size] = key.split(':');
    void ensureAvatar(peerId, size === 'b');
  }
}
