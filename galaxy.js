// === GALAXY BREAK — 4-Chapter Story Adventure ===
const GalaxyBreak = {
    st: 'title', tmr: 0, chapter: 0, score: 0, lives: 3,
    best: 0,

    // --- CH1: PIPE REPAIR ---
    pipes: [], pCur: { x: 0, y: 0 }, pW: 5, pH: 5, pTime: 0,

    // --- CH2: ASTEROID FIELD ---
    ship: { x: 100, y: 250 }, asteroids: [], fuel: 100, aTime: 0,

    // --- CH3: STAR MINER ---
    mGrid: [], mCur: { x: 2, y: 2 }, mW: 7, mH: 7, crystals: 0, mEnemies: [],

    // --- CH4: BOSS BATTLE ---
    bossHp: 100, bossMaxHp: 100, bossPhase: 0, bullets: [], playerBullets: [],
    bShip: { x: 100, y: 240 }, bTimer: 0,

    // --- STORY ---
    storyLines: [
        // Before CH1
        [
            '銀河連邦の探査船「NOVA」が',
            '敵帝国の罠に嵌まった。',
            'エンジンパイプが損傷！',
            '修理しなければ航行不能だ。'
        ],
        // Before CH2
        [
            'エンジン復旧！しかし、',
            '小惑星帯に突入してしまった。',
            '燃料を集めながら',
            '30秒間生き延びろ！'
        ],
        // Before CH3
        [
            '小惑星帯を突破！だが、',
            '惑星に不時着してしまった。',
            '修理用クリスタルを',
            '10個集めるのだ！'
        ],
        // Before CH4
        [
            'クリスタル確保完了！',
            '帝国艦が追ってきた！',
            '最終決戦だ。',
            '奴を撃ち落とせ！！'
        ],
        // Ending
        [
            '帝国艦撃破！！',
            '「NOVA」は銀河の平和を守った。',
            'MISSION COMPLETE!!',
            ''
        ]
    ],
    storyIdx: 0, storyLine: 0, storyChar: 0, storyTmr: 0,

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0;
        this.best = SaveSys.data.galaxyBest || 0;
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startStory(idx) {
        this.st = 'story';
        this.storyIdx = idx;
        this.storyLine = 0;
        this.storyChar = 0;
        this.storyTmr = 0;
        if (typeof BGM !== 'undefined') BGM.play('puzzle');
    },

    startChapter(ch) {
        this.chapter = ch;
        if (ch === 0) this.initPipes();
        else if (ch === 1) this.initAsteroids();
        else if (ch === 2) this.initMiner();
        else if (ch === 3) this.initBoss();
    },

    // ==================== CH1: PIPE REPAIR ====================
    initPipes() {
        this.st = 'ch1';
        this.pTime = 3600; // 60 seconds
        this.pCur = { x: 0, y: 0 };
        // Generate random pipe grid: each cell has rotation (0-3) and type (straight/elbow)
        this.pipes = [];
        for (let y = 0; y < this.pH; y++) {
            this.pipes[y] = [];
            for (let x = 0; x < this.pW; x++) {
                this.pipes[y][x] = {
                    type: Math.random() < 0.5 ? 'straight' : 'elbow',
                    rot: Math.floor(Math.random() * 4),
                    connected: false
                };
            }
        }
        // Force start/end cells
        this.pipes[0][0] = { type: 'elbow', rot: 1, connected: false };
        this.pipes[this.pH-1][this.pW-1] = { type: 'elbow', rot: 3, connected: false };
        if (typeof BGM !== 'undefined') BGM.play('puzzle');
    },

    // Returns which sides a pipe connects: array of 'up','down','left','right'
    getPipeConnections(pipe) {
        if (pipe.type === 'straight') {
            return pipe.rot % 2 === 0 ? ['left', 'right'] : ['up', 'down'];
        } else { // elbow
            const elbows = [
                ['right', 'down'],
                ['down', 'left'],
                ['left', 'up'],
                ['up', 'right']
            ];
            return elbows[pipe.rot % 4];
        }
    },

    checkPipeFlow() {
        // BFS from (0,0) to mark connected pipes
        for (let y = 0; y < this.pH; y++)
            for (let x = 0; x < this.pW; x++)
                this.pipes[y][x].connected = false;

        const opp = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const dmap = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
        const queue = [{ x: 0, y: 0 }];
        this.pipes[0][0].connected = true;
        while (queue.length) {
            let { x, y } = queue.shift();
            let conns = this.getPipeConnections(this.pipes[y][x]);
            for (let dir of conns) {
                let [dx, dy] = dmap[dir];
                let nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= this.pW || ny < 0 || ny >= this.pH) continue;
                if (this.pipes[ny][nx].connected) continue;
                let neighbor = this.getPipeConnections(this.pipes[ny][nx]);
                if (neighbor.includes(opp[dir])) {
                    this.pipes[ny][nx].connected = true;
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        return this.pipes[this.pH-1][this.pW-1].connected;
    },

    // ==================== CH2: ASTEROID FIELD ====================
    initAsteroids() {
        this.st = 'ch2';
        this.ship = { x: 100, y: 250 };
        this.asteroids = [];
        this.fuel = 100;
        this.aTime = 1800; // 30 seconds
        for (let i = 0; i < 8; i++) {
            this.asteroids.push({
                x: Math.random() * 180 + 10,
                y: -20 - Math.random() * 200,
                r: 8 + Math.random() * 12,
                spd: 1.5 + Math.random() * 2
            });
        }
        if (typeof BGM !== 'undefined') BGM.play('action');
    },

    // ==================== CH3: STAR MINER ====================
    initMiner() {
        this.st = 'ch3';
        this.crystals = 0;
        this.mCur = { x: Math.floor(this.mW / 2), y: Math.floor(this.mH / 2) };
        this.mEnemies = [];
        this.mGrid = [];
        for (let y = 0; y < this.mH; y++) {
            this.mGrid[y] = [];
            for (let x = 0; x < this.mW; x++) {
                let r = Math.random();
                this.mGrid[y][x] = r < 0.15 ? 'crystal' : (r < 0.3 ? 'rock' : 'empty');
            }
        }
        this.mGrid[this.mCur.y][this.mCur.x] = 'empty';
        if (typeof BGM !== 'undefined') BGM.play('dungeon');
    },

    // ==================== CH4: BOSS BATTLE ====================
    initBoss() {
        this.st = 'ch4';
        this.bossHp = 100;
        this.bossMaxHp = 100;
        this.bossPhase = 0;
        this.bullets = [];
        this.playerBullets = [];
        this.bShip = { x: 100, y: 240, shotCd: 0 };
        this.bTimer = 0;
        if (typeof BGM !== 'undefined') BGM.play('boss');
    },

    die() {
        this.lives--;
        if (typeof playSnd !== 'undefined') playSnd('hit');
        if (typeof screenShake !== 'undefined') screenShake(10);
        if (this.lives <= 0) {
            this.st = 'gameover';
            this.tmr = 0;
            if (typeof BGM !== 'undefined') BGM.play('gameover');
            if (this.score > this.best) {
                this.best = this.score;
                SaveSys.data.galaxyBest = this.best;
                SaveSys.save();
            }
        } else {
            // Restart current chapter
            this.startChapter(this.chapter);
        }
    },

    update() {
        if (typeof keysDown !== 'undefined' && keysDown.select) {
            if (typeof switchApp !== 'undefined') switchApp(Menu);
            return;
        }
        this.tmr++;

        if (this.st === 'title') {
            if (typeof keysDown !== 'undefined' && keysDown.a) {
                this.score = 0; this.lives = 3; this.chapter = 0;
                this.startStory(0);
                if (typeof playSnd !== 'undefined') playSnd('jmp');
            }
            return;
        }

        if (this.st === 'gameover') {
            if (this.tmr > 60 && typeof keysDown !== 'undefined' && keysDown.a) {
                this.st = 'title'; this.tmr = 0;
                if (typeof BGM !== 'undefined') BGM.play('menu');
            }
            return;
        }

        if (this.st === 'story') {
            this.storyTmr++;
            let lines = this.storyLines[this.storyIdx];
            if (!lines) { this.nextAfterStory(); return; }
            let line = lines[this.storyLine] || '';
            if (this.storyTmr % 2 === 0 && this.storyChar < line.length) {
                this.storyChar++;
            }
            if (typeof keysDown !== 'undefined' && keysDown.a) {
                if (this.storyChar < line.length) {
                    this.storyChar = line.length;
                } else {
                    this.storyLine++;
                    this.storyChar = 0;
                    this.storyTmr = 0;
                    if (this.storyLine >= lines.length) {
                        this.nextAfterStory();
                    }
                }
            }
            return;
        }

        if (this.st === 'ch1') this.updatePipes();
        else if (this.st === 'ch2') this.updateAsteroids();
        else if (this.st === 'ch3') this.updateMiner();
        else if (this.st === 'ch4') this.updateBoss();
        else if (this.st === 'chclear') {
            if (this.tmr > 90 && typeof keysDown !== 'undefined' && keysDown.a) {
                this.chapter++;
                if (this.chapter >= 4) {
                    this.startStory(4); // ending
                } else {
                    this.startStory(this.chapter);
                }
            }
        } else if (this.st === 'ending') {
            if (this.tmr > 120 && typeof keysDown !== 'undefined' && keysDown.a) {
                this.st = 'title'; this.tmr = 0;
                if (typeof BGM !== 'undefined') BGM.play('menu');
            }
        }
    },

    nextAfterStory() {
        if (this.storyIdx === 4) {
            // Ending
            this.st = 'ending'; this.tmr = 0;
            if (this.score > this.best) {
                this.best = this.score;
                SaveSys.data.galaxyBest = this.best;
                SaveSys.save();
            }
        } else {
            this.startChapter(this.storyIdx);
        }
    },

    // ==================== CH1 UPDATE ====================
    updatePipes() {
        this.pTime--;
        if (this.pTime <= 0) { this.die(); return; }

        if (typeof keysDown !== 'undefined') {
            if (keysDown.up && this.pCur.y > 0) { this.pCur.y--; if (typeof playSnd !== 'undefined') playSnd('sel'); }
            if (keysDown.down && this.pCur.y < this.pH - 1) { this.pCur.y++; if (typeof playSnd !== 'undefined') playSnd('sel'); }
            if (keysDown.left && this.pCur.x > 0) { this.pCur.x--; if (typeof playSnd !== 'undefined') playSnd('sel'); }
            if (keysDown.right && this.pCur.x < this.pW - 1) { this.pCur.x++; if (typeof playSnd !== 'undefined') playSnd('sel'); }
            if (keysDown.a) {
                this.pipes[this.pCur.y][this.pCur.x].rot = (this.pipes[this.pCur.y][this.pCur.x].rot + 1) % 4;
                if (typeof playSnd !== 'undefined') playSnd('jmp');
                if (this.checkPipeFlow()) {
                    this.score += Math.floor(this.pTime / 60) * 10 + 100;
                    this.st = 'chclear'; this.tmr = 0;
                    if (typeof playSnd !== 'undefined') playSnd('combo');
                    if (typeof screenShake !== 'undefined') screenShake(5);
                }
            }
        }
    },

    // ==================== CH2 UPDATE ====================
    updateAsteroids() {
        this.aTime--;
        if (this.aTime <= 0) {
            // Survived!
            this.score += 200 + Math.floor(this.fuel);
            this.st = 'chclear'; this.tmr = 0;
            if (typeof playSnd !== 'undefined') playSnd('combo');
            return;
        }

        // Move ship
        let spd = 3;
        if (typeof keys !== 'undefined') {
            if (keys.left)  this.ship.x -= spd;
            if (keys.right) this.ship.x += spd;
        }
        this.ship.x = Math.max(8, Math.min(192, this.ship.x));

        // Boost
        if (typeof keysDown !== 'undefined' && keysDown.a) {
            if (this.fuel > 0) {
                this.fuel = Math.max(0, this.fuel - 20);
                this.ship.y -= 30;
                this.ship.y = Math.max(50, this.ship.y);
                if (typeof playSnd !== 'undefined') playSnd('jmp');
            }
        }
        // Gravity
        if (this.ship.y < 240) this.ship.y += 1.5;
        this.ship.y = Math.min(260, this.ship.y);

        // Fuel pickups
        for (let a of this.asteroids) {
            if (a.isFuel && !a.picked &&
                Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < a.r + 8) {
                a.picked = true;
                this.fuel = Math.min(100, this.fuel + 25);
                if (typeof playSnd !== 'undefined') playSnd('combo');
            }
        }

        // Move asteroids
        for (let a of this.asteroids) {
            a.y += a.spd;
            if (a.y > 320) {
                a.y = -20 - Math.random() * 100;
                a.x = Math.random() * 180 + 10;
                a.isFuel = Math.random() < 0.2;
                a.picked = false;
            }
            if (!a.isFuel && !a.picked &&
                Math.hypot(this.ship.x - a.x, this.ship.y - a.y) < a.r + 6) {
                this.die(); return;
            }
        }

        // Fuel drain
        this.fuel -= 0.05;
        if (this.fuel <= 0) { this.die(); return; }
    },

    // ==================== CH3 UPDATE ====================
    updateMiner() {
        if (typeof keysDown !== 'undefined') {
            let moved = false;
            let nx = this.mCur.x, ny = this.mCur.y;
            if (keysDown.up) { ny--; moved = true; }
            if (keysDown.down) { ny++; moved = true; }
            if (keysDown.left) { nx--; moved = true; }
            if (keysDown.right) { nx++; moved = true; }

            if (moved) {
                nx = Math.max(0, Math.min(this.mW - 1, nx));
                ny = Math.max(0, Math.min(this.mH - 1, ny));
                if (typeof playSnd !== 'undefined') playSnd('sel');
            }

            if (keysDown.a || moved) {
                let cell = this.mGrid[ny][nx];
                if (cell === 'crystal') {
                    this.mGrid[ny][nx] = 'empty';
                    this.crystals++;
                    if (typeof playSnd !== 'undefined') playSnd('combo');
                    if (typeof screenShake !== 'undefined') screenShake(3);
                    if (this.crystals >= 5 && this.mEnemies.length === 0) {
                        // Spawn slime enemies
                        for (let i = 0; i < 3; i++) {
                            this.mEnemies.push({
                                x: Math.floor(Math.random() * this.mW),
                                y: 0,
                                tmr: 0
                            });
                        }
                    }
                    if (this.crystals >= 10) {
                        this.score += 300;
                        this.st = 'chclear'; this.tmr = 0;
                        if (typeof playSnd !== 'undefined') playSnd('combo');
                        return;
                    }
                } else if (cell !== 'rock') {
                    this.mCur.x = nx;
                    this.mCur.y = ny;
                }
            }
        }

        // Move enemies
        if (this.tmr % 30 === 0) {
            for (let e of this.mEnemies) {
                let dx = this.mCur.x - e.x;
                let dy = this.mCur.y - e.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    e.x += dx > 0 ? 1 : -1;
                } else {
                    e.y += dy > 0 ? 1 : -1;
                }
                e.x = Math.max(0, Math.min(this.mW - 1, e.x));
                e.y = Math.max(0, Math.min(this.mH - 1, e.y));
                if (e.x === this.mCur.x && e.y === this.mCur.y) {
                    this.die(); return;
                }
            }
        }
    },

    // ==================== CH4 UPDATE ====================
    updateBoss() {
        this.bTimer++;
        let phase = this.bossPhase;

        // Move player ship
        let spd = 3;
        if (typeof keys !== 'undefined') {
            if (keys.left)  this.bShip.x -= spd;
            if (keys.right) this.bShip.x += spd;
        }
        this.bShip.x = Math.max(8, Math.min(192, this.bShip.x));

        // Fire player bullet
        if (this.bShip.shotCd > 0) this.bShip.shotCd--;
        if (typeof keysDown !== 'undefined' && keysDown.a && this.bShip.shotCd <= 0) {
            this.playerBullets.push({ x: this.bShip.x, y: this.bShip.y - 10, vy: -8 });
            this.bShip.shotCd = 12;
            if (typeof playSnd !== 'undefined') playSnd('jmp');
        }

        // Update player bullets
        for (let i = this.playerBullets.length - 1; i >= 0; i--) {
            let b = this.playerBullets[i];
            b.y += b.vy;
            // Hit boss
            if (b.y < 80 && Math.abs(b.x - 100) < 40) {
                this.playerBullets.splice(i, 1);
                this.bossHp -= 10;
                if (typeof playSnd !== 'undefined') playSnd('hit');
                if (typeof screenShake !== 'undefined') screenShake(3);
                if (this.bossHp <= 33 && this.bossPhase < 2) this.bossPhase = 2;
                else if (this.bossHp <= 66 && this.bossPhase < 1) this.bossPhase = 1;
                if (this.bossHp <= 0) {
                    this.score += 500;
                    this.startStory(4); // ending
                    return;
                }
                continue;
            }
            if (b.y < -10) this.playerBullets.splice(i, 1);
        }

        // Boss fires bullets
        let fireRate = [60, 40, 20][phase];
        if (this.bTimer % fireRate === 0) {
            let count = phase + 1;
            for (let i = 0; i < count; i++) {
                let angle = Math.PI / 2 + (i - (count - 1) / 2) * 0.4;
                this.bullets.push({
                    x: 100 + (Math.random() - 0.5) * 60,
                    y: 80,
                    vx: Math.cos(angle) * (2 + phase),
                    vy: Math.sin(angle) * (2 + phase)
                });
            }
        }

        // Update boss bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.x += b.vx; b.y += b.vy;
            if (b.y > 310 || b.x < -10 || b.x > 210) {
                this.bullets.splice(i, 1); continue;
            }
            if (Math.hypot(b.x - this.bShip.x, b.y - this.bShip.y) < 10) {
                this.bullets.splice(i, 1);
                this.die(); return;
            }
        }
    },

    // ==================== DRAW ====================
    draw() {
        // Starfield background
        ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, 200, 300);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 40; i++) {
            let sx = (i * 37 + this.tmr * 0.2) % 200;
            let sy = (i * 73 + this.tmr * 0.5) % 300;
            ctx.fillRect(sx, sy, 1, 1);
        }

        if (this.st === 'title') {
            ctx.shadowBlur = 20; ctx.shadowColor = '#4af';
            ctx.fillStyle = '#4af'; ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center'; ctx.fillText('GALAXY', 100, 90);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace';
            ctx.fillText('BREAK', 100, 115);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#888'; ctx.font = '10px monospace';
            ctx.fillText('4 Chapter Adventure', 100, 150);
            ctx.fillStyle = '#fa0'; ctx.font = '10px monospace';
            ctx.fillText(`BEST: ${this.best}`, 100, 175);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText('LIVES: ' + '★'.repeat(3), 100, 200);
            if (this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] START', 100, 240);
            }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'story') {
            let lines = this.storyLines[this.storyIdx];
            if (!lines) return;
            ctx.fillStyle = '#001122'; ctx.fillRect(0, 0, 200, 300);
            // Stars
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 30; i++) {
                ctx.fillRect((i * 59) % 200, (i * 83) % 300, 1, 1);
            }
            // Planet decoration
            ctx.fillStyle = '#224';
            ctx.beginPath(); ctx.arc(160, 60, 40, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#336';
            ctx.beginPath(); ctx.arc(155, 55, 35, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#48a'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.ellipse(160, 60, 55, 15, -0.4, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1;

            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(10, 160, 180, 120);
            ctx.strokeStyle = '#4af'; ctx.strokeRect(10, 160, 180, 120);
            ctx.fillStyle = '#4af'; ctx.font = 'bold 10px monospace';
            ctx.fillText(`CH${this.storyIdx + 1} STORY`, 20, 180);

            ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
            let lineY = 200;
            for (let i = 0; i <= this.storyLine && i < lines.length; i++) {
                let text = i < this.storyLine ? lines[i] : lines[i].substring(0, this.storyChar);
                ctx.fillText(text, 20, lineY);
                lineY += 18;
            }
            if (this.storyChar >= (lines[this.storyLine] || '').length && this.tmr % 40 < 20) {
                ctx.fillStyle = '#ff0'; ctx.fillText('▼', 175, 270);
            }
            return;
        }

        if (this.st === 'ch1') {
            // Pipe puzzle
            ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#4af'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
            ctx.fillText('CH1: PIPE REPAIR', 100, 25);
            ctx.fillStyle = '#ff0';
            ctx.fillText(`TIME: ${Math.ceil(this.pTime / 60)}s`, 100, 45);
            ctx.textAlign = 'left';

            let cellW = 32, cellH = 32;
            let offX = (200 - this.pW * cellW) / 2;
            let offY = 60;

            this.checkPipeFlow(); // update connected flags

            for (let y = 0; y < this.pH; y++) {
                for (let x = 0; x < this.pW; x++) {
                    let px = offX + x * cellW, py = offY + y * cellH;
                    let pipe = this.pipes[y][x];
                    let isCur = (x === this.pCur.x && y === this.pCur.y);

                    ctx.fillStyle = isCur ? '#224' : '#112';
                    ctx.fillRect(px, py, cellW - 2, cellH - 2);
                    if (isCur) {
                        ctx.strokeStyle = '#fff'; ctx.strokeRect(px, py, cellW - 2, cellH - 2);
                    }

                    let col = pipe.connected ? '#0f8' : '#46a';
                    ctx.strokeStyle = col; ctx.lineWidth = 4;

                    let cx2 = px + cellW / 2 - 1, cy2 = py + cellH / 2 - 1;
                    let conns = this.getPipeConnections(pipe);
                    ctx.beginPath();
                    if (pipe.type === 'straight') {
                        if (conns.includes('left')) { ctx.moveTo(px, cy2); ctx.lineTo(cx2, cy2); }
                        if (conns.includes('right')) { ctx.moveTo(cx2, cy2); ctx.lineTo(px + cellW - 2, cy2); }
                        if (conns.includes('up')) { ctx.moveTo(cx2, py); ctx.lineTo(cx2, cy2); }
                        if (conns.includes('down')) { ctx.moveTo(cx2, cy2); ctx.lineTo(cx2, py + cellH - 2); }
                    } else {
                        for (let dir of conns) {
                            if (dir === 'left') { ctx.moveTo(cx2, cy2); ctx.lineTo(px, cy2); }
                            if (dir === 'right') { ctx.moveTo(cx2, cy2); ctx.lineTo(px + cellW - 2, cy2); }
                            if (dir === 'up') { ctx.moveTo(cx2, cy2); ctx.lineTo(cx2, py); }
                            if (dir === 'down') { ctx.moveTo(cx2, cy2); ctx.lineTo(cx2, py + cellH - 2); }
                        }
                    }
                    ctx.stroke(); ctx.lineWidth = 1;

                    // Center dot
                    ctx.fillStyle = col;
                    ctx.beginPath(); ctx.arc(cx2, cy2, 3, 0, Math.PI * 2); ctx.fill();
                }
            }
            // Labels
            ctx.fillStyle = '#0f8'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('START', offX + cellW / 2 - 1, offY + this.pH * cellH + 15);
            ctx.fillText('GOAL', offX + (this.pW - 0.5) * cellW - 1, offY - 5);
            ctx.fillText('[A] ROTATE  [↑↓←→] MOVE', 100, 295);
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ch2') {
            // Asteroid field
            ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#4af'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
            ctx.fillText('CH2: ASTEROID FIELD', 100, 20);
            ctx.fillStyle = '#ff0';
            ctx.fillText(`TIME: ${Math.ceil(this.aTime / 60)}s`, 100, 38);
            ctx.textAlign = 'left';

            // Fuel bar
            ctx.fillStyle = '#333'; ctx.fillRect(10, 48, 120, 8);
            ctx.fillStyle = this.fuel < 30 ? '#f44' : '#0f8';
            ctx.fillRect(10, 48, 120 * (this.fuel / 100), 8);
            ctx.strokeStyle = '#666'; ctx.strokeRect(10, 48, 120, 8);
            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('FUEL', 135, 56);

            // Asteroids
            for (let a of this.asteroids) {
                if (a.isFuel && !a.picked) {
                    ctx.fillStyle = '#ff0'; ctx.font = '14px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('⚡', a.x, a.y);
                    ctx.textAlign = 'left';
                } else if (!a.picked) {
                    ctx.fillStyle = '#888';
                    ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#666';
                    ctx.beginPath(); ctx.arc(a.x - 3, a.y - 3, a.r * 0.4, 0, Math.PI * 2); ctx.fill();
                }
            }

            // Player ship
            ctx.fillStyle = '#4af';
            ctx.beginPath();
            ctx.moveTo(this.ship.x, this.ship.y - 12);
            ctx.lineTo(this.ship.x - 8, this.ship.y + 8);
            ctx.lineTo(this.ship.x + 8, this.ship.y + 8);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#0ff';
            ctx.fillRect(this.ship.x - 2, this.ship.y + 2, 4, 6);

            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('[←→] MOVE  [A] BOOST', 100, 295);
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ch3') {
            ctx.fillStyle = '#110a00'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#4af'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
            ctx.fillText('CH3: STAR MINER', 100, 20);
            ctx.fillStyle = '#0f8';
            ctx.fillText(`CRYSTALS: ${this.crystals}/10`, 100, 38);
            ctx.textAlign = 'left';

            let cellSize = 24;
            let offX = (200 - this.mW * cellSize) / 2;
            let offY = 55;

            for (let y = 0; y < this.mH; y++) {
                for (let x = 0; x < this.mW; x++) {
                    let px = offX + x * cellSize, py = offY + y * cellSize;
                    let cell = this.mGrid[y][x];
                    ctx.fillStyle = '#221a08';
                    ctx.fillRect(px, py, cellSize - 1, cellSize - 1);
                    if (cell === 'rock') {
                        ctx.fillStyle = '#554';
                        ctx.fillRect(px + 2, py + 2, cellSize - 5, cellSize - 5);
                    } else if (cell === 'crystal') {
                        ctx.fillStyle = '#0af';
                        ctx.beginPath();
                        ctx.moveTo(px + cellSize/2, py + 2);
                        ctx.lineTo(px + cellSize - 3, py + cellSize - 3);
                        ctx.lineTo(px + 3, py + cellSize - 3);
                        ctx.closePath(); ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(px + cellSize/2 - 1, py + 4, 2, 3);
                    }
                    // Player
                    if (x === this.mCur.x && y === this.mCur.y) {
                        ctx.fillStyle = '#ff0';
                        ctx.beginPath();
                        ctx.arc(px + cellSize/2, py + cellSize/2, 7, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#000'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
                        ctx.fillText('A', px + cellSize/2, py + cellSize/2 + 3);
                        ctx.textAlign = 'left';
                    }
                }
            }
            // Enemies
            for (let e of this.mEnemies) {
                let px = offX + e.x * cellSize + cellSize/2;
                let py2 = offY + e.y * cellSize + cellSize/2;
                ctx.fillStyle = '#f44';
                ctx.beginPath(); ctx.arc(px, py2, 6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
                ctx.fillText('S', px, py2 + 3); ctx.textAlign = 'left';
            }
            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('[↑↓←→] MOVE  [A] MINE', 100, 295);
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ch4') {
            ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, 200, 300);
            // Stars
            ctx.fillStyle = '#fff';
            for (let i = 0; i < 30; i++) {
                ctx.fillRect((i * 43 + this.tmr) % 200, (i * 71) % 280, 1, 1);
            }

            ctx.fillStyle = '#4af'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
            ctx.fillText('CH4: BOSS BATTLE', 100, 20);
            ctx.textAlign = 'left';

            // Boss HP bar
            ctx.fillStyle = '#400'; ctx.fillRect(20, 30, 160, 8);
            let phase = this.bossPhase;
            ctx.fillStyle = phase === 2 ? '#f44' : (phase === 1 ? '#fa0' : '#f80');
            ctx.fillRect(20, 30, 160 * (this.bossHp / this.bossMaxHp), 8);
            ctx.strokeStyle = '#666'; ctx.strokeRect(20, 30, 160, 8);
            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('BOSS HP', 100, 28); ctx.textAlign = 'left';

            // Boss ship
            let bx = 100, by = 60;
            let flash = phase > 0 && this.tmr % 20 < 10;
            ctx.fillStyle = flash ? '#f44' : '#a00';
            ctx.beginPath();
            ctx.moveTo(bx, by + 20);
            ctx.lineTo(bx - 30, by - 10);
            ctx.lineTo(bx - 15, by - 5);
            ctx.lineTo(bx, by - 20);
            ctx.lineTo(bx + 15, by - 5);
            ctx.lineTo(bx + 30, by - 10);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ff0';
            ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 10 + Math.sin(this.tmr * 0.1) * 5;
            ctx.shadowColor = '#f44';
            ctx.fillStyle = '#f44';
            ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Boss bullets
            ctx.fillStyle = '#f88';
            for (let b of this.bullets) {
                ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, Math.PI * 2); ctx.fill();
            }

            // Player bullets
            ctx.fillStyle = '#0ff';
            for (let b of this.playerBullets) {
                ctx.fillRect(b.x - 2, b.y - 6, 4, 8);
            }

            // Player ship
            ctx.fillStyle = '#4af';
            ctx.beginPath();
            ctx.moveTo(this.bShip.x, this.bShip.y - 12);
            ctx.lineTo(this.bShip.x - 9, this.bShip.y + 10);
            ctx.lineTo(this.bShip.x + 9, this.bShip.y + 10);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#0ff';
            ctx.fillRect(this.bShip.x - 2, this.bShip.y, 4, 8);

            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
            ctx.fillText('[←→] MOVE  [A] FIRE', 100, 295);
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'chclear') {
            ctx.fillStyle = 'rgba(0,0,20,0.85)'; ctx.fillRect(0, 0, 200, 300);
            ctx.shadowBlur = 15; ctx.shadowColor = '#0f8';
            ctx.fillStyle = '#0f8'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
            ctx.fillText('CHAPTER', 100, 120);
            ctx.fillText('CLEAR!!', 100, 145);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff0'; ctx.font = '12px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 175);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText('LIVES: ' + '★'.repeat(this.lives) + '☆'.repeat(3 - this.lives), 100, 200);
            if (this.tmr > 90 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] NEXT CHAPTER', 100, 240);
            }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ending') {
            ctx.fillStyle = '#000011'; ctx.fillRect(0, 0, 200, 300);
            for (let i = 0; i < 60; i++) {
                ctx.fillStyle = `rgba(255,255,${Math.floor(Math.random()*100+155)},${Math.random()})` ;
                ctx.fillRect(Math.random() * 200, Math.random() * 300, 2, 2);
            }
            ctx.shadowBlur = 20; ctx.shadowColor = '#ff0';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
            ctx.fillText('MISSION', 100, 100);
            ctx.fillText('COMPLETE!!', 100, 125);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0f8'; ctx.font = '12px monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, 100, 160);
            ctx.fillStyle = '#fa0';
            ctx.fillText(`BEST: ${this.best}`, 100, 180);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('LIVES: ' + '★'.repeat(this.lives), 100, 205);
            if (this.tmr > 120 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] TITLE', 100, 250);
            }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#f44'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', 100, 110);
            ctx.fillStyle = '#ff0'; ctx.font = '12px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 145);
            ctx.fillStyle = '#fa0';
            ctx.fillText(`BEST: ${this.best}`, 100, 165);
            if (this.tmr > 60 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] TITLE', 100, 210);
            }
            ctx.textAlign = 'left';
        }
    }
};
