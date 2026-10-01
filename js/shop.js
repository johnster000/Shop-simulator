// The building. 2,500 square feet, 20 foot ceiling, one bay door with a tarp over it.
import { SHOP, BUILDINGS } from './catalog.js';
import * as TX from './textures.js';

export class Shop {
  constructor(T, scene, shopName, spec = SHOP) {
    this.T = T; this.scene = scene; this.name = shopName; this.spec = spec;
    this.hx = spec.w / 2; this.hz = spec.d / 2; this.h = spec.h;
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
    const T = this.T, s = this.scene, hx = this.hx, hz = this.hz, H = this.h, SHOP = this.spec;
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
    const dw = SHOP.door.w, dh = SHOP.door.h, dx = SHOP.door.x; // door centre x
    // the south wall, with one or two doors cut out of it
    const doors = [{ x: dx, w: dw, h: dh }].concat(SHOP.door2 ? [{ x: SHOP.door2.x, w: SHOP.door2.w, h: SHOP.door2.h }] : []).sort((a, b) => a.x - b.x);
    let cursor = -hx;
    for (const d of doors) { const w = (d.x - d.w / 2) - cursor; if (w > 0.01) wall(w, cursor + w / 2, hz, Math.PI); const header = new T.Mesh(new T.PlaneGeometry(d.w, H - d.h), wallMat); header.position.set(d.x, d.h + (H - d.h) / 2, hz); header.rotation.y = Math.PI; s.add(header); cursor = d.x + d.w / 2; }
    if (hx - cursor > 0.01) wall(hx - cursor, cursor + (hx - cursor) / 2, hz, Math.PI);
    this.door = { x: dx, w: dw, h: dh }; this.doors = doors;

    // ceiling: dark deck with joists. hidden in iso.
    const ceil = new T.Mesh(new T.PlaneGeometry(SHOP.w, SHOP.d), new T.MeshStandardMaterial({ color: 0x2a2d31, roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = H; s.add(ceil); this.roofStuff.push(ceil);
    const joist = new T.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.9 });
    for (let x = -hx + 1.2; x < hx; x += 2.4) { const j = this.box(0.12, 0.5, SHOP.d, joist, x, H - 0.25, 0); this.roofStuff.push(j); }

    // fluorescent fixtures. some are out. one cannot decide.
    this.fixtures = [];
    const onMat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.6 });
    const offMat = new T.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.6 });
    const [rows, cols] = SHOP.fixtures; const dead = new Set([1, 4, 7, 10, 17, 23]); let idx = 0;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = -hx + (c + 0.5) * (SHOP.w / cols), z = -hz + (r + 0.5) * (SHOP.d / rows);
      const f = this.box(1.25, 0.1, 0.32, dead.has(idx) ? offMat : onMat, x, H - 0.55, z);
      const hanger = this.box(0.02, 0.4, 0.02, joist, x, H - 0.3, z);
      this.roofStuff.push(f, hanger); this.fixtures.push({ mesh: f, on: !dead.has(idx), flick: idx === 6 }); idx++;
    }
    this.flickMat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f6ff, emissiveIntensity: 1.6 });
    this.fixtures[6].mesh.material = this.flickMat;
    // a big floor needs more light
    const lightPts = SHOP.id === 'large' ? [[-hx * 0.66, -hz * 0.66], [0, -hz * 0.66], [hx * 0.66, -hz * 0.66], [-hx * 0.66, 0], [0, 0], [hx * 0.66, 0], [-hx * 0.66, hz * 0.66], [0, hz * 0.66], [hx * 0.66, hz * 0.66]] : [[-hx * 0.5, -hz * 0.5], [hx * 0.5, -hz * 0.5], [-hx * 0.5, hz * 0.5], [hx * 0.5, hz * 0.5]];

    // lights: a few points, a hemisphere, and daylight through the door
    this.hemi = new T.HemisphereLight(0xdfe6f0, 0x3a3630, 0.35); s.add(this.hemi);
    this.ambient = new T.AmbientLight(0xcfd6e0, 0.12); s.add(this.ambient);
    this.points = [];
    for (const [x, z] of lightPts) {
      const p = new T.PointLight(0xeef2ff, SHOP.id === 'large' ? 34 : 26, 0, 1.6); p.position.set(x, H - 0.8, z); s.add(p); this.points.push(p);
    }
    // daylight leaks in at every door. the second door gets its own sun, which is more than the first shop had.
    this.day = new T.PointLight(0xfff1d0, 60, 0, 1.4); this.day.position.set(dx, 2.2, hz + 1.5); s.add(this.day);
    this.dayLights = [this.day];
    for (const d of doors) if (d.x !== dx) { const l = new T.PointLight(0xfff1d0, 60, 0, 1.4); l.position.set(d.x, 2.2, hz + 1.5); s.add(l); this.dayLights.push(l); }

    // outside: the lot, the sky, the neighbour's dumpster
    const out = new T.Mesh(new T.PlaneGeometry(SHOP.w + 26, 20), new T.MeshBasicMaterial({ map: TX.outside(T) }));
    out.position.set(0, 8, hz + 12); out.rotation.y = Math.PI; s.add(out); this.roofStuff.push(out);
    for (const d of doors) {
      const lot = new T.Mesh(new T.PlaneGeometry(d.w + 2.8, 4), new T.MeshStandardMaterial({ color: 0x6f6f6c, roughness: 1 }));
      lot.rotation.x = -Math.PI / 2; lot.position.set(d.x, -0.01, hz + 2); s.add(lot);
    }

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
    for (const d of doors) this.solid(d.x, hz, d.w / 2 + 0.2, 0.25);
    if (SHOP.door2) { this.tarpGroup.visible = false; rail.visible = false; }

    // breaker panel, east wall
    const grey = this.greyMat = new T.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.5, roughness: 0.4 });
    const panel = this.box(0.16, 0.9, 0.5, grey, hx - 0.09, 1.5, -hz * 0.3); // flat against the east wall
    const panelDoor = this.box(0.02, 0.8, 0.44, new T.MeshStandardMaterial({ color: 0xb8bec4, metalness: 0.5, roughness: 0.35 }), hx - 0.18, 1.5, -hz * 0.3);
    const amps = SHOP.powerSlots > 2 ? '600A' : '200A', panelNote = SHOP.powerSlots > 2 ? `breaker panel. ${amps}. room for ${SHOP.powerSlots} machines before the electrician comes back.` : 'breaker panel. enough for two machines.';
    const panelLabel = new T.Mesh(new T.PlaneGeometry(0.3, 0.12), new T.MeshBasicMaterial({ map: TX.label(T, [amps, `${SHOP.powerSlots} MACHINES`], { size: 28 }) }));
    panelLabel.position.set(hx - 0.195, 1.82, -hz * 0.3); panelLabel.rotation.y = -Math.PI / 2; s.add(panelLabel);
    this.tag(panel, 'panel', panelNote); this.tag(panelDoor, 'panel', panelNote);

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
    // the air hose hangs on a hook on the wall above the compressor. it reels itself back when dropped.
    const hook = this.box(0.04, 0.04, 0.12, grey, hx - 0.05, 1.5, hz - 2.4); this.tag(hook, 'hook', 'the air hose hook.');
    this.hosePos = { x: hx - 0.2, z: hz - 2.4, y: 1.22 };
    // the fire extinguisher: on a bracket by the door, with a sign, at the height the inspector asked for
    const exX = dx - dw / 2 - 0.7;
    const bracket = this.box(0.14, 0.05, 0.04, grey, exX, 0.98, hz - 0.1);
    const sign = new T.Mesh(new T.PlaneGeometry(0.24, 0.3), new T.MeshBasicMaterial({ map: TX.label(T, ['FIRE', 'EXT.', '▼'], { size: 40, fg: '#fff', bg: '#b8231f' }) })); sign.position.set(exX, 1.7, hz - 0.03); sign.rotation.y = Math.PI; s.add(sign);
    this.tag(bracket, 'bracket', 'the extinguisher bracket.'); this.tag(sign, 'bracket', 'the sign. the bracket should have the extinguisher in it.');
    this.extPos = { x: exX, z: hz - 0.22, y: 0.72 };

    // steel rack, west wall near the door end. empty.
    const rackMat = new T.MeshStandardMaterial({ color: 0xc8541e, roughness: 0.6 });
    const rack = new T.Group(); rack.position.set(-hx + 0.55, 0, hz * 0.45);
    for (const z of [-1.3, 1.3]) for (const x of [-0.4, 0.4]) this.box(0.08, 2.2, 0.08, rackMat, x, 1.1, z, rack);
    for (const y of [0.5, 1.2, 1.9]) for (const z of [-1.3, 1.3]) this.box(0.9, 0.08, 0.08, rackMat, 0, y, z, rack);
    for (const y of [0.5, 1.2, 1.9]) { this.box(0.08, 0.06, 2.7, rackMat, 0.4, y, 0, rack); this.box(0.08, 0.06, 2.7, rackMat, -0.4, y, 0, rack); }
    s.add(rack); this.tag(rack, 'rack', 'steel rack. empty. for now.'); this.solid(-hx + 0.55, hz * 0.45, 0.5, 1.4);
    // the radio. on the rack's top shelf. one station, argued over.
    const radio = new T.Group(); radio.position.set(-hx + 0.55, 1.98, hz * 0.45 + 1.0); this.radioPos = { x: -hx + 0.55, z: hz * 0.45 + 1.0 };
    this.box(0.36, 0.18, 0.16, new T.MeshStandardMaterial({ color: 0xc8541e, roughness: 0.6 }), 0, 0.09, 0, radio);
    const grille = this.box(0.14, 0.12, 0.01, new T.MeshStandardMaterial({ color: 0x222 }), -0.08, 0.09, 0.085, radio);
    const dial = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.01, 12), new T.MeshStandardMaterial({ color: 0x111 })); dial.rotation.x = Math.PI / 2; dial.position.set(0.09, 0.09, 0.085); radio.add(dial);
    const ant = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.4, 6), new T.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.8 })); ant.position.set(0.14, 0.35, -0.05); ant.rotation.z = -0.4; radio.add(ant);
    s.add(radio); this.tag(radio, 'radio', 'the radio. one station. argued over.');

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
    const T = this.T, s = this.scene, hx = this.hx, hz = this.hz, SHOP = this.spec, O = SHOP.office, grey = this.greyMat;
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
    this.pc = desk; this.pcPos = { x: x0 + 1.4, z: z0 + 1.0 };
    this.jarPos = { x: x0 + 1.4 + 0.8, y: 0.77, z: z0 + 1.0 - 0.25 }; this.cakePos = { x: x0 + 1.4 + 0.15, y: 0.77, z: z0 + 1.0 + 0.2 }; // the desk, until there is a break room
    // the office phone. beige. a cord. a red light for when it rings and nobody is in the office.
    const ph = new T.Group(); ph.position.set(x0 + 1.4 - 0.45, 0.77, z0 + 1.0 - 0.3); s.add(ph);
    const beige = new T.MeshStandardMaterial({ color: 0xd9d2bd, roughness: 0.7 });
    const base = new T.Mesh(new T.BoxGeometry(0.22, 0.06, 0.18), beige); base.position.y = 0.03; base.rotation.x = 0.12; ph.add(base);
    const pad = new T.Mesh(new T.PlaneGeometry(0.1, 0.09), new T.MeshBasicMaterial({ map: TX.label(T, ['1 2 3', '4 5 6', '7 8 9'], { size: 22 }) })); pad.position.set(0.04, 0.062, 0.0); pad.rotation.x = -Math.PI / 2 + 0.12; ph.add(pad);
    const hs = new T.Mesh(new T.BoxGeometry(0.05, 0.03, 0.2), beige); hs.position.set(-0.07, 0.085, 0); ph.add(hs);
    for (const z of [-0.085, 0.085]) { const cup = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 12), beige); cup.position.set(-0.07, 0.085, z); ph.add(cup); }
    const led = new T.Mesh(new T.SphereGeometry(0.008, 8, 6), new T.MeshStandardMaterial({ color: 0x441111, emissive: 0xff2020, emissiveIntensity: 0 })); led.position.set(0.09, 0.07, -0.07); ph.add(led); this.phoneLed = led;
    const cord = new T.Mesh(new T.TorusGeometry(0.03, 0.004, 6, 16, Math.PI), new T.MeshStandardMaterial({ color: 0x333 })); cord.position.set(0.1, 0.0, 0.08); cord.rotation.y = Math.PI / 2; ph.add(cord);
    ph.traverse((o) => { o.userData.interact = { type: 'phone', text: 'the office phone. it rings when you are at the far end of the shop.' }; });
    this.phonePos = { x: x0 + 0.95, z: z0 + 0.7 };
    const chair = new T.Group(); chair.position.set(x0 + 1.4, 0, z0 + 1.9);
    const cm = new T.MeshStandardMaterial({ color: 0x333, roughness: 0.8 });
    this.box(0.5, 0.06, 0.5, cm, 0, 0.45, 0, chair); this.box(0.5, 0.5, 0.06, cm, 0, 0.75, 0.24, chair);
    const post = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.4, 8), cm); post.position.y = 0.22; chair.add(post);
    s.add(chair); this.tag(chair, 'chair', 'the chair. it squeaks. a better one is $140.');
    this.wbMat = new T.MeshBasicMaterial({ map: TX.whiteboard(T, ['TO DO:', '- buy a mill', '- get a job', '- fix the door', '- coffee']) });
    const wb = new T.Mesh(new T.PlaneGeometry(1.6, 1.0), this.wbMat);
    wb.position.set(x1 - 0.07, 1.6, z0 + 1.6); wb.rotation.y = -Math.PI / 2; s.add(wb); this.tag(wb, 'whiteboard', 'the whiteboard. the real schedule.');
    // office light: one warm point
    const ol = new T.PointLight(0xffe8c0, 10, 0, 1.6); ol.position.set((x0 + x1) / 2, O.h - 0.2, (z0 + z1) / 2); s.add(ol);
    this.office = { x0, x1, z0, z1 };
    this.rooms = [];
    if (SHOP.inspection) {
      // the inspection room: glass walls in the north-east corner, cool and quiet. the CMM wants it.
      const I = SHOP.inspection, ix1 = hx, ix0 = hx - I.w, iz0 = -hz, iz1 = -hz + I.d;
      const glass = new T.MeshStandardMaterial({ color: 0x9fc3e6, transparent: true, opacity: 0.25, roughness: 0.05, side: T.DoubleSide });
      const frame = new T.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.5 });
      const doorX = ix0 + 0.9;
      this.box(0.06, 2.9, I.d, glass, ix0, 1.45, (iz0 + iz1) / 2); this.solid(ix0, (iz0 + iz1) / 2, 0.05, I.d / 2);
      const rightW = ix1 - (doorX + 0.5), leftW = (doorX - 0.5) - ix0;
      if (leftW > 0.05) { this.box(leftW, 2.9, 0.06, glass, ix0 + leftW / 2, 1.45, iz1); this.solid(ix0 + leftW / 2, iz1, leftW / 2, 0.05); }
      this.box(rightW, 2.9, 0.06, glass, ix1 - rightW / 2, 1.45, iz1); this.solid(ix1 - rightW / 2, iz1, rightW / 2, 0.05);
      this.box(1.0, 0.1, 0.06, frame, doorX, 2.9, iz1);
      for (const [x, z] of [[ix0, iz1], [doorX - 0.5, iz1], [doorX + 0.5, iz1]]) this.box(0.08, 2.95, 0.08, frame, x, 1.475, z);
      const lbl = new T.Mesh(new T.PlaneGeometry(0.9, 0.22), new T.MeshBasicMaterial({ map: TX.label(T, ['INSPECTION', '20 \u00b0C. DOOR SHUT.'], { size: 30 }) })); lbl.position.set(ix1 - rightW / 2, 2.3, iz1 + 0.05); s.add(lbl);
      this.rooms.push({ x0: ix0, x1: ix1, z0: iz0, z1: iz1, name: 'inspection' });
      // a granite surface plate on its stand, a height gauge, a case of gauge blocks nobody is allowed to touch
      const granite = new T.MeshStandardMaterial({ color: 0x1c1d20, roughness: 0.25, metalness: 0.1 });
      const px = ix1 - 1.2, pz = iz0 + 1.0;
      for (const [dx, dz] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) this.box(0.06, 0.78, 0.06, grey, px + dx, 0.39, pz + dz);
      this.box(0.95, 0.04, 0.6, grey, px, 0.8, pz);
      const plate = this.box(0.9, 0.12, 0.6, granite, px, 0.88, pz); this.tag(plate, 'plate', 'the surface plate. flat to a tenth. do not set your coffee on it.'); this.solid(px, pz, 0.5, 0.35);
      const hg = new T.Group(); hg.position.set(px + 0.25, 0.94, pz - 0.1); s.add(hg);
      const hgBase = new T.Mesh(new T.BoxGeometry(0.16, 0.05, 0.1), grey); hgBase.position.y = 0.025; hg.add(hgBase);
      const hgCol = new T.Mesh(new T.BoxGeometry(0.03, 0.5, 0.03), new T.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.8, roughness: 0.25 })); hgCol.position.set(-0.04, 0.3, 0); hg.add(hgCol);
      const hgSlide = new T.Mesh(new T.BoxGeometry(0.08, 0.07, 0.06), new T.MeshStandardMaterial({ color: 0x2b2b2b })); hgSlide.position.set(-0.04, 0.3, 0); hg.add(hgSlide);
      const hgArm = new T.Mesh(new T.BoxGeometry(0.1, 0.012, 0.02), new T.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.8 })); hgArm.position.set(0.04, 0.27, 0); hg.add(hgArm);
      hg.traverse((o) => { o.userData.interact = { type: 'gauge', text: 'the height gauge. zeroed, probably.' }; });
      const blocks = this.box(0.26, 0.05, 0.16, new T.MeshStandardMaterial({ color: 0x5a3b22, roughness: 0.7 }), px - 0.25, 0.965, pz + 0.15); this.tag(blocks, 'blocks', 'gauge blocks. wrung together once by an apprentice. once.');
      const lamp = new T.PointLight(0xdfe8ff, 6, 6, 1.8); lamp.position.set(px, 2.4, pz); s.add(lamp);
    }
    if (!SHOP.breakroom) this.vending(x1 + 1.0, z0 + 0.45);
    if (SHOP.breakroom) {
      // the break room, beside the office: a table, chairs, a fridge, the kettle's promotion
      const B = SHOP.breakroom, bx0 = x1 + 0.3, bx1 = bx0 + B.w, bz0 = z0, bz1 = z0 + B.d;
      this.box(0.12, 2.7, B.d, wallMat, bx1, 1.35, (bz0 + bz1) / 2); this.solid(bx1, (bz0 + bz1) / 2, 0.06, B.d / 2);
      const bw = (bx1 - bx0) - 1.0; this.box(bw, 2.7, 0.12, wallMat, bx0 + bw / 2, 1.35, bz1); this.solid(bx0 + bw / 2, bz1, bw / 2, 0.06);
      this.box(1.0, 0.6, 0.12, wallMat, bx1 - 0.5, 2.4, bz1);
      const tbl = this.box(1.2, 0.05, 0.7, new T.MeshStandardMaterial({ color: 0xd8d2c0 }), (bx0 + bx1) / 2, 0.75, (bz0 + bz1) / 2); for (const dx of [-0.5, 0.5]) for (const dz of [-0.25, 0.25]) this.box(0.05, 0.75, 0.05, grey, (bx0 + bx1) / 2 + dx, 0.37, (bz0 + bz1) / 2 + dz);
      this.solid((bx0 + bx1) / 2, (bz0 + bz1) / 2, 0.6, 0.35);
      const fridge = this.box(0.7, 1.7, 0.7, new T.MeshStandardMaterial({ color: 0xe8e8e4 }), bx0 + 0.5, 0.85, bz0 + 0.5); this.tag(fridge, 'fridge', 'the fridge. somebody\'s lunch from April.'); this.solid(bx0 + 0.5, bz0 + 0.5, 0.35, 0.35);
      const coffee = this.box(0.3, 0.4, 0.3, new T.MeshStandardMaterial({ color: 0x222 }), bx1 - 0.5, 0.95, bz0 + 0.4); this.tag(coffee, 'coffeemaker', 'the coffee machine. a real one. morale lives here.');
      this.box(1.0, 0.75, 0.5, grey, bx1 - 0.5, 0.375, bz0 + 0.4); this.solid(bx1 - 0.5, bz0 + 0.4, 0.5, 0.25);
      this.rooms.push({ x0: bx0, x1: bx1, z0: bz0, z1: bz1, name: 'breakroom' });
      this.jarPos = { x: bx1 - 0.2, y: 0.75, z: bz0 + 0.45 }; this.cakePos = { x: (bx0 + bx1) / 2 + 0.1, y: 0.775, z: (bz0 + bz1) / 2 };
      this.vending(bx1 - 1.4, bz0 + 0.45);
    }
  }

  // the vending machine. B4 is stuck. it has been stuck since the lease.
  vending(x, z, rot = 0) {
    const T = this.T, s = this.scene, g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = rot; s.add(g);
    const body = new T.Mesh(new T.BoxGeometry(0.9, 1.9, 0.75), new T.MeshStandardMaterial({ color: 0x24324a, roughness: 0.5, metalness: 0.3 })); body.position.y = 0.95; g.add(body);
    const front = new T.Mesh(new T.PlaneGeometry(0.62, 1.2), new T.MeshStandardMaterial({ map: TX.label(T, ['SNAX', 'A1 B2 C3', 'B4: STUCK'], { size: 30, bg: '#0e1a2b', fg: '#cfe0ff', border: '#3a6bb0' }), emissive: 0x335588, emissiveIntensity: 0.5 })); front.position.set(-0.1, 1.15, 0.376); g.add(front);
    const keypad = new T.Mesh(new T.BoxGeometry(0.16, 0.5, 0.02), new T.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.5 })); keypad.position.set(0.32, 1.25, 0.37); g.add(keypad);
    const slot = new T.Mesh(new T.BoxGeometry(0.6, 0.18, 0.03), new T.MeshStandardMaterial({ color: 0x111 })); slot.position.set(-0.1, 0.35, 0.37); g.add(slot);
    const glow = new T.PointLight(0x6a8fd0, 2.5, 3, 2); glow.position.set(0, 1.2, 0.6); g.add(glow);
    g.traverse((o) => { o.userData.interact = { type: 'vending', text: 'the vending machine. B4 is stuck. everyone knows B4 is stuck.' }; });
    this.solid(x, z, 0.5, 0.42);
    this.vendingPos = { x: x - Math.sin(rot) * 1.0, z: z + Math.cos(rot) * 1.0 };
    return g;
  }

  // a rectangle a machine may not be placed in (the office, the door apron)
  forbidden(x, z, hw, hd) {
    const o = this.office;
    if (x + hw > o.x0 - 0.3 && x - hw < o.x1 + 0.3 && z + hd > o.z0 && z - hd < o.z1 + 0.3) return 'that is the office';
    for (const r of this.rooms || []) if (r.name !== 'inspection' && x + hw > r.x0 - 0.3 && x - hw < r.x1 + 0.3 && z + hd > r.z0 && z - hd < r.z1 + 0.3) return 'that is the ' + (r.name === 'breakroom' ? 'break room' : r.name);
    for (const d of this.doors || [this.door]) if (x + hw > d.x - d.w / 2 - 0.5 && x - hw < d.x + d.w / 2 + 0.5 && z + hd > this.hz - 3.2) return 'keep the door clear';
    if (x + hw > this.hx - 2.2 && z + hd > this.hz - 2.4) return 'the compressor lives there';
    if (x - hw < -this.hx + 1.3 && z + hd > this.hz * 0.45 - 1.6 && z - hd < this.hz * 0.45 + 1.6) return 'that is the steel rack';
    return null;
  }

  update(dt, compOn) {
    this.t += dt;
    for (const { pivot, phase } of this.strips) pivot.rotation.x = Math.sin(this.t * 1.3 + phase) * 0.06 + Math.sin(this.t * 3.1 + phase * 2) * 0.02;
    if (this.fixtures[6]) { this.flickerT -= dt; if (this.flickerT <= 0) { this.flickerT = 0.05 + Math.random() * 1.8; this.flickMat.emissiveIntensity = Math.random() < 0.3 ? 0.15 : 1.6; } }
    if (this.compressor) { this.compressor.position.y = compOn ? Math.sin(this.t * 60) * 0.004 : 0; }
    if (this.craneBridge && this.craneTarget) { const b = this.craneBridge, t = this.craneTrolley; b.position.z += (this.craneTarget.z - b.position.z) * Math.min(1, dt * 0.3); t.position.x += (this.craneTarget.x - t.position.x) * Math.min(1, dt * 0.3); }
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
      for (const d of this.doors || [this.door]) {
        const slats = Math.ceil(d.h / 0.44);
        for (let i = 0; i < slats; i++) { const slat = new T.Mesh(new T.BoxGeometry(d.w + 0.1, 0.42, 0.06), mat); slat.position.set(d.x, 0.22 + i * 0.44, this.hz - 0.08); g.add(slat); const line = new T.Mesh(new T.BoxGeometry(d.w + 0.1, 0.02, 0.065), new T.MeshStandardMaterial({ color: 0x8a8e92 })); line.position.set(d.x, 0.44 + i * 0.44, this.hz - 0.08); g.add(line); }
        const drum = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, d.w + 0.4, 16), new T.MeshStandardMaterial({ color: 0x555, metalness: 0.5 })); drum.rotation.z = Math.PI / 2; drum.position.set(d.x, d.h + 0.2, this.hz - 0.3); g.add(drum);
        const win = new T.Mesh(new T.PlaneGeometry(0.5, 0.3), new T.MeshStandardMaterial({ color: 0x9fc3e6, transparent: true, opacity: 0.6 })); win.position.set(d.x, 1.65, this.hz - 0.04); win.rotation.y = Math.PI; g.add(win);
      }
      g.visible = false; this.scene.add(g); this.rollup = g; this.tag(g, 'door', 'a real door. insulated. the tarp is in the dumpster.');
    }
    this.rollup.visible = real; this.tarpGroup.visible = !real;
  }
  setWhiteboard(lines, doodle = null) { if (!this.wbMat) return; this.wbMat.map = TX.whiteboard(this.T, lines, doodle); this.wbMat.needsUpdate = true; }

  // the overhead crane: runway beams along both long walls, a bridge, a trolley and a hook
  setCrane(on) {
    if (this.craneOn === on) return; this.craneOn = on;
    const T = this.T;
    if (!this.crane && on) {
      const g = new T.Group();
      const orange = new T.MeshStandardMaterial({ color: 0xe0761a, roughness: 0.55, metalness: 0.3 });
      const steel = new T.MeshStandardMaterial({ color: 0x8a8f94, roughness: 0.5, metalness: 0.5 });
      const y = 5.0;
      for (const sx of [-this.hx + 0.3, this.hx - 0.3]) {
        const beam = new T.Mesh(new T.BoxGeometry(0.25, 0.4, this.hz * 2 - 0.6), orange); beam.position.set(sx, y, 0); g.add(beam);
        for (let z = -this.hz + 1.5; z < this.hz; z += 3) { const col = new T.Mesh(new T.BoxGeometry(0.18, y - 0.2, 0.18), steel); col.position.set(sx, (y - 0.2) / 2, z); g.add(col); }
      }
      const bridge = new T.Group(); bridge.position.set(0, y + 0.4, -2);
      const girder = new T.Mesh(new T.BoxGeometry(this.hx * 2 - 0.4, 0.5, 0.35), orange); bridge.add(girder);
      for (const sx of [-this.hx + 0.3, this.hx - 0.3]) { const end = new T.Mesh(new T.BoxGeometry(0.4, 0.3, 1.0), steel); end.position.set(sx, -0.1, 0); bridge.add(end); }
      const trolley = new T.Group(); trolley.position.set(1.5, -0.35, 0);
      const tb = new T.Mesh(new T.BoxGeometry(0.6, 0.4, 0.6), steel); trolley.add(tb);
      const drum = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.4, 12), new T.MeshStandardMaterial({ color: 0x333 })); drum.rotation.z = Math.PI / 2; drum.position.y = -0.1; trolley.add(drum);
      const cable = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 1.6, 6), new T.MeshStandardMaterial({ color: 0x222 })); cable.position.y = -1.0; trolley.add(cable);
      const hook = new T.Mesh(new T.TorusGeometry(0.1, 0.03, 8, 16, Math.PI * 1.5), new T.MeshStandardMaterial({ color: 0xd8b24a, metalness: 0.6, roughness: 0.4 })); hook.position.y = -1.9; hook.rotation.z = Math.PI * 0.75; trolley.add(hook);
      const block = new T.Mesh(new T.BoxGeometry(0.2, 0.3, 0.14), new T.MeshStandardMaterial({ color: 0xd0a020 })); block.position.y = -1.75; trolley.add(block);
      bridge.add(trolley); g.add(bridge);
      // the pendant on a cable, hanging from the bridge
      const pend = new T.Mesh(new T.BoxGeometry(0.1, 0.3, 0.06), new T.MeshStandardMaterial({ color: 0xe8e400 })); pend.position.set(-1.0, -2.2, 0.3); bridge.add(pend);
      const pcable = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 2.0, 6), new T.MeshStandardMaterial({ color: 0x222 })); pcable.position.set(-1.0, -1.1, 0.3); bridge.add(pcable);
      this.craneBridge = bridge; this.craneTrolley = trolley;
      this.scene.add(g); this.crane = g; this.roofStuff.push(g);
      this.tag(g, 'crane', 'the crane. five tonnes. everyone stopped to watch the first lift.');
    }
    if (this.crane) this.crane.visible = on;
  }
  // the crane drifts to where the work is, slowly, when something heavy is on the floor
  craneTo(x, z) { this.craneTarget = { x, z }; }

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
  // the orphaned mold: somebody's very nice tool in the south-west corner with a FOR SALE sign on it
  setOrphans(n) {
    const T = this.T, s = this.scene;
    if (!this.orphanG) { this.orphanG = new T.Group(); s.add(this.orphanG); this.orphanG.position.set(-this.hx + 1.5, 0, this.hz - 1.6); this.orphanG.traverse((o) => { o.userData.interact = { type: 'orphan' }; }); }
    const g = this.orphanG; while (g.children.length) g.remove(g.children[0]);
    for (let i = 0; i < Math.min(n, 3); i++) {
      const steel = new T.MeshStandardMaterial({ color: 0x8a9096, metalness: 0.6, roughness: 0.35 });
      const base = new T.Mesh(new T.BoxGeometry(0.8, 0.7, 0.7), steel); base.position.set(i * 1.0, 0.35, 0); g.add(base);
      for (const y of [0.1, 0.6]) { const plate = new T.Mesh(new T.BoxGeometry(0.84, 0.06, 0.74), new T.MeshStandardMaterial({ color: 0x5a6066, metalness: 0.5 })); plate.position.set(i * 1.0, y, 0); g.add(plate); }
      const line = new T.Mesh(new T.BoxGeometry(0.82, 0.015, 0.72), new T.MeshStandardMaterial({ color: 0x222 })); line.position.set(i * 1.0, 0.35, 0); g.add(line);
      const eye = new T.Mesh(new T.TorusGeometry(0.05, 0.012, 8, 16), steel); eye.position.set(i * 1.0, 0.76, 0); eye.rotation.x = Math.PI / 2; g.add(eye);
    }
    if (n > 0) { const sign = new T.Mesh(new T.PlaneGeometry(0.5, 0.3), new T.MeshBasicMaterial({ map: TX.label(T, ['FOR SALE', 'ONE OWNER', 'NEVER RAN'], { size: 30, bg: '#f2e76b', border: '#333', fg: '#111' }), side: T.DoubleSide })); sign.position.set(0, 0.95, -0.2); sign.rotation.y = Math.PI; sign.rotation.x = 0.3; g.add(sign); }
    g.traverse((o) => { o.userData.interact = { type: 'orphan', text: `${n} mold${n === 1 ? '' : 's'} nobody will pay for. a very nice mold, in a corner, with a for-sale sign.` }; });
    g.visible = n > 0;
  }
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
