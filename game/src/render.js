// Draws the court: the lantern-lit table and its three hearths, every card in play, the
// verdict badge in the seam where two cards clash, the rival's tell, and then the HUD.

import { CARD, DRESS, HEARTH_COUNT, HEARTH_NUMERALS, INK, SCALE, VIEW, ZONE } from './config.js';
import { CRESTS, drawCrest } from './crests.js';
import { drawCard, drawEmptySlot } from './card-art.js';
import { drawEmbers, drawMotes } from './particles.js';
import { drawHud } from './hud.js';
import { ensureView } from './animate.js';
import { hearthSlot } from './layout.js';
import { openHearths } from './rules.js';
import { anton, cinzel, lightPool, plate, resetSpacing, roundRect, triangle } from './ui.js';

export function drawScene(ctx, scene) {
  drawBackdrop(ctx, scene);
  drawHearths(ctx, scene);
  drawTells(ctx, scene);
  drawPlayedCards(ctx, scene);
  drawVerdicts(ctx, scene);
  drawHands(ctx, scene);
  drawHud(ctx, scene);
  drawEmbers(ctx, scene.burst);
  drawVignette(ctx);
}

// --- the table itself ------------------------------------------------------

export function drawBackdrop(ctx, scene) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  grad.addColorStop(0, '#0b0706');
  grad.addColorStop(0.42, INK.table);
  grad.addColorStop(0.62, '#241409');
  grad.addColorStop(1, '#0a0605');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  // the long table: a band of burnt umber the hearths sit on
  ctx.save();
  const band = ctx.createLinearGradient(0, 150, 0, 560);
  band.addColorStop(0, 'rgba(74,38,20,0.0)');
  band.addColorStop(0.5, 'rgba(104,54,26,0.66)');
  band.addColorStop(1, 'rgba(40,20,11,0.0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 150, VIEW.w, 410);
  ctx.restore();

  lightPool(ctx, VIEW.w / 2, ZONE.hearthSeamY, 560, 'rgba(255,164,78,0.5)', 0.42);
  lightPool(ctx, VIEW.w / 2, 60, 420, 'rgba(255,150,70,0.22)', 0.3);
  drawMotes(ctx, scene.motes, scene.time);
}

function hearthHeat(scene, index) {
  const { table } = scene;
  const hearth = table.hearths[index];
  let heat = 0.5;
  if (hearth.player || hearth.rival) heat += 0.2;
  if (hearth.event) heat += hearth.event.stoked ? 0.72 : 0.3;
  if (scene.selection !== null && scene.selection !== undefined && !hearth.player) heat += 0.35;
  if (scene.hover && scene.hover.kind === 'hearth' && scene.hover.index === index) heat += 0.4;
  return heat;
}

export function drawHearths(ctx, scene) {
  const legal = scene.table.phase === 'player' ? openHearths(scene.table, 'player') : [];
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    const cx = ZONE.hearthCentersX[i];
    const heat = hearthHeat(scene, i);
    const flicker = 1 + Math.sin(scene.time * 2.4 + i * 1.7) * 0.05;

    lightPool(ctx, cx, ZONE.hearthSeamY, 176 * flicker, 'rgba(255,146,54,0.6)', 0.28 * heat);

    // the stone plate the two cards meet over
    ctx.save();
    ctx.translate(cx, ZONE.hearthSeamY);
    ctx.fillStyle = 'rgba(34,18,10,0.78)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 126, 74, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(246,201,87,${0.2 + heat * 0.2})`;
    ctx.lineWidth = DRESS.rails ? 1.6 : 2.2;
    ctx.stroke();
    ctx.restore();

    const open = legal.includes(i);
    const playerCard = scene.table.hearths[i].player;
    const rivalCard = scene.table.hearths[i].rival;
    if (!playerCard) {
      const slot = hearthSlot('player', i);
      if (open && !DRESS.rails) {
        // In focus the hearth you can still answer on is the live thing on the table, so
        // its empty slot is struck twice through a gold glow: at thumbnail size a single
        // thin dash reads as a missing card rather than as an invitation.
        ctx.save();
        ctx.shadowColor = INK.gold;
        ctx.shadowBlur = 20;
        drawEmptySlot(ctx, slot, INK.gold);
        drawEmptySlot(ctx, slot, INK.gold);
        ctx.restore();
      } else {
        drawEmptySlot(ctx, slot, open ? INK.gold : 'rgba(142,123,102,0.6)');
      }
      if (open && DRESS.rails) {
        cinzel(ctx, 12, INK.gold, { spacing: 3 });
        ctx.fillText(['Q', 'W', 'E'][i], cx, ZONE.hearthPlayerY + (CARD.h * SCALE.hearth) / 2 + 2);
        resetSpacing(ctx);
      }
    }
    if (!rivalCard) drawEmptySlot(ctx, hearthSlot('rival', i), 'rgba(120,140,165,0.5)');
  }
}

// --- cards -----------------------------------------------------------------

function cardState(scene, card, side, hearthIndex) {
  const event = hearthIndex === undefined ? null : scene.table.hearths[hearthIndex].event;
  const state = { flared: Boolean(card.flared), side };
  if (event) state.outcome = event.winner === side ? 'won' : 'lost';
  return state;
}

export function drawPlayedCards(ctx, scene) {
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    for (const side of ['rival', 'player']) {
      const card = scene.table.hearths[i][side];
      if (card) drawCard(ctx, card, ensureView(card), cardState(scene, card, side, i));
    }
  }
  for (const side of ['player', 'rival']) {
    const banked = scene.table.bank[side];
    if (banked) drawCard(ctx, banked, ensureView(banked), { flared: false });
  }
}

export function drawHands(ctx, scene) {
  scene.table.hands.rival.forEach((card) => drawCard(ctx, card, ensureView(card), {}));
  scene.table.hands.player.forEach((card, index) => {
    const selected = scene.selection === index;
    const hovered = scene.hover && scene.hover.kind === 'hand' && scene.hover.index === index;
    drawCard(ctx, card, ensureView(card), { selected, lifted: selected || hovered });
  });
  // the picked card rides above the rest
  if (scene.selection !== null && scene.selection !== undefined) {
    const card = scene.table.hands.player[scene.selection];
    if (card) drawCard(ctx, card, ensureView(card), { selected: true, lifted: true });
  }
}

// --- verdicts --------------------------------------------------------------

export function drawVerdicts(ctx, scene) {
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    const hearth = scene.table.hearths[i];
    if (hearth.event) drawVerdictBadge(ctx, hearth.event, i, scene.time);
    else drawHearthMark(ctx, i);
  }
}

function drawHearthMark(ctx, index) {
  const s = DRESS.verdict;
  ctx.save();
  ctx.translate(ZONE.hearthCentersX[index], ZONE.hearthSeamY);
  ctx.scale(s, s);
  ctx.fillStyle = 'rgba(8,5,4,0.78)';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(246,201,87,0.4)';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  anton(ctx, 23, 'rgba(246,201,87,0.85)');
  ctx.fillText(HEARTH_NUMERALS[index], 0, 1);
  ctx.restore();
}

/**
 * The verdict sits in the seam where the two cards meet.
 *
 * On the rails that seam is roomy, so the badge is a tall chip. In focus the seam is a
 * narrow band -- it opens below her crest and closes above your rank -- so the badge
 * flattens and widens into exactly that band. It carries the same blow and the same stoke,
 * and it crosses neither numeral, which is the whole point when the court is shrunk to a
 * thumbnail: a verdict that hides a rank costs more than it tells.
 */
function drawVerdictBadge(ctx, event, index, time) {
  const playerWon = event.winner === 'player';
  const accent = playerWon ? INK.gold : INK.cold;
  const band = !DRESS.rails;
  const w = band ? (event.stoked ? 268 : 178) : event.stoked ? 206 : 150;
  const h = band ? 40 : 46;

  ctx.save();
  ctx.translate(ZONE.hearthCentersX[index], ZONE.hearthSeamY);
  ctx.scale(DRESS.verdict, DRESS.verdict);

  ctx.save();
  if (event.stoked) {
    ctx.shadowColor = CRESTS[event.winCard.crest].color;
    ctx.shadowBlur = 22 + Math.sin(time * 6) * 8;
  }
  plate(ctx, -w / 2, -h / 2, w, h, {
    fill: playerWon ? 'rgba(62,34,6,0.95)' : 'rgba(14,20,29,0.95)',
    stroke: accent,
    lineWidth: 2.6,
    radius: 9,
  });
  ctx.restore();

  // an arrow pointing at whoever is bleeding
  triangle(ctx, -w / 2 + (band ? 24 : 20), 0, band ? 12 : 11, playerWon ? 'up' : 'down', playerWon ? INK.cold : INK.gold);

  anton(ctx, band ? 36 : 34, accent, 'left');
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10;
  ctx.fillText(`-${event.damage}`, -w / 2 + (band ? 42 : 36), 1);
  ctx.restore();

  if (event.stoked) {
    const insetX = band ? 16 : 6;
    plate(ctx, insetX, band ? -15 : -16, w / 2 - (band ? 26 : 14), band ? 30 : 32, {
      fill: CRESTS[event.winCard.crest].color,
      stroke: 'rgba(0,0,0,0.5)',
      radius: 6,
      lineWidth: 1.5,
    });
    ctx.save();
    ctx.translate(insetX + (band ? 20 : 18), 0);
    drawCrest(ctx, event.winCard.crest, band ? 26 : 24, '#15100b');
    ctx.restore();
    anton(ctx, band ? 22 : 19, '#1a110a', 'left');
    ctx.fillText('STOKED', insetX + (band ? 38 : 34), 1);
  } else {
    ctx.save();
    ctx.translate(w / 2 - (band ? 32 : 28), 0);
    drawCrest(ctx, event.winCard.crest, band ? 30 : 26, CRESTS[event.winCard.crest].color);
    ctx.restore();
    if (event.byCycle) {
      cinzel(ctx, 9, accent, { spacing: 1.2 });
      ctx.fillText('CYCLE', w / 2 - 28, 22);
      resetSpacing(ctx);
    }
  }
  ctx.restore();
}

// --- the rival's tell ------------------------------------------------------

export function drawTells(ctx, scene) {
  const { table } = scene;
  if (table.tell) drawTell(ctx, scene, table.tell.hearth, table.tell.crest, 1, 'COMMITS HERE');
  else if (scene.intent) drawTell(ctx, scene, scene.intent.hearth, scene.intent.crest, 0.42, 'EYES THIS HEARTH');
}

function drawTell(ctx, scene, index, crestId, strength, label) {
  const crest = CRESTS[crestId];
  const cx = ZONE.hearthCentersX[index];
  const slot = hearthSlot('rival', index);
  const bob = Math.sin(scene.time * 3.4) * 7;
  const s = DRESS.tell;
  if (scene.table.hearths[index].rival) return;

  // a crest-coloured glance washing down the hearth she is reaching for
  const washHalf = ZONE.hearthPlateW / 2 - 6;
  ctx.save();
  const wash = ctx.createLinearGradient(0, ZONE.hearthRivalY - 10, 0, ZONE.hearthSeamY + 30);
  wash.addColorStop(0, hexAlpha(crest.color, 0.46 * strength));
  wash.addColorStop(1, hexAlpha(crest.color, 0));
  ctx.fillStyle = wash;
  roundRect(ctx, cx - washHalf, ZONE.hearthRivalY - 10, washHalf * 2, 220, 18);
  ctx.fill();
  ctx.restore();

  // the hovering ember, just above the slot
  const emberY = ZONE.hearthRivalY - 14 + bob;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(cx, emberY, 0, cx, emberY, 30);
  glow.addColorStop(0, hexAlpha(crest.bright, 0.95 * strength));
  glow.addColorStop(0.4, hexAlpha(crest.color, 0.5 * strength));
  glow.addColorStop(1, hexAlpha(crest.color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 36, emberY - 36, 72, 72);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.65 + 0.35 * strength;
  ctx.translate(cx, emberY);
  drawCrest(ctx, crestId, 24 * s, crest.bright);
  ctx.restore();

  // dashed outline plus the crest she is weighing, drawn inside the empty slot
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.45 * strength;
  ctx.strokeStyle = crest.color;
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -scene.time * 26;
  const w = CARD.w * slot.scale;
  const hh = CARD.h * slot.scale;
  roundRect(ctx, slot.x - w / 2 - 5, slot.y - hh / 2 - 5, w + 10, hh + 10, 16);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.35 + 0.35 * strength;
  ctx.translate(slot.x, slot.y - 34 * s);
  drawCrest(ctx, crestId, 68 * s, crest.color);
  ctx.restore();

  // The tell is the one sentence on the table, so it is set on its own lacquered strip
  // with a crest-coloured rule: the words keep their contrast even against a lit hearth.
  const nameSize = 13.5 * s;
  const lineSize = 11.5 * s;
  const topY = slot.y + 6 * s;
  cinzel(ctx, nameSize, crest.bright, { spacing: 3.2 * s });
  const nameW = ctx.measureText('VESPER').width;
  cinzel(ctx, lineSize, crest.bright, { spacing: 2.4 * s, weight: 700 });
  const lineW = ctx.measureText(label).width;
  const boxW = Math.max(nameW, lineW) + 30 * s;
  const boxH = 46 * s;

  ctx.save();
  ctx.globalAlpha = 0.7 + 0.3 * strength;
  plate(ctx, slot.x - boxW / 2, topY, boxW, boxH, {
    fill: 'rgba(7,5,4,0.88)',
    stroke: crest.color,
    lineWidth: 2.2,
    radius: 9 * s,
  });
  cinzel(ctx, nameSize, crest.bright, { spacing: 3.2 * s });
  ctx.fillText('VESPER', slot.x, topY + 15 * s);
  cinzel(ctx, lineSize, '#f3e7d2', { spacing: 2.4 * s, weight: 700 });
  ctx.fillText(label, slot.x, topY + 33 * s);
  ctx.restore();
  resetSpacing(ctx);
}

function hexAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function drawVignette(ctx) {
  const grad = ctx.createRadialGradient(VIEW.w / 2, VIEW.h / 2, 260, VIEW.w / 2, VIEW.h / 2, 820);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
}
