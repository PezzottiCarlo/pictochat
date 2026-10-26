import { describe, expect, it } from 'vitest';
import { matchText, type MatchToken } from './matcher';
import { testVocab } from './testing';

const vocab = testVocab();
const match = (text: string, personal?: Set<string>) => matchText(vocab, text, personal);
/** Compact view: lemma of illustrated tokens, `-` for skipped ones, `?lemma` for unmatched. */
const view = (tokens: MatchToken[]) => tokens.map((t) => (t.skipped ? '-' : t.hit ? t.lemma : `?${t.lemma}`));

describe('matchText', () => {
  it('lemmatizes compound verbs and keeps nouns ("ho mangiato la pizza")', () => {
    const tokens = match('Ho mangiato la pizza');
    expect(view(tokens)).toEqual(['mangiare', '-', 'pizza']);
    expect(tokens[0].text).toBe('Ho mangiato');
  });

  it('handles auxiliary + adverb + participle and stare + gerund', () => {
    expect(view(match('Non ho ancora finito'))[1]).toBe('finire');
    expect(view(match('Sto mangiando adesso'))[0]).toBe('mangiare');
    expect(match('Sono andata a casa')[0]).toMatchObject({ text: 'Sono andata', lemma: 'andare' });
  });

  it('treats essere + participle with its own pictogram as an adjective', () => {
    expect(match('Sono arrabbiata')[0]).toMatchObject({ text: 'Sono arrabbiata', lemma: 'arrabbiata' });
  });

  it('maps finite verb forms to the infinitive', () => {
    expect(view(match('Domani mangiamo fuori'))).toEqual(['domani', 'mangiare', 'fuori']);
    expect(view(match('Vuoi giocare?'))).toEqual(['volere', 'giocare']);
  });

  it('preserves sentence order and skips stopwords', () => {
    const tokens = match("Il gatto dorme sul divano e beve l'acqua");
    expect(tokens.map((t) => t.text)).toEqual(['Il', 'gatto', 'dorme', 'sul', 'divano', 'e', 'beve', "l'", 'acqua']);
    expect(view(tokens)).toEqual(['-', 'gatto', 'dormire', '-', 'divano', '-', 'bere', '-', 'acqua']);
  });

  it('prefers the longest n-gram, also with a lemmatized verb head', () => {
    expect(view(match('Per favore'))).toEqual(['per favore']);
    expect(view(match('Mi lavo i denti'))).toEqual(['mi', 'lavare i denti']);
    expect(view(match('Domani vado a scuola'))).toEqual(['domani', 'andare a scuola']);
  });

  it('never builds n-grams across punctuation', () => {
    expect(match('Vado. A scuola no').map((t) => t.text)).toEqual(['Vado', 'A', 'scuola', 'no']);
  });

  it('uses context to disambiguate noun/verb homographs', () => {
    expect(view(match('Vado a letto'))).toEqual(['andare', '-', 'letto']);
    expect(view(match('Ho letto un libro'))).toEqual(['leggere', '-', 'libro']);
  });

  it('normalizes plurals and feminine forms against the index', () => {
    expect(view(match('le fidanzate'))).toEqual(['-', 'fidanzata']);
    expect(view(match('Ciaooo')).at(0)).toBe('ciao');
  });

  it('handles elisions, enclitics, numbers and times', () => {
    expect(view(match("Dov'è la mamma?"))).toEqual(['dove', 'essere', '-', 'mamma']);
    expect(view(match('aiutami'))).toEqual(['aiutare']);
    expect(view(match('alle 8'))).toEqual(['-', '8']);
    expect(match('alle 15:30')[1]).toMatchObject({ lemma: '15:30', hit: { source: 'arasaac' } });
  });

  it('lets personal pictograms win, including multi-word ones', () => {
    const personal = new Set(['pizza', 'nonna maria']);
    const tokens = match('La pizza della nonna Maria', personal);
    expect(tokens.map((t) => [t.text, t.hit?.source])).toEqual([
      ['La', undefined],
      ['pizza', 'personal'],
      ['della', undefined],
      ['nonna Maria', 'personal'],
    ]);
  });

  it('keeps unknown words as unillustrated tokens', () => {
    expect(view(match('Ciao Zxqwerty'))).toEqual(['ciao', '?zxqwerty']);
  });

  it('is fast once loaded (< 2 ms per typical message)', () => {
    const msg = 'Ciao mamma, oggi a scuola ho mangiato la pizza con i miei amici e poi siamo andati al parco!';
    match(msg); // warm-up
    const runs = 200;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) match(msg);
    expect((performance.now() - t0) / runs).toBeLessThan(2);
  });
});
