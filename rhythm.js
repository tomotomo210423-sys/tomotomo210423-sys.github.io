// === BEAT BROS - V2: OVERDRIVE EDITION ===
// 演出強化(ビジュアライザ、レーン発光、カメラバウンス)＆ガチ機能(ハイスピ、同時押しライン、AUTO)搭載！

const Rhythm = {
  st: 'menu', mode: 'normal', filterType: 0, settingsCur: 0,
  speedMult: 1.0, autoPlay: false, // ★追加: ハイスピとオートプレイ
  analyser: null, dataArray: null, // ★追加: ビジュアライザ用
  audioBuffer: null, source: null, startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], transformTimer: 0, 
  pendingFile: null, playlist: [], trackIndex: 0, 
  isEndless: false, endlessBpm: 120, endlessBeat: 0, logicalBeatTime: 0, life: 5, finalTime: 0,
  touchBound: false, laneTouch: [false,false,false,false], laneFlash: [0,0,0,0], // ★追加: レーン発光
  arrows: ['←', '↓', '↑', '→'], colors: ['#f0f', '#0ff', '#0f0', '#f00'], lineY: 340, 
  video: null, isVideo: false,

  init() {
    this.st = 'menu'; this.mode = 'normal'; this.filterType = 0; this.settingsCur = 0;
    this.speedMult = 1.0; this.autoPlay = false;
    this.laneTouch = [false,false,false,false]; this.laneFlash = [0,0,0,0];
    this.audioBuffer = null; this.playlist = []; this.trackIndex = 0;
    if(this.source){ this.source.stop(); this.source.disconnect(); this.source=null; }
    if(this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); this.video = null; }
    this.isVideo = false;

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
        if (e.type === 'touchstart' || e.type === 'mousedown') {
            let ts = e.type === 'mousedown' ? [e] : e.changedTouches;
            for(let i=0; i<ts.length; i++) {
                let x = (ts[i].clientX - r.left) / r.width * cvs.width;
                let y = (ts[i].clientY - r.top) / r.height * cvs.height;
                if(y < 40 && x < 60){ this.exitGame(); return; }
                if(this.st === 'result'){ this.exitGame(); return; }
            }
        }
        if (this.st === 'play' && !this.autoPlay) {
            let activeTs = e.type.includes('mouse') ? (e.buttons > 0 ? [e] : []) : e.touches;
            let nT = [false,false,false,false];
            for(let i=0; i<activeTs.length; i++) {
                let x = (activeTs[i].clientX - r.left) / r.width * cvs.width;
                let y = (activeTs[i].clientY - r.top) / r.height * cvs.height;
                if(y > 100) { let l = Math.floor(x / (cvs.width / 4)); if(l >= 0 && l <= 3) nT[l] = true; }
            }
            for(let l=0; l<4; l++) { if(nT[l] && !this.laneTouch[l]) { this.hitKey(l); } }
            this.laneTouch = nT;
        }
      };
      ['touchstart','touchmove','touchend','touchcancel','mousedown','mousemove','mouseup','mouseleave'].forEach(E => cvs.addEventListener(E, tH, {passive: false}));
    }
  },

  showFileUI() {
    let ui = document.getElementById('rhythm-file-ui');
    if(!ui) {
      ui = document.createElement('div'); ui.id = 'rhythm-file-ui';
      ui.style.position = 'absolute'; ui.style.bottom = '40px'; ui.style.left = '50%'; ui.style.transform = 'translateX(-50%)'; ui.style.zIndex = '100'; ui.style.textAlign = 'center'; ui.style.width = '100%';
      
      let label = document.createElement('label');
      label.style.display = 'inline-block'; label.style.background = '#ff0'; label.style.color = '#000'; label.style.padding = '10px 15px'; label.style.fontFamily = 'monospace'; label.style.fontWeight = 'bold'; label.style.fontSize = '12px'; label.style.borderRadius = '5px'; label.style.cursor = 'pointer'; label.style.border = '2px solid #fff'; label.style.boxShadow = '0 0 15px #ff0'; label.style.marginBottom = '15px';
      label.innerHTML = '📁 曲・動画を選ぶ(複数可)';
      
      let input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*, video/*'; input.multiple = true; input.style.display = 'none'; 
      label.onclick = () => { initAudio(); }; label.ontouchstart = () => { initAudio(); };
      
      input.onchange = (e) => {
        if(e.target.files.length > 0) { 
          initAudio(); this.hideFileUI(); 
          this.playlist = Array.from(e.target.files); this.trackIndex = 0;
          this.pendingFile = this.playlist[0]; this.isEndless = false;
          e.target.value = ''; this.st = 'settings'; this.settingsCur = 0; 
        }
      };
      label.appendChild(input); ui.appendChild(label);
      
      ui.appendChild(document.createElement('br'));
      let btnEndless = document.createElement('div');
      btnEndless.style.display = 'inline-block'; btnEndless.style.background = '#f00'; btnEndless.style.color = '#fff'; btnEndless.style.padding = '10px 15px'; btnEndless.style.fontFamily = 'monospace'; btnEndless.style.fontWeight = 'bold'; btnEndless.style.fontSize = '12px'; btnEndless.style.borderRadius = '5px'; btnEndless.style.cursor = 'pointer'; btnEndless.style.border = '2px solid #fff'; btnEndless.style.boxShadow = '0 0 15px #f00';
      btnEndless.innerHTML = '💀 ENDLESS SURVIVAL';
      const startEndless = (e) => { if(e) e.preventDefault(); initAudio(); this.hideFileUI(); this.isEndless = true; this.st = 'settings'; this.settingsCur = 0; };
      btnEndless.onclick = startEndless; btnEndless.ontouchstart = startEndless;
      ui.appendChild(btnEndless);

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
    if(this.video) { this.video.pause(); }
  },

  loadFile(file) {
    this.st = 'loading'; BGM.stop(); 
    if(!file) return;
    this.isVideo = file.type.startsWith('video/');
    if (this.isVideo) {
      if(this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); }
      this.video = document.createElement('video');
      this.video.src = URL.createObjectURL(file);
      this.video.muted = true; this.video.playsInline = true; this.video.load();
    }
    const reader = new FileReader();
    reader.onload = e => {
      audioCtx.decodeAudioData(e.target.result, buffer => {
        this.audioBuffer = buffer; this.generateNotes(buffer);
      }, err => { alert("解析エラー。次の曲へ進みます。"); this.handleTrackEnd(); });
    };
    reader.readAsArrayBuffer(file);
  },

  generateNotes(buffer) {
    const raw = buffer.getChannelData(0); this.notes = [];
    let sum = 0, count = 0; for(let i=0; i<raw.length; i+=1000){ sum+=Math.abs(raw[i]); count++; }
    let avgVol = sum / count;
    let threshold = avgVol * (this.mode === 'nightmare' ? 0.5 : this.mode === 'hard' ? 1.0 : this.mode === 'normal' ? 1.5 : 2.0);
    if(threshold < 0.01) threshold = 0.01;
    let minGap = this.mode === 'nightmare' ? 0.08 : this.mode === 'hard' ? 0.15 : this.mode === 'normal' ? 0.22 : 0.35;
    let lastTime = 0, lastLane = -1;
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
            this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false }); lastLane = lane;
          }
          lastTime = t; 
        }
      }
    }
    // ノーツが少なすぎる場合の保険
    if(this.notes.length < 10) {
       this.notes = []; lastTime = 0; lastLane = -1;
       for(let t=2; t<buffer.duration; t+=minGap*1.5) { let lane = Math.floor(Math.random() * 4); this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false }); }
    }
    // ★ 追加：同時押しラインを描くために時間でソートしておく
    this.notes.sort((a,b) => a.time - b.time);
    this.startPlay();
  },

  startPlay() {
    this.st = 'intro'; this.transformTimer = 0; 
    
    if(this.trackIndex === 0 || this.isEndless) {
       this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
    }

    // ★ WebAudio API AnalyserNode のセットアップ (ビジュアライザ用)
    if (!this.analyser) {
        this.analyser = audioCtx.createAnalyser();
        this.analyser.fftSize = 128;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.connect(audioCtx.destination);
    }
    
    if(this.isEndless) {
       BGM.stop(); this.notes = [];
       this.life = 5; this.endlessBpm = 120;
       this.endlessBeat = 0; this.logicalBeatTime = 0; this.finalTime = 0;
       this.startTime = audioCtx.currentTime + 1.5;
       return;
    }

    this.source = audioCtx.createBufferSource(); this.source.buffer = this.audioBuffer;
    let lastNode = this.source;

    // フィルターを通した音をAnalyserに繋ぐ
    if(this.filterType === 1) { let filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 1.5; lastNode.connect(filter); lastNode = filter; } 
    else if(this.filterType === 2) { let filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400; lastNode.connect(filter); lastNode = filter; } 
    else if(this.filterType === 3) { let delay = audioCtx.createDelay(); delay.delayTime.value = 0.35; let feedback = audioCtx.createGain(); feedback.gain.value = 0.3; delay.connect(feedback); feedback.connect(delay); lastNode.connect(delay); lastNode.connect(this.analyser); lastNode = delay; } 
    
    lastNode.connect(this.analyser);
    this.source.onended = () => { this.handleTrackEnd(); }; 
  },

  handleTrackEnd() {
    if(this.video) { this.video.pause(); }
    if(this.isEndless) return;
    
    if(this.trackIndex < this.playlist.length - 1) {
       this.st = 'intermission'; this.transformTimer = 180; 
    } else {
       this.st = 'result'; let finalScore = Math.floor(this.score);
       // ★ AUTO PLAY時はスコアを保存しない！
       if (!this.autoPlay) {
           let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, nightmare:0};
           if(finalScore > (rData[this.mode]||0)){ rData[this.mode] = finalScore; SaveSys.data.rhythm = rData; SaveSys.save(); }
           SaveSys.addLog('BEAT BROS', `${this.playlist.length > 1 ? 'メドレー' : this.mode.toUpperCase()} で スコア${finalScore}`);
       } else {
           SaveSys.addLog('BEAT BROS', `AUTO PLAY でライブ鑑賞をした！`);
       }
    }
  },

  scheduleEndless(now) {
    if (!this.isEndless || this.st !== 'play' || this.life <= 0) return;
    
    while(this.logicalBeatTime < now + 2.0) { 
      let targetRealTime = this.startTime + this.logicalBeatTime;
      let elapsed = targetRealTime - this.startTime;
      if (elapsed < 0) elapsed = 0;
      let difficulty = Math.min(elapsed / 300, 1.0);
      
      this.endlessBpm = 120 + difficulty * 60; 
      let stepLen = 60 / this.endlessBpm / 2;  
      
      const playOsci = (f, type, dur, vol) => {
        let o = audioCtx.createOscillator(); let g = audioCtx.createGain(); o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, targetRealTime); g.gain.exponentialRampToValueAtTime(0.001, targetRealTime + dur);
        o.connect(g); g.connect(this.analyser); o.start(targetRealTime); o.stop(targetRealTime + dur + 0.1);
      };
      const playNoise = (dur, vol) => {
        if(!noiseBuffer) return;
        let s = audioCtx.createBufferSource(); let g = audioCtx.createGain(); s.buffer = noiseBuffer;
        g.gain.setValueAtTime(vol, targetRealTime); g.gain.exponentialRampToValueAtTime(0.001, targetRealTime + dur);
        s.connect(g); g.connect(this.analyser); s.start(targetRealTime); s.stop(targetRealTime + dur + 0.1);
      };
      
      const chordProgressions = [
        [ [440,523,659], [349,440,523], [261,329,392], [392,493,587] ], 
        [ [261,329,392], [392,493,587], [440,523,659], [349,440,523] ], 
        [ [349,440,523], [329,392,493], [440,523,659], [440,523,659] ]
      ];
      let progIdx = Math.floor(this.endlessBeat / 32) % chordProgressions.length; 
      let chords = chordProgressions[progIdx];
      let chord = chords[Math.floor(this.endlessBeat / 8) % 4]; 
      
      let bt = this.endlessBeat % 8; 

      if (bt % 2 === 0) playOsci(100, 'sine', 0.1, 0.1); 
      if (bt === 2 || bt === 6) playNoise(0.1, 0.05); 
      let hhFreq = difficulty > 0.6 ? 1 : 2; 
      if (this.endlessBeat % hhFreq === (hhFreq === 2 ? 1 : 0)) playNoise(0.05, 0.02);
      
      let waveType = difficulty > 0.7 ? 'sawtooth' : difficulty > 0.4 ? 'square' : 'sine';
      if (Math.random() < 0.6) {
         let note = chord[Math.floor(Math.random() * chord.length)];
         if(difficulty > 0.5 && Math.random() < 0.3) note *= 2.0; 
         playOsci(note * (difficulty > 0.8 ? 2 : 1), waveType, 0.1, 0.03);
      }

      let spawnProb = 0.25 + (difficulty * 0.55); 
      if (bt % 2 !== 0) spawnProb *= 0.5; 

      if (Math.random() < spawnProb) {
         let laneCount = 1;
         if (difficulty > 0.4 && Math.random() < difficulty * 0.5) laneCount = 2; 
         let lanes = [0,1,2,3].sort(()=>Math.random()-0.5).slice(0,laneCount);
         lanes.forEach(l => {
            let n = { time: this.logicalBeatTime, lane: l, hit: false, y: -50, missed: false };
            if (elapsed > 240 && Math.random() < 0.15) n.curve = true; 
            if (elapsed > 270 && Math.random() < 0.1) n.accel = true;  
            this.notes.push(n);
         });
      }
      this.endlessBeat++;
      this.logicalBeatTime += stepLen;
    }
    if (this.notes.length > 100) this.notes = this.notes.filter(n => !n.hit && !n.missed && n.y < 500);
  },

  hitKey(lane) {
      if(this.st !== 'play' || this.autoPlay) return;
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
        if(minDiff < 0.10){ msg = 'PERFECT'; pts = 100; addParticle(cx, this.lineY, '#ff0', 'explosion'); this.laneFlash[lane] = 1.0; }
        else if(minDiff < 0.20){ msg = 'GREAT'; pts = 50; addParticle(cx, this.lineY, this.colors[lane], 'star'); this.laneFlash[lane] = 0.7; }
        else { msg = 'GOOD'; pts = 10; this.laneFlash[lane] = 0.4; }
        
        this.combo++; if(this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
        this.judgements.push({ msg: msg, life: 30, color: '#ff0', lane: lane }); 
      }
  },

  update() {
    let kD = typeof keysDown !== 'undefined' ? keysDown : {};
    let k = typeof keys !== 'undefined' ? keys : {};
    
    // レーン発光の減衰
    for(let i=0; i<4; i++) {
        if(this.laneFlash[i] > 0) this.laneFlash[i] -= 0.05;
    }

    if(this.st === 'menu') {
      if(kD.select){ this.hideFileUI(); switchApp(Menu); return; }
    }
    else if(this.st === 'settings') {
      if(kD.select){ this.st = 'menu'; this.showFileUI(); return; }
      if(kD.up){ this.settingsCur = (this.settingsCur + 4) % 5; playSnd('sel'); }
      if(kD.down){ this.settingsCur = (this.settingsCur + 1) % 5; playSnd('sel'); }
      
      if(this.settingsCur === 0) { // MODE
        let m = ['easy','normal','hard','nightmare'];
        if(kD.left) { this.mode = m[(m.indexOf(this.mode)+3)%4]; playSnd('sel'); }
        if(kD.right || kD.a) { this.mode = m[(m.indexOf(this.mode)+1)%4]; playSnd('sel'); }
      } 
      else if(this.settingsCur === 1) { // ★追加: SPEED (ハイスピ)
        let spds = [1.0, 1.5, 2.0, 2.5, 3.0];
        if(kD.left) { this.speedMult = spds[(spds.indexOf(this.speedMult)+4)%5]; playSnd('sel'); }
        if(kD.right || kD.a) { this.speedMult = spds[(spds.indexOf(this.speedMult)+1)%5]; playSnd('sel'); }
      }
      else if(this.settingsCur === 2) { // ★追加: AUTO PLAY
        if(kD.left || kD.right || kD.a) { this.autoPlay = !this.autoPlay; playSnd('sel'); }
      }
      else if(this.settingsCur === 3) { // FILTER
        if(kD.left) { this.filterType = (this.filterType + 3) % 4; playSnd('sel'); }
        if(kD.right || kD.a) { this.filterType = (this.filterType + 1) % 4; playSnd('sel'); }
      } 
      else if(this.settingsCur === 4) { // START
        if(kD.a){ 
          playSnd('jmp'); this.st = 'transform_in'; this.transformTimer = 120; 
          document.getElementById('gameboy').classList.add('mode-tall'); 
          const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 400; 
        }
      }
    }
    else if(this.st === 'transform_in') {
      this.transformTimer--;
      if(this.transformTimer % 20 === 0) playSnd('hit'); 
      if(this.transformTimer % 40 === 0) screenShake(5); 
      if(this.transformTimer <= 0) { 
          if(this.isEndless) this.startPlay();
          else this.loadFile(this.pendingFile); 
      } 
    }
    else if(this.st === 'transform_out') {
      this.transformTimer--;
      if(this.transformTimer % 20 === 0) playSnd('hit'); 
      if(this.transformTimer % 40 === 0) screenShake(5); 
      if(this.transformTimer <= 0){ const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 300; switchApp(Menu); }
    }
    else if(this.st === 'intermission') { 
      this.transformTimer--;
      if(this.transformTimer <= 0) {
          this.trackIndex++;
          this.pendingFile = this.playlist[this.trackIndex];
          this.loadFile(this.pendingFile);
      }
    }
    else if(this.st === 'intro') {
      this.transformTimer++;
      if(this.transformTimer === 60){ 
        this.st = 'play'; 
        if(!this.isEndless) {
           this.startTime = audioCtx.currentTime + 1.5; 
           this.source.start(this.startTime); 
           if(this.video) { this.video.currentTime = 0; setTimeout(() => { this.video.play().catch(e=>console.log("AutoPlay", e)); }, 1500); }
        }
      }
    }
    else if(this.st === 'play') {
      let now = audioCtx.currentTime - this.startTime;
      let baseSpeed = 150;
      
      if(this.isEndless) {
          this.scheduleEndless(now);
          let diff = Math.min(Math.max(now, 0) / 300, 1.0);
          baseSpeed = 150 + (diff * 200);
      } else {
          baseSpeed = (this.mode === 'nightmare' ? 666 : this.mode === 'hard' ? 320 : this.mode === 'normal' ? 250 : 150);
          if(this.mode === 'nightmare' && this.source) this.source.playbackRate.value = 1.0 + Math.sin(Date.now()/200)*0.3;
      }

      // ★ ハイスピを適用
      let speed = baseSpeed * this.speedMult;

      if(!this.autoPlay) {
          if(kD.left || kD.l0) this.hitKey(0); if(kD.down || kD.l1) this.hitKey(1); if(kD.up || kD.l2) this.hitKey(2); if(kD.right|| kD.l3) this.hitKey(3);
      }

      for(let n of this.notes) {
        let tDiff = n.time - now;
        
        if(n.accel && tDiff > 0) n.y = this.lineY - (tDiff * tDiff) * (speed / 1.5); 
        else n.y = this.lineY - tDiff * speed;
        
        // ★ オートプレイの自動HIT処理
        if(this.autoPlay && !n.hit && !n.missed && tDiff <= 0.02) {
            n.hit = true;
            let cx = 25 + n.lane * 50;
            addParticle(cx, this.lineY, '#0ff', 'explosion');
            this.combo++; if(this.combo > this.maxCombo) this.maxCombo = this.combo;
            this.score += 100 * (1 + Math.floor(this.combo / 10) * 0.1);
            this.judgements.push({ msg: 'AUTO', life: 20, color: '#0ff', lane: n.lane });
            this.laneFlash[n.lane] = 1.0;
        }

        if(!n.hit && !n.missed && n.y > 420) { 
           n.missed = true; this.combo = 0; 
           this.judgements.push({ msg: 'MISS', life: 30, color: '#f00', lane: n.lane }); 
           
           if(this.isEndless && !this.autoPlay) {
               this.life--; playSnd('hit'); screenShake(5);
               if(this.life <= 0) { 
                   this.st = 'result'; this.finalTime = Math.max(0, now);
                   let tStr = Math.floor(this.finalTime / 60) + ":" + String(Math.floor(this.finalTime % 60)).padStart(2, '0');
                   SaveSys.addLog('BEAT BROS', `ENDLESSで ${tStr} 生き残った`); 
               }
           }
        }
      }
      for(let i = this.judgements.length - 1; i >= 0; i--){ this.judgements[i].life--; if(this.judgements[i].life <= 0) this.judgements.splice(i, 1); }
      if(typeof updateParticles === 'function') updateParticles();
    }
  },

  draw() {
    const cvs = document.getElementById('gameCanvas');
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cvs.width, cvs.height);
    
    let now = audioCtx.currentTime - this.startTime;

    // MV描画処理
    if (this.st === 'play' && this.video && !this.video.paused && !this.video.ended) {
        try { 
            let vw = this.video.videoWidth; let vh = this.video.videoHeight;
            if (vw > 0 && vh > 0) {
                let drawW = cvs.width; let drawH = vh * (cvs.width / vw);
                let drawY = (cvs.height - drawH) / 2; 
                ctx.drawImage(this.video, 0, drawY, drawW, drawH);
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; ctx.fillRect(0, 0, cvs.width, cvs.height); 
        } catch(e) {} 
    }
    
    // ★ リアルタイム・ビジュアライザ描画
    if (this.analyser && (this.st === 'play' || this.st === 'result') && (!this.video || this.video.paused || this.video.ended)) {
        this.analyser.getByteFrequencyData(this.dataArray);
        let barW = cvs.width / 32; 
        for (let i = 0; i < 32; i++) {
            let barH = (this.dataArray[i] / 255) * 100; // 最大100px
            ctx.fillStyle = `rgba(0, 255, 255, ${Math.max(0.1, barH/100 * 0.7)})`;
            ctx.fillRect(i * barW, cvs.height - barH, barW - 1, barH);
        }
    }

    if (this.isEndless && this.st === 'play') {
       let elapsed = Math.max(now, 0); let diff = Math.min(elapsed / 300, 1.0);
       let r = Math.floor(diff * 80); let b = Math.floor((1 - diff) * 80);
       ctx.fillStyle = `rgba(${r}, 0, ${b}, 0.6)`; ctx.fillRect(0,0,200,400);

       if (elapsed >= 300) {
           ctx.translate(100, 200); ctx.rotate(Math.sin(Date.now()/400) * 0.15); ctx.translate(-100, -200);
           if(Math.random() < 0.3) {
               ctx.fillStyle = ['rgba(255,0,0,0.5)', 'rgba(0,255,0,0.5)', 'rgba(0,0,255,0.5)'][Math.floor(Math.random()*3)];
               ctx.fillRect(Math.random()*200, Math.random()*300, Math.random()*100, Math.random()*50);
           }
           if(Math.random() < 0.1) {
               ctx.fillStyle = '#f0f'; ctx.font = 'bold 30px monospace'; ctx.fillText('WARNING', Math.random()*50, Math.random()*400);
           }
       }
    }

    ctx.save();
    
    // ★ グルーヴ・カメラワーク（低音に合わせて画面がバウンス）
    if (this.analyser && this.st === 'play') {
        let bass = (this.dataArray[0] + this.dataArray[1] + this.dataArray[2] + this.dataArray[3]) / 4;
        if(bass > 180) {
            let bounce = ((bass - 180) / 75) * 0.05; // 0 ~ 0.05
            ctx.translate(cvs.width/2, cvs.height/2);
            ctx.scale(1 + bounce, 1 + bounce);
            ctx.translate(-cvs.width/2, -cvs.height/2);
        }
    }
    
    if(this.mode === 'nightmare' && this.st === 'play') { ctx.translate(100, 200); ctx.rotate(Math.sin(Date.now()/300) * 0.1); ctx.translate(-100, -200); }
    if(typeof shakeTimer !== 'undefined' && shakeTimer > 0){ ctx.translate((Math.random()-0.5)*shakeTimer*2, (Math.random()-0.5)*shakeTimer*2); shakeTimer--; }
    
    if(this.st === 'menu') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('BEAT BROS', 60, 50);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('↑下のボタンで選ぶ↑', 50, 80);
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if(this.st === 'settings') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('SYSTEM READY', 45, 50);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      
      if(this.isEndless) {
         ctx.fillText('MODE: ENDLESS TIME SURVIVAL', 5, 110);
         ctx.fillStyle = '#f00'; ctx.fillText('⚠ DANGER ⚠', 60, 140);
      } else {
         let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, nightmare:0};
         ctx.fillStyle = this.settingsCur === 0 ? (this.mode === 'nightmare' ? '#f00' : '#ff0') : '#fff';
         ctx.fillText((this.settingsCur===0?'> ':'  ') + `MODE: ${this.mode.toUpperCase()}`, 20, 110);
         ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText(`  HI-SCORE: ${rData[this.mode]||0}`, 20, 125);
      }
      
      ctx.font = '12px monospace';
      ctx.fillStyle = this.settingsCur === 1 ? '#ff0' : '#fff'; 
      ctx.fillText((this.settingsCur===1?'> ':'  ') + `SPEED: x${this.speedMult.toFixed(1)}`, 20, 145);
      
      ctx.fillStyle = this.settingsCur === 2 ? '#ff0' : '#fff'; 
      ctx.fillText((this.settingsCur===2?'> ':'  ') + `AUTO: ${this.autoPlay ? 'ON' : 'OFF'}`, 20, 165);

      const filters = ['OFF', 'RADIO', 'WATER', 'ECHO'];
      ctx.fillStyle = this.settingsCur === 3 ? '#ff0' : '#fff'; 
      ctx.fillText((this.settingsCur===3?'> ':'  ') + `FILTER: ${filters[this.filterType]}`, 20, 185);

      ctx.fillStyle = this.settingsCur === 4 ? '#0f0' : '#fff'; 
      ctx.fillText((this.settingsCur===4?'> ':'  ') + `GAME START!`, 20, 220);

      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('↑↓:選択 A/←→:変更  SEL:戻る', 25, 280);
    }
    else if(this.st === 'transform_in' || this.st === 'transform_out') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM REBOOT...', cvs.width/2 - 60, cvs.height/2 + (Math.random()-0.5)*10);
      ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()*0.3})`; ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    else if(this.st === 'intermission') { 
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText(`TRACK ${this.trackIndex} CLEARED!`, 30, 150);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('NEXT TRACK LOADING...', 30, 180);
    }
    else if(this.st === 'loading' || this.st === 'intro' || this.st === 'play' || this.st === 'result') {
      ctx.strokeStyle = (this.st === 'play' && this.video && !this.video.paused) ? 'rgba(17, 34, 17, 0.3)' : '#121'; 
      ctx.lineWidth = 1; for(let i=0; i<30; i++){ ctx.beginPath(); ctx.moveTo(0, i*15 + (Date.now()%15)); ctx.lineTo(200, i*15 + (Date.now()%15)); ctx.stroke(); }
      
      // ★ リアルタイム・ランクゲージ (AUTO PLAY時は専用表示)
      ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 180, 6);
      if (this.autoPlay) {
          ctx.fillStyle = '#0ff'; ctx.font = 'bold 10px monospace'; ctx.fillText('AUTO PLAY (NO RECORD)', 35, 22);
      } else if (this.st === 'play') {
          let passedNotes = this.notes.filter(n => n.time < now + 0.5).length;
          let expectedScore = Math.max(1, passedNotes * 100);
          let ratio = Math.min(1.0, this.score / expectedScore);
          let grad = ctx.createLinearGradient(10, 0, 190, 0);
          grad.addColorStop(0, '#f00'); grad.addColorStop(0.5, '#ff0'); grad.addColorStop(1, '#0f0');
          ctx.fillStyle = grad; ctx.fillRect(10, 5, 180 * ratio, 6);
      }
      ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 5, 180, 6);

      let k = typeof keys !== 'undefined' ? keys : {};
      
      // ★ レーン描画＆発光エフェクト
      for(let i=0; i<4; i++) {
         let cx = 25 + i * 50; 
         let isP = (i===0 && (k.left || k.l0 || this.laneTouch[0])) || (i===1 && (k.down || k.l1 || this.laneTouch[1])) || (i===2 && (k.up || k.l2 || this.laneTouch[2])) || (i===3 && (k.right || k.l3 || this.laneTouch[3]));
         if(isP && !this.autoPlay) this.laneFlash[i] = 0.5; // キーを押している間も光る
         
         let alpha = Math.max(0, this.laneFlash[i]);
         
         // レーングラデーション発光
         let grad = ctx.createLinearGradient(0, this.lineY, 0, 0);
         grad.addColorStop(0, `rgba(255,255,255,${alpha * 0.6})`);
         grad.addColorStop(1, `rgba(255,255,255,0)`);
         ctx.fillStyle = grad; 
         ctx.fillRect(cx - 24, 0, 48, this.lineY + 20);

         // 通常の薄いレーン背景
         ctx.fillStyle = `rgba(255,255,255,0.03)`; ctx.fillRect(cx - 25, 0, 50, 400);
         
         ctx.strokeStyle = this.colors[i]; ctx.lineWidth = isP ? 4 : 2; 
         ctx.beginPath(); ctx.arc(cx, this.lineY, 18 + (alpha * 5), 0, Math.PI * 2); ctx.stroke();
         ctx.fillStyle = this.colors[i]; ctx.font = 'bold 18px monospace'; ctx.fillText(this.arrows[i], cx - 9, this.lineY + 6);
         ctx.fillStyle = isP ? '#fff' : '#666'; ctx.font = '10px monospace'; ctx.fillText(['[D]', '[F]', '[J]', '[K]'][i], cx - 9, this.lineY + 30);
      }
      
      // ★ 同時押しライン描画
      ctx.lineWidth = 2;
      for (let i = 0; i < this.notes.length; i++) {
          let n1 = this.notes[i];
          if (!n1.missed && !n1.hit && n1.y > -30 && n1.y < 420) {
              for (let j = i + 1; j < this.notes.length; j++) {
                  let n2 = this.notes[j];
                  if (n2.time - n1.time > 0.05) break; 
                  if (!n2.missed && !n2.hit && Math.abs(n1.time - n2.time) < 0.01) {
                      let cx1 = 25 + n1.lane * 50;
                      let cx2 = 25 + n2.lane * 50;
                      ctx.strokeStyle = `rgba(255, 255, 100, 0.6)`;
                      ctx.beginPath(); ctx.moveTo(cx1, n1.y); ctx.lineTo(cx2, n2.y); ctx.stroke();
                  }
              }
          }
      }

      this.notes.forEach(n => {
        if(!n.missed && !n.hit && n.y > -30 && n.y < 420) {
           let cx = 25 + n.lane * 50;
           if(n.curve) cx += Math.sin((n.y / 400) * Math.PI * 2) * 40; 
           ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, n.y, 16, 0, Math.PI * 2); ctx.fill();
           ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, n.y, 16, 0, Math.PI * 2); ctx.stroke();
           ctx.fillStyle = this.colors[n.lane]; ctx.font = 'bold 16px monospace'; ctx.fillText(this.arrows[n.lane], cx - 8, n.y + 5);
        }
      });
      drawParticles();

      if(this.isEndless) {
         let elapsed = Math.max(0, now);
         let timeStr = Math.floor(elapsed / 60) + ":" + String(Math.floor(elapsed % 60)).padStart(2, '0');
         ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`TIME: ${timeStr}`, 60, 28);
         ctx.fillStyle = '#f00'; ctx.font = '12px monospace'; ctx.fillText('LIFE: ' + '❤️'.repeat(this.life), 10, 45);
      } else {
         ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 60, 28);
      }
      
      // ★ 100コンボごとに花火（パーティクル爆発）
      if(this.combo > 5){ 
          ctx.fillStyle = '#f0f'; ctx.font = 'bold 14px monospace'; ctx.fillText(`${this.combo} COMBO!`, 120, 35); 
          if(this.combo % 100 === 0 && this.combo > 0 && this.judgements.length > 0 && this.judgements[this.judgements.length-1].life === 30) {
              for(let i=0; i<3; i++) addParticle(Math.random()*200, Math.random()*200, '#ff0', 'explosion');
          }
      }
      
      for(let j of this.judgements) {
         ctx.fillStyle = j.color; ctx.font = 'bold 12px monospace'; ctx.globalAlpha = j.life / 30;
         let jx = (25 + j.lane * 50) - (j.msg.length * 3.5); ctx.fillText(j.msg, jx, this.lineY - 30 - (30 - j.life)); ctx.globalAlpha = 1;
      }
      
      if(this.st === 'play' && now < 0 && !this.isEndless){ ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 200, 400); ctx.fillStyle = '#ff0'; ctx.font = 'bold 40px monospace'; ctx.fillText(Math.ceil(-now), 85, 200); }
      
      let h = 0;
      if(this.st === 'loading') h = 200;
      else if(this.st === 'intro') h = 200 * (1 - Math.pow(Math.min(1, this.transformTimer / 60), 2));
      if(h > 0) {
          ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, h); ctx.fillRect(0, 400 - h, 200, h);
          ctx.fillStyle = '#ff0'; ctx.shadowBlur = 10; ctx.shadowColor = '#ff0'; ctx.fillRect(0, h - 2, 200, 4); ctx.fillRect(0, 400 - h - 2, 200, 4); ctx.shadowBlur = 0;
          if(this.st === 'loading') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 170, 180, 60); ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText('ANALYZING DATA...', 25, 195); ctx.fillRect(50, 210, (Date.now()%1000)/1000*100, 5); }
      }

      if(this.st === 'result') {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 100, 180, 180); ctx.strokeStyle = '#f00'; ctx.strokeRect(10, 100, 180, 180);
        
        if (this.isEndless) {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('SURVIVED!', 60, 130);
            let tStr = Math.floor(this.finalTime / 60) + ":" + String(Math.floor(this.finalTime % 60)).padStart(2, '0');
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`TIME:      ${tStr}`, 25, 170); 
            ctx.fillText(`MAX COMBO: ${this.maxCombo}`, 25, 190);
            let rank = this.finalTime >= 300 ? 'S' : this.finalTime >= 180 ? 'A' : this.finalTime >= 60 ? 'B' : 'C';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 50, 240);
        } else {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 30, 130);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 25, 170); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 25, 190);
            let rank = this.score > this.notes.length * 80 ? 'S' : this.score > this.notes.length * 50 ? 'A' : this.score > this.notes.length * 30 ? 'B' : 'C';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 50, 240);
        }
        ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('左上の [EXIT] で戻る', 40, 265);
      }
      
      // 左上EXITボタン (ランクゲージの下に配置)
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(5, 15, 40, 20); ctx.strokeStyle = '#f00'; ctx.strokeRect(5, 15, 40, 20);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('EXIT', 12, 28);
    }
    ctx.restore();
  }
};
