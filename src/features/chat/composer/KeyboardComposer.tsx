import {
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { PaperClipOutlined, SendOutlined } from '@ant-design/icons';
import type { PictogramToken, QuickPhrase } from '@/core/types';
import { speak, usePictogramTokens, categoryColorOf } from '@/services/aac';
import { IconButton, PictoStrip } from '@/components/ui';
import { AttachSheet } from './AttachSheet';

export interface KeyboardComposerProps {
  modeSwitch: ReactNode;
  simple: boolean;
  quickPhrases: QuickPhrase[];
  /** Focus the field on mount (the user just switched to the keyboard). */
  autoFocus: boolean;
  onSend: (text: string, onSent: () => void) => void;
  onSendFile: (file: File, caption?: string) => void;
  onDraft: (hasDraft: boolean) => void;
}

const MAX_LINES = 6;
const isImageIcon = (icon: string) => /^(https?:|data:|blob:|\/)/.test(icon);
const colorOf = (t: PictogramToken) => categoryColorOf(t.pictogram?.category);

/** Text input with live pictogram preview, quick phrases and attachments. */
export function KeyboardComposer({
  modeSwitch,
  simple,
  quickPhrases,
  autoFocus,
  onSend,
  onSendFile,
  onDraft,
}: KeyboardComposerProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const preview = usePictogramTokens(useDeferredValue(text));
  const hasPreview = !!preview?.some((t) => t.pictogram);
  const hasDraft = text.trim().length > 0;
  useEffect(() => onDraft(hasDraft), [hasDraft, onDraft]);

  // Grow with the content up to MAX_LINES, then scroll.
  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const line = parseFloat(getComputedStyle(el).lineHeight) || 24;
    el.style.height = `${Math.min(el.scrollHeight, line * MAX_LINES + 16)}px`;
  }, [text]);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text, () => setText(''));
    fieldRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="ch-kb">
      {quickPhrases.length > 0 && !text && (
        <ul className="ch-chips" aria-label="Frasi veloci">
          {quickPhrases.map((q) => (
            <li key={q.id}>
              <button type="button" className="ch-chip" onClick={() => onSend(q.text, () => undefined)}>
                {isImageIcon(q.icon) ? (
                  <img className="ch-chip__img" src={q.icon} alt="" />
                ) : (
                  <span aria-hidden="true">{q.icon}</span>
                )}
                {q.text}
              </button>
            </li>
          ))}
        </ul>
      )}
      {text.trim() && hasPreview && preview && (
        <PictoStrip
          className="ch-kb__preview"
          tokens={preview}
          size="sm"
          colorOf={colorOf}
          aria-label="Anteprima in pittogrammi"
          onTokenPress={(t) => void speak(t.text)}
        />
      )}
      <div className="ch-kb__row">
        <div className="ch-kb__tools">
          {modeSwitch}
          {!simple && (
            <>
              <IconButton
                icon={<PaperClipOutlined />}
                aria-label="Allega foto o file"
                onClick={() => fileRef.current?.click()}
              />
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*,video/*,audio/*,application/pdf,*/*"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
              />
            </>
          )}
        </div>
        <div className="ch-kb__entry">
          <label className="ch-kb__field">
            <span className="pc-visually-hidden">Messaggio</span>
            <textarea
              ref={fieldRef}
              rows={1}
              value={text}
              placeholder="Scrivi qui"
              autoFocus={autoFocus}
              enterKeyHint="send"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </label>
          <IconButton
            icon={<SendOutlined />}
            variant="filled"
            size="lg"
            aria-label="Invia"
            disabled={!text.trim()}
            onClick={submit}
          />
        </div>
      </div>
      <AttachSheet
        file={file}
        onClose={() => setFile(null)}
        onSend={(f, caption) => {
          onSendFile(f, caption);
          setFile(null);
        }}
      />
    </div>
  );
}
