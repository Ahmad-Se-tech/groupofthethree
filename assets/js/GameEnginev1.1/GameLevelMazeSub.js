// Third Level — The Maze of Shadows (sublevel)
// Save as: assets/js/GameEnginev1.1/GameLevelMazeSub.js
// Launched by the Gate Keeper NPC in GameLevelMaze.js via GameControl.

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';
import DialogueSystem from './essentials/DialogueSystem.js';
import GameControl from './essentials/GameControl.js';
import GameLevelDoors from './GameLevelDoors.js';

// ─────────────────────────────────────────────────────────────────────────────
// COIN CLASS
// A lightweight game object that renders a gold coin on a canvas and removes
// itself when the player's hitbox overlaps it. Collected coins are tracked on
// gameEnv.coinsCollected so any other object (Exit Warden) can read the count.
// ─────────────────────────────────────────────────────────────────────────────
class Coin {
  /**
   * @param {object} data   { id, x, y, radius }  — all in absolute pixels
   * @param {object} gameEnv
   */
  constructor(data, gameEnv) {
    this.id       = data.id;
    this.x        = data.x;
    this.y        = data.y;
    this.radius   = data.radius ?? 14;
    this.gameEnv  = gameEnv;
    this.collected = false;

    // Ensure the global counter exists
    if (typeof gameEnv.coinsCollected !== 'number') {
      gameEnv.coinsCollected = 0;
    }

    // Create a dedicated canvas for this coin so it layers correctly
    this.canvas = document.createElement('canvas');
    this.canvas.id     = this.id;
    this.canvas.width  = this.radius * 2 + 4;
    this.canvas.height = this.radius * 2 + 4;
    Object.assign(this.canvas.style, {
      position: 'absolute',
      left: (this.x - this.radius - 2) + 'px',
      top:  (this.y - this.radius - 2) + 'px',
      zIndex: '5',
      pointerEvents: 'none'
    });

    const container = document.getElementById('gameContainer') ?? document.body;
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');
    this._draw();

    // Store reference so GameControl can call update() / destroy() if needed
    gameEnv.gameObjects = gameEnv.gameObjects ?? [];
    gameEnv.gameObjects.push(this);
  }

  /** Draw the coin onto its canvas. */
  _draw() {
    const ctx = this.ctx;
    const r   = this.radius;
    const cx  = r + 2;
    const cy  = r + 2;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Outer glow
    const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.2);
    glow.addColorStop(0,   'rgba(255,220,0,0.35)');
    glow.addColorStop(1,   'rgba(255,220,0,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Coin body
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0,   '#FFE566');
    grad.addColorStop(0.6, '#FFB800');
    grad.addColorStop(1,   '#CC8800');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Coin rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#996600';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // "$" symbol
    ctx.fillStyle   = '#7A4F00';
    ctx.font        = `bold ${Math.round(r)}px serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', cx, cy + 1);
  }

  /**
   * Called every game tick. Checks if the player overlaps this coin.
   * Uses the player's canvas position + hitbox as an approximation.
   */
  update() {
    if (this.collected) return;

    // Find the player object — it exposes a canvas positioned absolutely
    const playerCanvas = document.getElementById('Octopus');
    if (!playerCanvas) return;

    const pLeft   = parseInt(playerCanvas.style.left   || '0', 10);
    const pTop    = parseInt(playerCanvas.style.top    || '0', 10);
    const pWidth  = playerCanvas.width;
    const pHeight = playerCanvas.height;

    // Simple AABB vs circle (treat coin as small square for speed)
    const cLeft = this.x - this.radius;
    const cTop  = this.y - this.radius;
    const cSize = this.radius * 2;

    const overlapX = pLeft < cLeft + cSize && pLeft + pWidth  > cLeft;
    const overlapY = pTop  < cTop  + cSize && pTop  + pHeight > cTop;

    if (overlapX && overlapY) {
      this._collect();
    }
  }

  _collect() {
    this.collected = true;
    this.gameEnv.coinsCollected = (this.gameEnv.coinsCollected ?? 0) + 1;

    // Visual pop effect — shrink + fade
    let alpha = 1;
    let scale = 1;
    const pop = () => {
      alpha -= 0.08;
      scale += 0.06;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, alpha);
      this.ctx.translate(this.radius + 2, this.radius + 2);
      this.ctx.scale(scale, scale);
      this.ctx.translate(-(this.radius + 2), -(this.radius + 2));
      this._draw();
      this.ctx.restore();
      if (alpha > 0) {
        requestAnimationFrame(pop);
      } else {
        this.destroy();
      }
    };
    requestAnimationFrame(pop);

    // Update HUD
    _updateCoinHUD(this.gameEnv);
  }

  destroy() {
    if (this.canvas.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    if (this.gameEnv.gameObjects) {
      const idx = this.gameEnv.gameObjects.indexOf(this);
      if (idx !== -1) this.gameEnv.gameObjects.splice(idx, 1);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HUD helper — shows "Coins: N / 5" in the top-left corner of the game
// ─────────────────────────────────────────────────────────────────────────────
function _updateCoinHUD(gameEnv) {
  let hud = document.getElementById('coinHUD');
  if (!hud) {
    hud = document.createElement('div');
    hud.id = 'coinHUD';
    Object.assign(hud.style, {
      position:   'fixed',
      top:        '12px',
      left:       '50%',
      transform:  'translateX(-50%)',
      background: 'rgba(0,0,0,0.65)',
      color:      '#FFD700',
      font:       'bold 18px serif',
      padding:    '6px 18px',
      borderRadius: '20px',
      border:     '2px solid #FFB800',
      zIndex:     '10000',
      userSelect: 'none',
      letterSpacing: '1px',
      textShadow: '0 0 8px #FFD700'
    });
    (document.getElementById('gameContainer') ?? document.body).appendChild(hud);
  }
  const count = gameEnv.coinsCollected ?? 0;
  const needed = 5;
  hud.textContent = `✦ ${count} / ${needed} coins`;
  if (count >= needed) {
    hud.style.color  = '#00FF88';
    hud.style.border = '2px solid #00FF88';
    hud.style.textShadow = '0 0 8px #00FF88';
    hud.textContent  = `✦ ${count} / ${needed} coins  — Seek the Exit Warden!`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LEVEL CLASS
// ─────────────────────────────────────────────────────────────────────────────
class GameLevelMazeSub {
  constructor(gameEnv) {
    console.log("Initializing GameLevelMazeSub...");

    this.gameEnv = gameEnv;

    // Reset coin count each time this level loads
    gameEnv.coinsCollected = 0;

    // Remove any stale HUD from a previous run
    const oldHUD = document.getElementById('coinHUD');
    if (oldHUD && oldHUD.parentNode) oldHUD.parentNode.removeChild(oldHUD);

    let width  = gameEnv.innerWidth;
    let height = gameEnv.innerHeight;
    let path   = gameEnv.path;

    // ── Background ────────────────────────────────────────────────────────────
    const image_data_cave = {
      name: 'maze',
      greeting: "The walls close in around you...",
      src: path + "/images/gamify/dungeon.png",
      pixels: { height: 597, width: 340 }
    };

    // ── Player ────────────────────────────────────────────────────────────────
    const OCTOPUS_SCALE_FACTOR = 5;
    const sprite_data_octopus = {
      id: 'Octopus',
      greeting: "I must find my way through...",
      src: path + "/images/gamify/octopus.png",
      SCALE_FACTOR: OCTOPUS_SCALE_FACTOR,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 50,
      GRAVITY: true,
      INIT_POSITION: { x: 0.05, y: 0.82 },
      pixels: { height: 250, width: 167 },
      orientation: { rows: 3, columns: 2 },
      down:      { row: 0, start: 0, columns: 2 },
      downLeft:  { row: 0, start: 0, columns: 2, mirror: true, rotate:  Math.PI / 16 },
      downRight: { row: 0, start: 0, columns: 2,               rotate: -Math.PI / 16 },
      left:      { row: 1, start: 0, columns: 2, mirror: true },
      right:     { row: 1, start: 0, columns: 2 },
      up:        { row: 0, start: 0, columns: 2 },
      upLeft:    { row: 1, start: 0, columns: 2, mirror: true, rotate: -Math.PI / 16 },
      upRight:   { row: 1, start: 0, columns: 2,               rotate:  Math.PI / 16 },
      hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
      keypress: { up: 87, left: 65, down: 83, right: 68 }
    };

    // ────────────────────────────────────────────────────────────────────────
    // BARRIER HELPER
    // ────────────────────────────────────────────────────────────────────────
    function b(id, rx, ry, rw, rh) {
      return {
        id,
        x:      Math.round(rx * width),
        y:      Math.round(ry * height),
        width:  Math.round(rw * width),
        height: Math.round(rh * height),
        src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        visible: true,
        hitbox: { widthPercentage: 1.0, heightPercentage: 1.0 },
        fromOverlay: true
      };
    }

    // ── Outer border ──────────────────────────────────────────────────────────
    const border_top    = b('bt', 0.00, 0.00, 1.00, 0.03);
    const border_bottom = b('bb', 0.00, 0.95, 1.00, 0.05);
    const border_left   = b('bl', 0.00, 0.00, 0.03, 1.00);
    const border_right  = b('br', 0.97, 0.00, 0.03, 1.00);

    // ── Row 1 horizontal walls ────────────────────────────────────────────────
    const h1a = b('h1a', 0.03, 0.18, 0.35, 0.03);
    const h1b = b('h1b', 0.45, 0.18, 0.27, 0.03);
    const h1c = b('h1c', 0.80, 0.18, 0.17, 0.03);

    // ── Row 2 horizontal walls ────────────────────────────────────────────────
    const h2a = b('h2a', 0.03, 0.40, 0.17, 0.03);
    const h2b = b('h2b', 0.27, 0.40, 0.25, 0.03);
    const h2c = b('h2c', 0.59, 0.40, 0.21, 0.03);

    // ── Row 3 horizontal walls ────────────────────────────────────────────────
    const h3a = b('h3a', 0.14, 0.62, 0.21, 0.03);
    const h3b = b('h3b', 0.45, 0.62, 0.25, 0.03);
    const h3c = b('h3c', 0.80, 0.62, 0.17, 0.03);

    // ── Vertical walls ─────────────────────────────────────────────────────────
    const v1a = b('v1a', 0.14, 0.03, 0.03, 0.15);
    const v1b = b('v1b', 0.14, 0.21, 0.03, 0.19);
    const v1c = b('v1c', 0.14, 0.65, 0.03, 0.30);
    const v2a = b('v2a', 0.35, 0.03, 0.03, 0.37);
    const v2b = b('v2b', 0.35, 0.65, 0.03, 0.30);
    const v3a = b('v3a', 0.52, 0.21, 0.03, 0.19);
    const v3b = b('v3b', 0.52, 0.65, 0.03, 0.30);
    const v4a = b('v4a', 0.72, 0.03, 0.03, 0.37);
    const v4b = b('v4b', 0.72, 0.43, 0.03, 0.22);
    const v5a = b('v5a', 0.80, 0.21, 0.03, 0.19);

    // ────────────────────────────────────────────────────────────────────────
    // COIN SPAWN LOGIC
    //
    // Coins are placed at hand-picked relative (rx, ry) positions that sit
    // inside the open corridors/cells of the maze — i.e. NOT inside any
    // barrier rectangle.  We then verify each candidate at runtime and skip
    // it if it somehow lands in a barrier (safety net for odd window sizes).
    //
    // Open cells identified from the barrier layout:
    //   • Bottom-left start area   (S):  x 0.03–0.14, y 0.65–0.95
    //   • Bottom corridor (left):        x 0.14–0.35, y 0.65–0.95
    //   • Bottom gap (center):           x 0.35–0.45, y 0.65–0.95
    //   • Bottom corridor (right):       x 0.45–0.52, y 0.65–0.95
    //   • Mid-right open cell:           x 0.52–0.72, y 0.43–0.62
    //   • Upper-right corridor:          x 0.72–0.80, y 0.03–0.18
    //   • Mid passage gap (row2→row3):   x 0.80–0.97, y 0.43–0.62
    //   • Upper exit corridor:           x 0.80–0.97, y 0.03–0.18
    // ────────────────────────────────────────────────────────────────────────

    // All barrier rectangles in relative coords — used for overlap testing
    const barrierRects = [
      // borders
      { x1: 0.00, y1: 0.00, x2: 1.00, y2: 0.03 },
      { x1: 0.00, y1: 0.95, x2: 1.00, y2: 1.00 },
      { x1: 0.00, y1: 0.00, x2: 0.03, y2: 1.00 },
      { x1: 0.97, y1: 0.00, x2: 1.00, y2: 1.00 },
      // row 1
      { x1: 0.03, y1: 0.18, x2: 0.38, y2: 0.21 },
      { x1: 0.45, y1: 0.18, x2: 0.72, y2: 0.21 },
      { x1: 0.80, y1: 0.18, x2: 0.97, y2: 0.21 },
      // row 2
      { x1: 0.03, y1: 0.40, x2: 0.20, y2: 0.43 },
      { x1: 0.27, y1: 0.40, x2: 0.52, y2: 0.43 },
      { x1: 0.59, y1: 0.40, x2: 0.80, y2: 0.43 },
      // row 3
      { x1: 0.14, y1: 0.62, x2: 0.35, y2: 0.65 },
      { x1: 0.45, y1: 0.62, x2: 0.70, y2: 0.65 },
      { x1: 0.80, y1: 0.62, x2: 0.97, y2: 0.65 },
      // verticals
      { x1: 0.14, y1: 0.03, x2: 0.17, y2: 0.18 },
      { x1: 0.14, y1: 0.21, x2: 0.17, y2: 0.40 },
      { x1: 0.14, y1: 0.65, x2: 0.17, y2: 0.95 },
      { x1: 0.35, y1: 0.03, x2: 0.38, y2: 0.40 },
      { x1: 0.35, y1: 0.65, x2: 0.38, y2: 0.95 },
      { x1: 0.52, y1: 0.21, x2: 0.55, y2: 0.40 },
      { x1: 0.52, y1: 0.65, x2: 0.55, y2: 0.95 },
      { x1: 0.72, y1: 0.03, x2: 0.75, y2: 0.40 },
      { x1: 0.72, y1: 0.43, x2: 0.75, y2: 0.65 },
      { x1: 0.80, y1: 0.21, x2: 0.83, y2: 0.40 },
    ];

    /**
     * Returns true if the relative point (rx, ry) is inside any barrier rect
     * (with a small padding so coins don't clip walls).
     */
    function overlapsBarrier(rx, ry, pad = 0.03) {
      return barrierRects.some(r =>
        rx > r.x1 - pad && rx < r.x2 + pad &&
        ry > r.y1 - pad && ry < r.y2 + pad
      );
    }

    // Hand-picked coin positions — one per open corridor/cell so the player
    // must navigate the whole maze to collect all five.
    const coinPositionsRel = [
      // 1. Bottom-left start corridor  (between border_left / v1c / border_bottom)
      { rx: 0.08, ry: 0.80 },
      // 2. Bottom-center gap           (between v1c and v2b, below h3a)
      { rx: 0.24, ry: 0.75 },
      // 3. Bottom passage gap          (between h3a and h3b, row3 opening)
      { rx: 0.40, ry: 0.80 },
      // 4. Mid-right open cell         (between v3b, v4b, h2c, h3b)
      { rx: 0.63, ry: 0.52 },
      // 5. Upper-right corridor        (between v4a, border_right, above h1c)
      { rx: 0.88, ry: 0.10 },
    ];

    // Build verified coin data list
    const COIN_RADIUS = Math.round(Math.min(width, height) * 0.018); // ~1.8% of smallest dimension
    const coinDataList = coinPositionsRel
      .filter(({ rx, ry }) => !overlapsBarrier(rx, ry))
      .map((pos, i) => ({
        id:     `coin_${i}`,
        x:      Math.round(pos.rx * width),
        y:      Math.round(pos.ry * height),
        radius: COIN_RADIUS
      }));

    // Spawn coins and hook their update() into the game loop via a proxy object
    // registered in this.classes as a plain-object "class" entry.
    // We use a wrapper shim so the engine instantiates them the same way.
    const coinShims = coinDataList.map(data => ({
      class: class CoinShim {
        constructor(_data, env) { return new Coin(data, env); }
      },
      data: {}
    }));

    // ── NPC: Whispering Shadow ────────────────────────────────────────────────
    const sprite_greet_shadow = "...the exit lies where the walls grow thin...";
    const sprite_data_shadow = {
      id: 'Whispering Shadow',
      greeting: sprite_greet_shadow,
      src: path + "/images/gamify/tux.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 256, width: 352 },
      INIT_POSITION: { x: 0.22, y: 0.72 },
      orientation: { rows: 8, columns: 11 },
      down: { row: 5, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "...go north. Or was it south? I forget...",
        "The walls shift when you're not looking. Trust nothing.",
        "I've wandered here for ages. The exit... it moves.",
        "Follow the cold air. It always leads somewhere.",
        "Collect the golden sparks — five of them. Only then will the Warden speak."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_shadow);
      },
      interact: function() {
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
          this.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.showRandomDialogue();
      }
    };

    // ── NPC: Lantern Keeper ───────────────────────────────────────────────────
    const sprite_greet_lantern = "Take this light. The dark ones fear it.";
    const sprite_data_lantern = {
      id: 'Lantern Keeper',
      greeting: sprite_greet_lantern,
      src: path + "/images/gamify/octocat.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 301, width: 801 },
      INIT_POSITION: { x: 0.60, y: 0.50 },
      orientation: { rows: 1, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.1 },
      dialogues: [
        "The shadow that hunts you knows where you're going.",
        "South corridor. Bottom row. That is all I'll say.",
        "Keep moving. Standing still is how the maze wins.",
        "You're the third wanderer this week. The others... didn't make it.",
        "Find the five golden coins hidden through these corridors — then the Warden will let you pass."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_lantern);
      },
      interact: function() {
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
          this.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.showRandomDialogue();
      }
    };

    // ── NPC: Exit Warden ──────────────────────────────────────────────────────
    // Gated: player must have collected 5 coins to receive the exit dialogue.
    const sprite_greet_warden = "You made it through. The exit is right here.";
    const sprite_data_warden = {
      id: 'Exit Warden',
      greeting: sprite_greet_warden,
      src: path + "/images/gamify/robot.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 100,
      pixels: { height: 316, width: 627 },
      INIT_POSITION: { x: 0.86, y: 0.06 },
      orientation: { rows: 3, columns: 6 },
      down: { row: 1, start: 0, columns: 6 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "You made it. Not many do.",
        "The maze is behind you now. Step through.",
        "Quickly — something is still in there. Go."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_warden);
      },
      interact: function() {
        // ── COIN GATE ────────────────────────────────────────────────────────
        const collected = gameEnv.coinsCollected ?? 0;
        const needed    = 5;

        if (collected < needed) {
          // Not enough coins — show a locked message and return early
          if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
            this.dialogueSystem.closeDialogue();
            return;
          }
          if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
          this.dialogueSystem.showDialogue(
            `The gate remains sealed. You have ${collected} of ${needed} golden coins. ` +
            `Seek the remaining ${needed - collected} — only then may you pass.`,
            "Exit Warden",
            this.spriteData.src
          );
          this.dialogueSystem.addButtons([{
            text: "I'll find them",
            action: () => this.dialogueSystem.closeDialogue()
          }]);
          return;
        }
        // ── GATE OPEN ────────────────────────────────────────────────────────
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
          this.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.dialogueSystem.showDialogue(
          "You navigated the maze and gathered every coin. The gate ahead pulses with light. Are you ready to move on?",
          "Exit Warden",
          this.spriteData.src
        );
        this.dialogueSystem.addButtons([
          {
            text: "Step Through",
            primary: true,
            action: () => {
              this.dialogueSystem.closeDialogue();

              // Clean up the HUD before transitioning
              const hud = document.getElementById('coinHUD');
              if (hud && hud.parentNode) hud.parentNode.removeChild(hud);

              const primaryGame = gameEnv.gameControl;

              const fade = document.createElement('div');
              Object.assign(fade.style, {
                position: 'fixed',
                top: '0', left: '0',
                width: '100%', height: '100%',
                backgroundColor: '#000',
                opacity: '0',
                transition: 'opacity 0.8s ease-in-out',
                zIndex: '9999',
                pointerEvents: 'none'
              });
              document.body.appendChild(fade);

              requestAnimationFrame(() => {
                fade.style.opacity = '1';
                setTimeout(() => {
                  const gameContainer = document.getElementById('gameContainer');
                  if (gameContainer) {
                    Array.from(gameContainer.children).forEach(child => {
                      if (child.id !== 'promptDropDown') {
                        gameContainer.removeChild(child);
                      }
                    });
                  }

                  const topGame = primaryGame?.parentControl || primaryGame;
                  if (topGame) {
                    topGame.levelClasses = [GameLevelDoors];
                    topGame.currentLevelIndex = 0;
                    topGame.isPaused = false;
                    topGame.transitionToLevel();
                  }
                  setTimeout(() => {
                    fade.style.opacity = '0';
                    setTimeout(() => {
                      if (fade.parentNode) fade.parentNode.removeChild(fade);
                    }, 800);
                  }, 400);
                }, 800);
              });
            }
          },
          {
            text: "Not yet",
            action: () => this.dialogueSystem.closeDialogue()
          }
        ]);
      }
    };

    // ── Level class list ──────────────────────────────────────────────────────
    this.classes = [
      { class: GameEnvBackground, data: image_data_cave },

      // Outer border
      { class: Barrier, data: border_top    },
      { class: Barrier, data: border_bottom },
      { class: Barrier, data: border_left   },
      { class: Barrier, data: border_right  },

      // Row 1 walls
      { class: Barrier, data: h1a },
      { class: Barrier, data: h1b },
      { class: Barrier, data: h1c },

      // Row 2 walls
      { class: Barrier, data: h2a },
      { class: Barrier, data: h2b },
      { class: Barrier, data: h2c },

      // Row 3 walls
      { class: Barrier, data: h3a },
      { class: Barrier, data: h3b },
      { class: Barrier, data: h3c },

      // Vertical walls
      { class: Barrier, data: v1a },
      { class: Barrier, data: v1b },
      { class: Barrier, data: v1c },
      { class: Barrier, data: v2a },
      { class: Barrier, data: v2b },
      { class: Barrier, data: v3a },
      { class: Barrier, data: v3b },
      { class: Barrier, data: v4a },
      { class: Barrier, data: v4b },
      { class: Barrier, data: v5a },

      // Coins (spawned in verified open cells only)
      ...coinShims,

      // NPCs
      { class: Npc, data: sprite_data_shadow  },
      { class: Npc, data: sprite_data_lantern },
      { class: Npc, data: sprite_data_warden  },

      // Player last
      { class: Player, data: sprite_data_octopus },
    ];
  }
}

export default GameLevelMazeSub;