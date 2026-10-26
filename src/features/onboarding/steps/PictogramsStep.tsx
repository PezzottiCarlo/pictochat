import { useState } from 'react';
import type { CategoryColor } from '@/theme';
import type { HairColor, SkinColor } from '@/core/types';
import { PictoStrip, PictoTile, Segmented, type StyleWithVars } from '@/components/ui';
import { HAIR_HEX, SKIN_HEX, usePictogramTokens, tokenColor } from '@/services/aac';
import { useSettings } from '@/stores/settings';
import { Field, SwatchPicker, ToggleRow } from '../components/controls';
import { usePictos } from '../components/picto';

const SKINS: { value: SkinColor; label: string }[] = [
  { value: 'white', label: 'Chiara' },
  { value: 'asian', label: 'Dorata' },
  { value: 'mulatto', label: 'Media' },
  { value: 'aztec', label: 'Ambrata' },
  { value: 'black', label: 'Scura' },
];

const HAIRS: { value: HairColor; label: string }[] = [
  { value: 'blonde', label: 'Biondi' },
  { value: 'red', label: 'Rossi' },
  { value: 'brown', label: 'Castani' },
  { value: 'darkBrown', label: 'Castano scuro' },
  { value: 'black', label: 'Neri' },
  { value: 'darkGray', label: 'Grigi' },
  { value: 'gray', label: 'Bianchi' },
];

/** Fitzgerald key, as the composer colours it. */
const KEY: { color: CategoryColor; label: string; example: string }[] = [
  { color: 'person', label: 'Persone', example: 'io, mamma' },
  { color: 'verb', label: 'Azioni', example: 'mangiare, andare' },
  { color: 'noun', label: 'Cose', example: 'pizza, palla' },
  { color: 'adjective', label: 'Come sto', example: 'contento, stanco' },
  { color: 'place', label: 'Luoghi', example: 'casa, parco' },
  { color: 'time', label: 'Tempo', example: 'oggi, dopo' },
  { color: 'social', label: 'Parole utili', example: 'ciao, grazie' },
];

const SAMPLE = 'Io voglio mangiare la pizza';

export function PictogramsStep() {
  const s = useSettings();
  const [who, setWho] = useState<'ragazza' | 'ragazzo'>('ragazza');
  const people = usePictos(['ragazza', 'ragazzo']);
  const person = people?.[who === 'ragazza' ? 0 : 1];
  const tokens = usePictogramTokens(SAMPLE);

  return (
    <>
      <div className="ob-person">
        <div className="ob-person__tile">{person && <PictoTile pictogram={person} size="xl" color={null} />}</div>
        <div className="ob-person__controls">
          <Segmented
            block
            aria-label="Anteprima"
            value={who}
            onChange={setWho}
            options={[
              { value: 'ragazza', label: 'Ragazza' },
              { value: 'ragazzo', label: 'Ragazzo' },
            ]}
          />
          <Field label="Colore della pelle">
            <SwatchPicker
              aria-label="Colore della pelle"
              value={s.appearance.skin}
              onChange={(skin) => s.set('appearance', { ...s.appearance, skin })}
              options={SKINS.map((o) => ({ ...o, color: `#${SKIN_HEX[o.value]}` }))}
            />
          </Field>
          <Field label="Colore dei capelli">
            <SwatchPicker
              aria-label="Colore dei capelli"
              value={s.appearance.hair}
              onChange={(hair) => s.set('appearance', { ...s.appearance, hair })}
              options={HAIRS.map((o) => ({ ...o, color: `#${HAIR_HEX[o.value]}` }))}
            />
          </Field>
        </div>
      </div>

      <Field label="Grandezza dei pittogrammi">
        <Segmented
          block
          aria-label="Grandezza dei pittogrammi"
          value={s.pictogramSize}
          onChange={(v) => s.set('pictogramSize', v)}
          options={[
            { value: 'sm', label: 'Piccoli' },
            { value: 'md', label: 'Medi' },
            { value: 'lg', label: 'Grandi' },
            { value: 'xl', label: 'Enormi' },
          ]}
        />
      </Field>

      <Field label="Parola del pittogramma">
        <Segmented
          block
          aria-label="Dove mettere la parola"
          value={s.pictogramLabel}
          onChange={(v) => s.set('pictogramLabel', v)}
          options={[
            { value: 'below', label: 'Sotto' },
            { value: 'above', label: 'Sopra' },
            { value: 'hidden', label: 'Nascosta' },
          ]}
        />
      </Field>

      <div className="ob-sample" aria-label="Anteprima dei pittogrammi">
        {tokens && <PictoStrip tokens={tokens} wrap colorOf={tokenColor} aria-label={`Esempio: ${SAMPLE}`} />}
      </div>

      <ToggleRow
        label="Colori delle categorie"
        help="Un bordo colorato dice che tipo di parola è. Si chiama chiave di Fitzgerald."
        checked={s.categoryColors}
        onChange={(v) => s.set('categoryColors', v)}
      />
      {s.categoryColors && (
        <ul className="ob-key" aria-label="Significato dei colori">
          {KEY.map((k) => (
            <li key={k.color} className="ob-key__item" style={{ '--key': `var(--cat-${k.color})` } as StyleWithVars}>
              <span className="ob-key__label">{k.label}</span>
              <span className="ob-key__example">{k.example}</span>
            </li>
          ))}
        </ul>
      )}

      <ToggleRow
        label="Pittogrammi sotto i messaggi"
        help="Ogni messaggio che arriva si legge anche con le immagini."
        checked={s.showPictograms}
        onChange={(v) => s.set('showPictograms', v)}
      />
    </>
  );
}
