// Setup minigames. Each checklist step is a few seconds of hand-eye work on a canvas.
// Win and the step is done. Lose and the step is skipped, with everything that follows from that.
// Tired owners get a shakier needle, a narrower window, and numbers that are not quite right.
//
// play(kind, opts) -> Promise<{ ok, note }>. kind: 'clamp' | 'indicate' | 'speed'.
// opts: { el (container), fatigue 0..1, audio, label, hint }

const W = 420, H = 190;

function setup(opts, title, hint) {
  const el = opts.el; el.innerHTML = '';
  const head = document.createElement('div'); head.className = 'mgHead'; head.innerHTML = `<b>${title}</b><span>${hint}</span>`; el.appendChild(head);
  const c = document.createElement('canvas'); c.width = W; c.height = H; c.className = 'mg'; el.appendChild(c);
  const foot = document.createElement('div'); foot.className = 'mgFoot'; el.appendChild(foot);
  return { c, x: c.getContext('2d'), foot };
}

function font(x, size, bold = false) { x.font = `${bold ? 'bold ' : ''}${size}px "Courier New", monospace`; }

// ---- CLAMP: hold to tighten, let go in the green. Too loose and it walks; too tight and you crack something.
export function clamp(opts) {
  return new Promise((resolve) => {
    const f = opts.fatigue || 0;
    const { c, x, foot } = setup(opts, opts.label || 'Clamp the work', 'hold to tighten · let go in the green');
    const lo = 58 + f * 8, hi = 82 - f * 8;           // the green zone, narrower when tired
    let torque = 0, holding = false, t0 = performance.now(), done = false, jitter = 0;
    const end = (ok, note) => { if (done) return; done = true; cleanup(); foot.textContent = note; if (ok) opts.audio.ding(); else opts.audio.nope(); setTimeout(() => resolve({ ok, note }), 650); };
    const down = (e) => { if (e.type === 'keydown' && e.code !== 'Space') return; e.preventDefault(); holding = true; };
    const up = (e) => { if (e.type === 'keyup' && e.code !== 'Space') return; if (!holding) return; holding = false; if (torque < lo) end(false, `Loose at ${Math.round(torque)}. It will walk.`); else if (torque > hi) end(false, `${Math.round(torque)}. Something cracked.`); else end(true, `Snug. ${Math.round(torque)}.`); };
    c.addEventListener('pointerdown', down); window.addEventListener('pointerup', up); window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    const cleanup = () => { c.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    let last = performance.now();
    (function frame(now) {
      if (done) return; requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (holding) torque = Math.min(100, torque + dt * (34 + f * 14));
      jitter += (Math.random() - 0.5) * f * 6; jitter *= 0.85;
      if (now - t0 > 7000) end(false, 'You stood there holding the handle. Then you forgot why.');
      // draw
      x.fillStyle = '#f3efe4'; x.fillRect(0, 0, W, H);
      // the vise: two jaws and a block between them, the moving jaw creeping in with torque
      x.fillStyle = '#333'; x.fillRect(40, 60, 24, 70); x.fillRect(40 + 160 - torque * 0.6, 60, 24, 70);
      x.fillStyle = '#8a8f94'; x.fillRect(64, 75, 100 - torque * 0.6 + 36, 40);
      x.fillStyle = '#555'; x.fillRect(225, 92, 150, 6); // the screw
      x.save(); x.translate(380, 95); x.rotate(torque * 0.12 + jitter * 0.02); x.fillStyle = '#222'; x.fillRect(-4, -34, 8, 68); x.restore(); // the handle
      // torque bar
      const bx = 40, by = 150, bw = 340, bh = 18;
      x.fillStyle = '#ddd'; x.fillRect(bx, by, bw, bh);
      x.fillStyle = 'rgba(46,204,64,.45)'; x.fillRect(bx + bw * lo / 100, by, bw * (hi - lo) / 100, bh);
      x.fillStyle = torque > hi ? '#d0021b' : '#4a6a8a'; x.fillRect(bx, by, bw * Math.max(0, Math.min(100, torque + jitter)) / 100, bh);
      x.strokeStyle = '#111'; x.lineWidth = 2; x.strokeRect(bx, by, bw, bh);
      font(x, 13); x.fillStyle = '#111'; x.textAlign = 'left'; x.fillText('loose', bx, by - 4); x.textAlign = 'right'; x.fillText('cracked', bx + bw, by - 4);
      x.textAlign = 'center'; font(x, 22, true); x.fillText(`${Math.round(torque + jitter)}`, W / 2, 40);
    })(performance.now());
  });
}

// ---- INDICATE: the needle swings with the runout. Tap the part when the needle is at its peak.
export function indicate(opts) {
  return new Promise((resolve) => {
    const f = opts.fatigue || 0;
    const { c, x, foot } = setup(opts, opts.label || 'Indicate it in', 'tap the part when the needle peaks · 5 taps · get under half a thou');
    let off = (0.007 + Math.random() * 0.005) * (Math.random() < 0.5 ? -1 : 1); // inches of runout
    const tol = 0.0005, omega = 2.6 + f * 1.6;
    let taps = 5, t0 = performance.now(), done = false, lag = 0, flash = 0;
    const reading = (now) => off * Math.sin((now - t0) / 1000 * omega);
    const end = (ok, note) => { if (done) return; done = true; cleanup(); foot.textContent = note; if (ok) opts.audio.ding(); else opts.audio.nope(); setTimeout(() => resolve({ ok, note }), 650); };
    const tap = (e) => {
      if (e.type === 'keydown' && e.code !== 'Space') return; e.preventDefault();
      if (done) return;
      const r = reading(performance.now());
      // a tap pushes the part away from the high spot by most of what the needle shows right now
      off -= r * 0.85; taps--; flash = 1; opts.audio.thunk();
      if (Math.abs(off) < tol) end(true, `${(Math.abs(off) * 1000).toFixed(2)} thou. Good enough for government work.`);
      else if (taps <= 0) end(false, `${(Math.abs(off) * 1000).toFixed(1)} thou out. You called it close enough.`);
    };
    c.addEventListener('pointerdown', tap); window.addEventListener('keydown', tap);
    const cleanup = () => { c.removeEventListener('pointerdown', tap); window.removeEventListener('keydown', tap); };
    (function frame(now) {
      if (done) return; requestAnimationFrame(frame);
      if (now - t0 > 12000) end(false, 'The indicator fell off. You moved on.');
      const r = reading(now); lag += (r - lag) * (1 - f * 0.6); // tired: the needle you see lags the one that is true
      flash *= 0.9;
      x.fillStyle = '#f3efe4'; x.fillRect(0, 0, W, H);
      // the dial
      const cx = 120, cy = 100, R = 70;
      x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#111'; x.lineWidth = 3; x.stroke();
      for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2 - Math.PI / 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4)); x.lineTo(cx + Math.cos(a) * (R - (i % 5 ? 9 : 14)), cy + Math.sin(a) * (R - (i % 5 ? 9 : 14))); x.strokeStyle = '#111'; x.lineWidth = i % 5 ? 1 : 2; x.stroke(); }
      x.fillStyle = 'rgba(46,204,64,.3)'; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R - 4, -Math.PI / 2 - 0.12, -Math.PI / 2 + 0.12); x.fill();
      const na = -Math.PI / 2 + (lag / 0.012) * (Math.PI * 0.9) + (Math.random() - 0.5) * f * 0.08;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(na) * (R - 8), cy + Math.sin(na) * (R - 8)); x.strokeStyle = '#d0021b'; x.lineWidth = 2.5; x.stroke();
      x.beginPath(); x.arc(cx, cy, 5, 0, Math.PI * 2); x.fillStyle = '#111'; x.fill();
      font(x, 11); x.fillStyle = '#555'; x.textAlign = 'center'; x.fillText('.001"', cx, cy + 30);
      // the part on the table, with the high spot marked
      x.fillStyle = '#8a8f94'; x.fillRect(240, 70, 120, 60);
      x.fillStyle = flash > 0.05 ? `rgba(208,2,27,${flash})` : 'rgba(0,0,0,0)'; x.fillRect(240, 70, 120, 60);
      x.fillStyle = '#333'; x.fillRect(230, 130, 150, 14);
      x.save(); x.translate(300, 100); x.rotate(off > 0 ? 0 : Math.PI); x.fillStyle = '#d0021b'; x.beginPath(); x.moveTo(60, 0); x.lineTo(44, -8); x.lineTo(44, 8); x.fill(); x.restore();
      font(x, 15, true); x.fillStyle = '#111'; x.textAlign = 'left'; x.fillText(`reading ${(Math.abs(lag) * 1000).toFixed(1)} thou`, 230, 40);
      font(x, 13); x.fillText(`taps left: ${taps}`, 230, 165);
    })(performance.now());
  });
}

// ---- SPEED: the pointer sweeps the RPM dial. Stop it in the green. The card says what the green is.
export function speed(opts) {
  return new Promise((resolve) => {
    const f = opts.fatigue || 0;
    const { c, x, foot } = setup(opts, opts.label || 'Pick a speed', 'click or space to stop the pointer in the green');
    const cards = [
      ['1/2" carbide end mill', 'P20, 30 HRC', 1900], ['3/8" HSS end mill', 'aluminum', 2400], ['1" face mill', 'P20', 900], ['1/4" carbide end mill', 'S7, hard', 1400],
      ['#3 centre drill', 'mild steel', 1500], ['1/2" HSS drill', '4140', 650], ['3/4" roughing end mill', 'P20', 700], ['1/8" ball end mill', 'graphite', 2900],
    ];
    const card = cards[Math.floor(Math.random() * cards.length)];
    const target = card[2], max = 3000, band = 220 - f * 80;
    // tired: the number on the card is sometimes not the number on the card
    const shown = f > 0 && Math.random() < f * 0.5 ? target + (Math.random() < 0.5 ? -1 : 1) * (300 + Math.round(Math.random() * 500)) : target;
    let t0 = performance.now(), done = false, rpm = 0;
    const sweep = 1.3 + f * 0.9; // sweeps per second
    const end = (ok, note) => { if (done) return; done = true; cleanup(); foot.textContent = note; if (ok) opts.audio.ding(); else opts.audio.nope(); setTimeout(() => resolve({ ok, note }), 650); };
    const stop = (e) => { if (e.type === 'keydown' && e.code !== 'Space') return; e.preventDefault(); if (done) return; opts.audio.click(); if (Math.abs(rpm - target) <= band) end(true, `${Math.round(rpm)} rpm. The chip colour is right.`); else end(false, rpm > target ? `${Math.round(rpm)} rpm. Smoke. That cutter is blue now.` : `${Math.round(rpm)} rpm. Chatter. It is rubbing, not cutting.`); };
    c.addEventListener('pointerdown', stop); window.addEventListener('keydown', stop);
    const cleanup = () => { c.removeEventListener('pointerdown', stop); window.removeEventListener('keydown', stop); };
    (function frame(now) {
      if (done) return; requestAnimationFrame(frame);
      const k = (now - t0) / 1000 * sweep; rpm = max * (0.5 - 0.5 * Math.cos(k * Math.PI));
      if (now - t0 > 10000) end(false, 'You picked something. Nobody saw what.');
      x.fillStyle = '#f3efe4'; x.fillRect(0, 0, W, H);
      // the card
      x.fillStyle = '#fff'; x.fillRect(16, 16, 170, 110); x.strokeStyle = '#111'; x.lineWidth = 2; x.strokeRect(16, 16, 170, 110);
      font(x, 12); x.fillStyle = '#555'; x.textAlign = 'left'; x.fillText('SPEEDS & FEEDS', 26, 36);
      font(x, 13, true); x.fillStyle = '#111'; x.fillText(card[0], 26, 58); font(x, 13); x.fillText(card[1], 26, 78);
      font(x, 20, true); x.fillText(`${shown} rpm`, 26, 110);
      // the dial: an arc from 0 to 3000
      const cx = 300, cy = 165, R = 118;
      const ang = (v) => Math.PI + Math.PI * (v / max); // left (0) over the top to right (3000)
      x.beginPath(); x.arc(cx, cy, R, Math.PI, Math.PI * 2); x.strokeStyle = '#bbb'; x.lineWidth = 16; x.stroke();
      x.beginPath(); x.arc(cx, cy, R, ang(target - band), ang(target + band)); x.strokeStyle = 'rgba(46,204,64,.8)'; x.lineWidth = 16; x.stroke();
      for (let v = 0; v <= max; v += 500) { const a = ang(v); x.beginPath(); x.moveTo(cx + Math.cos(a) * (R - 14), cy + Math.sin(a) * (R - 14)); x.lineTo(cx + Math.cos(a) * (R - 24), cy + Math.sin(a) * (R - 24)); x.strokeStyle = '#111'; x.lineWidth = 2; x.stroke(); font(x, 10); x.fillStyle = '#333'; x.textAlign = 'center'; x.fillText(v, cx + Math.cos(a) * (R - 36), cy + Math.sin(a) * (R - 36) + 4); }
      const pa = ang(rpm); x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(pa) * (R - 4), cy + Math.sin(pa) * (R - 4)); x.strokeStyle = '#d0021b'; x.lineWidth = 3; x.stroke();
      x.beginPath(); x.arc(cx, cy, 6, 0, Math.PI * 2); x.fillStyle = '#111'; x.fill();
      font(x, 16, true); x.fillStyle = '#111'; x.textAlign = 'center'; x.fillText(`${Math.round(rpm)}`, cx, cy - 20);
    })(performance.now());
  });
}

// ---- PROBE: the touch probe comes down on the part. Stop it at contact. Early and the offsets
// are wrong; late and you have bought a stylus.
export function probe(opts) {
  return new Promise((resolve) => {
    const f = opts.fatigue || 0;
    const { c, x, foot } = setup(opts, opts.label || 'Probe the part', 'click or space when the ruby touches the top of the block');
    const topY = 118, start = 30; let y = start, v = 28 + f * 20, done = false, t0 = performance.now(), lag = 0;
    const end = (ok, note) => { if (done) return; done = true; cleanup(); foot.textContent = note; if (ok) opts.audio.ding(); else opts.audio.nope(); setTimeout(() => resolve({ ok, note }), 650); };
    const stop = (e) => { if (e.type === 'keydown' && e.code !== 'Space') return; e.preventDefault(); if (done) return;
      const d = (topY - y) / 60; // mm, roughly
      if (d > 0.35) end(false, `Stopped ${d.toFixed(2)} mm short. The offsets are wherever they were.`); else if (d < -0.25) end(false, 'Crunch. That was a $900 stylus.'); else end(true, `Touched. ${Math.abs(d).toFixed(2)} mm. Offsets set.`); };
    c.addEventListener('pointerdown', stop); window.addEventListener('keydown', stop);
    const cleanup = () => { c.removeEventListener('pointerdown', stop); window.removeEventListener('keydown', stop); };
    let last = performance.now();
    (function frame(now) {
      if (done) return; requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      y += v * dt; v += 6 * dt; // it accelerates, a little, the way the real one seems to
      lag += ((y - lag) * (1 - f * 0.5)); lag = y - (y - lag) * f * 0.5; // tired: what you see trails what is true
      if (y > topY + 20) end(false, 'Crunch. That was a $900 stylus.');
      x.fillStyle = '#f3efe4'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#8a8f94'; x.fillRect(150, topY, 120, 60); x.fillStyle = '#333'; x.fillRect(100, topY + 60, 220, 12); // block on the table
      x.fillStyle = '#4a6a8a'; x.fillRect(195, 0, 30, 24); x.fillStyle = '#cfd4d8'; x.fillRect(205, 24, 10, Math.max(0, lag - 30)); // spindle and stylus shank
      x.fillStyle = '#d0021b'; x.beginPath(); x.arc(210, lag, 4, 0, Math.PI * 2); x.fill(); // the ruby
      font(x, 14, true); x.fillStyle = '#111'; x.textAlign = 'left'; x.fillText(`${((topY - lag) / 60).toFixed(2)} mm to go`, 300, 60);
      font(x, 12); x.fillStyle = '#555'; x.fillText('Z', 300, 85);
    })(performance.now());
  });
}

// ---- PROGRAM: pick the right file. The list has every program this shop ever made, named the way
// programs are named. The right one has this job's number in it and matches the operation.
export function program(opts) {
  return new Promise((resolve) => {
    const f = opts.fatigue || 0, job = opts.job || 1000, op = opts.op || 'FINISH';
    const el = opts.el; el.innerHTML = '';
    const head = document.createElement('div'); head.className = 'mgHead'; head.innerHTML = `<b>${opts.label || 'Select the program'}</b><span>job ${job} · ${op.toLowerCase()} · you have ten seconds</span>`; el.appendChild(head);
    const ops = ['ROUGH', 'FINISH', 'DRILL', 'POCKET', 'BURN', 'WIRE', 'FACE'];
    const other = () => `O${1000 + Math.floor(Math.random() * 9000)}_${job - Math.floor(Math.random() * 40) - 1}_${ops[Math.floor(Math.random() * ops.length)]}.NC`;
    const decoys = [`O${job}_${ops.filter((o) => o !== op)[Math.floor(Math.random() * (ops.length - 1))]}.NC`, `O${job + 1}_${op}.NC`, `${job}_${op}_OLD.NC`, 'NEW_FINAL_v2_USE_THIS.NC', 'TEST.NC', other(), other(), `O${job}_${op}_DO_NOT_RUN.NC`];
    const right = `O${job}_${op}.NC`;
    const list = [...decoys.slice(0, 5 + Math.round(f * 3)), right].sort(() => Math.random() - 0.5);
    const ul = document.createElement('ul'); ul.className = 'files'; el.appendChild(ul);
    let done = false; const t0 = performance.now();
    const end = (ok, note) => { if (done) return; done = true; clearInterval(tick); foot.textContent = note; if (ok) opts.audio.ding(); else opts.audio.nope(); setTimeout(() => resolve({ ok, note }), 650); };
    for (const name of list) { const li = document.createElement('li'); li.textContent = name; li.addEventListener('click', () => { opts.audio.click(); if (name === right) end(true, `${name}. That is the one.`); else end(false, name === 'NEW_FINAL_v2_USE_THIS.NC' ? 'NEW_FINAL_v2_USE_THIS. It was not.' : `${name}. A lovely program for a different part.`); }); ul.appendChild(li); }
    const foot = document.createElement('div'); foot.className = 'mgFoot'; el.appendChild(foot);
    const tick = setInterval(() => { const left = 10 - (performance.now() - t0) / 1000; foot.textContent = `${Math.max(0, left).toFixed(1)} s`; if (f > 0.4 && Math.random() < 0.08) { const items = [...ul.children]; const i = Math.floor(Math.random() * items.length), j = Math.floor(Math.random() * items.length); if (i !== j) ul.insertBefore(items[i], items[j]); } if (left <= 0) end(false, 'You picked something. Nobody saw what.'); }, 100);
  });
}

export const GAMES = { clamp, indicate, speed, probe, program };
export function play(kind, opts) { return GAMES[kind](opts); }
