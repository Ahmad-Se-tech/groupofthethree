// Third Level — The Maze of Shadows (sublevel)
// Save as: assets/js/GameEnginev1.1/GameLevelMazeSub.js

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';
import SplineBarrier from './essentials/SplineBarrier.js';
import DialogueSystem from './essentials/DialogueSystem.js';
import GameControl from './essentials/GameControl.js';
import GameLevelDoors from './GameLevelDoors.js';
import Coin from './Coin.js';

class GameLevelMazeSub {
  constructor(gameEnv) {
    console.log("Initializing GameLevelMazeSub...");

    this.gameEnv = gameEnv;

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
    const OCTOPUS_SCALE_FACTOR = 9;
    const sprite_data_octopus = {
      id: 'Octopus',
      greeting: "I must find my way through...",
      src: path + "/images/gamify/octopus.png",
      SCALE_FACTOR: OCTOPUS_SCALE_FACTOR,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 50,
      GRAVITY: true,
      INIT_POSITION: { x: 0.05, y: 0.75 },
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

    // ── Flat floor (regular Barrier) ──────────────────────────────────────────
    function b(id, rx, ry, rw, rh) {
      return {
        id,
        x:      Math.round(rx * width),
        y:      Math.round(ry * height),
        width:  Math.round(rw * width),
        height: Math.round(rh * height),
        src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        visible: true,
        hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
        fromOverlay: true
      };
    }

    const floor = b('floor', 0.00, 0.90, 1.00, 0.10);

    // ── SplineBarrier helper ──────────────────────────────────────────────────
    // All points are in relative [0..1] coords, converted to pixels here.
    // opts.color / borderColor / platformHeight can be overridden per ledge.
    function sp(id, points, opts = {}) {
      return {
        id,
        color:          opts.color          ?? 'rgba(255, 0, 0, 0.3)',
        borderColor:    opts.borderColor    ?? 'rgba(225, 0, 0, 0.8)',
        lineWidth:      opts.lineWidth      ?? 2,
        platformHeight: opts.platformHeight ?? 18,
        visible:        opts.visible        ?? true,
        splinePoints: points.map(p => ({
          x: Math.round(p.x * width),
          y: Math.round(p.y * height)
        }))
      };
    }

    // ── Ledge layout ──────────────────────────────────────────────────────────
    //
    // Zigzag staircase — each ledge overlaps ~20% with the next so the
    // player can make the jump. NPCs sit on ledges 2, 4 and 5.
    //
    //   ledge5  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  (x 0.55–0.95, y ~0.12)
    //   ledge4  ░░░░░░░░░░░░░░░░░░░░         (x 0.10–0.60, y ~0.27)
    //   ledge3  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  (x 0.40–0.95, y ~0.43)
    //   ledge2  ░░░░░░░░░░░░░░░░░░░░         (x 0.05–0.55, y ~0.58)
    //   ledge1  ░░░░░░░░░░░░░░░░░░░░░░░░░░░  (x 0.00–0.50, y ~0.78)
    //   floor   ═══════════════════════════  (y 0.90)
    //
    // The player starts above ledge1 and must climb up-right, up-left, …

    // Ledge 1 — wide, low, left side. Player spawns just above this.
    const ledge1 = sp('ledge1', [
      { x: 0.00, y: 0.80 },
      { x: 0.12, y: 0.79 },
      { x: 0.28, y: 0.78 },
      { x: 0.44, y: 0.78 },
      { x: 0.50, y: 0.79 }
    ]);

    // Ledge 2 — mid-left, slight gentle curve, overlaps ledge1 on right side
    const ledge2 = sp('ledge2', [
      { x: 0.05, y: 0.60 },
      { x: 0.18, y: 0.59 },
      { x: 0.34, y: 0.58 },
      { x: 0.48, y: 0.58 },
      { x: 0.55, y: 0.59 }
    ]);

    // Ledge 3 — right side, overlaps ledge2 on left end
    const ledge3 = sp('ledge3', [
      { x: 0.40, y: 0.45 },
      { x: 0.54, y: 0.44 },
      { x: 0.68, y: 0.43 },
      { x: 0.82, y: 0.43 },
      { x: 0.95, y: 0.44 }
    ]);

    // Ledge 4 — back left, overlaps ledge3 on right end
    const ledge4 = sp('ledge4', [
      { x: 0.10, y: 0.29 },
      { x: 0.22, y: 0.28 },
      { x: 0.36, y: 0.27 },
      { x: 0.50, y: 0.27 },
      { x: 0.60, y: 0.28 }
    ]);

    // Ledge 5 — top right, Exit Warden stands here. Slight downward bow for style.
    const ledge5 = sp('ledge5', [
      { x: 0.55, y: 0.13 },
      { x: 0.66, y: 0.12 },
      { x: 0.76, y: 0.12 },
      { x: 0.86, y: 0.13 },
      { x: 0.95, y: 0.13 }
    ]);

    // ── NPCs ──────────────────────────────────────────────────────────────────

    const sprite_greet_shadow = "Keep climbing. The exit is above you.";
    const sprite_data_shadow = {
      id: 'Whispering Shadow',
      greeting: sprite_greet_shadow,
      src: path + "/images/gamify/tux.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 256, width: 352 },
      INIT_POSITION: { x: 0.30, y: 0.48 },   // sits on ledge2
      orientation: { rows: 8, columns: 11 },
      down: { row: 5, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "Keep climbing. The exit is above you.",
        "Each step brings you closer. Don't look down.",
        "I've been here a while. You're the first to make it this far.",
        "The top platform. That's where you need to go."
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

    const sprite_greet_lantern = "Almost there. One more jump.";
    const sprite_data_lantern = {
      id: 'Lantern Keeper',
      greeting: sprite_greet_lantern,
      src: path + "/images/gamify/octocat.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 301, width: 801 },
      INIT_POSITION: { x: 0.35, y: 0.17 },   // sits on ledge4
      orientation: { rows: 1, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.1 },
      dialogues: [
        "Almost there. One more jump.",
        "The warden is just above. Don't stop now.",
        "You've climbed further than most.",
        "I can see the exit from here. Keep going."
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

    const sprite_greet_warden = "You made it through. The exit is right here.";
    const sprite_data_warden = {
      id: 'Exit Warden',
      greeting: sprite_greet_warden,
      src: path + "/images/gamify/robot.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 100,
      pixels: { height: 316, width: 627 },
      INIT_POSITION: { x: 0.75, y: 0.02 },   // sits on ledge5
      orientation: { rows: 3, columns: 6 },
      down: { row: 1, start: 0, columns: 6 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "You made it. Not many do.",
        "The maze is behind you now. Step through.",
        "Quickly — something is still down there. Go."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_warden);
      },
      interact: function() {
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
          this.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.dialogueSystem.showDialogue(
          "You climbed to the top. The gate ahead pulses with light. Are you ready to move on?",
          "Exit Warden",
          this.spriteData.src
        );
        this.dialogueSystem.addButtons([
          {
            text: "Step Through",
            primary: true,
            action: () => {
              this.dialogueSystem.closeDialogue();

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

    // Coin — on ledge3 as a mid-climb reward
    const sprite_data_coin = {
      id: 'coin',
      greeting: false,
      INIT_POSITION: { x: 0.65, y: 0.33 },
      width: 40,
      height: 70,
      color: '#FFD700',
      hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
      zIndex: 12,
      value: 1
    };

    // ── Level class list ──────────────────────────────────────────────────────
    this.classes = [
      { class: GameEnvBackground, data: image_data_cave },

      // Flat floor
      { class: Barrier,       data: floor   },

      // Curved cave ledges
      { class: SplineBarrier, data: ledge1 },
      { class: SplineBarrier, data: ledge2 },
      { class: SplineBarrier, data: ledge3 },
      { class: SplineBarrier, data: ledge4 },
      { class: SplineBarrier, data: ledge5 },

      { class: Coin, data: sprite_data_coin },

      { class: Npc,  data: sprite_data_shadow  },
      { class: Npc,  data: sprite_data_lantern },
      { class: Npc,  data: sprite_data_warden  },

      { class: Player, data: sprite_data_octopus },
    ];
  }
}

export default GameLevelMazeSub;