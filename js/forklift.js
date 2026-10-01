import { mergeStatic } from './merge.js';
// The forklift. Yellow, loud, and yours. Press E to get on, WASD to drive, H for the horn, E to get off.
// It does not lift anything in this build. It does hit things.
import * as TX from './textures.js';

export function buildForklift(T) {
  const g = new T.Group();
  const yel = new T.MeshStandardMaterial({ color: 0xe8b21a, roughness: 0.55, metalness: 0.2 }), dark = new T.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.8 });
  const steel = new T.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.6, roughness: 0.4 }), rubber = new T.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
  const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cyl = (r, h, m, x, y, z, rz = 0, rx = 0) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, 18), m); o.position.set(x, y, z); o.rotation.z = rz; o.rotation.x = rx; g.add(o); return o; };
  // +z is forward (the forks). the counterweight is at the back.
  box(1.1, 0.5, 1.6, yel, 0, 0.55, -0.3);                               // body
  box(1.0, 0.45, 0.5, yel, 0, 0.6, -1.15);                              // counterweight
  box(0.9, 0.1, 0.9, dark, 0, 0.82, -0.35);                             // floor plate
  box(0.5, 0.12, 0.5, dark, 0, 0.98, -0.55); box(0.5, 0.45, 0.1, dark, 0, 1.25, -0.8); // seat and back
  for (const [x, z] of [[-0.45, 0.25], [0.45, 0.25], [-0.45, -1.0], [0.45, -1.0]]) cyl(0.025, 1.9, steel, x, 1.4, z); // overhead guard posts
  box(1.0, 0.04, 1.4, steel, 0, 2.35, -0.38);                           // roof
  for (let i = 0; i < 4; i++) box(0.9, 0.02, 0.06, steel, 0, 2.34, 0.2 - i * 0.4); // roof slats
  const wheel = cyl(0.14, 0.03, dark, 0, 1.25, -0.2, 0, -0.9); wheel.rotation.x = -0.9; // steering wheel
  cyl(0.02, 0.3, steel, 0, 1.1, -0.1, 0, 0.6);                          // column
  // mast: two channels, a cross, the carriage and two forks
  for (const x of [-0.3, 0.3]) box(0.08, 2.2, 0.1, steel, x, 1.15, 0.55);
  box(0.75, 0.08, 0.1, steel, 0, 2.2, 0.55); box(0.75, 0.08, 0.1, steel, 0, 0.3, 0.55);
  box(0.8, 0.4, 0.06, dark, 0, 0.45, 0.62);                             // carriage
  for (const x of [-0.25, 0.25]) { box(0.1, 0.04, 1.1, steel, x, 0.08, 1.2); box(0.1, 0.3, 0.04, steel, x, 0.22, 0.66); } // forks
  cyl(0.03, 1.8, dark, 0.45, 1.2, 0.5); cyl(0.03, 1.8, dark, -0.45, 1.2, 0.5); // lift cylinders
  // wheels
  for (const [x, z, r] of [[-0.55, 0.15, 0.26], [0.55, 0.15, 0.26], [-0.45, -1.0, 0.2], [0.45, -1.0, 0.2]]) { cyl(r, 0.22, rubber, x, r, z, Math.PI / 2); cyl(r * 0.5, 0.24, steel, x, r, z, Math.PI / 2); }
  const beacon = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.1, 10), new T.MeshStandardMaterial({ color: 0xffa020, emissive: 0xff8000, emissiveIntensity: 0 })); beacon.position.set(-0.35, 2.42, -0.9); g.add(beacon); g.userData.beacon = beacon;
  const plate = new T.Mesh(new T.PlaneGeometry(0.5, 0.2), new T.MeshBasicMaterial({ map: TX.label(T, ['CERTIFIED', 'OPERATORS', 'ONLY'], { size: 24, bg: '#e8b21a', border: '#333', fg: '#111' }) })); plate.position.set(0, 0.6, -1.41); plate.rotation.y = Math.PI; g.add(plate);
  g.traverse((o) => { o.userData.interact = { type: 'forklift', text: 'the forklift. certified operators only. you are the certifying body.' }; });
  mergeStatic(T, g, [beacon]);
  return g;
}

export class Forklift {
  constructor(T, scene, shop, audio, hooks) {
    this.T = T; this.shop = shop; this.audio = audio; this.hooks = hooks;
    this.g = buildForklift(T); scene.add(this.g);
    this.pos = { x: shop.door.x - 3.0, z: shop.hz - 3.2 }; this.yaw = 0.35; this.speed = 0; this.driving = false; this.beepT = 0; this.bumpT = 0; this.t = 0;
    this.collider = { x: this.pos.x, z: this.pos.z, hw: 0.75, hd: 1.2 }; shop.colliders.push(this.collider);
    this.place();
  }
  place() { this.g.position.set(this.pos.x, 0, this.pos.z); this.g.rotation.y = this.yaw; this.collider.x = this.pos.x; this.collider.z = this.pos.z; this.collider.hw = this.driving ? 0 : 0.9; this.collider.hd = this.driving ? 0 : 1.0; }
  mount() { this.driving = true; this.speed = 0; this.place(); }
  dismount() { this.driving = false; this.speed = 0; this.place(); return { x: this.pos.x - Math.cos(this.yaw) * 1.3, z: this.pos.z + Math.sin(this.yaw) * 1.3 }; }
  // keys: a Set of key codes. colliders: machines and fixtures (not this). people: [{x,z,p}]. returns nothing; calls hooks.bump(uid), hooks.scare(p)
  update(dt, keys, colliders, bounds, people) {
    this.t += dt; const b = this.g.userData.beacon; if (b) b.material.emissiveIntensity = this.driving ? (Math.sin(this.t * 6) > 0 ? 2 : 0) : 0;
    if (!this.driving) return;
    const fwd = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0), turn = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0);
    const max = 3.2; this.speed += fwd * 4.5 * dt; if (!fwd) this.speed -= Math.sign(this.speed) * Math.min(Math.abs(this.speed), 3 * dt);
    this.speed = Math.max(-max * 0.6, Math.min(max, this.speed));
    if (Math.abs(this.speed) > 0.05) this.yaw += turn * 1.6 * dt * Math.sign(this.speed);
    let nx = this.pos.x + Math.sin(this.yaw) * this.speed * dt, nz = this.pos.z + Math.cos(this.yaw) * this.speed * dt;
    const r = 0.9, inset = 1.0;
    nx = Math.max(-bounds.hx + inset, Math.min(bounds.hx - inset, nx)); nz = Math.max(-bounds.hz + inset, Math.min(bounds.hz - inset, nz));
    for (const c of colliders) {
      if (c === this.collider) continue;
      const hw = c.hw + r, hd = c.hd + r, ox = nx - c.x, oz = nz - c.z;
      if (Math.abs(ox) < hw && Math.abs(oz) < hd) {
        const px = hw - Math.abs(ox), pz = hd - Math.abs(oz);
        if (px < pz) nx = c.x + Math.sign(ox || 1) * hw; else nz = c.z + Math.sign(oz || 1) * hd;
        if (Math.abs(this.speed) > 1.2 && this.t - this.bumpT > 1.5) { this.bumpT = this.t; this.hooks.bump(c, Math.abs(this.speed)); }
        this.speed *= -0.2;
      }
    }
    this.pos.x = nx; this.pos.z = nz; this.place();
    if (this.speed < -0.3) { this.beepT += dt; if (this.beepT > 0.8) { this.beepT = 0; this.audio.tone(1400, 0.25, 0.05, 'square'); } }
    if (Math.abs(this.speed) > 0.3) for (const q of people) { if (Math.hypot(q.x - nx, q.z - nz) < 1.6 && (!q.scaredAt || this.t - q.scaredAt > 4)) { q.scaredAt = this.t; this.hooks.scare(q.p); } }
  }
  // the forks. a crate within reach of the tips comes up; F again puts it down where the forks are.
  forkTip() { return { x: this.pos.x + Math.sin(this.yaw) * 1.4, z: this.pos.z + Math.cos(this.yaw) * 1.4 }; }
  lift(crates, scene) {
    if (this.carry) return null; const tip = this.forkTip(); let best = null, bd = 1.3;
    for (const g of crates) { const d = Math.hypot(g.position.x - tip.x, g.position.z - tip.z); if (d < bd) { bd = d; best = g; } }
    if (!best) return null;
    scene.remove(best); this.g.add(best); best.position.set(0, 0.34, 1.25); best.rotation.set(0, 0, 0); this.carry = best; this.liftT = this.t;
    this.audio.tone(90, 0.6, 0.08, 'sawtooth'); return best;
  }
  drop(scene) {
    const g = this.carry; if (!g) return null; const tip = this.forkTip();
    this.g.remove(g); scene.add(g); g.position.set(tip.x, 0, tip.z); g.rotation.set(0, this.yaw, 0); this.carry = null;
    this.audio.thunk(); return g;
  }
  honk() { this.audio.tone(330, 0.35, 0.09, 'sawtooth'); this.audio.tone(415, 0.35, 0.07, 'sawtooth'); }
  seat() { return { x: this.pos.x - Math.sin(this.yaw) * 0.5, y: 1.9, z: this.pos.z - Math.cos(this.yaw) * 0.5 }; }
}
