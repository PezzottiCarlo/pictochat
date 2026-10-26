import { describe, expect, it } from 'vitest';
import { arasaacImageUrl } from './arasaac';
import { CATEGORIES } from './categories';
import { compileRule } from './suggest';
import { testData, testVocab } from './testing';
import { keyOf } from './text';

const vocab = testVocab();

describe('generated vocabulary', () => {
  it('stores keys normalized exactly like the runtime (build script in sync)', () => {
    const bad = [...vocab.keys.keys()].filter((k) => keyOf(k) !== k);
    expect(bad).toEqual([]);
  });

  it('indexes keywords and verb forms', () => {
    expect(vocab.keys.size).toBeGreaterThan(10_000);
    expect(vocab.verbs.get('mangiato')).toEqual({ inf: 'mangiare', kind: 'participle' });
    expect(vocab.verbs.get('vado')?.inf).toBe('andare');
    expect(vocab.verbs.get('stata')?.inf).toBe('essere');
    expect(vocab.verbs.get('giuochi')?.inf).toBe('giocare');
  });

  it('references only shipped pictograms from composer data', () => {
    const { verbs, objects, categories } = testData.composer;
    const ids = [...verbs, ...Object.values(objects).flat(), ...Object.values(categories).flat()].map(([id]) => id);
    expect(ids.filter((id) => !vocab.byId.has(id))).toEqual([]);
  });

  it('has a non-empty list for every composer category', () => {
    for (const c of CATEGORIES) {
      const list = c.id === 'verbi' ? testData.composer.verbs : testData.composer.categories[c.id];
      expect(list?.length, c.id).toBeGreaterThan(10);
    }
  });

  it('has valid suggestion rules', () => {
    const { wh, statements, greetings, answers } = testData.suggestions;
    for (const r of [...wh, ...statements, ...greetings]) expect(() => compileRule(r.re)).not.toThrow();
    for (const r of [...wh, ...statements]) expect(answers[r.answers], r.answers).toBeDefined();
  });
});

describe('arasaacImageUrl', () => {
  const appearance = { skin: 'black', hair: 'darkBrown' } as const;

  it('builds plain URLs for pictograms without skin/hair', () => {
    expect(arasaacImageUrl(2527, { skin: false, hair: false }, appearance, 300)).toBe(
      'https://static.arasaac.org/pictograms/2527/2527_300.png',
    );
  });

  it('applies hair then skin colors and bumps 300px to 500px', () => {
    expect(arasaacImageUrl(31807, { skin: true, hair: true }, appearance, 300)).toBe(
      'https://static.arasaac.org/pictograms/31807/31807_hair-6A2703_skin-A65C17_500.png',
    );
    expect(arasaacImageUrl(36480, { skin: true, hair: false }, { skin: 'asian', hair: 'red' })).toBe(
      'https://static.arasaac.org/pictograms/36480/36480_skin-F4ECAD_500.png',
    );
  });
});
