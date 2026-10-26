import { useEffect } from 'react';
import { motion } from 'motion/react';
import { PictoTile } from '@/components/ui';
import { getTheme, SYSTEM_THEME } from '@/theme';
import { feedback } from '@/lib/feedback';
import { useSettings } from '@/stores/settings';
import { Confetti } from '../components/Confetti';
import { usePictos } from '../components/picto';

const SIZE_NAMES = { sm: 'piccoli', md: 'medi', lg: 'grandi', xl: 'enormi' } as const;

export function DoneStep() {
  const s = useSettings();
  const pictos = usePictos(['festa']);

  useEffect(() => {
    feedback('success');
  }, []);

  const theme = s.themeId === 'system' ? SYSTEM_THEME.label : getTheme(s.themeId).label;
  const summary = [
    s.role === 'parent' ? 'Genitore o educatore' : 'Ragazzo o ragazza',
    `Testo al ${Math.round(s.fontScale * 100)}%`,
    s.dyslexicFont ? 'Lettere per la dislessia' : null,
    s.uppercase ? 'STAMPATELLO' : null,
    `Tema ${theme}`,
    `Pittogrammi ${SIZE_NAMES[s.pictogramSize]}`,
    s.autoSpeak ? 'Messaggi letti ad alta voce' : null,
    s.settingsPinHash ? 'PIN attivo' : null,
    s.simpleMode ? 'Modalità semplice' : null,
  ].filter((x): x is string => Boolean(x));

  return (
    <>
      <Confetti />
      <motion.div
        className="ob-done"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
      >
        {pictos && <PictoTile pictogram={pictos[0]} size="xl" showLabel={false} color={null} />}
      </motion.div>

      <section aria-labelledby="ob-summary">
        <h2 id="ob-summary" className="ob-subtitle">
          Le tue scelte
        </h2>
        <ul className="ob-chips">
          {summary.map((item) => (
            <li key={item} className="ob-chip">
              {item}
            </li>
          ))}
        </ul>
      </section>
      <p className="ob-note">
        Vuoi cambiare qualcosa? Lo trovi in Impostazioni. La guida è sempre in Aiuto, e puoi rifarla quando vuoi.
      </p>
    </>
  );
}
