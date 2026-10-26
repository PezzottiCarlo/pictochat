import type { VocabData } from './vocab';

/**
 * Vocabulary is code-split: each generated JSON becomes its own lazily-loaded chunk
 * (precached by the service worker), so it never weighs on first paint.
 */
export async function loadVocabData(): Promise<VocabData> {
  const [pictograms, lemmas, composer, suggestions] = await Promise.all([
    import('@/data/pictograms.json'),
    import('@/data/lemmas.json'),
    import('@/data/composer.json'),
    import('@/data/suggestions.json'),
  ]);
  return {
    pictograms: pictograms.default,
    lemmas: lemmas.default,
    composer: composer.default,
    suggestions: suggestions.default,
  } as unknown as VocabData;
}
