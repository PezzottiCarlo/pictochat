import { HeartOutlined, LockOutlined } from '@ant-design/icons';
import { NavHeader, PageScaffold, Surface } from '@/components/ui';
import { MainTabBar } from '@/app/MainTabBar';
import { SpeakButton } from '@/features/onboarding/components/SpeakButton';
import { usePictos } from '@/features/onboarding/components/picto';
import { version } from '../../../package.json';
import { FAQ, GUIDE, PARENT_TIPS, type GuideSection } from './content';
import { RedoTutorial } from './RedoTutorial';
import './help.css';

function GuideCard({ section, image }: { section: GuideSection; image?: string }) {
  return (
    <Surface as="li" padding={4} radius="lg" className="hp-card">
      <span className="hp-card__picto" aria-hidden="true">
        {image && <img src={image} alt="" />}
      </span>
      <div className="hp-card__body">
        <div className="hp-card__head">
          <h3 className="hp-card__title">{section.title}</h3>
          <SpeakButton text={`${section.title}. ${section.text}`} label={`Ascolta: ${section.title}`} variant="plain" />
        </div>
        <p>{section.text}</p>
      </div>
    </Surface>
  );
}

/** /aiuto — how PictoChat works, FAQ, tips for parents, privacy and credits. */
export default function HelpPage() {
  const pictos = usePictos(GUIDE.map((g) => g.picto));

  return (
    <PageScaffold header={<NavHeader large title="Aiuto" />} footer={<MainTabBar active="help" />}>
      <div className="hp-page">
        <p className="hp-lead">
          Qui trovi come si usa PictoChat. Tocca l’altoparlante vicino a ogni parte per ascoltarla.
        </p>

        <section aria-labelledby="hp-guide">
          <h2 id="hp-guide" className="hp-h2">
            Come si usa
          </h2>
          <ul className="hp-cards">
            {GUIDE.map((g, i) => (
              <GuideCard key={g.id} section={g} image={pictos?.[i].url} />
            ))}
          </ul>
        </section>

        <RedoTutorial />

        <section aria-labelledby="hp-faq">
          <h2 id="hp-faq" className="hp-h2">
            Domande frequenti
          </h2>
          <div className="hp-faq">
            {FAQ.map((f) => (
              <details key={f.q} className="hp-faq__item">
                <summary className="hp-faq__q">{f.q}</summary>
                <div className="hp-faq__a">
                  <p>{f.a}</p>
                  <SpeakButton text={`${f.q} ${f.a}`} label="Ascolta la risposta" variant="plain" />
                </div>
              </details>
            ))}
          </div>
        </section>

        <section aria-labelledby="hp-parents">
          <h2 id="hp-parents" className="hp-h2">
            Consigli per i genitori
          </h2>
          <Surface padding={4} radius="lg">
            <ol className="hp-tips">
              {PARENT_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ol>
          </Surface>
        </section>

        <section aria-labelledby="hp-privacy">
          <h2 id="hp-privacy" className="hp-h2">
            <LockOutlined aria-hidden="true" /> La tua privacy
          </h2>
          <p>
            PictoChat non ha un server, non raccoglie dati e non ha pubblicità. Parla direttamente con Telegram, come
            l’app ufficiale. Impostazioni, pittogrammi personali e messaggi scaricati restano solo su questo telefono.
          </p>
        </section>

        <section aria-labelledby="hp-credits" className="hp-credits">
          <h2 id="hp-credits" className="hp-h2">
            <HeartOutlined aria-hidden="true" /> Chi ha fatto PictoChat
          </h2>
          <p>
            PictoChat è nata come tesi di Carlo Pezzotti alla SUPSI (Scuola universitaria professionale della Svizzera
            italiana), per aiutare genitori e ragazzi a parlarsi di più.
          </p>
          <p>
            I pittogrammi sono di{' '}
            <a href="https://arasaac.org" target="_blank" rel="noreferrer" className="pc-keep-case">
              ARASAAC
            </a>
            : autore Sergio Palao, proprietà del Governo di Aragona (Spagna), licenza Creative Commons BY-NC-SA.
          </p>
          <p>Messaggi con Telegram tramite GramJS. Caratteri Atkinson Hyperlegible Next e OpenDyslexic.</p>
          <p className="hp-version">Versione {version}</p>
        </section>
      </div>
    </PageScaffold>
  );
}
