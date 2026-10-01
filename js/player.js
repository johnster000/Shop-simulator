// You. On the floor. Adapted from Buy Stove's kitchen legs; the jump is gone, the shop is bigger.

export class Player {
  constructor(T, camera, canvas) {
    this.T = T; this.camera = camera; this.canvas = canvas;
    this.yaw = 0; this.pitch = -0.05;
    this.lockTime = 0; this.keys = new Set();
    this.speed = 2.4; this.eyeHeight = 1.65; this.bobT = 0; this.stepAcc = 0;
    this.enabled = false; this.onStep = null; this.onTap = null;
    this.touch = matchMedia('(pointer: coarse)').matches && 'ontouchstart' in window;
    this.dragLook = false; this.dragging = false; this.dragMoved = 0; this.onDragFallback = null;
    this.everLocked = false; this.onLockRetry = null; this.skipNext = false;
    this.joy = { active: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
    this.look = { active: false, id: null, lx: 0, ly: 0, moved: 0, t0: 0 };
    this.bind();
  }

  get locked() { return document.pointerLockElement === this.canvas; }

  bind() {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('pointerlockchange', () => { this.lockTime = performance.now(); this.skipNext = true; if (this.locked) this.everLocked = true; });
    document.addEventListener('pointerlockerror', () => { if (this.everLocked) { if (this.onLockRetry) this.onLockRetry(); } else this.enableDragLook(); });
    this.canvas.addEventListener('mousedown', (e) => { if (e.button === 0 && this.dragLook) { this.dragging = true; this.dragMoved = 0; } });
    document.addEventListener('mouseup', () => { this.dragging = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.dragLook) {
        if (!this.dragging) return;
        this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
        this.yaw -= e.movementX * 0.004; this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - e.movementY * 0.004));
        return;
      }
      if (!this.locked) return;
      if (this.skipNext) { this.skipNext = false; return; }
      if (performance.now() - (this.lockTime || 0) < 400) return;
      if (Math.abs(e.movementX) > 200 || Math.abs(e.movementY) > 200) return;
      this.yaw -= e.movementX * 0.0022; this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });

    if (this.touch) {
      document.body.classList.add('touch');
      const knob = document.querySelector('#touch .knob');
      const opt = { passive: false };
      this.canvas.addEventListener('touchstart', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (t.clientX < innerWidth * 0.45 && !this.joy.active) {
            this.joy.active = true; this.joy.id = t.identifier; this.joy.ox = t.clientX; this.joy.oy = t.clientY; this.joy.dx = 0; this.joy.dy = 0;
          } else if (!this.look.active) {
            this.look.active = true; this.look.id = t.identifier; this.look.lx = t.clientX; this.look.ly = t.clientY; this.look.moved = 0; this.look.t0 = performance.now();
          }
        }
      }, opt);
      this.canvas.addEventListener('touchmove', (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        for (const t of e.changedTouches) {
          if (this.joy.active && t.identifier === this.joy.id) {
            this.joy.dx = Math.max(-1, Math.min(1, (t.clientX - this.joy.ox) / 50));
            this.joy.dy = Math.max(-1, Math.min(1, (t.clientY - this.joy.oy) / 50));
            if (knob) { knob.style.left = (40 + this.joy.dx * 35) + 'px'; knob.style.top = (40 + this.joy.dy * 35) + 'px'; }
          } else if (this.look.active && t.identifier === this.look.id) {
            const dx = t.clientX - this.look.lx, dy = t.clientY - this.look.ly;
            this.look.lx = t.clientX; this.look.ly = t.clientY; this.look.moved += Math.abs(dx) + Math.abs(dy);
            this.yaw -= dx * 0.005; this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch - dy * 0.005));
          }
        }
      }, opt);
      const end = (e) => {
        for (const t of e.changedTouches) {
          if (this.joy.active && t.identifier === this.joy.id) { this.joy.active = false; this.joy.dx = 0; this.joy.dy = 0; if (knob) { knob.style.left = '40px'; knob.style.top = '40px'; } }
          else if (this.look.active && t.identifier === this.look.id) {
            this.look.active = false;
            if (this.look.moved < 12 && performance.now() - this.look.t0 < 400 && this.onTap) this.onTap();
          }
        }
      };
      this.canvas.addEventListener('touchend', end); this.canvas.addEventListener('touchcancel', end);
    }
  }

  enableDragLook() { if (this.dragLook || this.touch) return; this.dragLook = true; this.enabled = true; if (this.onDragFallback) this.onDragFallback(); }

  requestLock() {
    if (this.touch || this.dragLook) return;
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => { if (this.everLocked) { if (this.onLockRetry) this.onLockRetry(); } else this.enableDragLook(); });
    } catch (e) { if (!this.everLocked) this.enableDragLook(); return; }
    setTimeout(() => { if (!this.locked) { if (this.everLocked) { if (this.onLockRetry) this.onLockRetry(); } else this.enableDragLook(); } }, 1200);
  }

  // colliders: axis-aligned boxes { x, z, hw, hd }. bounds: { hx, hz } half sizes of the building.
  update(dt, colliders, bounds) {
    const cam = this.camera;
    if (!this.enabled) return;
    let fx = 0, fz = 0; const k = this.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) fz -= 1;
    if (k.has('KeyS') || k.has('ArrowDown')) fz += 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) fx -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) fx += 1;
    if (this.joy.active) { fx += this.joy.dx; fz += this.joy.dy; }
    const len = Math.hypot(fx, fz); if (len > 1) { fx /= len; fz /= len; }
    const moving = len > 0.05;
    const sprint = (k.has('ShiftLeft') || k.has('ShiftRight')) && moving;
    const spd = this.speed * (sprint ? 1.8 : 1);
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const dx = (fx * cos + fz * sin) * spd * dt, dz = (-fx * sin + fz * cos) * spd * dt;
    let nx = cam.position.x + dx, nz = cam.position.z + dz;
    const inset = 0.4;
    nx = Math.max(-bounds.hx + inset, Math.min(bounds.hx - inset, nx));
    nz = Math.max(-bounds.hz + inset, Math.min(bounds.hz - inset, nz));
    const r = 0.3;
    for (const b of colliders) {
      const hw = b.hw + r, hd = b.hd + r;
      const ox = nx - b.x, oz = nz - b.z;
      if (Math.abs(ox) < hw && Math.abs(oz) < hd) {
        const px = hw - Math.abs(ox), pz = hd - Math.abs(oz);
        if (px < pz) nx = b.x + Math.sign(ox || 1) * hw; else nz = b.z + Math.sign(oz || 1) * hd;
      }
    }
    cam.position.x = nx; cam.position.z = nz;
    if (moving) {
      this.bobT += dt * (sprint ? 13 : 9); this.stepAcc += Math.hypot(dx, dz);
      if (this.stepAcc > 0.75) { this.stepAcc = 0; if (this.onStep) this.onStep(); }
    } else this.bobT += (Math.round(this.bobT / Math.PI) * Math.PI - this.bobT) * Math.min(1, dt * 8);
    cam.position.y = this.eyeHeight + Math.sin(this.bobT) * 0.025 * (moving ? 1 : 0.3);
    cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
