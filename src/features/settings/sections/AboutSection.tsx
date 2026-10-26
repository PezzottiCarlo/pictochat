import { useNavigate } from 'react-router';
import { App } from 'antd';
import { BookOutlined, ReloadOutlined } from '@ant-design/icons';
import { paths } from '@/app/paths';
import { useSettings } from '@/stores/settings';
import { version } from '../../../../package.json';
import { NavRow, SettingsGroup } from '../components/controls';

export function AboutSection() {
  const navigate = useNavigate();
  const patch = useSettings((s) => s.patch);
  const { modal } = App.useApp();

  const redoTutorial = () =>
    modal.confirm({
      title: 'Rifare il tutorial?',
      content: 'Rivedi i primi passi dell’app. Le chat e le impostazioni restano come sono.',
      okText: 'Sì, rifallo',
      cancelText: 'No',
      onOk: () => {
        patch({ onboardingDone: false });
        navigate(paths.onboarding);
      },
    });

  return (
    <>
      <div className="st-about">
        <span className="st-about__logo" aria-hidden="true">
          💬
        </span>
        <p className="st-about__name">PictoChat</p>
        <p className="st-about__meta">Versione {version}</p>
        <p className="st-about__lead">Messaggi con i pittogrammi, per parlarsi in modo semplice in famiglia.</p>
      </div>

      <SettingsGroup title="Aiuto">
        <NavRow to={paths.help} icon={<BookOutlined />} tone="social" label="Guida" description="Come si usa PictoChat, passo per passo" />
        <NavRow onClick={redoTutorial} icon={<ReloadOutlined />} tone="verb" label="Rifai il tutorial" description="Rivedi i primi passi" />
      </SettingsGroup>

      <SettingsGroup title="Riconoscimenti">
        <ul className="st-credits">
          <li>
            Pittogrammi di{' '}
            <a href="https://arasaac.org" target="_blank" rel="noreferrer">
              ARASAAC
            </a>{' '}
            (Governo di Aragona), autore Sergio Palao, licenza CC BY-NC-SA.
          </li>
          <li>
            Messaggi tramite{' '}
            <a href="https://telegram.org" target="_blank" rel="noreferrer">
              Telegram
            </a>
            : PictoChat non ha un server, tutto resta tra il telefono e Telegram.
          </li>
          <li>Progetto di tesi di Carlo Pezzotti.</li>
          <li>Carattere Atkinson Hyperlegible del Braille Institute.</li>
        </ul>
      </SettingsGroup>
    </>
  );
}
