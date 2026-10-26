import type { ComponentType } from 'react';
import type { UserRole } from '@/core/types';
import type { StepId } from '../flow';

/** What the orchestrator shares with every step. */
export interface StepContext {
  role: UserRole;
  roleChosen: boolean;
  chooseRole(role: UserRole): void;
  tryDone: boolean;
  markTryDone(): void;
  loggedIn: boolean;
  onLoggedIn(): void;
  next(): void;
}

export interface StepDefinition {
  id: StepId;
  /** Short name (progress bar, announcements). */
  name: string;
  title: string;
  /** One or two short sentences under the title. */
  lead: string;
  /** Read aloud by the speaker button: title + lead + what to do. */
  speech: (ctx: StepContext) => string;
  Component: ComponentType<{ ctx: StepContext }>;
  /** Primary button label (default "Avanti"). */
  nextLabel?: (ctx: StepContext) => string;
  /** When false the primary button is disabled (a required choice is missing). */
  canNext?: (ctx: StepContext) => boolean;
  /** Spoken reason shown next to a disabled primary button. */
  blockedHint?: string;
}
