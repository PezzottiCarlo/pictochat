import { useEffect, useId, useRef, useState } from 'react';
import { App, Button, Input } from 'antd';
import { ArrowLeftOutlined, CameraOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons';
import type { Pictogram } from '@/core/types';
import { PictoTile, Sheet } from '@/components/ui';
import { DEFAULT_CATEGORY, usePersonalPictograms } from '@/services/aac';
import { feedback } from '@/lib/feedback';
import { ImageError, fetchImage, prepareImage } from '../lib/image';
import { findByWord } from '../lib/model';
import { CategoryChips, SearchField, TileGrid } from './bits';
import { useArasaacSearch } from './useArasaacSearch';

export interface PictogramDraft {
  /** Set when editing an existing personal pictogram. */
  id?: string;
  word: string;
  category: string;
  image?: Blob;
  /** Image to download when the sheet opens (e.g. an ARASAAC pictogram from the library). */
  imageUrl?: string;
}

function useObjectUrl(blob: Blob | null): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) return setUrl(undefined);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

function ArasaacPicker({ initialQuery, onPick, onBack }: { initialQuery: string; onPick: (p: Pictogram) => void; onBack: () => void }) {
  const [query, setQuery] = useState(initialQuery);
  const { results, loading } = useArasaacSearch(query);
  return (
    <div className="pg-stack">
      <Button icon={<ArrowLeftOutlined />} size="large" onClick={onBack} className="pg-back">
        Torna alla scheda
      </Button>
      <SearchField value={query} onChange={setQuery} placeholder="Cerca un pittogramma" loading={loading} />
      {!query.trim() ? (
        <p className="pg-hint">Scrivi una parola, per esempio «nonna» o «pizza».</p>
      ) : results.length === 0 && !loading ? (
        <p className="pg-hint">Nessun pittogramma per «{query.trim()}». Prova con un’altra parola.</p>
      ) : (
        <TileGrid items={results} onPress={onPick} label="Pittogrammi trovati: tocca per sceglierlo" />
      )}
    </div>
  );
}

/** Add or edit a personal pictogram: photo (camera/gallery) or ARASAAC image, word, category. */
export function PictogramEditorSheet({ draft, onClose }: { draft: PictogramDraft | null; onClose: () => void }) {
  const { items, add, update } = usePersonalPictograms();
  const { message } = App.useApp();
  const [word, setWord] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [image, setImage] = useState<Blob | null>(null);
  const [view, setView] = useState<'form' | 'search'>('form');
  const [busy, setBusy] = useState<'image' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const wordId = useId();
  const preview = useObjectUrl(image);
  const editing = !!draft?.id;

  // Load the draft whenever the sheet opens.
  useEffect(() => {
    if (!draft) return;
    setWord(draft.word);
    setCategory(draft.category || DEFAULT_CATEGORY);
    setImage(draft.image ?? null);
    setView('form');
    setError(null);
    if (!draft.image && draft.imageUrl) {
      let alive = true;
      setBusy('image');
      fetchImage(draft.imageUrl)
        .then((b) => alive && setImage(b))
        .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Non riesco a scaricare il pittogramma.'))
        .finally(() => alive && setBusy(null));
      return () => {
        alive = false;
      };
    }
  }, [draft]);

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy('image');
    setError(null);
    try {
      setImage(await prepareImage(file));
    } catch (e) {
      setError(e instanceof ImageError ? e.message : 'Non riesco ad aprire questa immagine.');
    } finally {
      setBusy(null);
    }
  };

  const pickArasaac = async (p: Pictogram) => {
    setView('form');
    setBusy('image');
    setError(null);
    try {
      setImage(await fetchImage(p.url));
      if (!word.trim()) setWord(p.word);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Non riesco a scaricare il pittogramma.');
    } finally {
      setBusy(null);
    }
  };

  const trimmed = word.trim();
  const duplicate = trimmed ? findByWord(items, trimmed, draft?.id) : undefined;
  const blockedByDuplicate = editing && !!duplicate;
  const canSave = !!trimmed && !!image && !busy && !blockedByDuplicate;

  const save = async () => {
    if (!canSave || !image || !draft) return;
    setBusy('save');
    try {
      if (draft.id) await update(draft.id, { word: trimmed, category, image });
      else await add({ word: trimmed, category, image });
      feedback('success');
      void message.success(editing ? 'Pittogramma aggiornato' : `«${trimmed}» aggiunto ai tuoi pittogrammi`);
      onClose();
    } catch {
      setError('Non sono riuscito a salvare. Riprova.');
    } finally {
      setBusy(null);
    }
  };

  const tile: Pictogram | null = preview
    ? { id: 'preview', word: trimmed || '…', url: preview, source: 'personal', category }
    : null;

  return (
    <Sheet
      open={!!draft}
      onClose={onClose}
      title={view === 'search' ? 'Scegli un pittogramma' : editing ? 'Modifica il pittogramma' : 'Nuovo pittogramma'}
      height="full"
      dismissible={busy !== 'save'}
      footer={
        view === 'form' && (
          <Button type="primary" size="large" block disabled={!canSave} loading={busy === 'save'} onClick={() => void save()}>
            {editing ? 'Salva le modifiche' : 'Aggiungi'}
          </Button>
        )
      }
    >
      {view === 'search' ? (
        <ArasaacPicker initialQuery={trimmed} onPick={(p) => void pickArasaac(p)} onBack={() => setView('form')} />
      ) : (
        <div className="pg-form">
          <div className="pg-image">
            <div className="pg-image__preview" aria-live="polite">
              {tile ? (
                <PictoTile pictogram={tile} size="lg" labelPosition="hidden" />
              ) : (
                <span className="pg-image__empty">{busy === 'image' ? 'Preparo l’immagine…' : 'Nessuna immagine'}</span>
              )}
            </div>
            <div className="pg-image__actions">
              <Button size="large" icon={<CameraOutlined />} onClick={() => cameraRef.current?.click()} disabled={busy === 'image'}>
                Scatta una foto
              </Button>
              <Button size="large" icon={<PictureOutlined />} onClick={() => galleryRef.current?.click()} disabled={busy === 'image'}>
                Scegli una foto
              </Button>
              <Button size="large" icon={<SearchOutlined />} onClick={() => setView('search')} disabled={busy === 'image'}>
                Usa un pittogramma
              </Button>
            </div>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                void loadFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                void loadFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </div>

          {error && (
            <p className="pg-error" role="alert">
              {error}
            </p>
          )}

          <label htmlFor={wordId} className="pg-label">
            Che parola è?
          </label>
          <Input
            id={wordId}
            size="large"
            value={word}
            maxLength={40}
            placeholder="Per esempio: nonna Lucia"
            onChange={(e) => setWord(e.target.value)}
            onPressEnter={() => void save()}
            status={blockedByDuplicate ? 'error' : undefined}
          />
          {duplicate && (
            <p className={blockedByDuplicate ? 'pg-error' : 'pg-hint'}>
              {blockedByDuplicate
                ? `Hai già un pittogramma «${duplicate.word}». Scegli un’altra parola.`
                : `Hai già un pittogramma «${duplicate.word}»: verrà sostituito da questo.`}
            </p>
          )}

          <span className="pg-label" aria-hidden="true">
            In quale gruppo?
          </span>
          <CategoryChips label="Gruppo del pittogramma" value={category} onChange={setCategory} />
        </div>
      )}
    </Sheet>
  );
}
