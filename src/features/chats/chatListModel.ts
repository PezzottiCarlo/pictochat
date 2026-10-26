/**
 * Pure helpers for the chat list: ordering, filtering, simple-mode selection and the
 * human-readable bits of a row (time, last-message preview, presence).
 */
import type { ChatMessage, ChatSummary, MediaKind, Presence } from '@/core/types';
import { parsePictogramShare } from '@/services/aac';

/** Lowercase, accent-free text for search. */
export const foldText = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

/** Pinned chats first; otherwise keeps the incoming order (the store sorts by last activity). */
export function orderChats(chats: readonly ChatSummary[]): ChatSummary[] {
  return [...chats.filter((c) => c.pinned), ...chats.filter((c) => !c.pinned)];
}

/** Matches title, @username and last message text; every word of the query must match. */
export function filterChats(chats: readonly ChatSummary[], query: string): ChatSummary[] {
  const words = foldText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [...chats];
  return chats.filter((c) => {
    const hay = foldText(`${c.title} ${c.username ?? ''} ${c.lastMessage?.text ?? ''}`);
    return words.every((w) => hay.includes(w));
  });
}

/** Chats shown in simple mode: private chats only, restricted to the allowed ones when set. */
export function simpleModeChats(chats: readonly ChatSummary[], allowedIds: readonly string[]): ChatSummary[] {
  const allowed = new Set(allowedIds);
  return chats.filter((c) => (c.kind === 'user' || c.kind === 'self') && (!allowed.size || allowed.has(c.id)));
}

/** Favourites first, in the order the user starred them; then the rest. */
export function splitFavourites(
  chats: readonly ChatSummary[],
  favouriteIds: readonly string[],
): { favourites: ChatSummary[]; others: ChatSummary[] } {
  const byId = new Map(chats.map((c) => [c.id, c]));
  const favourites = favouriteIds.flatMap((id) => {
    const chat = byId.get(id);
    return chat ? [chat] : [];
  });
  const fav = new Set(favourites.map((c) => c.id));
  return { favourites, others: chats.filter((c) => !fav.has(c.id)) };
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const DAY = 24 * 60 * 60 * 1000;

/** "14:05" today, "Ieri", weekday within a week, otherwise "3 mar" / "3 mar 2024". */
export function formatChatTime(ts: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / DAY);
  const d = new Date(ts);
  if (days <= 0) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Ieri';
  if (days < 7) {
    const w = d.toLocaleDateString('it-IT', { weekday: 'long' });
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** Full, spoken form of the time (screen readers). */
export function spokenChatTime(ts: number, now = Date.now()): string {
  const short = formatChatTime(ts, now);
  return /^\d/.test(short) && short.includes(':') ? `alle ${short}` : short;
}

const MEDIA_LABELS: Record<MediaKind, { icon: string; label: string }> = {
  photo: { icon: '📷', label: 'Foto' },
  video: { icon: '🎬', label: 'Video' },
  gif: { icon: '🎞️', label: 'GIF' },
  sticker: { icon: '🙂', label: 'Adesivo' },
  voice: { icon: '🎤', label: 'Messaggio vocale' },
  audio: { icon: '🎵', label: 'Audio' },
  document: { icon: '📄', label: 'Documento' },
  location: { icon: '📍', label: 'Posizione' },
  contact: { icon: '👤', label: 'Contatto' },
  poll: { icon: '📊', label: 'Sondaggio' },
  webpage: { icon: '🔗', label: 'Link' },
  unknown: { icon: '📎', label: 'Allegato' },
};

export interface MessagePreview {
  /** "Tu" for own messages, the sender's first name in groups. */
  author?: string;
  /** Emoji for media (decorative). */
  icon?: string;
  text: string;
  /** Text worth translating into pictograms (plain text messages only). */
  pictogramText?: string;
}

/** What a chat row says about its last message. */
export function messagePreview(message: ChatMessage | undefined, kind: ChatSummary['kind']): MessagePreview {
  if (!message) return { text: 'Nessun messaggio' };
  if (message.service) return { text: message.text || 'Novità nella chat' };

  const author = message.out
    ? 'Tu'
    : kind === 'group' && message.senderName
      ? message.senderName.split(/\s+/)[0]
      : undefined;
  const text = message.text.trim();

  if (message.media) {
    const share = message.media.kind === 'photo' ? parsePictogramShare(text) : null;
    if (share) return { author, icon: '🖼️', text: `Pittogramma: ${share.word}` };
    const m = MEDIA_LABELS[message.media.kind] ?? MEDIA_LABELS.unknown;
    const extra = message.media.kind === 'document' ? message.media.fileName : message.media.title;
    return { author, icon: m.icon, text: text || extra || m.label };
  }
  return { author, text, pictogramText: text.length <= 140 ? text : undefined };
}

/** Short Italian presence line ("Online", "Visto oggi alle 14:05"…); undefined when unknown. */
export function presenceLabel(p: Presence | undefined, now = Date.now()): string | undefined {
  if (!p) return undefined;
  switch (p.state) {
    case 'online':
      return 'Online';
    case 'recently':
      return 'Visto di recente';
    case 'lastWeek':
      return 'Visto questa settimana';
    case 'lastMonth':
      return 'Visto questo mese';
    case 'offline': {
      if (!p.lastSeen) return 'Offline';
      const t = formatChatTime(p.lastSeen, now);
      return t.includes(':') ? `Visto oggi alle ${t}` : `Visto ${t.toLowerCase()}`;
    }
    default:
      return undefined;
  }
}

/** Accessible name of a whole row: title, unread, author + preview, time. */
export function rowAccessibleName(chat: ChatSummary, preview: MessagePreview, typing: boolean, now = Date.now()): string {
  const parts = [chat.title];
  if (chat.unreadCount > 0) parts.push(chat.unreadCount === 1 ? '1 messaggio nuovo' : `${chat.unreadCount} messaggi nuovi`);
  if (typing) parts.push('sta scrivendo');
  else parts.push(preview.author ? `${preview.author}: ${preview.text}` : preview.text);
  if (chat.lastMessage) parts.push(spokenChatTime(chat.lastMessage.date, now));
  if (chat.pinned) parts.push('fissata in alto');
  if (chat.muted) parts.push('silenziata');
  return parts.join(', ');
}
