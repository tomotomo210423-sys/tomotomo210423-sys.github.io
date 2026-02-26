// === UNREASONABLE BROS - STAGE SELECT EDITION ===
const Action = {
  st: 'title', map: [], platforms: [], coins: [], spikes: [], enemies: [], invisibleBlocks: [], fakeCoins: [],
  fallingSpikes: [], fireballs: [], sun: null, blackHole: null,
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1, trail: []}, 
  score: 0, camX: 0, coyoteTime: 0, stageTheme: 'grass',
  mIdx: 1, deathReason: '', checkpointX: 20, bgTimer: 0,
  titleCur: 0, // ★ タイトル画面のカーソル (0: はじめる, 1: リセット)
  stageSelect: 1, // ★ ステージ選択用
  
  init() { 
    this.st = 'title'; BGM.play('action'); 
    if (isNaN(SaveSys.data.actStage)) SaveSys.data.actStage = 1;
    if (isNaN(SaveSys.data.actMaxStage)) SaveSys.data.actMaxStage = SaveSys.data.actStage; // ★ 最高到達ステージの記録
    if (isNaN(SaveSys.data.actSeed)) SaveSys.data.actSeed = Math.floor(Math.random() * 1000);
    if (SaveSys.data.actLives === undefined) { SaveSys.data.actLives = 5; SaveSys.save(); }
    this.checkpointX = 20; this.bgTimer = 0; this.titleCur = 0;
    this.stageSelect = SaveSys.data.actStage; // 最初は現在のステージに合わせておく
  },
  
  load() {
    this.st = 'play'; this.p = {x: this.checkpointX, y: 150, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1, trail: []};
    this.map = []; this.platforms = []; this.coins = []; this.spikes = []; this.enemies = []; 
    this.invisibleBlocks = []; this.fakeCoins = []; this.fallingSpikes = []; this.fireballs = []; 
    this.sun = null; this.blackHole = null; this.camX = 0; this.coyoteTime = 0; this.deathReason = '';
    
    // ★ 選択したステージから始める
    SaveSys.data.actStage = this.stageSelect;
    SaveSys.save();

    const stage = SaveSys.data.actStage; 
    const themes = ['grass', 'desert', 'lava', 'ice', 'void', 'final'];
    this.stageTheme = themes[Math.min(stage - 1, 5)];
    
    if (this.stageTheme === 'desert' || this.stageTheme === 'final') this.sun = {x: 0, y: 50, state: 'wait', timer: 0};
    if (this.stageTheme === 'void' || this.stageTheme === 'final') this.blackHole = {x: -300, y: 150, radius: 40, speed: (this.stageTheme === 'final' ? 1.5 : 1.0)};

    let seed = stage * 100 + SaveSys.data.actSeed;
    let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    this.map.push({x: 0, y: 270, w: 200, h: 30, type: 'ground'});

    let currentX = 200;
    let trapCooldown = 0;

    while (currentX < 3800) {
      if (currentX > 1950 && currentX < 2100) {
         this.map.push({x: currentX, y: 270, w: 100, h: 30, type: 'ground'});
         this.map.push({x: currentX + 30, y: 220, w: 20, h: 50, type: 'checkpoint'});
         currentX += 150; continue;
      }

      let trapChance = this.stageTheme === 'final' ? 0.6 : 0.3 + (Math.min(stage, 5) * 0.05);

      if (trapCooldown <= 0 && rand() < trapChance) {
        let type = Math.floor(rand() * 7); 
        switch(type) {
          case 0:
            this.map.push({x: currentX, y: 270, w: 40, h: 30, type: 'ground'});
            this.invisibleBlocks.push({x: currentX + 80, y: 190, w: 20, h: 20, visible: false, type: 'kaizo'});
            this.map.push({x: currentX + 130, y: 270, w: 90, h: 30, type: 'ground'});
            currentX += 220; break;
          case 1: 
            this.map.push({x: currentX, y: 270, w: 40, h: 30, type: 'ground'});
            this.map.push({x: currentX + 40, y: 270, w: 60, h: 30, type: 'fakeGround'});
            this.map.push({x: currentX + 100, y: 270, w: 60, h: 30, type: 'ground'});
            currentX += 160; break;
          case 2: 
            this.map.push({x: currentX, y: 270, w: 150, h: 30, type: 'ground'});
            let isIce = (this.stageTheme === 'ice' || this.stageTheme === 'final');
            this.fallingSpikes.push({x: currentX + 50, y: 0, w: 20, h: 20, falling: false, isIce: isIce});
            if (stage >= 2) this.fallingSpikes.push({x: currentX + 90, y: -20, w: 20, h: 20, falling: false, isIce: isIce});
            currentX += 150; break;
          case 3: 
            this.map.push({x: currentX, y: 270, w: 200, h: 30, type: 'ground'});
            this.enemies.push({x: currentX + 120, y: 250, vx: -0.5, type: 'patrol', troll: true, triggered: false});
            currentX += 200; break;
          case 4: 
            this.platforms.push({x: currentX + 20, y: 200, w: 60, h: 10, moving: true, vx: 1, range: 40, startX: currentX + 20});
            let chase = (this.stageTheme === 'grass' || this.stageTheme === 'final');
            this.fakeCoins.push({x: currentX + 40, y: 160, touched: false, chase: chase});
            this.map.push({x: currentX + 140, y: 270, w: 60, h: 30, type: 'ground'});
            currentX += 200; break;
          case 5: 
            this.map.push({x: currentX, y: 270, w: 40, h: 30, type: 'ground'});
            this.spikes.push({x: currentX + 40, y: 250, w: 60, h: 20});
            this.map.push({x: currentX + 100, y: 270, w: 50, h: 30, type: 'ground'});
            currentX += 150; break;
          case 6: 
            if (this.stageTheme === 'lava' || this.stageTheme === 'final') this.fireballs.push({x: currentX + 60, y: 350, vy: -10 + rand()*3});
            this.map.push({x: currentX + 120, y: 270, w: 80, h: 30, type: 'ground'});
            currentX += 200; break;
        }
        trapCooldown = this.stageTheme === 'final' ? 0 : (1 + Math.floor(rand() * 2));
      } else {
        let zoneWidth = 150 + rand() * 100;
        this.map.push({x: currentX, y: 270, w: zoneWidth, h: 30, type: 'ground'});
        let numEnemies = 1 + Math.floor(rand() * 2);
        for(let i=0; i<numEnemies; i++) {
           let ex = currentX + 40 + rand() * (zoneWidth - 80);
           this.enemies.push({x: ex, y: 250, vx: (rand()>0.5?0.8:-0.8), type: 'patrol', troll: false, range: 40, startX: ex});
        }
        if (rand() < 0.6) {
           let px = currentX + 20 + rand() * (zoneWidth - 80);
           this.platforms.push({x: px, y: 170 + rand()*30, w: 40, h: 10, moving: false});
           this.coins.push({x: px + 10, y: 140, collected: false});
        }
        currentX += zoneWidth;
        if (trapCooldown > 0) trapCooldown--; 
      }
    }
    
    this.map.push({x: 3800, y: 270, w: 300, h: 30, type: 'ground'});
    this.map.push({x: 3950, y: 220, w: 30, h: 50, type: 'goal'});
  },
  
  die(reason) {
    this.deathReason = reason; SaveSys.data.actLives--; SaveSys.save(); 
    playSnd('hit'); screenShake(12); addParticle(this.p.x, this.p.y, '#f00', 'explosion'); addParticle(this.p.x, this.p.y, '#ff0', 'explosion');
    SaveSys.addLog('理不尽ブラザーズ', `ステージ${SaveSys.data.actStage}「${reason}」で死亡`);
    this.st = 'dead';
  },
  
  update() {
    this.bgTimer++;
    if (keysDown.select) { switchApp(Menu); return; }
    
    // ★ タイトル画面の操作（ステージ選択対応）
    if (this.st === 'title') {
      if (keysDown.up || keysDown.down) { this.titleCur = this.titleCur === 0 ? 1 : 0; playSnd('sel'); }
      
      if (this.titleCur === 0) {
          // ステージ選択 (左右キー)
          let maxSt = SaveSys.data.actMaxStage || SaveSys.data.actStage;
          if (keysDown.left && this.stageSelect > 1) { this.stageSelect--; playSnd('sel'); }
          if (keysDown.right && this.stageSelect < maxSt) { this.stageSelect++; playSnd('sel'); }
      }
      
      if (keysDown.a) { 
        if (this.titleCur === 0) {
            this.checkpointX = 20; this.score = 0; this.load(); playSnd('jmp'); 
        } else {
            this.st = 'confirmDelete'; this.mIdx = 1; playSnd('sel');
        }
      }
      return;
    }

    if (this.st === 'confirmDelete') {
      if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) { 
            // データリセット
            SaveSys.data.actStage = 1; SaveSys.data.actMaxStage = 1; SaveSys.data.actLives = 5; 
            SaveSys.data.actSeed = Math.floor(Math.random() * 1000); SaveSys.save(); 
            this.stageSelect = 1; playSnd('hit'); this.st = 'title'; 
        } 
        else { this.st = 'title'; playSnd('sel'); }
      }
      if (keysDown.b) { this.st = 'title'; } return;
    }

    if (this.st !== 'play') { if (keysDown.a) { if (this.st === 'clear') { switchApp(Menu); } else this.load(); } return; }
    
    let friction = (this.stageTheme === 'ice' || this.stageTheme === 'final') ? 0.97 : 0.85;
    let accel = (this.stageTheme === 'ice' || this.stageTheme === 'final') ? 0.3 : 0.8;
    let gravity = (this.stageTheme === 'void' || this.stageTheme === 'final') ? 0.2 : 0.4;
    let jumpForce = (this.stageTheme === 'void' || this.stageTheme === 'final') ? -6.5 : -8.5;

    if (keys.left) { this.p.vx -= accel; this.p.dir = -1; }
    if (keys.right) { this.p.vx += accel; this.p.dir = 1; }
    
    this.p.vx = Math.max(-4.0, Math.min(4.0, this.p.vx)); 
    this.p.vx *= friction; 
    this.p.vy += gravity; 
    this.p.anim = (this.p.anim + Math.abs(this.p.vx)) % 360;
    
    if (this.stageTheme === 'void' || this.stageTheme === 'final') {
       this.p.trail.unshift({x: this.p.x, y: this.p.y, dir: this.p.dir});
       if(this.p.trail.length > 5) this.p.trail.pop();
    }

    let nx = this.p.x + this.p.vx; let ny = this.p.y + this.p.vy; let grounded = false;
    
    for (let ib of this.invisibleBlocks) {
      if (ib.type === 'kaizo') {
        if (nx + 20 > ib.x && nx < ib.x + ib.w && ny + 20 > ib.y && ny < ib.y + ib.h) {
           if (this.p.vy < 0 && this.p.y >= ib.y + ib.h) { ny = ib.y + ib.h; this.p.vy = 2; ib.visible = true; playSnd('hit'); screenShake(3); }
           else if (ib.visible) {
              if (this.p.vy > 0 && this.p.y + 20 <= ib.y + 5) { ny = ib.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; }
              else if (nx + 20 > ib.x && this.p.x + 20 <= ib.x) { nx = ib.x - 20; this.p.vx = 0; }
              else if (nx < ib.x + ib.w && this.p.x >= ib.x + ib.w) { nx = ib.x + ib.w; this.p.vx = 0; }
           }
        }
      }
    }

    for (let m of this.map) {
      if ((m.type === 'ground' || m.type === 'checkpoint' || m.type === 'goal') && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) { 
        if (m.type === 'checkpoint') {
           if (this.checkpointX !== m.x) { this.checkpointX = m.x; playSnd('combo'); addParticle(m.x, m.y + 20, '#0f0', 'star'); }
        } else if (m.type === 'goal') {
           SaveSys.addLog('理不尽ブラザーズ', `ステージ${SaveSys.data.actStage}クリア`);
           SaveSys.data.actStage++; 
           if(SaveSys.data.actStage > (SaveSys.data.actMaxStage || 1)) SaveSys.data.actMaxStage = SaveSys.data.actStage; // 最高到達点を更新
           this.checkpointX = 20; SaveSys.save(); playSnd('combo');
           if (SaveSys.data.actStage > 6) { this.st = 'clear'; SaveSys.data.actStage = 1; SaveSys.save(); } else this.load(); return;
        } else {
           if (this.p.vy > 0 && this.p.y + 20 <= m.y + 5) { ny = m.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; }
           else if (nx + 20 > m.x && this.p.x + 20 <= m.x) nx = m.x - 20; 
           else if (nx < m.x + m.w && this.p.x >= m.x + m.w) nx = m.x + m.w;
        }
      }
    }
    
    for (let plat of this.platforms) {
      if (plat.moving) { plat.x += plat.vx; if (Math.abs(plat.x - plat.startX) > plat.range) plat.vx *= -1; }
      if (nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) {
        if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { ny = plat.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; if (plat.moving) nx += plat.vx; }
      }
    }

    for (let fc of this.fakeCoins) {
      if (fc.chase && !fc.touched && Math.abs(this.p.x - fc.x) < 150) {
         let speed = this.stageTheme === 'final' ? 2.5 : 1.5;
         fc.x += (this.p.x > fc.x ? speed : -speed); fc.y += (this.p.y > fc.y ? speed : -speed); 
      }
      if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) { fc.touched = true; this.p.vy = -12; playSnd('hit'); addParticle(fc.x, fc.y, '#f00', 'explosion'); screenShake(5); }
    }
    
    for (let s of this.fallingSpikes) {
       if (!s.falling && Math.abs(this.p.x - s.x) < 40 && this.p.y > s.y) { s.falling = true; playSnd('hit'); }
       if (s.falling) s.y += 10;
       if (nx + 20 > s.x && nx < s.x + s.w && ny + 20 > s.y && ny < s.y + s.h) { this.die(s.isIce ? "鋭いツララ" : "頭上からのトゲ"); return; }
    }

    for (let spike of this.spikes) { if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) { this.die("トゲに刺さった"); return; } }
    
    for (let e of this.enemies) {
      e.vy = (e.vy || 0) + gravity; e.y += e.vy; 
      if (e.y > 250) { e.y = 250; e.vy = 0; }
      
      if (e.troll && !e.triggered && Math.abs(this.p.x - e.x) < 90) {
         e.triggered = true; e.vy = jumpForce * 0.8; e.vx = (this.p.x > e.x ? 3.5 : -3.5); playSnd('jmp');
      }
      
      if (!e.troll || !e.triggered) { e.x += e.vx; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; } 
      else { e.x += e.vx; }

      e.anim = (e.anim || 0) + Math.abs(e.vx) * 2;
      if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) {
        if (this.p.vy > 0 && ny < e.y) { e.y = 9999; this.p.vy = -6; this.score += 50; playSnd('hit'); addParticle(e.x, e.y, '#a00', 'explosion'); screenShake(4); } 
        else { this.die("魔物に触れた"); return; }
      }
    }

    if ((this.stageTheme === 'desert' || this.stageTheme === 'final') && this.sun) {
       if (this.sun.state === 'wait') {
          this.sun.x = this.camX + 150; this.sun.y = 30 + Math.sin(this.bgTimer/15)*15; this.sun.timer++;
          if (this.sun.timer > (this.stageTheme==='final'?150:240)) { this.sun.state = 'swoop'; this.sun.vx = (this.p.x - this.sun.x)/20; this.sun.vy = (this.p.y - this.sun.y)/20; playSnd('hit'); }
       } else if (this.sun.state === 'swoop') {
          this.sun.x += this.sun.vx; this.sun.y += this.sun.vy;
          if (this.sun.y > 400) { this.sun.state = 'wait'; this.sun.timer = 0; }
       }
       if (Math.abs(nx + 10 - this.sun.x) < 18 && Math.abs(ny + 10 - this.sun.y) < 18) { this.die("太陽の突撃"); return; }
    }

    if (this.stageTheme === 'lava' || this.stageTheme === 'final') {
       for (let fb of this.fireballs) {
          fb.vy += gravity * 0.5; fb.y += fb.vy;
          if (fb.y > 400) { fb.y = 350; fb.vy = -10 - Math.random()*5; }
          if (Math.abs(nx + 10 - fb.x) < 15 && Math.abs(ny + 10 - fb.y) < 15) { this.die("下からの火球"); return; }
       }
    }

    if ((this.stageTheme === 'void' || this.stageTheme === 'final') && this.blackHole) {
       let dx = this.p.x - this.blackHole.x; let dy = this.p.y - this.blackHole.y;
       let dist = Math.sqrt(dx*dx + dy*dy);
       if (dist > 0) { this.blackHole.x += (dx/dist) * this.blackHole.speed; this.blackHole.y += (dy/dist) * this.blackHole.speed; }
       if (dist < 100) { nx -= (dx/dist)*0.5; ny -= (dy/dist)*0.5; }
       if (dist < this.blackHole.radius - 5) { this.die("虚無に飲まれた"); return; }
    }
    
    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    if ((grounded || this.coyoteTime > 0) && keysDown.a) { this.p.vy = jumpForce; this.p.jumpCount++; this.coyoteTime = 0; playSnd('jmp'); addParticle(this.p.x + 10, this.p.y + 20, '#fff', 'star'); }
    this.p.x = Math.max(0, nx); this.p.y = ny;
    
    if (this.p.y > 320) { this.die("奈落へ落ちた"); return; }
    
    this.camX = Math.max(0, Math.min(this.p.x - 100, 3800));
    updateParticles();
  },
  
  drawBlock(x, y, w, h, type, fake) {
    ctx.fillStyle = fake ? '#432' : (this.stageTheme === 'desert' ? '#c85' : this.stageTheme === 'lava' ? '#300' : this.stageTheme === 'ice' ? '#6be' : this.stageTheme === 'void' ? '#103' : this.stageTheme === 'final' ? (Math.random()<0.1?'#f0f':'#103') : '#642');
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = this.stageTheme === 'grass' ? '#0f0' : this.stageTheme === 'desert' ? '#fb5' : this.stageTheme === 'lava' ? `rgba(255,0,0,${0.5+Math.sin(this.bgTimer/10)*0.5})` : this.stageTheme === 'ice' ? '#fff' : this.stageTheme === 'void' ? '#a0f' : (Math.random()<0.2?'#0ff':'#f00');
    ctx.fillRect(x, y, w, 4);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeRect(x, y, w, h);
  },

  draw() {
    applyShake();
    
    // ★ タイトル画面の描画（ステージ選択UI追加）
    if (this.st === 'title' || this.st === 'confirmDelete') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300); gradient.addColorStop(0, '#f40'); gradient.addColorStop(1, '#820'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
      ctx.shadowBlur = 20; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText('UNREASONABLE', 30, 80); ctx.fillText('BROTHERS', 45, 105); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('～理不尽なアクション～', 30, 130);
      for (let i = 0; i < 5; i++) { const x = 30 + i * 30; const y = 160 + Math.sin(this.bgTimer / 10 + i) * 5; drawSprite(x, y, '#00f', sprs.player, 2.5); }
      
      if (this.st === 'title') {
        let maxSt = SaveSys.data.actMaxStage || SaveSys.data.actStage;
        
        ctx.fillStyle = this.titleCur === 0 ? '#ff0' : '#fff'; ctx.font = 'bold 12px monospace'; 
        ctx.fillText((this.titleCur === 0 ? '> ' : '  ') + 'はじめる', 50, 220);
        
        // ステージ選択UI
        if (this.titleCur === 0) {
            ctx.fillStyle = '#0f0'; ctx.font = '10px monospace';
            ctx.fillText(`[STAGE ${this.stageSelect}]`, 60, 235);
            if (this.stageSelect > 1) ctx.fillText('◀', 45, 235);
            if (this.stageSelect < maxSt) ctx.fillText('▶', 130, 235);
        }

        ctx.fillStyle = this.titleCur === 1 ? '#ff0' : '#ccc'; ctx.font = '10px monospace'; 
        ctx.fillText((this.titleCur === 1 ? '> ' : '  ') + 'データリセット', 45, 255);
        ctx.fillStyle = '#f00'; ctx.font = '9px monospace'; ctx.fillText('※即死トラップ注意！', 45, 280);
      } 
      else if (this.st === 'confirmDelete') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(15, 100, 170, 100); ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(15, 100, 170, 100); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.fillText("データをリセット", 40, 125); ctx.fillText("しますか？", 65, 140);
        ctx.fillStyle = this.mIdx === 0 ? '#f00' : '#aaa'; ctx.fillText((this.mIdx === 0 ? "> " : "  ") + "はい", 60, 165);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === 1 ? "> " : "  ") + "いいえ", 60, 185);
      }
      resetShake(); return;
    }
    
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    if (this.stageTheme === 'grass') { grad.addColorStop(0, '#4af'); grad.addColorStop(1, '#8cf'); } 
    else if (this.stageTheme === 'desert') { grad.addColorStop(0, '#fc8'); grad.addColorStop(1, '#fa4'); } 
    else if (this.stageTheme === 'lava') { grad.addColorStop(0, '#400'); grad.addColorStop(1, '#a00'); }
    else if (this.stageTheme === 'ice') { grad.addColorStop(0, '#cdf'); grad.addColorStop(1, '#fff'); }
    else if (this.stageTheme === 'void') { grad.addColorStop(0, '#001'); grad.addColorStop(1, '#204'); }
    else if (this.stageTheme === 'final') { grad.addColorStop(0, Math.random()<0.1?'#f00':'#100'); grad.addColorStop(1, '#303'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for(let i=0; i<5; i++) {
        let cx = ((this.bgTimer * 0.5) + i * 80) % 250 - 25;
        if(this.stageTheme === 'grass' || this.stageTheme === 'desert') ctx.fillRect(cx, 30 + (i%3)*30, 40, 10); 
        else if (this.stageTheme === 'ice') { ctx.fillStyle='#fff'; ctx.fillRect((cx*2)%200, (this.bgTimer+i*50)%300, 2, 2); } 
        else if (this.stageTheme === 'lava' || this.stageTheme === 'final') { ctx.fillStyle='rgba(255,100,0,0.6)'; ctx.fillRect(cx, 300 - ((this.bgTimer*2+i*40)%300), 3, 6); } 
        else if (this.stageTheme === 'void') { ctx.fillStyle='#fff'; ctx.fillRect((cx*3)%200, (i*60)%300, 1, 1); } 
    }
    
    if (this.stageTheme === 'desert') { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(30, 50, 20, 0, Math.PI * 2); ctx.fill(); } 
    else if (this.stageTheme === 'lava') { ctx.fillStyle = `rgba(255,50,0,${0.3+Math.sin(this.bgTimer/10)*0.2})`; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(50 + i * 60, 280, 40, 0, Math.PI * 2); ctx.fill(); } }
    else if (this.stageTheme === 'void' || this.stageTheme === 'final') { ctx.strokeStyle = 'rgba(255,0,255,0.2)'; for(let i=0; i<200; i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i*1.5); ctx.lineTo(200, i*1.5); ctx.stroke(); } }

    ctx.save(); ctx.translate(-this.camX, 0);
    
    if ((this.stageTheme === 'desert' || this.stageTheme === 'final') && this.sun) {
       ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(this.sun.x, this.sun.y, 14, 0, Math.PI * 2); ctx.fill();
       ctx.fillStyle = '#f00'; ctx.font = 'bold 12px monospace'; ctx.fillText('▼', this.sun.x - 6, this.sun.y + 4);
       if (this.sun.state === 'wait' && this.sun.timer > 100) { ctx.strokeStyle = '#f00'; ctx.beginPath(); ctx.arc(this.sun.x, this.sun.y, 14 + (this.sun.timer%10), 0, Math.PI*2); ctx.stroke(); }
    }
    
    if (this.stageTheme === 'lava' || this.stageTheme === 'final') {
       for (let fb of this.fireballs) { 
           ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(fb.x, fb.y, 10, 0, Math.PI * 2); ctx.fill(); 
           ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(fb.x, fb.y+4, 8, 0, Math.PI * 2); ctx.fill(); 
       }
    }

    if ((this.stageTheme === 'void' || this.stageTheme === 'final') && this.blackHole) {
       ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.blackHole.x, this.blackHole.y, this.blackHole.radius, 0, Math.PI * 2); ctx.fill();
       ctx.strokeStyle = `rgba(150, 0, 255, ${0.5 + Math.sin(this.bgTimer/5)*0.5})`; ctx.lineWidth = 4;
       ctx.beginPath(); ctx.arc(this.blackHole.x, this.blackHole.y, this.blackHole.radius + 2, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }

    for (let m of this.map) {
      if (m.x - this.camX > -50 && m.x - this.camX < 250) {
        if (m.type === 'ground' || m.type === 'fakeGround') { 
           this.drawBlock(m.x, m.y, m.w, m.h, 'ground', m.type === 'fakeGround');
        } else if (m.type === 'checkpoint') {
          ctx.fillStyle = this.checkpointX === m.x ? '#0f0' : '#888'; ctx.fillRect(m.x + 8, m.y, 4, m.h); 
          ctx.fillStyle = this.checkpointX === m.x ? '#ff0' : '#ccc'; ctx.fillRect(m.x + 12, m.y + 5, 15, 15); 
        } else if (m.type === 'goal') { 
          ctx.fillStyle = this.stageTheme === 'final' ? '#f0f' : '#ffd700'; ctx.fillRect(m.x, m.y, m.w, m.h); 
          ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.fillText('★', m.x + 7, m.y + 30); 
        }
      }
    }
    for (let plat of this.platforms) {
      if (plat.x - this.camX > -50 && plat.x - this.camX < 250) this.drawBlock(plat.x, plat.y, plat.w, plat.h, 'plat', false);
    }
    for (let ib of this.invisibleBlocks) {
      if (ib.x - this.camX > -50 && ib.x - this.camX < 250 && ib.visible) this.drawBlock(ib.x, ib.y, ib.w, ib.h, 'inv', false); 
    }
    for (let fc of this.fakeCoins) {
      if (!fc.touched && fc.x - this.camX > -50 && fc.x - this.camX < 250) {
        const offset = Math.sin(this.bgTimer / 10) * 3; drawSprite(fc.x - 4, fc.y + offset - 4, '#f00', sprs.coin, 2.0); 
      }
    }
    for (let coin of this.coins) {
      if (!coin.collected && coin.x - this.camX > -50 && coin.x - this.camX < 250) {
        const offset = Math.sin(this.bgTimer / 10) * 3; drawSprite(coin.x - 4, coin.y + offset - 4, '#ff0', sprs.coin, 2.0); 
      }
    }
    for (let s of this.fallingSpikes) { 
        if (s.x - this.camX > -50 && s.x - this.camX < 250) { 
            ctx.fillStyle = s.isIce ? '#8ff' : '#888'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x+20, s.y); ctx.lineTo(s.x+10, s.y+20); ctx.fill(); 
        } 
    }
    for (let spike of this.spikes) { if (spike.x - this.camX > -50 && spike.x - this.camX < 250) drawSprite(spike.x, spike.y, '#aaa', sprs.spike, 2.5); }
    for (let e of this.enemies) {
      if (e.y < 300 && e.x - this.camX > -50 && e.x - this.camX < 250) {
        const offsetY = Math.sin((e.anim || 0) * Math.PI / 180) * 2;
        const color = e.troll ? '#f0f' : '#a00'; 
        drawSprite(e.x - 4, e.y + offsetY - 4, color, sprs.enemyNew, 2.5);
      }
    }
    if (this.st !== 'dead' && this.st !== 'gameover') {
      ctx.save(); 
      for(let i=0; i<this.p.trail.length; i++) {
          let tr = this.p.trail[i]; ctx.globalAlpha = 0.5 - (i*0.1);
          ctx.save(); if (tr.dir < 0) { ctx.scale(-1, 1); ctx.translate(-(tr.x * 2 + 20), 0); }
          drawSprite(tr.x, tr.y, '#0ff', sprs.heroNew, 2.5); ctx.restore();
      }
      ctx.globalAlpha = 1;
      
      if (this.p.dir < 0) { ctx.scale(-1, 1); ctx.translate(-(this.p.x * 2 + 20), 0); } 
      drawSprite(this.p.x, this.p.y, '#00f', sprs.heroNew, 2.5); 
      ctx.restore();
    }
    ctx.restore();

    drawParticles();
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 25); 
    ctx.fillStyle = this.stageTheme === 'final' ? '#f0f' : '#0f0'; ctx.font = 'bold 12px monospace';
    let stName = this.stageTheme.toUpperCase();
    ctx.fillText(`ST:${SaveSys.data.actStage} [${stName}]`, 5, 17);
    ctx.fillStyle = '#f00'; ctx.fillText(`♥:${SaveSys.data.actLives}`, 145, 17);
    
    if (this.st === 'dead' || this.st === 'gameover') { 
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 100, 200, 80); ctx.strokeStyle = '#f00'; ctx.strokeRect(0, 100, 200, 80);
      ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText('YOU DIED', 65, 125); 
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(this.deathReason, 100 - (this.deathReason.length * 5), 145);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('(A) Retry', 75, 165); 
    }
    if (this.st === 'clear') { 
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 80, 200, 100); ctx.strokeStyle = '#0f0'; ctx.strokeRect(0, 80, 200, 100);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText(SaveSys.data.actStage > 6 ? 'ALL CLEAR!!' : 'STAGE CLEAR!', 50, 115); 
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(`残機: ${SaveSys.data.actLives}`, 70, 140);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(SaveSys.data.actStage > 6 ? '(A) Title' : '(A) Next Stage', 60, 165); 
    }
    resetShake();
  }
};
