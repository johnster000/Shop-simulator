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
    this.enabled = true;
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
    this.compG.gain.setTargetAtTime(this.compOn ? 0.02 + 0.09 * compNear : 0, now, 0.4);
    // spindles: the nearest running machine sets the level
    let near = 0;
    for (const p of scene.running || []) near = Math.max(near, falloff(p, 2.2));
    const spinning = (scene.running || []).length > 0;
    this.spinG.gain.setTargetAtTime(spinning ? 0.006 + 0.05 * near : 0, now, 0.25);
    const f = spinning ? 180 : 60;
    this.spin.frequency.setTargetAtTime(f, now, 1.2); this.spin2.frequency.setTargetAtTime(f * 2.01, now, 1.2);
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
  paper() { this.noise(0.12, 2500, 0.06, 'highpass'); }
}
