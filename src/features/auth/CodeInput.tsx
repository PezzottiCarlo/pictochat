import { useState, type Ref } from 'react';
import { cx } from '@/components/ui';

export interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length: number;
  disabled?: boolean;
  invalid?: boolean;
  /** Spoken name (default "Codice di N cifre"). */
  label?: string;
  describedBy?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * One real numeric input (paste, SMS autofill, screen readers all work) drawn as
 * large separate boxes. The boxes are decoration; the input sits on top of them.
 */
export function CodeInput({ value, onChange, length, disabled, invalid, label, describedBy, ref }: CodeInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={cx('au-otp', invalid && 'is-invalid', disabled && 'is-disabled')}>
      <input
        ref={ref}
        className="au-otp__input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        disabled={disabled}
        aria-label={label ?? `Codice di ${length} cifre`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
      />
      <div className="au-otp__slots" aria-hidden="true">
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cx(
              'au-otp__slot',
              value[i] && 'is-filled',
              focused && (i === value.length || (i === length - 1 && value.length === length)) && 'is-active',
            )}
          >
            {value[i] ?? ''}
          </span>
        ))}
      </div>
    </div>
  );
}
