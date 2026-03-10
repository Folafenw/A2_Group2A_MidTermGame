// ============================================================
// store.js  —  Top-down grocery store world
//
// Layout (world-space):
//   ┌──────────────────────────────────────┐
//   │  top wall                            │
//   │  [Bakery]    [Dairy]    [Pantry]     │  ← aisle signs
//   │  ┌──────┐  ┌──────┐  ┌──────┐       │
//   │  │shelf │  │shelf │  │shelf │       │
//   │  │shelf │  │shelf │  │shelf │       │
//   │  │shelf │  │shelf │  │shelf │       │
//   │  └──────┘  └──────┘  └──────┘       │
//   │   walkway   walkway   walkway        │
//   │                                      │
//   │         [CHECKOUT]                   │
//   └──────────────────────────────────────┘
// ============================================================

class Store {
  constructor() {
    this.shelves  = [];
    this.npcs     = [];

    // Checkout counter (world space)
    this.checkoutX = WORLD_W / 2 - 90;
    this.checkoutY = WORLD_H - 160;
    this.checkoutW = 180;
    this.checkoutH = 50;

    this._buildShelves();
    this._spawnNPCs();
  }

  _buildShelves() {
    // Three aisles, THREE shelf rows each (down from four).
    const shelfW = 280;
    const shelfH = 42;
    const row1Y  = 180;
    const row2Y  = 340;
    const row3Y  = 500;

    // Renamed aisles: Bakery, Dairy, Pantry
    const aisles = [
      { cx: 260,  type: 'Bakery'  },
      { cx: 700,  type: 'Dairy'   },
      { cx: 1140, type: 'Pantry'  }
    ];

    for (let a of aisles) {
      let lx = a.cx - shelfW / 2;
      this.shelves.push(new Shelf(lx, row1Y, shelfW, shelfH, a.type));
      this.shelves.push(new Shelf(lx, row2Y, shelfW, shelfH, a.type));
      this.shelves.push(new Shelf(lx, row3Y, shelfW, shelfH, a.type));
    }
  }

  _spawnNPCs() {
    const spawnPoints = [
      { x: 460, y: 300 },
      { x: 900, y: 420 },
      { x: 350, y: 550 },
      { x: 830, y: 280 },
      { x: 550, y: 650 },
    ];
    for (let i = 0; i < spawnPoints.length; i++) {
      this.npcs.push(new NPC(spawnPoints[i].x, spawnPoints[i].y, i));
    }
  }

  getColliders() {
    let cols = [...this.shelves];
    cols.push({ x: this.checkoutX, y: this.checkoutY, w: this.checkoutW, h: this.checkoutH });
    cols.push({ x: 0,          y: 0,          w: WORLD_W, h: 20        });
    cols.push({ x: 0,          y: WORLD_H-20, w: WORLD_W, h: 20        });
    cols.push({ x: 0,          y: 0,          w: 20,       h: WORLD_H  });
    cols.push({ x: WORLD_W-20, y: 0,          w: 20,       h: WORLD_H  });
    return cols;
  }

  update() {
    let cols = this.getColliders();
    for (let npc of this.npcs) npc.update(cols);
  }

  draw(gs) {
    this._drawFloor();
    this._drawWalls();
    this._drawAisleMarkings();
    this._drawDecor();
    for (let s of this.shelves)  s.drawInWorld();
    this._drawCheckout(gs);
    for (let npc of this.npcs)   npc.draw();
  }

  _drawFloor() {
    let ts = 48;
    for (let x = 0; x < WORLD_W; x += ts) {
      for (let y = 0; y < WORLD_H; y += ts) {
        let odd = (floor(x/ts) + floor(y/ts)) % 2;
        fill(odd ? 232 : 224, odd ? 228 : 220, odd ? 218 : 210);
        noStroke();
        rect(x, y, ts, ts);
      }
    }
  }

  _drawWalls() {
    // Top wall — plain dark strip, no store name
    fill(...PAL.royalBlue);
    noStroke();
    rect(0, 0, WORLD_W, 110);

    // Side walls
    fill(...PAL.black);
    rect(0,          0, 20, WORLD_H);
    rect(WORLD_W-20, 0, 20, WORLD_H);

    // Bottom wall
    fill(60, 55, 50);
    rect(0, WORLD_H - 20, WORLD_W, 20);

    // No store name or tagline — removed as requested
  }

  _drawAisleMarkings() {
    stroke(...PAL.gold, 80);
    strokeWeight(2);
    setLineDash([16, 12]);

    let laneXs = [450, 880];
    for (let lx of laneXs) {
      line(lx, 130, lx, WORLD_H - 30);
    }
    setLineDash([]);
    noStroke();

    // Updated aisle signs: Bakery, Dairy, Pantry
    const aisles = [
      { label: '🥐  BAKERY',  cx: 260  },
      { label: '🥛  DAIRY',   cx: 700  },
      { label: '🫙  PANTRY',  cx: 1140 }
    ];
    for (let a of aisles) {
      fill(...PAL.amber);
      stroke(...PAL.gold);
      strokeWeight(1);
      rect(a.cx - 80, 112, 160, 32, 4);

      stroke(...PAL.gold, 150);
      line(a.cx, 110, a.cx, 112);
      noStroke();

      fill(...PAL.black);
      textAlign(CENTER, CENTER);
      textSize(13);
      textStyle(BOLD);
      text(a.label, a.cx, 128);
      textStyle(NORMAL);
    }
  }

  _drawDecor() {
    this._drawPlant(40, 130);
    this._drawPlant(WORLD_W - 60, 130);

    fill(...PAL.green, 160);
    stroke(...PAL.darkGreen);
    strokeWeight(1);
    rect(WORLD_W/2 - 100, WORLD_H - 22, 200, 18, 3);
    fill(...PAL.yellow);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(10);
    text('ENTRANCE / EXIT', WORLD_W/2, WORLD_H - 13);
  }

  _drawPlant(x, y) {
    fill(...PAL.amber);
    noStroke();
    rect(x, y + 20, 20, 16, 2);
    fill(...PAL.green);
    ellipse(x + 10, y + 18, 22, 22);
    fill(...PAL.darkGreen);
    ellipse(x + 10, y + 14, 14, 14);
  }

  _drawCheckout(gs) {
    let cx = this.checkoutX;
    let cy = this.checkoutY;
    let cw = this.checkoutW;
    let ch = this.checkoutH;

    fill(0, 0, 0, 40);
    noStroke();
    rect(cx + 4, cy + 4, cw, ch, 6);

    fill(...PAL.darkGreen);
    stroke(...PAL.green);
    strokeWeight(2);
    rect(cx, cy, cw, ch, 6);

    fill(...PAL.green, 180);
    noStroke();
    rect(cx, cy, cw, 14, 6, 6, 0, 0);

    fill(40, 40, 40);
    rect(cx + cw/2 - 18, cy + 8, 36, 24, 4);
    fill(...PAL.green);
    rect(cx + cw/2 - 12, cy + 12, 24, 10, 2);

    fill(80, 80, 80);
    rect(cx + 10, cy + 32, cw - 20, 8, 2);
    fill(100, 100, 100);
    for (let bx = cx + 16; bx < cx + cw - 14; bx += 16) {
      rect(bx, cy + 33, 2, 6);
    }

    fill(...PAL.yellow);
    textAlign(CENTER, CENTER);
    textSize(11);
    textStyle(BOLD);
    text('✦  CHECKOUT  ✦', cx + cw / 2, cy + ch + 14);
    textStyle(NORMAL);
  }

  getNearbyShelf(wx, wy) {
    for (let s of this.shelves) {
      if (s.isPlayerNear(wx, wy)) return s;
    }
    return null;
  }

  isPlayerNearCheckout(wx, wy, margin = 70) {
    return wx > this.checkoutX - margin && wx < this.checkoutX + this.checkoutW + margin &&
           wy > this.checkoutY - margin && wy < this.checkoutY + this.checkoutH + margin;
  }
}

function setLineDash(list) {
  drawingContext.setLineDash(list);
}