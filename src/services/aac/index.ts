/**
 * AAC (pictogram) service — public API. See ./contract.ts.
 */
export type { AacEngine } from './contract';
export { aac } from './engine';

// React helpers
export { useAacReady, usePictogramTokens, useReplySuggestions, usePersonalPictograms } from './hooks';

// Personal pictograms
export { usePersonalStore, personalImageUrl, personalToPictogram } from './personal/store';
export type { NewPersonalPictogram, PersonalPatch } from './personal/store';

// Sharing over chat
export { parsePictogramShare, formatPictogramShare } from './share';

// Categories & images
export { CATEGORIES, DEFAULT_CATEGORY, resolveCategory, categoryById, categoryColorOf, tokenColor } from './categories';
export { arasaacImageUrl, HAIR_HEX, SKIN_HEX } from './arasaac';
export type { ImageSize } from './arasaac';

// Text-to-speech
export { speak, stopSpeaking, previewSpeak, listItalianVoices, isSpeechSupported } from './speech';
export type { SpeakOptions, VoiceInfo } from './speech';
