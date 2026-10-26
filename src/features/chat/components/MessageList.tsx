import { memo, useMemo, type RefObject } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import type { ChatMessage, MessageStatus } from '@/core/types';
import { EmptyState } from '@/components/ui';
import { buildTimeline } from '../lib/timeline';
import { MessageBubble } from './MessageBubble';

export interface UnreadAnchor {
  id?: number;
  count: number;
}

export interface MessageListProps {
  messages: readonly ChatMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasOlder: boolean;
  isGroup: boolean;
  readOutboxMaxId?: number;
  unread?: UnreadAnchor;
  showTime: boolean;
  showPictograms: boolean;
  contentRef: RefObject<HTMLDivElement | null>;
  sentinelRef: RefObject<HTMLDivElement | null>;
  markerRef: RefObject<HTMLDivElement | null>;
}

function statusOf(m: ChatMessage, readMax: number | undefined): MessageStatus | undefined {
  if (!m.out || m.service) return undefined;
  if (m.status === 'sending' || m.status === 'failed') return m.status;
  if (m.status === 'read' || (readMax !== undefined && m.id > 0 && m.id <= readMax)) return 'read';
  return 'sent';
}

function Skeleton() {
  return (
    <div className="ch-skeleton" aria-busy="true" aria-label="Caricamento dei messaggi">
      {['in', 'in', 'out', 'in', 'out'].map((side, i) => (
        <span key={i} className={`ch-skeleton__bubble ch-skeleton__bubble--${side}`} />
      ))}
    </div>
  );
}

/** The conversation: day separators, unread marker, grouped bubbles. Pure presentation. */
export const MessageList = memo(function MessageList({
  messages,
  loading,
  loadingOlder,
  hasOlder,
  isGroup,
  readOutboxMaxId,
  unread,
  showTime,
  showPictograms,
  contentRef,
  sentinelRef,
  markerRef,
}: MessageListProps) {
  const items = useMemo(
    () =>
      buildTimeline(messages, {
        firstUnreadId: unread?.id,
        unreadCount: unread?.count,
      }),
    [messages, unread],
  );

  return (
    <section className="ch-list" ref={contentRef} aria-label="Messaggi">
      <div ref={sentinelRef} className="ch-list__sentinel" aria-hidden="true" />
      {loadingOlder && (
        <p className="ch-list__note" role="status">
          <LoadingOutlined aria-hidden="true" /> Carico i messaggi precedenti
        </p>
      )}
      {!hasOlder && messages.length > 0 && <p className="ch-list__note">Inizio della conversazione</p>}
      {loading && !messages.length && <Skeleton />}
      {!loading && !messages.length && (
        <EmptyState icon="👋" title="Nessun messaggio" description="Scegli i pittogrammi o scrivi per salutare." />
      )}
      {items.map((item) => {
        if (item.type === 'day') {
          return (
            <div key={item.key} className="ch-day" role="separator" aria-label={item.label}>
              <span>{item.label}</span>
            </div>
          );
        }
        if (item.type === 'unread') {
          return (
            <div key={item.key} ref={markerRef} className="ch-unread" role="separator">
              <span>
                {item.count === 1
                  ? '1 messaggio nuovo'
                  : item.count > 1
                    ? `${item.count} messaggi nuovi`
                    : 'Messaggi nuovi'}
              </span>
            </div>
          );
        }
        const m = item.message;
        if (m.service) {
          return (
            <div key={item.key} data-key={item.key} className="ch-item ch-service">
              <p>{m.text || 'Evento della chat'}</p>
            </div>
          );
        }
        return (
          <div key={item.key} data-key={item.key} className="ch-item">
            <MessageBubble
              message={m}
              first={item.first}
              last={item.last}
              status={statusOf(m, readOutboxMaxId)}
              senderName={isGroup && !m.out && item.first ? m.senderName : undefined}
              showTime={showTime}
              showPictograms={showPictograms}
            />
          </div>
        );
      })}
    </section>
  );
});
