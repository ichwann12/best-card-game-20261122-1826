// Ember Court — bootstrap and game loop.

import { W, H } from './config.js';
import { hashSeed } from './random.js';
import { newGame, endAiTurn, aiTakeTurn } from './world.js';
import { computeLayout, draw } from './render.js';
import { handleClick, handleKey } from './input.js';
import { applyShot } from './shots.js';
import { sfx } from './audio.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seedParam = params.get('seed');
const seed = seedParam !== null ? hashSeed(seedParam) : (Date.now() % 2147483647);

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const state = newGame(seed);
applyShot(state, shot, seed);

let layout = computeLayout(state);
let lastScreen = state.screen;

// The rival's turn, paced so a human can follow it. In screenshot mode
// everything runs at once.
let aiStage = 0; // 0 idle, 1 waiting to play, 2 waiting to pass
let aiAt = 0;

function loop(now) {
  layout = computeLayout(state);
  draw(ctx, state, layout);
  if (state.screen !== lastScreen) {
    if (state.screen === 'win') sfx.win();
    if (state.screen === 'loss') sfx.lose();
    lastScreen = state.screen;
  }
  if (!shot && state.screen === 'game' && state.turn === 'ai' && state.aiThinking) {
    if (aiStage === 0) {
      aiStage = 1;
      aiAt = now + 900;
    } else if (aiStage === 1 && now >= aiAt) {
      aiTakeTurn(state);
      if (state.screen === 'game') {
        sfx.attack();
        aiStage = 2;
        aiAt = now + 1000;
      } else {
        aiStage = 0;
        if (state.screen === 'win') sfx.win();
        if (state.screen === 'loss') sfx.lose();
      }
    } else if (aiStage === 2 && now >= aiAt) {
      aiStage = 0;
      endAiTurn(state);
      sfx.turn();
    }
  }
  requestAnimationFrame(loop);
}

canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * W;
  const y = ((e.clientY - r.top) / r.height) * H;
  handleClick(state, layout, x, y);
});

window.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  handleKey(state, e.key);
});

// Keep the canvas fitted to the window while preserving 16:9.
function fit() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = `${Math.floor(W * scale)}px`;
  canvas.style.height = `${Math.floor(H * scale)}px`;
}
window.addEventListener('resize', fit);
fit();

requestAnimationFrame(loop);
