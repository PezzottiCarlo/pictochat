import { useId, type ReactNode } from 'react';
import { Switch } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { cx } from '@/components/ui';

/** A labelled block: title, optional help text, then the control on its own line. */
export function Field({ label, help, children }: { label: ReactNode; help?: ReactNode; children: ReactNode }) {
  const id = useId();
  return (
    <div className="ob-field" role="group" aria-labelledby={`${id}-l`}>
      <div className="ob-field__label" id={`${id}-l`}>
        {label}
      </div>
      {help && <p className="ob-field__help">{help}</p>}
      <div className="ob-field__control">{children}</div>
    </div>
  );
}

export interface ToggleRowProps {
  label: ReactNode;
  help?: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
}

/** A whole-row switch: text wraps freely, the switch never shrinks. */
export function ToggleRow({ label, help, checked, onChange, icon }: ToggleRowProps) {
  const id = useId();
  return (
    <div className="ob-toggle">
      {icon && (
        <span className="ob-toggle__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <label className="ob-toggle__text" htmlFor={id}>
        <span className="ob-toggle__label">{label}</span>
        {help && <span className="ob-toggle__help">{help}</span>}
      </label>
      <Switch id={id} className="ob-toggle__switch" checked={checked} onChange={onChange} />
    </div>
  );
}

export interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  media?: ReactNode;
  /** Media on its own row above the text (wide illustrations). */
  stacked?: boolean;
  className?: string;
}

/** Large toggle card for exclusive choices (role, voice…). Use inside a role="group". */
export function ChoiceCard({ selected, onSelect, title, description, media, stacked, className }: ChoiceCardProps) {
  return (
    <button type="button" className={cx('ob-choice', stacked && 'ob-choice--stacked', className)} aria-pressed={selected} onClick={onSelect}>
      {media && <span className="ob-choice__media">{media}</span>}
      <span className="ob-choice__text">
        <span className="ob-choice__title">{title}</span>
        {description && <span className="ob-choice__desc">{description}</span>}
      </span>
      <span className="ob-choice__check" aria-hidden="true">
        {selected && <CheckOutlined />}
      </span>
    </button>
  );
}

export interface SwatchOption<T extends string> {
  value: T;
  label: string;
  /** CSS colour of the dot (data colour like a skin tone, or a preset accent). */
  color: string;
}

/** Row of colour dots with spoken names; the selected one gets a ring and a check. */
export function SwatchPicker<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  showLabels = true,
}: {
  options: SwatchOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  'aria-label': string;
  showLabels?: boolean;
}) {
  return (
    <div className="ob-swatches" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className="ob-swatch"
          aria-pressed={value === o.value}
          aria-label={showLabels ? undefined : o.label}
          title={o.label}
          onClick={() => onChange(o.value)}
        >
          <span className="ob-swatch__dot" style={{ background: o.color }} aria-hidden="true">
            {value === o.value && <CheckOutlined />}
          </span>
          {showLabels && <span className="ob-swatch__label">{o.label}</span>}
        </button>
      ))}
    </div>
  );
}

/** Short list of benefits/effects with a leading icon or pictogram. */
export function PointList({ items }: { items: { icon: ReactNode; text: ReactNode }[] }) {
  return (
    <ul className="ob-points">
      {items.map((item, i) => (
        <li key={i} className="ob-points__item">
          <span className="ob-points__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="ob-points__text">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}
