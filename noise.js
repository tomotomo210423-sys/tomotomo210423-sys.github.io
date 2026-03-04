// === NOISE AGENT (Phase 2: Stealth Kill & Annoying Vision Jack) ===
const Noise = {
  st: 'title',
  tmr: 0,
  p: { x: 200, y: 350, r: 6, spd: 2, dir: -Math.PI/2 }, // プレイヤー
  cam: { x: 0, y: 0 },
  map: { w: 400, h: 400 },
  goal: { x: 200, y: 30, r: 20 },
  
  enemies: [],
  worldTexts: [], // 足音用（マップに追従）
  uiTexts: [],    // キル用（画面にべったり張り付く）
  flash: 0,
  stage: 1,
  
  init() {
    this.st = 'title';
    this.tmr = 0;
    this.initStage();
  },

  initStage() {
    this.p = { x: 200, y: 360, r: 6, spd: 2, dir: -Math.PI/2 };
    this.worldTexts = [];
    this.uiTexts = [];
    this.enemies = [];
    this.flash = 0;
    
    // ステージが進むごとに敵が増える
    let numEnemies = 3 + this.stage * 2;
    for(let i=0; i<numEnemies; i++) {
        this.enemies.push({
            x: 50 + Math.random() * 300,
            y: 80 + Math.random() * 200,
            dir: Math.floor(Math.random() * 4) * (Math.PI/2), // 4方向のどれか
            spd: 0.8 + Math.random() * 0.5,
            state: 'walk',
            tmr: 60 + Math.random() * 60
        });
    }
  },
  
  // 角度を -PI 〜 PI に正規化する便利関数
  normAngle(a) {
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      return a;
  },

  update() {
    if (typeof keysDown !== 'undefined' && keysDown.select) { switchApp(Menu); return; }
    
    if (this.st === 'title') {
        if (typeof keysDown !== 'undefined' && keysDown.a) { 
            this.st = 'play'; this.initStage(); 
            if (typeof playSnd !== 'undefined') playSnd('jmp'); 
        }
        return;
    }

    if (this.st === 'gameover' || this.st === 'clear') {
        if (this.tmr > 60 && typeof keysDown !== 'undefined' && keysDown.a) {
            if (this.st === 'clear') this.stage++;
            else this.stage = 1;
            this.st = 'play';
            this.initStage();
        }
        this.tmr++;
        return;
    }
    
    this.tmr++;
    if (this.flash > 0) this.flash--;
    
    // --- 1. プレイヤーの移動とウザい足音 ---
    let moved = false;
    let vx = 0, vy = 0;
    let currentSpd = (typeof keys !== 'undefined' && keys.b) ? this.p.spd * 1.8 : this.p.spd;
    
    if (typeof keys !== 'undefined') {
        if (keys.left)  { vx -= currentSpd; moved = true; }
        if (keys.right) { vx += currentSpd; moved = true; }
        if (keys.up)    { vy -= currentSpd; moved = true; }
        if (keys.down)  { vy += currentSpd; moved = true; }
    }
    
    if (vx !== 0 || vy !== 0) {
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        this.p.x += vx; this.p.y += vy;
        this.p.dir = Math.atan2(vy, vx);
    }
    
    // 画面外制限
    this.p.x = Math.max(10, Math.min(this.map.w - 10, this.p.x));
    this.p.y = Math.max(10, Math.min(this.map.h - 10, this.p.y));
    
    // 📢 足音エフェクト
    let noiseInterval = (typeof keys !== 'undefined' && keys.b) ? 8 : 15;
    if (moved && this.tmr % noiseInterval === 0) {
        let words = keys.b ? ['ダダダ!!', 'ﾄﾞﾀﾀﾀ!', 'ｱｱｱ!'] : ['ドスッ!', 'ﾊﾞｧｰﾝ!', 'ｽｻｯ'];
        let cols = ['#f00', '#ff0', '#f0f', '#0ff'];
        this.worldTexts.push({
            x: this.p.x + (Math.random()-0.5)*40,
            y: this.p.y + (Math.random()-0.5)*40,
            text: words[Math.floor(Math.random()*words.length)],
            col: cols[Math.floor(Math.random()*cols.length)],
            life: 60, maxLife: 60, size: 20 + Math.random()*20, rot: (Math.random()-0.5)*0.5
        });
        if (typeof playSnd !== 'undefined') playSnd(Math.random() < 0.5 ? 'hit' : 'jmp'); 
    }

    // --- 2. 敵のAI（巡回と視界） ---
    for (let i = this.enemies.length - 1; i >= 0; i--) {
        let e = this.enemies[i];
        
        // 移動処理
        if (e.state === 'walk') {
            e.x += Math.cos(e.dir) * e.spd;
            e.y += Math.sin(e.dir) * e.spd;
            e.tmr--;
            if (e.tmr <= 0 || e.x < 20 || e.x > this.map.w-20 || e.y < 20 || e.y > this.map.h-20) {
                e.state = 'turn'; e.tmr = 30 + Math.random()*30;
            }
        } else if (e.state === 'turn') {
            e.tmr--;
            if (e.tmr <= 0) {
                e.dir += (Math.random() > 0.5 ? 1 : -1) * (Math.PI/2); // 90度回転
                e.state = 'walk'; e.tmr = 60 + Math.random()*60;
            }
        }

        // 🚨 視界判定（赤いコーン）
        let dx = this.p.x - e.x;
        let dy = this.p.y - e.y;
        let dist = Math.hypot(dx, dy);
        if (dist < 70) {
            let angleToP = Math.atan2(dy, dx);
            let angleDiff = Math.abs(this.normAngle(angleToP - e.dir));
            // 正面45度（PI/4）以内にいて、近ければ発見される！
            if (angleDiff < Math.PI / 4) {
                this.st = 'gameover'; this.tmr = 0;
                this.uiTexts.push({text: '!! FOUND !!', x: 100, y: 150, life: 120, maxLife: 120, size: 40, col: '#f00'});
                if (typeof playSnd !== 'undefined') playSnd('hit');
                if (typeof screenShake !== 'undefined') screenShake(10);
            }
        }

        // 🗡️ ステルスキル判定（敵の背後でAボタン）
        if (typeof keysDown !== 'undefined' && keysDown.a && dist < 20) {
            let angleToE = Math.atan2(-dy, -dx);
            let backDiff = Math.abs(this.normAngle(angleToE - e.dir));
            // 敵の背後（向いている方向とほぼ同じ向き）にいるか
            if (backDiff < Math.PI / 2) {
                this.enemies.splice(i, 1);
                this.flash = 5;
                // 画面を覆い尽くす超絶ウザい文字！
                this.uiTexts.push({text: 'NICE KILL!!', x: 100, y: 150 + (Math.random()-0.5)*40, life: 90, maxLife: 90, size: 35, col: '#0ff', rot: (Math.random()-0.5)*0.2});
                if (typeof playSnd !== 'undefined') playSnd('combo');
                if (typeof screenShake !== 'undefined') screenShake(5);
            }
        }
    }

    // --- 3. ゴール判定 ---
    if (Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r) {
        this.st = 'clear'; this.tmr = 0;
        this.uiTexts.push({text: 'MISSION', x: 100, y: 130, life: 120, maxLife: 120, size: 30, col: '#0f0'});
        this.uiTexts.push({text: 'COMPLETE!', x: 100, y: 160, life: 120, maxLife: 120, size: 30, col: '#0f0'});
        if (typeof playSnd !== 'undefined') playSnd('sel');
    }

    // --- 4. エフェクトの更新 ---
    for (let i = this.worldTexts.length - 1; i >= 0; i--) {
        let t = this.worldTexts[i]; t.life--; t.y -= 0.3;
        if (t.life <= 0) this.worldTexts.splice(i, 1);
    }
    for (let i = this.uiTexts.length - 1; i >= 0; i--) {
        let t = this.uiTexts[i]; t.life--;
        if (t.life <= 0) this.uiTexts.splice(i, 1);
    }
  },
  
  draw() {
    // カメラの追従（滑らかに移動）
    this.cam.x += ((this.p.x - 100) - this.cam.x) * 0.1;
    this.cam.y += ((this.p.y - 150) - this.cam.y) * 0.1;
    this.cam.x = Math.max(0, Math.min(this.map.w - 200, this.cam.x));
    this.cam.y = Math.max(0, Math.min(this.map.h - 300, this.cam.y));

    // 背景
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);

    if (this.st === 'title') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
        ctx.fillStyle = '#f80'; ctx.font = 'bold 26px "Arial Black", sans-serif';
        ctx.textAlign = 'center'; ctx.fillText('NOISE AGENT', 100, 100);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText('- 爆音スニーキング -', 100, 120);
        if (this.tmr % 60 < 30) { ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 100, 200); }
        return;
    }

    ctx.save();
    ctx.translate(-this.cam.x, -this.cam.y);

    // 床のグリッド
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    for(let i=0; i<=this.map.w; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,this.map.h); ctx.stroke(); }
    for(let i=0; i<=this.map.h; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(this.map.w,i); ctx.stroke(); }

    // ゴール（機密データ）
    ctx.fillStyle = '#0a0'; ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#0f0'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText('GOAL', this.goal.x, this.goal.y + 4);

    // 敵兵と視界
    for (let e of this.enemies) {
        // 視界（赤いコーン）
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.arc(e.x, e.y, 70, e.dir - Math.PI/4, e.dir + Math.PI/4);
        ctx.lineTo(e.x, e.y);
        ctx.fill();

        // 敵本体
        ctx.fillStyle = '#080';
        ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir)*10, e.y + Math.sin(e.dir)*10); ctx.stroke();
    }

    // プレイヤー（ミュート）
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    // 向き
    ctx.beginPath(); ctx.moveTo(this.p.x, this.p.y); ctx.lineTo(this.p.x + Math.cos(this.p.dir)*8, this.p.y + Math.sin(this.p.dir)*8); ctx.stroke();

    // 📢 ウザい文字（ワールド座標：マップに追従）
    for (let t of this.worldTexts) {
        ctx.fillStyle = t.col;
        ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot);
        ctx.globalAlpha = t.life / t.maxLife; 
        ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0);
        ctx.globalAlpha = 1.0; ctx.restore();
    }

    ctx.restore(); // カメラの翻訳終了

    // 🎇 画面フラッシュ
    if (this.flash > 0) {
        ctx.fillStyle = this.tmr % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(255,0,255,0.5)';
        ctx.fillRect(0,0,200,300);
    }

    // 📢 ウザい文字（UI座標：画面にべったり張り付く）
    for (let t of this.uiTexts) {
        ctx.fillStyle = t.col;
        ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
        ctx.strokeStyle = '#000'; ctx.lineWidth = 6;
        ctx.save(); ctx.translate(t.x, t.y);
        if(t.rot) ctx.rotate(t.rot);
        ctx.globalAlpha = Math.min(1, (t.life / t.maxLife) * 2); // 消えかけだけ薄く
        ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0);
        ctx.globalAlpha = 1.0; ctx.restore();
    }

    // ステータスUI
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`STAGE: ${this.stage}`, 5, 15);
    ctx.fillText(`ENEMIES: ${this.enemies.length}`, 5, 28);
    
    if (this.st === 'gameover') {
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
        if (this.tmr > 60) ctx.fillText('PRESS [A] TO RESTART', 100, 250);
    }
  }
};
