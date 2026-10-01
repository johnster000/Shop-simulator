// The overhead view, and placing machines in it.
//
// Placing: the ghost follows the pointer until you click, which parks it. Drag the parked ghost to
// move it, click somewhere else to move it there, arrow keys nudge it half a metre, R rotates,
// Enter confirms, Esc puts it back on the truck. Nothing lands until CONFIRM.
import { byId } from './catalog.js';
import { buildMachine, halfSizes } from './machines.js';
import { SHOP } from './catalog.js';

export class Iso {
  constructor(T, scene, shop, canvas) {
    this.T = T; this.scene = scene; this.shop = shop; this.canvas = canvas;
    this.active = false;
    this.camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
    this.camera.position.set(14, 16, 14); this.camera.lookAt(0, 0, 0);
    this.fit();
    this.ray = new T.Raycaster(); this.ptr = new T.Vector2(); this.floorPlane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.pending = null; this.ghost = null; this.ghostMat = null; this.valid = false; this.why = '';
    this.pos = { x: 0, z: 2 }; this.rot = 0; this.parked = false; this.dragging = false; this.dragOff = { x: 0, z: 0 };
    this.onConfirm = null; this.onCancel = null; this.onPick = null; this.onChange = null;
    // the half-metre grid, only in this view
    this.grid = new T.GridHelper(SHOP.w, SHOP.w * 2, 0x6a7a8a, 0x3a4450); this.grid.position.y = 0.004; this.grid.visible = false; scene.add(this.grid);
    // footprint outline: the machine's rectangle and the clearance band around it
    this.padMat = new T.MeshBasicMaterial({ color: 0x2ecc40, transparent: true, opacity: 0.18, depthWrite: false });
    this.rectMat = new T.MeshBasicMaterial({ color: 0x2ecc40, transparent: true, opacity: 0.35, depthWrite: false });
    this.pad = new T.Mesh(new T.PlaneGeometry(1, 1), this.padMat); this.pad.rotation.x = -Math.PI / 2; this.pad.position.y = 0.006; this.pad.visible = false; scene.add(this.pad);
    this.rect = new T.Mesh(new T.PlaneGeometry(1, 1), this.rectMat); this.rect.rotation.x = -Math.PI / 2; this.rect.position.y = 0.008; this.rect.visible = false; scene.add(this.rect);

    canvas.addEventListener('pointermove', (e) => {
      if (!this.active || !this.pending) return;
      this.setPointer(e.clientX, e.clientY);
      if (this.dragging || !this.parked) { const p = this.floorHit(); if (p) this.moveTo(p.x - this.dragOff.x, p.z - this.dragOff.z); }
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.active || e.button !== 0) return;
      this.setPointer(e.clientX, e.clientY);
      if (this.pending) {
        const p = this.floorHit(); if (!p) return;
        if (this.parked && this.overGhost(p)) { this.dragging = true; this.dragOff = { x: p.x - this.pos.x, z: p.z - this.pos.z }; canvas.setPointerCapture(e.pointerId); }
        else { this.dragOff = { x: 0, z: 0 }; this.moveTo(p.x, p.z); this.parked = true; this.dragging = true; canvas.setPointerCapture(e.pointerId); }
        if (this.onChange) this.onChange();
      } else if (this.onPick) { const uid = this.pickMachine(); if (uid != null) this.onPick(uid); }
    });
    const up = (e) => { if (this.dragging) { this.dragging = false; this.parked = true; if (this.onChange) this.onChange(); } };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  }

  fit() {
    const aspect = innerWidth / innerHeight, span = aspect >= 1 ? 12.5 : 12.5 / aspect; // portrait: fit by width
    this.camera.left = -span * aspect; this.camera.right = span * aspect; this.camera.top = span; this.camera.bottom = -span;
    this.camera.updateProjectionMatrix();
  }

  setPointer(cx, cy) { this.ptr.x = (cx / innerWidth) * 2 - 1; this.ptr.y = -(cy / innerHeight) * 2 + 1; }
  floorHit() { this.ray.setFromCamera(this.ptr, this.camera); const p = new this.T.Vector3(); return this.ray.ray.intersectPlane(this.floorPlane, p) ? p : null; }
  overGhost(p) { const { hw, hd } = halfSizes(byId(this.pending.id), this.rot); return Math.abs(p.x - this.pos.x) < hw + 0.3 && Math.abs(p.z - this.pos.z) < hd + 0.3; }

  pickMachine() {
    this.ray.setFromCamera(this.ptr, this.camera);
    const hits = this.ray.intersectObjects(this.scene.children, true);
    for (const h of hits) { const i = h.object.userData.interact; if (i && i.type === 'machine') return i.uid; }
    return null;
  }

  enter() { this.active = true; this.shop.setIso(true); this.grid.visible = true; document.body.classList.add('iso'); }
  exit() { this.active = false; this.shop.setIso(false); this.grid.visible = false; document.body.classList.remove('iso'); this.cancel(); }

  // start placing machine m (a sim record). views: the other machines, for overlap checks.
  begin(m, views) {
    this.cancel();
    this.pending = m; this.rot = m.rot || 0; this.views = views;
    this.ghost = buildMachine(this.T, byId(m.id), true); this.scene.add(this.ghost);
    this.ghostMat = null; this.ghost.traverse((o) => { if (o.material && !this.ghostMat) this.ghostMat = o.material; });
    this.pad.visible = this.rect.visible = true;
    // a machine being moved starts parked where it is; a new one starts parked in the open, waiting for you
    this.parked = true; this.dragging = false;
    this.moveTo(m.placed ? m.x : 0, m.placed ? m.z : 1.5);
    if (this.onChange) this.onChange();
  }
  moveTo(x, z) { this.pos.x = Math.round(x * 2) / 2; this.pos.z = Math.round(z * 2) / 2; this.updateGhost(); }
  nudge(dx, dz) { if (!this.pending) return; this.moveTo(this.pos.x + dx, this.pos.z + dz); this.parked = true; if (this.onChange) this.onChange(); }
  rotate() { if (!this.pending) return; this.rot = (this.rot + 90) % 360; this.updateGhost(); if (this.onChange) this.onChange(); }
  confirm() { if (!this.pending || !this.valid) return false; const m = this.pending, x = this.pos.x, z = this.pos.z, rot = this.rot; this.cancel(); if (this.onConfirm) this.onConfirm(m, x, z, rot); return true; }
  cancel() {
    if (this.ghost) { this.scene.remove(this.ghost); this.ghost = null; }
    this.pad.visible = this.rect.visible = false;
    this.pending = null; this.parked = false; this.dragging = false;
  }

  updateGhost() {
    if (!this.pending) return;
    const def = byId(this.pending.id), { hw, hd } = halfSizes(def, this.rot);
    const x = this.pos.x, z = this.pos.z;
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
    const col = this.valid ? 0x2ecc40 : 0xd0021b;
    if (this.ghostMat) this.ghostMat.color.set(col);
    this.padMat.color.set(col); this.rectMat.color.set(col);
    this.pad.position.set(x, 0.006, z); this.pad.scale.set(hw * 2 + 1.0, hd * 2 + 1.0, 1);
    this.rect.position.set(x, 0.008, z); this.rect.scale.set(hw * 2, hd * 2, 1);
  }

  update() { /* the pointer handlers do the work */ }
}
