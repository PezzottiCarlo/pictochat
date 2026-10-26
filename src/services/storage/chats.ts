import type { ChatSummary } from '@/core/types';
import { withDb } from './db';

const ORDER_KEY = 'chatOrder';

/** Cached chat list, in the order it was last saved. */
export function loadChats(): Promise<ChatSummary[]> {
  return withDb(async (db) => {
    const [all, order] = await Promise.all([db.getAll('chats'), db.get('meta', ORDER_KEY)]);
    const byId = new Map(all.map((c) => [c.id, c]));
    const ordered: ChatSummary[] = [];
    if (Array.isArray(order)) {
      for (const id of order) {
        const chat = byId.get(String(id));
        if (chat) {
          ordered.push(chat);
          byId.delete(chat.id);
        }
      }
    }
    return [...ordered, ...byId.values()];
  }, []);
}

/** Replaces the cached chat list. */
export function saveChats(chats: ChatSummary[]): Promise<void> {
  return withDb(async (db) => {
    const tx = db.transaction(['chats', 'meta'], 'readwrite');
    const store = tx.objectStore('chats');
    await store.clear();
    await Promise.all(chats.map((c) => store.put(c)));
    await tx.objectStore('meta').put(
      chats.map((c) => c.id),
      ORDER_KEY,
    );
    await tx.done;
  }, undefined);
}
