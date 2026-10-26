/**
 * Italian text normalization and tokenization (pure, no vocabulary needed).
 * `normalizeWord` / `keyOf` are mirrored in scripts/build-vocab.mjs — keep them in sync.
 */

const ACCENTS: Record<string, string> = { á: 'à', é: 'è', í: 'ì', î: 'ì', ó: 'ò', ú: 'ù' };

/** Lowercase, NFC, straight apostrophes, acute accents folded to grave ("perché" → "perchè"). */
export function normalizeWord(s: string): string {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[áéíîóú]/g, (c) => ACCENTS[c] ?? c)
    .trim();
}

/** Lookup key of a phrase: normalized words, elisions split ("Bottiglia d'acqua!" → "bottiglia d' acqua"). */
export function keyOf(phrase: string): string {
  return normalizeWord(phrase)
    .replace(/'(?=\p{L})/gu, "' ")
    .replace(/[^\p{L}\p{N}' -]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const stripAccents = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// ---------------------------------------------------------------------------
// Word classes
// ---------------------------------------------------------------------------

const set = (s: string) => new Set(s.split(' '));

const ARTICLES = set("il lo la i gli le l' un uno una un'");
const PREPOSITIONS = set("di d' a ad da in con su per tra fra");
const ARTICULATED = set(
  "del dello della dei degli delle dell' al allo alla ai agli alle all' dal dallo dalla dai dagli dalle dall' " +
    "nel nello nella nei negli nelle nell' sul sullo sulla sui sugli sulle sull' col coi",
);
const CONJUNCTIONS = set('e ed o od oppure ma che se');
/** Unstressed clitics with no useful pictogram ("mi"/"ti" are kept: they map to io/tu). */
const CLITICS = set("ci c' si s' vi v' ne n' li");

export const REFLEXIVE_CLITICS = set("mi m' ti t' si s' ci c' vi v'");

/** Words after which the next word is most likely a noun (article, preposition, possessive, number…). */
const NOUN_CONTEXT = new Set([
  ...ARTICLES,
  ...PREPOSITIONS,
  ...ARTICULATED,
  ...set('mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro nostra nostri nostre vostro vostra vostri vostre'),
  ...set("questo questa questi queste quello quella quelli quelle quel quell' quest' ogni qualche nessun nessuna molti molte pochi poche tanti tante"),
  ...set('due tre quattro cinque sette otto nove dieci'),
]);

export const isStopword = (w: string): boolean =>
  ARTICLES.has(w) || PREPOSITIONS.has(w) || ARTICULATED.has(w) || CONJUNCTIONS.has(w) || CLITICS.has(w);

export const isNounContext = (w: string): boolean => NOUN_CONTEXT.has(w) || /^\d+$/.test(w);

/** Elided forms whose full word is not obvious ("c'è" → "ci" + "è"). */
const ELISIONS: Record<string, string> = {
  "c'": 'ci', "dov'": 'dove', "com'": 'come', "cos'": 'cosa', "anch'": 'anche', "quell'": 'quello',
  "quest'": 'questo', "un'": 'una', "nessun'": 'nessuna', "tutt'": 'tutto', "sant'": 'santo',
  "bell'": 'bello', "buon'": 'buona', "m'": 'mi', "t'": 'ti', "s'": 'si', "v'": 'vi', "n'": 'ne',
  "d'": 'di', "mezz'": 'mezzo', "nient'": 'niente', "qual'": 'quale', "senz'": 'senza', "dev'": 'deve',
  "quand'": 'quando', "l'": 'la',
};

/** Trailing apostrophe used instead of an accent or truncation ("po'", "perche'"). */
const TRUNCATIONS: Record<string, string> = { "po'": 'poco', "e'": 'è', "va'": 'va', "fa'": 'fa', "sta'": 'sta', "di'": 'dì', "da'": 'dai' };

/** Common chat abbreviations used by teens and parents. */
const ABBREVIATIONS: Record<string, string> = {
  nn: 'non', cmq: 'comunque', xke: 'perchè', xkè: 'perchè', xchè: 'perchè', xche: 'perchè', perche: 'perchè',
  xk: 'perchè', ke: 'che', x: 'per', qlc: 'qualcosa', qlcs: 'qualcosa', qls: 'qualcosa', tt: 'tutto',
  sn: 'sono', dv: 'dove', cm: 'come', grz: 'grazie', okay: 'ok', oki: 'ok', okk: 'ok', msg: 'messaggio',
  cel: 'cellulare', mamy: 'mamma', mami: 'mamma', papi: 'papà', pà: 'papà',
};

const GRAVE: Record<string, string> = { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' };

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

export interface Token {
  /** Original text as typed. */
  text: string;
  start: number;
  end: number;
  /** Normalized surface, used to build n-gram keys (matches `keyOf`). */
  key: string;
  /** Lookup word after elision / abbreviation expansion ("dov'" → "dove"). */
  word: string;
  stop: boolean;
  /** A sentence/clause boundary (punctuation, emoji, newline) precedes this token. */
  boundary: boolean;
  kind: 'word' | 'number' | 'time';
}

const TOKEN_RE = /(\d{1,2}[:.]\d{2})(?!\d)|([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*)(['’‘`´]?)|([.,;:!?…()"«»[\]\n]|\p{Extended_Pictographic})/gu;

function expand(key: string, elided: boolean, trailing: boolean): string {
  if (elided) return ELISIONS[key] ?? key.slice(0, -1);
  if (trailing) {
    if (TRUNCATIONS[key]) return TRUNCATIONS[key];
    const bare = key.slice(0, -1);
    const last = bare.at(-1) ?? '';
    return bare.length > 2 && GRAVE[last] ? bare.slice(0, -1) + GRAVE[last] : bare; // "perche'" → "perchè"
  }
  return ABBREVIATIONS[key] ?? key;
}

/** Splits a message into word tokens; punctuation and emojis only mark boundaries. Expects NFC text. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let boundary = true;
  for (const m of text.matchAll(TOKEN_RE)) {
    const start = m.index ?? 0;
    if (m[4]) {
      boundary = true;
      continue;
    }
    if (m[1]) {
      tokens.push({ text: m[1], start, end: start + m[1].length, key: m[1], word: m[1], stop: false, boundary, kind: 'time' });
      boundary = false;
      continue;
    }
    const body = m[2];
    const apostrophe = m[3];
    const after = text.charAt(start + m[0].length);
    const elided = !!apostrophe && /\p{L}/u.test(after);
    const surface = body + apostrophe;
    const key = normalizeWord(surface.replace(/['’‘`´]$/, "'"));
    const word = expand(key, elided, !!apostrophe && !elided);
    tokens.push({
      text: surface,
      start,
      end: start + surface.length,
      // Truncations are not elisions: their key is the expanded word ("po'" → "poco").
      key: apostrophe && !elided ? word : ABBREVIATIONS[key] ? word : key,
      word,
      stop: isStopword(elided ? key : word),
      boundary,
      kind: /^\d+$/.test(body) ? 'number' : 'word',
    });
    boundary = false;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Inflection heuristics (validated against the index by the caller)
// ---------------------------------------------------------------------------

const IRREGULAR_PLURALS: Record<string, string> = {
  uova: 'uovo', uomini: 'uomo', dita: 'dito', braccia: 'braccio', ginocchia: 'ginocchio', labbra: 'labbro',
  ossa: 'osso', mani: 'mano', dei: 'dio', buoi: 'bue', amici: 'amico', amiche: 'amica', medici: 'medico',
};

/** Candidate base forms (singular / masculine) of a noun or adjective, most likely first. */
export function baseForms(w: string): string[] {
  if (w.length < 3) return [];
  const out: string[] = [];
  const push = (s: string) => s !== w && s.length > 1 && !out.includes(s) && out.push(s);
  if (IRREGULAR_PLURALS[w]) push(IRREGULAR_PLURALS[w]);
  const stem = w.slice(0, -1);
  if (w.endsWith('chi')) push(w.slice(0, -3) + 'co');
  if (w.endsWith('ghi')) push(w.slice(0, -3) + 'go');
  if (w.endsWith('che')) push(w.slice(0, -3) + 'ca');
  if (w.endsWith('ghe')) push(w.slice(0, -3) + 'ga');
  if (w.endsWith('ci') || w.endsWith('gi')) push(stem + 'o');
  if (w.endsWith('ie')) push(stem + 'a');
  switch (w.at(-1)) {
    case 'i':
      push(stem + 'o');
      push(stem + 'e');
      push(stem + 'a');
      push(stem + 'io');
      break;
    case 'e':
      push(stem + 'a');
      push(stem + 'o');
      break;
    case 'a':
      push(stem + 'o');
      push(stem + 'e');
      break;
    case 'o':
      push(stem + 'a');
      break;
  }
  return out;
}

const ENCLITIC = /^(.+?)(glielo|gliela|glieli|gliele|gliene|melo|mela|telo|tela|celo|cela|cene|mene|tene|mi|ti|si|ci|vi|lo|la|li|le|ne|gli)$/;

/** "lavarmi" → { base: "lavare", clitic: "mi" }, "dimmi" → { base: "di", clitic: "mi" } (imperative). */
export function splitEnclitic(w: string): { base: string; clitic: string } | null {
  const m = ENCLITIC.exec(w);
  if (!m || m[1].length < 2) return null;
  let base = m[1];
  const clitic = m[2];
  if (/[aei]r$/.test(base)) base += 'e'; // infinitive without final -e
  else if (base.length > 2 && base.at(-1) === clitic[0]) base = base.slice(0, -1); // dimmi, fammi → di, fa
  return { base, clitic };
}

/** "ciaooo" → "ciao", "siiii" → "si". */
export const collapseRepeats = (w: string): string => w.replace(/(\p{L})\1{2,}/gu, '$1');

/** "lavare" → "lavarsi"; "porre" → "porsi". */
export const reflexiveOf = (inf: string): string => inf.replace(/e$/, '') + 'si';
/** "lavarsi" → "lavare". */
export const nonReflexiveOf = (inf: string): string | null => (/rsi$/.test(inf) ? inf.slice(0, -2) + 'e' : null);
