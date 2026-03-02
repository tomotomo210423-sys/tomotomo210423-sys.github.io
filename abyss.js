// === ABYSS GENERAL (Phase 5: Ultimate Multi-tasking) ===
const Abyss = {
    st: 'play',
    tmr: 0,
    core: { x: 40, y: 120 },
    tentacle: { segments: [], num: 20, len: 14, target: { x: 150, y: 120 }, damage: 1 },
    
    prevPointerActive: false,
    vfx: [], shieldTmr: 0, swarms: [], turrets: [], projectiles: [], enemies: [],
    
    coreHp: 100, coreMaxHp: 100, score: 0,
    soul: 0, mp: 100, // ★ 新リソース：魂とマナ
    
    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400; canvas.height = 240;
        
        this.tentacle.segments = [];
        for (let i = 0; i < this.tentacle.num; i++) {
            this.tentacle.segments.push({ x: this.core.x + i * this.tentacle.len, y: this.core.y });
        }
        this.tentacle.target = { x: 150, y: 120 };
        this.tentacle.damage = 1;
        
        this.st = 'play'; this.tmr = 0; this.vfx = []; this.shieldTmr = 0; this.swarms = [];
        this.turrets = []; this.projectiles = []; this.enemies = []; 
        this.coreHp = 100; this.coreMaxHp = 100; this.score = 0; this.soul = 0; this.mp = 100;
        if (typeof playSnd !== 'undefined') playSnd('combo');
    },
    
    updateIK() {
        let segs = this.tentacle.segments; let len = this.tentacle.len;
        segs[segs.length - 1].x = this.tentacle.target.x; segs[segs.length - 1].y = this.tentacle.target.y;
        for (let i = segs.length - 2; i >= 0; i--) {
            let dx = segs[i].x - segs[i+1].x; let dy = segs[i].y - segs[i+1].y; let dist = Math.hypot(dx, dy) || 1;
            segs[i].x = segs[i+1].x + (dx / dist) * len; segs[i].y = segs[i+1].y + (dy / dist) * len;
        }
        segs[0].x = this.core.x; segs[0].y = this.core.y;
        for (let i = 1; i < segs.length; i++) {
            let dx = segs[i].x - segs[i-1].x; let dy = segs[i].y - segs[i-1].y; let dist = Math.hypot(dx, dy) || 1;
            segs[i].x = segs[i-1].x + (dx / dist) * len; segs[i].y = segs[i-1].y + (dy / dist) * len;
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
        // ★ 魔法のコスト（MP）判定を追加
        let cost = type === 'O' ? 30 : (type === '|' ? 20 : 15);
        if (this.mp < cost) {
            this.vfx.push({ type: 'text', text: 'NO MP!', x: cx - 20, y: cy, life: 30, color: '#f00' });
            if (typeof playSnd !== 'undefined') playSnd('hit');
            return;
        }
        this.mp -= cost;

        if (type === 'O') {
            this.shieldTmr = 180; 
            this.vfx.push({ type: 'text', text: 'SHIELD!', x: this.core.x, y: this.core.y - 50, life: 60, color: '#0ff' });
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
        if (this.shieldTmr > 0) this.shieldTmr--;
        this.mp = Math.min(100, this.mp + 0.15); // MP自動回復
        
        // --- 1. 左手(十字キー)で触手を操作 ---
        let speed = 12;
        let isMoving = false;
        if (typeof keys !== 'undefined') {
            if (keys.left) { this.tentacle.target.x -= speed; isMoving = true; }
            if (keys.right) { this.tentacle.target.x += speed; isMoving = true; }
            if (keys.up) { this.tentacle.target.y -= speed; isMoving = true; }
            if (keys.down) { this.tentacle.target.y += speed; isMoving = true; }
        }
        this.tentacle.target.x = Math.max(0, Math.min(340, this.tentacle.target.x)); // 右のUIには被らないように
        this.tentacle.target.y = Math.max(0, Math.min(240, this.tentacle.target.y));
        
        let maxDist = this.tentacle.num * this.tentacle.len;
        let dx = this.tentacle.target.x - this.core.x;
        let dy = this.tentacle.target.y - this.core.y;
        let d = Math.hypot(dx, dy);
        if (d > maxDist) {
            this.tentacle.target.x = this.core.x + (dx / d) * maxDist;
            this.tentacle.target.y = this.core.y + (dy / d) * maxDist;
        }
        for (let i = 0; i < 3; i++) this.updateIK();

        // --- 2. 右手(スワイプ)とUIタップ判定 ---
        if (typeof pointer !== 'undefined') {
            if (pointer.active && !this.prevPointerActive) {
                // 指を置いた瞬間の判定
                let py = pointer.y;
                if (pointer.x > 340) { // 右端のUIエリアをタップしたか？
                    if (py > 20 && py < 60 && this.soul >= 30) {
                        this.soul -= 30; // タレット設置
                        this.turrets.push({ x: this.core.x + 30 + Math.random()*20, y: this.core.y - 60 + Math.random()*120, tmr: 0 });
                        if(typeof playSnd !== 'undefined') playSnd('combo');
                    } else if (py > 80 && py < 120 && this.soul >= 50) {
                        this.soul -= 50; // 触手強化
                        this.tentacle.damage += 0.5;
                        if(typeof playSnd !== 'undefined') playSnd('combo');
                    } else if (py > 140 && py < 180 && this.soul >= 40) {
                        this.soul -= 40; // 回復
                        this.coreHp = Math.min(this.coreMaxHp, this.coreHp + 30);
                        if(typeof playSnd !== 'undefined') playSnd('combo');
                    }
                    pointer.path = []; // UIタップ時はジェスチャーを無効化
                }
            } else if (!pointer.active && this.prevPointerActive) {
                // 指を離した瞬間のジェスチャー判定
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

        // --- 3. 敵の生成（難易度スケーリング） ---
        let diff = 1 + (this.tmr / 1800); // 30秒ごとに難易度が1段階上がる
        if (Math.random() < 0.02 * diff) {
            let isBig = Math.random() < 0.15;
            this.enemies.push({
                x: 420, y: 20 + Math.random() * 200,
                speed: (0.5 + Math.random()) * (isBig ? 0.4 : 1) * (1 + diff * 0.1),
                hp: (isBig ? 60 : 15) * diff, maxHp: (isBig ? 60 : 15) * diff,
                atk: (isBig ? 10 : 2) * diff,
                type: isBig ? 'big' : 'small',
                hitCd: 0
            });
        }

        // --- 4. タレット（防衛砲台）の射撃処理 ---
        for (let t of this.turrets) {
            t.tmr++;
            if (t.tmr % 60 === 0 && this.enemies.length > 0) {
                let target = this.enemies[0];
                let minDist = Math.hypot(target.x - t.x, target.y - t.y);
                for (let e of this.enemies) {
                    let d = Math.hypot(e.x - t.x, e.y - t.y);
                    if (d < minDist) { minDist = d; target = e; }
                }
                let angle = Math.atan2(target.y - t.y, target.x - t.x);
                this.projectiles.push({ x: t.x, y: t.y, vx: Math.cos(angle)*6, vy: Math.sin(angle)*6, life: 60 });
                if (typeof playSnd !== 'undefined') playSnd('sel');
            }
        }

        // タレットの弾の更新
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            let hit = false;
            for (let e of this.enemies) {
                if (e.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < 15) {
                    e.hp -= 2; // タレット火力は低め
                    this.vfx.push({ type: 'spark', x: p.x, y: p.y, vx: 0, vy: 0, life: 10, maxLife: 10, color: '#0f0' });
                    hit = true; break;
                }
            }
            if (hit || p.life <= 0) this.projectiles.splice(i, 1);
        }

        // --- 5. 敵と各種攻撃の当たり判定 ---
        for (let e of this.enemies) {
            if (e.hp <= 0) continue;
            
            let coreAngle = Math.atan2(this.core.y - e.y, this.core.x - e.x);

            // ① 触手「全体」での打撃判定！（動かしている時のみ）
            if (isMoving && e.hitCd <= 0) {
                for (let i = 0; i < this.tentacle.num; i++) {
                    let seg = this.tentacle.segments[i];
                    if (Math.hypot(e.x - seg.x, e.y - seg.y) < (e.type === 'big' ? 20 : 12)) {
                        e.hp -= this.tentacle.damage;
                        e.hitCd = 10; // 無敵時間（多段ヒット防止）
                        e.x -= Math.cos(coreAngle) * 8; // 敵を弾き返すノックバック
                        e.y -= Math.sin(coreAngle) * 8;
                        this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: Math.random()*2-1, vy: Math.random()*2-1, life: 10, maxLife: 10, color: '#fff' });
                        break; // 1回の判定につき1ヒット
                    }
                }
            }

            // ② メテオの爆発判定
            for (let v of this.vfx) {
                if (v.type === 'explosion' && v.life > v.maxLife - 2) { 
                    if (Math.hypot(e.x - v.x, e.y - v.y) < v.size) { 
                        e.hp -= 15; e.x -= Math.cos(coreAngle) * 15; 
                    } 
                }
            }

            // ③ 眷属（スウォーム）の突撃
            for (let s of this.swarms) {
                if (s.life <= 0) continue;
                let dist = Math.hypot(e.x - s.x, e.y - s.y);
                if (dist < 15) {
                    e.hp -= 5; s.life = 0; 
                    this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: 0, vy: -2, life: 10, maxLife: 10, color: '#f00' });
                } else if (dist < 100) {
                    s.vx += (e.x - s.x) * 0.03; s.vy += (e.y - s.y) * 0.03; // ホーミング
                }
            }

            // ④ コアへの到達（ダメージ）
            if (Math.hypot(e.x - this.core.x, e.y - this.core.y) < 30) {
                if (this.shieldTmr > 0) {
                    e.x += 15; e.hp -= 10; // シールドで弾き返す
                } else {
                    this.coreHp -= e.atk;
                    e.hp = 0; // 敵は自爆
                    if (typeof screenShake !== 'undefined') screenShake(6);
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                }
            }
        }

        // 敵の移動と死亡処理
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            if (e.hp <= 0) {
                this.score += (e.type === 'big' ? 50 : 10);
                this.soul += (e.type === 'big' ? 10 : 2); // 魂(SOUL)を獲得！
                this.vfx.push({ type: 'explosion', x: e.x, y: e.y, size: e.type === 'big' ? 40 : 20, life: 10, maxLife: 10 });
                if (typeof playSnd !== 'undefined') playSnd('hit');
                this.enemies.splice(i, 1);
            } else {
                // ★ 敵がコアへ向かってホーミングする！
                let angle = Math.atan2(this.core.y - e.y, this.core.x - e.x);
                e.x += Math.cos(angle) * e.speed;
                e.y += Math.sin(angle) * e.speed;
                if (e.hitCd > 0) e.hitCd--;
            }
        }

        if (this.coreHp <= 0) {
            this.vfx.push({ type: 'text', text: `GAME OVER... SCORE:${this.score}`, x: 100, y: 120, life: 180, color: '#f00' });
            this.enemies = []; this.turrets = []; this.coreHp = 100; this.score = 0; this.soul = 0; this.tmr = 0; 
            this.tentacle.damage = 1;
        }

        // VFXの更新
        for (let i = this.vfx.length - 1; i >= 0; i--) {
            let v = this.vfx[i];
            v.life--;
            if (v.type === 'meteor') {
                v.x += (v.tx - v.x) * 0.2; v.y += (v.ty - v.y) * 0.2;
                if (v.life % 2 === 0) this.vfx.push({ type: 'spark', x: v.x + (Math.random()-0.5)*20, y: v.y + (Math.random()-0.5)*20, vx: 0, vy: -1, life: 15, maxLife: 15, color: '#fa0' });
            } else if (v.type === 'spark') {
                v.x += v.vx; v.y += v.vy;
            } else if (v.type === 'text') { v.y -= 0.5; }
            
            if (v.life <= 0) {
                if (v.type === 'meteor') {
                    this.vfx.push({ type: 'explosion', x: v.tx, y: v.ty, size: 80, life: 20, maxLife: 20 });
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                    if (typeof screenShake !== 'undefined') screenShake(8);
                }
                this.vfx.splice(i, 1);
            }
        }

        // 眷属（スウォーム）の更新
        for (let i = this.swarms.length - 1; i >= 0; i--) {
            let s = this.swarms[i];
            s.vx *= 0.95; s.vy *= 0.95; 
            s.x += s.vx; s.y += s.vy + Math.sin(s.life * 0.2) * 2;
            s.life--;
            if (s.life <= 0 || s.x > 400 || s.x < 0) this.swarms.splice(i, 1);
        }
    },
    
    draw() {
        if (typeof applyShake !== 'undefined') applyShake();

        const bgGrad = ctx.createLinearGradient(0, 0, 400, 0);
        bgGrad.addColorStop(0, '#200'); bgGrad.addColorStop(1, '#001'); 
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 400, 240);

        // タレット＆弾の描画
        ctx.fillStyle = '#0a0';
        for(let t of this.turrets) {
            ctx.fillRect(t.x-8, t.y-8, 16, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(t.x-4, t.y-4, 8, 8); ctx.fillStyle = '#0a0';
        }
        ctx.fillStyle = '#0f0';
        for(let p of this.projectiles) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill(); }

        // 敵の描画
        for (let e of this.enemies) {
            ctx.fillStyle = e.type === 'big' ? '#88f' : '#ccc';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.type === 'big' ? 15 : 8, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#f00'; ctx.fillRect(e.x - 10, e.y - (e.type === 'big'? 22 : 14), 20, 3);
            ctx.fillStyle = '#0f0'; ctx.fillRect(e.x - 10, e.y - (e.type === 'big'? 22 : 14), 20 * (e.hp/e.maxHp), 3);
        }

        ctx.fillStyle = '#f00';
        for(let s of this.swarms) { ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI*2); ctx.fill(); }

        // IK触手描画
        let segs = this.tentacle.segments;
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

        if (this.shieldTmr > 0) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${this.shieldTmr / 180})`;
            ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 60, this.tmr*0.1, this.tmr*0.1 + Math.PI*1.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 75, -this.tmr*0.05, -this.tmr*0.05 + Math.PI*1.5); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#f00'; ctx.shadowBlur = 20; ctx.shadowColor = '#f00';
        ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 30 + Math.sin(this.tmr * 0.1) * 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 10, 0, Math.PI * 2); ctx.fill();

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

        if (typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 0) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(pointer.path[0].x, pointer.path[0].y);
            for (let i = 1; i < pointer.path.length; i++) ctx.lineTo(pointer.path[i].x, pointer.path[i].y);
            ctx.stroke(); ctx.shadowBlur = 0;
        }

        // --- ステータスUI ---
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`HP:${Math.floor(this.coreHp)}`, 10, 20);
        ctx.fillStyle = '#0ff'; ctx.fillText(`MP:${Math.floor(this.mp)}`, 80, 20);
        ctx.fillStyle = '#ff0'; ctx.fillText(`SOUL:${this.soul}`, 150, 20);
        ctx.fillStyle = '#fff'; ctx.fillText(`SCORE:${this.score}`, 230, 20);

        // --- 右端のアップグレード（SHOP）パネル ---
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(340, 0, 60, 240);
        
        ctx.font = '10px monospace';
        // タレットボタン
        ctx.fillStyle = this.soul >= 30 ? '#0a0' : '#555';
        ctx.fillRect(342, 25, 56, 40);
        ctx.fillStyle = '#fff'; ctx.fillText('タレット', 345, 40); ctx.fillText('30魂', 355, 55);
        
        // 触手強化ボタン
        ctx.fillStyle = this.soul >= 50 ? '#a0a' : '#555';
        ctx.fillRect(342, 85, 56, 40);
        ctx.fillStyle = '#fff'; ctx.fillText('触手強化', 345, 100); ctx.fillText('50魂', 355, 115);
        
        // コア修復ボタン
        ctx.fillStyle = this.soul >= 40 ? '#0aa' : '#555';
        ctx.fillRect(342, 145, 56, 40);
        ctx.fillStyle = '#fff'; ctx.fillText('コア修復', 345, 160); ctx.fillText('40魂', 355, 175);

        ctx.fillStyle = '#888'; ctx.font = '8px monospace';
        ctx.fillText('SELECT:QUIT', 342, 230);

        if (typeof resetShake !== 'undefined') resetShake();
    }
};
