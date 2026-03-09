// === CURSED MANOR V4 (Same Speed & Smart AI & Rich Textures) ===
// ダッシュ廃止、等速チェイス、賢い徘徊AI、専用サウンド、グラフィック超強化！

// ★ ホラー専用サウンドエンジン
function playHSnd(t, param) {
    if (!audioCtx || SaveSys.data.seVol <= 0) return;
    let n = audioCtx.currentTime;
    let o = audioCtx.createOscillator(); let g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    let vol = SaveSys.data.seVol;

    if (t === 'heart') { // 鼓動
        o.type = 'sine'; o.frequency.setValueAtTime(40, n); o.frequency.exponentialRampToValueAtTime(10, n + 0.3);
        g.gain.setValueAtTime(0.6 * vol, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.3);
        o.start(n); o.stop(n + 0.3);
    } else if (t === 'roar') { // 発見された時の咆哮
        o.type = 'sawtooth'; o.frequency.setValueAtTime(120, n); o.frequency.exponentialRampToValueAtTime(30, n + 1.2);
        g.gain.setValueAtTime(0.4 * vol, n); g.gain.exponentialRampToValueAtTime(0.01, n + 1.2);
        o.start(n); o.stop(n + 1.2);
    } else if (t === 'note') { // ピアノの音階
        o.type = 'triangle'; let freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
        o.frequency.setValueAtTime(freqs[param] || 440, n);
        g.gain.setValueAtTime(0.3 * vol, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.5);
        o.start(n); o.stop(n + 0.5);
    } else if (t === 'error') { // パズル失敗
        o.type = 'square'; o.frequency.setValueAtTime(100, n); o.frequency.setValueAtTime(80, n+0.1);
        g.gain.setValueAtTime(0.3 * vol, n); g.gain.linearRampToValueAtTime(0.01, n + 0.3);
        o.start(n); o.stop(n + 0.3);
    } else if (t === 'open') { // 金庫・鍵
        o.type = 'square'; o.frequency.setValueAtTime(300, n); o.frequency.exponentialRampToValueAtTime(50, n + 0.2);
        g.gain.setValueAtTime(0.2 * vol, n); g.gain.linearRampToValueAtTime(0.01, n + 0.2);
        o.start(n); o.stop(n + 0.2);
    }
}

const Horror = {
    st: 'menu', timer: 0,
    camX: 0, camY: 0,
    // ★ 速度を 1.2 で統一！スタミナを完全廃止
    p: { x: 30, y: 30, r: 6, spd: 1.2, isHide: false },
    e: { x: 350, y: 350, r: 8, spd: 1.2, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0, lastDx: 0, lastDy: 0 },
    keys: 0, maxKeys: 3, diaries: 0,
    msg: '', msgTimer: 0,
    
    pzSafe: [0, 0, 0], pzSafeCur: 0,
    pzPiano: [], pzPianoAns: [0, 2, 3, 4],
    pzPanel: 0,

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
        p: { d: "........01111000121121001111110004444000404404003003300300033000", pal: {'1':'#fcc', '2':'#000', '3':'#222', '4':'#08f'} }
    },

    init() {
        this.st = 'menu'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.2, isHide: false };
        this.e = { x: 350, y: 350, r: 8, spd: 1.2, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0, lastDx: 0, lastDy: 0 };
        this.keys = 0; this.diaries = 0; this.msg = ''; this.msgTimer = 0;
        this.pzPiano = []; this.pzPanel = 0;
        
        let m = [...this.map];
        for(let i=0; i<m.length; i++) if(m[i]>=10) m[i] = m[i]-10;
        this.map = m;
        BGM.stop();
    },

    setMsg(text) { this.msg = text; this.msgTimer = 120; },

    getTile(x, y) {
        let tx = Math.floor(x / this.ts), ty = Math.floor(y / this.ts);
        if(tx < 0 || tx >= this.mapW || ty < 0 || ty >= this.mapH) return 1;
        return this.map[ty * this.mapW + tx];
    },

    colSq(nx, ny, r) {
        let pts = [ [nx-r+2,ny-r+2], [nx+r-2,ny-r+2], [nx-r+2,ny+r-2], [nx+r-2,ny+r-2] ];
        for(let pt of pts) {
            let t = this.getTile(pt[0], pt[1]);
            if(t === 1 || t === 2 || t === 5 || t === 6 || t === 7) return true;
        }
        return false;
    },

    canSee(px, py, ex, ey) {
        let dist = Math.hypot(px-ex, py-ey);
        if (dist > 150) return false; 
        let steps = dist / 4;
        for(let i=0; i<=steps; i++) {
            let cx = ex + (px-ex)*(i/steps);
            let cy = ey + (py-ey)*(i/steps);
            let t = this.getTile(cx, cy);
            if (t === 1 || t === 2) return false;
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
        else if (this.st === 'safe_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.left) { this.pzSafeCur = (this.pzSafeCur + 2) % 3; playSnd('sel'); }
            if (kD.right) { this.pzSafeCur = (this.pzSafeCur + 1) % 3; playSnd('sel'); }
            if (kD.up) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 1) % 10; playSnd('sel'); }
            if (kD.down) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 9) % 10; playSnd('sel'); }
            if (kD.a) {
                if(this.pzSafe[0]===3 && this.pzSafe[1]===4 && this.pzSafe[2]===2) {
                    playHSnd('open'); this.keys++; this.setMsg(`SAFE OPENED! KEY FOUND! (${this.keys}/${this.maxKeys})`);
                    this.map[this.targetTy * this.mapW + this.targetTx] = 0; 
                    this.st = 'play';
                } else {
                    playHSnd('error'); screenShake(3); this.setMsg('WRONG PASSWORD.');
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'piano_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.left) { this.pzPianoCur = (this.pzPianoCur + 6) % 7; playSnd('sel'); }
            if (kD.right) { this.pzPianoCur = (this.pzPianoCur + 1) % 7; playSnd('sel'); }
            if (kD.a) {
                this.pzPiano.push(this.pzPianoCur);
                playHSnd('note', this.pzPianoCur); 
                if (this.pzPiano.length >= 4) {
                    let isCorrect = true;
                    for(let i=0; i<4; i++) if(this.pzPiano[i] !== this.pzPianoAns[i]) isCorrect = false;
                    
                    if (isCorrect) {
                        setTimeout(()=>playHSnd('open'), 500);
                        this.keys++; this.setMsg(`PIANO PLAYED... KEY FOUND! (${this.keys}/${this.maxKeys})`);
                        this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                        this.st = 'play';
                    } else {
                        playHSnd('error'); screenShake(10); this.setMsg('DISSONANCE RINGS OUT!');
                        this.e.alert = 100; this.e.tgtX = this.p.x; this.e.tgtY = this.p.y; playHSnd('roar');
                        this.pzPiano = []; this.st = 'play';
                    }
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'panel_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.a) { this.pzPanel += 5; playHSnd('open'); } 
            this.pzPanel -= 0.5; if(this.pzPanel < 0) this.pzPanel = 0;
            
            if (this.pzPanel >= 100) {
                playHSnd('open'); this.keys++; this.setMsg(`POWER RESTORED! KEY FOUND! (${this.keys}/${this.maxKeys})`);
                this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                this.st = 'play';
            }
            this.updateEnemyInPuzzle(); 
        }
        else if (this.st === 'read_diary') {
            if (kD.a || kD.b) { this.st = 'play'; }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'play') {
            if (!this.p.isHide) {
                let dx = 0, dy = 0;
                if (k.left) dx = -1; if (k.right) dx = 1;
                if (k.up) dy = -1; if (k.down) dy = 1;

                if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; } 
                let nx = this.p.x + dx * this.p.spd; let ny = this.p.y + dy * this.p.spd;
                if (!this.colSq(nx, this.p.y, this.p.r)) this.p.x = nx;
                if (!this.colSq(this.p.x, ny, this.p.r)) this.p.y = ny;
            }

            if (kD.a) {
                let tx = Math.floor(this.p.x / this.ts), ty = Math.floor(this.p.y / this.ts);
                let tile = this.map[ty * this.mapW + tx];
                
                let adjs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]];
                for(let [ax, ay] of adjs) {
                    let cTx = tx+ax, cTy = ty+ay;
                    let cTile = this.map[cTy * this.mapW + cTx];
                    if (cTile >= 3 && cTile <= 9) { tile = cTile; tx = cTx; ty = cTy; break; }
                }

                if (this.p.isHide) {
                    this.p.isHide = false; this.setMsg('LEFT THE LOCKER.'); playHSnd('open');
                } else if (tile === 3) {
                    this.p.isHide = true; this.setMsg('HIDDEN IN LOCKER...'); playHSnd('open');
                } else if (tile === 4) {
                    this.keys++; this.map[ty * this.mapW + tx] = 0; 
                    playHSnd('open'); this.setMsg(`KEY FOUND! (${this.keys}/${this.maxKeys})`);
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
                        this.st = 'clear'; playHSnd('open');
                    } else {
                        this.setMsg('LOCKED... NEED 3 KEYS.'); playHSnd('error');
                    }
                }
            }

            this.updateEnemyAI();

            if (this.msgTimer > 0) this.msgTimer--;

            this.camX = this.p.x - 100; this.camY = this.p.y - 150;
            if(this.camX < 0) this.camX = 0; if(this.camY < 0) this.camY = 0;
            if(this.camX > this.mapW*this.ts - 200) this.camX = this.mapW*this.ts - 200;
            if(this.camY > this.mapH*this.ts - 300) this.camY = this.mapH*this.ts - 300;
        }
        else if (this.st === 'jumpscare') {
            if (this.timer > 80) { this.init(); } 
        }
        else if (this.st === 'clear') {
            if (kD.a || kD.start) this.init();
        }
    },

    updateEnemyInPuzzle() {
        this.updateEnemyAI();
        if (Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y) < this.p.r + this.e.r + 5) {
            this.st = 'jumpscare'; this.timer = 0; screenShake(20); playHSnd('roar');
        }
    },

    // ★ 徘徊AIの劇的進化！通路を滑らかに歩く
    updateEnemyAI() {
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        
        let isVisible = this.canSee(this.p.x, this.p.y, this.e.x, this.e.y);
        if (isVisible && !this.p.isHide) {
            if (this.e.state !== 'chase') playHSnd('roar'); // 発見時に咆哮！
            this.e.alert = 100;
        }
        if (this.p.isHide && this.e.alert > 0) this.e.alert -= 0.5; 

        if (this.e.alert > 50 && !this.p.isHide) {
            this.e.state = 'chase'; 
            this.e.tgtX = this.p.x; this.e.tgtY = this.p.y;
        } else {
            this.e.state = 'patrol';
            // ターゲット（次のタイル）に到達したら、隣接する通路をランダムに選ぶ
            if (Math.hypot(this.e.tgtX - this.e.x, this.e.tgtY - this.e.y) < 2) {
                let curTx = Math.floor(this.e.x / this.ts); let curTy = Math.floor(this.e.y / this.ts);
                let adjs = [[1,0], [-1,0], [0,1], [0,-1]];
                let valid = [];
                for (let [dx, dy] of adjs) {
                    let t = this.getTile((curTx+dx)*this.ts, (curTy+dy)*this.ts);
                    if (t !== 1 && t !== 2 && t !== 5 && t !== 6 && t !== 7) {
                        // 来た道をすぐ戻らないようにする
                        if (!(dx === -this.e.lastDx && dy === -this.e.lastDy) || valid.length === 0) valid.push([dx, dy]);
                    }
                }
                if (valid.length > 0) {
                    let dir = valid[Math.floor(Math.random() * valid.length)];
                    this.e.tgtX = (curTx + dir[0]) * this.ts + this.ts/2;
                    this.e.tgtY = (curTy + dir[1]) * this.ts + this.ts/2;
                    this.e.lastDx = dir[0]; this.e.lastDy = dir[1];
                }
            }
        }

        let edx = this.e.tgtX - this.e.x, edy = this.e.tgtY - this.e.y;
        let elen = Math.hypot(edx, edy);
        if (elen > 0) {
            edx /= elen; edy /= elen;
            // 壁を滑る処理を削除し、正確にターゲットへ進む
            this.e.x += edx * this.e.spd;
            this.e.y += edy * this.e.spd;
        }

        // 恐怖の心音（距離に応じて鳴る間隔が早くなる）
        if (dist < 150 && !this.p.isHide && this.timer % Math.max(15, Math.floor(dist/3)) === 0) {
            playHSnd('heart');
        }

        if (dist < this.p.r + this.e.r - 2 && !this.p.isHide && this.st === 'play') {
            this.st = 'jumpscare'; this.timer = 0; screenShake(20); playHSnd('roar');
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            if (Math.random() < 0.05) { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); }
            ctx.fillStyle = '#800'; ctx.font = 'bold 22px monospace'; ctx.fillText('CURSED MANOR', 25 + (Math.random()-0.5)*2, 100);
            ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('TRUE SURVIVAL HORROR', 45, 120);
            ctx.fillStyle = (this.timer % 60 < 30) ? '#fff' : '#888'; ctx.fillText('PRESS A TO ENTER...', 45, 200);
            return;
        }

        if (this.st === 'jumpscare') {
            // ★ ジャンプスケア強化！画面いっぱいの牙と触手
            ctx.fillStyle = (this.timer % 4 < 2) ? '#f00' : '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(100, 150, 80, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#f00'; for(let i=0; i<20; i++) { ctx.beginPath(); ctx.moveTo(100, 150); ctx.lineTo(100+(Math.random()-0.5)*200, 150+(Math.random()-0.5)*200); ctx.stroke(); }
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.fillText('YOU ARE DEAD', 30, 220);
            return;
        }

        if (this.st === 'clear') {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('ESCAPED!', 55, 100);
            
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

        // --- 最高級のテクスチャ描画 ---
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                let px = x * this.ts, py = y * this.ts;
                if (px < this.camX - this.ts || px > this.camX + 200 || py < this.camY - this.ts || py > this.camY + 300) continue;

                let t = this.map[y * this.mapW + x];
                
                // 床：暗い木目と血痕
                ctx.fillStyle = '#1c1111'; ctx.fillRect(px, py, this.ts, this.ts);
                ctx.strokeStyle = '#0a0505'; ctx.lineWidth = 1;
                for(let i=0; i<3; i++) { ctx.beginPath(); ctx.moveTo(px, py + i*6 + 2); ctx.lineTo(px+this.ts, py + i*6 + 4); ctx.stroke(); }
                if ((x*y)%7 === 0) { ctx.fillStyle = 'rgba(100,0,0,0.6)'; ctx.beginPath(); ctx.arc(px+5, py+10, 3, 0, Math.PI*2); ctx.fill(); }

                if (t === 1) { 
                    // 壁：立体感のあるレンガ
                    let g = ctx.createLinearGradient(px, py, px, py+this.ts);
                    g.addColorStop(0, '#433'); g.addColorStop(1, '#111');
                    ctx.fillStyle = g; ctx.fillRect(px, py, this.ts, this.ts);
                    ctx.strokeStyle = '#000'; ctx.strokeRect(px, py, this.ts, this.ts);
                    ctx.beginPath(); ctx.moveTo(px, py+this.ts/2); ctx.lineTo(px+this.ts, py+this.ts/2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(px+this.ts/2, py); ctx.lineTo(px+this.ts/2, py+this.ts/2); ctx.stroke();
                } 
                else if (t === 2) { ctx.fillStyle = '#522'; ctx.fillRect(px, py, this.ts, this.ts); ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('EXIT', px+2, py+12); } 
                else if (t === 3) { ctx.fillStyle = '#245'; ctx.fillRect(px+2, py+2, this.ts-4, this.ts-4); ctx.fillStyle = '#123'; ctx.fillRect(px+4, py+4, 4, 12); ctx.fillRect(px+12, py+4, 4, 12); } 
                else if (t === 4) { ctx.fillStyle = '#da0'; ctx.fillRect(px+6, py+8, 8, 4); ctx.fillRect(px+12, py+10, 2, 4); }
                else if (t === 5) { ctx.fillStyle = '#111'; ctx.fillRect(px, py+5, 20, 15); ctx.fillStyle = '#fff'; ctx.fillRect(px+2, py+10, 16, 5); } 
                else if (t === 6) { ctx.fillStyle = '#666'; ctx.fillRect(px+2, py+2, 16, 16); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px+10, py+10, 4, 0, Math.PI*2); ctx.fill(); } 
                else if (t === 7) { ctx.fillStyle = '#800'; ctx.fillRect(px+4, py, 12, 20); ctx.fillStyle = '#ff0'; ctx.fillRect(px+8, py+8, 4, 4); } 
                else if (t === 8) { ctx.fillStyle = '#531'; ctx.fillRect(px+2, py, 16, 4); ctx.fillStyle = '#800'; ctx.fillRect(px+4, py+1, 12, 2); } 
                else if (t === 9) { ctx.fillStyle = '#ddd'; ctx.fillRect(px+5, py+5, 10, 10); ctx.fillStyle = '#f00'; ctx.fillRect(px+7, py+7, 6, 2); } 
            }
        }

        // ★ 鬼のデザイン超強化！（蠢く肉塊と触手）
        let ex = this.e.x, ey = this.e.y;
        ctx.fillStyle = '#800'; 
        ctx.beginPath(); ctx.arc(ex, ey, this.e.r, 0, Math.PI*2);
        for(let i=0; i<6; i++) {
            let ang = i * (Math.PI*2/6) + this.timer*0.05;
            let len = this.e.r + Math.sin(this.timer*0.2 + i)*5;
            ctx.arc(ex + Math.cos(ang)*len, ey + Math.sin(ang)*len, 4, 0, Math.PI*2);
        }
        ctx.fill();
        if (this.e.state === 'chase') { 
            ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(ex, ey-2, 2, 0, Math.PI*2); ctx.fill(); 
        }

        if (!this.p.isHide) {
            this.drawSprite(this.p.x, this.p.y, 'p');
        }

        ctx.restore();

        // 視界制限は薄くして見やすくする！
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 15, 0.3)';
        ctx.fillRect(0, 0, 200, 300);

        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        if (dist < 120 && !this.p.isHide) {
            let intensity = 1 - (dist / 120);
            let pulse = (Math.sin(Date.now() / (150 - intensity*100)) + 1) / 2;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * intensity * 0.4})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        // --- パズルUI ---
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
            
            for(let i=0; i<7; i++) { 
                ctx.fillStyle = (i === this.pzPianoCur) ? '#888' : '#fff';
                ctx.fillRect(25 + i*22, 130, 20, 40);
                ctx.strokeStyle = '#000'; ctx.strokeRect(25 + i*22, 130, 20, 40);
            }
            ctx.fillStyle = '#0f0'; ctx.beginPath(); ctx.arc(35 + this.pzPianoCur*22, 180, 4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#0ff'; ctx.font = '10px monospace'; ctx.fillText('NOTES: ' + this.pzPiano.join(' '), 25, 190);
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
            let texts = ["\"They took my eyes...\"", "\"The doctor is a monster...\"", "\"DO, MI, FA, SO... the code.\"", "\"I hid the key in the safe.\""];
            ctx.fillText("--- TORN DIARY ---", 20, 70);
            ctx.fillStyle = '#faa'; ctx.fillText(texts[this.diaries % texts.length], 20, 100);
            ctx.fillStyle = '#fff'; ctx.fillText(`FOUND: ${this.diaries}/3`, 20, 150);
            ctx.fillText('PRESS A/B TO CLOSE', 45, 230);
        }

        if (this.st === 'play' || this.st.includes('puzzle')) {
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
