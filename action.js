// === UNREASONABLE BROS - TRUE COMPLETE EDITION (Standalone Texture & Camera Fix) ===
const Action = {
  st: 'title', map: [], platforms: [], coins: [], spikes: [], enemies: [], invisibleBlocks: [], fakeCoins: [],
  fallingSpikes: [], fireballs: [], sun: null, blackHole: null,
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1, trail: []},
  score: 0, camX: 0, coyoteTime: 0, stageTheme: 'grass',
  mIdx: 1, deathReason: '', checkpointX: 20, bgTimer: 0,
  titleCur: 0, stageSelect: 1,
  // ★ ステージ12ボス
  stage12Boss: null, stage12BossBullets: [],
  // ★ ステージ開始フラッシュ
  stageFlashTmr: 0,
  
  // ★ 1. アクションゲーム専用のテクスチャデータ（完全に内部化）
  tex: {
    hero: { w:8, h:8, pal:{'1':'#fcc', '2':'#000', '3':'#f00', '4':'#00f'}, d: "..........1111...121121..111111...4444...4.44.4..3.33.3....33..." },
    enemy: { w:8, h:8, pal:{'1':'#f00', '2':'#fff', '3':'#000'}, d: "..........1111...111111..231123..111111...1..1...11..11........." },
    coin: { w:8, h:8, pal:{'1':'#ff0', '2':'#fa0'}, d: "..........1111...122221..121121..121121..122221...1111.........." },
    spike: { w:8, h:8, pal:{'1':'#ddd', '2':'#888'}, d: "...................11.....1221....1221...122221..122221.12222221" }
  },

  // ★ 2. Action専用の爆速画像キャッシュエンジン
  texCache: {},
  getTexCanvas(texKey, color1, scale, flip) {
      const key = `${texKey}_${color1}_${scale}_${flip}`;
      if (this.texCache[key]) return this.texCache[key];
      
      const s = this.tex[texKey];
      if (!s) return null;
      
      const c = document.createElement('canvas');
      c.width = s.w * scale; c.height = s.h * scale;
      const cx = c.getContext('2d');
      
      if (flip) { cx.translate(c.width, 0); cx.scale(-1, 1); }
      
      for (let r = 0; r < s.h; r++) {
          for (let col = 0; col < s.w; col++) {
              let p = s.d[r * s.w + col];
              if (p !== '.' && p !== ' ' && p !== '0') {
                  let fillCol = (s.pal && s.pal[p]) ? s.pal[p] : (color1 || '#fff');
                  cx.fillStyle = fillCol;
                  cx.fillRect(col * scale, r * scale, scale, scale);
              }
          }
      }
      this.texCache[key] = c;
      return c;
  },

  // ★ 3. カメラの倍速ズレを直した描画関数（x, y をそのまま使う）
  drawTex(x, y, texKey, scale, flip, color1) {
      const c = this.getTexCanvas(texKey, color1, scale, flip);
      if (c) {
          // ctx.translate がすでに効いているので、ここではそのままの x, y に描画する！
          ctx.drawImage(c, Math.round(x), Math.round(y));
      }
  },

  init() { 
    this.st = 'title'; BGM.play('action'); 
    if (isNaN(SaveSys.data.actStage)) SaveSys.data.actStage = 1;
    if (isNaN(SaveSys.data.actSeed)) SaveSys.data.actSeed = Math.floor(Math.random() * 1000);
    if (SaveSys.data.actLives === undefined) { SaveSys.data.actLives = 5; SaveSys.save(); }
    this.checkpointX = 20; this.bgTimer = 0; this.titleCur = 0;
    this.stageSelect = SaveSys.data.actStage;
  },
  
  load() {
    this.st = 'play'; this.p = {x: this.checkpointX, y: 150, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1, trail: []};
    this.map = []; this.platforms = []; this.coins = []; this.spikes = []; this.enemies = []; 
    this.invisibleBlocks = []; this.fakeCoins = []; this.fallingSpikes = []; this.fireballs = []; 
    this.sun = null; this.blackHole = null; this.camX = 0; this.coyoteTime = 0; this.deathReason = '';
    this.stage12Boss = null; this.stage12BossBullets = []; this.stageFlashTmr = 60;
    
    SaveSys.data.actStage = this.stageSelect; SaveSys.save();

    const stage = SaveSys.data.actStage; 
    const themes = ['grass', 'desert', 'lava', 'ice', 'void', 'final', 'neon', 'dark', 'glitch', 'blood', 'space', 'ultimate'];
    this.stageTheme = themes[Math.min(stage - 1, themes.length - 1)];
    
    this.bgProps = [];
    for(let i=0; i<15; i++) {
        this.bgProps.push({
            x: Math.random() * 4000,
            y: 50 + Math.random() * 150,
            s: 10 + Math.random() * 30,
            v: 0.2 + Math.random() * 0.5,
            c: `rgba(255,255,255,${0.1 + Math.random() * 0.2})`
        });
    }
    
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

      let trapChance = stage >= 6 ? 0.4 + (stage - 6) * 0.05 : 0.3 + (stage * 0.04);
      let specialGimmickChance = stage >= 7 ? 0.2 : 0;

      if (trapCooldown <= 0 && rand() < trapChance) {
        let type = Math.floor(rand() * 8); 
        if (stage >= 7 && rand() < specialGimmickChance) type = 7; 

        switch(type) {
          case 0:
            this.map.push({x: currentX, y: 270, w: 40, h: 30, type: 'ground'});
            this.invisibleBlocks.push({x: currentX + 80, y: 190, w: 20, h: 20, visible: false, type: 'kaizo'});
            this.map.push({x: currentX + 130, y: 270, w: 90, h: 30, type: 'ground'});
            currentX += 220; break;
          case 7: 
            if (this.stageTheme === 'neon') {
               this.map.push({x: currentX, y: 270, w: 60, h: 30, type: 'ground'});
               this.spikes.push({x: currentX + 60, y: 250, w: 40, h: 20, blink: true});
               this.map.push({x: currentX + 100, y: 270, w: 60, h: 30, type: 'ground'});
               currentX += 160;
            } else if (this.stageTheme === 'glitch') {
               this.map.push({x: currentX, y: 270, w: 100, h: 30, type: 'ground', glitch: true}); 
               currentX += 150;
            } else if (this.stageTheme === 'space') {
               this.platforms.push({x: currentX, y: 200, w: 50, h: 10, moving: true, vy: 1, range: 60, startY: 200}); 
               currentX += 120;
            } else {
               this.map.push({x: currentX, y: 270, w: 100, h: 30, type: 'ground'});
               currentX += 100;
            }
            break;
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

    // ★ ステージ12: ボスを追加
    if (stage === 12) {
        this.stage12Boss = { x: 3900, y: 240, vx: 1.5, hp: 200, maxHp: 200, shotTimer: 0, dead: false };
    }
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
    
    if (this.st === 'title') {
      if (keysDown.up || keysDown.down) { this.titleCur = this.titleCur === 0 ? 1 : 0; playSnd('sel'); }
      
      if (this.titleCur === 0) {
          if (keysDown.left && this.stageSelect > 1) { this.stageSelect--; playSnd('sel'); }
          if (keysDown.right && this.stageSelect < 12) { this.stageSelect++; playSnd('sel'); }
      }
      
      if (keysDown.a) { 
        if (this.titleCur === 0) { this.checkpointX = 20; this.score = 0; this.load(); playSnd('jmp'); } 
        else { this.st = 'confirmDelete'; this.mIdx = 1; playSnd('sel'); }
      }
      return;
    }

    if (this.st === 'confirmDelete') {
      if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) { 
            SaveSys.data.actStage = 1; SaveSys.data.actLives = 5; 
            SaveSys.data.actSeed = Math.floor(Math.random() * 1000); SaveSys.save(); 
            this.stageSelect = 1; playSnd('hit'); this.st = 'title'; 
        } else { this.st = 'title'; playSnd('sel'); }
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
    this.p.vx *= friction; this.p.vy += gravity; this.p.anim = (this.p.anim + Math.abs(this.p.vx)) % 360;
    
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

    for (let i = this.map.length - 1; i >= 0; i--) {
      let m = this.map[i];
      if (m.glitch && m.timer === undefined) m.timer = 0;
      if ((m.type === 'ground' || m.type === 'checkpoint' || m.type === 'goal') && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) { 
        if (m.glitch) { m.timer++; if (m.timer > 30) { this.map.splice(i, 1); playSnd('hit'); addParticle(m.x, m.y, '#555', 'explosion'); continue; } }
        if (m.type === 'checkpoint') {
           if (this.checkpointX !== m.x) { this.checkpointX = m.x; playSnd('combo'); addParticle(m.x, m.y + 20, '#0f0', 'star'); }
        } else if (m.type === 'goal') {
           SaveSys.addLog('理不尽ブラザーズ', `ステージ${SaveSys.data.actStage}クリア`);
           SaveSys.data.actStage++; this.checkpointX = 20; SaveSys.save(); playSnd('combo');
           if (SaveSys.data.actStage > 12) { this.st = 'clear'; SaveSys.data.actStage = 1; SaveSys.save(); } else { this.stageSelect = SaveSys.data.actStage; this.load(); } return;
        } else {
           if (this.p.vy > 0 && this.p.y + 20 <= m.y + 5) { ny = m.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; }
           else if (nx + 20 > m.x && this.p.x + 20 <= m.x) nx = m.x - 20; 
           else if (nx < m.x + m.w && this.p.x >= m.x + m.w) nx = m.x + m.w;
        }
      }
    }
    
    for (let plat of this.platforms) {
      if (plat.moving) {
        if (plat.vx) {
          plat.x += plat.vx; if (Math.abs(plat.x - plat.startX) > plat.range) plat.vx *= -1;
        }
        if (plat.vy) {
          plat.y += plat.vy; if (Math.abs(plat.y - plat.startY) > plat.range) plat.vy *= -1;
        }
      }
      if (nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) {
        if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) { 
          ny = plat.y - 20; this.p.vy = 0; grounded = true; this.p.jumpCount = 0; this.coyoteTime = 5; 
          if (plat.moving && plat.vx) nx += plat.vx;
          if (plat.moving && plat.vy) ny += plat.vy;
        }
      }
    }

    for (let fc of this.fakeCoins) {
      if (fc.chase && !fc.touched && Math.abs(this.p.x - fc.x) < 150) {
         let speed = this.stageTheme === 'final' ? 2.5 : 1.5;
         fc.x += (this.p.x > fc.x ? speed : -speed); fc.y += (this.p.y > fc.y ? speed : -speed); 
      }
      if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) { fc.touched = true; this.p.vy = -12; playSnd('hit'); addParticle(fc.x, fc.y, '#f00', 'explosion'); screenShake(5); }
    }
    
    for (let coin of this.coins) {
      if (!coin.collected && Math.abs(nx + 10 - coin.x) < 15 && Math.abs(ny + 10 - coin.y) < 15) { 
          coin.collected = true; this.score += 100; playSnd('combo'); addParticle(coin.x, coin.y, '#ff0', 'explosion'); 
      }
    }

    for (let s of this.fallingSpikes) {
       if (!s.falling && Math.abs(this.p.x - s.x) < 40 && this.p.y > s.y) { s.falling = true; playSnd('hit'); }
       if (s.falling) s.y += 10;
       if (nx + 20 > s.x && nx < s.x + s.w && ny + 20 > s.y && ny < s.y + s.h) { this.die(s.isIce ? "鋭いツララ" : "頭上からのトゲ"); return; }
    }

    for (let spike of this.spikes) { 
      if (spike.blink && (Math.floor(this.bgTimer / 30) % 2 === 0)) continue;
      if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) { this.die("トゲに刺さった"); return; } 
    }
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      let e = this.enemies[i];
      e.vy = (e.vy || 0) + gravity; e.y += e.vy; if (e.y > 250) { e.y = 250; e.vy = 0; }
      
      if (e.troll && !e.triggered && Math.abs(this.p.x - e.x) < 90) { e.triggered = true; e.vy = jumpForce * 0.8; e.vx = (this.p.x > e.x ? 3.5 : -3.5); playSnd('jmp'); }
      if (!e.troll || !e.triggered) { e.x += e.vx; if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1; } else { e.x += e.vx; }

      e.anim = (e.anim || 0) + Math.abs(e.vx) * 2;
      
      if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) {
        if (this.p.vy > 0 && ny < e.y) { 
           this.enemies.splice(i, 1); this.p.vy = -6; this.score += 50; playSnd('hit'); addParticle(e.x, e.y, '#a00', 'explosion'); screenShake(4); 
        } else { this.die("魔物に触れた"); return; }
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
          fb.vy += gravity * 0.5; fb.y += fb.vy; if (fb.y > 400) { fb.y = 350; fb.vy = -10 - Math.random()*5; }
          if (Math.abs(nx + 10 - fb.x) < 15 && Math.abs(ny + 10 - fb.y) < 15) { this.die("下からの火球"); return; }
       }
    }

    if ((this.stageTheme === 'void' || this.stageTheme === 'final') && this.blackHole) {
       let dx = this.p.x - this.blackHole.x; let dy = this.p.y - this.blackHole.y; let dist = Math.sqrt(dx*dx + dy*dy);
       if (dist > 0) { this.blackHole.x += (dx/dist) * this.blackHole.speed; this.blackHole.y += (dy/dist) * this.blackHole.speed; }
       if (dist < 100) { nx -= (dx/dist)*0.5; ny -= (dy/dist)*0.5; }
       // ★ 壁への押し込み防止 (ブラックホールの引力で壁に押し込まれないようにする)
       nx = Math.max(10, Math.min(canvas.width - 10, nx));
       ny = Math.max(10, Math.min(280, ny));
       if (dist < this.blackHole.radius - 5) { this.die("虚無に飲まれた"); return; }
    }
    
    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    if ((grounded || this.coyoteTime > 0) && keysDown.a) { this.p.vy = jumpForce; this.p.jumpCount++; this.coyoteTime = 0; playSnd('jmp'); addParticle(this.p.x + 10, this.p.y + 20, '#fff', 'star'); }
    this.p.x = Math.max(0, nx); this.p.y = ny;

    if (this.p.y > 320) { this.die("奈落へ落ちた"); return; }

    // ★ ステージ12ボス更新
    if (this.stage12Boss && !this.stage12Boss.dead) {
        let b12 = this.stage12Boss;
        b12.x += b12.vx;
        if (b12.x < 3810 || b12.x > 4080) b12.vx *= -1;
        b12.shotTimer++;
        if (b12.shotTimer >= 90) {
            b12.shotTimer = 0;
            this.stage12BossBullets.push({ x: b12.x + 10, y: b12.y + 10, vy: 2.5 });
        }
        // ボス弾の更新
        for (let i = this.stage12BossBullets.length - 1; i >= 0; i--) {
            let bl = this.stage12BossBullets[i];
            bl.y += bl.vy;
            if (bl.y > 340) { this.stage12BossBullets.splice(i, 1); continue; }
            if (Math.abs(this.p.x + 10 - bl.x) < 12 && Math.abs(this.p.y + 10 - bl.y) < 12) { this.die("ボスの弾に当たった"); return; }
        }
        // ボスへの弾当たり判定
        for (let i = this.p.trail.length; i >= 0; i--) { /* placeholder */ }
        if (Math.abs(this.p.x + 10 - b12.x - 10) < 22 && Math.abs(this.p.y + 10 - b12.y - 10) < 22) {
            if (this.p.vy > 0 && this.p.y + 20 <= b12.y + 10) {
                b12.hp -= 50; this.p.vy = -6; playSnd('hit'); screenShake(5);
                addParticle(b12.x + 10, b12.y, '#f0f', 'explosion');
                if (b12.hp <= 0) { b12.dead = true; playSnd('combo'); screenShake(15); this.score += 500; addParticle(b12.x+10, b12.y+10, '#ff0', 'explosion'); }
            } else { this.die("ボスに触れた"); return; }
        }
    }

    this.camX = Math.max(0, Math.min(this.p.x - 100, 3800));
    if (this.stageFlashTmr > 0) this.stageFlashTmr--;
    updateParticles();
  },
  
  // ★ 4. drawBlockもカメラのズレを完璧に修正
  drawBlock(x, y, w, h, type, fake) {
    const theme = this.stageTheme;
    let base = '#642', top = '#0f0';
    if (theme === 'desert') { base = '#c85'; top = '#fb5'; }
    else if (theme === 'lava') { base = '#300'; top = '#f30'; }
    else if (theme === 'ice') { base = '#6be'; top = '#fff'; }
    else if (theme === 'void') { base = '#103'; top = '#a0f'; }
    else if (theme === 'final') { base = (Math.random()<0.05?'#f0f':'#103'); top = (Math.random()<0.1?'#0ff':'#f00'); }
    else if (theme === 'neon') { base = '#000'; top = '#0ff'; }
    else if (theme === 'dark') { base = '#111'; top = '#444'; }
    else if (theme === 'glitch') { base = (Math.random()<0.1?'#0f0':'#000'); top = (Math.random()<0.1?'#f0f':'#0ff'); }
    else if (theme === 'blood') { base = '#200'; top = '#900'; }
    else if (theme === 'space') { base = '#001'; top = '#fff'; }
    else if (theme === 'ultimate') { base = '#222'; top = `hsl(${this.bgTimer % 360}, 100%, 50%)`; }

    if (fake) base = '#432';
    
    // ctx.translateが効いているので、x, yをそのまま使う！
    // ただし描画をサボるための「画面内判定」には camX との比較を使う
    if (x - this.camX + w > -50 && x - this.camX < 250) {
        ctx.fillStyle = base; 
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = top; 
        ctx.fillRect(x, y, w, 4);
        
        ctx.globalAlpha = 0.1;
        for(let i=0; i<w; i+=8) {
            for(let j=0; j<h; j+=8) {
                if((i+j)%16 === 0) { ctx.fillStyle = '#000'; ctx.fillRect(x+i, y+j, 4, 4); }
            }
        }
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeRect(x, y, w, h);
    }
  },

  draw() {
    if (this.st === 'title' || this.st === 'confirmDelete') {
      const gradient = ctx.createLinearGradient(0, 0, 0, 300); gradient.addColorStop(0, '#f40'); gradient.addColorStop(1, '#820'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 200, 300);
      ctx.shadowBlur = 20; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText('UNREASONABLE', 30, 80); ctx.fillText('BROTHERS', 45, 105); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('～理不尽なアクション～', 30, 130);
      
      for (let i = 0; i < 5; i++) { const x = 30 + i * 30; const y = 160 + Math.sin(this.bgTimer / 10 + i) * 5; this.drawTex(x, y, 'hero', 2.5, false, '#00f'); }
      
      if (this.st === 'title') {
        ctx.fillStyle = this.titleCur === 0 ? '#ff0' : '#fff'; ctx.font = 'bold 12px monospace'; 
        ctx.fillText((this.titleCur === 0 ? '> ' : '  ') + 'はじめる', 50, 220);
        if (this.titleCur === 0) {
            ctx.fillStyle = '#0f0'; ctx.font = '10px monospace'; ctx.fillText(`[STAGE ${this.stageSelect}]`, 60, 235);
            if (this.stageSelect > 1) ctx.fillText('◀', 45, 235); if (this.stageSelect < 12) ctx.fillText('▶', 130, 235);
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
      return;
    }
    
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    const theme = this.stageTheme;
    if (theme === 'grass') { grad.addColorStop(0, '#4af'); grad.addColorStop(1, '#8cf'); } 
    else if (theme === 'desert') { grad.addColorStop(0, '#fc8'); grad.addColorStop(1, '#fa4'); } 
    else if (theme === 'lava') { grad.addColorStop(0, '#400'); grad.addColorStop(1, '#a00'); }
    else if (theme === 'ice') { grad.addColorStop(0, '#cdf'); grad.addColorStop(1, '#fff'); }
    else if (theme === 'void') { grad.addColorStop(0, '#001'); grad.addColorStop(1, '#204'); }
    else if (theme === 'final') { grad.addColorStop(0, Math.random()<0.1?'#f00':'#100'); grad.addColorStop(1, '#303'); }
    else if (theme === 'neon') { grad.addColorStop(0, '#000'); grad.addColorStop(1, '#003'); }
    else if (theme === 'dark') { grad.addColorStop(0, '#000'); grad.addColorStop(1, '#111'); }
    else if (theme === 'glitch') { grad.addColorStop(0, '#000'); grad.addColorStop(1, '#222'); }
    else if (theme === 'blood') { grad.addColorStop(0, '#200'); grad.addColorStop(1, '#000'); }
    else if (theme === 'space') { grad.addColorStop(0, '#000'); grad.addColorStop(1, '#001'); }
    else if (theme === 'ultimate') { grad.addColorStop(0, '#000'); grad.addColorStop(1, `hsl(${this.bgTimer % 360}, 30%, 20%)`); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    // 背景の装飾オブジェクト描画
    ctx.save(); ctx.translate(-this.camX * 0.5, 0); // パララックス
    for(let prop of this.bgProps) {
        ctx.fillStyle = prop.c;
        if(theme === 'space') { ctx.fillRect(prop.x, prop.y, 2, 2); }
        else { ctx.beginPath(); ctx.arc(prop.x, prop.y, prop.s, 0, Math.PI*2); ctx.fill(); }
    }
    ctx.restore();
    
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for(let i=0; i<5; i++) {
        let cx = ((this.bgTimer * 0.5) + i * 80) % 250 - 25;
        if(this.stageTheme === 'grass' || this.stageTheme === 'desert') ctx.fillRect(cx, 30 + (i%3)*30, 40, 10); 
        else if (this.stageTheme === 'ice') { ctx.fillStyle='#fff'; ctx.fillRect((cx*2)%200, (this.bgTimer+i*50)%300, 2, 2); } 
        else if (this.stageTheme === 'lava' || this.stageTheme === 'final') { ctx.fillStyle='rgba(255,100,0,0.6)'; ctx.fillRect(cx, 300 - ((this.bgTimer*2+i*40)%300), 3, 6); } 
        else if (this.stageTheme === 'void') { ctx.fillStyle='#fff'; ctx.fillRect((cx*3)%200, (i*60)%300, 1, 1); } 
    }
    
    // ★ ここから下が「メインのカメラずらし」
    ctx.save(); ctx.translate(-this.camX, 0);
    
    if (this.stageTheme === 'desert') { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(30 + this.camX, 50, 20, 0, Math.PI * 2); ctx.fill(); } 
    else if (this.stageTheme === 'lava') { ctx.fillStyle = `rgba(255,50,0,${0.3+Math.sin(this.bgTimer/10)*0.2})`; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(50 + i * 60 + this.camX, 280, 40, 0, Math.PI * 2); ctx.fill(); } }
    else if (this.stageTheme === 'void' || this.stageTheme === 'final') { ctx.strokeStyle = 'rgba(255,0,255,0.2)'; for(let i=0; i<200; i+=20){ ctx.beginPath(); ctx.moveTo(i + this.camX, 0); ctx.lineTo(i + this.camX, 300); ctx.stroke(); ctx.beginPath(); ctx.moveTo(this.camX, i*1.5); ctx.lineTo(200 + this.camX, i*1.5); ctx.stroke(); } }

    if ((this.stageTheme === 'desert' || this.stageTheme === 'final') && this.sun) {
       ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(this.sun.x, this.sun.y, 14, 0, Math.PI * 2); ctx.fill();
       ctx.fillStyle = '#f00'; ctx.font = 'bold 12px monospace'; ctx.fillText('▼', this.sun.x - 6, this.sun.y + 4);
       if (this.sun.state === 'wait' && this.sun.timer > 100) { ctx.strokeStyle = '#f00'; ctx.beginPath(); ctx.arc(this.sun.x, this.sun.y, 14 + (this.sun.timer%10), 0, Math.PI*2); ctx.stroke(); }
    }
    
    if (this.stageTheme === 'lava' || this.stageTheme === 'final') {
       for (let fb of this.fireballs) { ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(fb.x, fb.y, 10, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f00'; ctx.beginPath(); ctx.arc(fb.x, fb.y+4, 8, 0, Math.PI * 2); ctx.fill(); }
    }

    if ((this.stageTheme === 'void' || this.stageTheme === 'final') && this.blackHole) {
       ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.blackHole.x, this.blackHole.y, this.blackHole.radius, 0, Math.PI * 2); ctx.fill();
       ctx.strokeStyle = `rgba(150, 0, 255, ${0.5 + Math.sin(this.bgTimer/5)*0.5})`; ctx.lineWidth = 4;
       ctx.beginPath(); ctx.arc(this.blackHole.x, this.blackHole.y, this.blackHole.radius + 2, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }

    for (let m of this.map) {
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
    
    for (let plat of this.platforms) { this.drawBlock(plat.x, plat.y, plat.w, plat.h, 'plat', false); }
    for (let ib of this.invisibleBlocks) { if (ib.visible) this.drawBlock(ib.x, ib.y, ib.w, ib.h, 'inv', false); }
    
    for (let fc of this.fakeCoins) {
      if (!fc.touched) {
        const offset = Math.sin(this.bgTimer / 10) * 3; this.drawTex(fc.x - 4, fc.y + offset - 4, 'coin', 2.0, false, '#f00'); 
      }
    }
    for (let coin of this.coins) {
      if (!coin.collected) {
        const offset = Math.sin(this.bgTimer / 10) * 3; this.drawTex(coin.x - 4, coin.y + offset - 4, 'coin', 2.0, false, '#ff0'); 
      }
    }
    
    for (let s of this.fallingSpikes) { 
        ctx.fillStyle = s.isIce ? '#8ff' : '#888'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x+20, s.y); ctx.lineTo(s.x+10, s.y+20); ctx.fill();
    }
    
    for (let spike of this.spikes) { 
      if (spike.blink && (Math.floor(this.bgTimer / 30) % 2 === 0)) ctx.globalAlpha = 0.2;
      this.drawTex(spike.x, spike.y, 'spike', 2.5, false, spike.blink ? '#0ff' : '#aaa'); 
      ctx.globalAlpha = 1.0;
    }
    
    for (let e of this.enemies) {
      if (e.y < 300) {
        const offsetY = Math.sin((e.anim || 0) * Math.PI / 180) * 2;
        // Enemy type: troll = mid-tier skeleton warrior, normal = goblin
        ctx.save();
        let ex = e.x - 4, ey = e.y + offsetY - 4;
        if (e.troll) {
            // Mid-tier enemy: skeleton warrior (8x8 fillRect pixel art)
            ctx.shadowBlur = 5; ctx.shadowColor = '#f0f';
            // Skull
            ctx.fillStyle = '#ddd'; ctx.fillRect(ex+2, ey, 12, 8);    // skull top
            ctx.fillStyle = '#000'; ctx.fillRect(ex+3, ey+2, 3, 2);   // left eye socket
            ctx.fillRect(ex+8, ey+2, 3, 2);                           // right eye socket
            ctx.fillStyle = '#ddd'; ctx.fillRect(ex+3, ey+6, 10, 2);  // jaw
            ctx.fillStyle = '#000'; ctx.fillRect(ex+5, ey+6, 2, 2);   // tooth gap
            ctx.fillRect(ex+9, ey+6, 2, 2);
            // Ribcage body
            ctx.fillStyle = '#bbb'; ctx.fillRect(ex+2, ey+9, 12, 6);
            ctx.fillStyle = '#000'; ctx.fillRect(ex+4, ey+10, 2, 2);
            ctx.fillRect(ex+8, ey+10, 2, 2);
            ctx.fillRect(ex+4, ey+13, 2, 2);
            ctx.fillRect(ex+8, ey+13, 2, 2);
            // Arms (bone-colored)
            ctx.fillStyle = '#ccc'; ctx.fillRect(ex, ey+9, 2, 8);     // left arm
            ctx.fillRect(ex+14, ey+9, 2, 8);                          // right arm
            // Legs
            ctx.fillRect(ex+4, ey+16, 3, 4);
            ctx.fillRect(ex+9, ey+16, 3, 4);
            ctx.shadowBlur = 0;
        } else {
            // Normal enemy: small goblin
            ctx.shadowBlur = 3; ctx.shadowColor = '#600';
            // Goblin head (green-toned)
            ctx.fillStyle = '#4a3'; ctx.fillRect(ex+3, ey, 10, 8);
            ctx.fillStyle = '#000'; ctx.fillRect(ex+4, ey+2, 2, 2);   // left eye
            ctx.fillRect(ex+9, ey+2, 2, 2);                           // right eye
            ctx.fillStyle = '#f00'; ctx.fillRect(ex+5, ey+5, 5, 2);   // mouth/frown
            // Ears
            ctx.fillStyle = '#3a2'; ctx.fillRect(ex+1, ey+2, 2, 3);
            ctx.fillRect(ex+13, ey+2, 2, 3);
            // Body
            ctx.fillStyle = '#532'; ctx.fillRect(ex+3, ey+8, 10, 7);
            // Arms
            ctx.fillStyle = '#4a3'; ctx.fillRect(ex, ey+9, 3, 4);
            ctx.fillRect(ex+13, ey+9, 3, 4);
            // Legs
            ctx.fillStyle = '#532'; ctx.fillRect(ex+4, ey+15, 3, 4);
            ctx.fillRect(ex+9, ey+15, 3, 4);
            // Boots
            ctx.fillStyle = '#321'; ctx.fillRect(ex+3, ey+18, 4, 2);
            ctx.fillRect(ex+8, ey+18, 4, 2);
            ctx.shadowBlur = 0;
        }
        ctx.restore();
      }
    }
    
    if (this.st !== 'dead' && this.st !== 'gameover') {
      for(let i=0; i<this.p.trail.length; i++) {
          let tr = this.p.trail[i]; ctx.globalAlpha = 0.5 - (i*0.1);
          this.drawTex(tr.x, tr.y, 'hero', 2.5, tr.dir < 0, '#0ff');
      }
      ctx.globalAlpha = 1;
      this.drawTex(this.p.x, this.p.y, 'hero', 2.5, this.p.dir < 0, '#00f');
    }

    // ★ ステージ12ボス描画 (large intimidating pixel art, 8x8 fillRect)
    if (this.stage12Boss && !this.stage12Boss.dead) {
        let b12 = this.stage12Boss;
        let bx = b12.x, by = b12.y;
        let bFlash = Math.floor(this.bgTimer / 8) % 2 === 0;
        ctx.save();
        ctx.shadowBlur = 12 + Math.sin(this.bgTimer * 0.15) * 6;
        ctx.shadowColor = '#f0f';
        // Boss body (32x32 area using 4px pixels)
        // Crown
        ctx.fillStyle = '#ff0';
        ctx.fillRect(bx+4, by, 4, 4);
        ctx.fillRect(bx+12, by, 4, 4);
        ctx.fillRect(bx+20, by, 4, 4);
        // Crown base
        ctx.fillRect(bx+2, by+4, 24, 4);
        // Head
        ctx.fillStyle = bFlash ? '#f8f' : '#d0d';
        ctx.fillRect(bx+2, by+8, 24, 16);
        // Eyes
        ctx.fillStyle = '#ff0';
        ctx.fillRect(bx+6, by+12, 4, 4);
        ctx.fillRect(bx+18, by+12, 4, 4);
        // Pupils
        ctx.fillStyle = '#000';
        ctx.fillRect(bx+7, by+13, 2, 2);
        ctx.fillRect(bx+19, by+13, 2, 2);
        // Nose/mouth
        ctx.fillStyle = '#f44';
        ctx.fillRect(bx+12, by+16, 4, 2);
        ctx.fillRect(bx+8, by+20, 12, 2);
        // Shoulders
        ctx.fillStyle = '#808';
        ctx.fillRect(bx, by+24, 28, 6);
        // Arms (claws)
        ctx.fillStyle = '#a0a';
        ctx.fillRect(bx-4, by+24, 6, 10);
        ctx.fillRect(bx+26, by+24, 6, 10);
        // Claw tips
        ctx.fillStyle = '#f0f';
        ctx.fillRect(bx-4, by+34, 2, 3);
        ctx.fillRect(bx-1, by+34, 2, 3);
        ctx.fillRect(bx+26, by+34, 2, 3);
        ctx.fillRect(bx+29, by+34, 2, 3);
        ctx.shadowBlur = 0;
        ctx.restore();

        // BOSS label
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 6; ctx.shadowColor = '#ff0';
        ctx.fillText('BOSS', bx + 14, by - 4);
        ctx.shadowBlur = 0; ctx.textAlign = 'left';

        // HP bar (wider, detailed)
        ctx.fillStyle = '#500'; ctx.fillRect(bx - 2, by - 10, 32, 5);
        ctx.fillStyle = '#f00'; ctx.fillRect(bx - 2, by - 10, 32 * (b12.hp / b12.maxHp), 5);
        ctx.strokeStyle = '#f44'; ctx.lineWidth = 1; ctx.strokeRect(bx - 2, by - 10, 32, 5);
        ctx.lineWidth = 1;
    }
    for (let bl of this.stage12BossBullets) {
        ctx.fillStyle = '#f0f'; ctx.beginPath(); ctx.arc(bl.x, bl.y, 4, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();

    drawParticles();
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 25);
    ctx.fillStyle = this.stageTheme === 'final' ? '#f0f' : '#0f0'; ctx.font = 'bold 10px monospace';
    let stName = this.stageTheme.toUpperCase();
    ctx.fillText(`ST${SaveSys.data.actStage}[${stName}]`, 5, 17);
    ctx.fillStyle = '#ff0'; ctx.fillText(`SC:${this.score}`, 85, 17);
    ctx.fillStyle = '#f00'; ctx.fillText(`♥:${SaveSys.data.actLives}`, 150, 17);

    // ★ STAGE X フラッシュ表示 (ステージ開始から60フレーム)
    if (this.stageFlashTmr > 0) {
        let alpha = this.stageFlashTmr > 45 ? (60 - this.stageFlashTmr) / 15 : (this.stageFlashTmr / 45);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.textAlign = 'center'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px "Arial Black", sans-serif';
        ctx.fillText(`STAGE ${SaveSys.data.actStage}`, 100, 155);
        ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.globalAlpha = 1.0;
    }
    
    if (this.st === 'dead' || this.st === 'gameover') { 
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 100, 200, 80); ctx.strokeStyle = '#f00'; ctx.strokeRect(0, 100, 200, 80);
      ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText('YOU DIED', 65, 125); 
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(this.deathReason, 100 - (this.deathReason.length * 5), 145);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('(A) Retry', 75, 165); 
    }
    if (this.st === 'clear') { 
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 80, 200, 100); ctx.strokeStyle = '#0f0'; ctx.strokeRect(0, 80, 200, 100);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText(SaveSys.data.actStage === 1 && this.st === 'clear' ? 'ALL CLEAR!!' : 'STAGE CLEAR!', 50, 115); 
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(`残機: ${SaveSys.data.actLives}`, 70, 140);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(SaveSys.data.actStage === 1 && this.st === 'clear' ? '(A) Title' : '(A) Next Stage', 60, 165); 
    }
  }
};
