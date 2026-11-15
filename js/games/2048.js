export default {
  id: '2048',
  title: '2048',
  icon: '🔢',
  blurb: 'Slide the tiles, merge the pairs, and reach the 2048 tile.',
  tone: '#f0b132',
  mount(stage, ui) {
    stage.innerHTML = `
      <div class="grid-2048" data-board aria-label="2048 board"></div>
      <div class="pad" role="group" aria-label="Slide controls">
        <button class="pad-btn up" type="button" data-slide="up" aria-label="Slide up">▲</button>
        <button class="pad-btn left" type="button" data-slide="left" aria-label="Slide left">◀</button>
        <button class="pad-btn down" type="button" data-slide="down" aria-label="Slide down">▼</button>
        <button class="pad-btn right" type="button" data-slide="right" aria-label="Slide right">▶</button>
      </div>`;

    const boardEl = stage.querySelector('[data-board]');
    const cells = [];
    for (let i = 0; i < 16; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = String(i);
      const tile = document.createElement('span');
      cell.appendChild(tile);
      boardEl.appendChild(cell);
      cells.push(tile);
    }

    let board;
    let score;
    let finished;

    function indexFor(dir, line, step) {
      if (dir === 'left') return line * 4 + step;
      if (dir === 'right') return line * 4 + (3 - step);
      if (dir === 'up') return step * 4 + line;
      return (3 - step) * 4 + line;
    }

    function addTile() {
      const empty = [];
      board.forEach((value, i) => {
        if (!value) empty.push(i);
      });
      if (!empty.length) return;
      const target = empty[Math.floor(Math.random() * empty.length)];
      board[target] = Math.random() < 0.9 ? 2 : 4;
    }

    function render() {
      board.forEach((value, i) => {
        const tile = cells[i];
        tile.textContent = value ? String(value) : '';
        tile.className = value ? `tile v${value > 2048 ? 'high' : value}` : '';
        tile.closest('.cell').dataset.value = value ? String(value) : '';
      });
    }

    function check() {
      if (board.includes(2048)) {
        finished = true;
        ui.overlay({
          title: 'You made 2048',
          message: `Score ${score}. Keep going for a bigger number.`,
          action: 'New game',
          onAction: reset,
        });
        return;
      }
      const full = board.every(Boolean);
      const mergeable = board.some((value, i) => {
        if (!value) return false;
        const right = i % 4 < 3 ? board[i + 1] : 0;
        const down = i < 12 ? board[i + 4] : 0;
        return value === right || value === down;
      });
      if (full && !mergeable) {
        finished = true;
        ui.overlay({
          title: 'No moves left',
          message: `Final score ${score}.`,
          action: 'New game',
          onAction: reset,
        });
      }
    }

    function slide(dir) {
      const before = board.join(',');
      for (let line = 0; line < 4; line += 1) {
        const values = [];
        for (let step = 0; step < 4; step += 1) {
          const value = board[indexFor(dir, line, step)];
          if (value) values.push(value);
        }
        const merged = [];
        for (let i = 0; i < values.length; i += 1) {
          if (i + 1 < values.length && values[i] === values[i + 1]) {
            const total = values[i] * 2;
            merged.push(total);
            score += total;
            i += 1;
          } else {
            merged.push(values[i]);
          }
        }
        while (merged.length < 4) merged.push(0);
        for (let step = 0; step < 4; step += 1) {
          board[indexFor(dir, line, step)] = merged[step];
        }
      }

      if (board.join(',') === before) return;
      addTile();
      render();
      ui.score(score);
      check();
    }

    function reset() {
      board = new Array(16).fill(0);
      score = 0;
      finished = false;
      addTile();
      addTile();
      render();
      ui.closeOverlay();
      ui.score(0);
      ui.status('Merge to 2048');
    }

    function onKey(event) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      const dir = map[event.key];
      if (!dir) return;
      event.preventDefault();
      if (!finished) slide(dir);
    }

    stage.querySelectorAll('[data-slide]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!finished) slide(button.dataset.slide);
      });
    });
    window.addEventListener('keydown', onKey);

    reset();

    return () => window.removeEventListener('keydown', onKey);
  },
};
