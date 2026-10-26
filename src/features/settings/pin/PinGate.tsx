import { useEffect, useState, type ReactNode } from 'react';
import { LockOutlined } from '@ant-design/icons';
import { Sheet } from '@/components/ui';
import { verifyPin } from '@/lib/pin';
import { useSettings } from '@/stores/settings';
import { PinPad } from './PinPad';
import { MAX_ATTEMPTS, usePinSession } from './pinSession';

/** Seconds left while input is blocked after too many wrong PINs (0 = free). */
function useCooldown(): number {
  const blockedUntil = usePinSession((s) => s.blockedUntil);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (blockedUntil <= Date.now()) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= blockedUntil) window.clearInterval(id);
    }, 500);
    return () => window.clearInterval(id);
  }, [blockedUntil]);
  return Math.max(0, Math.ceil((blockedUntil - now) / 1000));
}

/** PinPad that checks the stored parent PIN; shared by the gate and the confirmation sheet. */
export function VerifyPinPad({ title, description, onSuccess }: { title: string; description?: string; onSuccess: () => void }) {
  const fail = usePinSession((s) => s.fail);
  const failures = usePinSession((s) => s.failures);
  const wait = useCooldown();
  const [error, setError] = useState<string | null>(null);

  const left = MAX_ATTEMPTS - failures;
  return (
    <PinPad
      title={title}
      description={description}
      disabled={wait > 0}
      error={
        wait > 0
          ? `Troppi tentativi. Riprova tra ${wait} secondi.`
          : error && left < MAX_ATTEMPTS
            ? `${error} Ancora ${left} ${left === 1 ? 'tentativo' : 'tentativi'}.`
            : error
      }
      onComplete={async (pin) => {
        if (await verifyPin(pin)) {
          setError(null);
          onSuccess();
          return true;
        }
        fail();
        setError('PIN sbagliato.');
        return false;
      }}
    />
  );
}

/**
 * Shows `children` only when no parent PIN is set or the session is unlocked;
 * otherwise a lock screen with the numeric keypad.
 */
export function PinGate({ children, title = 'Impostazioni protette' }: { children: ReactNode; title?: string }) {
  const hasPin = useSettings((s) => s.settingsPinHash !== null);
  const unlockedUntil = usePinSession((s) => s.unlockedUntil);
  const unlock = usePinSession((s) => s.unlock);
  const touch = usePinSession((s) => s.touch);
  const unlocked = unlockedUntil > Date.now();

  useEffect(() => {
    if (unlocked) touch();
  }, [unlocked, touch]);

  if (!hasPin || unlocked) return <>{children}</>;
  return (
    <div className="st-lock">
      <span className="st-lock__icon" aria-hidden="true">
        <LockOutlined />
      </span>
      <VerifyPinPad
        title={title}
        description="Scrivi il PIN del genitore per continuare."
        onSuccess={unlock}
      />
      <details className="st-lock__help">
        <summary>Ho dimenticato il PIN</summary>
        <p>
          Il PIN è salvato solo su questo telefono. Per toglierlo bisogna cancellare i dati di PictoChat dalle
          impostazioni del browser: le impostazioni torneranno quelle iniziali.
        </p>
      </details>
    </div>
  );
}

/** Bottom sheet asking the parent PIN before a sensitive action (e.g. logout). */
export function PinSheet({
  open,
  onClose,
  onSuccess,
  title = 'Conferma con il PIN',
  description,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} aria-label={title}>
      {open && (
        <VerifyPinPad
          title={title}
          description={description}
          onSuccess={() => {
            onClose();
            onSuccess();
          }}
        />
      )}
    </Sheet>
  );
}

