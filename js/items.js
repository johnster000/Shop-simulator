// Things you can pick up and throw. Scrap blocks, a steel block, a coffee, the dead-blow hammer.
// Buy Stove's throw physics, with a mold shop's consequences.
import * as TX from './textures.js';
import { buildBroom } from './person.js';

const KINDS = {
  scrap: { label: 'scrap block', mass: 6, hint: 'scrap. heavy. throwable.' },
  steel: { label: 'block of P20', mass: 12, hint: 'a block of steel. somebody paid for that.' },
  coffee: { label: 'coffee', mass: 0.4, hint: 'coffee. not yours.' },
  hammer: { label: 'dead-blow hammer', mass: 1.5, hint: 'dead-blow hammer. percussive maintenance.' },
  key: { label: 'chuck key', mass: 0.3, hint: 'the chuck key. somebody left it in.' },
  extinguisher: { label: 'fire extinguisher', mass: 5, hint: 'fire extinguisher. pull, aim, squeeze. the tag is from 2009.' },
  airhose: { label: 'air hose', mass: 1, hint: 'the air hose. for chips. only for chips.' },
  wetsign: { label: 'wet floor sign', mass: 0.8, hint: 'the wet floor sign. CAUTION, in two languages and a drawing.' },
  broom: { label: 'broom', mass: 1.2, hint: 'the broom. the apprentice\'s. you can use it.' },
  traveller: { label: 'job traveller', mass: 0.3, hint: 'a traveller. where the job is, in pen, with a coffee ring.' },
  jar: { label: 'coffee fund jar', mass: 1.0, hint: 'the coffee fund. a pickle jar. $2 a cup. that means YOU, Rick.' },
  cake: { label: 'the cake', mass: 0.9, hint: 'cake. ship day. the grocery store had one left.' },
  phone: { label: 'apprentice\'s phone', mass: 0.3, hint: 'the apprentice\'s phone. charging on top of the crib. it is buzzing.' },
  pins: { label: 'box of ejector pins', mass: 1.2, hint: 'a box of ejector pins. two hundred. do not drop it.' },
  electrode: { label: 'graphite electrode', mass: 0.6, hint: 'a graphite electrode. a day on the mill. it breaks if you look at it.' },
};

export class Items {
  constructor(T, scene, camera, audio, shop) {
    this.T = T; this.scene = scene; this.camera = camera; this.audio = audio; this.shop = shop;
    this.items = []; this.held = null;
    this.onHit = null; // (item, what) => void   what: { type: 'machine'|'person'|'wall'|'tarp'|'bin'|'floor'|'pc', ... }
    this.tmp = new T.Vector3();
  }

  make(kind, x, z, opts = {}) {
    const T = this.T; let mesh;
    if (kind === 'scrap') { mesh = new T.Mesh(new T.BoxGeometry(0.16, 0.1, 0.14), new T.MeshStandardMaterial({ color: 0x6a7076, metalness: 0.5, roughness: 0.5 })); mesh.rotation.y = Math.random() * 3; }
    else if (kind === 'steel') { mesh = new T.Mesh(new T.BoxGeometry(0.3, 0.14, 0.2), new T.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.6, roughness: 0.35 })); const lbl = new T.Mesh(new T.PlaneGeometry(0.14, 0.06), new T.MeshBasicMaterial({ map: TX.label(T, ['P20'], { size: 48 }) })); lbl.position.set(0, 0.071, 0); lbl.rotation.x = -Math.PI / 2; mesh.add(lbl); }
    else if (kind === 'coffee') { mesh = new T.Group(); const cup = new T.Mesh(new T.CylinderGeometry(0.04, 0.035, 0.1, 14), new T.MeshStandardMaterial({ color: 0xf1eee5, roughness: 0.6 })); cup.position.y = 0.05; mesh.add(cup); const top = new T.Mesh(new T.CylinderGeometry(0.036, 0.036, 0.006, 14), new T.MeshStandardMaterial({ color: 0x3a2412 })); top.position.y = 0.098; mesh.add(top); const handle = new T.Mesh(new T.TorusGeometry(0.022, 0.006, 6, 12), cup.material); handle.position.set(0.045, 0.05, 0); mesh.add(handle); }
    else if (kind === 'hammer') { mesh = new T.Group(); const head = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.12, 12), new T.MeshStandardMaterial({ color: 0xc8541e, roughness: 0.7 })); head.rotation.z = Math.PI / 2; head.position.y = 0.03; mesh.add(head); const handle = new T.Mesh(new T.CylinderGeometry(0.012, 0.014, 0.3, 8), new T.MeshStandardMaterial({ color: 0x222 })); handle.position.set(0, 0.03, 0.17); handle.rotation.x = Math.PI / 2; mesh.add(handle); }
    else if (kind === 'extinguisher') {
      mesh = new T.Group();
      const red = new T.MeshStandardMaterial({ color: 0xb8231f, roughness: 0.45, metalness: 0.3 }), blk = new T.MeshStandardMaterial({ color: 0x151515, roughness: 0.7 }), chrome = new T.MeshStandardMaterial({ color: 0xd0d4d8, metalness: 0.8, roughness: 0.25 });
      const body = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.42, 18), red); body.position.y = 0.21; mesh.add(body);
      const dome = new T.Mesh(new T.SphereGeometry(0.075, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), red); dome.position.y = 0.42; mesh.add(dome);
      const foot = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 0.02, 18), blk); foot.position.y = 0.01; mesh.add(foot);
      const neck = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, 0.06, 10), chrome); neck.position.y = 0.52; mesh.add(neck);
      const valve = new T.Mesh(new T.BoxGeometry(0.06, 0.04, 0.05), chrome); valve.position.y = 0.57; mesh.add(valve);
      const lever = new T.Mesh(new T.BoxGeometry(0.1, 0.012, 0.03), chrome); lever.position.set(-0.03, 0.6, 0); lever.rotation.z = 0.25; mesh.add(lever);
      const handle = new T.Mesh(new T.BoxGeometry(0.1, 0.012, 0.03), chrome); handle.position.set(-0.03, 0.57, 0); mesh.add(handle);
      const pin = new T.Mesh(new T.TorusGeometry(0.02, 0.004, 6, 12), chrome); pin.position.set(0.04, 0.585, 0); mesh.add(pin);
      const hose = new T.Mesh(new T.TorusGeometry(0.11, 0.012, 8, 20, Math.PI * 0.9), blk); hose.position.set(0.0, 0.42, 0.0); hose.rotation.y = Math.PI / 2; hose.rotation.z = -0.3; mesh.add(hose);
      const horn = new T.Mesh(new T.CylinderGeometry(0.03, 0.012, 0.08, 12), blk); horn.position.set(0.0, 0.3, 0.1); horn.rotation.x = 0.4; mesh.add(horn);
      const lbl = new T.Mesh(new T.PlaneGeometry(0.1, 0.16), new T.MeshBasicMaterial({ map: TX.label(T, ['FIRE', 'ABC', '2009'], { size: 26 }) })); lbl.position.set(0, 0.24, 0.076); mesh.add(lbl);
      const tag = new T.Mesh(new T.PlaneGeometry(0.04, 0.06), new T.MeshBasicMaterial({ color: 0xe8d44a, side: T.DoubleSide })); tag.position.set(0.09, 0.5, 0); tag.rotation.y = Math.PI / 2; mesh.add(tag);
    }
    else if (kind === 'wetsign') {
      mesh = new T.Group(); const yel = new T.MeshStandardMaterial({ color: 0xf2d31b, roughness: 0.6 });
      for (const sgn of [-1, 1]) { const leaf = new T.Mesh(new T.BoxGeometry(0.3, 0.6, 0.01), yel); leaf.position.set(0, 0.3, sgn * 0.11); leaf.rotation.x = sgn * 0.35; mesh.add(leaf); const lbl = new T.Mesh(new T.PlaneGeometry(0.24, 0.3), new T.MeshBasicMaterial({ map: TX.label(T, ['CAUTION', 'WET', 'FLOOR'], { size: 26, bg: '#f2d31b', border: '#f2d31b', fg: '#111' }) })); lbl.position.set(0, 0.33, sgn * (0.11 + 0.006)); lbl.rotation.x = sgn * 0.35; if (sgn < 0) lbl.rotation.y = Math.PI; mesh.add(lbl); }
      const hinge = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.3, 8), new T.MeshStandardMaterial({ color: 0x333 })); hinge.rotation.z = Math.PI / 2; hinge.position.y = 0.58; mesh.add(hinge);
    }
    else if (kind === 'broom') { mesh = buildBroom(T); mesh.traverse((o) => { delete o.raycast; }); mesh.rotation.set(-0.55, 0, 0); }
    else if (kind === 'traveller') {
      mesh = new T.Group();
      const board = new T.Mesh(new T.BoxGeometry(0.24, 0.012, 0.32), new T.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8 })); mesh.add(board);
      const paper = new T.Mesh(new T.PlaneGeometry(0.2, 0.27), new T.MeshBasicMaterial({ map: TX.label(T, opts.lines || ['JOB', '', ''], { size: 24, bg: '#f4f1e6', border: '#f4f1e6', fg: '#222' }) })); paper.rotation.x = -Math.PI / 2; paper.position.y = 0.008; mesh.add(paper); mesh.userData.paper = paper;
      const clip = new T.Mesh(new T.BoxGeometry(0.1, 0.02, 0.03), new T.MeshStandardMaterial({ color: 0xb8bcc0, metalness: 0.8, roughness: 0.3 })); clip.position.set(0, 0.014, -0.14); mesh.add(clip);
      const ring = new T.Mesh(new T.RingGeometry(0.03, 0.038, 20), new T.MeshBasicMaterial({ color: 0x8a5a2a, transparent: true, opacity: 0.6, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(0.05 - Math.random() * 0.1, 0.009, 0.06 + Math.random() * 0.05); mesh.add(ring);
    }
    else if (kind === 'jar') {
      // a pickle jar with the label soaked off and a new one taped on. change in the bottom. a button.
      mesh = new T.Group();
      const glass = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.17, 18, 1, true), new T.MeshPhysicalMaterial({ color: 0xdfe8e0, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.0, side: T.DoubleSide })); glass.position.y = 0.085; mesh.add(glass);
      const bottom = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.008, 18), new T.MeshStandardMaterial({ color: 0xcfd8d0, transparent: true, opacity: 0.5 })); bottom.position.y = 0.004; mesh.add(bottom);
      const lid = new T.Mesh(new T.CylinderGeometry(0.063, 0.063, 0.02, 18), new T.MeshStandardMaterial({ color: 0xc8a020, metalness: 0.6, roughness: 0.4 })); lid.position.y = 0.18; mesh.add(lid);
      const slot = new T.Mesh(new T.BoxGeometry(0.05, 0.004, 0.008), new T.MeshStandardMaterial({ color: 0x111 })); slot.position.y = 0.191; mesh.add(slot);
      const change = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.03, 18), new T.MeshStandardMaterial({ color: 0xb8a878, metalness: 0.7, roughness: 0.5 })); change.position.y = 0.023; mesh.add(change); mesh.userData.change = change;
      const lbl = new T.Mesh(new T.PlaneGeometry(0.1, 0.07), new T.MeshBasicMaterial({ map: TX.label(T, ['COFFEE', 'FUND', '$2/cup'], { size: 22, bg: '#f4f1e6', fg: '#222', border: '#999' }) })); lbl.position.set(0, 0.1, 0.061); mesh.add(lbl);
      const tape = new T.Mesh(new T.PlaneGeometry(0.11, 0.012), new T.MeshBasicMaterial({ color: 0xd8d2b0, transparent: true, opacity: 0.8 })); tape.position.set(0, 0.138, 0.0615); mesh.add(tape);
    }
    else if (kind === 'cake') {
      // a round white cake on a cardboard circle. sprinkles. one slice already gone. somebody's name on it, not yours.
      mesh = new T.Group();
      const board = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.006, 24), new T.MeshStandardMaterial({ color: 0xc9b58a, roughness: 0.9 })); board.position.y = 0.003; mesh.add(board);
      const icing = new T.MeshStandardMaterial({ color: 0xf6f1ea, roughness: 0.7 });
      const body = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.09, 24, 1, false, 0.5, Math.PI * 2 - 0.5), icing); body.position.y = 0.051; mesh.add(body);
      const cut1 = new T.Mesh(new T.PlaneGeometry(0.15, 0.09), new T.MeshStandardMaterial({ color: 0xe8c48a, roughness: 0.9, side: T.DoubleSide })); cut1.position.set(Math.sin(0.5) * 0.075, 0.051, Math.cos(0.5) * 0.075); cut1.rotation.y = 0.5 + Math.PI / 2; mesh.add(cut1);
      const cut2 = cut1.clone(); cut2.position.set(0, 0.051, 0.075); cut2.rotation.y = Math.PI / 2; mesh.add(cut2);
      for (let i = 0; i < 26; i++) { const a = 0.7 + Math.random() * (Math.PI * 2 - 0.9), r = 0.03 + Math.random() * 0.11; const sp = new T.Mesh(new T.BoxGeometry(0.012, 0.004, 0.004), new T.MeshStandardMaterial({ color: [0xe04040, 0x3a8ae0, 0xf0c020, 0x40b060][i % 4] })); sp.position.set(Math.sin(a) * r, 0.098, Math.cos(a) * r); sp.rotation.y = Math.random() * 3; mesh.add(sp); }
      const text = new T.Mesh(new T.PlaneGeometry(0.2, 0.075), new T.MeshBasicMaterial({ map: TX.label(T, [opts.text || 'HAPPY RETIREMENT', opts.text2 || 'BARB'], { size: 26, bg: '#f6f1ea', fg: '#2a62c8', border: '#f6f1ea' }), transparent: true })); text.rotation.x = -Math.PI / 2; text.position.set(-0.03, 0.097, -0.02); mesh.add(text);
      const knife = new T.Mesh(new T.BoxGeometry(0.02, 0.004, 0.16), new T.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3 })); knife.position.set(0.18, 0.01, 0.06); knife.rotation.y = 0.4; mesh.add(knife);
    }
    else if (kind === 'phone') {
      // a phone. black case, a screen that is always on, a crack already, a charging cable that goes nowhere.
      mesh = new T.Group();
      const body = new T.Mesh(new T.BoxGeometry(0.075, 0.009, 0.15), new T.MeshStandardMaterial({ color: 0x111114, roughness: 0.4 })); body.position.y = 0.0045; mesh.add(body);
      const screen = new T.Mesh(new T.PlaneGeometry(0.066, 0.138), new T.MeshStandardMaterial({ color: 0x9ec8ff, emissive: 0x5a8fe0, emissiveIntensity: 0.9 })); screen.rotation.x = -Math.PI / 2; screen.position.y = 0.0095; mesh.add(screen);
      const crack = new T.Mesh(new T.PlaneGeometry(0.004, 0.09), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); crack.rotation.x = -Math.PI / 2; crack.rotation.z = 0.5; crack.position.set(0.015, 0.0097, 0.02); mesh.add(crack);
      const cable = new T.Mesh(new T.TorusGeometry(0.06, 0.003, 6, 16, Math.PI * 0.8), new T.MeshStandardMaterial({ color: 0xeeeeee })); cable.rotation.x = Math.PI / 2; cable.position.set(0.04, 0.003, 0.1); mesh.add(cable);
    }
    else if (kind === 'pins') {
      // a cardboard box, open, and a hundred and ninety-seven ejector pins standing up in foam. three are on the floor already.
      mesh = new T.Group(); const card = new T.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.95 });
      const box = new T.Mesh(new T.BoxGeometry(0.22, 0.08, 0.16), card); box.position.y = 0.04; mesh.add(box);
      const foam = new T.Mesh(new T.BoxGeometry(0.2, 0.02, 0.14), new T.MeshStandardMaterial({ color: 0x5a5a60, roughness: 1 })); foam.position.y = 0.09; mesh.add(foam);
      const pinMat = new T.MeshStandardMaterial({ color: 0xd8dce0, metalness: 0.85, roughness: 0.25 });
      for (let i = 0; i < 5; i++) for (let k = 0; k < 3; k++) { const pin = new T.Mesh(new T.CylinderGeometry(0.007, 0.004, 0.14, 5), pinMat); pin.position.set(-0.07 + i * 0.035, 0.16, -0.04 + k * 0.04); pin.rotation.x = (Math.random() - 0.5) * 0.1; mesh.add(pin); } // fifteen on show; the other hundred and eighty-five are under the foam
      const lbl = new T.Mesh(new T.PlaneGeometry(0.14, 0.05), new T.MeshBasicMaterial({ map: TX.label(T, ['EJECTOR PINS', 'H13 · 200 pc'], { size: 20, bg: '#f4f1e6', fg: '#222', border: '#999' }) })); lbl.position.set(0, 0.04, 0.081); mesh.add(lbl);
    }
    else if (kind === 'electrode') {
      // a graphite electrode: a block with a rib pattern on top, matte black, on an aluminium holder with a shank.
      mesh = new T.Group(); const gr = new T.MeshStandardMaterial({ color: 0x1e1e20, roughness: 0.95, metalness: 0.05 });
      const holder = new T.Mesh(new T.BoxGeometry(0.1, 0.02, 0.1), new T.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.7, roughness: 0.3 })); holder.position.y = 0.01; mesh.add(holder);
      const shank = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.05, 10), holder.material); shank.position.y = -0.02; mesh.add(shank);
      const body = new T.Mesh(new T.BoxGeometry(0.09, 0.08, 0.09), gr); body.position.y = 0.06; mesh.add(body);
      for (let i = 0; i < 4; i++) { const rib = new T.Mesh(new T.BoxGeometry(0.07, 0.025, 0.01), gr); rib.position.set(0, 0.112, -0.03 + i * 0.02); mesh.add(rib); }
    }
    else if (kind === 'airhose') {
      mesh = new T.Group();
      const yel = new T.MeshStandardMaterial({ color: 0xd9b530, roughness: 0.6 }), chrome = new T.MeshStandardMaterial({ color: 0xc8ccd0, metalness: 0.8, roughness: 0.25 }), blk = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
      for (let i = 0; i < 5; i++) { const coil = new T.Mesh(new T.TorusGeometry(0.11, 0.012, 8, 24), yel); coil.position.y = 0.02 + i * 0.026; coil.rotation.x = Math.PI / 2 + 0.15; coil.rotation.z = i * 0.4; mesh.add(coil); }
      const lead = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.26, 8), yel); lead.position.set(0.14, 0.1, 0.1); lead.rotation.z = 1.1; lead.rotation.x = 0.5; mesh.add(lead);
      const gun = new T.Mesh(new T.BoxGeometry(0.03, 0.08, 0.03), blk); gun.position.set(0.24, 0.15, 0.17); mesh.add(gun);
      const barrel = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.12, 8), chrome); barrel.position.set(0.24, 0.2, 0.24); barrel.rotation.x = Math.PI / 2; mesh.add(barrel);
      const trig = new T.Mesh(new T.BoxGeometry(0.03, 0.012, 0.04), chrome); trig.position.set(0.24, 0.2, 0.15); mesh.add(trig);
    }
    else { mesh = new T.Group(); const t = new T.Mesh(new T.BoxGeometry(0.08, 0.012, 0.012), new T.MeshStandardMaterial({ color: 0xcfd4d8, metalness: 0.8, roughness: 0.3 })); mesh.add(t); const sq = new T.Mesh(new T.BoxGeometry(0.014, 0.05, 0.014), t.material); sq.position.y = -0.025; mesh.add(sq); }
    mesh.position.set(x, opts.y || 0, z);
    const item = { kind, mesh, v: new this.T.Vector3(), w: new this.T.Vector3(), flying: false, rest: opts.y || 0, home: { x, z, y: opts.y || 0 }, thrownBy: null };
    mesh.traverse((o) => { o.userData.interact = { type: 'item', kind, text: KINDS[kind].hint, ref: item }; });
    this.scene.add(mesh); this.items.push(item);
    return item;
  }

  pickUp(item) {
    if (this.held) return false;
    this.held = item; item.flying = false; item.v.set(0, 0, 0);
    this.scene.remove(item.mesh); this.camera.add(item.mesh);
    item.mesh.position.set(0.36, -0.3, -0.8); item.mesh.rotation.set(0.2, -0.4, 0.1); item.mesh.scale.setScalar(item.kind === 'steel' || item.kind === 'scrap' ? 0.8 : 1);
    if (item.kind === 'extinguisher') { item.mesh.position.set(0.34, -0.62, -0.7); item.mesh.rotation.set(-0.15, -0.9, 0.1); }
    if (item.kind === 'airhose') { item.mesh.position.set(0.3, -0.45, -0.6); item.mesh.rotation.set(0.3, -1.4, 0); }
    if (item.kind === 'traveller') { item.mesh.position.set(0.3, -0.28, -0.55); item.mesh.rotation.set(-0.9, -0.3, 0.1); }
    if (item.kind === 'broom') { item.mesh.position.set(0.35, 0.1, -0.5); item.mesh.rotation.set(0.1, -0.5, 0.2); }
    if (item.kind === 'wetsign') { item.mesh.position.set(0.4, -0.55, -0.7); item.mesh.rotation.set(0, -0.6, 0); }
    if (item.kind === 'jar') { item.mesh.position.set(0.32, -0.36, -0.7); item.mesh.rotation.set(0.1, -0.3, 0); }
    if (item.kind === 'cake') { item.mesh.position.set(0.1, -0.42, -0.75); item.mesh.rotation.set(0.1, 0, 0); }
    if (item.kind === 'phone') { item.mesh.position.set(0.3, -0.24, -0.55); item.mesh.rotation.set(1.35, -0.15, -0.05); }
    this.audio.tick(0.08, 600);
    return true;
  }
  drop() {
    const it = this.held; if (!it) return;
    this.held = null; this.camera.remove(it.mesh); this.scene.add(it.mesh); it.mesh.scale.setScalar(1);
    const p = this.camera.getWorldPosition(this.tmp.clone());
    it.mesh.position.set(p.x, 0.02 + (it.kind === 'coffee' ? 0 : 0), p.z); it.mesh.rotation.set(0, Math.random() * 3, 0); it.flying = false;
  }
  throw(power = 1) {
    const it = this.held; if (!it) return null;
    this.held = null; this.camera.remove(it.mesh); this.scene.add(it.mesh); it.mesh.scale.setScalar(1);
    const dir = this.camera.getWorldDirection(this.tmp.clone());
    const p = this.camera.getWorldPosition(new this.T.Vector3());
    it.mesh.position.copy(p).add(dir.clone().multiplyScalar(0.5)); it.mesh.position.y -= 0.1;
    const spd = (7 + 4 * power) / Math.sqrt(KINDS[it.kind].mass / 2);
    it.v.copy(dir).multiplyScalar(spd); it.v.y += 1.2;
    it.w.set(Math.random() * 6 - 3, Math.random() * 6 - 3, Math.random() * 6 - 3);
    it.flying = true; it.hit = false; it.thrownBy = 'owner';
    this.audio.noise(0.15, 500, 0.08, 'bandpass');
    return it;
  }

  // colliders: machine boxes {x,z,hw,hd,uid,top}; people: [{x,z,id}]
  update(dt, machines, people) {
    const T = this.T, hz = this.shop.hz, hx = this.shop.hx;
    for (const it of this.items) {
      if (!it.flying) continue;
      const m = it.mesh;
      it.v.y -= 9.8 * dt;
      m.position.addScaledVector(it.v, dt);
      m.rotation.x += it.w.x * dt; m.rotation.y += it.w.y * dt; m.rotation.z += it.w.z * dt;
      // the tarp: through it and into the parking lot
      if (m.position.z > hz - 0.3 && Math.abs(m.position.x - this.shop.door.x) < this.shop.door.w / 2 && m.position.y < this.shop.door.h && !this.shop.realDoor) {
        if (m.position.z > hz + 2.5) { it.flying = false; it.v.set(0, 0, 0); if (this.onHit) this.onHit(it, { type: 'lot' }); continue; }
        if (!it.hit) { it.hit = true; this.audio.tarp(); if (this.onHit) this.onHit(it, { type: 'tarp' }); }
      } else {
        // walls
        if (it.kind === 'electrode' && (m.position.x < -hx + 0.1 || m.position.x > hx - 0.1 || m.position.z < -hz + 0.1 || m.position.z > hz - 0.1) && this.onHit) { it.v.set(0, 0, 0); it.flying = false; m.position.y = it.rest; this.onHit(it, { type: 'smash' }); continue; }
        if (m.position.x < -hx + 0.1 || m.position.x > hx - 0.1) { it.v.x *= -0.4; m.position.x = Math.max(-hx + 0.1, Math.min(hx - 0.1, m.position.x)); this.clang(it); if (!it.hit && this.onHit) { it.hit = true; this.onHit(it, { type: 'wall' }); } }
        if (m.position.z < -hz + 0.1 || m.position.z > hz - 0.1) { it.v.z *= -0.4; m.position.z = Math.max(-hz + 0.1, Math.min(hz - 0.1, m.position.z)); this.clang(it); if (!it.hit && this.onHit) { it.hit = true; this.onHit(it, { type: 'wall' }); } }
      }
      // people: a body is a cylinder
      for (const p of people) {
        const dx = m.position.x - p.x, dz = m.position.z - p.z;
        if (Math.hypot(dx, dz) < 0.38 && m.position.y > 0.1 && m.position.y < 1.9 && it.v.length() > 2) {
          it.v.multiplyScalar(-0.2); it.v.y = 1; it.hit = true;
          if (this.onHit) this.onHit(it, { type: 'person', id: p.id, speed: it.v.length() });
          break;
        }
      }
      // machines: boxes
      for (const b of machines) {
        const ox = m.position.x - b.x, oz = m.position.z - b.z;
        if (Math.abs(ox) < b.hw && Math.abs(oz) < b.hd && m.position.y < (b.top || 2.0)) {
          const px = b.hw - Math.abs(ox), pz = b.hd - Math.abs(oz);
          if (m.position.y > (b.top || 2.0) - 0.15) { m.position.y = b.top || 2.0; it.v.y = Math.abs(it.v.y) * 0.3; }
          else if (px < pz) { m.position.x = b.x + Math.sign(ox || 1) * b.hw; it.v.x *= -0.35; } else { m.position.z = b.z + Math.sign(oz || 1) * b.hd; it.v.z *= -0.35; }
          this.clang(it);
          if (!it.hit && this.onHit) { it.hit = true; this.onHit(it, { type: 'machine', uid: b.uid, speed: it.v.length() + 3 }); }
          break;
        }
      }
      // the floor
      if (m.position.y <= it.rest) {
        m.position.y = it.rest;
        if (Math.abs(it.v.y) > 1.2) { it.v.y = -it.v.y * 0.35; it.v.x *= 0.7; it.v.z *= 0.7; this.clang(it, 0.6); if (!it.hit && this.onHit) { it.hit = true; this.onHit(it, { type: 'floor' }); } if ((it.kind === 'jar' || it.kind === 'cake' || it.kind === 'pins' || it.kind === 'electrode' || it.kind === 'phone') && this.onHit) { it.v.set(0, 0, 0); it.flying = false; this.onHit(it, { type: 'smash' }); return; } }
        else { it.v.set(0, 0, 0); it.w.set(0, 0, 0); it.flying = false; m.rotation.set(0, m.rotation.y, 0); if (it.kind === 'coffee') { if (this.onHit) this.onHit(it, { type: 'spill' }); } }
      }
    }
  }
  clang(it, k = 1) {
    if (it.kind === 'coffee') { this.audio.noise(0.12, 2500, 0.05 * k, 'highpass'); return; }
    if (it.kind === 'traveller') { this.audio.noise(0.1, 3000, 0.04 * k, 'highpass'); return; }
    if (it.kind === 'jar') { this.audio.noise(0.25, 3200, 0.2 * k, 'highpass'); this.audio.noise(0.15, 1400, 0.1 * k, 'bandpass', 4); return; }
    if (it.kind === 'cake') { this.audio.noise(0.08, 400, 0.05 * k, 'lowpass'); return; }
    if (it.kind === 'pins') { for (let i = 0; i < 5; i++) setTimeout(() => this.audio.noise(0.05, 4000 + Math.random() * 2000, 0.06 * k, 'bandpass', 6), i * 60); return; }
    if (it.kind === 'electrode') { this.audio.noise(0.1, 500, 0.08 * k, 'lowpass'); return; }
    if (it.kind === 'phone') { this.audio.noise(0.08, 2600, 0.1 * k, 'highpass'); return; }
    if (it.kind === 'hammer' || it.kind === 'key') { this.audio.noise(0.08, 1800, 0.08 * k, 'bandpass', 2); return; }
    this.audio.noise(0.25, 900 + Math.random() * 600, 0.2 * k, 'bandpass', 3); this.audio.noise(0.3, 160, 0.15 * k, 'lowpass');
  }
  remove(it) { this.scene.remove(it.mesh); this.items.splice(this.items.indexOf(it), 1); if (this.held === it) this.held = null; }
  heldKind() { return this.held ? this.held.kind : null; }
}
export const ITEM_KINDS = KINDS;
