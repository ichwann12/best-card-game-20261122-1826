// Screenshot mode: ?shot=start|play|win|loss&seed=N puts the game into the
// exact screen a screenshot needs, built from a real (autopiloted) game so
// the table behind it is a legal position.

import { autoplay, checkEnd } from './world.js';

export function applyShot(state, shot, seed) {
  if (!shot) return;
  if (shot === 'start') {
    state.screen = 'title';
    return;
  }
  // A real mid-game position: both sides autopilot four rounds.
  autoplay(state, 4);
  if (state.screen !== 'game') {
    // The autopilot already ended the game; keep that ending.
    return;
  }
  if (shot === 'play') {
    return; // mid-game, player's turn, table full
  }
  if (shot === 'win') {
    state.ai.life = 0;
    checkEnd(state);
    return;
  }
  if (shot === 'loss') {
    state.player.life = 0;
    checkEnd(state);
  }
}
