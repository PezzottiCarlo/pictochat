import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import itIT from 'antd/locale/it_IT';
import { MotionConfig } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useSettings } from '@/stores/settings';
import '@/styles/global.css';
import { derivedAccentVars } from './accent';
import { resolveA11yPrefs, useMediaQuery, type A11yPrefs } from './a11y';
import { buildAntdTheme } from './antd';
import { withAlpha } from './color';
import { ThemeContext, type ThemeState } from './context';
import { GlassFilters } from './GlassFilters';
import type { Palette } from './palettes';
import { buildThemeCss, getPalette, getTheme, resolveThemeId, solidPalette } from './themes';

// Theme variable blocks are generated from the palettes once, before the first render.
if (typeof document !== 'undefined' && !document.getElementById('pc-themes')) {
  const style = document.createElement('style');
  style.id = 'pc-themes';
  style.textContent = buildThemeCss();
  document.head.prepend(style);
}

/** backdrop-filter: url(#svg) only renders in Chromium; Safari/Firefox keep blur-only glass. */
const supportsRefraction =
  typeof navigator !== 'undefined' &&
  /Chrome\/\d+/.test(navigator.userAgent) &&
  !/Firefox|FxiOS|CriOS/.test(navigator.userAgent) &&
  typeof CSS !== 'undefined' &&
  CSS.supports('backdrop-filter', 'url(#a)');

type StartViewTransition = (cb: () => void) => unknown;

/** CSS variables written inline on <html>: glass intensity + accent override. */
function runtimeVars(palette: Palette, prefs: A11yPrefs): Record<string, string> {
  const vars: Record<string, string> = { '--font-scale': String(prefs.fontScale) };
  const g = palette.glass;
  if (g && prefs.glass) {
    const k = prefs.glassIntensity;
    vars['--glass-blur'] = `${Math.round(10 + 22 * k)}px`;
    vars['--glass-saturation'] = `${Math.round(130 + 70 * k)}%`;
    vars['--surface-glass'] = withAlpha(g.tint, g.alphaMax - (g.alphaMax - g.alphaMin) * k);
    vars['--glass-overlay'] = withAlpha(g.tint, g.overlayAlphaMax - (g.overlayAlphaMax - g.overlayAlphaMin) * k);
  }
  if (prefs.accentColor) Object.assign(vars, derivedAccentVars(prefs.accentColor, palette));
  return vars;
}

function setThemeColorMeta(color: string) {
  const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
  metas.forEach((m, i) => (i === 0 ? m.removeAttribute('media') : m.remove()));
  let meta = metas[0];
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const s = useSettings(
    useShallow((st) => ({
      themeId: st.themeId,
      accentColor: st.accentColor,
      glassIntensity: st.glassIntensity,
      reduceMotion: st.reduceMotion,
      reduceTransparency: st.reduceTransparency,
      fontScale: st.fontScale,
      dyslexicFont: st.dyslexicFont,
      uppercase: st.uppercase,
      letterSpacing: st.letterSpacing,
      lineHeight: st.lineHeight,
      boldText: st.boldText,
      touchSize: st.touchSize,
      pictogramSize: st.pictogramSize,
      pictogramLabel: st.pictogramLabel,
      categoryColors: st.categoryColors,
    })),
  );
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const sysReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const sysReducedTransparency = useMediaQuery('(prefers-reduced-transparency: reduce)');

  // The applied theme lags the requested one so the swap can run inside a view transition.
  const targetId = resolveThemeId(s.themeId, prefersDark);
  const [themeId, setThemeId] = useState(targetId);

  const theme = getTheme(themeId);
  const prefs = useMemo(
    () =>
      resolveA11yPrefs(s, { reducedMotion: sysReducedMotion, reducedTransparency: sysReducedTransparency }, theme.glass),
    [s, sysReducedMotion, sysReducedTransparency, theme.glass],
  );

  useEffect(() => {
    if (targetId === themeId) return;
    const start = (document as Document & { startViewTransition?: StartViewTransition }).startViewTransition;
    if (start && !prefs.reducedMotion) start.call(document, () => flushSync(() => setThemeId(targetId)));
    else setThemeId(targetId);
  }, [targetId, themeId, prefs.reducedMotion]);

  const palette = useMemo(() => {
    const base = getPalette(themeId);
    return prefs.glass ? base : solidPalette(base);
  }, [themeId, prefs.glass]);
  const vars = useMemo(() => runtimeVars(palette, prefs), [palette, prefs]);

  const appliedVars = useRef<string[]>([]);
  useLayoutEffect(() => {
    const html = document.documentElement;
    const d = html.dataset;
    d.theme = themeId;
    d.mode = theme.mode;
    d.glass = String(prefs.glass);
    d.refraction = String(prefs.glass && supportsRefraction && prefs.glassIntensity > 0.05);
    d.transparency = prefs.reducedTransparency ? 'reduce' : 'full';
    d.motion = prefs.reducedMotion ? 'reduce' : 'full';
    d.font = prefs.dyslexicFont ? 'dyslexic' : 'default';
    d.uppercase = String(prefs.uppercase);
    d.spacing = prefs.letterSpacing;
    d.leading = prefs.lineHeight;
    d.bold = String(prefs.boldText);
    d.touch = prefs.touchSize;
    d.categoryColors = String(prefs.categoryColors);

    for (const name of appliedVars.current) if (!(name in vars)) html.style.removeProperty(name);
    for (const [name, value] of Object.entries(vars)) html.style.setProperty(name, value);
    appliedVars.current = Object.keys(vars);

    setThemeColorMeta(palette.glass ? palette.glass.backdropBase : palette.chrome);
  }, [themeId, theme.mode, prefs, vars, palette]);

  const antdTheme = useMemo(
    () =>
      buildAntdTheme(palette, {
        fontScale: prefs.fontScale,
        tapMin: prefs.tapMin,
        bold: prefs.boldText,
        reducedMotion: prefs.reducedMotion,
        accent: prefs.accentColor ? vars : undefined,
      }),
    [palette, prefs, vars],
  );

  const state = useMemo<ThemeState>(() => ({ theme, palette, prefs }), [theme, palette, prefs]);

  return (
    <ThemeContext.Provider value={state}>
      <ConfigProvider theme={antdTheme} locale={itIT} wave={{ disabled: prefs.reducedMotion }}>
        <MotionConfig reducedMotion={prefs.reducedMotion ? 'always' : 'never'}>
          <AntdApp component={false}>
            {prefs.glass && <GlassFilters intensity={prefs.glassIntensity} />}
            {children}
          </AntdApp>
        </MotionConfig>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}
