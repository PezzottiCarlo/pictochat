import { useState } from 'react';
import type { PictogramToken } from '@/core/types';
import { speak, usePictogramTokens, categoryColorOf } from '@/services/aac';
import { useSettings } from '@/stores/settings';
import { PictoStrip } from '@/components/ui';
import { useChatUi } from '../context';
import { smallerSize } from '../lib/guide';

/** Longer translations start collapsed: a wall of pictograms is harder to read than the text. */
const COLLAPSE_OVER = 16;
/** Up to this many tiles wrap onto lines like text; longer ones scroll sideways. */
const WRAP_UP_TO = 12;

const colorOf = (t: PictogramToken) => categoryColorOf(t.pictogram?.category);

/** Pictogram translation under a message: tap speaks the word, long press enlarges it. */
export function BubblePictograms({ text }: { text: string }) {
  const tokens = usePictogramTokens(text);
  const size = useSettings((s) => s.pictogramSize);
  const { openPictogram } = useChatUi();
  const visible = tokens?.filter((t) => !t.skipped).length ?? 0;
  const [expanded, setExpanded] = useState(false);

  if (!tokens || visible === 0 || !tokens.some((t) => t.pictogram)) return null;
  if (visible > COLLAPSE_OVER && !expanded) {
    return (
      <button type="button" className="ch-bubble__more" onClick={() => setExpanded(true)}>
        Mostra i pittogrammi ({visible})
      </button>
    );
  }
  return (
    <PictoStrip
      className="ch-bubble__strip"
      tokens={tokens}
      size={smallerSize(size)}
      wrap={visible <= WRAP_UP_TO}
      colorOf={colorOf}
      onTokenPress={(t) => void speak(t.text)}
      onTokenLongPress={(t, i) =>
        openPictogram(
          t.pictogram ?? {
            id: `word:${i}`,
            word: t.text,
            url: '',
            source: 'personal',
          },
        )
      }
    />
  );
}
