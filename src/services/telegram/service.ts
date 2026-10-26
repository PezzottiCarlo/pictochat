/** `MessagingService` implementation on top of GramJS (see contract.ts). */
import type { TelegramClient } from 'telegram';
import type { ChatMessage, ChatSummary, Me, PeerId } from '@/core/types';
import { clearMessagingStorage, migrateFromV1 } from '@/services/storage';
import {
  cacheRawMessage,
  call,
  events,
  getConnectionState,
  getRawMessage,
  hasSession,
  mapContext,
  persistSession,
  rememberEntities,
  rememberMessageEntities,
  resetClient,
  resolveEntity,
  resolvePeer,
  sessionLost,
  setMeId,
  withTimeout,
  type Gram,
} from './client';
import { ME_KEY, TG_API_HASH, TG_API_ID } from './config';
import type { MessagingService, SignInResult } from './contract';
import { Emitter } from './emitter';
import { isSessionRevoked, rpcErrorMessage, toAuthError } from './errors';
import { mapDialog, mapMe, mapMedia, mapMessage, type TL } from './mappers';

migrateFromV1();

// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------

/** Internal: the logged user changed (login, restore, logout, revoked session). */
export const meChanged = new Emitter<Me | null>();

export function readCachedMe(): Me | null {
  try {
    const raw = localStorage.getItem(ME_KEY);
    return raw && hasSession() ? (JSON.parse(raw) as Me) : null;
  } catch {
    return null;
  }
}

let currentMe: Me | null = readCachedMe();
setMeId(currentMe?.id);

function setMe(me: Me | null): void {
  currentMe = me;
  setMeId(me?.id);
  try {
    if (me) localStorage.setItem(ME_KEY, JSON.stringify(me));
    else localStorage.removeItem(ME_KEY);
  } catch {
    /* ignore */
  }
  meChanged.emit(me);
}

function completeLogin(user: TL): Me {
  persistSession();
  rememberEntities([user]);
  const me = mapMe(user);
  setMe(me);
  return me;
}

async function fetchMe(): Promise<Me> {
  const user = await call((c) => c.getMe());
  rememberEntities([user]);
  const me = mapMe(user);
  setMe(me);
  return me;
}

async function ensureMe(): Promise<void> {
  if (!currentMe) await fetchMe();
}

/** Local wipe shared by logout and revoked sessions. */
async function wipeLocal(): Promise<void> {
  await resetClient();
  await clearMessagingStorage();
  setMe(null);
}

sessionLost.on(() => {
  void wipeLocal();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const nonNull = <T>(v: T | null | undefined): v is T => v !== null && v !== undefined;

function toChatMessage(raw: TL, chatId: PeerId): ChatMessage {
  rememberMessageEntities(raw);
  cacheRawMessage(chatId, raw);
  const mapped = mapMessage(raw, mapContext);
  if (!mapped) throw new Error('Messaggio non valido');
  return { ...mapped, chatId };
}

function toBlob(data: unknown, type: string): Blob | null {
  if (!data || typeof data === 'string') return null;
  const bytes = data as Uint8Array;
  return bytes.length ? new Blob([new Uint8Array(bytes)], { type }) : null;
}

/** Tiny semaphore so a chat list with 100 avatars doesn't open 100 downloads at once. */
function limiter(max: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= max) await new Promise<void>((resolve) => queue.push(resolve));
    active++;
    try {
      return await task();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

const avatarSlots = limiter(4);
const mediaSlots = limiter(3);

const SEND_TIMEOUT_MS = 30_000;

async function rawMessage(c: TelegramClient, gram: Gram, chatId: PeerId, id: number): Promise<TL | undefined> {
  const cached = getRawMessage(chatId, id);
  if (cached) return cached;
  const peer = await resolvePeer(c, gram, chatId);
  const [msg] = await c.getMessages(peer, { ids: id });
  if (msg) cacheRawMessage(chatId, msg);
  return msg;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const messaging: MessagingService = {
  get connection() {
    return getConnectionState();
  },

  hasSession,

  async restore() {
    if (!hasSession()) return null;
    try {
      return await fetchMe();
    } catch (err) {
      if (isSessionRevoked(err)) {
        await wipeLocal();
        return null;
      }
      // Offline: keep working from cache.
      return currentMe;
    }
  },

  async sendCode(phone) {
    try {
      const res = await call((c) => c.sendCode({ apiId: TG_API_ID, apiHash: TG_API_HASH }, phone.replace(/[\s()-]/g, '')));
      return { phoneCodeHash: res.phoneCodeHash, viaApp: res.isCodeViaApp };
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async signIn({ phone, code, phoneCodeHash }): Promise<SignInResult> {
    try {
      const result = await call((c, gram) =>
        c.invoke(
          new gram.Api.auth.SignIn({
            phoneNumber: phone.replace(/[\s()-]/g, ''),
            phoneCodeHash,
            phoneCode: code.trim(),
          }),
        ),
      );
      if (result.className === 'auth.AuthorizationSignUpRequired') return { status: 'signup_required' };
      return { status: 'ok', me: completeLogin(result.user) };
    } catch (err) {
      if (rpcErrorMessage(err) === 'SESSION_PASSWORD_NEEDED') {
        const hint = await call((c, gram) => c.invoke(new gram.Api.account.GetPassword()))
          .then((p) => p.hint || undefined)
          .catch(() => undefined);
        return { status: 'password_needed', hint };
      }
      throw toAuthError(err);
    }
  },

  async checkPassword(password) {
    try {
      const result = await call(async (c, gram) => {
        const srp = await c.invoke(new gram.Api.account.GetPassword());
        const check = await gram.password.computeCheck(srp, password);
        return c.invoke(new gram.Api.auth.CheckPassword({ password: check }));
      });
      if (result.className !== 'auth.Authorization') throw new Error('Unexpected authorization result');
      return completeLogin(result.user);
    } catch (err) {
      throw toAuthError(err);
    }
  },

  async logout() {
    if (hasSession()) {
      await withTimeout(
        call((c, gram) => c.invoke(new gram.Api.auth.LogOut())),
        5000,
      ).catch(() => undefined);
    }
    await wipeLocal();
  },

  getMe: fetchMe,

  async listChats(): Promise<ChatSummary[]> {
    await ensureMe();
    return call(async (c) => {
      const dialogs = await c.getDialogs({ limit: 100, archived: false });
      rememberEntities(dialogs.map((d) => d.entity).filter(nonNull));
      for (const d of dialogs) {
        if (!d.message) continue;
        rememberMessageEntities(d.message);
        const id = d.id?.toString();
        if (id) cacheRawMessage(id, d.message);
      }
      return dialogs
        .map((d) => mapDialog(d, mapContext))
        .filter(nonNull)
        .filter((chat) => chat.kind !== 'channel');
    });
  },

  async getHistory(chatId, { limit, beforeId }) {
    await ensureMe();
    return call(async (c, gram) => {
      const peer = await resolvePeer(c, gram, chatId);
      const list = await c.getMessages(peer, { limit, offsetId: beforeId ?? 0 });
      return list
        .map((raw) => {
          rememberMessageEntities(raw);
          cacheRawMessage(chatId, raw);
          const mapped = mapMessage(raw, mapContext);
          return mapped ? { ...mapped, chatId } : null;
        })
        .filter(nonNull)
        .sort((a, b) => a.id - b.id);
    });
  },

  async sendText(chatId, text) {
    return call(async (c, gram) => {
      const peer = await resolvePeer(c, gram, chatId);
      const sent = await withTimeout(c.sendMessage(peer, { message: text }), SEND_TIMEOUT_MS);
      return toChatMessage(sent, chatId);
    });
  },

  async sendFile(chatId, file, opts) {
    return call(async (c, gram) => {
      const peer = await resolvePeer(c, gram, chatId);
      const visual = file.type.startsWith('image/') || file.type.startsWith('video/');
      const sent = await c.sendFile(peer, {
        file,
        caption: opts?.caption ?? '',
        forceDocument: !visual,
        supportsStreaming: file.type.startsWith('video/'),
        workers: 4,
      });
      return toChatMessage(sent, chatId);
    });
  },

  async markRead(chatId, maxId) {
    await call(async (c, gram) => {
      const peer = await resolvePeer(c, gram, chatId);
      await c.markAsRead(peer, maxId && maxId > 0 ? maxId : undefined);
    });
  },

  async downloadMedia(chatId, messageId) {
    return mediaSlots(() =>
      call(async (c, gram) => {
        const msg = await rawMessage(c, gram, chatId, messageId);
        if (!msg?.media) return null;
        const data = await c.downloadMedia(msg, {});
        const info = mapMedia(msg.media);
        return toBlob(data, info?.mimeType ?? 'application/octet-stream');
      }),
    );
  },

  async getAvatar(peerId, opts) {
    return avatarSlots(() =>
      call(async (c, gram) => {
        const entity = await resolveEntity(c, gram, peerId);
        const photo = entity?.photo;
        if (!photo || photo.className === 'UserProfilePhotoEmpty' || photo.className === 'ChatPhotoEmpty') return null;
        const data = await c.downloadProfilePhoto(entity, { isBig: !!opts?.big });
        return toBlob(data, 'image/jpeg');
      }),
    );
  },

  subscribe(listener) {
    return events.on(listener);
  },
};

export function getCurrentMe(): Me | null {
  return currentMe;
}
