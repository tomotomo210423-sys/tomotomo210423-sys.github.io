// === 2D KART: MADNESS (Top-Down 2D Racing) ===
// 疑似3Dを廃止し、完全な2Dトップビュー（見下ろし型）として再構築。
// バグを排除し、正確な当たり判定と直感的な操作性を実現した超安定版！

const PCApp = {
    st: 'title', 
    stage: 1,    
    pos: 0,      // コース全体の進行距離 (Z軸の代わり)
    speed: 0,
    maxSpeed: 100,
    px: 100,     // プレイヤーのX座標 (画面中心は100)
    py: 240,     // プレイヤーのY座標 (固定)
    
    sprites: [], // 敵やアイテムの配列
    
    // アイテムシステム
    heldItem: 0,   // 持っているアイテム
    activeItem: 0, // 発動中のアイテム
    activeTimer: 0,
    itemNames: ["", "🍄ダッシュ", "⭐無敵", "⚡落雷"],
    
    // 順位・カオスギミック
    rank: 20, 
    chaosTimer: 0,
    
    init() {
        this.st = 'title';
        this.stage = 1;
        BGM.stop();
    },

    startStage(stg) {
        this.st = 'play';
        this.stage = stg;
        this.pos = 0;
        this.speed = 0;
        this.px = 100;
        this.sprites = [];
        this.heldItem = 0;
        this.activeItem = 0;
        this.activeTimer = 0;
        this.rank = 15 + (stg * 5); 
        this.chaosTimer = 0;
        BGM.play('action');
    },

    // コースのウネウネ（カーブ）を計算する関数
    getTrackOffset(z) {
        if (this.stage === 1) return Math.sin(z * 0.002) * 30;
        if (this.stage === 2) return Math.sin(z * 0.003) * 50 + Math.cos(z * 0.001) * 20;
        if (this.stage === 3) {
            // カオスステージは狂ったカーブ＋突然のズレ
            let offset = (Math.sin(z * 0.004) + Math.cos(z * 0.007)) * 40;
            if (this.chaosTimer > 0) offset += Math.sin(z * 0.1) * 15;
            return offset;
        }
        return 0;
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.a) this.startStage(1);
            return;
        }

        if (this.st === 'clear') {
            this.speed *= 0.9; 
            this.pos += this.speed; 
            this.px += (100 - this.px) * 0.1; // 中央に戻る
            if (keysDown.a) {
                if (this.stage < 3) this.startStage(this.stage + 1);
                else this.init(); 
            }
            return;
        }

        // === プレイ中の処理 ===

        // アイテムタイマー
        if (this.activeTimer > 0) {
            this.activeTimer--;
            if (this.activeTimer <= 0) this.activeItem = 0;
        }

        // アイテム使用 (十字キー上)
        if (keysDown.up && this.heldItem > 0 && this.activeTimer <= 0) {
            playSnd('combo');
            this.activeItem = this.heldItem;
            this.heldItem = 0;
            this.activeTimer = 180; // 約3秒
            
            if (this.activeItem === 3) {
                // ⚡落雷: 画面上の敵を全滅
                this.sprites = this.sprites.filter(s => s.type !== 'enemy');
                this.chaosTimer = 20; 
                this.rank = Math.max(1, this.rank - 3);
                playSnd('hit');
            }
        }

        // アクセル・ブレーキ処理
        let limit = (this.activeItem === 1 && this.activeTimer > 0) ? this.maxSpeed * 1.5 : this.maxSpeed;
        if (keys.a) {
            this.speed += 2;
            if (this.speed > limit) this.speed = limit;
        } else if (keys.b) {
            this.speed -= 4;
        } else {
            this.speed -= 1;
        }

        // 左右移動 (ピクセル単位で正確に移動)
        if (keys.left) this.px -= 3;
        if (keys.right) this.px += 3;

        // ★ 完全2Dの正確なコースアウト(ダート)判定
        let currentOffset = this.getTrackOffset(this.pos);
        let roadCenter = 100 + currentOffset;
        let leftBound = roadCenter - 60;  // コース左端
        let rightBound = roadCenter + 60; // コース右端
        
        // 道を踏み外した時のペナルティ
        if (this.px < leftBound + 10 || this.px > rightBound - 10) {
            if (this.activeItem !== 1 && this.activeItem !== 2) {
                // 無敵・キノコ以外は大幅減速
                if (this.speed > 30) this.speed -= 3;
            }
            // 完全な壁への激突判定
            if (this.px < leftBound - 10) { this.px = leftBound - 10; this.speed -= 5; }
            if (this.px > rightBound + 10) { this.px = rightBound + 10; this.speed -= 5; }
        }
        
        if (this.speed < 0) this.speed = 0;
        this.pos += this.speed;

        // ★ スプライト（敵・アイテム）の生成
        if (Math.random() < 0.04 + (this.stage * 0.02)) {
            let isItem = Math.random() < 0.15;
            let spawnZ = this.pos + 400; // 画面のはるか上空(奥)に生成
            let spawnOffset = this.getTrackOffset(spawnZ);
            this.sprites.push({
                type: isItem ? 'item' : 'enemy',
                x: 100 + spawnOffset + (Math.random() - 0.5) * 100, // 道の幅に合わせて配置
                y: -50, // 画面外(上)
                z: spawnZ, // コース上の絶対位置
                s: isItem ? 0 : this.maxSpeed * (0.4 + Math.random() * 0.4),
                passed: false // 追い抜いたかどうかのフラグ
            });
        }

        // ★ スプライトの更新と当たり判定
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            let s = this.sprites[i];
            
            // Y座標を「プレイヤーの進行距離」に合わせて計算（見下ろしスクロールの肝）
            s.y = 240 - (s.z - this.pos); 
            
            // カオスモードの敵の震え
            if (this.stage === 3 && s.type === 'enemy') s.x += Math.sin(Date.now()/100 + s.x) * 2;

            // 敵を追い抜いた判定（Y座標が自分より下に行ったら）
            if (s.type === 'enemy' && s.y > 240 && !s.passed) {
                s.passed = true;
                if (Math.abs(s.x - this.px) > 20) { // ぶつからずに追い抜いた
                    this.rank = Math.max(1, this.rank - 1);
                }
            }

            // 2Dの正確な当たり判定 (XYの四角形判定)
            if (Math.abs(s.x - this.px) < 20 && Math.abs(s.y - this.py) < 20) {
                if (s.type === 'item') {
                    // アイテムGET！
                    if (this.heldItem === 0) { 
                        this.heldItem = Math.floor(Math.random() * 3) + 1; 
                        playSnd('sel'); 
                    }
                    this.sprites.splice(i, 1);
                    continue;
                } else if (s.type === 'enemy') {
                    // 敵に衝突
                    if (this.activeItem === 2) {
                        // 無敵で粉砕
                        playSnd('hit'); 
                        this.sprites.splice(i, 1); 
                        screenShake(3); 
                        this.rank = Math.max(1, this.rank - 1); 
                        continue;
                    } else {
                        // クラッシュ
                        this.speed *= 0.2; 
                        playSnd('hit'); 
                        this.chaosTimer = 10; 
                        s.z += 50; // ぶつかった敵を前に押し出す
                    }
                }
            }
            
            // 画面の下端を過ぎたら削除
            if (s.y > 350) this.sprites.splice(i, 1);
        }

        // ステージクリア判定
        let goal = 10000 + (this.stage * 5000);
        if (this.pos > goal) {
            this.st = 'clear';
            playSnd('combo');
        }

        // カオスギミック
        if (this.stage === 3 && Math.random() < 0.01) this.chaosTimer = 30;
        if (this.chaosTimer > 0) this.chaosTimer--;
    },

    draw() {
        // 背景色
        ctx.fillStyle = ['#2a2', '#141', '#202'][this.stage - 1];
        if (this.chaosTimer > 0) ctx.fillStyle = `hsl(${(Date.now()/10)%360}, 100%, 30%)`;
        ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#000'; ctx.fillRect(20, 80, 160, 60);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace'; ctx.fillText('2D KART', 60, 100);
            ctx.fillStyle = '#ff0'; ctx.fillText('MADNESS', 60, 125);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('A:アクセル B:ブレーキ', 20, 180);
            ctx.fillText('UP(上): アイテム使用', 30, 200);
            if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS [A] TO START', 45, 240);
            return;
        }

        // === 見下ろし型 2Dスクロール道路の描画 ===
        let roadCol = ['#666', '#444', '#303'][this.stage - 1];
        let lineCol = ['#fff', '#dd0', '#f0f'][this.stage - 1];
        let rumble1 = ['#f00', '#f00', '#0ff'][this.stage - 1];
        let rumble2 = ['#fff', '#fff', '#f0f'][this.stage - 1];

        // 画面の上から下へ、5ピクセルずつ「道路の輪切り」を描いていく
        for (let y = 0; y < 300; y += 5) {
            // そのY座標に該当する「コース上の絶対位置(Z)」を逆算
            let virtualZ = this.pos + (240 - y);
            let offsetX = this.getTrackOffset(virtualZ);
            let cx = 100 + offsetX;
            
            let isRumble = Math.floor(virtualZ / 20) % 2 === 0;
            
            // 縁石(ゼブラゾーン)
            ctx.fillStyle = isRumble ? rumble1 : rumble2;
            ctx.fillRect(cx - 65, y, 130, 5);
            
            // アスファルト
            ctx.fillStyle = roadCol;
            ctx.fillRect(cx - 60, y, 120, 5);
            
            // センターライン
            if (isRumble) {
                ctx.fillStyle = lineCol;
                ctx.fillRect(cx - 2, y, 4, 5);
            }
        }

        // === スプライトの描画 ===
        for (let s of this.sprites) {
            if (s.y < -30 || s.y > 330) continue; // 画面外は描画しない
            
            if (s.type === 'enemy') {
                ctx.fillStyle = '#000'; ctx.fillRect(s.x - 12, s.y - 14, 24, 28); // 影/タイヤ
                ctx.fillStyle = '#f00'; ctx.fillRect(s.x - 10, s.y - 12, 20, 24); // 車体
                ctx.fillStyle = '#0ff'; ctx.fillRect(s.x - 8, s.y - 8, 16, 6);  // 窓
                ctx.fillStyle = '#ff0'; ctx.fillRect(s.x - 8, s.y + 8, 4, 4); ctx.fillRect(s.x + 4, s.y + 8, 4, 4); // ランプ
            } else {
                ctx.fillStyle = (Math.floor(Date.now()/100)%2===0) ? '#ff0' : '#f0f';
                ctx.fillRect(s.x - 10, s.y - 10, 20, 20);
                ctx.fillStyle = '#000'; ctx.font = 'bold 16px monospace'; ctx.fillText('?', s.x - 5, s.y + 5);
            }
        }

        // === プレイヤーの描画 ===
        let bounce = (this.speed > 0) ? Math.sin(Date.now() / 50) * 2 : 0;
        ctx.fillStyle = '#000'; ctx.fillRect(this.px - 12, this.py - 14 + bounce, 24, 28);
        ctx.fillStyle = (this.activeItem === 2 && this.activeTimer > 0) ? `hsl(${(Date.now()/5)%360}, 100%, 50%)` : '#00f';
        ctx.fillRect(this.px - 10, this.py - 12 + bounce, 20, 24);
        ctx.fillStyle = '#0ff'; ctx.fillRect(this.px - 8, this.py - 2 + bounce, 16, 6); // 窓
        ctx.fillStyle = '#f00'; ctx.fillRect(this.px - 8, this.py - 12 + bounce, 4, 4); ctx.fillRect(this.px + 4, this.py - 12 + bounce, 4, 4); // ランプ

        // === UI（画面表示） ===
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`STG ${this.stage}`, 5, 15);
        ctx.fillStyle = (this.rank === 1) ? '#ff0' : '#fff';
        ctx.fillText(`RANK:${this.rank}`, 65, 15);
        ctx.fillStyle = '#fff'; ctx.fillText(`${Math.floor(this.speed)}km/h`, 130, 15);
        
        let goal = 10000 + (this.stage * 5000);
        let prog = Math.min(this.pos / goal, 1.0);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(5, 20, 190, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(5, 20, 190 * prog, 5);

        // アイテムボックス
        ctx.strokeStyle = '#fff'; ctx.strokeRect(160, 30, 35, 35);
        if (this.heldItem > 0) {
            ctx.font = '20px monospace'; ctx.fillText(["", "🍄", "⭐", "⚡"][this.heldItem], 167, 55);
        }
        if (this.activeTimer > 0) {
            ctx.fillStyle = '#f00'; ctx.font = '8px monospace'; ctx.fillText('ACTIVE', 162, 75);
            ctx.fillStyle = '#0ff'; ctx.fillRect(160, 68, 35 * (this.activeTimer/180), 3);
        }

        // メッセージ
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
            if (this.stage < 3) {
                ctx.fillText(`STAGE CLEAR! (R:${this.rank})`, 10, 140);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO NEXT', 50, 170);
            } else {
                ctx.fillText('ALL CLEAR!!', 50, 140);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`FINAL RANK: ${this.rank}`, 55, 160);
            }
        }
        if (this.st === 'gameover') {
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace'; ctx.fillText('CRASHED!', 60, 140);
        }
        
        // カオスステージのエフェクト
        if (this.chaosTimer > 15 && this.stage === 3) {
            ctx.globalCompositeOperation = 'difference'; 
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); 
            ctx.globalCompositeOperation = 'source-over';
        }
    }
};
