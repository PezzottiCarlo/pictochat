import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { StyleWithVars } from '@/components/ui';
import { useReducedMotion } from '@/theme';

const COLORS = ['person', 'verb', 'noun', 'adjective', 'social', 'place', 'time', 'misc'];

interface Piece {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  rotate: number;
  size: number;
  round: boolean;
  color: string;
}

/** One celebratory burst of paper pieces in the category colours. Nothing with reduced motion. */
export function Confetti({ count = 42 }: { count?: number }) {
  const reduced = useReducedMotion();
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: Math.random() * 100,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 1.6,
        rotate: (Math.random() - 0.5) * 900,
        size: 8 + Math.random() * 8,
        round: i % 3 === 0,
        color: COLORS[i % COLORS.length],
      })),
    [count],
  );

  if (reduced) return null;

  return (
    <div className="ob-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="ob-confetti__piece"
          style={
            {
              left: `${p.x}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.45,
              borderRadius: p.round ? '50%' : 2,
              '--piece': `var(--cat-${p.color})`,
            } as StyleWithVars
          }
          initial={{ y: '-10vh', x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '105vh', x: p.drift, rotate: p.rotate, opacity: [1, 1, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
