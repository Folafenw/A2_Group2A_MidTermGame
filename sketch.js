// ============================================================
// sketch.js  —  Elite Employee  (main p5.js entry point)
//
// Architecture:
//   • World space  : 1600 × 1100  (WORLD_W × WORLD_H)
//   • Screen space : windowWidth × windowHeight (fullscreen)
//   • Camera       : translate so player stays centered in the
//                    gameplay viewport (screen minus UI panels)
//   • UI layer     : drawn AFTER resetMatrix() — always fixed
//
// File load order (index.html):
//   gamestate.js → item.js → shelf.js → npc.js →
//   player.js → store.js → ui.js → sketch.js
// ============================================================

let gs, store, player, ui;
let keys = {};        // live key state

// Camera offset (world→screen translate)
let camX = 0, camY = 0;

// Sound variables
let winSound, loseSound, bgMusic;
let winPlayed = false, losePlayed = false, bgPlaying = false;

// ── p5 preload ────────────────────────────────────────────────
function preload() {
  winSound = loadSound('Assets/Correct.mp3');
  loseSound = loadSound('Assets/Incorrect.mp3');
  bgMusic = loadSound('Assets/ELEVATOR-MUSIC_AdobeStock_452587580.wav');
}

// ── p5 setup ──────────────────────────────────────────────────
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('monospace');
  pixelDensity(1);

  gs     = new GameState();
  ui     = new UI();
  store  = new Store();
  player = new Player(WORLD_W / 2, WORLD_H / 2 + 100);
}

// Fullscreen resize support
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ── p5 draw loop ──────────────────────────────────────────────
function draw() {
  background(...PAL.floorA);

  switch (gs.current) {
    case STATE.START:        drawStart();        break;
    case STATE.PLAYING:      drawPlaying();      break;
    case STATE.SHELF:        drawShelf();        break;
    case STATE.INSTRUCTIONS: drawInstructions(); break;
    case STATE.WIN:          ui.drawWinScreen(); break;
    case STATE.LOSE:         ui.drawLoseScreen(gs); break;
  }

  // Sound management
  if (gs.current === STATE.WIN && !winPlayed) {
    winSound.play();
    winPlayed = true;
  } else if (gs.current !== STATE.WIN) {
    winPlayed = false;
  }

  if (gs.current === STATE.LOSE && !losePlayed) {
    loseSound.play();
    losePlayed = true;
  } else if (gs.current !== STATE.LOSE) {
    losePlayed = false;
  }

  // Updated: play music at all times except win/lose
  if (gs.current !== STATE.WIN && gs.current !== STATE.LOSE && !bgPlaying) {
    bgMusic.loop();
    bgPlaying = true;
  } else if ((gs.current === STATE.WIN || gs.current === STATE.LOSE) && bgPlaying) {
    bgMusic.stop();
    bgPlaying = false;
  }
}

// Ensure audio context is running and start bg music when user interacts
function startAudio() {
  // ensure browser audio context is unlocked
  userStartAudio();
  let ctx = getAudioContext();
  if (ctx.state !== 'running') ctx.resume();
  if (!bgPlaying && gs.current !== STATE.WIN && gs.current !== STATE.LOSE) {
    // if audio isn't loaded yet, wait until ready
    if (bgMusic && bgMusic.isLoaded()) {
      bgMusic.loop();
      bgPlaying = true;
    } else if (bgMusic) {
      bgMusic.onended(() => {}); // noop to force load
      bgMusic.play();
      bgMusic.loop();
      bgPlaying = true;
    }
  }
}

function mousePressed() {
  startAudio();
}

function keyPressed() {
  startAudio();
}

// ── Gameplay viewport dimensions ─────────────────────────────
// The area the player can see is the full screen minus UI panels.
function viewportW() { return width  - RIGHT_PANEL_W; }
function viewportH() { return height - TOP_BAR_H;     }

// ── Camera update ─────────────────────────────────────────────
// Target: player centered in the gameplay viewport.
function updateCamera() {
  let vpW = viewportW();
  let vpH = viewportH();

  // Target camera position (world coord of viewport top-left)
  let targetX = player.cx() - vpW / 2;
  let targetY = player.cy() - vpH / 2;

  // Clamp so we don't show outside the world
  targetX = constrain(targetX, 0, max(0, WORLD_W - vpW));
  targetY = constrain(targetY, 0, max(0, WORLD_H - vpH));

  // Smooth follow (lerp)
  camX = lerp(camX, targetX, 0.10);
  camY = lerp(camY, targetY, 0.10);
}

// Apply camera transform (call before drawing world objects)
function applyCamera() {
  translate(-camX, -camY + TOP_BAR_H);
}

// ── State: START ──────────────────────────────────────────────
function drawStart() {
  ui.drawStartScreen();
}

// ── State: PLAYING ────────────────────────────────────────────
function drawPlaying() {
  // Tick game logic
  gs.tickTimer(1 / max(frameRate(), 1));
  gs.tickHint();
  ui.tick();

  // Update world
  store.update();
  player.update(keys, store.getColliders());
  updateCamera();

  // ── World layer (camera-relative) ─────────────────────────
  push();
  // Clip to gameplay viewport (exclude right panel)
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

  // ── UI layer (screen space) ────────────────────────────────
  ui.drawHUD(gs);

  // Interact prompts (screen space, above HUD)
  let nearShelf2    = store.getNearbyShelf(player.cx(), player.cy());
  let nearCheckout2 = store.isPlayerNearCheckout(player.cx(), player.cy());
  if (nearShelf2)    ui.drawInteractPrompt('Open Shelf');
  if (nearCheckout2) ui.drawInteractPrompt('Checkout');
}

// ── State: SHELF ──────────────────────────────────────────────
function drawShelf() {
  gs.tickTimer(1 / max(frameRate(), 1));
  gs.tickHint();
  ui.tick();

  // Draw frozen world in background
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

  // UI on top
  ui.drawHUD(gs);

  // Shelf overlay (screen space, on top of everything)
  if (gs.activeShelf) {
    gs.activeShelf.drawOverlay(gs);
    gs.activeShelf.updateHover(mouseX, mouseY);
  }
}

// ── State: INSTRUCTIONS ───────────────────────────────────────
function drawInstructions() {
  // Frozen world
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

// ── Interact indicators (world space, before pop) ─────────────
function drawInteractIndicators() {
  let nearShelf    = store.getNearbyShelf(player.cx(), player.cy());
  let nearCheckout = store.isPlayerNearCheckout(player.cx(), player.cy());

  if (nearShelf) {
    // Highlight glow around nearby shelf
    noFill();
    stroke(...PAL.yellow, 160 + 60 * sin(frameCount * 0.15));
    strokeWeight(3);
    rect(nearShelf.x - 4, nearShelf.y - 4,
         nearShelf.w + 8,  nearShelf.h + 8, 6);
    noStroke();
  }

  if (nearCheckout) {
    noFill();
    stroke(...PAL.green, 160 + 60 * sin(frameCount * 0.15));
    strokeWeight(3);
    rect(store.checkoutX - 4, store.checkoutY - 4,
         store.checkoutW + 8,  store.checkoutH + 8, 8);
    noStroke();
  }
}

// After camera is applied we need screen-space prompts — draw in screen space
function drawPlayingScreenOverlays() {
  let nearShelf    = store.getNearbyShelf(player.cx(), player.cy());
  let nearCheckout = store.isPlayerNearCheckout(player.cx(), player.cy());
  if (nearShelf)    ui.drawInteractPrompt('Open Shelf');
  if (nearCheckout) ui.drawInteractPrompt('Checkout');
}

// Override: call after HUD so prompt is always visible
function drawHUDWithPrompts(gs) {
  ui.drawHUD(gs);
  let nearShelf    = store.getNearbyShelf(player.cx(), player.cy());
  let nearCheckout = store.isPlayerNearCheckout(player.cx(), player.cy());
  if (nearShelf)    ui.drawInteractPrompt('Open Shelf');
  if (nearCheckout) ui.drawInteractPrompt('Checkout');
}

// ── Key input ─────────────────────────────────────────────────
function keyPressed() {
  keys[key]     = true;
  keys[keyCode] = true;

  // Start / restart screens
  if (gs.current === STATE.START) {
    if (keyCode === ENTER || keyCode === 32) startGame();
    return;
  }
  if (gs.current === STATE.WIN || gs.current === STATE.LOSE) {
    if (keyCode === ENTER || keyCode === 32) startGame();
    return;
  }

  // Instructions toggle (I)
  if (key === 'i' || key === 'I') {
    if (gs.current === STATE.INSTRUCTIONS) gs.setState(STATE.PLAYING);
    else if (gs.current === STATE.PLAYING)  gs.setState(STATE.INSTRUCTIONS);
    return;
  }

  // Hint (H)
  if (key === 'h' || key === 'H') {
    if (gs.current === STATE.PLAYING || gs.current === STATE.SHELF) {
      if (gs.hints > 0) {
        gs.useHint();
        ui.showMessage('💡 Hint Active!', PAL.yellow);
      } else {
        ui.showMessage('No hints left!', PAL.orange);
      }
    }
    return;
  }

  // ESC — close shelf or instructions
  if (keyCode === ESCAPE) {
    if (gs.current === STATE.SHELF) {
      gs.activeShelf = null;
      gs.setState(STATE.PLAYING);
    } else if (gs.current === STATE.INSTRUCTIONS) {
      gs.setState(STATE.PLAYING);
    }
    return;
  }

  // E — interact
  if (key === 'e' || key === 'E') {
    handleInteract();
  }
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

  if (nearShelf) {
    gs.activeShelf = nearShelf;
    gs.setState(STATE.SHELF);
    return;
  }
  if (nearCheckout) {
    handleCheckout();
  }
}

// ── Checkout ──────────────────────────────────────────────────
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

// ── Mouse click ───────────────────────────────────────────────
function mousePressed() {
  if (gs.current === STATE.START) {
    if (ui.isStartClicked()) startGame();
    return;
  }

  if (gs.current === STATE.WIN || gs.current === STATE.LOSE) {
    if (ui.isRestartClicked()) startGame();
    return;
  }

  if (gs.current === STATE.SHELF && gs.activeShelf) {
    let item = gs.activeShelf.handleClick(mouseX, mouseY, gs);
    if (item) collectItem(item);
  }
}

// ── Collect an item from shelf ────────────────────────────────
function collectItem(item) {
  if (gs.isItemCollected(item.name)) {
    ui.showMessage('Already in cart!', PAL.amber);
    return;
  }

  if (gs.isItemRequired(item.name)) {
    item.collected = true;
    gs.cart.push({ name: item.name });
    ui.showMessage('✓  ' + item.name + ' added!', PAL.green);

    // Mark the same item on all shelves as collected
    for (let s of store.shelves) {
      for (let i of s.items) {
        if (i.name === item.name) i.collected = true;
      }
    }
  } else {
    gs.loseLife();
    player.flash();
    ui.showMessage('✗  Wrong item!', PAL.pink);
  }
}

// ── Start / restart ───────────────────────────────────────────
function startGame() {
  gs.reset();
  store  = new Store();
  player = new Player(WORLD_W / 2, WORLD_H / 2 + 100);
  ui     = new UI();
  keys   = {};
  camX   = 0;
  camY   = 0;
  // make sure audio starts when game begins
  startAudio();
}

// ── end of sketch.js ──────────────────────────────────────────