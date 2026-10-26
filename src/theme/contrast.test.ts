import { describe, expect, it } from 'vitest';
import { contrast, over, toHex, withAlpha } from './color';
import { PALETTES, type Palette } from './palettes';
import { ACCENT_PRESETS, derivedAccentVars } from './accent';

/** Opaque colors a translucent layer can sit on: the solid bg, or every backdrop blob in glass themes. */
function grounds(p: Palette): string[] {
  return p.glass ? [p.glass.backdropBase, ...p.glass.blobs] : [p.bgSolid];
}

/** Worst contrast of fg over bg, across every possible ground. */
function worst(p: Palette, fg: string, bg: string): number {
  return Math.min(...grounds(p).map((g) => contrast(fg, bg, g)));
}

function pairs(p: Palette): [string, string, string, number][] {
  const glassMin = p.glass ? withAlpha(p.glass.tint, p.glass.alphaMin) : p.surfaceGlass;
  return [
    ['text / bg', p.text, p.bg, 4.5],
    ['text / surface', p.text, p.surface, 4.5],
    ['text / glass (min tint)', p.text, glassMin, 4.5],
    ['text / sunken', p.text, p.bgSunken, 4.5],
    ['secondary / bg', p.textSecondary, p.bg, 4.5],
    ['secondary / surface', p.textSecondary, p.surface, 4.5],
    ['tertiary / bg', p.textTertiary, p.bg, 4.5],
    ['tertiary / surface', p.textTertiary, p.surface, 4.5],
    ['on-accent / accent', p.textOnAccent, p.accent, 4.5],
    ['on-accent-glass / accent-glass', p.textOnAccentGlass, p.accentGlass, 4.5],
    ['bubble out', p.bubbleOutText, p.bubbleOutBg, 4.5],
    ['bubble in', p.bubbleInText, p.bubbleInBg, 4.5],
    ['danger / surface', p.danger, p.surface, 4.5],
    ['success / surface', p.success, p.surface, 3],
    ['warning / surface', p.warning, p.surface, 3],
  ];
}

function hsl(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const v = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

describe('theme contrast (WCAG AA)', () => {
  // Ratios are part of the test names: `npx vitest run src/theme --reporter=verbose` prints the table.
  for (const [id, palette] of Object.entries(PALETTES) as [string, Palette][]) {
    describe(id, () => {
      for (const [name, fg, bg, min] of pairs(palette)) {
        const ratio = worst(palette, fg, bg);
        it(`${name}: ${ratio.toFixed(2)} (min ${min})`, () => {
          expect(ratio).toBeGreaterThanOrEqual(min);
        });
      }
    });
  }

  for (const [id, palette] of Object.entries(PALETTES) as [string, Palette][]) {
    const g = palette.glass;
    if (!g) continue;
    // Bars/sheets float over app content: check against the most extreme content colors.
    const overlay = withAlpha(g.tint, g.overlayAlphaMin);
    for (const [name, fg] of [
      ['text', palette.text],
      ['secondary', palette.textSecondary],
      ['tertiary', palette.textTertiary],
    ] as const) {
      const ratio = Math.min(contrast(fg, overlay, '#000000'), contrast(fg, overlay, '#ffffff'));
      it(`${id} > ${name} / overlay glass over any content: ${ratio.toFixed(2)} (min 4.5)`, () => {
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('avatar initials are legible for every hue', () => {
    for (let h = 0; h < 360; h += 5) {
      expect(contrast(hsl(h, 60, 20), hsl(h, 70, 85)), `hue ${h}`).toBeGreaterThanOrEqual(7);
    }
  });

  it('accent presets stay legible in every theme', () => {
    for (const preset of ACCENT_PRESETS) {
      for (const [id, palette] of Object.entries(PALETTES) as [string, Palette][]) {
        const v = derivedAccentVars(preset.color, palette);
        const solidBg = toHex(over(palette.bgSolid, '#fff'));
        expect(contrast(v['--text-on-accent'], v['--accent']), `${preset.id}@${id} on-accent`).toBeGreaterThanOrEqual(4.5);
        expect(worst(palette, v['--text-on-accent-glass'], v['--accent-glass']), `${preset.id}@${id} glass`).toBeGreaterThanOrEqual(4.5);
        expect(worst(palette, v['--bubble-out-text'], v['--bubble-out-bg']), `${preset.id}@${id} bubble`).toBeGreaterThanOrEqual(4.5);
        expect(contrast(v['--accent-text'], solidBg), `${preset.id}@${id} accent-text`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
