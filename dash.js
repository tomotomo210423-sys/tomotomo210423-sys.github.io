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

    drawPlayer(p) {
        let ph = p.duck ? 12 : 20;
        let py = p.y - ph;
        // Speed glow
        let spdNorm = Math.max(0, (this.speed - 2.5) / 3.5);
        if (spdNorm > 0) {
            let gHue = 200 - spdNorm * 200; // blue→red
            ctx.shadowBlur = spdNorm * 18;
            ctx.shadowColor = `hsl(${gHue},100%,60%)`;
        }
        // Body
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x - 8, py, 16, ph);
        ctx.shadowBlur = 0;
        // 頭
        if (!p.duck) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(p.x - 5, py - 8, 10, 8);
            // 目
            ctx.fillStyle = '#000';
            ctx.fillRect(p.x - 3, py - 6, 3, 3);
            ctx.fillRect(p.x + 1, py - 6, 3, 3);
        }
        // 足（走りアニメ）
        if (p.onGround) {
            let phase = Math.floor(this.tmr / 4) % 4;
            ctx.fillStyle = '#08f';
            if (phase < 2) {
                ctx.fillRect(p.x - 6, p.y, 5, 5);
                ctx.fillRect(p.x + 2, p.y - 3, 5, 3);
            } else {
                ctx.fillRect(p.x - 6, p.y - 3, 5, 3);
                ctx.fillRect(p.x + 2, p.y, 5, 5);
            }
        }
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
