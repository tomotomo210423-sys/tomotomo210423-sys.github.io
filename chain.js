// === CHAIN BLAST v2 ===

const ChainBlast = {
    st: 'title', tmr: 0, score: 0, hiScore: 0,
    grid: [],
    cx: 3, cy: 3,
    moves: 25,
    level: 1,
    animFrames: [],
    texts: [], // score popups
    titleBlocks: [], // title screen floating blocks

    COLS: 8, ROWS: 8, CELL: 20,
    OX: 20, OY: 50,
    COLORS: ['#f44', '#4f4', '#44f', '#ff4', '#f4f'],

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0;
        this.hiScore = SaveSys.data.chainBest || 0;
        this.texts = []; this.titleBlocks = [];
        for (let i = 0; i < 12; i++) {
            this.titleBlocks.push({
                x: Math.random()*200, y: Math.random()*300,
                col: Math.floor(Math.random()*5),
                spd: 0.2+Math.random()*0.5,
                sz: 8+Math.floor(Math.random()*3)*4
            });
        }
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startGame() {
        this.st = 'play'; this.tmr = 0; this.score = 0;
        this.level = 1; this.moves = 25;
        this.cx = 3; this.cy = 3;
        this.animFrames = [];
        this.fillGrid();
        if (typeof BGM !== 'undefined') BGM.play('puzzle');
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

    hasValidMoves() {
        for (let r = 0; r < this.ROWS; r++)
            for (let c = 0; c < this.COLS; c++)
                if (this.getCell(r, c) >= 0 && this.findGroup(r, c).length >= 2) return true;
        return false;
    },

    reshuffleBoard() {
        // 占有マスの位置と値を取得
        let occupied = [];
        for (let i = 0; i < this.grid.length; i++)
            if (this.grid[i] >= 0) occupied.push(i);
        let vals = occupied.map(i => this.grid[i]);

        // 解ける配置が見つかるまで最大200回シャッフル (Fisher-Yates)
        let solved = false;
        for (let attempt = 0; attempt < 200 && !solved; attempt++) {
            for (let k = vals.length - 1; k > 0; k--) {
                let j = Math.floor(Math.random() * (k + 1));
                [vals[k], vals[j]] = [vals[j], vals[k]];
            }
            for (let k = 0; k < occupied.length; k++) this.grid[occupied[k]] = vals[k];
            if (this.hasValidMoves()) solved = true;
        }

        if (solved) {
            this.moves += 3;
            this.shuffleMsg = 90;
            playSnd('combo');
        } else {
            // どう並べ替えても解けない (1個だけ/孤立/全色バラバラ等) → 詰み回避で全消去
            // この後 isEmpty() 判定でレベルクリア扱いになり盤面が再生成される
            for (let i = 0; i < this.grid.length; i++) this.grid[i] = -1;
            playSnd('combo');
        }
    },

    shuffleMsg: 0,

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

        // Update popups
        this.texts = this.texts.filter(t => t.life-- > 0);
        for (let t of this.texts) t.y -= 0.5;

        // Title block animation
        if (this.st === 'title') {
            for (let b of this.titleBlocks) { b.y -= b.spd; if (b.y < -20) b.y = 310; }
        }

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
                    screenShake(group.length >= 6 ? 8 : 4);
                    // Score popup
                    let midX = group.reduce((s,g)=>s+g.c,0)/group.length*this.CELL+this.OX;
                    let midY = group.reduce((s,g)=>s+g.r,0)/group.length*this.CELL+this.OY;
                    let popTxt = group.length >= 4 ? '+BIG CHAIN! +'+pts : '+'+pts;
                    this.texts.push({x:midX, y:midY, text:popTxt, life:50, col:group.length>=4?'#ff4':'#0ff'});
                    this.applyGravity();

                    if (!this.isEmpty() && !this.hasValidMoves()) this.reshuffleBoard();

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
        // Level-based background
        let lvDark = Math.min(0.6, (this.level - 1) * 0.08);
        ctx.fillStyle = `rgb(0,0,${Math.floor(18 - lvDark*18)})`; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#000510'; ctx.fillRect(0,0,200,300);
            // Floating blocks
            for (let b of this.titleBlocks) {
                ctx.globalAlpha = 0.35;
                ctx.fillStyle = this.COLORS[b.col];
                ctx.fillRect(b.x, b.y, b.sz, b.sz);
                ctx.globalAlpha = 1;
            }
            ctx.textAlign = 'center';
            let p1 = (Math.sin(this.tmr*0.08)+1)/2;
            let p2 = (Math.sin(this.tmr*0.08+Math.PI)+1)/2;
            ctx.shadowBlur = 8+p1*12; ctx.shadowColor = '#f44';
            ctx.fillStyle = '#f44'; ctx.font = 'bold 30px "Arial Black", sans-serif';
            ctx.fillText('CHAIN', 100, 90);
            ctx.shadowBlur = 8+p2*12; ctx.shadowColor = '#ff4';
            ctx.fillStyle = '#ff4';
            ctx.fillText('BLAST', 100, 126);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
            ctx.fillText('同じ色を2つ以上選んで消せ！', 100, 158);
            ctx.fillStyle = '#666'; ctx.fillText('BEST: '+this.hiScore, 100, 180);
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

        // Grid border glow
        let glowPulse = 3 + Math.sin(this.tmr*0.06)*3;
        ctx.shadowBlur = glowPulse; ctx.shadowColor = '#24f';
        ctx.strokeStyle = '#246'; ctx.lineWidth = 2;
        ctx.strokeRect(this.OX-2, this.OY-2, this.COLS*this.CELL+4, this.ROWS*this.CELL+4);
        ctx.shadowBlur = 0; ctx.lineWidth = 1;
        ctx.fillStyle = '#050814';
        ctx.fillRect(this.OX-1, this.OY-1, this.COLS*this.CELL+2, this.ROWS*this.CELL+2);

        let highlight = this.animFrames.length === 0 ? this.getGroupCached() : [];
        let hlValid = highlight.length >= 2;
        let hlPulse = 3 + Math.sin(this.tmr*0.18)*3;

        for (let r = 0; r < this.ROWS; r++) {
            for (let c = 0; c < this.COLS; c++) {
                let val = this.getCell(r, c);
                let x = this.OX + c * this.CELL;
                let y = this.OY + r * this.CELL;
                ctx.fillStyle = '#080818';
                ctx.fillRect(x+1, y+1, this.CELL-2, this.CELL-2);
                if (val >= 0) {
                    let inHL = hlValid && highlight.some(g => g.r===r && g.c===c);
                    ctx.save();
                    if (inHL) {
                        ctx.shadowBlur = hlPulse*1.8; ctx.shadowColor = this.COLORS[val];
                    }

                    // === HIGH QUALITY BLOCK ===
                    let bx = x+2, by = y+2, bw = this.CELL-4, bh = this.CELL-4;
                    let col = this.COLORS[val];

                    // Corner-cut (4 corners 1px clip) via clipping path
                    ctx.beginPath();
                    ctx.moveTo(bx+1, by);
                    ctx.lineTo(bx+bw-1, by);
                    ctx.lineTo(bx+bw, by+1);
                    ctx.lineTo(bx+bw, by+bh-1);
                    ctx.lineTo(bx+bw-1, by+bh);
                    ctx.lineTo(bx+1, by+bh);
                    ctx.lineTo(bx, by+bh-1);
                    ctx.lineTo(bx, by+1);
                    ctx.closePath();
                    ctx.clip();

                    // Base color fill
                    ctx.fillStyle = col;
                    ctx.fillRect(bx, by, bw, bh);

                    // Highlight overlay if selected
                    if (inHL) {
                        ctx.fillStyle = `rgba(255,255,255,${0.15+Math.sin(this.tmr*0.18)*0.15})`;
                        ctx.fillRect(bx, by, bw, bh);
                    }

                    // Right/bottom dark shadow (20% darker)
                    ctx.fillStyle = 'rgba(0,0,0,0.20)';
                    ctx.fillRect(bx, by+bh-3, bw, 3);
                    ctx.fillRect(bx+bw-3, by, 3, bh);

                    // Top-left white gloss triangle
                    ctx.fillStyle = 'rgba(255,255,255,0.30)';
                    ctx.fillRect(bx, by, bw, 3);
                    ctx.fillRect(bx, by, 3, bh);

                    // Inner highlight border (2px inset)
                    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(bx+2, by+2, bw-4, bh-4);

                    // Per-color inner pattern
                    let cx2 = bx + bw/2, cy2 = by + bh/2;
                    ctx.shadowBlur = 0;
                    if (val === 0) {
                        // Red: white diamond in center
                        ctx.fillStyle = 'rgba(255,255,255,0.60)';
                        ctx.beginPath();
                        ctx.moveTo(cx2, cy2-3); ctx.lineTo(cx2+3, cy2);
                        ctx.lineTo(cx2, cy2+3); ctx.lineTo(cx2-3, cy2);
                        ctx.closePath(); ctx.fill();
                    } else if (val === 1) {
                        // Green: small green cross
                        ctx.fillStyle = 'rgba(255,255,255,0.55)';
                        ctx.fillRect(cx2-1, cy2-4, 2, 8);
                        ctx.fillRect(cx2-4, cy2-1, 8, 2);
                    } else if (val === 2) {
                        // Blue: horizontal wave lines
                        ctx.fillStyle = 'rgba(255,255,255,0.50)';
                        ctx.fillRect(bx+2, cy2-3, bw-4, 1);
                        ctx.fillRect(bx+3, cy2-1, bw-6, 1);
                        ctx.fillRect(bx+2, cy2+1, bw-4, 1);
                    } else if (val === 3) {
                        // Yellow: radiant dots
                        ctx.fillStyle = 'rgba(255,255,255,0.60)';
                        ctx.fillRect(cx2-1, cy2-1, 2, 2);
                        for (let a = 0; a < 4; a++) {
                            let ax = cx2 + Math.cos(a*Math.PI/2)*4 - 1;
                            let ay = cy2 + Math.sin(a*Math.PI/2)*4 - 1;
                            ctx.fillRect(ax, ay, 1, 1);
                        }
                    } else if (val === 4) {
                        // Pink: 5-point star shape (pixel style)
                        ctx.fillStyle = 'rgba(255,255,255,0.55)';
                        ctx.fillRect(cx2-1, cy2-4, 2, 2); // top
                        ctx.fillRect(cx2-4, cy2+1, 2, 2); // lower-left
                        ctx.fillRect(cx2+2, cy2+1, 2, 2); // lower-right
                        ctx.fillRect(cx2-3, cy2-2, 2, 2); // upper-left
                        ctx.fillRect(cx2+1, cy2-2, 2, 2); // upper-right
                        ctx.fillRect(cx2-1, cy2-1, 2, 4); // center vertical
                    }

                    ctx.restore();
                    // Re-apply shadow for cursor (needs to be outside clip)
                    if (inHL) {
                        ctx.shadowBlur = hlPulse*1.8; ctx.shadowColor = this.COLORS[val];
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }

        // Pulsing cursor
        if (this.animFrames.length === 0) {
            let cx2 = this.OX + this.cx * this.CELL;
            let cy2 = this.OY + this.cy * this.CELL;
            let cPulse = 2 + Math.sin(this.tmr*0.2)*2;
            ctx.strokeStyle = hlValid ? '#0ff' : '#fff';
            ctx.lineWidth = 2; ctx.shadowBlur = cPulse*2; ctx.shadowColor = hlValid ? '#0ff' : '#888';
            ctx.strokeRect(cx2+1, cy2+1, this.CELL-2, this.CELL-2);
            ctx.shadowBlur = 0; ctx.lineWidth = 1;
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

        // Score popups
        for (let t of this.texts) {
            let alpha = t.life / 50;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t.col; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
            ctx.shadowBlur = 8; ctx.shadowColor = t.col;
            ctx.fillText(t.text, t.x, t.y);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1; ctx.textAlign = 'left';
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

        // シャッフルメッセージ
        if (this.shuffleMsg > 0) {
            this.shuffleMsg--;
            let alpha = Math.min(1, this.shuffleMsg / 20);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff4'; ctx.font = 'bold 18px "Arial Black", sans-serif';
            ctx.textAlign = 'center'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff4';
            ctx.fillText('SHUFFLE! +3手', 100, 155);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = 'left';
        }
    }
};
