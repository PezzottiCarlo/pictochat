import { create } from 'zustand';

/** Settings stay unlocked this long after the last visit to a settings screen. */
export const UNLOCK_MS = 3 * 60_000;
/** Wrong attempts allowed before a pause. */
export const MAX_ATTEMPTS = 5;
export const COOLDOWN_MS = 30_000;
export const PIN_LENGTH = 4;

interface PinSession {
  unlockedUntil: number;
  failures: number;
  blockedUntil: number;
  unlock(): void;
  /** Keeps an unlocked session alive (called while the user moves around Settings). */
  touch(): void;
  lock(): void;
  fail(): void;
}

/** In memory only: a reload always locks Settings again. */
export const usePinSession = create<PinSession>()((set, get) => ({
  unlockedUntil: 0,
  failures: 0,
  blockedUntil: 0,
  unlock: () => set({ unlockedUntil: Date.now() + UNLOCK_MS, failures: 0, blockedUntil: 0 }),
  touch: () => {
    if (get().unlockedUntil > Date.now()) set({ unlockedUntil: Date.now() + UNLOCK_MS });
  },
  lock: () => set({ unlockedUntil: 0 }),
  fail: () => {
    const failures = get().failures + 1;
    set(failures >= MAX_ATTEMPTS ? { failures: 0, blockedUntil: Date.now() + COOLDOWN_MS } : { failures });
  },
}));

export const isUnlocked = (): boolean => usePinSession.getState().unlockedUntil > Date.now();
