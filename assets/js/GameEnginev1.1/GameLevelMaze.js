const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const TILE = 40;
const COLS = W / TILE; // 20
const ROWS = H / TILE; // 15

// ─── WOOD FLOOR TEXTURE ─────────────────────────────────────────────────────
function createWoodTexture() {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = W; offCanvas.height = H;
  const oc = offCanvas.getContext('2d');
  // base warm wood tone
  oc.fillStyle = '#d9cbb8';
  oc.fillRect(0,0,W,H);
  // draw planks (horizontal)
  const plankH = 42;
  for(let y=0; y<H; y+=plankH) {
    // plank base
    const shade = 200 + Math.random()*30;
    const r = shade, g = shade*0.88, b = shade*0.72;
    oc.fillStyle = `rgb(${r|0},${g|0},${b|0})`;
    oc.fillRect(0, y, W, plankH-2);
    // grain lines
    for(let i=0;i<18;i++){
      const gx = Math.random()*W;
      const gy = y + Math.random()*plankH;
      const gl = 20+Math.random()*120;
      const gw = 0.3+Math.random()*1.2;
      oc.beginPath();
      oc.moveTo(gx,gy);
      oc.bezierCurveTo(gx+gl*0.3, gy+Math.random()*4-2, gx+gl*0.7, gy+Math.random()*4-2, gx+gl, gy+Math.random()*3-1.5);
      oc.strokeStyle = `rgba(${(r*0.75)|0},${(g*0.7)|0},${(b*0.6)|0},${0.15+Math.random()*0.3})`;
      oc.lineWidth = gw;
      oc.stroke();
    }
    // knot occasionally
    if(Math.random()<0.15){
      const kx = Math.random()*W, ky = y+plankH/2;
      const kg = oc.createRadialGradient(kx,ky,1,kx,ky,8);
      kg.addColorStop(0,`rgba(${(r*0.6)|0},${(g*0.55)|0},${(b*0.5)|0},0.6)`);
      kg.addColorStop(1,'transparent');
      oc.fillStyle = kg;
      oc.beginPath();
      oc.ellipse(kx,ky,8,5,Math.random()*Math.PI,0,Math.PI*2);
      oc.fill();
    }
    // plank separator
    oc.fillStyle = 'rgba(60,35,10,0.35)';
    oc.fillRect(0, y+plankH-2, W, 2);
  }
  return offCanvas;
}

// ─── MAZE DEFINITION ────────────────────────────────────────────────────────
// 0=floor, 1=wall
// 20 cols x 15 rows
const mazeGrid = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1],
  [1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,0,1],
  [1,0,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0,0,1],
  [1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,1,1,1],
  [1,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,1,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1],
  [1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1,1],
  [1,1,0,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,0,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── NPCS ───────────────────────────────────────────────────────────────────
const npcs = [
  {
    id: 'Whispering Shadow',
    tx: 3, ty: 3,
    color: '#7ec8e3', halo: '#4a9ab5',
    dialogues: [
      "...go north. Or was it south? I forget...",
      "The walls shift when you're not looking. Trust nothing."
    ],
    isFinal: false
  },
  {
    id: 'Hollow Guide',
    tx: 17, ty: 1,
    color: '#a3e8a0', halo: '#4ab54a',
    dialogues: [
      "I sent the last wanderer east. She never returned.",
      "Follow the red glow... but don't let it follow you back."
    ],
    isFinal: false
  },
  {
    id: 'Lantern Keeper',
    tx: 1, ty: 9,
    color: '#f5c842', halo: '#c8a020',
    dialogues: [
      "The shadow that hunts you knows where you're going.",
      "South corridor. Bottom row. That is all I'll say."
    ],
    isFinal: false
  },
  {
    id: 'The Ghost',
    tx: 13, ty: 11,
    color: '#e0b0ff', halo: '#9060cc',
    dialogues: [
      "I've been circling this maze for a hundred years. The exit... it's east. Far east.",
      "Beware the red eyes. They don't sleep."
    ],
    isFinal: false
  },
  {
    id: 'Exit Warden',
    tx: 17, ty: 13,
    color: '#ff9966', halo: '#ff5522',
    dialogues: [
      "You survived. The gate is one step to your right. Go. NOW.",
      "Quickly — it's coming. Step through. ✦"
    ],
    isFinal: true
  }
];

// ─── NPC TALKED TRACKING ────────────────────────────────────────────────────
const talkedTo = new Set();
let allSpiritsFreed = false;
let doorAnimating = false;
let doorAnimStart = 0;
const DOOR_ANIM_DURATION = 3200; // ms

function updateObjectiveHUD() {
  const total = npcs.length;
  const done = talkedTo.size;
  document.getElementById('spiritCount').textContent = done + ' / ' + total;
  const pips = document.getElementById('spiritPips');
  pips.innerHTML = '';
  for(let i=0;i<total;i++){
    const pip = document.createElement('span');
    pip.className = 'spirit-pip' + (i < done ? ' done' : '');
    pips.appendChild(pip);
  }
}
updateObjectiveHUD();

function checkAllSpirits() {
  if(talkedTo.size >= npcs.length && !allSpiritsFreed) {
    allSpiritsFreed = true;
    doorAnimating = true;
    doorAnimStart = Date.now();
  }
}

// ─── DOOR UNLOCK ANIMATION ───────────────────────────────────────────────────
// Plays at the PLAYER's current position (obscures exact door location)
function drawDoorAnimation() {
  if(!doorAnimating) return;
  const elapsed = Date.now() - doorAnimStart;
  const progress = Math.min(elapsed / DOOR_ANIM_DURATION, 1);
  const px = player.x, py = player.y;

  // Phase 1 (0-0.4): blinding white flash from player center
  if(progress < 0.45) {
    const p = progress / 0.45;
    const eased = p < 0.5 ? 2*p*p : -1+(4-2*p)*p;
    const flashA = Math.sin(eased * Math.PI) * 0.85;
    ctx.save();
    const flash = ctx.createRadialGradient(px,py,0,px,py,W*0.7);
    flash.addColorStop(0, `rgba(255,240,180,${flashA})`);
    flash.addColorStop(0.3, `rgba(255,180,60,${flashA*0.6})`);
    flash.addColorStop(1, 'transparent');
    ctx.fillStyle = flash;
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }

  // Phase 2 (0.3-0.7): gold rune rings expanding outward from player
  if(progress >= 0.28 && progress < 0.82) {
    const p = (progress - 0.28) / 0.54;
    ctx.save();
    for(let ring=0; ring<4; ring++) {
      const rp = Math.max(0, Math.min(1, p - ring*0.18));
      if(rp <= 0) continue;
      const r = rp * W * 0.65;
      const alpha = (1 - rp) * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,210,80,${alpha})`;
      ctx.lineWidth = 3 - ring*0.5;
      ctx.stroke();
      // rune dashes on ring
      for(let d=0;d<12;d++){
        const angle = (d/12)*Math.PI*2 + rp*2;
        const rx1 = px + Math.cos(angle)*(r-4);
        const ry1 = py + Math.sin(angle)*(r-4);
        const rx2 = px + Math.cos(angle+0.18)*(r+4);
        const ry2 = py + Math.sin(angle+0.18)*(r+4);
        ctx.beginPath(); ctx.moveTo(rx1,ry1); ctx.lineTo(rx2,ry2);
        ctx.strokeStyle = `rgba(255,240,140,${alpha*0.8})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Phase 3 (0.6-1.0): spiral of golden particles rising from player
  if(progress >= 0.55) {
    const p = (progress - 0.55) / 0.45;
    ctx.save();
    const particleCount = 28;
    for(let i=0;i<particleCount;i++){
      const angle = (i/particleCount)*Math.PI*2 + p*Math.PI*3;
      const dist = 20 + p * 90 + Math.sin(i*1.3)*15;
      const rise = p * 60;
      const px2 = px + Math.cos(angle)*dist;
      const py2 = py + Math.sin(angle)*dist - rise;
      const size = (1-p)*4 + 1;
      const alpha = (1-p) * 0.9;
      ctx.beginPath();
      ctx.arc(px2, py2, size, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,${180+i*2},40,${alpha})`;
      ctx.fill();
    }
    ctx.restore();
  }

  // End of animation
  if(progress >= 1) {
    doorAnimating = false;
  }
}

// Exit tile position
const EXIT = { tx: 18, ty: 13 };

// ─── TIMER ──────────────────────────────────────────────────────────────────
let timeLeft = 120; // seconds
let timerInterval = null;
let gameOver = false;

function startTimer() {
  timerInterval = setInterval(() => {
    if(gameOver) return;
    timeLeft--;
    if(timeLeft <= 0) {
      timeLeft = 0;
      triggerDeath('Time ran out... the darkness consumed you.');
    }
  }, 1000);
}
startTimer();

function triggerDeath(msg) {
  if(gameOver) return;
  gameOver = true;
  clearInterval(timerInterval);
  const ws = document.getElementById('winScreen');
  ws.querySelector('h2').textContent = '✦ YOU PERISHED ✦';
  ws.querySelector('p').textContent = msg;
  ws.style.display = 'block';
}

// ─── ENEMY ──────────────────────────────────────────────────────────────────
// Patrols a fixed path of tile waypoints
const enemy = {
  tx: 10, ty: 7,
  x: 10*TILE+TILE/2, y: 7*TILE+TILE/2,
  waypoints: [
    {tx:10,ty:7},{tx:10,ty:5},{tx:7,ty:5},{tx:7,ty:7},{tx:9,ty:7},
    {tx:9,ty:9},{tx:11,ty:9},{tx:11,ty:7},{tx:10,ty:7}
  ],
  wpIdx: 0,
  speed: 1.8,         // pixels per frame
  moveTimer: 0,
  MOVE_DELAY: 320,    // ms per tile step
};

function updateEnemy(dt) {
  if(gameOver) return;
  enemy.moveTimer -= dt;
  if(enemy.moveTimer > 0) return;
  enemy.moveTimer = enemy.MOVE_DELAY;
  const next = enemy.waypoints[(enemy.wpIdx+1) % enemy.waypoints.length];
  enemy.tx = next.tx; enemy.ty = next.ty;
  enemy.x = next.tx*TILE+TILE/2; enemy.y = next.ty*TILE+TILE/2;
  enemy.wpIdx = (enemy.wpIdx+1) % enemy.waypoints.length;
  // check catch
  if(enemy.tx === player.tx && enemy.ty === player.ty) {
    triggerDeath('The shadow caught you.\nYou dissolve into the dark.');
  }
}

function drawEnemy() {
  const t = Date.now()/300;
  const x = enemy.x, y = enemy.y;
  const s = 10;
  ctx.save();
  ctx.translate(x, y);
  // red aura
  const aura = ctx.createRadialGradient(0,0,2,0,0,TILE*1.3);
  aura.addColorStop(0,'rgba(180,0,0,0.35)');
  aura.addColorStop(1,'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(0,0,TILE*1.3,0,Math.PI*2); ctx.fill();
  // body — jagged shadow monster
  ctx.fillStyle = '#0a0005';
  ctx.beginPath();
  for(let i=0;i<8;i++){
    const angle = (i/8)*Math.PI*2 + t*0.5;
    const r = s*(0.9+0.35*Math.sin(i*3+t*2));
    i===0 ? ctx.moveTo(Math.cos(angle)*r, Math.sin(angle)*r)
           : ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r);
  }
  ctx.closePath();
  ctx.fill();
  // red eyes
  ctx.fillStyle = '#ff2020';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(-s*0.28,-s*0.2,s*0.18,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*0.28,-s*0.2,s*0.18,0,Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── PLAYER ─────────────────────────────────────────────────────────────────
const player = {
  tx: 1, ty: 1,        // tile position
  x: 1*TILE + TILE/2,  // pixel center
  y: 1*TILE + TILE/2,
  px: 1*TILE + TILE/2,
  py: 1*TILE + TILE/2,
  speed: 3,
  moving: false,
  targetX: 1*TILE + TILE/2,
  targetY: 1*TILE + TILE/2,
  dir: 'down',
  animFrame: 0,
  animTimer: 0,
  ANIM_RATE: 180,
  trail: []
};

// ─── INPUT ──────────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if(e.code === 'KeyE') handleInteract();
  e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ─── DIALOGUE ───────────────────────────────────────────────────────────────
let dialogueOpen = false;
let activeNpc = null;

function showDialogue(npc) {
  dialogueOpen = true;
  activeNpc = npc;
  const dlg = document.getElementById('dialogue');
  document.getElementById('dlgName').textContent = npc.id;
  const text = npc.dialogues[Math.floor(Math.random()*npc.dialogues.length)];
  document.getElementById('dlgText').textContent = text;
  dlg.style.display = 'block';
  // Track this spirit as spoken to
  if(!talkedTo.has(npc.id)) {
    talkedTo.add(npc.id);
    updateObjectiveHUD();
    checkAllSpirits();
  }
}

function closeDialogue() {
  dialogueOpen = false;
  activeNpc = null;
  document.getElementById('dialogue').style.display = 'none';
}

function handleInteract() {
  if(dialogueOpen) { closeDialogue(); return; }
  // find nearby npc
  for(const npc of npcs) {
    const dx = Math.abs(npc.tx - player.tx);
    const dy = Math.abs(npc.ty - player.ty);
    if(dx<=1 && dy<=1) {
      showDialogue(npc);
      return;
    }
  }
}

// ─── MOVEMENT ───────────────────────────────────────────────────────────────
let moveDelay = 0;
const MOVE_DELAY = 150; // ms between tile moves

function tryMove(dx, dy, dt) {
  moveDelay -= dt;
  if(moveDelay > 0) return;
  const nx = player.tx + dx;
  const ny = player.ty + dy;
  if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return;
  if(mazeGrid[ny][nx] === 1) return;
  // add to trail
  player.trail.push({x: player.x, y: player.y, age: 0});
  if(player.trail.length > 12) player.trail.shift();
  player.tx = nx;
  player.ty = ny;
  player.x = nx*TILE + TILE/2;
  player.y = ny*TILE + TILE/2;
  moveDelay = MOVE_DELAY;
  // dir
  if(dx===1) player.dir='right';
  else if(dx===-1) player.dir='left';
  else if(dy===-1) player.dir='up';
  else player.dir='down';
  // check exit — only works after all spirits spoken to
  if(nx === EXIT.tx && ny === EXIT.ty && allSpiritsFreed && !doorAnimating) {
    gameOver = true;
    clearInterval(timerInterval);
    document.getElementById('winScreen').style.display = 'block';
  }
}

// ─── DRAW PLAYER SPRITE ─────────────────────────────────────────────────────
function drawPlayer(cx, cy) {
  const t = Date.now()/400;
  const bob = Math.sin(t*3)*1.5;
  const x = cx, y = cy + bob;
  const s = 10; // scale unit

  // glow
  const grd = ctx.createRadialGradient(x, y, 2, x, y, TILE*0.8);
  grd.addColorStop(0,'rgba(255,200,100,0.18)');
  grd.addColorStop(1,'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(x,y,TILE*0.8,0,Math.PI*2); ctx.fill();

  // cloak / body
  ctx.save();
  ctx.translate(x, y);
  // shadow under
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, s*1.5, s*1.2, s*0.4, 0, 0, Math.PI*2); ctx.fill();
  // cloak
  ctx.beginPath();
  ctx.moveTo(-s*1.1, -s*0.5);
  ctx.bezierCurveTo(-s*1.4, s*0.8, -s*1.1, s*1.8, -s*0.3, s*1.7);
  ctx.lineTo(0, s*1.9);
  ctx.lineTo(s*0.3, s*1.7);
  ctx.bezierCurveTo(s*1.1, s*1.8, s*1.4, s*0.8, s*1.1, -s*0.5);
  ctx.closePath();
  ctx.fillStyle = '#1a1008';
  ctx.fill();
  ctx.strokeStyle = '#c8a96e';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  // hood
  ctx.beginPath();
  ctx.arc(0, -s*0.7, s*0.95, 0, Math.PI*2);
  ctx.fillStyle = '#241508';
  ctx.fill();
  ctx.strokeStyle = '#c8a96e';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // face glow (lantern glow on face)
  ctx.beginPath();
  ctx.arc(0, -s*0.7, s*0.6, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,180,60,0.08)';
  ctx.fill();
  // eyes
  const eyeGlow = ctx.createRadialGradient(-s*0.28,-s*0.75,0,-s*0.28,-s*0.75,s*0.18);
  eyeGlow.addColorStop(0,'rgba(255,220,80,0.95)');
  eyeGlow.addColorStop(1,'rgba(255,160,20,0)');
  ctx.fillStyle = eyeGlow;
  ctx.beginPath(); ctx.arc(-s*0.28,-s*0.75,s*0.14,0,Math.PI*2); ctx.fill();
  const eyeGlow2 = ctx.createRadialGradient(s*0.28,-s*0.75,0,s*0.28,-s*0.75,s*0.18);
  eyeGlow2.addColorStop(0,'rgba(255,220,80,0.95)');
  eyeGlow2.addColorStop(1,'rgba(255,160,20,0)');
  ctx.fillStyle = eyeGlow2;
  ctx.beginPath(); ctx.arc(s*0.28,-s*0.75,s*0.14,0,Math.PI*2); ctx.fill();
  // lantern (held in front)
  const lx = player.dir==='left' ? -s*1.2 : s*1.2;
  ctx.strokeStyle = '#c8a96e';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, -s*0.3); ctx.lineTo(lx, s*0.4); ctx.stroke();
  // lantern body
  ctx.fillStyle = '#c8a96e';
  ctx.beginPath(); ctx.rect(lx-s*0.35, s*0.25, s*0.7, s*0.8); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,80,0.85)';
  ctx.beginPath(); ctx.rect(lx-s*0.22, s*0.35, s*0.44, s*0.55); ctx.fill();
  // lantern glow
  const lg = ctx.createRadialGradient(lx, s*0.6, 1, lx, s*0.6, TILE*1.1);
  lg.addColorStop(0,'rgba(255,200,60,0.25)');
  lg.addColorStop(1,'transparent');
  ctx.fillStyle = lg;
  ctx.beginPath(); ctx.arc(lx, s*0.6, TILE*1.1, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── DRAW NPC SPRITE ────────────────────────────────────────────────────────
function drawNpc(npc, cx, cy) {
  const t = Date.now()/600;
  const float = Math.sin(t*2 + npc.tx) * 3;
  const x = cx, y = cy + float;
  const s = 9;
  ctx.save();
  ctx.translate(x, y);
  // glow aura
  const aura = ctx.createRadialGradient(0,0,2,0,0,TILE*1.1);
  aura.addColorStop(0, npc.halo+'55');
  aura.addColorStop(1,'transparent');
  ctx.fillStyle = aura;
  ctx.beginPath(); ctx.arc(0,0,TILE*1.1,0,Math.PI*2); ctx.fill();
  // ghostly form
  ctx.globalAlpha = 0.82 + Math.sin(t*3)*0.08;
  ctx.fillStyle = npc.color;
  // body
  ctx.beginPath();
  ctx.arc(0,-s*0.6,s*0.9,Math.PI,0);
  ctx.lineTo(s*0.9, s*1.0);
  // wavy bottom
  for(let i=3;i>=0;i--) {
    ctx.bezierCurveTo(
      s*(0.9-i*0.45)+s*0.15, s*1.0+s*0.5*(i%2===0?1:-1),
      s*(0.9-i*0.45)-s*0.15, s*1.0+s*0.5*(i%2===0?-1:1),
      s*(0.9-(i+1)*0.45), s*1.0
    );
  }
  ctx.closePath();
  ctx.fill();
  // eyes
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath(); ctx.ellipse(-s*0.3,-s*0.7,s*0.18,s*0.22,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s*0.3,-s*0.7,s*0.18,s*0.22,0,0,Math.PI*2); ctx.fill();
  // eye shine
  ctx.fillStyle = npc.color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.arc(-s*0.3,-s*0.7,s*0.08,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(s*0.3,-s*0.7,s*0.08,0,Math.PI*2); ctx.fill();
  // "E" prompt if nearby
  const pdx = Math.abs(npc.tx - player.tx);
  const pdy = Math.abs(npc.ty - player.ty);
  if(pdx<=1 && pdy<=1 && !dialogueOpen) {
    ctx.globalAlpha = 0.9 + Math.sin(Date.now()/200)*0.1;
    ctx.fillStyle = '#fffbe0';
    ctx.font = 'bold 11px Georgia';
    ctx.textAlign = 'center';
    ctx.fillText('[E]', 0, -s*2.2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── DRAW WALL ───────────────────────────────────────────────────────────────
function drawWall(wx, wy) {
  const x = wx*TILE, y = wy*TILE;
  // stone block
  ctx.fillStyle = '#1a1210';
  ctx.fillRect(x,y,TILE,TILE);
  // face
  ctx.fillStyle = '#252018';
  ctx.fillRect(x+1,y+1,TILE-2,TILE-2);
  // mortar lines
  ctx.strokeStyle = '#100c08';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x,y+TILE/2); ctx.lineTo(x+TILE,y+TILE/2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x+TILE/2,y); ctx.lineTo(x+TILE/2,y+TILE); ctx.stroke();
  // edge highlight
  ctx.strokeStyle = 'rgba(80,60,30,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);
}

// ─── DRAW EXIT ───────────────────────────────────────────────────────────────
function drawExit(cx, cy) {
  const t = Date.now()/500;
  const pulse = 0.7 + Math.sin(t*2)*0.3;
  const grd = ctx.createRadialGradient(cx,cy,2,cx,cy,TILE*1.5);
  grd.addColorStop(0,`rgba(255,120,20,${pulse*0.6})`);
  grd.addColorStop(0.5,`rgba(255,60,0,${pulse*0.2})`);
  grd.addColorStop(1,'transparent');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(cx,cy,TILE*1.5,0,Math.PI*2); ctx.fill();
  // door frame
  ctx.fillStyle = '#3a1800';
  ctx.fillRect(cx-TILE*0.4, cy-TILE*0.55, TILE*0.8, TILE*1.1);
  ctx.fillStyle = '#ff6020';
  ctx.globalAlpha = pulse;
  ctx.fillRect(cx-TILE*0.32, cy-TILE*0.47, TILE*0.64, TILE*0.94);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fffbe0';
  ctx.font = 'bold 9px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', cx, cy+TILE*0.75);
}

// ─── FOG OF WAR ─────────────────────────────────────────────────────────────
function drawFog() {
  const px = player.x, py = player.y;
  const radius = TILE * 2.1;

  // Use an offscreen canvas so we can punch a transparent hole via compositing
  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = W; fogCanvas.height = H;
  const fc = fogCanvas.getContext('2d');

  // Fill entirely black
  fc.fillStyle = 'rgba(0,0,0,1)';
  fc.fillRect(0, 0, W, H);

  // Punch out the light circle — center fully transparent, fades to black at edges
  fc.globalCompositeOperation = 'destination-out';
  const hole = fc.createRadialGradient(px, py, 0, px, py, radius);
  hole.addColorStop(0,   'rgba(0,0,0,1)');    // fully revealed at center
  hole.addColorStop(0.55,'rgba(0,0,0,0.95)'); // still very clear nearby
  hole.addColorStop(0.78,'rgba(0,0,0,0.6)');  // soft edge start
  hole.addColorStop(0.92,'rgba(0,0,0,0.15)'); // feathered
  hole.addColorStop(1,   'rgba(0,0,0,0)');    // full black resumes
  fc.fillStyle = hole;
  fc.beginPath(); fc.arc(px, py, radius, 0, Math.PI*2); fc.fill();
  fc.globalCompositeOperation = 'source-over';

  // Blit fog onto main canvas
  ctx.drawImage(fogCanvas, 0, 0);

  // Warm lantern glow tint on top (additive feel)
  ctx.save();
  const warm = ctx.createRadialGradient(px, py, 0, px, py, radius * 0.65);
  warm.addColorStop(0,   'rgba(255,170,40,0.13)');
  warm.addColorStop(0.45,'rgba(255,110,10,0.06)');
  warm.addColorStop(1,   'transparent');
  ctx.fillStyle = warm;
  ctx.beginPath(); ctx.arc(px, py, radius * 0.65, 0, Math.PI*2); ctx.fill();
  ctx.restore();
}

// ─── WOOD FLOOR ──────────────────────────────────────────────────────────────
const woodCanvas = createWoodTexture();

// ─── MAIN RENDER ─────────────────────────────────────────────────────────────
let lastTime = 0;

function render(ts) {
  const dt = ts - lastTime;
  lastTime = ts;

  // Input
  if(!dialogueOpen && !gameOver) {
    if(keys['KeyW']||keys['ArrowUp'])    tryMove(0,-1,dt);
    if(keys['KeyS']||keys['ArrowDown'])  tryMove(0, 1,dt);
    if(keys['KeyA']||keys['ArrowLeft'])  tryMove(-1,0,dt);
    if(keys['KeyD']||keys['ArrowRight']) tryMove( 1,0,dt);
  }

  // Update enemy
  updateEnemy(dt);

  // Draw floor
  ctx.drawImage(woodCanvas, 0, 0);

  // Draw exit only after all spirits spoken to
  const ex = EXIT.tx*TILE+TILE/2, ey = EXIT.ty*TILE+TILE/2;
  if(allSpiritsFreed) drawExit(ex, ey);

  // Draw walls
  for(let row=0;row<ROWS;row++) {
    for(let col=0;col<COLS;col++) {
      if(mazeGrid[row][col]===1) drawWall(col,row);
    }
  }

  // Draw NPCs — final spirit only visible after all others spoken to
  for(const npc of npcs) {
    if(npc.isFinal && talkedTo.size < npcs.length - 1) continue;
    drawNpc(npc, npc.tx*TILE+TILE/2, npc.ty*TILE+TILE/2);
  }

  // Draw enemy
  drawEnemy();

  // Draw player trail
  for(let i=0;i<player.trail.length;i++) {
    const t2 = player.trail[i];
    const alpha = (i/player.trail.length)*0.18;
    ctx.beginPath();
    ctx.arc(t2.x, t2.y, 4, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,180,50,${alpha})`;
    ctx.fill();
  }

  // Draw player
  drawPlayer(player.x, player.y);

  // Fog of war (drawn last, covers everything)
  drawFog();

  // Door unlock animation (on top of fog so it's visible)
  drawDoorAnimation();

  // Timer HUD
  ctx.save();
  const timerColor = timeLeft <= 20 ? '#ff4040' : timeLeft <= 40 ? '#ff9933' : '#c8a96e';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W-110, 8, 100, 28);
  ctx.strokeStyle = timerColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(W-110, 8, 100, 28);
  ctx.fillStyle = timerColor;
  ctx.font = 'bold 15px Georgia';
  ctx.textAlign = 'center';
  const mins = Math.floor(timeLeft/60);
  const secs = String(timeLeft%60).padStart(2,'0');
  ctx.fillText(`⏱ ${mins}:${secs}`, W-60, 27);
  // flash warning
  if(timeLeft <= 20 && Math.floor(Date.now()/400)%2===0) {
    ctx.fillStyle = 'rgba(255,0,0,0.07)';
    ctx.fillRect(0,0,W,H);
  }
  ctx.restore();

  requestAnimationFrame(render);
}

function restartGame() {
  player.tx=1; player.ty=1;
  player.x=1*TILE+TILE/2; player.y=1*TILE+TILE/2;
  player.trail=[];
  enemy.tx=10; enemy.ty=7;
  enemy.x=10*TILE+TILE/2; enemy.y=7*TILE+TILE/2;
  enemy.wpIdx=0; enemy.moveTimer=0;
  timeLeft=120; gameOver=false;
  talkedTo.clear(); allSpiritsFreed=false; doorAnimating=false;
  updateObjectiveHUD();
  clearInterval(timerInterval);
  startTimer();
  closeDialogue();
  const ws = document.getElementById('winScreen');
  ws.querySelector('h2').textContent='✦ YOU ESCAPED ✦';
  ws.querySelector('p').textContent='You found the exit and advanced\nto the next level.\n\nThe maze remembers those\nwho wander its halls.';
  ws.style.display='none';
}

requestAnimationFrame(render);