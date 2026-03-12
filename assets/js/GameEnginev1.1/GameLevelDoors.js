import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';

class GameLevelDoors {
  constructor(gameEnv) {
    console.log("Initializing GameLevelDoors...");
    
    // Store the game environment reference
    this.gameEnv = gameEnv;

    let width = gameEnv.innerWidth;
    let height = gameEnv.innerHeight;
    let path = gameEnv.path;

    // Background data
    const image_src_water = path + "/images/gamify/cave.png";
    const image_data_water = {
        id: 'Water',
        src: image_src_water,
        pixels: {height: 597, width: 340}
    };

    // Player Data for Octopus
    const sprite_src_octopus = path + "/images/gamify/octopus.png"; // be sure to include the path
    const OCTOPUS_SCALE_FACTOR = 5;
    const sprite_data_octopus = {
        id: 'Octopus',
        greeting: "Hi I am Octopus, the water wanderer. I am looking for wisdome and adventure!",
        src: sprite_src_octopus,
        SCALE_FACTOR: OCTOPUS_SCALE_FACTOR,
        STEP_FACTOR: 1000,
        ANIMATION_RATE: 50,
        GRAVITY: false,
        INIT_POSITION: { x: 0, y: height - (height/OCTOPUS_SCALE_FACTOR) }, 
        pixels: {height: 250, width: 167},
        orientation: {rows: 3, columns: 2 },
        down: {row: 0, start: 0, columns: 2 },
        downLeft: {row: 0, start: 0, columns: 2, mirror: true, rotate: Math.PI/16 }, // mirror is used to flip the sprite
        downRight: {row: 0, start: 0, columns: 2, rotate: -Math.PI/16 },
        left: {row: 1, start: 0, columns: 2, mirror: true }, // mirror is used to flip the sprite
        right: {row: 1, start: 0, columns: 2 },
        up: {row: 0, start: 0, columns: 2},
        upLeft: {row: 1, start: 0, columns: 2, mirror: true, rotate: -Math.Pi/16 }, // mirror is used to flip the sprite
        upRight: {row: 1, start: 0, columns: 2, rotate: Math.PI/16 },
        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
        keypress: { up: 87, left: 65, down: 83, right: 68 } // W, A, S, D
    };
    
    
    // NPC data for Tux
    const sprite_src_bluedoor = path + "/images/gamify/bluedoor.png";
    const sprite_greet_bluedoor = "Hi I am Blue Door, the Linux mascot. I am very happy to spend some linux shell time with you!";
    const sprite_data_bluedoor = {
       id: 'Blue Door',
       greeting: sprite_greet_bluedoor,
       src: sprite_src_bluedoor,
       SCALE_FACTOR: 8,
       ANIMATION_RATE: 50,
       pixels: {height: 414, width: 252},
       INIT_POSITION: { x: 0.5, y: 0.5 },  // Center of screen
       orientation: {rows: 1, columns: 1 },
       down: {row: 0, start: 0, columns: 1 },
       hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
       dialogues: [
           "This is a door. Do you want to go through it?",
           "Behind this door lies a world of adventure and mystery.",
           "Only the brave can pass through this door. Are you ready?",
           "The door is old and creaky. It seems to have many stories to tell.",
           "If you go through this door, you might find something amazing!"
       ],
       reaction: function() {
           // Use dialogue system instead of alert
           if (this.dialogueSystem) {
               this.showReactionDialogue();
           } else {
               console.log(sprite_greet_bluedoor);
           }
       },
       interact: function() {
           // Show random dialogue message
           if (this.dialogueSystem) {
               this.showRandomDialogue();
           }
       }
   };

    this.classes = [      
      { class: GameEnvBackground, data: image_data_water },
      { class: Player, data: sprite_data_octopus },
      { class: Npc, data: sprite_data_bluedoor }
    ];
  }
}

export default GameLevelDoors;