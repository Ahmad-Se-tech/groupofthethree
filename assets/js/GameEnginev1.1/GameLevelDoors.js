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

    // Helper to create a dead-end door interact function
    function makeWrongDoorInteract() {
        return function() {
            if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
                this.dialogueSystem.closeDialogue();
            }
            if (!this.dialogueSystem) {
                this.dialogueSystem = new DialogueSystem();
            }
            this.dialogueSystem.showDialogue(
                "This door leads nowhere... maybe try a different one?",
                "Dead End!",
                this.spriteData.src
            );
            this.dialogueSystem.addButtons([
                {
                    text: "Go back",
                    action: () => {
                        this.dialogueSystem.closeDialogue();
                    }
                }
            ]);
        };
    }

    // Background data
    const image_src_water = path + "/images/gamify/cave.png";
    const image_data_water = {
        id: 'Water',
        src: image_src_water,
        pixels: {height: 597, width: 340}
    };

    // Player Data for Octopus
    const sprite_src_octopus = path + "/images/gamify/octopus.png";
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
        downLeft: {row: 0, start: 0, columns: 2, mirror: true, rotate: Math.PI/16 },
        downRight: {row: 0, start: 0, columns: 2, rotate: -Math.PI/16 },
        left: {row: 1, start: 0, columns: 2, mirror: true },
        right: {row: 1, start: 0, columns: 2 },
        up: {row: 0, start: 0, columns: 2},
        upLeft: {row: 1, start: 0, columns: 2, mirror: true, rotate: -Math.Pi/16 },
        upRight: {row: 1, start: 0, columns: 2, rotate: Math.PI/16 },
        hitbox: { widthPercentage: 0.45, heightPercentage: 0.2 },
        keypress: { up: 87, left: 65, down: 83, right: 68 }
    };

    // ── Blue Door (correct door — advances to next level) ───────────────────
    const sprite_src_bluedoor = path + "/images/gamify/bluedoor.png";
    const sprite_greet_bluedoor = "Hi I am Blue Door, the Linux mascot. I am very happy to spend some linux shell time with you!";
    const sprite_data_bluedoor = {
       id: 'Blue Door',
       greeting: sprite_greet_bluedoor,
       src: sprite_src_bluedoor,
       SCALE_FACTOR: 8,
       ANIMATION_RATE: 50,
       pixels: {height: 414, width: 252},
       INIT_POSITION: { x: 0.5, y: 0.5 },  // Center
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
           if (this.dialogueSystem) {
               this.showReactionDialogue();
           } else {
               console.log(sprite_greet_bluedoor);
           }
       },
       interact: function() {
           if (this.dialogueSystem && this.dialogueSystem.isDialogueOpen()) {
               this.dialogueSystem.closeDialogue();
           }
           if (!this.dialogueSystem) {
               this.dialogueSystem = new DialogueSystem();
           }
           this.dialogueSystem.showDialogue(
               "A glowing blue door stands before you. Do you wish to enter?",
               "Enter the Blue Door?",
               this.spriteData.src
           );
           this.dialogueSystem.addButtons([
               {
                   text: "Enter",
                   primary: true,
                   action: () => {
                       this.dialogueSystem.showDialogue(
                           "You step through the blue door and find yourself in a new world filled with wonders and challenges. Get ready for the next adventure!",
                           "Welcome to the Next Level! Press Escape to continue",
                       );
                   }
               },
               {
                   text: "Not yet",
                   action: () => {
                       this.dialogueSystem.closeDialogue();
                   }
               }
           ]);
       }
   };

    // ── Brown Door (wrong door) ─────────────────────────────────────────────
    const sprite_src_browndoor = path + "/images/gamify/browndoor.png";
    const sprite_greet_browndoor = "Hi I am Brown Door, the Linux mascot. I am very happy to spend some linux shell time with you!";
    const sprite_data_browndoor = {
       id: 'Brown Door',
       greeting: sprite_greet_browndoor,
       src: sprite_src_browndoor,
       SCALE_FACTOR: 8,
       ANIMATION_RATE: 50,
       pixels: {height: 414, width: 252},
       INIT_POSITION: { x: 0.2, y: 0.5 },
       orientation: {rows: 1, columns: 1 },
       down: {row: 0, start: 0, columns: 1 },
       hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
       dialogues: [
           "This is a door. Do you want to go through it?",
       ],
       reaction: function() {
           if (this.dialogueSystem) {
               this.showReactionDialogue();
           } else {
               console.log(sprite_greet_browndoor);
           }
       },
       interact: makeWrongDoorInteract()
   };

    // ── Green Door (wrong door) ─────────────────────────────────────────────
    const sprite_src_greendoor = path + "/images/gamify/greendoor.png";
    const sprite_greet_greendoor = "A mossy green door covered in vines...";
    const sprite_data_greendoor = {
       id: 'Green Door',
       greeting: sprite_greet_greendoor,
       src: sprite_src_greendoor,
       SCALE_FACTOR: 8,
       ANIMATION_RATE: 50,
       pixels: {height: 414, width: 252},
       INIT_POSITION: { x: 0.35, y: 0.5 },
       orientation: {rows: 1, columns: 1 },
       down: {row: 0, start: 0, columns: 1 },
       hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
       dialogues: [
           "This door smells of earth and roots...",
       ],
       reaction: function() {
           if (this.dialogueSystem) {
               this.showReactionDialogue();
           } else {
               console.log(sprite_greet_greendoor);
           }
       },
       interact: makeWrongDoorInteract()
   };

    // ── Orange Door (wrong door) ────────────────────────────────────────────
    const sprite_src_orangedoor = path + "/images/gamify/orangedoor.png";
    const sprite_greet_orangedoor = "A blazing orange door radiates heat...";
    const sprite_data_orangedoor = {
       id: 'Orange Door',
       greeting: sprite_greet_orangedoor,
       src: sprite_src_orangedoor,
       SCALE_FACTOR: 8,
       ANIMATION_RATE: 50,
       pixels: {height: 414, width: 252},
       INIT_POSITION: { x: 0.65, y: 0.5 },
       orientation: {rows: 1, columns: 1 },
       down: {row: 0, start: 0, columns: 1 },
       hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
       dialogues: [
           "This door feels warm to the touch...",
       ],
       reaction: function() {
           if (this.dialogueSystem) {
               this.showReactionDialogue();
           } else {
               console.log(sprite_greet_orangedoor);
           }
       },
       interact: makeWrongDoorInteract()
   };

    // ── Red Door (wrong door) ───────────────────────────────────────────────
    const sprite_src_reddoor = path + "/images/gamify/reddoor.png";
    const sprite_greet_reddoor = "An ominous red door pulses with a dark energy...";
    const sprite_data_reddoor = {
       id: 'Red Door',
       greeting: sprite_greet_reddoor,
       src: sprite_src_reddoor,
       SCALE_FACTOR: 8,
       ANIMATION_RATE: 50,
       pixels: {height: 414, width: 252},
       INIT_POSITION: { x: 0.8, y: 0.5 },
       orientation: {rows: 1, columns: 1 },
       down: {row: 0, start: 0, columns: 1 },
       hitbox: { widthPercentage: 0.1, heightPercentage: 0.2 },
       dialogues: [
           "Something dark lurks behind this door...",
       ],
       reaction: function() {
           if (this.dialogueSystem) {
               this.showReactionDialogue();
           } else {
               console.log(sprite_greet_reddoor);
           }
       },
       interact: makeWrongDoorInteract()
   };

    this.classes = [      
      { class: GameEnvBackground, data: image_data_water },
      { class: Player, data: sprite_data_octopus },
      { class: Npc, data: sprite_data_bluedoor },
      { class: Npc, data: sprite_data_browndoor },
      { class: Npc, data: sprite_data_greendoor },
      { class: Npc, data: sprite_data_orangedoor },
      { class: Npc, data: sprite_data_reddoor }
    ];
  }
}

export default GameLevelDoors;