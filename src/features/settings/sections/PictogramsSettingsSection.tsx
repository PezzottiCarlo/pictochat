import { CheckOutlined } from '@ant-design/icons';
import type { HairColor, Pictogram, Settings, SizeStep, SkinColor } from '@/core/types';
import { PictoTile, type StyleWithVars } from '@/components/ui';
import { HAIR_HEX, SKIN_HEX, arasaacImageUrl, speak } from '@/services/aac';
import { useSettings } from '@/stores/settings';
import { ChoiceRow, Row, SettingsGroup, ToggleRow } from '../components/controls';
import { LivePreview } from '../components/LivePreview';

const SKINS: { value: SkinColor; label: string }[] = [
  { value: 'white', label: 'Molto chiara' },
  { value: 'asian', label: 'Chiara dorata' },
  { value: 'mulatto', label: 'Ambrata' },
  { value: 'aztec', label: 'Media' },
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

/** ARASAAC people pictograms that have both skin and hair: they show the appearance. */
const PEOPLE: { id: number; word: string }[] = [
  { id: 10206, word: 'ragazza' },
  { id: 7176, word: 'bambino' },
  { id: 2458, word: 'mamma' },
  { id: 31146, word: 'papà' },
];

function ColorPicker<T extends string>({
  label,
  options,
  value,
  hex,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  hex: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <Row>
      <span className="st-row__label">{label}</span>
      <div className="st-swatches" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="st-swatch st-swatch--named"
            aria-pressed={value === o.value}
            style={{ '--swatch': `#${hex[o.value]}` } as StyleWithVars}
            onClick={() => onChange(o.value)}
          >
            <span className="st-swatch__dot" aria-hidden="true">
              {value === o.value && <CheckOutlined />}
            </span>
            <span className="st-swatch__name">{o.label}</span>
          </button>
        ))}
      </div>
    </Row>
  );
}

export function PictogramsSettingsSection() {
  const s = useSettings();
  const people: Pictogram[] = PEOPLE.map((p) => ({
    id: String(p.id),
    word: p.word,
    url: arasaacImageUrl(p.id, { skin: true, hair: true }, s.appearance, 300),
    source: 'arasaac',
    category: 'persone',
  }));

  return (
    <>
      <SettingsGroup title="Le persone nei pittogrammi" description="Scegli pelle e capelli: i pittogrammi delle persone cambiano subito.">
        <div className="st-people" aria-live="polite">
          {people.map((p) => (
            <PictoTile key={p.id} pictogram={p} size="sm" onPress={() => void speak(p.word)} />
          ))}
        </div>
        <ColorPicker<SkinColor>
          label="Colore della pelle"
          options={SKINS}
          value={s.appearance.skin}
          hex={SKIN_HEX}
          onChange={(skin) => s.set('appearance', { ...s.appearance, skin })}
        />
        <ColorPicker<HairColor>
          label="Colore dei capelli"
          options={HAIRS}
          value={s.appearance.hair}
          hex={HAIR_HEX}
          onChange={(hair) => s.set('appearance', { ...s.appearance, hair })}
        />
      </SettingsGroup>

      <SettingsGroup title="Come appaiono">
        <LivePreview pictograms stripSize={null} />
        <ChoiceRow<SizeStep>
          label="Grandezza dei pittogrammi"
          value={s.pictogramSize}
          onChange={(v) => s.set('pictogramSize', v)}
          options={[
            { value: 'sm', label: 'Piccoli' },
            { value: 'md', label: 'Medi' },
            { value: 'lg', label: 'Grandi' },
            { value: 'xl', label: 'Enormi' },
          ]}
        />
        <ChoiceRow<Settings['pictogramLabel']>
          label="Posizione della parola"
          value={s.pictogramLabel}
          onChange={(v) => s.set('pictogramLabel', v)}
          options={[
            { value: 'above', label: 'Sopra' },
            { value: 'below', label: 'Sotto' },
            { value: 'hidden', label: 'Nascosta' },
          ]}
        />
        <ToggleRow
          label="Colori delle categorie"
          description="Un bordo colorato dice che tipo di parola è: persone, azioni, cose, emozioni…"
          checked={s.categoryColors}
          onChange={(v) => s.set('categoryColors', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Quando li usi">
        <ToggleRow
          label="Pittogrammi sotto i messaggi"
          description="Ogni messaggio scritto viene mostrato anche con le immagini."
          checked={s.showPictograms}
          onChange={(v) => s.set('showPictograms', v)}
        />
        <ToggleRow
          label="Leggi la parola quando tocchi"
          description="Toccando un pittogramma per scrivere, la voce dice la parola."
          checked={s.speakOnTap}
          onChange={(v) => s.set('speakOnTap', v)}
        />
      </SettingsGroup>
    </>
  );
}
