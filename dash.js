// === TURBO DASH v2 ===

const TurboDash = {
    st: 'title', tmr: 0, dist: 0, best: 0,
    p: { x: 40, y: 200, vy: 0, onGround: false, jumps: 0, duck: false, dead: false, col: '#0ff' },
    obstacles: [],
    coins: [],
    speed: 2.5,
    score: 0,
    bgX: 0,
    bgBuilding: 0, // building scroll (0.2x)
    buildings: [],
    titleBgX: 0, titleAnim: 0,

    FLOOR_Y: 230,
    GRAVITY: 0.55,
    JUMP_F: -11,

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.titleAnim = 0; this.titleBgX = 0;
        this.best = SaveSys.data.dashBest || 0;
        this.genBuildings();
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    genBuildings() {
        this.buildings = [];
        for (let i = 0; i < 16; i++) {
            this.buildings.push({
                x: i * 28 + (Math.random()*10|0),
                h: 30 + (Math.random()*60|0),
                w: 14 + (Math.random()*12|0)
            });
        }
    },

    startGame() {
        this.st = 'play'; this.tmr = 0; this.dist = 0; this.score = 0;
        this.speed = 2.5; this.bgX = 0; this.bgBuilding = 0;
        this.p = { x: 40, y: this.FLOOR_Y, vy: 0, onGround: true, jumps: 0, duck: false, dead: false, col: '#0ff' };
        this.obstacles = [];
        this.coins = [];
        this.genBuildings();
        if (typeof BGM !== 'undefined') BGM.play('dash');
    },

    spawnObstacle() {
        let type = Math.floor(Math.random() * 4);
        if (type === 0) {
            // 低い壁
            this.obstacles.push({ x: 210, y: this.FLOOR_Y - 30, w: 14, h: 30, type: 0, col: '#f44' });
        } else if (type === 1) {
            // 天井から棘（しゃがみ回避）
            this.obstacles.push({ x: 210, y: 0, w: 10, h: 130, type: 1, col: '#f84' });
        } else if (type === 2) {
            // 高い壁（ジャンプのみ）
            this.obstacles.push({ x: 210, y: this.FLOOR_Y - 55, w: 12, h: 55, type: 2, col: '#f44' });
        } else {
            // 低い壁 × 2 連続
            this.obstacles.push({ x: 210, y: this.FLOOR_Y - 28, w: 12, h: 28, type: 0, col: '#f44' });
            this.obstacles.push({ x: 260, y: this.FLOOR_Y - 28, w: 12, h: 28, type: 0, col: '#f44' });
        }
    },

    spawnCoin() {
        let fy = this.FLOOR_Y - 10 - Math.floor(Math.random() * 3) * 25;
        this.coins.push({ x: 210, y: fy, r: 6, collected: false });
    },

    collides(p, obs) {
        let ph = p.duck ? 12 : 20;
        let py = p.duck ? p.y - 12 : p.y - 20;
        return p.x + 8 > obs.x && p.x - 8 < obs.x + obs.w &&
               py + ph > obs.y && py < obs.y + obs.h;
    },

    endGame() {
        this.st = 'gameover'; this.tmr = 0;
        this.p.dead = true;
        this.score = this.dist + this.score;
        if (this.score > this.best) {
            this.best = this.score;
            SaveSys.data.dashBest = this.best;
            SaveSys.save();
        }
        SaveSys.addLog('TURBO DASH', `スコア: ${this.score}`);
        if (typeof BGM !== 'undefined') BGM.stop();
        playSnd('hit');
        screenShake(12);
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        if (this.st === 'title') {
            this.titleAnim++; this.titleBgX -= 0.5;
            if (keysDown.a) { this.startGame(); playSnd('jmp'); }
            return;
        }

        if (this.st === 'gameover') {
            if (this.tmr > 90 && keysDown.a) {
                this.st = 'title';
                if (typeof BGM !== 'undefined') BGM.play('menu');
            }
            return;
        }

        // ===== PLAY =====
        this.dist++;
        this.bgX -= this.speed * 0.5;
        this.bgBuilding -= this.speed * 0.1; // parallax 0.2x
        this.speed = Math.min(6.0, 2.5 + this.dist * 0.001);

        // プレイヤー物理
        let p = this.p;
        p.duck = keys.down;
        p.vy += this.GRAVITY;

        // ジャンプ
        if (keysDown.a && p.jumps < 2) {
            p.vy = this.JUMP_F;
            p.jumps++;
            playSnd('jmp');
        }

        p.y += p.vy;

        // 地面判定
        if (p.y >= this.FLOOR_Y) {
            p.y = this.FLOOR_Y;
            p.vy = 0;
            p.onGround = true;
            p.jumps = 0;
        } else {
            p.onGround = false;
        }

        // 障害物スポーン
        let spawnInterval = Math.max(55, 110 - Math.floor(this.dist / 100) * 5);
        if (this.tmr % spawnInterval === 0) this.spawnObstacle();
        if (this.tmr % 80 === 40) this.spawnCoin();

        // 障害物更新・衝突
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let obs = this.obstacles[i];
            obs.x -= this.speed;
            if (obs.x + obs.w < 0) { this.obstacles.splice(i, 1); continue; }
            if (this.collides(p, obs)) {
                this.endGame(); return;
            }
        }

        // コイン
        for (let i = this.coins.length - 1; i >= 0; i--) {
            let coin = this.coins[i];
            coin.x -= this.speed;
            if (!coin.collected && Math.abs(p.x - coin.x) < 10 && Math.abs(p.y - coin.y) < 10) {
                coin.collected = true;
                this.score += 10;
                playSnd('sel');
                // Coin particles
                for (let pi = 0; pi < 5; pi++) addParticle(coin.x, coin.y, `hsl(${40+pi*15},100%,65%)`, 'spark');
            }
            if (coin.x < -10) this.coins.splice(i, 1);
        }
    },

    drawRunner(p, ox, oy, phase, duck) {
        // ox, oy = top-left corner of the 16x20 sprite grid (or 16x12 when ducking)
        const S = 2; // pixel scale: each "dot" = 2x2 px
        function px(col, row, w, h) {
            ctx.fillRect(ox + col * S, oy + row * S, (w||1)*S, (h||1)*S);
        }
        if (duck) {
            // === DUCK POSE (16×6 dots = 12px tall) ===
            // Helmet
            ctx.fillStyle = '#0ff';
            px(2,0,4,1); px(1,1,6,1); px(1,2,6,1);
            // Visor
            ctx.fillStyle = '#fff';
            px(3,1,1,1); px(4,1,2,1);
            ctx.fillStyle = '#08f';
            px(5,1,1,1);
            // Outline
            ctx.fillStyle = '#000';
            px(1,0,1,1); px(6,0,1,1); px(0,1,1,1); px(7,1,1,1);
            px(0,2,1,1); px(7,2,1,1);
            // Body (crouched flat)
            ctx.fillStyle = '#0ff';
            px(1,3,6,1); px(1,4,6,1);
            // White stripe
            ctx.fillStyle = '#fff';
            px(3,3,2,1);
            // Body outline
            ctx.fillStyle = '#000';
            px(0,3,1,2); px(7,3,1,2); px(1,5,6,1);
            // Legs (flat/crouching)
            ctx.fillStyle = '#08f';
            px(1,5,3,1); px(4,5,3,1);
            ctx.fillStyle = '#000';
            px(0,5,1,1); px(7,5,1,1);
        } else {
            // === STANDING / RUN SPRITE (16×10 dots = 20px tall) ===
            // --- Helmet (rows 0-3) ---
            ctx.fillStyle = '#0ff';
            px(2,0,4,1); px(1,1,6,1); px(1,2,6,1); px(2,3,4,1);
            // Visor band (white highlight left, cyan mid, blue right)
            ctx.fillStyle = '#fff';
            px(2,1,2,2);
            ctx.fillStyle = '#5ef';
            px(4,1,2,2);
            ctx.fillStyle = '#08f';
            px(6,1,1,2);
            // Helmet outline
            ctx.fillStyle = '#000';
            px(1,0,1,1); px(6,0,1,1);
            px(0,1,1,2); px(7,1,1,2);
            px(1,3,1,1); px(6,3,1,1);
            // --- Neck connector ---
            ctx.fillStyle = '#0ff';
            px(3,4,2,1);
            ctx.fillStyle = '#000';
            px(2,4,1,1); px(5,4,1,1);
            // --- Torso (rows 5-6) ---
            ctx.fillStyle = '#0ff';
            px(1,5,6,1); px(1,6,6,1);
            // White chest stripe
            ctx.fillStyle = '#fff';
            px(3,5,2,1);
            // Dark shoulder accents
            ctx.fillStyle = '#08f';
            px(1,5,1,2); px(6,5,1,2);
            // Torso outline
            ctx.fillStyle = '#000';
            px(0,5,1,2); px(7,5,1,2); px(1,7,6,1);
            // --- Arm (left side only, row 5-6) ---
            ctx.fillStyle = '#0ff';
            px(0,5,1,2);
            // Already covered by outline above; arm hint:
            ctx.fillStyle = '#08f';
            px(8,5,1,2);
            ctx.fillStyle = '#000';
            px(9,5,1,2);
            // --- Hip ---
            ctx.fillStyle = '#08f';
            px(2,7,4,1);
            ctx.fillStyle = '#000';
            px(1,7,1,1); px(6,7,1,1);

            // --- Legs/feet: 4-frame run animation ---
            // phase 0,1 = right leg forward; phase 2,3 = left leg forward
            ctx.fillStyle = '#0ff';
            ctx.fillStyle = '#08f';
            if (phase === 0) {
                // Left leg back-swing, right leg forward-plant
                ctx.fillStyle = '#08f';
                px(1,8,2,1); px(1,9,2,1); // left leg (back, flat)
                px(4,8,2,1); px(5,9,2,1); // right leg (forward, step down)
                ctx.fillStyle = '#0ff';
                px(5,9,1,1); // right foot highlight
                ctx.fillStyle = '#000';
                px(0,8,1,2); px(3,8,1,1); px(3,9,1,1); // outlines
                px(6,9,1,1);
            } else if (phase === 1) {
                // Both legs mid-stride
                ctx.fillStyle = '#08f';
                px(2,8,2,1); px(2,9,2,1);
                px(4,8,2,1); px(4,9,2,1);
                ctx.fillStyle = '#000';
                px(1,8,1,2); px(4,8,1,1); px(6,9,1,1);
            } else if (phase === 2) {
                // Left leg forward-plant, right leg back-swing
                ctx.fillStyle = '#08f';
                px(2,8,2,1); px(1,9,2,1); // left leg forward
                px(5,8,2,1); px(5,9,2,1); // right leg back
                ctx.fillStyle = '#0ff';
                px(1,9,1,1); // left foot highlight
                ctx.fillStyle = '#000';
                px(0,9,1,1); px(3,9,1,1);
                px(7,8,1,2);
            } else {
                // Mirror of phase 1
                ctx.fillStyle = '#08f';
                px(2,8,2,1); px(2,9,2,1);
                px(4,8,2,1); px(4,9,2,1);
                ctx.fillStyle = '#000';
                px(1,8,1,2); px(4,8,1,1); px(6,9,1,1);
            }
        }
    },

    drawPlayer(p) {
        let ph = p.duck ? 12 : 20;
        let py = p.y - ph;

        // Speed glow (maintained from original)
        let spdNorm = Math.max(0, (this.speed - 2.5) / 3.5);
        if (spdNorm > 0) {
            let gHue = 200 - spdNorm * 200; // blue→red
            ctx.shadowBlur = spdNorm * 18;
            ctx.shadowColor = `hsl(${gHue},100%,60%)`;
        }

        // Run phase (4-frame cycle, only when on ground)
        let phase = p.onGround ? (Math.floor(this.tmr / 5) % 4) : 0;

        // Draw the detailed pixel-art sprite
        this.drawRunner(p, p.x - 8, py, phase, p.duck);

        ctx.shadowBlur = 0;
    },

    drawBuildings(offsetX, floorY) {
        let bOff = ((offsetX % (16*28)) + 16*28) % (16*28);
        for (let i = 0; i < 18; i++) {
            let b = this.buildings[i % this.buildings.length];
            let bx = ((b.x - bOff) % (16*28) + 16*28) % (16*28) - 28;
            ctx.fillStyle = '#0a0820';
            ctx.fillRect(bx, floorY - b.h, b.w, b.h);
            // Windows
            for (let wy = floorY - b.h + 4; wy < floorY - 4; wy += 7) {
                for (let wx = bx + 2; wx < bx + b.w - 2; wx += 5) {
                    if ((i + Math.floor(wx/5) + Math.floor(wy/7)) % 3 !== 0) {
                        ctx.fillStyle = 'rgba(255,240,80,0.35)';
                        ctx.fillRect(wx, wy, 2, 2);
                    }
                }
            }
        }
    },

    draw() {
        ctx.fillStyle = '#050518'; ctx.fillRect(0, 0, 200, 300);

        // Scrolling background grid
        ctx.strokeStyle = 'rgba(0,80,200,0.1)'; ctx.lineWidth = 1;
        let bx = ((this.bgX % 30) + 30) % 30;
        for (let x = -30 + bx; x < 210; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke(); }
        for (let y = 0; y < 300; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(200, y); ctx.stroke(); }

        if (this.st === 'title') {
            // Building silhouettes scrolling
            this.drawBuildings(this.titleBgX, 250);

            ctx.textAlign = 'center';
            // Slide-in animation
            let ta = Math.min(this.titleAnim, 30);
            let offTurbo = ta < 15 ? -200 + (ta/15)*200 : 0;
            let offDash  = ta < 15 ? 200 - (ta/15)*200 : 0;
            ctx.shadowBlur = 14; ctx.shadowColor = '#0ff';
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 26px "Arial Black", sans-serif';
            ctx.fillText('TURBO', 100 + offTurbo, 100);
            ctx.shadowBlur = 14; ctx.shadowColor = '#ff4';
            ctx.fillStyle = '#ff4';
            ctx.fillText('DASH', 100 + offDash, 135);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#888'; ctx.font = '9px monospace';
            ctx.fillText('A: ジャンプ（2段可）  ↓: しゃがみ', 100, 168);
            ctx.fillStyle = '#555'; ctx.fillText('BEST: '+this.best, 100, 186);
            if (this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('PRESS [A] TO START', 100, 234);
            }
            ctx.textAlign = 'left';
            return;
        }

        // Building silhouettes (parallax)
        this.drawBuildings(this.bgBuilding, this.FLOOR_Y);

        // Speed lines
        if (this.speed > 4.0) {
            let intensity = (this.speed - 4.0) * 0.18;
            ctx.strokeStyle = `rgba(255,255,255,${intensity})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 12; i++) {
                let ly = 80 + Math.floor(Math.random()*180);
                let llen = 20 + Math.floor(Math.random()*40);
                ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(llen, ly); ctx.stroke();
            }
            ctx.lineWidth = 1;
        }

        // Ground
        ctx.fillStyle = '#162850';
        ctx.fillRect(0, this.FLOOR_Y, 200, 300 - this.FLOOR_Y);
        ctx.fillStyle = '#4af'; ctx.fillRect(0, this.FLOOR_Y, 200, 2);

        // コイン
        for (let coin of this.coins) {
            if (coin.collected) continue;
            ctx.fillStyle = `hsl(${(this.tmr * 8) % 360}, 100%, 65%)`;
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '6px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('$', coin.x, coin.y + 2);
            ctx.textAlign = 'left';
        }

        // 障害物
        for (let obs of this.obstacles) {
            ctx.fillStyle = obs.col;
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            ctx.fillStyle = '#000';
            // 棘模様
            for (let i = 0; i < Math.floor(obs.h / 8); i++) {
                ctx.fillRect(obs.x + 2, obs.y + i * 8 + 2, obs.w - 4, 2);
            }
        }

        // プレイヤー
        if (!this.p.dead) this.drawPlayer(this.p);

        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 300);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f44'; ctx.font = 'bold 22px "Arial Black", sans-serif';
            ctx.shadowBlur = 10; ctx.shadowColor = '#f44';
            ctx.fillText('GAME OVER', 100, 110);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 148);
            ctx.fillStyle = this.score >= this.best ? '#ff4' : '#888';
            ctx.font = '11px monospace';
            ctx.fillText(`BEST: ${this.best}`, 100, 172);
            if (this.tmr > 90 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] RETRY', 100, 220);
            }
            ctx.textAlign = 'left';
            return;
        }

        // HUD
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`DIST: ${this.dist}`, 5, 16);
        ctx.fillStyle = '#ff4'; ctx.textAlign = 'right';
        ctx.fillText(`SCORE: ${this.score + this.dist}`, 195, 16);
        ctx.textAlign = 'left';

        // スピードメーター
        ctx.fillStyle = '#222'; ctx.fillRect(5, 22, 80, 5);
        let spd = (this.speed - 2.5) / 3.5;
        ctx.fillStyle = `hsl(${120 - spd * 120}, 100%, 50%)`;
        ctx.fillRect(5, 22, 80 * spd, 5);
        ctx.fillStyle = '#888'; ctx.font = '8px monospace';
        ctx.fillText(`SPD`, 90, 27);
    }
};
