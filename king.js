// === KING'S ROOM (Phase 3.5: RPG Dialogue Style) ===
const KingRoom = {
  st: 'init', emotion: 'normal', scroll: 0,
  images: {}, loadedCount: 0,
  logs: [
    { speaker: 'sys', text: "SYSTEM: 謁見の間に 入室しました" },
    // ★ セリフの表示をRPG風に変更
    { speaker: 'king', text: "王：「おお ゆうしゃよ！\nよくぞ まいった！\nわしが このせかいの おうじゃ！」" },
    { speaker: 'sys', text: "【フェーズ3 テストモード】\n Aボタン: 表情チェンジ\n Bボタン: 最新のプレイ記録を覗き見" }
  ],
  
  init() {
    this.st = 'chat';
    this.scroll = 0;
    BGM.play('spell'); 
    
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

    // Bボタンで最新のプレイ記録（監視データ）を喋る
    if (keysDown.b) {
      let recentLog = "とくに なにも しておらんようじゃな。";
      if (SaveSys.data.logs && SaveSys.data.logs.length > 0) {
        recentLog = SaveSys.data.logs[0]; 
      }
      // ★ ここも王様のカギカッコ対応（中身は『』にする）
      this.logs.push({ speaker: 'king', text: "王：「ふむ、ほうこく に よると...\n『" + recentLog + "』\n...ということじゃな！\nわしは すべて おみとおしじゃぞ！」" });
      this.emotion = 'thinking';
      this.scroll = Math.max(0, this.logs.length * 40); 
      playSnd('jmp');
    }
  },
  
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    ctx.fillStyle = '#400'; ctx.fillRect(0, 0, 200, 150); 
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 100); ctx.stroke(); }
    for(let i=0; i<100; i+=15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); }
    ctx.fillStyle = '#a00'; ctx.fillRect(0, 100, 200, 50); 
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(100, 135, 40, 10, 0, 0, Math.PI*2); ctx.fill();

    if (this.loadedCount >= 5) {
      const currentImg = this.images[this.emotion];
      const size = 90; 
      ctx.drawImage(currentImg, 100 - size/2, 145 - size, size, size);
    } else {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('Loading King...', 60, 80);
    }
    
    if (this.emotion === 'thinking') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('...', 130 + Math.sin(Date.now() / 150) * 3, 50);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(5, 145, 190, 150);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(5, 145, 190, 150);
    ctx.save(); ctx.beginPath(); ctx.rect(10, 150, 180, 140); ctx.clip();
    
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    let drawY = 165 - this.scroll;
    
    // 文字の長さを測って自動で折り返す
    const wrapText = (text, maxWidth) => {
      let result = [];
      let rawLines = text.split('\n');
      for (let i = 0; i < rawLines.length; i++) {
        let line = '';
        for (let n = 0; n < rawLines[i].length; n++) {
          let testLine = line + rawLines[i][n];
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            result.push(line);
            line = rawLines[i][n];
          } else {
            line = testLine;
          }
        }
        result.push(line);
      }
      return result;
    };

    for (let log of this.logs) {
      ctx.fillStyle = log.speaker === 'king' ? '#0f0' : '#aaa';
      let wrappedLines = wrapText(log.text, 160); 
      for (let line of wrappedLines) { 
        ctx.fillText(line, 15, drawY); 
        drawY += 15; 
      }
      drawY += 5; 
    }
    ctx.restore();
    ctx.fillStyle = '#888'; ctx.font = '9px monospace';
    ctx.fillText('A:表情  B:ログ覗き見  SEL:戻る', 10, 290);
  }
};
