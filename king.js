// === KING'S ROOM (SEPARATE IMAGES EDITION) ===
const KingRoom = {
  st: 'init', emotion: 'normal', scroll: 0,
  images: {}, loadedCount: 0,
  logs: [
    { speaker: 'sys', text: "SYSTEM: 謁見の間に 入室しました" },
    { speaker: 'king', text: "おお ゆうしゃよ！\nよくぞ まいった！\nわしが このせかいの おうじゃ！" },
    { speaker: 'sys', text: "※現在は 表情テストモードです。\n Aボタンで 王様の表情が 変わります。" }
  ],
  
  init() {
    this.st = 'chat';
    this.scroll = 0;
    BGM.play('spell'); 
    
    // ★ 5つの画像を読み込む（魔法の透過処理や座標計算は一切不要！）
    const emos = ['normal', 'thinking', 'angry', 'laughing', 'disappointed'];
    emos.forEach(emo => {
      if (!this.images[emo]) {
        const img = new Image();
        img.src = `king_${emo}.png`;
        img.onload = () => { this.loadedCount++; };
        this.images[emo] = img;
      }
    });
  },
  
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    if (keys.up) { this.scroll = Math.max(0, this.scroll - 3); }
    if (keys.down) { this.scroll += 3; }
    
    // Aボタンで表情切り替え
    if (keysDown.a) {
      const emos = ['normal', 'thinking', 'angry', 'laughing', 'disappointed'];
      this.emotion = emos[(emos.indexOf(this.emotion) + 1) % emos.length];
      playSnd('sel');
    }
  },
  
  draw() {
    // 背景の描画
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    ctx.fillStyle = '#400'; ctx.fillRect(0, 0, 200, 150); 
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 100); ctx.stroke(); }
    for(let i=0; i<100; i+=15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); }
    ctx.fillStyle = '#a00'; ctx.fillRect(0, 100, 200, 50); 
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(100, 135, 40, 10, 0, 0, Math.PI*2); ctx.fill();

    // === 王様の描画 ===
    if (this.loadedCount >= 5) {
      // 現在の感情の画像を取り出して、そのままドン！と真ん中に描画するだけ！
      const currentImg = this.images[this.emotion];
      const size = 90; // 王様のサイズ
      ctx.drawImage(currentImg, 100 - size/2, 145 - size, size, size);
    } else {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText('Loading King...', 60, 80);
    }
    
    // 思考中のアニメーション
    if (this.emotion === 'thinking') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('...', 130 + Math.sin(Date.now() / 150) * 3, 50);
    }

    // チャットログの描画
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(5, 145, 190, 150);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(5, 145, 190, 150);
    ctx.save(); ctx.beginPath(); ctx.rect(10, 150, 180, 140); ctx.clip();
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    let drawY = 165 - this.scroll;
    for (let log of this.logs) {
      ctx.fillStyle = log.speaker === 'king' ? '#0f0' : '#aaa';
      let lines = log.text.split('\n');
      for (let line of lines) { ctx.fillText(line, 15, drawY); drawY += 15; }
      drawY += 5; 
    }
    ctx.restore();
    ctx.fillStyle = '#888'; ctx.font = '9px monospace';
    ctx.fillText('A:表情テスト ↑↓:スクロール SEL:戻る', 10, 290);
  }
};
