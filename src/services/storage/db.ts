import { deleteDB, openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { ChatMessage, ChatSummary, PeerId } from '@/core/types';

/** Minimal data needed to rebuild a GramJS InputPeer without a network round trip. */
export interface PeerRef {
  id: PeerId;
  type: 'user' | 'chat' | 'channel';
  /** Unmarked id as decimal string. */
  rawId: string;
  accessHash?: string;
}

export interface AvatarRecord {
  /** `${peerId}:${'s' | 'b'}` */
  key: string;
  /** null = the peer has no photo (cached negative result). */
  blob: Blob | null;
  fetchedAt: number;
}

export interface MediaRecord {
  /** `${chatId}:${messageId}` */
  key: string;
  blob: Blob;
  size: number;
  lastAccess: number;
}

interface MessagingDB extends DBSchema {
  chats: { key: PeerId; value: ChatSummary };
  /** Primary key [chatId, id] doubles as the range index for paging. */
  messages: { key: [PeerId, number]; value: ChatMessage };
  avatars: { key: string; value: AvatarRecord };
  media: { key: string; value: MediaRecord; indexes: { byAccess: number } };
  peers: { key: PeerId; value: PeerRef };
  meta: { key: string; value: unknown };
}

export type MessagingDb = IDBPDatabase<MessagingDB>;

const DB_NAME = 'pictochat-messaging';
const DB_VERSION = 1;
/** v1 database: raw GramJS objects serialized with flatted. Never read, only deleted. */
const LEGACY_DB_NAME = 'pictochat-storage';
const MIGRATION_FLAG = 'pictochat:v2-storage';

let dbPromise: Promise<MessagingDb> | undefined;

export function getDb(): Promise<MessagingDb> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB not available'));
  dbPromise ??= openDB<MessagingDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        db.createObjectStore('chats', { keyPath: 'id' });
        db.createObjectStore('messages', { keyPath: ['chatId', 'id'] });
        db.createObjectStore('avatars', { keyPath: 'key' });
        db.createObjectStore('media', { keyPath: 'key' }).createIndex('byAccess', 'lastAccess');
        db.createObjectStore('peers', { keyPath: 'id' });
        db.createObjectStore('meta');
      }
    },
    blocking() {
      // A newer tab wants to upgrade (or delete on logout): let it.
      void dbPromise?.then((db) => db.close());
      dbPromise = undefined;
    },
  }).catch((err: unknown) => {
    dbPromise = undefined;
    throw err;
  });
  return dbPromise;
}

/** Runs `fn` against the DB; storage is only a cache, so failures degrade to `fallback`. */
export async function withDb<T>(fn: (db: MessagingDb) => Promise<T>, fallback: T): Promise<T> {
  if (typeof indexedDB === 'undefined') return fallback;
  try {
    return await fn(await getDb());
  } catch (err) {
    console.warn('[storage]', err);
    return fallback;
  }
}

/** Deletes the whole messaging cache (logout). */
export async function clearMessagingStorage(): Promise<void> {
  const pending = dbPromise;
  dbPromise = undefined;
  try {
    (await pending)?.close();
  } catch {
    /* never opened */
  }
  if (typeof indexedDB !== 'undefined') await deleteDB(DB_NAME).catch(() => undefined);
}

/** One-shot cleanup of v1 leftovers. Keeps `stringSession` so users stay logged in. */
export function migrateFromV1(): void {
  try {
    if (typeof localStorage === 'undefined' || localStorage.getItem(MIGRATION_FLAG)) return;
    localStorage.removeItem('me');
    if (typeof indexedDB !== 'undefined') void deleteDB(LEGACY_DB_NAME).catch(() => undefined);
    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch {
    /* storage unavailable (private mode): nothing to migrate */
  }
}
