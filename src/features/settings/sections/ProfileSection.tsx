import { useState } from 'react';
import { useNavigate } from 'react-router';
import { App, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import type { UserRole } from '@/core/types';
import { Avatar, Sheet } from '@/components/ui';
import { paths } from '@/app/paths';
import { ROLE_PRESETS, useSettings } from '@/stores/settings';
import { useChatSources } from '@/features/chats/sources';
import { ChoiceRow, Note, SettingsGroup } from '../components/controls';
import { PinSheet } from '../pin/PinGate';

const ROLE_LABEL: Record<UserRole, string> = { teen: 'Ragazzo o ragazza', parent: 'Genitore' };

/** "+39 333 123 4567" from "393331234567". */
export function formatPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, '');
  const m = /^(39)(\d{3})(\d{3})(\d+)$/.exec(digits);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : `+${digits}`;
}

export function ProfileSection() {
  const { useMe, useAvatarUrl, logout } = useChatSources();
  const me = useMe();
  const avatar = useAvatarUrl(me?.id);
  const role = useSettings((s) => s.role);
  const patch = useSettings((s) => s.patch);
  const hasPin = useSettings((s) => s.settingsPinHash !== null);
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  const name = me ? [me.firstName, me.lastName].filter(Boolean).join(' ') : 'Non collegato';

  const applyRole = (next: UserRole, withPreset: boolean) => {
    patch(withPreset ? { role: next, ...ROLE_PRESETS[next] } : { role: next });
    setPendingRole(null);
    if (withPreset) void message.success('Impostazioni consigliate applicate');
  };

  const doLogout = () =>
    modal.confirm({
      title: 'Vuoi uscire da Telegram?',
      content: 'Le chat spariscono da questo telefono. Per tornare servirà di nuovo il codice di Telegram.',
      okText: 'Esci',
      okButtonProps: { danger: true },
      cancelText: 'Resta',
      onOk: async () => {
        setLeaving(true);
        try {
          await logout();
          navigate(paths.login, { replace: true });
        } catch {
          void message.error('Non sono riuscito a uscire. Controlla la connessione e riprova.');
        } finally {
          setLeaving(false);
        }
      },
    });

  return (
    <>
      <div className="st-profile">
        <Avatar src={avatar} name={name} size="xl" decorative />
        <div className="st-profile__text">
          <p className="st-profile__name">{name}</p>
          {me?.username && <p className="st-profile__meta pc-keep-case">@{me.username}</p>}
          {me?.phone && <p className="st-profile__meta">{formatPhone(me.phone)}</p>}
        </div>
      </div>

      <SettingsGroup title="Chi usa questo telefono?">
        <ChoiceRow<UserRole>
          label="Uso principale"
          description="Serve a scegliere le impostazioni più adatte. Puoi sempre cambiarle una per una."
          value={role}
          onChange={(next) => next !== role && setPendingRole(next)}
          stacked
          options={[
            { value: 'teen', label: 'Ragazzo o ragazza', icon: <span aria-hidden="true">🧒</span> },
            { value: 'parent', label: 'Genitore', icon: <span aria-hidden="true">🧑‍🍼</span> },
          ]}
        />
      </SettingsGroup>

      {me && (
        <SettingsGroup title="Account">
          <div className="st-row st-row--stack">
            <Button
              danger
              size="large"
              block
              icon={<LogoutOutlined />}
              loading={leaving}
              onClick={() => (hasPin ? setPinOpen(true) : doLogout())}
            >
              Esci da Telegram
            </Button>
          </div>
          {hasPin && <Note>Per uscire serve il PIN del genitore.</Note>}
        </SettingsGroup>
      )}

      <Sheet
        open={pendingRole !== null}
        onClose={() => setPendingRole(null)}
        title={pendingRole ? `Lo usa: ${ROLE_LABEL[pendingRole].toLowerCase()}` : undefined}
        footer={
          pendingRole && (
            <div className="st-actions">
              <Button type="primary" size="large" block onClick={() => applyRole(pendingRole, true)}>
                Sì, applica le impostazioni consigliate
              </Button>
              <Button size="large" block onClick={() => applyRole(pendingRole, false)}>
                Cambia solo il ruolo
              </Button>
            </div>
          )
        }
      >
        <p className="st-sheet-text">
          {pendingRole === 'teen'
            ? 'Le impostazioni consigliate rendono più grandi testo e pittogrammi, fanno scrivere con i pittogrammi e leggono le parole a voce.'
            : 'Le impostazioni consigliate usano testo normale e la tastiera, senza risposte suggerite.'}{' '}
          Potrai sempre cambiarle una per una.
        </p>
      </Sheet>

      <PinSheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={doLogout}
        title="PIN per uscire"
        description="Scrivi il PIN del genitore per uscire da Telegram."
      />
    </>
  );
}
