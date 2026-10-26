/**
 * Accessible building blocks of the settings screens. Every row is a big touch target and
 * wraps freely at fontScale 1.8 + STAMPATELLO + wide spacing.
 */
import { useId, type ReactNode } from 'react';
import { RightOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { Segmented, cx, type SegmentedOption, type StyleWithVars } from '@/components/ui';
import '../settings.css';

/** A titled block of rows (one Surface-like card). */
export function SettingsGroup({
  title,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <section className={cx('st-group', className)} aria-labelledby={title ? id : undefined}>
      {title && (
        <h2 id={id} className="st-group__title">
          {title}
        </h2>
      )}
      {description && <p className="st-group__desc">{description}</p>}
      <div className="st-group__body">{children}</div>
    </section>
  );
}

/** On/off row: the whole row is the switch. */
export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
  disabled,
}: {
  label: ReactNode;
  description?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
  disabled?: boolean;
}) {
  const labelId = useId();
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      className="st-row st-row--toggle"
      onClick={() => onChange(!checked)}
    >
      {icon && (
        <span className="st-row__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="st-row__text">
        <span id={labelId} className="st-row__label">
          {label}
        </span>
        {description && (
          <span id={descId} className="st-row__desc">
            {description}
          </span>
        )}
      </span>
      <span className="st-toggle" aria-hidden="true">
        <span className="st-toggle__state">{checked ? 'Sì' : 'No'}</span>
        <span className={cx('st-switch', checked && 'is-on')}>
          <span className="st-switch__thumb" />
        </span>
      </span>
    </button>
  );
}

/** A label + description above a full-width segmented control. */
export function ChoiceRow<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  stacked,
}: {
  label: string;
  description?: ReactNode;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  stacked?: boolean;
}) {
  return (
    <div className="st-row st-row--stack">
      <span className="st-row__text">
        <span className="st-row__label">{label}</span>
        {description && <span className="st-row__desc">{description}</span>}
      </span>
      <Segmented aria-label={label} value={value} options={options} onChange={onChange} block stacked={stacked} />
    </div>
  );
}

/** Native range input (fully keyboard / screen-reader accessible) with −/+ steppers. */
export function SliderRow({
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  format,
  minLabel,
  maxLabel,
  disabled,
}: {
  label: string;
  description?: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Human value, also used as aria-valuetext. */
  format: (value: number) => string;
  minLabel?: ReactNode;
  maxLabel?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n / step) * step));
  const fix = (n: number) => Number(clamp(n).toFixed(3));
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cx('st-row st-row--stack', disabled && 'is-disabled')}>
      <span className="st-row__text st-row__text--split">
        <label htmlFor={id} className="st-row__label">
          {label}
        </label>
        <output htmlFor={id} className="st-row__value">
          {format(value)}
        </output>
      </span>
      {description && <span className="st-row__desc">{description}</span>}
      <div className="st-slider">
        <button
          type="button"
          className="st-step"
          aria-label={`${label}: meno`}
          disabled={disabled || value <= min}
          onClick={() => onChange(fix(value - step))}
        >
          {minLabel ?? '−'}
        </button>
        <input
          id={id}
          type="range"
          className="st-range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-valuetext={format(value)}
          style={{ '--fill': `${pct}%` } as StyleWithVars}
          onChange={(e) => onChange(fix(Number(e.target.value)))}
        />
        <button
          type="button"
          className="st-step"
          aria-label={`${label}: più`}
          disabled={disabled || value >= max}
          onClick={() => onChange(fix(value + step))}
        >
          {maxLabel ?? '+'}
        </button>
      </div>
    </div>
  );
}

/** Row that navigates somewhere (section list, links). */
export function NavRow({
  to,
  onClick,
  icon,
  tone,
  label,
  description,
  trailing,
}: {
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
  /** Fitzgerald-key tint of the icon chip (decorative). */
  tone?: string;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      {icon && (
        <span className="st-chip" aria-hidden="true" style={tone ? ({ '--chip': `var(--cat-${tone})` } as StyleWithVars) : undefined}>
          {icon}
        </span>
      )}
      <span className="st-row__text">
        <span className="st-row__label">{label}</span>
        {description && <span className="st-row__desc">{description}</span>}
      </span>
      {trailing}
      <RightOutlined className="st-row__chevron" aria-hidden="true" />
    </>
  );
  return to ? (
    <Link to={to} className="st-row st-row--nav" onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button type="button" className="st-row st-row--nav" onClick={onClick}>
      {content}
    </button>
  );
}

/** Plain row container for custom content. */
export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('st-row st-row--stack', className)}>{children}</div>;
}

/** Short explanatory note between groups. */
export function Note({ children, tone }: { children: ReactNode; tone?: 'warning' | 'info' }) {
  return <p className={cx('st-note', tone && `st-note--${tone}`)}>{children}</p>;
}
