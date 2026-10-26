import { useCallback, useEffect, useState } from 'react';

/** Seconds left until `until` (ms epoch), ticking every second; 0 when idle. */
export function useCountdown() {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until <= Date.now()) return;
    const timer = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= until) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [until]);

  const start = useCallback((seconds: number) => {
    const t = Date.now();
    setNow(t);
    setUntil(t + seconds * 1000);
  }, []);

  const reset = useCallback(() => setUntil(0), []);

  return { left: Math.max(0, Math.ceil((until - now) / 1000)), start, reset };
}

/** 75 → "1:15". */
export const formatSeconds = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
