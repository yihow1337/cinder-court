// Every sound in CINDER COURT is synthesised here on the Web Audio graph: no audio
// files, no network. A dull thud as a card is dealt, a woody snap as it lands, a flare
// for a stoke, a rising chord for a win and a dying hiss for a loss.

let ctxAudio = null;
let master = null;
let muted = false;

function ensureContext() {
  if (ctxAudio) return ctxAudio;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctxAudio = new Ctor();
  } catch {
    return null;
  }
  master = ctxAudio.createGain();
  master.gain.value = 0.42;
  master.connect(ctxAudio.destination);
  return ctxAudio;
}

export function unlockAudio() {
  const audio = ensureContext();
  if (audio && audio.state === 'suspended') audio.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.42;
  return muted;
}

export function isMuted() {
  return muted;
}

function envelope(node, peak, attack, decay, when) {
  const gain = ctxAudio.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  node.connect(gain);
  gain.connect(master);
  return gain;
}

function tone({ type = 'sine', from, to, peak = 0.3, attack = 0.01, decay = 0.3, delay = 0 }) {
  const audio = ensureContext();
  if (!audio || muted) return;
  const when = audio.currentTime + delay;
  const osc = audio.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, when);
  if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(to, when + attack + decay);
  envelope(osc, peak, attack, decay, when);
  osc.start(when);
  osc.stop(when + attack + decay + 0.05);
}

function noise({ peak = 0.25, decay = 0.4, delay = 0, bandpass = 900, q = 1.2, sweepTo = null }) {
  const audio = ensureContext();
  if (!audio || muted) return;
  const when = audio.currentTime + delay;
  const length = Math.ceil(audio.sampleRate * (decay + 0.1));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + white * 0.35) * 0.72;
    data[i] = last;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(bandpass, when);
  filter.Q.value = q;
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, when + decay);
  source.connect(filter);
  envelope(filter, peak, 0.012, decay, when);
  source.start(when);
  source.stop(when + decay + 0.1);
}

// --- the court's voice -----------------------------------------------------

export function playDeal(index = 0) {
  tone({ type: 'sine', from: 150, to: 62, peak: 0.26, attack: 0.004, decay: 0.16, delay: index * 0.02 });
  noise({ peak: 0.12, decay: 0.12, bandpass: 420, delay: index * 0.02 });
}

export function playSnap() {
  tone({ type: 'triangle', from: 520, to: 180, peak: 0.24, attack: 0.003, decay: 0.12 });
  noise({ peak: 0.2, decay: 0.09, bandpass: 2100, q: 0.9 });
}

export function playSelect() {
  tone({ type: 'sine', from: 680, to: 880, peak: 0.1, attack: 0.004, decay: 0.07 });
}

export function playBank() {
  tone({ type: 'sine', from: 330, to: 120, peak: 0.2, attack: 0.01, decay: 0.26 });
  noise({ peak: 0.1, decay: 0.2, bandpass: 700, sweepTo: 260 });
}

export function playClash(won) {
  const base = won ? 196 : 146;
  tone({ type: 'sawtooth', from: base, to: base * (won ? 2 : 0.5), peak: 0.16, attack: 0.006, decay: 0.3 });
  noise({ peak: 0.22, decay: 0.22, bandpass: won ? 1500 : 600, sweepTo: won ? 2600 : 200 });
}

export function playStoke() {
  noise({ peak: 0.3, decay: 0.5, bandpass: 700, sweepTo: 3200, q: 0.7 });
  [0, 0.06, 0.12].forEach((delay, i) => {
    tone({ type: 'triangle', from: 440 * (1 + i * 0.26), to: 1320, peak: 0.14, attack: 0.008, decay: 0.3, delay });
  });
}

export function playFlare() {
  noise({ peak: 0.26, decay: 0.42, bandpass: 400, sweepTo: 2800 });
  tone({ type: 'square', from: 180, to: 740, peak: 0.12, attack: 0.01, decay: 0.3 });
}

export function playWin() {
  const chord = [174.6, 261.6, 349.2, 523.3];
  chord.forEach((freq, i) => {
    tone({ type: 'triangle', from: freq, to: freq * 1.002, peak: 0.22, attack: 0.03, decay: 1.5, delay: i * 0.1 });
  });
  noise({ peak: 0.16, decay: 1.1, bandpass: 900, sweepTo: 3600, delay: 0.1 });
}

export function playLoss() {
  const chord = [146.8, 174.6, 207.6];
  chord.forEach((freq, i) => {
    tone({ type: 'sine', from: freq, to: freq * 0.5, peak: 0.2, attack: 0.05, decay: 1.7, delay: i * 0.14 });
  });
  noise({ peak: 0.22, decay: 1.6, bandpass: 1800, sweepTo: 180, q: 0.6 });
}

export function playDealRound(count) {
  for (let i = 0; i < count; i += 1) playDeal(i);
}
