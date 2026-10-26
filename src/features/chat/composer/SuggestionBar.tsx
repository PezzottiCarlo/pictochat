import type { ReplySuggestion } from '@/core/types';
import { PictoTile } from '@/components/ui';
import { categoryColorOf } from '@/services/aac';

export interface SuggestionBarProps {
  suggestions: ReplySuggestion[];
  onPick: (suggestion: ReplySuggestion) => void;
}

/** Ready-made answers to the last incoming message, each with its pictograms. */
export function SuggestionBar({ suggestions, onPick }: SuggestionBarProps) {
  if (!suggestions.length) return null;
  return (
    <ul className="ch-suggest" aria-label="Risposte veloci">
      {suggestions.map((s) => (
        <li key={s.text}>
          <button type="button" className="ch-suggest__chip" onClick={() => onPick(s)}>
            {s.pictograms.length > 0 && (
              <span className="ch-suggest__pictos" aria-hidden="true">
                {s.pictograms.slice(0, 3).map((p) => (
                  <PictoTile
                    key={p.id}
                    pictogram={p}
                    size="sm"
                    labelPosition="hidden"
                    color={categoryColorOf(p.category)}
                  />
                ))}
              </span>
            )}
            <span className="ch-suggest__text">{s.text}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
