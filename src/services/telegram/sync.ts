/**
 * Orchestration between network (messaging service), IndexedDB cache and the
 * zustand store: cache-first loading, realtime events, optimistic sends, read marks.
 *
 * Cache invariant: for each chat, IndexedDB holds one contiguous run of messages
 * ending at the newest one we know. Hence only live threads write realtime messages.
 */
import type { ChatMessage, MediaInfo, MessagingEvent, PeerId } from '@/core/types';
import {
  deleteCachedBelow,
  deleteCachedMessages,
  getCachedPage,
  loadChats as loadCachedChats,
  putMessages,
  saveChats,
  updateCachedMessage,
} from '@/services/storage';
import { parsePeerId } from './mappers';
import {
  applyNewMessageToChats,
  applyOlderPage,
  applyOutboxRead,
  applyRefresh,
  findPendingMatch,
  maxServerId,
  mergeMessages,
  minServerId,
  reconcileLocal,
  removeMessages,
  replaceMessage,
  sortChats,
  updateChat,
} from './merge';
import { messaging, meChanged } from './service';
import { getThread, patchThread, resetMessagingStore, setChats, useMessagingStore } from './store';

export const PAGE_SIZE = 30;
const TYPING_TTL_MS = 6000;

const state = () => useMessagingStore.getState();
const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

let chatsRefresh: Promise<void> | undefined;
let chatsRefreshTimer: ReturnType<typeof setTimeout> | undefined;
let persistTimer: ReturnType<typeof setTimeout> | undefined;

function persistChatsSoon(): void {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => void saveChats(state().chats), 800);
}

export function refreshChats(): Promise<void> {
  chatsRefresh ??= (async () => {
    useMessagingStore.setState({ chatsLoading: true });
    try {
      const fresh = await messaging.listChats();
      const local = new Map(state().chats.map((c) => [c.id, c]));
      const merged = fresh.map((chat) => {
        const prev = local.get(chat.id);
        // Keep an optimistic last message that the server doesn't know yet.
        if (prev?.lastMessage && prev.lastMessage.id < 0) return { ...chat, lastMessage: prev.lastMessage };
        return chat;
      });
      useMessagingStore.setState({ chats: merged, chatsLoaded: true, chatsLoading: false, chatsError: undefined });
      void saveChats(merged);
    } catch {
      useMessagingStore.setState((s) => ({
        chatsLoading: false,
        chatsError: s.chats.length ? undefined : 'Impossibile caricare le chat. Controlla la connessione.',
      }));
    } finally {
      chatsRefresh = undefined;
    }
  })();
  return chatsRefresh;
}

function scheduleChatsRefresh(): void {
  clearTimeout(chatsRefreshTimer);
  chatsRefreshTimer = setTimeout(() => void refreshChats(), 1500);
}

let chatsBootstrapped = false;

/** Cache first, then network. Safe to call from every `useChats` mount. */
export async function loadChats(): Promise<void> {
  if (chatsBootstrapped) return;
  chatsBootstrapped = true;
  useMessagingStore.setState({ chatsLoading: true });
  const cached = await loadCachedChats();
  if (cached.length && !state().chatsLoaded) useMessagingStore.setState({ chats: cached });
  await refreshChats();
}

// ---------------------------------------------------------------------------
// Threads
// ---------------------------------------------------------------------------

/** Bumped on every disconnection: results of requests started before it can't make a thread live. */
let connectionEpoch = 0;
const retained = new Map<PeerId, number>();
const threadRefresh = new Map<PeerId, Promise<void>>();

const readOutbox = (chatId: PeerId) => state().chats.find((c) => c.id === chatId)?.readOutboxMaxId;

export function retainThread(chatId: PeerId): () => void {
  retained.set(chatId, (retained.get(chatId) ?? 0) + 1);
  void openThread(chatId);
  return () => {
    const n = (retained.get(chatId) ?? 1) - 1;
    if (n > 0) retained.set(chatId, n);
    else retained.delete(chatId);
  };
}

async function openThread(chatId: PeerId): Promise<void> {
  const existing = getThread(chatId);
  if (existing) {
    if (!existing.live && !existing.loading) await refreshThread(chatId);
    return;
  }
  patchThread(chatId, { loading: true });
  const cached = await getCachedPage(chatId, PAGE_SIZE);
  const current = getThread(chatId);
  if (cached.length && current && !current.live) {
    patchThread(chatId, (t) => ({
      messages: applyOutboxRead(mergeMessages(t.messages, cached), readOutbox(chatId)),
      anchorId: Math.max(t.anchorId, maxServerId(cached)),
    }));
  }
  await refreshThread(chatId);
}

export function refreshThread(chatId: PeerId): Promise<void> {
  const running = threadRefresh.get(chatId);
  if (running) return running;
  const task = (async () => {
    const epoch = connectionEpoch;
    patchThread(chatId, { loading: true });
    try {
      const fresh = await messaging.getHistory(chatId, { limit: PAGE_SIZE });
      const thread = getThread(chatId);
      if (!thread) return; // reset (logout) meanwhile
      const result = applyRefresh(thread.messages, fresh, PAGE_SIZE, thread.anchorId || undefined);
      const messages = applyOutboxRead(result.messages, readOutbox(chatId));
      patchThread(chatId, {
        messages,
        loading: false,
        live: epoch === connectionEpoch,
        anchorId: maxServerId(messages),
        hasOlder: fresh.length >= PAGE_SIZE && (result.gapBelow !== undefined || thread.hasOlder),
      });
      void putMessages(fresh);
      void deleteCachedMessages(chatId, result.removedIds);
      if (result.gapBelow !== undefined) void deleteCachedBelow(chatId, result.gapBelow);
      const newest = fresh[fresh.length - 1];
      if (newest) {
        setChats((chats) =>
          updateChat(chats, chatId, (c) =>
            !c.lastMessage || (c.lastMessage.id > 0 && c.lastMessage.id < newest.id)
              ? { ...c, lastMessage: newest }
              : c,
          ),
        );
      }
    } catch {
      patchThread(chatId, { loading: false });
    } finally {
      threadRefresh.delete(chatId);
    }
  })();
  threadRefresh.set(chatId, task);
  return task;
}

export async function loadOlder(chatId: PeerId): Promise<void> {
  const thread = getThread(chatId);
  if (!thread || thread.loadingOlder || !thread.hasOlder) return;
  const beforeId = minServerId(thread.messages);
  if (beforeId === undefined) return;
  patchThread(chatId, { loadingOlder: true });
  try {
    const cached = await getCachedPage(chatId, PAGE_SIZE, beforeId);
    if (cached.length) {
      patchThread(chatId, (t) => ({ messages: applyOutboxRead(mergeMessages(t.messages, cached), readOutbox(chatId)) }));
    }
    if (cached.length < PAGE_SIZE) {
      const from = cached.length ? cached[0].id : beforeId;
      const page = await messaging.getHistory(chatId, { limit: PAGE_SIZE, beforeId: from });
      const result = applyOlderPage(getThread(chatId)?.messages ?? [], page, from);
      patchThread(chatId, {
        messages: applyOutboxRead(result.messages, readOutbox(chatId)),
        hasOlder: page.length >= PAGE_SIZE,
      });
      void putMessages(page);
      void deleteCachedMessages(chatId, result.removedIds);
    }
  } catch {
    /* offline: keep hasOlder, the user can retry by scrolling again */
  } finally {
    patchThread(chatId, { loadingOlder: false });
  }
}

// ---------------------------------------------------------------------------
// Optimistic sends
// ---------------------------------------------------------------------------

type Payload = { chatId: PeerId; text: string; file?: File; previewUrl?: string };

let nextLocalId = -1;
const payloads = new Map<number, Payload>();

function guessMedia(file: File, previewUrl?: string): MediaInfo {
  const t = file.type;
  const kind: MediaInfo['kind'] = t.startsWith('image/')
    ? 'photo'
    : t.startsWith('video/')
      ? 'video'
      : t.startsWith('audio/')
        ? 'audio'
        : 'document';
  return { kind, mimeType: t || undefined, fileName: file.name, size: file.size, thumbDataUrl: previewUrl };
}

function addLocal(message: ChatMessage): void {
  patchThread(message.chatId, (t) => ({ messages: mergeMessages(t.messages, [message]) }));
  setChats((chats) => applyNewMessageToChats(chats, message, false) ?? chats);
}

function setLocalStatus(chatId: PeerId, localId: number, status: ChatMessage['status']): void {
  patchThread(chatId, (t) => ({
    messages: t.messages.map((m) => (m.id === localId ? { ...m, status } : m)),
  }));
}

function onDelivered(localId: number, server: ChatMessage): void {
  const payload = payloads.get(localId);
  payloads.delete(localId);
  if (payload?.previewUrl) setTimeout(() => URL.revokeObjectURL(payload.previewUrl!), 10_000);
  const chatId = server.chatId;
  const thread = getThread(chatId);
  patchThread(chatId, (t) => ({
    messages: applyOutboxRead(reconcileLocal(t.messages, localId, server), readOutbox(chatId)),
    anchorId: t.live ? Math.max(t.anchorId, server.id) : t.anchorId,
  }));
  if (thread?.live) void putMessages([server]);
  setChats((chats) =>
    sortChats(
      updateChat(chats, chatId, (c) =>
        !c.lastMessage || c.lastMessage.id === localId || c.lastMessage.id < server.id
          ? { ...c, lastMessage: server }
          : c,
      ),
    ),
  );
  persistChatsSoon();
}

async function deliver(localId: number): Promise<void> {
  const payload = payloads.get(localId);
  if (!payload) return;
  setLocalStatus(payload.chatId, localId, 'sending');
  try {
    const server = payload.file
      ? await messaging.sendFile(payload.chatId, payload.file, { caption: payload.text || undefined })
      : await messaging.sendText(payload.chatId, payload.text);
    onDelivered(localId, server);
  } catch (err) {
    console.warn('[telegram] send failed', err);
    if (payloads.has(localId)) setLocalStatus(payload.chatId, localId, 'failed');
  }
}

export function sendText(chatId: PeerId, text: string): Promise<void> {
  const body = text.trim();
  if (!body) return Promise.resolve();
  const id = nextLocalId--;
  payloads.set(id, { chatId, text: body });
  addLocal({ id, chatId, senderId: state().me?.id, out: true, date: Date.now(), text: body, status: 'sending' });
  return deliver(id);
}

export function sendFile(chatId: PeerId, file: File, caption?: string): Promise<void> {
  const id = nextLocalId--;
  const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
  const text = caption?.trim() ?? '';
  payloads.set(id, { chatId, text, file, previewUrl });
  addLocal({
    id,
    chatId,
    senderId: state().me?.id,
    out: true,
    date: Date.now(),
    text,
    media: guessMedia(file, previewUrl),
    status: 'sending',
  });
  return deliver(id);
}

export function retry(localId: number): Promise<void> {
  return deliver(localId);
}

// ---------------------------------------------------------------------------
// Read marks
// ---------------------------------------------------------------------------

const lastReadSent = new Map<PeerId, number>();
const readTimers = new Map<PeerId, ReturnType<typeof setTimeout>>();

/** Marks the chat read if it is the open chat, the page is visible and the thread is loaded. */
export function markReadIfVisible(chatId: PeerId): void {
  if (state().activeChatId !== chatId || !isVisible()) return;
  const thread = getThread(chatId);
  if (!thread || thread.loading) return;
  clearTimeout(readTimers.get(chatId));
  readTimers.set(
    chatId,
    setTimeout(() => {
      readTimers.delete(chatId);
      const t = getThread(chatId);
      if (state().activeChatId !== chatId || !isVisible() || !t) return;
      let maxIncoming = 0;
      for (const m of t.messages) if (!m.out && m.id > maxIncoming) maxIncoming = m.id;
      const unread = state().chats.find((c) => c.id === chatId)?.unreadCount ?? 0;
      if (maxIncoming <= (lastReadSent.get(chatId) ?? 0) && unread === 0) return;
      lastReadSent.set(chatId, maxIncoming);
      setChats((chats) => updateChat(chats, chatId, (c) => (c.unreadCount ? { ...c, unreadCount: 0 } : c)));
      persistChatsSoon();
      messaging.markRead(chatId, maxIncoming || undefined).catch(() => lastReadSent.delete(chatId));
    }, 300),
  );
}

export function setActiveChat(chatId: PeerId | null): void {
  useMessagingStore.setState({ activeChatId: chatId });
  if (chatId) markReadIfVisible(chatId);
}

// ---------------------------------------------------------------------------
// Realtime events
// ---------------------------------------------------------------------------

function onNewMessage(message: ChatMessage): void {
  const { chatId } = message;
  const open = state().activeChatId === chatId && isVisible();
  const chats = applyNewMessageToChats(state().chats, message, !open);
  if (chats) useMessagingStore.setState({ chats });
  else scheduleChatsRefresh();
  persistChatsSoon();

  const thread = getThread(chatId);
  if (!thread?.live) return;
  const pending = findPendingMatch(thread.messages, message);
  if (pending) {
    const payload = payloads.get(pending.id);
    payloads.delete(pending.id);
    if (payload?.previewUrl) setTimeout(() => URL.revokeObjectURL(payload.previewUrl!), 10_000);
  }
  patchThread(chatId, (t) => ({
    messages: applyOutboxRead(
      pending ? reconcileLocal(t.messages, pending.id, message) : mergeMessages(t.messages, [message]),
      readOutbox(chatId),
    ),
    anchorId: Math.max(t.anchorId, message.id),
  }));
  void putMessages([message]);
  if (!message.out) markReadIfVisible(chatId);
}

function onEdited(message: ChatMessage): void {
  const { chatId } = message;
  setChats((chats) =>
    updateChat(chats, chatId, (c) => (c.lastMessage?.id === message.id ? { ...c, lastMessage: message } : c)),
  );
  if (getThread(chatId)) patchThread(chatId, (t) => ({ messages: replaceMessage(t.messages, message) }));
  void updateCachedMessage(message);
}

function onDeleted(chatId: PeerId | undefined, ids: number[]): void {
  const targets = chatId
    ? [chatId]
    : Object.keys(state().threads).filter((id) => parsePeerId(id).type !== 'channel');
  for (const id of targets) {
    if (getThread(id)) patchThread(id, (t) => ({ messages: removeMessages(t.messages, ids) }));
    void deleteCachedMessages(id, ids);
  }
  const drop = new Set(ids);
  let needsRefresh = false;
  setChats((chats) =>
    chats.map((c) => {
      const last = c.lastMessage;
      if (!last || !drop.has(last.id)) return c;
      if (chatId ? c.id !== chatId : parsePeerId(c.id).type === 'channel') return c;
      const remaining = getThread(c.id)?.messages.filter((m) => m.id > 0);
      const previous = remaining?.[remaining.length - 1];
      if (!previous) needsRefresh = true;
      return { ...c, lastMessage: previous };
    }),
  );
  if (needsRefresh) scheduleChatsRefresh();
  persistChatsSoon();
}

function onRead(e: Extract<MessagingEvent, { type: 'chat:read' }>): void {
  if (e.outbox) {
    setChats((chats) =>
      updateChat(chats, e.chatId, (c) => {
        const maxId = Math.max(c.readOutboxMaxId ?? 0, e.maxId);
        const last = c.lastMessage;
        const lastMessage =
          last?.out && last.id > 0 && last.id <= maxId ? { ...last, status: 'read' as const } : last;
        return { ...c, readOutboxMaxId: maxId, lastMessage };
      }),
    );
    if (getThread(e.chatId)) patchThread(e.chatId, (t) => ({ messages: applyOutboxRead(t.messages, e.maxId) }));
  } else {
    setChats((chats) =>
      updateChat(chats, e.chatId, (c) => {
        const unreadCount =
          e.unreadCount ?? (c.lastMessage && e.maxId >= c.lastMessage.id ? 0 : c.unreadCount);
        return unreadCount === c.unreadCount ? c : { ...c, unreadCount };
      }),
    );
  }
  persistChatsSoon();
}

let typingTimer: ReturnType<typeof setTimeout> | undefined;

function pruneTyping(): void {
  const now = Date.now();
  let next: number | undefined;
  const typing: Record<PeerId, Record<PeerId, number>> = {};
  for (const [chatId, users] of Object.entries(state().typing)) {
    const alive = Object.entries(users).filter(([, until]) => until > now);
    if (!alive.length) continue;
    typing[chatId] = Object.fromEntries(alive);
    for (const [, until] of alive) next = Math.min(next ?? until, until);
  }
  useMessagingStore.setState({ typing });
  clearTimeout(typingTimer);
  if (next !== undefined) typingTimer = setTimeout(pruneTyping, next - now + 50);
}

function onEvent(e: MessagingEvent): void {
  switch (e.type) {
    case 'message:new':
      onNewMessage(e.message);
      break;
    case 'message:edited':
      onEdited(e.message);
      break;
    case 'message:deleted':
      onDeleted(e.chatId, e.ids);
      break;
    case 'chat:read':
      onRead(e);
      break;
    case 'presence':
      setChats((chats) => updateChat(chats, e.userId, (c) => ({ ...c, presence: e.presence })));
      break;
    case 'typing':
      useMessagingStore.setState((s) => ({
        typing: { ...s.typing, [e.chatId]: { ...s.typing[e.chatId], [e.userId]: Date.now() + TYPING_TTL_MS } },
      }));
      pruneTyping();
      break;
    case 'connection':
      useMessagingStore.setState({ connection: e.state });
      if (e.state !== 'connected') {
        connectionEpoch++;
        useMessagingStore.setState((s) => ({
          threads: Object.fromEntries(Object.entries(s.threads).map(([id, t]) => [id, { ...t, live: false }])),
        }));
      } else {
        if (chatsBootstrapped) void refreshChats();
        for (const chatId of retained.keys()) void refreshThread(chatId);
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

let wired = false;

/** Connects the store to the service. Idempotent; called by every hook. */
export function ensureSync(): void {
  if (wired) return;
  wired = true;
  messaging.subscribe(onEvent);
  meChanged.on((me) => {
    if (me && state().me?.id === me.id) {
      useMessagingStore.setState({ me });
      return;
    }
    // Different account (or logout): nothing cached in memory is valid anymore.
    chatsBootstrapped = false;
    retained.clear();
    payloads.clear();
    lastReadSent.clear();
    resetMessagingStore(me);
  });
}

