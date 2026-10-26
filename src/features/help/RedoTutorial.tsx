import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Button, Input } from 'antd';
import { RedoOutlined } from '@ant-design/icons';
import { Sheet, Surface } from '@/components/ui';
import { isPinSet, verifyPin } from '@/lib/pin';
import { useSettings } from '@/stores/settings';
import { paths } from '@/app/paths';
import { resetOnboardingProgress } from '@/features/onboarding/flow';

/**
 * Restarts the guided setup (the Telegram login is kept). The guide changes every
 * setting, so when a parent PIN is set it is asked first.
 */
export function RedoTutorial() {
  const navigate = useNavigate();
  const patch = useSettings((s) => s.patch);
  const [asking, setAsking] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string>();

  const restart = () => {
    resetOnboardingProgress();
    patch({ onboardingDone: false });
    navigate(paths.onboarding);
  };

  const onPress = () => (isPinSet() ? setAsking(true) : restart());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (await verifyPin(pin)) restart();
    else {
      setError('Il PIN non è giusto. Riprova.');
      setPin('');
    }
  };

  return (
    <Surface padding={5} radius="xl" variant="glass" className="hp-redo">
      <h2 className="hp-h2">Rifai la guida</h2>
      <p>Rivedi tutti i passi dall’inizio e cambia quello che vuoi. Il tuo account Telegram resta collegato.</p>
      <Button type="primary" size="large" icon={<RedoOutlined />} onClick={onPress} className="hp-btn">
        Rifai il tutorial
      </Button>

      <Sheet
        open={asking}
        onClose={() => setAsking(false)}
        title="Serve il PIN"
        footer={
          <Button type="primary" size="large" block htmlType="submit" form="hp-pin-form" className="hp-btn">
            Continua
          </Button>
        }
      >
        <form id="hp-pin-form" className="hp-pin" onSubmit={(e) => void submit(e)}>
          <label className="hp-pin__label" htmlFor="hp-pin-input">
            Le impostazioni sono protette. Scrivi il PIN dei genitori.
          </label>
          <Input.Password
            id="hp-pin-input"
            size="large"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            status={error ? 'error' : undefined}
            aria-invalid={error ? true : undefined}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError(undefined);
            }}
          />
          {error && (
            <p className="hp-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </Sheet>
    </Surface>
  );
}
