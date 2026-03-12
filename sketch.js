// ============================================================
// sketch.js  —  Elite Employee  (main p5.js entry point)
// ============================================================

let gs, store, player, ui;
let keys = {};
let camX = 0, camY = 0;

// Sound
let winSound, loseSound, bgMusic;
let winPlayed = false, losePlayed = false, bgPlaying = false;

// Assets
let assets = {};

// Character select state (managed here, not in GameState)
let selectedCharIndex  = -1;   // which card is selected (-1 = none)
let hoveredCharIndex   = -1;   // which card the mouse is over

// ── p5 preload ────────────────────────────────────────────────
function preload() {
  winSound  = loadSound('Assets/Correct.mp3');
  loseSound = loadSound('Assets/Incorrect.mp3');
  bgMusic   = loadSound('Assets/ELEVATOR-MUSIC_AdobeStock_452587580.wav');

  const productFiles = {
    'White Bread':        'White Bread.svg',
    'Wheat Bread':        'Wheat Bread.svg',
    'Sourdough':          'Sourdough.svg',
    'Vanilla Cupcake':    'Vanilla Cupcake.svg',
    'Blueberry Cupcake':  'Blueberry Cupckae.svg',
    'Mint Cupcake':       'Mint Cupcake.svg',
    'Cherry Donut':       'Cherry donut.svg',
    'Orange Zest Donut':  'Orange zest donut.svg',
    'Strawberry Donut':   'Strawberry donut.svg',
    '2% Milk':            '2-percent-milk.svg',
    'Almond Milk':        'Almond milk.svg',
    'Soy Milk':           'Soy milk.svg',
    'Cherry Icecream':    'Cherry icecream.svg',
    'Rhubarb Icecream':   'Rhubarb icecream.svg',
    'Strawberry Icecream':'Strawberry icecream.svg',
    'Blue Cheese':        'Blue Cheese.svg',
    'Cheddar Cheese':     'Cheddar cheese.svg',
    'Parmesan Cheese':    'Parmesan cheese.svg',
    'Avocado Oil':        'Avocado oil.svg',
    'Olive Oil':          'Olive oil.svg',
    'Sunflower Oil':      'Sunflower oil.svg',
    'Almond Flour':       'Almond flour.svg',
    'White Flour':        'White flour.svg',
    'Whole wheat':        'Whole wheat.svg',
    'White Sugar':        'White sugar.svg',
    'Brown Sugar':        'Brown sugar.svg',
    'Pasta':              'Pasta.svg'
  };

  for (let name in productFiles) {
    let url = encodeURI('Assets/' + productFiles[name]);
    assets[name] = loadImage(url, ()=>{}, ()=>{ assets[name] = null; });
  }
}

// ── p5 setup ──────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  gs     = new GameState();
  ui     = new UI();
  store  = new Store();
  player = new Player(WORLD_W / 2, WORLD_H / 2 + 100);
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); }

// ── Draw loop ─────────────────────────────────────────────────
function draw() {
  background(...PAL.floorA);

  switch (gs.current) {
    case STATE.START:        drawStart();                                break;
    case STATE.CHARACTER:    drawCharacterSelect();                      break;
    case STATE.PLAYING:      drawPlaying();                              break;
    case STATE.SHELF:        drawShelf();                                break;
    case STATE.INSTRUCTIONS: drawInstructions();                         break;
    case STATE.WIN:          ui.drawWinScreen();                         break;
    case STATE.LOSE:         ui.drawLoseScreen(gs);                      break;
  }

  // Sound management
  if (gs.current === STATE.WIN && !winPlayed) {
    if (winSound && winSound.isLoaded()) winSound.play();
    winPlayed = true;
  } else if (gs.current !== STATE.WIN) { winPlayed = false; }

  if (gs.current === STATE.LOSE && !losePlayed) {
    if (loseSound && loseSound.isLoaded()) loseSound.play();
    losePlayed = true;
  } else if (gs.current !== STATE.LOSE) { losePlayed = false; }

  if (gs.current !== STATE.WIN && gs.current !== STATE.LOSE && !bgPlaying) {
    if (bgMusic && bgMusic.isLoaded()) { bgMusic.loop(); bgPlaying = true; }
  } else if ((gs.current === STATE.WIN || gs.current === STATE.LOSE) && bgPlaying) {
    if (bgMusic) bgMusic.stop(); bgPlaying = false;
  }
}

// ── Audio helpers ─────────────────────────────────────────────
function startAudio() {
  if (typeof userStartAudio === 'function') userStartAudio();
  let ctx = getAudioContext();
  if (ctx && ctx.state !== 'running') ctx.resume();
  if (!gs) return;
  if (!bgPlaying && gs.current !== STATE.WIN && gs.current !== STATE.LOSE) {
    if (bgMusic && bgMusic.isLoaded()) { bgMusic.loop(); bgPlaying = true; }
  }
}

// ── Viewport ──────────────────────────────────────────────────
function viewportW() { return width  - RIGHT_PANEL_W; }
function viewportH() { return height - TOP_BAR_H;     }

// ── Camera ───────────────────────────────────────────────────
function updateCamera() {
  let vpW = viewportW(), vpH = viewportH();
  let tx  = constrain(player.cx() - vpW/2, 0, max(0, WORLD_W - vpW));
  let ty  = constrain(player.cy() - vpH/2, 0, max(0, WORLD_H - vpH));
  camX = lerp(camX, tx, 0.10);
  camY = lerp(camY, ty, 0.10);
}

function applyCamera() { translate(-camX, -camY + TOP_BAR_H); }

// ── State: START ──────────────────────────────────────────────
function drawStart() { ui.drawStartScreen(); }

// ── State: CHARACTER SELECT ───────────────────────────────────
function drawCharacterSelect() {
  hoveredCharIndex = ui.characterHoveredIndex(mouseX, mouseY);
  ui.drawCharacterScreen(selectedCharIndex, hoveredCharIndex);
}

// ── State: PLAYING ────────────────────────────────────────────
function drawPlaying() {
  gs.tickTimer(1 / max(frameRate(), 1));
  gs.tickHint();
  ui.tick();
  store.update();
  player.update(keys, store.getColliders());
  updateCamera();

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, TOP_BAR_H, viewportW(), viewportH());
  drawingContext.clip();
  applyCamera();
  store.draw(gs);
  player.draw();
  drawInteractIndicators();
  pop();
  drawingContext.restore();

  ui.drawHUD(gs);
  let ns = store.getNearbyShelf(player.cx(), player.cy());
  let nc = store.isPlayerNearCheckout(player.cx(), player.cy());
  if (ns) ui.drawInteractPrompt('Open Shelf');
  if (nc) ui.drawInteractPrompt('Checkout');
}

// ── State: SHELF ──────────────────────────────────────────────
function drawShelf() {
  gs.tickTimer(1 / max(frameRate(), 1));
  gs.tickHint();
  ui.tick();

  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, TOP_BAR_H, viewportW(), viewportH());
  drawingContext.clip();
  applyCamera();
  store.draw(gs);
  player.draw();
  pop();
  drawingContext.restore();

  ui.drawHUD(gs);
  if (gs.activeShelf) {
    gs.activeShelf.drawOverlay(gs);
    gs.activeShelf.updateHover(mouseX, mouseY);
  }
}

// ── State: INSTRUCTIONS ───────────────────────────────────────
function drawInstructions() {
  push();
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.rect(0, TOP_BAR_H, viewportW(), viewportH());
  drawingContext.clip();
  applyCamera();
  store.draw(gs);
  player.draw();
  pop();
  drawingContext.restore();
  ui.drawHUD(gs);
  ui.drawInstructions();
}

// ── Interact indicators ───────────────────────────────────────
function drawInteractIndicators() {
  let nearShelf    = store.getNearbyShelf(player.cx(), player.cy());
  let nearCheckout = store.isPlayerNearCheckout(player.cx(), player.cy());
  if (nearShelf) {
    noFill();
    stroke(...PAL.yellow, 160 + 60 * sin(frameCount * 0.15));
    strokeWeight(3);
    rect(nearShelf.x-4, nearShelf.y-4, nearShelf.w+8, nearShelf.h+8, 6);
    noStroke();
  }
  if (nearCheckout) {
    noFill();
    stroke(...PAL.green, 160 + 60 * sin(frameCount * 0.15));
    strokeWeight(3);
    rect(store.checkoutX-4, store.checkoutY-4, store.checkoutW+8, store.checkoutH+8, 8);
    noStroke();
  }
}

// ── Key input ─────────────────────────────────────────────────
function keyPressed() {
  startAudio();
  keys[key]     = true;
  keys[keyCode] = true;

  if (gs.current === STATE.START) {
    if (keyCode === ENTER || keyCode === 32) {
      // Go to character select instead of directly starting
      gs.setState(STATE.CHARACTER);
      selectedCharIndex = -1;
    }
    return;
  }

  if (gs.current === STATE.CHARACTER) {
    // Arrow keys to cycle through characters
    if (keyCode === LEFT_ARROW) {
      selectedCharIndex = ((selectedCharIndex <= 0 ? 3 : selectedCharIndex) - 1);
    } else if (keyCode === RIGHT_ARROW) {
      selectedCharIndex = (selectedCharIndex + 1) % 3;
    } else if (keyCode === ENTER && selectedCharIndex >= 0) {
      launchWithCharacter(selectedCharIndex);
    }
    return;
  }

  if (gs.current === STATE.WIN || gs.current === STATE.LOSE) {
    if (keyCode === ENTER || keyCode === 32) returnToStart();
    return;
  }

  if (key === 'i' || key === 'I') {
    if (gs.current === STATE.INSTRUCTIONS)    gs.setState(STATE.PLAYING);
    else if (gs.current === STATE.PLAYING)    gs.setState(STATE.INSTRUCTIONS);
    return;
  }

  if (key === 'h' || key === 'H') {
    if (gs.current === STATE.PLAYING || gs.current === STATE.SHELF) {
      if (gs.hints > 0) { gs.useHint(); ui.showMessage('💡 Hint Active!', PAL.yellow); }
      else               { ui.showMessage('No hints left!', PAL.orange); }
    }
    return;
  }

  if (keyCode === ESCAPE) {
    if (gs.current === STATE.SHELF) {
      gs.activeShelf = null; gs.setState(STATE.PLAYING);
    } else if (gs.current === STATE.INSTRUCTIONS) {
      gs.setState(STATE.PLAYING);
    }
    return;
  }

  if (key === 'e' || key === 'E') handleInteract();
}

function keyReleased() {
  keys[key]     = false;
  keys[keyCode] = false;
}

// ── Interact ──────────────────────────────────────────────────
function handleInteract() {
  if (gs.current !== STATE.PLAYING) return;
  let nearShelf    = store.getNearbyShelf(player.cx(), player.cy());
  let nearCheckout = store.isPlayerNearCheckout(player.cx(), player.cy());
  if (nearShelf)    { gs.activeShelf = nearShelf; gs.setState(STATE.SHELF); return; }
  if (nearCheckout) handleCheckout();
}

function handleCheckout() {
  if (gs.allItemsCollected()) {
    gs.setState(STATE.WIN);
  } else {
    let missing = gs.getRequiredItems().filter(n => !gs.isItemCollected(n));
    ui.showMessage('Missing: ' + missing.join(', '), PAL.pink);
    gs.loseLife();
    player.flash();
  }
}

// ── Mouse ─────────────────────────────────────────────────────
function mousePressed() {
  startAudio();

  if (gs.current === STATE.START) {
    if (ui.isStartClicked()) { gs.setState(STATE.CHARACTER); selectedCharIndex = -1; }
    return;
  }

  if (gs.current === STATE.CHARACTER) {
    // Click a character card to select it
    let hit = ui.characterCardHit(mouseX, mouseY);
    if (hit >= 0) { selectedCharIndex = hit; return; }
    // Click confirm button to launch
    if (ui.characterConfirmHit(mouseX, mouseY) && selectedCharIndex >= 0) {
      launchWithCharacter(selectedCharIndex);
    }
    return;
  }

  if (gs.current === STATE.WIN || gs.current === STATE.LOSE) {
    if (ui.isRestartClicked()) returnToStart();
    return;
  }

  if (gs.current === STATE.SHELF && gs.activeShelf) {
    let item = gs.activeShelf.handleClick(mouseX, mouseY, gs);
    if (item) collectItem(item);
  }
}

// ── Collect item ──────────────────────────────────────────────
function collectItem(item) {
  if (gs.isItemCollected(item.name)) { ui.showMessage('Already in cart!', PAL.amber); return; }
  if (gs.isItemRequired(item.name)) {
    item.collected = true;
    gs.cart.push({ name: item.name });
    ui.showMessage('✓  ' + item.name + ' added!', PAL.green);
    for (let s of store.shelves)
      for (let i of s.items)
        if (i.name === item.name) i.collected = true;
  } else {
    gs.loseLife(); player.flash(); ui.showMessage('✗  Wrong item!', PAL.pink);
  }
}

// ── Launch game with chosen character ─────────────────────────
function launchWithCharacter(charIndex) {
  let chars = ui._characterDefs();        // reuse UI's character data
  let chosen = chars[charIndex];
  gs.reset();                             // sets STATE.PLAYING, resets lives/timer/cart
  // Override the shopping list with this character's items (single customer)
  gs.shoppingList = [{ customer: chosen.name, items: chosen.items.slice() }];
  store  = new Store();
  player = new Player(WORLD_W / 2, WORLD_H / 2 + 100);
  keys   = {};
  camX   = 0;
  camY   = 0;
  startAudio();
}

// ── Return to start (from win/lose) ───────────────────────────
function returnToStart() {
  gs.setState(STATE.START);
  selectedCharIndex = -1;
  keys = {};
}