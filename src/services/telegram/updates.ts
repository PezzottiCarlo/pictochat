/** Raw GramJS update → MessagingEvent (pure, className based). */
import type { ChatMessage, MessagingEvent, PeerId } from '@/core/types';
import { displayName, mapMessage, mapPresence, peerIdOf, toNumber, type MapContext, type TL } from './mappers';

function shortMessage(update: TL, chatId: PeerId, senderId: PeerId | undefined, ctx: MapContext): ChatMessage {
  const out = !!update.out;
  const message: ChatMessage = {
    id: update.id,
    chatId,
    out,
    date: (toNumber(update.date) ?? 0) * 1000,
    text: update.message ?? '',
  };
  if (senderId) message.senderId = senderId;
  if (!out && senderId) {
    const name = displayName(ctx.entity?.(senderId));
    if (name) message.senderName = name;
  }
  if (update.replyTo?.replyToMsgId) message.replyToId = update.replyTo.replyToMsgId;
  if (out) message.status = 'sent';
  return message;
}

export function mapUpdate(update: TL, ctx: MapContext): MessagingEvent[] {
  switch (update?.className) {
    case 'UpdateNewMessage':
    case 'UpdateNewChannelMessage': {
      const message = mapMessage(update.message, ctx);
      return message ? [{ type: 'message:new', message }] : [];
    }
    case 'UpdateShortMessage': {
      const userId = String(update.userId);
      return [
        { type: 'message:new', message: shortMessage(update, userId, update.out ? ctx.meId : userId, ctx) },
      ];
    }
    case 'UpdateShortChatMessage': {
      const fromId = String(update.fromId);
      return [
        {
          type: 'message:new',
          message: shortMessage(update, `-${String(update.chatId)}`, update.out ? ctx.meId : fromId, ctx),
        },
      ];
    }
    case 'UpdateEditMessage':
    case 'UpdateEditChannelMessage': {
      const message = mapMessage(update.message, ctx);
      return message ? [{ type: 'message:edited', message }] : [];
    }
    case 'UpdateDeleteMessages':
      // Ids of private chats and basic groups are unique per account: no chat id is sent.
      return [{ type: 'message:deleted', ids: [...(update.messages ?? [])] }];
    case 'UpdateDeleteChannelMessages':
      return [
        { type: 'message:deleted', chatId: `-100${String(update.channelId)}`, ids: [...(update.messages ?? [])] },
      ];
    case 'UpdateUserStatus':
      return [{ type: 'presence', userId: String(update.userId), presence: mapPresence(update.status) }];
    case 'UpdateReadHistoryOutbox': {
      const chatId = peerIdOf(update.peer);
      return chatId ? [{ type: 'chat:read', chatId, maxId: update.maxId, outbox: true }] : [];
    }
    case 'UpdateReadHistoryInbox': {
      const chatId = peerIdOf(update.peer);
      return chatId
        ? [{ type: 'chat:read', chatId, maxId: update.maxId, outbox: false, unreadCount: update.stillUnreadCount }]
        : [];
    }
    case 'UpdateReadChannelOutbox':
      return [{ type: 'chat:read', chatId: `-100${String(update.channelId)}`, maxId: update.maxId, outbox: true }];
    case 'UpdateReadChannelInbox':
      return [
        {
          type: 'chat:read',
          chatId: `-100${String(update.channelId)}`,
          maxId: update.maxId,
          outbox: false,
          unreadCount: update.stillUnreadCount,
        },
      ];
    case 'UpdateUserTyping':
      if (update.action?.className === 'SendMessageCancelAction') return [];
      return [{ type: 'typing', chatId: String(update.userId), userId: String(update.userId) }];
    case 'UpdateChatUserTyping':
    case 'UpdateChannelUserTyping': {
      if (update.action?.className === 'SendMessageCancelAction') return [];
      const userId = peerIdOf(update.fromId);
      const chatId =
        update.className === 'UpdateChatUserTyping'
          ? `-${String(update.chatId)}`
          : `-100${String(update.channelId)}`;
      return userId ? [{ type: 'typing', chatId, userId }] : [];
    }
    default:
      return [];
  }
}
