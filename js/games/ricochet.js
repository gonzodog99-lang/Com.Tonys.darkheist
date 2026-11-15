const W = 420;
const H = 300;
const PADDLE_W = 76;
const PADDLE_H = 9;
const INSET = 18;
const BALL_R = 5;
const TARGET = 7;

export default {
  id: 'ricochet',
  mount(stage, api) {
    stage.innerHTML = `<div class="duel">
      <canvas class="board" width="${W}" height="${H}" aria-label="Ricochet court"></canvas>
      <div class="duel-controls">
        <button class="btn" type="button" data-move="left" aria-label="Paddle left">◀</button>
        <button class="btn focus" type="button" data-focus>Focus</button>
        <button class="btn" type="button" data-move="right" aria-label="Paddle right">▶</button>
      </div>
    </div>`;

    const canvas = stage.querySelector('canvas');
    const ctx = canvas.getContext('2d');

    let playerX = W / 2 - PADDLE_W / 2;
    let aiX = W / 2 - PADDLE_W / 2;
    let ball = { x: W / 2, y: H / 2, vx: 3, vy: 4 };
    let playerScore = 0;
    let aiScore = 0;
    let charge = 0;
    let focusUntil = 0;
    let serving = true;
    let running = true;
    let last = 0;
    let rally = 0;

    const keys = { left: false, right: false };

    function updateHud() {
      api.hud({
        You: playerScore,
        Vasquez: aiScore,
        Focus: `${charge}/4`,
        Serve: serving ? 'wait' : 'live',
      });
    }

    function speedOf(target) {
      const now = performance.now();
      return now < focusUntil ? target * 0.55 : target;
    }

    function serve(delay = 600) {
      serving = true;
      ball = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
      updateHud();
      api.host.after(() => {
        if (!running) return;
        const angle = (-38 + Math.random() * 76) * (Math.PI / 180);
        const speed = 4.4;
        ball.vx = Math.sin(angle) * speed;
        ball.vy = Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1);
        serving = false;
        updateHud();
      }, delay);
    }

    function reset() {
      playerX = W / 2 - PADDLE_W / 2;
      aiX = W / 2 - PADDLE_W / 2;
      playerScore = 0;
      aiScore = 0;
      charge = 0;
      focusUntil = 0;
      rally = 0;
      running = true;
      last = 0;
      serve(500);
    }

    function point(who) {
      if (who === 'player') {
        playerScore += 1;
        api.sound('good');
      } else {
        aiScore += 1;
        api.sound('bad');
      }
      rally = 0;
      updateHud();
      if (playerScore >= TARGET) {
        running = false;
        api.finish({ win: true, score: 900 + playerScore * 40 - aiScore * 30 });
        return;
      }
      if (aiScore >= TARGET) {
        running = false;
        api.finish({ win: false, score: playerScore * 70 });
        return;
      }
      serve(700);
    }

    function bounce(paddleX, upward) {
      const center = paddleX + PADDLE_W / 2;
      const offset = (ball.x - center) / (PADDLE_W / 2);
      const speed = Math.min(8.6, Math.hypot(ball.vx, ball.vy) * 1.045);
      ball.vx = Math.max(-0.88, Math.min(0.88, offset * 1.15)) * speed;
      ball.vy = Math.sqrt(Math.max(1.2, speed * speed - ball.vx * ball.vx)) * (upward ? -1 : 1);
      rally += 1;
      if (upward) {
        if (charge < 4) charge += 1;
        api.sound(charge === 4 ? 'great' : 'good');
        updateHud();
      } else {
        api.sound('tick');
      }
    }

    function update(dt) {
      if (keys.left) playerX -= 7 * dt;
      if (keys.right) playerX += 7 * dt;
      playerX = Math.max(0, Math.min(W - PADDLE_W, playerX));

      const target = ball.x - PADDLE_W / 2 + (Math.sin(performance.now() / 420) * 14);
      const aiSpeed = (focusUntil > performance.now() ? 4.4 : 6.1) * dt;
      aiX += Math.max(-aiSpeed, Math.min(aiSpeed, target - aiX));
      aiX = Math.max(0, Math.min(W - PADDLE_W, aiX));

      if (serving) return;

      const factor = speedOf(dt);
      ball.x += ball.vx * factor;
      ball.y += ball.vy * factor;

      if (ball.x - BALL_R < 0) {
        ball.x = BALL_R;
        ball.vx = Math.abs(ball.vx);
      }
      if (ball.x + BALL_R > W) {
        ball.x = W - BALL_R;
        ball.vx = -Math.abs(ball.vx);
      }

      if (ball.vy < 0 && ball.y - BALL_R <= INSET + PADDLE_H && ball.y > INSET - 12 && ball.x > aiX - BALL_R && ball.x < aiX + PADDLE_W + BALL_R) {
        ball.y = INSET + PADDLE_H + BALL_R;
        bounce(aiX, false);
      }

      if (ball.vy > 0 && ball.y + BALL_R >= H - INSET - PADDLE_H && ball.y < H - INSET + 12 && ball.x > playerX - BALL_R && ball.x < playerX + PADDLE_W + BALL_R) {
        ball.y = H - INSET - PADDLE_H - BALL_R;
        bounce(playerX, true);
      }

      if (ball.y > H + 24) point('ai');
      else if (ball.y < -24) point('player');
    }

    function draw() {
      ctx.fillStyle = '#0a0f14';
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(127, 180, 255, .16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();
      ctx.strokeRect(8, 8, W - 16, H - 16);

      const focused = performance.now() < focusUntil;
      ctx.fillStyle = focused ? '#7fe0a8' : '#e8eef5';
      ctx.beginPath();
      ctx.roundRect(playerX, H - INSET - PADDLE_H, PADDLE_W, PADDLE_H, 5);
      ctx.fill();

      ctx.fillStyle = '#ff8f7a';
      ctx.beginPath();
      ctx.roundRect(aiX, INSET, PADDLE_W, PADDLE_H, 5);
      ctx.fill();

      if (!serving) {
        ctx.fillStyle = focused ? '#7fe0a8' : '#f0b132';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(ball.x - ball.vx * 2, ball.y - ball.vy * 2, BALL_R * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = 'rgba(232, 238, 245, .55)';
      ctx.font = '11px ui-monospace, monospace';
      ctx.fillText(`YOU ${playerScore}`, 18, H - 30);
      ctx.fillText(`VASQUEZ ${aiScore}`, W - 104, 32);
    }

    function frame(time) {
      if (!last) last = time;
      const dt = Math.min(30, time - last) / 16.667;
      last = time;
      if (running) update(dt);
      draw();
    }

    function focus() {
      if (charge < 4 || serving) return;
      charge = 0;
      focusUntil = performance.now() + 2000;
      api.sound('great');
      updateHud();
    }

    api.host.listen(window, 'keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'a') {
        keys.left = true;
        event.preventDefault();
      }
      if (event.key === 'ArrowRight' || event.key === 'd') {
        keys.right = true;
        event.preventDefault();
      }
      if (event.key === ' ' || event.key === 'Shift') {
        event.preventDefault();
        focus();
      }
    });
    api.host.listen(window, 'keyup', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'a') keys.left = false;
      if (event.key === 'ArrowRight' || event.key === 'd') keys.right = false;
    });

    stage.querySelectorAll('[data-move]').forEach((button) => {
      const step = () => {
        playerX = Math.max(0, Math.min(W - PADDLE_W, playerX + (button.dataset.move === 'left' ? -26 : 26)));
      };
      button.addEventListener('click', step);
    });
    stage.querySelector('[data-focus]').addEventListener('click', focus);

    api.host.listen(canvas, 'pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      playerX = Math.max(0, Math.min(W - PADDLE_W, ((event.clientX - rect.left) * W) / rect.width - PADDLE_W / 2));
    });
    api.host.listen(canvas, 'touchmove', (event) => {
      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      playerX = Math.max(0, Math.min(W - PADDLE_W, ((touch.clientX - rect.left) * W) / rect.width - PADDLE_W / 2));
    }, { passive: true });

    reset();
    api.host.animate(frame);

    return () => {
      running = false;
    };
  },
};
