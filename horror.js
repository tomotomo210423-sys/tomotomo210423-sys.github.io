// === CURSED MANOR V2 (Graphic Upgrade & Bug Fixes) ===
// マップ修正、スタックバグ修正、スタミナ調整、専用ドット絵を追加！

const Horror = {
    st: 'menu', timer: 0,
    camX: 0, camY: 0,
    p: { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false },
    e: { x: 190, y: 190, r: 8, spd: 0.8, state: 'patrol', tgtX: 190, tgtY: 190, alert: 0 },
    keys: 0, maxKeys: 3,
    msg: '', msgTimer: 0,

    // 0:床, 1:壁, 2:出口, 3:ロッカー, 4:鍵
    mapW: 20, mapH: 20, ts: 20,
    map: [
        1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,4,1,
        1,0,3,0,0,1,0,1,1,1,1,1,1,0,1,0,3,0,0,1,
        1,0,0,0,0,0,0,1,0,0,0,0,1,0,1,1,1,0,0,1,
        1,1,1,0,1,1,0,1,0,3,0,0,1,0,0,0,0,0,0,1,
        1,0,0,0,1,4,0,1,1,1,0,1,1,1,1,1,1,1,0,1,
        1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,
        1,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1,
        1,1,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1,
        1,4,1,0,1,0,1,0,3,0,0,0,3,0,0,1,0,1,0,1,
        1,0,1,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,
        1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,
        1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,1,0,1,4,0,0,0,0,0,0,0,1,
        1,0,3,0,0,0,3,0,1,0,1,0,0,3,0,0,3,0,0,1,
        1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],

    // ドット絵データ (8x8)
    sprs: {
        // 主人公
        p: { d: "........01111000121121001111110004444000404404003003300300033000", pal: {'1':'#fcc', '2':'#000', '3':'#222', '4':'#08f'} },
        // バケモノ
        e: { d: "........05555000565565005555550055775500555555005500005500000000", pal: {'5':'#800', '6':'#ff0', '7':'#fff'} }
    },

    init() {
        this.st = 'menu'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false };
        // 敵の初期位置を確実に床(180, 180)に変更し、壁めり込みを防止！
        this.e = { x: 190, y: 190, r: 8, spd: 0.8, state: 'patrol', tgtX: 190, tgtY: 190, alert: 0 };
        this.keys = 0; this.msg = ''; this.msgTimer = 0;
        
        let m = [...this.map];
        for(let i=0; i<m.length; i++) if(m[i]===5) m[i]=4;
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
        let pts = [ [nx-r+2,ny-r+2], [nx+r-2,ny-r+2], [nx-r+2,ny+r-2], [nx+r-2,ny+r-2] ];
        for(let pt of pts) if(this.getTile(pt[0], pt[1]) === 1 || this.getTile(pt[0], pt[1]) === 2) return true;
        return false;
    },

    drawSprite(x, y, sName) {
        let s = this.sprs[sName];
        let scale = 1.5; // キャラクターを少し大きく描画
        let ox = x - 4 * scale; let oy = y - 4 * scale;
        for(let i=0; i<64; i++) {
            let p = s.d[i];
            if(p !== '0' && p !== '.') {
                ctx.fillStyle = s.pal[p];
                ctx.fillRect(ox + (i%8)*scale, oy + Math.floor(i/8)*scale, scale, scale);
            }
        }
    },

    update() {
        this.timer++;
        let kD = typeof keysDown !== 'undefined' ? keysDown : {};
        let k = typeof keys !== 'undefined' ? keys : {};

        if (this.st === 'menu') {
            if (kD.a) { this.st = 'play'; playSnd('jmp'); this.setMsg('FIND 3 KEYS AND ESCAPE...'); }
        }
        else if (this.st === 'play') {
            // --- プレイヤー移動とスタミナ ---
            if (!this.p.isHide) {
                let dx = 0, dy = 0;
                if (k.left) dx = -1; if (k.right) dx = 1;
                if (k.up) dy = -1; if (k.down) dy = 1;

                let isRunning = k.b && (dx !== 0 || dy !== 0) && !this.p.isExh;
                let curSpd = this.p.spd;

                if (this.p.isExh) {
                    curSpd = 0.5; 
                    this.p.st += 0.8; // ★ 息切れ中の回復速度UP
                    if (this.p.st >= 50) this.p.isExh = false; 
                } else if (isRunning) {
                    curSpd = 2.2; 
                    this.p.st -= 1.5;
                    if (this.p.st <= 0) { this.p.st = 0; this.p.isExh = true; } 
                } else {
                    this.p.st += 1.2; // ★ 通常時の回復速度UPでストレス減
                    if (this.p.st > this.p.maxSt) this.p.st = this.p.maxSt;
                }

                if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } 
                let nx = this.p.x + dx * curSpd;
                let ny = this.p.y + dy * curSpd;
                
                if (!this.colSq(nx, this.p.y, this.p.r)) this.p.x = nx;
                if (!this.colSq(this.p.x, ny, this.p.r)) this.p.y = ny;

                if (isRunning && this.timer % 10 === 0) this.e.alert += 5;
            }

            // --- アクション ---
            if (kD.a) {
                let tx = Math.floor(this.p.x / this.ts), ty = Math.floor(this.p.y / this.ts);
                let tile = this.map[ty * this.mapW + tx];

                if (this.p.isHide) {
                    this.p.isHide = false; 
                    this.setMsg('LEFT THE LOCKER.');
                } else if (tile === 3) {
                    this.p.isHide = true; 
                    this.setMsg('HIDDEN IN LOCKER...');
                } else if (tile === 4) {
                    this.keys++;
                    this.map[ty * this.mapW + tx] = 0; 
                    playSnd('coin');
                    this.setMsg(`KEY FOUND! (${this.keys}/${this.maxKeys})`);
                } else if (ty <= 1 && tile === 0 && this.p.y < 30) {
                    if (this.keys >= this.maxKeys) {
                        this.st = 'clear'; playSnd('powerup');
                    } else {
                        this.setMsg('LOCKED... NEED MORE KEYS.');
                    }
                }
            }

            // --- 敵のAI ---
            let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
            
            if (dist < 80 && !this.p.isHide) this.e.alert += 10;
            if (this.p.isHide && this.e.alert > 0) this.e.alert -= 1; 
            
            if (this.e.alert > 100) this.e.alert = 100;
            if (this.e.alert < 0) this.e.alert = 0;

            if (this.e.alert > 50 && !this.p.isHide) {
                this.e.state = 'chase';
                this.e.spd = 1.6; 
                this.e.tgtX = this.p.x; this.e.tgtY = this.p.y;
            } else {
                this.e.state = 'patrol';
                this.e.spd = 0.6;
                if (Math.hypot(this.e.tgtX - this.e.x, this.e.tgtY - this.e.y) < 5 || this.timer % 120 === 0) {
                    this.e.tgtX = this.e.x + (Math.random()-0.5)*100;
                    this.e.tgtY = this.e.y + (Math.random()-0.5)*100;
                }
            }

            // 敵の移動とスタック（壁めり込み）回避
            let edx = this.e.tgtX - this.e.x, edy = this.e.tgtY - this.e.y;
            let elen = Math.hypot(edx, edy);
            if (elen > 0) {
                edx /= elen; edy /= elen;
                let enx = this.e.x + edx * this.e.spd;
                let eny = this.e.y + edy * this.e.spd;
                
                // ★ 壁にぶつかったら目標をずらしてスタックを回避
                if (!this.colSq(enx, this.e.y, this.e.r)) { this.e.x = enx; } 
                else { this.e.tgtX = this.e.x + (Math.random()-0.5)*50; }
                
                if (!this.colSq(this.e.x, eny, this.e.r)) { this.e.y = eny; } 
                else { this.e.tgtY = this.e.y + (Math.random()-0.5)*50; }
            }

            // 捕まる
            if (dist < this.p.r + this.e.r - 2 && !this.p.isHide) {
                this.st = 'jumpscare'; this.timer = 0; 
                screenShake(20); playSnd('hit');
            }

            if (this.msgTimer > 0) this.msgTimer--;

            // カメラ
            this.camX = this.p.x - 100; this.camY = this.p.y - 150;
            if(this.camX < 0) this.camX = 0; if(this.camY < 0) this.camY = 0;
            if(this.camX > this.mapW*this.ts - 200) this.camX = this.mapW*this.ts - 200;
            if(this.camY > this.mapH*this.ts - 300) this.camY = this.mapH*this.ts - 300;
        }
        else if (this.st === 'jumpscare') {
            if (this.timer > 60) { this.init(); } 
        }
        else if (this.st === 'clear') {
            if (kD.a || kD.start) this.init();
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            ctx.fillStyle = '#800'; ctx.font = 'bold 20px monospace'; ctx.fillText('CURSED MANOR', 30, 100);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('SURVIVAL HORROR V2', 50, 120);
            ctx.fillStyle = (this.timer % 60 < 30) ? '#f00' : '#fff';
            ctx.fillText('PRESS A TO ENTER...', 45, 200);
            return;
        }

        if (this.st === 'jumpscare') {
            ctx.fillStyle = (this.timer % 4 < 2) ? '#f00' : '#000'; ctx.fillRect(0, 0, 200, 300);
            this.drawSprite(100, 150, 'e'); // 敵の顔をアップで表示（巨大化させたいが今回はシンプルに）
            ctx.save(); ctx.translate(100,160); ctx.scale(10,10); this.drawSprite(0,0,'e'); ctx.restore(); // 超巨大バケモノ
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.fillText('YOU ARE DEAD', 30, 220);
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

        // --- マップのテクスチャ描画 ---
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                let px = x * this.ts, py = y * this.ts;
                if (px < this.camX - this.ts || px > this.camX + 200 || py < this.camY - this.ts || py > this.camY + 300) continue;

                let t = this.map[y * this.mapW + x];
                
                // 床 (木目調)
                ctx.fillStyle = '#1a1010'; ctx.fillRect(px, py, this.ts, this.ts);
                ctx.strokeStyle = '#2a1a1a'; ctx.beginPath(); ctx.moveTo(px+5, py); ctx.lineTo(px+5, py+this.ts); ctx.moveTo(px+15, py); ctx.lineTo(px+15, py+this.ts); ctx.stroke();

                // 壁 (レンガ調)
                if (t === 1) { 
                    ctx.fillStyle = '#322'; ctx.fillRect(px, py, this.ts, this.ts); 
                    ctx.fillStyle = '#211'; ctx.fillRect(px, py+this.ts/2, this.ts, this.ts/2);
                    ctx.strokeStyle = '#100'; ctx.strokeRect(px, py, this.ts, this.ts); 
                } 
                // 出口
                else if (t === 2) { 
                    ctx.fillStyle = '#522'; ctx.fillRect(px, py, this.ts, this.ts); 
                    ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('EXIT', px+2, py+12); 
                } 
                // ロッカー
                else if (t === 3) { 
                    ctx.fillStyle = '#245'; ctx.fillRect(px+2, py+2, this.ts-4, this.ts-4); 
                    ctx.fillStyle = '#123'; ctx.fillRect(px+4, py+4, 4, 12); ctx.fillRect(px+12, py+4, 4, 12); // スリット
                } 
                // 鍵
                else if (t === 4) { 
                    ctx.fillStyle = '#da0'; ctx.fillRect(px+6, py+8, 8, 4); ctx.fillRect(px+12, py+10, 2, 4); // 金の鍵
                }
            }
        }

        // 敵のドット絵描画
        this.drawSprite(this.e.x, this.e.y, 'e');
        if (this.e.state === 'chase') { ctx.fillStyle = '#f00'; ctx.font = 'bold 12px monospace'; ctx.fillText('!', this.e.x-3, this.e.y-12); }

        // プレイヤーのドット絵描画 (隠れていない時だけ)
        if (!this.p.isHide) {
            ctx.globalAlpha = this.p.isExh ? 0.5 : 1.0; // 息切れ時は半透明で表現
            this.drawSprite(this.p.x, this.p.y, 'p');
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();

        // --- 暗闇演出 ---
        let sightRadius = this.p.isHide ? 30 : 80;
        let gradX = this.p.x - this.camX;
        let gradY = this.p.y - this.camY;
        
        ctx.globalCompositeOperation = 'source-over';
        let darkGrad = ctx.createRadialGradient(gradX, gradY, 10, gradX, gradY, sightRadius);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
        darkGrad.addColorStop(1, 'rgba(0,0,0,0.98)');
        
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, 200, 300);

        // --- 心音演出 ---
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        if (dist < 120 && !this.p.isHide) {
            let intensity = 1 - (dist / 120);
            let pulse = (Math.sin(Date.now() / (150 - intensity*100)) + 1) / 2;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * intensity * 0.4})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        // --- UI ---
        ctx.fillStyle = '#000'; ctx.fillRect(10, 10, 50, 5);
        ctx.fillStyle = this.p.isExh ? '#f00' : '#0f0'; 
        ctx.fillRect(10, 10, 50 * (this.p.st / this.p.maxSt), 5);
        ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 50, 5);

        ctx.fillStyle = '#ff0'; ctx.font = '10px monospace';
        ctx.fillText(`KEYS: ${this.keys}/${this.maxKeys}`, 130, 15);

        if (this.msgTimer > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 260, 200, 30);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            let tw = ctx.measureText(this.msg).width;
            ctx.fillText(this.msg, 100 - tw/2, 280);
        }
    }
};
