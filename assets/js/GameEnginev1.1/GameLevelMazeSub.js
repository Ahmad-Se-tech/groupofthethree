// Third Level — The Maze of Shadows (sublevel)
// Save as: assets/js/GameEnginev1.1/GameLevelMazeSub.js
// Launched by the Gate Keeper NPC in GameLevelMaze.js via GameControl.

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import DialogueSystem from './essentials/DialogueSystem.js';
import GameControl from './essentials/GameControl.js';
import GameLevelDoors from './GameLevelDoors.js';
import Coin from './Coin.js';
import SplineBarrier from './SplineBarrier.js'; // ← replaces Barrier

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
      INIT_POSITION: { x: 0.03, y: 0.88 },
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

    // ── Spline barrier helper ─────────────────────────────────────────────────
    // points: array of [relX, relY] pairs (0.0–1.0 relative to screen)
    // SplineBarrier reads data.splinePoints (pixel coords), so we convert here.
    function spline(id, points) {
      return {
        id,
        splinePoints: points.map(([px, py]) => ({  // ← key must be 'splinePoints'
          x: Math.round(px * width),
          y: Math.round(py * height)
        })),
        visible: true,
        color: '#8B4513',
        // Keep this fairly thick so collision detection remains reliable.
        lineWidth: 22,
      };
    }

    // ── Pathway — winding spline road from [S] bottom-left to [E] top-right ──
    //
    //   [E] Warden ─────────────────────────────────────────╮
    //                                               ╭───────╯
    //                                Lantern ──────╮
    //                         ╭────────────────────╯
    //                   ╭─────╯
    //             Shadow ──────╮
    //         ╭────────────────╯
    //    [S] ─╯

    const seg1 = spline('seg1', [
      [0.03, 0.945],
      [0.09, 0.940],
      [0.20, 0.920],
      [0.28, 0.895],
    ]);

    const seg2 = spline('seg2', [
      [0.28, 0.895],
      [0.38, 0.868],
      [0.40, 0.830],
      [0.36, 0.790],
      [0.29, 0.760],
    ]);

    const seg3 = spline('seg3', [
      [0.29, 0.760],
      [0.22, 0.730],
      [0.19, 0.690],
      [0.23, 0.640],
      [0.31, 0.610],
    ]);

    const seg4 = spline('seg4', [
      [0.31, 0.610],
      [0.42, 0.575],
      [0.52, 0.545],
      [0.55, 0.500],
      [0.54, 0.455],
    ]);

    const seg5 = spline('seg5', [
      [0.54, 0.455],
      [0.52, 0.405],
      [0.54, 0.360],
      [0.60, 0.320],
      [0.70, 0.290],
    ]);

    const seg6 = spline('seg6', [
      [0.70, 0.290],
      [0.80, 0.260],
      [0.88, 0.220],
      [0.94, 0.170],
      [0.97, 0.120],
    ]);

    // ── NPCs ──────────────────────────────────────────────────────────────────

    const sprite_greet_shadow = "Keep going. The path winds upward.";
    const sprite_data_shadow = {
      id: 'Whispering Shadow',
      greeting: sprite_greet_shadow,
      src: path + "/images/gamify/tux.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 256, width: 352 },
      INIT_POSITION: { x: 0.30, y: 0.73 },
      orientation: { rows: 8, columns: 11 },
      down: { row: 5, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "Keep going. The path winds upward.",
        "Each bend brings you closer. Don't look down.",
        "I've been here a while. You're the first to make it this far.",
        "Follow the road. It leads somewhere bright."
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

    const sprite_greet_lantern = "Almost there. The road straightens ahead.";
    const sprite_data_lantern = {
      id: 'Lantern Keeper',
      greeting: sprite_greet_lantern,
      src: path + "/images/gamify/octocat.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 301, width: 801 },
      INIT_POSITION: { x: 0.45, y: 0.52 },
      orientation: { rows: 1, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.1 },
      dialogues: [
        "Almost there. The road straightens ahead.",
        "The warden is just around the bend. Don't stop now.",
        "You've walked further than most.",
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
      INIT_POSITION: { x: 0.90, y: 0.09 },
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
          "You followed the path all the way here. The gate ahead pulses with light. Are you ready to move on?",
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

    const sprite_data_coin = {
      id: 'coin',
      greeting: false,
      INIT_POSITION: { x: 0.42, y: 0.57 },
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

      // Player first so movement applies before spline barriers resolve collision.
      { class: Player, data: sprite_data_octopus },

      { class: SplineBarrier, data: seg1 },  // ← was Barrier
      { class: SplineBarrier, data: seg2 },
      { class: SplineBarrier, data: seg3 },
      { class: SplineBarrier, data: seg4 },
      { class: SplineBarrier, data: seg5 },
      { class: SplineBarrier, data: seg6 },

      { class: Coin,   data: sprite_data_coin    },

      { class: Npc,    data: sprite_data_shadow  },
      { class: Npc,    data: sprite_data_lantern },
      { class: Npc,    data: sprite_data_warden  },
    ];
  }
}

export default GameLevelMazeSub;