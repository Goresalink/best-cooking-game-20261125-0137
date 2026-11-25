// Warung Kilat — input. Mouse clicks and keyboard shortcuts, both
// driving the same kitchen actions. The renderer rebuilds `state.ui`
// every frame: a flat list of clickable rectangles, each naming the
// action it performs, so a click never has to guess where things are.
//
// Clickable ids:
//   ingredient:<id>  add one ingredient to the assembly plate
//   plate-remove     take the last ingredient back off the plate
//   plate-clear      tip the whole plate into the bin
//   cook             send the plate to the wok
//   pass:<i>         pick up ready plate i from the serving pass
//   order:<id>       serve the picked plate to this order's ticket
//   start            begin the shift (title screen)
//   restart          play again (game-over screen)
//   mute             toggle sound
//   pause            pause / resume the shift

import { INGREDIENTS } from './config.js';

export function attachInput(canvas, state, actions) {
  const toCanvas = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  canvas.addEventListener('click', (event) => {
    actions.unlockAudio();
    const point = toCanvas(event);
    const hit = (state.ui ?? []).find(
      (region) =>
        point.x >= region.x && point.x <= region.x + region.w &&
        point.y >= region.y && point.y <= region.y + region.h,
    );
    if (!hit) return;
    handleClickId(hit.id, state, actions);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    actions.unlockAudio();
    const key = event.key.toLowerCase();
    if (state.phase === 'title' && (key === 'enter' || key === ' ')) {
      actions.startShift();
      event.preventDefault();
      return;
    }
    if (state.phase === 'over' && (key === 'enter' || key === 'r')) {
      actions.startShift();
      return;
    }
    if (state.phase !== 'playing') return;
    const ingredient = INGREDIENTS.find((ing) => ing.key === key);
    if (ingredient) {
      actions.addIngredient(ingredient.id);
      return;
    }
    if (key === 'backspace' || key === 'delete') actions.removeLast();
    else if (key === 'c') actions.cook();
    else if (key === 'x') actions.clearPlate();
    else if (key === 'm') actions.toggleMute();
    else if (key === 'p' || key === 'escape') actions.togglePause();
    else if (key === 's') actions.serveSelected();
  });
}

function handleClickId(id, state, actions) {
  if (id === 'start' || id === 'restart') { actions.startShift(); return; }
  if (id === 'mute') { actions.toggleMute(); return; }
  if (id === 'pause') { actions.togglePause(); return; }
  if (state.phase !== 'playing') return;
  if (id.startsWith('ingredient:')) { actions.addIngredient(id.slice('ingredient:'.length)); return; }
  if (id === 'plate-remove') { actions.removeLast(); return; }
  if (id === 'plate-clear') { actions.clearPlate(); return; }
  if (id === 'cook') { actions.cook(); return; }
  if (id.startsWith('pass:')) { actions.selectPass(Number(id.slice('pass:'.length))); return; }
  if (id.startsWith('order:')) { actions.serveOrder(id.slice('order:'.length)); return; }
}
