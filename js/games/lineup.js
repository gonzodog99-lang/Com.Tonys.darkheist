import { humanPortrait } from '../art/portraits.js';
import { shuffle } from '../engine.js';

const TIME_LIMIT = 75;
const MAX_MISSES = 3;

const SUSPECTS = [
  { name: 'Suspect A', skin: '#d9a273', hair: '#221812', style: 'short', eye: '#4a3a22', shirt: '#2f3b47', beard: false },
  { name: 'Suspect B', skin: '#8d5a35', hair: '#120e0b', style: 'buzz', eye: '#2d2119', shirt: '#3a3030', beard: true },
  { name: 'Suspect C', skin: '#e6bd96', hair: '#5a3a1e', style: 'wavy', eye: '#3f6b73', shirt: '#31414a', beard: false },
  { name: 'Suspect D', skin: '#b97a52', hair: '#1c1410', style: 'long', eye: '#5b3a1f', shirt: '#43324a', beard: false },
  { name: 'Suspect E', skin: '#6d4527', hair: '#0f0b09', style: 'buzz', eye: '#33251a', shirt: '#2b3a2f', beard: true },
  { name: 'Suspect F', skin: '#efc9a4', hair: '#3a2a1c', style: 'bun', eye: '#4a6b58', shirt: '#4a3a2a', beard: false },
  { name: 'Suspect G', skin: '#c98a63', hair: '#241a14', style: 'short', eye: '#3d5b4a', shirt: '#2d3b4d', beard: true },
  { name: 'Suspect H', skin: '#a9713f', hair: '#191210', style: 'long', eye: '#2f4f6b', shirt: '#3d2f3f', beard: false },
  { name: 'Suspect I', skin: '#e0b48c', hair: '#141414', style: 'wavy', eye: '#5b3a1f', shirt: '#37414b', beard: false },
  { name: 'Suspect J', skin: '#7d4f2c', hair: '#15100c', style: 'bun', eye: '#3f6b73', shirt: '#2a3a3f', beard: true },
];

const face = (spec, size) =>
  humanPortrait({ ...spec, bg: '#241a2e', accent: '#c792ea', name: spec.name, glasses: spec.name.endsWith('C') || spec.name.endsWith('I') });

export default {
  id: 'lineup',
  mount(stage, api) {
    stage.innerHTML = `<div class="lineup">
      <div class="lineup-grid" data-grid aria-label="Suspect lineup"></div>
      <div class="lineup-controls">
        <p class="lineup-note">Pair every suspect with their twin file. Three bad pairings ends the interview.</p>
      </div>
    </div>`;

    const grid = stage.querySelector('[data-grid]');

    let deck;
    let first;
    let locked;
    let pairs;
    let misses;
    let remaining;
    let over;
    let timerId = null;

    function updateHud() {
      api.hud({
        Pairs: `${pairs}/10`,
        Misses: `${misses}/${MAX_MISSES}`,
        Time: `${remaining}s`,
      });
    }

    function render() {
      grid.innerHTML = deck
        .map((suspect, index) => `<button class="suspect" type="button" data-idx="${index}" data-suspect="${suspect.id}" aria-label="File ${index + 1}">
          <span class="file-back" aria-hidden="true">FILE</span>
          <span class="file-face">${face(suspect, 96)}</span>
        </button>`)
        .join('');
    }

    function card(index) {
      return grid.querySelector(`[data-idx="${index}"]`);
    }

    function lose(reason) {
      if (over) return;
      over = true;
      clearInterval(timerId);
      api.sound('lose');
      api.finish({ win: false, score: pairs * 60, reason });
    }

    function tick() {
      remaining -= 1;
      updateHud();
      if (remaining <= 5 && remaining > 0) api.sound('tick');
      if (remaining <= 0) lose('The DA walks out with the file still open.');
    }

    function flip(index) {
      if (over || locked) return;
      const el = card(index);
      if (!el || el.classList.contains('is-matched') || el.classList.contains('is-flipped')) return;
      el.classList.add('is-flipped');
      api.sound('move');

      if (first === null) {
        first = index;
        return;
      }

      const a = deck[first];
      const b = deck[index];
      const firstIndex = first;
      first = null;

      if (a.id === b.id) {
        locked = true;
        api.host.after(() => {
          card(firstIndex)?.classList.add('is-matched');
          card(index)?.classList.add('is-matched');
          pairs += 1;
          api.sound('good');
          updateHud();
          locked = false;
          if (pairs === 10) {
            over = true;
            clearInterval(timerId);
            api.finish({ win: true, score: 400 + remaining * 14 });
          }
        }, 300);
      } else {
        locked = true;
        misses += 1;
        api.sound('bad');
        updateHud();
        api.host.after(() => {
          card(firstIndex)?.classList.remove('is-flipped');
          card(index)?.classList.remove('is-flipped');
          locked = false;
          if (misses >= MAX_MISSES) lose('Three bad pairings and the warrant is dead.');
        }, 620);
      }
    }

    function reset() {
      clearInterval(timerId);
      deck = shuffle([...SUSPECTS.map((spec, i) => ({ ...spec, id: i })), ...SUSPECTS.map((spec, i) => ({ ...spec, id: i }))]);
      first = null;
      locked = false;
      pairs = 0;
      misses = 0;
      remaining = TIME_LIMIT;
      over = false;
      render();
      updateHud();
      timerId = api.host.every(tick, 1000);
    }

    grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-idx]');
      if (button) flip(Number(button.dataset.idx));
    });

    reset();

    return () => clearInterval(timerId);
  },
};
