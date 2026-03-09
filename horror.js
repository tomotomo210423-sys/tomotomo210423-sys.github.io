// === CURSED MANOR V3 (Ultimate Story & Puzzle Edition) ===
// 視線判定AI、3つの謎解き、ストーリー(日記)、演出強化をすべて実装した完全版！

const Horror = {
    st: 'menu', timer: 0,
    camX: 0, camY: 0,
    p: { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false },
    e: { x: 350, y: 350, r: 8, spd: 0.8, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0, col: false },
    keys: 0, maxKeys: 3, diaries: 0,
    msg: '', msgTimer: 0,
    
    // パズル用状態
    pzSafe: [0, 0, 0], pzSafeCur: 0,
    pzPiano: [], pzPianoAns: [0, 2, 3, 4], // ド(0), ミ(2), ファ(3), ソ(4)
    pzPanel: 0,

    // 0:床, 1:壁, 2:出口, 3:ロッカー, 4:鍵(直置き), 5:ピアノ, 6:金庫, 7:配電盤, 8:絵画, 9:日記
    mapW: 20, mapH: 20, ts: 20,
    map: [
        1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,1,6,0,0,0,0,0,0,0,1,0,0,0,4,1,
        1,0,3,0,0,1,0,1,1,1,1,1,1,0,1,0,3,0,0,1,
        1,0,0,0,0,0,0,1,0,0,0,9,1,0,1,1,1,0,0,1,
        1,1,1,0,1,1,0,1,0,3,0,0,1,0,0,0,0,0,8,1,
        1,0,0,0,1,4,0,1,1,1,0,1,1,1,1,1,1,1,0,1,
        1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,
        1,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1,
        1,1,1,0,1,0,1,9,0,0,0,0,0,0,0,1,0,1,0,1,
        1,8,1,0,1,0,1,0,3,0,0,0,3,0,0,1,0,1,0,1,
        1,0,1,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,
        1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,
        1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,1,0,1,5,0,0,0,0,0,0,0,1,
        1,0,3,0,0,0,3,0,1,0,1,0,0,3,0,0,3,0,0,1,
        1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,1,
        1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],

    sprs: {
        p: { d: "........01111000121121001111110004444000404404003003300300033000", pal: {'1':'#fcc', '2':'#000', '3':'#222', '4':'#08f'} },
        e: { d: "........05555000565565005555550055775500555555005500005500000000", pal: {'5':'#800', '6':'#ff0', '7':'#fff'} }
    },

    init() {
        this.st = 'menu'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false };
        this.e = { x: 350, y: 350, r: 8, spd: 0.8, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0, col: false };
        this.keys = 0; this.diaries = 0; this.msg = ''; this.msgTimer = 0;
        this.pzPiano = []; this.pzPanel = 0;
        
        let m = [...this.map];
        for(let i=0; i<m.length; i++) if(m[i]>=10) m[i] = m[i]-10; // リセット
        this.map = m;
        BGM.stop();
    },

    setMsg(text) { this.msg = text; this.msgTimer = 120; },

    getTile(x, y) {
        let tx = Math.floor(x / this.ts), ty = Math.floor(y / this.ts);
        if(tx < 0 || tx >= this.mapW || ty < 0 || ty >= this.mapH) return 1;
        return this.map[ty * this.mapW + tx];
    },

    // 壁との当たり判定
    colSq(nx, ny, r) {
        let pts = [ [nx-r+2,ny-r+2], [nx+r-2,ny-r+2], [nx-r+2,ny+r-2], [nx+r-2,ny+r-2] ];
        for(let pt of pts) {
            let t = this.getTile(pt[0], pt[1]);
            // 壁(1)、出口(2)、調べられる家具類(5,6,7)は通れない
            if(t === 1 || t === 2 || t === 5 || t === 6 || t === 7) return true;
        }
        return false;
    },

    // ★ 視線判定（レイキャスト）：壁越し認識を防ぐ
    canSee(px, py, ex, ey) {
        let dist = Math.hypot(px-ex, py-ey);
        if (dist > 120) return false; // 視界の限界距離
        let steps = dist / 4;
        for(let i=0; i<=steps; i++) {
            let cx = ex + (px-ex)*(i/steps);
            let cy = ey + (py-ey)*(i/steps);
            let t = this.getTile(cx, cy);
            if (t === 1 || t === 2) return false; // 壁があれば見えない
        }
        return true;
    },

    drawSprite(x, y, sName) {
        let s = this.sprs[sName];
        let scale = 1.5; 
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
        // --- 各種パズル画面の処理 ---
        else if (this.st === 'safe_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.left) { this.pzSafeCur = (this.pzSafeCur + 2) % 3; playSnd('sel'); }
            if (kD.right) { this.pzSafeCur = (this.pzSafeCur + 1) % 3; playSnd('sel'); }
            if (kD.up) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 1) % 10; playSnd('sel'); }
            if (kD.down) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 9) % 10; playSnd('sel'); }
            if (kD.a) {
                // 正解は「3・4・2」(絵画のヒント)
                if(this.pzSafe[0]===3 && this.pzSafe[1]===4 && this.pzSafe[2]===2) {
                    playSnd('powerup'); this.keys++; this.setMsg(`SAFE OPENED! KEY FOUND! (${this.keys}/${this.maxKeys})`);
                    this.map[this.targetTy * this.mapW + this.targetTx] = 0; // 金庫を消す
                    this.st = 'play';
                } else {
                    playSnd('hit'); screenShake(3); this.setMsg('WRONG PASSWORD.');
                }
            }
            this.updateEnemyInPuzzle(); // パズル中も敵は動く！
        }
        else if (this.st === 'piano_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.left) { this.pzPianoCur = (this.pzPianoCur + 6) % 7; playSnd('sel'); }
            if (kD.right) { this.pzPianoCur = (this.pzPianoCur + 1) % 7; playSnd('sel'); }
            if (kD.a) {
                this.pzPiano.push(this.pzPianoCur);
                playSnd('sel'); // 音階を鳴らしたいが簡易的にsel音
                if (this.pzPiano.length >= 4) {
                    let isCorrect = true;
                    for(let i=0; i<4; i++) if(this.pzPiano[i] !== this.pzPianoAns[i]) isCorrect = false;
                    
                    if (isCorrect) {
                        playSnd('powerup'); this.keys++; this.setMsg(`PIANO PLAYED... KEY FOUND! (${this.keys}/${this.maxKeys})`);
                        this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                        this.st = 'play';
                    } else {
                        playSnd('hit'); screenShake(10); this.setMsg('DISSONANCE RINGS OUT!');
                        this.e.alert = 100; this.e.tgtX = this.p.x; this.e.tgtY = this.p.y; // 敵がすっ飛んでくる罠
                        this.pzPiano = []; this.st = 'play';
                    }
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'panel_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.a) { this.pzPanel += 4; playSnd('sel'); } // 連打でゲージを溜める
            this.pzPanel -= 0.5; if(this.pzPanel < 0) this.pzPanel = 0;
            
            if (this.pzPanel >= 100) {
                playSnd('powerup'); this.keys++; this.setMsg(`POWER RESTORED! KEY FOUND! (${this.keys}/${this.maxKeys})`);
                this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                this.st = 'play';
            }
            this.updateEnemyInPuzzle(); // 連打中も背後に敵が迫る恐怖！
        }
        else if (this.st === 'read_diary') {
            if (kD.a || kD.b) { this.st = 'play'; }
            this.updateEnemyInPuzzle();
        }
        // --- メインプレイ画面 ---
        else if (this.st === 'play') {
            if (!this.p.isHide) {
                let dx = 0, dy = 0;
                if (k.left) dx = -1; if (k.right) dx = 1;
                if (k.up) dy = -1; if (k.down) dy = 1;

                let isRunning = k.b && (dx !== 0 || dy !== 0) && !this.p.isExh;
                let curSpd = this.p.spd;

                if (this.p.isExh) {
                    curSpd = 0.5; this.p.st += 0.8; if (this.p.st >= 50) this.p.isExh = false; 
                } else if (isRunning) {
                    curSpd = 2.2; this.p.st -= 1.5; if (this.p.st <= 0) { this.p.st = 0; this.p.isExh = true; } 
                } else {
                    this.p.st += 1.2; if (this.p.st > this.p.maxSt) this.p.st = this.p.maxSt;
                }

                if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } 
                let nx = this.p.x + dx * curSpd; let ny = this.p.y + dy * curSpd;
                if (!this.colSq(nx, this.p.y, this.p.r)) this.p.x = nx;
                if (!this.colSq(this.p.x, ny, this.p.r)) this.p.y = ny;

                // 足音（聴覚）は壁越しでも敵に気づかれる！
                if (isRunning && this.timer % 10 === 0) {
                    let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
                    if (dist < 150) this.e.alert += 8; 
                }
            }

            // --- Aボタンで調べる・隠れる ---
            if (kD.a) {
                // 目の前のタイルを調べるために、向いている方向を少し考慮
                let tx = Math.floor(this.p.x / this.ts), ty = Math.floor(this.p.y / this.ts);
                let tile = this.map[ty * this.mapW + tx];
                
                // 隣接タイルも調べる
                let adjs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
                for(let [ax, ay] of adjs) {
                    let cTx = tx+ax, cTy = ty+ay;
                    let cTile = this.map[cTy * this.mapW + cTx];
                    if (cTile >= 3 && cTile <= 9) { tile = cTile; tx = cTx; ty = cTy; break; }
                }

                if (this.p.isHide) {
                    this.p.isHide = false; this.setMsg('LEFT THE LOCKER.');
                } else if (tile === 3) {
                    this.p.isHide = true; this.setMsg('HIDDEN IN LOCKER...');
                } else if (tile === 4) {
                    this.keys++; this.map[ty * this.mapW + tx] = 0; 
                    playSnd('coin'); this.setMsg(`KEY FOUND! (${this.keys}/${this.maxKeys})`);
                } else if (tile === 5) {
                    this.st = 'piano_puzzle'; this.pzPiano = []; this.pzPianoCur = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 6) {
                    this.st = 'safe_puzzle'; this.pzSafe = [0,0,0]; this.pzSafeCur = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 7) {
                    this.st = 'panel_puzzle'; this.pzPanel = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 8) {
                    let hints = ["PORTRAIT: 3 EYES.", "PAINTING: 4 FINGERS.", "PICTURE: 2 HEADS."];
                    this.setMsg(hints[Math.floor(Math.random()*hints.length)]); playSnd('sel');
                } else if (tile === 9) {
                    this.st = 'read_diary'; this.diaries++; this.map[ty * this.mapW + tx] = 0; playSnd('sel');
                } else if (ty <= 1 && tile === 0 && this.p.y < 30) {
                    if (this.keys >= this.maxKeys) {
                        this.st = 'clear'; playSnd('powerup');
                    } else {
                        this.setMsg('LOCKED... NEED 3 KEYS.');
                    }
                }
            }

            this.updateEnemyAI();

            if (this.msgTimer > 0) this.msgTimer--;

            // カメラ追従
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

    // ★ パズル中も敵が迫ってくる恐怖の非同期処理
    updateEnemyInPuzzle() {
        this.updateEnemyAI();
        if (Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y) < this.p.r + this.e.r + 5) {
            this.st = 'jumpscare'; this.timer = 0; screenShake(20); playSnd('hit');
        }
    },

    // ★ 敵のAI（視線判定とスタック回避の完全版）
    updateEnemyAI() {
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        
        // 視線が通っていれば発見！
        let isVisible = this.canSee(this.p.x, this.p.y, this.e.x, this.e.y);
        if (isVisible && !this.p.isHide) this.e.alert += 15;
        if (this.p.isHide && this.e.alert > 0) this.e.alert -= 1; 
        
        if (this.e.alert > 100) this.e.alert = 100;
        if (this.e.alert < 0) this.e.alert = 0;

        if (this.e.alert > 50 && !this.p.isHide) {
            this.e.state = 'chase'; this.e.spd = 1.7; 
            this.e.tgtX = this.p.x; this.e.tgtY = this.p.y;
        } else {
            this.e.state = 'patrol'; this.e.spd = 0.6;
            // 目的地に着いたか、壁にぶつかったら新しい目的地を設定
            if (Math.hypot(this.e.tgtX - this.e.x, this.e.tgtY - this.e.y) < 5 || this.e.col || this.timer % 150 === 0) {
                let ang = Math.random() * Math.PI * 2;
                let rDist = 40 + Math.random() * 60;
                this.e.tgtX = this.e.x + Math.cos(ang) * rDist;
                this.e.tgtY = this.e.y + Math.sin(ang) * rDist;
                this.e.col = false;
            }
        }

        let edx = this.e.tgtX - this.e.x, edy = this.e.tgtY - this.e.y;
        let elen = Math.hypot(edx, edy);
        if (elen > 0) {
            edx /= elen; edy /= elen;
            let enx = this.e.x + edx * this.e.spd; let eny = this.e.y + edy * this.e.spd;
            this.e.col = false;
            
            if (!this.colSq(enx, this.e.y, this.e.r)) { this.e.x = enx; } else { this.e.col = true; }
            if (!this.colSq(this.e.x, eny, this.e.r)) { this.e.y = eny; } else { this.e.col = true; }
        }

        if (dist < this.p.r + this.e.r - 2 && !this.p.isHide && this.st === 'play') {
            this.st = 'jumpscare'; this.timer = 0; screenShake(20); playSnd('hit');
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            // タイトル演出強化（稲妻とグリッチ）
            if (Math.random() < 0.05) { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); }
            ctx.fillStyle = '#800'; ctx.font = 'bold 22px monospace'; ctx.fillText('CURSED MANOR', 25 + (Math.random()-0.5)*2, 100);
            ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('TRUE SURVIVAL HORROR', 45, 120);
            ctx.fillStyle = (this.timer % 60 < 30) ? '#fff' : '#888'; ctx.fillText('PRESS A TO ENTER...', 45, 200);
            return;
        }

        if (this.st === 'jumpscare') {
            ctx.fillStyle = (this.timer % 4 < 2) ? '#f00' : '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.save(); ctx.translate(100,160); ctx.scale(10,10); this.drawSprite(0,0,'e'); ctx.restore(); 
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.fillText('YOU ARE DEAD', 30, 220);
            return;
        }

        if (this.st === 'clear') {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('ESCAPED!', 55, 100);
            
            // 日記をすべて集めたかでのエンディング分岐！
            if (this.diaries >= 3) {
                ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('TRUE ENDING', 60, 130);
                ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('You revealed the dark truth...', 15, 160);
            } else {
                ctx.fillStyle = '#888'; ctx.font = '12px monospace'; ctx.fillText('NORMAL ENDING', 55, 130);
                ctx.fillStyle = '#aaa'; ctx.font = '9px monospace'; ctx.fillText('You survived, but the mystery remains.', 5, 160);
            }
            return;
        }

        ctx.save();
        ctx.translate(-this.camX, -this.camY);

        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                let px = x * this.ts, py = y * this.ts;
                if (px < this.camX - this.ts || px > this.camX + 200 || py < this.camY - this.ts || py > this.camY + 300) continue;

                let t = this.map[y * this.mapW + x];
                
                ctx.fillStyle = '#1a1010'; ctx.fillRect(px, py, this.ts, this.ts);
                ctx.strokeStyle = '#2a1a1a'; ctx.beginPath(); ctx.moveTo(px+5, py); ctx.lineTo(px+5, py+this.ts); ctx.moveTo(px+15, py); ctx.lineTo(px+15, py+this.ts); ctx.stroke();

                if (t === 1) { ctx.fillStyle = '#322'; ctx.fillRect(px, py, this.ts, this.ts); ctx.fillStyle = '#211'; ctx.fillRect(px, py+this.ts/2, this.ts, this.ts/2); ctx.strokeStyle = '#100'; ctx.strokeRect(px, py, this.ts, this.ts); } 
                else if (t === 2) { ctx.fillStyle = '#522'; ctx.fillRect(px, py, this.ts, this.ts); ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('EXIT', px+2, py+12); } 
                else if (t === 3) { ctx.fillStyle = '#245'; ctx.fillRect(px+2, py+2, this.ts-4, this.ts-4); ctx.fillStyle = '#123'; ctx.fillRect(px+4, py+4, 4, 12); ctx.fillRect(px+12, py+4, 4, 12); } 
                else if (t === 4) { ctx.fillStyle = '#da0'; ctx.fillRect(px+6, py+8, 8, 4); ctx.fillRect(px+12, py+10, 2, 4); }
                else if (t === 5) { ctx.fillStyle = '#111'; ctx.fillRect(px, py+5, 20, 15); ctx.fillStyle = '#fff'; ctx.fillRect(px+2, py+10, 16, 5); } // ピアノ
                else if (t === 6) { ctx.fillStyle = '#666'; ctx.fillRect(px+2, py+2, 16, 16); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px+10, py+10, 4, 0, Math.PI*2); ctx.fill(); } // 金庫
                else if (t === 7) { ctx.fillStyle = '#800'; ctx.fillRect(px+4, py, 12, 20); ctx.fillStyle = '#ff0'; ctx.fillRect(px+8, py+8, 4, 4); } // 配電盤
                else if (t === 8) { ctx.fillStyle = '#531'; ctx.fillRect(px+2, py, 16, 4); ctx.fillStyle = '#800'; ctx.fillRect(px+4, py+1, 12, 2); } // 絵画(壁掛け)
                else if (t === 9) { ctx.fillStyle = '#ddd'; ctx.fillRect(px+5, py+5, 10, 10); ctx.fillStyle = '#f00'; ctx.fillRect(px+7, py+7, 6, 2); } // 日記
            }
        }

        this.drawSprite(this.e.x, this.e.y, 'e');
        if (this.e.state === 'chase') { ctx.fillStyle = '#f00'; ctx.font = 'bold 12px monospace'; ctx.fillText('!', this.e.x-3, this.e.y-12); }

        if (!this.p.isHide) {
            ctx.globalAlpha = this.p.isExh ? 0.5 : 1.0; 
            this.drawSprite(this.p.x, this.p.y, 'p');
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();

        // --- 暗闇演出 ---
        let sightRadius = this.p.isHide ? 30 : 90;
        let gradX = this.p.x - this.camX; let gradY = this.p.y - this.camY;
        ctx.globalCompositeOperation = 'source-over';
        let darkGrad = ctx.createRadialGradient(gradX, gradY, 10, gradX, gradY, sightRadius);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)'); darkGrad.addColorStop(1, 'rgba(0,0,0,0.98)');
        ctx.fillStyle = darkGrad; ctx.fillRect(0, 0, 200, 300);

        // --- 心音演出（画面の揺れ追加！） ---
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        if (dist < 120 && !this.p.isHide) {
            let intensity = 1 - (dist / 120);
            let pulse = (Math.sin(Date.now() / (150 - intensity*100)) + 1) / 2;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * intensity * 0.4})`;
            ctx.fillRect(0, 0, 200, 300);
            if(pulse > 0.9 && intensity > 0.5) { ctx.translate((Math.random()-0.5)*2, (Math.random()-0.5)*2); } // 鼓動で揺れる
        }

        // --- 謎解きUI描画 ---
        if (this.st === 'safe_puzzle') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(20, 100, 160, 100);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 100, 160, 100);
            ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('LOCKED SAFE', 60, 120);
            ctx.font = '24px monospace';
            for(let i=0; i<3; i++) {
                ctx.fillStyle = (i === this.pzSafeCur) ? '#0f0' : '#fff';
                ctx.fillText(this.pzSafe[i], 60 + i*30, 160);
                if(i === this.pzSafeCur) { ctx.font = '10px monospace'; ctx.fillText('▲', 62 + i*30, 180); ctx.fillText('▼', 62 + i*30, 140); ctx.font = '24px monospace'; }
            }
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('A: ENTER   B: LEAVE', 45, 190);
        }
        else if (this.st === 'piano_puzzle') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 100, 180, 100);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 100, 180, 100);
            ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('CURSED PIANO', 60, 120);
            
            for(let i=0; i<7; i++) { // 白鍵
                ctx.fillStyle = (i === this.pzPianoCur) ? '#888' : '#fff';
                ctx.fillRect(25 + i*22, 130, 20, 40);
                ctx.strokeStyle = '#000'; ctx.strokeRect(25 + i*22, 130, 20, 40);
            }
            ctx.fillStyle = '#0f0'; ctx.beginPath(); ctx.arc(35 + this.pzPianoCur*22, 180, 4, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
            ctx.fillText('NOTES: ' + this.pzPiano.join(' '), 25, 190);
        }
        else if (this.st === 'panel_puzzle') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(20, 100, 160, 100);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 100, 160, 100);
            ctx.fillStyle = '#f00'; ctx.font = '12px monospace'; ctx.fillText('FIX THE WIRING!', 45, 120);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('SMASH [A] BUTTON!', 50, 140);
            
            ctx.fillStyle = '#333'; ctx.fillRect(30, 160, 140, 15);
            ctx.fillStyle = '#0f0'; ctx.fillRect(30, 160, 140 * (this.pzPanel/100), 15);
        }
        else if (this.st === 'read_diary') {
            ctx.fillStyle = 'rgba(50,0,0,0.9)'; ctx.fillRect(10, 50, 180, 200);
            ctx.strokeStyle = '#f00'; ctx.strokeRect(10, 50, 180, 200);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            
            let texts = [
                "\"They took my eyes...\"",
                "\"The doctor is a monster...\"",
                "\"DO, MI, FA, SO... the code.\"",
                "\"I hid the key in the safe.\""
            ];
            ctx.fillText("--- TORN DIARY ---", 20, 70);
            ctx.fillStyle = '#faa'; ctx.fillText(texts[this.diaries % texts.length], 20, 100);
            ctx.fillStyle = '#fff'; ctx.fillText(`FOUND: ${this.diaries}/3`, 20, 150);
            ctx.fillText('PRESS A/B TO CLOSE', 45, 230);
        }

        // --- UI ---
        if (this.st === 'play' || this.st.includes('puzzle')) {
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
    }
};
