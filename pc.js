// === MAD KART EVOLUTION (Full 2D Racing with Bots & Minimap) ===
// 障害物システムを廃止し、7人のBotと順位を競い合う本格レーシングへ進化。

const PCApp = {
    st: 'title', 
    stage: 1,    
    pos: 0,      
    speed: 0,
    maxSpeed: 130,
    playerTrackX: 0, // 道の中心からの相対X座標 (-70 〜 70)
    
    bots: [], items: [],
    
    heldItem: 0, activeItem: 0, activeTimer: 0,
    itemNames: ["", "🍄ダッシュ", "⭐無敵", "⚡落雷"],
    
    rank: 8, goal: 20000, chaosTimer: 0,

    init() {
        this.st = 'title'; this.stage = 1; BGM.stop();
    },

    startStage(stg) {
        this.st = 'play'; this.stage = stg;
        this.pos = 0; this.speed = 0; this.playerTrackX = 0;
        this.heldItem = 0; this.activeItem = 0; this.activeTimer = 0;
        this.chaosTimer = 0;
        this.goal = 15000 + stg * 5000;
        
        // 🏁 Bot（7人）の生成
        this.bots = [];
        let colors = ['#f00', '#0f0', '#ff0', '#f0f', '#0ff', '#fa0', '#fff'];
        for(let i=0; i<7; i++) {
            this.bots.push({
                id: i,
                z: 300 + i * 150, // プレイヤーの少し前からスタート
                trackX: (i%2 === 0 ? -35 : 35),
                speed: 50,
                baseSpeed: 90 + i*4 + (stg*5), // 前のBotほど速い
                color: colors[i],
                shock: 0 // サンダーの感電タイマー
            });
        }

        // 📦 アイテムの配置
        this.items = [];
        for (let z = 1000; z < this.goal - 1000; z += 1000) {
            this.items.push({ z: z, trackX: -45, active: true });
            this.items.push({ z: z, trackX: 0, active: true });
            this.items.push({ z: z, trackX: 45, active: true });
        }

        BGM.play('action');
    },

    // コースのカーブ計算
    getTrackOffset(z) {
        let offset = 0;
        if (this.stage === 1) {
            offset = Math.sin(z * 0.001) * 60;
        } else if (this.stage === 2) {
            offset = Math.sin(z * 0.0015) * 80 + Math.cos(z * 0.0007) * 40;
        } else if (this.stage === 3) {
            offset = Math.sin(z * 0.002) * 100 + Math.cos(z * 0.0011) * 70;
            if (this.chaosTimer > 0) offset += Math.sin(z * 0.05) * 20; // 病気ギミック
        }
        return offset;
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.a) this.startStage(1);
            return;
        }

        if (this.st === 'clear') {
            this.speed *= 0.95; this.pos += this.speed; this.playerTrackX *= 0.9;
            for (let b of this.bots) b.z += b.speed; 
            if (keysDown.a) { if (this.stage < 3) this.startStage(this.stage + 1); else this.init(); }
            return;
        }

        // === プレイ中の処理 ===

        if (this.activeTimer > 0) {
            this.activeTimer--;
            if (this.activeTimer <= 0) this.activeItem = 0;
        }

        // ★修正: アイテム使用を「Bボタン」に変更！
        if (keysDown.b && this.heldItem > 0 && this.activeTimer <= 0) {
            playSnd('combo');
            this.activeItem = this.heldItem;
            this.heldItem = 0;
            this.activeTimer = 180;
            
            if (this.activeItem === 3) {
                // ⚡サンダー: 全Botを感電減速
                for (let bot of this.bots) bot.shock = 60;
                this.chaosTimer = 20;
                playSnd('hit');
            }
        }

        // アクセル・ブレーキ (ブレーキを十字キー下に変更)
        let limit = (this.activeItem === 1 && this.activeTimer > 0) ? this.maxSpeed * 1.4 : this.maxSpeed;
        if (keys.a) {
            this.speed += 2;
            if (this.speed > limit) this.speed = limit;
        } else if (keys.down) {
            this.speed -= 4; // 急ブレーキ
        } else {
            this.speed -= 1; // 惰性
        }

        // ハンドル
        if (keys.left) this.playerTrackX -= 4;
        if (keys.right) this.playerTrackX += 4;

        // 遠心力
        let curveDelta = this.getTrackOffset(this.pos + 10) - this.getTrackOffset(this.pos);
        this.playerTrackX -= curveDelta * (this.speed / this.maxSpeed) * 3;

        // ダート(道外)減速
        if (Math.abs(this.playerTrackX) > 65) {
            if (this.activeItem !== 1 && this.activeItem !== 2) {
                if (this.speed > 50) this.speed -= 3;
            }
            // 壁
            if (Math.abs(this.playerTrackX) > 90) {
                this.playerTrackX = 90 * Math.sign(this.playerTrackX);
                this.speed -= 5;
            }
        }
        
        if (this.speed < 0) this.speed = 0;
        this.pos += this.speed;

        // ★ Bot(敵)のAI更新
        for (let bot of this.bots) {
            if (bot.shock > 0) {
                bot.shock--; bot.speed *= 0.95; // 感電中は超減速
            } else {
                if (bot.speed < bot.baseSpeed) bot.speed += 1;
                // 道の中央へ戻ろうとする
                if (bot.trackX > 0) bot.trackX -= 1;
                if (bot.trackX < 0) bot.trackX += 1;
            }
            
            let botCurveDelta = this.getTrackOffset(bot.z + 10) - this.getTrackOffset(bot.z);
            bot.trackX -= botCurveDelta * 1.5;

            if (Math.abs(bot.trackX) > 65) {
                bot.speed *= 0.98;
                if (Math.abs(bot.trackX) > 80) bot.trackX = 80 * Math.sign(bot.trackX);
            }
            bot.z += bot.speed;
        }

        // 🏁 順位の計算
        let racers = [{id: 'p', z: this.pos}];
        for (let b of this.bots) racers.push({id: b.id, z: b.z});
        racers.sort((a,b) => b.z - a.z);
        this.rank = racers.findIndex(r => r.id === 'p') + 1;

        // 💥 車同士の衝突判定
        for (let bot of this.bots) {
            let distZ = Math.abs(bot.z - this.pos);
            let distX = Math.abs(bot.trackX - this.playerTrackX);
            if (distZ < 40 && distX < 16) {
                if (this.activeItem === 2) {
                    bot.shock = 60; // 無敵で弾き飛ばす
                    bot.trackX += (bot.trackX > this.playerTrackX) ? 30 : -30;
                    playSnd('hit'); screenShake(3);
                } else {
                    this.speed *= 0.8; bot.speed *= 0.8; // お互いに減速・反発
                    if (this.playerTrackX < bot.trackX) { this.playerTrackX -= 5; bot.trackX += 5; }
                    else { this.playerTrackX += 5; bot.trackX -= 5; }
                    playSnd('hit');
                }
            }
        }

        // 📦 アイテム取得判定
        for (let i = this.items.length - 1; i >= 0; i--) {
            let itm = this.items[i];
            if (!itm.active) continue;
            let distZ = Math.abs(itm.z - this.pos);
            let distX = Math.abs(itm.trackX - this.playerTrackX);
            
            // プレイヤーが取る
            if (itm.z > this.pos - 10 && itm.z < this.pos + 30 && distX < 20) {
                itm.active = false;
                if (this.heldItem === 0) {
                    this.heldItem = Math.floor(Math.random() * 3) + 1;
                    playSnd('sel');
                }
            }
            // Botもアイテムを破壊(取得)する
            for (let bot of this.bots) {
                if (itm.active && Math.abs(itm.z - bot.z) < 30 && Math.abs(itm.trackX - bot.trackX) < 20) {
                    itm.active = false; break;
                }
            }
        }

        if (this.stage === 3 && Math.random() < 0.01) this.chaosTimer = 30;
        if (this.chaosTimer > 0) this.chaosTimer--;

        if (this.pos > this.goal) { this.st = 'clear'; playSnd('combo'); }
    },

    draw() {
        ctx.fillStyle = ['#2a2', '#141', '#202'][this.stage - 1];
        if (this.chaosTimer > 0) ctx.fillStyle = `hsl(${(Date.now()/10)%360}, 100%, 30%)`;
        ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#000'; ctx.fillRect(10, 60, 180, 100);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace'; ctx.fillText('MAD KART', 50, 90);
            ctx.fillStyle = '#ff0'; ctx.fillText('EVOLUTION', 45, 115);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('A:アクセル  ▼:ブレーキ', 20, 140);
            ctx.fillText('B:アイテム使用', 45, 155);
            if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('PRESS [A] TO START', 45, 220);
            return;
        }

        // === 道路描画 (★スケールを調整して広範囲を描画) ===
        let roadCol = ['#666', '#444', '#303'][this.stage - 1];
        let lineCol = ['#fff', '#dd0', '#f0f'][this.stage - 1];
        let rumble1 = ['#f00', '#f00', '#0ff'][this.stage - 1];
        let rumble2 = ['#fff', '#fff', '#f0f'][this.stage - 1];

        // yを4ピクセルずつ飛ばすことで遠くまで見せる
        for (let y = 0; y < 300; y += 4) {
            let virtualZ = this.pos + (240 - y) * 2.5; 
            let curveOffset = this.getTrackOffset(virtualZ) - this.getTrackOffset(this.pos);
            let cx = 100 + curveOffset - this.playerTrackX; // 自車を中央に固定し、道が動く
            let isRumble = Math.floor(virtualZ / 50) % 2 === 0;
            
            ctx.fillStyle = isRumble ? rumble1 : rumble2;
            ctx.fillRect(cx - 75, y, 150, 4); // 縁石
            ctx.fillStyle = roadCol;
            ctx.fillRect(cx - 70, y, 140, 4); // アスファルト
            if (isRumble) {
                ctx.fillStyle = lineCol; ctx.fillRect(cx - 2, y, 4, 4); // センターライン
            }
        }

        // === スプライト描画 (Zソート) ===
        let renderList = [];
        for (let bot of this.bots) {
            let y = 240 - (bot.z - this.pos) / 2.5;
            let cx = 100 + this.getTrackOffset(bot.z) - this.getTrackOffset(this.pos) + bot.trackX - this.playerTrackX;
            renderList.push({type: 'bot', y: y, x: cx, obj: bot});
        }
        for (let itm of this.items) {
            if(!itm.active) continue;
            let y = 240 - (itm.z - this.pos) / 2.5;
            let cx = 100 + this.getTrackOffset(itm.z) - this.getTrackOffset(this.pos) + itm.trackX - this.playerTrackX;
            renderList.push({type: 'item', y: y, x: cx, obj: itm});
        }
        renderList.push({type: 'player', y: 240, x: 100}); // 自車
        renderList.sort((a,b) => a.y - b.y); // 奥から手前へ

        for (let r of renderList) {
            if (r.y < -30 || r.y > 330) continue;
            
            if (r.type === 'item') {
                ctx.fillStyle = (Math.floor(Date.now()/100)%2===0) ? '#ff0' : '#f0f';
                ctx.fillRect(r.x - 8, r.y - 8, 16, 16);
                ctx.fillStyle = '#000'; ctx.font = 'bold 12px monospace'; ctx.fillText('?', r.x - 4, r.y + 4);
            } 
            else if (r.type === 'bot') {
                let bounce = (r.obj.speed > 0) ? Math.sin(r.obj.z * 0.1) * 2 : 0;
                ctx.fillStyle = '#000'; ctx.fillRect(r.x - 9, r.y - 12 + bounce, 18, 24); // 影/タイヤ
                ctx.fillStyle = r.obj.color; ctx.fillRect(r.x - 7, r.y - 10 + bounce, 14, 20); // 車体
                ctx.fillStyle = '#0ff'; ctx.fillRect(r.x - 5, r.y - 2 + bounce, 10, 4); // 窓
                if(r.obj.shock > 0) { ctx.fillStyle = 'rgba(255,255,0,0.7)'; ctx.fillRect(r.x-12, r.y-14, 24, 28); }
            } 
            else if (r.type === 'player') {
                let bounce = (this.speed > 0) ? Math.sin(this.pos * 0.1) * 2 : 0;
                ctx.fillStyle = '#000'; ctx.fillRect(r.x - 9, r.y - 12 + bounce, 18, 24);
                ctx.fillStyle = (this.activeItem === 2 && this.activeTimer > 0) ? `hsl(${(Date.now()/5)%360}, 100%, 50%)` : '#00f';
                ctx.fillRect(r.x - 7, r.y - 10 + bounce, 14, 20);
                ctx.fillStyle = '#0ff'; ctx.fillRect(r.x - 5, r.y - 2 + bounce, 10, 4); 
                ctx.fillStyle = '#f00'; ctx.fillRect(r.x - 6, r.y - 10 + bounce, 3, 3); ctx.fillRect(r.x + 3, r.y - 10 + bounce, 3, 3);
            }
        }

        // === UI ===
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 200, 25);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
        ctx.fillText(`STG ${this.stage}`, 5, 10);
        ctx.fillStyle = (this.rank === 1) ? '#ff0' : '#fff';
        ctx.font = 'bold 14px monospace'; ctx.fillText(`RANK ${this.rank}/8`, 5, 23);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`${Math.floor(this.speed)}km/h`, 80, 22);

        // アイテム枠
        ctx.strokeStyle = '#fff'; ctx.strokeRect(120, 3, 20, 20);
        if (this.heldItem > 0) {
            ctx.font = '14px monospace'; ctx.fillText(["", "🍄", "⭐", "⚡"][this.heldItem], 122, 18);
        }
        if (this.activeTimer > 0) {
            ctx.fillStyle = '#f00'; ctx.font = '8px monospace'; ctx.fillText('ACT', 145, 12);
            ctx.fillStyle = '#0ff'; ctx.fillRect(145, 15, 25 * (this.activeTimer/180), 3);
        }

        // 📍 ミニマップ (画面右上に設置)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(180, 30, 15, 100);
        ctx.fillStyle = '#fff'; ctx.fillRect(180, 30, 15, 2); // ゴール線
        
        // 自車の点
        let pMapY = 30 + 100 - Math.min((this.pos / this.goal) * 100, 100);
        ctx.fillStyle = '#00f'; ctx.fillRect(182, pMapY, 11, 4); 

        // Botの点
        for (let bot of this.bots) {
            let bMapY = 30 + 100 - Math.min((bot.z / this.goal) * 100, 100);
            if (bMapY >= 30 && bMapY <= 130) {
                ctx.fillStyle = bot.color; ctx.fillRect(184, bMapY, 7, 3);
            }
        }

        // メッセージ
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 100, 200, 100);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
            if (this.stage < 3) {
                ctx.fillText(`STAGE CLEAR!`, 40, 130);
                ctx.fillText(`RANK: ${this.rank}`, 65, 150);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO NEXT', 50, 180);
            } else {
                ctx.fillText('ALL CLEAR!!', 50, 130);
                ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`FINAL RANK: ${this.rank}`, 50, 160);
            }
        }
        
        if (this.chaosTimer > 15 && this.stage === 3) {
            ctx.globalCompositeOperation = 'difference'; 
            ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); 
            ctx.globalCompositeOperation = 'source-over';
        }
    }
};
