// The deterministic scenes behind ?shot=title|table|win|loss&seed=N.
//
// Each one is a set piece: the hands are dealt out of the real seeded deck, then every
// play, clash, stoke, damage number and outcome is produced by calling the same rules
// and table functions a live match calls. Nothing is painted by hand, and the same seed
// always yields the same frame, so a screenshot can be retaken exactly.

import { HEARTH_COUNT, TIME, setDressing } from './config.js';
import { createTable, playToHearth, resolveNextClash, startRound, checkOutcome } from './table.js';
import { createRival } from './ai.js';
import { takeNamedCard } from './deck.js';
import { assignTargets } from './layout.js';
import { createFlourish, ensureView, stepTable } from './animate.js';
import { emitEmbers, stepEmbers, stepMotes, stepRisingColumn } from './particles.js';
import { pendingClashes } from './rules.js';

export const SHOT_NAMES = ['title', 'table', 'win', 'loss'];

/** Replace a dealt hand with a named set of cards drawn from the real stock. */
function stageHand(table, side, names) {
  const kept = table.hands[side];
  table.deck.stock.push(...kept);
  table.hands[side] = [];
  for (const [crest, rank] of names) {
    const card = takeNamedCard(table.deck, crest, rank) ?? { id: `${crest}-${rank}`, crest, rank };
    card.faceUp = true;
    card.dealDelay = 0;
    table.hands[side].push(card);
  }
}

function handIndexOf(table, side, crest, rank) {
  return table.hands[side].findIndex((card) => card.crest === crest && card.rank === rank);
}

/** Make one real play, then score any clash it caused, exactly as the director does. */
function scriptedPlay(table, side, crest, rank, hearth) {
  const index = handIndexOf(table, side, crest, rank);
  if (index === -1) return null;
  playToHearth(table, side, index, hearth);
  while (pendingClashes(table).length > 0) resolveNextClash(table);
  return table.hearths[hearth][side];
}

/** Let every spring, flip and particle settle so the frame is identical every time. */
function settle(app, seconds = 2.4) {
  const dt = 1 / 60;
  for (let i = 0; i < Math.round(seconds / dt); i += 1) {
    assignTargets(app.table, app.selected);
    stepTable(app.table, dt);
    stepMotes(app.motes, dt, i * dt);
    stepEmbers(app.burst, dt);
    stepRisingColumn(app.column, dt, i * dt);
  }
}

/**
 * Build the scene named by ?shot= and freeze it. Returns true when the name was known.
 */
export function applyShot(app, name) {
  app.time = 2.3;
  // The table is framed with the rails pulled away, so the court itself fills the frame.
  setDressing(name === 'table' ? 'focus' : 'rails');
  if (name === 'title') {
    app.screen = 'title';
    settle(app, 1.2);
    app.frozen = true;
    return true;
  }
  if (name === 'table') {
    buildMidRound(app);
    app.frozen = true;
    return true;
  }
  if (name === 'win' || name === 'loss') {
    buildEnding(app, name === 'win');
    app.frozen = true;
    return true;
  }
  return false;
}

/**
 * An open court one beat after the snap, with everything at rest.
 *
 * Two hearths are settled and scored -- she took the left by a point, you took the centre
 * back with a stoked ASH 6 -- and on the right she has already committed, so the open gold
 * slot under her BELL 4 is the move in front of you. Nothing is mid-flight: no card
 * overlaps another, no chip crosses a rank, and the only motion left is the rim glow on
 * the two cards that won their seam. The frame is meant to be read at a glance from a
 * contact sheet, where a lively tangle would just be a smudge.
 */
function buildMidRound(app) {
  const table = createTable(app.seed);
  app.table = table;
  app.rival = createRival(app.seed);
  app.screen = 'table';

  startRound(table);
  stageHand(table, 'player', [
    ['ash', 4],
    ['ash', 6],
    ['tide', 5],
    ['bell', 2],
    ['thorn', 3],
  ]);
  stageHand(table, 'rival', [
    ['thorn', 5],
    ['tide', 3],
    ['bell', 4],
    ['tide', 6],
    ['thorn', 2],
  ]);

  // five real moves: she takes the left hearth, you stoke the centre and take it back,
  // then she commits BELL 4 to the right and the court comes back round to you
  scriptedPlay(table, 'player', 'ash', 4, 0);
  scriptedPlay(table, 'rival', 'thorn', 5, 0);
  scriptedPlay(table, 'player', 'ash', 6, 1);
  scriptedPlay(table, 'rival', 'tide', 3, 1);
  scriptedPlay(table, 'rival', 'bell', 4, 2);

  table.phase = 'player';
  table.turn = 'player';
  table.timer = 0;
  app.selected = handIndexOf(table, 'player', 'tide', 5);
  // No tell and no sparks: she has already shown her hand on the right hearth, and a
  // speck of ember over a rank costs more than a lit seam is worth at thumbnail size.
  app.intent = null;
  app.hover = null;
  settle(app, 3.2);
  // Put the rim glow and the landing pop back on the cards that won their seam.
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    const event = table.hearths[i].event;
    if (!event) continue;
    const winner = table.hearths[i][event.winner];
    if (!winner) continue;
    const view = ensureView(winner);
    // Swell barely: a popped card grows into the gutter the layout just bought. And keep
    // the crest-bright glow for the stoked card alone -- on a plain win it paints over the
    // gold-or-cold rim that says whose hearth this is, which is the more useful cue.
    view.glow = event.stoked ? 0.95 : 0;
    view.pop = event.stoked ? 0.18 : 0.08;
  }
}

/**
 * The last clash of a match, scored for real: a stoked crest finishes the loser off and
 * the rules declare the outcome.
 */
function buildEnding(app, playerWins) {
  const table = createTable(app.seed);
  app.table = table;
  app.rival = createRival(app.seed);
  startRound(table);

  if (playerWins) {
    // You are on 5, she is on 6. ASH 3 already holds the left hearth, so ASH 6 is stoked:
    // a four point gap plus two is six, and her last ember goes out.
    table.life.player = 5;
    table.life.rival = 6;
    stageHand(table, 'player', [['ash', 3], ['ash', 6], ['bell', 5]]);
    stageHand(table, 'rival', [['tide', 2], ['thorn', 4], ['bell', 1]]);
    scriptedPlay(table, 'player', 'ash', 3, 0);
    scriptedPlay(table, 'rival', 'thorn', 4, 2);
    scriptedPlay(table, 'rival', 'tide', 2, 1);
    scriptedPlay(table, 'player', 'ash', 6, 1);
  } else {
    // She is on 7, you are on 3. Her BELL 4 holds the right hearth, so BELL 6 is stoked
    // against your THORN 3: three plus two takes your last three embers.
    table.life.player = 3;
    table.life.rival = 7;
    stageHand(table, 'player', [['thorn', 3], ['tide', 1], ['ash', 2]]);
    stageHand(table, 'rival', [['bell', 4], ['bell', 6], ['tide', 5]]);
    scriptedPlay(table, 'rival', 'bell', 4, 2);
    scriptedPlay(table, 'player', 'tide', 1, 0);
    scriptedPlay(table, 'player', 'thorn', 3, 1);
    scriptedPlay(table, 'rival', 'bell', 6, 1);
  }

  checkOutcome(table);
  app.endWon = table.outcome ? table.outcome.winner === 'player' : playerWins;
  app.screen = 'end';
  app.flourish = createFlourish();
  app.flourish.t = TIME.flourish * 0.35;
  app.flourish.snap = 1;
  app.selected = null;
  app.intent = null;
  if (app.endWon) {
    emitEmbers(app.burst, 420, 700, '#ffb15c', 40, 2.1);
    emitEmbers(app.burst, 860, 700, '#ff7f33', 40, 2.1);
    emitEmbers(app.burst, 640, 660, '#ffd98a', 30, 1.6);
  }
  settle(app, 0.75);
}
