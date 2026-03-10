// ============================================================
// shelf.js  —  Grocery shelf: long in-world rectangle + overlay
// ============================================================

// Items stocked per aisle type (renamed to Bakery, Dairy, Pantry)
const AISLE_STOCK = {
  Bakery:  ['Bread',   'Pasta',     'Cornstarch'],
  Dairy:   ['Milk',    'Yogurt',    'Ice Cream' ],
  Pantry:  ['Apples',  'Pasta',     'Cornstarch']
};

// Colour config per aisle (brand palette) — updated keys
const AISLE_THEME = {
  Bakery:  { bg: [120, 75, 20],   label: PAL.gold,    edge: PAL.amber  },
  Dairy:   { bg: PAL.royalBlue,   label: PAL.skyBlue, edge: PAL.blue   },
  Pantry:  { bg: PAL.darkGreen,   label: PAL.yellow,  edge: PAL.green  }
};

class Shelf {
  constructor(x, y, w, h, aisleType) {
    this.x         = x;
    this.y         = y;
    this.w         = w;
    this.h         = h;
    this.aisleType = aisleType;
    this.theme     = AISLE_THEME[aisleType] || AISLE_THEME.Dairy;
    this.items     = [];
    this._buildItems();
  }

  _buildItems() {
    let names    = AISLE_STOCK[this.aisleType] || [];
    let cols     = names.length;
    let itemW    = 80, itemH = 80;
    let spacing  = 30;
    let totalW   = cols * itemW + (cols - 1) * spacing;
    for (let i = 0; i < names.length; i++) {
      let ix = i * (itemW + spacing);
      this.items.push(new Item(names[i], ix, 0, this.aisleType));
    }
    this._overlayItemW    = itemW;
    this._overlaySpacing  = spacing;
    this._overlayCols     = cols;
    this._totalItemW      = totalW;
  }

  drawInWorld() {
    let t = this.theme;

    fill(0, 0, 0, 40);
    noStroke();
    rect(this.x + 4, this.y + 4, this.w, this.h, 4);

    fill(...t.bg);
    stroke(...t.edge, 200);
    strokeWeight(2);
    rect(this.x, this.y, this.w, this.h, 4);

    fill(255, 255, 255, 18);
    noStroke();
    rect(this.x, this.y, this.w, 10, 4, 4, 0, 0);

    fill(...t.edge, 180);
    rect(this.x, this.y + this.h - 10, this.w, 10, 0, 0, 4, 4);

    stroke(...t.edge, 100);
    strokeWeight(1);
    let divCount = 4;
    for (let i = 1; i < divCount; i++) {
      let dx = this.x + (this.w / divCount) * i;
      line(dx, this.y + 4, dx, this.y + this.h - 10);
    }

    noStroke();
    fill(...t.label);
    textAlign(CENTER, CENTER);
    textSize(11);
    textStyle(BOLD);
    text(this.aisleType.toUpperCase(), this.x + this.w / 2, this.y + this.h / 2);
    textStyle(NORMAL);

    let icons = (AISLE_STOCK[this.aisleType] || []).map(n => ITEM_ICONS[n] || '?');
    let spacing = this.w / (icons.length + 1);
    textSize(14);
    for (let i = 0; i < icons.length; i++) {
      fill(255, 255, 255, 160);
      text(icons[i], this.x + spacing * (i + 1), this.y + this.h / 2 - 6);
    }
  }

  drawOverlay(gs) {
    fill(0, 0, 0, 175);
    noStroke();
    rect(0, 0, width, height);

    let pw = min(700, width - 80);
    let ph = 320;
    let px = (width - pw) / 2;
    let py = (height - ph) / 2;

    fill(0, 0, 0, 80);
    rect(px + 6, py + 6, pw, ph, 12);

    fill(245, 242, 235);
    stroke(...this.theme.edge, 200);
    strokeWeight(2);
    rect(px, py, pw, ph, 10);

    fill(...this.theme.bg);
    noStroke();
    rect(px, py, pw, 44, 10, 10, 0, 0);

    fill(...this.theme.label);
    textAlign(CENTER, CENTER);
    textSize(17);
    textStyle(BOLD);
    text(this.aisleType.toUpperCase() + '  AISLE', width / 2, py + 22);
    textStyle(NORMAL);

    fill(120, 110, 100);
    textSize(10);
    text('Click an item to collect it  ·  ESC to close  ·  H for hint', width / 2, py + 52);

    let cols       = this._overlayCols;
    let itemW      = this._overlayItemW;
    let spacing    = this._overlaySpacing;
    let totalW     = this._totalItemW;
    let itemStartX = px + (pw - totalW) / 2;
    let itemStartY = py + 70;

    for (let i = 0; i < this.items.length; i++) {
      this.items[i].x = itemStartX + i * (itemW + spacing);
      this.items[i].y = itemStartY;
      this.items[i].draw(gs);
    }

    fill(...this.theme.bg, 120);
    noStroke();
    rect(px, py + ph - 36, pw, 36, 0, 0, 10, 10);

    fill(200, 195, 185);
    textSize(10);
    textAlign(CENTER, CENTER);
    text('WASD / Arrow Keys to move   •   ESC to return to store', width / 2, py + ph - 18);
  }

  handleClick(mx, my, gs) {
    if (!gs.activeShelf) return null;
    for (let item of this.items) {
      if (!item.collected && item.isMouseOver(mx, my)) return item;
    }
    return null;
  }

  updateHover(mx, my) {
    for (let item of this.items) item.hovered = item.isMouseOver(mx, my);
  }

  isPlayerNear(wx, wy, margin = 70) {
    return wx > this.x - margin && wx < this.x + this.w + margin &&
           wy > this.y - margin && wy < this.y + this.h + margin;
  }
}