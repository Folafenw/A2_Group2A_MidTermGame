// ============================================================
// ui.js  —  All HUD + screen drawing (NO HTML)
//
// Layout:
//   ┌─────────────────────────────────────────────────────┐
//   │  TOP BAR (70px):  Timer │ Hearts │ Hints │ Title   │
//   ├────────────────────────────────────────────┬────────┤
//   │                                            │ LIST   │
//   │          GAMEPLAY (camera view)            │ PANEL  │
//   │                                            │ 230px  │
//   └────────────────────────────────────────────┴────────┘
//
// The UI is drawn AFTER the camera transform is reset (in screen space).
// ============================================================

class UI {
  constructor() {
    this.msgText  = '';
    this.msgTimer = 0;
    this.msgCol   = PAL.white;
    this.msgY     = 0; // animated float position
  }

  showMessage(text, col) {
    this.msgText  = text;
    this.msgTimer = 140;
    this.msgCol   = col || PAL.white;
    this.msgY     = height * 0.55;
  }

  tick() {
    if (this.msgTimer > 0) this.msgTimer--;
  }

  // ── Full HUD (top bar + right panel + floating msg) ──────
  drawHUD(gs) {
    this._drawTopBar(gs);
    this._drawRightPanel(gs);
    this._drawKeyHints();
    this._drawFloatingMessage();
  }

  // ── Top Bar ───────────────────────────────────────────────
  _drawTopBar(gs) {
    // Bar background
    fill(...PAL.royalBlue);
    noStroke();
    rect(0, 0, width, TOP_BAR_H);

    // Bottom edge accent
    fill(...PAL.skyBlue);
    rect(0, TOP_BAR_H - 3, width, 3);

    // ── Timer ──────────────────────────────────────────────
    let t      = ceil(gs.timeLeft);
    let urgent = t <= 15;
    let timerX = 14;

    // Timer pill
    fill(urgent ? color(...PAL.pink) : color(0,0,0,100));
    if (urgent && frameCount % 20 < 10) fill(...PAL.pink);
    noStroke();
    rect(timerX, 12, 100, 46, 10);

    fill(...PAL.yellow);
    textSize(15);
    textAlign(LEFT, CENTER);
    text('⏱', timerX + 10, TOP_BAR_H/2);

    fill(255);
    textSize(urgent ? 22 : 20);
    textStyle(BOLD);
    text(t + 's', timerX + 34, TOP_BAR_H/2);
    textStyle(NORMAL);

    // ── Hearts ─────────────────────────────────────────────
    let heartsX = 126;
    fill(0, 0, 0, 100);
    rect(heartsX, 12, 96, 46, 10);
    textSize(22);
    textAlign(LEFT, CENTER);
    for (let i = 0; i < 3; i++) {
      fill(i < gs.lives ? color(...PAL.pink) : color(80,60,60));
      text('♥', heartsX + 10 + i * 30, TOP_BAR_H/2 + 1);
    }

    // ── Hints ──────────────────────────────────────────────
    let hintsX = 234;
    fill(0, 0, 0, 100);
    rect(hintsX, 12, 80, 46, 10);

    if (gs.hintActive) {
      fill(...PAL.yellow, 60 + 40 * sin(frameCount * 0.15));
      rect(hintsX, 12, 80, 46, 10);
    }

    fill(...PAL.gold);
    textSize(20);
    textAlign(LEFT, CENTER);
    text('💡', hintsX + 8, TOP_BAR_H/2);

    fill(255);
    textSize(16);
    textStyle(BOLD);
    text('×' + gs.hints, hintsX + 36, TOP_BAR_H/2);
    textStyle(NORMAL);

    if (gs.hintActive) {
      fill(...PAL.yellow);
      textSize(8);
      textAlign(CENTER, CENTER);
      text('ACTIVE', hintsX + 40, TOP_BAR_H - 10);
    }

    // ── Game title (center) ────────────────────────────────
    fill(...PAL.yellow);
    textSize(20);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('★  ELITE EMPLOYEE  ★', width / 2, TOP_BAR_H / 2);
    textStyle(NORMAL);

    // ── Cart counter ───────────────────────────────────────
    let required  = gs.getRequiredItems().length;
    let collected = gs.cart.length;
    let cartX     = width - RIGHT_PANEL_W - 120;
    fill(0, 0, 0, 100);
    rect(cartX, 12, 110, 46, 10);

    fill(...PAL.gold);
    textSize(20);
    textAlign(LEFT, CENTER);
    text('🛒', cartX + 8, TOP_BAR_H/2);

    fill(255);
    textSize(16);
    textStyle(BOLD);
    text(collected + ' / ' + required, cartX + 38, TOP_BAR_H/2);
    textStyle(NORMAL);
  }

  // ── Right Panel — Shopping List ───────────────────────────
  _drawRightPanel(gs) {
    let px = width  - RIGHT_PANEL_W;
    let py = TOP_BAR_H;
    let pw = RIGHT_PANEL_W;
    let ph = height - TOP_BAR_H;

    // Panel background
    fill(...PAL.darkBg, 235);
    noStroke();
    rect(px, py, pw, ph);

    // Left edge accent
    fill(...PAL.royalBlue);
    rect(px, py, 4, ph);

    // Header
    fill(...PAL.royalBlue);
    rect(px + 4, py, pw - 4, 44);
    fill(...PAL.yellow);
    textAlign(CENTER, CENTER);
    textSize(14);
    textStyle(BOLD);
    text('SHOPPING LIST', px + pw/2 + 2, py + 22);
    textStyle(NORMAL);

    // List items
    let y = py + 58;
    for (let c of gs.shoppingList) {
      // Customer label
      fill(...PAL.skyBlue);
      textAlign(LEFT, TOP);
      textSize(11);
      textStyle(BOLD);
      text(c.customer.toUpperCase(), px + 16, y);
      textStyle(NORMAL);
      y += 22;

      for (let itemName of c.items) {
        let done = gs.isItemCollected(itemName);

        // Item row background
        fill(done ? color(...PAL.darkGreen, 140) : color(255,255,255,12));
        noStroke();
        rect(px + 10, y - 2, pw - 20, 24, 4);

        // Checkbox
        stroke(done ? color(...PAL.green) : color(100,100,120));
        strokeWeight(1.5);
        fill(done ? color(...PAL.green) : color(30,30,40));
        rect(px + 16, y + 3, 16, 16, 3);
        noStroke();
        if (done) {
          fill(255);
          textSize(12);
          textAlign(CENTER, CENTER);
          text('✓', px + 24, y + 11);
        }

        // Item icon instead of name (bigger for clarity)
        fill(done ? color(...PAL.green) : color(210, 205, 195));
        textAlign(LEFT, CENTER);
        textSize(28);
        textStyle(done ? BOLD : NORMAL);
        text(ITEM_ICONS[itemName] || '?', px + 40, y + 12);
        textStyle(NORMAL);

        y += 28;
      }
      y += 14; // gap between customers
    }

    // Divider before key hints at bottom
    stroke(60, 65, 80);
    strokeWeight(1);
    line(px + 10, height - 90, px + pw - 10, height - 90);
    noStroke();

    // Key hints in panel
    const hints = [
      ['WASD / ↑↓←→', 'Move'],
      ['E',           'Interact'],
      ['H',           'Hint'],
      ['I',           'Instructions'],
      ['ESC',         'Close shelf']
    ];
    y = height - 82;
    for (let [k, v] of hints) {
      // Key badge
      fill(...PAL.royalBlue);
      rect(px + 12, y - 1, 52, 16, 3);
      fill(...PAL.yellow);
      textSize(9);
      textAlign(CENTER, CENTER);
      text(k, px + 38, y + 7);

      fill(150, 148, 140);
      textSize(9);
      textAlign(LEFT, CENTER);
      text(v, px + 70, y + 7);

      y += 18;
    }
  }

  // ── Small key hint strip at bottom of gameplay area ───────
  _drawKeyHints() {
    // Already in right panel — skip duplicate
  }

  // ── Floating feedback message ──────────────────────────────
  _drawFloatingMessage() {
    if (this.msgTimer <= 0) return;
    let a   = map(this.msgTimer, 0, 140, 0, 255);
    let yOff = map(this.msgTimer, 140, 0, 0, -30);
    push();
    // Centered in gameplay area (not under right panel)
    let cx = (width - RIGHT_PANEL_W) / 2;
    let cy = height * 0.42 + yOff;

    // Pill background
    let c = this.msgCol;
    fill(c[0], c[1], c[2], a * 0.4);
    noStroke();
    let tw = textWidth(this.msgText);
    rect(cx - tw/2 - 20, cy - 18, tw + 40, 36, 18);

    fill(c[0], c[1], c[2], a);
    textAlign(CENTER, CENTER);
    textSize(18);
    textStyle(BOLD);
    text(this.msgText, cx, cy);
    textStyle(NORMAL);
    pop();
  }

  // ── Interact Prompt (E key) ────────────────────────────────
  drawInteractPrompt(label) {
    let cx  = (width - RIGHT_PANEL_W) / 2;
    let by  = height - 50;
    let bw  = 160;

    fill(0, 0, 0, 170);
    noStroke();
    rect(cx - bw/2, by - 14, bw, 28, 14);

    fill(...PAL.yellow);
    textAlign(CENTER, CENTER);
    textSize(13);
    textStyle(BOLD);
    text('[E]  ' + label, cx, by);
    textStyle(NORMAL);
  }

  // ── Start Screen ──────────────────────────────────────────
  drawStartScreen() {
    // Gradient background
    for (let y = 0; y < height; y++) {
      let t = y / height;
      let r = lerp(18,  10, t);
      let g = lerp(20,  30, t);
      let b = lerp(55,  80, t);
      stroke(r, g, b);
      line(0, y, width, y);
    }

    // Store icon panel
    fill(0, 0, 0, 80);
    noStroke();
    rect(width/2 - 340, height/2 - 160, 680, 340, 16);
    stroke(...PAL.royalBlue, 180);
    strokeWeight(2);
    rect(width/2 - 340, height/2 - 160, 680, 340, 16);
    noStroke();

    // Title
    fill(...PAL.yellow);
    textAlign(CENTER, CENTER);
    textSize(52);
    textStyle(BOLD);
    text('ELITE EMPLOYEE', width/2, height/2 - 100);
    textStyle(NORMAL);

    // Subtitle
    fill(...PAL.skyBlue);
    textSize(16);
    text('🛒  A Fun Grocery Challenge  🛒', width/2, height/2 - 56);

    // Divider
    stroke(...PAL.royalBlue);
    strokeWeight(1);
    line(width/2 - 260, height/2 - 38, width/2 + 260, height/2 - 38);
    noStroke();

    // Feature bullets
    fill(185, 200, 230);
    textSize(13);
    textAlign(CENTER, TOP);
    const lines = [
      '• Collect all items from the shopping list before time runs out',
      '• If it gets too confusing — press  H  to reveal hints',
      '• Wrong items cost you a heart  ♥  —  lose all 3 and it\'s over',
      '• Reach the CHECKOUT counter and press E when you\'re done'
    ];
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], width/2, height/2 - 24 + i * 24);
    }

    // Start button
    let bx = width/2 - 130, by = height/2 + 112;
    fill(...PAL.amber);
    noStroke();
    rect(bx, by, 260, 48, 24);
    fill(...PAL.black);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(BOLD);
    text('PRESS  ENTER  TO  START', width/2, by + 24);
    textStyle(NORMAL);
  }

  // ── Instructions Overlay ──────────────────────────────────
  drawInstructions() {
    fill(0, 0, 0, 195);
    noStroke();
    rect(0, 0, width, height);

    let pw = min(560, width - 100);
    let ph = 440;
    let px = (width - pw) / 2;
    let py = (height - ph) / 2;

    // Panel
    fill(...PAL.darkBg);
    stroke(...PAL.royalBlue);
    strokeWeight(2);
    rect(px, py, pw, ph, 12);
    noStroke();

    // Header
    fill(...PAL.royalBlue);
    rect(px, py, pw, 50, 12, 12, 0, 0);
    fill(...PAL.yellow);
    textAlign(CENTER, CENTER);
    textSize(22);
    textStyle(BOLD);
    text('HOW TO PLAY', width/2, py + 25);
    textStyle(NORMAL);

    // Sections
    const sections = [
      { icon:'🕹',  title:'Move',        body:'WASD or Arrow Keys to walk around the store.' },
      { icon:'🛒',  title:'Shelves',     body:'Walk up to a shelf and press E to browse. Click items to collect them. ESC to leave.' },
      { icon:'📋',  title:'Your Goal',   body:'Collect every item on the shopping list (right panel) within 90 seconds.' },
      { icon:'♥',   title:'Hearts',      body:'3 lives. Picking a wrong item or failing checkout costs 1 heart.' },
      { icon:'💡',  title:'Hints',       body:'Press H to use a hint. Correct items glow and blur clears for 6 seconds. 2 hints per game.' },
      { icon:'🏪',  title:'Checkout',    body:'Go to the CHECKOUT counter (bottom of store) and press E. All correct = PROMOTION!' },
    ];

    let sy = py + 60;
    for (let s of sections) {
      // Icon circle
      fill(...PAL.royalBlue, 160);
      noStroke();
      ellipse(px + 28, sy + 14, 34, 34);
      textAlign(CENTER, CENTER);
      textSize(16);
      text(s.icon, px + 28, sy + 14);

      fill(...PAL.gold);
      textAlign(LEFT, TOP);
      textSize(13);
      textStyle(BOLD);
      text(s.title, px + 52, sy);
      textStyle(NORMAL);

      fill(175, 185, 210);
      textSize(11);
      text(s.body, px + 52, sy + 17, pw - 72, 30);

      sy += 58;
    }

    // Close hint
    fill(100, 110, 140);
    textAlign(CENTER, BOTTOM);
    textSize(12);
    text('Press  I  to close and resume the game', width/2, py + ph - 10);
  }

  // ── Win Screen ────────────────────────────────────────────
  drawWinScreen() {
    for (let y = 0; y < height; y++) {
      let t = y/height;
      stroke(lerp(10,20,t), lerp(55,80,t), lerp(20,35,t));
      line(0, y, width, y);
    }

    // Confetti effect
    randomSeed(42);
    const confettiCols = [PAL.yellow, PAL.pink, PAL.skyBlue, PAL.orange, PAL.green];
    for (let i = 0; i < 80; i++) {
      let cx = random(width), cy = random(height);
      let c = confettiCols[floor(random(confettiCols.length))];
      fill(...c, 180);
      noStroke();
      rect(cx, cy, 8, 8, 1);
    }

    fill(...PAL.yellow);
    textAlign(CENTER, CENTER);
    textSize(56);
    textStyle(BOLD);
    text('🎉  PROMOTED!  🎉', width/2, height/2 - 90);
    textStyle(NORMAL);

    fill(...PAL.offWhite);
    textSize(20);
    text('You collected all items correctly!', width/2, height/2 - 24);

    fill(...PAL.gold);
    textSize(20);
    text('Management is very impressed.', width/2, height/2 + 8);

    fill(...PAL.yellow);
    textSize(36);
    text('⭐ ⭐ ⭐ ⭐ ⭐', width/2, height/2 + 60);

    this._drawRestartButton('PLAY AGAIN', PAL.green, PAL.yellow);
  }

  // ── Lose Screen ───────────────────────────────────────────
  drawLoseScreen(gs) {
    for (let y = 0; y < height; y++) {
      let t = y/height;
      stroke(lerp(55,80,t), lerp(10,20,t), lerp(15,25,t));
      line(0, y, width, y);
    }

    fill(...PAL.pink);
    textAlign(CENTER, CENTER);
    textSize(50);
    textStyle(BOLD);
    text('★  BAD RATING  ★', width/2, height/2 - 90);
    textStyle(NORMAL);

    let reason = gs.gameOverReason === 'time'
      ? "You ran out of time!"
      : "You lost all your hearts!";

    fill(...PAL.offWhite);
    textSize(20);
    text(reason, width/2, height/2 - 24);

    fill(200, 160, 150);
    textSize(16);
    text('Better luck next shift.', width/2, height/2 + 8);

    fill(...PAL.orange);
    textSize(34);
    text('⭐ ☆ ☆ ☆ ☆', width/2, height/2 + 58);

    this._drawRestartButton('TRY AGAIN', PAL.pink, PAL.white);
  }

  _drawRestartButton(label, bg, fg) {
    let bx = width/2 - 120, by = height/2 + 108;
    fill(...bg);
    noStroke();
    rect(bx, by, 240, 48, 24);
    fill(...fg);
    textAlign(CENTER, CENTER);
    textSize(16);
    textStyle(BOLD);
    text(label, width/2, by + 24);
    textStyle(NORMAL);
  }

  isRestartClicked() {
    let bx = width/2 - 120, by = height/2 + 108;
    return mouseX >= bx && mouseX <= bx + 240 &&
           mouseY >= by && mouseY <= by + 48;
  }

  isStartClicked() {
    let bx = width/2 - 130, by = height/2 + 112;
    return mouseX >= bx && mouseX <= bx + 260 &&
           mouseY >= by && mouseY <= by + 48;
  }
}