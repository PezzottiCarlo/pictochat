/** Mock data for the dev previews of the chat list, settings and pictogram pages. */
import type { ChatMessage, ChatSummary, Me } from '@/core/types';
import type { ChatSources } from '../sources';

const MIN = 60_000;
const now = Date.now();

const msg = (chatId: string, text: string, ago: number, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: Math.round(ago),
  chatId,
  out: false,
  date: now - ago,
  text,
  ...over,
});

export const MOCK_ME: Me = { id: '100', firstName: 'Giulia', lastName: 'Rossi', username: 'giulia_r', phone: '393331234567' };

export const MOCK_CHATS: ChatSummary[] = [
  {
    id: '1',
    kind: 'user',
    title: 'Mamma',
    unreadCount: 2,
    pinned: true,
    muted: false,
    hasPhoto: false,
    presence: { state: 'online' },
    lastMessage: msg('1', 'Vieni a mangiare la pizza?', 3 * MIN),
  },
  {
    id: '2',
    kind: 'user',
    title: 'Papà',
    unreadCount: 0,
    pinned: false,
    muted: false,
    hasPhoto: false,
    presence: { state: 'offline', lastSeen: now - 50 * MIN },
    lastMessage: msg('2', 'Sto arrivando a casa', 40 * MIN, { out: true }),
  },
  {
    id: '3',
    kind: 'user',
    title: 'Nonna Lucia',
    unreadCount: 1,
    pinned: false,
    muted: false,
    hasPhoto: false,
    presence: { state: 'recently' },
    lastMessage: msg('3', '', 26 * 60 * MIN, { media: { kind: 'photo' } }),
  },
  {
    id: '4',
    kind: 'group',
    title: 'Famiglia',
    unreadCount: 14,
    pinned: false,
    muted: true,
    hasPhoto: false,
    lastMessage: msg('4', 'Domenica andiamo al mare tutti insieme', 2 * 24 * 60 * MIN, { senderName: 'Zio Marco' }),
  },
  {
    id: '5',
    kind: 'user',
    title: 'Luca (scuola)',
    unreadCount: 0,
    pinned: false,
    muted: false,
    hasPhoto: false,
    presence: { state: 'lastWeek' },
    lastMessage: msg('5', '', 4 * 24 * 60 * MIN, { media: { kind: 'voice', duration: 12 } }),
  },
  {
    id: '6',
    kind: 'channel',
    title: 'Notizie della scuola',
    unreadCount: 3,
    pinned: false,
    muted: true,
    hasPhoto: false,
    lastMessage: msg('6', 'Domani la scuola resta chiusa per la neve', 9 * 24 * 60 * MIN),
  },
  {
    id: '7',
    kind: 'user',
    title: 'Sara',
    unreadCount: 0,
    pinned: false,
    muted: false,
    hasPhoto: false,
    lastMessage: msg('7', 'Ciao! Ci vediamo al parco?', 20 * 24 * 60 * MIN),
  },
];

export type MockState = 'ok' | 'loading' | 'empty' | 'error' | 'offline';

export function mockSources(state: MockState = 'ok'): ChatSources {
  const chats = state === 'ok' || state === 'offline' ? MOCK_CHATS : [];
  return {
    useAvatarUrl: () => undefined,
    useTypingIds: (chatId) => (chatId === '2' ? ['2'] : []),
    useChatList: () => ({
      chats,
      loading: state === 'loading',
      error: state === 'error' ? 'NETWORK_ERROR' : undefined,
      refresh: () => console.info('[dev] refresh'),
    }),
    useMe: () => MOCK_ME,
    useConnectionState: () => (state === 'offline' ? 'disconnected' : 'connected'),
    sendFile: async (chatId, file, opts) => {
      console.info('[dev] sendFile', chatId, file.name, file.size, opts);
      await new Promise((r) => setTimeout(r, 700));
    },
    logout: async () => console.info('[dev] logout'),
  };
}
