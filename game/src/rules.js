// Every decision the rules of CINDER COURT make, as pure functions over a table state:
// which plays are legal, who wins a clash, when a win is stoked, how much life it costs,
// and when the match is over. Nothing here draws, animates or mutates life directly.

import { HEARTH_COUNT, MIN_CLASH_DAMAGE, STOKE_BONUS } from './config.js';
import { beatsOnTie } from './crests.js';

export const OTHER = { player: 'rival', rival: 'player' };

/** Hearths this side has not occupied yet this round. */
export function openHearths(table, side) {
  const open = [];
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    if (!table.hearths[i][side]) open.push(i);
  }
  return open;
}

export function canBank(table, side) {
  return !table.bankUsed[side] && !table.bank[side] && table.hands[side].length > 0;
}

export function canFlare(table, side) {
  return Boolean(table.bank[side]) && openHearths(table, side).length > 0;
}

/** Every (card, hearth) pair this side could legally place right now. */
export function legalPlacements(table, side) {
  const hearths = openHearths(table, side);
  const moves = [];
  table.hands[side].forEach((card, cardIndex) => {
    for (const hearth of hearths) moves.push({ card, cardIndex, hearth });
  });
  return moves;
}

export function hasAnyMove(table, side) {
  return legalPlacements(table, side).length > 0 || canBank(table, side) || canFlare(table, side);
}

/**
 * Resolve one contested hearth. Higher rank takes it; on a tie the crest cycle decides.
 * Damage is the rank gap (at least 1) plus a stoke bonus when the winner already shows
 * the same crest on an adjacent hearth. Pure: returns the event, changes nothing.
 */
export function clashAt(table, index) {
  const hearth = table.hearths[index];
  const mine = hearth.player;
  const theirs = hearth.rival;
  if (!mine || !theirs) return null;

  let winner;
  let byCycle = false;
  if (mine.rank > theirs.rank) winner = 'player';
  else if (theirs.rank > mine.rank) winner = 'rival';
  else {
    byCycle = true;
    winner = beatsOnTie(mine.crest, theirs.crest) ? 'player' : 'rival';
  }

  const loser = OTHER[winner];
  const winCard = hearth[winner];
  const loseCard = hearth[loser];
  const gap = Math.abs(winCard.rank - loseCard.rank);
  const stoked = isStoked(table, index, winner, winCard.crest);
  const damage = Math.max(MIN_CLASH_DAMAGE, gap) + (stoked ? STOKE_BONUS : 0);

  return { hearth: index, winner, loser, winCard, loseCard, damage, stoked, byCycle, gap };
}

/** A win is stoked when the same crest already sits on the winner's side of a neighbour. */
export function isStoked(table, index, side, crest) {
  for (const neighbour of [index - 1, index + 1]) {
    if (neighbour < 0 || neighbour >= HEARTH_COUNT) continue;
    const card = table.hearths[neighbour][side];
    if (card && card.crest === crest) return true;
  }
  return false;
}

/** Hearths where both sides have committed but no clash has been scored yet. */
export function pendingClashes(table) {
  const pending = [];
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    const hearth = table.hearths[i];
    if (hearth.player && hearth.rival && !hearth.event) pending.push(i);
  }
  return pending;
}

export function roundIsSpent(table) {
  return !hasAnyMove(table, 'player') && !hasAnyMove(table, 'rival') && pendingClashes(table).length === 0;
}

/**
 * Who, if anyone, has won. Life reaching zero ends it; otherwise an exhausted court
 * ("embers spent") compares life totals.
 */
export function matchOutcome(table, courtExhausted) {
  const { player, rival } = table.life;
  if (player <= 0 && rival <= 0) return { winner: player === rival ? 'shared' : player > rival ? 'player' : 'rival', reason: 'both-fallen' };
  if (rival <= 0) return { winner: 'player', reason: 'life' };
  if (player <= 0) return { winner: 'rival', reason: 'life' };
  if (courtExhausted) {
    if (player === rival) return { winner: 'shared', reason: 'embers-spent' };
    return { winner: player > rival ? 'player' : 'rival', reason: 'embers-spent' };
  }
  return null;
}

/** How a hearth reads once scored: used by the renderer for its badges. */
export function hearthVerdict(hearth, side) {
  if (!hearth.event) return 'open';
  return hearth.event.winner === side ? 'won' : 'lost';
}
