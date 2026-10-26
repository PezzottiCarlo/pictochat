import { describe, expect, it } from 'vitest';
import { baseForms, collapseRepeats, keyOf, normalizeWord, splitEnclitic, tokenize } from './text';

const words = (s: string) => tokenize(s).map((t) => t.word);

describe('normalization', () => {
  it('lowercases, folds acute accents to grave and straightens apostrophes', () => {
    expect(normalizeWord('  Perché ')).toBe('perchè');
    expect(normalizeWord('L’Acqua')).toBe("l'acqua");
    expect(normalizeWord('CITTÀ')).toBe('città');
  });

  it('builds lookup keys with split elisions and no punctuation', () => {
    expect(keyOf("Bottiglia d'acqua!")).toBe("bottiglia d' acqua");
    expect(keyOf('  Ciao,   mamma… ')).toBe('ciao mamma');
  });
});

describe('tokenize', () => {
  it('splits elisions and expands elided words', () => {
    const t = tokenize("l'acqua dell'amico dov'è c'è un'ora");
    expect(t.map((x) => x.text)).toEqual(["l'", 'acqua', "dell'", 'amico', "dov'", 'è', "c'", 'è', "un'", 'ora']);
    expect(t.map((x) => x.word)).toEqual(['la', 'acqua', 'dell', 'amico', 'dove', 'è', 'ci', 'è', 'una', 'ora']);
    expect(t.filter((x) => x.stop).map((x) => x.text)).toEqual(["l'", "dell'", "c'", "un'"]);
  });

  it('keeps accents, handles truncations and chat abbreviations', () => {
    expect(words("un po' perche' è così, nn lo so xké")).toEqual(['un', 'poco', 'perchè', 'è', 'così', 'non', 'lo', 'so', 'perchè']);
  });

  it('ignores emojis and punctuation but marks boundaries', () => {
    const t = tokenize('Ciao 😀 mamma! Dove sei?');
    expect(t.map((x) => x.text)).toEqual(['Ciao', 'mamma', 'Dove', 'sei']);
    expect(t.map((x) => x.boundary)).toEqual([true, true, true, false]);
  });

  it('recognizes numbers, times and hyphenated words', () => {
    const t = tokenize('alle 15:30 compro 2 e-mail');
    expect(t.map((x) => [x.text, x.kind])).toEqual([
      ['alle', 'word'],
      ['15:30', 'time'],
      ['compro', 'word'],
      ['2', 'number'],
      ['e-mail', 'word'],
    ]);
  });

  it('flags articles, prepositions (incl. articulated) and conjunctions as stopwords', () => {
    const t = tokenize('il gatto della nonna e il cane sul letto');
    expect(t.filter((x) => x.stop).map((x) => x.text)).toEqual(['il', 'della', 'e', 'il', 'sul']);
  });
});

describe('morphology helpers', () => {
  it('proposes singular / masculine base forms', () => {
    expect(baseForms('pizze')).toContain('pizza');
    expect(baseForms('bambini')).toContain('bambino');
    expect(baseForms('felici')).toContain('felice');
    expect(baseForms('amiche')[0]).toBe('amica');
    expect(baseForms('giochi')[0]).toBe('gioco');
    expect(baseForms('stanca')).toContain('stanco');
    expect(baseForms('uova')).toContain('uovo');
  });

  it('splits enclitic pronouns', () => {
    expect(splitEnclitic('lavarmi')).toEqual({ base: 'lavare', clitic: 'mi' });
    expect(splitEnclitic('dimmi')).toEqual({ base: 'di', clitic: 'mi' });
    expect(splitEnclitic('aiutami')).toEqual({ base: 'aiuta', clitic: 'mi' });
  });

  it('collapses stretched letters', () => {
    expect(collapseRepeats('ciaooooo')).toBe('ciao');
    expect(collapseRepeats('mamma')).toBe('mamma');
  });
});
