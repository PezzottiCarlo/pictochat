import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { cx, type StyleWithVars } from './utils';
import './PageScaffold.css';

export interface PageScaffoldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Usually a <NavHeader/>; sticks to the top while content scrolls beneath it. */
  header?: ReactNode;
  /** Usually a <TabBar/> or a composer in a <GlassBar position="bottom"/>. */
  footer?: ReactNode;
  children?: ReactNode;
  /** Horizontal + vertical padding around the content (default true). */
  padded?: boolean;
  /** Max content width in px for tablets/desktop (default 760). 0 = full width. */
  maxWidth?: number;
  contentClassName?: string;
  /** The scrolling element (e.g. to keep a chat pinned to the bottom). */
  scrollRef?: Ref<HTMLDivElement>;
}

/**
 * Full-height page: one scroll container holding a sticky header, the content and a sticky footer.
 * Content scrolls *under* the bars, which is what makes glass bars look like glass.
 */
export function PageScaffold({
  header,
  footer,
  children,
  padded = true,
  maxWidth = 760,
  className,
  contentClassName,
  scrollRef,
  style,
  ...rest
}: PageScaffoldProps) {
  const vars: StyleWithVars = { '--page-max': maxWidth ? `${maxWidth}px` : 'none', ...style };
  return (
    <div {...rest} className={cx('pc-scaffold', className)} style={vars} ref={scrollRef}>
      {header}
      <main className={cx('pc-scaffold__content', padded && 'pc-scaffold__content--padded', contentClassName)}>
        {children}
      </main>
      {footer}
    </div>
  );
}
