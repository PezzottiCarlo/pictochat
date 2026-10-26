/** Test helper: the real generated vocabulary, loaded synchronously (Node/vitest only). */
import pictograms from '@/data/pictograms.json';
import lemmas from '@/data/lemmas.json';
import composer from '@/data/composer.json';
import suggestions from '@/data/suggestions.json';
import { Vocab, type VocabData } from './vocab';

export const testData = { pictograms, lemmas, composer, suggestions } as unknown as VocabData;

let vocab: Vocab | undefined;
export const testVocab = (): Vocab => (vocab ??= new Vocab(testData));
