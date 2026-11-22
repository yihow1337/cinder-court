// Air and fire: the ash motes that drift across the court all match long, and the ember
// bursts a clash or a victory throws. Seeded, so a screenshot scene looks alive and is
// still identical every time it is taken.

import { VIEW } from './config.js';
import { makeRandom } from './random.js';

export function createMotes(seed, count = 70) {
  const rng = makeRandom(seed ^ 0x1d7f);
  return Array.from({ length: count }, () => ({
    x: rng.range(0, VIEW.w),
    y: rng.range(0, VIEW.h),
    r: rng.range(0.7, 2.5),
    drift: rng.range(-9, 9),
    rise: rng.range(-16, -4),
    phase: rng.range(0, Math.PI * 2),
    warm: rng.float() < 0.35,
  }));
}

export function stepMotes(motes, dt, time) {
  for (const mote of motes) {
    mote.x += (mote.drift + Math.sin(time * 0.5 + mote.phase) * 7) * dt;
    mote.y += mote.rise * dt;
    if (mote.y < -8) mote.y = VIEW.h + 8;
    if (mote.x < -8) mote.x = VIEW.w + 8;
    if (mote.x > VIEW.w + 8) mote.x = -8;
  }
}

export function drawMotes(ctx, motes, time) {
  ctx.save();
  for (const mote of motes) {
    const twinkle = 0.25 + 0.3 * (1 + Math.sin(time * 2 + mote.phase)) * 0.5;
    ctx.globalAlpha = twinkle * (mote.warm ? 0.9 : 0.5);
    ctx.fillStyle = mote.warm ? '#ffb15c' : '#cbbba4';
    ctx.beginPath();
    ctx.arc(mote.x, mote.y, mote.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function createBurst(seed) {
  return { embers: [], rng: makeRandom(seed ^ 0x77aa) };
}

export function emitEmbers(burst, x, y, color, count = 24, power = 1) {
  for (let i = 0; i < count; i += 1) {
    const angle = burst.rng.range(-Math.PI * 0.95, -Math.PI * 0.05);
    const speed = burst.rng.range(60, 230) * power;
    burst.embers.push({
      x: x + burst.rng.range(-18, 18),
      y: y + burst.rng.range(-10, 10),
      vx: Math.cos(angle) * speed * 0.55,
      vy: Math.sin(angle) * speed,
      life: burst.rng.range(0.6, 1.5),
      age: 0,
      r: burst.rng.range(1.6, 4.4),
      color,
    });
  }
}

export function stepEmbers(burst, dt) {
  for (const ember of burst.embers) {
    ember.age += dt;
    ember.vy += 42 * dt;
    ember.vx *= 1 - dt * 0.9;
    ember.x += ember.vx * dt;
    ember.y += ember.vy * dt;
  }
  burst.embers = burst.embers.filter((ember) => ember.age < ember.life);
}

export function drawEmbers(ctx, burst) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const ember of burst.embers) {
    const fade = 1 - ember.age / ember.life;
    ctx.globalAlpha = Math.max(0, fade);
    ctx.fillStyle = ember.color;
    ctx.beginPath();
    ctx.arc(ember.x, ember.y, ember.r * (0.4 + fade * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A column of embers climbing the screen, for the victory flourish. */
export function createRisingColumn(seed) {
  const rng = makeRandom(seed ^ 0x3cc1);
  return Array.from({ length: 90 }, () => ({
    x: rng.range(0, VIEW.w),
    y: rng.range(0, VIEW.h * 1.4),
    speed: rng.range(50, 170),
    r: rng.range(1.4, 4.2),
    sway: rng.range(0.6, 2.4),
    phase: rng.range(0, Math.PI * 2),
    hot: rng.float() < 0.5,
  }));
}

export function stepRisingColumn(column, dt, time) {
  for (const spark of column) {
    spark.y -= spark.speed * dt;
    spark.x += Math.sin(time * spark.sway + spark.phase) * 16 * dt;
    if (spark.y < -10) {
      spark.y = VIEW.h + 10;
    }
  }
}

export function drawRisingColumn(ctx, column, time, hotColor, coolColor) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const spark of column) {
    const flicker = 0.4 + 0.6 * (1 + Math.sin(time * 5 + spark.phase)) * 0.5;
    ctx.globalAlpha = flicker * 0.75 * Math.min(1, spark.y / VIEW.h + 0.25);
    ctx.fillStyle = spark.hot ? hotColor : coolColor;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
