// HUD, the clipboard, the machine panel. Honest HTML. No 3D UI.
import { MACHINES, byId } from './catalog.js';
import { money, clockText, buy, sell, canPower, poweredCount, afterHours, fatigueText, END_DAY_SPEED } from './sim.js';
import { SHOP } from './catalog.js';
import { play as playMinigame } from './minigames.js';
import { customerOf, unread, sendQuote, declineRfq, winChance, runnableStages, sendOut, ship, stationName, shopHas, SHOP_RATE } from './jobs.js';
import { hire, fire, raise, fixGrievance, tough, moraleWord, SKILLS } from './people.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(state, audio, hooks) {
    this.state = state; this.audio = audio; this.hooks = hooks; // hooks: { place(m), refreshMachines(), pause(), resume(), modal(bool) }
    this.toastTimer = 0; this.lastCash = null; this.tab = 'inbox';
    $('shopSign').textContent = state.shopName;
    $('speeds').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; audio.click();
      if (b.id === 'endDay') { if (afterHours(state)) hooks.goHome(); else this.setSpeed(END_DAY_SPEED); return; }
      this.setSpeed(parseFloat(b.dataset.speed));
    });
    $('clipClose').addEventListener('click', () => this.closeClip());
    $('clipTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; this.showTab(b.dataset.tab); audio.paper(); });
    $('panelClose').addEventListener('click', () => this.closePanel());
    $('personClose').addEventListener('click', () => this.closePerson());
    $('clipBtn').addEventListener('click', () => this.toggleClip());
    $('isoBtn').addEventListener('click', () => hooks.toggleIso());
    $('pauseBtn').addEventListener('click', () => hooks.pause());
  }

  setSpeed(s) { this.state.speed = s; for (const b of $('speeds').querySelectorAll('button')) b.classList.toggle('on', parseFloat(b.dataset.speed) === s); }

  // Tired people press the wrong button. Returns true when a click should go wrong.
  fumble(scale = 1) {
    const f = this.state.fatigue || 0;
    if (f <= 0) return false;
    return Math.random() < f * 0.35 * scale;
  }
  fumbleLine() {
    return ['You pressed the wrong button.', 'You blinked for a second there.', 'Your hand went to the other button.', 'Coffee. You need coffee.', 'You read that twice and it still did not go in.'][Math.floor(Math.random() * 5)];
  }

  toast(msg, dur = 2200) { const el = $('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => el.classList.remove('show'), dur); }
  hint(text) { const el = $('hint'); if (text) { el.textContent = text; el.classList.add('show'); } else { el.textContent = ''; el.classList.remove('show'); } }
  tag(text) { const el = $('tag'); if (text) { el.textContent = text; el.classList.add('show'); } else { el.textContent = ''; el.classList.remove('show'); } }

  update() {
    const s = this.state;
    if (s.cash !== this.lastCash) { $('cash').textContent = money(s.cash); $('cash').classList.toggle('bad', s.cash < 0); this.lastCash = s.cash; }
    $('clockText').textContent = clockText(s);
    const late = afterHours(s), ed = $('endDay');
    if (late !== this.lastLate) { this.lastLate = late; ed.textContent = late ? 'GO HOME' : 'END DAY'; ed.classList.toggle('home', late); }
    const u = unread(s);
    if (u !== this.lastUnread) { this.lastUnread = u; $('mail').classList.toggle('hidden', u === 0); $('mailCount').textContent = u; $('inboxBadge').classList.toggle('hidden', u === 0); $('inboxBadge').textContent = u; }
    const ft = fatigueText(s.fatigue || 0), fe = $('fatigue');
    if (ft !== this.lastFt) { this.lastFt = ft; fe.textContent = ft; fe.classList.toggle('show', !!ft); fe.classList.toggle('bad', ft === 'EXHAUSTED'); document.body.classList.toggle('tired', (s.fatigue || 0) >= 0.25); }
  }

  // ---- clipboard
  get clipOpen() { return !$('clip').classList.contains('hidden'); }
  toggleClip() { if (this.clipOpen) this.closeClip(); else this.openClip(); }
  openClip(tab) { $('clip').classList.remove('hidden'); this.showTab(tab || this.tab); this.hooks.modal(true); this.audio.paper(); }
  closeClip() { $('clip').classList.add('hidden'); this.hooks.modal(false); }
  showTab(tab) {
    this.tab = tab;
    for (const b of $('clipTabs').querySelectorAll('button')) b.classList.toggle('on', b.dataset.tab === tab);
    for (const t of document.querySelectorAll('.tab')) t.classList.toggle('hidden', t.id !== 'tab-' + tab);
    if (tab === 'inbox') this.renderInbox(); if (tab === 'jobs') this.renderJobs(); if (tab === 'people') this.renderPeople(); if (tab === 'shop') this.renderShop(); if (tab === 'machines') this.renderMachines(); if (tab === 'bank') this.renderBank();
  }

  renderInbox() {
    const s = this.state, el = $('tab-inbox');
    const open = s.rfqs.filter((r) => r.status === 'open' || r.status === 'quoted');
    const has = (kind) => shopHas(s, kind, byId);
    const rfqHtml = (r) => {
      const c = customerOf(r.customer);
      const missing = r.stages.filter((st) => !has(st.kind)).map((st) => st.kind);
      return `<div class="rfq ${r.status}" data-rfq="${r.id}">
        <div class="from">RFQ · ${c.name} · day ${r.day} · ${r.status === 'quoted' ? 'quoted, waiting' : `answer by day ${r.expires}`}</div>
        <h3>${r.title}${r.qty > 1 ? ` × ${r.qty}` : ''}</h3>
        <div class="note">${c.blurb}</div>
        <ul class="stages">${r.stages.map((st) => `<li class="${has(st.kind) ? '' : 'missing'}" title="${stationName(st.kind)}">${st.label} · ${st.min} min</li>`).join('')}</ul>
        <div class="note">${r.minutes} min of work at $${SHOP_RATE}/hr + $${r.material} ${r.steel} = estimate <b>${money(r.estimate)}</b>. Lead time ${r.lead} days.${missing.length ? ` <span style="color:var(--red)">You have no ${[...new Set(missing)].map(stationName).join(' or ')}: those stages would go out to Bramalea at $110/hr.</span>` : ''}</div>
        ${r.status === 'open' ? `<div class="quote"><input type="range" min="${Math.round(r.estimate * 0.5)}" max="${Math.round(r.estimate * 2)}" step="5" value="${r.price}" id="q${r.id}"><span class="price" id="p${r.id}">${money(r.price)}</span><span class="est" id="w${r.id}"></span><button data-send="${r.id}">SEND QUOTE</button><button class="ghost" data-decline="${r.id}">DECLINE</button></div>` : `<div class="note">You quoted <b>${money(r.price)}</b>. They will let you know tomorrow.</div>`}
      </div>`;
    };
    el.innerHTML = `${open.length ? open.map(rfqHtml).join('') : '<p class="note">No requests for quote. The phone will ring. Reputation makes it ring more.</p>'}
      <h4 style="letter-spacing:.2em;font-size:12px;margin:18px 0 4px">MESSAGES</h4>
      ${s.inbox.slice(0, 20).map((m) => `<div class="msg ${m.read ? '' : 'unread'}"><div class="from">${m.from} · day ${m.day}</div><div class="subj">${m.subj || m.subject}</div><div class="body">${m.body}</div></div>`).join('') || '<p class="note">Nothing.</p>'}`;
    for (const r of open) { r.read = true; }
    for (const m of s.inbox) m.read = true;
    el.querySelectorAll('input[type=range]').forEach((inp) => {
      const r = s.rfqs.find((q) => q.id === +inp.id.slice(1));
      const upd = () => { r.price = +inp.value; $('p' + r.id).textContent = money(r.price); const w = winChance(s, r); $('w' + r.id).textContent = w > 0.7 ? 'they will probably bite' : w > 0.4 ? 'could go either way' : w > 0.15 ? 'a stretch' : 'they will laugh'; };
      inp.addEventListener('input', upd); upd();
    });
    el.querySelectorAll('[data-send]').forEach((b) => b.addEventListener('click', () => { const r = s.rfqs.find((q) => q.id === +b.dataset.send); sendQuote(s, r, r.price); this.audio.paper(); this.toast('Quote sent. You will hear tomorrow.'); this.renderInbox(); }));
    el.querySelectorAll('[data-decline]').forEach((b) => b.addEventListener('click', () => { const r = s.rfqs.find((q) => q.id === +b.dataset.decline); declineRfq(s, r); this.audio.click(); this.renderInbox(); }));
  }

  renderJobs() {
    const s = this.state, el = $('tab-jobs');
    const live = s.jobs.filter((j) => j.status !== 'shipped').slice().reverse();
    const done = s.jobs.filter((j) => j.status === 'shipped').slice().reverse().slice(0, 8);
    const has = (kind) => shopHas(s, kind, byId);
    const jobHtml = (j) => {
      const c = customerOf(j.customer), late = j.status !== 'shipped' && s.day > j.dueDay;
      const next = j.stages.findIndex((st) => !st.done);
      return `<div class="job ${j.status} ${late ? 'late' : ''}">
        <div class="from">JOB ${j.id} · ${c.name} · ${j.status === 'material' ? `steel arrives day ${j.materialDay}` : j.status === 'ready' ? 'READY TO SHIP' : j.status === 'shipped' ? `shipped day ${j.shippedDay}` : 'in work'}</div>
        <h3 style="margin:4px 0">${j.title}${j.qty > 1 ? ` × ${j.qty}` : ''}</h3>
        <div class="meta">${money(j.price)} · due day ${j.dueDay}${late ? ` · <b style="color:var(--red)">${s.day - j.dueDay} day${s.day - j.dueDay === 1 ? '' : 's'} LATE</b>` : ''}${j.scrap ? ` · scrapped ${j.scrap}×` : ''}</div>
        <ul class="stages">${j.stages.map((st, i) => `<li class="${st.done ? 'done' : st.out ? 'out' : i === next && !has(st.kind) ? 'missing' : ''}">${st.label} · ${st.min} min${st.out ? ` · back day ${st.out.backDay}` : ''}</li>`).join('')}</ul>
        <div class="acts">
          ${j.status === 'ready' ? `<button class="ship" data-ship="${j.id}">SHIP IT</button>` : ''}
          ${j.status === 'work' && next >= 0 && !j.stages[next].out ? (has(j.stages[next].kind) ? `<span class="note">Next: ${j.stages[next].label.toLowerCase()} on the ${stationName(j.stages[next].kind)}. Walk over and load it.</span>` : `<button class="ghost" data-out="${j.id}" data-i="${next}">SEND OUT: ${j.stages[next].label} (${money(Math.round(j.stages[next].min / 60 * 110) + 40)})</button><span class="note">You have no ${stationName(j.stages[next].kind)}.</span>`) : ''}
        </div></div>`;
    };
    el.innerHTML = `${live.length ? live.map(jobHtml).join('') : '<p class="note">No jobs. Quote something.</p>'}${done.length ? `<h4 style="letter-spacing:.2em;font-size:12px;margin:18px 0 4px">SHIPPED</h4>${done.map(jobHtml).join('')}` : ''}
      <p class="note">Reputation ${Math.round(s.rep * 100)}. On-time ships raise it. Late ones drop it faster.</p>`;
    el.querySelectorAll('[data-ship]').forEach((b) => b.addEventListener('click', () => { const j = s.jobs.find((q) => q.id === +b.dataset.ship); const r = ship(s, j); s.stats.shipped++; this.audio.cash(); this.toast(r.late ? `Shipped. ${r.late} day${r.late === 1 ? '' : 's'} late. They noticed.` : 'Shipped. One out the door.', 3200); this.hooks.shipped(); this.renderJobs(); }));
    el.querySelectorAll('[data-out]').forEach((b) => b.addEventListener('click', () => { const j = s.jobs.find((q) => q.id === +b.dataset.out); const r = sendOut(s, j, +b.dataset.i); if (!r.ok) { this.audio.nope(); this.toast(r.why); return; } this.audio.cash(); this.toast(`Off to Bramalea. ${money(r.cost)}. Back in two days.`); this.renderJobs(); }));
  }

  skillsHtml(p, showActual) {
    return `<div class="skills">${SKILLS.map((k) => `<span class="${showActual && p.actual[k] < p.claimed[k] ? 'lie' : ''}" title="${k}">${k} ${showActual ? p.actual[k] : p.claimed[k]}${showActual && p.actual[k] < p.claimed[k] ? ` (said ${p.claimed[k]})` : ''}</span>`).join('')}</div>`;
  }

  renderPeople() {
    const s = this.state, el = $('tab-people'), crew = this.hooks.crew();
    const crewHtml = (p) => `<div class="pcard"><div class="row2"><div><b>${p.name}</b> · ${p.roleName} · $${p.wage}/hr</div><div class="morale ${p.morale < 0.4 ? 'low' : ''}">${moraleWord(p.morale)}</div></div>
      <div class="note">${p.blurb} ${p.quirk}</div>
      ${this.skillsHtml(p, p.revealed)}${p.revealed ? '' : '<div class="note">Skills as claimed. You will know in a few days.</div>'}
      <div class="note">${crew ? crew.status(p) : ''}${p.grievance ? ` · <b>has a word to say about ${p.grievance.label}</b>` : ''} · ${p.daysWorked} day${p.daysWorked === 1 ? '' : 's'} here · ${p.crashes} crash${p.crashes === 1 ? '' : 'es'}</div>
      <div class="acts"><button data-talk="${p.id}">A WORD</button><button class="ghost" data-raise="${p.id}">RAISE $1/HR</button><button class="danger" data-fire="${p.id}">LET GO</button></div></div>`;
    const candHtml = (c) => `<div class="pcard"><div class="row2"><div><b>${c.name}</b> · ${c.roleName} · asks $${c.wage}/hr</div></div>
      <div class="note">${c.blurb} ${c.quirk}</div>${this.skillsHtml(c, false)}
      <div class="acts"><button data-hire="${c.id}">HIRE · starts tomorrow</button></div></div>`;
    const weekly = s.people.reduce((a, p) => a + p.wage * 40, 0);
    el.innerHTML = `<div class="row2"><div><div class="note">CREW</div><div class="big">${s.people.length}</div></div><div class="note">Payroll $${weekly.toLocaleString()} a week, paid Fridays. One person is you, and you are not on it.</div></div>
      ${s.people.length ? s.people.map(crewHtml).join('') : '<p class="note">Nobody. You, the compressor, and the tarp.</p>'}
      <h4 style="letter-spacing:.2em;font-size:12px;margin:18px 0 8px">RESUMES ON THE DESK</h4>
      ${s.candidates.length ? s.candidates.map(candHtml).join('') : '<p class="note">None this week. Monday brings more.</p>'}
      <p class="note">A resume is a document written by its subject. Skills are what they say; the floor will say otherwise.</p>`;
    el.querySelectorAll('[data-hire]').forEach((b) => b.addEventListener('click', () => { const c = s.candidates.find((q) => q.id === +b.dataset.hire); hire(s, c); this.audio.paper(); this.toast(`${c.name} starts tomorrow. ${c.quirkId === 'late' ? 'Ish.' : ''}`); this.hooks.crewChanged(); this.renderPeople(); }));
    el.querySelectorAll('[data-fire]').forEach((b) => b.addEventListener('click', () => { const p = s.people.find((q) => q.id === +b.dataset.fire); const sev = fire(s, p); this.audio.nope(); this.toast(`${p.name} is gone. ${money(sev)} in notice. The others saw.`, 3000); this.hooks.crewChanged(); this.renderPeople(); }));
    el.querySelectorAll('[data-raise]').forEach((b) => b.addEventListener('click', () => { const p = s.people.find((q) => q.id === +b.dataset.raise); raise(s, p, 1); this.audio.cash(); this.toast(`${p.name}: a dollar an hour. They noticed.`); this.renderPeople(); }));
    el.querySelectorAll('[data-talk]').forEach((b) => b.addEventListener('click', () => { const p = s.people.find((q) => q.id === +b.dataset.talk); this.closeClip(); this.openPerson(p); }));
  }

  // ---- person panel
  get personOpen() { return !$('person').classList.contains('hidden'); }
  openPerson(p) { this.personP = p; $('person').classList.remove('hidden'); this.hooks.modal(true); this.renderPerson(); }
  closePerson() { $('person').classList.add('hidden'); this.personP = null; this.hooks.modal(false); }
  renderPerson() {
    const p = this.personP, s = this.state, crew = this.hooks.crew(); if (!p) return;
    $('personTitle').textContent = `${p.name.toUpperCase()} · ${p.roleName.toUpperCase()}`;
    const body = $('personBody');
    const work = crew ? crew.workOptions(p) : [];
    body.innerHTML = `<div class="speech">${crew ? crew.lineFor(p) : ''}</div>
      <div class="note">${crew ? crew.status(p) : ''} · ${moraleWord(p.morale)} · $${p.wage}/hr</div>
      ${p.grievance ? `<div class="pacts"><button data-fix>${p.grievance.fix.cost ? `FIX IT (${money(p.grievance.fix.cost)})` : p.grievance.fix.raise ? `A RAISE ($${p.grievance.fix.raise}/hr)` : 'HEAR THEM OUT'}</button><button class="ghost" data-tough>TOUGH</button></div>` : ''}
      ${work.length ? `<div class="note" style="margin-top:8px">Point them at something:</div><div class="pacts">${work.map((w) => `<button data-go="${w.m.uid}">${w.d.name.toUpperCase()}: ${w.o.stage.label} (job ${w.o.job.id})</button>`).join('')}</div>` : '<div class="note" style="margin-top:8px">Nothing to point them at right now.</div>'}
      <div class="pacts"><button class="ghost" data-break>TAKE FIVE</button></div>`;
    body.querySelector('[data-fix]') && body.querySelector('[data-fix]').addEventListener('click', () => { const r = fixGrievance(s, p); if (!r.ok) { this.audio.nope(); this.toast(r.why || 'no'); return; } this.audio.cash(); this.toast(`${p.name} is happier. For now.`); this.renderPerson(); });
    body.querySelector('[data-tough]') && body.querySelector('[data-tough]').addEventListener('click', () => { tough(s, p); this.audio.click(); this.toast(`${p.name} heard you.`); this.renderPerson(); });
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { const w = work.find((q) => q.m.uid === +b.dataset.go); if (crew.assign(p, w.m)) { this.audio.click(); this.toast(`${p.name}: "On it."`); this.closePerson(); } else { this.audio.nope(); this.toast('That machine is busy now.'); this.renderPerson(); } }));
    body.querySelector('[data-break]').addEventListener('click', () => { crew.takeFive(p); this.audio.click(); this.toast(`${p.name} went for coffee.`); this.closePerson(); });
  }

  renderShop() {
    const s = this.state, el = $('tab-shop');
    const slots = SHOP.powerSlots - poweredCount(s);
    el.innerHTML = `<div class="row2"><div class="big">${money(s.cash)}</div><div class="note">Panel: ${slots} of ${SHOP.powerSlots} machine circuits free. Everything arrives on a truck tomorrow, which in this build means now.</div></div>
      <ul class="cat">${MACHINES.map((d) => `
      <li>${d.stage === 0 && d.kind === 'mill' ? '<span class="tagx">START HERE</span>' : ''}
        <div class="name">${d.name}</div><div class="brand">${d.brand} ${d.model}</div>
        <div class="blurb">${d.blurb}</div>
        <div class="foot">${d.w} × ${d.d} m${d.power ? ' · needs a circuit' : ''}</div>
        <div class="buy">
          <button class="used" data-id="${d.id}" data-used="1" ${s.cash < d.priceUsed || !canPower(s, d) ? 'disabled' : ''}>USED ${money(d.priceUsed)}</button>
          <button data-id="${d.id}" ${s.cash < d.priceNew || !canPower(s, d) ? 'disabled' : ''}>NEW ${money(d.priceNew)}</button>
        </div></li>`).join('')}</ul>
      <p class="note">Used machines come with a history. New machines come with a warranty and a payment. Neither comes with a crane.</p>`;
    el.querySelectorAll('.buy button').forEach((b) => b.addEventListener('click', () => {
      const def = byId(b.dataset.id), used = b.dataset.used === '1';
      const r = buy(s, def, used);
      if (!r.ok) { this.audio.nope(); this.toast(r.why); return; }
      this.audio.cash(); this.closeClip(); this.hooks.place(r.machine);
    }));
  }

  renderMachines() {
    const s = this.state, el = $('tab-machines');
    if (!s.machines.length) { el.innerHTML = '<p class="note">Nothing. An empty floor and a compressor. Buy a mill.</p>'; return; }
    el.innerHTML = `<table class="ledger"><tr><th>MACHINE</th><th>CONDITION</th><th>HOURS</th><th></th></tr>${s.machines.map((m) => {
      const d = byId(m.id);
      return `<tr><td><b>${d.brand} ${d.name}</b><br><span class="note">${m.used ? 'used' : 'new'} · ${m.placed ? 'on the floor' : 'NOT PLACED'}${m.running ? ' · running' : ''}</span></td>
        <td><div class="bar"><i style="width:${Math.round(m.condition * 100)}%"></i></div>${Math.round(m.condition * 100)}%</td>
        <td class="num">${m.hours.toFixed(1)}</td>
        <td class="num"><button class="btn sm ghost" data-move="${m.uid}">${m.placed ? 'MOVE' : 'PLACE'}</button> <button class="btn sm ghost" data-sell="${m.uid}">SELL</button></td></tr>`; }).join('')}</table>
      <p class="note">Selling gets you about sixty cents on the dollar, less if it is tired. The buyer will say it is tired.</p>`;
    el.querySelectorAll('[data-move]').forEach((b) => b.addEventListener('click', () => { const m = s.machines.find((x) => x.uid === +b.dataset.move); this.closeClip(); this.hooks.place(m); }));
    el.querySelectorAll('[data-sell]').forEach((b) => b.addEventListener('click', () => { const v = sell(s, +b.dataset.sell); this.audio.cash(); this.toast(`Sold. ${money(v)}. The buyer said it was tired.`); this.hooks.refreshMachines(); this.renderMachines(); }));
  }

  renderBank() {
    const s = this.state, el = $('tab-bank');
    const rows = s.ledger.slice().reverse().slice(0, 40);
    el.innerHTML = `<div class="row2"><div><div class="note">CASH</div><div class="big">${money(s.cash)}</div></div>
      <div class="note">Rent $850/wk · hydro $200/wk + $60 per machine · due Monday morning.<br>No loan yet. The bank wants to see two years of statements. You have ${s.day} day${s.day === 1 ? '' : 's'}.</div></div>
      <table class="ledger"><tr><th>DAY</th><th>ITEM</th><th class="num">AMOUNT</th></tr>${rows.map((r) => `<tr class="${r.amount < 0 ? 'neg' : ''}"><td>${r.day}</td><td>${r.text}</td><td class="num">${r.amount === 0 ? '' : money(r.amount)}</td></tr>`).join('')}</table>`;
  }

  // ---- machine panel
  get panelOpen() { return !$('panel').classList.contains('hidden'); }
  openPanel(m) {
    this.panelM = m; $('panel').classList.remove('hidden'); this.hooks.modal(true); this.renderPanel();
  }
  closePanel() { $('panel').classList.add('hidden'); this.panelM = null; this.hooks.modal(false); }
  renderPanel() {
    const m = this.panelM; if (!m) return;
    const d = byId(m.id), s = this.state;
    $('panelTitle').textContent = `${d.brand.toUpperCase()} ${d.name.toUpperCase()}`;
    const steps = ({
      mill: [['clamp', 'Clamp the work', 'clamp'], ['indicate', 'Indicate it in', 'indicate'], ['speed', 'Pick a speed', 'speed']],
      lathe: [['clamp', 'Chuck it up', 'clamp'], ['indicate', 'Indicate the part', 'indicate'], ['speed', 'Pick a speed', 'speed']],
      grinder: [['clamp', 'Lock the mag chuck', 'clamp'], ['indicate', 'Dress the wheel', 'indicate'], ['speed', 'Set the downfeed', 'speed']],
      drill: [['clamp', 'Clamp the work', 'clamp'], ['speed', 'Pick a speed', 'speed']],
      saw: [['clamp', 'Clamp the stock', 'clamp'], ['speed', 'Pick a blade speed', 'speed']],
      bench: [],
    })[d.kind] || [];
    const cl = m.checklist || (m.checklist = {});
    const body = $('panelBody');
    if (m.running) {
      const jt = m.job ? `Job ${m.job.jobId}: ${m.job.label}` : 'A practice cut on a scrap block';
      body.innerHTML = `<p>Running. <span class="note">${d.manual ? 'You are standing here. That is the job.' : ''}</span></p>
        <div class="bar"><i style="width:${Math.round((1 - m.runLeft / m.runTotal) * 100)}%"></i></div>
        <p class="note">${jt}. ${Math.ceil(m.runLeft)} minutes to go.</p>`;
      return;
    }
    // what is there to do on this machine?
    if (!m.job) {
      const opts = runnableStages(s, d.kind);
      body.innerHTML = `<div class="row2"><span>Condition</span><span>${Math.round(m.condition * 100)}% · ${m.hours.toFixed(1)} h on the clock · ${m.used ? 'used' : 'new'}</span></div>
        <div class="bar"><i style="width:${Math.round(m.condition * 100)}%"></i></div>
        <p class="note">${opts.length ? 'Work waiting for this machine:' : d.kind === 'bench' ? 'Nothing to fit. The bench is for bench stages: deburring, polishing, assembly.' : 'No job needs this machine right now.'}</p>
        <ul class="pickjob">${opts.map((o) => `<li><span><b>Job ${o.job.id}</b> · ${o.stage.label} · ${o.stage.min} min<br><span class="note">${o.job.title}${o.job.qty > 1 ? ' × ' + o.job.qty : ''} · due day ${o.job.dueDay}</span></span><button data-pick="${o.job.id}" data-i="${o.index}">LOAD IT</button></li>`).join('')}
        ${d.kind === 'bench' ? '' : `<li class="practice"><span>Practice cut on a scrap block · ${30} min</span><button data-pick="0">LOAD IT</button></li>`}</ul>`;
      body.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
        const id = +b.dataset.pick; this.audio.click();
        if (id === 0) m.job = { jobId: 0, index: -1, label: 'practice cut', min: 30 };
        else { const o = opts.find((q) => q.job.id === id); m.job = { jobId: o.job.id, index: o.index, label: o.stage.label, min: o.stage.min }; }
        m.checklist = {}; this.renderPanel();
      }));
      return;
    }
    if (d.kind === 'bench') { body.innerHTML = `<p><b>Job ${m.job.jobId}</b> · ${m.job.label} · ${m.job.min} min</p><p class="note">Bench work. You stand here and do it.</p><button class="cycle" id="cycleStart">START</button><button class="btn sm ghost" id="unload">PUT IT BACK</button>`;
      $('cycleStart').addEventListener('click', () => { this.hooks.cycleStart(m, []); this.closePanel(); });
      $('unload').addEventListener('click', () => { m.job = null; m.checklist = {}; this.renderPanel(); });
      return; }
    body.innerHTML = `<div class="row2"><span><b>${m.job.jobId ? `Job ${m.job.jobId}` : 'Practice'}</b> · ${m.job.label} · ${m.job.min} min</span><button class="btn sm ghost" id="unload">PUT IT BACK</button></div>
      <ul class="check">${steps.map(([k, t]) => `<li class="${cl[k] === true ? 'done' : cl[k] === 'skip' ? 'skipped' : ''}"><span>${cl[k] === true ? '✓ ' : cl[k] === 'skip' ? '✗ ' : '□ '}${t}</span>
        <span>${cl[k] ? '' : `<button data-do="${k}">DO IT</button> <button class="skip" data-skip="${k}">SKIP</button>`}</span></li>`).join('')}</ul>
      <button class="cycle" id="cycleStart">CYCLE START</button>
      <p class="note">Each step is a few seconds of work. Botch it and the step is skipped. Skipped steps are how crashes happen.</p>`;
    body.querySelectorAll('[data-do]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.do, step = steps.find((st) => st[0] === k);
      this.audio.click();
      body.innerHTML = '<div id="mg"></div>';
      playMinigame(step[2], { el: body.querySelector('#mg'), fatigue: s.fatigue || 0, audio: this.audio, label: step[1] }).then((r) => {
        if (!this.panelM) return;
        // won: done. won while tired: sometimes you only think it is done. lost: skipped.
        if (r.ok) cl[k] = this.fumble(0.5) ? 'thought' : true; else { cl[k] = 'skip'; s.stats.skipped++; }
        this.renderPanel();
      });
    }));
    body.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => { cl[b.dataset.skip] = 'skip'; s.stats.skipped++; this.audio.click(0.2, 400); this.renderPanel(); }));
    $('unload').addEventListener('click', () => { m.job = null; m.checklist = {}; this.audio.click(); this.renderPanel(); });
    $('cycleStart').addEventListener('click', () => {
      if (this.fumble(0.6)) { this.audio.nope(); this.toast(this.fumbleLine() + ' The red one. Nothing happened.', 2600); return; }
      this.hooks.cycleStart(m, steps.map(([k]) => k)); this.closePanel();
    });
  }
}
