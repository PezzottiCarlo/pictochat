import { useEffect, useId, useState } from 'react';
import { Button, Input } from 'antd';
import { CheckOutlined, SoundOutlined } from '@ant-design/icons';
import { cx } from '@/components/ui';
import { isSpeechSupported, listItalianVoices, previewSpeak, type VoiceInfo } from '@/services/aac';
import { feedback } from '@/lib/feedback';
import { useSettings } from '@/stores/settings';
import { Note, Row, SettingsGroup, SliderRow, ToggleRow } from '../components/controls';

const DEFAULT_SAMPLE = 'Ciao! Questa è la mia voce.';

function useVoices(): VoiceInfo[] | null {
  const [voices, setVoices] = useState<VoiceInfo[] | null>(null);
  useEffect(() => {
    let alive = true;
    listItalianVoices()
      .then((v) => alive && setVoices(v))
      .catch(() => alive && setVoices([]));
    return () => {
      alive = false;
    };
  }, []);
  return voices;
}

/** "Microsoft Elsa Online (Natural) - Italian (Italy)" → "Elsa"; "Google italiano" stays. */
export function shortVoiceName(name: string): string {
  const cleaned = name
    .replace(/^Microsoft\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+-\s+.*$/, '')
    .replace(/\bOnline\b/i, '')
    .trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : name;
}

function VoicePicker({ sample }: { sample: string }) {
  const voices = useVoices();
  const voiceURI = useSettings((s) => s.voiceURI);
  const set = useSettings((s) => s.set);

  const choose = (uri: string | null) => {
    set('voiceURI', uri);
    void previewSpeak(sample, { voiceURI: uri });
  };

  if (voices === null) return <Note>Cerco le voci italiane…</Note>;
  return (
    <div className="st-voices" role="group" aria-label="Voce">
      <button type="button" className={cx('st-voice', voiceURI === null && 'is-on')} aria-pressed={voiceURI === null} onClick={() => choose(null)}>
        <span className="st-voice__name">Automatica</span>
        <span className="st-voice__desc">La voce italiana migliore di questo telefono</span>
        {voiceURI === null && <CheckOutlined className="st-voice__check" aria-hidden="true" />}
      </button>
      {voices.map((v) => (
        <button
          key={v.uri}
          type="button"
          className={cx('st-voice', voiceURI === v.uri && 'is-on')}
          aria-pressed={voiceURI === v.uri}
          onClick={() => choose(v.uri)}
        >
          <span className="st-voice__name">{shortVoiceName(v.name)}</span>
          <span className="st-voice__desc">{v.quality === 'natural' ? 'Voce naturale' : 'Voce standard'}</span>
          {voiceURI === v.uri && <CheckOutlined className="st-voice__check" aria-hidden="true" />}
        </button>
      ))}
      {voices.length === 0 && <Note>Su questo telefono non ci sono voci italiane: verrà usata quella predefinita.</Note>}
    </div>
  );
}

export function VoiceSection() {
  const s = useSettings();
  const [sample, setSample] = useState(DEFAULT_SAMPLE);
  const sampleId = useId();
  const supported = isSpeechSupported();
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return (
    <>
      <SettingsGroup title="Voce che legge">
        {!supported && <Note tone="warning">Questo browser non sa leggere ad alta voce. Prova con Chrome, Edge o Safari.</Note>}
        <Row>
          <label htmlFor={sampleId} className="st-row__label">
            Frase di prova
          </label>
          <div className="st-inline">
            <Input id={sampleId} size="large" value={sample} onChange={(e) => setSample(e.target.value)} />
            <Button
              type="primary"
              size="large"
              icon={<SoundOutlined />}
              disabled={!supported}
              onClick={() => void previewSpeak(sample || DEFAULT_SAMPLE)}
            >
              Ascolta
            </Button>
          </div>
        </Row>
        {supported && <VoicePicker sample={sample || DEFAULT_SAMPLE} />}
        <SliderRow
          label="Velocità"
          value={s.speechRate}
          min={0.6}
          max={1.4}
          step={0.05}
          format={(v) => (v < 0.85 ? 'Lenta' : v > 1.15 ? 'Veloce' : 'Normale') + ` (${Math.round(v * 100)}%)`}
          onChange={(v) => s.set('speechRate', v)}
          minLabel="🐢"
          maxLabel="🐇"
          disabled={!supported}
        />
        <SliderRow
          label="Tono"
          value={s.speechPitch}
          min={0.5}
          max={1.5}
          step={0.05}
          format={(v) => (v < 0.85 ? 'Grave' : v > 1.15 ? 'Acuto' : 'Normale') + ` (${Math.round(v * 100)}%)`}
          onChange={(v) => s.set('speechPitch', v)}
          disabled={!supported}
        />
        <ToggleRow
          label="Leggi i messaggi ad alta voce"
          description="Quando arriva un messaggio nella chat aperta, la voce lo legge."
          checked={s.autoSpeak}
          onChange={(v) => s.set('autoSpeak', v)}
          disabled={!supported}
        />
      </SettingsGroup>

      <SettingsGroup title="Suoni e vibrazione">
        <ToggleRow
          label="Suoni"
          description="Un piccolo suono quando invii o ricevi un messaggio."
          checked={s.sounds}
          onChange={(v) => {
            s.set('sounds', v);
            if (v) feedback('receive');
          }}
        />
        <ToggleRow
          label="Vibrazione"
          description={canVibrate ? 'Il telefono vibra un poco quando tocchi o invii.' : 'Questo telefono o browser non può vibrare.'}
          checked={s.haptics}
          onChange={(v) => {
            s.set('haptics', v);
            if (v) feedback('tap');
          }}
        />
      </SettingsGroup>
    </>
  );
}
