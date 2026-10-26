/**
 * Pure list logic for messages and chats (no I/O, no React), unit tested.
 *
 * Message lists are ascending: server messages (id > 0) by id, then optimistic
 * local ones (id < 0) by date, which always stay at the bottom until reconciled.
 */
import type { ChatMessage, ChatSummary, PeerId } from '@/core/types';

const isLocal = (m: ChatMessage) => m.id < 0;

export function sortMessages(list: ChatMessage[]): ChatMessage[] {
  const server = list.filter((m) => !isLocal(m)).sort((a, b) => a.id - b.id);
  const local = list.filter(isLocal).sort((a, b) => a.date - b.date || b.id - a.id);
  return [...server, ...local];
}

/** Union by id (incoming wins, but a known 'read' status is never downgraded). */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (!incoming.length) return existing;
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const m of incoming) {
    const prev = byId.get(m.id);
    byId.set(m.id, prev?.status === 'read' && m.out ? { ...m, status: 'read' } : m);
  }
  return sortMessages([...byId.values()]);
}

export function maxServerId(list: ChatMessage[]): number {
  let max = 0;
  for (const m of list) if (m.id > max) max = m.id;
  return max;
}

export function minServerId(list: ChatMessage[]): number | undefined {
  let min: number | undefined;
  for (const m of list) if (m.id > 0 && (min === undefined || m.id < min)) min = m.id;
  return min;
}

export interface RefreshResult {
  messages: ChatMessage[];
  /** Cached ids that turned out to be deleted on the server. */
  removedIds: number[];
  /**
   * The fresh page does not reach the cached messages: everything older than it
   * is dropped (and must be dropped from storage too) so paging can't skip a hole.
   */
  gapBelow?: number;
}

/**
 * Applies the newest page fetched from the network (ascending, `limit` requested)
 * onto the current list. The fresh page is authoritative for [min, max] of its ids.
 * `anchorId` is the highest id known to be contiguous with the older messages
 * (defaults to the highest server id in `existing`).
 */
export function applyRefresh(
  existing: ChatMessage[],
  fresh: ChatMessage[],
  limit: number,
  anchorId?: number,
): RefreshResult {
  const local = existing.filter(isLocal);
  const server = existing.filter((m) => !isLocal(m));
  if (!fresh.length) {
    // The chat has no history at all.
    return { messages: local, removedIds: server.map((m) => m.id) };
  }
  const freshIds = new Set(fresh.map((m) => m.id));
  const min = fresh[0].id;
  const max = fresh[fresh.length - 1].id;
  const complete = fresh.length < limit;
  const anchor = anchorId ?? maxServerId(server);
  const gap = !complete && server.some((m) => m.id < min) && min > anchor;
  const removedIds: number[] = [];
  const kept: ChatMessage[] = [];
  for (const m of server) {
    if (m.id > max) kept.push(m); // arrived through an update while the request was in flight
    else if (m.id >= min) {
      if (!freshIds.has(m.id)) removedIds.push(m.id);
    } else if (complete) removedIds.push(m.id);
    else if (!gap) kept.push(m);
  }
  return {
    messages: mergeMessages([...kept, ...local], fresh),
    removedIds,
    gapBelow: gap ? min : undefined,
  };
}

/**
 * Applies an older page (ascending, ids < beforeId). Cached ids inside the page's
 * range that are missing from it were deleted on the server.
 */
export function applyOlderPage(
  existing: ChatMessage[],
  page: ChatMessage[],
  beforeId: number,
): { messages: ChatMessage[]; removedIds: number[] } {
  if (!page.length) return { messages: existing, removedIds: [] };
  const pageIds = new Set(page.map((m) => m.id));
  const min = page[0].id;
  const removedIds = existing
    .filter((m) => m.id >= min && m.id < beforeId && !pageIds.has(m.id))
    .map((m) => m.id);
  const removed = new Set(removedIds);
  return {
    messages: mergeMessages(
      existing.filter((m) => !removed.has(m.id)),
      page,
    ),
    removedIds,
  };
}

/** Marks outgoing messages up to `maxId` as read; returns the same array when nothing changes. */
export function applyOutboxRead(list: ChatMessage[], maxId: number | undefined): ChatMessage[] {
  if (!maxId) return list;
  let changed = false;
  const next = list.map((m) => {
    if (m.out && m.id > 0 && m.id <= maxId && m.status !== 'read') {
      changed = true;
      return { ...m, status: 'read' as const };
    }
    return m;
  });
  return changed ? next : list;
}

export function removeMessages(list: ChatMessage[], ids: number[]): ChatMessage[] {
  if (!ids.length) return list;
  const drop = new Set(ids);
  const next = list.filter((m) => !drop.has(m.id));
  return next.length === list.length ? list : next;
}

/** Replaces a message only if present (edits must not insert unknown messages). */
export function replaceMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const i = list.findIndex((m) => m.id === message.id);
  if (i < 0) return list;
  const prev = list[i];
  const next = list.slice();
  next[i] = prev.status === 'read' && message.out ? { ...message, status: 'read' } : message;
  return next;
}

/** Swaps an optimistic message for its server copy. */
export function reconcileLocal(list: ChatMessage[], localId: number, server: ChatMessage): ChatMessage[] {
  return mergeMessages(
    list.filter((m) => m.id !== localId),
    [server],
  );
}

/** Pending optimistic message an incoming outgoing server message most likely corresponds to. */
export function findPendingMatch(list: ChatMessage[], server: ChatMessage): ChatMessage | undefined {
  if (!server.out) return undefined;
  return list.find(
    (m) =>
      isLocal(m) &&
      m.status === 'sending' &&
      m.text === server.text &&
      !!m.media === !!server.media,
  );
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

/** Pinned chats first (their relative order is kept), then by last message date. */
export function sortChats(chats: ChatSummary[]): ChatSummary[] {
  const pinned = chats.filter((c) => c.pinned);
  const others = chats
    .filter((c) => !c.pinned)
    .map((c, i) => ({ c, i }))
    .sort((a, b) => (b.c.lastMessage?.date ?? 0) - (a.c.lastMessage?.date ?? 0) || a.i - b.i)
    .map(({ c }) => c);
  return [...pinned, ...others];
}

/**
 * Updates a chat for a new message. Returns null when the chat is unknown (the
 * caller should refresh the list).
 */
export function applyNewMessageToChats(
  chats: ChatSummary[],
  message: ChatMessage,
  countUnread: boolean,
): ChatSummary[] | null {
  const i = chats.findIndex((c) => c.id === message.chatId);
  if (i < 0) return null;
  const chat = chats[i];
  const last = chat.lastMessage;
  const isNewer = !last || last.id < 0 || message.id < 0 || message.id >= last.id;
  const updated: ChatSummary = {
    ...chat,
    lastMessage: isNewer ? message : last,
    unreadCount: countUnread && !message.out ? chat.unreadCount + 1 : chat.unreadCount,
  };
  const next = chats.slice();
  next[i] = updated;
  return sortChats(next);
}

export function updateChat(
  chats: ChatSummary[],
  chatId: PeerId,
  patch: (chat: ChatSummary) => ChatSummary,
): ChatSummary[] {
  const i = chats.findIndex((c) => c.id === chatId);
  if (i < 0) return chats;
  const updated = patch(chats[i]);
  if (updated === chats[i]) return chats;
  const next = chats.slice();
  next[i] = updated;
  return next;
}
