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

export function drawTitleScreen(ctx, scene) {
  drawBackdrop(ctx, scene);
  lightPool(ctx, VIEW.w / 2, 250, 560, 'rgba(255,170,80,0.55)', 0.5);

  // wordmark, two lines so it stays huge
  ctx.save();
  ctx.shadowColor = 'rgba(255,150,60,0.8)';
  ctx.shadowBlur = 46;
  cinzel(ctx, 128, INK.gold, { spacing: 16 });
  ctx.fillText('CINDER', VIEW.w / 2 + 8, 136);
  cinzel(ctx, 128, '#ffe6a8', { spacing: 16 });
  ctx.fillText('COURT', VIEW.w / 2 + 8, 262);
  ctx.restore();
  resetSpacing(ctx);

  ctx.save();
  ctx.strokeStyle = 'rgba(246,201,87,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(VIEW.w / 2 - 300, 318);
  ctx.lineTo(VIEW.w / 2 + 300, 318);
  ctx.stroke();
  ctx.restore();

  cinzel(ctx, 19, INK.ash, { spacing: 4 });
  ctx.fillText('TWO SUITORS  ·  THREE HEARTHS  ·  AN OPEN COURT', VIEW.w / 2, 344);
  resetSpacing(ctx);

  // the four crests, by colour and by shape, flanking the call to play
  const spacing = 132;
  CREST_IDS.forEach((id, i) => {
    const cx = VIEW.w / 2 + (i - 1.5) * spacing;
    const cy = 404;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = CRESTS[id].color;
    ctx.shadowBlur = 26;
    drawCrest(ctx, id, 78, CRESTS[id].color);
    ctx.restore();
    cinzel(ctx, 15, CRESTS[id].bright, { spacing: 4 });
    ctx.fillText(CRESTS[id].name, cx, cy + 58);
    resetSpacing(ctx);
  });

  cinzel(ctx, 16, '#ffd98a', { spacing: 2.4 });
  ctx.fillText('HIGH RANK TAKES THE HEARTH  ·  A TIE GOES TO THE CYCLE', VIEW.w / 2, 472);
  ctx.fillText('THE SAME CREST ON THE HEARTH BESIDE IT IS STOKED  +2', VIEW.w / 2, 494);
  resetSpacing(ctx);

  // a real hand, fanned across the foot of the court
  TITLE_FAN.forEach((card, i) => {
    const spread = i - (TITLE_FAN.length - 1) / 2;
    const view = {
      x: VIEW.w / 2 + spread * 126,
      y: 646 + Math.sin(scene.time * 1.4 + i) * 3,
      scale: 0.72,
      rot: spread * 0.095,
      face: 1,
    };
    drawCard(ctx, card, view, {});
  });

  const pulse = 0.62 + 0.38 * (1 + Math.sin(scene.time * 3)) * 0.5;
  ctx.save();
  ctx.globalAlpha = pulse;
  plate(ctx, VIEW.w / 2 - 216, 514, 432, 50, { fill: 'rgba(12,8,6,0.88)', stroke: INK.gold, lineWidth: 2.4, radius: 10 });
  anton(ctx, 30, INK.gold);
  ctx.fillText('PRESS ENTER OR CLICK TO DEAL', VIEW.w / 2, 540);
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
  ctx.globalAlpha = triumphant ? 1 : 0.62;

  plate(ctx, cx - 164, 352, 328, 268, {
    fill: triumphant ? (side === 'player' ? 'rgba(42,22,6,0.84)' : 'rgba(10,18,28,0.84)') : 'rgba(8,8,10,0.7)',
    stroke: accent,
    lineWidth: triumphant ? 2.8 : 1.4,
    radius: 14,
  });

  if (triumphant) {
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = 34;
    suitorSigil(ctx, side, cx, 406, 36, { ring: accent });
    ctx.restore();
  } else {
    suitorSigil(ctx, side, cx, 406, 32, { ring: '#6b5d4c', inner: '#3a332b' });
  }

  cinzel(ctx, 21, accent, { spacing: 5 });
  ctx.fillText(side === 'player' ? PLAYER_NAME : RIVAL_NAME, cx, 462);
  cinzel(ctx, 9.5, INK.ashDim, { spacing: 2.2 });
  ctx.fillText(side === 'player' ? 'SUITOR OF EMBERS' : RIVAL_TITLE, cx, 482);
  resetSpacing(ctx);

  anton(ctx, 88, dead ? INK.blood : accent);
  ctx.save();
  ctx.shadowColor = dead ? INK.blood : accent;
  ctx.shadowBlur = 26;
  ctx.fillText(String(life), cx, 546);
  ctx.restore();
  cinzel(ctx, 10.5, INK.ashDim, { spacing: 4 });
  ctx.fillText(dead ? 'NO LIFE LEFT' : 'LIFE', cx, 588);
  resetSpacing(ctx);

  const step = 23;
  for (let i = 0; i < LIFE_START; i += 1) {
    lifePip(ctx, cx - (LIFE_START - 1) * step * 0.5 + i * step, 604, 7, i < life, dead ? INK.blood : accent);
  }
  ctx.restore();
}

/** The two cards that ended it, between the two suitors, with the blow they struck. */
function drawFinalClash(ctx, scene, accent) {
  const event = scene.table.lastEvent;
  if (!event) return;
  const cx = VIEW.w / 2;
  const cy = 482;
  cinzel(ctx, 11, INK.ashDim, { spacing: 3.4 });
  ctx.fillText('THE LAST CLASH', cx, 402);
  resetSpacing(ctx);

  const winnerIsPlayer = event.winner === 'player';
  drawCard(ctx, event.winCard, { x: cx - 82, y: cy, scale: 0.7, rot: -0.08, face: 1 }, { outcome: 'won' });
  drawCard(ctx, event.loseCard, { x: cx + 82, y: cy, scale: 0.7, rot: 0.08, face: 1 }, { outcome: 'lost' });

  plate(ctx, cx - 36, cy - 22, 72, 44, {
    fill: winnerIsPlayer ? 'rgba(62,34,6,0.97)' : 'rgba(14,20,29,0.97)',
    stroke: accent,
    lineWidth: 2.4,
    radius: 8,
  });
  anton(ctx, 30, accent);
  ctx.fillText(`-${event.damage}`, cx, cy + 1);
  if (event.stoked) {
    plate(ctx, cx - 54, cy + 28, 108, 28, {
      fill: CRESTS[event.winCard.crest].color,
      stroke: 'rgba(0,0,0,0.4)',
      radius: 6,
      lineWidth: 1.4,
    });
    anton(ctx, 18, '#1a110a');
    ctx.fillText('STOKED', cx, cy + 43);
  }
}
