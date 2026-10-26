import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { PersonalPictogram } from '@/core/types';

interface AacDB extends DBSchema {
  personal: { key: string; value: PersonalPictogram };
}

let dbPromise: Promise<IDBPDatabase<AacDB>> | undefined;

const db = () =>
  (dbPromise ??= openDB<AacDB>('pictochat-aac', 1, {
    upgrade(database) {
      database.createObjectStore('personal', { keyPath: 'id' });
    },
  }));

export const personalDb = {
  async all(): Promise<PersonalPictogram[]> {
    return (await (await db()).getAll('personal')).sort((a, b) => a.createdAt - b.createdAt);
  },
  async put(p: PersonalPictogram): Promise<void> {
    await (await db()).put('personal', p);
  },
  async delete(id: string): Promise<void> {
    await (await db()).delete('personal', id);
  },
};
