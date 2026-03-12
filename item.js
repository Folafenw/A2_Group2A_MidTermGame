// ============================================================
// item.js  —  Grocery product on a shelf
// Accessibility simulation: blur fog, scrambled labels,
// low-contrast colours, pixel noise.
// ============================================================

// legacy emoji fallback; most items now have SVG assets loaded into
// the shared ‘assets’ dictionary in sketch.js.  If an image is missing we
// still show an emoji so the game remains functional.
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
    // make items larger per user request
    this.w         = 96;
    this.h         = 96;
    this.aisleType = aisleType || 'Dairy';
    this.hovered   = false;
    this.collected = false;
    this.icon      = ITEM_ICONS[name] || '❓';
    // try to grab an image asset that may have been preloaded in sketch.js
    this.img        = (typeof assets !== 'undefined') ? assets[name] : null;

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
    // no blur for clarity
    const blurAmt  = 0;

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
    rect(0, 0, this.w, this.h);

    if (blurAmt > 0 && !hinted) {
      let layers = blurAmt === 5 ? 4 : 2;
      for (let d = 1; d <= layers; d++) {
        let a = map(d, 1, layers, 35, 8);
        fill(...this.bgCol, a);
        noStroke();
        rect(-d, -d, this.w + d*2, this.h + d*2);
      }
    }

    noStroke();
    if (this.img) {
      // draw the loaded SVG scaled to fit the item box
      imageMode(CENTER);
      image(this.img, this.w/2, this.h/2, this.w - 12, this.h - 12);
      imageMode(CORNER);
    } else {
      textAlign(CENTER, CENTER);
      // larger icon size for bigger item
      textSize(36);
      fill(30, 30, 30);
      text(this.icon, this.w/2, this.h/2 - 6); // fallback emoji
    }

    // noise removed; visual clutter was too much
    // if (blurAmt > 0 && !hinted) {
    //   this._drawNoise(blurAmt);
    // }

    // skip label text when drawing inside a shelf overlay
    if (gs.current !== STATE.SHELF) {
      let labelText = hinted ? this.name : this.displayLabel;
      if (hinted) {
        fill(...PAL.darkGreen);
        textSize(12);
        textStyle(BOLD);
      } else {
        fill(...this.labelCol);
        textSize(10);
        textStyle(NORMAL);
      }
      textAlign(CENTER, BOTTOM);
      text(labelText, this.w/2, this.h - 3);
      textStyle(NORMAL);
    }

    if (this.collected) {
      fill(...PAL.green, 200);
      rect(0, 0, this.w, this.h);
      fill(255);
      textSize(28);
      textAlign(CENTER, CENTER);
      text('✓', this.w/2, this.h/2);
    }

    if (hinted) {
      let pulse = 40 + 30 * sin(frameCount * 0.15);
      fill(...PAL.yellow, pulse);
      noStroke();
      rect(0, 0, this.w, this.h);
    }

    pop();
  }

  _drawNoise(level) {
    // noise disabled to keep item icons clean
  }

  isMouseOver(mx, my) {
    return mx >= this.x && mx <= this.x + this.w &&
           my >= this.y && my <= this.y + this.h;
  }
}