import type { Category } from '@/core/types';

export type CategoryColor = Category['color'];

/** Raw color values of a theme. Single source of truth for CSS variables AND antd tokens. */
export interface Palette {
  mode: 'light' | 'dark';
  /** Page background. Transparent in glass themes (the animated backdrop shows through). */
  bg: string;
  /** Opaque page color: html background, antd layout, glass fallback. */
  bgSolid: string;
  bgElevated: string;
  bgSunken: string;
  surface: string;
  surfaceGlass: string;
  border: string;
  separator: string;
  borderWidth: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textOnAccent: string;
  accent: string;
  accentSoft: string;
  /** Accent fill for glass buttons (translucent in glass themes). */
  accentGlass: string;
  textOnAccentGlass: string;
  danger: string;
  success: string;
  warning: string;
  bubbleOutBg: string;
  bubbleOutText: string;
  bubbleInBg: string;
  bubbleInText: string;
  cat: Record<CategoryColor, string>;
  radius: { sm: number; md: number; lg: number; xl: number };
  shadow1: string;
  shadow2: string;
  /** Status bar / <meta name="theme-color">. */
  chrome: string;
  /** How the outgoing bubble derives from a custom accent color. */
  bubbleStyle: 'accent' | 'deep' | 'soft' | 'glass';
  glass?: GlassSpec;
}

export interface GlassSpec {
  /** RGB of the glass tint; its alpha is driven by glassIntensity. */
  tint: string;
  /** Tint alpha at intensity 0 (almost solid) and 1 (most transparent). Contrast is checked at alphaMin. */
  alphaMax: number;
  alphaMin: number;
  /**
   * Same for bars, sheets and popovers, which float over arbitrary app content: alphaMin is
   * chosen so every text color still passes AA over pure black/white content.
   */
  overlayAlphaMax: number;
  overlayAlphaMin: number;
  highlight: string;
  border: string;
  /** Backdrop base + blob colors (contrast is verified against each one). */
  backdropBase: string;
  blobs: [string, string, string, string];
}

const shadowsLight = {
  shadow1: '0 1px 2px rgba(21, 35, 45, 0.07), 0 1px 1px rgba(21, 35, 45, 0.04)',
  shadow2: '0 10px 30px rgba(21, 35, 45, 0.12), 0 2px 8px rgba(21, 35, 45, 0.06)',
};
const shadowsDark = {
  shadow1: '0 1px 2px rgba(0, 0, 0, 0.4)',
  shadow2: '0 12px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.3)',
};

export const PALETTES = {
  light: {
    mode: 'light',
    bubbleStyle: 'accent',
    bg: '#f2f5f7',
    bgSolid: '#f2f5f7',
    bgElevated: '#ffffff',
    bgSunken: '#e6ebef',
    surface: '#ffffff',
    surfaceGlass: '#ffffff',
    border: '#cfd7de',
    separator: '#e1e6ea',
    borderWidth: '1px',
    text: '#15232d',
    textSecondary: '#44525e',
    textTertiary: '#56636f',
    textOnAccent: '#ffffff',
    accent: '#0b6f79',
    accentSoft: '#d8eef0',
    accentGlass: '#0b6f79',
    textOnAccentGlass: '#ffffff',
    danger: '#c0291c',
    success: '#1d7a3b',
    warning: '#9a5400',
    bubbleOutBg: '#0b6f79',
    bubbleOutText: '#ffffff',
    bubbleInBg: '#ffffff',
    bubbleInText: '#15232d',
    cat: {
      person: '#f2b705',
      verb: '#2e9b45',
      noun: '#ee7a1a',
      adjective: '#2f6fe0',
      social: '#e0508f',
      place: '#8a5cd6',
      time: '#8b6a4f',
      misc: '#8c97a3',
    },
    radius: { sm: 10, md: 16, lg: 22, xl: 30 },
    ...shadowsLight,
    chrome: '#f2f5f7',
  },
  dark: {
    mode: 'dark',
    bubbleStyle: 'deep',
    bg: '#0e1419',
    bgSolid: '#0e1419',
    bgElevated: '#182128',
    bgSunken: '#0a0f13',
    surface: '#182128',
    surfaceGlass: '#182128',
    border: '#33404b',
    separator: '#232d35',
    borderWidth: '1px',
    text: '#edf2f5',
    textSecondary: '#b6c1ca',
    textTertiary: '#9aa6b1',
    textOnAccent: '#062327',
    accent: '#5ccbd3',
    accentSoft: '#173a3f',
    accentGlass: '#5ccbd3',
    textOnAccentGlass: '#062327',
    danger: '#ff7f73',
    success: '#5bd083',
    warning: '#f2b84b',
    bubbleOutBg: '#1d5f67',
    bubbleOutText: '#ffffff',
    bubbleInBg: '#222c34',
    bubbleInText: '#edf2f5',
    cat: {
      person: '#ffd23f',
      verb: '#4cc864',
      noun: '#ff9a3d',
      adjective: '#5b93ff',
      social: '#ff6fae',
      place: '#a884ff',
      time: '#c09a7a',
      misc: '#9aa6b2',
    },
    radius: { sm: 10, md: 16, lg: 22, xl: 30 },
    ...shadowsDark,
    chrome: '#0e1419',
  },
  'liquid-glass': {
    mode: 'light',
    bubbleStyle: 'glass',
    bg: 'transparent',
    bgSolid: '#eef2f8',
    bgElevated: 'rgba(255, 255, 255, 0.74)',
    bgSunken: 'rgba(255, 255, 255, 0.34)',
    surface: 'rgba(255, 255, 255, 0.7)',
    surfaceGlass: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(23, 40, 60, 0.16)',
    separator: 'rgba(23, 40, 60, 0.1)',
    borderWidth: '1px',
    text: '#0b1722',
    textSecondary: '#2f3d4a',
    textTertiary: '#3b4955',
    textOnAccent: '#ffffff',
    accent: '#0a5fc8',
    accentSoft: 'rgba(10, 95, 200, 0.14)',
    accentGlass: 'rgba(8, 86, 184, 0.86)',
    textOnAccentGlass: '#ffffff',
    danger: '#b3261e',
    success: '#17703a',
    warning: '#8a4c00',
    bubbleOutBg: 'rgba(8, 86, 184, 0.88)',
    bubbleOutText: '#ffffff',
    bubbleInBg: 'rgba(255, 255, 255, 0.72)',
    bubbleInText: '#0b1722',
    cat: {
      person: '#f2b705',
      verb: '#2e9b45',
      noun: '#ee7a1a',
      adjective: '#2f6fe0',
      social: '#e0508f',
      place: '#8a5cd6',
      time: '#8b6a4f',
      misc: '#8c97a3',
    },
    radius: { sm: 12, md: 18, lg: 26, xl: 34 },
    shadow1: '0 1px 2px rgba(20, 40, 80, 0.08)',
    shadow2: '0 16px 40px rgba(20, 40, 80, 0.16), 0 2px 8px rgba(20, 40, 80, 0.08)',
    chrome: '#e9eef6',
    glass: {
      tint: '#ffffff',
      alphaMax: 0.88,
      alphaMin: 0.4,
      overlayAlphaMax: 0.94,
      overlayAlphaMin: 0.74,
      highlight: 'rgba(255, 255, 255, 0.9)',
      border: 'rgba(255, 255, 255, 0.65)',
      backdropBase: '#e9eef6',
      blobs: ['#9ec9ff', '#ffbcdc', '#a6eed6', '#ffd6a5'],
    },
  },
  'liquid-glass-dark': {
    mode: 'dark',
    bubbleStyle: 'glass',
    bg: 'transparent',
    bgSolid: '#0f131c',
    bgElevated: 'rgba(38, 43, 58, 0.74)',
    bgSunken: 'rgba(0, 0, 0, 0.28)',
    surface: 'rgba(32, 37, 50, 0.7)',
    surfaceGlass: 'rgba(28, 32, 44, 0.5)',
    border: 'rgba(255, 255, 255, 0.14)',
    separator: 'rgba(255, 255, 255, 0.09)',
    borderWidth: '1px',
    text: '#f3f6fa',
    textSecondary: '#d0d7e0',
    textTertiary: '#bcc5d0',
    textOnAccent: '#04192f',
    accent: '#64adff',
    accentSoft: 'rgba(100, 173, 255, 0.18)',
    accentGlass: 'rgba(30, 104, 214, 0.78)',
    textOnAccentGlass: '#ffffff',
    danger: '#ff8a80',
    success: '#62d68b',
    warning: '#f5be55',
    bubbleOutBg: 'rgba(30, 104, 214, 0.82)',
    bubbleOutText: '#ffffff',
    bubbleInBg: 'rgba(255, 255, 255, 0.12)',
    bubbleInText: '#f3f6fa',
    cat: {
      person: '#ffd23f',
      verb: '#4cc864',
      noun: '#ff9a3d',
      adjective: '#5b93ff',
      social: '#ff6fae',
      place: '#a884ff',
      time: '#c09a7a',
      misc: '#9aa6b2',
    },
    radius: { sm: 12, md: 18, lg: 26, xl: 34 },
    shadow1: '0 1px 2px rgba(0, 0, 0, 0.4)',
    shadow2: '0 18px 44px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
    chrome: '#0b0f1a',
    glass: {
      tint: '#1c202c',
      alphaMax: 0.9,
      alphaMin: 0.4,
      overlayAlphaMax: 0.95,
      overlayAlphaMin: 0.8,
      highlight: 'rgba(255, 255, 255, 0.3)',
      border: 'rgba(255, 255, 255, 0.16)',
      backdropBase: '#0b0f1a',
      blobs: ['#283a86', '#5e2763', '#0f4b52', '#66401a'],
    },
  },
  calm: {
    mode: 'light',
    bubbleStyle: 'soft',
    bg: '#eef2ef',
    bgSolid: '#eef2ef',
    bgElevated: '#f9fbf9',
    bgSunken: '#e2e8e3',
    surface: '#f9fbf9',
    surfaceGlass: '#f9fbf9',
    border: '#d0d9d2',
    separator: '#dfe6e0',
    borderWidth: '1px',
    text: '#27332d',
    textSecondary: '#46534c',
    textTertiary: '#56635c',
    textOnAccent: '#ffffff',
    accent: '#4a7768',
    accentSoft: '#dae7e1',
    accentGlass: '#4a7768',
    textOnAccentGlass: '#ffffff',
    danger: '#a3453a',
    success: '#3b7350',
    warning: '#80601f',
    bubbleOutBg: '#d3e4dc',
    bubbleOutText: '#1f2b26',
    bubbleInBg: '#f9fbf9',
    bubbleInText: '#27332d',
    cat: {
      person: '#d9b85c',
      verb: '#7baa7e',
      noun: '#d49a6a',
      adjective: '#7c9cc9',
      social: '#cc8faa',
      place: '#a592c7',
      time: '#a88e78',
      misc: '#a3ada7',
    },
    radius: { sm: 14, md: 20, lg: 26, xl: 34 },
    shadow1: 'none',
    shadow2: '0 6px 20px rgba(39, 51, 45, 0.07)',
    chrome: '#eef2ef',
  },
  'high-contrast': {
    mode: 'dark',
    bubbleStyle: 'accent',
    bg: '#000000',
    bgSolid: '#000000',
    bgElevated: '#000000',
    bgSunken: '#1a1a1a',
    surface: '#000000',
    surfaceGlass: '#000000',
    border: '#ffffff',
    separator: '#ffffff',
    borderWidth: '2px',
    text: '#ffffff',
    textSecondary: '#f2f2f2',
    textTertiary: '#e0e0e0',
    textOnAccent: '#000000',
    accent: '#ffe500',
    accentSoft: '#3a3300',
    accentGlass: '#ffe500',
    textOnAccentGlass: '#000000',
    danger: '#ff7070',
    success: '#3dff7a',
    warning: '#ffb000',
    bubbleOutBg: '#ffe500',
    bubbleOutText: '#000000',
    bubbleInBg: '#000000',
    bubbleInText: '#ffffff',
    cat: {
      person: '#ffe500',
      verb: '#00e05a',
      noun: '#ff8a00',
      adjective: '#3d9bff',
      social: '#ff4fb0',
      place: '#b98cff',
      time: '#d9a066',
      misc: '#ffffff',
    },
    radius: { sm: 8, md: 12, lg: 16, xl: 22 },
    shadow1: 'none',
    shadow2: 'none',
    chrome: '#000000',
  },
} satisfies Record<string, Palette>;

export type ThemeKey = keyof typeof PALETTES;
