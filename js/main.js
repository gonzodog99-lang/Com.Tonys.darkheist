import { CAMPAIGN, CHAPTERS } from './story.js';
import { portraitMarkup } from './art/portraits.js';
import { createHost, loadSave, writeSave, sound } from './engine.js';
import shadowLedger from './games/shadow-ledger.js';
import ricochet from './games/ricochet.js';
import alloy from './games/alloy.js';
import lineup from './games/lineup.js';
import deepField from './games/deep-field.js';

const GAMES = {
  'shadow-ledger': shadowLedger,
  ricochet,
  alloy,
  lineup,
  'deep-field': deepField,
};

const app = document.getElementById('app');
const save = loadSave();

let roundCleanup = null;
let roundHost = null;
let current = null;

function chapterById(id) {
  return CHAPTERS.find((chapter) => chapter.id === id) || null;
}

function stopRound() {
  if (typeof roundCleanup === 'function') {
    try {
      roundCleanup();
    } catch {
      /* a game's cleanup must never break navigation */
    }
  }
  roundCleanup = null;
  if (roundHost) {
    roundHost.destroy();
    roundHost = null;
  }
}

/* ---------------------------------------------------------------- launcher */

function cardMarkup(chapter) {
  const won = Boolean(save.wins?.[chapter.id]);
  const best = save.best?.[chapter.id];
  return `<li class="chapter-card" style="--tone:${chapter.tone}" data-card="${chapter.id}">
    <div class="card-top">
      <span class="night">Night ${chapter.night}</span>
      <span class="genre">${chapter.genre}</span>
      <span class="difficulty">${chapter.difficulty}</span>
    </div>
    <div class="card-cast">
      ${chapter.cast.map((character) => portraitMarkup(character, 'sm')).join('')}
    </div>
    <h2>${chapter.title}</h2>
    <p class="logline">${chapter.logline}</p>
    <p class="location">${chapter.location}</p>
    <div class="card-foot">
      <span class="badge${won ? ' is-won' : ''}">${won ? 'Cleared' : best ? `Best ${best}` : 'Not cleared'}</span>
      <button class="launch" type="button" data-open="${chapter.id}">Launch</button>
    </div>
  </li>`;
}

function launcher() {
  stopRound();
  current = null;
  document.title = `${CAMPAIGN.title} — five nights`;
  const won = CHAPTERS.filter((chapter) => save.wins?.[chapter.id]).length;

  app.innerHTML = `<section class="launcher">
    <header class="campaign-head">
      <p class="eyebrow">Carver City · ${CAMPAIGN.season}</p>
      <h1>${CAMPAIGN.title}</h1>
      <p class="tagline">${CAMPAIGN.tagline}</p>
      <p class="lede">${CAMPAIGN.intro}</p>
      <div class="campaign-meter">
        <span>Campaign</span>
        <div class="meter"><i style="width:${(won / CHAPTERS.length) * 100}%"></i></div>
        <b>${won}/${CHAPTERS.length}</b>
      </div>
      ${won === CHAPTERS.length ? `<p class="finale">${CAMPAIGN.finale}</p>` : ''}
    </header>
    <ul class="chapters">${CHAPTERS.map(cardMarkup).join('')}</ul>
    <p class="foot">Five genres · five specialists · five animals · no safe night</p>
  </section>`;

  app.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => {
      location.hash = `#/night/${button.dataset.open}`;
    });
  });
}

/* ----------------------------------------------------------- chapter shell */

function openChapter(id) {
  const chapter = chapterById(id);
  if (!chapter) {
    location.hash = '#/';
    return;
  }
  stopRound();
  current = chapter;
  document.title = `${chapter.title} — ${CAMPAIGN.title}`;

  app.innerHTML = `<section class="chapter-view" style="--tone:${chapter.tone}">
    <header class="chapter-head">
      <a class="back" href="#/" data-home>Campaign</a>
      <div class="chapter-id">
        <span>Night ${chapter.night} · ${chapter.genre}</span>
        <h2><i aria-hidden="true">${chapter.icon}</i> ${chapter.title}</h2>
      </div>
      <div class="hud" data-hud></div>
    </header>
    <div class="stage" data-stage></div>
  </section>`;

  app.querySelector('[data-home]').addEventListener('click', (event) => {
    event.preventDefault();
    location.hash = '#/';
  });

  renderBrief(chapter);
}

function renderBrief(chapter) {
  const stage = app.querySelector('[data-stage]');
  if (!stage) return;
  const best = save.best?.[chapter.id];
  const won = Boolean(save.wins?.[chapter.id]);

  stage.innerHTML = `<article class="brief">
    <div class="brief-head">
      <p class="brief-loc">${chapter.location}</p>
      <p class="brief-logline">${chapter.logline}</p>
    </div>
    <div class="cast-row">${chapter.cast.map((character) => portraitMarkup(character, 'md')).join('')}</div>
    <div class="dialogue">
      ${chapter.lines
        .map(
          ([speaker, text]) =>
            `<p class="line"><b>${speaker}</b><span>${text}</span></p>`
        )
        .join('')}
    </div>
    <div class="brief-grid">
      <div>
        <h3>Job objectives</h3>
        <ul class="objectives">${chapter.objectives.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <div>
        <h3>Field notes</h3>
        <p class="tips">${chapter.tips}</p>
        <p class="brief-meta">Difficulty <b>${chapter.difficulty}</b>${won ? ' · cleared' : best ? ` · best ${best}` : ''}</p>
      </div>
    </div>
    <div class="brief-foot">
      <button class="btn primary" type="button" data-start>Begin night ${chapter.night}</button>
    </div>
  </article>`;

  stage.querySelector('[data-start]').addEventListener('click', () => startRound(chapter));
}

/* ------------------------------------------------------------------- round */

function startRound(chapter) {
  const stage = app.querySelector('[data-stage]');
  stopRound();
  stage.innerHTML = '';

  const hudEl = app.querySelector('[data-hud]');
  const host = createHost();
  roundHost = host;
  let finished = false;

  const api = {
    host,
    stage,
    sound,
    hud(fields = {}) {
      hudEl.innerHTML = Object.entries(fields)
        .map(([label, value]) => `<span class="chip"><i>${label}</i><b>${value}</b></span>`)
        .join('');
    },
    finish(result = {}) {
      if (finished) return;
      finished = true;
      const win = Boolean(result.win);
      const score = Math.max(0, Math.round(Number(result.score) || 0));
      save.wins = save.wins || {};
      save.best = save.best || {};
      if (win) save.wins[chapter.id] = true;
      if (score > (save.best[chapter.id] || 0)) save.best[chapter.id] = score;
      writeSave(save);
      sound(win ? 'win' : 'lose');

      const line = win ? chapter.win : chapter.lose;
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      overlay.dataset.overlay = '';
      overlay.innerHTML = `<div class="result-card">
        <p class="result-tag">${win ? `Night ${chapter.night} cleared` : `Night ${chapter.night} failed`}</p>
        <h3>${win ? 'Job done' : 'Job blown'}</h3>
        <p class="result-line"><b>${line[0]}</b> ${line[1]}</p>
        <p class="result-score">Score <b>${score}</b>${win ? '' : ' · no record'}</p>
        <p class="result-note">${win ? 'Recorded to the campaign.' : 'The night can be run again.'}</p>
        <div class="result-actions">
          <button class="btn ghost" type="button" data-retry>Run it again</button>
          <button class="btn primary" type="button" data-hub>Back to campaign</button>
        </div>
      </div>`;
      stage.appendChild(overlay);
      overlay.querySelector('[data-retry]').addEventListener('click', () => {
        overlay.remove();
        startRound(chapter);
      });
      overlay.querySelector('[data-hub]').addEventListener('click', () => {
        location.hash = '#/';
      });
    },
  };

  api.hud({ Ready: '—' });
  const game = GAMES[chapter.id];
  roundCleanup = game ? game.mount(stage, api) || null : null;
}

/* ------------------------------------------------------------------- route */

function route() {
  const match = location.hash.match(/^#\/night\/([a-z0-9-]+)/i);
  if (match) openChapter(match[1]);
  else launcher();
}

window.addEventListener('hashchange', route);
route();
