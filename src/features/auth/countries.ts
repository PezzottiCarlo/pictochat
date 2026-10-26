/** Common country prefixes for the phone field (Italy first). "Altro" allows free input. */
export interface CountryPrefix {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryPrefix[] = [
  { code: '39', name: 'Italia', flag: '🇮🇹' },
  { code: '41', name: 'Svizzera', flag: '🇨🇭' },
  { code: '378', name: 'San Marino', flag: '🇸🇲' },
  { code: '33', name: 'Francia', flag: '🇫🇷' },
  { code: '49', name: 'Germania', flag: '🇩🇪' },
  { code: '43', name: 'Austria', flag: '🇦🇹' },
  { code: '34', name: 'Spagna', flag: '🇪🇸' },
  { code: '351', name: 'Portogallo', flag: '🇵🇹' },
  { code: '44', name: 'Regno Unito', flag: '🇬🇧' },
  { code: '32', name: 'Belgio', flag: '🇧🇪' },
  { code: '31', name: 'Paesi Bassi', flag: '🇳🇱' },
  { code: '40', name: 'Romania', flag: '🇷🇴' },
  { code: '355', name: 'Albania', flag: '🇦🇱' },
  { code: '380', name: 'Ucraina', flag: '🇺🇦' },
  { code: '373', name: 'Moldavia', flag: '🇲🇩' },
  { code: '212', name: 'Marocco', flag: '🇲🇦' },
  { code: '216', name: 'Tunisia', flag: '🇹🇳' },
  { code: '20', name: 'Egitto', flag: '🇪🇬' },
  { code: '55', name: 'Brasile', flag: '🇧🇷' },
  { code: '54', name: 'Argentina', flag: '🇦🇷' },
  { code: '1', name: 'Stati Uniti e Canada', flag: '🇺🇸' },
];

export const OTHER_PREFIX = 'altro';

/**
 * Full international number ("+39…") from the prefix and what the user typed.
 * A number typed with its own "+" or "00" wins over the selected prefix.
 */
export function composePhone(prefix: string, typed: string): string {
  const raw = typed.trim();
  if (/^(\+|00)/.test(raw)) return `+${raw.replace(/^00/, '').replace(/\D/g, '')}`;
  return `+${prefix.replace(/\D/g, '')}${raw.replace(/\D/g, '')}`;
}

/** Loose check (E.164 allows 8–15 digits including the prefix). */
export const isPlausiblePhone = (full: string) => /^\+\d{8,15}$/.test(full);

/** "+393331234567" → "+39 333 123 4567" for display. */
export function prettyPhone(full: string): string {
  const country = COUNTRIES.find((c) => full.startsWith(`+${c.code}`));
  if (!country) return full;
  const rest = full.slice(country.code.length + 1);
  return `+${country.code} ${rest.replace(/(\d{3})(\d{3})(\d+)/, '$1 $2 $3')}`;
}
