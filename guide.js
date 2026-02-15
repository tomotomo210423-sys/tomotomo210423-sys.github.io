// === GUIDE ROOM (図書館) ===
const Guide = {
  st: 'map', px: 4.5, py: 13, anim: 0, msg: '',
  map: [
    "1111111111", "1000000001", "1020000301", "1020000301", "1000000001", "1040000501", "1040000501", "1000000001", "1060000701", "1060000701", "1111001111", "0001001000", "0001001000", "0001001000", "0001111000"
  ],
  books: [
    {x: 2, y: 2, name: '【システム・操作】', msg: '--- 基本操作 ---\n十字キー: 移動/選択\nAボタン: 決定/アクション\nBボタン: キャンセル\n\nSELECT長押しで\n背景テーマ変更だ。'},
    {x: 7, y: 2, name: '【テトリベーダー】', msg: '--- 概要 ---\nパズルとSTGの融合。\nミノを揃えて消すか、\n弾で撃ち壊せ！\nHard弾幕を凌げばスコア2倍！'},
    {x: 2, y: 5, name: '【ブラザーズの書】', msg: '--- ストーリー ---\n誘拐された姫を救うため、\n理不尽な罠が潜む世界へ。\n\n怪しい壁やコインには\n即死の罠が潜んでいるぞ。'},
    {x: 7, y: 5, name: '【クエストの書】', msg: '--- ストーリー ---\n魔王に支配された世界。\n王様の頼みを聞き、\n各地のダンジョンでボスを\n倒し、魔王城へ向かおう。'},
    {x: 2, y: 8, name: '【ONLINE対戦】', msg: '--- 概要 ---\nエアホッケー風の対戦。\n上下移動でパドルを操作し\nボールを打ち返せ！\n5点先取で勝利だ。'},
    {x: 7, y: 8, name: '【カスタム闘技場】', msg: '--- 闘技場（新機能）---\nRPGの町にある工房から\n「闘技場」へ行ける。\n好きなステータスや名前の\nオリジナルボスを作り\n保存して戦うことができるぞ！'}
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
      ctx.fillStyle = '#842'; ctx.fillRect(b.x * 20 - 5, b.y * 20, 30, 15);
      ctx.fillStyle = '#eee'; ctx.fillRect(b.x * 20, b.y * 20 - 5 + offsetY, 10, 8);
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText(b.name, b.x * 20 - 15, b.y * 20 - 10 + offsetY);
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
