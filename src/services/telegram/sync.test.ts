/** Wiring test: realtime events → zustand store (no network, no IndexedDB in node). */
import { beforeEach, describe, expect, it } from 'vitest';
import type { ChatSummary } from '@/core/types';
import { events } from './client';
import * as api from './index';
import { useMessagingStore } from './store';

const chat = (id: string, date: number): ChatSummary => ({
  id,
  kind: 'user',
  title: id,
  unreadCount: 0,
  pinned: false,
  muted: false,
  hasPhoto: false,
  lastMessage: { id: date, chatId: id, out: false, date, text: 'x' },
});

describe('messaging wiring', () => {
  beforeEach(() => {
    api.setActiveChat(null);
    useMessagingStore.setState({ chats: [chat('a', 5), chat('b', 3)], threads: {}, typing: {} });
  });

  it('exports the contract surface', () => {
    for (const name of ['useConnection', 'useChats', 'useChat', 'useMessages', 'useAvatar', 'useMediaUrl', 'useMe', 'setActiveChat']) {
      expect(typeof (api as Record<string, unknown>)[name]).toBe('function');
    }
    expect(typeof api.messaging.subscribe).toBe('function');
    expect(new api.TelegramAuthError('PHONE_CODE_INVALID', 'x').code).toBe('PHONE_CODE_INVALID');
  });

  it('subscribe returns a working unsubscribe', () => {
    const seen: string[] = [];
    const off = api.messaging.subscribe((e) => seen.push(e.type));
    events.emit({ type: 'presence', userId: 'a', presence: { state: 'online' } });
    off();
    events.emit({ type: 'presence', userId: 'a', presence: { state: 'online' } });
    expect(seen).toEqual(['presence']);
  });

  it('bumps chats and counts unread unless the chat is open', () => {
    events.emit({ type: 'message:new', message: { id: 10, chatId: 'b', out: false, date: 10, text: 'ciao' } });
    let chats = useMessagingStore.getState().chats;
    expect(chats.map((c) => c.id)).toEqual(['b', 'a']);
    expect(chats[0].unreadCount).toBe(1);

    api.setActiveChat('a');
    events.emit({ type: 'message:new', message: { id: 11, chatId: 'a', out: false, date: 11, text: 'hey' } });
    chats = useMessagingStore.getState().chats;
    expect(chats[0]).toMatchObject({ id: 'a', unreadCount: 0, lastMessage: { id: 11 } });
  });

  it('applies presence, read receipts and typing', () => {
    events.emit({ type: 'presence', userId: 'a', presence: { state: 'online' } });
    events.emit({ type: 'chat:read', chatId: 'b', maxId: 3, outbox: true });
    events.emit({ type: 'typing', chatId: 'a', userId: 'a' });
    const s = useMessagingStore.getState();
    expect(s.chats.find((c) => c.id === 'a')?.presence).toEqual({ state: 'online' });
    expect(s.chats.find((c) => c.id === 'b')?.readOutboxMaxId).toBe(3);
    expect(Object.keys(s.typing.a ?? {})).toEqual(['a']);
  });

  it('marks threads not live when the connection drops', () => {
    useMessagingStore.setState({
      threads: { a: { messages: [], loading: false, loadingOlder: false, hasOlder: true, live: true, anchorId: 0 } },
    });
    events.emit({ type: 'connection', state: 'disconnected' });
    expect(useMessagingStore.getState().threads.a.live).toBe(false);
    expect(useMessagingStore.getState().connection).toBe('disconnected');
  });
});
