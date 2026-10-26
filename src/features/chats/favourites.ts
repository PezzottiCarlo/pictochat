import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Starred chats, shown as big tiles on top of the chat list. Kept on this device only
 * (Settings has no field for it, and it is a per-device convenience).
 */
interface FavouritesState {
  ids: string[];
  isFavourite(id: string): boolean;
  toggle(id: string): void;
  /** Moves a favourite one step earlier (-1) or later (+1). */
  move(id: string, delta: -1 | 1): void;
  /** Drops ids of chats that no longer exist. */
  prune(existing: readonly string[]): void;
}

export const MAX_FAVOURITES = 8;

export const useFavourites = create<FavouritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      isFavourite: (id) => get().ids.includes(id),
      toggle: (id) =>
        set(({ ids }) => ({
          ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-MAX_FAVOURITES),
        })),
      move: (id, delta) =>
        set(({ ids }) => {
          const from = ids.indexOf(id);
          const to = from + delta;
          if (from < 0 || to < 0 || to >= ids.length) return { ids };
          const next = [...ids];
          [next[from], next[to]] = [next[to], next[from]];
          return { ids: next };
        }),
      prune: (existing) => {
        const keep = new Set(existing);
        const ids = get().ids.filter((id) => keep.has(id));
        if (ids.length !== get().ids.length) set({ ids });
      },
    }),
    {
      name: 'pictochat:favourite-chats',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ ids }) => ({ ids }),
    },
  ),
);
