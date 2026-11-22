// Ember Court — configuration: table size, players, and every card in the game.
// All names, art and values are original to this game.

export const W = 1280;
export const H = 720;

export const START_LIFE = 20;
export const START_HAND = 3;
export const MAX_MANA = 10;
export const MAX_BOARD = 7;
export const MAX_HAND = 10;

export const COLORS = {
  bg: '#171224',
  bg2: '#221a33',
  table: '#2a1f3d',
  panel: '#241b31',
  line: '#4a3566',
  gold: '#f5b942',
  goldDark: '#c78d1e',
  red: '#e5484d',
  green: '#4ade80',
  blue: '#6ea8fe',
  cream: '#f5ead6',
  dim: '#b9a8cc',
  dark: '#120d1c',
  mana: '#58a6ff',
  cardBack: '#5b2d8e',
};

// A card definition. type: 'creature' | 'spell'.
// Creatures have atk/hp. Spells have `spell` (what they do) and `target`
// ('any' = pick a creature or a hero, 'ally' = pick one of your creatures,
// 'none' = no target needed). `draw` = cards drawn when the creature is played.
// `ping` = damage to the enemy hero when the creature is played.
export const CARDS = [
  { id: 'ember-imp',     name: 'Ember Imp',     cost: 1, type: 'creature', atk: 2, hp: 1, glyph: '★', tint: '#e8643c', text: '' },
  { id: 'cinder-pup',    name: 'Cinder Pup',    cost: 1, type: 'creature', atk: 1, hp: 2, glyph: '●', tint: '#a9805a', text: '' },
  { id: 'spark-moth',    name: 'Spark Moth',    cost: 1, type: 'creature', atk: 1, hp: 1, glyph: '✦', tint: '#f5d76e', text: 'Draw a card' },
  { id: 'cinder-wolf',   name: 'Cinder Wolf',   cost: 2, type: 'creature', atk: 3, hp: 2, glyph: '◆', tint: '#8a8f98', text: '' },
  { id: 'ash-squire',    name: 'Ash Squire',    cost: 2, type: 'creature', atk: 2, hp: 3, glyph: '▲', tint: '#c9c2d4', text: '' },
  { id: 'smoke-wisp',    name: 'Smoke Wisp',    cost: 2, type: 'creature', atk: 2, hp: 1, glyph: '○', tint: '#9a8fb0', text: 'Draw a card' },
  { id: 'coal-hound',    name: 'Coal Hound',    cost: 3, type: 'creature', atk: 3, hp: 3, glyph: '●', tint: '#7a2e2e', text: '' },
  { id: 'ember-guard',   name: 'Ember Guard',   cost: 3, type: 'creature', atk: 2, hp: 5, glyph: '■', tint: '#6b7a8c', text: '' },
  { id: 'cinder-archer', name: 'Cinder Archer', cost: 3, type: 'creature', atk: 4, hp: 2, glyph: '♦', tint: '#5a8c5a', text: '' },
  { id: 'flame-knight',  name: 'Flame Knight',  cost: 4, type: 'creature', atk: 4, hp: 5, glyph: '♠', tint: '#d43d2a', text: '' },
  { id: 'ember-mage',    name: 'Ember Mage',    cost: 4, type: 'creature', atk: 3, hp: 4, glyph: '✦', tint: '#9a6ee8', text: 'Deal 1 to the rival' },
  { id: 'phoenix-chick', name: 'Phoenix Chick', cost: 5, type: 'creature', atk: 5, hp: 4, glyph: '♥', tint: '#ef7fa8', text: '' },
  { id: 'lava-golem',    name: 'Lava Golem',    cost: 6, type: 'creature', atk: 6, hp: 6, glyph: '▲', tint: '#c75b16', text: '' },
  { id: 'ash-dragon',    name: 'Ash Dragon',    cost: 7, type: 'creature', atk: 7, hp: 7, glyph: '★', tint: '#f5b942', text: '' },
  { id: 'spark-bolt',    name: 'Spark Bolt',    cost: 1, type: 'spell', spell: 'damage', amount: 3, target: 'any',   glyph: '✦', tint: '#f5d76e', text: 'Deal 3 damage' },
  { id: 'ember-shield',  name: 'Ember Shield',  cost: 1, type: 'spell', spell: 'buff',   amount: 2, target: 'ally',  glyph: '♦', tint: '#6ea8fe', text: '+2/+2 to a friend' },
  { id: 'mend',          name: 'Mend',          cost: 2, type: 'spell', spell: 'heal',   amount: 5, target: 'none',  glyph: '✚', tint: '#4ade80', text: 'Heal 5 life' },
  { id: 'kindle-wisdom', name: 'Kindle Wisdom', cost: 2, type: 'spell', spell: 'draw',   amount: 2, target: 'none',  glyph: '✦', tint: '#8ecae6', text: 'Draw 2 cards' },
  { id: 'ember-rain',    name: 'Ember Rain',    cost: 3, type: 'spell', spell: 'sweep',  amount: 2, target: 'none',  glyph: '●', tint: '#e8643c', text: '2 to all rivals' },
  { id: 'crownfire',     name: 'Crownfire',     cost: 4, type: 'spell', spell: 'damage', amount: 6, target: 'any',   glyph: '★', tint: '#f5b942', text: 'Deal 6 damage' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
