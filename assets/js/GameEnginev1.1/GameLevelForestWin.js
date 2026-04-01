// Forest Win Sublevel
// Save as: assets/js/GameEnginev1.1/GameLevelForestWin.js

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import DialogueSystem from './essentials/DialogueSystem.js';

class GameLevelForestWin {
  constructor(gameEnv) {
    console.log("Initializing GameLevelForestWin...");

    this.gameEnv = gameEnv;

    let height = gameEnv.innerHeight;
    let path   = gameEnv.path;

    // ── Background ────────────────────────────────────────────────────────────
    const image_data_bg = {
      name: 'village',
      greeting: "Warm light. The smell of bread. You made it.",
      src: path + "/images/gamify/village.jpg",
      pixels: { height: 580, width: 1038 }
    };

    // ── Player (Octopus) ──────────────────────────────────────────────────────
    const OCTOPUS_SCALE_FACTOR = 5;
    const sprite_data_player = {
      id: 'Octopus',
      greeting: "I can't believe I made it...",
      src: path + "/images/gamify/octopus.png",
      SCALE_FACTOR: OCTOPUS_SCALE_FACTOR,
      STEP_FACTOR: 1000,
      ANIMATION_RATE: 50,
      GRAVITY: false,
      INIT_POSITION: { x: 0.1, y: 0.75 },
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

    // ── NPC: R2D2 ─────────────────────────────────────────────────────────────
    const sprite_greet_r2d2 = "Bweeeep! You made it! I knew you would!";
    const sprite_data_r2d2 = {
      id: 'R2D2',
      greeting: sprite_greet_r2d2,
      src: path + "/images/gamify/r2_idle.png",
      SCALE_FACTOR: 7,
      ANIMATION_RATE: 80,
      pixels: { height: 223, width: 505 },
      INIT_POSITION: { x: 0.5, y: 0.45 },
      orientation: { rows: 1, columns: 3 },
      down: { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "Bweeeep! I knew you would choose correctly. I believed in you the whole time.",
        "The desert is behind you now. Ashenholm is here. You earned this.",
        "I have to say — a lot of people go left. You did not. That matters.",
        "Boop bweep! Translation: well done. Sincerely."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_r2d2);
      },
      interact: function() {
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) { this.dialogueSystem.closeDialogue(); return; }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();

        this._praiseIndex = (this._praiseIndex || 0);
        const praises = [
          "Bweep boop! You chose right. Literally and figuratively.",
          "I have to say — most people don't make it here. You should be proud.",
          "The village is yours to explore. You've earned the peace.",
          "If you ever doubted yourself back at that fork... don't. You had it.",
          "Bweeeeeep! That's just me being happy. Ignore me."
        ];
        const msg = praises[this._praiseIndex % praises.length];
        this._praiseIndex++;

        this.dialogueSystem.showDialogue(msg, "R2D2", this.spriteData.src);
        this.dialogueSystem.addButtons([
          {
            text: "See the credits",
            primary: true,
            action: () => {
              this.dialogueSystem.closeDialogue();
              _showWinScreen();
            }
          },
          { text: "Stay a little longer", action: () => this.dialogueSystem.closeDialogue() }
        ]);
      }
    };

    // ── NPC: Village Elder ────────────────────────────────────────────────────
    const sprite_greet_elder = "We don't get many travellers who make it here. Welcome.";
    const sprite_data_elder = {
      id: 'Village Elder',
      greeting: sprite_greet_elder,
      src: path + "/images/gamify/tux.png",
      SCALE_FACTOR: 8,
      ANIMATION_RATE: 50,
      pixels: { height: 256, width: 352 },
      INIT_POSITION: { x: 0.78, y: 0.55 },
      orientation: { rows: 8, columns: 11 },
      down: { row: 5, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
      dialogues: [
        "We don't get many travellers who make it here. Welcome.",
        "The fork has been there longer than the village. Most go left.",
        "You can rest here. You've earned it.",
        "The forest sent you to us. That means something.",
        "Stay as long as you need. Ashenholm does not rush its guests."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_elder);
      },
      interact: function() {
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) { this.dialogueSystem.closeDialogue(); return; }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.showRandomDialogue();
      }
    };

    // ── NPC: Villager ─────────────────────────────────────────────────────────
    const sprite_greet_villager = "Oh! A new face! It's been so long!";
    const sprite_data_villager = {
      id: 'Villager',
      greeting: sprite_greet_villager,
      src: path + "/images/gamify/octocat.png",
      SCALE_FACTOR: 10,
      ANIMATION_RATE: 50,
      pixels: { height: 301, width: 801 },
      INIT_POSITION: { x: 0.3, y: 0.6 },
      orientation: { rows: 1, columns: 4 },
      down: { row: 0, start: 0, columns: 3 },
      hitbox: { widthPercentage: 0.1, heightPercentage: 0.1 },
      dialogues: [
        "Oh! A new face! It's been so long since anyone came through the right path!",
        "You must be exhausted. The forest is no joke.",
        "We saw your light from the watchtower. We hoped you'd make it.",
        "Welcome to Ashenholm. You're safe now."
      ],
      reaction: function() {
        if (this.dialogueSystem) this.showReactionDialogue();
        else console.log(sprite_greet_villager);
      },
      interact: function() {
        if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) { this.dialogueSystem.closeDialogue(); return; }
        if (!this.dialogueSystem) this.dialogueSystem = new DialogueSystem();
        this.showRandomDialogue();
      }
    };

    // ── Win screen + credits ──────────────────────────────────────────────────
    function _showWinScreen() {
      const screen = document.createElement('div');
      Object.assign(screen.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        background: 'rgba(5,12,3,0.97)',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        zIndex: '10003', color: '#c8d0a0',
        fontFamily: 'Georgia, serif',
        overflowY: 'auto', padding: '40px 0'
      });

      screen.innerHTML = `
        <h1 style="color:#90c060;font-size:28px;letter-spacing:4px;margin-bottom:8px;text-align:center">
          ✦ YOU MADE IT OUT ALIVE ✦
        </h1>
        <p style="font-style:italic;color:#8a9870;margin-bottom:40px;font-size:14px;text-align:center">
          Ashenholm. Warm light. The journey is complete.
        </p>
        <div style="width:1px;height:40px;background:rgba(144,192,96,0.3);margin-bottom:40px"></div>
        <h2 style="color:#506030;font-size:13px;letter-spacing:6px;margin-bottom:32px;text-align:center">CREDITS</h2>
        <div style="display:flex;flex-direction:column;gap:20px;text-align:center;max-width:480px;width:100%">
          <div>
            <div style="color:#506030;font-size:10px;letter-spacing:3px;margin-bottom:4px">GAME DESIGN</div>
            <div style="color:#c0b898;font-size:14px">Your Name Here</div>
          </div>
          <div>
            <div style="color:#506030;font-size:10px;letter-spacing:3px;margin-bottom:4px">BUILT WITH</div>
            <div style="color:#c0b898;font-size:14px">GameEnginev1.1 · Night Hacks GameBuilder</div>
          </div>
          <div>
            <div style="color:#506030;font-size:10px;letter-spacing:3px;margin-bottom:4px">LEVELS</div>
            <div style="color:#c0b898;font-size:14px;line-height:1.8">
              GameLevelMaze · GameLevelDoors<br>
              GameLevelForest · GameLevelForestSub<br>
              GameLevelForestDeath · GameLevelForestWin
            </div>
          </div>
          <div>
            <div style="color:#506030;font-size:10px;letter-spacing:3px;margin-bottom:4px">CHARACTERS</div>
            <div style="color:#c0b898;font-size:14px;line-height:1.8">
              Octopus · Tux · Octocat · R2D2<br>
              Chicken Jockey · The Strange Beckoner<br>
              The Warden · The Wraith · Village Elder · Villager
            </div>
          </div>
          <div>
            <div style="color:#506030;font-size:10px;letter-spacing:3px;margin-bottom:4px">SPECIAL THANKS</div>
            <div style="color:#c0b898;font-size:14px">Everyone who went right.</div>
          </div>
        </div>
        <div style="width:1px;height:40px;background:rgba(144,192,96,0.3);margin:40px 0"></div>
      `;

      const btn = document.createElement('button');
      btn.textContent = 'The End';
      Object.assign(btn.style, {
        padding: '10px 32px', background: '#283820', color: '#c0b898',
        border: '1px solid #506030', borderRadius: '4px', cursor: 'pointer',
        fontFamily: 'Georgia, serif', fontSize: '15px',
        letterSpacing: '2px', marginBottom: '40px'
      });
      btn.onclick = () => document.body.removeChild(screen);
      screen.appendChild(btn);
      document.body.appendChild(screen);
    }

    // ── Level class list ──────────────────────────────────────────────────────
    this.classes = [
      { class: GameEnvBackground, data: image_data_bg       },
      { class: Player,            data: sprite_data_player   },
      { class: Npc,               data: sprite_data_r2d2     },
      { class: Npc,               data: sprite_data_elder    },
      { class: Npc,               data: sprite_data_villager },
    ];
  }
}

export default GameLevelForestWin;