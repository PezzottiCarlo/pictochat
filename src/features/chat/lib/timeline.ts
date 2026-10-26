/**
 * Message list → render items: day separators, an optional "new messages" marker and
 * messages flagged with their position in a group of consecutive bubbles.
 */
import type { ChatMessage } from '@/core/types';

/** Consecutive messages from the same sender closer than this are grouped. */
export const GROUP_GAP_MS = 5 * 60 * 1000;

export type TimelineItem =
  | { type: 'day'; key: string; label: string; date: number }
  | { type: 'unread'; key: string; count: number }
  | {
      type: 'message';
      key: string;
      message: ChatMessage;
      /** First bubble of a group (shows sender name in groups, rounder top corner). */
      first: boolean;
      /** Last bubble of a group (tail, avatar). */
      last: boolean;
    };

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (ms: number): number => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const isSameDay = (a: number, b: number): boolean => startOfDay(a) === startOfDay(b);

const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase('it') + s.slice(1);

/** "Oggi", "Ieri", weekday within the last week, else "12 marzo" (+ year when not this year). */
export function dayLabel(date: number, now: number = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Ieri';
  const d = new Date(date);
  if (days > 1 && days < 7) return capitalize(d.toLocaleDateString('it-IT', { weekday: 'long' }));
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

const groupable = (a: ChatMessage, b: ChatMessage): boolean =>
  !a.service &&
  !b.service &&
  a.out === b.out &&
  (a.senderId ?? '') === (b.senderId ?? '') &&
  Math.abs(b.date - a.date) <= GROUP_GAP_MS &&
  isSameDay(a.date, b.date);

/** Stable React key: optimistic (negative) ids keep a key until replaced by the server copy. */
export const messageKey = (m: ChatMessage): string => `m${m.id}`;

export interface TimelineOptions {
  now?: number;
  /** Id of the first unread incoming message: a "new messages" marker goes before it. */
  firstUnreadId?: number;
  unreadCount?: number;
}

export function buildTimeline(messages: readonly ChatMessage[], opts: TimelineOptions = {}): TimelineItem[] {
  const now = opts.now ?? Date.now();
  const items: TimelineItem[] = [];
  let lastDay = -1;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const day = startOfDay(m.date);
    const newDay = day !== lastDay;
    if (newDay) {
      items.push({
        type: 'day',
        key: `d${day}`,
        label: dayLabel(m.date, now),
        date: day,
      });
      lastDay = day;
    }
    const marker = opts.firstUnreadId !== undefined && m.id === opts.firstUnreadId;
    if (marker)
      items.push({
        type: 'unread',
        key: 'unread',
        count: opts.unreadCount ?? 0,
      });

    const prev = messages[i - 1];
    const next = messages[i + 1];
    const nextHasMarker = next !== undefined && opts.firstUnreadId !== undefined && next.id === opts.firstUnreadId;
    items.push({
      type: 'message',
      key: messageKey(m),
      message: m,
      first: newDay || marker || !prev || !groupable(prev, m),
      last: !next || nextHasMarker || !groupable(m, next),
    });
  }
  return items;
}

/**
 * Id of the first unread incoming message given how many are unread (counted from the end).
 * Undefined when nothing is unread or the history in memory does not reach that far.
 */
export function firstUnreadId(messages: readonly ChatMessage[], unreadCount: number): number | undefined {
  if (unreadCount <= 0) return undefined;
  let seen = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.out || m.service) continue;
    seen++;
    if (seen === unreadCount) return m.id;
  }
  return undefined;
}

/** Text of the last incoming (non-service) message, for reply suggestions. */
export function lastIncomingText(messages: readonly ChatMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.service) continue;
    if (m.out) return undefined; // already answered
    return m.text.trim() ? m.text : undefined;
  }
  return undefined;
}
