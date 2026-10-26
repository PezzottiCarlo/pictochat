import { describe, expect, it } from 'vitest';
import { Api, utils } from 'telegram';
import bigInt from 'big-integer';
import { Buffer } from 'buffer';
import {
  chatKindOf,
  mapDialog,
  mapEntityToSummary,
  mapMe,
  mapMedia,
  mapMessage,
  mapPresence,
  parsePeerId,
  peerIdOf,
  peerRefOf,
  serviceText,
  type MapContext,
} from './mappers';
import { strippedToDataUrl } from './strippedThumb';
import { mapUpdate } from './updates';

const user = (id: number, extra: Record<string, unknown> = {}) => ({
  className: 'User',
  id: bigInt(id),
  accessHash: bigInt('-123456789012345'),
  firstName: 'Marco',
  lastName: 'Rossi',
  ...extra,
});

const ctxWith = (entities: Record<string, unknown>, meId = '1'): MapContext => ({
  meId,
  entity: (id) => entities[id],
});

describe('peer ids', () => {
  it('matches GramJS marked ids for real TL objects', () => {
    const cases = [
      new Api.PeerUser({ userId: bigInt(777) }),
      new Api.PeerChat({ chatId: bigInt(4242) }),
      new Api.PeerChannel({ channelId: bigInt(1234567890) }),
    ];
    for (const peer of cases) expect(peerIdOf(peer)).toBe(utils.getPeerId(peer));
    expect(peerIdOf(new Api.Channel({ id: bigInt(55), title: 'x', photo: new Api.ChatPhotoEmpty(), date: 0 }))).toBe(
      '-10055',
    );
  });

  it('round-trips through parsePeerId', () => {
    expect(parsePeerId('777')).toEqual({ type: 'user', rawId: '777' });
    expect(parsePeerId('-4242')).toEqual({ type: 'chat', rawId: '4242' });
    expect(parsePeerId('-1001234567890')).toEqual({ type: 'channel', rawId: '1234567890' });
  });

  it('builds peer refs and skips min entities', () => {
    expect(peerRefOf(user(5))).toEqual({ id: '5', type: 'user', rawId: '5', accessHash: '-123456789012345' });
    expect(peerRefOf(user(5, { min: true }))).toBeUndefined();
    expect(peerRefOf({ className: 'Chat', id: bigInt(9), title: 'G' })).toEqual({ id: '-9', type: 'chat', rawId: '9' });
  });
});

describe('entities', () => {
  it('maps kinds', () => {
    expect(chatKindOf(user(2))).toBe('user');
    expect(chatKindOf(user(2, { bot: true }))).toBe('bot');
    expect(chatKindOf(user(1), '1')).toBe('self');
    expect(chatKindOf({ className: 'Channel', megagroup: true })).toBe('group');
    expect(chatKindOf({ className: 'Channel', broadcast: true })).toBe('channel');
    expect(chatKindOf({ className: 'Chat' })).toBe('group');
  });

  it('maps presence', () => {
    expect(mapPresence({ className: 'UserStatusOnline', expires: 1 })).toEqual({ state: 'online' });
    expect(mapPresence({ className: 'UserStatusOffline', wasOnline: 1700000000 })).toEqual({
      state: 'offline',
      lastSeen: 1700000000000,
    });
    expect(mapPresence({ className: 'UserStatusRecently' })).toEqual({ state: 'recently' });
    expect(mapPresence(undefined)).toEqual({ state: 'unknown' });
  });

  it('maps me', () => {
    expect(mapMe(user(1, { username: 'marco', phone: '39333' }))).toEqual({
      id: '1',
      firstName: 'Marco',
      lastName: 'Rossi',
      username: 'marco',
      phone: '39333',
    });
  });
});

describe('mapMessage', () => {
  it('maps an incoming private text message', () => {
    const msg = mapMessage(
      { className: 'Message', id: 10, peerId: { className: 'PeerUser', userId: bigInt(2) }, date: 1700000000, message: 'Ciao' },
      ctxWith({ '2': user(2) }),
    );
    expect(msg).toEqual({
      id: 10,
      chatId: '2',
      senderId: '2',
      senderName: 'Marco Rossi',
      out: false,
      date: 1700000000000,
      text: 'Ciao',
    });
  });

  it('maps an outgoing group message with reply', () => {
    const msg = mapMessage(
      {
        className: 'Message',
        id: 11,
        out: true,
        peerId: { className: 'PeerChannel', channelId: bigInt(99) },
        fromId: { className: 'PeerUser', userId: bigInt(1) },
        date: 1,
        message: 'ok',
        replyTo: { className: 'MessageReplyHeader', replyToMsgId: 7 },
        editDate: 2,
      },
      ctxWith({}),
    );
    expect(msg).toMatchObject({ chatId: '-10099', senderId: '1', out: true, replyToId: 7, status: 'sent', editDate: 2000 });
    expect(msg).not.toHaveProperty('senderName');
  });

  it('maps service messages to Italian text', () => {
    const ctx = ctxWith({ '2': user(2), '3': user(3, { firstName: 'Luca', lastName: undefined }) });
    const msg = mapMessage(
      {
        className: 'MessageService',
        id: 5,
        peerId: { className: 'PeerChat', chatId: bigInt(8) },
        fromId: { className: 'PeerUser', userId: bigInt(2) },
        date: 1,
        action: { className: 'MessageActionChatAddUser', users: [bigInt(3)] },
      },
      ctx,
    );
    expect(msg).toMatchObject({ service: true, chatId: '-8', text: 'Marco Rossi ha aggiunto Luca' });
    expect(serviceText({ className: 'MessageActionPinMessage' }, '1', true, ctx)).toBe('Hai fissato un messaggio');
    expect(serviceText({ className: 'MessageActionChatDeleteUser', userId: bigInt(2) }, '2', false, ctx)).toBe(
      'Marco Rossi ha lasciato il gruppo',
    );
    expect(
      serviceText({ className: 'MessageActionPhoneCall', reason: { className: 'PhoneCallDiscardReasonMissed' } }, '2', false, ctx),
    ).toBe('Chiamata persa');
  });

  it('ignores empty messages', () => {
    expect(mapMessage({ className: 'MessageEmpty', id: 1 })).toBeNull();
  });
});

describe('mapMedia', () => {
  const stripped = Buffer.from([1, 40, 30, 0xaa, 0xbb, 0xcc]);

  it('maps photos with stripped thumbnail', () => {
    const media = mapMedia({
      className: 'MessageMediaPhoto',
      photo: {
        className: 'Photo',
        sizes: [
          { className: 'PhotoStrippedSize', type: 'i', bytes: stripped },
          { className: 'PhotoSize', type: 'm', w: 320, h: 240, size: 1 },
          { className: 'PhotoSizeProgressive', type: 'y', w: 1280, h: 960, sizes: [1, 2] },
        ],
      },
    });
    expect(media).toMatchObject({ kind: 'photo', width: 1280, height: 960 });
    expect(media?.thumbDataUrl?.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('builds the same JPEG as GramJS', () => {
    const ours = strippedToDataUrl(stripped)!;
    const theirs = utils.strippedPhotoToJpg(stripped).toString('base64');
    expect(ours).toBe(`data:image/jpeg;base64,${theirs}`);
  });

  it('maps document flavours', () => {
    const doc = (attributes: unknown[], mimeType = 'application/octet-stream') => ({
      className: 'MessageMediaDocument',
      document: { className: 'Document', mimeType, size: bigInt(2048), attributes },
    });
    expect(mapMedia(doc([{ className: 'DocumentAttributeAudio', voice: true, duration: 4 }], 'audio/ogg'))).toMatchObject({
      kind: 'voice',
      duration: 4,
      size: 2048,
    });
    expect(
      mapMedia(doc([{ className: 'DocumentAttributeVideo', duration: 3.6, w: 640, h: 360 }, { className: 'DocumentAttributeAnimated' }])),
    ).toMatchObject({ kind: 'gif', width: 640, duration: 4 });
    expect(mapMedia(doc([{ className: 'DocumentAttributeSticker', alt: '😀' }], 'image/webp'))).toMatchObject({
      kind: 'sticker',
      description: '😀',
    });
    expect(mapMedia(doc([{ className: 'DocumentAttributeFilename', fileName: 'compiti.pdf' }], 'application/pdf'))).toMatchObject({
      kind: 'document',
      fileName: 'compiti.pdf',
      mimeType: 'application/pdf',
    });
  });

  it('maps location, contact, poll and webpage', () => {
    expect(mapMedia({ className: 'MessageMediaGeo', geo: { lat: 45.4, long: 9.2 } })).toMatchObject({
      kind: 'location',
      latitude: 45.4,
      longitude: 9.2,
    });
    expect(mapMedia({ className: 'MessageMediaContact', firstName: 'Anna', lastName: '', phoneNumber: '39' })).toMatchObject({
      kind: 'contact',
      title: 'Anna',
    });
    expect(mapMedia({ className: 'MessageMediaPoll', poll: { question: { text: 'Pizza?' } } })).toMatchObject({
      kind: 'poll',
      title: 'Pizza?',
    });
    expect(
      mapMedia({ className: 'MessageMediaWebPage', webpage: { className: 'WebPage', url: 'https://x.it', title: 'X' } }),
    ).toMatchObject({ kind: 'webpage', url: 'https://x.it', title: 'X' });
    expect(mapMedia({ className: 'MessageMediaEmpty' })).toBeUndefined();
  });
});

describe('mapDialog', () => {
  it('maps a GramJS Dialog', () => {
    const entity = user(2, { photo: { className: 'UserProfilePhoto' }, status: { className: 'UserStatusRecently' } });
    const summary = mapDialog(
      {
        entity,
        pinned: true,
        unreadCount: 3,
        dialog: { readOutboxMaxId: 20, notifySettings: { muteUntil: 2147483647 } },
        message: { className: 'Message', id: 20, out: true, peerId: { className: 'PeerUser', userId: bigInt(2) }, date: 5, message: 'ciao' },
      },
      ctxWith({ '2': entity }),
    );
    expect(summary).toMatchObject({
      id: '2',
      kind: 'user',
      title: 'Marco Rossi',
      unreadCount: 3,
      pinned: true,
      muted: true,
      hasPhoto: true,
      readOutboxMaxId: 20,
      presence: { state: 'recently' },
      lastMessage: { id: 20, status: 'read' },
    });
  });

  it('names the self chat', () => {
    expect(mapEntityToSummary(user(1, { self: true }), { meId: '1' })).toMatchObject({ kind: 'self', title: 'Messaggi salvati' });
  });
});

describe('mapUpdate', () => {
  const ctx = ctxWith({ '2': user(2) }, '1');

  it('handles short messages in both directions', () => {
    const [incoming] = mapUpdate({ className: 'UpdateShortMessage', id: 3, userId: bigInt(2), message: 'hey', date: 1 }, ctx);
    expect(incoming).toEqual({
      type: 'message:new',
      message: { id: 3, chatId: '2', senderId: '2', senderName: 'Marco Rossi', out: false, date: 1000, text: 'hey' },
    });
    const [outgoing] = mapUpdate({ className: 'UpdateShortMessage', id: 4, out: true, userId: bigInt(2), message: 'yo', date: 1 }, ctx);
    expect(outgoing).toMatchObject({ message: { chatId: '2', senderId: '1', out: true, status: 'sent' } });
    const [group] = mapUpdate(
      { className: 'UpdateShortChatMessage', id: 5, chatId: bigInt(8), fromId: bigInt(2), message: 'g', date: 1 },
      ctx,
    );
    expect(group).toMatchObject({ message: { chatId: '-8', senderId: '2' } });
  });

  it('maps reads, deletions, presence and typing', () => {
    expect(mapUpdate({ className: 'UpdateReadHistoryOutbox', peer: { className: 'PeerUser', userId: bigInt(2) }, maxId: 9 }, ctx)).toEqual([
      { type: 'chat:read', chatId: '2', maxId: 9, outbox: true },
    ]);
    expect(mapUpdate({ className: 'UpdateReadChannelInbox', channelId: bigInt(7), maxId: 3, stillUnreadCount: 1 }, ctx)).toEqual([
      { type: 'chat:read', chatId: '-1007', maxId: 3, outbox: false, unreadCount: 1 },
    ]);
    expect(mapUpdate({ className: 'UpdateDeleteChannelMessages', channelId: bigInt(7), messages: [1, 2] }, ctx)).toEqual([
      { type: 'message:deleted', chatId: '-1007', ids: [1, 2] },
    ]);
    expect(mapUpdate({ className: 'UpdateDeleteMessages', messages: [4] }, ctx)).toEqual([{ type: 'message:deleted', ids: [4] }]);
    expect(mapUpdate({ className: 'UpdateUserStatus', userId: bigInt(2), status: { className: 'UserStatusOnline' } }, ctx)).toEqual([
      { type: 'presence', userId: '2', presence: { state: 'online' } },
    ]);
    expect(
      mapUpdate({ className: 'UpdateChatUserTyping', chatId: bigInt(8), fromId: { className: 'PeerUser', userId: bigInt(2) }, action: { className: 'SendMessageTypingAction' } }, ctx),
    ).toEqual([{ type: 'typing', chatId: '-8', userId: '2' }]);
    expect(mapUpdate({ className: 'UpdateUserTyping', userId: bigInt(2), action: { className: 'SendMessageCancelAction' } }, ctx)).toEqual([]);
  });
});
