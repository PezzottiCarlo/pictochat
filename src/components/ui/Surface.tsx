import type { HTMLAttributes, Ref } from 'react';
import { cx, type StyleWithVars } from './utils';
import './Surface.css';

export type SpaceStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  /** plain: opaque card · glass: translucent material (solid outside glass themes) · inset: sunken well. */
  variant?: 'plain' | 'glass' | 'inset';
  as?: 'div' | 'section' | 'article' | 'aside' | 'li' | 'ul' | 'form';
  /** Inner padding on the --space-* scale (default 4 = 16px). */
  padding?: SpaceStep;
  radius?: 'sm' | 'md' | 'lg' | 'xl';
  /** Glass only: SVG refraction where supported (use on large, important panels). */
  lens?: boolean;
  ref?: Ref<HTMLElement>;
}

export function Surface({
  variant = 'plain',
  as: Tag = 'div',
  padding = 4,
  radius = 'lg',
  lens,
  className,
  style,
  ...rest
}: SurfaceProps) {
  const vars: StyleWithVars = {
    '--surface-pad': padding === 0 ? '0px' : `var(--space-${padding})`,
    '--surface-radius': `var(--radius-${radius})`,
    ...style,
  };
  return (
    <Tag
      {...(rest as HTMLAttributes<HTMLElement>)}
      className={cx(
        'pc-surface',
        `pc-surface--${variant}`,
        variant === 'glass' && 'pc-glass',
        variant === 'glass' && lens && 'pc-glass--lens',
        className,
      )}
      style={vars}
    />
  );
}
