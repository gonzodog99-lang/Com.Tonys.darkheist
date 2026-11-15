export default {
  id: 'breakout',
  title: 'Breakout',
  icon: '🧱',
  blurb: 'Bounce the ball into every brick before it slips past your paddle.',
  tone: '#7fb4ff',
  mount(stage, ui) {
    stage.innerHTML = `
      <div class="board-wrap">
        <canvas class="board" width="360" height="440" aria-label="Breakout board"></canvas>
      </div>
      <div class="controls">
        <button class="btn" type="button" data-move="left" aria-label="Move paddle left">◀ Paddle</button>
        <button class="btn" type="button" data-move="right" aria-label="Move paddle right">Paddle ▶</button>
      </div>`;

    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const PADDLE_W = 78;
    const PADDLE_H = 11;
    const PADDLE_Y = H - 26;
    const BALL_R = 6;
    const ROWS = 5;
    const COLS = 6;
    const PAD = 14;
    const GAP = 6;
    const BRICK_W = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;
    const BRICK_H = 17;

    let paddle;
    let ball;
    let bricks;
    let lives;
    let score;
    let running;
    let raf = null;
    let last = 0;
    let launchTimer = null;

    function buildBricks() {
      bricks = [];
      for (let row = 0; row < ROWS; row += 1) {
        for (let col = 0; col < COLS; col += 1) {
          bricks.push({
            x: PAD + col * (BRICK_W + GAP),
            y: 58 + row * (BRICK_H + GAP),
            w: BRICK_W,
            h: BRICK_H,
            alive: true,
            row,
          });
        }
      }
    }

    function launch(delay = 0) {
      clearTimeout(launchTimer);
      launchTimer = setTimeout(() => {
        if (!running) return;
        const speed = 4.4;
        ball.x = paddle.x + PADDLE_W / 2;
        ball.y = PADDLE_Y - BALL_R - 2;
        const angle = (-60 + Math.random() * 120) * (Math.PI / 180);
        ball.vx = Math.sin(angle) * speed;
        ball.vy = -Math.abs(Math.cos(angle) * speed);
      }, delay);
    }

    function reset() {
      paddle = { x: W / 2 - PADDLE_W / 2 };
      ball = { x: W / 2, y: PADDLE_Y - 40, vx: 0, vy: 0 };
      buildBricks();
      lives = 3;
      score = 0;
      running = true;
      last = 0;
      ui.closeOverlay();
      ui.score(0);
      ui.status('Lives 3');
      launch(650);
    }

    function loseLife() {
      lives -= 1;
      ui.status(`Lives ${lives}`);
      if (lives <= 0) {
        running = false;
        ui.overlay({
          title: 'Game over',
          message: `You cleared ${bricks.filter((b) => !b.alive).length} bricks for ${score} points.`,
          action: 'Play again',
          onAction: reset,
        });
        return;
      }
      launch(700);
    }

    function update(dt) {
      if (ball.vx === 0 && ball.vy === 0) return;

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      if (ball.x - BALL_R < 0) {
        ball.x = BALL_R;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + BALL_R > W) {
        ball.x = W - BALL_R;
        ball.vx = -Math.abs(ball.vx);
      }
      if (ball.y - BALL_R < 0) {
        ball.y = BALL_R;
        ball.vy = Math.abs(ball.vy);
      }
      if (ball.y - BALL_R > H) {
        loseLife();
        ball.vx = 0;
        ball.vy = 0;
        return;
      }

      const paddleTop = PADDLE_Y;
      if (
        ball.vy > 0 &&
        ball.y + BALL_R >= paddleTop &&
        ball.y - BALL_R <= paddleTop + PADDLE_H &&
        ball.x >= paddle.x - BALL_R &&
        ball.x <= paddle.x + PADDLE_W + BALL_R
      ) {
        ball.y = paddleTop - BALL_R;
        const offset = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2);
        const speed = Math.min(8.4, Math.hypot(ball.vx, ball.vy) * 1.01);
        ball.vx = Math.max(-0.85, Math.min(0.85, offset)) * speed;
        ball.vy = -Math.sqrt(Math.max(1, speed * speed - ball.vx * ball.vx));
      }

      for (const brick of bricks) {
        if (!brick.alive) continue;
        if (
          ball.x + BALL_R > brick.x &&
          ball.x - BALL_R < brick.x + brick.w &&
          ball.y + BALL_R > brick.y &&
          ball.y - BALL_R < brick.y + brick.h
        ) {
          brick.alive = false;
          score += 10;
          ui.score(score);
          const fromSide = ball.x < brick.x || ball.x > brick.x + brick.w;
          if (fromSide) ball.vx = -ball.vx;
          else ball.vy = -ball.vy;
          break;
        }
      }

      if (bricks.every((b) => !b.alive)) {
        running = false;
        ui.overlay({
          title: 'All bricks cleared',
          message: `Final score ${score}.`,
          action: 'Play again',
          onAction: reset,
        });
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0d11';
      ctx.fillRect(0, 0, W, H);

      const colors = ['#7fb4ff', '#6ee7a8', '#f0b132', '#ff8f7a', '#c792ea'];
      bricks.forEach((brick) => {
        if (!brick.alive) return;
        ctx.fillStyle = colors[brick.row % colors.length];
        ctx.globalAlpha = 0.92;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#e8eef5';
      ctx.beginPath();
      ctx.roundRect(paddle.x, PADDLE_Y, PADDLE_W, PADDLE_H, 5);
      ctx.fill();

      ctx.fillStyle = '#f0b132';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    }

    function frame(time) {
      if (!last) last = time;
      const dt = Math.min(32, time - last) / 16.667;
      last = time;
      if (running) update(dt);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function movePaddle(dx) {
      paddle.x = Math.max(0, Math.min(W - PADDLE_W, paddle.x + dx));
    }

    function onKey(event) {
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        event.preventDefault();
        movePaddle(-34);
      } else if (event.key === 'ArrowRight' || event.key === 'd') {
        event.preventDefault();
        movePaddle(34);
      }
    }

    function onPointer(event) {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (W / rect.width);
      paddle.x = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
    }

    stage.querySelectorAll('[data-move]').forEach((button) => {
      button.addEventListener('click', () => movePaddle(button.dataset.move === 'left' ? -30 : 30));
    });
    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('touchmove', (event) => onPointer(event.touches[0]), { passive: true });
    window.addEventListener('keydown', onKey);

    reset();
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      clearTimeout(launchTimer);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
    };
  },
};
