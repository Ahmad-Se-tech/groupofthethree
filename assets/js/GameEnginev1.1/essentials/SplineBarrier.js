// SplineBarrier.js
// Save as: assets/js/GameEnginev1.1/essentials/SplineBarrier.js
//
// A curved barrier that renders as a filled platform (like Barrier),
// using Catmull-Rom spline interpolation for the top edge.
// Collision is proximity-based against the Player.

class SplineBarrier {
  constructor(data, gameEnv) {
    this.gameEnv     = gameEnv;
    this.spriteData  = data;
    this.id          = data.id          ?? 'spline_barrier';
    this.color       = data.color       ?? 'rgba(255, 0, 0, 0.3)';
    this.borderColor = data.borderColor ?? 'rgba(225, 0, 0, 0.8)';
    this.lineWidth   = data.lineWidth   ?? 2;
    this.visible     = data.visible     ?? true;
    // Thickness of the filled platform body in pixels
    this.platformHeight = data.platformHeight ?? 18;

    // Control points in absolute pixel coordinates (define the TOP edge)
    this.splinePoints = data.splinePoints ?? [
      { x: 0,                        y: gameEnv.innerHeight * 0.5 },
      { x: gameEnv.innerWidth * 0.5, y: gameEnv.innerHeight * 0.5 },
      { x: gameEnv.innerWidth,       y: gameEnv.innerHeight * 0.5 }
    ];

    this.samplesPerSegment = data.samplesPerSegment ?? 50;
    this.pushStrength      = data.pushStrength      ?? 8;
    this.collisionRadius   = data.collisionRadius   ?? 22;

    this.curvePoints = this.getCurvePoints();
    this._createCanvas();

    if (gameEnv.gameObjects) gameEnv.gameObjects.push(this);

    this.update();
  }

  // ── Canvas — full-game-area overlay, same z-index as Barrier ─────────────────

  _createCanvas() {
    const existing = document.getElementById(this.id);
    if (existing) existing.remove();

    const container = this.gameEnv?.container
      ?? document.getElementById('gameContainer')
      ?? document.body;

    this.canvas        = document.createElement('canvas');
    this.canvas.id     = this.id;
    this.canvas.width  = this.gameEnv.innerWidth;
    this.canvas.height = this.gameEnv.innerHeight;

    Object.assign(this.canvas.style, {
      position:       'absolute',
      top:            '0',
      left:           '0',
      width:          `${this.gameEnv.innerWidth}px`,
      height:         `${this.gameEnv.innerHeight}px`,
      zIndex:         '11',
      pointerEvents:  'none',
      imageRendering: 'pixelated'
    });

    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
  }

  // ── Catmull-Rom ───────────────────────────────────────────────────────────────

  static catmullRom(P0, P1, P2, P3, t) {
    const t2 = t * t, t3 = t2 * t;
    return {
      x: 0.5 * ((2*P1.x) + (-P0.x+P2.x)*t + (2*P0.x-5*P1.x+4*P2.x-P3.x)*t2 + (-P0.x+3*P1.x-3*P2.x+P3.x)*t3),
      y: 0.5 * ((2*P1.y) + (-P0.y+P2.y)*t + (2*P0.y-5*P1.y+4*P2.y-P3.y)*t2 + (-P0.y+3*P1.y-3*P2.y+P3.y)*t3)
    };
  }

  getCurvePoints() {
    const pts = this.splinePoints, n = pts.length, result = [];
    if (n < 2) return result;
    for (let i = 0; i < n - 1; i++) {
      const P0 = pts[Math.max(i-1,0)], P1 = pts[i],
            P2 = pts[Math.min(i+1,n-1)], P3 = pts[Math.min(i+2,n-1)];
      for (let s = 0; s <= this.samplesPerSegment; s++) {
        result.push(SplineBarrier.catmullRom(P0, P1, P2, P3, s / this.samplesPerSegment));
      }
    }
    return result;
  }

  // ── Draw — filled platform shape, styled like Barrier ────────────────────────

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.visible || this.curvePoints.length < 2) return;

    const pts = this.curvePoints;
    const ph  = this.platformHeight;

    // Filled body: top edge curve → right cap → bottom edge (offset down) → close
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y + ph);
    for (let i = pts.length - 2; i >= 0; i--) ctx.lineTo(pts[i].x, pts[i].y + ph);
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();

    // Top-edge border (like Barrier's strokeRect)
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth   = this.lineWidth;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
  }

  // ── Collision ─────────────────────────────────────────────────────────────────

  collisionChecks() {}
  isCollision()    { return false; }

  update() {
    this.draw();

    const player = this.gameEnv.gameObjects?.find(
      obj => obj?.spriteData?.id === 'Octopus' || obj?.constructor?.name === 'Player'
    );
    if (!player) return;

    const px = (player.position?.x ?? 0) + (player.width  ?? 0) / 2;
    const py = (player.position?.y ?? 0) + (player.height ?? 0) / 2;

    let closestDist = Infinity, closestPoint = null;
    for (const pt of this.curvePoints) {
      const dx = px - pt.x, dy = py - pt.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < closestDist) { closestDist = d; closestPoint = pt; }
    }

    if (closestDist < this.collisionRadius && closestPoint) {
      const dx = px - closestPoint.x, dy = py - closestPoint.y;
      const len = Math.sqrt(dx*dx + dy*dy) || 1;
      if (player.position) {
        player.position.x += (dx/len) * this.pushStrength;
        player.position.y += (dy/len) * this.pushStrength;
      }
      if ((dy/len) * this.pushStrength < 0 && player.velocity) {
        player.velocity.y = Math.min(player.velocity.y, 0);
      }
    }
  }

  // ── Resize ────────────────────────────────────────────────────────────────────

  resize() {
    const newW = this.gameEnv.innerWidth, newH = this.gameEnv.innerHeight;
    const sx = newW / (this.canvas.width  || newW);
    const sy = newH / (this.canvas.height || newH);

    this.splinePoints = this.splinePoints.map(p => ({ x: p.x*sx, y: p.y*sy }));
    this.curvePoints  = this.getCurvePoints();

    this.canvas.width  = newW;
    this.canvas.height = newH;
    Object.assign(this.canvas.style, { width: `${newW}px`, height: `${newH}px` });

    this.update();
  }

  // ── Destroy ───────────────────────────────────────────────────────────────────

  destroy() {
    if (this.canvas?.parentNode) this.canvas.parentNode.removeChild(this.canvas);
    const idx = this.gameEnv?.gameObjects?.indexOf?.(this) ?? -1;
    if (idx > -1) this.gameEnv.gameObjects.splice(idx, 1);
  }
}

export default SplineBarrier;