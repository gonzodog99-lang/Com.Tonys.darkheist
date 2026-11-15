const GLYPHS = ['💎', '🔑', '🕯️', '💀', '👁️', '🗝️', '🩸', '🔒'];

export default {
  id: 'memory',
  title: 'Memory',
  icon: '🃏',
  blurb: 'Flip the cards and pair up all eight symbols in as few moves as you can.',
  tone: '#c792ea',
  mount(stage, ui) {
    stage.innerHTML = '<div class="grid-memory" data-memory aria-label="Memory board"></div>';
    const grid = stage.querySelector('[data-memory]');

    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    let deck;
    let first;
    let locked;
    let moves;
    let matched;
    let done;

    function shuffle(list) {
      const copy = list.slice();
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function render() {
      grid.innerHTML = deck
        .map(
          (glyph, i) =>
            `<button class="mcard" type="button" data-idx="${i}" data-glyph="${glyph}" aria-label="Hidden card ${i + 1}">${glyph}</button>`
        )
        .join('');
    }

    function cardAt(index) {
      return grid.querySelector(`[data-idx="${index}"]`);
    }

    function win() {
      done = true;
      ui.overlay({
        title: 'All pairs found',
        message: `Cleared in ${moves} moves.`,
        action: 'Play again',
        onAction: reset,
      });
    }

    function flip(index) {
      if (locked || done) return;
      const card = cardAt(index);
      if (!card || card.classList.contains('is-matched') || card.classList.contains('is-flipped')) return;
      card.classList.add('is-flipped');

      if (first === null) {
        first = index;
        return;
      }

      const a = deck[first];
      const b = deck[index];
      const firstIndex = first;
      first = null;
      moves += 1;
      ui.status(`Moves ${moves}`);

      if (a === b) {
        locked = true;
        later(() => {
          cardAt(firstIndex)?.classList.add('is-matched');
          cardAt(index)?.classList.add('is-matched');
          matched += 1;
          ui.score(matched, 'Pairs');
          locked = false;
          if (matched === GLYPHS.length) win();
        }, 320);
      } else {
        locked = true;
        later(() => {
          cardAt(firstIndex)?.classList.remove('is-flipped');
          cardAt(index)?.classList.remove('is-flipped');
          locked = false;
        }, 720);
      }
    }

    function reset() {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
      deck = shuffle([...GLYPHS, ...GLYPHS]);
      first = null;
      locked = false;
      moves = 0;
      matched = 0;
      done = false;
      render();
      ui.closeOverlay();
      ui.score(0, 'Pairs');
      ui.status('Moves 0');
    }

    grid.addEventListener('click', (event) => {
      const card = event.target.closest('[data-idx]');
      if (!card) return;
      flip(Number(card.dataset.idx));
    });

    reset();

    return () => {
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };
  },
};
