/**
 * Contract of the AAC (pictogram) engine. Pure TypeScript, no React in the core;
 * vocabulary data is lazy-loaded so it never blocks first paint.
 *
 * Required exports of `src/services/aac/index.ts`:
 *
 *   export const aac: AacEngine;
 *
 *   // Personal pictograms (IndexedDB-backed zustand store)
 *   export function usePersonalPictograms(): {
 *     items: PersonalPictogram[];
 *     add(input: { word: string; category: string; image: Blob; origin?: 'manual' | 'chat' }): Promise<PersonalPictogram>;
 *     remove(id: string): Promise<void>;
 *     update(id: string, patch: Partial<Pick<PersonalPictogram, 'word' | 'category' | 'image'>>): Promise<void>;
 *   };
 *
 *   // React helpers
 *   export function useAacReady(): boolean;                                 // vocab loaded
 *   export function usePictogramTokens(text: string | undefined): PictogramToken[] | undefined;
 *   export function useReplySuggestions(lastIncoming: string | undefined): ReplySuggestion[];
 *
 *   // Personal-pictogram sharing over chat: a photo whose caption is `#picto <categoria>: <parola>`
 *   export function parsePictogramShare(caption: string): { category: string; word: string } | null;
 *   export function formatPictogramShare(category: string, word: string): string;
 */
import type {
  Appearance,
  Category,
  Pictogram,
  PictogramToken,
  ReplySuggestion,
} from '@/core/types';

export interface AacEngine {
  /** Loads vocabulary indexes (idempotent). */
  ready(): Promise<void>;
  isReady(): boolean;

  /** Text → ordered tokens; personal pictograms win over ARASAAC ones. */
  textToPictograms(text: string): Promise<PictogramToken[]>;
  /** Reply suggestions for an incoming message (choices, yes/no, wh-questions, predefined…). */
  suggestReplies(incoming: string): Promise<ReplySuggestion[]>;

  /** Composer categories, in display order. */
  categories(): Category[];
  /** Pictograms for a composer category; for objects an optional verb narrows the list. */
  byCategory(categoryId: string, opts?: { verb?: string }): Promise<Pictogram[]>;
  verbs(): Promise<Pictogram[]>;
  /** Offline search over the bundled vocabulary, falls back to ARASAAC API when `online`. */
  search(query: string, opts?: { limit?: number; online?: boolean }): Promise<Pictogram[]>;

  /** ARASAAC image URL for an id with the user's skin/hair applied. */
  imageUrl(arasaacId: number, appearance: Appearance, size?: 300 | 500 | 2500): string;
}
