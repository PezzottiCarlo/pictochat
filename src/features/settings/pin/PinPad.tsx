import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { cx } from '@/components/ui';
import { feedback } from '@/lib/feedback';
import { PIN_LENGTH } from './pinSession';
import '../settings.css';

export interface PinPadProps {
  title: string;
  description?: string;
  /** Called with the full PIN; return false to reject it (shake + clear). */
  onComplete: (pin: string) => boolean | void | Promise<boolean | void>;
  /** Shown under the dots (e.g. "PIN sbagliato"). */
  error?: string | null;
  /** Temporarily blocks input (too many attempts). */
  disabled?: boolean;
  className?: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      <path d="M21 5H9l-6 7 6 7h12z" />
      <path d="M17 9l-5 6M12 9l5 6" />
    </svg>
  );
}

/** Large numeric keypad for the parent PIN. Also works with a physical keyboard. */
export function PinPad({ title, description, onComplete, error, disabled, className }: PinPadProps) {
  const [digits, setDigits] = useState('');
  const digitsRef = useRef('');
  const [busy, setBusy] = useState(false);
  const controls = useAnimationControls();
  const titleId = useId();
  const statusId = useId();
  const complete = useRef(onComplete);
  complete.current = onComplete;

  const submit = useCallback(
    async (pin: string) => {
      setBusy(true);
      const ok = await complete.current(pin);
      setBusy(false);
      if (ok === false) {
        feedback('error');
        void controls.start({ x: [0, -14, 12, -8, 6, 0], transition: { duration: 0.4 } });
      }
      digitsRef.current = '';
      setDigits('');
    },
    [controls],
  );

  const press = useCallback(
    (key: string) => {
      if (disabled || busy) return;
      const current = digitsRef.current;
      const next = key === 'del' ? current.slice(0, -1) : current.length < PIN_LENGTH ? current + key : current;
      digitsRef.current = next;
      setDigits(next);
      if (key !== 'del' && next.length === PIN_LENGTH && current.length < PIN_LENGTH) void submit(next);
    },
    [busy, disabled, submit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  return (
    <div className={cx('st-pin', className)} role="group" aria-labelledby={titleId} aria-describedby={statusId}>
      <h2 id={titleId} className="st-pin__title">
        {title}
      </h2>
      {description && <p className="st-pin__desc">{description}</p>}
      <motion.div className="st-pin__dots" animate={controls} aria-hidden="true">
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <span key={i} className={cx('st-pin__dot', i < digits.length && 'is-filled')} />
        ))}
      </motion.div>
      <p id={statusId} className={cx('st-pin__status', error && 'is-error')} aria-live="assertive">
        {error ?? `${digits.length} cifre su ${PIN_LENGTH}`}
      </p>
      <div className="st-pin__keys">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={k}
              type="button"
              className={cx('st-pin__key', k === 'del' && 'st-pin__key--del')}
              aria-label={k === 'del' ? 'Cancella una cifra' : k}
              disabled={disabled || busy || (k === 'del' && !digits)}
              onClick={() => press(k)}
            >
              {k === 'del' ? <DeleteIcon /> : k}
            </button>
          ),
        )}
      </div>
      {busy && (
        <span className="pc-visually-hidden" role="status">
          Controllo il PIN…
        </span>
      )}
    </div>
  );
}
