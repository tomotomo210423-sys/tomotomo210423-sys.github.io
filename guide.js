// === GUIDE ROOM ===
const Guide = {
  st: 'map', px: 4.5, py: 13, anim: 0, msg: '',
  map: [ "1111111111", "1000000001", "1020000301", "1000000001", "1000000001", "1000400001", "1000000001", "1000000001", "1050000601", "1000000001", "1111001111", "0001001000", "0001001000", "0001001000", "0001111000" ],
  npcs: [
    {x: 2, y: 2, c: '#0ff', name: 'TETRI', msg: '【テトリベーダー】\nテトリスとシューティング\nが合体したゲームだ！\nハードモードの弾幕は\n成功するとスコア2倍だぞ！'},
    {x: 7, y: 2, c: '#f00', name: 'BROS', msg: '【理不尽ブラザーズ】\n即死トラップ満載の\nアクションゲームだ。\n偽コインや見えないブロック\nに気をつけろ！'},
    {x: 2, y: 8, c: '#ff0', name: 'RPG', msg: '【マイクロクエスト】\n世界を巡るRPGだ。\n画面端に行くと\n隣のエリアに移動できるぞ。\nまずは城で王様と話そう！'},
    {x: 7, y: 8, c: '#f0f', name: 'ONLINE', msg: '【ONLINE対戦】\nエアホッケー風の対戦だ。\n上下移動でパドルを操作し\nボールを打ち返せ！'},
    {x: 4, y: 5, c: '#0f0', name: 'SYS', msg: '【システム】\nセーブは自動で行われる。\nメニューでSELECTを長押し\nすると背景テーマを\n変更できるぞ！'}
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
      for (let n of this.npcs) {
        if (Math.abs(n.x - this.px) < 1.5 && Math.abs(n.y - this.py) < 1.5) { this.msg = n.msg; this.st = 'msg'; playSnd('sel'); }
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
    ctx.fillStyle = '#800'; ctx.fillRect(80, 40, 40, 300); // カーペット
    const offsetY = Math.sin(this.anim * 0.1) * 2;
    for (let n of this.npcs) {
      drawSprite(n.x * 20, n.y * 20 + offsetY, n.c, sprs.heroNew, 2.5);
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText(n.name, n.x * 20 - 2, n.y * 20 - 5 + offsetY);
    }
    drawSprite(this.px * 20, this.py * 20, '#fff', sprs.player, 2.5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText('ゲーム解説館', 5, 15); ctx.font = '8px monospace'; ctx.fillText('歩く:十字キー / 話す:A', 5, 28);
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 180, 190, 90); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 180, 190, 90); ctx.lineWidth = 1;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      let lines = this.msg.split('\n'); for (let i = 0; i < lines.length; i++) { ctx.fillText(lines[i], 15, 200 + i * 14); }
      ctx.fillStyle = '#ff0'; ctx.fillText('▼ Aボタン', 135, 260);
    }
  }
};
