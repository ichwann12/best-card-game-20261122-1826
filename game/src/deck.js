// Decks and card instances. A deck is one copy of every card in the game,
// shuffled with the seeded RNG. A card instance is a def plus live state
// (current health, whether it can attack this turn).

import { CARDS, MAX_HAND } from './config.js';
import { shuffle } from './random.js';

let uid = 1;

export function makeDeck(rnd) {
  return shuffle(CARDS.map((c) => c.id), rnd);
}

export function drawCardIds(deck, hand, n) {
  const drawn = [];
  for (let i = 0; i < n && deck.length > 0 && hand.length < MAX_HAND; i++) {
    drawn.push(deck.pop());
  }
  return drawn;
}

export function makeCreature(cardId) {
  const def = CARDS.find((c) => c.id === cardId);
  return {
    uid: uid++,
    def,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    canAttack: false, // summoning sickness: ready at the start of its owner's next turn
    justPlayed: true,
  };
}

export function makeHandCard(cardId) {
  return { uid: uid++, def: CARDS.find((c) => c.id === cardId) };
}
