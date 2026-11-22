// Motion: cards spring toward their target pose with a little overshoot so they snap,
// flip from back to face as they land, and arrive staggered so a dealt hand has weight.

import { HEARTH_COUNT } from './config.js';
import { deckSlot } from './layout.js';

const SPRING = 232;
const DAMPING = 23;
const FLIP_SPEED = 4.4;

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const easeOutCubic = (t) => 1 - (1 - t) ** 3;
export const easeOutBack = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;
export const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function ensureView(card) {
  if (card.view) return card.view;
  const start = deckSlot();
  card.view = {
    x: start.x,
    y: start.y,
    scale: start.scale,
    rot: start.rot,
    face: 0,
    vx: 0,
    vy: 0,
    vs: 0,
    vr: 0,
    pop: 0,
    glow: 0,
    wait: card.dealDelay ?? 0,
  };
  return card.view;
}

function springAxis(view, axis, velocity, target, dt) {
  const accel = (target - view[axis]) * SPRING - view[velocity] * DAMPING;
  view[velocity] += accel * dt;
  view[axis] += view[velocity] * dt;
}

export function stepCard(card, dt) {
  const view = ensureView(card);
  if (view.wait > 0) {
    view.wait -= dt;
    return;
  }
  const target = card.target;
  if (target) {
    springAxis(view, 'x', 'vx', target.x, dt);
    springAxis(view, 'y', 'vy', target.y, dt);
    springAxis(view, 'scale', 'vs', target.scale, dt);
    springAxis(view, 'rot', 'vr', target.rot, dt);
  }
  const faceGoal = card.faceTarget ?? 1;
  if (view.face < faceGoal) view.face = Math.min(faceGoal, view.face + dt * FLIP_SPEED);
  else if (view.face > faceGoal) view.face = Math.max(faceGoal, view.face - dt * FLIP_SPEED);
  view.pop = Math.max(0, view.pop - dt * 2.2);
  view.glow = Math.max(0, view.glow - dt * 1.4);
}

export function tableCards(table) {
  const cards = [...table.hands.player, ...table.hands.rival];
  if (table.bank.player) cards.push(table.bank.player);
  if (table.bank.rival) cards.push(table.bank.rival);
  for (let i = 0; i < HEARTH_COUNT; i += 1) {
    const hearth = table.hearths[i];
    if (hearth.rival) cards.push(hearth.rival);
    if (hearth.player) cards.push(hearth.player);
  }
  return cards;
}

export function stepTable(table, dt) {
  for (const card of tableCards(table)) stepCard(card, dt);
  for (const side of ['player', 'rival']) {
    table.flash[side] = Math.max(0, table.flash[side] - dt * 1.6);
  }
  if (table.tell) table.tell.t += dt;
  for (const entry of table.log) entry.age += dt;
}

/** Called when a card lands in a hearth: a visible thud and a brief rim glow. */
export function landPop(card, glow = 1) {
  const view = ensureView(card);
  view.pop = 1;
  view.glow = glow;
  view.vs += 1.4;
  view.vy += 90;
}

/** Shove every card on a side when it takes damage. Deterministic: the jolt per card
 *  comes from its own rank, so a replayed match shakes exactly the same way. */
export function shoveSide(table, side, force = 1) {
  for (const card of tableCards(table)) {
    const view = ensureView(card);
    view.vy += (side === 'player' ? 1 : -1) * 26 * force;
    view.vr += ((card.rank % 3) - 1) * 0.14 * force;
  }
}

/** The win/loss flourish timeline: 0 at the cut, 1 once it has fully landed. */
export function createFlourish() {
  return { t: 0, snap: 0 };
}

export function stepFlourish(flourish, dt) {
  flourish.t += dt;
  flourish.snap = clamp(flourish.t / 0.55, 0, 1);
  return flourish;
}
