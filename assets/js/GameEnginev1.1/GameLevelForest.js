// Final Level — The Whispering Forest
// Save as: assets/js/GameEnginev1/GameLevelForest.js

import GameEnvBackground from './essentials/GameEnvBackground.js';
import Player from './essentials/Player.js';
import Npc from './essentials/Npc.js';
import Barrier from './essentials/Barrier.js';

// ─────────────────────────────────────────────────────────────────────────────
//  SELF-CONTAINED CANVAS RENDERER
//  Mounts a <canvas> over the game and runs the scary forest level on top.
//  Uses the GameLevel class pattern so it drops into the existing engine.
// ─────────────────────────────────────────────────────────────────────────────

class ForestRenderer {
    constructor() {
        this.W = window.innerWidth;
        this.H = window.innerHeight;
        this._buildCanvas();
        this._buildWorld();
        this._buildState();
        this._bindInput();
        this._loop();
    }

    // ── CANVAS SETUP ─────────────────────────────────────────────────────────
    _buildCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'forestCanvas';
        this.canvas.width  = this.W;
        this.canvas.height = this.H;
        Object.assign(this.canvas.style, {
            position: 'fixed', top: '0', left: '0',
            width: '100vw', height: '100vh',
            zIndex: '9999', imageRendering: 'pixelated',
            cursor: 'none',
        });
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    // ── WORLD GEOMETRY ───────────────────────────────────────────────────────
    _buildWorld() {
        this.TILE  = 36;
        this.COLS  = 64;
        this.ROWS  = 90;
        this.WW    = this.COLS * this.TILE;
        this.WH    = this.ROWS * this.TILE;

        // Build tree grid — true = solid tree
        this.grid = [];
        for (let r = 0; r < this.ROWS; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.COLS; c++) this.grid[r][c] = true;
        }

        // Carve passable corridors
        const carve = (c0, c1, r0, r1) => {
            for (let r = r0; r < r1; r++)
                for (let c = c0; c < c1; c++)
                    this.grid[r][c] = false;
        };

        // Entry throat — narrow and oppressive
        carve(29, 35, 0, 18);
        // Widening into a foggy clearing — deceptively open
        carve(20, 44, 17, 38);
        // Two winding paths that LOOK equal — neither is marked
        // Path A (left) — gentle curve, widens at end into death clearing
        carve(15, 23, 37, 55);
        carve(13, 24, 54, 70);
        carve(10, 27, 68, 90);          // death clearing
        // Path B (right) — slightly narrower start, then opens to village
        carve(41, 49, 37, 52);
        carve(40, 51, 51, 68);
        carve(38, 54, 67, 90);          // victory clearing

        // Dead-end false branch to confuse player
        carve(24, 40, 50, 58);          // horizontal false corridor

        // Pre-compute tree variants for drawing
        const rng = s => { let x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
        this.trees = [];
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                if (this.grid[r][c]) {
                    this.trees.push({
                        c, r,
                        sz:    0.65 + rng(c * 7.1 + r * 3.3) * 0.55,
                        shade: Math.floor(rng(c * 2.3 + r * 5.9) * 5),
                        lean:  (rng(c * 4 + r) - 0.5) * 0.06,
                    });
                }
            }
        }

        // Env scatter (stones, bones, mushrooms)
        this.envObj = [];
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                if (!this.grid[r][c] && rng(r * 91 + c) < 0.07) {
                    const t = rng(r * 37 + c);
                    this.envObj.push({
                        x: c * this.TILE + this.TILE / 2,
                        y: r * this.TILE + this.TILE / 2,
                        type: t < 0.3 ? 'bone' : t < 0.6 ? 'stone' : 'mushroom',
                    });
                }
            }
        }

        // Zones — invisible triggers, no colour hints given to player
        this.DEATH_ZONE   = { x: 10 * this.TILE, y: 74 * this.TILE, w: 17 * this.TILE, h: 16 * this.TILE };
        this.VICTORY_ZONE = { x: 38 * this.TILE, y: 74 * this.TILE, w: 16 * this.TILE, h: 16 * this.TILE };

        // NPCs — SHORT lines, no direction hints
        this.NPCS = [
            {
                id: 'wraith',
                x: this.WW / 2 - 80, y: 22 * this.TILE,
                r: 13, talked: false,
                name: '???',
                color: 'rgba(140,160,200,0.7)',
                glow: '#4060c0',
                line: '...it took my family. Both paths lead somewhere. Not all somewheres are safe.',
            },
            {
                id: 'figure',
                x: this.WW / 2 + 90, y: 30 * this.TILE,
                r: 12, talked: false,
                name: 'Dark Figure',
                color: '#1a1018',
                glow: '#500030',
                line: 'I\'ve been standing here since I chose wrong. I can\'t remember which way I came from.',
            },
            {
                id: 'warden',
                x: this.WW / 2, y: 39 * this.TILE,
                r: 14, talked: false,
                name: 'The Warden',
                color: '#606840',
                glow: '#304010',
                line: 'The forest shifts at night. What looks safe is rarely so. You must choose now.',
                choices: [
                    { label: '← Go left', outcome: 'death' },
                    { label: 'Go right →', outcome: 'victory' },
                ],
            },
        ];

        // Fireflies
        this.flies = [];
        for (let i = 0; i < 40; i++) {
            this.flies.push({
                x: Math.random() * this.WW,
                y: Math.random() * this.WH,
                phase: Math.random() * Math.PI * 2,
                spd:   0.3 + Math.random() * 0.5,
                r:     1 + Math.random() * 1.4,
                hue:   Math.random() > 0.6 ? 'red' : 'green', // red ones in death zone hint slightly
            });
        }

        // Blood/scratch marks on death path walls (subtle)
        this.scratches = [];
        for (let i = 0; i < 12; i++) {
            const rn = 0.55 + Math.random() * 0.25;
            this.scratches.push({
                x: (10 + Math.random() * 14) * this.TILE,
                y: rn * this.WH,
                angle: Math.random() * Math.PI,
                len: 8 + Math.random() * 18,
            });
        }
    }

    // ── STATE ────────────────────────────────────────────────────────────────
    _buildState() {
        this.P = {
            x: this.WW / 2, y: 2 * this.TILE,
            r: 11, spd: 2.6,
            angle: Math.PI / 2,
            stepPhase: 0,
        };
        this.camX = 0;
        this.camY = 0;
        this.keys = {};
        this.tick = 0;
        this.scene = 'INTRO';  // INTRO | GAME | DIALOGUE | END
        this.endType = '';
        this.endAlpha = 0;
        this.introAlpha = 1;
        this.introTick = 0;
        this.particles = [];
        this.interactCool = 0;
        this.dialogueNPC = null;
        this.dialogueLine = '';
        this.dialogueChoices = null;

        // Ambient horror flicker
        this.flickerAlpha = 0;
        this.flickerTimer = 0;
        this.nextFlicker  = 180 + Math.random() * 300;

        // Whisper text (ambient dread)
        this.whispers = [
            'turn back', 'you are lost', 'wrong way', 'it sees you',
            'run', 'don\'t look', 'they are watching', 'you chose wrong',
        ];
        this.whisperActive = null;
        this.whisperTimer  = 0;
        this.nextWhisper   = 200 + Math.random() * 400;

        // Eye sprites (appear in darkness near trees)
        this.eyes = [];
        for (let i = 0; i < 8; i++) {
            this.eyes.push({
                x: (10 + Math.random() * 14) * this.TILE,
                y: (40 + Math.random() * 45) * this.TILE,
                phase: Math.random() * Math.PI * 2,
                open: false,
                nextOpen: 300 + Math.random() * 600,
                openTimer: 0,
            });
        }
    }

    // ── INPUT ─────────────────────────────────────────────────────────────────
    _bindInput() {
        this._kd = e => {
            this.keys[e.key] = true;
            if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))
                e.preventDefault();

            if (e.key === 'e' || e.key === 'E') {
                if (this.scene === 'DIALOGUE' && !this.dialogueChoices) {
                    this._closeDialogue();
                } else if (this.scene === 'GAME' && this.interactCool === 0) {
                    const n = this._nearNPC();
                    if (n) this._openDialogue(n);
                }
            }
            if (this.scene === 'DIALOGUE' && this.dialogueChoices) {
                if (e.key === '1') this._triggerOutcome(this.dialogueChoices[0].outcome);
                if (e.key === '2') this._triggerOutcome(this.dialogueChoices[1].outcome);
            }
            if ((e.key === 'r' || e.key === 'R') && this.scene === 'END')
                this._resetLevel();
        };
        window.addEventListener('keydown', this._kd);

        this._ku = e => { this.keys[e.key] = false; };
        window.addEventListener('keyup', this._ku);

        this._mc = e => {
            if (this.scene !== 'DIALOGUE' || !this.dialogueChoices) return;
            const rect = this.canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (this.W / rect.width);
            const my = (e.clientY - rect.top)  * (this.H / rect.height);
            const by = this.H - 95;
            this.dialogueChoices.forEach((ch, i) => {
                const cx = 18 + i * 310, cy = by + 65, cw = 290;
                if (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + 24)
                    this._triggerOutcome(ch.outcome);
            });
        };
        this.canvas.addEventListener('click', this._mc);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    _rng(s) { let x = Math.sin(s) * 43758.5453; return x - Math.floor(x); }
    _wx(x)  { return x - this.camX; }
    _wy(y)  { return y - this.camY; }
    _iv(x, y, pad = 70) { return x > -pad && x < this.W + pad && y > -pad && y < this.H + pad; }

    _solid(wx, wy) {
        const c = Math.floor(wx / this.TILE), r = Math.floor(wy / this.TILE);
        if (c < 0 || c >= this.COLS || r < 0 || r >= this.ROWS) return true;
        return this.grid[r][c];
    }
    _collides(x, y, rad) {
        const pts = [
            [x, y], [x + rad, y], [x - rad, y], [x, y + rad], [x, y - rad],
            [x + rad * 0.7, y + rad * 0.7], [x - rad * 0.7, y + rad * 0.7],
            [x + rad * 0.7, y - rad * 0.7], [x - rad * 0.7, y - rad * 0.7],
        ];
        return pts.some(([px, py]) => this._solid(px, py));
    }

    _nearNPC() {
        for (const n of this.NPCS) {
            const dx = this.P.x - n.x, dy = this.P.y - n.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.P.r + n.r + 24) return n;
        }
        return null;
    }

    _openDialogue(npc) {
        this.scene = 'DIALOGUE';
        this.dialogueNPC = npc;
        this.dialogueLine = npc.line;
        this.dialogueChoices = npc.choices || null;
    }
    _closeDialogue() {
        this.dialogueNPC.talked = true;
        this.dialogueNPC = null;
        this.dialogueChoices = null;
        this.scene = 'GAME';
        this.interactCool = 30;
    }
    _triggerOutcome(outcome) {
        if (this.dialogueNPC) this.dialogueNPC.talked = true;
        this.endType = outcome;
        this.scene = 'END';
        this.endAlpha = 0;
        this._spawnParticles(this.P.x, this.P.y, 60,
            outcome === 'death' ? '#660020' : '#806010', 4);
    }

    _spawnParticles(x, y, count, col, spread = 3) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2, s = 0.5 + Math.random() * spread;
            this.particles.push({
                x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                life: 1, decay: 0.022 + Math.random() * 0.02,
                sz: 2 + Math.random() * 3, col,
            });
        }
    }

    _resetLevel() {
        this.canvas.remove();
        window.removeEventListener('keydown', this._kd);
        window.removeEventListener('keyup', this._ku);
        new ForestRenderer();
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    _update() {
        this.tick++;
        this.interactCool = Math.max(0, this.interactCool - 1);

        // Intro fade
        if (this.scene === 'INTRO') {
            this.introTick++;
            if (this.introTick > 110) this.introAlpha -= 0.022;
            if (this.introAlpha <= 0) { this.scene = 'GAME'; this.introAlpha = 0; }
            return;
        }

        // End fade
        if (this.scene === 'END') {
            this.endAlpha = Math.min(1, this.endAlpha + 0.016);
            return;
        }

        // Particles
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.94; p.vy *= 0.94;
            p.life -= p.decay;
        });

        // Fireflies
        this.flies.forEach(f => {
            f.phase += 0.013;
            f.x += Math.sin(f.phase * 0.9) * f.spd;
            f.y += Math.cos(f.phase * 0.6) * f.spd * 0.6;
            if (f.x < 0) f.x = this.WW;
            if (f.x > this.WW) f.x = 0;
            if (f.y < 0) f.y = this.WH;
            if (f.y > this.WH) f.y = 0;
        });

        // Flicker horror effect
        this.flickerTimer++;
        if (this.flickerTimer >= this.nextFlicker) {
            this.flickerAlpha = 0.15 + Math.random() * 0.25;
            setTimeout(() => { this.flickerAlpha = 0; }, 60 + Math.random() * 120);
            this.flickerTimer = 0;
            this.nextFlicker  = 180 + Math.random() * 500;
        }

        // Whisper text
        this.whisperTimer++;
        if (this.whisperTimer >= this.nextWhisper) {
            this.whisperActive = this.whispers[Math.floor(Math.random() * this.whispers.length)];
            setTimeout(() => { this.whisperActive = null; }, 1800);
            this.whisperTimer = 0;
            this.nextWhisper  = 250 + Math.random() * 500;
        }

        // Eyes
        this.eyes.forEach(eye => {
            eye.nextOpen--;
            if (eye.nextOpen <= 0 && !eye.open) {
                eye.open = true;
                eye.openTimer = 60 + Math.random() * 120;
            }
            if (eye.open) {
                eye.openTimer--;
                if (eye.openTimer <= 0) {
                    eye.open = false;
                    eye.nextOpen = 300 + Math.random() * 800;
                }
            }
        });

        if (this.scene !== 'GAME') return;

        // Player movement
        let mx = 0, my = 0;
        if (this.keys['ArrowUp']    || this.keys['w'] || this.keys['W']) my = -1;
        if (this.keys['ArrowDown']  || this.keys['s'] || this.keys['S']) my =  1;
        if (this.keys['ArrowLeft']  || this.keys['a'] || this.keys['A']) mx = -1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) mx =  1;

        if (mx !== 0 || my !== 0) {
            const len = Math.sqrt(mx * mx + my * my);
            mx /= len; my /= len;
            this.P.angle = Math.atan2(my, mx);
            this.P.stepPhase += 0.19;
            const nx = this.P.x + mx * this.P.spd;
            const ny = this.P.y + my * this.P.spd;
            if (!this._collides(nx, this.P.y, this.P.r - 2)) this.P.x = nx;
            if (!this._collides(this.P.x, ny, this.P.r - 2)) this.P.y = ny;
            this.P.x = Math.max(this.P.r, Math.min(this.WW - this.P.r, this.P.x));
            this.P.y = Math.max(this.P.r, Math.min(this.WH - this.P.r, this.P.y));
        }

        // Camera
        this.camX = Math.max(0, Math.min(this.WW - this.W, this.P.x - this.W / 2));
        this.camY = Math.max(0, Math.min(this.WH - this.H, this.P.y - this.H / 2));

        // Zone triggers (no visual — player just walks in)
        const dz = this.DEATH_ZONE, wz = this.VICTORY_ZONE;
        if (this.P.x > dz.x && this.P.x < dz.x + dz.w &&
            this.P.y > dz.y && this.P.y < dz.y + dz.h) this._triggerOutcome('death');
        if (this.P.x > wz.x && this.P.x < wz.x + wz.w &&
            this.P.y > wz.y && this.P.y < wz.y + wz.h) this._triggerOutcome('victory');
    }

    // ── RENDER ────────────────────────────────────────────────────────────────
    _render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#04080304';
        ctx.fillRect(0, 0, this.W, this.H);

        // --- GROUND ---
        const T = this.TILE;
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                if (this.grid[r][c]) continue;
                const sx = c * T - this.camX, sy = r * T - this.camY;
                if (sx > this.W || sx + T < 0 || sy > this.H || sy + T < 0) continue;
                // All ground same dark tone — no colour-coded paths
                ctx.fillStyle = '#0a0f08';
                ctx.fillRect(sx, sy, T, T);
                // Subtle mud detail
                const n = this._rng(r * 97 + c);
                if (n < 0.18) {
                    ctx.fillStyle = 'rgba(20,30,12,0.4)';
                    ctx.fillRect(sx + n * T * 0.8, sy + n * T * 0.5, 4, 4);
                }
            }
        }

        // --- ENV OBJECTS (bones, stones, mushrooms) ---
        for (const o of this.envObj) {
            const sx = this._wx(o.x), sy = this._wy(o.y);
            if (!this._iv(sx, sy)) continue;
            if (o.type === 'bone') {
                ctx.strokeStyle = 'rgba(200,190,170,0.35)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(sx - 5, sy); ctx.lineTo(sx + 5, sy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sx, sy - 5); ctx.lineTo(sx, sy + 5); ctx.stroke();
                ctx.fillStyle = 'rgba(180,170,150,0.3)';
                ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
            } else if (o.type === 'stone') {
                ctx.fillStyle = 'rgba(40,48,35,0.7)';
                ctx.beginPath(); ctx.ellipse(sx, sy, 6, 4, 0.3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(55,65,48,0.5)';
                ctx.beginPath(); ctx.ellipse(sx - 1, sy - 1, 3.5, 2.5, 0.3, 0, Math.PI * 2); ctx.fill();
            } else {
                ctx.fillStyle = 'rgba(70,15,15,0.5)';
                ctx.beginPath(); ctx.arc(sx, sy, 3.5, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(40,8,8,0.6)';
                ctx.fillRect(sx - 1, sy, 2, 6);
            }
        }

        // --- SCRATCH MARKS (very subtle, left path only) ---
        ctx.save();
        ctx.strokeStyle = 'rgba(120,20,20,0.18)';
        ctx.lineWidth = 1.5;
        for (const s of this.scratches) {
            const sx = this._wx(s.x), sy = this._wy(s.y);
            if (!this._iv(sx, sy)) continue;
            ctx.save();
            ctx.translate(sx, sy); ctx.rotate(s.angle);
            ctx.beginPath(); ctx.moveTo(-s.len / 2, 0); ctx.lineTo(s.len / 2, 0); ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        // --- EYES IN THE DARK ---
        for (const eye of this.eyes) {
            if (!eye.open) continue;
            const sx = this._wx(eye.x), sy = this._wy(eye.y);
            if (!this._iv(sx, sy)) continue;
            const blink = eye.openTimer < 10 ? eye.openTimer / 10 : 1;
            ctx.globalAlpha = blink * (0.4 + 0.3 * Math.sin(this.tick * 0.08 + eye.phase));
            ctx.fillStyle = '#ff2020';
            ctx.beginPath(); ctx.arc(sx,      sy, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 10, sy, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(sx,      sy, 1.4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 10, sy, 1.4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // --- NPCS ---
        for (const n of this.NPCS) {
            const sx = this._wx(n.x), sy = this._wy(n.y);
            if (!this._iv(sx, sy)) continue;

            // Aura glow
            const glowPulse = 0.12 + 0.08 * Math.sin(this.tick * 0.05 + n.x);
            ctx.globalAlpha = glowPulse;
            const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, n.r * 3);
            grd.addColorStop(0, n.glow);
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.beginPath(); ctx.arc(sx, sy, n.r * 3, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;

            // Body
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(sx + 3, sy + 4, n.r * 0.9, n.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = n.color;
            ctx.beginPath(); ctx.arc(sx, sy, n.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.arc(sx + 2, sy + 2, n.r * 0.55, 0, Math.PI * 2); ctx.fill();

            // Eyes
            ctx.fillStyle = n.id === 'figure' ? '#ff2020' : '#c8d0a0';
            ctx.beginPath(); ctx.arc(sx - 3, sy - 2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 3, sy - 2, 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(sx - 3, sy - 2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(sx + 3, sy - 2, 1, 0, Math.PI * 2); ctx.fill();

            // Name — blurry/mysterious
            const dx = this.P.x - n.x, dy = this.P.y - n.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < n.r + 90) {
                ctx.globalAlpha = Math.max(0, 1 - dist / (n.r + 90));
                ctx.font = '7px monospace';
                const nw = ctx.measureText(n.name).width;
                ctx.fillStyle = 'rgba(0,0,0,0.65)';
                ctx.fillRect(sx - nw / 2 - 4, sy - n.r - 18, nw + 8, 14);
                ctx.fillStyle = '#9090a8';
                ctx.textAlign = 'center'; ctx.fillText(n.name, sx, sy - n.r - 7); ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
            }

            // [E] prompt
            if (!n.talked && dist < n.r + 28) {
                const pulse = 0.55 + 0.45 * Math.sin(this.tick * 0.18);
                ctx.globalAlpha = pulse;
                ctx.fillStyle = '#b09040';
                ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center'; ctx.fillText('[E]', sx, sy - n.r - 24); ctx.textAlign = 'left';
                ctx.globalAlpha = 1;
            }
        }

        // --- PLAYER ---
        const px = this._wx(this.P.x), py = this._wy(this.P.y);
        const bob = Math.sin(this.P.stepPhase) * 1.8;

        // Lantern glow around player — only light source
        const lanternG = ctx.createRadialGradient(px, py + bob, 0, px, py + bob, 90);
        lanternG.addColorStop(0,   'rgba(180,140,60,0.13)');
        lanternG.addColorStop(0.5, 'rgba(120,90,30,0.06)');
        lanternG.addColorStop(1,   'transparent');
        ctx.fillStyle = lanternG;
        ctx.fillRect(px - 90, py + bob - 90, 180, 180);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(px + 3, py + 4, this.P.r * 0.85, this.P.r * 0.42, 0, 0, Math.PI * 2); ctx.fill();

        ctx.save();
        ctx.translate(px, py + bob);

        // Body
        ctx.fillStyle = '#283820';
        ctx.beginPath(); ctx.arc(0, 0, this.P.r, 0, Math.PI * 2); ctx.fill();

        // Cloak shadow arc toward facing
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, this.P.r, this.P.angle - 0.7, this.P.angle + 0.7);
        ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();

        // Direction dot (lantern)
        const ldx = Math.cos(this.P.angle) * (this.P.r - 4);
        const ldy = Math.sin(this.P.angle) * (this.P.r - 4);
        ctx.fillStyle = '#d0a030';
        ctx.beginPath(); ctx.arc(ldx, ldy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(220,170,60,0.4)';
        ctx.beginPath(); ctx.arc(ldx, ldy, 7, 0, Math.PI * 2); ctx.fill();

        ctx.restore();

        // --- TREES (drawn on top for depth) ---
        const treePalette = [
            ['#111e07','#182808','#0a1604'],
            ['#0e1c06','#162408','#091304'],
            ['#131f07','#1a2a08','#0b1504'],
            ['#101a06','#162207','#081202'],
            ['#121d06','#182608','#0a1403'],
        ];
        for (const t of this.trees) {
            const sx = t.c * T + T / 2 - this.camX;
            const sy = t.r * T + T / 2 - this.camY;
            if (!this._iv(sx, sy, 20)) continue;
            const s = t.sz;
            const cols = treePalette[t.shade] || treePalette[0];

            ctx.save();
            ctx.translate(sx, sy); ctx.rotate(t.lean);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath(); ctx.ellipse(4, 5, T * 0.38 * s, T * 0.24 * s, 0, 0, Math.PI * 2); ctx.fill();

            // Canopy layers
            ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.arc(0, 0, T * 0.44 * s, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.arc(-2, -2, T * 0.35 * s, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.arc(1, -3, T * 0.22 * s, 0, Math.PI * 2); ctx.fill();

            ctx.restore();
        }

        // --- FIREFLIES ---
        for (const f of this.flies) {
            const sx = this._wx(f.x), sy = this._wy(f.y);
            if (!this._iv(sx, sy, 10)) continue;
            const g = 0.35 + 0.65 * Math.sin(f.phase * 2.1 + this.tick * 0.04);
            ctx.globalAlpha = g * 0.75;
            const col = f.hue === 'red' ? ['rgba(220,50,50,0.85)', '#ff6060'] : ['rgba(140,220,80,0.85)', '#c0ff60'];
            const fg = ctx.createRadialGradient(sx, sy, 0, sx, sy, f.r * 5);
            fg.addColorStop(0, col[0]); fg.addColorStop(1, 'transparent');
            ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(sx, sy, f.r * 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = col[1]; ctx.globalAlpha = g;
            ctx.beginPath(); ctx.arc(sx, sy, f.r * 0.65, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // --- PARTICLES ---
        for (const p of this.particles) {
            ctx.globalAlpha = p.life * 0.85;
            ctx.fillStyle = p.col;
            ctx.beginPath(); ctx.arc(this._wx(p.x), this._wy(p.y), p.sz, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // --- DARKNESS VIGNETTE (very heavy — lantern feel) ---
        const vig = ctx.createRadialGradient(this.W/2, this.H/2, this.H * 0.1, this.W/2, this.H/2, this.H * 0.72);
        vig.addColorStop(0, 'transparent');
        vig.addColorStop(1, 'rgba(0,0,0,0.88)');
        ctx.fillStyle = vig; ctx.fillRect(0, 0, this.W, this.H);

        // --- HORROR FLICKER ---
        if (this.flickerAlpha > 0) {
            ctx.fillStyle = `rgba(0,0,0,${this.flickerAlpha})`;
            ctx.fillRect(0, 0, this.W, this.H);
        }

        // --- WHISPER TEXT ---
        if (this.whisperActive) {
            const wAlpha = 0.12 + 0.1 * Math.sin(this.tick * 0.2);
            ctx.globalAlpha = wAlpha;
            ctx.fillStyle = '#cc3030';
            ctx.font = `italic ${12 + Math.floor(Math.random() * 2)}px Georgia, serif`;
            const wx2 = 80 + Math.random() * (this.W - 200);
            const wy2 = 80 + Math.random() * (this.H - 160);
            ctx.fillText(this.whisperActive, wx2, wy2);
            ctx.globalAlpha = 1;
        }

        // --- HUD ---
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, this.W, 24);
        ctx.fillStyle = '#506030';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('FINAL LEVEL  ·  THE WHISPERING FOREST', 12, 16);
        ctx.fillStyle = 'rgba(120,110,80,0.5)';
        ctx.font = '7.5px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('WASD move  ·  E interact', this.W - 10, 16);
        ctx.textAlign = 'left';

        // Minimap
        this._drawMinimap();

        // --- DIALOGUE ---
        if (this.scene === 'DIALOGUE') this._drawDialogue();

        // --- INTRO ---
        if (this.introAlpha > 0) {
            ctx.globalAlpha = this.introAlpha;
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, this.H);
            ctx.fillStyle = '#704020';
            ctx.font = 'bold 34px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('FINAL LEVEL', this.W / 2, this.H / 2 - 42);
            ctx.fillStyle = '#604838';
            ctx.font = 'italic 15px Georgia, serif';
            ctx.fillText('The Whispering Forest', this.W / 2, this.H / 2 - 14);
            ctx.fillStyle = 'rgba(180,160,130,0.75)';
            ctx.font = '12px Georgia, serif';
            ctx.fillText('You escaped the tower. The forest is watching.', this.W / 2, this.H / 2 + 16);
            ctx.fillStyle = 'rgba(100,90,65,0.5)';
            ctx.font = '8px monospace';
            ctx.fillText('WASD / arrows  ·  E to interact', this.W / 2, this.H / 2 + 46);
            ctx.textAlign = 'left'; ctx.globalAlpha = 1;
        }

        // --- END SCREEN ---
        if (this.scene === 'END') this._drawEnd();
    }

    _drawMinimap() {
        const ctx = this.ctx;
        const mw = 80, mh = 100, mx = this.W - mw - 8, my = 30;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = 'rgba(60,70,40,0.5)'; ctx.lineWidth = 1;
        ctx.strokeRect(mx, my, mw, mh);
        const scx = mw / this.WW, scy = mh / this.WH;
        ctx.fillStyle = 'rgba(25,40,14,0.85)';
        for (let r = 0; r < this.ROWS; r += 2) {
            for (let c = 0; c < this.COLS; c += 2) {
                if (!this.grid[r][c])
                    ctx.fillRect(mx + c * this.TILE * scx, my + r * this.TILE * scy,
                        this.TILE * scx * 2, this.TILE * scy * 2);
            }
        }
        // Player dot
        ctx.fillStyle = '#90c040';
        ctx.beginPath();
        ctx.arc(mx + this.P.x * scx, my + this.P.y * scy, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawDialogue() {
        const ctx = this.ctx;
        const n = this.dialogueNPC;
        const bh = 95, by = this.H - bh;
        ctx.fillStyle = 'rgba(3,5,2,0.97)'; ctx.fillRect(0, by, this.W, bh);
        ctx.fillStyle = '#303820'; ctx.fillRect(0, by, this.W, 1.5);

        // Name
        ctx.fillStyle = 'rgba(30,40,15,0.8)'; ctx.fillRect(14, by + 7, 130, 19);
        ctx.fillStyle = '#7a8860'; ctx.font = 'bold 9px monospace';
        ctx.fillText(n.name, 20, by + 20);

        // Line
        ctx.fillStyle = '#c0b898'; ctx.font = '12px Georgia, serif';
        const words = this.dialogueLine.split(' ');
        let line = '', ly = by + 44, maxW = this.W - 40;
        for (let i = 0; i < words.length; i++) {
            const test = line + words[i] + ' ';
            if (ctx.measureText(test).width > maxW && i > 0) {
                ctx.fillText(line, 20, ly); line = words[i] + ' '; ly += 19;
            } else line = test;
        }
        ctx.fillText(line, 20, ly);

        if (this.dialogueChoices) {
            this.dialogueChoices.forEach((ch, i) => {
                const cx = 18 + i * 310, cy = by + 65, cw = 290;
                ctx.fillStyle = 'rgba(20,20,15,0.88)'; 
                ctx.strokeStyle = 'rgba(80,80,50,0.6)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.rect(cx, cy, cw, 24); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#908870'; ctx.font = 'bold 9px monospace';
                ctx.textAlign = 'center'; ctx.fillText(ch.label, cx + cw / 2, cy + 16);
                ctx.textAlign = 'left';
            });
        } else {
            const p = 0.4 + 0.6 * Math.sin(this.tick * 0.16);
            ctx.globalAlpha = p; ctx.fillStyle = '#605840'; ctx.font = '7.5px monospace';
            ctx.textAlign = 'right'; ctx.fillText('▼ E', this.W - 14, by + bh - 8);
            ctx.textAlign = 'left'; ctx.globalAlpha = 1;
        }
    }

    _drawEnd() {
        const ctx = this.ctx;
        ctx.globalAlpha = this.endAlpha;
        if (this.endType === 'death') {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, this.H);
            // Blood red title
            ctx.fillStyle = '#8a0a0a';
            ctx.font = 'bold 42px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('YOU HAVE PERISHED', this.W / 2, this.H / 2 - 36);
            ctx.fillStyle = 'rgba(160,100,80,0.7)';
            ctx.font = 'italic 13px Georgia, serif';
            ctx.fillText('The forest has swallowed another soul.', this.W / 2, this.H / 2 + 6);
            ctx.fillText('Silence. Then nothing.', this.W / 2, this.H / 2 + 28);
            ctx.fillStyle = 'rgba(100,30,20,0.5)';
            ctx.font = '8px monospace';
            ctx.fillText('[ R — try again ]', this.W / 2, this.H / 2 + 68);
        } else {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, this.H);
            ctx.globalAlpha = this.endAlpha * 0.18;
            const lg = ctx.createRadialGradient(this.W/2, this.H*0.65, 0, this.W/2, this.H*0.65, 280);
            lg.addColorStop(0, '#e8b840'); lg.addColorStop(1, 'transparent');
            ctx.fillStyle = lg; ctx.fillRect(0, 0, this.W, this.H);
            ctx.globalAlpha = this.endAlpha;
            ctx.fillStyle = '#988030';
            ctx.font = 'bold 36px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillText('YOU MADE IT OUT ALIVE', this.W / 2, this.H / 2 - 36);
            ctx.fillStyle = 'rgba(200,185,140,0.8)';
            ctx.font = 'italic 13px Georgia, serif';
            ctx.fillText('Ashenholm. Warm light. You are safe.', this.W / 2, this.H / 2 + 6);
            ctx.fillStyle = 'rgba(100,110,60,0.55)';
            ctx.font = '8px monospace';
            ctx.fillText('[ R — play again ]', this.W / 2, this.H / 2 + 56);
        }
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }

    // ── LOOP ──────────────────────────────────────────────────────────────────
    _loop() {
        this._update();
        this._render();
        this._raf = requestAnimationFrame(() => this._loop());
    }

    destroy() {
        cancelAnimationFrame(this._raf);
        window.removeEventListener('keydown', this._kd);
        window.removeEventListener('keyup',   this._ku);
        this.canvas.remove();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  GAME LEVEL CLASS  — matches the existing engine format exactly
// ─────────────────────────────────────────────────────────────────────────────
class GameLevelForest {
    constructor(gameEnv) {
        const path   = gameEnv.path;
        const width  = gameEnv.innerWidth;
        const height = gameEnv.innerHeight;

        // Background — dark forest sky, no distracting imagery
        const bgData = {
            name:   'forest_bg',
            src:    path + '/images/gamebuilder/bg/forest_night.jpg',
            pixels: { height: 720, width: 1280 },
        };

        // Player sprite data
        const playerData = {
            id:             'playerData',
            src:            path + '/images/gamebuilder/sprites/survivor.png',
            SCALE_FACTOR:   6,
            STEP_FACTOR:    900,
            ANIMATION_RATE: 60,
            INIT_POSITION:  { x: 0.5, y: 0.05 },
            pixels:         { height: 36, width: 569 },
            orientation:    { rows: 1, columns: 13 },
            down:           { row: 0, start: 0, columns: 3 },
            downRight:      { row: 0, start: 0, columns: 3, rotate:  Math.PI / 16 },
            downLeft:       { row: 0, start: 0, columns: 3, rotate: -Math.PI / 16 },
            left:           { row: 0, start: 0, columns: 3 },
            right:          { row: 0, start: 0, columns: 3 },
            up:             { row: 0, start: 0, columns: 3 },
            upLeft:         { row: 0, start: 0, columns: 3, rotate:  Math.PI / 16 },
            upRight:        { row: 0, start: 0, columns: 3, rotate: -Math.PI / 16 },
            hitbox:         { widthPercentage: 0, heightPercentage: 0 },
            keypress:       { up: 87, left: 65, down: 83, right: 68 },
        };

        // NPC — The Wraith (ambiguous warning, gives nothing away)
        const npcWraith = {
            id:             'wraith',
            greeting:       '...it took my family.',
            src:            path + '/images/gamebuilder/sprites/ghost.png',
            SCALE_FACTOR:   8,
            ANIMATION_RATE: 80,
            INIT_POSITION:  { x: 0.38, y: 0.26 },
            pixels:         { height: 36, width: 569 },
            orientation:    { rows: 1, columns: 13 },
            down:           { row: 0, start: 0, columns: 3 },
            right:          { row: Math.min(1, 0), start: 0, columns: 3 },
            left:           { row: Math.min(2, 0), start: 0, columns: 3 },
            up:             { row: Math.min(3, 0), start: 0, columns: 3 },
            upRight:        { row: Math.min(3, 0), start: 0, columns: 3 },
            downRight:      { row: Math.min(1, 0), start: 0, columns: 3 },
            upLeft:         { row: Math.min(2, 0), start: 0, columns: 3 },
            downLeft:       { row: 0,              start: 0, columns: 3 },
            hitbox:         { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: [
                '...it took my family. Both paths lead somewhere.',
                'Not all somewheres are safe.',
            ],
            reaction: function () { if (this.dialogueSystem) this.showReactionDialogue(); },
            interact: function () { if (this.dialogueSystem) this.showRandomDialogue(); },
        };

        // NPC — Dark Figure (no direction hints)
        const npcFigure = {
            id:             'figure',
            greeting:       "I can't remember which way I came from.",
            src:            path + '/images/gamebuilder/sprites/shadow.png',
            SCALE_FACTOR:   8,
            ANIMATION_RATE: 90,
            INIT_POSITION:  { x: 0.62, y: 0.34 },
            pixels:         { height: 36, width: 569 },
            orientation:    { rows: 1, columns: 13 },
            down:           { row: 0, start: 0, columns: 3 },
            right:          { row: Math.min(1, 0), start: 0, columns: 3 },
            left:           { row: Math.min(2, 0), start: 0, columns: 3 },
            up:             { row: Math.min(3, 0), start: 0, columns: 3 },
            upRight:        { row: Math.min(3, 0), start: 0, columns: 3 },
            downRight:      { row: Math.min(1, 0), start: 0, columns: 3 },
            upLeft:         { row: Math.min(2, 0), start: 0, columns: 3 },
            downLeft:       { row: 0,              start: 0, columns: 3 },
            hitbox:         { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: [
                "I chose. I ended up here. I can't leave.",
                "The forest shifts at night. Nothing is what it was.",
            ],
            reaction: function () { if (this.dialogueSystem) this.showReactionDialogue(); },
            interact: function () { if (this.dialogueSystem) this.showRandomDialogue(); },
        };

        // NPC — The Warden (forces the fork choice, still no hints)
        const npcWarden = {
            id:             'warden',
            greeting:       'You must choose now.',
            src:            path + '/images/gamebuilder/sprites/warden.png',
            SCALE_FACTOR:   7,
            ANIMATION_RATE: 70,
            INIT_POSITION:  { x: 0.5, y: 0.44 },
            pixels:         { height: 36, width: 569 },
            orientation:    { rows: 1, columns: 13 },
            down:           { row: 0, start: 0, columns: 3 },
            right:          { row: Math.min(1, 0), start: 0, columns: 3 },
            left:           { row: Math.min(2, 0), start: 0, columns: 3 },
            up:             { row: Math.min(3, 0), start: 0, columns: 3 },
            upRight:        { row: Math.min(3, 0), start: 0, columns: 3 },
            downRight:      { row: Math.min(1, 0), start: 0, columns: 3 },
            upLeft:         { row: Math.min(2, 0), start: 0, columns: 3 },
            downLeft:       { row: 0,              start: 0, columns: 3 },
            hitbox:         { widthPercentage: 0.1, heightPercentage: 0.2 },
            dialogues: [
                'The fork is ahead. I cannot tell you which way.',
                'I was told not to. Choose.',
            ],
            reaction: function () { if (this.dialogueSystem) this.showReactionDialogue(); },
            interact: function () { if (this.dialogueSystem) this.showRandomDialogue(); },
        };

        // Mount the self-contained forest renderer over the engine canvas
        this._renderer = new ForestRenderer();

        this.classes = [
            { class: GameEnvBackground, data: bgData   },
            { class: Player,            data: playerData },
            { class: Npc,               data: npcWraith  },
            { class: Npc,               data: npcFigure  },
            { class: Npc,               data: npcWarden  },
        ];
    }

    destroy() {
        if (this._renderer) this._renderer.destroy();
    }
}

export default GameLevelForest;