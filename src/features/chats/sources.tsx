/**
 * Data hooks used by the chat list, settings and pictogram pages, injectable so the components
 * stay data-agnostic: dev previews provide mock implementations without a Telegram session.
 */
import { createContext, useContext, type ReactNode } from 'react';
import type { ChatSummary, ConnectionState, Me, PeerId } from '@/core/types';
import { messaging, useAvatar, useChats, useConnection, useMe, useTyping } from '@/services/telegram';

export interface ChatListData {
  chats: ChatSummary[];
  loading: boolean;
  error?: string;
  refresh(): void;
}

export interface ChatSources {
  /** Object URL of a peer's profile photo (undefined while loading / no photo). */
  useAvatarUrl: (peerId: PeerId | undefined) => string | undefined;
  /** Ids of users typing in a chat. */
  useTypingIds: (chatId: PeerId) => PeerId[];
  useChatList: () => ChatListData;
  useMe: () => Me | null;
  useConnectionState: () => ConnectionState;
  sendFile: (chatId: PeerId, file: File, opts?: { caption?: string }) => Promise<unknown>;
  logout: () => Promise<void>;
}

export const liveSources: ChatSources = {
  useAvatarUrl: (peerId) => useAvatar(peerId),
  useTypingIds: (chatId) => useTyping(chatId),
  useChatList: () => useChats(),
  useMe: () => useMe(),
  useConnectionState: () => useConnection(),
  sendFile: (chatId, file, opts) => messaging.sendFile(chatId, file, opts),
  logout: () => messaging.logout(),
};

const SourcesContext = createContext<ChatSources>(liveSources);

export function ChatSourcesProvider({ value, children }: { value: ChatSources; children: ReactNode }) {
  return <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>;
}

export const useChatSources = (): ChatSources => useContext(SourcesContext);
