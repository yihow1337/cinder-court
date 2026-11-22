// The table state: two hands, three hearths, two bank slots, life totals, whose turn it
// is and the court log. Every mutation a match can make lives here and nowhere else.

import { HAND_SIZE, HEARTH_COUNT, LIFE_START, TIME } from './config.js';
import { cardsLeft, createDeck, discardCards, drawCards } from './deck.js';
import { CRESTS } from './crests.js';
import { OTHER, clashAt, hasAnyMove, matchOutcome, openHearths, pendingClashes } from './rules.js';

export function createTable(seed) {
  return {
    seed,
    deck: createDeck(seed),
    round: 0,
    hands: { player: [], rival: [] },
    hearths: freshHearths(),
    bank: { player: null, rival: null },
    bankUsed: { player: false, rival: false },
    life: { player: LIFE_START, rival: LIFE_START },
    turn: 'player',
    initiative: 'player',
    phase: 'dealing',
    timer: 0,
    tell: null,
    lastEvent: null,
    flash: { player: 0, rival: 0 },
    log: [],
    outcome: null,
    courtExhausted: false,
  };
}

function freshHearths() {
  return Array.from({ length: HEARTH_COUNT }, () => ({ player: null, rival: null, event: null }));
}

// --- dealing ---------------------------------------------------------------

export function startRound(table) {
  table.round += 1;
  table.hearths = freshHearths();
  table.bankUsed = { player: false, rival: false };
  table.tell = null;
  let dealt = 0;
  for (const side of ['player', 'rival']) {
    const need = HAND_SIZE - table.hands[side].length;
    const fresh = drawCards(table.deck, need);
    for (const card of fresh) {
      card.dealDelay = dealt * TIME.dealStagger;
      card.faceUp = false;
      dealt += 1;
      table.hands[side].push(card);
    }
  }
  table.phase = 'dealing';
  table.timer = dealt * TIME.dealStagger + TIME.dealTravel + 0.12;
  table.turn = table.initiative;
  pushLog(table, { label: `ROUND ${table.round}`, detail: 'the court is set', tone: 'neutral' });
  return dealt;
}

export function courtIsEmpty(table) {
  return (
    cardsLeft(table.deck) === 0 &&
    table.hands.player.length === 0 &&
    table.hands.rival.length === 0 &&
    !table.bank.player &&
    !table.bank.rival
  );
}

// --- the three actions -----------------------------------------------------

export function playToHearth(table, side, cardIndex, hearthIndex) {
  const hearth = table.hearths[hearthIndex];
  const card = table.hands[side][cardIndex];
  if (!card || hearth[side]) return null;
  table.hands[side].splice(cardIndex, 1);
  card.faceUp = true;
  hearth[side] = card;
  pushLog(table, {
    label: side === 'player' ? `YOU → ${roman(hearthIndex)}` : `VESPER → ${roman(hearthIndex)}`,
    detail: `${CRESTS[card.crest].name} ${card.rank}`,
    tone: side,
    crest: card.crest,
  });
  if (side === 'rival') table.tell = null;
  return card;
}

export function bankCard(table, side, cardIndex) {
  const card = table.hands[side][cardIndex];
  if (!card || table.bank[side] || table.bankUsed[side]) return null;
  table.hands[side].splice(cardIndex, 1);
  table.bank[side] = card;
  table.bankUsed[side] = true;
  card.faceUp = side === 'player';
  pushLog(table, {
    label: side === 'player' ? 'YOU BANK' : 'VESPER BANKS',
    detail: side === 'player' ? `${CRESTS[card.crest].name} ${card.rank} held back` : 'a card sealed away',
    tone: side,
    crest: side === 'player' ? card.crest : null,
  });
  return card;
}

export function flareCard(table, side, hearthIndex) {
  const card = table.bank[side];
  const hearth = table.hearths[hearthIndex];
  if (!card || hearth[side]) return null;
  table.bank[side] = null;
  card.faceUp = true;
  card.flared = true;
  hearth[side] = card;
  pushLog(table, {
    label: side === 'player' ? `YOU FLARE → ${roman(hearthIndex)}` : `VESPER FLARES → ${roman(hearthIndex)}`,
    detail: `${CRESTS[card.crest].name} ${card.rank} from the bank`,
    tone: side,
    crest: card.crest,
  });
  if (side === 'rival') table.tell = null;
  return card;
}

// --- clashes ---------------------------------------------------------------

/** Score the next contested hearth, apply its damage, and return the event. */
export function resolveNextClash(table) {
  const [index] = pendingClashes(table);
  if (index === undefined) return null;
  const event = clashAt(table, index);
  table.hearths[index].event = event;
  table.life[event.loser] = Math.max(0, table.life[event.loser] - event.damage);
  table.flash[event.loser] = 1;
  table.lastEvent = event;
  const who = event.winner === 'player' ? 'YOU TAKE' : 'VESPER TAKES';
  pushLog(table, {
    label: `${who} ${roman(index)}`,
    detail: `${event.stoked ? 'STOKED  ' : ''}−${event.damage}${event.byCycle ? '  BY CYCLE' : ''}`,
    tone: event.winner,
    crest: event.winCard.crest,
    strong: true,
  });
  return event;
}

// --- turn flow -------------------------------------------------------------

export function passTurn(table) {
  const other = OTHER[table.turn];
  if (hasAnyMove(table, other)) {
    table.turn = other;
    return table.turn;
  }
  if (hasAnyMove(table, table.turn)) return table.turn;
  return null;
}

export function sideIsDone(table, side) {
  return !hasAnyMove(table, side);
}

export function closeRound(table) {
  const spent = [];
  for (const side of ['player', 'rival']) {
    spent.push(...table.hands[side]);
    table.hands[side] = [];
  }
  for (const hearth of table.hearths) {
    spent.push(hearth.player, hearth.rival);
  }
  discardCards(table.deck, spent);
  table.initiative = OTHER[table.initiative];
  table.hearths = freshHearths();
}

export function checkOutcome(table) {
  const exhausted = courtIsEmpty(table) && cardsLeft(table.deck) === 0;
  table.courtExhausted = exhausted;
  const outcome = matchOutcome(table, exhausted);
  if (outcome) {
    table.outcome = outcome;
    table.phase = 'over';
    pushLog(table, {
      label: outcome.winner === 'player' ? 'THE COURT IS YOURS' : outcome.winner === 'rival' ? 'THE EMBERS DIE' : 'A SHARED EMBER',
      detail: outcome.reason === 'embers-spent' ? 'embers spent' : 'life broken',
      tone: outcome.winner === 'shared' ? 'neutral' : outcome.winner,
      strong: true,
    });
  }
  return outcome;
}

// --- helpers ---------------------------------------------------------------

export function pushLog(table, entry) {
  table.log.unshift({ ...entry, age: 0 });
  if (table.log.length > 5) table.log.length = 5;
}

export function setTell(table, hearthIndex, crest, strength = 1) {
  table.tell = { hearth: hearthIndex, crest, strength, t: 0 };
}

export function openFor(table, side) {
  return openHearths(table, side);
}

export function roman(index) {
  return ['I', 'II', 'III'][index] ?? '?';
}
