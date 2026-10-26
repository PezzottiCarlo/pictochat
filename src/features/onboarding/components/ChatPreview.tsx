import type { ReactNode } from 'react';
import { PictoStrip, cx } from '@/components/ui';
import { usePictogramTokens, tokenColor } from '@/services/aac';
import { useSettings } from '@/stores/settings';

export interface BubbleProps {
  text: string;
  out?: boolean;
  /** Show the pictogram translation under the text (incoming messages). */
  pictograms?: boolean;
  /** Small caption under the bubble, e.g. a time. */
  meta?: ReactNode;
  className?: string;
}

/** A chat bubble as the real chat draws it (bubble colours + pictogram strip). */
export function Bubble({ text, out = false, pictograms = false, meta, className }: BubbleProps) {
  const tokens = usePictogramTokens(pictograms ? text : undefined);
  return (
    <div className={cx('ob-bubble', out ? 'ob-bubble--out' : 'ob-bubble--in', className)}>
      <p className="ob-bubble__text">{text}</p>
      {pictograms && tokens && tokens.length > 0 && (
        <PictoStrip tokens={tokens} wrap colorOf={tokenColor} className="ob-bubble__strip" aria-label={`Pittogrammi: ${text}`} />
      )}
      {meta && <span className="ob-bubble__meta">{meta}</span>}
    </div>
  );
}

/** Static two-message conversation used as a live preview of reading settings. */
export function ChatPreview({ caption }: { caption?: ReactNode }) {
  const showPictograms = useSettings((s) => s.showPictograms);
  return (
    <figure className="ob-preview" aria-label="Anteprima di una chat">
      <div className="ob-preview__chat">
        <Bubble text="Ciao! Andiamo al parco oggi?" pictograms={showPictograms} meta="Mamma · 16:02" />
        <Bubble text="Sì, andiamo!" out meta="16:03" />
      </div>
      {caption && <figcaption className="ob-preview__caption">{caption}</figcaption>}
    </figure>
  );
}
