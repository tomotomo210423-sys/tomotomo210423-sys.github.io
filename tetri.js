// === TETRIVADER V2 (Remake & Action Edition) ===
// 究極の操作性と迫力を追求したリメイク版

const Tetri = {
    // 状態管理
    st: 'title', tmr: 0, score: 0, hiScore: 0,
    shipIdx: 0, diff: 0, 
    px: 100, py: 260,
    bullets: [], blocks: [], parts: [], stars: [],
    
    // ★ 外部との衝突を防ぐため、オブジェクト内に収納
    playSE(id) { if(typeof playSnd === 'function') playSnd(id); },
    shakeCam(val) { if(typeof screenShake === 'function') screenShake(val); },

    // カラーパレット (より鮮やかに調整)
    PAL: { '0':null, '1':'#000', '2':'#fff', '3':'#ff0', '4':'#f00', '5':'#0ff', '6':'#0f0', '7':'#f80', '8':'#888', '9':'#ccc', 'a':'#f0f', 'b':'#840', 'c':'#ff8', 'd':'#00f', 'e':'#f55', 'f':'#afa' },

    SHIPS_INFO: [
        { name: '標準 (FIGHTER V2)', col: '#fff' },
        { name: '完熟バナナ', col: '#ff0' },
        { name: '激辛ペペロンチーノ', col: '#f00' },
        { name: '重戦車大砲', col: '#888' },
        { name: '虹色の野生ゴリラ', col: 'rainbow' }, 
        { name: 'キラキラ黄金トマト', col: '#ff0' },  
        { name: 'サンマ人参 mk-II', col: '#0ff' },
        { name: '悟りブロッコリー神', col: '#0f0' } 
    ],

    // ★ 自機ドット絵をより精細に（16x16ベースだが、描画時に陰影などを追加）
    SPRITES: [
        [ // 0: Fighter V2 (陰影とディテール追加)
            "0000000220000000","0000009229000000","0000002222000000","0000092442900000",
            "0000922442290000","0009222222229000","0092222222222900","0920222222220290",
            "0900022222200090","0000092442900000","0000004444000000"
        ],
        [ // 1: Banana (質感と黒い点を追加)
            "00000000000000b0","0000000000000bb0","0000000000033300","0000000003331000",
            "0000000333100000","0000033310000000","0003331010000000","0033310000000000",
            "0330000000000000","0b00000000000000"
        ],
        [ // 2: Peperoncino (グラデーションと葉っぱ)
            "0000000000000000","0000000000000000","0000000060000000","0000006666000000",
            "0000066e66600000","0000666666e00000","0000eeeeeeee0000","0004444444444000",
            "0000444444440000","0000000000000000"
        ],
        [ // 3: Cannon (質感とキャタピラ)
            "0000000000000000","0000008888000000","0000001111000000","0000008888000000",
            "0000001111000000","0000998888990000","0009198888919000","0009198888919000",
            "0000998888990000","0000000000000000"
        ],
        [ // 4: Gorilla (顔の表情と筋肉)
            "0000000000000000","0000009999000000","0000091991900000","0000999199990000",
            "0009992222999000","0099992c22999900","0099992222999900","0099099999909900",
            "0099099999909900","0000000000000000"
        ],
        [ // 5: Tomato (キラキラと葉)
            "0000000660000000","0000006f66000000","0000044444000000","0000444e44400000",
            "0004444e444e0000","0004e44444e40000","0004e4444e440000","000044e444400000",
            "0000044444000000","0000000000000000"
        ],
        [ // 6: Sanma Carrot (目のリアリティ)
            "0000000100000000","000000d1d0000000","00000ddddd000000","00000d2d2d000000",
            "0000077777000000","0000073737000000","0000077777000000","0000007770000000",
            "0000000700000000","0000000000000000"
        ],
        [ // 7: Broccoli (房のディテール)
            "0000006f66000000","00006f66f6660000","00066f6f66f66000","000066f66f660000",
            "0000006666000000","0000077777700000","0000772772770000","0000777777770000",
            "0000077777700000","0000770000770000"
        ]
    ],

    // ★ ブロックを巨大化 (テトリスと同じくらい)
    TETROMINOS: [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[1,0,0],[1,1,1]], // L
      [[0,0,1],[1,1,1]], // J
      [[1,1,0],[0,1,1]], // S
      [[0,1,1],[1,1,0]]  // Z
    ],

    // 難易度設定 (スピードと間隔を全体的にアップ)
    diffSet: [
        { name: 'NORMAL+', spd: 1.0, intv: 80, gimmick: false, col: '#0ff' },
        { name: 'HARD+',   spd: 1.6, intv: 50, gimmick: false, col: '#f00' },
        { name: 'EXPERT+', spd: 2.0, intv: 40, gimmick: true,  col: '#a0f' }
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
        // 生成範囲をブロックサイズに合わせて調整
        let sx = Math.random() * 100 + 30; 
        let sy = -60;
        
        let isGimmick = this.diffSet[this.diff].gimmick;
        let type = 'normal';
        if (isGimmick) {
            let r = Math.random();
            if (r < 0.15) type = 'meteor';
            else if (r < 0.30) type = 'slide';
        }

        // ★ ブロックサイズを 20x20、間隔を 22 に巨大化
        const B_SIZE = 20;
        const B_INTV = 22;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    this.blocks.push({
                        x: sx + c * B_INTV, y: sy + r * B_INTV, bx: sx + c * B_INTV,
                        w: B_SIZE, h: B_SIZE, type: type, tmr: 0, dead: false
                    });
                }
            }
        }
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        // --- 星空スクロール ---
        let bgSpd = (keys.b && this.st === 'play') ? 6 : 1.5;
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
        
        // ★ 自機移動速度アップ (操作性改善)
        if (keys.left) this.px -= 4;
        if (keys.right) this.px += 4;
        this.px = Math.max(12, Math.min(188, this.px));

        // 黄金のトマト専用エフェクト (より派手に)
        if (this.shipIdx === 5 && this.tmr % 2 === 0) {
            this.parts.push({ x: this.px + (Math.random()-0.5)*20, y: this.py + 8, vx: 0, vy: 1.5, life: 25, maxLife: 25, col: `hsl(${60+Math.random()*10}, 100%, 70%)`, type: 'sparkle' });
        }

        // ★ 弾発射の連射速度大幅アップ (操作性改善: 6フレームから3フレームへ)
        if (keys.a && this.tmr % 3 === 0) {
            let bCol = this.SHIPS_INFO[this.shipIdx].col;
            if (bCol === 'rainbow') bCol = `hsl(${(this.tmr*15)%360}, 100%, 60%)`;
            // 弾を少し太く
            this.bullets.push({ x: this.px, y: this.py - 10, vy: -9, col: bCol });
            this.playSE('sel');
            
            // マズルフラッシュも派手に
            this.parts.push({ x: this.px, y: this.py - 12, vx: 0, vy: 0, life: 6, maxLife: 6, col: '#fff', type: 'flash' });
        }

        // 弾の更新
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.y += b.vy;
            // 弾の残像
            this.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 12, maxLife: 12, col: b.col, type: 'trail' });
            if (b.y < -15) this.bullets.splice(i, 1);
        }

        // ブロック生成
        if (this.tmr % dSet.intv === 0) this.spawnTetromino();

        // Bボタンで全体加速 (さらにスピーディーに)
        let fallBonus = keys.b ? 4.0 : 0;

        // ブロックの更新
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            let blk = this.blocks[i];
            blk.tmr++;

            let currentSpd = dSet.spd + fallBonus;

            // 変則ムーブ処理 (巨大化に合わせて調整)
            if (blk.type === 'slide') {
                blk.y += currentSpd;
                blk.x = blk.bx + Math.sin(blk.tmr * 0.08) * 40;
            } 
            else if (blk.type === 'meteor') {
                if (blk.tmr < 35) {
                    // 滞空して震える
                    blk.y += currentSpd * 0.15;
                    blk.x = blk.bx + (Math.random() - 0.5) * 6;
                } else {
                    // 超急降下
                    blk.y += currentSpd * 4.0;
                    this.parts.push({ x: blk.x + blk.w/2, y: blk.y, vx: 0, vy: -3, life: 12, maxLife: 12, col: '#f00', type: 'trail' });
                }
            } 
            else {
                blk.y += currentSpd;
            }

            // ★ 当たり判定 (弾 vs 巨大ブロック: 判定範囲を拡大)
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j];
                // ブロックの中心で判定
                if (b.x > blk.x - 4 && b.x < blk.x + blk.w + 4 && b.y > blk.y && b.y < blk.y + blk.h) {
                    blk.dead = true;
                    this.bullets.splice(j, 1);
                    this.playSE('hit'); this.shakeCam(4);
                    
                    // 破壊エフェクトを大量に
                    let pCol = blk.type === 'meteor' ? '#f00' : (blk.type === 'slide' ? '#0f0' : '#0ff');
                    for(let k=0; k<12; k++) {
                        this.parts.push({ x: blk.x + blk.w/2, y: blk.y + blk.h/2, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 25, maxLife: 25, col: pCol, type: 'shard' });
                    }
                    
                    // スコア加算
                    if (blk.type === 'meteor') this.score += 50;
                    else if (blk.type === 'slide') this.score += 30;
                    else this.score += 10;
                    break;
                }
            }

            // Bボタン加速によるスコア (さらに稼げるように)
            if (fallBonus > 0 && this.tmr % 8 === 0) this.score += 2;

            if (blk.dead) { this.blocks.splice(i, 1); continue; }

            // 防衛ライン(y=280)を越えたらゲームオーバー
            if (blk.y + blk.h > 280) {
                this.st = 'gameover'; this.tmr = 0;
                this.playSE('hit'); this.shakeCam(25);
                for(let k=0; k<40; k++) {
                    this.parts.push({ x: this.px, y: this.py, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 50, maxLife: 50, col: '#f80', type: 'shard' });
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
                    if (isRainbow) ctx.fillStyle = `hsl(${(this.tmr*7 + row*12)%360}, 100%, 60%)`;
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
            ctx.fillStyle = `rgba(255, 255, 255, ${s.s/2.5})`;
            ctx.fillRect(s.x, s.y, s.s, s.s);
        }

        // ================= TITLE =================
        if (this.st === 'title') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 24px "Arial Black", sans-serif';
            ctx.textAlign = 'center'; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.fillText('TETRIVADER', 100, 100);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 18px "Arial Black", sans-serif'; ctx.shadowColor = '#ff0';
            ctx.fillText('V2', 165, 120);
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('- REMAKE V2.1 -', 100, 145);
            
            if (this.tmr % 50 < 25) { ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace'; ctx.fillText('PRESS [A] TO START', 100, 220); }
            ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText(`HI-SCORE: ${this.hiScore}`, 100, 280);
            ctx.textAlign = 'left';
            return;
        }

        // ================= SHIP SELECT =================
        if (this.st === 'ship_select') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('- SHIP SELECT -', 100, 40);
            
            // 自機を大きく描画 (さらに拡大して見やすく)
            let isRainbow = (this.shipIdx === 4);
            this.drawSpriteData(100, 140, this.SPRITES[this.shipIdx], 5, isRainbow);
            
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
            ctx.fillText(this.SHIPS_INFO[this.shipIdx].name, 100, 225);
            
            ctx.fillStyle = '#ff0'; ctx.font = '18px monospace';
            if (this.tmr % 26 < 13) { ctx.fillText('◀', 25, 140); ctx.fillText('▶', 175, 140); }
            
            ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('A: 決定   B: 戻る', 100, 285);
            ctx.textAlign = 'left';
            return;
        }

        // ================= DIFF SELECT =================
        if (this.st === 'diff_select') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 15px monospace'; ctx.fillText('- DIFFICULTY -', 100, 45);
            
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = this.diff === i ? this.diffSet[i].col : '#555';
                ctx.font = this.diff === i ? 'bold 18px monospace' : '13px monospace';
                ctx.fillText((this.diff === i ? '▶ ' : '') + this.diffSet[i].name, 100, 125 + i * 45);
            }
            
            ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.fillText('A: 出撃   B: 戻る', 100, 285);
            ctx.textAlign = 'left';
            return;
        }

        // ================= PLAY / GAMEOVER =================
        // 防衛ライン (より危険に)
        ctx.strokeStyle = '#f00'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 280); ctx.lineTo(200, 280); ctx.stroke();
        ctx.fillStyle = 'rgba(255,0,0,0.3)'; ctx.fillRect(0, 280, 200, 20);

        // 弾 (少し太く)
        for (let b of this.bullets) {
            ctx.fillStyle = b.col; ctx.fillRect(b.x - 2.5, b.y - 7, 5, 14);
            // 芯を入れる
            ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 1, b.y - 5, 2, 10);
        }

        // ブロック (巨大化＆演出強化)
        for (let blk of this.blocks) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
            if (blk.type === 'slide') { ctx.fillStyle = '#080'; ctx.strokeStyle = '#0f0'; }
            else if (blk.type === 'meteor') { 
                ctx.fillStyle = blk.tmr < 35 ? '#800' : '#f33'; 
                ctx.strokeStyle = '#f88'; 
                // メテオは影をつける
                if (blk.tmr >= 35) {
                    ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
                }
            }
            else { ctx.fillStyle = '#049'; ctx.strokeStyle = '#0ff'; }
            
            ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
            ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
            ctx.shadowBlur = 0; // リセット
            
            // 模様 (より複雑に)
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(blk.x+3, blk.y+3, 6, 6);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(blk.x+11, blk.y+11, 6, 6);
        }

        // パーティクル
        for (let p of this.parts) {
            let alpha = Math.max(0, p.life / p.maxLife);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.col;
            if (p.type === 'shard') ctx.fillRect(p.x, p.y, 3.5, 3.5);
            else if (p.type === 'trail') ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
            else if (p.type === 'flash') { ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); }
            else if (p.type === 'sparkle') { ctx.fillRect(p.x, p.y, 2.5, 2.5); }
            ctx.globalAlpha = 1.0;
        }

        // 自機 (描画サイズを少し大きく V2)
        if (this.st === 'play') {
            let isRainbow = (this.shipIdx === 4);
            this.drawSpriteData(this.px, this.py, this.SPRITES[this.shipIdx], 2.2, isRainbow);
        }

        // UI
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`SCORE: ${this.score}`, 5, 16);
        ctx.fillStyle = this.diffSet[this.diff].col;
        ctx.textAlign = 'right';
        ctx.fillText(`[${this.diffSet[this.diff].name}]`, 195, 16);
        ctx.textAlign = 'left';

        // GAMEOVER
        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 200, 300);
            ctx.textAlign = 'center'; ctx.shadowBlur = 15; ctx.shadowColor = '#f00';
            ctx.fillStyle = '#f00'; ctx.font = 'bold 26px "Arial Black", sans-serif';
            ctx.fillText('GAME OVER', 100, 120);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, 100, 165);
            if (this.tmr > 60) {
                ctx.fillStyle = '#ff0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('PRESS [A] TO RETURN', 100, 230);
            }
            ctx.textAlign = 'left';
        }
    }
};
