/**
 * Scroll behaviour of the conversation (the page scroller is the PageScaffold element):
 *  - opens at the bottom, or at the "nuovi messaggi" marker when there is unread history;
 *  - follows new messages only when the reader is already near the bottom (or just sent one);
 *  - keeps the reading position when older messages are prepended;
 *  - stays pinned while content grows (images, pictograms, composer opening);
 *  - loads older messages when a top sentinel comes near the viewport.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from '@/theme';

interface Options {
  scrollRef: RefObject<HTMLDivElement | null>;
  firstKey?: string;
  lastKey?: string;
  count: number;
  /** The newest message is mine: always follow it. */
  lastOut: boolean;
  canLoadOlder: boolean;
  onLoadOlder: () => void;
}

const STUCK_PX = 96;
const USER_SCROLL_MS = 1200;
/** Older history starts loading this far from the top. */
const OLDER_PX = 800;

export function useChatScroll({ scrollRef, firstKey, lastKey, count, lastOut, canLoadOlder, onLoadOlder }: Options) {
  const reduced = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const stuck = useRef(true);
  /** Last wheel/touch/key/pointer input: only the reader can unpin the list, never layout shifts. */
  const lastInput = useRef(Number.NEGATIVE_INFINITY);
  /** Opened at the unread marker: keep it in place while content loads, until the reader scrolls. */
  const pinMarker = useRef(false);
  const anchor = useRef<{ node: Element; top: number } | null>(null);
  const prev = useRef({ firstKey, lastKey, count });
  const loadOlderRef = useRef(onLoadOlder);
  loadOlderRef.current = onLoadOlder;

  const [ready, setReady] = useState(false);

  // One request per page: re-armed whenever loading becomes possible again.
  const canLoad = useRef(false);
  canLoad.current = ready && canLoadOlder;
  const requested = useRef(false);
  useEffect(() => {
    requested.current = false;
  }, [canLoadOlder]);
  const requestOlder = useCallback(() => {
    if (requested.current || !canLoad.current) return;
    requested.current = true;
    loadOlderRef.current();
  }, []);
  const [away, setAway] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < STUCK_PX) stuck.current = true;
    else if (performance.now() - lastInput.current < USER_SCROLL_MS) stuck.current = false;
    setAway(distance > el.clientHeight * 0.6);
    if (stuck.current) setNewCount(0);
    if (anchor.current) anchor.current.top = anchor.current.node.getBoundingClientRect().top;
    // Fallback for the sentinel observer (some engines skip its updates on programmatic scrolls).
    if (el.scrollTop < OLDER_PX) requestOlder();
  }, [scrollRef, requestOlder]);

  /** Puts the "nuovi messaggi" marker just under the header. */
  const placeMarker = useCallback(() => {
    const el = scrollRef.current;
    const marker = markerRef.current;
    if (!el || !marker) return;
    const header = el.firstElementChild?.getBoundingClientRect().height ?? 0;
    el.scrollTop += marker.getBoundingClientRect().top - el.getBoundingClientRect().top - header - 8;
    stuck.current = el.scrollHeight - el.scrollTop - el.clientHeight < STUCK_PX;
  }, [scrollRef]);

  const scrollToBottom = useCallback(
    (smooth = false) => {
      const el = scrollRef.current;
      if (!el) return;
      stuck.current = true;
      pinMarker.current = false;
      el.scrollTo({
        top: el.scrollHeight,
        behavior: smooth && !reduced ? 'smooth' : 'auto',
      });
      setNewCount(0);
    },
    [scrollRef, reduced],
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const was = prev.current;
    prev.current = { firstKey, lastKey, count };
    if (!el || !count) return;

    if (!ready) {
      if (markerRef.current) {
        pinMarker.current = true;
        placeMarker();
      } else {
        el.scrollTop = el.scrollHeight;
      }
      setReady(true);
    } else if (lastKey !== was.lastKey) {
      if (stuck.current || lastOut) scrollToBottom(true);
      else setNewCount((n) => n + Math.max(1, count - was.count));
    } else if (firstKey !== was.firstKey && anchor.current?.node.isConnected) {
      // Older page prepended: put the previous first message back where it was on screen.
      const delta = anchor.current.node.getBoundingClientRect().top - anchor.current.top;
      if (Math.abs(delta) > 1) el.scrollTop += delta;
    }

    const first = firstKey ? contentRef.current?.querySelector(`[data-key="${firstKey}"]`) : null;
    anchor.current = first ? { node: first, top: first.getBoundingClientRect().top } : null;
    measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the visible range changes
  }, [firstKey, lastKey, count]);

  // Scroll tracking.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onInput = () => {
      lastInput.current = performance.now();
      pinMarker.current = false;
    };
    const inputs = ['wheel', 'touchmove', 'pointerdown'] as const;
    el.addEventListener('scroll', measure, { passive: true });
    for (const type of inputs) el.addEventListener(type, onInput, { passive: true });
    // Page keys scroll the page from wherever the focus is.
    window.addEventListener('keydown', onInput, { passive: true });
    return () => {
      el.removeEventListener('scroll', measure);
      for (const type of inputs) el.removeEventListener(type, onInput);
      window.removeEventListener('keydown', onInput);
    };
  }, [scrollRef, measure]);

  // Stay pinned while the list or the composer change size.
  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (pinMarker.current) placeMarker();
      else if (stuck.current) el.scrollTop = el.scrollHeight;
      measure();
    });
    ro.observe(content);
    if (el.lastElementChild && el.lastElementChild !== content) ro.observe(el.lastElementChild);
    return () => ro.disconnect();
  }, [scrollRef, measure, placeMarker]);

  // Older history: the observer is recreated after each page, re-checking the sentinel.
  useEffect(() => {
    const el = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!ready || !canLoadOlder || !el || !sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) requestOlder();
      },
      { root: el, rootMargin: `${OLDER_PX}px 0px 0px 0px` },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [ready, canLoadOlder, scrollRef, requestOlder]);

  return {
    contentRef,
    sentinelRef,
    markerRef,
    ready,
    away,
    newCount,
    scrollToBottom,
  };
}
