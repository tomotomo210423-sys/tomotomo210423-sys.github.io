// === PIXEL KART: MADNESS (Fake 3D Racing) ===
// アイテムシステム修復・ダート減速強化・順位(RANK)システム搭載版

const PCApp = {
    st: 'title', 
    stage: 1,    
    pos: 0,      
    speed: 0,
    maxSpeed: 150,
    playerX: 0,  
    curve: 0,
    trackCurve: 0,
    sprites: [], 
    
    // アイテム関連（所持枠と発動枠を完全に分離してバグ修正！）
    heldItem: 0,   // 持っているアイテム (1:🍄 2:⭐ 3:⚡)
    activeItem: 0, // 今発動しているアイテム
    activeTimer: 0,
    itemNames: ["", "🍄ダッシュ", "⭐無敵", "⚡落雷"],
    
    // レース順位・ギミック用
    rank: 20, 
    chaosTimer: 0,
    bgOffset: 0,
    
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
        this.playerX = 0;
        this.sprites = [];
        this.heldItem = 0;
        this.activeItem = 0;
        this.activeTimer = 0;
        // ステージが進むごとに敵の数（初期順位）が増える
        this.rank = 15 + (stg * 5); 
        this.chaosTimer = 0;
        BGM.play('action');
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.a) this.startStage(1);
            return;
        }

        if (this.st === 'clear') {
            this.speed *= 0.95;
            this.pos += this.speed;
            if (keysDown.a) {
                if (this.stage < 3) this.startStage(this.stage + 1);
                else this.init(); 
            }
            return;
        }
        
        if (this.st === 'gameover') {
            this.speed *= 0.9;
            if (keysDown.a) this.startStage(this.stage); 
            return;
        }

        // === プレイ中の処理 ===

        // アイテムタイマーの減衰と終了処理
        if (this.activeTimer > 0) {
            this.activeTimer--;
            if (this.activeTimer <= 0) this.activeItem = 0; // 効果終了
        }

        // アイテム使用 (誤爆防止のため 十字キー【上】 に変更！)
        if (keysDown.up && this.heldItem > 0 && this.activeTimer <= 0) {
            playSnd('combo');
            this.activeItem = this.heldItem;
            this.heldItem = 0;
            this.activeTimer = 180; // 約3秒
            
            if (this.activeItem === 3) {
                // ⚡落雷: 画面上の敵を全滅させて順位を一気に上げる
                this.sprites = this.sprites.filter(s => s.type !== 'enemy');
                this.chaosTimer = 20; 
                this.rank = Math.max(1, this.rank - 3);
                playSnd('hit');
            }
        }

        // アクセル＆ブレーキ
        let limit = (this.activeItem === 1 && this.activeTimer > 0) ? this.maxSpeed * 1.5 : this.maxSpeed;
        
        if (keys.a) {
            this.speed += 2;
            if (this.speed > limit) this.speed = limit;
        } else if (keys.b) {
            this.speed -= 4; // ブレーキ
        } else {
            this.speed -= 1; // 惰性
        }

        // 左右移動
        if (keys.left) this.playerX -= 0.05 * (this.speed / this.maxSpeed);
        if (keys.right) this.playerX += 0.05 * (this.speed / this.maxSpeed);

        // ★修正: カーブの遠心力を超強化 (曲がらないと外に吹っ飛ぶ)
        this.playerX -= this.curve * 0.05 * (this.speed / this.maxSpeed);

        // ★修正: ダート（道外）の超減速ペナルティ
        if (Math.abs(this.playerX) > 1.0) {
            // キノコ・無敵以外は容赦なく減速
            if (this.activeItem !== 1 && this.activeItem !== 2) {
                if (this.speed > 40) this.speed -= 5; // 最高速が40まで落ちる
                
                // 完全な壁（これ以上外には行けないし、ぶつかると大減速）
                if (Math.abs(this.playerX) > 1.5) {
                    this.playerX = 1.5 * Math.sign(this.playerX);
                    this.speed -= 10; 
                }
            }
        }
        if (this.speed < 0) this.speed = 0;

        // 進行
        this.pos += this.speed;

        // コースのカーブ生成
        let section = Math.floor(this.pos / 1000);
        if (this.stage === 1) this.trackCurve = Math.sin(section) * 0.5;
        if (this.stage === 2) this.trackCurve = Math.sin(section * 1.5) * 1.0;
        if (this.stage === 3) this.trackCurve = (Math.sin(section * 2) + Math.cos(section * 3)) * 1.5; 
        
        this.curve += (this.trackCurve - this.curve) * 0.05;
        this.bgOffset -= this.curve * this.speed * 0.005;

        // スプライト（敵・アイテム）の生成
        if (Math.random() < 0.04 + (this.stage * 0.01)) {
            let isItem = Math.random() < 0.15; // アイテム出現率UP
            this.sprites.push({
                type: isItem ? 'item' : 'enemy',
                x: (Math.random() - 0.5) * 2.0, 
                z: 1500, 
                s: isItem ? 0 : this.maxSpeed * (0.3 + Math.random() * 0.4) // ★修正: 敵の速度を大幅に低下 (追い抜けるように)
            });
        }

        // スプライトの更新と当たり判定
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            let s = this.sprites[i];
            let prevZ = s.z;
            s.z -= (this.speed - (s.type === 'enemy' ? s.s : 0));
            
            // ★カオスモード: 敵がフラフラ動く
            if (this.stage === 3 && s.type === 'enemy') s.x += Math.sin(Date.now()/200 + s.z) * 0.02;

            // ★追加: 敵を追い抜いたら順位(RANK)アップ！
            if (s.type === 'enemy' && prevZ >= 0 && s.z < 0) {
                if (Math.abs(s.x - this.playerX) > 0.4) {
                    this.rank = Math.max(1, this.rank - 1);
                }
            }

            // 衝突判定
            if (s.z > 0 && s.z < 100 && Math.abs(s.x - this.playerX) < 0.4) {
                if (s.type === 'item') {
                    // ★修正: アイテムを空き枠に確実にストック
                    if (this.heldItem === 0) {
                        this.heldItem = Math.floor(Math.random() * 3) + 1;
                        playSnd('sel');
                    }
                    this.sprites.splice(i, 1);
                    continue;
                } else if (s.type === 'enemy') {
                    if (this.activeItem === 2) {
                        // 無敵状態で敵を粉砕！
                        playSnd('hit');
                        this.sprites.splice(i, 1);
                        screenShake(3);
                        this.rank = Math.max(1, this.rank - 1);
                        continue;
                    } else {
                        // クラッシュ（大減速）
                        this.speed *= 0.2;
                        playSnd('hit');
                        this.chaosTimer = 10;
                        s.s = this.maxSpeed; // ぶつかった敵は逃げていく
                    }
                }
            }
            
            if (s.z < -100 || s.z > 2000) this.sprites.splice(i, 1);
        }

        // ステージクリア判定
        let goalLength = 10000 + (this.stage * 5000);
        if (this.pos > goalLength) {
            this.st = 'clear';
            playSnd('combo');
        }

        // カオスギミック
        if (this.stage === 3 && Math.random() < 0.01) this.chaosTimer = 30; 
        if (this.chaosTimer > 0) this.chaosTimer--;
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace';
            ctx.fillText('PIXEL KART', 40, 100);
            ctx.fillStyle = '#ff0'; ctx.fillText('MADNESS', 60, 125);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('A:アクセル  B:ブレーキ', 20, 180);
            ctx.fillText('UP(上): アイテム使用', 30, 200);
            if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS [A] TO START', 45, 240);
            return;
        }

        // 色設定
        let colors = {
            sky: ['#4bf', '#002', '#200'][this.stage - 1],
            ground1: ['#2a2', '#a84', '#111'][this.stage - 1],
            ground2: ['#181', '#862', '#000'][this.stage - 1],
            road1: ['#666', '#555', '#303'][this.stage - 1],
            road2: ['#555', '#444', '#202'][this.stage - 1],
            rumble1: ['#fff', '#f00', '#0ff'][this.stage - 1],
            rumble2: ['#f00', '#fff', '#f0f'][this.stage - 1]
        };

        if (this.chaosTimer > 0 || (this.activeItem === 2 && this.activeTimer > 0)) {
            let hue = (Date.now() / 5) % 360;
            colors.sky = `hsl(${hue}, 100%, 20%)`;
            colors.road1 = `hsl(${hue + 180}, 100%, 30%)`;
            colors.ground1 = `hsl(${hue + 90}, 100%, 40%)`;
        }

        // 空と背景
        ctx.fillStyle = colors.sky; ctx.fillRect(0, 0, 200, 150);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
            let bx = (this.bgOffset + i * 80) % 200;
            if (bx < 0) bx += 200;
            if (this.stage === 1) ctx.fillText('☁', bx, 50 + (i % 2) * 20);
            if (this.stage === 2) ctx.fillText('★', bx, 50 + (i % 2) * 20);
            if (this.stage === 3) ctx.fillText('👁', bx, 50 + Math.sin(Date.now()/100)*20); 
        }

        let roadWidth = 100;
        let segLength = 20;

        // 道路描画
        for (let y = 150; y < 300; y++) {
            let wave = (this.stage === 3) ? Math.sin((y + this.pos * 0.1) * 0.05) * (this.chaosTimer > 0 ? 20 : 5) : 0;
            let z = 150 / (y - 149);
            let seg = Math.floor((this.pos + z * 100) / segLength);
            
            let dx = this.curve * z * z * 0.5 + wave; 
            let px = this.playerX * roadWidth / z;    
            let cx = 100 - px + dx;                   
            let w = roadWidth / z;                    

            ctx.fillStyle = (seg % 2 === 0) ? colors.ground1 : colors.ground2;
            ctx.fillRect(0, y, 200, 1); 

            ctx.fillStyle = (seg % 2 === 0) ? colors.rumble1 : colors.rumble2;
            ctx.fillRect(cx - w * 1.2, y, w * 2.4, 1); 

            ctx.fillStyle = (seg % 2 === 0) ? colors.road1 : colors.road2;
            ctx.fillRect(cx - w, y, w * 2, 1); 
        }

        // スプライト描画
        let sortedSprites = [...this.sprites].sort((a, b) => b.z - a.z);
        for (let s of sortedSprites) {
            if (s.z < 10) continue; 
            let scale = 100 / s.z;
            let cx = 100 - (this.playerX * roadWidth * scale) + (s.x * roadWidth * scale) + (this.curve * (s.z/100) * (s.z/100) * 0.5);
            let cy = 150 + (150 * scale); 
            let sw = 40 * scale; let sh = 40 * scale;

            if (s.type === 'enemy') {
                ctx.fillStyle = '#000'; ctx.fillRect(cx - sw/2, cy - sh, sw, sh); 
                ctx.fillStyle = '#f00'; ctx.fillRect(cx - sw/2 + 2, cy - sh + 2, sw - 4, sh - 10); 
                ctx.fillStyle = '#ff0'; ctx.fillRect(cx - sw/2 + 4, cy - sh + 10, 8 * scale, 8 * scale); 
            } else if (s.type === 'item') {
                ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? '#ff0' : '#f0f';
                ctx.fillRect(cx - sw/2, cy - sh, sw, sh);
                ctx.fillStyle = '#000'; ctx.font = `bold ${Math.floor(20*scale)}px monospace`;
                ctx.fillText('?', cx - sw/4, cy - sh/4);
            }
        }

        // 自車の描画
        let pWidth = 40; let pHeight = 30;
        let bounce = (this.speed > 0) ? Math.sin(Date.now() / 50) * 2 : 0;
        
        ctx.fillStyle = '#000'; ctx.fillRect(100 - pWidth/2, 270 - pHeight + bounce, pWidth, pHeight);
        ctx.fillStyle = (this.activeItem === 2 && this.activeTimer > 0) ? `hsl(${(Date.now()/5)%360}, 100%, 50%)` : '#00f'; 
        ctx.fillRect(100 - pWidth/2 + 2, 270 - pHeight + 2 + bounce, pWidth - 4, pHeight - 8);
        ctx.fillStyle = '#f00'; ctx.fillRect(100 - 10, 270 - 15 + bounce, 20, 10); 

        // UI描画
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`STAGE ${this.stage}`, 5, 15);
        ctx.fillStyle = (this.rank === 1) ? '#ff0' : '#fff'; // 1位は金色
        ctx.fillText(`RANK: ${this.rank}位`, 75, 15);
        ctx.fillStyle = '#fff';
        ctx.fillText(`${Math.floor(this.speed)} km/h`, 5, 30);
        
        // 進行度バー
        let goal = 10000 + (this.stage * 5000);
        let prog = Math.min(this.pos / goal, 1.0);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(5, 40, 100, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(5, 40, 100 * prog, 5);

        // アイテム表示枠
        ctx.strokeStyle = '#fff'; ctx.strokeRect(150, 5, 40, 40);
        
        // 所持アイテムの表示
        if (this.heldItem > 0) {
            ctx.font = '24px monospace';
            ctx.fillText(["", "🍄", "⭐", "⚡"][this.heldItem], 158, 32);
            ctx.font = '8px monospace';
            ctx.fillText(this.itemNames[this.heldItem], 150, 55);
        }
        
        // 発動中のアイテムタイマーゲージ
        if (this.activeTimer > 0) {
            ctx.fillStyle = '#f00'; ctx.fillText('ACTIVE', 152, 55);
            ctx.fillStyle = '#0ff'; ctx.fillRect(150, 48, 40 * (this.activeTimer/180), 3);
        }

        // メッセージ
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
            if (this.stage < 3) {
                ctx.fillText(`STAGE CLEAR! (RANK:${this.rank})`, 10, 140);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO NEXT', 50, 170);
            } else {
                ctx.fillText('ALL CLEAR!!', 50, 140);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`FINAL RANK: ${this.rank}位`, 55, 160);
                ctx.fillText('YOU ARE RACING GOD.', 40, 180);
            }
        }
    }
};
