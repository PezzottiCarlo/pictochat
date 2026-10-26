import type { ChatMessage, PeerId } from '@/core/types';
import { withDb } from './db';

function range(chatId: PeerId, lower: number, upper: number, upperOpen: boolean): IDBKeyRange {
  return IDBKeyRange.bound([chatId, lower], [chatId, upper], false, upperOpen);
}

/**
 * Up to `limit` cached messages of a chat with id < `beforeId` (or the newest ones),
 * in ascending order. Walks the [chatId, id] primary key backwards: no full scan.
 */
export function getCachedPage(chatId: PeerId, limit: number, beforeId?: number): Promise<ChatMessage[]> {
  return withDb(async (db) => {
    const out: ChatMessage[] = [];
    const query =
      beforeId === undefined
        ? range(chatId, -Infinity, Infinity, false)
        : range(chatId, -Infinity, beforeId, true);
    let cursor = await db.transaction('messages').store.openCursor(query, 'prev');
    while (cursor && out.length < limit) {
      out.push(cursor.value);
      cursor = await cursor.continue();
    }
    return out.reverse();
  }, []);
}

/** Stores server messages (optimistic ones, with negative ids, are never persisted). */
export function putMessages(messages: ChatMessage[]): Promise<void> {
  const persistable = messages.filter((m) => m.id > 0);
  if (!persistable.length) return Promise.resolve();
  return withDb(async (db) => {
    const tx = db.transaction('messages', 'readwrite');
    await Promise.all(persistable.map((m) => tx.store.put(m)));
    await tx.done;
  }, undefined);
}

/** Overwrites a message only if it is already cached (an edit must not create gaps). */
export function updateCachedMessage(message: ChatMessage): Promise<void> {
  return withDb(async (db) => {
    const tx = db.transaction('messages', 'readwrite');
    if (await tx.store.getKey([message.chatId, message.id])) await tx.store.put(message);
    await tx.done;
  }, undefined);
}

export function deleteCachedMessages(chatId: PeerId, ids: number[]): Promise<void> {
  if (!ids.length) return Promise.resolve();
  return withDb(async (db) => {
    const tx = db.transaction('messages', 'readwrite');
    await Promise.all(ids.map((id) => tx.store.delete([chatId, id])));
    await tx.done;
  }, undefined);
}

/** Drops cached messages with id < `id` (after a history gap they can't be trusted). */
export function deleteCachedBelow(chatId: PeerId, id: number): Promise<void> {
  return withDb(async (db) => {
    await db.delete('messages', range(chatId, -Infinity, id, true));
  }, undefined);
}
