import { useMemo, useState } from 'react';
import { Button, Input } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MessageOutlined,
  SearchOutlined,
  SoundOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import type { ChatSummary } from '@/core/types';
import { IconButton, Sheet } from '@/components/ui';
import { speak } from '@/services/aac';
import { filterChats, messagePreview } from '../chatListModel';
import { MAX_FAVOURITES, useFavourites } from '../favourites';
import { ChatAvatar } from './bits';

/** Long-press menu of a chat. */
export function ChatActionsSheet({
  chat,
  onClose,
  onOpen,
}: {
  chat: ChatSummary | null;
  onClose: () => void;
  onOpen: (chat: ChatSummary) => void;
}) {
  const favourite = useFavourites((s) => (chat ? s.ids.includes(chat.id) : false));
  const toggle = useFavourites((s) => s.toggle);
  const full = useFavourites((s) => s.ids.length >= MAX_FAVOURITES);
  const preview = chat ? messagePreview(chat.lastMessage, chat.kind) : null;

  return (
    <Sheet open={!!chat} onClose={onClose} title={chat?.title}>
      {chat && (
        <div className="cl-actions">
          <Button type="primary" size="large" block icon={<MessageOutlined />} onClick={() => {
              onClose();
              onOpen(chat);
            }}>
            Apri la chat
          </Button>
          <Button
            size="large"
            block
            icon={favourite ? <StarFilled /> : <StarOutlined />}
            disabled={!favourite && full}
            onClick={() => {
              toggle(chat.id);
              onClose();
            }}
          >
            {favourite ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
          </Button>
          {!favourite && full && (
            <p className="cl-note">Hai già {MAX_FAVOURITES} preferiti: togline uno per aggiungere questa chat.</p>
          )}
          {chat.lastMessage && preview && (
            <Button
              size="large"
              block
              icon={<SoundOutlined />}
              onClick={() => void speak(preview.author ? `${preview.author === 'Tu' ? 'Tu hai scritto' : preview.author}: ${preview.text}` : preview.text)}
            >
              Ascolta l’ultimo messaggio
            </Button>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** Choose and order the favourite chats (discoverable alternative to long press). */
export function FavouritesEditorSheet({
  open,
  onClose,
  chats,
}: {
  open: boolean;
  onClose: () => void;
  chats: ChatSummary[];
}) {
  const ids = useFavourites((s) => s.ids);
  const toggle = useFavourites((s) => s.toggle);
  const move = useFavourites((s) => s.move);
  const [query, setQuery] = useState('');
  const byId = useMemo(() => new Map(chats.map((c) => [c.id, c])), [chats]);
  const favourites = ids.flatMap((id) => (byId.get(id) ? [byId.get(id)!] : []));
  const others = filterChats(
    chats.filter((c) => !ids.includes(c.id)),
    query,
  );
  const full = ids.length >= MAX_FAVOURITES;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Chat preferite"
      height="full"
      footer={
        <Button type="primary" size="large" block onClick={onClose}>
          Fatto
        </Button>
      }
    >
      <p className="cl-note">Le chat preferite appaiono grandi in cima alla lista. Puoi sceglierne fino a {MAX_FAVOURITES}.</p>

      {favourites.length > 0 && (
        <>
          <h3 className="cl-sheet-title">In cima ({favourites.length})</h3>
          <ul className="cl-pick-list">
            {favourites.map((c, i) => (
              <li key={c.id} className="cl-pick cl-pick--fav">
                <ChatAvatar chat={c} size="sm" showPresence={false} />
                <span className="cl-pick__name">{c.title}</span>
                <span className="cl-pick__actions">
                  <IconButton
                    icon={<ArrowUpOutlined />}
                    aria-label={`Sposta ${c.title} prima`}
                    disabled={i === 0}
                    onClick={() => move(c.id, -1)}
                  />
                  <IconButton
                    icon={<ArrowDownOutlined />}
                    aria-label={`Sposta ${c.title} dopo`}
                    disabled={i === favourites.length - 1}
                    onClick={() => move(c.id, 1)}
                  />
                  <IconButton
                    icon={<StarFilled />}
                    variant="tinted"
                    aria-label={`Togli ${c.title} dai preferiti`}
                    onClick={() => toggle(c.id)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="cl-sheet-title">Tutte le chat</h3>
      {chats.length > 8 && (
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined aria-hidden="true" />}
          placeholder="Cerca una chat"
          aria-label="Cerca una chat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="cl-sheet-search"
        />
      )}
      <ul className="cl-pick-list">
        {others.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="cl-pick cl-pick--button"
              disabled={full}
              aria-label={`Aggiungi ${c.title} ai preferiti`}
              onClick={() => toggle(c.id)}
            >
              <ChatAvatar chat={c} size="sm" showPresence={false} />
              <span className="cl-pick__name">{c.title}</span>
              <StarOutlined className="cl-pick__icon" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

/** Pick one chat (e.g. where to send a pictogram). */
export function ChatPickerSheet({
  open,
  onClose,
  chats,
  onPick,
  title = 'Scegli una chat',
  description,
  busyId,
}: {
  open: boolean;
  onClose: () => void;
  chats: ChatSummary[];
  onPick: (chat: ChatSummary) => void;
  title?: string;
  description?: string;
  /** Chat currently being sent to (shows a spinner, disables the list). */
  busyId?: string | null;
}) {
  const [query, setQuery] = useState('');
  const shown = filterChats(chats, query);
  return (
    <Sheet open={open} onClose={onClose} title={title} height="full">
      {description && <p className="cl-note">{description}</p>}
      {chats.length > 6 && (
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined aria-hidden="true" />}
          placeholder="Cerca una chat"
          aria-label="Cerca una chat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="cl-sheet-search"
        />
      )}
      {chats.length === 0 ? (
        <p className="cl-note">Non ci sono chat da mostrare. Controlla la connessione e riprova.</p>
      ) : shown.length === 0 ? (
        <p className="cl-note">Nessuna chat si chiama «{query}».</p>
      ) : (
        <ul className="cl-pick-list">
          {shown.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="cl-pick cl-pick--button"
                disabled={!!busyId}
                aria-busy={busyId === c.id || undefined}
                onClick={() => onPick(c)}
              >
                <ChatAvatar chat={c} size="sm" showPresence={false} />
                <span className="cl-pick__name">{c.title}</span>
                {busyId === c.id && <span className="cl-pick__busy">Invio…</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
