// === ABYSS GENERAL (FINAL: Ultimate Edition - Fixed) ===
const Abyss = {
    st: 'title', // title, play, shop, gameover
    tmr: 0,
    core: { x: 40, y: 120 },
    target: { x: 150, y: 120 },
    tentacles: [], 
    
    prevPointerActive: false,
    winding: false, 
    musicBox: 100,  
    
    vfx: [], shieldTmr: 0, swarms: [], eyes: [], projectiles: [], enemies: [],
    
    coreHp: 100, coreMaxHp: 100, score: 0, soul: 0,
    lv: { tentacle: 1, meteor: 1, swarm: 1 },
    
    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400; canvas.height = 240;
        
        this.st = 'title';
        this.tmr = 0;
        
        // タイトル画面用のデモ触手
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

    startGame() {
        this.st = 'play';
        this.tmr = 0; 
        this.vfx = []; this.shieldTmr = 0; this.swarms = [];
        this.eyes = []; this.projectiles = []; this.enemies = []; 
        this.coreHp = 100; this.coreMaxHp = 100; this.score = 0; this.soul = 0;
        this.lv = { tentacle: 1, meteor: 1, swarm: 1 };
        this.musicBox = 100; this.winding = false;
        
        this.tentacles = [];
        this.addTentacle();
        this.target = { x: 150, y: 120 };
        
        if (typeof pointer !== 'undefined') pointer.path = [];
        if (typeof BGM !== 'undefined') BGM.play('action');
        if (typeof playSnd !== 'undefined') playSnd('combo');
    },
    
    addTentacle() {
        let idx = this.tentacles.length;
        let offsets = [{x:0, y:0}, {x:0, y:-20}, {x:0, y:20}, {x:-20, y:-10}, {x:-20, y:10}];
        let o = offsets[idx % 5];
        let segs = [];
        for (let i = 0; i < 20; i++) {
            segs.push({ x: this.core.x + o.x, y: this.core.y + o.y });
        }
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

            // ★ タップ または Aボタン でスタート！
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
            
            // ★ タップ または Aボタン でタイトルへ戻る！
            let tapped = (typeof pointer !== 'undefined' && pointer.active && !this.prevPointerActive);
            if (this.tmr > 60 && ((typeof keysDown !== 'undefined' && keysDown.a) || tapped)) {
                this.st = 'title';
                this.tmr = 0;
                if (typeof pointer !== 'undefined') pointer.path = [];
            }
            
            if (typeof pointer !== 'undefined') this.prevPointerActive = pointer.active;
            return;
        }

        // ==========================================
        // PLAY & SHOP STATE
        // ==========================================
        let ts = (this.st === 'shop') ? 0.2 : 1.0;
        if (this.shieldTmr > 0) this.shieldTmr -= ts;
        
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
        let dx = this.target.x - this.core.x;
        let dy = this.target.y - this.core.y;
        let d = Math.hypot(dx, dy);
        if (d > maxDist) {
            this.target.x = this.core.x + (dx / d) * maxDist;
            this.target.y = this.core.y + (dy / d) * maxDist;
        }
        for (let i = 0; i < 3; i++) this.updateIK();

        let isMeteorMax = (this.lv.meteor >= 3.0); 

        // --- 右手とUI、オルゴールの判定 ---
        if (typeof pointer !== 'undefined') {
            if (pointer.active && !this.prevPointerActive) {
                let px = pointer.x, py = pointer.y;
                
                if (px < 60 && py < 60) {
                    this.winding = true;
                    pointer.path = [];
                } 
                else if (this.st === 'play' && px > 340 && py > 190) {
                    this.st = 'shop'; pointer.path = [];
                    if(typeof playSnd !== 'undefined') playSnd('combo');
                } 
                else if (this.st === 'shop') {
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
            
            if (!pointer.active) {
                this.winding = false; 
            }
            
            if (!this.winding && !pointer.active && this.prevPointerActive && this.st === 'play') {
                if (pointer.path.length > 0) {
                    let g = this.recognizeGesture(pointer.path);
                    if (g) {
                        let cx = 0, cy = 0;
                        for(let p of pointer.path) { cx += p.x; cy += p.y; }
                        cx /= pointer.path.length; cy /= pointer.path.length;
                        this.spawnMagic(g, cx, cy);
                    }
                }
            }
            this.prevPointerActive = pointer.active;
        }

        if (this.winding) {
            this.musicBox = Math.min(100, this.musicBox + 0.6);
            if (this.tmr % 5 < 1 && typeof playSnd !== 'undefined') playSnd('sel'); 
        } else {
            this.musicBox -= 0.05 * ts; 
        }
        
        if (this.musicBox <= 0 && this.coreHp > 0) {
            this.coreHp = 0;
            this.vfx.push({ type: 'text', text: 'MIND CRUSHED...', x: 130, y: 120, life: 180, color: '#f00' });
            if (typeof screenShake !== 'undefined') screenShake(20);
        }

        let diff = 1 + (this.tmr / 1800);
        if (Math.random() < (0.02 * diff * ts)) {
            let isBig = Math.random() < 0.15;
            this.enemies.push({
                x: 420, y: 20 + Math.random() * 200,
                speed: (0.5 + Math.random()) * (isBig ? 0.4 : 1) * (1 + diff * 0.1),
                hp: (isBig ? 60 : 15) * diff, maxHp: (isBig ? 60 : 15) * diff,
                atk: (isBig ? 10 : 2) * diff, type: isBig ? 'big' : 'small', hitCd: 0
            });
        }

        for (let t of this.eyes) {
            t.tmr += ts;
            if (t.tmr > 60 && this.enemies.length > 0) {
                let target = this.enemies[0];
                let minDist = Math.hypot(target.x - t.x, target.y - t.y);
                for (let e of this.enemies) {
                    let d = Math.hypot(e.x - t.x, e.y - t.y);
                    if (d < minDist) { minDist = d; target = e; }
                }
                let angle = Math.atan2(target.y - t.y, target.x - t.x);
                this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle)*6, vy: Math.sin(angle)*6, life: 60 });
                t.tmr = 0;
                if (typeof playSnd !== 'undefined') playSnd('sel');
            }
        }

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

        for (let e of this.enemies) {
            if (e.hp <= 0) continue;
            let coreAngle = Math.atan2(this.core.y - e.y, this.core.x - e.x);

            if (isMoving && e.hitCd <= 0) {
                let hit = false;
                for (let t of this.tentacles) {
                    for (let i = 0; i < t.num; i++) {
                        let seg = t.segments[i];
                        if (Math.hypot(e.x - seg.x, e.y - seg.y) < (e.type === 'big' ? 20 : 12)) {
                            e.hp -= (1 * this.lv.tentacle); 
                            e.hitCd = 10; 
                            e.x -= Math.cos(coreAngle) * 10; e.y -= Math.sin(coreAngle) * 10;
                            this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: Math.random()*2-1, vy: Math.random()*2-1, life: 10, maxLife: 10, color: '#fff' });
                            hit = true; break;
                        }
                    }
                    if (hit) break; 
                }
            }

            for (let v of this.vfx) {
                if (v.type === 'explosion' && v.life > v.maxLife - 2) { 
                    if (Math.hypot(e.x - v.x, e.y - v.y) < v.size) { 
                        e.hp -= 15 * this.lv.meteor; e.x -= Math.cos(coreAngle) * 15; 
                    } 
                }
            }

            for (let s of this.swarms) {
                if (s.life <= 0) continue;
                let dist = Math.hypot(e.x - s.x, e.y - s.y);
                if (dist < 15) {
                    e.hp -= 5; s.life = 0; 
                    this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: 0, vy: -2, life: 10, maxLife: 10, color: '#f00' });
                } else if (dist < 100) {
                    s.vx += (e.x - s.x) * 0.03 * ts; s.vy += (e.y - s.y) * 0.03 * ts; 
                }
            }

            let maxRings = Math.min(3, Math.ceil(this.shieldTmr / 180));
            let shieldRadius = 50 + maxRings * 15; 
            let distToCore = Math.hypot(e.x - this.core.x, e.y - this.core.y);
            
            if (this.shieldTmr > 0 && distToCore < shieldRadius) {
                e.x = this.core.x - Math.cos(coreAngle) * shieldRadius;
                e.y = this.core.y - Math.sin(coreAngle) * shieldRadius;
                e.hp -= 1 * ts; 
                if (Math.random() < 0.2) this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: 0, vy: 0, life: 5, maxLife: 5, color: '#0ff' });
            } 
            else if (distToCore < 30) {
                this.coreHp -= e.atk; e.hp = 0; 
                if (typeof screenShake !== 'undefined') screenShake(6);
                if (typeof playSnd !== 'undefined') playSnd('hit');
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            if (e.hp <= 0) {
                if (this.coreHp > 0) { 
                    this.score += (e.type === 'big' ? 50 : 10);
                    this.soul += (e.type === 'big' ? 10 : 2); 
                }
                this.vfx.push({ type: 'explosion', x: e.x, y: e.y, size: e.type === 'big' ? 40 : 20, life: 10, maxLife: 10 });
                if (typeof playSnd !== 'undefined') playSnd('hit');
                this.enemies.splice(i, 1);
            } else {
                let angle = Math.atan2(this.core.y - e.y, this.core.x - e.x);
                e.x += Math.cos(angle) * e.speed * ts;
                e.y += Math.sin(angle) * e.speed * ts;
                if (e.hitCd > 0) e.hitCd -= ts;
            }
        }

        if (this.coreHp <= 0 && this.st === 'play') {
            this.st = 'gameover';
            this.tmr = 0;
            for(let i=0; i<10; i++) {
                this.vfx.push({ type: 'explosion', x: this.core.x + (Math.random()-0.5)*50, y: this.core.y + (Math.random()-0.5)*50, size: 50, life: 20+Math.random()*20, maxLife: 40 });
            }
            if (typeof BGM !== 'undefined') BGM.stop();
            if (typeof playSnd !== 'undefined') playSnd('hit');
            
            if (typeof SaveSys !== 'undefined') {
                SaveSys.addLog('ｱﾋﾞｽ･ｼﾞｪﾈﾗﾙ', `激戦の末、スコア ${this.score} で散った…`);
            }
        }

        this.updateVFX(ts);
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
    
    draw() {
        if (typeof applyShake !== 'undefined') applyShake();

        const bgGrad = ctx.createLinearGradient(0, 0, 400, 0);
        bgGrad.addColorStop(0, '#200'); bgGrad.addColorStop(1, '#001'); 
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 400, 240);

        for(let e of this.eyes) {
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(e.x, e.y, 10, 0, Math.PI*2); ctx.fill(); 
            
            let target = this.enemies[0] || {x: 400, y: 120};
            let minDist = 999;
            for(let en of this.enemies) { let d = Math.hypot(en.x - e.x, en.y - e.y); if(d < minDist) { minDist = d; target = en; } }
            let angle = Math.atan2(target.y - e.y, target.x - e.x);
            
            ctx.fillStyle = '#a00';
            ctx.beginPath(); ctx.arc(e.x + Math.cos(angle)*4, e.y + Math.sin(angle)*4, 4, 0, Math.PI*2); ctx.fill();
        }
        
        ctx.fillStyle = '#f00';
        for(let p of this.projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); }

        for (let e of this.enemies) {
            ctx.fillStyle = e.type === 'big' ? '#88f' : '#ccc';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.type === 'big' ? 15 : 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#f00'; ctx.fillRect(e.x - 10, e.y - (e.type === 'big'? 22 : 14), 20, 3);
            ctx.fillStyle = '#0f0'; ctx.fillRect(e.x - 10, e.y - (e.type === 'big'? 22 : 14), 20 * (e.hp/e.maxHp), 3);
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
            ctx.fillStyle = '#f00'; ctx.shadowBlur = 20; ctx.shadowColor = '#f00';
            ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 30 + Math.sin(this.tmr * 0.1) * 3, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 10, 0, Math.PI * 2); ctx.fill();
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

        if (!this.winding && this.st === 'play' && typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 0) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(pointer.path[0].x, pointer.path[0].y);
            for (let i = 1; i < pointer.path.length; i++) ctx.lineTo(pointer.path[i].x, pointer.path[i].y);
            ctx.stroke(); ctx.shadowBlur = 0;
        }

        if (this.st === 'title') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, 400, 240);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 30px monospace';
            ctx.shadowBlur = 20; ctx.shadowColor = '#f00';
            ctx.fillText('ABYSS GENERAL', 80, 100);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace';
            ctx.fillText('- 深 淵 の 魔 将 -', 135, 130);
            
            if (this.tmr % 60 < 30) {
                ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
                // ★ 文言を「TAP」に変更
                ctx.fillText('TAP TO START', 140, 200);
            }
        } 
        else if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(0, 0, 400, 240);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 40px monospace';
            ctx.fillText('GAME OVER', 100, 100);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace';
            ctx.fillText(`FINAL SCORE: ${this.score}`, 130, 140);
            if (this.tmr > 60) {
                ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
                // ★ 文言を「TAP」に変更
                ctx.fillText('TAP TO RETURN', 150, 200);
            }
        }
        else {
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
            ctx.fillText(`HP:${Math.floor(this.coreHp)}/${this.coreMaxHp}`, 70, 20);
            ctx.fillStyle = '#ff0'; ctx.fillText(`SOUL:${this.soul}`, 170, 20);
            ctx.fillStyle = '#fff'; ctx.fillText(`SCORE:${this.score}`, 250, 20);

            ctx.fillStyle = '#421'; ctx.fillRect(10, 10, 40, 40); 
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

        if (typeof resetShake !== 'undefined') resetShake();
    }
};
