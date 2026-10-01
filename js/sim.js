// The simulation. No three.js in here: this is the shop as numbers.
// Time is in shop days. A day is 60 real seconds at 1x. Monday is day 1.

import { byId, SHOP } from './catalog.js';

export const SAVE_KEY = 'shopsim.save.v1';
export const DAY_SECONDS = 60;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RENT_WEEKLY = 850;      // $3,400 a month-ish for 2,500 sq ft, charged Monday morning
const POWER_WEEKLY_BASE = 200; // the lights and the compressor
const POWER_PER_MACHINE = 60;

export function newState(shopName) {
  const params = new URLSearchParams(location.search);
  return {
    v: 1,
    shopName,
    cash: Math.max(0, parseFloat(params.get('cash')) || 50000),
    day: Math.max(1, parseInt(params.get('day')) || 1),
    t: 0,              // seconds into the current day (0..DAY_SECONDS)
    speed: 1,
    machines: [],      // { uid, id, x, z, rot, used, condition, hours, running, checklist }
    nextUid: 1,
    ledger: [{ day: 1, text: 'Opening balance', amount: 0 }],
    stats: { cycleStarts: 0, skipped: 0, bought: 0 },
    firstCycle: false,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return null;
    return s;
  } catch (e) { return null; }
}

export function save(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

export function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* fine */ } }

export function dayName(day) { return DAYS[(day - 1) % 7]; }

export function clockText(state) {
  // the shop day runs 7:00 to 17:00 on the display; the maths underneath is just seconds
  const mins = Math.floor((state.t / DAY_SECONDS) * 600);
  const h = 7 + Math.floor(mins / 60), m = mins % 60;
  return `Day ${state.day} · ${dayName(state.day)} ${h}:${m < 10 ? '0' : ''}${m}`;
}

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

export function poweredCount(state) {
  return state.machines.filter((m) => byId(m.id).power > 0).length;
}

export function canPower(state, def) {
  return def.power === 0 || poweredCount(state) < SHOP.powerSlots;
}

// Advance the clock. Returns a list of events that happened (for toasts and sounds).
export function tick(state, dt) {
  const events = [];
  if (state.speed <= 0) return events;
  state.t += dt * state.speed;
  while (state.t >= DAY_SECONDS) {
    state.t -= DAY_SECONDS;
    state.day += 1;
    events.push({ type: 'day', day: state.day });
    if ((state.day - 1) % 7 === 0) {
      post(state, 'Rent', -RENT_WEEKLY);
      const power = POWER_WEEKLY_BASE + POWER_PER_MACHINE * poweredCount(state);
      post(state, 'Hydro', -power);
      events.push({ type: 'week', rent: RENT_WEEKLY, power });
    }
  }
  // machines run their cycles
  for (const m of state.machines) {
    if (m.running) {
      m.runLeft -= dt * state.speed;
      m.hours += (dt * state.speed) / DAY_SECONDS * 10;
      if (m.runLeft <= 0) { m.running = false; m.runLeft = 0; m.checklist = {}; events.push({ type: 'cycleDone', uid: m.uid }); }
    }
  }
  return events;
}

export function buy(state, def, used) {
  const price = used ? def.priceUsed : def.priceNew;
  if (state.cash < price) return { ok: false, why: 'not enough cash' };
  if (!canPower(state, def)) return { ok: false, why: 'the panel cannot run another machine' };
  post(state, `${used ? 'Used' : 'New'} ${def.brand} ${def.name}`, -price);
  const m = {
    uid: state.nextUid++, id: def.id, x: 0, z: 0, rot: 0, used: !!used,
    condition: used ? 0.55 + Math.random() * 0.25 : 1, hours: 0,
    running: false, runLeft: 0, checklist: {}, placed: false,
  };
  state.machines.push(m);
  state.stats.bought++;
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
