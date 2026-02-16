// === UNREASONABLE BROS - DENSITY, BG & REASON UPDATE ===
const Action = {
  st: 'title', map: [], platforms: [], coins: [], spikes: [], enemies: [], invisibleBlocks: [], fakeCoins: [],
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1}, score: 0, camX: 0, coyoteTime: 0, stageTheme: 'grass',
  mIdx: 1, deathReason: '', // 死因テキスト用
  
  init() { this.st = 'title'; BGM.play('action'); },
  
  load() {
    this.st = 'play'; this.p = {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1};
    this.map = []; this.platforms = []; this.coins = []; this.spikes = []; this.enemies = []; this.invisibleBlocks = []; this.fakeCoins = [];
    this.score = 0; this.camX = 0; this.coyoteTime = 0; this.deathReason = '';
    
    const stage = SaveSys.act.stage; 
    this.stageTheme = stage % 3 === 1 ? 'grass' : stage % 3 === 2 ? 'desert' : 'lava';
    
    // ステージを長く設定（約2.5倍）
    for (let i = 0; i < 100; i++) this.map.push({x: i * 20, y: 270, w: 20, h: 30, type: 'ground'});

    let seed = stage * 100 + SaveSys.act.randomSeed;
    let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    // 配置間隔を広げ、オブジェクトの重なりを防止
    for (let x = 100; x < 1900; x += 60 + rand() * 60) {
      let r = rand();
      if (r < 0.45) { // 足場（消える足場を追加）
        let py = 140 + rand() * 90;
        let isDisappear = rand() < 0.3; // 30%の確率で消える床
        this.platforms.push({x: x, y: py, w: 30 + rand() * 30, h: 10, disappear: isDisappear, timer: 0});
        if (rand() < 0.5) this.coins.push({x: x + 10, y: py - 30, collected: false});
      } else if (r < 0.75) { // 敵
        this.enemies.push({x: x, y: 260, vx: 1.0 + rand(), type: 'patrol', range: 40 + rand() * 60, startX: x, enemyType: rand() > 0.5 ? 'slime' : 'flying'});
      } else if (r < 0.9) { // トゲ
        this.spikes.push({x: x, y: 260, w: 20, h: 10});
      }
      
      // 理不尽要素
      if (rand() < 0.3) this.fakeCoins.push({x: x + 5, y: 100 + rand() * 120, touched: false});
      if (rand() < 0.25) this.invisibleBlocks.push({x: x, y: 170 + rand() * 50, w: 30, h: 10, visible: false});
    }
    this.map.push({x: 1950, y: 220, w: 30, h: 50, type: 'goal'});
  },
  
  die(reason) {
    this.deathReason = reason;
    SaveSys.act.lives--; SaveSys.saveAct(); playSnd('hit'); screenShake(8); addParticle(this.p.x, this.p.y, '#00f', 'explosion');
    if (SaveSys.act.lives < 0) { 
      SaveSys.act.stage = 1; SaveSys.act.lives = 5; SaveSys.act.randomSeed = Math.floor(Math.random() * 1000);
      SaveSys.saveAct(); this.st = 'gameover'; 
    } else {
      this.st = 'dead';
    }
  },
  
  update() {
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    
    if (this.st === 'title') {
      if (keysDown.a) { this.load(); playSnd('jmp'); }
      if (keysDown.b) { this.st = 'confirmDelete'; this.mIdx = 1; playSnd('sel'); }
      return;
    }
    if (this.st === 'confirmDelete') {
      if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) {
          SaveSys.act.stage = 1; SaveSys.act.lives = 5; SaveSys.act.randomSeed = Math.floor(Math.random() * 1000); SaveSys.saveAct();
          playSnd('hit'); this.st = 'title';
        } else { this.st = 'title'; playSnd('sel'); }
      }
      if (keysDown.b) { this.st = 'title'; }
      return;
    }

    if (this.st !== 'play') { if (keysDown.a) { if (this.st === 'clear') { activeApp = Menu; Menu.init(); } else this.load(); } return; }
    
    // ★ キャラクターの速度を遅く調整
    if (keys.left) { this.p.vx -= 0.8; this.p.dir = -1; }
    if (keys.right) { this.p.vx += 0.8; this.p.dir = 1; }
    this.p.vx = Math.max(-3.5, Math.min(3.5, this.p.vx)); this.p.vx *= 0.85; this.p.vy += 0.4; this.p.anim = (this.p.anim + Math.abs(this.p.vx)) % 360;
    
    let nx = this.p.x + this.p.vx; let ny = this.p.y + this.p.vy; let grounded = false;
    
    for (let m of this.map) {
      if (m.type === 'ground' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) { if (this.p.vy > 0) { ny = m.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; } }
      if (m.type === 'goal' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) {
        SaveSys.act.stage++; SaveSys.saveAct(); playSnd('combo');
        if (SaveSys.act.stage > 3) { this.st = 'clear'; SaveSys.act.stage = 1; SaveSys.saveAct(); } else this.load(); return;
      }
    }
    
    for (let plat of this.platforms) {
      if (plat.moving) { plat.x += plat.vx; if (Math.abs(plat.x - plat.startX) > plat.range) plat.vx *= -1; }
      if (plat.disappear && plat.timer > 0) { plat.timer--; if (plat.timer === 0) plat.disappeared = true; }
      if (plat.disappeared) continue;
      if (plat.fake && nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) { if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { plat.fake = false; plat.falling = true; playSnd('hit'); } }
      if (plat.falling) { plat.y += 3; if (plat.y > 400) plat.disappeared = true; continue; }
      if (nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) {
        if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { ny = plat.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; if (plat.disappear && !plat.timer) plat.timer = 20; if (plat.moving) nx += plat.vx; }
      }
    }
    for (let ib of this.invisibleBlocks) {
      if (nx + 20 > ib.x && nx < ib.x + ib.w && ny + 20 > ib.y && ny < ib.y + ib.h) { ib.visible = true; if (this.p.vy > 0 && this.p.y + 20 <= ib.y + 5) { ny = ib.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; } }
    }
    for (let coin of this.coins) {
      if (!coin.collected && Math.abs(nx + 10 - coin.x) < 15 && Math.abs(ny + 10 - coin.y) < 15) { coin.collected = true; this.score += 100; playSnd('combo'); addParticle(coin.x, coin.y, '#ff0', 'explosion'); }
    }
    for (let fc of this.fakeCoins) {
      if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) { fc.touched = true; this.p.vy = -12; playSnd('hit'); addParticle(fc.x, fc.y, '#f00', 'explosion'); screenShake(5); }
    }
    for (let spike of this.spikes) { if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) { this.die("トゲに刺さった"); return; } }
    for (let e of this.enemies) {
      if (e.type === 'patrol') { e.x += e.vx; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; } 
      else if (e.type === 'chase') { const dist = Math.abs(this.p.x - e.x); if (dist < e.range) { e.vx = (this.p.x > e.x) ? Math.abs(e.vx) : -Math.abs(e.vx); e.x += e.vx; } else { e.x += e.vx * 0.3; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; } }
      e.anim = (e.anim || 0) + Math.abs(e.vx) * 2;
      if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) {
        if (this.p.vy > 0 && ny < e.y) { e.y = 9999; this.p.vy = -6; this.score += 50; playSnd('hit'); addParticle(e.x, e.y, '#a00', 'explosion'); screenShake(4); } else { this.die("魔物に触れた"); return; }
      }
    }
    
    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    if ((grounded || this.coyoteTime > 0) && keysDown.a) { this.p.vy = -8; this.p.jumpCount++; this.coyoteTime = 0; playSnd('jmp'); addParticle(this.p.x + 10, this.p.y + 20, '#fff', 'star'); }
    this.p.x = Math.max(0, nx); this.p.y = ny;
    
    if (this.p.y > 320) { this.die("奈落へ落ちた"); return; }
    
    this.camX = Math.max(0, Math.min(this.p.x - 100, 1800));
    updateParticles();
  },
  
  draw() {
    applyShake();
    if (this.st === 'title' || this.st === 'confirmDelete') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300); gradient.addColorStop(0, '#f40'); gradient.addColorStop(1, '#820'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
      ctx.shadowBlur = 20; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText('UNREASONABLE', 30, 80); ctx.fillText('BROTHERS', 45, 105); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('～理不尽なアクション～', 30, 130);
      for (let i = 0; i < 5; i++) { const x = 30 + i * 30; const y = 160 + Math.sin(Date.now() / 200 + i) * 5; drawSprite(x, y, '#00f', sprs.player, 2.5); }
      
      if (this.st === 'title') {
        if (Math.floor(Date.now() / 500) % 2) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('A: 続きから', 60, 220); }
        ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.fillText('B: データリセット', 55, 240);
        ctx.fillStyle = '#f00'; ctx.font = '9px monospace'; ctx.fillText('※即死トラップ注意！', 50, 265);
        ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('SELECT: 戻る', 65, 285);
      } else if (this.st === 'confirmDelete') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(15, 100, 170, 100); ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(15, 100, 170, 100); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.fillText("データをリセット", 40, 125); ctx.fillText("しますか？", 65, 140);
        ctx.fillStyle = this.mIdx === 0 ? '#f00' : '#aaa'; ctx.fillText((this.mIdx === 0 ? "> " : "  ") + "はい", 60, 165);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === 1 ? "> " : "  ") + "いいえ", 60, 185);
      }
      resetShake(); return;
    }
    
    // ★ 固有の背景強化
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    if (this.stageTheme === 'grass') { gradient.addColorStop(0, '#4af'); gradient.addColorStop(1, '#8cf'); } 
    else if (this.stageTheme === 'desert') { gradient.addColorStop(0, '#fc8'); gradient.addColorStop(1, '#fa4'); } 
    else { gradient.addColorStop(0, '#f44'); gradient.addColorStop(1, '#a00'); }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
    
    // 遠景エフェクト
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for(let i=0; i<5; i++) {
        let cx = ((Date.now() * 0.02) + i * 80) % 250 - 25;
        if(this.stageTheme !== 'lava') ctx.fillRect(cx, 30 + (i%3)*30, 40, 10);
        else { ctx.fillStyle='rgba(255,100,0,0.5)'; ctx.fillRect(cx, 200 - (i%3)*50, 5, 15); }
    }

    if (this.stageTheme === 'desert') { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(30, 50, 20, 0, Math.PI * 2); ctx.fill(); } 
    else if (this.stageTheme === 'lava') { ctx.fillStyle = 'rgba(255,100,0,0.3)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(50 + i * 60, 280, 30, 0, Math.PI * 2); ctx.fill(); } }

    ctx.save(); ctx.translate(-this.camX, 0);
    
    for (let m of this.map) {
      if (m.x - this.camX > -50 && m.x - this.camX < 250) {
        if (m.type === 'ground') {
          ctx.fillStyle = this.stageTheme === 'grass' ? '#8b4513' : this.stageTheme === 'desert' ? '#d2b48c' : '#444'; ctx.fillRect(m.x, m.y, m.w, m.h);
          ctx.fillStyle = this.stageTheme === 'grass' ? '#6b3513' : this.stageTheme === 'desert' ? '#c19a6b' : '#222'; ctx.fillRect(m.x, m.y, m.w, 5);
        } else if (m.type === 'goal') { 
          ctx.fillStyle = '#ffd700'; ctx.fillRect(m.x, m.y, m.w, m.h); 
          ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('★', m.x + 7, m.y + 30); 
        }
      }
    }
    for (let plat of this.platforms) {
      if (plat.disappeared) continue;
      if (plat.x - this.camX > -50 && plat.x - this.camX < 250) {
        if (plat.disappear && plat.timer > 0 && plat.timer < 15) ctx.globalAlpha = plat.timer / 15;
        ctx.fillStyle = plat.fake ? '#964' : '#654321'; ctx.fillRect(plat.x, plat.y, plat.w, plat.h); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(plat.x, plat.y, plat.w, 2); ctx.globalAlpha = 1;
      }
    }
    for (let ib of this.invisibleBlocks) {
      if (ib.x - this.camX > -50 && ib.x - this.camX < 250) {
        if (ib.visible) { ctx.fillStyle = '#888'; ctx.fillRect(ib.x, ib.y, ib.w, ib.h); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(ib.x, ib.y, ib.w, 2); } 
        else { ctx.strokeStyle = 'rgba(136,136,136,0.2)'; ctx.strokeRect(ib.x, ib.y, ib.w, ib.h); }
      }
    }
    for (let coin of this.coins) {
      if (!coin.collected && coin.x - this.camX > -50 && coin.x - this.camX < 250) {
        const offset = Math.sin(Date.now() / 100) * 3; drawSprite(coin.x - 4, coin.y + offset - 4, '#ff0', sprs.coin, 2.0); 
      }
    }
    for (let fc of this.fakeCoins) {
      if (!fc.touched && fc.x - this.camX > -50 && fc.x - this.camX < 250) {
        const offset = Math.sin(Date.now() / 100) * 3; drawSprite(fc.x - 4, fc.y + offset - 4, '#f00', sprs.coin, 2.0); 
      }
    }
    for (let spike of this.spikes) { if (spike.x - this.camX > -50 && spike.x - this.camX < 250) drawSprite(spike.x, spike.y, '#888', sprs.spike, 2.5); }
    for (let e of this.enemies) {
      if (e.y < 300 && e.x - this.camX > -50 && e.x - this.camX < 250) {
        const offsetY = e.enemyType === 'flying' ? Math.sin((e.anim || 0) * Math.PI / 180) * 4 : Math.sin((e.anim || 0) * Math.PI / 180) * 2;
        const color = e.enemyType === 'flying' ? '#08f' : e.enemyType === 'fast' ? '#f80' : '#a00';
        let spr = sprs.enemyNew; if (e.enemyType === 'slime' && sprs.slime) spr = sprs.slime;
        drawSprite(e.x - 4, e.y + offsetY - 4, color, spr, 2.5);
      }
    }
    
    if (this.st !== 'dead' && this.st !== 'gameover') {
      ctx.save(); if (this.p.dir < 0) { ctx.scale(-1, 1); ctx.translate(-(this.p.x * 2 + 20), 0); } 
      drawSprite(this.p.x, this.p.y, '#00f', sprs.player || sprs.heroNew, 2.5); 
      ctx.restore();
    }
    ctx.restore();

    drawParticles();
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 200, 32); ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText(`ST:${SaveSys.act.stage} ♥:${SaveSys.act.lives} SC:${this.score}`, 5, 20);
    
    if (this.st === 'dead' || this.st === 'gameover') { 
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 80); 
      ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText(this.st === 'gameover' ? 'GAMEOVER' : 'OOPS!', 60, 125); 
      // ★ 死因テキストの表示
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(this.deathReason, 100 - (this.deathReason.length * 5), 145);
      ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('(A) ' + (this.st === 'gameover' ? 'Menu' : 'Retry'), 65, 165); 
    }
    if (this.st === 'clear') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 60); ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('CLEAR!', 65, 125); ctx.font = '10px monospace'; ctx.fillText('(A) Menu', 60, 145); }
    resetShake();
  }
};
