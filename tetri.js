// === TETRIVADER - NEW SKINS & BALANCED DANMAKU ===
const Tetri = {
  mode: 'normal', difficultySelect: false, brd: [], blts: [], m: null, px: 4.5, cool: 0, sc: 0, st: 'play', dropCounter: 0, combo: 0,
  starFall: false, starY: 0, starX: 5, danmakuMode: false, danmakuTimer: 0, danmakuBullets: [], playerHit: false, scoreBeforeDanmaku: 0, playerSkin: 0,
  
  init(start = false) {
    if (!start) { this.difficultySelect = true; this.mode = 'normal'; return; }
    this.difficultySelect = false; this.brd = Array(15).fill().map(() => Array(10).fill(0)); this.px = 4.5; this.cool = 0; this.sc = 0; this.blts = []; this.st = 'play';
    this.dropCounter = 0; this.combo = 0; this.starFall = false; this.starY = 0; this.starX = 5; this.danmakuMode = false; this.danmakuTimer = 0; this.danmakuBullets = []; this.playerHit = false; this.scoreBeforeDanmaku = 0;
    this.spawn(); BGM.play('tetri');
  },
  
  spawn() {
    let t = Math.floor(Math.random() * 7); const M = [[[1,1,1,1]], [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]], [[1,1],[1,1]], [[0,1,1],[1,1,0]], [[0,1,0],[1,1,1]], [[1,1,0],[0,1,1]]];
    const shape = M[t].map(r => [...r]); const maxX = 10 - shape[0].length; const randomX = Math.floor(Math.random() * (maxX + 1));
    this.m = { s: shape, x: randomX, y: 0, c: ['#0ff', '#00f', '#f80', '#ff0', '#0f0', '#808', '#f00'][t] };
    if (this.hit(this.m.x, this.m.y)) this.gameover();
    if (this.mode === 'hard' && Math.random() < 0.15 && !this.starFall && !this.danmakuMode) { this.starFall = true; this.starY = 0; this.starX = Math.floor(Math.random() * 10); }
  },
  
  hit(x, y) {
    for (let r = 0; r < this.m.s.length; r++) { for (let c = 0; c < this.m.s[0].length; c++) { if (this.m.s[r][c]) { let nx = x + c, ny = y + r; if (nx < 0 || nx >= 10 || ny >= 15 || (ny >= 0 && this.brd[ny][nx])) return true; } } } return false;
  },
  
  gameover() {
    this.st = 'over'; let high = this.mode === 'normal' ? SaveSys.data.scores.n : SaveSys.data.scores.h;
    if (this.sc > high) { if (this.mode === 'normal') SaveSys.data.scores.n = this.sc; else SaveSys.data.scores.h = this.sc; SaveSys.save(); } SaveSys.addScore(this.mode, this.sc);
  },
  
  update() {
    if (keysDown.select) { if (this.difficultySelect) { this.difficultySelect = false; activeApp = Menu; Menu.init(); } else { this.st = 'over'; this.difficultySelect = false; activeApp = Menu; Menu.init(); } return; }
    if (this.difficultySelect) {
      if (keysDown.left) { this.playerSkin = (this.playerSkin + 3) % 4; playSnd('sel'); }
      if (keysDown.right) { this.playerSkin = (this.playerSkin + 1) % 4; playSnd('sel'); }
      if (keysDown.up || keysDown.down) { this.mode = this.mode === 'normal' ? 'hard' : 'normal'; playSnd('sel'); }
      if (keysDown.a) { playSnd('jmp'); this.init(true); } return;
    }
    if (this.st === 'over') { if (keysDown.a || keysDown.b) { this.difficultySelect = false; activeApp = Menu; Menu.init(); } return; }
    
    if (this.danmakuMode) {
      this.danmakuTimer--;
      if (keys.left) this.px = Math.max(0, this.px - 0.2); if (keys.right) this.px = Math.min(9, this.px + 0.2);
      
      // ★ 弾幕の発生率を 0.15 から 0.06 に下げて避けやすくしました
      if (Math.random() < 0.06) { 
        const pt = [
          {x: Math.random() * 10, y: 0, vx: 0, vy: 0.15, type: 'normal'}, 
          {x: Math.random() * 10, y: 0, vx: (Math.random() - 0.5) * 0.3, vy: 0.15, type: 'curve'}, 
          {x: Math.random() * 10, y: 0, vx: 0, vy: 0.1, type: 'accel'}
        ]; 
        this.danmakuBullets.push(pt[Math.floor(Math.random() * pt.length)]); 
      }
      
      for (let i = this.danmakuBullets.length - 1; i >= 0; i--) {
        let b = this.danmakuBullets[i]; if (b.type === 'accel') b.vy += 0.005; b.x += b.vx; b.y += b.vy;
        if (Math.abs(b.x - this.px - 0.5) < 0.4 && Math.abs(b.y - 14) < 0.4) {
          this.playerHit = true; playSnd('hit'); addParticle(this.px * 20 + 10, 14 * 20 + 10, '#f00', 'explosion'); screenShake(10);
          this.danmakuMode = false; this.danmakuBullets = []; this.playerHit = false; return;
        }
        if (b.y > 15) this.danmakuBullets.splice(i, 1);
      }
      if (this.danmakuTimer <= 0) {
        this.danmakuMode = false; this.danmakuBullets = [];
        if (!this.playerHit) { const bScore = this.scoreBeforeDanmaku; this.sc = bScore + ((this.sc - bScore) * 2); playSnd('combo'); addParticle(100, 150, '#ff0', 'explosion'); screenShake(8); }
        this.playerHit = false;
      }
      return;
    }
    
    if (keys.left) this.px = Math.max(0, this.px - 0.15); if (keys.right) this.px = Math.min(9, this.px + 0.15);
    if (keysDown.a && this.cool <= 0) { this.blts.push({x: this.px + 0.5, y: 14}); this.cool = 10; playSnd('jmp'); addParticle(this.px * 20 + 10, 14 * 20, '#ff0', 'star'); }
    if (this.cool > 0) this.cool--;
    
    if (this.starFall) {
      this.starY += 0.1;
      if (this.starY >= 14) { this.scoreBeforeDanmaku = this.sc; this.danmakuMode = true; this.danmakuTimer = 600; this.starFall = false; playSnd('combo'); screenShake(5); }
      for (let i = this.blts.length - 1; i >= 0; i--) { let b = this.blts[i]; if (Math.abs(Math.floor(b.x) - this.starX) < 1 && Math.abs(Math.floor(b.y) - this.starY) < 1) { this.starFall = false; this.blts.splice(i, 1); break; } }
    }
    
    for (let i = this.blts.length - 1; i >= 0; i--) {
      let b = this.blts[i]; b.y -= 0.6; let h = false; let bx = Math.floor(b.x), by = Math.floor(b.y);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          let tx = bx + dx, ty = by + dy; if (ty >= 0 && ty < 15 && tx >= 0 && tx < 10 && this.brd[ty][tx]) { this.brd[ty][tx] = 0; h = true; this.sc += 3; this.combo++; addParticle(tx * 20 + 10, ty * 20 + 10, '#ff0', 'star'); }
        }
      }
      if (h) { playSnd('hit'); screenShake(2); }
      if (this.m && by >= this.m.y && by < this.m.y + this.m.s.length && bx >= this.m.x && bx < this.m.x + this.m.s[0].length) {
        let localY = by - this.m.y, localX = bx - this.m.x;
        if (this.m.s[localY] && this.m.s[localY][localX]) {
          this.m.s[localY][localX] = 0; h = true; this.sc += 10; this.combo++; playSnd('hit'); addParticle(bx * 20 + 10, by * 20 + 10, this.m.c, 'explosion'); screenShake(3);
          let isEmpty = true; for (let r = 0; r < this.m.s.length; r++) { for (let c = 0; c < this.m.s[0].length; c++) { if (this.m.s[r][c]) isEmpty = false; } }
          if (isEmpty) { this.sc += 50 + this.combo * 5; playSnd('combo'); addParticle(100, 150, '#0f0', 'explosion'); screenShake(5); this.spawn(); }
        }
      }
      if (h || b.y < 0) this.blts.splice(i, 1);
    }
    
    let baseSpeed = this.mode === 'hard' ? 15 : 25; this.dropCounter += keys.b ? 3 : 1;
    if (this.dropCounter >= baseSpeed) {
      this.dropCounter = 0;
      if (this.m) {
        this.m.y++;
        if (this.hit(this.m.x, this.m.y)) {
          this.m.y--; for (let r = 0; r < this.m.s.length; r++) { for (let c = 0; c < this.m.s[0].length; c++) { if (this.m.s[r][c] && this.m.y + r >= 0) this.brd[this.m.y + r][this.m.x + c] = this.m.c; } }
          let linesCleared = 0;
          for (let r = 14; r >= 0; r--) { if (this.brd[r].every(v => v !== 0)) { this.brd.splice(r, 1); this.brd.unshift(Array(10).fill(0)); this.sc += 100; linesCleared++; playSnd('combo'); addParticle(100, r * 20, '#fff', 'line'); screenShake(4); r++; } }
          if (linesCleared > 0) this.combo += linesCleared * 2; else this.combo = 0;
          this.spawn();
        }
      }
    }
    if (this.brd[14][Math.floor(this.px)] || this.brd[14][Math.floor(Math.min(9, this.px + 0.9))]) this.gameover();
    updateParticles();
  },
  
  draw() {
    applyShake();
    if (this.difficultySelect) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TETRIVADER', 50, 50); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('難易度を選択', 60, 80);
      const modes = [{name: 'NORMAL', desc: '標準的な難易度'}, {name: 'HARD', desc: '高速＋弾幕モード'}];
      for (let i = 0; i < 2; i++) { const sel = (i === 0 && this.mode === 'normal') || (i === 1 && this.mode === 'hard'); ctx.fillStyle = sel ? '#0f0' : '#666'; ctx.fillRect(30, 110 + i * 60, 140, 45); ctx.fillStyle = sel ? '#000' : '#aaa'; ctx.font = 'bold 14px monospace'; ctx.fillText(modes[i].name, 60, 135 + i * 60); ctx.font = '9px monospace'; ctx.fillText(modes[i].desc, 40, 148 + i * 60); }
      
      // ★ スキン名を4種類に変更
      const skinNames = ['カッコイイ戦闘機', 'バナナ', 'ペペロンチーノ', '大砲'];
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('自機スキン:', 60, 240); 
      ctx.fillText(`< ${skinNames[this.playerSkin]} >`, 100 - (skinNames[this.playerSkin].length * 5), 255);
      
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('↑↓: 難易度  ←→: スキン', 35, 275); ctx.fillText('A: 決定  SELECT: 戻る', 40, 288);
      resetShake(); return;
    }
    if (this.danmakuMode) {
      ctx.fillStyle = '#200'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('DANMAKU MODE!', 40, 30); ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('SUCCESS = x2 SCORE!', 30, 50); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`TIME: ${Math.ceil(this.danmakuTimer / 60)}`, 70, 65);
      this.danmakuBullets.forEach(b => { ctx.shadowBlur = 15; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(b.x * 20 + 10, b.y * 20 + 10, 6, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 10; ctx.shadowColor = '#ff0'; ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(b.x * 20 + 10, b.y * 20 + 10, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x * 20 + 10, b.y * 20 + 10, 1, 0, Math.PI * 2); ctx.fill(); });
      ctx.shadowBlur = 0; this.drawPlayer(this.px * 20, 14 * 20 + 5);
      drawParticles(); if (this.playerHit) { ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(0, 0, 200, 300); }
      resetShake(); return;
    }
    
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    const db = (x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x * 20, y * 20, 20, 20); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x * 20, y * 20, 20, 3); ctx.fillRect(x * 20, y * 20, 3, 20); ctx.strokeStyle = '#000'; ctx.strokeRect(x * 20, y * 20, 20, 20); };
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { if (this.brd[r][c]) db(c, r, this.brd[r][c]); } }
    if (this.m) { for (let r = 0; r < this.m.s.length; r++) { for (let c = 0; c < this.m.s[0].length; c++) { if (this.m.s[r][c]) db(this.m.x + c, this.m.y + r, this.m.c); } } }
    if (this.starFall) drawSprite(this.starX * 20 + 5, this.starY * 20 + 5, '#ff0', sprs.star, 2);
    ctx.fillStyle = '#ff0'; this.blts.forEach(b => ctx.fillRect(b.x * 20 - 2, b.y * 20 - 8, 4, 12));
    this.drawPlayer(this.px * 20, 14 * 20 + 5);
    drawParticles(); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let hi = this.mode === 'normal' ? SaveSys.data.scores.n : SaveSys.data.scores.h; ctx.fillText(`SC:${this.sc} HI:${hi}`, 5, 12);
    if (this.combo > 2) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 12px monospace'; ctx.fillText(`x${this.combo}`, 165, 12); }
    if (this.st === 'over') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 60); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('GAMEOVER', 55, 125); ctx.font = '10px monospace'; ctx.fillText('(A) Menu', 65, 145); }
    resetShake();
  },
  
  // ★ 新しいスキンを呼び出して描画する関数
  drawPlayer(x, y) {
    const skinList = [sprs.fighter, sprs.banana, sprs.peperoncino, sprs.cannon];
    drawSprite(x - 5, y - 5, '#fff', skinList[this.playerSkin], 2.0);
  }
};
