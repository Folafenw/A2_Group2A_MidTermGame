// ============================================================
// npc.js  —  NPC Shoppers wandering the store
// Simple wander: pick direction → walk 2-5s → pause → repeat
// Avoid shelves / walls using the same collider list as player.
// ============================================================

const NPC_COLOURS = [
  PAL.pink, PAL.orange, PAL.skyBlue, PAL.green, PAL.blush, PAL.gold
];

class NPC {
  constructor(x, y, colorIndex) {
    this.x       = x;
    this.y       = y;
    this.w       = 20;
    this.h       = 24;
    this.speed   = 1.0 + Math.random() * 0.6;
    this.color   = NPC_COLOURS[colorIndex % NPC_COLOURS.length];

    // Wander state
    this.dx          = 0;
    this.dy          = 0;
    this.wanderTimer = 0;       // frames left moving in current dir
    this.pauseTimer  = 0;       // frames left pausing
    this.facing      = 'down';
    this.walkFrame   = 0;
    this.walkTimer   = 0;

    this._pickNewDirection();
  }

  _pickNewDirection() {
    // Choose one of 8 directions or a pause
    let pause = Math.random() < 0.25;
    if (pause) {
      this.dx = 0; this.dy = 0;
      this.pauseTimer  = floor(random(40, 100));
      this.wanderTimer = 0;
    } else {
      let angle = random(TWO_PI);
      this.dx = cos(angle) * this.speed;
      this.dy = sin(angle) * this.speed;
      this.wanderTimer = floor(random(80, 240)); // 1.3–4 seconds at 60fps
      this.pauseTimer  = 0;
      // Set facing
      if      (abs(this.dx) > abs(this.dy)) this.facing = this.dx > 0 ? 'right' : 'left';
      else                                   this.facing = this.dy > 0 ? 'down'  : 'up';
    }
  }

  update(colliders) {
    // Countdown timers
    if (this.pauseTimer > 0) {
      this.pauseTimer--;
      if (this.pauseTimer <= 0) this._pickNewDirection();
      return;
    }

    if (this.wanderTimer > 0) {
      this.wanderTimer--;
      if (this.wanderTimer <= 0) this._pickNewDirection();

      // Walk animation
      this.walkTimer++;
      if (this.walkTimer > 10) { this.walkFrame = (this.walkFrame + 1) % 4; this.walkTimer = 0; }

      // Move X
      let nx = constrain(this.x + this.dx, 10, WORLD_W - this.w - 10);
      if (!this._hits(nx, this.y, colliders)) {
        this.x = nx;
      } else {
        this._pickNewDirection(); // bounce off obstacle
      }

      // Move Y
      let ny = constrain(this.y + this.dy, 10, WORLD_H - this.h - 10);
      if (!this._hits(this.x, ny, colliders)) {
        this.y = ny;
      } else {
        this._pickNewDirection();
      }
    }
  }

  _hits(px, py, colliders) {
    for (let c of colliders) {
      if (px + this.w > c.x && px < c.x + c.w &&
          py + this.h > c.y && py < c.y + c.h) return true;
    }
    return false;
  }

  draw() {
    push();
    translate(this.x, this.y);

    let moving = (this.dx !== 0 || this.dy !== 0) && this.pauseTimer === 0;
    let legBob = moving ? (this.walkFrame % 2 === 0 ? 1 : -1) : 0;

    // Shadow
    fill(0, 0, 0, 35);
    noStroke();
    ellipse(this.w/2, this.h + 2, this.w, 6);

    // Shoes
    fill(...PAL.black);
    rect(3,  this.h - 5, 6, 5, 1);
    rect(11, this.h - 5, 6, 5, 1);

    // Trousers (dark)
    fill(60, 60, 80);
    rect(3,  this.h - 12 + legBob, 6, 8);
    rect(11, this.h - 12 - legBob, 6, 8);

    // Body / coat
    fill(...this.color);
    rect(2, 10, this.w - 4, 12, 3);

    // Head
    fill(255, 210, 172);
    rect(5, 1, 11, 11, 4);

    // Hair (varied)
    fill(80, 60, 40);
    rect(5, 1, 11, 3, 4, 4, 0, 0);

    // Eyes (only if facing forward)
    if (this.facing !== 'up') {
      fill(40, 40, 40);
      rect(7, 5, 2, 2);
      rect(12, 5, 2, 2);
    }

    // Cart icon the NPC is pushing (simple)
    if (this.pauseTimer > 20) {
      fill(200, 190, 160);
      noStroke();
      rect(this.w + 1, 10, 10, 7, 2);
      stroke(170, 160, 130);
      strokeWeight(1);
      line(this.w + 3, 17, this.w + 3, 19);
      line(this.w + 8, 17, this.w + 8, 19);
      noStroke();
      fill(80, 80, 80);
      ellipse(this.w + 3, 20, 3, 3);
      ellipse(this.w + 8, 20, 3, 3);
    }

    pop();
  }
}