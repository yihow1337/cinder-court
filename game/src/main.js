// Boot, the frame loop, and the director that walks a match through its phases:
// dealing, your move, the rival's tell, her commitment, the clash, the end of the round
// and the end of the court. Screen routing lives here too.

import { TIME, ZONE } from './config.js';
import { CRESTS } from './crests.js';
import { createTable, bankCard, checkOutcome, closeRound, flareCard, playToHearth, passTurn, resolveNextClash, setTell, startRound } from './table.js';
import { canBank, hasAnyMove, openHearths, pendingClashes } from './rules.js';
import { chooseMove, createRival, peekIntent } from './ai.js';
import { assignTargets } from './layout.js';
import { createFlourish, landPop, shoveSide, stepFlourish, stepTable } from './animate.js';
import { createBurst, createMotes, createRisingColumn, emitEmbers, stepEmbers, stepMotes, stepRisingColumn } from './particles.js';
import { drawScene } from './render.js';
import { drawEndScreen, drawTitleScreen } from './screens.js';
import { attachInput } from './input.js';
import { seedFromQuery } from './random.js';
import { applyShot } from './shots.js';
import { isMuted, playBank, playClash, playDealRound, playFlare, playLoss, playSelect, playSnap, playStoke, playWin, toggleMute, unlockAudio } from './audio.js';

const canvas = document.getElementById('court');
const ctx = canvas.getContext('2d');
const seed = seedFromQuery(location.search, 7);

const app = {
  seed,
  screen: 'title',
  table: createTable(seed),
  rival: createRival(seed),
  motes: createMotes(seed),
  burst: createBurst(seed),
  column: createRisingColumn(seed),
  time: 0,
  frozen: false,
  selected: null,
  bankSelected: false,
  hover: null,
  pointer: null,
  intent: null,
  flourish: null,
  pendingMove: null,
  endWon: false,
};

// --- the director ----------------------------------------------------------

function startMatch() {
  app.table = createTable(app.seed);
  app.rival = createRival(app.seed);
  app.screen = 'table';
  app.selected = null;
  app.bankSelected = false;
  app.intent = null;
  app.flourish = null;
  app.pendingMove = null;
  const dealt = startRound(app.table);
  playDealRound(dealt);
}

function rematch() {
  app.seed = (app.seed * 1664525 + 1013904223) >>> 0;
  app.motes = createMotes(app.seed);
  app.burst = createBurst(app.seed);
  app.column = createRisingColumn(app.seed);
  startMatch();
}

function stepDirector(dt) {
  const table = app.table;
  if (table.phase === 'over') return;
  if (table.timer > 0) {
    table.timer -= dt;
    if (table.timer > 0) return;
    table.timer = 0;
  }
  switch (table.phase) {
    case 'dealing':
      enterTurn(false);
      break;
    case 'rivalThink':
      commitTell();
      break;
    case 'rivalCommit':
      applyRivalMove();
      break;
    case 'clash':
      afterClash();
      break;
    case 'roundEnd':
      nextRound();
      break;
    default:
      break; // 'player' waits on input
  }
}

function enterTurn(pass) {
  const table = app.table;
  if (pendingClashes(table).length > 0) {
    startClash();
    return;
  }
  let side = table.turn;
  if (pass || !hasAnyMove(table, side)) side = passTurn(table);
  if (!side) {
    table.phase = 'roundEnd';
    table.timer = TIME.roundHold;
    app.intent = null;
    return;
  }
  if (side === 'player') {
    table.phase = 'player';
    table.timer = 0;
    app.intent = peekIntent(table, app.rival);
  } else {
    table.phase = 'rivalThink';
    table.timer = TIME.rivalThink;
    app.intent = null;
  }
}

function commitTell() {
  const table = app.table;
  const move = chooseMove(table, app.rival);
  if (!move) {
    enterTurn(true);
    return;
  }
  app.pendingMove = move;
  if (move.hearth === null) {
    applyRivalMove();
    return;
  }
  setTell(table, move.hearth, move.card.crest);
  table.phase = 'rivalCommit';
  table.timer = TIME.rivalTell;
}

function applyRivalMove() {
  const table = app.table;
  const move = app.pendingMove;
  app.pendingMove = null;
  if (!move) {
    enterTurn(true);
    return;
  }
  if (move.type === 'bank') {
    bankCard(table, 'rival', move.cardIndex);
    playBank();
  } else if (move.type === 'flare') {
    const card = flareCard(table, 'rival', move.hearth);
    if (card) landPop(card, 1.2);
    playFlare();
  } else {
    const index = table.hands.rival.indexOf(move.card);
    const card = playToHearth(table, 'rival', index === -1 ? move.cardIndex : index, move.hearth);
    if (card) landPop(card);
    playSnap();
  }
  table.tell = null;
  afterAction();
}

function afterAction() {
  const table = app.table;
  if (pendingClashes(table).length > 0) startClash();
  else enterTurn(true);
}

function startClash() {
  const table = app.table;
  const event = resolveNextClash(table);
  if (!event) {
    enterTurn(true);
    return;
  }
  table.phase = 'clash';
  table.timer = TIME.clashHold;
  app.intent = null;
  const cx = ZONE.hearthCentersX[event.hearth];
  const crest = CRESTS[event.winCard.crest];
  emitEmbers(app.burst, cx, ZONE.hearthSeamY, crest.color, event.stoked ? 48 : 22, event.stoked ? 1.6 : 1);
  const winCard = table.hearths[event.hearth][event.winner];
  if (winCard) landPop(winCard, event.stoked ? 1.6 : 1);
  shoveSide(table, event.loser, event.stoked ? 1.5 : 1);
  if (event.stoked) playStoke();
  else playClash(event.winner === 'player');
}

function afterClash() {
  const table = app.table;
  if (checkOutcome(table)) {
    endMatch();
    return;
  }
  if (pendingClashes(table).length > 0) startClash();
  else enterTurn(true);
}

function nextRound() {
  const table = app.table;
  closeRound(table);
  if (checkOutcome(table)) {
    endMatch();
    return;
  }
  const dealt = startRound(table);
  if (dealt > 0) playDealRound(dealt);
}

function endMatch() {
  const table = app.table;
  app.screen = 'end';
  app.endWon = table.outcome.winner === 'player';
  app.flourish = createFlourish();
  app.selected = null;
  app.bankSelected = false;
  app.intent = null;
  if (app.endWon) {
    emitEmbers(app.burst, 420, 706, '#ffb15c', 44, 2.1);
    emitEmbers(app.burst, 860, 706, '#ff7f33', 44, 2.1);
    playWin();
  } else {
    playLoss();
  }
}

// --- what the player can do ------------------------------------------------

/** A card pressed during the deal should land the deal, not vanish into nothing. */
function hurryDeal() {
  if (app.screen === 'table' && app.table.phase === 'dealing') {
    app.table.timer = 0;
    for (const card of [...app.table.hands.player, ...app.table.hands.rival]) {
      if (card.view) card.view.wait = 0;
    }
    return true;
  }
  return false;
}

const actions = {
  unlock: unlockAudio,
  start: () => {
    if (app.screen === 'title') startMatch();
  },
  rematch: () => rematch(),
  mute: () => {
    toggleMute();
    if (!isMuted()) playSelect();
  },
  pickCard: (index) => {
    if (hurryDeal()) return;
    if (app.screen !== 'table' || app.table.phase !== 'player') return;
    if (!app.table.hands.player[index]) return;
    app.bankSelected = false;
    app.selected = app.selected === index ? null : index;
    playSelect();
  },
  pickBank: () => {
    if (app.screen !== 'table' || app.table.phase !== 'player') return;
    if (!app.table.bank.player) return;
    app.selected = null;
    app.bankSelected = !app.bankSelected;
    playSelect();
  },
  bank: () => {
    const table = app.table;
    if (app.screen !== 'table' || table.phase !== 'player') return;
    if (app.selected === null || !canBank(table, 'player')) return;
    bankCard(table, 'player', app.selected);
    app.selected = null;
    playBank();
    afterAction();
  },
  commitTo: (hearthIndex) => {
    const table = app.table;
    if (hurryDeal()) return;
    if (app.screen !== 'table' || table.phase !== 'player') return;
    if (table.hearths[hearthIndex].player) return;
    if (app.bankSelected) {
      const card = flareCard(table, 'player', hearthIndex);
      if (!card) return;
      app.bankSelected = false;
      landPop(card, 1.3);
      playFlare();
      afterAction();
      return;
    }
    if (app.selected === null) return;
    const card = playToHearth(table, 'player', app.selected, hearthIndex);
    if (!card) return;
    app.selected = null;
    landPop(card);
    playSnap();
    afterAction();
  },
  confirm: () => {
    const table = app.table;
    if (app.screen !== 'table' || table.phase !== 'player') return;
    const open = openHearths(table, 'player');
    if (open.length > 0) actions.commitTo(open[0]);
  },
  nudgeSelection: (delta) => {
    const hand = app.table.hands.player;
    if (hand.length === 0) return;
    const base = app.selected === null ? (delta > 0 ? -1 : hand.length) : app.selected;
    app.selected = (base + delta + hand.length) % hand.length;
    app.bankSelected = false;
    playSelect();
  },
  clearSelection: () => {
    app.selected = null;
    app.bankSelected = false;
  },
};

// --- frame loop ------------------------------------------------------------

function scene() {
  return {
    table: app.table,
    time: app.time,
    motes: app.motes,
    burst: app.burst,
    column: app.column,
    selection: app.selected,
    bankSelected: app.bankSelected,
    hover: app.hover,
    intent: app.intent,
    flourish: app.flourish,
  };
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const current = scene();
  if (app.screen === 'title') drawTitleScreen(ctx, current);
  else if (app.screen === 'end') drawEndScreen(ctx, current, app.endWon);
  else drawScene(ctx, current);
}

let last = 0;
function frame(now) {
  const raw = last === 0 ? 0 : (now - last) / 1000;
  last = now;
  const dt = app.frozen ? 0 : Math.min(0.05, raw);
  if (dt > 0) {
    app.time += dt;
    stepMotes(app.motes, dt, app.time);
    stepEmbers(app.burst, dt);
    stepRisingColumn(app.column, dt, app.time);
    if (app.flourish) stepFlourish(app.flourish, dt);
    if (app.screen === 'table') stepDirector(dt);
    assignTargets(app.table, app.selected);
    stepTable(app.table, dt);
  }
  draw();
  requestAnimationFrame(frame);
}

async function boot() {
  try {
    await document.fonts.ready;
    await Promise.all([
      document.fonts.load('118px Anton'),
      document.fonts.load('600 112px Cinzel'),
      document.fonts.load('700 15px Cinzel'),
    ]);
  } catch {
    /* the fallback faces still draw */
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) applyShot(app, shot);
  attachInput(canvas, app, actions);
  requestAnimationFrame(frame);
}

boot();
