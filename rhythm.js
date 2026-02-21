// === BEAT BROS - HIT-STOP FREEZE & TOUCH FIX ===
const Rhythm = {
  st: 'menu', mode: 'normal', filterType: 0, settingsCur: 0,
  audioBuffer: null, source: null, startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], transformTimer: 0, pendingFile: null,
  touchBound: false, laneTouch: [false,false,false,false],
  arrows: ['←', '↓', '↑', '→'], colors: ['#f0f', '#0ff', '#0f0', '#f00'], lineY: 340, 

  // ★ 追加：ヒットストップ（ゲーム停止）を発生させない音ゲー専用のタップ音
  playTap(isPerfect) {
    if(!audioCtx) return;
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = isPerfect ? 'sine' : 'square';
    o.frequency.setValueAtTime(isPerfect ? 880 : 440, now);
    o.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    g.gain.setValueAtTime(isPerfect ? 0.15 : 0.05, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(now); o.stop(now + 0.1);
  },

  init() {
    this.st = 'menu'; this.mode = 'normal'; this.filterType = 0; this.settingsCur = 0;
    this.laneTouch = [false,false,false,false];
    this.audioBuffer = null; if(this.source){ this.source.stop(); this.source.disconnect(); this.source=null; }
    document.getElementById('gameboy').classList.remove('mode-tall');
    const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 300; 
    BGM.play('menu'); this.showFileUI();
    
    if(!this.touchBound) {
      this.touchBound = true;
      const tH = (e) => {
        if(activeApp !== this) return;
        if(this.st !== 'play' && this.st !== 'result') return;
        if(e.cancelable) e.preventDefault(); 
        
        const r = cvs.getBoundingClientRect();
        
        // ★修正：指が触れた瞬間(叩いた瞬間)だけを確実に判定し、滑りによる無反応を防ぐ
        if (e.type === 'touchstart' || e.type === 'mousedown') {
            let ts = e.type === 'mousedown' ? [e] : e.changedTouches;
            for(let i=0; i<ts.length; i++) {
                let x = (ts[i].clientX - r.left) / r.width * cvs.width;
                let y = (ts[i].clientY - r.top) / r.height * cvs.height;
                if(y < 40 && x < 60){ this.exitGame(); return; }
                if(this.st === 'result'){ this.exitGame(); return; }
                
                if(this.st === 'play' && y > 150) {
                    let l = Math.floor(x / (cvs.width / 4)); 
                    if(l >= 0 && l <= 3) this.hitKey(l);
                }
            }
        }
        
        // 押しっぱなし状態（レーンの発光演出用）の更新
        let activeTs = e.type.includes('mouse') ? (e.buttons > 0 ? [e] : []) : e.touches;
        let nT = [false,false,false,false];
        for(let i=0; i<activeTs.length; i++) {
            let x = (activeTs[i].clientX - r.left) / r.width * cvs.width;
            let y = (activeTs[i].clientY - r.top) / r.height * cvs.height;
            if(y > 150) {
                let l = Math.floor(x / (cvs.width / 4));
                if(l >= 0 && l <= 3) nT[l] = true;
            }
        }
        this.laneTouch = nT;
      };
      ['touchstart','touchmove','touchend','touchcancel','mousedown','mousemove','mouseup','mouseleave'].forEach(E => cvs.addEventListener(E, tH, {passive: false}));
    }
  },

  showFileUI() {
    let ui = document.getElementById('rhythm-file-ui');
    if(!ui) {
      ui = document.createElement('div'); ui.id = 'rhythm-file-ui';
      ui.style.position = 'absolute'; ui.style.bottom = '80px'; ui.style.left = '50%'; ui.style.transform = 'translateX(-50%)'; ui.style.zIndex = '100'; ui.style.textAlign = 'center'; ui.style.width = '100%';
      let label = document.createElement('label');
      label.style.display = 'inline-block'; label.style.background = '#ff0'; label.style.color = '#000'; label.style.padding = '10px 15px'; label.style.fontFamily = 'monospace'; label.style.fontWeight = 'bold'; label.style.fontSize = '12px'; label.style.borderRadius = '5px'; label.style.cursor = 'pointer'; label.style.border = '2px solid #fff'; label.style.boxShadow = '0 0 15px #ff0';
      label.innerHTML = '📁 曲ファイルを選ぶ';
      label.onclick = () => { initAudio(); }; label.ontouchstart = () => { initAudio(); };
      let input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*'; input.style.display = 'none';
      input.onchange = (e) => {
        if(e.target.files[0]) { 
          initAudio(); this.hideFileUI(); this.pendingFile = e.target.files[0]; e.target.value = ''; 
          this.st = 'settings'; this.settingsCur = 0; 
        }
      };
      label.appendChild(input); ui.appendChild(label);
      const container = document.getElementById('screen-container');
      if(container) container.appendChild(ui); else document.body.appendChild(ui);
    }
    ui.style.display = 'block';
  },
  
  hideFileUI() { let ui = document.getElementById('rhythm-file-ui'); if(ui) ui.style.display = 'none'; },
  
  exitGame() {
    this.st = 'transform_out'; this.transformTimer = 120; 
    document.getElementById('gameboy').classList.remove('mode-tall');
    if(this.source) { this.source.stop(); this.source = null; }
  },

  loadFile(file) {
    this.st = 'loading'; BGM.stop(); const reader = new FileReader();
    reader.onload = e => {
      audioCtx.decodeAudioData(e.target.result, buffer => {
        this.audioBuffer = buffer; this.generateNotes(buffer);
      }, err => { alert("解析エラー。別の曲を試してください。"); this.init(); });
    };
    reader.readAsArrayBuffer(file);
  },

  generateNotes(buffer) {
    const raw = buffer.getChannelData(0); this.notes = [];
    let sum = 0, count = 0;
    for(let i=0; i<raw.length; i+=1000){ sum+=Math.abs(raw[i]); count++; }
    let avgVol = sum / count;
    
    let threshold = avgVol * (this.mode === 'nightmare' ? 0.5 : this.mode === 'hard' ? 1.0 : this.mode === 'normal' ? 1.5 : 2.0);
    if(threshold < 0.01) threshold = 0.01;
    let minGap = this.mode === 'nightmare' ? 0.08 : this.mode === 'hard' ? 0.15 : this.mode === 'normal' ? 0.22 : 0.35;
    
    let lastTime = 0; let lastLane = -1;
    for(let i=0; i<raw.length; i+=256) {
      if(Math.abs(raw[i]) > threshold) {
        let t = i / buffer.sampleRate; 
        if(t - lastTime > minGap) {
          if (this.mode === 'nightmare') {
            let nCnt = Math.random() < 0.3 ? 3 : Math.random() < 0.6 ? 2 : 1;
            let lanes = [0,1,2,3].sort(()=>Math.random()-0.5).slice(0,nCnt);
            lanes.forEach(l => this.notes.push({ time: t + (Math.random()*0.05), lane: l, hit: false, y: -50, missed: false }));
          } else {
            let lane = Math.floor(Math.random() * 4);
            if(lane === lastLane && Math.random() < 0.6) lane = (lane + 1 + Math.floor(Math.random()*2)) % 4;
            this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false });
            lastLane = lane;
          }
          lastTime = t; 
        }
      }
    }
    
    if(this.notes.length < 10) {
       this.notes = []; lastTime = 0; lastLane = -1;
       for(let t=2; t<buffer.duration; t+=minGap*1.5) {
           let lane = Math.floor(Math.random() * 4);
           this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false });
           lastTime = t; 
       }
    }
    this.startPlay();
  },

  startPlay() {
    this.st = 'intro'; this.transformTimer = 0; 
    this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
    this.source = audioCtx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    
    if(this.filterType === 1) { // RADIO
        let filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 1.5;
        this.source.connect(filter); filter.connect(audioCtx.destination);
    } else if(this.filterType === 2) { // WATER
        let filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400;
        this.source.connect(filter); filter.connect(audioCtx.destination);
    } else if(this.filterType === 3) { // ECHO
        let delay = audioCtx.createDelay(); delay.delayTime.value = 0.35;
        let feedback = audioCtx.createGain(); feedback.gain.value = 0.3;
        delay.connect(feedback); feedback.connect(delay);
        this.source.connect(delay); delay.connect(audioCtx.destination);
        this.source.connect(audioCtx.destination);
    } else {
        this.source.connect(audioCtx.destination);
    }
    
    this.source.onended = () => { 
      this.st = 'result'; let finalScore = Math.floor(this.score);
      let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, nightmare:0};
      if(finalScore > (rData[this.mode]||0)){ rData[this.mode] = finalScore; SaveSys.data.rhythm = rData; SaveSys.save(); }
    }; 
  },

  hitKey(lane) {
      if(this.st !== 'play') return;
      let now = audioCtx.currentTime - this.startTime;
      let hitNote = null, minDiff = 999;
      
      for(let n of this.notes) {
        if(!n.hit && !n.missed && n.lane === lane) {
          let diff = Math.abs(n.time - now);
          if(diff < 0.3 && diff < minDiff){ minDiff = diff; hitNote = n; }
        }
      }
      if(hitNote) {
        hitNote.hit = true; let cx = 25 + lane * 50;
        let msg = '', pts = 0;
        if(minDiff < 0.10){ msg = 'PERFECT'; pts = 100; addParticle(cx, this.lineY, '#ff0', 'explosion'); screenShake(4); }
        else if(minDiff < 0.20){ msg = 'GREAT'; pts = 50; addParticle(cx, this.lineY, this.colors[lane], 'star'); }
        else { msg = 'GOOD'; pts = 10; }
        
        this.combo++; if(this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
        this.judgements.push({ msg: msg, life: 30, color: '#ff0', lane: lane }); 
        
        // ★修正：ヒットストップ(ゲームのフリーズ)を引き起こさない専用音を使用！
        this.playTap(minDiff < 0.10);
      }
  },

  update() {
    let kD = typeof keysDown !== 'undefined' ? keysDown : {};
    let k = typeof keys !== 'undefined' ? keys : {};
    
    if(this.st === 'menu') {
      if(kD.select){ this.hideFileUI(); switchApp(Menu); return; }
    }
    else if(this.st === 'settings') {
      if(kD.select){ this.st = 'menu'; this.showFileUI(); return; }
      if(kD.up){ this.settingsCur = (this.settingsCur + 2) % 3; playSnd('sel'); }
      if(kD.down){ this.settingsCur = (this.settingsCur + 1) % 3; playSnd('sel'); }
      
      if(this.settingsCur === 0) {
        let m = ['easy','normal','hard','nightmare'];
        if(kD.left) { this.mode = m[(m.indexOf(this.mode)+3)%4]; playSnd('sel'); }
        if(kD.right || kD.a) { this.mode = m[(m.indexOf(this.mode)+1)%4]; playSnd('sel'); }
      } else if(this.settingsCur === 1) { 
        if(kD.left) { this.filterType = (this.filterType + 3) % 4; playSnd('sel'); }
        if(kD.right || kD.a) { this.filterType = (this.filterType + 1) % 4; playSnd('sel'); }
      } else if(this.settingsCur === 2) {
        if(kD.a){ 
          playSnd('jmp'); 
          this.st = 'transform_in'; this.transformTimer = 120; 
          document.getElementById('gameboy').classList.add('mode-tall'); 
          const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 400; 
        }
      }
    }
    else if(this.st === 'transform_in') {
      this.transformTimer--;
      if(this.transformTimer % 20 === 0) playSnd('hit'); 
      if(this.transformTimer % 40 === 0) screenShake(5); 
      if(this.transformTimer <= 0) { this.loadFile(this.pendingFile); } 
    }
    else if(this.st === 'transform_out') {
      this.transformTimer--;
      if(this.transformTimer % 20 === 0) playSnd('hit'); 
      if(this.transformTimer % 40 === 0) screenShake(5); 
      if(this.transformTimer <= 0){ const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 300; switchApp(Menu); }
    }
    else if(this.st === 'intro') {
      this.transformTimer++;
      if(this.transformTimer === 60){ this.st = 'play'; this.startTime = audioCtx.currentTime + 1.5; this.source.start(this.startTime); }
    }
    else if(this.st === 'play') {
      let now = audioCtx.currentTime - this.startTime;
      let speed = this.mode === 'nightmare' ? 666 : this.mode === 'hard' ? 320 : this.mode === 'normal' ? 250 : 150;
      
      if(this.mode === 'nightmare' && this.source) {
          this.source.playbackRate.value = 1.0 + Math.sin(Date.now()/200)*0.3;
          screenShake(3);
      }

      if(kD.left || kD.l0) this.hitKey(0);
      if(kD.down || kD.l1) this.hitKey(1);
      if(kD.up   || kD.l2) this.hitKey(2);
      if(kD.right|| kD.l3) this.hitKey(3);
      
      for(let n of this.notes) {
        n.y = this.lineY - (n.time - now) * speed;
        if(!n.hit && !n.missed && n.y > 420) { 
           n.missed = true; this.combo = 0; 
           this.judgements.push({ msg: 'MISS', life: 30, color: '#f00', lane: n.lane }); screenShake(2); 
        }
      }
      for(let i = this.judgements.length - 1; i >= 0; i--){ this.judgements[i].life--; if(this.judgements[i].life <= 0) this.judgements.splice(i, 1); }
      if(typeof updateParticles === 'function') updateParticles();
    }
  },

  draw() {
    const cvs = document.getElementById('gameCanvas');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.save();
    
    if(this.mode === 'nightmare' && this.st === 'play') {
       ctx.translate(100, 200);
       ctx.rotate(Math.sin(Date.now()/300) * 0.1);
       ctx.translate(-100, -200);
    }
    
    if(typeof shakeTimer !== 'undefined' && shakeTimer > 0){ ctx.translate((Math.random()-0.5)*shakeTimer*2, (Math.random()-0.5)*shakeTimer*2); shakeTimer--; }
    
    if(this.st === 'menu') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('BEAT BROS', 60, 50);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('↑下のボタンで曲を選ぶ↑', 40, 80);
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if(this.st === 'settings') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('SYSTEM READY', 45, 50);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      
      let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, nightmare:0};
      let hi = rData[this.mode] || 0;
      
      ctx.fillStyle = this.settingsCur === 0 ? (this.mode === 'nightmare' ? '#f00' : '#ff0') : '#fff';
      ctx.fillText((this.settingsCur===0?'> ':'  ') + `MODE: ${this.mode.toUpperCase()}`, 30, 110);
      
      ctx.fillStyle = '#aaa'; ctx.font = '10px monospace';
      ctx.fillText(`  HI-SCORE: ${hi}`, 30, 125);
      
      ctx.font = '12px monospace';
      const filters = ['OFF', 'RADIO', 'WATER', 'ECHO'];
      ctx.fillStyle = this.settingsCur === 1 ? '#ff0' : '#fff';
      ctx.fillText((this.settingsCur===1?'> ':'  ') + `FILTER: ${filters[this.filterType]}`, 30, 160);
      
      ctx.fillStyle = this.settingsCur === 2 ? '#0f0' : '#fff';
      ctx.fillText((this.settingsCur===2?'> ':'  ') + `GAME START!`, 30, 210);
      
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('↑↓:選択 A/←→:変更  SEL:戻る', 25, 280);
    }
    else if(this.st === 'transform_in' || this.st === 'transform_out') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM REBOOT...', cvs.width/2 - 60, cvs.height/2 + (Math.random()-0.5)*10);
      ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()*0.3})`; ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    else if(this.st === 'loading' || this.st === 'intro' || this.st === 'play' || this.st === 'result') {
      ctx.strokeStyle = '#121'; ctx.lineWidth = 1;
      for(let i=0; i<30; i++){ ctx.beginPath(); ctx.moveTo(0, i*15 + (Date.now()%15)); ctx.lineTo(200, i*15 + (Date.now()%15)); ctx.stroke(); }
      
      let k = typeof keys !== 'undefined' ? keys : {};
      for(let i=0; i<4; i++) {
         let cx = 25 + i * 50;
         let isP = (i===0 && (k.left || k.l0 || this.laneTouch[0])) || (i===1 && (k.down || k.l1 || this.laneTouch[1])) || (i===2 && (k.up || k.l2 || this.laneTouch[2])) || (i===3 && (k.right || k.l3 || this.laneTouch[3]));
         
         ctx.fillStyle = isP ? `rgba(255,255,255,0.15)` : `rgba(255,255,255,0.03)`; ctx.fillRect(cx - 25, 0, 50, 400);
         ctx.strokeStyle = this.colors[i]; ctx.lineWidth = isP ? 4 : 2; ctx.beginPath(); ctx.arc(cx, this.lineY, 18, 0, Math.PI * 2); ctx.stroke();
         ctx.fillStyle = this.colors[i]; ctx.font = 'bold 18px monospace'; ctx.fillText(this.arrows[i], cx - 9, this.lineY + 6);
         ctx.fillStyle = isP ? '#fff' : '#666'; ctx.font = '10px monospace'; ctx.fillText(['[D]', '[F]', '[J]', '[K]'][i], cx - 9, this.lineY + 30);
      }
      
      this.notes.forEach(n => {
        if(!n.missed && !n.hit && n.y > -30 && n.y < 420) {
           let cx = 25 + n.lane * 50;
           ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, n.y, 16, 0, Math.PI * 2); ctx.fill();
           ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, n.y, 16, 0, Math.PI * 2); ctx.stroke();
           ctx.fillStyle = this.colors[n.lane]; ctx.font = 'bold 16px monospace'; ctx.fillText(this.arrows[n.lane], cx - 8, n.y + 5);
        }
      });
      drawParticles();
      
      if(this.mode === 'nightmare' && this.st === 'play' && Math.random() < 0.08) {
         ctx.fillStyle = ['rgba(255,0,0,0.5)', 'rgba(255,0,255,0.4)', 'rgba(255,255,0,0.3)'][Math.floor(Math.random()*3)];
         ctx.font = 'bold ' + (20 + Math.random()*40) + 'px monospace';
         ctx.fillText('ERROR', Math.random()*150, Math.random()*400);
         ctx.fillRect(0,0,200,400);
      }

      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 60, 20);
      if(this.combo > 5){ ctx.fillStyle = '#f0f'; ctx.font = 'bold 14px monospace'; ctx.fillText(`${this.combo} COMBO!`, 120, 30); }
      
      for(let j of this.judgements) {
         ctx.fillStyle = j.color; ctx.font = 'bold 12px monospace'; ctx.globalAlpha = j.life / 30;
         let jx = (25 + j.lane * 50) - (j.msg.length * 3.5); ctx.fillText(j.msg, jx, this.lineY - 30 - (30 - j.life)); ctx.globalAlpha = 1;
      }
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(5, 5, 40, 20); ctx.strokeStyle = '#f00'; ctx.strokeRect(5, 5, 40, 20);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('EXIT', 12, 18);
      
      let now = audioCtx.currentTime - this.startTime;
      if(this.st === 'play' && now < 0){ ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 200, 400); ctx.fillStyle = '#ff0'; ctx.font = 'bold 40px monospace'; ctx.fillText(Math.ceil(-now), 85, 200); }
      
      let h = 0;
      if(this.st === 'loading') h = 200;
      else if(this.st === 'intro') h = 200 * (1 - Math.pow(Math.min(1, this.transformTimer / 60), 2));
      
      if(h > 0) {
          ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, h); ctx.fillRect(0, 400 - h, 200, h);
          ctx.fillStyle = '#ff0'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0'; ctx.fillRect(0, h - 2, 200, 4); ctx.fillRect(0, 400 - h - 2, 200, 4); ctx.shadowBlur = 0;
          if(this.st === 'loading') {
              ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 170, 180, 60); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('ANALYZING DATA...', 25, 195); ctx.fillRect(50, 210, (Date.now()%1000)/1000*100, 5); 
          }
      }

      if(this.st === 'result') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 100, 180, 180); ctx.strokeStyle = '#f00'; ctx.strokeRect(10, 100, 180, 180);
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 30, 130);
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 25, 170); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 25, 190);
        let rank = this.score > this.notes.length * 80 ? 'S' : this.score > this.notes.length * 50 ? 'A' : this.score > this.notes.length * 30 ? 'B' : 'C';
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 50, 240);
        ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('左上の [EXIT] で戻る', 40, 265);
      }
    }
    ctx.restore();
  }
};
