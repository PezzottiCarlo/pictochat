/**
 * Text-to-speech with the most natural Italian voice available (Web Speech API).
 * Rate, pitch and voice default to the user's settings and can be overridden per call.
 */
import { getSettings } from '@/stores/settings';

export interface SpeakOptions {
  /** 0.5–2, default settings.speechRate. */
  rate?: number;
  /** 0–2, default settings.speechPitch. */
  pitch?: number;
  /** SpeechSynthesisVoice.voiceURI; null = best Italian voice; default settings.voiceURI. */
  voiceURI?: string | null;
}

export interface VoiceInfo {
  uri: string;
  name: string;
  lang: string;
  quality: 'natural' | 'standard';
}

/** Best-sounding voices first (Edge/Windows neural voices, then Chrome's Google voice, then local ones). */
const PREFERRED_VOICES = [
  'Microsoft Isabella Online (Natural) - Italian (Italy)',
  'Microsoft Elsa Online (Natural) - Italian (Italy)',
  'Microsoft Giuseppe Online (Natural) - Italian (Italy)',
  'Microsoft Diego Online (Natural) - Italian (Italy)',
  'Microsoft Federica Online (Natural) - Italian (Italy)',
  'Microsoft Giovanna Online (Natural) - Italian (Italy)',
  'Microsoft Cosimo Online (Natural) - Italian (Italy)',
  'Google italiano',
  'Alice',
  'Federica',
  'Microsoft Elsa - Italian (Italy)',
  'Microsoft Cosimo - Italian (Italy)',
  'Microsoft Isabella - Italian (Italy)',
  'Microsoft Lucia - Italian (Italy)',
];

const NATURAL = /natural|neural|online|enhanced|premium|siri|^google/i;

export const isSpeechSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

const isItalian = (v: SpeechSynthesisVoice) => v.lang?.toLowerCase().replace('_', '-').startsWith('it');

function voiceRank(v: SpeechSynthesisVoice): number {
  const preferred = PREFERRED_VOICES.findIndex((n) => n.toLowerCase() === v.name.toLowerCase());
  if (preferred >= 0) return preferred;
  return PREFERRED_VOICES.length + (NATURAL.test(v.name) ? 0 : 10) + (v.lang.toLowerCase() === 'it-it' ? 0 : 1) + (v.localService ? 0 : 2);
}

export function chooseBestItalianVoice(voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const italian = voices.filter(isItalian);
  if (!italian.length) return null;
  return [...italian].sort((a, b) => voiceRank(a) - voiceRank(b))[0];
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | undefined;

/** Voices load asynchronously in Chrome; wait for `voiceschanged` (bounded). */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  voicesPromise ??= new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const done = () => {
      synth.removeEventListener('voiceschanged', done);
      clearTimeout(timer);
      voicesPromise = undefined;
      resolve(synth.getVoices());
    };
    const timer = setTimeout(done, 1500);
    synth.addEventListener('voiceschanged', done);
  });
  return voicesPromise;
}

/** Italian voices for the settings picker, best first. */
export async function listItalianVoices(): Promise<VoiceInfo[]> {
  const voices = (await loadVoices()).filter(isItalian).sort((a, b) => voiceRank(a) - voiceRank(b));
  return voices.map((v) => ({
    uri: v.voiceURI,
    name: v.name,
    lang: v.lang,
    quality: NATURAL.test(v.name) ? 'natural' : 'standard',
  }));
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Speaks `text` (interrupting any current speech); resolves when finished or interrupted. */
export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const clean = text.trim();
  if (!clean || !isSpeechSupported()) return;
  const settings = getSettings();
  const voiceURI = opts.voiceURI !== undefined ? opts.voiceURI : settings.voiceURI;
  const voices = await loadVoices();
  const voice = (voiceURI && voices.find((v) => v.voiceURI === voiceURI)) || chooseBestItalianVoice(voices);

  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = voice?.lang ?? 'it-IT';
  if (voice) utterance.voice = voice;
  utterance.rate = clamp(opts.rate ?? settings.speechRate ?? 0.95, 0.5, 2);
  utterance.pitch = clamp(opts.pitch ?? settings.speechPitch ?? 1, 0, 2);

  if (synth.speaking || synth.pending) synth.cancel();
  await new Promise<void>((resolve) => {
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/** Sample sentence for the voice picker in settings. */
export function previewSpeak(sample = 'Ciao! Questa è la mia voce.', opts?: SpeakOptions): Promise<void> {
  return speak(sample, opts);
}
