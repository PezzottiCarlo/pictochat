import { describe, expect, it } from 'vitest';
import { formatBytes, formatDuration, isEmojiOnly, isPdf, linkify, presenceText } from './lib/format';

describe('chat formatting', () => {
  it('formats sizes and durations', () => {
    expect(formatBytes(undefined)).toBe('');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(248_000)).toBe('242 KB');
    expect(formatBytes(1_572_864)).toBe('1,5 MB');
    expect(formatDuration(75)).toBe('1:15');
    expect(formatDuration(3_725)).toBe('1:02:05');
    expect(formatDuration(undefined)).toBe('');
  });

  it('detects emoji-only messages', () => {
    expect(isEmojiOnly('👍')).toBe(true);
    expect(isEmojiOnly('❤️ 😊')).toBe(true);
    expect(isEmojiOnly('ok 👍')).toBe(false);
    expect(isEmojiOnly('123')).toBe(false);
    expect(isEmojiOnly('👍👍👍👍')).toBe(false);
  });

  it('splits links out of text', () => {
    expect(linkify('vedi www.arasaac.org.')).toEqual([
      { type: 'text', value: 'vedi ' },
      { type: 'link', value: 'www.arasaac.org', href: 'https://www.arasaac.org' },
      { type: 'text', value: '.' },
    ]);
    expect(linkify('ciao')).toEqual([{ type: 'text', value: 'ciao' }]);
  });

  it('recognises PDFs by mime type or name', () => {
    expect(isPdf({ kind: 'document', mimeType: 'application/pdf' })).toBe(true);
    expect(isPdf({ kind: 'document', fileName: 'Menu.PDF' })).toBe(true);
    expect(isPdf({ kind: 'document', fileName: 'foto.jpg' })).toBe(false);
  });

  it('describes presence', () => {
    const now = new Date(2026, 9, 26, 18, 0).getTime();
    expect(presenceText({ state: 'online' }, now)).toBe('Online');
    expect(presenceText({ state: 'recently' }, now)).toBe('Online di recente');
    expect(presenceText({ state: 'offline', lastSeen: new Date(2026, 9, 26, 9, 5).getTime() }, now)).toBe(
      'Ultimo accesso alle 09:05',
    );
    expect(presenceText({ state: 'offline', lastSeen: new Date(2026, 9, 25, 21, 30).getTime() }, now)).toBe(
      'Ultimo accesso ieri alle 21:30',
    );
    expect(presenceText(undefined, now)).toBeUndefined();
  });
});
