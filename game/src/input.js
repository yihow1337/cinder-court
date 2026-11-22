// Mouse and keyboard, turned into the five things a suitor can say: pick this card,
// put it on that hearth, bank it, flare it, or begin again. Pointer coordinates are
// mapped back through the letterbox into the 1280x720 court.

import { VIEW } from './config.js';
import { pickAt } from './layout.js';

function toCourt(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW.w,
    y: ((event.clientY - rect.top) / rect.height) * VIEW.h,
  };
}

/**
 * @param canvas the game canvas
 * @param app    the live app state (for hit-testing against the current table)
 * @param actions handlers implemented by main.js
 */
export function attachInput(canvas, app, actions) {
  canvas.addEventListener('pointermove', (event) => {
    const point = toCourt(canvas, event);
    app.pointer = point;
    app.hover = app.table ? pickAt(app.table, point.x, point.y) : null;
    canvas.style.cursor = app.hover && app.hover.kind !== 'table' ? 'pointer' : 'default';
  });

  canvas.addEventListener('pointerleave', () => {
    app.hover = null;
  });

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    actions.unlock();
    if (app.screen === 'title') {
      actions.start();
      return;
    }
    if (app.screen === 'end') {
      actions.rematch();
      return;
    }
    const point = toCourt(canvas, event);
    const pick = pickAt(app.table, point.x, point.y);
    if (pick.kind === 'hand') actions.pickCard(pick.index);
    else if (pick.kind === 'bank') actions.pickBank();
    else if (pick.kind === 'hearth') actions.commitTo(pick.index);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    actions.unlock();

    if (key === 'm') {
      actions.mute();
      return;
    }
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      if (app.screen === 'title') actions.start();
      else if (app.screen === 'end') actions.rematch();
      else actions.confirm();
      return;
    }
    if (key === 'r') {
      if (app.screen !== 'title') actions.rematch();
      return;
    }
    if (app.screen !== 'table') return;

    if (key >= '1' && key <= '5') {
      actions.pickCard(Number(key) - 1);
      return;
    }
    const hearthKey = { q: 0, w: 1, e: 2 }[key];
    if (hearthKey !== undefined) {
      actions.commitTo(hearthKey);
      return;
    }
    if (key === 'b') actions.bank();
    else if (key === 'f') actions.pickBank();
    else if (key === 'arrowleft') actions.nudgeSelection(-1);
    else if (key === 'arrowright') actions.nudgeSelection(1);
    else if (key === 'escape') actions.clearSelection();
  });
}
