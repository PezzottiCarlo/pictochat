import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cx } from './utils';
import './Segmented.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Spoken name when the label is not plain text. */
  'aria-label'?: string;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Required: what is being chosen (e.g. "Dimensione testo"). */
  'aria-label': string;
  /** Stretch to the full width, options share it equally. */
  block?: boolean;
  /** Icon above the label (picker-style) instead of beside it. */
  stacked?: boolean;
  className?: string;
}

/** Large segmented control (radio group): arrow keys move the choice, the pill springs to it. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  block = false,
  stacked = false,
  className,
}: SegmentedProps<T>) {
  const pillId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    let next: number;
    if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    else {
      const pos = enabled.indexOf(index);
      next = enabled[(pos + step! + enabled.length) % enabled.length];
    }
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx('pc-seg', block && 'pc-seg--block', stacked && 'pc-seg--stacked', className)}
    >
      {options.map((o, i) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={o['aria-label']}
            disabled={o.disabled}
            tabIndex={checked ? 0 : -1}
            className={cx('pc-seg__item', checked && 'is-checked')}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {checked && (
              <motion.span
                layoutId={pillId}
                className="pc-seg__pill"
                transition={{ type: 'spring', stiffness: 560, damping: 40 }}
              />
            )}
            {o.icon && (
              <span className="pc-seg__icon" aria-hidden="true">
                {o.icon}
              </span>
            )}
            <span className="pc-seg__label">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
