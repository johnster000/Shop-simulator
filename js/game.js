// The render loop, the floor, the glue.
import { Shop } from './shop.js';
import { Player } from './player.js';
import { MachineView, halfSizes } from './machines.js';
import * as TX from './textures.js';
import { Iso } from './iso.js';
import { UI } from './ui.js';
import { byId } from './catalog.js';
import { crewVerdict } from './events.js';
import { Delivery } from './truck.js';
import { Visitor } from './visitor.js';
import { Phone } from './phone.js';
import { practice, nightShift, setupRoll, skillFor } from './people.js';
import { tick, save, money, post, goHome, hourText, END_DAY_SPEED, achieve, ACHIEVEMENTS as ACH, building, valuation, canRetire, tally, SAVE_KEY, loadMonth, MONTH_KEY, fireCost, saturdayWorth, isSaturday } from './sim.js';
import { stageDone, scrapJob, customerOf, makeRfq, TEMPLATES, CUSTOMERS, nextLabel, runnableStages, afterTryout, allDone, startJob, message, openCrate } from './jobs.js';
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
  let crew = null, visitor = null;

  let modal = false, paused = false, placing = null, night = false;
  const ui = new UI(state, audio, {
    modal(on) { modal = on; if (!on && !iso.active && !paused && !night) player.requestLock(); },
    place(m) { beginPlace(m); },
    refreshMachines() { syncViews(); },
    toggleIso() { toggleIso(); },
    pause() { pause(); },
    cycleStart(m, keys) { cycleStart(m, keys); },
    goHome() { leaveForTheNight(); },
    shipped(j) { shop.setCrates(state.crates); unlock('one_out'); if (state.t >= 780) unlock('shipped_friday'); if (isSaturday(state)) unlock('saturday_ship'); if (j && j.mold) { unlock('first_mold'); if (j.tryouts === 1 && !j.defects.length) unlock('t1_no_notes'); if ((state.day - 1) % 7 === 4 && state.t >= 720 && !state.storyFriday) { state.storyFriday = j.id; } } },
    crew() { return crew; },
    crewChanged() { crew.sync(); if (state.people.length) unlock('hired'); if (state.people.some((p) => p.role === 'estimator')) unlock('estimator'); },
    achievement(a) { showAchievement(a); },
  });
  function showAchievement(a) { if (!a) return; ui.toast(`ACHIEVEMENT: ${a[0].toUpperCase()}`, 3400); audio.ding(); }
  function unlock(id) { showAchievement(achieve(state, id)); }
  crew = new Crew(T, scene, shop, nav, state, {
    machineViews: () => views,
    runMachine: (m, skipped, p) => runMachine(m, skipped, p),
    say: (p, text) => { crew.say(p, text); },
    whistle: (p, pos) => { const d = Math.hypot(camera.position.x - pos.x, camera.position.z - pos.z); audio.whistle(iso.active ? 0.4 : 1 / (1 + (d / 4) * (d / 4))); },
    quit: (p) => {
      state.people = state.people.filter((q) => q.id !== p.id); tally(state, 'left'); unlock('the_speech');
      for (const q of state.people) q.morale = Math.max(0, q.morale - 0.05);
      let extra = '';
      const shipped = state.jobs.filter((j) => j.status === 'shipped');
      if (shipped.length && Math.random() < 0.35) { const c = customerOf(pick(shipped).customer); state.sour = state.sour || {}; state.sour[c.id] = state.day + 20; extra = ` ${p.name} took ${c.name}'s number. They will not be calling for a while.`; message(state, c.name, 'Re: your former employee', `${p.name} called us. We are giving them a shot on the next one. Nothing personal.`); }
      ui.toast(`${p.name} quit. On the floor, with a speech. Everyone heard it.${extra}`, 6000);
      setTimeout(() => crew.sync(), 6000);
    },
    vendSulk: (p) => { state.vendSulks = (state.vendSulks || 0) + 1; if (state.vendSulks >= 3) unlock('vending_sulk'); },
  });
  visitor = new Visitor(T, scene, shop, nav, state, crew, { say: (p, t, secs) => crew.say(p, t, secs), toast: (t, ms) => ui.toast(t, ms), unlock });
  nav.rebuild(allColliders()); crew.sync();

  // ---- things to throw
  const items = new Items(T, scene, camera, audio, shop);
  for (let i = 0; i < 3; i++) items.make('scrap', shop.binPos.x + (i - 1) * 0.25, shop.binPos.z + (i % 2 ? 0.15 : -0.1), { y: 0.82 });
  items.make('coffee', shop.pcPos.x + 0.6, shop.pcPos.z + 0.1, { y: 0.77 });
  items.make('hammer', shop.pcPos.x - 0.6, shop.pcPos.z + 0.2, { y: 0.77 });
  items.make('key', shop.hx - 1.6, shop.hz - 1.9, { y: 0.0 });
  const extItem = items.make('extinguisher', shop.extPos.x, shop.extPos.z, { y: shop.extPos.y });
  const hoseItem = items.make('airhose', shop.hosePos.x, shop.hosePos.z, { y: shop.hosePos.y });
  let coffeeItem = items.items.find((it) => it.kind === 'coffee');
  const broomItem = items.make('broom', shop.office.x1 + 0.35, shop.office.z1 - 0.9, { y: 0.0 });
  const signItem = items.make('wetsign', shop.office.x1 + 0.35, shop.office.z1 - 1.5, { y: 0.0 });
  const spills = []; // { x, z, until }
  const delivery = new Delivery(T, scene, shop, state);
  const phone = new Phone(shop, state, audio, { toast: (t, ms) => ui.toast(t, ms), unlock });
  // the travellers: one clipboard per live job, beside the machine that has it or on the rack
  const travellers = new Map();
  function syncTravellers() {
    const live = state.jobs.filter((j) => j.status === 'work' || j.status === 'material');
    for (const [id, it] of travellers) if (!live.find((j) => j.id === id)) { items.remove(it); travellers.delete(id); }
    let k = 0;
    for (const j of live) {
      const lines = [`JOB ${j.id}`, j.title.slice(0, 16).toUpperCase(), nextLabel(j).slice(0, 18)];
      let it = travellers.get(j.id);
      if (!it) { it = items.make('traveller', shop.office.x0 + 0.4, shop.office.z1 + 0.03, { y: 1.35, lines }); it.jobId = j.id; it.lines = lines.join('|'); travellers.set(j.id, it); }
      if (it.lines !== lines.join('|')) { it.lines = lines.join('|'); it.mesh.userData.paper.material.map = TX.label(T, lines, { size: 24, bg: '#f4f1e6', border: '#f4f1e6', fg: '#222' }); it.mesh.userData.paper.material.needsUpdate = true; }
      const mv = views.find((v) => v.m.placed && v.m.job && v.m.job.jobId === j.id);
      // on the floor beside the machine that has it, or hanging on a nail on the office wall, by the door, in job order
      const home = mv ? { x: mv.m.x + Math.cos((mv.m.rot * Math.PI) / 180) * (halfSizes(mv.def, mv.m.rot).hw + 0.3), z: mv.m.z + 0.2, y: 0.01, hang: false } : { x: shop.office.x0 + 0.4 + k * 0.32, z: shop.office.z1 + 0.03, y: 1.35, hang: true };
      k++;
      if (items.held !== it && !it.flying && !it.moved && (it.home.x !== home.x || it.home.z !== home.z || it.home.hang !== home.hang)) { it.home = home; it.mesh.position.set(home.x, home.y, home.z); it.rest = home.hang ? 0.01 : home.y; it.mesh.rotation.set(home.hang ? -Math.PI / 2 : 0, home.hang ? 0 : Math.random() * 0.6 - 0.3, home.hang ? (Math.random() - 0.5) * 0.1 : 0); }
    }
  }
  let steelItem = null;
  function syncSteel() {
    const want = state.jobs.some((j) => j.status === 'work');
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
      else { m.condition = Math.max(0, m.condition - 0.02); if (Math.random() < 0.35 && !m.bumped) m.bumped = true; ui.toast(pick([`CLANG. The ${d.name.toLowerCase()} has been hit by worse.`, `CLANG. A handwheel is slightly less round.`, 'CLANG. Nothing important. Probably.'])); if (Math.random() < 0.15) { post(state, 'Bent handwheel', -120); unlock('bent'); ui.toast('Bent a handwheel. $120. The crew saw. They will say they did not.', 3600); } }
      return;
    }
    if (what.type === 'person' && what.id === -1) { visitor.struck(); post(state, 'Visitor first aid, and the vest', -120); unlock('wsib_visitor'); ui.toast(`You hit the customer. With a ${ITEM_KINDS[kind].label}. They are leaving. The RFQ is leaving with them.`, 5000); return; }
    if (what.type === 'person') {
      const p = state.people.find((q) => q.id === what.id); if (!p) return;
      if (heavy) {
        post(state, `WSIB: ${p.name}, claim and premium`, -2400); p.morale = Math.max(0, p.morale - 0.35); p.startDay = state.day + 3; p.crashes += 0;
        for (const q of state.people) if (q !== p) q.morale = Math.max(0, q.morale - 0.1);
        state.glassesUntil = state.day + 10; unlock('glasses');
        unlock('wsib'); tally(state, 'wsib'); ui.toast(`${p.name}: "OW. What is WRONG with you?" A WSIB claim, $2,400, and ${p.name} is off for three days. Everyone saw.`, 5000); crew.ouch(p);
      } else if (kind === 'coffee') { p.morale = Math.max(0, p.morale - 0.1); ui.toast(`${p.name}: "...thanks." Wet, and thinking about it.`, 3000); }
      else { post(state, 'First aid kit, restocked', -60); p.morale = Math.max(0, p.morale - 0.18); ui.toast(`${p.name}: "Hey!" A ${ITEM_KINDS[kind].label} to the shoulder. $60 of bandages and a long look.`, 3600); }
      return;
    }
    if (what.type === 'tarp') { ui.toast(pick(['Through the tarp. The tarp did not mind.', 'The tarp flapped. It always flaps.'])); return; }
    if (what.type === 'lot') { ui.toast(`${ITEM_KINDS[kind].label[0].toUpperCase() + ITEM_KINDS[kind].label.slice(1)}: now in the parking lot.${kind === 'steel' ? ' That was $90 of P20.' : ''}`, 3400); if (kind === 'steel') { post(state, 'A block of P20, in the parking lot', -90); items.remove(it); steelItem = null; } else if (kind !== 'scrap') items.remove(it); else { it.mesh.position.set(shop.binPos.x, 0.82, shop.binPos.z); } return; }
    if (what.type === 'spill') { unlock('wet_floor'); spills.push({ x: it.mesh.position.x, z: it.mesh.position.z, until: performance.now() + 20000, mesh: spillMesh(it.mesh.position.x, it.mesh.position.z) }); ui.toast(pick(['Coffee on the floor. Somebody will slip on that.', 'The coffee is on the floor now. It was the good coffee.', 'Coffee on the floor. The sign is by the office. The sign is always by the office.']), 3000); setTimeout(() => { it.mesh.position.set(shop.pcPos.x + 0.6, 0.77, shop.pcPos.z + 0.1); }, 20000); return; }
    if (what.type === 'wall') { if (kind === 'coffee') ui.toast('Coffee on the block wall. It joins the others.'); return; }
  };
  function itemsAtRest() { for (const it of items.items) if (it.kind === 'scrap' && !it.flying && it.thrownBy && !it.scored) { it.scored = true; const m = it.mesh.position; if (Math.abs(m.x - binRect.x) < binRect.hw && Math.abs(m.z - binRect.z) < binRect.hd && it.throwDist > 4) { unlock('three_pointer'); ui.toast('Nothing but net. From downtown.', 3000); audio.ding(); } } }
  // the hammer
  function whack(m) {
    const d = byId(m.id);
    audio.thunk(); audio.noise(0.2, 2000, 0.12, 'bandpass', 2);
    unlock('percussive');
    if (m.running) { m.running = false; m.runLeft = 0; m.checklist = {}; const j = m.job; m.job = null; ui.toast(`WHACK. The ${d.name.toLowerCase()} stopped mid-cut. ${j && j.jobId ? `Job ${j.jobId}'s stage has to be reloaded.` : ''}`, 4000); return; }
    if (m.bumped && Math.random() < 0.4) { m.bumped = false; m.found = false; ui.toast('WHACK. Something settled. The dial reads zero again. Nobody saw.', 3500); audio.thunk(); return; }
    if (Math.random() < 0.2) { m.condition = Math.min(1, m.condition + 0.08); ui.toast(pick(['WHACK. It... sounds better? Percussive maintenance. Do not ask why.', 'WHACK. Something inside clicked back into place. Nobody will ever know what.']), 3600); audio.ding(); }
    else { const bill = d.cnc ? 1200 : 120; post(state, d.cnc ? 'Pendant screen, replaced' : 'Bent handwheel', -bill); m.condition = Math.max(0, m.condition - 0.08); ui.toast(d.cnc ? `WHACK. The pendant screen is a spiderweb now. ${money(bill)}.` : `WHACK. A handwheel is bent and the ${d.name.toLowerCase()} is sulking. ${money(bill)}.`, 4000); }
  }
  shop.setCrates(state.crates || 0); shop.setScrap(state.scrapCount || 0); shop.setOrphans((state.orphans || []).length);
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
  // ---- fire on the floor. the sinker is a candle with a Z axis.
  function fireStart(m) {
    if (m.fire || !m.placed) return;
    const def = byId(m.id);
    m.fire = true; m.fireT = 0; audio.alarm(1.2);
    ui.toast(`FIRE. The ${def.name.toLowerCase()}. The oil in the tank. ${state.facility.fire ? 'The bottle should go off.' : 'The extinguisher is by the door. It was by the door.'}`, 6000);
    for (const q of state.people) { const v = crew.views.get(q.id); if (v && v.g.visible) { crew.say(q, pick(['FIRE!', 'The sinker! Again!', 'Where is the extinguisher?', 'Not it.', 'I am going outside.']), 3); if (Math.random() < 0.5) crew.takeFive(q); } }
  }
  function putOut(m, how = 'you') {
    const def = byId(m.id); m.fire = false;
    audio.noise(1.2, 700, 0.18, 'highpass'); audio.noise(0.8, 200, 0.1, 'lowpass');
    if (how === 'you') { unlock('pin_aim_squeeze'); if (items.held && items.held.kind === 'extinguisher') items.held.empty = true; ui.toast(pick([`Out. Powder on everything. The ${def.name.toLowerCase()} will need a wipe and a tech.`, 'Out. Your hands are shaking. Somebody clapped, once.', 'Out. The tag said 2009. It worked anyway.']), 5000); }
    else if (how === 'bottle') ui.toast(`The suppression bottle went off over the ${def.name.toLowerCase()}. $3,500, well spent. Powder on everything.`, 5000);
    for (const q of state.people) if (Math.random() < 0.4) crew.say(q, pick(['Nice.', 'That was close.', 'Can we get a real EDM?', 'I am still going outside.']), 2.5);
    m.condition = Math.max(0, m.condition - 0.06); m.running = false; m.runLeft = 0; m.checklist = {};
    if (m.job && m.job.jobId) { const job = state.jobs.find((j) => j.id === m.job.jobId); if (job) scrapJob(state, job, m.job.itemIndex); shop.setScrap(state.scrapCount); } m.job = null;
  }
  function fireTick(dt) {
    for (const m of state.machines) {
      if (!m.fire) continue;
      m.fireT = (m.fireT || 0) + dt;
      if (Math.random() < dt * 1.8) audio.noise(0.25, 300 + Math.random() * 500, 0.05, 'bandpass', 0.6);
      if (state.facility.fire && m.fireT > 5) { putOut(m, 'bottle'); continue; }
      m.condition = Math.max(0, m.condition - dt * 0.012);
      if (m.fireT > 40) { // it burned. the tech will have opinions.
        m.fire = false; m.running = false; m.runLeft = 0; m.job = null; m.checklist = {}; const def = byId(m.id);
        m.down = { why: 'fire damage. the cabinet is black and the wiring is a sculpture', until: null, kind: 'broke' }; m.condition = Math.max(0, m.condition - 0.25);
        const fc = fireCost(state, m); post(state, `Fire: ${state.insured ? 'deductible' : 'uninsured'}`, -fc.cost); unlock('candle'); if (!state.insured) unlock('uninsured');
        ui.toast(`The ${def.name.toLowerCase()} burned itself out. Black to the ceiling. ${money(fc.cost)}, ${fc.text} The machine is DOWN, and the inspector will hear about it.`, 8000);
        state.inspectorSoon = true;
      }
    }
  }
  // the air hose. for chips. only for chips.
  function blast(mAt, pAt) {
    audio.noise(0.4, 2000, 0.16, 'highpass');
    if (pAt) {
      pAt.morale = Math.max(0, pAt.morale - 0.06); unlock('chips_only');
      crew.say(pAt, pick(['HEY.', 'That is NOT for that.', 'There is a POSTER.', 'My EYE.', 'Real mature.']), 3);
      if (Math.random() < 0.08) { post(state, `Clinic: ${pAt.name}, eye wash`, -800); pAt.morale = Math.max(0, pAt.morale - 0.2); tally(state, 'wsib'); ui.toast(`${pAt.name}: something in the eye. The eye wash station is a sink. $800 at the clinic and a form.`, 5000); }
      else ui.toast(`PSSSHT. ${pAt.name} jumped. Everyone laughed. ${pAt.name} did not.`, 3200);
      return;
    }
    if (mAt) { const d = byId(mAt.id); ui.toast(pick([`Chips off the ${d.name.toLowerCase()}. Into the ways. Use a brush.`, `PSSSHT. The ${d.name.toLowerCase()} is cleaner. Everything near it is not.`]), 3000); for (const q of state.people) if (Math.random() < 0.3) crew.say(q, pick(['Use a BRUSH.', 'Not into the ways!', 'That is how the ways go.']), 2.5); mAt.condition = Math.max(0, mAt.condition - 0.003); return; }
    ui.toast(pick(['PSSSHT.', 'PSSSHT. Into the air. Satisfying.', 'PSSSHT. The compressor kicked on.']), 1800);
  }
  function giveCoffee(p) {
    const it = items.held; items.held = null; camera.remove(it.mesh); items.remove(it); if (coffeeItem === it) coffeeItem = null;
    p.morale = Math.min(1, p.morale + 0.08); unlock('my_round'); audio.tick(0.08, 700);
    crew.say(p, pick(['Oh. Thanks.', 'Is this a trick?', 'Two sugars. This is one.', 'Huh. Okay.', 'What did you do?']), 3);
    ui.toast(`${p.name} took the coffee. Morale went up. Suspicion also went up.`, 3200);
  }
  // a puddle. brown, round, twenty seconds, and a slip hazard unless the sign is near it
  function spillMesh(x, z) { const m = new T.Mesh(new T.CircleGeometry(0.28, 18), new T.MeshBasicMaterial({ color: 0x4a2e14, transparent: true, opacity: 0.55, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.015, z); m.raycast = () => {}; scene.add(m); return m; }
  function spillTick() {
    const now = performance.now();
    for (const sp of spills.slice()) {
      if (now > sp.until) { scene.remove(sp.mesh); spills.splice(spills.indexOf(sp), 1); continue; }
      const signed = !signItem.flying && items.held !== signItem && Math.hypot(signItem.mesh.position.x - sp.x, signItem.mesh.position.z - sp.z) < 1.6;
      if (signed && !sp.signed) { sp.signed = true; unlock('wet_sign'); ui.toast('Sign out. Liability: managed.', 2000); }
      if (signed) continue;
      for (const v of crew.views.values()) {
        if (!v.g.visible || v.walk < 0.3 || v.slippedAt === sp) continue;
        if (Math.hypot(v.pos.x - sp.x, v.pos.z - sp.z) < 0.4 && Math.random() < 0.5) {
          v.slippedAt = sp; const p = v.p; p.morale = Math.max(0, p.morale - 0.1); post(state, `Clinic: ${p.name}, the coffee`, -400); tally(state, 'wsib'); unlock('slipped');
          crew.say(p, pick(['WHOA.', 'Who left COFFEE on the FLOOR.', 'My back. My BACK.', 'There is a SIGN for this.']), 3); audio.thunk();
          ui.toast(`${p.name} slipped on the coffee. $400 at the clinic and a form with a drawing on it. The sign is by the office.`, 5000);
        }
      }
    }
  }
  // sticky notes on machines. the crew writes them. nobody takes them down.
  function noteOn(m, text) { m.notes = (m.notes || []).filter((t) => t !== text); m.notes.push(text); if (m.notes.length > 4) m.notes.shift(); }
  // the red button. the crash is still coming; it just costs a cutter instead of a spindle.
  function estop(m) {
    const def = byId(m.id);
    m.alarm = false; m.estopped = true; audio.estop(); unlock('estop');
    ui.toast(pick([`E-STOP. You caught it. A cutter and a clean pair of pants.`, `E-STOP. The ${def.name.toLowerCase()} stopped. Your heart did not.`, `E-STOP. Everybody saw. Everybody will mention it.`]), 4000);
    for (const q of state.people) { const v = crew.views.get(q.id); if (v && v.g.visible && Math.random() < 0.6) crew.say(q, pick(['Nice.', 'Close one.', 'I would have let it go.', 'Was that the program?']), 2.5); }
  }
  // start a cycle on machine m with `skipped` setup steps undone, by person p (null: the owner)
  function runMachine(m, skipped, p) {
    const def = byId(m.id);
    audio.cycleStart();
    let risk = def.kind === 'bench' ? 0.02 : def.kind === 'press' || def.kind === 'heat' ? 0 : skipped * 0.18 + (1 - m.condition) * 0.12; // a press and an oven have their own ways of going wrong
    // the owner standing there: fewer crashes, faster learning, and a look
    const watching = p && !iso.active && Math.hypot(camera.position.x - m.x, camera.position.z - m.z) < 4.5;
    if (watching) { risk *= 0.6; practice(p, def.kind); state.watched = (state.watched || 0) + 1; if (state.watched >= 5) unlock('watched'); if (Math.random() < 0.3) crew.say(p, pick(['I know. I know.', 'Watching does not make it faster.', 'You can go.', 'Is this a test?', 'I have done this before. Twice.']), 3); }
    m.running = true; m.runTotal = m.job.min * (def.speed || 1) * (0.9 + Math.random() * 0.25) * (p ? 1.4 - Math.min(5, (p.actual[{ mill: 'mill', lathe: 'lathe', grinder: 'grind', bench: 'bench' }[def.kind] || 'general'] || 0)) * 0.1 : 1); m.runLeft = m.runTotal; // shop minutes
    state.stats.cycleStarts++;
    const who = p ? p.name : 'You';
    const jobNow = m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
    if (jobNow && def.kind === 'spot') jobNow.spotted = true;
    if (jobNow && def.kind === 'bench' && m.job.label === 'Fit and spot') { jobNow.risk = (jobNow.risk || 0) + 0.1; ui.toast('Fit and spot at the bench, with bluing and a straightedge. A press would be better. The flash will tell you.', 3600); }
    if (def.kind === 'vmc' && /electrode/i.test(m.job.label) && !state.facility.dust) { m.condition = Math.max(0, m.condition - 0.03); for (const q of state.people) q.morale = Math.max(0, q.morale - 0.02); ui.toast('Graphite on the VMC. Black dust in the ways, the coffee, and everyone\'s nose. A vacuum is $2,800.', 4200); }
    if ((m.oil <= 0 || m.taped) && !def.manual && def.kind !== 'press' && def.kind !== 'heat' && Math.random() < 0.08) {
      setTimeout(() => { if (!m.running) return; m.running = false; m.runLeft = 0; m.checklist = {}; const jb = m.job && m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null; m.job = null; post(state, 'Welded cutter, and the one that got it out', -240); m.condition = Math.max(0, m.condition - 0.03); noteOn(m, 'THE|FLAG'); unlock('welded'); audio.thunk(); audio.nope(); ui.toast(`WELDED. The ${def.name.toLowerCase()} ${m.taped ? 'ran hot through the tape' : 'ran dry'} and an end mill is standing in the ${jb ? 'cavity' : 'block'} like a flag. The stage starts over. ${money(240)}.`, 6000); crew.gatherRound(m.x, m.z); }, 2000 + Math.random() * 5000);
    }
    if (def.kind === 'press' && m.job.jobId) { const j = state.jobs.find((q) => q.id === m.job.jobId); if (j) j.risk = (j.risk || 0) + skipped * 0.12; }
    if (def.kind === 'heat') { m.job.banana = m.checklist && m.checklist.speed !== true; }
    if (def.kind === 'sinker' || def.kind === 'wire') {
      const flushSkipped = m.checklist && m.checklist.clamp !== true && def.kind === 'sinker';
      const pFire = flushSkipped ? 0.3 : def.kind === 'sinker' ? 0.015 : 0.004;
      if (Math.random() < pFire) setTimeout(() => { if (m.running) fireStart(m); }, 4000 + Math.random() * 20000);
    }
    if (Math.random() < risk + (m.taped ? 0.1 : 0)) {
      let sev = Math.random();
      const delay = 1500 + Math.random() * 6000;
      // the sound changes first. a few seconds where the red button would help, if you are standing there.
      if (sev >= 0.6) setTimeout(() => { if (!m.running) return; m.alarm = true; audio.alarm(); for (const q of state.people) if (Math.random() < 0.5) { const v = crew.views.get(q.id); if (v && v.g.visible && Math.hypot(v.pos.x - m.x, v.pos.z - m.z) < 7) crew.say(q, pick(['THAT is not a good noise.', 'E-STOP! E-STOP!', 'Who set that up?', 'Nope.']), 2.5); } }, Math.max(200, delay - 2600));
      setTimeout(() => {
        if (!m.running) return;
        if (m.estopped) { m.estopped = false; sev = 0.1; }
        m.alarm = false;
        m.running = false; m.runLeft = 0; m.checklist = {};
        const job = m.job && m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
        const jobItem = m.job ? m.job.itemIndex : 0, jobItemName = m.job && m.job.item && job && job.mold ? ' ' + m.job.item.toLowerCase() : '';
        m.job = null;
        audio.thunk(); audio.nope();
        if (p) { p.crashes++; p.morale = Math.max(0, p.morale - 0.06); if (Math.random() < 0.6) noteOn(m, pick([`NOT MY|FAULT|- ${p.name.split(' ')[0].toUpperCase()}`, 'PULLS|LEFT', 'DO NOT|TOUCH', 'CRASHED|HERE|AGAIN'])); }
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
    if (state.jobs.some((j) => j.truck && j.status === 'material')) lines.push('- SIGN FOR THE STEEL');
    if (!state.facility.door) lines.push('- fix the door');
    const g = state.people.find((p) => p.grievance); if (g) lines.push(`- talk to ${g.name}`);
    if (!state.machines.length) lines.push('- buy a mill');
    if (state.cash < 5000) lines.push('- MONEY');
    lines.push(pick(['- coffee', '- radio: NO', '- sweep', '- call Rick back (no)', '- order end mills']));
    return lines.slice(0, 6);
  }
  shop.setWhiteboard(whiteboardLines());
  audio.setStation(state.radio || 0);

  // ---- lights out. CNC machines keep cutting after you lock up. Manual ones wait for a person.
  function runLightsOut() {
    const notes = [];
    const nightMin = (24 * 60 - (7 * 60 + state.t)) + 7 * 60; // minutes until 7:00 tomorrow
    for (const m of state.machines) {
      const def = byId(m.id); if (!m.running) continue;
      if (!def.cnc && def.kind !== 'heat') { notes.push(`${def.brand} ${def.name}: stopped where it was. ${def.kind === 'press' ? 'A press does not sample itself.' : 'Manual machines do not run without a person.'}`); continue; }
      const hours = Math.min(m.runLeft, nightMin) / 60;
      const pBreak = (state.facility.toolbreak ? 0.004 : 0.016) * (1.3 - m.condition * 0.5), pFire = def.kind === 'sinker' ? (state.facility.fire ? 0.00005 : 0.0006) : 0;
      let broke = -1, fire = false;
      for (let h = 0; h < hours; h++) { if (Math.random() < pFire) { fire = true; broke = h; break; } if (Math.random() < pBreak) { broke = h; break; } }
      const job = m.job && m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
      if (fire) {
        const fireItem = m.job ? m.job.itemIndex : 0;
        m.running = false; m.runLeft = 0; m.condition = 0.05; m.job = null; m.checklist = {};
        const fc = fireCost(state, m); post(state, `Fire: ${state.insured ? 'deductible' : 'uninsured'}`, -fc.cost); if (!state.insured) unlock('uninsured');
        if (job) { scrapJob(state, job, fireItem); shop.setScrap(state.scrapCount); }
        notes.push(`The sinker caught fire at ${hourText((state.t + broke * 60) % 1440)}. The fire department has questions. ${money(fc.cost)}: ${fc.text} The machine is a shell.${job ? ` Job ${job.id} is ash.` : ''}`);
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
    // the night shift: each one takes an idle CNC with work waiting and runs it until morning. you never see them.
    for (const p of nightShift(state)) {
      const m = state.machines.find((q) => q.placed && !q.running && !q.down && byId(q.id).cnc && !q.job && runnableStages(state, byId(q.id).kind).length);
      if (!m) { notes.push(`${p.name} came in at six, found nothing loaded on a CNC, swept, and left a note: "??"`); p.morale = Math.max(0, p.morale - 0.02); continue; }
      const def = byId(m.id), o = runnableStages(state, def.kind)[0];
      m.job = { jobId: o.job.id, itemIndex: o.itemIndex, item: o.item ? o.item.name : null, index: o.index, label: o.stage.label, min: o.stage.min || 60, kind: o.stage.kind, operator: p.id };
      let skipped = 0; for (let k = 0; k < 3; k++) if (!setupRoll(p, def.kind)) skipped++;
      practice(p, def.kind); p.workedToday = true;
      const total = m.job.min * (def.speed || 1) * (1.3 - Math.min(5, skillFor(p, def.kind)) * 0.06), hours = Math.min(total, nightMin - 60) / 60;
      const pBad = skipped * 0.06 + (state.facility.toolbreak ? 0.004 : 0.016) * (1.3 - m.condition * 0.5);
      let bad = false; for (let h = 0; h < hours; h++) if (Math.random() < pBad) { bad = true; break; }
      m.hours += hours; m.chips = Math.min(1, (m.chips || 0) + hours * 0.1 * (state.facility.chips ? 0.5 : 1)); m.oil = Math.max(0, (m.oil == null ? 1 : m.oil) - hours / 50);
      const job = state.jobs.find((j) => j.id === o.job.id);
      if (bad) { m.condition = Math.max(0, m.condition - 0.03); m.job = null; m.checklist = {}; post(state, `Broken cutter, night shift (${p.name})`, -180); p.crashes++; noteOn(m, pick(['NOT ME|- NIGHT', 'CUTTER|BROKE|SORRY', 'ASK|THE|NIGHT GUY'])); notes.push(`${p.name} broke a cutter on the ${def.name.toLowerCase()} around ${['midnight', 'one', 'two', 'three'][Math.floor(Math.random() * 4)]} and left a note. The stage will have to be run again.`); }
      else if (total <= nightMin - 60) { m.job.operator = p.id; const finished = stageDone(state, job, o.itemIndex, o.index); if (finished) shop.setCrates(state.crates); m.job = null; m.checklist = {}; notes.push(`${p.name} ran ${o.stage.label.toLowerCase()}${o.item && job.mold ? ' on the ' + o.item.name.toLowerCase() : ''} for job ${job.id} overnight. Done.${finished ? ` Job ${job.id} is ready to ship.` : ''} ${pick(['The radio was on the French station this morning.', 'There is a coffee cup on the control that is not yours.', 'The chips were swept. Into a pile. Beside the broom.', 'He left the lights on. Every one.'])}`); unlock('night_shift'); }
      else { m.running = true; m.runTotal = total; m.runLeft = total - hours * 60; m.checklist = { clamp: true, probe: true, program: true }; notes.push(`${p.name} loaded ${o.stage.label.toLowerCase()} on the ${def.name.toLowerCase()} and it is still cutting. ${Math.round(m.runLeft)} minutes to go when you walked in.`); unlock('night_shift'); }
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
    const crewHere = state.people.filter((p) => p.startDay != null && p.startDay <= state.day).length;
    $('crewBtn').classList.toggle('hidden', !crewHere); $('crewBtn').textContent = `EVERYBODY STAYS (${crewHere} × 1.5)`;
    $('satBtn').classList.toggle('hidden', !saturdayWorth(state)); $('satBtn').textContent = `COME IN SATURDAY${crewHere ? ' (ASK THE CREW)' : ''}`;
    if (isSaturday(state)) $('closingLine').textContent = 'Saturday. ' + $('closingLine').textContent;
    closingEl.classList.remove('hidden'); modal = true;
  }
  $('stayBtn').addEventListener('click', () => { closingEl.classList.add('hidden'); modal = false; ui.setSpeed(1); audio.click(); ui.toast('Overtime. The lights hum a little louder.', 2600); if (!iso.active) { player.enabled = true; player.requestLock(); } });
  $('homeBtn').addEventListener('click', () => { closingEl.classList.add('hidden'); modal = false; leaveForTheNight(); });
  $('satBtn').addEventListener('click', () => { state.saturdayPlanned = true; closingEl.classList.add('hidden'); modal = false; leaveForTheNight(); });
  $('crewBtn').addEventListener('click', () => {
    state.crewOT = true; closingEl.classList.add('hidden'); modal = false; ui.setSpeed(1); audio.click(); unlock('stayed');
    ui.toast('The crew is staying. Time and a half, and a look. Somebody is calling home.', 4000);
    for (const q of state.people) { const v = crew.views.get(q.id); if (v && v.g.visible && Math.random() < 0.7) crew.say(q, pick(['Fine.', 'Time and a half?', 'I had a thing.', 'Sure. Pizza?', 'My wife is going to love this.']), 3); }
    if (!iso.active) { player.enabled = true; player.requestLock(); }
  });
  function leaveForTheNight() {
    if (night) return;
    night = true; modal = true; ui.setSpeed(0);
    if (player.locked) document.exitPointerLock(); player.enabled = false;
    if (iso.active) { iso.exit(); endPlace(); }
    ui.closeClip(); ui.closePanel(); modal = true;
    const leftMin = state.t;
    for (const m of state.machines) if (m.fire) { m.fire = false; m.down = { why: 'fire damage. you left while it was burning', until: null, kind: 'broke' }; m.condition = Math.max(0, m.condition - 0.3); m.running = false; m.job = null; const fc = fireCost(state, m); post(state, `Fire: you locked up while it burned (${state.insured ? 'deductible' : 'uninsured'})`, -fc.cost); }
    if (extItem.empty) { extItem.empty = false; post(state, 'Extinguisher refill', -90); }
    if (!coffeeItem) coffeeItem = items.make('coffee', shop.pcPos.x + 0.6, shop.pcPos.z + 0.1, { y: 0.77 });
    if (items.held) items.drop();
    hoseItem.mesh.position.set(shop.hosePos.x, shop.hosePos.y, shop.hosePos.z); hoseItem.mesh.rotation.set(0, 0, 0); hoseItem.flying = false;
    crew.night(); delivery.night(); visitor.night(); phone.night();
    const lightsOut = runLightsOut();
    const n = goHome(state); save(state); shop.setOrphans((state.orphans || []).length);
    if (lightsOut.length) n.notes = (n.notes || []).concat(lightsOut);
    if (n.bankrupt) { theCall(); return; }
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
    else if (n.saturday) $('nightLine').textContent = `${line} ${n.satLine} The ship date does not care what day it is.`;
    else $('nightLine').textContent = (n.saturdayDone ? `${n.saturdayDone.crew ? `Saturday done. ${money(n.saturdayDone.cost)} at time and a half. ` : 'Saturday done, alone. '}Sunday: you slept most of it. ` : '') + (n.weekend && !n.sunday ? pick(['The weekend. Two days. You thought about the shop both of them. ', 'Saturday: errands. Sunday: the drive past the shop to check the door. ', 'The weekend. The compressor ran the whole time, for nobody. ']) : '') + line + (n.week ? ` Monday: rent ${money(n.week.rent)}, hydro ${money(n.week.power)}.` : '') + (n.show ? ' ' + n.show : '') + (n.notes && n.notes.length ? ' Overnight: ' + n.notes.join(' ') : '');
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
  // the bank calls it. the autosave from the start of the month is the way back.
  function theCall() {
    const el = $('broke'); $('brokeShop').textContent = state.shopName.toUpperCase();
    $('brokeLine').textContent = `${money(state.cash)} in the account for ${state.redDays} working days. The account manager read from a card. ${state.people.length ? `The crew found out from the radio.` : 'The compressor did not notice.'} The machines go on a flatbed Tuesday.`;
    el.classList.remove('hidden'); modal = true; night = true;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* fine */ }
  }
  $('brokeLoad').addEventListener('click', () => { const m = loadMonth(); if (!m) { ui.toast('No autosave. The desk was empty.'); return; } m.bankrupt = false; m.redDays = 0; save(m); try { localStorage.setItem('shopsim.resume', '1'); } catch (e) { /* fine */ } location.reload(); });
  $('brokeNew').addEventListener('click', () => { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(MONTH_KEY); } catch (e) { /* fine */ } location.reload(); });
  $('wakeBtn').addEventListener('click', () => {
    if (state.moved) { state.moved = false; save(state); try { localStorage.setItem('shopsim.resume', '1'); } catch (e) { /* fine */ } location.reload(); return; }
    nightEl.classList.add('fade'); audio.paper();
    if (isSaturday(state)) setTimeout(() => ui.toast(`Saturday. ${(state.satCrew || []).length ? `${(state.satCrew || []).length} came in. The radio is louder than usual.` : 'Just you and the compressor.'} No trucks, no phone, no visitors. Just the ship date.`, 5000), 1500);
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
  const HANG_SURFACES = new Set(['hook', 'bracket', 'compressor', 'panel', 'door', 'tarp', 'rack']);
  function look() {
    if (iso.active || modal) { ui.hint(''); ui.tag(''); lookAt = null; return; }
    ray.setFromCamera(centre, camera);
    const hits = ray.intersectObjects(scene.children, true);
    lookAt = null; let lookDist = 99;
    for (const h of hits) {
      if (h.distance > 3.2) break;
      const i = h.object.userData.interact; if (!i || i.type === 'floor') continue;
      lookAt = i; lookDist = h.distance; break;
    }
    // the phone sits on the desk, next to the PC; aiming at it should get it, not the desk
    if (lookAt && lookAt.type === 'pc' && shop.phonePos) {
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), dx = shop.phonePos.x - camera.position.x, dz = shop.phonePos.z - camera.position.z, d = Math.hypot(dx, dz);
      if (d < 1.5 && (dx * fx + dz * fz) / (d || 1) > 0.9) lookAt = { type: 'phone', text: 'the office phone. it rings when you are at the far end of the shop.' };
    }
    // a small thing hanging in front of a wall or a hook beats the wall behind it, if it is nearer than the wall
    if (lookAt && HANG_SURFACES.has(lookAt.type) && !items.held) {
      const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
      // the item nearest the dot wins, in three dimensions: the clipboard on the lower shelf, not the block above it
      const dir = camera.getWorldDirection(new T.Vector3()); let best = null, bestAng = 0.93;
      for (const it of items.items) { if (it.flying) continue; const to = it.mesh.position.clone().sub(camera.position); const d = to.length(); if (d > 1.7 || d > lookDist - 0.04) continue; const ang = to.normalize().dot(dir); if (ang > bestAng) { bestAng = ang; best = it; } }
      if (best) lookAt = { type: 'item', kind: best.kind, ref: best, text: ITEM_KINDS[best.kind].hint };
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
    if (!lookAt) { ui.tag(''); ui.hint(items.held ? `holding ${ITEM_KINDS[items.held.kind].label}${items.held.empty ? ' (empty)' : ''} · ${items.held.kind === 'airhose' ? 'click: PSSSHT' : items.held.kind === 'traveller' ? 'click to read it' : items.held.kind === 'broom' ? 'click to sweep' : 'click to throw'} · G to put it down` : ''); return; }
    if (lookAt.type === 'item' && lookAt.kind === 'traveller' && !items.held) { const j = state.jobs.find((q) => q.id === lookAt.ref.jobId); ui.tag(j ? `JOB ${j.id} · ${j.title.toUpperCase()}` : 'TRAVELLER'); ui.hint(j ? `${nextLabel(j)} · due day ${j.dueDay}${state.day > j.dueDay ? ' (LATE)' : ''} · pick it up` : 'pick it up'); return; }
    if (lookAt.type === 'item') { ui.tag(''); ui.hint(items.held ? 'click to throw' : `pick up the ${ITEM_KINDS[lookAt.kind].label}`); return; }
    if (items.held && items.held.kind === 'hammer' && lookAt.type === 'machine') { const m = state.machines.find((q) => q.uid === lookAt.uid), d = byId(m.id); ui.tag(`${d.brand.toUpperCase()} ${d.name.toUpperCase()}`); ui.hint('WHACK IT'); return; }
    if (items.held) {
      const hk = items.held.kind, pName = lookAt.type === 'person' ? (state.people.find((q) => q.id === lookAt.id) || {}).name : '';
      const mAt = lookAt.type === 'machine' ? state.machines.find((q) => q.uid === lookAt.uid) : null;
      ui.tag(pName || (mAt ? `${byId(mAt.id).brand.toUpperCase()} ${byId(mAt.id).name.toUpperCase()}${mAt.fire ? ' · ON FIRE' : ''}` : ''));
      ui.hint(hk === 'wetsign' ? 'G to put it down where the coffee is' : hk === 'broom' ? 'click to sweep' : hk === 'traveller' && !pAt && !mAt ? 'click to read it (the JOBS tab) · G to put it down' : hk === 'extinguisher' && mAt && mAt.fire ? 'PUT IT OUT' : hk === 'extinguisher' && (mAt || pName) ? 'click to squeeze (it is not on fire)' : hk === 'airhose' ? (pName ? 'click to blast (do not)' : mAt ? 'click to blow the chips off' : 'click: PSSSHT') : hk === 'coffee' && pName ? 'click to hand it over' : 'click to throw');
      $('hint').classList.toggle('alarm', !!(hk === 'extinguisher' && mAt && mAt.fire)); return;
    }
    if (lookAt.type === 'machine') {
      const m = state.machines.find((q) => q.uid === lookAt.uid), d = byId(m.id);
      const op = m.job && m.job.operator && m.job.operator !== 'owner' ? state.people.find((q) => q.id === m.job.operator) : null;
      ui.tag(`${d.brand.toUpperCase()} ${d.name.toUpperCase()} · ${m.down ? 'DOWN' : m.running ? 'RUNNING' : 'IDLE'} · ${Math.round(m.condition * 100)}%${op ? ' · ' + op.name.toUpperCase() : ''}${m.taped ? ' · TAPED' : ''}`);
      ui.hint(m.alarm ? 'E-STOP!' : d.kind === 'bench' ? 'bench' : m.down ? 'down' : m.running ? 'running' : 'use');
      $('hint').classList.toggle('alarm', !!m.alarm);
    } else if (lookAt.type === 'person') {
      const p = state.people.find((q) => q.id === lookAt.id);
      if (p) { ui.tag(`${p.name.toUpperCase()} · ${p.roleName.toUpperCase()} · ${crew.status(p)}`); ui.hint('talk'); }
    } else if (lookAt.type === 'phone' && phone.call) { ui.tag('THE PHONE · RINGING'); ui.hint('ANSWER IT'); $('hint').classList.add('alarm'); }
    else if (lookAt.type === 'visitor') { ui.tag(`${visitor.p.name.toUpperCase()} · ${visitor.title.toUpperCase()}`); ui.hint(visitor.toured ? 'they are looking' : 'say hello'); $('hint').classList.remove('alarm'); }
    else if (lookAt.type === 'driver') { ui.tag('THE DRIVER · BRAMALEA STEEL'); ui.hint('sign for the steel'); $('hint').classList.remove('alarm'); }
    else { ui.tag(''); ui.hint(lookAt.text || lookAt.type); $('hint').classList.remove('alarm'); }
  }
  function use() {
    if (items.held) {
      const hk = items.held.kind, mAt = lookAt && lookAt.type === 'machine' ? state.machines.find((q) => q.uid === lookAt.uid) : null, pAt = lookAt && lookAt.type === 'person' ? state.people.find((q) => q.id === lookAt.id) : null;
      if (hk === 'hammer' && mAt) { whack(mAt); return; }
      if (hk === 'extinguisher') { if (mAt && mAt.fire) { putOut(mAt); return; } if (mAt || pAt) { audio.noise(0.5, 900, 0.12, 'highpass'); ui.toast(pAt ? `${pAt.name}, in a cloud of powder. "WHAT." Morale, and the floor, are worse.` : `A cloud of powder over the ${byId(mAt.id).name.toLowerCase()}. It was not on fire. It is dusty now.`, 3500); if (pAt) { pAt.morale = Math.max(0, pAt.morale - 0.15); crew.say(pAt, pick(['WHAT.', 'I was NOT on fire.', 'My coffee.']), 3); } else { mAt.condition = Math.max(0, mAt.condition - 0.01); } return; } }
      if (hk === 'airhose') { blast(mAt, pAt); return; }
      if (hk === 'coffee' && pAt) { giveCoffee(pAt); return; }
      if (hk === 'broom') {
        let got = 0; for (const m of state.machines) if (m.placed && (m.chips || 0) > 0 && Math.hypot(m.x - camera.position.x, m.z - camera.position.z) < 2.8) { got += Math.min(m.chips, 0.25); m.chips = Math.max(0, m.chips - 0.25); }
        audio.noise(0.25, 1200, 0.07, 'bandpass', 0.7);
        if (got > 0) { state.sweeps = (state.sweeps || 0) + 1; if (state.sweeps >= 10) unlock('swept'); if (Math.random() < 0.3) ui.toast(pick(['Swish. Chips in the ways, chips in your boots.', 'Swish. The apprentice is watching you sweep. Learning.', 'Swish. Billable, apparently.', 'Swish. A curl of P20 down your sock.']), 2500); for (const q of state.people) if (Math.random() < 0.15) crew.say(q, pick(['I was going to do that.', 'The boss is sweeping. Hide.', 'That is my broom.']), 2.5); }
        else ui.toast(pick(['Swish. Clean already. Mostly.', 'Swish. Nothing. Satisfying anyway.']), 1800);
        return;
      }
      if (hk === 'traveller' && !pAt && !mAt) { if (player.locked) document.exitPointerLock(); ui.openClip('jobs'); return; }
      const it = items.throw(1); if (it) { it.throwDist = 0; it.from = { x: camera.position.x, z: camera.position.z }; }
      return;
    }
    if (lookAt && lookAt.type === 'item') { items.pickUp(lookAt.ref); return; }
    if (!lookAt) return;
    audio.click();
    if (lookAt.type === 'machine') { const m = state.machines.find((q) => q.uid === lookAt.uid); if (m.alarm) { estop(m); return; } if (m.job && m.job.operator && m.job.operator !== 'owner' && !m.running) { ui.toast(`${state.people.find((q) => q.id === m.job.operator).name} is setting this one up.`); return; } if (player.locked) document.exitPointerLock(); ui.openPanel(m); return; }
    if (lookAt.type === 'person') { const p = state.people.find((q) => q.id === lookAt.id); if (p) { if (player.locked) document.exitPointerLock(); ui.openPerson(p); } return; }
    if (lookAt.type === 'visitor') { if (visitor.tour()) { audio.click(); ui.toast(pick(['You walked them round. You said "we can do that" four times.', 'The tour. You skipped the scrap bin.', 'You showed them the whiteboard. You should not have.']), 4000); } else ui.toast('They are looking. Let them look.'); return; }
    if (lookAt.type === 'driver' || lookAt.type === 'truck') {
      const r = delivery.sign();
      if (!r) { ui.toast(lookAt.type === 'truck' ? 'The truck. It is leaving.' : 'The driver is leaving. He waved. It was not a friendly wave.'); return; }
      audio.paper(); syncSteel(); unlock('signed');
      ui.toast(`"${r.line}" Signed. Steel for job${r.jobs.length > 1 ? 's' : ''} ${r.jobs.map((j) => j.id).join(', ')} on the rack. ${pick(['He left before you finished reading the sheet.', 'He took the pen.', 'Nine more stops.'])}`, 5000);
      return;
    }
    if (lookAt.type === 'phone') {
      const line = phone.answer();
      if (line) { audio.tick(0.08, 700); ui.toast(line, 6000); }
      else ui.toast(pick(['You picked it up. Dial tone. You put it down.', 'You called the time. It is the time.', 'You checked the voicemail. Rick, twice.']), 3000);
      return;
    }
    if (lookAt.type === 'orphan') { ui.toast(pick(['A very nice mold for a product that does not exist any more. Somebody will want it. Eventually. For nothing.', 'You put your hand on it. It is cold. The trustee has not called.', 'The sign has been there long enough to fade.']), 4000); return; }
    if (lookAt.type === 'vending') {
      state.b4 = (state.b4 || 0) + 1; post(state, 'Vending machine, B4', -2); audio.tick(0.1, 900); setTimeout(() => audio.thunk(), 500);
      if (state.b4 >= 5) unlock('b4');
      ui.toast(pick(['B4. The coil turned. The bag did not. $2.', 'B4. You hit the side. It judged you. $2.', 'B4 is stuck. You knew that. $2.', 'B4. Nothing. The machine hums a little smugly. $2.', 'B4. Two bags dropped. You took both and said nothing.']), 3200);
      for (const q of state.people) if (Math.random() < 0.25) crew.say(q, pick(['B4 is stuck.', 'Everybody knows B4 is stuck.', 'Hit it on the left.', 'Those are mine, technically.']), 2.5);
      return;
    }
    if (lookAt.type === 'plate') { ui.toast(pick(['Flat. Within a tenth. You put your hand on it anyway.', 'Cold. Flat. The only honest thing in the building.'])); return; }
    if (lookAt.type === 'gauge') { ui.toast('You zeroed it. It was zeroed. Now it is zeroed again.'); return; }
    if (lookAt.type === 'blocks') { ui.toast('Gauge blocks. You wrung two together and could not get them apart. You put them back like that.'); return; }
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
      state.radio = ((state.radio || 0) + 1) % stations.length; const st = stations[state.radio]; audio.setStation(state.radio);
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
    if (e.code === 'KeyG' && !modal && !iso.active && items.held) { const wasHose = items.held.kind === 'airhose'; if (items.held.kind === 'traveller') items.held.moved = true; items.drop(); audio.tick(0.08, 500); if (wasHose) { hoseItem.mesh.position.set(shop.hosePos.x, shop.hosePos.y, shop.hosePos.z); hoseItem.mesh.rotation.set(0, 0, 0); audio.noise(0.6, 1200, 0.05, 'bandpass', 2); ui.toast('The hose reeled itself back. Loudly.', 2000); } }
    if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') { if (!modal) ui.setSpeed({ Digit1: 1, Digit2: 2, Digit3: 3 }[e.code]); }
    if (e.code === 'KeyP' || e.code === 'Space') { if (!modal) ui.setSpeed(state.speed ? 0 : 1); }
    if (e.code === 'KeyN' && !modal && !night) { $('endDay').click(); }
  });

  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); iso.fit(); });

  // ---- loop
  let last = performance.now(), travT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused && !modal) {
      const events = tick(state, dt * speedMul);
      for (const ev of events) {
        if (ev.type === 'closing') closingTime();
        if (ev.type === 'hardstop') { ui.toast('Eleven o\'clock. You cannot keep your eyes open.', 2500); setTimeout(() => leaveForTheNight(), 1200); }
        if (ev.type === 'dry') { const v = viewOf(ev.uid); const d = v && byId(v.m.id); if (v) noteOn(v.m, 'OIL|ME'); if (d) ui.toast(`The ${d.name.toLowerCase()} is out of way oil. It is singing. Top it up from the panel, or listen to it die.`, 5000); audio.squeal(1); }
        if (ev.type === 'cycleDone') {
          audio.ding(); const v = viewOf(ev.uid); const m = v && v.m;
          const op = m && m.job && m.job.operator && m.job.operator !== 'owner' ? state.people.find((q) => q.id === m.job.operator) : null;
          const who = op ? op.name + ' finished' : 'Done:';
          if (m && m.job && m.job.jobId && m.job.kind === 'heat' && m.job.banana && Math.random() < 0.45) {
            const job = state.jobs.find((j) => j.id === m.job.jobId);
            if (job) { scrapJob(state, job, m.job.itemIndex); shop.setScrap(state.scrapCount); unlock('banana'); ui.toast(`The block came out of the oven shaped like a banana. Wrong temperature. Job ${job.id}${m.job.item ? ' ' + m.job.item.toLowerCase() : ''}: start over. Quench & Sons would like you to know they saw this coming.`, 6000); }
            m.job = null;
          } else if (m && m.job && m.job.jobId) {
            const job = state.jobs.find((j) => j.id === m.job.jobId);
            if (job && m.job.kind === 'heat') unlock('in_house_heat');
            if (job && m.job.kind === 'tryout') {
              const q = (m.job.itemIndex >= 0 ? job.items[m.job.itemIndex].stages : job.jobStages)[m.job.index]; if (q) { q.done = true; q.out = null; } unlock('press_time');
              const notes = afterTryout(state, job, byId); ui.toast(`T${job.tryouts} on your own press. ${notes.join(' ')}`, 6000); audio.ding();
              if (allDone(job)) { job.status = 'ready'; state.crates++; shop.setCrates(state.crates); }
              m.job = null; continue;
            }
            if (job && m.job.label === 'Open the crate') { const laser = state.machines.some((q) => q.placed && byId(q.id).kind === 'laser'); const txt = openCrate(state, job, laser); setTimeout(() => ui.toast(`The crate is open. ${txt} Another stage, another day, $400 on the invoice. They did not know.`, 7000), 1500); unlock('the_crate'); crew.gatherRound(m.x, m.z); }
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
    fireTick(dt); spillTick(); if (state.machines.some((m) => m.found)) { unlock('bumped'); } if (now - travT > 700) { travT = now; syncTravellers(); if (state.machines.some((m) => (m.chips || 0) >= 1)) unlock('chips_deep'); }
    if (!paused && !modal && !night) { delivery.update(dt, (line) => { ui.toast(line, 5000); syncSteel(); }, () => { const v = [...crew.views.values()].find((q) => q.g.visible && (q.mode === 'idle' || q.mode === 'sweep')); return v ? v.p : null; }); visitor.update(dt); phone.update(dt, { x: camera.position.x, z: camera.position.z }); }
      items.update(dt, views.filter((v) => v.m.placed).map((v) => ({ ...v.collider(), uid: v.m.uid, top: v.def.h || 2 })), [...crew.views.values()].filter((v) => v.g.visible).map((v) => ({ x: v.pos.x, z: v.pos.z, id: v.p.id })).concat(visitor.here ? [{ x: visitor.pos.x, z: visitor.pos.z, id: -1 }] : []));
      for (const it of items.items) if (it.flying && it.from) it.throwDist = Math.hypot(it.mesh.position.x - it.from.x, it.mesh.position.z - it.from.z);
      itemsAtRest(); syncSteel();
    }
    shop.update(paused ? 0 : dt, audio.compOn); shop.setDoor(!!state.facility.door); shop.setAir(state.facility.air); shop.setCrane(!!state.facility.crane);
    if (state.facility.crane) { const sp = state.machines.find((m) => m.running && byId(m.id).kind === 'spot'); if (sp) shop.craneTo(sp.x, sp.z); else if (state.crates) shop.craneTo(shop.cratePos.x, shop.cratePos.z - 2); }
    for (const v of views) v.update(paused || modal ? 0 : dt * (state.speed || 0));
    for (const m of state.machines) { if (m.alarm && Math.random() < dt * 2.2) audio.alarm(0.9); if (m.running && m.oil != null && m.oil <= 0 && Math.random() < dt * 0.6) audio.squeal(0.6); }
    audio.update(dt, {
      listener: { x: camera.position.x, z: camera.position.z }, iso: iso.active,
      running: paused ? [] : state.machines.filter((m) => m.running && m.placed).map((m) => ({ x: m.x, z: m.z, kind: byId(m.id).kind })),
      compressor: shop.compressorPos, radio: shop.radioPos, truck: delivery.here || delivery.leaving ? { x: delivery.truck.position.x, z: delivery.truck.position.z } : null,
    });
    look(); ui.update(); crew.projectBubbles(iso.active ? iso.camera : camera, iso.active);
    if (ui.panelOpen && ui.panelM && ui.panelM.running) ui.renderPanel();
    if (ui.panelOpen && !ui.panelM && state.pc && state.pc.running && Math.floor(now / 500) !== Math.floor(last / 500)) ui.openPC();
    renderer.render(scene, iso.active ? iso.camera : camera);
  }
  window.__dbg = { state, camera, player, iso, views, crew, nav, items, shop, delivery, audio, phone, get paused() { return paused; }, get night() { return night; }, run: (m, skipped) => runMachine(m, skipped, null), get visitor() { return visitor; }, sync: syncViews, mods: { makeRfq, TEMPLATES, CUSTOMERS, runnableStages, startJob }, get lookAt() { return lookAt; }, get modal() { return modal; } };
  requestAnimationFrame(frame);
}
