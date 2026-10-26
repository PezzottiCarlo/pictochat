/** React data hooks (see contract.ts). All are cache-first and share one store. */
import { useCallback, useEffect, useMemo } from 'react';
import type { ChatMessage, ChatSummary, ConnectionState, Me, PeerId } from '@/core/types';
import { avatarCache, retryVisibleAvatars } from './avatars';
import { mediaCache, retryVisibleMedia } from './media';
import { messaging, meChanged } from './service';
import { EMPTY_THREAD, useMessagingStore } from './store';
import {
  ensureSync,
  loadChats,
  loadOlder,
  markReadIfVisible,
  refreshChats,
  retainThread,
  retry,
  sendFile,
  sendText,
} from './sync';

let wired = false;

function wire(): void {
  ensureSync();
  if (wired) return;
  wired = true;
  messaging.subscribe((e) => {
    if (e.type === 'connection' && e.state === 'connected') {
      retryVisibleAvatars();
      retryVisibleMedia();
    }
  });
  meChanged.on((me) => {
    if (!me) {
      avatarCache.clear();
      mediaCache.clear();
    }
  });
}

wire();

export function useConnection(): ConnectionState {
  return useMessagingStore((s) => s.connection);
}

export function useMe(): Me | null {
  return useMessagingStore((s) => s.me);
}

export function useChats(): { chats: ChatSummary[]; loading: boolean; error?: string; refresh(): void } {
  const chats = useMessagingStore((s) => s.chats);
  const loading = useMessagingStore((s) => s.chatsLoading);
  const error = useMessagingStore((s) => s.chatsError);
  const me = useMessagingStore((s) => s.me);

  useEffect(() => {
    if (me) void loadChats();
  }, [me]);

  const refresh = useCallback(() => void refreshChats(), []);
  return { chats, loading, error, refresh };
}

export function useChat(chatId: PeerId): ChatSummary | undefined {
  return useMessagingStore((s) => s.chats.find((c) => c.id === chatId));
}

/** Users currently typing in a chat (ids). */
export function useTyping(chatId: PeerId): PeerId[] {
  const users = useMessagingStore((s) => s.typing[chatId]);
  return useMemo(() => (users ? Object.keys(users) : []), [users]);
}

export function useMessages(chatId: PeerId): {
  messages: ChatMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasOlder: boolean;
  loadOlder(): Promise<void>;
  sendText(text: string): Promise<void>;
  sendFile(file: File, caption?: string): Promise<void>;
  retry(localId: number): Promise<void>;
} {
  const thread = useMessagingStore((s) => s.threads[chatId] ?? EMPTY_THREAD);
  const isActive = useMessagingStore((s) => s.activeChatId === chatId);

  useEffect(() => retainThread(chatId), [chatId]);

  // Read marks only while this chat is the open one and the page is visible.
  useEffect(() => {
    if (!isActive) return;
    markReadIfVisible(chatId);
    const onVisibility = () => markReadIfVisible(chatId);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [isActive, chatId, thread.messages, thread.loading]);

  const actions = useMemo(
    () => ({
      loadOlder: () => loadOlder(chatId),
      sendText: (text: string) => sendText(chatId, text),
      sendFile: (file: File, caption?: string) => sendFile(chatId, file, caption),
      retry: (localId: number) => retry(localId),
    }),
    [chatId],
  );

  return {
    messages: thread.messages,
    // Spinner only when there is nothing to show yet (cache hits render immediately).
    loading: (thread === EMPTY_THREAD || thread.loading) && thread.messages.length === 0,
    loadingOlder: thread.loadingOlder,
    hasOlder: thread.hasOlder,
    ...actions,
  };
}
