// === GUIDE ROOM (図書館) ===
const Guide = {
  st: 'map', px: 4.5, py: 13, anim: 0, msg: '',
  map: [
    "1111111111", "1000000001", "1020000301", "1020000301", "1000000001", "1000000001", "1040000501", "1040000501", "1000000001", "1000000001", "1111001111", "0001001000", "0001001000", "0001001000", "0001111000"
  ],
  books: [
    {x: 2, y: 2, name: '【システム】', msg: '--- システム概要 ---\n全てのゲームは\n自動でセーブされます。\nSELECTボタンを長押し\nすると、背景テーマを\n変更できます。'},
    {x: 7, y: 2, name: '【操作方法】', msg: '--- 基本操作 ---\n十字キー：移動 / 選択\nAボタン：決定 / アクション\nBボタン：キャンセル\nSELECT：メニューへ戻る'},
    {x: 2, y: 6, name: '【ブラザーズの書】', msg: '--- 理不尽ブラザーズ ---\n理不尽な即死トラップに\n立ち向かう死に覚え\nアクションゲーム。\n怪しい場所は疑ってかかれ！'},
    {x: 7, y: 6, name: '【クエストの書】', msg: '--- マイクロクエスト ---\n魔王に支配された世界を救う\n超本格RPG。\nまずは町で王様から\n目的を聞き出そう。\n自由な育成と探索が可能だ！'}
  ],
  init() { this.st = 'map'; this.px = 4.5; this.py = 13; BGM.play('menu'); },
  update() {
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if (this.st === 'msg') { if (keysDown.a || keysDown.b) this.st = 'map'; return; }
    this.anim++; let nx = this.px, ny = this.py;
    if (keys.up) ny -= 0.15; if (keys.down) ny += 0.15; if (keys.left) nx -= 0.15; if (keys.right) nx += 0.15;
    let cx = Math.floor(nx + 0.5), cy = Math.floor(ny + 0.5);
    if (cy >= 0 && cy < 15 && cx >= 0 && cx < 10 && this.map[cy][cx] !== '1') { this.px = nx; this.py = ny; }
    if (this.py > 15) { activeApp = Menu; Menu.init(); }
    if (keysDown.a) {
      for (let b of this.books) {
        if (Math.abs(b.x - this.px) < 1.5 && Math.abs(b.y - this.py) < 1.5) { this.msg = b.msg; this.st = 'msg'; playSnd('sel'); }
      }
    }
  },
  draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
    for(let r=0; r<15; r++) {
      for(let c=0; c<10; c++) {
        if(this.map[r][c] === '1') { ctx.fillStyle = '#444'; ctx.fillRect(c*20, r*20, 20, 20); ctx.fillStyle = '#555'; ctx.fillRect(c*20+2, r*20+2, 16, 16); }
      }
    }
    ctx.fillStyle = '#800'; ctx.fillRect(80, 40, 40, 300);
    const offsetY = Math.sin(this.anim * 0.1) * 2;
    for (let b of this.books) {
      ctx.fillStyle = '#842'; ctx.fillRect(b.x * 20 - 5, b.y * 20, 30, 15); // 机
      ctx.fillStyle = '#eee'; ctx.fillRect(b.x * 20, b.y * 20 - 5 + offsetY, 10, 8); // 本
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText(b.name, b.x * 20 - 10, b.y * 20 - 10 + offsetY);
    }
    drawSprite(this.px * 20, this.py * 20, '#fff', sprs.player, 2.5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText('ゲーム解説館', 5, 15); ctx.font = '8px monospace'; ctx.fillText('歩く:十字キー / 読む:A', 5, 28);
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 160, 190, 120); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 160, 190, 120); ctx.lineWidth = 1;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      let lines = this.msg.split('\n'); for (let i = 0; i < lines.length; i++) { ctx.fillText(lines[i], 15, 180 + i * 14); }
      ctx.fillStyle = '#ff0'; ctx.fillText('▼ Aボタン', 135, 270);
    }
  }
};
