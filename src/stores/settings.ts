import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuickPhrase, Settings } from '@/core/types';

export const DEFAULT_QUICK_PHRASES: QuickPhrase[] = [
  { id: 'qp-dove', text: 'Dove sei?', icon: '📍' },
  { id: 'qp-cosa', text: 'Cosa fai?', icon: '🤔' },
  { id: 'qp-arrivo', text: 'Sto arrivando', icon: '🏃' },
  { id: 'qp-casa', text: 'Vieni a casa', icon: '🏠' },
  { id: 'qp-aiuto', text: 'Ho bisogno di aiuto', icon: '🆘' },
  { id: 'qp-bene', text: 'Ti voglio bene', icon: '💕' },
];

export const DEFAULT_SETTINGS: Settings = {
  role: 'teen',
  onboardingDone: false,

  themeId: 'system',
  accentColor: null,
  glassIntensity: 0.7,
  reduceMotion: 'system',
  reduceTransparency: 'system',

  fontScale: 1.1,
  dyslexicFont: false,
  uppercase: false,
  letterSpacing: 'normal',
  lineHeight: 'relaxed',
  touchSize: 'large',
  boldText: false,

  appearance: { skin: 'white', hair: 'brown' },
  showPictograms: true,
  pictogramSize: 'md',
  pictogramLabel: 'below',
  categoryColors: true,
  speakOnTap: true,

  composerMode: 'pictograms',
  showSuggestions: true,
  confirmBeforeSend: false,
  showTimestamps: true,
  quickPhrases: DEFAULT_QUICK_PHRASES,

  autoSpeak: false,
  speechRate: 0.95,
  speechPitch: 1,
  voiceURI: null,
  sounds: true,
  haptics: true,

  simpleMode: false,
  settingsPinHash: null,
  allowedChatIds: [],
};

/** Presets applied when the role is chosen during onboarding. */
export const ROLE_PRESETS: Record<Settings['role'], Partial<Settings>> = {
  teen: {
    fontScale: 1.2,
    touchSize: 'large',
    pictogramSize: 'lg',
    composerMode: 'pictograms',
    showPictograms: true,
    speakOnTap: true,
    showSuggestions: true,
  },
  parent: {
    fontScale: 1,
    touchSize: 'comfortable',
    pictogramSize: 'md',
    composerMode: 'keyboard',
    showPictograms: true,
    speakOnTap: false,
    showSuggestions: false,
  },
};

interface SettingsState extends Settings {
  set<K extends keyof Settings>(key: K, value: Settings[K]): void;
  patch(partial: Partial<Settings>): void;
  reset(): void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<Settings>),
      patch: (partial) => set(partial),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'pictochat:settings',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ set: _s, patch: _p, reset: _r, ...settings }) => settings,
      // Earlier versions are not compatible: start from defaults so everyone redoes onboarding.
      migrate: () => DEFAULT_SETTINGS,
      // New fields added later fall back to defaults instead of `undefined`.
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<Settings>) }),
    },
  ),
);

/** Non-React access (services). */
export const getSettings = (): Settings => useSettings.getState();
