import type { AvatarRecord, MediaRecord } from './db';
import { withDb } from './db';

/** Best-effort cap for downloaded media (LRU by last access). */
export const MEDIA_CACHE_LIMIT = 200 * 1024 * 1024;

export function getAvatarRecord(key: string): Promise<AvatarRecord | undefined> {
  return withDb((db) => db.get('avatars', key), undefined);
}

export function putAvatarRecord(record: AvatarRecord): Promise<void> {
  return withDb(async (db) => {
    await db.put('avatars', record);
  }, undefined);
}

export function getMediaBlob(key: string): Promise<Blob | undefined> {
  return withDb(async (db) => {
    const tx = db.transaction('media', 'readwrite');
    const record = await tx.store.get(key);
    if (record) await tx.store.put({ ...record, lastAccess: Date.now() });
    await tx.done;
    return record?.blob;
  }, undefined);
}

let evictTimer: ReturnType<typeof setTimeout> | undefined;

export function putMediaBlob(key: string, blob: Blob): Promise<void> {
  return withDb(async (db) => {
    const record: MediaRecord = { key, blob, size: blob.size, lastAccess: Date.now() };
    await db.put('media', record);
    clearTimeout(evictTimer);
    evictTimer = setTimeout(() => void evictMedia(), 3000);
  }, undefined);
}

/** Deletes least recently used media until the total size fits `limit`. */
export function evictMedia(limit = MEDIA_CACHE_LIMIT): Promise<void> {
  return withDb(async (db) => {
    const tx = db.transaction('media', 'readwrite');
    const index = tx.store.index('byAccess');
    let total = 0;
    let cursor = await index.openCursor();
    while (cursor) {
      total += cursor.value.size;
      cursor = await cursor.continue();
    }
    cursor = await index.openCursor();
    while (cursor && total > limit) {
      total -= cursor.value.size;
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }, undefined);
}
