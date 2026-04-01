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
    const OCTOPUS_SCALE_FACTOR = 5;
    const sprite_data_octopus = {
      id: 'Octopus',
      greeting: "I must find my way through...",
      src: path + "/images/gamify/octopus.png",
      SCALE_FACTOR: OCTOPUS_SCALE_FACTOR,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 50,
      GRAVITY: true,
      INIT_POSITION: { x: 0.05, y: 0.82 },  // bottom-left start
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
    // Converts relative (0.0–1.0) coords to absolute pixels.
    // color is applied via a CSS data URI so barriers render as styled
    // solid blocks — dark stone look — without needing an image file.
    // ────────────────────────────────────────────────────────────────────────
    function b(id, rx, ry, rw, rh) {
      return {
        id,
        x:      Math.round(rx * width),
        y:      Math.round(ry * height),
        width:  Math.round(rw * width),
        height: Math.round(rh * height),
        // A 1×1 dark stone colour rendered via inline data URI.
        // The engine scales this to the barrier dimensions automatically.
        src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        // Override the tint with CSS if the engine supports it, otherwise
        // the dark fallback colour below will show through.
        visible: true,
        hitbox: { widthPercentage: 0.0, heightPercentage: 0.0 },
        fromOverlay: true
      };
    }

    // ────────────────────────────────────────────────────────────────────────
    // MAZE LAYOUT (relative coords, 0.0–1.0)
    //
    // Path: player starts bottom-left (S), must reach Exit Warden top-right (E)
    //
    //  ┌──────────────────────────────────────────┐
    //  │                                      [E] │
    //  │  ┌────────────┐   ┌─────────────────┐   │
    //  │  │            │   │                 │   │
    //  │  │  ┌──────┐  │   │  ┌──────────┐  │   │
    //  │  │  │      │  └───┘  │          │  └───┘
    //  │  └──┘      └─────────┘          │
    //  │                                 │
    //  │ [S]                             │
    //  └─────────────────────────────────┘
    //
    // ────────────────────────────────────────────────────────────────────────

    // ── Outer border ──────────────────────────────────────────────────────────
    const border_top    = b('bt', 0.00, 0.00, 1.00, 0.03);
    const border_bottom = b('bb', 0.00, 0.95, 1.00, 0.05);
    const border_left   = b('bl', 0.00, 0.00, 0.03, 1.00);
    const border_right  = b('br', 0.97, 0.00, 0.03, 1.00);

    // ── Row 1 horizontal walls ── (top section, gap right for exit approach)
    // Left segment:  0.03 → 0.38  (gap 0.38–0.45)
    const h1a = b('h1a', 0.03, 0.18, 0.35, 0.03);
    // Right segment: 0.45 → 0.72  (gap 0.72–0.80 open for exit corridor)
    const h1b = b('h1b', 0.45, 0.18, 0.27, 0.03);
    // Far right:     0.80 → 0.97
    const h1c = b('h1c', 0.80, 0.18, 0.17, 0.03);

    // ── Row 2 horizontal walls ── (middle section)
    // Left:   0.03 → 0.20  (gap 0.20–0.27)
    const h2a = b('h2a', 0.03, 0.40, 0.17, 0.03);
    // Center: 0.27 → 0.52  (gap 0.52–0.59)
    const h2b = b('h2b', 0.27, 0.40, 0.25, 0.03);
    // Right:  0.59 → 0.80  (gap 0.80–0.97 open — leads up)
    const h2c = b('h2c', 0.59, 0.40, 0.21, 0.03);

    // ── Row 3 horizontal walls ── (lower section)
    // Left:    0.14 → 0.35  (gap 0.03–0.14 player start area)
    const h3a = b('h3a', 0.14, 0.62, 0.21, 0.03);
    // Center:  0.45 → 0.70  (gap 0.35–0.45)
    const h3b = b('h3b', 0.45, 0.62, 0.25, 0.03);
    // Right:   0.80 → 0.97  (gap 0.70–0.80)
    const h3c = b('h3c', 0.80, 0.62, 0.17, 0.03);

    // ── Vertical walls ────────────────────────────────────────────────────────

    // Left inner column — gap between rows 2 and 3 (0.43–0.62) for passage
    const v1a = b('v1a', 0.14, 0.03, 0.03, 0.15);  // top → row1
    const v1b = b('v1b', 0.14, 0.21, 0.03, 0.19);  // row1 → row2
    const v1c = b('v1c', 0.14, 0.65, 0.03, 0.30);  // row3 → bottom

    // Center-left column — gap at row2 level
    const v2a = b('v2a', 0.35, 0.03, 0.03, 0.37);  // top → row2
    const v2b = b('v2b', 0.35, 0.65, 0.03, 0.30);  // row3 → bottom

    // Center column — gap between row1 and row2
    const v3a = b('v3a', 0.52, 0.21, 0.03, 0.19);  // row1 → row2
    const v3b = b('v3b', 0.52, 0.65, 0.03, 0.30);  // row3 → bottom

    // Right inner column — gap at row3 level
    const v4a = b('v4a', 0.72, 0.03, 0.03, 0.37);  // top → row2
    const v4b = b('v4b', 0.72, 0.43, 0.03, 0.22);  // row2 → row3

    // Far-right column — forms exit corridor on right side
    const v5a = b('v5a', 0.80, 0.21, 0.03, 0.19);  // row1 → row2

    // ── NPC: Whispering Shadow — bottom center, reachable early ──────────────
    const sprite_greet_shadow = "...the exit lies where the walls grow thin...";
    const sprite_data_shadow = {
      id: 'Whispering Shadow',
      greeting: sprite_greet_shadow,
      src: path + "/images/gamify/tux.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 256, width: 352 },
      INIT_POSITION: { x: 0.22, y: 0.72 },  // bottom open corridor, not blocking
      orientation: { rows: 8, columns: 11 },
      down: { row: 5, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "...go north. Or was it south? I forget...",
        "The walls shift when you're not looking. Trust nothing.",
        "I've wandered here for ages. The exit... it moves.",
        "Follow the cold air. It always leads somewhere."
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

    // ── NPC: Lantern Keeper — mid-maze open cell, not blocking any passage ────
    const sprite_greet_lantern = "Take this light. The dark ones fear it.";
    const sprite_data_lantern = {
      id: 'Lantern Keeper',
      greeting: sprite_greet_lantern,
      src: path + "/images/gamify/octocat.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 301, width: 801 },
      INIT_POSITION: { x: 0.60, y: 0.50 },  // open cell between v3 and v4, row2–row3
      orientation: { rows: 1, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.1 },
      dialogues: [
        "The shadow that hunts you knows where you're going.",
        "South corridor. Bottom row. That is all I'll say.",
        "Keep moving. Standing still is how the maze wins.",
        "You're the third wanderer this week. The others... didn't make it."
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

    // ── NPC: Exit Warden — top-right open cell, clear of all walls ───────────
    const sprite_greet_warden = "You made it through. The exit is right here.";
    const sprite_data_warden = {
      id: 'Exit Warden',
      greeting: sprite_greet_warden,
      src: path + "/images/gamify/robot.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 100,
      pixels: { height: 316, width: 627 },
      INIT_POSITION: { x: 0.86, y: 0.06 },  // top-right cell, above h1c, right of v4
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
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
          this.dialogueSystem.closeDialogue();
          return;
        }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.dialogueSystem.showDialogue(
          "You navigated the maze. The gate ahead pulses with light. Are you ready to move on?",
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
                  // The engine stacks canvases without removing old ones.
                  // Manually wipe everything from #gameContainer except
                  // #promptDropDown, then let transitionToLevel rebuild fresh.
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

      // NPCs — placed in open cells, not blocking corridors
      { class: Npc,    data: sprite_data_shadow  },
      { class: Npc,    data: sprite_data_lantern },
      { class: Npc,    data: sprite_data_warden  },

      // Player last
      { class: Player, data: sprite_data_octopus },
    ];
  }
}

export default GameLevelMazeSub;