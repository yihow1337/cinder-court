// Where everything sits on the 1280x720 court. One job: turn table state into target
// positions for every card, and turn a mouse point back into the thing under it.

import { CARD, HEARTH_COUNT, SCALE, ZONE } from './config.js';

/** Deterministic -1..1 wobble per card so a dealt hand never looks machine-stacked. */
function wobble(card) {
  let h = 0;
  for (let i = 0; i < card.id.length; i += 1) h = (h * 31 + card.id.charCodeAt(i)) & 0xffff;
  return (h % 1000) / 500 - 1;
}

export function handSlot(side, index, count, card, lifted) {
  const step = side === 'player' ? ZONE.playerHandStep : ZONE.rivalHandStep;
  const scale = side === 'player' ? SCALE.playerHand : SCALE.rivalHand;
  const centerX = side === 'player' ? ZONE.playerHandCenterX : ZONE.rivalHandCenterX;
  const spread = index - (count - 1) / 2;
  const arc = Math.abs(spread) ** 2 * 2.6;
  const jitter = card ? wobble(card) : 0;
  if (side === 'player') {
    return {
      x: centerX + spread * step,
      y: ZONE.playerHandY + (CARD.h * scale) / 2 + arc - (lifted ? 34 : 0),
      scale: scale * (lifted ? 1.05 : 1),
      rot: spread * 0.03 + jitter * 0.016,
    };
  }
  return {
    x: centerX + spread * step,
    y: ZONE.rivalHandY + (CARD.h * scale) / 2 - arc,
    scale,
    rot: -spread * 0.026 + jitter * 0.014,
  };
}

export function hearthSlot(side, index) {
  const scale = SCALE.hearth;
  const y = side === 'player' ? ZONE.hearthPlayerY : ZONE.hearthRivalY;
  return {
    x: ZONE.hearthCentersX[index],
    y: y + (CARD.h * scale) / 2,
    scale,
    rot: 0,
  };
}

export function bankSlot(side) {
  const spot = side === 'player' ? ZONE.playerBank : ZONE.rivalBank;
  return { x: spot.cx, y: spot.cy, scale: SCALE.bank, rot: side === 'player' ? -0.07 : 0.07 };
}

export function deckSlot() {
  return { x: ZONE.deckStack.cx, y: ZONE.deckStack.cy, scale: SCALE.pile, rot: 0.04 };
}

export function discardSlot() {
  return { x: ZONE.discardStack.cx, y: ZONE.discardStack.cy, scale: SCALE.pile, rot: -0.05 };
}

export function cardBox(pose) {
  const w = CARD.w * pose.scale;
  const h = CARD.h * pose.scale;
  return { x: pose.x - w / 2, y: pose.y - h / 2, w, h };
}

/** The whole column you can click to commit to a hearth: both slots and the seam
 *  between them, derived from the hearth zone so it follows the court's dressing. */
export function hearthColumn(index) {
  const top = ZONE.hearthRivalY - 16;
  const bottom = ZONE.hearthPlayerY + CARD.h * SCALE.hearth + 24;
  return {
    x: ZONE.hearthCentersX[index] - ZONE.hearthPlateW / 2,
    y: top,
    w: ZONE.hearthPlateW,
    h: bottom - top,
  };
}

/** Give every card on the table the pose it should be springing toward. */
export function assignTargets(table, selection) {
  for (const side of ['player', 'rival']) {
    const hand = table.hands[side];
    hand.forEach((card, index) => {
      const lifted = side === 'player' && selection === index;
      card.target = handSlot(side, index, hand.length, card, lifted);
      card.faceTarget = 1;
    });
    const banked = table.bank[side];
    if (banked) {
      banked.target = bankSlot(side);
      banked.faceTarget = side === 'player' ? 1 : 0;
    }
  }
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    for (const side of ['player', 'rival']) {
      const card = table.hearths[i][side];
      if (card) {
        card.target = hearthSlot(side, i);
        card.faceTarget = 1;
      }
    }
  }
}

/** What is under the pointer: a hand card, a hearth column, or the bank. */
export function pickAt(table, px, py) {
  const hand = table.hands.player;
  for (let i = hand.length - 1; i >= 0; i -= 1) {
    const box = cardBox(handSlot('player', i, hand.length, hand[i], false));
    if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
      return { kind: 'hand', index: i };
    }
  }
  if (table.bank.player) {
    const box = cardBox(bankSlot('player'));
    if (px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h) {
      return { kind: 'bank' };
    }
  }
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    const col = hearthColumn(i);
    if (px >= col.x && px <= col.x + col.w && py >= col.y && py <= col.y + col.h) {
      return { kind: 'hearth', index: i };
    }
  }
  return { kind: 'table' };
}
