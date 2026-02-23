// === KING'S ROOM (Phase 6.2: Talkative King Update) ===
const KingRoom = {
  st: 'init', emotion: 'normal', scroll: 0,
  images: {}, loadedCount: 0,
  logs: [], 
  cmdCur: 0, cmds: ["ほうこくする", "ほめてほしい", "なぐさめて", "じゆうにはなす", "退出する"],
  typeText: "", typeIdx: 0, typeTimer: 0,
  
  init() {
    this.st = 'chat';
    this.scroll = 0;
    this.logs = [
      { speaker: 'sys', text: "SYSTEM: 謁見の間に 入室しました" },
      { speaker: 'king', text: "王：「よくぞ まいった！\nわしが このせかいの おうじゃ！」" }
    ];
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
  
  async sendPrompt(customText) {
    try {
      playSnd('sel');
      
      let p = "";
      if (customText) {
        p = `勇者の言葉：「${customText}」\nこれに対する王様の返答セリフ：`;
        this.logs.push({ speaker: 'sys', text: `> あなた: ${customText}` });
      } else {
        let recentLog = SaveSys.data.logs && SaveSys.data.logs.length > 0 ? SaveSys.data.logs[0] : "とくに なにも しておらん";
        if(this.cmdCur === 0) p = `勇者の報告：「${recentLog}」\nこれに対する王様の返答セリフ：`;
        if(this.cmdCur === 1) p = `勇者の報告：「${recentLog}」\nこれを大げさに褒めちぎる王様のセリフ：`;
        if(this.cmdCur === 2) p = `勇者の報告：「${recentLog}」\nこれを呆れつつも優しく慰める王様のセリフ：`;
        this.logs.push({ speaker: 'sys', text: `> コマンド: ${this.cmds[this.cmdCur]}` });
      }
      
      this.scrollToBottom();

      // ★ サボり防止の「絶対ルール」を追加！
      const sysPrompt = `あなたはレトロRPGの偉大な王様です。プレイヤー（勇者）の言葉に対して、王様としての威厳あるセリフを返してください。

【王様の設定・口調】
・一人称は「わし」、二人称は「そなた」か「ゆうしゃ」。
・語尾は「～じゃ」「～じゃな」「～でおじゃる」。
・性格はツンデレで少し腹黒いが、根は勇者思い。
・好物：実は超甘党で「特製プリン」が大好物。
・悩み：豪華な王冠が重すぎて、ひどい肩こりと首の痛みに悩んでいる。
・座右の銘：「案ずるよりプリンじゃ！」
・特技：昔は世界最強の魔法使いだったが、今は歳のせいで呪文をよく噛む。
・秘密：寝る時は可愛いフリフリのナイトキャップを被っている。

【絶対の出力ルール】
・セリフは必ず「2〜3文（合計50文字以上）」で、絶対に一言で終わらせないこと！
・勇者の報告が「特になにもしておらん」等の内容が無いものでも、「生きておるだけで偉い！」などと理由をでっち上げて全力で褒めたりリアクションすること。
・「王：」などの名前や、カギカッコ「」は書かず、セリフの中身だけを出力すること。`;

      let reply = await AISys.chat(sysPrompt, p);
      
      if (!reply || typeof reply !== 'string') {
          reply = "むむっ... わしの アタマが フリーズしたようじゃ！（エラー）";
      }

      if (reply.includes("！") || reply.includes("褒") || reply.includes("プリン")) this.emotion = 'laughing';
      else if (reply.includes("…") || reply.includes("痛") || reply.includes("慰")) this.emotion = 'disappointed';
      else if (reply.includes("ばか") || reply.includes("たわけ") || reply.includes("怒")) this.emotion = 'angry';
      else this.emotion = 'normal';

      this.typeText = reply.replace(/^王：?「?/, '').replace(/」?$/, '').replace(/^出力：?/, ''); 
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
    
    if (this.st === 'chat') {
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
        if (this.cmdCur === 4) { switchApp(Menu); return; } 
        
        let customText = null;
        if (this.cmdCur === 3) {
          keys.a = false; keysDown.a = false; 
          customText = prompt("王様に伝える言葉を入力してください：", "");
          if (!customText || customText.trim() === "") {
            this.st = 'chat';
            return;
          }
        }
        
        keys.a = false; 
        keysDown.a = false;
        
        this.st = 'thinking';
        this.emotion = 'thinking';
        this.sendPrompt(customText).catch(e => console.error(e));
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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; ctx.fillRect(80, 145, 110, 100);
      ctx.strokeStyle = '#ff0'; ctx.lineWidth = 2; ctx.strokeRect(80, 145, 110, 100);
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      for (let i = 0; i < this.cmds.length; i++) {
        ctx.fillStyle = this.cmdCur === i ? '#ff0' : '#aaa';
        ctx.fillText((this.cmdCur === i ? '> ' : '  ') + this.cmds[i], 85, 160 + i * 18);
      }
    }

    if (this.st === 'chat') {
      ctx.fillStyle = '#888'; ctx.font = '9px monospace';
      ctx.fillText('A:はなしかける ↑↓:スクロール SEL:戻る', 10, 290);
    }
  }
};
