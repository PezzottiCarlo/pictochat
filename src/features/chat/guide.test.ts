import { describe, expect, it } from 'vitest';
import { nextStep, pendingSteps, smallerSize, stepOfCategory } from './lib/guide';
import { pushRecents, type RecentRef } from './lib/recents';

describe('guided sentence steps', () => {
  it('maps categories to steps', () => {
    expect(stepOfCategory('persone')).toBe('chi');
    expect(stepOfCategory('verbi')).toBe('azione');
    expect(stepOfCategory('cibo')).toBe('cosa');
    expect(stepOfCategory(undefined)).toBe('cosa');
  });

  it('shows the empty slots after the last filled step', () => {
    expect(pendingSteps([])).toEqual(['chi', 'azione', 'cosa']);
    expect(pendingSteps(['persone'])).toEqual(['azione', 'cosa']);
    expect(pendingSteps(['persone', 'persone'])).toEqual(['azione', 'cosa']);
    expect(pendingSteps(['verbi'])).toEqual(['cosa']);
    expect(pendingSteps(['persone', 'verbi', 'cibo'])).toEqual([]);
    expect(pendingSteps(['cibo'])).toEqual([]);
    // A person after the verb (object) does not reopen the earlier steps.
    expect(pendingSteps(['verbi', 'persone'])).toEqual(['cosa']);
  });

  it('opens the picker on the next step, staying on objects at the end', () => {
    expect(nextStep([])).toBe('chi');
    expect(nextStep(['persone'])).toBe('azione');
    expect(nextStep(['persone', 'verbi'])).toBe('cosa');
    expect(nextStep(['persone', 'verbi', 'cibo'])).toBe('cosa');
  });

  it('steps pictogram sizes down, never below sm', () => {
    expect(smallerSize('xl')).toBe('lg');
    expect(smallerSize('md')).toBe('sm');
    expect(smallerSize('sm')).toBe('sm');
  });
});

describe('recent pictograms', () => {
  const ref = (id: string): RecentRef => ({ id, word: id, source: 'arasaac' });

  it('puts the last used first without duplicates', () => {
    const next = pushRecents([ref('a'), ref('b')], [ref('c'), ref('a')]);
    expect(next.map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('caps the list', () => {
    const next = pushRecents([ref('a'), ref('b'), ref('c')], [ref('d')], 3);
    expect(next.map((r) => r.id)).toEqual(['d', 'a', 'b']);
  });
});
