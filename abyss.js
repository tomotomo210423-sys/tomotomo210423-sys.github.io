// === ABYSS GENERAL (Phase 2: IK Tentacle & Multi-tasking) ===
const Abyss = {
    st: 'intro',
    tmr: 0,
    
    core: { x: 40, y: 120 }, // 魔王のコアの位置
    
    // 触手(テンタクル)のデータ
    tentacle: {
        segments: [],
        num: 15,      // 関節の数
        len: 12,      // 1関節あたりの長さ
        target: { x: 150, y: 120 } // 先端が向かう目標座標
    },
    
    init() {
        document.getElementById('gameboy').classList.add('mode-abyss');
        canvas.width = 400;
        canvas.height = 240;
        
        // 触手の関節を初期化
        this.tentacle.segments = [];
        for (let i = 0; i < this.tentacle.num; i++) {
            this.tentacle.segments.push({ x: this.core.x + i * this.tentacle.len, y: this.core.y });
        }
        this.tentacle.target = { x: 150, y: 120 };
        
        this.st = 'play';
        this.tmr = 0;
        if (typeof playSnd !== 'undefined') playSnd('combo');
    },
    
    // ★ 逆運動学 (Inverse Kinematics: FABRIK) アルゴリズム
    updateIK() {
        let segs = this.tentacle.segments;
        let len = this.tentacle.len;
        
        // 1. 先端をターゲットの位置に強制的に引っ張る (Backward)
        segs[segs.length - 1].x = this.tentacle.target.x;
        segs[segs.length - 1].y = this.tentacle.target.y;
        for (let i = segs.length - 2; i >= 0; i--) {
            let dx = segs[i].x - segs[i+1].x;
            let dy = segs[i].y - segs[i+1].y;
            let dist = Math.hypot(dx, dy) || 1;
            segs[i].x = segs[i+1].x + (dx / dist) * len;
            segs[i].y = segs[i+1].y + (dy / dist) * len;
        }
        
        // 2. 根元をコアの位置に強制的に戻す (Forward)
        segs[0].x = this.core.x;
        segs[0].y = this.core.y;
        for (let i = 1; i < segs.length; i++) {
            let dx = segs[i].x - segs[i-1].x;
            let dy = segs[i].y - segs[i-1].y;
            let dist = Math.hypot(dx, dy) || 1;
            segs[i].x = segs[i-1].x + (dx / dist) * len;
            segs[i].y = segs[i-1].y + (dy / dist) * len;
        }
    },
    
    update() {
        // SELECTボタンで終了
        if (typeof keysDown !== 'undefined' && keysDown.select) {
            document.getElementById('gameboy').classList.remove('mode-abyss');
            canvas.width = 200;
            canvas.height = 300;
            if (typeof switchApp !== 'undefined') switchApp(Menu);
            return;
        }
        
        this.tmr++;
        
        // --- 1. 左手(十字キー)で触手のターゲットを操作 ---
        let speed = 8;
        if (typeof keys !== 'undefined') {
            if (keys.left) this.tentacle.target.x -= speed;
            if (keys.right) this.tentacle.target.x += speed;
            if (keys.up) this.tentacle.target.y -= speed;
            if (keys.down) this.tentacle.target.y += speed;
        }
        
        // ターゲットが画面外に出ないように制限
        this.tentacle.target.x = Math.max(0, Math.min(400, this.tentacle.target.x));
        this.tentacle.target.y = Math.max(0, Math.min(240, this.tentacle.target.y));
        
        // 触手が届く最大距離の計算（千切れないようにする）
        let maxDist = this.tentacle.num * this.tentacle.len;
        let dx = this.tentacle.target.x - this.core.x;
        let dy = this.tentacle.target.y - this.core.y;
        let d = Math.hypot(dx, dy);
        if (d > maxDist) {
            this.tentacle.target.x = this.core.x + (dx / d) * maxDist;
            this.tentacle.target.y = this.core.y + (dy / d) * maxDist;
        }
        
        // 物理計算を数回回して関節を滑らかにする
        for (let i = 0; i < 3; i++) {
            this.updateIK();
        }
    },
    
    draw() {
        // 背景
        const bgGrad = ctx.createLinearGradient(0, 0, 400, 0);
        bgGrad.addColorStop(0, '#200'); 
        bgGrad.addColorStop(1, '#001'); 
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 400, 240);
        
        // --- 触手 (IK) の描画 ---
        let segs = this.tentacle.segments;
        
        // 太い黒の縁取り（ベース）
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) {
            ctx.lineTo(segs[i].x, segs[i].y);
        }
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 20; // 根本の太さ
        ctx.stroke();
        
        // 紫色の発光ライン（インナー）
        ctx.beginPath();
        ctx.moveTo(segs[0].x, segs[0].y);
        for (let i = 1; i < segs.length; i++) {
            ctx.lineTo(segs[i].x, segs[i].y);
        }
        ctx.strokeStyle = '#d0f';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#d0f';
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // 触手の先端（刃）
        let tip = segs[segs.length - 1];
        let preTip = segs[segs.length - 2];
        let angle = Math.atan2(tip.y - preTip.y, tip.x - preTip.x);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(tip.x + Math.cos(angle - Math.PI/2)*8, tip.y + Math.sin(angle - Math.PI/2)*8); // 根元
        ctx.lineTo(tip.x + Math.cos(angle)*20, tip.y + Math.sin(angle)*20); // 切っ先
        ctx.lineTo(tip.x + Math.cos(angle + Math.PI/2)*8, tip.y + Math.sin(angle + Math.PI/2)*8); // 根元
        ctx.fill();

        // --- 魔王のコア描画 ---
        ctx.fillStyle = '#f00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f00';
        ctx.beginPath();
        ctx.arc(this.core.x, this.core.y, 30 + Math.sin(this.tmr * 0.1) * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // コアの中心
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.core.x, this.core.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // UIテキスト
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        ctx.fillText('PHASE 2: IK TENTACLE', 10, 20);
        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
        ctx.fillText('【左手】 十字キーで 触手を操れ！', 10, 35);
        ctx.fillText('【右手】 画面を指でなぞってみろ！', 10, 50);

        // --- 右手のジェスチャー軌跡描画 ---
        if (typeof pointer !== 'undefined' && pointer.active && pointer.path.length > 0) {
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#0ff';
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(pointer.path[0].x, pointer.path[0].y);
            for (let i = 1; i < pointer.path.length; i++) {
                ctx.lineTo(pointer.path[i].x, pointer.path[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    }
};
