// All sounds are made here with the Web Audio API: short oscillator notes,
// no audio files, nothing fetched. The context only starts after the
// player's first click, as browsers require, and the mute button silences
// everything for the rest of the session.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ensureCtx() {
  if (!ctx) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
    } catch (e) {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, at, dur, type, vol) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ac.currentTime + at);
  gain.gain.linearRampToValueAtTime(vol, ac.currentTime + at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + dur + 0.05);
}

export function unlockAudio() {
  ensureCtx();
}

export function clickSound() {
  tone(620, 0, 0.07, 'triangle', 0.12);
}

export function playSound() {
  tone(392, 0, 0.12, 'triangle', 0.16);
  tone(523, 0.06, 0.14, 'triangle', 0.14);
}

export function hitSound() {
  tone(140, 0, 0.18, 'sawtooth', 0.18);
  tone(90, 0.05, 0.22, 'sawtooth', 0.14);
}

export function healSound() {
  tone(523, 0, 0.12, 'sine', 0.14);
  tone(659, 0.08, 0.16, 'sine', 0.12);
}

export function winSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => tone(n, i * 0.12, 0.3, 'triangle', 0.16));
}

export function loseSound() {
  const notes = [392, 330, 262, 196];
  notes.forEach((n, i) => tone(n, i * 0.14, 0.32, 'sine', 0.14));
}
