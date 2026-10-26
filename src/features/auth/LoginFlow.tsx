import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { App } from 'antd';
import type { Me } from '@/core/types';
import { messaging, TelegramAuthError } from '@/services/telegram';
import { feedback } from '@/lib/feedback';
import { CodeForm, PasswordForm, PhoneForm, RESEND_SECONDS } from './LoginForms';
import { useCountdown } from './useCountdown';
import './auth.css';

type Stage =
  | { kind: 'phone' }
  | { kind: 'code'; phone: string; hash: string; viaApp: boolean }
  | { kind: 'password'; hint?: string };

const STAGE_TITLES: Record<Stage['kind'], string> = {
  phone: 'Il tuo numero',
  code: 'Il codice',
  password: 'La password',
};

export interface LoginFlowProps {
  onSuccess: (me: Me) => void;
  /** Heading level of the stage titles (2 on the login page, 3 inside onboarding). */
  headingLevel?: 2 | 3;
}

/**
 * Telegram sign-in: phone → code (→ two-step password). Shared by /accedi and the
 * onboarding. Errors come from TelegramAuthError with Italian, user-safe messages.
 */
export function LoginFlow({ onSuccess, headingLevel = 2 }: LoginFlowProps) {
  const { message } = App.useApp();
  const [stage, setStage] = useState<Stage>({ kind: 'phone' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const typed = useRef<{ prefix: string; number: string }>(undefined);
  const { left: floodLeft, start: startFlood } = useCountdown();
  const resend = useCountdown();

  const fail = useCallback(
    (err: unknown) => {
      const e = err instanceof TelegramAuthError ? err : undefined;
      if (e?.code === 'FLOOD_WAIT' && e.seconds) startFlood(e.seconds);
      setError(e?.message ?? 'Si è verificato un errore. Riprova.');
      feedback('error');
    },
    [startFlood],
  );

  const run = useCallback(
    async (task: () => Promise<void>) => {
      setBusy(true);
      setError(undefined);
      try {
        await task();
      } catch (err) {
        fail(err);
      } finally {
        setBusy(false);
      }
    },
    [fail],
  );

  const done = useCallback(
    (me: Me) => {
      feedback('success');
      onSuccess(me);
    },
    [onSuccess],
  );

  const sendCode = (phone: string) =>
    run(async () => {
      const { phoneCodeHash, viaApp } = await messaging.sendCode(phone);
      setStage({ kind: 'code', phone, hash: phoneCodeHash, viaApp });
      resend.start(RESEND_SECONDS);
    });

  const submitCode = useCallback(
    (code: string) => {
      if (stage.kind !== 'code') return;
      void run(async () => {
        try {
          const result = await messaging.signIn({ phone: stage.phone, code, phoneCodeHash: stage.hash });
          if (result.status === 'ok') done(result.me);
          else if (result.status === 'password_needed') setStage({ kind: 'password', hint: result.hint });
          else {
            setError('Questo numero non ha ancora un account Telegram. Crealo con l’app Telegram, poi torna qui.');
            setAttempt((a) => a + 1);
          }
        } catch (err) {
          setAttempt((a) => a + 1);
          throw err;
        }
      });
    },
    [stage, run, done],
  );

  const resendCode = () => {
    if (stage.kind !== 'code') return;
    void run(async () => {
      const { phoneCodeHash, viaApp } = await messaging.sendCode(stage.phone);
      setStage({ ...stage, hash: phoneCodeHash, viaApp });
      setAttempt((a) => a + 1);
      resend.start(RESEND_SECONDS);
      void message.success('Ti abbiamo mandato un nuovo codice.');
    });
  };

  const submitPassword = (password: string) =>
    void run(async () => {
      done(await messaging.checkPassword(password));
    });

  const back = () => {
    setError(undefined);
    resend.reset();
    setStage({ kind: 'phone' });
  };

  const Heading = `h${headingLevel}` as 'h2';

  return (
    <div className="au-flow">
      <p className="pc-visually-hidden" aria-live="polite">
        {STAGE_TITLES[stage.kind]}
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stage.kind}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.2 }}
        >
          <Heading className="au-title">{STAGE_TITLES[stage.kind]}</Heading>
          {stage.kind === 'phone' && (
            <PhoneForm
              initial={typed.current}
              busy={busy}
              floodLeft={floodLeft}
              error={error}
              onSubmit={(phone, raw) => {
                typed.current = raw;
                void sendCode(phone);
              }}
            />
          )}
          {stage.kind === 'code' && (
            <CodeForm
              phone={stage.phone}
              viaApp={stage.viaApp}
              busy={busy}
              floodLeft={floodLeft}
              error={error}
              attempt={attempt}
              resendLeft={resend.left}
              onSubmit={submitCode}
              onResend={resendCode}
              onChangeNumber={back}
            />
          )}
          {stage.kind === 'password' && (
            <PasswordForm hint={stage.hint} busy={busy} floodLeft={floodLeft} error={error} onSubmit={submitPassword} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
