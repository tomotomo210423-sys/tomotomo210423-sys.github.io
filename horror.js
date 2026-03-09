// === CURSED MANOR V4 (Ultimate Sound & Novel Edition) ===
// 専用BGM、心音SE、日本語ノベル演出、ストーリーを実装した最終形態！

const Horror = {
    st: 'title', timer: 0,
    camX: 0, camY: 0,
    p: { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false },
    e: { x: 350, y: 350, r: 8, spd: 0.8, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0, col: false },
    keys: 0, maxKeys: 3, diaries: 0, heartTimer: 0,
    msg: '', msgTimer: 0,
    
    pzSafe: [0, 0, 0], pzSafeCur: 0,
    pzPiano: [], pzPianoAns: [0, 2, 3, 4], 
    pzPanel: 0,

    // ノベルパート管理
    nv: { active: false, texts: [], page: 0, charIdx: 0, timer: 0, callback: null },

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

    // ★ 専用サウンドシステム
    bgmOsc: null, bgmGain: null, lfo: null, lfoGain: null,
    
    startBGM() {
        if (!audioCtx) return;
        this.stopBGM();
        let t = audioCtx.currentTime;
        this.bgmOsc = audioCtx.createOscillator();
        this.bgmGain = audioCtx.createGain();
        this.bgmOsc.type = 'sine';
        this.bgmOsc.frequency.value = 55; // 不気味な重低音
        this.bgmGain.gain.setValueAtTime(0, t);
        this.bgmGain.gain.linearRampToValueAtTime(0.5, t + 2); // フェードイン
        this.bgmOsc.connect(this.bgmGain);
        this.bgmGain.connect(audioCtx.destination);
        this.bgmOsc.start();
        
        // うねり(LFO)の追加
        this.lfo = audioCtx.createOscillator();
        this.lfoGain = audioCtx.createGain();
        this.lfo.type = 'sine';
        this.lfo.frequency.value = 0.2;
        this.lfoGain.gain.value = 10;
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.bgmOsc.frequency);
        this.lfo.start();
    },
    
    stopBGM() {
        if(this.bgmOsc) { this.bgmOsc.stop(); this.bgmOsc.disconnect(); this.bgmOsc = null; }
        if(this.lfo) { this.lfo.stop(); this.lfo.disconnect(); this.lfo = null; }
    },
    
    playHorrorSE(type) {
        if (!audioCtx) return;
        let t = audioCtx.currentTime;
        let o = audioCtx.createOscillator();
        let g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        
        if (type === 'heartbeat') {
            o.type = 'sine';
            o.frequency.setValueAtTime(50, t);
            o.frequency.exponentialRampToValueAtTime(20, t + 0.3);
            g.gain.setValueAtTime(0.8, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            o.start(t); o.stop(t + 0.3);
        } else if (type === 'scare') {
            o.type = 'sawtooth';
            o.frequency.setValueAtTime(300, t);
            o.frequency.linearRampToValueAtTime(50, t + 0.8);
            g.gain.setValueAtTime(1.0, t);
            g.gain.linearRampToValueAtTime(0.01, t + 0.8);
            o.start(t); o.stop(t + 0.8);
            if (typeof noiseBuffer !== 'undefined' && noiseBuffer) {
                let ns = audioCtx.createBufferSource(); let ng = audioCtx.createGain();
                ns.buffer = noiseBuffer;
                ng.gain.setValueAtTime(1.0, t); ng.gain.linearRampToValueAtTime(0.01, t + 0.8);
                ns.connect(ng); ng.connect(audioCtx.destination);
                ns.start(t); ns.stop(t + 0.8);
            }
        } else if (type === 'piano') {
            o.type = 'triangle';
            let freqs = [261.6, 293.6, 329.6, 349.2, 392.0, 440.0, 493.8];
            o.frequency.setValueAtTime(freqs[this.pzPianoCur] || 440, t);
            g.gain.setValueAtTime(0.5, t);
            g.gain.exponentialRampToValueAtTime(0.01, t + 1.0);
            o.start(t); o.stop(t + 1.0);
        }
    },

    init() {
        this.st = 'title'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.2, st: 100, maxSt: 100, isExh: false, isHide: false };
        this.e = { x: 350, y: 350, r: 8, spd: 0.8, state: 'patrol', tgtX: 350, tgtY: 350, alert: 0, col: false };
        this.keys = 0; this.diaries = 0; this.msg = ''; this.msgTimer = 0;
        this.pzPiano = []; this.pzPanel = 0; this.heartTimer = 0;
        
        let m = [...this.map];
        for(let i=0; i<m.length; i++) if(m[i]>=10) m[i] = m[i]-10; 
        this.map = m;
        BGM.stop();
        this.stopBGM();
    },

    // ★ ノベル起動関数
    startNovel(texts, callback) {
        this.nv.active = true;
        this.nv.texts = texts;
        this.nv.page = 0;
        this.nv.charIdx = 0;
        this.nv.timer = 0;
        this.nv.callback = callback;
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
        if (dist > 120) return false; 
        let steps = dist / 4;
        for(let i=0; i<=steps; i++) {
            let cx = ex + (px-ex)*(i/steps);
            let cy = ey + (py-ey)*(i/steps);
            if (this.getTile(cx, cy) === 1 || this.getTile(cx, cy) === 2) return false; 
        }
        return true;
    },

    drawSprite(x, y, sName) {
        let s = this.sprs[sName]; let scale = 1.5; 
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

        // ★ ノベルパートの更新（ノベル中は他の時間が止まる）
        if (this.nv.active) {
            this.nv.timer++;
            if (this.nv.timer % 2 === 0 && this.nv.charIdx < this.nv.texts[this.nv.page].length) {
                this.nv.charIdx++;
            }
            if (kD.a) {
                if (this.nv.charIdx < this.nv.texts[this.nv.page].length) {
                    this.nv.charIdx = this.nv.texts[this.nv.page].length; // 全表示
                } else {
                    this.nv.page++; this.nv.charIdx = 0; playSnd('sel');
                    if (this.nv.page >= this.nv.texts.length) {
                        this.nv.active = false;
                        if (this.nv.callback) this.nv.callback();
                    }
                }
            }
            return;
        }

        if (this.st === 'title') {
            if (kD.a) { 
                playSnd('jmp'); 
                this.startBGM(); // 専用BGMスタート！
                this.startNovel([
                    "特ダネを求めて、森の奥の\n廃洋館にやってきた。",
                    "…ガチャン！！",
                    "背後の扉が勝手に閉まり、\n鍵がかけられてしまった。",
                    "ここから脱出しないと…\n嫌な予感がする。"
                ], () => { this.st = 'play'; });
            }
        }
        else if (this.st === 'safe_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.left) { this.pzSafeCur = (this.pzSafeCur + 2) % 3; playSnd('sel'); }
            if (kD.right) { this.pzSafeCur = (this.pzSafeCur + 1) % 3; playSnd('sel'); }
            if (kD.up) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 1) % 10; playSnd('sel'); }
            if (kD.down) { this.pzSafe[this.pzSafeCur] = (this.pzSafe[this.pzSafeCur] + 9) % 10; playSnd('sel'); }
            if (kD.a) {
                // 正解は「3・4・2」
                if(this.pzSafe[0]===3 && this.pzSafe[1]===4 && this.pzSafe[2]===2) {
                    playSnd('powerup'); this.keys++; this.setMsg(`金庫が開いた！ 鍵を入手！(${this.keys}/${this.maxKeys})`);
                    this.map[this.targetTy * this.mapW + this.targetTx] = 0; 
                    this.st = 'play';
                } else {
                    playSnd('hit'); screenShake(3); this.setMsg('パスワードが違うようだ…。');
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
                this.playHorrorSE('piano'); // ★ ピアノの音！
                if (this.pzPiano.length >= 4) {
                    let isCorrect = true;
                    for(let i=0; i<4; i++) if(this.pzPiano[i] !== this.pzPianoAns[i]) isCorrect = false;
                    
                    if (isCorrect) {
                        playSnd('powerup'); this.keys++; this.setMsg(`隠し扉が開いた！ 鍵を入手！(${this.keys}/${this.maxKeys})`);
                        this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                        this.st = 'play';
                    } else {
                        playSnd('hit'); screenShake(10); this.setMsg('不協和音が響き渡った…！！');
                        this.e.alert = 100; this.e.tgtX = this.p.x; this.e.tgtY = this.p.y; 
                        this.pzPiano = []; this.st = 'play';
                    }
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'panel_puzzle') {
            if (kD.b) { this.st = 'play'; return; }
            if (kD.a) { this.pzPanel += 4; playSnd('sel'); } 
            this.pzPanel -= 0.5; if(this.pzPanel < 0) this.pzPanel = 0;
            
            if (this.pzPanel >= 100) {
                playSnd('powerup'); this.keys++; this.setMsg(`電力が復旧した！ 鍵を入手！(${this.keys}/${this.maxKeys})`);
                this.map[this.targetTy * this.mapW + this.targetTx] = 0;
                this.st = 'play';
            }
            this.updateEnemyInPuzzle(); 
        }
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

                if (isRunning && this.timer % 10 === 0) {
                    let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
                    if (dist < 150) this.e.alert += 8; 
                }
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
                    this.p.isHide = false; this.setMsg('ロッカーから出た。');
                } else if (tile === 3) {
                    this.p.isHide = true; this.setMsg('ロッカーに隠れた…。');
                } else if (tile === 4) {
                    this.keys++; this.map[ty * this.mapW + tx] = 0; 
                    playSnd('coin'); this.setMsg(`鍵を入手した！ (${this.keys}/${this.maxKeys})`);
                } else if (tile === 5) {
                    this.st = 'piano_puzzle'; this.pzPiano = []; this.pzPianoCur = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 6) {
                    this.st = 'safe_puzzle'; this.pzSafe = [0,0,0]; this.pzSafeCur = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 7) {
                    this.st = 'panel_puzzle'; this.pzPanel = 0; this.targetTx = tx; this.targetTy = ty;
                } else if (tile === 8) {
                    this.startNovel(["『不気味な絵画』", "3つの目、4本の指、2つの頭が\n狂気的に描かれている…"]);
                } else if (tile === 9) {
                    this.diaries++; this.map[ty * this.mapW + tx] = 0; playSnd('sel');
                    if (this.diaries === 1) this.startNovel(["『破られた日記』", "「館の主であるあの医者は\n狂っている。」", "「永遠の命を求めて、非人道的な\n実験を繰り返しているのだ。」"]);
                    else if (this.diaries === 2) this.startNovel(["『破られた日記』", "「奴の目はもはや人間のそれ\nではない。」", "「金庫の鍵は絵画に。\n隠し扉の鍵は『ドミファソ』だ」"]);
                    else if (this.diaries === 3) this.startNovel(["『血塗られた日記』", "「奴は…失敗した。\n自らの身体に薬を打ち…」", "「理性を失った化け物に\nなり果てた。」", "「誰か、ここから出してくれ…！」"]);
                } else if (ty <= 1 && tile === 0 && this.p.y < 30) {
                    if (this.keys >= this.maxKeys) {
                        this.st = 'clear'; this.stopBGM(); playSnd('powerup');
                        if (this.diaries >= 3) {
                            this.startNovel([
                                "日記をすべて読み、\n館の忌まわしい過去を知った。", 
                                "あの化け物は、狂気に囚われた\n館の主だったのだ。", 
                                "背後で館が崩れ落ちていく…\nこれで、すべてが終わった。", 
                                "【 TRUE ENDING 】"
                            ]);
                        } else {
                            this.startNovel([
                                "なんとか館から脱出する\nことができた…", 
                                "だが、あの化け物の正体は\n一体何だったのだろうか…？", 
                                "謎は闇の中に取り残された。", 
                                "【 NORMAL ENDING 】"
                            ]);
                        }
                    } else {
                        this.setMsg('鍵がかかっている…。あと' + (this.maxKeys - this.keys) + '個必要だ。');
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
            if (this.timer > 60) { this.init(); } 
        }
        else if (this.st === 'clear') {
            if (kD.a || kD.start) this.init();
        }
    },

    updateEnemyInPuzzle() {
        this.updateEnemyAI();
        if (Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y) < this.p.r + this.e.r + 5) {
            this.st = 'jumpscare'; this.timer = 0; this.stopBGM(); this.playHorrorSE('scare'); screenShake(20); 
        }
    },

    updateEnemyAI() {
        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        
        // ★ 心音SEの再生ロジック
        if (dist < 150 && !this.p.isHide) {
            this.heartTimer += (150 - dist) / 20; // 近いほど早くタイマーが貯まる
            if (this.heartTimer > 25) {
                this.playHorrorSE('heartbeat');
                this.heartTimer = 0;
            }
        }

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
            this.st = 'jumpscare'; this.timer = 0; this.stopBGM(); this.playHorrorSE('scare'); screenShake(20);
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            if (Math.random() < 0.05) { ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); }
            ctx.fillStyle = '#800'; ctx.font = 'bold 22px monospace'; ctx.fillText('CURSED MANOR', 25 + (Math.random()-0.5)*2, 100);
            ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('TRUE SURVIVAL HORROR', 45, 120);
            ctx.fillStyle = (this.timer % 60 < 30) ? '#fff' : '#888'; ctx.fillText('PRESS A TO ENTER...', 45, 200);
            if (this.nv.active) this.drawNovel();
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
            if (this.nv.active) this.drawNovel();
            else {
                ctx.fillStyle = '#f00'; ctx.font = 'bold 20px monospace'; ctx.fillText('THE END', 60, 150);
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
                else if (t === 5) { ctx.fillStyle = '#111'; ctx.fillRect(px, py+5, 20, 15); ctx.fillStyle = '#fff'; ctx.fillRect(px+2, py+10, 16, 5); } 
                else if (t === 6) { ctx.fillStyle = '#666'; ctx.fillRect(px+2, py+2, 16, 16); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(px+10, py+10, 4, 0, Math.PI*2); ctx.fill(); } 
                else if (t === 7) { ctx.fillStyle = '#800'; ctx.fillRect(px+4, py, 12, 20); ctx.fillStyle = '#ff0'; ctx.fillRect(px+8, py+8, 4, 4); } 
                else if (t === 8) { ctx.fillStyle = '#531'; ctx.fillRect(px+2, py, 16, 4); ctx.fillStyle = '#800'; ctx.fillRect(px+4, py+1, 12, 2); } 
                else if (t === 9) { ctx.fillStyle = '#ddd'; ctx.fillRect(px+5, py+5, 10, 10); ctx.fillStyle = '#f00'; ctx.fillRect(px+7, py+7, 6, 2); } 
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

        let sightRadius = this.p.isHide ? 30 : 90;
        let gradX = this.p.x - this.camX; let gradY = this.p.y - this.camY;
        ctx.globalCompositeOperation = 'source-over';
        let darkGrad = ctx.createRadialGradient(gradX, gradY, 10, gradX, gradY, sightRadius);
        darkGrad.addColorStop(0, 'rgba(0,0,0,0)'); darkGrad.addColorStop(1, 'rgba(0,0,0,0.98)');
        ctx.fillStyle = darkGrad; ctx.fillRect(0, 0, 200, 300);

        let dist = Math.hypot(this.p.x - this.e.x, this.p.y - this.e.y);
        if (dist < 120 && !this.p.isHide) {
            let intensity = 1 - (dist / 120);
            let pulse = (Math.sin(Date.now() / (150 - intensity*100)) + 1) / 2;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * intensity * 0.4})`;
            ctx.fillRect(0, 0, 200, 300);
            if(pulse > 0.9 && intensity > 0.5) { ctx.translate((Math.random()-0.5)*2, (Math.random()-0.5)*2); } 
        }

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

        if (this.st === 'play' || this.st.includes('puzzle')) {
            ctx.fillStyle = '#000'; ctx.fillRect(10, 10, 50, 5);
            ctx.fillStyle = this.p.isExh ? '#f00' : '#0f0'; 
            ctx.fillRect(10, 10, 50 * (this.p.st / this.p.maxSt), 5);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 50, 5);

            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace';
            ctx.fillText(`KEYS: ${this.keys}/${this.maxKeys}`, 130, 15);

            if (this.msgTimer > 0 && !this.nv.active) {
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 260, 200, 30);
                ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
                let tw = ctx.measureText(this.msg).width;
                ctx.fillText(this.msg, 100 - tw/2, 280);
            }
        }
        
        // ★ ノベルウィンドウ描画
        if (this.nv.active) this.drawNovel();
    },

    drawNovel() {
        ctx.fillStyle = 'rgba(0, 0, 10, 0.85)';
        ctx.fillRect(10, 200, 180, 90);
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(10, 200, 180, 90);
        
        ctx.fillStyle = '#fff';
        ctx.font = '11px monospace'; // 日本語表示用に少し大きめ
        
        let text = this.nv.texts[this.nv.page].substring(0, this.nv.charIdx);
        let lines = text.split('\n');
        for(let i=0; i<lines.length; i++) {
            ctx.fillText(lines[i], 20, 225 + i*18);
        }
        
        if (this.nv.charIdx >= this.nv.texts[this.nv.page].length) {
            ctx.fillStyle = (this.timer % 30 < 15) ? '#ff0' : 'transparent';
            ctx.fillText('▼', 175, 285);
        }
    }
};
