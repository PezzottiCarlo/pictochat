import { theme as antdTheme, type ThemeConfig } from 'antd';
import { over, toHex } from './color';
import type { Palette } from './palettes';

export interface AntdRuntimeOptions {
  fontScale: number;
  /** Minimum touch target in px (48 / 56 / 68). */
  tapMin: number;
  bold: boolean;
  reducedMotion: boolean;
  /** Accent overrides from derivedAccentVars (CSS var name → value). */
  accent?: Record<string, string>;
}

const DEFAULTS: AntdRuntimeOptions = { fontScale: 1, tapMin: 56, bold: false, reducedMotion: false };

/**
 * antd theme synced with the palette. Colors are opaque hex (antd derives hover/active
 * shades from them); glass surfaces for overlays are applied in antd-overrides.css.
 */
export function buildAntdTheme(p: Palette, options: Partial<AntdRuntimeOptions> = {}): ThemeConfig {
  const o = { ...DEFAULTS, ...options };
  const solid = (c: string) => toHex(over(c, over(p.bgSolid, '#ffffff')));
  const accent = o.accent?.['--accent'] ?? p.accent;
  const onAccent = o.accent?.['--text-on-accent'] ?? p.textOnAccent;
  const fontSize = Math.round(17 * o.fontScale);
  // Controls grow with both the touch preference and the text size, so big text never gets clipped.
  const controlHeight = Math.max(o.tapMin, Math.ceil(fontSize * 1.5 + 16));
  const lineWidth = parseInt(p.borderWidth, 10) || 1;

  return {
    algorithm: p.mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    cssVar: { key: 'pictochat' },
    hashed: false,
    token: {
      colorPrimary: accent,
      colorInfo: accent,
      colorLink: o.accent?.['--accent-text'] ?? accent,
      colorSuccess: p.success,
      colorError: p.danger,
      colorWarning: p.warning,
      colorBgBase: solid(p.bgSolid),
      colorBgLayout: solid(p.bgSolid),
      colorBgContainer: solid(p.surface),
      colorBgElevated: solid(p.bgElevated),
      colorText: p.text,
      colorTextSecondary: p.textSecondary,
      colorTextTertiary: p.textTertiary,
      colorTextDescription: p.textSecondary,
      colorTextPlaceholder: p.textTertiary,
      colorTextLightSolid: onAccent,
      colorBorder: solid(p.border),
      colorBorderSecondary: solid(p.separator),
      colorSplit: solid(p.separator),
      fontFamily: 'var(--font-body)',
      fontSize,
      fontWeightStrong: o.bold ? 800 : 700,
      lineWidth,
      lineWidthFocus: 3,
      borderRadius: p.radius.md,
      borderRadiusLG: p.radius.lg,
      borderRadiusSM: p.radius.sm,
      borderRadiusXS: Math.max(4, p.radius.sm - 4),
      controlHeight,
      controlHeightLG: controlHeight + 8,
      controlHeightSM: Math.max(36, controlHeight - 12),
      controlInteractiveSize: 24,
      boxShadow: p.shadow2 === 'none' ? 'none' : p.shadow2,
      boxShadowSecondary: p.shadow2 === 'none' ? 'none' : p.shadow2,
      motion: !o.reducedMotion,
      wireframe: false,
    },
    components: {
      Button: { fontWeight: o.bold ? 800 : 700, primaryShadow: 'none', defaultShadow: 'none', dangerShadow: 'none' },
      Switch: { trackHeight: 32, trackMinWidth: 56, handleSize: 28, innerMaxMargin: 34, innerMinMargin: 10 },
      Slider: { railSize: 8, handleSize: 22, handleSizeHover: 24, controlSize: 22 },
      Checkbox: { controlInteractiveSize: 24 },
      Radio: { radioSize: 24, dotSize: 12 },
      Segmented: { trackPadding: 4 },
      List: { itemPaddingSM: '12px 16px', itemPadding: '16px 0' },
      Message: { contentPadding: '14px 20px' },
      Modal: { titleFontSize: Math.round(fontSize * 1.2) },
      Tabs: { titleFontSize: fontSize },
      Tooltip: { fontSize: Math.max(15, Math.round(fontSize * 0.9)) },
    },
  };
}
