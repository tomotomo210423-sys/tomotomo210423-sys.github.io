// === ABYSS GENERAL v2 — DEEP ABYSS EVOLUTION ===
const Abyss = {
    st: 'title',
    tmr: 0,
    core: { x: 40, y: 120 },
    target: { x: 150, y: 120 },
    tentacles: [],

    prevPointerActive: false,
    winding: false,
    musicBox: 100,

    vfx: [], shieldTmr: 0, swarms: [], eyes: [],
    projectiles: [],
    enemies: [],
    enemyProjectiles: [],
    holySeals: [],
    bubbles: [], // deep-sea bubble particles
    wave: 0,

    coreHp: 100, coreMaxHp: 100, score: 0, soul: 0,
    lv: { tentacle: 1, meteor: 1, swarm: 1 },

    bgmInt: null,

    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400; canvas.height = 240;
        
        this.st = 'title';
        this.tmr = 0;
        
        this.tentacles = [];
        this.addTentacle();
        this.target = { x: 200, y: 120 };
        
        if (typeof pointer !== 'undefined') {
            pointer.active = false;
            this.prevPointerActive = false;
            pointer.path = [];
        }
        
        if (typeof BGM !== 'undefined') BGM.play('spell');
    },

    playDespairBGM() {
        if (typeof BGM !== 'undefined') BGM.stop();
        if (this.bgmInt) clearInterval(this.bgmInt);
        if (!audioCtx) return;
        
        // ドクン…ドクン…という不気味な心音ループ
        this.bgmInt = setInterval(() => {
            if (this.st !== 'play' && this.st !== 'shop') return;
            let n = audioCtx.currentTime;
            let o = audioCtx.createOscillator(); let g = audioCtx.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(40, n); o.frequency.exponentialRampToValueAtTime(20, n + 0.3);
            g.gain.setValueAtTime(0.3, n); g.gain.exponentialRampToValueAtTime(0.01, n + 0.3);
            o.connect(g); g.connect(audioCtx.destination); o.start(n); o.stop(n + 0.4);
            
            // 不協和音ノイズ
            if (Math.random() < 0.3) {
                let o2 = audioCtx.createOscillator(); let g2 = audioCtx.createGain();
                o2.type = 'sawtooth'; o2.frequency.setValueAtTime(100 + Math.random()*200, n);
                g2.gain.setValueAtTime(0.02, n); g2.gain.linearRampToValueAtTime(0.001, n + 0.5);
                o2.connect(g2); g2.connect(audioCtx.destination); o2.start(n); o2.stop(n + 0.5);
            }
        }, 800);
    },

    stopDespairBGM() {
        if (this.bgmInt) { clearInterval(this.bgmInt); this.bgmInt = null; }
    },

    startGame() {
        this.st = 'play';
        this.tmr = 0;
        this.vfx = []; this.shieldTmr = 0; this.swarms = [];
        this.eyes = []; this.projectiles = []; this.enemies = [];
        this.enemyProjectiles = []; this.holySeals = [];
        this.coreHp = 100; this.coreMaxHp = 100; this.score = 0; this.soul = 0;
        this.lv = { tentacle: 1, meteor: 1, swarm: 1 };
        this.musicBox = 100; this.winding = false; this.wave = 0;
        this.bubbles = [];
        for (let i = 0; i < 20; i++) {
            this.bubbles.push({ x: Math.random()*400, y: Math.random()*240+240, r: 1+Math.random()*3, spd: 0.3+Math.random()*0.5 });
        }
        
        this.tentacles = [];
        this.addTentacle();
        this.target = { x: 150, y: 120 };
        
        if (typeof pointer !== 'undefined') pointer.path = [];
        
        if (typeof playSnd !== 'undefined') playSnd('combo');
        this.playDespairBGM();
    },
    
    addTentacle() {
        let idx = this.tentacles.length;
        let offsets = [{x:0, y:0}, {x:0, y:-20}, {x:0, y:20}, {x:-20, y:-10}, {x:-20, y:10}];
        let o = offsets[idx % 5];
        let segs = [];
        for (let i = 0; i < 20; i++) { segs.push({ x: this.core.x + o.x, y: this.core.y + o.y }); }
        this.tentacles.push({ root: o, segments: segs, num: 20, len: 14 });
    },
    
    updateIK() {
        for (let t of this.tentacles) {
            let segs = t.segments; let len = t.len;
            segs[segs.length - 1].x = this.target.x + t.root.x * 0.5; 
            segs[segs.length - 1].y = this.target.y + t.root.y * 0.5;
            
            for (let i = segs.length - 2; i >= 0; i--) {
                let dx = segs[i].x - segs[i+1].x; let dy = segs[i].y - segs[i+1].y; let dist = Math.hypot(dx, dy) || 1;
                segs[i].x = segs[i+1].x + (dx / dist) * len; segs[i].y = segs[i+1].y + (dy / dist) * len;
            }
            segs[0].x = this.core.x + t.root.x; segs[0].y = this.core.y + t.root.y;
            for (let i = 1; i < segs.length; i++) {
                let dx = segs[i].x - segs[i-1].x; let dy = segs[i].y - segs[i-1].y; let dist = Math.hypot(dx, dy) || 1;
                segs[i].x = segs[i-1].x + (dx / dist) * len; segs[i].y = segs[i-1].y + (dy / dist) * len;
            }
        }
    },
    
    recognizeGesture(path) {
        if (path.length < 3) return null; 
        let minX = 999, maxX = -999, minY = 999, maxY = -999;
        for (let p of path) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
        }
        let w = Math.max(1, maxX - minX); let h = Math.max(1, maxY - minY);
        let pStart = path[0]; let pEnd = path[path.length - 1];
        let distStartEnd = Math.hypot(pStart.x - pEnd.x, pStart.y - pEnd.y);
        
        if (Math.max(w, h) < 20) return null;
        if (h > w * 1.5 && h > 30) return '|'; 
        if (w > h * 1.5 && w > 30) return '-'; 
        if (distStartEnd < Math.max(w, h) * 0.6 && w > 20 && h > 20) return 'O';
        return null;
    },
    
    spawnMagic(type, cx, cy) {
        if (type === 'O') {
            this.shieldTmr += 180; 
            this.vfx.push({ type: 'text', text: 'SHIELD UP!', x: this.core.x, y: this.core.y - 60, life: 60, color: '#0ff' });
            if (typeof playSnd !== 'undefined') playSnd('sel');
        } else if (type === '|') { 
            this.vfx.push({ type: 'text', text: 'METEOR!', x: cx - 30, y: cy - 30, life: 60, color: '#fa0' });
            this.vfx.push({ type: 'meteor', x: cx - 150, y: -50, tx: cx, ty: cy, life: 30, maxLife: 30 });
            if (typeof playSnd !== 'undefined') playSnd('jmp');
        } else if (type === '-') {
            this.vfx.push({ type: 'text', text: 'SWARM!', x: cx - 20, y: cy - 30, life: 60, color: '#f0f' });
            for(let i=0; i<15; i++) {
                this.swarms.push({ x: cx + (Math.random()-0.5)*40, y: cy + (Math.random()-0.5)*40, vx: Math.random()*4+1, vy: (Math.random()-0.5)*4, life: 180 });
            }
            if (typeof playSnd !== 'undefined') playSnd('sel');
        }
    },
    
    update() {
        if (typeof keysDown !== 'undefined' && keysDown.select) {
            document.getElementById('gameboy').classList.remove('mode-abyss');
            canvas.width = 200; canvas.height = 300;
            this.stopDespairBGM();
            if (typeof switchApp !== 'undefined') switchApp(Menu);
            return;
        }
        
        this.tmr++;

        // ==========================================
        // TITLE STATE
        // ==========================================
        if (this.st === 'title') {
            this.target.x = 200 + Math.sin(this.tmr * 0.05) * 100;
            this.target.y = 120 + Math.cos(this.tmr * 0.03) * 80;
            for (let i = 0; i < 3; i++) this.updateIK();

            let tapped = (typeof pointer !== 'undefined' && pointer.active && !this.prevPointerActive);
            if ((typeof keysDown !== 'undefined' && keysDown.a) || tapped) {
                this.startGame();
            }
            if (typeof pointer !== 'undefined') this.prevPointerActive = pointer.active;
            return; 
        }

        // ==========================================
        // GAMEOVER STATE
        // ==========================================
        if (this.st === 'gameover') {
            for (let i = 0; i < 3; i++) this.updateIK();
            this.updateVFX(1.0);
            
            let tapped = (typeof pointer !== 'undefined' && pointer.active && !this.prevPointerActive);
            if (this.tmr > 60 && ((typeof keysDown !== 'undefined' && keysDown.a) || tapped)) {
                this.st = 'title'; this.tmr = 0;
                if (typeof pointer !== 'undefined') pointer.path = [];
                if (typeof BGM !== 'undefined') BGM.play('spell');
            }
            if (typeof pointer !== 'undefined') this.prevPointerActive = pointer.active;
            return;
        }

        // ==========================================
        // PLAY & SHOP STATE
        // ==========================================
        let ts = (this.st === 'shop') ? 0.2 : 1.0;
        if (this.shieldTmr > 0) this.shieldTmr -= ts;
        
        // --- 左手操作 ---
        let speed = 12;
        let isMoving = false;
        if (typeof keys !== 'undefined') {
            if (keys.left) { this.target.x -= speed; isMoving = true; }
            if (keys.right) { this.target.x += speed; isMoving = true; }
            if (keys.up) { this.target.y -= speed; isMoving = true; }
            if (keys.down) { this.target.y += speed; isMoving = true; }
        }
        this.target.x = Math.max(0, Math.min(340, this.target.x)); 
        this.target.y = Math.max(0, Math.min(240, this.target.y));
        
        let maxDist = 20 * 14; 
        let dx = this.target.x - this.core.x; let dy = this.target.y - this.core.y;
        let d = Math.hypot(dx, dy);
        if (d > maxDist) { this.target.x = this.core.x + (dx / d) * maxDist; this.target.y = this.core.y + (dy / d) * maxDist; }
        for (let i = 0; i < 3; i++) this.updateIK();

        let isMeteorMax = (this.lv.meteor >= 3.0); 

        // --- 右手とUI、オルゴール、封印破壊の判定 ---
        let touchHandled = false;
        if (typeof pointer !== 'undefined') {
            if (pointer.active && !this.prevPointerActive) {
                let px = pointer.x, py = pointer.y;
                
                // 【新タスク】聖なる封印（魔法陣）のタップ破壊判定
                if (this.st === 'play') {
                    for (let i = this.holySeals.length - 1; i >= 0; i--) {
                        let seal = this.holySeals[i];
                        if (Math.hypot(px - seal.x, py - seal.y) < 35) {
                            seal.hp--;
                            if (typeof playSnd !== 'undefined') playSnd('sel');
                            this.vfx.push({ type: 'spark', x: px, y: py, vx: Math.random()*4-2, vy: Math.random()*4-2, life: 10, maxLife: 10, color: '#0ff' });
                            if (seal.hp <= 0) {
                                this.vfx.push({ type: 'text', text: 'SEAL BROKEN!', x: seal.x - 30, y: seal.y, life: 30, color: '#fff' });
                                this.score += 20; // 破壊スコア
                                this.holySeals.splice(i, 1);
                                if (typeof playSnd !== 'undefined') playSnd('hit');
                            }
                            pointer.path = []; touchHandled = true;
                            break; 
                        }
                    }
                }

                if (!touchHandled) {
                    if (px < 60 && py < 60) {
                        this.winding = true; pointer.path = [];
                    } else if (this.st === 'play' && px > 340 && py > 190) {
                        this.st = 'shop'; pointer.path = [];
                        if(typeof playSnd !== 'undefined') playSnd('combo');
                    } else if (this.st === 'shop') {
                        if (px > 60 && px < 340 && py > 40 && py < 200) {
                            let btnY = Math.floor((py - 50) / 30);
                            if (btnY === 0 && this.soul >= 30) {
                                this.soul -= 30; this.eyes.push({ x: this.core.x + 30 + Math.random()*20, y: this.core.y - 80 + Math.random()*160, tmr: 0 });
                                if(typeof playSnd !== 'undefined') playSnd('combo');
                            } else if (btnY === 1 && this.soul >= 40) {
                                this.soul -= 40; this.coreMaxHp += 20; this.coreHp = Math.min(this.coreMaxHp, this.coreHp + 50);
                                if(typeof playSnd !== 'undefined') playSnd('combo');
                            } else if (btnY === 2 && this.soul >= 50) {
                                this.soul -= 50; this.lv.tentacle += 0.5;
                                if(typeof playSnd !== 'undefined') playSnd('combo');
                            } else if (btnY === 3 && this.soul >= 80) { 
                                this.soul -= 80; this.addTentacle();
                                if(typeof playSnd !== 'undefined') playSnd('combo');
                            } else if (btnY === 4 && !isMeteorMax && this.soul >= 50) { 
                                this.soul -= 50; this.lv.meteor += 0.5;
                                if(typeof playSnd !== 'undefined') playSnd('combo');
                            }
                        }
                        if (px > 150 && px < 250 && py > 200 && py < 230) {
                            this.st = 'play'; pointer.path = [];
                            if(typeof playSnd !== 'undefined') playSnd('sel');
                        }
                        pointer.path = []; 
                    }
                }
            }
            
            if (!pointer.active) this.winding = false; 
            
            if (!this.winding && !pointer.active && this.prevPointerActive && this.st === 'play' && pointer.path.length > 0) {
                let g = this.recognizeGesture(pointer.path);
                if (g) {
                    let cx = 0, cy = 0;
                    for(let p of pointer.path) { cx += p.x; cy += p.y; }
                    cx /= pointer.path.length; cy /= pointer.path.length;
                    this.spawnMagic(g, cx, cy);
                }
            }
            this.prevPointerActive = pointer.active;
        }

        // --- 妨害兵（ジャマー）によるオルゴール減衰ペナルティ ---
        let jammerCount = this.enemies.filter(e => e.type === 'jammer').length;
        let drainRate = 0.05 + (0.05 * jammerCount); // ジャマーがいると減りが倍速！

        if (this.winding) {
            this.musicBox = Math.min(100, this.musicBox + 0.6);
            if (this.tmr % 5 < 1 && typeof playSnd !== 'undefined') playSnd('sel'); 
        } else {
            this.musicBox -= drainRate * ts; 
        }
        
        if (this.musicBox <= 0 && this.coreHp > 0) {
            this.coreHp = 0;
            this.vfx.push({ type: 'text', text: 'MIND CRUSHED...', x: 130, y: 120, life: 180, color: '#f00' });
            if (typeof screenShake !== 'undefined') screenShake(20);
        }

        // --- 聖なる封印（勇者の干渉）の生成と発動 ---
        let diff = 1 + (this.tmr / 1200); 
        if (Math.random() < (0.003 * diff * ts) && this.holySeals.length < 3) {
            this.holySeals.push({ x: 100 + Math.random()*200, y: 30 + Math.random()*180, life: 600, maxLife: 600, hp: 3 });
        }
        
        for (let i = this.holySeals.length - 1; i >= 0; i--) {
            let s = this.holySeals[i];
            s.life -= ts;
            if (s.life <= 0) {
                // 封印完成（大ダメージ＆オルゴール激減！）
                this.coreHp -= 20;
                this.musicBox -= 30;
                this.vfx.push({ type: 'explosion', x: s.x, y: s.y, size: 100, life: 30, maxLife: 30 });
                this.vfx.push({ type: 'text', text: 'HOLY JUDGMENT!', x: s.x - 50, y: s.y - 30, life: 60, color: '#0ff' });
                if (typeof playSnd !== 'undefined') playSnd('hit');
                if (typeof screenShake !== 'undefined') screenShake(15);
                this.holySeals.splice(i, 1);
            }
        }

        // --- 敵の生成（怒涛のラッシュ対応） ---
        let spawnRate = 0.02 * diff * ts;
        if (this.tmr > 3600) spawnRate += 0.02; // ラッシュ
        if (this.tmr > 7200) spawnRate += 0.04; // 絶望ラッシュ

        if (Math.random() < spawnRate) {
            let r = Math.random();
            let eType = 'normal';
            let eHp = 15, eAtk = 2, eSpeed = 0.5 + Math.random();
            
            if (r < 0.1) {
                eType = 'boss'; eHp = 1000; eAtk = 15; eSpeed = 0.3;
                this.vfx.push({ type: 'text', text: '!! BOSS INCOMING !!', x: 160, y: 100, life: 120, color: '#f00' });
                // 8-direction bullet burst on spawn
                for (let d = 0; d < 8; d++) {
                    let ang = d * Math.PI / 4;
                    this.enemyProjectiles.push({ x: 400, y: 120, vx: Math.cos(ang)*3.5, vy: Math.sin(ang)*3.5, life: 100 });
                }
            }
            else if (r < 0.25) { eType = 'archer'; eHp = 10; eSpeed = 0.6; }
            else if (r < 0.35) { eType = 'jammer'; eHp = 20; eSpeed = 0.8; }

            this.enemies.push({
                x: 420, y: 20 + Math.random() * 200,
                speed: eSpeed * (1 + diff * 0.1),
                hp: eHp * diff, maxHp: eHp * diff,
                atk: eAtk * diff, type: eType, hitCd: 0
            });
        }

        // --- 邪眼の射撃 ---
        for (let t of this.eyes) {
            t.tmr += ts;
            if (t.tmr > 60 && this.enemies.length > 0) {
                let target = this.enemies[0]; let minDist = 999;
                for (let e of this.enemies) {
                    let d = Math.hypot(e.x - t.x, e.y - t.y);
                    if (d < minDist) { minDist = d; target = e; }
                }
                let angle = Math.atan2(target.y - t.y, target.x - t.x);
                this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle)*6, vy: Math.sin(angle)*6, life: 60 });
                t.tmr = 0;
            }
        }

        // 邪眼の弾の当たり判定
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.x += p.vx * ts; p.y += p.vy * ts; p.life -= ts;
            let hit = false;
            for (let e of this.enemies) {
                if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 15) {
                    e.hp -= 3; 
                    this.vfx.push({ type: 'spark', x: p.x, y: p.y, vx: Math.random()*2-1, vy: Math.random()*2-1, life: 10, maxLife: 10, color: '#f00' });
                    hit = true; break;
                }
            }
            if (hit || p.life <= 0) this.projectiles.splice(i, 1);
        }

        // --- 遠距離兵の矢（敵の攻撃）の処理 ---
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            let p = this.enemyProjectiles[i];
            p.x += p.vx * ts; p.y += p.vy * ts; p.life -= ts;
            let hit = false;

            // シールドで弾くか
            let maxRings = Math.min(3, Math.ceil(this.shieldTmr / 180));
            let shieldRadius = 50 + maxRings * 15; 
            if (this.shieldTmr > 0 && Math.hypot(p.x - this.core.x, p.y - this.core.y) < shieldRadius) {
                hit = true;
                this.vfx.push({ type: 'spark', x: p.x, y: p.y, vx: -p.vx, vy: -p.vy, life: 10, maxLife: 10, color: '#0ff' });
            } 
            // コアに当たったか
            else if (Math.hypot(p.x - this.core.x, p.y - this.core.y) < 25) {
                hit = true;
                this.coreHp -= 5;
                if (typeof screenShake !== 'undefined') screenShake(3);
                if (typeof playSnd !== 'undefined') playSnd('hit');
            }

            // 触手で弾き落とせるか（パッシブ防御）
            if (!hit) {
                for (let t of this.tentacles) {
                    for (let seg of t.segments) {
                        if (Math.hypot(p.x - seg.x, p.y - seg.y) < 15) {
                            hit = true; this.vfx.push({ type: 'spark', x: p.x, y: p.y, vx: 0, vy: 0, life: 5, maxLife: 5, color: '#fff' });
                            break;
                        }
                    }
                    if(hit) break;
                }
            }

            if (hit || p.life <= 0) this.enemyProjectiles.splice(i, 1);
        }

        // --- 敵の当たり判定と移動 ---
        for (let e of this.enemies) {
            if (e.hp <= 0) continue;
            let coreAngle = Math.atan2(this.core.y - e.y, this.core.x - e.x);

            // ① 触手の超ノックバック物理攻撃
            if (isMoving && e.hitCd <= 0) {
                let hit = false;
                for (let t of this.tentacles) {
                    for (let i = 0; i < t.num; i++) {
                        let seg = t.segments[i];
                        if (Math.hypot(e.x - seg.x, e.y - seg.y) < (e.type === 'boss' ? 25 : 15)) {
                            e.hp -= (2 * this.lv.tentacle); 
                            e.hitCd = 10; 
                            // ★ ノックバック大幅強化（ボスは重い）
                            let kb = e.type === 'boss' ? 3 : 25;
                            e.x -= Math.cos(coreAngle) * kb; e.y -= Math.sin(coreAngle) * kb;
                            this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: Math.random()*4-2, vy: Math.random()*4-2, life: 10, maxLife: 10, color: '#fff' });
                            hit = true; break;
                        }
                    }
                    if (hit) break; 
                }
            }

            // ② メテオ
            for (let v of this.vfx) {
                if (v.type === 'explosion' && v.life > v.maxLife - 2) { 
                    if (Math.hypot(e.x - v.x, e.y - v.y) < v.size) { 
                        e.hp -= 20 * this.lv.meteor; e.x -= Math.cos(coreAngle) * (e.type==='boss'?5:25); 
                    } 
                }
            }

            // ③ 眷属
            for (let s of this.swarms) {
                if (s.life <= 0) continue;
                let dist = Math.hypot(e.x - s.x, e.y - s.y);
                if (dist < 15) {
                    e.hp -= 8; s.life = 0; 
                    this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: 0, vy: -2, life: 10, maxLife: 10, color: '#f00' });
                } else if (dist < 100) {
                    s.vx += (e.x - s.x) * 0.05 * ts; s.vy += (e.y - s.y) * 0.05 * ts; 
                }
            }

            // ④ シールド弾き
            let maxRings = Math.min(3, Math.ceil(this.shieldTmr / 180));
            let shieldRadius = 50 + maxRings * 15; 
            let distToCore = Math.hypot(e.x - this.core.x, e.y - this.core.y);
            
            if (this.shieldTmr > 0 && distToCore < shieldRadius) {
                e.x = this.core.x - Math.cos(coreAngle) * shieldRadius;
                e.y = this.core.y - Math.sin(coreAngle) * shieldRadius;
                e.hp -= 2 * ts; 
                if (Math.random() < 0.2) this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: 0, vy: 0, life: 5, maxLife: 5, color: '#0ff' });
            } 
            else if (distToCore < 30) {
                this.coreHp -= e.atk; e.hp -= 50; // ボス以外は特攻自爆
                if (typeof screenShake !== 'undefined') screenShake(6);
                if (typeof playSnd !== 'undefined') playSnd('hit');
            }
        }

        // --- 敵の行動と死亡処理 ---
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            if (e.hp <= 0) {
                if (this.coreHp > 0) { 
                    this.score += (e.type === 'boss' ? 100 : 10);
                    this.soul += (e.type === 'boss' ? 20 : 2); 
                }
                this.vfx.push({ type: 'explosion', x: e.x, y: e.y, size: e.type === 'boss' ? 60 : 20, life: 10, maxLife: 10 });
                if (typeof playSnd !== 'undefined') playSnd('hit');
                this.enemies.splice(i, 1);
            } else {
                // 遠距離兵の特殊行動（止まって撃つ）
                if (e.type === 'archer' && Math.hypot(this.core.x - e.x, this.core.y - e.y) < 220) {
                    if (Math.random() < 0.02 * ts) { // 矢を放つ
                        let angle = Math.atan2(this.core.y - e.y, this.core.x - e.x);
                        this.enemyProjectiles.push({x: e.x, y: e.y, vx: Math.cos(angle)*4, vy: Math.sin(angle)*4, life: 120});
                    }
                } else {
                    let angle = Math.atan2(this.core.y - e.y, this.core.x - e.x);
                    e.x += Math.cos(angle) * e.speed * ts;
                    e.y += Math.sin(angle) * e.speed * ts;
                }
                if (e.hitCd > 0) e.hitCd -= ts;
            }
        }

        // ゲームオーバー判定
        if (this.coreHp <= 0 && this.st === 'play') {
            this.st = 'gameover';
            this.tmr = 0;
            this.stopDespairBGM();
            for(let i=0; i<15; i++) {
                this.vfx.push({ type: 'explosion', x: this.core.x + (Math.random()-0.5)*80, y: this.core.y + (Math.random()-0.5)*80, size: 60, life: 20+Math.random()*30, maxLife: 50 });
            }
            if (typeof playSnd !== 'undefined') playSnd('hit');
            if (typeof SaveSys !== 'undefined') SaveSys.addLog('ｱﾋﾞｽ･ｼﾞｪﾈﾗﾙ', `魔将陥落… SCORE: ${this.score}`);
        }

        this.updateVFX(ts);

        // Wave counter
        if (this.tmr % 600 === 0 && this.st === 'play') this.wave++;

        // Bubble animation
        for (let b of this.bubbles) {
            b.y -= b.spd * ts; b.x += Math.sin(b.y * 0.05) * 0.4;
            if (b.y < -10) { b.y = 250; b.x = Math.random() * 400; }
        }
    },
    
    updateVFX(ts) {
        for (let i = this.vfx.length - 1; i >= 0; i--) {
            let v = this.vfx[i];
            v.life -= ts;
            if (v.type === 'meteor') {
                v.x += (v.tx - v.x) * 0.2 * ts; v.y += (v.ty - v.y) * 0.2 * ts;
                if (Math.floor(v.life) % 2 === 0) this.vfx.push({ type: 'spark', x: v.x + (Math.random()-0.5)*20, y: v.y + (Math.random()-0.5)*20, vx: 0, vy: -1, life: 15, maxLife: 15, color: '#fa0' });
            } else if (v.type === 'spark') {
                v.x += v.vx * ts; v.y += v.vy * ts;
            } else if (v.type === 'text') { v.y -= 0.5 * ts; }
            
            if (v.life <= 0) {
                if (v.type === 'meteor') {
                    this.vfx.push({ type: 'explosion', x: v.tx, y: v.ty, size: 80 * this.lv.meteor, life: 20, maxLife: 20 });
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                    if (typeof screenShake !== 'undefined') screenShake(8);
                }
                this.vfx.splice(i, 1);
            }
        }

        for (let i = this.swarms.length - 1; i >= 0; i--) {
            let s = this.swarms[i];
            s.vx *= 0.95; s.vy *= 0.95; 
            s.x += s.vx * ts; s.y += (s.vy + Math.sin(s.life * 0.2) * 2) * ts;
            s.life -= ts;
            if (s.life <= 0 || s.x > 400 || s.x < 0) this.swarms.splice(i, 1);
        }
    },
    
    // === 高品質コア描画 (宝石/結晶 + 16角形トゲ付き輪郭) ===
    drawCore() {
        let cx = this.core.x, cy = this.core.y;
        let pulse = (Math.sin(this.tmr * 0.08) + 1) / 2;
        let cr = 30 + Math.sin(this.tmr * 0.1) * 4;
        let spikeBase = cr + 5;
        let spikeLen = 8 + pulse * 6; // 脈動でトゲ伸縮

        // ① 外殻: 16角形のトゲ付き輪郭
        ctx.save();
        ctx.shadowBlur = 18 + pulse * 12; ctx.shadowColor = '#f00';
        let spikes = 16;
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            let ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
            let r = (i % 2 === 0) ? spikeBase + spikeLen : spikeBase - 4;
            ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
        }
        ctx.closePath();
        let outerGrad = ctx.createRadialGradient(cx, cy, cr * 0.5, cx, cy, spikeBase + spikeLen);
        outerGrad.addColorStop(0, `rgba(255,80,0,${0.5 + pulse * 0.3})`);
        outerGrad.addColorStop(0.6, `rgba(180,0,0,${0.3 + pulse * 0.2})`);
        outerGrad.addColorStop(1, 'rgba(80,0,0,0.1)');
        ctx.fillStyle = outerGrad;
        ctx.fill();
        ctx.strokeStyle = `hsl(${10 + pulse * 20},100%,${40 + pulse * 20}%)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // ② 基本脈動円 (グラデーション)
        ctx.save();
        ctx.shadowBlur = 20 + pulse * 15; ctx.shadowColor = '#f00';
        let cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, cr);
        cg.addColorStop(0, `hsl(60,100%,${70 + pulse * 20}%)`);
        cg.addColorStop(0.2, `hsl(20,100%,${55 + pulse * 10}%)`);
        cg.addColorStop(0.5, `hsl(0,100%,${40 + pulse * 10}%)`);
        cg.addColorStop(1, `hsl(0,80%,${20 + pulse * 5}%)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // ③ 中心: 正八角形に近い宝石/結晶ドット絵 (hslグラデーション)
        ctx.save();
        ctx.translate(cx, cy);
        let sz = 12; // 半径12の結晶
        // 6色グラデーション (内側から外側へ)
        let colors = [
            `hsl(60,100%,90%)`,   // 白黄 (中心ハイライト)
            `hsl(30,100%,75%)`,   // 淡橙
            `hsl(10,100%,60%)`,   // 橙赤
            `hsl(0,100%,50%)`,    // 赤
            `hsl(340,80%,35%)`,   // 暗赤
            `hsl(320,60%,20%)`,   // 深紫
        ];
        // 正八角形を同心円状に塗る
        for (let ci = colors.length - 1; ci >= 0; ci--) {
            let r2 = sz * (ci + 1) / colors.length;
            ctx.fillStyle = colors[ci];
            ctx.beginPath();
            for (let j = 0; j < 8; j++) {
                let a = (j / 8) * Math.PI * 2 - Math.PI / 8;
                let px = Math.cos(a) * r2, py = Math.sin(a) * r2;
                j === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill();
        }
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(-2, -4, 2, 2);
        ctx.fillRect(-1, -5, 1, 1);

        // ④ 中心の暗い核
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        // 内側グロー
        ctx.strokeStyle = `rgba(255,100,0,${0.4 + pulse * 0.4})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, 0, sz * 0.55, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.restore();
    },

    // === 高品質敵描画 (眼球/触手モンスター) ===
    drawAbyssEnemy(e) {
        let ex = e.x, ey = e.y;
        ctx.translate(ex, ey);
        let isBoss = (e.type === 'boss');
        let sz = isBoss ? 12 : 8; // 半径 (boss:24x24, normal:16x16)

        // HPバー
        let bw = isBoss ? 24 : 16;
        let bary = -(sz + (isBoss ? 16 : 10));
        ctx.fillStyle = '#400';
        ctx.fillRect(-bw/2, bary, bw, 3);
        ctx.fillStyle = '#f00';
        ctx.fillRect(-bw/2, bary, bw * Math.max(0, e.hp / e.maxHp), 3);

        if (isBoss) {
            // === ボス: 24×24, 複数の目 ===
            // 体 (暗紫/黒)
            ctx.fillStyle = '#1a0030';
            ctx.fillRect(-sz, -sz, sz*2, sz*2);
            ctx.fillStyle = '#2d0050';
            ctx.fillRect(-sz+1, -sz+1, sz*2-2, sz*2-2);
            // 触手 x4方向
            ctx.strokeStyle = '#600080'; ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
                let ang = (i / 4) * Math.PI * 2;
                let len = sz + 8 + Math.sin(this.tmr * 0.08 + i) * 3;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * (sz - 1), Math.sin(ang) * (sz - 1));
                ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
                ctx.stroke();
                // 触手先端の球
                ctx.fillStyle = '#800080';
                ctx.beginPath();
                ctx.arc(Math.cos(ang) * len, Math.sin(ang) * len, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            // 目 x3
            let eyeData = [[-4, -4, 3], [4, -4, 3], [0, 2, 2]];
            for (let [ex2, ey2, er] of eyeData) {
                ctx.fillStyle = '#f00';
                ctx.beginPath(); ctx.arc(ex2, ey2, er, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#800';
                ctx.beginPath(); ctx.arc(ex2, ey2, er * 0.6, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(ex2 + 0.5, ey2, er * 0.3, 0, Math.PI * 2); ctx.fill();
                // 白ハイライト
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillRect(ex2 - er + 1, ey2 - er + 1, 1, 1);
            }
            // 輪郭
            ctx.shadowBlur = 10; ctx.shadowColor = '#f0f';
            ctx.strokeStyle = '#a0f'; ctx.lineWidth = 1.5;
            ctx.strokeRect(-sz, -sz, sz*2, sz*2);
            ctx.shadowBlur = 0;

        } else {
            // === 通常敵: 16×16 眼球/触手モンスター ===
            // 体の色 (typeで変える)
            let bodyCol, eyeCol;
            if (e.type === 'archer')      { bodyCol = '#003300'; eyeCol = '#00ff44'; }
            else if (e.type === 'jammer') { bodyCol = '#2d002d'; eyeCol = '#ff44ff'; }
            else                          { bodyCol = '#1a1a2e'; eyeCol = '#ff2200'; }

            // 体
            ctx.fillStyle = bodyCol;
            ctx.fillRect(-sz, -sz, sz*2, sz*2);
            ctx.fillStyle = bodyCol === '#1a1a2e' ? '#252550' : bodyCol;
            ctx.fillRect(-sz+1, -sz+1, sz*2-2, sz*2-2);

            // 触手 x4方向 (短め)
            let tentCol = e.type === 'jammer' ? '#800080' : (e.type === 'archer' ? '#005500' : '#333366');
            ctx.strokeStyle = tentCol; ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                let ang = (i / 4) * Math.PI * 2;
                let len = sz + 4 + Math.sin(this.tmr * 0.1 + i * 1.5) * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(ang) * (sz - 1), Math.sin(ang) * (sz - 1));
                ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
                ctx.stroke();
            }

            // 大きな目 (中央)
            let eyeR = sz * 0.55;
            ctx.fillStyle = eyeCol;
            ctx.beginPath(); ctx.arc(0, 0, eyeR, 0, Math.PI * 2); ctx.fill();
            // 虹彩
            ctx.fillStyle = e.type === 'archer' ? '#006600' : '#8b0000';
            ctx.beginPath(); ctx.arc(0, 0, eyeR * 0.7, 0, Math.PI * 2); ctx.fill();
            // 瞳孔
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(0.5, 0, eyeR * 0.35, 0, Math.PI * 2); ctx.fill();
            // 白ハイライト
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(-eyeR + 1, -eyeR + 1, 2, 2);

            // ジャマー: 妨害オーラ
            if (e.type === 'jammer') {
                ctx.strokeStyle = `rgba(255,0,255,${0.3 + Math.sin(this.tmr * 0.2) * 0.3})`;
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, sz + 5, 0, Math.PI * 2); ctx.stroke();
            }

            ctx.strokeStyle = eyeCol.replace(')', ',0.5)').replace('rgb', 'rgba');
            ctx.lineWidth = 1;
            ctx.strokeRect(-sz, -sz, sz*2, sz*2);
        }
    },

    draw() {
        // Deep abyss background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 240);
        bgGrad.addColorStop(0, '#0a0015'); bgGrad.addColorStop(0.5, '#100020'); bgGrad.addColorStop(1, '#050008');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 400, 240);

        // Bubble particles
        ctx.strokeStyle = 'rgba(100,80,180,0.35)'; ctx.lineWidth = 0.8;
        for (let b of this.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.stroke(); }
        ctx.lineWidth = 1;

        // 聖なる封印（魔法陣）
        for (let s of this.holySeals) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + Math.sin(this.tmr*0.2)*0.5})`;
            ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.beginPath(); ctx.arc(s.x, s.y, 25 * (s.life/s.maxLife), 0, Math.PI*2); ctx.stroke();
            
            ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
            ctx.fillText(`TAP x${s.hp}`, s.x - 18, s.y + 4);
            ctx.shadowBlur = 0;
        }

        // 邪眼
        for(let e of this.eyes) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI*2); ctx.fill(); 
            let target = this.enemies[0] || {x: 400, y: 120}; let minDist = 999;
            for(let en of this.enemies) { let d = Math.hypot(en.x - e.x, en.y - e.y); if(d < minDist) { minDist = d; target = en; } }
            let angle = Math.atan2(target.y - e.y, target.x - e.x);
            ctx.fillStyle = '#a00';
            ctx.beginPath(); ctx.arc(e.x + Math.cos(angle)*4, e.y + Math.sin(angle)*4, 4, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.fillStyle = '#f00';
        for(let p of this.projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); }

        ctx.fillStyle = '#0f0'; // 敵の矢（緑）
        for(let p of this.enemyProjectiles) {
            ctx.fillRect(p.x-4, p.y-2, 8, 4);
        }

        // 敵の描画（種類別高品質ドット絵）
        for (let e of this.enemies) {
            ctx.save();
            this.drawAbyssEnemy(e);
            ctx.restore();
        }

        ctx.fillStyle = '#f00';
        for(let s of this.swarms) { ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI*2); ctx.fill(); }

        for (let t of this.tentacles) {
            let segs = t.segments;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath(); ctx.moveTo(segs[0].x, segs[0].y);
            for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
            ctx.strokeStyle = '#000'; ctx.lineWidth = 20; ctx.stroke();
            
            ctx.beginPath(); ctx.moveTo(segs[0].x, segs[0].y);
            for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
            ctx.strokeStyle = '#d0f'; ctx.lineWidth = 6; ctx.shadowBlur = 15; ctx.shadowColor = '#d0f'; ctx.stroke(); ctx.shadowBlur = 0;
            
            let tip = segs[segs.length - 1]; let preTip = segs[segs.length - 2];
            let angle = Math.atan2(tip.y - preTip.y, tip.x - preTip.x);
            ctx.fillStyle = '#fff'; ctx.beginPath();
            ctx.moveTo(tip.x + Math.cos(angle - Math.PI/2)*8, tip.y + Math.sin(angle - Math.PI/2)*8);
            ctx.lineTo(tip.x + Math.cos(angle)*25, tip.y + Math.sin(angle)*25);
            ctx.lineTo(tip.x + Math.cos(angle + Math.PI/2)*8, tip.y + Math.sin(angle + Math.PI/2)*8);
            ctx.fill();
        }

        if (this.shieldTmr > 0) {
            let maxRings = Math.min(3, Math.ceil(this.shieldTmr / 180));
            ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            for (let i = 0; i < maxRings; i++) {
                let alpha = Math.min(1, (this.shieldTmr - i * 180) / 180);
                if (alpha <= 0) continue;
                ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                let sr = 50 + (i + 1) * 15;
                ctx.beginPath(); ctx.arc(this.core.x, this.core.y, sr, this.tmr*0.1 + i, this.tmr*0.1 + i + Math.PI*1.5); ctx.stroke();
                ctx.beginPath(); ctx.arc(this.core.x, this.core.y, sr + 15, -this.tmr*0.05 - i, -this.tmr*0.05 - i + Math.PI*1.5); ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        if (this.coreHp > 0) {
            ctx.save();
            this.drawCore();
            ctx.restore();
        }

        ctx.globalCompositeOperation = 'lighter';
        for(let v of this.vfx) {
            if (v.type === 'meteor') {
                ctx.fillStyle = '#f80'; ctx.beginPath(); ctx.arc(v.x, v.y, 15, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(v.x, v.y, 8, 0, Math.PI*2); ctx.fill();
            } else if (v.type === 'spark') {
                ctx.fillStyle = v.color || `rgba(255, 100, 0, ${v.life/v.maxLife})`;
                ctx.beginPath(); ctx.arc(v.x, v.y, 4, 0, Math.PI*2); ctx.fill();
            } else if (v.type === 'explosion') {
                ctx.fillStyle = `rgba(255, 50, 0, ${v.life/v.maxLife})`;
                ctx.beginPath(); ctx.arc(v.x, v.y, v.size * (1 - v.life/v.maxLife), 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
        for(let v of this.vfx) {
            if (v.type === 'text') {
                ctx.fillStyle = v.color || '#0ff'; ctx.font = 'bold 16px monospace';
                ctx.globalAlpha = Math.max(0, v.life / 60); ctx.fillText(v.text, v.x, v.y); ctx.globalAlpha = 1.0;
            }
        }

        if (!this.winding && this.st === 'play' && typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 1) {
            // ファイヤーエフェクト風グラデーション線: 始点=白, 終点=暗赤->透明
            let path = pointer.path;
            let n = path.length;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            for (let i = 1; i < n; i++) {
                let t = i / (n - 1); // 0=始点(白), 1=終点(暗赤)
                let r = Math.floor(255);
                let g = Math.floor(255 * (1 - t) * 0.8);
                let b = Math.floor(255 * (1 - t) * 0.5);
                let a = (1 - t * 0.85) * 0.9;
                let lw = 4 * (1 - t * 0.7) + 0.5;
                ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
                ctx.lineWidth = lw;
                ctx.shadowBlur = 10 * (1 - t * 0.7);
                ctx.shadowColor = `rgba(255,${Math.floor(140*(1-t))},0,0.8)`;
                ctx.beginPath();
                ctx.moveTo(path[i-1].x, path[i-1].y);
                ctx.lineTo(path[i].x, path[i].y);
                ctx.stroke();
            }
            ctx.shadowBlur = 0; ctx.lineWidth = 1;
        }

        if (this.st === 'title') {
            // Semi-transparent overlay (tentacles visible behind)
            ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,400,240);
            ctx.shadowBlur = 28; ctx.shadowColor = '#f00';
            ctx.fillStyle = '#f44'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
            ctx.fillText('ABYSS GENERAL', 200, 95);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#c8a'; ctx.font = 'bold 13px monospace';
            ctx.fillText('- 深 淵 の 魔 将 v2 -', 200, 118);
            ctx.fillStyle = '#555'; ctx.font = '10px monospace';
            ctx.fillText('DRAW GESTURES TO COMMAND', 200, 150);
            if (this.tmr % 60 < 30) {
                ctx.shadowBlur = 10; ctx.shadowColor = '#0f0';
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 15px monospace';
                ctx.fillText('TAP TO START', 200, 200);
                ctx.shadowBlur = 0;
            }
            ctx.textAlign = 'left';
        } 
        else if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, 400, 240);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 40px monospace';
            ctx.fillText('GAME OVER', 100, 100);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, 130, 140);
            if (this.tmr > 60) {
                ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
                ctx.fillText('TAP TO RETURN', 150, 200);
            }
        }
        else {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace';
            ctx.fillText('HP:'+Math.floor(this.coreHp)+'/'+this.coreMaxHp, 70, 20);
            ctx.fillStyle = '#ff0'; ctx.fillText('SOUL:'+this.soul, 170, 20);
            ctx.fillStyle = '#fff'; ctx.fillText('SCORE:'+this.score, 250, 20);
            ctx.fillStyle = '#f8a'; ctx.fillText('W'+this.wave, 360, 20);

            // ジャマー影響時はオルゴールUIを紫に点滅
            let hasJammer = this.enemies.some(e => e.type === 'jammer');
            ctx.fillStyle = hasJammer && this.tmr % 10 < 5 ? '#505' : '#421'; 
            ctx.fillRect(10, 10, 40, 40); 
            ctx.fillStyle = '#210'; ctx.fillRect(15, 15, 30, 30); 
            ctx.fillStyle = this.musicBox < 20 ? '#f00' : '#0a0';
            ctx.fillRect(15, 45, 30, -(this.musicBox / 100) * 30); 
            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('WIND!', 18, 55);
            if (this.winding) {
                ctx.fillStyle = '#ff0'; ctx.font = '12px monospace';
                ctx.fillText('♪', 25 + Math.random()*5, 10 + Math.random()*5);
            }

            if (this.st === 'shop') {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, 400, 240);
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
                ctx.fillText('-- CHRONO UPGRADE --', 110, 30);
                
                let isMeteorMax = (this.lv.meteor >= 3.0); 
                
                let items = [
                    { name: '邪眼召喚', cost: 30, desc: '血を吐く目玉を置く' },
                    { name: 'コア修復＆HP↑', cost: 40, desc: 'HP回復＆最大値UP' },
                    { name: '触手火力UP', cost: 50, desc: '触手のダメージ増加' },
                    { name: '触手分裂', cost: 80, desc: '触手の本数が増加' },
                    { name: 'メテオ巨大化', cost: isMeteorMax ? 'MAX' : 50, desc: '爆発の範囲と威力UP(最大Lv3)' } 
                ];
                
                for (let i = 0; i < items.length; i++) {
                    let y = 50 + i * 30;
                    let canBuy = (items[i].cost !== 'MAX' && this.soul >= items[i].cost);
                    ctx.fillStyle = canBuy ? '#00a' : '#333';
                    ctx.fillRect(80, y, 240, 25);
                    ctx.strokeStyle = canBuy ? '#0ff' : '#555';
                    ctx.strokeRect(80, y, 240, 25);
                    
                    ctx.fillStyle = canBuy ? '#fff' : '#888';
                    ctx.font = '12px monospace';
                    ctx.fillText(items[i].name, 85, y + 17);
                    ctx.fillStyle = canBuy ? '#ff0' : '#888';
                    let costText = items[i].cost === 'MAX' ? '[MAX]' : `${items[i].cost} 魂`;
                    ctx.fillText(costText, 280, y + 17);
                }
                
                ctx.fillStyle = '#a00'; ctx.fillRect(150, 200, 100, 30);
                ctx.fillStyle = '#fff'; ctx.fillText('CLOSE', 180, 220);
                
            } else {
                ctx.fillStyle = '#00a'; ctx.fillRect(340, 190, 60, 50);
                ctx.strokeStyle = '#0ff'; ctx.strokeRect(340, 190, 60, 50);
                ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace';
                ctx.fillText('SHOP', 352, 215);
                ctx.font = '10px monospace'; ctx.fillText('(SLOW)', 352, 230);
            }
        }

    }
};
