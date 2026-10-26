import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined, SoundOutlined } from '@ant-design/icons';
import type { Pictogram } from '@/core/types';
import { EmptyState } from '@/components/ui';
import { CATEGORIES, speak } from '@/services/aac';
import { CategoryChips, SearchField, TileGrid } from './bits';
import { useArasaacSearch, useCategoryPictograms } from './useArasaacSearch';

/** Browse ARASAAC by composer category; tap to hear, then add it to your own pictograms. */
export function LibraryView({ onAdd }: { onAdd: (p: Pictogram) => void }) {
  const [category, setCategory] = useState<string>(CATEGORIES[0].id);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Pictogram | null>(null);
  const searching = query.trim().length > 0;
  const search = useArasaacSearch(query);
  const browse = useCategoryPictograms(category);
  const items = searching ? search.results : browse.items;
  const loading = searching ? search.loading : browse.loading;

  const press = (p: Pictogram) => {
    setSelected(p);
    void speak(p.word);
  };

  return (
    <div className="pg-stack">
      <SearchField value={query} onChange={setQuery} placeholder="Cerca nella libreria" loading={search.loading} />
      {!searching && (
        <CategoryChips
          label="Categoria"
          value={category}
          scroll
          onChange={(id) => {
            setCategory(id);
            setSelected(null);
          }}
        />
      )}
      <p className="pg-hint">Tocca un pittogramma per sentire la parola.</p>

      {loading && items.length === 0 ? (
        <p className="pg-hint" role="status">
          Carico i pittogrammi…
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="🔍"
          title={searching ? `Nessun pittogramma per «${query.trim()}»` : 'Nessun pittogramma qui'}
          description={searching ? 'Prova con un’altra parola, più semplice.' : undefined}
        />
      ) : (
        <TileGrid
          items={items}
          onPress={press}
          onLongPress={(p) => {
            setSelected(p);
            onAdd(p);
          }}
          selectedId={selected?.id ?? null}
          label={searching ? 'Risultati della ricerca' : `Pittogrammi: ${CATEGORIES.find((c) => c.id === category)?.label}`}
        />
      )}

      {selected && (
        <div className="pg-dock" role="region" aria-label="Pittogramma scelto">
          <span className="pg-dock__word">{selected.word}</span>
          <span className="pg-dock__actions">
            <Button size="large" icon={<SoundOutlined />} onClick={() => void speak(selected.word)}>
              Ascolta
            </Button>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => onAdd(selected)}>
              Aggiungi ai miei
            </Button>
          </span>
        </div>
      )}
    </div>
  );
}
