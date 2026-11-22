// Ember Court — canvas rendering. computeLayout() returns every clickable
// rectangle (input.js hit-tests against it); draw() paints the table.

import { W, H, COLORS, MAX_BOARD } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx, text, maxW, base, weight = 'bold') {
  let size = base;
  ctx.font = `${weight} ${size}px sans-serif`;
  while (size > 9 && ctx.measureText(text).width > maxW) {
    size -= 1;
    ctx.font = `${weight} ${size}px sans-serif`;
  }
  return size;
}

export function computeLayout(state) {
  const L = {
    aiHero: { x: 16, y: 12, w: 72, h: 72 },
    playerHero: { x: 16, y: 632, w: 72, h: 72 },
    aiHand: [],
    playerHand: [],
    aiBoard: [],
    playerBoard: [],
    endTurn: { x: 1120, y: 624, w: 144, h: 56 },
    titlePlay: { x: W / 2 - 130, y: 470, w: 260, h: 64 },
    restart: { x: W / 2 - 130, y: 460, w: 260, h: 64 },
  };
  // Rival hand: face-down backs, top right.
  const aiN = state.ai.hand.length;
  const bw = 54, bh = 76, gap = 10;
  const aiHandW = aiN * bw + (aiN - 1) * gap;
  for (let i = 0; i < aiN; i++) {
    L.aiHand.push({ x: 1264 - aiHandW + i * (bw + gap), y: 12, w: bw, h: bh, index: i });
  }
  // Your hand: face-up cards, bottom centre, slight overlap.
  const n = state.player.hand.length;
  const cw = 118, ch = 162, ov = 34;
  const handW = n * cw - (n - 1) * ov;
  const hx = (W - handW) / 2;
  for (let i = 0; i < n; i++) {
    L.playerHand.push({ x: hx + i * (cw - ov), y: 548, w: cw, h: ch, index: i });
  }
  // Boards, centred rows.
  const bw2 = 108, bh2 = 148, bgap = 14;
  const rowW = (arr) => arr.length * bw2 + (arr.length - 1) * bgap;
  state.ai.board.forEach((c, i) => {
    L.aiBoard.push({ x: (W - rowW(state.ai.board)) / 2 + i * (bw2 + bgap), y: 138, w: bw2, h: bh2, uid: c.uid });
  });
  state.player.board.forEach((c, i) => {
    L.playerBoard.push({ x: (W - rowW(state.player.board)) / 2 + i * (bw2 + bgap), y: 316, w: bw2, h: bh2, uid: c.uid });
  });
  return L;
}

function drawCardBack(ctx, x, y, w, h) {
  rr(ctx, x, y, w, h, 8);
  ctx.fillStyle = COLORS.cardBack;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.gold;
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.font = `bold ${Math.round(h * 0.42)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', x + w / 2, y + h / 2);
}

function drawCard(ctx, x, y, w, h, def, opts = {}) {
  const { hp, maxHp, atk, selected = false, ready = false, dimmed = false } = opts;
  rr(ctx, x, y, w, h, 10);
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#3a2b52');
  g.addColorStop(1, '#241b31');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? COLORS.gold : ready ? COLORS.green : COLORS.line;
  ctx.stroke();
  if (dimmed) {
    ctx.fillStyle = 'rgba(10,6,18,0.45)';
    ctx.fill();
  }
  // Mana cost.
  ctx.beginPath();
  ctx.arc(x + 16, y + 16, 13, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.mana;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(def.cost), x + 16, y + 17);
  // Name, to the right of the mana cost circle.
  ctx.fillStyle = COLORS.cream;
  fitFont(ctx, def.name, w - 40, 13);
  ctx.textAlign = 'left';
  ctx.fillText(def.name, x + 34, y + 17);
  // Art: big glyph in the card's tint on a dark medallion.
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.44, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#120d1c';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = def.tint;
  ctx.stroke();
  ctx.fillStyle = def.tint;
  ctx.font = `bold 34px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(def.glyph, x + w / 2, y + h * 0.44 + 1);
  // Rules text.
  if (def.text) {
    ctx.fillStyle = COLORS.dim;
    fitFont(ctx, def.text, w - 16, 11, 'italic');
    ctx.fillText(def.text, x + w / 2, y + h - 40);
  }
  // Attack / health.
  if (def.type === 'creature') {
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = COLORS.gold;
    ctx.textAlign = 'left';
    ctx.fillText(String(atk), x + 10, y + h - 12);
    ctx.fillStyle = hp <= 2 ? COLORS.red : '#fff';
    ctx.textAlign = 'right';
    ctx.fillText(String(hp), x + w - 10, y + h - 12);
    ctx.textAlign = 'center';
  } else {
    ctx.fillStyle = COLORS.blue;
    fitFont(ctx, 'SPELL', w - 16, 11);
    ctx.fillText('SPELL', x + w / 2, y + h - 14);
  }
  // A ready creature gets a small green pip under its art.
  if (ready) {
    ctx.beginPath();
    ctx.arc(x + w - 14, y + h * 0.44, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.green;
    ctx.fill();
  }
}

function drawHero(ctx, x, y, name, life, mana, maxMana, deckCount, isRival, active) {
  // Portrait medallion.
  ctx.beginPath();
  ctx.arc(x + 36, y + 36, 34, 0, Math.PI * 2);
  ctx.fillStyle = isRival ? '#4a1f3d' : '#1f3d2a';
  ctx.fill();
  ctx.lineWidth = active ? 4 : 2;
  ctx.strokeStyle = active ? COLORS.gold : COLORS.line;
  ctx.stroke();
  ctx.fillStyle = isRival ? '#ff8fa3' : '#8fe3a8';
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isRival ? '♛' : '♞', x + 36, y + 37);
  // Name + life.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(name, x + 84, y + 22);
  ctx.fillStyle = life <= 5 ? COLORS.red : '#ff6b6b';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`♥ ${life}`, x + 84, y + 48);
  // Mana pips.
  for (let i = 0; i < maxMana; i++) {
    ctx.beginPath();
    ctx.arc(x + 92 + i * 20, y + 66, 7, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? COLORS.mana : '#2c2438';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.mana;
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`${mana}/${maxMana}`, x + 92 + maxMana * 20 + 8, y + 70);
  // Deck pile.
  ctx.fillStyle = '#3a2b52';
  rr(ctx, x + 240, y + 14, 40, 52, 5);
  ctx.fill();
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COLORS.cream;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(deckCount), x + 260, y + 41);
  ctx.textAlign = 'left';
}

function drawButton(ctx, r, label, enabled) {
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = enabled ? COLORS.gold : '#4a4456';
  ctx.fill();
  ctx.fillStyle = enabled ? '#1a1206' : '#8a8296';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
}

function banner(ctx, text, color) {
  ctx.font = 'bold 22px sans-serif';
  const w = ctx.measureText(text).width + 44;
  const x = (W - w) / 2;
  rr(ctx, x, 10, w, 36, 10);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, 29);
}

export function draw(ctx, state, L) {
  ctx.clearRect(0, 0, W, H);
  // Table felt.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, COLORS.bg);
  bg.addColorStop(1, COLORS.bg2);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = COLORS.table;
  rr(ctx, 8, 96, W - 16, 420, 18);
  ctx.fill();

  if (state.screen === 'title') return drawTitle(ctx, state, L);
  if (state.screen === 'win' || state.screen === 'loss') {
    drawTable(ctx, state, L);
    return drawEnd(ctx, state, L);
  }
  drawTable(ctx, state, L);
}

function drawTable(ctx, state, L) {
  const yourTurn = state.turn === 'player' && !state.aiThinking;
  // Heroes.
  drawHero(ctx, L.aiHero.x, L.aiHero.y, 'Ember Queen', state.ai.life, state.ai.mana, state.ai.maxMana, state.ai.deck.length, true, state.turn === 'ai');
  drawHero(ctx, L.playerHero.x, L.playerHero.y, 'You', state.player.life, state.player.mana, state.player.maxMana, state.player.deck.length, false, yourTurn);
  // Turn banner.
  if (state.screen === 'game') {
    banner(ctx, yourTurn ? 'YOUR TURN' : "RIVAL'S TURN", yourTurn ? '#2f7d4f' : '#7d2f3d');
  }
  // Rival hand (face down).
  for (const r of L.aiHand) drawCardBack(ctx, r.x, r.y, r.w, r.h);
  // Boards.
  state.ai.board.forEach((c, i) => {
    const r = L.aiBoard[i];
    drawCard(ctx, r.x, r.y, r.w, r.h, c.def, { hp: c.hp, maxHp: c.maxHp, atk: c.atk });
  });
  state.player.board.forEach((c, i) => {
    const r = L.playerBoard[i];
    const selected = state.sel && state.sel.kind === 'attacker' && state.sel.uid === c.uid;
    drawCard(ctx, r.x, r.y, r.w, r.h, c.def, {
      hp: c.hp, maxHp: c.maxHp, atk: c.atk,
      selected, ready: c.canAttack && yourTurn,
      dimmed: !c.canAttack,
    });
  });
  // Your hand.
  state.player.hand.forEach((card, i) => {
    const r = L.playerHand[i];
    const armed = state.sel && state.sel.kind === 'spell' && state.sel.index === i;
    drawCard(ctx, r.x, r.y, r.w, r.h, card.def, {
      hp: card.def.hp, atk: card.def.atk,
      selected: armed,
      dimmed: card.def.cost > state.player.mana,
    });
  });
  // End Turn button.
  drawButton(ctx, L.endTurn, 'End Turn', yourTurn);
  // Hints (only during a live game).
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 16px sans-serif';
  if (state.screen === 'game') {
    if (state.sel && state.sel.kind === 'spell') {
      ctx.fillText(state.sel.target === 'ally' ? 'Choose one of your creatures' : 'Choose a target — a creature or the rival', W / 2, 540);
    } else if (state.sel && state.sel.kind === 'attacker') {
      ctx.fillText('Choose a target — a rival creature or the rival hero', W / 2, 540);
    } else if (yourTurn) {
      ctx.fillStyle = COLORS.dim;
      ctx.font = '15px sans-serif';
      ctx.fillText('Click a card to play it · click a creature, then a target, to attack · Space ends your turn', W / 2, 540);
    }
  }
  // Log.
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.dim;
  ctx.font = '14px sans-serif';
  state.log.forEach((line, i) => {
    ctx.fillText(line, 16, 452 + i * 20);
  });
  // Board labels.
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText("RIVAL'S CREATURES", 24, 128);
  ctx.fillText('YOUR CREATURES', 24, 306);
  // Selection ring on the rival hero when it is a legal target.
  if (state.sel && state.sel.kind === 'attacker') {
    ctx.beginPath();
    ctx.arc(L.aiHero.x + 36, L.aiHero.y + 36, 42, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = COLORS.red;
    ctx.stroke();
  }
}

function drawTitle(ctx, state, L) {
  // Decorative fanned cards.
  const defs = [
    { name: 'Ash Dragon', glyph: '★', tint: '#f5b942' },
    { name: 'Flame Knight', glyph: '♠', tint: '#d43d2a' },
    { name: 'Ember Imp', glyph: '★', tint: '#e8643c' },
  ];
  ctx.save();
  ctx.translate(W / 2, 268);
  defs.forEach((d, i) => {
    ctx.save();
    ctx.rotate((i - 1) * 0.22);
    ctx.translate((i - 1) * 130, 0);
    drawCard(ctx, -59, -81, 118, 162, { ...d, cost: [7, 4, 1][i], type: 'creature', text: '' }, { atk: [7, 4, 2][i], hp: [7, 5, 1][i] });
    ctx.restore();
  });
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 76px sans-serif';
  ctx.fillText('EMBER COURT', W / 2, 130);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '22px sans-serif';
  ctx.fillText('A duel of cards in the court of living flame', W / 2, 168);
  drawButton(ctx, L.titlePlay, '▶  Play', true);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '16px sans-serif';
  const lines = [
    'You and the Ember Queen each have 20 life. Mana grows by 1 every turn, up to 10.',
    'Play creatures and spells from your hand, then attack with your creatures.',
    'Click a card to play it · click a creature, then a target, to attack · Space ends your turn.',
    'Reduce the rival to 0 life to win. Keys: 1–7 play a card, Space ends turn, Esc returns here.',
  ];
  lines.forEach((l, i) => ctx.fillText(l, W / 2, 570 + i * 26));
}

function drawEnd(ctx, state, L) {
  ctx.fillStyle = 'rgba(10,6,18,0.72)';
  ctx.fillRect(0, 0, W, H);
  const won = state.screen === 'win';
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? COLORS.gold : COLORS.red;
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(won ? 'VICTORY!' : 'DEFEAT', W / 2, 250);
  ctx.fillStyle = COLORS.cream;
  ctx.font = '22px sans-serif';
  ctx.fillText(
    won ? 'The Ember Queen’s court burns out. You take the crown.' : 'Your court has fallen to the Ember Queen.',
    W / 2, 300,
  );
  ctx.fillStyle = COLORS.dim;
  ctx.font = '18px sans-serif';
  ctx.fillText(`You ${won ? 'won' : 'lost'} in ${state.turnCount} turn${state.turnCount === 1 ? '' : 's'} · Rival life ${Math.max(0, state.ai.life)} · Your life ${Math.max(0, state.player.life)}`, W / 2, 340);
  drawButton(ctx, L.restart, '↻  Play again', true);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '15px sans-serif';
  ctx.fillText('Press Enter or click Play again', W / 2, 560);
}
