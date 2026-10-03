// === BEAT BROS - REMASTER V5 ===
// EXPERT追加 / 難易度調整 / メドレー演出強化 / EXPERT=ダメージノーツ制

const Rhythm = {
  st: 'menu', mode: 'normal', filterType: 0, settingsCur: 0, hiSpeed: 1.0, noteSkin: 0, autoPlay: false,
  audioBuffer: null, source: null, analyser: null, dataArray: null,
  startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], transformTimer: 0,
  pendingFile: null, playlist: [], trackIndex: 0,
  hp: 100, failed: false,
  trackStartScore: 0, trackScores: [], medleyBonus: 0,
  touchBound: false, laneTouch: [false,false,false,false], laneGlow: [0,0,0,0],
  arrows: ['←', '↓', '↑', '→'], colors: ['#f0f', '#0ff', '#0f0', '#f00'], lineY: 340,
  video: null, isVideo: false, bgTimer: 0,

  skins: ['CLASSIC', 'CYBER', 'DOT', 'GEM'],
  spds: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0],
  modes: ['easy', 'normal', 'hard', 'expert'],
  // thr: 音量しきい値の倍率(小さいほど密) / gap: 最短ノーツ間隔(秒) / spd: 落下速度
  cfgs: {
    easy:      { thr: 1.5, gap: 0.32, spd: 200 },
    normal:    { thr: 1.1, gap: 0.22, spd: 300 },
    hard:      { thr: 0.7, gap: 0.13, spd: 400 },
    expert: { thr: 0.7, gap: 0.13, spd: 480 }   // 密度はHARDと同じ
  },
  hints: {
    easy: 'のんびり遊べる', normal: '標準の難易度', hard: '高密度の譜面',
    expert: '赤い✖は押すな!HP制'
  },
  cfg() { return this.cfgs[this.mode] || this.cfgs.normal; },

  init() {
    this.st = 'menu'; this.mode = 'normal'; this.filterType = 0; this.settingsCur = 0;
    this.hiSpeed = 1.0; this.noteSkin = 0; this.autoPlay = false;
    this.laneTouch = [false,false,false,false]; this.laneGlow = [0,0,0,0]; this.touchLane = {}; this.lastPress = [-1,-1,-1,-1];
    this.audioBuffer = null; this.playlist = []; this.trackIndex = 0;
    this.stopAudio();
    if(this.video) { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); this.video = null; }
    this.isVideo = false; this.bgTimer = 0;

    document.getElementById('gameboy').classList.remove('mode-tall');
    const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 300;
    BGM.play('menu'); this.showFileUI();

    if(!this.touchBound) {
      this.touchBound = true;
      this.touchLane = {};   // タッチID → レーン
      const laneAt = (t) => {
        const r = cvs.getBoundingClientRect();
        const x = (t.clientX - r.left) / r.width * cvs.width;
        const y = (t.clientY - r.top) / r.height * cvs.height;
        return { x, y, lane: (y > 100) ? Math.max(0, Math.min(3, Math.floor(x / (cvs.width / 4)))) : -1 };
      };
      const sync = () => { const s = [false,false,false,false]; for(const id in this.touchLane) { const l = this.touchLane[id]; if(l >= 0) s[l] = true; } this.laneTouch = s; };
      // 押した「瞬間」のイベントごとに直接判定する。前回の状態との比較に頼らないので、
      // 指を離した通知が欠けても以降の入力が無視されない。
      const tH = (e) => {
        if(activeApp !== this) return;
        if(this.st !== 'play' && this.st !== 'result') return;
        if(e.cancelable) e.preventDefault();
        const isMouse = e.type.indexOf('mouse') === 0;
        if(e.type === 'touchstart' || e.type === 'mousedown') {
          const ts = isMouse ? [e] : e.changedTouches;
          for(let i=0; i<ts.length; i++) {
            const p = laneAt(ts[i]);
            if(p.y < 40 && p.x < 60){ this.exitGame(); return; }
            if(this.st === 'result'){ this.exitGame(); return; }
            const id = isMouse ? 'm' : ts[i].identifier;
            this.touchLane[id] = p.lane;
            if(this.st === 'play' && !this.autoPlay && p.lane >= 0) this.press(p.lane);
          }
        } else if(e.type === 'touchmove' || e.type === 'mousemove') {
          if(isMouse && !(e.buttons > 0)) { delete this.touchLane.m; }
          else {
            const ts = isMouse ? [e] : e.changedTouches;
            for(let i=0; i<ts.length; i++) {
              const p = laneAt(ts[i]); const id = isMouse ? 'm' : ts[i].identifier;
              if(this.touchLane[id] !== p.lane) {            // 指をスライドして別レーンに入ったら押下扱い
                this.touchLane[id] = p.lane;
                if(this.st === 'play' && !this.autoPlay && p.lane >= 0) this.press(p.lane);
              }
            }
          }
        } else { // touchend / touchcancel / mouseup / mouseleave
          if(isMouse) delete this.touchLane.m;
          else for(let i=0; i<e.changedTouches.length; i++) delete this.touchLane[e.changedTouches[i].identifier];
        }
        // 実際に触れているタッチだけを残す(取りこぼし対策)
        if(!isMouse && e.touches) {
          const alive = {}; for(let i=0; i<e.touches.length; i++) alive[e.touches[i].identifier] = true;
          for(const id in this.touchLane) { if(id !== 'm' && !alive[id]) delete this.touchLane[id]; }
        }
        sync();
      };
      ['touchstart','touchmove','touchend','touchcancel','mousedown','mousemove','mouseup','mouseleave'].forEach(E => cvs.addEventListener(E, tH, {passive: false}));
    }
  },

  // ---------- ファイル選択UI ----------
  showFileUI() {
    let ui = document.getElementById('rhythm-file-ui');
    if(!ui) {
      ui = document.createElement('div'); ui.id = 'rhythm-file-ui';

      // 画面サイズに関わらず大きさが変わらないよう、px固定
      ui.style.position = 'absolute'; ui.style.bottom = '40px'; ui.style.left = '50%';
      ui.style.transform = 'translateX(-50%)'; ui.style.zIndex = '100';
      ui.style.width = '170px'; ui.style.height = '96px'; ui.style.flex = 'none';
      ui.style.boxSizing = 'border-box';
      ui.style.display = 'flex'; ui.style.flexDirection = 'column';
      ui.style.alignItems = 'center'; ui.style.justifyContent = 'center';
      ui.style.textAlign = 'center'; ui.style.whiteSpace = 'nowrap';
      ui.style.background = 'rgba(0, 0, 20, 0.85)';
      ui.style.border = '2px solid #0ff'; ui.style.borderRadius = '10px';
      ui.style.padding = '10px';
      ui.style.boxShadow = '0 0 20px #0ff, inset 0 0 10px #0ff';

      let title = document.createElement('div');
      title.style.color = '#0ff'; title.style.fontFamily = 'monospace'; title.style.fontWeight = 'bold';
      title.style.marginBottom = '10px'; title.style.textShadow = '0 0 5px #0ff';
      title.style.fontSize = '11px';
      title.innerHTML = '>> SELECT TRACK DATA <<';
      ui.appendChild(title);

      let label = document.createElement('label');
      label.style.display = 'block'; label.style.background = 'linear-gradient(90deg, #0ff, #08f)';
      label.style.color = '#000'; label.style.padding = '8px 10px'; label.style.fontFamily = 'monospace';
      label.style.fontWeight = 'bold'; label.style.fontSize = '10px'; label.style.borderRadius = '5px';
      label.style.cursor = 'pointer'; label.style.boxShadow = '0 4px 0 #005, 0 0 15px #0ff';
      label.innerHTML = '📁 LOAD AUDIO / VIDEO';

      let input = document.createElement('input'); input.type = 'file'; input.accept = 'audio/*, video/*'; input.multiple = true; input.style.display = 'none';
      label.onclick = () => { initAudio(); }; label.ontouchstart = () => { initAudio(); };
      input.onchange = (e) => {
        if(e.target.files.length > 0) {
          initAudio(); this.hideFileUI();
          this.playlist = Array.from(e.target.files); this.trackIndex = 0;
          this.pendingFile = this.playlist[0];
          e.target.value = ''; this.st = 'settings'; this.settingsCur = 0;
        }
      };
      label.appendChild(input); ui.appendChild(label);

      const container = document.getElementById('screen-container');
      if(container) container.appendChild(ui); else document.body.appendChild(ui);
    }
    ui.style.display = 'flex';
  },

  hideFileUI() { let ui = document.getElementById('rhythm-file-ui'); if(ui) ui.style.display = 'none'; },

  stopAudio() {
    if(this.source) {
      try { this.source.onended = null; this.source.stop(); } catch(e) {}
      try { this.source.disconnect(); } catch(e) {}
      this.source = null;
    }
  },

  exitGame() {
    this.st = 'transform_out'; this.transformTimer = 120;
    document.getElementById('gameboy').classList.remove('mode-tall');
    this.stopAudio();
    if(this.video) { this.video.pause(); }
  },

  // 読み込み失敗時: 次の曲があれば飛ばし、無ければメニューへ
  abortLoad(msg) {
    alert(msg);
    if(this.trackIndex < this.playlist.length - 1) { this.st = 'intermission'; this.transformTimer = 60; }
    else this.exitGame();
  },

  loadFile(file) {
    this.st = 'loading'; BGM.stop();
    if(!file) return;

    if(this.video) {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
        this.video = null;
    }

    const reader = new FileReader();

    // --- 音声 / 動画 ---
    this.isVideo = file.type.startsWith('video/');
    if (this.isVideo) {
      this.video = document.createElement('video');
      this.video.src = URL.createObjectURL(file);
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.load();
    }
    reader.onload = e => {
      audioCtx.decodeAudioData(e.target.result, buffer => {
        this.audioBuffer = buffer; this.generateNotes(buffer);
      }, err => { this.abortLoad('解析エラー。'); });
    };
    reader.readAsArrayBuffer(file);
  },

  // ---------- 譜面生成(音声) ----------
  generateNotes(buffer) {
    const raw = buffer.getChannelData(0); this.notes = [];
    let sum = 0, count = 0; for(let i=0; i<raw.length; i+=1000){ sum+=Math.abs(raw[i]); count++; }
    let avgVol = sum / count;

    const frameSize = Math.floor(buffer.sampleRate / 60);
    let rollingMaxArr = [];
    for(let i=0; i<raw.length; i+=frameSize) {
      let mx = 0;
      for(let j=i; j<Math.min(i+frameSize, raw.length); j++) { let v=Math.abs(raw[j]); if(v>mx) mx=v; }
      rollingMaxArr.push(mx);
    }
    let rollingMed = rollingMaxArr.slice().sort((a,b)=>a-b)[Math.floor(rollingMaxArr.length/2)] || avgVol;
    let adaptiveAvg = (avgVol + rollingMed) / 2;
    if(adaptiveAvg < 0.005) adaptiveAvg = avgVol;

    const cfg = this.cfg();
    let threshold = adaptiveAvg * cfg.thr;
    if(threshold < 0.005) threshold = 0.005;
    const minGap = cfg.gap;

    let lastTime = 0, lastLane = -1;
    for(let i=0; i<raw.length; i+=256) {
      let amp = Math.abs(raw[i]);
      if(amp > threshold) {
        let t = i / buffer.sampleRate;
        if(t - lastTime > minGap) {
          let lane = Math.floor(Math.random() * 4);
          if(lane === lastLane && Math.random() < 0.6) lane = (lane + 1 + Math.floor(Math.random()*2)) % 4;
          this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false });

          lastLane = lane; lastTime = t;
        }
      }
    }

    if(this.notes.length < 30) {
       this.notes = [];
       for(let t=2; t<buffer.duration; t+=minGap*1.2) { let lane = Math.floor(Math.random() * 4); this.notes.push({ time: t, lane: lane, hit: false, y: -50, missed: false }); }
    }

    this.finalizeNotes();
    this.startPlay();
  },

  // 並べ替え + EXPERTのダメージノーツ配置
  finalizeNotes() {
    this.notes.sort((a,b) => a.time - b.time);
    if(this.mode === 'expert') this.addDamageNotes();
  },

  addDamageNotes() {
    const normals = this.notes.filter(n => !n.bad);
    let lastBad = -9;
    for(let i=0; i<normals.length - 1; i++) {
      let a = normals[i], b = normals[i+1];
      let gap = b.time - a.time;
      if(gap < 0.2) continue;
      let t = a.time + gap / 2;
      if(t - lastBad < 0.5) continue;
      if(Math.random() > 0.65) continue;
      // 本物のノーツと被らないレーンを選ぶ
      let near = normals.slice(Math.max(0, i - 6), i + 8);
      let free = [0,1,2,3].filter(l => !near.some(n => n.lane === l && Math.abs(n.time - t) < 0.4));
      if(free.length === 0) continue;
      this.notes.push({ time: t, lane: free[Math.floor(Math.random() * free.length)], hit: false, y: -50, missed: false, bad: true });
      lastBad = t;
    }
    this.notes.sort((a,b) => a.time - b.time);
  },

  startPlay() {
    this.st = 'intro'; this.transformTimer = 0;

    if(this.trackIndex === 0) {
       this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
       this.hp = 100; this.failed = false;
       this.trackScores = []; this.medleyBonus = 0;
    }
    this.trackStartScore = this.score;

    this.stopAudio();
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.source = audioCtx.createBufferSource(); this.source.buffer = this.audioBuffer;
    let lastNode = this.source;

    if(this.filterType === 1) { let filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1200; filter.Q.value = 1.5; lastNode.connect(filter); lastNode = filter; }
    else if(this.filterType === 2) { let filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 400; lastNode.connect(filter); lastNode = filter; }
    else if(this.filterType === 3) { let delay = audioCtx.createDelay(); delay.delayTime.value = 0.35; let feedback = audioCtx.createGain(); feedback.gain.value = 0.3; delay.connect(feedback); feedback.connect(delay); lastNode.connect(delay); delay.connect(this.analyser); lastNode.connect(this.analyser); lastNode = null; }

    if (lastNode) { lastNode.connect(this.analyser); }
    this.analyser.connect(audioCtx.destination);

    if(this.source) this.source.onended = () => { this.handleTrackEnd(); };
  },

  handleTrackEnd() {
    if(this.st === 'result' || this.st === 'transform_out') return;
    if(this.video) { this.video.pause(); }
    this.stopAudio();

    if(this.trackIndex < this.playlist.length - 1) {
       this.trackScores.push(Math.floor(this.score - this.trackStartScore));
       this.st = 'intermission'; this.transformTimer = 180;
       playSnd('combo'); screenShake(10);
       for(let i=0; i<12; i++) addParticle(Math.random()*200, 60 + Math.random()*200, ['#ff0','#0ff','#f0f','#0f0'][i%4], 'explosion');
    } else {
       if(this.playlist.length > 1 && !this.failed) {
          this.trackScores.push(Math.floor(this.score - this.trackStartScore));
          this.medleyBonus = 500 * (this.playlist.length - 1);
          this.score += this.medleyBonus;
          playSnd('combo');
       }
       this.st = 'result'; let finalScore = Math.floor(this.score);

       if(!this.autoPlay) {
           let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, expert:0};
           if(finalScore > (rData[this.mode]||0)){ rData[this.mode] = finalScore; SaveSys.data.rhythm = rData; SaveSys.save(); }
           SaveSys.addLog('BEAT BROS', `${this.playlist.length > 1 ? 'メドレー' : this.mode.toUpperCase()} で スコア${finalScore}`);
       } else {
           SaveSys.addLog('BEAT BROS', `AUTO PLAY で最高にチルった`);
       }
    }
  },

  // EXPERT: HPが尽きたら即終了
  failTrack() {
    this.failed = true; this.st = 'result';
    this.stopAudio();
    if(this.video) { this.video.pause(); }
    SaveSys.addLog('BEAT BROS', `EXPERTで力尽きた…`);
  },

  // 曲の現在時刻(音声の出力遅延ぶん補正)
  songTime() {
    let lat = 0;
    try { lat = Math.min(0.2, audioCtx.outputLatency || 0); } catch(e) {}
    return audioCtx.currentTime - lat - this.startTime;
  },

  // 方向キー/十字キーが押された瞬間に呼ばれる
  // 同じレーンの二重カウント防止(イベント経由とポーリング経由が重なる場合)
  press(lane) {
    if(this.st !== 'play' || this.autoPlay) return;
    const t = audioCtx.currentTime;
    if(!this.lastPress) this.lastPress = [-1,-1,-1,-1];
    if(t - this.lastPress[lane] < 0.04) return;
    this.lastPress[lane] = t;
    this.hitKey(lane);
  },

  onPress(k) {
    const lane = { left: 0, down: 1, up: 2, right: 3 }[k];
    if(lane !== undefined) this.press(lane);
  },

  // EXPERTのわずかなレーンゆらぎ(画面揺れは控えめ)
  laneShift(now) { return this.mode === 'expert' ? Math.sin(now * 3) * 6 : 0; },

  hitKey(lane, isAuto=false) {
      if(this.st !== 'play') return;
      let now = this.songTime();
      let hitNote = null, minDiff = 999;

      for(let n of this.notes) {
        if(!n.bad && !n.hit && !n.missed && n.lane === lane) {
          let diff = Math.abs(n.time - now);
          if(diff < 0.27 && diff < minDiff){ minDiff = diff; hitNote = n; }
        }
      }

      // 押せるノーツが無く、ダメージノーツの上で押してしまった
      if(!hitNote) {
        if(isAuto || this.mode !== 'expert') return;
        for(let n of this.notes) {
          if(n.bad && !n.hit && !n.missed && n.lane === lane && Math.abs(n.time - now) < 0.12) {
            n.hit = true;
            this.hp = Math.max(0, this.hp - 20);
            this.combo = 0; this.score = Math.max(0, this.score - 100);
            this.judgements.push({ msg: 'DAMAGE', life: 30, color: '#f33', lane: lane });
            playSnd('hit');
            addParticle(25 + lane * 50 + this.laneShift(now), this.lineY, '#f33', 'explosion');
            if(this.hp <= 0) this.failTrack();
            return;
          }
        }
        return;
      }

      if(isAuto) minDiff = 0;

      hitNote.hit = true;
      let cx = 25 + lane * 50 + this.laneShift(now);

      let msg = '', pts = 0;
      let jColor;
      if(minDiff < 0.09){ msg = 'PERFECT'; pts = 100; addParticle(cx, this.lineY, '#ff0', 'explosion'); this.laneGlow[lane] = 1.0; jColor = '#ff0'; this.hp = Math.min(100, this.hp + 2); }
      else if(minDiff < 0.18){ msg = 'GREAT'; pts = 50; addParticle(cx, this.lineY, this.colors[lane], 'star'); this.laneGlow[lane] = 0.5; jColor = '#ffd700'; this.hp = Math.min(100, this.hp + 1); }
      else { msg = 'GOOD'; pts = 10; this.laneGlow[lane] = 0.2; jColor = '#00ff88'; }

      this.combo++; if(this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.score += pts * (1 + Math.floor(this.combo / 10) * 0.1);
      this.judgements.push({ msg: msg, life: 30, color: jColor, lane: lane });

      if (this.combo > 0 && this.combo % 50 === 0) {
          screenShake(8); playSnd('combo');
          for(let i=0; i<20; i++) addParticle(Math.random()*200, Math.random()*200, this.colors[Math.floor(Math.random()*4)], 'star');
      }
  },

  startGame() {
      playSnd('jmp'); this.st = 'transform_in'; this.transformTimer = 120;
      document.getElementById('gameboy').classList.add('mode-tall');
      const cvs = document.getElementById('gameCanvas'); cvs.width = 200; cvs.height = 400;
  },

  nextHiSpeed() {
      let idx = this.spds.indexOf(this.hiSpeed);
      if(idx === -1) idx = 0;
      return this.spds[(idx + 1) % this.spds.length];
  },

  update() {
    this.bgTimer++;
    let kD = typeof keysDown !== 'undefined' ? keysDown : {};

    if(this.st === 'menu') {
      if(kD.select){ this.hideFileUI(); switchApp(Menu); return; }
    }
    else if(this.st === 'settings') {
      if(kD.select){ this.st = 'menu'; this.showFileUI(); return; }

      let maxCur = 6;
      if(kD.up){ this.settingsCur = (this.settingsCur + maxCur - 1) % maxCur; playSnd('sel'); }
      if(kD.down){ this.settingsCur = (this.settingsCur + 1) % maxCur; playSnd('sel'); }

      let advance = kD.a || kD.right;

      if(this.settingsCur === 0) {
          let m = this.modes;
          if(advance) { this.mode = m[(m.indexOf(this.mode)+1)%m.length]; playSnd('sel'); }
          else if(kD.left) { this.mode = m[(m.indexOf(this.mode)+m.length-1)%m.length]; playSnd('sel'); }
      } else if(this.settingsCur === 1) {
          if(advance) { this.filterType = (this.filterType + 1) % 4; playSnd('sel'); }
      } else if(this.settingsCur === 2) {
          if(advance) { this.hiSpeed = this.nextHiSpeed(); playSnd('sel'); }
      } else if(this.settingsCur === 3) {
          if(advance) { this.noteSkin = (this.noteSkin + 1) % 4; playSnd('sel'); }
      } else if(this.settingsCur === 4) {
          if(advance) { this.autoPlay = !this.autoPlay; playSnd('sel'); }
      } else if(this.settingsCur === 5) {
          if(kD.a) {
              if (this.mode === 'expert') {
                  this.st = 'warning';
                  playSnd('hit');
                  screenShake(10);
              } else {
                  this.startGame();
              }
          }
      }
    }
    else if(this.st === 'warning') {
      if(kD.a) { this.startGame(); }
      if(kD.b || kD.select) { this.st = 'settings'; playSnd('sel'); }
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
    else if(this.st === 'intermission') {
      this.transformTimer--;
      if(this.transformTimer % 8 === 0) addParticle(20 + Math.random()*160, 100 + Math.random()*160, ['#ff0','#0ff','#f0f','#0f0'][Math.floor(Math.random()*4)], 'star');
      if(this.transformTimer === 120 || this.transformTimer === 60) playSnd('sel');
      if(typeof updateParticles === 'function') updateParticles();
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
        this.startTime = audioCtx.currentTime + 1.5;
        if(this.source) this.source.start(this.startTime);
        if(this.video) { this.video.currentTime = 0; }
      }
    }
    else if(this.st === 'play') {
      let now = this.songTime();

      if (this.video && now >= 0 && this.video.paused && !this.video.ended) {
          let p = this.video.play();
          if(p !== undefined) p.catch(e => console.log("Video AutoPlay Blocked", e));
      }

      let speed = this.cfg().spd * this.hiSpeed;

      if (this.autoPlay) {
          for (let i=0; i<4; i++) this.laneTouch[i] = false;
          for (let n of this.notes) {
              if (!n.bad && !n.hit && !n.missed) {
                  let tDiff = n.time - now;
                  if (tDiff <= 0.02 && tDiff > -0.25) {
                      this.laneTouch[n.lane] = true;
                      this.hitKey(n.lane, true);
                  }
              }
          }
      } else {
          // 押下は onPress() が即時に処理する。取りこぼしても拾えるよう、フレームごとの押下もバックアップで見る
          if(kD.left || kD.l0) this.press(0); if(kD.down || kD.l1) this.press(1); if(kD.up || kD.l2) this.press(2); if(kD.right || kD.l3) this.press(3);
          if(this.st !== 'play') return;
      }

      for(let i=0; i<4; i++) { if(this.laneGlow[i] > 0) this.laneGlow[i] -= 0.05; }

      for(let n of this.notes) {
        let tDiff = n.time - now;
        let wiggle = (this.mode === 'expert') ? Math.sin(now * 10 + n.lane) * 10 : 0;
        n.y = this.lineY - tDiff * speed + wiggle;

        if(!n.hit && !n.missed && tDiff < -0.27) {
           n.missed = true;
           if(n.bad) continue; // ダメージノーツは避ければOK
           this.combo = 0;
           this.judgements.push({ msg: 'MISS', life: 30, color: '#f00', lane: n.lane });
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

    let now = this.songTime();

    if (this.st === 'menu' || this.st === 'settings') {
        let t = this.bgTimer * 0.05;
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, cvs.width, cvs.height);

        if (this.st === 'settings' && this.mode === 'expert') {
            if (Math.random() < 0.08) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(255,0,0,0.15)' : 'rgba(0,255,255,0.15)';
                ctx.fillRect(0, Math.random()*300, 200, Math.random()*20);
            }
        }

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)'; ctx.lineWidth = 2;
        for(let i=0; i<10; i++) { ctx.beginPath(); ctx.arc(100, 150, (t*50 + i*30)%300, 0, Math.PI*2); ctx.stroke(); }
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

    ctx.save();

    if(this.mode === 'expert' && this.st === 'play') {
        // 画面のゆらぎは控えめ(回転±2度・拡縮±3%)
        let nNow = Date.now();
        ctx.translate(100, 200);
        ctx.rotate(Math.sin(nNow/400) * 0.035);
        ctx.scale(1.0 + Math.sin(nNow/300)*0.03, 1.0 + Math.cos(nNow/350)*0.03);
        ctx.translate(-100, -200);

        if(Math.random() < 0.04) {
            ctx.fillStyle = ['rgba(255,0,0,0.12)', 'rgba(0,255,0,0.12)', 'rgba(0,0,255,0.12)'][Math.floor(Math.random()*3)];
            ctx.fillRect(Math.random()*200, Math.random()*400, Math.random()*200, Math.random()*60);
        }
    }

    if(typeof shakeTimer !== 'undefined' && shakeTimer > 0){ ctx.translate((Math.random()-0.5)*shakeTimer*2, (Math.random()-0.5)*shakeTimer*2); shakeTimer--; }

    if(this.st === 'menu') {
      ctx.shadowBlur = 10; ctx.shadowColor = '#0ff'; ctx.fillStyle = '#0ff';
      ctx.font = 'bold 24px monospace'; ctx.fillText('BEAT BROS', 35, 80); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('REMASTER V5', 62, 100);
      ctx.fillStyle = '#ff0'; ctx.fillText('↓画面下部でファイルをロード↓', 20, 140);
      ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
      ctx.fillText('複数選ぶとメドレー再生!', 40, 160);
      ctx.fillStyle = '#888'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if(this.st === 'settings') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
      ctx.fillText('TRACK LOADED', 40, 40);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';

      let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {};

      let mStr = `MODE: ${this.mode.toUpperCase()}`;
      if(this.mode === 'expert') { ctx.fillStyle = '#f00'; if(Math.random()<0.4) mStr = 'M%D#: 3XP3RT!!'; }
      else { ctx.fillStyle = this.settingsCur === 0 ? '#ff0' : '#fff'; }
      ctx.fillText((this.settingsCur===0?'> ':'  ') + mStr, 25, 70);

      ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText(`  HI-SCORE: ${rData[this.mode]||0}`, 25, 85);

      ctx.font = '12px monospace';
      const filters = ['OFF', 'RADIO', 'WATER', 'ECHO'];
      ctx.fillStyle = this.settingsCur === 1 ? '#0ff' : '#fff'; ctx.fillText((this.settingsCur===1?'> ':'  ') + `FILTER: ${filters[this.filterType]}`, 25, 110);
      ctx.fillStyle = this.settingsCur === 2 ? '#f0f' : '#fff'; ctx.fillText((this.settingsCur===2?'> ':'  ') + `SPEED: x${this.hiSpeed.toFixed(1)}`, 25, 135);
      ctx.fillStyle = this.settingsCur === 3 ? '#0f0' : '#fff'; ctx.fillText((this.settingsCur===3?'> ':'  ') + `SKIN: ${this.skins[this.noteSkin]}`, 25, 160);
      ctx.fillStyle = this.settingsCur === 4 ? '#ff0' : '#fff'; ctx.fillText((this.settingsCur===4?'> ':'  ') + `AUTO: ${this.autoPlay ? 'ON' : 'OFF'}`, 25, 185);

      ctx.fillStyle = this.settingsCur === 5 ? (this.mode === 'expert' ? '#f00' : '#0f0') : '#888';
      ctx.fillText((this.settingsCur===5?'> ':'  ') + `[ EXECUTE ]`, 55, 225);

      ctx.fillStyle = this.mode === 'expert' ? '#f66' : '#8cf'; ctx.font = '9px monospace';
      ctx.fillText(this.hints[this.mode], 25, 250);
      ctx.fillStyle = '#666'; ctx.fillText('↑↓:選択 A/▶:変更/決定  SEL:戻る', 15, 280);
    }
    else if(this.st === 'warning') {
      ctx.fillStyle = Math.random() < 0.1 ? '#fff' : '#800';
      ctx.fillRect(0, 0, 200, 300);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('⚠ WARNING ⚠', 35, 100 + (Math.random()-0.5)*3);

      ctx.font = '12px monospace';
      ctx.fillText('HUMANITY EXCEEDED.', 35, 140);
      ctx.fillText('ARE YOU SURE?', 55, 180);

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText('A: EXECUTE   B/SEL: CANCEL', 25, 250);

      if (Math.random() < 0.4) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(0, Math.random()*300, 200, Math.random()*15);
      }
    }
    else if(this.st === 'transform_in' || this.st === 'transform_out') {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM REBOOT...', cvs.width/2 - 60, cvs.height/2 + (Math.random()-0.5)*10);
      ctx.fillStyle = `rgba(0, 255, 255, ${Math.random()*0.3})`; ctx.fillRect(0, 0, cvs.width, cvs.height);
    }
    else if(this.st === 'intermission') {
      const tt = 180 - this.transformTimer;                 // 経過フレーム
      const W = cvs.width, H = cvs.height;
      ctx.fillStyle = '#001'; ctx.fillRect(0, 0, W, H);
      // 放射状の光線
      ctx.save(); ctx.translate(W/2, 150);
      for(let i=0; i<16; i++) {
        ctx.rotate(Math.PI * 2 / 16);
        ctx.fillStyle = `hsla(${(i*22 + tt*3) % 360},100%,60%,0.13)`;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, 320); ctx.lineTo(18, 320); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      drawParticles();
      // 弾むタイトル
      const pop = tt < 20 ? 1 + (20 - tt) * 0.05 : 1 + Math.sin(tt * 0.2) * 0.03;
      ctx.save(); ctx.translate(W/2, 90); ctx.scale(pop, pop);
      ctx.textAlign = 'center';
      ctx.shadowBlur = 16; ctx.shadowColor = `hsl(${(tt*6)%360},100%,60%)`;
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.fillText(`TRACK ${this.trackIndex + 1}`, 0, 0);
      ctx.fillStyle = `hsl(${(tt*6)%360},100%,65%)`; ctx.font = 'bold 17px monospace'; ctx.fillText('CLEARED!!', 0, 24);
      ctx.restore();
      ctx.textAlign = 'left';
      // 成績パネル
      ctx.fillStyle = 'rgba(0,0,30,0.8)'; ctx.fillRect(15, 135, 170, 110); ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(15, 135, 170, 110);
      const shown = Math.min(1, tt / 40);
      const ts = this.trackScores[this.trackScores.length - 1] || 0;
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      ctx.fillText(`TRACK SCORE ${Math.floor(ts * shown)}`, 25, 160);
      ctx.fillText(`TOTAL       ${Math.floor(this.score)}`, 25, 180);
      ctx.fillText(`MAX COMBO   ${this.maxCombo}`, 25, 200);
      // 進行ドット
      for(let i=0; i<this.playlist.length && i<12; i++) {
        const dx = W/2 - (Math.min(this.playlist.length,12) * 14) / 2 + i * 14 + 7;
        ctx.fillStyle = i <= this.trackIndex ? '#0f8' : (i === this.trackIndex + 1 && tt % 20 < 10 ? '#ff0' : '#335');
        ctx.beginPath(); ctx.arc(dx, 228, 4, 0, Math.PI * 2); ctx.fill();
      }
      // 次の曲
      const nx = this.playlist[this.trackIndex + 1];
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
      ctx.fillText(`NEXT  ${this.trackIndex + 2} / ${this.playlist.length}`, W/2, 275);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      let nm = nx ? nx.name : ''; if(nm.length > 24) nm = nm.slice(0, 23) + '…';
      ctx.fillText(nm, W/2, 295);
      // カウントダウンバー
      ctx.fillStyle = '#123'; ctx.fillRect(30, 310, 140, 6);
      ctx.fillStyle = '#0ff'; ctx.fillRect(30, 310, 140 * (tt / 180), 6);
      ctx.textAlign = 'left';
    }
    else if(this.st === 'loading' || this.st === 'intro' || this.st === 'play' || this.st === 'result') {

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
      for(let i=0; i<this.notes.length - 1; i++) {
          let n1 = this.notes[i]; let n2 = this.notes[i+1];
          if(n1.bad || n2.bad) continue;
          if(!n1.missed && !n1.hit && !n2.missed && !n2.hit && Math.abs(n1.time - n2.time) < 0.01) {
              if (n1.y > 0 && n1.y < 400) {
                  let ls = this.st === 'play' ? this.laneShift(now) : 0;
                  ctx.beginPath(); ctx.moveTo(25 + n1.lane*50 + ls, n1.y); ctx.lineTo(25 + n2.lane*50 + ls, n2.y); ctx.stroke();
              }
          }
      }

      let laneOffset = this.st === 'play' ? this.laneShift(now) : 0;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
      for(let i=0; i<=4; i++) { let lcx = 25 + i*50 - 25 + laneOffset; ctx.beginPath(); ctx.moveTo(lcx, 0); ctx.lineTo(lcx, 400); ctx.stroke(); }

      for(let i=0; i<4; i++) {
          let lcx = 25 + i * 50 + laneOffset;
          let lgrad = ctx.createLinearGradient(0, 0, 0, cvs.height);
          lgrad.addColorStop(0, 'rgba(0,0,0,0.5)');
          lgrad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
          lgrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = lgrad;
          ctx.fillRect(lcx - 25, 0, 50, cvs.height);
      }

      let k = typeof keys !== 'undefined' ? keys : {};

      for(let i=0; i<4; i++) {
         let lcx = 25 + i * 50 + laneOffset;
         let isP = (i===0 && (k.left || k.l0 || this.laneTouch[0])) || (i===1 && (k.down || k.l1 || this.laneTouch[1])) || (i===2 && (k.up || k.l2 || this.laneTouch[2])) || (i===3 && (k.right || k.l3 || this.laneTouch[3]));

         if (this.laneGlow[i] > 0 || isP) {
             let alpha = Math.max(this.laneGlow[i], isP ? 0.3 : 0);
             let grad = ctx.createLinearGradient(0, cvs.height, 0, 0);
             grad.addColorStop(0, this.colors[i]);
             grad.addColorStop(1, 'rgba(0,0,0,0)');
             ctx.globalAlpha = alpha; ctx.fillStyle = grad;
             ctx.fillRect(lcx - 25, 0, 50, cvs.height);
             ctx.globalAlpha = 1;
         }

         ctx.save();
         if (isP) {
             ctx.shadowBlur = 14; ctx.shadowColor = this.colors[i];
         }
         ctx.strokeStyle = this.colors[i]; ctx.lineWidth = isP ? 4 : 2;
         ctx.beginPath(); ctx.arc(lcx, this.lineY, 18, 0, Math.PI * 2); ctx.stroke();
         ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
         ctx.beginPath(); ctx.arc(lcx, this.lineY, 12, 0, Math.PI * 2); ctx.stroke();
         ctx.restore();
         ctx.fillStyle = this.colors[i]; ctx.font = 'bold 18px monospace'; ctx.fillText(this.arrows[i], lcx - 9, this.lineY + 6);
      }

      // ゴーストノーツ(接近予告)
      this.notes.forEach(n => {
        let ghostY = this.lineY - 80;
        if(!n.bad && !n.missed && !n.hit && n.y > ghostY - 20 && n.y < ghostY + 20) {
          let gcx = 25 + n.lane * 50 + laneOffset;
          if(this.mode === 'expert') gcx += Math.sin(ghostY * 0.05 + now * 10) * 10;
          ctx.save();
          ctx.globalAlpha = 0.38;
          ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gcx, ghostY - 14);
          ctx.lineTo(gcx + 10, ghostY - 7);
          ctx.lineTo(gcx + 10, ghostY + 7);
          ctx.lineTo(gcx, ghostY + 14);
          ctx.lineTo(gcx - 10, ghostY + 7);
          ctx.lineTo(gcx - 10, ghostY - 7);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      });

      this.notes.forEach(n => {
        if(!n.missed && !n.hit && n.y > -30 && n.y < 420) {
           let cx = 25 + n.lane * 50 + laneOffset;

           if (this.mode === 'expert') {
               cx += Math.sin(n.y * 0.05 + now * 10) * 10;
           }

           // ダメージノーツ(赤い✖): 押してはいけない
           if (n.bad) {
               ctx.save();
               ctx.shadowBlur = 12; ctx.shadowColor = '#f00';
               ctx.fillStyle = '#300'; ctx.beginPath(); ctx.arc(cx, n.y, 15, 0, Math.PI * 2); ctx.fill();
               ctx.strokeStyle = '#f22'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, n.y, 15, 0, Math.PI * 2); ctx.stroke();
               ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
               ctx.beginPath(); ctx.moveTo(cx - 7, n.y - 7); ctx.lineTo(cx + 7, n.y + 7); ctx.moveTo(cx + 7, n.y - 7); ctx.lineTo(cx - 7, n.y + 7); ctx.stroke();
               ctx.restore();
               return;
           }

           let dist = Math.abs(n.y - this.lineY);
           let glowAmt = Math.max(0, 1 - dist / 200);

           ctx.save();
           if (glowAmt > 0.1) {
               ctx.shadowBlur = 4 + glowAmt * 16;
               ctx.shadowColor = this.colors[n.lane];
           }

           if (this.noteSkin === 0) {
               ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx, n.y, 16, 0, Math.PI * 2); ctx.fill();
               ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, n.y, 16, 0, Math.PI * 2); ctx.stroke();
               ctx.fillStyle = this.colors[n.lane]; ctx.font = 'bold 16px monospace'; ctx.fillText(this.arrows[n.lane], cx - 8, n.y + 5);
           } else if (this.noteSkin === 1) {
               ctx.fillStyle = '#000'; ctx.fillRect(cx-18, n.y-8, 36, 16);
               ctx.strokeStyle = this.colors[n.lane]; ctx.lineWidth = 2; ctx.strokeRect(cx-18, n.y-8, 36, 16);
               ctx.fillStyle = '#fff'; ctx.fillRect(cx-8, n.y-2, 16, 4);
           } else if (this.noteSkin === 2) {
               ctx.fillStyle = this.colors[n.lane]; ctx.beginPath(); ctx.arc(cx, n.y, 14, 0, Math.PI * 2); ctx.fill();
               ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx+4, n.y-4, 4, 0, Math.PI * 2); ctx.fill();
           } else if (this.noteSkin === 3) {
               let nc = this.colors[n.lane];
               ctx.fillStyle = nc;
               ctx.fillRect(cx-6, n.y-14, 12, 4);
               ctx.fillRect(cx-10, n.y-10, 20, 4);
               ctx.fillRect(cx-12, n.y-6, 24, 4);
               ctx.fillRect(cx-12, n.y-2, 24, 4);
               ctx.fillRect(cx-10, n.y+2, 20, 4);
               ctx.fillRect(cx-6, n.y+6, 12, 4);
               ctx.fillStyle = 'rgba(255,255,255,0.55)';
               ctx.fillRect(cx-4, n.y-12, 4, 3);
               ctx.fillRect(cx-8, n.y-8, 4, 3);
               ctx.fillStyle = 'rgba(0,0,0,0.30)';
               ctx.fillRect(cx+4, n.y+2, 6, 4);
               ctx.fillRect(cx+2, n.y+6, 4, 4);
           }

           ctx.restore();
        }
      });
      drawParticles();

      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace'; ctx.fillText(`SCORE: ${Math.floor(this.score)}`, 60, 20);
      if (this.autoPlay) { ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('AUTO PLAY', 140, 20); }

      // EXPERTのHPゲージ
      if (this.mode === 'expert' && !this.autoPlay && (this.st === 'play' || this.st === 'intro')) {
          ctx.fillStyle = '#300'; ctx.fillRect(60, 26, 130, 6);
          ctx.fillStyle = this.hp > 30 ? '#0f8' : '#f33'; ctx.fillRect(60, 26, 130 * (this.hp / 100), 6);
          ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(60, 26, 130, 6);
          ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('HP', 45, 33);
      }

      if(this.combo > 5){
          let size = Math.min(24, 10 + this.combo / 5);
          ctx.fillStyle = '#0ff'; ctx.font = `bold ${size}px monospace`;
          ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
          ctx.fillText(`${this.combo} COMBO!`, 100 - (size*3), 150);
          ctx.shadowBlur = 0;
      }

      for(let j of this.judgements) {
         ctx.save();
         ctx.globalAlpha = j.life / 30;
         let jColor, jShadow;
         if (j.msg === 'PERFECT') {
             let hue = (Date.now() / 5) % 360;
             jColor = `hsl(${hue}, 100%, 65%)`;
             jShadow = `hsl(${hue}, 100%, 85%)`;
         } else if (j.msg === 'GREAT') {
             jColor = '#ffd700'; jShadow = '#ffaa00';
         } else if (j.msg === 'GOOD') {
             jColor = '#00ff88'; jShadow = '#00cc44';
         } else if (j.msg === 'MISS') {
             jColor = '#ff2244'; jShadow = '#880011';
         } else {
             jColor = j.color; jShadow = j.color;
         }
         ctx.fillStyle = jColor; ctx.font = 'bold 12px monospace';
         ctx.shadowBlur = 10; ctx.shadowColor = jShadow;
         let jx = (25 + j.lane * 50) - (j.msg.length * 3.5) + laneOffset;
         ctx.fillText(j.msg, jx, this.lineY - 30 - (30 - j.life));
         ctx.restore();
      }

      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'; ctx.fillRect(5, 5, 40, 20); ctx.strokeStyle = '#f00'; ctx.strokeRect(5, 5, 40, 20);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('EXIT', 12, 18);

      if(this.st === 'play' && now < 0){ ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 200, 400); ctx.fillStyle = '#ff0'; ctx.font = 'bold 40px monospace'; ctx.fillText(Math.ceil(-now), 85, 200); }

      let h = 0;
      if(this.st === 'loading') h = 200;
      else if(this.st === 'intro') h = 200 * (1 - Math.pow(Math.min(1, this.transformTimer / 60), 2));
      if(h > 0) {
          ctx.fillStyle = '#112'; ctx.fillRect(0, 0, 200, h); ctx.fillRect(0, 400 - h, 200, h);
          ctx.fillStyle = '#0ff'; ctx.shadowBlur = 10; ctx.shadowColor = '#0ff'; ctx.fillRect(0, h - 2, 200, 4); ctx.fillRect(0, 400 - h - 2, 200, 4); ctx.shadowBlur = 0;
          if(this.st === 'loading') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 170, 180, 60); ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('ANALYZING TRACK...', 20, 195); ctx.fillRect(50, 210, (Date.now()%1000)/1000*100, 5); }
      }

      // メドレー: 曲の頭に「TRACK n / N」バナー
      if(this.playlist.length > 1 && (this.st === 'intro' || (this.st === 'play' && now < 0))) {
        const slide = this.st === 'intro' ? Math.min(1, this.transformTimer / 30) : 1;
        ctx.save(); ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,40,0.85)'; ctx.fillRect(0, 120, 200, 56 * slide);
        ctx.fillStyle = '#0ff'; ctx.fillRect(0, 120, 200, 2); ctx.fillRect(0, 120 + 56 * slide - 2, 200, 2);
        if(slide >= 1) {
          ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText(`TRACK ${this.trackIndex + 1} / ${this.playlist.length}`, 100, 145);
          let nm = (this.playlist[this.trackIndex] || {name:''}).name; if(nm.length > 24) nm = nm.slice(0, 23) + '…';
          ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(nm, 100, 166);
        }
        ctx.restore();
      }

      if(this.st === 'result') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0,10,20,0.9)'; ctx.fillRect(10, 100, 180, 180); ctx.strokeStyle = '#0ff'; ctx.strokeRect(10, 100, 180, 180);

        let normalCount = this.notes.filter(n => !n.bad).length;
        if (this.failed) {
            ctx.fillStyle = '#f33'; ctx.font = 'bold 16px monospace'; ctx.fillText('FAILED...', 55, 130);
        } else {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText(this.playlist.length > 1 ? 'MEDLEY COMPLETE!' : 'TRACK CLEARED!', this.playlist.length > 1 ? 22 : 30, 130);
        }
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 25, 170); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 25, 190);
        if (this.medleyBonus > 0) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 10px monospace'; ctx.fillText(`MEDLEY x${this.playlist.length}  BONUS +${this.medleyBonus}`, 22, 212); }

        if (this.autoPlay) {
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 24px monospace'; ctx.fillText(`AUTO PLAY`, 30, 240);
        } else if (this.failed) {
            ctx.fillStyle = '#f66'; ctx.font = 'bold 20px monospace'; ctx.fillText(`HP ZERO`, 45, 240);
        } else {
            let rank = this.score > normalCount * 80 ? 'S' : this.score > normalCount * 50 ? 'A' : this.score > normalCount * 30 ? 'B' : 'C';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 30px monospace'; ctx.fillText(`RANK: ${rank}`, 50, 240);
        }
        ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('左上の [EXIT] で戻る', 40, 265);
      }
    }
    ctx.restore();
  }
};
