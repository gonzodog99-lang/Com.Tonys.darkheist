const SIZE = 8;
const MINES = 12;
const PROBES = 3;
const TIME_LIMIT = 120;

export default {
  id: 'deep-field',
  mount(stage, api) {
    stage.innerHTML = `<div class="field">
      <div class="grid-mines" data-grid aria-label="Salt flats minefield"></div>
      <div class="field-controls">
        <button class="btn" type="button" data-flag>Flag mode: off</button>
        <button class="btn" type="button" data-probe>Scent probe ×3</button>
      </div>
      <p class="field-note">Flag every charge. Numbers count mines in the eight touching squares. A probe reveals a square without risk.</p>
    </div>`;

    const gridEl = stage.querySelector('[data-grid]');
    const flagButton = stage.querySelector('[data-flag]');
    const probeButton = stage.querySelector('[data-probe]');

    let cells;
    let placed;
    let over;
    let flags;
    let probes;
    let flagMode;
    let probeMode;
    let remaining;
    let timerId = null;

    function updateHud() {
      api.hud({
        Mines: MINES,
        Flags: flags,
        Probes: probes,
        Time: `${remaining}s`,
      });
      probeButton.textContent = `Scent probe ×${probes}`;
      probeButton.disabled = probes <= 0 || over;
      flagButton.textContent = `Flag mode: ${flagMode ? 'on' : 'off'}`;
    }

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
          if (cell.scanned) classes.push('is-scanned');
          html += `<button class="${classes.join(' ')}" type="button" data-idx="${index}" data-row="${r}" data-col="${c}" aria-label="Square ${r + 1},${c + 1}">${content}</button>`;
        }
      }
      gridEl.innerHTML = html;
    }

    function placeMines(safeRow, safeCol) {
      let placedCount = 0;
      let guard = 0;
      while (placedCount < MINES && guard < 5000) {
        guard += 1;
        const r = Math.floor(Math.random() * SIZE);
        const c = Math.floor(Math.random() * SIZE);
        if (cells[r][c].mine) continue;
        if (Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1) continue;
        cells[r][c].mine = true;
        placedCount += 1;
      }
      for (let r = 0; r < SIZE; r += 1) {
        for (let c = 0; c < SIZE; c += 1) {
          if (cells[r][c].mine) continue;
          cells[r][c].near = neighbours(r, c).filter(([nr, nc]) => cells[nr][nc].mine).length;
        }
      }
      placed = true;
    }

    function lose(reason) {
      if (over) return;
      over = true;
      clearInterval(timerId);
      cells.forEach((row) => row.forEach((cell) => {
        if (cell.mine) cell.open = true;
      }));
      render();
      api.sound('lose');
      api.finish({ win: false, score: correctFlags() * 40, reason });
    }

    function correctFlags() {
      let count = 0;
      cells.forEach((row) => row.forEach((cell) => {
        if (cell.flag && cell.mine) count += 1;
      }));
      return count;
    }

    function checkWin() {
      if (over) return;
      if (flags !== MINES) return;
      let allMines = true;
      cells.forEach((row) => row.forEach((cell) => {
        if (cell.flag && !cell.mine) allMines = false;
      }));
      if (!allMines) return;
      over = true;
      clearInterval(timerId);
      api.sound('win');
      api.finish({ win: true, score: 500 + remaining * 12 + probes * 80 });
    }

    function reveal(row, col) {
      const queue = [[row, col]];
      while (queue.length) {
        const [r, c] = queue.pop();
        const cell = cells[r][c];
        if (cell.open || cell.flag) continue;
        cell.open = true;
        if (cell.near === 0 && !cell.mine) {
          neighbours(r, c).forEach(([nr, nc]) => {
            if (!cells[nr][nc].open) queue.push([nr, nc]);
          });
        }
      }
    }

    function open(row, col) {
      if (over) return;
      const cell = cells[row][col];
      if (cell.open || cell.flag) return;
      if (!placed) placeMines(row, col);
      if (cell.mine) {
        cell.open = true;
        render();
        api.sound('bad');
        lose('A charge goes off under the sapper’s boot.');
        return;
      }
      reveal(row, col);
      render();
      checkWin();
    }

    function probe(row, col) {
      if (over || probes <= 0) return;
      const cell = cells[row][col];
      if (cell.open || cell.flag) return;
      if (!placed) placeMines(row, col);
      probes -= 1;
      probeMode = false;
      cell.scanned = true;
      if (cell.mine) {
        cell.flag = true;
        flags += 1;
        api.sound('bad');
      } else {
        api.sound('good');
        reveal(row, col);
      }
      render();
      updateHud();
      checkWin();
    }

    function toggleFlag(row, col) {
      if (over) return;
      const cell = cells[row][col];
      if (cell.open) return;
      cell.flag = !cell.flag;
      flags += cell.flag ? 1 : -1;
      api.sound('tick');
      render();
      updateHud();
      checkWin();
    }

    function reset() {
      clearInterval(timerId);
      cells = Array.from({ length: SIZE }, () =>
        Array.from({ length: SIZE }, () => ({ mine: false, open: false, flag: false, near: 0, scanned: false }))
      );
      placed = false;
      over = false;
      flags = 0;
      probes = PROBES;
      flagMode = false;
      probeMode = false;
      remaining = TIME_LIMIT;
      render();
      updateHud();
      timerId = api.host.every(() => {
        if (over) return;
        remaining -= 1;
        updateHud();
        if (remaining <= 10 && remaining > 0) api.sound('tick');
        if (remaining <= 0) lose('The crossing window closes with the field still live.');
      }, 1000);
    }

    gridEl.addEventListener('click', (event) => {
      const button = event.target.closest('[data-idx]');
      if (!button) return;
      const row = Number(button.dataset.row);
      const col = Number(button.dataset.col);
      if (probeMode) probe(row, col);
      else if (flagMode) toggleFlag(row, col);
      else open(row, col);
    });

    gridEl.addEventListener('contextmenu', (event) => {
      const button = event.target.closest('[data-idx]');
      if (!button) return;
      event.preventDefault();
      toggleFlag(Number(button.dataset.row), Number(button.dataset.col));
    });

    flagButton.addEventListener('click', () => {
      flagMode = !flagMode;
      probeMode = false;
      updateHud();
    });

    probeButton.addEventListener('click', () => {
      if (probes <= 0) return;
      probeMode = !probeMode;
      flagMode = false;
      probeButton.classList.toggle('is-armed', probeMode);
      updateHud();
    });

    reset();

    return () => clearInterval(timerId);
  },
};
