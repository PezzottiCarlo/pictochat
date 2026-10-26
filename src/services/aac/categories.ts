import type { Category, PictogramToken } from '@/core/types';
import { normalizeWord } from './text';

/** Composer categories in display order. Ids are persisted (personal pictograms, share captions). */
export const CATEGORIES: readonly Category[] = [
  { id: 'persone', label: 'Persone', icon: '🧑', color: 'person' },
  { id: 'verbi', label: 'Azioni', icon: '🏃', color: 'verb' },
  { id: 'cibo', label: 'Cibo', icon: '🍝', color: 'noun' },
  { id: 'luoghi', label: 'Luoghi', icon: '🏠', color: 'place' },
  { id: 'emozioni', label: 'Emozioni', icon: '😊', color: 'adjective' },
  { id: 'tempo', label: 'Tempo', icon: '🕒', color: 'time' },
  { id: 'tempo-libero', label: 'Tempo libero', icon: '⚽', color: 'misc' },
  { id: 'scuola', label: 'Scuola e lavoro', icon: '🎒', color: 'noun' },
  { id: 'oggetti', label: 'Oggetti', icon: '🧸', color: 'noun' },
  { id: 'social', label: 'Parole utili', icon: '💬', color: 'social' },
];

export const DEFAULT_CATEGORY = 'oggetti';

/** Old (thesis v1) category names and common synonyms. */
const ALIASES: Record<string, string> = {
  'oggetti quotidiani': 'oggetti',
  oggetto: 'oggetti',
  lavoro: 'scuola',
  scuola: 'scuola',
  'tempo libero': 'tempo-libero',
  hobby: 'tempo-libero',
  sport: 'tempo-libero',
  azioni: 'verbi',
  verbo: 'verbi',
  persona: 'persone',
  famiglia: 'persone',
  luogo: 'luoghi',
  posti: 'luoghi',
  emozione: 'emozioni',
  sentimenti: 'emozioni',
  'parole utili': 'social',
  parole: 'social',
  cose: 'oggetti',
  mangiare: 'cibo',
};

const LOOKUP = new Map<string, string>([
  ...CATEGORIES.flatMap((c) => [
    [c.id, c.id] as const,
    [normalizeWord(c.label), c.id] as const,
  ]),
  ...Object.entries(ALIASES),
]);

/** Category id from an id, an Italian label or a legacy name; undefined when unknown. */
export function resolveCategory(name: string): string | undefined {
  return LOOKUP.get(normalizeWord(name).replace(/\s+/g, ' '));
}

export const isCategoryId = (id: string): boolean => CATEGORIES.some((c) => c.id === id);

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export const categoryById = (id: string | undefined): Category | undefined => (id ? BY_ID.get(id) : undefined);

/** Fitzgerald-key colour of a composer category id ('persone' → 'person'); null when unknown. */
export const categoryColorOf = (id: string | undefined): Category['color'] | null => categoryById(id)?.color ?? null;

/** For <PictoStrip colorOf>: the colour of a translated token's pictogram category. */
export const tokenColor = (token: PictogramToken): Category['color'] | null => categoryColorOf(token.pictogram?.category);
