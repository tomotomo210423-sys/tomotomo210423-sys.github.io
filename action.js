// === UNREASONABLE BROS ===
const Action = {
  st: 'title', map: [], platforms: [], coins: [], spikes: [], enemies: [], invisibleBlocks: [], fakeCoins: [],
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1}, score: 0, camX: 0, coyoteTime: 0, stageTheme: 'grass',
  init() { this.st = 'title'; BGM.play('action'); },
  load() {
    this.st = 'play'; this.p = {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1};
    this.map = []; this.platforms = []; this.coins = []; this.spikes = []; this.enemies = []; this.invisibleBlocks = []; this.fakeCoins = [];
    this.score = 0; this.camX = 0; this.coyoteTime = 0;
    const stage = SaveSys.data.actStage; this.stageTheme = stage === 1 ? 'grass' : stage === 2 ? 'desert' : 'lava';
    for (let i = 0; i < 50; i++) this.map.push({x: i * 20, y: 270, w: 20, h: 30, type: 'ground'});
    if (stage === 1) {
      this.platforms.push({x: 150, y: 230, w: 40, h: 10}); this.platforms.push({x: 250, y: 200, w: 40, h: 10}); this.platforms.push({x: 350, y: 170, w: 60, h: 10});
      this.fakeCoins.push({x: 170, y: 210, fake: true, touched: false}); this.coins.push({x: 270, y: 180, collected: false}); this.coins.push({x: 380, y: 150, collected: false});
      this.invisibleBlocks.push({x: 450, y: 200, w: 40, h: 10, visible: false}); this.enemies.push({x: 300, y: 260, vx: 1, type: 'patrol', range: 80, startX: 300, enemyType: 'slime'}); this.spikes.push({x: 500, y: 260, w: 20, h: 10});
    } else if (stage === 2) {
      this.platforms.push({x: 120, y: 240, w: 30, h: 10, disappear: true, timer: 0}); this.platforms.push({x: 200, y: 210, w: 30, h: 10, moving: true, vx: 2, range: 60, startX: 200});
      this.platforms.push({x: 320, y: 180, w: 30, h: 10}); this.platforms.push({x: 420, y: 150, w: 30, h: 10, fake: true});
      this.fakeCoins.push({x: 140, y: 220, fake: true, touched: false}); this.fakeCoins.push({x: 220, y: 190, fake: true, touched: false}); this.coins.push({x: 340, y: 160, collected: false});
      this.invisibleBlocks.push({x: 500, y: 190, w: 40, h: 10, visible: false}); this.enemies.push({x: 250, y: 260, vx: 2, type: 'patrol', range: 100, startX: 250, enemyType: 'flying'});
      this.enemies.push({x: 450, y: 260, vx: -2, type: 'chase', range: 150, startX: 450, enemyType: 'fast'}); this.spikes.push({x: 350, y: 260, w: 30, h: 10}); this.spikes.push({x: 600, y: 260, w: 30, h: 10});
    } else {
      this.platforms.push({x: 120, y: 240, w: 25, h: 10, disappear: true, timer: 0}); this.platforms.push({x: 200, y: 210, w: 25, h: 10, moving: true, vx: 2.5, range: 50, startX: 200});
      this.platforms.push({x: 300, y: 180, w: 25, h: 10, fake: true}); this.platforms.push({x: 380, y: 150, w: 30, h: 10, moving: true, vx: -3, range: 70, startX: 380}); this.platforms.push({x: 500, y: 190, w: 30, h: 10});
      this.fakeCoins.push({x: 140, y: 220, fake: true, touched: false}); this.fakeCoins.push({x: 220, y: 190, fake: true, touched: false}); this.fakeCoins.push({x: 320, y: 160, fake: true, touched: false});
      this.coins.push({x: 400, y: 130, collected: false}); this.coins.push({x: 520, y: 170, collected: false});
      this.invisibleBlocks.push({x: 600, y: 220, w: 35, h: 10, visible: false}); this.invisibleBlocks.push({x: 680, y: 190, w: 35, h: 10, visible: false});
      this.enemies.push({x: 250, y: 260, vx: 2.5, type: 'patrol', range: 120, startX: 250, enemyType: 'slime'}); this.enemies.push({x: 450, y: 260, vx: -2.5, type: 'chase', range: 180, startX: 450, enemyType: 'flying'});
      this.enemies.push({x: 650, y: 260, vx: 3, type: 'patrol', range: 100, startX: 650, enemyType: 'fast'}); this.spikes.push({x: 550, y: 260, w: 30, h: 10}); this.spikes.push({x: 750, y: 260, w: 30, h: 10});
    }
    this.map.push({x: 850, y: 220, w: 30, h: 50, type: 'goal'});
  },
  die() {
    SaveSys.data.actLives--; SaveSys.save(); playSnd('hit'); screenShake(8); addParticle(this.p.x, this.p.y, '#00f', 'explosion');
    if (SaveSys.data.actLives < 0) { SaveSys.data.actStage = 1; SaveSys.data.actLives = 3; SaveSys.save(); this.st = 'gameover'; } else this.st = 'dead';
  },
  update() {
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if (this.st === 'title') { if (keysDown.a) { this.load(); playSnd('jmp'); } return; }
    if (this.st !== 'play') { if (keysDown.a) { if (this.st === 'clear') { activeApp = Menu; Menu.init(); } else this.load(); } return; }
    if (keys.left) { this.p.vx -= 1.2; this.p.dir = -1; }
    if (keys.right) { this.p.vx += 1.2; this.p.dir = 1; }
    this.p.vx = Math.max(-5, Math.min(5, this.p.vx)); this.p.vx *= 0.88; this.p.vy += 0.5; this.p.anim = (this.p.anim + Math.abs(this.p.vx)) % 360;
    let nx = this.p.x + this.p.vx; let ny = this.p.y + this.p.vy; let grounded = false;
    for (let m of this.map) {
      if (m.type === 'ground' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) { if (this.p.vy > 0) { ny = m.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; } }
      if (m.type === 'goal' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) {
        SaveSys.data.actStage++; SaveSys.save(); playSnd('combo');
        if (SaveSys.data.actStage > 3) { this.st = 'clear'; SaveSys.data.actStage = 1; SaveSys.save(); } else this.load(); return;
      }
    }
    for (let plat of this.platforms) {
      if (plat.moving) { plat.x += plat.vx; if (Math.abs(plat.x - plat.startX) > plat.range) plat.vx *= -1; }
      if (plat.disappear && plat.timer > 0) { plat.timer--; if (plat.timer === 0) plat.disappeared = true; }
      if (plat.disappeared) continue;
      if (plat.fake && nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) { if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { plat.fake = false; plat.falling = true; playSnd('hit'); } }
      if (plat.falling) { plat.y += 3; if (plat.y > 400) plat.disappeared = true; continue; }
      if (nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) {
        if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { ny = plat.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; if (plat.disappear && !plat.timer) plat.timer = 30; if (plat.moving) nx += plat.vx; }
      }
    }
    for (let ib of this.invisibleBlocks) {
      if (nx + 20 > ib.x && nx < ib.x + ib.w && ny + 20 > ib.y && ny < ib.y + ib.h) { ib.visible = true; if (this.p.vy > 0 && this.p.y + 20 <= ib.y + 5) { ny = ib.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; } }
    }
    for (let coin of this.coins) {
      if (!coin.collected && Math.abs(nx + 10 - coin.x) < 15 && Math.abs(ny + 10 - coin.y) < 15) { coin.collected = true; this.score += 100; playSnd('combo'); addParticle(coin.x, coin.y, '#ff0', 'explosion'); }
    }
    for (let fc of this.fakeCoins) {
      if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) { fc.touched = true; this.p.vy = -8; playSnd('hit'); addParticle(fc.x, fc.y, '#f00', 'explosion'); screenShake(5); }
    }
    for (let spike of this.spikes) { if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) { this.die(); return; } }
    for (let e of this.enemies) {
      if (e.type === 'patrol') { e.x += e.vx; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; } 
      else if (e.type === 'chase') { const dist = Math.abs(this.p.x - e.x); if (dist < e.range) { e.vx = (this.p.x > e.x) ? Math.abs(e.vx) : -Math.abs(e.vx); e.x += e.vx; } else { e.x += e.vx * 0.3; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; } }
      e.anim = (e.anim || 0) + Math.abs(e.vx) * 2;
      if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) {
        if (this.p.vy > 0 && ny < e.y) { e.y = 9999; this.p.vy = -6; this.score += 50; playSnd('hit'); addParticle(e.x, e.y, '#a00', 'explosion'); screenShake(4); } else { this.die(); return; }
      }
    }
    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    if ((grounded || this.coyoteTime > 0) && keysDown.a) { this.p.vy = -10; this.p.jumpCount++; this.coyoteTime = 0; playSnd('jmp'); addParticle(this.p.x + 10, this.p.y + 20, '#fff', 'star'); }
    this.p.x = Math.max(0, nx); this.p.y = ny;
    if (this.p.y > 320) this.die();
    this.camX = Math.max(0, Math.min(this.p.x - 100, 700));
    updateParticles();
  },
  draw() {
    applyShake();
    if (this.st === 'title') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300); gradient.addColorStop(0, '#f40'); gradient.addColorStop(1, '#820'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
      ctx.shadowBlur = 20; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText('UNREASONABLE', 30, 80); ctx.fillText('BROTHERS', 45, 105); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('～理不尽なアクション～', 30, 130);
      for (let i = 0; i < 5; i++) { const x = 30 + i * 30; const y = 160 + Math.sin(Date.now() / 200 + i) * 5; drawSprite(x, y, '#00f', sprs.heroNew, 2.5); }
      if (Math.floor(Date.now() / 500) % 2) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 14px monospace'; ctx.fillText('PRESS A START', 35, 230); }
      ctx.fillStyle = '#f00'; ctx.font = '9px monospace'; ctx.fillText('※即死トラップ注意！', 50, 260); ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('SELECT: 戻る', 65, 285);
      resetShake(); return;
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    if (this.stageTheme === 'grass') { gradient.addColorStop(0, '#4af'); gradient.addColorStop(1, '#8cf'); } 
    else if (this.stageTheme === 'desert') { gradient.addColorStop(0, '#fc8'); gradient.addColorStop(1, '#fa4'); } 
    else { gradient.addColorStop(0, '#f44'); gradient.addColorStop(1, '#a00'); }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
    if (this.stageTheme === 'desert') { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(30, 50, 20, 0, Math.PI * 2); ctx.fill(); } 
    else if (this.stageTheme === 'lava') { ctx.fillStyle = 'rgba(255,100,0,0.3)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(50 + i * 60, 280, 30, 0, Math.PI * 2); ctx.fill(); } }

    for (let m of this.map) {
      if (m.x - this.camX > -50 && m.x - this.camX < 250) {
        if (m.type === 'ground') {
          ctx.fillStyle = this.stageTheme === 'grass' ? '#8b4513' : this.stageTheme === 'desert' ? '#d2b48c' : '#444'; ctx.fillRect(m.x - this.camX, m.y, m.w, m.h);
          ctx.fillStyle = this.stageTheme === 'grass' ? '#6b3513' : this.stageTheme === 'desert' ? '#c19a6b' : '#222'; ctx.fillRect(m.x - this.camX, m.y, m.w, 5);
        } else if (m.type === 'goal') { ctx.fillStyle = '#ffd700'; ctx.fillRect(m.x - this.camX, m.y, m.w, m.h); ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('★', m.x - this.camX + 7, m.y + 30); }
      }
    }
    for (let plat of this.platforms) {
      if (plat.disappeared) continue;
      if (plat.x - this.camX > -50 && plat.x - this.camX < 250) {
        if (plat.disappear && plat.timer > 0 && plat.timer < 15) ctx.globalAlpha = plat.timer / 15;
        ctx.fillStyle = plat.fake ? '#964' : '#654321'; ctx.fillRect(plat.x - this.camX, plat.y, plat.w, plat.h); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(plat.x - this.camX, plat.y, plat.w, 2); ctx.globalAlpha = 1;
      }
    }
    for (let ib of this.invisibleBlocks) {
      if (ib.x - this.camX > -50 && ib.x - this.camX < 250) {
        if (ib.visible) { ctx.fillStyle = '#888'; ctx.fillRect(ib.x - this.camX, ib.y, ib.w, ib.h); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(ib.x - this.camX, ib.y, ib.w, 2); } 
        else { ctx.strokeStyle = 'rgba(136,136,136,0.2)'; ctx.strokeRect(ib.x - this.camX, ib.y, ib.w, ib.h); }
      }
    }
    for (let coin of this.coins) {
      if (!coin.collected && coin.x - this.camX > -50 && coin.x - this.camX < 250) {
        const offset = Math.sin(Date.now() / 100) * 3; ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(coin.x - this.camX, coin.y + offset, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      }
    }
    for (let fc of this.fakeCoins) {
      if (!fc.touched && fc.x - this.camX > -50 && fc.x - this.camX < 250) {
        const offset = Math.sin(Date.now() / 100) * 3; ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(fc.x - this.camX, fc.y + offset, 6, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f80'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      }
    }
    for (let spike of this.spikes) { if (spike.x - this.camX > -50 && spike.x - this.camX < 250) drawSprite(spike.x - this.camX, spike.y, '#888', sprs.spike, 2.5); }
    for (let e of this.enemies) {
      if (e.y < 300 && e.x - this.camX > -50 && e.x - this.camX < 250) {
        const offsetY = e.enemyType === 'flying' ? Math.sin((e.anim || 0) * Math.PI / 180) * 4 : Math.sin((e.anim || 0) * Math.PI / 180) * 2;
        const color = e.enemyType === 'flying' ? '#08f' : e.enemyType === 'fast' ? '#f80' : '#a00';
        drawSprite(e.x - this.camX - 4, e.y + offsetY - 4, color, sprs.enemyNew, 2.5);
      }
    }
    if (this.st !== 'dead' && this.st !== 'gameover') {
      ctx.save(); if (this.p.dir < 0) { ctx.scale(-1, 1); ctx.translate(-((this.p.x - this.camX) * 2 + 20), 0); } drawSprite(this.p.x - this.camX, this.p.y, '#00f', sprs.heroNew, 2.5); ctx.restore();
    }
    drawParticles();
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 200, 32); ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText(`ST:${SaveSys.data.actStage} ♥:${SaveSys.data.actLives}`, 5, 12); ctx.fillText(`SC:${this.score}`, 5, 25);
    if (this.st === 'dead' || this.st === 'gameover') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 60); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText(this.st === 'gameover' ? 'GAMEOVER' : 'OOPS!', 60, 125); ctx.font = '10px monospace'; ctx.fillText('(A) ' + (this.st === 'gameover' ? 'Menu' : 'Retry'), 55, 145); }
    if (this.st === 'clear') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 60); ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('CLEAR!', 65, 125); ctx.font = '10px monospace'; ctx.fillText('(A) Menu', 60, 145); }
    resetShake();
  }
};
