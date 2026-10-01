// The overhead view, and placing machines in it.
import { byId } from './catalog.js';
import { buildMachine, halfSizes } from './machines.js';

export class Iso {
  constructor(T, scene, shop, canvas) {
    this.T = T; this.scene = scene; this.shop = shop; this.canvas = canvas;
    this.active = false;
    this.camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    this.camera.position.set(14, 16, 14); this.camera.lookAt(0, 0, 0);
    this.fit();
    this.ray = new T.Raycaster(); this.ptr = new T.Vector2(); this.floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.pending = null; this.ghost = null; this.ghostMat = null; this.valid = false; this.why = '';
    this.hover = { x: 0, z: 0 }; this.hasPointer = false;
    this.onPlace = null; this.onPick = null;
    canvas.addEventListener('pointermove', (e) => { if (!this.active) return; this.setPointer(e.clientX, e.clientY); this.hasPointer = true; });
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.active || e.button !== 0) return;
      this.setPointer(e.clientX, e.clientY); this.hasPointer = true;
      if (this.pending) { this.updateGhost(); if (this.valid && this.onPlace) this.onPlace(this.pending, this.hover.x, this.hover.z, this.rot); }
      else if (this.onPick) { const uid = this.pickMachine(); if (uid != null) this.onPick(uid); }
    });
    this.rot = 0;
  }

  fit() {
    const aspect = innerWidth / innerHeight, span = aspect >= 1 ? 12.5 : 12.5 / aspect; // portrait: fit by width
    this.camera.left = -span * aspect; this.camera.right = span * aspect; this.camera.top = span; this.camera.bottom = -span;
    this.camera.updateProjectionMatrix();
  }

  setPointer(cx, cy) { this.ptr.x = (cx / innerWidth) * 2 - 1; this.ptr.y = -(cy / innerHeight) * 2 + 1; }

  floorHit() {
    this.ray.setFromCamera(this.ptr, this.camera);
    const p = new this.T.Vector3();
    return this.ray.ray.intersectPlane(this.floorPlane, p) ? p : null;
  }

  pickMachine() {
    this.ray.setFromCamera(this.ptr, this.camera);
    const hits = this.ray.intersectObjects(this.scene.children, true);
    for (const h of hits) { const i = h.object.userData.interact; if (i && i.type === 'machine') return i.uid; }
    return null;
  }

  enter() { this.active = true; this.shop.setIso(true); document.body.classList.add('iso'); }
  exit() { this.active = false; this.shop.setIso(false); document.body.classList.remove('iso'); this.cancel(); }

  // start placing machine m (a sim record). views: the other placed machines, for overlap checks.
  begin(m, views) {
    this.cancel();
    this.pending = m; this.rot = m.rot || 0; this.views = views;
    this.ghost = buildMachine(this.T, byId(m.id), true); this.scene.add(this.ghost);
    this.ghostMat = null; this.ghost.traverse((o) => { if (o.material && !this.ghostMat) this.ghostMat = o.material; });
    if (!this.hasPointer) { this.hover.x = m.placed ? m.x : 0; this.hover.z = m.placed ? m.z : 2; }
    this.updateGhost(true);
  }
  rotate() { if (!this.pending) return; this.rot = (this.rot + 90) % 360; this.updateGhost(true); }
  cancel() { if (this.ghost) { this.scene.remove(this.ghost); this.ghost = null; } this.pending = null; }

  updateGhost(force = false) {
    if (!this.pending) return;
    const p = this.hasPointer ? this.floorHit() : null;
    if (p) { this.hover.x = Math.round(p.x * 2) / 2; this.hover.z = Math.round(p.z * 2) / 2; }
    const def = byId(this.pending.id), { hw, hd } = halfSizes(def, this.rot);
    const x = this.hover.x, z = this.hover.z;
    let why = null;
    if (x - hw < -this.shop.hx + 0.25 || x + hw > this.shop.hx - 0.25 || z - hd < -this.shop.hz + 0.25 || z + hd > this.shop.hz - 0.25) why = 'that is a wall';
    if (!why) why = this.shop.forbidden(x, z, hw, hd);
    if (!why) for (const v of this.views) {
      if (v.m.uid === this.pending.uid || !v.m.placed) continue;
      const c = v.collider();
      if (Math.abs(x - c.x) < hw + c.hw + 0.5 && Math.abs(z - c.z) < hd + c.hd + 0.5) { why = 'too close to the ' + v.def.name.toLowerCase(); break; }
    }
    this.valid = !why; this.why = why || '';
    this.ghost.position.set(x, 0.01, z); this.ghost.rotation.y = (this.rot * Math.PI) / 180;
    if (this.ghostMat) this.ghostMat.color.set(this.valid ? 0x2ecc40 : 0xd0021b);
  }

  update() { if (this.pending && this.hasPointer) this.updateGhost(); }
}
