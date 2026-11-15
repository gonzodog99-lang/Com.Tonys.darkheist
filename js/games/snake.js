export default {
  id: 'snake',
  title: 'Snake',
  icon: '🐍',
  blurb: 'Grow a long tail on a grid full of gems without biting yourself.',
  tone: '#4ade80',
  mount(stage, ui) {
    stage.innerHTML = `
      <div class="board-wrap">
        <canvas class="board" width="360" height="360" aria-label="Snake board"></canvas>
      </div>
      <div class="pad" role="group" aria-label="Direction controls">
        <button class="pad-btn up" type="button" data-dir="up" aria-label="Move up">▲</button>
        <button class="pad-btn left" type="button" data-dir="left" aria-label="Move left">◀</button>
        <button class="pad-btn down" type="button" data-dir="down" aria-label="Move down">▼</button>
        <button class="pad-btn right" type="button" data-dir="right" aria-label="Move right">▶</button>
      </div>`;

    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const COLS = 20;
    const ROWS = 20;
    const CELL = 18;

    const timers = new Set();
    const later = (fn, ms) => {
      const id = setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
      return id;
    };

    let snake;
    let dir;
    let nextDir;
    let food;
    let score;
    let dead;
    let ticker;

    function freeCell() {
      let point;
      let guard = 0;
      do {
        point = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
        guard += 1;
      } while (guard < 500 && snake.some((s) => s.x === point.x && s.y === point.y));
      return point;
    }

    function draw() {
      ctx.fillStyle = '#0a0d11';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(39, 49, 60, .55)';
      ctx.lineWidth = 1;
      for (let i = 1; i < COLS; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * CELL + 0.5, 0);
        ctx.lineTo(i * CELL + 0.5, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL + 0.5);
        ctx.lineTo(canvas.width, i * CELL + 0.5);
        ctx.stroke();
      }

      const fx = food.x * CELL + CELL / 2;
      const fy = food.y * CELL + CELL / 2;
      ctx.fillStyle = '#f0b132';
      ctx.beginPath();
      ctx.moveTo(fx, fy - 6);
      ctx.lineTo(fx + 6, fy);
      ctx.lineTo(fx, fy + 6);
      ctx.lineTo(fx - 6, fy);
      ctx.closePath();
      ctx.fill();

      snake.forEach((segment, index) => {
        const pad = index === 0 ? 1.5 : 2.5;
        ctx.fillStyle = index === 0 ? '#7ef0a5' : `rgba(74, 222, 128, ${0.85 - Math.min(index, 14) * 0.035})`;
        ctx.beginPath();
        ctx.roundRect(
          segment.x * CELL + pad,
          segment.y * CELL + pad,
          CELL - pad * 2,
          CELL - pad * 2,
          4
        );
        ctx.fill();
      });

      if (snake.length) {
        const head = snake[0];
        ctx.fillStyle = '#0a0d11';
        const ex = head.x * CELL + CELL / 2 + dir.x * 3;
        const ey = head.y * CELL + CELL / 2 + dir.y * 3;
        ctx.beginPath();
        ctx.arc(ex - 2.5, ey - 2, 1.6, 0, Math.PI * 2);
        ctx.arc(ex + 2.5, ey - 2, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function die() {
      dead = true;
      clearInterval(ticker);
      ticker = null;
      ui.status('Dead');
      ui.overlay({
        title: 'Game over',
        message: `You scored ${score} with a tail of ${snake.length}.`,
        action: 'Play again',
        onAction: reset,
      });
    }

    function step() {
      if (dead) return;
      dir = nextDir || dir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      const outside = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;
      const body = snake.slice(0, snake.length - 1);
      const bites = body.some((s) => s.x === head.x && s.y === head.y);

      if (outside || bites) {
        die();
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        ui.score(score);
        ui.status(`Length ${snake.length}`);
        food = freeCell();
      } else {
        snake.pop();
      }
      draw();
    }

    function turn(name) {
      if (dead) return;
      const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      const next = map[name];
      if (!next) return;
      const base = nextDir || dir;
      if (next.x === -base.x && next.y === -base.y) return;
      nextDir = next;
    }

    function reset() {
      snake = [
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 },
      ];
      dir = { x: 1, y: 0 };
      nextDir = null;
      score = 0;
      dead = false;
      food = freeCell();
      ui.closeOverlay();
      ui.score(0);
      ui.status('Length 3');
      draw();
      clearInterval(ticker);
      ticker = setInterval(step, 115);
    }

    function onKey(event) {
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
      const name = map[event.key];
      if (!name) return;
      event.preventDefault();
      turn(name);
    }

    stage.querySelectorAll('[data-dir]').forEach((button) => {
      button.addEventListener('click', () => turn(button.dataset.dir));
    });

    let touchStart = null;
    canvas.addEventListener('touchstart', (event) => {
      touchStart = event.changedTouches[0];
    }, { passive: true });
    canvas.addEventListener('touchend', (event) => {
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.clientX;
      const dy = touch.clientY - touchStart.clientY;
      touchStart = null;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    }, { passive: true });

    window.addEventListener('keydown', onKey);
    reset();

    return () => {
      window.removeEventListener('keydown', onKey);
      clearInterval(ticker);
      timers.forEach((id) => clearTimeout(id));
      timers.clear();
    };
  },
};
