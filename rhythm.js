// === BEAT BROS - VJ VISUALIZER & HI-SPEED EDITION ===
// リアルタイムビジュアライザ、同時押しライン、ハイスピード調整、UI超強化！

const Rhythm = {
  st: 'menu', mode: 'normal', filterType: 0, settingsCur: 0, hiSpeed: 1.0,
  audioBuffer: null, source: null, analyser: null, dataArray: null,
  startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], transformTimer: 0, 
  pendingFile: null, playlist: [], trackIndex: 0, 
  isEndless: false, endlessBpm: 120, endlessBeat: 0, logicalBeatTime: 0, life: 5, finalTime: 0,
  touchBound: false, laneTouch: [false,false,false,false], laneGlow: [0,0,0,0], // レーン発光用
  arrows: ['←', '↓', '↑', '→'], colors: ['#f0f', '#0ff', '#0f0', '#f00'], lineY: 340, 
  video: null, isVideo: false, bgTimer: 0,

  init() {
    this.st = 'menu'; this.mode = 'normal'; this.filterType = 0; this.settingsCur = 0; this.hiSpeed = 1.0;
    this.laneTouch = [false,false,false,false]; this.laneGlow = [0,0,0,0];
    this.audioBuffer = null; this.playlist = []; this.trackIndex = 0;
    if(this.source){ this.source.stop(); this.source.disconnect(); this.source=null; }
    if(this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); this.video = null; }
    this.isVideo = false; this.bgTimer = 0;

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
        if (this.st === 'play') {
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

  // ★ 曲選択UIを超絶サイバー強化！
  showFileUI() {
    let ui = document.getElementById('rhythm-file-ui');
    if(!ui) {
      ui = document.createElement('div'); ui.id = 'rhythm-file-ui';
      ui.style.position = 'absolute'; ui.style.bottom = '40px'; ui.style.left = '50%'; 
      ui.style.transform = 'translateX(-50%)'; ui.style.zIndex = '100'; ui.style.textAlign = 'center'; 
      ui.style.width = '90%'; ui.style.background = 'rgba(0, 0, 20, 0.85)';
      ui.style.border = '2px solid #0ff'; ui.style.borderRadius = '10px';
      ui.style.padding = '15px 0'; ui.style.boxShadow = '0 0 20px #0ff, inset 0 0 10px #0ff';
      ui.style.backdropFilter = 'blur(5px)';
      
      let title = document.createElement('div');
      title.style.color = '#0ff'; title.style.fontFamily = 'monospace'; title.style.fontWeight = 'bold';
      title.style.marginBottom = '15px'; title.style.textShadow = '0 0 5px #0ff';
      title.innerHTML = '>> SELECT TRACK DATA <<';
      ui.appendChild(title);

      let label = document.createElement('label');
      label.style.display = 'inline-block'; label.style.background = 'linear-gradient(90deg, #0ff, #08f)'; 
      label.style.color = '#000'; label.style.padding = '12px 20px'; label.style.fontFamily = 'monospace'; 
      label.style.fontWeight = 'bold'; label.style.fontSize = '12px'; label.style.borderRadius = '5px'; 
      label.style.cursor = 'pointer'; label.style.boxShadow = '0 4px 0 #005, 0 0 15px #0ff'; 
      label.style.marginBottom = '15px'; label.style.transition = 'transform 0.1s';
      label.innerHTML = '📁 LOAD AUDIO / VIDEO';
      
      let input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*, video/*'; input.multiple = true; input.style.display = 'none'; 
      label.onclick = () => { initAudio(); label.style.transform = 'translateY(4px)'; setTimeout(()=>label.style.transform='none', 100); }; 
      label.ontouchstart = label.onclick;
      
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
      btnEndless.style.display = 'inline-block'; btnEndless.style.background = 'linear-gradient(90deg, #f00, #a00)'; 
      btnEndless.style.color = '#fff'; btnEndless.style.padding = '10px 15px'; btnEndless.style.fontFamily = 'monospace'; 
      btnEndless.style.fontWeight = 'bold'; btnEndless.style.fontSize = '12px'; btnEndless.style.borderRadius = '5px'; 
      btnEndless.style.cursor = 'pointer'; btnEndless.style.boxShadow = '0 4px 0 #500, 0 0 15px #f00';
      btnEndless.innerHTML = '💀 ENDLESS SURVIVAL';
      const startEndless = (e) => { 
          if(e) e.preventDefault(); initAudio(); 
          btnEndless.style.transform = 'translateY(4px)';
          setTimeout(()=>{ this.hideFileUI(); this.isEndless = true; this.st = 'settings'; this.settingsCur = 0; btnEndless.style.transform = 'none';}, 100); 
      };
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

  // ★ ノーツ生成アルゴリズムの強化（密度大幅アップ！）
  generateNotes(buffer) {
    const raw = buffer.getChannelData(0); this.notes = [];
    let sum = 0, count = 0; for(let i=0; i<raw.length; i+=1000){ sum+=Math.abs(raw[i]); count++; }
    let avgVol = sum / count;
    
    // ★ 難易度ごとの敷居値（低いほどノーツが増える）
    let threshold = avgVol * (this.mode === 'nightmare' ? 0.3 : this.mode === 'hard' ? 0.7 : this.mode === 'normal' ? 1.1 : 1.6);
    if(threshold < 0.01) threshold = 0.01;
    
    // ★ ノーツの最小間隔（短いほど連打になる）
    let minGap = this.mode === 'nightmare' ? 0.06 : this.mode === 'hard' ? 0.12 : this.mode === 'normal' ? 0.2 : 0.35;
    
    let lastTime = 0, lastLane = -1;
    for(let i=0; i<raw.length; i+=256) {
      if(Math.abs(raw[i]) > threshold) {
        let t = i / buffer.sampleRate; 
        if(t - lastTime > minGap) {
          // 同時押し（和音）の確率を上げる
          let isSimultaneous = Math.random() < (this.mode === 'nightmare' ? 0.35 : this.mode === 'hard' ? 0.2 : 0.05);
          let nCnt = isSimultaneous ? (Math.random() < 0.3 ? 3 : 2) : 1;
          
          let lanes = [0,1,2,3].sort(()=>Math.random()-0.5).slice(0,nCnt);
          lanes.forEach(l => {
              // 少し散らして配置
              this.notes.push({ time: t + (isSimultaneous ? 0 : Math.random()*0.02), lane: l, hit: false, y: -50, missed: false });
          });
          lastLane = lanes[0]; lastTime = t; 
        }
      }
    }
    // ノーツが少なすぎる場合の救済
    if(this.notes.length < 20) {
       this.notes = []; lastTime = 0; lastLane = -1;
       for(let t=2; t<buffer.duration; t+=minGap*1.2) { let lane = Math.floor(Math.random() * 4); this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false }); }
    }
    
    // 時間順にソート（同時押しラインの描画で必要）
    this.notes.sort((a,b) => a.time - b.time);
    this.startPlay();
  },

  startPlay() {
    this.st = 'intro'; this.transformTimer = 0; 
    
    if(this.trackIndex === 0 || this.isEndless) {
       this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
    }
    
    // ★ リアルタイム・ビジュアライザ用 AnalyserNodeの準備
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 64; // 荒めのバーにする
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    if(this.isEndless) {
       BGM.stop(); this.notes = [];
       this.life = 5; this.endlessBpm = 120;
       this.endlessBeat = 0; this.logicalBeatTime = 0; this.finalTime = 0;
       this.startTime = audioCtx.currentTime + 1.5;
       // エンドレス時は全体のDestinationから音を拾う（擬似的）
       return;
    }

    this.source = audioCtx.createBufferSource(); this.source.buffer = this.audioBuffer;
    
    // エフェクトフィルター
    let lastNode = this.source;
    if(this.filterType === 1) { let filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 1.5; lastNode.connect(filter); lastNode = filter; } 
    else if(this.filterType === 2) { let filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400; lastNode.connect(filter); lastNode = filter; } 
    else if(this.filterType === 3) { let delay = audioCtx.createDelay(); delay.delayTime.value = 0.35; let feedback = audioCtx.createGain(); feedback.gain.value = 0.3; delay.connect(feedback); feedback.connect(delay); lastNode.connect(delay); delay.connect(this.analyser); lastNode.connect(this.analyser); lastNode = null; } 
    
    if (lastNode) {
        lastNode.connect(this.analyser);
    }
    this.analyser.connect(audioCtx.destination);
    
    this.source.onended = () => { this.handleTrackEnd(); }; 
  },

  handleTrackEnd() {
    if(this.video) { this.video.pause(); }
    if(this.isEndless) return;
    
    if(this.trackIndex < this.playlist.length - 1) {
       this.st = 'intermission'; this.transformTimer = 180; 
    } else {
       this.st = 'result'; let finalScore = Math.floor(this.score);
       let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, nightmare:0};
       if(finalScore > (rData[this.mode]||0)){ rData[this.mode] = finalScore; SaveSys.data.rhythm = rData; SaveSys.save(); }
       SaveSys.addLog('BEAT BROS', `${this.playlist.length > 1 ? 'メドレー' : this.mode.toUpperCase()} で スコア${finalScore}`);
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
        o.connect(g); g.connect(audioCtx.destination); o.start(targetRealTime); o.stop(targetRealTime + dur + 0.1);
      };
      const playNoise = (dur, vol) => {
        if(!noiseBuffer) return;
        let s = audioCtx.createBufferSource(); let g = audioCtx.createGain(); s.buffer = noiseBuffer;
        g.gain.setValueAtTime(vol, targetRealTime); g.gain.exponentialRampToValueAtTime(0.001, targetRealTime + dur);
        s.connect(g); g.connect(audioCtx.destination); s.start(targetRealTime); s.stop(targetRealTime + dur + 0.1);
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
        if(minDiff < 0.10){ msg = 'PERFECT'; pts = 100; addParticle(cx, this.lineY, '#ff0', 'explosion'); this.laneGlow[lane] = 1.0; }
        else if(minDiff < 0.20){ msg = 'GREAT'; pts = 50; addParticle(cx, this.lineY, this.colors[lane], 'star'); this.laneGlow[lane] = 0.5; }
        else { msg = 'GOOD'; pts = 10; this.laneGlow[lane] = 0.2; }
        
        this.combo++; if(this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
        this.judgements.push({ msg: msg, life: 30, color: '#ff0', lane: lane }); 
        
        // コンボによるド派手なエフェクト
        if (this.combo > 0 && this.combo % 50 === 0) {
            screenShake(8); playSnd('combo');
            for(let i=0; i<20; i++) addParticle(Math.random()*200, Math.random()*200, this.colors[Math.floor(Math.random()*4)], 'star');
        }
      }
  },

  update() {
    this.bgTimer++;
    let kD = typeof keysDown !== 'undefined' ? keysDown : {};
    let k = typeof keys !== 'undefined' ? keys : {};
    
    if(this.st === 'menu') {
      if(kD.select){ this.hideFileUI(); switchApp(Menu); return; }
    }
    else if(this.st === 'settings') {
      if(kD.select){ this.st = 'menu'; this.showFileUI(); return; }
      if(kD.up){ this.settingsCur = (this.settingsCur + 3) % 4; playSnd('sel'); } // メニューを4つに
      if(kD.down){ this.settingsCur = (this.settingsCur + 1) % 4; playSnd('sel'); }
      
      if(this.settingsCur === 0) {
        let m = ['easy','normal','hard','nightmare'];
        if(kD.left) { this.mode = m[(m.indexOf(this.mode)+3)%4]; playSnd('sel'); }
        if(kD.right || kD.a) { this.mode = m[(m.indexOf(this.mode)+1)%4]; playSnd('sel'); }
      } else if(this.settingsCur === 1) { 
        if(kD.left) { this.filterType = (this.filterType + 3) % 4; playSnd('sel'); }
        if(kD.right || kD.a) { this.filterType = (this.filterType + 1) % 4; playSnd('sel'); }
      } else if(this.settingsCur === 2) { 
        // ★ 新機能：ハイスピード調整
        let spds = [1.0, 1.5, 2.0, 2.5, 3.0, 4.0];
        let idx = spds.indexOf(this.hiSpeed); if(idx===-1) idx=0;
        if(kD.left) { this.hiSpeed = spds[(idx + spds.length - 1) % spds.length]; playSnd('sel'); }
        if(kD.right || kD.a) { this.hiSpeed = spds[(idx + 1) % spds.length]; playSnd('sel'); }
      } else if(this.settingsCur === 3) {
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
      
      // ★ 落下速度を根本的に引き上げ＋ハイスピ倍率適用
      let speed = 200;
      if(this.isEndless) {
          this.scheduleEndless(now);
          let diff = Math.min(Math.max(now, 0) / 300, 1.0);
          speed = (200 + (diff * 300)) * this.hiSpeed;
      } else {
          let baseSpeed = (this.mode === 'nightmare' ? 800 : this.mode === 'hard' ? 450 : this.mode === 'normal' ? 350 : 200);
          speed = baseSpeed * this.hiSpeed;
          if(this.mode === 'nightmare' && this.source) this.source.playbackRate.value = 1.0 + Math.sin(Date.now()/200)*0.3;
      }

      if(kD.left || kD.l0) this.hitKey(0); if(kD.down || kD.l1) this.hitKey(1); if(kD.up || kD.l2) this.hitKey(2); if(kD.right|| kD.l3) this.hitKey(3);
      
      for(let i=0; i<4; i++) { if(this.laneGlow[i] > 0) this.laneGlow[i] -= 0.05; } // レーン発光の減衰

      for(let n of this.notes) {
        let tDiff = n.time - now;
        
        if(n.accel && tDiff > 0) n.y = this.lineY - (tDiff * tDiff) * (speed / 1.5); 
        else n.y = this.lineY - tDiff * speed;
        
        if(!n.hit && !n.missed && n.y > 420) { 
           n.missed = true; this.combo = 0; 
           this.judgements.push({ msg: 'MISS', life: 30, color: '#f00', lane: n.lane }); 
           
           if(this.isEndless) {
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

    // --- 背景描画 (DJクラブ風 VJ演出) ---
    if (this.st === 'menu' || this.st === 'settings') {
        let t = this.bgTimer * 0.05;
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; ctx.lineWidth = 2;
        for(let i=0; i<10; i++) {
            ctx.beginPath(); ctx.arc(100, 150, (t*50 + i*30)%300, 0, Math.PI*2); ctx.stroke();
        }
    }

    if (this.st === 'play' && this.video && !this.video.paused && !this.video.ended) {
        try { 
            let vw = this.video.videoWidth; let vh = this.video.videoHeight;
            if (vw > 0 && vh > 0) {
                let drawW = cvs.width; let drawH = vh * (cvs.width / vw);
                let drawY = (cvs.height - drawH) / 2; 
                ctx.drawImage(this.video, 0, drawY, drawW, drawH);
            }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillRect(0, 0, cvs.width, cvs.height); 
        } catch(e) {} 
    }
    
    // ★ リアルタイム・ビジュアライザ描画
    if (this.st === 'play' && this.analyser) {
        this.analyser.getByteFrequencyData(this.dataArray);
        let barWidth = (cvs.width / this.analyser.frequencyBinCount) * 1.5;
        let x = 0;
        for(let i = 0; i < this.analyser.frequencyBinCount; i++) {
            let barHeight = this.dataArray[i] * 0.8;
            ctx.fillStyle = `rgba(0, ${this.dataArray[i]}, 255, 0.4)`;
            ctx.fillRect(x, cvs.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    }

    if (this.isEndless && this.st === 'play') {
       let elapsed = Math.max(now, 0);
       let diff = Math.min(elapsed / 300, 1.0);
       let r = Math.floor(diff * 80); let b = Math.floor((1 - diff) * 80);
       ctx.fillStyle = `rgba(${r}, 0, ${b}, 0.6)`; ctx.fillRect(0,0,200,400);
       if (elapsed >= 300) {
           ctx.translate(100, 200); ctx.rotate(Math.sin(Date.now()/400) * 0.15); ctx.translate(-100, -200);
       }
    }

    ctx.save();
    if(this.mode === 'nightmare' && this.st === 'play') { ctx.translate(100, 200); ctx.rotate(Math.sin(Date.now()/300) * 0.1); ctx.translate(-100, -200); }
    if(typeof shakeTimer !== 'undefined' && shakeTimer > 0){ ctx.translate((Math.random()-0.5)*shakeTimer*2, (Math.random()-0.5)*shakeTimer*2); shakeTimer--; }
    
    if(this.st === 'menu') {
      ctx.shadowBlur = 10; ctx.shadowColor = '#0ff'; ctx.fillStyle = '#0ff'; 
      ctx.font = 'bold 24px monospace'; ctx.fillText('BEAT BROS', 35, 80); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('SYSTEM UPGRADE V2', 50, 100);
      ctx.fillStyle = '#ff0'; ctx.fillText('↓画面下部でファイルをロード↓', 20, 140);
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if(this.st === 'settings') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK LOADED', 45, 50);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      
      if(this.isEndless) {
         ctx.fillText('MODE: ENDLESS TIME SURVIVAL', 5, 110);
         ctx.fillStyle = '#f00'; ctx.fillText('⚠ DANGER ⚠', 60, 140);
      } else {
         let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, nightmare:0};
         ctx.fillStyle = this.settingsCur === 0 ? (this.mode === 'nightmare' ? '#f00' : '#ff0') : '#fff';
         ctx.fillText((this.settingsCur===0?'> ':'  ') + `MODE: ${this.mode.toUpperCase()}`, 25, 100);
         ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText(`  HI-SCORE: ${rData[this.mode]||0}`, 25, 115);
         
         ctx.font = '12px monospace';
         const filters = ['OFF', 'RADIO', 'WATER', 'ECHO'];
         ctx.fillStyle = this.settingsCur === 1 ? '#0ff' : '#fff'; ctx.fillText((this.settingsCur===1?'> ':'  ') + `FILTER: ${filters[this.filterType]}`, 25, 145);
         
         // ★ ハイスピードUI
         ctx.fillStyle = this.settingsCur === 2 ? '#f0f' : '#fff'; ctx.fillText((this.settingsCur===2?'> ':'  ') + `SPEED: x${this.hiSpeed.toFixed(1)}`, 25, 175);
      }
      
      ctx.fillStyle = this.settingsCur === (this.isEndless?3:3) ? '#0f0' : '#888'; 
      ctx.fillText((this.settingsCur===(this.isEndless?3:3)?'> ':'  ') + `[ EXECUTE ]`, 55, 220);
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('↑↓:選択 ◀▶:変更  SEL:戻る', 25, 280);
    }
    else if(this.st === 'transform_in' || this.st === 'transform_out') {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM REBOOT...', cvs.width/2 - 60, cvs.height/2 + (Math.random()-0.5)*10);
      ctx.fillStyle = `rgba(0, 255, 255, ${Math.random()*0.3})`; ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    else if(this.st === 'intermission') { 
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText(`TRACK ${this.trackIndex} CLEARED!`, 30, 150);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('NEXT TRACK LOADING...', 30, 180);
    }
    else if(this.st === 'loading' || this.st === 'intro' || this.st === 'play' || this.st === 'result') {
      // 奥へ続くパース線
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
      for(let i=0; i<=4; i++) { let cx = 25 + i*50 - 25; ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 400); ctx.stroke(); }
      
      let k = typeof keys !== 'undefined' ? keys : {};
      
      // レーンと判定ラインの描画
      for(let i=0; i<4; i++) {
         let cx = 25 + i * 50; 
         let isP = (i===0 && (k.left || k.l0 || this.laneTouch[0])) || (i===1 && (k.down || k.l1 || this.laneTouch[1])) || (i===2 && (k.up || k.l2 || this.laneTouch[2])) || (i===3 && (k.right || k.l3 || this.laneTouch[3]));
         
         // ★ レーン発光エフェクト（グラデーション）
         if (this.laneGlow[i] > 0 || isP) {
             let alpha = Math.max(this.laneGlow[i], isP ? 0.3 : 0);
             let grad = ctx.createLinearGradient(0, this.lineY, 0, 0);
             grad.addColorStop(0, this.colors[i]); grad.addColorStop(1, 'rgba(0,0,0,0)');
             ctx.globalAlpha = alpha; ctx.fillStyle = grad; ctx.fillRect(cx - 25, 0, 50, this.lineY); ctx.globalAlpha = 1;
         }
         
         ctx.strokeStyle = this.colors[i]; ctx.lineWidth = isP ? 4 : 2; 
         ctx.beginPath(); ctx.arc(cx, this.lineY, 18, 0, Math.PI * 2); ctx.stroke();
         ctx.fillStyle = this.colors[i]; ctx.font = 'bold 18px monospace'; ctx.fillText(this.arrows[i], cx - 9, this.lineY + 6);
      }
      
      // ★ 同時押しラインの描画
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.lineWidth = 2;
      for(let i=0; i<this.notes.length - 1; i++) {
          let n1 = this.notes[i]; let n2 = this.notes[i+1];
          if(!n1.missed && !n1.hit && !n2.missed && !n2.hit && Math.abs(n1.time - n2.time) < 0.01) {
              if (n1.y > 0 && n1.y < 400) {
                  ctx.beginPath(); ctx.moveTo(25 + n1.lane*50, n1.y); ctx.lineTo(25 + n2.lane*50, n2.y); ctx.stroke();
              }
          }
      }

      // ノーツの描画
      this.notes.forEach(n => {
        if(!n.missed && !n.hit && n.y > -30 && n.y < 420) {
           let cx = 25 + n.lane * 50;
           if(n.curve) cx += Math.sin((n.y / 400) * Math.PI * 2) * 40; 
           
           // サイバー風ノーツ
           ctx.fillStyle = '#000'; ctx.fillRect(cx-18, n.y-8, 36, 16);
           ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 2; ctx.strokeRect(cx-18, n.y-8, 36, 16);
           ctx.fillStyle = '#fff'; ctx.fillRect(cx-8, n.y-2, 16, 4);
        }
      });
      drawParticles();

      // スコア＆UI
      if(this.isEndless) {
         let elapsed = Math.max(0, now);
         let timeStr = Math.floor(elapsed / 60) + ":" + String(Math.floor(elapsed % 60)).padStart(2, '0');
         ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`TIME: ${timeStr}`, 60, 20);
         ctx.fillStyle = '#f00'; ctx.font = '12px monospace'; ctx.fillText('LIFE: ' + '❤️'.repeat(this.life), 10, 40);
      } else {
         ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 60, 20);
      }
      
      // ★ コンボの巨大化＆アニメーション
      if(this.combo > 5){ 
          let size = 16 + Math.min(this.combo/10, 10);
          ctx.fillStyle = '#0ff'; ctx.font = `bold ${size}px monospace`; 
          ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
          ctx.fillText(`${this.combo} COMBO!`, 100 - (size*3), 150); 
          ctx.shadowBlur = 0;
      }
      
      for(let j of this.judgements) {
         ctx.fillStyle = j.color; ctx.font = 'bold 12px monospace'; ctx.globalAlpha = j.life / 30;
         let jx = (25 + j.lane * 50) - (j.msg.length * 3.5); ctx.fillText(j.msg, jx, this.lineY - 30 - (30 - j.life)); ctx.globalAlpha = 1;
      }
      
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(5, 5, 40, 20); ctx.strokeStyle = '#f00'; ctx.strokeRect(5, 5, 40, 20);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('EXIT', 12, 18);
      
      if(this.st === 'play' && now < 0 && !this.isEndless){ ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 200, 400); ctx.fillStyle = '#ff0'; ctx.font = 'bold 40px monospace'; ctx.fillText(Math.ceil(-now), 85, 200); }
      
      let h = 0;
      if(this.st === 'loading') h = 200;
      else if(this.st === 'intro') h = 200 * (1 - Math.pow(Math.min(1, this.transformTimer / 60), 2));
      if(h > 0) {
          ctx.fillStyle = '#112'; ctx.fillRect(0, 0, 200, h); ctx.fillRect(0, 400 - h, 200, h);
          ctx.fillStyle = '#0ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff'; ctx.fillRect(0, h - 2, 200, 4); ctx.fillRect(0, 400 - h - 2, 200, 4); ctx.shadowBlur = 0;
          if(this.st === 'loading') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 170, 180, 60); ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('ANALYZING TRACK...', 20, 195); ctx.fillRect(50, 210, (Date.now()%1000)/1000*100, 5); }
      }

      if(this.st === 'result') {
        ctx.fillStyle = 'rgba(0,10,20,0.9)'; ctx.fillRect(10, 100, 180, 180); ctx.strokeStyle = '#0ff'; ctx.strokeRect(10, 100, 180, 180);
        
        if (this.isEndless) {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('SURVIVED!', 60, 130);
            let tStr = Math.floor(this.finalTime / 60) + ":" + String(Math.floor(this.finalTime % 60)).padStart(2, '0');
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`TIME:      ${tStr}`, 25, 170); 
            ctx.fillText(`MAX COMBO: ${this.maxCombo}`, 25, 190);
            let rank = this.finalTime >= 300 ? 'S' : this.finalTime >= 180 ? 'A' : this.finalTime >= 60 ? 'B' : 'C';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 50, 240);
        } else {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 30, 130);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 25, 170); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 25, 190);
            let rank = this.score > this.notes.length * 80 ? 'S' : this.score > this.notes.length * 50 ? 'A' : this.score > this.notes.length * 30 ? 'B' : 'C';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 50, 240);
        }
        ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('左上の [EXIT] で戻る', 40, 265);
      }
    }
    ctx.restore();
  }
};
