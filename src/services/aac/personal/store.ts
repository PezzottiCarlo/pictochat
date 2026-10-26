/**
 * Personal pictograms (the user's own photos for words): zustand state mirrored to IndexedDB.
 * Images stay Blobs; object URLs are handed out by ./objectUrls.
 */
import { create } from 'zustand';
import type { PersonalPictogram, Pictogram } from '@/core/types';
import { DEFAULT_CATEGORY, resolveCategory } from '../categories';
import { normalizePersonalWord } from '../share';
import { personalDb } from './db';
import { readLegacyPictograms } from './migrate';
import { objectUrlFor, releaseObjectUrl } from './objectUrls';

export interface NewPersonalPictogram {
  word: string;
  category: string;
  image: Blob;
  origin?: PersonalPictogram['origin'];
}

export type PersonalPatch = Partial<Pick<PersonalPictogram, 'word' | 'category' | 'image'>>;

interface PersonalState {
  items: PersonalPictogram[];
  loaded: boolean;
  /** Loads from IndexedDB and runs the v1 localStorage migration (idempotent). */
  init(): Promise<void>;
  /** Adds a pictogram; an existing one with the same word is replaced (keeps its id). */
  add(input: NewPersonalPictogram): Promise<PersonalPictogram>;
  remove(id: string): Promise<void>;
  update(id: string, patch: PersonalPatch): Promise<void>;
}

const newId = (): string =>
  `p:${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`}`;

const categoryId = (c: string) => resolveCategory(c) ?? DEFAULT_CATEGORY;

let initPromise: Promise<void> | undefined;

export const usePersonalStore = create<PersonalState>()((set, get) => ({
  items: [],
  loaded: false,

  init() {
    initPromise ??= (async () => {
      let items = await personalDb.all();
      const legacy = readLegacyPictograms(newId);
      if (legacy) {
        const known = new Set(items.map((p) => p.word));
        const fresh = legacy.items.filter((p) => !known.has(p.word) && known.add(p.word));
        for (const p of fresh) await personalDb.put(p);
        legacy.commit();
        items = [...items, ...fresh];
      }
      set({ items, loaded: true });
    })().catch((err: unknown) => {
      initPromise = undefined; // allow a retry (e.g. IndexedDB blocked in private mode)
      set({ loaded: true });
      throw err;
    });
    return initPromise;
  },

  async add({ word, category, image, origin = 'manual' }) {
    await get().init();
    const normalized = normalizePersonalWord(word);
    if (!normalized) throw new Error('Parola mancante');
    const existing = get().items.find((p) => p.word === normalized);
    const item: PersonalPictogram = existing
      ? { ...existing, category: categoryId(category), image, origin }
      : { id: newId(), word: normalized, category: categoryId(category), image, createdAt: Date.now(), origin };
    await personalDb.put(item);
    set({ items: existing ? get().items.map((p) => (p.id === item.id ? item : p)) : [...get().items, item] });
    return item;
  },

  async remove(id) {
    await get().init();
    await personalDb.delete(id);
    releaseObjectUrl(id);
    set({ items: get().items.filter((p) => p.id !== id) });
  },

  async update(id, patch) {
    await get().init();
    const current = get().items.find((p) => p.id === id);
    if (!current) return;
    const next: PersonalPictogram = {
      ...current,
      ...(patch.word !== undefined && { word: normalizePersonalWord(patch.word) || current.word }),
      ...(patch.category !== undefined && { category: categoryId(patch.category) }),
      ...(patch.image !== undefined && { image: patch.image }),
    };
    await personalDb.put(next);
    set({ items: get().items.map((p) => (p.id === id ? next : p)) });
  },
}));

/** Object URL of a personal pictogram's image (cached, revoked on removal / image change). */
export const personalImageUrl = (p: PersonalPictogram): string => objectUrlFor(p.id, p.image);

export const personalToPictogram = (p: PersonalPictogram): Pictogram => ({
  id: p.id,
  word: p.word,
  url: personalImageUrl(p),
  source: 'personal',
  category: p.category,
});
