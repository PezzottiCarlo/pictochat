/**
 * What deep chat components need from the screen without prop drilling (and without importing
 * the Telegram layer, so they render with mock data in the dev preview).
 */
import { createContext, useContext } from 'react';
import type { PeerId, Pictogram } from '@/core/types';

export interface MediaState {
  url?: string;
  loading: boolean;
  error?: boolean;
}

/** Same signature as `useMediaUrl` from the Telegram layer (a hook: call unconditionally). */
export type UseMediaUrl = (chatId: PeerId, messageId: number, enabled?: boolean) => MediaState;

export interface PhotoView {
  url: string;
  caption?: string;
  fileName?: string;
}

export interface ChatUi {
  chatId: PeerId;
  useMediaUrl: UseMediaUrl;
  openPhoto: (photo: PhotoView) => void;
  openPictogram: (pictogram: Pictogram) => void;
  retry: (messageId: number) => void;
}

const noMedia: UseMediaUrl = () => ({ loading: false, error: true });

export const ChatUiContext = createContext<ChatUi>({
  chatId: '',
  useMediaUrl: noMedia,
  openPhoto: () => undefined,
  openPictogram: () => undefined,
  retry: () => undefined,
});

export const useChatUi = (): ChatUi => useContext(ChatUiContext);
