// === UNREASONABLE BROS - RANDOM & HIGH DENSITY UPDATE ===
const Action = {
  st: 'title', map: [], platforms: [], coins: [], spikes: [], enemies: [], invisibleBlocks: [], fakeCoins: [],
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1}, score: 0, camX: 0, coyoteTime: 0, stageTheme: 'grass',
  
  init() { this.st = 'title'; BGM.play('action'); },
  
  load() {
    this.st = 'play'; this.p = {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1};
    this.map = []; this.platforms = []; this.coins = []; this.spikes = []; this.enemies = []; this.invisibleBlocks = []; this.fakeCoins = [];
    this.score = 0; this.camX = 0; this.coyoteTime = 0;
    
    const stage = SaveSys.act.stage; this.stageTheme = stage === 1 ? 'grass' : stage === 2 ? 'desert' : 'lava';
    for (let i = 0; i < 50; i++) this.map.push({x: i * 20, y: 270, w: 20, h: 30, type: 'ground'});

    // ★ ステージ生成：ランダム化 & 密度強化
    let seed = stage * 100 + SaveSys.act.randomSeed;
    let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    for (let x = 100; x < 800; x += 30 + rand() * 40) { // 密度を上げた配置
      let r = rand();
      if (r < 0.45) { // 足場
        this.platforms.push({x: x, y: 150 + rand() * 80, w: 30 + rand() * 30, h: 10});
        if (rand() < 0.4) this.coins.push({x: x + 10, y: 110 + rand() * 30, collected: false});
      } else if (r < 0.7) { // 敵
        this.enemies.push({x: x, y: 260, vx: 1 + rand(), type: 'patrol', range: 50, startX: x, enemyType: rand() > 0.5 ? 'slime' : 'flying'});
      } else if (r < 0.85) { // トゲ
        this.spikes.push({x: x, y: 260, w: 20, h: 10});
      }
      
      // 理不尽要素の密度
      if (rand() < 0.25) this.fakeCoins.push({x: x + 5, y: 120 + rand() * 100, touched: false});
      if (rand() < 0.2) this.invisibleBlocks.push({x: x, y: 180 + rand() * 40, w: 30, h: 10, visible: false});
    }
    this.map.push({x: 850, y: 220, w: 30, h: 50, type: 'goal'});
  },
  
  die() {
    SaveSys.act.lives--; SaveSys.saveAct(); playSnd('hit'); screenShake(8);
    if (SaveSys.act.lives < 0) { 
      // ★ ゲームオーバー時にランダムシードを更新して次回のステージを変える
      SaveSys.act.stage = 1; SaveSys.act.lives = 5; SaveSys.act.randomSeed = Math.floor(Math.random() * 1000);
      SaveSys.saveAct(); this.st = 'gameover'; 
    } else this.st = 'dead';
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
      if (m.type === 'goal' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) { SaveSys.act.stage++; SaveSys.saveAct(); playSnd('combo'); if (SaveSys.act.stage > 3) { this.st = 'clear'; SaveSys.act.stage = 1; SaveSys.saveAct(); } else this.load(); return; }
    }
    // 衝突判定などは既存の「理不尽」ロジックを維持
    for (let plat of this.platforms) {
      if (nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) { if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { ny = plat.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; } }
    }
    for (let coin of this.coins) { if (!coin.collected && Math.abs(nx + 10 - coin.x) < 15 && Math.abs(ny + 10 - coin.y) < 15) { coin.collected = true; this.score += 100; playSnd('combo'); addParticle(coin.x, coin.y, '#ff0', 'explosion'); } }
    for (let fc of this.fakeCoins) { if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) { fc.touched = true; this.p.vy = -12; playSnd('hit'); addParticle(fc.x, fc.y, '#f00', 'explosion'); screenShake(5); } }
    for (let spike of this.spikes) { if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) { this.die(); return; } }
    for (let e of this.enemies) {
        if (e.type === 'patrol') { e.x += e.vx; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; }
        if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) { if (this.p.vy > 0 && ny < e.y) { e.y = 9999; this.p.vy = -6; this.score += 50; playSnd('hit'); } else { this.die(); return; } }
    }
    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    if ((grounded || this.coyoteTime > 0) && keysDown.a) { this.p.vy = -10; this.p.jumpCount++; this.coyoteTime = 0; playSnd('jmp'); }
    this.p.x = Math.max(0, nx); this.p.y = ny; if (this.p.y > 320) this.die();
    this.camX = Math.max(0, Math.min(this.p.x - 100, 700));
    updateParticles();
  },
  
  draw() {
    applyShake();
    if (this.st === 'title') {
      ctx.fillStyle = '#f40'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.fillText('UNREASONABLE', 30, 80); ctx.fillText('BROTHERS', 45, 105);
      ctx.fillText('PRESS A START', 35, 230); resetShake(); return;
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    if (this.stageTheme === 'grass') { gradient.addColorStop(0, '#4af'); gradient.addColorStop(1, '#8cf'); } else { gradient.addColorStop(0, '#f44'); gradient.addColorStop(1, '#a00'); }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);

    ctx.save(); ctx.translate(-this.camX, 0);
    for (let m of this.map) { if (m.type === 'ground') { ctx.fillStyle = '#8b4513'; ctx.fillRect(m.x, m.y, m.w, m.h); } else if (m.type === 'goal') { ctx.fillStyle = '#ffd700'; ctx.fillRect(m.x, m.y, m.w, m.h); } }
    for (let plat of this.platforms) { ctx.fillStyle = '#654321'; ctx.fillRect(plat.x, plat.y, plat.w, plat.h); }
    for (let ib of this.invisibleBlocks) { if (ib.visible) { ctx.fillStyle = '#888'; ctx.fillRect(ib.x, ib.y, ib.w, ib.h); } }
    for (let coin of this.coins) { if (!coin.collected) drawSprite(coin.x - 5, coin.y, '#ff0', sprs.coin, 1.5); }
    for (let fc of this.fakeCoins) { if (!fc.touched) drawSprite(fc.x - 5, fc.y, '#f00', sprs.coin, 1.5); }
    for (let spike of this.spikes) { drawSprite(spike.x, spike.y, '#888', sprs.spike, 2.5); }
    for (let e of this.enemies) { if (e.y < 300) drawSprite(e.x - 4, e.y, '#a00', sprs.enemyNew, 2.5); }
    if (this.st !== 'dead' && this.st !== 'gameover') { ctx.save(); if (this.p.dir < 0) { ctx.scale(-1, 1); ctx.translate(-(this.p.x * 2 + 20), 0); } drawSprite(this.p.x, this.p.y, '#00f', sprs.player, 2.5); ctx.restore(); }
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 200, 32); ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText(`ST:${SaveSys.act.stage} ♥:${SaveSys.act.lives} SC:${this.score}`, 5, 20);
    if (this.st === 'dead' || this.st === 'gameover') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 60); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText(this.st === 'gameover' ? 'GAMEOVER' : 'OOPS!', 60, 125); ctx.font = '10px monospace'; ctx.fillText('(A) Menu', 65, 145); }
    resetShake();
  }
};
