/**
 * SVG filter used as `backdrop-filter: url(#pc-refract)` by `.pc-glass--lens` (Chromium only):
 * low-frequency noise displaces the backdrop a few pixels, like light bending through thick glass.
 */
export function GlassFilters({ intensity }: { intensity: number }) {
  const scale = Math.round(6 + 26 * intensity);
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <filter id="pc-refract" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="11" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="3" result="softNoise" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softNoise"
          scale={scale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
