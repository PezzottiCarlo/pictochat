import { describe, expect, it } from 'vitest';
import type { PersonalPictogram } from '@/core/types';
import { DEFAULT_SETTINGS } from '@/stores/settings';
import {
  BackupError,
  backupFileName,
  base64ToBytes,
  buildBackup,
  bytesToBase64,
  parseBackup,
  sanitizeSettings,
} from './backup';

const picto = (word: string, bytes: number[]): PersonalPictogram => ({
  id: `p:${word}`,
  word,
  category: 'persone',
  image: new Blob([new Uint8Array(bytes)], { type: 'image/png' }),
  createdAt: 1700000000000,
  origin: 'manual',
});

describe('base64', () => {
  it('round-trips binary data, including large buffers', () => {
    const big = new Uint8Array(100_000).map((_, i) => (i * 7) % 256);
    expect(base64ToBytes(bytesToBase64(big))).toEqual(big);
    expect(bytesToBase64(new Uint8Array([0, 255, 128]))).toBe('AP+A');
  });
});

describe('buildBackup / parseBackup', () => {
  it('round-trips settings and pictogram images', async () => {
    const settings = { ...DEFAULT_SETTINGS, fontScale: 1.5, uppercase: true, settingsPinHash: 'secret', onboardingDone: true };
    const file = await buildBackup(settings, [picto('nonna', [1, 2, 3, 250])], new Date('2026-01-02T10:00:00Z'));
    expect(file.settings).not.toHaveProperty('settingsPinHash');
    expect(file.settings).not.toHaveProperty('onboardingDone');

    const restored = parseBackup(JSON.stringify(file));
    expect(restored.settings.fontScale).toBe(1.5);
    expect(restored.settings.uppercase).toBe(true);
    expect(restored.settings).not.toHaveProperty('settingsPinHash');
    expect(restored.pictograms).toHaveLength(1);
    expect(restored.pictograms[0].word).toBe('nonna');
    expect(restored.pictograms[0].image.type).toBe('image/png');
    expect(new Uint8Array(await restored.pictograms[0].image.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 250]));
    expect(restored.exportedAt).toBe('2026-01-02T10:00:00.000Z');
  });

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError);
    expect(() => parseBackup('{"hello":1}')).toThrow(BackupError);
    expect(() => parseBackup('{"kind":"pictochat-backup","version":99}')).toThrow(/più nuova/);
  });

  it('skips broken pictograms instead of failing', () => {
    const r = parseBackup(
      JSON.stringify({
        kind: 'pictochat-backup',
        version: 1,
        pictograms: [{ word: 'ok', category: 'cibo', image: { type: 'image/jpeg', data: 'AAEC' } }, { word: '' }, 42],
      }),
    );
    expect(r.pictograms.map((p) => p.word)).toEqual(['ok']);
    expect(r.skipped).toBe(2);
  });
});

describe('sanitizeSettings', () => {
  it('keeps only valid known values and clamps numbers', () => {
    const s = sanitizeSettings({
      fontScale: 9,
      touchSize: 'huge',
      letterSpacing: 'wide',
      accentColor: 'red',
      voiceURI: null,
      appearance: { skin: 'asian', hair: 'red' },
      quickPhrases: [{ text: '  Ciao  ', icon: '👋' }, { text: '' }],
      settingsPinHash: 'x',
      unknownKey: true,
      boldText: 'yes',
    });
    expect(s).toEqual({
      fontScale: 1.8,
      letterSpacing: 'wide',
      voiceURI: null,
      appearance: { skin: 'asian', hair: 'red' },
      quickPhrases: [{ id: 'qp-import-0', text: 'Ciao', icon: '👋' }],
    });
  });
});

it('names the backup file after the date', () => {
  expect(backupFileName(new Date(2026, 9, 5))).toBe('pictochat-backup-2026-10-05.json');
});
