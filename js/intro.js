// The cold open, and the paperwork.
import { RANDOM_NAMES } from './catalog.js';

const LINES = [
  'You spent twenty years making other people\'s molds.',
  'Twenty years of Saturdays. Twenty years of "just a small change".',
  'The building is 2,500 square feet. The door is a tarp.',
  'The compressor came with it. It has not stopped since.',
  'You have fifty thousand dollars and a Bridgeford.',
  'Open the doors.',
];

export function runIntro(audio) {
  return new Promise((resolve) => {
    const intro = document.getElementById('intro');
    const text = document.getElementById('introText');
    const prompt = document.getElementById('introPrompt');
    let i = 0, done = false, timer = 0;
    const type = (line, cb) => {
      let j = 0; text.textContent = '';
      const step = () => { text.textContent = line.slice(0, ++j); if (j < line.length) timer = setTimeout(step, 28 + Math.random() * 20); else cb(); };
      step();
    };
    const next = () => {
      if (i >= LINES.length) { prompt.classList.add('show'); done = true; return; }
      type(LINES[i++], () => { timer = setTimeout(next, i >= LINES.length ? 400 : 900); });
    };
    next();
    const go = () => {
      audio.init(); audio.resume();
      if (!done) { clearTimeout(timer); text.textContent = LINES[LINES.length - 1]; prompt.classList.add('show'); done = true; return; }
      intro.classList.add('fade');
      setTimeout(() => { intro.classList.add('hidden'); resolve(); }, 700);
      window.removeEventListener('keydown', go); intro.removeEventListener('pointerdown', go);
    };
    window.addEventListener('keydown', go);
    intro.addEventListener('pointerdown', go);
  });
}

export function runNaming(audio, hasSave) {
  return new Promise((resolve) => {
    const el = document.getElementById('naming');
    const input = document.getElementById('shopName');
    const goBtn = document.getElementById('nameGo');
    const randBtn = document.getElementById('nameRandom');
    const row = document.getElementById('continueRow');
    el.classList.remove('hidden');
    if (hasSave) row.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);
    const finish = (name) => { audio.paper(); el.classList.add('hidden'); resolve({ name }); };
    randBtn.addEventListener('click', () => { input.value = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]; audio.click(); });
    goBtn.addEventListener('click', () => {
      const name = input.value.trim().replace(/\s+/g, ' ');
      if (!name) { input.focus(); input.placeholder = 'it needs a name'; audio.nope(); return; }
      finish(name);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') goBtn.click(); });
    document.getElementById('continueBtn').addEventListener('click', () => { el.classList.add('hidden'); resolve({ continue: true }); });
  });
}
