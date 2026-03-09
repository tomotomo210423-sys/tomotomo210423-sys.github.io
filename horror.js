// === CURSED MANOR (2D Survival Horror) ===
// スタミナ管理、心音センサー、視界制限、隠れギミックを搭載した最恐プロトタイプ！

const Horror = {
    st: 'menu', timer: 0,
    camX: 0, camY: 0,
    p: { x: 30, y: 30, r: 6, spd: 1, st: 100, maxSt: 100, isExh: false, isHide: false },
    e: { x: 300, y: 300, r: 8, spd: 0.7, state: 'patrol', tgtX: 0, tgtY: 0, alert: 0 },
    keys: 0, maxKeys: 3,
    msg: '', msgTimer: 0,

    // 0:床, 1:壁, 2:出口(上部), 3:ロッカー(隠れ場所), 4:鍵
    mapW: 20, mapH: 20, ts: 20,
    map: [
        1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,
        1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,3,0,1,
        1,0,3,0,1,0,1,1,1,1,1,1,1,0,1,0,0,0,0,1,
        1,0,0,0,1,0,1,4,0,0,0,0,1,0,1,1,1,0,1,1,
        1,1,0,1,1,0,1,1,1,1,1,0,1,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,1,0,1,0,1,1,1,1,0,1,
        1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,3,0,1,0,1,
        1,0,1,3,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,1,
        1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,
        1,4,0,0,1,0,1,0,0,0,3,0,1,0,1,0,0,4,0,1,
        1,0,0,0,1,0,1,0,1,1,1,0,1,0,1,0,0,0,0,1,
        1,0,3,0,1,0,1,0,1,4,1,0,1,0,1,1,0,1,1,1,
        1,1,1,1,1,0,1,0,1,1,1,0,1,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,1,
        1,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,0,1,
        1,0,1,3,0,0,0,0,0,0,1,1,1,1,1,1,0,1,0,1,
        1,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],

    init() {
        this.st = 'menu'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false };
        this.e = { x: 350, y: 350, r: 8, spd: 0.8, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0 };
        this.keys = 0; this.msg = ''; this.msgTimer = 0;
        
        // 鍵をマップに再配置
        let m = [...this.map];
        for(let i=0; i<m.length; i++) if(m[i]===5) m[i]=4; // リセット
        this.map = m;
        BGM.stop();
    },

    setMsg(text) { this.msg = text; this.msgTimer = 90; },

    getTile(x, y) {
        let tx = Math.floor(x / this.ts), ty = Math.floor(y / this.ts);
        if(tx < 0 || tx >= this.mapW || ty < 0 || ty >= this.mapH) return 1;
        return this.map[ty * this.mapW + tx];
    },

    colSq(nx, ny, r) {
        let pts = [ [nx-r,ny-r], [nx+r,ny-r], [nx-r,ny+r], [nx+r,ny+r] ];
        for(let pt of pts) if(this.getTile(pt[0], pt[1]) === 1 || this.getTile(pt[0], pt[1]) === 2) return true;
        return false;
    },

    update() {
        this.timer++;
        let kD = typeof keysDown !== 'undefined' ? keysDown : {};
        let k = typeof keys !== 'undefined' ? keys : {};

        if (this.st === 'menu') {
            if (kD.a) { this.st = 'play'; playSnd('jmp'); this.setMsg('FIND 3 KEYS AND ESCAPE...'); }
        }
        else if (this.st === 'play') {
            // --- プレイヤーの移動とスタミナ管理 ---
            if (!this.p.isHide) {
                let dx = 0, dy = 0;
                if (k.left) dx = -1; if (k.right) dx = 1;
                if (k.up) dy = -1; if (k.down) dy = 1;

                let isRunning = k.b && (dx !== 0 || dy !== 0) && !this.p.isExh;
                let curSpd = this.p.spd;

                if (this.p.isExh) {
                    curSpd = 0.5; // 息切れで這うような遅さに！
                    this.p.st += 0.2;
                    if (this.p.st >= 50) this.p.isExh = false; // 50%まで回復で走れるように
                } else if (isRunning) {
                    curSpd = 2.2; // ダッシュ！
                    this.p.st -= 1.5;
                    if (this.p.st <= 0) { this.p.st = 0; this.p.isExh = true; } // スタミナ切れ！
                } else {
                    this.p.st += 0.5; // 歩き/立ち止まりで回復
                    if (this.p.st > this.p.maxSt) this.p.st = this.p.maxSt;
                }

                if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } // 斜め移動補正
                let nx = this.p.x + dx * curSpd;
                let ny = this.p.y + dy * curSpd;
                
                if (!this.colSq(nx, this.p.y, this.p.r)) this.p.x = nx;
                if (!this.colSq(this.p.x, ny, this.p.r)) this.p.y = ny;

                // 足音ギミック（走ると敵に気づかれやすい）
                if (isRunning && this.timer % 10 === 0) this.e.alert += 5;
            }

            // --- Aボタンアクション（調べる / 隠れる） ---
            if (kD.a) {
                let tx = Math.floor(this.p.x / this.ts), ty = Math.floor(this.p.y / this.ts);
                let tile = this.map[ty * this.mapW + tx];

                if (this.p.isHide) {
                    this.p.isHide = false; // 出る
                    this.setMsg('LEFT THE LOCKER.');
                } else if (tile === 3) {
                    // 敵に追われている真っ最中に目の前で隠れると引きずり出されるが、V1は一旦絶対安全に
                    this.p.isHide = true; 
                    this.setMsg('HIDDEN IN LOCKER...');
                } else if (tile === 4) {
                    this.keys++;
                    this.map[ty * this.mapW + tx] = 0; // 鍵取得済み
                    playSnd('coin');
                    this.setMsg(`KEY FOUND! (${this.keys}/${this.maxKeys})`);
                } else if (ty <= 1 && tile === 0 && this.p.y < 30) {
                    // 脱出判定
                    if (this.keys >= this.maxKeys) {
                        this.st = 'clear'; playSnd('powerup');
                    } else {
                        this.setMsg('LOCKED... NEED MORE KEYS.');
                    }
                }
            }

            // --- バケモノ（敵）のAI ---
            let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
            
            // 視界チェック（簡易版：近くて隠れてなければ発見）
            if (dist < 80 && !this.p.isHide) this.e.alert += 10;
            if (this.p.isHide && this.e.alert > 0) this.e.alert -= 1; // 隠れていると諦め始める
            
            if (this.e.alert > 100) this.e.alert = 100;
            if (this.e.alert < 0) this.e.alert = 0;

            if (this.e.alert > 50 && !this.p.isHide) {
                this.e.state = 'chase';
                this.e.spd = 1.6; // プレイヤーの歩きより少し速い絶望感！
                this.e.tgtX = this.p.x; this.e.tgtY = this.p.y;
            } else {
                this.e.state = 'patrol';
                this.e.spd = 0.6;
                // 適当な場所へ徘徊
                if (Math.hypot(this.e.tgtX - this.e.x, this.e.tgtY - this.e.y) < 5 || this.timer % 120 === 0) {
                    this.e.tgtX = this.e.x + (Math.random()-0.5)*100;
                    this.e.tgtY = this.e.y + (Math.random()-0.5)*100;
                }
            }

            // 敵の移動処理
            let edx = this.e.tgtX - this.e.x, edy = this.e.tgtY - this.e.y;
            let elen = Math.hypot(edx, edy);
            if (elen > 0) {
                edx /= elen; edy /= elen;
                let enx = this.e.x + edx * this.e.spd;
                let eny = this.e.y + edy * this.e.spd;
                if (!this.colSq(enx, this.e.y, this.e.r)) this.e.x = enx; else this.e.tgtX = this.e.x;
                if (!this.colSq(this.e.x, eny, this.e.r)) this.e.y = eny; else this.e.tgtY = this.e.y;
            }

            // 捕まったらゲームオーバー
            if (dist < this.p.r + this.e.r && !this.p.isHide) {
                this.st = 'jumpscare'; this.timer = 0; 
                screenShake(20); playSnd('hit');
            }

            // メッセージタイマー
            if (this.msgTimer > 0) this.msgTimer--;

            // カメラ追従
            this.camX = this.p.x - 100; this.camY = this.p.y - 150;
            if(this.camX < 0) this.camX = 0; if(this.camY < 0) this.camY = 0;
            if(this.camX > this.mapW*this.ts - 200) this.camX = this.mapW*this.ts - 200;
            if(this.camY > this.mapH*this.ts - 300) this.camY = this.mapH*this.ts - 300;
        }
        else if (this.st === 'jumpscare') {
            if (this.timer > 60) { this.init(); } // 1秒後にリセット
        }
        else if (this.st === 'clear') {
            if (kD.a || kD.start) this.init();
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            ctx.fillStyle = '#800'; ctx.font = 'bold 20px monospace'; ctx.fillText('CURSED MANOR', 30, 100);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('SURVIVAL HORROR V1', 50, 120);
            ctx.fillStyle = (this.timer % 60 < 30) ? '#f00' : '#fff';
            ctx.fillText('PRESS A TO ENTER...', 45, 200);
            return;
        }

        if (this.st === 'jumpscare') {
            // 恐怖のジャンプスケア画面
            ctx.fillStyle = (this.timer % 4 < 2) ? '#f00' : '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 50px monospace'; ctx.fillText('💀', 70, 160);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace'; ctx.fillText('YOU ARE DEAD', 30, 220);
            return;
        }

        if (this.st === 'clear') {
            ctx.fillStyle = '#002'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('ESCAPED!', 55, 120);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('TO BE CONTINUED...', 50, 160);
            return;
        }

        ctx.save();
        ctx.translate(-this.camX, -this.camY);

        // マップ描画
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                let px = x * this.ts, py = y * this.ts;
                // 画面外は描画スキップ
                if (px < this.camX - this.ts || px > this.camX + 200 || py < this.camY - this.ts || py > this.camY + 300) continue;

                let t = this.map[y * this.mapW + x];
                if (t === 1) { ctx.fillStyle = '#222'; ctx.fillRect(px, py, this.ts, this.ts); ctx.strokeStyle = '#111'; ctx.strokeRect(px, py, this.ts, this.ts); } // 壁
                else if (t === 0 || t === 3 || t === 4) { ctx.fillStyle = '#1a1a1a'; ctx.fillRect(px, py, this.ts, this.ts); } // 床
                else if (t === 2) { ctx.fillStyle = '#522'; ctx.fillRect(px, py, this.ts, this.ts); ctx.fillStyle = '#fff'; ctx.fillText('EXIT', px-5, py+15); } // 出口
                
                // オブジェクト
                if (t === 3) { ctx.fillStyle = '#048'; ctx.fillRect(px+2, py+2, 16, 16); } // ロッカー
                if (t === 4) { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(px+10, py+10, 4, 0, Math.PI*2); ctx.fill(); } // 鍵
            }
        }

        // 敵の描画
        ctx.fillStyle = '#a00'; ctx.beginPath(); ctx.arc(this.e.x, this.e.y, this.e.r, 0, Math.PI * 2); ctx.fill();
        if (this.e.state === 'chase') { ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('!', this.e.x-3, this.e.y-10); }

        // プレイヤーの描画 (隠れていない時だけ)
        if (!this.p.isHide) {
            ctx.fillStyle = this.p.isExh ? '#55f' : '#0ff'; 
            ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();

        // --- 視界の暗闇（ライト）演出 ---
        let sightRadius = this.p.isHide ? 30 : 80;
        let gradX = this.p.x - this.camX;
        let gradY = this.p.y - this.camY;
        
        ctx.globalCompositeOperation = 'source-over';
        let darkGrad = ctx.createRadialGradient(gradX, gradY, 10, gradX, gradY, sightRadius);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
        darkGrad.addColorStop(1, 'rgba(0,0,0,0.98)');
        
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, 200, 300); // プレイヤーの周囲以外を黒で塗りつぶす

        // --- 心音演出（画面の赤い明滅） ---
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        if (dist < 120 && !this.p.isHide) {
            let intensity = 1 - (dist / 120);
            let pulse = (Math.sin(Date.now() / (150 - intensity*100)) + 1) / 2; // 近いほど早く脈打つ
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * intensity * 0.4})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        // --- UI（スタミナ、鍵、メッセージ） ---
        // スタミナバー
        ctx.fillStyle = '#000'; ctx.fillRect(10, 10, 50, 5);
        ctx.fillStyle = this.p.isExh ? '#f00' : '#0f0'; 
        ctx.fillRect(10, 10, 50 * (this.p.st / this.p.maxSt), 5);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 50, 5);

        // 鍵アイコン
        ctx.fillStyle = '#ff0'; ctx.font = '10px monospace';
        ctx.fillText(`KEYS: ${this.keys}/${this.maxKeys}`, 130, 15);

        // メッセージ
        if (this.msgTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 260, 200, 30);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            let tw = ctx.measureText(this.msg).width;
            ctx.fillText(this.msg, 100 - tw/2, 280);
        }
    }
};
