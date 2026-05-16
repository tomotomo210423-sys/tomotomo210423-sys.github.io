// === CHAIN BLAST ===

const ChainBlast = {
    st: 'title', tmr: 0, score: 0, hiScore: 0,
    grid: [],
    cx: 3, cy: 3,
    moves: 25,
    level: 1,
    animFrames: [],

    COLS: 8, ROWS: 8, CELL: 20,
    OX: 20, OY: 50,
    COLORS: ['#f44', '#4f4', '#44f', '#ff4', '#f4f'],

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0;
        this.hiScore = SaveSys.data.chainBest || 0;
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startGame() {
        this.st = 'play'; this.tmr = 0; this.score = 0;
        this.level = 1; this.moves = 25;
        this.cx = 3; this.cy = 3;
        this.animFrames = [];
        this.fillGrid();
        if (typeof BGM !== 'undefined') BGM.play('spell');
    },

    fillGrid() {
        let numColors = Math.min(2 + Math.floor(this.level / 2), 5);
        this.grid = [];
        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                this.grid.push(Math.floor(Math.random() * numColors));
            }
        }
    },

    getCell(r, c) {
        if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) return -2;
        return this.grid[r * this.COLS + c];
    },

    setCell(r, c, val) {
        this.grid[r * this.COLS + c] = val;
    },

    findGroup(r, c) {
        let color = this.getCell(r, c);
        if (color < 0) return [];
        let visited = new Set();
        let queue = [{ r, c }];
        let group = [];
        let key = (r, c) => `${r},${c}`;
        visited.add(key(r, c));
        while (queue.length > 0) {
            let { r: cr, c: cc } = queue.shift();
            group.push({ r: cr, c: cc });
            for (let [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                let nr = cr + dr, nc = cc + dc;
                if (!visited.has(key(nr, nc)) && this.getCell(nr, nc) === color) {
                    visited.add(key(nr, nc));
                    queue.push({ r: nr, c: nc });
                }
            }
        }
        return group;
    },

    applyGravity() {
        for (let c = 0; c < this.COLS; c++) {
            let cells = [];
            for (let r = this.ROWS - 1; r >= 0; r--) {
                let val = this.getCell(r, c);
                if (val >= 0) cells.push(val);
            }
            for (let r = this.ROWS - 1; r >= 0; r--) {
                this.setCell(r, c, cells.length > 0 ? cells.shift() : -1);
            }
        }
    },

    isEmpty() {
        return this.grid.every(v => v < 0);
    },

    endGame() {
        this.st = 'result'; this.tmr = 0;
        if (this.score > this.hiScore) {
            this.hiScore = this.score;
            SaveSys.data.chainBest = this.hiScore;
            SaveSys.save();
        }
        SaveSys.addLog('CHAIN BLAST', `スコア: ${this.score}`);
        if (typeof BGM !== 'undefined') BGM.stop();
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        if (this.animFrames.length > 0) {
            this.animFrames = this.animFrames.filter(f => f.life-- > 0);
            return;
        }

        if (this.st === 'title') {
            if (keysDown.a) { this.startGame(); playSnd('jmp'); }
            return;
        }

        if (this.st === 'result') {
            if (this.tmr > 60 && keysDown.a) {
                this.st = 'title';
                if (typeof BGM !== 'undefined') BGM.play('menu');
            }
            return;
        }

        if (this.st === 'play') {
            if (keysDown.up) this.cy = Math.max(0, this.cy - 1);
            if (keysDown.down) this.cy = Math.min(this.ROWS - 1, this.cy + 1);
            if (keysDown.left) this.cx = Math.max(0, this.cx - 1);
            if (keysDown.right) this.cx = Math.min(this.COLS - 1, this.cx + 1);

            if (keysDown.a) {
                let group = this.findGroup(this.cy, this.cx);
                if (group.length >= 2) {
                    let col = this.COLORS[this.getCell(this.cy, this.cx)];
                    for (let { r, c } of group) {
                        this.animFrames.push({
                            x: this.OX + c * this.CELL + this.CELL / 2,
                            y: this.OY + r * this.CELL + this.CELL / 2,
                            col: col, life: 15, maxLife: 15
                        });
                        this.setCell(r, c, -1);
                    }
                    let pts = group.length * group.length * 5;
                    this.score += pts;
                    this.moves--;
                    playSnd('hit');
                    screenShake(4);
                    this.applyGravity();

                    if (this.isEmpty()) {
                        this.score += 500;
                        playSnd('combo');
                        screenShake(10);
                        this.level++;
                        this.fillGrid();
                        this.moves += 10;
                    }

                    if (this.moves <= 0) this.endGame();
                } else {
                    playSnd('sel');
                }
            }
        }
    },

    _cachedGroup: null, _cacheKey: '',

    getGroupCached() {
        let key = `${this.cy},${this.cx}`;
        if (this._cacheKey !== key) {
            this._cachedGroup = this.findGroup(this.cy, this.cx);
            this._cacheKey = key;
        }
        return this._cachedGroup;
    },

    draw() {
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f44'; ctx.font = 'bold 28px "Arial Black", sans-serif';
            ctx.shadowBlur = 12; ctx.shadowColor = '#f44';
            ctx.fillText('CHAIN', 100, 85);
            ctx.fillStyle = '#ff4'; ctx.shadowColor = '#ff4';
            ctx.fillText('BLAST', 100, 118);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('同じ色を2つ以上選んで消せ！', 100, 150);
            ctx.fillStyle = '#888'; ctx.fillText(`BEST: ${this.hiScore}`, 100, 175);
            if (this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('PRESS [A] TO START', 100, 230);
            }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'result') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff4'; ctx.font = 'bold 22px "Arial Black", sans-serif';
            ctx.shadowBlur = 10; ctx.shadowColor = '#ff4';
            ctx.fillText('GAME OVER', 100, 110);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 150);
            ctx.fillStyle = this.score >= this.hiScore ? '#ff4' : '#888';
            ctx.font = '11px monospace';
            ctx.fillText(`BEST: ${this.hiScore}`, 100, 175);
            ctx.fillStyle = '#0ff';
            ctx.fillText(`LEVEL: ${this.level}`, 100, 198);
            if (this.tmr > 60 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] RETRY', 100, 235);
            }
            ctx.textAlign = 'left';
            return;
        }

        // グリッド背景
        ctx.fillStyle = '#112';
        ctx.fillRect(this.OX - 1, this.OY - 1, this.COLS * this.CELL + 2, this.ROWS * this.CELL + 2);

        let highlight = this.animFrames.length === 0 ? this.getGroupCached() : [];
        let hlValid = highlight.length >= 2;

        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                let val = this.getCell(r, c);
                let x = this.OX + c * this.CELL;
                let y = this.OY + r * this.CELL;
                ctx.fillStyle = '#0a0a18';
                ctx.fillRect(x + 1, y + 1, this.CELL - 2, this.CELL - 2);
                if (val >= 0) {
                    ctx.fillStyle = this.COLORS[val];
                    ctx.fillRect(x + 2, y + 2, this.CELL - 4, this.CELL - 4);
                    if (hlValid && highlight.some(g => g.r === r && g.c === c)) {
                        ctx.fillStyle = 'rgba(255,255,255,0.35)';
                        ctx.fillRect(x + 2, y + 2, this.CELL - 4, this.CELL - 4);
                    }
                    // ハイライト端
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(x + 2, y + 2, this.CELL - 4, 3);
                    ctx.fillRect(x + 2, y + 2, 3, this.CELL - 4);
                }
            }
        }

        // カーソル
        if (this.animFrames.length === 0) {
            let cx = this.OX + this.cx * this.CELL;
            let cy = this.OY + this.cy * this.CELL;
            ctx.strokeStyle = this.tmr % 20 < 10 ? '#fff' : '#aaa';
            ctx.lineWidth = 2;
            ctx.strokeRect(cx + 1, cy + 1, this.CELL - 2, this.CELL - 2);
        }

        // 消去パーティクル
        for (let f of this.animFrames) {
            let alpha = f.life / f.maxLife;
            let radius = (1 - alpha) * 14 + 4;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = f.col;
            ctx.beginPath();
            ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // UI ヘッダー
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`SCORE: ${this.score}`, 5, 16);
        ctx.fillStyle = '#ff4'; ctx.textAlign = 'right';
        ctx.fillText(`LV:${this.level}  手:${this.moves}`, 195, 16);
        ctx.textAlign = 'left';

        // 残り手数バー
        ctx.fillStyle = '#222'; ctx.fillRect(5, 24, 190, 6);
        let pct = Math.max(0, this.moves / (25 + (this.level - 1) * 10));
        ctx.fillStyle = this.moves <= 5 ? '#f44' : '#0f0';
        ctx.fillRect(5, 24, 190 * pct, 6);

        // グループサイズヒント
        let hint = this.animFrames.length === 0 ? this.getGroupCached() : [];
        if (hint.length >= 2) {
            ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
            ctx.fillText(`×${hint.length}  +${hint.length * hint.length * 5}pt`, 5, 286);
        }
        ctx.fillStyle = '#333'; ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('SELECT:MENU', 195, 286);
        ctx.textAlign = 'left';
    }
};
