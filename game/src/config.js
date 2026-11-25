// Warung Kilat — configuration: the menu, the ingredients, the shift.
// Everything the kitchen knows lives here, so tuning the game means
// editing this file and nothing else.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// One shift lasts two and a half minutes of real cooking.
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;

// A new customer walks in every 9 to 16 seconds while a slot is free.
export const ORDER_GAP_MIN = 9;
export const ORDER_GAP_MAX = 16;
// An order's patience, in seconds, before the customer storms off.
export const PATIENCE_MIN = 38;
export const PATIENCE_MAX = 55;

// Cooking on the wok takes a few seconds per dish; the wok holds one.
export const WOK_SLOTS = 1;

// Serving pass holds finished plates waiting for their ticket.
export const PASS_SLOTS = 3;

// An ingredient on the counter. `key` is the keyboard shortcut, `hue`
// drives the bin's paint, `draw` names the icon shape render.js paints.
export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',    key: '1', hue: '#f5ead2', icon: 'bowl' },
  { id: 'mie',    name: 'Mie',     key: '2', hue: '#f2c14e', icon: 'noodle' },
  { id: 'ayam',   name: 'Ayam',    key: '3', hue: '#e07840', icon: 'drumstick' },
  { id: 'telur',  name: 'Telur',   key: '4', hue: '#fdf6d8', icon: 'egg' },
  { id: 'sayur',  name: 'Sayur',   key: '5', hue: '#58a34a', icon: 'leaf' },
  { id: 'sambal', name: 'Sambal',  key: '6', hue: '#c0392b', icon: 'chili' },
  { id: 'sate',   name: 'Sate',    key: '7', hue: '#a5672e', icon: 'skewer' },
  { id: 'kecap',  name: 'Kecap',   key: '8', hue: '#4a2c14', icon: 'bottle' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

// A dish is a set of ingredients, in any order. `cook` is wok seconds,
// `price` is the coins a happy customer pays before tip.
export const DISHES = [
  {
    id: 'nasi-goreng',
    name: 'Nasi Goreng',
    needs: ['nasi', 'telur', 'sambal'],
    cook: 4,
    price: 12,
    blurb: 'Nasi, telur, sambal — klasik warung.',
  },
  {
    id: 'mie-ayam',
    name: 'Mie Ayam',
    needs: ['mie', 'ayam', 'sayur'],
    cook: 5,
    price: 14,
    blurb: 'Mie kenyal, ayam gurih, sayur segar.',
  },
  {
    id: 'sate-ayam',
    name: 'Sate Ayam',
    needs: ['sate', 'kecap', 'nasi'],
    cook: 6,
    price: 16,
    blurb: 'Sate arang, kecap manis, nasi hangat.',
  },
  {
    id: 'nasi-ayam',
    name: 'Nasi Ayam Kecap',
    needs: ['nasi', 'ayam', 'kecap'],
    cook: 5,
    price: 13,
    blurb: 'Ayam kecap manis di atas nasi.',
  },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// Tip: up to +50% of the price when served with patience to spare.
export const TIP_MAX_FRACTION = 0.5;
// Serving three orders in a row without a mistake builds a combo;
// each combo step adds 10% to the next serve, up to +50%.
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 0.5;

// Palette of the little street-side warung.
export const COLORS = {
  wall: '#ffe8c2',
  wallTile: '#f7d9a0',
  floor: '#8a5a2e',
  counterTop: '#c98d4b',
  counterFront: '#a5672e',
  board: '#5b3a1e',
  boardPaper: '#fff8e7',
  ink: '#3a2410',
  wok: '#2f2f33',
  flame: '#ff9d2e',
  awningRed: '#c0392b',
  awningCream: '#fff3d6',
  hud: '#2b1a0c',
  gold: '#f2c14e',
  good: '#2e9e5b',
  bad: '#c0392b',
};
