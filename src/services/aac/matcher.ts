/**
 * Text → pictogram matcher: greedy longest match (4 → 1 words) over personal pictograms,
 * verb lemmas (incl. auxiliary + participle compounds) and the ARASAAC keyword index.
 * Pure and synchronous; tokens come out in sentence order.
 */
import {
  baseForms,
  collapseRepeats,
  isNounContext,
  nonReflexiveOf,
  REFLEXIVE_CLITICS,
  reflexiveOf,
  splitEnclitic,
  tokenize,
  type Token,
} from './text';
import type { Entry, Vocab, VerbForm } from './vocab';

export type Hit = { source: 'personal'; key: string } | { source: 'arasaac'; key: string; entry: Entry };

export interface MatchToken {
  /** Original text covered (may span several words). */
  text: string;
  /** Lookup form: infinitive for verbs, matched keyword otherwise. */
  lemma: string;
  hit?: Hit;
  skipped?: boolean;
}

/** Normalized keys (see `keyOf`) of the user's personal pictograms. */
export interface PersonalIndex {
  has(key: string): boolean;
}

const MAX_WORDS = 4;
const AUXILIARIES = new Set(['avere', 'essere']);
/** Adverbs allowed between auxiliary and participle ("ho già mangiato"). */
const INNER_ADVERBS = new Set(['già', 'mai', 'appena', 'ancora', 'sempre', 'anche', 'più', 'proprio', 'solo', 'tanto', 'molto', 'bene']);

interface Head {
  len: number;
  key: string;
  verb: boolean;
}

interface Resolved {
  len: number;
  lemma: string;
  hit?: Hit;
  skipped?: boolean;
}

export function matchText(vocab: Vocab, input: string, personal?: PersonalIndex): MatchToken[] {
  const text = input.normalize('NFC');
  const tokens = tokenize(text);
  const n = tokens.length;

  const find = (key: string): Hit | undefined => {
    if (personal?.has(key)) return { source: 'personal', key };
    const entry = vocab.keys.get(key);
    return entry ? { source: 'arasaac', key, entry } : undefined;
  };
  const verbOf = (t: Token): VerbForm | undefined => (t.kind === 'word' ? vocab.verbs.get(t.word) : undefined);
  const prevOf = (i: number): Token | undefined => (i > 0 && !tokens[i].boundary ? tokens[i - 1] : undefined);

  /** Verb pictogram, trying the reflexive variant first after "mi/ti/si…". */
  const verbHit = (inf: string, reflexive: boolean): Hit | undefined => {
    const refl = reflexiveOf(inf);
    const candidates = reflexive ? [refl, inf] : [inf, refl];
    const plain = nonReflexiveOf(inf);
    if (plain) candidates.push(plain);
    for (const c of candidates) {
      const hit = find(c);
      if (hit) return hit;
    }
    return undefined;
  };

  /** "ho mangiato", "sono già andata", "sto mangiando" → infinitive covering 2–3 tokens. */
  const compoundAt = (i: number): { len: number; inf: string; adjective?: Hit } | null => {
    const head = verbOf(tokens[i]);
    if (!head || head.kind === 'participle' || head.kind === 'gerund') return null;
    let j = i + 1;
    if (j + 1 < n && !tokens[j].boundary && INNER_ADVERBS.has(tokens[j].word)) j++;
    if (j >= n || tokens[j].boundary) return null;
    const tail = verbOf(tokens[j]);
    if (!tail) return null;
    const len = j - i + 1;
    if (head.inf === 'stare' && tail.kind === 'gerund') return { len, inf: tail.inf };
    if (!AUXILIARIES.has(head.inf) || tail.kind !== 'participle') return null;
    // "sono arrabbiato": with essere, a participle that has its own pictogram is an adjective.
    if (head.inf === 'essere' && tail.inf !== 'essere' && tail.inf !== 'stare') {
      const adjective = find(tokens[j].word);
      if (adjective) return { len, inf: tokens[j].word, adjective };
    }
    return { len, inf: tail.inf };
  };

  const resolveWord = (i: number, word = tokens[i].word): Resolved => {
    const t = tokens[i];
    const own = find(word) ?? (t.key !== word ? find(t.key) : undefined);
    if (own?.source === 'personal') return { len: 1, lemma: own.key, hit: own };
    if (t.kind === 'time') return { len: 1, lemma: t.text, hit: find('orologio') };

    const prev = prevOf(i);
    const verb = t.kind === 'word' ? vocab.verbs.get(word) : undefined;
    const nounContext = !!prev && isNounContext(prev.word);
    if (own && (nounContext || !verb || verb.kind === 'participle' || verb.kind === 'infinitive')) {
      return { len: 1, lemma: own.key, hit: own };
    }
    const fromBase = (): Resolved | undefined => {
      for (const base of baseForms(word)) {
        const hit = find(base);
        if (hit) return { len: 1, lemma: base, hit };
      }
      return undefined;
    };
    if (verb) {
      const noun = nounContext ? fromBase() : undefined; // "le fidanzate" is not "fidanzare"
      if (noun) return noun;
      const hit = verbHit(verb.inf, !!prev && REFLEXIVE_CLITICS.has(prev.key));
      if (hit) return { len: 1, lemma: verb.inf, hit };
      if (own) return { len: 1, lemma: own.key, hit: own };
      return fromBase() ?? { len: 1, lemma: verb.inf };
    }
    const base = fromBase();
    if (base) return base;
    const enclitic = splitEnclitic(word);
    const host = enclitic && vocab.verbs.get(enclitic.base);
    if (enclitic && host) {
      return { len: 1, lemma: host.inf, hit: verbHit(host.inf, REFLEXIVE_CLITICS.has(enclitic.clitic)) };
    }
    const accented = vocab.unaccentedKey(word);
    if (accented) return { len: 1, lemma: accented, hit: find(accented) };
    const collapsed = collapseRepeats(word);
    if (collapsed !== word) return resolveWord(i, collapsed);
    return { len: 1, lemma: word };
  };

  const matchAt = (i: number): Resolved => {
    const t = tokens[i];
    let maxSpan = 1;
    while (maxSpan < MAX_WORDS && i + maxSpan < n && !tokens[i + maxSpan].boundary) maxSpan++;

    const compound = compoundAt(i);
    const verb = verbOf(t);
    const heads: Head[] = [{ len: 1, key: t.key, verb: false }];
    if (compound) heads.push({ len: compound.len, key: compound.inf, verb: true });
    if (verb && verb.inf !== t.key) heads.push({ len: 1, key: verb.inf, verb: true });

    for (let span = maxSpan; span >= 2; span--) {
      for (const head of heads) {
        if (head.len >= span) continue;
        const ext = tokens.slice(i + head.len, i + span);
        if (ext[ext.length - 1].stop) continue;
        const key = [head.key, ...ext.map((e) => e.key)].join(' ');
        const hit = find(key);
        if (hit) return { len: span, lemma: key, hit };
      }
      if (compound?.len === span) {
        const hit = compound.adjective ?? verbHit(compound.inf, !!prevOf(i) && REFLEXIVE_CLITICS.has(tokens[i - 1].key));
        return { len: span, lemma: compound.inf, hit };
      }
    }

    if (t.stop) {
      const hit = personal?.has(t.key) ? find(t.key) : undefined;
      return hit ? { len: 1, lemma: t.key, hit } : { len: 1, lemma: t.word, skipped: true };
    }
    return resolveWord(i);
  };

  const out: MatchToken[] = [];
  for (let i = 0; i < n; ) {
    const r = matchAt(i);
    const token: MatchToken = { text: text.slice(tokens[i].start, tokens[i + r.len - 1].end), lemma: r.lemma };
    if (r.hit) token.hit = r.hit;
    if (r.skipped) token.skipped = true;
    out.push(token);
    i += r.len;
  }
  return out;
}
