import snake from './games/snake.js';
import breakout from './games/breakout.js';
import game2048 from './games/2048.js';
import memory from './games/memory.js';
import minesweeper from './games/minesweeper.js';

const GAMES = [snake, breakout, game2048, memory, minesweeper];

const app = document.getElementById('app');
let cleanup = null;

function teardown() {
  if (typeof cleanup === 'function') cleanup();
  cleanup = null;
}

function currentGameId() {
  const match = location.hash.match(/^#\/play\/([a-z0-9-]+)/i);
  return match ? match[1] : null;
}

function renderLauncher() {
  teardown();
  document.title = "Tony's Arcade — five games";
  app.innerHTML = `
    <section class="launcher">
      <p class="eyebrow">Com.Tonys.darkheist · arcade</p>
      <h1>Five games, ready to play</h1>
      <p class="lede">Every game runs right here in the browser. Pick one and it launches instantly.</p>
      <ul class="cards">
        ${GAMES.map(
          (g) => `
          <li>
            <a class="card" href="#/play/${g.id}" data-game="${g.id}" style="--accent:${g.tone}">
              <span class="card-icon" aria-hidden="true">${g.icon}</span>
              <span class="card-body">
                <span class="card-title">${g.title}</span>
                <span class="card-blurb">${g.blurb}</span>
              </span>
              <span class="card-cta">Play</span>
            </a>
          </li>`
        ).join('')}
      </ul>
      <p class="foot">${GAMES.length} games · keyboard, mouse and touch supported</p>
    </section>`;

  app.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (event) => {
      event.preventDefault();
      location.hash = `#/play/${card.dataset.game}`;
    });
  });
}

function renderGame(game) {
  teardown();
  document.title = `${game.title} — Tony's Arcade`;
  app.innerHTML = `
    <section class="game-view">
      <header class="game-head">
        <a class="back" href="#/" data-back>All games</a>
        <h2><span aria-hidden="true">${game.icon}</span> ${game.title}</h2>
        <div class="hud">
          <span data-label>Score</span>
          <b data-score>0</b>
          <span data-status></span>
        </div>
      </header>
      <div class="stage" data-stage></div>
    </section>`;

  const stage = app.querySelector('[data-stage]');
  const labelEl = app.querySelector('[data-label]');
  const scoreEl = app.querySelector('[data-score]');
  const statusEl = app.querySelector('[data-status]');

  const ui = {
    score(value, label = 'Score') {
      labelEl.textContent = label;
      scoreEl.textContent = String(value);
    },
    status(text) {
      statusEl.textContent = text ? `· ${text}` : '';
    },
    overlay({ title, message, action = 'Play again', onAction }) {
      ui.closeOverlay();
      const el = document.createElement('div');
      el.className = 'overlay';
      el.dataset.overlay = '';
      el.innerHTML = '<div class="overlay-card"><h3></h3><p></p><button class="btn" type="button"></button></div>';
      el.querySelector('h3').textContent = title;
      el.querySelector('p').textContent = message;
      const button = el.querySelector('button');
      button.textContent = action;
      button.addEventListener('click', () => {
        ui.closeOverlay();
        if (typeof onAction === 'function') onAction();
      });
      stage.appendChild(el);
    },
    closeOverlay() {
      stage.querySelectorAll('[data-overlay]').forEach((el) => el.remove());
    },
  };

  app.querySelector('[data-back]').addEventListener('click', (event) => {
    event.preventDefault();
    location.hash = '#/';
  });

  cleanup = game.mount(stage, ui);
}

function route() {
  const id = currentGameId();
  const game = id ? GAMES.find((g) => g.id === id) : null;
  if (game) renderGame(game);
  else renderLauncher();
}

window.addEventListener('hashchange', route);
route();
