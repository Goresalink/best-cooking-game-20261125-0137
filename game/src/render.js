// Warung Kilat — render. Every pixel of the kitchen is drawn on one
// canvas: the wall and awning, the order board, the ingredient counter,
// the assembly plate, the wok and the serving pass, plus the title and
// game-over screens. While drawing it rebuilds `state.ui`, the list of
// clickable rectangles input.js reads, so what you see is what you
// can click.

import {
  CANVAS_H,
  CANVAS_W,
  COLORS,
  DISH_BY_ID,
  INGREDIENTS,
  INGREDIENT_BY_ID,
  SHIFT_SECONDS,
} from './config.js';
import { LAYOUT, plateDish } from './state.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

// One ingredient's little painted icon, drawn at (cx, cy) with radius r.
export function drawIngredientIcon(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = '#3a2410';
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#fff8e7';
      ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.8, 0, Math.PI); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f5ead2';
      ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a5672e';
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.9); ctx.lineTo(r * 0.3, -r * 0.2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.9); ctx.lineTo(r * 0.6, -r * 0.2); ctx.stroke();
      break;
    }
    case 'mie': {
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = r * 0.22;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, i * r * 0.45);
        ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.4, r * 0.3, i * r * 0.45 + r * 0.4, r * 0.7, i * r * 0.45);
        ctx.stroke();
      }
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#e07840';
      ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.1, r * 0.55, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fdf6d8';
      ctx.lineWidth = r * 0.18;
      ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.25); ctx.lineTo(r * 0.85, r * 0.7); ctx.stroke();
      ctx.fillStyle = '#fdf6d8';
      ctx.beginPath(); ctx.arc(r * 0.9, r * 0.75, r * 0.16, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#fdf6d8';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.34, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#58a34a';
      ctx.beginPath(); ctx.moveTo(0, -r * 0.8);
      ctx.bezierCurveTo(r * 0.9, -r * 0.3, r * 0.7, r * 0.7, 0, r * 0.85);
      ctx.bezierCurveTo(-r * 0.7, r * 0.7, -r * 0.9, -r * 0.3, 0, -r * 0.8);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#2e6b34';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.moveTo(0, -r * 0.7); ctx.lineTo(0, r * 0.7); ctx.stroke();
      break;
    }
    case 'sambal': {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.5);
      ctx.quadraticCurveTo(0, -r * 1.1, r * 0.7, -r * 0.2);
      ctx.quadraticCurveTo(r * 0.4, r * 0.8, -r * 0.2, r * 0.8);
      ctx.quadraticCurveTo(-r * 0.9, r * 0.4, -r * 0.7, -r * 0.5);
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#2e6b34';
      ctx.lineWidth = r * 0.14;
      ctx.beginPath(); ctx.moveTo(r * 0.5, -r * 0.4); ctx.quadraticCurveTo(r * 0.9, -r * 0.9, r * 0.4, -r * 1); ctx.stroke();
      break;
    }
    case 'sate': {
      ctx.strokeStyle = '#8a5a2e';
      ctx.lineWidth = r * 0.1;
      ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.6); ctx.lineTo(r * 0.9, r * 0.6); ctx.stroke();
      ctx.fillStyle = '#a5672e';
      for (const t of [-0.45, 0, 0.45]) {
        ctx.save();
        ctx.translate(t * r, -t * r * 0.66);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-r * 0.22, -r * 0.22, r * 0.44, r * 0.44);
        ctx.restore();
      }
      break;
    }
    case 'kecap': {
      ctx.fillStyle = '#4a2c14';
      roundRect(ctx, -r * 0.4, -r * 0.3, r * 0.8, r * 0.9, r * 0.15);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-r * 0.22, -r * 0.85, r * 0.44, r * 0.6);
      ctx.fillStyle = '#f2c14e';
      ctx.fillRect(-r * 0.28, -r * 0.1, r * 0.56, r * 0.3);
      break;
    }
    default: {
      ctx.fillStyle = '#888';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawPanel(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(43, 26, 12, 0.12)';
  roundRect(ctx, x + 4, y + 5, w, h, 14);
  ctx.fill();
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = '#a5672e';
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 14);
  ctx.stroke();
  if (title) {
    ctx.fillStyle = COLORS.hud;
    roundRect(ctx, x, y, w, 34, 14);
    ctx.fill();
    ctx.fillRect(x, y + 20, w, 14);
    text(ctx, title, x + 14, y + 24, 16, '#fff8e7');
  }
}

function drawPatienceBar(ctx, x, y, w, fraction) {
  ctx.fillStyle = '#e8dcc8';
  roundRect(ctx, x, y, w, 10, 5);
  ctx.fill();
  const hue = fraction > 0.5 ? COLORS.good : fraction > 0.25 ? '#e08a00' : COLORS.bad;
  ctx.fillStyle = hue;
  if (fraction > 0.01) {
    roundRect(ctx, x, y, Math.max(8, w * fraction), 10, 5);
    ctx.fill();
  }
}

function drawOrderTicket(ctx, order, x, y, w, h, clickable) {
  const dish = DISH_BY_ID[order.dishId];
  const fraction = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = COLORS.boardPaper;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = fraction <= 0.25 ? COLORS.bad : '#a5672e';
  ctx.lineWidth = fraction <= 0.25 ? 3 : 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, dish.name, x + 12, y + 22, 18, COLORS.ink);
  text(ctx, `${dish.price} koin`, x + w - 12, y + 22, 15, '#a5672e', 'right');
  dish.needs.forEach((ingId, i) => {
    drawIngredientIcon(ctx, ingId, x + 26 + i * 44, y + 44, 13);
  });
  if (clickable) {
    text(ctx, 'KLIK UNTUK SAJIKAN ▶', x + w - 12, y + 48, 11, COLORS.good, 'right');
  }
  drawPatienceBar(ctx, x + 12, y + h - 12, w - 24, fraction);
}

function drawPlateContents(ctx, dishId, cx, cy, r, label) {
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a5672e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.68, 0, Math.PI * 2); ctx.stroke();
  if (dishId) {
    const dish = DISH_BY_ID[dishId];
    dish.needs.forEach((ingId, i) => {
      const angle = -Math.PI / 2 + (i - (dish.needs.length - 1) / 2) * 0.9;
      drawIngredientIcon(ctx, ingId, cx + Math.cos(angle) * r * 0.38, cy + Math.sin(angle) * r * 0.38, r * 0.26);
    });
    if (label) text(ctx, label, cx, cy + r + 20, 14, COLORS.ink, 'center');
  }
}

export function render(ctx, state, paused, muted) {
  state.ui = [];
  const ui = state.ui;
  const push = (id, x, y, w, h) => ui.push({ id, x, y, w, h });

  // --- wall, floor and awning ---
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = COLORS.wallTile;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 16; col += 1) {
      if ((row + col) % 2 === 0) ctx.fillRect(col * 80 + 4, 66 + row * 4, 72, 2);
    }
  }
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 544, CANVAS_W, CANVAS_H - 544);
  // Red-and-cream striped awning across the top.
  for (let i = 0; i < 16; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? COLORS.awningRed : COLORS.awningCream;
    ctx.fillRect(i * 80, 0, 80, 64);
    ctx.beginPath();
    ctx.moveTo(i * 80, 64);
    ctx.lineTo(i * 80 + 80, 64);
    ctx.lineTo(i * 80 + 70, 76);
    ctx.lineTo(i * 80 + 10, 76);
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, 'WARUNG KILAT', 32, 46, 30, '#fff8e7');

  // --- HUD: timer, coins, hearts, combo, buttons ---
  const hudY = 80;
  ctx.fillStyle = COLORS.hud;
  roundRect(ctx, 32, hudY, 816, 36, 10);
  ctx.fill();
  const timeFraction = state.timeLeft / SHIFT_SECONDS;
  const mm = String(Math.floor(state.timeLeft / 60));
  const ss = String(Math.floor(state.timeLeft % 60)).padStart(2, '0');
  text(ctx, `⏱ ${mm}:${ss}`, 48, hudY + 25, 20, timeFraction < 0.2 ? '#ff6b5e' : '#fff8e7');
  text(ctx, `🪙 ${state.coins}`, 200, hudY + 25, 20, COLORS.gold);
  text(ctx, '♥'.repeat(Math.max(0, state.hearts)) + '♡'.repeat(Math.max(0, 3 - state.hearts)), 310, hudY + 25, 20, '#ff6b5e');
  if (state.combo >= 2) text(ctx, `KOMBO x${state.combo}`, 832, hudY + 25, 15, '#ff9d2e', 'right');
  push('mute', 1196, 8, 36, 36);
  push('pause', 1152, 8, 36, 36);
  ctx.fillStyle = 'rgba(43,26,12,0.55)';
  roundRect(ctx, 1152, 8, 36, 36, 8); ctx.fill();
  roundRect(ctx, 1196, 8, 36, 36, 8); ctx.fill();
  text(ctx, paused ? '▶' : 'II', 1170, 33, 16, '#fff8e7', 'center');
  text(ctx, muted ? '✕' : '♪', 1214, 33, 16, '#fff8e7', 'center');

  // --- kitchen window: shelves, pots, hanging lamp ---
  const k = LAYOUT.kitchen;
  drawPanel(ctx, k.x, k.y, k.w, k.h, 'DAPUR');
  ctx.fillStyle = '#bfe3ef';
  roundRect(ctx, k.x + 24, k.y + 52, 240, 130, 8);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath(); ctx.arc(k.x + 84, k.y + 92, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#58a34a';
  ctx.fillRect(k.x + 24, k.y + 152, 240, 30);
  ctx.fillStyle = '#2e6b34';
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath(); ctx.arc(k.x + 48 + i * 48, k.y + 148, 14, Math.PI, 0); ctx.fill();
  }
  // Shelf with pots and pans.
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(k.x + 300, k.y + 96, 480, 12);
  ctx.fillStyle = '#5b5b60';
  ctx.beginPath(); ctx.arc(k.x + 360, k.y + 88, 26, Math.PI, 0); ctx.fill();
  ctx.fillRect(k.x + 334, k.y + 86, 52, 6);
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.arc(k.x + 470, k.y + 88, 22, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.beginPath(); ctx.arc(k.x + 560, k.y + 88, 22, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#8a5a2e';
  ctx.fillRect(k.x + 300, k.y + 170, 480, 12);
  ctx.fillStyle = '#3a3a3e';
  ctx.fillRect(k.x + 330, k.y + 140, 90, 30);
  ctx.fillStyle = '#c98d4b';
  ctx.fillRect(k.x + 470, k.y + 140, 70, 30);
  ctx.fillStyle = '#58a34a';
  ctx.fillRect(k.x + 590, k.y + 140, 60, 30);
  // Hanging lamp and steam over the stove spot.
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(k.x + 700, k.y + 34, k.x + 700, k.y + 70); ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath(); ctx.moveTo(k.x + 668, k.y + 96); ctx.lineTo(k.x + 732, k.y + 96); ctx.lineTo(k.x + 716, k.y + 66); ctx.lineTo(k.x + 684, k.y + 66); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath(); ctx.moveTo(k.x + 668, k.y + 96); ctx.lineTo(k.x + 732, k.y + 96); ctx.lineTo(k.x + 700, k.y + 190); ctx.closePath(); ctx.fill();
  text(ctx, 'Kompor arang menyala — masak di wajan bawah!', k.x + 24, k.y + 200, 15, '#6b4a26');
  text(ctx, 'Klik bahan di konter (atau tekan 1–8), rakit di piring, lalu MASAK.', k.x + 24, k.y + 220, 15, '#6b4a26');
  text(ctx, 'Sajikan piring matang ke tiket yang cocok sebelum pelanggan pergi.', k.x + 24, k.y + 240, 15, '#6b4a26');

  // --- order board ---
  const b = LAYOUT.board;
  ctx.fillStyle = COLORS.board;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.fill();
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 3;
  roundRect(ctx, b.x, b.y, b.w, b.h, 14);
  ctx.stroke();
  text(ctx, '📋 PAPAN PESANAN', b.x + 16, b.y + 30, 18, '#fff8e7');
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan…', b.x + 16, b.y + 90, 16, '#d8c9ae');
    text(ctx, 'Pelanggan segera datang!', b.x + 16, b.y + 116, 14, '#d8c9ae');
  }
  state.orders.forEach((order, i) => {
    const y = b.y + 40 + i * 74;
    const clickable = state.selectedPass >= 0;
    drawOrderTicket(ctx, order, b.x + 12, y, b.w - 24, 68, clickable);
    if (clickable) push(`order:${order.id}`, b.x + 12, y, b.w - 24, 74);
  });

  // --- assembly plate ---
  const p = LAYOUT.plate;
  drawPanel(ctx, p.x, p.y, p.w, p.h, 'PIRING RAKITAN');
  const dish = plateDish(state.plate);
  drawPlateContents(ctx, dish ? dish.id : null, p.x + 78, p.y + 88, 46, dish ? dish.name : null);
  // Loose ingredient chips on the plate when no full dish yet.
  if (!dish) {
    state.plate.forEach((ingId, i) => {
      drawIngredientIcon(ctx, ingId, p.x + 78 + (i - (state.plate.length - 1) / 2) * 40, p.y + 88, 15);
    });
  }
  const plateText = state.plate.length === 0
    ? 'Piring kosong — klik bahan.'
    : dish
      ? `Siap dimasak: ${dish.name}!`
      : `${state.plate.length} bahan — tambah lagi.`;
  text(ctx, plateText, p.x + 150, p.y + 62, 14, COLORS.ink);
  if (state.plate.length > 0) {
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, p.x + 150, p.y + 78, 110, 30, 8); ctx.fill();
    text(ctx, '↩ Ambil balik', p.x + 205, p.y + 99, 13, COLORS.ink, 'center');
    push('plate-remove', p.x + 150, p.y + 78, 110, 30);
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, p.x + 268, p.y + 78, 110, 30, 8); ctx.fill();
    text(ctx, '🗑 Buang', p.x + 323, p.y + 99, 13, COLORS.ink, 'center');
    push('plate-clear', p.x + 268, p.y + 78, 110, 30);
  }
  if (dish) {
    text(ctx, 'Resep cocok! Tekan MASAK di wajan →', p.x + 150, p.y + 128, 13, COLORS.good);
  }

  // --- wok ---
  const w = LAYOUT.wok;
  drawPanel(ctx, w.x, w.y, w.w, w.h, 'WAJAN');
  ctx.fillStyle = COLORS.wok;
  ctx.beginPath(); ctx.ellipse(w.x + 130, w.y + 96, 92, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(w.x + 130, w.y + 96, 92, 30, 0, 0, Math.PI * 2); ctx.stroke();
  if (state.wok) {
    const t = Date.now() / 160;
    ctx.fillStyle = COLORS.flame;
    for (let i = 0; i < 3; i += 1) {
      const fx = w.x + 90 + i * 40 + Math.sin(t + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(fx - 12, w.y + 128);
      ctx.quadraticCurveTo(fx, w.y + 96 - Math.sin(t * 1.3 + i) * 6, fx + 12, w.y + 128);
      ctx.closePath(); ctx.fill();
    }
    const dishWok = DISH_BY_ID[state.wok.dishId];
    dishWok.needs.forEach((ingId, i) => {
      drawIngredientIcon(ctx, ingId, w.x + 100 + i * 32, w.y + 92, 12);
    });
    ctx.fillStyle = '#e8dcc8';
    roundRect(ctx, w.x + 236, w.y + 60, 120, 14, 7); ctx.fill();
    ctx.fillStyle = COLORS.flame;
    roundRect(ctx, w.x + 236, w.y + 60, Math.max(8, 120 * state.wok.progress), 14, 7); ctx.fill();
    text(ctx, `${dishWok.name}… ${Math.round(state.wok.progress * 100)}%`, w.x + 236, w.y + 100, 14, COLORS.ink);
    text(ctx, 'Mendesis…', w.x + 236, w.y + 122, 13, '#a5672e');
  } else {
    text(ctx, 'Wajan kosong.', w.x + 236, w.y + 76, 15, '#6b4a26');
    text(ctx, 'Rakit piring dulu,', w.x + 236, w.y + 100, 13, '#6b4a26');
    text(ctx, 'lalu masak di sini.', w.x + 236, w.y + 120, 13, '#6b4a26');
  }
  const canCook = !!dish && !state.wok && state.phase === 'playing';
  ctx.fillStyle = canCook ? COLORS.good : '#cbbfa8';
  roundRect(ctx, w.x + 236, w.y + 108, 120, 34, 10);
  ctx.fill();
  text(ctx, '🔥 MASAK (C)', w.x + 296, w.y + 131, 15, '#fff8e7', 'center');
  if (canCook) push('cook', w.x + 236, w.y + 108, 120, 34);

  // --- serving pass ---
  const s = LAYOUT.pass;
  drawPanel(ctx, s.x, s.y, s.w, s.h, 'MEJA SAJI — SIAP DIANTAR');
  if (state.pass.length === 0) {
    text(ctx, 'Belum ada piring matang.', s.x + 16, s.y + 84, 15, '#6b4a26');
    text(ctx, 'Piring matang muncul di sini.', s.x + 16, s.y + 108, 13, '#6b4a26');
  }
  state.pass.forEach((plate, i) => {
    const cx = s.x + 66 + i * 118;
    const selected = state.selectedPass === i;
    if (selected) {
      ctx.fillStyle = 'rgba(46,158,91,0.25)';
      roundRect(ctx, cx - 58, s.y + 44, 112, 92, 12);
      ctx.fill();
    }
    drawPlateContents(ctx, plate.dishId, cx, s.y + 80, 34, DISH_BY_ID[plate.dishId].name);
    push(`pass:${i}`, cx - 58, s.y + 44, 112, 92);
  });

  // --- ingredient counter ---
  const c = LAYOUT.counter;
  ctx.fillStyle = COLORS.counterFront;
  roundRect(ctx, c.x, c.y, c.w, c.h, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, c.x, c.y, c.w, 34, 14);
  ctx.fillRect(c.x, c.y + 20, c.w, 14);
  text(ctx, 'KONTER BAHAN — klik atau tekan 1–8', c.x + 14, c.y + 24, 16, '#fff8e7');
  INGREDIENTS.forEach((ing, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const bx = c.x + 16 + col * 200;
    const by = c.y + 44 + row * 72;
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, bx, by, 184, 60, 10);
    ctx.fill();
    ctx.strokeStyle = '#a5672e';
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, 184, 60, 10);
    ctx.stroke();
    ctx.fillStyle = ing.hue;
    ctx.beginPath(); ctx.arc(bx + 32, by + 30, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2410';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(bx + 32, by + 30, 22, 0, Math.PI * 2); ctx.stroke();
    drawIngredientIcon(ctx, ing.id, bx + 32, by + 30, 16);
    text(ctx, ing.name, bx + 62, by + 28, 17, COLORS.ink);
    text(ctx, `tombol ${ing.key}`, bx + 62, by + 48, 12, '#6b4a26');
    if (state.phase === 'playing') push(`ingredient:${ing.id}`, bx, by, 184, 60);
  });

  // --- floating score popups and message banner ---
  const now = state.elapsed;
  state.flashes = state.flashes.filter((f) => f.until > now);
  for (const flash of state.flashes) {
    const alpha = Math.min(1, (flash.until - now) / 0.5);
    ctx.globalAlpha = alpha;
    text(ctx, flash.text, flash.x, flash.y - (1.2 - (flash.until - now)) * 30, 20, flash.kind === 'good' ? COLORS.good : COLORS.bad, 'center');
    ctx.globalAlpha = 1;
  }
  if (state.message && state.message.until > now) {
    ctx.fillStyle = state.message.kind === 'bad' ? 'rgba(192,57,43,0.92)' : 'rgba(46,158,91,0.92)';
    const tw = ctx.measureText(state.message.text).width;
    roundRect(ctx, (CANVAS_W - tw - 60) / 2, 540, tw + 60, 36, 18);
    ctx.fill();
    text(ctx, state.message.text, CANVAS_W / 2, 564, 16, '#fff8e7', 'center');
  }

  if (paused && state.phase === 'playing') {
    ctx.fillStyle = 'rgba(43,26,12,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    text(ctx, 'JEDA', CANVAS_W / 2, CANVAS_H / 2 - 10, 64, '#fff8e7', 'center');
    text(ctx, 'Tekan P atau klik II untuk lanjut', CANVAS_W / 2, CANVAS_H / 2 + 40, 20, '#ffe8c2', 'center');
  }

  if (state.phase === 'title') drawTitle(ctx, state);
  if (state.phase === 'over') drawGameOver(ctx, state);
}

function drawTitle(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,12,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 290, 150, 700, 480, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.awningRed;
  ctx.lineWidth = 4;
  roundRect(ctx, 290, 150, 700, 480, 20);
  ctx.stroke();
  text(ctx, '🍳 WARUNG KILAT', 640, 230, 52, COLORS.awningRed, 'center');
  text(ctx, 'Game masak cepat ala warung Indonesia', 640, 272, 20, COLORS.ink, 'center');
  text(ctx, 'Pesanan datang di papan kanan. Rakit hidangan di piring,', 640, 330, 17, '#6b4a26', 'center');
  text(ctx, 'masak di wajan, sajikan sebelum pelanggan kehabisan sabar.', 640, 356, 17, '#6b4a26', 'center');
  text(ctx, 'Klik bahan atau tekan 1–8  •  C = masak  •  klik piring matang lalu klik tiket', 640, 392, 15, '#6b4a26', 'center');
  text(ctx, 'Tip besar untuk sajian cepat. Tiga pelanggan pergi = shift berakhir.', 640, 418, 15, '#6b4a26', 'center');
  text(ctx, 'Menu hari ini:', 640, 462, 16, COLORS.ink, 'center');
  const menu = [
    'Nasi Goreng — nasi + telur + sambal',
    'Mie Ayam — mie + ayam + sayur',
    'Sate Ayam — sate + kecap + nasi',
    'Nasi Ayam Kecap — nasi + ayam + kecap',
  ];
  menu.forEach((line, i) => text(ctx, line, 640, 490 + i * 24, 15, '#6b4a26', 'center'));
  ctx.fillStyle = COLORS.good;
  roundRect(ctx, 490, 572, 300, 48, 12);
  ctx.fill();
  text(ctx, 'MULAI MASAK ▶', 640, 603, 24, '#fff8e7', 'center');
  state.ui.push({ id: 'start', x: 490, y: 572, w: 300, h: 48 });
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,26,12,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#fff8e7';
  roundRect(ctx, 340, 170, 600, 440, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.awningRed;
  ctx.lineWidth = 4;
  roundRect(ctx, 340, 170, 600, 440, 20);
  ctx.stroke();
  text(ctx, 'SHIFT SELESAI!', 640, 240, 44, COLORS.awningRed, 'center');
  text(ctx, `Koin hari ini: 🪙 ${state.coins}`, 640, 310, 26, COLORS.ink, 'center');
  text(ctx, `Pesanan disajikan: ${state.served}   •   Pelanggan pergi: ${state.lost}`, 640, 352, 18, '#6b4a26', 'center');
  text(ctx, `Kombo terbaik: x${state.bestCombo}`, 640, 386, 18, '#6b4a26', 'center');
  const verdict = state.served >= 12
    ? 'Koki kilat! Warungmu ramai terus.'
    : state.served >= 7
      ? 'Bagus! Sedikit lagi jadi legenda warung.'
      : 'Terus berlatih — pelanggan menunggu masakanmu!';
  text(ctx, verdict, 640, 428, 17, COLORS.good, 'center');
  ctx.fillStyle = COLORS.good;
  roundRect(ctx, 490, 470, 300, 52, 12);
  ctx.fill();
  text(ctx, 'MASAK LAGI ▶', 640, 504, 24, '#fff8e7', 'center');
  state.ui.push({ id: 'restart', x: 490, y: 470, w: 300, h: 52 });
  text(ctx, 'atau tekan Enter', 640, 552, 13, '#6b4a26', 'center');
}
