import { cx, type StyleWithVars } from '@/components/ui';

/** Fitzgerald-key colours cycle along the track: the setup is "a sentence" being built. */
const SEGMENT_COLORS = ['person', 'verb', 'noun', 'adjective', 'social', 'place', 'time', 'misc'] as const;

export interface ProgressTrackProps {
  /** 0-based index of the current step. */
  current: number;
  total: number;
  /** Name of the current step, for the spoken value. */
  label: string;
}

export function ProgressTrack({ current, total, label }: ProgressTrackProps) {
  return (
    <div
      className="ob-track"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-valuetext={`Passo ${current + 1} di ${total}: ${label}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cx('ob-track__seg', i < current && 'is-done', i === current && 'is-current')}
          style={{ '--seg': `var(--cat-${SEGMENT_COLORS[i % SEGMENT_COLORS.length]})` } as StyleWithVars}
        />
      ))}
    </div>
  );
}
