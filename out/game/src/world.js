// Ember Court — the rules. Pure game state plus the actions a turn allows:
// draw, gain mana, play cards, attack, and the rival's automatic turn.

import { START_LIFE, START_HAND, MAX_MANA, MAX_BOARD, CARDS } from './config.js';
import { mulberry32, shuffle, pick } from './random.js';
import { makeDeck, makeCreature, makeHandCard } from './deck.js';

export function newPlayer(rnd) {
  const deck = makeDeck(rnd);
  const hand = [];
  for (let i = 0; i < START_HAND; i++) hand.push(makeHandCard(deck.pop()));
  return { life: START_LIFE, maxMana: 1, mana: 1, turns: 0, deck, hand, board: [] };
}

export function newGame(seed) {
  const rnd = mulberry32(seed);
  return {
    seed,
    rnd,
    screen: 'title',
    turn: 'player',
    turnCount: 1,
    player: newPlayer(rnd),
    ai: newPlayer(rnd),
    log: ['Welcome to Ember Court.'],
    sel: null, // {kind:'spell'|'attacker', index?, uid?}
    fx: [], // {x, y, text, color, born}
    aiThinking: false,
    over: null, // 'win' | 'loss'
  };
}

export function startGame(state) {
  state.screen = 'game';
  state.turn = 'player';
  state.turnCount = 1;
  state.player.turns = 1; // the opening turn counts, so mana grows from turn 2
  state.log = ['Your turn — draw a card and play.'];
  state.sel = null;
}

export function other(side) {
  return side === 'player' ? 'ai' : 'player';
}

export function drawOne(state, side) {
  const p = state[side];
  if (p.deck.length === 0) {
    // Fatigue: an empty deck costs 1 life per draw attempt.
    p.life -= 1;
    log(state, `${side === 'player' ? 'You' : 'Rival'} take 1 fatigue damage.`);
    checkEnd(state);
    return;
  }
  if (p.hand.length >= 10) return; // hand full: the card is lost
  p.hand.push(makeHandCard(p.deck.pop()));
}

export function startTurn(state, side) {
  const p = state[side];
  // Mana grows by 1 each round, not each turn: a side's first turn keeps 1.
  if (p.turns > 0) p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
  p.turns += 1;
  p.mana = p.maxMana;
  for (const c of p.board) {
    c.canAttack = true;
    c.justPlayed = false;
  }
  drawOne(state, side);
  if (state.screen !== 'game') return;
  log(state, side === 'player' ? 'Your turn.' : "Rival's turn.");
}

export function endTurn(state) {
  if (state.screen !== 'game' || state.turn !== 'player') return;
  state.sel = null;
  state.turn = 'ai';
  state.aiThinking = true;
  startTurn(state, 'ai');
}

export function endAiTurn(state) {
  state.turn = 'player';
  state.turnCount += 1;
  state.aiThinking = false;
  startTurn(state, 'player');
}

function log(state, msg) {
  state.log.push(msg);
  if (state.log.length > 4) state.log.shift();
}

export function checkEnd(state) {
  if (state.player.life <= 0 && state.ai.life <= 0) {
    state.over = state.player.life <= state.ai.life ? 'loss' : 'win';
  } else if (state.ai.life <= 0) {
    state.over = 'win';
  } else if (state.player.life <= 0) {
    state.over = 'loss';
  }
  if (state.over) {
    state.screen = state.over;
    state.sel = null;
  }
}

function damageHero(state, side, n) {
  state[side].life -= n;
  checkEnd(state);
}

function damageCreature(state, side, uid, n) {
  const p = state[side];
  const c = p.board.find((x) => x.uid === uid);
  if (!c) return;
  c.hp -= n;
  if (c.hp <= 0) {
    p.board = p.board.filter((x) => x.uid !== uid);
    log(state, `${c.def.name} is destroyed.`);
  }
  checkEnd(state);
}

// Play a hand card. `target` is needed for targeted spells:
// {kind:'hero', side} or {kind:'creature', side, uid}. Returns true if played.
export function playCard(state, side, handIndex, target) {
  const p = state[side];
  const card = p.hand[handIndex];
  if (!card) return false;
  const def = card.def;
  if (p.mana < def.cost) return false;

  if (def.type === 'creature') {
    if (p.board.length >= MAX_BOARD) return false;
    p.mana -= def.cost;
    p.hand.splice(handIndex, 1);
    const creature = makeCreature(def.id);
    p.board.push(creature);
    log(state, `${side === 'player' ? 'You play' : 'Rival plays'} ${def.name}.`);
    // Battlecries.
    if (def.id === 'spark-moth' || def.id === 'smoke-wisp') drawOne(state, side);
    if (def.id === 'ember-mage') damageHero(state, other(side), 1);
    checkEnd(state);
    return true;
  }

  // Spells.
  if (def.spell === 'damage' || def.spell === 'buff') {
    if (!target) return false; // needs a target; the UI asks for one
    p.mana -= def.cost;
    p.hand.splice(handIndex, 1);
    if (def.spell === 'damage') {
      if (target.kind === 'hero') damageHero(state, target.side, def.amount);
      else damageCreature(state, target.side, target.uid, def.amount);
      log(state, `${def.name} hits for ${def.amount}.`);
    } else {
      const ally = state[target.side].board.find((x) => x.uid === target.uid);
      if (ally) {
        ally.atk += def.amount;
        ally.hp += def.amount;
        ally.maxHp += def.amount;
        log(state, `${ally.def.name} gains +${def.amount}/+${def.amount}.`);
      }
    }
    checkEnd(state);
    return true;
  }
  if (def.spell === 'heal') {
    p.mana -= def.cost;
    p.hand.splice(handIndex, 1);
    p.life = Math.min(START_LIFE, p.life + def.amount);
    log(state, `${side === 'player' ? 'You heal' : 'Rival heals'} ${def.amount}.`);
    return true;
  }
  if (def.spell === 'draw') {
    p.mana -= def.cost;
    p.hand.splice(handIndex, 1);
    drawOne(state, side);
    drawOne(state, side);
    log(state, `${side === 'player' ? 'You draw' : 'Rival draws'} 2 cards.`);
    return true;
  }
  if (def.spell === 'sweep') {
    p.mana -= def.cost;
    p.hand.splice(handIndex, 1);
    const foes = state[other(side)].board.slice();
    for (const c of foes) damageCreature(state, other(side), c.uid, def.amount);
    log(state, `${def.name} scorches the rival board.`);
    checkEnd(state);
    return true;
  }
  return false;
}

// Attack with one of your creatures. target: {kind:'hero', side} or
// {kind:'creature', side, uid}. Both sides deal damage to each other.
export function attack(state, side, attackerUid, target) {
  const p = state[side];
  const a = p.board.find((x) => x.uid === attackerUid);
  if (!a || !a.canAttack) return false;
  a.canAttack = false;
  if (target.kind === 'hero') {
    damageHero(state, target.side, a.atk);
    log(state, `${a.def.name} hits the ${target.side === 'player' ? 'rival' : 'you'} for ${a.atk}.`);
  } else {
    const foe = state[target.side].board.find((x) => x.uid === target.uid);
    if (!foe) return false;
    const foeAtk = foe.atk;
    damageCreature(state, target.side, foe.uid, a.atk);
    damageCreature(state, side, a.uid, foeAtk);
    log(state, `${a.def.name} trades with ${foe.def.name}.`);
  }
  checkEnd(state);
  return true;
}

// --- The rival's automatic turn -------------------------------------------
// Plays what it can afford (biggest first), then attacks: kill what it can
// kill, otherwise hit the hero. Runs synchronously; the caller paces it.
// `side` is who is taking the turn (default the rival); the same brain can
// drive either side, which keeps it symmetric.

export function aiTakeTurn(state, side = 'ai') {
  const rnd = state.rnd;
  const foe = other(side);
  // Play cards: repeat until nothing worth playing is left. Each pass takes
  // the most expensive playable card that is actually worth playing now.
  let guard = 0;
  while (guard++ < 20) {
    const p = state[side];
    const playable = p.hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.def.cost <= p.mana)
      .filter(({ c }) => c.def.type !== 'creature' || p.board.length < MAX_BOARD);
    if (playable.length === 0) break;
    playable.sort((a, b) => b.c.def.cost - a.c.def.cost || rnd() - 0.5);
    let played = false;
    for (const { c, i } of playable) {
      if (state.screen !== 'game') return;
      const def = c.def;
      if (def.type === 'creature') {
        played = playCard(state, side, i, null);
        break;
      }
      if (def.spell === 'damage') {
        const threats = state[foe].board.filter((x) => x.hp <= def.amount);
        if (threats.length > 0) {
          threats.sort((a, b) => b.atk - a.atk);
          played = playCard(state, side, i, { kind: 'creature', side: foe, uid: threats[0].uid });
        } else {
          played = playCard(state, side, i, { kind: 'hero', side: foe });
        }
        break;
      }
      if (def.spell === 'buff') {
        if (state[side].board.length === 0) continue;
        const big = state[side].board.slice().sort((a, b) => b.atk - a.atk)[0];
        played = playCard(state, side, i, { kind: 'creature', side, uid: big.uid });
        break;
      }
      if (def.spell === 'heal') {
        if (state[side].life >= START_LIFE - 2) continue;
        played = playCard(state, side, i, null);
        break;
      }
      if (def.spell === 'draw') {
        if (state[side].hand.length >= 7) continue;
        played = playCard(state, side, i, null);
        break;
      }
      if (def.spell === 'sweep') {
        if (state[foe].board.length < 2) continue;
        played = playCard(state, side, i, null);
        break;
      }
    }
    if (!played) break;
  }
  if (state.screen !== 'game') return;
  // Attack.
  for (const c of state[side].board.slice()) {
    if (state.screen !== 'game') return;
    if (!c.canAttack) continue;
    const kills = state[foe].board.filter((x) => x.hp <= c.atk);
    if (kills.length > 0 && rnd() < 0.8) {
      kills.sort((a, b) => b.atk - a.atk);
      attack(state, side, c.uid, { kind: 'creature', side: foe, uid: kills[0].uid });
    } else if (state[foe].board.length > 0 && rnd() < 0.25) {
      const victim = pick(state[foe].board, rnd);
      attack(state, side, c.uid, { kind: 'creature', side: foe, uid: victim.uid });
    } else {
      attack(state, side, c.uid, { kind: 'hero', side: foe });
    }
  }
}

// Run `n` full rounds with both sides on autopilot (used for screenshots).
export function autoplay(state, rounds) {
  startGame(state);
  for (let r = 0; r < rounds && state.screen === 'game'; r++) {
    // The player's side plays by the same brain.
    aiTakeTurn(state, 'player');
    if (state.screen !== 'game') break;
    endTurn(state);
    aiTakeTurn(state, 'ai');
    if (state.screen !== 'game') break;
    endAiTurn(state);
  }
}
