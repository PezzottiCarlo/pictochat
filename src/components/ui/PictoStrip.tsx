import type { PictogramToken, SizeStep } from '@/core/types';
import type { CategoryColor } from '@/theme';
import { PictoTile } from './PictoTile';
import { cx } from './utils';
import './PictoStrip.css';

export interface PictoStripProps {
  tokens: PictogramToken[];
  /** Defaults to the user's pictogramSize setting. */
  size?: SizeStep;
  onTokenPress?: (token: PictogramToken, index: number) => void;
  onTokenLongPress?: (token: PictogramToken, index: number) => void;
  /** Index into `tokens` of the highlighted tile (e.g. the word being spoken). */
  activeIndex?: number;
  /** Wrap onto several lines instead of scrolling horizontally. */
  wrap?: boolean;
  /** Category color per token (the strip has no vocabulary knowledge). */
  colorOf?: (token: PictogramToken) => CategoryColor | null | undefined;
  /** Spoken name of the list (default "Frase in pittogrammi"). */
  'aria-label'?: string;
  className?: string;
}

/**
 * A sentence as pictograms, in order. Skipped tokens (articles, prepositions…) are hidden;
 * tokens without a pictogram show the word on a blank card so the sentence stays complete.
 */
export function PictoStrip({
  tokens,
  size,
  onTokenPress,
  onTokenLongPress,
  activeIndex,
  wrap = false,
  colorOf,
  'aria-label': ariaLabel = 'Frase in pittogrammi',
  className,
}: PictoStripProps) {
  return (
    <ul className={cx('pc-strip', wrap && 'pc-strip--wrap', className)} aria-label={ariaLabel}>
      {tokens.map((token, index) => {
        if (token.skipped) return null;
        const pictogram = token.pictogram ?? { id: `word:${index}`, word: token.text, url: '', source: 'personal' as const };
        return (
          <li key={`${index}:${token.lemma}`} className="pc-strip__item">
            <PictoTile
              pictogram={pictogram}
              label={token.text}
              size={size}
              color={colorOf?.(token)}
              selected={activeIndex === undefined ? undefined : activeIndex === index}
              onPress={onTokenPress ? () => onTokenPress(token, index) : undefined}
              onLongPress={onTokenLongPress ? () => onTokenLongPress(token, index) : undefined}
            />
          </li>
        );
      })}
    </ul>
  );
}
