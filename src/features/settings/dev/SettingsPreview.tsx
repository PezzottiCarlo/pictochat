/**
 * Dev preview of Settings with mock Telegram data. Mount it at both `/dev/settings` and
 * `/dev/settings/:section`: links stay inside the preview.
 */
import { useMemo } from 'react';
import SettingsPage from '../SettingsPage';
import { SettingsNavProvider, type SettingsNav } from '../nav';
import { ChatSourcesProvider } from '@/features/chats/sources';
import { mockSources } from '@/features/chats/dev/mockData';

const nav: SettingsNav = { href: (section) => (section ? `/dev/settings/${section}` : '/dev/settings') };

export default function SettingsPreview() {
  const sources = useMemo(() => mockSources('ok'), []);
  return (
    <ChatSourcesProvider value={sources}>
      <SettingsNavProvider value={nav}>
        <SettingsPage />
      </SettingsNavProvider>
    </ChatSourcesProvider>
  );
}
