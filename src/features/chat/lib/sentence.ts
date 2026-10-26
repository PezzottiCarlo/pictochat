/**
 * Turns a row of chosen pictograms into a natural Italian sentence.
 *
 * Deliberately simple heuristics (the receiver also sees the pictograms, so a slightly
 * clumsy sentence is fine, a wrong one is not):
 *  - a subject (people) right before the first verb conjugates it in the present tense;
 *    without a subject the verb stays in the infinitive;
 *  - following verbs stay infinitive ("voglio mangiare");
 *  - lists of things are joined with "e" ("pizza e gelato");
 *  - a few fixed prepositions ("vado a casa", "voglio bene a te");
 *  - question words add a "?"; the first letter is capitalised.
 */

export interface SentencePart {
  /** Pictogram word (lowercase label). */
  word: string;
  /** Composer category id ('persone', 'verbi', 'cibo', …). */
  category?: string;
}

/** 1s, 2s, 3s, 1p, 2p, 3p. */
type Person = 0 | 1 | 2 | 3 | 4 | 5;
type Paradigm = readonly [string, string, string, string, string, string];

const IRREGULAR: Record<string, Paradigm> = {
  essere: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
  avere: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
  fare: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'],
  dire: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'],
  potere: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'],
  andare: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'],
  venire: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'],
  dare: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'],
  sapere: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'],
  volere: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'],
  dovere: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono'],
  stare: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'],
  bere: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'],
  uscire: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'],
  piacere: ['piaccio', 'piaci', 'piace', 'piacciamo', 'piacete', 'piacciono'],
  rimanere: ['rimango', 'rimani', 'rimane', 'rimaniamo', 'rimanete', 'rimangono'],
  tenere: ['tengo', 'tieni', 'tiene', 'teniamo', 'tenete', 'tengono'],
  salire: ['salgo', 'sali', 'sale', 'saliamo', 'salite', 'salgono'],
  scegliere: ['scelgo', 'scegli', 'sceglie', 'scegliamo', 'scegliete', 'scelgono'],
  sedere: ['siedo', 'siedi', 'siede', 'sediamo', 'sedete', 'siedono'],
};

/** -ire verbs that take -isc- (capisco, finisco…). */
const ISC = new Set([
  'capire',
  'finire',
  'pulire',
  'preferire',
  'spedire',
  'costruire',
  'colpire',
  'unire',
  'agire',
  'ubbidire',
  'obbedire',
  'stupire',
  'sparire',
  'suggerire',
  'guarire',
  'impedire',
  'fiorire',
  'gestire',
  'restituire',
  'favorire',
  'definire',
  'distribuire',
  'reagire',
  'tradire',
  'zittire',
]);

const REFLEXIVE_CLITICS: Paradigm = ['mi', 'ti', 'si', 'ci', 'vi', 'si'];
/** Indirect pronoun for "piacere": io → "mi piace". */
const DATIVE_CLITICS: Record<string, string> = {
  io: 'mi',
  tu: 'ti',
  lui: 'gli',
  lei: 'le',
  noi: 'ci',
  voi: 'vi',
  loro: 'gli',
};
/** Pronoun used as an object after the verb: "aiuto te". */
const TONIC: Record<string, string> = { io: 'me', tu: 'te' };

const PRONOUN_PERSON: Record<string, Person> = {
  io: 0,
  tu: 1,
  lui: 2,
  lei: 2,
  noi: 3,
  voi: 4,
  loro: 5,
};

const QUESTION_WORDS = new Set([
  'dove',
  'cosa',
  'che cosa',
  'chi',
  'quando',
  'perché',
  'perchè',
  'come',
  'quanto',
  'quanti',
  'quale',
]);

/** Categories whose items are "things" that can be listed with "e". */
const THING_CATEGORIES = new Set(['cibo', 'oggetti', 'tempo-libero', 'scuola', 'luoghi']);

/** Verbs after which a place takes a preposition ("vado a casa", "sono al parco"). */
const PLACE_VERBS = new Set(['andare', 'venire', 'tornare', 'arrivare', 'stare', 'essere', 'restare', 'rimanere']);
const PLACE_PREPOSITION: Record<string, string> = {
  casa: 'a',
  scuola: 'a',
  letto: 'a',
  lavoro: 'al',
  parco: 'al',
  mare: 'al',
  cinema: 'al',
  bar: 'al',
  ristorante: 'al',
  supermercato: 'al',
  negozio: 'al',
  museo: 'al',
  'parco giochi': 'al',
  'campo da calcio': 'al',
  stadio: 'allo',
  zoo: 'allo',
  stazione: 'alla',
  "fermata dell'autobus": 'alla',
  mensa: 'in',
  piscina: 'in',
  palestra: 'in',
  montagna: 'in',
  ospedale: 'in',
  bagno: 'in',
  cucina: 'in',
  pizzeria: 'in',
  spiaggia: 'in',
  chiesa: 'in',
  città: 'in',
  farmacia: 'in',
  biblioteca: 'in',
  giardino: 'in',
  classe: 'in',
  piazza: 'in',
  aeroporto: "all'",
  'camera da letto': 'in',
  soggiorno: 'in',
  'centro commerciale': 'al',
  dentista: 'dal',
};
/** "gioco a calcio". */
const GAME_PREPOSITION: Record<string, string> = {
  calcio: 'a',
  tennis: 'a',
  pallavolo: 'a',
  pallacanestro: 'a',
  carte: 'a',
  nascondino: 'a',
  videogioco: 'al',
};
/** Verbs whose person-object takes "a": "voglio bene a mamma". */
const DATIVE_VERBS = new Set(['volere bene', 'telefonare', 'dire', 'dare', 'scrivere', 'parlare']);

const clean = (w: string) => w.normalize('NFC').trim().replace(/\s+/g, ' ');
const lower = (w: string) => clean(w).toLowerCase();

/** "a", "a, b e c". */
export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`;
}

/** Present tense of an infinitive (single word or "volere bene"); unknown words are returned unchanged. */
export function conjugate(verb: string, person: Person): string {
  const v = lower(verb);
  const [head, ...rest] = v.split(' ');
  const tail = rest.length ? ` ${rest.join(' ')}` : '';

  if (/rsi$/.test(head)) {
    const base = conjugateSingle(head.slice(0, -2) + 'e', person);
    return base ? `${REFLEXIVE_CLITICS[person]} ${base}${tail}` : v;
  }
  const form = conjugateSingle(head, person);
  return form ? form + tail : v;
}

function conjugateSingle(inf: string, p: Person): string | null {
  const irregular = IRREGULAR[inf];
  if (irregular) return irregular[p];
  const m = /^(.+)(are|ere|ire)$/.exec(inf);
  if (!m) return null;
  const [, stem, ending] = m;
  if (ending === 'are') {
    // giocare → giochi; studiare → studi (no double i); mangiare → mangiamo.
    const hard = /[cg]$/.test(stem) ? `${stem}h` : stem;
    const soft = stem.endsWith('i') ? stem.slice(0, -1) : hard;
    return [`${stem}o`, `${soft}i`, `${stem}a`, `${soft}iamo`, `${stem}ate`, `${stem}ano`][p];
  }
  if (ending === 'ere') return [`${stem}o`, `${stem}i`, `${stem}e`, `${stem}iamo`, `${stem}ete`, `${stem}ono`][p];
  if (ISC.has(inf))
    return [`${stem}isco`, `${stem}isci`, `${stem}isce`, `${stem}iamo`, `${stem}ite`, `${stem}iscono`][p];
  return [`${stem}o`, `${stem}i`, `${stem}e`, `${stem}iamo`, `${stem}ite`, `${stem}ono`][p];
}

/** Grammatical person of a subject made of one or more people. */
export function personOf(subjects: string[]): Person {
  const words = subjects.map(lower);
  if (words.length === 1) return PRONOUN_PERSON[words[0]] ?? 2;
  if (words.includes('io') || words.includes('noi')) return 3;
  if (words.includes('tu') || words.includes('voi')) return 4;
  return 5;
}

const isVerb = (p: SentencePart) => p.category === 'verbi';
const isPerson = (p: SentencePart) => p.category === 'persone';
const isThing = (p: SentencePart) => !!p.category && THING_CATEGORIES.has(p.category);

/** Contiguous run of people ending right before `end` (exclusive). */
function subjectRunBefore(parts: SentencePart[], end: number): number {
  let start = end;
  while (start > 0 && isPerson(parts[start - 1])) start--;
  return start;
}

function subjectRunAfter(parts: SentencePart[], start: number): number {
  let end = start;
  while (end < parts.length && isPerson(parts[end])) end++;
  return end;
}

export function buildSentence(input: SentencePart[]): string {
  const parts = input.map((p) => ({ ...p, word: clean(p.word) })).filter((p) => p.word);
  if (!parts.length) return '';

  const verbAt = parts.findIndex(isVerb);
  const isQuestion = QUESTION_WORDS.has(lower(parts[0].word));

  // Subject: people right before the verb, or right after it in questions ("dove è mamma?").
  let subject: [number, number] | null = null;
  if (verbAt >= 0) {
    const start = subjectRunBefore(parts, verbAt);
    if (start < verbAt) subject = [start, verbAt];
    else if (isQuestion) {
      const end = subjectRunAfter(parts, verbAt + 1);
      if (end > verbAt + 1) subject = [verbAt + 1, end];
    }
  }

  const out: string[] = [];
  let lastVerb: string | null = null;
  let things: string[] = [];
  const flushThings = () => {
    if (things.length) out.push(joinList(things));
    things = [];
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const word = part.word;

    if (subject && i === subject[0]) {
      flushThings();
      const names = parts.slice(subject[0], subject[1]).map((p) => p.word);
      i = subject[1] - 1;
      // The subject after the verb (question) is emitted where it stands; before the verb it leads.
      if (verbAt >= 0 && lower(parts[verbAt].word) === 'piacere' && subject[0] < verbAt) {
        const clitic = names.length === 1 ? DATIVE_CLITICS[lower(names[0])] : undefined;
        out.push(clitic ?? `a ${joinList(names)}`);
      } else {
        out.push(joinList(names));
      }
      continue;
    }

    if (isVerb(part)) {
      flushThings();
      const inf = lower(word);
      if (i === verbAt && subject) {
        const person =
          inf === 'piacere' && subject[0] < verbAt
            ? 2
            : personOf(parts.slice(subject[0], subject[1]).map((p) => p.word));
        out.push(conjugate(inf, person));
      } else {
        out.push(word);
      }
      lastVerb = inf;
      continue;
    }

    const key = lower(word);
    if (isPerson(part) && lastVerb) {
      // Person as an object: "aiuto te", "voglio bene a mamma".
      flushThings();
      const tonic = TONIC[key] ?? word;
      out.push(DATIVE_VERBS.has(lastVerb) ? `a ${tonic}` : tonic);
      continue;
    }

    if (isThing(part)) {
      const placePrep = lastVerb && PLACE_VERBS.has(lastVerb) ? PLACE_PREPOSITION[key] : undefined;
      const gamePrep = lastVerb === 'giocare' ? GAME_PREPOSITION[key] : undefined;
      const prep = placePrep ?? gamePrep;
      things.push(prep ? (prep.endsWith("'") ? `${prep}${word}` : `${prep} ${word}`) : word);
      continue;
    }

    flushThings();
    out.push(word);
  }
  flushThings();

  let sentence = out.join(' ').replace(/\s+/g, ' ').trim();
  sentence = sentence.charAt(0).toLocaleUpperCase('it') + sentence.slice(1);
  if (isQuestion && !/[?!.]$/.test(sentence)) sentence += '?';
  return sentence;
}
