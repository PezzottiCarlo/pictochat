/** Small, pure formatting helpers for the chat screen (Italian copy). */
import type { MediaInfo, Presence } from '@/core/types';
import { isSameDay } from './timeline';

export const formatTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });

export function formatBytes(bytes: number | undefined): string {
  if (!bytes || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString('it-IT', { maximumFractionDigits: value < 10 ? 1 : 0 })} ${units[unit]}`;
}

/** 75 → "1:15". */
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) return '';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
}

/** Header subtitle for a person's presence. */
export function presenceText(presence: Presence | undefined, now: number = Date.now()): string | undefined {
  if (!presence) return undefined;
  switch (presence.state) {
    case 'online':
      return 'Online';
    case 'recently':
      return 'Online di recente';
    case 'lastWeek':
      return 'Online questa settimana';
    case 'lastMonth':
      return 'Online questo mese';
    case 'offline': {
      if (!presence.lastSeen) return undefined;
      const time = formatTime(presence.lastSeen);
      if (isSameDay(presence.lastSeen, now)) return `Ultimo accesso alle ${time}`;
      if (isSameDay(presence.lastSeen, now - 86_400_000)) return `Ultimo accesso ieri alle ${time}`;
      const date = new Date(presence.lastSeen).toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
      });
      return `Ultimo accesso il ${date}`;
    }
    default:
      return undefined;
  }
}

/** Short spoken/visible name of a media kind, e.g. for screen readers and notifications. */
export function mediaLabel(media: MediaInfo): string {
  switch (media.kind) {
    case 'photo':
      return 'Foto';
    case 'video':
      return 'Video';
    case 'gif':
      return 'GIF';
    case 'sticker':
      return 'Adesivo';
    case 'voice':
      return 'Messaggio vocale';
    case 'audio':
      return media.title || 'Audio';
    case 'document':
      return media.fileName || 'Documento';
    case 'location':
      return 'Posizione';
    case 'contact':
      return 'Contatto';
    case 'poll':
      return 'Sondaggio';
    case 'webpage':
      return media.title || 'Link';
    default:
      return 'Allegato';
  }
}

export const isPdf = (media: MediaInfo): boolean =>
  media.mimeType === 'application/pdf' || /\.pdf$/i.test(media.fileName ?? '');

/** A message made only of 1–3 emoji is shown big, without a bubble. */
export function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 24) return false;
  if (!/^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|\s)+$/u.test(t)) return false;
  const count = [...new Intl.Segmenter('it', { granularity: 'grapheme' }).segment(t.replace(/\s/g, ''))].length;
  return count >= 1 && count <= 3 && !/^[\d#*]+$/.test(t);
}

export type TextPart = { type: 'text'; value: string } | { type: 'link'; value: string; href: string };

const LINK = /\b(?:https?:\/\/|www\.)[^\s<>"']+[^\s<>"'.,;:!?)\]]/giu;

/** Splits text into plain parts and http(s) links. */
export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', value: text.slice(last, index) });
    const value = match[0];
    parts.push({
      type: 'link',
      value,
      href: value.startsWith('www.') ? `https://${value}` : value,
    });
    last = index + value.length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}
