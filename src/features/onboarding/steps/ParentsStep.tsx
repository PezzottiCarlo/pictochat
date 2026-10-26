import { useState, type FormEvent } from 'react';
import { App, Button, Input } from 'antd';
import { LockOutlined, SafetyOutlined, TeamOutlined, UnlockOutlined } from '@ant-design/icons';
import { PictoTile, Surface } from '@/components/ui';
import { formatPictogramShare } from '@/services/aac';
import { setPin } from '@/lib/pin';
import { useSettings } from '@/stores/settings';
import { ToggleRow } from '../components/controls';
import { usePictos } from '../components/picto';
import type { StepContext } from './types';

const PIN_LENGTH = 4;
const SHARE_EXAMPLE = formatPictogramShare('cibo', 'torta della nonna');

function PinSetup() {
  const { message } = App.useApp();
  const pinSet = useSettings((s) => s.settingsPinHash !== null);
  const [pin, setPinValue] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState<string>();

  const onlyDigits = (v: string) => v.replace(/\D/g, '').slice(0, PIN_LENGTH);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.length !== PIN_LENGTH) return setError(`Il PIN ha ${PIN_LENGTH} numeri.`);
    if (pin !== again) return setError('I due PIN non sono uguali. Riprova.');
    await setPin(pin);
    setPinValue('');
    setAgain('');
    setError(undefined);
    void message.success('PIN salvato. Ricordalo bene!');
  };

  if (pinSet) {
    return (
      <div className="ob-pin-done">
        <p>
          <LockOutlined aria-hidden="true" /> Il PIN è attivo: per cambiare le impostazioni serve il PIN.
        </p>
        <Button size="large" icon={<UnlockOutlined />} onClick={() => void setPin(null)}>
          Togli il PIN
        </Button>
      </div>
    );
  }

  return (
    <form className="ob-pin" onSubmit={(e) => void submit(e)} noValidate>
      <label className="ob-pin__field">
        <span>Nuovo PIN ({PIN_LENGTH} numeri)</span>
        <Input.Password
          size="large"
          inputMode="numeric"
          autoComplete="new-password"
          value={pin}
          onChange={(e) => setPinValue(onlyDigits(e.target.value))}
          status={error ? 'error' : undefined}
        />
      </label>
      <label className="ob-pin__field">
        <span>Scrivilo di nuovo</span>
        <Input.Password
          size="large"
          inputMode="numeric"
          autoComplete="new-password"
          value={again}
          onChange={(e) => setAgain(onlyDigits(e.target.value))}
          status={error ? 'error' : undefined}
        />
      </label>
      {error && (
        <p className="ob-error" role="alert">
          {error}
        </p>
      )}
      <Button size="large" type="primary" htmlType="submit" icon={<LockOutlined />}>
        Salva il PIN
      </Button>
    </form>
  );
}

export function ParentsStep({ ctx }: { ctx: StepContext }) {
  const s = useSettings();
  const pictos = usePictos(['fotocamera']);

  return (
    <>
      {ctx.role === 'teen' && (
        <Surface variant="inset" padding={4} radius="lg" className="ob-callout">
          <TeamOutlined aria-hidden="true" />
          <p>Questa parte è per mamma, papà o chi ti aiuta. Puoi chiamarli adesso, oppure toccare Avanti.</p>
        </Surface>
      )}

      <ToggleRow
        icon={<SafetyOutlined />}
        label="Modalità semplice"
        help="Nasconde le cose difficili: gruppi, canali e alcune impostazioni. Restano solo le chat."
        checked={s.simpleMode}
        onChange={(v) => s.set('simpleMode', v)}
      />

      <section className="ob-section" aria-labelledby="ob-pin-title">
        <h2 id="ob-pin-title" className="ob-subtitle">
          Proteggi le impostazioni con un PIN
        </h2>
        <p className="ob-field__help">
          Così le impostazioni non si cambiano per sbaglio. Scegli 4 numeri che ricordi tu, ma che tuo figlio non indovina.
        </p>
        <PinSetup />
      </section>

      <section className="ob-section" aria-labelledby="ob-chats-title">
        <h2 id="ob-chats-title" className="ob-subtitle">
          Solo le chat giuste
        </h2>
        <p className="ob-field__help">
          Dopo il collegamento, in Impostazioni puoi scegliere quali chat si vedono nella modalità semplice.
        </p>
      </section>

      <section className="ob-section" aria-labelledby="ob-own-title">
        <h2 id="ob-own-title" className="ob-subtitle">
          Pittogrammi con le vostre foto
        </h2>
        <p className="ob-field__help">
          Puoi creare pittogrammi con le foto di casa: il cane, la nonna, la scuola. Per mandarne uno, invia la foto in
          chat con questa didascalia:
        </p>
        <div className="ob-share">
          {pictos && <PictoTile pictogram={pictos[0]} size="sm" label="foto" color={null} />}
          <code className="ob-share__caption pc-keep-case">{SHARE_EXAMPLE}</code>
        </div>
        <p className="ob-field__help">PictoChat la riconosce: chi la riceve può salvarla tra i suoi pittogrammi.</p>
      </section>
    </>
  );
}
