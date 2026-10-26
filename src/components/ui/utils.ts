import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent, type MouseEvent } from 'react';

/** Join class names, skipping falsy values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** CSS custom properties are not in CSSProperties; this keeps inline styles typed. */
export type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>;

export interface LongPressHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onPointerMove: (e: PointerEvent) => void;
  onContextMenu: (e: MouseEvent) => void;
  /** Wrap your click handler: swallows the click that ends a long press. */
  guardClick: <E>(handler?: (e: E) => void) => (e: E) => void;
}

/**
 * Long press for touch/pen (timer) + context menu (right click, keyboard menu key).
 * Movement > 10px cancels, so scrolling a strip of tiles never triggers it.
 */
export function useLongPress(onLongPress: (() => void) | undefined, delay = 520): LongPressHandlers {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
    origin.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  return {
    onPointerDown: (e) => {
      fired.current = false;
      if (!onLongPress || e.pointerType === 'mouse') return;
      origin.current = { x: e.clientX, y: e.clientY };
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress();
      }, delay);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onPointerMove: (e) => {
      const o = origin.current;
      if (o && Math.hypot(e.clientX - o.x, e.clientY - o.y) > 10) clear();
    },
    onContextMenu: (e) => {
      if (!onLongPress) return;
      e.preventDefault();
      if (fired.current) return; // the touch timer already handled it
      // A touch is still down (OS long-press menu came first): swallow its trailing click.
      if (timer.current !== undefined) fired.current = true;
      clear();
      onLongPress();
    },
    guardClick:
      <E,>(handler?: (e: E) => void) =>
      (e: E) => {
        if (fired.current) {
          fired.current = false;
          return;
        }
        handler?.(e);
      },
  };
}
