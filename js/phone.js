// The office phone. It rings during the day. Rick is on it, or a customer with a complaint, or a
// man with a free cutting-tool trial. Answer it at the desk or let it ring; both have consequences.
import { CUSTOMERS, TEMPLATES, makeRfq, message, customerOf } from './jobs.js';
import { byId } from './catalog.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const RUSH_LINES = ['Press 14 is down. Need a core pin by tomorrow. Whatever it costs.', 'We broke a sleeve. Our guy says you can turn one tonight. Can you?', 'The mold is on the truck to the customer and the lifter is wrong. Tomorrow morning. Please.', 'Rick here. You up? Good. Need a bushing. Now-ish.'];
const COMPLAINTS = ['The pins are half a thou under. Half. A. Thou.', 'The sleeve fits. It fits too well. We had to press it in.', 'Your invoice says 4140. The print said P20. The part says nothing. What is it?', 'Somebody wrote "good luck" on the crate. In marker.'];
const SALES = ['Congratulations. Your business has been selected for a free trial of our cutting tools.', 'Hi, is the owner there? This is about your extended machine warranty.', 'We are calling about your energy bill. Hydro is going up. Did you know hydro is going up?'];

export class Phone {
  constructor(shop, state, audio, hooks) {
    this.shop = shop; this.state = state; this.audio = audio; this.hooks = hooks;
    this.call = null; this.dayPlanned = -1; this.calls = []; this.ringT = 0;
  }
  plan() {
    const s = this.state; if (this.dayPlanned === s.day) return; this.dayPlanned = s.day;
    this.calls = [];
    const n = (s.day - 1) % 7 === 5 ? 0 : Math.random() < 0.55 ? 1 : Math.random() < 0.25 ? 2 : 0;
    for (let i = 0; i < n; i++) this.calls.push({ at: 15 + Math.random() * 460, kind: Math.random() < 0.55 ? 'rush' : Math.random() < 0.5 ? 'complaint' : 'sales' });
    if ((s.redDays || 0) >= 2 && Math.random() < 0.6) this.calls.push({ at: 60 + Math.random() * 300, kind: 'bank' }); // the bank's number on the display. it is always the bank's number.
  }
  update(dt, listener) {
    const s = this.state; this.plan();
    if (!this.call) { const c = this.calls.find((q) => s.t >= q.at && s.t < q.at + 30); if (c) { this.calls.splice(this.calls.indexOf(c), 1); this.start(c.kind); } return; }
    this.call.left -= dt; this.ringT += dt;
    if (this.ringT > 1.7) { this.ringT = 0; const d = Math.hypot(listener.x - this.shop.phonePos.x, listener.z - this.shop.phonePos.z); this.audio.ring(1 / (1 + (d / 5) * (d / 5))); }
    if (this.shop.phoneLed) this.shop.phoneLed.material.emissiveIntensity = Math.sin(this.ringT * 20) > 0 ? 2 : 0;
    if (this.call.left <= 0) this.missed();
  }
  start(kind) {
    const s = this.state;
    const shipped = s.jobs.filter((j) => j.status === 'shipped');
    const cust = kind === 'rush' && Math.random() < 0.5 ? customerOf('northgate') : shipped.length ? customerOf(pick(shipped).customer) : pick(CUSTOMERS.filter((c) => !c.cnc && !c.five));
    this.call = { kind, cust, left: 40 };
    this.hooks.toast(kind === 'bank' ? pick(['The phone. The display says the bank. The display is never wrong.', 'The office phone. It is the bank. You can tell by the ring.']) : pick(['The phone. In the office.', 'The office phone is ringing. It does that.', 'Phone. Somebody wants something.']), 2500);
  }
  answer() {
    const c = this.call; if (!c) return null; this.call = null; if (this.shop.phoneLed) this.shop.phoneLed.material.emissiveIntensity = 0;
    const s = this.state;
    if (c.kind === 'rush') {
      const hasCnc = s.machines.some((m) => m.placed && byId(m.id).cnc);
      const t = pick(TEMPLATES.filter((q) => !q.mold && !q.weld && !q.five && (!q.cnc || hasCnc)));
      const r = makeRfq(s, t, c.cust); r.title = 'RUSH: ' + r.title; r.expected = Math.round(r.expected * 1.6); r.estimate = Math.round(r.estimate * 1.6); r.price = r.estimate; r.lead = 2; r.expires = s.day + 1; r.rush = true;
      s.rfqs.unshift(r); this.hooks.unlock('rush');
      message(s, c.cust.name, `RUSH: ${t.title}`, `${pick(RUSH_LINES)} Print attached. Rush rate is fine. Tomorrow.`);
      return `${c.cust.name}: "${pick(RUSH_LINES)}" A rush RFQ is in the inbox. Rush rate. Two days.`;
    }
    if (c.kind === 'bank') { this.hooks.unlock('the_display'); s.t = Math.min(s.t + 6, 960); return pick(['The bank. They asked how things are going. You said fine. They said they can see the balance. Six minutes, and a reminder about the four weeks.', 'The bank. A new person. They introduced themselves. They asked if the receivables were real. You said very. They wrote that down.', 'The bank. They would like a plan. You described a plan. It was the same plan. They said thank you in a way that was not thank you.']); }
    if (c.kind === 'complaint') {
      const line = pick(COMPLAINTS); const talked = Math.random() < 0.6;
      if (talked) { s.rep = Math.min(1, s.rep + 0.01); return `${c.cust.name}: "${line}" You talked them down. They are sending it back anyway, for a look.`; }
      s.rep = Math.max(0, s.rep - 0.03); return `${c.cust.name}: "${line}" You said the print was wrong. It was not. Reputation took a small hit.`;
    }
    s.t = Math.min(s.t + 4, 960); return `"${pick(SALES)}" Four minutes of your life. You said yes to a brochure.`;
  }
  missed() {
    const c = this.call; this.call = null; if (this.shop.phoneLed) this.shop.phoneLed.material.emissiveIntensity = 0;
    const s = this.state; this.hooks.unlock('voicemail');
    if (c.kind === 'rush') { message(s, c.cust.name, 'Called. No answer.', `${pick(RUSH_LINES)} Called twice. Lakeshore picked up. Never mind.`); this.hooks.toast(`Missed it. ${c.cust.name} needed something by tomorrow. Lakeshore picked up on the first ring.`, 4500); }
    else if (c.kind === 'complaint') { message(s, c.cust.name, 'Tried to call', `${pick(COMPLAINTS)} Call us back. Or do not, and we will send it back with a note.`); s.rep = Math.max(0, s.rep - 0.02); this.hooks.toast(`Missed a call from ${c.cust.name}. There is a voicemail. It is not a compliment.`, 4000); }
    else if (c.kind === 'bank') { s.redDays = (s.redDays || 0) + 1; this.hooks.toast('Missed the bank. The voicemail is polite. The missed call counts as a week, in their book. In their book it is always a week.', 4500); }
    else this.hooks.toast('Missed a call. The voicemail is about your extended machine warranty. Nothing of value was lost.', 4000);
  }
  night() { this.call = null; this.calls = []; if (this.shop.phoneLed) this.shop.phoneLed.material.emissiveIntensity = 0; }
}
