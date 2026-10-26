/**
 * AacEngine implementation: glues the pure matcher/suggester to the lazily-loaded vocabulary,
 * the user's appearance settings and their personal pictograms. Every call returns fresh objects.
 */
import type {
  Appearance,
  Category,
  PersonalPictogram,
  Pictogram,
  PictogramToken,
  ReplySuggestion,
} from '@/core/types';
import { getSettings } from '@/stores/settings';
import { arasaacImageUrl, searchArasaacOnline, type ImageSize } from './arasaac';
import { CATEGORIES, DEFAULT_CATEGORY } from './categories';
import type { AacEngine } from './contract';
import { loadVocabData } from './loader';
import { matchText, type Hit } from './matcher';
import { personalToPictogram, usePersonalStore } from './personal/store';
import { SuggestionEngine } from './suggest';
import { keyOf } from './text';
import { Vocab, type Entry, type IdWord } from './vocab';

/** Pictograms outside the bundled index: request both colors (the server ignores unused ones). */
const UNKNOWN_FEATURES = { skin: true, hair: true };

export class AacEngineImpl implements AacEngine {
  private vocab?: Vocab;
  private suggester?: SuggestionEngine;
  private loading?: Promise<void>;
  private personal = new Map<string, PersonalPictogram>();
  private listeners = new Set<() => void>();
  private version = 0;

  constructor() {
    this.indexPersonal(usePersonalStore.getState().items);
    usePersonalStore.subscribe((state, prev) => {
      if (state.items !== prev.items) this.indexPersonal(state.items);
    });
  }

  // --- change notifications (for React hooks) ------------------------------

  /** Fires when the vocabulary finishes loading or personal pictograms change. */
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = (): number => this.version;

  private emit() {
    this.version++;
    for (const l of this.listeners) l();
  }

  private indexPersonal(items: PersonalPictogram[]) {
    this.personal = new Map(items.map((p) => [keyOf(p.word), p]));
    this.emit();
  }

  // --- lifecycle -----------------------------------------------------------

  ready(): Promise<void> {
    this.loading ??= Promise.all([
      loadVocabData(),
      usePersonalStore.getState().init().catch(() => undefined), // personal pictograms are optional
    ])
      .then(([data]) => {
        const vocab = new Vocab(data);
        this.vocab = vocab;
        this.suggester = new SuggestionEngine(data.suggestions, (w) => vocab.verbs.get(w)?.inf ?? w);
        this.emit();
      })
      .catch((err: unknown) => {
        this.loading = undefined; // e.g. chunk failed to load offline: retry on next call
        throw err;
      });
    return this.loading;
  }

  isReady(): boolean {
    return !!this.vocab;
  }

  private async loaded(): Promise<Vocab> {
    await this.ready();
    return this.vocab as Vocab;
  }

  // --- text → pictograms ---------------------------------------------------

  async textToPictograms(text: string): Promise<PictogramToken[]> {
    await this.ready();
    return this.tokensSync(text) ?? [];
  }

  /** Synchronous variant once loaded (undefined before): lets hooks render without a flash. */
  tokensSync(text: string, appearance: Appearance = getSettings().appearance): PictogramToken[] | undefined {
    const vocab = this.vocab;
    if (!vocab) return undefined;
    return matchText(vocab, text, this.personal).map((t) => {
      const token: PictogramToken = { text: t.text, lemma: t.lemma };
      const pictogram = t.hit && this.hitToPictogram(t.hit, appearance);
      if (pictogram) token.pictogram = pictogram;
      if (t.skipped) token.skipped = true;
      return token;
    });
  }

  private hitToPictogram(hit: Hit, appearance: Appearance): Pictogram | undefined {
    if (hit.source === 'personal') {
      const p = this.personal.get(hit.key);
      return p && personalToPictogram(p);
    }
    return this.entryToPictogram(hit.entry, hit.key, appearance);
  }

  private entryToPictogram(entry: Entry, word: string, appearance: Appearance, category = entry.category): Pictogram {
    const pictogram: Pictogram = {
      id: String(entry.id),
      word,
      url: arasaacImageUrl(entry.id, entry, appearance),
      source: 'arasaac',
    };
    if (category) pictogram.category = category;
    return pictogram;
  }

  // --- suggestions -----------------------------------------------------------

  async suggestReplies(incoming: string): Promise<ReplySuggestion[]> {
    await this.ready();
    return this.suggestSync(incoming) ?? [];
  }

  suggestSync(incoming: string, appearance: Appearance = getSettings().appearance): ReplySuggestion[] | undefined {
    if (!this.suggester) return undefined;
    return this.suggester.suggest(incoming).map(({ text, reason }) => ({
      text,
      reason,
      pictograms: (this.tokensSync(text, appearance) ?? []).flatMap((t) => (t.pictogram && !t.skipped ? [t.pictogram] : [])),
    }));
  }

  // --- composer --------------------------------------------------------------

  categories(): Category[] {
    return CATEGORIES.map((c) => ({ ...c }));
  }

  async byCategory(categoryId: string, opts?: { verb?: string }): Promise<Pictogram[]> {
    if (categoryId === 'verbi') return this.verbs();
    const vocab = await this.loaded();
    const { composer } = vocab.data;
    let list: IdWord[] = composer.categories[categoryId] ?? [];
    if (opts?.verb) {
      // Objects that go with the chosen verb ("mangiare" → foods) narrow the list when any fits this category.
      const key = keyOf(opts.verb);
      const objects = composer.objects[vocab.verbs.get(key)?.inf ?? key];
      const fitting = objects?.filter(([id]) => (vocab.byId.get(id)?.category ?? DEFAULT_CATEGORY) === categoryId);
      if (fitting?.length) list = fitting;
    }
    return this.withPersonal(categoryId, this.listToPictograms(vocab, list, categoryId));
  }

  async verbs(): Promise<Pictogram[]> {
    const vocab = await this.loaded();
    return this.withPersonal('verbi', this.listToPictograms(vocab, vocab.data.composer.verbs, 'verbi'));
  }

  private listToPictograms(vocab: Vocab, list: IdWord[], category: string): Pictogram[] {
    const appearance = getSettings().appearance;
    return list.flatMap(([id, word]) => {
      const entry = vocab.byId.get(id);
      return entry ? [this.entryToPictogram(entry, word, appearance, category)] : [];
    });
  }

  /** Personal pictograms of the category first; ARASAAC ones with the same word are dropped. */
  private withPersonal(categoryId: string, list: Pictogram[]): Pictogram[] {
    const mine = [...this.personal.values()].filter((p) => p.category === categoryId).map(personalToPictogram);
    const words = new Set(mine.map((p) => keyOf(p.word)));
    return [...mine, ...list.filter((p) => !words.has(keyOf(p.word)))];
  }

  // --- search ------------------------------------------------------------------

  async search(query: string, opts?: { limit?: number; online?: boolean }): Promise<Pictogram[]> {
    const q = keyOf(query);
    if (!q) return [];
    const limit = opts?.limit ?? 30;
    const vocab = await this.loaded();
    const appearance = getSettings().appearance;

    const results: Pictogram[] = [...this.personal.values()]
      .filter((p) => keyOf(p.word).includes(q))
      .sort((a, b) => Number(!keyOf(b.word).startsWith(q)) - Number(!keyOf(a.word).startsWith(q)))
      .map(personalToPictogram);

    const inf = vocab.verbs.get(q)?.inf;
    const ranked: { key: string; entry: Entry; rank: number }[] = [];
    for (const [key, entry] of vocab.keys) {
      const rank =
        key === q || key === inf ? 0 : key.startsWith(q) ? 1 : key.includes(` ${q}`) ? 2 : key.includes(q) ? 3 : -1;
      if (rank >= 0) ranked.push({ key, entry, rank });
    }
    ranked.sort((a, b) => a.rank - b.rank || a.key.length - b.key.length || a.entry.id - b.entry.id);

    const seen = new Set<number>();
    for (const { key, entry } of ranked) {
      if (results.length >= limit) break;
      if (seen.has(entry.id)) continue;
      seen.add(entry.id);
      results.push(this.entryToPictogram(entry, key, appearance));
    }

    if (opts?.online && results.length < limit) {
      for (const r of await searchArasaacOnline(query)) {
        if (results.length >= limit) break;
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        const known = vocab.byId.get(r.id);
        results.push({
          id: String(r.id),
          word: r.word,
          url: arasaacImageUrl(r.id, known ?? r, appearance),
          source: 'arasaac',
          ...(known?.category && { category: known.category }),
        });
      }
    }
    return results;
  }

  imageUrl(arasaacId: number, appearance: Appearance, size: ImageSize = 500): string {
    return arasaacImageUrl(arasaacId, this.vocab?.byId.get(arasaacId) ?? UNKNOWN_FEATURES, appearance, size);
  }
}

export const aac = new AacEngineImpl();
