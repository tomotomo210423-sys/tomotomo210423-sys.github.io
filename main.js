// === CORE SYSTEM - SAVE PROTECTION & ROBUSTNESS UPDATE ===
const ctx = document.getElementById('gameCanvas').getContext('2d');
const keys = {up:false, down:false, left:false, right:false, a:false, b:false, select:false};
const keysDown = {up:false, down:false, left:false, right:false, a:false, b:false, select:false};
let prevKeys = {...keys};
let activeApp = null;

// オーディオ設定などは変更なし
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume(); }

// BGM/SE処理（略：既存と同じ）
let bgmOsc = null, bgmGain = null, bgmInterval = null;
const BGM = {
  stop() { if (bgmOsc) { bgmOsc.stop(); bgmOsc = null; } if (bgmGain) bgmGain = null; if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } },
  play(type) {
    this.stop(); if (!audioCtx) return;
    bgmGain = audioCtx.createGain(); bgmGain.gain.setValueAtTime(0.03, audioCtx.currentTime); bgmGain.connect(audioCtx.destination);
    const melodies = { menu:[262,330,392,523], tetri:[330,392,349,330,294,330,349,392], action:[392,440,494,523,494,440,392,349], rpg_field:[262,294,330,349,392,440,494,523], rpg_town:[330,392,330,262,294,349,294,196], rpg_dungeon:[146,164,146,130,146,164,196,164], rpg_battle:[440,494,523,587,659,587,523,494], rpg_boss:[329,311,329,246,293,261,220,0] };
    const waveTypes = {menu:'square', tetri:'sine', action:'triangle', rpg_field:'square', rpg_town:'sine', rpg_dungeon:'triangle', rpg_battle:'sawtooth', rpg_boss:'sawtooth'}; 
    const intervals = {menu:400, tetri:200, action:250, rpg_field:350, rpg_town:450, rpg_dungeon:400, rpg_battle:150, rpg_boss:200};
    const melody = melodies[type] || melodies.menu; let i = 0;
    bgmInterval = setInterval(() => {
      if (bgmOsc) bgmOsc.stop();
      if (melody[i % melody.length] > 0) { bgmOsc = audioCtx.createOscillator(); bgmOsc.type = waveTypes[type] || 'square'; bgmOsc.frequency.value = melody[i % melody.length]; bgmOsc.connect(bgmGain); bgmOsc.start(); }
      i++;
    }, intervals[type] || 300);
  }
};
function playSnd(t) {
  if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gn = audioCtx.createGain(); osc.connect(gn); gn.connect(audioCtx.destination); const n = audioCtx.currentTime;
  if (t === 'sel') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, n); gn.gain.setValueAtTime(0.1, n); gn.gain.linearRampToValueAtTime(0, n + 0.05); osc.start(n); osc.stop(n + 0.05); } 
  else if (t === 'jmp') { osc.type = 'square'; osc.frequency.setValueAtTime(300, n); osc.frequency.exponentialRampToValueAtTime(600, n + 0.1); gn.gain.setValueAtTime(0.05, n); gn.gain.linearRampToValueAtTime(0, n + 0.1); osc.start(n); osc.stop(n + 0.1); } 
  else if (t === 'hit') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, n); osc.frequency.exponentialRampToValueAtTime(20, n + 0.15); gn.gain.setValueAtTime(0.1, n); gn.gain.linearRampToValueAtTime(0, n + 0.15); osc.start(n); osc.stop(n + 0.15); } 
  else if (t === 'combo') { osc.type = 'sine'; osc.frequency.setValueAtTime(440, n); osc.frequency.setValueAtTime(880, n + 0.05); gn.gain.setValueAtTime(0.15, n); gn.gain.linearRampToValueAtTime(0, n + 0.15); osc.start(n); osc.stop(n + 0.15); }
}

// ★ セーブデータの分離と保護強化
const SaveSys = {
  // システム設定・スコア
  sys: (function() {
    try { return JSON.parse(localStorage.getItem('4in1_sys')) || { playerName: 'PLAYER', scores: {n:0, h:0}, rankings: {n:[], h:[]}, bgTheme: 0 }; }
    catch(e) { return { playerName: 'PLAYER', scores: {n:0, h:0}, rankings: {n:[], h:[]}, bgTheme: 0 }; }
  })(),
  // アクションゲームの状態（残機5設定）
  act: (function() {
    try { return JSON.parse(localStorage.getItem('4in1_act')) || { stage: 1, lives: 5, randomSeed: 0 }; }
    catch(e) { return { stage: 1, lives: 5, randomSeed: 0 }; }
  })(),

  saveSys() { localStorage.setItem('4in1_sys', JSON.stringify(this.sys)); },
  saveAct() { localStorage.setItem('4in1_act', JSON.stringify(this.act)); },
  
  addScore(mode, score) { 
    const rank = mode === 'normal' ? this.sys.rankings.n : this.sys.rankings.h; 
    rank.push({name: this.sys.playerName, score: score, date: Date.now()}); 
    rank.sort((a,b) => b.score - a.score); if (rank.length > 10) rank.splice(10); 
    this.saveSys(); 
  }
};

const bgThemes = [
  { name: 'MATRIX', draw: (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#0f0'; ctx.font = '10px monospace'; for (let i = 0; i < 20; i++) { ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)), (i * 10) + (Date.now() / 50) % 10, (Date.now() / 20 + i * 15) % 300); } } },
  { name: 'STARS', draw: (ctx) => { ctx.fillStyle = '#000822'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { const s = 1 + (i % 3); ctx.fillRect((i * 37) % 200, (i * 67 + Date.now() / 10) % 300, s, s); } } },
  { name: 'WAVE', draw: (ctx) => { ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300); for (let y = 0; y < 300; y += 10) { ctx.fillStyle = `hsl(${(y + Date.now() / 20) % 360}, 70%, 30%)`; ctx.fillRect(0, y, 200, 10); } } }
];

const particles = [];
function addParticle(x, y, color, type = 'star') { const count = type === 'explosion' ? 8 : type === 'line' ? 20 : 5; for (let i = 0; i < count; i++) { particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 1, life: 30, color: color, size: type === 'explosion' ? 2 : 1 }); } }
function updateParticles() { for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--; if (p.life <= 0) particles.splice(i, 1); } }
function drawParticles() { particles.forEach(p => { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1; }); }
let shakeTimer = 0;
function screenShake(intensity = 2) { shakeTimer = intensity; }
function applyShake() { if (shakeTimer > 0) { ctx.save(); ctx.translate((Math.random() - 0.5) * shakeTimer * 2, (Math.random() - 0.5) * shakeTimer * 2); shakeTimer--; } }
function resetShake() { if (shakeTimer >= 0) ctx.restore(); }

const PALETTE = { '2':'#fff','3':'#000','4':'#fcc','5':'#f00','6':'#0a0','7':'#00f','8':'#ff0','9':'#842','a':'#aaa','b':'#0ff','c':'#f0f','d':'#80f','e':'#531','f':'#141' };
const drawSprite = (x, y, color, strData, size = 2.5) => {
  if (!strData) return;
  const str = Array.isArray(strData) ? strData[Math.floor(Date.now() / 300) % strData.length] : strData;
  const len = str.length > 100 ? 16 : 8; 
  const dotSize = (8 / len) * size;
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
  slime: ["000000000000000000000000000000000000000000000000000000011000000000000011110000000000011211100000000011111111000000011111111110000001131111311000001113111131110000111111111111000011111111111100011111111111111001111111111111100011111111111100000000000000000", "0000000000000000000000000000000000000000000000000000000000002220000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000111110000000000112111100000000111111111000000011311113110000011131111311100011111111111111001111111111111100111111111111110111111111111111110111111111111110"],
  enemyNew: ["000000000000000000000300000003000000313000003130000311300003113000311130003111300311113303311113311111133311111131111111111111113111111111111111311311111111131131303111111130313300033111330003000000033300000000000000000000000000000000000000", "00000000000000000000000000000000000000000000000030000000000000033300000000000033313000000000031331130003300031133111303113031113031113311331113003111111111111300031111111111300000313111131300000003033330300000000000000000000000000000000000000000000000"],
  grass: ["0000000000600666006000000000000000000000000000000000000000000000", "0000000000060066000000000000000000000000000000000000000000000000"],
  tree: "0003300000366300036666300366663003666630003663000009900000099000",
  mount: "000000000033000003aa30003aaaa3003aaa3aa33aa33aa33999999339999993",
  water: ["0000022000000000000000000002200000000000000000000000000000000000", "0000000000002200000000000000000000000000022000000000000000000000"],
  town: "0003300003ff30003ffff303ffffff3033333330032230000322300003330000",
  cave: "0033330003aaaa303aaaaaa33aaa3aa33aa33aa33aa33aa33aa33aa333333333",
  floor: "9999e9e99999e9e99999e9e99999e9e99999e9e99999e9e99999e9e99999e9e9",
  wall: "aaaaaaaa22222222aaaaaaaa22222222aaaaaaaa22222222aaaaaaaa22222222",
  star: "0001000000111000011111001111111001111100001110000001000000000000",
  coin: ["0003300000388300038888300383830003838300038383000038830000033000", "0003300000388300038888300388883003888830038888300038830000033000"],
  spike: "000000000030030003aa33aa03aaaaaa0aaaaaaa3aaa3aaa3aa3aaaa3aaaaaaa"
};

// ... Menu, Ranking, Settingsなどは既存のままでOK
const Menu = {
  cur: 0, apps: ['ゲーム解説館', 'テトリベーダー', '理不尽ブラザーズ', 'マイクロクエスト', 'ONLINE対戦', 'ローカルランキング', '設定'], selectHoldTimer: 0,
  init() { this.cur = 0; this.selectHoldTimer = 0; BGM.play('menu'); },
  update() {
    if (keys.select) { this.selectHoldTimer++; if (this.selectHoldTimer === 30) { SaveSys.sys.bgTheme = (SaveSys.sys.bgTheme + 1) % bgThemes.length; SaveSys.saveSys(); playSnd('combo'); } } else { this.selectHoldTimer = 0; }
    if (keysDown.down) { this.cur = (this.cur + 1) % 7; playSnd('sel'); }
    if (keysDown.up) { this.cur = (this.cur + 6) % 7; playSnd('sel'); }
    if (keysDown.a) { playSnd('jmp'); const appObjs = [Guide, Tetri, Action, RPG, Online, Ranking, Settings]; activeApp = appObjs[this.cur]; activeApp.init(); }
  },
  draw() {
    bgThemes[SaveSys.sys.bgTheme].draw(ctx);
    ctx.shadowBlur = 10; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('4in1 RETRO', 55, 30); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('ULTIMATE v5.1', 60, 45);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i === this.cur ? '#0f0' : '#aaa'; ctx.font = '11px monospace'; ctx.fillText((i === this.cur ? '> ' : '  ') + this.apps[i], 15, 75 + i * 28); }
    ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('PLAYER: ' + SaveSys.sys.playerName, 10, 280);
  }
};

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
function loop() { for (let k in keys) { keysDown[k] = keys[k] && !prevKeys[k]; prevKeys[k] = keys[k]; } if (activeApp) { activeApp.update(); activeApp.draw(); } requestAnimationFrame(loop); }
