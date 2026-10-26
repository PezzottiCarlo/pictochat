import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS } from '@/stores/settings';
import { resolveA11yPrefs, type A11yPrefs } from './a11y';
import type { ThemeDefinition } from './contract';
import type { Palette } from './palettes';
import { getPalette, getTheme } from './themes';

export interface ThemeState {
  theme: ThemeDefinition;
  /** Palette actually in use (opaque variant when glass is disabled). */
  palette: Palette;
  prefs: A11yPrefs;
}

export const ThemeContext = createContext<ThemeState>({
  theme: getTheme('light'),
  palette: getPalette('light'),
  prefs: resolveA11yPrefs(DEFAULT_SETTINGS, { reducedMotion: false, reducedTransparency: false }, false),
});

/** The active theme, with 'system' resolved to light/dark. */
export function useResolvedTheme(): ThemeDefinition {
  return useContext(ThemeContext).theme;
}

/** True when animations should be minimized (setting or OS preference). */
export function useReducedMotion(): boolean {
  return useContext(ThemeContext).prefs.reducedMotion;
}

/** All resolved accessibility/reading preferences. */
export function useA11yPrefs(): A11yPrefs {
  return useContext(ThemeContext).prefs;
}

export function useThemeState(): ThemeState {
  return useContext(ThemeContext);
}
