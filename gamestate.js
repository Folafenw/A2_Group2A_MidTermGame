// ============================================================
// gamestate.js  —  State management + shared constants
// ============================================================

const STATE = {
  START:        'START',
  PLAYING:      'PLAYING',
  SHELF:        'SHELF',
  INSTRUCTIONS: 'INSTRUCTIONS',
  WIN:          'WIN',
  LOSE:         'LOSE',
  CHARACTER:    'CHARACTER'
};

// ── Brand color palette (from supplied swatches) ─────────────
const PAL = {
  black:      [10,   10,  14],
  skyBlue:    [41,  182, 246],
  green:      [34,  139,  87],
  amber:      [245, 166,   0],
  pink:       [240,  30, 110],
  orange:     [230,  80,  20],
  royalBlue:  [30,  100, 200],
  blue:       [20,  120, 220],
  darkGreen:  [15,   80,  50],
  gold:       [240, 185,   0],
  yellow:     [255, 230,   0],
  blush:      [240, 140, 175],
  white:      [255, 255, 255],
  offWhite:   [245, 242, 235],
  darkBg:     [18,   20,  30],
  floorA:     [235, 230, 218],
  floorB:     [228, 223, 210]
};

// ── World (scrollable) dimensions ────────────────────────────
const WORLD_W = 1600;
const WORLD_H = 1100;

// ── Fixed UI zones ────────────────────────────────────────────
const TOP_BAR_H     = 72;   // height of top HUD strip
const RIGHT_PANEL_W = 280;  // width of shopping list panel

// ── Aisle X positions in world space ─────────────────────────
const AISLE_XS = [180, 620, 1060];  // center-x of each aisle column

class GameState {
  constructor() {
    this.current        = STATE.START;
    this.lives          = 3;
    this.hints          = 2;
    this.timeLeft       = 60;
    this.cart           = [];      // { name } objects
    this.shoppingList   = [];      // [{ customer, items[] }]
    this.activeShelf    = null;
    this.hintActive     = false;
    this.hintTimer      = 0;
    this.gameOverReason = '';
  }

  reset() {
    this.current        = STATE.PLAYING;
    this.lives          = 3;
    this.hints          = 2;
    this.timeLeft       = 60;
    this.cart           = [];
    this.activeShelf    = null;
    this.hintActive     = false;
    this.hintTimer      = 0;
    this.gameOverReason = '';
    this.generateShoppingList();
  }

  generateShoppingList() {
    const pool = ['Milk','Bread','Apples','Yogurt','Pasta','Ice Cream','Cornstarch'];
    let s = [...pool].sort(() => Math.random() - 0.5);
    this.shoppingList = [
      { customer: 'Customer 1', items: [s[0], s[1]] },
      { customer: 'Customer 2', items: [s[2], s[3]] }
    ];
  }

  getRequiredItems() {
    return this.shoppingList.flatMap(c => c.items);
  }

  isItemRequired(n)  { return this.getRequiredItems().includes(n); }
  isItemCollected(n) { return this.cart.some(i => i.name === n); }

  allItemsCollected() {
    return this.getRequiredItems().every(n => this.isItemCollected(n));
  }

  useHint() {
    if (this.hints > 0 && !this.hintActive) {
      this.hints--;
      this.hintActive = true;
      this.hintTimer  = 360;
    }
  }

  tickHint() {
    if (this.hintActive && --this.hintTimer <= 0) this.hintActive = false;
  }

  loseLife() {
    if (--this.lives <= 0) {
      this.lives          = 0;
      this.current        = STATE.LOSE;
      this.gameOverReason = 'lives';
    }
  }

  tickTimer(dt) {
    if (this.current === STATE.PLAYING || this.current === STATE.SHELF) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft       = 0;
        this.current        = STATE.LOSE;
        this.gameOverReason = 'time';
      }
    }
  }

  setState(s) { this.current = s; }
}