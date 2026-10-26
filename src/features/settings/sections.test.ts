import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '@/stores/settings';
import { SEARCH_INDEX, SECTIONS, SECTION_GROUPS, SETTING_SECTION, searchSettings } from './sections';

describe('searchSettings', () => {
  it('finds settings by name, synonym and accent-insensitive words', () => {
    expect(searchSettings('stampatello').map((e) => e.section)).toEqual(['lettura']);
    expect(searchSettings('MAIUSCOLO')[0].label).toBe('Stampatello');
    expect(searchSettings('velocita voce').map((e) => e.label)).toContain('Velocità della voce');
    expect(searchSettings('pin').some((e) => e.section === 'genitori')).toBe(true);
  });

  it('returns nothing for an empty query', () => {
    expect(searchSettings('   ')).toEqual([]);
  });
});

describe('sections', () => {
  it('every section is listed once (Profilo is the card on top)', () => {
    const listed = SECTION_GROUPS.flatMap((g) => g.ids);
    expect(new Set(listed).size).toBe(listed.length);
    expect([...listed, 'profilo'].sort()).toEqual(SECTIONS.map((s) => s.id).sort());
  });

  it('search entries point to existing sections', () => {
    const ids = new Set(SECTIONS.map((s) => s.id));
    expect(SEARCH_INDEX.every((e) => ids.has(e.section))).toBe(true);
  });

  it('every Settings field has a section', () => {
    expect(Object.keys(SETTING_SECTION).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
  });
});
