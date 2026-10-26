import type { Settings } from '@/core/types';
import { FONT_SCALE_RANGE, TAP_SIZES } from '@/theme';
import { useSettings } from '@/stores/settings';
import { ChoiceRow, SettingsGroup, SliderRow, ToggleRow } from '../components/controls';
import { LivePreview } from '../components/LivePreview';

const SAMPLE = 'Oggi pomeriggio andiamo al parco con la nonna.';

function TextSample() {
  return (
    <p className="st-sample" aria-hidden="true">
      {SAMPLE}
    </p>
  );
}

export function ReadingSection() {
  const s = useSettings();
  const touchOptions: { value: Settings['touchSize']; label: string }[] = [
    { value: 'comfortable', label: 'Normali' },
    { value: 'large', label: 'Grandi' },
    { value: 'xl', label: 'Molto grandi' },
  ];

  return (
    <>
      <LivePreview />

      <SettingsGroup title="Testo">
        <SliderRow
          label="Grandezza del testo"
          value={s.fontScale}
          min={FONT_SCALE_RANGE.min}
          max={FONT_SCALE_RANGE.max}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          minLabel={<span className="st-step__a st-step__a--sm">A</span>}
          maxLabel={<span className="st-step__a st-step__a--lg">A</span>}
          onChange={(v) => s.set('fontScale', v)}
        />
        <TextSample />
        <ToggleRow
          label="Stampatello"
          description="Tutte le scritte in MAIUSCOLO, più facili da riconoscere."
          checked={s.uppercase}
          onChange={(v) => s.set('uppercase', v)}
        />
        <ToggleRow
          label="Carattere per dislessia"
          description="Lettere più pesanti in basso, che non si confondono."
          checked={s.dyslexicFont}
          onChange={(v) => s.set('dyslexicFont', v)}
        />
        <ToggleRow
          label="Testo in grassetto"
          description="Scritte più spesse e scure."
          checked={s.boldText}
          onChange={(v) => s.set('boldText', v)}
        />
      </SettingsGroup>

      <SettingsGroup title="Spazi">
        <ChoiceRow<Settings['letterSpacing']>
          label="Spazio tra le lettere"
          value={s.letterSpacing}
          onChange={(v) => s.set('letterSpacing', v)}
          options={[
            { value: 'normal', label: 'Normale' },
            { value: 'wide', label: 'Ampio' },
            { value: 'wider', label: 'Molto ampio' },
          ]}
        />
        <ChoiceRow<Settings['lineHeight']>
          label="Spazio tra le righe"
          value={s.lineHeight}
          onChange={(v) => s.set('lineHeight', v)}
          options={[
            { value: 'normal', label: 'Normale' },
            { value: 'relaxed', label: 'Ampio' },
            { value: 'loose', label: 'Molto ampio' },
          ]}
        />
        <TextSample />
      </SettingsGroup>

      <SettingsGroup title="Pulsanti" description="Pulsanti più grandi sono più facili da toccare se le dita tremano o scivolano.">
        <ChoiceRow<Settings['touchSize']>
          label="Grandezza dei pulsanti"
          value={s.touchSize}
          onChange={(v) => s.set('touchSize', v)}
          options={touchOptions}
        />
        <div className="st-touch-demo" aria-hidden="true">
          {touchOptions.map((o) => (
            <span
              key={o.value}
              className={o.value === s.touchSize ? 'st-touch-demo__key is-on' : 'st-touch-demo__key'}
              style={{ width: TAP_SIZES[o.value], height: TAP_SIZES[o.value] }}
            >
              👍
            </span>
          ))}
        </div>
      </SettingsGroup>
    </>
  );
}
