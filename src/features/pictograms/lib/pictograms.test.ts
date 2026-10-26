import { describe, expect, it } from 'vitest';
import type { Category, PersonalPictogram } from '@/core/types';
import { canKeepAsIs, fileNameFor, fitWithin } from './image';
import { filterPictograms, findByWord, groupByCategory } from './model';

describe('fitWithin', () => {
  it('scales the longest edge down to the maximum, keeping the ratio', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 512, height: 384 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 384, height: 512 });
    expect(fitWithin(1000, 1000, 300)).toEqual({ width: 300, height: 300 });
  });

  it('never upscales and never returns 0 for a real image', () => {
    expect(fitWithin(200, 100)).toEqual({ width: 200, height: 100 });
    expect(fitWithin(10_000, 3)).toEqual({ width: 512, height: 1 });
  });

  it('handles broken sizes', () => {
    expect(fitWithin(0, 100)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(Number.NaN, 100)).toEqual({ width: 0, height: 0 });
  });
});

describe('canKeepAsIs', () => {
  it('keeps small, light, common images', () => {
    expect(canKeepAsIs(500, 500, 40_000, 'image/png')).toBe(true);
    expect(canKeepAsIs(600, 500, 40_000, 'image/png')).toBe(false);
    expect(canKeepAsIs(500, 500, 900_000, 'image/jpeg')).toBe(false);
    expect(canKeepAsIs(500, 500, 40_000, 'image/heic')).toBe(false);
  });
});

describe('fileNameFor', () => {
  it('makes a safe file name from the word', () => {
    expect(fileNameFor('Città di Roma', 'image/jpeg')).toBe('citta-di-roma.jpg');
    expect(fileNameFor('papà', 'image/png')).toBe('papa.png');
    expect(fileNameFor('???', 'image/jpeg')).toBe('pittogramma.jpg');
  });
});

const cats: Category[] = [
  { id: 'persone', label: 'Persone', icon: '🧑', color: 'person' },
  { id: 'cibo', label: 'Cibo', icon: '🍝', color: 'noun' },
];
const p = (word: string, category: string): PersonalPictogram => ({
  id: `p:${word}`,
  word,
  category,
  image: new Blob(),
  createdAt: 0,
  origin: 'manual',
});

describe('personal pictogram model', () => {
  const items = [p('zio', 'persone'), p('pizza', 'cibo'), p('anna', 'persone'), p('lego', 'giochi')];

  it('groups by category in composer order, sorted, unknown last', () => {
    const groups = groupByCategory(items, cats);
    expect(groups.map((g) => g.category.id)).toEqual(['persone', 'cibo', 'altro']);
    expect(groups[0].items.map((i) => i.word)).toEqual(['anna', 'zio']);
  });

  it('filters ignoring accents and case', () => {
    expect(filterPictograms([p('papà', 'persone'), p('pane', 'cibo')], 'PAPA').map((i) => i.word)).toEqual(['papà']);
    expect(filterPictograms(items, '  ')).toHaveLength(4);
  });

  it('finds duplicates by word, excluding the edited one', () => {
    expect(findByWord(items, ' Pizza ')?.id).toBe('p:pizza');
    expect(findByWord(items, 'pizza', 'p:pizza')).toBeUndefined();
  });
});
