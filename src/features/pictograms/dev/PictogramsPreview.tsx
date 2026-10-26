/**
 * Dev preview of the pictograms page: personal pictograms are local (IndexedDB) and the
 * library is bundled, so only sending needs mocks (it logs instead of using Telegram).
 */
import { useMemo } from 'react';
import PictogramsPage from '../PictogramsPage';
import { ChatSourcesProvider } from '@/features/chats/sources';
import { mockSources } from '@/features/chats/dev/mockData';

export default function PictogramsPreview() {
  const sources = useMemo(() => mockSources('ok'), []);
  return (
    <ChatSourcesProvider value={sources}>
      <PictogramsPage />
    </ChatSourcesProvider>
  );
}
