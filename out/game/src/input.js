// Mouse and keyboard input. Hit-tests against the layout render.js computed
// for the last frame, and drives the rules in world.js.

import { playCard, attack, endTurn, startGame, newGame, checkEnd } from './world.js';
import { sfx, unlockAudio } from './audio.js';

function inside(r, x, y) {
  return r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function hit(list, x, y) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (inside(list[i], x, y)) return list[i];
  }
  return null;
}

// Try to play the hand card at `index`. For targeted spells this only arms
// the targeting state and returns 'targeting'; otherwise it plays at once.
function tryPlay(state, index) {
  const card = state.player.hand[index];
  if (!card) return false;
  if (state.player.mana < card.def.cost) {
    sfx.error();
    return false;
  }
  if (card.def.type === 'spell' && (card.def.target === 'any' || card.def.target === 'ally')) {
    state.sel = { kind: 'spell', index, target: card.def.target };
    return 'targeting';
  }
  const ok = playCard(state, 'player', index, null);
  if (ok) sfx.play();
  else sfx.error();
  return ok;
}

export function handleClick(state, layout, x, y) {
  unlockAudio();
  if (state.screen === 'title') {
    if (inside(layout.titlePlay, x, y)) {
      sfx.turn();
      startGame(state);
    }
    return;
  }
  if (state.screen === 'win' || state.screen === 'loss') {
    if (inside(layout.restart, x, y)) {
      const seed = state.seed;
      const fresh = newGame(seed + 1);
      Object.assign(state, fresh);
      startGame(state);
    }
    return;
  }
  if (state.screen !== 'game') return;
  if (state.turn !== 'player' || state.aiThinking) return;

  // A spell is armed and waiting for a target.
  if (state.sel && state.sel.kind === 'spell') {
    const t = state.sel.target;
    const foeCreature = hit(layout.aiBoard, x, y);
    const ownCreature = hit(layout.playerBoard, x, y);
    const foeHero = inside(layout.aiHero, x, y);
    let target = null;
    if (t === 'any' && foeCreature) target = { kind: 'creature', side: 'ai', uid: foeCreature.uid };
    else if (t === 'any' && foeHero) target = { kind: 'hero', side: 'ai' };
    else if (t === 'ally' && ownCreature) target = { kind: 'creature', side: 'player', uid: ownCreature.uid };
    if (target) {
      const idx = state.sel.index;
      state.sel = null;
      if (playCard(state, 'player', idx, target)) sfx.play();
    } else {
      state.sel = null; // clicked elsewhere: cancel targeting
    }
    return;
  }

  // An attacker is selected and waiting for a target.
  if (state.sel && state.sel.kind === 'attacker') {
    const foeCreature = hit(layout.aiBoard, x, y);
    const foeHero = inside(layout.aiHero, x, y);
    if (foeCreature) {
      const uid = state.sel.uid;
      state.sel = null;
      if (attack(state, 'player', uid, { kind: 'creature', side: 'ai', uid: foeCreature.uid })) sfx.attack();
      return;
    }
    if (foeHero) {
      const uid = state.sel.uid;
      state.sel = null;
      if (attack(state, 'player', uid, { kind: 'hero', side: 'ai' })) sfx.attack();
      return;
    }
    // Clicking another of your ready creatures switches the attacker.
    const own = hit(layout.playerBoard, x, y);
    if (own) {
      const c = state.player.board.find((v) => v.uid === own.uid);
      if (c && c.canAttack) {
        state.sel = { kind: 'attacker', uid: own.uid };
        return;
      }
    }
    state.sel = null;
    return;
  }

  // End turn.
  if (inside(layout.endTurn, x, y)) {
    sfx.turn();
    endTurn(state);
    return;
  }

  // Play a hand card.
  const handHit = hit(layout.playerHand, x, y);
  if (handHit) {
    tryPlay(state, handHit.index);
    return;
  }

  // Select one of your ready creatures to attack with.
  const own = hit(layout.playerBoard, x, y);
  if (own) {
    const c = state.player.board.find((v) => v.uid === own.uid);
    if (c && c.canAttack) {
      state.sel = { kind: 'attacker', uid: own.uid };
      sfx.draw();
    }
    return;
  }
}

export function handleKey(state, key) {
  unlockAudio();
  if (key === 'Escape') {
    if (state.screen === 'game') {
      state.screen = 'title';
      state.sel = null;
    }
    return;
  }
  if (state.screen === 'title' && (key === 'Enter' || key === ' ')) {
    startGame(state);
    return;
  }
  if ((state.screen === 'win' || state.screen === 'loss') && key === 'Enter') {
    const fresh = newGame(state.seed + 1);
    Object.assign(state, fresh);
    startGame(state);
    return;
  }
  if (state.screen !== 'game' || state.turn !== 'player' || state.aiThinking) return;
  if (key === ' ') {
    sfx.turn();
    endTurn(state);
    return;
  }
  const n = parseInt(key, 10);
  if (n >= 1 && n <= 7) {
    tryPlay(state, n - 1);
  }
}
