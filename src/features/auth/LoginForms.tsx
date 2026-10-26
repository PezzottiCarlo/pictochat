import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Button, Input } from 'antd';
import { EditOutlined, KeyOutlined, MessageOutlined, PhoneOutlined, ReloadOutlined } from '@ant-design/icons';
import { CodeInput } from './CodeInput';
import { COUNTRIES, OTHER_PREFIX, composePhone, isPlausiblePhone, prettyPhone } from './countries';
import { formatSeconds } from './useCountdown';

export const CODE_LENGTH = 5;
export const RESEND_SECONDS = 60;

/** Shared bits every form receives from the flow. */
interface FormBase {
  busy: boolean;
  /** Seconds left of a FLOOD_WAIT (0 = free to submit). */
  floodLeft: number;
  error?: string;
}

export function ErrorNote({ children, id }: { children?: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <p className="au-error" role="alert" id={id}>
      {children}
    </p>
  );
}

function SubmitButton({ busy, floodLeft, icon, children }: Pick<FormBase, 'busy' | 'floodLeft'> & { icon: ReactNode; children: ReactNode }) {
  return (
    <Button
      type="primary"
      size="large"
      block
      htmlType="submit"
      loading={busy}
      disabled={floodLeft > 0}
      icon={icon}
      className="au-submit"
    >
      {floodLeft > 0 ? `Riprova tra ${formatSeconds(floodLeft)}` : children}
    </Button>
  );
}

// ---------------------------------------------------------------------------

export function PhoneForm({
  initial,
  onSubmit,
  busy,
  floodLeft,
  error,
}: FormBase & { initial?: { prefix: string; number: string }; onSubmit: (phone: string, raw: { prefix: string; number: string }) => void }) {
  const ids = useId();
  const [country, setCountry] = useState(() =>
    initial && !COUNTRIES.some((c) => c.code === initial.prefix) ? OTHER_PREFIX : (initial?.prefix ?? '39'),
  );
  const [customPrefix, setCustomPrefix] = useState(initial?.prefix ?? '');
  const [number, setNumber] = useState(initial?.number ?? '');
  const [localError, setLocalError] = useState<string>();
  const prefix = country === OTHER_PREFIX ? customPrefix : country;
  const typedOwnPrefix = /^\s*(\+|00)/.test(number);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const full = composePhone(prefix, number);
    if (!prefix && !typedOwnPrefix) return setLocalError('Scrivi il prefisso del tuo paese, per esempio 39.');
    if (!isPlausiblePhone(full)) return setLocalError('Controlla il numero: sembra troppo corto o troppo lungo.');
    setLocalError(undefined);
    onSubmit(full, { prefix, number });
  };

  const shownError = localError ?? error;

  return (
    <form className="au-form" onSubmit={submit} noValidate>
      <div className="au-field">
        <label htmlFor={`${ids}-country`} className="au-label">
          Paese
        </label>
        <select
          id={`${ids}-country`}
          className="au-select"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          disabled={typedOwnPrefix}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {`${c.flag} +${c.code} ${c.name}`}
            </option>
          ))}
          <option value={OTHER_PREFIX}>Un altro paese…</option>
        </select>
      </div>

      {country === OTHER_PREFIX && !typedOwnPrefix && (
        <div className="au-field">
          <label htmlFor={`${ids}-prefix`} className="au-label">
            Prefisso
          </label>
          <Input
            id={`${ids}-prefix`}
            size="large"
            prefix="+"
            inputMode="tel"
            autoComplete="tel-country-code"
            placeholder="39"
            value={customPrefix}
            onChange={(e) => setCustomPrefix(e.target.value.replace(/\D/g, '').slice(0, 4))}
          />
        </div>
      )}

      <div className="au-field">
        <label htmlFor={`${ids}-number`} className="au-label">
          Numero di telefono
        </label>
        <Input
          id={`${ids}-number`}
          size="large"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="333 123 4567"
          autoFocus
          prefix={typedOwnPrefix ? undefined : <span className="au-prefix">+{prefix || '…'}</span>}
          value={number}
          status={shownError ? 'error' : undefined}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={`${ids}-help ${ids}-err`}
          onChange={(e) => setNumber(e.target.value.replace(/[^\d+\s-]/g, ''))}
        />
        <p className="au-help" id={`${ids}-help`}>
          Usa il numero del tuo account Telegram.
        </p>
      </div>

      <ErrorNote id={`${ids}-err`}>{shownError}</ErrorNote>
      <SubmitButton busy={busy} floodLeft={floodLeft} icon={<MessageOutlined />}>
        Ricevi il codice
      </SubmitButton>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function CodeForm({
  phone,
  viaApp,
  onSubmit,
  onResend,
  onChangeNumber,
  resendLeft,
  busy,
  floodLeft,
  error,
  attempt,
}: FormBase & {
  phone: string;
  viaApp: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
  resendLeft: number;
  /** Bumps after every failed attempt: clears the boxes and refocuses them. */
  attempt: number;
}) {
  const ids = useId();
  const [code, setCode] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const lastSent = useRef('');

  useEffect(() => {
    if (attempt === 0) return;
    setCode('');
    lastSent.current = '';
    input.current?.focus();
  }, [attempt]);

  // Auto-submit as soon as the last digit is typed or pasted.
  useEffect(() => {
    if (code.length === CODE_LENGTH && !busy && floodLeft === 0 && lastSent.current !== code) {
      lastSent.current = code;
      onSubmit(code);
    }
  }, [code, busy, floodLeft, onSubmit]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length < CODE_LENGTH) return;
    lastSent.current = code;
    onSubmit(code);
  };

  return (
    <form className="au-form" onSubmit={submit} noValidate>
      <div className="au-sent">
        <p className="au-sent__where" id={`${ids}-where`}>
          {viaApp ? (
            <>
              Ti abbiamo mandato un codice <strong>nell’app Telegram</strong>, non per SMS. Apri Telegram su questo
              telefono o su un altro dispositivo: lo trovi nella chat che si chiama “Telegram”.
            </>
          ) : (
            <>Ti abbiamo mandato un SMS con il codice.</>
          )}
        </p>
        <p className="au-sent__phone">
          <PhoneOutlined aria-hidden="true" /> <span className="pc-keep-case">{prettyPhone(phone)}</span>
          <Button type="link" icon={<EditOutlined />} onClick={onChangeNumber} className="au-link">
            Cambia numero
          </Button>
        </p>
      </div>

      <div className="au-field">
        <span className="au-label" id={`${ids}-label`}>
          Codice
        </span>
        <CodeInput
          ref={input}
          value={code}
          onChange={setCode}
          length={CODE_LENGTH}
          disabled={busy}
          invalid={Boolean(error)}
          label={`Codice di ${CODE_LENGTH} cifre`}
          describedBy={`${ids}-where ${ids}-err`}
        />
        <p className="au-help">Non dare mai questo codice a nessuno.</p>
      </div>

      <ErrorNote id={`${ids}-err`}>{error}</ErrorNote>
      <SubmitButton busy={busy} floodLeft={floodLeft} icon={<KeyOutlined />}>
        Conferma
      </SubmitButton>
      <Button
        size="large"
        block
        type="text"
        icon={<ReloadOutlined />}
        disabled={resendLeft > 0 || busy || floodLeft > 0}
        onClick={onResend}
        className="au-resend"
      >
        {resendLeft > 0 ? `Nuovo codice tra ${formatSeconds(resendLeft)}` : 'Invia di nuovo il codice'}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function PasswordForm({
  hint,
  onSubmit,
  busy,
  floodLeft,
  error,
}: FormBase & { hint?: string; onSubmit: (password: string) => void }) {
  const ids = useId();
  const [password, setPassword] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (password) onSubmit(password);
  };

  return (
    <form className="au-form" onSubmit={submit} noValidate>
      <p className="au-intro">
        Il tuo account ha la <strong>verifica in due passaggi</strong>. Scrivi la password che hai scelto su Telegram (non
        il codice).
      </p>
      <div className="au-field">
        <label htmlFor={`${ids}-pw`} className="au-label">
          Password di Telegram
        </label>
        <Input.Password
          id={`${ids}-pw`}
          size="large"
          autoComplete="current-password"
          autoFocus
          value={password}
          status={error ? 'error' : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${ids}-hint ${ids}-err`}
          onChange={(e) => setPassword(e.target.value)}
        />
        {hint && (
          <p className="au-help" id={`${ids}-hint`}>
            Suggerimento: <span className="pc-keep-case">{hint}</span>
          </p>
        )}
      </div>
      <ErrorNote id={`${ids}-err`}>{error}</ErrorNote>
      <SubmitButton busy={busy} floodLeft={floodLeft} icon={<KeyOutlined />}>
        Entra
      </SubmitButton>
      <p className="au-help">
        Non la ricordi? Nell’app Telegram vai in Impostazioni, Privacy e sicurezza, Verifica in due passaggi.
      </p>
    </form>
  );
}
