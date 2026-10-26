import { useEffect, useState } from 'react';
import { Button, Slider } from 'antd';
import {
  BellOutlined,
  MessageOutlined,
  MobileOutlined,
  PlayCircleOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { Surface } from '@/components/ui';
import { isSpeechSupported, listItalianVoices, previewSpeak, type VoiceInfo } from '@/services/aac';
import { feedback } from '@/lib/feedback';
import { useSettings } from '@/stores/settings';
import { ChoiceCard, Field, ToggleRow } from '../components/controls';

const SAMPLE = 'Ciao! Questa è la mia voce. Ti piace?';
const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

function useItalianVoices() {
  const [voices, setVoices] = useState<VoiceInfo[] | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    listItalianVoices()
      .then((list) => alive && setVoices(list))
      .catch(() => alive && setVoices([]));
    return () => {
      alive = false;
    };
  }, []);
  return voices;
}

function VoicePicker() {
  const s = useSettings();
  const voices = useItalianVoices();
  const pick = (uri: string | null) => {
    s.set('voiceURI', uri);
    void previewSpeak(SAMPLE, { voiceURI: uri });
  };

  if (voices === undefined) return <p className="ob-note">Cerco le voci del telefono…</p>;

  return (
    <div className="ob-stack ob-voices" role="group" aria-label="Voce">
      <ChoiceCard
        selected={s.voiceURI === null}
        onSelect={() => pick(null)}
        media={<SoundOutlined />}
        title="Automatica"
        description="La voce italiana migliore di questo telefono."
      />
      {voices.slice(0, 6).map((v) => (
        <ChoiceCard
          key={v.uri}
          selected={s.voiceURI === v.uri}
          onSelect={() => pick(v.uri)}
          media={<SoundOutlined />}
          title={<span className="pc-keep-case">{v.name}</span>}
          description={v.quality === 'natural' ? 'Voce naturale' : 'Voce standard'}
        />
      ))}
      {voices.length === 0 && <p className="ob-note">Non ho trovato voci italiane: userò quella del telefono.</p>}
    </div>
  );
}

export function VoiceStep() {
  const s = useSettings();
  const supported = isSpeechSupported();

  return (
    <>
      {supported ? (
        <>
          <VoicePicker />

          <Field label="Velocità">
            <div className="ob-range">
              <span aria-hidden="true">Lenta</span>
              <Slider
                className="ob-range__slider"
                min={0.6}
                max={1.4}
                step={0.05}
                value={s.speechRate}
                ariaLabelForHandle="Velocità della voce"
                onChange={(v) => s.set('speechRate', v)}
                onChangeComplete={() => void previewSpeak(SAMPLE)}
                tooltip={{ open: false }}
              />
              <span aria-hidden="true">Veloce</span>
            </div>
          </Field>

          <Field label="Tono">
            <div className="ob-range">
              <span aria-hidden="true">Basso</span>
              <Slider
                className="ob-range__slider"
                min={0.6}
                max={1.4}
                step={0.05}
                value={s.speechPitch}
                ariaLabelForHandle="Tono della voce"
                onChange={(v) => s.set('speechPitch', v)}
                onChangeComplete={() => void previewSpeak(SAMPLE)}
                tooltip={{ open: false }}
              />
              <span aria-hidden="true">Alto</span>
            </div>
          </Field>

          <Button size="large" block icon={<PlayCircleOutlined />} onClick={() => void previewSpeak(SAMPLE)}>
            Prova la voce
          </Button>

          <ToggleRow
            icon={<MessageOutlined />}
            label="Leggi i messaggi che arrivano"
            help="Quando arriva un messaggio, il telefono lo legge ad alta voce."
            checked={s.autoSpeak}
            onChange={(v) => s.set('autoSpeak', v)}
          />
          <ToggleRow
            icon={<SoundOutlined />}
            label="Dì la parola quando tocco un pittogramma"
            checked={s.speakOnTap}
            onChange={(v) => s.set('speakOnTap', v)}
          />
        </>
      ) : (
        <Surface variant="inset" padding={4} radius="lg">
          <p>Questo browser non sa leggere ad alta voce. Prova con Chrome, Edge o Safari aggiornati.</p>
        </Surface>
      )}

      <ToggleRow
        icon={<BellOutlined />}
        label="Suoni"
        help="Un piccolo suono quando mandi o ricevi un messaggio."
        checked={s.sounds}
        onChange={(v) => {
          s.set('sounds', v);
          if (v) feedback('success');
        }}
      />
      {canVibrate && (
        <ToggleRow
          icon={<MobileOutlined />}
          label="Vibrazione"
          help="Il telefono vibra un poco quando tocchi."
          checked={s.haptics}
          onChange={(v) => {
            s.set('haptics', v);
            if (v) feedback('tap');
          }}
        />
      )}
    </>
  );
}
