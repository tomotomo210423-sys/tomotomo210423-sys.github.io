// === ABYSS GENERAL (Phase 3: Gesture Magic & Fixes) ===
const Abyss = {
    st: 'intro',
    tmr: 0,
    
    core: { x: 40, y: 120 }, 
    tentacle: { segments: [], num: 15, len: 12, target: { x: 150, y: 120 } },
    magics: [], // 発動中の魔法を管理
    magicText: "", // 発動した魔法の名前表示用
    magicTextTmr: 0,
    
    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400; canvas.height = 240;
        
        this.tentacle.segments = [];
        for (let i = 0; i < this.tentacle.num; i++) {
            this.tentacle.segments.push({ x: this.core.x + i * this.tentacle.len, y: this.core.y });
        }
        this.tentacle.target = { x: 150, y: 120 };
        this.magics = [];
        
        this.st = 'play'; this.tmr = 0;
        if (typeof playSnd !== 'undefined') playSnd('combo');
    },
    
    updateIK() {
        let segs = this.tentacle.segments; let len = this.tentacle.len;
        segs[segs.length - 1].x = this.tentacle.target.x; segs[segs.length - 1].y = this.tentacle.target.y;
        for (let i = segs.length - 2; i >= 0; i--) {
            let dx = segs[i].x - segs[i+1].x; let dy = segs[i].y - segs[i+1].y;
            let dist = Math.hypot(dx, dy) || 1;
            segs[i].x = segs[i+1].x + (dx / dist) * len; segs[i].y = segs[i+1].y + (dy / dist) * len;
        }
        segs[0].x = this.core.x; segs[0].y = this.core.y;
        for (let i = 1; i < segs.length; i++) {
            let dx = segs[i].x - segs[i-1].x; let dy = segs[i].y - segs[i-1].y;
            let dist = Math.hypot(dx, dy) || 1;
            segs[i].x = segs[i-1].x + (dx / dist) * len; segs[i].y = segs[i-1].y + (dy / dist) * len;
        }
    },
    
    // ★ 高精度ジェスチャー認識アルゴリズム
    recognizeGesture(path) {
        if (path.length < 10) return null; // 短すぎる線は無視
        
        let minX = 999, maxX = 0, minY = 999, maxY = 0, totalLen = 0;
        for (let i = 0; i < path.length; i++) {
            let p = path[i];
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
            if (i > 0) totalLen += Math.hypot(p.x - path[i-1].x, p.y - path[i-1].y);
        }
        let w = maxX - minX; let h = maxY - minY;
        if (w < 30 && h < 30) return null; // 点のようなタップは無視
        
        let p0 = path[0]; let pN = path[path.length - 1];
        let distEnds = Math.hypot(pN.x - p0.x, pN.y - p0.y);
        
        // 1. 【 O (丸) 】判定: 始点と終点が近く、経路が長い
        if (distEnds < Math.max(w, h) * 0.6 && totalLen > (w + h) * 1.5) return 'O';
        
        // 2. 【 V 】判定: 縦長で、一度大きく下がってから上がる
        if (h > w * 0.4) {
            let lowestIdx = 0; let lowestY = 0;
            for (let i = 0; i < path.length; i++) { 
                if (path[i].y > lowestY) { lowestY = path[i].y; lowestIdx = i; } 
            }
            if (lowestIdx > path.length * 0.2 && lowestIdx < path.length * 0.8) {
                if (p0.y < lowestY - h * 0.4 && pN.y < lowestY - h * 0.4) return 'V';
            }
        }
        
        // 3. 【 Z (稲妻) 】判定: 右へ→左下へ→右へ のジグザグ移動
        let zScore = 0;
        for (let i = 1; i < path.length; i++) {
            let dx = path[i].x - path[i-1].x; let dy = path[i].y - path[i-1].y;
            if (dx < -2 && dy > 2) zScore++; // 左下に切り返す動きをカウント
        }
        if (zScore > 5 && p0.x < pN.x) return 'Z';
        
        // 4. 【 - (横線) 】判定: 縦の動きが少なく、横に長い
        if (w > h * 2) return 'LINE';

        return null;
    },

    castMagic(type, path) {
        // 描いた軌跡の中心座標を計算
        let minX = 999, maxX = 0, minY = 999, maxY = 0;
        for (let p of path) {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
        }
        let cx = (minX + maxX) / 2;
        let cy = (minY + maxY) / 2;

        if (type === 'V') {
            this.magics.push({ type: 'meteor', x: cx, y: cy, tmr: 0, life: 60 });
            this.magicText = "【 メテオ 】"; this.magicTextTmr = 30;
            if(typeof playSnd !== 'undefined') playSnd('combo');
        } 
        else if (type === 'O') {
            this.magics.push({ type: 'shield', x: this.core.x, y: this.core.y, tmr: 0, life: 180 });
            this.magicText = "【 アビス・シールド 】"; this.magicTextTmr = 30;
            if(typeof playSnd !== 'undefined') playSnd('jmp');
        } 
        else if (type === 'Z') {
            this.magics.push({ type: 'thunder', x: cx, y: cy, tmr: 0, life: 30 });
            this.magicText = "【 デス・レイ 】"; this.magicTextTmr = 30;
            if(typeof playSnd !== 'undefined') playSnd('hit');
            if(typeof screenShake !== 'undefined') screenShake(5);
        }
        else if (type === 'LINE') {
            this.magics.push({ type: 'slash', x: cx, y: cy, tmr: 0, life: 20 });
            this.magicText = "【 なぎ払い 】"; this.magicTextTmr = 30;
            if(typeof playSnd !== 'undefined') playSnd('sel');
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
        if (this.magicTextTmr > 0) this.magicTextTmr--;
        
        // --- 1. 左手(IK触手)の更新 ---
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
        let dx = this.tentacle.target.x - this.core.x; let dy = this.tentacle.target.y - this.core.y;
        let d = Math.hypot(dx, dy);
        if (d > maxDist) {
            this.tentacle.target.x = this.core.x + (dx / d) * maxDist;
            this.tentacle.target.y = this.core.y + (dy / d) * maxDist;
        }
        for (let i = 0; i < 3; i++) this.updateIK();

        // --- 2. 右手(ジェスチャー)の判定処理 ---
        if (typeof pointer !== 'undefined') {
            // 指が離れた瞬間に、溜まっていた軌跡を判定する
            if (!pointer.active && pointer.path.length > 0) {
                let recognizedType = this.recognizeGesture(pointer.path);
                if (recognizedType) {
                    this.castMagic(recognizedType, pointer.path);
                }
                // ★【超重要】判定が終わったら軌跡を空にする！(無限発動バグの修正)
                pointer.path = []; 
            }
        }

        // --- 3. 魔法の更新 ---
        for (let i = this.magics.length - 1; i >= 0; i--) {
            let m = this.magics[i];
            m.tmr++;
            if (m.tmr > m.life) this.magics.splice(i, 1);
        }
    },
    
    draw() {
        const bgGrad = ctx.createLinearGradient(0, 0, 400, 0);
        bgGrad.addColorStop(0, '#200'); bgGrad.addColorStop(1, '#001'); 
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 400, 240);
        
        // --- 魔法の描画 ---
        ctx.globalCompositeOperation = 'lighter';
        for (let m of this.magics) {
            if (m.type === 'meteor') {
                // 上から落ちてくる隕石
                let dropY = m.y - 300 + (m.tmr * 15);
                if (dropY < m.y) {
                    ctx.fillStyle = '#f50';
                    ctx.beginPath(); ctx.arc(m.x, dropY, 20, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(m.x, dropY-10, 10, 0, Math.PI*2); ctx.fill();
                } else {
                    // 着弾後の大爆発
                    let expRatio = (m.tmr - 20) / 40;
                    if (expRatio > 0 && expRatio <= 1) {
                        ctx.fillStyle = `rgba(255, 50, 0, ${1 - expRatio})`;
                        ctx.beginPath(); ctx.arc(m.x, m.y, expRatio * 100, 0, Math.PI*2); ctx.fill();
                    }
                }
            } else if (m.type === 'shield') {
                ctx.strokeStyle = `rgba(0, 255, 255, ${Math.sin(m.tmr*0.1)*0.5 + 0.5})`;
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(m.x, m.y, 60, 0, Math.PI*2); ctx.stroke();
            } else if (m.type === 'thunder') {
                ctx.fillStyle = `rgba(255, 255, 0, ${1 - m.tmr/m.life})`;
                ctx.fillRect(m.x - 10 + Math.random()*20, 0, 10 + Math.random()*20, 240);
            } else if (m.type === 'slash') {
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - m.tmr/m.life})`;
                ctx.lineWidth = 10 - (m.tmr * 0.4);
                ctx.beginPath(); ctx.moveTo(m.x - 100, m.y); ctx.lineTo(m.x + 100, m.y); ctx.stroke();
            }
        }
        ctx.globalCompositeOperation = 'source-over';

        // --- IK触手の描画 ---
        let segs = this.tentacle.segments;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 20; ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i].x, segs[i].y);
        ctx.strokeStyle = '#d0f'; ctx.lineWidth = 6; 
        ctx.shadowBlur = 15; ctx.shadowColor = '#d0f'; ctx.stroke(); ctx.shadowBlur = 0;
        
        let tip = segs[segs.length - 1]; let preTip = segs[segs.length - 2];
        let angle = Math.atan2(tip.y - preTip.y, tip.x - preTip.x);
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.moveTo(tip.x + Math.cos(angle - Math.PI/2)*8, tip.y + Math.sin(angle - Math.PI/2)*8);
        ctx.lineTo(tip.x + Math.cos(angle)*20, tip.y + Math.sin(angle)*20);
        ctx.lineTo(tip.x + Math.cos(angle + Math.PI/2)*8, tip.y + Math.sin(angle + Math.PI/2)*8);
        ctx.fill();

        // --- 魔王のコア描画 ---
        ctx.fillStyle = '#f00'; ctx.shadowBlur = 20; ctx.shadowColor = '#f00';
        ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 30 + Math.sin(this.tmr * 0.1) * 3, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.core.x, this.core.y, 10, 0, Math.PI * 2); ctx.fill();

        // --- 入力中の軌跡描画 ---
        if (typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 0) {
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 4; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
            ctx.beginPath(); ctx.moveTo(pointer.path[0].x, pointer.path[0].y);
            for (let i = 1; i < pointer.path.length; i++) ctx.lineTo(pointer.path[i].x, pointer.path[i].y);
            ctx.stroke(); ctx.shadowBlur = 0;
        }

        // --- UI表示 ---
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText('PHASE 3: GESTURE MAGIC', 10, 20);
        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
        ctx.fillText('描ける魔法： V(メテオ) / O(シールド) / Z(雷) / -(なぎ払い)', 10, 35);
        
        if (this.magicTextTmr > 0) {
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace';
            ctx.fillText(this.magicText, 140, 20);
        }
    }
};
