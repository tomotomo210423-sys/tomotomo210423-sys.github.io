// === ONLINE BATTLE - PACING & BG UPDATE ===
const Online = {
  st: 'wait', tmr: 0, countdown: 0, p1: {y: 130, s: 0}, p2: {y: 130, s: 0, n: ''}, blt: null, trail: [],
  init() { this.st = 'wait'; this.tmr = 60; this.countdown = 0; this.p1.s = 0; this.p1.y = 130; this.p2.s = 0; this.p2.y = 130; this.p2.n = ''; this.trail = []; },
  update() {
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if (this.st === 'wait') {
      this.tmr--;
      if (this.tmr <= 0) { this.p2.n = ['Tanaka', 'xX_Pro_Xx', 'Gamer99', 'Pikachu', 'Bot_Alpha', 'Shadow', 'Nova', 'Blaze'][Math.floor(Math.random() * 8)]; this.st = 'countdown'; this.countdown = 120; playSnd('combo'); this.resetB(); }
    } else if (this.st === 'countdown') { 
      this.countdown--; if (this.countdown <= 0) { this.st = 'play'; } 
    }
    else if (this.st === 'play') {
      if (keys.up) this.p1.y = Math.max(0, this.p1.y - 3);
      if (keys.down) this.p1.y = Math.min(260, this.p1.y + 3);
      
      // bot movement
      if (this.blt.y < this.p2.y + 15) this.p2.y -= 2;
      else if (this.blt.y > this.p2.y + 25) this.p2.y += 2;
      this.p2.y = Math.max(0, Math.min(260, this.p2.y));

      this.blt.x += this.blt.vx; this.blt.y += this.blt.vy;
      this.trail.push({x: this.blt.x, y: this.blt.y, life: 5});
      this.trail.forEach(t => t.life--); this.trail = this.trail.filter(t => t.life > 0);

      if (this.blt.y <= 0 || this.blt.y >= 292) { this.blt.vy *= -1; playSnd('sel'); }
      
      // collision
      if (this.blt.vx < 0 && this.blt.x <= 20 && this.blt.x >= 10 && this.blt.y + 8 >= this.p1.y && this.blt.y <= this.p1.y + 40) {
        this.blt.vx *= -1.1; this.blt.vy += (this.blt.y - this.p1.y - 20) * 0.1; this.blt.x = 20; playSnd('hit');
      }
      if (this.blt.vx > 0 && this.blt.x >= 172 && this.blt.x <= 182 && this.blt.y + 8 >= this.p2.y && this.blt.y <= this.p2.y + 40) {
        this.blt.vx *= -1.1; this.blt.vy += (this.blt.y - this.p2.y - 20) * 0.1; this.blt.x = 172; playSnd('hit');
      }

      // ★ ラウンド終了処理（カウントダウンを挟む）
      if (this.blt.x < 0) { this.p2.s++; this.st = 'round_end'; this.countdown = 60; playSnd('hit'); screenShake(5); }
      else if (this.blt.x > 200) { this.p1.s++; this.st = 'round_end'; this.countdown = 60; playSnd('combo'); screenShake(5); }
      
    } else if (this.st === 'round_end') {
      this.countdown--;
      if (this.countdown <= 0) {
        if (this.p1.s >= 5 || this.p2.s >= 5) { this.st = 'result'; } 
        else { this.resetB(); this.st = 'countdown'; this.countdown = 90; }
      }
    } else if (this.st === 'result') {
      if (keysDown.a) { this.init(); }
    }
  },
  resetB() { this.blt = {x: 96, y: 146, vx: (Math.random()>0.5?3:-3), vy: (Math.random()-0.5)*4}; this.trail = []; },
  
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    // ★ 背景強化（サイバーなグリッド）
    ctx.strokeStyle = '#033'; ctx.lineWidth = 1;
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 300); ctx.stroke(); }
    for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); }

    if (this.st === 'wait') {
      ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('MATCHMAKING...', 50, 150);
    } else {
      ctx.strokeStyle = '#444'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(100, 0); ctx.lineTo(100, 300); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#0f0'; ctx.fillRect(10, this.p1.y, 10, 40); ctx.fillStyle = '#f00'; ctx.fillRect(180, this.p2.y, 10, 40);
      this.trail.forEach(t => { ctx.globalAlpha = t.life / 5; ctx.fillStyle = '#ff0'; ctx.fillRect(t.x, t.y, 8, 8); }); ctx.globalAlpha = 1;
      
      if (this.blt && (this.st === 'play' || this.st === 'countdown')) { ctx.shadowBlur = 10; ctx.shadowColor = '#ff0'; ctx.fillStyle = '#ff0'; ctx.fillRect(this.blt.x, this.blt.y, 8, 8); ctx.shadowBlur = 0; }
      
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('YOU', 15, 20); ctx.fillText(this.p2.n.slice(0, 10), 180 - this.p2.n.length*6, 20);
      ctx.font = '20px monospace'; ctx.fillText(this.p1.s, 40, 40); ctx.fillText(this.p2.s, 150, 40);

      // ★ カウントダウンの描画
      if (this.st === 'countdown') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 120, 200, 60);
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 20px monospace'; ctx.fillText(Math.ceil(this.countdown / 30), 95, 150); 
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('READY...', 80, 170);
      }
      if (this.st === 'result') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 100);
        ctx.fillStyle = this.p1.s > this.p2.s ? '#0f0' : '#f00'; ctx.font = 'bold 20px monospace'; 
        ctx.fillText(this.p1.s > this.p2.s ? 'YOU WIN!' : 'YOU LOSE', 55, 140);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS A TO RESTART', 50, 170);
      }
    }
  }
};
