// === TETRIVADER - ROUTE A: 16x16 HD & BEAM UPDATE ===
const Tetri = {
  st: 'start', score: 0, lines: 0,
  board: [], fighter: {x: 4, y: 14, wait: 0},
  invaders: [], beams: [],
  piece: null, timer: 0, dropSpeed: 30,
  colors: ['#000', '#0ff', '#00f', '#f80', '#ff0', '#0f0', '#a0f', '#f00'],
  shapes: [
    [],
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
    [[2,0,0],[2,2,2],[0,0,0]], // J
    [[0,0,3],[3,3,3],[0,0,0]], // L
    [[4,4],[4,4]], // O
    [[0,5,5],[5,5,0],[0,0,0]], // S
    [[0,6,0],[6,6,6],[0,0,0]], // T
    [[7,7,0],[0,7,7],[0,0,0]]  // Z
  ],
  
  init() {
    this.st = 'start'; this.score = 0; this.lines = 0; this.dropSpeed = 30;
    this.board = Array(15).fill().map(()=>Array(10).fill(0));
    this.fighter = {x: 4, wait: 0};
    this.invaders = []; this.beams = [];
    BGM.play('tetri');
  },
  
  newPiece() {
    let t = Math.floor(Math.random()*7)+1;
    this.piece = { x: 3, y: 0, shape: this.shapes[t], type: t };
    if (this.collide(0, 0)) this.st = 'over';
  },
  
  collide(dx, dy, shape = this.piece.shape) {
    for(let r=0; r<shape.length; r++) {
      for(let c=0; c<shape[r].length; c++) {
        if(!shape[r][c]) continue;
        let nx = this.piece.x + c + dx, ny = this.piece.y + r + dy;
        if(nx < 0 || nx >= 10 || ny >= 15 || (ny >= 0 && this.board[ny][nx])) return true;
      }
    }
    return false;
  },
  
  merge() {
    for(let r=0; r<this.piece.shape.length; r++) {
      for(let c=0; c<this.piece.shape[r].length; c++) {
        if(this.piece.shape[r][c] && this.piece.y + r >= 0) {
          this.board[this.piece.y + r][this.piece.x + c] = this.piece.type;
        }
      }
    }
    let cleared = 0;
    for(let r=14; r>=0; r--) {
      if(this.board[r].every(v => v > 0)) {
        this.board.splice(r, 1);
        this.board.unshift(Array(10).fill(0));
        cleared++; r++;
      }
    }
    if (cleared > 0) {
      this.lines += cleared; this.score += cleared * 100; playSnd('combo');
      // ★ ラインを消したご褒美に、極太レーザーを上に発射！
      this.beams.push({x: this.fighter.x * 12, y: this.getFighterY() * 12, w: 12, h: 60, c: '#ff0'});
    } else {
      playSnd('hit');
    }
    this.newPiece();
  },
  
  getFighterY() {
    for(let y=0; y<15; y++) if(this.board[y][this.fighter.x]) return y - 1;
    return 14;
  },
  
  update() {
    if(keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if(this.st === 'start') { if(keysDown.a) { this.init(); this.newPiece(); this.st = 'play'; } return; }
    if(this.st === 'over') { if(keysDown.a) { this.init(); } return; }

    // 戦闘機の移動とショット
    if(keysDown.left && this.fighter.x > 0) { this.fighter.x--; playSnd('sel'); }
    if(keysDown.right && this.fighter.x < 9) { this.fighter.x++; playSnd('sel'); }
    if(keysDown.a && this.fighter.wait === 0) {
      this.beams.push({x: this.fighter.x * 12 + 5, y: this.getFighterY() * 12, w: 2, h: 10, c: '#0ff'});
      this.fighter.wait = 10; playSnd('jmp');
    }
    if(this.fighter.wait > 0) this.fighter.wait--;

    // ビームと敵の当たり判定
    for(let i=this.beams.length-1; i>=0; i--) {
      let b = this.beams[i]; b.y -= 4;
      if(b.y < 0) { this.beams.splice(i, 1); continue; }
      for(let j=this.invaders.length-1; j>=0; j--) {
        let inv = this.invaders[j];
        if(b.x < inv.x+12 && b.x+b.w > inv.x && b.y < inv.y+12 && b.y+b.h > inv.y) {
          this.invaders.splice(j, 1); 
          if(b.w < 10) this.beams.splice(i, 1); // 細いビームだけ消える（太いビームは貫通）
          this.score += 50; addParticle(inv.x+6, inv.y+6, '#ff0', 'explosion'); playSnd('hit');
          break;
        }
      }
    }

    // インベーダーの生成と移動
    if(Math.random() < 0.02 + this.lines*0.002) {
      this.invaders.push({x: Math.floor(Math.random()*9)*12, y: 0, vx: (Math.random()>0.5?1:-1), anim:0});
    }
    for(let inv of this.invaders) {
      inv.anim++;
      if(inv.anim % 30 === 0) {
        inv.x += inv.vx * 12;
        if(inv.x < 0 || inv.x > 108) { inv.vx *= -1; inv.x += inv.vx * 12; inv.y += 12; }
      }
      if(inv.y >= this.getFighterY()*12) this.st = 'over'; // 敵がブロックに到達したらゲームオーバー
    }

    // テトリスの落下
    this.timer++;
    let cd = keys.down ? 2 : this.dropSpeed;
    if(this.timer >= cd) {
      this.timer = 0;
      if(!this.collide(0, 1)) this.piece.y++; else this.merge();
    }
  },
  
  draw() {
    ctx.fillStyle = '#002'; ctx.fillRect(0, 0, 200, 300);
    ctx.save(); ctx.translate(40, 50);
    ctx.fillStyle = '#113'; ctx.fillRect(0, 0, 120, 180);
    ctx.strokeStyle = '#336'; ctx.strokeRect(0, 0, 120, 180);

    // ★ 美しいハイライト付きブロック描画
    const drawBlock = (c, r, type) => {
      let col = this.colors[type];
      let px = c*12, py = r*12;
      ctx.fillStyle = col; ctx.fillRect(px, py, 12, 12);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(px, py, 12, 2); ctx.fillRect(px, py, 2, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(px, py+10, 12, 2); ctx.fillRect(px+10, py, 2, 12);
    };

    for(let r=0; r<15; r++) {
      for(let c=0; c<10; c++) {
        if(this.board[r][c]) drawBlock(c, r, this.board[r][c]);
      }
    }
    if(this.st === 'play' && this.piece) {
      for(let r=0; r<this.piece.shape.length; r++) {
        for(let c=0; c<this.piece.shape[r].length; c++) {
          if(this.piece.shape[r][c]) drawBlock(this.piece.x + c, this.piece.y + r, this.piece.type);
        }
      }
    }
    
    // ビーム
    for(let b of this.beams) { ctx.fillStyle = b.c; ctx.fillRect(b.x, b.y, b.w, b.h); }
    
    // ★ 敵（インベーダー）のアニメーション描画
    for(let inv of this.invaders) { drawSprite(inv.x, inv.y, '#f0f', sprs.invader, 1.5); }
    
    // ★ 自機（ファイター）のアニメーション描画
    let fy = this.getFighterY();
    drawSprite(this.fighter.x*12, fy*12, '#0ff', sprs.fighter, 1.5);
    
    ctx.restore();

    ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText(`SCORE: ${this.score}`, 40, 30);
    ctx.fillText(`LINES: ${this.lines}`, 120, 30);

    if (this.st === 'start') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 120, 200, 40); ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText('PRESS A TO START', 40, 145); }
    if (this.st === 'over') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 120, 200, 40); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('GAME OVER', 65, 140); ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('PRESS A TO RETRY', 55, 155); }
    
    drawParticles();
  }
};
