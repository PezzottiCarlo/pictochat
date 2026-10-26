import { Slider } from 'antd';
import { CheckOutlined, EyeOutlined } from '@ant-design/icons';
import { Segmented } from '@/components/ui';
import { ACCENT_PRESETS, SYSTEM_THEME, THEMES, getTheme, useThemeState } from '@/theme';
import { useSettings } from '@/stores/settings';
import { Field, SwatchPicker, ToggleRow } from '../components/controls';

const THEME_CARDS = [SYSTEM_THEME, ...THEMES];
const THEME_ACCENT = 'theme';

function MiniChat() {
  return (
    <>
      <span className="ob-mini-bubble ob-mini-bubble--in">Ciao!</span>
      <span className="ob-mini-bubble ob-mini-bubble--out">Ciao 👋</span>
    </>
  );
}

export function ThemeStep() {
  const s = useSettings();
  const { prefs, theme } = useThemeState();
  const selectedIsGlass = s.themeId !== 'system' && getTheme(s.themeId).glass;

  return (
    <>
      <div className="ob-themes" role="group" aria-label="Tema">
        {THEME_CARDS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="ob-theme"
            aria-pressed={s.themeId === t.id}
            onClick={() => s.set('themeId', t.id)}
          >
            {t.id === 'system' ? (
              <span className="ob-theme__preview ob-theme__preview--split" aria-hidden="true">
                <span data-theme-scope="light">
                  <MiniChat />
                </span>
                <span data-theme-scope="dark">
                  <MiniChat />
                </span>
              </span>
            ) : (
              <span className="ob-theme__preview" data-theme-scope={t.id} aria-hidden="true">
                <MiniChat />
              </span>
            )}
            <span className="ob-theme__name">
              {t.label}
              {s.themeId === t.id && <CheckOutlined aria-hidden="true" />}
            </span>
            <span className="ob-theme__desc">{t.description}</span>
          </button>
        ))}
      </div>

      <Field label="Colore principale" help="Il colore dei pulsanti e dei tuoi messaggi.">
        <SwatchPicker
          aria-label="Colore principale"
          showLabels={false}
          value={s.accentColor ?? THEME_ACCENT}
          onChange={(v) => s.set('accentColor', v === THEME_ACCENT ? null : v)}
          options={[
            { value: THEME_ACCENT, label: 'Colore del tema', color: theme.preview.accent },
            ...ACCENT_PRESETS.map((a) => ({ value: a.color, label: a.label, color: a.color })),
          ]}
        />
      </Field>

      {selectedIsGlass && !prefs.reducedTransparency && (
        <Field label="Effetto vetro" help="Quanto si vede attraverso le barre e i pannelli.">
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={s.glassIntensity}
            ariaLabelForHandle="Effetto vetro"
            onChange={(v) => s.set('glassIntensity', v)}
            tooltip={{ formatter: (v) => `${Math.round((v ?? 0) * 100)}%` }}
          />
        </Field>
      )}

      <Field label="Animazioni" help="Meno movimento aiuta chi si distrae o ha mal di testa.">
        <Segmented
          block
          aria-label="Animazioni"
          value={s.reduceMotion}
          onChange={(v) => s.set('reduceMotion', v)}
          options={[
            { value: 'system', label: 'Come il telefono' },
            { value: 'on', label: 'Poche' },
            { value: 'off', label: 'Tutte' },
          ]}
        />
      </Field>

      <ToggleRow
        icon={<EyeOutlined />}
        label="Niente trasparenze"
        help="Sfondi pieni al posto del vetro: il testo si legge meglio."
        checked={s.reduceTransparency === 'on'}
        onChange={(v) => s.set('reduceTransparency', v ? 'on' : 'system')}
      />
    </>
  );
}
