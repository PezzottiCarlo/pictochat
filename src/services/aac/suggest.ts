/**
 * On-device reply suggestions: lightweight NLP heuristics over the curated knowledge base in
 * src/data/suggestions.json (explicit choices, predefined Q/A with fuzzy matching, wh-questions,
 * yes/no questions, greetings, fallbacks). Pure: pictograms are attached by the engine.
 */
import type { ReplySuggestion } from '@/core/types';
import { isStopword, keyOf, normalizeWord } from './text';
import type { SuggestionData } from './vocab';

export interface RawSuggestion {
  text: string;
  reason: ReplySuggestion['reason'];
}

export const MAX_SUGGESTIONS = 6;
const FUZZY_THRESHOLD = 0.74;
const WH_START = /^(dove|dov'|quando|come|com'|chi|cosa|cos'|che|perchè|quanto|quanta|quanti|quante|quale|quali|qual')(?=\s|$)/u;
/** JS `\b` is ASCII-only ("perchè\b" never matches): rules get a Unicode-aware boundary instead. */
const WORD_BOUNDARY = String.raw`(?:(?<![\p{L}\p{N}])(?=[\p{L}\p{N}])|(?<=[\p{L}\p{N}])(?![\p{L}\p{N}]))`;
export const compileRule = (re: string): RegExp => new RegExp(re.replaceAll(String.raw`\b`, WORD_BOUNDARY), 'u');
const NOT_AN_OPTION = new Set(['no', 'cosa', 'altro', 'niente', 'meno', 'nulla']);

/** Edit distance (two-row DP). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Vuoi pizza, pasta o riso?" → ["Pizza", "Pasta", "Riso"]; `yesNo` when the last option is "no". */
export function extractChoices(question: string): { choices: string[]; yesNo: boolean } {
  const s = normalizeWord(question.replace(/\?.*$/s, ''))
    .replace(/[^\p{L}\p{N}', ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!/\s(o|oppure)\s/.test(s)) return { choices: [], yesNo: false };
  const items = s.split(/\s*,\s*|\s+(?:o|oppure)\s+/).filter(Boolean);
  if (items.length < 2) return { choices: [], yesNo: false };

  const last = items[items.length - 1];
  if (NOT_AN_OPTION.has(last)) {
    items.pop();
    if (items.length < 2) return { choices: [], yesNo: last === 'no' };
  }
  // Walking back from the last option, the first longer item holds the question ("vuoi la pizza"):
  // keep as many trailing words as the last option has, and drop anything before it ("senti, …").
  const width = items[items.length - 1].split(' ').length;
  const choices: string[] = [items[items.length - 1]];
  for (let i = items.length - 2; i >= 0 && choices.length < 5; i--) {
    const words = items[i].split(' ');
    choices.unshift(words.slice(-width).join(' '));
    if (words.length > width) break;
  }
  if (choices.some((c) => c.split(' ').length > 4)) return { choices: [], yesNo: false };
  return { choices: choices.map(capitalize), yesNo: false };
}

type Lemmatizer = (word: string) => string;

interface Variant {
  key: string;
  words: Set<string>;
}

export class SuggestionEngine {
  private readonly wh: { re: RegExp; answers: string[] }[];
  private readonly statements: { re: RegExp; answers: string[] }[];
  private readonly greetings: { re: RegExp; reply: string[] }[];
  private readonly predefined: { variants: Variant[]; answers: string[] }[];

  constructor(
    private readonly data: SuggestionData,
    private readonly lemma: Lemmatizer = (w) => w,
  ) {
    const answers = (id: string) => data.answers[id] ?? [];
    this.wh = data.wh.map((r) => ({ re: compileRule(r.re), answers: answers(r.answers) }));
    this.statements = data.statements.map((r) => ({ re: compileRule(r.re), answers: answers(r.answers) }));
    this.greetings = data.greetings.map((g) => ({ re: compileRule(g.re), reply: g.reply }));
    this.predefined = data.predefined.map((p) => ({
      variants: p.q.map((q) => this.variant(keyOf(q))),
      answers: p.a,
    }));
  }

  private variant(key: string): Variant {
    return { key, words: new Set(key.split(' ').filter((w) => w && !isStopword(w)).map(this.lemma)) };
  }

  /**
   * Similarity in [0, 1]: Dice overlap of content-word lemmas, where longer words also match with
   * one typo. Word-level on purpose: whole-string edit distance confuses "vuoi bere" with "vuoi fare".
   */
  similarity(a: Variant, b: Variant): number {
    if (a.key === b.key) return 1;
    const total = a.words.size + b.words.size;
    if (!total) return 0;
    let shared = 0;
    for (const w of a.words) {
      if (b.words.has(w)) shared++;
      else if (w.length >= 5 && [...b.words].some((x) => x.length >= 5 && levenshtein(w, x) <= 1)) shared++;
    }
    return (2 * shared) / total;
  }

  suggest(incoming: string, max = MAX_SUGGESTIONS): RawSuggestion[] {
    const raw = incoming.normalize('NFC').trim();
    if (!raw) return [];

    const all = keyOf(raw);
    // The question that needs an answer is the last sentence ending with '?', if any.
    const sentences = raw.split(/(?<=[.!?\n])\s*/u).filter((s) => /\p{L}/u.test(s));
    const asked = [...sentences].reverse().find((s) => s.includes('?'));
    const clause = keyOf(asked ?? sentences[sentences.length - 1] ?? raw);
    const isQuestion = !!asked || WH_START.test(clause);

    const main: RawSuggestion[] = [];
    const add = (list: RawSuggestion[], texts: string[], reason: RawSuggestion['reason']) => {
      for (const text of texts) list.push({ text, reason });
    };

    let yesNo = false;
    let answered = false;
    if (isQuestion) {
      const choice = extractChoices(asked ?? clause);
      yesNo = choice.yesNo;
      if (choice.choices.length) {
        add(main, choice.choices, 'choice');
        answered = true;
      }

      const predefined = this.bestPredefined(clause);
      if (predefined) {
        add(main, predefined, 'predefined');
        answered = true;
      }

      const wh = this.wh.find((r) => r.re.test(clause));
      if (wh) {
        add(main, wh.answers, 'wh-question');
        answered = true;
      }
      if (!answered || yesNo) add(main, this.data.answers.yesno ?? [], 'yes-no');
    } else {
      const predefined = this.bestPredefined(clause);
      if (predefined) add(main, predefined, 'predefined');
    }

    for (const st of this.statements) if (st.re.test(all)) add(main, st.answers, 'predefined');

    const greetings: RawSuggestion[] = [];
    const greeting = this.greetings.find((g) => g.re.test(all));
    if (greeting) add(greetings, greeting.reply, 'greeting');

    // Keep one slot for a greeting when the message also asks something.
    let out = dedupe(main);
    out = greetings.length && out.length ? [...out.slice(0, max - 1), greetings[0]] : [...out, ...greetings];
    out = dedupe(out);
    if (out.length < 3 && !greetings.length) {
      const filler = isQuestion ? ['Non lo so', 'Non ho capito'] : (this.data.answers.fallback ?? []);
      out = dedupe([...out, ...filler.map((text) => ({ text, reason: 'fallback' as const }))]);
    }
    return out.slice(0, max);
  }

  private bestPredefined(clause: string): string[] | undefined {
    const q = this.variant(clause);
    let best: string[] | undefined;
    let bestScore = FUZZY_THRESHOLD;
    for (const p of this.predefined) {
      for (const v of p.variants) {
        const score = this.similarity(q, v);
        if (score >= bestScore) {
          bestScore = score;
          best = p.answers;
        }
      }
    }
    return best;
  }
}

function dedupe(list: RawSuggestion[]): RawSuggestion[] {
  const seen = new Set<string>();
  return list.filter((s) => {
    const k = keyOf(s.text);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
