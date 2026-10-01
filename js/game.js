// The render loop, the floor, the glue.
import { Shop } from './shop.js';
import { Player } from './player.js';
import { MachineView } from './machines.js';
import { Iso } from './iso.js';
import { UI } from './ui.js';
import { byId } from './catalog.js';
import { tick, save, money, post, goHome, hourText, END_DAY_SPEED } from './sim.js';
import { stageDone, scrapJob, customerOf } from './jobs.js';

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

  const shop = new Shop(T, scene, state.shopName);
  const player = new Player(T, camera, canvas);
  camera.position.set(shop.door.x - 1.5, 1.65, shop.hz - 3.0); player.yaw = 0.12;
  const iso = new Iso(T, scene, shop, canvas);
  const views = state.machines.map((m) => new MachineView(T, scene, m));
  const viewOf = (uid) => views.find((v) => v.m.uid === uid);

  let modal = false, paused = false, placing = null, night = false;
  const ui = new UI(state, audio, {
    modal(on) { modal = on; if (!on && !iso.active && !paused && !night) player.requestLock(); },
    place(m) { beginPlace(m); },
    refreshMachines() { syncViews(); },
    toggleIso() { toggleIso(); },
    pause() { pause(); },
    cycleStart(m, keys) { cycleStart(m, keys); },
    goHome() { leaveForTheNight(); },
    shipped() { shop.setCrates(state.crates); },
  });
  shop.setCrates(state.crates || 0); shop.setScrap(state.scrapCount || 0);
  $('hud').classList.remove('hidden');

  function syncViews() {
    for (const v of views.slice()) if (!state.machines.includes(v.m)) { v.dispose(); views.splice(views.indexOf(v), 1); }
    for (const m of state.machines) if (!viewOf(m.uid)) views.push(new MachineView(T, scene, m));
    for (const v of views) v.sync();
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
  iso.onPick = (uid) => { const m = state.machines.find((q) => q.uid === uid); if (m && !m.running) beginPlace(m); else if (m) ui.toast('It is running. Let it finish.'); };
  $('placeRot').addEventListener('click', () => { iso.rotate(); audio.click(); });
  $('placeOk').addEventListener('click', () => { if (ui.fumble(0.5)) { iso.rotate(); audio.click(); ui.toast(ui.fumbleLine() + ' It turned instead.'); return; } if (!iso.confirm()) audio.nope(); });
  $('placeNo').addEventListener('click', () => { cancelPlace(); audio.click(); });

  // ---- the machine
  function cycleStart(m, keys) {
    const def = byId(m.id);
    audio.cycleStart();
    const skipped = keys.filter((k) => m.checklist[k] !== true);
    const risk = def.kind === 'bench' ? 0.02 : skipped.length * 0.18 + (1 - m.condition) * 0.12;
    if (!m.job) m.job = { jobId: 0, index: -1, label: 'practice cut', min: 30 };
    m.running = true; m.runTotal = m.job.min * (0.9 + Math.random() * 0.25); m.runLeft = m.runTotal; // shop minutes
    state.stats.cycleStarts++;
    if (!state.firstCycle) { state.firstCycle = true; ui.toast('ACHIEVEMENT: FIRST CYCLE START', 3200); audio.ding(); }
    else ui.toast(skipped.length ? pick(['You skipped a step. The machine noticed.', 'Bold.', 'That is how it starts.']) : pick(['Chips.', 'Making chips.', 'Nothing wrong with that.']));
    if (Math.random() < risk) {
      const sev = Math.random();
      setTimeout(() => {
        if (!m.running) return;
        m.running = false; m.runLeft = 0; m.checklist = {};
        const job = m.job && m.job.jobId ? state.jobs.find((j) => j.id === m.job.jobId) : null;
        m.job = null;
        audio.thunk(); audio.nope();
        if (sev < 0.6) { post(state, 'Broken cutter', -45); m.condition = Math.max(0, m.condition - 0.01); ui.toast('BANG. Broken cutter. $45. The part is fine. Load it again.', 4000); }
        else if (sev < 0.9) {
          m.condition = Math.max(0, m.condition - 0.04);
          if (job) { scrapJob(state, job); shop.setScrap(state.scrapCount); ui.toast(`Chatter. Job ${job.id} is scrap. ${money(job.material)} of ${job.steel} in the bin. Start over. OOPS.`, 4500); }
          else { post(state, 'Chatter, scrapped block', -40); state.scrapCount++; shop.setScrap(state.scrapCount); ui.toast('Chatter. The scrap block is more scrap now. OOPS.', 4000); }
        }
        else { const bill = def.manual ? 900 : 4000; post(state, 'Crash: tech visit', -bill); m.condition = Math.max(0, m.condition - 0.2); if (job) { scrapJob(state, job); shop.setScrap(state.scrapCount); } ui.toast(`Crash. A tech has to come. ${money(bill)}.${job ? ` Job ${job.id} is scrap too.` : ''} He arrives Thursday.`, 4500); }
      }, 1500 + Math.random() * 6000);
    }
  }

  // ---- five o'clock, and the night
  const closingEl = $('closing'), nightEl = $('night');
  let nightTimer = 0;
  function closingTime() {
    if (modal || paused) return;
    ui.setSpeed(0);
    if (player.locked) document.exitPointerLock(); player.enabled = false;
    const running = state.machines.filter((m) => m.running).length;
    $('closingLine').textContent = running ? `${running} machine${running === 1 ? ' is' : 's are'} still cutting. Manual machines do not run without you.` : pick(['The compressor would like to be alone.', 'Nobody is waiting for you at home. The compressor knows that.', 'Go home. The chips will be here tomorrow.']);
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
    const n = goHome(state); save(state);
    $('nightShop').textContent = state.shopName.toUpperCase();
    $('nightClock').textContent = n.leftAt;
    const line = n.fatigue >= 0.6 ? `You left at ${n.leftAt}. ${n.sleep.toFixed(1)} hours of sleep. Tomorrow is going to be a day.`
      : n.fatigue >= 0.25 ? `You left at ${n.leftAt}. ${n.sleep.toFixed(1)} hours of sleep. Not enough. You will feel it.`
      : n.overtime > 0 ? `You left at ${n.leftAt}. Late, but you slept.` : pick(['You left at five. The compressor kept going.', 'Dinner. Television. A thought about the mill. Sleep.', 'You dreamed about the tarp door. It flapped.']);
    $('nightLine').textContent = line + (n.week ? ` Monday: rent ${money(n.week.rent)}, hydro ${money(n.week.power)}.` : '') + (n.notes && n.notes.length ? ' Overnight: ' + n.notes.join(' ') : '');
    $('wakeBtn').classList.add('hidden');
    nightEl.classList.remove('hidden'); nightEl.classList.remove('fade');
    // the clock runs through the night
    const start = performance.now(), dur = 5000, from = leftMin, to = 24 * 60 - 7 * 60 + 0; // to 7:00 next day, in minutes after 7:00
    const run = () => {
      const k = Math.min(1, (performance.now() - start) / dur);
      const mins = from + (to - from) * (k * k * (3 - 2 * k));
      $('nightClock').textContent = hourText(mins % (24 * 60));
      if (k < 1) nightTimer = requestAnimationFrame(run); else { $('nightClock').textContent = '7:00'; $('wakeBtn').classList.remove('hidden'); }
    };
    run();
  }
  $('wakeBtn').addEventListener('click', () => {
    nightEl.classList.add('fade'); audio.paper();
    setTimeout(() => { nightEl.classList.add('hidden'); night = false; modal = false; ui.setSpeed(1); player.enabled = true; player.requestLock(); }, 1200);
    camera.position.set(shop.door.x - 1.5, 1.65, shop.hz - 3.0); player.yaw = 0.12;
    if (state.fatigue >= 0.25) ui.toast(state.fatigue >= 0.6 ? 'Day ' + state.day + '. You are wrecked. Read every button twice.' : 'Day ' + state.day + '. Tired. Coffee first.', 3500);
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
    }
    if (!lookAt) { ui.hint(''); ui.tag(''); return; }
    if (lookAt.type === 'machine') {
      const m = state.machines.find((q) => q.uid === lookAt.uid), d = byId(m.id);
      ui.tag(`${d.brand.toUpperCase()} ${d.name.toUpperCase()} · ${m.running ? 'RUNNING' : 'IDLE'} · ${Math.round(m.condition * 100)}%`);
      ui.hint(d.kind === 'bench' ? 'bench' : m.running ? 'running' : 'use');
    } else { ui.tag(''); ui.hint(lookAt.text || lookAt.type); }
  }
  function use() {
    if (!lookAt) return;
    audio.click();
    if (lookAt.type === 'machine') { const m = state.machines.find((q) => q.uid === lookAt.uid); if (player.locked) document.exitPointerLock(); ui.openPanel(m); return; }
    if (lookAt.type === 'pc') { if (player.locked) document.exitPointerLock(); ui.openClip('shop'); return; }
    if (lookAt.type === 'tarp') { audio.tarp(); ui.toast(pick(['It flaps.', 'A real door is on the list.', 'It let the winter in last year too.'])); return; }
    if (lookAt.type === 'compressor') { ui.toast(pick(['It came with the shop.', 'It has not stopped.', 'It is doing its best.'])); return; }
    if (lookAt.type === 'chair') { audio.noise(0.2, 2200, 0.08, 'bandpass', 3); ui.toast('Squeak.'); return; }
    if (lookAt.type === 'sign') { ui.toast(`${state.shopName}. That is you.`); return; }
    if (lookAt.type === 'bin') { audio.thunk(); ui.toast('Empty. Enjoy it.'); return; }
    if (lookAt.type === 'whiteboard') { ui.toast('The real schedule.'); return; }
    if (lookAt.type === 'panel') { ui.toast('200 amps. Two machines. Then the electrician.'); return; }
    if (lookAt.type === 'rack') { ui.toast('Steel goes here. When there is steel.'); return; }
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
  function pause() { if (paused) return; paused = true; if (player.locked) document.exitPointerLock(); player.enabled = false; pauseEl.classList.remove('hidden'); $('pauseShop').textContent = state.shopName.toUpperCase(); $('pauseNote').textContent = `day ${state.day} · ${state.machines.length} machine${state.machines.length === 1 ? '' : 's'} · ${money(state.cash)}`; }
  function resume() { paused = false; pauseEl.classList.add('hidden'); if (!iso.active) { player.enabled = true; player.requestLock(); } }
  $('resumeBtn').addEventListener('click', resume);
  $('saveBtn').addEventListener('click', () => { $('pauseNote').textContent = save(state) ? 'saved. the shop will be here tomorrow.' : 'could not save. this browser is being difficult.'; audio.paper(); });
  $('quitBtn').addEventListener('click', () => { save(state); location.reload(); });
  document.addEventListener('pointerlockchange', () => { if (!player.locked && player.enabled && !modal && !paused && !iso.active && !player.dragLook && player.everLocked) pause(); });

  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if (e.code === 'Escape') {
      if (ui.panelOpen) { ui.closePanel(); return; }
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
          if (m && m.job && m.job.jobId) {
            const job = state.jobs.find((j) => j.id === m.job.jobId);
            const finished = job ? stageDone(state, job, m.job.index) : false;
            if (finished) { shop.setCrates(state.crates); ui.toast(`Job ${job.id} is done. ${customerOf(job.customer).name} is waiting. Ship it from the clipboard.`, 4000); }
            else if (job) ui.toast(`${m.job.label}: done. Next: ${job.stages.find((st) => !st.done).label.toLowerCase()}.`, 3200);
          } else if (v) ui.toast(`${v.def.brand} ${v.def.name}: done. A perfectly good scrap block, slightly smaller.`, 3000);
          if (m) m.job = null;
        }
      }
      if (state.speed === END_DAY_SPEED && state.t >= 600 && !state.closingShown) closingTime();
    }
    if (iso.active) iso.update(); else player.update(dt, [...shop.colliders, ...views.filter((v) => v.m.placed).map((v) => v.collider())], { hx: shop.hx, hz: shop.hz });
    shop.update(paused ? 0 : dt, audio.compOn);
    for (const v of views) v.update(paused || modal ? 0 : dt * (state.speed || 0));
    audio.update(dt, {
      listener: { x: camera.position.x, z: camera.position.z }, iso: iso.active,
      running: paused ? [] : state.machines.filter((m) => m.running && m.placed).map((m) => ({ x: m.x, z: m.z })),
      compressor: shop.compressorPos,
    });
    look(); ui.update();
    if (ui.panelOpen && ui.panelM && ui.panelM.running) ui.renderPanel();
    renderer.render(scene, iso.active ? iso.camera : camera);
  }
  window.__dbg = { state, camera, player, iso, views, get lookAt() { return lookAt; }, get modal() { return modal; } };
  requestAnimationFrame(frame);
}
