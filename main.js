const SaveSys = {
  userId: 'player_' + Math.random().toString(36).substr(2, 9),
  isCloudReady: false,
  data: {
    playerName: 'GUEST', actStage: 1, actSeed: 0, actLives: 5,
    musouScore: 0, musouSkills: [], rhythmScore: 0, tetriScore: 0,
    rankings: { n: [], h: [] }, logs: [], bgmVol: 0.5, seVol: 0.5, osFiles: {}
  },

  async init() {
      const localData = localStorage.getItem('4in1_ultimate');
      if (localData) {
          try {
              this.data = JSON.parse(localData);
              console.log("💾 セーブデータを読み込みました");
          } catch (e) {
              console.error("💾 読み込みエラー", e);
          }
      }
      console.log("💾 ローカル保存モード - クラウド同期無効");
      this.isCloudReady = false; 
  },

  save() {
      try {
          localStorage.setItem('4in1_ultimate', JSON.stringify(this.data));
      } catch (e) {
          console.error("💾 保存エラー", e);
      }
  },

  addScore(mode, score) { 
    const rank = mode === 'normal' ? this.data.rankings.n : this.data.rankings.h; 
    rank.push({name: this.data.playerName, score: score, date: Date.now()}); 
    rank.sort((a,b) => b.score - a.score); if (rank.length > 10) rank.splice(10); this.save(); 
  },
  addLog(game, msg) {
    this.data.logs.unshift(`【${game}】${msg}`);
    if(this.data.logs.length > 10) this.data.logs.pop();
    this.save();
  }
};

let audioCtx = null, bgmInterval = null, keys = {}, keysDown = {}, lastKeys = {};
let activeApp = null, canvas = null, ctx = null, screenShakeT = 0;
let particleList = [];
let pointer = { x: 0, y: 0, down: false, clicked: false };

const playSnd = (type) => {
  if (!audioCtx || SaveSys.data.seVol <= 0) return;
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
  if (type === 'jmp') { o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(800, now+0.1); }
  else if (type === 'hit') { o.frequency.setValueAtTime(100, now); o.frequency.linearRampToValueAtTime(10, now+0.2); o.type='square'; }
  else if (type === 'coin') { o.frequency.setValueAtTime(1000, now); o.frequency.setValueAtTime(1300, now+0.05); }
  else if (type === 'sel') { o.frequency.setValueAtTime(600, now); o.frequency.linearRampToValueAtTime(400, now+0.05); }
  else if (type === 'combo') { o.frequency.setValueAtTime(800, now); o.frequency.setValueAtTime(1200, now+0.1); }
  g.gain.setValueAtTime(0.1 * SaveSys.data.seVol, now); g.gain.linearRampToValueAtTime(0, now+0.2);
  o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(now+0.2);
};

const BGM = {
  stop() { if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } },
  play(type) {
    this.stop(); if (!audioCtx) return;
    const mels = {
      menu:   { t1:[262,330,392,523,392,330], t2:[131,165,196,262,196,165], t3:[65,0,98,0,65,0], n:[0,0,1,0,0,1], spd: 300 },
      tetri:  { t1:[330,392,349,330,294,330,349,392], t2:[165,196,174,165,147,165,174,196], t3:[82,82,87,87,73,73,87,87], n:[1,0,1,0,1,0,1,0], spd: 200 },
      action: { t1:[392,440,494,523,494,440,392,349], t2:[196,220,247,262,247,220,196,174], t3:[98,0,123,0,131,0,98,0], n:[1,1,0,1,1,1,0,1], spd: 220 },
      spell:  { t1:[523,659,784,1046], t2:[0,0,0,0], t3:[0,0,0,0], n:[0,0,0,0], spd: 120 }
    };
    const tr = mels[type] || mels.menu; let i = 0;
    bgmInterval = setInterval(() => {
      if (SaveSys.data.bgmVol <= 0) { i++; return; } 
      const now = audioCtx.currentTime; const d = tr.spd / 1000;
      const playNote = (f, w, baseV) => {
        if (!f) return; const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = w; o.frequency.value = f; 
        g.gain.setValueAtTime(baseV * SaveSys.data.bgmVol, now); 
        g.gain.exponentialRampToValueAtTime(0.001, now + d);
        o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + d + 0.1); 
      };
      playNote(tr.t1[i % tr.t1.length], 'square', 0.05);
      playNote(tr.t2[i % tr.t2.length], 'triangle', 0.08);
      playNote(tr.t3[i % tr.t3.length], 'sine', 0.1);
      if (tr.n[i % tr.n.length]) {
        const b = audioCtx.createBufferSource(); const n = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
        const data = n.getChannelData(0); for(let j=0; j<data.length; j++) data[j] = Math.random() * 2 - 1;
        const ng = audioCtx.createGain(); ng.gain.setValueAtTime(0.02 * SaveSys.data.bgmVol, now); ng.gain.linearRampToValueAtTime(0, now+0.05);
        b.buffer = n; b.connect(ng); ng.connect(audioCtx.destination); b.start();
      }
      i++;
    }, tr.spd);
  }
};

const universalPal = {
  '0': 'transparent', '1': '#ffffff', '2': '#000000', '3': '#ff0000', '4': '#00ff00', '5': '#0000ff',
  '6': '#ffff00', '7': '#ff00ff', '8': '#00ffff', '9': '#ffa500', 'a': '#808080', 'b': '#c0c0c0',
  'c': '#800000', 'd': '#008000', 'e': '#000080', 'f': '#808000'
};

const SpriteCache = {
  cache: {},
  get(texKey, color1, scale = 1, flip = false) {
    const key = `${texKey}_${color1}_${scale}_${flip}`;
    if (this.cache[key]) return this.cache[key];
    let t = window.sprs ? window.sprs[texKey] : null;
    if (!t) return null;
    if (typeof t === 'string' || Array.isArray(t)) {
        const d = Array.isArray(t) ? t[0] : t;
        const len = d.length;
        let w = 8, h = 8;
        if (len === 256) { w = 16; h = 16; }
        else if (len === 576) { w = 24; h = 24; }
        else if (len === 64) { w = 8; h = 8; }
        else { const s = Math.sqrt(len); if (s % 1 === 0) { w = s; h = s; } else { w = 16; h = Math.floor(len / 16); } }
        t = { w: w, h: h, d: d };
    }
    const cv = document.createElement('canvas');
    const tw = t.w || 8; const th = t.h || 8;
    cv.width = tw * scale; cv.height = th * scale;
    const cx = cv.getContext('2d');
    if (flip) { cx.translate(cv.width, 0); cx.scale(-1, 1); }
    for (let i = 0; i < t.d.length; i++) {
      const c = t.d[i]; if (c === '0') continue;
      let fill = (c === '1' && color1) ? color1 : universalPal[c];
      if (!fill) fill = '#fff';
      cx.fillStyle = fill;
      cx.fillRect((i % tw) * scale, Math.floor(i / tw) * scale, scale, scale);
    }
    this.cache[key] = cv; return cv;
  }
};

const addParticle = (x, y, color, type) => {
  for(let i=0; i<8; i++) {
    particleList.push({x:x, y:y, vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*4, life:30, color:color, type:type});
  }
};

const drawParticles = () => {
  for(let i=particleList.length-1; i>=0; i--) {
    let p = particleList[i]; p.x += p.vx; p.y += p.vy; p.life--;
    if(p.life <= 0) { particleList.splice(i, 1); continue; }
    ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x - (activeApp.camX || 0), p.y, 2, 2);
  }
  ctx.globalAlpha = 1;
};

const screenShake = (t) => { screenShakeT = t; };
const applyShake = () => { if(screenShakeT > 0) { ctx.save(); ctx.translate((Math.random()-0.5)*screenShakeT, (Math.random()-0.5)*screenShakeT); screenShakeT--; } };
const resetShake = () => { if(screenShakeT >= 0) ctx.restore(); };

const switchApp = (app) => { 
    if(!app) return;
    if(activeApp && activeApp.stop) activeApp.stop(); 
    activeApp = app; 
    activeApp.init(); 
};

const loop = () => {
  keysDown = {}; for(let k in keys) { if(keys[k] && !lastKeys[k]) keysDown[k] = true; }
  lastKeys = {...keys};
  pointer.clicked = false; 
  if(activeApp) { activeApp.update(); activeApp.draw(); }
  requestAnimationFrame(loop);
};

// --- Menu ---
const Menu = {
  cur: 0,
  apps: [],
  init() { 
    this.cur = 0;
    const allApps = [
      { name: '操作説明', obj: Manual },
      { name: 'テトリベーダー(N)', obj: Tetri, mode: 'normal' },
      { name: 'テトリベーダー(H)', obj: Tetri, mode: 'hard' },
      { name: '理不尽ブラザーズ', obj: Action },
      { name: '無限無双', obj: Musou },
      { name: 'ビートブラザーズ', obj: Rhythm },
      { name: 'ロイヤルジョーカー', obj: Online },
      { name: 'アビスジェネラル', obj: Abyss },
      { name: '爆音スニーキング', obj: Noise },
      { name: 'ピクセルビオトープ', obj: Biotope },
      { name: 'カースドマナー', obj: Horror },
      { name: 'ハッカーズ15', obj: PCApp },
      { name: 'レトロスロット', obj: Slot },
      { name: '王様の間', obj: KingRoom },
      { name: 'ランキング', obj: Ranking }
    ];
    this.apps = allApps.filter(a => window[a.obj === Tetri ? 'Tetri' : (a.obj === KingRoom ? 'KingRoom' : a.obj.constructor.name)] || a.obj);
    if(typeof BGM !== 'undefined') BGM.play('menu');
    const gb = document.getElementById('gameboy');
    if (gb) gb.className = '';
    if (canvas) { canvas.width = 200; canvas.height = 300; }
  },
  update() {
    if(keysDown.down){ this.cur=(this.cur+1)%this.apps.length; playSnd('sel'); }
    if(keysDown.up){ this.cur=(this.cur+this.apps.length-1)%this.apps.length; playSnd('sel'); }
    if(keysDown.a){
      playSnd('jmp');
      let target = this.apps[this.cur];
      if(target.mode) target.obj.mode = target.mode;
      switchApp(target.obj);
    }
  },
  draw() {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300);
    ctx.shadowBlur = 10; ctx.shadowColor = '#0f0';
    ctx.fillStyle='#0f0'; ctx.font='bold 16px monospace'; ctx.textAlign='center';
    ctx.fillText('11in1 RETRO', 100, 30);
    ctx.shadowBlur = 0;
    ctx.fillStyle='#fff'; ctx.font='10px monospace';
    ctx.fillText('ENHANCED EDITION', 100, 45);

    ctx.textAlign='left';
    for(let i=0; i<this.apps.length; i++){
      let y = 75 + i * 16;
      if (y > 280) continue;
      ctx.fillStyle = i===this.cur?'#0f0':'#aaa'; 
      ctx.font='11px monospace';
      ctx.fillText((i===this.cur?'> ':'  ')+this.apps[i].name, 15, y);
    }
    ctx.fillStyle='#888'; ctx.font='9px monospace'; ctx.textAlign='center';
    ctx.fillText('PLAYER: '+SaveSys.data.playerName, 100, 295);
  }
};

// --- Manual ---
const Manual = {
  init() {},
  update() { if(keysDown.select || keysDown.b) { switchApp(Menu); } },
  draw() {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300);
    ctx.fillStyle='#0f0'; ctx.font='bold 14px monospace'; ctx.textAlign='center';
    ctx.fillText('【操作説明】', 100, 25);
    ctx.fillStyle='#fff'; ctx.font='11px monospace'; ctx.textAlign='left';
    let t = ["","十字キー: 移動/選択","Aボタン: 決定/攻撃","Bボタン: キャンセル/加速","SELECT: メニューへ戻る","","キーボード:","矢印キー: 移動","Z/Space: A","X: B","Shift: SELECT","","データは自動保存されます"];
    t.forEach((l,i) => ctx.fillText(l, 15, 45+i*18));
  }
};

// --- Ranking Screen ---
const Ranking = {
  mode: 'normal',
  init() { this.mode = 'normal'; },
  update() { if(keysDown.select || keysDown.b) { switchApp(Menu); } },
  draw() {
    ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300);
    ctx.fillStyle='#0f0'; ctx.font='bold 14px monospace'; ctx.textAlign='center';
    ctx.fillText('【ランキング】', 100, 25);
    ctx.fillStyle='#fff'; ctx.font='10px monospace';
    ctx.fillText('COMING SOON...', 100, 150);
  }
};

const initSystem = async () => {
  canvas = document.getElementById('gameCanvas'); ctx = canvas.getContext('2d');
  canvas.width = 200; canvas.height = 300;
  
  const handleKey = (e, v) => {
    const k = {ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', z:'a', x:'b', Enter:'start', Shift:'select'}[e.key];
    if(k) { keys[k] = v; e.preventDefault(); if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  };
  window.addEventListener('keydown', e => handleKey(e, true));
  window.addEventListener('keyup', e => handleKey(e, false));

  const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  };
  const down = (e) => { const p = getPos(e); pointer.x = p.x; pointer.y = p.y; pointer.down = true; pointer.clicked = true; if(!audioCtx) audioCtx = new AudioContext(); };
  const move = (e) => { const p = getPos(e); pointer.x = p.x; pointer.y = p.y; };
  const up = () => { pointer.down = false; };
  canvas.addEventListener('mousedown', down); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', e => { down(e); e.preventDefault(); }, {passive:false});
  canvas.addEventListener('touchmove', e => { move(e); e.preventDefault(); }, {passive:false});
  window.addEventListener('touchend', up);

  requestAnimationFrame(loop);
};

const AISys = { chat: async (msg) => { return "王は沈黙している..."; } };
window.Menu = Menu; 
window.Manual = Manual;
window.Ranking = Ranking;
