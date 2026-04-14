/* Hangeffektek — Web Audio API */

let audioCtx = null;

export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, dur, type = 'square', vol = 0.08) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

export function sfxBoost() { playTone(200, 0.3, 'sawtooth', 0.1); setTimeout(() => playTone(400, 0.2, 'sawtooth', 0.08), 100); }
export function sfxNitro() { playTone(150, 0.5, 'sawtooth', 0.12); setTimeout(() => playTone(300, 0.4, 'sawtooth', 0.1), 150); }
export function sfxCollision() { playTone(80, 0.15, 'square', 0.15); }
export function sfxLap() { playTone(523, 0.1, 'square', 0.1); setTimeout(() => playTone(659, 0.1, 'square', 0.1), 100); setTimeout(() => playTone(784, 0.15, 'square', 0.1), 200); }
export function sfxPowerup() { playTone(440, 0.08, 'sine', 0.1); setTimeout(() => playTone(660, 0.08, 'sine', 0.1), 80); setTimeout(() => playTone(880, 0.12, 'sine', 0.1), 160); }
export function sfxCountdown() { playTone(330, 0.15, 'square', 0.08); }
export function sfxGo() { playTone(660, 0.25, 'square', 0.12); }
