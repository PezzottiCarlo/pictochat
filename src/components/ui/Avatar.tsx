import { useState } from 'react';
import type { Presence } from '@/core/types';
import { cx, type StyleWithVars } from './utils';
import './Avatar.css';

export interface AvatarProps {
  /** Photo URL; falls back to initials on error or when missing. */
  src?: string;
  name: string;
  /** px, or a preset: sm 40 · md 52 · lg 72 · xl 104. */
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  /** Shows a green dot when online. */
  presence?: Presence | 'online' | 'offline' | null;
  /** Hide from screen readers when the name is already next to it. */
  decorative?: boolean;
  className?: string;
}

const SIZES = { sm: 40, md: 52, lg: 72, xl: 104 } as const;

/** Stable hue from a name (djb2), so a person keeps the same color everywhere. */
export function nameHue(name: string): number {
  let h = 5381;
  for (const ch of name.trim().toLowerCase()) h = ((h << 5) + h + ch.codePointAt(0)!) | 0;
  return Math.abs(h) % 360;
}

export function initials(name: string): string {
  // First letter/digit of each word, so "Luca (scuola)" gives "LS", not "L(".
  const letters = name
    .trim()
    .split(/\s+/)
    .map((w) => w.match(/[\p{L}\p{N}]/u)?.[0])
    .filter((c): c is string => Boolean(c));
  if (!letters.length) return [...name.trim()][0] ?? '?';
  const second = letters.length > 1 ? letters[letters.length - 1] : '';
  return (letters[0] + second).toUpperCase();
}

export function Avatar({ src, name, size = 'md', presence, decorative = false, className }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const px = typeof size === 'number' ? size : SIZES[size];
  const online = presence === 'online' || (typeof presence === 'object' && presence?.state === 'online');
  const showImg = Boolean(src) && failedSrc !== src;
  const style: StyleWithVars = { '--avatar-size': `${px}px`, '--avatar-hue': nameHue(name) };

  return (
    <span
      className={cx('pc-avatar', className)}
      style={style}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : online ? `${name}, online` : name}
      aria-hidden={decorative || undefined}
    >
      {showImg ? (
        <img className="pc-avatar__img" src={src} alt="" draggable={false} onError={() => setFailedSrc(src!)} />
      ) : (
        <span className="pc-avatar__initials" aria-hidden="true">
          {initials(name)}
        </span>
      )}
      {online && <span className="pc-avatar__presence" aria-hidden="true" />}
    </span>
  );
}
