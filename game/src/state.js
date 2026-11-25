// Warung Kilat — state. One plain object holds the whole kitchen, and
// every rule that changes it lives in the functions below: spawning
// orders, assembling a plate, cooking on the wok, serving, and the
// end of the shift. Nothing here draws anything or listens for input.

import {
  CANVAS_W,
  DISHES,
  DISH_BY_ID,
  INGREDIENT_BY_ID,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_GAP_MAX,
  ORDER_GAP_MIN,
  PASS_SLOTS,
  PATIENCE_MAX,
  PATIENCE_MIN,
  SHIFT_SECONDS,
  TIP_MAX_FRACTION,
  COMBO_STEP,
  COMBO_MAX,
} from './config.js';

let orderCounter = 0;

export function randomDish(rng = Math.random) {
  return DISHES[Math.floor(rng() * DISHES.length)];
}

export function createState() {
  return {
    phase: 'title', // 'title' | 'playing' | 'over'
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    served: 0,
    lost: 0,
    hearts: MAX_HEARTS,
    combo: 0,
    bestCombo: 0,
    orders: [], // { id, dishId, patience, maxPatience, born }
    plate: [], // ingredient ids on the assembly plate, in added order
    wok: null, // { dishId, progress, cook } while a dish cooks
    pass: [], // finished plates waiting: { dishId }
    nextOrderIn: 6,
    selectedPass: -1, // index into pass[] the player picked to serve
    message: null, // { text, kind, until } floating feedback
    flashes: [], // { x, y, text, kind, until } score popups
    lastTickSecond: -1,
    rngSeed: 1,
  };
}

// A ticket pinned to the order board.
export function spawnOrder(state, rng = Math.random) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const dish = randomDish(rng);
  const patience = PATIENCE_MIN + rng() * (PATIENCE_MAX - PATIENCE_MIN);
  const order = {
    id: `ord-${++orderCounter}`,
    dishId: dish.id,
    patience,
    maxPatience: patience,
    born: state.elapsed,
  };
  state.orders.push(order);
  return order;
}

export function dishNeeds(dishId) {
  return DISH_BY_ID[dishId].needs;
}

// Does the assembly plate hold exactly the dish's ingredients?
export function plateMatchesDish(plate, dishId) {
  const needs = dishNeeds(dishId);
  if (plate.length !== needs.length) return false;
  return needs.every((id) => plate.includes(id));
}

// Which dish, if any, does the current plate complete?
export function plateDish(plate) {
  if (plate.length === 0) return null;
  return DISHES.find((d) => plateMatchesDish(plate, d.id)) ?? null;
}

export function addIngredient(state, id) {
  if (state.phase !== 'playing') return { ok: false, why: 'not-playing' };
  if (!INGREDIENT_BY_ID[id]) return { ok: false, why: 'unknown' };
  if (state.plate.length >= 4) return { ok: false, why: 'plate-full' };
  if (state.plate.includes(id)) return { ok: false, why: 'already-on-plate' };
  state.plate.push(id);
  return { ok: true };
}

export function removeLastIngredient(state) {
  if (state.phase !== 'playing') return null;
  return state.plate.pop() ?? null;
}

export function clearPlate(state) {
  if (state.phase !== 'playing') return;
  state.plate.length = 0;
}

export function startCooking(state) {
  if (state.phase !== 'playing') return { ok: false, why: 'not-playing' };
  if (state.wok) return { ok: false, why: 'wok-busy' };
  const dish = plateDish(state.plate);
  if (!dish) return { ok: false, why: 'no-dish' };
  state.wok = { dishId: dish.id, progress: 0, cook: dish.cook };
  state.plate.length = 0;
  return { ok: true, dish };
}

// Serving: the player picks a ready plate on the pass, then a ticket.
// A matching ticket pays price + tip (patience left) + combo bonus.
export function serveOrder(state, orderId, passIndex) {
  if (state.phase !== 'playing') return { ok: false, why: 'not-playing' };
  const plate = state.pass[passIndex];
  if (!plate) return { ok: false, why: 'no-plate' };
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, why: 'no-order' };
  if (order.dishId !== plate.dishId) return { ok: false, why: 'wrong-dish' };
  const dish = DISH_BY_ID[order.dishId];
  const patienceFraction = Math.max(0, order.patience / order.maxPatience);
  const tip = Math.round(dish.price * TIP_MAX_FRACTION * patienceFraction);
  const comboBonus = Math.round(dish.price * Math.min(COMBO_MAX, state.combo * COMBO_STEP));
  const earned = dish.price + tip + comboBonus;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== orderId);
  state.pass.splice(passIndex, 1);
  state.selectedPass = -1;
  return { ok: true, earned, tip, comboBonus, dish };
}

export function setMessage(state, text, kind = 'info', seconds = 1.6) {
  state.message = { text, kind, until: state.elapsed + seconds };
}

export function addFlash(state, x, y, text, kind = 'good') {
  state.flashes.push({ x, y, text, kind, until: state.elapsed + 1.2 });
}

function loseOrder(state, order, sounds) {
  state.orders = state.orders.filter((o) => o.id !== order.id);
  state.lost += 1;
  state.hearts -= 1;
  state.combo = 0;
  setMessage(state, `Pelanggan pergi — ${DISH_BY_ID[order.dishId].name} tak kunjung datang!`, 'bad', 2);
  sounds?.error();
}

// Advance the kitchen by dt seconds: timer, patience, wok, spawns.
export function update(state, dt, sounds) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);

  const whole = Math.ceil(state.timeLeft);
  if (whole !== state.lastTickSecond) {
    state.lastTickSecond = whole;
    if (whole <= 10 && whole > 0) sounds?.tick();
  }

  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) loseOrder(state, order, sounds);
  }
  if (state.hearts <= 0) {
    endShift(state, sounds);
    return;
  }

  if (state.wok) {
    state.wok.progress += dt / state.wok.cook;
    if (state.wok.progress >= 1) {
      if (state.pass.length < PASS_SLOTS) {
        state.pass.push({ dishId: state.wok.dishId });
        setMessage(state, `${DISH_BY_ID[state.wok.dishId].name} matang! Siap disajikan.`, 'good');
        sounds?.ding();
      } else {
        setMessage(state, 'Meja saji penuh! Sajikan dulu piring yang sudah matang.', 'bad', 2);
        sounds?.error();
      }
      state.wok = null;
      sounds?.stopSizzle();
    }
  }

  state.nextOrderIn -= dt;
  if (state.nextOrderIn <= 0) {
    const spawned = spawnOrder(state);
    state.nextOrderIn = ORDER_GAP_MIN + Math.random() * (ORDER_GAP_MAX - ORDER_GAP_MIN);
    if (spawned) sounds?.click();
  }

  if (state.timeLeft <= 0) endShift(state, sounds);
}

export function endShift(state, sounds) {
  if (state.phase === 'over') return;
  state.phase = 'over';
  state.wok = null;
  sounds?.stopSizzle();
  sounds?.gameOver();
}

export function startShift(state) {
  const fresh = createState();
  Object.assign(state, fresh, { phase: 'playing', rngSeed: (Math.random() * 1e9) | 0 });
  spawnOrder(state);
  spawnOrder(state);
  state.nextOrderIn = ORDER_GAP_MIN + Math.random() * (ORDER_GAP_MAX - ORDER_GAP_MIN);
}

// Layout constants the renderer and the input layer share, in canvas
// pixels. The board, the counter, the plate, the wok and the pass all
// sit at fixed spots so mouse and keyboard always hit the same places.
export const LAYOUT = {
  hudH: 64,
  board: { x: 872, y: 124, w: 376, h: 260 },
  counter: { x: 32, y: 584, w: 816, h: 184 },
  plate: { x: 32, y: 396, w: 400, h: 148 },
  wok: { x: 464, y: 396, w: 384, h: 148 },
  pass: { x: 872, y: 396, w: 376, h: 148 },
  kitchen: { x: 32, y: 124, w: 816, h: 260 },
};
export { CANVAS_W };
