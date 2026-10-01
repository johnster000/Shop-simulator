// Every sound in the shop is synthesized. There are no audio files.
// The compressor is always there. That is the first thing you learn about a shop.

export class ShopAudio {
  constructor() { this.ctx = null; this.enabled = false; this.noiseBuf = null; this.compOn = false; this.compT = 0; }

  init() {
    if (this.ctx) return;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    const ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = 0.7; this.master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    // fluorescent buzz. half the tubes are out; the rest hum about it.
    this.buzz = ctx.createOscillator(); this.buzz.type = 'square'; this.buzz.frequency.value = 120;
    this.buzzF = ctx.createBiquadFilter(); this.buzzF.type = 'lowpass'; this.buzzF.frequency.value = 700;
    this.buzzG = ctx.createGain(); this.buzzG.gain.value = 0.004;
    this.buzz.connect(this.buzzF); this.buzzF.connect(this.buzzG); this.buzzG.connect(this.master); this.buzz.start();

    // the compressor. it cycles. it will cycle until the end of time.
    this.compSrc = ctx.createBufferSource(); this.compSrc.buffer = this.noiseBuf; this.compSrc.loop = true;
    this.compF = ctx.createBiquadFilter(); this.compF.type = 'lowpass'; this.compF.frequency.value = 260;
    this.compO = ctx.createOscillator(); this.compO.type = 'sawtooth'; this.compO.frequency.value = 48;
    this.compG = ctx.createGain(); this.compG.gain.value = 0;
    this.compSrc.connect(this.compF); this.compO.connect(this.compF); this.compF.connect(this.compG); this.compG.connect(this.master);
    this.compSrc.start(); this.compO.start();

    // spindle. one shared whine; pitched by whoever is running.
    this.spin = ctx.createOscillator(); this.spin.type = 'sawtooth'; this.spin.frequency.value = 80;
    this.spin2 = ctx.createOscillator(); this.spin2.type = 'triangle'; this.spin2.frequency.value = 160;
    this.spinF = ctx.createBiquadFilter(); this.spinF.type = 'bandpass'; this.spinF.Q.value = 2; this.spinF.frequency.value = 900;
    this.spinG = ctx.createGain(); this.spinG.gain.value = 0;
    this.spin.connect(this.spinF); this.spin2.connect(this.spinF); this.spinF.connect(this.spinG); this.spinG.connect(this.master);
    this.spin.start(); this.spin2.start();
    // the steel truck, idling at the door. a diesel with a loose heat shield.
    this.diesel = ctx.createOscillator(); this.diesel.type = 'sawtooth'; this.diesel.frequency.value = 27;
    this.dieselLfo = ctx.createOscillator(); this.dieselLfo.type = 'sine'; this.dieselLfo.frequency.value = 9;
    this.dieselLfoG = ctx.createGain(); this.dieselLfoG.gain.value = 4; this.dieselLfo.connect(this.dieselLfoG); this.dieselLfoG.connect(this.diesel.frequency);
    this.dieselF = ctx.createBiquadFilter(); this.dieselF.type = 'lowpass'; this.dieselF.frequency.value = 180;
    this.dieselG = ctx.createGain(); this.dieselG.gain.value = 0;
    this.diesel.connect(this.dieselF); this.dieselF.connect(this.dieselG); this.dieselG.connect(this.master); this.diesel.start(); this.dieselLfo.start();
    // the fluorescents. a 120 Hz buzz you stop hearing until it stops. one tube flickers; it is always the same tube.
    this.buzz = ctx.createOscillator(); this.buzz.type = 'triangle'; this.buzz.frequency.value = 120;
    this.buzzF = ctx.createBiquadFilter(); this.buzzF.type = 'lowpass'; this.buzzF.frequency.value = 400;
    this.buzzG = ctx.createGain(); this.buzzG.gain.value = 0;
    this.buzz.connect(this.buzzF); this.buzzF.connect(this.buzzG); this.buzzG.connect(this.master); this.buzz.start();
    // the radio: everything goes through a small, bad speaker
    this.radioF = ctx.createBiquadFilter(); this.radioF.type = 'bandpass'; this.radioF.frequency.value = 1100; this.radioF.Q.value = 0.6;
    this.radioG = ctx.createGain(); this.radioG.gain.value = 0;
    this.radioF.connect(this.radioG); this.radioG.connect(this.master);
    this.station = -1; this.radioStep = 0; this.nextNote = 0;
    this.enabled = true;
  }
  // ---- the radio. five stations, each somebody's wrong station.
  setStation(i) { this.station = i; this.radioStep = 0; if (this.ctx) this.nextNote = this.ctx.currentTime + 0.05; }
  radioNote(freq, dur, gain, type = 'square', when = 0, decay = true) {
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = freq;
    const t0 = when || ctx.currentTime; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * (decay ? 1 : 1.2));
    o.connect(g); g.connect(this.radioF); o.start(t0); o.stop(t0 + dur * 1.3);
  }
  radioNoise(dur, freq, gain, when, q = 1) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when); g.gain.exponentialRampToValueAtTime(0.0001, when + dur); src.connect(f); f.connect(g); g.connect(this.radioF); src.start(when); src.stop(when + dur + 0.05);
  }
  radioTick(near) {
    if (!this.ctx || this.station < 0 || near < 0.02) return;
    const ctx = this.ctx, now = ctx.currentTime; if (now < this.nextNote) return;
    const st = this.station, n = this.radioStep++, when = this.nextNote;
    const N = (semi) => 110 * Math.pow(2, semi / 12);
    if (st === 0) { // classic rock: power chords, a kick, the same four bars since 1978
      const roots = [0, 0, 3, 5, 0, 0, 5, 3][Math.floor(n / 2) % 8]; const sixteenth = 0.125;
      if (n % 2 === 0) { this.radioNote(N(roots - 12), 0.22, 0.09, 'sawtooth', when); this.radioNote(N(roots - 5), 0.22, 0.06, 'sawtooth', when); }
      if (n % 4 === 0) this.radioNote(55, 0.12, 0.12, 'sine', when); if (n % 4 === 2) this.radioNoise(0.08, 1800, 0.07, when);
      this.nextNote = when + sixteenth;
    } else if (st === 1) { // country: a plucked I-IV-V with a train beat
      const chord = [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]][Math.floor(n / 8) % 4]; const pick = chord[n % 3] + (n % 8 >= 4 ? 12 : 0);
      this.radioNote(N(pick), 0.18, 0.07, 'triangle', when); if (n % 2 === 0) this.radioNoise(0.05, 4000, 0.05, when, 2); if (n % 8 === 0) this.radioNote(N(chord[0] - 12), 0.3, 0.08, 'square', when);
      this.nextNote = when + 0.15;
    } else if (st === 2) { // talk: a man, certain about something, for an hour
      const len = 0.08 + Math.random() * 0.22; const f = 140 + Math.random() * 60;
      if (Math.random() < 0.82) { this.radioNote(f, len, 0.05, 'sawtooth', when); this.radioNoise(len, 900 + Math.random() * 1400, 0.03, when, 0.8); }
      this.nextNote = when + len + (Math.random() < 0.15 ? 0.5 : 0.04);
    } else if (st === 3) { // the French station: accordion, in three
      const bar = Math.floor(n / 3) % 4, root = [0, 5, 7, 0][bar], beat = n % 3;
      if (beat === 0) { this.radioNote(N(root - 12), 0.3, 0.08, 'square', when); } else { this.radioNote(N(root + 4), 0.2, 0.05, 'square', when); this.radioNote(N(root + 7) * 1.004, 0.2, 0.05, 'square', when); }
      const mel = [12, 14, 16, 12, 16, 14, 12, 7, 9, 11, 12, 9][n % 12]; this.radioNote(N(root + mel), 0.25, 0.045, 'square', when);
      this.nextNote = when + 0.21;
    } else { // static. between stations. somebody left it there on purpose.
      this.radioNoise(0.3, 600 + Math.random() * 3000, 0.05, when, 0.5); this.nextNote = when + 0.25;
    }
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  // scene: { listener: {x,z}, running: [{x,z}], compressor: {x,z}, iso: bool }
  // Sound falls off with distance. A shop is never quiet, but a machine across the floor is a
  // murmur and the one you are standing at is the one you hear.
  update(dt, scene) {
    if (!this.enabled) return;
    const ctx = this.ctx, now = ctx.currentTime;
    const L = scene.listener;
    const falloff = (p, r) => { if (!p || scene.iso) return 0.35; const d = Math.hypot(p.x - L.x, p.z - L.z); return 1 / (1 + (d / r) * (d / r)); };
    // compressor duty cycle: ~9 s on, ~24 s off
    this.compT += dt;
    if (!this.compOn && this.compT > 24) { this.compOn = true; this.compT = 0; }
    if (this.compOn && this.compT > 9) { this.compOn = false; this.compT = 0; this.tick(0.12, 400); }
    const compNear = falloff(scene.compressor, 3.5);
    const radioNear = scene.radio ? falloff(scene.radio, 4.0) : 0; this.radioG.gain.setTargetAtTime(0.9 * radioNear, now, 0.3); this.radioTick(radioNear);
    if (this.dieselG) this.dieselG.gain.setTargetAtTime(scene.truck ? 0.02 + 0.12 * falloff(scene.truck, 6) : 0, now, 0.5);
    this.compG.gain.setTargetAtTime(this.compOn ? 0.02 + 0.09 * compNear : 0, now, 0.4);
    this.buzzG.gain.setTargetAtTime(scene.lightsOn === false ? 0 : 0.0035 + (Math.random() < dt * 0.3 ? 0.004 : 0), now, 0.2);
    // the nearest running machine sets the level and the kind of noise
    let near = 0, kind = null;
    for (const p of scene.running || []) { const k = falloff(p, 2.2); if (k > near) { near = k; kind = p.kind; } }
    const spinning = (scene.running || []).length > 0;
    const prof = { vmc: [900, 0.055, 'sawtooth', 1800], mill: [180, 0.05, 'sawtooth', 900], lathe: [120, 0.045, 'sawtooth', 700], grinder: [1400, 0.04, 'sawtooth', 2600], drill: [300, 0.04, 'triangle', 1200], saw: [90, 0.05, 'sawtooth', 500], sinker: [55, 0.045, 'square', 400], wire: [70, 0.035, 'square', 500], bench: [0, 0, 'sine', 400], press: [95, 0.05, 'sawtooth', 450], heat: [48, 0.03, 'triangle', 260] }[kind] || [180, 0.05, 'sawtooth', 900];
    this.spinG.gain.setTargetAtTime(spinning && prof[1] ? 0.004 + prof[1] * near : 0, now, 0.25);
    if (kind && this.spin.type !== prof[2]) { this.spin.type = prof[2]; }
    const f = spinning ? prof[0] : 60;
    this.spin.frequency.setTargetAtTime(f, now, 0.8); this.spin2.frequency.setTargetAtTime(f * 2.01, now, 0.8); this.spinF.frequency.setTargetAtTime(prof[3], now, 0.5);
    // EDM crackle: random ticks while a sinker or wire is the nearest thing running
    if ((kind === 'sinker' || kind === 'wire') && Math.random() < dt * 14) this.noise(0.02, 3000 + Math.random() * 3000, 0.03 * near, 'bandpass', 4);
  }

  noise(dur, freq, gain, type = 'bandpass', q = 1) {
    if (!this.enabled) return;
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(this.master);
    g.gain.setTargetAtTime(0, ctx.currentTime + dur * 0.4, dur * 0.25);
    src.start(); src.stop(ctx.currentTime + dur);
  }

  tone(freq, dur, gain = 0.1, type = 'sine') {
    if (!this.enabled) return;
    const ctx = this.ctx, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(this.master);
    g.gain.setTargetAtTime(0, ctx.currentTime + dur * 0.5, dur * 0.2);
    o.start(); o.stop(ctx.currentTime + dur);
  }

  step() { this.noise(0.09, 300 + Math.random() * 200, 0.04, 'lowpass'); }
  // a soft tick for buttons and switches. short, band-limited, quiet.
  tick(gain = 0.05, freq = 1800) { this.noise(0.025, freq, gain, 'bandpass', 2.5); }
  click(gain = 0.05, freq = 1800) { this.tick(gain, freq); }
  tarp() { this.noise(0.5, 400, 0.04, 'bandpass', 0.5); }
  cash() { this.tone(880, 0.1, 0.045, 'square'); setTimeout(() => this.tone(1320, 0.18, 0.045, 'square'), 90); }
  nope() { this.tone(160, 0.25, 0.06, 'square'); }
  cycleStart() { this.tick(0.12, 900); this.tone(220, 0.3, 0.05, 'triangle'); }
  ding() { this.tone(1760, 0.5, 0.07); setTimeout(() => this.tone(2200, 0.6, 0.05), 120); }
  thunk() { this.noise(0.18, 120, 0.18, 'lowpass'); }
  horn() { this.hornCount = (this.hornCount || 0) + 1; this.tone(392, 0.28, 0.12, 'square'); setTimeout(() => this.tone(392, 0.28, 0.12, 'square'), 380); }
  paper() { this.noise(0.12, 2500, 0.06, 'highpass'); }
  whistle(k = 1) { if (!this.enabled || k < 0.03) return; const base = 700 + Math.random() * 300, pat = [0, 4, 7][Math.floor(Math.random() * 3)]; const notes = [0, 4, 7, 4, 9, 7].slice(0, 3 + Math.floor(Math.random() * 3)); notes.forEach((n, i) => setTimeout(() => this.tone(base * Math.pow(2, (n + pat) / 12), 0.22, 0.035 * k, 'sine'), i * 230)); }
  ring(k = 1) { if (!this.enabled || k < 0.02) return; for (let i = 0; i < 2; i++) setTimeout(() => { this.tone(440, 0.22, 0.05 * k, 'sine'); this.tone(480, 0.22, 0.05 * k, 'sine'); }, i * 300); }
  alarm(k = 1) { this.tone(880, 0.18, 0.05 * k, 'square'); setTimeout(() => this.tone(660, 0.18, 0.05 * k, 'square'), 200); }
  estop() { this.noise(0.08, 500, 0.2, 'lowpass'); this.tone(90, 0.6, 0.08, 'sawtooth'); }
  squeal(k = 1) { this.tone(2400 + Math.random() * 600, 0.12, 0.02 * k, 'sawtooth'); }
}
