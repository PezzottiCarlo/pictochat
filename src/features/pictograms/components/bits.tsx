/** Small shared pieces of the pictogram screens. */
import { Input } from 'antd';
import { LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import type { Pictogram } from '@/core/types';
import { PictoTile, cx, type StyleWithVars } from '@/components/ui';
import { CATEGORIES } from '@/services/aac';
import '../pictograms.css';

export function SearchField({
  value,
  onChange,
  placeholder,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  loading?: boolean;
}) {
  return (
    <Input
      className="pg-search"
      size="large"
      allowClear
      prefix={<SearchOutlined aria-hidden="true" />}
      suffix={loading ? <LoadingOutlined aria-label="Cerco…" /> : undefined}
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="search"
      enterKeyHint="search"
    />
  );
}

/** Category chooser: big chips with the category icon and its Fitzgerald colour as an edge. */
export function CategoryChips({
  value,
  onChange,
  label,
  scroll,
}: {
  value: string | null;
  onChange: (id: string) => void;
  label: string;
  /** One scrolling row instead of wrapping. */
  scroll?: boolean;
}) {
  return (
    <div className={cx('pg-cats', scroll && 'pg-cats--scroll')} role="group" aria-label={label}>
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          className="pg-cat"
          aria-pressed={value === c.id}
          style={{ '--cat': `var(--cat-${c.color})` } as StyleWithVars}
          onClick={() => onChange(c.id)}
        >
          <span aria-hidden="true" className="pg-cat__icon">
            {c.icon}
          </span>
          {c.label}
        </button>
      ))}
    </div>
  );
}

/** Wrapping grid of pictogram tiles. */
export function TileGrid({
  items,
  onPress,
  onLongPress,
  selectedId,
  label,
}: {
  items: Pictogram[];
  onPress: (p: Pictogram) => void;
  onLongPress?: (p: Pictogram) => void;
  selectedId?: string | null;
  label: string;
}) {
  return (
    <ul className="pg-grid" aria-label={label}>
      {items.map((p) => (
        <li key={p.id}>
          <PictoTile
            pictogram={p}
            onPress={onPress}
            onLongPress={onLongPress}
            selected={selectedId === undefined ? undefined : selectedId === p.id}
          />
        </li>
      ))}
    </ul>
  );
}
