import { Suspense, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Spin } from 'antd';
import { messaging } from '@/services/telegram';
import { aac } from '@/services/aac';
import { feedback } from '@/lib/feedback';

/** App-wide side effects: session restore, vocab warm-up, incoming message feedback. */
export function AppRoot() {
  useEffect(() => {
    if (messaging.hasSession()) void messaging.restore().catch(() => undefined);
    // Warm the pictogram vocabulary in idle time so the first chat opens instantly.
    const warm = () => void aac.ready();
    const id = 'requestIdleCallback' in window ? requestIdleCallback(warm) : setTimeout(warm, 500);
    return () => {
      if ('cancelIdleCallback' in window) cancelIdleCallback(id as number);
      else clearTimeout(id as ReturnType<typeof setTimeout>);
    };
  }, []);

  useEffect(
    () =>
      messaging.subscribe((event) => {
        if (event.type === 'message:new' && !event.message.out) feedback('receive');
      }),
    [],
  );

  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <Outlet />
    </Suspense>
  );
}

export function FullscreenSpinner() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100dvh' }}>
      <Spin size="large" />
    </div>
  );
}
