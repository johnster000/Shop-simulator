// The building. 2,500 square feet, 20 foot ceiling, one bay door with a tarp over it.
import { SHOP } from './catalog.js';
import * as TX from './textures.js';

export class Shop {
  constructor(T, scene, shopName) {
    this.T = T; this.scene = scene; this.name = shopName;
    this.hx = SHOP.w / 2; this.hz = SHOP.d / 2; this.h = SHOP.h;
    this.colliders = [];      // static boxes the player bumps into
    this.interact = [];       // meshes the crosshair can hit
    this.roofStuff = [];      // hidden in the isometric view
    this.strips = []; this.t = 0; this.compOn = false; this.flickerT = 0;
    this.build();
  }

  box(w, h, d, mat, x, y, z, parent = this.scene) {
    const m = new this.T.Mesh(new this.T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); parent.add(m); return m;
  }
  tag(mesh, type, text, data = {}) { mesh.traverse((o) => { o.userData.interact = { type, text, ...data }; }); this.interact.push(mesh); }
  solid(x, z, hw, hd) { this.colliders.push({ x, z, hw, hd }); }

  build() {
    const T = this.T, s = this.scene, hx = this.hx, hz = this.hz, H = this.h;
    s.background = new T.Color(0x0b0d10);

    // floor
    const floorTex = TX.concrete(T); floorTex.repeat.set(SHOP.w / 4, SHOP.d / 4);
    this.floor = new T.Mesh(new T.PlaneGeometry(SHOP.w, SHOP.d), new T.MeshStandardMaterial({ map: floorTex, roughness: 0.85 }));
    this.floor.rotation.x = -Math.PI / 2; s.add(this.floor);
    this.floor.userData.interact = { type: 'floor' };

    // walls (block)
    const wallTex = TX.block(T); wallTex.repeat.set(SHOP.w / 3, H / 1.5);
    const wallMat = new T.MeshStandardMaterial({ map: wallTex, roughness: 0.95 });
    const wall = (w, x, z, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, H), wallMat); m.position.set(x, H / 2, z); m.rotation.y = ry; s.add(m); return m; };
    wall(SHOP.w, 0, -hz, 0);                 // north
    wall(SHOP.d, -hx, 0, Math.PI / 2);       // west
    wall(SHOP.d, hx, 0, -Math.PI / 2);       // east
    // south wall has the bay door in it: left piece, right piece, header
    const dw = SHOP.door.w, dh = SHOP.door.h, dx = 3.0; // door centre x
    const leftW = (dx - dw / 2) + hx, rightW = hx - (dx + dw / 2);
    wall(leftW, -hx + leftW / 2, hz, Math.PI);
    wall(rightW, hx - rightW / 2, hz, Math.PI);
    const header = new T.Mesh(new T.PlaneGeometry(dw, H - dh), wallMat); header.position.set(dx, dh + (H - dh) / 2, hz); header.rotation.y = Math.PI; s.add(header);
    this.door = { x: dx, w: dw, h: dh };

    // ceiling: dark deck with joists. hidden in iso.
    const ceil = new T.Mesh(new T.PlaneGeometry(SHOP.w, SHOP.d), new T.MeshStandardMaterial({ color: 0x2a2d31, roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = H; s.add(ceil); this.roofStuff.push(ceil);
    const joist = new T.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.9 });
    for (let x = -hx + 1.2; x < hx; x += 2.4) { const j = this.box(0.12, 0.5, SHOP.d, joist, x, H - 0.25, 0); this.roofStuff.push(j); }

    // fluorescent fixtures. some are out. one cannot decide.
    this.fixtures = [];
    const onMat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.6 });
    const offMat = new T.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6 });
    const dead = new Set([1, 4, 7, 10]); let idx = 0;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      const x = -hx + (c + 0.5) * (SHOP.w / 4), z = -hz + (r + 0.5) * (SHOP.d / 3);
      const f = this.box(1.25, 0.1, 0.32, dead.has(idx) ? offMat : onMat, x, H - 0.55, z);
      const hanger = this.box(0.02, 0.4, 0.02, joist, x, H - 0.3, z);
      this.roofStuff.push(f, hanger); this.fixtures.push({ mesh: f, on: !dead.has(idx), flick: idx === 6 }); idx++;
    }
    this.flickMat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.6 });
    this.fixtures[6].mesh.material = this.flickMat;

    // lights: a few points, a hemisphere, and daylight through the door
    this.hemi = new T.HemisphereLight(0xdfe6f0, 0x3a3630, 0.35); s.add(this.hemi);
    this.ambient = new T.AmbientLight(0xcfd6e0, 0.12); s.add(this.ambient);
    this.points = [];
    for (const [x, z] of [[-hx * 0.5, -hz * 0.5], [hx * 0.5, -hz * 0.5], [-hx * 0.5, hz * 0.5], [hx * 0.5, hz * 0.5]]) {
      const p = new T.PointLight(0xeef2ff, 26, 0, 1.6); p.position.set(x, H - 0.8, z); s.add(p); this.points.push(p);
    }
    this.day = new T.PointLight(0xfff1d0, 60, 0, 1.4); this.day.position.set(dx, 2.2, hz + 1.5); s.add(this.day);

    // outside: the lot, the sky, the neighbour's dumpster
    const out = new T.Mesh(new T.PlaneGeometry(40, 20), new T.MeshBasicMaterial({ map: TX.outside(T) }));
    out.position.set(dx, 8, hz + 12); out.rotation.y = Math.PI; s.add(out); this.roofStuff.push(out);
    const lot = new T.Mesh(new T.PlaneGeometry(7, 4), new T.MeshStandardMaterial({ color: 0x6f6f6c, roughness: 1 }));
    lot.rotation.x = -Math.PI / 2; lot.position.set(dx, -0.01, hz + 2); s.add(lot);

    // the tarp. strips. they flap. it is the first thing everyone complains about.
    const tarpTex = TX.tarp(T);
    const tarpMat = new T.MeshStandardMaterial({ map: tarpTex, transparent: true, opacity: 0.86, side: T.DoubleSide, roughness: 0.9 });
    const n = 8, sw = dw / n;
    this.tarpGroup = new T.Group(); s.add(this.tarpGroup);
    for (let i = 0; i < n; i++) {
      const pivot = new T.Group(); pivot.position.set(dx - dw / 2 + (i + 0.5) * sw, dh, hz - 0.08);
      const strip = new T.Mesh(new T.PlaneGeometry(sw * 1.02, dh, 1, 8), tarpMat); strip.position.y = -dh / 2;
      pivot.add(strip); this.tarpGroup.add(pivot); this.strips.push({ pivot, phase: Math.random() * 6 });
    }
    const rail = this.box(dw + 0.3, 0.12, 0.14, new T.MeshStandardMaterial({ color: 0x777, metalness: 0.6 }), dx, dh + 0.06, hz - 0.08);
    this.tag(this.tarpGroup, 'tarp', 'the door. it flaps.'); this.tag(rail, 'tarp', 'the door. it flaps.');
    // nobody walks out in this build
    this.solid(dx, hz, dw / 2 + 0.2, 0.25);

    // breaker panel, east wall
    const grey = new T.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.4 });
    const panel = this.box(0.16, 0.9, 0.5, grey, hx - 0.09, 1.5, -hz * 0.3); // flat against the east wall
    const panelDoor = this.box(0.02, 0.8, 0.44, new T.MeshStandardMaterial({ color: 0xb8bec4, metalness: 0.5, roughness: 0.35 }), hx - 0.18, 1.5, -hz * 0.3);
    const panelLabel = new T.Mesh(new T.PlaneGeometry(0.3, 0.12), new T.MeshBasicMaterial({ map: TX.label(T, ['200A', '2 MACHINES'], { size: 28 }) }));
    panelLabel.position.set(hx - 0.195, 1.82, -hz * 0.3); panelLabel.rotation.y = -Math.PI / 2; s.add(panelLabel);
    this.tag(panel, 'panel', 'breaker panel. enough for two machines.'); this.tag(panelDoor, 'panel', 'breaker panel. enough for two machines.');

    // the compressor. south-east corner. it came with the shop.
    const comp = new T.Group(); comp.position.set(hx - 1.0, 0, hz - 1.3);
    const tank = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 1.3, 20), new T.MeshStandardMaterial({ color: 0x2f4f6f, metalness: 0.4, roughness: 0.5 }));
    tank.rotation.z = Math.PI / 2; tank.position.y = 0.55; comp.add(tank);
    const motor = this.box(0.45, 0.4, 0.4, new T.MeshStandardMaterial({ color: 0x222, roughness: 0.6 }), 0, 1.05, 0, comp);
    const pump = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.3, 12), grey); pump.position.set(0.35, 1.05, 0); pump.rotation.z = Math.PI / 2; comp.add(pump);
    for (const sx of [-0.5, 0.5]) { const leg = this.box(0.08, 0.3, 0.3, grey, sx, 0.15, 0, comp); }
    const plate = new T.Mesh(new T.PlaneGeometry(0.4, 0.2), new T.MeshBasicMaterial({ map: TX.label(T, ['CAMEL', 'HAUSFELD'], { size: 30 }) }));
    plate.position.set(0, 0.55, 0.31); comp.add(plate);
    s.add(comp); this.compressor = comp; this.compressorPos = { x: hx - 1.0, z: hz - 1.3 }; this.tag(comp, 'compressor', 'compressor. it came with the shop. it has not stopped.');
    this.solid(hx - 1.0, hz - 1.3, 0.75, 0.45);

    // steel rack, west wall near the door end. empty.
    const rackMat = new T.MeshStandardMaterial({ color: 0xc8541e, roughness: 0.6 });
    const rack = new T.Group(); rack.position.set(-hx + 0.55, 0, hz * 0.45);
    for (const z of [-1.3, 1.3]) for (const x of [-0.4, 0.4]) this.box(0.08, 2.2, 0.08, rackMat, x, 1.1, z, rack);
    for (const y of [0.5, 1.2, 1.9]) for (const z of [-1.3, 1.3]) this.box(0.9, 0.08, 0.08, rackMat, 0, y, z, rack);
    for (const y of [0.5, 1.2, 1.9]) { this.box(0.08, 0.06, 2.7, rackMat, 0.4, y, 0, rack); this.box(0.08, 0.06, 2.7, rackMat, -0.4, y, 0, rack); }
    s.add(rack); this.tag(rack, 'rack', 'steel rack. empty. for now.'); this.solid(-hx + 0.55, hz * 0.45, 0.5, 1.4);

    // scrap bin by the door. empty. for now.
    const bin = this.box(1.0, 0.8, 0.8, new T.MeshStandardMaterial({ color: 0x3f4a55, roughness: 0.7 }), dx - 3.2, 0.4, hz - 0.7);
    const binLabel = new T.Mesh(new T.PlaneGeometry(0.6, 0.25), new T.MeshBasicMaterial({ map: TX.label(T, ['SCRAP'], { size: 48, bg: '#f0b429' }) }));
    binLabel.position.set(dx - 3.2, 0.5, hz - 1.11); binLabel.rotation.y = Math.PI; s.add(binLabel);
    this.tag(bin, 'bin', 'scrap bin. empty. it will not stay empty.'); this.solid(dx - 3.2, hz - 0.7, 0.5, 0.4);
    this.binPos = { x: dx - 3.2, z: hz - 0.7 }; this.scrapBlocks = []; this.crates = []; this.cratePos = { x: dx + 1.6, z: hz - 1.0 };

    // pallet jack
    const pj = new T.Group(); pj.position.set(dx + 0.3, 0, hz - 2.2); pj.rotation.y = 0.4;
    const pjMat = new T.MeshStandardMaterial({ color: 0xd44a1a, roughness: 0.5 });
    this.box(0.16, 0.08, 1.2, pjMat, -0.26, 0.08, 0.3, pj); this.box(0.16, 0.08, 1.2, pjMat, 0.26, 0.08, 0.3, pj);
    this.box(0.6, 0.5, 0.3, pjMat, 0, 0.3, -0.4, pj);
    const handle = this.box(0.04, 1.1, 0.04, grey, 0, 0.95, -0.55, pj); handle.rotation.x = 0.5;
    s.add(pj); this.tag(pj, 'jack', 'pallet jack. until the crane, this is the crane.');

    // the office. north-west corner. a box with a door.
    this.buildOffice();

    // dust in the light by the door
    const count = 400, pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { pos[i * 3] = dx + (Math.random() - 0.5) * 6; pos[i * 3 + 1] = Math.random() * 3.4; pos[i * 3 + 2] = hz - Math.random() * 5; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    this.dust = new T.Points(g, new T.PointsMaterial({ color: 0xfff2d0, size: 0.012, transparent: true, opacity: 0.4, depthWrite: false }));
    this.dust.raycast = () => {}; // dust is not a thing you can click
    s.add(this.dust);
  }

  buildOffice() {
    const T = this.T, s = this.scene, hx = this.hx, hz = this.hz, O = SHOP.office;
    const x0 = -hx, x1 = -hx + O.w, z0 = -hz, z1 = -hz + O.d; // office spans x0..x1, z0..z1
    const wallMat = new T.MeshStandardMaterial({ color: 0xd9d5c8, roughness: 0.9 });
    const trim = new T.MeshStandardMaterial({ color: 0x5a4a33, roughness: 0.7 });
    // east wall of office (full), south wall with a door opening and a window
    this.box(0.12, O.h, O.d, wallMat, x1, O.h / 2, (z0 + z1) / 2); this.solid(x1, (z0 + z1) / 2, 0.06, O.d / 2);
    const doorX = x1 - 0.8, doorW = 0.95;
    const leftW = (doorX - doorW / 2) - x0, rightW = x1 - (doorX + doorW / 2);
    this.box(leftW, O.h, 0.12, wallMat, x0 + leftW / 2, O.h / 2, z1); this.solid(x0 + leftW / 2, z1, leftW / 2, 0.06);
    this.box(rightW, O.h, 0.12, wallMat, x1 - rightW / 2, O.h / 2, z1); this.solid(x1 - rightW / 2, z1, rightW / 2, 0.06);
    this.box(doorW, O.h - 2.1, 0.12, wallMat, doorX, 2.1 + (O.h - 2.1) / 2, z1);
    this.box(doorW + 0.1, 0.08, 0.16, trim, doorX, 2.1, z1);
    // window in the south wall
    const win = new T.Mesh(new T.PlaneGeometry(1.4, 0.9), new T.MeshStandardMaterial({ color: 0x9fc3e6, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.3, side: T.DoubleSide }));
    win.position.set(x0 + 1.3, 1.5, z1 + 0.07); s.add(win);
    // roof of the office (a lid, with a few boxes on it)
    const lid = this.box(O.w, 0.1, O.d, trim, (x0 + x1) / 2, O.h + 0.05, (z0 + z1) / 2); this.roofStuff.push(lid);
    this.roofStuff.push(this.box(0.5, 0.4, 0.4, new T.MeshStandardMaterial({ color: 0xb08a5a }), x0 + 1, O.h + 0.3, z0 + 1));
    // sign over the office door, with the shop name on it
    this.signMat = new T.MeshBasicMaterial({ map: TX.sign(T, this.name) });
    const sign = new T.Mesh(new T.PlaneGeometry(2.8, 0.52), this.signMat); sign.position.set(x1 - 1.6, O.h + 0.5, z1 + 0.08); s.add(sign);
    this.tag(sign, 'sign', this.name);
    // desk, chair, PC, phone, whiteboard
    const desk = new T.Group(); desk.position.set(x0 + 1.4, 0, z0 + 1.0);
    const deskMat = new T.MeshStandardMaterial({ color: 0x7a6248, roughness: 0.6 });
    this.box(1.8, 0.05, 0.8, deskMat, 0, 0.74, 0, desk); this.box(0.08, 0.72, 0.7, deskMat, -0.85, 0.36, 0, desk); this.box(0.5, 0.72, 0.7, deskMat, 0.6, 0.36, 0, desk);
    const mon = this.box(0.5, 0.34, 0.03, new T.MeshStandardMaterial({ color: 0x1a1a1a }), -0.2, 1.0, -0.2, desk);
    this.screenMat = new T.MeshBasicMaterial({ map: TX.screen(T, [this.name.toUpperCase().slice(0, 20), '', 'JobLORD 2 (trial)', 'inbox: 0', 'cash: see HUD', '', '> _']) });
    const scr = new T.Mesh(new T.PlaneGeometry(0.46, 0.3), this.screenMat); scr.position.set(-0.2, 1.0, -0.18); desk.add(scr);
    this.box(0.1, 0.18, 0.1, new T.MeshStandardMaterial({ color: 0x1a1a1a }), -0.2, 0.83, -0.2, desk);
    const phone = this.box(0.18, 0.06, 0.2, new T.MeshStandardMaterial({ color: 0x222 }), 0.5, 0.79, -0.15, desk);
    s.add(desk); this.tag(desk, 'pc', 'the office PC. quotes, bills, the inbox.'); this.solid(x0 + 1.4, z0 + 1.0, 0.9, 0.45);
    this.pc = desk;
    const chair = new T.Group(); chair.position.set(x0 + 1.4, 0, z0 + 1.9);
    const cm = new T.MeshStandardMaterial({ color: 0x333, roughness: 0.8 });
    this.box(0.5, 0.06, 0.5, cm, 0, 0.45, 0, chair); this.box(0.5, 0.5, 0.06, cm, 0, 0.75, 0.24, chair);
    const post = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 8), cm); post.position.y = 0.22; chair.add(post);
    s.add(chair); this.tag(chair, 'chair', 'the chair. it squeaks. a better one is $140.');
    const wb = new T.Mesh(new T.PlaneGeometry(1.6, 1.0), new T.MeshBasicMaterial({ map: TX.whiteboard(T, ['TO DO:', '- buy a mill', '- get a job', '- fix the door', '- coffee']) }));
    wb.position.set(x1 - 0.07, 1.6, z0 + 1.6); wb.rotation.y = -Math.PI / 2; s.add(wb); this.tag(wb, 'whiteboard', 'the whiteboard. the real schedule.');
    // office light: one warm point
    const ol = new T.PointLight(0xffe8c0, 10, 0, 1.6); ol.position.set((x0 + x1) / 2, O.h - 0.2, (z0 + z1) / 2); s.add(ol);
    this.office = { x0, x1, z0, z1 };
  }

  // a rectangle a machine may not be placed in (the office, the door apron)
  forbidden(x, z, hw, hd) {
    const o = this.office;
    if (x + hw > o.x0 - 0.3 && x - hw < o.x1 + 0.3 && z + hd > o.z0 && z - hd < o.z1 + 0.3) return 'that is the office';
    const d = this.door;
    if (x + hw > d.x - d.w / 2 - 0.5 && x - hw < d.x + d.w / 2 + 0.5 && z + hd > this.hz - 3.2) return 'keep the door clear';
    if (x + hw > this.hx - 2.2 && z + hd > this.hz - 2.4) return 'the compressor lives there';
    if (x - hw < -this.hx + 1.3 && z + hd > this.hz * 0.45 - 1.6 && z - hd < this.hz * 0.45 + 1.6) return 'that is the steel rack';
    return null;
  }

  update(dt, compOn) {
    this.t += dt;
    for (const { pivot, phase } of this.strips) pivot.rotation.x = Math.sin(this.t * 1.3 + phase) * 0.06 + Math.sin(this.t * 3.1 + phase * 2) * 0.02;
    if (this.fixtures[6]) { this.flickerT -= dt; if (this.flickerT <= 0) { this.flickerT = 0.05 + Math.random() * 1.8; this.flickMat.emissiveIntensity = Math.random() < 0.3 ? 0.15 : 1.6; } }
    if (this.compressor) { this.compressor.position.y = compOn ? Math.sin(this.t * 60) * 0.004 : 0; }
    const p = this.dust.geometry.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) { p[i] += Math.sin(this.t * 0.4 + i) * 0.0015; p[i + 1] += 0.002 + Math.cos(this.t * 0.3 + i) * 0.002; if (p[i + 1] > 3.4) p[i + 1] = 0; }
    this.dust.geometry.attributes.position.needsUpdate = true;
  }

  setIso(iso) { for (const m of this.roofStuff) m.visible = !iso; }

  // the real door: an insulated roll-up, down most of the way, instead of the tarp
  setDoor(real) {
    if (this.realDoor === real) return; this.realDoor = real;
    const T = this.T, d = this.door;
    if (!this.rollup) {
      const g = new T.Group();
      const mat = new T.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.6, metalness: 0.3 });
      for (let i = 0; i < 6; i++) { const slat = new T.Mesh(new T.BoxGeometry(d.w + 0.1, 0.42, 0.06), mat); slat.position.set(d.x, 0.22 + i * 0.44, this.hz - 0.08); g.add(slat); const line = new T.Mesh(new T.BoxGeometry(d.w + 0.1, 0.02, 0.065), new T.MeshStandardMaterial({ color: 0x8a8e92 })); line.position.set(d.x, 0.44 + i * 0.44, this.hz - 0.08); g.add(line); }
      const drum = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, d.w + 0.4, 16), new T.MeshStandardMaterial({ color: 0x555, metalness: 0.5 })); drum.rotation.z = Math.PI / 2; drum.position.set(d.x, d.h + 0.2, this.hz - 0.3); g.add(drum);
      const win = new T.Mesh(new T.PlaneGeometry(0.5, 0.3), new T.MeshStandardMaterial({ color: 0x9fc3e6, transparent: true, opacity: 0.6 })); win.position.set(d.x, 1.65, this.hz - 0.04); win.rotation.y = Math.PI; g.add(win);
      g.visible = false; this.scene.add(g); this.rollup = g; this.tag(g, 'door', 'a real door. insulated. the tarp is in the dumpster.');
    }
    this.rollup.visible = real; this.tarpGroup.visible = !real;
  }
  // a bigger compressor shows up as a bigger tank
  setAir(slots) {
    if (this.airSlots === slots) return; this.airSlots = slots;
    const k = slots >= 10 ? 1.6 : slots >= 4 ? 1.3 : 1;
    this.compressor.scale.set(k, k, k);
  }

  // crates by the door: finished work waiting for the truck
  setCrates(n) {
    const T = this.T;
    while (this.crates.length < n) {
      const i = this.crates.length;
      const g = new T.Group(); g.position.set(this.cratePos.x + (i % 2) * 0.7, 0, this.cratePos.z - Math.floor(i / 2) * 0.7);
      const c = new T.Mesh(new T.BoxGeometry(0.55, 0.45, 0.55), new T.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.9 })); c.position.y = 0.225; g.add(c);
      for (const y of [0.1, 0.35]) { const b = new T.Mesh(new T.BoxGeometry(0.57, 0.04, 0.57), new T.MeshStandardMaterial({ color: 0x8a6a3a })); b.position.y = y; g.add(b); }
      const lbl = new T.Mesh(new T.PlaneGeometry(0.3, 0.14), new T.MeshBasicMaterial({ map: TX.label(T, ['SHIP', this.name.slice(0, 12)], { size: 26 }) })); lbl.position.set(0, 0.25, 0.28); g.add(lbl);
      this.tag(g, 'crate', 'a finished job, waiting for the truck. ship it from the clipboard.');
      this.scene.add(g); this.crates.push(g);
    }
    while (this.crates.length > n) { const g = this.crates.pop(); this.scene.remove(g); this.interact.splice(this.interact.indexOf(g), 1); }
  }

  // blocks in the scrap bin: every one a story
  setScrap(n) {
    const T = this.T;
    while (this.scrapBlocks.length < Math.min(n, 12)) {
      const i = this.scrapBlocks.length;
      const b = new T.Mesh(new T.BoxGeometry(0.12 + Math.random() * 0.15, 0.08 + Math.random() * 0.12, 0.1 + Math.random() * 0.15), new T.MeshStandardMaterial({ color: 0x6a7076, metalness: 0.5, roughness: 0.5 }));
      b.position.set(this.binPos.x + (Math.random() - 0.5) * 0.7, 0.2 + i * 0.07, this.binPos.z + (Math.random() - 0.5) * 0.5); b.rotation.set(Math.random(), Math.random(), Math.random());
      this.scene.add(b); this.scrapBlocks.push(b);
    }
  }
}
