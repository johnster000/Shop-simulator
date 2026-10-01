import { runIntro, runNaming } from './intro.js';
import { ShopAudio } from './audio.js';
import { load, fresh, save } from './sim.js';

console.log('%cSHOP SIMULATOR', 'color:#2ecc40;font-size:40px;font-weight:bold;font-family:"Courier New",monospace');
console.log('%cthe compressor has not stopped.', 'color:#888');

const audio = new ShopAudio();

(async () => {
  const existing = load();
  let resume = false; try { resume = localStorage.getItem('shopsim.resume') === '1'; localStorage.removeItem('shopsim.resume'); } catch (e) { /* fine */ }
  let state;
  if (resume && existing) { document.getElementById('intro').classList.add('hidden'); state = existing; audio.init(); }
  else {
    await runIntro(audio);
    const r = await runNaming(audio, !!existing);
    if (r.continue && existing) state = existing;
    else { state = fresh(r.name); save(state); }
  }
  let THREE, game;
  try {
    THREE = await import('./vendor/three.module.js');
    game = await import('./game.js');
  } catch (e) {
    console.error(e);
    document.getElementById('fail').classList.remove('hidden');
    return;
  }
  document.title = state.shopName;
  game.startShop(THREE, audio, state);
})();
