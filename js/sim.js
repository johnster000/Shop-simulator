// The simulation. No three.js in here: this is the shop as numbers.
// Time is minute for minute: a shop minute is a real minute at 1x. The day opens at 7:00 and
// closes at 17:00; you can stay late until 23:00, and then you go home whether you like it or not.
// Monday is day 1.

import { byId, SHOP } from './catalog.js';
import { initJobs, endOfDay } from './jobs.js';
import { initPeople, endOfDay as peopleEndOfDay } from './people.js';

export const SAVE_KEY = 'shopsim.save.v1';
export const OPEN_HOUR = 7;
export const CLOSE_MIN = 600;    // 17:00, in minutes after opening
export const HARD_STOP_MIN = 960; // 23:00. nobody is any good after this.
export const END_DAY_SPEED = 60;  // END DAY runs a shop minute per real second
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
  };
}
export function fresh(shopName) { const s = newState(shopName); initJobs(s); initPeople(s); return s; }

export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.v !== 1) return null;
    initJobs(s); initPeople(s);
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

export function poweredCount(state) {
  return state.machines.filter((m) => byId(m.id).power > 0).length;
}

export function canPower(state, def) {
  return def.power === 0 || poweredCount(state) < SHOP.powerSlots;
}

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
  state.lastSleep = sleep; state.fatigue = fatigue;
  state.day += 1; state.t = 0; state.closingShown = false; state.speed = 1;
  if ((state.day - 1) % 7 === 0) {
    post(state, 'Rent', -RENT_WEEKLY);
    const power = POWER_WEEKLY_BASE + POWER_PER_MACHINE * poweredCount(state);
    post(state, 'Hydro', -power);
    night.week = { rent: RENT_WEEKLY, power };
  }
  night.day = state.day;
  night.notes = endOfDay(state, byId).concat(peopleEndOfDay(state));
  return night;
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
