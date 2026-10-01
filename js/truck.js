// The steel truck. A cube van from the steel supplier, backed up to the door in the morning,
// and a driver inside the door with a clipboard who needs a signature. Sign and the steel is on the rack.
// Ignore him until noon and he leaves it on the pad, in the rain, with a note.
import * as TX from './textures.js';
import { buildPerson, randomLook, pose } from './person.js';

export function buildTruck(T) {
  const g = new T.Group();
  const white = new T.MeshStandardMaterial({ color: 0xe9e9e4, roughness: 0.6, metalness: 0.1 });
  const cabMat = new T.MeshStandardMaterial({ color: 0xd8d8d2, roughness: 0.5, metalness: 0.2 });
  const dark = new T.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.8 });
  const rubber = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 });
  const chrome = new T.MeshStandardMaterial({ color: 0xcfd3d6, metalness: 0.85, roughness: 0.25 });
  const glass = new T.MeshStandardMaterial({ color: 0x1a2630, roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.85 });
  const box = (w, h, d, m, x, y, z) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); g.add(o); return o; };
  const cyl = (r, h, m, x, y, z, rz = 0, rx = 0) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, 20), m); o.position.set(x, y, z); o.rotation.z = rz; o.rotation.x = rx; g.add(o); return o; };
  // the truck points +z toward its nose; the rear (box door) is at -z. it is backed up to the shop door.
  box(2.3, 0.3, 6.2, dark, 0, 0.55, 0.2);                       // chassis
  box(2.4, 2.3, 4.2, white, 0, 1.95, -0.9);                     // the box
  box(2.45, 0.08, 4.25, dark, 0, 0.82, -0.9);                   // box floor rail
  box(2.45, 0.08, 4.25, dark, 0, 3.08, -0.9);                   // roof rail
  // the roll-up door at the back, slats
  for (let i = 0; i < 5; i++) box(2.1, 0.38, 0.05, cabMat, 0, 1.05 + i * 0.42, -3.03);
  box(2.2, 0.1, 0.12, dark, 0, 0.86, -3.0);                      // sill, with the step
  box(0.6, 0.06, 0.4, dark, 0.6, 0.6, -3.2);                     // step
  // cab
  box(2.3, 1.2, 1.9, cabMat, 0, 1.55, 2.3);                      // cab lower
  box(2.2, 0.9, 1.5, cabMat, 0, 2.55, 2.1);                      // cab upper
  box(2.0, 0.7, 0.06, glass, 0, 2.55, 2.88);                     // windshield
  for (const s of [-1, 1]) { box(0.06, 0.6, 0.9, glass, s * 1.11, 2.5, 2.1); box(0.06, 0.4, 0.3, chrome, s * 1.25, 2.3, 2.6); } // side glass, mirrors
  box(2.4, 0.3, 0.3, chrome, 0, 0.95, 3.3);                      // bumper
  box(2.3, 0.5, 0.4, dark, 0, 1.3, 3.15);                        // grille
  for (const s of [-1, 1]) cyl(0.14, 0.05, new T.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff0c0, emissiveIntensity: 0.8 }), s * 0.85, 1.35, 3.36, 0, Math.PI / 2);
  for (const s of [-1, 1]) cyl(0.08, 0.04, new T.MeshStandardMaterial({ color: 0xff3020, emissive: 0xff2010, emissiveIntensity: 0.6 }), s * 1.0, 1.2, -3.1, 0, Math.PI / 2);
  cyl(0.06, 1.6, chrome, -1.05, 2.3, 1.2);                       // exhaust stack
  // wheels: two front, four rear (duals)
  for (const [x, z] of [[-1.15, 2.2], [1.15, 2.2], [-1.2, -1.6], [-0.9, -1.6], [1.2, -1.6], [0.9, -1.6]]) { cyl(0.42, 0.3, rubber, x, 0.42, z, Math.PI / 2); cyl(0.2, 0.32, chrome, x, 0.42, z, Math.PI / 2); }
  // the sign on the side and the back
  const sign = TX.label(T, ['BRAMALEA', 'STEEL SUPPLY', '905-555-0188'], { size: 26, bg: '#e9e9e4', border: '#1b3c7a', fg: '#1b3c7a' });
  for (const s of [-1, 1]) { const p = new T.Mesh(new T.PlaneGeometry(2.6, 1.3), new T.MeshBasicMaterial({ map: sign })); p.position.set(s * 1.205, 2.0, -0.9); p.rotation.y = s * Math.PI / 2; g.add(p); }
  const back = new T.Mesh(new T.PlaneGeometry(1.0, 0.5), new T.MeshBasicMaterial({ map: TX.label(T, ['HOW\'S MY', 'DRIVING?'], { size: 30 }) })); back.position.set(0.4, 2.7, -3.06); back.rotation.y = Math.PI; g.add(back);
  g.traverse((o) => { o.userData.interact = { type: 'truck', text: 'the steel truck. backed in. the driver is inside with the clipboard.' }; });
  return g;
}

const DRIVER_LINES = ['Sign here. And here. Initial there.', 'You got a forklift? No? Okay.', 'Three skids. Says two on the sheet. Take three.', 'The other guy signs faster.', 'Rain tomorrow. Just saying.', 'I got nine more stops. Sign.'];
const LEFT_LINES = ['Left it on the pad. He waited twenty minutes, which he mentioned on the note.', 'Steel on the pad, in the rain, with a note that says "NOBODY HOME?" in capitals.', 'The driver left. The skid is at the door. The note has a drawing on it.'];

export class Delivery {
  constructor(T, scene, shop, state) {
    this.T = T; this.scene = scene; this.shop = shop; this.state = state;
    this.truck = buildTruck(T); this.truck.visible = false; scene.add(this.truck);
    const look = randomLook(); look.vest = true; look.hat = 'cap'; look.coveralls = false;
    this.driver = buildPerson(T, look); this.driver.visible = false; scene.add(this.driver);
    this.driver.traverse((o) => { o.userData.interact = { type: 'driver', text: 'the driver. clipboard. nine more stops.' }; });
    this.here = false; this.leaving = 0; this.t = 0;
  }
  // which jobs have steel on the truck right now
  waiting() { return this.state.jobs.filter((j) => j.status === 'material' && j.truck); }
  update(dt, onLeft) {
    const s = this.state, d = this.shop.door, hz = this.shop.hz;
    const want = this.waiting().length > 0 && s.t < 300 && s.t >= 0;
    this.t += dt;
    if (want && !this.here && !this.leaving) {
      this.here = true; this.truck.visible = true; this.driver.visible = true;
      this.truck.position.set(d.x, 0, hz + 3.6); this.truck.rotation.y = 0;
      this.driver.position.set(d.x + 0.9, 0, hz - 1.3); this.driver.rotation.y = Math.PI * 0.85;
    }
    if (this.here) pose(this.driver, { mode: 'idle', t: this.t, walk: 0, morale: 0.6 });
    // noon: he leaves it on the pad
    // noon: he leaves it on the pad. if the truck never got here (it was leaving, or you loaded the game at two), it is on the pad anyway.
    if (s.t >= 300 && this.waiting().length) { for (const j of this.waiting()) { j.truck = false; j.status = 'work'; } if (onLeft) onLeft(LEFT_LINES[Math.floor(Math.random() * LEFT_LINES.length)]); if (this.here) this.leave(); }
    if (this.leaving) { this.leaving -= dt; this.truck.position.z += dt * 2.2; this.truck.position.x += dt * 0.3; if (this.leaving <= 0) { this.leaving = 0; this.truck.visible = false; } }
  }
  leave() { this.here = false; this.driver.visible = false; this.leaving = 5; }
  // the signature. returns a line from the driver.
  sign() {
    const jobs = this.waiting(); if (!jobs.length) return null;
    for (const j of jobs) { j.truck = false; j.status = 'work'; }
    this.leave();
    return { jobs, line: DRIVER_LINES[Math.floor(Math.random() * DRIVER_LINES.length)] };
  }
  night() { this.here = false; this.leaving = 0; this.truck.visible = false; this.driver.visible = false; }
}
