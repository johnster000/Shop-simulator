// The crew, as numbers: who they are, what they can do, what they are paid, and what is bothering
// them. Pure simulation. The bodies are in crew.js.
import { post, tally } from './sim.js';
import { randomLook } from './person.js';

const FIRST = ['Dave', 'Rick', 'Kevin', 'Mike', 'Steve', 'Dan', 'Paul', 'Jim', 'Tony', 'Marco', 'Hank', 'Lorne', 'Terry', 'Gord', 'Wayne', 'Doug', 'Bruce', 'Chris', 'Kyle', 'Brandon', 'Tyler', 'Jordan', 'Sam', 'Alex', 'Jamie', 'Pat', 'Shannon', 'Tracy', 'Lee', 'Chantal', 'Maria', 'Priya', 'Nav', 'Raj', 'Sunny', 'Vlad', 'Dmitri', 'Zoran', 'Luis', 'Ahmed', 'Jen', 'Carla', 'Rob', 'Big Dave', 'Other Dave', 'Frenchie', 'Smitty', 'Moose'];
export const ROLES = {
  apprentice: { name: 'Apprentice', wage: [18, 25], skills: [0, 2], blurbs: ['Keen. Knows nothing. That is the deal.', 'Did a year at college. Can read a print, mostly.', 'Nephew of a customer. Be nice.', 'Wants to be a moldmaker. Does not yet know what that means.'] },
  machinist: { name: 'CNC machinist', wage: [25, 35], skills: [2, 4], blurbs: ['Ran mills at a production shop. Fast. Not patient.', 'Knows the Bridgeford like a brother. Hates the lathe.', 'Came from aerospace. Expects a CMM. Will be disappointed.', 'Good hands, strong opinions about coolant.'] },
  moldmaker: { name: 'Moldmaker', wage: [35, 48], skills: [3, 5], blurbs: ['Twenty-two years. Can fit a slide by feel. Will tell you about it.', 'Journeyman. Quiet. Spots a parting line like a surgeon.', 'Left the big shop across town. Did not say why.', 'Builds molds, fixes molds, has never once been on time.'] },
};
export const SKILLS = ['mill', 'lathe', 'grind', 'bench', 'general']; // general: saw, drill, sweeping
const QUIRKS = [
  ['radio', 'Will fight you over the radio station.'], ['late', 'Arrives twenty minutes late. Every day. Blames the bridge.'], ['coffee', 'Runs on coffee. The coffee is on you.'],
  ['tenths', 'Calls everything a tenth. Nothing is a tenth.'], ['softjaws', 'Does not believe in soft jaws.'], ['chuckkey', 'Leaves the chuck key in. Once.'], ['neat', 'Cleans the machine before and after. Slow, but nothing ever breaks.'],
  ['saturday', 'Will not work Saturdays. Has said so twice.'], ['stories', 'Has a story about every machine in the catalogue.'], ['whistle', 'Whistles. Only one song.'], ['lunch', 'Takes a long lunch. Takes it at 11:15.'],
];
const GRIEVANCES = [
  ['raise', 'wants a raise', 'It has been a while. A dollar an hour would do it.', { raise: 1 }],
  ['coffee', 'the coffee', 'The coffee is terrible. A real machine is $320.', { cost: 320 }],
  ['chair', 'the stool', 'The stool at the bench squeaks and tilts. $140.', { cost: 140 }],
  ['radio', 'the radio', 'Somebody changed the station. Again.', { talk: true }],
  ['cold', 'the tarp', 'The tarp door. The cold comes straight in. You know this.', { talk: true }],
  ['blame', 'getting blamed', 'That crash was not entirely their fault. They would like that said.', { talk: true }],
  ['idle', 'standing around', 'Nothing to do all day. They did not sign up to sweep.', { talk: true }],
  ['tools', 'tooling', 'The end mills are Shards. Shards. $180 of real ones would do.', { cost: 180 }],
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function initPeople(state) {
  if (!state.people) state.people = [];
  if (!state.candidates) state.candidates = [];
  if (!state.nextPerson) state.nextPerson = 1;
  if (!state.candidates.length) refreshCandidates(state);
}

export function makeCandidate(state) {
  const roleId = pick(['apprentice', 'apprentice', 'machinist', 'machinist', 'moldmaker']);
  const role = ROLES[roleId];
  const claimed = {}, actual = {};
  for (const k of SKILLS) {
    claimed[k] = Math.max(0, Math.min(5, rint(role.skills[0], role.skills[1]) + (k === 'general' ? 1 : 0)));
    // the resume is not under oath
    actual[k] = Math.max(0, claimed[k] - (Math.random() < 0.3 ? rint(1, 2) : 0));
  }
  const quirk = pick(QUIRKS);
  return {
    id: state.nextPerson++, name: pick(FIRST), role: roleId, roleName: role.name, blurb: pick(role.blurbs), quirk: quirk[1], quirkId: quirk[0],
    claimed, actual, wage: rint(role.wage[0], role.wage[1]), look: randomLook(), weld: roleId === 'moldmaker' && Math.random() < 0.25,
    morale: 0.72, startDay: null, revealed: false, daysWorked: 0, daysIdle: 0, grievance: null, lastRaise: 0, crashes: 0, saidToday: false,
  };
}

export function refreshCandidates(state) { state.candidates = [makeCandidate(state), makeCandidate(state), makeCandidate(state)]; }

export function hire(state, cand) {
  state.candidates = state.candidates.filter((c) => c.id !== cand.id);
  cand.startDay = state.day + 1; cand.hiredDay = state.day; tally(state, 'hired');
  state.people.push(cand);
  return cand;
}

export function fire(state, p) {
  const sev = p.wage * 16;
  post(state, `${p.name}: two days' notice`, -sev);
  state.people = state.people.filter((q) => q.id !== p.id);
  for (const q of state.people) q.morale = Math.max(0, q.morale - 0.05);
  return sev;
}

export function skillFor(p, kind) { return p.actual[{ mill: 'mill', lathe: 'lathe', grinder: 'grind', bench: 'bench', saw: 'general', drill: 'general', vmc: 'mill', sinker: 'mill', wire: 'mill', spot: 'bench', cmm: 'general', graphite: 'mill', laser: 'bench' }[kind] || 'general'] || 0; }
// CNC wants a machinist or a moldmaker; an apprentice on a VMC is how you learn what a VMC costs
export function canRun(p, kind) { if (kind === 'laser') return !!p.weld; if (kind === 'spot') return p.role === 'moldmaker'; if (kind === 'cmm') return p.role !== 'apprentice'; if (kind === 'vmc' || kind === 'sinker' || kind === 'wire' || kind === 'graphite') return p.role !== 'apprentice' && skillFor(p, kind) >= 2; return skillFor(p, kind) >= 1 || kind === 'saw' || kind === 'drill' || kind === 'bench'; }
// one setup step: pass or skip
export function setupRoll(p, kind) { const sk = skillFor(p, kind); return Math.random() < 0.42 + sk * 0.115 + (p.morale - 0.5) * 0.12; }
export function moraleWord(m) { return m >= 0.85 ? 'happy' : m >= 0.6 ? 'fine' : m >= 0.4 ? 'grumbling' : m >= 0.2 ? 'disgruntled' : 'done'; }
export function speedFactor(p) { return 0.75 + p.morale * 0.4; }

export function raise(state, p, amt = 1) { p.wage += amt; p.lastRaise = state.day; p.morale = Math.min(1, p.morale + 0.2); if (p.grievance && p.grievance.id === 'raise') p.grievance = null; }
export function fixGrievance(state, p) {
  const g = p.grievance; if (!g) return { ok: false };
  if (g.fix.cost) { if (state.cash < g.fix.cost) return { ok: false, why: 'not enough cash' }; post(state, `${g.label}, for ${p.name}`, -g.fix.cost); }
  if (g.fix.raise) { raise(state, p, g.fix.raise); }
  p.morale = Math.min(1, p.morale + 0.15); p.grievance = null;
  for (const q of state.people) if (q !== p) q.morale = Math.min(1, q.morale + 0.03);
  return { ok: true };
}
export function tough(state, p) { p.morale = Math.max(0, p.morale - 0.1); p.grievance = null; }

// what they say when you walk up
export function line(p, ctx = {}) {
  const m = p.morale;
  if (ctx.working) return pick([`Running job ${ctx.job}. Don't touch anything.`, `${ctx.stage}. Give me an hour.`, 'It is cutting. That is all I ask of it.', 'Chips look right. For once.']);
  if (p.grievance) return p.grievance.text;
  if (m < 0.2) return pick(['I have been looking at the classifieds.', 'My cousin has a shop in Barrie.', 'Say the word and I am gone. Or do not say it. Same result.']);
  if (m < 0.4) return pick(['Fine. Everything is fine.', 'Is the tarp ever getting fixed?', 'I am not saying anything. I am just saying.']);
  if (m < 0.6) return pick(['What is next?', 'Nothing on the mill. I swept.', 'Any word on that PO?', 'Compressor sounds worse today.']);
  return pick(['Good day for it.', 'Point me at something.', 'That last one came out nice, eh?', 'I like it here. Do not tell anyone.', 'The radio is on the right station. For now.']);
}

// at the end of each day: morale drifts, grievances arrive, people quit, Friday is payday, Monday brings new resumes.
export function endOfDay(state) {
  const notes = [];
  for (const p of state.people.slice()) {
    if (p.startDay > state.day) continue;
    p.daysWorked++;
    if (p.workedToday) p.morale = Math.min(1, p.morale + 0.015); else { p.daysIdle++; p.morale = Math.max(0, p.morale - 0.03); }
    p.workedToday = false; p.saidToday = false;
    if (!p.revealed && p.daysWorked >= 3) { p.revealed = true; const lied = SKILLS.some((k) => p.actual[k] < p.claimed[k]); if (lied) notes.push(`${p.name}'s resume was optimistic. You can see it now.`); }
    if (!p.grievance && Math.random() < 0.08) { const g = pick(GRIEVANCES); p.grievance = { id: g[0], label: g[1], text: g[2], fix: g[3] }; p.morale = Math.max(0, p.morale - 0.08); notes.push(`${p.name} has something to say about ${g[1]}.`); }
    if (p.morale <= 0.05 || (p.morale < 0.2 && Math.random() < 0.25)) {
      state.people = state.people.filter((q) => q.id !== p.id); tally(state, 'left');
      notes.push(`${p.name} quit. There was a speech. The radio is still on their station.`);
      for (const q of state.people) q.morale = Math.max(0, q.morale - 0.04);
    }
  }
  if ((state.day - 1) % 7 === 4) { // Friday
    let total = 0; for (const p of state.people) if (p.startDay <= state.day) total += p.wage * 40;
    if (total) { post(state, 'Payroll', -total); notes.push(`Payroll: $${total.toLocaleString()}.`); if (state.cash < 0) { for (const p of state.people) p.morale = Math.max(0, p.morale - 0.2); notes.push('The cheques bounced. Everyone knows.'); } }
  }
  if ((state.day - 1) % 7 === 0) { refreshCandidates(state); notes.push('New resumes on the desk.'); }
  return notes;
}
