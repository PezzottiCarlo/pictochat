import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/core/types';

/**
 * Calls `onIncoming` with messages that arrive while the chat is open (not the history loaded
 * on open, not older pages, not my own messages).
 */
export function useIncoming(messages: readonly ChatMessage[], onIncoming: (fresh: ChatMessage[]) => void): void {
  const maxSeen = useRef<number | null>(null);
  const handler = useRef(onIncoming);
  handler.current = onIncoming;

  useEffect(() => {
    if (!messages.length) return;
    let max = maxSeen.current ?? 0;
    const fresh: ChatMessage[] = [];
    for (const m of messages) {
      if (m.id <= 0) continue;
      if (maxSeen.current !== null && m.id > maxSeen.current && !m.out && !m.service) fresh.push(m);
      if (m.id > max) max = m.id;
    }
    maxSeen.current = max;
    if (fresh.length) handler.current(fresh);
  }, [messages]);
}

/** Text for a polite live region; re-announces identical text by toggling a suffix. */
export function useAnnouncer(): [string, (text: string) => void] {
  const [text, setText] = useState('');
  const announce = (next: string) => setText((cur) => (cur === next ? `${next} ` : next));
  return [text, announce];
}
