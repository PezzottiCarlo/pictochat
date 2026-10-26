import { Navigate, Outlet, useLocation } from 'react-router';
import { messaging } from '@/services/telegram';
import { useSettings } from '@/stores/settings';
import { paths } from './paths';

/**
 * Everyone goes through the v2 onboarding first (it ends with the Telegram login),
 * then the app needs a Telegram session.
 */
export function RequireReady() {
  const onboardingDone = useSettings((s) => s.onboardingDone);
  const location = useLocation();
  if (!onboardingDone) return <Navigate to={paths.onboarding} replace />;
  if (!messaging.hasSession()) return <Navigate to={paths.login} replace state={{ from: location }} />;
  return <Outlet />;
}
