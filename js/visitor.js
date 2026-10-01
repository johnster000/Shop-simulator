// The customer walks the floor. Once in a while, between nine and eleven, somebody from a customer
// turns up in a visitor vest and safety glasses, walks past the machines, and forms an opinion.
// The opinion arrives by email that night, with or without an RFQ attached.
import { buildPerson, randomLook, pose } from './person.js';
import { byId } from './catalog.js';
import { CUSTOMERS, customerOf, message, makeRfq, TEMPLATES } from './jobs.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const FIRST = ['Dave', 'Sandra', 'Pat', 'Ravi', 'Christine', 'Marc', 'Lena', 'Gord', 'Priya', 'Tom'];
const TITLES = ['purchasing', 'the tooling engineer', 'quality', 'the plant manager', 'the new buyer', 'the owner\'s nephew'];

export class Visitor {
  constructor(T, scene, shop, nav, state, crew, hooks) {
    this.T = T; this.scene = scene; this.shop = shop; this.nav = nav; this.state = state; this.crew = crew; this.hooks = hooks;
    const look = randomLook(); look.vest = true; look.glasses = true; look.hat = 'none'; look.coveralls = false;
    this.g = buildPerson(T, look); this.g.visible = false; scene.add(this.g);
    this.g.traverse((o) => { o.userData.interact = { type: 'visitor' }; });
    this.pos = { x: 0, z: 0 }; this.yaw = 0; this.walk = 0; this.path = []; this.t = 0; this.wait = 0;
    this.here = false; this.dayChecked = -1; this.due = null; this.stops = []; this.score = 0; this.seen = new Set(); this.toured = false;
    this.p = { id: -1, name: '' };
    crew.extras.set(-1, { p: this.p, g: this.g, pos: this.pos });
  }
  // once a day, decide whether anybody is coming
  plan() {
    const s = this.state; if (this.dayChecked === s.day) return; this.dayChecked = s.day;
    const shipped = s.jobs.filter((j) => j.status === 'shipped');
    const p = (shipped.length ? 0.05 : 0.02) + s.rep * 0.05 + (s.jobs.some((j) => j.status === 'work' && j.mold) ? 0.04 : 0);
    this.due = Math.random() < p ? 120 + Math.random() * 100 : null;
    if (this.due != null) {
      const custs = shipped.length && Math.random() < 0.7 ? [...new Set(shipped.map((j) => j.customer))].map(customerOf) : CUSTOMERS.filter((c) => !c.five && !c.cnc);
      this.customer = pick(custs.length ? custs : CUSTOMERS); this.p.name = `${pick(FIRST)} (${this.customer.name})`; this.title = pick(TITLES);
    }
  }
  arrive() {
    const s = this.state, d = this.shop.door;
    this.here = true; this.g.visible = true; this.pos.x = d.x; this.pos.z = this.shop.hz - 0.8; this.score = 0; this.seen.clear(); this.toured = false; this.hit = false;
    // the stops: up to three machines, then the whiteboard
    const ms = s.machines.filter((m) => m.placed).sort(() => Math.random() - 0.5).slice(0, 3);
    this.stops = ms.map((m) => ({ ...this.crew.spotFor(m), m })).concat([{ x: this.shop.office.x1 + 1.0, z: this.shop.office.z0 + 1.6 }]);
    this.goTo(this.stops.shift());
    this.hooks.say(this.p, pick(['Hi! We were in the area.', 'Hello? Anybody? The door was open.', `${this.title[0].toUpperCase() + this.title.slice(1)}. Just looking.`, 'Do I need a vest? I brought a vest.']));
    this.hooks.toast(`${this.p.name} is on the floor. ${this.title[0].toUpperCase() + this.title.slice(1)}. Looking around. Say hello, or do not throw anything.`, 5000);
  }
  goTo(t) { this.target = t; this.path = this.nav.path(this.pos.x, this.pos.z, t.x, t.z); if (!this.path.length) this.path = [t]; this.wait = 0; }
  // what they think of what they see
  look() {
    const s = this.state, out = [];
    const note = (k, pts, text) => { if (this.seen.has(k)) return; this.seen.add(k); this.score += pts; out.push(text); };
    const m = this.target && this.target.m;
    if (m) {
      const d = byId(m.id);
      if (m.fire) { note('fire', -3, 'Is that... on FIRE?'); this.leaveNow('fire'); return; }
      if (m.down) note('down', -1, pick([`Is the ${d.name.toLowerCase()} down?`, 'That one has a sign on it.', 'Does that one work?']));
      else if (m.taped) note('tape', -1, pick(['Is that duct tape?', 'Is the tape structural?']));
      else if (m.running) note('running', 1, pick(['Busy. Good.', 'What is that one cutting?', 'Nice. Ours is louder.']));
      else if (d.five) note('five', 1, 'Oh. You have one of those.');
      else if (d.kind === 'cmm') note('cmm', 1, 'A CMM. Quality will be pleased.');
      else if ((m.chips || 0) > 0.7) note('chips', -1, pick(['Somebody should sweep.', 'Are those chips or is that the floor?', 'I am wearing good shoes.']));
      else if (m.condition < 0.4) note('tired', -1, pick(['That one has seen some things.', 'How old is this?']));
      else note('idle' + m.uid, 0, pick(['Hm.', 'Okay.', 'What does this one do?']));
    } else {
      if (s.scrapCount >= 6) note('scrap', -1, pick(['That is a lot of scrap.', 'Big bin.']));
      if (s.facility.crane) note('crane', 1, 'A crane. Nice.');
      if (s.building === 'large') note('big', 1, 'Big place. Bigger than ours.');
      const crew = [...this.crew.views.values()].filter((v) => v.g.visible);
      if (crew.length && crew.every((v) => v.mode === 'idle' || v.mode === 'break' || v.mode === 'gawk')) note('relaxed', -1, pick(['Your guys look relaxed.', 'Slow day?']));
      note('board', 0, pick(['Is that the real schedule?', 'I see our job on the board. Good.', '"Radio: NO". Ha.']));
    }
    if (out.length) this.hooks.say(this.p, out[out.length - 1], 3.5);
  }
  tour() { // the owner says hello
    if (!this.here || this.toured) return false; this.toured = true; this.score += 1;
    this.hooks.say(this.p, pick(['You built all this? Huh.', 'Nice to put a face to the invoices.', 'We should talk about the next one.', 'Do you do overflow? We have overflow.']), 3.5);
    return true;
  }
  leaveNow(why) { this.hooks.say(this.p, why === 'thrown' ? 'OW. We are LEAVING.' : why === 'fire' ? 'I will call you.' : 'Okay. Thanks. Bye.', 3); this.stops = []; this.goTo({ x: this.shop.door.x, z: this.shop.hz + 2.5 }); this.leaving = true; }
  struck() { if (!this.here || this.hit) return; this.hit = true; this.score -= 3; this.leaveNow('thrown'); }
  update(dt) {
    const s = this.state; this.t += dt; this.plan();
    if (!this.here) { if (this.due != null && s.t >= this.due && s.t < this.due + 60 && s.machines.some((m) => m.placed)) this.arrive(); return; }
    let walking = 0;
    if (this.path.length) {
      const tgt = this.path[0], dx = tgt.x - this.pos.x, dz = tgt.z - this.pos.z, dist = Math.hypot(dx, dz);
      const spd = 1.1 * Math.min(4, Math.max(1, s.speed || 1)), step = Math.min(dist, spd * dt);
      if (dist > 0.001) { this.pos.x += (dx / dist) * step; this.pos.z += (dz / dist) * step; const want = Math.atan2(dx, dz); let dy = want - this.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.yaw += dy * Math.min(1, dt * 8); walking = 1; }
      if (dist <= step + 0.01) this.path.shift();
      if (!this.path.length) { if (this.leaving) { this.finish(); return; } this.wait = 4 + Math.random() * 3; if (this.target && this.target.face != null) this.yaw = this.target.face; this.look(); }
    } else {
      this.wait -= dt;
      if (this.wait <= 0) { if (this.stops.length) this.goTo(this.stops.shift()); else this.leaveNow('done'); }
    }
    this.walk += ((walking ? 1 : 0) - this.walk) * Math.min(1, dt * 8);
    this.g.position.set(this.pos.x, 0, this.pos.z); this.g.rotation.y = this.yaw;
    pose(this.g, { mode: this.walk > 0.05 ? 'walk' : 'idle', t: this.t, walk: this.walk, morale: 0.7 });
  }
  // the verdict, by email, that night. the score decides the tone and whether an RFQ comes with it.
  finish() {
    const s = this.state, c = this.customer; this.here = false; this.g.visible = false; this.leaving = false; this.due = null;
    const sc = this.score;
    s.rep = Math.max(0, Math.min(1, s.rep + (this.hit ? -0.15 : sc >= 3 ? 0.06 : sc >= 1 ? 0.03 : sc <= -2 ? -0.06 : 0)));
    let body;
    if (this.hit) body = `We will not be visiting again. ${this.p.name.split(' ')[0]} is fine. The vest was not. Please consider this our last RFQ, which is attached to nothing.`;
    else if (this.seen.has('fire')) body = 'We saw the fire. We hope everyone is okay. We are going with Lakeshore on the next one, which you will understand.';
    else if (sc >= 3) { body = `Thanks for the tour. The place looks good, the ${this.seen.has('five') ? '5-axis' : 'crew'} especially. Quoting you on the next one; RFQ attached.`; const t = pick(TEMPLATES.filter((q) => (!q.cnc || s.machines.some((m) => m.placed && byId(m.id).cnc)) && (!q.five || s.machines.some((m) => m.placed && byId(m.id).five)) && (!q.mold || s.rep >= 0.5))); if (t) s.rfqs.push(makeRfq(s, t, c)); }
    else if (sc >= 1) body = pick(['Thanks for having us. Looks like a real shop. We will keep you on the list.', 'Good visit. Our quality person wants to know if the CMM is calibrated. I said probably.']);
    else if (sc <= -2) body = pick([`Thanks for the visit. A few of the machines ${this.seen.has('tape') ? 'had tape on them' : 'looked tired'}, and ${this.seen.has('relaxed') ? 'nobody seemed busy' : 'the bin was full'}. We will send the next one to Lakeshore and see.`, 'We saw the floor. Let us talk again when things are a bit more under control.']);
    else body = pick(['Thanks for letting us wander. No notes, which is not a compliment, but not a complaint.', 'Quick visit. Fine. The coffee was fine.']);
    message(s, c.name, `Re: our visit`, body);
    this.hooks.toast(`${this.p.name} left. ${this.hit ? 'Limping. There will be an email.' : sc >= 3 ? 'Impressed. There will be an RFQ.' : sc >= 1 ? 'Pleasant enough.' : sc <= -2 ? 'Not impressed. There will be an email.' : 'Noncommittal.'}`, 4500);
    if (sc >= 3) this.hooks.unlock('tour');
  }
  night() { if (this.here) this.finish(); this.here = false; this.g.visible = false; this.leaving = false; }
}
