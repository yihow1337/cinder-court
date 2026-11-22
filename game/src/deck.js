// The court's 24 crests: four crests by six ranks, shuffled from a seed so a match can
// be replayed exactly. Also owns the discard and the "draw back to five" refill.

import { CREST_IDS } from './crests.js';
import { RANKS } from './config.js';
import { makeRandom } from './random.js';

export function buildDeck() {
  const cards = [];
  for (const crest of CREST_IDS) {
    for (const rank of RANKS) {
      cards.push({ id: `${crest}-${rank}`, crest, rank });
    }
  }
  return cards;
}

export function shuffled(cards, rng) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function createDeck(seed) {
  const rng = makeRandom(seed);
  return {
    rng,
    stock: shuffled(buildDeck(), rng),
    discard: [],
  };
}

export function drawCards(deck, count) {
  return deck.stock.splice(0, Math.max(0, count));
}

export function discardCards(deck, cards) {
  for (const card of cards) if (card) deck.discard.push(card);
}

export function cardsLeft(deck) {
  return deck.stock.length;
}

/**
 * Pull one named card out of the stock, for the deterministic screenshot scenes.
 * Returns null when that crest and rank is no longer in the stock.
 */
export function takeNamedCard(deck, crest, rank) {
  const index = deck.stock.findIndex((card) => card.crest === crest && card.rank === rank);
  if (index === -1) return null;
  return deck.stock.splice(index, 1)[0];
}
