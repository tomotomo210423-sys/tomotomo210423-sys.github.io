// === BEAT BROS - 4 LANES, DIRECT TOUCH & MECHANICAL TRANSFORM ===
const Rhythm = {
  st: 'menu', mode: 'normal', audioBuffer: null, source: null, startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], transformTimer: 0, pendingFile: null,
  touchBound: false,
  
  // 4レーンの定義（← ↓ ↑ →）
  arrows: ['←', '↓', '↑', '→'],
  colors: ['#f0f', '#0ff', '#0f0', '#f00'], // ピンク、水色、緑、赤
  lineY: 200, 
  
  init() {
    this.st = 'menu'; this.mode = 'normal';
    this.audioBuffer = null; if (this.source) { this.source.stop(); this.source.disconnect(); this.source = null; }
    
    // 筐体とCanvasを通常状態に戻す
    document.getElementById('gameboy').classList.remove('mode-wide');
    const cvs = document.getElementById('gameCanvas');
    cvs.width = 200; cvs.height = 300; 
    
    BGM.play('menu');
    this.showFileUI();
    
    // ★ 画面直接タップ用のイベントリスナーを1度だけ登録
    if (!this.touchBound) {
      this.touchBound = true;
      const handleHit = (e) => {
        if (activeApp !== this) return;
        if (this.st !== 'play' && this.st !== 'result') return;
        e.preventDefault(); // 画面スクロールを防ぐ
        
        const rect = cvs.getBoundingClientRect();
        let touches = e.type === 'mousedown' ? [e] : e.changedTouches;
        
        for(let i = 0; i < touches.length; i++) {
          let x = (touches[i].clientX - rect.left) / rect.width * cvs.width;
          let y = (touches[i].clientY - rect.top) / rect.height * cvs.height;
          
          // EXITボタン(左上)の判定
          if (y < 40 && x < 80) { this.exitGame(); return; }
          
          // 画面の下半分をタップしたらレーン判定
          if (this.st === 'play' && y > 100) {
             let lane = Math.floor(x / (cvs.width / 4)); // 画面を横に4等分
             if (lane >= 0 && lane <= 3) this.hitKey(lane);
          } else if (this.st === 'result') {
             this.exitGame();
          }
        }
      };
      cvs.addEventListener('touchstart', handleHit, {passive: false});
      cvs.addEventListener('mousedown', handleHit);
    }
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
        if (e.target.files[0]) { 
          initAudio(); this.hideFileUI(); 
          this.pendingFile = e.target.files[0];
          e.target.value = ''; 
          // ★ ガシャン！メカニカル変形開始（2秒間＝120フレーム）
          this.st = 'transform_in'; 
          this.transformTimer = 120; 
          document.getElementById('gameboy').classList.add('mode-wide'); 
          const cvs = document.getElementById('gameCanvas');
          cvs.width = 400; cvs.height = 260; // ワイド時の内部解像度
        }
      };
      label.appendChild(input); ui.appendChild(label);
      const container = document.getElementById('screen-container');
      if (container) container.appendChild(ui); else document.body.appendChild(ui);
    }
    ui.style.display = 'block';
  },
  
  hideFileUI() { let ui = document.getElementById('rhythm-file-ui'); if (ui) ui.style.display = 'none'; },
  
  // 終了して元に戻る変形
  exitGame() {
    this.st = 'transform_out'; 
    this.transformTimer = 120; // 2秒かけて戻る
    document.getElementById('gameboy').classList.remove('mode-wide');
    if (this.source) { this.source.stop(); this.source = null; }
  },
  
  loadFile(file) {
    this.st = 'loading'; BGM.stop();
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
          // ★ 4レーンにランダムまたはパターンで配置
          let lane = Math.floor(Math.random() * 4);
          this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false });
          lastTime = t;
        }
      }
    }
    this.startPlay();
  },
  
  startPlay() {
    this.st = 'intro'; this.transformTimer = 0; 
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
  
  // 判定処理（タッチでもキーボードでも呼ばれる）
  hitKey(lane) {
      if (this.st !== 'play') return;
      let now = audioCtx.currentTime - this.startTime;
      let hitNote = null, minDiff = 999;
      let cx = 50 + lane * 100; // 該当レーンのX座標 (50, 150, 250, 350)
      
      for (let n of this.notes) {
        if (!n.hit && !n.missed && n.lane === lane) {
          let diff = Math.abs(n.time - now);
          if (diff < 0.2 && diff < minDiff) { minDiff = diff; hitNote = n; }
        }
      }
      if (hitNote) {
        hitNote.hit = true; let msg = '', pts = 0;
        if (minDiff < 0.05) { msg = 'PERFECT'; pts = 100; addParticle(cx, this.lineY, '#ff0', 'explosion'); screenShake(4); }
        else if (minDiff < 0.1) { msg = 'GREAT'; pts = 50; addParticle(cx, this.lineY, this.colors[lane], 'star'); }
        else { msg = 'GOOD'; pts = 10; }
        this.combo++; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
        this.judgements.push({ msg: msg, life: 30, color: '#ff0', lane: lane });
        playSnd('hit');
      }
  },
  
  update() {
    if (this.st === 'menu') {
      if (keysDown.select) { this.hideFileUI(); switchApp(Menu); return; }
      if (keysDown.up || keysDown.down) { 
        if (this.mode === 'easy') this.mode = 'normal'; else if (this.mode === 'normal') this.mode = 'hard'; else this.mode = 'easy';
        playSnd('sel'); 
      }
    }
    else if (this.st === 'transform_in') {
      this.transformTimer--;
      if (this.transformTimer % 20 === 0) playSnd('hit'); // ガシャン！というメカ音
      if (this.transformTimer % 40 === 0) screenShake(5); 
      if (this.transformTimer <= 0) this.loadFile(this.pendingFile);
    }
    else if (this.st === 'transform_out') {
      this.transformTimer--;
      if (this.transformTimer % 20 === 0) playSnd('hit'); 
      if (this.transformTimer % 40 === 0) screenShake(5); 
      if (this.transformTimer <= 0) {
          const cvs = document.getElementById('gameCanvas');
          cvs.width = 200; cvs.height = 300; 
          switchApp(Menu);
      }
    }
    else if (this.st === 'intro') {
      this.transformTimer++;
      if (this.transformTimer === 45) { 
         this.st = 'play';
         this.startTime = audioCtx.currentTime + 1.5; 
         this.source.start(this.startTime);
      }
    }
    else if (this.st === 'play') {
      let now = audioCtx.currentTime - this.startTime;
      let speed = this.mode === 'hard' ? 250 : this.mode === 'normal' ? 180 : 120;
      
      // PC用の十字キー対応（← ↓ ↑ →）
      if (keysDown.left) this.hitKey(0);
      if (keysDown.down) this.hitKey(1);
      if (keysDown.up) this.hitKey(2);
      if (keysDown.right) this.hitKey(3);
      
      for (let n of this.notes) {
        if (!n.hit && !n.missed) {
          n.y = this.lineY - (n.time - now) * speed;
          if (n.y > 240) { 
            n.missed = true; this.combo = 0; 
            this.judgements.push({ msg: 'MISS', life: 30, color: '#f00', lane: n.lane }); screenShake(2); 
          }
        }
      }
      for (let i = this.judgements.length - 1; i >= 0; i--) { this.judgements[i].life--; if (this.judgements[i].life <= 0) this.judgements.splice(i, 1); }
    }
  },
  
  draw() {
    applyShake();
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
      ctx.fillStyle = '#0ff'; ctx.fillText('▼ 曲を選択してプレイ ▼', 25, 230);
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if (this.st === 'transform_in' || this.st === 'transform_out') {
      // 変形中のノイズ演出
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; 
      ctx.fillText('SYSTEM REBOOT...', cvs.width/2 - 80, cvs.height/2 + (Math.random()-0.5)*10);
      ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()*0.3})`; ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    else if (this.st === 'loading' || this.st === 'intro' || this.st === 'play' || this.st === 'result') {
      // プレイ画面 (400x260)
      
      // 背景エフェクト
      ctx.strokeStyle = '#121'; ctx.lineWidth = 1;
      for (let i = 0; i < 20; i++) { 
        ctx.beginPath(); ctx.moveTo(0, i * 20 + (Date.now() % 20)); ctx.lineTo(400, i * 20 + (Date.now() % 20)); ctx.stroke(); 
      }
      
      // レーンと判定枠の描画（← ↓ ↑ →）
      for (let i = 0; i < 4; i++) {
         let cx = 50 + i * 100;
         // レーン背景
         ctx.fillStyle = `rgba(255,255,255,0.03)`; ctx.fillRect(cx - 40, 0, 80, 260);
         
         // 丸い判定枠（ターゲット）
         ctx.strokeStyle = this.colors[i]; ctx.lineWidth = 3;
         ctx.beginPath(); ctx.arc(cx, this.lineY, 25, 0, Math.PI * 2); ctx.stroke();
         
         // 円の中の矢印
         ctx.fillStyle = this.colors[i]; ctx.font = 'bold 24px monospace';
         ctx.fillText(this.arrows[i], cx - 12, this.lineY + 8);
      }
      
      // ノーツの描画（丸の中に矢印）
      this.notes.forEach(n => {
        if (!n.hit && !n.missed && n.y > -30 && n.y < 260) {
          let cx = 50 + n.lane * 100;
          ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, n.y, 22, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(cx, n.y, 22, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = this.colors[n.lane]; ctx.font = 'bold 22px monospace';
          ctx.fillText(this.arrows[n.lane], cx - 11, n.y + 7);
        }
      });
      drawParticles();
      
      // スコア表示
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 10, 20);
      if (this.combo > 5) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 20px monospace'; ctx.fillText(`${this.combo} COMBO!`, 140, 30); }
      
      // 判定文字（各レーンの上に表示）
      for (let j of this.judgements) {
         ctx.fillStyle = j.color; ctx.font = 'bold 16px monospace'; ctx.globalAlpha = j.life / 30;
         let jx = (50 + j.lane * 100) - (j.msg.length * 4.5);
         ctx.fillText(j.msg, jx, this.lineY - 40 - (30 - j.life)); ctx.globalAlpha = 1;
      }
      
      // 退出ボタン（左上）
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(5, 5, 50, 25); ctx.strokeStyle = '#f00'; ctx.strokeRect(5, 5, 50, 25);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText('EXIT', 15, 23);
      
      // カウントダウン
      let now = audioCtx.currentTime - this.startTime;
      if (this.st === 'play' && now < 0) { 
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 400, 260); 
          ctx.fillStyle = '#ff0'; ctx.font = 'bold 40px monospace'; ctx.fillText(Math.ceil(-now), 180, 130); 
      }
      
      // シャッター演出
      let w = 0;
      if (this.st === 'loading') w = 200;
      else if (this.st === 'intro') w = 200 * (1 - Math.pow(Math.min(1, this.transformTimer / 45), 2));
      
      if (w > 0) {
          ctx.fillStyle = '#222'; ctx.fillRect(0, 0, w, 260); ctx.fillRect(400 - w, 0, w, 260);
          ctx.fillStyle = '#ff0'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0';
          ctx.fillRect(w - 2, 0, 4, 260); ctx.fillRect(400 - w - 2, 0, 4, 260); ctx.shadowBlur = 0;
          if (this.st === 'loading') {
              ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(100, 100, 200, 60);
              ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ANALYZING DATA...', 125, 125);
              ctx.fillRect(150, 140, (Date.now() % 1000) / 1000 * 100, 5); 
          }
      }

      // リザルト
      if (this.st === 'result') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(100, 40, 200, 180); ctx.strokeStyle = '#0f0'; ctx.strokeRect(100, 40, 200, 180);
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 130, 70);
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 120, 110); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 120, 130);
        let rank = this.score > this.notes.length * 80 ? 'S' : this.score > this.notes.length * 50 ? 'A' : this.score > this.notes.length * 30 ? 'B' : 'C';
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 155, 180);
        ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('左上の [EXIT] で戻る', 130, 205);
      }
    }
  }
};
