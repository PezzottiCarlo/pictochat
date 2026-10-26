import { ClockCircleOutlined, LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import type { Pictogram, SizeStep } from '@/core/types';
import { useSettings } from '@/stores/settings';
import { PICTO_SIZES } from '@/theme';
import { PictoTile, cx, type StyleWithVars } from '@/components/ui';
import { GUIDE_STEPS, STEP_CATEGORY, STEP_LABEL, type GuideStep } from '../lib/guide';
import { OBJECT_CATEGORIES, usePalette, type PaletteView } from '../hooks/usePalette';
import { categoryColorOf } from '@/services/aac';

export type PickerView = { kind: 'step'; step: GuideStep } | { kind: 'recent' } | { kind: 'search' };

export interface PictoPickerProps {
  view: PickerView;
  objectCategory: string;
  /** Last chosen verb: narrows the "Cosa?" lists ("mangiare" → foods). */
  verb?: string;
  query: string;
  recents: Pictogram[];
  size: SizeStep;
  showSearch: boolean;
  onView: (view: PickerView) => void;
  onObjectCategory: (id: string) => void;
  onQuery: (query: string) => void;
  onPick: (pictogram: Pictogram) => void;
  onLongPress: (pictogram: Pictogram) => void;
}

function paletteView(view: PickerView, objectCategory: string, verb: string | undefined, query: string): PaletteView {
  if (view.kind === 'recent') return { kind: 'recent' };
  if (view.kind === 'search') return { kind: 'search', query };
  if (view.step === 'cosa') return { kind: 'category', id: objectCategory, verb };
  return { kind: 'category', id: STEP_CATEGORY[view.step] };
}

function emptyText(view: PickerView, query: string): string {
  if (view.kind === 'recent') return 'Qui trovi i pittogrammi che usi di più.';
  if (view.kind === 'search') return query.trim() ? 'Nessun pittogramma trovato.' : 'Scrivi una parola da cercare.';
  return 'Nessun pittogramma in questa categoria.';
}

/** Guided steps, categories, search and the pictogram grid of the composer. */
export function PictoPicker(props: PictoPickerProps) {
  const {
    view,
    objectCategory,
    verb,
    query,
    recents,
    size,
    showSearch,
    onView,
    onObjectCategory,
    onQuery,
    onPick,
    onLongPress,
  } = props;
  const categoryColors = useSettings((s) => s.categoryColors);
  const { items, loading } = usePalette(paletteView(view, objectCategory, verb, query), recents);
  const gridStyle: StyleWithVars = { '--grid-img': `${PICTO_SIZES[size]}px` };

  return (
    <div className="ch-picker">
      <div className="ch-picker__tabs" role="toolbar" aria-label="Scegli i pittogrammi">
        {GUIDE_STEPS.map((step, i) => (
          <button
            key={step}
            type="button"
            className={cx('ch-step', view.kind === 'step' && view.step === step && 'is-active')}
            aria-pressed={view.kind === 'step' && view.step === step}
            data-step={step}
            onClick={() => onView({ kind: 'step', step })}
          >
            <span className="ch-step__n" aria-hidden="true">
              {i + 1}
            </span>
            {STEP_LABEL[step]}
          </button>
        ))}
        <button
          type="button"
          className={cx('ch-step ch-step--aux', view.kind === 'recent' && 'is-active')}
          aria-pressed={view.kind === 'recent'}
          onClick={() => onView({ kind: 'recent' })}
        >
          <ClockCircleOutlined aria-hidden="true" /> Recenti
        </button>
        {showSearch && (
          <button
            type="button"
            className={cx('ch-step ch-step--aux', view.kind === 'search' && 'is-active')}
            aria-pressed={view.kind === 'search'}
            onClick={() => onView({ kind: 'search' })}
          >
            <SearchOutlined aria-hidden="true" /> Cerca
          </button>
        )}
      </div>

      {view.kind === 'step' && view.step === 'cosa' && (
        <div className="ch-picker__cats" role="group" aria-label="Categoria">
          {OBJECT_CATEGORIES.map((c) => {
            const style: StyleWithVars | undefined = categoryColors
              ? { '--chip-edge': `var(--cat-${c.color})` }
              : undefined;
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === objectCategory}
                className={cx('ch-cat', c.id === objectCategory && 'is-active')}
                style={style}
                onClick={() => onObjectCategory(c.id)}
              >
                <span aria-hidden="true">{c.icon}</span> {c.label}
              </button>
            );
          })}
        </div>
      )}

      {view.kind === 'search' && (
        <label className="ch-search">
          <SearchOutlined aria-hidden="true" />
          <span className="pc-visually-hidden">Cerca un pittogramma</span>
          <input
            type="search"
            value={query}
            placeholder="Cerca una parola"
            autoFocus
            enterKeyHint="search"
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
      )}

      <div className="ch-grid" style={gridStyle} aria-busy={loading}>
        {loading && !items.length ? (
          <p className="ch-grid__note">
            <LoadingOutlined aria-hidden="true" /> Carico i pittogrammi
          </p>
        ) : !items.length ? (
          <p className="ch-grid__note">{emptyText(view, query)}</p>
        ) : (
          items.map((p) => (
            <PictoTile
              key={p.id}
              pictogram={p}
              size={size}
              color={categoryColorOf(p.category)}
              onPress={onPick}
              onLongPress={onLongPress}
            />
          ))
        )}
      </div>
    </div>
  );
}
