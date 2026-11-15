const TARGET = 256;
const HEAT_MAX = 24;
const COOLANT_START = 3;

export default {
  id: 'alloy',
  mount(stage, api) {
    stage.innerHTML = `<div class="alloy">
      <div class="heat-wrap">
        <div class="heat-labels"><span>Core heat</span><b data-heat>0 / ${HEAT_MAX}</b></div>
        <div class="heat-bar"><i data-heatbar style="width:0%"></i><u style="left:${(18 / HEAT_MAX) * 100}%"></u></div>
      </div>
      <div class="grid-2048" data-board aria-label="Core fusion board"></div>
      <div class="alloy-controls">
        <div class="pad" role="group" aria-label="Slide controls">
          <button class="pad-btn up" type="button" data-slide="up" aria-label="Slide up">▲</button>
          <button class="pad-btn left" type="button" data-slide="left" aria-label="Slide left">◀</button>
          <button class="pad-btn down" type="button" data-slide="down" aria-label="Slide down">▼</button>
          <button class="pad-btn right" type="button" data-slide="right" aria-label="Slide right">▶</button>
        </div>
        <button class="btn coolant" type="button" data-coolant>Vent coolant <b data-coolant-count>3</b></button>
      </div>
    </div>`;

    const boardEl = stage.querySelector('[data-board]');
    const heatEl = stage.querySelector('[data-heat]');
    const heatBar = stage.querySelector('[data-heatbar]');
    const coolantEl = stage.querySelector('[data-coolant-count]');
    const coolantButton = stage.querySelector('[data-coolant]');

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
    let heat;
    let coolant;
    let over;
    let maxTile;

    function indexFor(dir, line, step) {
      if (dir === 'left') return line * 4 + step;
      if (dir === 'right') return line * 4 + (3 - step);
      if (dir === 'up') return step * 4 + line;
      return (3 - step) * 4 + line;
    }

    function updateHud() {
      api.hud({
        Core: `${maxTile} / ${TARGET}`,
        Heat: `${heat}/${HEAT_MAX}`,
        Coolant: coolant,
      });
      heatEl.textContent = `${heat} / ${HEAT_MAX}`;
      heatBar.style.width = `${(heat / HEAT_MAX) * 100}%`;
      heatBar.classList.toggle('hot', heat >= HEAT_MAX * 0.75);
      coolantEl.textContent = String(coolant);
      coolantButton.disabled = coolant <= 0;
    }

    function render() {
      maxTile = board.reduce((max, value) => Math.max(max, value), 0);
      board.forEach((value, i) => {
        const tile = cells[i];
        tile.textContent = value ? String(value) : '';
        tile.className = value ? `tile v${value > 256 ? 'high' : value}` : '';
        tile.closest('.cell').dataset.value = value ? String(value) : '';
      });
      updateHud();
    }

    function addTile() {
      const empty = [];
      board.forEach((value, i) => {
        if (!value) empty.push(i);
      });
      if (!empty.length) return;
      board[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.88 ? 2 : 4;
    }

    function movesLeft() {
      return board.some((value, i) => {
        if (!value) return true;
        const right = i % 4 < 3 ? board[i + 1] : 0;
        const down = i < 12 ? board[i + 4] : 0;
        return value === right || value === down;
      });
    }

    function meltdown() {
      over = true;
      api.sound('lose');
      api.finish({ win: false, score: maxTile * 3 + coolant * 40 });
    }

    function check() {
      render();
      if (over) return;
      if (maxTile >= TARGET) {
        over = true;
        api.sound('win');
        api.finish({ win: true, score: 2000 + coolant * 150 + Math.max(0, HEAT_MAX - heat) * 30 });
        return;
      }
      if (heat >= HEAT_MAX) {
        meltdown();
        return;
      }
      if (!movesLeft()) {
        over = true;
        api.sound('lose');
        api.finish({ win: false, score: maxTile * 4 });
      }
    }

    function slide(dir) {
      if (over) return;
      const before = board.join(',');
      let vents = 0;

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
            if (total >= 64) vents += 1;
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

      if (board.join(',') === before) {
        api.sound('tick');
        return;
      }

      heat = Math.max(0, heat + 1 - vents);
      if (vents) api.sound('good');
      else api.sound('move');
      addTile();
      check();
    }

    function vent() {
      if (over || coolant <= 0) return;
      coolant -= 1;
      heat = Math.max(0, heat - 8);
      api.sound('great');
      render();
    }

    function reset() {
      board = new Array(16).fill(0);
      heat = 0;
      coolant = COOLANT_START;
      over = false;
      maxTile = 0;
      addTile();
      addTile();
      render();
    }

    api.host.listen(window, 'keydown', (event) => {
      const map = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };
      const dir = map[event.key];
      if (!dir) return;
      event.preventDefault();
      slide(dir);
    });

    stage.querySelectorAll('[data-slide]').forEach((button) => {
      button.addEventListener('click', () => slide(button.dataset.slide));
    });
    coolantButton.addEventListener('click', vent);

    reset();
  },
};
