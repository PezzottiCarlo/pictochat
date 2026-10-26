import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'motion/react';
import { CloseOutlined } from '@ant-design/icons';
import { IconButton } from './IconButton';
import { cx } from './utils';
import './Sheet.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  /** Sticky actions at the bottom of the sheet (e.g. a full-width primary button). */
  footer?: ReactNode;
  /** Spoken name when there is no visible title. */
  'aria-label'?: string;
  /** auto: fits content (max 92%) · full: fills the screen height. */
  height?: 'auto' | 'full';
  /** false = must use a button inside to close (no scrim tap / swipe / Esc). */
  dismissible?: boolean;
  className?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/** Bottom sheet: swipe down, tap outside or Esc to close. Glass panel in glass themes. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  'aria-label': ariaLabel,
  height = 'auto',
  dismissible = true,
  className,
}: SheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus in on open, trap Tab, Esc to close, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const raf = requestAnimationFrame(() => panelRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      previous?.focus?.();
    };
  }, [open, dismissible]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (dismissible && (info.offset.y > 120 || info.velocity.y > 600)) onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="pc-sheet-root">
          <motion.div
            className="pc-sheet-scrim"
            aria-hidden="true"
            onClick={dismissible ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : ariaLabel}
            tabIndex={-1}
            className={cx('pc-sheet', `pc-sheet--${height}`, 'pc-glass', 'pc-glass--overlay', 'pc-glass--lens', className)}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
            drag={dismissible ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            dragListener={false}
            dragControls={dragControls}
            onDragEnd={onDragEnd}
          >
            {/* Only the handle + header start the swipe, so scrolling the body never fights it. */}
            <div
              className={cx('pc-sheet__grabber', !dismissible && 'is-static')}
              aria-hidden="true"
              onPointerDown={(e) => dismissible && dragControls.start(e)}
            />
            {(title || dismissible) && (
              <div className="pc-sheet__header" onPointerDown={(e) => dismissible && dragControls.start(e)}>
                {title ? (
                  <h2 id={titleId} className="pc-sheet__title">
                    {title}
                  </h2>
                ) : (
                  <span />
                )}
                {dismissible && <IconButton icon={<CloseOutlined />} aria-label="Chiudi" variant="tinted" onClick={onClose} />}
              </div>
            )}
            <div className="pc-sheet__body">{children}</div>
            {footer && <div className="pc-sheet__footer">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

