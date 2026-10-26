/**
 * Personal pictograms travel over chat as a photo with caption `#picto <categoria>: <parola>`.
 */
import { DEFAULT_CATEGORY, resolveCategory } from './categories';

const TAGGED = /^\s*#picto\s+([^:\n]{1,40}?)\s*:\s*([^\n]{1,60}?)\s*$/iu;
/** Thesis v1 captions had no tag: accepted only when the category is a known one. */
const LEGACY = /^\s*([^:#\n]{2,30}?)\s*:\s*([^:\n]{1,60}?)\s*$/u;

/** Lowercase, trimmed, single-spaced word as stored in PersonalPictogram.word. */
export const normalizePersonalWord = (word: string): string => word.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');

const validWord = (w: string) => /\p{L}/u.test(w) && w.split(' ').length <= 4;

export function parsePictogramShare(caption: string): { category: string; word: string } | null {
  if (!caption) return null;
  const tagged = TAGGED.exec(caption);
  if (tagged) {
    const word = normalizePersonalWord(tagged[2]);
    return validWord(word) ? { category: resolveCategory(tagged[1]) ?? DEFAULT_CATEGORY, word } : null;
  }
  const legacy = LEGACY.exec(caption);
  if (!legacy) return null;
  const category = resolveCategory(legacy[1]);
  const word = normalizePersonalWord(legacy[2]);
  return category && validWord(word) ? { category, word } : null;
}

export function formatPictogramShare(category: string, word: string): string {
  return `#picto ${resolveCategory(category) ?? DEFAULT_CATEGORY}: ${normalizePersonalWord(word)}`;
}
