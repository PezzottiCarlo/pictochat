/**
 * Public API of the messaging layer. The UI imports only from here; GramJS is
 * loaded lazily on first use (never part of the main chunk).
 */
export { messaging } from './service';
export {
  useConnection,
  useChats,
  useChat,
  useMessages,
  useMe,
  useTyping,
} from './hooks';
export { useAvatar } from './avatars';
export { useMediaUrl } from './media';
export { setActiveChat } from './sync';
export { TelegramAuthError, type TelegramAuthErrorCode } from './errors';
export type { MessagingService, SignInResult } from './contract';
