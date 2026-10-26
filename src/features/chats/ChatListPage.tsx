import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Button, Input } from 'antd';
import { ReloadOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import type { ChatSummary } from '@/core/types';
import { Avatar, EmptyState, IconButton, NavHeader, PageScaffold } from '@/components/ui';
import { MainTabBar } from '@/app/MainTabBar';
import { paths } from '@/app/paths';
import { useSettings } from '@/stores/settings';
import { filterChats, orderChats, simpleModeChats, splitFavourites } from './chatListModel';
import { useFavourites } from './favourites';
import { useChatSources } from './sources';
import { usePullToRefresh } from './usePullToRefresh';
import { ChatRow, ChatRowSkeleton } from './components/ChatRow';
import { ConnectionBanner } from './components/ConnectionBanner';
import { FavouriteTiles } from './components/FavouriteTiles';
import { SimpleChatCard } from './components/SimpleChatCard';
import { ChatActionsSheet, FavouritesEditorSheet } from './components/sheets';
import { useNow } from './components/bits';

/** Search is offered once the list is long enough to need it. */
const SEARCH_FROM = 6;

function MeButton() {
  const { useMe, useAvatarUrl } = useChatSources();
  const me = useMe();
  const navigate = useNavigate();
  const url = useAvatarUrl(me?.id);
  if (!me) return null;
  const name = [me.firstName, me.lastName].filter(Boolean).join(' ');
  return (
    <IconButton
      aria-label={`Il tuo profilo: ${name}`}
      icon={<Avatar src={url} name={name} size={40} decorative />}
      onClick={() => navigate(paths.settingsSection('profilo'))}
    />
  );
}

export default function ChatListPage() {
  const navigate = useNavigate();
  const { useChatList, useConnectionState } = useChatSources();
  const { chats, loading, error, refresh } = useChatList();
  const connection = useConnectionState();
  const simpleMode = useSettings((s) => s.simpleMode);
  const allowedChatIds = useSettings((s) => s.allowedChatIds);
  const showPictograms = useSettings((s) => s.showPictograms);
  const favouriteIds = useFavourites((s) => s.ids);
  const prune = useFavourites((s) => s.prune);
  const now = useNow();

  const [query, setQuery] = useState('');
  const [actionsFor, setActionsFor] = useState<ChatSummary | null>(null);
  const [editingFavs, setEditingFavs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const favHeadId = useId();
  const listHeadId = useId();

  const visible = useMemo(
    () => (simpleMode ? simpleModeChats(orderChats(chats), allowedChatIds) : orderChats(chats)),
    [chats, simpleMode, allowedChatIds],
  );
  const filtered = useMemo(() => filterChats(visible, query), [visible, query]);
  const { favourites, others } = useMemo(() => splitFavourites(filtered, favouriteIds), [filtered, favouriteIds]);

  // Forget favourites of chats that were deleted (only once the list is really loaded).
  useEffect(() => {
    if (!loading && chats.length) prune(chats.map((c) => c.id));
  }, [loading, chats, prune]);

  const open = useCallback((chat: ChatSummary) => navigate(paths.chat(chat.id)), [navigate]);
  const { distance, armed } = usePullToRefresh(scrollRef, refresh);

  const searching = query.trim().length > 0;
  const initialLoading = loading && chats.length === 0;

  const header = (
    <NavHeader
      large
      title="Chat"
      trailing={
        <>
          {!simpleMode && (
            <IconButton icon={<StarOutlined />} aria-label="Scegli le chat preferite" onClick={() => setEditingFavs(true)} />
          )}
          <IconButton
            icon={<ReloadOutlined spin={loading && chats.length > 0} />}
            aria-label="Aggiorna le chat"
            onClick={refresh}
            disabled={connection === 'disconnected'}
          />
          <MeButton />
        </>
      }
    />
  );

  let body: ReactNode;
  if (initialLoading) {
    body = (
      <ul className="cl-rows" aria-label="Sto caricando le chat" aria-busy="true">
        {Array.from({ length: 7 }, (_, i) => (
          <ChatRowSkeleton key={i} />
        ))}
      </ul>
    );
  } else if (error && chats.length === 0) {
    body = (
      <EmptyState
        icon="📡"
        title="Non riesco a caricare le chat"
        description={`Controlla la connessione a internet e riprova. (${error})`}
        action={
          <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={refresh}>
            Riprova
          </Button>
        }
      />
    );
  } else if (visible.length === 0) {
    body = simpleMode ? (
      <EmptyState
        icon="👨‍👩‍👧"
        title="Nessuna persona da mostrare"
        description="Chiedi a un genitore di scegliere le chat in Impostazioni › Controllo genitori."
      />
    ) : (
      <EmptyState
        icon="💬"
        title="Non hai ancora chat"
        description="Scrivi a qualcuno da Telegram: la chat comparirà qui."
        action={
          <Button size="large" icon={<ReloadOutlined />} onClick={refresh}>
            Aggiorna
          </Button>
        }
      />
    );
  } else if (filtered.length === 0) {
    body = (
      <EmptyState
        icon="🔍"
        title={`Nessuna chat per «${query.trim()}»`}
        description="Prova con un altro nome."
        action={
          <Button size="large" onClick={() => setQuery('')}>
            Mostra tutte le chat
          </Button>
        }
      />
    );
  } else if (simpleMode) {
    body = (
      <ul className="cl-cards" aria-label="Le tue chat">
        {[...favourites, ...others].map((c) => (
          <SimpleChatCard
            key={c.id}
            chat={c}
            now={now}
            favourite={favouriteIds.includes(c.id)}
            showPictograms={showPictograms}
            onOpen={open}
            onMore={setActionsFor}
          />
        ))}
      </ul>
    );
  } else {
    body = (
      <>
        {favourites.length > 0 && !searching && (
          <section className="cl-stack" aria-labelledby={favHeadId}>
            <div className="cl-section-head">
              <h2 id={favHeadId}>Preferiti</h2>
              <Button type="link" onClick={() => setEditingFavs(true)}>
                Modifica
              </Button>
            </div>
            <FavouriteTiles chats={favourites} onOpen={open} onMore={setActionsFor} labelledBy={favHeadId} />
          </section>
        )}
        <section className="cl-stack" aria-labelledby={listHeadId}>
          {favourites.length > 0 && !searching && (
            <div className="cl-section-head">
              <h2 id={listHeadId}>Tutte le chat</h2>
            </div>
          )}
          {!(favourites.length > 0 && !searching) && (
            <h2 id={listHeadId} className="pc-visually-hidden">
              {searching ? 'Risultati della ricerca' : 'Tutte le chat'}
            </h2>
          )}
          <ul className="cl-rows" aria-labelledby={listHeadId}>
            {(searching ? filtered : others).map((c) => (
              <ChatRow
                key={c.id}
                chat={c}
                now={now}
                favourite={favouriteIds.includes(c.id)}
                showPictograms={showPictograms}
                onOpen={open}
                onMore={setActionsFor}
              />
            ))}
          </ul>
        </section>
      </>
    );
  }

  return (
    <PageScaffold header={header} footer={<MainTabBar active="chats" />} scrollRef={scrollRef}>
      <div className="cl-stack">
        {distance > 0 && (
          <div className={armed ? 'cl-pull is-armed' : 'cl-pull'} style={{ height: distance }} aria-hidden="true">
            {armed ? 'Lascia per aggiornare' : 'Tira giù per aggiornare'}
          </div>
        )}
        <ConnectionBanner connection={connection} />
        {visible.length >= SEARCH_FROM && (
          <Input
            className="cl-search"
            size="large"
            allowClear
            prefix={<SearchOutlined aria-hidden="true" />}
            placeholder="Cerca una chat"
            aria-label="Cerca una chat"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        {body}
      </div>

      <ChatActionsSheet chat={actionsFor} onClose={() => setActionsFor(null)} onOpen={open} />
      <FavouritesEditorSheet open={editingFavs} onClose={() => setEditingFavs(false)} chats={visible} />
    </PageScaffold>
  );
}
