#!/usr/bin/env node
/**
 * Builds the compact vocabulary used by the AAC engine (src/services/aac).
 *
 *   vocab/raw/*.json + vocab/curated/*.json  ──►  src/data/{pictograms,lemmas,composer,suggestions}.json
 *
 * Run with `npm run vocab`. No dependencies; see vocab/README.md for the format.
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'vocab', 'raw');
const CURATED = join(ROOT, 'vocab', 'curated');
const OUT = join(ROOT, 'src', 'data');

const readJson = (dir, file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

// ---------------------------------------------------------------------------
// Text normalization — MUST stay in sync with src/services/aac/text.ts
// (normalizeWord / keyOf). A unit test checks every generated key is a fixpoint.
// ---------------------------------------------------------------------------

const ACCENTS = { á: 'à', é: 'è', í: 'ì', î: 'ì', ó: 'ò', ú: 'ù' };

function normalizeWord(s) {
  return s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[áéíîóú]/g, (c) => ACCENTS[c])
    .trim();
}

/** Lookup key of a phrase: normalized words, elisions split ("d'acqua" → "d' acqua"). */
function keyOf(phrase) {
  return normalizeWord(phrase)
    .replace(/'(?=\p{L})/gu, "' ")
    .replace(/[^\p{L}\p{N}' -]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const wordCount = (key) => (key ? key.split(' ').length : 0);

// ---------------------------------------------------------------------------
// Composer categories (ids are stable: personal pictograms reference them)
// ---------------------------------------------------------------------------

const CATEGORY_IDS = [
  'persone',
  'verbi',
  'cibo',
  'luoghi',
  'emozioni',
  'tempo',
  'tempo-libero',
  'scuola',
  'oggetti',
  'social',
];

/** ARASAAC tag/category → composer category, checked in this priority order. */
const CATEGORY_RULES = [
  ['verbi', ['verb', 'usual verbs']],
  ['social', ['polite set expression', 'adverb of affirmation', 'adverb of denial', 'expression', 'interjection']],
  ['emozioni', ['emotion', 'feeling']],
  ['cibo', ['food', 'feeding', 'beverage', 'dessert', 'gastronomy', 'fruit', 'vegetable']],
  ['persone', ['family', 'personal pronoun', 'person', 'person according to their age']],
  ['tempo', ['time', 'unit of time', 'day time', 'adverb of time', 'calendar', 'meteorology']],
  ['luoghi', ['place', 'building', 'room', 'facility', 'recreational facility', 'adverb of place', 'educational building']],
  ['scuola', ['education', 'educational material', 'educational task', 'work', 'professional']],
  ['tempo-libero', ['leisure', 'sport', 'toy', 'music', 'show', 'game', 'outdoor activity', 'mass media']],
  ['oggetti', ['object', 'clothes', 'tool', 'utensil', 'appliance', 'furniture', 'hygiene product', 'household', 'accessories']],
];

function categoryOf(p) {
  if (p.category) return p.category; // curated extra
  const labels = new Set([...(p.tags ?? []), ...(p.categories ?? [])].map((t) => t.replace(/^core vocabulary-/, '')));
  for (const [id, tags] of CATEGORY_RULES) if (tags.some((t) => labels.has(t))) return id;
  return null;
}

// ---------------------------------------------------------------------------
// 1. Pictogram index
// ---------------------------------------------------------------------------

function buildPictograms(curated) {
  const raw = readJson(RAW, 'result.json');
  /** id → pictogram (result.json repeats each pictogram once per keyword). */
  const byId = new Map();
  for (const p of raw) if (!byId.has(p._id)) byId.set(p._id, p);
  // Curated extras: everyday words missing from the dump, ids verified on api.arasaac.org.
  for (const x of curated.extraPictograms) {
    if (byId.has(x.id)) continue;
    byId.set(x.id, {
      _id: x.id, skin: x.skin, hair: x.hair, aac: true, schematic: false, category: x.category, tags: [], categories: [],
      keywords: [x.label, ...x.keys.filter((k) => k !== x.label)].map((keyword) => ({ keyword })),
    });
  }

  const excluded = [...byId.values()].filter((p) => p.sex || p.violence).length;
  const pictos = [...byId.values()].filter((p) => !p.sex && !p.violence);

  /** key → best { id, score } */
  const best = new Map();
  const offer = (key, id, score) => {
    if (!key || key.length > 48 || wordCount(key) > 4) return;
    const cur = best.get(key);
    if (!cur || score > cur.score || (score === cur.score && id < cur.id)) best.set(key, { id, score });
  };

  for (const p of pictos) {
    const core = (p.categories ?? []).some((c) => c.startsWith('core vocabulary')) || (p.tags ?? []).includes('core vocabulary');
    const base = (p.aac ? 3 : 0) + (p.schematic ? 1 : 0) + (core ? 2 : 0);
    p.keywords.forEach((k, i) => {
      const pos = i === 0 ? 3 : i === 1 ? 1.5 : 0;
      const proper = k.type === 1 ? -2 : 0;
      offer(keyOf(k.keyword), p._id, base + pos + proper);
      if (k.plural) offer(keyOf(k.plural), p._id, base + pos + proper - 0.5);
    });
  }

  // Aliases: words with no pictogram of their own borrow the closest one ("sera" → "notte").
  const badAliases = [];
  for (const [alias, target] of Object.entries(curated.aliases)) {
    const hit = best.get(keyOf(target));
    if (!hit) badAliases.push(`${alias}→${target}`);
    else if (!best.has(keyOf(alias))) best.set(keyOf(alias), { id: hit.id, score: -1 });
  }

  return { byId, pictos, best, excluded, badAliases, rawCount: raw.length };
}

// ---------------------------------------------------------------------------
// 2. Lemma index (verb forms → infinitive), paradigm-compressed
// ---------------------------------------------------------------------------

const PRONOUN = /^(io|tu|lui\/lei|lui|lei|noi|voi|loro)\s+/;

/** Expands "gi(u)oco", "andato/a/i/e", "va, vai, va'" into plain single forms. */
function expandForm(form) {
  const out = [];
  for (let alt of form.split(',')) {
    alt = alt.trim().replace(PRONOUN, '').replace(/'$/, '');
    if (!alt || alt.includes('—') || alt.endsWith(':')) continue;
    const opt = alt.match(/^(.*)\((\p{L}+)\)(.*)$/u);
    const variants = opt ? [opt[1] + opt[3], opt[1] + opt[2] + opt[3]] : [alt];
    for (const v of variants) {
      const slash = v.match(/^([^/]*\p{L})\/(\p{L}(?:\/\p{L})*)$/u); // "stato/a/i/e", "andati/e"
      if (slash) {
        const stem = slash[1].slice(0, -1);
        out.push(slash[1], ...slash[2].split('/').map((end) => stem + end));
      } else out.push(v);
    }
  }
  return out.map(normalizeWord);
}

function lcp(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** Archaic duplicates (facere, bevere…) and vulgar verbs that would only add noise. */
const EXCLUDED_VERBS = new Set(['facere', 'bevere', 'dicere', 'caminare', 'addire', 'ponere', 'sborrare', 'fottere', 'cagare', 'incazzare', 'scazzare']);

function buildLemmas(pictoKeys) {
  const all = readJson(RAW, 'verbs_conjugated.json');
  // usage ≥ 400 keeps ~1.9k everyday verbs (17.8k in the dump, most with usage < 10);
  // rarer verbs are kept only when ARASAAC has a pictogram for them.
  const MIN_USAGE = 400;
  const MIN_USAGE_WITH_PICTO = 20;
  const kept = all.filter(
    (e) =>
      !EXCLUDED_VERBS.has(e.verb) &&
      (e.usage >= MIN_USAGE || (e.usage >= MIN_USAGE_WITH_PICTO && pictoKeys.has(normalizeWord(e.verb)))),
  );
  kept.sort((a, b) => b.usage - a.usage);

  const paradigms = new Map();
  const verbs = [];
  let formCount = 0;

  for (const entry of kept) {
    const inf = normalizeWord(entry.verb);
    /** form → kind: '' finite/infinitive, '*' past participle, '~' gerund */
    const forms = new Map();
    const add = (f, kind) => {
      if (!f || f.includes(' ') || f === inf) return;
      if (!forms.has(f) || kind) forms.set(f, kind);
    };

    for (const [tense, list] of Object.entries(entry.conjugations)) {
      const isCompound = /PASSATO PROSSIMO|TRAPASSATO|ANTERIORE|^PASSATO$|^Passato$/.test(tense);
      list.forEach((raw, i) => {
        const words = raw.trim().replace(PRONOUN, '');
        if (isCompound) {
          // "sono andato/a" → participle is the last word
          const last = words.split(/\s+/).pop() ?? '';
          for (const f of expandForm(last)) add(f, '*');
          return;
        }
        if (words.includes(' ')) return; // compound infinitive / gerund
        const forms0 = expandForm(words);
        if (tense === 'PRESENTE' && i >= 18) {
          // tail of PRESENTE: infinitive, present participle, past participle, gerund
          for (const f of forms0) {
            if (/ndo$/.test(f)) add(f, '~');
            else if (/nte$/.test(f)) continue; // present participle: mostly used as noun/adjective
            else if (f !== inf) add(f, '*');
          }
          return;
        }
        for (const f of forms0) add(f, '');
      });
    }

    const tokens = [...forms]
      .map(([f, kind]) => {
        const keep = lcp(inf, f);
        return `${kind}${inf.length - keep}${f.slice(keep)}`;
      })
      .sort();
    formCount += tokens.length;
    const key = tokens.join(' ');
    if (!paradigms.has(key)) paradigms.set(key, paradigms.size);
    verbs.push([inf, paradigms.get(key)]);
  }

  return { verbs, paradigms: [...paradigms.keys()], formCount, total: all.length };
}

// ---------------------------------------------------------------------------
// 3. Composer data
// ---------------------------------------------------------------------------

function buildComposer(ctx, curated) {
  const subjects = readJson(RAW, 'subjects.json');
  const rawVerbs = readJson(RAW, 'verbs.json');
  const wwp = readJson(RAW, 'words_with_pictograms.json');
  const missing = [];

  const ref = (word, id) => {
    word = curated.rename?.[word] ?? word;
    if (id != null && ctx.byId.has(id)) return ctx.use(id, word);
    const hit = ctx.best.get(keyOf(word));
    if (hit) return ctx.use(hit.id, word);
    missing.push(word);
    return null;
  };
  const dedupe = (list) => {
    const seen = new Set();
    return list.filter((r) => r && !seen.has(r[0]) && seen.add(r[0]));
  };

  const verbList = dedupe([
    ...rawVerbs.filter((v) => !curated.excludeVerbs.includes(v.word)).map((v) => ref(v.word, v._id)),
    ...curated.extraVerbs.map((w) => ref(w)),
  ]);

  const objects = {};
  for (const [verb, list] of Object.entries(wwp)) {
    if (curated.excludeVerbs.includes(verb)) continue;
    objects[verb] = dedupe(list.map((o) => {
      const [word, p] = Object.entries(o)[0];
      return ref(word, p._id);
    }));
  }
  for (const [verb, words] of Object.entries(curated.verbObjects)) {
    objects[verb] = dedupe([...(objects[verb] ?? []), ...words.map((w) => ref(w))]);
  }

  // Category lists: curated seeds first, then the best core-vocabulary pictograms of that category.
  const categories = {};
  const CAP = 120;
  for (const id of CATEGORY_IDS) {
    if (id === 'verbi') continue;
    const seeds = [
      ...(id === 'persone' ? subjects.map((s) => ref(s.word, s._id)) : []),
      ...(curated.categories[id] ?? []).map((w) => ref(w)),
    ];
    const auto = ctx.pictos
      .filter((p) => ctx.cat.get(p._id) === id && ctx.wins.has(p._id))
      .map((p) => {
        const core = (p.categories ?? []).some((c) => c.startsWith('core vocabulary'));
        const primary = keyOf(p.keywords[0].keyword);
        const simple = wordCount(primary) === 1 ? 1 : 0;
        return { p, primary, score: (core ? 4 : 0) + (p.aac ? 2 : 0) + simple };
      })
      .filter((x) => x.score >= 4 && ctx.best.get(x.primary)?.id === x.p._id)
      .sort((a, b) => b.score - a.score || a.p._id - b.p._id)
      .map((x) => ctx.use(x.p._id, x.p.keywords[0].keyword));
    categories[id] = dedupe([...seeds, ...auto]).slice(0, CAP);
  }

  return { data: { verbs: verbList, objects, categories }, missing };
}

// ---------------------------------------------------------------------------
// 4. Suggestions (curated) — validated against the vocabulary
// ---------------------------------------------------------------------------

function buildSuggestions(ctx) {
  const s = readJson(CURATED, 'suggestions.json');
  const unknown = new Set();
  /** Rough mirror of the runtime matcher: multi-word keys, verb forms, enclitics ("aiutami"). */
  const check = (phrase) => {
    const words = keyOf(phrase).split(' ');
    for (let i = 0; i < words.length; ) {
      let span = 1;
      for (let n = Math.min(4, words.length - i); n >= 2; n--) {
        if (ctx.best.has(words.slice(i, i + n).join(' '))) {
          span = n;
          break;
        }
      }
      const w = words[i];
      i += span;
      if (span > 1 || !w || ctx.stop.has(w) || /'$/.test(w)) continue;
      const host = w.replace(/(mi|ti|ci|vi|si|lo|la|li|le|ne)$/, '');
      if (!ctx.best.has(w) && !ctx.verbForms.has(w) && !ctx.verbForms.has(host)) unknown.add(w);
    }
  };
  for (const p of s.predefined) p.a.forEach(check);
  for (const list of Object.values(s.answers)) list.forEach(check);
  for (const g of s.greetings) g.reply.forEach(check);
  for (const rule of [...s.wh, ...s.statements, ...s.greetings]) new RegExp(rule.re); // fail fast on bad regex
  for (const rule of [...s.wh, ...s.statements]) if (!s.answers[rule.answers]) throw new Error(`unknown answer set ${rule.answers}`);
  return { data: s, unknown: [...unknown].sort() };
}

/** Only used to validate curated phrases (the runtime list lives in src/services/aac/text.ts). */
const FUNCTION_WORDS = 'il lo la i gli le un uno una di a da in con su per tra fra del dello della dei degli delle al allo alla ai agli alle dal dalla dai nel nella nei sul sulla e o ma che non mi ti ci si vi ne'.split(' ');

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function sizeOf(file) {
  const buf = readFileSync(file);
  return { raw: buf.length, gz: gzipSync(buf, { level: 9 }).length };
}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

function main() {
  const t0 = Date.now();
  mkdirSync(OUT, { recursive: true });

  const curated = readJson(CURATED, 'composer.json');
  const P = buildPictograms(curated);
  const pictoKeys = new Set(P.best.keys());

  // pictogram → winning keys (display keyword first)
  const wins = new Map();
  for (const [key, { id }] of P.best) {
    if (!wins.has(id)) wins.set(id, []);
    wins.get(id).push(key);
  }
  const cat = new Map(P.pictos.map((p) => [p._id, categoryOf(p)]));
  /** Ids referenced by composer data must be shipped even if they win no keyword. */
  const used = new Set(wins.keys());
  const ctx = {
    ...P,
    wins,
    cat,
    use: (id, word) => {
      used.add(id);
      return [id, normalizeWord(word)];
    },
  };

  const L = buildLemmas(pictoKeys);
  const verbForms = new Set();
  for (const [inf, pi] of L.verbs) {
    verbForms.add(inf);
    for (const t of L.paradigms[pi].split(" ").filter(Boolean)) {
      const m = t.match(/^[*~]?(\d+)(.*)$/);
      verbForms.add(inf.slice(0, inf.length - Number(m[1])) + m[2]);
    }
  }
  ctx.stop = new Set(FUNCTION_WORDS);
  ctx.verbForms = verbForms;

  const C = buildComposer(ctx, curated);
  const S = buildSuggestions(ctx);

  const items = [...used]
    .sort((a, b) => a - b)
    .map((id) => {
      const p = P.byId.get(id);
      const flags = (p.skin ? 1 : 0) | (p.hair ? 2 : 0);
      const ci = CATEGORY_IDS.indexOf(cat.get(id));
      const keys = (wins.get(id) ?? []).sort((a, b) => a.length - b.length);
      return [id, flags, ci, p.keywords[0].keyword.trim(), keys.join('|')];
    });

  const files = {
    'pictograms.json': { version: 1, categories: CATEGORY_IDS, items },
    'lemmas.json': { version: 1, paradigms: L.paradigms, verbs: L.verbs },
    'composer.json': { version: 1, ...C.data },
    'suggestions.json': { version: 1, ...S.data },
  };
  for (const [name, data] of Object.entries(files)) writeFileSync(join(OUT, name), JSON.stringify(data));

  // --- report ---------------------------------------------------------------
  const line = (s = '') => console.log(s);
  line('PictoChat vocabulary build');
  line(`  pictograms: ${P.rawCount} raw rows → ${P.byId.size} unique, ${P.excluded} excluded (sex/violence), ${items.length} shipped`);
  line(`  keywords:   ${P.best.size} keys (${[1, 2, 3, 4].map((n) => `${n}w:${[...P.best.keys()].filter((k) => wordCount(k) === n).length}`).join(' ')})`);
  line(`  verbs:      ${L.verbs.length}/${L.total} kept, ${L.formCount} forms in ${L.paradigms.length} paradigms, ${verbForms.size} unique forms`);
  line(`  composer:   ${C.data.verbs.length} verbs, ${Object.keys(C.data.objects).length} verb→objects, ` +
    Object.entries(C.data.categories).map(([k, v]) => `${k}:${v.length}`).join(' '));
  line(`  suggestions: ${S.data.predefined.length} predefined Q/A, ${Object.keys(S.data.answers).length} answer sets, ${S.data.wh.length} wh rules, ${S.data.statements.length} statement rules, ${S.data.greetings.length} greetings`);
  if (P.badAliases.length) line(`  ! aliases with unknown target: ${P.badAliases.join(', ')}`);
  if (C.missing.length) line(`  ! composer words without pictogram: ${[...new Set(C.missing)].join(', ')}`);
  if (S.unknown.length) line(`  ! suggestion words not in vocabulary: ${S.unknown.join(', ')}`);
  line();
  let totRaw = 0;
  let totGz = 0;
  for (const name of Object.keys(files)) {
    const { raw, gz } = sizeOf(join(OUT, name));
    totRaw += raw;
    totGz += gz;
    line(`  src/data/${name.padEnd(18)} ${kb(raw).padStart(10)}  (gzip ${kb(gz)})`);
  }
  line(`  ${'total'.padEnd(27)} ${kb(totRaw).padStart(10)}  (gzip ${kb(totGz)})`);
  const rawInputs = ['result.json', 'verbs_conjugated.json', 'words_with_pictograms.json']
    .map((f) => join(RAW, f))
    .filter(existsSync)
    .reduce((n, f) => n + statSync(f).size, 0);
  line(`  raw inputs previously bundled: ${kb(rawInputs)}`);
  line(`  done in ${Date.now() - t0} ms`);
}

main();
