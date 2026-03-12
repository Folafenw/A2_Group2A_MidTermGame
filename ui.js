// ============================================================
// ui.js  —  All HUD + screen drawing (NO HTML)
// ============================================================

class UI {
  constructor() {
    this.msgText  = '';
    this.msgTimer = 0;
    this.msgCol   = PAL.white;
    this.msgY     = 0;
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

  // ── Full HUD ─────────────────────────────────────────────
  drawHUD(gs) {
    this._drawTopBar(gs);
    this._drawRightPanel(gs);
    this._drawKeyHints();
    this._drawFloatingMessage();
  }

  // ── Top Bar ───────────────────────────────────────────────
  _drawTopBar(gs) {
    fill(...PAL.royalBlue);
    noStroke();
    rect(0, 0, width, TOP_BAR_H);
    fill(...PAL.skyBlue);
    rect(0, TOP_BAR_H - 3, width, 3);

    // Timer
    let t      = ceil(gs.timeLeft);
    let urgent = t <= 15;
    let timerX = 14;
    fill(urgent ? color(...PAL.pink) : color(0,0,0,100));
    if (urgent && frameCount % 20 < 10) fill(...PAL.pink);
    noStroke();
    rect(timerX, 12, 100, 46, 10);
    fill(...PAL.yellow);
    textSize(15); textAlign(LEFT, CENTER);
    text('⏱', timerX + 10, TOP_BAR_H/2);
    fill(255);
    textSize(urgent ? 22 : 20); textStyle(BOLD);
    text(t + 's', timerX + 34, TOP_BAR_H/2);
    textStyle(NORMAL);

    // Hearts
    let heartsX = 126;
    fill(0,0,0,100); noStroke();
    rect(heartsX, 12, 96, 46, 10);
    textSize(22); textAlign(LEFT, CENTER);
    for (let i = 0; i < 3; i++) {
      fill(i < gs.lives ? color(...PAL.pink) : color(80,60,60));
      text('♥', heartsX + 10 + i * 30, TOP_BAR_H/2 + 1);
    }

    // Hints
    let hintsX = 234;
    fill(0,0,0,100); noStroke();
    rect(hintsX, 12, 80, 46, 10);
    if (gs.hintActive) {
      fill(...PAL.yellow, 60 + 40 * sin(frameCount * 0.15));
      rect(hintsX, 12, 80, 46, 10);
    }
    fill(...PAL.gold); textSize(20); textAlign(LEFT, CENTER);
    text('💡', hintsX + 8, TOP_BAR_H/2);
    fill(255); textSize(16); textStyle(BOLD);
    text('×' + gs.hints, hintsX + 36, TOP_BAR_H/2);
    textStyle(NORMAL);
    if (gs.hintActive) {
      fill(...PAL.yellow); textSize(8); textAlign(CENTER, CENTER);
      text('ACTIVE', hintsX + 40, TOP_BAR_H - 10);
    }

    // Title
    fill(...PAL.yellow); textSize(20); textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('★  ELITE EMPLOYEE  ★', width / 2, TOP_BAR_H / 2);
    textStyle(NORMAL);

    // Cart counter
    let required  = gs.getRequiredItems().length;
    let collected = gs.cart.length;
    let cartX     = width - RIGHT_PANEL_W - 120;
    fill(0,0,0,100); noStroke();
    rect(cartX, 12, 110, 46, 10);
    fill(...PAL.gold); textSize(20); textAlign(LEFT, CENTER);
    text('🛒', cartX + 8, TOP_BAR_H/2);
    fill(255); textSize(16); textStyle(BOLD);
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
    fill(...PAL.darkBg, 235); noStroke();
    rect(px, py, pw, ph);
    // Left accent strip
    fill(...PAL.royalBlue);
    rect(px, py, 4, ph);
    // Header
    fill(...PAL.royalBlue);
    rect(px + 4, py, pw - 4, 44);
    fill(...PAL.yellow); textAlign(CENTER, CENTER); textSize(14); textStyle(BOLD);
    text('SHOPPING LIST', px + pw/2 + 2, py + 22);
    textStyle(NORMAL);

    // Work out how many items there are so we can size cards to fill the panel
    let allItems = gs.shoppingList.flatMap(c => c.items);
    let n        = allItems.length;
    if (n === 0) return;

    // Available height below header, with a small bottom margin
    let availH   = ph - 44 - 10;
    // Each card: name row (22px) + image box + gap (8px between cards)
    let gapH     = 8;
    let nameH    = 20;
    // Image box fills whatever is left
    let imgH     = floor((availH - n * (nameH + gapH)) / n);
    imgH         = max(imgH, 40);   // never collapse below 40px

    // Checkbox sits to the left; image fills the rest
    const cbSize = 24;
    const margin = 8;               // horizontal margin inside panel
    const cbX    = px + 4 + margin; // left edge of checkbox
    const imgX   = cbX + cbSize + margin; // left edge of image card
    const imgW   = pw - 4 - margin - cbSize - margin - margin; // right margin too

    let y = py + 44 + gapH;

    for (let c of gs.shoppingList) {
      for (let itemName of c.items) {
        let done = gs.isItemCollected(itemName);
        let cardH = nameH + imgH;

        // ── Item name label ───────────────────────────────
        fill(done ? color(...PAL.green) : color(200, 200, 210));
        textAlign(LEFT, CENTER); textSize(11);
        textStyle(done ? BOLD : NORMAL);
        text(itemName, imgX, y + nameH / 2);
        textStyle(NORMAL);

        // ── Image card (white background like screenshot) ─
        let imgCardY = y + nameH;
        fill(done ? color(200, 235, 210) : color(255, 255, 255, 230)); noStroke();
        rect(imgX, imgCardY, imgW, imgH, 4);

        // Product image or fallback emoji
        let img = (typeof assets !== 'undefined') ? assets[itemName] : null;
        if (img) {
          let pad  = 6;
          let size = min(imgW - pad*2, imgH - pad*2);
          imageMode(CENTER);
          tint(done ? 160 : 255);
          image(img, imgX + imgW/2, imgCardY + imgH/2, size, size);
          noTint();
          imageMode(CORNER);
        } else {
          // Fallback: emoji centred in card
          textAlign(CENTER, CENTER);
          textSize(min(imgH * 0.55, 36));
          fill(done ? color(100,160,100) : color(60, 60, 60));
          let icon = (typeof ITEM_ICONS !== 'undefined' && ITEM_ICONS[itemName]) ? ITEM_ICONS[itemName] : '?';
          text(icon, imgX + imgW/2, imgCardY + imgH/2);
        }

        // Collected green overlay + tick
        if (done) {
          fill(...PAL.green, 55); noStroke();
          rect(imgX, imgCardY, imgW, imgH, 4);
          fill(...PAL.green); textSize(imgH * 0.45); textAlign(CENTER, CENTER);
          text('✓', imgX + imgW/2, imgCardY + imgH/2);
        }

        // ── Checkbox (left of image) ──────────────────────
        let cbY = imgCardY + (imgH - cbSize) / 2;
        stroke(done ? color(...PAL.green) : color(110, 115, 140));
        strokeWeight(1.5);
        fill(done ? color(...PAL.darkGreen, 180) : color(25, 28, 42));
        rect(cbX, cbY, cbSize, cbSize, 5);
        noStroke();
        if (done) {
          fill(255); textSize(14); textAlign(CENTER, CENTER);
          text('✓', cbX + cbSize/2, cbY + cbSize/2);
        }

        y += cardH + gapH;
      }
    }
  }

  // ── Key hints — fixed strip along the bottom of the LEFT gameplay area ──
  _drawKeyHints() {
    const hints = [
      ['WASD/↑↓←→', 'Move'],
      ['E',          'Interact'],
      ['H',          'Hint'],
      ['I',          'Instructions'],
      ['ESC',        'Close shelf']
    ];

    const stripH   = 26;          // height of each row
    const rows     = hints.length;
    const totalH   = rows * stripH + 10;   // +10 top padding
    const panelW   = 210;         // width of this hints panel
    const px       = 8;
    const py       = height - totalH - 8;  // 8px above screen bottom

    // Panel background
    fill(0, 0, 0, 160); noStroke();
    rect(px, py, panelW, totalH + 4, 8);

    // Title
    fill(...PAL.skyBlue); textSize(9); textAlign(LEFT, TOP);
    text('CONTROLS', px + 8, py + 5);

    let ky = py + 18;
    for (let [k, v] of hints) {
      // Key badge
      fill(...PAL.royalBlue); noStroke();
      rect(px + 8, ky, 58, 18, 4);
      fill(...PAL.yellow); textSize(9); textAlign(CENTER, CENTER);
      text(k, px + 37, ky + 9);

      // Description
      fill(200, 200, 200); textSize(9); textAlign(LEFT, CENTER);
      text(v, px + 72, ky + 9);

      ky += stripH;
    }
  }

  // ── Floating feedback message ──────────────────────────────
  _drawFloatingMessage() {
    if (this.msgTimer <= 0) return;
    let a    = map(this.msgTimer, 0, 140, 0, 255);
    let yOff = map(this.msgTimer, 140, 0, 0, -30);
    push();
    let cx = (width - RIGHT_PANEL_W) / 2;
    let cy = height * 0.42 + yOff;
    let c  = this.msgCol;
    fill(c[0], c[1], c[2], a * 0.4); noStroke();
    let tw = textWidth(this.msgText);
    rect(cx - tw/2 - 20, cy - 18, tw + 40, 36, 18);
    fill(c[0], c[1], c[2], a);
    textAlign(CENTER, CENTER); textSize(18); textStyle(BOLD);
    text(this.msgText, cx, cy);
    textStyle(NORMAL);
    pop();
  }

  // ── Interact Prompt ───────────────────────────────────────
  drawInteractPrompt(label) {
    let cx = (width - RIGHT_PANEL_W) / 2;
    let by = height - 50;
    let bw = 160;
    fill(0, 0, 0, 170); noStroke();
    rect(cx - bw/2, by - 14, bw, 28, 14);
    fill(...PAL.yellow); textAlign(CENTER, CENTER); textSize(13); textStyle(BOLD);
    text('[E]  ' + label, cx, by);
    textStyle(NORMAL);
  }

  // ── Character Select Screen ───────────────────────────────
  drawCharacterScreen(selectedIndex, hoveredIndex) {
    // Background
    for (let y = 0; y < height; y++) {
      let t = y / height;
      stroke(lerp(18,10,t), lerp(20,30,t), lerp(55,80,t));
      line(0, y, width, y);
    }
    noStroke();

    // Title
    fill(...PAL.yellow); textAlign(CENTER, CENTER); textSize(36); textStyle(BOLD);
    text('CHOOSE YOUR CUSTOMER', width/2, height * 0.13);
    textStyle(NORMAL);
    fill(...PAL.skyBlue); textSize(14);
    text('You will be shopping for this customer today', width/2, height * 0.13 + 38);

    // Three character cards
    const chars = this._characterDefs();
    const cardW = min(220, (width - 120) / 3);
    const cardH = min(340, height * 0.6);
    const totalW = 3 * cardW + 2 * 30;
    const startX = (width - totalW) / 2;
    const cardY  = height * 0.22;

    for (let i = 0; i < 3; i++) {
      let cx = startX + i * (cardW + 30);
      let ch = chars[i];
      let isHov = (hoveredIndex === i);
      let isSel = (selectedIndex === i);

      // Card shadow
      fill(0, 0, 0, 60); noStroke();
      rect(cx + 5, cardY + 5, cardW, cardH, 14);

      // Card body
      if (isSel) {
        fill(...PAL.amber, 40);
      } else if (isHov) {
        fill(255, 255, 255, 18);
      } else {
        fill(...PAL.darkBg, 220);
      }
      stroke(isSel ? PAL.amber : isHov ? PAL.skyBlue : PAL.royalBlue);
      strokeWeight(isSel ? 3 : 2);
      rect(cx, cardY, cardW, cardH, 12);
      noStroke();

      // Character portrait area
      let portraitY = cardY + 16;
      let portraitCX = cx + cardW / 2;
      this._drawCharacterPortrait(ch, portraitCX, portraitY + 60, isSel || isHov);

      // Name
      fill(isSel ? PAL.amber : PAL.yellow);
      textAlign(CENTER, CENTER); textSize(15); textStyle(BOLD);
      text(ch.name, portraitCX, cardY + 150);
      textStyle(NORMAL);

      // Items header
      fill(...PAL.skyBlue); textSize(10); textStyle(BOLD); textAlign(CENTER, CENTER);
      text('SHOPPING LIST', portraitCX, cardY + 175);
      textStyle(NORMAL);

      // Items list
      fill(210, 210, 225); textSize(10); textAlign(CENTER, CENTER);
      for (let j = 0; j < ch.items.length; j++) {
        text('• ' + ch.items[j], portraitCX, cardY + 193 + j * 18);
      }

      // Select button / selected badge
      let btnY = cardY + cardH - 44;
      if (isSel) {
        fill(...PAL.amber); noStroke();
        rect(cx + 16, btnY, cardW - 32, 32, 16);
        fill(...PAL.black); textAlign(CENTER, CENTER); textSize(12); textStyle(BOLD);
        text('✓  SELECTED', portraitCX, btnY + 16);
        textStyle(NORMAL);
      } else {
        fill(isHov ? PAL.skyBlue : [60, 70, 100]); noStroke();
        rect(cx + 16, btnY, cardW - 32, 32, 16);
        fill(255); textAlign(CENTER, CENTER); textSize(12); textStyle(BOLD);
        text('SELECT', portraitCX, btnY + 16);
        textStyle(NORMAL);
      }
    }

    // Confirm button (bottom center) — only active when one is selected
    let btnActive = selectedIndex >= 0;
    let confirmW  = 260, confirmH = 48;
    let confirmX  = width / 2 - confirmW / 2;
    let confirmY  = height - 80;

    fill(btnActive ? PAL.green : [40, 50, 60]); noStroke();
    rect(confirmX, confirmY, confirmW, confirmH, 24);
    fill(btnActive ? PAL.yellow : [80, 90, 100]);
    textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD);
    text(btnActive ? 'START SHOPPING  →' : 'Select a customer first', width/2, confirmY + 24);
    textStyle(NORMAL);
  }

  // Draw a pixel-art character portrait
  _drawCharacterPortrait(ch, cx, cy, highlight) {
    push();
    translate(cx, cy);

    if (highlight) {
      // Glow ring
      noFill();
      stroke(...ch.accentCol, 80 + 40 * sin(frameCount * 0.1));
      strokeWeight(6);
      ellipse(0, -20, 90, 90);
      noStroke();
    }

    // Body
    fill(...ch.bodyCol); noStroke();
    rect(-18, -4, 36, 28, 5);

    // Collar accent
    fill(...ch.accentCol);
    rect(-12, -4, 24, 7, 3);

    // Head
    fill(255, 215, 175);
    ellipse(0, -28, 38, 38);

    // Hair
    fill(...ch.hairCol);
    arc(0, -32, 38, 28, PI, TWO_PI);  // top of head
    if (ch.hairStyle === 'long') {
      rect(-18, -36, 6, 20, 3);   // left strand
      rect(12,  -36, 6, 20, 3);   // right strand
    } else if (ch.hairStyle === 'curly') {
      ellipse(-16, -28, 10, 14);
      ellipse(16,  -28, 10, 14);
    }

    // Eyes
    fill(40, 40, 40);
    ellipse(-7, -28, 5, 6);
    ellipse( 7, -28, 5, 6);
    // Eye shine
    fill(255);
    ellipse(-6, -30, 2, 2);
    ellipse( 8, -30, 2, 2);

    // Smile
    noFill();
    stroke(120, 70, 50); strokeWeight(1.5);
    arc(0, -22, 14, 10, 0, PI);
    noStroke();

    // Legs
    fill(...ch.bodyCol);
    rect(-12, 24, 10, 18, 3);
    rect( 2,  24, 10, 18, 3);

    // Shoes
    fill(40, 40, 40);
    rect(-14, 40, 13, 7, 2);
    rect(  1, 40, 13, 7, 2);

    // Accessory (unique per character)
    if (ch.accessory === 'glasses') {
      noFill(); stroke(60, 60, 80); strokeWeight(1.5);
      ellipse(-7, -28, 11, 9);
      ellipse( 7, -28, 11, 9);
      line(-2, -28, 2, -28); // bridge
      noStroke();
    } else if (ch.accessory === 'hat') {
      fill(...ch.hairCol); noStroke();
      rect(-14, -44, 28, 10, 3);  // brim
      rect(-9,  -54, 18, 14, 3);  // top
    } else if (ch.accessory === 'bow') {
      fill(...ch.accentCol); noStroke();
      ellipse(-10, -46, 12, 8);
      ellipse( 10, -46, 12, 8);
      ellipse(  0, -46,  6, 6);
    }

    pop();
  }

  // Character definitions
  _characterDefs() {
    return [
      {
        name:      'Eleanor',
        tagline:   'Retired teacher. Loves a good deal and a tidy list.',
        items:     ['2% Milk', 'Sourdough', 'Cheddar Cheese'],
        bodyCol:   PAL.purple || [120, 60, 180],
        accentCol: PAL.blush,
        hairCol:   [220, 210, 200],   // silver
        hairStyle: 'curly',
        accessory: 'glasses'
      },
      {
        name:      'Marcus',
        tagline:   'Busy dad of two. Needs everything by 5pm.',
        items:     ['Almond Milk', 'Cherry Donut', 'Pasta'],
        bodyCol:   PAL.royalBlue,
        accentCol: PAL.amber,
        hairCol:   [40, 28, 18],      // dark brown
        hairStyle: 'short',
        accessory: 'hat'
      },
      {
        name:      'Priya',
        tagline:   'Food blogger. Very specific about ingredients.',
        items:     ['Avocado Oil', 'Almond Flour', 'Vanilla Cupcake'],
        bodyCol:   PAL.green,
        accentCol: PAL.pink,
        hairCol:   [20, 14, 10],      // black
        hairStyle: 'long',
        accessory: 'bow'
      }
    ];
  }

  // Hit-test for character card select buttons
  characterCardHit(mx, my) {
    const cardW = min(220, (width - 120) / 3);
    const cardH = min(340, height * 0.6);
    const totalW = 3 * cardW + 2 * 30;
    const startX = (width - totalW) / 2;
    const cardY  = height * 0.22;
    for (let i = 0; i < 3; i++) {
      let cx  = startX + i * (cardW + 30);
      let btnY = cardY + cardH - 44;
      if (mx >= cx + 16 && mx <= cx + cardW - 16 &&
          my >= btnY    && my <= btnY + 32) return i;
    }
    return -1;
  }

  // Hit-test for "Start Shopping" confirm button
  characterConfirmHit(mx, my) {
    let confirmW = 260, confirmH = 48;
    let confirmX = width / 2 - confirmW / 2;
    let confirmY = height - 80;
    return mx >= confirmX && mx <= confirmX + confirmW &&
           my >= confirmY && my <= confirmY + confirmH;
  }

  // Hovered card index (for hover highlight)
  characterHoveredIndex(mx, my) {
    const cardW = min(220, (width - 120) / 3);
    const cardH = min(340, height * 0.6);
    const totalW = 3 * cardW + 2 * 30;
    const startX = (width - totalW) / 2;
    const cardY  = height * 0.22;
    for (let i = 0; i < 3; i++) {
      let cx = startX + i * (cardW + 30);
      if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) return i;
    }
    return -1;
  }

  // ── Start Screen ──────────────────────────────────────────
  drawStartScreen() {
    for (let y = 0; y < height; y++) {
      let t = y / height;
      stroke(lerp(18,10,t), lerp(20,30,t), lerp(55,80,t));
      line(0, y, width, y);
    }

    fill(0,0,0,80); noStroke();
    rect(width/2-340, height/2-160, 680, 340, 16);
    stroke(...PAL.royalBlue, 180); strokeWeight(2);
    rect(width/2-340, height/2-160, 680, 340, 16); noStroke();

    fill(...PAL.yellow); textAlign(CENTER, CENTER); textSize(52); textStyle(BOLD);
    text('ELITE EMPLOYEE', width/2, height/2 - 100);
    textStyle(NORMAL);

    fill(...PAL.skyBlue); textSize(16);
    text('🛒  A Fun Grocery Challenge  🛒', width/2, height/2 - 56);

    stroke(...PAL.royalBlue); strokeWeight(1);
    line(width/2-260, height/2-38, width/2+260, height/2-38); noStroke();

    fill(185,200,230); textSize(13); textAlign(CENTER, TOP);
    const lines = [
      '• Collect all items from the shopping list before time runs out',
      '• If it gets too confusing — press  H  to reveal hints',
      '• Wrong items cost you a heart  ♥  —  lose all 3 and it\'s over',
      '• Reach the CHECKOUT counter and press E when you\'re done'
    ];
    for (let i = 0; i < lines.length; i++) {
      text(lines[i], width/2, height/2 - 24 + i * 24);
    }

    let bx = width/2 - 130, by = height/2 + 112;
    fill(...PAL.amber); noStroke();
    rect(bx, by, 260, 48, 24);
    fill(...PAL.black); textAlign(CENTER, CENTER); textSize(16); textStyle(BOLD);
    text('PRESS  ENTER  TO  START', width/2, by + 24);
    textStyle(NORMAL);
  }

  // ── Instructions Overlay ──────────────────────────────────
  drawInstructions() {
    fill(0,0,0,195); noStroke(); rect(0,0,width,height);
    let pw = min(560, width-100), ph = 440;
    let px = (width-pw)/2, py = (height-ph)/2;
    fill(...PAL.darkBg); stroke(...PAL.royalBlue); strokeWeight(2);
    rect(px, py, pw, ph, 12); noStroke();
    fill(...PAL.royalBlue); rect(px, py, pw, 50, 12, 12, 0, 0);
    fill(...PAL.yellow); textAlign(CENTER,CENTER); textSize(22); textStyle(BOLD);
    text('HOW TO PLAY', width/2, py+25); textStyle(NORMAL);

    const sections = [
      { icon:'🕹', title:'Move',      body:'WASD or Arrow Keys to walk around the store.' },
      { icon:'🛒', title:'Shelves',   body:'Walk up to a shelf and press E to browse. Click items to collect them. ESC to leave.' },
      { icon:'📋', title:'Your Goal', body:'Collect every item on the shopping list (right panel) within the time limit.' },
      { icon:'♥',  title:'Hearts',    body:'3 lives. Picking a wrong item or failing checkout costs 1 heart.' },
      { icon:'💡', title:'Hints',     body:'Press H to use a hint. Correct items glow and blur clears for a few seconds. 2 hints per game.' },
      { icon:'🏪', title:'Checkout',  body:'Go to the CHECKOUT counter (bottom of store) and press E. All correct = PROMOTION!' },
    ];
    let sy = py + 60;
    for (let s of sections) {
      fill(...PAL.royalBlue, 160); noStroke(); ellipse(px+28, sy+14, 34, 34);
      textAlign(CENTER,CENTER); textSize(16); text(s.icon, px+28, sy+14);
      fill(...PAL.gold); textAlign(LEFT,TOP); textSize(13); textStyle(BOLD);
      text(s.title, px+52, sy); textStyle(NORMAL);
      fill(175,185,210); textSize(11); text(s.body, px+52, sy+17, pw-72, 30);
      sy += 58;
    }
    fill(100,110,140); textAlign(CENTER,BOTTOM); textSize(12);
    text('Press  I  to close and resume the game', width/2, py+ph-10);
  }

  // ── Win Screen ────────────────────────────────────────────
  drawWinScreen() {
    for (let y = 0; y < height; y++) {
      let t = y/height;
      stroke(lerp(10,20,t), lerp(55,80,t), lerp(20,35,t));
      line(0, y, width, y);
    }
    randomSeed(42);
    const cc = [PAL.yellow, PAL.pink, PAL.skyBlue, PAL.orange, PAL.green];
    for (let i = 0; i < 80; i++) {
      let cx = random(width), cy = random(height);
      let c = cc[floor(random(cc.length))];
      fill(...c, 180); noStroke(); rect(cx, cy, 8, 8, 1);
    }
    fill(...PAL.yellow); textAlign(CENTER,CENTER); textSize(56); textStyle(BOLD);
    text('🎉  PROMOTED!  🎉', width/2, height/2-90); textStyle(NORMAL);
    fill(...PAL.offWhite); textSize(20);
    text('You collected all items correctly!', width/2, height/2-24);
    fill(...PAL.gold); textSize(20);
    text('Management is very impressed.', width/2, height/2+8);
    fill(...PAL.yellow); textSize(36);
    text('⭐ ⭐ ⭐ ⭐ ⭐', width/2, height/2+60);
    this._drawRestartButton('PLAY AGAIN', PAL.green, PAL.yellow);
  }

  // ── Lose Screen ───────────────────────────────────────────
  drawLoseScreen(gs) {
    for (let y = 0; y < height; y++) {
      let t = y/height;
      stroke(lerp(55,80,t), lerp(10,20,t), lerp(15,25,t));
      line(0, y, width, y);
    }
    fill(...PAL.pink); textAlign(CENTER,CENTER); textSize(50); textStyle(BOLD);
    text('★  BAD RATING  ★', width/2, height/2-90); textStyle(NORMAL);
    let reason = gs.gameOverReason==='time' ? 'You ran out of time!' : 'You lost all your hearts!';
    fill(...PAL.offWhite); textSize(20); text(reason, width/2, height/2-24);
    fill(200,160,150); textSize(16); text('Better luck next shift.', width/2, height/2+8);
    fill(...PAL.orange); textSize(34); text('⭐ ☆ ☆ ☆ ☆', width/2, height/2+58);
    this._drawRestartButton('TRY AGAIN', PAL.pink, PAL.white);
  }

  _drawRestartButton(label, bg, fg) {
    let bx = width/2-120, by = height/2+108;
    fill(...bg); noStroke(); rect(bx, by, 240, 48, 24);
    fill(...fg); textAlign(CENTER,CENTER); textSize(16); textStyle(BOLD);
    text(label, width/2, by+24); textStyle(NORMAL);
  }

  isRestartClicked() {
    let bx = width/2-120, by = height/2+108;
    return mouseX>=bx && mouseX<=bx+240 && mouseY>=by && mouseY<=by+48;
  }

  isStartClicked() {
    let bx = width/2-130, by = height/2+112;
    return mouseX>=bx && mouseX<=bx+260 && mouseY>=by && mouseY<=by+48;
  }
}