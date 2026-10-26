/** Small building blocks shared by the chat list views. */
import { useEffect, useState } from 'react';
import type { ChatSummary } from '@/core/types';
import { Avatar, type AvatarProps } from '@/components/ui';
import { usePictogramTokens } from '@/services/aac';
import { useChatSources } from '../sources';
import './chats.css';

export function ChatAvatar({
  chat,
  size = 'md',
  showPresence = true,
}: {
  chat: Pick<ChatSummary, 'id' | 'title' | 'hasPhoto' | 'presence'>;
  size?: AvatarProps['size'];
  showPresence?: boolean;
}) {
  const { useAvatarUrl } = useChatSources();
  const url = useAvatarUrl(chat.hasPhoto ? chat.id : undefined);
  return <Avatar src={url} name={chat.title} size={size} presence={showPresence ? chat.presence : null} decorative />;
}

/** Up to `max` tiny pictograms for a short text (decorative: the text itself is next to them). */
export function MiniPictos({ text, max = 4 }: { text: string; max?: number }) {
  const tokens = usePictogramTokens(text);
  const pics = tokens?.flatMap((t) => (t.pictogram && !t.skipped ? [t.pictogram] : [])).slice(0, max);
  if (!pics?.length) return null;
  return (
    <span className="cl-minis" aria-hidden="true">
      {pics.map((p, i) => (
        <span key={`${p.id}:${i}`} className="cl-mini">
          <img
            src={p.url}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={(e) => (e.currentTarget.parentElement!.hidden = true)}
          />
        </span>
      ))}
    </span>
  );
}

/** Unread counter; grey when the chat is muted. */
export function UnreadBadge({ count, muted }: { count: number; muted?: boolean }) {
  if (count <= 0) return null;
  return (
    <span className={muted ? 'cl-badge cl-badge--muted' : 'cl-badge'} aria-hidden="true">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Re-renders every `ms` so relative times ("Ieri", "14:05") stay correct. */
export function useNow(ms = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

export function TypingDots() {
  return (
    <span className="cl-typing">
      <span className="cl-typing__dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      sta scrivendo
    </span>
  );
}
