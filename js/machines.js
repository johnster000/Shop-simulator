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

  switch (def.kind) {
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
