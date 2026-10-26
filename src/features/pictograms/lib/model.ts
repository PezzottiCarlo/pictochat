/** Pure helpers for the personal pictogram library. */
import type { Category, PersonalPictogram } from '@/core/types';
import { foldText } from '@/features/chats/chatListModel';

export interface PictogramGroup {
  category: Category;
  items: PersonalPictogram[];
}

/** Groups by composer category (in composer order), words sorted alphabetically; unknown categories go last as "Altro". */
export function groupByCategory(items: readonly PersonalPictogram[], categories: readonly Category[]): PictogramGroup[] {
  const known = new Map(categories.map((c) => [c.id, [] as PersonalPictogram[]]));
  const other: PersonalPictogram[] = [];
  for (const p of items) (known.get(p.category) ?? other).push(p);
  const byWord = (a: PersonalPictogram, b: PersonalPictogram) => a.word.localeCompare(b.word, 'it');
  const groups = categories.flatMap((c) => {
    const list = known.get(c.id)!;
    return list.length ? [{ category: c, items: list.sort(byWord) }] : [];
  });
  if (other.length) {
    groups.push({ category: { id: 'altro', label: 'Altro', icon: '📦', color: 'misc' }, items: other.sort(byWord) });
  }
  return groups;
}

/** Every word of the query must appear in the word (accent/case-insensitive). */
export function filterPictograms(items: readonly PersonalPictogram[], query: string): PersonalPictogram[] {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [...items];
  return items.filter((p) => {
    const hay = foldText(p.word);
    return words.every((w) => hay.includes(w));
  });
}

/** Personal pictogram already using this word (words are stored lowercase, trimmed). */
export function findByWord(items: readonly PersonalPictogram[], word: string, exceptId?: string): PersonalPictogram | undefined {
  const w = foldText(word).replace(/\s+/g, ' ');
  return w ? items.find((p) => p.id !== exceptId && foldText(p.word) === w) : undefined;
}
