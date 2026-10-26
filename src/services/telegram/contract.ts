/**
 * Contract of the messaging layer. Implemented in this folder on top of GramJS;
 * the UI only ever imports from `@/services/telegram` (index.ts), never from 'telegram'.
 *
 * Required exports of `src/services/telegram/index.ts`:
 *
 *   export const messaging: MessagingService;
 *
 *   // React data hooks (cache-first: IndexedDB snapshot immediately, then network refresh)
 *   export function useConnection(): ConnectionState;
 *   export function useChats(): { chats: ChatSummary[]; loading: boolean; error?: string; refresh(): void };
 *   export function useChat(chatId: PeerId): ChatSummary | undefined;
 *   export function useMessages(chatId: PeerId): {
 *     messages: ChatMessage[];          // ascending by date/id, includes optimistic ones
 *     loading: boolean;
 *     loadingOlder: boolean;
 *     hasOlder: boolean;
 *     loadOlder(): Promise<void>;
 *     sendText(text: string): Promise<void>;          // optimistic + reconcile
 *     sendFile(file: File, caption?: string): Promise<void>;
 *     retry(localId: number): Promise<void>;
 *   };
 *   export function useAvatar(peerId: PeerId | undefined, opts?: { big?: boolean }): string | undefined; // object URL
 *   export function useMediaUrl(chatId: PeerId, messageId: number, enabled?: boolean): { url?: string; loading: boolean; error?: boolean };
 *   export function useMe(): Me | null;
 */
import type {
  ChatMessage,
  ChatSummary,
  ConnectionState,
  Me,
  MessagingEvent,
  PeerId,
} from '@/core/types';

export type SignInResult =
  | { status: 'ok'; me: Me }
  | { status: 'password_needed'; hint?: string }
  | { status: 'signup_required' };

export interface MessagingService {
  readonly connection: ConnectionState;

  // --- auth --------------------------------------------------------------
  /** Restore the saved session; resolves to the logged user or null. */
  restore(): Promise<Me | null>;
  hasSession(): boolean;
  sendCode(phone: string): Promise<{ phoneCodeHash: string; viaApp: boolean }>;
  signIn(args: { phone: string; code: string; phoneCodeHash: string }): Promise<SignInResult>;
  /** Two-step verification (cloud password). */
  checkPassword(password: string): Promise<Me>;
  /** Logs out from Telegram (best effort) and wipes every local cache. */
  logout(): Promise<void>;

  // --- data --------------------------------------------------------------
  getMe(): Promise<Me>;
  listChats(): Promise<ChatSummary[]>;
  /** Ascending order. `beforeId` pages backwards. */
  getHistory(chatId: PeerId, opts: { limit: number; beforeId?: number }): Promise<ChatMessage[]>;
  sendText(chatId: PeerId, text: string): Promise<ChatMessage>;
  sendFile(chatId: PeerId, file: File, opts?: { caption?: string }): Promise<ChatMessage>;
  markRead(chatId: PeerId, maxId?: number): Promise<void>;
  downloadMedia(chatId: PeerId, messageId: number): Promise<Blob | null>;
  getAvatar(peerId: PeerId, opts?: { big?: boolean }): Promise<Blob | null>;

  subscribe(listener: (event: MessagingEvent) => void): () => void;
}
