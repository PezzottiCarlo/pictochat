import { Navigate, useLocation, useNavigate, type Location } from 'react-router';
import { NavHeader, PageScaffold, Surface } from '@/components/ui';
import { messaging } from '@/services/telegram';
import { useSettings } from '@/stores/settings';
import { paths } from '@/app/paths';
import { LoginFlow } from './LoginFlow';
import { PrivacyNote } from './PrivacyNote';

/** /accedi — reached when the Telegram session is missing or was revoked. */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const onboardingDone = useSettings((s) => s.onboardingDone);
  const from = (location.state as { from?: Location } | null)?.from;
  const target = from && from.pathname !== paths.login ? `${from.pathname}${from.search}` : paths.chats;

  if (messaging.hasSession()) return <Navigate to={target} replace />;

  return (
    <PageScaffold
      header={
        <NavHeader
          title="Collega Telegram"
          subtitle="Entra con il tuo account"
          onBack={onboardingDone ? undefined : () => navigate(paths.onboarding)}
          backLabel="Torna alla guida"
        />
      }
      maxWidth={560}
    >
      <div className="au-page">
        <p className="au-lead">
          PictoChat usa il tuo account Telegram. Scrivi il tuo numero: ti mandiamo un codice per entrare.
        </p>
        <Surface padding={5} radius="xl" variant="glass">
          <LoginFlow onSuccess={() => navigate(target, { replace: true })} />
        </Surface>
        <PrivacyNote />
      </div>
    </PageScaffold>
  );
}
