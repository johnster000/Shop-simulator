// Contracts. Stage 0 work: components, inserts, small plates and repairs for other mold shops and
// local molders. An RFQ arrives, you quote it, you win it or you don't, the steel shows up, you
// run the stages on your machines, you ship it, and the money arrives on terms, later.
// Pure simulation: no three.js, no DOM.

import { post } from './sim.js';

export const SHOP_RATE = 55;      // $/hr, Stage 0 work (design bible §4.1)
export const OUT_RATE = 110;      // $/hr, what the shop down the road charges to do it for you
export const OUT_DAYS = 2;        // and how long they take

export const CUSTOMERS = [
  { id: 'lakeshore', name: 'Lakeshore Mold & Die', kind: 'shop', stingy: 0.95, terms: 14, blurb: 'Big shop across town. Sends overflow when they are drowning. They are always drowning.' },
  { id: 'durham', name: 'Durham Tool', kind: 'shop', stingy: 1.05, terms: 14, blurb: 'Two brothers and a Bridgeport older than yours. Pay on time, argue about everything else.' },
  { id: 'northgate', name: 'Northgate Plastics', kind: 'molder', stingy: 0.9, terms: 30, blurb: 'A molder with forty presses and a maintenance guy named Rick. Rick calls at 6 a.m.' },
  { id: 'kitchener', name: 'Kitchener Precision', kind: 'shop', stingy: 1.0, terms: 21, blurb: 'Nice people. Their purchasing agent is not one of them.' },
  { id: 'bramalea', name: 'Bramalea Moldworks', kind: 'shop', stingy: 1.1, terms: 14, blurb: 'They also do overflow for you. Awkward.' },
  { id: 'erie', name: 'Erie Shore Packaging', kind: 'molder', stingy: 0.85, terms: 30, blurb: 'Caps and closures, millions a week. Everything is urgent. Everything.' },
];

// Work templates. Minutes are for one piece; qty scales the per-piece stages.
// kind is the station: saw, lathe, mill, drill, grinder, bench.
const TEMPLATES = [
  { title: 'Core pins, S7', qty: [2, 6], material: 18, steel: 'S7', stages: [['saw', 'Cut blanks', 6, true], ['lathe', 'Turn to size', 22, true], ['grinder', 'Grind the heads', 12, true]] },
  { title: 'Ejector sleeve, 420 SS', qty: [1, 2], material: 45, steel: '420 SS', stages: [['saw', 'Cut blank', 8, true], ['lathe', 'Turn and bore', 55, true], ['grinder', 'Grind OD', 20, true]] },
  { title: 'Insert block, P20', qty: [1, 1], material: 90, steel: 'P20', stages: [['saw', 'Cut block', 15], ['mill', 'Square and pocket', 70], ['grinder', 'Grind flat and parallel', 35], ['bench', 'Deburr and stamp', 15]] },
  { title: 'Electrode blanks, graphite', qty: [2, 4], material: 30, steel: 'graphite', stages: [['saw', 'Cut blanks', 5, true], ['mill', 'Machine blanks', 30, true]] },
  { title: 'Slide retainer plate, 4140', qty: [1, 2], material: 60, steel: '4140', stages: [['saw', 'Cut plate', 12], ['mill', 'Mill to size', 45, true], ['drill', 'Drill and tap', 18, true], ['bench', 'Deburr', 10]] },
  { title: 'Spotting block, 4140', qty: [1, 1], material: 70, steel: '4140', stages: [['saw', 'Cut block', 12], ['mill', 'Mill square', 40], ['grinder', 'Grind two faces', 25]] },
  { title: 'Gate insert, P20', qty: [1, 2], material: 55, steel: 'P20', stages: [['saw', 'Cut blank', 10], ['mill', 'Rough and finish', 60, true], ['grinder', 'Grind the fit', 25, true], ['bench', 'Polish the gate', 25, true]] },
  { title: 'Wear plates, P20', qty: [2, 4], material: 25, steel: 'P20', stages: [['saw', 'Cut plates', 6, true], ['mill', 'Mill to size', 25, true], ['grinder', 'Grind flat', 15, true]] },
  { title: 'Locating ring, 1018', qty: [1, 1], material: 35, steel: '1018', stages: [['saw', 'Cut blank', 8], ['lathe', 'Turn ring', 45], ['drill', 'Drill bolt pattern', 15]] },
  { title: 'Sprue bushing, modify', qty: [1, 1], material: 0, steel: 'customer supplied', stages: [['lathe', 'Open up the orifice', 30], ['bench', 'Polish the taper', 20]] },
  { title: 'Waterline plate, drill and tap', qty: [1, 1], material: 0, steel: 'customer supplied', stages: [['drill', 'Drill and tap waterlines', 45], ['bench', 'Plug and pressure check', 15]] },
  { title: 'Rest buttons, hardened', qty: [4, 8], material: 6, steel: 'A2', stages: [['saw', 'Cut blanks', 3, true], ['lathe', 'Turn buttons', 8, true], ['grinder', 'Grind faces', 5, true]] },
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function stationName(kind) { return { saw: 'band saw', lathe: 'lathe', mill: 'mill', drill: 'drill press', grinder: 'grinder', bench: 'bench' }[kind] || kind; }

export function initJobs(state) {
  if (!state.inbox) state.inbox = [];
  if (!state.rfqs) state.rfqs = [];
  if (!state.jobs) state.jobs = [];
  if (!state.receivables) state.receivables = [];
  if (state.rep == null) state.rep = 0.5;
  if (!state.nextRfq) state.nextRfq = 1;
  if (!state.jobNo) state.jobNo = 1000;
  if (!state.msgNo) state.msgNo = 1;
  if (state.crates == null) state.crates = 0;
  if (state.scrapCount == null) state.scrapCount = 0;
  if (!state.inbox.length) { seedFirstDay(state); }
}

export function message(state, from, subject, body, extra = {}) {
  const m = { id: state.msgNo++, type: 'msg', day: state.day, read: false, from, subject, body, ...extra };
  state.inbox.unshift(m);
  if (state.inbox.length > 80) state.inbox.length = 80;
  return m;
}

export function unread(state) { return state.inbox.filter((m) => !m.read).length + state.rfqs.filter((r) => r.status === 'open' && !r.read).length; }

function makeRfq(state, template, customer) {
  const qty = rint(template.qty[0], template.qty[1]);
  const stages = template.stages.map(([kind, label, min, perPiece]) => ({ kind, label, min: Math.round(min * (perPiece ? qty : 1)), done: false, out: null }));
  const minutes = stages.reduce((a, s) => a + s.min, 0);
  const material = Math.round(template.material * qty);
  const estimate = Math.round((minutes / 60) * SHOP_RATE + material);
  const expected = Math.round(estimate * customer.stingy * (0.92 + Math.random() * 0.16));
  const lead = rint(4, 9);
  return {
    id: state.nextRfq++, status: 'open', read: false, day: state.day, expires: state.day + 2,
    customer: customer.id, title: template.title, qty, steel: template.steel, stages, minutes, material, estimate, expected, lead, price: estimate,
  };
}

function seedFirstDay(state) {
  // the first two RFQs: one you can do with a mill, a saw and a bench; one that needs a lathe.
  state.rfqs.push(makeRfq(state, TEMPLATES[2], CUSTOMERS[0]));
  state.rfqs.push(makeRfq(state, TEMPLATES[0], CUSTOMERS[1]));
  message(state, 'Rick (Northgate Plastics)', 'You open?', 'Heard you got a shop. Got a sprue bushing needs opening up. Will send a print when I find it. Rick');
}

export function customerOf(id) { return CUSTOMERS.find((c) => c.id === id); }

export function shopHas(state, kind, byId) { return state.machines.some((m) => m.placed && byId(m.id).stations.includes(stationKindToStation(kind))); }
// station names on machine defs vs. stage kinds
export function stationKindToStation(kind) { return { saw: 'saw', lathe: 'turn', mill: 'rough', drill: 'drill', grinder: 'grind', bench: 'fit' }[kind]; }

// the player sends a quote. decided the next morning.
export function sendQuote(state, rfq, price) { rfq.price = Math.round(price); rfq.status = 'quoted'; rfq.read = true; }
export function declineRfq(state, rfq) { rfq.status = 'declined'; rfq.read = true; }

export function winChance(state, rfq) {
  const c = customerOf(rfq.customer); const r = rfq.price / rfq.expected;
  let p = r <= 1 ? 0.8 + (1 - r) * 0.6 : 0.8 - (r - 1) * 2.2;
  p *= 0.7 + 0.6 * (state.rep - 0.5);
  return Math.max(0.02, Math.min(0.97, p));
}

function startJob(state, rfq) {
  const c = customerOf(rfq.customer);
  const job = {
    id: state.jobNo++, rfqId: rfq.id, customer: rfq.customer, title: rfq.title, qty: rfq.qty, steel: rfq.steel,
    stages: rfq.stages.map((s) => ({ ...s })), price: rfq.price, material: rfq.material, minutes: rfq.minutes,
    poDay: state.day, dueDay: state.day + rfq.lead, materialDay: rfq.material > 0 ? state.day + 1 : state.day,
    status: rfq.material > 0 ? 'material' : 'work', shippedDay: null, scrap: 0,
  };
  state.jobs.push(job);
  // deposit: 50% on PO for shops and molders (bible §7.5). material goes out today.
  const deposit = Math.round(job.price * 0.5);
  post(state, `Deposit, ${c.name}, job ${job.id}`, deposit);
  if (job.material > 0) post(state, `Steel for job ${job.id} (${job.steel})`, -job.material);
  message(state, c.name, `PO ${job.id}: ${job.title}`, `Your quote of $${job.price.toLocaleString()} is accepted. Deposit of $${deposit.toLocaleString()} sent. We need it by day ${job.dueDay}.${job.material > 0 ? ` Steel is ordered; it will be on the rack tomorrow.` : ' Parts are on the way to you.'}`);
  return job;
}

// What a stage needs to run now: the job's material has arrived, every stage before it is done, and it is not out.
export function runnableStages(state, kind) {
  const out = [];
  for (const job of state.jobs) {
    if (job.status !== 'work') continue;
    const i = job.stages.findIndex((s) => !s.done);
    if (i < 0) continue;
    const s = job.stages[i];
    if (s.kind === kind && !s.out) out.push({ job, stage: s, index: i });
  }
  return out;
}

export function nextStage(job) { return job.stages.find((s) => !s.done) || null; }

export function stageDone(state, job, index) {
  job.stages[index].done = true;
  if (job.stages.every((s) => s.done)) { job.status = 'ready'; state.crates++; return true; }
  return false;
}

// a scrapped stage: the material is gone, the stages start over.
export function scrapJob(state, job) {
  job.scrap++; state.scrapCount++;
  for (const s of job.stages) { s.done = false; s.out = null; }
  if (job.material > 0) { post(state, `Steel again for job ${job.id}`, -job.material); job.materialDay = state.day + 1; job.status = 'material'; }
}

// send a stage out to the shop down the road
export function sendOut(state, job, index) {
  const s = job.stages[index];
  const cost = Math.round((s.min / 60) * OUT_RATE) + 40;
  if (state.cash < cost) return { ok: false, why: 'not enough cash' };
  post(state, `Bramalea Moldworks: ${s.label.toLowerCase()}, job ${job.id}`, -cost);
  s.out = { backDay: state.day + OUT_DAYS, cost };
  return { ok: true, cost };
}

export function ship(state, job) {
  if (job.status !== 'ready') return null;
  const c = customerOf(job.customer);
  job.status = 'shipped'; job.shippedDay = state.day; state.crates = Math.max(0, state.crates - 1);
  const late = Math.max(0, state.day - job.dueDay);
  let balance = job.price - Math.round(job.price * 0.5);
  let note = '';
  if (late > 0) { const pen = Math.round(job.price * Math.min(0.3, 0.05 * late)); balance -= pen; note = ` ${late} day${late === 1 ? '' : 's'} late. They knocked $${pen.toLocaleString()} off and will remember.`; state.rep = Math.max(0, state.rep - 0.08); }
  else { state.rep = Math.min(1, state.rep + 0.04); }
  state.receivables.push({ due: state.day + c.terms, amount: balance, text: `${c.name}, job ${job.id} balance` });
  message(state, c.name, `Received: job ${job.id}`, `${job.title} received.${note} Balance of $${balance.toLocaleString()} on net ${c.terms}.`);
  return { late, balance };
}

// Once a day, at going home: quotes are decided, steel arrives, outsourced work comes back,
// invoices get paid, new RFQs come in, old ones expire.
export function endOfDay(state, byId) {
  const notes = [];
  // quotes
  for (const r of state.rfqs) {
    if (r.status !== 'quoted') continue;
    const c = customerOf(r.customer);
    if (Math.random() < winChance(state, r)) { r.status = 'won'; const job = startJob(state, r); notes.push(`PO from ${c.name}: ${job.title}.`); }
    else { r.status = 'lost'; message(state, c.name, `Re: quote, ${r.title}`, pick(['Thanks for the quote. We went another way.', 'We will keep you in mind for the next one.', 'A bit rich for us this time.', 'Our guy had a slot open. Next time.'])); notes.push(`Lost the ${r.title} to somebody cheaper.`); }
  }
  // expiry
  for (const r of state.rfqs) if (r.status === 'open' && state.day >= r.expires) { r.status = 'expired'; }
  state.rfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'quoted' || state.day - r.day < 6);
  // steel and outsourced work
  for (const job of state.jobs) {
    if (job.status === 'material' && state.day >= job.materialDay) { job.status = 'work'; notes.push(`Steel on the rack for job ${job.id}.`); }
    for (const s of job.stages) if (s.out && !s.done && state.day >= s.out.backDay) { s.done = true; s.out = null; notes.push(`Job ${job.id}: ${s.label.toLowerCase()} back from Bramalea.`); if (job.stages.every((q) => q.done)) { job.status = 'ready'; state.crates++; } }
    if (job.status === 'work' && state.day === job.dueDay) notes.push(`Job ${job.id} is due today.`);
  }
  // money in
  for (const rcv of state.receivables.slice()) if (state.day >= rcv.due) { post(state, rcv.text, rcv.amount); state.receivables.splice(state.receivables.indexOf(rcv), 1); notes.push(`Paid: ${rcv.text}, $${rcv.amount.toLocaleString()}.`); }
  // new work. reputation sets how often the phone rings.
  const n = Math.random() < 0.35 + state.rep * 0.5 ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const c = pick(CUSTOMERS), t = pick(TEMPLATES);
    const r = makeRfq(state, t, c); state.rfqs.push(r); notes.push(`RFQ from ${c.name}: ${t.title}.`);
  }
  return notes;
}
