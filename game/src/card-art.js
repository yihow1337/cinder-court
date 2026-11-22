// One card, drawn. The face is a pale vellum panel with a crest-coloured border, a rank
// numeral filling the top half and the crest silhouette filling the bottom, so rank and
// crest both survive being shrunk to a thumbnail. Won and lost cards are retinted, never
// relabelled: gold rim for a taken hearth, cold ash scrim for a lost one.

import { CARD, INK } from './config.js';
import { CRESTS, drawCrest } from './crests.js';

const W = CARD.w;
const H = CARD.h;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Put the canvas into a card's local space: -74..74 by -104..104. */
function enterCard(ctx, view) {
  const flipAngle = (1 - (view.face ?? 1)) * Math.PI;
  const squeeze = Math.max(0.02, Math.abs(Math.cos(flipAngle)));
  const pop = 1 + (view.pop ?? 0) * 0.055;
  ctx.save();
  ctx.translate(view.x, view.y);
  ctx.rotate(view.rot ?? 0);
  ctx.scale(view.scale * squeeze * pop, view.scale * pop);
  return (view.face ?? 1) >= 0.5;
}

function dropShadow(ctx, lift) {
  ctx.save();
  ctx.globalAlpha = 0.46;
  ctx.fillStyle = '#000';
  ctx.filter = 'blur(0px)';
  roundRect(ctx, -W / 2 + 4, -H / 2 + 10 + lift, W, H, CARD.radius);
  ctx.fill();
  ctx.restore();
}

export function drawCard(ctx, card, view, state = {}) {
  const faceUp = enterCard(ctx, view);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.62)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 9;
  dropShadow(ctx, state.lifted ? 6 : 0);
  ctx.restore();
  if (faceUp) drawFace(ctx, card, view, state);
  else drawBack(ctx);
  ctx.restore();
}

function drawFace(ctx, card, view, state) {
  const crest = CRESTS[card.crest];

  // vellum panel
  const grad = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
  grad.addColorStop(0, '#fdf4e2');
  grad.addColorStop(0.55, INK.vellum);
  grad.addColorStop(1, INK.vellumShade);
  ctx.fillStyle = grad;
  roundRect(ctx, -W / 2, -H / 2, W, H, CARD.radius);
  ctx.fill();

  // crest-coloured border, double ruled
  ctx.lineWidth = CARD.border;
  ctx.strokeStyle = crest.color;
  roundRect(ctx, -W / 2 + CARD.border / 2, -H / 2 + CARD.border / 2, W - CARD.border, H - CARD.border, CARD.radius - 2);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = crest.deep;
  roundRect(ctx, -W / 2 + CARD.border + 3, -H / 2 + CARD.border + 3, W - CARD.border * 2 - 6, H - CARD.border * 2 - 6, 7);
  ctx.stroke();

  // the rank, filling the top half
  ctx.fillStyle = INK.vellumInk;
  ctx.font = '118px Anton, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(card.rank), 0, -44);

  // rule between rank and crest
  ctx.strokeStyle = crest.color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-42, 3);
  ctx.lineTo(42, 3);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // the crest, filling the bottom half
  ctx.save();
  ctx.translate(0, 46);
  drawCrest(ctx, card.crest, 84, crest.color);
  ctx.restore();

  // crest name, a third cue after colour and shape
  ctx.fillStyle = crest.deep;
  ctx.font = '700 15px Cinzel, serif';
  ctx.letterSpacing = '3px';
  ctx.fillText(crest.name, 0, H / 2 - 17);
  ctx.letterSpacing = '0px';

  if (state.outcome === 'lost') drawLostScrim(ctx);
  if (state.outcome === 'won') drawWonRim(ctx, view);
  if (state.selected) drawSelectRim(ctx);
  if (state.flared) drawFlareMark(ctx, crest);
  if ((view.glow ?? 0) > 0.01) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.85, view.glow);
    ctx.lineWidth = 6;
    ctx.strokeStyle = crest.bright;
    roundRect(ctx, -W / 2 - 3, -H / 2 - 3, W + 6, H + 6, CARD.radius + 3);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLostScrim(ctx) {
  ctx.save();
  roundRect(ctx, -W / 2, -H / 2, W, H, CARD.radius);
  ctx.fillStyle = 'rgba(16,24,34,0.58)';
  ctx.fill();
  ctx.strokeStyle = INK.coldDeep;
  ctx.lineWidth = 5;
  roundRect(ctx, -W / 2 + 3, -H / 2 + 3, W - 6, H - 6, CARD.radius - 2);
  ctx.stroke();
  // a cold slash across the face: no words needed
  ctx.strokeStyle = 'rgba(157,185,212,0.85)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-W / 2 + 16, H / 2 - 16);
  ctx.lineTo(W / 2 - 16, -H / 2 + 16);
  ctx.stroke();
  ctx.restore();
}

function drawWonRim(ctx, view) {
  ctx.save();
  ctx.shadowColor = INK.gold;
  ctx.shadowBlur = 22;
  ctx.strokeStyle = INK.gold;
  ctx.lineWidth = 6;
  roundRect(ctx, -W / 2 + 2, -H / 2 + 2, W - 4, H - 4, CARD.radius - 1);
  ctx.stroke();
  ctx.stroke();
  ctx.restore();
  // a gold crown wedge at the top edge
  ctx.save();
  ctx.fillStyle = INK.gold;
  ctx.beginPath();
  ctx.moveTo(0, -H / 2 - 13);
  ctx.lineTo(16, -H / 2 + 5);
  ctx.lineTo(-16, -H / 2 + 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSelectRim(ctx) {
  ctx.save();
  ctx.strokeStyle = INK.gold;
  ctx.lineWidth = 5;
  ctx.setLineDash([14, 9]);
  roundRect(ctx, -W / 2 - 5, -H / 2 - 5, W + 10, H + 10, CARD.radius + 4);
  ctx.stroke();
  ctx.restore();
}

function drawFlareMark(ctx, crest) {
  ctx.save();
  ctx.translate(-W / 2 + 22, -H / 2 + 22);
  ctx.fillStyle = crest.color;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  drawCrest(ctx, crest.id, 17, '#fdf4e2');
  ctx.restore();
}

export function drawBack(ctx) {
  const grad = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
  grad.addColorStop(0, '#3a1d12');
  grad.addColorStop(1, '#1b0f0a');
  ctx.fillStyle = grad;
  roundRect(ctx, -W / 2, -H / 2, W, H, CARD.radius);
  ctx.fill();
  ctx.strokeStyle = INK.goldDeep;
  ctx.lineWidth = 5;
  roundRect(ctx, -W / 2 + 3, -H / 2 + 3, W - 6, H - 6, CARD.radius - 2);
  ctx.stroke();
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = INK.lantern;
  ctx.lineWidth = 2;
  for (const r of [26, 40]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  const marks = ['ash', 'tide', 'thorn', 'bell'];
  marks.forEach((id, i) => {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(Math.cos(angle) * 56, Math.sin(angle) * 56);
    drawCrest(ctx, id, 26, CRESTS[id].color);
    ctx.restore();
  });
  ctx.save();
  ctx.translate(0, 0);
  drawCrest(ctx, 'ash', 34, INK.gold);
  ctx.restore();
}

export function drawCardBackAt(ctx, view) {
  enterCard(ctx, { ...view, face: 0 });
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  dropShadow(ctx, 0);
  ctx.restore();
  drawBack(ctx);
  ctx.restore();
}

/** A card-shaped empty slot, for a hearth nobody has claimed yet. */
export function drawEmptySlot(ctx, pose, tint, dashed = true) {
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.scale(pose.scale, pose.scale);
  ctx.strokeStyle = tint;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([11, 10]);
  roundRect(ctx, -W / 2, -H / 2, W, H, CARD.radius);
  ctx.stroke();
  ctx.restore();
}
