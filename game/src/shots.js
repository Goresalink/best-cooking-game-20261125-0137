// Warung Kilat — screenshot staging. The `?shot=` query presets the
// kitchen into a photogenic state for the entry's screenshots: the same
// live game, the same code path, just a state the maker chose. The
// presets never change how the game plays; they only set up a moment
// worth showing. Valid shots: start, busy, assembly, cooking, serve.

import { DISH_BY_ID } from './config.js';
import { spawnOrder } from './state.js';

function setOrder(state, dishId, patienceFraction) {
  const order = spawnOrder(state, () => 0.5);
  if (!order) return null;
  order.dishId = dishId;
  order.patience = order.maxPatience * patienceFraction;
  return order;
}

export function applyShot(state, shot) {
  state.phase = 'playing';
  state.elapsed = 54; // mid-shift: the timer reads about 1:36.
  state.timeLeft = 96;
  state.coins = 47;
  state.hearts = 3;
  state.combo = 2;
  state.orders = [];
  state.plate = [];
  state.wok = null;
  state.pass = [];
  state.selectedPass = -1;
  state.nextOrderIn = 12;
  state.message = null;
  state.flashes = [];

  if (shot === 'start') {
    state.phase = 'title';
    state.elapsed = 0;
    state.timeLeft = 150;
    state.coins = 0;
    state.combo = 0;
    return;
  }
  if (shot === 'busy') {
    // The cover: two tickets waiting, a dish half-built on the plate.
    setOrder(state, 'nasi-goreng', 0.75);
    setOrder(state, 'mie-ayam', 0.55);
    state.plate = ['nasi', 'telur'];
    state.message = { text: 'Nasi Goreng hampir jadi — tambah sambal!', kind: 'info', until: 9999 };
    return;
  }
  if (shot === 'assembly') {
    // One dish mid-assembly: two of three ingredients on the plate.
    setOrder(state, 'sate-ayam', 0.8);
    setOrder(state, 'nasi-ayam', 0.6);
    state.plate = ['sate', 'kecap'];
    state.message = { text: 'Sate Ayam: tambah nasi, lalu MASAK.', kind: 'info', until: 9999 };
    return;
  }
  if (shot === 'cooking') {
    // The wok is working and a finished plate waits on the pass.
    setOrder(state, 'mie-ayam', 0.7);
    state.wok = { dishId: 'mie-ayam', progress: 0.62, cook: DISH_BY_ID['mie-ayam'].cook };
    state.pass = [{ dishId: 'nasi-goreng' }];
    state.plate = ['nasi'];
    return;
  }
  if (shot === 'serve') {
    // A plate is ready and its ticket waits: the serving moment.
    setOrder(state, 'nasi-goreng', 0.65);
    setOrder(state, 'sate-ayam', 0.4);
    state.pass = [{ dishId: 'nasi-goreng' }];
    state.selectedPass = 0;
    state.message = { text: 'Nasi Goreng matang! Klik tiketnya untuk menyajikan.', kind: 'good', until: 9999 };
    return;
  }
  // Unknown shot name: plain playing state, no staging.
}
