// === ABYSS GENERAL (Phase 1: UI Transformation & Gesture Base) ===
const Abyss = {
    st: 'intro',
    tmr: 0,
    
    init() {
        // ★ ハードウェアを「横画面のスイッチ風」にCSSでガシャコンと変形させる！
        document.getElementById('gameboy').classList.add('mode-abyss');
        
        // Canvasの解像度を横長（16:9のワイド比率）に変更！
        canvas.width = 400;
        canvas.height = 240;
        
        this.st = 'play';
        this.tmr = 0;
        
        if (typeof playSnd !== 'undefined') playSnd('combo');
    },
    
    update() {
        // SELECTボタンで終了し、元の縦画面に戻す
        if (typeof keysDown !== 'undefined' && keysDown.select) {
            document.getElementById('gameboy').classList.remove('mode-abyss');
            // Canvasの解像度を元のレトロ縦長に戻す
            canvas.width = 200;
            canvas.height = 300;
            if (typeof switchApp !== 'undefined') switchApp(Menu);
            return;
        }
        
        this.tmr++;
    },
    
    draw() {
        // 1. 深淵（アビス）の背景描画
        const bgGrad = ctx.createLinearGradient(0, 0, 400, 0);
        bgGrad.addColorStop(0, '#200'); // 自陣は赤黒く
        bgGrad.addColorStop(1, '#001'); // 敵陣は青黒く
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 400, 240);
        
        // 2. 魔王のコア（自陣）のテスト描画
        ctx.fillStyle = '#f00';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f00';
        ctx.beginPath();
        // 脈打つアニメーション
        ctx.arc(40, 120, 25 + Math.sin(this.tmr * 0.1) * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3. 画面の案内テキスト
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('ABYSS GENERAL (PHASE 1)', 90, 110);
        
        ctx.fillStyle = '#aaa';
        ctx.font = '12px monospace';
        ctx.fillText('【左手】で 十字キーを操作！', 90, 140);
        ctx.fillText('【右手】で この画面を直接なぞってみろ！', 90, 160);
        
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.fillText('終了する時は SELECT ボタン', 120, 220);

        // ★ 4. 右手の「指の軌跡」をリアルタイムで光の線として描画する！
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
