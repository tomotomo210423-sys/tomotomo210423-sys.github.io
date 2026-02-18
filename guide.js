// === GUIDE ROOM (図書館) - 4in1 UPDATE ===
const Guide = {
  st: 'map', px: 4.5, py: 13, anim: 0, msg: '',
  map: [
    "1111111111", "1000000001", "1020880301", "1020880301", "1000000001", "1040000501", "1040000501", "1000000001", "1060000701", "1060000701", "1111001111", "0001001000", "0001001000", "0001001000", "0001111000"
  ],
  books: [
    {x: 2, y: 2, name: '【操作】', msg: '--- 基本操作 ---\n十字キー: 移動/選択\nAボタン: 決定/アクション\nBボタン: キャンセル\n\nSELECT長押しで\n背景テーマ変更だ。'},
    {x: 7, y: 2, name: '【テトリ】', msg: '--- 概要 ---\nパズルとSTGの融合。\nミノを消すか弾で壊せ！\n\n難易度選択でスキン変更可能。\nHardを凌げばスコア2倍！'},
    {x: 4.5, y: 2, name: '【BEAT】', msg: '--- BEAT BROS ---\nMP3を読み込んで\n自動で譜面を作る音ゲーだ。\n\nスマホは画面を直接タップ！\nPCは D・F・J・K キーの\n両手プレイが最強だぜ！'},
    {x: 2, y: 5, name: '【理不尽】', msg: '--- 概要 ---\n即死トラップ満載のアクション。\n残機が0になると、\nステージ構造がランダムに\n再生成される。\n理不尽に耐えろ！'},
    {x: 7, y: 5, name: '【ONLINE】', msg: '--- 概要 ---\n白熱の擬似オンライン対戦！\nパドルを操作して\nボールを打ち返せ。\n先に5点先取で勝利だ。'},
    {x: 2, y: 8, name: '【引継ぎ】', msg: '--- セーブの永久保存 ---\nメニューの「データ引継ぎ」で\n秘密の管理室に行ける。\n端末を操作してデータを\nパスワード化しよう！'}
  ],
  
  init() { this.st = 'map'; this.px = 4.5; this.py = 13; this.anim = 0; BGM.play('menu'); },
  
  update() {
    if (keysDown.select) { activeApp = Menu; Menu.init(); return; }
    if (this.st === 'msg') { if (keysDown.a || keysDown.b) { this.st = 'map'; playSnd('sel'); } return; }
    
    this.anim++;
    let nx = this.px, ny = this.py;
    if (keys.left) nx -= 0.15; if (keys.right) nx += 0.15;
    if (keys.up) ny -= 0.15; if (keys.down) ny += 0.15;
    
    let hit = false;
    for(let r=0; r<15; r++) {
      for(let c=0; c<10; c++) {
        if(this.map[r][c] !== '0' && this.map[r][c] !== '2' && this.map[r][c] !== '3' && this.map[r][c] !== '4' && this.map[r][c] !== '5' && this.map[r][c] !== '6' && this.map[r][c] !== '7' && this.map[r][c] !== '8') {
          if (nx+0.8 > c && nx < c+1 && ny+0.8 > r && ny < r+1) hit = true;
        }
      }
    }
    if (!hit) { this.px = nx; this.py = ny; }
    
    if (keysDown.a) {
      for (let b of this.books) {
        if (Math.abs(this.px - b.x) < 1.5 && Math.abs(this.py - b.y) < 1.5) { this.msg = b.msg; this.st = 'msg'; playSnd('jmp'); }
      }
    }
  },
  
  draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
    for(let r=0; r<15; r++) {
      for(let c=0; c<10; c++) {
        if(this.map[r][c] === '1') { 
          ctx.fillStyle = '#444'; ctx.fillRect(c*20, r*20, 20, 20); 
          ctx.fillStyle = '#555'; ctx.fillRect(c*20+2, r*20+2, 16, 16); 
        }
        else if(this.map[r][c] === '8') { 
          ctx.fillStyle = '#111'; ctx.fillRect(c*20, r*20, 20, 20);
          ctx.fillStyle = '#0f0'; ctx.fillRect(c*20+8, r*20+8, 4, 4);
        }
      }
    }
    ctx.fillStyle = '#800'; ctx.fillRect(80, 40, 40, 300);
    
    const offsetY = Math.sin(this.anim * 0.1) * 2;
    for (let b of this.books) {
      if (b.name !== '【BEAT】') {
        ctx.fillStyle = '#842'; ctx.fillRect(b.x * 20 - 5, b.y * 20, 30, 15);
      }
      ctx.fillStyle = '#eee'; ctx.fillRect(b.x * 20, b.y * 20 - 5 + offsetY, 10, 8);
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText(b.name, b.x * 20 - 15, b.y * 20 - 10);
    }
    
    drawSprite(this.px * 20, this.py * 20, '#0f0', sprs.player || sprs.heroNew, 2.5);
    
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 80, 180, 130);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, 80, 180, 130); ctx.lineWidth = 1;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      let lines = this.msg.split('\n');
      for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 20, 105 + i*16);
      ctx.fillStyle = '#ff0'; ctx.fillText('▼ (A)', 150, 200);
    }
  }
};
