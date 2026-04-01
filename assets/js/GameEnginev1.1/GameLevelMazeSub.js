// Third Level — The Maze of Shadows (sublevel)
// Save as: assets/js/GameEnginev1.1/GameLevelMazeSub.js

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';
import DialogueSystem from './essentials/DialogueSystem.js';
import GameLevelDoors from './GameLevelDoors.js';

class GameLevelMazeSub {
  constructor(gameEnv) {
    console.log("Initializing GameLevelMazeSub...");

    this.gameEnv = gameEnv;
    gameEnv.coinsCollected = 0;

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
    const sprite_data_octopus = {
      id: 'Octopus',
      greeting: "I must find my way through...",
      src: path + "/images/gamify/octopus.png",
      SCALE_FACTOR: 5,
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

    // ── Barrier helper ────────────────────────────────────────────────────────
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

    // ── Borders ───────────────────────────────────────────────────────────────
    const border_top    = b('bt', 0.00, 0.00, 1.00, 0.03);
    const border_bottom = b('bb', 0.00, 0.95, 1.00, 0.05);
    const border_left   = b('bl', 0.00, 0.00, 0.03, 1.00);
    const border_right  = b('br', 0.97, 0.00, 0.03, 1.00);

    const h1a = b('h1a', 0.03, 0.18, 0.35, 0.03);
    const h1b = b('h1b', 0.45, 0.18, 0.27, 0.03);
    const h1c = b('h1c', 0.80, 0.18, 0.17, 0.03);

    const h2a = b('h2a', 0.03, 0.40, 0.17, 0.03);
    const h2b = b('h2b', 0.27, 0.40, 0.25, 0.03);
    const h2c = b('h2c', 0.59, 0.40, 0.21, 0.03);

    const h3a = b('h3a', 0.14, 0.62, 0.21, 0.03);
    const h3b = b('h3b', 0.45, 0.62, 0.25, 0.03);
    const h3c = b('h3c', 0.80, 0.62, 0.17, 0.03);

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

    // ─────────────────────────────────────────────────────────────────────────
    // COINS
    // Plain <div> elements injected directly into #gameContainer.
    // Positions are hand-picked to sit inside open maze corridors.
    // A setInterval checks player overlap every 100ms and removes coins on hit.
    // Once all 5 are collected the interval clears itself — no more spawning.
    // ─────────────────────────────────────────────────────────────────────────

    const COIN_SIZE   = 28;
    const COINS_NEEDED = 5;

    // One coin per open corridor so the player must explore the whole maze
    const coinPositions = [
      { rx: 0.08, ry: 0.80 },  // bottom-left start area
      { rx: 0.24, ry: 0.75 },  // bottom-center corridor
      { rx: 0.40, ry: 0.80 },  // gap between h3a and h3b
      { rx: 0.63, ry: 0.52 },  // mid-right open cell
      { rx: 0.88, ry: 0.10 },  // upper-right exit corridor
    ];

    // Wipe any stale coins / HUD from a previous level load
    document.querySelectorAll('.maze-coin').forEach(el => el.remove());
    const oldHUD = document.getElementById('coinHUD');
    if (oldHUD) oldHUD.remove();
    if (gameEnv._coinInterval) {
      clearInterval(gameEnv._coinInterval);
      gameEnv._coinInterval = null;
    }

    const container = document.getElementById('gameContainer') ?? document.body;
    const coinEls   = [];

    coinPositions.forEach((pos) => {
      const el = document.createElement('div');
      el.className = 'maze-coin';
      Object.assign(el.style, {
        position:       'absolute',
        left:           (Math.round(pos.rx * width)  - COIN_SIZE / 2) + 'px',
        top:            (Math.round(pos.ry * height) - COIN_SIZE / 2) + 'px',
        width:          COIN_SIZE + 'px',
        height:         COIN_SIZE + 'px',
        borderRadius:   '50%',
        background:     'radial-gradient(circle at 35% 35%, #FFE566, #FFB800 60%, #CC8800)',
        border:         '2px solid #996600',
        boxShadow:      '0 0 8px 3px rgba(255,200,0,0.6)',
        zIndex:         '50',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       '14px',
        color:          '#7A4F00',
        fontWeight:     'bold',
        pointerEvents:  'none',
        userSelect:     'none',
      });
      el.textContent = '✦';
      container.appendChild(el);
      coinEls.push(el);
    });

    // HUD
    const hud = document.createElement('div');
    hud.id = 'coinHUD';
    Object.assign(hud.style, {
      position:      'fixed',
      top:           '12px',
      left:          '50%',
      transform:     'translateX(-50%)',
      background:    'rgba(0,0,0,0.7)',
      color:         '#FFD700',
      font:          'bold 18px serif',
      padding:       '6px 20px',
      borderRadius:  '20px',
      border:        '2px solid #FFB800',
      zIndex:        '10000',
      userSelect:    'none',
      letterSpacing: '1px',
      textShadow:    '0 0 8px #FFD700',
      pointerEvents: 'none',
    });
    hud.textContent = `✦ 0 / ${COINS_NEEDED} coins`;
    document.body.appendChild(hud);

    function updateHUD() {
      const n = gameEnv.coinsCollected;
      if (n >= COINS_NEEDED) {
        hud.textContent  = `✦ ${COINS_NEEDED} / ${COINS_NEEDED}  — Find the Exit Warden!`;
        hud.style.color  = '#00FF88';
        hud.style.border = '2px solid #00FF88';
        hud.style.textShadow = '0 0 8px #00FF88';
      } else {
        hud.textContent  = `✦ ${n} / ${COINS_NEEDED} coins`;
        hud.style.color  = '#FFD700';
        hud.style.border = '2px solid #FFB800';
        hud.style.textShadow = '0 0 8px #FFD700';
      }
    }

    // Collision loop
    const collisionInterval = setInterval(() => {
      const playerCanvas = document.getElementById('Octopus');
      if (!playerCanvas) return;

      const pL = parseInt(playerCanvas.style.left || '0', 10);
      const pT = parseInt(playerCanvas.style.top  || '0', 10);
      const pR = pL + playerCanvas.width;
      const pB = pT + playerCanvas.height;

      for (let i = coinEls.length - 1; i >= 0; i--) {
        const el = coinEls[i];
        if (!el.parentNode) {
          coinEls.splice(i, 1);
          continue;
        }

        const cL = parseInt(el.style.left, 10);
        const cT = parseInt(el.style.top,  10);
        const cR = cL + COIN_SIZE;
        const cB = cT + COIN_SIZE;

        if (pL < cR && pR > cL && pT < cB && pB > cT) {
          el.remove();
          coinEls.splice(i, 1);
          gameEnv.coinsCollected += 1;
          updateHUD();
        }
      }

      // Stop once all collected — coins are gone, no reason to keep polling
      if (gameEnv.coinsCollected >= COINS_NEEDED) {
        clearInterval(collisionInterval);
        gameEnv._coinInterval = null;
      }
    }, 100);

    gameEnv._coinInterval = collisionInterval;

    // ── NPCs ──────────────────────────────────────────────────────────────────

    const sprite_data_shadow = {
      id: 'Whispering Shadow',
      greeting: "...the exit lies where the walls grow thin...",
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
        "Collect all five golden coins. Only then will the Warden open the gate.",
      ],
      reaction: function() { if (this.dialogueSystem) this.showReactionDialogue(); },
      interact: function() {
        if (this.dialogueSystem?.isDialogueOpen()) { this.dialogueSystem.closeDialogue(); return; }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.showRandomDialogue();
      }
    };

    const sprite_data_lantern = {
      id: 'Lantern Keeper',
      greeting: "Take this light. The dark ones fear it.",
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
        "Find all five golden coins — then seek the Exit Warden in the top-right.",
      ],
      reaction: function() { if (this.dialogueSystem) this.showReactionDialogue(); },
      interact: function() {
        if (this.dialogueSystem?.isDialogueOpen()) { this.dialogueSystem.closeDialogue(); return; }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.showRandomDialogue();
      }
    };

    const sprite_data_warden = {
      id: 'Exit Warden',
      greeting: "You made it through. The exit is right here.",
      src: path + "/images/gamify/robot.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 100,
      pixels: { height: 316, width: 627 },
      INIT_POSITION: { x: 0.86, y: 0.06 },
      orientation: { rows: 3, columns: 6 },
      down: { row: 1, start: 0, columns: 6 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      reaction: function() { if (this.dialogueSystem) this.showReactionDialogue(); },
      interact: function() {
        const collected = gameEnv.coinsCollected ?? 0;

        if (this.dialogueSystem?.isDialogueOpen()) {
          this.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();

        // Gate: not enough coins
        if (collected < COINS_NEEDED) {
          this.dialogueSystem.showDialogue(
            `The gate is sealed. You carry ${collected} of ${COINS_NEEDED} coins. ` +
            `Find the remaining ${COINS_NEEDED - collected} before I can open it.`,
            "Exit Warden",
            this.spriteData?.src ?? ""
          );
          this.dialogueSystem.addButtons([{
            text: "I'll find them",
            action: () => this.dialogueSystem.closeDialogue()
          }]);
          return;
        }

        // Gate open
        this.dialogueSystem.showDialogue(
          "You found all five coins and navigated the maze. The gate pulses with light. Ready to move on?",
          "Exit Warden",
          this.spriteData?.src ?? ""
        );
        this.dialogueSystem.addButtons([
          {
            text: "Step Through",
            primary: true,
            action: () => {
              this.dialogueSystem.closeDialogue();

              // Cleanup
              document.querySelectorAll('.maze-coin').forEach(el => el.remove());
              if (gameEnv._coinInterval) { clearInterval(gameEnv._coinInterval); gameEnv._coinInterval = null; }
              const h = document.getElementById('coinHUD');
              if (h) h.remove();

              const primaryGame = gameEnv.gameControl;
              const fade = document.createElement('div');
              Object.assign(fade.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100%', height: '100%',
                backgroundColor: '#000', opacity: '0',
                transition: 'opacity 0.8s ease-in-out',
                zIndex: '9999', pointerEvents: 'none'
              });
              document.body.appendChild(fade);

              requestAnimationFrame(() => {
                fade.style.opacity = '1';
                setTimeout(() => {
                  const gameContainer = document.getElementById('gameContainer');
                  if (gameContainer) {
                    Array.from(gameContainer.children).forEach(child => {
                      if (child.id !== 'promptDropDown') gameContainer.removeChild(child);
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
                    setTimeout(() => { if (fade.parentNode) fade.parentNode.removeChild(fade); }, 800);
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

    // ── Class list ────────────────────────────────────────────────────────────
    this.classes = [
      { class: GameEnvBackground, data: image_data_cave },

      { class: Barrier, data: border_top    },
      { class: Barrier, data: border_bottom },
      { class: Barrier, data: border_left   },
      { class: Barrier, data: border_right  },

      { class: Barrier, data: h1a },
      { class: Barrier, data: h1b },
      { class: Barrier, data: h1c },

      { class: Barrier, data: h2a },
      { class: Barrier, data: h2b },
      { class: Barrier, data: h2c },

      { class: Barrier, data: h3a },
      { class: Barrier, data: h3b },
      { class: Barrier, data: h3c },

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

      { class: Npc, data: sprite_data_shadow  },
      { class: Npc, data: sprite_data_lantern },
      { class: Npc, data: sprite_data_warden  },

      { class: Player, data: sprite_data_octopus },
    ];
  }
}

export default GameLevelMazeSub;