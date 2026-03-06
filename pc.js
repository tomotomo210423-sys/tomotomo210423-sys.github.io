// === PIXEL KART: MADNESS (True Racing Evolution) ===
// 敵Bot、周回システム、オートアクセル、遠心力ペナルティを完備した本格疑似3Dレース

const PCApp = {
    st: 'title', // title, ready, play, clear, gameover
    stage: 1,    // 1:通常 2:砂漠 3:病気カオス
    lap: 1,      // 現在の周回
    maxLap: 3,   // クリアに必要な周回数
    lapLength: 8000, // 1周の長さ
    
    pos: 0,      // プレイヤーの進行距離
    speed: 0,
    maxSpeed: 150,
    playerX: 0,  // -1.5 (左ダート) 〜 1.5 (右ダート)
    
    curve: 0,
    trackCurve: 0,
    bgOffset: 0,
    
    readyTimer: 0,
    chaosTimer: 0,
    
    bots: [],    // 敵ライバル車
    objects: [], // アイテム箱や障害物
    
    item: 0,     // 0:なし, 1:🍄ダッシュ, 2:⭐無敵, 3:⚡落雷
    itemNames: ["", "🍄ダッシュ", "⭐無敵", "⚡落雷"],
    itemTimer: 0,
    
    init() {
        this.st = 'title';
        this.stage = 1;
        BGM.stop();
    },

    startStage(stg) {
        this.st = 'ready'; // カウントダウン状態へ
        this.stage = stg;
        this.lap = 1;
        this.pos = 0;
        this.speed = 0;
        this.playerX = 0;
        this.readyTimer = 120; // 3, 2, 1, GO! (約2秒)
        this.chaosTimer = 0;
        this.item = 0;
        this.itemTimer = 0;
        this.objects = [];
        
        // ライバル車を4台配置 (プレイヤーの少し前からスタート)
        this.bots = [];
        let colors = ['#f00', '#0f0', '#ff0', '#0ff'];
        for(let i=0; i<4; i++) {
            this.bots.push({
                id: i,
                x: (Math.random() - 0.5) * 1.5,
                pos: 100 + i * 200,
                baseSpeed: 135 + Math.random() * 15, // プレイヤーと競る絶妙な速度
                speed: 0,
                color: colors[i]
            });
        }
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.a) this.startStage(1);
            return;
        }

        if (this.st === 'ready') {
            this.readyTimer--;
            if (this.readyTimer <= 0) {
                this.st = 'play';
                BGM.play('action');
            }
            return;
        }

        if (this.st === 'clear' || this.st === 'gameover') {
            this.speed *= 0.95;
            this.pos += this.speed;
            if (keysDown.a) {
                if (this.st === 'clear') {
                    if (this.stage < 3) this.startStage(this.stage + 1);
                    else this.init(); // 全クリ
                } else {
                    this.startStage(this.stage); // リトライ
                }
            }
            // ボットも惰性で走らせる
            for(let b of this.bots) b.pos += b.speed * 0.95;
            return;
        }

        // === プレイ中の処理 ===

        if (this.itemTimer > 0) this.itemTimer--;

        // 🛣️ オートアクセル ＆ ダート(道外)判定
        let isDirt = Math.abs(this.playerX) > 1.0;
        let limit = this.maxSpeed;

        if (this.item === 1 && this.itemTimer > 0) {
            limit = this.maxSpeed * 1.3; // キノコ使用中は限界突破＆ダート無効
        } else if (isDirt && this.item !== 2) {
            limit = this.maxSpeed * 0.3; // 道から外れると超減速 (無敵中は例外)
            if (this.speed > limit) this.speed -= 5; 
        }

        // Aボタンでブレーキ
        if (keys.a) {
            this.speed -= 4;
            if (this.speed < 0) this.speed = 0;
        } else {
            // オートアクセル
            if (this.speed < limit) this.speed += 2;
            else if (this.speed > limit) this.speed -= 1;
        }

        // 左右のステアリング操作
        if (keys.left) this.playerX -= 0.05 * (this.speed / this.maxSpeed);
        if (keys.right) this.playerX += 0.05 * (this.speed / this.maxSpeed);

        // 🌪️ カーブによる遠心力 (ハンドルを切らないと道外に吹っ飛ぶ！)
        this.playerX -= this.curve * (this.speed / this.maxSpeed) * 0.04;

        // 壁ドン制限
        if (this.playerX < -1.5) this.playerX = -1.5;
        if (this.playerX > 1.5) this.playerX = 1.5;

        this.pos += this.speed;

        // コースのカーブ生成
        let section = Math.floor(this.pos / 800);
        if (this.stage === 1) this.trackCurve = Math.sin(section) * 0.6;
        if (this.stage === 2) this.trackCurve = Math.sin(section * 1.5) * 1.2;
        if (this.stage === 3) this.trackCurve = (Math.sin(section * 2) + Math.cos(section * 3)) * 1.5;
        
        this.curve += (this.trackCurve - this.curve) * 0.05;
        this.bgOffset -= this.curve * this.speed * 0.005;

        // 🎁 アイテム使用 (Bボタン)
        if (keysDown.b && this.item > 0 && this.itemTimer === 0) {
            playSnd('combo');
            this.itemTimer = 180;
            if (this.item === 3) { // ⚡落雷
                for (let b of this.bots) b.speed = 0; // 全ライバル急停止
                this.chaosTimer = 20; 
                playSnd('hit');
            }
        }
        if (this.itemTimer === 0 && this.item !== 0) {
            if (this.item === 1 || this.item === 3) this.item = 0;
            if (this.item === 2) this.item = 0;
        }

        // 🤖 敵Bot（ライバル車）のAI更新
        for (let b of this.bots) {
            // ライバルも加速し、コースに沿って走る
            b.speed += (b.baseSpeed - b.speed) * 0.05;
            b.pos += b.speed;
            
            // カーブに少しだけ影響される（完全じゃないのが隙になる）
            b.x -= this.curve * 0.01;
            if (b.x < -0.8) b.x = -0.8;
            if (b.x > 0.8) b.x = 0.8;

            // プレイヤーとの衝突判定
            let dz = b.pos - this.pos;
            if (Math.abs(dz) < 80 && Math.abs(b.x - this.playerX) < 0.4) {
                if (this.item === 2 && this.itemTimer > 0) {
                    // 無敵でライバルを弾き飛ばす！
                    b.speed = 0;
                    b.x += (b.x > this.playerX) ? 0.5 : -0.5;
                    playSnd('hit');
                } else {
                    // 通常のクラッシュ（お互いに減速して弾かれる）
                    this.speed *= 0.8;
                    b.speed *= 1.1; // 敵を押し出してしまう
                    this.playerX += (this.playerX > b.x) ? 0.1 : -0.1;
                    playSnd('hit');
                }
            }
        }

        // 📦 障害物とアイテムの生成
        if (Math.random() < 0.04) {
            let isItem = Math.random() < 0.3;
            this.objects.push({
                type: isItem ? 'item' : 'obs',
                x: (Math.random() - 0.5) * 1.8,
                pos: this.pos + 2500 // 遠くに出現
            });
        }

        // 障害物の当たり判定
        for (let i = this.objects.length - 1; i >= 0; i--) {
            let o = this.objects[i];
            let dz = o.pos - this.pos;
            
            if (dz > -50 && dz < 50 && Math.abs(o.x - this.playerX) < 0.4) {
                if (o.type === 'item') {
                    this.item = Math.floor(Math.random() * 3) + 1;
                    playSnd('sel');
                } else { // 障害物（岩など）
                    if (this.item !== 2) {
                        this.speed *= 0.4; // 大減速
                        this.chaosTimer = 10;
                        playSnd('hit');
                    }
                }
                this.objects.splice(i, 1);
                continue;
            }
            if (dz < -200) this.objects.splice(i, 1); // 通過消去
        }

        // 🏁 周回(Lap)判定とクリア判定
        if (this.pos >= this.lap * this.lapLength) {
            this.lap++;
            if (this.lap > this.maxLap) {
                // 3周走りきった時の順位でクリアかゲームオーバーか判定
                let rank = this.getRank();
                if (rank <= 3) this.st = 'clear'; // 3位以上で次へ
                else this.st = 'gameover';        // 4位以下は失格
                playSnd('combo');
            } else {
                playSnd('jmp'); // ラップ更新音
            }
        }

        // ステージ3のカオス進行
        if (this.stage === 3 && Math.random() < (0.01 * this.lap)) {
            this.chaosTimer = 20; // 周回を重ねるほど画面がバグる
        }
        if (this.chaosTimer > 0) this.chaosTimer--;
    },

    // 現在の順位を計算する関数
    getRank() {
        let rank = 1;
        for (let b of this.bots) {
            if (b.pos > this.pos) rank++;
        }
        return rank;
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace';
            ctx.fillText('PIXEL KART', 40, 100);
            ctx.fillStyle = '#ff0'; ctx.fillText('MADNESS', 60, 125);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('◀ ▶: ハンドル', 60, 170);
            ctx.fillText('A: ブレーキ', 60, 190);
            ctx.fillText('B: アイテム', 60, 210);
            if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS [A] TO START', 45, 250);
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

        if (this.chaosTimer > 0 || (this.stage === 3 && this.item === 2 && this.itemTimer > 0)) {
            let hue = (Date.now() / 5) % 360;
            colors.sky = `hsl(${hue}, 100%, 20%)`; colors.road1 = `hsl(${hue + 180}, 100%, 30%)`;
        }

        ctx.fillStyle = colors.sky; ctx.fillRect(0, 0, 200, 150);
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 5; i++) {
            let bx = (this.bgOffset + i * 80) % 200; if (bx < 0) bx += 200;
            if (this.stage === 1) ctx.fillText('☁', bx, 50 + (i % 2) * 20);
            if (this.stage === 2) ctx.fillText('★', bx, 50 + (i % 2) * 20);
            if (this.stage === 3) ctx.fillText('👁', bx, 50 + Math.sin(Date.now()/100)*20);
        }

        let roadWidth = 100;
        let segLength = 20;

        for (let y = 150; y < 300; y++) {
            // 病気ギミック：周回が進むほど道が波打つ
            let wave = (this.stage === 3) ? Math.sin((y + this.pos * 0.1) * 0.05) * (this.lap * 5) : 0;
            let z = 150 / (y - 149);
            let seg = Math.floor((this.pos + z * 100) / segLength);
            
            let dx = this.curve * z * z * 0.5 + wave;
            let px = this.playerX * roadWidth / z;
            let cx = 100 - px + dx;
            let w = roadWidth / z;

            ctx.fillStyle = (seg % 2 === 0) ? colors.ground1 : colors.ground2; ctx.fillRect(0, y, 200, 1);
            ctx.fillStyle = (seg % 2 === 0) ? colors.rumble1 : colors.rumble2; ctx.fillRect(cx - w * 1.2, y, w * 2.4, 1);
            ctx.fillStyle = (seg % 2 === 0) ? colors.road1 : colors.road2; ctx.fillRect(cx - w, y, w * 2, 1);
        }

        // 描画リストの作成（Botとオブジェクトを混ぜてZ軸ソート）
        let drawList = [];
        for (let b of this.bots) {
            let z = b.pos - this.pos;
            if (z > 10 && z < 2500) drawList.push({ type: 'bot', x: b.x, z: z, color: b.color });
        }
        for (let o of this.objects) {
            let z = o.pos - this.pos;
            if (z > 10 && z < 2500) drawList.push({ type: o.type, x: o.x, z: z });
        }
        drawList.sort((a, b) => b.z - a.z); // 遠いものから描画

        for (let obj of drawList) {
            let scale = 100 / obj.z;
            let cx = 100 - (this.playerX * roadWidth * scale) + (obj.x * roadWidth * scale);
            cx += this.curve * (obj.z/100) * (obj.z/100) * 0.5;
            let cy = 150 + (150 * scale);
            let sw = 40 * scale; let sh = 40 * scale;

            if (obj.type === 'bot') {
                ctx.fillStyle = '#000'; ctx.fillRect(cx - sw/2, cy - sh, sw, sh);
                ctx.fillStyle = obj.color; ctx.fillRect(cx - sw/2 + 2, cy - sh + 2, sw - 4, sh - 10);
                ctx.fillStyle = '#fff'; ctx.fillRect(cx - sw/2 + 6, cy - sh + 6, sw - 12, 8 * scale); // 窓
                ctx.fillStyle = '#ff0'; ctx.fillRect(cx - sw/2 + 4, cy - sh + 10, 8 * scale, 8 * scale);
            } else if (obj.type === 'item') {
                ctx.fillStyle = (Math.floor(Date.now() / 100) % 2 === 0) ? '#ff0' : '#f0f'; ctx.fillRect(cx - sw/2, cy - sh, sw, sh);
                ctx.fillStyle = '#000'; ctx.font = `bold ${Math.floor(20*scale)}px monospace`; ctx.fillText('?', cx - sw/4, cy - sh/4);
            } else if (obj.type === 'obs') {
                ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(cx, cy - sh/2, sw/2, 0, Math.PI*2); ctx.fill(); // 岩
            }
        }

        // プレイヤーの車
        let pWidth = 40; let pHeight = 30;
        let bounce = (this.speed > 0 && Math.abs(this.playerX) <= 1.0) ? Math.sin(Date.now() / 50) * 2 : 0;
        if (Math.abs(this.playerX) > 1.0) bounce = Math.random() * 4 - 2; // ダート走行時はガタガタ揺れる
        
        ctx.fillStyle = '#000'; ctx.fillRect(100 - pWidth/2, 270 - pHeight + bounce, pWidth, pHeight);
        ctx.fillStyle = (this.item === 2 && this.itemTimer > 0) ? `hsl(${(Date.now()/5)%360}, 100%, 50%)` : '#00f';
        ctx.fillRect(100 - pWidth/2 + 2, 270 - pHeight + 2 + bounce, pWidth - 4, pHeight - 8);
        ctx.fillStyle = '#0ff'; ctx.fillRect(100 - 10, 270 - pHeight + 5 + bounce, 20, 10); // 窓
        ctx.fillStyle = '#f00'; ctx.fillRect(100 - 10, 270 - 15 + bounce, 20, 10); // テールランプ

        // === UI描画 ===
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        let rank = this.getRank();
        ctx.fillText(`POS ${rank}/5`, 5, 15);
        ctx.fillText(`LAP ${Math.min(this.lap, this.maxLap)}/${this.maxLap}`, 5, 30);
        ctx.fillText(`${Math.floor(this.speed)} km/h`, 5, 45);
        
        // 進行度バー
        let prog = (this.pos % this.lapLength) / this.lapLength;
        ctx.strokeStyle = '#fff'; ctx.strokeRect(5, 55, 100, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(5, 55, 100 * prog, 5);

        // アイテム
        ctx.strokeStyle = '#fff'; ctx.strokeRect(150, 5, 40, 40);
        if (this.item > 0) {
            ctx.font = '24px monospace'; ctx.fillText(["", "🍄", "⭐", "⚡"][this.item], 158, 32);
            ctx.font = '8px monospace'; ctx.fillText(this.itemNames[this.item], 150, 55);
            if (this.itemTimer > 0) { ctx.fillStyle = '#0ff'; ctx.fillRect(150, 48, 40 * (this.itemTimer/180), 3); }
        }

        // カウントダウン演出
        if (this.st === 'ready') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 40px monospace';
            let txt = Math.ceil(this.readyTimer / 30);
            if (txt === 0) txt = "GO!";
            ctx.fillText(txt, 85 - (txt === "GO!" ? 20 : 0), 160);
        }

        // 終了時メッセージ
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
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace';
            ctx.fillText('YOU LOSE...', 45, 140);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('4位以下は失格です', 50, 170);
        }
        
        // カオスエフェクト
        if (this.chaosTimer > 15 && this.stage === 3) {
            ctx.globalCompositeOperation = 'difference';
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300);
            ctx.globalCompositeOperation = 'source-over';
        }
    }
};
