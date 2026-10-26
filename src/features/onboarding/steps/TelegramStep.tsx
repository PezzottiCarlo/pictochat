import { CheckCircleFilled, CloudServerOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { Surface } from '@/components/ui';
import { useMe } from '@/services/telegram';
import { LoginFlow } from '@/features/auth/LoginFlow';
import { PrivacyNote } from '@/features/auth/PrivacyNote';
import { PointList } from '../components/controls';
import type { StepContext } from './types';

function Connected() {
  const me = useMe();
  const name = me ? [me.firstName, me.lastName].filter(Boolean).join(' ') : undefined;
  return (
    <Surface padding={5} radius="xl" className="ob-connected" aria-live="polite">
      <CheckCircleFilled className="ob-connected__icon" aria-hidden="true" />
      <div>
        <p className="ob-connected__title">{name ? `Sei già collegato come ${name}` : 'Sei già collegato a Telegram'}</p>
        <p className="ob-field__help">Non devi fare niente: tocca Avanti.</p>
      </div>
    </Surface>
  );
}

export function TelegramStep({ ctx }: { ctx: StepContext }) {
  return (
    <>
      <PointList
        items={[
          { icon: <TeamOutlined />, text: 'Usi il tuo account Telegram: scrivi a chi vuoi, anche a chi usa Telegram normale.' },
          { icon: <LockOutlined />, text: 'PictoChat non manda i tuoi messaggi a nessun altro: passano solo tra questo telefono e Telegram.' },
          { icon: <CloudServerOutlined />, text: 'PictoChat non ha un server suo: è solo un modo diverso di vedere Telegram.' },
        ]}
      />

      {ctx.loggedIn ? (
        <Connected />
      ) : (
        <Surface padding={5} radius="xl" variant="glass" className="ob-login">
          <LoginFlow onSuccess={ctx.onLoggedIn} />
        </Surface>
      )}

      {!ctx.loggedIn && <PrivacyNote />}
      {!ctx.loggedIn && (
        <p className="ob-note">
          Non hai Telegram? Scarica l’app Telegram, crea l’account con il tuo numero e poi torna qui.
        </p>
      )}
    </>
  );
}
