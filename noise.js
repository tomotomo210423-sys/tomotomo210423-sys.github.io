// === NOISE AGENT (Phase 1: Annoying Footsteps) ===
const Noise = {
  st: 'title',
  p: { x: 100, y: 250, r: 6, spd: 2.5 },
  texts: [],
  tmr: 0,
  
  init() {
    this.st = 'title';
    this.p = { x: 100, y: 250, r: 6, spd: 2.5 };
    this.texts = [];
    this.tmr = 0;
  },
  
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    
    if (this.st === 'title') {
        if (keysDown.a) { 
            this.st = 'play'; 
            if (typeof playSnd !== 'undefined') playSnd('jmp'); 
        }
        return;
    }
    
    this.tmr++;
    
    // --- プレイヤー(ミュート)の移動処理 ---
    let moved = false;
    let vx = 0, vy = 0;
    // Bボタンでウザいダッシュ！
    let currentSpd = keys.b ? this.p.spd * 2 : this.p.spd;
    
    if (keys.left)  { vx -= currentSpd; moved = true; }
    if (keys.right) { vx += currentSpd; moved = true; }
    if (keys.up)    { vy -= currentSpd; moved = true; }
    if (keys.down)  { vy += currentSpd; moved = true; }
    
    // 斜め移動の速度補正
    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
    
    this.p.x += vx; this.p.y += vy;
    
    // 画面外に出ないように制限
    this.p.x = Math.max(10, Math.min(190, this.p.x));
    this.p.y = Math.max(10, Math.min(290, this.p.y));
    
    // --- 📢 呪いの靴：歩行ノイズ（視界塞ぎ）の発生 ---
    // 歩いていると定期的に巨大な文字が出る（ダッシュ中は頻度2倍！）
    let noiseInterval = keys.b ? 8 : 15;
    
    if (moved && this.tmr % noiseInterval === 0) {
        let words = keys.b 
            ? ['ダダダ!!', 'ドタタタ!', 'ゥアアア!', 'うるせぇ!!'] 
            : ['ドスッ!', 'バァーン!', 'スサッ', 'ドン!'];
        let cols = ['#f00', '#ff0', '#f0f', '#0ff'];
        
        this.texts.push({
            x: this.p.x + (Math.random()-0.5)*60,
            y: this.p.y + (Math.random()-0.5)*60,
            text: words[Math.floor(Math.random()*words.length)],
            col: cols[Math.floor(Math.random()*cols.length)],
            life: 60, maxLife: 60,
            size: 25 + Math.random()*25,
            rot: (Math.random()-0.5)*0.5 // 文字の傾き
        });
        
        // ランダムでウザい音を鳴らす
        if (typeof playSnd !== 'undefined') playSnd(Math.random() < 0.5 ? 'hit' : 'jmp'); 
    }
    
    // --- 文字の更新（ゆっくり上に昇って消える） ---
    for (let i = this.texts.length - 1; i >= 0; i--) {
        let t = this.texts[i];
        t.life--;
        t.y -= 0.3; // ゆっくり上昇
        if (t.life <= 0) this.texts.splice(i, 1);
    }
  },
  
  draw() {
    // 背景（無機質な基地の床）
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
    
    // 床のグリッド線
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke(); }
    for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }
    
    if (this.st === 'title') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
        ctx.fillStyle = '#f80'; ctx.font = 'bold 24px monospace';
        ctx.fillText('NOISE AGENT', 20, 100);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText('- 爆音スニーキング -', 45, 120);
        if (this.tmr % 60 < 30) {
            ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 45, 200);
        }
        return;
    }
    
    // プレイヤー（ミュート）の描画
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.stroke();
    
    // --- 📢 ウザい文字の描画（すべての上に描画されて視界を塞ぐ） ---
    for (let t of this.texts) {
        ctx.fillStyle = t.col;
        // アメコミ風の極太フォント
        ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
        ctx.strokeStyle = '#000'; 
        ctx.lineWidth = 5;
        
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.rot);
        
        // 縁取りと文字の描画
        ctx.globalAlpha = t.life / t.maxLife; // 徐々に薄くなる
        ctx.strokeText(t.text, 0, 0);
        ctx.fillText(t.text, 0, 0);
        ctx.globalAlpha = 1.0;
        
        ctx.restore();
    }
  }
};
