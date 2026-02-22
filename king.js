// === KING'S ROOM (Phase 4.1: Error Handling Boost) ===
const KingRoom = {
  st: 'init', emotion: 'normal', scroll: 0,
  images: {}, loadedCount: 0,
  logs: [], chatHistory: [],
  cmdCur: 0, cmds: ["ほうこくする", "ほめてほしい", "なぐさめて", "退出する"],
  typeText: "", typeIdx: 0, typeTimer: 0,
  
  init() {
    this.st = 'init';
    this.scroll = 0;
    this.logs = [
      { speaker: 'sys', text: "SYSTEM: 謁見の間に 入室しました" },
      { speaker: 'king', text: "王：「よくぞ まいった！\nわしが このせかいの おうじゃ！」" }
    ];
    this.chatHistory = [];
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

    setTimeout(() => {
      if (AISys.status === 'init') {
        this.st = 'ask_dl';
      } else if (AISys.status === 'loading') {
        this.st = 'downloading';
      } else {
        this.st = 'chat';
      }
    }, 500);
  },
  
  // ★ AIへの送信処理（絶対にエラーで落ちないように防弾処理を追加）
  async sendPrompt() {
    try {
      this.st = 'thinking';
      this.emotion = 'thinking';
      playSnd('sel');
      
      let recentLog = "特になし";
      if (SaveSys.data && SaveSys.data.logs && SaveSys.data.logs.length > 0) {
          recentLog = SaveSys.data.logs[0];
      }
      
      let p = "";
      if(this.cmdCur === 0) p = `勇者の最近の記録:『${recentLog}』。これについて一言コメントして。`;
      if(this.cmdCur === 1) p = `勇者の最近の記録:『${recentLog}』。これを理由に、大げさに褒め称えて。`;
      if(this.cmdCur === 2) p = `勇者の最近の記録:『${recentLog}』。これについて、呆れつつも優しく慰めて。`;
      
      this.logs.push({ speaker: 'sys', text: `> コマンド: ${this.cmds[this.cmdCur]}` });
      this.scrollToBottom();

      const sysPrompt = "あなたはレトロRPG風の王様です。一人称は「わし」、語尾は「じゃ」「じゃな」。腹黒くツンデレな性格。絶対に50文字以内で短く答え、AIであることは隠してください。「王：」などの記号は付けず、セリフの中身だけを出力すること。";
      
      let reply = await AISys.chat(sysPrompt, p, this.chatHistory);
      
      if (!reply || typeof reply !== 'string') {
          reply = "むむっ... わしの アタマが フリーズしたようじゃ！（エラー）";
      }
      
      this.chatHistory.push({ role: 'user', content: p });
      this.chatHistory.push({ role: 'assistant', content: reply });
      if (this.chatHistory.length > 6) this.chatHistory.splice(0, 2); 

      if (reply.includes("！")) this.emotion = 'laughing';
      else if (reply.includes("…") || reply.includes("なさけない") || reply.includes("エラー")) this.emotion = 'disappointed';
      else if (reply.includes("ばか") || reply.includes("たわけ")) this.emotion = 'angry';
      else this.emotion = 'normal';

      this.typeText = reply.replace(/^王：?「?/, '').replace(/」?$/, ''); 
      this.typeIdx = 0;
      this.typeTimer = 0;
      this.logs.push({ speaker: 'king', text: "王：「" });
      this.st = 'typing';

    } catch (err) {
      console.error("AI Talk Error:", err);
      this.logs.push({ speaker: 'king', text: "王：「すまぬ！ なにかが おかしいようじゃ！」" });
      this.emotion = 'disappointed';
      this.scrollToBottom();
      this.st = 'chat';
    }
  },

  scrollToBottom() {
     let lines = 0;
     this.logs.forEach(l => lines += l.text.split('\n').length + 1);
     this.scroll = Math.max(0, lines * 15 - 100);
  },

  update() {
    if (this.st === 'init') return;
    
    if (this.st === 'ask_dl') {
      if (keysDown.left || keysDown.right) { this.cmdCur = this.cmdCur === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.a) {
        if (this.cmdCur === 0) {
          AISys.initModel();
          this.st = 'downloading';
          playSnd('jmp');
        } else {
          this.st = 'chat'; 
          playSnd('sel');
        }
      }
    }
    else if (this.st === 'downloading') {
      if (AISys.status === 'ready') { this.st = 'chat'; playSnd('combo'); }
      if (AISys.status === 'error') { this.st = 'chat'; }
    }
    else if (this.st === 'chat') {
      if (keysDown.select) { switchApp(Menu); return; }
      if (keys.up) { this.scroll = Math.max(0, this.scroll - 3); }
      if (keys.down) { this.scroll += 3; }
      if (keysDown.a) { this.st = 'cmd'; this.cmdCur = 0; playSnd('sel'); }
    }
    else if (this.st === 'cmd') {
      if (keysDown.b) { this.st = 'chat'; playSnd('sel'); return; } 
      if (keysDown.up) { this.cmdCur = (this.cmdCur - 1 + this.cmds.length) % this.cmds.length; playSnd('sel'); }
      if (keysDown.down) { this.cmdCur = (this.cmdCur + 1) % this.cmds.length; playSnd('sel'); }
      if (keysDown.a) {
        if (this.cmdCur === 3) { switchApp(Menu); return; } 
        
        if (AISys.status === 'ready') {
          // ★ 非同期エラーを完全にキャッチしてクラッシュを防ぐ
          this.sendPrompt().catch(e => console.error(e));
        } else {
          this.logs.push({ speaker: 'sys', text: `> コマンド: ${this.cmds[this.cmdCur]}` });
          this.logs.push({ speaker: 'king', text: "王：「わしは 今 ねむいんじゃ。\nまた あとで こい！」" });
          this.emotion = 'disappointed';
          this.scrollToBottom();
          this.st = 'chat';
          playSnd('hit');
        }
      }
    }
    else if (this.st === 'typing') {
      this.typeTimer++;
      if (this.typeTimer >= 2) { 
        this.typeTimer = 0;
        let currentLog = this.logs[this.logs.length - 1];
        currentLog.text += this.typeText[this.typeIdx];
        this.typeIdx++;
        
        if (this.typeIdx % 3 === 0) playSnd('sel'); 
        this.scrollToBottom();
        
        if (this.typeIdx >= this.typeText.length) {
          currentLog.text += "」";
          this.st = 'chat';
        }
      }
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
    
    if (this.st === 'thinking') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('...', 130 + Math.sin(Date.now() / 150) * 3, 50);
    }

    if (this.st === 'ask_dl') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(10, 50, 180, 100);
      ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2; ctx.strokeRect(10, 50, 180, 100);
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      ctx.fillText("【AIモデルのダウンロード】", 20, 70);
      ctx.fillText("約400MBの通信が発生します。", 20, 90);
      ctx.fillText("王様に魂を宿しますか？", 20, 105);
      ctx.fillStyle = this.cmdCur === 0 ? '#0f0' : '#aaa'; ctx.fillText((this.cmdCur===0?'> ':'  ')+"はい(Wi-Fi推奨)", 30, 125);
      ctx.fillStyle = this.cmdCur === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.cmdCur===1?'> ':'  ')+"いいえ(後で)", 30, 140);
    }
    else if (this.st === 'downloading') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(10, 50, 180, 100);
      ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(10, 50, 180, 100);
      ctx.fillStyle = '#0f0'; ctx.font = '11px monospace';
      ctx.fillText("魂を 召喚中...", 60, 70);
      
      ctx.strokeStyle = '#fff'; ctx.strokeRect(20, 90, 160, 10);
      ctx.fillStyle = '#0f0'; ctx.fillRect(20, 90, 160 * AISys.progress, 10);
      
      ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
      ctx.fillText(AISys.progressText.slice(0, 25) + '...', 20, 115);
      ctx.fillText(`${Math.floor(AISys.progress * 100)}%`, 85, 130);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(5, 145, 190, 150);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(5, 145, 190, 150);
    ctx.save(); ctx.beginPath(); ctx.rect(10, 150, 180, 140); ctx.clip();
    
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    let drawY = 165 - this.scroll;
    
    const wrapText = (text, maxWidth) => {
      let result = []; let rawLines = text.split('\n');
      for (let i = 0; i < rawLines.length; i++) {
        let line = '';
        for (let n = 0; n < rawLines[i].length; n++) {
          let testLine = line + rawLines[i][n];
          let metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) { result.push(line); line = rawLines[i][n]; } 
          else { line = testLine; }
        }
        result.push(line);
      }
      return result;
    };

    for (let log of this.logs) {
      ctx.fillStyle = log.speaker === 'king' ? '#0f0' : (log.speaker === 'sys' ? '#aaa' : '#fff');
      let wrappedLines = wrapText(log.text, 170); 
      for (let line of wrappedLines) { ctx.fillText(line, 15, drawY); drawY += 15; }
      drawY += 5; 
    }
    ctx.restore();

    if (this.st === 'cmd') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; ctx.fillRect(90, 160, 100, 85);
      ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2; ctx.strokeRect(90, 160, 100, 85);
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      for (let i = 0; i < this.cmds.length; i++) {
        ctx.fillStyle = this.cmdCur === i ? '#ff0' : '#aaa';
        ctx.fillText((this.cmdCur === i ? '> ' : '  ') + this.cmds[i], 95, 180 + i * 18);
      }
    }

    if (this.st === 'chat') {
      ctx.fillStyle = '#888'; ctx.font = '9px monospace';
      ctx.fillText('A:はなしかける ↑↓:スクロール SEL:戻る', 10, 290);
    }
  }
};
