# Vocabulary pipeline

The AAC engine (`src/services/aac`) never reads the raw ARASAAC dumps. `scripts/build-vocab.mjs`
(Node, no dependencies) turns them into four small JSON files in `src/data/`. The app loads those with
dynamic `import()`, so each one becomes its own lazy chunk that the service worker precaches.

```
vocab/raw/*.json  ─┐
                   ├─►  npm run vocab  ─►  src/data/pictograms.json   keyword → ARASAAC pictogram
vocab/curated/*.json ┘                     src/data/lemmas.json       verb form → infinitive
                                           src/data/composer.json     composer verbs / objects / categories
                                           src/data/suggestions.json  reply-suggestion knowledge base
```

Run `npm run vocab` after editing anything in `vocab/`, then commit the regenerated `src/data/*.json`.
The script prints a report with counts, sizes and any curated word that has no pictogram.

## Inputs

| File | Content |
| --- | --- |
| `raw/result.json` | ARASAAC Italian dump (one row per keyword, ~9k unique pictograms) |
| `raw/verbs_conjugated.json` | 17.8k Italian verbs with full conjugation tables and a `usage` frequency |
| `raw/subjects.json`, `raw/verbs.json`, `raw/words_with_pictograms.json` | thesis v1 composer data (subjects, 20 verbs, verb → objects) |
| `raw/predefined_phrases.json`, `raw/categories.json`, `raw/hints.json`, `raw/themes.json` | thesis v1 data, kept for reference only |
| `curated/composer.json` | extra composer verbs, verb → objects, category seed words, aliases (`"sera" → "notte"`), extra pictograms missing from the dump (ids checked on api.arasaac.org) |
| `curated/suggestions.json` | answer sets, wh-question / statement / greeting rules (regex on normalized text) and predefined Q/A |

## Outputs

**`pictograms.json`** — `items: [id, flags, categoryIndex, label, "key1|key2|…"]`.
`flags` bit 1 = has skin, bit 2 = has hair (only those get colors in the image URL). Each normalized
keyword (1–4 words, plurals included) is assigned to the single best pictogram: AAC-flagged (+3),
core vocabulary (+2), schematic (+1), keyword is the pictogram's primary one (+3), proper names (−2).
Sexual/violent pictograms are dropped. Category hints map ARASAAC tags to composer categories.

**`lemmas.json`** — verbs with usage ≥ 400 (plus rarer ones that have a pictogram), ~2.1k verbs and
~83k forms. Forms are paradigm-compressed: each form is stored as `[kind]<chars dropped from the
infinitive><suffix>` (`mangiare` + `3o` → `mangio`, `*` = past participle, `~` = gerund), and verbs with
identical patterns share one paradigm (180 in total). Pronouns are stripped, `stato/a/i/e` and
`gi(u)oco` are expanded, compound tenses contribute their participle. The engine joins auxiliary +
participle (`ho mangiato`, `sono già andata`) and `stare` + gerund at runtime.

**`composer.json`** — `verbs`, `objects` (verb → `[id, word]`) and `categories` (category → `[id, word]`,
curated seeds first, then the best core-vocabulary pictograms of that category, max 120).

**`suggestions.json`** — the curated file, validated (regexes compile, answer sets exist, words have pictograms).

## Text normalization

Keys are built with `keyOf()`: NFC, lowercase, acute accents folded to grave (`perché` → `perchè`),
straight apostrophes, elisions split (`d'acqua` → `d' acqua`), punctuation removed. The same function
lives in `src/services/aac/text.ts`; a unit test fails if a generated key is not a fixpoint of it.

## Sizes

| | before (v1, bundled) | after (v2, lazy) |
| --- | --- | --- |
| verbs | 61.2 MB | 72 KB (13.5 KB gzip) |
| pictograms | 8.3 MB | 427 KB (133 KB gzip) |
| composer + suggestions | 0.6 MB | 34 KB (11 KB gzip) |
