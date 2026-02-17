// === BEAT BROS - TALL SCREEN & MAGIC TILES STYLE ===
const Rhythm = {
  st: 'menu', mode: 'normal', audioBuffer: null, source: null, startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], introTimer: 0,
  
  // ★ 縦長画面(200x400)用の座標設定
  laneA: 60, laneB: 140, lineY: 340,
  
  init() {
    this.st = 'menu'; this.mode = 'normal';
    this.audioBuffer = null; if (this.source) { this.source.stop(); this.source.disconnect(); this.source = null; }
    
    // 筐体とCanvasの解像度を通常のサイズ(200x300)に戻す
    document.getElementById('gameboy').classList.remove('mode-rhythm', 'mode-tall');
    const cvs = document.getElementById('gameCanvas');
    cvs.width = 200; cvs.height = 300; 
    
    BGM.play('menu');
    this.showFileUI();
  },
  
  showFileUI() {
    let ui = document.getElementById('rhythm-file-ui');
    if (!ui) {
      ui = document.createElement('div');
      ui.id = 'rhythm-file-ui';
      ui.style.position = 'absolute'; ui.style.bottom = '40px'; ui.style.left = '50%'; ui.style.transform = 'translateX(-50%)'; ui.style.zIndex = '100'; ui.style.textAlign = 'center'; ui.style.width = '100%';
      let label = document.createElement('label');
      label.style.display = 'inline-block'; label.style.background = '#ff0'; label.style.color = '#000'; label.style.padding = '10px 15px'; label.style.fontFamily = 'monospace'; label.style.fontWeight = 'bold'; label.style.fontSize = '12px'; label.style.borderRadius = '5px'; label.style.cursor = 'pointer'; label.style.border = '2px solid #fff'; label.style.boxShadow = '0 0 15px #ff0';
      label.innerHTML = '📁 曲ファイルを選ぶ';
      let input = document.createElement('input');
      input.type = 'file'; input.accept = 'audio/*'; input.style.display = 'none';
      input.onchange = (e) => {
        if (e.target.files[0]) { initAudio(); this.hideFileUI(); this.loadFile(e.target.files[0]); e.target.value = ''; }
      };
      label.appendChild(input); ui.appendChild(label);
      const container = document.getElementById('screen-container');
      if (container) container.appendChild(ui); else document.body.appendChild(ui);
    }
    ui.style.display = 'block';
  },
  
  hideFileUI() { let ui = document.getElementById('rhythm-file-ui'); if (ui) ui.style.display = 'none'; },
  
  loadFile(file) {
    this.st = 'loading'; BGM.stop();
    
    // ★ ガシャン！コントローラーが下に縮み、画面が上下にグーンと伸びる！(200x400)
    document.getElementById('gameboy').classList.add('mode-rhythm', 'mode-tall'); 
    const cvs = document.getElementById('gameCanvas');
    cvs.width = 200; cvs.height = 400; 
    
    playSnd('hit'); screenShake(10); 
    
    const reader = new FileReader();
    reader.onload = e => {
      audioCtx.decodeAudioData(e.target.result, buffer => {
        this.audioBuffer = buffer;
        this.generateNotes(buffer);
      }, err => { alert("解析エラー。別の曲を試してください。"); this.init(); });
    };
    reader.readAsArrayBuffer(file);
  },
  
  generateNotes(buffer) {
    const raw = buffer.getChannelData(0);
    this.notes = [];
    
    let maxVol = 0;
    for (let i = 0; i < raw.length; i += 1000) if (Math.abs(raw[i]) > maxVol) maxVol = Math.abs(raw[i]);
    
    let threshold = maxVol * (this.mode === 'hard' ? 0.35 : this.mode === 'normal' ? 0.6 : 0.85);
    let minGap = this.mode === 'hard' ? 0.12 : this.mode === 'normal' ? 0.25 : 0.5;
    
    let lastTime = 0;
    for (let i = 0; i < raw.length; i += 256) {
      let vol = Math.abs(raw[i]);
      if (vol > threshold) {
        let t = i / buffer.sampleRate; 
        if (t - lastTime > minGap) {
          let type = 'A';
          if (this.mode === 'normal') type = Math.random() > 0.4 ? 'A' : 'B';
          if (this.mode === 'hard') type = Math.random() > 0.5 ? 'A' : 'B';
          this.notes.push({ time: t, type: type, hit: false, y: -50, missed: false });
          lastTime = t;
        }
      }
    }
    this.startPlay();
  },
  
  startPlay() {
    this.st = 'intro'; this.introTimer = 0; 
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
    this.source = audioCtx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(audioCtx.destination);
    
    this.source.onended = () => { 
      this.st = 'result'; 
      let finalScore = Math.floor(this.score);
      if (finalScore > SaveSys.data.rhythm[this.mode]) {
         SaveSys.data.rhythm[this.mode] = finalScore;
         SaveSys.save();
      }
    }; 
  },
  
  update() {
    if (keysDown.select) { 
       this.hideFileUI(); 
       if (this.source) { this.source.stop(); this.source = null; } 
       this.init(); // 戻る時は初期化を呼んで筐体を戻す
       switchApp(Menu); 
       return; 
    }
    
    if (this.st === 'menu') {
      if (keysDown.up || keysDown.down) { 
        if (this.mode === 'easy') this.mode = 'normal'; else if (this.mode === 'normal') this.mode = 'hard'; else this.mode = 'easy';
        playSnd('sel'); 
      }
    }
    else if (this.st === 'intro') {
      this.introTimer++;
      if (this.introTimer === 45) { 
         this.st = 'play';
         this.startTime = audioCtx.currentTime + 1.5; 
         this.source.start(this.startTime);
      }
    }
    else if (this.st === 'play') {
      let now = audioCtx.currentTime - this.startTime;
      // 縦画面になったので落下速度を速く調整
      let speed = this.mode === 'hard' ? 450 : this.mode === 'normal' ? 300 : 200;
      
      const hitKey = (type) => {
        let hitNote = null, minDiff = 999;
        let nx = type === 'A' ? this.laneA : this.laneB;
        for (let n of this.notes) {
          if (!n.hit && !n.missed && n.type === type) {
            let diff = Math.abs(n.time - now);
            if (diff < 0.2 && diff < minDiff) { minDiff = diff; hitNote = n; }
          }
        }
        if (hitNote) {
          hitNote.hit = true; let msg = '', pts = 0;
          if (minDiff < 0.05) { msg = 'PERFECT'; pts = 100; addParticle(nx, this.lineY, '#ff0', 'explosion'); screenShake(3); }
          else if (minDiff < 0.1) { msg = 'GREAT'; pts = 50; addParticle(nx, this.lineY, type==='A'?'#f00':'#08f', 'star'); }
          else { msg = 'GOOD'; pts = 10; }
          this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
          this.judgements.push({ msg: msg, life: 30, color: '#ff0', type: type });
          playSnd('hit');
        }
      };
      
      if (keysDown.a) hitKey('A');
      if (keysDown.b) hitKey('B');
      
      for (let n of this.notes) {
        if (!n.hit && !n.missed) {
          n.y = this.lineY - (n.time - now) * speed;
          if (n.y > 380) { 
            n.missed = true; this.combo = 0; 
            this.judgements.push({ msg: 'MISS', life: 30, color: '#f00', type: n.type }); screenShake(2); 
          }
        }
      }
      for (let i = this.judgements.length - 1; i >= 0; i--) { this.judgements[i].life--; if (this.judgements[i].life <= 0) this.judgements.splice(i, 1); }
    }
    else if (this.st === 'result') { if (keysDown.a || keysDown.b) { this.init(); } }
  },
  
  draw() {
    applyShake();
    
    // 現在のCanvas解像度(200x300 or 200x400)に合わせて背景を塗る
    const cvs = document.getElementById('gameCanvas');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    
    if (this.st === 'menu') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('BEAT BROS', 60, 50);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('【音楽ファイル読込】', 45, 80);
      const modes = ['easy', 'normal', 'hard'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = this.mode === modes[i] ? '#0f0' : '#666';
        ctx.fillText((this.mode === modes[i] ? '> ' : '  ') + modes[i].toUpperCase(), 65, 125 + i * 35);
        ctx.fillStyle = this.mode === modes[i] ? '#ff0' : '#888'; ctx.font = '8px monospace';
        ctx.fillText(`HI-SCORE: ${SaveSys.data.rhythm[modes[i]]}`, 65, 137 + i * 35);
        ctx.font = '10px monospace'; 
      }
      ctx.fillStyle = '#0ff'; ctx.fillText('▼ 画面のボタンをタップ ▼', 25, 230);
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if (this.st === 'loading' || this.st === 'intro' || this.st === 'play') {
      // ★ 上下に長い魔法のタイル風プレイ画面
      
      // サイバーな流れる背景ライン
      ctx.strokeStyle = '#030'; ctx.lineWidth = 1;
      for (let i = 0; i < 25; i++) { 
        ctx.beginPath(); ctx.moveTo(0, i * 20 + (Date.now() % 20)); ctx.lineTo(200, i * 20 + (Date.now() % 20)); ctx.stroke(); 
      }
      
      // レーンの背景色
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)'; ctx.fillRect(this.laneA - 30, 0, 60, 400);
      ctx.fillStyle = 'rgba(0, 136, 255, 0.1)'; ctx.fillRect(this.laneB - 30, 0, 60, 400);
      
      // ★ 魔法のタイル風 丸い判定枠（ターゲットリング）
      ctx.lineWidth = 3;
      ctx.strokeStyle = keys.a ? '#faa' : '#800';
      ctx.beginPath(); ctx.arc(this.laneA, this.lineY, 20, 0, Math.PI * 2); ctx.stroke();
      
      ctx.strokeStyle = keys.b ? '#aaf' : '#048';
      ctx.beginPath(); ctx.arc(this.laneB, this.lineY, 20, 0, Math.PI * 2); ctx.stroke();
      
      // ノーツの描画
      this.notes.forEach(n => {
        if (!n.hit && !n.missed && n.y > -20 && n.y < 420) {
          let nx = n.type === 'A' ? this.laneA : this.laneB;
          ctx.fillStyle = n.type === 'A' ? '#f00' : '#08f';
          ctx.beginPath(); ctx.arc(nx, n.y, 16, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(nx, n.y, 6, 0, Math.PI * 2); ctx.fill();
        }
      });
      drawParticles();
      
      // スコアとコンボ表示
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 10, 20);
      if (this.combo > 5) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 16px monospace'; ctx.fillText(`${this.combo} COMBO!`, 60, 40); }
      
      // 判定文字（叩いたレーンの上に表示される）
      for (let j of this.judgements) {
         ctx.fillStyle = j.color; ctx.font = 'bold 14px monospace'; ctx.globalAlpha = j.life / 30;
         let jx = (j.type === 'A' ? this.laneA : this.laneB) - (j.msg.length * 4);
         ctx.fillText(j.msg, jx, this.lineY - 30 - (30 - j.life)); ctx.globalAlpha = 1;
      }
      
      let now = audioCtx.currentTime - this.startTime;
      if (this.st === 'play' && now < 0) { 
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 150, 200, 60); 
          ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(Math.ceil(-now), 90, 190); 
      }
      
      // ★ 縦長画面用のシャッター演出
      let w = 0;
      if (this.st === 'loading') w = 100;
      else if (this.st === 'intro') w = 100 * (1 - Math.pow(Math.min(1, this.introTimer / 45), 2));
      
      if (w > 0) {
          ctx.fillStyle = '#222'; 
          ctx.fillRect(0, 0, w, 400); // 左扉
          ctx.fillRect(200 - w, 0, w, 400); // 右扉
          ctx.fillStyle = '#ff0'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0';
          ctx.fillRect(w - 2, 0, 4, 400); // 左の光る継ぎ目
          ctx.fillRect(200 - w - 2, 0, 4, 400); // 右の光る継ぎ目
          ctx.shadowBlur = 0;
          
          if (this.st === 'loading') {
              ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(20, 170, 160, 60);
              ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace'; ctx.fillText('ANALYZING DATA...', 45, 195);
              ctx.fillRect(50, 210, (Date.now() % 1000) / 1000 * 100, 5); 
          }
      }
    }
    else if (this.st === 'result') {
      // 縦長リザルト画面
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 100, 180, 200); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 100, 180, 200);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 35, 130);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 30, 170); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 30, 190);
      let rank = this.score > this.notes.length * 80 ? 'S' : this.score > this.notes.length * 50 ? 'A' : this.score > this.notes.length * 30 ? 'B' : 'C';
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 24px monospace'; ctx.fillText(`RANK: ${rank}`, 55, 230);
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('A / B: メニューへ', 50, 270);
    }
    resetShake();
  }
};
