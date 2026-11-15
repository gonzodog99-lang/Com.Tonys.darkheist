const SIZE = 9;
const START_TURNS = 70;
const MAX_ALARMS = 3;

const DIRS = [
  { x: 0, y: -1, deg: 0 },
  { x: 1, y: 0, deg: 90 },
  { x: 0, y: 1, deg: 180 },
  { x: -1, y: 0, deg: 270 },
];

const CRATES = [
  { x: 1, y: 1 },
  { x: 7, y: 2 },
  { x: 4, y: 6 },
];

const EXIT = { x: 8, y: 0 };

const GUARD_ROUTES = [
  [{ x: 2, y: 2 }, { x: 5, y: 2 }, { x: 5, y: 4 }, { x: 2, y: 4 }],
  [{ x: 7, y: 8 }, { x: 1, y: 8 }, { x: 1, y: 5 }, { x: 7, y: 5 }],
  [{ x: 4, y: 0 }, { x: 4, y: 3 }, { x: 7, y: 3 }, { x: 7, y: 0 }],
];

const CAMERAS = [
  { x: 0, y: 3, dir: 1, period: 2, tick: 0 },
  { x: 8, y: 5, dir: 3, period: 3, tick: 0 },
];

const key = (x, y) => `${x},${y}`;
const inside = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;

// Turn a list of corner waypoints into a cell-by-cell patrol loop.
function expandRoute(points) {
  const path = [];
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    let x = point.x;
    let y = point.y;
    const dx = Math.sign(next.x - x);
    const dy = Math.sign(next.y - y);
    while (x !== next.x || y !== next.y) {
      path.push({ x, y });
      x += dx;
      y += dy;
    }
  });
  return path;
}

function directionBetween(from, to) {
  return DIRS.find((dir) => dir.x === to.x - from.x && dir.y === to.y - from.y) || DIRS[0];
}

export default {
  id: 'shadow-ledger',
  mount(stage, api) {
    stage.innerHTML = `<div class="stealth">
      <div class="stealth-board" data-board aria-label="Museum vault floor"></div>
      <div class="stealth-controls">
        <div class="pad">
          <button class="pad-btn up" type="button" data-dir="up" aria-label="Step up">▲</button>
          <button class="pad-btn left" type="button" data-dir="left" aria-label="Step left">◀</button>
          <button class="pad-btn down" type="button" data-dir="down" aria-label="Step down">▼</button>
          <button class="pad-btn right" type="button" data-dir="right" aria-label="Step right">▶</button>
        </div>
        <button class="btn wait" type="button" data-wait>Wait a turn</button>
      </div>
      <p class="stealth-legend"><span class="dot guard-dot"></span> guard cone <span class="dot cam-dot"></span> camera <span class="dot crate-dot"></span> ledger <span class="dot thief-dot"></span> you</p>
    </div>`;

    const boardEl = stage.querySelector('[data-board]');

    let player = { x: 0, y: 8 };
    let guards = [];
    let cameras = [];
    let crates = [];
    let turns = START_TURNS;
    let alarms = 0;
    let over = false;
    let flashUntil = 0;

    function reset() {
      player = { x: 0, y: 8 };
      guards = GUARD_ROUTES.map((route) => {
        const path = expandRoute(route);
        return {
          path,
          i: 0,
          x: path[0].x,
          y: path[0].y,
          dir: directionBetween(path[0], path[1]),
        };
      });
      cameras = CAMERAS.map((camera) => ({ ...camera, tick: 0 }));
      crates = CRATES.map((crate) => ({ ...crate, taken: false }));
      turns = START_TURNS;
      alarms = 0;
      over = false;
      flashUntil = 0;
      updateHud();
      render();
    }

    function updateHud() {
      api.hud({
        Turns: turns,
        Ledgers: `${crates.filter((c) => c.taken).length}/3`,
        Alarms: `${alarms}/${MAX_ALARMS}`,
      });
    }

    function cone(x, y, dir, range = 3) {
      const cells = [];
      let cx = x;
      let cy = y;
      for (let step = 0; step < range; step += 1) {
        cx += dir.x;
        cy += dir.y;
        if (!inside(cx, cy)) break;
        cells.push(key(cx, cy));
      }
      return cells;
    }

    function guardDir(guard) {
      return guard.dir;
    }

    function seenCells() {
      const seen = new Set();
      guards.forEach((guard) => {
        cone(guard.x, guard.y, guard.dir).forEach((cell) => seen.add(cell));
      });
      cameras.forEach((camera) => {
        cone(camera.x, camera.y, DIRS[camera.dir]).forEach((cell) => seen.add(cell));
      });
      return seen;
    }

    function render() {
      const seen = seenCells();
      const occupied = new Map();
      guards.forEach((guard, index) => occupied.set(key(guard.x, guard.y), { type: 'guard', guard, index }));
      cameras.forEach((camera) => {
        if (!occupied.has(key(camera.x, camera.y))) occupied.set(key(camera.x, camera.y), { type: 'camera', camera });
      });
      crates.forEach((crate) => {
        if (!crate.taken) occupied.set(key(crate.x, crate.y), { type: 'crate' });
      });
      occupied.set(key(EXIT.x, EXIT.y), { type: 'exit' });

      let html = '';
      for (let y = 0; y < SIZE; y += 1) {
        for (let x = 0; x < SIZE; x += 1) {
          const k = key(x, y);
          const classes = ['floor'];
          if ((x + y) % 2 === 0) classes.push('alt');
          if (seen.has(k)) classes.push('seen');
          const thing = occupied.get(k);
          if (thing) classes.push(`has-${thing.type}`);
          let inner = '';
          if (thing?.type === 'guard') inner = `<span class="tok guard" style="--deg:${thing.guard.dir.deg}deg" aria-hidden="true">▲</span>`;
          else if (thing?.type === 'camera') inner = '<span class="tok cam" aria-hidden="true">◉</span>';
          else if (thing?.type === 'crate') inner = '<span class="tok crate" aria-hidden="true">◆</span>';
          else if (thing?.type === 'exit') inner = '<span class="tok exit" aria-hidden="true">⇧</span>';
          if (player.x === x && player.y === y) {
            classes.push('has-player');
            inner = '<span class="tok thief" aria-hidden="true"></span>';
          }
          html += `<div class="${classes.join(' ')}" data-cell="${k}">${inner}</div>`;
        }
      }
      boardEl.innerHTML = html;
      boardEl.classList.toggle('alarm', performance.now() < flashUntil);
    }

    function advance() {
      guards.forEach((guard) => {
        guard.i = (guard.i + 1) % guard.path.length;
        const next = guard.path[guard.i];
        const dir = DIRS.find((d) => d.x === next.x - guard.x && d.y === next.y - guard.y);
        guard.x = next.x;
        guard.y = next.y;
        if (dir) guard.dir = dir;
      });
      cameras.forEach((camera) => {
        camera.tick += 1;
        if (camera.tick % camera.period === 0) camera.dir = (camera.dir + 1) % 4;
      });
    }

    function caught(reason) {
      over = true;
      api.sound('lose');
      api.finish({
        win: false,
        score: crates.filter((c) => c.taken).length * 150,
        reason,
      });
    }

    function evaluate() {
      if (over) return;
      const playerKey = key(player.x, player.y);
      const seen = seenCells();
      let hit = false;

      guards.forEach((guard) => {
        if (guard.x === player.x && guard.y === player.y) hit = true;
      });
      if (seen.has(playerKey)) hit = true;

      if (hit) {
        alarms += 1;
        flashUntil = performance.now() + 450;
        api.sound('bad');
        updateHud();
        render();
        if (alarms >= MAX_ALARMS) {
          caught('The grid seals while Nadia is still on the floor.');
          return;
        }
      }

      if (over) return;
      if (turns <= 0) {
        caught('Dawn locks the vault with the job unfinished.');
        return;
      }

      if (crates.every((c) => c.taken) && player.x === EXIT.x && player.y === EXIT.y) {
        over = true;
        api.sound('win');
        api.finish({
          win: true,
          score: 1200 + turns * 20 - alarms * 150,
        });
      }
    }

    function act(name) {
      if (over) return;
      const dir = DIRS.find((d) => d.deg === { up: 0, right: 90, down: 180, left: 270 }[name]);
      if (!dir) return;
      const nx = player.x + dir.x;
      const ny = player.y + dir.y;
      if (!inside(nx, ny)) return;
      player = { x: nx, y: ny };
      turns -= 1;
      const crate = crates.find((c) => !c.taken && c.x === nx && c.y === ny);
      if (crate) {
        crate.taken = true;
        api.sound('good');
      } else {
        api.sound('step');
      }
      advance();
      updateHud();
      render();
      evaluate();
    }

    function waitTurn() {
      if (over) return;
      turns -= 1;
      advance();
      api.sound('tick');
      updateHud();
      render();
      evaluate();
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
      if (map[event.key]) {
        event.preventDefault();
        act(map[event.key]);
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        waitTurn();
      }
    });

    stage.querySelectorAll('[data-dir]').forEach((button) => {
      button.addEventListener('click', () => act(button.dataset.dir));
    });
    stage.querySelector('[data-wait]').addEventListener('click', waitTurn);

    reset();
  },
};
