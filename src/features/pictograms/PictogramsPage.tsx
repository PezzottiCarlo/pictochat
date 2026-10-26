import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { App, Button } from 'antd';
import { PlusOutlined, UndoOutlined } from '@ant-design/icons';
import type { ChatSummary, PersonalPictogram, Pictogram } from '@/core/types';
import { EmptyState, IconButton, NavHeader, PageScaffold, Segmented } from '@/components/ui';
import { MainTabBar } from '@/app/MainTabBar';
import { CATEGORIES, DEFAULT_CATEGORY, formatPictogramShare, usePersonalPictograms, usePersonalStore } from '@/services/aac';
import { feedback } from '@/lib/feedback';
import { useSettings } from '@/stores/settings';
import { orderChats, simpleModeChats } from '@/features/chats/chatListModel';
import { ChatPickerSheet } from '@/features/chats/components/sheets';
import { useChatSources } from '@/features/chats/sources';
import { fileNameFor } from './lib/image';
import { filterPictograms, groupByCategory } from './lib/model';
import { SearchField } from './components/bits';
import { LibraryView } from './components/LibraryView';
import { PersonalSections, PictogramActionsSheet } from './components/PersonalSections';
import { PictogramEditorSheet, type PictogramDraft } from './components/PictogramEditorSheet';

type Tab = 'miei' | 'libreria';
const UNDO_MS = 8000;

/** Chats a pictogram can be sent to (no channels; simple mode limits to allowed people). */
function useSendTargets(): ChatSummary[] {
  const { useChatList } = useChatSources();
  const { chats } = useChatList();
  const simpleMode = useSettings((s) => s.simpleMode);
  const allowed = useSettings((s) => s.allowedChatIds);
  return useMemo(() => {
    const ordered = orderChats(chats).filter((c) => c.kind !== 'channel');
    return simpleMode ? simpleModeChats(ordered, allowed) : ordered;
  }, [chats, simpleMode, allowed]);
}

function UndoBar({ item, onUndo, onDone }: { item: PersonalPictogram | null; onUndo: () => void; onDone: () => void }) {
  useEffect(() => {
    if (!item) return;
    const id = window.setTimeout(onDone, UNDO_MS);
    return () => window.clearTimeout(id);
  }, [item, onDone]);
  return (
    <div role="status" aria-live="polite" className="pg-undo-slot">
      {item && (
        <div className="pg-undo">
          <span>Hai eliminato «{item.word}».</span>
          <Button icon={<UndoOutlined />} size="large" onClick={onUndo}>
            Annulla
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PictogramsPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'libreria' ? 'libreria' : 'miei';
  const { items, remove, add } = usePersonalPictograms();
  const loaded = usePersonalStore((s) => s.loaded);
  const { sendFile } = useChatSources();
  const targets = useSendTargets();
  const { message } = App.useApp();

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PersonalPictogram | null>(null);
  const [draft, setDraft] = useState<PictogramDraft | null>(null);
  const [sending, setSending] = useState<PersonalPictogram | null>(null);
  const [busyChat, setBusyChat] = useState<string | null>(null);
  const [trash, setTrash] = useState<PersonalPictogram | null>(null);

  const groups = useMemo(() => groupByCategory(filterPictograms(items, query), CATEGORIES), [items, query]);
  const clearTrash = useCallback(() => setTrash(null), []);

  const setTab = (t: Tab) => setParams(t === 'libreria' ? { tab: t } : {}, { replace: true });
  const newDraft = (): PictogramDraft => ({ word: '', category: DEFAULT_CATEGORY });

  const del = async (p: PersonalPictogram) => {
    setSelected(null);
    await remove(p.id);
    setTrash(p);
  };

  const undo = async () => {
    if (!trash) return;
    const p = trash;
    setTrash(null);
    await add({ word: p.word, category: p.category, image: p.image, origin: p.origin });
    void message.success(`«${p.word}» è tornato`);
  };

  const send = async (p: PersonalPictogram, chat: ChatSummary) => {
    setBusyChat(chat.id);
    try {
      const file = new File([p.image], fileNameFor(p.word, p.image.type), { type: p.image.type || 'image/jpeg' });
      await sendFile(chat.id, file, { caption: formatPictogramShare(p.category, p.word) });
      feedback('send');
      void message.success(`«${p.word}» inviato a ${chat.title}`);
      setSending(null);
    } catch {
      feedback('error');
      void message.error('Non sono riuscito a inviarlo. Controlla internet e riprova.');
    } finally {
      setBusyChat(null);
    }
  };

  const addFromLibrary = (p: Pictogram) =>
    setDraft({ word: p.word, category: p.category ?? DEFAULT_CATEGORY, imageUrl: p.url });

  const header = (
    <NavHeader
      large
      title="Pittogrammi"
      trailing={<IconButton icon={<PlusOutlined />} variant="tinted" aria-label="Aggiungi un pittogramma" onClick={() => setDraft(newDraft())} />}
    />
  );

  return (
    <PageScaffold header={header} footer={<MainTabBar active="pictograms" />}>
      <div className="pg-stack">
        <Segmented<Tab>
          aria-label="Quali pittogrammi"
          block
          value={tab}
          onChange={setTab}
          options={[
            { value: 'miei', label: items.length ? `I miei (${items.length})` : 'I miei' },
            { value: 'libreria', label: 'Libreria' },
          ]}
        />

        {tab === 'libreria' ? (
          <LibraryView onAdd={addFromLibrary} />
        ) : !loaded ? (
          <p className="pg-hint" role="status">
            Carico i tuoi pittogrammi…
          </p>
        ) : items.length === 0 ? (
          <EmptyState
            icon="📸"
            title="Crea i tuoi pittogrammi"
            description="Fai una foto alle persone, ai posti e alle cose di tutti i giorni: diventano pittogrammi da usare nelle chat."
            action={
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setDraft(newDraft())}>
                Aggiungi il primo
              </Button>
            }
          />
        ) : (
          <>
            {items.length > 6 && <SearchField value={query} onChange={setQuery} placeholder="Cerca tra i tuoi pittogrammi" />}
            {groups.length === 0 ? (
              <EmptyState
                icon="🔍"
                title={`Nessun pittogramma «${query.trim()}»`}
                action={
                  <Button size="large" icon={<PlusOutlined />} onClick={() => setDraft({ ...newDraft(), word: query.trim() })}>
                    Crealo adesso
                  </Button>
                }
              />
            ) : (
              <PersonalSections groups={groups} onSelect={setSelected} />
            )}
          </>
        )}

        <UndoBar item={trash} onUndo={() => void undo()} onDone={clearTrash} />
      </div>

      <PictogramActionsSheet
        pictogram={selected}
        canSend={targets.length > 0}
        onClose={() => setSelected(null)}
        onEdit={(p) => {
          setSelected(null);
          setDraft({ id: p.id, word: p.word, category: p.category, image: p.image });
        }}
        onSend={(p) => {
          setSelected(null);
          setSending(p);
        }}
        onDelete={(p) => void del(p)}
      />
      <PictogramEditorSheet draft={draft} onClose={() => setDraft(null)} />
      <ChatPickerSheet
        open={!!sending}
        onClose={() => setSending(null)}
        chats={targets}
        title={sending ? `Invia «${sending.word}»` : undefined}
        description="Chi lo riceve con PictoChat potrà salvarlo tra i suoi pittogrammi."
        busyId={busyChat}
        onPick={(chat) => sending && void send(sending, chat)}
      />
    </PageScaffold>
  );
}
