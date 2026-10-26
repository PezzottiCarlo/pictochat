import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Button } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import type { UserRole } from '@/core/types';
import { GlassBar, PageScaffold } from '@/components/ui';
import { messaging } from '@/services/telegram';
import { feedback } from '@/lib/feedback';
import { ROLE_PRESETS, useSettings } from '@/stores/settings';
import { paths } from '@/app/paths';
import { devStartStep, loadProgress, resetOnboardingProgress, saveProgress, type FlowProgress } from './flow';
import { ProgressTrack } from './components/ProgressTrack';
import { SpeakButton } from './components/SpeakButton';
import { STEPS, type StepContext, type StepDefinition } from './steps';
import './onboarding.css';

const slide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48 }),
};

function initialProgress(): FlowProgress {
  const saved = loadProgress();
  const dev = devStartStep();
  return dev ? { ...saved, step: dev, roleChosen: saved.roleChosen || dev !== 'chi' } : saved;
}

/** One step: title, lead, body. Moves focus to its title when reached by navigation. */
function StepView({
  def,
  ctx,
  focusOnMount,
  scrollRef,
}: {
  def: StepDefinition;
  ctx: StepContext;
  focusOnMount: boolean;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!focusOnMount) return;
    scrollRef.current?.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
  }, [focusOnMount, scrollRef]);

  const Body = def.Component;
  return (
    <>
      <header className="ob-step__header">
        <h1 ref={heading} tabIndex={-1} className="ob-step__title">
          {def.title}
        </h1>
        <p className="ob-step__lead">{def.lead}</p>
      </header>
      <div className="ob-step__body">
        <Body ctx={ctx} />
      </div>
    </>
  );
}

/** /benvenuto — the mandatory guided setup every user goes through once (v2). */
export default function OnboardingPage() {
  const navigate = useNavigate();
  const role = useSettings((s) => s.role);
  const patch = useSettings((s) => s.patch);
  // Very large text: the back button becomes icon-only so both buttons stay on one row.
  const compact = useSettings((s) => s.fontScale >= 1.35 || (s.fontScale >= 1.2 && s.letterSpacing !== 'normal'));
  const [progress, setProgress] = useState<FlowProgress>(initialProgress);
  const [loggedIn, setLoggedIn] = useState(() => messaging.hasSession());
  const [direction, setDirection] = useState(1);
  const [navigated, setNavigated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => saveProgress(progress), [progress]);

  const index = Math.max(
    0,
    STEPS.findIndex((s) => s.id === progress.step),
  );
  const def = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // Latest progress for stable callbacks.
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const goTo = useCallback((to: number) => {
    const target = STEPS[to];
    if (!target) return;
    setDirection(to > STEPS.findIndex((s) => s.id === progressRef.current.step) ? 1 : -1);
    setNavigated(true);
    setProgress((p) => ({ ...p, step: target.id }));
  }, []);

  const finish = useCallback(() => {
    patch({ onboardingDone: true });
    resetOnboardingProgress();
    navigate(paths.chats, { replace: true });
  }, [patch, navigate]);

  const ctx = useMemo<StepContext>(
    () => ({
      role,
      roleChosen: progress.roleChosen,
      chooseRole: (next: UserRole) => {
        feedback('tap');
        if (!progress.roleChosen || next !== role) patch({ ...ROLE_PRESETS[next], role: next });
        setProgress((p) => ({ ...p, roleChosen: true }));
      },
      tryDone: progress.tryDone,
      markTryDone: () => setProgress((p) => ({ ...p, tryDone: true })),
      loggedIn,
      onLoggedIn: () => {
        setLoggedIn(true);
        goTo(STEPS.findIndex((s) => s.id === 'telegram') + 1);
      },
      next: () => goTo(index + 1),
    }),
    [role, progress.roleChosen, progress.tryDone, loggedIn, patch, goTo, index],
  );

  const canNext = def.canNext?.(ctx) ?? true;
  const nextLabel = def.nextLabel?.(ctx) ?? 'Avanti';

  return (
    <PageScaffold
      scrollRef={scrollRef}
      className="ob-page"
      header={
        <GlassBar position="top" className="ob-head">
          <div className="ob-head__row">
            <p className="ob-head__count">
              Passo {index + 1} di {STEPS.length}
              {!compact && <span className="ob-head__name">{def.name}</span>}
            </p>
            <SpeakButton text={def.speech(ctx)} label="Leggi questa pagina ad alta voce" />
          </div>
          <ProgressTrack current={index} total={STEPS.length} label={def.name} />
        </GlassBar>
      }
      footer={
        <GlassBar position="bottom" className="ob-foot">
          {!canNext && def.blockedHint && (
            <p className="pc-visually-hidden" id="ob-blocked">
              {def.blockedHint}
            </p>
          )}
          <div className="ob-foot__buttons">
            {index > 0 && (
              <Button
                size="large"
                className="ob-btn ob-btn--back"
                icon={<ArrowLeftOutlined />}
                aria-label={compact ? 'Indietro' : undefined}
                title={compact ? 'Indietro' : undefined}
                onClick={() => goTo(index - 1)}
              >
                {compact ? null : 'Indietro'}
              </Button>
            )}
            <Button
              type="primary"
              size="large"
              className="ob-btn ob-btn--next"
              disabled={!canNext}
              aria-describedby={!canNext && def.blockedHint ? 'ob-blocked' : undefined}
              icon={isLast ? <CheckOutlined /> : <ArrowRightOutlined />}
              iconPlacement="end"
              onClick={isLast ? finish : () => goTo(index + 1)}
            >
              {nextLabel}
            </Button>
          </div>
        </GlassBar>
      }
    >
      <p className="pc-visually-hidden" aria-live="polite">
        {navigated ? `Passo ${index + 1} di ${STEPS.length}: ${def.title}` : ''}
      </p>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.section
          key={def.id}
          className={`ob-step ob-step--${def.id}`}
          custom={direction}
          variants={slide}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <StepView def={def} ctx={ctx} focusOnMount={navigated} scrollRef={scrollRef} />
        </motion.section>
      </AnimatePresence>
    </PageScaffold>
  );
}
