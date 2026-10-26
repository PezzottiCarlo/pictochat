import { describe, expect, it } from 'vitest';
import { buildSentence, conjugate, joinList, personOf, type SentencePart } from './lib/sentence';

const P = (word: string): SentencePart => ({ word, category: 'persone' });
const V = (word: string): SentencePart => ({ word, category: 'verbi' });
const F = (word: string): SentencePart => ({ word, category: 'cibo' });
const L = (word: string): SentencePart => ({ word, category: 'luoghi' });
const E = (word: string): SentencePart => ({ word, category: 'emozioni' });
const S = (word: string): SentencePart => ({ word, category: 'social' });
const T = (word: string): SentencePart => ({ word, category: 'tempo-libero' });

describe('conjugate', () => {
  it.each([
    ['mangiare', 0, 'mangio'],
    ['mangiare', 1, 'mangi'],
    ['mangiare', 3, 'mangiamo'],
    ['giocare', 1, 'giochi'],
    ['giocare', 3, 'giochiamo'],
    ['studiare', 1, 'studi'],
    ['cominciare', 3, 'cominciamo'],
    ['leggere', 2, 'legge'],
    ['dormire', 5, 'dormono'],
    ['capire', 0, 'capisco'],
    ['finire', 5, 'finiscono'],
    ['essere', 2, 'è'],
    ['andare', 5, 'vanno'],
    ['volere', 0, 'voglio'],
    ['lavarsi', 0, 'mi lavo'],
    ['vestirsi', 3, 'ci vestiamo'],
    ['svegliarsi', 1, 'ti svegli'],
    ['volere bene', 0, 'voglio bene'],
  ] as const)('%s (%i) → %s', (verb, person, expected) => {
    expect(conjugate(verb, person)).toBe(expected);
  });

  it('leaves non-infinitives unchanged', () => {
    expect(conjugate('mangia', 0)).toBe('mangia');
    expect(conjugate('ciao', 2)).toBe('ciao');
  });
});

describe('personOf', () => {
  it('maps pronouns and nouns', () => {
    expect(personOf(['io'])).toBe(0);
    expect(personOf(['tu'])).toBe(1);
    expect(personOf(['mamma'])).toBe(2);
    expect(personOf(['noi'])).toBe(3);
    expect(personOf(['loro'])).toBe(5);
  });
  it('handles several people', () => {
    expect(personOf(['io', 'mamma'])).toBe(3);
    expect(personOf(['tu', 'papà'])).toBe(4);
    expect(personOf(['mamma', 'papà'])).toBe(5);
  });
});

describe('joinList', () => {
  it('joins with commas and "e"', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['pizza'])).toBe('pizza');
    expect(joinList(['pizza', 'gelato'])).toBe('pizza e gelato');
    expect(joinList(['pane', 'latte', 'mela'])).toBe('pane, latte e mela');
  });
});

describe('buildSentence', () => {
  it.each<[SentencePart[], string]>([
    [[], ''],
    [[P('io'), V('mangiare'), F('pizza')], 'Io mangio pizza'],
    [[P('io'), V('mangiare'), F('pizza'), F('gelato')], 'Io mangio pizza e gelato'],
    [[P('mamma'), P('papà'), V('andare'), L('casa')], 'Mamma e papà vanno a casa'],
    [[P('tu'), V('andare'), L('parco')], 'Tu vai al parco'],
    [[P('io'), V('volere'), V('mangiare'), F('gelato')], 'Io voglio mangiare gelato'],
    [[P('noi'), V('capire')], 'Noi capiamo'],
    [[P('io'), V('lavarsi')], 'Io mi lavo'],
    [[P('io'), V('piacere'), F('pizza')], 'Mi piace pizza'],
    [[P('nonna'), V('piacere'), F('gelato')], 'A nonna piace gelato'],
    [[P('io'), V('essere'), E('felice')], 'Io sono felice'],
    [[P('io'), V('avere'), E('fame')], 'Io ho fame'],
    [[P('tu'), V('giocare'), T('calcio')], 'Tu giochi a calcio'],
    [[P('io'), V('volere bene'), P('tu')], 'Io voglio bene a te'],
    [[P('io'), V('aiutare'), P('tu')], 'Io aiuto te'],
    [[S('dove'), V('essere'), P('mamma')], 'Dove è mamma?'],
    [[S('ciao'), P('mamma')], 'Ciao mamma'],
    [[V('mangiare'), F('pizza')], 'Mangiare pizza'],
    [[F('pizza'), F('gelato')], 'Pizza e gelato'],
    [[S('io voglio'), F('acqua')], 'Io voglio acqua'],
  ])('%j → %s', (parts, expected) => {
    expect(buildSentence(parts)).toBe(expected);
  });

  it('ignores empty words and extra spaces', () => {
    expect(buildSentence([{ word: '  ' }, { word: ' grazie  ' }])).toBe('Grazie');
  });

  it('keeps unknown categories as plain words', () => {
    expect(buildSentence([{ word: 'oggi' }, P('io'), V('studiare')])).toBe('Oggi io studio');
  });
});
