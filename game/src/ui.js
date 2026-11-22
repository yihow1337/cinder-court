// Shared drawing primitives: the rounded plates, the two display faces and the little
// shapes (pips, arrows, sigils) that the table, the HUD and the end screens all use.

import { INK } from './config.js';

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A dark lacquered panel with a hairline rule, the court's furniture. */
export function plate(ctx, x, y, w, h, { fill = 'rgba(14,9,7,0.74)', stroke = 'rgba(246,201,87,0.30)', radius = 10, lineWidth = 1.5 } = {}) {
  ctx.save();
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, radius);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/** Heavy display numerals and shouts. */
export function anton(ctx, size, fill, align = 'center', baseline = 'middle') {
  ctx.font = `${size}px Anton, Impact, sans-serif`;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.letterSpacing = '0px';
}

/** Engraved serif for names, rules and labels. */
export function cinzel(ctx, size, fill, { align = 'center', baseline = 'middle', spacing = 2, weight = 600 } = {}) {
  ctx.font = `${weight} ${size}px Cinzel, Georgia, serif`;
  ctx.fillStyle = fill;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.letterSpacing = `${spacing}px`;
}

export function resetSpacing(ctx) {
  ctx.letterSpacing = '0px';
}

/** A warm pool of lantern light. */
export function lightPool(ctx, cx, cy, radius, color, strength = 0.5) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = grad;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
}

/** One life pip: a small flame, solid while held, hollow once spent. */
export function lifePip(ctx, x, y, size, held, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.bezierCurveTo(size * 0.82, -size * 0.2, size * 0.7, size, 0, size);
  ctx.bezierCurveTo(-size * 0.7, size, -size * 0.82, -size * 0.2, 0, -size);
  ctx.closePath();
  if (held) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(142,123,102,0.75)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();
}

export function triangle(ctx, x, y, size, direction, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.beginPath();
  if (direction === 'up') {
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.86, size * 0.6);
    ctx.lineTo(-size * 0.86, size * 0.6);
  } else {
    ctx.moveTo(0, size);
    ctx.lineTo(size * 0.86, -size * 0.6);
    ctx.lineTo(-size * 0.86, -size * 0.6);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * A suitor's sigil: a crowned medallion. The rival's is a waning crescent in cold ash,
 * yours is a standing flame in gold, so the two sides are told apart without a word.
 */
export function suitorSigil(ctx, side, cx, cy, size, options = {}) {
  const ring = options.ring ?? (side === 'player' ? INK.gold : INK.cold);
  const inner = options.inner ?? (side === 'player' ? INK.lantern : INK.coldDeep);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(10,7,6,0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = ring;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.92, 0, Math.PI * 2);
  ctx.stroke();
  // crown spikes
  ctx.fillStyle = ring;
  for (const angle of [-Math.PI / 2, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62]) {
    ctx.save();
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.34);
    ctx.lineTo(size * 0.17, -size * 0.86);
    ctx.lineTo(-size * 0.17, -size * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = inner;
  if (side === 'player') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.62);
    ctx.bezierCurveTo(size * 0.52, -size * 0.1, size * 0.4, size * 0.56, 0, size * 0.56);
    ctx.bezierCurveTo(-size * 0.4, size * 0.56, -size * 0.52, -size * 0.1, 0, -size * 0.62);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.56, Math.PI * 0.55, Math.PI * 2.45);
    ctx.arc(size * 0.16, -size * 0.06, size * 0.42, Math.PI * 2.4, Math.PI * 0.6, true);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
