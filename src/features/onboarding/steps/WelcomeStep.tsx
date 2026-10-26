import { useState } from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { Surface } from '@/components/ui';
import { LiveSentence } from '../components/LiveSentence';
import { PointList } from '../components/controls';
import { SpeakButton } from '../components/SpeakButton';
import { usePictos } from '../components/picto';

const SENTENCES = ['Ciao! Andiamo al parco?', 'Ho fame, voglio la pizza.', 'Ti voglio bene!'];

export function WelcomeStep() {
  const [index, setIndex] = useState(0);
  const sentence = SENTENCES[index];
  const icons = usePictos(['leggere', 'scrivere', 'ascoltare']);
  const img = (i: number) =>
    icons ? <img className="ob-mini-picto" src={icons[i].url} alt="" /> : <span className="ob-mini-picto" />;

  return (
    <>
      <Surface className="ob-hero" padding={4} radius="xl" variant="inset">
        <LiveSentence text={sentence} />
        <div className="ob-row">
          <SpeakButton text={sentence} label="Ascolta la frase" />
          <Button size="large" icon={<ReloadOutlined />} onClick={() => setIndex((i) => (i + 1) % SENTENCES.length)}>
            Un’altra frase
          </Button>
        </div>
      </Surface>

      <PointList
        items={[
          { icon: img(0), text: 'Leggi i messaggi con i pittogrammi sotto le parole.' },
          { icon: img(1), text: 'Scrivi toccando le immagini, anche senza tastiera.' },
          { icon: img(2), text: 'Ascolta i messaggi con la voce del telefono.' },
        ]}
      />

      <p className="ob-note">
        Ci vogliono circa 5 minuti. Ogni scelta si vede subito, e puoi cambiarla quando vuoi nelle Impostazioni.
      </p>
    </>
  );
}
