// Things that happen when you are not looking. The bible's table, as inbox mail and overnight notes.
import { post, valuation } from './sim.js';
import { byId } from './catalog.js';
import { customerOf, message, makeRfq, TEMPLATES, SEGMENT_FLAG } from './jobs.js';

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
  const crew = state.people.filter((p) => p.startDay != null && p.startDay <= state.day && p.role !== 'nightshift');

  // THE CORNERS COME DUE. the customer's tryout is your tryout, in public. the CMM at the other end. the steel that was not the steel.
  for (const j of state.jobs.filter((q) => q.status === 'shipped')) {
    const c = customerOf(j.customer);
    if (j.publicTryout && j.publicTryout <= state.day) { j.publicTryout = null; const pen = Math.round(j.price * 0.12); post(state, `Chargeback: ${c.name}, their tryout of job ${j.id}`, -pen); state.rep = Math.max(0, state.rep - 0.15); message(state, c.name, `Re: ${j.title}: our tryout`, `We ran it. ${pick(['Flash on every part. Our molding manager has photos. He has shown them to everyone.', 'The part stuck. The press was down an hour getting it out. The press is $400 an hour.', 'Short shots, then flash, then a stuck part. In front of our customer.'])} We are deducting $${pen.toLocaleString()} and we would like the tool back on Monday.`); notes.push(`${c.name} ran the mold you shipped without the last tryout. In front of their customer. $${pen.toLocaleString()} back, and the phone is going to ring.`); state.achievements && !state.achievements.includes('public_tryout') && state.achievements.push('public_tryout'); }
    if (j.foundAtCustomer && j.foundAtCustomer <= state.day) { j.foundAtCustomer = null; const pen = Math.round(j.price * 0.15); post(state, `Rework credit: ${c.name}, job ${j.id} out of tolerance`, -pen); state.rep = Math.max(0, state.rep - 0.1); message(state, c.name, `Re: job ${j.id}: inspection report`, `Our CMM has one dimension out by ${pick(['two thou', 'a thou and a half', 'three thou, on the one that mattered'])}. Report attached. We reworked it here. Deducting $${pen.toLocaleString()}. Do you inspect?`); notes.push(`${c.name} put job ${j.id} on their CMM. One dimension out. They found it, not you. $${pen.toLocaleString()} off.`); state.achievements && !state.achievements.includes('found_at_customer') && state.achievements.push('found_at_customer'); }
    if (j.millionDay && j.millionDay <= state.day) { j.millionDay = null; if (Math.random() < 0.6) { message(state, c.name, `Re: ${j.title}: 1,000,000`, pick(['The counter on the press rolled over this morning. A million shots on your tool. Our molding manager took a photo. He does not take photos.', 'One million cycles. No weld, no rework, the slides still slide. We thought you should know. Do not quote us on that.'])); notes.push(`${c.name}: the ${j.title.toLowerCase()} passed a million cycles. They sent a photo of the counter.`); state.rep = Math.min(1, state.rep + 0.05); state.achievements && !state.achievements.includes('one_million') && state.achievements.push('one_million'); } }
    if (j.wearDay && j.wearDay <= state.day) { j.wearDay = null; if (j.mold) { state.rep = Math.max(0, state.rep - 0.25); state.sour = state.sour || {}; state.sour[c.id] = state.day + 60; const pen = Math.round(j.price * 0.2); post(state, `Credit: ${c.name}, job ${j.id}, the steel`, -pen); message(state, c.name, `Re: ${j.title}: the steel`, `The cavity is washing out at 40,000 shots. We had it tested. It is ${j.steelUsed}. The PO said ${j.realSteel}. We are deducting $${pen.toLocaleString()}, we are telling everyone we know, and we know everyone.`); notes.push(`${c.name} had the steel tested. It was ${j.steelUsed}. The PO said ${j.realSteel}. They are telling everyone. Everyone.`); } else { const pen = Math.round(j.price * 0.2); post(state, `Credit: ${c.name}, job ${j.id} wore early`, -pen); state.rep = Math.max(0, state.rep - 0.08); message(state, c.name, `Re: job ${j.id}`, `These wore out in a month. They were supposed to be ${j.realSteel}. Were they?`); notes.push(`The ${j.title.toLowerCase()} for ${c.name} wore out early. They are asking about the steel. $${pen.toLocaleString()} back.`); } state.achievements && !state.achievements.includes('cheap_steel') && state.achievements.push('cheap_steel'); }
  }
  // THE JAR. the coffee fund. the crew drinks; some of them pay. when it is empty, the coffee is the coffee from the bottom of the can.
  if (crew.length) {
    const drank = crew.length * 2, paid = crew.reduce((a, p) => a + (p.morale > 0.6 || p.quirkId === 'coffee' ? 0 : Math.random() < 0.6 ? 2 : 0), 0);
    const was = state.jar; state.jar = Math.max(-40, state.jar - drank + paid);
    if (was > 0 && state.jar <= 0 && roll(0.7)) notes.push(pick(['The coffee fund is empty. The coffee is now the coffee from the bottom of the can.', 'The jar is empty. Somebody wrote IOU on a sticky note and put the note in the jar.', 'The jar has a button in it and nothing else. The button is not currency.']));
    if (state.jar >= 60 && roll(0.25)) { state.jar -= 40; for (const p of crew) p.morale = Math.min(1, p.morale + 0.03); notes.push(pick(['Somebody bought the good coffee with the jar money. The jar is lighter and the morning is better.', 'The jar bought a can of the good stuff. Everyone noticed. Nobody said thanks.'])); }
    if (state.jar < -20 && roll(0.3)) notes.push(`The coffee fund is $${-state.jar} in the hole. There is a list on the fridge now. ${pick(crew).name}'s name is on it twice.`);
  }
  // THE CAKE. it was on the table at five. the plate is in the sink. the plate will stay in the sink.
  if (state.cake && state.cake.day < state.day) { notes.push(pick(['The cake is gone. The plate is in the sink. It will stay in the sink.', 'Somebody took the rest of the cake home. The knife is still on the table.', 'The cake box is in the recycling. The recycling is the scrap bin.'])); state.cake = null; }
  // TOOLS THAT WALK. the dead-blow hammer, the chuck key, the 6-inch calipers. they turn up. in a toolbox. with a different handle.
  if (!state.walked) state.walked = []; if (state.jar == null) state.jar = 0;
  for (const w of state.walked.slice()) if (w.back <= state.day) { state.walked.splice(state.walked.indexOf(w), 1); const who = crew.length ? pick(crew).name : 'nobody'; notes.push(w.kind === 'hammer' ? `The dead-blow hammer is back. It was in ${who}'s box. ${who} says it was always ${who}'s. It has a different handle now.` : w.kind === 'key' ? `The chuck key turned up. In the chuck. Where it has been for ${state.day - w.day} days.` : `The 6-inch calipers came back. The battery is dead and the jaws have a nick. ${who} says that was there before.`); }
  if (crew.length >= 2 && roll(0.035)) {
    const kind = pick(['hammer', 'hammer', 'key', 'calipers']);
    if (!state.walked.some((w) => w.kind === kind)) {
      const w = { kind, day: state.day, back: state.day + 3 + Math.floor(Math.random() * 5) }; state.walked.push(w);
      if (kind === 'calipers') { post(state, '6-inch calipers, the second pair', -180); w.back = state.day + 2 + Math.floor(Math.random() * 7); }
      notes.push(kind === 'hammer' ? 'The dead-blow hammer walked. It will turn up. It always turns up. In a toolbox.' : kind === 'key' ? 'The chuck key is missing. Everybody looked everywhere except the one place.' : 'The good 6-inch calipers walked. $180 for a second pair, which will also walk.');
      state.achievements && !state.achievements.includes('walked') && state.achievements.push('walked');
    }
  }

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
  if (false && ((state.achievements || []).includes('wsib') || state.inspectorSoon) && !state.inspected && (roll(0.15) || (state.inspectorSoon && roll(0.5)))) { /* retired: the inspector visits in person now (visitor.js) */ state.inspected = true; post(state, 'Ministry of Labour: orders and a fine', -1800); message(state, 'Ministry of Labour', 'Inspection report', 'Following a workplace injury report, an inspector attended. Orders: guard the band saw, replace the door, post the poster. A fine of $1,800 has been issued. Have a safe day.'); notes.push('An inspector came about the WSIB claim. $1,800 and a list. Have a safe day.'); }
  // The radio war.
  if (state.people.length >= 2 && roll(0.04)) { const [a, b] = state.people; a.morale = Math.max(0, a.morale - 0.03); b.morale = Math.max(0, b.morale - 0.03); notes.push(pick([`${a.name} changed the station. ${b.name} changed it back. Nobody worked for twenty minutes.`, `The radio is on ${a.name}'s station. ${b.name} has opinions about it.`])); }
  // Customer bankrupt. Rare. Unpaid balance; a mold nobody wants.
  if (state.receivables.length && roll(0.004)) { const r = pick(state.receivables); state.receivables.splice(state.receivables.indexOf(r), 1); const c = r.text.split(',')[0]; message(state, 'A trustee in bankruptcy', `Re: ${c}`, `${c} has filed. Your invoice of $${r.amount.toLocaleString()} is noted. Creditors will be contacted in due course. Due course is long. The mold is yours to keep, legally, which is worth less than it sounds.`); state.orphans = (state.orphans || []).concat([{ customer: c, value: r.amount, day: state.day }]); notes.push(`${c} went under. $${r.amount.toLocaleString()} you will not see. There is a very nice mold in the corner with a for-sale sign.`); state.rep = Math.max(0, state.rep - 0.02); }
  // somebody wants the orphaned mold. rarely. for not much.
  if ((state.orphans || []).length && roll(0.02)) { const o = state.orphans.shift(); const got = Math.round(o.value * (0.12 + Math.random() * 0.1)); post(state, `Sold the orphaned mold (${o.customer})`, got); notes.push(`A man with a trailer bought ${o.customer}'s mold for $${got.toLocaleString()}. He is going to make the same product in a different colour.`); }
  // the program. a customer who got two good molds offers three more, at a price, with a bonus for all three on time.
  if (!state.program && state.rep >= 0.6) {
    const good = {}; for (const j of state.jobs) if (j.status === 'shipped' && j.mold && j.tryouts === 1 && !j.defects.length) good[j.customer] = (good[j.customer] || 0) + 1;
    const cid = Object.keys(good).find((k) => good[k] >= 2);
    if (cid && roll(0.25)) {
      const c = customerOf(cid), hasFive = state.machines.some((m) => m.placed && byId(m.id).five);
      const seg = SEGMENT_FLAG[c.kind]; const temps = TEMPLATES.filter((t) => t.mold && !t.proto && !t.transfer && (!t.five || hasFive)).filter((t) => seg ? t[seg] : !t.five && !t.appliance && !t.packaging && !t.medical);
      const ids = []; let total = 0;
      for (let i = 0; i < 3; i++) { const t = temps[Math.floor(Math.random() * temps.length)]; const r = makeRfq(state, t, c); r.title = `PROGRAM ${i + 1}/3: ${t.title}`; r.program = true; r.expires = state.day + 10; r.lead = 40 + i * 25; state.rfqs.push(r); ids.push(r.id); total += r.expected; }
      state.program = { customer: cid, rfqs: ids, jobs: [], bonus: Math.round(total * 0.1), day: state.day, done: 0, late: 0 };
      message(state, c.name, 'A program', `We have a new product line. Three molds over the next four months, staggered. We would like you to build all three. Quote them as a set; ship all three on time and there is a ${money(state.program.bonus)} bonus at the end. Lose one and we are back to quoting one at a time.`);
      notes.push(`${c.name} offered a program: three molds, staggered, ${money(state.program.bonus)} on top if all three ship on time. The RFQs are in the inbox. This is the mid-game.`);
    }
  }
  // Compliments, now and then.
  if (state.stats.shipped > 0 && roll(0.04)) { const c = pick(state.jobs.filter((j) => j.status === 'shipped').map((j) => customerOf(j.customer))); if (c) message(state, c.name, 'Nice work', pick(['The parts dropped right in. Our guy said nothing, which for him is a compliment.', 'That insert is running. Sending the next one your way.', 'Good job on the last one. Can you do it cheaper?'])); }
  return notes;
}

// Fifty-two weeks. What happened.
export function yearSummary(state) {
  const year = Math.floor((state.day - 1) / 260);
  const d0 = (year - 1) * 260 + 1, d1 = year * 260; // the year that just ended
  const shipped = state.jobs.filter((j) => j.status === 'shipped' && j.shippedDay >= d0 && j.shippedDay <= d1);
  const molds = shipped.filter((j) => j.mold).length;
  const led = state.ledger.filter((l) => l.day >= d0 && l.day <= d1);
  const revenue = led.filter((l) => l.amount > 0 && !/loan|credit|Opening|Sold|financ/i.test(l.text)).reduce((a, l) => a + l.amount, 0);
  const best = led.filter((l) => l.amount > 0 && !/loan|credit|Opening/i.test(l.text)).sort((a, b) => b.amount - a.amount)[0] || null;
  const worst = led.filter((l) => l.amount < 0 && !/Bought|Rent|Hydro|Payroll|Software|payment|Deposit|financ|Steel|Vendor|Heat|Base|Manifold|Texture/i.test(l.text)).sort((a, b) => a.amount - b.amount)[0] || null;
  const yr = state.yr || {}; const v = valuation(state);
  const out = {
    year, shipped: shipped.length, molds, revenue, cash: state.cash, people: state.people.length, machines: state.machines.length,
    hired: yr.hired || 0, left: yr.left || 0, onTime: yr.onTime || 0, late: yr.late || 0,
    crashes: yr.crashes || 0, achievements: (state.achievements || []).length, rep: Math.round(state.rep * 100), valuation: v,
    best: best ? `${best.text} (${money(best.amount)})` : null, worst: worst ? `${worst.text} (${money(worst.amount)})` : null,
    line: molds ? pick(['A mold went out the door this year. You remember the day.', 'Molds. Plural. The sign is still the same sign.']) : shipped.length ? 'Components and repairs. The mold is next year. It is always next year.' : 'Nothing shipped. The compressor ran the whole time.',
  };
  state.yr = { hired: 0, left: 0, onTime: 0, late: 0, crashes: 0, wsib: 0 };
  return out;
}
function money(n) { return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString(); }

// what the crew says about you, at the retirement party. it is not a roast. it is close.
export function crewVerdict(state) {
  const lines = [];
  for (const p of state.people) {
    const yrs = Math.floor((p.daysWorked || 0) / 260), m = p.morale;
    const t = m > 0.75 ? pick([`"Best boss I had. Second best. The first one is dead."`, `"Never threw anything at me. That I know of."`, `"Paid on Fridays. Every Friday. You would be surprised."`, `"Let me run the ${state.machines.length ? 'good machine' : 'coffee machine'}. I will not forget that."`])
      : m > 0.4 ? pick([`"Fair. Mostly. The radio thing was not fair."`, `"Fine. The shop was fine. The parking was not."`, `"Could have said thank you more. Could have said it once."`, `"Good with customers. Hard on cutters."`])
      : pick([`"I have a lawyer now."`, `"The speech is ready. I have been saving it."`, `"Ten years. Nine of them were a mistake."`, `"Is the WSIB guy coming?"`]);
    lines.push(`${p.name}${yrs ? ` (${yrs} year${yrs === 1 ? '' : 's'})` : ''}: ${t}`);
  }
  if (!lines.length) lines.push('Nobody came. The compressor hissed once, which counts.');
  if ((state.yr && state.yr.wsib) || (state.achievements || []).includes('wsib')) lines.push('A card from the WSIB office. It just says "finally".');
  return lines;
}

// a program job shipped: count it; all three on time pays the bonus
export function programShipped(state, job, late) {
  const pr = state.program; if (!pr || !pr.jobs.includes(job.id) || pr.finished) return null;
  pr.done++; if (late > 0) pr.late++;
  if (pr.done >= 3) {
    pr.finished = true; const c = customerOf(pr.customer);
    if (pr.late === 0) { post(state, `Program bonus, ${c.name}`, pr.bonus); state.rep = Math.min(1, state.rep + 0.1); message(state, c.name, 'The program: thank you', `All three, on time. The bonus is in the mail, which for us means actually in the mail. The next program is yours to lose.`); return `The program is done. All three on time. ${money(pr.bonus)} bonus from ${c.name}, and a reputation you can hear from across town.`; }
    message(state, c.name, 'The program', `Three molds. ${pr.late} late. The bonus clause was clear. We will still call. Probably.`); return `The program is done. ${pr.late} of three late. No bonus. ${c.name} said "probably".`;
  }
  return `Program mold ${pr.done} of 3 shipped${late > 0 ? ', late. The bonus is gone' : ', on time'}.`;
}
