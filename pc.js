// === 2D KART: MADNESS (CPU Auto-Racing & Grand Prix Edition) ===
// 3ラップ制、スリーカウント、CPUレーサーAI、遠心力カーブ、ステージ選択を搭載した完全版！

const PCApp = {
    st: 'title', // title, select, ready, play, clear, gameover
    stage: 1,    
    lap: 1,
    maxLap: 3,
    lapDist: 6000, // 1周の長さ
    
    z: 0,        // プレイヤーの進行距離
    speed: 0,
    maxSpeed: 100,
    px: 100,     // プレイヤーのX座標
    py: 220,     // プレイヤーの画面上のY位置
    
    cpus: [],    // AIレーサーたち
    items: [],   // コース上のアイテムボックス
    
    // アイテムシステム
    heldItem: 0,   
    activeItem: 0, 
    activeTimer: 0,
    
    rank: 1, 
    chaosTimer: 0,
    readyTimer: 0,
    
    init() {
        this.st = 'title';
        this.stage = 1;
        BGM.stop();
    },

    startStage(stg) {
        this.st = 'ready';
        this.stage = stg;
        this.lap = 1;
        this.z = 0;
        this.speed = 0;
        this.px = 100;
        this.items = [];
        this.heldItem = 0;
        this.activeItem = 0;
        this.activeTimer = 0;
        this.chaosTimer = 0;
        this.readyTimer = 0;
        
        // AIレーサー（CPU）7台の生成
        this.cpus = [];
        const colors = ['#0f0', '#ff0', '#f0f', '#0ff', '#fa0', '#fff', '#888'];
        for (let i = 0; i < 7; i++) {
            this.cpus.push({
                id: i + 1,
                x: 100 + (i % 2 === 0 ? -30 : 30),
                z: -50 - (i * 40), // スタートラインの後ろに並ばせる
                speed: 0,
                maxSpeed: 85 + (stg * 5) + Math.random() * 15, // CPUの速さ
                color: colors[i],
                offset: (Math.random() - 0.5) * 80 // 道のどの辺りを好んで走るか
            });
        }
        BGM.play('action');
    },

    // コースのカーブ（ウネウネ）を計算
    getTrackOffset(posZ) {
        if (this.stage === 1) return Math.sin(posZ * 0.001) * 60;
        if (this.stage === 2) return Math.sin(posZ * 0.0015) * 80 + Math.cos(posZ * 0.0005) * 30;
        if (this.stage === 3) {
            let off = (Math.sin(posZ * 0.002) + Math.cos(posZ * 0.003)) * 60;
            if (this.chaosTimer > 0) off += Math.sin(posZ * 0.1) * 20; // カオスモードの発作
            return off;
        }
        return 0;
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.a) { this.st = 'select'; playSnd('sel'); }
            return;
        }
        
        if (this.st === 'select') {
            if (keysDown.left) { this.stage = Math.max(1, this.stage - 1); playSnd('sel'); }
            if (keysDown.right) { this.stage = Math.min(3, this.stage + 1); playSnd('sel'); }
            if (keysDown.a) { this.startStage(this.stage); }
            return;
        }

        // スリーカウント演出
        if (this.st === 'ready') {
            if (this.readyTimer === 0) playSnd('sel');
            if (this.readyTimer === 60) playSnd('sel');
            if (this.readyTimer === 120) playSnd('sel');
            if (this.readyTimer === 180) { playSnd('jmp'); this.st = 'play'; }
            this.readyTimer++;
            return; // 描画のためここで止める
        }

        if (this.st === 'clear') {
            this.speed *= 0.9; 
            this.z += this.speed; 
            this.px += (100 + this.getTrackOffset(this.z) - this.px) * 0.05; // 道の中央に寄る
            if (keysDown.a) this.init(); // タイトルに戻る
            return;
        }

        // === プレイ中の処理 ===

        if (this.activeTimer > 0) {
            this.activeTimer--;
            if (this.activeTimer <= 0) this.activeItem = 0;
        }

        // アイテム使用 (十字キー上)
        if (keysDown.up && this.heldItem > 0 && this.activeTimer <= 0) {
            playSnd('combo');
            this.activeItem = this.heldItem;
            this.heldItem = 0;
            this.activeTimer = 180; // 3秒
            
            if (this.activeItem === 3) {
                // ⚡落雷: CPU全員がスピン＆大減速！
                for (let c of this.cpus) { c.speed = 0; c.offset += 50; }
                this.chaosTimer = 20; 
                playSnd('hit');
                screenShake(10);
            }
        }

        // プレイヤーのアクセル＆ブレーキ
        let limit = (this.activeItem === 1 && this.activeTimer > 0) ? this.maxSpeed * 1.5 : this.maxSpeed;
        if (keys.a) {
            this.speed += 2;
            if (this.speed > limit) this.speed = limit;
        } else if (keys.b) {
            this.speed -= 4;
        } else {
            this.speed -= 1;
        }

        // 十字キーによるハンドリング
        if (keys.left) this.px -= 3;
        if (keys.right) this.px += 3;

        // ★ 遠心力の計算（カーブがきついほど外に流される）
        let currentOffset = this.getTrackOffset(this.z);
        let nextOffset = this.getTrackOffset(this.z + 50);
        let curve = nextOffset - currentOffset; 
        this.px -= curve * 0.15 * (this.speed / this.maxSpeed);

        // ダート（コースアウト）判定
        let roadCenter = 100 + currentOffset;
        if (Math.abs(this.px - roadCenter) > 60) {
            if (this.activeItem !== 1 && this.activeItem !== 2) {
                if (this.speed > 30) this.speed -= 3; // キノコ・無敵以外は減速
            }
            if (this.px < roadCenter - 75) { this.px = roadCenter - 75; this.speed -= 5; }
            if (this.px > roadCenter + 75) { this.px = roadCenter + 75; this.speed -= 5; }
        }
        
        if (this.speed < 0) this.speed = 0;
        this.z += this.speed;

        // ★ CPU(AI)の挙動
        for (let c of this.cpus) {
            c.speed += 1; // 常にアクセル
            
            // 雷や衝突の後は最高速に戻るまで時間がかかる
            let currentLimit = c.maxSpeed;
            if (c.speed > currentLimit) c.speed = currentLimit;
            
            c.z += c.speed;
            
            // コースに沿って自動でハンドルを切る
            let targetX = 100 + this.getTrackOffset(c.z) + c.offset;
            c.x += (targetX - c.x) * 0.05;
            
            // プレイヤーとの当たり判定
            if (Math.abs(c.z - this.z) < 40 && Math.abs(c.x - this.px) < 24) {
                if (this.activeItem === 2) {
                    // 無敵でCPUを弾き飛ばす！
                    c.speed = 0; c.offset += (c.x > this.px ? 50 : -50);
                    playSnd('hit'); screenShake(3);
                } else {
                    // 通常のクラッシュ（お互い減速して反発）
                    this.speed *= 0.8; c.speed *= 0.5;
                    if (this.px < c.x) { this.px -= 5; c.x += 5; } else { this.px += 5; c.x -= 5; }
                    playSnd('hit');
                }
            }
        }

        // アイテムボックスの生成
        if (Math.random() < 0.02 && this.items.length < 3) {
            let spawnZ = this.z + 600;
            this.items.push({ x: 100 + this.getTrackOffset(spawnZ) + (Math.random() - 0.5) * 80, z: spawnZ });
        }

        // アイテムの取得と消去
        for (let i = this.items.length - 1; i >= 0; i--) {
            let itm = this.items[i];
            if (Math.abs(itm.z - this.z) < 30 && Math.abs(itm.x - this.px) < 24) {
                if (this.heldItem === 0) { 
                    this.heldItem = Math.floor(Math.random() * 3) + 1; 
                    playSnd('sel'); 
                }
                this.items.splice(i, 1);
            } else if (itm.z < this.z - 100) {
                this.items.splice(i, 1);
            }
        }

        // ★ 順位(RANK)のリアルタイム計算
        let myRank = 1;
        for (let c of this.cpus) {
            if (c.z > this.z) myRank++;
        }
        this.rank = myRank;

        // ★ ラップとクリア判定
        this.lap = Math.floor(this.z / this.lapDist) + 1;
        if (this.lap > this.maxLap) {
            this.lap = this.maxLap;
            this.st = 'clear';
            playSnd('combo');
        }

        // カオスギミック（Stage 3）
        if (this.stage === 3 && Math.random() < 0.01) this.chaosTimer = 30;
        if (this.chaosTimer > 0) this.chaosTimer--;
    },

    // 車を描画する共通関数
    drawCar(x, y, color, isPlayer) {
        let bounce = (isPlayer && this.speed > 0) ? Math.sin(Date.now() / 50) * 2 : 0;
        ctx.fillStyle = '#000'; ctx.fillRect(x - 12, y - 14 + bounce, 24, 28); // 影/タイヤ
        
        if (isPlayer && this.activeItem === 2 && this.activeTimer > 0) {
            ctx.fillStyle = `hsl(${(Date.now()/5)%360}, 100%, 50%)`; // 無敵の虹色
        } else {
            ctx.fillStyle = color;
        }
        ctx.fillRect(x - 10, y - 12 + bounce, 20, 24); // 車体
        
        ctx.fillStyle = '#0ff'; ctx.fillRect(x - 8, y - 2 + bounce, 16, 6); // 窓
        ctx.fillStyle = isPlayer ? '#00f' : '#f00'; 
        ctx.fillRect(x - 8, y - 12 + bounce, 4, 4); ctx.fillRect(x + 4, y - 12 + bounce, 4, 4); // ランプ
    },

    draw() {
        // 背景
        ctx.fillStyle = ['#2a2', '#141', '#202'][this.stage - 1];
        if (this.chaosTimer > 0) ctx.fillStyle = `hsl(${(Date.now()/10)%360}, 100%, 30%)`;
        ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title' || this.st === 'select') {
            ctx.fillStyle = '#000'; ctx.fillRect(20, 40, 160, 60);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace'; ctx.textAlign='center'; ctx.fillText('2D KART', 100, 65);
            ctx.fillStyle = '#ff0'; ctx.fillText('MADNESS', 100, 85); ctx.textAlign='left';
            
            if (this.st === 'title') {
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('A:アクセル B:ブレーキ', 30, 180); ctx.fillText('UP(上): アイテム使用', 35, 200);
                if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS [A] TO START', 45, 240);
            } else if (this.st === 'select') {
                ctx.fillStyle = '#0f0'; ctx.fillRect(20, 150, 160, 50);
                ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace'; ctx.fillText('SELECT CUP (◀ ▶)', 35, 165);
                let sName = ["GRASS CUP", "MIDNIGHT CUP", "CHAOS CUP"][this.stage - 1];
                ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.fillText(sName, 35, 185);
            }
            return;
        }

        // === 道路の描画 (ラスタースクロール風) ===
        let roadCol = ['#666', '#444', '#303'][this.stage - 1];
        let lineCol = ['#fff', '#dd0', '#f0f'][this.stage - 1];
        let rumble1 = ['#f00', '#f00', '#0ff'][this.stage - 1];
        let rumble2 = ['#fff', '#fff', '#f0f'][this.stage - 1];

        for (let y = 0; y < 300; y += 5) {
            let virtualZ = this.z + (240 - y);
            if (virtualZ < -200) continue; // 後ろすぎたら描画しない
            
            let cx = 100 + this.getTrackOffset(virtualZ);
            let isRumble = Math.floor(virtualZ / 20) % 2 === 0;
            
            ctx.fillStyle = isRumble ? rumble1 : rumble2; ctx.fillRect(cx - 65, y, 130, 5); // 縁石
            ctx.fillStyle = roadCol; ctx.fillRect(cx - 60, y, 120, 5); // アスファルト
            if (isRumble) { ctx.fillStyle = lineCol; ctx.fillRect(cx - 2, y, 4, 5); } // 白線
        }

        // スタート/ゴールラインの描画
        for (let l = 0; l <= this.maxLap; l++) {
            let lineZ = l * this.lapDist;
            let lineY = 240 - (lineZ - this.z);
            if (lineY > -10 && lineY < 300) {
                let cx = 100 + this.getTrackOffset(lineZ);
                for(let i = -60; i < 60; i += 10) {
                    ctx.fillStyle = (Math.floor(i/10)%2 === 0) ? '#fff' : '#000';
                    ctx.fillRect(cx + i, lineY, 10, 8);
                }
            }
        }

        // === オブジェクト（CPU・アイテム・プレイヤー）をZ座標順に描画 ===
        let drawQueue = [];
        drawQueue.push({ type: 'player', x: this.px, y: this.py, z: this.z });
        for (let c of this.cpus) {
            drawQueue.push({ type: 'cpu', x: c.x, y: 240 - (c.z - this.z), z: c.z, color: c.color });
        }
        for (let itm of this.items) {
            drawQueue.push({ type: 'item', x: itm.x, y: 240 - (itm.z - this.z), z: itm.z });
        }

        // 奥にあるもの（Zが大きい）から順に描画
        drawQueue.sort((a, b) => b.z - a.z);

        for (let obj of drawQueue) {
            if (obj.y < -30 || obj.y > 330) continue; // 画面外
            
            if (obj.type === 'player') {
                this.drawCar(obj.x, obj.y, '#00f', true);
            } else if (obj.type === 'cpu') {
                this.drawCar(obj.x, obj.y, obj.color, false);
            } else if (obj.type === 'item') {
                ctx.fillStyle = (Math.floor(Date.now()/100)%2===0) ? '#ff0' : '#f0f';
                ctx.fillRect(obj.x - 12, obj.y - 12, 24, 24);
                ctx.fillStyle = '#000'; ctx.font = 'bold 20px monospace'; ctx.fillText('?', obj.x - 6, obj.y + 6);
            }
        }

        // === UI（画面表示） ===
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, 200, 25);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`LAP ${this.lap}/${this.maxLap}`, 5, 17);
        ctx.fillStyle = (this.rank === 1) ? '#ff0' : '#fff';
        ctx.fillText(`RANK ${this.rank}/8`, 75, 17);
        
        // ★ 巨大化したアイテム枠
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(145, 30, 45, 45);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(145, 30, 45, 45); ctx.lineWidth = 1;
        if (this.heldItem > 0) {
            ctx.font = '30px monospace'; ctx.fillText(["", "🍄", "⭐", "⚡"][this.heldItem], 152, 62);
        }
        if (this.activeTimer > 0) {
            ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('ACTIVE', 148, 85);
            ctx.fillStyle = '#0ff'; ctx.fillRect(145, 75, 45 * (this.activeTimer/180), 4);
        }

        // スリーカウント描画
        if (this.st === 'ready') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 100, 200, 80);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
            let num = 3 - Math.floor(this.readyTimer / 60);
            if (num > 0) { ctx.fillText(num, 100, 155); } 
            else if (this.readyTimer < 240) { ctx.fillStyle = '#ff0'; ctx.fillText('GO!', 100, 155); }
            ctx.textAlign = 'left';
        }

        // クリアメッセージ
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
            ctx.fillText('GOAL!!', 100, 130);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`FINAL RANK: ${this.rank}`, 100, 155);
            ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO TITLE', 100, 180);
            ctx.textAlign = 'left';
        }
        
        // カオスステージのエフェクト
        if (this.chaosTimer > 15 && this.stage === 3) {
            ctx.globalCompositeOperation = 'difference'; 
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); 
            ctx.globalCompositeOperation = 'source-over';
        }
    }
};
