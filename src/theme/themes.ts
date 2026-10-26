import { ensureContrast, mix, over, toHex, withAlpha } from './color';
import type { ThemeDefinition } from './contract';
import { buildAntdTheme } from './antd';
import { PALETTES, type Palette, type ThemeKey } from './palettes';

const META: Record<ThemeKey, { label: string; description: string }> = {
  light: { label: 'Chiaro', description: 'Pulito e luminoso, per tutti i giorni.' },
  dark: { label: 'Scuro', description: 'Riposa gli occhi, ideale la sera.' },
  'liquid-glass': {
    label: 'Vetro',
    description: 'Pannelli trasparenti come vetro, sopra uno sfondo colorato.',
  },
  'liquid-glass-dark': { label: 'Vetro scuro', description: 'Il vetro, nella versione scura.' },
  calm: {
    label: 'Calmo',
    description: 'Colori tenui e pochi stimoli, per chi è sensibile a luci e colori.',
  },
  'high-contrast': {
    label: 'Alto contrasto',
    description: 'Nero, bianco e giallo con bordi spessi: massima leggibilità.',
  },
};

export const THEME_ORDER: ThemeKey[] = ['light', 'dark', 'liquid-glass', 'liquid-glass-dark', 'calm', 'high-contrast'];

export const THEMES: ThemeDefinition[] = THEME_ORDER.map((id) => {
  const p: Palette = PALETTES[id];
  const solid = (c: string) => toHex(over(c, p.bgSolid));
  return {
    id,
    ...META[id],
    mode: p.mode,
    glass: Boolean(p.glass),
    preview: {
      background: p.glass ? p.glass.blobs[0] : p.bgSolid,
      surface: solid(p.surface),
      accent: p.accent,
    },
    antd: buildAntdTheme(p),
  };
});

/** Label for the 'system' option in the theme picker. */
export const SYSTEM_THEME = { id: 'system', label: 'Automatico', description: 'Chiaro o scuro come il telefono.' };

export function getTheme(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function getPalette(id: string): Palette {
  return (PALETTES as Record<string, Palette>)[id] ?? PALETTES.light;
}

/** 'system' → light/dark; unknown ids → light. */
export function resolveThemeId(id: string, prefersDark: boolean): ThemeKey {
  if (id === 'system') return prefersDark ? 'dark' : 'light';
  return id in PALETTES ? (id as ThemeKey) : 'light';
}

/** Every CSS variable a palette defines (colors, radii, shadows, glass). */
export function paletteVars(p: Palette): Record<string, string> {
  const solidBg = toHex(over(p.bgSolid, '#ffffff'));
  const g = p.glass;
  return {
    '--bg': p.bg,
    '--bg-solid': p.bgSolid,
    '--bg-elevated': p.bgElevated,
    '--bg-sunken': p.bgSunken,
    '--surface': p.surface,
    '--surface-glass': p.surfaceGlass,
    '--border': p.border,
    '--separator': p.separator,
    '--border-width': p.borderWidth,
    '--text': p.text,
    '--text-secondary': p.textSecondary,
    '--text-tertiary': p.textTertiary,
    '--text-on-accent': p.textOnAccent,
    '--accent': p.accent,
    '--accent-text': ensureContrast(p.accent, solidBg, 4.6),
    '--accent-soft': p.accentSoft,
    '--accent-strong': mix(p.accent, p.mode === 'dark' ? '#ffffff' : '#000000', 0.14),
    '--accent-glass': p.accentGlass,
    '--text-on-accent-glass': p.textOnAccentGlass,
    '--focus-ring': p.borderWidth === '2px' ? p.accent : p.mode === 'dark' ? mix(p.accent, '#ffffff', 0.2) : ensureContrast(p.accent, solidBg, 3),
    '--danger': p.danger,
    '--danger-soft': p.glass ? withAlpha(p.danger, 0.14) : mix(solidBg, p.danger, p.mode === 'dark' ? 0.2 : 0.12),
    '--success': p.success,
    '--warning': p.warning,
    '--bubble-out-bg': p.bubbleOutBg,
    '--bubble-out-text': p.bubbleOutText,
    '--bubble-in-bg': p.bubbleInBg,
    '--bubble-in-text': p.bubbleInText,
    ...Object.fromEntries(Object.entries(p.cat).map(([k, v]) => [`--cat-${k}`, v])),
    '--radius-sm': `${p.radius.sm}px`,
    '--radius-md': `${p.radius.md}px`,
    '--radius-lg': `${p.radius.lg}px`,
    '--radius-xl': `${p.radius.xl}px`,
    '--shadow-1': p.shadow1,
    '--shadow-2': p.shadow2,
    '--scrim': p.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 25, 35, 0.38)',
    '--skeleton': p.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 35, 50, 0.07)',
    '--glass-overlay': g ? withAlpha(g.tint, (g.overlayAlphaMax + g.overlayAlphaMin) / 2) : p.surface,
    '--glass-blur': g ? '24px' : '0px',
    '--glass-saturation': g ? '180%' : '100%',
    '--glass-tint': g ? g.tint : p.surface,
    '--glass-highlight': g ? g.highlight : 'transparent',
    '--glass-border': g ? g.border : p.border,
    '--backdrop-base': g ? g.backdropBase : p.bgSolid,
    '--blob-1': g ? g.blobs[0] : 'transparent',
    '--blob-2': g ? g.blobs[1] : 'transparent',
    '--blob-3': g ? g.blobs[2] : 'transparent',
    '--blob-4': g ? g.blobs[3] : 'transparent',
  };
}

/** Opaque version of a glass palette, used when transparency is reduced. */
export function solidPalette(p: Palette): Palette {
  if (!p.glass) return p;
  const s = (c: string) => toHex(over(c, p.bgSolid));
  return {
    ...p,
    bg: p.bgSolid,
    bgElevated: s(p.bgElevated),
    bgSunken: s(p.bgSunken),
    surface: s(p.surface),
    surfaceGlass: s(p.surface),
    border: s(p.border),
    separator: s(p.separator),
    accentSoft: s(p.accentSoft),
    accentGlass: p.accent,
    textOnAccentGlass: p.textOnAccent,
    bubbleOutBg: p.accent,
    bubbleOutText: p.textOnAccent,
    bubbleInBg: s(p.bubbleInBg),
    bubbleStyle: 'accent',
    glass: undefined,
  };
}

const block = (selector: string, vars: Record<string, string>, extra = '') =>
  `${selector}{${extra}${Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join('')}}`;

/** CSS text with one `:root[data-theme=…]` block per theme (+ solid fallbacks for glass). */
export function buildThemeCss(): string {
  return THEME_ORDER.map((id) => {
    const p: Palette = PALETTES[id];
    // [data-theme-scope] lets a subtree preview another theme's colors (theme picker cards).
    let css = block(`:root[data-theme="${id}"],[data-theme-scope="${id}"]`, paletteVars(p), `color-scheme:${p.mode};`);
    if (p.glass) css += block(`:root[data-theme="${id}"][data-glass="false"]`, paletteVars(solidPalette(p)));
    return css;
  }).join('\n');
}
