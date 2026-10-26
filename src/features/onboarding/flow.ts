/**
 * Onboarding progress, persisted per tab (sessionStorage) so a reload keeps the
 * current step while a fresh visit always starts from the welcome screen.
 */

export const STEP_IDS = [
  'benvenuto',
  'chi',
  'lettura',
  'colori',
  'pittogrammi',
  'voce',
  'prova',
  'genitori',
  'telegram',
  'fatto',
] as const;

export type StepId = (typeof STEP_IDS)[number];

export interface FlowProgress {
  step: StepId;
  /** The role must be picked explicitly (the store always has a default). */
  roleChosen: boolean;
  /** The interactive tutorial was completed at least once. */
  tryDone: boolean;
}

const KEY = 'pictochat:onboarding:v2';
const INITIAL: FlowProgress = { step: 'benvenuto', roleChosen: false, tryDone: false };

const isStepId = (v: unknown): v is StepId => typeof v === 'string' && (STEP_IDS as readonly string[]).includes(v);

export function loadProgress(): FlowProgress {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<FlowProgress>) : {};
    return {
      step: isStepId(parsed.step) ? parsed.step : INITIAL.step,
      roleChosen: parsed.roleChosen === true,
      tryDone: parsed.tryDone === true,
    };
  } catch {
    return INITIAL;
  }
}

export function saveProgress(progress: FlowProgress): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Private mode / storage disabled: progress simply is not kept across reloads.
  }
}

/** Forget the progress, e.g. before redoing the tutorial from the help page. */
export function resetOnboardingProgress(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Dev convenience for screenshots: `?passo=<id>` before the hash jumps to a step. */
export function devStartStep(): StepId | undefined {
  if (!import.meta.env.DEV) return undefined;
  const id = new URLSearchParams(window.location.search).get('passo');
  return isStepId(id) ? id : undefined;
}
