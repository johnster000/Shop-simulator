// The render loop, the floor, the glue.
import { Shop } from './shop.js';
import { Player } from './player.js';
import { MachineView } from './machines.js';
import { Iso } from './iso.js';
import { UI } from './ui.js';
import { byId } from './catalog.js';
import { crewVerdict } from './events.js';
import { tick, save, money, post, goHome, hourText, END_DAY_SPEED, achieve, ACHIEVEMENTS as ACH, building, valuation, canRetire, tally, SAVE_KEY } from './sim.js';
import { stageDone, scrapJob, customerOf, makeRfq, TEMPLATES, CUSTOMERS, nextLabel, runnableStages } from './jobs.js';
import { Nav } from './nav.js';
import { Crew } from './crew.js';
import { Items, ITEM_KINDS } from './items.js';

const $ = (id) => document.getElementById(id);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function startShop(T, audio, state) {
  const params = new URLSearchParams(location.search);
  const speedMul = Math.max(0.1, parseFloat(params.get('speed')) || 1);

  const canvas = $('game');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;

  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x0b0d10, 0.012);
  const camera = new T.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 120);
  camera.rotation.order = 'YXZ';
  scene.add(camera);

  const shop = new Shop(T, scene, state.shopName, building(state));
  const player = new Player(T, camera, canvas);
  camera.position.set(shop.door.x - 1.5, 1.65, shop.hz - 3.0); player.yaw = 0.12;
  if (state.machines.some((m) => !m.placed)) setTimeout(() => ui.toast('Everything is on the floor by the doors. Place it all again, from the clipboard. The crew is watching.', 5000), 1500);
  const iso = new Iso(T, scene, shop, canvas);
  const views = state.machines.map((m) => new MachineView(T, scene, m));
  const viewOf = (uid) => views.find((v) => v.m.uid === uid);
  const nav = new Nav(shop.hx, shop.hz);
  const allColliders = () => [...shop.colliders, ...views.filter((v) => v.m.placed).map((v) => v.collider())];
  let crew = null;

  let modal = false, paused = false, placing = null, night = false;
  const ui = new UI(state, audio, {
    modal(on) { modal = on; if (!on && !iso.active && !paused && !night) player.requestLock(); },
    place(m) { beginPlace(m); },
    refreshMachines() { syncViews(); },
    toggleIso() { toggleIso(); },
    pause() { pause(); },
    cycleStart(m, keys) { cycleStart(m, keys); },
    goHome() { leaveForTheNight(); },
    shipped(j) { shop.setCrates(state.crates); unlock('one_out'); if (state.t >= 780) unlock('shipped_friday'); if (j && j.mold) { unlock('first_mold'); if (j.tryouts === 1 && !j.defects.length) unlock('t1_no_notes'); if ((state.day - 1) % 7 === 4 && state.t >= 720 && !state.storyFriday) { state.storyFriday = j.id; } } },
    crew() { return crew; },
    crewChanged() { crew.sync(); if (state.people.length) unlock('hired'); },
    achievement(a) { showAchievement(a); },
  });
  function showAchievement(a) { if (!a) return; ui.toast(`ACHIEVEMENT: ${a[0].toUpperCase()}`, 3400); audio.ding(); }
  function unlock(id) { showAchievement(achieve(state, id)); }
  crew = new Crew(T, scene, shop, nav, state, {
    machineViews: () => views,
    runMachine: (m, skipped, p) => runMachine(m, skipped, p),
    say: (p, text) => { crew.say(p, text); },
  });
  nav.rebuild(allColliders()); crew.sync();

  // ---- things to throw
  const items = new Items(T, scene, camera, audio, shop);
  for (let i = 0; i < 3; i++) items.make('scrap', shop.binPos.x + (i - 1) * 0.25, shop.binPos.z + (i % 2 ? 0.15 : -0.1), { y: 0.82 });
  items.make('coffee', shop.pcPos.x + 0.6, shop.pcPos.z + 0.1, { y: 0.77 });
  items.make('hammer', shop.pcPos.x - 0.6, shop.pcPos.z + 0.2, { y: 0.77 });
  items.make('key', shop.hx - 1.6, shop.hz - 1.9, { y: 0.0 });
  let steelItem = null;
  function syncSteel() {
    const want = state.jobs.some((j) => j.status === 'work' || j.status === 'material' && state.day >= j.materialDay);
    if (want && !steelItem) steelItem = items.make('steel', -shop.hx + 0.55, shop.hz * 0.45 - 0.6, { y: 1.24 });
    if (!want && steelItem && !steelItem.flying && items.held !== steelItem) { items.remove(steelItem); steelItem = null; }
  }
  const binRect = { x: shop.binPos.x, z: shop.binPos.z, hw: 0.5, hd: 0.4 };
  items.onHit = (it, what) => {
    const kind = it.kind, heavy = kind === 'scrap' || kind === 'steel';
    if (what.type === 'machine') {
      const m = state.machines.find((q) => q.uid === what.uid); if (!m) return; const d = byId(m.id);
      if (!heavy) { ui.toast(kind === 'coffee' ? `Coffee on the ${d.name.toLowerCase()}. It has had worse.` : `Clink. The ${d.name.toLowerCase()} did not notice.`); return; }
      if (d.cnc && what.speed > 5) { post(state, `Glazier: ${d.name} window`, -650); m.condition = Math.max(0, m.condition - 0.06); unlock('window'); ui.toast(`CRACK. The window on the ${d.name}. $650. The glazier comes Thursday.`, 4000); }
      else { m.condition = Math.max(0, m.condition - 0.02); ui.toast(pick([`CLANG. The ${d.name.toLowerCase()} has been hit by worse.`, `CLANG. A handwheel is slightly less round.`, 'CLANG. Nothing important. Probably.'])); if (Math.random() < 0.15) { post(state, 'Bent handwheel', -120); unlock('bent'); ui.toast('Bent a handwheel. $120. The crew saw. They will say they did not.', 3600); } }
      return;
    }
    if (what.type === 'person') {
      const p = state.people.find((q) => q.id === what.id); if (!p) return;
      if (heavy) {
        post(state, `WSIB: ${p.name}, claim and premium`, -2400); p.morale = Math.max(0, p.morale - 0.35); p.startDay = state.day + 3; p.crashes += 0;
        for (const q of state.people) if (q !== p) q.morale = Math.max(0, q.morale - 0.1);
        unlock('wsib'); tally(state, 'wsib'); ui.toast(`${p.name}: "OW. What is WRONG with you?" A WSIB claim, $2,400, and ${p.name} is off for three days. Everyone saw.`, 5000); crew.ouch(p);
      } else if (kind === 'coffee') { p.morale = Math.max(0, p.morale - 0.1); ui.toast(`${p.name}: "...thanks." Wet, and thinking about it.`, 3000); }
      else { post(state, 'First aid kit, restocked', -60); p.morale = Math.max(0, p.morale - 0.18); ui.toast(`${p.name}: "Hey!" A ${ITEM_KINDS[kind].label} to the shoulder. $60 of bandages and a long look.`, 3600); }
      return;
    }
    if (what.type === 'tarp') { ui.toast(pick(['Through the tarp. The tarp did not mind.', 'The tarp flapped. It always flaps.'])); return; }
    if (what.type === 'lot') { ui.toast(`${ITEM_KINDS[kind].label[0].toUpperCase() + ITEM_KINDS[kind].label.slice(1)}: now in the parking lot.${kind === 'steel' ? ' That was $90 of P20.' : ''}`, 3400); if (kind === 'steel') { post(state, 'A block of P20, in the parking lot', -90); items.remove(it); steelItem = null; } else if (kind !== 'scrap') items.remove(it); else { it.mesh.position.set(shop.binPos.x, 0.82, shop.binPos.z); } return; }
    if (what.type === 'spill') { unlock('wet_floor'); ui.toast(pick(['Coffee on the floor. Somebody will slip on that.', 'The coffee is on the floor now. It was the good coffee.']), 3000); setTimeout(() => { it.mesh.position.set(shop.pcPos.x + 0.6, 0.77, shop.pcPos.z + 0.1); }, 20000); return; }
    if (what.type === 'wall') { if (kind === 'coffee') ui.toast('Coffee on the block wall. It joins the others.'); return; }
  };
  function itemsAtRest() { for (const it of items.items) if (it.kind === 'scrap' && !it.flying && it.thrownBy && !it.scored) { it.scored = true; const m = it.mesh.position; if (Math.abs(m.x - binRect.x) < binRect.hw && Math.abs(m.z - binRect.z) < binRect.hd && it.throwDist > 4) { unlock('three_pointer'); ui.toast('Nothing but net. From downtown.', 3000); audio.ding(); } } }
  // the hammer
  function whack(m) {
    const d = byId(m.id);
    audio.thunk(); audio.noise(0.2, 2000, 0.12, 'bandpass', 2);
    unlock('percussive');
    if (m.running) { m.running = false; m.runLeft = 0; m.checklist = {}; const j = m.job; m.job = null; ui.toast(`WHACK. The ${d.name.toLowerCase()} stopped mid-cut. ${j && j.jobId ? `Job ${j.jobId}'s stage has to be reloaded.` : ''}`, 4000); return; }
    if (Math.random() < 0.2) { m.condition = Math.min(1, m.condition + 0.08); ui.toast(pick(['WHACK. It... sounds better? Percussive maintenance. Do not ask why.', 'WHACK. Something inside clicked back into place. Nobody will ever know what.']), 3600); audio.ding(); }
    else { const bill = d.cnc ? 1200 : 120; post(state, d.cnc ? 'Pendant screen, replaced' : 'Bent handwheel', -bill); m.condition = Math.max(0, m.condition - 0.08); ui.toast(d.cnc ? `WHACK. The pendant screen is a spiderweb now. ${money(bill)}.` : `WHACK. A handwheel is bent and the ${d.name.toLowerCase()} is sulking. ${money(bill)}.`, 4000); }
  }
  shop.setCrates(state.crates || 0); shop.setScrap(state.scrapCount || 0);
  $('hud').classList.remove('hidden');

  function syncViews() {
    for (const v of views.slice()) if (!state.machines.includes(v.m)) { v.dispose(); views.splice(views.indexOf(v), 1); }
    for (const m of state.machines) if (!viewOf(m.uid)) views.push(new MachineView(T, scene, m));
    for (const v of views) v.sync();
    nav.rebuild(allColliders());
  }

  // ---- views
  function toggleIso() {
    if (modal) return;
    if (iso.active) { iso.exit(); endPlace(); player.enabled = true; player.requestLock(); }
    else { if (player.locked) document.exitPointerLock(); player.enabled = false; iso.enter(); }
    audio.click();
  }
  const placeBar = $('placeBar'), placeMsg = $('placeMsg'), placeOk = $('placeOk');
  function beginPlace(m) {
    if (!iso.active) { if (player.locked) document.exitPointerLock(); player.enabled = false; iso.enter(); }
    placing = m; iso.begin(m, views); placeBar.classList.remove('hidden');
    ui.toast(m.placed ? 'Pick a new spot.' : 'It is on the truck. Where does it go?');
  }
  function endPlace() { placing = null; placeBar.classList.add('hidden'); }
  iso.onChange = () => {
    const d = byId(placing.id);
    placeMsg.textContent = iso.valid ? `${d.brand} ${d.name} here?` : iso.why;
    placeMsg.classList.toggle('bad', !iso.valid); placeOk.disabled = !iso.valid;
  };
  iso.onConfirm = (m, x, z, rot) => {
    m.x = x; m.z = z; m.rot = rot; m.placed = true; syncViews(); endPlace();
    audio.thunk();
    ui.toast(pick(['Placed. It is not level. It is never level.', 'Placed. The riggers want cash.', 'Placed. Somebody will trip on that cord.', 'Placed. It looks right there. For now.']));
    save(state);
    const unplaced = state.machines.find((q) => !q.placed);
    if (unplaced) setTimeout(() => beginPlace(unplaced), 400);
  };
  function cancelPlace() {
    if (!placing) return;
    const wasPlaced = placing.placed; iso.cancel(); endPlace();
    ui.toast(wasPlaced ? 'Left where it was.' : 'Left on the truck. Place it from the clipboard.');
  }
  iso.onPick = (uid) => { const m = state.machines.find((q) => q.uid === uid); if (m && !m.running && !(m.job && m.job.operator && m.job.operator !== 'owner')) beginPlace(m); else if (m) ui.toast('It is busy. Let it finish.'); };
  iso.onPickPerson = (id) => { const p = state.people.find((q) => q.id === id); if (p) ui.openPerson(p); };
  $('placeRot').addEventListener('click', () => { iso.rotate(); audio.click(); });
  $('placeOk').addEventListener('click', () => { if (ui.fumble(0.5)) { iso.rotate(); audio.click(); ui.toast(ui.fumbleLine() + ' It turned instead.'); return; } if (!iso.confirm()) audio.nope(); });
  $('placeNo').addEventListener('click', () => { cancelPlace(); audio.click(); });

  // ---- the machine
  function cycleStart(m, keys) {
    const skipped = keys.filter((k) => m.checklist[k] !== true).length;
    if (!m.job) m.job = { jobId: 0, index: -1, label: 'practice cut', min: 30 };
    m.job.operator = 'owner';
    runMachine(m, skipped, null);
    if (byId(m.id).cnc) unlock('first_cnc');
    if (!state.firstCycle) { state.firstCycle = true; unlock('first_cycle'); }
    else ui.toast(skipped ? pick(['You skipped a step. The machine noticed.', 'Bold.', 'That is how it starts.']) : pick(['Chips.', 'Making chips.', 'Nothing wrong with that.']));
  }
  // start a cycle on machine m with `skipped` setup steps undone, by person p (null: the owner)
  function runMachine(m, skipped, p) {
    const def = byId(m.id);
    audio.cycleStart();
    const risk = def.kind === 'bench' ? 0.02 : skipped * 0.18 + (1 - m.condition) * 0.12;
    m.running = true; m.runTotal = m.job.min * (def.speed || 1) * (0.9 + Math.random() * 0.25) * (p ? 1.4 - Math.min(5, (p.actual[{ mill: 'mill', lathe: 'lathe', grinder: 'grind', bench: 'bench' }[def.kind] || 'general'] || 0)) * 0.1 : 1); m.runLeft = m.runTotal; // shop minutes
    state.stats.cycleStarts++;
    const who = p ? p.name : 'You';
    const jobNow = m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
    if (jobNow && def.kind === 'spot') jobNow.spotted = true;
    if (jobNow && def.kind === 'bench' && m.job.label === 'Fit and spot') { jobNow.risk = (jobNow.risk || 0) + 0.1; ui.toast('Fit and spot at the bench, with bluing and a straightedge. A press would be better. The flash will tell you.', 3600); }
    if (def.kind === 'vmc' && /electrode/i.test(m.job.label) && !state.facility.dust) { m.condition = Math.max(0, m.condition - 0.03); for (const q of state.people) q.morale = Math.max(0, q.morale - 0.02); ui.toast('Graphite on the VMC. Black dust in the ways, the coffee, and everyone\'s nose. A vacuum is $2,800.', 4200); }
    if (Math.random() < risk) {
      const sev = Math.random();
      setTimeout(() => {
        if (!m.running) return;
        m.running = false; m.runLeft = 0; m.checklist = {};
        const job = m.job && m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
        const jobItem = m.job ? m.job.itemIndex : 0, jobItemName = m.job && m.job.item && job && job.mold ? ' ' + m.job.item.toLowerCase() : '';
        m.job = null;
        audio.thunk(); audio.nope();
        if (p) { p.crashes++; p.morale = Math.max(0, p.morale - 0.06); }
        const blame = p ? ` ${p.name} says it was like that.` : '';
        if (sev < 0.6) { const c = def.cnc ? 180 : 45; post(state, 'Broken cutter', -c); m.condition = Math.max(0, m.condition - 0.01); ui.toast(`BANG. Broken cutter on the ${def.name.toLowerCase()}. ${money(c)}. The part is fine. Load it again.${blame}`, 4000); }
        else if (sev < 0.9) {
          m.condition = Math.max(0, m.condition - 0.04);
          if (job) { scrapJob(state, job, jobItem); shop.setScrap(state.scrapCount); unlock('oops'); ui.toast(`Chatter. Job ${job.id}${jobItemName} is scrap. ${money(job.material)} of ${job.steel} in the bin. Start over. OOPS.${blame}`, 4500); }
          else { post(state, 'Chatter, scrapped block', -40); state.scrapCount++; shop.setScrap(state.scrapCount); ui.toast(`Chatter. The scrap block is more scrap now. OOPS.${blame}`, 4000); }
        }
        else { const bill = def.manual ? 900 : 4000 + Math.round(Math.random() * 6000); post(state, 'Crash: tech visit', -bill); unlock('oops'); crew.gatherRound(m.x, m.z); m.condition = Math.max(0, m.condition - 0.2); if (job) { scrapJob(state, job, jobItem); shop.setScrap(state.scrapCount); } ui.toast(`Crash on the ${def.name.toLowerCase()}. A tech has to come. ${money(bill)}.${job ? ` Job ${job.id}${jobItemName} is scrap too.` : ''}${blame} He arrives Thursday.`, 4500); }
      }, 1500 + Math.random() * 6000);
    }
  }

  // what the whiteboard says. the real schedule.
  function whiteboardLines() {
    const lines = ['TO DO:'];
    const due = state.jobs.filter((j) => j.status === 'work' || j.status === 'ready').sort((a, b) => a.dueDay - b.dueDay).slice(0, 2);
    for (const j of due) lines.push(`- job ${j.id} due day ${j.dueDay}${state.day > j.dueDay ? ' !!!' : ''}`);
    if (!state.facility.door) lines.push('- fix the door');
    const g = state.people.find((p) => p.grievance); if (g) lines.push(`- talk to ${g.name}`);
    if (!state.machines.length) lines.push('- buy a mill');
    if (state.cash < 5000) lines.push('- MONEY');
    lines.push(pick(['- coffee', '- radio: NO', '- sweep', '- call Rick back (no)', '- order end mills']));
    return lines.slice(0, 6);
  }
  shop.setWhiteboard(whiteboardLines());

  // ---- lights out. CNC machines keep cutting after you lock up. Manual ones wait for a person.
  function runLightsOut() {
    const notes = [];
    const nightMin = (24 * 60 - (7 * 60 + state.t)) + 7 * 60; // minutes until 7:00 tomorrow
    for (const m of state.machines) {
      const def = byId(m.id); if (!m.running) continue;
      if (!def.cnc) { notes.push(`${def.brand} ${def.name}: stopped where it was. Manual machines do not run without a person.`); continue; }
      const hours = Math.min(m.runLeft, nightMin) / 60;
      const pBreak = (state.facility.toolbreak ? 0.004 : 0.016) * (1.3 - m.condition * 0.5), pFire = def.kind === 'sinker' ? (state.facility.fire ? 0.00005 : 0.0006) : 0;
      let broke = -1, fire = false;
      for (let h = 0; h < hours; h++) { if (Math.random() < pFire) { fire = true; broke = h; break; } if (Math.random() < pBreak) { broke = h; break; } }
      const job = m.job && m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
      if (fire) {
        const fireItem = m.job ? m.job.itemIndex : 0;
        m.running = false; m.runLeft = 0; m.condition = 0.05; m.job = null; m.checklist = {};
        post(state, 'Fire: smoke damage, dielectric, a very long form', -8500);
        if (job) { scrapJob(state, job, fireItem); shop.setScrap(state.scrapCount); }
        notes.push(`The sinker caught fire at ${hourText((state.t + broke * 60) % 1440)}. The fire department has questions. $8,500 and the machine is a shell.${job ? ` Job ${job.id} is ash.` : ''}`);
        unlock('candle'); unlock('lights_wrong');
      } else if (broke >= 0) {
        m.running = false; m.runLeft = m.runLeft; m.checklist = {}; // the stage is not done; it must be reloaded and finished
        post(state, 'Broken cutter, overnight', -180);
        notes.push(`${def.brand} ${def.name}: a tool broke ${broke + 1} hour${broke ? 's' : ''} in and the machine cut air until morning. The block is fine. ${Math.round(m.runLeft)} minutes still to run.`);
        unlock('lights_wrong');
      } else if (m.runLeft <= nightMin) {
        m.runLeft = 0; m.running = false; m.hours += hours;
        if (job) { const finished = stageDone(state, job, m.job.itemIndex, m.job.index); if (finished) { shop.setCrates(state.crates); } notes.push(`${def.brand} ${def.name} finished ${m.job.label.toLowerCase()}${m.job.item && job.mold ? ' on the ' + m.job.item.toLowerCase() : ''} on job ${job.id} overnight.${finished ? ' It is done. Ship it.' : ''}`); }
        else notes.push(`${def.brand} ${def.name} finished overnight.`);
        m.job = null; m.checklist = {}; unlock('lights_out');
      } else { m.runLeft -= nightMin; m.hours += hours; notes.push(`${def.brand} ${def.name} ran all night. ${Math.round(m.runLeft)} minutes to go.`); }
    }
    return notes;
  }

  // ---- five o'clock, and the night
  const closingEl = $('closing'), nightEl = $('night');
  let nightTimer = 0, retireNow = false;
  // ---- the retirement paper. ten years in, every year-end offers it. the pause screen does too.
  const retireEl = $('retire');
  function openRetire() {
    const v = valuation(state), y = Math.floor((state.day - 1) / 260), shipped = state.jobs.filter((j) => j.status === 'shipped'), molds = shipped.filter((j) => j.mold).length;
    const row = (k, n, cls = '') => `<tr class="${cls}"><td>${k}</td><td class="num">${money(n)}</td></tr>`;
    $('retireShop').textContent = `${state.shopName} · ${y} year${y === 1 ? '' : 's'} · day ${state.day}`;
    $('retireBody').innerHTML = `<h4>THE NUMBERS</h4><table>${row('Cash', v.cash)}${row('Machines, at what a dealer would give you', v.machines)}${row('Owed to you, on terms', v.receivables)}${row('Half of what is still on the floor', v.backlog)}${row('The bank', -v.debt)}${row('THE SHOP IS WORTH', v.total, 'total')}</table>
      <h4>THE RECORD</h4><div>${shipped.length} job${shipped.length === 1 ? '' : 's'} shipped, ${molds} mold${molds === 1 ? '' : 's'}. ${state.stats.cycleStarts} cycle starts. ${state.scrapCount} scrapped block${state.scrapCount === 1 ? '' : 's'}. ${state.stats.skipped} setup step${state.stats.skipped === 1 ? '' : 's'} skipped and regretted. ${state.people.length} on the crew at the end. Reputation ${Math.round(state.rep * 100)}. ${(state.achievements || []).length} thing${(state.achievements || []).length === 1 ? '' : 's'} on the wall.</div>
      <h4>WHAT THE CREW SAID AT THE PARTY</h4><ul class="verdict">${crewVerdict(state).map((l) => `<li>${l}</li>`).join('')}</ul>
      <h4>THE OFFER</h4><div>${v.total > 2000000 ? 'A group from out of town wants the shop, the name, and the crew. They will change the name.' : v.total > 500000 ? 'Your best moldmaker and the bank have an offer. It is low. It is also real.' : v.total > 0 ? 'The guy with the flatbed will take the machines. The landlord will take the keys.' : 'The bank has an offer. It is not for you.'}</div>`;
    retireEl.classList.remove('hidden'); modal = true; audio.paper();
  }
  $('retireBtn').addEventListener('click', openRetire);
  $('retireNo').addEventListener('click', () => { retireEl.classList.add('hidden'); audio.click(); if (!night) { modal = false; } });
  $('retireYes').addEventListener('click', () => {
    achieve(state, 'retired'); const kept = (state.achievements || []).slice();
    try { localStorage.removeItem(SAVE_KEY); localStorage.setItem('shopsim.wall', JSON.stringify(kept)); } catch (e) { /* fine */ }
    retireEl.classList.add('hidden'); nightEl.classList.remove('hidden'); nightEl.classList.remove('fade');
    $('nightShop').textContent = state.shopName.toUpperCase(); nightEl.querySelector('h2').textContent = 'SOLD.'; $('nightClock').textContent = money(valuation(state).total); $('wakeBtn').classList.add('hidden'); $('retireBtn').classList.add('hidden');
    $('nightLine').textContent = pick(['The new owner painted over the sign on the first day. The compressor did not notice.', 'You drove past the shop on Sunday to check the door. Habit. It was fine.', 'The crew kept the radio station. That was the condition.']) + ' Thank you for playing.';
    setTimeout(() => location.reload(), 7000);
  });
  $('pauseRetire').addEventListener('click', () => { openRetire(); });
  function closingTime() {
    if (modal || paused) return;
    ui.setSpeed(0);
    if (player.locked) document.exitPointerLock(); player.enabled = false;
    const running = state.machines.filter((m) => m.running), cnc = running.filter((m) => byId(m.id).cnc).length, man = running.length - cnc;
    $('closingLine').textContent = running.length ? `${cnc ? `${cnc} CNC${cnc > 1 ? 's' : ''} will keep cutting tonight. ` : ''}${man ? `${man} manual machine${man > 1 ? 's' : ''} will stop where ${man > 1 ? 'they are' : 'it is'}. ` : ''}` : pick(['The compressor would like to be alone.', 'Nobody is waiting for you at home. The compressor knows that.', 'Go home. The chips will be here tomorrow.']);
    closingEl.classList.remove('hidden'); modal = true;
  }
  $('stayBtn').addEventListener('click', () => { closingEl.classList.add('hidden'); modal = false; ui.setSpeed(1); audio.click(); ui.toast('Overtime. The lights hum a little louder.', 2600); if (!iso.active) { player.enabled = true; player.requestLock(); } });
  $('homeBtn').addEventListener('click', () => { closingEl.classList.add('hidden'); modal = false; leaveForTheNight(); });
  function leaveForTheNight() {
    if (night) return;
    night = true; modal = true; ui.setSpeed(0);
    if (player.locked) document.exitPointerLock(); player.enabled = false;
    if (iso.active) { iso.exit(); endPlace(); }
    ui.closeClip(); ui.closePanel(); modal = true;
    const leftMin = state.t;
    crew.night();
    const lightsOut = runLightsOut();
    const n = goHome(state); save(state);
    if (lightsOut.length) n.notes = (n.notes || []).concat(lightsOut);
    $('nightShop').textContent = state.shopName.toUpperCase(); nightEl.querySelector('h2').textContent = 'HOME.';
    $('nightClock').textContent = n.leftAt;
    const line = n.fatigue >= 0.6 ? `You left at ${n.leftAt}. ${n.sleep.toFixed(1)} hours of sleep. Tomorrow is going to be a day.`
      : n.fatigue >= 0.25 ? `You left at ${n.leftAt}. ${n.sleep.toFixed(1)} hours of sleep. Not enough. You will feel it.`
      : n.overtime > 0 ? `You left at ${n.leftAt}. Late, but you slept.` : pick(['You left at five. The compressor kept going.', 'Dinner. Television. A thought about the mill. Sleep.', 'You dreamed about the tarp door. It flapped.']);
    retireNow = false; $('retireBtn').classList.add('hidden');
    if (n.year) {
      const y = n.year, onTime = y.onTime + y.late ? `${Math.round((100 * y.onTime) / (y.onTime + y.late))}% on time. ` : '';
      $('nightLine').textContent = `YEAR ${y.year} IS DONE. ${y.shipped} job${y.shipped === 1 ? '' : 's'} shipped, ${y.molds} mold${y.molds === 1 ? '' : 's'}. ${onTime}${money(y.revenue)} in. ${y.hired} hired, ${y.left} quit; ${y.people} on the crew, ${y.machines} machine${y.machines === 1 ? '' : 's'}, ${y.crashes} scrapped block${y.crashes === 1 ? '' : 's'}. Reputation ${y.rep}.${y.best ? ` Best day: ${y.best}.` : ''}${y.worst ? ` Worst: ${y.worst}.` : ''} The shop is worth ${money(y.valuation.total)}. ${y.line}${y.retire ? ' Ten years. There is a second button tonight.' : ''}`;
      unlock('year'); if (y.retire) retireNow = true;
    }
    else $('nightLine').textContent = (n.weekend ? pick(['The weekend. Two days. You thought about the shop both of them. ', 'Saturday: errands. Sunday: the drive past the shop to check the door. ', 'The weekend. The compressor ran the whole time, for nobody. ']) : '') + line + (n.week ? ` Monday: rent ${money(n.week.rent)}, hydro ${money(n.week.power)}.` : '') + (n.notes && n.notes.length ? ' Overnight: ' + n.notes.join(' ') : '');
    $('wakeBtn').classList.add('hidden');
    nightEl.classList.remove('hidden'); nightEl.classList.remove('fade');
    // the clock runs through the night
    const start = performance.now(), dur = 5000, from = leftMin, to = 24 * 60 - 7 * 60 + 0; // to 7:00 next day, in minutes after 7:00
    const run = () => {
      const k = Math.min(1, (performance.now() - start) / dur);
      const mins = from + (to - from) * (k * k * (3 - 2 * k));
      $('nightClock').textContent = hourText(mins % (24 * 60));
      if (k < 1) nightTimer = requestAnimationFrame(run); else { $('nightClock').textContent = '7:00'; $('wakeBtn').classList.remove('hidden'); if (retireNow) { $('wakeBtn').textContent = 'ONE MORE YEAR'; $('retireBtn').classList.remove('hidden'); } else $('wakeBtn').textContent = 'BACK TO WORK'; }
    };
    run();
  }
  $('wakeBtn').addEventListener('click', () => {
    if (state.moved) { state.moved = false; save(state); try { localStorage.setItem('shopsim.resume', '1'); } catch (e) { /* fine */ } location.reload(); return; }
    nightEl.classList.add('fade'); audio.paper();
    setTimeout(() => { nightEl.classList.add('hidden'); night = false; modal = false; ui.setSpeed(1); player.enabled = true; player.requestLock(); }, 1200);
    camera.position.set(shop.door.x - 1.5, 1.65, shop.hz - 3.0); player.yaw = 0.12;
    shop.setWhiteboard(whiteboardLines());
    if (state.fatigue >= 0.25) ui.toast(state.fatigue >= 0.6 ? 'Day ' + state.day + '. You are wrecked. Read every button twice.' : 'Day ' + state.day + '. Tired. Coffee first.', 3500);
    else if ((state.day - 1) % 7 === 0) ui.toast('Monday. ' + pick(['The rent went out before you did.', 'Resumes on the desk.', 'The tarp survived the weekend.']), 2800);
    else ui.toast('Day ' + state.day + '. ' + pick(['The compressor is already going.', 'Fresh. For now.', 'The tarp let the night in.']), 2600);
  });

  // ---- interaction
  const ray = new T.Raycaster(); const centre = new T.Vector2(0, 0);
  let lookAt = null;
  function look() {
    if (iso.active || modal) { ui.hint(''); ui.tag(''); lookAt = null; return; }
    ray.setFromCamera(centre, camera);
    const hits = ray.intersectObjects(scene.children, true);
    lookAt = null;
    for (const h of hits) {
      if (h.distance > 3.2) break;
      const i = h.object.userData.interact; if (!i || i.type === 'floor') continue;
      lookAt = i; break;
    }
    if (!lookAt) {
      // forgiving: a machine right in front of you counts, even if the dot is a little off
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
      let best = null, bestD = 3.0;
      for (const v of views) {
        if (!v.m.placed) continue;
        const dx = v.m.x - camera.position.x, dz = v.m.z - camera.position.z, d = Math.hypot(dx, dz);
        if (d < bestD && (dx * fx + dz * fz) / (d || 1) > 0.7) { best = v; bestD = d; }
      }
      if (best) lookAt = { type: 'machine', uid: best.m.uid };
      // or a thing on the floor or a bench right in front of you
      if (!lookAt && !items.held) { let bi = null, bd = 1.7; for (const it of items.items) { if (it.flying) continue; const dx = it.mesh.position.x - camera.position.x, dz = it.mesh.position.z - camera.position.z, d = Math.hypot(dx, dz); if (d < bd && (dx * fx + dz * fz) / (d || 1) > 0.75) { bd = d; bi = it; } } if (bi) lookAt = { type: 'item', kind: bi.kind, ref: bi, text: ITEM_KINDS[bi.kind].hint }; }
      // or the radio
      if (!lookAt) { const r = { x: -shop.hx + 0.55, z: shop.hz * 0.45 + 1.0 }; const dx = r.x - camera.position.x, dz = r.z - camera.position.z, d = Math.hypot(dx, dz); if (d < 1.6 && (dx * fx + dz * fz) / (d || 1) > 0.7) lookAt = { type: 'radio', text: 'the radio. one station. argued over.' }; }
      // or the office PC, when you are standing at the desk
      if (!lookAt) { const dx = shop.pcPos.x - camera.position.x, dz = shop.pcPos.z - camera.position.z, d = Math.hypot(dx, dz); if (d < 1.8 && (dx * fx + dz * fz) / (d || 1) > 0.6) lookAt = { type: 'pc', text: 'the office PC. quotes, bills, the inbox.' }; }
      // or a person standing right there
      for (const v of crew.views.values()) {
        if (!v.g.visible) continue;
        const dx = v.pos.x - camera.position.x, dz = v.pos.z - camera.position.z, d = Math.hypot(dx, dz);
        if (d < Math.min(bestD, 2.4) && (dx * fx + dz * fz) / (d || 1) > 0.8) { bestD = d; lookAt = { type: 'person', id: v.p.id }; }
      }
    }
    if (!lookAt) { ui.tag(''); ui.hint(items.held ? `holding ${ITEM_KINDS[items.held.kind].label} · click to throw · G to put it down` : ''); return; }
    if (lookAt.type === 'item') { ui.tag(''); ui.hint(items.held ? 'click to throw' : `pick up the ${ITEM_KINDS[lookAt.kind].label}`); return; }
    if (items.held && items.held.kind === 'hammer' && lookAt.type === 'machine') { const m = state.machines.find((q) => q.uid === lookAt.uid), d = byId(m.id); ui.tag(`${d.brand.toUpperCase()} ${d.name.toUpperCase()}`); ui.hint('WHACK IT'); return; }
    if (items.held) { ui.hint('click to throw'); ui.tag(lookAt.type === 'person' ? (state.people.find((q) => q.id === lookAt.id) || {}).name : ''); return; }
    if (lookAt.type === 'machine') {
      const m = state.machines.find((q) => q.uid === lookAt.uid), d = byId(m.id);
      const op = m.job && m.job.operator && m.job.operator !== 'owner' ? state.people.find((q) => q.id === m.job.operator) : null;
      ui.tag(`${d.brand.toUpperCase()} ${d.name.toUpperCase()} · ${m.running ? 'RUNNING' : 'IDLE'} · ${Math.round(m.condition * 100)}%${op ? ' · ' + op.name.toUpperCase() : ''}`);
      ui.hint(d.kind === 'bench' ? 'bench' : m.running ? 'running' : 'use');
    } else if (lookAt.type === 'person') {
      const p = state.people.find((q) => q.id === lookAt.id);
      if (p) { ui.tag(`${p.name.toUpperCase()} · ${p.roleName.toUpperCase()} · ${crew.status(p)}`); ui.hint('talk'); }
    } else { ui.tag(''); ui.hint(lookAt.text || lookAt.type); }
  }
  function use() {
    if (items.held) {
      if (items.held.kind === 'hammer' && lookAt && lookAt.type === 'machine') { const m = state.machines.find((q) => q.uid === lookAt.uid); whack(m); return; }
      const it = items.throw(1); if (it) { it.throwDist = 0; it.from = { x: camera.position.x, z: camera.position.z }; }
      return;
    }
    if (lookAt && lookAt.type === 'item') { items.pickUp(lookAt.ref); return; }
    if (!lookAt) return;
    audio.click();
    if (lookAt.type === 'machine') { const m = state.machines.find((q) => q.uid === lookAt.uid); if (m.job && m.job.operator && m.job.operator !== 'owner' && !m.running) { ui.toast(`${state.people.find((q) => q.id === m.job.operator).name} is setting this one up.`); return; } if (player.locked) document.exitPointerLock(); ui.openPanel(m); return; }
    if (lookAt.type === 'person') { const p = state.people.find((q) => q.id === lookAt.id); if (p) { if (player.locked) document.exitPointerLock(); ui.openPerson(p); } return; }
    if (lookAt.type === 'crate') { ui.toast('Finished work. Ship it from the clipboard, JOBS tab.'); return; }
    if (lookAt.type === 'pc') { if (player.locked) document.exitPointerLock(); ui.openPC(); return; }
    if (lookAt.type === 'tarp') { audio.tarp(); ui.toast(pick(['It flaps.', 'A real door is on the list.', 'It let the winter in last year too.'])); return; }
    if (lookAt.type === 'compressor') { ui.toast(pick(['It came with the shop.', 'It has not stopped.', 'It is doing its best.'])); return; }
    if (lookAt.type === 'chair') { audio.noise(0.2, 2200, 0.08, 'bandpass', 3); ui.toast('Squeak.'); return; }
    if (lookAt.type === 'sign') { ui.toast(`${state.shopName}. That is you.`); return; }
    if (lookAt.type === 'bin') { audio.thunk(); ui.toast('Empty. Enjoy it.'); return; }
    if (lookAt.type === 'whiteboard') { ui.toast('The real schedule.'); return; }
    if (lookAt.type === 'panel') { ui.toast('200 amps. Two machines. Then the electrician.'); return; }
    if (lookAt.type === 'rack') { ui.toast('Steel goes here. When there is steel.'); return; }
    if (lookAt.type === 'radio') {
      const stations = ['classic rock', 'country', 'talk', 'the French station', 'static'];
      state.radio = ((state.radio || 0) + 1) % stations.length; const st = stations[state.radio];
      audio.tick(0.1, 1500); ui.toast(`The radio: ${st}.`);
      for (const q of state.people) { const likes = (q.id + state.radio) % 3 === 0; q.morale = Math.max(0, Math.min(1, q.morale + (likes ? 0.04 : -0.03))); if (Math.random() < 0.5) crew.say(q, likes ? pick(['Finally.', 'Leave it there.', 'Now we are talking.']) : pick(['Who changed that?', 'No.', 'Put it back.', 'Not this again.'])); }
      return;
    }
    if (lookAt.type === 'jack') { ui.toast('It lifts 5,000 lb. A mold base is 6,000.'); return; }
  }
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || iso.active || modal || paused) return;
    if (player.touch) return;
    if (!player.locked && !player.dragLook) { player.enabled = true; player.requestLock(); return; }
    if (player.dragLook && player.dragMoved > 6) return;
    use();
  });
  player.onTap = () => { if (!modal && !paused && !iso.active) use(); };
  player.onStep = () => audio.step();

  // ---- enter / pause
  const enter = $('enter'), pauseEl = $('pause');
  enter.classList.remove('hidden');
  enter.addEventListener('click', () => { enter.classList.add('hidden'); audio.init(); audio.resume(); player.enabled = true; player.requestLock(); });
  player.onDragFallback = () => ui.toast('No pointer lock here. Drag to look.', 3000);
  player.onLockRetry = () => { if (!modal && !paused && !iso.active) ui.toast('click to look around again', 1500); };
  function pause() { if (paused) return; paused = true; if (player.locked) document.exitPointerLock(); player.enabled = false; pauseEl.classList.remove('hidden'); $('pauseShop').textContent = state.shopName.toUpperCase(); $('pauseWall').innerHTML = (state.achievements || []).length ? `<b>THE WALL</b> · ${state.achievements.map((id) => (ACH[id] || [id])[0]).join(' · ')}` : 'The wall is empty. Press a green button.'; $('pauseNote').textContent = `day ${state.day} · ${state.machines.length} machine${state.machines.length === 1 ? '' : 's'} · ${money(state.cash)} · worth ${money(valuation(state).total)}`; $('pauseRetire').classList.toggle('hidden', !canRetire(state)); }
  function resume() { paused = false; pauseEl.classList.add('hidden'); if (!iso.active) { player.enabled = true; player.requestLock(); } }
  $('resumeBtn').addEventListener('click', resume);
  $('saveBtn').addEventListener('click', () => { $('pauseNote').textContent = save(state) ? 'saved. the shop will be here tomorrow.' : 'could not save. this browser is being difficult.'; audio.paper(); });
  $('quitBtn').addEventListener('click', () => { save(state); location.reload(); });
  document.addEventListener('pointerlockchange', () => { if (!player.locked && player.enabled && !modal && !paused && !iso.active && !player.dragLook && player.everLocked) pause(); });

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.code === 'Escape') {
      if (ui.panelOpen) { ui.closePanel(); return; }
      if (ui.personOpen) { ui.closePerson(); return; }
      if (ui.clipOpen) { ui.closeClip(); return; }
      if (placing) { cancelPlace(); return; }
      if (iso.active) { toggleIso(); return; }
      if (night || !closingEl.classList.contains('hidden')) return;
      if (paused) resume(); else if (!player.locked) pause();
      return;
    }
    if (paused) return;
    if (e.code === 'Tab') { e.preventDefault(); if (ui.panelOpen) return; if (ui.clipOpen) ui.closeClip(); else { if (player.locked) document.exitPointerLock(); ui.openClip(); } }
    if (e.code === 'KeyV' && !modal) toggleIso();
    if (placing) {
      if (e.code === 'KeyR') { iso.rotate(); audio.click(); }
      if (e.code === 'Enter') { if (!iso.confirm()) audio.nope(); }
      if (e.code === 'ArrowLeft') iso.nudge(-0.5, 0); if (e.code === 'ArrowRight') iso.nudge(0.5, 0);
      if (e.code === 'ArrowUp') iso.nudge(0, -0.5); if (e.code === 'ArrowDown') iso.nudge(0, 0.5);
      return;
    }
    if (e.code === 'KeyE' && !modal && !iso.active) use();
    if (e.code === 'KeyG' && !modal && !iso.active && items.held) { items.drop(); audio.tick(0.08, 500); }
    if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') { if (!modal) ui.setSpeed({ Digit1: 1, Digit2: 2, Digit3: 3 }[e.code]); }
    if (e.code === 'KeyP' || e.code === 'Space') { if (!modal) ui.setSpeed(state.speed ? 0 : 1); }
    if (e.code === 'KeyN' && !modal && !night) { $('endDay').click(); }
  });

  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); iso.fit(); });

  // ---- loop
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused && !modal) {
      const events = tick(state, dt * speedMul);
      for (const ev of events) {
        if (ev.type === 'closing') closingTime();
        if (ev.type === 'hardstop') { ui.toast('Eleven o\'clock. You cannot keep your eyes open.', 2500); setTimeout(() => leaveForTheNight(), 1200); }
        if (ev.type === 'cycleDone') {
          audio.ding(); const v = viewOf(ev.uid); const m = v && v.m;
          const op = m && m.job && m.job.operator && m.job.operator !== 'owner' ? state.people.find((q) => q.id === m.job.operator) : null;
          const who = op ? op.name + ' finished' : 'Done:';
          if (m && m.job && m.job.jobId) {
            const job = state.jobs.find((j) => j.id === m.job.jobId);
            const finished = job ? stageDone(state, job, m.job.itemIndex, m.job.index) : false;
            if (finished) { shop.setCrates(state.crates); ui.toast(`Job ${job.id} is done${op ? ` (${op.name} did the last of it)` : ''}. ${customerOf(job.customer).name} is waiting. Ship it from the clipboard.`, 4000); }
            else if (job) ui.toast(`${who} ${m.job.label.toLowerCase()}${m.job.item && job.mold ? ' on the ' + m.job.item.toLowerCase() : ''}. Next: ${nextLabel(job)}.`, 3600);
          } else if (v) ui.toast(`${v.def.brand} ${v.def.name}: done. A perfectly good scrap block, slightly smaller.`, 3000);
          if (m) m.job = null;
        }
      }
      if (state.speed === END_DAY_SPEED && state.t >= 600 && !state.closingShown) closingTime();
      // the owner at the PC, designing
      const pc = state.pc;
      if (pc && pc.running) {
        pc.runLeft -= (dt * speedMul * state.speed) / 60;
        if (pc.runLeft <= 0) { pc.running = false; const job = state.jobs.find((j) => j.id === pc.jobId); if (job) { stageDone(state, job, -1, pc.index); ui.toast(`Design done for job ${job.id}. ${customerOf(job.customer).name} approved it by email, with one note about a radius.`, 4000); audio.ding(); } state.pc = null; }
      }
    }
    if (iso.active) iso.update(); else player.update(dt, allColliders(), { hx: shop.hx, hz: shop.hz });
    crew.update(paused || modal ? 0 : dt, paused || modal ? 0 : (dt * (state.speed || 0) * speedMul) / 60);
    if (!paused && !modal) {
      items.update(dt, views.filter((v) => v.m.placed).map((v) => ({ ...v.collider(), uid: v.m.uid, top: v.def.h || 2 })), [...crew.views.values()].filter((v) => v.g.visible).map((v) => ({ x: v.pos.x, z: v.pos.z, id: v.p.id })));
      for (const it of items.items) if (it.flying && it.from) it.throwDist = Math.hypot(it.mesh.position.x - it.from.x, it.mesh.position.z - it.from.z);
      itemsAtRest(); syncSteel();
    }
    shop.update(paused ? 0 : dt, audio.compOn); shop.setDoor(!!state.facility.door); shop.setAir(state.facility.air); shop.setCrane(!!state.facility.crane);
    if (state.facility.crane) { const sp = state.machines.find((m) => m.running && byId(m.id).kind === 'spot'); if (sp) shop.craneTo(sp.x, sp.z); else if (state.crates) shop.craneTo(shop.cratePos.x, shop.cratePos.z - 2); }
    for (const v of views) v.update(paused || modal ? 0 : dt * (state.speed || 0));
    audio.update(dt, {
      listener: { x: camera.position.x, z: camera.position.z }, iso: iso.active,
      running: paused ? [] : state.machines.filter((m) => m.running && m.placed).map((m) => ({ x: m.x, z: m.z, kind: byId(m.id).kind })),
      compressor: shop.compressorPos,
    });
    look(); ui.update(); crew.projectBubbles(iso.active ? iso.camera : camera, iso.active);
    if (ui.panelOpen && ui.panelM && ui.panelM.running) ui.renderPanel();
    if (ui.panelOpen && !ui.panelM && state.pc && state.pc.running && Math.floor(now / 500) !== Math.floor(last / 500)) ui.openPC();
    renderer.render(scene, iso.active ? iso.camera : camera);
  }
  window.__dbg = { state, camera, player, iso, views, crew, nav, items, mods: { makeRfq, TEMPLATES, CUSTOMERS, runnableStages }, get lookAt() { return lookAt; }, get modal() { return modal; } };
  requestAnimationFrame(frame);
}
