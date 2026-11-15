const SIZE = 8;
const MINES = 10;

export default {
  id: 'minesweeper',
  title: 'Minesweeper',
  icon: '💣',
  blurb: 'Clear every safe square without tripping one of the ten buried mines.',
  tone: '#ff8f7a',
  mount(stage, ui) {
    stage.innerHTML = `
      <div class="grid-mines" data-mines aria-label="Minesweeper board"></div>
      <div class="controls">
        <button class="btn" type="button" data-flag>Flag mode: off</button>
        <button class="btn" type="button" data-new>New board</button>
      </div>`;

    const gridEl = stage.querySelector('[data-mines]');
    const flagButton = stage.querySelector('[data-flag]');

    let cells;
    let started;
    let over;
    let flags;
    let opened;
    let flagMode;

    function neighbours(row, col) {
      const out = [];
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          if (!dr && !dc) continue;
          const r = row + dr;
          const c = col + dc;
          if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) out.push([r, c]);
        }
      }
      return out;
    }

    function countMines() {
      let count = 0;
      cells.forEach((row) => row.forEach((cell) => {
        if (cell.mine) count += 1;
      }));
      return count;
    }

    function placeMines(safeRow, safeCol) {
      let placed = 0;
      let guard = 0;
      while (placed < MINES && guard < 4000) {
        guard += 1;
        const r = Math.floor(Math.random() * SIZE);
        const c = Math.floor(Math.random() * SIZE);
        if (cells[r][c].mine) continue;
        if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
        cells[r][c].mine = true;
        placed += 1;
      }
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          if (cells[r][c].mine) continue;
          cells[r][c].near = neighbours(r, c).filter(([nr, nc]) => cells[nr][nc].mine).length;
        }
      }
    }

    function status() {
      ui.score(MINES - flags, 'Mines');
      ui.status(`Flags ${flags}`);
    }

    function render() {
      let html = '';
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          const cell = cells[r][c];
          const index = r * SIZE + c;
          const classes = ['ms-cell'];
          let content = '';
          if (cell.open) {
            classes.push('is-open');
            if (cell.mine) {
              classes.push('is-mine');
              content = '💥';
            } else if (cell.near) {
              classes.push(`n${Math.min(cell.near, 5)}`);
              content = String(cell.near);
            }
          } else if (cell.flag) {
            classes.push('is-flag');
            content = '🚩';
          }
          html += `<button class="${classes.join(' ')}" type="button" data-idx="${index}" data-row="${r}" data-col="${c}" aria-label="Square ${r + 1},${c + 1}">${content}</button>`;
        }
      }
      gridEl.innerHTML = html;
    }

    function lose(row, col) {
      over = true;
      cells.forEach((line) => line.forEach((cell) => {
        if (cell.mine) cell.open = true;
      }));
      render();
      ui.overlay({
        title: 'Mine tripped',
        message: `You cleared ${opened} safe squares.`,
        action: 'New board',
        onAction: reset,
      });
    }

    function reveal(row, col) {
      const queue = [[row, col]];
      while (queue.length) {
        const [r, c] = queue.pop();
        const cell = cells[r][c];
        if (cell.open || cell.flag) continue;
        cell.open = true;
        opened += 1;
        if (cell.near === 0 && !cell.mine) {
          neighbours(r, c).forEach(([nr, nc]) => {
            if (!cells[nr][nc].open) queue.push([nr, nc]);
          });
        }
      }
    }

    function checkWin() {
      if (opened === SIZE * SIZE - countMines()) {
        over = true;
        ui.overlay({
          title: 'Board cleared',
          message: `Every safe square found with ${flags} flags placed.`,
          action: 'New board',
          onAction: reset,
        });
      }
    }

    function play(row, col) {
      if (over) return;
      const cell = cells[row][col];
      if (!started) {
        placeMines(row, col);
        started = true;
      }
      if (cell.flag) return;
      if (cell.mine) {
        cell.open = true;
        lose(row, col);
        return;
      }
      reveal(row, col);
      render();
      checkWin();
    }

    function toggleFlag(row, col) {
      if (over) return;
      const cell = cells[row][col];
      if (cell.open) return;
      cell.flag = !cell.flag;
      flags += cell.flag ? 1 : -1;
      render();
      status();
    }

    function reset() {
      cells = Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, near: 0 }))
      );
      started = false;
      over = false;
      flags = 0;
      opened = 0;
      render();
      ui.closeOverlay();
      status();
    }

    gridEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-idx]');
      if (!button) return;
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      if (flagMode) toggleFlag(row, col);
      else play(row, col);
    });

    gridEl.addEventListener('contextmenu', (event) => {
      const button = event.target.closest('[data-idx]');
      if (!button) return;
      event.preventDefault();
      toggleFlag(Number(button.dataset.row), Number(button.dataset.col));
    });

    flagButton.addEventListener('click', () => {
      flagMode = !flagMode;
      flagButton.textContent = `Flag mode: ${flagMode ? 'on' : 'off'}`;
    });

    stage.querySelector('[data-new]').addEventListener('click', reset);

    reset();

    return () => {};
  },
};
