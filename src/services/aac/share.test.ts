import { describe, expect, it } from 'vitest';
import { resolveCategory } from './categories';
import { dataUrlToBlob } from './personal/migrate';
import { formatPictogramShare, parsePictogramShare } from './share';

describe('pictogram share captions', () => {
  it('parses the #picto format', () => {
    expect(parsePictogramShare('#picto cibo: Pizza Margherita')).toEqual({ category: 'cibo', word: 'pizza margherita' });
    expect(parsePictogramShare('  #PICTO Tempo libero :  calcio ')).toEqual({ category: 'tempo-libero', word: 'calcio' });
  });

  it('falls back to the default category for unknown tagged categories', () => {
    expect(parsePictogramShare('#picto boh: zaino rosso')).toEqual({ category: 'oggetti', word: 'zaino rosso' });
  });

  it('accepts legacy "categoria: parola" only for known categories', () => {
    expect(parsePictogramShare('persone: Nonna Maria')).toEqual({ category: 'persone', word: 'nonna maria' });
    expect(parsePictogramShare('oggetti quotidiani: chiavi')).toEqual({ category: 'oggetti', word: 'chiavi' });
    expect(parsePictogramShare('Ore 18: partita')).toBeNull();
    expect(parsePictogramShare('Nota: domani niente scuola')).toBeNull();
    expect(parsePictogramShare('guarda questa foto')).toBeNull();
    expect(parsePictogramShare('')).toBeNull();
  });

  it('rejects captions without a real word', () => {
    expect(parsePictogramShare('#picto cibo: 123')).toBeNull();
  });

  it('round-trips through formatPictogramShare', () => {
    const caption = formatPictogramShare('Cibo', '  Torta della Nonna ');
    expect(caption).toBe('#picto cibo: torta della nonna');
    expect(parsePictogramShare(caption)).toEqual({ category: 'cibo', word: 'torta della nonna' });
  });
});

describe('categories', () => {
  it('resolves ids, labels and legacy names', () => {
    expect(resolveCategory('Scuola e lavoro')).toBe('scuola');
    expect(resolveCategory('lavoro')).toBe('scuola');
    expect(resolveCategory('tempo libero')).toBe('tempo-libero');
    expect(resolveCategory('xyz')).toBeUndefined();
  });
});

describe('legacy migration', () => {
  it('decodes base64 data URLs into Blobs', async () => {
    const blob = dataUrlToBlob('data:image/png;base64,aGVsbG8=');
    expect(blob?.type).toBe('image/png');
    expect(await blob?.text()).toBe('hello');
    expect(dataUrlToBlob('not a data url')).toBeNull();
  });
});
