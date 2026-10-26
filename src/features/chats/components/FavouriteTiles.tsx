import type { ChatSummary } from '@/core/types';
import { useLongPress } from '@/components/ui';
import { useChatSources } from '../sources';
import { ChatAvatar, UnreadBadge } from './bits';

interface TileProps {
  chat: ChatSummary;
  onOpen: (chat: ChatSummary) => void;
  onMore?: (chat: ChatSummary) => void;
}

function FavouriteTile({ chat, onOpen, onMore }: TileProps) {
  const { useTypingIds } = useChatSources();
  const typing = useTypingIds(chat.id).length > 0;
  const press = useLongPress(onMore ? () => onMore(chat) : undefined);
  const unread = chat.unreadCount;
  const label = [
    chat.title,
    unread ? (unread === 1 ? '1 messaggio nuovo' : `${unread} messaggi nuovi`) : null,
    typing ? 'sta scrivendo' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <li>
      <button
        type="button"
        className={unread ? 'cl-fav is-unread' : 'cl-fav'}
        aria-label={label}
        onPointerDown={press.onPointerDown}
        onPointerUp={press.onPointerUp}
        onPointerLeave={press.onPointerLeave}
        onPointerCancel={press.onPointerCancel}
        onPointerMove={press.onPointerMove}
        onContextMenu={press.onContextMenu}
        onClick={press.guardClick(() => onOpen(chat))}
      >
        <span className="cl-fav__avatar">
          <ChatAvatar chat={chat} size="lg" />
          <UnreadBadge count={unread} muted={chat.muted} />
        </span>
        <span className="cl-fav__name">{chat.title}</span>
        {typing && (
          <span className="cl-fav__typing" aria-hidden="true">
            sta scrivendo…
          </span>
        )}
      </button>
    </li>
  );
}

/** Starred chats as big tiles: the people this device talks to most, one tap away. */
export function FavouriteTiles({
  chats,
  onOpen,
  onMore,
  labelledBy,
}: {
  chats: ChatSummary[];
  onOpen: (chat: ChatSummary) => void;
  onMore?: (chat: ChatSummary) => void;
  labelledBy: string;
}) {
  return (
    <ul className="cl-favs" aria-labelledby={labelledBy}>
      {chats.map((c) => (
        <FavouriteTile key={c.id} chat={c} onOpen={onOpen} onMore={onMore} />
      ))}
    </ul>
  );
}
