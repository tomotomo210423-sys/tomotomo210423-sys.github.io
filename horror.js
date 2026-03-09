// === CURSED MANOR V7 (Dedicated BGM & Novel Story Edition) ===
// 専用の重低音BGM、本格的なノベルゲーム風UI、深いストーリーを実装！

// ★ 専用の不気味な重低音ドローンBGMジェネレーター
let horrorBgmOsc = null, horrorBgmGain = null, horrorLfo = null;
function startHorrorBGM() {
    if (!audioCtx || SaveSys.data.bgmVol <= 0) return;
    stopHorrorBGM();
    let n = audioCtx.currentTime;
    
    // 超低音のサイン波
    horrorBgmOsc = audioCtx.createOscillator();
    horrorBgmOsc.type = 'sine';
    horrorBgmOsc.frequency.setValueAtTime(50, n); 
    
    horrorBgmGain = audioCtx.createGain();
    horrorBgmGain.gain.setValueAtTime(0.2 * SaveSys.data.bgmVol, n);
    
    // 音量を波のようにうねらせるLFO（低周波オシレーター）
    horrorLfo = audioCtx.createOscillator();
    horrorLfo.type = 'sine';
    horrorLfo.frequency.setValueAtTime(0.2, n); // ゆっくり揺れる
    let lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.15 * SaveSys.data.bgmVol, n);
    horrorLfo.connect(lfoGain);
    lfoGain.connect(horrorBgmGain.gain);
    
    horrorBgmOsc.connect(horrorBgmGain);
    horrorBgmGain.connect(audioCtx.destination);
    
    horrorBgmOsc.start(n);
    horrorLfo.start(n);
}

function stopHorrorBGM() {
    if(horrorBgmOsc) { try{horrorBgmOsc.stop();}catch(e){} horrorBgmOsc.disconnect(); horrorBgmOsc = null; }
    if(horrorLfo) { try{horrorLfo.stop();}catch(e){} horrorLfo.disconnect(); horrorLfo = null; }
    if(horrorBgmGain) { horrorBgmGain.disconnect(); horrorBgmGain = null; }
}

function playHSnd(t, param) {
    if (!audioCtx || SaveSys.data.seVol <= 0) return;
    let n = audioCtx.currentTime;
    let o = audioCtx.createOscillator(); let g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    let vol = SaveSys.data.seVol;

    if (t === 'heart') { 
        o.type = 'sine'; o.frequency.setValueAtTime(40, n); o.frequency.exponentialRampToValueAtTime(10, n + 0.3);
        g.gain.setValueAtTime(0.8 * vol, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.3);
        o.start(n); o.stop(n + 0.3);
    } else if (t === 'roar') { 
        o.type = 'sawtooth'; o.frequency.setValueAtTime(120, n); o.frequency.exponentialRampToValueAtTime(30, n + 1.2);
        g.gain.setValueAtTime(0.5 * vol, n); g.gain.exponentialRampToValueAtTime(0.01, n + 1.2);
        o.start(n); o.stop(n + 1.2);
    } else if (t === 'note') { 
        o.type = 'triangle'; let freqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
        o.frequency.setValueAtTime(freqs[param] || 440, n);
        g.gain.setValueAtTime(0.4 * vol, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.5);
        o.start(n); o.stop(n + 0.5);
    } else if (t === 'error') { 
        o.type = 'square'; o.frequency.setValueAtTime(100, n); o.frequency.setValueAtTime(80, n+0.1);
        g.gain.setValueAtTime(0.3 * vol, n); g.gain.linearRampToValueAtTime(0.01, n + 0.3);
        o.start(n); o.stop(n + 0.3);
    } else if (t === 'open') { 
        o.type = 'square'; o.frequency.setValueAtTime(300, n); o.frequency.exponentialRampToValueAtTime(50, n + 0.2);
        g.gain.setValueAtTime(0.2 * vol, n); g.gain.linearRampToValueAtTime(0.01, n + 0.2);
        o.start(n); o.stop(n + 0.2);
    } else if (t === 'type') { // 文字送り音
        o.type = 'square'; o.frequency.setValueAtTime(800, n); o.frequency.exponentialRampToValueAtTime(300, n + 0.05);
        g.gain.setValueAtTime(0.05 * vol, n); g.gain.linearRampToValueAtTime(0.01, n + 0.05);
        o.start(n); o.stop(n + 0.05);
    }
}

// ★ 深い狂気のストーリー（ノベルデータ）
const diaryStory = [
    [
        "【×月×日】",
        "あの館の主は狂っている。",
        "『永遠の命』などと嘯きながら、",
        "迷い込んだ者たちを次々と",
        "地下室の実験台にしているのだ。",
        "隠し金庫の暗証番号は...奴の異常な",
        "絵画の数、『目・指・首』の順だ。"
    ],
    [
        "【△月〇日】",
        "地下から恐ろしい呻き声がする。",
        "肉が裂け、骨が軋む音...",
        "奴はついに自らの体で実験を始めた。",
        "隠し扉の仕掛けは呪われたピアノ。",
        "『ド・ミ・ファ・ソ』と弾けば開くが、",
        "間違えれば、奴が飛んでくるぞ。"
    ],
    [
        "【？月？日】",
        "配電盤さえ直せれば外に出られる。",
        "だが、もう遅いかもしれない。",
        "巨大な肉塊と化した『元・館の主』が",
        "今もこの廊下を徘徊している。",
        "お願いだ、これを読んだなら、",
        "私の代わりに生きて脱出してくれ..."
    ]
];

const Horror = {
    st: 'menu', timer: 0,
    camX: 0, camY: 0,
    p: { x: 30, y: 30, r: 6, spd: 1.4, isHide: false },
    e: { x: 350, y: 350, r: 8, spd: 1.0, state: 'patrol', alert: 0, path: [] },
    keys: 0, maxKeys: 3, diaries: 0,
    msg: '', msgTimer: 0,
    
    pzSafe: [0, 0, 0], pzSafeCur: 0,
    pzPiano: [], pzPianoAns: [0, 2, 3, 4],
    pzPanel: 0,

    // ノベル用の状態変数
    novelDiaryIdx: 0, novelLine: 0, novelChar: 0, novelTimer: 0,

    mapW: 20, mapH: 20, ts: 20,
    map: [
        1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,1,6,0,0,0,0,0,0,0,1,0,0,0,0,1,
        1,0,3,0,0,1,0,1,1,1,1,1,1,0,1,0,3,0,0,1,
        1,0,0,0,0,0,0,1,0,0,0,9,1,0,1,1,1,0,0,1,
        1,1,1,0,1,1,0,1,0,3,0,0,1,0,0,0,0,0,8,1,
        1,0,0,0,1,0,0,1,1,1,0,1,1,1,1,1,1,1,0,1,
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

    sprs: { p: { d: "........01111000121121001111110004444000404404003003300300033000", pal: {'1':'#fcc', '2':'#000', '3':'#222', '4':'#08f'} } },

    init() {
        this.st = 'menu'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.4, isHide: false };
        this.e = { x: 350, y: 350, r: 8, spd: 1.0, state: 'patrol', alert: 0, path: [] };
        this.keys = 0; this.diaries = 0; this.msg = ''; this.msgTimer = 0;
        this.pzPiano = []; this.pzPanel = 0;
        
        let m = [...this.map];
        for(let i=0; i<m.length; i++) if(m[i]>=10) m[i] = m[i]-10;
        this.map = m;
        stopHorrorBGM(); // メニュー画面は無音
    },

    setMsg(text) { this.msg = text; this.msgTimer = 150; },

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
            let cx = ex + (px-ex)*(i/steps); let cy = ey + (py-ey)*(i/steps);
            let t = this.getTile(cx, cy);
            if (t === 1 || t === 2 || t === 5 || t === 6 || t === 7) return false;
        }
        return true;
    },

    getPath(sx, sy, gx, gy) {
        let stx = Math.floor(sx / this.ts), sty = Math.floor(sy / this.ts);
        let gtx = Math.floor(gx / this.ts), gty = Math.floor(gy / this.ts);
        let q = [{x: stx, y: sty, path: []}];
        let visited = new Set(); visited.add(stx + "," + sty);
        
        while(q.length > 0) {
            let cur = q.shift();
            if(cur.x === gtx && cur.y === gty) return cur.path; 
            
            let adjs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            for(let a of adjs) {
                let nx = cur.x + a[0], ny = cur.y + a[1];
                if(nx>=0 && nx<this.mapW && ny>=0 && ny<this.mapH) {
                    let t = this.map[ny * this.mapW + nx];
                    if(t !== 1 && t !== 2 && t !== 5 && t !== 6 && t !== 7 && !visited.has(nx + "," + ny)) {
                        visited.add(nx + "," + ny);
                        q.push({x: nx, y: ny, path: [...cur.path, {x: nx, y: ny}]});
                    }
                }
            }
        }
        return []; 
    },

    drawSprite(x, y, sName) {
        let s = this.sprs[sName]; let scale = 1.5; 
        let ox = x - 4 * scale; let oy = y - 4 * scale;
        for(let i=0; i<64; i++) {
            let p = s.d[i];
            if(p !== '0' && p !== '.') { ctx.fillStyle = s.pal[p]; ctx.fillRect(ox + (i%8)*scale, oy + Math.floor(i/8)*scale, scale, scale); }
        }
    },

    update() {
        this.timer++;
        let kD = typeof keysDown !== 'undefined' ? keysDown : {};
        let k = typeof keys !== 'undefined' ? keys : {};

        if (this.st === 'menu') {
            if (kD.a) { 
                this.st = 'play'; playSnd('jmp'); 
                this.setMsg('3つの謎を解き、鍵を探せ...'); 
                startHorrorBGM(); // ★ ゲーム開始時に専用BGMを鳴らす
            }
        }
        else if (this.st === 'safe_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.left) { this.pzSafeCur = (this.pzSafeCur + 2) % 3; playSnd('sel'); }
            if (kD.right) { this.pzSafeCur = (this.pzSafeCur + 1) % 3; playSnd('sel'); }
            if (kD.up) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 1) % 10; playSnd('sel'); }
            if (kD.down) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 9) % 10; playSnd('sel'); }
            if (kD.a) {
                if(this.pzSafe[0]===3 && this.pzSafe[1]===4 && this.pzSafe[2]===2) {
                    playHSnd('open'); this.keys++; this.setMsg(`金庫が開いた！ 鍵をゲット！ (${this.keys}/${this.maxKeys})`);
                    this.map[this.targetTy * this.mapW + this.targetTx] = 0; 
                    this.st = 'play';
                } else {
                    playHSnd('error'); screenShake(3); this.setMsg('暗証番号が違うようだ...');
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
                        this.keys++; this.setMsg(`隠し扉が開いた！ 鍵をゲット！ (${this.keys}/${this.maxKeys})`);
                        this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                        this.st = 'play';
                    } else {
                        playHSnd('error'); screenShake(10); this.setMsg('不協和音が響き渡った！！');
                        this.e.alert = 100; playHSnd('roar');
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
                playHSnd('open'); this.keys++; this.setMsg(`電力が復旧した！ 鍵をゲット！ (${this.keys}/${this.maxKeys})`);
                this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                this.st = 'play';
            }
            this.updateEnemyInPuzzle(); 
        }
        // ★ ノベルゲーム風 ストーリー進行
        else if (this.st === 'novel') {
            this.novelTimer++;
            let currentLineText = diaryStory[this.novelDiaryIdx][this.novelLine];
            
            // 1文字ずつ表示し、タイプ音を鳴らす
            if (this.novelChar < currentLineText.length && this.novelTimer % 3 === 0) {
                playHSnd('type');
                this.novelChar++;
            }

            if (kD.a || kD.b) {
                if (this.novelChar < currentLineText.length) {
                    this.novelChar = currentLineText.length; // スキップして全表示
                } else {
                    this.novelLine++;
                    this.novelChar = 0;
                    this.novelTimer = 0;
                    // 最後まで読んだらプレイに戻る
                    if (this.novelLine >= diaryStory[this.novelDiaryIdx].length) {
                        this.st = 'play';
                        this.map[this.targetTy * this.mapW + this.targetTx] = 0; // 読み終わった日記を消す
                        this.diaries++;
                    }
                }
            }
            this.updateEnemyInPuzzle(); // ★ 読んでいる最中も裏で鬼が迫ってくる！
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
                    this.p.isHide = false; this.setMsg('ロッカーから出た。'); playHSnd('open');
                } else if (tile === 3) {
                    this.p.isHide = true; this.setMsg('ロッカーに息を潜めた...'); playHSnd('open');
                } else if (tile === 5) {
                    this.st = 'piano_puzzle'; this.pzPiano = []; this.pzPianoCur = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 6) {
                    this.st = 'safe_puzzle'; this.pzSafe = [0,0,0]; this.pzSafeCur = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 7) {
                    this.st = 'panel_puzzle'; this.pzPanel = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 8) {
                    let hints = ["肖像画：目が『３つ』描かれている", "油絵：手が『４本』描かれている", "写真：首が『２つ』写っている"];
                    this.setMsg(hints[Math.floor(Math.random()*hints.length)]); playSnd('sel');
                } else if (tile === 9) {
                    // ★ 日記を調べることでノベルパートへ移行！
                    this.st = 'novel'; 
                    this.novelDiaryIdx = this.diaries; 
                    this.novelLine = 0; this.novelChar = 0; this.novelTimer = 0;
                    this.targetTx = tx; this.targetTy = ty;
                    playSnd('sel');
                } else if (ty <= 1 && tile === 0 && this.p.y < 30) {
                    if (this.keys >= this.maxKeys) {
                        this.st = 'clear'; playHSnd('open'); stopHorrorBGM();
                    } else {
                        this.setMsg('鍵がかかっている...あと' + (this.maxKeys - this.keys) + '個必要だ。'); playHSnd('error');
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
            this.st = 'jumpscare'; this.timer = 0; screenShake(20); playHSnd('roar'); stopHorrorBGM();
        }
    },

    // ★ BFS経路探索AIで、絶対に壁に引っかからず迷路を攻略してくる
    updateEnemyAI() {
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        
        let isVisible = this.canSee(this.p.x, this.p.y, this.e.x, this.e.y);
        if (isVisible && !this.p.isHide) {
            if (this.e.state !== 'chase') playHSnd('roar'); 
            this.e.alert = 100;
        }
        if (this.p.isHide && this.e.alert > 0) this.e.alert -= 0.5; 

        if (this.timer % 5 === 0) {
            if (this.e.alert > 50 && !this.p.isHide) {
                this.e.state = 'chase'; 
                this.e.spd = 1.2; 
                this.e.path = this.getPath(this.e.x, this.e.y, this.p.x, this.p.y);
            } else {
                this.e.state = 'patrol';
                this.e.spd = 0.6;
                if (this.e.path.length === 0 || dist < 5) {
                    let rx = Math.floor(Math.random() * this.mapW) * this.ts + 10;
                    let ry = Math.floor(Math.random() * this.mapH) * this.ts + 10;
                    if (this.getTile(rx, ry) === 0) {
                        this.e.path = this.getPath(this.e.x, this.e.y, rx, ry);
                    }
                }
            }
        }

        if (this.e.path && this.e.path.length > 0) {
            let nextNode = this.e.path[0];
            let tgtX = nextNode.x * this.ts + this.ts/2;
            let tgtY = nextNode.y * this.ts + this.ts/2;
            
            let edx = tgtX - this.e.x, edy = tgtY - this.e.y;
            let elen = Math.hypot(edx, edy);
            
            if (elen < this.e.spd) {
                this.e.path.shift();
            } else {
                edx /= elen; edy /= elen;
                this.e.x += edx * this.e.spd;
                this.e.y += edy * this.e.spd;
            }
        }

        if (dist < 150 && !this.p.isHide && this.timer % Math.max(15, Math.floor(dist/3)) === 0) {
            playHSnd('heart');
        }

        if (dist < this.p.r + this.e.r - 2 && !this.p.isHide && this.st === 'play') {
            this.st = 'jumpscare'; this.timer = 0; screenShake(20); playHSnd('roar'); stopHorrorBGM();
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            if (Math.random() < 0.05) { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); }
            ctx.fillStyle = '#800'; ctx.font = 'bold 22px monospace'; ctx.fillText('呪われた洋館', 35 + (Math.random()-0.5)*2, 100);
            ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('TRUE SURVIVAL HORROR', 45, 120);
            ctx.fillStyle = (this.timer % 60 < 30) ? '#fff' : '#888'; ctx.fillText('Aボタンで進入...', 60, 200);
            return;
        }

        if (this.st === 'jumpscare') {
            ctx.fillStyle = (this.timer % 4 < 2) ? '#f00' : '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(100, 150, 80, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#f00'; for(let i=0; i<20; i++) { ctx.beginPath(); ctx.moveTo(100, 150); ctx.lineTo(100+(Math.random()-0.5)*200, 150+(Math.random()-0.5)*200); ctx.stroke(); }
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.fillText('YOU ARE DEAD...', 20, 220);
            return;
        }

        if (this.st === 'clear') {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('脱出成功！', 50, 100);
            
            if (this.diaries >= 3) {
                ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('TRUE ENDING', 60, 130);
                ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('全ての日記を読み、恐ろしい真相を知った...', 5, 160);
            } else {
                ctx.fillStyle = '#888'; ctx.font = '12px monospace'; ctx.fillText('NORMAL ENDING', 55, 130);
                ctx.fillStyle = '#aaa'; ctx.font = '9px monospace'; ctx.fillText('生き延びたが、真相は闇の中だ...', 15, 160);
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
                
                ctx.fillStyle = '#1c1111'; ctx.fillRect(px, py, this.ts, this.ts);
                ctx.strokeStyle = '#0a0505'; ctx.lineWidth = 1;
                for(let i=0; i<3; i++) { ctx.beginPath(); ctx.moveTo(px, py + i*6 + 2); ctx.lineTo(px+this.ts, py + i*6 + 4); ctx.stroke(); }
                if ((x*y)%7 === 0) { ctx.fillStyle = 'rgba(100,0,0,0.6)'; ctx.beginPath(); ctx.arc(px+5, py+10, 3, 0, Math.PI*2); ctx.fill(); }

                if (t === 1) { 
                    let g = ctx.createLinearGradient(px, py, px, py+this.ts);
                    g.addColorStop(0, '#433'); g.addColorStop(1, '#111');
                    ctx.fillStyle = g; ctx.fillRect(px, py, this.ts, this.ts);
                    ctx.strokeStyle = '#000'; ctx.strokeRect(px, py, this.ts, this.ts);
                    ctx.beginPath(); ctx.moveTo(px, py+this.ts/2); ctx.lineTo(px+this.ts, py+this.ts/2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(px+this.ts/2, py); ctx.lineTo(px+this.ts/2, py+this.ts/2); ctx.stroke();
                } 
                else if (t === 2) { ctx.fillStyle = '#522'; ctx.fillRect(px, py, this.ts, this.ts); ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('EXIT', px+2, py+12); } 
                else if (t === 3) { ctx.fillStyle = '#245'; ctx.fillRect(px+2, py+2, this.ts-4, this.ts-4); ctx.fillStyle = '#123'; ctx.fillRect(px+4, py+4, 4, 12); ctx.fillRect(px+12, py+4, 4, 12); } 
                else if (t === 5) { ctx.fillStyle = '#111'; ctx.fillRect(px, py+5, 20, 15); ctx.fillStyle = '#fff'; ctx.fillRect(px+2, py+10, 16, 5); } 
                else if (t === 6) { ctx.fillStyle = '#666'; ctx.fillRect(px+2, py+2, 16, 16); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px+10, py+10, 4, 0, Math.PI*2); ctx.fill(); } 
                else if (t === 7) { ctx.fillStyle = '#800'; ctx.fillRect(px+4, py, 12, 20); ctx.fillStyle = '#ff0'; ctx.fillRect(px+8, py+8, 4, 4); } 
                else if (t === 8) { ctx.fillStyle = '#531'; ctx.fillRect(px+2, py, 16, 4); ctx.fillStyle = '#800'; ctx.fillRect(px+4, py+1, 12, 2); } 
                else if (t === 9) { ctx.fillStyle = '#ddd'; ctx.fillRect(px+5, py+5, 10, 10); ctx.fillStyle = '#f00'; ctx.fillRect(px+7, py+7, 6, 2); } 
            }
        }

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

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 15, 0.4)'; 
        ctx.fillRect(0, 0, 200, 300);

        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        if (dist < 120 && !this.p.isHide) {
            let intensity = 1 - (dist / 120);
            let pulse = (Math.sin(Date.now() / (150 - intensity*100)) + 1) / 2;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * intensity * 0.4})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        // --- UI ---
        if (this.st === 'safe_puzzle') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(20, 100, 160, 100);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 100, 160, 100);
            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('ダイヤル式金庫', 60, 120);
            ctx.font = '24px monospace';
            for(let i=0; i<3; i++) {
                ctx.fillStyle = (i === this.pzSafeCur) ? '#0f0' : '#fff';
                ctx.fillText(this.pzSafe[i], 60 + i*30, 160);
                if(i === this.pzSafeCur) { ctx.font = '10px monospace'; ctx.fillText('▲', 62 + i*30, 180); ctx.fillText('▼', 62 + i*30, 140); ctx.font = '24px monospace'; }
            }
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('A: 決定   B: 戻る', 55, 190);
        }
        else if (this.st === 'piano_puzzle') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 100, 180, 100);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 100, 180, 100);
            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('呪われたピアノ', 60, 120);
            
            for(let i=0; i<7; i++) { 
                ctx.fillStyle = (i === this.pzPianoCur) ? '#888' : '#fff';
                ctx.fillRect(25 + i*22, 130, 20, 40);
                ctx.strokeStyle = '#000'; ctx.strokeRect(25 + i*22, 130, 20, 40);
            }
            ctx.fillStyle = '#0f0'; ctx.beginPath(); ctx.arc(35 + this.pzPianoCur*22, 180, 4, 0, Math.PI*2); ctx.fill();
            let jpNotes = ["ド","レ","ミ","ファ","ソ","ラ","シ"];
            ctx.fillStyle = '#0ff'; ctx.font = '10px monospace'; ctx.fillText('入力: ' + this.pzPiano.map(n=>jpNotes[n]).join(' '), 25, 190);
        }
        else if (this.st === 'panel_puzzle') {
            ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(20, 100, 160, 100);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 100, 160, 100);
            ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('配電盤の修理！', 60, 120);
            ctx.fillStyle = '#fff'; ctx.fillText('Aボタン連打で電力を送れ！', 30, 140);
            ctx.fillStyle = '#333'; ctx.fillRect(30, 160, 140, 15);
            ctx.fillStyle = '#0f0'; ctx.fillRect(30, 160, 140 * (this.pzPanel/100), 15);
        }
        // ★ 本格ノベルゲーム風 UI
        else if (this.st === 'novel') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 300);
            
            ctx.strokeStyle = '#800'; ctx.lineWidth = 2; ctx.strokeRect(5, 150, 190, 145);
            ctx.fillStyle = 'rgba(20,0,0,0.9)'; ctx.fillRect(5, 150, 190, 145);

            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            
            // これまでに表示した行を描画
            let y = 170;
            for (let i = 0; i < this.novelLine; i++) {
                ctx.fillText(diaryStory[this.novelDiaryIdx][i], 15, y);
                y += 18;
            }
            
            // 現在タイピング中の行を描画
            let currentLineText = diaryStory[this.novelDiaryIdx][this.novelLine];
            let dispText = currentLineText.substring(0, this.novelChar);
            ctx.fillStyle = '#faa'; // 色を変えて目立たせる
            ctx.fillText(dispText, 15, y);

            if (this.novelChar >= currentLineText.length) {
                ctx.fillStyle = (this.timer % 30 < 15) ? '#ff0' : 'transparent';
                ctx.fillText('▼ Aボタン', 130, 280);
            }
        }

        if (this.st === 'play' || this.st.includes('puzzle') || this.st === 'novel') {
            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace';
            ctx.fillText(`鍵: ${this.keys}/${this.maxKeys}`, 140, 15);

            if (this.msgTimer > 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 260, 200, 30);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
                let tw = ctx.measureText(this.msg).width;
                ctx.fillText(this.msg, 100 - tw/2, 280);
            }
        }
    }
};
