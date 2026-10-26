import { getSettings, useSettings } from '@/stores/settings';

/** Parent PIN protecting settings. Only a salted SHA-256 hash is stored. */

const SALT = 'pictochat:pin:v2';

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = getSettings().settingsPinHash;
  return stored === null || stored === (await hashPin(pin));
}

export async function setPin(pin: string | null) {
  useSettings.getState().set('settingsPinHash', pin ? await hashPin(pin) : null);
}

export const isPinSet = () => getSettings().settingsPinHash !== null;
