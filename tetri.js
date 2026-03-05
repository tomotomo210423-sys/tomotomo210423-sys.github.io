// === TETRIVADER V2 (Remake & Action Edition) ===

const Tetrivader = {
    // 状態管理
    st: 'title', tmr: 0, score: 0, hiScore: 0,
    shipIdx: 0, diff: 0, 
    px: 100, py: 260,
    bullets: [], blocks: [], parts: [], stars: [],
    
    // ★ 外部との衝突を防ぐため、すべてオブジェクト内に収納！
    playSE(id) { if(typeof playSnd === 'function') playSnd(id); },
    shakeCam(val) { if(typeof screenShake === 'function') screenShake(val); },

    PAL: { '0':null, '1':'#000', '2':'#fff', '3':'#ff0', '4':'#f00', '5':'#0ff', '6':'#0f0', '7':'#f80', '8':'#888', '9':'#ccc', 'a':'#f0f', 'b':'#840', 'c':'#ff8', 'd':'#00f' },

    SHIPS_INFO: [
        { name: '標準 (FIGHTER)', col: '#fff' },
        { name: 'バナナ', col: '#ff0' },
        { name: 'ペペロンチーノ', col: '#f00' },
        { name: '大砲', col: '#888' },
        { name: '虹色のゴリラ', col: 'rainbow' }, 
        { name: '黄金のトマト', col: '#ff0' },  
        { name: 'サンマ人参', col: '#0ff' },
        { name: '悟りブロッコリー', col: '#0f0' } 
    ],

    SPRITES: [
        [ // 0: Fighter
            "0000000220000000","0000000220000000","0000002222000000","0000022442200000",
            "0000222442220000","0002222222222000","0022222222222200","0220222222220220",
            "0200022222200020","0000022002200000"
        ],
        [ // 1: Banana
            "0000000000000030","0000000000000330","0000000000033300","0000000003330000",
            "0000000333000000","0000033300000000","0003330000000000","0033300000000000",
            "0330000000000000","0000000000000000"
        ],
        [ // 2: Peperoncino
            "0000000000000000","0000000000000000","0000000040000000","000000cccc000000",
            "00000cc4ccc00000","0000cccccc400000","0000cccccccc0000","0002222222222000",
            "0000222222220000","0000000000000000"
        ],
        [ // 3: Cannon
            "0000000000000000","0000008888000000","0000008888000000","0000008888000000",
            "0000008888000000","0000118888110000","0001918888191000","0001918888191000",
            "0000118888110000","0000000000000000"
        ],
        [ // 4: Gorilla
            "0000000000000000","0000002222000000","0000022222200000","0000221221220000",
            "0002222222222000","0022222222222200","0022222222222200","0022022222202200",
            "0022022222202200","0000000000000000"
        ],
        [ // 5: Tomato
            "0000000660000000","0000006666000000","0000033333000000","0000333333300000",
            "0003333333330000","0003333333330000","0003333333330000","0000333333300000",
            "0000033333000000","0000000000000000"
        ],
        [ // 6: Sanma Carrot
            "0000000500000000","0000005250000000","0000055555000000","0000055555000000",
            "0000077777000000","0000077777000000","0000077777000000","0000007770000000",
            "0000000700000000","0000000000000000"
        ],
        [ // 7: Broccoli 
            "0000006666000000","0000666666660000","0006666666666000","0000666666660000",
            "0000006666000000","0000077777700000","0000771771770000","0000777777770000",
            "0000077777700000","0000770000770000"
        ]
    ],

    TETROMINOS: [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[1,0,0],[1,1,1]], // L
      [[0,0,1],[1,1,1]], // J
      [[1,1,0],[0,1,1]], // S
      [[0,1,1],[1,1,0]]  // Z
    ],

    diffSet: [
        { name: 'NORMAL', spd: 0.8, intv: 90, gimmick: false, col: '#0ff' },
        { name: 'HARD',   spd: 1.4, intv: 60, gimmick: false, col: '#f00' },
        { name: 'EXPERT', spd: 1.8, intv: 45, gimmick: true,  col: '#a0f' }
    ],

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.shipIdx = 0; this.diff = 0;
        this.stars = [];
        for(let i=0; i<50; i++) { this.stars.push({x: Math.random()*200, y: Math.random()*300, s: Math.random()*2+1}); }
        if(typeof BGM !== 'undefined') BGM.play('menu');
    },

    startGame() {
        this.st = 'play'; this.tmr = 0; this.score = 0;
        this.px = 100; this.bullets = []; this.blocks = []; this.parts = [];
        if(typeof BGM !== 'undefined') BGM.play('action');
    },

    spawnTetromino() {
        let shape = this.TETROMINOS[Math.floor(Math.random() * this.TETROMINOS.length)];
        let sx = Math.random() * 140 + 20;
        let sy = -40;
        
        let isGimmick = this.diffSet[this.diff].gimmick;
        let type = 'normal';
        if (isGimmick) {
            let r = Math.random();
            if (r < 0.15) type = 'meteor';
            else if (r < 0.30) type = 'slide';
        }

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    this.blocks.push({
                        x: sx + c * 14, y: sy + r * 14, bx: sx + c * 14,
                        w: 12, h: 12, type: type, tmr: 0, dead: false
                    });
                }
            }
        }
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        // --- 星空スクロール ---
        let bgSpd = (keys.b && this.st === 'play') ? 5 : 1;
        for (let s of this.stars) {
            s.y += s.s * bgSpd;
            if (s.y > 300) { s.y = 0; s.x = Math.random()*200; }
        }

        // ================= TITLE =================
        if (this.st === 'title') {
            if (keysDown.a) { this.st = 'ship_select'; this.playSE('jmp'); }
            return;
        }

        // ================= SHIP SELECT =================
        if (this.st === 'ship_select') {
            if (keysDown.right) { this.shipIdx = (this.shipIdx + 1) % 8; this.playSE('sel'); }
            if (keysDown.left) { this.shipIdx = (this.shipIdx - 1 + 8) % 8; this.playSE('sel'); }
            if (keysDown.a) { this.st = 'diff_select'; this.playSE('jmp'); }
            if (keysDown.b) { this.st = 'title'; this.playSE('hit'); }
            return;
        }

        // ================= DIFFICULTY SELECT =================
        if (this.st === 'diff_select') {
            if (keysDown.down) { this.diff = (this.diff + 1) % 3; this.playSE('sel'); }
            if (keysDown.up) { this.diff = (this.diff - 1 + 3) % 3; this.playSE('sel'); }
            if (keysDown.a) { this.startGame(); this.playSE('combo'); }
            if (keysDown.b) { this.st = 'ship_select'; this.playSE('hit'); }
            return;
        }

        // ================= GAMEOVER =================
        if (this.st === 'gameover') {
            if (this.tmr > 60 && (keysDown.a || keysDown.b)) {
                if (this.score > this.hiScore) this.hiScore = this.score;
                this.st = 'title';
            }
            return;
        }

        // ================= PLAY =================
        let dSet = this.diffSet[this.diff];
        
        // 自機移動
        if (keys.left) this.px -= 3;
        if (keys.right) this.px += 3;
        this.px = Math.max(10, Math.min(190, this.px));

        // 黄金のトマト専用エフェクト
        if (this.shipIdx === 5 && this.tmr % 3 === 0) {
            this.parts.push({ x: this.px + (Math.random()-0.5)*16, y: this.py + 8, vx: 0, vy: 1, life: 20, maxLife: 20, col: '#ff0', type: 'sparkle' });
        }

        // 弾発射 (A押しっぱなしで連射)
        if (keys.a && this.tmr % 6 === 0) {
            let bCol = this.SHIPS_INFO[this.shipIdx].col;
            if (bCol === 'rainbow') bCol = `hsl(${(this.tmr*10)%360}, 100%, 50%)`;
            this.bullets.push({ x: this.px, y: this.py - 10, vy: -8, col: bCol });
            this.playSE('sel');
            
            // マズルフラッシュ
            this.parts.push({ x: this.px, y: this.py - 12, vx: 0, vy: 0, life: 5, maxLife: 5, col: '#fff', type: 'flash' });
        }

        // 弾の更新
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y += b.vy;
            // 弾の残像
            this.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 10, maxLife: 10, col: b.col, type: 'trail' });
            if (b.y < -10) this.bullets.splice(i, 1);
        }

        // ブロック生成
        if (this.tmr % dSet.intv === 0) this.spawnTetromino();

        // Bボタンで全体加速
        let fallBonus = keys.b ? 3.0 : 0;

        // ブロックの更新
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            let blk = this.blocks[i];
            blk.tmr++;

            let currentSpd = dSet.spd + fallBonus;

            // 変則ムーブ処理
            if (blk.type === 'slide') {
                blk.y += currentSpd;
                blk.x = blk.bx + Math.sin(blk.tmr * 0.1) * 30;
            } 
            else if (blk.type === 'meteor') {
                if (blk.tmr < 40) {
                    // 滞空して震える
                    blk.y += currentSpd * 0.2;
                    blk.x = blk.bx + (Math.random() - 0.5) * 4;
                } else {
                    // 急降下
                    blk.y += currentSpd * 3.5;
                    this.parts.push({ x: blk.x+6, y: blk.y, vx: 0, vy: -2, life: 10, maxLife: 10, col: '#f00', type: 'trail' });
                }
            } 
            else {
                blk.y += currentSpd;
            }

            // 当たり判定 (弾 vs ブロック)
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j];
                if (b.x > blk.x && b.x < blk.x + blk.w && b.y > blk.y && b.y < blk.y + blk.h) {
                    blk.dead = true;
                    this.bullets.splice(j, 1);
                    this.playSE('hit'); this.shakeCam(3);
                    
                    // 破壊エフェクト
                    let pCol = blk.type === 'meteor' ? '#f00' : (blk.type === 'slide' ? '#0f0' : '#0ff');
                    for(let k=0; k<8; k++) {
                        this.parts.push({ x: blk.x+6, y: blk.y+6, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 20, maxLife: 20, col: pCol, type: 'shard' });
                    }
                    
                    // スコア加算
                    if (blk.type === 'meteor') this.score += 50;
                    else if (blk.type === 'slide') this.score += 30;
                    else this.score += 10;
                    break;
                }
            }

            // Bボタン加速によるスコア
            if (fallBonus > 0 && this.tmr % 10 === 0) this.score += 1;

            if (blk.dead) { this.blocks.splice(i, 1); continue; }

            // 防衛ライン(y=280)を越えたらゲームオーバー
            if (blk.y + blk.h > 280) {
                this.st = 'gameover'; this.tmr = 0;
                this.playSE('hit'); this.shakeCam(20);
                for(let k=0; k<30; k++) {
                    this.parts.push({ x: this.px, y: this.py, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 40, maxLife: 40, col: '#f80', type: 'shard' });
                }
                if(typeof BGM !== 'undefined') BGM.stop();
            }
        }

        // パーティクル更新
        for (let i = this.parts.length - 1; i >= 0; i--) {
            let p = this.parts[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) this.parts.splice(i, 1);
        }
    },

    drawSpriteData(x, y, data, scale, isRainbow) {
        if(!data) return;
        for (let row = 0; row < data.length; row++) {
            for (let col = 0; col < data[row].length; col++) {
                let p = data[row][col];
                if (p !== '0') {
                    if (isRainbow) ctx.fillStyle = `hsl(${(this.tmr*5 + row*10)%360}, 100%, 50%)`;
                    else ctx.fillStyle = this.PAL[p] || '#fff';
                    ctx.fillRect(x + col * scale - (data[row].length*scale)/2, y + row * scale - (data.length*scale)/2, scale, scale);
                }
            }
        }
    },

    draw() {
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);

        // 星空
        for (let s of this.stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.s/3})`;
            ctx.fillRect(s.x, s.y, s.s, s.s);
        }

        // ================= TITLE =================
        if (this.st === 'title') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 22px "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('TETRIVADER', 100, 100);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px "Arial Black", sans-serif';
            ctx.fillText('V2', 160, 120);
            
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('- REMAKE EDITION -', 100, 140);
            
            if (this.tmr % 60 < 30) { ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 100, 220); }
            ctx.fillStyle = '#888'; ctx.fillText(`HI-SCORE: ${this.hiScore}`, 100, 280);
            ctx.textAlign = 'left';
            return;
        }

        // ================= SHIP SELECT =================
        if (this.st === 'ship_select') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('- SHIP SELECT -', 100, 40);
            
            // 自機を大きく描画
            let isRainbow = (this.shipIdx === 4);
            this.drawSpriteData(100, 140, this.SPRITES[this.shipIdx], 4, isRainbow);
            
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(this.SHIPS_INFO[this.shipIdx].name, 100, 220);
            
            ctx.fillStyle = '#ff0'; ctx.font = '16px monospace';
            if (this.tmr % 30 < 15) { ctx.fillText('◀', 20, 140); ctx.fillText('▶', 180, 140); }
            
            ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('A: 決定   B: 戻る', 100, 280);
            ctx.textAlign = 'left';
            return;
        }

        // ================= DIFF SELECT =================
        if (this.st === 'diff_select') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('- DIFFICULTY -', 100, 40);
            
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = this.diff === i ? this.diffSet[i].col : '#555';
                ctx.font = this.diff === i ? 'bold 16px monospace' : '12px monospace';
                ctx.fillText((this.diff === i ? '▶ ' : '') + this.diffSet[i].name, 100, 120 + i * 40);
            }
            
            ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('A: 出撃   B: 戻る', 100, 280);
            ctx.textAlign = 'left';
            return;
        }

        // ================= PLAY / GAMEOVER =================
        // 防衛ライン
        ctx.strokeStyle = '#f00'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 280); ctx.lineTo(200, 280); ctx.stroke();
        ctx.fillStyle = 'rgba(255,0,0,0.2)'; ctx.fillRect(0, 280, 200, 20);

        // 弾
        for (let b of this.bullets) {
            ctx.fillStyle = b.col; ctx.fillRect(b.x - 2, b.y - 6, 4, 12);
        }

        // ブロック
        for (let blk of this.blocks) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            if (blk.type === 'slide') { ctx.fillStyle = '#0a0'; ctx.strokeStyle = '#0f0'; }
            else if (blk.type === 'meteor') { 
                ctx.fillStyle = blk.tmr < 40 ? '#800' : '#f00'; 
                ctx.strokeStyle = '#f55'; 
            }
            else { ctx.fillStyle = '#05a'; ctx.strokeStyle = '#0ff'; }
            
            ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
            ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
            
            // 模様
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(blk.x+2, blk.y+2, 4, 4);
        }

        // パーティクル
        for (let p of this.parts) {
            let alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.col;
            if (p.type === 'shard') ctx.fillRect(p.x, p.y, 3, 3);
            else if (p.type === 'trail') ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
            else if (p.type === 'flash') { ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI*2); ctx.fill(); }
            else if (p.type === 'sparkle') { ctx.fillRect(p.x, p.y, 2, 2); }
            ctx.globalAlpha = 1.0;
        }

        // 自機 (ゲームオーバー時は描画しない)
        if (this.st === 'play') {
            let isRainbow = (this.shipIdx === 4);
            this.drawSpriteData(this.px, this.py, this.SPRITES[this.shipIdx], 2, isRainbow);
        }

        // UI
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`SCORE: ${this.score}`, 5, 15);
        ctx.fillStyle = this.diffSet[this.diff].col;
        ctx.fillText(`[${this.diffSet[this.diff].name}]`, 140, 15);

        // GAMEOVER
        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 300);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#f00'; ctx.font = 'bold 24px "Arial Black", sans-serif';
            ctx.fillText('GAME OVER', 100, 120);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, 100, 160);
            if (this.tmr > 60) {
                ctx.fillStyle = '#ff0'; ctx.font = '10px monospace';
                ctx.fillText('PRESS [A] TO RETURN', 100, 220);
            }
            ctx.textAlign = 'left';
        }
    }
};
