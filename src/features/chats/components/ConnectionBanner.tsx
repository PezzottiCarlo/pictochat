import { useEffect, useState } from 'react';
import { LoadingOutlined, WifiOutlined } from '@ant-design/icons';
import type { ConnectionState } from '@/core/types';

/** "Connecting" only after a short delay, so a normal start-up does not flash a banner. */
export function ConnectionBanner({ connection, delayMs = 1500 }: { connection: ConnectionState; delayMs?: number }) {
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (connection === 'connected') return;
    const id = window.setTimeout(() => setLate(true), delayMs);
    return () => {
      window.clearTimeout(id);
      setLate(false);
    };
  }, [connection, delayMs]);

  const visible = connection !== 'connected' && late;
  return (
    <div role="status" aria-live="polite" className="cl-conn-slot">
      {visible && (
        <div className={connection === 'disconnected' ? 'cl-conn cl-conn--offline' : 'cl-conn'}>
          <span className="cl-conn__icon" aria-hidden="true">
            {connection === 'disconnected' ? <WifiOutlined /> : <LoadingOutlined />}
          </span>
          <span>
            {connection === 'disconnected' ? (
              <>
                <strong>Sei offline.</strong> Vedi le chat salvate sul telefono: si aggiornano quando torna internet.
              </>
            ) : (
              'Mi sto collegando…'
            )}
          </span>
        </div>
      )}
    </div>
  );
}
