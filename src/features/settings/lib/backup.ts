/**
 * Backup file: settings + personal pictograms (images as base64) in one JSON document.
 * Pure helpers, no React and no stores, so they are unit-testable.
 */
import type { HairColor, PersonalPictogram, QuickPhrase, Settings, SkinColor } from '@/core/types';
import { DEFAULT_SETTINGS } from '@/stores/settings';

export const BACKUP_KIND = 'pictochat-backup';
export const BACKUP_VERSION = 1;

/** Never exported/imported: the PIN protects this device only; onboarding is per device. */
const LOCAL_ONLY = ['settingsPinHash', 'onboardingDone'] as const satisfies readonly (keyof Settings)[];

export interface BackupPictogram {
  word: string;
  category: string;
  createdAt: number;
  origin: PersonalPictogram['origin'];
  image: { type: string; data: string };
}

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  version: number;
  exportedAt: string;
  settings: Partial<Settings>;
  pictograms: BackupPictogram[];
}

export interface RestoredBackup {
  exportedAt?: string;
  settings: Partial<Settings>;
  pictograms: Array<Omit<BackupPictogram, 'image'> & { image: Blob }>;
  /** Pictograms skipped because their data was broken. */
  skipped: number;
}

export class BackupError extends Error {}

// ---------------------------------------------------------------------------
// base64
// ---------------------------------------------------------------------------

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(data: string): Uint8Array {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

// ---------------------------------------------------------------------------
// settings sanitizing
// ---------------------------------------------------------------------------

const ENUMS: Partial<Record<keyof Settings, readonly string[]>> = {
  role: ['teen', 'parent'],
  reduceMotion: ['system', 'on', 'off'],
  reduceTransparency: ['system', 'on', 'off'],
  letterSpacing: ['normal', 'wide', 'wider'],
  lineHeight: ['normal', 'relaxed', 'loose'],
  touchSize: ['comfortable', 'large', 'xl'],
  pictogramSize: ['sm', 'md', 'lg', 'xl'],
  pictogramLabel: ['below', 'above', 'hidden'],
  composerMode: ['pictograms', 'keyboard'],
};

const RANGES: Partial<Record<keyof Settings, [number, number]>> = {
  fontScale: [0.85, 1.8],
  glassIntensity: [0, 1],
  speechRate: [0.5, 2],
  speechPitch: [0, 2],
};

const SKINS: readonly SkinColor[] = ['white', 'black', 'asian', 'mulatto', 'aztec'];
const HAIRS: readonly HairColor[] = ['blonde', 'brown', 'darkBrown', 'gray', 'darkGray', 'red', 'black'];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';

function sanitizeValue<K extends keyof Settings>(key: K, value: unknown): Settings[K] | undefined {
  const def = DEFAULT_SETTINGS[key];
  switch (key) {
    case 'accentColor':
      return (value === null || (isString(value) && /^#[0-9a-f]{6}$/i.test(value)) ? value : undefined) as Settings[K];
    case 'voiceURI':
      return (value === null || isString(value) ? value : undefined) as Settings[K];
    case 'appearance':
      return (
        isRecord(value) && SKINS.includes(value.skin as SkinColor) && HAIRS.includes(value.hair as HairColor)
          ? { skin: value.skin, hair: value.hair }
          : undefined
      ) as Settings[K];
    case 'allowedChatIds':
      return (Array.isArray(value) ? value.filter(isString) : undefined) as Settings[K];
    case 'quickPhrases': {
      if (!Array.isArray(value)) return undefined;
      const phrases: QuickPhrase[] = value
        .filter((p): p is Record<string, unknown> => isRecord(p) && isString(p.text) && p.text.trim() !== '')
        .map((p, i) => ({
          id: isString(p.id) && p.id ? p.id : `qp-import-${i}`,
          text: (p.text as string).trim().slice(0, 80),
          icon: isString(p.icon) ? p.icon.slice(0, 16) : '💬',
        }));
      return phrases as Settings[K];
    }
  }
  if (typeof value !== typeof def) return undefined;
  const allowed = ENUMS[key];
  if (allowed && !allowed.includes(value as string)) return undefined;
  const range = RANGES[key];
  if (range) {
    const n = value as number;
    if (!Number.isFinite(n)) return undefined;
    return Math.min(range[1], Math.max(range[0], n)) as Settings[K];
  }
  return value as Settings[K];
}

/** Keeps only known, well-typed, portable settings from untrusted input. */
export function sanitizeSettings(raw: unknown): Partial<Settings> {
  if (!isRecord(raw)) return {};
  const out: Partial<Settings> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if ((LOCAL_ONLY as readonly string[]).includes(key) || !(key in raw)) continue;
    const v = sanitizeValue(key, raw[key]);
    if (v !== undefined) (out as Record<string, unknown>)[key] = v;
  }
  return out;
}

/** Settings worth carrying to another device. */
export function exportableSettings(settings: Settings): Partial<Settings> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (!(LOCAL_ONLY as readonly string[]).includes(key)) out[key] = settings[key];
  }
  return out as Partial<Settings>;
}

// ---------------------------------------------------------------------------
// build / parse
// ---------------------------------------------------------------------------

export async function buildBackup(
  settings: Settings,
  pictograms: readonly PersonalPictogram[],
  now: Date = new Date(),
): Promise<BackupFile> {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings: exportableSettings(settings),
    pictograms: await Promise.all(
      pictograms.map(async (p) => ({
        word: p.word,
        category: p.category,
        createdAt: p.createdAt,
        origin: p.origin,
        image: { type: p.image.type || 'image/jpeg', data: await blobToBase64(p.image) },
      })),
    ),
  };
}

export function parseBackup(text: string): RestoredBackup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new BackupError('Il file non è un backup di PictoChat (non riesco a leggerlo).');
  }
  if (!isRecord(json) || json.kind !== BACKUP_KIND) {
    throw new BackupError('Il file non è un backup di PictoChat.');
  }
  if (typeof json.version !== 'number' || json.version > BACKUP_VERSION) {
    throw new BackupError('Il backup viene da una versione più nuova di PictoChat: aggiorna l’app e riprova.');
  }
  let skipped = 0;
  const pictograms: RestoredBackup['pictograms'] = [];
  for (const p of Array.isArray(json.pictograms) ? json.pictograms : []) {
    try {
      if (!isRecord(p) || !isString(p.word) || !p.word.trim() || !isRecord(p.image) || !isString(p.image.data)) {
        throw new Error('invalid');
      }
      const type = isString(p.image.type) && p.image.type.startsWith('image/') ? p.image.type : 'image/jpeg';
      pictograms.push({
        word: p.word,
        category: isString(p.category) ? p.category : 'oggetti',
        createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
        origin: p.origin === 'chat' ? 'chat' : 'manual',
        image: new Blob([base64ToBytes(p.image.data) as Uint8Array<ArrayBuffer>], { type }),
      });
    } catch {
      skipped++;
    }
  }
  return {
    exportedAt: isString(json.exportedAt) ? json.exportedAt : undefined,
    settings: sanitizeSettings(json.settings),
    pictograms,
    skipped,
  };
}

/** pictochat-backup-2026-10-26.json */
export const backupFileName = (d: Date = new Date()): string =>
  `pictochat-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
