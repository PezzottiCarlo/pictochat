/**
 * Guided sentence building "Chi? → Cosa fa? → Cosa?" (subject → verb → object), like the
 * velcro slots of a printed AAC sentence strip. Pure helpers, no vocabulary knowledge.
 */
import type { SizeStep } from '@/core/types';

export type GuideStep = 'chi' | 'azione' | 'cosa';

export const GUIDE_STEPS: readonly GuideStep[] = ['chi', 'azione', 'cosa'];

export const STEP_LABEL: Record<GuideStep, string> = {
  chi: 'Chi?',
  azione: 'Cosa fa?',
  cosa: 'Cosa?',
};

/** Composer category shown for the person/verb steps. */
export const STEP_CATEGORY: Record<Exclude<GuideStep, 'cosa'>, string> = {
  chi: 'persone',
  azione: 'verbi',
};

export function stepOfCategory(category: string | undefined): GuideStep {
  if (category === 'persone') return 'chi';
  if (category === 'verbi') return 'azione';
  return 'cosa';
}

/**
 * Empty slots still to fill after the last filled step: [] → all three,
 * [io] → Cosa fa?, Cosa? · [mangiare] → Cosa? · [pizza] → none.
 */
export function pendingSteps(categories: readonly (string | undefined)[]): GuideStep[] {
  if (!categories.length) return [...GUIDE_STEPS];
  const last = Math.max(...categories.map((c) => GUIDE_STEPS.indexOf(stepOfCategory(c))));
  return GUIDE_STEPS.slice(last + 1);
}

/** The step the picker should open on after the given sentence. */
export const nextStep = (categories: readonly (string | undefined)[]): GuideStep =>
  pendingSteps(categories)[0] ?? 'cosa';

const STEPS: readonly SizeStep[] = ['sm', 'md', 'lg', 'xl'];

/** One size smaller (min sm): pictograms inside bubbles and the sentence strip are compact. */
export const smallerSize = (size: SizeStep): SizeStep => STEPS[Math.max(0, STEPS.indexOf(size) - 1)];
