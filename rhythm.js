// === BEAT BROS - REMASTER V5 ===
// EXPERT追加 / 難易度調整 / 楽譜(MIDI・テキスト)演奏 / NIGHTMARE=ダメージノーツ制

const Rhythm = {
  st: 'menu', mode: 'normal', filterType: 0, settingsCur: 0, hiSpeed: 1.0, noteSkin: 0, autoPlay: false,
  audioBuffer: null, source: null, analyser: null, dataArray: null,
  startTime: 0, notes: [],
  score: 0, combo: 0, maxCombo: 0, judgements: [], transformTimer: 0,
  pendingFile: null, playlist: [], trackIndex: 0,
  hp: 100, failed: false,
  scoreMode: false, isScore: false, scoreEvents: [], scoreIdx: 0, scoreEnd: 0, scoreOut: null,
  touchBound: false, laneTouch: [false,false,false,false], laneGlow: [0,0,0,0],
  arrows: ['←', '↓', '↑', '→'], colors: ['#f0f', '#0ff', '#0f0', '#f00'], lineY: 340,
  video: null, isVideo: false, bgTimer: 0,

  skins: ['CLASSIC', 'CYBER', 'DOT', 'GEM'],
  spds: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0],
  modes: ['easy', 'normal', 'hard', 'expert', 'nightmare'],
  // thr: 音量しきい値の倍率(小さいほど密) / gap: 最短ノーツ間隔(秒) / spd: 落下速度
  cfgs: {
    easy:      { thr: 1.5, gap: 0.32, spd: 200 },
    normal:    { thr: 1.1, gap: 0.22, spd: 300 },
    hard:      { thr: 0.7, gap: 0.13, spd: 400 },
    expert:    { thr: 0.5, gap: 0.09, spd: 440 },
    nightmare: { thr: 0.7, gap: 0.13, spd: 480 }   // 密度はHARDと同じ
  },
  hints: {
    easy: 'のんびり遊べる', normal: '標準の難易度', hard: '高密度の譜面',
    expert: 'HARD超え・同時押しあり', nightmare: '赤い✖は押すな!HP制'
  },
  cfg() { return this.cfgs[this.mode] || this.cfgs.normal; },

  init() {
    this.st = 'menu'; this.mode = 'normal'; this.filterType = 0; this.settingsCur = 0;
    this.hiSpeed = 1.0; this.noteSkin = 0; this.autoPlay = false;
    this.laneTouch = [false,false,false,false]; this.laneGlow = [0,0,0,0];
    this.audioBuffer = null; this.playlist = []; this.trackIndex = 0;
    this.scoreMode = false; this.isScore = false; this.scoreEvents = [];
    this.stopAudio();
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

  // ---------- ファイル選択UI ----------
  makeLoadButton(text, grad, shadow, accept, isScore) {
    let label = document.createElement('label');
    label.style.display = 'inline-block'; label.style.background = grad;
    label.style.color = '#000'; label.style.padding = '8px 10px'; label.style.fontFamily = 'monospace';
    label.style.fontWeight = 'bold'; label.style.fontSize = '10px'; label.style.borderRadius = '5px';
    label.style.cursor = 'pointer'; label.style.boxShadow = shadow;
    label.style.marginBottom = '8px';
    label.innerHTML = text;

    let input = document.createElement('input'); input.type = 'file';
    if(accept) input.accept = accept;
    input.multiple = true; input.style.display = 'none';
    label.onclick = () => { initAudio(); }; label.ontouchstart = () => { initAudio(); };
    input.onchange = (e) => {
      if(e.target.files.length > 0) {
        initAudio(); this.hideFileUI();
        this.scoreMode = isScore;
        this.playlist = Array.from(e.target.files); this.trackIndex = 0;
        this.pendingFile = this.playlist[0];
        e.target.value = ''; this.st = 'settings'; this.settingsCur = 0;
      }
    };
    label.appendChild(input);
    return label;
  },

  showFileUI() {
    let ui = document.getElementById('rhythm-file-ui');
    if(!ui) {
      ui = document.createElement('div'); ui.id = 'rhythm-file-ui';

      ui.style.position = 'absolute'; ui.style.bottom = '40px'; ui.style.left = '50%';
      ui.style.transform = 'translateX(-50%)'; ui.style.zIndex = '100'; ui.style.textAlign = 'center';
      ui.style.width = '85%';
      ui.style.maxWidth = '170px';
      ui.style.boxSizing = 'border-box';
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

      ui.appendChild(this.makeLoadButton('📁 LOAD AUDIO / VIDEO', 'linear-gradient(90deg, #0ff, #08f)', '0 4px 0 #005, 0 0 15px #0ff', 'audio/*, video/*', false));
      ui.appendChild(document.createElement('br'));
      // 楽譜(MIDI / テキスト譜)。端末によってはaccept指定で選べなくなるため絞らない
      ui.appendChild(this.makeLoadButton('🎼 LOAD SCORE (MIDI/TXT)', 'linear-gradient(90deg, #fd0, #f80)', '0 4px 0 #530, 0 0 15px #f80', '', true));

      const container = document.getElementById('screen-container');
      if(container) container.appendChild(ui); else document.body.appendChild(ui);
    }
    ui.style.display = 'block';
  },

  hideFileUI() { let ui = document.getElementById('rhythm-file-ui'); if(ui) ui.style.display = 'none'; },

  stopAudio() {
    if(this.source) {
      try { this.source.onended = null; this.source.stop(); } catch(e) {}
      try { this.source.disconnect(); } catch(e) {}
      this.source = null;
    }
    if(this.scoreOut) { try { this.scoreOut.disconnect(); } catch(e) {} this.scoreOut = null; }
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

    // --- 楽譜 ---
    if(this.scoreMode) {
      this.isScore = true; this.isVideo = false; this.audioBuffer = null;
      reader.onload = e => {
        let ev = null;
        try { ev = this.parseScore(e.target.result); } catch(err) { console.error(err); }
        if(!ev || ev.length === 0) { this.abortLoad('楽譜を読み込めませんでした。'); return; }
        this.scoreEvents = ev;
        if(!this.buildScoreChart()) { this.abortLoad('楽譜の音符が少なすぎます。'); return; }
        this.startPlay();
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // --- 音声 / 動画 ---
    this.isScore = false;
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

          // EXPERT: 強い音では同時押し
          if(this.mode === 'expert' && amp > threshold * 2.2 && Math.random() < 0.35) {
            let l2 = (lane + 1 + Math.floor(Math.random()*3)) % 4;
            this.notes.push({ time: t, lane: l2, hit: false, y: -50, missed: false });
          }
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

  // 並べ替え + NIGHTMAREのダメージノーツ配置
  finalizeNotes() {
    this.notes.sort((a,b) => a.time - b.time);
    if(this.mode === 'nightmare') this.addDamageNotes();
  },

  addDamageNotes() {
    const normals = this.notes.filter(n => !n.bad);
    let lastBad = -9;
    for(let i=0; i<normals.length - 1; i++) {
      let a = normals[i], b = normals[i+1];
      let gap = b.time - a.time;
      if(gap < 0.22) continue;
      let t = a.time + gap / 2;
      if(t - lastBad < 0.8) continue;
      if(Math.random() > 0.3) continue;
      // 本物のノーツと被らないレーンを選ぶ
      let near = normals.slice(Math.max(0, i - 6), i + 8);
      let free = [0,1,2,3].filter(l => !near.some(n => n.lane === l && Math.abs(n.time - t) < 0.4));
      if(free.length === 0) continue;
      this.notes.push({ time: t, lane: free[Math.floor(Math.random() * free.length)], hit: false, y: -50, missed: false, bad: true });
      lastBad = t;
    }
    this.notes.sort((a,b) => a.time - b.time);
  },

  // ---------- 楽譜の解析 ----------
  // 戻り値: [{t(秒), dur(秒), pitch(MIDI番号), vel, trk, drum}] を時刻順に
  parseScore(buf) {
    const u8 = new Uint8Array(buf);
    if(u8.length >= 4 && u8[0] === 0x4D && u8[1] === 0x54 && u8[2] === 0x68 && u8[3] === 0x64) return this.parseMidi(buf);
    let text = '';
    try { text = new TextDecoder('utf-8').decode(u8); } catch(e) { for(let i=0; i<u8.length; i++) text += String.fromCharCode(u8[i]); }
    return this.parseTextScore(text);
  },

  parseMidi(buf) {
    const d = new DataView(buf); let p = 0;
    const tag = () => { let s = ''; for(let i=0; i<4; i++) s += String.fromCharCode(d.getUint8(p + i)); p += 4; return s; };
    const vlq = (end) => { let v = 0, b; do { b = d.getUint8(p++); v = (v << 7) | (b & 0x7f); } while((b & 0x80) && p < end); return v; };

    if(tag() !== 'MThd') return null;
    const hlen = d.getUint32(p); p += 4;
    const division = d.getUint16(p + 4); // ヘッダ: format(2) ntrks(2) division(2)
    p = 8 + hlen;

    let fixedSpt = 0, tpq = division;
    if(division & 0x8000) { const fps = 256 - (division >> 8); const tpf = division & 0xff; fixedSpt = 1 / (fps * tpf); }
    if(!fixedSpt && tpq <= 0) tpq = 480;

    const tempos = [{ tick: 0, uspq: 500000 }];
    const raws = [];

    while(p + 8 <= d.byteLength) {
      const t = tag(); const len = d.getUint32(p); p += 4;
      const end = Math.min(p + len, d.byteLength);
      if(t === 'MTrk') {
        let tick = 0, run = 0; const open = {};
        while(p < end) {
          tick += vlq(end);
          if(p >= end) break;
          let st = d.getUint8(p);
          if(st === 0xFF) {
            p++; const type = d.getUint8(p++); const l = vlq(end);
            if(type === 0x51 && l === 3) tempos.push({ tick, uspq: (d.getUint8(p) << 16) | (d.getUint8(p+1) << 8) | d.getUint8(p+2) });
            p += l;
            if(type === 0x2F) break;
            continue;
          }
          if(st === 0xF0 || st === 0xF7) { p++; const l = vlq(end); p += l; continue; }
          if(st & 0x80) { run = st; p++; }
          const kind = run >> 4, ch = run & 15;
          if(kind === 0xC || kind === 0xD) { p += 1; continue; }
          const a = d.getUint8(p++), c = d.getUint8(p++);
          const key = ch * 128 + a;
          if(kind === 0x9 && c > 0) { (open[key] = open[key] || []).push({ tick, vel: c }); }
          else if(kind === 0x8 || (kind === 0x9 && c === 0)) {
            const stack = open[key];
            if(stack && stack.length) { const s = stack.shift(); raws.push({ t0: s.tick, t1: tick, pitch: a, vel: s.vel, ch }); }
          }
        }
        for(const key in open) for(const s of open[key]) raws.push({ t0: s.tick, t1: Math.max(tick, s.tick + 1), pitch: key % 128, vel: s.vel, ch: Math.floor(key / 128) });
      }
      p = end;
    }

    // テンポマップ(tick→秒)
    tempos.sort((a, b) => a.tick - b.tick);
    const segs = [];
    for(const tp of tempos) {
      const spt = fixedSpt || (tp.uspq / 1e6 / tpq);
      if(segs.length && segs[segs.length - 1].tick === tp.tick) { segs[segs.length - 1].spt = spt; continue; }
      let sec = 0;
      if(segs.length) { const q = segs[segs.length - 1]; sec = q.sec + (tp.tick - q.tick) * q.spt; }
      segs.push({ tick: tp.tick, sec, spt });
    }
    const toSec = (tick) => {
      let s = segs[0];
      for(let i = segs.length - 1; i >= 0; i--) { if(segs[i].tick <= tick) { s = segs[i]; break; } }
      return s.sec + (tick - s.tick) * s.spt;
    };

    const ev = raws.map(r => {
      const t = toSec(r.t0);
      return { t, dur: Math.max(0.05, toSec(r.t1) - t), pitch: r.pitch, vel: r.vel, trk: r.ch, drum: r.ch === 9 };
    });
    ev.sort((a, b) => a.t - b.t);
    return ev;
  },

  // テキスト譜: 1行=1パート(同時進行)。例) TEMPO 120 / C4:4 D4:4 E4:2 R:4 [C4 E4 G4]:2 / C5:8. ※ ':'の後ろは音価(4=四分,8=八分,2=二分) 末尾'.'で付点
  parseTextScore(text) {
    let tempo = 120; const lines = [];
    for(let line of text.split(/\r?\n/)) {
      line = line.replace(/(\/\/|;).*$/, '').trim();
      if(!line) continue;
      const m = line.match(/^(?:TEMPO|BPM)\s*[:=]?\s*(\d+)/i);
      if(m) { tempo = Math.max(30, Math.min(300, +m[1])); continue; }
      lines.push(line);
    }
    const spb = 60 / tempo;
    const base = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
    const toMidi = (s) => {
      const m = s.match(/^([A-Ga-g])([#b]?)(-?\d*)$/);
      if(!m) return null;
      const oct = m[3] === '' ? 4 : parseInt(m[3], 10);
      return 12 * (oct + 1) + base[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    };
    const ev = [];
    const re = /\[([^\]]+)\]\s*:\s*(\d+)(\.?)|([A-Ga-gRr][#b]?-?\d*)\s*:\s*(\d+)(\.?)/g;
    lines.forEach((line, vi) => {
      let t = 0, m; re.lastIndex = 0;
      while((m = re.exec(line)) !== null) {
        const chord = m[1] !== undefined;
        const n = parseInt(chord ? m[2] : m[5], 10) || 4;
        const dot = chord ? m[3] : m[6];
        const sec = (4 / n) * (dot ? 1.5 : 1) * spb;
        const names = chord ? m[1].split(/[\s,]+/).filter(Boolean) : [m[4]];
        for(const nm of names) {
          if(/^r$/i.test(nm)) continue;
          const pitch = toMidi(nm);
          if(pitch !== null) ev.push({ t, dur: sec * 0.9, pitch, vel: 100, trk: vi, drum: false });
        }
        t += sec;
      }
    });
    ev.sort((a, b) => a.t - b.t);
    return ev;
  },

  // ---------- 譜面生成(楽譜) ----------
  buildScoreChart() {
    const cfg = this.cfg();
    const mel = this.scoreEvents.filter(e => !e.drum);
    let endT = 0;
    for(const e of this.scoreEvents) endT = Math.max(endT, e.t + e.dur);
    this.scoreEnd = endT + 1.5;

    // 同時刻の音をまとめる(最高音/最低音を記録)
    const on = [];
    for(const e of mel) {
      const last = on[on.length - 1];
      if(last && e.t - last.t < 0.03) { last.hi = Math.max(last.hi, e.pitch); last.lo = Math.min(last.lo, e.pitch); last.n++; }
      else on.push({ t: e.t, hi: e.pitch, lo: e.pitch, n: 1 });
    }
    if(on.length === 0) return false;

    // 音の高さ → レーン(高さの四分位で振り分け)
    const ps = on.map(o => o.hi).sort((a, b) => a - b);
    const q = [ps[Math.floor(ps.length * 0.25)], ps[Math.floor(ps.length * 0.5)], ps[Math.floor(ps.length * 0.75)]];
    const flat = q[0] === q[2];
    let idx = 0;
    const laneOf = (p) => flat ? (idx % 4) : (p <= q[0] ? 0 : p <= q[1] ? 1 : p <= q[2] ? 2 : 3);

    this.notes = [];
    let lastT = -9;
    for(const o of on) {
      idx++;
      if(o.t - lastT < cfg.gap) continue;
      const lane = laneOf(o.hi);
      this.notes.push({ time: o.t, lane, hit: false, y: -50, missed: false });
      // EXPERT: 和音は低音も同時押し
      if(this.mode === 'expert' && o.n >= 2 && o.hi - o.lo >= 3) {
        const l2 = laneOf(o.lo);
        if(l2 !== lane) this.notes.push({ time: o.t, lane: l2, hit: false, y: -50, missed: false });
      }
      lastT = o.t;
    }
    if(this.notes.length < 4) return false;
    this.finalizeNotes();
    return true;
  },

  // ---------- 楽譜の演奏(シンセ) ----------
  scheduleScore(now) {
    const ev = this.scoreEvents;
    while(this.scoreIdx < ev.length && ev[this.scoreIdx].t < now + 1.0) {
      this.playScoreNote(ev[this.scoreIdx]);
      this.scoreIdx++;
    }
  },

  playScoreNote(e) {
    if(!this.scoreOut) return;
    const t0 = Math.max(audioCtx.currentTime, this.startTime + e.t);
    const v = e.vel / 127;
    if(e.drum) {
      const g = audioCtx.createGain();
      if(e.pitch === 35 || e.pitch === 36) { // キック
        const o = audioCtx.createOscillator(); o.type = 'sine';
        o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(40, t0 + 0.12);
        g.gain.setValueAtTime(0.35 * v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
        o.connect(g); g.connect(this.scoreOut); o.start(t0); o.stop(t0 + 0.2);
      } else if(noiseBuffer) {               // スネア / ハット
        const snare = e.pitch === 38 || e.pitch === 40;
        const s = audioCtx.createBufferSource(); s.buffer = noiseBuffer;
        const dur = snare ? 0.12 : 0.04;
        g.gain.setValueAtTime((snare ? 0.2 : 0.08) * v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        s.connect(g); g.connect(this.scoreOut); s.start(t0); s.stop(t0 + dur + 0.05);
      }
      return;
    }
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = ['square', 'triangle', 'sawtooth', 'sine'][e.trk % 4];
    o.frequency.value = 440 * Math.pow(2, (e.pitch - 69) / 12);
    const vol = 0.09 * v * (o.type === 'sawtooth' ? 0.6 : 1);
    const dur = Math.max(0.08, Math.min(e.dur, 4));
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.scoreOut);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },

  startPlay() {
    this.st = 'intro'; this.transformTimer = 0;

    if(this.trackIndex === 0) {
       this.score = 0; this.combo = 0; this.maxCombo = 0; this.judgements = [];
       this.hp = 100; this.failed = false;
    }

    this.stopAudio();
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    let lastNode;
    if(this.isScore) {
      this.scoreOut = audioCtx.createGain(); this.scoreOut.gain.value = 0.6;
      this.scoreIdx = 0; lastNode = this.scoreOut;
    } else {
      this.source = audioCtx.createBufferSource(); this.source.buffer = this.audioBuffer;
      lastNode = this.source;
    }

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
       this.st = 'intermission'; this.transformTimer = 180;
    } else {
       this.st = 'result'; let finalScore = Math.floor(this.score);

       if(!this.autoPlay) {
           let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {easy:0, normal:0, hard:0, expert:0, nightmare:0};
           if(finalScore > (rData[this.mode]||0)){ rData[this.mode] = finalScore; SaveSys.data.rhythm = rData; SaveSys.save(); }
           SaveSys.addLog('BEAT BROS', `${this.playlist.length > 1 ? 'メドレー' : this.mode.toUpperCase()}${this.isScore ? '(楽譜)' : ''} で スコア${finalScore}`);
       } else {
           SaveSys.addLog('BEAT BROS', `AUTO PLAY で最高にチルった`);
       }
    }
  },

  // NIGHTMARE: HPが尽きたら即終了
  failTrack() {
    this.failed = true; this.st = 'result';
    this.stopAudio();
    if(this.video) { this.video.pause(); }
    SaveSys.addLog('BEAT BROS', `NIGHTMAREで力尽きた…`);
  },

  // NIGHTMAREのわずかなレーンゆらぎ(画面揺れは控えめ)
  laneShift(now) { return this.mode === 'nightmare' ? Math.sin(now * 3) * 6 : 0; },

  hitKey(lane, isAuto=false) {
      if(this.st !== 'play') return;
      let now = audioCtx.currentTime - this.startTime;
      let hitNote = null, minDiff = 999;

      for(let n of this.notes) {
        if(!n.bad && !n.hit && !n.missed && n.lane === lane) {
          let diff = Math.abs(n.time - now);
          if(diff < 0.27 && diff < minDiff){ minDiff = diff; hitNote = n; }
        }
      }

      // 押せるノーツが無く、ダメージノーツの上で押してしまった
      if(!hitNote) {
        if(isAuto || this.mode !== 'nightmare') return;
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
              if (this.mode === 'nightmare') {
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
      let now = audioCtx.currentTime - this.startTime;

      if (this.video && now >= 0 && this.video.paused && !this.video.ended) {
          let p = this.video.play();
          if(p !== undefined) p.catch(e => console.log("Video AutoPlay Blocked", e));
      }

      if(this.isScore) {
          this.scheduleScore(now);
          if(now > this.scoreEnd) { this.handleTrackEnd(); return; }
      }

      let speed = this.cfg().spd * this.hiSpeed;

      // NIGHTMAREの音程ゆらぎ(控えめ)
      if(this.source) {
          this.source.playbackRate.value = (this.mode === 'nightmare' && !this.autoPlay) ? 1.0 + Math.sin(Date.now()/300) * 0.08 : 1.0;
      }

      if (this.autoPlay) {
          for (let i=0; i<4; i++) this.laneTouch[i] = false;
          for (let n of this.notes) {
              if (!n.bad && !n.hit && !n.missed && n.y > -30 && n.y < 420) {
                  let tDiff = n.time - now;
                  if (tDiff <= 0.05 && tDiff > -0.1) {
                      this.laneTouch[n.lane] = true;
                      this.hitKey(n.lane, true);
                  }
              }
          }
      } else {
          if(kD.left || kD.l0) this.hitKey(0); if(kD.down || kD.l1) this.hitKey(1); if(kD.up || kD.l2) this.hitKey(2); if(kD.right|| kD.l3) this.hitKey(3);
          if(this.st !== 'play') return; // ダメージで力尽きた
      }

      for(let i=0; i<4; i++) { if(this.laneGlow[i] > 0) this.laneGlow[i] -= 0.05; }

      for(let n of this.notes) {
        let tDiff = n.time - now;
        let wiggle = (this.mode === 'nightmare') ? Math.sin(now * 10 + n.lane) * 10 : 0;
        n.y = this.lineY - tDiff * speed + wiggle;

        if(!n.hit && !n.missed && n.y > 420) {
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

    let now = audioCtx.currentTime - this.startTime;

    if (this.st === 'menu' || this.st === 'settings') {
        let t = this.bgTimer * 0.05;
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, cvs.width, cvs.height);

        if (this.st === 'settings' && this.mode === 'nightmare') {
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

    if(this.mode === 'nightmare' && this.st === 'play') {
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
      ctx.fillText('音楽ファイル or 楽譜(MIDI/TXT)', 22, 160);
      ctx.fillStyle = '#888'; ctx.fillText('SELECT: 戻る', 65, 280);
    }
    else if(this.st === 'settings') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
      ctx.fillText(this.scoreMode ? 'SCORE LOADED' : 'TRACK LOADED', 40, 40);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';

      let rData = (SaveSys.data && SaveSys.data.rhythm) ? SaveSys.data.rhythm : {};

      let mStr = `MODE: ${this.mode.toUpperCase()}`;
      if(this.mode === 'nightmare') { ctx.fillStyle = '#f00'; if(Math.random()<0.4) mStr = 'M%D#: N1GH!M@R&'; }
      else if(this.mode === 'expert') { ctx.fillStyle = this.settingsCur === 0 ? '#f80' : '#fa5'; }
      else { ctx.fillStyle = this.settingsCur === 0 ? '#ff0' : '#fff'; }
      ctx.fillText((this.settingsCur===0?'> ':'  ') + mStr, 25, 70);

      ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText(`  HI-SCORE: ${rData[this.mode]||0}`, 25, 85);

      ctx.font = '12px monospace';
      const filters = ['OFF', 'RADIO', 'WATER', 'ECHO'];
      ctx.fillStyle = this.settingsCur === 1 ? '#0ff' : '#fff'; ctx.fillText((this.settingsCur===1?'> ':'  ') + `FILTER: ${filters[this.filterType]}`, 25, 110);
      ctx.fillStyle = this.settingsCur === 2 ? '#f0f' : '#fff'; ctx.fillText((this.settingsCur===2?'> ':'  ') + `SPEED: x${this.hiSpeed.toFixed(1)}`, 25, 135);
      ctx.fillStyle = this.settingsCur === 3 ? '#0f0' : '#fff'; ctx.fillText((this.settingsCur===3?'> ':'  ') + `SKIN: ${this.skins[this.noteSkin]}`, 25, 160);
      ctx.fillStyle = this.settingsCur === 4 ? '#ff0' : '#fff'; ctx.fillText((this.settingsCur===4?'> ':'  ') + `AUTO: ${this.autoPlay ? 'ON' : 'OFF'}`, 25, 185);

      ctx.fillStyle = this.settingsCur === 5 ? (this.mode === 'nightmare' ? '#f00' : '#0f0') : '#888';
      ctx.fillText((this.settingsCur===5?'> ':'  ') + `[ EXECUTE ]`, 55, 225);

      ctx.fillStyle = this.mode === 'nightmare' ? '#f66' : '#8cf'; ctx.font = '9px monospace';
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
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText(`TRACK ${this.trackIndex + 1} CLEARED!`, 30, 150);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('NEXT TRACK LOADING...', 30, 180);
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
          if(this.mode === 'nightmare') gcx += Math.sin(ghostY * 0.05 + now * 10) * 10;
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

           if (this.mode === 'nightmare') {
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

      // NIGHTMAREのHPゲージ
      if (this.mode === 'nightmare' && !this.autoPlay && (this.st === 'play' || this.st === 'intro')) {
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
          if(this.st === 'loading') { ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 170, 180, 60); ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText(this.scoreMode ? 'READING SCORE...' : 'ANALYZING TRACK...', 20, 195); ctx.fillRect(50, 210, (Date.now()%1000)/1000*100, 5); }
      }

      if(this.st === 'result') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0,10,20,0.9)'; ctx.fillRect(10, 100, 180, 180); ctx.strokeStyle = '#0ff'; ctx.strokeRect(10, 100, 180, 180);

        let normalCount = this.notes.filter(n => !n.bad).length;
        if (this.failed) {
            ctx.fillStyle = '#f33'; ctx.font = 'bold 16px monospace'; ctx.fillText('FAILED...', 55, 130);
        } else {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('TRACK CLEARED!', 30, 130);
        }
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`SCORE:    ${Math.floor(this.score)}`, 25, 170); ctx.fillText(`MAX COMBO:${this.maxCombo}`, 25, 190);

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
