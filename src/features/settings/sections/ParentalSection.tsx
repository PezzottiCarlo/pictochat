import { useMemo, useState } from 'react';
import { App, Button, Input } from 'antd';
import { CheckOutlined, LockOutlined, SearchOutlined } from '@ant-design/icons';
import { Sheet, cx } from '@/components/ui';
import { setPin } from '@/lib/pin';
import { useSettings } from '@/stores/settings';
import { filterChats } from '@/features/chats/chatListModel';
import { ChatAvatar } from '@/features/chats/components/bits';
import { useChatSources } from '@/features/chats/sources';
import { Note, SettingsGroup, ToggleRow } from '../components/controls';
import { PinPad } from '../pin/PinPad';
import { VerifyPinPad } from '../pin/PinGate';
import { usePinSession } from '../pin/pinSession';

function AllowedChats() {
  const { useChatList } = useChatSources();
  const { chats, loading } = useChatList();
  const allowed = useSettings((s) => s.allowedChatIds);
  const set = useSettings((s) => s.set);
  const [query, setQuery] = useState('');
  const people = useMemo(() => chats.filter((c) => c.kind === 'user' || c.kind === 'self'), [chats]);
  const shown = filterChats(people, query);
  const chosen = new Set(allowed);

  const toggle = (id: string) =>
    set('allowedChatIds', chosen.has(id) ? allowed.filter((x) => x !== id) : [...allowed, id]);

  if (!people.length) {
    return <Note>{loading ? 'Carico le chat…' : 'Le chat compariranno qui dopo l’accesso a Telegram.'}</Note>;
  }
  return (
    <div className="st-allowed">
      <Note>
        {allowed.length === 0
          ? 'Nessuna scelta: in modalità semplice si vedono tutte le chat con le persone.'
          : `In modalità semplice si vedono ${allowed.length === 1 ? 'solo questa chat' : `solo queste ${allowed.length} chat`}.`}
      </Note>
      {people.length > 8 && (
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined aria-hidden="true" />}
          placeholder="Cerca una persona"
          aria-label="Cerca una persona"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}
      <ul className="st-check-list" aria-label="Chat permesse">
        {shown.map((c) => {
          const on = chosen.has(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                className={cx('st-check', on && 'is-on')}
                onClick={() => toggle(c.id)}
              >
                <ChatAvatar chat={c} size="sm" showPresence={false} />
                <span className="st-check__name">{c.title}</span>
                <span className="st-check__box" aria-hidden="true">
                  {on && <CheckOutlined />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {allowed.length > 0 && (
        <Button size="large" block onClick={() => set('allowedChatIds', [])}>
          Mostra di nuovo tutte le persone
        </Button>
      )}
    </div>
  );
}

type PinFlow = 'set' | 'change' | 'remove';
type PinStep = 'verify' | 'new' | 'confirm';

function PinFlowSheet({ flow, onClose }: { flow: PinFlow | null; onClose: () => void }) {
  const { message } = App.useApp();
  const unlock = usePinSession((s) => s.unlock);
  const [step, setStep] = useState<PinStep>('new');
  const [first, setFirst] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastFlow, setLastFlow] = useState<PinFlow | null>(null);

  // Restart the steps whenever a new flow opens.
  if (flow !== lastFlow) {
    setLastFlow(flow);
    setStep(flow === 'set' ? 'new' : 'verify');
    setFirst('');
    setError(null);
  }

  const finish = async (pin: string | null) => {
    await setPin(pin);
    if (pin) unlock();
    void message.success(pin ? 'PIN salvato' : 'PIN tolto');
    onClose();
  };

  return (
    <Sheet open={flow !== null} onClose={onClose} aria-label="PIN del genitore">
      {flow && step === 'verify' && (
        <VerifyPinPad
          title={flow === 'remove' ? 'Scrivi il PIN da togliere' : 'Scrivi il PIN di adesso'}
          onSuccess={() => (flow === 'remove' ? void finish(null) : setStep('new'))}
        />
      )}
      {flow && step === 'new' && (
        <PinPad
          key="new"
          title="Scegli un nuovo PIN"
          description="4 cifre facili da ricordare per te, ma non per i ragazzi."
          error={error}
          onComplete={(pin) => {
            setFirst(pin);
            setError(null);
            setStep('confirm');
          }}
        />
      )}
      {flow && step === 'confirm' && (
        <PinPad
          key="confirm"
          title="Scrivi di nuovo il PIN"
          description="Così siamo sicuri che sia giusto."
          onComplete={(pin) => {
            if (pin === first) return void finish(pin);
            setError('I due PIN erano diversi. Scegline uno e riprova.');
            setStep('new');
            return false;
          }}
        />
      )}
    </Sheet>
  );
}

export function ParentalSection() {
  const s = useSettings();
  const hasPin = s.settingsPinHash !== null;
  const lock = usePinSession((st) => st.lock);
  const [flow, setFlow] = useState<PinFlow | null>(null);

  return (
    <>
      <SettingsGroup title="Semplicità">
        <ToggleRow
          label="Modalità semplice"
          description="Solo le chat con le persone, in grandi schede. Niente gruppi, canali e cose complicate."
          checked={s.simpleMode}
          onChange={(v) => s.set('simpleMode', v)}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Chat permesse"
        description="Scegli quali persone si vedono in modalità semplice."
      >
        <AllowedChats />
      </SettingsGroup>

      <SettingsGroup
        title="PIN del genitore"
        description="Con il PIN, per aprire le impostazioni o uscire da Telegram bisogna scriverlo."
      >
        <div className="st-pin-status">
          <span className={cx('st-chip', hasPin && 'st-chip--on')} aria-hidden="true">
            <LockOutlined />
          </span>
          <span className="st-row__label">{hasPin ? 'Il PIN è attivo' : 'Nessun PIN'}</span>
        </div>
        <div className="st-actions">
          {hasPin ? (
            <>
              <Button size="large" block onClick={() => setFlow('change')}>
                Cambia il PIN
              </Button>
              <Button size="large" block onClick={() => setFlow('remove')}>
                Togli il PIN
              </Button>
              <Button type="primary" size="large" block icon={<LockOutlined />} onClick={lock}>
                Blocca adesso le impostazioni
              </Button>
            </>
          ) : (
            <Button type="primary" size="large" block icon={<LockOutlined />} onClick={() => setFlow('set')}>
              Crea un PIN
            </Button>
          )}
        </div>
      </SettingsGroup>

      <PinFlowSheet flow={flow} onClose={() => setFlow(null)} />
    </>
  );
}
