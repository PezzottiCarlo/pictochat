import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  AppstoreOutlined,
  DeleteOutlined,
  DownOutlined,
  SendOutlined,
  SoundOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { Pictogram } from '@/core/types';
import { speak, usePersonalPictograms } from '@/services/aac';
import { useSettings } from '@/stores/settings';
import { feedback } from '@/lib/feedback';
import { IconButton } from '@/components/ui';
import { buildSentence } from '../lib/sentence';
import { nextStep, smallerSize, type GuideStep } from '../lib/guide';
import { pushRecents, readRecents, toRecentRef, writeRecents } from '../lib/recents';
import { resolveRecents } from '../lib/pictos';
import { objectCategoryFor } from '../hooks/usePalette';
import { PictoPicker, type PickerView } from './PictoPicker';
import { SentenceRail } from './SentenceRail';

export interface PictoComposerProps {
  /** Button switching to the keyboard. */
  modeSwitch: ReactNode;
  simple: boolean;
  /** Sends (or asks to confirm); `onSent` runs once the message really leaves. */
  onSend: (text: string, pictograms: Pictogram[], onSent: () => void) => void;
  onLongPress: (pictogram: Pictogram) => void;
  /** Reports whether a sentence is being built (the suggestion bar hides meanwhile). */
  onDraft: (hasDraft: boolean) => void;
}

const HISTORY_MAX = 20;
const OPEN_KEY = 'pictochat:chat:picker-open';

/** Whether the pictogram grid is shown (per-device convenience). */
function readPickerOpen(): boolean {
  try {
    return localStorage.getItem(OPEN_KEY) !== 'false';
  } catch {
    return true;
  }
}
function writePickerOpen(open: boolean): void {
  try {
    localStorage.setItem(OPEN_KEY, String(open));
  } catch {
    // storage blocked: the choice lasts for this screen only
  }
}
const lastVerb = (parts: readonly Pictogram[]) => parts.findLast((p) => p.category === 'verbi')?.word;

/** Build a message by tapping pictograms: sentence strip, guided steps, categories, search. */
export function PictoComposer({ modeSwitch, simple, onSend, onLongPress, onDraft }: PictoComposerProps) {
  const { speakOnTap, pictogramSize, appearance } = useSettings(
    useShallow((s) => ({
      speakOnTap: s.speakOnTap,
      pictogramSize: s.pictogramSize,
      appearance: s.appearance,
    })),
  );
  const { items: personal } = usePersonalPictograms();
  const [parts, setParts] = useState<Pictogram[]>([]);
  const [history, setHistory] = useState<Pictogram[][]>([]);
  const [view, setView] = useState<PickerView>({ kind: 'step', step: 'chi' });
  const [objectCategory, setObjectCategory] = useState('cibo');
  const [query, setQuery] = useState('');
  const [open, setOpenState] = useState(readPickerOpen);
  const [recentRefs, setRecentRefs] = useState(readRecents);

  const recents = useMemo(() => resolveRecents(recentRefs, personal, appearance), [recentRefs, personal, appearance]);
  const sentence = useMemo(() => buildSentence(parts.map((p) => ({ word: p.word, category: p.category }))), [parts]);
  const verb = lastVerb(parts);
  const hasDraft = parts.length > 0;
  useEffect(() => onDraft(hasDraft), [hasDraft, onDraft]);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    writePickerOpen(next);
  };

  const change = (next: Pictogram[]) => {
    setHistory((h) => [...h.slice(1 - HISTORY_MAX), parts]);
    setParts(next);
  };

  const goStep = (step: GuideStep, withVerb = verb) => {
    setOpen(true);
    setView({ kind: 'step', step });
    if (step === 'cosa' && withVerb) {
      void objectCategoryFor(withVerb).then((c) => c && setObjectCategory(c));
    }
  };

  const pick = (p: Pictogram) => {
    feedback('tap');
    if (speakOnTap) void speak(p.word);
    const next = [...parts, p];
    change(next);
    if (view.kind === 'step') {
      const step = nextStep(next.map((n) => n.category));
      if (step !== view.step) goStep(step, lastVerb(next));
    }
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory(history.slice(0, -1));
    setParts(prev);
  };

  const send = () => {
    if (!sentence) return;
    const used = parts;
    onSend(sentence, used, () => {
      const next = pushRecents(recentRefs, used.map(toRecentRef));
      writeRecents(next);
      setRecentRefs(next);
      setParts([]);
      setHistory([]);
      setView({ kind: 'step', step: 'chi' });
    });
  };

  const activeStep = view.kind === 'step' ? view.step : undefined;

  return (
    <div className="ch-pc">
      <div className="ch-pc__top">
        <SentenceRail
          parts={parts}
          size={smallerSize(pictogramSize)}
          activeStep={open ? activeStep : undefined}
          onRemove={(i) => change(parts.filter((_, j) => j !== i))}
          onStep={(step) => goStep(step)}
        />
        <IconButton
          className="ch-pc__send"
          icon={<SendOutlined />}
          variant="filled"
          size="lg"
          aria-label="Invia"
          disabled={!sentence}
          onClick={send}
        />
      </div>
      {/* Always mounted so screen readers hear every change of the sentence. */}
      <p className={sentence ? 'ch-preview' : 'pc-visually-hidden'} aria-live="polite">
        {sentence}
      </p>
      <div className="ch-actions">
        {modeSwitch}
        <IconButton
          icon={<SoundOutlined />}
          aria-label="Ascolta la frase"
          disabled={!sentence}
          onClick={() => void speak(sentence)}
        />
        {history.length > 0 && <IconButton icon={<UndoOutlined />} aria-label="Annulla" onClick={undo} />}
        {parts.length > 0 && (
          <IconButton icon={<DeleteOutlined />} aria-label="Cancella la frase" onClick={() => change([])} />
        )}
        <IconButton
          className="ch-actions__toggle"
          icon={open ? <DownOutlined /> : <AppstoreOutlined />}
          aria-label={open ? 'Nascondi i pittogrammi' : 'Mostra i pittogrammi'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        />
      </div>
      {open && (
        <PictoPicker
          view={view}
          objectCategory={objectCategory}
          verb={verb}
          query={query}
          recents={recents}
          size={pictogramSize}
          showSearch={!simple}
          onView={(v) => (v.kind === 'step' ? goStep(v.step) : setView(v))}
          onObjectCategory={setObjectCategory}
          onQuery={setQuery}
          onPick={pick}
          onLongPress={onLongPress}
        />
      )}
    </div>
  );
}
