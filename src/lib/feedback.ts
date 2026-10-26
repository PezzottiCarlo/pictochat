import { getSettings } from '@/stores/settings';

/**
 * Lightweight audio + haptic feedback. Sounds are synthesized with WebAudio so no
 * asset has to be downloaded and they work offline.
 */

export type FeedbackKind = 'send' | 'receive' | 'tap' | 'success' | 'error';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// [frequency Hz, start offset s, duration s]
const TONES: Record<FeedbackKind, Array<[number, number, number]>> = {
  send: [[660, 0, 0.08], [990, 0.06, 0.1]],
  receive: [[880, 0, 0.08], [660, 0.08, 0.12]],
  tap: [[1200, 0, 0.03]],
  success: [[523, 0, 0.1], [659, 0.08, 0.1], [784, 0.16, 0.16]],
  error: [[300, 0, 0.12], [220, 0.1, 0.18]],
};

const VIBRATION: Record<FeedbackKind, number | number[]> = {
  send: 12,
  receive: [10, 40, 10],
  tap: 6,
  success: [10, 30, 20],
  error: [30, 40, 30],
};

function playTones(kind: FeedbackKind) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const [freq, offset, dur] of TONES[kind]) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + offset);
    osc.stop(now + offset + dur + 0.02);
  }
}

/** Plays the sound and/or vibration for `kind`, honoring the user's settings. */
export function feedback(kind: FeedbackKind) {
  const { sounds, haptics } = getSettings();
  if (sounds && kind !== 'tap') playTones(kind);
  if (haptics && 'vibrate' in navigator) navigator.vibrate(VIBRATION[kind]);
}
