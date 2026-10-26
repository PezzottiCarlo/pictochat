/** Pictogram helpers that need the AAC catalogue (categories, image urls). */
import type { Appearance, PersonalPictogram, Pictogram } from '@/core/types';
import { aac, personalToPictogram } from '@/services/aac';
import type { RecentRef } from './recents';

/** Resolves stored recents back to pictograms (personal ones only while they still exist). */
export function resolveRecents(
  recents: readonly RecentRef[],
  personal: readonly PersonalPictogram[],
  appearance: Appearance,
): Pictogram[] {
  const mine = new Map(personal.map((p) => [p.id, p]));
  return recents.flatMap((r): Pictogram[] => {
    if (r.source === 'personal') {
      const p = mine.get(r.id);
      return p ? [personalToPictogram(p)] : [];
    }
    const id = Number(r.id);
    if (!Number.isFinite(id)) return [];
    return [
      {
        id: r.id,
        word: r.word,
        source: 'arasaac',
        url: aac.imageUrl(id, appearance),
        ...(r.category ? { category: r.category } : {}),
      },
    ];
  });
}
