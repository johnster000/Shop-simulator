// The crew, as numbers: who they are, what they can do, what they are paid, and what is bothering
// them. Pure simulation. The bodies are in crew.js.
import { post, tally } from './sim.js';
import { message } from './jobs.js';
import { randomLook } from './person.js';

const FIRST = ['Dave', 'Rick', 'Kevin', 'Mike', 'Steve', 'Dan', 'Paul', 'Jim', 'Tony', 'Marco', 'Hank', 'Lorne', 'Terry', 'Gord', 'Wayne', 'Doug', 'Bruce', 'Chris', 'Kyle', 'Brandon', 'Tyler', 'Jordan', 'Sam', 'Alex', 'Jamie', 'Pat', 'Shannon', 'Tracy', 'Lee', 'Chantal', 'Maria', 'Priya', 'Nav', 'Raj', 'Sunny', 'Vlad', 'Dmitri', 'Zoran', 'Luis', 'Ahmed', 'Jen', 'Carla', 'Rob', 'Big Dave', 'Other Dave', 'Frenchie', 'Smitty', 'Moose'];
export const ROLES = {
  apprentice: { name: 'Apprentice', wage: [18, 25], skills: [0, 2], blurbs: ['Keen. Knows nothing. That is the deal.', 'Did a year at college. Can read a print, mostly.', 'Nephew of a customer. Be nice.', 'Wants to be a moldmaker. Does not yet know what that means.'] },
  machinist: { name: 'CNC machinist', wage: [25, 35], skills: [2, 4], blurbs: ['Ran mills at a production shop. Fast. Not patient.', 'Knows the Bridgeford like a brother. Hates the lathe.', 'Came from aerospace. Expects a CMM. Will be disappointed.', 'Good hands, strong opinions about coolant.'] },
  nightshift: { name: 'Night-shift machinist', wage: [28, 38], skills: [2, 4], blurbs: ['Works nights. Prefers it. You will never see him, and he likes that about you.', 'Ran a second shift at a stamping plant. Sleeps in the afternoon. Do not call in the afternoon.', 'Quiet, careful, and gone by seven. The chips are the only proof.', 'Likes machines more than people, and says the night shift is where the machines are.'] },
  estimator: { name: 'Estimator / PM', wage: [30, 40], skills: [0, 2], blurbs: ['Quoted at a big shop for nine years. Knows every buyer by first name and grudge.', 'Came from purchasing. Switched sides. Knows where the bodies are.', 'Spreadsheets. Phone voice. Has never run a mill and says so.', 'Brings in work. Also brings in a lot of opinions about the coffee.'] },
  moldmaker: { name: 'Moldmaker', wage: [35, 48], skills: [3, 5], blurbs: ['Twenty-two years. Can fit a slide by feel. Will tell you about it.', 'Journeyman. Quiet. Spots a parting line like a surgeon.', 'Left the big shop across town. Did not say why.', 'Builds molds, fixes molds, has never once been on time.'] },
};
export const SKILLS = ['mill', 'lathe', 'grind', 'bench', 'general']; // general: saw, drill, sweeping
const QUIRKS = [
  ['radio', 'Will fight you over the radio station.'], ['late', 'Arrives twenty minutes late. Every day. Blames the bridge.'], ['coffee', 'Runs on coffee. The coffee is on you.'],
  ['tenths', 'Calls everything a tenth. Nothing is a tenth.'], ['softjaws', 'Does not believe in soft jaws.'], ['chuckkey', 'Leaves the chuck key in. Once.'], ['neat', 'Cleans the machine before and after. Slow, but nothing ever breaks.'],
  ['saturday', 'Will not work Saturdays. Has said so twice.'], ['stories', 'Has a story about every machine in the catalogue.'], ['whistle', 'Whistles. Only one song.'], ['lunch', 'Takes a long lunch. Takes it at 11:15.'],
];
const CNC_ONLY = ['cncOnly', 'Will not run the Bridgeford. "I am a programmer." Has a lanyard.'], MANUAL_ONLY = ['manualOnly', 'Will not run anything with a screen. Has said so, to the screen.'];
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
const HEAT = ['heat', 'the heat', 'Thirty degrees by ten. A fan is $120. Climate control is on the SHOP tab, and so is the rest of July.', { cost: 120 }];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

export function initPeople(state) {
  if (!state.people) state.people = [];
  if (!state.candidates) state.candidates = [];
  if (!state.nextPerson) state.nextPerson = 1;
  if (!state.candidates.length) refreshCandidates(state);
}

export function makeCandidate(state) {
  const pool = ['apprentice', 'apprentice', 'machinist', 'machinist', 'moldmaker'];
  if (state.rep >= 0.55 && state.people.length >= 2 && !state.people.some((p) => p.role === 'estimator')) pool.push('estimator');
  if (state.machines.some((m) => m.placed && m.id !== 'cmm' && ['vmc', 'sinker', 'wire'].includes((m.id === 'hardmill' || m.id === 'fiveaxis') ? 'vmc' : m.id)) && state.people.length >= 2) pool.push('nightshift');
  const roleId = pick(pool);
  const role = ROLES[roleId];
  const claimed = {}, actual = {};
  for (const k of SKILLS) {
    claimed[k] = Math.max(0, Math.min(5, rint(role.skills[0], role.skills[1]) + (k === 'general' ? 1 : 0) + (state.rep >= 0.7 && Math.random() < 0.5 ? 1 : 0))); // a name draws better resumes
    // the resume is not under oath
    actual[k] = Math.max(0, claimed[k] - (Math.random() < 0.3 ? rint(1, 2) : 0));
  }
  const quirk = pick(roleId === 'machinist' && Math.random() < 0.3 ? [CNC_ONLY] : roleId === 'moldmaker' && Math.random() < 0.3 ? [MANUAL_ONLY] : QUIRKS);
  if (quirk === CNC_ONLY) { claimed.vmc = Math.max(claimed.vmc, 3); actual.vmc = Math.max(actual.vmc, 2); }
  return {
    id: state.nextPerson++, name: pick(FIRST), role: roleId, roleName: role.name, blurb: state.rep >= 0.7 && Math.random() < 0.3 ? pick(['Heard the name. Wants in.', 'Left a bigger shop to come here. Says so twice.', 'Saw the mold at the show. Asked who built it.']) : pick(role.blurbs), quirk: quirk[1], quirkId: quirk[0],
    claimed, actual, wage: rint(role.wage[0], role.wage[1]), look: randomLook(), weld: roleId === 'moldmaker' && Math.random() < 0.25,
    morale: 0.72, startDay: null, revealed: false, daysWorked: 0, daysIdle: 0, grievance: null, lastRaise: 0, crashes: 0, saidToday: false,
  };
}

export function refreshCandidates(state) {
  state.candidates = [makeCandidate(state), makeCandidate(state), makeCandidate(state)];
  // some quit and come back. barrie did not work out.
  const back = (state.alumni || []).find((a) => a.leftDay + 15 <= state.day && Math.random() < 0.35);
  if (back) {
    state.alumni.splice(state.alumni.indexOf(back), 1);
    const p = Object.assign({}, back, { morale: 0.55, startDay: null, revealed: true, grievance: null, quitting: false, returned: true, daysIdle: 0, saidToday: false, blurb: pick(['Back. Barrie did not work out.', 'Back. The airport job was nights. All of them.', 'Back. Lakeshore laid off the whole second shift.', 'Back. Would rather not talk about it. Will talk about it.']) });
    delete p.leftDay; state.candidates[0] = p;
  }
}

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

export function skillKey(kind) { return { mill: 'mill', lathe: 'lathe', grinder: 'grind', bench: 'bench', saw: 'general', drill: 'general', vmc: 'mill', sinker: 'mill', wire: 'mill', spot: 'bench', cmm: 'general', graphite: 'mill', laser: 'bench', press: 'bench', heat: 'general', gundrill: 'mill', bigvmc: 'mill' }[kind] || 'general'; }
export function skillFor(p, kind) { return p.actual[skillKey(kind)] || 0; }
// a cycle run is practice. fifteen of them on one kind of machine and the hands know something the resume did not.
export function practice(p, kind, n = 1) { const k = skillKey(kind); p.practice = p.practice || {}; p.practice[k] = (p.practice[k] || 0) + n; }
const SKILL_WORD = { mill: 'the mill', lathe: 'the lathe', grind: 'the grinder', bench: 'the bench', general: 'the rest of it' };
export function growSkills(state, p) {
  const notes = []; if (!p.practice) return notes;
  for (const k of SKILLS) {
    if ((p.practice[k] || 0) >= 15 && (p.actual[k] || 0) < 5) {
      p.practice[k] = 0; p.actual[k] = (p.actual[k] || 0) + 1; p.claimed[k] = Math.max(p.claimed[k] || 0, p.actual[k]);
      notes.push(`${p.name} is getting good on ${SKILL_WORD[k]}. ${p.actual[k] >= 4 ? `${p.name} knows it, and so does the shop across town.` : `${p.name} does not know it yet.`}`);
      if (p.role === 'machinist' && !p.journeyman && (p.actual.bench || 0) >= 4 && (p.actual.general || 0) >= 3 && p.daysWorked >= 900) { // four years, give or take, and a bench skill: a journeyman
        p.role = 'moldmaker'; p.roleName = ROLES.moldmaker.name; p.journeyman = true; p.wage += 6; p.morale = Math.min(1, p.morale + 0.2);
        notes.push(`${p.name} is a moldmaker now. Four years, give or take, eight thousand hours, and a slide fitted by feel. There was cake. ${p.name} bought it.`);
        state.achievements && !state.achievements.includes('journeyman') && state.achievements.push('journeyman');
      }
      if (p.role === 'apprentice' && p.actual[k] >= 3 && (k === 'mill' || k === 'lathe' || k === 'grind')) {
        p.role = 'machinist'; p.roleName = ROLES.machinist.name; p.wage += 4; p.morale = Math.min(1, p.morale + 0.15);
        notes.push(`${p.name} asked for the machinist's rate. You gave it. The resume now says machinist, and this time it is true.`);
      }
    }
  }
  return notes;
}
// CNC wants a machinist or a moldmaker; an apprentice on a VMC is how you learn what a VMC costs
export const MANUAL_KINDS = ['mill', 'lathe', 'drill', 'saw', 'grinder'], SCREEN_KINDS = ['vmc', 'bigvmc', 'sinker', 'wire', 'graphite', 'cmm'];
export function canRun(p, kind) { if (p.role === 'estimator' || p.role === 'nightshift') return false; if (p.quirkId === 'cncOnly' && MANUAL_KINDS.includes(kind)) return false; if (p.quirkId === 'manualOnly' && SCREEN_KINDS.includes(kind)) return false; if (kind === 'laser') return !!p.weld; if (kind === 'spot') return p.role === 'moldmaker'; if (kind === 'press') return p.role === 'moldmaker' || (p.role === 'machinist' && skillFor(p, 'general') >= 3); if (kind === 'heat') return true; if (kind === 'cmm') return p.role !== 'apprentice'; if (kind === 'vmc' || kind === 'bigvmc' || kind === 'sinker' || kind === 'wire' || kind === 'graphite') return p.role !== 'apprentice' && skillFor(p, kind) >= 2; return skillFor(p, kind) >= 1 || kind === 'saw' || kind === 'drill' || kind === 'bench'; }
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
  if (p.quirkId === 'cncOnly' && ctx.refused) return pick(['I do not run the Bridgeford. I program.', 'That has a handle. I have a lanyard.', 'Not running that. It is a matter of principle. And a handwheel.']);
  if (p.quirkId === 'manualOnly' && ctx.refused) return pick(['I do not run anything with a screen.', 'That thing has a menu. I do not do menus.', 'Give me a handwheel and a dial. Then we will talk.']);
  if (ctx.ownerCrash && Math.random() < 0.35) return pick([`Remember when you crashed the ${ctx.ownerCrash.name.toLowerCase()}? We remember.`, 'Same bang as the rest of us. I am just saying.', `The ${ctx.ownerCrash.name.toLowerCase()} still makes a noise, since. You know since what.`, 'Twenty years in the trade and the same bang. We talk about it. We will keep talking about it.', 'We put it on the wall. The crash. Photo and everything.']);
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
    if (p.quitting) continue; // their last day. nothing changes their mind now.
    p.daysWorked++;
    if (p.workedToday) p.morale = Math.min(1, p.morale + 0.015); else { p.daysIdle++; p.morale = Math.max(0, p.morale - 0.03); }
    notes.push(...growSkills(state, p));
    p.workedToday = false; p.saidToday = false;
    if (!p.revealed && p.daysWorked >= 3) { p.revealed = true; const lied = SKILLS.some((k) => p.actual[k] < p.claimed[k]); if (lied) notes.push(`${p.name}'s resume was optimistic. You can see it now.`); }
    if (!p.grievance && Math.random() < 0.08) { const g = state.summer && !state.facility.climate && Math.random() < 0.5 ? HEAT : pick(GRIEVANCES); p.grievance = { id: g[0], label: g[1], text: g[2], fix: g[3] }; p.morale = Math.max(0, p.morale - 0.08); notes.push(`${p.name} has something to say about ${g[1]}.`); }
    if (p.grievance && p.morale < 0.4 && Math.random() < 0.12) { message(state, p.name, `Re: ${p.grievance.label}`, pick([`${p.grievance.text} I am writing it down so it is written down.`, `About ${p.grievance.label}. You said you would look into it. This is me asking what you saw.`, `${p.grievance.text} The guys asked me to send this. The guys did not ask me. I am sending it.`])); notes.push(`${p.name} put it in writing. ${p.grievance.label}. It is in the inbox, which is where things go to be ignored.`); }
    if (!p.quitting && (p.morale <= 0.05 || (p.morale < 0.2 && Math.random() < 0.25))) {
      if (p.startDay > state.day) { state.people = state.people.filter((q) => q.id !== p.id); tally(state, 'left'); notes.push(`${p.name} is not coming after all. A text message. Two words.`); }
      else if (p.role === 'nightshift') { state.people = state.people.filter((q) => q.id !== p.id); tally(state, 'left'); notes.push(`${p.name} quit. A note on the VMC, in marker. Nobody saw him go. Nobody had ever seen him arrive.`); }
      else { p.quitting = true; notes.push(`${p.name} is quitting. ${p.grievance ? `It is about ${p.grievance.label}. ` : ''}There will be a speech, on the floor, around half past nine.`); }
    }
  }
  // morale spreads. the disgruntled talk to the others, by the saw, about you.
  const here = state.people.filter((p) => p.startDay != null && p.startDay <= state.day && !p.quitting && p.role !== 'nightshift');
  const sour = here.filter((p) => p.morale < 0.35);
  if (sour.length && here.length >= 2) { for (const p of here) if (!sour.includes(p)) p.morale = Math.max(0, p.morale - 0.012 * sour.length); if (Math.random() < 0.25) { const other = pick(here.filter((p) => p !== sour[0])); notes.push(`${sour[0].name} and ${other.name} were talking by the saw. About you. They stopped when you walked past.`); } }
  if ((state.day - 1) % 7 === 4) { // Friday
    let total = 0; for (const p of state.people) if (p.startDay <= state.day) total += p.wage * 40;
    if (total) { post(state, 'Payroll', -total); notes.push(`Payroll: $${total.toLocaleString()}.`); if (state.cash < 0) { for (const p of state.people) p.morale = Math.max(0, p.morale - 0.2); notes.push('The cheques bounced. Everyone knows.'); } }
  }
  if ((state.day - 1) % 7 === 0) { refreshCandidates(state); const r = state.candidates.find((c) => c.returned); notes.push(r ? `New resumes on the desk. One of them is ${r.name}'s. ${r.blurb}` : 'New resumes on the desk.'); }
  return notes;
}

// the speech. three lines, on the floor, with everyone watching and nobody helping.
export function speech(p) {
  const g = p.grievance;
  const about = g ? ({ raise: 'the money', coffee: 'the coffee', chair: 'that stool', radio: 'the radio', cold: 'the door', blame: 'the crash. Which was not my fault.', idle: 'standing around all day', tools: 'the Shards' })[g.id] || g.label : pick(['everything', 'this place', 'you, mostly']);
  return [pick(['Everybody. Can I have a second.', 'I have something to say.', 'Shut the saw off. I have something to say.']),
    pick([`It is about ${about}.`, `You know what this is about. ${about[0].toUpperCase() + about.slice(1)}.`, `${p.daysWorked > 260 ? 'A year' : p.daysWorked > 60 ? 'Months' : 'Weeks'} of ${about}.`]),
    pick(['I quit. Keys are on the bench.', 'I am done. Lakeshore called.', 'I am going to go work at the airport.', 'I quit. The radio stays on my station.', 'That is it. I am taking my mug.'])];
}

export function hasEstimator(state) { return state.people.some((p) => p.role === 'estimator' && p.startDay != null && p.startDay <= state.day && !p.quitting); }

export function nightShift(state) { return state.people.filter((p) => p.role === 'nightshift' && p.startDay != null && p.startDay <= state.day && !p.quitting); }
