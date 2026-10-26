# Design system

Screens style themselves **only** with the CSS variables below and the primitives in
`@/components/ui`. Never hard-code colors, font sizes or touch sizes.

```tsx
// main.tsx
<ThemeProvider>{/* router */}</ThemeProvider>
```

`ThemeProvider` reads `useSettings()`, imports `src/styles/global.css`, injects the theme
variable blocks, sets the `<html>` attributes, wraps antd `ConfigProvider` (it_IT, synced
tokens, `cssVar`) + antd `App` + motion `MotionConfig`. Use `App.useApp()` for `message`/`modal`.

## Files

| File | What |
| --- | --- |
| `palettes.ts` | Raw colors of every theme — single source for CSS vars **and** antd tokens |
| `themes.ts` | `THEMES`, `getTheme`, `resolveThemeId`, CSS generation, `solidPalette` |
| `accent.ts` | `ACCENT_PRESETS` + accent override derivation (text colors chosen by contrast) |
| `antd.ts` | `buildAntdTheme(palette, runtime)` |
| `a11y.ts` | `A11yPrefs`, `TAP_SIZES`, `PICTO_SIZES`, `useMediaQuery` |
| `context.ts` | `useResolvedTheme`, `useReducedMotion`, `useA11yPrefs`, `useThemeState` |
| `contrast.test.ts` | WCAG checks of every pair (`npx vitest run src/theme --reporter=verbose` prints ratios) |
| `Showcase.tsx` | Dev page (`/dev/showcase`), `?theme=<id>&stress=1&accent=<hex>&reset=1` |
| `src/styles/*` | fonts, tokens, base/reset, glass material, antd overrides |

## Themes

`light` Chiaro · `dark` Scuro · `liquid-glass` Vetro · `liquid-glass-dark` Vetro scuro ·
`calm` Calmo (pastel, no shadows, low stimulation) · `high-contrast` (black/white/yellow, 2px
borders). `'system'` → light/dark. All text pairs pass WCAG AA (tested, including the worst
backdrop colour under glass and the lowest glass tint).

## `<html>` attributes (set by the provider)

`data-theme` · `data-mode` light|dark · `data-glass` true|false · `data-refraction` ·
`data-motion` reduce|full · `data-transparency` · `data-font` dyslexic|default ·
`data-uppercase` · `data-spacing` normal|wide|wider · `data-leading` normal|relaxed|loose ·
`data-bold` · `data-touch` comfortable|large|xl · `data-category-colors`.
Inline: `--font-scale`, glass intensity vars, accent override vars.

## Tokens

- **Color**: `--bg` (transparent in glass themes: never paint a page with `--bg-solid`),
  `--bg-solid`, `--bg-elevated`, `--bg-sunken`, `--surface`, `--surface-glass`, `--glass-overlay`,
  `--border`, `--separator`, `--border-width`, `--text`, `--text-secondary`, `--text-tertiary`
  (all AA — still use sparingly), `--accent`, `--accent-text` (accent usable as text/links),
  `--accent-soft`, `--accent-strong`, `--accent-glass` + `--text-on-accent-glass`,
  `--text-on-accent`, `--danger`, `--danger-soft`, `--success`, `--warning`, `--focus-ring`,
  `--scrim`, `--skeleton`, `--bubble-{out,in}-{bg,text}`, `--cat-{person,verb,noun,adjective,social,place,time,misc}`.
- **Type**: `--font-body`, `--fs-xs…xxl` (14/16/18/21/25/31 px × `--font-scale`, 0.85–1.8),
  `--fw-body|strong|heavy`, `--lh-body|tight`, `--ls`, `--ws`.
- **Space/shape**: `--space-1…7` (4/8/12/16/24/32/48), `--gutter`, `--radius-sm|md|lg|xl|pill`,
  `--shadow-1|2`, `--tap-min` (48/56/68), `--tap-gap`, `--safe-top|right|bottom|left`.
- **Motion**: `--ease-spring`, `--ease-out`, `--ease-in-out`, `--dur-fast|med|slow` (≈0 with reduced motion).
- **Pictogram cards**: `--tile-bg` (always white), `--tile-text`, `--tile-border`.

## Liquid Glass

`.pc-glass` = tint (`--surface-glass`) + `backdrop-filter: blur() saturate()` + specular rim
(`::before`, masked gradient border) + top sheen (`::after`) — so the element must be positioned
and must not use its own pseudo-elements. `.pc-glass--overlay` uses the denser `--glass-overlay`
tint for anything floating over content (bars, sheets, antd overlays): it passes AA even over
pure black/white content. `.pc-glass--lens` adds SVG refraction (`#pc-refract`, feTurbulence +
feDisplacementMap) on Chromium only; Safari/Firefox get blur-only. `.pc-glass-accent` = tinted
glass fill. Reduced transparency (setting or OS) → `data-glass="false"` → opaque palette.
Reduced motion → static backdrop. `glassIntensity` scales blur, tint alpha and refraction.

## Rules for screens

- Pages: `<PageScaffold header={<NavHeader/>} footer={<TabBar/> | <GlassBar position="bottom"/>}>`.
- Touch targets ≥ `var(--tap-min)`; gaps between targets `var(--tap-gap)`.
- Text must survive fontScale 1.8 + STAMPATELLO + wider spacing + xl touch (try `?stress=1`):
  in flex rows give text `min-width: 0` and the control `flex-shrink: 0`; let text wrap
  (no fixed heights, no `white-space: nowrap` on content). Tab labels: max 4 tabs, ≤ 12 letters.
- STAMPATELLO is display-only (`text-transform`), inputs included; add `.pc-keep-case`
  where case matters (email/url/password are excluded automatically).
- Pictograms always on `PictoTile` (white card). Chat bubbles use `--bubble-*`.
- Colors from `--cat-*` are decorative edges, never text.
- Preview another theme in a subtree with `data-theme-scope="<id>"` (theme picker cards).
