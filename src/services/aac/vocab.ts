/**
 * In-memory vocabulary built once from the generated JSON in src/data (see scripts/build-vocab.mjs).
 * Pure module: no browser APIs, so tests can build it straight from the JSON files.
 */
import { stripAccents } from './text';

// --- generated file shapes -------------------------------------------------

/** [ARASAAC id, flags (1 = skin, 2 = hair), category index (-1 = none), label, "key1|key2|…"] */
export type PictogramItem = [number, number, number, string, string];
export interface PictogramData {
  version: number;
  categories: string[];
  items: PictogramItem[];
}

/** paradigms: space-separated forms encoded as `[kind]<chars dropped from infinitive><suffix>`; kind `*` = past participle, `~` = gerund. */
export interface LemmaData {
  version: number;
  paradigms: string[];
  /** [infinitive, paradigm index], most used first. */
  verbs: [string, number][];
}

/** [ARASAAC id, label] */
export type IdWord = [number, string];
export interface ComposerData {
  version: number;
  verbs: IdWord[];
  objects: Record<string, IdWord[]>;
  categories: Record<string, IdWord[]>;
}

export interface SuggestionRule {
  id?: string;
  re: string;
  answers: string;
}
export interface SuggestionData {
  version: number;
  answers: Record<string, string[]>;
  wh: SuggestionRule[];
  statements: SuggestionRule[];
  greetings: { re: string; reply: string[] }[];
  predefined: { q: string[]; a: string[] }[];
}

export interface VocabData {
  pictograms: PictogramData;
  lemmas: LemmaData;
  composer: ComposerData;
  suggestions: SuggestionData;
}

// --- runtime index ---------------------------------------------------------

export interface Entry {
  id: number;
  skin: boolean;
  hair: boolean;
  category?: string;
  label: string;
}

export type VerbKind = 'infinitive' | 'finite' | 'participle' | 'gerund';
export interface VerbForm {
  inf: string;
  kind: VerbKind;
}

const KIND: Record<string, VerbKind> = { '': 'finite', '*': 'participle', '~': 'gerund' };
const FORM_RE = /^([*~]?)(\d+)(.*)$/;

export class Vocab {
  /** Normalized keyword (1–4 words) → pictogram. */
  readonly keys = new Map<string, Entry>();
  readonly byId = new Map<number, Entry>();
  /** Inflected verb form → infinitive. */
  readonly verbs = new Map<string, VerbForm>();
  private unaccented?: Map<string, string>;

  constructor(readonly data: VocabData) {
    const { categories, items } = data.pictograms;
    for (const [id, flags, ci, label, keys] of items) {
      const entry: Entry = { id, skin: (flags & 1) !== 0, hair: (flags & 2) !== 0, category: categories[ci], label };
      this.byId.set(id, entry);
      if (keys) for (const k of keys.split('|')) this.keys.set(k, entry);
    }

    const { paradigms, verbs } = data.lemmas;
    for (const [inf, pi] of verbs) {
      if (!this.verbs.has(inf)) this.verbs.set(inf, { inf, kind: 'infinitive' });
      const forms = paradigms[pi];
      if (!forms) continue;
      for (const code of forms.split(' ')) {
        const m = FORM_RE.exec(code);
        if (!m) continue;
        const form = inf.slice(0, inf.length - Number(m[2])) + m[3];
        if (!this.verbs.has(form)) this.verbs.set(form, { inf, kind: KIND[m[1]] });
      }
    }
  }

  /** Key lookup ignoring accents ("perche" → "perchè", "citta" → "città"); built lazily. */
  unaccentedKey(word: string): string | undefined {
    if (!this.unaccented) {
      this.unaccented = new Map();
      for (const k of this.keys.keys()) {
        const bare = stripAccents(k);
        if (bare !== k && !this.keys.has(bare) && !this.unaccented.has(bare)) this.unaccented.set(bare, k);
      }
    }
    return this.unaccented.get(word);
  }
}
