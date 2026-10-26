import { useEffect, useState } from 'react';
import { LoadingOutlined, WifiOutlined } from '@ant-design/icons';
import type { ConnectionState, Presence } from '@/core/types';
import { Avatar, NavHeader } from '@/components/ui';
import { presenceText } from '../lib/format';

export interface ChatHeaderProps {
  title: string;
  avatarUrl?: string;
  presence?: Presence;
  typing: boolean;
  isGroup: boolean;
  connection: ConnectionState;
  onBack: () => void;
}

/** True only after `state` has lasted `delayMs`, so a normal start-up does not flash a banner. */
function useLate(active: boolean, delayMs = 1500): boolean {
  const [late, setLate] = useState(false);
  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => setLate(true), delayMs);
    return () => {
      window.clearTimeout(id);
      setLate(false);
    };
  }, [active, delayMs]);
  return active && late;
}

export function ChatHeader({ title, avatarUrl, presence, typing, isGroup, connection, onBack }: ChatHeaderProps) {
  // Presence is stale while offline: show nothing rather than a wrong "Online".
  const subtitle = typing
    ? isGroup
      ? 'Qualcuno sta scrivendo…'
      : 'Sta scrivendo…'
    : connection === 'connected'
      ? presenceText(presence)
      : undefined;
  const showBanner = useLate(connection !== 'connected');
  return (
    <div className="ch-top">
      <NavHeader
        onBack={onBack}
        backLabel="Torna alle chat"
        leading={
          <Avatar
            src={avatarUrl}
            name={title}
            size="sm"
            presence={connection === 'connected' ? presence : null}
            decorative
          />
        }
        title={title}
        subtitle={subtitle && <span className={typing ? 'ch-typing' : undefined}>{subtitle}</span>}
      />
      <div role="status" aria-live="polite">
        {showBanner && (
          <p className={connection === 'disconnected' ? 'ch-conn ch-conn--offline' : 'ch-conn'}>
            {connection === 'disconnected' ? (
              <WifiOutlined aria-hidden="true" />
            ) : (
              <LoadingOutlined aria-hidden="true" />
            )}
            <span>
              {connection === 'disconnected'
                ? 'Sei offline. I messaggi nuovi arrivano quando torna internet.'
                : 'Mi sto collegando…'}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
