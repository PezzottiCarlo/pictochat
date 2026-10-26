/**
 * Contract of the design system. Implemented in src/theme (tokens, themes, provider)
 * and src/components/ui (primitives). Screens must style themselves only with the
 * CSS variables below and the ui primitives, never with hard-coded colors.
 *
 * Required exports of `src/theme/index.ts`:
 *
 *   export const THEMES: ThemeDefinition[];                 // includes 'liquid-glass' and 'liquid-glass-dark'
 *   export function ThemeProvider(props: { children: React.ReactNode }): JSX.Element;
 *     // reads useSettings() (themeId, fontScale, dyslexicFont, reduceMotion), sets
 *     // <html data-theme data-glass data-motion style="--font-scale">, wraps antd ConfigProvider
 *   export function useResolvedTheme(): ThemeDefinition;   // 'system' resolved to a concrete theme
 *   export function useReducedMotion(): boolean;
 *
 * Required exports of `src/components/ui/index.ts` (all theme-aware, glass-aware):
 *
 *   Surface        – panel/card; variant 'plain' | 'glass' | 'inset'
 *   GlassBar       – sticky top/bottom bar (navigation, composer), safe-area aware
 *   PageScaffold   – { header?, footer?, children } full-height page with scroll area
 *   NavHeader      – { title, subtitle?, onBack?, leading?, trailing? }
 *   TabBar         – bottom navigation { items: {key,label,icon,to}[], activeKey }
 *   IconButton     – large touch target (≥ 48px), aria-label required
 *   PictoTile      – { pictogram, size?: 'sm'|'md'|'lg', selected?, onPress?, showLabel? }
 *   PictoStrip     – horizontal row of PictoTile for a PictogramToken[]
 *   Avatar         – { src?, name, size?, presence? } with initials + generated color fallback
 *   EmptyState     – { icon, title, description?, action? }
 *   Sheet          – bottom sheet { open, onClose, title?, children } (glass in glass themes)
 *   Segmented      – large segmented control
 *
 * CSS variables every theme defines (on :root[data-theme=…]):
 *   --bg, --bg-elevated, --bg-sunken, --surface, --surface-glass, --border, --separator,
 *   --text, --text-secondary, --text-tertiary, --text-on-accent,
 *   --accent, --accent-soft, --danger, --success, --warning,
 *   --bubble-out-bg, --bubble-out-text, --bubble-in-bg, --bubble-in-text,
 *   --cat-person, --cat-verb, --cat-noun, --cat-adjective, --cat-social, --cat-place, --cat-time, --cat-misc,
 *   --radius-sm, --radius-md, --radius-lg, --radius-xl, --shadow-1, --shadow-2,
 *   --glass-blur, --glass-saturation, --glass-tint, --glass-highlight, --glass-border,
 *   --font-body, --font-scale, --fs-xs, --fs-sm, --fs-md, --fs-lg, --fs-xl, --fs-xxl,
 *   --space-1 … --space-6, --tap-min (48px), --ease-spring, --dur-fast, --dur-med
 */
import type { ThemeConfig } from 'antd';

export interface ThemeDefinition {
  id: string;
  /** Italian, shown in settings. */
  label: string;
  description: string;
  mode: 'light' | 'dark';
  /** Glass themes render translucent, refractive surfaces. */
  glass: boolean;
  /** Swatches for the theme picker preview. */
  preview: { background: string; surface: string; accent: string };
  antd: ThemeConfig;
}
