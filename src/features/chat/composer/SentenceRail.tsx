import { CloseOutlined } from '@ant-design/icons';
import type { Pictogram, SizeStep } from '@/core/types';
import { PictoTile, type StyleWithVars } from '@/components/ui';
import { PICTO_SIZES } from '@/theme';
import { STEP_LABEL, pendingSteps, type GuideStep } from '../lib/guide';
import { categoryColorOf } from '@/services/aac';

export interface SentenceRailProps {
  parts: Pictogram[];
  size: SizeStep;
  /** Highlighted empty slot (the step the picker is showing). */
  activeStep?: GuideStep;
  onRemove: (index: number) => void;
  onStep: (step: GuideStep) => void;
}

/**
 * The sentence strip: chosen pictograms in order (tap to take one off) followed by the empty
 * "Chi? / Cosa fa? / Cosa?" slots still to fill, like velcro slots on a printed AAC strip.
 */
export function SentenceRail({ parts, size, activeStep, onRemove, onStep }: SentenceRailProps) {
  const pending = pendingSteps(parts.map((p) => p.category));
  const style: StyleWithVars = { '--rail-img': `${PICTO_SIZES[size]}px` };
  return (
    <ol className="ch-rail" aria-label="La tua frase" style={style}>
      {parts.map((p, i) => (
        <li key={`${i}:${p.id}`} className="ch-rail__item">
          <button type="button" className="ch-rail__tile" aria-label={`Togli ${p.word}`} onClick={() => onRemove(i)}>
            <PictoTile
              pictogram={p}
              size={size}
              color={categoryColorOf(p.category)}
              adornment={<CloseOutlined aria-hidden="true" />}
            />
          </button>
        </li>
      ))}
      {pending.map((step) => (
        <li key={step} className="ch-rail__item">
          <button
            type="button"
            className={`ch-slot${step === activeStep ? ' is-active' : ''}`}
            data-step={step}
            onClick={() => onStep(step)}
          >
            {STEP_LABEL[step]}
          </button>
        </li>
      ))}
    </ol>
  );
}
