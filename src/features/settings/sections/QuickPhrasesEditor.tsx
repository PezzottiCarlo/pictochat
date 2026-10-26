import { useEffect, useId, useState } from 'react';
import { Button, Input } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, EditOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons';
import type { QuickPhrase } from '@/core/types';
import { IconButton, Sheet, cx } from '@/components/ui';
import { DEFAULT_QUICK_PHRASES, useSettings } from '@/stores/settings';

export const MAX_PHRASES = 12;
const MAX_LENGTH = 80;

const EMOJIS = [
  '💬', '👋', '👍', '👎', '🙏', '❤️', '💕', '😊', '😢', '😡', '😴', '🤔',
  '📍', '🏠', '🏫', '🏃', '🚗', '🚌', '⏰', '📞', '🍝', '🍕', '💧', '🚽',
  '🆘', '🤒', '💊', '🎮', '⚽', '🎵', '📺', '🛒', '🐶', '✅', '❌', '❓',
];

const newId = () => `qp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Pure list operations (exported for tests). */
export const phraseOps = {
  move(list: QuickPhrase[], id: string, delta: -1 | 1): QuickPhrase[] {
    const from = list.findIndex((p) => p.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= list.length) return list;
    const next = [...list];
    [next[from], next[to]] = [next[to], next[from]];
    return next;
  },
  upsert(list: QuickPhrase[], phrase: QuickPhrase): QuickPhrase[] {
    return list.some((p) => p.id === phrase.id) ? list.map((p) => (p.id === phrase.id ? phrase : p)) : [...list, phrase];
  },
  insertAt(list: QuickPhrase[], phrase: QuickPhrase, index: number): QuickPhrase[] {
    const next = [...list];
    next.splice(Math.min(index, next.length), 0, phrase);
    return next;
  },
};

function PhraseSheet({
  phrase,
  onClose,
  onSave,
}: {
  phrase: QuickPhrase | null;
  onClose: () => void;
  onSave: (p: QuickPhrase) => void;
}) {
  const [text, setText] = useState('');
  const [icon, setIcon] = useState('💬');
  const inputId = useId();

  useEffect(() => {
    if (phrase) {
      setText(phrase.text);
      setIcon(phrase.icon || '💬');
    }
  }, [phrase]);

  const trimmed = text.trim();
  const save = () => trimmed && phrase && onSave({ ...phrase, text: trimmed, icon });

  return (
    <Sheet
      open={!!phrase}
      onClose={onClose}
      title={phrase?.text ? 'Modifica la frase' : 'Nuova frase veloce'}
      footer={
        <Button type="primary" size="large" block disabled={!trimmed} onClick={save}>
          Salva la frase
        </Button>
      }
    >
      <div className="st-form">
        <label htmlFor={inputId} className="st-row__label">
          Cosa vuoi scrivere?
        </label>
        <Input
          id={inputId}
          size="large"
          value={text}
          maxLength={MAX_LENGTH}
          showCount
          placeholder="Per esempio: Vieni a prendermi"
          onChange={(e) => setText(e.target.value)}
          onPressEnter={save}
        />
        <span className="st-row__label" id={`${inputId}-emoji`}>
          Scegli un simbolo
        </span>
        <div className="st-emojis" role="group" aria-labelledby={`${inputId}-emoji`}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              className={cx('st-emoji', e === icon && 'is-on')}
              aria-pressed={e === icon}
              onClick={() => setIcon(e)}
            >
              {e}
            </button>
          ))}
        </div>
        {trimmed && (
          <div className="st-phrase-preview" aria-label="Anteprima">
            <span aria-hidden="true">{icon}</span> {trimmed}
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** Add, edit, reorder and delete the quick phrases shown in the chat composer. */
export function QuickPhrasesEditor() {
  const phrases = useSettings((s) => s.quickPhrases);
  const set = useSettings((s) => s.set);
  const [editing, setEditing] = useState<QuickPhrase | null>(null);
  const [removed, setRemoved] = useState<{ phrase: QuickPhrase; index: number } | null>(null);
  const full = phrases.length >= MAX_PHRASES;

  const remove = (p: QuickPhrase, index: number) => {
    set('quickPhrases', phrases.filter((x) => x.id !== p.id));
    setRemoved({ phrase: p, index });
  };

  return (
    <div className="st-phrases">
      <div role="status" aria-live="polite">
        {removed && (
          <div className="st-undo">
            <span>Hai tolto «{removed.phrase.text}».</span>
            <Button
              icon={<UndoOutlined />}
              onClick={() => {
                set('quickPhrases', phraseOps.insertAt(phrases, removed.phrase, removed.index));
                setRemoved(null);
              }}
            >
              Annulla
            </Button>
          </div>
        )}
      </div>

      {phrases.length === 0 ? (
        <p className="st-note">Non ci sono frasi veloci. Aggiungine una qui sotto.</p>
      ) : (
        <ol className="st-phrase-list">
          {phrases.map((p, i) => (
            <li key={p.id} className="st-phrase">
              <button type="button" className="st-phrase__main" aria-label={`Modifica «${p.text}»`} onClick={() => setEditing(p)}>
                <span className="st-phrase__icon" aria-hidden="true">
                  {p.icon}
                </span>
                <span className="st-phrase__text">{p.text}</span>
                <EditOutlined className="st-phrase__edit" aria-hidden="true" />
              </button>
              <span className="st-phrase__actions">
                <IconButton
                  icon={<ArrowUpOutlined />}
                  aria-label={`Sposta «${p.text}» prima`}
                  disabled={i === 0}
                  onClick={() => set('quickPhrases', phraseOps.move(phrases, p.id, -1))}
                />
                <IconButton
                  icon={<ArrowDownOutlined />}
                  aria-label={`Sposta «${p.text}» dopo`}
                  disabled={i === phrases.length - 1}
                  onClick={() => set('quickPhrases', phraseOps.move(phrases, p.id, 1))}
                />
                <IconButton
                  icon={<DeleteOutlined />}
                  variant="danger"
                  aria-label={`Togli «${p.text}»`}
                  onClick={() => remove(p, i)}
                />
              </span>
            </li>
          ))}
        </ol>
      )}

      <div className="st-actions">
        <Button
          size="large"
          block
          icon={<PlusOutlined />}
          disabled={full}
          onClick={() => setEditing({ id: newId(), text: '', icon: '💬' })}
        >
          Aggiungi una frase
        </Button>
        {full && <p className="st-note">Puoi avere al massimo {MAX_PHRASES} frasi veloci.</p>}
        <Button
          type="text"
          block
          onClick={() => {
            set('quickPhrases', DEFAULT_QUICK_PHRASES);
            setRemoved(null);
          }}
        >
          Rimetti le frasi iniziali
        </Button>
      </div>

      <PhraseSheet
        phrase={editing}
        onClose={() => setEditing(null)}
        onSave={(p) => {
          set('quickPhrases', phraseOps.upsert(phrases, p));
          setEditing(null);
        }}
      />
    </div>
  );
}
