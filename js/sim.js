// The simulation. No three.js in here: this is the shop as numbers.
// Time is minute for minute: a shop minute is a real minute at 1x. The day opens at 7:00 and
// closes at 17:00; you can stay late until 23:00, and then you go home whether you like it or not.
// Monday is day 1.

import { byId, SHOP, BUILDINGS, UPGRADES, SOFTWARE } from './catalog.js';
import { initJobs, endOfDay } from './jobs.js';
import { initPeople, endOfDay as peopleEndOfDay } from './people.js';
import { nightlyEvents, yearSummary } from './events.js';

export const SAVE_KEY = 'shopsim.save.v1';
export const OPEN_HOUR = 7;
export const CLOSE_MIN = 600;    // 17:00, in minutes after opening
export const HARD_STOP_MIN = 960; // 23:00. nobody is any good after this.
export const END_DAY_SPEED = 60;  // END DAY runs a shop minute per real second
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RENT_WEEKLY = 850;      // the small unit; the big one is in BUILDINGS
export function building(state) { return BUILDINGS[state.building || 'small']; }
const POWER_WEEKLY_BASE = 200; // the lights and the compressor
const POWER_PER_MACHINE = 60;

export function newState(shopName) {
  const params = new URLSearchParams(location.search);
  return {
    v: 1,
    shopName,
    cash: Math.max(0, parseFloat(params.get('cash')) || 50000),
    day: Math.max(1, parseInt(params.get('day')) || 1),
    t: 0,              // shop minutes since 7:00
    speed: 1,          // 0 paused, 1, 2, 3, or END_DAY_SPEED
    closingShown: false,
    fatigue: 0,        // 0 rested .. 1 wrecked. set by how much sleep you got.
    lastSleep: 10,
    machines: [],      // { uid, id, x, z, rot, used, condition, hours, running, checklist }
    nextUid: 1,
    ledger: [{ day: 1, text: 'Opening balance', amount: 0 }],
    stats: { cycleStarts: 0, skipped: 0, bought: 0, shipped: 0 },
    firstCycle: false,
    facility: { circuits: SHOP.powerSlots, air: SHOP.airSlots, door: false, fire: false, toolbreak: false, dust: false, pending: [] },
    software: { cad: null, cam: null, pirated: false, auditDay: null, camDownUntil: 0 },
    loans: [],
    achievements: [],
  };
}
function upgradeState(s) {
  if (!s.facility) s.facility = { circuits: SHOP.powerSlots, air: SHOP.airSlots, door: false, fire: false, toolbreak: false, dust: false, pending: [] };
  if (!s.software) s.software = { cad: null, cam: null, pirated: false, auditDay: null, camDownUntil: 0 };
  if (!s.loans) s.loans = [];
  if (!s.achievements) s.achievements = [];
  if (!s.stats.shipped) s.stats.shipped = 0;
  if (!s.yr) s.yr = { hired: 0, left: 0, onTime: 0, late: 0, crashes: 0, wsib: 0 };
  for (const m of s.machines) { if (m.oil == null) m.oil = 1; if (m.down === undefined) m.down = null; m.alarm = false; m.estopped = false; m.fire = false; }
  if (s.redDays == null) s.redDays = 0;
}
// the running tally for the year-end summary. reset when the year turns.
export function tally(state, key, n = 1) { if (!state.yr) state.yr = { hired: 0, left: 0, onTime: 0, late: 0, crashes: 0, wsib: 0 }; state.yr[key] = (state.yr[key] || 0) + n; }
export const RETIRE_DAY = 10 * 260 + 1; // ten years of 52 five-day weeks
export function canRetire(state) { return state.day >= RETIRE_DAY; }
// what the shop is worth, the way the accountant would say it: cash, the iron at used prices, what is owed
// to you, half of what is still to be billed on the floor, less what the bank is owed. that is the score.
export function valuation(state) {
  const machines = state.machines.reduce((a, m) => { const d = byId(m.id); return a + Math.round((m.used ? d.priceUsed : d.priceNew) * 0.6 * (0.5 + 0.5 * m.condition)); }, 0);
  const receivables = (state.receivables || []).reduce((a, r) => a + r.amount, 0);
  const backlog = state.jobs.filter((j) => j.status !== 'shipped' && j.status !== 'dead' && j.status !== 'scrapped').reduce((a, j) => a + Math.round((j.price - (j.paid || 0)) * 0.5), 0);
  const debt = state.loans.reduce((a, l) => a + l.balance, 0);
  const building = state.building === 'large' ? 0 : 0; // rented. the landlord has the valuation on the building.
  return { cash: state.cash, machines, receivables, backlog, debt, building, total: state.cash + machines + receivables + backlog - debt };
}
export function fresh(shopName) {
  const s = newState(shopName); initJobs(s); initPeople(s);
  // the wall comes with you from the shop you sold
  try { const wall = JSON.parse(localStorage.getItem('shopsim.wall') || '[]'); if (Array.isArray(wall)) for (const id of wall) if (ACHIEVEMENTS[id] && !s.achievements.includes(id)) s.achievements.push(id); } catch (e) { /* fine */ }
  return s;
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return null;
    upgradeState(s); initJobs(s); initPeople(s);
    return s;
  } catch (e) { return null; }
}

export function save(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* fine */ } }

export function dayName(day) { return DAYS[(day - 1) % 7]; }

export function hourText(mins) {
  const h = OPEN_HOUR + Math.floor(mins / 60), m = Math.floor(mins % 60);
  return `${h % 24}:${m < 10 ? '0' : ''}${m}`;
}
export function clockText(state) { return `Day ${state.day} \u00b7 ${dayName(state.day)} ${hourText(state.t)}`; }
export function afterHours(state) { return state.t >= CLOSE_MIN; }
export function fatigueText(f) { return f >= 0.6 ? 'EXHAUSTED' : f >= 0.25 ? 'TIRED' : ''; }

export function money(n) {
  const neg = n < 0; n = Math.abs(n);
  const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-$' : '$') + s;
}

export function post(state, text, amount) {
  state.cash += amount;
  state.ledger.push({ day: state.day, text, amount });
  if (state.ledger.length > 200) state.ledger.splice(1, state.ledger.length - 200);
}

export function poweredCount(state) { return state.machines.reduce((a, m) => a + byId(m.id).power, 0); }
export function airCount(state) { return state.machines.filter((m) => byId(m.id).air).length; }
export function circuits(state) { return state.facility ? state.facility.circuits : SHOP.powerSlots; }
export function airSlots(state) { return state.facility ? state.facility.air : SHOP.airSlots; }
export function canPower(state, def) { return def.power === 0 || poweredCount(state) + def.power <= circuits(state); }
export function canAir(state, def) { return !def.air || airCount(state) < airSlots(state); }
export function whyNot(state, def) {
  if (!canPower(state, def)) return `the panel has ${circuits(state) - poweredCount(state)} circuit${circuits(state) - poweredCount(state) === 1 ? '' : 's'} free and this needs ${def.power}`;
  if (!canAir(state, def)) return 'the compressor cannot feed another machine';
  if (def.cnc && !hasCam(state)) return 'you have no CAM software to program it';
  return null;
}
export function hasCam(state) { const sw = state.software; return !!(sw && sw.cam && state.day >= (sw.camDownUntil || 0)); }
export function hasCad(state) { const sw = state.software; return !!(sw && sw.cad); }
export function camFactor(state) { const sw = SOFTWARE.find((x) => x.id === (state.software && state.software.cam)); return sw ? (sw.slow || sw.fast || 1) : 1; }

// ---- facility upgrades
export function buyUpgrade(state, up) {
  const f = state.facility;
  if (up.needs && !f.done?.includes(up.needs)) return { ok: false, why: 'needs ' + UPGRADES.find((u) => u.id === up.needs).name };
  if (f.pending.some((p) => p.id === up.id) || (f.done || []).includes(up.id)) return { ok: false, why: 'already' };
  if (state.cash < up.price) return { ok: false, why: 'not enough cash' };
  post(state, up.name, -up.price);
  f.pending.push({ id: up.id, day: state.day + up.days });
  return { ok: true };
}
export function upgradeDue(state) { // called at end of day
  const f = state.facility, notes = [];
  if (!f.done) f.done = [];
  for (const p of f.pending.slice()) if (state.day >= p.day) {
    const up = UPGRADES.find((u) => u.id === p.id); f.done.push(p.id); f.pending.splice(f.pending.indexOf(p), 1);
    if (up.gives.building) {
      // moving day. everything is on trucks. the new place comes with more service than the old one.
      state.building = up.gives.building; const b = BUILDINGS[state.building];
      f.circuits = Math.max(f.circuits, b.powerSlots); f.air = Math.max(f.air, b.airSlots); f.door = true;
      for (const m of state.machines) { m.placed = false; m.running = false; m.runLeft = 0; m.job = null; m.checklist = {}; }
      state.crates = state.crates; state.moved = true; state.pc = null;
      for (const q of state.people) q.morale = Math.min(1, q.morale + 0.1);
      achieve(state, 'moved');
      notes.push(`MOVING DAY. ${b.name}. Everything is on the floor by the doors, in the order it came off the trucks. Place it all again. The crew carried things all weekend and would like that noted.`);
      continue;
    }
    Object.assign(f, up.gives);
    if (up.gives.crane) achieve(state, 'the_crane'); if (up.gives.circuits === 4) achieve(state, 'panel');
    notes.push(`${up.name}: done. ${up.group === 'power' ? 'The electrician left a bill and a sticker.' : up.group === 'door' ? 'The tarp is in the dumpster. Somebody took a photo.' : up.group === 'crane' ? 'The crane is up. Everyone stopped to watch the first lift. It lifted a chair.' : 'Installed.'}`);
  }
  return notes;
}

// ---- software
export function buySoftware(state, sw) {
  const s = state.software;
  if (state.cash < sw.price) return { ok: false, why: 'not enough cash' };
  if (sw.price) post(state, `${sw.name} seat`, -sw.price);
  if (sw.kind === 'cad' || sw.kind === 'both') s.cad = sw.id;
  if (sw.kind === 'cam' || sw.kind === 'both') { s.cam = sw.id; s.camDownUntil = 0; }
  s.pirated = (s.cad === 'katya_ce') || (s.cam === 'katya_ce');
  return { ok: true };
}
export function softwareWeekly(state) { let t = 0; for (const id of [state.software.cad, state.software.cam]) { const sw = SOFTWARE.find((x) => x.id === id); if (sw && sw.weekly) t += sw.weekly; } return state.software.cad && state.software.cad === state.software.cam ? t / 2 : t; }

// ---- maintenance. money fixes anything. a little money band-aids it.
export const BREAKDOWNS = [
  'the spindle bearing is singing', 'the way lube pump quit', 'the Z axis lost its mind', 'the control shows an error in a language nobody here reads',
  'a coolant line let go, inside the cabinet', 'the tool changer dropped a tool and will not say where', 'something in the gearbox went BANG', 'the DRO reads in a unit of its own',
];
export function techFor(def) { // who you call, how long, how much
  const price = def.priceNew || 1000;
  return def.cheap ? { who: 'the dealer\'s tech, who is also the dealer', days: 2 + Math.floor(Math.random() * 3), cost: Math.max(300, Math.round(price * 0.015)), parts: 'Parts are coming from somewhere. They did not say where.' }
    : { who: 'a factory tech', days: 1, cost: Math.max(450, Math.round(price * 0.03)), parts: 'Parts are on the truck. The tech is on the plane.' };
}
export function serviceCost(def) { return Math.max(150, Math.round((def.priceNew || 1000) * 0.012)); }
export function maintain(state, m, what) {
  const def = byId(m.id);
  if (m.running) return { ok: false, why: 'it is running' };
  if (what === 'oil') { if (state.cash < 40) return { ok: false, why: 'no money for oil' }; post(state, `Way oil, ${def.name}`, -40); m.oil = 1; m.dryWarned = false; state.t = Math.min(HARD_STOP_MIN, state.t + 8); return { ok: true, note: 'Topped up. Eight minutes and a rag.' }; }
  if (what === 'service') {
    const c = serviceCost(def); if (state.cash < c) return { ok: false, why: `${money(c)} for a service. You have ${money(state.cash)}.` };
    post(state, `Service, ${def.name}`, -c); m.oil = 1; m.dryWarned = false; m.taped = false; m.condition = Math.min(0.97, m.condition + 0.15); m.down = { why: 'being serviced', until: state.day + 1, kind: 'service' }; m.job = null; m.checklist = {};
    return { ok: true, note: `Serviced. ${money(c)}. It is down until tomorrow; the tech found two other things and fixed one.` };
  }
  if (what === 'tech') {
    if (!m.down) return { ok: false, why: 'nothing wrong with it. yet.' };
    const t = techFor(def); if (state.cash < t.cost) return { ok: false, why: `${money(t.cost)} for the tech. You have ${money(state.cash)}.` };
    post(state, `Tech visit, ${def.name}`, -t.cost); m.down = { ...m.down, kind: 'tech', until: state.day + t.days, who: t.who };
    return { ok: true, note: `Called ${t.who}. ${money(t.cost)}. ${t.parts} Back in ${t.days} day${t.days === 1 ? '' : 's'}.` };
  }
  if (what === 'tape') {
    if (!m.down) return { ok: false, why: 'nothing to tape' };
    if (state.cash < 60) return { ok: false, why: 'no money for tape' };
    post(state, `Duct tape and a prayer, ${def.name}`, -60); m.down = null; m.taped = true; m.condition = Math.max(0, m.condition - 0.05);
    return { ok: true, note: 'Taped. It runs. It is louder. The next crash is on you.' };
  }
  return { ok: false };
}
// overnight: the tired machines break, the techs arrive, the bank counts
export function overnightMachines(state) {
  const notes = [];
  for (const m of state.machines) {
    const def = byId(m.id);
    if (m.down && m.down.until != null && state.day >= m.down.until) { const wasService = m.down.kind === 'service'; m.down = null; notes.push(`${def.brand} ${def.name}: back up. ${wasService ? 'Serviced, oiled, and the tech wrote "call me" on the invoice.' : def.cheap ? 'The tech left a part on the floor. It is probably a spare.' : 'The tech left a sticker and an invoice for the mileage.'}`); continue; }
    if (m.down || !m.placed) continue;
    const p = (0.45 - m.condition) * 0.5 * (m.taped ? 2 : 1) + (m.oil <= 0 ? 0.08 : 0);
    if (p > 0 && Math.random() < p) { m.down = { why: BREAKDOWNS[Math.floor(Math.random() * BREAKDOWNS.length)], until: null, kind: 'broke' }; m.running = false; m.runLeft = 0; m.job = null; m.checklist = {}; notes.push(`${def.brand} ${def.name}: DOWN. ${m.down.why}. Call the tech, or get the tape.`); achieve(state, 'down'); }
  }
  return notes.filter(Boolean);
}
export const BANK_DAYS = 20;
export function bankCheck(state) { // four weeks in the red past the line and the bank calls it
  const notes = [];
  if (state.cash < 0) { state.redDays = (state.redDays || 0) + 1; } else state.redDays = 0;
  if (state.redDays === 10) notes.push('A letter from the bank. It uses the word "concerned" twice.');
  if (state.redDays === 15) notes.push('The bank called. The account manager is new. The old one "moved on". They would like a plan by Friday.');
  if (state.redDays >= BANK_DAYS) { state.bankrupt = true; achieve(state, 'the_call'); }
  return notes;
}
export const MONTH_KEY = 'shopsim.save.month';
export function monthlySave(state) { if ((state.day - 1) % 20 === 0) { try { localStorage.setItem(MONTH_KEY, JSON.stringify(state)); } catch (e) { /* fine */ } } }
export function loadMonth() { try { const raw = localStorage.getItem(MONTH_KEY); if (!raw) return null; const s = JSON.parse(raw); upgradeState(s); initJobs(s); initPeople(s); return s; } catch (e) { return null; } }

// ---- loans
export function takeLoan(state, kind) {
  const L = kind === 'startup' ? { kind, name: 'Start-up loan', principal: 100000, rate: 0.11, weeks: 260 } : kind === 'loc' ? { kind, name: 'Line of credit', principal: 50000, rate: 0.09, weeks: 104 } : null;
  if (!L) return { ok: false };
  if (state.loans.some((l) => l.kind === kind)) return { ok: false, why: 'you already have one' };
  const r = L.rate / 52, pay = Math.round((L.principal * r) / (1 - Math.pow(1 + r, -L.weeks)));
  state.loans.push({ ...L, balance: L.principal, weekly: pay, taken: state.day });
  post(state, L.name, L.principal);
  return { ok: true, weekly: pay };
}
export function financeMachine(state, def, used) {
  const price = used ? def.priceUsed : def.priceNew, down = Math.round(price * 0.1), fin = price - down;
  const r = 0.08 / 52, weeks = 260, pay = Math.round((fin * r) / (1 - Math.pow(1 + r, -weeks)));
  state.loans.push({ kind: 'machine', name: `${def.brand} ${def.name} (financed)`, principal: fin, rate: 0.08, weeks, balance: fin, weekly: pay, taken: state.day });
  return { down, weekly: pay };
}
export function loansWeekly(state) {
  const notes = []; let total = 0;
  for (const l of state.loans.slice()) {
    const interest = l.balance * (l.rate / 52), principal = Math.min(l.balance, l.weekly - interest);
    l.balance -= principal; total += l.weekly;
    if (l.balance <= 1) { state.loans.splice(state.loans.indexOf(l), 1); notes.push(`${l.name}: paid off. Frame the letter.`); }
  }
  if (total) { post(state, 'Loan payments', -total); notes.push(`Loan payments: $${total.toLocaleString()}.`); }
  return notes;
}

// ---- the letter. the longer you run on the borrowed copy and the bigger you get, the more likely.
export function auditCheck(state) {
  const sw = state.software; if (!sw || !sw.pirated || sw.auditDay) return [];
  const p = 0.004 * (1 + state.machines.filter((m) => byId(m.id).cnc).length) * (1 + state.people.length * 0.5);
  if (Math.random() > p) return [];
  sw.auditDay = state.day; const fine = 25000; post(state, 'Dassaux Systems: settlement', -fine);
  if (sw.cad === 'katya_ce') sw.cad = null; if (sw.cam === 'katya_ce') { sw.cam = null; }
  sw.pirated = false; sw.camDownUntil = state.day + 3;
  state.inbox && state.inbox.unshift({ id: 'audit' + state.day, type: 'msg', day: state.day, read: false, from: 'Dassaux Systems, Legal', subject: 'Unlicensed use of KATYA', body: `Our records show KATYA running at ${state.shopName} without a license. A settlement of $${fine.toLocaleString()} has been applied, and the software has been disabled. We look forward to your business. Registered mail follows.` });
  achieve(state, 'letter');
  return [`Registered mail. Dassaux Systems. $${fine.toLocaleString()}, and the CAM is gone until you buy a real seat. The letter.`];
}

// ---- achievements. most are for disasters.
export const ACHIEVEMENTS = {
  pin_aim_squeeze: ['Pull, Aim, Squeeze', 'Put out a fire on the shop floor. The tag was from 2009.'], chips_only: ['For Chips Only', 'The air hose. On a person. There is a poster about this.'], my_round: ['My Round', 'Brought somebody a coffee. Unthrown.'],
  five_axis: ['Five Axes', 'Bought the one everybody wants. Fourteen months, they said.'], press_time: ['Press Time', 'Ran a tryout on your own press. Saw the flash yourself.'], banana: ['The Banana', 'Heat treated a block into a curve. Quench & Sons sent a card.'], in_house_heat: ['Hard, In House', 'Heat treated a block in your own oven. It came out straight.'],
  factored: ['The Expensive Last Resort', 'Factored an invoice. Eighty-five cents, today.'], vending_sulk: ['Technically On Break', 'Somebody stood at the vending machine for an hour.'],
  rush: ['Rush Rate', 'Answered the phone. Somebody needed it yesterday.'], voicemail: ['Let It Ring', 'Missed a call. Lakeshore picked up.'],
  b4: ['B4', 'Five times. It was stuck every time. You knew.'],
  tour: ['The Tour', 'A customer walked the floor and liked it. An RFQ followed.'], wsib_visitor: ['Guest Relations', 'Hit a customer with something. There is a poster about this too.'],
  signed: ['Sign Here. And Here.', 'Signed for the steel before noon. The driver noticed.'],
  down: ['Down', 'A machine quit on you overnight. They do that.'], estop: ['The Red Button', 'Hit the E-stop before the spindle hit the table.'], the_call: ['The Call', 'The bank called it. They were polite.'], tape: ['Duct Tape', 'It runs. It is louder.'],
  the_speech: ['The Speech', 'Somebody quit on the floor, out loud, with everyone watching.'],
  stayed: ['Everybody Stays', 'Kept the crew late. Time and a half, and a look.'], watched: ['Supervision', 'Stood behind somebody while they ran a machine. It helped. They hated it.'],
  gold_watch: ['The Gold Watch', 'Ten years. You could retire. You did not.'], retired: ['Sold the Shop', 'Somebody else\'s compressor now.'],
  first_cycle: ['First Cycle Start', 'Press the button.'], one_out: ['One Out the Door', 'Ship a mold. Or a pin. It counts.'], oops: ['OOPS', 'First scrapped block. There will be more.'],
  hired: ['Somebody Else\'s Problem', 'Hire a person.'], lights_out: ['Lights Out, Nobody Home', 'An unattended run that worked.'], lights_wrong: ['Lights Out, Something\'s Wrong', 'An unattended run that did not.'],
  genuine: ['Genuine Advantage', 'Buy the software after the letter.'], letter: ['The Letter', 'Registered mail from a software company.'], first_cnc: ['Cycle Start, For Real', 'Press the green button on a CNC.'],
  the_crane: ['The Crane', 'Buy it. Lift something. Everyone watches.'], shipped_friday: ['Shipped It Friday', 'Ship after eight at night.'], candle: ['The Candle', 'The sinker caught fire. You have insurance. Probably.'],
  repeat: ['Repeat Customer', 'Their next job lands on your desk.'], wsib: ['WSIB', 'You know what you did.'], window: ['Glazier\'s Friend', 'Put a block of steel through a machine window.'], percussive: ['Percussive Maintenance', 'Hit a machine with a hammer. On purpose.'], three_pointer: ['Nothing But Net', 'Scrap bin, from downtown.'], wet_floor: ['Wet Floor', 'Somebody will slip on that.'], bent: ['It Was Like That', 'Bend something on a machine and blame the crew.'], first_mold: ['A Mold. An Actual Mold.', 'Ship a new tool build.'], t1_no_notes: ['T1, No Notes', 'A tryout with nothing to fix. Frame the email.'], quit: ['The Speech', 'Somebody quit in the middle of the floor.'], panel: ['Four Hundred Amps', 'The electrician came. It was Thursday.'],
};
export function achieve(state, id) { if (!state.achievements) state.achievements = []; if (state.achievements.includes(id)) return null; state.achievements.push(id); return ACHIEVEMENTS[id]; }


// Advance the clock by dt real seconds. Returns the events that happened (for toasts and sounds).
// The clock never rolls the day over by itself: you do that by going home (goHome).
export function tick(state, dt) {
  const events = [];
  if (state.speed <= 0) return events;
  const mins = (dt / 60) * state.speed;
  const before = state.t;
  state.t = Math.min(HARD_STOP_MIN, state.t + mins);
  const elapsed = state.t - before;
  if (before < CLOSE_MIN && state.t >= CLOSE_MIN && !state.closingShown) { state.closingShown = true; events.push({ type: 'closing' }); }
  if (state.t >= HARD_STOP_MIN && before < HARD_STOP_MIN) events.push({ type: 'hardstop' });
  // machines run their cycles, in shop minutes
  for (const m of state.machines) {
    if (m.running) {
      m.runLeft -= elapsed;
      m.hours += elapsed / 60;
      // the way lube. fifty hours a fill. nobody checks it. then it is dry and the ways start to sing.
      if (m.oil == null) m.oil = 1;
      m.oil = Math.max(0, m.oil - elapsed / 60 / 50);
      if (m.oil <= 0) { m.condition = Math.max(0, m.condition - elapsed * 0.0015); if (!m.dryWarned) { m.dryWarned = true; events.push({ type: 'dry', uid: m.uid }); } }
      if (m.runLeft <= 0) { m.running = false; m.runLeft = 0; m.checklist = {}; events.push({ type: 'cycleDone', uid: m.uid }); }
    }
  }
  return events;
}

// Lock up and go home. Returns what the night was like, for the home screen.
export function goHome(state) {
  const leftAt = OPEN_HOUR + state.t / 60;               // e.g. 17.0 or 22.5
  const sleep = Math.max(0, (24 - leftAt) + 6.5 - 0.5 - 0.5); // home by leftAt+0.5, up at 6:00, half an hour of being a person
  // ten hours is a full night. less than that and it starts to show.
  const fatigue = Math.max(0, Math.min(1, (9.5 - sleep) / 4.5));
  const overtime = state.t - CLOSE_MIN > 5 ? state.t - CLOSE_MIN : 0; // END DAY overshoots by a fraction of a minute
  const night = { leftAt: hourText(state.t), sleep, fatigue, overtime, dayDone: state.day };
  if (state.crewOT) {
    const hrs = Math.max(0, (state.t - CLOSE_MIN) / 60), crew = state.people.filter((p) => p.startDay != null && p.startDay <= state.day);
    const cost = Math.round(crew.reduce((a, p) => a + p.wage * 1.5 * hrs, 0));
    if (cost > 0) { post(state, `Overtime, ${crew.length} on the crew, ${hrs.toFixed(1)} h`, -cost); night.crewOT = cost; }
    for (const p of crew) p.morale = Math.max(0, p.morale - (hrs > 2 ? 0.06 : 0.03));
    state.crewOT = false;
  }
  state.lastSleep = sleep; state.fatigue = fatigue;
  const friday = (state.day - 1) % 7 === 4;
  state.day += friday ? 3 : 1; state.t = 0; state.closingShown = false; state.speed = 1;
  if (friday) { night.weekend = true; night.fatigue = state.fatigue = Math.max(0, fatigue - 0.5); }
  const extra = [];
  if ((state.day - 1) % 7 === 0) {
    const rent = building(state).rent;
    post(state, 'Rent', -rent);
    const power = POWER_WEEKLY_BASE * (state.building === 'large' ? 2.5 : 1) + POWER_PER_MACHINE * poweredCount(state);
    post(state, 'Hydro', -power);
    night.week = { rent, power };
    const sw = softwareWeekly(state); if (sw) { post(state, 'Software maintenance', -sw); extra.push(`Software maintenance: $${sw}.`); }
    extra.push(...loansWeekly(state));
  }
  night.day = state.day;
  night.notes = upgradeDue(state).concat(extra, overnightMachines(state), endOfDay(state, byId), peopleEndOfDay(state), auditCheck(state), nightlyEvents(state), bankCheck(state));
  if (state.bankrupt) night.bankrupt = true; else monthlySave(state);
  // the year turns every 52 weeks
  const yearBefore = Math.floor((night.dayDone - 1) / 260), yearAfter = Math.floor((state.day - 1) / 260);
  if (yearAfter > yearBefore) { night.year = yearSummary(state); if (canRetire(state)) { achieve(state, 'gold_watch'); night.year.retire = true; } }
  return night;
}

export function buy(state, def, used, financed = false) {
  const price = used ? def.priceUsed : def.priceNew;
  if (!financed && state.cash < price) return { ok: false, why: 'not enough cash' };
  const why = whyNot(state, def); if (why) return { ok: false, why };
  if (!financed) post(state, `${used ? 'Used' : 'New'} ${def.brand} ${def.name}`, -price);
  const m = {
    uid: state.nextUid++, id: def.id, x: 0, z: 0, rot: 0, used: !!used,
    condition: used ? 0.55 + Math.random() * 0.25 : 1, hours: 0,
    running: false, runLeft: 0, checklist: {}, placed: false, tools: def.tools || 0,
  };
  state.machines.push(m);
  state.stats.bought++; m.oil = m.used ? 0.4 + Math.random() * 0.4 : 1; m.down = null; if (def.five) achieve(state, 'five_axis');
  return { ok: true, machine: m };
}

export function sell(state, uid) {
  const i = state.machines.findIndex((m) => m.uid === uid);
  if (i < 0) return 0;
  const m = state.machines[i], def = byId(m.id);
  const value = Math.round((m.used ? def.priceUsed : def.priceNew) * 0.6 * (0.5 + 0.5 * m.condition));
  post(state, `Sold ${def.brand} ${def.name}`, value);
  state.machines.splice(i, 1);
  return value;
}

export function pluralName(def) { return `${def.brand} ${def.name}`; }
