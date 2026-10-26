import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PictoTile } from '@/components/ui';
import { usePictogramTokens, tokenColor } from '@/services/aac';
import { useReducedMotion } from '@/theme';

const STEP_MS = 650;

/**
 * A sentence that "translates itself": its pictograms pop in one at a time under the
 * bubble while the matching words light up. All at once with reduced motion.
 */
export function LiveSentence({ text }: { text: string }) {
  const reduced = useReducedMotion();
  const tokens = usePictogramTokens(text);
  const visible = (tokens ?? []).filter((t) => !t.skipped);
  const total = visible.length;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    setShown(reduced ? total : 0);
    if (reduced || total === 0) return;
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setShown(n);
      if (n >= total) window.clearInterval(timer);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [text, total, reduced]);

  const lit = new Set(visible.slice(0, shown).map((t) => t.text.toLowerCase()));

  return (
    <div className="ob-live">
      <div className="ob-bubble ob-bubble--in ob-live__bubble">
        <p className="ob-bubble__text">
          {text.split(/(\s+)/).map((part, i) => {
            const bare = part.replace(/[^\p{L}\p{N}']/gu, '').toLowerCase();
            const on = bare !== '' && [...lit].some((w) => w.split(/\s+/).includes(bare));
            return (
              <span key={i} className={on ? 'ob-live__word is-lit' : 'ob-live__word'}>
                {part}
              </span>
            );
          })}
        </p>
      </div>
      <ul className="ob-live__strip" aria-label={`In pittogrammi: ${text}`}>
        <AnimatePresence initial={false}>
          {visible.slice(0, shown).map((token, i) =>
            token.pictogram ? (
              <motion.li
                key={`${text}:${i}`}
                className="ob-live__item"
                initial={{ opacity: 0, scale: 0.6, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              >
                <PictoTile pictogram={token.pictogram} label={token.text} size="sm" color={tokenColor(token)} />
              </motion.li>
            ) : null,
          )}
        </AnimatePresence>
        {tokens === undefined && <li className="ob-live__loading">Carico i pittogrammi…</li>}
      </ul>
    </div>
  );
}
