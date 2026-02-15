// ========================================
// TETRIVADER - テトリス×インベーダー融合ゲーム
// ========================================
const Tetri = {
  mode: 'normal',
  difficultySelect: false,
  brd: [],
  blts: [],
  m: null,
  px: 4.5,
  cool: 0,
  sc: 0,
  st: 'play',
  dropCounter: 0,
  combo: 0,
  starFall: false,
  starY: 0,
  starX: 5,
  danmakuMode: false,
  danmakuTimer: 0,
  danmakuBullets: [],
  playerHit: false,
  scoreBeforeDanmaku: 0,

  init(start = false) {
    if (!start) {
      this.difficultySelect = true;
      this.mode = 'normal';
      return;
    }

    this.difficultySelect = false;
    this.brd = Array(15).fill().map(() => Array(10).fill(0));
    this.px = 4.5;
    this.cool = 0;
    this.sc = 0;
    this.blts = [];
    this.st = 'play';
    this.dropCounter = 0;
    this.combo = 0;
    this.starFall = false;
    this.starY = 0;
    this.starX = 5;
    this.danmakuMode = false;
    this.danmakuTimer = 0;
    this.danmakuBullets = [];
    this.playerHit = false;
    this.scoreBeforeDanmaku = 0;
    this.spawn();
    BGM.play('tetri');
  },

  spawn() {
    let t = Math.floor(Math.random() * 7);
    const M = [
      [[1,1,1,1]],
      [[1,0,0],[1,1,1]],
      [[0,0,1],[1,1,1]],
      [[1,1],[1,1]],
      [[0,1,1],[1,1,0]],
      [[0,1,0],[1,1,1]],
      [[1,1,0],[0,1,1]]
    ];
    const shape = M[t].map(r => [...r]);
    const maxX = 10 - shape[0].length;
    const randomX = Math.floor(Math.random() * (maxX + 1));
    this.m = {
      s: shape,
      x: randomX,
      y: 0,
      c: ['#0ff', '#00f', '#f80', '#ff0', '#0f0', '#808', '#f00'][t]
    };
    if (this.hit(this.m.x, this.m.y)) this.gameover();

    // Hardモードでスター出現判定
    if (this.mode === 'hard' && Math.random() < 0.15 && !this.starFall && !this.danmakuMode) {
      this.starFall = true;
      this.starY = 0;
      this.starX = Math.floor(Math.random() * 10);
    }
  },

  hit(x, y) {
    for (let r = 0; r < this.m.s.length; r++) {
      for (let c = 0; c < this.m.s[0].length; c++) {
        if (this.m.s[r][c]) {
          let nx = x + c, ny = y + r;
          if (nx < 0 || nx >= 10 || ny >= 15) return true;
          if (ny >= 0 && this.brd[ny][nx]) return true;
        }
      }
    }
    return false;
  },

  gameover() {
    this.st = 'over';
    let high = this.mode === 'normal' ? SaveSys.data.scores.n : SaveSys.data.scores.h;
    if (this.sc > high) {
      if (this.mode === 'normal') SaveSys.data.scores.n = this.sc;
      else SaveSys.data.scores.h = this.sc;
      SaveSys.save();
    }
    SaveSys.addScore(this.mode, this.sc);
  },

  update() {
    if (keysDown.select) {
      if (this.difficultySelect) {
        this.difficultySelect = false;
        activeApp = Menu;
        Menu.init();
      } else {
        this.st = 'over';
        this.difficultySelect = false;
        activeApp = Menu;
        Menu.init();
      }
      return;
    }

    // 難易度選択画面
    if (this.difficultySelect) {
      if (keysDown.up || keysDown.down) {
        this.mode = this.mode === 'normal' ? 'hard' : 'normal';
        playSnd('sel');
      }
      if (keysDown.a) {
        playSnd('jmp');
        this.init(true);
      }
      return;
    }

    if (this.st === 'over') {
      if (keysDown.a || keysDown.b) {
        this.difficultySelect = false;
        activeApp = Menu;
        Menu.init();
      }
      return;
    }

    // 弾幕モード
    if (this.danmakuMode) {
      this.danmakuTimer--;
      // プレイヤー移動（弾幕モード）
      if (keys.left) this.px = Math.max(0, this.px - 0.2);
      if (keys.right) this.px = Math.min(9, this.px + 0.2);
      
      // 弾幕生成（より危険に）
      if (Math.random() < 0.15) {
        const patterns = [
          // 直線
          {x: Math.random() * 10, y: 0, vx: 0, vy: 0.15, type: 'normal'},
          // 曲線
          {x: Math.random() * 10, y: 0, vx: (Math.random() - 0.5) * 0.3, vy: 0.15, type: 'curve'},
          // 加速
          {x: Math.random() * 10, y: 0, vx: 0, vy: 0.1, type: 'accel'}
        ];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        this.danmakuBullets.push(pattern);
      }
      
      // 弾幕更新
      for (let i = this.danmakuBullets.length - 1; i >= 0; i--) {
        let b = this.danmakuBullets[i];
        if (b.type === 'accel') {
          b.vy += 0.005;
        }
        
        b.x += b.vx;
        b.y += b.vy;
        
        // 当たり判定（厳しめ）
        if (Math.abs(b.x - this.px - 0.5) < 0.4 && Math.abs(b.y - 14) < 0.4) {
          this.playerHit = true;
          playSnd('hit');
          addParticle(this.px * 20 + 10, 14 * 20 + 10, '#f00', 'explosion');
          screenShake(10);
          
          // 失敗時は即座に通常ゲームに戻る
          this.danmakuMode = false;
          this.danmakuBullets = [];
          this.playerHit = false;
          return;
        }
        
        if (b.y > 15) this.danmakuBullets.splice(i, 1);
      }
      
      // 弾幕モード終了
      if (this.danmakuTimer <= 0) {
        this.danmakuMode = false;
        this.danmakuBullets = [];
        if (!this.playerHit) {
          // 成功時のみ2倍
          const beforeScore = this.scoreBeforeDanmaku;
          const gainedScore = this.sc - beforeScore;
          this.sc = beforeScore + (gainedScore * 2);
          playSnd('combo');
          addParticle(100, 150, '#ff0', 'explosion');
          screenShake(8);
        }
        this.playerHit = false;
      }
      return;
    }

    // 通常モード
    if (keys.left) this.px = Math.max(0, this.px - 0.15);
    if (keys.right) this.px = Math.min(9, this.px + 0.15);
    
    if (keysDown.a && this.cool <= 0) {
      this.blts.push({x: this.px + 0.5, y: 14});
      this.cool = 10;
      playSnd('jmp');
      addParticle(this.px * 20 + 10, 14 * 20, '#ff0', 'star');
    }
    if (this.cool > 0) this.cool--;

    // スター落下処理
    if (this.starFall) {
      this.starY += 0.1;
      if (this.starY >= 14) {
        // 地面に着いた = 弾幕モード開始
        this.scoreBeforeDanmaku = this.sc;
        this.danmakuMode = true;
        this.danmakuTimer = 600; // 10秒（60fps）
        this.starFall = false;
        playSnd('combo');
        screenShake(5);
      }
      
      // スターを撃った場合は消える
      for (let i = this.blts.length - 1; i >= 0; i--) {
        let b = this.blts[i];
        let bx = Math.floor(b.x), by = Math.floor(b.y);
        if (Math.abs(bx - this.starX) < 1 && Math.abs(by - this.starY) < 1) {
          this.starFall = false;
          this.blts.splice(i, 1);
          break;
        }
      }
    }

    // 弾丸処理（範囲拡大）
    for (let i = this.blts.length - 1; i >= 0; i--) {
      let b = this.blts[i];
      b.y -= 0.6;
      let h = false;
      let bx = Math.floor(b.x), by = Math.floor(b.y);
      
      // ブロック破壊（周囲も破壊）
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          let tx = bx + dx, ty = by + dy;
          if (ty >= 0 && ty < 15 && tx >= 0 && tx < 10 && this.brd[ty][tx]) {
            this.brd[ty][tx] = 0;
            h = true;
            this.sc += 3;
            this.combo++;
            addParticle(tx * 20 + 10, ty * 20 + 10, '#ff0', 'star');
          }
        }
      }
      
      if (h) {
        playSnd('hit');
        screenShake(2);
      }
      
      // ミノ破壊
      if (this.m && by >= this.m.y && by < this.m.y + this.m.s.length && 
          bx >= this.m.x && bx < this.m.x + this.m.s[0].length) {
        let localY = by - this.m.y, localX = bx - this.m.x;
        if (this.m.s[localY] && this.m.s[localY][localX]) {
          this.m.s[localY][localX] = 0;
          h = true;
          this.sc += 10;
          this.combo++;
          playSnd('hit');
          addParticle(bx * 20 + 10, by * 20 + 10, this.m.c, 'explosion');
          screenShake(3);
          
          let isEmpty = true;
          for (let r = 0; r < this.m.s.length; r++) {
            for (let c = 0; c < this.m.s[r].length; c++) {
              if (this.m.s[r][c]) isEmpty = false;
            }
          }
          if (isEmpty) {
            this.sc += 50 + this.combo * 5;
            playSnd('combo');
            addParticle(100, 150, '#0f0', 'explosion');
            screenShake(5);
            this.spawn();
          }
        }
      }
      
      if (h || b.y < 0) this.blts.splice(i, 1);
    }

    let baseSpeed = this.mode === 'hard' ? 15 : 25;
    let dropSpeed = keys.b ? 3 : 1;
    this.dropCounter += dropSpeed;

    if (this.dropCounter >= baseSpeed) {
      this.dropCounter = 0;
      if (this.m) {
        this.m.y++;
        if (this.hit(this.m.x, this.m.y)) {
          this.m.y--;
          for (let r = 0; r < this.m.s.length; r++) {
            for (let c = 0; c < this.m.s[0].length; c++) {
              if (this.m.s[r][c] && this.m.y + r >= 0) {
                this.brd[this.m.y + r][this.m.x + c] = this.m.c;
              }
            }
          }
          
          let linesCleared = 0;
          for (let r = 14; r >= 0; r--) {
            if (this.brd[r].every(v => v !== 0)) {
              this.brd.splice(r, 1);
              this.brd.unshift(Array(10).fill(0));
              this.sc += 100;
              linesCleared++;
              playSnd('combo');
              addParticle(100, r * 20, '#fff', 'line');
              screenShake(4);
              r++;
            }
          }
          if (linesCleared > 0) this.combo += linesCleared * 2; // バグ修正: コンボ加算
          this.spawn();
        }
      }
    }

    let pLeft = Math.floor(this.px);
    let pRight = Math.floor(Math.min(9, this.px + 0.9));
    if (this.brd[14][pLeft] || this.brd[14][pRight]) this.gameover();

    updateParticles();
  },

  draw() {
    applyShake();

    // 難易度選択画面
    if (this.difficultySelect) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 200, 300);
      
      ctx.fillStyle = '#0f0';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('TETRIVADER', 50, 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('難易度を選択', 60, 80);
      
      const modes = [
        {name: 'NORMAL', desc: '標準的な難易度'},
        {name: 'HARD', desc: '高速＋弾幕モード'}
      ];
      
      for (let i = 0; i < 2; i++) {
        const selected = (i === 0 && this.mode === 'normal') || (i === 1 && this.mode === 'hard');
        ctx.fillStyle = selected ? '#0f0' : '#666';
        ctx.fillRect(30, 110 + i * 60, 140, 45);
        
        ctx.fillStyle = selected ? '#000' : '#aaa';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(modes[i].name, 60, 135 + i * 60);
        ctx.font = '9px monospace';
        ctx.fillText(modes[i].desc, 40, 148 + i * 60);
      }
      
      ctx.fillStyle = '#888';
      ctx.font = '9px monospace';
      ctx.fillText('↑↓: 選択  A: 決定', 50, 270);
      ctx.fillText('SELECT: 戻る', 60, 285);
      
      resetShake();
      return;
    }

    // 弾幕モード
    if (this.danmakuMode) {
      ctx.fillStyle = '#200';
      ctx.fillRect(0, 0, 200, 300);
      
      // 警告表示
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('DANMAKU MODE!', 40, 30);
      
      // 2倍ボーナス表示
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('SUCCESS = x2 SCORE!', 30, 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      const timeLeft = Math.ceil(this.danmakuTimer / 60);
      ctx.fillText(`TIME: ${timeLeft}`, 70, 65);
      
      // 弾幕描画（危険なデザイン）
      this.danmakuBullets.forEach(b => {
        // 外側の赤い光
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f00';
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(b.x * 20 + 10, b.y * 20 + 10, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // 内側のコア
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0';
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(b.x * 20 + 10, b.y * 20 + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心の白い点
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(b.x * 20 + 10, b.y * 20 + 10, 1, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      
      // プレイヤー（小さい当たり判定表示）
      drawSprite(this.px * 20, 14 * 20 + 5, '#0ff', sprs.player, 2.5);
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.px * 20 + 8, 14 * 20 + 13, 4, 4);
      
      drawParticles();
      if (this.playerHit) {
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0, 0, 200, 300);
      }
      
      resetShake();
      return;
    }

    // 通常画面
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 200, 300);

    const db = (x, y, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x * 20, y * 20, 20, 20);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x * 20, y * 20, 20, 3);
      ctx.fillRect(x * 20, y * 20, 3, 20);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(x * 20, y * 20, 20, 20);
    };

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        if (this.brd[r][c]) db(c, r, this.brd[r][c]);
      }
    }

    if (this.m) {
      for (let r = 0; r < this.m.s.length; r++) {
        for (let c = 0; c < this.m.s[0].length; c++) {
          if (this.m.s[r][c]) db(this.m.x + c, this.m.y + r, this.m.c);
        }
      }
    }

    // スター描画
    if (this.starFall) {
      drawSprite(this.starX * 20 + 5, this.starY * 20 + 5, '#ff0', sprs.star, 2);
    }

    ctx.fillStyle = '#ff0';
    this.blts.forEach(b => ctx.fillRect(b.x * 20 - 2, b.y * 20 - 8, 4, 12));
    drawSprite(this.px * 20, 14 * 20 + 5, '#fff', sprs.player, 2.5);

    drawParticles();

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    let hi = this.mode === 'normal' ? SaveSys.data.scores.n : SaveSys.data.scores.h;
    ctx.fillText(`SC:${this.sc} HI:${hi}`, 5, 12);
    
    if (this.combo > 2) {
      ctx.fillStyle = '#f0f';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`x${this.combo}`, 165, 12);
    }

    if (this.st === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 100, 200, 60);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('GAMEOVER', 55, 125);
      ctx.font = '10px monospace';
      ctx.fillText('(A) Menu', 65, 145);
    }

    resetShake();
  }
};

// ========================================
// UNREASONABLE BROS - 理不尽ブラザーズ（完全リテイク）
// ========================================
const Action = {
  st: 'title',
  map: [],
  platforms: [],
  coins: [],
  spikes: [],
  enemies: [],
  invisibleBlocks: [],
  fakeCoins: [],
  p: {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1},
  score: 0,
  camX: 0,
  coyoteTime: 0,

  init() {
    this.st = 'title';
    BGM.play('action');
  },

  load() {
    this.st = 'play';
    this.p = {x: 20, y: 200, vx: 0, vy: 0, anim: 0, jumpCount: 0, dir: 1};
    this.map = [];
    this.platforms = [];
    this.coins = [];
    this.spikes = [];
    this.enemies = [];
    this.invisibleBlocks = [];
    this.fakeCoins = [];
    this.score = 0;
    this.camX = 0;
    this.coyoteTime = 0;

    const stage = SaveSys.data.actStage;
    
    // 地面生成
    for (let i = 0; i < 50; i++) {
      this.map.push({x: i * 20, y: 270, w: 20, h: 30, type: 'ground'});
    }

    if (stage === 1) {
      this.platforms.push({x: 150, y: 230, w: 40, h: 10});
      this.platforms.push({x: 250, y: 200, w: 40, h: 10});
      this.platforms.push({x: 350, y: 170, w: 60, h: 10});
      this.fakeCoins.push({x: 170, y: 210, fake: true, touched: false});
      this.coins.push({x: 270, y: 180, collected: false});
      this.coins.push({x: 380, y: 150, collected: false});
      this.invisibleBlocks.push({x: 450, y: 200, w: 40, h: 10, visible: false});
      this.enemies.push({x: 300, y: 260, vx: 1, type: 'patrol', range: 80, startX: 300});
      this.spikes.push({x: 500, y: 260, w: 20, h: 10});
    } else if (stage === 2) {
      this.platforms.push({x: 120, y: 240, w: 30, h: 10, disappear: true, timer: 0});
      this.platforms.push({x: 200, y: 210, w: 30, h: 10, moving: true, vx: 2, range: 60, startX: 200});
      this.platforms.push({x: 320, y: 180, w: 30, h: 10});
      this.platforms.push({x: 420, y: 150, w: 30, h: 10, fake: true});
      this.fakeCoins.push({x: 140, y: 220, fake: true, touched: false});
      this.fakeCoins.push({x: 220, y: 190, fake: true, touched: false});
      this.coins.push({x: 340, y: 160, collected: false});
      this.invisibleBlocks.push({x: 500, y: 190, w: 40, h: 10, visible: false});
      this.enemies.push({x: 250, y: 260, vx: 2, type: 'patrol', range: 100, startX: 250});
      this.enemies.push({x: 450, y: 260, vx: -2, type: 'chase', range: 150, startX: 450});
      this.spikes.push({x: 350, y: 260, w: 30, h: 10});
      this.spikes.push({x: 600, y: 260, w: 30, h: 10});
    } else {
      this.platforms.push({x: 120, y: 240, w: 25, h: 10, disappear: true, timer: 0});
      this.platforms.push({x: 200, y: 210, w: 25, h: 10, moving: true, vx: 2.5, range: 50, startX: 200});
      this.platforms.push({x: 300, y: 180, w: 25, h: 10, fake: true});
      this.platforms.push({x: 380, y: 150, w: 30, h: 10, moving: true, vx: -3, range: 70, startX: 380});
      this.platforms.push({x: 500, y: 190, w: 30, h: 10});
      this.fakeCoins.push({x: 140, y: 220, fake: true, touched: false});
      this.fakeCoins.push({x: 220, y: 190, fake: true, touched: false});
      this.fakeCoins.push({x: 320, y: 160, fake: true, touched: false});
      this.coins.push({x: 400, y: 130, collected: false});
      this.coins.push({x: 520, y: 170, collected: false});
      this.invisibleBlocks.push({x: 600, y: 220, w: 35, h: 10, visible: false});
      this.invisibleBlocks.push({x: 680, y: 190, w: 35, h: 10, visible: false});
      this.enemies.push({x: 250, y: 260, vx: 2.5, type: 'patrol', range: 120, startX: 250});
      this.enemies.push({x: 450, y: 260, vx: -2.5, type: 'chase', range: 180, startX: 450});
      this.enemies.push({x: 650, y: 260, vx: 3, type: 'patrol', range: 100, startX: 650});
      this.spikes.push({x: 550, y: 260, w: 30, h: 10});
      this.spikes.push({x: 750, y: 260, w: 30, h: 10});
    }

    this.map.push({x: 850, y: 220, w: 30, h: 50, type: 'goal'});
  },

  die() {
    SaveSys.data.actLives--;
    SaveSys.save();
    playSnd('hit');
    screenShake(8);
    addParticle(this.p.x, this.p.y, '#00f', 'explosion');

    if (SaveSys.data.actLives < 0) {
      SaveSys.data.actStage = 1;
      SaveSys.data.actLives = 3;
      SaveSys.save();
      this.st = 'gameover';
    } else {
      this.st = 'dead';
    }
  },

  update() {
    if (keysDown.select) {
      if (this.st === 'title') {
        activeApp = Menu;
        Menu.init();
        return;
      }
      activeApp = Menu;
      Menu.init();
      return;
    }

    // タイトル画面
    if (this.st === 'title') {
      if (keysDown.a) {
        this.load();
        playSnd('jmp');
      }
      return;
    }

    if (this.st !== 'play') {
      if (keysDown.a) {
        if (this.st === 'clear') {
          activeApp = Menu;
          Menu.init();
        } else {
          this.load();
        }
      }
      return;
    }

    const moveSpeed = 1.2;
    const maxSpeed = 5;

    if (keys.left) {
      this.p.vx -= moveSpeed;
      this.p.dir = -1;
    }
    if (keys.right) {
      this.p.vx += moveSpeed;
      this.p.dir = 1;
    }

    this.p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, this.p.vx));
    this.p.vx *= 0.88;
    this.p.vy += 0.5;
    this.p.anim = (this.p.anim + Math.abs(this.p.vx)) % 360;

    let nx = this.p.x + this.p.vx;
    let ny = this.p.y + this.p.vy;
    let grounded = false;
    
    // 地面判定
    for (let m of this.map) {
      if (m.type === 'ground' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) {
        if (this.p.vy > 0) {
          ny = m.y - 20;
          this.p.vy = 0;
          grounded = true;
          this.p.jumpCount = 0;
          this.coyoteTime = 5;
        }
      }
      if (m.type === 'goal' && nx + 20 > m.x && nx < m.x + m.w && ny + 20 > m.y && ny < m.y + m.h) {
        SaveSys.data.actStage++;
        SaveSys.save();
        playSnd('combo');
        if (SaveSys.data.actStage > 3) {
          this.st = 'clear';
          SaveSys.data.actStage = 1;
          SaveSys.save();
        } else {
          this.load();
        }
        return;
      }
    }

    // プラットフォーム判定
    for (let plat of this.platforms) {
      if (plat.moving) {
        plat.x += plat.vx;
        if (Math.abs(plat.x - plat.startX) > plat.range) plat.vx *= -1;
      }
      
      if (plat.disappear && plat.timer > 0) {
        plat.timer--;
        if (plat.timer === 0) plat.disappeared = true;
      }
      
      if (plat.disappeared) continue;
      
      if (plat.fake && nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) {
        if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) {
          plat.fake = false;
          plat.falling = true;
          playSnd('hit');
        }
      }
      
      if (plat.falling) {
        plat.y += 3;
        if (plat.y > 400) plat.disappeared = true;
        continue;
      }
      
      if (nx + 20 > plat.x && nx < plat.x + plat.w && ny + 20 > plat.y && ny < plat.y + plat.h) {
        if (this.p.vy > 0 && this.p.y + 20 <= plat.y + 5) {
          ny = plat.y - 20;
          this.p.vy = 0;
          grounded = true;
          this.p.jumpCount = 0;
          this.coyoteTime = 5;
          if (plat.disappear && !plat.timer) {
            plat.timer = 30;
          }
          if (plat.moving) nx += plat.vx;
        }
      }
    }

    // 透明ブロック
    for (let ib of this.invisibleBlocks) {
      if (nx + 20 > ib.x && nx < ib.x + ib.w && ny + 20 > ib.y && ny < ib.y + ib.h) {
        ib.visible = true;
        if (this.p.vy > 0 && this.p.y + 20 <= ib.y + 5) {
          ny = ib.y - 20;
          this.p.vy = 0;
          grounded = true;
          this.p.jumpCount = 0;
          this.coyoteTime = 5;
        }
      }
    }

    // コイン
    for (let coin of this.coins) {
      if (!coin.collected && Math.abs(nx + 10 - coin.x) < 15 && Math.abs(ny + 10 - coin.y) < 15) {
        coin.collected = true;
        this.score += 100;
        playSnd('combo');
        addParticle(coin.x, coin.y, '#ff0', 'explosion');
      }
    }

    // 偽コイン
    for (let fc of this.fakeCoins) {
      if (!fc.touched && Math.abs(nx + 10 - fc.x) < 15 && Math.abs(ny + 10 - fc.y) < 15) {
        fc.touched = true;
        this.p.vy = -8;
        playSnd('hit');
        addParticle(fc.x, fc.y, '#f00', 'explosion');
        screenShake(5);
      }
    }

    // トゲ（即死）
    for (let spike of this.spikes) {
      if (nx + 20 > spike.x && nx < spike.x + spike.w && ny + 20 > spike.y) {
        this.die();
        return;
      }
    }

    // 敵
    for (let e of this.enemies) {
      if (e.type === 'patrol') {
        e.x += e.vx;
        if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1;
      } else if (e.type === 'chase') {
        const dist = Math.abs(this.p.x - e.x);
        if (dist < e.range) {
          const speed = Math.abs(e.vx);
          e.vx = (this.p.x > e.x) ? speed : -speed;
          e.x += e.vx;
        } else {
          e.x += e.vx * 0.3;
          if (Math.abs(e.x - e.startX) > e.range) e.vx *= -1;
        }
      }
      e.anim = (e.anim || 0) + Math.abs(e.vx) * 2;
      
      if (Math.abs(nx + 10 - e.x) < 18 && Math.abs(ny + 10 - e.y) < 18) {
        if (this.p.vy > 0 && ny < e.y) { // バグ修正: 踏む判定を優しく
          e.y = 9999;
          this.p.vy = -6;
          this.score += 50;
          playSnd('hit');
          addParticle(e.x, e.y, '#a00', 'explosion');
          screenShake(4);
        } else {
          this.die();
          return;
        }
      }
    }

    if (!grounded && this.coyoteTime > 0) this.coyoteTime--;
    
    if ((grounded || this.coyoteTime > 0) && keysDown.a) {
      this.p.vy = -10;
      this.p.jumpCount++;
      this.coyoteTime = 0;
      playSnd('jmp');
      addParticle(this.p.x + 10, this.p.y + 20, '#fff', 'star');
    }

    this.p.x = Math.max(0, nx);
    this.p.y = ny;

    if (this.p.y > 320) this.die();
    this.camX = Math.max(0, Math.min(this.p.x - 100, 700));

    updateParticles();
  },

  draw() {
    applyShake();
    
    // タイトル画面
    if (this.st === 'title') {
      // 背景グラデーション
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, '#f40');
      gradient.addColorStop(1, '#820');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 300);
      
      // タイトル
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f00';
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('UNREASONABLE', 30, 80);
      ctx.fillText('BROTHERS', 45, 105);
      ctx.shadowBlur = 0;
      
      // サブタイトル
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('～理不尽なアクション～', 30, 130);
      
      // キャラクター表示
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 30;
        const y = 160 + Math.sin(Date.now() / 200 + i) * 5;
        drawSprite(x, y, '#00f', sprs.heroNew, 2.5);
      }
      
      // スタート指示
      const blink = Math.floor(Date.now() / 500) % 2;
      if (blink) {
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('PRESS A START', 35, 230);
      }
      
      // 警告
      ctx.fillStyle = '#f00';
      ctx.font = '9px monospace';
      ctx.fillText('※即死トラップ注意！', 50, 260);
      
      ctx.fillStyle = '#666';
      ctx.font = '8px monospace';
      ctx.fillText('SELECT: 戻る', 65, 285);
      
      resetShake();
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#4af');
    gradient.addColorStop(1, '#8cf');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 300);

    // 地面・ゴール
    for (let m of this.map) {
      if (m.x - this.camX > -50 && m.x - this.camX < 250) {
        if (m.type === 'ground') {
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(m.x - this.camX, m.y, m.w, m.h);
          ctx.fillStyle = '#6b3513';
          ctx.fillRect(m.x - this.camX, m.y, m.w, 5);
        } else if (m.type === 'goal') {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(m.x - this.camX, m.y, m.w, m.h);
          ctx.fillStyle = '#ff0';
          ctx.font = 'bold 16px monospace';
          ctx.fillText('★', m.x - this.camX + 7, m.y + 30);
        }
      }
    }

    // プラットフォーム
    for (let plat of this.platforms) {
      if (plat.disappeared) continue;
      if (plat.x - this.camX > -50 && plat.x - this.camX < 250) {
        if (plat.disappear && plat.timer > 0 && plat.timer < 15) {
          ctx.globalAlpha = plat.timer / 15;
        }
        ctx.fillStyle = plat.fake ? '#964' : '#654321';
        ctx.fillRect(plat.x - this.camX, plat.y, plat.w, plat.h);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(plat.x - this.camX, plat.y, plat.w, 2);
        ctx.globalAlpha = 1;
      }
    }

    // 透明ブロック
    for (let ib of this.invisibleBlocks) {
      if (ib.x - this.camX > -50 && ib.x - this.camX < 250) {
        if (ib.visible) {
          ctx.fillStyle = '#888';
          ctx.fillRect(ib.x - this.camX, ib.y, ib.w, ib.h);
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillRect(ib.x - this.camX, ib.y, ib.w, 2);
        } else {
          ctx.strokeStyle = 'rgba(136,136,136,0.2)';
          ctx.strokeRect(ib.x - this.camX, ib.y, ib.w, ib.h);
        }
      }
    }

    // コイン
    for (let coin of this.coins) {
      if (!coin.collected && coin.x - this.camX > -50 && coin.x - this.camX < 250) {
        const t = Date.now() / 100;
        const offset = Math.sin(t) * 3;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(coin.x - this.camX, coin.y + offset, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    // 偽コイン
    for (let fc of this.fakeCoins) {
      if (!fc.touched && fc.x - this.camX > -50 && fc.x - this.camX < 250) {
        const t = Date.now() / 100;
        const offset = Math.sin(t) * 3;
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(fc.x - this.camX, fc.y + offset, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f80';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }

    // トゲ
    for (let spike of this.spikes) {
      if (spike.x - this.camX > -50 && spike.x - this.camX < 250) {
        drawSprite(spike.x - this.camX, spike.y, '#888', sprs.spike, 2.5);
      }
    }

    // 敵
    for (let e of this.enemies) {
      if (e.y < 300 && e.x - this.camX > -50 && e.x - this.camX < 250) {
        const offsetY = Math.sin((e.anim || 0) * Math.PI / 180) * 2;
        drawSprite(e.x - this.camX - 4, e.y + offsetY - 4, '#a00', sprs.enemyNew, 2.5);
      }
    }

    // プレイヤー
    if (this.st !== 'dead' && this.st !== 'gameover') {
      ctx.save();
      if (this.p.dir < 0) {
        ctx.scale(-1, 1);
        ctx.translate(-((this.p.x - this.camX) * 2 + 20), 0);
      }
      drawSprite(this.p.x - this.camX, this.p.y, '#00f', sprs.heroNew, 2.5);
      ctx.restore();
    }

    drawParticles();

    // UI
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 200, 32);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.fillText(`ST:${SaveSys.data.actStage} ♥:${SaveSys.data.actLives}`, 5, 12);
    ctx.fillText(`SC:${this.score}`, 5, 25);
    
    if (this.st === 'dead' || this.st === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 100, 200, 60);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(this.st === 'gameover' ? 'GAMEOVER' : 'OOPS!', 60, 125);
      ctx.font = '10px monospace';
      ctx.fillText('(A) ' + (this.st === 'gameover' ? 'Menu' : 'Retry'), 55, 145);
    }

    if (this.st === 'clear') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 100, 200, 60);
      ctx.fillStyle = '#0f0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('CLEAR!', 65, 125);
      ctx.font = '10px monospace';
      ctx.fillText('(A) Menu', 60, 145);
    }

    resetShake();
  }
};

// ========================================
// MICRO QUEST - マイクロクエスト（RPG、完全修正版）
// ========================================
const RPG = {
  st: 'title',
  msg: '',
  mIdx: 0,
  map: [],
  dungeons: [],
  p: null,
  en: null,
  anim: 0,
  saveSlot: 0,
  spells: [
    {name: 'ファイア', mp: 5, dmg: 15, desc: '火の魔法'},
    {name: 'サンダー', mp: 8, dmg: 25, desc: '雷の魔法'},
    {name: 'ヒール', mp: 10, dmg: -20, desc: '回復魔法'},
    {name: 'ブリザド', mp: 12, dmg: 35, desc: '氷の魔法'}
  ],
  equipment: {
    weapons: [
      {name: '木の剣', atk: 0, price: 0},
      {name: '鉄の剣', atk: 8, price: 50},
      {name: '鋼の剣', atk: 15, price: 120},
      {name: '聖剣', atk: 25, price: 250}
    ],
    armors: [
      {name: '布の服', def: 0, price: 0},
      {name: '革の鎧', def: 5, price: 40},
      {name: '鉄の鎧', def: 12, price: 100},
      {name: '聖なる鎧', def: 20, price: 200}
    ]
  },

  init() {
    this.st = 'title';
    this.mIdx = 0;
    this.anim = 0;
    BGM.play('rpg');
  },

  loadSave(slot) {
    this.genMap(); // 初期マップを先に生成
    const saveData = JSON.parse(localStorage.getItem(`4in1_rpg_slot${slot}`));
    if (saveData) {
      if (saveData.p) {
        this.p = JSON.parse(JSON.stringify(saveData.p));
        if (saveData.dungeons) this.dungeons = JSON.parse(JSON.stringify(saveData.dungeons));
        if (saveData.bossDefeated) this.map[13][8] = 0;
      } else {
        this.p = JSON.parse(JSON.stringify(saveData));
      }
      if (!this.p.weapon) this.p.weapon = 0;
      if (!this.p.armor) this.p.armor = 0;
      if (!this.p.knownSpells) this.p.knownSpells = [];
    } else {
      this.p = {
        x: 1, y: 1,
        hp: 30, mhp: 30,
        mp: 15, mmp: 15,
        atk: 5, def: 3,
        gld: 0, lv: 1, exp: 0,
        knownSpells: [],
        weapon: 0,
        armor: 0
      };
    }
    this.saveSlot = slot;
    this.st = 'map';
  },

  saveGame() {
    let saveObj = {
      p: JSON.parse(JSON.stringify(this.p)),
      dungeons: JSON.parse(JSON.stringify(this.dungeons)),
      bossDefeated: this.map[13][8] === 0
    };
    if (this.st === 'dungeon') {
      saveObj.p.x = this.p.worldX;
      saveObj.p.y = this.p.worldY;
    }
    localStorage.setItem(`4in1_rpg_slot${this.saveSlot}`, JSON.stringify(saveObj));
  },

  deleteSave(slot) {
    localStorage.removeItem(`4in1_rpg_slot${slot}`);
  },

  genMap() {
    this.map = Array(15).fill().map(() => Array(10).fill(0));
    this.dungeons = [];
    
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        if (Math.random() < 0.15) this.map[r][c] = 1;
      }
    }

    // 城
    this.map[1][1] = 2;
    this.map[1][2] = 0;
    this.map[2][1] = 0;

    // 魔王城
    this.map[13][8] = 3;
    this.map[13][7] = 0;
    this.map[13][9] = 0;
    this.map[12][8] = 0;

    // 店
    this.map[7][5] = 4;
    this.map[7][4] = 0;
    this.map[7][6] = 0;

    // ダンジョン1（洞窟）
    this.map[4][3] = 5;
    this.map[4][2] = 0;
    this.dungeons.push({x: 3, y: 4, cleared: false, type: 'cave'});

    // ダンジョン2（塔）
    this.map[10][2] = 5;
    this.map[10][1] = 0;
    this.dungeons.push({x: 2, y: 10, cleared: false, type: 'tower'});

    // ダンジョン3（遺跡）
    this.map[6][8] = 5;
    this.map[6][7] = 0;
    this.dungeons.push({x: 8, y: 6, cleared: false, type: 'ruins'});

    this.p = this.p || {};
    this.p.x = 1;
    this.p.y = 1;
  },

  genDungeonMap() {
    for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 10; c++) {
            this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || Math.random() < 0.2) ? 7 : 6;
        }
    }
    this.p.x = 5;
    this.p.y = 13;
    this.map[13][5] = 6;
  },

  msgBox(t) {
    this.msg = t;
    this.st = 'msg';
    playSnd('sel');
  },

  battle(bossType) {
    this.st = 'battle';
    this.mIdx = 0;
    
    if (bossType === 'boss') {
      this.en = {
        n: '魔王',
        hp: 150,
        atk: 20,
        def: 10,
        max: 150,
        exp: 0,
        gld: 0,
        spr: sprs.dragon,
        c: '#808'
      };
    } else if (bossType === 'miniboss') {
      const l = this.p.lv;
      this.en = {
        n: 'ミニボス',
        hp: 50 + l * 10,
        atk: 10 + l * 3,
        def: 5 + l,
        max: 50 + l * 10,
        exp: 50,
        gld: 30 + l * 5,
        spr: sprs.boss,
        c: '#c0c'
      };
    } else {
      const l = this.p.lv;
      this.en = {
        n: 'スライム',
        hp: 15 + l * 5,
        atk: 3 + l * 2,
        def: 1 + l,
        max: 15 + l * 5,
        exp: 15,
        gld: 8 + l * 2,
        spr: sprs.slime,
        c: '#0a0'
      };
    }
    playSnd('hit');
  },

  enterDungeon(idx) {
    const dun = this.dungeons[idx];
    if (dun.cleared) {
      this.msgBox("クリア済みだ！");
      return;
    }
    this.st = 'dungeon';
    this.dungeon = {idx: idx, floor: 1, maxFloor: 3, enemyCount: 0};
    
    this.p.worldX = this.p.x;
    this.p.worldY = this.p.y;
    this.worldMap = this.map.map(r => [...r]);
    
    this.genDungeonMap();
    this.msgBox(`${['洞窟', '塔', '遺跡'][idx]}に入った！\nF1`);
  },

  exitDungeon() {
    this.map = this.worldMap;
    this.p.x = this.p.worldX;
    this.p.y = this.p.worldY;
    this.st = 'map';
  },

  calcStats() {
    const weapon = this.equipment.weapons[this.p.weapon];
    const armor = this.equipment.armors[this.p.armor];
    return {
      atk: this.p.atk + weapon.atk,
      def: this.p.def + armor.def
    };
  },

  update() {
    this.anim++;
    
    if (keysDown.select) {
      if (this.st === 'title' || this.st === 'saveSelect') {
        activeApp = Menu;
        Menu.init();
        return;
      }
      if (this.st === 'map' || this.st === 'dungeon') {
        this.saveGame();
        activeApp = Menu;
        Menu.init();
      }
      return;
    }

    // タイトル画面
    if (this.st === 'title') {
      if (keysDown.up) {
        this.mIdx = Math.max(0, this.mIdx - 1);
        playSnd('sel');
      }
      if (keysDown.down) {
        this.mIdx = Math.min(1, this.mIdx + 1);
        playSnd('sel');
      }
      if (keysDown.a) {
        if (this.mIdx === 0) {
          this.st = 'saveSelect';
          this.mIdx = 0;
        } else {
          activeApp = Menu;
          Menu.init();
        }
        playSnd('jmp');
      }
      return;
    }

    // セーブデータ選択画面
    if (this.st === 'saveSelect') {
      if (keysDown.up) {
        this.mIdx = Math.max(0, this.mIdx - 1);
        playSnd('sel');
      }
      if (keysDown.down) {
        this.mIdx = Math.min(3, this.mIdx + 1);
        playSnd('sel');
      }
      if (keysDown.a) {
        if (this.mIdx < 3) {
          this.loadSave(this.mIdx + 1);
          playSnd('jmp');
        } else {
          this.st = 'title';
          this.mIdx = 0;
          playSnd('sel');
        }
      }
      if (keysDown.b) {
        if (this.mIdx < 3) {
          const slot = this.mIdx + 1;
          const saveData = localStorage.getItem(`4in1_rpg_slot${slot}`);
          if (saveData) {
            this.deleteSave(slot);
            playSnd('hit');
          }
        }
      }
      return;
    }

    if (this.st === 'msg') {
      if (keysDown.a) {
        if (this.msg.includes("平和")) {
          this.st = 'title';
          this.mIdx = 0;
        } else if (this.msg.includes("F")) {
          this.st = 'dungeon';
        } else if (this.msg.includes("クリア") || this.msg.includes("手に入れた")) {
          this.st = 'map';
        } else {
          this.st = this.dungeon ? 'dungeon' : 'map';
        }
      }
      return;
    }

    if (this.st === 'shop') {
      if (keysDown.up) {
        this.mIdx = Math.max(0, this.mIdx - 1);
        playSnd('sel');
      }
      if (keysDown.down) {
        this.mIdx = Math.min(6, this.mIdx + 1);
        playSnd('sel');
      }
      
      if (keysDown.a) {
        if (this.mIdx === 0 && this.p.gld >= 15) {
          this.p.gld -= 15;
          this.p.hp = this.p.mhp;
          this.p.mp = this.p.mmp;
          playSnd('combo');
          addParticle(100, 150, '#0f0', 'star');
          this.msgBox("HP/MPが回復した！");
        } else if (this.mIdx === 1 && this.p.weapon < 3) {
          const nextWeapon = this.equipment.weapons[this.p.weapon + 1];
          if (this.p.gld >= nextWeapon.price) {
            this.p.gld -= nextWeapon.price;
            this.p.weapon++;
            playSnd('combo');
            addParticle(100, 150, '#f00', 'star');
            this.msgBox(`${nextWeapon.name}を\n手に入れた！`);
          } else {
            playSnd('hit');
          }
        } else if (this.mIdx === 2 && this.p.armor < 3) {
          const nextArmor = this.equipment.armors[this.p.armor + 1];
          if (this.p.gld >= nextArmor.price) {
            this.p.gld -= nextArmor.price;
            this.p.armor++;
            playSnd('combo');
            addParticle(100, 150, '#00f', 'star');
            this.msgBox(`${nextArmor.name}を\n手に入れた！`);
          } else {
            playSnd('hit');
          }
        } else if (this.mIdx >= 3 && this.mIdx <= 6) {
          const spellIdx = this.mIdx - 3;
          const prices = [30, 50, 60, 80];
          if (this.p.gld >= prices[spellIdx] && !this.p.knownSpells.includes(spellIdx)) {
            this.p.gld -= prices[spellIdx];
            this.p.knownSpells.push(spellIdx);
            playSnd('combo');
            this.msgBox(`${this.spells[spellIdx].name}を\n覚えた！`);
          } else {
            playSnd('hit');
          }
        }
      }
      
      if (keysDown.b) this.st = 'map';
      return;
    }

    if (this.st === 'map' || this.st === 'dungeon') {
      
      if (keysDown.a && this.st === 'map') {
        let curTile = this.map[this.p.y][this.p.x];
        if (curTile === 4) {
          this.st = 'shop';
          this.mIdx = 0;
          playSnd('sel');
          return;
        } else if (curTile === 5) {
          for (let i = 0; i < this.dungeons.length; i++) {
            if (this.dungeons[i].x === this.p.x && this.dungeons[i].y === this.p.y) {
              this.enterDungeon(i);
              return;
            }
          }
        } else if (curTile === 3) {
          this.battle('boss');
          return;
        }
      }

      let nx = this.p.x, ny = this.p.y;
      
      // 移動をゆっくりに（キー長押し対応）
      if (keysDown.up) ny--;
      if (keysDown.down) ny++;
      if (keysDown.left) nx--;
      if (keysDown.right) nx++;
      
      if (nx !== this.p.x || ny !== this.p.y) {
        // 画面外移動防止
        if (nx >= 0 && nx < 10 && ny >= 0 && ny < 15 && this.map[ny][nx] !== 1 && this.map[ny][nx] !== 7) {
          this.p.x = nx;
          this.p.y = ny;
          playSnd('sel');
          
          if (this.st === 'dungeon') {
            if (Math.random() < 0.25) {
              this.dungeon.enemyCount++;
              if (this.dungeon.enemyCount >= 3) {
                this.dungeon.floor++;
                this.dungeon.enemyCount = 0;
                if (this.dungeon.floor > this.dungeon.maxFloor) {
                  this.battle('miniboss');
                } else {
                  this.genDungeonMap();
                  this.msgBox(`F${this.dungeon.floor}へ進んだ！`);
                }
              } else {
                this.battle(false);
              }
            }
          } else {
            if (this.map[ny][nx] === 3) {
              this.battle('boss');
            } else if (this.map[ny][nx] === 4) {
              this.st = 'shop';
              this.mIdx = 0;
            } else if (this.map[ny][nx] === 5) {
              for (let i = 0; i < this.dungeons.length; i++) {
                if (this.dungeons[i].x === nx && this.dungeons[i].y === ny) {
                  this.enterDungeon(i);
                  break;
                }
              }
            } else if (Math.random() < 0.12 && this.map[ny][nx] === 0) {
              this.battle(false);
            }
          }
        }
      }
    }

    if (this.st === 'battle') {
      if (keysDown.left || keysDown.right) {
        this.mIdx = this.mIdx === 0 ? 1 : 0;
        playSnd('sel');
      }
      
      if (keysDown.a) {
        if (this.mIdx === 0) {
          playSnd('jmp');
          const stats = this.calcStats();
          const dmg = Math.max(1, stats.atk - this.en.def);
          this.en.hp -= dmg;
          screenShake(3);
          addParticle(100, 120, this.en.c, 'explosion');
          
          if (this.en.hp <= 0) {
            this.winBattle();
          } else {
            setTimeout(() => this.enemyAttack(), 300);
          }
        } else if (this.mIdx === 1) {
          this.st = 'magic';
          this.mIdx = 0;
        }
      }
    }

    if (this.st === 'magic') {
      if (keysDown.up) {
        this.mIdx = Math.max(0, this.mIdx - 1);
        playSnd('sel');
      }
      if (keysDown.down) {
        this.mIdx = Math.min(this.p.knownSpells.length, this.mIdx + 1);
        playSnd('sel');
      }
      
      if (keysDown.a) {
        if (this.mIdx < this.p.knownSpells.length) {
          const spell = this.spells[this.p.knownSpells[this.mIdx]];
          if (this.p.mp >= spell.mp) {
            this.p.mp -= spell.mp;
            if (spell.dmg > 0) {
              this.en.hp -= spell.dmg;
              playSnd('combo');
              addParticle(100, 120, '#f0f', 'explosion');
              screenShake(5);
              if (this.en.hp <= 0) {
                this.winBattle();
                return;
              }
            } else {
              this.p.hp = Math.min(this.p.mhp, this.p.hp - spell.dmg);
              playSnd('combo');
              addParticle(100, 200, '#0f0', 'star');
            }
            this.st = 'battle';
            this.mIdx = 0;
            setTimeout(() => this.enemyAttack(), 300);
          } else {
            playSnd('hit');
          }
        } else {
          this.st = 'battle';
          this.mIdx = 0;
        }
      }
      
      if (keysDown.b) {
        this.st = 'battle';
        this.mIdx = 0;
      }
    }

    updateParticles();
  },

  enemyAttack() {
    const stats = this.calcStats();
    const enemyDmg = Math.max(1, this.en.atk - stats.def);
    this.p.hp -= enemyDmg;
    playSnd('hit');
    screenShake(4);
    
    if (this.p.hp <= 0) {
      if (this.dungeon) this.exitDungeon();
      this.p.hp = this.p.mhp;
      this.p.mp = this.p.mmp;
      this.p.x = 1;
      this.p.y = 1;
      this.dungeon = null;
      this.msgBox("死んでしまった。\n城へ戻る...");
    }
  },

  winBattle() {
    addParticle(100, 120, '#ff0', 'explosion');
    if (this.en.n === '魔王') {
      this.msgBox("魔王を倒した！\n世界に平和が！");
      this.map[13][8] = 0;
    } else if (this.en.n === 'ミニボス') {
      this.dungeons[this.dungeon.idx].cleared = true;
      this.p.exp += this.en.exp;
      this.p.gld += this.en.gld;
      this.exitDungeon();
      this.dungeon = null;
      if (this.p.exp >= this.p.lv * 25) {
        this.levelUp();
        this.msgBox(`ダンジョンクリア！\nLvUP! ${this.en.gld}G獲得`);
      } else {
        this.msgBox(`ダンジョンクリア！\n${this.en.gld}G獲得`);
      }
    } else {
      this.p.exp += this.en.exp;
      this.p.gld += this.en.gld;
      if (this.p.exp >= this.p.lv * 25) {
        this.levelUp();
        this.msgBox(`勝利！ LvUP！\n${this.en.gld}G獲得`);
      } else {
        this.msgBox(`勝利！\n${this.en.gld}G獲得`);
      }
    }
  },

  levelUp() {
    this.p.lv++;
    this.p.mhp += 15;
    this.p.mmp += 8;
    this.p.atk += 3;
    this.p.def += 2;
    this.p.hp = this.p.mhp;
    this.p.mp = this.p.mmp;
    playSnd('combo');
  },

  draw() {
    applyShake();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 200, 300);

    // タイトル画面
    if (this.st === 'title') {
      // 背景グラデーション
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, '#001');
      gradient.addColorStop(1, '#103');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 300);
      
      // タイトル
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#0f0';
      ctx.fillStyle = '#0f0';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('MICRO', 60, 80);
      ctx.fillText('QUEST', 60, 110);
      ctx.shadowBlur = 0;
      
      // サブタイトル
      ctx.fillStyle = '#888';
      ctx.font = '10px monospace';
      ctx.fillText('～魔王討伐の旅～', 50, 135);
      
      // メニュー
      ctx.fillStyle = this.mIdx === 0 ? '#0f0' : '#aaa';
      ctx.font = 'bold 14px monospace';
      ctx.fillText((this.mIdx === 0 ? '> ' : '  ') + 'はじめる', 60, 180);
      
      ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa';
      ctx.fillText((this.mIdx === 1 ? '> ' : '  ') + 'もどる', 60, 210);
      
      // 操作説明
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('↑↓: 選択  A: 決定', 50, 270);
      
      resetShake();
      return;
    }

    // セーブデータ選択画面
    if (this.st === 'saveSelect') {
      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, '#001');
      gradient.addColorStop(1, '#103');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 300);
      
      // タイトル
      ctx.fillStyle = '#0f0';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('セーブデータ選択', 30, 30);
      
      // セーブスロット
      for (let i = 0; i < 3; i++) {
        const saveData = JSON.parse(localStorage.getItem(`4in1_rpg_slot${i + 1}`));
        const selected = this.mIdx === i;
        
        // 枠
        ctx.fillStyle = selected ? 'rgba(0,255,0,0.2)' : 'rgba(100,100,100,0.2)';
        ctx.fillRect(15, 60 + i * 65, 170, 55);
        ctx.strokeStyle = selected ? '#0f0' : '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(15, 60 + i * 65, 170, 55);
        ctx.lineWidth = 1;
        
        // データ表示
        ctx.fillStyle = selected ? '#0f0' : '#aaa';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`スロット ${i + 1}`, 25, 80 + i * 65);
        
        if (saveData) {
          ctx.fillStyle = selected ? '#fff' : '#888';
          ctx.font = '9px monospace';
          // saveDataが新しいオブジェクト形式（pプロパティを持つ）か判定して表示
          const displayP = saveData.p ? saveData.p : saveData;
          ctx.fillText(`Lv${displayP.lv}  HP${displayP.hp}/${displayP.mhp}`, 25, 95 + i * 65);
          ctx.fillText(`Gold: ${displayP.gld}G`, 25, 108 + i * 65);
          if (selected) {
            ctx.fillStyle = '#f00';
            ctx.font = '8px monospace';
            ctx.fillText('[B:削除]', 130, 108 + i * 65);
          }
        } else {
          ctx.fillStyle = selected ? '#fff' : '#666';
          ctx.font = '9px monospace';
          ctx.fillText('データなし', 25, 95 + i * 65);
        }
      }
      
      // 戻るボタン
      ctx.fillStyle = this.mIdx === 3 ? '#0f0' : '#aaa';
      ctx.font = 'bold 12px monospace';
      ctx.fillText((this.mIdx === 3 ? '> ' : '  ') + 'もどる', 60, 270);
      
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('A:選択 B:削除 SELECT:戻る', 25, 290);
      
      resetShake();
      return;
    }

    if (this.st === 'map' || this.st === 'msg' || this.st === 'dungeon') {
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 10; c++) {
          let v = this.map[r][c];
          ctx.fillStyle = v === 0 ? '#282' : 
                          v === 1 ? '#555' : 
                          v === 2 ? '#00f' : 
                          v === 3 ? '#f00' : 
                          v === 4 ? '#e90' : 
                          v === 5 ? '#808' : 
                          v === 6 ? '#444' : 
                          v === 7 ? '#222' : '#000';
          ctx.fillRect(c * 20, r * 20 + 45, 20, 20);
          
          if (v === 4) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans';
            ctx.fillText('店', c * 20 + 4, r * 20 + 59);
          } else if (v === 5) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans';
            ctx.fillText('D', c * 20 + 5, r * 20 + 59);
          }
        }
      }
      
      const offsetY = Math.sin(this.anim * 0.1) * 1;
      drawSprite(this.p.x * 20, this.p.y * 20 + 45 + offsetY, '#ff0', sprs.mage);
      
      const stats = this.calcStats();
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(0, 0, 200, 42);
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText(`Lv${this.p.lv} HP${this.p.hp}/${this.p.mhp}`, 3, 10);
      ctx.fillText(`MP${this.p.mp}/${this.p.mmp}`, 3, 20);
      ctx.fillText(`ATK${stats.atk} DEF${stats.def}`, 3, 30);
      ctx.fillText(`G${this.p.gld}`, 3, 40);
      
      const weapon = this.equipment.weapons[this.p.weapon];
      const armor = this.equipment.armors[this.p.armor];
      ctx.fillText(weapon.name, 110, 10);
      ctx.fillText(armor.name, 110, 20);
      
      if (this.dungeon) {
        ctx.fillText(`F${this.dungeon.floor}/${this.dungeon.maxFloor}`, 140, 30);
        ctx.fillText(`E:${this.dungeon.enemyCount}/3`, 140, 40);
      }
    }

    if (this.st === 'battle' || this.st === 'magic') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(this.en.n, 15, 30);
      
      ctx.fillStyle = '#f00';
      ctx.fillRect(15, 38, 170, 8);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(15, 38, Math.max(0, 170 * (this.en.hp / this.en.max)), 8);
      
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText(`${this.en.hp}/${this.en.max}`, 75, 45);
      
      const enemyOffset = Math.sin(this.anim * 0.1) * 2;
      drawSprite(70, 70 + enemyOffset, this.en.c, this.en.spr, 12);
      
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(5, 180, 190, 115);
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(5, 180, 190, 115);
      ctx.lineWidth = 1;
      
      if (this.st === 'battle') {
        const stats = this.calcStats();
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`HP:${this.p.hp}/${this.p.mhp}`, 15, 200);
        ctx.fillText(`MP:${this.p.mp}/${this.p.mmp}`, 15, 213);
        ctx.fillText(`ATK:${stats.atk} DEF:${stats.def}`, 15, 226);
        
        ctx.fillStyle = this.mIdx === 0 ? '#0f0' : '#888';
        ctx.fillRect(15, 240, 80, 25);
        ctx.fillStyle = this.mIdx === 0 ? '#000' : '#444';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('たたかう', 23, 257);
        
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#888';
        ctx.fillRect(105, 240, 80, 25);
        ctx.fillStyle = this.mIdx === 1 ? '#000' : '#444';
        ctx.fillText('まほう', 120, 257);
        
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText('SELECT:終了', 60, 285);
      } else if (this.st === 'magic') {
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.fillText(`MP:${this.p.mp}/${this.p.mmp}`, 15, 195);
        
        let y = 210;
        for (let i = 0; i < this.p.knownSpells.length; i++) {
          const spell = this.spells[this.p.knownSpells[i]];
          ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa';
          ctx.font = '10px monospace';
          ctx.fillText(`${this.mIdx === i ? '> ' : '  '}${spell.name}(${spell.mp})`, 15, y);
          y += 15;
        }
        
        ctx.fillStyle = this.mIdx === this.p.knownSpells.length ? '#0f0' : '#aaa';
        ctx.fillText(`${this.mIdx === this.p.knownSpells.length ? '> ' : '  '}もどる`, 15, y);
        
        ctx.fillStyle = '#666';
        ctx.font = '9px monospace';
        ctx.fillText('B:戻る', 70, 285);
      }
    }

    if (this.st === 'shop') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('いらっしゃい！', 40, 30);
      ctx.font = '10px monospace';
      ctx.fillText(`所持金: ${this.p.gld}G`, 50, 50);
      
      const items = [
        ['宿屋(HP/MP全回復)', 15],
        [`武器:${this.equipment.weapons[Math.min(3, this.p.weapon + 1)].name}`, this.p.weapon < 3 ? this.equipment.weapons[this.p.weapon + 1].price : '-'],
        [`防具:${this.equipment.armors[Math.min(3, this.p.armor + 1)].name}`, this.p.armor < 3 ? this.equipment.armors[this.p.armor + 1].price : '-'],
        ['ファイア習得', 30],
        ['サンダー習得', 50],
        ['ヒール習得', 60],
        ['ブリザド習得', 80]
      ];
      
      let y = 75;
      for (let i = 0; i < items.length; i++) {
        ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa';
        ctx.font = '9px monospace';
        const owned = (i >= 3 && this.p.knownSpells.includes(i - 3)) ||
                      (i === 1 && this.p.weapon === 3) ||
                      (i === 2 && this.p.armor === 3);
        const priceText = owned ? '[習得/所持済]' : `${items[i][1]}G`;
        ctx.fillText(`${this.mIdx === i ? '> ' : '  '}${items[i][0]}`, 10, y);
        ctx.fillText(priceText, 130, y);
        y += 16;
      }
      
      ctx.fillStyle = '#666';
      ctx.font = '9px monospace';
      ctx.fillText('(B)もどる', 65, 280);
    }

    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(5, 185, 190, 70);
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(5, 185, 190, 70);
      ctx.lineWidth = 1;
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      let l = this.msg.split('\n');
      for (let i = 0; i < l.length; i++) {
        ctx.fillText(l[i], 15, 205 + i * 18);
      }
      ctx.fillText('▼(A)', 155, 245);
    }

    drawParticles();
    resetShake();
  }
};

// ========================================
// ONLINE BATTLE - オンライン対戦（エアホッケー風）
// ========================================
const Online = {
  st: 'wait',
  tmr: 0,
  countdown: 0,
  p1: {y: 130, s: 0},
  p2: {y: 130, s: 0, n: ''},
  blt: null,
  trail: [],

  init() {
    this.st = 'wait';
    this.tmr = 60;
    this.countdown = 0;
    this.p1.s = 0;
    this.p1.y = 130;
    this.p2.s = 0;
    this.p2.y = 130;
    this.p2.n = '';
    this.trail = [];
  },

  update() {
    if (keysDown.select) {
      activeApp = Menu;
      Menu.init();
      return;
    }

    if (this.st === 'wait') {
      this.tmr--;
      if (this.tmr <= 0) {
        const names = ['Tanaka', 'xX_Pro_Xx', 'Gamer99', 'Pikachu', 'Bot_Alpha', 'Shadow', 'Nova', 'Blaze'];
        this.p2.n = names[Math.floor(Math.random() * names.length)];
        this.st = 'countdown';
        this.countdown = 180; // 3秒（60fps）
        playSnd('combo');
      }
    } else if (this.st === 'countdown') {
      this.countdown--;
      if (this.countdown <= 0) {
        this.st = 'play';
        this.resetB();
      }
    } else if (this.st === 'play') {
      if (keys.up) this.p1.y = Math.max(0, this.p1.y - 3);
      if (keys.down) this.p1.y = Math.min(260, this.p1.y + 3);
      
      if (this.blt && this.blt.vx > 0) {
        if (this.p2.y + 20 < this.blt.y) this.p2.y += 2;
        else if (this.p2.y + 20 > this.blt.y) this.p2.y -= 2;
      }
      
      if (this.blt) {
        this.trail.push({x: this.blt.x, y: this.blt.y, life: 5});
        for (let i = this.trail.length - 1; i >= 0; i--) {
          this.trail[i].life--;
          if (this.trail[i].life <= 0) this.trail.splice(i, 1);
        }
        
        this.blt.x += this.blt.vx;
        this.blt.y += this.blt.vy;
        
        if (this.blt.y < 0 || this.blt.y > 290) {
          this.blt.vy *= -1;
          screenShake(2);
        }
        
        // バグ修正: 当たり判定のズレをグラフィックに完全一致させる
        if (this.blt.x <= 20 && this.blt.x > 5 && Math.abs((this.p1.y + 20) - this.blt.y) < 24) {
          this.blt.vx = Math.abs(this.blt.vx) * 1.05;
          this.blt.x = 20;
          playSnd('jmp');
          addParticle(25, this.p1.y + 20, '#0f0', 'explosion');
          screenShake(3);
        }
        if (this.blt.x >= 172 && this.blt.x < 185 && Math.abs((this.p2.y + 20) - this.blt.y) < 24) {
          this.blt.vx = -Math.abs(this.blt.vx) * 1.05;
          this.blt.x = 172;
          playSnd('jmp');
          addParticle(175, this.p2.y + 20, '#f00', 'explosion');
          screenShake(3);
        }
        
        if (this.blt.x < 0) {
          this.p2.s++;
          playSnd('hit');
          addParticle(0, this.blt.y, '#f00', 'explosion');
          screenShake(5);
          this.resetB();
        }
        if (this.blt.x > 200) {
          this.p1.s++;
          playSnd('hit');
          addParticle(200, this.blt.y, '#0f0', 'explosion');
          screenShake(5);
          this.resetB();
        }
      }
      
      if (this.p1.s >= 5 || this.p2.s >= 5) this.st = 'end';
    } else if (this.st === 'end') {
      if (keysDown.a) {
        activeApp = Menu;
        Menu.init();
      }
    }

    updateParticles();
  },

  resetB() {
    this.blt = {
      x: 100,
      y: 150,
      vx: (Math.random() < 0.5 ? 3 : -3),
      vy: (Math.random() * 4 - 2)
    };
    this.trail = [];
  },

  draw() {
    applyShake();
    ctx.fillStyle = '#113';
    ctx.fillRect(0, 0, 200, 300);
    
    if (this.st === 'wait') {
      ctx.fillStyle = '#0ff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('MATCHING...', 50, 130);
      const dots = '.'.repeat((Math.floor(this.tmr / 10) % 4));
      ctx.fillText(dots, 140, 130);
    } else if (this.st === 'countdown') {
      // 背景
      ctx.strokeStyle = '#444';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(100, 300);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // プレイヤー表示
      ctx.fillStyle = '#0f0';
      ctx.fillRect(10, this.p1.y, 10, 40);
      ctx.fillStyle = '#f00';
      ctx.fillRect(180, this.p2.y, 10, 40);
      
      // マッチング完了
      ctx.fillStyle = '#0ff';
      ctx.font = '12px monospace';
      ctx.fillText('MATCHED!', 65, 80);
      
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.fillText('YOU', 10, 20);
      ctx.fillText(this.p2.n.slice(0, 10), 120, 20);
      
      // カウントダウン
      const countNum = Math.ceil(this.countdown / 60);
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff0';
      ctx.fillStyle = '#ff0';
      ctx.font = 'bold 60px monospace';
      ctx.fillText(countNum, 85, 180);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('READY...', 70, 220);
    } else {
      ctx.strokeStyle = '#444';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(100, 300);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#0f0';
      ctx.fillRect(10, this.p1.y, 10, 40);
      ctx.fillStyle = '#f00';
      ctx.fillRect(180, this.p2.y, 10, 40);
      
      this.trail.forEach(t => {
        ctx.globalAlpha = t.life / 5;
        ctx.fillStyle = '#ff0';
        ctx.fillRect(t.x, t.y, 6, 6);
      });
      ctx.globalAlpha = 1;
      
      if (this.blt) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0';
        ctx.fillStyle = '#ff0';
        ctx.fillRect(this.blt.x, this.blt.y, 8, 8);
        ctx.shadowBlur = 0;
      }
      
      drawParticles();
      
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('YOU', 10, 20);
      ctx.fillText(this.p2.n.slice(0, 10), 120, 20);
      ctx.font = 'bold 24px monospace';
      ctx.fillText(this.p1.s, 40, 45);
      ctx.fillText(this.p2.s, 140, 45);
      
      if (this.st === 'end') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        ctx.fillRect(0, 100, 200, 80);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.p1.s >= 5 ? '#0f0' : '#f00';
        ctx.fillStyle = this.p1.s >= 5 ? '#0f0' : '#f00';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(this.p1.s >= 5 ? 'YOU WIN!' : 'YOU LOSE', 50, 135);
        ctx.shadowBlur = 0;
        
        ctx.font = '11px monospace';
        ctx.fillStyle = '#fff';
        ctx.fillText('(A) メニューへ', 50, 160);
      }
    }
    resetShake();
  }
};
