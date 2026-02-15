// === ACTION GAME (RIFUJIN BROTHERS) - 16x16 HD UPDATE ===
const Action = {
  st: 'start', px: 20, py: 200, vx: 0, vy: 0, pColor: '#f00', dead: false, clear: false,
  camX: 0, coins: 0, anim: 0, deathMsg: '',
  map: [], traps: [], blocks: [],
  init() {
    this.st = 'start'; this.px = 20; this.py = 200; this.vx = 0; this.vy = 0; this.camX = 0; this.coins = 0; this.dead = false; this.clear = false;
    this.map = []; this.traps = []; this.blocks = [];
    BGM.play('action'); this.genStage(SaveSys.data.actStage);
  },
  genStage(stg) {
    const w = stg === 1 ? 100 : 150;
    for (let c = 0; c < w; c++) {
      if (c < 5 || c > w - 5 || Math.random() > 0.2) this.blocks.push({x: c*20, y: 260, w: 20, h: 40, t: 'floor'});
      if (c === w - 4) this.blocks.push({x: c*20, y: 60, w: 10, h: 200, t: 'pole'});
    }
    if (stg === 1) {
      this.blocks.push({x: 100, y: 200, w: 20, h: 20, t: 'q'});
      this.blocks.push({x: 160, y: 160, w: 20, h: 20, t: 'q'});
      this.blocks.push({x: 180, y: 160, w: 20, h: 20, t: 'q'});
      this.traps.push({x: 180, y: 160, type: 'fall', trig: false});
      this.blocks.push({x: 240, y: 220, w: 40, h: 40, t: 'pipe'});
      this.traps.push({x: 350, y: 260, type: 'spike', trig: false});
      this.blocks.push({x: 400, y: 180, w: 60, h: 20, t: 'brick'});
      this.traps.push({x: 420, y: 180, type: 'fall', trig: false});
    } else {
      this.blocks.push({x: 80, y: 200, w: 20, h: 20, t: 'q'});
      this.traps.push({x: 80, y: 200, type: 'fall', trig: false});
      this.blocks.push({x: 200, y: 220, w: 40, h: 40, t: 'pipe'});
      this.traps.push({x: 200, y: 220, type: 'jump', trig: false});
      for(let i=0; i<5; i++) this.traps.push({x: 300+i*30, y: 260, type: 'spike', trig: false});
    }
  },
  die(msg) { this.dead = true; this.deathMsg = msg; this.vy = -5; SaveSys.data.actLives--; SaveSys.save(); BGM.stop(); playSnd('hit'); },
  update() {
    this.anim++;
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if (this.st === 'start') { if (keysDown.a) { this.st = 'play'; } return; }
    if (this.st === 'over' || this.st === 'clear') { if (keysDown.a) { if (this.st === 'clear') { SaveSys.data.actStage++; SaveSys.save(); } else if (SaveSys.data.actLives <= 0) { SaveSys.data.actLives = 3; SaveSys.data.actStage = 1; SaveSys.save(); } this.init(); } return; }

    if (this.dead) { this.py += this.vy; this.vy += 0.5; if (this.py > 400) this.st = 'over'; return; }

    if (keys.left) { this.vx -= 0.5; } if (keys.right) { this.vx += 0.5; }
    this.vx *= 0.8; this.vy += 0.4;
    this.px += this.vx;

    let onGnd = false;
    for (let b of this.blocks) {
      if (this.px < b.x + b.w && this.px + 16 > b.x && this.py < b.y + b.h && this.py + 16 > b.y) {
        if (this.vx > 0 && this.px + 16 - this.vx <= b.x) { this.px = b.x - 16; this.vx = 0; }
        else if (this.vx < 0 && this.px - this.vx >= b.x + b.w) { this.px = b.x + b.w; this.vx = 0; }
      }
    }
    this.py += this.vy;
    for (let b of this.blocks) {
      if (this.px < b.x + b.w && this.px + 16 > b.x && this.py < b.y + b.h && this.py + 16 > b.y) {
        if (this.vy > 0) { this.py = b.y - 16; this.vy = 0; onGnd = true; }
        else if (this.vy < 0) { this.py = b.y + b.h; this.vy = 0; }
      }
    }

    if (keysDown.a && onGnd) { this.vy = -7; playSnd('jmp'); }
    if (this.py > 300) { this.die('奈落の底へ落ちた'); }
    if (this.px > this.camX + 100) this.camX = this.px - 100;
    if (this.px < this.camX) this.px = this.camX;

    for (let t of this.traps) {
      if (t.trig) continue;
      if (t.type === 'fall' && Math.abs(this.px - t.x) < 15 && this.py > t.y) { t.trig = true; this.blocks.push({x: t.x, y: t.y + 40, w: 20, h: 20, t: 'hard', vy: 5}); }
      if (t.type === 'spike' && Math.abs(this.px - t.x) < 10 && this.py > 240) { t.trig = true; this.die('隠しトゲに刺さった'); }
      if (t.type === 'jump' && Math.abs(this.px - t.x) < 20 && this.py < t.y) { t.trig = true; this.vy = -10; playSnd('hit'); }
    }
    for (let b of this.blocks) {
      if (b.vy) { b.y += b.vy; if (this.px < b.x + b.w && this.px + 16 > b.x && this.py < b.y + b.h && this.py + 16 > b.y) { this.die('ブロックに潰された'); } }
      if (b.t === 'pole' && this.px > b.x) { this.st = 'clear'; BGM.stop(); playSnd('combo'); SaveSys.addScore('normal', this.coins * 100); }
    }
  },
  draw() {
    ctx.fillStyle = '#5cf'; ctx.fillRect(0, 0, 200, 300);
    ctx.save(); ctx.translate(-this.camX, 0);

    for (let b of this.blocks) {
      if (b.t === 'floor' || b.t === 'hard') {
        for(let i=0; i<b.w/20; i++) drawSprite(b.x + i*20, b.y, '', sprs.wall, 2.5);
      } else if (b.t === 'q') {
        drawSprite(b.x, b.y, '', sprs.q_block, 2.5);
      } else if (b.t === 'brick') {
        for(let i=0; i<b.w/20; i++) drawSprite(b.x + i*20, b.y, '', sprs.wall, 2.5);
      } else if (b.t === 'pipe') {
        drawSprite(b.x, b.y, '', sprs.pipe, 5.0); // 40x40なので2倍サイズで描画
      } else if (b.t === 'pole') {
        ctx.fillStyle = '#fff'; ctx.fillRect(b.x, b.y, b.w, b.h);
        drawSprite(b.x - 5, b.y + 20, '', sprs.flag, 2.5);
      }
    }
    for (let t of this.traps) {
      if (t.type === 'spike' && t.trig) { drawSprite(t.x, 240, '', sprs.spike, 2.5); }
    }
    if (!this.dead) {
      drawSprite(this.px, this.py, '#f00', sprs.player, 2.0); // 16x16プレイヤー
    } else {
      ctx.save(); ctx.translate(this.px + 8, this.py + 8); ctx.rotate(this.anim * 0.5); drawSprite(-8, -8, '#f00', sprs.player, 2.0); ctx.restore();
    }
    ctx.restore();

    ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText(`STAGE ${SaveSys.data.actStage}  LIVES: ${SaveSys.data.actLives}`, 10, 20);

    if (this.st === 'start') { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 100, 200, 50); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText('PRESS A TO START', 40, 130); }
    if (this.st === 'over') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 80, 200, 80); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('GAME OVER', 65, 110); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(this.deathMsg, 20, 130); ctx.fillText('PRESS A TO RETRY', 50, 150); }
    if (this.st === 'clear') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 100, 200, 50); ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('STAGE CLEAR!', 55, 125); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS A TO NEXT', 50, 140); }
  }
};
