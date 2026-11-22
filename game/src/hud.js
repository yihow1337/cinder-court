// The rails around the table: the two life blocks (enormous numerals plus a row of
// ember pips), the crest cycle wheel that shows the tie-break as a picture, the deck and
// ash piles, whose move it is, the court log and the court's law.

import { DRESS, HEARTH_NUMERALS, INK, LIFE_START, RIVAL_NAME, RIVAL_TITLE, PLAYER_NAME, PLAYER_TITLE, SCALE, ZONE } from './config.js';
import { CRESTS, CYCLE_ORDER, drawCrest } from './crests.js';
import { cardsLeft } from './deck.js';
import { drawCardBackAt, drawEmptySlot } from './card-art.js';
import { anton, cinzel, lifePip, plate, resetSpacing, suitorSigil } from './ui.js';
import { isMuted } from './audio.js';

export function drawHud(ctx, scene) {
  drawLifeBlock(ctx, scene, 'rival');
  drawLifeBlock(ctx, scene, 'player');
  drawTurnBanner(ctx, scene);
  drawPiles(ctx, scene.table);
  // Everything below is the rail: useful while you play, noise when the court is framed.
  if (!DRESS.rails) return;
  drawCycleWheel(ctx, scene.time);
  drawCourtsLaw(ctx);
  drawCourtLog(ctx, scene.table);
  drawControlHint(ctx);
  drawBankSlots(ctx, scene);
}

// --- life ------------------------------------------------------------------

export function drawLifeBlock(ctx, scene, side) {
  const box = side === 'player' ? ZONE.playerLife : ZONE.rivalLife;
  const life = scene.table.life[side];
  const flash = scene.table.flash[side];
  const accent = side === 'player' ? INK.gold : INK.cold;
  const hot = flash > 0.02;

  plate(ctx, box.x, box.y, box.w, box.h, {
    fill: hot ? `rgba(90,22,12,${0.5 + flash * 0.35})` : 'rgba(12,8,6,0.8)',
    stroke: hot ? INK.blood : `rgba(246,201,87,${side === 'player' ? 0.4 : 0.22})`,
    radius: 12,
    lineWidth: side === 'player' ? 2.4 : 1.8,
  });

  // Two rhythms, one rule: the numeral never shares a band with anything else.
  // On the rails it sits beside the name with the pips along the foot; in focus the
  // name and pips stack at the head and the numeral owns the whole lower half.
  const big = DRESS.lifeNumeral;
  const headY = DRESS.rails ? box.y + 42 : box.y + 28;
  const pipY = box.y + box.h - 16;
  const numeralY = DRESS.rails ? box.y + box.h - 66 : box.y + box.h / 2 + 14;

  suitorSigil(ctx, side, box.x + (DRESS.rails ? 42 : 30), headY, DRESS.rails ? 24 : 19);

  cinzel(ctx, DRESS.rails ? 22 : 21, accent, { align: 'left', spacing: 4.5 });
  ctx.fillText(side === 'player' ? PLAYER_NAME : RIVAL_NAME, box.x + (DRESS.rails ? 76 : 58), headY - (DRESS.rails ? 9 : 1));
  if (DRESS.rails) {
    cinzel(ctx, 9.5, INK.ashDim, { align: 'left', spacing: 1.8 });
    ctx.fillText(side === 'player' ? PLAYER_TITLE : RIVAL_TITLE, box.x + 76, headY + 13);
  }
  resetSpacing(ctx);

  anton(ctx, big, hot ? INK.blood : accent, 'right');
  ctx.save();
  ctx.shadowColor = hot ? INK.blood : accent;
  ctx.shadowBlur = 18 + flash * 30;
  ctx.fillText(String(life), box.x + box.w - 20, numeralY);
  ctx.restore();
  cinzel(ctx, DRESS.rails ? 12 : 14, INK.ashDim, { align: 'left', spacing: 5 });
  ctx.fillText('LIFE', box.x + 20, numeralY);
  resetSpacing(ctx);

  const step = (box.w - 38) / (LIFE_START - 1);
  for (let i = 0; i < LIFE_START; i += 1) {
    lifePip(ctx, box.x + 19 + i * step, pipY, 7.5, i < life, accent);
  }
}

// --- the cycle -------------------------------------------------------------

export function drawCycleWheel(ctx, time) {
  const { cx, cy, r } = ZONE.cycleWheel;
  cinzel(ctx, 11, INK.gold, { spacing: 4 });
  ctx.fillText('TIED RANK?', cx, cy - r - 18);
  cinzel(ctx, 10, INK.ashDim, { spacing: 3 });
  ctx.fillText('THE CYCLE DECIDES', cx, cy - r - 4);
  resetSpacing(ctx);

  ctx.save();
  ctx.strokeStyle = 'rgba(246,201,87,0.22)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const ringR = r * 0.68;
  CYCLE_ORDER.forEach((crestId, i) => {
    const angle = -Math.PI / 2 + (i / CYCLE_ORDER.length) * Math.PI * 2;
    const next = -Math.PI / 2 + ((i + 1) / CYCLE_ORDER.length) * Math.PI * 2;
    // arrow from this crest to the one it beats
    ctx.save();
    ctx.strokeStyle = CRESTS[crestId].color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, angle + 0.42, next - 0.42);
    ctx.stroke();
    const tipAngle = next - 0.42;
    const tx = cx + Math.cos(tipAngle) * ringR;
    const ty = cy + Math.sin(tipAngle) * ringR;
    ctx.translate(tx, ty);
    ctx.rotate(tipAngle + Math.PI / 2);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = CRESTS[crestId].color;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.lineTo(5.5, -5);
    ctx.lineTo(-5.5, -5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const dx = cx + Math.cos(angle) * ringR;
    const dy = cy + Math.sin(angle) * ringR;
    const pulse = 1 + Math.sin(time * 1.6 + i) * 0.04;
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#120c09';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CRESTS[crestId].color;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    drawCrest(ctx, crestId, 22, CRESTS[crestId].color);
    ctx.restore();
  });
}

// --- piles -----------------------------------------------------------------

export function drawPiles(ctx, table) {
  drawPile(ctx, ZONE.deckStack, cardsLeft(table.deck), 'DECK', INK.gold);
  drawPile(ctx, ZONE.discardStack, table.deck.discard.length, 'ASH', INK.ashDim);
}

function drawPile(ctx, spot, count, label, accent) {
  const pose = { x: spot.cx, y: spot.cy, scale: SCALE.pile, rot: 0, face: 0 };
  if (count === 0) {
    drawEmptySlot(ctx, pose, accent);
  } else {
    const layers = Math.min(3, count);
    for (let i = layers - 1; i >= 0; i -= 1) {
      drawCardBackAt(ctx, { ...pose, x: pose.x + i * 2.5, y: pose.y - i * 3 });
    }
  }
  ctx.save();
  ctx.fillStyle = 'rgba(8,6,5,0.84)';
  ctx.beginPath();
  ctx.arc(spot.cx, spot.cy + 4, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
  anton(ctx, 26, accent);
  ctx.fillText(String(count), spot.cx, spot.cy + 5);
  cinzel(ctx, 10, INK.ashDim, { spacing: 3 });
  ctx.fillText(label, spot.cx, spot.cy + 32);
  resetSpacing(ctx);
}

// --- the law ---------------------------------------------------------------

export function drawCourtsLaw(ctx) {
  const box = ZONE.rulesHook;
  plate(ctx, box.x, box.y, box.w, box.h, { fill: 'rgba(10,7,6,0.68)', stroke: 'rgba(246,201,87,0.18)' });
  cinzel(ctx, 10.5, INK.gold, { align: 'left', spacing: 3.4 });
  ctx.fillText("THE COURT'S LAW", box.x + 14, box.y + 16);
  const lines = [
    'HIGH RANK TAKES THE HEARTH',
    'DAMAGE = THE RANK GAP',
    'SAME CREST BESIDE = STOKED +2',
  ];
  cinzel(ctx, 10.5, INK.ash, { align: 'left', spacing: 0.8 });
  lines.forEach((line, i) => ctx.fillText(line, box.x + 14, box.y + 40 + i * 20));
  resetSpacing(ctx);
}

// --- turn, log, controls ---------------------------------------------------

export function drawTurnBanner(ctx, scene) {
  const box = ZONE.turnBanner;
  const { table } = scene;
  const yours = table.phase === 'player';
  const accent = yours ? INK.gold : table.phase === 'dealing' ? INK.ash : INK.cold;
  plate(ctx, box.x, box.y, box.w, box.h, {
    fill: yours ? 'rgba(58,30,8,0.82)' : 'rgba(10,14,20,0.8)',
    stroke: accent,
    lineWidth: 2,
  });
  const headline =
    table.phase === 'dealing'
      ? 'DEALING'
      : yours
        ? 'YOUR MOVE'
        : table.phase === 'over'
          ? 'COURT CLOSED'
          : 'VESPER MOVES';
  anton(ctx, DRESS.rails ? (yours ? 32 : 28) : 34, accent);
  ctx.save();
  if (yours) {
    ctx.shadowColor = INK.gold;
    ctx.shadowBlur = 14 + Math.sin(scene.time * 3) * 5;
  }
  ctx.fillText(headline, box.x + box.w / 2, box.y + (DRESS.rails ? 24 : box.h / 2));
  ctx.restore();
  // the round and the stock belong on the rails; in focus the pile speaks for itself
  if (!DRESS.rails) return;
  cinzel(ctx, 10.5, INK.ashDim, { spacing: 2.6 });
  ctx.fillText(`ROUND ${Math.max(1, table.round)}  ·  ${cardsLeft(table.deck)} IN DECK`, box.x + box.w / 2, box.y + 48);
  resetSpacing(ctx);
}

export function drawCourtLog(ctx, table) {
  const box = ZONE.logPanel;
  plate(ctx, box.x, box.y, box.w, box.h, { fill: 'rgba(9,6,5,0.74)', stroke: 'rgba(246,201,87,0.16)' });
  cinzel(ctx, 10.5, INK.gold, { align: 'left', spacing: 3.4 });
  ctx.fillText('COURT LOG', box.x + 14, box.y + 16);
  resetSpacing(ctx);
  drawMuteMark(ctx, box.x + box.w - 20, box.y + 15);

  table.log.forEach((entry, i) => {
    const y = box.y + 40 + i * 49;
    const fade = Math.max(0.3, 1 - i * 0.17);
    const tone = entry.tone === 'player' ? INK.gold : entry.tone === 'rival' ? INK.cold : INK.ash;
    ctx.save();
    ctx.globalAlpha = fade;
    if (entry.crest) {
      ctx.save();
      ctx.translate(box.x + 20, y + 8);
      drawCrest(ctx, entry.crest, 19, CRESTS[entry.crest].color);
      ctx.restore();
    }
    anton(ctx, entry.strong ? 19 : 17, tone, 'left');
    ctx.fillText(entry.label, box.x + 34, y + 4);
    cinzel(ctx, 10, INK.ashDim, { align: 'left', spacing: 0.6 });
    ctx.fillText(entry.detail, box.x + 34, y + 24);
    resetSpacing(ctx);
    ctx.restore();
  });
}

function drawMuteMark(ctx, x, y) {
  const muted = isMuted();
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = muted ? INK.ashDim : INK.lantern;
  ctx.fillStyle = muted ? 'transparent' : INK.lantern;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  muted ? ctx.stroke() : ctx.fill();
  if (muted) {
    ctx.beginPath();
    ctx.moveTo(-6, 6);
    ctx.lineTo(6, -6);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawControlHint(ctx) {
  const box = ZONE.controlHint;
  plate(ctx, box.x, box.y, box.w, box.h, { fill: 'rgba(9,6,5,0.6)', stroke: 'rgba(246,201,87,0.14)' });
  const lines = ['CLICK A CARD, THEN A HEARTH', '1-5 PICK  ·  Q W E HEARTH', 'B BANK  ·  F FLARE', 'M MUTE  ·  TAB FRAMES'];
  cinzel(ctx, 10, INK.ashDim, { spacing: 1.2 });
  lines.forEach((line, i) => ctx.fillText(line, box.x + box.w / 2, box.y + 15 + i * 16));
  resetSpacing(ctx);
}

// --- bank slots ------------------------------------------------------------

export function drawBankSlots(ctx, scene) {
  for (const side of ['player', 'rival']) {
    const spot = side === 'player' ? ZONE.playerBank : ZONE.rivalBank;
    if (scene.table.bank[side]) continue;
    const pose = { x: spot.cx, y: spot.cy, scale: SCALE.bank, rot: 0 };
    drawEmptySlot(ctx, pose, side === 'player' ? INK.gold : INK.cold);
    cinzel(ctx, 11, side === 'player' ? INK.gold : INK.cold, { spacing: 3 });
    ctx.fillText('BANK', spot.cx, spot.cy - 10);
    cinzel(ctx, 9.5, INK.ashDim, { spacing: 1.4 });
    ctx.fillText(side === 'player' ? 'PRESS B' : 'SEALED', spot.cx, spot.cy + 12);
    resetSpacing(ctx);
  }
}

export function hearthNumeral(index) {
  return HEARTH_NUMERALS[index];
}
