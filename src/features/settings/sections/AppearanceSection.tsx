import { useId } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { cx, type StyleWithVars } from '@/components/ui';
import { ACCENT_PRESETS, SYSTEM_THEME, THEMES, useResolvedTheme } from '@/theme';
import type { Settings } from '@/core/types';
import { useSettings } from '@/stores/settings';
import { ChoiceRow, Note, Row, SettingsGroup, SliderRow } from '../components/controls';
import { LivePreview } from '../components/LivePreview';

type Tri = Settings['reduceMotion'];
const TRI_OPTIONS: { value: Tri; label: string }[] = [
  { value: 'system', label: 'Come il telefono' },
  { value: 'on', label: 'Sì' },
  { value: 'off', label: 'No' },
];

/** Decorative two-bubble sample painted with another theme (data-theme-scope). */
function MiniTheme({ scope }: { scope: string }) {
  return (
    <span className="st-mini" data-theme-scope={scope} aria-hidden="true">
      <span className="st-mini__bubble st-mini__bubble--in">Ciao!</span>
      <span className="st-mini__bubble st-mini__bubble--out">Ciao 👋</span>
    </span>
  );
}

function ThemePicker() {
  const themeId = useSettings((s) => s.themeId);
  const set = useSettings((s) => s.set);
  return (
    <div className="st-themes" role="group" aria-label="Tema">
      {[SYSTEM_THEME, ...THEMES].map((t) => {
        const active = themeId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            className="st-theme"
            aria-pressed={active}
            onClick={() => set('themeId', t.id)}
          >
            {t.id === 'system' ? (
              <span className="st-theme__split">
                <MiniTheme scope="light" />
                <MiniTheme scope="dark" />
              </span>
            ) : (
              <MiniTheme scope={t.id} />
            )}
            <span className="st-theme__label">
              {active && <CheckOutlined aria-hidden="true" />} {t.label}
            </span>
            <span className="st-theme__desc">{t.description}</span>
          </button>
        );
      })}
    </div>
  );
}

function AccentPicker() {
  const accent = useSettings((s) => s.accentColor);
  const set = useSettings((s) => s.set);
  const customId = useId();
  const isCustom = accent !== null && !ACCENT_PRESETS.some((a) => a.color === accent);
  return (
    <Row>
      <span className="st-row__text">
        <span className="st-row__label">Colore principale</span>
        <span className="st-row__desc">Il colore di pulsanti, link e messaggi inviati.</span>
      </span>
      <div className="st-swatches" role="group" aria-label="Colore principale">
        <button
          type="button"
          className="st-swatch st-swatch--auto"
          aria-pressed={accent === null}
          onClick={() => set('accentColor', null)}
        >
          Del tema
        </button>
        {ACCENT_PRESETS.map((a) => (
          <button
            key={a.id}
            type="button"
            className="st-swatch"
            aria-pressed={accent === a.color}
            aria-label={a.label}
            title={a.label}
            style={{ '--swatch': a.color } as StyleWithVars}
            onClick={() => set('accentColor', a.color)}
          >
            {accent === a.color && <CheckOutlined aria-hidden="true" />}
          </button>
        ))}
        <label
          htmlFor={customId}
          className={cx('st-swatch st-swatch--custom', isCustom && 'is-on')}
          style={isCustom ? ({ '--swatch': accent } as StyleWithVars) : undefined}
        >
          <span className="pc-visually-hidden">Scegli un altro colore</span>
          <span aria-hidden="true">{isCustom ? <CheckOutlined /> : '+'}</span>
          <input
            id={customId}
            type="color"
            className="st-swatch__input"
            value={accent ?? '#1f5fd6'}
            onChange={(e) => set('accentColor', e.target.value)}
          />
        </label>
      </div>
    </Row>
  );
}

export function AppearanceSection() {
  const s = useSettings();
  const theme = useResolvedTheme();
  const glassTheme = theme.glass;

  return (
    <>
      <LivePreview />

      <SettingsGroup title="Tema" description="Tocca un tema per provarlo: l’app cambia subito.">
        <ThemePicker />
      </SettingsGroup>

      {glassTheme && (
        <SettingsGroup title="Vetro">
          <SliderRow
            label="Intensità del vetro"
            description="Più alta: più trasparente e luminoso. Più bassa: più facile da leggere."
            value={s.glassIntensity}
            min={0}
            max={1}
            step={0.1}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => s.set('glassIntensity', v)}
            disabled={s.reduceTransparency === 'on'}
          />
          {s.reduceTransparency === 'on' && <Note>La trasparenza è ridotta: il vetro appare pieno.</Note>}
        </SettingsGroup>
      )}

      <SettingsGroup title="Colore">
        <AccentPicker />
      </SettingsGroup>

      <SettingsGroup title="Comfort visivo">
        <ChoiceRow<Tri>
          label="Riduci il movimento"
          description="Toglie animazioni e scorrimenti che possono distrarre o dare fastidio."
          value={s.reduceMotion}
          options={TRI_OPTIONS}
          onChange={(v) => s.set('reduceMotion', v)}
        />
        <ChoiceRow<Tri>
          label="Riduci la trasparenza"
          description="Superfici piene al posto del vetro: il testo si legge meglio."
          value={s.reduceTransparency}
          options={TRI_OPTIONS}
          onChange={(v) => s.set('reduceTransparency', v)}
        />
      </SettingsGroup>
    </>
  );
}
