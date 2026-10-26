import { create } from 'zustand';
import type { ChatMessage, ChatSummary, ConnectionState, Me, PeerId } from '@/core/types';
import { getConnectionState } from './client';
import { readCachedMe } from './service';

export interface ThreadState {
  /** Ascending; optimistic messages (negative ids) at the bottom. */
  messages: ChatMessage[];
  loading: boolean;
  loadingOlder: boolean;
  hasOlder: boolean;
  /**
   * Refreshed from the network since the last (re)connection, so realtime events can
   * be merged without risking hidden gaps. Non-live threads only accept edits/deletes.
   */
  live: boolean;
  /** Highest server id known to be contiguous with the rest of the list. */
  anchorId: number;
}

export interface MessagingState {
  connection: ConnectionState;
  me: Me | null;
  chats: ChatSummary[];
  chatsLoaded: boolean;
  chatsLoading: boolean;
  chatsError?: string;
  activeChatId: PeerId | null;
  threads: Record<PeerId, ThreadState>;
  /** chatId → users currently typing (with expiry, ms epoch). */
  typing: Record<PeerId, Record<PeerId, number>>;
}

export const EMPTY_THREAD: ThreadState = Object.freeze({
  messages: [],
  loading: false,
  loadingOlder: false,
  hasOlder: true,
  live: false,
  anchorId: 0,
}) as ThreadState;

function initialState(): MessagingState {
  return {
    connection: getConnectionState(),
    me: readCachedMe(),
    chats: [],
    chatsLoaded: false,
    chatsLoading: false,
    activeChatId: null,
    threads: {},
    typing: {},
  };
}

export const useMessagingStore = create<MessagingState>()(initialState);

export function resetMessagingStore(me: Me | null = null): void {
  useMessagingStore.setState({ ...initialState(), me, connection: getConnectionState() }, true);
}

export function getThread(chatId: PeerId): ThreadState | undefined {
  return useMessagingStore.getState().threads[chatId];
}

export function patchThread(
  chatId: PeerId,
  patch: Partial<ThreadState> | ((thread: ThreadState) => Partial<ThreadState>),
): void {
  useMessagingStore.setState((s) => {
    const prev = s.threads[chatId] ?? EMPTY_THREAD;
    const next = typeof patch === 'function' ? patch(prev) : patch;
    return { threads: { ...s.threads, [chatId]: { ...prev, ...next } } };
  });
}

export function setChats(update: (chats: ChatSummary[]) => ChatSummary[]): void {
  useMessagingStore.setState((s) => {
    const chats = update(s.chats);
    return chats === s.chats ? s : { chats };
  });
}
