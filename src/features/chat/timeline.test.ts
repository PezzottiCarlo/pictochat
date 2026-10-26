import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '@/core/types';
import { buildTimeline, dayLabel, firstUnreadId, GROUP_GAP_MS, lastIncomingText } from './lib/timeline';
import { formatBytes, formatDuration, isEmojiOnly, linkify, presenceText } from './lib/format';
import { pushRecents, type RecentRef } from './lib/recents';

const NOW = new Date(2026, 9, 15, 18, 0).getTime(); // Thu 15 Oct 2026
const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).getTime();

let nextId = 1;
const msg = (date: number, out: boolean, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id: nextId++,
  chatId: '42',
  senderId: out ? 'me' : '42',
  out,
  date,
  text: 'ciao',
  ...extra,
});

describe('dayLabel', () => {
  it('names today and yesterday', () => {
    expect(dayLabel(at(15, 9), NOW)).toBe('Oggi');
    expect(dayLabel(at(14, 23, 59), NOW)).toBe('Ieri');
  });
  it('uses the weekday within a week', () => {
    expect(dayLabel(at(12, 10), NOW)).toBe('Lunedì');
  });
  it('uses the date for older days, with the year only when different', () => {
    expect(dayLabel(at(1, 10), NOW)).toBe('1 ottobre');
    expect(dayLabel(new Date(2025, 2, 3).getTime(), NOW)).toBe('3 marzo 2025');
  });
});

describe('buildTimeline', () => {
  it('inserts a separator for each day', () => {
    const items = buildTimeline([msg(at(14, 10), false), msg(at(15, 9), true), msg(at(15, 10), true)], { now: NOW });
    expect(items.map((i) => (i.type === 'day' ? i.label : i.type))).toEqual([
      'Ieri',
      'message',
      'Oggi',
      'message',
      'message',
    ]);
  });

  it('groups consecutive bubbles from the same side within the gap', () => {
    const a = msg(at(15, 9), false);
    const b = msg(a.date + 60_000, false);
    const c = msg(b.date + GROUP_GAP_MS + 1, false);
    const d = msg(c.date + 1000, true);
    const items = buildTimeline([a, b, c, d], { now: NOW }).filter((i) => i.type === 'message');
    expect(items.map((i) => i.type === 'message' && [i.first, i.last])).toEqual([
      [true, false],
      [false, true],
      [true, true],
      [true, true],
    ]);
  });

  it('never groups service messages', () => {
    const a = msg(at(15, 9), false);
    const s = msg(a.date + 1000, false, { service: true });
    const items = buildTimeline([a, s], { now: NOW }).filter((i) => i.type === 'message');
    expect(items.every((i) => i.type === 'message' && i.first && i.last)).toBe(true);
  });

  it('places the unread marker and breaks the group there', () => {
    const a = msg(at(15, 9), false);
    const b = msg(a.date + 1000, false);
    const items = buildTimeline([a, b], {
      now: NOW,
      firstUnreadId: b.id,
      unreadCount: 1,
    });
    expect(items.map((i) => i.type)).toEqual(['day', 'message', 'unread', 'message']);
    const [ma, mb] = items.filter((i) => i.type === 'message');
    expect(ma.type === 'message' && ma.last).toBe(true);
    expect(mb.type === 'message' && mb.first).toBe(true);
  });
});

describe('firstUnreadId / lastIncomingText', () => {
  const list = [
    msg(at(15, 8), false, { text: 'Vuoi la pizza?' }),
    msg(at(15, 9), true),
    msg(at(15, 10), false, { text: 'Dove sei?' }),
  ];
  it('counts unread incoming messages from the end', () => {
    expect(firstUnreadId(list, 1)).toBe(list[2].id);
    expect(firstUnreadId(list, 2)).toBe(list[0].id);
    expect(firstUnreadId(list, 0)).toBeUndefined();
    expect(firstUnreadId(list, 5)).toBeUndefined();
  });
  it('returns the last incoming text only when not yet answered', () => {
    expect(lastIncomingText(list)).toBe('Dove sei?');
    expect(lastIncomingText(list.slice(0, 2))).toBeUndefined();
  });
});

describe('format helpers', () => {
  it('formats sizes and durations', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
  it('describes presence', () => {
    expect(presenceText({ state: 'online' })).toBe('Online');
    expect(presenceText({ state: 'offline', lastSeen: at(15, 14, 5) }, NOW)).toBe('Ultimo accesso alle 14:05');
    expect(presenceText({ state: 'offline', lastSeen: at(14, 14, 5) }, NOW)).toBe('Ultimo accesso ieri alle 14:05');
  });
  it('detects emoji-only messages', () => {
    expect(isEmojiOnly('😀')).toBe(true);
    expect(isEmojiOnly('👍🏽 ❤️')).toBe(true);
    expect(isEmojiOnly('ciao 😀')).toBe(false);
    expect(isEmojiOnly('123')).toBe(false);
  });
  it('splits links out of text', () => {
    expect(linkify('vedi www.arasaac.org, ciao')).toEqual([
      { type: 'text', value: 'vedi ' },
      {
        type: 'link',
        value: 'www.arasaac.org',
        href: 'https://www.arasaac.org',
      },
      { type: 'text', value: ', ciao' },
    ]);
  });
});

describe('pushRecents', () => {
  const r = (id: string): RecentRef => ({ id, word: id, source: 'arasaac' });
  it('puts the last used first, deduplicated and capped', () => {
    expect(pushRecents([r('a'), r('b')], [r('c'), r('a')]).map((x) => x.id)).toEqual(['a', 'c', 'b']);
    expect(pushRecents([r('a'), r('b'), r('c')], [r('d')], 2).map((x) => x.id)).toEqual(['d', 'a']);
  });
});
