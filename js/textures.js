// Canvas textures. Nothing is loaded; everything is drawn.

export function canvasTexture(T, w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace;
  return t;
}

export function concrete(T) {
  const t = canvasTexture(T, 512, 512, (x, w, h) => {
    x.fillStyle = '#7f7e79'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},${Math.random() < 0.5 ? 0 : 255},${Math.random() * 0.05})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (let i = 0; i < 8; i++) { x.fillStyle = `rgba(60,55,50,${0.025 + Math.random() * 0.035})`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 90, 20 + Math.random() * 60, Math.random() * 3, 0, Math.PI * 2); x.fill(); }
    // control joints
    x.strokeStyle = 'rgba(40,40,40,.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke();
    // a crack
    x.strokeStyle = 'rgba(30,30,30,.5)'; x.lineWidth = 1.5; x.beginPath(); let px = 60, py = 400; x.moveTo(px, py);
    for (let i = 0; i < 12; i++) { px += 14 + Math.random() * 10; py += (Math.random() - 0.4) * 24; x.lineTo(px, py); } x.stroke();
  });
  t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}

export function block(T) {
  const t = canvasTexture(T, 512, 256, (x, w, h) => {
    x.fillStyle = '#6f6d66'; x.fillRect(0, 0, w, h);
    const bw = 128, bh = 64;
    for (let r = 0; r < h / bh; r++) for (let c = -1; c < w / bw + 1; c++) {
      const ox = (r % 2) * bw / 2;
      const g = 128 + Math.random() * 26;
      x.fillStyle = `rgb(${g},${g - 3},${g - 10})`; x.fillRect(c * bw + ox + 3, r * bh + 3, bw - 6, bh - 6);
      x.fillStyle = 'rgba(0,0,0,.08)'; x.fillRect(c * bw + ox + 3, r * bh + bh - 10, bw - 6, 7);
    }
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    // the grime line where the floor sweeper hits the wall
    x.fillStyle = 'rgba(40,35,30,.25)'; x.fillRect(0, h - 18, w, 18);
  });
  t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}

export function tarp(T) {
  const t = canvasTexture(T, 128, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#dcd6c4'); g.addColorStop(1, '#b8b1a0');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 2; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(i * 24 + 8, 0); x.lineTo(i * 24 + 8, h); x.stroke(); }
    x.fillStyle = 'rgba(70,60,40,.35)'; x.fillRect(0, h - 70, w, 70);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, w, 14);
  });
  return t;
}

export function outside(T) {
  return canvasTexture(T, 1024, 512, (x, w, h) => {
    const sky = x.createLinearGradient(0, 0, 0, h * 0.6); sky.addColorStop(0, '#9fc3e6'); sky.addColorStop(1, '#dfe9f2');
    x.fillStyle = sky; x.fillRect(0, 0, w, h * 0.6);
    x.fillStyle = '#6f6f6c'; x.fillRect(0, h * 0.6, w, h * 0.4);
    for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; x.fillRect(Math.random() * w, h * 0.6 + Math.random() * h * 0.4, 3, 2); }
    x.fillStyle = '#9a9890'; x.fillRect(0, h * 0.58, w, 12);
    // a neighbour's building and a dumpster
    x.fillStyle = '#7a8a94'; x.fillRect(w * 0.62, h * 0.33, w * 0.4, h * 0.27);
    x.fillStyle = '#2f6b3a'; x.fillRect(w * 0.08, h * 0.5, 140, 60); x.fillStyle = '#245630'; x.fillRect(w * 0.08, h * 0.48, 140, 12);
  });
}

export function label(T, lines, opts = {}) {
  const w = opts.w || 256, h = opts.h || 128;
  return canvasTexture(T, w, h, (x) => {
    x.fillStyle = opts.bg || '#e8e4d8'; x.fillRect(0, 0, w, h);
    x.strokeStyle = opts.border || '#333'; x.lineWidth = 6; x.strokeRect(6, 6, w - 12, h - 12);
    x.fillStyle = opts.fg || '#111'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((l, i) => {
      x.font = `${i === 0 ? 'bold ' : ''}${opts.size || (i === 0 ? 34 : 22)}px "Courier New", monospace`;
      x.fillText(l, w / 2, h * (i + 1) / (n + 1));
    });
  });
}

export function sign(T, text) {
  const w = 1024, h = 192;
  return canvasTexture(T, w, h, (x) => {
    x.fillStyle = '#1d2a36'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#d8b24a'; x.lineWidth = 10; x.strokeRect(10, 10, w - 20, h - 20);
    x.fillStyle = '#f1eee5'; x.textAlign = 'center'; x.textBaseline = 'middle';
    let size = 96; x.font = `bold ${size}px "Courier New", monospace`;
    while (x.measureText(text.toUpperCase()).width > w - 80 && size > 30) { size -= 6; x.font = `bold ${size}px "Courier New", monospace`; }
    x.fillText(text.toUpperCase(), w / 2, h / 2 - 8);
    x.font = '26px "Courier New", monospace'; x.fillStyle = '#d8b24a'; x.fillText('MOLD · TOOL · DIE', w / 2, h - 36);
  });
}

export function whiteboard(T, lines) {
  return canvasTexture(T, 512, 320, (x, w, h) => {
    x.fillStyle = '#f7f7f4'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1c3a8a'; x.font = '26px "Comic Sans MS", "Chalkboard SE", cursive';
    lines.forEach((l, i) => { x.save(); x.translate(26, 46 + i * 44); x.rotate((Math.random() - 0.5) * 0.04); x.fillText(l, 0, 0); x.restore(); });
    x.strokeStyle = '#c0392b'; x.lineWidth = 3; x.beginPath(); x.moveTo(300, 60); x.lineTo(470, 60); x.stroke();
  });
}

export function screen(T, lines) {
  return canvasTexture(T, 256, 192, (x, w, h) => {
    x.fillStyle = '#0b1a2a'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#7ad0ff'; x.font = 'bold 16px "Courier New", monospace'; x.textBaseline = 'top';
    lines.forEach((l, i) => x.fillText(l, 12, 14 + i * 22));
    x.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1);
  });
}

// chips. a drift of curls and needles around the base of a machine. alpha everywhere else.
export function chips(T) {
  return canvasTexture(T, 256, 256, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    const g = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(90,96,104,0.75)'); g.addColorStop(0.7, 'rgba(90,96,104,0.35)'); g.addColorStop(1, 'rgba(90,96,104,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6) * w * 0.48, px = w / 2 + Math.cos(a) * r, py = h / 2 + Math.sin(a) * r;
      const v = 120 + Math.random() * 100 | 0, tint = Math.random() < 0.15 ? [v + 30, v + 10, v - 30] : Math.random() < 0.1 ? [v - 10, v - 5, v + 25] : [v, v + 2, v + 6]; // steel, a few straw-coloured, a few blued
      x.strokeStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${0.5 + Math.random() * 0.5})`; x.lineWidth = 1 + Math.random();
      x.beginPath(); if (Math.random() < 0.5) { x.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * (1 + Math.random())); } else { x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 8, py + (Math.random() - 0.5) * 8); } x.stroke();
    }
  });
}
