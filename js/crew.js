// The crew on the floor: bodies, walking, and what they decide to do with their day.
// Time rules: the shop clock (minutes) decides arrivals, lunch and leaving; real seconds move the legs.
import { buildPerson, pose } from './person.js';
import { byId } from './catalog.js';
import { runnableStages } from './jobs.js';
import { canRun, setupRoll, speedFactor, line, skillFor } from './people.js';
import { CLOSE_MIN } from './sim.js';

const SETUP_MIN = 6;          // shop minutes to set a machine up
const LUNCH_AT = 300, LUNCH_LEN = 30; // 12:00, half an hour
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export class Crew {
  constructor(T, scene, shop, nav, state, hooks) {
    this.T = T; this.scene = scene; this.shop = shop; this.nav = nav; this.state = state; this.hooks = hooks; // hooks: { machineViews(), runMachine(m, skipped, p), toast(msg), say(p, text) }
    this.views = new Map();
    this.door = { x: shop.door.x, z: shop.hz - 0.6 }; this.outside = { x: shop.door.x, z: shop.hz + 2.5 };
    this.breakSpot = { x: shop.office.x1 + 1.2, z: shop.office.z0 + 1.2 };
    this.t = 0;
  }

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
  present(p) { const s = this.state; return p.startDay != null && p.startDay <= s.day && s.t >= (p.quirkId === 'late' ? 20 : 0) && s.t < CLOSE_MIN; }

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
      const m = mv.m; if (!m.placed || m.running || m.job || taken.has(m.uid)) continue;
      const d = byId(m.id); if (!canRun(p, d.kind)) continue;
      for (const o of runnableStages(s, d.kind)) {
        // a stage already loaded on another machine is spoken for
        if (views.some((q) => q.m.job && q.m.job.jobId === o.job.id)) continue;
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
      const opts = runnableStages(this.state, d.kind).filter((o) => !views.some((q) => q.m.job && q.m.job.jobId === o.job.id));
      if (opts.length) out.push({ m, d, o: opts[0] });
    }
    return out;
  }
  // the owner points at a machine and says "that one"
  assign(p, m) {
    const v = this.views.get(p.id); if (!v || !this.present(p)) return false;
    const d = byId(m.id); const opts = runnableStages(this.state, d.kind).filter((o) => !this.hooks.machineViews().some((q) => q.m.job && q.m.job.jobId === o.job.id));
    if (!opts.length || m.running || m.job) return false;
    const o = opts[0];
    m.job = { jobId: o.job.id, index: o.index, label: o.stage.label, min: o.stage.min, operator: p.id }; m.checklist = {};
    v.machine = m; this.goTo(v, this.spotFor(m), 'toMachine');
    return true;
  }
  takeFive(p) { const v = this.views.get(p.id); if (!v) return; this.dropMachine(v); this.goTo(v, this.breakSpot, 'toBreak'); v.wait = 15; }
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
      else if (['arrive', 'leave', 'toMachine', 'toBreak'].includes(v.mode)) this.arrived(v); // nowhere left to walk: we are there
      v.walk += ((walking ? 1 : 0) - v.walk) * Math.min(1, dt * 8);

      // ---- doing things
      if (v.mode === 'idle' && here && !lunch) {
        v.think -= dt;
        if (v.think <= 0) { v.think = 1.5 + Math.random() * 2; const f = this.freeMachineFor(p); if (f) { f.m.job = { jobId: f.o.job.id, index: f.o.index, label: f.o.stage.label, min: f.o.stage.min, operator: p.id }; f.m.checklist = {}; v.machine = f.m; this.goTo(v, this.spotFor(f.m), 'toMachine'); } }
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
            this.hooks.runMachine(m, skipped, p); p.workedToday = true;
            v.mode = m.running ? 'work' : 'idle'; if (!m.running) v.machine = null;
          }
        }
      }
      if (v.mode === 'work') { const m = v.machine; if (!m || !m.running) { v.machine = null; v.mode = 'idle'; v.think = 0.5; } }
      if (v.mode === 'break') { v.wait -= shopDt; if (v.wait <= 0 && !lunch) { v.mode = 'idle'; v.think = 0.3; } }

      // ---- the body
      const m = v.machine;
      const faceYaw = v.mode === 'work' || v.mode === 'setup' ? (v.target && v.target.face != null ? v.target.face : v.yaw) : v.yaw;
      v.g.position.set(v.pos.x, 0, v.pos.z); v.g.rotation.y = v.walk > 0.3 ? v.yaw : faceYaw;
      const mood = v.mode === 'work' || v.mode === 'setup' ? 'work' : p.morale < 0.35 && (v.mode === 'idle' || v.mode === 'break') ? 'sulk' : 'idle';
      pose(v.g, { mode: v.walk > 0.05 ? 'walk' : mood, t: this.t + p.id * 1.7, walk: v.walk, morale: p.morale });
      if (v.g.userData.mood !== (p.morale < 0.35 ? 'grumpy' : p.morale > 0.8 ? 'happy' : 'ok')) { v.g.userData.mood = p.morale < 0.35 ? 'grumpy' : p.morale > 0.8 ? 'happy' : 'ok'; v.g.userData.setMood(v.g.userData.mood); }
    });
  }

  arrived(v) {
    if (v.mode === 'arrive') { v.mode = 'idle'; v.think = 0.5; }
    else if (v.mode === 'leave') { v.mode = 'offsite'; v.g.visible = false; }
    else if (v.mode === 'toMachine') { if (v.machine && v.machine.job && !v.machine.running) { v.mode = 'setup'; v.setupLeft = SETUP_MIN * (1.4 - skillFor(v.p, byId(v.machine.id).kind) * 0.12); } else { v.machine = null; v.mode = 'idle'; } }
    else if (v.mode === 'toBreak') { v.mode = 'break'; }
    else v.mode = 'idle';
  }

  status(p) {
    const v = this.views.get(p.id); if (!v) return 'not here';
    if (p.startDay > this.state.day) return `starts day ${p.startDay}`;
    if (v.mode === 'offsite' || v.mode === 'leave' || v.mode === 'gone') return 'gone home';
    if (v.mode === 'work' || v.mode === 'setup') { const d = byId(v.machine.id); return `${v.mode === 'setup' ? 'setting up' : 'running'} the ${d.name.toLowerCase()}${v.machine.job && v.machine.job.jobId ? `, job ${v.machine.job.jobId}` : ''}`; }
    if (v.mode === 'break' || v.mode === 'toBreak') return 'on a break';
    if (v.mode === 'toMachine') return 'walking over to the ' + byId(v.machine.id).name.toLowerCase();
    return p.morale < 0.35 ? 'standing around, pointedly' : 'waiting for work';
  }
  lineFor(p) { const v = this.views.get(p.id); const ctx = v && (v.mode === 'work' || v.mode === 'setup') && v.machine && v.machine.job ? { working: true, job: v.machine.job.jobId, stage: v.machine.job.label } : {}; return line(p, ctx); }
  rebuildNav(colliders) { this.nav.rebuild(colliders); }
  // lights off: everyone is gone, whatever they were doing
  night() { for (const v of this.views.values()) { this.dropMachine(v); v.mode = 'offsite'; v.path = []; v.pos = { ...this.outside }; v.g.visible = false; } }
}
