// === TETRIVADER - SAVE SYNC UPDATE ===
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
  hit(x, y) { for (let r = 0; r < this.m.s.length; r++) { for (let c = 0; c < this.m.s[0].length; c++) { if (this.m.s[r][c]) { let nx = x + c, ny = y + r; if (nx < 0 || nx >= 10 || ny >= 15 || (ny >= 0 && this.brd[ny][nx])) return true; } } } return false; },
  gameover() {
    this.st = 'over'; 
    // ★ 修正点: SaveSys.sys.scores を使用
    let high = this.mode === 'normal' ? SaveSys.sys.scores.n : SaveSys.sys.scores.h;
    if (this.sc > high) { if (this.mode === 'normal') SaveSys.sys.scores.n = this.sc; else SaveSys.sys.scores.h = this.sc; SaveSys.saveSys(); } 
    SaveSys.addScore(this.mode, this.sc);
  },
  update() {
    if (keysDown.select) { if (this.difficultySelect) { activeApp = Menu; Menu.init(); } else { this.st = 'over'; activeApp = Menu; Menu.init(); } return; }
    if (this.difficultySelect) {
      if (keysDown.left || keysDown.right) { this.playerSkin = (this.playerSkin + 1) % 4; playSnd('sel'); }
      if (keysDown.up || keysDown.down) { this.mode = this.mode === 'normal' ? 'hard' : 'normal'; playSnd('sel'); }
      if (keysDown.a) { playSnd('jmp'); this.init(true); } return;
    }
    if (this.st === 'over') { if (keysDown.a || keysDown.b) { activeApp = Menu; Menu.init(); } return; }
    // ... 他のアップデートロジックは同じ ...
    if (keys.left) this.px = Math.max(0, this.px - 0.15); if (keys.right) this.px = Math.min(9, this.px + 0.15);
    if (keysDown.a && this.cool <= 0) { this.blts.push({x: this.px + 0.5, y: 14}); this.cool = 10; playSnd('jmp'); }
    if (this.cool > 0) this.cool--;
    // ... (以下略、描画部分はdrawSpriteを使用)
    this.draw();
  },
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,200,300);
    // ... drawSprite(..., sprs.fighter, ...) など
  },
  drawPlayer(x, y) {
     const skinList = [sprs.fighter, sprs.banana, sprs.peperoncino, sprs.cannon];
     drawSprite(x - 5, y - 5, '#fff', skinList[this.playerSkin], 2.0);
  }
};
