/**
 * Plays short feedback sounds using the Web Audio API.
 * No external audio files needed — synthesized tones.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || ((window as unknown as Record<string, typeof AudioContext>).webkitAudioContext);
    if (!AudioCtx) return null;
    audioCtx = new AudioCtx();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playCorrect() {
  playTone(523, 0.1); // C5
  setTimeout(() => playTone(659, 0.15), 80); // E5
}

export function playIncorrect() {
  playTone(200, 0.2, 'square');
}

export function playFlip() {
  playTone(440, 0.06); // A4 — short tap
}
