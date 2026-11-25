// Warung Kilat — sound. Every sound is synthesized live with the Web
// Audio API, so the game ships no audio files at all. Nothing here
// touches the network; the kitchen sizzles from oscillators and noise.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  // Browsers only let audio start after a gesture; call this from the
  // first click or keypress and everything after it just works.
  unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }
    if (this.context.state === 'suspended') void this.context.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  tone(freq, dur, type = 'sine', gain = 0.12, when = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const amp = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0, t0);
    amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.context.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A short burst of filtered noise: a chop, a sizzle pop, a plate clink.
  noise(dur, filterFreq = 1800, gain = 0.1, when = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const len = Math.max(1, Math.floor(this.context.sampleRate * dur));
    const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const amp = this.context.createGain();
    amp.gain.value = gain;
    source.connect(filter).connect(amp).connect(this.context.destination);
    source.start(t0);
  }

  click() { this.tone(660, 0.07, 'triangle', 0.08); }
  add() { this.tone(520, 0.08, 'triangle', 0.1); this.tone(780, 0.09, 'triangle', 0.08, 0.05); }
  remove() { this.tone(300, 0.09, 'triangle', 0.09); }
  chop() { this.noise(0.06, 2400, 0.14); }
  error() { this.tone(160, 0.16, 'sawtooth', 0.07); this.tone(120, 0.18, 'sawtooth', 0.06, 0.09); }
  coin() { this.tone(988, 0.1, 'sine', 0.1); this.tone(1319, 0.22, 'sine', 0.1, 0.08); }
  ding() { this.tone(1175, 0.35, 'sine', 0.11); this.tone(1568, 0.4, 'sine', 0.07, 0.02); }
  tick() { this.tone(880, 0.05, 'square', 0.05); }
  gameOver() {
    [523, 392, 330, 262].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.1, i * 0.16));
  }

  // A looping sizzle while the wok is busy; start/stop with the wok.
  startSizzle() {
    if (!this.context || this.muted || this.sizzleNodes) return;
    const len = this.context.sampleRate;
    const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3200;
    const amp = this.context.createGain();
    amp.gain.value = 0.035;
    const lfo = this.context.createOscillator();
    lfo.frequency.value = 7;
    const lfoGain = this.context.createGain();
    lfoGain.gain.value = 0.015;
    lfo.connect(lfoGain).connect(amp.gain);
    source.connect(filter).connect(amp).connect(this.context.destination);
    source.start();
    lfo.start();
    this.sizzleNodes = { source, lfo, amp };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try {
      this.sizzleNodes.source.stop();
      this.sizzleNodes.lfo.stop();
    } catch { /* already stopped */ }
    this.sizzleNodes = null;
  }
}
