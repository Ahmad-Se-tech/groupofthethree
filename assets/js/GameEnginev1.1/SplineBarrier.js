import GameObject from './essentials/GameObject.js';

class SplineBarrier extends GameObject {
    constructor(data, gameEnv) {
        super(gameEnv);

        let splinePoints;
        if (data && data.splinePoints && Array.isArray(data.splinePoints)) {
            splinePoints = data.splinePoints;
        } else {
            console.warn('SplineBarrier: No valid splinePoints provided, using default curve');
            splinePoints = [
                { x: 100, y: 200 },
                { x: 300, y: 100 },
                { x: 500, y: 300 }
            ];
        }

        const bounds = SplineBarrier.calculateBounds(splinePoints);

        this.splinePoints = splinePoints;
        this.visible = data.visible !== undefined ? data.visible : true;
        this.barrierColor = data.color || '#8B4513';
        this.lineWidth = data.lineWidth || 5;
        this.splineBounds = bounds;
        this.id = data.id || 'spline_barrier';

        this.hitbox = {};

        this.canvas = document.createElement('canvas');
        this.canvas.id = this.id;
        this.canvas.width = this.gameEnv.innerWidth;
        this.canvas.height = this.gameEnv.innerHeight;
        this.ctx = this.canvas.getContext('2d');

        const container = this.gameEnv?.container;
        if (container) container.appendChild(this.canvas);
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0px';
        this.canvas.style.top = `${this.gameEnv?.top || 0}px`;
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '15';
    }

    // ── Safely get player center regardless of engine version ─────────────────
    getPlayerCenter(player) {
        // Try getCenter() first
        if (typeof player.getCenter === 'function') {
            return player.getCenter();
        }
        // Try transform (common in many engines)
        if (player.transform) {
            return {
                x: player.transform.x + (player.width  || player.canvas?.width  || 0) / 2,
                y: player.transform.y + (player.height || player.canvas?.height || 0) / 2,
            };
        }
        // Try position object
        if (player.position) {
            return {
                x: player.position.x + (player.width  || 0) / 2,
                y: player.position.y + (player.height || 0) / 2,
            };
        }
        // Try x/y directly
        if (player.x !== undefined && player.y !== undefined) {
            return {
                x: player.x + (player.width  || 0) / 2,
                y: player.y + (player.height || 0) / 2,
            };
        }
        // Last resort — read from canvas position
        if (player.canvas) {
            const rect = player.canvas.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return null;
    }

    draw() {
        if (!this.ctx || !this.canvas) return;
        if (!this.visible) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const curvePoints = SplineBarrier.getCurvePoints(this.splinePoints);
        if (curvePoints.length === 0) return;

        this.ctx.strokeStyle = this.barrierColor;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < curvePoints.length; i++) {
            this.ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        this.ctx.stroke();
    }

    update() {
        this.draw();

        const player = this.gameEnv?.gameObjects?.find(obj => obj.constructor?.name === 'Player');
        if (!player) return;

        const curvePoints = SplineBarrier.getCurvePoints(this.splinePoints);
        const collisionPoint = this.getCollisionPoint(player, curvePoints);

        if (collisionPoint) {
            const playerCenter = this.getPlayerCenter(player);
            if (!playerCenter) return;

            const dx = playerCenter.x - collisionPoint.x;
            const dy = playerCenter.y - collisionPoint.y;
            const dist = Math.hypot(dx, dy);

            if (dist > 0) {
                const pushX = (dx / dist) * 2;
                const pushY = (dy / dist) * 2;

                // Push player back using whichever position property exists
                if (player.transform) {
                    player.transform.x += pushX;
                    player.transform.y += pushY;
                } else if (player.position) {
                    player.position.x += pushX;
                    player.position.y += pushY;
                } else if (player.x !== undefined) {
                    player.x += pushX;
                    player.y += pushY;
                }
            }
        }
    }

    resize() {}

    destroy() {
        const idx = this.gameEnv?.gameObjects?.indexOf?.(this) ?? -1;
        if (idx > -1) this.gameEnv.gameObjects.splice(idx, 1);
    }

    collisionChecks() {}

    isCollision(other) {
        return false;
    }

    static calculateBounds(splinePoints) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const point of splinePoints) {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        }
        return { minX, minY, width: maxX - minX, height: maxY - minY };
    }

    getCollisionPoint(player, curvePoints) {
        const playerCenter = this.getPlayerCenter(player);
        if (!playerCenter) return null;

        const collisionDistance = 20;
        for (const point of curvePoints) {
            const distance = Math.hypot(point.x - playerCenter.x, point.y - playerCenter.y);
            if (distance < collisionDistance) {
                return point;
            }
        }
        return null;
    }

    checkCurveCollision(player, curvePoints) {
        const playerCenter = this.getPlayerCenter(player);
        if (!playerCenter) return false;

        const collisionDistance = 20;
        for (const point of curvePoints) {
            const distance = Math.hypot(point.x - playerCenter.x, point.y - playerCenter.y);
            if (distance < collisionDistance) return true;
        }
        return false;
    }

    static catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        return 0.5 * (
            2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3
        );
    }

    static getCurvePoints(splinePoints, segments = 50) {
        const curvePoints = [];
        if (!splinePoints || !Array.isArray(splinePoints) || splinePoints.length < 2) {
            console.warn('SplineBarrier: Invalid splinePoints array', splinePoints);
            return curvePoints;
        }
        for (let i = 0; i < splinePoints.length - 1; i++) {
            const p0 = splinePoints[i - 1] || splinePoints[i];
            const p1 = splinePoints[i];
            const p2 = splinePoints[i + 1];
            const p3 = splinePoints[i + 2] || splinePoints[i + 1];
            for (let j = 0; j < segments; j++) {
                const t = j / segments;
                const x = this.catmullRom(p0.x, p1.x, p2.x, p3.x, t);
                const y = this.catmullRom(p0.y, p1.y, p2.y, p3.y, t);
                curvePoints.push({ x, y });
            }
        }
        return curvePoints;
    }
}

export default SplineBarrier;