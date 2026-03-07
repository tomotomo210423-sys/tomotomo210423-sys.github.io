// === CORE SYSTEM (10in1 Ultimate Edition - BUG FIXED) ===
// 十字キーの初期化時のクラッシュバグを修正した安定版

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const keys = { up: false, down: false, left: false, right: false, a: false, b: false, select: false, l0: false, l1: false, l2: false, l3: false };
const keysDown = { ...keys };
let prevKeys = { ...keys };
const keyPressQueue = { ...keys };
let activeApp = null;

const pointer = { x: 0, y: 0, active: false, path: [] };

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx, noiseBuffer = null, bgmInterval = null;

function initAudio() { 
  if (!audioCtx) {
    audioCtx = new AudioContext(); 
    const bs = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, bs, audioCtx.sampleRate);
    const o = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bs; i++) o[i] = Math.random() * 2 - 1;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume(); 
}

const SaveSys = {
  data: (() => { 
    let d = {}; try { let p = JSON.parse(localStorage.getItem('4in1_ultimate')); if (p && typeof p === 'object') d = p; } catch(e) {} 
    return { 
        playerName: d.playerName || 'PLAYER', 
        scores: d.scores || { n: 0, h: 0 }, 
        rankings: d.rankings || { n: [], h: [] }, 
        bgTheme: d.bgTheme || 0, 
        bgmVol: d.bgmVol !== undefined ? d.bgmVol : 0.5, 
        seVol: d.seVol !== undefined ? d.seVol : 0.8,    
        slotCoins: d.slotCoins || 100, 
        jackpotPool: d.jackpotPool || 1000, 
        actStage: d.actStage||1, 
        actLives: d.actLives||5, 
        actSeed: d.actSeed||1, 
        rhythm: d.rhythm||{easy:0,normal:0,hard:0}, 
        logs: d.logs||[],
        osFiles: d.osFiles||null,
        trashFiles: d.trashFiles||{}
    }; 
  })(),
  save() { localStorage.setItem('4in1_ultimate', JSON.stringify(this.data)); },
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
      playNote(tr.t2[i % tr.t2.length], 'square', 0.03); 
      playNote(tr.t3[i % tr.t3.length], 'triangle', 0.08);
      if (tr.n[i % tr.n.length] > 0 && noiseBuffer) {
        const src = audioCtx.createBufferSource(); const g = audioCtx.createGain(); src.buffer = noiseBuffer; 
        g.gain.setValueAtTime(0.05 * SaveSys.data.bgmVol, now); 
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        src.connect(g); g.connect(audioCtx.destination); src.start(now); src.stop(now + 0.2); 
      }
      i++; 
    }, tr.spd);
  }
};

let hitStopTimer = 0; function hitStop(f) { hitStopTimer = f; }
function playSnd(t) {
  if (!audioCtx || SaveSys.data.seVol <= 0) return; 
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.connect(g); g.connect(audioCtx.destination); const n = audioCtx.currentTime;
  let vol = SaveSys.data.seVol;
  if (t === 'sel') { o.type = 'sine'; o.frequency.setValueAtTime(880, n); g.gain.setValueAtTime(0.1 * vol, n); o.start(n); o.stop(n + 0.05); } 
  else if (t === 'jmp') { o.type = 'square'; o.frequency.setValueAtTime(300, n); o.frequency.exponentialRampToValueAtTime(600, n + 0.1); g.gain.setValueAtTime(0.05 * vol, n); o.start(n); o.stop(n + 0.1); } 
  else if (t === 'hit') { o.type = 'sawtooth'; o.frequency.setValueAtTime(150, n); o.frequency.exponentialRampToValueAtTime(20, n + 0.15); g.gain.setValueAtTime(0.1 * vol, n); o.start(n); o.stop(n + 0.15); screenShake(4); if (typeof Rhythm === 'undefined' || activeApp !== Rhythm) hitStop(3); } 
  else if (t === 'combo') { o.type = 'sine'; o.frequency.setValueAtTime(440, n); o.frequency.setValueAtTime(880, n + 0.05); g.gain.setValueAtTime(0.15 * vol, n); o.start(n); o.stop(n + 0.15); screenShake(2); if (typeof Rhythm === 'undefined' || activeApp !== Rhythm) hitStop(2); }
}

const particles = [];
function addParticle(x, y, color, type = 'star') { const count = type === 'explosion' ? 12 : type === 'line' ? 20 : 5; for (let i = 0; i < count; i++) { particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 1, life: 30 + Math.random()*10, color: color, size: type === 'explosion' ? 3 : 1 }); } }
function updateParticles() { for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; if (p.life <= 0) particles.splice(i, 1); } }
function drawParticles() { particles.forEach(p => { ctx.globalAlpha = p.life / 40; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1; }); }

// ドット絵テクスチャ定義
window.sprs = {
    player: { w:8, h:8, pal:{'1':'#fcc', '2':'#000', '3':'#f00', '4':'#00f'}, d: "..........1111...121121..111111...4444...4.44.4..3.33.3....33..." },
    heroNew: { w:8, h:8, pal:{'1':'#fcc', '2':'#000', '3':'#f00', '4':'#00f'}, d: "..........1111...121121..111111...4444...4.44.4..3.33.3....33..." },
    enemyNew: { w:8, h:8, pal:{'1':'#f00', '2':'#fff', '3':'#000'}, d: "..........1111...111111..231123..111111...1..1...11..11........." },
    coin: { w:8, h:8, pal:{'1':'#ff0', '2':'#fa0'}, d: "..........1111...122221..121121..121121..122221...1111.........." },
    spike: { w:8, h:8, pal:{'1':'#ddd', '2':'#888'}, d: "...................11.....1221....1221...122221..122221.12222221" }
};

const universalPal = {
    '1': '#000', '2': '#fff', '3': '#444', '4': '#888',
    '5': '#f00', '6': '#0f0', '7': '#00f', '8': '#ff0',
    '9': '#f0f', 'a': '#0ff', 'b': '#fa0', 'c': '#f8f',
    'd': '#840', 'e': '#8f8', 'f': '#88f'
};

// バグを排除した最強のドット絵描画関数
function drawSprite(arg1, arg2, arg3, arg4, arg5, arg6) {
    let targetCtx = ctx, x, y, color, spriteObj, scale=1, flip=false;
    
    if (arg1 && arg1.fillRect) {
        targetCtx = arg1; x = arg2; y = arg3; color = arg4; spriteObj = arg5; scale = arg6 || 1; flip = arguments[6] || false;
    } else if (typeof arg1 === 'number') {
        x = arg1; y = arg2; color = arg3; spriteObj = arg4; scale = arg5 || 1; flip = arg6 || false;
    } else if (typeof arg1 === 'string') {
        spriteObj = arg1; x = arg2; y = arg3; scale = arg4 || 1; flip = arg5 || false; color = arg6 || null;
    }
    
    let s = typeof spriteObj === 'string' ? (window.sprs ? window.sprs[spriteObj] : null) : spriteObj;
    if (!s || !s.d) return;

    targetCtx.save();
    targetCtx.translate(x, y);
    if (flip) { targetCtx.scale(-1, 1); targetCtx.translate(-s.w * scale, 0); }
    
    for (let r = 0; r < s.h; r++) {
        for (let col = 0; col < s.w; col++) {
            let p = s.d[r * s.w + col];
            
            if (p === '.' || p === ' ' || p === '0') continue;
            
            let fillCol = color || '#fff';
            if (s.pal && s.pal[p]) { fillCol = s.pal[p]; } 
            else if (!s.pal && universalPal[p]) { fillCol = universalPal[p]; } 
            
            targetCtx.fillStyle = fillCol;
            targetCtx.fillRect(col * scale, r * scale, scale, scale);
        }
    }
    targetCtx.restore();
}

const bgThemes = [
  { name: 'MATRIX', draw: (c) => { c.fillStyle='#000'; c.fillRect(0,0,200,300); c.fillStyle='#0f0'; c.font='10px monospace'; for(let i=0;i<20;i++) c.fillText(String.fromCharCode(0x30A0+Math.floor(Math.random()*96)),(i*10)+(Date.now()/50)%10,(Date.now()/20+i*15)%300); } },
  { name: 'STARS', draw: (c) => { c.fillStyle='#000822'; c.fillRect(0,0,200,300); c.fillStyle='#fff'; for(let i=0;i<50;i++){ const s=1+(i%3); c.fillRect((i*37)%200,(i*67+Date.now()/10)%300,s,s); } } },
  { name: 'GAMEBOY', draw: (c) => { c.fillStyle='#8bac0f'; c.fillRect(0,0,200,300); c.strokeStyle='#9bbc0f'; c.lineWidth=1; for(let i=0;i<200;i+=4){ c.beginPath(); c.moveTo(i,0); c.lineTo(i,300); c.stroke(); } for(let i=0;i<300;i+=4){ c.beginPath(); c.moveTo(0,i); c.lineTo(200,i); c.stroke(); } c.fillStyle='#306230'; c.fillRect(0,0,6,300); c.fillRect(194,0,6,300); c.fillRect(0,0,200,6); c.fillRect(0,294,200,6); } },
  { name: 'CYBERPUNK', draw: (c) => { c.fillStyle='#102'; c.fillRect(0,0,200,300); c.strokeStyle='#f0f'; c.lineWidth=1; let t = Date.now()/20; for(let i=0;i<300;i+=20){ c.beginPath(); c.moveTo(0, (i+t)%300); c.lineTo(200, (i+t)%300); c.stroke(); } c.fillStyle='rgba(0,255,255,0.15)'; c.fillRect(0,0,200,300); } },
  { name: 'SUNSET', draw: (c) => { let g = c.createLinearGradient(0,0,0,300); g.addColorStop(0, '#202'); g.addColorStop(0.5, '#f42'); g.addColorStop(1, '#fa0'); c.fillStyle = g; c.fillRect(0,0,200,300); c.fillStyle='rgba(255,255,255,0.5)'; c.beginPath(); c.arc(100, 200, 60, 0, Math.PI*2); c.fill(); } },
  { name: 'ABYSS', draw: (c) => { c.fillStyle='#000'; c.fillRect(0,0,200,300); let t = Date.now()/1000; for(let i=0; i<3; i++){ c.fillStyle=`hsla(${(t*50+i*120)%360},100%,50%,0.2)`; c.beginPath(); c.arc(100+Math.sin(t+i)*50, 150+Math.cos(t*1.3+i)*80, 80, 0, Math.PI*2); c.fill(); } } }
];

let shakeTimer = 0; 
let isShaking = false;
function screenShake(i = 2) { shakeTimer = i; }
function applyShake() { 
    if (shakeTimer > 0) { 
        isShaking = true; 
        ctx.save(); 
        ctx.translate((Math.random()-0.5)*shakeTimer*2, (Math.random()-0.5)*shakeTimer*2); 
        shakeTimer--; 
    } else {
        isShaking = false;
    }
}
function resetShake() { if (isShaking) { ctx.restore(); isShaking = false; } }

let transTimer = 0; let nextApp = null; 
function switchApp(app) { 
    nextApp = app; transTimer = 20; playSnd('sel'); 
    document.body.className = '';
    document.getElementById('gameboy').className = '';
}
function drawTransition() { if (transTimer > 0) { ctx.fillStyle = '#000'; for(let y=0; y<15; y++) { for(let x=0; x<20; x++) { if ((x + y) < (30 - transTimer)) ctx.fillRect(x * 20, y * 20, 20, 20); } } } }

// ============================================
// メニュー画面
// ============================================
const Menu = {
  cur: 0, 
  apps: ['ゲーム解説館', 'テトリベーダー V2', '理不尽ブラザーズ', 'ONLINE対戦', 'BEAT BROS', 'レトロ・スロット', '無限無双', 'アビス・ジェネラル', '爆音スニーキング', 'ハッカーズ15', 'PIXEL BIOTOPE', 'システム設定', '王様の間'], 
  appColors: ['#0ff', '#ff0', '#f55', '#0f0', '#f0f', '#fd0', '#5af', '#a0f', '#f80', '#08f', '#8f8', '#888', '#fa0'],
  holdTimer: 0,
  
  init() { 
      this.cur = 0; this.holdTimer = 0; BGM.play('menu'); 
      document.body.className = '';
      document.getElementById('gameboy').className = '';
  },
  
  update() {
    if (keys.select) { this.holdTimer++; if (this.holdTimer === 30) { SaveSys.data.bgTheme = (SaveSys.data.bgTheme + 1) % bgThemes.length; SaveSys.save(); playSnd('combo'); } } else { this.holdTimer = 0; }
    if (keysDown.down) { this.cur = (this.cur + 1) % this.apps.length; playSnd('sel'); }
    if (keysDown.up) { this.cur = (this.cur - 1 + this.apps.length) % this.apps.length; playSnd('sel'); }
    
    if (keysDown.a) { 
        const appObjs = [
            typeof Guide !== 'undefined' ? Guide : null, 
            typeof Tetri !== 'undefined' ? Tetri : null, 
            typeof Action !== 'undefined' ? Action : null, 
            typeof Online !== 'undefined' ? Online : null, 
            typeof Rhythm !== 'undefined' ? Rhythm : null, 
            typeof Slot !== 'undefined' ? Slot : null, 
            typeof Musou !== 'undefined' ? Musou : null, 
            typeof Abyss !== 'undefined' ? Abyss : null, 
            typeof Noise !== 'undefined' ? Noise : null, 
            typeof PCApp !== 'undefined' ? PCApp : null, 
            typeof Biotope !== 'undefined' ? Biotope : null, // ★ BIOTOPE起動
            typeof Settings !== 'undefined' ? Settings : null, 
            typeof KingRoom !== 'undefined' ? KingRoom : null
        ]; 
        if (appObjs[this.cur]) { switchApp(appObjs[this.cur]); } else { playSnd('hit'); }
    }
  },
  
  draw() {
    bgThemes[SaveSys.data.bgTheme].draw(ctx); 
    
    // ★ タイトルを 10in1 に書き換え！
    ctx.shadowBlur = 10; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; 
    ctx.fillText('10in1 RETRO', 50, 25); ctx.shadowBlur = 0; 
    ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('ULTIMATE v16.1', 60, 40); // バグ修正版
    
    let startY = 63;
    let drawStart = Math.max(0, this.cur - 8);
    for (let i = drawStart; i < Math.min(this.apps.length, drawStart + 10); i++) { 
        let col = this.appColors[i];
        ctx.font = 'bold 11px monospace'; 
        
        if (i === this.cur) {
            ctx.fillStyle = col;
            ctx.fillRect(8, startY + (i - drawStart) * 19 - 11, 184, 15);
            ctx.fillStyle = '#000';
            ctx.fillText('▶ ' + this.apps[i], 12, startY + (i - drawStart) * 19); 
        } else {
            ctx.fillStyle = col;
            ctx.fillText('  ' + this.apps[i], 12, startY + (i - drawStart) * 19); 
        }
    }
    
    ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('PLAYER: ' + SaveSys.data.playerName, 10, 275); 
    ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText(`BG: ${bgThemes[SaveSys.data.bgTheme].name}`, 10, 288);
  }
};

const Settings = {
  cur: 0, tmr: 0,
  init() { this.cur = 0; this.tmr = 0; },
  update() {
    this.tmr++;
    if (keysDown.select || keysDown.b) { switchApp(Menu); return; }
    if (keysDown.up) { this.cur = (this.cur - 1 + 3) % 3; playSnd('sel'); } 
    if (keysDown.down) { this.cur = (this.cur + 1) % 3; playSnd('sel'); }
    
    if (this.cur === 0) {
        if (keysDown.left) { SaveSys.data.bgTheme = (SaveSys.data.bgTheme - 1 + bgThemes.length) % bgThemes.length; SaveSys.save(); playSnd('combo'); }
        if (keysDown.right || keysDown.a) { SaveSys.data.bgTheme = (SaveSys.data.bgTheme + 1) % bgThemes.length; SaveSys.save(); playSnd('combo'); }
    }
    else if (this.cur === 1) {
        if (keys.left && this.tmr % 4 === 0) { SaveSys.data.bgmVol = Math.max(0, SaveSys.data.bgmVol - 0.1); SaveSys.save(); }
        if (keys.right && this.tmr % 4 === 0) { SaveSys.data.bgmVol = Math.min(1.0, SaveSys.data.bgmVol + 0.1); SaveSys.save(); }
    }
    else if (this.cur === 2) {
        if (keys.left && this.tmr % 4 === 0) { SaveSys.data.seVol = Math.max(0, SaveSys.data.seVol - 0.1); SaveSys.save(); playSnd('sel'); }
        if (keys.right && this.tmr % 4 === 0) { SaveSys.data.seVol = Math.min(1.0, SaveSys.data.seVol + 0.1); SaveSys.save(); playSnd('sel'); }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300); 
    ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【SYSTEM SETTINGS】', 25, 30);
    ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(190, 40); ctx.stroke();
    
    let items = [
      { label: 'BACKGROUND', val: `< ${bgThemes[SaveSys.data.bgTheme].name} >` },
      { label: 'BGM VOLUME', val: `< ${Math.round(SaveSys.data.bgmVol * 100).toString().padStart(3,' ')}% >` },
      { label: 'SE  VOLUME', val: `< ${Math.round(SaveSys.data.seVol * 100).toString().padStart(3,' ')}% >` }
    ];
    
    for (let i = 0; i < items.length; i++) {
      let y = 80 + i * 45;
      ctx.fillStyle = this.cur === i ? '#ff0' : '#fff';
      ctx.font = this.cur === i ? 'bold 12px monospace' : '11px monospace';
      ctx.fillText((this.cur === i ? '▶ ' : '  ') + items[i].label, 15, y);
      
      ctx.fillStyle = this.cur === i ? '#0ff' : '#888';
      ctx.fillText(items[i].val, 40, y + 18);
    }
    
    ctx.fillStyle = '#112'; ctx.fillRect(0, 270, 200, 30);
    ctx.fillStyle = '#666'; ctx.font = '9px monospace'; 
    ctx.fillText('SELECT/B: 戻る  ◀▶: 調整', 30, 285);
  }
};

function loop() {
  try {
    if (hitStopTimer <= 0) { 
      for (let k in keys) { 
        keysDown[k] = (keys[k] && !prevKeys[k]) || keyPressQueue[k]; 
        keyPressQueue[k] = false; 
        prevKeys[k] = keys[k]; 
      } 
    }
    
    if (transTimer > 0) { 
        transTimer--; 
        if (transTimer === 0 && nextApp) { activeApp = nextApp; activeApp.init(); nextApp = null; } 
    } 
    else if (hitStopTimer > 0) { hitStopTimer--; } 
    else { if (activeApp && activeApp.update) activeApp.update(); }
    
    ctx.save();
    applyShake();
    
    if (activeApp && activeApp.draw) activeApp.draw(); 
    
    resetShake();
    ctx.restore();
    
    drawTransition();
    
    ['up', 'down', 'left', 'right'].forEach(dir => {
      const btn = document.getElementById('btn-' + dir);
      if (btn) {
        btn.style.background = keys[dir] ? '#111' : '';
        btn.style.transform = keys[dir] ? 'translateY(2px)' : '';
      }
    });

  } catch (err) {
    console.error(err); 
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = "rgba(150,0,0,0.95)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height); 
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 14px monospace"; 
    ctx.fillText("SYSTEM CRASHED", 10, 30);
    
    ctx.fillStyle = "#ff0";
    ctx.font = "10px monospace"; 
    
    let msg = err.name + ": " + err.message;
    let words = msg.match(/.{1,30}/g) || [];
    for(let i=0; i<words.length; i++) {
        ctx.fillText(words[i], 10, 50 + i*15);
    }
    ctx.fillStyle = "#fff";
    ctx.fillText("AIにこの画面を見せて！", 10, 280);
  }
  requestAnimationFrame(loop);
}

const setBtn = (id, k) => {
  const e = document.getElementById(id); if (!e) return;
  const p = (ev) => { ev.preventDefault(); keys[k] = true; keyPressQueue[k] = true; initAudio(); };
  const r = (ev) => { ev.preventDefault(); keys[k] = false; };
  e.addEventListener('touchstart', p, {passive: false}); e.addEventListener('touchend', r, {passive: false}); e.addEventListener('touchcancel', r, {passive: false});
  e.addEventListener('mousedown', p); e.addEventListener('mouseup', r); e.addEventListener('mouseleave', r);
};

['btn-a','btn-b','btn-select'].forEach((id, i) => { setBtn(id, ['a','b','select'][i]); });
['btn-slot-bet','btn-slot-max','btn-slot-spin'].forEach((id, i) => { setBtn(id, ['up','b','a'][i]); });

// 十字キー (D-pad) の処理 - バグ修正済み
const dpad = document.getElementById('dpad');
let dpadActive = false;

const handleDpad = (ev) => {
  ev.preventDefault();
  if (!dpadActive && ev.type !== 'touchstart' && ev.type !== 'mousedown') return;
  
  // バグ修正: getBoundingClientRect()が undefined になるのを防ぐ nullチェック
  if (!dpad) return; 
  let rect = dpad.getBoundingClientRect();
  if (!rect || rect.width === 0) return; // 描画前は無視

  if (ev.type === 'touchstart' || ev.type === 'mousedown') { dpadActive = true; initAudio(); }
  
  let clientX, clientY;
  if (ev.targetTouches && ev.targetTouches.length > 0) { 
      clientX = ev.targetTouches[0].clientX; clientY = ev.targetTouches[0].clientY; 
  } else if (ev.touches && ev.touches.length > 0) { 
      clientX = ev.touches[0].clientX; clientY = ev.touches[0].clientY; 
  } else { 
      clientX = ev.clientX; clientY = ev.clientY; 
  }
  
  const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
  const dx = clientX - centerX; const dy = clientY - centerY; const dist = Math.hypot(dx, dy);
  
  let newKeys = { up: false, down: false, left: false, right: false };
  if (dist > 15) {
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle > -67.5 && angle < 67.5) newKeys.right = true;
    if (angle > 112.5 || angle < -112.5) newKeys.left = true;
    if (angle > 22.5 && angle < 157.5) newKeys.down = true;
    if (angle < -22.5 && angle > -157.5) newKeys.up = true;
  }
  
  ['up', 'down', 'left', 'right'].forEach(k => { if (newKeys[k] && !keys[k]) keyPressQueue[k] = true; keys[k] = newKeys[k]; });
};

const releaseDpad = (ev) => { ev.preventDefault(); dpadActive = false; keys.up = keys.down = keys.left = keys.right = false; };

if (dpad) {
  dpad.addEventListener('touchstart', handleDpad, {passive: false}); dpad.addEventListener('touchmove', handleDpad, {passive: false});
  dpad.addEventListener('touchend', releaseDpad, {passive: false}); dpad.addEventListener('touchcancel', releaseDpad, {passive: false});
  dpad.addEventListener('mousedown', handleDpad); window.addEventListener('mousemove', (ev) => { if (dpadActive) handleDpad(ev); }); window.addEventListener('mouseup', (ev) => { if (dpadActive) releaseDpad(ev); });
}

// ポインターイベント処理 (TAP配置用)
const getPointerPos = (e) => {
  // バグ修正: e または touches が undefined になるのを防ぐ nullチェック
  if (!e) return {clientX:0, clientY:0};
  let touch;
  if (e.targetTouches && e.targetTouches.length > 0) { touch = e.targetTouches[0]; } 
  else if (e.touches && e.touches.length > 0) { touch = e.touches[0]; } 
  
  if (touch) return { clientX: touch.clientX, clientY: touch.clientY };
  return { clientX: e.clientX, clientY: e.clientY }; // Mouse event
};

const handlePointerDown = (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect(); 
  if (!rect) return;
  const pos = getPointerPos(e);
  pointer.active = true;
  pointer.x = (pos.clientX - rect.left) * (canvas.width / rect.width); pointer.y = (pos.clientY - rect.top) * (canvas.height / rect.height);
  pointer.path = [{x: pointer.x, y: pointer.y}];
};

const handlePointerMove = (e) => {
  if (!pointer.active) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect(); 
  if (!rect) return;
  const pos = getPointerPos(e);
  pointer.x = (pos.clientX - rect.left) * (canvas.width / rect.width); pointer.y = (pos.clientY - rect.top) * (canvas.height / rect.height);
  let last = pointer.path[pointer.path.length-1];
  if (last && Math.hypot(pointer.x - last.x, pointer.y - last.y) > 5) { pointer.path.push({x: pointer.x, y: pointer.y}); }
};

const handlePointerUp = (e) => { e.preventDefault(); pointer.active = false; };

canvas.addEventListener('mousedown', handlePointerDown); canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp); canvas.addEventListener('mouseleave', handlePointerUp);
canvas.addEventListener('touchstart', handlePointerDown, {passive: false}); canvas.addEventListener('touchmove', handlePointerMove, {passive: false}); canvas.addEventListener('touchend', handlePointerUp, {passive: false});

// キーボードイベント
window.addEventListener('keydown', e => {
  let k = e.key.toLowerCase();
  if (e.key === 'ArrowUp') { keys.up = true; keyPressQueue.up = true; initAudio(); } 
  if (e.key === 'ArrowDown') { keys.down = true; keyPressQueue.down = true; initAudio(); }
  if (e.key === 'ArrowLeft') { keys.left = true; keyPressQueue.left = true; initAudio(); } 
  if (e.key === 'ArrowRight') { keys.right = true; keyPressQueue.right = true; initAudio(); }
  if (k === 'z' || e.key === ' ') { keys.a = true; keyPressQueue.a = true; initAudio(); } 
  if (k === 'x') { keys.b = true; keyPressQueue.b = true; initAudio(); }
  if (e.key === 'Shift') { keys.select = true; keyPressQueue.select = true; initAudio(); }
});

window.addEventListener('keyup', e => {
  let k = e.key.toLowerCase();
  if (e.key === 'ArrowUp') keys.up = false; if (e.key === 'ArrowDown') keys.down = false;
  if (e.key === 'ArrowLeft') keys.left = false; if (e.key === 'ArrowRight') keys.right = false;
  if (k === 'z' || e.key === ' ') keys.a = false; if (k === 'x') keys.b = false;
  if (e.key === 'Shift') keys.select = false;
});

const unlockAudio = () => {
  if (typeof audioCtx !== 'undefined' && audioCtx !== null) {
    if (audioCtx.state === 'suspended') { audioCtx.resume().then(() => { console.log("Audio Unlocked!"); }).catch(err => console.error(err)); }
  }
};
window.addEventListener('touchstart', unlockAudio, { passive: true });
window.addEventListener('mousedown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
