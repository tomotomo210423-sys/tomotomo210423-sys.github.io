// === BEAT BROS - TRANSFORM & SHUTTER ANIMATION ===
const Rhythm = {
  st: 'menu', mode: 'normal', audioBuffer: null, source: null, startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], introTimer: 0,
  
  init() {
    this.st = 'menu'; this.mode = 'normal';
    this.audioBuffer = null; if (this.source) { this.source.stop(); this.source.disconnect(); this.source = null; }
    document.getElementById('gameboy').classList.remove('mode-rhythm'); // メニュー時は普通の筐体に戻す
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
    // ★ 筐体変形トリガー！ ガシャン！
    document.getElementById('gameboy').classList.add('mode-rhythm'); 
    playSnd('hit'); screenShake(10); // 変形の衝撃
    
    const reader = new FileReader();
    reader.onload = e => {
      audioCtx.decodeAudioData(e.target.result, buffer => {
        this.audioBuffer = buffer;
        this.generateNotes(buffer);
      }, err => { alert("このファイルは解析できませんでした。別の曲を試してください。"); this.init(); });
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
          if (this.mode === 'normal') type = Math.random() > 0.3 ? 'A' : 'B';
          if (this.mode === 'hard') type = Math.random() > 0.5 ? 'A' : 'B';
          this.notes.push({ time: t, type: type, hit: false, y: -50, missed: false });
          lastTime = t;
        }
      }
    }
    this.startPlay();
  },
  
  startPlay() {
    this.st = 'intro'; this.introTimer = 0; // ★ シャッターが開く演出状態へ
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
    this.source = audioCtx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(audioCtx.destination);
    
    this.source.onended = () => { 
      this.st = 'result'; 
      document.getElementById('gameboy').classList.remove('mode-rhythm'); // 終わったら元に戻す
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
       document.getElementById('gameboy').classList.remove('mode-rhythm'); // 戻る時に筐体を元に戻す
       if (this.source) { this.source.stop(); this.source = null; } 
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
      if (this.introTimer === 45) { // 45フレームかけてシャッターが開ききったら曲開始
         this.st = 'play';
         this.startTime = audioCtx.currentTime + 1.5; 
         this.source.start(this.startTime);
      }
    }
    else if (this.st === 'play') {
      let now = audioCtx.currentTime - this.startTime;
      let speed = this.mode === 'hard' ? 300 : this.mode === 'normal' ? 200 : 120;
      const lineY = 240; 
      
      const hitKey = (type) => {
        let hitNote = null, minDiff = 999;
        for (let n of this.notes) {
          if (!n.hit && !n.missed && n.type === type) {
            let diff = Math.abs(n.time - now);
            if (diff < 0.2 && diff < minDiff) { minDiff = diff; hitNote = n; }
          }
        }
        if (hitNote) {
          hitNote.hit = true; let msg = '', pts = 0;
          if (minDiff < 0.05) { msg = 'PERFECT'; pts = 100; addParticle(100, lineY, '#ff0', 'explosion'); screenShake(3); }
          else if (minDiff < 0.1) { msg = 'GREAT'; pts = 50; addParticle(100, lineY, '#0f0', 'star'); }
          else { msg = 'GOOD'; pts = 10; }
          this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
          this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
          this.judgements.push({ msg: msg, life: 30, color: '#ff0' });
          playSnd('hit');
        }
      };
      
      if (keysDown.a) hitKey('A');
      if (keysDown.b) hitKey('B');
      
      for (let n of this.notes) {
        if (!n.hit && !n.missed) {
          n.y = lineY - (n.time - now) * speed;
          if (n.y > 280) { 
            n.missed = true; this.combo = 0; 
            this.judgements.push({ msg: 'MISS', life: 30, color: '#f00' }); screenShake(2); 
          }
        }
      }
      for (let i = this.judgements.length - 1; i >= 0; i--) { this.judgements[i].life--; if (this.judgements[i].life <= 0) this.judgements.splice(i, 1); }
    }
    else if (this.st === 'result') { if (keysDown.a || keysDown.b) { this.init(); } }
  },
  
  draw() {
    applyShake();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    
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
      // メインのプレイ画面を描画
      this.drawPlayScreen();
      
      // ★ その上にシャッターを描画する演出
      let w = 0;
      if (this.st === 'loading') {
          w = 100; // 完全に閉まっている
      } else if (this.st === 'intro') {
          let openRate = Math.min(1, this.introTimer / 45);
          w = 100 * (1 - Math.pow(openRate, 2)); // イーズインで徐々に開く
      }
      
      if (w > 0) {
          ctx.fillStyle = '#222'; 
          ctx.fillRect(0, 0, w, 300); // 左の扉
          ctx.fillRect(200 - w, 0, w, 300); // 右の扉
          ctx.fillStyle = '#ff0'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0';
          ctx.fillRect(w - 2, 0, 4, 300); // 左扉の光る継ぎ目
          ctx.fillRect(200 - w - 2, 0, 4, 300); // 右扉の光る継ぎ目
          ctx.shadowBlur = 0;
          
          if (this.st === 'loading') {
              ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(20, 120, 160, 60);
              ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ANALYZING DATA...', 35, 145);
              ctx.fillRect(50, 160, (Date.now() % 1000) / 1000 * 100, 5); 
          }
      }
    }
    else if (this.st === 'result') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 50, 180, 200); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 50, 180, 200);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 35, 80);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 30, 120); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 30, 140);
      let rank = this.score > this.notes.length * 80 ? 'S' : this.score > this.notes.length * 50 ? 'A' : this.score > this.notes.length * 30 ? 'B' : 'C';
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 24px monospace'; ctx.fillText(`RANK: ${rank}`, 55, 180);
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('A / B: メニューへ', 50, 220);
    }
    resetShake();
  },
  
  // 描画処理が重なったのでプレイ画面だけ別関数に切り出し
  drawPlayScreen() {
      ctx.strokeStyle = '#030'; ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(0, i * 30 + (Date.now() % 30)); ctx.lineTo(200, i * 30 + (Date.now() % 30)); ctx.stroke(); }
      
      const lineY = 240;
      ctx.fillStyle = '#111'; ctx.fillRect(80, 0, 40, 300); ctx.strokeStyle = '#333'; ctx.strokeRect(80, 0, 40, 300);
      ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(70, lineY); ctx.lineTo(130, lineY); ctx.stroke();
      ctx.fillStyle = 'rgba(0,255,0,0.2)'; ctx.fillRect(80, lineY - 5, 40, 10);
      
      this.notes.forEach(n => {
        if (!n.hit && !n.missed && n.y > -10 && n.y < 310) {
          ctx.fillStyle = n.type === 'A' ? '#f00' : '#08f';
          ctx.beginPath(); ctx.arc(100, n.y, 8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(100, n.y, 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText(n.type, n.type === 'A' ? 65 : 125, n.y + 3);
        }
      });
      drawParticles();
      
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 5, 20);
      if (this.combo > 5) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 14px monospace'; ctx.fillText(`${this.combo} COMBO!`, 115, 40); }
      for (let j of this.judgements) {
         ctx.fillStyle = j.color; ctx.font = 'bold 14px monospace'; ctx.globalAlpha = j.life / 30;
         ctx.fillText(j.msg, 100 - j.msg.length * 4, lineY - 30 - (30 - j.life)); ctx.globalAlpha = 1;
      }
      
      let now = audioCtx.currentTime - this.startTime;
      if (this.st === 'play' && now < 0) { 
          ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 100, 200, 50); 
          ctx.fillStyle = '#ff0'; ctx.font = 'bold 20px monospace'; ctx.fillText(Math.ceil(-now), 95, 130); 
      }
  }
};
