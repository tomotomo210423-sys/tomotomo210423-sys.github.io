// === GALAXY BREAK — 4-Chapter Story Adventure ===

const GalaxyBreak = {
    st: 'title', // title|story|ch1_pipe|ch2_race|ch3_mine|ch4_boss|ending|gameover
    tmr: 0,
    chapter: 0,   // 0=prologue,1,2,3,4
    lives: 3,
    score: 0,
    best: 0,
    storyIdx: 0,
    storyChar: 0,
    storyLines: [],

    STORIES: [
        // After title → CH1
        [
            { c:'NOVA',  t:'宇宙船AIです。ワープドライブが故障しました。パイプを繋いでエネルギーを修復して！' },
            { c:'PILOT', t:'了解。パイプパズルで修理するぞ！（Aで回転、十字キーで移動）' }
        ],
        // After CH1 → CH2
        [
            { c:'NOVA',  t:'ワープ成功！でも小惑星帯に突入してしまいました！' },
            { c:'PILOT', t:'全速前進！避けながら燃料を回収する！（左右で回避）' }
        ],
        // After CH2 → CH3
        [
            { c:'NOVA',  t:'惑星Ωに不時着。帰還のため10個のクリスタルを採掘してください。' },
            { c:'PILOT', t:'任せろ！（十字キーで移動、Aで隣接マスを掘る）' }
        ],
        // After CH3 → CH4
        [
            { c:'NOVA',  t:'敵帝国艦が接近！このままでは撃墜されます！' },
            { c:'PILOT', t:'迎撃する！（左右で回避、A連打で反撃！）' }
        ],
        // After CH4 → ending
        [
            { c:'PILOT', t:'やった！敵艦を撃破した！帰還ルートが開いたぞ！' },
            { c:'NOVA',  t:'全員無事。ミッション完了です。お疲れ様でした、パイロット。' }
        ]
    ],

    // ─── CH1: PIPE PUZZLE ───
    PIPE_SZ: 5, // 5×5 grid
    PIPE_CELL: 32,
    pipes: [],
    pipeCur: { x: 0, y: 0 },
    pipeTimer: 0,
    PIPE_TIME: 3600, // 60 seconds

    PIPE_TYPES: [
        // [up, right, down, left] openings
        { conn: [1,1,0,0], name: 'bend'  },  // 0
        { conn: [1,0,0,1], name: 'bend'  },  // 1
        { conn: [0,0,1,1], name: 'bend'  },  // 2
        { conn: [0,1,1,0], name: 'bend'  },  // 3
        { conn: [1,0,1,0], name: 'strait'},  // 4  vertical
        { conn: [0,1,0,1], name: 'strait'},  // 5  horizontal
        { conn: [1,1,0,1], name: 'T'    },  // 6
        { conn: [1,1,1,0], name: 'T'    },  // 7
        { conn: [0,1,1,1], name: 'T'    },  // 8
        { conn: [1,0,1,1], name: 'T'    },  // 9
        { conn: [1,1,1,1], name: 'cross'},  // 10
    ],

    initCh1() {
        const SZ = this.PIPE_SZ;
        this.pipes = [];
        for (let y = 0; y < SZ; y++) {
            this.pipes[y] = [];
            for (let x = 0; x < SZ; x++) {
                this.pipes[y][x] = { type: Math.floor(Math.random() * this.PIPE_TYPES.length), water: false };
            }
        }
        // Force source at (0,2) facing right and sink at (4,2) facing left
        this.pipes[2][0] = { type: 5, water: false, fixed: true }; // horizontal (source)
        this.pipes[2][4] = { type: 5, water: false, fixed: true }; // horizontal (sink)
        this.pipeCur = { x: 1, y: 2 };
        this.pipeTimer = this.PIPE_TIME;
        this.pipeWin = false;
        if (typeof BGM !== 'undefined') BGM.play('puzzle');
    },

    rotatePipe(x, y) {
        if (this.pipes[y][x].fixed) return;
        let t = this.pipes[y][x].type;
        // Cycle through type groups: bends(0-3), straits(4-5), T(6-9), cross(10)
        if (t >= 0 && t <= 3) t = (t + 1) % 4;
        else if (t >= 4 && t <= 5) t = t === 4 ? 5 : 4;
        else if (t >= 6 && t <= 9) t = 6 + (t - 6 + 1) % 4;
        // cross stays cross
        this.pipes[y][x].type = t;
    },

    checkPipeWin() {
        const SZ = this.PIPE_SZ;
        // BFS/flood from source (0,2) going right
        let visited = Array.from({length: SZ}, () => new Array(SZ).fill(false));
        let queue = [{ x: 0, y: 2, from: 3 }]; // came from left
        visited[2][0] = true;
        const dirs = [{dx:0,dy:-1,out:0,in:2},{dx:1,dy:0,out:1,in:3},{dx:0,dy:1,out:2,in:0},{dx:-1,dy:0,out:3,in:1}];
        while (queue.length) {
            let { x, y, from } = queue.shift();
            let conn = this.PIPE_TYPES[this.pipes[y][x].type].conn;
            for (let i = 0; i < 4; i++) {
                if (i === from) continue; // don't go back
                if (!conn[i]) continue;
                let nx = x + dirs[i].dx, ny = y + dirs[i].dy;
                if (nx < 0 || nx >= SZ || ny < 0 || ny >= SZ) continue;
                if (visited[ny][nx]) continue;
                let nc = this.PIPE_TYPES[this.pipes[ny][nx].type].conn;
                if (!nc[dirs[i].in]) continue; // neighbor doesn't connect back
                visited[ny][nx] = true;
                if (nx === 4 && ny === 2) return true; // reached sink!
                queue.push({ x: nx, y: ny, from: dirs[i].in });
            }
        }
        return false;
    },

    updateCh1() {
        this.pipeTimer--;
        if (this.pipeTimer <= 0) { this.lives--; this.triggerGameOver(); return; }

        if (keysDown.up)    this.pipeCur.y = Math.max(0, this.pipeCur.y - 1);
        if (keysDown.down)  this.pipeCur.y = Math.min(this.PIPE_SZ - 1, this.pipeCur.y + 1);
        if (keysDown.left)  this.pipeCur.x = Math.max(0, this.pipeCur.x - 1);
        if (keysDown.right) this.pipeCur.x = Math.min(this.PIPE_SZ - 1, this.pipeCur.x + 1);
        if (keysDown.a) {
            this.rotatePipe(this.pipeCur.x, this.pipeCur.y);
            if (typeof playSnd !== 'undefined') playSnd('sel');
            if (this.checkPipeWin()) {
                if (typeof playSnd !== 'undefined') playSnd('combo');
                this.score += Math.floor(this.pipeTimer / 60) * 10;
                this.nextChapter();
            }
        }
    },

    drawCh1() {
        ctx.fillStyle = '#001122'; ctx.fillRect(0, 0, 200, 300);
        const SZ = this.PIPE_SZ, CS = this.PIPE_CELL;
        const ox = (200 - SZ * CS) / 2, oy = 50;

        // Grid background
        for (let y = 0; y < SZ; y++) {
            for (let x = 0; x < SZ; x++) {
                let px = ox + x * CS, py = oy + y * CS;
                ctx.fillStyle = '#0a1a2a';
                ctx.fillRect(px + 1, py + 1, CS - 2, CS - 2);
                let p = this.pipes[y][x];
                let conn = this.PIPE_TYPES[p.type].conn;
                let pcx = px + CS / 2, pcy = py + CS / 2;
                let col = p.fixed ? '#0ff' : '#28f';
                ctx.strokeStyle = col; ctx.lineWidth = 4;
                const dirs2 = [[0,-CS/2],[CS/2,0],[0,CS/2],[-CS/2,0]];
                for (let i = 0; i < 4; i++) {
                    if (conn[i]) {
                        ctx.beginPath(); ctx.moveTo(pcx, pcy);
                        ctx.lineTo(pcx + dirs2[i][0], pcy + dirs2[i][1]); ctx.stroke();
                    }
                }
                // Center dot
                ctx.fillStyle = col; ctx.beginPath(); ctx.arc(pcx, pcy, 4, 0, Math.PI * 2); ctx.fill();
                // Cursor
                if (x === this.pipeCur.x && y === this.pipeCur.y) {
                    ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2;
                    ctx.strokeRect(px + 2, py + 2, CS - 4, CS - 4);
                }
            }
        }
        // Source/Sink markers
        ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
        ctx.fillText('IN', ox - 20, oy + 2 * CS + CS / 2 + 4);
        ctx.fillText('OUT', ox + SZ * CS + 4, oy + 2 * CS + CS / 2 + 4);

        // HUD
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
        ctx.fillText('CH1: PIPE REPAIR', 10, 20);
        ctx.fillStyle = '#ff0';
        ctx.fillText(`TIME: ${Math.ceil(this.pipeTimer / 60)}s`, 120, 20);
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
        ctx.fillText('A:回転  十字:移動', 50, 270);
        this.drawHUD();
    },

    // ─── CH2: GRAVITY RACER ───
    ship: { x: 100, y: 240, vx: 0 },
    obstacles: [],
    fuel: 100,
    raceTimer: 0,
    RACE_TIME: 1800, // 30 sec
    scrollY: 0,

    initCh2() {
        this.ship = { x: 100, y: 240, vx: 0 };
        this.obstacles = [];
        this.fuel = 100;
        this.raceTimer = this.RACE_TIME;
        this.scrollY = 0;
        this.raceWin = false;
        if (typeof BGM !== 'undefined') BGM.play('action');
        for (let i = 0; i < 8; i++) this.spawnObstacle(i * 40);
    },

    spawnObstacle(yOff) {
        let t = Math.random() < 0.25 ? 'fuel' : 'rock';
        let x = 20 + Math.random() * 160;
        let y = -(yOff + 20 + Math.random() * 60);
        this.obstacles.push({ x, y, t, r: t === 'fuel' ? 8 : 10 + Math.random() * 8 });
    },

    updateCh2() {
        this.raceTimer--;
        if (this.raceTimer <= 0) {
            this.score += 200;
            this.nextChapter(); return;
        }
        this.scrollY += 2 + (1 - this.raceTimer / this.RACE_TIME) * 2;

        // Ship movement
        let spd = 3;
        if (keys.left)  this.ship.vx -= 0.5;
        if (keys.right) this.ship.vx += 0.5;
        if (keys.a)     this.ship.vx *= 1.05; // boost
        this.ship.vx *= 0.85;
        this.ship.x = Math.max(10, Math.min(190, this.ship.x + this.ship.vx));

        // Move obstacles down
        for (let o of this.obstacles) o.y += 2 + (1 - this.raceTimer / this.RACE_TIME) * 2;

        // Spawn new
        let minY = Math.min(...this.obstacles.map(o => o.y));
        while (minY > -200) {
            this.spawnObstacle(200);
            this.obstacles = this.obstacles.filter(o => o.y < 350);
            minY = Math.min(...this.obstacles.map(o => o.y));
        }

        // Collision
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            let o = this.obstacles[i];
            if (Math.hypot(this.ship.x - o.x, this.ship.y - o.y) < o.r + 8) {
                if (o.t === 'fuel') {
                    this.fuel = Math.min(100, this.fuel + 30);
                    if (typeof playSnd !== 'undefined') playSnd('combo');
                } else {
                    this.fuel = Math.max(0, this.fuel - 20);
                    if (typeof screenShake !== 'undefined') screenShake(5);
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                }
                this.obstacles.splice(i, 1);
            }
        }
        if (this.fuel <= 0) { this.lives--; this.triggerGameOver(); }
    },

    drawCh2() {
        // Starfield
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 30; i++) {
            let sx = (i * 71 + this.scrollY * 0.3) % 200;
            let sy = (i * 53 + this.scrollY) % 300;
            ctx.fillRect(sx, sy, 1, 1);
        }
        // Obstacles
        for (let o of this.obstacles) {
            if (o.y < -20 || o.y > 310) continue;
            if (o.t === 'fuel') {
                ctx.fillStyle = '#0af';
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
                ctx.fillText('⚡', o.x - 5, o.y + 3);
            } else {
                ctx.fillStyle = '#888';
                ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#444';
                ctx.beginPath(); ctx.arc(o.x - 2, o.y - 2, o.r * 0.4, 0, Math.PI * 2); ctx.fill();
            }
        }
        // Ship pixel art (8×6 triangle-ish)
        let sx = this.ship.x, sy = this.ship.y;
        ctx.fillStyle = '#0ff';
        ctx.beginPath(); ctx.moveTo(sx, sy - 12); ctx.lineTo(sx - 8, sy + 8); ctx.lineTo(sx + 8, sy + 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(sx, sy - 8); ctx.lineTo(sx - 4, sy + 4); ctx.lineTo(sx + 4, sy + 4); ctx.closePath(); ctx.fill();
        // Thruster flame
        if (this.tmr % 6 < 3) {
            ctx.fillStyle = '#fa0';
            ctx.beginPath(); ctx.moveTo(sx - 4, sy + 8); ctx.lineTo(sx, sy + 16); ctx.lineTo(sx + 4, sy + 8); ctx.closePath(); ctx.fill();
        }
        // HUD
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
        ctx.fillText('CH2: ASTEROID FIELD', 5, 18);
        ctx.fillStyle = '#ff0';
        ctx.fillText(`TIME: ${Math.ceil(this.raceTimer / 60)}s`, 130, 18);
        // Fuel bar
        ctx.fillStyle = '#333'; ctx.fillRect(5, 25, 100, 7);
        ctx.fillStyle = this.fuel > 30 ? '#0af' : '#f00';
        ctx.fillRect(5, 25, this.fuel, 7);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('FUEL', 110, 31);
        this.drawHUD();
    },

    // ─── CH3: STAR MINER ───
    MINE_W: 15, MINE_H: 18,
    mineGrid: [],
    miner: { x: 7, y: 0 },
    mineEnemies: [],
    crystals: 0,
    TARGET_CRYSTALS: 10,

    initCh3() {
        const W = this.MINE_W, H = this.MINE_H;
        this.mineGrid = [];
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                let r = Math.random();
                // 0=empty, 1=wall, 2=crystal
                this.mineGrid.push(y === 0 ? 0 : r < 0.3 ? 1 : r < 0.55 ? 2 : 0);
            }
        }
        this.miner = { x: 7, y: 0 };
        this.mineEnemies = [];
        this.crystals = 0;
        this.mineTimer = 0;
        this.mineMoveDelay = 0;
        if (typeof BGM !== 'undefined') BGM.play('dungeon');
    },

    mineTile(x, y) { return this.mineGrid[y * this.MINE_W + x]; },
    mineSet(x, y, v) { this.mineGrid[y * this.MINE_W + x] = v; },

    updateCh3() {
        this.mineTimer++;
        if (this.mineMoveDelay > 0) { this.mineMoveDelay--; return; }
        this.mineMoveDelay = 8;

        let dx = 0, dy = 0;
        if (keys.left) dx = -1;
        else if (keys.right) dx = 1;
        else if (keys.up) dy = -1;
        else if (keys.down) dy = 1;

        if (dx !== 0 || dy !== 0) {
            let nx = this.miner.x + dx, ny = this.miner.y + dy;
            if (nx >= 0 && nx < this.MINE_W && ny >= 0 && ny < this.MINE_H) {
                let t = this.mineTile(nx, ny);
                if (t === 0) { this.miner.x = nx; this.miner.y = ny; }
            }
        }

        if (keysDown.a) {
            // Mine adjacent cells
            [[0,-1],[1,0],[0,1],[-1,0]].forEach(([ddx, ddy]) => {
                let nx = this.miner.x + ddx, ny = this.miner.y + ddy;
                if (nx < 0 || nx >= this.MINE_W || ny < 0 || ny >= this.MINE_H) return;
                let t = this.mineTile(nx, ny);
                if (t === 2) {
                    this.mineSet(nx, ny, 0);
                    this.crystals++;
                    this.score += 30;
                    if (typeof playSnd !== 'undefined') playSnd('combo');
                    if (typeof addParticle !== 'undefined') addParticle(80 + nx * 8, 40 + ny * 8, '#0ff', 'spark');
                    if (this.crystals === 5 && this.mineEnemies.length === 0) {
                        this.mineEnemies.push({ x: Math.floor(Math.random() * this.MINE_W), y: this.MINE_H - 1 });
                        if (typeof BGM !== 'undefined') BGM.play('boss');
                    }
                } else if (t === 1) {
                    this.mineSet(nx, ny, 0);
                    if (typeof playSnd !== 'undefined') playSnd('sel');
                }
            });
        }

        // Enemy AI
        if (this.mineTimer % 16 === 0) {
            for (let e of this.mineEnemies) {
                let dx2 = Math.sign(this.miner.x - e.x);
                let dy2 = Math.sign(this.miner.y - e.y);
                let nx = e.x + (Math.abs(dx2) >= Math.abs(dy2) ? dx2 : 0);
                let ny = e.y + (Math.abs(dy2) > Math.abs(dx2) ? dy2 : 0);
                if (nx >= 0 && nx < this.MINE_W && ny >= 0 && ny < this.MINE_H && this.mineTile(nx, ny) !== 1) {
                    e.x = nx; e.y = ny;
                }
                if (e.x === this.miner.x && e.y === this.miner.y) {
                    this.lives--; this.triggerGameOver(); return;
                }
            }
        }

        if (this.crystals >= this.TARGET_CRYSTALS) {
            this.score += 300;
            this.nextChapter();
        }
    },

    drawCh3() {
        ctx.fillStyle = '#110a00'; ctx.fillRect(0, 0, 200, 300);
        const CW = 11, CH = 11;
        const ox = (200 - this.MINE_W * CW) / 2, oy = 40;
        // Grid
        for (let y = 0; y < this.MINE_H; y++) {
            for (let x = 0; x < this.MINE_W; x++) {
                let t = this.mineTile(x, y);
                let px = ox + x * CW, py = oy + y * CH;
                if (t === 1) {
                    ctx.fillStyle = '#553311'; ctx.fillRect(px, py, CW - 1, CH - 1);
                    ctx.fillStyle = '#664422'; ctx.fillRect(px, py, CW - 1, 2);
                } else if (t === 2) {
                    let glow = 0.5 + 0.5 * Math.sin(this.tmr * 0.15 + x + y);
                    ctx.fillStyle = `rgba(0,${Math.floor(180 + 75 * glow)},255,1)`;
                    ctx.fillRect(px + 1, py + 1, CW - 3, CH - 3);
                } else {
                    ctx.fillStyle = '#221100'; ctx.fillRect(px, py, CW - 1, CH - 1);
                }
            }
        }
        // Enemies
        for (let e of this.mineEnemies) {
            let px = ox + e.x * CW + 1, py = oy + e.y * CH + 1;
            ctx.fillStyle = '#f00'; ctx.fillRect(px, py, CW - 3, CH - 3);
            ctx.fillStyle = '#ff0'; ctx.fillRect(px + 2, py + 1, 2, 2); ctx.fillRect(px + 5, py + 1, 2, 2);
        }
        // Miner
        let mpx = ox + this.miner.x * CW, mpy = oy + this.miner.y * CH;
        ctx.fillStyle = '#0f0'; ctx.fillRect(mpx + 1, mpy + 1, CW - 3, CH - 3);
        ctx.fillStyle = '#fff'; ctx.fillRect(mpx + 3, mpy + 2, 2, 2); ctx.fillRect(mpx + 6, mpy + 2, 2, 2);
        // HUD
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace';
        ctx.fillText('CH3: STAR MINER', 5, 15);
        ctx.fillStyle = '#0ff';
        ctx.fillText(`CRYSTAL: ${this.crystals}/${this.TARGET_CRYSTALS}`, 5, 27);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
        ctx.fillText('A:掘る 十字:移動', 100, 27);
        this.drawHUD();
    },

    // ─── CH4: BOSS BATTLE ───
    boss: { hp: 80, maxHp: 80, x: 100, y: 60, phase: 1, shotTimer: 0, moveDir: 1 },
    playerShip: { x: 100, y: 240, vx: 0, shotCd: 0 },
    bossPhase: 1,
    bBullets: [],   // boss bullets
    pBullets: [],   // player bullets
    bossTimer: 0,

    initCh4() {
        this.boss = { hp: 80, maxHp: 80, x: 100, y: 60, phase: 1, shotTimer: 0, moveDir: 1 };
        this.playerShip = { x: 100, y: 240, vx: 0, shotCd: 0 };
        this.bBullets = [];
        this.pBullets = [];
        this.bossTimer = 0;
        if (typeof BGM !== 'undefined') BGM.play('boss');
    },

    updateCh4() {
        this.bossTimer++;
        let bs = this.boss, ps = this.playerShip;
        let phase = bs.hp > 40 ? 1 : (bs.hp > 15 ? 2 : 3);
        if (phase !== bs.phase) {
            bs.phase = phase;
            if (typeof screenShake !== 'undefined') screenShake(8);
        }

        // Boss movement
        bs.x += bs.moveDir * (1 + phase * 0.5);
        if (bs.x < 30 || bs.x > 170) bs.moveDir *= -1;

        // Boss shooting
        bs.shotTimer++;
        let shotRate = phase === 1 ? 60 : (phase === 2 ? 40 : 25);
        if (bs.shotTimer >= shotRate) {
            bs.shotTimer = 0;
            let angles = phase === 1 ? [Math.PI / 2] : (phase === 2 ? [Math.PI / 2 - 0.3, Math.PI / 2, Math.PI / 2 + 0.3] : [Math.PI / 2 - 0.5, Math.PI / 2 - 0.2, Math.PI / 2, Math.PI / 2 + 0.2, Math.PI / 2 + 0.5]);
            for (let a of angles) {
                this.bBullets.push({ x: bs.x, y: bs.y + 20, vx: Math.cos(a) * 0, vy: 3 + phase, a });
                let bv = 2.5 + phase * 0.5;
                this.bBullets[this.bBullets.length - 1].vx = Math.cos(a - Math.PI / 2) * bv;
                this.bBullets[this.bBullets.length - 1].vy = Math.sin(a - Math.PI / 2 + Math.PI / 2) * bv;
            }
            if (typeof playSnd !== 'undefined') playSnd('hit');
        }

        // Player movement
        if (keys.left)  ps.vx -= 0.6;
        if (keys.right) ps.vx += 0.6;
        ps.vx *= 0.82;
        ps.x = Math.max(10, Math.min(190, ps.x + ps.vx));

        // Player shooting
        if (ps.shotCd > 0) ps.shotCd--;
        if (keys.a && ps.shotCd <= 0) {
            this.pBullets.push({ x: ps.x, y: ps.y - 10, vy: -7 });
            ps.shotCd = 8;
            if (typeof playSnd !== 'undefined') playSnd('sel');
        }

        // Move bullets
        for (let b of this.bBullets) { b.x += b.vx; b.y += b.vy; }
        for (let b of this.pBullets) b.y += b.vy;

        // Boss hit
        this.pBullets = this.pBullets.filter(b => {
            if (b.y < -10) return false;
            if (Math.abs(b.x - bs.x) < 25 && Math.abs(b.y - bs.y) < 20) {
                bs.hp -= 5;
                this.score += 10;
                if (typeof addParticle !== 'undefined') addParticle(bs.x, bs.y, '#f80', 'spark');
                return false;
            }
            return true;
        });

        // Player hit by boss bullets
        this.bBullets = this.bBullets.filter(b => {
            if (b.y > 310 || b.x < -10 || b.x > 210) return false;
            if (Math.hypot(b.x - ps.x, b.y - ps.y) < 12) {
                this.lives--;
                if (typeof screenShake !== 'undefined') screenShake(10);
                if (typeof playSnd !== 'undefined') playSnd('hit');
                if (this.lives <= 0) this.triggerGameOver();
                return false;
            }
            return true;
        });

        if (bs.hp <= 0) {
            this.score += 500;
            for (let i = 0; i < 20; i++) {
                if (typeof addParticle !== 'undefined') addParticle(bs.x + (Math.random()-0.5)*40, bs.y + (Math.random()-0.5)*30, '#fa0', 'explosion');
            }
            this.nextChapter();
        }
    },

    drawCh4() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
        // Stars
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 25; i++) ctx.fillRect((i * 83) % 200, (i * 61 + this.bossTimer) % 300, 1, 1);

        let bs = this.boss;
        // Boss body
        let bc = bs.phase === 1 ? '#f80' : (bs.phase === 2 ? '#f44' : '#f0f');
        ctx.fillStyle = bc;
        ctx.fillRect(bs.x - 24, bs.y - 16, 48, 32);
        ctx.fillStyle = '#300';
        ctx.fillRect(bs.x - 18, bs.y - 10, 36, 20);
        // Boss eyes
        ctx.fillStyle = '#f00';
        ctx.beginPath(); ctx.arc(bs.x - 8, bs.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(bs.x + 8, bs.y, 5, 0, Math.PI * 2); ctx.fill();
        if (this.bossTimer % 30 < 15) { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(bs.x - 8, bs.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(bs.x + 8, bs.y, 2, 0, Math.PI * 2); ctx.fill(); }
        // Boss HP bar
        ctx.fillStyle = '#400'; ctx.fillRect(10, 30, 180, 8);
        ctx.fillStyle = bc;
        ctx.fillRect(10, 30, 180 * (bs.hp / bs.maxHp), 8);

        // Player ship
        let ps = this.playerShip;
        ctx.fillStyle = '#0ff';
        ctx.beginPath(); ctx.moveTo(ps.x, ps.y - 12); ctx.lineTo(ps.x - 8, ps.y + 8); ctx.lineTo(ps.x + 8, ps.y + 8); ctx.closePath(); ctx.fill();
        if (this.bossTimer % 4 < 2) { ctx.fillStyle = '#fa0'; ctx.beginPath(); ctx.moveTo(ps.x - 4, ps.y + 8); ctx.lineTo(ps.x, ps.y + 16); ctx.lineTo(ps.x + 4, ps.y + 8); ctx.closePath(); ctx.fill(); }

        // Bullets
        ctx.fillStyle = '#f44';
        for (let b of this.bBullets) { ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#0ff';
        for (let b of this.pBullets) { ctx.fillRect(b.x - 2, b.y - 6, 4, 12); }

        // HUD
        ctx.fillStyle = '#f80'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`CH4: BOSS  PH${bs.phase}`, 5, 18);
        this.drawHUD();
    },

    // ─── COMMON ───
    drawHUD() {
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
        ctx.fillText(`SCORE:${this.score}`, 5, 290);
        ctx.fillStyle = '#f44';
        for (let i = 0; i < this.lives; i++) ctx.fillText('♥', 140 + i * 18, 290);
        ctx.fillStyle = '#fd0'; ctx.fillText(`BEST:${this.best}`, 118, 278);
    },

    nextChapter() {
        this.chapter++;
        this.st = 'story';
        this.storyIdx = this.chapter - 1;
        this.storyChar = 0;
        this.storyLines = this.STORIES[this.storyIdx] || [];
        this.storyLineIdx = 0;
        this.storyTyped = '';
        this.tmr = 0;
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    triggerGameOver() {
        this.st = 'gameover'; this.tmr = 0;
        if (this.score > this.best) {
            this.best = this.score; SaveSys.data.galaxyBest = this.best; SaveSys.save();
        }
        if (typeof BGM !== 'undefined') BGM.play('gameover');
        if (typeof screenShake !== 'undefined') screenShake(12);
    },

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0;
        this.best = SaveSys.data.galaxyBest || 0;
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    update() {
        this.tmr++;

        if (this.st === 'title') {
            if (keysDown.a) {
                this.chapter = 0; this.lives = 3; this.score = 0;
                this.nextChapter();
                if (typeof playSnd !== 'undefined') playSnd('jmp');
            }
            if (keysDown.select) { if (typeof switchApp !== 'undefined') switchApp(Menu); }
            return;
        }

        if (this.st === 'story') {
            let line = this.storyLines[this.storyLineIdx];
            if (!line) {
                // All story lines done → start next chapter
                this.tmr = 0;
                if (this.chapter === 5) { this.st = 'ending'; return; }
                if (this.chapter === 1) { this.initCh1(); this.st = 'ch1_pipe'; }
                else if (this.chapter === 2) { this.initCh2(); this.st = 'ch2_race'; }
                else if (this.chapter === 3) { this.initCh3(); this.st = 'ch3_mine'; }
                else if (this.chapter === 4) { this.initCh4(); this.st = 'ch4_boss'; }
                return;
            }
            if (this.tmr % 2 === 0 && this.storyTyped.length < line.t.length) {
                this.storyTyped += line.t[this.storyTyped.length];
            }
            if (keysDown.a) {
                if (this.storyTyped.length < line.t.length) { this.storyTyped = line.t; }
                else {
                    this.storyLineIdx++;
                    this.storyTyped = '';
                    this.tmr = 0;
                }
            }
            return;
        }

        if (this.st === 'gameover') {
            if (this.tmr > 90 && keysDown.a) { this.init(); }
            return;
        }

        if (this.st === 'ending') {
            if (this.score > this.best) {
                this.best = this.score; SaveSys.data.galaxyBest = this.best; SaveSys.save();
            }
            if (this.tmr > 120 && keysDown.a) { this.init(); }
            return;
        }

        if (this.st === 'ch1_pipe') this.updateCh1();
        else if (this.st === 'ch2_race') this.updateCh2();
        else if (this.st === 'ch3_mine') this.updateCh3();
        else if (this.st === 'ch4_boss') this.updateCh4();
    },

    draw() {
        if (this.st === 'title') {
            ctx.fillStyle = '#000012'; ctx.fillRect(0, 0, 200, 300);
            // Starfield
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 50; i++) {
                let sx = (i * 71 + this.tmr * 0.2) % 200;
                let sy = (i * 53) % 300;
                let sz = 1 + (i % 3);
                ctx.fillRect(sx, sy, sz, sz);
            }
            ctx.shadowBlur = 15; ctx.shadowColor = '#4af';
            ctx.fillStyle = '#4af'; ctx.font = 'bold 28px monospace';
            ctx.textAlign = 'center'; ctx.fillText('GALAXY', 100, 100);
            ctx.fillStyle = '#fff'; ctx.fillText('BREAK', 100, 135); ctx.shadowBlur = 0;
            ctx.fillStyle = '#888'; ctx.font = '9px monospace';
            ctx.fillText('4 CHAPTER STORY', 100, 160);
            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace';
            ctx.fillText(`BEST: ${this.best}`, 100, 185);
            if (this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('PRESS [A] TO START', 100, 220);
            }
            ctx.fillStyle = '#444'; ctx.font = '9px monospace';
            ctx.fillText('SELECT: 戻る', 100, 260);
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'story') {
            ctx.fillStyle = '#000a18'; ctx.fillRect(0, 0, 200, 300);
            // Starfield BG
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            for (let i = 0; i < 30; i++) ctx.fillRect((i * 71) % 200, (i * 53) % 300, 1, 1);

            let line = this.storyLines[this.storyLineIdx] || { c: '', t: '' };
            // Character avatar area
            ctx.fillStyle = '#0a1a2a'; ctx.fillRect(0, 0, 200, 160);
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, 198, 158);
            // Draw character icon based on name
            this.drawStoryChar(line.c, 100, 80);

            // Dialog box
            ctx.fillStyle = 'rgba(0,0,30,0.92)'; ctx.fillRect(5, 165, 190, 120);
            ctx.strokeStyle = '#4af'; ctx.lineWidth = 2; ctx.strokeRect(5, 165, 190, 120);
            ctx.fillStyle = line.c === 'PILOT' ? '#0f0' : '#0ff';
            ctx.font = 'bold 11px monospace'; ctx.fillText(`[ ${line.c} ]`, 12, 182);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            let ty = 200, tl = '';
            for (let ch of this.storyTyped) {
                tl += ch;
                if (tl.length > 18) { ctx.fillText(tl, 12, ty); ty += 16; tl = ''; }
            }
            ctx.fillText(tl, 12, ty);
            if (this.storyTyped.length === line.t.length && this.tmr % 40 < 20) {
                ctx.fillStyle = '#ff0'; ctx.fillText('▼', 180, 275);
            }
            return;
        }

        if (this.st === 'gameover') {
            ctx.fillStyle = '#1a0000'; ctx.fillRect(0, 0, 200, 300);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f00'; ctx.font = 'bold 24px monospace';
            ctx.fillText('GAME OVER', 100, 110);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 150);
            ctx.fillStyle = '#ff0'; ctx.fillText(`BEST: ${this.best}`, 100, 175);
            if (this.tmr > 90 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('A: RETRY', 100, 220);
            }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ending') {
            ctx.fillStyle = '#000012'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 40; i++) ctx.fillRect((i * 71 + this.tmr) % 200, (i * 53) % 300, 2, 2);
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20; ctx.shadowColor = '#4af';
            ctx.fillStyle = '#4af'; ctx.font = 'bold 20px monospace';
            ctx.fillText('MISSION', 100, 100);
            ctx.fillText('COMPLETE!', 100, 130); ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff0'; ctx.font = '14px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 170);
            if (this.score >= this.best) { ctx.fillStyle = '#f80'; ctx.fillText('★ NEW RECORD! ★', 100, 195); }
            if (this.tmr % 50 < 25) { ctx.fillStyle = '#0f0'; ctx.font = '11px monospace'; ctx.fillText('A: TITLE', 100, 240); }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ch1_pipe') this.drawCh1();
        else if (this.st === 'ch2_race') this.drawCh2();
        else if (this.st === 'ch3_mine') this.drawCh3();
        else if (this.st === 'ch4_boss') this.drawCh4();
    },

    drawStoryChar(name, cx, cy) {
        // Simple pixel-art character based on name
        let col = name === 'PILOT' ? '#0f0' : '#0ff';
        let col2 = name === 'PILOT' ? '#0a0' : '#048';
        // Helmet
        ctx.fillStyle = col2;
        ctx.beginPath(); ctx.arc(cx, cy - 10, 28, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(cx, cy - 10, 22, 0, Math.PI * 2); ctx.fill();
        // Visor
        ctx.fillStyle = '#001'; ctx.fillRect(cx - 14, cy - 22, 28, 16);
        ctx.strokeStyle = '#0af'; ctx.lineWidth = 2; ctx.strokeRect(cx - 14, cy - 22, 28, 16);
        // Reflection
        ctx.fillStyle = 'rgba(0,255,255,0.2)'; ctx.fillRect(cx - 10, cy - 20, 10, 6);
        // Body
        ctx.fillStyle = col2; ctx.fillRect(cx - 20, cy + 16, 40, 30);
        ctx.fillStyle = col; ctx.fillRect(cx - 14, cy + 18, 28, 22);
        // Arms
        ctx.fillStyle = col2; ctx.fillRect(cx - 30, cy + 16, 12, 22); ctx.fillRect(cx + 18, cy + 16, 12, 22);
        // Name badge
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
        ctx.fillText(name, cx, cy + 34); ctx.textAlign = 'left';
    }
};
