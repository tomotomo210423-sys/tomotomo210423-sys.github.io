// === ONLINE BATTLE ===
const Online = {
  st: 'wait', tmr: 0, countdown: 0, p1: {y: 130, s: 0}, p2: {y: 130, s: 0, n: ''}, blt: null, trail: [],
  init() { this.st = 'wait'; this.tmr = 60; this.countdown = 0; this.p1.s = 0; this.p1.y = 130; this.p2.s = 0; this.p2.y = 130; this.p2.n = ''; this.trail = []; },
  update() {
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if (this.st === 'wait') {
      this.tmr--;
      if (this.tmr <= 0) { this.p2.n = ['Tanaka', 'xX_Pro_Xx', 'Gamer99', 'Pikachu', 'Bot_Alpha', 'Shadow', 'Nova', 'Blaze'][Math.floor(Math.random() * 8)]; this.st = 'countdown'; this.countdown = 180; playSnd('combo'); }
    } else if (this.st === 'countdown') { this.countdown--; if (this.countdown <= 0) { this.st = 'play'; this.resetB(); } }
    else if (this.st === 'play') {
      if (keys.up) this.p1.y = Math.max(0, this.p1.y - 3); if (keys.down) this.p1.y = Math.min(260, this.p1.y + 3);
      if (this.blt && this.blt.vx > 0) { if (this.p2.y + 20 < this.blt.y) this.p2.y += 2; else if (this.p2.y + 20 > this.blt.y) this.p2.y -= 2; }
      if (this.blt) {
        this.trail.push({x: this.blt.x, y: this.blt.y, life: 5});
        for (let i = this.trail.length - 1; i >= 0; i--) { this.trail[i].life--; if (this.trail[i].life <= 0) this.trail.splice(i, 1); }
        this.blt.x += this.blt.vx; this.blt.y += this.blt.vy;
        if (this.blt.y < 0 || this.blt.y > 290) { this.blt.vy *= -1; screenShake(2); }
        if (this.blt.x <= 20 && this.blt.x > 5 && Math.abs((this.p1.y + 20) - this.blt.y) < 24) { this.blt.vx = Math.abs(this.blt.vx) * 1.05; this.blt.x = 20; playSnd('jmp'); addParticle(25, this.p1.y + 20, '#0f0', 'explosion'); screenShake(3); }
        if (this.blt.x >= 172 && this.blt.x < 185 && Math.abs((this.p2.y + 20) - this.blt.y) < 24) { this.blt.vx = -Math.abs(this.blt.vx) * 1.05; this.blt.x = 172; playSnd('jmp'); addParticle(175, this.p2.y + 20, '#f00', 'explosion'); screenShake(3); }
        if (this.blt.x < 0) { this.p2.s++; playSnd('hit'); addParticle(0, this.blt.y, '#f00', 'explosion'); screenShake(5); this.resetB(); }
        if (this.blt.x > 200) { this.p1.s++; playSnd('hit'); addParticle(200, this.blt.y, '#0f0', 'explosion'); screenShake(5); this.resetB(); }
      }
      if (this.p1.s >= 5 || this.p2.s >= 5) this.st = 'end';
    } else if (this.st === 'end') { if (keysDown.a) { activeApp = Menu; Menu.init(); } }
    updateParticles();
  },
  resetB() { this.blt = { x: 100, y: 150, vx: (Math.random() < 0.5 ? 3 : -3), vy: (Math.random() * 4 - 2) }; this.trail = []; },
  draw() {
    applyShake(); ctx.fillStyle = '#113'; ctx.fillRect(0, 0, 200, 300);
    if (this.st === 'wait') {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('MATCHING...', 50, 130); ctx.fillText('.'.repeat((Math.floor(this.tmr / 10) % 4)), 140, 130);
    } else if (this.st === 'countdown') {
      ctx.strokeStyle = '#444'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(100, 0); ctx.lineTo(100, 300); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#0f0'; ctx.fillRect(10, this.p1.y, 10, 40); ctx.fillStyle = '#f00'; ctx.fillRect(180, this.p2.y, 10, 40);
      ctx.fillStyle = '#0ff'; ctx.font = '12px monospace'; ctx.fillText('MATCHED!', 65, 80); ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('YOU', 10, 20); ctx.fillText(this.p2.n.slice(0, 10), 120, 20);
      ctx.shadowBlur = 20; ctx.shadowColor = '#ff0'; ctx.fillStyle = '#ff0'; ctx.font = 'bold 60px monospace'; ctx.fillText(Math.ceil(this.countdown / 60), 85, 180); ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('READY...', 70, 220);
    } else {
      ctx.strokeStyle = '#444'; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(100, 0); ctx.lineTo(100, 300); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#0f0'; ctx.fillRect(10, this.p1.y, 10, 40); ctx.fillStyle = '#f00'; ctx.fillRect(180, this.p2.y, 10, 40);
      this.trail.forEach(t => { ctx.globalAlpha = t.life / 5; ctx.fillStyle = '#ff0'; ctx.fillRect(t.x, t.y, 6, 6); }); ctx.globalAlpha = 1;
      if (this.blt) { ctx.shadowBlur = 10; ctx.shadowColor = '#ff0'; ctx.fillStyle = '#ff0'; ctx.fillRect(this.blt.x, this.blt.y, 8, 8); ctx.shadowBlur = 0; }
      drawParticles();
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('YOU', 10, 20); ctx.fillText(this.p2.n.slice(0, 10), 120, 20); ctx.font = 'bold 24px monospace'; ctx.fillText(this.p1.s, 40, 45); ctx.fillText(this.p2.s, 140, 45);
      if (this.st === 'end') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 100, 200, 80); ctx.shadowBlur = 15; ctx.shadowColor = this.p1.s >= 5 ? '#0f0' : '#f00'; ctx.fillStyle = this.p1.s >= 5 ? '#0f0' : '#f00'; ctx.font = 'bold 18px monospace'; ctx.fillText(this.p1.s >= 5 ? 'YOU WIN!' : 'YOU LOSE', 50, 135); ctx.shadowBlur = 0; ctx.font = '11px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('(A) メニューへ', 50, 160);
      }
    }
    resetShake();
  }
};
