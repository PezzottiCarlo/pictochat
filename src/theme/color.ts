/** Tiny color helpers (no deps): parsing, compositing, WCAG contrast, accent derivation. */

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(input: string): RGBA {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
    const n = parseInt(hex.slice(0, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a };
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const [r, g, b, a = '1'] = m[1].split(/[\s,/]+/).filter(Boolean);
    return { r: +r, g: +g, b: +b, a: a.endsWith('%') ? parseFloat(a) / 100 : +a };
  }
  throw new Error(`Unsupported color: ${input}`);
}

const hex2 = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');

export function toHex({ r, g, b }: RGBA): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

export function toRgba({ r, g, b, a }: RGBA): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${+a.toFixed(3)})`;
}

/** Alpha-composite `top` over an opaque `bottom`. */
export function over(top: string | RGBA, bottom: string | RGBA): RGBA {
  const t = typeof top === 'string' ? parseColor(top) : top;
  const b = typeof bottom === 'string' ? parseColor(bottom) : bottom;
  const mixc = (x: number, y: number) => x * t.a + y * (1 - t.a);
  return { r: mixc(t.r, b.r), g: mixc(t.g, b.g), b: mixc(t.b, b.b), a: 1 };
}

/** Linear mix in sRGB; `amount` = weight of `b`. */
export function mix(a: string, b: string, amount: number): string {
  const x = parseColor(a);
  const y = parseColor(b);
  const m = (p: number, q: number) => p + (q - p) * amount;
  return toHex({ r: m(x.r, y.r), g: m(x.g, y.g), b: m(x.b, y.b), a: 1 });
}

export function withAlpha(color: string, alpha: number): string {
  return toRgba({ ...parseColor(color), a: alpha });
}

export function luminance(color: string | RGBA): number {
  const c = typeof color === 'string' ? parseColor(color) : color;
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b);
}

/** WCAG 2.x contrast ratio. Translucent colors are composited over `backdrop` (default white). */
export function contrast(fg: string, bg: string, backdrop = '#ffffff'): number {
  const bgc = over(bg, backdrop);
  const fgc = over(fg, bgc);
  const [l1, l2] = [luminance(fgc), luminance(bgc)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Black-ish or white text, whichever reads better on `bg`. */
export function readableOn(bg: string, dark = '#101418', light = '#ffffff'): string {
  return contrast(dark, bg) >= contrast(light, bg) ? dark : light;
}

/**
 * Push `color` toward black or white until it reaches `ratio` against `bg`
 * (used to derive a legible link/text version of any accent).
 */
export function ensureContrast(color: string, bg: string, ratio = 4.5): string {
  if (contrast(color, bg) >= ratio) return toHex(parseColor(color));
  const target = luminance(over(bg, '#ffffff')) > 0.4 ? '#000000' : '#ffffff';
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = mix(color, target, t);
    if (contrast(c, bg) >= ratio) return c;
  }
  return target;
}
