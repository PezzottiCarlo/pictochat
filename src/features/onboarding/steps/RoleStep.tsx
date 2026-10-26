import { AnimatePresence, motion } from 'motion/react';
import { CheckCircleOutlined } from '@ant-design/icons';
import type { UserRole } from '@/core/types';
import { Surface } from '@/components/ui';
import { ChoiceCard, PointList } from '../components/controls';
import { usePictos } from '../components/picto';
import type { StepContext } from './types';

/** What each preset changes, in plain words (mirrors ROLE_PRESETS). */
const EFFECTS: Record<UserRole, string[]> = {
  teen: [
    'Testo e pittogrammi più grandi.',
    'Scrivi con i pittogrammi: la tastiera delle immagini si apre per prima.',
    'Vedi le risposte pronte da toccare.',
    'Quando tocchi un pittogramma, senti la parola.',
  ],
  parent: [
    'Testo di grandezza normale.',
    'Scrivi con la tastiera di sempre. I pittogrammi restano a un tocco.',
    'Vedi i pittogrammi sotto i messaggi, come li vede tuo figlio o tua figlia.',
    'Più avanti trovi i consigli per proteggere le impostazioni.',
  ],
};

export function RoleStep({ ctx }: { ctx: StepContext }) {
  const pictos = usePictos(['ragazza', 'ragazzo', 'genitori', 'educatore']);
  const pair = (a: number, b: number) =>
    pictos ? (
      <span className="ob-pair">
        <img src={pictos[a].url} alt="" />
        <img src={pictos[b].url} alt="" />
      </span>
    ) : (
      <span className="ob-pair" />
    );

  return (
    <>
      <div className="ob-stack" role="group" aria-label="Chi usa questo telefono">
        <ChoiceCard
          selected={ctx.roleChosen && ctx.role === 'teen'}
          onSelect={() => ctx.chooseRole('teen')}
          media={pair(0, 1)}
          stacked
          title="Sono un ragazzo o una ragazza"
          description="Uso PictoChat per scrivere alla mia famiglia e agli amici."
        />
        <ChoiceCard
          selected={ctx.roleChosen && ctx.role === 'parent'}
          onSelect={() => ctx.chooseRole('parent')}
          media={pair(2, 3)}
          stacked
          title="Sono un genitore o un educatore"
          description="Uso PictoChat per parlare con un ragazzo o una ragazza che ama le immagini."
        />
      </div>

      <AnimatePresence mode="wait">
        {ctx.roleChosen && (
          <motion.div
            key={ctx.role}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Surface variant="inset" padding={4} radius="lg" aria-live="polite">
              <h2 className="ob-subtitle">Ecco cosa cambia</h2>
              <PointList items={EFFECTS[ctx.role].map((text) => ({ icon: <CheckCircleOutlined />, text }))} />
            </Surface>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="ob-note">Non è una scelta per sempre: nei prossimi passi puoi cambiare ogni cosa.</p>
    </>
  );
}
