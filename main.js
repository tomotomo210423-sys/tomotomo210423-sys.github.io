// === CORE SYSTEM - ULTIMATE EVOLUTION (BGM, JUICE, BACKUP) ===
const ctx = document.getElementById('gameCanvas').getContext('2d');
const keys = {up:false, down:false, left:false, right:false, a:false, b:false, select:false};
const keysDown = {up:false, down:false, left:false, right:false, a:false, b:false, select:false};
let prevKeys = {...keys};
let activeApp = null;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let noiseBuffer = null;
function initAudio() { 
  if (!audioCtx) {
    audioCtx = new AudioContext(); 
    const bufferSize = audioCtx.sampleRate * 2;
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
  }
  if (audioCtx.state === 'suspended') audioCtx.resume(); 
}

// ★ 究極進化1: 4トラック本格レトロBGMエンジン
let bgmOsc = [], bgmGain = [], bgmInterval = null;
const BGM = {
  stop() { bgmOsc.forEach(o => o.stop()); bgmOsc = []; if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } },
  play(type) {
    this.stop(); if (!audioCtx) return;
    const t = audioCtx.currentTime;
    const mels = {
      menu: { t1:[262,330,392,523,392,330], t2:[131,165,196,262,196,165], t3:[65,0,98,0,65,0], n:[0,0,1,0,0,1], spd: 300 },
      tetri: { t1:[330,392,349,330,294,330,349,392], t2:[165,196,174,165,147,165,174,196], t3:[82,82,87,87,73,73,87,87], n:[1,0,1,0,1,0,1,0], spd: 200 },
      action: { t1:[392,440,494,523,494,440,392,349], t2:[196,220,247,262,247,220,196,174], t3:[98,0,123,0,131,0,98,0], n:[1,1,0,1,1,1,0,1], spd: 220 },
      rpg_field: { t1:[262,294,330,349,392,440,494,523], t2:[131,0,165,0,196,0,247,0], t3:[65,65,73,73,82,82,98,98], n:[0,0,0,0,0,0,0,0], spd: 350 },
      rpg_battle: { t1:[440,494,523,587,659,587,523,494], t2:[220,247,262,294,330,294,262,247], t3:[110,110,110,110,110,110,110,110], n:[1,0,1,0,1,0,1,0], spd: 150 },
      rpg_boss: { t1:[329,311,329,246,293,261,220,0], t2:[164,155,164,123,146,130,110,0], t3:[82,82,82,82,77,77,77,77], n:[1,1,1,1,1,1,1,1], spd: 180 }
    };
    const track = mels[type] || mels.menu; let i = 0;
    
    bgmInterval = setInterval(() => {
      bgmOsc.forEach(o => o.stop()); bgmOsc = [];
      const playNote = (freq, wave, vol) => {
        if (!freq) return;
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = wave; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (track.spd/1000));
        o.connect(g); g.connect(audioCtx.destination); o.start(); bgmOsc.push(o);
      };
      playNote(track.t1[i % track.t1.length], 'square', 0.05); // 主旋律
      playNote(track.t2[i % track.t2.length], 'square', 0.03); // 副旋律
      playNote(track.t3[i % track.t3.length], 'triangle', 0.08); // ベース
      
      if (track.n[i % track.n.length] > 0 && noiseBuffer) {
        const src = audioCtx.createBufferSource(); const g = audioCtx.createGain();
        src.buffer = noiseBuffer; g.gain.setValueAtTime(0.05, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        src.connect(g); g.connect(audioCtx.destination); src.start(); bgmOsc.push(src);
      }
      i++;
    }, track.spd);
  }
};

// ★ 究極進化2: 汁気（Juice）の追加 - ヒットストップ機能
let hitStopTimer = 0;
function hitStop(frames) { hitStopTimer = frames; }

function playSnd(t) {
  if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gn = audioCtx.createGain(); osc.connect(gn); gn.connect(audioCtx.destination); const n = audioCtx.currentTime;
  if (t === 'sel') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, n); gn.gain.setValueAtTime(0.1, n); osc.start(n); osc.stop(n + 0.05); } 
  else if (t === 'jmp') { osc.type = 'square'; osc.frequency.setValueAtTime(300, n); osc.frequency.exponentialRampToValueAtTime(600, n+0.1); gn.gain.setValueAtTime(0.05, n); osc.start(n); osc.stop(n+0.1); } 
  else if (t === 'hit') { 
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, n); osc.frequency.exponentialRampToValueAtTime(20, n+0.15); gn.gain.setValueAtTime(0.1, n); osc.start(n); osc.stop(n+0.15); 
    // ★ 音と同時に自動で画面揺れ＆ヒットストップ発動（全ゲームに適用）
    screenShake(4); hitStop(3);
  } 
  else if (t === 'combo') { 
    osc.type = 'sine'; osc.frequency.setValueAtTime(440, n); osc.frequency.setValueAtTime(880, n + 0.05); gn.gain.setValueAtTime(0.15, n); osc.start(n); osc.stop(n+0.15); 
    screenShake(2); hitStop(2);
  }
}

// セーブシステム (異常防止のため構造は前回の安定版を維持)
const SaveSys = {
  data: JSON.parse(localStorage.getItem('4in1_ultimate')) || { playerName: 'PLAYER', scores: {n:0, h:0}, actStage: 1, actLives: 5, actSeed: Math.floor(Math.random()*1000), rpg: null, rankings: {n:[], h:[]}, bgTheme: 0 },
  save() { localStorage.setItem('4in1_ultimate', JSON.stringify(this.data)); },
  addScore(mode, score) { const rank = mode === 'normal' ? this.data.rankings.n : this.data.rankings.h; rank.push({name: this.data.playerName, score: score, date: Date.now()}); rank.sort((a,b) => b.score - a.score); if (rank.length > 10) rank.splice(10); this.save(); }
};

const bgThemes = [
  { name: 'MATRIX', draw: (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#0f0'; ctx.font = '10px monospace'; for (let i = 0; i < 20; i++) { ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)), (i * 10) + (Date.now() / 50) % 10, (Date.now() / 20 + i * 15) % 300); } } },
  { name: 'STARS', draw: (ctx) => { ctx.fillStyle = '#000822'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { const s = 1 + (i % 3); ctx.fillRect((i * 37) % 200, (i * 67 + Date.now() / 10) % 300, s, s); } } },
  { name: 'GAMEBOY', draw: (ctx) => { ctx.fillStyle = '#8bac0f'; ctx.fillRect(0, 0, 200, 300); ctx.strokeStyle = '#9bbc0f'; ctx.lineWidth = 1; for (let i = 0; i < 200; i += 4) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 300); ctx.stroke(); } for (let i = 0; i < 300; i += 4) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); } ctx.fillStyle = '#306230'; ctx.fillRect(0, 0, 6, 300); ctx.fillRect(194, 0, 6, 300); ctx.fillRect(0, 0, 200, 6); ctx.fillRect(0, 294, 200, 6); } }
];

const particles = [];
function addParticle(x, y, color, type = 'star') { const count = type === 'explosion' ? 12 : type === 'line' ? 20 : 5; for (let i = 0; i < count; i++) { particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6 - 1, life: 30 + Math.random()*10, color: color, size: type === 'explosion' ? 3 : 1 }); } }
function updateParticles() { for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; if (p.life <= 0) particles.splice(i, 1); } }
function drawParticles() { particles.forEach(p => { ctx.globalAlpha = p.life / 40; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1; }); }

let shakeTimer = 0;
function screenShake(intensity = 2) { shakeTimer = intensity; }
function applyShake() { if (shakeTimer > 0) { ctx.save(); ctx.translate((Math.random() - 0.5) * shakeTimer * 2, (Math.random() - 0.5) * shakeTimer * 2); shakeTimer--; } }
function resetShake() { if (shakeTimer >= 0) ctx.restore(); }

const PALETTE = { '2':'#fff','3':'#000','4':'#fcc','5':'#f00','6':'#0a0','7':'#00f','8':'#ff0','9':'#842','a':'#aaa','b':'#0ff','c':'#f0f','d':'#80f','e':'#531','f':'#141' };
const drawSprite = (x, y, color, strData, size = 2.5) => {
  if (!strData) return;
  const str = Array.isArray(strData) ? strData[Math.floor(Date.now() / 300) % strData.length] : strData;
  const len = str.length > 100 ? 16 : 8; const dotSize = (8 / len) * size;
  for (let i = 0; i < str.length; i++) {
    if (i >= len * len) break;
    const char = str[i]; if (char === '0') continue;
    ctx.fillStyle = (char === '1') ? color : (PALETTE[char] || color);
    ctx.fillRect(x + (i % len) * dotSize, y + Math.floor(i / len) * dotSize, dotSize, dotSize);
  }
};

const sprs = {
  player: ["0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000a031111300000000a031111300000000a033333300000008880330330000000080033033000000000033303330000", "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000003111130a00000003111130a00000003333330a00000330330888000003303300800000033303330000000"],
  heroNew: "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000a031111300000000a031111300000000a033333300000008880330330000000080033033000000000033303330000",
  slime: ["000000000000000000000000000000000000000000000000000000011000000000000011110000000000011211100000000011111111000000011111111110000001131111311000001113111131110000111111111111000011111111111100011111111111111001111111111111100011111111111100000000000000000", "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000011111000000000011211110000000011111111100000001131111311000001113111131110001111111111111100111111111111110011111111111111011111111111111110111111111111110"],
  enemyNew: ["000000000000000000000300000003000000313000003130000311300003113000311130003111300311113303311113311111133311111131111111111111113111111111111111311311111111131131303111111130313300033111330003000000033300000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000030000000000000033300000000000033313000000000031331130003300031133111303113031113031113311331113003111111111111300031111111111300000313111131300000003033330300000000000000000000000000000000000000000000000"],
  fighter: "000000033000000000000032230000000000032bb23000000000032bb23000000003332bb23330000032222bb2222300032bb22bb22bb23032bbbb2bb2bbbb233333333bb333333300000322223000000000032bb2300000000000333333300000000005555000000000000055000000000000000000000000000000000000000",
  peperoncino: "000000000000000000000000000000000000033300000000000038583000000000038258300000000038888888300000038898898830000032222222223000003a22a2a2a230000032a2a2a2a230000003222222223000000033333333000000000000000000000000000000000000000000000000000000000000000000000000",
  grass:["0000000000600666006000000000000000000000000000000000000000000000","0000000000060066000000000000000000000000000000000000000000000000"],
  coin: ["0003300000388300038888300383830003838300038383000038830000033000","0003300000388300038888300388883003888830038888300038830000033000"]
};

// ★ 究極進化3: トランジション（画面遷移演出）
let transTimer = 0; let nextApp = null;
function switchApp(app) {
  nextApp = app; transTimer = 20; playSnd('sel');
}
function drawTransition() {
  if (transTimer > 0) {
    ctx.fillStyle = '#000';
    for(let y=0; y<15; y++) { for(let x=0; x<10; x++) {
      if ((x+y) < (20 - transTimer)) ctx.fillRect(x*20, y*20, 20, 20);
    }}
  }
}

const Menu = {
  cur: 0, apps: ['ゲーム解説館', 'テトリベーダー', '理不尽ブラザーズ', 'マイクロクエスト', 'ONLINE対戦', 'ローカルランキング', '設定', 'データ引継ぎ'],
  init() { this.cur = 0; BGM.play('menu'); },
  update() {
    if (keysDown.down) { this.cur = (this.cur + 1) % 8; playSnd('sel'); }
    if (keysDown.up) { this.cur = (this.cur + 7) % 8; playSnd('sel'); }
    if (keysDown.a) { 
      const appObjs = [Guide, Tetri, Action, RPG, Online, Ranking, Settings, DataBackup]; 
      switchApp(appObjs[this.cur]); // ★ トランジション付きで遷移
    }
  },
  draw() {
    bgThemes[SaveSys.data.bgTheme].draw(ctx);
    ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('4in1 RETRO', 55, 30);
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i === this.cur ? '#0f0' : '#aaa'; ctx.fillText((i === this.cur ? '> ' : '  ') + this.apps[i], 15, 65 + i * 25); }
  }
};

// ★ 究極進化4: セーブデータ永久保存（パスワード入出力）システム
const DataBackup = {
  st: 'menu', backupStr: '', msg: '',
  init() { this.st = 'menu'; this.msg = ''; },
  update() {
    if (this.st === 'msg') { if (keysDown.a || keysDown.b) this.st = 'menu'; return; }
    if (keysDown.select || keysDown.b) { switchApp(Menu); return; }
    if (keysDown.up || keysDown.down) playSnd('sel');
    if (keysDown.a) {
      if (keys.up) { // エクスポート
        try { 
          // 日本語対応の安全なエンコード
          this.backupStr = btoa(unescape(encodeURIComponent(JSON.stringify(SaveSys.data))));
          navigator.clipboard.writeText(this.backupStr).then(()=> { this.msg = 'コピー完了！\nメモ帳に保存せよ'; this.st = 'msg'; playSnd('combo'); }).catch(e=> { this.msg = 'コピー失敗...'; this.st = 'msg'; });
        } catch(e) { this.msg = 'データ変換エラー'; this.st = 'msg'; playSnd('hit'); }
      } else if (keys.down) { // インポート
        const input = prompt("復活の呪文（パスワード）を入力してください:");
        if (input) {
          try {
            const parsed = JSON.parse(decodeURIComponent(escape(atob(input))));
            if (parsed && parsed.playerName) { SaveSys.data = parsed; SaveSys.save(); this.msg = 'データ復元成功！'; this.st = 'msg'; playSnd('combo'); } 
            else throw new Error('Invalid Format');
          } catch(e) { this.msg = '呪文が違います！'; this.st = 'msg'; playSnd('hit'); }
        }
      }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0,0,200,300);
    ctx.fillStyle = '#ff0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【データ引き継ぎ】', 30, 40);
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
    ctx.fillText('機種変更やバックアップ', 15, 80); ctx.fillText('のためにパスワードを', 15, 95); ctx.fillText('出力/読込します。', 15, 110);
    
    ctx.fillStyle = '#0f0'; ctx.fillRect(20, 160, 160, 30); ctx.fillStyle = '#000'; ctx.fillText('↑+A: 呪文をコピー', 45, 180);
    ctx.fillStyle = '#f80'; ctx.fillRect(20, 210, 160, 30); ctx.fillStyle = '#000'; ctx.fillText('↓+A: 呪文を入力', 50, 230);
    
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 100, 180, 80); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 100, 180, 80);
      ctx.fillStyle = '#fff'; let arr = this.msg.split('\n'); for(let i=0; i<arr.length; i++) ctx.fillText(arr[i], 30, 130 + i*20);
    }
  }
};

const Ranking = { /* 略: 既存通り */ init(){}, update(){ if(keysDown.b) switchApp(Menu); }, draw(){ ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300); ctx.fillStyle='#fff'; ctx.fillText('RANKING (B to return)', 10, 50); } };
const Settings = { /* 略: 既存通り */ init(){}, update(){ if(keysDown.b) switchApp(Menu); }, draw(){ ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300); ctx.fillStyle='#fff'; ctx.fillText('SETTINGS (B to return)', 10, 50); } };

// フリーズ防止＆ヒットストップ統合ループ
function loop() {
  try {
    for (let k in keys) { keysDown[k] = keys[k] && !prevKeys[k]; prevKeys[k] = keys[k]; }
    
    // トランジション処理
    if (transTimer > 0) {
      transTimer--;
      if (transTimer === 0 && nextApp) { activeApp = nextApp; activeApp.init(); nextApp = null; }
    } else if (hitStopTimer > 0) {
      // ★ ヒットストップ中は update() を呼ばず画面を止める（汁気）
      hitStopTimer--; 
    } else {
      if (activeApp && activeApp.update) activeApp.update();
    }
    
    if (activeApp && activeApp.draw) activeApp.draw();
    drawTransition();

  } catch (err) {
    console.error("Game Loop Error:", err);
    ctx.fillStyle = "rgba(255,0,0,0.8)"; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = "#fff"; ctx.font = "10px monospace";
    ctx.fillText("ERROR CRASHED", 10, 50); ctx.fillText(err.message.substring(0, 30), 10, 70);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const setBtn = (id, k) => {
  const e = document.getElementById(id); if (!e) return;
  const p = (ev) => { ev.preventDefault(); keys[k] = true; initAudio(); }; const r = (ev) => { ev.preventDefault(); keys[k] = false; };
  e.addEventListener('touchstart', p, {passive: false}); e.addEventListener('touchend', r, {passive: false}); e.addEventListener('mousedown', p); e.addEventListener('mouseup', r); e.addEventListener('mouseleave', r);
};
['btn-up', 'btn-down', 'btn-left', 'btn-right', 'btn-a', 'btn-b', 'btn-select'].forEach((id, i) => { setBtn(id, ['up', 'down', 'left', 'right', 'a', 'b', 'select'][i]); });
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') { keys.up = true; initAudio(); } if (e.key === 'ArrowDown') { keys.down = true; initAudio(); }
  if (e.key === 'ArrowLeft') { keys.left = true; initAudio(); } if (e.key === 'ArrowRight') { keys.right = true; initAudio(); }
  if (e.key === 'z' || e.key === ' ') { keys.a = true; initAudio(); } if (e.key === 'x') { keys.b = true; initAudio(); } if (e.key === 'Shift') { keys.select = true; initAudio(); }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp') keys.up = false; if (e.key === 'ArrowDown') keys.down = false;
  if (e.key === 'ArrowLeft') keys.left = false; if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'z' || e.key === ' ') keys.a = false; if (e.key === 'x') keys.b = false; if (e.key === 'Shift') keys.select = false;
});
