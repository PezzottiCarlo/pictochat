export type { ThemeDefinition } from './contract';
export { THEMES, THEME_ORDER, SYSTEM_THEME, getTheme, getPalette, resolveThemeId } from './themes';
export { ThemeProvider } from './ThemeProvider';
export { useResolvedTheme, useReducedMotion, useA11yPrefs, useThemeState } from './context';
export { ACCENT_PRESETS, type AccentPreset } from './accent';
export { TAP_SIZES, PICTO_SIZES, FONT_SCALE_RANGE, useMediaQuery, type A11yPrefs } from './a11y';
export type { Palette, CategoryColor } from './palettes';
