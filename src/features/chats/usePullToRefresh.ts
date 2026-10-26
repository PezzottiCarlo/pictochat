import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Touch pull-to-refresh on a scroll container: pulling down from the very top by `threshold`
 * px calls onRefresh. Returns the current pull distance (0 when idle) for the indicator.
 */
export function usePullToRefresh(
  ref: RefObject<HTMLElement | null>,
  onRefresh: () => void,
  { threshold = 72, enabled = true }: { threshold?: number; enabled?: boolean } = {},
): { distance: number; armed: boolean } {
  const [distance, setDistance] = useState(0);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let startY: number | null = null;
    let current = 0;
    const update = (d: number) => {
      current = d;
      setDistance(d);
    };
    const onStart = (e: TouchEvent) => {
      startY = el.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
    };
    const onMove = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || el.scrollTop > 0) {
        if (current) update(0);
        return;
      }
      // Resistance: the indicator moves at half the finger speed, capped.
      update(Math.min(dy * 0.5, threshold * 1.5));
    };
    const onEnd = () => {
      if (startY !== null && current >= threshold) cb.current();
      startY = null;
      if (current) update(0);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [ref, threshold, enabled]);

  return { distance, armed: distance >= threshold };
}
