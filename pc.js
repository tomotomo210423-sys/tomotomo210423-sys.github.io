// === PIXEL KART: MADNESS (Fake 3D Racing) ===
// 擬似PCプロジェクトは破棄され、カオスな疑似3Dレーシングへと生まれ変わった。

const PCApp = {
    st: 'title', // title, play, clear, gameover
    stage: 1,    // 1:通常 2:砂漠 3:病気カオス
    pos: 0,      // コースの進行距離
    speed: 0,
    maxSpeed: 150,
    playerX: 0,  // -1 (左端) 〜 1 (右端)
    
    curve: 0,
    trackCurve: 0,
    
    sprites: [], // 敵車やアイテムボックス
    
    // アイテム関連
    item: 0, // 0:なし, 1:🍄ダッシュ, 2:⭐無敵, 3:⚡落雷
    itemNames: ["", "🍄ダッシュ", "⭐無敵", "⚡落雷"],
    itemTimer: 0, // 効果時間
    
    // カオスギミック用
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
        this.item = 0;
        this.itemTimer = 0;
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
                else this.init(); // 全クリ
            }
            return;
        }
        
        if (this.st === 'gameover') {
            this.speed *= 0.9;
            if (keysDown.a) this.startStage(this.stage); // リトライ
            return;
        }

        // === プレイ中の処理 ===

        // アイテム効果の減衰
        if (this.itemTimer > 0) this.itemTimer--;

        // アクセル＆ブレーキ
        if (keys.a) {
            let limit = (this.itemTimer > 0 && this.item === 1) ? this.maxSpeed * 1.5 : this.maxSpeed;
            this.speed += 2;
            if (this.speed > limit) this.speed = limit;
        } else if (keys.b) {
            this.speed -= 4; // ブレーキ
        } else {
            this.speed -= 1; // 惰性
        }
        if (this.speed < 0) this.speed = 0;

        // 左右移動
        if (keys.left) this.playerX -= 0.05 * (this.speed / this.maxSpeed);
        if (keys.right) this.playerX += 0.05 * (this.speed / this.maxSpeed);

        // カーブによる遠心力
        this.playerX -= this.curve * 0.02 * (this.speed / this.maxSpeed);

        // ダート（道外）の減速
        if (Math.abs(this.playerX) > 1.2) {
            if (this.speed > 50 && this.item !== 2) this.speed -= 3; // 無敵以外は減速
            if (Math.abs(this.playerX) > 2.0) this.playerX = 2.0 * Math.sign(this.playerX);
        }

        // 進行
        this.pos += this.speed;

        // コースのカーブ生成
        let section = Math.floor(this.pos / 1000);
        if (this.stage === 1) this.trackCurve = Math.sin(section) * 0.5;
        if (this.stage === 2) this.trackCurve = Math.sin(section * 1.5) * 1.0;
        if (this.stage === 3) this.trackCurve = (Math.sin(section * 2) + Math.cos(section * 3)) * 1.5; // カオスカーブ
        
        // カーブを滑らかに補間
        this.curve += (this.trackCurve - this.curve) * 0.05;
        this.bgOffset -= this.curve * this.speed * 0.005;

        // アイテム使用 (Bボタンに変更: Aはアクセル)
        if (keysDown.b && this.item > 0 && this.itemTimer === 0) {
            playSnd('combo');
            this.itemTimer = 180; // 約3秒
            if (this.item === 3) {
                // ⚡落雷: 画面上の敵を全滅
                this.sprites = this.sprites.filter(s => s.type !== 'enemy');
                this.chaosTimer = 20; // 画面フラッシュ
                playSnd('hit');
            }
        }
        if (this.itemTimer === 0 && this.item !== 0) {
            if (this.item === 1 || this.item === 3) this.item = 0; // 効果終了で消費
            if (this.item === 2) this.item = 0; // 無敵終了
        }

        // スプライト（敵・アイテム）の生成
        if (Math.random() < 0.03 + (this.stage * 0.01)) {
            let isItem = Math.random() < 0.1;
            this.sprites.push({
                type: isItem ? 'item' : 'enemy',
                x: (Math.random() - 0.5) * 2.0, // 道の左右どこか
                z: 1500, // 遠くから出現
                s: isItem ? 0 : this.maxSpeed * (0.4 + Math.random() * 0.4) // 敵は少し遅い
            });
        }

        // スプライトの更新と当たり判定
        for (let i = this.sprites.length - 1; i >= 0; i--) {
            let s = this.sprites[i];
            s.z -= (this.speed - (s.type === 'enemy' ? s.s : 0)); // 自分との相対速度

            // 当たり判定 (Zが近く、X座標が近い場合)
            if (s.z > 0 && s.z < 100 && Math.abs(s.x - this.playerX) < 0.4) {
                if (s.type === 'item') {
                    // アイテムボックス取得
                    this.item = Math.floor(Math.random() * 3) + 1; // 1, 2, 3のどれか
                    playSnd('sel');
                    this.sprites.splice(i, 1);
                    continue;
                } else if (s.type === 'enemy') {
                    // 敵に衝突
                    if (this.item === 2 && this.itemTimer > 0) {
                        // 無敵状態なら敵を吹き飛ばす
                        playSnd('hit');
                        this.sprites.splice(i, 1);
                        screenShake(3);
                        continue;
                    } else {
                        // クラッシュ！
                        this.speed = 0;
                        playSnd('hit');
                        this.chaosTimer = 10; // 画面揺れ
                    }
                }
            }
            
            // 通過したものは消す
            if (s.z < -100 || s.z > 2000) {
                this.sprites.splice(i, 1);
            }
        }

        // ステージクリア判定 (Stage 1: 15000, 2: 20000, 3: 25000)
        let goalLength = 10000 + (this.stage * 5000);
        if (this.pos > goalLength) {
            this.st = 'clear';
            playSnd('combo');
        }

        // カオスギミック進行 (Stage 3限定の病気演出)
        if (this.stage === 3) {
            if (Math.random() < 0.01) this.chaosTimer = 30; // 突然のグリッチ
        }
        if (this.chaosTimer > 0) this.chaosTimer--;
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace';
            ctx.fillText('PIXEL KART', 40, 100);
            ctx.fillStyle = '#ff0'; ctx.fillText('MADNESS', 60, 125);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('A: アクセル  B: アイテム', 30, 180);
            ctx.fillText('◀ ▶: ハンドル', 60, 200);
            if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS [A] TO START', 45, 240);
            return;
        }

        // === 疑似3D 道路描画アルゴリズム ===
        
        // 色設定 (ステージごと)
        let colors = {
            sky: ['#4bf', '#002', '#200'][this.stage - 1],
            ground1: ['#2a2', '#a84', '#111'][this.stage - 1],
            ground2: ['#181', '#862', '#000'][this.stage - 1],
            road1: ['#666', '#555', '#303'][this.stage - 1],
            road2: ['#555', '#444', '#202'][this.stage - 1],
            rumble1: ['#fff', '#f00', '#0ff'][this.stage - 1],
            rumble2: ['#f00', '#fff', '#f0f'][this.stage - 1]
        };

        // カオスモードの背景色オーバーライド
        if (this.chaosTimer > 0 || (this.stage === 3 && this.item === 2 && this.itemTimer > 0)) {
            let hue = (Date.now() / 5) % 360;
            colors.sky = `hsl(${hue}, 100%, 20%)`;
            colors.road1 = `hsl(${hue + 180}, 100%, 30%)`;
            colors.ground1 = `hsl(${hue + 90}, 100%, 40%)`;
        }

        // 空と背景（疑似スクロール）
        ctx.fillStyle = colors.sky; ctx.fillRect(0, 0, 200, 150);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
            let bx = (this.bgOffset + i * 80) % 200;
            if (bx < 0) bx += 200;
            if (this.stage === 1) ctx.fillText('☁', bx, 50 + (i % 2) * 20);
            if (this.stage === 2) ctx.fillText('★', bx, 50 + (i % 2) * 20);
            if (this.stage === 3) ctx.fillText('👁', bx, 50 + Math.sin(Date.now()/100)*20); // 病気
        }

        let roadWidth = 100;
        let segLength = 20;

        // 手前から奥へ（画面下から中央へ）向かって1行ずつ描画
        for (let y = 150; y < 300; y++) {
            // カオスギミック：道路が波打つ
            let wave = 0;
            if (this.stage === 3) wave = Math.sin((y + this.pos * 0.1) * 0.05) * (this.chaosTimer > 0 ? 20 : 5);

            // Z座標 (遠近法)
            let z = 150 / (y - 149);
            
            // 描画する行の模様を決定 (Zと進行距離を足してゼブラ柄を作る)
            let seg = Math.floor((this.pos + z * 100) / segLength);
            
            let dx = this.curve * z * z * 0.5 + wave; // カーブによるXのズレ
            let px = this.playerX * roadWidth / z;    // プレイヤー位置によるズレ
            let cx = 100 - px + dx;                   // 画面上の中心X

            let w = roadWidth / z;                    // 画面上の道幅

            // 描画
            ctx.fillStyle = (seg % 2 === 0) ? colors.ground1 : colors.ground2;
            ctx.fillRect(0, y, 200, 1); // 草地

            ctx.fillStyle = (seg % 2 === 0) ? colors.rumble1 : colors.rumble2;
            ctx.fillRect(cx - w * 1.2, y, w * 2.4, 1); // 縁石

            ctx.fillStyle = (seg % 2 === 0) ? colors.road1 : colors.road2;
            ctx.fillRect(cx - w, y, w * 2, 1); // 道路
        }

        // スプライト（敵やアイテム）の描画
        // Z値が大きい（奥にある）ものから順に描画するためソート
        let sortedSprites = [...this.sprites].sort((a, b) => b.z - a.z);
        
        for (let s of sortedSprites) {
            if (s.z < 10) continue; // 近すぎる（カメラの後ろ）は見えない
            
            // 遠近法で画面上の座標とサイズを計算
            let scale = 100 / s.z;
            let cx = 100 - (this.playerX * roadWidth * scale) + (s.x * roadWidth * scale);
            // カーブの影響も加味
            cx += this.curve * (s.z/100) * (s.z/100) * 0.5;
            
            let cy = 150 + (150 * scale); // y=150が地平線
            let sw = 40 * scale;
            let sh = 40 * scale;

            if (s.type === 'enemy') {
                ctx.fillStyle = '#000'; ctx.fillRect(cx - sw/2, cy - sh, sw, sh); // タイヤ影
                ctx.fillStyle = '#f00'; ctx.fillRect(cx - sw/2 + 2, cy - sh + 2, sw - 4, sh - 10); // 車体
                ctx.fillStyle = '#ff0'; ctx.fillRect(cx - sw/2 + 4, cy - sh + 10, 8 * scale, 8 * scale); // テールランプ
            } else if (s.type === 'item') {
                ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? '#ff0' : '#f0f';
                ctx.fillRect(cx - sw/2, cy - sh, sw, sh);
                ctx.fillStyle = '#000'; ctx.font = `bold ${Math.floor(20*scale)}px monospace`;
                ctx.fillText('?', cx - sw/4, cy - sh/4);
            }
        }

        // プレイヤー自身の車の描画
        let pWidth = 40; let pHeight = 30;
        let bounce = (this.speed > 0) ? Math.sin(Date.now() / 50) * 2 : 0;
        
        ctx.fillStyle = '#000'; ctx.fillRect(100 - pWidth/2, 270 - pHeight + bounce, pWidth, pHeight);
        
        // アイテム無敵中の光
        if (this.item === 2 && this.itemTimer > 0) {
            ctx.fillStyle = `hsl(${(Date.now()/5)%360}, 100%, 50%)`;
        } else {
            ctx.fillStyle = '#00f'; 
        }
        ctx.fillRect(100 - pWidth/2 + 2, 270 - pHeight + 2 + bounce, pWidth - 4, pHeight - 8);
        ctx.fillStyle = '#f00'; ctx.fillRect(100 - 10, 270 - 15 + bounce, 20, 10); // ランプ

        // UI描画
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`STAGE ${this.stage}`, 5, 15);
        ctx.fillText(`${Math.floor(this.speed)} km/h`, 5, 30);
        
        // 進行度バー
        let goal = 10000 + (this.stage * 5000);
        let prog = Math.min(this.pos / goal, 1.0);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(5, 40, 100, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(5, 40, 100 * prog, 5);

        // アイテム表示枠
        ctx.strokeStyle = '#fff'; ctx.strokeRect(150, 5, 40, 40);
        if (this.item > 0) {
            ctx.font = '24px monospace';
            let icon = ["", "🍄", "⭐", "⚡"][this.item];
            ctx.fillText(icon, 158, 32);
            ctx.font = '8px monospace';
            ctx.fillText(this.itemNames[this.item], 150, 55);
            // アイテムタイマーゲージ
            if (this.itemTimer > 0) {
                ctx.fillStyle = '#0ff'; ctx.fillRect(150, 48, 40 * (this.itemTimer/180), 3);
            }
        }

        // メッセージ
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
            if (this.stage < 3) {
                ctx.fillText('STAGE CLEAR!', 45, 140);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO NEXT', 50, 170);
            } else {
                ctx.fillText('ALL CLEAR!!', 50, 140);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('YOU ARE RACING GOD.', 40, 170);
            }
        }
        if (this.st === 'gameover') {
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace';
            ctx.fillText('CRASHED!', 60, 140);
        }
        
        // カオスエフェクト（画面反転）
        if (this.chaosTimer > 15 && this.stage === 3) {
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300);
            ctx.globalCompositeOperation = 'source-over';
        }
    }
};
