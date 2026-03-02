// === ABYSS GENERAL (Phase 4: Enemy Invasion & Combat) ===
const Abyss = {
    st: 'play',
    tmr: 0,
    core: { x: 40, y: 120 },
    // ★ 触手の関節数(num)と長さ(len)を増やして超ロングに！
    tentacle: { segments: [], num: 20, len: 14, target: { x: 150, y: 120 } },
    
    prevPointerActive: false,
    vfx: [],
    shieldTmr: 0,
    swarms: [],
    
    // ★ 追加：ゲーム進行用のデータ
    enemies: [],
    coreHp: 100,
    score: 0,
    
    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400; canvas.height = 240;
        
        this.tentacle.segments = [];
        for (let i = 0; i < this.tentacle.num; i++) {
            this.tentacle.segments.push({ x: this.core.x + i * this.tentacle.len, y: this.core.y });
        }
        this.tentacle.target = { x: 150, y: 120 };
        
        this.st = 'play'; this.tmr = 0; this.vfx = []; this.shieldTmr = 0; this.swarms = [];
        this.enemies = []; this.coreHp = 100; this.score = 0;
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
        if (h > w * 1.5 && h > 30) return '|'; // メテオ
        if (w > h * 1.5 && w > 30) return '-'; // 眷属
        if (distStartEnd < Math.max(w, h) * 0.6 && w > 20 && h > 20) return 'O'; // シールド
        return null;
    },
    
    spawnMagic(type, cx, cy) {
        if (type === 'O') {
            this.shieldTmr = 180; 
            this.vfx.push({ type: 'text', text: 'ABYSS SHIELD!!', x: this.core.x, y: this.core.y - 50, life: 60 });
            if (typeof playSnd !== 'undefined') playSnd('sel');
        } else if (type === '|') { 
            this.vfx.push({ type: 'text', text: 'METEOR STRIKE!!', x: cx - 50, y: cy - 30, life: 60 });
            this.vfx.push({ type: 'meteor', x: cx - 150, y: -50, tx: cx, ty: cy, life: 30, maxLife: 30 });
            if (typeof playSnd !== 'undefined') playSnd('jmp');
        } else if (type === '-') {
            this.vfx.push({ type: 'text', text: 'SWARM CALL!!', x: cx - 40, y: cy - 30, life: 60 });
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
        
        // --- 1. 左手(十字キー)で触手を操作 ---
        let speed = 12; // 触手の移動スピードも強化
        if (typeof keys !== 'undefined') {
            if (keys.left) this.tentacle.target.x -= speed;
            if (keys.right) this.tentacle.target.x += speed;
            if (keys.up) this.tentacle.target.y -= speed;
            if (keys.down) this.tentacle.target.y += speed;
        }
        this.tentacle.target.x = Math.max(0, Math.min(400, this.tentacle.target.x));
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

        // --- 2. 右手(スワイプ)のジェスチャー判定 ---
        if (typeof pointer !== 'undefined') {
            if (this.prevPointerActive && !pointer.active) {
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

        // --- 3. 敵の生成（徐々に激しくなる） ---
        if (Math.random() < 0.02 + this.tmr * 0.00001) {
            let isBig = Math.random() < 0.15; // 15%の確率でデカい敵
            this.enemies.push({
                x: 420, y: 30 + Math.random() * 180,
                vx: -(0.5 + Math.random() * 1.5) * (isBig ? 0.5 : 1), // デカいと遅い
                hp: isBig ? 100 : 20, maxHp: isBig ? 100 : 20,
                type: isBig ? 'big' : 'small'
            });
        }

        // --- 4. 敵と各種攻撃の当たり判定 ---
        for (let e of this.enemies) {
            if (e.hp <= 0) continue;

            // ① 触手の先端(近接)での直接打撃！
            for (let i = this.tentacle.num - 5; i < this.tentacle.num; i++) {
                let seg = this.tentacle.segments[i];
                let dist = Math.hypot(e.x - seg.x, e.y - seg.y);
                if (dist < (e.type === 'big' ? 25 : 15)) {
                    e.hp -= 2; // ゴリゴリ削る
                    e.x += 2;  // ノックバック
                    if (Math.random() < 0.2) this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: Math.random()*4-2, vy: Math.random()*4-2, life: 10, maxLife: 10, color: '#fff' });
                }
            }

            // ② メテオの「爆発」に巻き込まれたか判定
            for (let v of this.vfx) {
                if (v.type === 'explosion' && v.life > v.maxLife - 2) { // 爆発した瞬間
                    let dist = Math.hypot(e.x - v.x, e.y - v.y);
                    if (dist < v.size) { e.hp -= 60; e.x += 10; } // 大ダメージ＆大ノックバック
                }
            }

            // ③ 眷属（スウォーム）が敵に突撃（ホーミング自爆）
            for (let s of this.swarms) {
                if (s.life <= 0) continue;
                let dist = Math.hypot(e.x - s.x, e.y - s.y);
                if (dist < 20) {
                    e.hp -= 15; s.life = 0; // 自爆してダメージ
                    this.vfx.push({ type: 'spark', x: e.x, y: e.y, vx: 0, vy: -2, life: 10, maxLife: 10, color: '#f00' });
                } else if (dist < 100) {
                    // 近い敵にホーミングする（群知能）
                    s.vx += (e.x - s.x) * 0.02; s.vy += (e.y - s.y) * 0.02;
                }
            }

            // ④ コアへの到達（ダメージ）
            let coreDist = Math.hypot(e.x - this.core.x, e.y - this.core.y);
            if (coreDist < 30) {
                if (this.shieldTmr > 0) {
                    e.x += 15; e.hp -= 10; // シールドで弾き返す
                } else {
                    this.coreHp -= (e.type === 'big' ? 15 : 5);
                    e.hp = 0; // 自爆
                    if (typeof screenShake !== 'undefined') screenShake(6);
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                }
            }
        }

        // 敵の移動と死亡処理
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].hp <= 0) {
                this.score += (this.enemies[i].type === 'big' ? 50 : 10);
                this.vfx.push({ type: 'explosion', x: this.enemies[i].x, y: this.enemies[i].y, size: this.enemies[i].type === 'big' ? 50 : 25, life: 10, maxLife: 10 });
                if (typeof playSnd !== 'undefined') playSnd('hit');
                this.enemies.splice(i, 1);
            } else {
                this.enemies[i].x += this.enemies[i].vx;
            }
        }

        // --- 5. ゲームオーバー処理 ---
        if (this.coreHp <= 0) {
            this.vfx.push({ type: 'text', text: `GAME OVER... SCORE:${this.score}`, x: 100, y: 120, life: 180 });
            this.enemies = []; this.coreHp = 100; this.score = 0; this.tmr = 0; // 自動リトライ
        }

        // VFXの更新（メテオ消滅バグ完全修正）
        for (let i = this.vfx.length - 1; i >= 0; i--) {
            let v = this.vfx[i];
            v.life--;
            if (v.type === 'meteor') {
                v.x += (v.tx - v.x) * 0.2; v.y += (v.ty - v.y) * 0.2;
                if (v.life % 2 === 0) this.vfx.push({ type: 'spark', x: v.x + (Math.random()-0.5)*20, y: v.y + (Math.random()-0.5)*20, vx: 0, vy: -1, life: 15, maxLife: 15, color: '#fa0' });
            } else if (v.type === 'spark') {
                v.x += v.vx; v.y += v.vy;
            } else if (v.type === 'text') { v.y -= 0.5; }
            
            // 寿命が尽きたら消す（メテオなら爆発を生んでから消す）
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
            s.vx *= 0.95; s.vy *= 0.95; // 摩擦
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

        // 敵の描画
        for (let e of this.enemies) {
            ctx.fillStyle = e.type === 'big' ? '#88f' : '#ccc';
            ctx.beginPath(); ctx.arc(e.x, e.y, e.type === 'big' ? 15 : 8, 0, Math.PI*2); ctx.fill();
            // HPバー
            ctx.fillStyle = '#f00'; ctx.fillRect(e.x - 10, e.y - (e.type === 'big'? 22 : 14), 20, 3);
            ctx.fillStyle = '#0f0'; ctx.fillRect(e.x - 10, e.y - (e.type === 'big'? 22 : 14), 20 * (e.hp/e.maxHp), 3);
        }

        // スウォーム（眷属）描画
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
        ctx.lineTo(tip.x + Math.cos(angle)*25, tip.y + Math.sin(angle)*25); // 刃も長く
        ctx.lineTo(tip.x + Math.cos(angle + Math.PI/2)*8, tip.y + Math.sin(angle + Math.PI/2)*8);
        ctx.fill();

        // アビス・シールド描画
        if (this.shieldTmr > 0) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${this.shieldTmr / 180})`;
            ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 60, this.tmr*0.1, this.tmr*0.1 + Math.PI*1.5); ctx.stroke();
            ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 75, -this.tmr*0.05, -this.tmr*0.05 + Math.PI*1.5); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // 魔王のコア描画
        ctx.fillStyle = '#f00'; ctx.shadowBlur = 20; ctx.shadowColor = '#f00';
        ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 30 + Math.sin(this.tmr * 0.1) * 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 10, 0, Math.PI * 2); ctx.fill();

        // VFX描画
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
                ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace';
                ctx.globalAlpha = Math.max(0, v.life / 60); ctx.fillText(v.text, v.x, v.y); ctx.globalAlpha = 1.0;
            }
        }

        // 軌跡描画
        if (typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 0) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(pointer.path[0].x, pointer.path[0].y);
            for (let i = 1; i < pointer.path.length; i++) ctx.lineTo(pointer.path[i].x, pointer.path[i].y);
            ctx.stroke(); ctx.shadowBlur = 0;
        }

        // ステータスUI
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText(`CORE HP: ${this.coreHp}%`, 10, 20);
        ctx.fillStyle = '#ff0';
        ctx.fillText(`SCORE: ${this.score}`, 10, 35);
        
        ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
        ctx.fillText('| :メテオ / ― :眷属 / O :シールド', 10, 230);

        if (typeof resetShake !== 'undefined') resetShake();
    }
};
