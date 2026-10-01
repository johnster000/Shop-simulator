// Things that happen when you are not looking. The bible's table, as inbox mail and overnight notes.
import { post } from './sim.js';
import { customerOf, message } from './jobs.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function nightlyEvents(state) {
  const notes = [];
  // THE FRIDAY. A mold shipped late on a Friday. Monday at 8:04 the revision arrives.
  if (state.storyFriday && (state.day - 1) % 7 === 0) {
    const j = state.jobs.find((q) => q.id === state.storyFriday); const c = j && customerOf(j.customer);
    if (c) message(state, c.name, `Re: ${j.title}: one small change`, 'Monday, 8:04 a.m. Thanks for getting the tool out Friday night, we really appreciate it. One small change: engineering moved the boss on the B-side 0.5 mm. Print attached. Can we have the tool back by Wednesday?');
    notes.push('Monday, 8:04 a.m. The revision to the mold you shipped Friday night. The Friday. Every shop has one.');
    state.storyFriday = null; state.achievements && !state.achievements.includes('the_friday') && state.achievements.push('the_friday');
  }
  // THE DRAW. The first stuck part: the polisher is certain. The moldmaker is certain. The press is charging by the hour.
  if (!state.storyDraw) { const j = state.jobs.find((q) => q.defects && q.defects.includes('Stuck part')); if (j) { state.storyDraw = j.id; const a = state.people[0], b = state.people[1]; notes.push(`The part on job ${j.id} would not come out of the cavity. ${a ? `${a.name} is certain the polish was fine.` : 'The polish was fine, you are certain.'} ${b ? `${b.name} is certain it was not.` : 'The moldmaker at the press is certain it was not.'} The press was charging by the hour. The Draw. Every shop has one.`); state.achievements && !state.achievements.includes('the_draw') && state.achievements.push('the_draw'); } }
  const jobs = state.jobs.filter((j) => j.status === 'work');
  const roll = (p) => Math.random() < p;

  // "Just a small change." A mold in work gets a revision from the customer. Before design approval it is free; after, you bill it, and they argue.
  const molds = jobs.filter((j) => j.mold && j.jobStages[0].done && !j.jobStages.some((q) => q.kind === 'tryout' && q.out));
  if (molds.length && roll(0.06)) {
    const j = pick(molds), c = customerOf(j.customer);
    const change = pick([['a hole through the slide', 'bench', 'Add the hole they forgot', 90], ['two more ribs on the core', 'sinker', 'Burn two more ribs', 160], ['a logo in the cavity', 'sinker', 'Burn the logo', 120], ['the draft angle', 'vmc', 'Re-cut the draft', 180], ['the gate location', 'vmc', 'Move the gate', 90]]);
    const billed = Math.round(change[3] / 60 * 110);
    j.jobStages.splice(j.jobStages.findIndex((q) => q.kind === 'tryout'), 0, { kind: change[1], label: `ECN: ${change[2].toLowerCase()}`, min: change[3], done: false, out: null });
    j.price += billed; j.dueDay += 1;
    message(state, c.name, `Re: ${j.title}: just a small change`, `Hi! Just a small change: ${change[0]}. Print attached. Should not affect the schedule. Thanks!`);
    notes.push(`${c.name}: "just a small change" to job ${j.id}. ${change[0]}. You added $${billed.toLocaleString()} and a day. They will argue about both.`);
  }
  // Steel late. The truck did not come.
  const waiting = state.jobs.filter((j) => j.status === 'material' && j.materialDay === state.day);
  if (waiting.length && roll(0.12)) { const j = pick(waiting); j.materialDay += 1; notes.push(`The steel for job ${j.id} is not on the truck. The truck is not on the road. Tomorrow, says the driver.`); }
  // Slow payer. A receivable slides.
  if (state.receivables.length && roll(0.1)) { const r = pick(state.receivables); r.due += 7; const c = r.text.split(',')[0]; notes.push(`${c} needs another week on their invoice. Their accounts payable person is on vacation. It is always vacation.`); message(state, c, 'Invoice', pick(['Our AP is on vacation this week. Next run.', 'Can you resend the invoice? Our system ate it.', 'Net 30 means 30 from when we see it, and we only just saw it.'])); }
  // Rick calls at six.
  if (roll(0.05)) { message(state, 'Rick (Northgate Plastics)', pick(['You up?', 'Quick one', 'Re: that bushing']), pick(['Called at 6:10. No answer. Called again. Press 14 is down, need a core pin by noon, got anything?', 'Is the sprue bushing done? Not the one from last time, the other one.', 'Can you look at a mold today? It is leaking. It might be water. It might not.'])); notes.push('Rick called. Twice. Before six.'); }
  // A poaching call for your best person.
  const best = state.people.filter((p) => p.startDay <= state.day).sort((a, b) => (b.actual.bench + b.actual.mill) - (a.actual.bench + a.actual.mill))[0];
  if (best && best.role !== 'apprentice' && roll(0.03)) { best.morale = Math.max(0, best.morale - 0.12); best.grievance = { id: 'raise', label: 'an offer across town', text: `Lakeshore called. Two dollars more an hour and a chair that does not squeak. ${best.name} would rather stay. Would rather.`, fix: { raise: 2 } }; notes.push(`${best.name} got a call from Lakeshore. They are thinking about it. Loudly.`); }
  // The inspector, after a WSIB claim.
  if ((state.achievements || []).includes('wsib') && !state.inspected && roll(0.15)) { state.inspected = true; post(state, 'Ministry of Labour: orders and a fine', -1800); message(state, 'Ministry of Labour', 'Inspection report', 'Following a workplace injury report, an inspector attended. Orders: guard the band saw, replace the door, post the poster. A fine of $1,800 has been issued. Have a safe day.'); notes.push('An inspector came about the WSIB claim. $1,800 and a list. Have a safe day.'); }
  // The radio war.
  if (state.people.length >= 2 && roll(0.04)) { const [a, b] = state.people; a.morale = Math.max(0, a.morale - 0.03); b.morale = Math.max(0, b.morale - 0.03); notes.push(pick([`${a.name} changed the station. ${b.name} changed it back. Nobody worked for twenty minutes.`, `The radio is on ${a.name}'s station. ${b.name} has opinions about it.`])); }
  // Customer bankrupt. Rare. Unpaid balance; a mold nobody wants.
  if (state.receivables.length && roll(0.004)) { const r = pick(state.receivables); state.receivables.splice(state.receivables.indexOf(r), 1); const c = r.text.split(',')[0]; message(state, 'A trustee in bankruptcy', `Re: ${c}`, `${c} has filed. Your invoice of $${r.amount.toLocaleString()} is noted. Creditors will be contacted in due course. Due course is long.`); notes.push(`${c} went under. $${r.amount.toLocaleString()} you will not see. There is a very nice mold in the corner with a for-sale sign.`); state.rep = Math.max(0, state.rep - 0.02); }
  // Compliments, now and then.
  if (state.stats.shipped > 0 && roll(0.04)) { const c = pick(state.jobs.filter((j) => j.status === 'shipped').map((j) => customerOf(j.customer))); if (c) message(state, c.name, 'Nice work', pick(['The parts dropped right in. Our guy said nothing, which for him is a compliment.', 'That insert is running. Sending the next one your way.', 'Good job on the last one. Can you do it cheaper?'])); }
  return notes;
}

// Fifty-two weeks. What happened.
export function yearSummary(state) {
  const year = Math.floor((state.day - 1) / 260);
  const shipped = state.jobs.filter((j) => j.status === 'shipped');
  const molds = shipped.filter((j) => j.mold).length;
  const revenue = state.ledger.filter((l) => l.amount > 0 && !/loan|credit|Opening/i.test(l.text)).reduce((a, l) => a + l.amount, 0);
  const assets = state.machines.reduce((a, m) => a + (m.used ? 0.6 : 0.8) * 0.5, 0);
  return {
    year, shipped: shipped.length, molds, revenue, cash: state.cash, people: state.people.length, machines: state.machines.length,
    crashes: state.scrapCount, achievements: (state.achievements || []).length, rep: Math.round(state.rep * 100),
    line: molds ? pick(['A mold went out the door this year. You remember the day.', 'Molds. Plural. The sign is still the same sign.']) : shipped.length ? 'Components and repairs. The mold is next year. It is always next year.' : 'Nothing shipped. The compressor ran the whole time.',
  };
}
