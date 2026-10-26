import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from './utils';
import './IconButton.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  icon: ReactNode;
  /** Required: icon-only buttons need a spoken name. Also used as tooltip. */
  'aria-label': string;
  /** plain: no fill · tinted: soft accent · filled: solid accent · glass: tinted glass · danger: soft red. */
  variant?: 'plain' | 'tinted' | 'filled' | 'glass' | 'danger';
  /** md = --tap-min; lg = 1.25× (primary actions like "send"). */
  size?: 'md' | 'lg';
  /** Number (≥1 shows a count, capped at 99+) or true for a dot. */
  badge?: number | boolean;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  icon,
  variant = 'plain',
  size = 'md',
  badge,
  className,
  type = 'button',
  title,
  ...rest
}: IconButtonProps) {
  const showBadge = badge === true || (typeof badge === 'number' && badge > 0);
  return (
    <button
      {...rest}
      type={type}
      title={title ?? rest['aria-label']}
      className={cx(
        'pc-icon-btn',
        `pc-icon-btn--${variant}`,
        `pc-icon-btn--${size}`,
        variant === 'glass' && 'pc-glass-accent',
        className,
      )}
    >
      <span className="pc-icon-btn__icon" aria-hidden="true">
        {icon}
      </span>
      {showBadge && (
        <span className={cx('pc-icon-btn__badge', badge === true && 'pc-icon-btn__badge--dot')} aria-hidden="true">
          {typeof badge === 'number' ? (badge > 99 ? '99+' : badge) : null}
        </span>
      )}
    </button>
  );
}
