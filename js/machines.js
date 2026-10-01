// Machines, as shapes. Stylised silhouettes with a nameplate and a light stack.
import { byId } from './catalog.js';
import * as TX from './textures.js';

const mats = {};
function M(T, key, opts) { if (!mats[key]) mats[key] = new T.MeshStandardMaterial(opts); return mats[key]; }

function nameplate(T, def, parent, x, y, z, ry = 0, w = 0.5) {
  const lines = def.model ? [def.brand.toUpperCase(), def.model] : [def.brand.toUpperCase()];
  const m = new T.Mesh(new T.PlaneGeometry(w, w * 0.4), new T.MeshBasicMaterial({ map: TX.label(T, lines, { size: 36 }) }));
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}

function lightStack(T, parent, x, y, z) {
  const g = new T.Group(); g.position.set(x, y, z);
  const pole = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.2, 8), M(T, 'dark', { color: 0x222 })); pole.position.y = 0.1; g.add(pole);
  const lamps = {};
  [['red', 0xd0021b, 0.5], ['amber', 0xf0b429, 0.36], ['green', 0x2ecc40, 0.22]].forEach(([k, c, y]) => {
    const l = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.12, 12), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0, roughness: 0.4 }));
    l.position.y = y; g.add(l); lamps[k] = l;
  });
  parent.add(g); return lamps;
}

function greenButton(T, parent, x, y, z, ry = 0) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry;
  const plate = new T.Mesh(new T.BoxGeometry(0.2, 0.14, 0.03), M(T, 'ctrl', { color: 0x333, roughness: 0.5 })); g.add(plate);
  const btn = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.03, 16), new T.MeshStandardMaterial({ color: 0x2ecc40, emissive: 0x2ecc40, emissiveIntensity: 0.4 }));
  btn.rotation.x = Math.PI / 2; btn.position.set(-0.05, 0, 0.025); g.add(btn);
  const stop = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 16), new T.MeshStandardMaterial({ color: 0xd0021b, emissive: 0xd0021b, emissiveIntensity: 0.3 }));
  stop.rotation.x = Math.PI / 2; stop.position.set(0.05, 0, 0.025); g.add(stop);
  parent.add(g); return btn;
}

export function buildMachine(T, def, ghost = false) {
  const g = new T.Group();
  const steel = ghost ? null : M(T, 'steel', { color: 0x4a6a8a, roughness: 0.5, metalness: 0.3 });
  const grey = ghost ? null : M(T, 'grey', { color: 0x8a8f94, roughness: 0.4, metalness: 0.6 });
  const dark = ghost ? null : M(T, 'dark', { color: 0x222, roughness: 0.6 });
  const chrome = ghost ? null : M(T, 'chrome', { color: 0xcfd4d8, roughness: 0.2, metalness: 0.9 });
  const wood = ghost ? null : M(T, 'wood', { color: 0x9a7a52, roughness: 0.8 });
  const gm = ghost ? new T.MeshStandardMaterial({ color: 0x2ecc40, transparent: true, opacity: 0.45, depthWrite: false }) : null;
  const mat = (m) => ghost ? gm : m;
  const box = (w, h, d, m, x, y, z, p = g) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), mat(m)); o.position.set(x, y, z); p.add(o); return o; };
  const cyl = (r, h, m, x, y, z, p = g, rz = 0, rx = 0) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, 20), mat(m)); o.position.set(x, y, z); o.rotation.z = rz; o.rotation.x = rx; p.add(o); return o; };
  const parts = { spin: [], lamps: null, button: null };

  switch (def.kind) {
    case 'mill': {
      // Bridgeford. column, knee, table, head with a round spindle, handwheels.
      box(0.55, 1.6, 0.6, steel, 0, 0.8, -0.45);
      box(0.9, 0.5, 0.9, steel, 0, 0.3, -0.35);
      box(0.6, 0.4, 0.5, steel, 0, 1.0, 0.0);                       // knee
      box(1.4, 0.08, 0.3, grey, 0, 1.24, 0.1);                       // table
      box(0.3, 0.06, 0.06, chrome, 0, 1.3, 0.1);                     // vise-ish
      const ram = box(0.3, 0.3, 0.9, steel, 0, 2.0, -0.1);
      const head = box(0.4, 0.5, 0.4, steel, 0, 1.75, 0.25);
      const quill = cyl(0.05, 0.3, chrome, 0, 1.4, 0.25);
      const spindle = cyl(0.03, 0.12, chrome, 0, 1.3, 0.25); parts.spin.push({ mesh: spindle, axis: 'y' });
      const pulley = cyl(0.17, 0.08, dark, 0, 2.06, 0.25); parts.spin.push({ mesh: pulley, axis: 'y' });
      const hw1 = cyl(0.09, 0.03, chrome, 0.78, 1.2, 0.1, g, Math.PI / 2); const hw2 = cyl(0.09, 0.03, chrome, -0.78, 1.2, 0.1, g, Math.PI / 2);
      if (!ghost) { nameplate(T, def, g, 0, 1.78, 0.46, 0, 0.3); parts.lamps = lightStack(T, g, 0.1, 2.15, -0.35); parts.button = greenButton(T, g, 0.3, 1.1, 0.46); }
      break;
    }
    case 'lathe': {
      box(2.4, 0.18, 0.5, steel, 0, 0.8, -0.1);                      // bed
      box(0.5, 0.7, 0.9, steel, -0.85, 0.35, -0.1); box(0.5, 0.7, 0.9, steel, 0.85, 0.35, -0.1); // legs
      box(0.6, 0.6, 0.7, steel, -0.85, 1.18, -0.2);                  // headstock
      const chuck = cyl(0.14, 0.12, chrome, -0.5, 1.2, 0.0, g, Math.PI / 2); parts.spin.push({ mesh: chuck, axis: 'x' });
      box(0.4, 0.3, 0.4, steel, 0.8, 1.05, -0.1);                    // tailstock
      box(0.4, 0.25, 0.5, grey, 0.1, 1.02, 0.0);                     // carriage
      cyl(0.08, 0.03, chrome, 0.1, 0.95, 0.3, g, 0, Math.PI / 2);
      box(2.2, 0.1, 0.25, grey, 0, 0.6, 0.2);                        // chip tray lip
      if (!ghost) { nameplate(T, def, g, -0.85, 1.3, 0.16, 0, 0.36); parts.lamps = lightStack(T, g, -1.0, 1.5, -0.4); parts.button = greenButton(T, g, -0.45, 0.95, 0.26); }
      break;
    }
    case 'grinder': {
      box(0.9, 0.9, 1.2, steel, 0, 0.45, 0.1);                       // base
      box(1.0, 0.06, 0.4, grey, 0, 0.95, 0.3);                       // table
      box(0.9, 0.05, 0.3, chrome, 0, 1.0, 0.3);                      // mag chuck
      box(0.4, 1.0, 0.5, steel, 0, 1.3, -0.4);                       // column
      box(0.5, 0.35, 0.35, steel, 0, 1.45, 0.05);                    // wheel head
      const guard = box(0.45, 0.28, 0.14, dark, 0, 1.3, 0.25);
      const wheel = cyl(0.11, 0.025, grey, 0, 1.25, 0.33, g, 0, Math.PI / 2); parts.spin.push({ mesh: wheel, axis: 'z' });
      cyl(0.1, 0.03, chrome, 0.55, 0.7, 0.3, g, Math.PI / 2); cyl(0.1, 0.03, chrome, 0, 0.7, 0.75, g, 0, Math.PI / 2);
      if (!ghost) { nameplate(T, def, g, 0, 1.7, -0.14, 0, 0.3); parts.lamps = lightStack(T, g, 0.3, 1.85, -0.4); parts.button = greenButton(T, g, 0.4, 1.05, 0.5); }
      break;
    }
    case 'bench': {
      box(2.0, 0.08, 0.8, wood, 0, 0.9, 0);
      for (const x of [-0.9, 0.9]) for (const z of [-0.3, 0.3]) box(0.06, 0.88, 0.06, grey, x, 0.44, z);
      box(0.5, 0.2, 0.6, grey, 0.5, 0.82, 0);                        // drawer unit
      box(0.2, 0.18, 0.3, dark, -0.5, 1.03, 0.1);                    // vise
      box(0.28, 0.04, 0.04, chrome, -0.5, 1.03, 0.28);
      const lampArm = cyl(0.012, 0.6, grey, 0.7, 1.25, -0.3, g, 0.4);
      const shade = new T.Mesh(new T.ConeGeometry(0.1, 0.12, 16, 1, true), mat(ghost ? gm : new T.MeshStandardMaterial({ color: 0x2f6b3a, side: T.DoubleSide, emissive: 0xffe8b0, emissiveIntensity: ghost ? 0 : 0.5 })));
      shade.position.set(0.55, 1.5, -0.1); shade.rotation.x = Math.PI; g.add(shade);
      if (!ghost) nameplate(T, def, g, 0.5, 0.9, 0.31, 0, 0.3);
      break;
    }
    case 'drill': {
      box(0.5, 0.08, 0.5, steel, 0, 0.04, 0);
      const col = cyl(0.04, 1.6, chrome, 0, 0.85, -0.15);
      box(0.4, 0.04, 0.4, grey, 0, 0.9, 0.05);
      box(0.3, 0.3, 0.45, steel, 0, 1.55, 0.0);
      const ch = cyl(0.03, 0.1, dark, 0, 1.35, 0.1); parts.spin.push({ mesh: ch, axis: 'y' });
      if (!ghost) { nameplate(T, def, g, 0, 1.55, 0.23, 0, 0.22); parts.lamps = lightStack(T, g, 0.1, 1.7, -0.2); parts.button = greenButton(T, g, 0.2, 1.4, 0.05, Math.PI / 2); }
      break;
    }
    case 'saw': {
      box(0.5, 0.6, 0.6, steel, -0.5, 0.3, 0); box(0.6, 0.6, 0.6, steel, 0.5, 0.3, 0);
      box(1.6, 0.06, 0.6, grey, 0, 0.63, 0);
      box(1.2, 0.3, 0.2, steel, 0.1, 0.95, -0.15);                   // arm
      const w1 = cyl(0.14, 0.06, dark, -0.4, 0.95, 0.0, g, 0, Math.PI / 2); const w2 = cyl(0.14, 0.06, dark, 0.6, 0.95, 0.0, g, 0, Math.PI / 2);
      parts.spin.push({ mesh: w1, axis: 'z' }, { mesh: w2, axis: 'z' });
      if (!ghost) { nameplate(T, def, g, 0.1, 0.95, -0.26, Math.PI, 0.3); parts.lamps = lightStack(T, g, 0.7, 1.2, -0.15); parts.button = greenButton(T, g, 0.7, 0.8, 0.31); }
      break;
    }
  }
  g.userData.parts = parts;
  return g;
}

// axis-aligned half sizes for a machine at rotation rot (degrees, multiples of 90)
export function halfSizes(def, rot) { const r = ((rot % 180) + 180) % 180; return r === 0 ? { hw: def.w / 2, hd: def.d / 2 } : { hw: def.d / 2, hd: def.w / 2 }; }

export class MachineView {
  constructor(T, scene, m) {
    this.T = T; this.scene = scene; this.m = m; this.def = byId(m.id);
    this.group = buildMachine(T, this.def);
    this.group.position.set(m.x, 0, m.z); this.group.rotation.y = (m.rot * Math.PI) / 180;
    this.group.traverse((o) => { o.userData.interact = { type: 'machine', uid: m.uid }; });
    this.group.visible = !!m.placed;
    scene.add(this.group);
    this.spinAngle = 0;
  }
  sync() { const m = this.m; this.group.position.set(m.x, 0, m.z); this.group.rotation.y = (m.rot * Math.PI) / 180; this.group.visible = !!m.placed; }
  update(dt) {
    const p = this.group.userData.parts, m = this.m;
    if (m.running) { this.spinAngle += dt * 24; for (const s of p.spin) s.mesh.rotation[s.axis] = this.spinAngle; }
    if (p.lamps) {
      const done = Object.values(m.checklist || {}).filter(Boolean).length;
      p.lamps.green.material.emissiveIntensity = m.running ? 1.4 : 0;
      p.lamps.amber.material.emissiveIntensity = !m.running && done > 0 ? 1.0 : 0;
      p.lamps.red.material.emissiveIntensity = m.condition < 0.3 ? 1.2 : 0;
    }
  }
  collider() { const { hw, hd } = halfSizes(this.def, this.m.rot); return { x: this.m.x, z: this.m.z, hw, hd }; }
  dispose() { this.scene.remove(this.group); }
}
