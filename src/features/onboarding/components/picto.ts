import { useMemo } from 'react';
import type { Pictogram } from '@/core/types';
import { aac, useAacReady } from '@/services/aac';
import { useSettings } from '@/stores/settings';

/** A hand-picked ARASAAC pictogram used for illustrations and the tutorial. */
export interface PictoRef {
  id: number;
  word: string;
  /** Composer category id (drives the Fitzgerald colour edge). */
  category: string;
}

/** Ids checked against the bundled vocabulary (src/data/pictograms.json). */
export const PICTOS = {
  io: { id: 6632, word: 'io', category: 'persone' },
  tu: { id: 6625, word: 'tu', category: 'persone' },
  ragazza: { id: 10206, word: 'ragazza', category: 'persone' },
  ragazzo: { id: 7176, word: 'ragazzo', category: 'persone' },
  mamma: { id: 2458, word: 'mamma', category: 'persone' },
  genitori: { id: 35059, word: 'genitori', category: 'persone' },
  educatore: { id: 33030, word: 'educatore', category: 'persone' },
  volere: { id: 5441, word: 'volere', category: 'verbi' },
  mangiare: { id: 6456, word: 'mangiare', category: 'verbi' },
  andare: { id: 8142, word: 'andare', category: 'verbi' },
  leggere: { id: 7141, word: 'leggere', category: 'verbi' },
  scrivere: { id: 2380, word: 'scrivere', category: 'verbi' },
  ascoltare: { id: 6572, word: 'ascoltare', category: 'verbi' },
  parlare: { id: 6517, word: 'parlare', category: 'verbi' },
  rispondere: { id: 9031, word: 'rispondere', category: 'verbi' },
  scegliere: { id: 30510, word: 'scegliere', category: 'verbi' },
  vedere: { id: 6564, word: 'vedere', category: 'verbi' },
  aiutare: { id: 4570, word: 'aiutare', category: 'verbi' },
  amare: { id: 6600, word: 'voler bene', category: 'verbi' },
  pizza: { id: 2527, word: 'pizza', category: 'cibo' },
  pasta: { id: 8652, word: 'pasta', category: 'cibo' },
  parco: { id: 2859, word: 'parco', category: 'luoghi' },
  casa: { id: 2317, word: 'casa', category: 'luoghi' },
  contento: { id: 35547, word: 'contento', category: 'emozioni' },
  festa: { id: 7099, word: 'festa', category: 'tempo-libero' },
  musica: { id: 24791, word: 'musica', category: 'tempo-libero' },
  cellulare: { id: 25269, word: 'cellulare', category: 'oggetti' },
  fotocamera: { id: 24925, word: 'macchina fotografica', category: 'oggetti' },
  lucchetto: { id: 6957, word: 'lucchetto', category: 'oggetti' },
  chiave: { id: 8153, word: 'chiave', category: 'oggetti' },
  occhiali: { id: 3329, word: 'occhiali', category: 'oggetti' },
  pittura: { id: 4870, word: 'colori', category: 'scuola' },
  domanda: { id: 7217, word: 'domanda', category: 'social' },
  ciao: { id: 6522, word: 'ciao', category: 'social' },
  grazie: { id: 8129, word: 'grazie', category: 'social' },
} satisfies Record<string, PictoRef>;

export type PictoKey = keyof typeof PICTOS;

/**
 * Pictograms with the user's skin/hair applied. Undefined until the vocabulary is
 * loaded, so each image URL is final (no double download when features resolve).
 */
export function usePictos(keys: readonly PictoKey[]): Pictogram[] | undefined {
  const ready = useAacReady();
  const appearance = useSettings((s) => s.appearance);
  const joined = keys.join('|');
  return useMemo(() => {
    if (!ready) return undefined;
    return joined.split('|').map((key) => {
      const ref = PICTOS[key as PictoKey];
      return {
        id: String(ref.id),
        word: ref.word,
        url: aac.imageUrl(ref.id, appearance, 500),
        source: 'arasaac' as const,
        category: ref.category,
      };
    });
  }, [ready, appearance, joined]);
}
