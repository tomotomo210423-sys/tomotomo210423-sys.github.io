// === DUNGEON CRAWL v1 (旧TURBO DASH) ===
// ターン制ミニローグライク: ランダム生成ダンジョンを潜り、最深階を目指せ！

const DungeonCrawl = {
    st: 'title', tmr: 0,
    W: 13, H: 13, TILE: 14,
    OX: 9, OY: 48,
    map: [],      // 0=壁, 1=床, 2=階段(下り)
    seen: [],     // fog of war 記憶
    p: null,
    enemies: [],
    items: [],    // {x,y,type:'chest'|'gold'|'potion', val}
    bolts: [],    // メイジの魔法弾VFX
    texts: [],    // ダメージ/取得ポップアップ
    floor: 1,
    turn: 0,
    flash: 0,     // レベルアップ金フラッシュ
    moveDelay: 0,
    best: { floor: 0, score: 0 },

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0;
        this.best = SaveSys.data.dungeonBest || { floor: 0, score: 0 };
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startGame() {
        this.st = 'play'; this.tmr = 0; this.turn = 0;
        this.floor = 1; this.flash = 0;
        this.texts = []; this.bolts = [];
        this.p = { x: 0, y: 0, hp: 30, maxHp: 30, atk: 5, lv: 1, exp: 0, nextExp: 10, gold: 0, potions: 1 };
        this.genFloor();
        if (typeof BGM !== 'undefined') BGM.play('boss');
    },

    // ===== ダンジョン生成 (ランダムウォーク掘削) =====
    genFloor() {
        const W = this.W, H = this.H;
        this.map = new Array(W * H).fill(0);
        this.seen = new Array(W * H).fill(false);
        this.enemies = []; this.items = []; this.bolts = [];

        // 中央から掘る
        let cx = (W >> 1), cy = (H >> 1);
        let carved = 0, target = 70;
        let x = cx, y = cy;
        this.map[y * W + x] = 1; carved++;
        let guard = 4000;
        while (carved < target && guard-- > 0) {
            let d = Math.floor(Math.random() * 4);
            if (d === 0 && x > 1) x--;
            else if (d === 1 && x < W - 2) x++;
            else if (d === 2 && y > 1) y--;
            else if (d === 3 && y < H - 2) y++;
            if (this.map[y * W + x] === 0) { this.map[y * W + x] = 1; carved++; }
        }

        // 床リスト
        let floors = [];
        for (let i = 0; i < W * H; i++) if (this.map[i] === 1) floors.push(i);
        const popFloor = () => {
            let idx = floors.splice(Math.floor(Math.random() * floors.length), 1)[0];
            return { x: idx % W, y: Math.floor(idx / W) };
        };

        // プレイヤー配置
        let pp = popFloor();
        this.p.x = pp.x; this.p.y = pp.y;

        // 階段 (プレイヤーからできるだけ遠く: 5回試行で最遠を採用)
        let bestS = null, bestD = -1;
        for (let t = 0; t < 5 && floors.length; t++) {
            let s = popFloor();
            let d = Math.abs(s.x - this.p.x) + Math.abs(s.y - this.p.y);
            if (d > bestD) { if (bestS) floors.push(bestS.y * W + bestS.x); bestD = d; bestS = s; }
            else floors.push(s.y * W + s.x);
        }
        if (bestS) this.map[bestS.y * W + bestS.x] = 2;

        // 敵配置 (階数スケール)
        const f = this.floor;
        const isBossFloor = (f % 5 === 0);
        let enemyCount = isBossFloor ? 2 + Math.floor(Math.random() * 2) : Math.min(6, 3 + Math.floor(f / 2));
        if (isBossFloor && floors.length) {
            let e = popFloor();
            this.enemies.push({ x: e.x, y: e.y, type: 'dragon', hp: 40 + f * 8, maxHp: 40 + f * 8, atk: 6 + f * 2, exp: 30 + f * 5, slow: false });
        }
        for (let i = 0; i < enemyCount && floors.length; i++) {
            let e = popFloor();
            if (Math.abs(e.x - this.p.x) + Math.abs(e.y - this.p.y) < 3) continue; // 初期位置近くは避ける
            let r = Math.random();
            if (r < 0.4) this.enemies.push({ x: e.x, y: e.y, type: 'slime', hp: 6 + f * 2, maxHp: 6 + f * 2, atk: 2 + f, exp: 3 + f, slow: true });
            else if (r < 0.75) this.enemies.push({ x: e.x, y: e.y, type: 'skull', hp: 10 + f * 3, maxHp: 10 + f * 3, atk: 3 + Math.floor(f * 1.5), exp: 5 + f, slow: false });
            else this.enemies.push({ x: e.x, y: e.y, type: 'mage', hp: 8 + f * 2, maxHp: 8 + f * 2, atk: 4 + Math.floor(f * 1.5), exp: 7 + f, slow: false });
        }

        // アイテム配置
        let chestCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < chestCount && floors.length; i++) {
            let c = popFloor();
            this.items.push({ x: c.x, y: c.y, type: 'chest' });
        }
        let goldCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < goldCount && floors.length; i++) {
            let g = popFloor();
            this.items.push({ x: g.x, y: g.y, type: 'gold', val: 5 + Math.floor(Math.random() * 10) + f * 2 });
        }

        this.updateVision();
    },

    // ===== 視界 (Fog of War) =====
    updateVision() {
        const W = this.W;
        for (let dy = -4; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                if (dx * dx + dy * dy > 18) continue;
                let tx = this.p.x + dx, ty = this.p.y + dy;
                if (tx < 0 || tx >= W || ty < 0 || ty >= this.H) continue;
                this.seen[ty * W + tx] = true;
            }
        }
    },

    isVisible(x, y) {
        let dx = x - this.p.x, dy = y - this.p.y;
        return dx * dx + dy * dy <= 18;
    },

    addText(x, y, text, col) {
        this.texts.push({
            x: this.OX + x * this.TILE + this.TILE / 2,
            y: this.OY + y * this.TILE,
            text, col, life: 40
        });
    },

    // ===== プレイヤーのターン =====
    doTurn(dx, dy) {
        const W = this.W;
        let nx = this.p.x + dx, ny = this.p.y + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= this.H) return;

        // 敵がいれば攻撃
        let enemy = this.enemies.find(e => e.x === nx && e.y === ny);
        if (enemy) {
            let dmg = this.p.atk + Math.floor(Math.random() * 3);
            enemy.hp -= dmg;
            this.addText(nx, ny, '-' + dmg, '#ff4');
            playSnd('hit'); screenShake(3);
            for (let i = 0; i < 4; i++) addParticle(this.OX + nx * this.TILE + 7, this.OY + ny * this.TILE + 7, '#f80', 'spark');
            if (enemy.hp <= 0) this.killEnemy(enemy);
            this.enemyTurn();
            return;
        }

        let t = this.map[ny * W + nx];
        if (t === 0) return; // 壁: ターン消費なし

        // 移動
        this.p.x = nx; this.p.y = ny;
        playSnd('sel');

        // アイテム取得
        for (let i = this.items.length - 1; i >= 0; i--) {
            let it = this.items[i];
            if (it.x !== nx || it.y !== ny) continue;
            if (it.type === 'gold') {
                this.p.gold += it.val;
                this.addText(nx, ny, '+' + it.val + 'G', '#fd0');
                playSnd('combo');
            } else if (it.type === 'chest') {
                if (Math.random() < 0.6) {
                    this.p.potions++;
                    this.addText(nx, ny, '+POTION', '#f4f');
                } else {
                    let g = 20 + Math.floor(Math.random() * 31);
                    this.p.gold += g;
                    this.addText(nx, ny, '+' + g + 'G', '#fd0');
                }
                playSnd('combo');
            }
            this.items.splice(i, 1);
        }

        // 階段
        if (t === 2) {
            this.st = 'descend'; this.tmr = 0;
            playSnd('jmp');
            return;
        }

        this.updateVision();
        this.enemyTurn();
    },

    killEnemy(enemy) {
        this.enemies = this.enemies.filter(e => e !== enemy);
        this.p.exp += enemy.exp;
        this.addText(enemy.x, enemy.y, '+' + enemy.exp + 'EXP', '#0ff');
        screenShake(5);
        for (let i = 0; i < 8; i++) addParticle(this.OX + enemy.x * this.TILE + 7, this.OY + enemy.y * this.TILE + 7, enemy.type === 'dragon' ? '#f44' : '#aaa', 'spark');
        // ゴールドドロップ
        if (Math.random() < 0.5 || enemy.type === 'dragon') {
            let val = enemy.type === 'dragon' ? 100 : 3 + Math.floor(Math.random() * 8);
            this.items.push({ x: enemy.x, y: enemy.y, type: 'gold', val });
        }
        // レベルアップ
        while (this.p.exp >= this.p.nextExp) {
            this.p.exp -= this.p.nextExp;
            this.p.lv++;
            this.p.maxHp += 6; this.p.atk += 2;
            this.p.hp = this.p.maxHp;
            this.p.nextExp = 10 + this.p.lv * 8;
            this.flash = 14;
            this.addText(this.p.x, this.p.y, 'LEVEL UP!', '#ff0');
            playSnd('combo'); screenShake(6);
        }
    },

    // ===== 敵のターン =====
    enemyTurn() {
        this.turn++;
        const W = this.W;
        for (let e of this.enemies) {
            if (e.slow && this.turn % 2 === 0) continue;
            let dx = this.p.x - e.x, dy = this.p.y - e.y;
            let dist = Math.abs(dx) + Math.abs(dy);

            // 隣接攻撃
            if (dist === 1) {
                this.hurtPlayer(e.atk, e.x, e.y);
                continue;
            }

            // メイジ: 直線3マス以内で遠距離攻撃
            if (e.type === 'mage' && dist <= 3 && (dx === 0 || dy === 0)) {
                let clear = true;
                let sx = Math.sign(dx), sy = Math.sign(dy);
                for (let s = 1; s < dist; s++) {
                    if (this.map[(e.y + sy * s) * W + (e.x + sx * s)] === 0) { clear = false; break; }
                }
                if (clear) {
                    this.bolts.push({ x1: e.x, y1: e.y, x2: this.p.x, y2: this.p.y, life: 12 });
                    this.hurtPlayer(e.atk, e.x, e.y);
                    continue;
                }
            }

            // 追跡 (視界7マス以内)
            if (dist > 7) continue;
            let tryMoves = Math.abs(dx) > Math.abs(dy)
                ? [[Math.sign(dx), 0], [0, Math.sign(dy)]]
                : [[0, Math.sign(dy)], [Math.sign(dx), 0]];
            for (let [mx, my] of tryMoves) {
                if (mx === 0 && my === 0) continue;
                let nx = e.x + mx, ny = e.y + my;
                if (this.map[ny * W + nx] === 0) continue;
                if (nx === this.p.x && ny === this.p.y) continue;
                if (this.enemies.some(o => o !== e && o.x === nx && o.y === ny)) continue;
                e.x = nx; e.y = ny;
                break;
            }
        }
    },

    hurtPlayer(atk, fromX, fromY) {
        let dmg = Math.max(1, atk + Math.floor(Math.random() * 3) - 1);
        this.p.hp -= dmg;
        this.addText(this.p.x, this.p.y, '-' + dmg, '#f44');
        playSnd('hit'); screenShake(4);
        if (this.p.hp <= 0) {
            this.p.hp = 0;
            this.endGame();
        }
    },

    getScore() {
        return this.p.gold + this.floor * 100;
    },

    endGame() {
        this.st = 'gameover'; this.tmr = 0;
        let score = this.getScore();
        let b = SaveSys.data.dungeonBest || { floor: 0, score: 0 };
        if (this.floor > b.floor) b.floor = this.floor;
        if (score > b.score) b.score = score;
        SaveSys.data.dungeonBest = b;
        this.best = b;
        SaveSys.save();
        SaveSys.addLog('DUNGEON CRAWL', `地下${this.floor}階で死亡 スコア:${score}`);
        if (typeof BGM !== 'undefined') BGM.stop();
        screenShake(10);
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;
        if (this.flash > 0) this.flash--;
        this.texts = this.texts.filter(t => t.life-- > 0);
        for (let t of this.texts) t.y -= 0.5;
        this.bolts = this.bolts.filter(b => b.life-- > 0);

        if (this.st === 'title') {
            if (keysDown.a) { this.startGame(); playSnd('jmp'); }
            return;
        }

        if (this.st === 'gameover') {
            if (this.tmr > 60 && keysDown.a) {
                this.st = 'title'; this.tmr = 0;
                if (typeof BGM !== 'undefined') BGM.play('menu');
            }
            return;
        }

        if (this.st === 'descend') {
            if (this.tmr === 40) {
                this.floor++;
                this.genFloor();
                this.st = 'play'; this.tmr = 0;
                playSnd('combo');
            }
            return;
        }

        // ===== PLAY =====
        // ポーション (B)
        if (keysDown.b && this.p.potions > 0 && this.p.hp < this.p.maxHp) {
            this.p.potions--;
            let heal = Math.floor(this.p.maxHp / 2);
            this.p.hp = Math.min(this.p.maxHp, this.p.hp + heal);
            this.addText(this.p.x, this.p.y, '+' + heal + 'HP', '#0f0');
            playSnd('combo');
        }

        // 移動 (エッジ + 長押しリピート)
        let dir = null;
        if (keysDown.up) dir = [0, -1];
        else if (keysDown.down) dir = [0, 1];
        else if (keysDown.left) dir = [-1, 0];
        else if (keysDown.right) dir = [1, 0];

        if (dir) {
            this.doTurn(dir[0], dir[1]);
            this.moveDelay = 14;
        } else if (--this.moveDelay <= 0) {
            let held = null;
            if (keys.up) held = [0, -1];
            else if (keys.down) held = [0, 1];
            else if (keys.left) held = [-1, 0];
            else if (keys.right) held = [1, 0];
            if (held) { this.doTurn(held[0], held[1]); this.moveDelay = 7; }
        }
    },

    // ===== 描画ヘルパー =====
    drawTorch(x, y, big) {
        let fl = Math.sin(this.tmr * 0.3 + x) * 2;
        ctx.fillStyle = '#840'; ctx.fillRect(x - 2, y, 4, big ? 14 : 10);
        ctx.shadowBlur = 12 + fl * 2; ctx.shadowColor = '#f80';
        ctx.fillStyle = '#f80';
        ctx.beginPath(); ctx.arc(x, y - 3, 4 + fl * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4';
        ctx.beginPath(); ctx.arc(x, y - 4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    },

    drawEntitySprite(name, frame, tx, ty) {
        let s = window.sprs ? window.sprs[name] : null;
        if (!s) return false;
        if (Array.isArray(s)) s = s[frame % s.length];
        if (!s) return false;
        let w = (typeof s === 'string') ? 8 : (s.w || 8);
        let scale = this.TILE / w;
        drawSprite(this.OX + tx * this.TILE, this.OY + ty * this.TILE, null, s, scale);
        return true;
    },

    draw() {
        ctx.fillStyle = '#0a0604'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            // たいまつ
            this.drawTorch(40, 110, true);
            this.drawTorch(160, 110, true);
            // 入口
            ctx.fillStyle = '#321'; ctx.fillRect(75, 150, 50, 60);
            ctx.fillStyle = '#000'; ctx.fillRect(82, 160, 36, 50);
            ctx.fillStyle = '#321';
            ctx.beginPath(); ctx.arc(100, 162, 18, Math.PI, 0); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(100, 164, 14, Math.PI, 0); ctx.fill();

            ctx.textAlign = 'center';
            let p1 = (Math.sin(this.tmr * 0.07) + 1) / 2;
            ctx.shadowBlur = 8 + p1 * 10; ctx.shadowColor = '#f80';
            ctx.fillStyle = '#f80'; ctx.font = 'bold 24px "Arial Black", sans-serif';
            ctx.fillText('DUNGEON', 100, 70);
            ctx.shadowBlur = 8 + (1 - p1) * 10; ctx.shadowColor = '#fd0';
            ctx.fillStyle = '#fd0';
            ctx.fillText('CRAWL', 100, 98);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#999'; ctx.font = '9px monospace';
            ctx.fillText('十字キー:移動/攻撃  B:ポーション', 100, 228);
            ctx.fillStyle = '#666';
            ctx.fillText(`最深: 地下${this.best.floor}階  BEST: ${this.best.score}`, 100, 244);
            if (this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('PRESS [A] TO START', 100, 270);
            }
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'descend') {
            // 渦巻きトランジション
            let r = (this.tmr / 40) * 220;
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.rect(0, 0, 200, 300);
            ctx.arc(100, 150, Math.max(0, 220 - r), 0, Math.PI * 2, true);
            ctx.fill();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fd0'; ctx.font = 'bold 14px monospace';
            ctx.fillText(`地下 ${this.floor + 1} 階へ…`, 100, 150);
            ctx.textAlign = 'left';
            return;
        }

        // ===== マップ描画 =====
        const W = this.W, T = this.TILE;
        for (let y = 0; y < this.H; y++) {
            for (let x = 0; x < W; x++) {
                let i = y * W + x;
                if (!this.seen[i]) continue;
                let vis = this.isVisible(x, y);
                let px = this.OX + x * T, py = this.OY + y * T;
                let t = this.map[i];
                if (t === 0) {
                    // 壁
                    ctx.fillStyle = vis ? '#4a3828' : '#1c1410';
                    ctx.fillRect(px, py, T, T);
                    ctx.fillStyle = vis ? '#382a1c' : '#140e0a';
                    ctx.fillRect(px, py + T - 3, T, 3);
                    if (vis) { ctx.fillStyle = '#5a4836'; ctx.fillRect(px + 1, py + 1, T - 2, 2); }
                } else {
                    // 床
                    ctx.fillStyle = vis ? '#1c1812' : '#0c0a08';
                    ctx.fillRect(px, py, T, T);
                    if (vis && (x * 31 + y * 17) % 5 === 0) {
                        ctx.fillStyle = '#262016'; ctx.fillRect(px + 4, py + 6, 3, 2);
                    }
                    if (t === 2) {
                        // 階段
                        ctx.fillStyle = vis ? '#888' : '#333';
                        ctx.fillRect(px + 2, py + 9, 10, 3);
                        ctx.fillRect(px + 4, py + 6, 8, 3);
                        ctx.fillRect(px + 6, py + 3, 6, 3);
                        if (vis) {
                            ctx.shadowBlur = 6; ctx.shadowColor = '#fd0';
                            ctx.strokeStyle = '#fd0'; ctx.strokeRect(px + 1, py + 1, T - 2, T - 2);
                            ctx.shadowBlur = 0;
                        }
                    }
                }
            }
        }

        // アイテム (視界内のみ)
        for (let it of this.items) {
            if (!this.isVisible(it.x, it.y) || !this.seen[it.y * W + it.x]) continue;
            let px = this.OX + it.x * T, py = this.OY + it.y * T;
            if (it.type === 'gold') {
                if (!this.drawEntitySprite('coin', Math.floor(this.tmr / 20), it.x, it.y)) {
                    ctx.fillStyle = '#fd0';
                    ctx.beginPath(); ctx.arc(px + 7, py + 7, 4, 0, Math.PI * 2); ctx.fill();
                }
            } else if (it.type === 'chest') {
                ctx.fillStyle = '#840'; ctx.fillRect(px + 2, py + 4, 10, 8);
                ctx.fillStyle = '#a60'; ctx.fillRect(px + 2, py + 4, 10, 3);
                ctx.fillStyle = '#fd0'; ctx.fillRect(px + 6, py + 6, 2, 3);
            }
        }

        // 敵 (視界内のみ)
        const sprMap = { slime: 'slime', skull: 'skull', mage: 'mage', dragon: 'dragon' };
        for (let e of this.enemies) {
            if (!this.isVisible(e.x, e.y)) continue;
            let px = this.OX + e.x * T, py = this.OY + e.y * T;
            if (e.type === 'dragon') {
                ctx.shadowBlur = 8; ctx.shadowColor = '#f44';
            }
            if (!this.drawEntitySprite(sprMap[e.type], Math.floor(this.tmr / 25), e.x, e.y)) {
                ctx.fillStyle = e.type === 'dragon' ? '#f44' : '#a8a';
                ctx.fillRect(px + 2, py + 2, T - 4, T - 4);
            }
            ctx.shadowBlur = 0;
            // HPバー (ダメージを受けた敵のみ)
            if (e.hp < e.maxHp) {
                ctx.fillStyle = '#400'; ctx.fillRect(px + 1, py - 3, T - 2, 2);
                ctx.fillStyle = '#f44'; ctx.fillRect(px + 1, py - 3, (T - 2) * Math.max(0, e.hp / e.maxHp), 2);
            }
        }

        // メイジ魔法弾VFX
        for (let b of this.bolts) {
            let a = b.life / 12;
            ctx.strokeStyle = `rgba(200,80,255,${a})`;
            ctx.lineWidth = 2; ctx.shadowBlur = 6; ctx.shadowColor = '#a4f';
            ctx.beginPath();
            ctx.moveTo(this.OX + b.x1 * T + 7, this.OY + b.y1 * T + 7);
            ctx.lineTo(this.OX + b.x2 * T + 7, this.OY + b.y2 * T + 7);
            ctx.stroke();
            ctx.shadowBlur = 0; ctx.lineWidth = 1;
        }

        // プレイヤー
        {
            let px = this.OX + this.p.x * T, py = this.OY + this.p.y * T;
            ctx.shadowBlur = 6; ctx.shadowColor = '#0ff';
            if (!this.drawEntitySprite('heroNew', 0, this.p.x, this.p.y)) {
                ctx.fillStyle = '#0ff'; ctx.fillRect(px + 3, py + 2, 8, 10);
            }
            ctx.shadowBlur = 0;
        }

        // ポップアップ
        for (let t of this.texts) {
            ctx.globalAlpha = Math.min(1, t.life / 20);
            ctx.fillStyle = t.col; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
            ctx.shadowBlur = 4; ctx.shadowColor = t.col;
            ctx.fillText(t.text, t.x, t.y);
            ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.textAlign = 'left';
        }

        // レベルアップフラッシュ
        if (this.flash > 0) {
            ctx.fillStyle = `rgba(255,220,0,${this.flash / 14 * 0.25})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        // ===== HUD =====
        // 上部
        ctx.fillStyle = 'rgba(10,6,4,0.9)'; ctx.fillRect(0, 0, 200, this.OY - 2);
        ctx.fillStyle = '#fd0'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`地下${this.floor}階`, 5, 14);
        let isBoss = (this.floor % 5 === 0);
        if (isBoss && this.enemies.some(e => e.type === 'dragon')) {
            ctx.fillStyle = '#f44'; ctx.font = 'bold 9px monospace';
            ctx.fillText('⚠BOSS', 70, 14);
        }
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
        ctx.fillText(`LV${this.p.lv}  ATK${this.p.atk}  ${this.p.gold}G`, 195, 14);
        ctx.textAlign = 'left';
        // HPバー
        ctx.fillStyle = '#400'; ctx.fillRect(5, 22, 120, 7);
        let hpr = this.p.hp / this.p.maxHp;
        ctx.fillStyle = hpr < 0.3 ? '#f44' : '#0f0';
        ctx.fillRect(5, 22, 120 * hpr, 7);
        ctx.strokeStyle = '#666'; ctx.strokeRect(5, 22, 120, 7);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
        ctx.fillText(`${this.p.hp}/${this.p.maxHp}`, 130, 29);
        // EXPバー
        ctx.fillStyle = '#013'; ctx.fillRect(5, 33, 120, 4);
        ctx.fillStyle = '#0af'; ctx.fillRect(5, 33, 120 * Math.min(1, this.p.exp / this.p.nextExp), 4);
        ctx.fillStyle = '#68a'; ctx.font = '8px monospace';
        ctx.fillText('EXP', 130, 39);
        // ポーション
        ctx.fillStyle = '#f4f'; ctx.font = '9px monospace';
        ctx.fillText(`🧪×${this.p.potions}`, 165, 29);

        // 下部
        ctx.fillStyle = 'rgba(10,6,4,0.9)'; ctx.fillRect(0, this.OY + this.H * T + 2, 200, 300);
        ctx.fillStyle = '#555'; ctx.font = '8px monospace';
        ctx.fillText(`SCORE: ${this.getScore()}`, 5, 245);
        ctx.textAlign = 'right';
        ctx.fillText('B:ポーション SELECT:MENU', 195, 245);
        ctx.textAlign = 'left';

        // ゲームオーバー
        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(0, 0, 200, 300);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f44'; ctx.font = 'bold 20px "Arial Black", sans-serif';
            ctx.shadowBlur = 10; ctx.shadowColor = '#f44';
            ctx.fillText('YOU DIED', 100, 100);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
            ctx.fillText(`地下${this.floor}階  LV${this.p.lv}`, 100, 135);
            ctx.fillText(`SCORE: ${this.getScore()}`, 100, 155);
            ctx.fillStyle = '#888'; ctx.font = '10px monospace';
            ctx.fillText(`最深: 地下${this.best.floor}階  BEST: ${this.best.score}`, 100, 180);
            if (this.tmr > 60 && this.tmr % 50 < 25) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('[A] RETRY', 100, 225);
            }
            ctx.textAlign = 'left';
        }
    }
};
