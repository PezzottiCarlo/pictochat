/**
 * GramJS client lifecycle: lazy loading, single instance, connection state machine,
 * peer resolution and the raw update pipe. GramJS is only reached via dynamic import.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Api, TelegramClient } from 'telegram';
import type { ConnectionState, MessagingEvent, PeerId } from '@/core/types';
import { loadPeerRefs, savePeerRefs, type PeerRef } from '@/services/storage';
import { SESSION_KEY, TG_API_HASH, TG_API_ID } from './config';
import { Emitter } from './emitter';
import { isSessionRevoked } from './errors';
import { peerIdOf, peerRefOf, type MapContext, type TL } from './mappers';
import { mapUpdate } from './updates';

export type Gram = typeof import('telegram');

// ---------------------------------------------------------------------------
// Lazy GramJS
// ---------------------------------------------------------------------------

let gramPromise: Promise<Gram> | undefined;

export function loadGram(): Promise<Gram> {
  gramPromise ??= import('telegram')
    .then((m) => {
      // CJS interop: named exports may only live on `default` after bundling.
      const mod = m as Gram & { default?: Gram };
      return mod.TelegramClient ? mod : (mod.default as Gram);
    })
    .catch((err: unknown) => {
      gramPromise = undefined;
      throw err;
    });
  return gramPromise;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** Public stream of domain events (fed by GramJS updates + connection changes). */
export const events = new Emitter<MessagingEvent>();
/** Internal: emitted when the session becomes invalid (revoked elsewhere, logout). */
export const sessionLost = new Emitter<void>();

let connection: ConnectionState = 'disconnected';

export function getConnectionState(): ConnectionState {
  return connection;
}

function setConnection(next: ConnectionState, force = false): void {
  if (next === connection && !force) return;
  connection = next;
  events.emit({ type: 'connection', state: next });
}

// ---------------------------------------------------------------------------
// Session persistence
// ---------------------------------------------------------------------------

function readSession(): string {
  try {
    return localStorage.getItem(SESSION_KEY) ?? '';
  } catch {
    return '';
  }
}

export function hasSession(): boolean {
  return readSession().length > 0;
}

/** Saves the auth key; called after a successful login (and refreshed on reconnects). */
export function persistSession(): void {
  if (!client) return;
  try {
    const value = client.session.save() as unknown as string;
    if (value) localStorage.setItem(SESSION_KEY, value);
  } catch {
    /* storage full / unavailable */
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Entities and peers
// ---------------------------------------------------------------------------

let meId: PeerId | undefined;
const entities = new Map<PeerId, TL>();
const peerRefs = new Map<PeerId, PeerRef>();
let peerRefsLoaded: Promise<void> | undefined;
let pendingRefs: PeerRef[] = [];
let refsTimer: ReturnType<typeof setTimeout> | undefined;

export function setMeId(id: PeerId | undefined): void {
  meId = id;
}

export const mapContext: MapContext = {
  get meId() {
    return meId;
  },
  entity: (id) => entities.get(id),
};

function ensurePeerRefs(): Promise<void> {
  peerRefsLoaded ??= loadPeerRefs().then((refs) => {
    for (const ref of refs) if (!peerRefs.has(ref.id)) peerRefs.set(ref.id, ref);
  });
  return peerRefsLoaded;
}

/** Records raw entities for name lookup, avatars and InputPeer reconstruction. */
export function rememberEntities(list: Iterable<TL>): void {
  for (const entity of list) {
    const id = peerIdOf(entity);
    if (!id) continue;
    const known = entities.get(id);
    if (!(entity.min && known && !known.min)) entities.set(id, entity);
    const ref = peerRefOf(entity);
    const prev = peerRefs.get(id);
    if (ref && (prev?.accessHash !== ref.accessHash || !prev)) {
      peerRefs.set(id, ref);
      pendingRefs.push(ref);
    }
  }
  if (pendingRefs.length && !refsTimer) {
    refsTimer = setTimeout(() => {
      refsTimer = undefined;
      const batch = pendingRefs;
      pendingRefs = [];
      void savePeerRefs(batch);
    }, 1000);
  }
}

/** Entities attached by GramJS to a fetched message (sender, chat, action users). */
export function rememberMessageEntities(msg: TL): void {
  const list: TL[] = [];
  if (msg?._entities instanceof Map) list.push(...msg._entities.values());
  if (msg?._sender) list.push(msg._sender);
  if (msg?._chat) list.push(msg._chat);
  if (Array.isArray(msg?._actionEntities)) list.push(...msg._actionEntities.filter(Boolean));
  rememberEntities(list);
}

export function getEntity(id: PeerId): TL | undefined {
  return entities.get(id);
}

// Raw messages are needed to download media; keep a bounded LRU.
const RAW_CACHE_LIMIT = 400;
const rawMessages = new Map<string, Api.Message>();

export function cacheRawMessage(chatId: PeerId, msg: TL): void {
  if (!msg || msg.className !== 'Message') return;
  const key = `${chatId}:${msg.id}`;
  rawMessages.delete(key);
  rawMessages.set(key, msg);
  if (rawMessages.size > RAW_CACHE_LIMIT) rawMessages.delete(rawMessages.keys().next().value!);
}

export function getRawMessage(chatId: PeerId, id: number): Api.Message | undefined {
  return rawMessages.get(`${chatId}:${id}`);
}

// ---------------------------------------------------------------------------
// Client + connection state machine
// ---------------------------------------------------------------------------

let client: TelegramClient | undefined;
let clientPromise: Promise<TelegramClient> | undefined;
let connectPromise: Promise<void> | undefined;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryAttempt = 0;
/** False after logout: no automatic reconnection. */
let wanted = false;
let listenersAttached = false;
let hiddenAt = 0;

const CONNECT_TIMEOUT_MS = 20_000;
const MAX_BACKOFF_MS = 30_000;
/** After this long in background, missed updates are likely: ask hooks to resync. */
const RESYNC_AFTER_HIDDEN_MS = 60_000;

export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error(label)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function createClient(): Promise<TelegramClient> {
  const gram = await loadGram();
  const session = new gram.sessions.StringSession(readSession());
  const c = new gram.TelegramClient(session, TG_API_ID, TG_API_HASH, {
    connectionRetries: 3,
    retryDelay: 1000,
    autoReconnect: true,
    // Flood waits longer than this surface as errors (shown to the user) instead of hanging.
    floodSleepThreshold: 10,
    useWSS: true,
    deviceModel: 'PictoChat Web',
    appVersion: '2.0',
    systemVersion: typeof navigator !== 'undefined' ? navigator.platform || 'Web' : 'Web',
    langCode: 'it',
    systemLangCode: 'it',
    baseLogger: new gram.Logger('error' as never),
  });
  // Plain text only: GramJS defaults to markdown, which would eat "*", "_" and "`".
  c.setParseMode(undefined);
  c.addEventHandler((update: TL) => onRawUpdate(update));
  attachWindowListeners();
  void ensurePeerRefs();
  client = c;
  return c;
}

export function getClient(): Promise<TelegramClient> {
  clientPromise ??= createClient().catch((err: unknown) => {
    clientPromise = undefined;
    throw err;
  });
  return clientPromise;
}

function isReconnecting(c: TelegramClient): boolean {
  const sender = (c as any)._sender;
  return !!sender && (sender.isReconnecting || sender.isConnecting);
}

function waitForConnected(ms: number): Promise<void> {
  if (connection === 'connected') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      off();
      reject(new Error('timeout'));
    }, ms);
    const off = events.on((e) => {
      if (e.type === 'connection' && e.state === 'connected') {
        clearTimeout(timer);
        off();
        resolve();
      }
    });
  });
}

async function connectOnce(c: TelegramClient): Promise<void> {
  clearTimeout(retryTimer);
  setConnection('connecting');
  try {
    if (isReconnecting(c)) await waitForConnected(CONNECT_TIMEOUT_MS);
    else {
      const ok = await withTimeout(c.connect(), CONNECT_TIMEOUT_MS);
      if (!ok && !c.connected) throw new Error('connect failed');
    }
    retryAttempt = 0;
    if (hasSession()) persistSession();
    setConnection('connected');
  } catch (err) {
    setConnection('disconnected');
    scheduleRetry();
    throw err;
  }
}

function scheduleRetry(): void {
  if (!wanted) return;
  clearTimeout(retryTimer);
  const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** retryAttempt) * (0.8 + Math.random() * 0.4);
  retryAttempt++;
  retryTimer = setTimeout(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return; // 'online' will retry
    void ensureConnected().catch(() => undefined);
  }, delay);
}

/** Connected client; concurrent callers share one attempt. Rejects when offline. */
export async function ensureConnected(): Promise<TelegramClient> {
  wanted = true;
  const c = await getClient();
  if (c.connected && connection === 'connected') return c;
  connectPromise ??= connectOnce(c).finally(() => {
    connectPromise = undefined;
  });
  await connectPromise;
  return c;
}

function onConnectionUpdate(state: number): void {
  if (state === 1) {
    retryAttempt = 0;
    setConnection('connected');
  } else if (state === 0) {
    setConnection('connecting'); // GramJS is reconnecting by itself
  } else {
    // During our own connect attempt GramJS reports intermediate failures: ignore them.
    if (connectPromise) return;
    setConnection('disconnected');
    scheduleRetry();
  }
}

function attachWindowListeners(): void {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;
  window.addEventListener('online', () => {
    if (!wanted) return;
    retryAttempt = 0;
    void ensureConnected().catch(() => undefined);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }
    if (!wanted) return;
    const longAway = hiddenAt > 0 && Date.now() - hiddenAt > RESYNC_AFTER_HIDDEN_MS;
    hiddenAt = 0;
    if (connection !== 'connected') void ensureConnected().catch(() => undefined);
    // Re-emit so data hooks refetch what may have been missed while suspended.
    else if (longAway) setConnection('connected', true);
  });
}

function onRawUpdate(update: TL): void {
  if (update && !update.className && typeof update.state === 'number') {
    onConnectionUpdate(update.state);
    return;
  }
  if (update?._entities instanceof Map) rememberEntities(update._entities.values());
  const message = update?.message;
  if (message && typeof message === 'object') {
    const chatId = peerIdOf(message.peerId);
    if (chatId) cacheRawMessage(chatId, message);
  }
  for (const event of mapUpdate(update, mapContext)) events.emit(event);
}

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------

/**
 * Runs `fn` with a connected client. A revoked/expired session wipes the local
 * session and notifies `sessionLost` (the UI goes back to login).
 */
export async function call<T>(fn: (c: TelegramClient, gram: Gram) => Promise<T>): Promise<T> {
  const [c, gram] = await Promise.all([ensureConnected(), loadGram()]);
  try {
    return await fn(c, gram);
  } catch (err) {
    if (isSessionRevoked(err) && hasSession()) {
      clearSession();
      sessionLost.emit();
    }
    throw err;
  }
}

let warmPromise: Promise<void> | undefined;

/** Fills GramJS' entity cache (needed to resolve peers after a reload). */
export function warmDialogs(c: TelegramClient): Promise<void> {
  warmPromise ??= c
    .getDialogs({ limit: 100 })
    .then((dialogs) => {
      rememberEntities(dialogs.map((d) => d.entity).filter(Boolean));
    })
    .catch((err: unknown) => {
      warmPromise = undefined;
      throw err;
    });
  return warmPromise;
}

/** InputPeer for a marked id: memory → persisted access hash → GramJS cache → dialogs. */
export async function resolvePeer(c: TelegramClient, gram: Gram, id: PeerId): Promise<Api.TypeInputPeer> {
  if (meId && id === meId) return new gram.Api.InputPeerSelf();
  const entity = entities.get(id);
  if (entity && !entity.min) {
    try {
      return gram.utils.getInputPeer(entity);
    } catch {
      /* fall through */
    }
  }
  await ensurePeerRefs();
  const ref = peerRefs.get(id);
  const big = gram.helpers.returnBigInt;
  if (ref?.type === 'chat') return new gram.Api.InputPeerChat({ chatId: big(ref.rawId) });
  if (ref?.accessHash !== undefined) {
    return ref.type === 'user'
      ? new gram.Api.InputPeerUser({ userId: big(ref.rawId), accessHash: big(ref.accessHash) })
      : new gram.Api.InputPeerChannel({ channelId: big(ref.rawId), accessHash: big(ref.accessHash) });
  }
  try {
    return await c.getInputEntity(big(id));
  } catch {
    await warmDialogs(c);
    return c.getInputEntity(big(id));
  }
}

/** Raw entity with its `photo` field (for profile photo downloads). */
export async function resolveEntity(c: TelegramClient, gram: Gram, id: PeerId): Promise<TL> {
  const known = entities.get(id);
  if (known && !known.min) return known;
  const entity = await c.getEntity(await resolvePeer(c, gram, id));
  rememberEntities([entity]);
  return entity;
}

/** Disconnects and forgets everything in memory (logout / revoked session). */
export async function resetClient(): Promise<void> {
  wanted = false;
  clearTimeout(retryTimer);
  const c = client;
  client = undefined;
  clientPromise = undefined;
  connectPromise = undefined;
  warmPromise = undefined;
  peerRefsLoaded = undefined;
  meId = undefined;
  entities.clear();
  peerRefs.clear();
  pendingRefs = [];
  rawMessages.clear();
  clearSession();
  if (c) await withTimeout(c.destroy(), 5000).catch(() => undefined);
  setConnection('disconnected');
}

