// Small shared engine: persistence, audio, timers, input lifetimes.

const SAVE_KEY = 'darkheist.save.v1';

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : { wins: {}, best: {} };
  } catch {
    return { wins: {}, best: {} };
  }
}

export function writeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* storage unavailable — scores simply do not persist */
  }
}

let audioCtx = null;

const PRESETS = {
  move: { type: 'square', f: 300, f2: 280, dur: 0.05, vol: 0.035 },
  step: { type: 'triangle', f: 240, f2: 210, dur: 0.07, vol: 0.05 },
  good: { type: 'triangle', f: 520, f2: 780, dur: 0.16, vol: 0.075 },
  great: { type: 'triangle', f: 520, f2: 1080, dur: 0.28, vol: 0.09 },
  bad: { type: 'sawtooth', f: 240, f2: 90, dur: 0.26, vol: 0.075 },
  tick: { type: 'square', f: 180, f2: 180, dur: 0.05, vol: 0.03 },
  win: { type: 'triangle', f: 440, f2: 1180, dur: 0.5, vol: 0.09 },
  lose: { type: 'sawtooth', f: 190, f2: 55, dur: 0.6, vol: 0.09 },
};

export function sound(name) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const preset = PRESETS[name] || PRESETS.tick;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.f, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, preset.f2), now + preset.dur);
    gain.gain.setValueAtTime(preset.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + preset.dur + 0.03);
  } catch {
    /* audio is optional */
  }
}

export function createHost() {
  const removers = [];
  const timers = new Set();
  let rafId = null;

  return {
    listen(target, type, handler, options) {
      target.addEventListener(type, handler, options);
      removers.push(() => target.removeEventListener(type, handler, options));
    },
    every(handler, ms) {
      const id = setInterval(handler, ms);
      timers.add(id);
      return id;
    },
    after(handler, ms) {
      const id = setTimeout(() => {
        timers.delete(id);
        handler();
      }, ms);
      timers.add(id);
      return id;
    },
    stop(id) {
      clearInterval(id);
      timers.delete(id);
    },
    animate(handler) {
      const frame = (time) => {
        rafId = requestAnimationFrame(frame);
        handler(time);
      };
      rafId = requestAnimationFrame(frame);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      };
    },
    destroy() {
      removers.splice(0).forEach((fn) => fn());
      timers.forEach((id) => {
        clearTimeout(id);
        clearInterval(id);
      });
      timers.clear();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    },
  };
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
