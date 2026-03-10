// ============================================================
// item.js  —  Grocery product on a shelf
// Accessibility simulation: blur fog, scrambled labels,
// low-contrast colours, pixel noise.
// ============================================================

const ITEM_ICONS = {
  'Milk':       '🥛',
  'Bread':      '🍞',
  'Apples':     '🍎',
  'Yogurt':     '🫙',
  'Pasta':      '🍝',
  'Ice Cream':  '🍦',
  'Cornstarch': '📦'
};

// Low-contrast label colours per aisle type — updated to Bakery/Dairy/Pantry
const LABEL_COLS = {
  Bakery:  [[170,140, 80],[180,150, 90],[165,135, 75]],
  Dairy:   [[ 80,130,170],[ 90,140,180],[ 75,125,165]],
  Pantry:  [[100,155, 80],[110,160, 90],[ 90,145, 75]]
};

class Item {
  constructor(name, x, y, aisleType) {
    this.name      = name;
    this.x         = x;
    this.y         = y;
    this.w         = 80;
    this.h         = 80;
    this.aisleType = aisleType || 'Dairy';
    this.hovered   = false;
    this.collected = false;
    this.icon      = ITEM_ICONS[name] || '❓';

    this.displayLabel = this._makeLabel(name);
    this.bgCol        = this._pickBg();
    this.labelCol     = this._pickLabel();
  }

  _makeLabel(name) {
    const r = Math.random();
    if      (r < 0.20) return this._scramble(name);
    else if (r < 0.35) return name + '?';
    else if (r < 0.45) return name.toUpperCase().split('').join(' ');
    return name;
  }

  _scramble(s) {
    let a = s.split('');
    if (a.length >= 3) {
      let i = floor(random(a.length - 1));
      [a[i], a[i+1]] = [a[i+1], a[i]];
    }
    return a.join('');
  }

  _pickBg() {
    const opts = {
      Bakery:  [[225,205,170],[230,210,175],[220,200,165]],
      Dairy:   [[175,205,225],[180,210,230],[170,200,220]],
      Pantry:  [[185,215,175],[190,220,180],[178,208,168]]
    };
    let arr = opts[this.aisleType] || opts.Dairy;
    return arr[floor(random(arr.length))];
  }

  _pickLabel() {
    let arr = LABEL_COLS[this.aisleType] || LABEL_COLS.Dairy;
    return arr[floor(random(arr.length))];
  }

  draw(gs) {
    const isReq    = gs.isItemRequired(this.name);
    const hinted   = gs.hintActive && isReq;
    const blurAmt  = hinted ? 0 : (isReq ? 5 : 3);

    push();
    translate(this.x, this.y);

    if (hinted) {
      stroke(...PAL.green); strokeWeight(3);
    } else if (this.hovered) {
      stroke(...PAL.gold, 200); strokeWeight(2);
    } else {
      stroke(180,175,165,120); strokeWeight(1);
    }

    fill(...this.bgCol);
    rect(0, 0, this.w, this.h, 8);

    if (blurAmt > 0 && !hinted) {
      let layers = blurAmt === 5 ? 4 : 2;
      for (let d = 1; d <= layers; d++) {
        let a = map(d, 1, layers, 35, 8);
        fill(...this.bgCol, a);
        noStroke();
        rect(-d, -d, this.w + d*2, this.h + d*2, 8);
      }
    }

    noStroke();
    textAlign(CENTER, CENTER);
    textSize(30);
    if (blurAmt > 0 && !hinted) {
      fill(60, 60, 60, 140);
    } else {
      fill(30, 30, 30);
    }
    text(this.icon, this.w/2, this.h/2 - 6);

    if (blurAmt > 0 && !hinted) {
      this._drawNoise(blurAmt);
    }

    let labelText = hinted ? this.name : this.displayLabel;
    if (hinted) {
      fill(...PAL.darkGreen);
      textSize(11);
      textStyle(BOLD);
    } else {
      fill(...this.labelCol);
      textSize(9);
      textStyle(NORMAL);
    }
    textAlign(CENTER, BOTTOM);
    text(labelText, this.w/2, this.h - 3);
    textStyle(NORMAL);

    if (this.collected) {
      fill(...PAL.green, 200);
      rect(0, 0, this.w, this.h, 8);
      fill(255);
      textSize(28);
      textAlign(CENTER, CENTER);
      text('✓', this.w/2, this.h/2);
    }

    if (hinted) {
      let pulse = 40 + 30 * sin(frameCount * 0.15);
      fill(...PAL.yellow, pulse);
      noStroke();
      rect(0, 0, this.w, this.h, 8);
    }

    pop();
  }

  _drawNoise(level) {
    let gs = 10;
    let density = level === 5 ? 0.12 : 0.06;
    noStroke();
    for (let px = 0; px < this.w; px += gs) {
      for (let py = 0; py < this.h; py += gs) {
        if (Math.random() < density) {
          fill(255, 255, 255, 40);
          rect(px, py, gs, gs);
        }
      }
    }
  }

  isMouseOver(mx, my) {
    return mx >= this.x && mx <= this.x + this.w &&
           my >= this.y && my <= this.y + this.h;
  }
}