import { memo, useMemo } from 'react';
import {
  CheckOutlined,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  RedoOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import type { ChatMessage, MessageStatus } from '@/core/types';
import { parsePictogramShare, speak } from '@/services/aac';
import { IconButton, cx } from '@/components/ui';
import { useChatUi } from '../context';
import { formatTime, isEmojiOnly, linkify, mediaLabel } from '../lib/format';
import { BubblePictograms } from './BubblePictograms';
import { MessageMedia } from './MessageMedia';
import { PictogramShareCard } from './PictogramShareCard';
import './bubble.css';

export interface MessageBubbleProps {
  message: ChatMessage;
  /** First/last bubble of a group of consecutive messages from the same sender. */
  first: boolean;
  last: boolean;
  /** Effective delivery status (read ticks computed by the list). */
  status?: MessageStatus;
  /** Sender name above the bubble (groups, incoming, first of group). */
  senderName?: string;
  showTime: boolean;
  showPictograms: boolean;
}

const STATUS_LABEL: Record<MessageStatus, string> = {
  sending: 'Invio in corso',
  sent: 'Inviato',
  read: 'Letto',
  failed: 'Non inviato',
};

function StatusIcon({ status }: { status: MessageStatus }) {
  return (
    <span className={cx('ch-status', `ch-status--${status}`)} role="img" aria-label={STATUS_LABEL[status]}>
      {status === 'sending' && <ClockCircleOutlined />}
      {status === 'sent' && <CheckOutlined />}
      {status === 'read' && (
        <>
          <CheckOutlined />
          <CheckOutlined className="ch-status__second" />
        </>
      )}
      {status === 'failed' && <ExclamationCircleFilled />}
    </span>
  );
}

function MessageText({ text, big }: { text: string; big: boolean }) {
  const parts = useMemo(() => linkify(text), [text]);
  return (
    <p className={cx('ch-bubble__text', big && 'ch-bubble__text--emoji')}>
      {parts.map((p, i) =>
        p.type === 'link' ? (
          <a key={i} href={p.href} target="_blank" rel="noopener noreferrer" className="pc-keep-case">
            {p.value}
          </a>
        ) : (
          <span key={i}>{p.value}</span>
        ),
      )}
    </p>
  );
}

/** One message: text + pictogram translation, media, time and delivery status. Memoized. */
export const MessageBubble = memo(function MessageBubble({
  message,
  first,
  last,
  status,
  senderName,
  showTime,
  showPictograms,
}: MessageBubbleProps) {
  const { retry } = useChatUi();
  const { out, media } = message;
  const share = media?.kind === 'photo' ? parsePictogramShare(message.text) : null;
  // A pictogram share's caption is machine text ("#picto cibo: pizza"): the card replaces it.
  const text = share ? '' : message.text.trim();
  const emoji = !media && isEmojiOnly(text);
  const time = formatTime(message.date);
  const spoken = text || (media ? mediaLabel(media) : '');

  return (
    <div className={cx('ch-row', out ? 'ch-row--out' : 'ch-row--in', first && 'is-first', last && 'is-last')}>
      {senderName && <p className="ch-row__sender">{senderName}</p>}
      <div className="ch-row__line">
        <article className={cx('ch-bubble', emoji && 'ch-bubble--bare', media && !text && 'ch-bubble--media')}>
          <span className="pc-visually-hidden">
            {out ? 'Tu' : (message.senderName ?? 'Messaggio')}, {time}:{' '}
          </span>
          {share ? (
            <PictogramShareCard message={message} share={share} />
          ) : (
            media && <MessageMedia message={message} media={media} />
          )}
          {text && <MessageText text={text} big={emoji} />}
          {showPictograms && text && !emoji && <BubblePictograms text={text} />}
          {(showTime || status) && (
            <span className="ch-bubble__meta">
              {message.editDate && <span>modificato</span>}
              {showTime && <time dateTime={new Date(message.date).toISOString()}>{time}</time>}
              {out && status && <StatusIcon status={status} />}
            </span>
          )}
        </article>
        {spoken && !emoji && (
          <IconButton
            className="ch-row__speak"
            icon={<SoundOutlined />}
            aria-label="Ascolta il messaggio"
            onClick={() => void speak(spoken)}
          />
        )}
      </div>
      {status === 'failed' && (
        <button type="button" className="ch-retry" onClick={() => retry(message.id)}>
          <RedoOutlined aria-hidden="true" /> Non inviato. Tocca per riprovare
        </button>
      )}
    </div>
  );
});
