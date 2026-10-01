// The render loop, the floor, the glue.
import { Shop } from './shop.js';
import { Player } from './player.js';
import { MachineView } from './machines.js';
import { Iso } from './iso.js';
import { UI } from './ui.js';
import { byId } from './catalog.js';
import { tick, save, money, post, DAY_SECONDS } from './sim.js';

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

  let modal = false, paused = false, placing = null;
  const ui = new UI(state, audio, {
    modal(on) { modal = on; if (!on && !iso.active && !paused) player.requestLock(); },
    place(m) { beginPlace(m); },
    refreshMachines() { syncViews(); },
    toggleIso() { toggleIso(); },
    pause() { pause(); },
    cycleStart(m, keys) { cycleStart(m, keys); },
    rotate() { if (placing) { iso.rotate(); audio.click(); } },
  });
  $('hud').classList.remove('hidden');

  function syncViews() {
    for (const v of views.slice()) if (!state.machines.includes(v.m)) { v.dispose(); views.splice(views.indexOf(v), 1); }
    for (const m of state.machines) if (!viewOf(m.uid)) views.push(new MachineView(T, scene, m));
    for (const v of views) v.sync();
  }

  // ---- views
  function toggleIso() {
    if (modal) return;
    if (iso.active) { iso.exit(); placing = null; $('placeHelp').classList.add('hidden'); $('rotBtn').classList.add('hidden'); player.enabled = true; player.requestLock(); }
    else { if (player.locked) document.exitPointerLock(); player.enabled = false; iso.enter(); }
    audio.click();
  }
  function beginPlace(m) {
    if (!iso.active) { if (player.locked) document.exitPointerLock(); player.enabled = false; iso.enter(); }
    placing = m; iso.begin(m, views); $('placeHelp').classList.remove('hidden'); $('rotBtn').classList.remove('hidden');
    ui.toast(m.placed ? 'Pick a new spot.' : 'It is on the truck. Pick a spot.');
  }
  iso.onPlace = (m, x, z, rot) => {
    m.x = x; m.z = z; m.rot = rot; m.placed = true; syncViews(); iso.cancel(); placing = null; $('placeHelp').classList.add('hidden'); $('rotBtn').classList.add('hidden');
    audio.thunk();
    ui.toast(pick(['Placed. It is not level. It is never level.', 'Placed. The riggers want cash.', 'Placed. Somebody will trip on that cord.', 'Placed. It looks right there. For now.']));
    save(state);
    const unplaced = state.machines.find((q) => !q.placed);
    if (unplaced) setTimeout(() => beginPlace(unplaced), 400);
  };
  iso.onPick = (uid) => { const m = state.machines.find((q) => q.uid === uid); if (m && !m.running) beginPlace(m); else if (m) ui.toast('It is running. Let it finish.'); };

  // ---- the machine
  function cycleStart(m, keys) {
    const def = byId(m.id);
    audio.cycleStart();
    const skipped = keys.filter((k) => m.checklist[k] !== true);
    const risk = skipped.length * 0.18 + (1 - m.condition) * 0.12;
    m.running = true; m.runTotal = 20 + Math.random() * 25; m.runLeft = m.runTotal;
    state.stats.cycleStarts++;
    if (!state.firstCycle) { state.firstCycle = true; ui.toast('ACHIEVEMENT: FIRST CYCLE START', 3200); audio.ding(); }
    else ui.toast(skipped.length ? pick(['You skipped a step. The machine noticed.', 'Bold.', 'That is how it starts.']) : pick(['Chips.', 'Making chips.', 'Nothing wrong with that.']));
    if (Math.random() < risk) {
      const sev = Math.random();
      setTimeout(() => {
        if (!m.running) return;
        m.running = false; m.runLeft = 0; m.checklist = {};
        audio.thunk(); audio.nope();
        if (sev < 0.6) { post(state, 'Broken cutter', -45); m.condition = Math.max(0, m.condition - 0.01); ui.toast('BANG. Broken cutter. $45. It happens. It happened because you skipped a step.', 4000); }
        else if (sev < 0.9) { post(state, 'Chatter, scrapped block', -180); m.condition = Math.max(0, m.condition - 0.04); ui.toast('Chatter. The block is scrap. $180 of steel in the bin. OOPS.', 4000); }
        else { const bill = def.manual ? 900 : 4000; post(state, 'Crash: tech visit', -bill); m.condition = Math.max(0, m.condition - 0.2); ui.toast(`Crash. A tech has to come. ${money(bill)}. He arrives Thursday.`, 4500); }
      }, 1500 + Math.random() * 6000);
    }
  }

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
      if (placing) { iso.cancel(); placing = null; $('placeHelp').classList.add('hidden'); $('rotBtn').classList.add('hidden'); ui.toast('Left on the truck. Place it from the clipboard.'); return; }
      if (iso.active) { toggleIso(); return; }
      if (paused) resume(); else if (!player.locked) pause();
      return;
    }
    if (paused) return;
    if (e.code === 'Tab') { e.preventDefault(); if (ui.panelOpen) return; if (ui.clipOpen) ui.closeClip(); else { if (player.locked) document.exitPointerLock(); ui.openClip(); } }
    if (e.code === 'KeyV' && !modal) toggleIso();
    if (e.code === 'KeyR' && placing) { iso.rotate(); audio.click(); }
    if (e.code === 'KeyE' && !modal && !iso.active) use();
    if (e.code === 'Digit1' || e.code === 'Digit2' || e.code === 'Digit3') { ui.setSpeed({ Digit1: 1, Digit2: 3, Digit3: 10 }[e.code]); }
    if (e.code === 'KeyP' || e.code === 'Space') { if (!modal) ui.setSpeed(state.speed ? 0 : 1); }
  });

  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); iso.fit(); });

  // ---- loop
  let last = performance.now(), lastSave = state.day;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!paused && !modal) {
      const events = tick(state, dt * speedMul);
      for (const ev of events) {
        if (ev.type === 'week') { ui.toast(`Monday. Rent ${money(ev.rent)}, hydro ${money(ev.power)}.`, 3000); audio.cash(); }
        if (ev.type === 'day' && ev.day !== lastSave) { lastSave = ev.day; save(state); }
        if (ev.type === 'cycleDone') { audio.ding(); const v = viewOf(ev.uid); if (v) ui.toast(`${v.def.brand} ${v.def.name}: done. A perfectly good scrap block, slightly smaller.`, 3000); }
      }
    }
    if (iso.active) iso.update(); else player.update(dt, [...shop.colliders, ...views.filter((v) => v.m.placed).map((v) => v.collider())], { hx: shop.hx, hz: shop.hz });
    const anyRunning = state.machines.some((m) => m.running);
    shop.update(paused ? 0 : dt, audio.compOn);
    for (const v of views) v.update(paused || modal ? 0 : dt * (state.speed || 0));
    audio.update(dt, anyRunning && !paused);
    look(); ui.update();
    if (ui.panelOpen && ui.panelM && ui.panelM.running) ui.renderPanel();
    renderer.render(scene, iso.active ? iso.camera : camera);
  }
  window.__dbg = { state, camera, player, iso, views, get lookAt() { return lookAt; }, get modal() { return modal; } };
  requestAnimationFrame(frame);
}
