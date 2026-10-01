// Contracts. Stage 0 work: components, inserts, small plates and repairs for other mold shops and
// local molders. An RFQ arrives, you quote it, you win it or you don't, the steel shows up, you
// run the stages on your machines, you ship it, and the money arrives on terms, later.
// Pure simulation: no three.js, no DOM.

import { tally, post } from './sim.js';
import { hasEstimator } from './people.js';

export const SHOP_RATE = 55;      // $/hr, Stage 0 work (design bible §4.1)
export const CNC_RATE = 95;       // $/hr, work that needs a CNC
export const HEAT_COST = 140;     // Quench & Sons, per job, plus two days and a small chance of a crack
export const MOLD_RATE = 110;     // $/hr, a new tool build
export const BASE_DAYS = 5;       // DMV: take a number
export const TRYOUT_DAYS = 2;     // press time at a molder: when they have a slot
export const DESIGN_OUT = 3200;   // a contract designer, when you have no CAD or no time
export const OUT_RATE = 110;      // $/hr, what the shop down the road charges to do it for you
export const OUT_DAYS = 2;        // and how long they take

export const CUSTOMERS = [
  { id: 'lakeshore', name: 'Lakeshore Mold & Die', kind: 'shop', stingy: 0.95, terms: 14, blurb: 'Big shop across town. Sends overflow when they are drowning. They are always drowning.' },
  { id: 'durham', name: 'Durham Tool', kind: 'shop', stingy: 1.05, terms: 14, blurb: 'Two brothers and a Bridgeport older than yours. Pay on time, argue about everything else.' },
  { id: 'northgate', name: 'Northgate Plastics', kind: 'molder', stingy: 0.9, terms: 30, blurb: 'A molder with forty presses and a maintenance guy named Rick. Rick calls at 6 a.m.' },
  { id: 'kitchener', name: 'Kitchener Precision', kind: 'shop', stingy: 1.0, terms: 21, blurb: 'Nice people. Their purchasing agent is not one of them.' },
  { id: 'bramalea', name: 'Bramalea Moldworks', kind: 'shop', stingy: 1.1, terms: 14, blurb: 'They also do overflow for you. Awkward.' },
  { id: 'erie', name: 'Erie Shore Packaging', kind: 'molder', stingy: 0.85, terms: 30, blurb: 'Caps and closures, millions a week. Everything is urgent. Everything.' },
  // consumer products: they only call once you have a CNC
  { id: 'maplewood', name: 'Maplewood Housewares', kind: 'consumer', stingy: 1.0, terms: 30, cnc: true, blurb: 'Bins, lids and a salad spinner. Their engineer is twenty-six and certain.' },
  // automotive: they call once there is a 5-axis on the floor. they pay in 60 days and audit you first.
  { id: 'dorval', name: 'Dorval Automotive Mouldings', kind: 'auto', stingy: 1.15, terms: 60, cnc: true, five: true, blurb: 'Tier 2. A quality manual thicker than the mold. Sixty-day terms and a portal that is down.' },
  { id: 'trillium', name: 'Trillium Outdoor', kind: 'consumer', stingy: 1.05, terms: 30, cnc: true, blurb: 'Cooler parts and paddle grips. Nice people. Slow to approve anything.' },
];

// Work templates. Minutes are for one piece; qty scales the per-piece stages.
// kind is the station: saw, lathe, mill, drill, grinder, bench.
export const TEMPLATES = [
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
  // CNC-class work. kinds: vmc, sinker, wire, heat (always out)
  { title: 'Cavity insert, P20', cnc: true, qty: [1, 1], material: 180, steel: 'P20', stages: [['saw', 'Cut block', 15], ['vmc', 'Rough and finish cavity', 170], ['grinder', 'Grind the fit', 30], ['bench', 'Polish to B-2', 40]] },
  { title: 'Core and cavity set, NAP80', cnc: true, qty: [1, 1], material: 420, steel: 'NAP80', stages: [['saw', 'Cut blocks', 20], ['vmc', 'Rough both halves', 160], ['vmc', 'Finish both halves', 140], ['sinker', 'Burn the ribs', 120], ['bench', 'Polish to A-3', 90]] },
  { title: 'Lifter, S7 hardened', cnc: true, qty: [1, 2], material: 90, steel: 'S7', stages: [['saw', 'Cut blank', 10, true], ['vmc', 'Rough soft', 60, true], ['heat', 'Heat treat', 0], ['wire', 'Wire the profile', 110, true], ['grinder', 'Grind the heel', 25, true]] },
  { title: 'Electrode set, graphite', cnc: true, qty: [2, 4], material: 45, steel: 'graphite', stages: [['saw', 'Cut blanks', 5, true], ['electrode', 'Machine electrodes', 45, true]] },
  // repairs. a laser welder and somebody who can weld. you can weld.
  { title: 'Repair: weld and re-cut a lifter', weld: true, qty: [1, 1], material: 0, steel: 'customer supplied', stages: [['weld', 'Weld up the worn heel', 60], ['grinder', 'Grind it back to size', 45], ['bench', 'Fit and polish', 40]] },
  { title: 'Repair: blend a ding in a cavity', weld: true, qty: [1, 1], material: 0, steel: 'customer supplied', stages: [['weld', 'Weld the ding', 30], ['bench', 'Blend and polish', 90]] },
  { title: 'Stripper plate, 4140', cnc: true, qty: [1, 1], material: 260, steel: '4140', stages: [['saw', 'Cut plate', 20], ['vmc', 'Mill pockets and pattern', 150], ['drill', 'Drill and tap waterlines', 40], ['grinder', 'Grind flat', 45]] },
  // Molds. Real tool builds: items in parallel, then fit, assemble, tryout, revise, ship.
  // a prototype tool: aluminum inserts for the customer's MUD frame. quick, cheap, manual machines will do.
  { title: 'Prototype tool, aluminum inserts, 1 cavity', mold: true, proto: true, cnc: false, size: 'S', cav: 1, geo: 1, slides: 0, steel: '7075 aluminum', finish: 'B-3', runner: 'cold', hard: false, base: 0, steelCost: 350 },
  // a transfer tool: somebody else's mold arrives in a crate. the crate always contains a surprise.
  { title: 'Transfer tool: somebody else\'s mold, in a crate', mold: true, transfer: true, cnc: false, size: 'M', cav: 2, geo: 1, slides: 0, steel: 'P20, allegedly', finish: 'B-2', runner: 'cold', hard: false, base: 0, steelCost: 0 },
  { title: 'Single-cavity mold, bin lid', mold: true, cnc: true, size: 'M', cav: 1, geo: 1, slides: 0, steel: 'P20', finish: 'B-2', runner: 'cold', hard: false, base: 3200, steelCost: 900 },
  { title: 'Single-cavity mold, paddle grip', mold: true, cnc: true, size: 'S', cav: 1, geo: 2, slides: 1, steel: 'P20', finish: 'B-1', runner: 'cold', hard: false, base: 2600, steelCost: 700 },
  { title: '2-cavity mold, closure', mold: true, cnc: true, size: 'S', cav: 2, geo: 2, slides: 0, steel: 'NAP80', finish: 'A-3', runner: 'cold', hard: false, base: 3400, steelCost: 1600 },
  { title: '2-cavity mold, cooler latch', mold: true, cnc: true, size: 'S', cav: 2, geo: 2, slides: 2, steel: 'H13', finish: 'B-2', runner: 'cold', hard: true, base: 3600, steelCost: 1900 },
  { title: 'Automotive mold, door handle bezel, 2 slides + lifter', mold: true, cnc: true, five: true, size: 'L', cav: 2, geo: 3, slides: 2, steel: 'H13', finish: 'A-2', runner: 'hot', hard: true, base: 9000, steelCost: 6500 },
  { title: 'Automotive mold, instrument cluster bezel, 4 slides', mold: true, cnc: true, five: true, size: 'L', cav: 1, geo: 3, slides: 4, steel: 'H13', finish: 'A-1', runner: 'hot', hard: true, base: 14000, steelCost: 9000 },
  { title: '4-cavity mold, cap, hot runner', mold: true, cnc: true, size: 'S', cav: 4, geo: 2, slides: 0, steel: '420 SS', finish: 'A-3', runner: 'hot', hard: true, base: 5200, steelCost: 3400, manifold: 9800 },
  { title: 'Slide body, hardened H13', cnc: true, qty: [1, 2], material: 150, steel: 'H13', stages: [['saw', 'Cut block', 15, true], ['vmc', 'Rough soft', 90, true], ['heat', 'Heat treat', 0], ['wire', 'Wire the gib slots', 80, true], ['sinker', 'Burn the detail', 60, true], ['bench', 'Fit and polish', 40, true]] },
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function stationName(kind) { return { saw: 'band saw', lathe: 'lathe', mill: 'mill', drill: 'drill press', grinder: 'grinder', bench: 'bench', vmc: 'VMC', sinker: 'sinker EDM', wire: 'wire EDM', heat: 'oven (or Quench & Sons)', base: 'DMV (vendor)', manifold: 'Mould-Majors (vendor)', tryout: 'sampling press (or the molder)', press: 'sampling press', design: 'office PC', fitspot: 'bench or spotting press', electrode: 'graphite mill (or a dusty VMC)', weld: 'laser welder', spot: 'spotting press', graphite: 'graphite mill', cmm: 'CMM', laser: 'laser welder' }[kind] || kind; }
// which stations can run which stage kinds
export function matches(stageKind, stationKind) {
  if (stageKind === stationKind) return true;
  if (stageKind === 'fitspot') return stationKind === 'bench' || stationKind === 'spot';
  if (stageKind === 'electrode') return stationKind === 'graphite' || stationKind === 'vmc';
  if (stageKind === 'weld') return stationKind === 'laser';
  if (stageKind === 'tryout') return stationKind === 'press';
  if (stageKind === 'heat') return stationKind === 'heat';
  return false;
}
export const VENDOR_KINDS = new Set(['heat', 'base', 'manifold', 'tryout']);
// how long a vendor stage takes when the shop does it itself
export const IN_HOUSE_MIN = { heat: 240, tryout: 90 };
// the shop has its own press or oven, so that stage is not automatically sent out
export function inHouse(state, kind, byId) { const st = { heat: 'heat', tryout: 'tryout' }[kind]; return !!st && state.machines.some((m) => m.placed && !m.down && byId(m.id).stations.includes(st)); }
// after a tryout, in-house or at the molder: the defects, and the T1 money
export function afterTryout(state, job, byId) {
  const t1 = job.tryouts === 0; const notes = resolveTryout(state, job, byId);
  if (t1) { const pay = Math.round(job.price * 0.3); job.paid = (job.paid || 0) + pay; post(state, `T1 payment, ${customerOf(job.customer).name}, job ${job.id}`, pay); notes.push(`T1 money in: $${pay.toLocaleString()}.`); }
  return notes;
}
export function isCnc(kind) { return kind === 'vmc' || kind === 'sinker' || kind === 'wire'; }

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

const st = (kind, label, min) => ({ kind, label, min: Math.round(min), done: false, out: null });

// A mold is a set of work items that move through the shop on their own, then come together.
export function moldItems(t) {
  if (t.proto) {
    const ins = (name) => ({ name, stages: [st('mill', 'Rough the insert', 200), st('mill', 'Finish the insert', 160), st('bench', 'Polish to B-3', 60)] });
    return { items: [ins('Cavity insert'), ins('Core insert')], jobStages: [st('design', 'Insert design', 180), st('fitspot', 'Fit the inserts to the frame', 180), st('bench', 'Pins, water, a label', 60), st('tryout', 'Tryout T1', 0)] };
  }
  if (t.transfer) {
    return { items: [{ name: 'The crate', stages: [st('bench', 'Open the crate', 30), st('bench', 'Clean it up', 120)] }],
      jobStages: [st('design', 'Assess the damage from the photos', 120), st('fitspot', 'Fit and spot what they sent', 240), st('bench', 'Make it run', 120), st('tryout', 'Tryout T1', 0)] };
  }
  const polish = { 'C-1': 1, 'B-2': 3, 'B-1': 4, 'A-3': 7, 'A-2': 9 }[t.finish] || 3;
  const sizeK = { S: 0.8, M: 1, L: 1.5 }[t.size] || 1, geoK = 0.8 + t.geo * 0.25;
  const items = [];
  items.push({ name: 'Mold base', stages: [st('base', 'Mold base from DMV', 0)] });
  const block = (name, k) => {
    const stages = [st('vmc', 'Rough', 600 * sizeK * geoK * k)];
    if (t.hard) { stages.push(st('heat', 'Heat treat', 0)); stages.push(st('grinder', 'Grind after heat treat', 90 * sizeK)); }
    stages.push(st('vmc', 'Finish', 540 * sizeK * geoK * k));
    if (t.geo >= 2) { stages.push(st('electrode', 'Cut the electrodes', 90 * geoK * k)); stages.push(st('sinker', 'Burn the detail', 300 * geoK * k)); }
    stages.push(st('grinder', 'Grind the parting line', 60 * sizeK));
    stages.push(st('bench', `Polish to ${t.finish}`, 90 * polish * sizeK * k));
    return { name, stages };
  };
  items.push(block('Cavity (A-side)', 1.0 * Math.sqrt(t.cav)));
  items.push(block('Core (B-side)', 0.9 * Math.sqrt(t.cav)));
  for (let i = 0; i < t.slides; i++) items.push({ name: `Slide ${i + 1}`, stages: [st('vmc', 'Rough', 150), ...(t.hard ? [st('heat', 'Heat treat', 0)] : []), st('wire', 'Wire the gib', 120), st('grinder', 'Grind the fit', 60), st('bench', 'Fit the slide', 120)] });
  if (t.runner === 'hot') items.push({ name: 'Hot runner', stages: [st('manifold', 'Manifold from Mould-Majors', 0)] });
  const jobStages = [
    st('design', 'Mold design', 420 * sizeK * (1 + t.slides * 0.2)),
    st('fitspot', 'Fit and spot', 720 * sizeK * (1 + t.slides * 0.3) * Math.sqrt(t.cav)),
    st('bench', 'Assemble ejection, water, hardware', 240 * sizeK * (t.runner === 'hot' ? 1.5 : 1)),
    st('tryout', 'Tryout T1', 0),
  ];
  return { items, jobStages };
}

export function makeRfq(state, template, customer) {
  if (template.mold) {
    const { items, jobStages } = moldItems(template);
    const minutes = items.reduce((a, it) => a + it.stages.reduce((b, q) => b + q.min, 0), 0) + jobStages.reduce((a, q) => a + q.min, 0);
    const material = template.steelCost + template.base + (template.manifold || 0);
    const heat = template.hard ? HEAT_COST * 2 : 0;
    const tryout = 200 * (4 + template.cav);
    const estimate = Math.round((minutes / 60) * MOLD_RATE + material + heat + tryout);
    const expected = Math.round(estimate * customer.stingy * (0.92 + Math.random() * 0.16));
    const lead = rint(30, 45);
    return { id: state.nextRfq++, status: 'open', read: false, day: state.day, expires: state.day + 4, customer: customer.id, title: template.title, qty: 1, steel: template.steel,
      items, jobStages, stages: items.flatMap((it) => it.stages).concat(jobStages), minutes, material, estimate, expected, lead, price: estimate, rate: MOLD_RATE, cnc: !template.proto && !template.transfer, heat, mold: true, spec: { ...template } };
  }
  const qty = rint(template.qty[0], template.qty[1]);
  const stages = template.stages.map(([kind, label, min, perPiece]) => ({ kind, label, min: Math.round(min * (perPiece ? qty : 1)), done: false, out: null }));
  const minutes = stages.reduce((a, s) => a + s.min, 0);
  const material = Math.round(template.material * qty);
  const rate = template.cnc ? CNC_RATE : SHOP_RATE;
  const heat = stages.some((q) => q.kind === 'heat') ? HEAT_COST : 0;
  const estimate = Math.round((minutes / 60) * rate + material + heat);
  const expected = Math.round(estimate * customer.stingy * (0.92 + Math.random() * 0.16));
  const lead = rint(4, 9);
  return {
    id: state.nextRfq++, status: 'open', read: false, day: state.day, expires: state.day + 2,
    customer: customer.id, title: template.title, qty, steel: template.steel, items: [{ name: 'Part', stages }], jobStages: [], stages, minutes, material, estimate, expected, lead, price: estimate, rate, cnc: !!template.cnc, heat,
  };
}

function seedFirstDay(state) {
  // the first two RFQs: one you can do with a mill, a saw and a bench; one that needs a lathe.
  state.rfqs.push(makeRfq(state, TEMPLATES[2], CUSTOMERS[0]));
  state.rfqs.push(makeRfq(state, TEMPLATES[0], CUSTOMERS[1]));
  message(state, 'Rick (Northgate Plastics)', 'You open?', 'Heard you got a shop. Got a sprue bushing needs opening up. Will send a print when I find it. Rick');
}

export function customerOf(id) { return CUSTOMERS.find((c) => c.id === id); }

export function shopHas(state, kind, byId) { if (VENDOR_KINDS.has(kind) || kind === 'design') return true; if (kind === 'electrode') return state.machines.some((m) => m.placed && (byId(m.id).stations.includes('graphite') || byId(m.id).stations.includes('cnc'))); if (kind === 'fitspot') return state.machines.some((m) => m.placed && (byId(m.id).stations.includes('fit') || byId(m.id).stations.includes('spot'))); return state.machines.some((m) => m.placed && byId(m.id).stations.includes(stationKindToStation(kind))); }
// station names on machine defs vs. stage kinds
export function stationKindToStation(kind) { return { heat: 'heat', tryout: 'tryout', press: 'tryout', saw: 'saw', lathe: 'turn', mill: 'rough', drill: 'drill', grinder: 'grind', bench: 'fit', vmc: 'cnc', sinker: 'sinker', wire: 'wire', fitspot: 'fit', electrode: 'cnc', weld: 'weld', spot: 'spot', graphite: 'graphite', cmm: 'inspect', laser: 'weld' }[kind]; }

// the player sends a quote. decided the next morning.
export function sendQuote(state, rfq, price) { rfq.price = Math.round(price); rfq.status = 'quoted'; rfq.read = true; }
export function declineRfq(state, rfq) { rfq.status = 'declined'; rfq.read = true; }

export const RIVALS = ['Lakeshore Mold & Die', 'Durham Tool', 'a shop in Windsor nobody has heard of', 'Bramalea Moldworks', 'somebody\'s brother-in-law'];
export function memoryOf(state, cid) { const m = (state.memory || {})[cid] || { late: 0, onTime: 0, firstRight: 0 }; return m; }
export function winChance(state, rfq) {
  const c = customerOf(rfq.customer); const r = rfq.price / rfq.expected;
  let p = r <= 1 ? 0.8 + (1 - r) * 0.6 : 0.8 - (r - 1) * 2.2;
  p *= 0.7 + 0.6 * (state.rep - 0.5);
  const mem = memoryOf(state, c.id); p *= Math.max(0.6, Math.min(1.3, 1 + (mem.onTime + mem.firstRight - mem.late * 2) * 0.04)); // they remember
  return Math.max(0.02, Math.min(0.97, p));
}

export function startJob(state, rfq) {
  const c = customerOf(rfq.customer);
  const items = (rfq.items || [{ name: 'Part', stages: rfq.stages }]).map((it) => ({ name: it.name, stages: it.stages.map((q) => ({ ...q })) }));
  const job = {
    id: state.jobNo++, rfqId: rfq.id, customer: rfq.customer, title: rfq.title, qty: rfq.qty, steel: rfq.steel, mold: !!rfq.mold, spec: rfq.spec || null,
    items, jobStages: (rfq.jobStages || []).map((q) => ({ ...q })), price: rfq.price, material: rfq.material, minutes: rfq.minutes, cnc: !!rfq.cnc,
    poDay: state.day, dueDay: state.day + rfq.lead, materialDay: rfq.material > 0 ? state.day + 1 : state.day,
    status: rfq.material > 0 ? 'material' : 'work', shippedDay: null, scrap: 0, risk: 0, tryouts: 0, defects: [], program: !!rfq.program, estimate: rfq.estimate, heat: rfq.heat || 0,
  };
  state.jobs.push(job); if (rfq.program && state.program) state.program.jobs.push(job.id);
  // deposit: 50% on PO for component work; 30/30/40 on a mold (bible §7.5). steel goes out today.
  const deposit = Math.round(job.price * (job.mold ? 0.3 : 0.5));
  job.paid = deposit;
  post(state, `Deposit, ${c.name}, job ${job.id}`, deposit);
  const steel = job.mold ? job.spec.steelCost : job.material;
  if (steel > 0) post(state, `Steel for job ${job.id} (${job.steel})`, -steel);
  message(state, c.name, `PO ${job.id}: ${job.title}`, `Your quote of $${job.price.toLocaleString()} is accepted. Deposit of $${deposit.toLocaleString()} sent. We need it by day ${job.dueDay}.${job.mold ? ' Send us the design for approval when it is done, and sample parts after tryout.' : steel > 0 ? ' Steel is ordered; it will be on the rack tomorrow.' : ' Parts are on the way to you.'}`);
  return job;
}

// Every stage that could run right now on a station of this kind. An item's stages run in order;
// a mold's job-level stages wait for every item; design comes first on a mold.
export function runnableStages(state, kind) {
  const out = [];
  for (const job of state.jobs) {
    if (job.status !== 'work' && !(job.mold && job.status === 'material')) continue; // a mold can be designed while its steel is on a truck
    const designDone = !job.mold || job.jobStages[0].done;
    job.items.forEach((item, itemIndex) => {
      if (!designDone || job.status !== 'work') return;
      const i = item.stages.findIndex((q) => !q.done); if (i < 0) return;
      const q = item.stages[i];
      if (matches(q.kind, kind) && !q.out) out.push({ job, item, itemIndex, stage: q, index: i });
    });
    const itemsDone = job.items.every((it) => it.stages.every((q) => q.done));
    const j = job.jobStages.findIndex((q) => !q.done);
    if (j >= 0) { const q = job.jobStages[j]; const ready = q.kind === 'design' ? j === 0 || job.jobStages[j - 1].done : itemsDone && (j === 0 || job.jobStages[j - 1].done); if (ready && matches(q.kind, kind) && !q.out && !(job.mold && q.kind === 'fitspot' && !state.facility.crane)) out.push({ job, item: null, itemIndex: -1, stage: q, index: j }); }
  }
  return out;
}
export function stageAt(job, itemIndex, index) { return itemIndex >= 0 ? job.items[itemIndex].stages[index] : job.jobStages[index]; }
export function allDone(job) { return job.items.every((it) => it.stages.every((q) => q.done)) && job.jobStages.every((q) => q.done); }
export function nextLabel(job) {
  if (job.mold && !job.jobStages[0].done) return 'mold design';
  const open = job.items.map((it) => { const q = it.stages.find((x) => !x.done); return q ? `${it.name}: ${q.label.toLowerCase()}` : null; }).filter(Boolean);
  if (open.length) return open.join(' · ');
  const q = job.jobStages.find((x) => !x.done); return q ? q.label.toLowerCase() : 'ship it';
}

export function stageDone(state, job, itemIndex, index) {
  const q = stageAt(job, itemIndex, index); if (!q) return false;
  q.done = true;
  if (allDone(job)) { job.status = 'ready'; state.crates++; if (!job.mold && job.hiddenOut == null) job.hiddenOut = Math.random() < 0.07 * (state.machines.some((m) => m.placed && m.bumped) ? 2.5 : 1) * (job.cnc ? 1.4 : 1); return true; }
  return false;
}

// ---- cutting corners (bible §12.2). the game lets you. the game remembers.
export const CHEAP_STEELS = { P20: '1045', H13: '4140', S7: 'something from the rack', 'NAP80': 'P20, pre-hard', '420 SS': '420 from the other place', 4140: '1018', 'D2': 'A2' };
export function canCheapSteel(job) { return job.status === 'material' && !job.cheap && !!CHEAP_STEELS[job.steel] && !(job.spec && job.spec.transfer); }
export function cheapSteel(state, job) {
  if (!canCheapSteel(job)) return { ok: false };
  const steel = job.mold ? job.spec.steelCost : job.material; const back = Math.round(steel * 0.45);
  job.cheap = true; job.realSteel = job.steel; job.steelUsed = CHEAP_STEELS[job.steel];
  post(state, `Steel for job ${job.id}: credit, ${job.steelUsed} instead`, back);
  return { ok: true, back, used: job.steelUsed };
}
export function canInspect(state, job, byId) { return job.status === 'ready' && !job.mold && !job.inspected && state.machines.some((m) => m.placed && !m.down && byId(m.id).stations.includes('inspect')); }
export function inspect(state, job) {
  if (job.status !== 'ready' || job.inspected) return { ok: false };
  job.inspected = true; state.t += 20; // twenty minutes on the CMM. the CMM does not hurry.
  if (job.hiddenOut && Math.random() < 0.85) {
    job.hiddenOut = false; job.status = 'work'; state.crates = Math.max(0, state.crates - 1);
    job.items[0].stages.push({ kind: job.cnc ? 'vmc' : 'mill', label: 'Re-cut to size (the CMM said so)', min: 60, done: false, out: null });
    return { ok: true, found: true };
  }
  return { ok: true, found: false };
}
export function canShipEarly(job) { return job.mold && job.status === 'work' && job.tryouts >= 1 && job.items.every((it) => it.stages.every((q) => q.done)) && job.jobStages.some((q) => !q.done); }
export function shipEarly(state, job) {
  if (!canShipEarly(job)) return { ok: false };
  const skipped = job.jobStages.filter((q) => !q.done); for (const q of skipped) { q.done = true; q.skipped = true; }
  job.shippedEarly = true; job.status = 'ready'; state.crates++;
  return { ok: true, skipped: skipped.length };
}

// a scrapped item: its steel is gone, its stages start over. on a component job, that is the job.
export function scrapJob(state, job, itemIndex = 0) {
  job.scrap++; state.scrapCount++; tally(state, 'crashes'); job.risk = (job.risk || 0) + 0.03;
  const item = job.items[Math.max(0, itemIndex)] || job.items[0];
  for (const q of item.stages) { if (q.kind === 'base' || q.kind === 'manifold') continue; q.done = false; q.out = null; }
  const steel = job.mold ? Math.round(job.spec.steelCost / Math.max(1, job.items.length - 1)) : job.material;
  if (steel > 0) { post(state, `Steel again for job ${job.id}, ${item.name.toLowerCase()}`, -steel); if (!job.mold) { job.materialDay = state.day + 1; job.status = 'material'; } }
}

// send a stage out to the shop down the road
export function sendOut(state, job, itemIndex, index) {
  const q = stageAt(job, itemIndex, index);
  const cost = q.kind === 'design' ? DESIGN_OUT : Math.round((q.min / 60) * OUT_RATE) + 40;
  if (state.cash < cost) return { ok: false, why: 'not enough cash' };
  post(state, `${q.kind === 'design' ? 'Contract designer' : 'Bramalea Moldworks'}: ${q.label.toLowerCase()}, job ${job.id}`, -cost);
  q.out = { backDay: state.day + (q.kind === 'design' ? 3 : OUT_DAYS), cost };
  return { ok: true, cost };
}

// ---- tryout. the risk the build carried comes due on the press.
const DEFECTS = [
  ['Flash', 'thin fins on the parting line, like pie crust', 'fit', 'Spot the parting line again', 90, 1.0],
  ['Short shot', 'a part missing a corner', 'fit', 'Vent the cavity', 40, 0.7],
  ['Sink marks', 'dimples where the ribs are', 'design', 'Rework the ribs', 60, 0.4],
  ['Stuck part', 'a part still in the cavity, and drag marks down the side', 'polish', 'Polish in the draw direction', 120, 0.9],
  ['Ejector pin marks', 'little circles pushed through', 'fit', 'Trim the pins', 30, 0.6],
  ['Water leak', 'a puddle under the mold', 'assemble', 'Replace the O-rings', 25, 0.5],
  ['Dimension out', 'the CMM report with a red line', 'finish', 'Re-cut the cavity to size', 150, 0.6],
  ['Burn marks', 'brown edges where the air could not get out', 'fit', 'Add vents', 35, 0.5],
  ['Slide hang-up', 'the press alarm, a scratch, a sweating moldmaker', 'slide', 'Fit the slide again', 90, 0.8],
];
export function resolveTryout(state, job, byId) {
  job.tryouts++;
  const spec = job.spec || {}, c = customerOf(job.customer);
  const hasCmm = byId && state.machines.some((m) => m.placed && byId(m.id).stations.includes('inspect'));
  const base = 0.12 + (job.risk || 0) + (spec.slides || 0) * 0.08 + (spec.finish && spec.finish.startsWith('A') ? 0.1 : 0) + (job.tryouts > 1 ? -0.15 : 0);
  const found = [];
  for (const d of DEFECTS) {
    if (d[2] === 'slide' && !(spec.slides > 0)) continue;
    let w = d[5]; if (d[0] === 'Dimension out' && hasCmm) w *= 0.3; if (d[0] === 'Dimension out' && state.machines.some((m) => m.placed && m.bumped)) w *= 2.5; if (d[0] === 'Flash' && job.spotted) w *= 0.4; if (d[0] === 'Stuck part' && job.rushedPolish) w *= 2.2;
    if (Math.random() < Math.max(0.02, base * w)) found.push(d);
  }
  const notes = [];
  job.defects = found.map((d) => d[0]);
  if (!found.length) {
    notes.push(`T${job.tryouts} on job ${job.id}: sample parts look good. ${c.name} approved it.`);
    message(state, c.name, `T${job.tryouts} approved: ${job.title}`, job.tryouts === 1 ? 'The parts look great. No notes. We did not expect no notes.' : 'Parts approved. Thank you for sticking with it.');
    job.risk = 0; return notes;
  }
  // every defect adds a revision stage; then another tryout
  const fixes = found.map((d) => {
    const kind = d[2] === 'finish' ? 'vmc' : d[2] === 'design' ? 'design' : 'bench';
    return st(kind, `${d[0]}: ${d[3].toLowerCase()}`, d[4]);
  });
  job.jobStages.push(...fixes, st('tryout', `Tryout T${job.tryouts + 1}`, 0));
  job.risk = Math.max(0, (job.risk || 0) - 0.08);
  notes.push(`T${job.tryouts} on job ${job.id}: ${found.map((d) => d[0].toLowerCase()).join(', ')}. Back to the bench.`);
  message(state, c.name, `T${job.tryouts} samples: ${job.title}`, `Samples on the bench: ${found.map((d) => d[1]).join('; ')}. ${found.length > 2 ? 'This is a lot of notes.' : 'Fix and resample, please.'} ${job.tryouts >= 2 ? 'We would like to talk about the schedule.' : ''}`);
  return notes;
}

// a job-level or item stage that a vendor does, kicked off automatically when it comes up
// the CMM, at the end of the day, says what nobody noticed: a machine was bumped and is out
export function cmmReport(state, byId) {
  const hasCmm = state.machines.some((m) => m.placed && !m.down && byId(m.id).stations.includes('inspect'));
  const out = [];
  for (const m of state.machines) if (m.placed && m.bumped && !m.found && (hasCmm ? Math.random() < 0.7 : Math.random() < 0.06)) { const d = byId(m.id); out.push(`${hasCmm ? 'CMM report' : 'A part came back'}: the ${d.name.toLowerCase()} is out by two thou. Somebody bumped it and said nothing. Re-indicate it: a service, or a whack with the dead-blow if you are lucky.`); m.found = true; }
  return out;
}
function vendorOut(state, job, q, itemName) {
  if (q.kind === 'heat') { post(state, `Quench & Sons: heat treat, job ${job.id}${itemName ? ', ' + itemName.toLowerCase() : ''}`, -HEAT_COST); q.out = { backDay: state.day + 2, cost: HEAT_COST, heat: true }; return `Job ${job.id}${itemName ? ' ' + itemName.toLowerCase() : ''} went to Quench & Sons. Back in two days, probably in one piece.`; }
  if (q.kind === 'base') { const cost = job.spec.base; post(state, `DMV mold base, job ${job.id}`, -cost); q.out = { backDay: state.day + BASE_DAYS, cost }; return `Mold base for job ${job.id} ordered from DMV. Take a number. ${BASE_DAYS} days.`; }
  if (q.kind === 'manifold') { const cost = job.spec.manifold; post(state, `Mould-Majors hot runner, job ${job.id}`, -cost); q.out = { backDay: state.day + 12, cost }; return `Hot runner for job ${job.id} ordered. Twelve days, they say. They always say twelve.`; }
  if (q.kind === 'tryout') { const cost = 200 * (4 + (job.spec.cav || 1)); post(state, `Press time, Northgate Plastics, job ${job.id}`, -cost); q.out = { backDay: state.day + TRYOUT_DAYS, cost, tryout: true }; return `Job ${job.id} is on a truck to the molder for tryout. $${cost.toLocaleString()} of press time. Two days.`; }
  return null;
}

export function ship(state, job) {
  if (job.status !== 'ready') return null;
  const c = customerOf(job.customer);
  job.status = 'shipped'; job.shippedDay = state.day; state.crates = Math.max(0, state.crates - 1);
  const late = Math.max(0, state.day - job.dueDay);
  let balance = job.price - (job.paid || Math.round(job.price * 0.5));
  let note = '';
  tally(state, late > 0 ? 'late' : 'onTime');
  state.memory = state.memory || {}; const mem = state.memory[c.id] = state.memory[c.id] || { late: 0, onTime: 0, firstRight: 0 }; if (late > 0) mem.late++; else mem.onTime++; if (job.mold && job.tryouts === 1 && !job.defects.length) mem.firstRight++;
  if (late > 0) { const pen = Math.round(job.price * Math.min(0.3, 0.05 * late)); balance -= pen; note = ` ${late} day${late === 1 ? '' : 's'} late. They knocked $${pen.toLocaleString()} off and will remember.`; state.rep = Math.max(0, state.rep - 0.08); }
  else { state.rep = Math.min(1, state.rep + (job.mold ? 0.1 : 0.04)); }
  if (job.mold && job.tryouts === 1 && !job.defects.length) state.firstTimeRight = (state.firstTimeRight || 0) + 1;
  if (job.shippedEarly) job.publicTryout = state.day + 3 + Math.floor(Math.random() * 3);
  if (!job.mold && job.hiddenOut && !job.inspected) job.foundAtCustomer = state.day + 2 + Math.floor(Math.random() * 4);
  if (job.cheap) job.wearDay = state.day + (job.mold ? 25 + Math.floor(Math.random() * 30) : Math.random() < 0.35 ? 5 + Math.floor(Math.random() * 6) : null); if (job.wearDay === null) delete job.wearDay;
  // quote badly wrong: the real number next to the quoted one, in a frame
  if (job.estimate) { const actual = Math.round(job.estimate + job.scrap * (job.mold ? job.spec.steelCost : job.material) * 1.5 + Math.max(0, job.tryouts - 1) * 400 + (late > 0 ? late * 60 : 0)); if (job.price < actual * 0.78) { state.framed = { quote: job.price, actual, title: job.title, day: state.day }; note += ` The margin on this one was ${Math.round((job.price / actual - 1) * 100)}%. The estimate sheet is going in a frame.`; } }
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
    else { if (r.program && state.program && !state.program.finished) { state.program.finished = true; message(state, c.name, 'The program', 'One of the three went elsewhere, so the set is off. One at a time from here, like everybody else.'); }
      r.status = 'lost'; const rival = RIVALS[Math.floor(Math.random() * RIVALS.length)], at = Math.round(r.expected * (0.82 + Math.random() * 0.16) / 10) * 10; state.lostTo = state.lostTo || {}; state.lostTo[rival] = (state.lostTo[rival] || 0) + 1; message(state, c.name, `Re: quote, ${r.title}`, `${rival} had it at about $${at.toLocaleString()}. ` + pick(['Thanks for the quote. We went another way.', 'We will keep you in mind for the next one.', 'A bit rich for us this time.', 'Our guy had a slot open. Next time.'])); notes.push(`Lost the ${r.title} to somebody cheaper.`); }
  }
  // expiry
  for (const r of state.rfqs) if (r.status === 'open' && state.day >= r.expires) { r.status = 'expired'; }
  state.rfqs = state.rfqs.filter((r) => r.status === 'open' || r.status === 'quoted' || state.day - r.day < 6);
  // steel and outsourced work; vendor stages go out by themselves the night they come up
  for (const job of state.jobs) {
    if (job.status === 'material' && state.day >= job.materialDay && !job.truck) { job.truck = true; notes.push(`Steel for job ${job.id} is on the truck. It will be at the door at seven. Somebody has to sign for it.`); }
    if (job.status === 'work') {
      // anything a vendor does, kick off
      const designDone = !job.mold || job.jobStages[0].done;
      job.items.forEach((item) => { const i = item.stages.findIndex((q) => !q.done); const q = item.stages[i]; if (q && VENDOR_KINDS.has(q.kind) && !q.out && !inHouse(state, q.kind, byId) && (designDone || q.kind === 'base' || q.kind === 'manifold')) { const n = vendorOut(state, job, q, item.name); if (n) notes.push(n); } });
      const itemsDone = job.items.every((it) => it.stages.every((q) => q.done));
      const j = job.jobStages.findIndex((q) => !q.done); const jq = job.jobStages[j];
      if (jq && VENDOR_KINDS.has(jq.kind) && !jq.out && !inHouse(state, jq.kind, byId) && itemsDone && (j === 0 || job.jobStages[j - 1].done)) { const n = vendorOut(state, job, jq, null); if (n) notes.push(n); }
      // no crane: a real mold cannot be fitted here. it goes to Bramalea on a flatbed, with riggers at both ends.
      if (jq && job.mold && jq.kind === 'fitspot' && !jq.out && itemsDone && (j === 0 || job.jobStages[j - 1].done) && !state.facility.crane) { const cost = Math.round((jq.min / 60) * OUT_RATE) + 900; post(state, `Bramalea Moldworks: fit and spot, job ${job.id}, plus riggers`, -cost); jq.out = { backDay: state.day + 4, cost }; job.risk = (job.risk || 0) + 0.05; notes.push(`No crane. Job ${job.id} went to Bramalea on a flatbed for fit and spot. $${cost.toLocaleString()}, four days, and their guy's idea of a parting line.`); }
      // things coming back
      const all = job.items.flatMap((it, ii) => it.stages.map((q) => ({ q, item: it, ii }))).concat(job.jobStages.map((q) => ({ q, item: null, ii: -1 })));
      for (const { q, item, ii } of all) if (q.out && !q.done && state.day >= q.out.backDay) {
        if (q.out.heat && Math.random() < 0.04) { q.out = null; scrapJob(state, job, Math.max(0, ii)); notes.push(`Job ${job.id}${item ? ' ' + item.name.toLowerCase() : ''} came back from heat treat in two pieces, in the same crate, with an invoice. Start over.`); continue; }
        const was = q.out; q.out = null; q.done = true;
        if (was.tryout) notes.push(...afterTryout(state, job, byId));
        else notes.push(`Job ${job.id}: ${q.label.toLowerCase()}${item ? ' (' + item.name.toLowerCase() + ')' : ''} back from ${was.heat ? 'Quench & Sons' : q.kind === 'base' ? 'DMV' : q.kind === 'manifold' ? 'Mould-Majors' : q.kind === 'design' ? 'the designer' : 'Bramalea'}.`);
        if (allDone(job)) { job.status = 'ready'; state.crates++; notes.push(`Job ${job.id} is done. Ship it.`); }
      }
    }
    if (job.status === 'work' && state.day === job.dueDay) notes.push(`Job ${job.id} is due today.`);
  }
  // money in
  for (const rcv of state.receivables.slice()) if (state.day >= rcv.due) { post(state, rcv.text, rcv.amount); state.receivables.splice(state.receivables.indexOf(rcv), 1); notes.push(`Paid: ${rcv.text}, $${rcv.amount.toLocaleString()}.`); }
  // new work. reputation sets how often the phone rings.
  const hasCnc = state.machines.some((m) => m.placed && byId(m.id).cnc);
  const n = (Math.random() < 0.35 + state.rep * 0.5 ? 1 : 0) + (hasCnc && Math.random() < 0.4 ? 1 : 0) + (hasEstimator(state) && Math.random() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const hasLaser = state.machines.some((m) => m.placed && byId(m.id).stations.includes('weld'));
    const hasFive = state.machines.some((m) => m.placed && byId(m.id).five);
    const sour = state.sour || {};
    const custs = CUSTOMERS.filter((c) => (!c.cnc || hasCnc) && (!c.five || hasFive) && !(sour[c.id] > state.day)), temps = TEMPLATES.filter((t) => !t.cnc || hasCnc).filter((t) => !t.mold || t.proto || t.transfer || (hasCnc && state.rep >= 0.5)).filter((t) => !t.weld || hasLaser).filter((t) => !t.five || hasFive).filter((t) => !t.transfer || state.rep >= 0.4);
    const c = pick(custs), t = c.five ? pick(temps.filter((q) => q.five)) : c.cnc ? pick(temps.filter((q) => q.cnc && !q.five)) : pick(temps.filter((q) => (!q.mold || q.proto || q.transfer) && !q.five));
    const r = makeRfq(state, t, c); state.rfqs.push(r); notes.push(`RFQ from ${c.name}: ${t.title}.`);
  }
  return notes;
}

// ---- the schedule board. a projection, not a promise: every live job's remaining stages laid on the stations
// the shop has, in due-date order, one shift a day, vendors at their usual lead times. the whiteboard, with columns.
const VENDOR_DAYS = { heat: 2, base: 5, manifold: 7, tryout: 3, design: 3 };
export function nextWorkDay(d) { return (d - 1) % 7 === 4 ? d + 3 : d + 1; }
export function schedule(state, byId, days = 10) {
  const cols = []; let d = state.day; for (let i = 0; i < days; i++) { cols.push(d); d = nextWorkDay(d); }
  const idx = (day) => cols.indexOf(day);
  // lanes: one per placed machine, keyed by the station kind it serves; vendors and the PC get one lane each
  const lanes = [];
  for (const m of state.machines) if (m.placed && !m.down) { const dk = byId(m.id); lanes.push({ name: `${dk.name}${state.machines.filter((q) => q.placed && q.id === m.id).length > 1 ? ' #' + m.uid : ''}`, kind: dk.kind, free: 0, cells: [] }); }
  for (const k of ['design', 'base', 'manifold', 'heat', 'tryout']) lanes.push({ name: stationName(k), kind: k, vendor: true, free: 0, cells: [] });
  const laneFor = (stageKind, from) => {
    const fit = lanes.filter((l) => l.vendor ? l.kind === stageKind && !inHouse(state, stageKind, byId) : matches(stageKind, l.kind));
    if (!fit.length) return null;
    return fit.reduce((a, l) => (Math.max(l.free, from) < Math.max(a.free, from) ? l : a), fit[0]);
  };
  const live = state.jobs.filter((j) => j.status === 'work' || j.status === 'material').slice().sort((a, b) => a.dueDay - b.dueDay);
  const summary = [];
  for (const j of live) {
    const place = (q, from) => { // returns the column index the stage ends on
      const lane = laneFor(q.kind, from); const len = q.out ? Math.max(1, q.out.backDay - state.day) : VENDOR_DAYS[q.kind] && !inHouse(state, q.kind, byId) ? VENDOR_DAYS[q.kind] : Math.max(1, Math.ceil((q.min || 60) / 420));
      if (!lane) return { end: from + len, missing: true };
      const start = Math.max(lane.free, from); for (let c = start; c < start + len; c++) lane.cells.push({ c, j: j.id, label: q.label });
      lane.free = start + len; return { end: start + len };
    };
    let t0 = 0, missing = false; const designDone = !j.mold || j.jobStages[0].done;
    if (j.mold && !designDone) { const r = place(j.jobStages[0], 0); t0 = r.end; }
    if (j.status === 'material' && j.materialDay > state.day) t0 = Math.max(t0, j.materialDay - state.day);
    let itemsEnd = t0;
    for (const it of j.items) { let t = t0; for (const q of it.stages) { if (q.done) continue; const r = place(q, t); t = r.end; missing = missing || !!r.missing; } itemsEnd = Math.max(itemsEnd, t); }
    let t = itemsEnd; j.jobStages.forEach((q, i) => { if (q.done || (j.mold && i === 0)) return; const r = place(q, t); t = r.end; missing = missing || !!r.missing; });
    const endDay = cols[Math.min(t, cols.length - 1)] + (t >= cols.length ? (t - cols.length + 1) * 1.4 : 0);
    summary.push({ id: j.id, title: j.title, due: j.dueDay, end: t, endDay: Math.round(endDay), late: Math.round(endDay) > j.dueDay, missing, beyond: t > cols.length });
  }
  return { cols, lanes: lanes.filter((l) => l.cells.length), summary };
}

// what is in the crate. always something.
export const SURPRISES = [
  { text: 'A cracked cavity. Somebody ran it with a stuck part and kept going.', stage: (laser) => laser ? st('weld', 'Weld the crack and blend it', 90) : st('bench', 'Peen, fill and blend the crack', 180) },
  { text: 'One slide missing. Not in the crate, not in the truck, not in their shop.', stage: () => st('mill', 'Make a new slide from nothing', 240) },
  { text: 'Half the ejector pins are bent. The other half are the wrong length.', stage: () => st('bench', 'Replace every pin', 90) },
  { text: 'A mouse. A dead one, and its house, in the water manifold.', stage: () => st('bench', 'The mouse, the house, and a lot of bleach', 30), morale: -0.03 },
  { text: 'Rust. The whole parting line. It sat outside for a winter and then some.', stage: () => st('bench', 'Stone the rust off the parting line', 150) },
  { text: 'Somebody welded the cooling lines shut. On purpose, it looks like.', stage: () => st('drill', 'Re-drill the water', 90) },
];
export function openCrate(state, job, laser) {
  const sp = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
  const crate = job.items[0]; crate.stages.push(sp.stage(laser));
  if (sp.morale) for (const p of state.people) p.morale = Math.max(0, p.morale + sp.morale);
  job.price += 400; job.dueDay += 1;
  message(state, customerOf(job.customer).name, 'Re: the crate', `${sp.text} We did not know. We would like it noted that we did not know. Add it to the invoice.`);
  return sp.text;
}
