import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from 'antd';
import { CheckCircleFilled, CloseOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';
import type { Pictogram, ReplySuggestion } from '@/core/types';
import { IconButton, PictoTile, Surface, cx } from '@/components/ui';
import { speak, useReplySuggestions, categoryColorOf } from '@/services/aac';
import { useReducedMotion } from '@/theme';
import { feedback } from '@/lib/feedback';
import { getSettings } from '@/stores/settings';
import { Bubble } from '../components/ChatPreview';
import { usePictos, type PictoKey } from '../components/picto';
import type { StepContext } from './types';

const PALETTE: { key: PictoKey; label: string }[] = [
  { key: 'io', label: 'io' },
  { key: 'tu', label: 'tu' },
  { key: 'volere', label: 'voglio' },
  { key: 'mangiare', label: 'mangiare' },
  { key: 'pizza', label: 'pizza' },
  { key: 'pasta', label: 'pasta' },
];
const TARGET: PictoKey[] = ['io', 'volere', 'pizza'];
const QUESTION = 'Vuoi pizza o pasta?';
const FOODS = new Set<PictoKey>(['pizza', 'pasta']);

type Phase = 'compose' | 'waiting' | 'reply' | 'done';

interface Line {
  id: number;
  text: string;
  out: boolean;
}

/** "io voglio pizza" → "Io voglio la pizza" (enough grammar for the demo). */
function sentenceOf(keys: PictoKey[]): string {
  const words = keys.map((k, i) => {
    const label = PALETTE.find((p) => p.key === k)!.label;
    return FOODS.has(k) && i > 0 && !FOODS.has(keys[i - 1]) ? `la ${label}` : label;
  });
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const say = (text: string) => void speak(text);

export function TryStep({ ctx }: { ctx: StepContext }) {
  const pictos = usePictos(PALETTE.map((p) => p.key));
  const [picked, setPicked] = useState<PictoKey[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState<Phase>(ctx.tryDone ? 'done' : 'compose');
  const suggestions = useReplySuggestions(phase === 'reply' ? QUESTION : undefined);
  const timer = useRef<number | undefined>(undefined);
  const replies = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Bring the answers into view once they are ready (the chat above may be tall).
  useEffect(() => {
    if (phase === 'reply' && suggestions.length > 0)
      replies.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }, [phase, suggestions.length, reduced]);

  const onTrack = TARGET.slice(0, picked.length).every((k, i) => picked[i] === k);
  const hint = phase === 'compose' && onTrack ? TARGET[picked.length] : undefined;
  const text = sentenceOf(picked);

  const add = (line: Omit<Line, 'id'>) => setLines((l) => [...l, { ...line, id: l.length + 1 }]);

  const tap = (key: PictoKey, label: string) => {
    if (phase !== 'compose' || picked.length >= 6) return;
    feedback('tap');
    if (getSettings().speakOnTap) say(label);
    setPicked((p) => [...p, key]);
  };

  const send = () => {
    if (picked.length === 0) return;
    add({ text, out: true });
    feedback('send');
    say(text);
    setPicked([]);
    setPhase('waiting');
    timer.current = window.setTimeout(() => {
      add({ text: QUESTION, out: false });
      feedback('receive');
      if (getSettings().autoSpeak) say(QUESTION);
      setPhase('reply');
    }, 1600);
  };

  const reply = (s: ReplySuggestion) => {
    add({ text: s.text, out: true });
    feedback('success');
    say(s.text);
    setPhase('done');
    ctx.markTryDone();
  };

  const restart = () => {
    window.clearTimeout(timer.current);
    setLines([]);
    setPicked([]);
    setPhase('compose');
  };

  const instruction: Record<Phase, string> = {
    compose:
      picked.length === 0
        ? 'Scrivi “Io voglio la pizza”. Tocca io, poi voglio, poi pizza.'
        : onTrack && picked.length < TARGET.length
          ? `Bene! Ora tocca “${PALETTE.find((p) => p.key === hint)?.label}”.`
          : 'Perfetto. Ora tocca Invia.',
    waiting: 'Messaggio inviato! Aspetta: la mamma sta scrivendo…',
    reply: 'La mamma ti fa una domanda. Guarda i pittogrammi sotto il messaggio, poi tocca una risposta pronta.',
    done: 'Bravissimo! Hai provato le tre cose più importanti di PictoChat.',
  };

  return (
    <>
      <p className="ob-instruction" aria-live="polite">
        {instruction[phase]}
      </p>

      <Surface variant="inset" padding={3} radius="xl" className="ob-try-chat" aria-label="Chat di prova">
        {lines.length === 0 && <p className="ob-try-chat__empty">Qui compare la chat con la mamma.</p>}
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              className={cx('ob-try-chat__line', line.out && 'is-out')}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            >
              <Bubble text={line.text} out={line.out} pictograms />
            </motion.div>
          ))}
        </AnimatePresence>
        {phase === 'waiting' && (
          <p className="ob-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </p>
        )}
      </Surface>

      {phase === 'compose' && (
        <section className="ob-composer" aria-label="Scrivi con i pittogrammi">
          <div className="ob-composer__bar">
            <div className="ob-composer__sentence" aria-live="polite">
              {picked.length ? text : <span className="pc-text-secondary">Il tuo messaggio…</span>}
            </div>
            <IconButton
              icon={<CloseOutlined />}
              aria-label="Cancella l’ultima parola"
              variant="plain"
              disabled={picked.length === 0}
              onClick={() => setPicked((p) => p.slice(0, -1))}
            />
            <IconButton
              icon={<SendOutlined />}
              aria-label="Invia"
              variant="filled"
              size="lg"
              disabled={picked.length === 0}
              onClick={send}
            />
          </div>
          <ul className="ob-composer__grid">
            {PALETTE.map((p, i) => {
              const picto: Pictogram | undefined = pictos?.[i];
              return (
                <li key={p.key} className={cx('ob-composer__cell', hint === p.key && 'is-hint')}>
                  {picto ? (
                    <PictoTile
                      pictogram={picto}
                      label={p.label}
                      color={categoryColorOf(picto.category)}
                      onPress={() => tap(p.key, p.label)}
                    />
                  ) : (
                    <span className="ob-composer__skeleton" />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {phase === 'reply' && (
        <section ref={replies} className="ob-replies" aria-label="Risposte pronte">
          {suggestions.slice(0, 4).map((s) => (
            <button key={s.text} type="button" className="ob-reply" onClick={() => reply(s)}>
              <span className="ob-reply__pictos" aria-hidden="true">
                {s.pictograms.slice(0, 3).map((p) => (
                  <img key={p.id} src={p.url} alt="" />
                ))}
              </span>
              <span className="ob-reply__text">{s.text}</span>
            </button>
          ))}
          {suggestions.length === 0 && <p className="ob-note">Preparo le risposte…</p>}
        </section>
      )}

      {phase === 'done' && (
        <Surface padding={4} radius="lg" className="ob-recap">
          <ul className="ob-points">
            {[
              'Hai scritto un messaggio con i pittogrammi.',
              'Hai letto una domanda con i pittogrammi sotto.',
              'Hai risposto con una risposta pronta.',
            ].map((t) => (
              <li key={t} className="ob-points__item">
                <span className="ob-points__icon ob-points__icon--ok" aria-hidden="true">
                  <CheckCircleFilled />
                </span>
                <span className="ob-points__text">{t}</span>
              </li>
            ))}
          </ul>
          <Button size="large" icon={<ReloadOutlined />} onClick={restart}>
            Prova di nuovo
          </Button>
        </Surface>
      )}
    </>
  );
}
