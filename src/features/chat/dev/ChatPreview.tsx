/**
 * Dev page (`/dev/chat`): the chat screen with mock data, no Telegram login needed.
 * Query params: ?empty=1 · ?loading=1 · ?group=1 · ?offline=1 · ?unread=3
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, ConnectionState, MediaInfo } from '@/core/types';
import { formatPictogramShare } from '@/services/aac';
import type { MediaState, UseMediaUrl } from '../context';
import { ChatView } from '../ChatView';

const CHAT = 'preview';
const HOUR = 3_600_000;

/** Mock image (an SVG landscape) — colours here are image content, not UI styling. */
const svg = (hue: number, label: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="hsl(${hue},60%,72%)"/><circle cx="620" cy="140" r="70" fill="hsl(${hue + 40},90%,85%)"/><path d="M0 600 L260 300 L480 520 L620 380 L800 600Z" fill="hsl(${hue},45%,40%)"/><text x="40" y="80" font-size="48" font-family="sans-serif" fill="white">${label}</text></svg>`,
  )}`;
const TINY = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"><rect width="8" height="6" fill="hsl(${hue},60%,60%)"/></svg>`)}`;

const MEDIA_URLS: Record<number, string> = {
  105: svg(200, 'Parco'),
  110: svg(30, 'Tiramisù'),
  112: `data:application/pdf;base64,JVBERi0xLjEKJcKlwrHDqwoxIDAgb2JqCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCnRyYWlsZXI8PC9Sb290IDEgMCBSPj4KJSVFT0Y=`,
};

/** Fake download: resolves after a short delay for known ids, fails for the others. */
const useMockMediaUrl: UseMediaUrl = (_chatId, messageId, enabled = true) => {
  const [state, setState] = useState<MediaState>({ loading: false });
  useEffect(() => {
    if (!enabled) return;
    setState({ loading: true });
    const id = window.setTimeout(() => {
      const url = MEDIA_URLS[messageId];
      setState(url ? { url, loading: false } : { loading: false, error: true });
    }, 700);
    return () => window.clearTimeout(id);
  }, [messageId, enabled]);
  return enabled ? state : { loading: false };
};

function msg(id: number, hoursAgo: number, out: boolean, text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    chatId: CHAT,
    out,
    date: Date.now() - hoursAgo * HOUR,
    text,
    senderId: out ? 'me' : 'mamma',
    senderName: out ? 'Io' : 'Mamma',
    status: out ? 'read' : undefined,
    ...extra,
  };
}

const media = (m: MediaInfo) => ({ media: m });

function initialMessages(): ChatMessage[] {
  return [
    msg(100, 50, false, 'Buongiorno! Oggi vado al lavoro presto.'),
    msg(101, 49.9, true, 'Ciao mamma'),
    msg(102, 26, false, 'Hai fatto i compiti di matematica?'),
    msg(103, 25.9, true, 'Sì, ho finito'),
    msg(104, 25.85, true, '👍'),
    msg(
      105,
      5,
      false,
      'Guarda che bel parco!',
      media({
        kind: 'photo',
        width: 800,
        height: 600,
        thumbDataUrl: TINY(200),
      }),
    ),
    msg(106, 4.9, false, 'Papà si è unito alla chat', { service: true }),
    msg(107, 4.5, false, '', media({ kind: 'voice', duration: 12 })),
    msg(
      108,
      4.4,
      false,
      '',
      media({
        kind: 'location',
        title: 'Parco Ciani',
        description: 'Lugano',
        latitude: 46.005,
        longitude: 8.958,
      }),
    ),
    msg(109, 4.3, true, 'Io voglio mangiare la pizza e il gelato'),
    msg(
      110,
      3,
      false,
      formatPictogramShare('cibo', 'tiramisù'),
      media({ kind: 'photo', width: 600, height: 600, thumbDataUrl: TINY(30) }),
    ),
    msg(
      111,
      2.9,
      false,
      '',
      media({
        kind: 'contact',
        title: 'Nonna Lucia',
        description: '+39 333 123 4567',
      }),
    ),
    msg(
      112,
      2.8,
      false,
      'Il menu della mensa',
      media({
        kind: 'document',
        fileName: 'menu-settimana.pdf',
        mimeType: 'application/pdf',
        size: 248_000,
      }),
    ),
    msg(
      113,
      2.7,
      false,
      '',
      media({
        kind: 'poll',
        title: 'Cosa mangiamo stasera?',
        description: 'Pizza, pasta o minestra',
      }),
    ),
    msg(
      114,
      2.6,
      false,
      'https://www.arasaac.org',
      media({
        kind: 'webpage',
        title: 'ARASAAC',
        description: 'Pittogrammi per la comunicazione aumentativa',
        url: 'https://www.arasaac.org',
      }),
    ),
    msg(115, 1, true, 'Arrivo tra poco', { status: 'sent' }),
    msg(-1, 0.5, true, 'Mi vieni a prendere?', { status: 'failed' }),
    msg(116, 0.2, false, 'Sei a scuola?'),
    msg(117, 0.19, false, 'Vuoi andare al parco o al cinema?'),
  ];
}

const REPLIES = ['Va bene!', 'Ci vediamo dopo.', 'Ti voglio bene ❤️', 'Hai fame?'];

export default function ChatPreview() {
  const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '');
  const empty = params.has('empty') || params.has('loading');
  const [messages, setMessages] = useState<ChatMessage[]>(() => (empty ? [] : initialMessages()));
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [pages, setPages] = useState(2);
  const [typing, setTyping] = useState(false);
  const nextId = useRef(200);
  const localId = useRef(-10);
  const connection: ConnectionState = params.has('offline') ? 'disconnected' : 'connected';

  const add = useCallback((m: ChatMessage) => setMessages((list) => [...list, m]), []);

  const onSendText = useCallback(
    (text: string) => {
      const id = localId.current--;
      add(msg(id, 0, true, text, { status: 'sending' }));
      window.setTimeout(() => {
        const serverId = nextId.current++;
        setMessages((list) => list.map((m) => (m.id === id ? { ...m, id: serverId, status: 'sent' } : m)));
        setTyping(true);
      }, 700);
      window.setTimeout(() => {
        setTyping(false);
        add(msg(nextId.current++, 0, false, REPLIES[Math.floor(Math.random() * REPLIES.length)]));
      }, 2600);
    },
    [add],
  );

  const onSendFile = useCallback(
    (file: File, caption?: string) => {
      const url = URL.createObjectURL(file);
      const kind = file.type.startsWith('image/') ? 'photo' : 'document';
      add(
        msg(
          localId.current--,
          0,
          true,
          caption ?? '',
          media({
            kind,
            fileName: file.name,
            size: file.size,
            thumbDataUrl: url,
          }),
        ),
      );
    },
    [add],
  );

  const onRetry = useCallback((id: number) => {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, status: 'sending' } : m)));
    window.setTimeout(
      () => setMessages((list) => list.map((m) => (m.id === id ? { ...m, id: 150, status: 'sent' } : m))),
      800,
    );
  }, []);

  const onLoadOlder = useCallback(() => {
    if (loadingOlder || pages <= 0) return;
    setLoadingOlder(true);
    window.setTimeout(() => {
      setMessages((list) => {
        const oldest = list[0];
        const base = oldest ? oldest.date : Date.now();
        const older = Array.from({ length: 20 }, (_, i) =>
          msg(
            (oldest?.id ?? 100) - 20 + i,
            (Date.now() - base) / HOUR + (20 - i) * 2,
            i % 3 === 0,
            `Messaggio vecchio numero ${i + 1}`,
          ),
        );
        return [...older, ...list];
      });
      setPages((p) => p - 1);
      setLoadingOlder(false);
    }, 900);
  }, [loadingOlder, pages]);

  return (
    <ChatView
      chatId={CHAT}
      title={params.has('group') ? 'Famiglia' : 'Mamma'}
      presence={{ state: 'online' }}
      typing={typing}
      isGroup={params.has('group')}
      connection={connection}
      messages={messages}
      loading={params.has('loading')}
      loadingOlder={loadingOlder}
      hasOlder={!empty && pages > 0}
      unreadCount={Number(params.get('unread') ?? 0)}
      readOutboxMaxId={110}
      useMediaUrl={useMockMediaUrl}
      onBack={() => window.history.back()}
      onLoadOlder={onLoadOlder}
      onSendText={onSendText}
      onSendFile={onSendFile}
      onRetry={onRetry}
    />
  );
}
