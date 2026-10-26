/**
 * Dev preview of the chat list with mock data (no Telegram session needed).
 * `?state=ok|loading|empty|error|offline` picks the scenario.
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import ChatListPage from '../ChatListPage';
import { ChatSourcesProvider } from '../sources';
import { mockSources, type MockState } from './mockData';

export default function ChatsPreview() {
  const [params] = useSearchParams();
  const state = (params.get('state') ?? 'ok') as MockState;
  const sources = useMemo(() => mockSources(state), [state]);
  return (
    <ChatSourcesProvider value={sources}>
      <ChatListPage />
    </ChatSourcesProvider>
  );
}
