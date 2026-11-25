// Warung Kilat — main. Wires the kitchen together: the game loop, the
// actions every click and key drives, and the `?shot=` staging the
// screenshots use. No network, no libraries, one canvas, plain modules.
//
// Play it: serve game/ with any static server and open index.html.
//   cd game && python3 -m http.server 8080
// Screenshots: index.html?shot=busy (cover), assembly, cooking, serve.

import { CANVAS_H, CANVAS_W, SHIFT_SECONDS } from './config.js';
import { SoundBank } from './audio.js';
import { attachInput } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import {
  addFlash,
  addIngredient,
  clearPlate,
  createState,
  endShift,
  removeLastIngredient,
  serveOrder,
  setMessage,
  startCooking,
  startShift,
  update,
} from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const sounds = new SoundBank();
const state = createState();
let paused = false;
let lastFrame = performance.now();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // Staged screenshots: freeze the kitchen in the chosen moment.
  // The timer still reads, but the shift does not advance while the
  // page is only being photographed.
  applyShot(state, shot);
} else {
  state.phase = 'title';
}

function flashForServe(result, order) {
  const board = { x: 872, y: 124 };
  addFlash(state, board.x + 180, board.y + 40, `+${result.earned} koin`, 'good');
}

const actions = {
  unlockAudio() { sounds.unlock(); },

  startShift() {
    sounds.unlock();
    sounds.click();
    startShift(state);
    paused = false;
    setMessage(state, 'Shift dimulai! Pesanan pertama sudah masuk.', 'good', 2);
  },

  addIngredient(id) {
    const result = addIngredient(state, id);
    if (!result.ok) {
      if (result.why === 'already-on-plate') setMessage(state, 'Bahan itu sudah di piring.', 'bad');
      else if (result.why === 'plate-full') setMessage(state, 'Piring penuh — masak dulu atau buang.', 'bad');
      sounds.error();
      return;
    }
    sounds.add();
  },

  removeLast() {
    const removed = removeLastIngredient(state);
    if (removed) sounds.remove();
  },

  clearPlate() {
    clearPlate(state);
    sounds.remove();
    setMessage(state, 'Piring dibuang. Rakit lagi!', 'info');
  },

  cook() {
    const result = startCooking(state);
    if (!result.ok) {
      if (result.why === 'wok-busy') setMessage(state, 'Wajan masih dipakai — tunggu sebentar.', 'bad');
      else if (result.why === 'no-dish') setMessage(state, 'Piring belum membentuk resep apa pun.', 'bad');
      sounds.error();
      return;
    }
    sounds.chop();
    sounds.startSizzle();
    setMessage(state, `Memasak ${result.dish.name}…`, 'info');
  },

  selectPass(index) {
    if (state.phase !== 'playing') return;
    state.selectedPass = state.selectedPass === index ? -1 : index;
    sounds.click();
    if (state.selectedPass >= 0) {
      setMessage(state, 'Piring dipilih — klik tiket pesanan yang cocok.', 'info');
    }
  },

  serveOrder(orderId) {
    if (state.selectedPass < 0) {
      setMessage(state, 'Pilih dulu piring matang di meja saji.', 'bad');
      sounds.error();
      return;
    }
    const result = serveOrder(state, orderId, state.selectedPass);
    if (!result.ok) {
      if (result.why === 'wrong-dish') {
        setMessage(state, 'Bukan hidangan itu — cek resep di tiket!', 'bad');
        state.combo = 0;
      }
      sounds.error();
      return;
    }
    sounds.coin();
    flashForServe(result);
    const tipText = result.tip > 0 ? ` (+${result.tip} tip)` : '';
    const comboText = result.comboBonus > 0 ? ` kombo +${result.comboBonus}` : '';
    setMessage(state, `${result.dish.name} tersaji! +${result.earned} koin${tipText}${comboText}`, 'good');
  },

  serveSelected() {
    // Keyboard serve: pick the first ticket that matches the plate.
    if (state.selectedPass < 0 || state.pass.length === 0) return;
    const plate = state.pass[state.selectedPass];
    const order = state.orders.find((o) => o.dishId === plate.dishId);
    if (order) actions.serveOrder(order.id);
    else setMessage(state, 'Tidak ada tiket yang cocok dengan piring ini.', 'bad');
  },

  toggleMute() {
    const muted = sounds.toggleMute();
    setMessage(state, muted ? 'Suara dimatikan.' : 'Suara dinyalakan.', 'info', 1);
  },

  togglePause() {
    if (state.phase !== 'playing') return;
    paused = !paused;
    if (paused) sounds.stopSizzle();
    else if (state.wok) sounds.startSizzle();
  },
};

attachInput(canvas, state, actions);

function frame(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (!paused && state.phase === 'playing' && !shot) {
    update(state, dt, sounds);
    if (state.phase === 'over') {
      // Shift over: stop the sizzle, keep the last frame up.
      sounds.stopSizzle();
    }
  }
  if (shot && state.phase === 'playing') {
    // A staged screenshot: keep patience and wok frozen so the shot
    // is the same every time it is taken.
    state.elapsed = 54;
    state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  }
  render(ctx, state, paused, sounds.muted);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Expose the kitchen for debugging and for the screenshot tooling.
window.__warung = { state, sounds, actions };
