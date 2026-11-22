// VESPER, the ash suitor: a deterministic rival. The court is open, so she reads your
// hand exactly as you read hers. She scores a clash she can win now by the damage it
// deals, scores an empty hearth by how many of your cards could still beat it, hunts
// stokes on neighbouring hearths, and seals a card away when she can see your answer.
//
// Every choice comes from the match seed, the round and how many cards she has placed,
// so the same match always plays the same way, and `peekIntent` can show the hearth she
// is eyeing before she commits to it.

import { CRESTS } from './crests.js';
import { STOKE_BONUS } from './config.js';
import { canBank, canFlare, clashAt, isStoked, legalPlacements, openHearths } from './rules.js';
import { makeRandom } from './random.js';

export function createRival(seed) {
  return { seed: (seed ^ 0x5f3a9b) >>> 0, name: 'VESPER' };
}

function placementsMade(table) {
  return table.hearths.reduce((count, hearth) => count + (hearth.rival ? 1 : 0), 0);
}

function rngFor(table, rival) {
  return makeRandom(rival.seed + table.round * 9173 + placementsMade(table) * 331);
}

/** Score a hypothetical clash from VESPER's point of view. */
function clashScore(table, index, rivalCard, playerCard) {
  const hearths = table.hearths.map((hearth) => ({ ...hearth }));
  hearths[index] = { ...hearths[index], rival: rivalCard, player: playerCard };
  const event = clashAt({ hearths }, index);
  if (!event) return 0;
  return event.winner === 'rival' ? event.damage : -event.damage;
}

function playerAnswers(table) {
  const answers = table.hands.player.slice();
  if (table.bank.player) answers.push(table.bank.player);
  return answers;
}

/**
 * How a card reads on a hearth: the clash it settles now, or the fight it invites.
 */
function scorePlacement(table, card, index, rng) {
  const hearth = table.hearths[index];
  if (hearth.player) {
    // A clash lands this instant: take the damage, and take more of it.
    const settled = clashScore(table, index, card, hearth.player);
    return settled * 1.35 + (settled > 0 ? 0.6 : 0);
  }

  // An open hearth: measure it against every card you could still answer with.
  const answers = playerAnswers(table);
  if (answers.length === 0) return card.rank * 0.12 + 0.5;
  let hold = 0;
  let total = 0;
  for (const answer of answers) {
    const value = clashScore(table, index, card, answer);
    total += value;
    if (value > 0) hold += 1;
  }
  const average = total / answers.length;
  const holdRate = hold / answers.length;

  // A stoke she can set up: the same crest already waiting on a neighbour.
  const stokePotential = isStoked(table, index, 'rival', card.crest) ? STOKE_BONUS * holdRate * 0.9 : 0;

  // Keeping a crest pair alive in hand is worth a little, as is not burning a six early.
  const pairInHand = table.hands.rival.filter((other) => other !== card && other.crest === card.crest).length;
  const centreBias = index === 1 ? 0.35 : 0;

  return average * 1.05 + holdRate * 1.5 + stokePotential + centreBias + pairInHand * 0.18 + rng.range(-0.3, 0.3);
}

/** Should she seal a card away instead of committing it to the table? */
function bankScore(table, card, rng) {
  if (card.rank < 4) return -Infinity;
  const beatable = playerAnswers(table).filter((answer) => {
    const hearths = table.hearths.map((hearth) => ({ ...hearth }));
    hearths[0] = { player: answer, rival: card, event: null };
    const event = clashAt({ hearths }, 0);
    return event && event.winner === 'player';
  }).length;
  const answers = Math.max(1, playerAnswers(table).length);
  const exposure = beatable / answers;
  // Worth hiding when your hand plainly answers it, and only early in a round.
  const earliness = openHearths(table, 'rival').length >= 3 ? 1 : 0.25;
  return (exposure * 3.4 + card.rank * 0.2 - 1.5) * earliness + rng.range(-0.2, 0.2);
}

/**
 * Decide VESPER's move. Returns {type:'play'|'bank'|'flare', card, cardIndex, hearth}
 * or null when she is spent for the round.
 */
export function chooseMove(table, rival) {
  const rng = rngFor(table, rival);
  const options = [];

  for (const move of legalPlacements(table, 'rival')) {
    options.push({
      type: 'play',
      card: move.card,
      cardIndex: move.cardIndex,
      hearth: move.hearth,
      score: scorePlacement(table, move.card, move.hearth, rng),
    });
  }

  if (canFlare(table, 'rival')) {
    const card = table.bank.rival;
    for (const hearth of openHearths(table, 'rival')) {
      options.push({
        type: 'flare',
        card,
        hearth,
        // A flare is a surprise: worth a touch more than the same card played openly.
        score: scorePlacement(table, card, hearth, rng) + 0.7,
      });
    }
  }

  if (canBank(table, 'rival')) {
    table.hands.rival.forEach((card, cardIndex) => {
      options.push({ type: 'bank', card, cardIndex, hearth: null, score: bankScore(table, card, rng) });
    });
  }

  if (options.length === 0) return null;
  options.sort((a, b) => b.score - a.score || a.card.rank - b.card.rank || a.card.id.localeCompare(b.card.id));
  return options[0];
}

/** The hearth she is eyeing right now, for the tell drawn during your turn. */
export function peekIntent(table, rival) {
  if (table.outcome) return null;
  const move = chooseMove(table, rival);
  if (!move || move.hearth === null) return null;
  return { hearth: move.hearth, crest: move.card.crest, type: move.type };
}

/** One short line naming what she is weighing, for the court log. */
export function intentWord(move) {
  if (!move) return 'spent';
  if (move.type === 'bank') return 'seals a crest away';
  if (move.type === 'flare') return `flares ${CRESTS[move.card.crest].name}`;
  return `weighs ${CRESTS[move.card.crest].name} ${move.card.rank}`;
}
