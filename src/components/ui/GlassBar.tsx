import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from './utils';
import './GlassBar.css';

export interface GlassBarProps extends HTMLAttributes<HTMLElement> {
  /** Sticks to the top (navigation) or bottom (composer, tabs) of the scroll area. */
  position?: 'top' | 'bottom';
  /** Floating capsule detached from the screen edges (Liquid Glass style), instead of a full-width bar. */
  floating?: boolean;
  as?: 'header' | 'footer' | 'nav' | 'div';
  children?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/** Sticky, safe-area aware bar. Glass in glass themes, solid elsewhere. */
export function GlassBar({ position = 'top', floating = false, as, className, children, ...rest }: GlassBarProps) {
  // All allowed tags are plain HTMLElements; the cast keeps the ref type simple.
  const Tag = (as ?? (position === 'top' ? 'header' : 'footer')) as 'header';
  return (
    <Tag
      {...rest}
      className={cx(
        'pc-bar',
        `pc-bar--${position}`,
        floating && 'pc-bar--floating',
        'pc-glass',
        'pc-glass--overlay',
        floating && 'pc-glass--lens',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
