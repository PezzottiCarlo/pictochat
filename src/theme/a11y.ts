import { useSyncExternalStore } from 'react';
import type { Settings, SizeStep } from '@/core/types';

/** Settings-derived accessibility preferences, with 'system' already resolved. */
export interface A11yPrefs {
  reducedMotion: boolean;
  reducedTransparency: boolean;
  /** Glass effects actually rendered (glass theme and transparency allowed). */
  glass: boolean;
  glassIntensity: number;
  accentColor: string | null;
  fontScale: number;
  dyslexicFont: boolean;
  uppercase: boolean;
  letterSpacing: Settings['letterSpacing'];
  lineHeight: Settings['lineHeight'];
  boldText: boolean;
  touchSize: Settings['touchSize'];
  /** Minimum touch target in px for the current touchSize. */
  tapMin: number;
  pictogramSize: SizeStep;
  pictogramLabel: Settings['pictogramLabel'];
  categoryColors: boolean;
}

export const TAP_SIZES: Record<Settings['touchSize'], number> = { comfortable: 48, large: 56, xl: 68 };

/** Pictogram image edge in px, per size step (before touch scaling). */
export const PICTO_SIZES: Record<SizeStep, number> = { sm: 64, md: 88, lg: 116, xl: 148 };

export const FONT_SCALE_RANGE = { min: 0.85, max: 1.8 } as const;

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

export const clampFontScale = (n: number) =>
  Math.min(FONT_SCALE_RANGE.max, Math.max(FONT_SCALE_RANGE.min, Number.isFinite(n) ? n : 1));

type PrefSettings = Pick<
  Settings,
  | 'reduceMotion'
  | 'reduceTransparency'
  | 'glassIntensity'
  | 'accentColor'
  | 'fontScale'
  | 'dyslexicFont'
  | 'uppercase'
  | 'letterSpacing'
  | 'lineHeight'
  | 'boldText'
  | 'touchSize'
  | 'pictogramSize'
  | 'pictogramLabel'
  | 'categoryColors'
>;

export function resolveA11yPrefs(
  s: PrefSettings,
  system: { reducedMotion: boolean; reducedTransparency: boolean },
  themeIsGlass: boolean,
): A11yPrefs {
  const reducedMotion = s.reduceMotion === 'system' ? system.reducedMotion : s.reduceMotion === 'on';
  const reducedTransparency =
    s.reduceTransparency === 'system' ? system.reducedTransparency : s.reduceTransparency === 'on';
  const touchSize = s.touchSize in TAP_SIZES ? s.touchSize : 'large';
  return {
    reducedMotion,
    reducedTransparency,
    glass: themeIsGlass && !reducedTransparency,
    glassIntensity: Math.min(1, Math.max(0, s.glassIntensity ?? 0.7)),
    accentColor: s.accentColor && /^#[0-9a-f]{6}$/i.test(s.accentColor) ? s.accentColor : null,
    fontScale: clampFontScale(s.fontScale),
    dyslexicFont: s.dyslexicFont,
    uppercase: s.uppercase,
    letterSpacing: s.letterSpacing,
    lineHeight: s.lineHeight,
    boldText: s.boldText,
    touchSize,
    tapMin: TAP_SIZES[touchSize],
    pictogramSize: s.pictogramSize,
    pictogramLabel: s.pictogramLabel,
    categoryColors: s.categoryColors,
  };
}
