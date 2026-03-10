// ============================================================
// player.js  —  Player character
// Distinguished from NPCs with:
//   • Bright white outline glow
//   • Slightly larger size
//   • Vivid amber uniform (vs NPC muted coats)
//   • Shopping cart pushed in front
// ============================================================

class Player {
  constructor(x, y) {
    this.x          = x;
    this.y          = y;
    this.w          = 22;
    this.h          = 26;
    this.speed      = 3.2;
    this.facing     = 'down';
    this.walkFrame  = 0;
    this.walkTimer  = 0;
    this.flashTimer = 0;
    this.moving     = false;
  }

  update(keys, colliders) {
    let dx = 0, dy = 0;

    if (keys['ArrowLeft']  || keys['a'] || keys['A']) { dx = -this.speed; this.facing = 'left';  }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx =  this.speed; this.facing = 'right'; }
    if (keys['ArrowUp']    || keys['w'] || keys['W']) { dy = -this.speed; this.facing = 'up';    }
    if (keys['ArrowDown']  || keys['s'] || keys['S']) { dy =  this.speed; this.facing = 'down';  }

    this.moving = (dx !== 0 || dy !== 0);
    if (this.moving) {
      this.walkTimer++;
      if (this.walkTimer > 7) { this.walkFrame = (this.walkFrame + 1) % 4; this.walkTimer = 0; }
    }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    let nx = constrain(this.x + dx, 0, WORLD_W - this.w);
    if (!this._hits(nx, this.y, colliders)) this.x = nx;

    let ny = constrain(this.y + dy, 0, WORLD_H - this.h);
    if (!this._hits(this.x, ny, colliders)) this.y = ny;

    if (this.flashTimer > 0) this.flashTimer--;
  }

  _hits(px, py, colliders) {
    for (let c of colliders) {
      if (px + this.w > c.x && px < c.x + c.w &&
          py + this.h > c.y && py < c.y + c.h) return true;
    }
    return false;
  }

  flash() { this.flashTimer = 35; }

  draw() {
    push();
    translate(this.x, this.y);

    // ── Bright white outline — makes player stand out clearly ─
    noFill();
    stroke(255, 255, 255, 220);
    strokeWeight(3);
    rect(-3, -3, this.w + 6, this.h + 6, 5);
    noStroke();

    // Ground shadow
    fill(0, 0, 0, 45);
    noStroke();
    ellipse(this.w/2, this.h + 3, this.w * 1.2, 7);

    // Flash aura on wrong pick
    if (this.flashTimer > 0) {
      let a = map(this.flashTimer, 0, 35, 0, 160);
      fill(...PAL.pink, a);
      noStroke();
      ellipse(this.w/2, this.h/2, this.w + 16, this.h + 16);
    }

    // ── Pixel-art player body ──────────────────────────────────
    let legBob = this.moving ? (this.walkFrame % 2 === 0 ? 1 : -1) : 0;

    // Shoes
    fill(...PAL.black);
    noStroke();
    rect(3,  this.h - 6, 7, 6, 2);
    rect(12, this.h - 6, 7, 6, 2);

    // Trousers — royalBlue
    fill(...PAL.royalBlue);
    rect(3,  this.h - 14 + legBob, 7, 9);
    rect(12, this.h - 14 - legBob, 7, 9);

    // Apron / torso — bright amber (stands out vs NPC muted coats)
    fill(...PAL.amber);
    rect(2, 10, this.w - 4, 14, 3);

    // Collar strip — skyBlue
    fill(...PAL.skyBlue);
    rect(5, 10, this.w - 10, 5, 2);

    // Head
    fill(255, 215, 175);
    rect(5, 1, 13, 12, 4);

    // Eyes
    fill(...PAL.black);
    if (this.facing !== 'up') {
      rect(7,  5, 2, 2);
      rect(13, 5, 2, 2);
    }

    // Hair
    fill(...PAL.black);
    rect(5, 1, 13, 3, 4, 4, 0, 0);

    // Name badge
    fill(255, 255, 255, 180);
    noStroke();
    rect(5, 15, 12, 6, 1);
    fill(...PAL.royalBlue);
    textSize(5);
    textAlign(CENTER, CENTER);
    text('YOU', 11, 18);

    // ── Shopping cart (pushed to the right of player) ─────────
    let cartX = this.w + 4;
    let cartY = 8;

    // Cart basket
    fill(220, 215, 200);
    noStroke();
    rect(cartX, cartY, 18, 12, 2);

    // Cart front opening
    fill(200, 195, 178);
    rect(cartX + 14, cartY + 2, 4, 8, 1);

    // Cart handle bar
    stroke(160, 155, 140);
    strokeWeight(2);
    line(cartX - 2, cartY + 4, cartX, cartY + 4);
    noStroke();

    // Cart frame legs
    stroke(170, 165, 150);
    strokeWeight(1);
    line(cartX + 2,  cartY + 12, cartX + 2,  cartY + 17);
    line(cartX + 14, cartY + 12, cartX + 14, cartY + 17);
    noStroke();

    // Wheels
    fill(60, 60, 60);
    ellipse(cartX + 2,  cartY + 18, 5, 5);
    ellipse(cartX + 14, cartY + 18, 5, 5);

    // Wheel shine
    fill(120, 120, 120);
    ellipse(cartX + 2,  cartY + 17, 2, 2);
    ellipse(cartX + 14, cartY + 17, 2, 2);

    pop();
  }

  cx() { return this.x + this.w / 2; }
  cy() { return this.y + this.h / 2; }
}