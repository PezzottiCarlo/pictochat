import { describe, expect, it } from 'vitest';
import type { ChatMessage, ChatSummary } from '@/core/types';
import {
  applyNewMessageToChats,
  applyOlderPage,
  applyOutboxRead,
  applyRefresh,
  findPendingMatch,
  mergeMessages,
  reconcileLocal,
  removeMessages,
  replaceMessage,
  sortChats,
  sortMessages,
} from './merge';

const m = (id: number, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  chatId: '2',
  out: false,
  date: Math.abs(id) * 1000,
  text: `m${id}`,
  ...extra,
});
const ids = (list: ChatMessage[]) => list.map((x) => x.id);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => m(from + i));

describe('ordering and merge', () => {
  it('keeps server messages by id and local ones at the bottom', () => {
    const list = sortMessages([m(-2, { date: 50_000 }), m(5), m(3), m(-1, { date: 40_000 }), m(4)]);
    expect(ids(list)).toEqual([3, 4, 5, -1, -2]);
  });

  it('dedupes by id with incoming winning, never downgrading read', () => {
    const merged = mergeMessages([m(1), m(2, { out: true, status: 'read' })], [m(2, { out: true, status: 'sent', text: 'edit' }), m(3)]);
    expect(ids(merged)).toEqual([1, 2, 3]);
    expect(merged[1]).toMatchObject({ text: 'edit', status: 'read' });
  });

  it('reconciles an optimistic message with its server copy', () => {
    const list = [m(1), m(-1, { out: true, status: 'sending', text: 'ciao' })];
    const server = m(2, { out: true, status: 'sent', text: 'ciao' });
    expect(findPendingMatch(list, server)?.id).toBe(-1);
    expect(ids(reconcileLocal(list, -1, server))).toEqual([1, 2]);
    // Idempotent when the update already did it.
    expect(ids(reconcileLocal([m(1), server], -1, server))).toEqual([1, 2]);
    expect(findPendingMatch(list, m(3, { out: false, text: 'ciao' }))).toBeUndefined();
  });

  it('applies outbox reads, edits and deletions', () => {
    const list = [m(1, { out: true, status: 'sent' }), m(2), m(3, { out: true, status: 'sent' }), m(-1, { out: true, status: 'sending' })];
    const read = applyOutboxRead(list, 2);
    expect(read.map((x) => x.status)).toEqual(['read', undefined, 'sent', 'sending']);
    expect(applyOutboxRead(read, 2)).toBe(read);
    expect(replaceMessage(list, m(9))).toBe(list);
    expect(replaceMessage(list, m(2, { text: 'x' }))[1].text).toBe('x');
    expect(ids(removeMessages(list, [2, 3]))).toEqual([1, -1]);
  });
});

describe('applyRefresh', () => {
  it('merges an overlapping newest page and detects server deletions', () => {
    const existing = range(1, 40).filter((x) => x.id !== 35);
    const fresh = range(21, 50).filter((x) => x.id !== 30); // 30 deleted on server, 35 was missing locally
    const res = applyRefresh(existing, fresh.slice(0, 29), 29);
    expect(res.gapBelow).toBeUndefined();
    expect(res.removedIds).toEqual([30]);
    expect(ids(res.messages)).toEqual([...range(1, 50).map((x) => x.id).filter((id) => id !== 30)]);
  });

  it('drops older cached messages when the fresh page leaves a gap', () => {
    const existing = range(1, 10);
    const fresh = range(100, 129);
    const res = applyRefresh(existing, fresh, 30);
    expect(res.gapBelow).toBe(100);
    expect(ids(res.messages)).toEqual(ids(fresh));
  });

  it('uses the anchor to detect gaps hidden by messages added while offline', () => {
    const existing = [...range(1, 10), m(200, { out: true })];
    const fresh = range(171, 200);
    expect(applyRefresh(existing, fresh, 30).gapBelow).toBeUndefined();
    expect(applyRefresh(existing, fresh, 30, 10).gapBelow).toBe(171);
  });

  it('treats a short page as the complete history', () => {
    const res = applyRefresh([m(1), m(2), m(5), m(-1, { out: true, status: 'failed' })], [m(5), m(6)], 30);
    expect(res.removedIds).toEqual([1, 2]);
    expect(ids(res.messages)).toEqual([5, 6, -1]);
  });

  it('keeps messages that arrived during the request', () => {
    const res = applyRefresh([...range(1, 30), m(31)], range(1, 30), 30);
    expect(ids(res.messages)).toEqual(ids(range(1, 31)));
    expect(res.removedIds).toEqual([]);
  });
});

describe('applyOlderPage', () => {
  it('merges older messages and removes the ones deleted in that range', () => {
    const existing = [m(5), m(8), m(10), m(11)];
    const res = applyOlderPage(existing, [m(6), m(7), m(9)], 10);
    expect(ids(res.messages)).toEqual([5, 6, 7, 9, 10, 11]);
    expect(res.removedIds).toEqual([8]);
  });
});

describe('chats', () => {
  const chat = (id: string, date: number, extra: Partial<ChatSummary> = {}): ChatSummary => ({
    id,
    kind: 'user',
    title: id,
    unreadCount: 0,
    pinned: false,
    muted: false,
    hasPhoto: false,
    lastMessage: m(date, { chatId: id, date }),
    ...extra,
  });

  it('sorts pinned first, then by last message date', () => {
    const sorted = sortChats([chat('a', 1), chat('p2', 0, { pinned: true }), chat('b', 3), chat('p1', 9, { pinned: true })]);
    expect(sorted.map((c) => c.id)).toEqual(['p2', 'p1', 'b', 'a']);
  });

  it('bumps a chat on new messages and counts unread', () => {
    const chats = [chat('a', 5), chat('b', 3)];
    const next = applyNewMessageToChats(chats, m(10, { chatId: 'b', date: 10 }), true)!;
    expect(next.map((c) => c.id)).toEqual(['b', 'a']);
    expect(next[0].unreadCount).toBe(1);
    expect(applyNewMessageToChats(chats, m(10, { chatId: 'b', date: 10 }), false)![0].unreadCount).toBe(0);
    expect(applyNewMessageToChats(chats, m(10, { chatId: 'b', out: true, date: 10 }), true)![0].unreadCount).toBe(0);
    expect(applyNewMessageToChats(chats, m(10, { chatId: 'zzz' }), true)).toBeNull();
  });
});
