import { describe, expect, it } from 'vitest';
import { extractChoices, levenshtein, MAX_SUGGESTIONS, SuggestionEngine } from './suggest';
import { testData, testVocab } from './testing';

const vocab = testVocab();
const engine = new SuggestionEngine(testData.suggestions, (w) => vocab.verbs.get(w)?.inf ?? w);
const texts = (q: string) => engine.suggest(q).map((s) => s.text);
const reasons = (q: string) => new Set(engine.suggest(q).map((s) => s.reason));

describe('extractChoices', () => {
  it('extracts "X o Y" and comma lists', () => {
    expect(extractChoices('Vuoi pizza o pasta?').choices).toEqual(['Pizza', 'Pasta']);
    expect(extractChoices('pizza, pasta o riso?').choices).toEqual(['Pizza', 'Pasta', 'Riso']);
    expect(extractChoices('Vuoi la pizza oppure la pasta?').choices).toEqual(['La pizza', 'La pasta']);
    expect(extractChoices('Torni a piedi o in autobus?').choices).toEqual(['A piedi', 'In autobus']);
    expect(extractChoices('Senti, vuoi pizza o pasta?').choices).toEqual(['Pizza', 'Pasta']);
  });

  it('turns "… o no?" into a yes/no question', () => {
    expect(extractChoices('Vieni o no?')).toEqual({ choices: [], yesNo: true });
  });

  it('ignores sentences without alternatives', () => {
    expect(extractChoices('Dove sei?').choices).toEqual([]);
  });
});

describe('suggest', () => {
  it('offers explicit choices first', () => {
    const s = engine.suggest('Vuoi pizza o pasta?');
    expect(s.slice(0, 2).map((x) => [x.text, x.reason])).toEqual([
      ['Pizza', 'choice'],
      ['Pasta', 'choice'],
    ]);
  });

  it('answers yes/no questions', () => {
    expect(texts('Hai visto il film nuovo?')).toEqual(['Sì', 'No', 'Non lo so']);
    expect(texts('Vieni o no?')).toEqual(['Sì', 'No', 'Non lo so']);
    expect(reasons('Hai visto il film nuovo?')).toEqual(new Set(['yes-no']));
  });

  it('matches predefined questions fuzzily', () => {
    expect(texts('Dove sei tesoro?')).toContain('A casa');
    expect(texts('hai fatto i compiti di matematica')).toEqual(expect.arrayContaining(['Sì', 'No', 'Non ancora']));
    expect(reasons('Dove sei tesoro?')).toContain('predefined');
  });

  it.each([
    ['Dove andate dopo la partita?', 'Al parco'],
    ['Quando arriva il pullman?', 'Tra poco'],
    ['A che ora finisce la lezione?', 'Alle 13'],
    ['Cosa vuoi mangiare domenica?', 'Pizza'],
    ['Cosa vuoi bere?', 'Acqua'],
    ['Come ti senti oggi?', 'Bene'],
    ['Chi ti ha accompagnato?', 'Mamma'],
    ['Perché non rispondi?', 'Non lo so'],
    ['Come torni a casa stasera?', 'In autobus'],
    ['Quanti compagni ci sono?', 'Due'],
  ])('answers wh-question %s', (question, expected) => {
    expect(texts(question)).toContain(expected);
  });

  it('answers greetings, keeping a slot for them next to a question', () => {
    expect(texts('Buongiorno!')).toContain('Buongiorno!');
    expect(texts('Buonanotte amore')[0]).toBe('Buonanotte!');
    const mixed = engine.suggest('Ciao! Come stai?');
    expect(mixed.some((s) => s.reason === 'greeting')).toBe(true);
    expect(mixed[0].text).toBe('Bene');
  });

  it('reacts to common statements', () => {
    expect(texts('Vieni a casa, è pronto')).toContain('Arrivo');
    expect(texts('Ti voglio bene')).toContain('Anche io ti voglio bene');
  });

  it('falls back to generic replies', () => {
    expect(engine.suggest('Ho comprato il latte').map((s) => s.reason)).toEqual(['fallback', 'fallback', 'fallback', 'fallback']);
    expect(engine.suggest('   ')).toEqual([]);
  });

  it('returns at most six deduplicated suggestions', () => {
    for (const q of ['Quando torni?', 'Ciao! Dove sei?', 'Cosa mangi stasera?']) {
      const list = texts(q);
      expect(list.length).toBeLessThanOrEqual(MAX_SUGGESTIONS);
      expect(new Set(list.map((t) => t.toLowerCase())).size).toBe(list.length);
    }
  });
});

describe('levenshtein', () => {
  it('computes edit distance', () => {
    expect(levenshtein('come stai', 'come stai')).toBe(0);
    expect(levenshtein('gatto', 'gatti')).toBe(1);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});
