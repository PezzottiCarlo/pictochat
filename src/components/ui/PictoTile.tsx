import { useState, type MouseEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { CheckOutlined } from '@ant-design/icons';
import type { Pictogram, SizeStep } from '@/core/types';
import { PICTO_SIZES, useA11yPrefs, type CategoryColor } from '@/theme';
import { cx, useLongPress, type StyleWithVars } from './utils';
import './PictoTile.css';

const CATEGORY_COLORS: CategoryColor[] = ['person', 'verb', 'noun', 'adjective', 'social', 'place', 'time', 'misc'];

export interface PictoTileProps {
  pictogram: Pictogram;
  /** Defaults to the user's pictogramSize setting. */
  size?: SizeStep;
  /** Selection ring + check. When set, the tile is announced as a toggle (aria-pressed). */
  selected?: boolean;
  onPress?: (pictogram: Pictogram) => void;
  /** Long press / right click / keyboard menu key; e.g. speak the word or show options. */
  onLongPress?: (pictogram: Pictogram) => void;
  /** Shorthand for labelPosition 'hidden' (false) or the setting (true). */
  showLabel?: boolean;
  /** Defaults to the user's pictogramLabel setting. */
  labelPosition?: 'below' | 'above' | 'hidden';
  /** Text under the image (defaults to pictogram.word), e.g. the inflected word in a sentence. */
  label?: string;
  /** Fitzgerald-key edge. Defaults to pictogram.category when it is a color key. null = neutral. */
  color?: CategoryColor | null;
  disabled?: boolean;
  /** Small corner adornment (e.g. a personal-pictogram mark). */
  adornment?: ReactNode;
  className?: string;
}

type ImgState = 'loading' | 'loaded' | 'error';

/**
 * A pictogram card: white card (ARASAAC art has white backgrounds) framed by its category color,
 * label in the reading font. Interactive (button) when onPress/onLongPress is set.
 */
export function PictoTile({
  pictogram,
  size,
  selected: selectedProp,
  onPress,
  onLongPress,
  showLabel,
  labelPosition,
  label,
  color,
  disabled,
  adornment,
  className,
}: PictoTileProps) {
  const prefs = useA11yPrefs();
  const selected = selectedProp ?? false;
  const [img, setImg] = useState<{ url: string; state: ImgState }>({ url: pictogram.url, state: 'loading' });
  // Reset when the pictogram changes (state keyed by url, no effect needed).
  const imgState: ImgState = !pictogram.url ? 'error' : img.url === pictogram.url ? img.state : 'loading';
  const setState = (state: ImgState) => setImg({ url: pictogram.url, state });

  const longPress = useLongPress(onLongPress && !disabled ? () => onLongPress(pictogram) : undefined);

  const step = size ?? prefs.pictogramSize;
  const position = showLabel === false ? 'hidden' : (labelPosition ?? prefs.pictogramLabel);
  const text = label ?? pictogram.word;
  const edge =
    color === null || !prefs.categoryColors
      ? null
      : (color ?? (CATEGORY_COLORS.includes(pictogram.category as CategoryColor) ? (pictogram.category as CategoryColor) : null));

  const style: StyleWithVars = {
    '--tile-img': `${PICTO_SIZES[step]}px`,
    // Longest word, so the CSS can shrink the label to fit instead of breaking mid-word.
    '--tile-word': Math.max(1, ...text.split(/\s+/).map((w) => [...w].length)),
    ...(edge ? { '--tile-edge': `var(--cat-${edge})` } : {}),
  };

  const visibleLabel = position !== 'hidden' || imgState === 'error';
  const labelEl = position !== 'hidden' && imgState !== 'error' && (
    <span className="pc-tile__label" aria-hidden="true">
      {text}
    </span>
  );

  const body = (
    <>
      {position === 'above' && labelEl}
      <span className="pc-tile__art">
        {imgState === 'loading' && <span className="pc-tile__skeleton" aria-hidden="true" />}
        {imgState === 'error' ? (
          <span className="pc-tile__word" aria-hidden="true">
            {text}
          </span>
        ) : (
          <img
            key={pictogram.url}
            src={pictogram.url}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className={cx('pc-tile__img', imgState === 'loaded' && 'is-loaded')}
            onLoad={() => setState('loaded')}
            onError={() => setState('error')}
          />
        )}
      </span>
      {position === 'below' && labelEl}
      {selected && (
        <span className="pc-tile__check" aria-hidden="true">
          <CheckOutlined />
        </span>
      )}
      {adornment && <span className="pc-tile__adornment">{adornment}</span>}
    </>
  );

  const classes = cx(
    'pc-tile',
    `pc-tile--${step}`,
    edge && 'has-edge',
    selected && 'is-selected',
    !visibleLabel && 'no-label',
    className,
  );

  if (!onPress && !onLongPress) {
    return (
      <motion.span
        role="img"
        aria-label={text}
        className={classes}
        style={style}
        animate={{ scale: selected ? 1.04 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      >
        {body}
      </motion.span>
    );
  }

  return (
    <motion.button
      type="button"
      className={classes}
      style={style}
      disabled={disabled}
      aria-label={text}
      aria-pressed={selectedProp}
      onPointerDown={longPress.onPointerDown}
      onPointerUp={longPress.onPointerUp}
      onPointerLeave={longPress.onPointerLeave}
      onPointerCancel={longPress.onPointerCancel}
      onPointerMove={longPress.onPointerMove}
      onContextMenu={longPress.onContextMenu}
      onClick={longPress.guardClick((_e: MouseEvent) => onPress?.(pictogram))}
      animate={{ scale: selected ? 1.04 : 1 }}
      whileTap={disabled ? undefined : { scale: 0.93 }}
      transition={{ type: 'spring', stiffness: 520, damping: 24 }}
    >
      {body}
    </motion.button>
  );
}
