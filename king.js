// === KING'S ROOM (AI CHAT UI BASE) ===
const KingRoom = {
  st: 'init', img: null, loaded: false, emotion: 'normal',
  scroll: 0,
  logs: [
    { speaker: 'sys', text: "SYSTEM: 謁見の間に 入室しました" },
    { speaker: 'king', text: "おお ゆうしゃよ！\nよくぞ まいった！\nわしが このせかいの おうじゃ！" },
    { speaker: 'sys', text: "※現在は 表情テストモードです。\n Aボタンで 王様の表情が 変わります。" }
  ],
  
  init() {
    this.st = 'chat';
    this.scroll = 0;
    BGM.play('spell'); // ドラクエのお城風のBGMを流す
    
    // 画像のロード（キャッシュされていれば即時表示）
    if (!this.img) {
      this.img = new Image();
      this.img.src = 'king.png';
      this.img.onload = () => { this.loaded = true; };
    }
  },
  
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    
    // ログのスクロール操作
    if (keys.up) { this.scroll = Math.max(0, this.scroll - 3); }
    if (keys.down) { this.scroll += 3; }
    
    // ★ 開発用：Aボタンで表情のテスト切り替え
    if (keysDown.a) {
      const emos = ['normal', 'thinking', 'angry', 'laughing', 'disappointed'];
      this.emotion = emos[(emos.indexOf(this.emotion) + 1) % emos.length];
      playSnd('sel');
    }
  },
  
  draw() {
    // === 背景の描画（お城の玉座風） ===
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    ctx.fillStyle = '#400'; ctx.fillRect(0, 0, 200, 150); // 壁
    ctx.fillStyle = '#a00'; ctx.fillRect(0, 100, 200, 50); // 絨毯
    
    // === 王様の描画 ===
    if (this.loaded) {
      // 画像は「上段3体、下段2体」の配置なので、それを計算して切り抜く
      const sw = this.img.width / 3;  // 1体あたりの幅
      const sh = this.img.height / 2; // 1体あたりの高さ
      let sx = 0, sy = 0;
      
      switch(this.emotion) {
        case 'normal':       sx = 0; sy = 0; break;
        case 'thinking':     sx = sw; sy = 0; break;
        case 'angry':        sx = sw * 2; sy = 0; break;
        // 下段の2体は中央寄りなので、少しずらして切り抜く
        case 'laughing':     sx = sw * 0.5; sy = sh; break; 
        case 'disappointed': sx = sw * 1.5; sy = sh; break;
      }
      
      // 王様を画面中央に描画 (幅100px相当に縮小/拡大)
      const drawW = 100;
      const drawH = 100 * (sh / sw);
      ctx.drawImage(this.img, sx, sy, sw, sh, 50, 130 - drawH, drawW, drawH);
    } else {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText('Loading King...', 60, 80);
    }
    
    // 思考中のアニメーション演出
    if (this.emotion === 'thinking') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('...', 130 + Math.sin(Date.now() / 150) * 3, 50);
    }

    // === チャットログウィンドウの描画 ===
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(5, 145, 190, 150);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(5, 145, 190, 150);
    
    ctx.save();
    ctx.beginPath(); ctx.rect(10, 150, 180, 140); ctx.clip();
    
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    let drawY = 165 - this.scroll;
    
    for (let log of this.logs) {
      // システムメッセージは灰色、王様は緑色
      ctx.fillStyle = log.speaker === 'king' ? '#0f0' : '#aaa';
      let lines = log.text.split('\n');
      for (let line of lines) {
        ctx.fillText(line, 15, drawY);
        drawY += 15;
      }
      drawY += 5; // メッセージの間の余白
    }
    ctx.restore();
    
    // ガイドテキスト
    ctx.fillStyle = '#888'; ctx.font = '9px monospace';
    ctx.fillText('A:表情テスト ↑↓:スクロール SEL:戻る', 10, 290);
  }
};
