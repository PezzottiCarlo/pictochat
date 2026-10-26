import { memo, useCallback, useState, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AppstoreOutlined, FontSizeOutlined } from '@ant-design/icons';
import type { Pictogram, ReplySuggestion } from '@/core/types';
import { useReplySuggestions } from '@/services/aac';
import { useSettings } from '@/stores/settings';
import { feedback } from '@/lib/feedback';
import { GlassBar, IconButton } from '@/components/ui';
import { ConfirmSendSheet, type PendingSend } from './ConfirmSendSheet';
import { KeyboardComposer } from './KeyboardComposer';
import { PictoComposer } from './PictoComposer';
import { SuggestionBar } from './SuggestionBar';
import './composer.css';

export interface ComposerProps {
  /** Text of the last incoming message (reply suggestions). */
  lastIncoming?: string;
  onSendText: (text: string) => void;
  onSendFile: (file: File, caption?: string) => void;
  onPictogramLongPress: (pictogram: Pictogram) => void;
  /** Floating content above the bar (e.g. the "jump to bottom" pill). */
  overlay?: ReactNode;
}

type Mode = 'pictograms' | 'keyboard';

/** Bottom bar: reply suggestions + pictogram or keyboard composer + confirmation. */
export const Composer = memo(function Composer({
  lastIncoming,
  onSendText,
  onSendFile,
  onPictogramLongPress,
  overlay,
}: ComposerProps) {
  const settings = useSettings(
    useShallow((s) => ({
      composerMode: s.composerMode,
      showSuggestions: s.showSuggestions,
      confirmBeforeSend: s.confirmBeforeSend,
      simpleMode: s.simpleMode,
      quickPhrases: s.quickPhrases,
    })),
  );
  const [mode, setMode] = useState<Mode>(settings.composerMode);
  const [switched, setSwitched] = useState(false);
  const [pending, setPending] = useState<PendingSend | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const onDraft = useCallback((draft: boolean) => setHasDraft(draft), []);
  const suggestions = useReplySuggestions(settings.showSuggestions ? lastIncoming : undefined);

  const commit = (p: PendingSend) => {
    feedback('send');
    onSendText(p.text);
    p.onSent?.();
  };
  const requestSend = (p: PendingSend) => {
    if (!p.text.trim()) return;
    if (settings.confirmBeforeSend) setPending(p);
    else commit(p);
  };

  const toggleMode = () => {
    setSwitched(true);
    setHasDraft(false);
    setMode((m) => (m === 'pictograms' ? 'keyboard' : 'pictograms'));
  };
  const modeSwitch =
    mode === 'pictograms' ? (
      <IconButton
        icon={<FontSizeOutlined />}
        aria-label="Scrivi con la tastiera"
        variant="tinted"
        onClick={toggleMode}
      />
    ) : (
      <IconButton icon={<AppstoreOutlined />} aria-label="Usa i pittogrammi" variant="tinted" onClick={toggleMode} />
    );

  return (
    <GlassBar position="bottom" className="ch-composer" aria-label="Scrivi un messaggio">
      {overlay && <div className="ch-composer__overlay">{overlay}</div>}
      <div className="ch-composer__body">
        <SuggestionBar
          suggestions={hasDraft ? [] : suggestions}
          onPick={(s: ReplySuggestion) =>
            requestSend({
              text: s.text,
              pictograms: s.pictograms.length ? s.pictograms : undefined,
            })
          }
        />
        {mode === 'pictograms' ? (
          <PictoComposer
            modeSwitch={modeSwitch}
            simple={settings.simpleMode}
            onSend={(text, pictograms, onSent) => requestSend({ text, pictograms, onSent })}
            onLongPress={onPictogramLongPress}
            onDraft={onDraft}
          />
        ) : (
          <KeyboardComposer
            modeSwitch={modeSwitch}
            simple={settings.simpleMode}
            quickPhrases={settings.quickPhrases}
            autoFocus={switched}
            onDraft={onDraft}
            onSend={(text, onSent) => requestSend({ text, onSent })}
            onSendFile={(file, caption) => {
              feedback('send');
              onSendFile(file, caption);
            }}
          />
        )}
      </div>
      <ConfirmSendSheet
        pending={pending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) commit(pending);
          setPending(null);
        }}
      />
    </GlassBar>
  );
});
