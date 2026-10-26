import { describe, expect, it } from 'vitest';
import type { ChatMessage, ChatSummary } from '@/core/types';
import {
  filterChats,
  formatChatTime,
  messagePreview,
  orderChats,
  presenceLabel,
  simpleModeChats,
  splitFavourites,
} from './chatListModel';

const msg = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  id: 1,
  chatId: '1',
  out: false,
  date: 0,
  text: 'Ciao',
  ...over,
});

const chat = (id: string, over: Partial<ChatSummary> = {}): ChatSummary => ({
  id,
  kind: 'user',
  title: `Chat ${id}`,
  unreadCount: 0,
  pinned: false,
  muted: false,
  hasPhoto: false,
  ...over,
});

describe('orderChats', () => {
  it('moves pinned chats first and keeps the rest stable', () => {
    const list = [chat('a'), chat('b', { pinned: true }), chat('c'), chat('d', { pinned: true })];
    expect(orderChats(list).map((c) => c.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('filterChats', () => {
  const list = [
    chat('1', { title: 'Mamma' }),
    chat('2', { title: 'Papà', username: 'babbo' }),
    chat('3', { title: 'Scuola', lastMessage: msg({ text: 'Domani gita al museo' }) }),
  ];
  it('ignores case and accents', () => {
    expect(filterChats(list, 'PAPA').map((c) => c.id)).toEqual(['2']);
  });
  it('searches username and last message', () => {
    expect(filterChats(list, 'babbo').map((c) => c.id)).toEqual(['2']);
    expect(filterChats(list, 'gita museo').map((c) => c.id)).toEqual(['3']);
  });
  it('returns everything for an empty query', () => {
    expect(filterChats(list, '   ')).toHaveLength(3);
  });
});

describe('simpleModeChats', () => {
  const list = [chat('1'), chat('2', { kind: 'group' }), chat('3', { kind: 'bot' }), chat('4')];
  it('keeps only private chats', () => {
    expect(simpleModeChats(list, []).map((c) => c.id)).toEqual(['1', '4']);
  });
  it('applies the allow-list', () => {
    expect(simpleModeChats(list, ['4', '2']).map((c) => c.id)).toEqual(['4']);
  });
});

describe('splitFavourites', () => {
  it('keeps the starred order and skips unknown ids', () => {
    const { favourites, others } = splitFavourites([chat('1'), chat('2'), chat('3')], ['3', 'x', '1']);
    expect(favourites.map((c) => c.id)).toEqual(['3', '1']);
    expect(others.map((c) => c.id)).toEqual(['2']);
  });
});

describe('formatChatTime', () => {
  const now = new Date(2026, 9, 15, 18, 30).getTime();
  it('shows the time for today', () => {
    expect(formatChatTime(new Date(2026, 9, 15, 9, 5).getTime(), now)).toBe('09:05');
  });
  it('says Ieri for yesterday', () => {
    expect(formatChatTime(new Date(2026, 9, 14, 23, 59).getTime(), now)).toBe('Ieri');
  });
  it('uses the weekday within a week', () => {
    expect(formatChatTime(new Date(2026, 9, 12, 10).getTime(), now)).toBe('Lunedì');
  });
  it('adds the year only for other years', () => {
    expect(formatChatTime(new Date(2026, 2, 3).getTime(), now)).not.toMatch(/2026/);
    expect(formatChatTime(new Date(2024, 2, 3).getTime(), now)).toMatch(/2024/);
  });
});

describe('messagePreview', () => {
  it('marks own messages', () => {
    expect(messagePreview(msg({ out: true, text: 'Arrivo' }), 'user')).toMatchObject({ author: 'Tu', text: 'Arrivo' });
  });
  it('names the sender in groups by first name', () => {
    expect(messagePreview(msg({ senderName: 'Luca Rossi' }), 'group').author).toBe('Luca');
  });
  it('labels media and recognises shared pictograms', () => {
    expect(messagePreview(msg({ text: '', media: { kind: 'voice' } }), 'user')).toMatchObject({
      icon: '🎤',
      text: 'Messaggio vocale',
    });
    expect(messagePreview(msg({ text: '#picto cibo: pizza', media: { kind: 'photo' } }), 'user').text).toBe(
      'Pittogramma: pizza',
    );
  });
  it('offers short text for the pictogram preview', () => {
    expect(messagePreview(msg({ text: 'Vieni a casa' }), 'user').pictogramText).toBe('Vieni a casa');
    expect(messagePreview(msg({ text: 'x'.repeat(200) }), 'user').pictogramText).toBeUndefined();
  });
  it('handles a chat without messages', () => {
    expect(messagePreview(undefined, 'user').text).toBe('Nessun messaggio');
  });
});

describe('presenceLabel', () => {
  it('describes presence states', () => {
    expect(presenceLabel({ state: 'online' })).toBe('Online');
    expect(presenceLabel({ state: 'recently' })).toBe('Visto di recente');
    expect(presenceLabel(undefined)).toBeUndefined();
  });
});
