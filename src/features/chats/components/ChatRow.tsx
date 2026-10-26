import { memo } from 'react';
import { PushpinFilled, StarFilled } from '@ant-design/icons';
import type { ChatSummary } from '@/core/types';
import { useLongPress } from '@/components/ui';
import { formatChatTime, messagePreview, rowAccessibleName } from '../chatListModel';
import { useChatSources } from '../sources';
import { ChatAvatar, MiniPictos, TypingDots, UnreadBadge } from './bits';

export interface ChatRowProps {
  chat: ChatSummary;
  now: number;
  favourite?: boolean;
  showPictograms?: boolean;
  onOpen: (chat: ChatSummary) => void;
  /** Long press / right click / menu key: more actions (favourite, listen…). */
  onMore?: (chat: ChatSummary) => void;
}

function MutedIcon() {
  // Bell with a slash: antd has no muted bell in v6.
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M6 16V11a6 6 0 0 1 9.2-5.1M18 11v5l2 2H6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

export const ChatRow = memo(function ChatRow({ chat, now, favourite, showPictograms, onOpen, onMore }: ChatRowProps) {
  const { useTypingIds } = useChatSources();
  const typing = useTypingIds(chat.id).length > 0;
  const preview = messagePreview(chat.lastMessage, chat.kind);
  const press = useLongPress(onMore ? () => onMore(chat) : undefined);
  const unread = chat.unreadCount > 0;

  return (
    <li className="cl-row-item">
      <button
        type="button"
        className={unread ? 'cl-row is-unread' : 'cl-row'}
        aria-label={rowAccessibleName(chat, preview, typing, now)}
        onPointerDown={press.onPointerDown}
        onPointerUp={press.onPointerUp}
        onPointerLeave={press.onPointerLeave}
        onPointerCancel={press.onPointerCancel}
        onPointerMove={press.onPointerMove}
        onContextMenu={press.onContextMenu}
        onClick={press.guardClick(() => onOpen(chat))}
      >
        <ChatAvatar chat={chat} />
        <span className="cl-row__main">
          <span className="cl-row__top">
            <span className="cl-row__title">{chat.title}</span>
            {chat.lastMessage && <span className="cl-row__time">{formatChatTime(chat.lastMessage.date, now)}</span>}
          </span>
          <span className="cl-row__bottom">
            <span className="cl-row__preview">
              {typing ? (
                <TypingDots />
              ) : (
                <>
                  {preview.author && <span className="cl-row__author">{preview.author}: </span>}
                  {preview.icon && <span aria-hidden="true">{preview.icon} </span>}
                  {preview.text}
                </>
              )}
            </span>
            <span className="cl-row__flags" aria-hidden="true">
              {favourite && <StarFilled className="cl-flag cl-flag--star" />}
              {chat.pinned && <PushpinFilled className="cl-flag" />}
              {chat.muted && (
                <span className="cl-flag">
                  <MutedIcon />
                </span>
              )}
              <UnreadBadge count={chat.unreadCount} muted={chat.muted} />
            </span>
          </span>
          {showPictograms && !typing && preview.pictogramText && <MiniPictos text={preview.pictogramText} />}
        </span>
      </button>
    </li>
  );
});

export function ChatRowSkeleton() {
  return (
    <li className="cl-row-item" aria-hidden="true">
      <span className="cl-row cl-row--skeleton">
        <span className="cl-skel cl-skel--avatar" />
        <span className="cl-row__main">
          <span className="cl-skel cl-skel--line" style={{ width: '46%' }} />
          <span className="cl-skel cl-skel--line" style={{ width: '78%' }} />
        </span>
      </span>
    </li>
  );
}
