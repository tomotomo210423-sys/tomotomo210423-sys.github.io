// === TETRIVADER V2 (Remake & Action Edition) ===

const Tetri = {
    // 状態管理
    st: 'title', tmr: 0, score: 0, hiScore: 0,
    shipIdx: 0, diff: 0, 
    px: 100, py: 260,
    bullets: [], blocks: [], parts: [], stars: [],
    
    // 弾幕モード用変数
    starFall: false, starX: 0, starY: 0,
    danmakuMode: false, danmakuTimer: 0, danmakuBullets: [], playerHit: false, scoreBeforeDanmaku: 0,

    // ★ EXPERT限定シールド
    shields: 0, shieldUses: 0,

    // ★ NEW RECORD表示
    newRecord: false, newRecordTmr: 0,

    // ★ タイトルブロックアニメ
    titleBlocks: [],

    playSE(id) { if(typeof playSnd === 'function') playSnd(id); },
    shakeCam(val) { if(typeof screenShake === 'function') screenShake(val); },

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

    SPRITES: [
        // [0] 標準戦闘機: 対称シャープファイター、先端が細く後端に噴射口
        [ "0000001110000000",
          "0000012210000000",
          "0000122221000000",
          "0001222122100000",
          "0012221122210000",
          "0122211112221000",
          "0125511115521000",
          "0012222222210000",
          "0001988899810000",
          "0000199999100000" ],
        // [1] 完熟バナナ: 曲がった形、黄色メイン
        [ "0000000013000000",
          "0000000133300000",
          "0000001333b00000",
          "0000013c3b000000",
          "0000133cb0000000",
          "0001333b00000000",
          "0013c3b000000000",
          "0133b00000000000",
          "013b000000000000",
          "0b0000000000000b" ],
        // [2] 激辛ペペロンチーノ: ペッパー型、緑/赤/オレンジ
        [ "0000000600000000",
          "0000006660000000",
          "0000064640000000",
          "0000646640000000",
          "0006e6464e000000",
          "006e7646466e0000",
          "006e7777466e0000",
          "0006e74744e00000",
          "0000647444000000",
          "0000044440000000" ],
        // [3] 重戦車大砲: 砲台型、灰色のごつい形
        [ "0000009900000000",
          "0000099990000000",
          "0000899998000000",
          "0000898898000000",
          "0008888888800000",
          "0099999999990000",
          "0091999999190000",
          "0091999999190000",
          "0099999999990000",
          "0000000000000000" ],
        // [4] 虹色ゴリラ: ゴリラシルエット、マゼンタ中心
        [ "0001100011000000",
          "0019900099100000",
          "0099a2aa29900000",
          "0099a22a29900000",
          "0009922299900000",
          "0009aaaa99000000",
          "0099aaaa99900000",
          "0991a00a19900000",
          "0990000000990000",
          "0000000000000000" ],
        // [5] キラキラ黄金トマト: トマト型、黄色/金色、丸い
        [ "0000006600000000",
          "0000066660000000",
          "0000364360000000",
          "0003c3336c300000",
          "0033c3333c330000",
          "003ccf3ffcc30000",
          "0033cc3fcc330000",
          "0003333333c30000",
          "0000333333000000",
          "0000043340000000" ],
        // [6] サンマ人参mk-II: 細長い青緑体、人参オレンジアクセント
        [ "0000000100000000",
          "0000005d50000000",
          "0000055d55000000",
          "000055d2d5500000",
          "000057d2d7500000",
          "0000077d77000000",
          "0000757777500000",
          "0000005555000000",
          "0000000700000000",
          "0000000000000000" ],
        // [7] 悟りブロッコリー神: ブロッコリー型、緑、木状シルエット
        [ "0000006660000000",
          "0000666f66000000",
          "0006f66f66f60000",
          "0006666666660000",
          "0000666f66000000",
          "0000066660000000",
          "0000007700000000",
          "0000077770000000",
          "0000077770000000",
          "0000066660000000" ]
    ],

    SPRITE_STAR: "0001000000111000011111001111111001111100001110000001000000000000",

    TETROMINOS: [
      { s: [[1,1,1,1]], c: '#0ff' }, // I
      { s: [[1,1],[1,1]], c: '#ff0' }, // O
      { s: [[0,1,0],[1,1,1]], c: '#a0f' }, // T
      { s: [[1,0,0],[1,1,1]], c: '#f80' }, // L
      { s: [[0,0,1],[1,1,1]], c: '#00f' }, // J
      { s: [[0,1,1],[1,1,0]], c: '#0f0' }, // S
      { s: [[1,1,0],[0,1,1]], c: '#f00' }  // Z
    ],

    diffSet: [
        { name: 'NORMAL', spd: 1.0, intv: 80, gimmick: false, col: '#0ff' },
        { name: 'HARD',   spd: 1.5, intv: 55, gimmick: false, col: '#f00' },
        { name: 'EXPERT', spd: 1.8, intv: 45, gimmick: true,  col: '#a0f' }
    ],

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.shipIdx = 0; this.diff = 0;
        this.hiScore = SaveSys.data.tetriHi || 0;
        this.stars = [];
        for(let i=0; i<50; i++) { this.stars.push({x: Math.random()*200, y: Math.random()*300, s: Math.random()*2+1}); }
        // ★ タイトル用テトリミノ背景ブロック初期化
        this.titleBlocks = [];
        const TB_MINOS = [
            {s:[[1,1,1,1]],c:'rgba(0,255,255,0.18)'},
            {s:[[1,1],[1,1]],c:'rgba(255,255,0,0.18)'},
            {s:[[0,1,0],[1,1,1]],c:'rgba(160,0,255,0.18)'},
            {s:[[1,0,0],[1,1,1]],c:'rgba(255,128,0,0.18)'},
            {s:[[0,1,1],[1,1,0]],c:'rgba(0,255,0,0.18)'}
        ];
        for(let i=0;i<4;i++){
            let mino = TB_MINOS[Math.floor(Math.random()*TB_MINOS.length)];
            this.titleBlocks.push({shape:mino.s, c:mino.c, x:Math.random()*160+20, y:-60+Math.random()*100, spd:0.3+Math.random()*0.4});
        }
        if(typeof BGM !== 'undefined') BGM.play('menu');
    },

    startGame() {
        this.st = 'play'; this.tmr = 0; this.score = 0;
        this.px = 100; this.bullets = []; this.blocks = []; this.parts = [];
        this.danmakuMode = false; this.starFall = false;
        this.newRecord = false; this.newRecordTmr = 0;

        // ★ EXPERT限定：初期シールド付与 (最大5回使用)
        this.shields = (this.diff === 2) ? 1 : 0;
        this.shieldUses = (this.diff === 2) ? 5 : 0;
        
        if(typeof BGM !== 'undefined') BGM.play('action');
    },

    spawnTetromino() {
        let mino = this.TETROMINOS[Math.floor(Math.random() * this.TETROMINOS.length)];
        let shape = mino.s;
        let bCol = mino.c;
        let sx = Math.random() * 90 + 15; 
        let sy = -60;
        
        let isGimmick = this.diffSet[this.diff].gimmick;
        let type = 'normal';
        if (isGimmick) {
            let r = Math.random();
            if (r < 0.15) type = 'meteor';
            else if (r < 0.30) type = 'slide';
        }

        const B_SIZE = 20, B_INTV = 22;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[r].length; c++) {
                if (shape[r][c] === 1) {
                    this.blocks.push({
                        x: sx + c * B_INTV, y: sy + r * B_INTV, bx: sx + c * B_INTV,
                        w: B_SIZE, h: B_SIZE, type: type, c: bCol, tmr: 0, dead: false
                    });
                }
            }
        }

        if (!this.starFall && !this.danmakuMode && this.diff >= 1 && Math.random() < 0.15) {
            this.starFall = true;
            this.starY = -20;
            this.starX = 20 + Math.random() * 160;
        }
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        let bgSpd = (keys.b && this.st === 'play' && !this.danmakuMode) ? 6 : 1.5;
        for (let s of this.stars) {
            s.y += s.s * bgSpd;
            if (s.y > 300) { s.y = 0; s.x = Math.random()*200; }
        }

        if (this.st === 'title') {
            if (keysDown.a) { this.st = 'ship_select'; this.playSE('jmp'); }
            return;
        }

        if (this.st === 'ship_select') {
            if (keysDown.right) { this.shipIdx = (this.shipIdx + 1) % 8; this.playSE('sel'); }
            if (keysDown.left) { this.shipIdx = (this.shipIdx - 1 + 8) % 8; this.playSE('sel'); }
            if (keysDown.a) { this.st = 'diff_select'; this.playSE('jmp'); }
            if (keysDown.b) { this.st = 'title'; this.playSE('hit'); }
            return;
        }

        if (this.st === 'diff_select') {
            if (keysDown.down) { this.diff = (this.diff + 1) % 3; this.playSE('sel'); }
            if (keysDown.up) { this.diff = (this.diff - 1 + 3) % 3; this.playSE('sel'); }
            if (keysDown.a) { this.startGame(); this.playSE('combo'); }
            if (keysDown.b) { this.st = 'ship_select'; this.playSE('hit'); }
            return;
        }

        if (this.st === 'gameover') {
            if (this.tmr === 1) {
                if (this.score > this.hiScore) {
                    this.hiScore = this.score;
                    SaveSys.data.tetriHi = this.hiScore;
                    SaveSys.save();
                    this.newRecord = true; this.newRecordTmr = 0;
                }
                SaveSys.addLog('テトリベーダー', `スコア: ${this.score}`);
            }
            if (this.newRecord) this.newRecordTmr++;
            if (this.tmr > 60 && (keysDown.a || keysDown.b)) {
                this.st = 'title';
            }
            return;
        }

        // ================= 弾幕モード (避けゲー) =================
        if (this.danmakuMode) {
            this.danmakuTimer--;
            
            if (keys.left) this.px -= 4;
            if (keys.right) this.px += 4;
            this.px = Math.max(12, Math.min(188, this.px));

            if (Math.random() < 0.1) {
                const pt = [
                    {x: Math.random() * 200, y: -10, vx: 0, vy: 2.5, type: 'normal'},
                    {x: Math.random() * 200, y: -10, vx: (Math.random() - 0.5) * 2.0, vy: 2.5, type: 'curve'},
                    {x: Math.random() * 200, y: -10, vx: 0, vy: 1.5, type: 'accel'}
                ];
                this.danmakuBullets.push(pt[Math.floor(Math.random() * pt.length)]);
            }

            for (let i = this.danmakuBullets.length - 1; i >= 0; i--) {
                let b = this.danmakuBullets[i];
                if (b.type === 'accel') b.vy += 0.05;
                b.x += b.vx; b.y += b.vy;
                
                if (Math.abs(b.x - this.px) < 6 && Math.abs(b.y - this.py) < 6) {
                    this.playerHit = true;
                    this.playSE('hit');
                    for(let k=0; k<15; k++) this.parts.push({x: this.px, y: this.py, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 30, maxLife: 30, col: '#f00', type: 'shard'});
                    this.shakeCam(10);
                    this.danmakuMode = false;
                    this.danmakuBullets = [];
                    return;
                }
                if (b.y > 310) this.danmakuBullets.splice(i, 1);
            }

            if (this.danmakuTimer <= 0) {
                this.danmakuMode = false;
                this.danmakuBullets = [];
                if (!this.playerHit) {
                    this.score *= 2; 
                    this.playSE('combo');
                    for(let k=0; k<20; k++) this.parts.push({x: 100, y: 150, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 40, maxLife: 40, col: '#ff0', type: 'shard'});
                    this.shakeCam(8);
                }
                this.playerHit = false;
            }
            
            for (let i = this.parts.length - 1; i >= 0; i--) {
                let p = this.parts[i];
                p.x += p.vx; p.y += p.vy; p.life--;
                if (p.life <= 0) this.parts.splice(i, 1);
            }
            return; 
        }

        // ================= PLAY (通常モード) =================
        let dSet = this.diffSet[this.diff];
        
        if (keys.left) this.px -= 4;
        if (keys.right) this.px += 4;
        this.px = Math.max(12, Math.min(188, this.px));

        if (this.shipIdx === 5 && this.tmr % 2 === 0) {
            this.parts.push({ x: this.px + (Math.random()-0.5)*20, y: this.py + 8, vx: 0, vy: 1.5, life: 25, maxLife: 25, col: `hsl(${60+Math.random()*10}, 100%, 70%)`, type: 'sparkle' });
        }

        if (keysDown.a) {
            let bCol = this.SHIPS_INFO[this.shipIdx].col;
            if (bCol === 'rainbow') bCol = `hsl(${(this.tmr*15)%360}, 100%, 60%)`;
            
            // ★ EXPERT限定：ツインブラスター (2発同時発射)
            if (this.diff === 2) {
                this.bullets.push({ x: this.px - 6, y: this.py - 10, vy: -9, col: bCol, trail: [] });
                this.bullets.push({ x: this.px + 6, y: this.py - 10, vy: -9, col: bCol, trail: [] });
            } else {
                this.bullets.push({ x: this.px, y: this.py - 10, vy: -9, col: bCol, trail: [] });
            }
            
            this.playSE('sel');
            this.parts.push({ x: this.px, y: this.py - 12, vx: 0, vy: 0, life: 6, maxLife: 6, col: '#fff', type: 'flash' });
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            if (!b.trail) b.trail = [];
            b.trail.unshift({x: b.x, y: b.y});
            if (b.trail.length > 3) b.trail.pop();
            b.y += b.vy;
            this.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 12, maxLife: 12, col: b.col, type: 'trail' });
            if (b.y < -15) this.bullets.splice(i, 1);
        }

        if (this.tmr % dSet.intv === 0) this.spawnTetromino();

        let fallBonus = keys.b ? 4.0 : 0;

        if (this.starFall) {
            this.starY += 1.5 + fallBonus;
            
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                let b = this.bullets[i];
                if (Math.abs(b.x - this.starX) < 15 && Math.abs(b.y - this.starY) < 15) {
                    this.starFall = false;
                    this.bullets.splice(i, 1);
                    this.playSE('hit');
                    for(let k=0; k<15; k++) this.parts.push({x: this.starX, y: this.starY, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 20, maxLife: 20, col: '#ff0', type: 'shard'});
                    break;
                }
            }
            
            if (this.starFall && this.starY >= 280) {
                this.starFall = false;
                this.scoreBeforeDanmaku = this.score;
                this.danmakuMode = true;
                this.danmakuTimer = [600, 480, 360][this.diff];
                this.danmakuBullets = [];
                this.playerHit = false;
                this.playSE('combo');
                this.shakeCam(5);
            }
        }

        for (let i = this.blocks.length - 1; i >= 0; i--) {
            let blk = this.blocks[i];
            blk.tmr++;

            let currentSpd = dSet.spd + fallBonus;

            if (blk.type === 'slide') {
                blk.y += currentSpd;
                blk.x = blk.bx + Math.sin(blk.tmr * 0.08) * 40;
            } 
            else if (blk.type === 'meteor') {
                if (blk.tmr < 35) {
                    blk.y += currentSpd * 0.15;
                    blk.x = blk.bx + (Math.random() - 0.5) * 6;
                } else {
                    blk.y += currentSpd * 2.5;
                    this.parts.push({ x: blk.x + blk.w/2, y: blk.y, vx: 0, vy: -3, life: 12, maxLife: 12, col: '#f00', type: 'trail' });
                }
            } 
            else {
                blk.y += currentSpd;
            }

            for (let j = this.bullets.length - 1; j >= 0; j--) {
                let b = this.bullets[j];
                if (b.x > blk.x - 4 && b.x < blk.x + blk.w + 4 && b.y > blk.y && b.y < blk.y + blk.h) {
                    blk.dead = true;
                    this.bullets.splice(j, 1);
                    this.playSE('hit'); this.shakeCam(4);
                    
                    let pCol = blk.type === 'meteor' ? '#f00' : (blk.type === 'slide' ? '#0f0' : blk.c);
                    for(let k=0; k<12; k++) {
                        this.parts.push({ x: blk.x + blk.w/2, y: blk.y + blk.h/2, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 25, maxLife: 25, col: pCol, type: 'shard' });
                    }
                    
                    if (blk.type === 'meteor') this.score += 50;
                    else if (blk.type === 'slide') this.score += 30;
                    else this.score += 10;
                    break;
                }
            }

            if (fallBonus > 0 && this.tmr % 8 === 0) this.score += 2;

            if (blk.dead) { this.blocks.splice(i, 1); continue; }

            // ★ 防衛ライン越え判定（シールド処理を追加）
            if (blk.y + blk.h > 280) {
                if (this.shields > 0 && this.shieldUses > 0) {
                    // シールド発動！(ボム効果)
                    this.shields--;
                    this.shieldUses--;
                    this.playSE('combo');
                    this.shakeCam(20);
                    
                    // 画面内の全ブロックを破壊
                    for (let b of this.blocks) {
                        let pCol = b.type === 'meteor' ? '#f00' : (b.type === 'slide' ? '#0f0' : b.c);
                        for(let k=0; k<8; k++) {
                            this.parts.push({ x: b.x + b.w/2, y: b.y + b.h/2, vx: (Math.random()-0.5)*8, vy: (Math.random()-0.5)*8, life: 30, maxLife: 30, col: pCol, type: 'shard' });
                        }
                        this.score += 10;
                    }
                    this.blocks = []; // 全消去
                    
                    // シールドブレイクのド派手なエフェクト
                    for(let k=0; k<25; k++) {
                        this.parts.push({ x: 100, y: 280, vx: (Math.random()-0.5)*15, vy: -(Math.random()*6 + 2), life: 40, maxLife: 40, col: '#0ff', type: 'shard' });
                    }
                    break; // ループを抜ける
                } else {
                    // 通常のゲームオーバー処理
                    this.st = 'gameover'; this.tmr = 0;
                    if(typeof BGM !== 'undefined') BGM.play('gameover');
                    this.playSE('hit'); this.shakeCam(25);
                    for(let k=0; k<40; k++) {
                        this.parts.push({ x: this.px, y: this.py, vx: (Math.random()-0.5)*10, vy: (Math.random()-0.5)*10, life: 50, maxLife: 50, col: '#f80', type: 'shard' });
                    }
                    if(typeof BGM !== 'undefined') BGM.stop();
                }
            }
        }

        for (let i = this.parts.length - 1; i >= 0; i--) {
            let p = this.parts[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) this.parts.splice(i, 1);
        }
    },

    drawSpriteData(x, y, data, scale, isRainbow) {
        if(!data) return;
        const key = `tetri_ship_${this.shipIdx}_${isRainbow}`;
        // キャッシュに存在しない場合は一時的に登録
        if (!window.sprs[key]) {
            window.sprs[key] = { w: data[0].length, h: data.length, d: data.join(''), pal: this.PAL };
        }
        const cached = SpriteCache.get(key, null, scale, false);
        if (cached) {
            ctx.drawImage(cached, x - cached.width/2, y - cached.height/2);
        }
    },
    
    drawStar(x, y) {
        let str = this.SPRITE_STAR;
        let s = 2.5;
        for(let i=0; i<64; i++) {
            if(str[i] === '1') {
                ctx.fillStyle = (this.tmr % 10 < 5) ? '#ff0' : '#fff';
                ctx.fillRect(x + (i%8)*s - 10, y + Math.floor(i/8)*s - 10, s, s);
            }
        }
    },

    draw() {
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);

        for (let s of this.stars) {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.s/2.5})`;
            ctx.fillRect(s.x, s.y, s.s, s.s);
        }

        if (this.st === 'title') {
            // ★ タイトルブロックアニメ (背景に落下するテトリミノ)
            const B_SZ = 16;
            for (let tb of this.titleBlocks) {
                tb.y += tb.spd;
                if (tb.y > 320) {
                    const TB_MINOS2 = [
                        {s:[[1,1,1,1]],c:'rgba(0,255,255,0.18)'},
                        {s:[[1,1],[1,1]],c:'rgba(255,255,0,0.18)'},
                        {s:[[0,1,0],[1,1,1]],c:'rgba(160,0,255,0.18)'},
                        {s:[[1,0,0],[1,1,1]],c:'rgba(255,128,0,0.18)'},
                        {s:[[0,1,1],[1,1,0]],c:'rgba(0,255,0,0.18)'}
                    ];
                    let nm = TB_MINOS2[Math.floor(Math.random()*TB_MINOS2.length)];
                    tb.shape = nm.s; tb.c = nm.c; tb.x = Math.random()*160+20; tb.y = -30; tb.spd = 0.3+Math.random()*0.4;
                }
                for (let r = 0; r < tb.shape.length; r++) {
                    for (let c = 0; c < tb.shape[r].length; c++) {
                        if (tb.shape[r][c] === 1) {
                            ctx.fillStyle = tb.c;
                            ctx.fillRect(tb.x + c*B_SZ, tb.y + r*B_SZ, B_SZ-1, B_SZ-1);
                        }
                    }
                }
            }

            ctx.fillStyle = '#0ff'; ctx.font = 'bold 24px "Arial Black", sans-serif';
            ctx.textAlign = 'center'; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.fillText('TETRIVADER', 100, 100);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 18px "Arial Black", sans-serif'; ctx.shadowColor = '#ff0';
            ctx.fillText('V2', 165, 120);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('- REMAKE V2.3 -', 100, 145);

            if (this.tmr % 50 < 25) { ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace'; ctx.fillText('PRESS [A] TO START', 100, 220); }
            ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText(`HI-SCORE: ${this.hiScore}`, 100, 280);
            ctx.textAlign = 'left';
            return;
        }

        if (this.st === 'ship_select') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('- SHIP SELECT -', 100, 40);
            
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

        if (this.st === 'diff_select') {
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 15px monospace'; ctx.fillText('- DIFFICULTY -', 100, 45);
            
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = this.diff === i ? this.diffSet[i].col : '#555';
                ctx.font = this.diff === i ? 'bold 18px monospace' : '13px monospace';
                ctx.fillText((this.diff === i ? '▶ ' : '') + this.diffSet[i].name, 100, 115 + i * 45);
                
                // ★ EXPERTの特権をUIに表示
                if (i === 2 && this.diff === 2) {
                    ctx.fillStyle = '#ff0'; ctx.font = '9px monospace';
                    ctx.fillText('W-SHOT / AUTO-SHIELD', 100, 130 + i * 45);
                }
            }
            
            ctx.fillStyle = '#888'; ctx.font = '11px monospace'; ctx.fillText('A: 出撃   B: 戻る', 100, 285);
            ctx.textAlign = 'left';
            return;
        }

        if (this.danmakuMode) {
            ctx.fillStyle = '#200'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('DANMAKU MODE!', 40, 30); 
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('SUCCESS = x2 SCORE!', 30, 50); 
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`TIME: ${Math.ceil(this.danmakuTimer / 60)}`, 70, 65);
            
            this.danmakuBullets.forEach(b => { 
                ctx.shadowBlur = 10; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; 
                ctx.beginPath(); ctx.arc(b.x, b.y, 6, 0, Math.PI * 2); ctx.fill(); 
                ctx.shadowBlur = 0; ctx.fillStyle = '#ff0'; 
                ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill(); 
                ctx.fillStyle = '#fff'; 
                ctx.beginPath(); ctx.arc(b.x, b.y, 1, 0, Math.PI * 2); ctx.fill(); 
            });
            
            let isRainbow = (this.shipIdx === 4);
            if (!this.playerHit) this.drawSpriteData(this.px, this.py, this.SPRITES[this.shipIdx], 2.2, isRainbow);
            
            if (this.shipIdx === 5 && this.tmr % 2 === 0) {
                this.parts.push({ x: this.px + (Math.random()-0.5)*20, y: this.py + 8, vx: 0, vy: 1.5, life: 25, maxLife: 25, col: `hsl(${60+Math.random()*10}, 100%, 70%)`, type: 'sparkle' });
            }
            for (let p of this.parts) {
                let alpha = Math.max(0, p.life / p.maxLife);
                ctx.globalAlpha = alpha; ctx.fillStyle = p.col;
                if (p.type === 'shard') ctx.fillRect(p.x, p.y, 3.5, 3.5);
                else if (p.type === 'sparkle') ctx.fillRect(p.x, p.y, 2.5, 2.5);
                ctx.globalAlpha = 1.0;
            }
            if (this.playerHit) { ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(0, 0, 200, 300); }
            return;
        }

        // ================= PLAY / GAMEOVER =================
        // ★ 防衛ライン (シールド状態を描画反映)
        if (this.shields > 0) {
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 3;
            ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.beginPath(); ctx.moveTo(0, 280); ctx.lineTo(200, 280); ctx.stroke();
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'; ctx.fillRect(0, 280, 200, 20);
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center'; ctx.fillText('AUTO SHIELD ACTIVE', 100, 293); ctx.textAlign = 'left';
        } else {
            ctx.strokeStyle = '#f00'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, 280); ctx.lineTo(200, 280); ctx.stroke();
            ctx.fillStyle = 'rgba(255,0,0,0.3)'; ctx.fillRect(0, 280, 200, 20);
        }

        if (this.starFall) this.drawStar(this.starX, this.starY);

        for (let b of this.bullets) {
            // ★ 弾トレイル (過去3フレームの位置を淡い円で描画)
            if (b.trail) {
                for (let ti = 0; ti < b.trail.length; ti++) {
                    let alpha = (1 - (ti + 1) / (b.trail.length + 1)) * 0.5;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = b.col;
                    ctx.beginPath(); ctx.arc(b.trail[ti].x, b.trail[ti].y, 3 - ti * 0.5, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
            ctx.fillStyle = b.col; ctx.fillRect(b.x - 2.5, b.y - 7, 5, 14);
            ctx.fillStyle = '#fff'; ctx.fillRect(b.x - 1, b.y - 5, 2, 10);
        }

        for (let blk of this.blocks) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
            ctx.fillStyle = blk.c; 
            
            if (blk.type === 'slide') { 
                ctx.strokeStyle = '#0f0'; 
                ctx.shadowBlur = 5; ctx.shadowColor = '#0f0';
            }
            else if (blk.type === 'meteor') { 
                ctx.strokeStyle = '#f88'; 
                if (blk.tmr < 35) { ctx.fillStyle = '#800'; } 
                else { ctx.shadowBlur = 10; ctx.shadowColor = '#f00'; }
            }
            
            ctx.fillRect(blk.x, blk.y, blk.w, blk.h);
            ctx.strokeRect(blk.x, blk.y, blk.w, blk.h);
            ctx.shadowBlur = 0; 
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(blk.x+3, blk.y+3, 6, 6);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(blk.x+11, blk.y+11, 6, 6);
        }

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

        if (this.st === 'play') {
            let isRainbow = (this.shipIdx === 4);
            this.drawSpriteData(this.px, this.py, this.SPRITES[this.shipIdx], 2.2, isRainbow);
        }

        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
        ctx.fillText(`SCORE: ${this.score}`, 5, 16);
        ctx.fillStyle = this.diffSet[this.diff].col;
        ctx.textAlign = 'right';
        ctx.fillText(`[${this.diffSet[this.diff].name}]`, 195, 16);
        ctx.textAlign = 'left';

        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 200, 300);
            ctx.textAlign = 'center'; ctx.shadowBlur = 15; ctx.shadowColor = '#f00';
            ctx.fillStyle = '#f00'; ctx.font = 'bold 26px "Arial Black", sans-serif';
            ctx.fillText('GAME OVER', 100, 120);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
            ctx.fillText(`SCORE: ${this.score}`, 100, 160);
            ctx.fillStyle = this.score >= this.hiScore ? '#ff0' : '#888';
            ctx.font = 'bold 11px monospace';
            ctx.fillText(`HI: ${this.hiScore}`, 100, 180);
            // ★ NEW RECORD!! 黄色点滅テキスト
            if (this.newRecord && this.newRecordTmr % 30 < 20) {
                ctx.shadowBlur = 12; ctx.shadowColor = '#ff0';
                ctx.fillStyle = '#ff0'; ctx.font = 'bold 14px "Arial Black", sans-serif';
                ctx.fillText('NEW RECORD!!', 100, 205);
                ctx.shadowBlur = 0;
            }
            if (this.tmr > 60) {
                ctx.fillStyle = '#ff0'; ctx.font = 'bold 11px monospace';
                ctx.fillText('PRESS [A] TO RETURN', 100, 230);
            }
            ctx.textAlign = 'left';
        }
    }
};
