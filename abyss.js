// === ABYSS GENERAL (Phase 3: Gesture Magic) ===
const Abyss = {
    st: 'intro',
    tmr: 0,
    core: { x: 40, y: 120 },
    tentacle: { segments: [], num: 15, len: 12, target: { x: 150, y: 120 } },
    
    prevPointerActive: false, // スワイプ終了検知用
    vfx: [],                  // 魔法などのエフェクト
    shieldTmr: 0,             // シールドの残り時間
    swarms: [],               // 眷属（コウモリ）の群れ
    
    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400; canvas.height = 240;
        
        this.tentacle.segments = [];
        for (let i = 0; i < this.tentacle.num; i++) {
            this.tentacle.segments.push({ x: this.core.x + i * this.tentacle.len, y: this.core.y });
        }
        this.tentacle.target = { x: 150, y: 120 };
        
        this.st = 'play'; this.tmr = 0; this.vfx = []; this.shieldTmr = 0; this.swarms = [];
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
    
    // ★ 軌跡認識（ジェスチャーAI）アルゴリズム
    recognizeGesture(path) {
        if (path.length < 10) return null; // 短すぎる場合は無視
        
        let minX = 999, maxX = -999, minY = 999, maxY = -999;
        for (let p of path) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
        }
        let w = maxX - minX; let h = maxY - minY;
        let pStart = path[0]; let pEnd = path[path.length - 1];
        let distStartEnd = Math.hypot(pStart.x - pEnd.x, pStart.y - pEnd.y);
        
        // 【 O（丸）の判定 】始点と終点が近く、四角いバウンディングボックスを描いている
        if (distStartEnd < Math.max(w, h) * 0.4 && w > 40 && h > 40) return 'O';
        
        // 【 V字 の判定 】幅と高さがあり、始点と終点が上で、中間に一番下（谷）がある
        if (w > 30 && h > 40) {
            let lowestP = path[0];
            for (let p of path) if (p.y > lowestP.y) lowestP = p;
            if (pStart.y < minY + h * 0.5 && pEnd.y < minY + h * 0.5 && lowestP.y > maxY - h * 0.3) return 'V';
        }

        // 【 ―（横線）の判定 】横に長く、縦のブレが少ない
        if (w > 60 && h < w * 0.5) return '-';
        
        return null;
    },
    
    // 認識した図形に応じて魔法を発動
    spawnMagic(type, cx, cy) {
        if (type === 'O') {
            this.shieldTmr = 180; // 3秒間シールド展開
            this.vfx.push({ type: 'text', text: 'ABYSS SHIELD!!', x: this.core.x, y: this.core.y - 50, life: 60 });
            if (typeof playSnd !== 'undefined') playSnd('sel');
        } else if (type === 'V') {
            this.vfx.push({ type: 'text', text: 'METEOR STRIKE!!', x: cx - 50, y: cy - 30, life: 60 });
            this.vfx.push({ type: 'meteor', x: cx - 150, y: -50, tx: cx, ty: cy, life: 30, maxLife: 30 }); // 隕石を生成
            if (typeof playSnd !== 'undefined') playSnd('jmp');
        } else if (type === '-') {
            this.vfx.push({ type: 'text', text: 'SWARM CALL!!', x: cx - 40, y: cy - 30, life: 60 });
            // 眷属（スウォーム）を15匹スポーン
            for(let i=0; i<15; i++) {
                this.swarms.push({ x: cx + (Math.random()-0.5)*40, y: cy + (Math.random()-0.5)*40, vx: Math.random()*2+2, vy: (Math.random()-0.5)*2, life: 120 });
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
        
        // 1. 左手(十字キー)で触手を操作
        let speed = 8;
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

        // 2. 右手(スワイプ)のジェスチャー判定
        if (typeof pointer !== 'undefined') {
            // 指を画面から「離した瞬間」を検知
            if (this.prevPointerActive && !pointer.active) {
                let g = this.recognizeGesture(pointer.path);
                if (g) {
                    // 描いた図形の中心座標を計算して魔法発動
                    let cx = 0, cy = 0;
                    for(let p of pointer.path) { cx += p.x; cy += p.y; }
                    cx /= pointer.path.length; cy /= pointer.path.length;
                    this.spawnMagic(g, cx, cy);
                }
            }
            this.prevPointerActive = pointer.active;
        }

        // 3. VFX（魔法エフェクト）の更新
        for (let i = this.vfx.length - 1; i >= 0; i--) {
            let v = this.vfx[i];
            v.life--;
            if (v.type === 'meteor') {
                v.x += (v.tx - v.x) * 0.2; v.y += (v.ty - v.y) * 0.2; // 目標座標へ落下
                if (v.life % 2 === 0) this.vfx.push({ type: 'spark', x: v.x + (Math.random()-0.5)*20, y: v.y + (Math.random()-0.5)*20, vx: 0, vy: -1, life: 15, maxLife: 15 }); // 炎の尾
                
                if (v.life <= 0) { // 爆発
                    this.vfx.push({ type: 'explosion', x: v.tx, y: v.ty, size: 80, life: 20, maxLife: 20 });
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                    if (typeof screenShake !== 'undefined') screenShake(8);
                }
            } else if (v.type === 'spark') {
                v.x += v.vx; v.y += v.vy;
            } else if (v.type === 'text') {
                v.y -= 0.5; // 文字が上に昇る
            }
            if (v.life <= 0 && v.type !== 'meteor') this.vfx.splice(i, 1);
        }

        // 4. 眷属（スウォーム）の更新
        for (let i = this.swarms.length - 1; i >= 0; i--) {
            let s = this.swarms[i];
            s.life--; s.x += s.vx; s.y += s.vy + Math.sin(s.life * 0.2) * 2; // うねうね飛ぶ
            if (s.life <= 0 || s.x > 400) this.swarms.splice(i, 1);
        }
    },
    
    draw() {
        if (typeof applyShake !== 'undefined') applyShake(); // 爆発の画面揺れ

        const bgGrad = ctx.createLinearGradient(0, 0, 400, 0);
        bgGrad.addColorStop(0, '#200'); bgGrad.addColorStop(1, '#001'); 
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 400, 240);

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
        ctx.lineTo(tip.x + Math.cos(angle)*20, tip.y + Math.sin(angle)*20);
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
                ctx.fillStyle = `rgba(255, 100, 0, ${v.life/v.maxLife})`;
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

        // 右手のジェスチャー軌跡描画
        if (typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 0) {
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(pointer.path[0].x, pointer.path[0].y);
            for (let i = 1; i < pointer.path.length; i++) ctx.lineTo(pointer.path[i].x, pointer.path[i].y);
            ctx.stroke(); ctx.shadowBlur = 0;
        }

        // ガイドテキスト
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText('PHASE 3: GESTURE MAGIC', 10, 20);
        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
        ctx.fillText('画面に【 V 】を描く: メテオ！', 10, 35);
        ctx.fillText('画面に【 O 】を描く: シールド！', 10, 50);
        ctx.fillText('画面に【 ― (横線)】を描く: 眷属召喚！', 10, 65);

        if (typeof resetShake !== 'undefined') resetShake();
    }
};
