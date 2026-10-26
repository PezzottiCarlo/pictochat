import { contrast, ensureContrast, mix, over, readableOn, toHex, withAlpha } from './color';
import type { Palette } from './palettes';

export interface AccentPreset {
  id: string;
  /** Italian, shown in the color picker. */
  label: string;
  color: string;
}

/** Curated accents for the settings picker. Each has ≥ 4.5:1 with white or near-black text. */
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'laguna', label: 'Laguna', color: '#0b6f79' },
  { id: 'mare', label: 'Mare', color: '#1f5fd6' },
  { id: 'cielo', label: 'Cielo', color: '#5fb4f5' },
  { id: 'viola', label: 'Viola', color: '#6b46e0' },
  { id: 'lampone', label: 'Lampone', color: '#c92a62' },
  { id: 'corallo', label: 'Corallo', color: '#ff8a65' },
  { id: 'sole', label: 'Sole', color: '#f6c445' },
  { id: 'prato', label: 'Prato', color: '#56c271' },
  { id: 'bosco', label: 'Bosco', color: '#1d6b47' },
  { id: 'grafite', label: 'Grafite', color: '#3c4752' },
];

const DARK_TEXT = '#101418';
const LIGHT_TEXT = '#ffffff';

function grounds(p: Palette): string[] {
  return p.glass ? [p.glass.backdropBase, ...p.glass.blobs] : [p.bgSolid];
}

/** Translucent fill + text color that pass AA on every possible glass ground. */
function glassFill(accent: string, p: Palette): [fill: string, text: string] {
  const deep = ensureContrast(accent, LIGHT_TEXT, 4.6);
  for (const base of [accent, deep]) {
    for (const alpha of [0.8, 0.88, 0.95, 1]) {
      const fill = withAlpha(base, alpha);
      for (const text of [LIGHT_TEXT, DARK_TEXT]) {
        if (grounds(p).every((g) => contrast(text, fill, g) >= 4.6)) return [fill, text];
      }
    }
  }
  return [deep, LIGHT_TEXT];
}

/**
 * CSS variables that a user-picked accent overrides on top of the active theme.
 * Text colors are always derived by contrast, so any hex stays legible.
 */
export function derivedAccentVars(color: string, p: Palette): Record<string, string> {
  const accent = toHex(over(color, '#ffffff'));
  const solidBg = toHex(over(p.bgSolid, '#ffffff'));
  const onAccent = readableOn(accent, DARK_TEXT, LIGHT_TEXT);
  const accentText = ensureContrast(accent, solidBg, 4.6);
  const softAmount = p.mode === 'dark' ? 0.24 : 0.16;
  const accentSoft = p.glass ? withAlpha(accent, softAmount) : mix(solidBg, accent, softAmount);

  const [accentGlass, onAccentGlass] = p.glass ? glassFill(accent, p) : [accent, onAccent];

  let bubbleBg: string;
  let bubbleText: string;
  switch (p.bubbleStyle) {
    case 'deep':
      bubbleBg = ensureContrast(accent, LIGHT_TEXT, 5);
      bubbleText = LIGHT_TEXT;
      break;
    case 'soft':
      bubbleBg = mix(solidBg, accent, 0.26);
      bubbleText = ensureContrast(p.text, bubbleBg, 7);
      break;
    case 'glass':
      [bubbleBg, bubbleText] = [accentGlass, onAccentGlass];
      break;
    default:
      bubbleBg = accent;
      bubbleText = onAccent;
  }

  return {
    '--accent': accent,
    '--accent-text': accentText,
    '--accent-soft': accentSoft,
    '--accent-strong': mix(accent, p.mode === 'dark' ? '#ffffff' : '#000000', 0.14),
    '--text-on-accent': onAccent,
    '--accent-glass': accentGlass,
    '--text-on-accent-glass': onAccentGlass,
    '--bubble-out-bg': bubbleBg,
    '--bubble-out-text': bubbleText,
    '--focus-ring': p.mode === 'dark' ? mix(accent, '#ffffff', 0.2) : ensureContrast(accent, solidBg, 3),
  };
}
