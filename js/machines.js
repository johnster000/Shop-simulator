// Machines, as shapes. Stylised, but every part is attached to the part it should be attached to.
// A knee mill is a base, a column on the base, a knee on the column's front, a saddle and table on
// the knee, a ram on the column's top, and a head hanging off the front of the ram. If the head
// floats, the moldmaker notices.
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
  const foot = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.02, 12), M(T, 'dark', { color: 0x222 })); foot.position.y = 0.01; g.add(foot);
  const pole = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.16, 8), M(T, 'dark', { color: 0x222 })); pole.position.y = 0.09; g.add(pole);
  const lamps = {};
  [['red', 0xd0021b, 0.44], ['amber', 0xf0b429, 0.33], ['green', 0x2ecc40, 0.22]].forEach(([k, c, y]) => {
    const l = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.1, 12), new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0, roughness: 0.4 }));
    l.position.y = y; g.add(l); lamps[k] = l;
  });
  const cap = new T.Mesh(new T.CylinderGeometry(0.032, 0.032, 0.02, 12), M(T, 'dark', { color: 0x222 })); cap.position.y = 0.5; g.add(cap);
  parent.add(g); return lamps;
}

function greenButton(T, parent, x, y, z, ry = 0) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry;
  const plate = new T.Mesh(new T.BoxGeometry(0.18, 0.12, 0.03), M(T, 'ctrl', { color: 0x333, roughness: 0.5 })); g.add(plate);
  const btn = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 16), new T.MeshStandardMaterial({ color: 0x2ecc40, emissive: 0x2ecc40, emissiveIntensity: 0.4 }));
  btn.rotation.x = Math.PI / 2; btn.position.set(-0.045, 0, 0.025); g.add(btn);
  const stop = new T.Mesh(new T.CylinderGeometry(0.028, 0.028, 0.03, 16), new T.MeshStandardMaterial({ color: 0xd0021b, emissive: 0xd0021b, emissiveIntensity: 0.3 }));
  stop.rotation.x = Math.PI / 2; stop.position.set(0.045, 0, 0.025); g.add(stop);
  parent.add(g); return btn;
}

// a handwheel: a rim, a hub, three spokes, and a handle, facing along `axis`
function handwheel(T, parent, r, mat, x, y, z, axis = 'x') {
  const g = new T.Group(); g.position.set(x, y, z);
  const rim = new T.Mesh(new T.TorusGeometry(r, r * 0.12, 8, 24), mat); g.add(rim);
  const hub = new T.Mesh(new T.CylinderGeometry(r * 0.25, r * 0.25, r * 0.5, 12), mat); hub.rotation.x = Math.PI / 2; g.add(hub);
  for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.BoxGeometry(r * 0.1, r * 1.9, r * 0.1), mat); s.rotation.z = (i * Math.PI * 2) / 3; g.add(s); }
  const handle = new T.Mesh(new T.CylinderGeometry(r * 0.08, r * 0.08, r * 0.5, 8), mat); handle.rotation.x = Math.PI / 2; handle.position.set(r * 0.8, 0, r * 0.25); g.add(handle);
  if (axis === 'x') g.rotation.y = Math.PI / 2; else if (axis === 'y') g.rotation.x = -Math.PI / 2; // 'z' faces +z as built
  parent.add(g); return g;
}

export function buildMachine(T, def, ghost = false) {
  const g = new T.Group();
  const gm = ghost ? new T.MeshStandardMaterial({ color: 0x2ecc40, transparent: true, opacity: 0.45, depthWrite: false }) : null;
  const mat = (key, opts) => ghost ? gm : M(T, key, opts);
  const steel = mat('steel', { color: 0x4a6a8a, roughness: 0.55, metalness: 0.25 });
  const steelDark = mat('steelDark', { color: 0x3a5068, roughness: 0.6, metalness: 0.25 });
  const grey = mat('grey', { color: 0x8a8f94, roughness: 0.4, metalness: 0.6 });
  const dark = mat('dark', { color: 0x222, roughness: 0.6 });
  const chrome = mat('chrome', { color: 0xcfd4d8, roughness: 0.2, metalness: 0.9 });
  const wood = mat('wood', { color: 0x9a7a52, roughness: 0.8 });
  const black = mat('black', { color: 0x151515, roughness: 0.5 });
  const box = (w, h, d, m, x, y, z, p = g) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); p.add(o); return o; };
  const cyl = (r, h, m, x, y, z, p = g, rz = 0, rx = 0, r2 = r) => { const o = new T.Mesh(new T.CylinderGeometry(r, r2, h, 24), m); o.position.set(x, y, z); o.rotation.z = rz; o.rotation.x = rx; p.add(o); return o; };
  const parts = { spin: [], lamps: null, button: null };
  // a tube from one point to another: hoses, cables, conduit
  const tube = (r, m, a, b) => { const from = new T.Vector3(...a), to = new T.Vector3(...b), len = from.distanceTo(to); const o = new T.Mesh(new T.CylinderGeometry(r, r, len, 10), m); o.position.copy(from).add(to).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.clone().sub(from).normalize()); g.add(o); return o; };

  switch (def.look || def.kind) {
    case 'mill': {
      // Bridgeford. +z is the front (where the operator stands).
      box(0.72, 0.25, 0.78, steelDark, 0, 0.125, -0.42);                 // base casting, feet at the floor
      box(0.4, 1.6, 0.5, steel, 0, 1.05, -0.5);                          // column: 0.25 -> 1.85, front face at z = -0.25
      box(0.3, 1.3, 0.04, grey, 0, 0.95, -0.24);                         // the dovetail ways on the column front
      box(0.52, 0.5, 0.5, steel, 0, 0.75, 0.0);                          // knee: on the column front, 0.5 -> 1.0
      cyl(0.03, 0.5, chrome, 0, 0.25, 0.0);                              // knee elevating screw, down to the base
      box(0.4, 0.1, 0.42, steel, 0, 1.05, 0.0);                          // saddle on the knee
      box(1.1, 0.09, 0.25, grey, 0, 1.105, 0.05);                        // table on the saddle, top at 1.15
      for (const sx of [-0.33, 0, 0.33]) box(0.02, 0.012, 0.25, dark, sx, 1.156, 0.05); // T-slots
      box(0.24, 0.12, 0.2, dark, 0.3, 1.21, 0.05);                       // a vise, bolted off to the side
      cyl(0.012, 0.2, chrome, 0.3, 1.26, 0.17, g, Math.PI / 2);          // vise handle
      cyl(0.22, 0.08, steelDark, 0, 1.89, -0.5);                         // turret ring on the column top
      box(0.28, 0.2, 0.95, steel, 0, 2.03, -0.15);                       // ram on the turret, reaching forward to z = 0.325
      box(0.36, 0.5, 0.4, steel, 0, 1.65, 0.2);                          // head hung off the ram's front: 1.4 -> 1.9, z 0 -> 0.4
      box(0.3, 0.1, 0.3, steelDark, 0, 1.95, 0.2);                       // belt housing on top of the head
      const motor = cyl(0.11, 0.32, black, 0, 2.16, 0.2);                // motor on the belt housing: 2.0 -> 2.32
      cyl(0.12, 0.04, black, 0, 2.34, 0.2);                              // motor cap
      cyl(0.045, 0.22, chrome, 0, 1.33, 0.2);                            // quill, out of the head bottom: 1.22 -> 1.44
      cyl(0.034, 0.05, chrome, 0, 1.2, 0.2, g, 0, 0, 0.028);             // spindle nose
      const endmill = cyl(0.006, 0.05, dark, 0, 1.175, 0.2); parts.spin.push({ mesh: endmill, axis: 'y' }, { mesh: motor, axis: 'y' });
      cyl(0.012, 0.25, chrome, 0.2, 1.5, 0.32, g, Math.PI / 2);          // quill feed lever on the head's right
      cyl(0.03, 0.03, black, 0.33, 1.5, 0.32, g, Math.PI / 2);           // its knob
      handwheel(T, g, 0.09, chrome, 0.58, 1.105, 0.05, 'x');             // table handwheels at both ends
      handwheel(T, g, 0.09, chrome, -0.58, 1.105, 0.05, 'x');
      handwheel(T, g, 0.08, chrome, 0.0, 0.75, 0.27, 'z');               // knee crank on the knee front
      handwheel(T, g, 0.06, chrome, 0.22, 1.05, 0.0, 'x');               // cross feed on the saddle's right
      box(0.12, 0.26, 0.12, dark, -0.24, 1.7, 0.2);                      // the work light's transformer box, bolted to the head's left side
      cyl(0.015, 0.3, dark, -0.3, 1.52, 0.28, g, 0.4, 0.5);              // the work light's arm, out of that box
      if (!ghost) { nameplate(T, def, g, 0, 1.75, 0.405, 0, 0.24); parts.lamps = lightStack(T, g, -0.19, 1.85, -0.55); parts.button = greenButton(T, g, 0.18, 0.92, 0.26); }
      break;
    }
    case 'lathe': {
      // Hardedge. The spindle axis runs along x; the operator stands at +z.
      box(1.5, 0.75, 0.75, steelDark, 0, 0.375, -0.1);                   // cabinet base
      box(0.4, 0.25, 0.4, steel, -0.5, 0.75, -0.1);                      // headstock pedestal
      box(1.7, 0.14, 0.42, steel, 0, 0.82, -0.05);                       // bed, top at 0.89
      box(1.7, 0.03, 0.05, chrome, 0, 0.905, 0.1);                       // front way
      box(1.7, 0.03, 0.05, chrome, 0, 0.905, -0.2);                      // rear way
      box(0.52, 0.48, 0.5, steel, -0.5, 1.13, -0.1);                     // headstock on the bed: 0.89 -> 1.37
      box(0.52, 0.06, 0.5, steelDark, -0.5, 1.4, -0.1);                  // headstock lid
      cyl(0.055, 0.08, chrome, -0.2, 1.17, -0.05, g, Math.PI / 2);       // spindle nose out of the headstock's right face
      const chuck = cyl(0.11, 0.08, grey, -0.13, 1.17, -0.05, g, Math.PI / 2); parts.spin.push({ mesh: chuck, axis: 'x' });
      for (let i = 0; i < 3; i++) { const j = new T.Mesh(new T.BoxGeometry(0.02, 0.03, 0.07), dark); j.position.set(-0.085, 1.17 + Math.sin(i * 2.094) * 0.07, -0.05 + Math.cos(i * 2.094) * 0.07); chuck.add; g.add(j); } // chuck jaws
      box(0.3, 0.22, 0.3, steel, 0.6, 1.0, -0.05);                       // tailstock body on the bed: 0.89 -> 1.11
      box(0.2, 0.2, 0.2, steel, 0.6, 1.17, -0.05);                       // tailstock top
      cyl(0.03, 0.22, chrome, 0.42, 1.17, -0.05, g, Math.PI / 2);        // tailstock quill toward the chuck
      cyl(0.04, 0.04, chrome, 0.78, 1.17, -0.05, g, Math.PI / 2);        // tailstock handwheel hub
      handwheel(T, g, 0.07, chrome, 0.78, 1.17, -0.05, 'x');
      box(0.36, 0.1, 0.42, steel, 0.12, 0.96, -0.05);                    // carriage riding the ways: 0.91 -> 1.01
      box(0.36, 0.22, 0.14, steelDark, 0.12, 0.82, 0.22);                // apron hanging off the carriage front
      handwheel(T, g, 0.08, chrome, 0.12, 0.82, 0.3, 'z');               // apron handwheel
      box(0.22, 0.08, 0.32, steel, 0.12, 1.05, -0.05);                   // cross slide
      box(0.14, 0.1, 0.14, steel, 0.12, 1.14, 0.0);                      // compound
      box(0.08, 0.1, 0.08, dark, 0.12, 1.24, 0.0);                       // tool post
      box(0.1, 0.012, 0.012, grey, 0.02, 1.2, -0.02);                    // the tool
      handwheel(T, g, 0.05, chrome, 0.12, 1.05, 0.14, 'z');              // cross slide handwheel
      box(1.3, 0.45, 0.03, steelDark, 0.1, 1.12, -0.33);                 // splash guard behind the bed
      box(1.7, 0.03, 0.14, steelDark, 0, 0.76, 0.22);                    // chip pan lip
      box(0.3, 0.25, 0.1, dark, -0.55, 0.3, 0.28);                       // control box low on the cabinet
      if (!ghost) { nameplate(T, def, g, -0.5, 1.25, 0.16, 0, 0.3); parts.lamps = lightStack(T, g, -0.68, 1.43, -0.25); parts.button = greenButton(T, g, -0.35, 1.0, 0.16); }
      break;
    }
    case 'grinder': {
      if (def.id === 'cncgrind') {
        // Okeymoto CNC grinder: the same machine inside a splash enclosure with a window and a control on the side.
        const enc = mat('encG', { color: 0xcfd6d2, roughness: 0.6, metalness: 0.2 });
        box(1.8, 0.2, 1.8, steelDark, 0, 0.1, 0);
        box(1.8, 1.7, 1.6, enc, 0, 1.05, -0.1);                          // enclosure: 0.2 -> 1.9
        box(0.9, 0.6, 0.05, ghost ? gm : new T.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.5 }), -0.1, 1.2, 0.71);
        box(0.04, 0.4, 0.05, dark, 0.45, 1.2, 0.73);
        box(1.0, 0.07, 0.4, grey, 0, 0.75, 0.0); box(0.5, 0.05, 0.25, chrome, 0, 0.81, 0);   // table and chuck inside
        const wheel = cyl(0.1, 0.025, grey, 0.3, 1.0, 0.0, g, Math.PI / 2); parts.spin.push({ mesh: wheel, axis: 'x' });
        box(0.4, 0.7, 0.08, dark, 1.1, 1.3, 0.76);                       // control panel, right front
        const scr = new T.Mesh(new T.PlaneGeometry(0.3, 0.22), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x9a9a2a, emissiveIntensity: 0.6 })); scr.position.set(1.1, 1.45, 0.805); g.add(scr);
        box(0.6, 0.5, 0.5, steelDark, -0.9, 0.45, -1.2);                 // coolant and filter unit behind
        if (!ghost) { nameplate(T, def, g, -0.5, 1.7, 0.71, 0, 0.36); parts.lamps = lightStack(T, g, -0.7, 1.9, -0.6); parts.button = greenButton(T, g, 1.1, 1.05, 0.805); }
        break;
      }
      // Herring surface grinder. Wheel axis along x; the table traverses along x; operator at +z.
      box(0.72, 0.75, 1.05, steelDark, 0, 0.375, 0.05);                  // base: 0 -> 0.75
      box(0.4, 1.1, 0.42, steel, 0, 1.3, -0.4);                          // column at the back: 0.75 -> 1.85, front face z = -0.19
      box(0.7, 0.1, 0.5, steel, 0, 0.8, 0.15);                           // saddle on the base: 0.75 -> 0.85
      box(0.95, 0.07, 0.32, grey, 0, 0.885, 0.15);                       // table on the saddle, top at 0.92
      box(0.5, 0.05, 0.2, chrome, 0, 0.945, 0.15);                       // magnetic chuck on the table, top at 0.97
      box(0.15, 0.04, 0.1, grey, 0, 0.99, 0.15);                         // a block on the chuck
      box(0.4, 0.34, 0.5, steel, 0, 1.22, -0.05);                        // wheelhead hung from the column front: 1.05 -> 1.39, z -0.3 -> 0.2
      cyl(0.03, 0.14, chrome, 0.26, 1.15, 0.12, g, Math.PI / 2);         // wheel spindle out of the wheelhead's right face
      const wheel = cyl(0.1, 0.025, grey, 0.33, 1.15, 0.12, g, Math.PI / 2); parts.spin.push({ mesh: wheel, axis: 'x' });
      box(0.07, 0.14, 0.26, dark, 0.33, 1.22, 0.12);                     // wheel guard over the top half
      box(0.07, 0.02, 0.26, dark, 0.33, 1.14, 0.12);
      box(0.3, 0.12, 0.3, black, 0, 1.45, -0.05);                        // motor on the wheelhead
      box(0.06, 0.05, 0.12, dark, 0.33, 1.3, 0.1);                       // coolant nozzle block on the guard
      handwheel(T, g, 0.1, chrome, 0, 0.5, 0.6, 'z');                    // table traverse, front
      handwheel(T, g, 0.07, chrome, 0.38, 0.6, 0.15, 'x');               // cross feed, right side
      handwheel(T, g, 0.07, chrome, 0, 1.75, -0.15, 'z');                // downfeed on the column front, top
      box(0.5, 0.3, 0.02, dark, 0.2, 0.3, 0.58);                         // switch panel on the base front
      if (!ghost) { nameplate(T, def, g, 0, 1.6, -0.18, 0, 0.26); parts.lamps = lightStack(T, g, -0.12, 1.85, -0.45); parts.button = greenButton(T, g, 0.2, 0.42, 0.59); }
      break;
    }
    case 'vmc': {
      // Hoss-style vertical machining centre. Enclosed, a window in the door, a pendant on the right.
      const enc = def.id === 'hardmill' ? mat('encDark', { color: 0x3a4652, roughness: 0.5, metalness: 0.3 }) : mat('enc', { color: 0xd8dbe0, roughness: 0.6, metalness: 0.2 });
      const glass = ghost ? gm : new T.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.3 });
      box(2.2, 0.12, 1.9, steelDark, 0, 0.06, 0);                        // base skid
      box(2.2, 0.5, 1.9, steel, 0, 0.37, 0);                             // casting band: 0.12 -> 0.62
      box(2.2, 1.9, 1.9, enc, 0, 1.57, -0.05);                           // enclosure: 0.62 -> 2.52, front face at z = 0.9
      box(2.2, 0.08, 1.9, steelDark, 0, 2.56, -0.05);                    // top rail
      box(2.3, 0.3, 0.6, steel, 0, 2.75, -0.7);                          // the column cap above the enclosure, at the back
      // the door: two sliding panels on a track, each with a window; the right one is open a crack
      for (const side of [-1, 1]) {
        const dx = side * 0.5 + (side > 0 ? 0.12 : 0);
        box(0.98, 1.7, 0.05, enc, dx, 1.6, 0.93);                        // panel
        box(0.74, 0.8, 0.06, glass, dx, 1.75, 0.935);                    // window
        box(0.04, 0.5, 0.06, dark, dx + side * 0.44, 1.55, 0.95);        // handle
      }
      box(2.1, 0.06, 0.08, dark, 0, 2.5, 0.95);                          // door track
      // inside, seen through the window: the table and the spindle
      box(1.0, 0.1, 0.5, grey, 0, 1.0, 0.25);                            // table
      box(0.3, 0.1, 0.2, dark, 0.1, 1.08, 0.25);                         // a vise
      box(0.4, 0.6, 0.5, steelDark, 0, 2.0, -0.2);                       // spindle head
      const spin = cyl(0.05, 0.3, chrome, 0, 1.55, 0.0); parts.spin.push({ mesh: spin, axis: 'y' });
      cyl(0.012, 0.08, dark, 0, 1.36, 0.0);                              // the cutter
      // pendant: arm off the right side, screen and keypad facing the operator
      cyl(0.03, 0.5, dark, 1.35, 1.75, 0.6, g, Math.PI / 2);             // arm
      box(0.08, 0.7, 0.5, dark, 1.6, 1.55, 0.75);                        // pendant body
      const scr = new T.Mesh(new T.PlaneGeometry(0.34, 0.26), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x2a6a9a, emissiveIntensity: 0.6 })); scr.position.set(1.645, 1.7, 0.75); scr.rotation.y = Math.PI / 2; g.add(scr);
      box(0.02, 0.2, 0.4, grey, 1.645, 1.35, 0.75);                      // keypad
      box(0.6, 0.5, 0.5, dark, 1.3, 0.37, -0.5);                         // chip conveyor motor box, right rear
      box(0.5, 0.3, 0.3, steelDark, 1.45, 0.27, 0.7);                    // chip bin
      box(1.0, 0.5, 0.4, steelDark, -0.5, 0.3, -1.1);                    // coolant tank behind
      if (!ghost) { nameplate(T, def, g, -0.5, 2.25, 0.96, 0, 0.5); parts.lamps = lightStack(T, g, -0.9, 2.6, 0.5); parts.button = greenButton(T, g, 1.645, 1.2, 0.75, Math.PI / 2); }
      break;
    }
    case 'five': {
      // Hermlin-style 5-axis. A big white enclosure with a tall window, the trunnion table inside, the tool drum on the left,
      // the control on a swing arm on the right. +z is the front.
      const enc = mat('encFive', { color: 0xe6e8ea, roughness: 0.5, metalness: 0.15 }), trim = mat('trimFive', { color: 0x2b3f63, roughness: 0.5, metalness: 0.3 });
      const glass = ghost ? gm : new T.MeshStandardMaterial({ color: 0x1d2b3a, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.3 });
      box(3.2, 0.14, 2.9, steelDark, 0, 0.07, 0);                        // skid
      box(3.0, 0.5, 2.8, steel, 0, 0.39, -0.05);                         // casting band
      box(3.0, 2.3, 2.8, enc, 0, 1.79, -0.05);                           // enclosure 0.64 -> 2.94, front face z = 1.35
      box(3.0, 0.1, 2.8, trim, 0, 2.98, -0.05);                          // roof trim
      box(3.0, 0.16, 0.06, trim, 0, 0.72, 1.37);                         // sill stripe
      // the big door, one slab, with a tall window and the brand down the side
      box(1.9, 2.0, 0.06, enc, 0.1, 1.85, 1.38);
      box(1.3, 1.3, 0.07, glass, 0.1, 1.95, 1.385);
      box(0.05, 0.6, 0.07, dark, 1.0, 1.7, 1.42);                        // handle
      box(2.9, 0.06, 0.1, dark, 0, 2.9, 1.4);                            // door track
      // inside: the trunnion. two towers, a cradle, a round table with a part on it, the spindle above
      for (const side of [-1, 1]) box(0.3, 0.7, 0.5, grey, side * 0.75, 1.1, 0.3);  // trunnion towers
      const cradle = box(1.2, 0.18, 0.5, steelDark, 0, 1.05, 0.3); cradle.rotation.x = -0.35;
      const table = cyl(0.32, 0.08, chrome, 0, 1.2, 0.33); table.rotation.x = -0.35; parts.spin.push({ mesh: table, axis: 'y' });
      box(0.26, 0.16, 0.2, mat('p20', { color: 0x7a8088, metalness: 0.6, roughness: 0.4 }), 0, 1.3, 0.37);
      box(0.5, 0.7, 0.6, steelDark, 0, 2.2, -0.2);                       // spindle head
      const spin = cyl(0.06, 0.3, chrome, 0, 1.72, 0.2); parts.spin.push({ mesh: spin, axis: 'y' });
      cyl(0.01, 0.1, dark, 0, 1.5, 0.2);                                 // the cutter
      // the tool magazine: a drum on the left, in its own cabinet, with a little window
      box(0.7, 1.6, 1.2, enc, -1.85, 1.3, -0.3);
      const drum = cyl(0.42, 0.3, steelDark, -1.85, 1.5, -0.3, g, 0, Math.PI / 2); parts.spin.push({ mesh: drum, axis: 'z' });
      for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; cyl(0.025, 0.1, chrome, -1.85 - 0.16, 1.5 + Math.sin(a) * 0.34, -0.3 + Math.cos(a) * 0.34, g, Math.PI / 2); }
      box(0.4, 0.5, 0.06, glass, -1.85, 1.5, 0.31);
      // control on a swing arm, right side
      cyl(0.04, 0.7, dark, 1.55, 2.0, 0.9, g, Math.PI / 2);              // arm
      box(0.1, 0.9, 0.6, trim, 1.95, 1.65, 1.1);                         // control housing
      const scr = new T.Mesh(new T.PlaneGeometry(0.44, 0.34), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x3a7aaa, emissiveIntensity: 0.6 })); scr.position.set(2.005, 1.85, 1.1); scr.rotation.y = Math.PI / 2; g.add(scr);
      box(0.02, 0.22, 0.5, grey, 2.005, 1.4, 1.1);                       // keypad
      cyl(0.05, 0.02, mat('redBtn', { color: 0xcc2222 }), 2.015, 1.26, 0.95, g, 0, Math.PI / 2); // E-stop
      // chip conveyor out the back, coolant tank, hydraulic unit
      box(0.5, 0.5, 1.2, steelDark, -0.9, 0.55, -1.9); box(0.5, 1.2, 0.5, steelDark, -0.9, 1.0, -2.4);
      box(1.2, 0.6, 0.5, steelDark, 0.8, 0.35, -1.65); box(0.5, 0.7, 0.5, grey, 1.6, 0.4, -1.65);
      if (!ghost) { nameplate(T, def, g, -0.9, 2.5, 1.41, 0, 0.55); parts.lamps = lightStack(T, g, -1.3, 3.05, 0.6); parts.button = greenButton(T, g, 2.015, 1.26, 1.25, Math.PI / 2); }
      break;
    }
    case 'press': {
      // Lad Machines 55-ton: a long horizontal machine. Clamp unit on the left with four tie bars, injection unit on the right
      // with the barrel and the hopper, a safety gate with a window across the front, the controls at the right. +z is the front.
      const green = mat('pressGreen', { color: 0x3b6e4f, roughness: 0.55, metalness: 0.25 }), cream = mat('pressCream', { color: 0xe4e0d2, roughness: 0.6 });
      const glass = ghost ? gm : new T.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.3 });
      box(4.4, 0.6, 1.4, green, 0, 0.3, 0);                              // machine base, full length
      box(4.4, 0.06, 1.4, steelDark, 0, 0.03, 0);
      // clamp unit: two platens and the tie bars between them
      box(0.25, 1.3, 1.1, steel, -1.7, 1.25, 0);                         // stationary platen (centre)
      box(0.25, 1.3, 1.1, steel, -0.6, 1.25, 0);                         // moving platen
      box(0.3, 1.2, 1.0, green, -2.05, 1.2, 0);                          // rear/clamp cylinder housing
      for (const [y, z] of [[0.75, -0.4], [0.75, 0.4], [1.75, -0.4], [1.75, 0.4]]) cyl(0.05, 1.8, chrome, -1.3, y, z, g, Math.PI / 2); // tie bars
      cyl(0.18, 0.5, steelDark, -1.98, 1.25, 0, g, Math.PI / 2);        // clamp cylinder
      // a mold in the press: two halves, bolted up
      box(0.22, 0.6, 0.5, mat('p20b', { color: 0x7a8088, metalness: 0.6, roughness: 0.4 }), -1.45, 1.2, 0); box(0.22, 0.6, 0.5, mat('p20b'), -0.85, 1.2, 0);
      // injection unit: barrel, heater bands, hopper, the carriage
      box(1.4, 0.7, 0.9, green, 1.0, 1.1, -0.1);                         // carriage
      cyl(0.11, 1.5, steel, 0.2, 1.45, 0, g, Math.PI / 2);               // barrel
      for (let i = 0; i < 4; i++) cyl(0.13, 0.08, dark, -0.2 + i * 0.3, 1.45, 0, g, Math.PI / 2); // heater bands
      cyl(0.04, 0.3, chrome, -1.5, 1.45, 0, g, Math.PI / 2);             // nozzle, into the platen
      const hop = new T.Mesh(new T.CylinderGeometry(0.32, 0.08, 0.6, 16), cream); hop.position.set(1.0, 1.95, -0.1); g.add(hop); // hopper
      cyl(0.33, 0.06, dark, 1.0, 2.26, -0.1);                            // hopper lid
      box(0.5, 0.5, 0.6, steelDark, 1.9, 1.05, -0.1);                    // screw drive motor
      // the safety gate: a frame with a window across the clamp area, front
      box(2.2, 1.5, 0.05, green, -1.3, 1.4, 0.65); box(1.6, 0.9, 0.06, glass, -1.3, 1.5, 0.66);
      box(0.05, 0.4, 0.06, dark, -0.35, 1.3, 0.69);                      // gate handle
      box(2.2, 0.08, 0.1, dark, -1.3, 2.18, 0.68);                       // gate rail
      // control cabinet at the right end, screen angled to the operator
      box(0.5, 1.3, 1.2, cream, 2.2, 1.25, 0.1);
      const scr = new T.Mesh(new T.PlaneGeometry(0.4, 0.3), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x2a9a6a, emissiveIntensity: 0.6 })); scr.position.set(2.2, 1.6, 0.71); g.add(scr);
      box(0.3, 0.14, 0.02, grey, 2.2, 1.3, 0.71);                        // keypad
      // the parts chute under the mold, a bin in front
      const chute = box(0.9, 0.04, 0.6, steelDark, -1.15, 0.72, 0.35); chute.rotation.x = 0.35;
      box(0.6, 0.4, 0.4, mat('binGrey', { color: 0x4a4e52, roughness: 0.8 }), -1.15, 0.2, 0.95);
      if (!ghost) { nameplate(T, def, g, 0.4, 0.75, 0.71, 0, 0.5); parts.lamps = lightStack(T, g, 2.2, 2.0, -0.3); parts.button = greenButton(T, g, 2.35, 1.15, 0.72); }
      parts.spin.push({ mesh: hop, axis: 'y' });
      break;
    }
    case 'heat': {
      // Kilnworth vacuum furnace. A square insulated box on legs, a heavy hinged door with a wheel, a pyrometer on the
      // control cabinet at the right, a vacuum pump at the back, a vent stack. +z is the front; the door opens toward you.
      const skin = mat('ovenSkin', { color: 0x9aa3a8, roughness: 0.5, metalness: 0.4 }), hot = ghost ? gm : new T.MeshStandardMaterial({ color: 0x331a0a, emissive: 0xff5a1a, emissiveIntensity: 0.0, roughness: 0.9 });
      for (const [x, z] of [[-0.7, -0.8], [0.7, -0.8], [-0.7, 0.6], [0.7, 0.6]]) box(0.1, 0.4, 0.1, steelDark, x, 0.2, z); // legs
      box(1.7, 1.5, 1.6, skin, 0, 1.15, -0.1);                           // the box 0.4 -> 1.9
      box(1.75, 0.08, 1.65, steelDark, 0, 1.94, -0.1);                   // top band
      box(1.75, 0.08, 1.65, steelDark, 0, 0.44, -0.1);                   // bottom band
      // the door: a thick slab on two hinges, a locking wheel, a sight glass glowing when it runs
      box(1.2, 1.1, 0.16, skin, 0.05, 1.15, 0.78);
      for (const y of [0.75, 1.55]) cyl(0.04, 0.2, steelDark, -0.6, y, 0.78, g, 0, 0); // hinges
      const wheel = new T.Mesh(new T.TorusGeometry(0.16, 0.02, 8, 24), chrome); wheel.position.set(0.35, 1.15, 0.88); g.add(wheel);
      for (const a of [0, Math.PI / 2]) { const sp = box(0.3, 0.02, 0.02, chrome, 0.35, 1.15, 0.88); sp.rotation.z = a; }
      const sight = cyl(0.06, 0.02, hot, -0.2, 1.35, 0.87, g, 0, Math.PI / 2); parts.glow = sight;
      // control cabinet on the right with the pyrometer dial and a chart recorder
      box(0.5, 1.3, 0.7, mat('ovenCab', { color: 0xd9d5c6, roughness: 0.6 }), 1.1, 1.05, 0.3); box(0.46, 0.4, 0.66, steelDark, 1.1, 0.2, 0.3); // cabinet on its plinth
      const dial = new T.Mesh(new T.PlaneGeometry(0.26, 0.26), ghost ? gm : new T.MeshBasicMaterial({ map: TX.label(T, ['°C', '1025'], { size: 30 }) })); dial.position.set(1.1, 1.45, 0.66); g.add(dial);
      box(0.2, 0.16, 0.02, dark, 1.1, 1.05, 0.66);                       // chart recorder
      cyl(0.05, 0.02, mat('redBtn', { color: 0xcc2222 }), 1.22, 0.85, 0.66, g, 0, Math.PI / 2);
      // vacuum pump and the vent stack at the back
      cyl(0.16, 0.5, steelDark, -0.5, 0.5, -1.15, g, Math.PI / 2); box(0.3, 0.3, 0.3, dark, -0.1, 0.5, -1.15);
      cyl(0.08, 1.4, grey, 0.5, 2.6, -0.5);                              // stack
      // a basket on the floor in front, with blocks in it
      box(0.5, 0.25, 0.4, mat('basket', { color: 0x5a5e62, roughness: 0.8, metalness: 0.3 }), -0.6, 0.13, 1.1);
      box(0.14, 0.1, 0.12, mat('p20b', { color: 0x7a8088, metalness: 0.6, roughness: 0.4 }), -0.68, 0.3, 1.08); box(0.1, 0.1, 0.1, mat('p20b'), -0.5, 0.3, 1.14);
      if (!ghost) { nameplate(T, def, g, -0.45, 1.75, 0.87, 0, 0.3); parts.lamps = lightStack(T, g, 1.1, 1.75, 0.0); parts.button = greenButton(T, g, 1.0, 0.85, 0.66); }
      break;
    }
    case 'sinker': {
      // Sinker EDM: a column at the back, a ram head that comes down, an open work tank full of dielectric.
      const fluid = ghost ? gm : new T.MeshStandardMaterial({ color: 0x6a7a3a, transparent: true, opacity: 0.6, roughness: 0.1 });
      box(1.6, 0.6, 1.4, steelDark, 0, 0.3, 0);                          // base: 0 -> 0.6
      box(0.6, 1.9, 0.6, steel, 0, 1.55, -0.55);                         // column at the back: 0.6 -> 2.5
      box(0.5, 0.5, 0.9, steel, 0, 2.2, -0.1);                           // head on the column, reaching forward
      box(0.3, 0.6, 0.3, steelDark, 0, 1.6, 0.2);                        // the ram, coming down from the head
      const holder = box(0.12, 0.1, 0.12, chrome, 0, 1.25, 0.2);         // electrode holder (System 3Q)
      box(0.06, 0.12, 0.06, dark, 0, 1.14, 0.2);                         // the graphite electrode
      // the work tank: walls, a front door, and the dielectric with a block in it
      box(1.3, 0.02, 1.0, grey, 0, 0.61, 0.15);                          // tank floor
      box(1.3, 0.5, 0.03, grey, 0, 0.85, 0.65); box(1.3, 0.5, 0.03, grey, 0, 0.85, -0.35); // front and back walls
      box(0.03, 0.5, 1.0, grey, -0.65, 0.85, 0.15); box(0.03, 0.5, 1.0, grey, 0.65, 0.85, 0.15); // sides
      box(1.24, 0.02, 0.96, fluid, 0, 1.0, 0.15);                        // dielectric surface
      box(0.3, 0.3, 0.3, grey, 0, 0.77, 0.2);                            // the workpiece, under the electrode
      box(0.4, 0.03, 0.03, chrome, 0, 1.11, 0.66);                       // door latch
      box(0.6, 0.7, 0.6, steelDark, 1.1, 0.95, -0.4);                    // dielectric reservoir and filter unit, right rear
      tube(0.02, dark, [1.1, 1.3, -0.4], [0.5, 1.0, 0.15]);               // the hose, from the reservoir down into the tank
      cyl(0.03, 0.9, dark, -0.72, 1.95, -0.4, g, Math.PI / 2);           // pendant arm, out of the column's left face
      box(0.5, 0.6, 0.08, dark, -1.15, 1.65, -0.4);                      // pendant body on the arm's end
      const scr = new T.Mesh(new T.PlaneGeometry(0.34, 0.26), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x2a9a6a, emissiveIntensity: 0.6 })); scr.position.set(-1.15, 1.75, -0.355); g.add(scr);
      if (!ghost) { nameplate(T, def, g, 0, 2.2, 0.36, 0, 0.36); parts.lamps = lightStack(T, g, 0.2, 2.45, -0.55); parts.button = greenButton(T, g, -1.15, 1.42, -0.355); }
      break;
    }
    case 'wire': {
      // Wire EDM: a work tank at the front with a window, a U arm over it, a spool up the back.
      const glass = ghost ? gm : new T.MeshStandardMaterial({ color: 0x334455, transparent: true, opacity: 0.5, roughness: 0.1 });
      box(1.8, 0.7, 1.6, steelDark, 0, 0.35, 0);                         // base: 0 -> 0.7
      box(0.5, 1.6, 0.5, steel, 0, 1.5, -0.55);                          // column at the back: 0.7 -> 2.3
      box(0.3, 0.35, 1.1, steel, 0, 2.1, -0.1);                          // upper arm reaching forward over the tank
      box(0.2, 0.5, 0.2, steelDark, 0, 1.65, 0.35);                      // upper head at the arm's end
      cyl(0.012, 0.8, chrome, 0, 1.25, 0.35);                            // the wire, vertical (fine, bright)
      box(0.3, 0.3, 1.0, steel, 0, 0.85, -0.05);                         // lower arm, under the table
      box(1.2, 0.04, 0.9, grey, 0, 1.0, 0.2);                            // table
      box(0.5, 0.06, 0.4, grey, 0, 1.05, 0.3);                           // a plate being cut
      box(1.4, 0.75, 0.03, grey, 0, 1.3, 0.72); box(1.4, 0.75, 0.03, grey, 0, 1.3, -0.3); // tank front and back
      box(0.03, 0.75, 1.0, grey, -0.7, 1.3, 0.2); box(0.03, 0.75, 1.0, grey, 0.7, 1.3, 0.2);
      box(0.8, 0.45, 0.035, glass, 0, 1.3, 0.73);                        // window in the tank front
      const spool = cyl(0.14, 0.12, grey, 0.35, 2.35, -0.55, g, Math.PI / 2); parts.spin.push({ mesh: spool, axis: 'x' }); // wire spool on the column top
      box(0.1, 0.1, 0.1, dark, 0.35, 2.15, -0.55);                       // spool mount
      box(0.6, 1.9, 0.6, steelDark, 1.4, 0.95, -0.3);                    // control cabinet, right
      const scr = new T.Mesh(new T.PlaneGeometry(0.34, 0.26), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x9a6a2a, emissiveIntensity: 0.6 })); scr.position.set(1.4, 1.6, 0.005); g.add(scr);
      box(0.4, 0.3, 0.02, grey, 1.4, 1.2, 0.0);                          // keypad
      box(0.5, 0.4, 0.4, dark, -1.0, 0.9, -0.5);                         // deionizer / resin bottle box, left rear
      box(0.5, 0.08, 0.3, dark, 1.05, 0.04, -0.3);                       // cable duct on the floor, base to cabinet
      if (!ghost) { nameplate(T, def, g, -0.4, 1.85, -0.29, 0, 0.36); parts.lamps = lightStack(T, g, -0.15, 2.3, -0.55); parts.button = greenButton(T, g, 1.4, 0.95, 0.005); }
      break;
    }
    case 'spot': {
      // Millennial spotting press: a big blue H-frame, a fixed lower platen, a moving upper platen on four columns.
      const blue = mat('pressBlue', { color: 0x2a4a7a, roughness: 0.5, metalness: 0.3 });
      box(2.0, 0.3, 1.6, blue, 0, 0.15, 0);                              // base
      for (const sx of [-0.8, 0.8]) for (const sz of [-0.55, 0.55]) cyl(0.07, 2.1, chrome, sx, 1.35, sz); // four columns: 0.3 -> 2.4
      box(1.8, 0.22, 1.3, grey, 0, 0.56, 0);                             // lower platen on the base
      box(1.2, 0.12, 0.9, steelDark, 0, 0.73, 0);                        // the B half, sitting on the platen
      box(1.8, 0.22, 1.3, grey, 0, 1.75, 0);                             // upper platen, up on the columns
      box(1.2, 0.12, 0.9, steelDark, 0, 1.58, 0);                        // the A half, hung under it
      box(2.0, 0.4, 1.6, blue, 0, 2.6, 0);                               // crown: 2.4 -> 2.8
      cyl(0.18, 0.5, blue, 0, 2.1, 0);                                   // the ram, down from the crown to the upper platen
      box(0.5, 0.8, 0.3, dark, 1.3, 0.9, 0.6);                           // hydraulic unit, right front
      box(0.4, 0.6, 0.1, dark, -1.15, 1.4, 0.5);                         // control box, left
      cyl(0.03, 0.5, dark, -1.15, 1.0, 0.5, g, 0, 0);                    // its pole
      if (!ghost) { nameplate(T, def, g, 0, 2.6, 0.81, 0, 0.5); parts.lamps = lightStack(T, g, -0.7, 2.8, -0.5); parts.button = greenButton(T, g, -1.15, 1.25, 0.56); }
      break;
    }
    case 'cmm': {
      // Zeus CMM: a granite table on a stand, a bridge over it on air bearings, a probe head, a glass-walled enclosure.
      const granite = mat('granite', { color: 0x2a2a2e, roughness: 0.35, metalness: 0.1 });
      const glass = ghost ? gm : new T.MeshStandardMaterial({ color: 0x9fc3e6, transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2 });
      box(1.5, 0.5, 1.3, steelDark, 0, 0.25, 0);                         // stand
      box(1.6, 0.18, 1.4, granite, 0, 0.59, 0);                          // the granite
      for (const sx of [-0.7, 0.7]) box(0.1, 0.8, 0.14, grey, sx, 1.08, 0.2); // bridge legs on the table
      box(1.6, 0.14, 0.14, grey, 0, 1.55, 0.2);                          // bridge beam
      box(0.12, 0.14, 0.3, dark, 0.2, 1.55, 0.2);                        // carriage on the beam
      cyl(0.03, 0.6, chrome, 0.2, 1.2, 0.2);                             // the Z ram down from the carriage
      cyl(0.018, 0.1, dark, 0.2, 0.93, 0.2);                             // probe body
      cyl(0.006, 0.05, chrome, 0.2, 0.86, 0.2);                          // stylus
      const ruby = new T.Mesh(new T.SphereGeometry(0.008, 8, 6), ghost ? gm : new T.MeshStandardMaterial({ color: 0xd0021b })); ruby.position.set(0.2, 0.835, 0.2); g.add(ruby);
      box(0.3, 0.12, 0.2, grey, -0.2, 0.74, -0.1);                       // a part on the granite
      // enclosure: posts and glass, open at the front
      for (const sx of [-0.78, 0.78]) for (const sz of [-0.68, 0.68]) box(0.05, 1.6, 0.05, grey, sx, 1.5, sz);
      box(1.6, 1.5, 0.02, glass, 0, 1.55, -0.68); box(0.02, 1.5, 1.4, glass, -0.78, 1.55, 0); box(0.02, 1.5, 1.4, glass, 0.78, 1.55, 0);
      box(1.6, 0.05, 1.4, grey, 0, 2.3, 0);                              // enclosure top rail
      box(0.5, 0.9, 0.5, dark, 1.1, 0.45, -0.9);                         // controller cabinet, right rear
      box(0.5, 0.4, 0.05, dark, 1.1, 1.1, -0.7);                         // the monitor on it
      const scr = new T.Mesh(new T.PlaneGeometry(0.42, 0.32), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x7a7aba, emissiveIntensity: 0.6 })); scr.position.set(1.1, 1.1, -0.67); g.add(scr);
      if (!ghost) { nameplate(T, def, g, -0.45, 1.1, -0.65, 0, 0.3); parts.lamps = lightStack(T, g, 1.1, 0.9, -0.9); parts.button = greenButton(T, g, 1.1, 0.75, -0.64); }
      break;
    }
    case 'graphite': {
      // Rudders graphite mill: a small sealed high-speed mill with a big extraction hose off the top.
      const white = mat('white', { color: 0xe8e8e4, roughness: 0.6 });
      const glass = ghost ? gm : new T.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.5, roughness: 0.1 });
      box(1.6, 0.15, 1.6, steelDark, 0, 0.075, 0);
      box(1.6, 2.0, 1.4, white, 0, 1.15, -0.1);                          // sealed cabinet: 0.15 -> 2.15
      box(0.9, 0.9, 0.05, glass, 0, 1.3, 0.61);                          // window
      box(0.04, 0.5, 0.05, dark, 0.5, 1.3, 0.63);                        // door handle
      box(1.0, 0.1, 0.6, grey, 0, 0.75, 0.0);                            // table inside
      const sp = cyl(0.03, 0.25, chrome, 0, 1.4, 0.0); parts.spin.push({ mesh: sp, axis: 'y' });
      box(0.1, 0.08, 0.1, dark, 0, 0.84, 0.0);                           // an electrode blank
      cyl(0.09, 0.3, dark, 0.4, 2.3, -0.4);                              // extraction stub on the roof
      tube(0.09, mat('hose', { color: 0x333, roughness: 0.9 }), [0.4, 2.45, -0.4], [1.1, 1.6, -0.9]); // the hose, down to the dust collector
      box(0.6, 1.2, 0.6, dark, 1.1, 0.6, -0.9);                          // dust collector unit, right rear
      cyl(0.09, 0.4, dark, 1.1, 1.4, -0.9);                              // its inlet
      box(0.5, 0.6, 0.08, dark, 0.95, 1.5, 0.66);                        // pendant on the right front
      const scr = new T.Mesh(new T.PlaneGeometry(0.34, 0.26), ghost ? gm : new T.MeshStandardMaterial({ color: 0x0b1a2a, emissive: 0x2a9a9a, emissiveIntensity: 0.6 })); scr.position.set(0.95, 1.6, 0.705); g.add(scr);
      if (!ghost) { nameplate(T, def, g, -0.45, 1.95, 0.61, 0, 0.36); parts.lamps = lightStack(T, g, -0.6, 2.15, -0.5); parts.button = greenButton(T, g, 0.95, 1.28, 0.705); }
      break;
    }
    case 'laser': {
      // Alfa Lazer: a bench cabinet with a microscope head on an arm over a small work chamber.
      box(0.9, 0.8, 0.8, steelDark, 0, 0.4, 0);                          // cabinet
      box(0.9, 0.06, 0.8, grey, 0, 0.83, 0);                             // top
      box(0.6, 0.5, 0.5, dark, -0.1, 1.11, -0.1);                        // chamber at the back of the top
      box(0.4, 0.3, 0.02, ghost ? gm : new T.MeshStandardMaterial({ color: 0x223344, transparent: true, opacity: 0.5 }), -0.1, 1.15, 0.16); // chamber window
      cyl(0.03, 0.5, chrome, 0.3, 1.1, 0.0);                             // column
      box(0.3, 0.08, 0.3, grey, 0.15, 1.4, 0.0);                         // arm
      cyl(0.05, 0.3, dark, 0.0, 1.55, 0.0);                              // microscope head
      cyl(0.03, 0.12, dark, 0.0, 1.73, 0.03, g, 0, -0.6);                // eyepieces
      box(0.3, 0.2, 0.02, dark, 0.3, 0.95, 0.4);                         // touch panel on the front
      cyl(0.015, 0.3, chrome, -0.25, 0.9, 0.3, g, 0, 0.3);               // the hand piece on a rest
      if (!ghost) { nameplate(T, def, g, -0.25, 0.6, 0.41, 0, 0.3); parts.lamps = lightStack(T, g, 0.35, 0.86, -0.3); parts.button = greenButton(T, g, 0.3, 0.75, 0.41); }
      break;
    }
    case 'bench': {
      box(2.0, 0.07, 0.8, wood, 0, 0.9, 0);                              // top, 0.865 -> 0.935
      for (const x of [-0.92, 0.92]) for (const z of [-0.32, 0.32]) box(0.06, 0.865, 0.06, grey, x, 0.4325, z);
      box(1.84, 0.03, 0.64, grey, 0, 0.3, 0);                            // lower shelf
      box(1.84, 0.04, 0.04, grey, 0, 0.84, 0.36);                        // front apron rail
      box(0.5, 0.42, 0.62, grey, 0.6, 0.63, 0);                          // drawer unit under the top
      for (const y of [0.5, 0.72]) { box(0.44, 0.015, 0.01, dark, 0.6, y, 0.315); } // drawer pulls
      box(0.18, 0.1, 0.12, dark, -0.55, 0.985, 0.12);                    // vise body on the top
      box(0.06, 0.1, 0.12, dark, -0.4, 0.985, 0.12);                     // moving jaw
      cyl(0.015, 0.14, chrome, -0.47, 0.985, 0.12, g, Math.PI / 2);      // screw
      cyl(0.008, 0.16, chrome, -0.37, 0.985, 0.12, g, 0, 0);             // handle, vertical
      box(0.3, 0.01, 0.2, chrome, -0.1, 0.94, 0.0);                      // a surface plate-ish block
      box(0.06, 0.03, 0.12, dark, -0.1, 0.96, 0.05);                     // a part on it
      cyl(0.03, 0.02, dark, 0.2, 0.945, -0.25);                          // lamp base
      cyl(0.012, 0.45, dark, 0.2, 1.16, -0.25);                          // lamp post
      cyl(0.012, 0.4, dark, 0.35, 1.3, -0.1, g, -0.8, 0.5);              // lamp arm
      const shade = new T.Mesh(new T.ConeGeometry(0.1, 0.12, 16, 1, true), ghost ? gm : new T.MeshStandardMaterial({ color: 0x2f6b3a, side: T.DoubleSide, emissive: 0xffe8b0, emissiveIntensity: 0.5 }));
      shade.position.set(0.5, 1.28, 0.05); shade.rotation.x = Math.PI; shade.rotation.z = 0.3; g.add(shade);
      box(0.25, 0.04, 0.18, wood, 0.75, 0.955, 0.2);                     // a wooden tool tray
      if (!ghost) nameplate(T, def, g, 0.6, 0.63, 0.315, 0, 0.24);
      break;
    }
    case 'drill': {
      box(0.5, 0.07, 0.5, steelDark, 0, 0.035, 0.05);                    // base plate
      cyl(0.045, 1.7, chrome, 0, 0.92, -0.15);                           // column: 0.07 -> 1.77
      box(0.14, 0.12, 0.14, steel, 0, 0.9, -0.15);                       // table clamp collar on the column
      box(0.36, 0.04, 0.36, grey, 0, 0.98, 0.05);                        // table, cantilevered off the collar
      box(0.1, 0.06, 0.2, steel, 0, 0.98, -0.1);                         // table arm
      handwheel(T, g, 0.05, chrome, 0.1, 0.9, -0.15, 'x');               // table crank
      box(0.3, 0.3, 0.5, steel, 0, 1.65, 0.05);                          // head on the column top: 1.5 -> 1.8, z -0.2 -> 0.3
      const motor = cyl(0.09, 0.26, black, 0, 1.65, -0.35, g, 0, Math.PI / 2); // motor hanging off the back of the head
      box(0.28, 0.08, 0.32, steelDark, 0, 1.84, 0.0);                    // pulley cover on top
      cyl(0.04, 0.2, chrome, 0, 1.45, 0.2);                              // quill out of the head bottom: 1.35 -> 1.55
      const chuck = cyl(0.03, 0.08, dark, 0, 1.33, 0.2); parts.spin.push({ mesh: chuck, axis: 'y' }, { mesh: motor, axis: 'x' });
      cyl(0.004, 0.09, chrome, 0, 1.25, 0.2);                            // a drill
      for (let i = 0; i < 3; i++) { const h = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.26, 8), chrome); h.position.set(0.17, 1.6, 0.2); h.rotation.z = Math.PI / 2 + (i * Math.PI * 2) / 3; h.rotation.y = 0; g.add(h); } // feed handles, right side
      box(0.08, 0.1, 0.03, dark, -0.1, 1.6, 0.31);                       // switch on the head front
      if (!ghost) { nameplate(T, def, g, 0.05, 1.7, 0.305, 0, 0.18); parts.lamps = lightStack(T, g, -0.1, 1.88, -0.05); parts.button = greenButton(T, g, -0.1, 1.6, 0.31); }
      break;
    }
    case 'saw': {
      // Jat horizontal band saw. Blade runs along x. Operator at +z.
      box(0.5, 0.55, 0.55, steelDark, -0.5, 0.275, 0); box(0.5, 0.55, 0.55, steelDark, 0.5, 0.275, 0); // cabinet legs
      box(1.5, 0.08, 0.5, steel, 0, 0.59, 0);                            // bed, top at 0.63
      box(0.5, 0.12, 0.12, grey, -0.1, 0.69, 0.14);                      // vise fixed jaw on the bed
      box(0.08, 0.12, 0.12, grey, 0.2, 0.69, 0.14);                      // vise moving jaw
      cyl(0.02, 0.4, chrome, 0.45, 0.69, 0.14, g, Math.PI / 2);          // vise screw
      box(0.1, 0.08, 0.08, grey, 0.05, 0.67, 0.14);                      // a bar of stock in the vise
      const pivot = new T.Group(); pivot.position.set(-0.6, 0.65, -0.1); pivot.rotation.z = 0.12; g.add(pivot); // the arm, hinged at the left
      box(1.4, 0.18, 0.14, steel, 0.7, 0.3, 0, pivot);                   // arm beam
      box(0.36, 0.36, 0.1, steelDark, 0.1, 0.3, 0.1, pivot);             // drive wheel housing, left
      box(0.36, 0.36, 0.1, steelDark, 1.3, 0.3, 0.1, pivot);             // idler wheel housing, right
      const w1 = cyl(0.14, 0.03, dark, 0.1, 0.3, 0.17, pivot, 0, Math.PI / 2); const w2 = cyl(0.14, 0.03, dark, 1.3, 0.3, 0.17, pivot, 0, Math.PI / 2);
      parts.spin.push({ mesh: w1, axis: 'z' }, { mesh: w2, axis: 'z' });
      box(0.9, 0.012, 0.003, chrome, 0.7, 0.16, 0.17, pivot);            // the blade, lower run
      box(0.1, 0.2, 0.06, dark, 0.45, 0.2, 0.17, pivot); box(0.1, 0.2, 0.06, dark, 0.95, 0.2, 0.17, pivot); // blade guides
      const motor = cyl(0.08, 0.2, black, 0.1, 0.5, 0.0, pivot, 0, Math.PI / 2); // motor on the drive housing
      box(0.08, 0.06, 0.08, dark, -0.6, 0.35, 0.14);                     // the hinge
      box(1.5, 0.03, 0.14, steelDark, 0, 0.56, 0.3);                     // coolant tray lip
      box(0.14, 0.12, 0.04, dark, -0.4, 0.62, 0.28);                     // switch box
      if (!ghost) { nameplate(T, def, g, 0.5, 0.42, 0.28, 0, 0.26); parts.lamps = lightStack(T, g, 0.65, 0.63, -0.18); parts.button = greenButton(T, g, -0.4, 0.62, 0.29); }
      break;
    }
  }
  g.userData.parts = parts;
  return g;
}

// axis-aligned half sizes for a machine at rotation rot (degrees, multiples of 90)
export function halfSizes(def, rot) { const r = ((rot % 180) + 180) % 180; return r === 0 ? { hw: def.w / 2, hd: def.d / 2 } : { hw: def.d / 2, hd: def.w / 2 }; }

// a sticky note. yellow, crooked, in marker. the shop's second whiteboard.
export function stickyNote(T, text) {
  const m = new T.Mesh(new T.PlaneGeometry(0.13, 0.13), new T.MeshBasicMaterial({ map: TX.label(T, text.split('|'), { size: 26, bg: '#f2e76b', border: '#f2e76b', fg: '#222', w: 128, h: 128 }), side: T.DoubleSide }));
  m.rotation.z = (Math.random() - 0.5) * 0.3; m.raycast = () => {};
  return m;
}
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
  setNotes(list) {
    const T = this.T; if (this.noteG) this.group.remove(this.noteG);
    this.noteG = new T.Group(); this.group.add(this.noteG); this.noteKey = list.join('~');
    const d = this.def; list.slice(0, 4).forEach((t, i) => { const n = stickyNote(T, t); n.position.set(-d.w / 2 + 0.3 + i * 0.17, Math.min(d.h - 0.3, 1.15 + (i % 2) * 0.12), d.d / 2 + 0.015); this.noteG.add(n); });
  }
  sync() { const m = this.m; this.group.position.set(m.x, 0, m.z); this.group.rotation.y = (m.rot * Math.PI) / 180; this.group.visible = !!m.placed; }
  update(dt) {
    const p = this.group.userData.parts, m = this.m;
    if ((m.notes || []).join('~') !== (this.noteKey || '')) this.setNotes(m.notes || []);
    if (m.fire) {
      if (!this.flames) {
        const T = this.T, g = new T.Group(), d = this.def; g.position.set(0, d.h * 0.55, 0); this.flames = g; this.group.add(g);
        this.flameParts = [];
        for (let i = 0; i < 7; i++) {
          const col = i % 3 === 0 ? 0xffd34a : i % 3 === 1 ? 0xff7a1a : 0xff3b0f;
          const f = new T.Mesh(new T.ConeGeometry(0.1 + Math.random() * 0.1, 0.5 + Math.random() * 0.5, 7), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false }));
          f.position.set((Math.random() - 0.5) * d.w * 0.6, Math.random() * 0.3, (Math.random() - 0.5) * d.d * 0.6); g.add(f); this.flameParts.push({ f, ph: Math.random() * 6, base: f.position.y });
        }
        const smoke = new T.Mesh(new T.SphereGeometry(0.35, 10, 8), new T.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.35, depthWrite: false })); smoke.position.y = 1.1; g.add(smoke); this.smoke = smoke;
        const light = new T.PointLight(0xff7a1a, 18, 7, 1.6); light.position.y = 0.4; g.add(light); this.fireLight = light;
        g.traverse((o) => { o.raycast = () => {}; });
      }
      this.flames.visible = true; this.ft = (this.ft || 0) + dt;
      for (const q of this.flameParts) { q.f.scale.y = 0.7 + 0.5 * Math.abs(Math.sin(this.ft * 9 + q.ph)); q.f.position.y = q.base + 0.08 * Math.sin(this.ft * 5 + q.ph); q.f.rotation.y += dt * 2; }
      this.fireLight.intensity = 14 + 8 * Math.random(); this.smoke.scale.setScalar(1 + 0.3 * Math.sin(this.ft * 2)); this.smoke.position.y = 1.1 + 0.2 * Math.sin(this.ft * 1.3);
    } else if (this.flames) this.flames.visible = false;
    if (m.running) { this.spinAngle += dt * (this.def.kind === 'press' ? 1.5 : 24); for (const s of p.spin) s.mesh.rotation[s.axis] = this.spinAngle; }
    if (p.glow) p.glow.material.emissiveIntensity = m.running ? 1.2 + 0.3 * Math.sin((this.blink || 0) * 4) : 0;
    if (p.lamps) {
      const done = Object.values(m.checklist || {}).filter(Boolean).length;
      p.lamps.green.material.emissiveIntensity = m.running ? 1.4 : 0;
      p.lamps.amber.material.emissiveIntensity = (!m.running && done > 0) || (m.oil != null && m.oil < 0.15) ? 1.0 : 0;
      this.blink = (this.blink || 0) + dt;
      p.lamps.red.material.emissiveIntensity = m.alarm ? (Math.sin(this.blink * 22) > 0 ? 2.2 : 0) : m.down ? (Math.sin(this.blink * 3) > 0 ? 1.4 : 0.2) : m.condition < 0.3 ? 1.2 : 0;
    }
  }
  collider() { const { hw, hd } = halfSizes(this.def, this.m.rot); return { x: this.m.x, z: this.m.z, hw, hd }; }
  dispose() { this.scene.remove(this.group); }
}
