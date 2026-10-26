import type { Appearance, HairColor, SkinColor } from '@/core/types';

export const SKIN_HEX: Record<SkinColor, string> = {
  white: 'F5E5DE',
  black: 'A65C17',
  asian: 'F4ECAD',
  mulatto: 'E3AB72',
  aztec: 'CF9D7C',
};

export const HAIR_HEX: Record<HairColor, string> = {
  blonde: 'FDD700',
  brown: 'A65E26',
  darkBrown: '6A2703',
  gray: 'EFEFEF',
  darkGray: 'AAABAB',
  red: 'ED4120',
  black: '020100',
};

export type ImageSize = 300 | 500 | 2500;

const STATIC = 'https://static.arasaac.org/pictograms';
const API = 'https://api.arasaac.org/api/pictograms/it';

/**
 * Static image URL. Colored variants (`{id}_hair-HEX_skin-HEX_{size}.png`, hair before skin) are only
 * served at 500 and 2500 px, so a 300 px request with colors is bumped to 500.
 */
export function arasaacImageUrl(
  id: number,
  features: { skin: boolean; hair: boolean },
  appearance: Appearance,
  size: ImageSize = 500,
): string {
  const parts: string[] = [];
  if (features.hair) parts.push(`hair-${HAIR_HEX[appearance.hair] ?? HAIR_HEX.brown}`);
  if (features.skin) parts.push(`skin-${SKIN_HEX[appearance.skin] ?? SKIN_HEX.white}`);
  if (!parts.length) return `${STATIC}/${id}/${id}_${size}.png`;
  return `${STATIC}/${id}/${id}_${parts.join('_')}_${size === 300 ? 500 : size}.png`;
}

export interface OnlineResult {
  id: number;
  word: string;
  skin: boolean;
  hair: boolean;
}

interface ApiPictogram {
  _id: number;
  skin?: boolean;
  hair?: boolean;
  sex?: boolean;
  violence?: boolean;
  keywords?: { keyword: string }[];
}

/** ARASAAC online search; resolves to [] when offline, on 404 (no results) or on timeout. */
export async function searchArasaacOnline(query: string, timeoutMs = 6000): Promise<OnlineResult[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`${API}/search/${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    return (data as ApiPictogram[])
      .filter((p) => typeof p._id === 'number' && !p.sex && !p.violence)
      .map((p) => ({ id: p._id, word: p.keywords?.[0]?.keyword ?? q, skin: !!p.skin, hair: !!p.hair }));
  } catch {
    return [];
  }
}
