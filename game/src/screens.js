// The three screens that are not the table: the title card, the victory and the defeat.
// Each one is built to read at a glance -- two lines of enormous type, one dominant
// colour (gold for a win, cold ash-blue for a loss) and both life totals in numerals.

import { INK, LIFE_START, RIVAL_NAME, RIVAL_TITLE, PLAYER_NAME, VIEW } from './config.js';
import { CREST_IDS, CRESTS, drawCrest } from './crests.js';
import { drawCard } from './card-art.js';
import { drawBackdrop } from './render.js';
import { drawEmbers, drawRisingColumn } from './particles.js';
import { anton, cinzel, lifePip, lightPool, plate, resetSpacing, suitorSigil } from './ui.js';

const TITLE_FAN = [
  { id: 'bell-3', crest: 'bell', rank: 3 },
  { id: 'tide-4', crest: 'tide', rank: 4 },
  { id: 'ash-6', crest: 'ash', rank: 6 },
  { id: 'thorn-5', crest: 'thorn', rank: 5 },
  { id: 'ash-2', crest: 'ash', rank: 2 },
];

/** One crest struck as a coin: dark disc, crest-coloured ring, the silhouette inside. */
function crestMedallion(ctx, id, cx, cy, r) {
  const crest = CRESTS[id];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = crest.color;
  ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(12,8,6,0.92)';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = crest.color;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = crest.deep;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, r - 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  drawCrest(ctx, id, r * 1.42, crest.color);
  ctx.restore();
}

/** A rule set in a lacquered chip, so the law reads as an emblem and not a caption. */
function ruleChip(ctx, text, cx, cy) {
  cinzel(ctx, 18, '#ffe3a6', { spacing: 2.6, weight: 700 });
  const w = ctx.measureText(text).width + 40;
  plate(ctx, cx - w / 2, cy - 19, w, 38, {
    fill: 'rgba(10,7,5,0.9)',
    stroke: 'rgba(246,201,87,0.62)',
    lineWidth: 1.8,
    radius: 8,
  });
  cinzel(ctx, 18, '#ffe3a6', { spacing: 2.6, weight: 700 });
  ctx.fillText(text, cx, cy + 1);
  resetSpacing(ctx);
  return w;
}

export function drawTitleScreen(ctx, scene) {
  drawBackdrop(ctx, scene);
  lightPool(ctx, VIEW.w / 2, 210, 560, 'rgba(255,170,80,0.55)', 0.5);
  // a second pool at the foot, so the fanned hand lies on a lit table rather than in air
  lightPool(ctx, VIEW.w / 2, 640, 520, 'rgba(255,146,54,0.42)', 0.42);

  // wordmark, two lines so it stays huge
  ctx.save();
  ctx.shadowColor = 'rgba(255,150,60,0.8)';
  ctx.shadowBlur = 46;
  cinzel(ctx, 128, INK.gold, { spacing: 16 });
  ctx.fillText('CINDER', VIEW.w / 2 + 8, 112);
  cinzel(ctx, 128, '#ffe6a8', { spacing: 16 });
  ctx.fillText('COURT', VIEW.w / 2 + 8, 228);
  ctx.restore();
  resetSpacing(ctx);

  ctx.save();
  ctx.strokeStyle = 'rgba(246,201,87,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(VIEW.w / 2 - 300, 288);
  ctx.lineTo(VIEW.w / 2 + 300, 288);
  ctx.stroke();
  ctx.restore();

  cinzel(ctx, 19, INK.ash, { spacing: 4 });
  ctx.fillText('TWO SUITORS  ·  THREE HEARTHS  ·  AN OPEN COURT', VIEW.w / 2, 312);
  resetSpacing(ctx);

  // the four crests struck as coins: colour and shape first, the name only third
  const spacing = 150;
  CREST_IDS.forEach((id, i) => {
    const cx = VIEW.w / 2 + (i - 1.5) * spacing;
    crestMedallion(ctx, id, cx, 372, 44);
    cinzel(ctx, 17, CRESTS[id].bright, { spacing: 4.5 });
    ctx.fillText(CRESTS[id].name, cx, 434);
    resetSpacing(ctx);
  });

  // the whole law, in two chips, on one line
  const gap = 18;
  const leftText = 'HIGH RANK TAKES THE HEARTH';
  const rightText = 'SAME CREST BESIDE  ·  STOKED +2';
  cinzel(ctx, 18, '#ffe3a6', { spacing: 2.6, weight: 700 });
  const leftW = ctx.measureText(leftText).width + 40;
  const rightW = ctx.measureText(rightText).width + 40;
  resetSpacing(ctx);
  const total = leftW + gap + rightW;
  ruleChip(ctx, leftText, VIEW.w / 2 - total / 2 + leftW / 2, 464);
  ruleChip(ctx, rightText, VIEW.w / 2 + total / 2 - rightW / 2, 464);

  // a real hand, fanned across the foot of the court
  TITLE_FAN.forEach((card, i) => {
    const spread = i - (TITLE_FAN.length - 1) / 2;
    const view = {
      x: VIEW.w / 2 + spread * 115,
      y: 616 + Math.abs(spread) * 4 + Math.sin(scene.time * 1.4 + i) * 2,
      scale: 0.68,
      rot: spread * 0.075,
      face: 1,
    };
    drawCard(ctx, card, view, {});
  });

  const pulse = 0.62 + 0.38 * (1 + Math.sin(scene.time * 3)) * 0.5;
  ctx.save();
  ctx.globalAlpha = pulse;
  plate(ctx, VIEW.w / 2 - 216, 494, 432, 46, { fill: 'rgba(12,8,6,0.88)', stroke: INK.gold, lineWidth: 2.4, radius: 10 });
  anton(ctx, 29, INK.gold);
  ctx.fillText('PRESS ENTER OR CLICK TO DEAL', VIEW.w / 2, 518);
  ctx.restore();
}

// --- end screens -----------------------------------------------------------

export function drawEndScreen(ctx, scene, won) {
  const shared = scene.table.outcome && scene.table.outcome.winner === 'shared';
  const accent = won ? INK.gold : INK.cold;
  const deep = won ? '#2a1304' : '#0b131d';
  const headline = shared ? ['A SHARED', 'EMBER'] : won ? ['THE COURT', 'IS YOURS'] : ['THE EMBERS', 'DIE'];

  // dominant colour wash, different for win and loss
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW.h);
  grad.addColorStop(0, won ? '#190c04' : '#07090d');
  grad.addColorStop(0.5, deep);
  grad.addColorStop(1, won ? '#140a04' : '#05070a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);

  drawRisingColumn(ctx, scene.column, scene.time, won ? '#ffb15c' : '#4e6a86', won ? '#ff7f33' : '#8fa8c0');
  lightPool(ctx, VIEW.w / 2, won ? 180 : 420, 620, won ? 'rgba(255,175,80,0.6)' : 'rgba(120,160,200,0.34)', won ? 0.55 : 0.4);

  const snap = scene.flourish ? Math.min(1, scene.flourish.snap) : 1;
  const grow = 1 + (1 - snap) * 0.14;

  ctx.save();
  ctx.translate(VIEW.w / 2, 0);
  ctx.scale(grow, grow);
  ctx.shadowColor = won ? 'rgba(255,160,60,0.9)' : 'rgba(120,170,220,0.7)';
  ctx.shadowBlur = won ? 50 : 34;
  cinzel(ctx, 112, accent, { spacing: 10 });
  ctx.fillText(headline[0], 0, 118);
  cinzel(ctx, 112, won ? '#fff0c4' : '#d7e6f5', { spacing: 10 });
  ctx.fillText(headline[1], 0, 236);
  ctx.restore();
  resetSpacing(ctx);

  cinzel(ctx, 20, won ? '#ffd98a' : '#a9c3db', { spacing: 5 });
  ctx.fillText(endingLine(scene.table, won), VIEW.w / 2, 306);
  resetSpacing(ctx);

  drawSuitorPanel(ctx, scene, 'player', 286, shared || won);
  drawSuitorPanel(ctx, scene, 'rival', 994, shared || !won);

  drawFinalClash(ctx, scene, accent);

  const pulse = 0.55 + 0.45 * (1 + Math.sin(scene.time * 3)) * 0.5;
  ctx.save();
  ctx.globalAlpha = pulse;
  anton(ctx, 26, accent);
  ctx.fillText('PRESS R OR CLICK FOR A REMATCH', VIEW.w / 2, 688);
  ctx.restore();

  if (won) drawEmbers(ctx, scene.burst);
}

function endingLine(table, won) {
  const outcome = table.outcome;
  if (outcome && outcome.winner === 'shared') return 'THE DECK IS SPENT AND NEITHER COURT FALLS';
  if (outcome && outcome.reason === 'embers-spent') {
    return won ? 'THE EMBERS RAN OUT AND YOURS BURNED BRIGHTER' : 'THE EMBERS RAN OUT AND HERS BURNED BRIGHTER';
  }
  return won ? "VESPER'S LAST EMBER IS OUT" : 'YOUR LAST EMBER IS OUT';
}

function drawSuitorPanel(ctx, scene, side, cx, triumphant) {
  const life = scene.table.life[side];
  const accent = triumphant ? (side === 'player' ? INK.gold : INK.cold) : INK.ashDim;
  const dead = life <= 0;
  ctx.save();
  // the beaten suitor is dimmed, never hidden: the losing total has to stay readable
  ctx.globalAlpha = triumphant ? 1 : 0.76;

  plate(ctx, cx - 164, 344, 328, 284, {
    fill: triumphant ? (side === 'player' ? 'rgba(42,22,6,0.84)' : 'rgba(10,18,28,0.84)') : 'rgba(8,8,10,0.7)',
    stroke: accent,
    lineWidth: triumphant ? 2.8 : 1.4,
    radius: 14,
  });

  if (triumphant) {
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 34;
    suitorSigil(ctx, side, cx, 392, 34, { ring: accent });
    ctx.restore();
  } else {
    suitorSigil(ctx, side, cx, 392, 30, { ring: '#6b5d4c', inner: '#3a332b' });
  }

  cinzel(ctx, 22, accent, { spacing: 5 });
  ctx.fillText(side === 'player' ? PLAYER_NAME : RIVAL_NAME, cx, 444);
  cinzel(ctx, 11, INK.ashDim, { spacing: 2.4 });
  ctx.fillText(side === 'player' ? 'SUITOR OF EMBERS' : RIVAL_TITLE, cx, 464);
  resetSpacing(ctx);

  // the numeral owns its own band: glow included, it never reaches the label beneath.
  // A spent suitor is dimmed everywhere except the nought itself, which burns at full
  // strength -- it is the one number that has to survive being shrunk to a thumbnail.
  ctx.save();
  if (dead) ctx.globalAlpha = 1;
  anton(ctx, 116, dead ? '#ff6b4b' : accent);
  ctx.shadowColor = dead ? '#ff3b1e' : accent;
  ctx.shadowBlur = dead ? 44 : 24;
  ctx.fillText(String(life), cx, 540);
  ctx.fillText(String(life), cx, 540);
  if (dead) ctx.fillText(String(life), cx, 540);
  ctx.restore();
  cinzel(ctx, 12, dead ? INK.blood : INK.ash, { spacing: 4 });
  ctx.fillText(dead ? 'NO LIFE LEFT' : 'LIFE', cx, 596);
  resetSpacing(ctx);

  const step = 23;
  for (let i = 0; i < LIFE_START; i += 1) {
    lifePip(ctx, cx - (LIFE_START - 1) * step * 0.5 + i * step, 612, 8.5, i < life, dead ? INK.blood : accent);
  }
  ctx.restore();
}

/** The two cards that ended it, between the two suitors, with the blow they struck. */
function drawFinalClash(ctx, scene, accent) {
  const event = scene.table.lastEvent;
  if (!event) return;
  const cx = VIEW.w / 2;
  const cy = 500;
  cinzel(ctx, 14, INK.ash, { spacing: 4 });
  ctx.fillText('THE LAST CLASH', cx, 376);
  resetSpacing(ctx);

  const winnerIsPlayer = event.winner === 'player';
  drawCard(ctx, event.winCard, { x: cx - 104, y: cy, scale: 0.95, rot: -0.08, face: 1, glow: 0.8 }, { outcome: 'won' });
  drawCard(ctx, event.loseCard, { x: cx + 104, y: cy, scale: 0.95, rot: 0.08, face: 1 }, { outcome: 'lost' });

  // The blow sits in the seam between the two cards; the stoke rides under them, so
  // neither badge covers the crest that won the hearth.
  plate(ctx, cx - 52, cy - 40, 104, 60, {
    fill: winnerIsPlayer ? 'rgba(62,34,6,0.97)' : 'rgba(14,20,29,0.97)',
    stroke: accent,
    lineWidth: 3,
    radius: 10,
  });
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  anton(ctx, 44, accent);
  ctx.fillText(`-${event.damage}`, cx, cy - 9);
  ctx.restore();
  if (event.stoked) {
    const crest = CRESTS[event.winCard.crest];
    const top = cy + 110;
    ctx.save();
    ctx.shadowColor = crest.color;
    ctx.shadowBlur = 20;
    plate(ctx, cx - 86, top, 172, 44, {
      fill: crest.color,
      stroke: 'rgba(0,0,0,0.45)',
      radius: 9,
      lineWidth: 1.6,
    });
    ctx.restore();
    ctx.save();
    ctx.translate(cx - 58, top + 22);
    drawCrest(ctx, event.winCard.crest, 28, '#1a110a');
    ctx.restore();
    anton(ctx, 28, '#1a110a', 'left');
    ctx.fillText('STOKED', cx - 40, top + 23);
  }
}
