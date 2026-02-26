// === UNREASONABLE BROS - SYOBON EDITION ===
const Action = {
  st: 'title', map: [], platforms: [], coins: [], spikes: [], enemies: [], invisibleBlocks: [], fakeCoins: [],
  fallingSpikes: [], fireballs: [], sun: null,
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1}, score: 0, camX: 0, coyoteTime: 0, stageTheme: 'grass',
  mIdx: 1, deathReason: '', checkpointX: 20, // ★ 中間地点のX座標
  
  init() { 
    this.st = 'title'; BGM.play('action'); 
    if (isNaN(SaveSys.data.actStage)) SaveSys.data.actStage = 1;
    if (isNaN(SaveSys.data.actSeed)) SaveSys.data.actSeed = Math.floor(Math.random() * 1000);
    if (SaveSys.data.actLives === undefined) { SaveSys.data.actLives = 5; SaveSys.save(); }
    this.checkpointX = 20;
  },
  
  load() {
    this.st = 'play'; this.p = {x: this.checkpointX, y: 150, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1};
    this.map = []; this.platforms = []; this.coins = []; this.spikes = []; this.enemies = []; 
    this.invisibleBlocks = []; this.fakeCoins = []; this.fallingSpikes = []; this.fireballs = []; this.sun = null;
    this.camX = 0; this.coyoteTime = 0; this.deathReason = '';
    
    if (isNaN(SaveSys.data.actStage)) SaveSys.data.actStage = 1;
    if (isNaN(SaveSys.data.actSeed)) SaveSys.data.actSeed = Math.floor(Math.random() * 1000);

    const stage = SaveSys.data.actStage; 
    this.stageTheme = stage % 3 === 1 ? 'grass' : stage % 3 === 2 ? 'desert' : 'lava';
    
    // ★ 独自の理不尽：太陽（砂漠）
    if (this.stageTheme === 'desert') this.sun = {x: 0, y: 50, state: 'wait', timer: 0};

    let seed = stage * 100 + SaveSys.data.actSeed;
    let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    // スタート地点
    this.map.push({x: 0, y: 270, w: 200, h: 30, type: 'ground'});

    let currentX = 200;
    while (currentX < 3800) {
      // ★ 中間地点の生成 (X: 2000付近)
      if (currentX > 1950 && currentX < 2100) {
         this.map.push({x: currentX, y: 270, w: 100, h: 30, type: 'ground'});
         this.map.push({x: currentX + 30, y: 220, w: 20, h: 50, type: 'checkpoint'});
         currentX += 150; continue;
      }

      let type = Math.floor(rand() * 7); // 7種類のトラップチャンク
      
      switch(type) {
        case 0: // 悪意のジャンプ妨害（見えないブロック）
          this.map.push({x: currentX, y: 270, w: 40, h: 30, type: 'ground'});
          this.invisibleBlocks.push({x: currentX + 60, y: 190, w: 20, h: 20, visible: false, type: 'kaizo'});
          this.map.push({x: currentX + 100, y: 270, w: 100, h: 30, type: 'ground'});
          currentX += 200; break;
        case 1: // 信じた床が落ちる（すり抜ける床）
          this.map.push({x: currentX, y: 270, w: 40, h: 30, type: 'ground'});
          this.map.push({x: currentX + 40, y: 270, w: 60, h: 30, type: 'fakeGround'});
          this.map.push({x: currentX + 100, y: 270, w: 60, h: 30, type: 'ground'});
          currentX += 160; break;
        case 2: // 上からの死角（落ちてくるトゲ）
          this.map.push({x: currentX, y: 270, w: 150, h: 30, type: 'ground'});
          this.fallingSpikes.push({x: currentX + 50, y: 0, w: 20, h: 20, falling: false});
          this.fallingSpikes.push({x: currentX + 90, y: -20, w: 20, h: 20, falling: false});
          currentX += 150; break;
        case 3: // 豹変するスライム
          this.map.push({x: currentX, y: 270, w: 200, h: 30, type: 'ground'});
          this.enemies.push({x: currentX + 120, y: 250, vx: -0.5, type: 'patrol', troll: true, triggered: false});
          currentX += 200; break;
        case 4: // 動く床と偽コイン
          this.platforms.push({x: currentX + 20, y: 200, w: 60, h: 10, moving: true, vx: 1, range: 40, startX: currentX + 20});
          this.fakeCoins.push({x: currentX + 40, y: 160, touched: false, chase: this.stageTheme === 'grass'});
          this.map.push({x: currentX + 140, y: 270, w: 60, h: 30, type: 'ground'});
          currentX += 200; break;
        case 5: // 敷き詰められたトゲ
          this.map.push({x: currentX, y: 270, w: 150, h: 30, type: 'ground'});
          this.spikes.push({x: currentX + 40, y: 250, w: 80, h: 20});
          currentX += 150; break;
        case 6: // 独自の理不尽：火球（溶岩）または通常穴
          if (this.stageTheme === 'lava') this.fireballs.push({x: currentX + 50, y: 350, vy: -10 + rand()*3});
          this.map.push({x: currentX + 100, y: 270, w: 80, h: 30, type: 'ground'});
          currentX += 180; break;
      }
    }
    
    // ゴールエリア
    this.map.push({x: 3800, y: 270, w: 300, h: 30, type: 'ground'});
    this.map.push({x: 3950, y: 220, w: 30, h: 50, type: 'goal'});
  },
  
  die(reason) {
    this.deathReason = reason;
    SaveSys.data.actLives--; // ★ 0になっても無限にマイナスへ進む
    SaveSys.save(); playSnd('hit'); screenShake(10); addParticle(this.p.x, this.p.y, '#00f', 'explosion');
    SaveSys.addLog('理不尽ブラザーズ', `ステージ${SaveSys.data.actStage}で「${reason}」により死亡`);
    this.st = 'dead';
  },
  
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    if (this.st === 'title') {
      if (keysDown.a) { this.checkpointX = 20; this.score = 0; this.load(); playSnd('jmp'); }
      if (keysDown.b) { this.st = 'confirmDelete'; this.mIdx = 1; playSnd('sel'); }
      return;
    }
    if (this.st === 'confirmDelete') {
      if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) { SaveSys.data.actStage = 1; SaveSys.data.actLives = 5; SaveSys.data.actSeed = Math.floor(Math.random() * 1000); SaveSys.save(); playSnd('hit'); this.st = 'title'; } 
        else { this.st = 'title'; playSnd('sel'); }
      }
      if (keysDown.b) { this.st = 'title'; } return;
    }

    if (this.st !== 'play') { if (keysDown.a) { if (this.st === 'clear') { switchApp(Menu); } else this.load(); } return; }
    
    if (keys.left) { this.p.vx -= 0.8; this.p.dir = -1; }
    if (keys.right) { this.p.vx += 0.8; this.p.dir = 1; }
    this.p.vx = Math.max(-3.5, Math.min(3.5, this.p.vx)); this.p.vx *= 0.85; this.p.vy += 0.4; this.p.anim = (this.p.anim + Math.abs(this.p.vx)) % 360;
    
    let nx = this.p.x + this.p.vx; let ny = this.p.y + this.p.vy; let grounded = false;
    
    // 見えないブロック（孔明の罠）判定を最優先
    for (let ib of this.invisibleBlocks) {
      if (ib.type === 'kaizo') {
        if (nx + 20 > ib.x && nx < ib.x + ib.w && ny + 20 > ib.y && ny < ib.y + ib.h) {
           if (this.p.vy < 0 && this.p.y >= ib.y + ib.h) { ny = ib.y + ib.h; this.p.vy = 2; ib.visible = true; playSnd('hit'); } // 下から叩いた
           else if (ib.visible) {
              if (this.p.vy > 0 && this.p.y + 20 <= ib.y + 5) { ny = ib.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; } // 上に乗る
              else if (nx + 20 > ib.x && this.p.x + 20 <= ib.x) { nx = ib.x - 20; this.p.vx = 0; } // 左から
              else if (nx < ib.x + ib.w && this.p.x >= ib.x + ib.w) { nx = ib.x + ib.w; this.p.vx = 0; } // 右から
           }
        }
      }
    }

    // 地形判定
    for (let m of this.map) {
      if ((m.type === 'ground' || m.type === 'checkpoint' || m.type === 'goal') && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) { 
        if (m.type === 'checkpoint') {
           if (this.checkpointX !== m.x) { this.checkpointX = m.x; playSnd('combo'); addParticle(m.x, m.y + 20, '#0f0', 'star'); }
        } else if (m.type === 'goal') {
           SaveSys.addLog('理不尽ブラザーズ', `ステージ${SaveSys.data.actStage}をクリア！`);
           SaveSys.data.actStage++; this.checkpointX = 20; SaveSys.save(); playSnd('combo');
           if (SaveSys.data.actStage > 3) { this.st = 'clear'; SaveSys.data.actStage = 1; SaveSys.save(); } else this.load(); return;
        } else {
           // 通常地面
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
      if (fc.chase && !fc.touched && Math.abs(this.p.x - fc.x) < 120) {
         fc.x += (this.p.x > fc.x ? 2.5 : -2.5); fc.y += (this.p.y > fc.y ? 2.5 : -2.5); // ★ 草原：超ホーミング
      }
      if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) { fc.touched = true; this.p.vy = -12; playSnd('hit'); addParticle(fc.x, fc.y, '#f00', 'explosion'); screenShake(5); }
    }
    
    // 落ちてくるトゲ
    for (let s of this.fallingSpikes) {
       if (!s.falling && Math.abs(this.p.x - s.x) < 30 && this.p.y > s.y) { s.falling = true; playSnd('hit'); }
       if (s.falling) s.y += 8;
       if (nx + 20 > s.x && nx < s.x + s.w && ny + 20 > s.y && ny < s.y + s.h) { this.die("頭上からのトゲ"); return; }
    }

    for (let spike of this.spikes) { if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) { this.die("トゲに刺さった"); return; } }
    
    for (let e of this.enemies) {
      e.vy = (e.vy || 0) + 0.4; e.y += e.vy; 
      if (e.y > 250) { e.y = 250; e.vy = 0; } // 簡易地面判定
      
      // ★ 豹変トラップ
      if (e.troll && !e.triggered && Math.abs(this.p.x - e.x) < 60) {
         e.triggered = true; e.vy = -7; e.vx = (this.p.x > e.x ? 3.5 : -3.5); playSnd('jmp');
      }
      
      if (!e.troll || !e.triggered) {
         e.x += e.vx; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1;
      } else { e.x += e.vx; } // 豹変後は突っ走る

      e.anim = (e.anim || 0) + Math.abs(e.vx) * 2;
      if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) {
        if (this.p.vy > 0 && ny < e.y) { e.y = 9999; this.p.vy = -6; this.score += 50; playSnd('hit'); addParticle(e.x, e.y, '#a00', 'explosion'); screenShake(4); } 
        else { this.die("魔物に触れた"); return; }
      }
    }

    // 太陽（砂漠）
    if (this.stageTheme === 'desert' && this.sun) {
       if (this.sun.state === 'wait') {
          this.sun.x = this.camX + 150; this.sun.y = 40 + Math.sin(Date.now()/150)*15; this.sun.timer++;
          if (this.sun.timer > 180) { this.sun.state = 'swoop'; this.sun.vx = (this.p.x - this.sun.x)/25; this.sun.vy = (this.p.y - this.sun.y)/25; playSnd('hit'); }
       } else if (this.sun.state === 'swoop') {
          this.sun.x += this.sun.vx; this.sun.y += this.sun.vy;
          if (this.sun.y > 400) { this.sun.state = 'wait'; this.sun.timer = 0; }
       }
       if (Math.abs(nx + 10 - this.sun.x) < 15 && Math.abs(ny + 10 - this.sun.y) < 15) { this.die("太陽の突撃"); return; }
    }

    // 火球（溶岩）
    if (this.stageTheme === 'lava') {
       for (let fb of this.fireballs) {
          fb.vy += 0.15; fb.y += fb.vy;
          if (fb.y > 400) { fb.y = 350; fb.vy = -8 - Math.random()*4; }
          if (Math.abs(nx + 10 - fb.x) < 15 && Math.abs(ny + 10 - fb.y) < 15) { this.die("下からの火球"); return; }
       }
    }
    
    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    if ((grounded || this.coyoteTime > 0) && keysDown.a) { this.p.vy = -8.5; this.p.jumpCount++; this.coyoteTime = 0; playSnd('jmp'); addParticle(this.p.x + 10, this.p.y + 20, '#fff', 'star'); }
    this.p.x = Math.max(0, nx); this.p.y = ny;
    
    if (this.p.y > 320) { this.die("奈落へ落ちた"); return; }
    
    this.camX = Math.max(0, Math.min(this.p.x - 100, 3800)); // カメラ限界を拡張
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
        if (Math.floor(Date.now() / 500) % 2) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('A: はじめる', 60, 220); }
        ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.fillText('B: データリセット', 55, 240);
        ctx.fillStyle = '#f00'; ctx.font = '9px monospace'; ctx.fillText('※即死トラップ注意！', 50, 265);
      } else if (this.st === 'confirmDelete') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(15, 100, 170, 100); ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(15, 100, 170, 100); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.fillText("データをリセット", 40, 125); ctx.fillText("しますか？", 65, 140);
        ctx.fillStyle = this.mIdx === 0 ? '#f00' : '#aaa'; ctx.fillText((this.mIdx === 0 ? "> " : "  ") + "はい", 60, 165);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === 1 ? "> " : "  ") + "いいえ", 60, 185);
      }
      resetShake(); return;
    }
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    if (this.stageTheme === 'grass') { gradient.addColorStop(0, '#4af'); gradient.addColorStop(1, '#8cf'); } 
    else if (this.stageTheme === 'desert') { gradient.addColorStop(0, '#fc8'); gradient.addColorStop(1, '#fa4'); } 
    else { gradient.addColorStop(0, '#f44'); gradient.addColorStop(1, '#a00'); }
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for(let i=0; i<5; i++) {
        let cx = ((Date.now() * 0.02) + i * 80) % 250 - 25;
        if(this.stageTheme !== 'lava') ctx.fillRect(cx, 30 + (i%3)*30, 40, 10);
        else { ctx.fillStyle='rgba(255,100,0,0.5)'; ctx.fillRect(cx, 200 - (i%3)*50, 5, 15); }
    }
    if (this.stageTheme === 'desert') { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(30, 50, 20, 0, Math.PI * 2); ctx.fill(); } 
    else if (this.stageTheme === 'lava') { ctx.fillStyle = 'rgba(255,100,0,0.3)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(50 + i * 60, 280, 30, 0, Math.PI * 2); ctx.fill(); } }

    ctx.save(); ctx.translate(-this.camX, 0);
    
    // 太陽の描画
    if (this.stageTheme === 'desert' && this.sun) {
       ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(this.sun.x, this.sun.y, 12, 0, Math.PI * 2); ctx.fill();
       ctx.fillStyle = '#f00'; ctx.font = '10px monospace'; ctx.fillText('▼', this.sun.x - 5, this.sun.y + 4); // 怒り顔
    }
    
    // 火球の描画
    if (this.stageTheme === 'lava') {
       for (let fb of this.fireballs) { ctx.fillStyle = '#f80'; ctx.beginPath(); ctx.arc(fb.x, fb.y, 8, 0, Math.PI * 2); ctx.fill(); }
    }

    for (let m of this.map) {
      if (m.x - this.camX > -50 && m.x - this.camX < 250) {
        if (m.type === 'ground' || m.type === 'fakeGround') { // ★ すり抜ける床も本物と同じように描画
          let num = Math.ceil(m.w / 20); for(let k=0; k<num; k++) drawSprite(m.x + k*20, m.y, '#8b4513', sprs.block, 2.5);
        } else if (m.type === 'checkpoint') {
          ctx.fillStyle = this.checkpointX === m.x ? '#0f0' : '#888'; ctx.fillRect(m.x + 8, m.y, 4, m.h); // 旗の棒
          ctx.fillStyle = this.checkpointX === m.x ? '#ff0' : '#ccc'; ctx.fillRect(m.x + 12, m.y + 5, 15, 15); // 旗
        } else if (m.type === 'goal') { 
          ctx.fillStyle = '#ffd700'; ctx.fillRect(m.x, m.y, m.w, m.h); ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('★', m.x + 7, m.y + 30); 
        }
      }
    }
    for (let plat of this.platforms) {
      if (plat.x - this.camX > -50 && plat.x - this.camX < 250) {
        let num = Math.ceil(plat.w / 20); for(let k=0; k<num; k++) drawSprite(plat.x + k*20, plat.y, '#654321', sprs.block, 2.5);
      }
    }
    for (let ib of this.invisibleBlocks) {
      if (ib.x - this.camX > -50 && ib.x - this.camX < 250) {
        if (ib.visible) { let num = Math.ceil(ib.w / 20); for(let k=0; k<num; k++) drawSprite(ib.x + k*20, ib.y, '#888', sprs.block, 2.5); } 
      }
    }
    for (let fc of this.fakeCoins) {
      if (!fc.touched && fc.x - this.camX > -50 && fc.x - this.camX < 250) {
        const offset = Math.sin(Date.now() / 100) * 3; drawSprite(fc.x - 4, fc.y + offset - 4, '#f00', sprs.coin, 2.0); 
      }
    }
    for (let s of this.fallingSpikes) { 
        if (s.x - this.camX > -50 && s.x - this.camX < 250) { ctx.fillStyle = '#888'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x+20, s.y); ctx.lineTo(s.x+10, s.y+20); ctx.fill(); } 
    }
    for (let spike of this.spikes) { if (spike.x - this.camX > -50 && spike.x - this.camX < 250) drawSprite(spike.x, spike.y, '#888', sprs.spike, 2.5); }
    for (let e of this.enemies) {
      if (e.y < 300 && e.x - this.camX > -50 && e.x - this.camX < 250) {
        const offsetY = e.enemyType === 'flying' ? Math.sin((e.anim || 0) * Math.PI / 180) * 4 : Math.sin((e.anim || 0) * Math.PI / 180) * 2;
        const color = e.troll ? '#f0f' : '#a00'; // 豹変スライムは少し毒々しい色に
        drawSprite(e.x - 4, e.y + offsetY - 4, color, sprs.enemyNew, 2.5);
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
    // ★ 残機がマイナスになっても平然と表示する
    ctx.fillText(`ST:${SaveSys.data.actStage} ♥:${SaveSys.data.actLives}`, 5, 20);
    
    if (this.st === 'dead' || this.st === 'gameover') { 
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 80); 
      ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('OOPS!', 80, 125); 
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(this.deathReason, 100 - (this.deathReason.length * 5), 145);
      ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('(A) Retry', 75, 165); 
    }
    if (this.st === 'clear') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 60); ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('CLEAR!', 75, 125); ctx.font = '10px monospace'; ctx.fillText('(A) Next Stage', 60, 145); }
    resetShake();
  }
};
