// The crew on the floor: bodies, walking, and what they decide to do with their day.
// Time rules: the shop clock (minutes) decides arrivals, lunch and leaving; real seconds move the legs.
import { buildPerson, pose, holdProp, dropProp, buildBroom } from './person.js';
import { byId } from './catalog.js';
import { runnableStages, IN_HOUSE_MIN } from './jobs.js';
import { canRun, setupRoll, speedFactor, line, skillFor, practice, speech } from './people.js';
import { CLOSE_MIN, HARD_STOP_MIN } from './sim.js';

const SETUP_MIN = 6;          // shop minutes to set a machine up
const LUNCH_AT = 300, LUNCH_LEN = 30; // 12:00, half an hour
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export class Crew {
  constructor(T, scene, shop, nav, state, hooks) {
    this.T = T; this.scene = scene; this.shop = shop; this.nav = nav; this.state = state; this.hooks = hooks; // hooks: { machineViews(), runMachine(m, skipped, p), toast(msg), say(p, text) }
    this.views = new Map(); this.extras = new Map(); // extras: visitors, drivers; they get bubbles, not wages
    this.door = { x: shop.door.x, z: shop.hz - 0.6 }; this.outside = { x: shop.door.x, z: shop.hz + 2.5 };
    const br = (shop.rooms || []).find((r) => r.name === 'breakroom');
    // the break room, if there is one; otherwise the strip of wall by the office where the coffee was
    this.breakSpot = br ? { x: (br.x0 + br.x1) / 2, z: br.z1 + 0.9 } : { x: shop.office.x1 + 1.2, z: shop.office.z0 + 1.2 };
    this.t = 0;
    this.bubbles = new Map(); // person id -> { el, until }
    this.layer = document.getElementById('bubbles');
    this.gather = null; // { x, z, until } a crash to go and look at
  }

  // say it over their head, where it belongs
  say(p, text, secs = 3.2) {
    const v = this.views.get(p.id) || (this.extras && this.extras.get(p.id)); if (!v || !v.g.visible) return;
    let b = this.bubbles.get(p.id);
    if (!b) { const el = document.createElement('div'); el.className = 'bubble'; this.layer.appendChild(el); b = { el, until: 0 }; this.bubbles.set(p.id, b); }
    b.el.innerHTML = `<b>${p.name}</b>${text}`; b.until = performance.now() + secs * 1000; b.el.classList.add('show');
  }
  projectBubbles(camera, iso) {
    const now = performance.now(), T = this.T;
    for (const [id, b] of this.bubbles) {
      const v = this.views.get(id) || (this.extras && this.extras.get(id));
      if (!v || now > b.until || !v.g.visible) { b.el.classList.remove('show'); continue; }
      const p = new T.Vector3(v.pos.x, 1.95 * v.g.userData.H, v.pos.z).project(camera);
      if (p.z > 1 || (!iso && p.z < -1)) { b.el.classList.remove('show'); continue; }
      b.el.style.left = `${(p.x * 0.5 + 0.5) * innerWidth}px`; b.el.style.top = `${(-p.y * 0.5 + 0.5) * innerHeight}px`; b.el.classList.add('show');
    }
  }
  // everyone comes to look. nobody helps.
  gatherRound(x, z) { this.gather = { x, z, until: this.state.t + 12 }; for (const v of this.views.values()) if (v.g.visible && v.mode === 'idle') { this.goTo(v, { x: x + (Math.random() - 0.5) * 2.4, z: z + 1.2 + Math.random() * 1.2 }, 'toGather'); } }

  sync() {
    for (const p of this.state.people) if (!this.views.has(p.id)) {
      const g = buildPerson(this.T, p.look); g.visible = false; g.traverse((o) => { o.userData.interact = { type: 'person', id: p.id }; });
      this.scene.add(g);
      this.views.set(p.id, { p, g, mode: 'offsite', path: [], pos: { ...this.outside }, yaw: 0, walk: 0, wait: 0, machine: null, setupLeft: 0, think: Math.random() * 2, said: 0 });
    }
    for (const [id, v] of this.views) if (!this.state.people.find((p) => p.id === id)) { this.scene.remove(v.g); this.views.delete(id); }
  }

  spotFor(m) { // where you stand to run a machine: in front of it
    const d = byId(m.id), a = (m.rot * Math.PI) / 180, off = d.d / 2 + 0.55;
    return { x: m.x + Math.sin(a) * off, z: m.z + Math.cos(a) * off, face: Math.atan2(m.x - (m.x + Math.sin(a) * off), m.z - (m.z + Math.cos(a) * off)) };
  }
  homeSpot(i) { return { x: -this.shop.hx + 2.0 + (i % 4) * 1.1, z: -this.shop.hz + 5.2 + Math.floor(i / 4) * 1.0 }; }
  present(p) { const s = this.state; return p.startDay != null && p.startDay <= s.day && s.t >= (p.quirkId === 'late' ? 20 : 0) && (s.t < CLOSE_MIN || (s.crewOT && s.t < HARD_STOP_MIN)); }

  goTo(v, target, mode) {
    v.path = this.nav.path(v.pos.x, v.pos.z, target.x, target.z);
    if (!v.path.length) v.path = [target];
    v.mode = mode; v.target = target;
  }

  freeMachineFor(p) {
    const s = this.state, views = this.hooks.machineViews();
    const taken = new Set(); for (const v of this.views.values()) if (v.machine) taken.add(v.machine.uid);
    let best = null;
    for (const mv of views) {
      const m = mv.m; if (!m.placed || m.running || m.job || m.down || taken.has(m.uid)) continue;
      const d = byId(m.id); if (!canRun(p, d.kind)) continue;
      for (const o of runnableStages(s, d.kind)) {
        // a stage already loaded on another machine is spoken for
        if (views.some((q) => q.m.job && q.m.job.jobId === o.job.id && q.m.job.itemIndex === o.itemIndex)) continue;
        if (!best || o.job.dueDay < best.o.job.dueDay) best = { m, o };
      }
    }
    return best;
  }

  // machines with work this person could do, for the person panel
  workOptions(p) {
    if (!this.present(p)) return [];
    const views = this.hooks.machineViews(), out = [];
    for (const mv of views) {
      const m = mv.m; if (!m.placed || m.running || m.job) continue;
      const d = byId(m.id); if (!canRun(p, d.kind)) continue;
      const opts = runnableStages(this.state, d.kind).filter((o) => !views.some((q) => q.m.job && q.m.job.jobId === o.job.id && q.m.job.itemIndex === o.itemIndex));
      if (opts.length) out.push({ m, d, o: opts[0] });
    }
    return out;
  }
  // the owner points at a machine and says "that one"
  assign(p, m) {
    const v = this.views.get(p.id); if (!v || !this.present(p)) return false;
    const d = byId(m.id); const opts = runnableStages(this.state, d.kind).filter((o) => !this.hooks.machineViews().some((q) => q.m.job && q.m.job.jobId === o.job.id && q.m.job.itemIndex === o.itemIndex));
    if (!opts.length || m.running || m.job) return false;
    const o = opts[0];
    m.job = { jobId: o.job.id, itemIndex: o.itemIndex, item: o.item ? o.item.name : null, index: o.index, label: o.stage.label, min: o.stage.min || IN_HOUSE_MIN[o.stage.kind] || 30, kind: o.stage.kind, operator: p.id }; m.checklist = {};
    v.machine = m; this.goTo(v, this.spotFor(m), 'toMachine');
    return true;
  }
  // nothing to run: sweep. it is not billable. it is what you do when the boss is looking.
  sweepSpot() { const dirty = this.state.machines.filter((m) => m.placed && (m.chips || 0) > 0.3); if (dirty.length) { const m = dirty[Math.floor(Math.random() * dirty.length)]; const sp = this.spotFor(m); const t = { x: sp.x + (Math.random() - 0.5) * 0.6, z: sp.z + 0.5 }; if (this.nav.path(0, 0, t.x, t.z).length) return t; }
    const hx = this.shop.hx, hz = this.shop.hz; for (let i = 0; i < 8; i++) { const t = { x: -hx + 2 + Math.random() * (2 * hx - 4), z: -hz + 4 + Math.random() * (2 * hz - 7) }; if (!this.shop.forbidden(t.x, t.z, 0.4, 0.4) && this.nav.path(0, 0, t.x, t.z).length) return t; } return null; }
  setBroom(v, on) { if (on && !v.broom) { v.broom = holdProp(v.g, buildBroom(this.T), 'r'); v.broom.traverse((o) => { o.raycast = () => {}; }); } if (!on && v.broom) { dropProp(v.g, 'r'); v.broom = null; } }
  takeFive(p) { const v = this.views.get(p.id); if (!v) return; this.dropMachine(v); this.setBroom(v, false); this.goTo(v, this.breakSpot, 'toBreak'); v.wait = 15; }
  dropMachine(v) { if (v.machine && !v.machine.running) { v.machine.job = null; v.machine.checklist = {}; } v.machine = null; }

  update(dt, shopDt) {
    this.t += dt;
    const s = this.state, views = [...this.views.values()];
    views.forEach((v, i) => {
      const p = v.p, here = this.present(p);
      // ---- arriving and leaving
      if (here && (v.mode === 'leave' || v.mode === 'gone')) { v.mode = 'offsite'; v.path = []; }
      if (v.mode === 'offsite') {
        if (here) { v.pos = { ...this.outside }; v.g.visible = true; this.goTo(v, this.homeSpot(i), 'arrive'); this.hooks.say(p, pick(['Morning.', `Morning. ${p.quirkId === 'late' ? 'Bridge was up.' : 'Compressor still going, eh?'}`, 'Coffee on?'])); }
        else return;
      } else if (!here && v.mode !== 'leave' && v.mode !== 'gone') {
        this.dropMachine(v); this.goTo(v, this.outside, 'leave'); if (s.t >= CLOSE_MIN) this.hooks.say(p, pick(['That is five.', 'See you tomorrow.', 'Lock up, boss.']));
      }
      // ---- the speech. around half past nine, in the middle of the floor. then out the door.
      if (p.quitting && here && s.t >= 150 && !['toSpeech', 'speech', 'leave', 'gone', 'offsite'].includes(v.mode)) {
        this.dropMachine(v); this.setBroom(v, false); this.goTo(v, { x: 0.5, z: 1.0 }, 'toSpeech'); v.speech = speech(p); v.speechIdx = 0;
      }
      if (v.mode === 'speech') {
        if (performance.now() >= (v.nextLine || 0)) {
          if (v.speechIdx < v.speech.length) { this.hooks.say(p, v.speech[v.speechIdx++], 4.5); v.nextLine = performance.now() + 4200; if (v.speechIdx === 1) this.gatherRound(0.5, 1.0); }
          else { this.goTo(v, this.outside, 'leave'); this.hooks.quit && this.hooks.quit(p); }
        }
      }
      // ---- whistling. happy people do it. everyone else hears it.
      if (p.morale > 0.85 && here && (v.mode === 'idle' || v.mode === 'sweep' || v.walk > 0.3) && Math.random() < dt * 0.06) this.hooks.whistle && this.hooks.whistle(p, v.pos);
      // ---- lunch
      const lunch = s.t >= LUNCH_AT && s.t < LUNCH_AT + LUNCH_LEN;
      if (lunch && here && v.mode !== 'toBreak' && v.mode !== 'break' && !(v.machine && v.machine.running)) { this.dropMachine(v); this.goTo(v, this.breakSpot, 'toBreak'); v.wait = LUNCH_LEN; }

      // ---- walking along the path
      let walking = 0;
      if (v.path.length) {
        const tgt = v.path[0], dx = tgt.x - v.pos.x, dz = tgt.z - v.pos.z, dist = Math.hypot(dx, dz);
        const spd = 1.35 * speedFactor(p) * Math.min(4, Math.max(1, s.speed || 1));
        const step = Math.min(dist, spd * dt);
        if (dist > 0.001) { v.pos.x += (dx / dist) * step; v.pos.z += (dz / dist) * step; const want = Math.atan2(dx, dz); let dy = want - v.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); v.yaw += dy * Math.min(1, dt * 10); walking = 1; }
        if (dist <= step + 0.01) v.path.shift();
        if (!v.path.length) this.arrived(v);
      }
      else if (['arrive', 'leave', 'toMachine', 'toBreak', 'toSweep', 'toVend', 'toSpeech'].includes(v.mode)) this.arrived(v); // nowhere left to walk: we are there
      v.walk += ((walking ? 1 : 0) - v.walk) * Math.min(1, dt * 8);

      // ---- doing things
      if (v.mode === 'idle' && here && !lunch && !p.quitting) {
        if (Math.random() < dt * 0.012) this.hooks.say(p, line(p, {}));
        v.idleMin = (v.idleMin || 0) + shopDt;
        if (p.morale < 0.35 && v.idleMin > 8 && this.shop.vendingPos && Math.random() < dt * 0.3) { v.idleMin = 0; this.goTo(v, { x: this.shop.vendingPos.x + (Math.random() - 0.5) * 0.6, z: this.shop.vendingPos.z + Math.random() * 0.4 }, 'toVend'); this.hooks.say(p, pick(['Break. Technically.', 'B4 is stuck. I am going to look at it anyway.', 'I will be at the machine. The other machine.', 'Five minutes.']), 3); }
        else if (v.idleMin > 25 && Math.random() < dt * 0.15) { const t = this.sweepSpot(); if (t) { v.idleMin = 0; this.goTo(v, t, 'toSweep'); this.hooks.say(p, pick(['Sweeping. Billable, apparently.', 'I will sweep. Again.', 'If I sweep it, will it make chips?', 'Somebody has to.']), 3); } }
        v.think -= dt;
        if (v.think <= 0) { v.think = 1.5 + Math.random() * 2; const f = this.freeMachineFor(p); if (f) { v.idleMin = 0; f.m.job = { jobId: f.o.job.id, itemIndex: f.o.itemIndex, item: f.o.item ? f.o.item.name : null, index: f.o.index, label: f.o.stage.label, min: f.o.stage.min, operator: p.id }; f.m.checklist = {}; v.machine = f.m; this.goTo(v, this.spotFor(f.m), 'toMachine'); } }
      }
      if (v.mode === 'setup') {
        v.setupLeft -= shopDt;
        if (v.setupLeft <= 0) {
          const m = v.machine, d = byId(m.id);
          if (!m || m.running || !m.job) { v.machine = null; v.mode = 'idle'; }
          else {
            const steps = d.kind === 'bench' ? 0 : d.kind === 'drill' || d.kind === 'saw' ? 2 : 3;
            let skipped = 0; for (let k = 0; k < steps; k++) if (!setupRoll(p, d.kind)) skipped++;
            if (skipped && Math.random() < 0.5) this.hooks.say(p, pick(['Close enough.', 'It will hold.', 'Eh.', 'That is how we did it at the old place.']));
            this.hooks.runMachine(m, skipped, p); p.workedToday = true; practice(p, byId(m.id).kind);
            v.mode = m.running ? 'work' : 'idle'; if (!m.running) v.machine = null;
          }
        }
      }
      if (v.mode === 'work') { const m = v.machine; if (!m || !m.running) { v.machine = null; v.mode = 'idle'; v.think = 0.5; } }
      if (v.mode === 'break') { v.wait -= shopDt; if (v.wait <= 0 && !lunch) { v.mode = 'idle'; v.think = 0.3; } }
      if (v.mode === 'vend') { v.wait -= shopDt; if (Math.random() < dt * 0.02) this.hooks.say(p, pick(['B4.', 'Still stuck.', 'I have a lawyer. He is also stuck.', 'This is a break.']), 2.5); if (v.wait <= 0 || lunch || !here) { v.mode = 'idle'; v.think = 0.3; v.idleMin = 0; } }
      if (v.mode === 'sweep') { v.wait -= shopDt; v.yaw += dt * 0.15; for (const m of s.machines) if (m.placed && m.chips > 0 && Math.hypot(m.x - v.pos.x, m.z - v.pos.z) < 3.5) m.chips = Math.max(0, m.chips - shopDt * 0.06); if (v.wait <= 0 || lunch || !here) { this.setBroom(v, false); v.mode = 'idle'; v.think = 0.3; v.idleMin = 0; } }
      if (v.mode === 'gawk') { v.wait -= shopDt; if (v.wait <= 0) { v.mode = 'idle'; v.think = 0.5; } }

      // ---- the body
      const m = v.machine;
      const faceYaw = v.mode === 'work' || v.mode === 'setup' ? (v.target && v.target.face != null ? v.target.face : v.yaw) : v.yaw;
      v.g.position.set(v.pos.x, 0, v.pos.z); v.g.rotation.y = v.walk > 0.3 ? v.yaw : faceYaw;
      const mood = v.mode === 'work' || v.mode === 'setup' ? 'work' : v.mode === 'sweep' ? 'sweep' : v.mode === 'gawk' || v.mode === 'vend' ? 'sulk' : p.morale < 0.35 && (v.mode === 'idle' || v.mode === 'break') ? 'sulk' : 'idle';
      if (v.mode === 'gawk' && this.gather) { const want = Math.atan2(this.gather.x - v.pos.x, this.gather.z - v.pos.z); v.yaw += Math.atan2(Math.sin(want - v.yaw), Math.cos(want - v.yaw)) * Math.min(1, dt * 4); }
      pose(v.g, { mode: v.walk > 0.05 ? 'walk' : mood, t: this.t + p.id * 1.7, walk: v.walk, morale: p.morale });
      if (v.g.userData.mood !== (p.morale < 0.35 ? 'grumpy' : p.morale > 0.8 ? 'happy' : 'ok')) { v.g.userData.mood = p.morale < 0.35 ? 'grumpy' : p.morale > 0.8 ? 'happy' : 'ok'; v.g.userData.setMood(v.g.userData.mood); }
    });
  }

  arrived(v) {
    if (v.mode === 'arrive') { v.mode = 'idle'; v.think = 0.5; }
    else if (v.mode === 'leave') { v.mode = 'offsite'; v.g.visible = false; }
    else if (v.mode === 'toMachine') { if (v.machine && v.machine.job && !v.machine.running) { v.mode = 'setup'; v.setupLeft = SETUP_MIN * (1.4 - skillFor(v.p, byId(v.machine.id).kind) * 0.12); } else { v.machine = null; v.mode = 'idle'; } }
    else if (v.mode === 'toBreak') { v.mode = 'break'; }
    else if (v.mode === 'toVend') { v.mode = 'vend'; v.wait = 30 + Math.random() * 30; v.yaw = Math.atan2(this.shop.vendingPos.x - v.pos.x, (this.shop.vendingPos.z - 1.0) - v.pos.z); this.hooks.vendSulk && this.hooks.vendSulk(v.p); }
    else if (v.mode === 'toSpeech') { v.mode = 'speech'; v.nextLine = performance.now() + 500; }
    else if (v.mode === 'toSweep') { v.mode = 'sweep'; v.wait = 12 + Math.random() * 10; this.setBroom(v, true); }
    else if (v.mode === 'toGather') { v.mode = 'gawk'; v.wait = 6; this.hooks.say(v.p, pick(['Oof.', 'That is going to need a tech.', 'I heard it from the office.', 'Was that in the program?', 'Not it.', 'Did anyone photograph that? For the wall.'])); }
    else v.mode = 'idle';
  }

  status(p) {
    const v = this.views.get(p.id); if (!v) return 'not here';
    if (p.startDay > this.state.day) return `starts day ${p.startDay}`;
    if (v.mode === 'offsite' || v.mode === 'leave' || v.mode === 'gone') return 'gone home';
    if (v.mode === 'work' || v.mode === 'setup') { const d = byId(v.machine.id); return `${v.mode === 'setup' ? 'setting up' : 'running'} the ${d.name.toLowerCase()}${v.machine.job && v.machine.job.jobId ? `, job ${v.machine.job.jobId}` : ''}`; }
    if (v.mode === 'break' || v.mode === 'toBreak') return 'on a break';
    if (v.mode === 'sweep' || v.mode === 'toSweep') return 'sweeping';
    if (v.mode === 'speech' || v.mode === 'toSpeech') return 'making a speech';
    if (p.quitting) return 'quitting today';
    if (v.mode === 'vend' || v.mode === 'toVend') return 'at the vending machine. technically on break';
    if (v.mode === 'gawk' || v.mode === 'toGather') return 'having a look';
    if (v.mode === 'toMachine') return 'walking over to the ' + byId(v.machine.id).name.toLowerCase();
    return p.morale < 0.35 ? 'standing around, pointedly' : 'waiting for work';
  }
  lineFor(p) { const v = this.views.get(p.id); const ctx = v && (v.mode === 'work' || v.mode === 'setup') && v.machine && v.machine.job ? { working: true, job: v.machine.job.jobId, stage: v.machine.job.label } : {}; return line(p, ctx); }
  rebuildNav(colliders) { this.nav.rebuild(colliders); }
  // a block of steel to the shoulder
  ouch(p) { const v = this.views.get(p.id); if (!v) return; this.dropMachine(v); this.goTo(v, this.outside, 'leave'); this.hooks.say(p, pick(['OW. What is WRONG with you?', 'I am going to the clinic. And then to a lawyer.', 'You THREW that.'])); }
  // lights off: everyone is gone, whatever they were doing
  night() { for (const v of this.views.values()) { this.dropMachine(v); this.setBroom(v, false); v.mode = 'offsite'; v.path = []; v.pos = { ...this.outside }; v.g.visible = false; } }
}
