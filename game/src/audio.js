// Synthesized WebAudio sounds — no audio files. Everything is guarded so the
// game works silently when audio is unavailable (headless screenshots).

let ctx = null;

function ac() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = ac();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

function tone(freq, dur, type, vol, when = 0) {
  const c = ac();
  if (!c) return;
  try {
    const t0 = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch { /* silent */ }
}

export const sfx = {
  play() { tone(520, 0.12, 'triangle', 0.18); tone(780, 0.1, 'triangle', 0.12, 0.05); },
  attack() { tone(160, 0.16, 'sawtooth', 0.2); tone(90, 0.2, 'square', 0.14, 0.02); },
  draw() { tone(880, 0.06, 'sine', 0.08); },
  hurt() { tone(220, 0.18, 'sawtooth', 0.16); },
  heal() { tone(660, 0.15, 'sine', 0.12); tone(990, 0.18, 'sine', 0.1, 0.08); },
  turn() { tone(440, 0.08, 'triangle', 0.1); },
  error() { tone(140, 0.12, 'square', 0.1); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.12)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.14, i * 0.14)); },
};
