// ============================================================
// shelf.js  —  Grocery shelf: long in-world rectangle + overlay
// ============================================================

// Items stocked per aisle type.  Each aisle has three shelves (row 0,1,2)
// and we specify an array for every shelf.  Names must match the keys used in
// sketch.js when loading SVG assets.
const AISLE_STOCK = {
  Bakery: [
    ['White Bread', 'Wheat Bread', 'Sourdough'],
    ['Vanilla Cupcake', 'Blueberry Cupcake', 'Mint Cupcake'],
    ['Cherry Donut', 'Orange Zest Donut', 'Strawberry Donut']
  ],
  Dairy: [
    ['2% Milk', 'Almond Milk', 'Soy Milk'],
    ['Cherry Icecream', 'Rhubarb Icecream', 'Strawberry Icecream'],
    ['Blue Cheese', 'Cheddar Cheese', 'Parmesan Cheese']
  ],
  Pantry: [
    ['Avocado Oil', 'Olive Oil', 'Sunflower Oil'],
    ['Almond Flour', 'White Flour', 'Whole wheat'],
    ['White Sugar', 'Brown Sugar', 'Pasta']
  ]
};

// Colour config per aisle (brand palette) — updated keys
const AISLE_THEME = {
  Bakery:  { bg: [120, 75, 20],   label: PAL.gold,    edge: PAL.amber  },
  Dairy:   { bg: PAL.royalBlue,   label: PAL.skyBlue, edge: PAL.blue   },
  Pantry:  { bg: PAL.darkGreen,   label: PAL.yellow,  edge: PAL.green  }
};

class Shelf {
  // added row index so we know which subset of stock to pull
  constructor(x, y, w, h, aisleType, rowIndex = 0) {
    this.x         = x;
    this.y         = y;
    this.w         = w;
    this.h         = h;
    this.aisleType = aisleType;
    this.rowIndex  = rowIndex;
    this.theme     = AISLE_THEME[aisleType] || AISLE_THEME.Dairy;
    this.items     = [];
    this._buildItems();
  }

  _buildItems() {
    // look up the shelf‑specific array (may be undefined if configuration
    // is wrong; default to empty list)
    let shelves = AISLE_STOCK[this.aisleType] || [];
    let names   = shelves[this.rowIndex] || [];

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

    // icons removed from top of shelf — products only appear when shelf is opened
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

    // Calculate sizing dynamically so items spread out and grow when
    // there are few of them.  previously we used fixed constants which left
    // everything cramped in the middle of the overlay.
    let cols = this.items.length;
    // parameters for vertical alignment (header is fixed 70px high, footer
    // reserved space for the controls text at bottom)
    let headerH = 70;
    let footerH = 60;
    let availH = ph - headerH - footerH;

    if (cols > 0) {
      // horizontal padding within panel
      const pad = 40;
      // maximum item size we allow
      const maxSize = 120;
      // compute available width after padding
      let availW = pw - pad * 2;
      // start with equal sizes
      let itemW = min(maxSize, floor((availW - (cols - 1) * 20) / cols));
      // if there's leftover space, distribute as spacing
      let spacing = cols > 1 ? (availW - cols * itemW) / (cols - 1) : 0;
      // reposition items so entire group is centered horizontally
      let totalW = cols * itemW + (cols - 1) * spacing;
      let itemStartX = px + (pw - totalW) / 2;

      // now that we know itemW we can vertically centre
      let itemStartY = py + headerH + (availH / 2) - (itemW / 2);

      for (let i = 0; i < cols; i++) {
        let itm = this.items[i];
        itm.w = itemW;
        itm.h = itemW;
        itm.x = itemStartX + i * (itemW + spacing);
        itm.y = itemStartY;
        itm.draw(gs);
      }
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