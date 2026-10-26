import { createHashRouter, Navigate } from 'react-router';
import type { ComponentType } from 'react';
import { paths } from './paths';
import { AppRoot } from './AppRoot';
import { RequireReady } from './guards';
import { RouteError } from './RouteError';

/** Route modules are code-split; each feature folder default-exports its page. */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const router = createHashRouter([
  {
    path: '/',
    Component: AppRoot,
    ErrorBoundary: RouteError,
    children: [
      { index: true, element: <Navigate to={paths.chats} replace /> },
      { path: paths.onboarding, lazy: page(() => import('@/features/onboarding/OnboardingPage')) },
      { path: paths.login, lazy: page(() => import('@/features/auth/LoginPage')) },
      {
        Component: RequireReady,
        children: [
          { path: paths.chats, lazy: page(() => import('@/features/chats/ChatListPage')) },
          { path: '/chat/:chatId', lazy: page(() => import('@/features/chat/ChatPage')) },
          { path: paths.pictograms, lazy: page(() => import('@/features/pictograms/PictogramsPage')) },
          { path: paths.settings, lazy: page(() => import('@/features/settings/SettingsPage')) },
          { path: '/impostazioni/:section', lazy: page(() => import('@/features/settings/SettingsPage')) },
          { path: paths.help, lazy: page(() => import('@/features/help/HelpPage')) },
        ],
      },
      {
        path: paths.showcase,
        lazy: async () => ({ Component: (await import('@/theme/Showcase')).Showcase }),
      },
      // Feature previews with mock data (no Telegram session needed); dev server only.
      ...(import.meta.env.DEV
        ? [
            { path: '/dev/chat', lazy: page(() => import('@/features/chat/dev/ChatPreview')) },
            { path: '/dev/chats', lazy: page(() => import('@/features/chats/dev/ChatsPreview')) },
            { path: '/dev/settings', lazy: page(() => import('@/features/settings/dev/SettingsPreview')) },
            { path: '/dev/settings/:section', lazy: page(() => import('@/features/settings/dev/SettingsPreview')) },
            { path: '/dev/pictograms', lazy: page(() => import('@/features/pictograms/dev/PictogramsPreview')) },
          ]
        : []),
      { path: '*', element: <Navigate to={paths.chats} replace /> },
    ],
  },
]);
