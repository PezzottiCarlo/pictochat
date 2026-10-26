/** Route `/chat/:chatId`: wires the Telegram data hooks into the presentational ChatView. */
import { useCallback, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  setActiveChat,
  useAvatar,
  useChat,
  useChats,
  useConnection,
  useMediaUrl,
  useMessages,
  useTyping,
} from '@/services/telegram';
import { paths } from '@/app/paths';
import { useSettings } from '@/stores/settings';
import { ChatView } from './ChatView';

function decodeId(raw: string | undefined): string {
  try {
    return decodeURIComponent(raw ?? '');
  } catch {
    return raw ?? '';
  }
}

function ChatScreen({ chatId }: { chatId: string }) {
  const navigate = useNavigate();
  useChats(); // makes sure the chat list (title, presence, read marks) is loaded on deep links
  const chat = useChat(chatId);
  const thread = useMessages(chatId);
  const typing = useTyping(chatId);
  const connection = useConnection();
  const avatarUrl = useAvatar(chat?.hasPhoto ? chatId : undefined);

  // Marks messages read while this chat is open.
  useEffect(() => {
    setActiveChat(chatId);
    return () => setActiveChat(null);
  }, [chatId]);

  const onBack = useCallback(() => navigate(paths.chats), [navigate]);
  const { loadOlder, sendText, sendFile, retry } = thread;
  const onLoadOlder = useCallback(() => void loadOlder(), [loadOlder]);
  const onSendText = useCallback((text: string) => void sendText(text), [sendText]);
  const onSendFile = useCallback((file: File, caption?: string) => void sendFile(file, caption), [sendFile]);
  const onRetry = useCallback((id: number) => void retry(id), [retry]);

  return (
    <ChatView
      chatId={chatId}
      title={chat?.title ?? 'Chat'}
      avatarUrl={avatarUrl}
      presence={chat?.presence}
      typing={typing.length > 0}
      isGroup={chat?.kind === 'group' || chat?.kind === 'channel'}
      connection={connection}
      messages={thread.messages}
      loading={thread.loading}
      loadingOlder={thread.loadingOlder}
      hasOlder={thread.hasOlder}
      unreadCount={chat?.unreadCount ?? 0}
      readOutboxMaxId={chat?.readOutboxMaxId}
      useMediaUrl={useMediaUrl}
      onBack={onBack}
      onLoadOlder={onLoadOlder}
      onSendText={onSendText}
      onSendFile={onSendFile}
      onRetry={onRetry}
    />
  );
}

export default function ChatPage() {
  const { chatId } = useParams();
  const id = decodeId(chatId);
  const simpleMode = useSettings((s) => s.simpleMode);
  const allowedChatIds = useSettings((s) => s.allowedChatIds);
  // Parental control: in simple mode a deep link can't open a chat the parent didn't allow.
  if (simpleMode && allowedChatIds.length > 0 && !allowedChatIds.includes(id)) {
    return <Navigate to={paths.chats} replace />;
  }
  // Keyed: switching chat resets scroll position, drafts and the unread marker.
  return <ChatScreen key={id} chatId={id} />;
}
