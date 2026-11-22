// The four crests of the court: colour, name and a bold canvas silhouette each, plus
// the cycle that decides a clash of equal rank. Every crest is told apart twice over,
// by hue and by outline, so a card still reads when the image is shrunk to a thumbnail.

export const CREST_IDS = ['ash', 'tide', 'thorn', 'bell'];

// Each crest beats the next one in this ring when ranks tie:
//   TIDE > ASH > THORN > BELL > TIDE
export const CYCLE_ORDER = ['tide', 'ash', 'thorn', 'bell'];

const CYCLE_BEATS = { tide: 'ash', ash: 'thorn', thorn: 'bell', bell: 'tide' };

export const CRESTS = {
  ash: {
    id: 'ash',
    name: 'ASH',
    color: '#ff7f33',
    bright: '#ffb470',
    deep: '#8c3807',
    draw: drawAsh,
  },
  tide: {
    id: 'tide',
    name: 'TIDE',
    color: '#17909c',
    bright: '#5fd0d8',
    deep: '#064049',
    draw: drawTide,
  },
  thorn: {
    id: 'thorn',
    name: 'THORN',
    color: '#5f9636',
    bright: '#a5d16a',
    deep: '#24420f',
    draw: drawThorn,
  },
  bell: {
    id: 'bell',
    name: 'BELL',
    color: '#8d5cd6',
    bright: '#c39df6',
    deep: '#3d1f6b',
    draw: drawBell,
  },
};

export function crestOf(card) {
  return CRESTS[card.crest];
}

/** True when crest `a` wins a tied-rank clash against crest `b`. */
export function beatsOnTie(a, b) {
  return CYCLE_BEATS[a] === b;
}

export function cycleVictim(crest) {
  return CYCLE_BEATS[crest];
}

/** Draw a crest silhouette centred on (0,0), fitted to a `size` box. */
export function drawCrest(ctx, crestId, size, fill) {
  const crest = CRESTS[crestId];
  ctx.save();
  ctx.scale(size, size);
  ctx.fillStyle = fill ?? crest.color;
  crest.draw(ctx);
  ctx.restore();
}

// --- silhouettes, all drawn inside the unit box -0.5..0.5 ------------------

function drawAsh(ctx) {
  // A rising ember: a flame with a sharp tip, a tongue licking up its left edge and a
  // spark breaking away.
  ctx.beginPath();
  ctx.moveTo(0, -0.54);
  ctx.bezierCurveTo(0.16, -0.3, 0.34, -0.14, 0.34, 0.1);
  ctx.bezierCurveTo(0.34, 0.36, 0.17, 0.52, 0, 0.52);
  ctx.bezierCurveTo(-0.18, 0.52, -0.36, 0.36, -0.36, 0.1);
  ctx.bezierCurveTo(-0.36, -0.08, -0.3, -0.18, -0.26, -0.3);
  ctx.bezierCurveTo(-0.2, -0.16, -0.12, -0.06, -0.06, -0.16);
  ctx.bezierCurveTo(-0.02, -0.26, -0.02, -0.4, 0, -0.54);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.3, -0.42, 0.085, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The outline of one disc with another bitten out of it, traced through the two points
 * where they cross so the crescent keeps sharp horns at any size.
 */
function crescentPath(ctx, ox, oy, radius, cx, cy, bite) {
  const dx = cx - ox;
  const dy = cy - oy;
  const d = Math.hypot(dx, dy);
  const along = (d * d - bite * bite + radius * radius) / (2 * d);
  const half = Math.sqrt(Math.max(0, radius * radius - along * along));
  const mx = ox + (along * dx) / d;
  const my = oy + (along * dy) / d;
  const px = -dy / d;
  const py = dx / d;
  const horn1 = { x: mx + half * px, y: my + half * py };
  const horn2 = { x: mx - half * px, y: my - half * py };
  ctx.beginPath();
  ctx.arc(ox, oy, radius, Math.atan2(horn2.y - oy, horn2.x - ox), Math.atan2(horn1.y - oy, horn1.x - ox), true);
  ctx.arc(cx, cy, bite, Math.atan2(horn1.y - cy, horn1.x - cx), Math.atan2(horn2.y - cy, horn2.x - cx), false);
  ctx.closePath();
}

function drawTide(ctx) {
  // A sickle crescent riding a rolling wave.
  crescentPath(ctx, -0.06, -0.16, 0.38, 0.24, -0.26, 0.38);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.5, 0.26);
  ctx.bezierCurveTo(-0.32, 0.08, -0.18, 0.42, 0.0, 0.3);
  ctx.bezierCurveTo(0.18, 0.18, 0.32, 0.42, 0.5, 0.26);
  ctx.lineTo(0.5, 0.46);
  ctx.bezierCurveTo(0.32, 0.62, 0.18, 0.38, 0.0, 0.5);
  ctx.bezierCurveTo(-0.18, 0.62, -0.32, 0.28, -0.5, 0.46);
  ctx.closePath();
  ctx.fill();
}

function drawThorn(ctx) {
  // A barbed leaf: a lance-shaped blade with three thorns down each edge.
  ctx.beginPath();
  ctx.moveTo(0, -0.5);
  ctx.bezierCurveTo(0.26, -0.22, 0.3, 0.14, 0, 0.5);
  ctx.bezierCurveTo(-0.3, 0.14, -0.26, -0.22, 0, -0.5);
  ctx.closePath();
  ctx.fill();
  const barbs = [
    [-0.24, 0.2],
    [-0.02, 0.26],
    [0.2, 0.3],
  ];
  for (const [y, reach] of barbs) {
    ctx.beginPath();
    ctx.moveTo(0.12, y - 0.07);
    ctx.lineTo(reach + 0.14, y - 0.2);
    ctx.lineTo(0.16, y + 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-0.12, y - 0.07);
    ctx.lineTo(-reach - 0.14, y - 0.2);
    ctx.lineTo(-0.16, y + 0.08);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBell(ctx) {
  // A hanging court bell with a flared rim and a clapper.
  ctx.beginPath();
  ctx.moveTo(-0.08, -0.5);
  ctx.lineTo(0.08, -0.5);
  ctx.lineTo(0.08, -0.4);
  ctx.bezierCurveTo(0.3, -0.3, 0.34, 0.02, 0.36, 0.24);
  ctx.lineTo(0.46, 0.24);
  ctx.lineTo(0.46, 0.36);
  ctx.lineTo(-0.46, 0.36);
  ctx.lineTo(-0.46, 0.24);
  ctx.lineTo(-0.36, 0.24);
  ctx.bezierCurveTo(-0.34, 0.02, -0.3, -0.3, -0.08, -0.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0.46, 0.1, 0, Math.PI * 2);
  ctx.fill();
}
