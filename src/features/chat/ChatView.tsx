import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ArrowDownOutlined } from '@ant-design/icons';
import type { ChatMessage, ConnectionState, PeerId, Pictogram, Presence } from '@/core/types';
import { speak } from '@/services/aac';
import { useSettings } from '@/stores/settings';
import { PageScaffold } from '@/components/ui';
import { ChatUiContext, type ChatUi, type PhotoView, type UseMediaUrl } from './context';
import { ChatHeader } from './components/ChatHeader';
import { MessageList, type UnreadAnchor } from './components/MessageList';
import { PhotoViewer, PictogramSheet } from './components/Overlays';
import { Composer } from './composer/Composer';
import { useChatScroll } from './hooks/useChatScroll';
import { useAnnouncer, useIncoming } from './hooks/useIncoming';
import { mediaLabel } from './lib/format';
import { firstUnreadId, lastIncomingText, messageKey } from './lib/timeline';
import './chat.css';

export interface ChatViewProps {
  chatId: PeerId;
  title: string;
  avatarUrl?: string;
  presence?: Presence;
  typing: boolean;
  isGroup: boolean;
  connection: ConnectionState;
  messages: ChatMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasOlder: boolean;
  /** Unread count when the chat was opened (for the "nuovi messaggi" marker). */
  unreadCount: number;
  readOutboxMaxId?: number;
  useMediaUrl: UseMediaUrl;
  onBack: () => void;
  onLoadOlder: () => void;
  onSendText: (text: string) => void;
  onSendFile: (file: File, caption?: string) => void;
  onRetry: (messageId: number) => void;
}

/** The chat screen, free of data fetching: everything comes in through props. */
export const ChatView = memo(function ChatView(props: ChatViewProps) {
  const { chatId, title, messages, loading, loadingOlder, hasOlder, useMediaUrl, onRetry, onLoadOlder } = props;
  const settings = useSettings(
    useShallow((s) => ({
      showTimestamps: s.showTimestamps,
      showPictograms: s.showPictograms,
      autoSpeak: s.autoSpeak,
    })),
  );
  const [photo, setPhoto] = useState<PhotoView | null>(null);
  const [pictogram, setPictogram] = useState<Pictogram | null>(null);
  const [announcement, announce] = useAnnouncer();
  const scrollRef = useRef<HTMLDivElement>(null);

  // The unread marker is frozen at the first render with messages (reading clears the count).
  const [unread, setUnread] = useState<UnreadAnchor | null>(null);
  if (unread === null && messages.length > 0) {
    setUnread({
      id: firstUnreadId(messages, props.unreadCount),
      count: props.unreadCount,
    });
  }

  const last = messages[messages.length - 1];
  const scroll = useChatScroll({
    scrollRef,
    firstKey: messages[0] && messageKey(messages[0]),
    lastKey: last && messageKey(last),
    count: messages.length,
    lastOut: !!last?.out,
    canLoadOlder: hasOlder && !loadingOlder && !loading,
    onLoadOlder,
  });

  useIncoming(messages, (fresh) => {
    const m = fresh[fresh.length - 1];
    const body = m.text.trim() || (m.media ? mediaLabel(m.media) : '');
    announce(`${m.senderName ?? title}: ${body}`);
    if (settings.autoSpeak && m.text.trim()) void speak(m.text);
  });

  const ui = useMemo<ChatUi>(
    () => ({
      chatId,
      useMediaUrl,
      openPhoto: setPhoto,
      openPictogram: setPictogram,
      retry: onRetry,
    }),
    [chatId, useMediaUrl, onRetry],
  );
  const lastIncoming = useMemo(() => lastIncomingText(messages), [messages]);
  const closePhoto = useCallback(() => setPhoto(null), []);

  // null (not a new element) while not needed, so the memoized composer skips re-renders.
  const jump = scroll.away ? (
    <button type="button" className="ch-jump" onClick={() => scroll.scrollToBottom(true)}>
      <ArrowDownOutlined aria-hidden="true" />
      {scroll.newCount > 0
        ? scroll.newCount === 1
          ? '1 nuovo messaggio'
          : `${scroll.newCount} nuovi messaggi`
        : 'Vai in fondo'}
    </button>
  ) : null;

  return (
    <ChatUiContext value={ui}>
      <PageScaffold
        className="ch-page"
        contentClassName="ch-content"
        padded={false}
        scrollRef={scrollRef}
        header={
          <ChatHeader
            title={title}
            avatarUrl={props.avatarUrl}
            presence={props.presence}
            typing={props.typing}
            isGroup={props.isGroup}
            connection={props.connection}
            onBack={props.onBack}
          />
        }
        footer={
          <Composer
            lastIncoming={lastIncoming}
            onSendText={props.onSendText}
            onSendFile={props.onSendFile}
            onPictogramLongPress={setPictogram}
            overlay={jump}
          />
        }
      >
        <MessageList
          messages={messages}
          loading={loading}
          loadingOlder={loadingOlder}
          hasOlder={hasOlder}
          isGroup={props.isGroup}
          readOutboxMaxId={props.readOutboxMaxId}
          unread={unread ?? undefined}
          showTime={settings.showTimestamps}
          showPictograms={settings.showPictograms}
          contentRef={scroll.contentRef}
          sentinelRef={scroll.sentinelRef}
          markerRef={scroll.markerRef}
        />
        <div className="pc-visually-hidden" aria-live="polite" aria-atomic="true">
          {announcement}
        </div>
      </PageScaffold>
      <PhotoViewer photo={photo} onClose={closePhoto} />
      <PictogramSheet pictogram={pictogram} onClose={() => setPictogram(null)} />
    </ChatUiContext>
  );
});
