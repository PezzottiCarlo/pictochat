/**
 * GramJS → domain mappers. Pure functions that discriminate on TL `className`,
 * so this module never imports GramJS (keeps it out of the main chunk and testable
 * with plain fake objects).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  ChatKind,
  ChatMessage,
  ChatSummary,
  MediaInfo,
  Me,
  PeerId,
  Presence,
} from '@/core/types';
import type { PeerRef } from '@/services/storage';
import { strippedToDataUrl } from './strippedThumb';

/** Any GramJS TL object at the boundary. */
export type TL = any;

export interface MapContext {
  meId?: PeerId;
  /** Raw GramJS entity (User/Chat/Channel) by marked peer id. */
  entity?: (id: PeerId) => TL | undefined;
}

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/** number | bigint | big-integer → number (safe for sizes and ids < 2^53). */
export function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v));
  return Number.isFinite(n) ? n : undefined;
}

function idString(v: unknown): string {
  return typeof v === 'string' ? v : String(v);
}

const secondsToMs = (s: unknown): number | undefined => {
  const n = toNumber(s);
  return n ? n * 1000 : undefined;
};

/**
 * Marked peer id, exactly like GramJS `utils.getPeerId`: users positive,
 * basic groups `-id`, channels/supergroups `-100id`. Accepts Peer, InputPeer and entities.
 */
export function peerIdOf(peer: TL): PeerId | undefined {
  if (!peer || typeof peer !== 'object') return undefined;
  switch (peer.className) {
    case 'PeerUser':
    case 'InputPeerUser':
    case 'InputPeerUserFromMessage':
      return idString(peer.userId);
    case 'PeerChat':
    case 'InputPeerChat':
      return `-${idString(peer.chatId)}`;
    case 'PeerChannel':
    case 'InputPeerChannel':
    case 'InputPeerChannelFromMessage':
      return `-100${idString(peer.channelId)}`;
    case 'User':
    case 'UserEmpty':
      return idString(peer.id);
    case 'Chat':
    case 'ChatEmpty':
    case 'ChatForbidden':
      return `-${idString(peer.id)}`;
    case 'Channel':
    case 'ChannelForbidden':
      return `-100${idString(peer.id)}`;
    default:
      return undefined;
  }
}

/** Splits a marked id back into its TL type and raw id (inverse of `peerIdOf`). */
export function parsePeerId(id: PeerId): { type: PeerRef['type']; rawId: string } {
  if (id.startsWith('-100') && id.length > 4) return { type: 'channel', rawId: id.slice(4) };
  if (id.startsWith('-')) return { type: 'chat', rawId: id.slice(1) };
  return { type: 'user', rawId: id };
}

/** Access data for InputPeer reconstruction; skips `min` entities (their hash is unusable). */
export function peerRefOf(entity: TL): PeerRef | undefined {
  const id = peerIdOf(entity);
  if (!id || entity.min) return undefined;
  const { type, rawId } = parsePeerId(id);
  if (type === 'chat') return { id, type, rawId };
  if (entity.accessHash === undefined || entity.accessHash === null) return undefined;
  return { id, type, rawId, accessHash: idString(entity.accessHash) };
}

export function displayName(entity: TL): string {
  if (!entity) return '';
  if (entity.className === 'User') {
    if (entity.deleted) return 'Account eliminato';
    const name = [entity.firstName, entity.lastName].filter(Boolean).join(' ').trim();
    return name || (entity.username ? `@${entity.username}` : entity.phone ? `+${entity.phone}` : 'Utente');
  }
  if (typeof entity.title === 'string') return entity.title;
  return '';
}

export function chatKindOf(entity: TL, meId?: PeerId): ChatKind {
  switch (entity?.className) {
    case 'User':
    case 'UserEmpty':
      if (entity.self || (meId && idString(entity.id) === meId)) return 'self';
      return entity.bot ? 'bot' : 'user';
    case 'Channel':
    case 'ChannelForbidden':
      return entity.megagroup || entity.gigagroup ? 'group' : 'channel';
    default:
      return 'group';
  }
}

function hasPhoto(entity: TL): boolean {
  const photo = entity?.photo;
  return !!photo && photo.className !== 'UserProfilePhotoEmpty' && photo.className !== 'ChatPhotoEmpty';
}

export function mapPresence(status: TL): Presence {
  switch (status?.className) {
    case 'UserStatusOnline':
      return { state: 'online' };
    case 'UserStatusOffline':
      return { state: 'offline', lastSeen: secondsToMs(status.wasOnline) };
    case 'UserStatusRecently':
      return { state: 'recently' };
    case 'UserStatusLastWeek':
      return { state: 'lastWeek' };
    case 'UserStatusLastMonth':
      return { state: 'lastMonth' };
    default:
      return { state: 'unknown' };
  }
}

export function mapMe(user: TL): Me {
  return {
    id: idString(user.id),
    firstName: user.firstName ?? '',
    lastName: user.lastName || undefined,
    username: user.username || undefined,
    phone: user.phone || undefined,
  };
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

function strippedThumb(sizes: TL[] | undefined): string | undefined {
  const stripped = sizes?.find((s) => s?.className === 'PhotoStrippedSize');
  return stripped ? strippedToDataUrl(stripped.bytes) : undefined;
}

function largestPhotoSize(sizes: TL[] | undefined): { w?: number; h?: number } {
  let best: { w?: number; h?: number } = {};
  for (const s of sizes ?? []) {
    if (typeof s?.w === 'number' && (best.w === undefined || s.w > best.w)) best = { w: s.w, h: s.h };
  }
  return best;
}

function mapDocument(doc: TL): MediaInfo {
  const info: MediaInfo = {
    kind: 'document',
    mimeType: doc.mimeType || undefined,
    size: toNumber(doc.size),
    thumbDataUrl: strippedThumb(doc.thumbs),
  };
  let isSticker = false;
  let isAnimated = false;
  let video: TL;
  let audio: TL;
  for (const attr of doc.attributes ?? []) {
    switch (attr?.className) {
      case 'DocumentAttributeFilename':
        info.fileName = attr.fileName;
        break;
      case 'DocumentAttributeSticker':
        isSticker = true;
        info.description = attr.alt || undefined;
        break;
      case 'DocumentAttributeAnimated':
        isAnimated = true;
        break;
      case 'DocumentAttributeVideo':
        video = attr;
        break;
      case 'DocumentAttributeAudio':
        audio = attr;
        break;
      case 'DocumentAttributeImageSize':
        info.width = attr.w;
        info.height = attr.h;
        break;
    }
  }
  if (video) {
    info.width = video.w;
    info.height = video.h;
    info.duration = Math.round(toNumber(video.duration) ?? 0);
  }
  if (isSticker) info.kind = 'sticker';
  else if (isAnimated) info.kind = 'gif';
  else if (video) info.kind = 'video';
  else if (audio) {
    info.kind = audio.voice ? 'voice' : 'audio';
    info.duration = toNumber(audio.duration);
    if (!audio.voice) {
      info.title = audio.title || undefined;
      info.description = audio.performer || undefined;
    }
  }
  return info;
}

export function mapMedia(media: TL): MediaInfo | undefined {
  if (!media) return undefined;
  switch (media.className) {
    case 'MessageMediaEmpty':
      return undefined;
    case 'MessageMediaPhoto': {
      const photo = media.photo;
      if (!photo || photo.className !== 'Photo') return { kind: 'photo' };
      const { w, h } = largestPhotoSize(photo.sizes);
      return { kind: 'photo', mimeType: 'image/jpeg', width: w, height: h, thumbDataUrl: strippedThumb(photo.sizes) };
    }
    case 'MessageMediaDocument':
      return media.document?.className === 'Document' ? mapDocument(media.document) : { kind: 'document' };
    case 'MessageMediaGeo':
    case 'MessageMediaGeoLive':
    case 'MessageMediaVenue':
      return {
        kind: 'location',
        latitude: media.geo?.lat,
        longitude: media.geo?.long,
        title: media.title || undefined,
        description: media.address || undefined,
      };
    case 'MessageMediaContact':
      return {
        kind: 'contact',
        title: [media.firstName, media.lastName].filter(Boolean).join(' ') || undefined,
        description: media.phoneNumber || undefined,
      };
    case 'MessageMediaPoll': {
      const q = media.poll?.question;
      return { kind: 'poll', title: typeof q === 'string' ? q : q?.text };
    }
    case 'MessageMediaWebPage': {
      const page = media.webpage;
      if (page?.className !== 'WebPage') return { kind: 'webpage', url: page?.url };
      return {
        kind: 'webpage',
        url: page.url,
        title: page.title || page.siteName || undefined,
        description: page.description || undefined,
        thumbDataUrl: page.photo?.className === 'Photo' ? strippedThumb(page.photo.sizes) : undefined,
      };
    }
    default:
      return { kind: 'unknown' };
  }
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

function nameOf(id: PeerId | undefined, ctx: MapContext): string | undefined {
  if (!id) return undefined;
  const name = displayName(ctx.entity?.(id));
  return name || undefined;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m} min ${s} s` : `${s} s`;
}

/** Italian description of a service action ("Marco ha aggiunto Luca"). */
export function serviceText(
  action: TL,
  actorId: PeerId | undefined,
  out: boolean,
  ctx: MapContext,
): string {
  const actor = nameOf(actorId, ctx);
  // Second person for our own actions, third person otherwise.
  const who = (third: string, second: string) => (out ? second : `${actor ?? 'Qualcuno'} ${third}`);
  const userName = (id: unknown) => nameOf(idString(id), ctx) ?? 'un utente';
  switch (action?.className) {
    case 'MessageActionChatCreate':
      return who(`ha creato il gruppo «${action.title}»`, `Hai creato il gruppo «${action.title}»`);
    case 'MessageActionChannelCreate':
      return `Canale «${action.title}» creato`;
    case 'MessageActionChatEditTitle':
      return who(`ha cambiato il nome in «${action.title}»`, `Hai cambiato il nome in «${action.title}»`);
    case 'MessageActionChatEditPhoto':
      return who('ha cambiato la foto del gruppo', 'Hai cambiato la foto del gruppo');
    case 'MessageActionChatDeletePhoto':
      return who('ha rimosso la foto del gruppo', 'Hai rimosso la foto del gruppo');
    case 'MessageActionChatAddUser': {
      const users: unknown[] = action.users ?? [];
      const names = users.map(userName).join(', ');
      return who(`ha aggiunto ${names}`, `Hai aggiunto ${names}`);
    }
    case 'MessageActionChatDeleteUser': {
      if (actorId && idString(action.userId) === actorId)
        return who('ha lasciato il gruppo', 'Hai lasciato il gruppo');
      const target = userName(action.userId);
      return who(`ha rimosso ${target}`, `Hai rimosso ${target}`);
    }
    case 'MessageActionChatJoinedByLink':
    case 'MessageActionChatJoinedByRequest':
      return who('è entrato nel gruppo', 'Sei entrato nel gruppo');
    case 'MessageActionChatMigrateTo':
    case 'MessageActionChannelMigrateFrom':
      return 'Il gruppo è stato aggiornato';
    case 'MessageActionPinMessage':
      return who('ha fissato un messaggio', 'Hai fissato un messaggio');
    case 'MessageActionHistoryClear':
      return 'Cronologia cancellata';
    case 'MessageActionScreenshotTaken':
      return who('ha fatto uno screenshot', 'Hai fatto uno screenshot');
    case 'MessageActionContactSignUp':
      return `${actor ?? 'Un contatto'} si è iscritto a Telegram`;
    case 'MessageActionPhoneCall': {
      const kind = action.video ? 'Videochiamata' : 'Chiamata';
      const reason = action.reason?.className;
      if (reason === 'PhoneCallDiscardReasonMissed') return out ? `${kind} annullata` : `${kind} persa`;
      if (reason === 'PhoneCallDiscardReasonBusy') return `${kind} rifiutata`;
      const duration = toNumber(action.duration);
      const base = out ? `${kind} in uscita` : `${kind} in arrivo`;
      return duration ? `${base} (${formatDuration(duration)})` : base;
    }
    case 'MessageActionGroupCall':
      return action.duration ? 'Chiamata di gruppo terminata' : 'Chiamata di gruppo avviata';
    case 'MessageActionSetMessagesTTL':
      return toNumber(action.period)
        ? 'Eliminazione automatica dei messaggi attivata'
        : 'Eliminazione automatica dei messaggi disattivata';
    case 'MessageActionCustomAction':
      return action.message || 'Messaggio di servizio';
    default:
      return 'Messaggio di servizio';
  }
}

/** Maps Message / MessageService; returns null for MessageEmpty or unknown objects. */
export function mapMessage(msg: TL, ctx: MapContext = {}): ChatMessage | null {
  if (!msg || (msg.className !== 'Message' && msg.className !== 'MessageService')) return null;
  const chatId = peerIdOf(msg.peerId);
  if (!chatId) return null;
  const out = !!msg.out;
  // In private chats fromId is omitted for incoming messages: the sender is the chat itself.
  const senderId =
    peerIdOf(msg.fromId) ?? (out ? ctx.meId : parsePeerId(chatId).type === 'user' ? chatId : undefined);
  const senderName = out ? undefined : nameOf(senderId, ctx);
  const base: ChatMessage = {
    id: msg.id,
    chatId,
    senderId,
    senderName,
    out,
    date: secondsToMs(msg.date) ?? 0,
    text: '',
  };
  if (msg.className === 'MessageService') {
    return { ...base, service: true, text: serviceText(msg.action, senderId, out, ctx) };
  }
  const message: ChatMessage = {
    ...base,
    text: typeof msg.message === 'string' ? msg.message : '',
    editDate: msg.editHide ? undefined : secondsToMs(msg.editDate),
    media: mapMedia(msg.media),
    replyToId: msg.replyTo?.replyToMsgId ?? undefined,
  };
  if (out) message.status = 'sent';
  return stripUndefined(message);
}

function stripUndefined<T extends object>(obj: T): T {
  for (const key of Object.keys(obj) as (keyof T)[]) if (obj[key] === undefined) delete obj[key];
  return obj;
}

// ---------------------------------------------------------------------------
// Chats
// ---------------------------------------------------------------------------

/** Summary for a bare entity (e.g. a chat that appears for the first time in an update). */
export function mapEntityToSummary(entity: TL, ctx: MapContext = {}): ChatSummary | null {
  const id = peerIdOf(entity);
  if (!id) return null;
  const kind = chatKindOf(entity, ctx.meId);
  const summary: ChatSummary = {
    id,
    kind,
    title: kind === 'self' ? 'Messaggi salvati' : displayName(entity),
    username: entity.username || undefined,
    unreadCount: 0,
    pinned: false,
    muted: false,
    hasPhoto: hasPhoto(entity),
  };
  if (entity.className === 'User' && kind !== 'self' && kind !== 'bot') summary.presence = mapPresence(entity.status);
  return stripUndefined(summary);
}

/** Maps a GramJS custom `Dialog` (from client.getDialogs). */
export function mapDialog(dialog: TL, ctx: MapContext = {}): ChatSummary | null {
  const entity = dialog?.entity;
  if (!entity) return null;
  const summary = mapEntityToSummary(entity, ctx);
  if (!summary) return null;
  const raw = dialog.dialog ?? {};
  const muteUntil = toNumber(raw.notifySettings?.muteUntil) ?? 0;
  summary.unreadCount = toNumber(dialog.unreadCount ?? raw.unreadCount) ?? 0;
  summary.pinned = !!(dialog.pinned ?? raw.pinned);
  summary.muted = muteUntil * 1000 > Date.now();
  const readOutbox = toNumber(raw.readOutboxMaxId);
  if (readOutbox) summary.readOutboxMaxId = readOutbox;
  const last = dialog.message ? mapMessage(dialog.message, ctx) : null;
  if (last) {
    if (last.out && readOutbox && last.id <= readOutbox) last.status = 'read';
    summary.lastMessage = last;
  }
  return summary;
}
