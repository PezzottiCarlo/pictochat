import { StarFilled } from '@ant-design/icons';
import type { ChatSummary } from '@/core/types';
import { PictoStrip, useLongPress } from '@/components/ui';
import { usePictogramTokens, tokenColor } from '@/services/aac';
import { formatChatTime, messagePreview, presenceLabel } from '../chatListModel';
import { useChatSources } from '../sources';
import { ChatAvatar } from './bits';

export interface SimpleChatCardProps {
  chat: ChatSummary;
  now: number;
  favourite?: boolean;
  showPictograms?: boolean;
  onOpen: (chat: ChatSummary) => void;
  onMore?: (chat: ChatSummary) => void;
}

function LastMessagePictos({ text }: { text: string }) {
  const tokens = usePictogramTokens(text);
  const shown = tokens?.filter((t) => !t.skipped).slice(0, 5);
  if (!shown?.some((t) => t.pictogram)) return null;
  return <PictoStrip tokens={shown} size="sm" colorOf={tokenColor} className="cl-card__strip" aria-label="Ultimo messaggio in pittogrammi" />;
}

/** Simple mode: one big, friendly card per person. */
export function SimpleChatCard({ chat, now, favourite, showPictograms, onOpen, onMore }: SimpleChatCardProps) {
  const { useTypingIds } = useChatSources();
  const typing = useTypingIds(chat.id).length > 0;
  const preview = messagePreview(chat.lastMessage, chat.kind);
  const presence = presenceLabel(chat.presence, now);
  const press = useLongPress(onMore ? () => onMore(chat) : undefined);
  const unread = chat.unreadCount;
  const titleId = `cl-card-${chat.id}`;

  return (
    <li>
      <article className={unread ? 'cl-card is-unread' : 'cl-card'} aria-labelledby={titleId}>
        <button
          type="button"
          className="cl-card__button"
          onPointerDown={press.onPointerDown}
          onPointerUp={press.onPointerUp}
          onPointerLeave={press.onPointerLeave}
          onPointerCancel={press.onPointerCancel}
          onPointerMove={press.onPointerMove}
          onContextMenu={press.onContextMenu}
          onClick={press.guardClick(() => onOpen(chat))}
        >
          <span className="cl-card__head">
            <ChatAvatar chat={chat} size="lg" />
            <span className="cl-card__who">
              <span id={titleId} className="cl-card__name">
                {favourite && <StarFilled className="cl-flag--star cl-card__star" aria-label="Preferito" />}
                {chat.title}
              </span>
              {typing ? (
                <span className="cl-card__presence cl-card__presence--typing">sta scrivendo…</span>
              ) : (
                presence && <span className="cl-card__presence">{presence}</span>
              )}
            </span>
          </span>

          {unread > 0 && (
            <span className="cl-card__unread">{unread === 1 ? '1 messaggio nuovo' : `${unread} messaggi nuovi`}</span>
          )}

          {chat.lastMessage && (
            <span className="cl-card__last">
              <span className="cl-card__text">
                {preview.author && <span className="cl-row__author">{preview.author}: </span>}
                {preview.icon && <span aria-hidden="true">{preview.icon} </span>}
                {preview.text}
              </span>
              <span className="cl-card__time">{formatChatTime(chat.lastMessage.date, now)}</span>
            </span>
          )}
          {showPictograms && preview.pictogramText && !chat.lastMessage?.out && <LastMessagePictos text={preview.pictogramText} />}
          <span className="cl-card__cta" aria-hidden="true">
            Apri la chat
          </span>
        </button>
      </article>
    </li>
  );
}
