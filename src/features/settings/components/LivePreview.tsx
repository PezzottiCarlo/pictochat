import type { SizeStep } from '@/core/types';
import { PictoStrip, cx } from '@/components/ui';
import { usePictogramTokens, tokenColor } from '@/services/aac';
import { useSettings } from '@/stores/settings';

const INCOMING = 'Vieni a mangiare la pizza?';
const OUTGOING = 'Sì, arrivo!';

/** A tiny conversation rendered with the current settings, so every change is visible at once. */
export function LivePreview({
  pictograms,
  stripSize = 'sm',
  className,
}: {
  /** Force the pictogram strip on/off; defaults to settings.showPictograms. */
  pictograms?: boolean;
  /** Tile size of the strip; null = the user setting (pictogram settings preview). */
  stripSize?: SizeStep | null;
  className?: string;
}) {
  const showPictograms = useSettings((s) => s.showPictograms);
  const showTimestamps = useSettings((s) => s.showTimestamps);
  const tokens = usePictogramTokens(INCOMING);
  const strip = (pictograms ?? showPictograms) && tokens?.some((t) => t.pictogram);

  return (
    <figure
      className={cx('st-preview', className)}
      aria-label="Anteprima di una chat con le tue impostazioni"
    >
      <div className="st-bubble st-bubble--in">
        <span>{INCOMING}</span>
        {showTimestamps && <span className="st-bubble__time">12:30</span>}
        {strip && tokens && (
          <PictoStrip
            tokens={tokens.filter((t) => !t.skipped)}
            colorOf={tokenColor}
            size={stripSize ?? undefined}
            className="st-bubble__strip"
            aria-label="Messaggio in pittogrammi"
          />
        )}
      </div>
      <div className="st-bubble st-bubble--out">
        <span>{OUTGOING}</span>
        {showTimestamps && <span className="st-bubble__time">12:31</span>}
      </div>
    </figure>
  );
}
