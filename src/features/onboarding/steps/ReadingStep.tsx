import { Slider } from 'antd';
import { BoldOutlined, FontSizeOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { IconButton, Segmented } from '@/components/ui';
import { FONT_SCALE_RANGE } from '@/theme';
import { useSettings } from '@/stores/settings';
import { ChatPreview } from '../components/ChatPreview';
import { ChoiceCard, Field, ToggleRow } from '../components/controls';

const clampScale = (n: number) =>
  Math.round(Math.min(FONT_SCALE_RANGE.max, Math.max(FONT_SCALE_RANGE.min, n)) * 100) / 100;

export function ReadingStep() {
  const s = useSettings();
  const percent = Math.round(s.fontScale * 100);

  return (
    <>
      <ChatPreview caption="Guarda qui: la chat cambia mentre scegli." />

      <Field label={`Grandezza del testo: ${percent}%`}>
        <div className="ob-scale">
          <IconButton
            icon={<MinusOutlined />}
            aria-label="Testo più piccolo"
            variant="tinted"
            disabled={s.fontScale <= FONT_SCALE_RANGE.min}
            onClick={() => s.set('fontScale', clampScale(s.fontScale - 0.1))}
          />
          <Slider
            className="ob-scale__slider"
            min={FONT_SCALE_RANGE.min}
            max={FONT_SCALE_RANGE.max}
            step={0.05}
            value={s.fontScale}
            onChange={(v) => s.set('fontScale', clampScale(v))}
            tooltip={{ formatter: (v) => `${Math.round((v ?? 1) * 100)}%` }}
            ariaLabelForHandle="Grandezza del testo"
            ariaValueTextFormatterForHandle={(v) => `${Math.round((v ?? 1) * 100)} per cento`}
          />
          <IconButton
            icon={<PlusOutlined />}
            aria-label="Testo più grande"
            variant="tinted"
            disabled={s.fontScale >= FONT_SCALE_RANGE.max}
            onClick={() => s.set('fontScale', clampScale(s.fontScale + 0.1))}
          />
        </div>
      </Field>

      <Field label="Tipo di lettere">
        <div className="ob-stack" role="group" aria-label="Tipo di lettere">
          <ChoiceCard
            selected={!s.dyslexicFont}
            onSelect={() => s.set('dyslexicFont', false)}
            media={<span className="ob-font-sample ob-font-sample--atkinson">Aa</span>}
            title="Chiaro"
            description="Lettere facili da distinguere, come b e d."
          />
          <ChoiceCard
            selected={s.dyslexicFont}
            onSelect={() => s.set('dyslexicFont', true)}
            media={<span className="ob-font-sample ob-font-sample--dyslexic">Aa</span>}
            title="Per la dislessia"
            description="Lettere più pesanti in basso: non si girano."
          />
        </div>
      </Field>

      <ToggleRow
        icon={<FontSizeOutlined />}
        label="STAMPATELLO"
        help="Tutte le lettere maiuscole. Molti lo leggono meglio."
        checked={s.uppercase}
        onChange={(v) => s.set('uppercase', v)}
      />
      <ToggleRow
        icon={<BoldOutlined />}
        label="Testo in grassetto"
        help="Lettere più spesse e scure."
        checked={s.boldText}
        onChange={(v) => s.set('boldText', v)}
      />

      <Field label="Spazio tra le lettere">
        <Segmented
          block
          aria-label="Spazio tra le lettere"
          value={s.letterSpacing}
          onChange={(v) => s.set('letterSpacing', v)}
          options={[
            { value: 'normal', label: 'Normale' },
            { value: 'wide', label: 'Largo' },
            { value: 'wider', label: 'Più largo' },
          ]}
        />
      </Field>

      <Field label="Spazio tra le righe">
        <Segmented
          block
          aria-label="Spazio tra le righe"
          value={s.lineHeight}
          onChange={(v) => s.set('lineHeight', v)}
          options={[
            { value: 'normal', label: 'Stretto' },
            { value: 'relaxed', label: 'Comodo' },
            { value: 'loose', label: 'Largo' },
          ]}
        />
      </Field>

      <Field label="Grandezza dei pulsanti" help="Pulsanti più grandi sono più facili da toccare.">
        <Segmented
          block
          aria-label="Grandezza dei pulsanti"
          value={s.touchSize}
          onChange={(v) => s.set('touchSize', v)}
          options={[
            { value: 'comfortable', label: 'Normali' },
            { value: 'large', label: 'Grandi' },
            { value: 'xl', label: 'Enormi' },
          ]}
        />
      </Field>
    </>
  );
}
