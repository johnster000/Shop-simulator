// HUD, the clipboard, the machine panel. Honest HTML. No 3D UI.
import { MACHINES, byId } from './catalog.js';
import { money, clockText, buy, sell, canPower, poweredCount, afterHours, fatigueText, END_DAY_SPEED } from './sim.js';
import { SHOP } from './catalog.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(state, audio, hooks) {
    this.state = state; this.audio = audio; this.hooks = hooks; // hooks: { place(m), refreshMachines(), pause(), resume(), modal(bool) }
    this.toastTimer = 0; this.lastCash = null; this.tab = 'shop';
    $('shopSign').textContent = state.shopName;
    $('speeds').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; audio.click();
      if (b.id === 'endDay') { if (afterHours(state)) hooks.goHome(); else this.setSpeed(END_DAY_SPEED); return; }
      this.setSpeed(parseFloat(b.dataset.speed));
    });
    $('clipClose').addEventListener('click', () => this.closeClip());
    $('clipTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; this.showTab(b.dataset.tab); audio.paper(); });
    $('panelClose').addEventListener('click', () => this.closePanel());
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
    if (tab === 'shop') this.renderShop(); if (tab === 'machines') this.renderMachines(); if (tab === 'bank') this.renderBank();
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
    const steps = d.kind === 'bench' ? [] : [['clamp', 'Clamp the work'], ['indicate', d.kind === 'lathe' ? 'Indicate the chuck' : 'Indicate it in'], ['speed', 'Pick a speed']];
    const cl = m.checklist || (m.checklist = {});
    const body = $('panelBody');
    if (d.kind === 'bench') { body.innerHTML = `<p>A vise, a lamp, a drawer that sticks.</p><p class="note">Fitting, polishing and assembly happen here, once there is something to fit. There is not, yet. The next build brings the first contract.</p>`; return; }
    if (m.running) {
      body.innerHTML = `<p>Running. <span class="note">${d.manual ? 'You are standing here. That is the job.' : ''}</span></p>
        <div class="bar"><i style="width:${Math.round((1 - m.runLeft / m.runTotal) * 100)}%"></i></div>
        <p class="note">${Math.ceil(m.runLeft)} minutes to go. No contracts yet, so this is a practice cut on a scrap block. Chips are chips.</p>`;
      return;
    }
    body.innerHTML = `<div class="row2"><span>Condition</span><span>${Math.round(m.condition * 100)}% · ${m.hours.toFixed(1)} h on the clock · ${m.used ? 'used' : 'new'}</span></div>
      <div class="bar"><i style="width:${Math.round(m.condition * 100)}%"></i></div>
      <ul class="check">${steps.map(([k, t]) => `<li class="${cl[k] === true ? 'done' : cl[k] === 'skip' ? 'skipped' : ''}"><span>${cl[k] === true ? '✓ ' : cl[k] === 'skip' ? '✗ ' : '□ '}${t}</span>
        <span>${cl[k] ? '' : `<button data-do="${k}">DO IT</button> <button class="skip" data-skip="${k}">SKIP</button>`}</span></li>`).join('')}</ul>
      <button class="cycle" id="cycleStart">CYCLE START</button>
      <p class="note">Skipping steps is how crashes happen. The button does not know what you skipped. The machine finds out.</p>`;
    body.querySelectorAll('[data-do]').forEach((b) => b.addEventListener('click', () => {
      // tired: you are sure you did it. the machine will have an opinion.
      cl[b.dataset.do] = this.fumble(0.8) ? 'thought' : true; this.audio.click(); this.renderPanel();
    }));
    body.querySelectorAll('[data-skip]').forEach((b) => b.addEventListener('click', () => { cl[b.dataset.skip] = 'skip'; s.stats.skipped++; this.audio.click(0.2, 400); this.renderPanel(); }));
    $('cycleStart').addEventListener('click', () => {
      if (this.fumble(0.6)) { this.audio.nope(); this.toast(this.fumbleLine() + ' The red one. Nothing happened.', 2600); return; }
      this.hooks.cycleStart(m, steps.map(([k]) => k)); this.closePanel();
    });
  }
}
