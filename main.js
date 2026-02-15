// === CORE SYSTEM - ROUTE A: TEXTURE FIX & HD UPDATE ===
const ctx = document.getElementById('gameCanvas').getContext('2d');
const keys = {up:false, down:false, left:false, right:false, a:false, b:false, select:false};
const keysDown = {up:false, down:false, left:false, right:false, a:false, b:false, select:false};
let prevKeys = {...keys};
let activeApp = null;

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume(); }

let bgmOsc = null, bgmGain = null, bgmInterval = null;
const BGM = {
  stop() { if (bgmOsc) { bgmOsc.stop(); bgmOsc = null; } if (bgmGain) bgmGain = null; if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } },
  play(type) {
    this.stop(); if (!audioCtx) return;
    bgmGain = audioCtx.createGain(); bgmGain.gain.setValueAtTime(0.03, audioCtx.currentTime); bgmGain.connect(audioCtx.destination);
    const melodies = { menu: [262,330,392,523], tetri: [330,392,349,330,294,330,349,392], action: [392,440,494,523,494,440,392,349], rpg_field: [262,294,330,349,392,440,494,523], rpg_town: [330,392,330,262,294,349,294,196], rpg_dungeon: [146,164,146,130,146,164,196,164], rpg_battle: [440,494,523,587,659,587,523,494], rpg_boss: [329,311,329,246,293,261,220,0] };
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

const SaveSys = {
  data: JSON.parse(localStorage.getItem('4in1_ultimate')) || { playerName: 'PLAYER', scores: {n:0, h:0}, actStage: 1, actLives: 3, rpg: null, rankings: {n:[], h:[]}, bgTheme: 0 },
  save() { localStorage.setItem('4in1_ultimate', JSON.stringify(this.data)); },
  addScore(mode, score) { const rank = mode === 'normal' ? this.data.rankings.n : this.data.rankings.h; rank.push({name: this.data.playerName, score: score, date: Date.now()}); rank.sort((a,b) => b.score - a.score); if (rank.length > 10) rank.splice(10); this.save(); }
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
  // ★ 強力な安全装置：文字数から自動で16x16か8x8かを「完全に固定」し、画像の切り裂きバグを阻止します
  const len = str.length > 100 ? 16 : 8; 
  const dotSize = (8 / len) * size;
  for (let i = 0; i < str.length; i++) {
    if (i >= len * len) break; // 枠からはみ出る異常なデータは描画しない（バグ防止）
    const char = str[i]; if (char === '0') continue;
    ctx.fillStyle = (char === '1') ? color : (PALETTE[char] || color);
    ctx.fillRect(x + (i % len) * dotSize, y + Math.floor(i / len) * dotSize, dotSize, dotSize);
  }
};

// ★ マップチップの抜け落ちと、文字数のズレ（切り裂きバグ）を完全に修正したスプライト大辞典
const sprs = {
  // === 16x16 HD スプライト (256文字) ===
  player: [
    "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000a031111300000000a031111300000000a033333300000008880330330000000080033033000000000033303330000",
    "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000003111130a00000003111130a00000003333330a00000330330888000003303300800000033303330000000"
  ],
  heroNew: "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000a031111300000000a031111300000000a033333300000008880330330000000080033033000000000033303330000",
  slime: [
    "000000000000000000000000000000000000000000000000000000011000000000000011110000000000011211100000000011111111000000011111111110000001131111311000001113111131110000111111111111000011111111111100011111111111111001111111111111100011111111111100000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000011111000000000011211110000000011111111100000001131111311000001113111131110001111111111111100111111111111110011111111111111011111111111111110111111111111110"
  ],
  boss: "000033333333000000031111111130000031131111311300003138311383130000311311113113000031111331111300000311111111300000003333333300000033a111111a330003aa31111113aa3003a3311111133a3003303111111303300000311331130000000031133113000000003330033300000000000000000000",
  skull: "0000033333300000000032222223000000032222222230000003233223323000000323322332300000032223322230000000322222230000000003233230000000000322223000000000003333000000000033a22a33000000032a2222a230000003222332223000000033300333000000003230032300000000333003330000",
  mage: "0000003333000000000003111130000000003111111300000003111111113000003133333333130000000344443000000000343443430000000034444443000000000311113080000000311111138000000311111111390000031311113139000003331111333900000003333330090000000330033009000000033003300000",
  dragon: "0000000003333000000000003111130000000000313113000000000031111130000000031113330000033331111300000031111111130000031111111111300031131111111113003113111111111300033031111111300000000311331130000000031133113000000003330033300000000000000000000000000000000000",
  
  // ★ バット（切り裂きバグ修正版）
  enemyNew: [
    "0000000000000000000000000000000000000300000003000000313000003130000311300003113000311130003111300311113303311113311111133311111131111111111111113111111111111111311311111111131131303111111130313300033111330003000000033300000000000000000000000000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000000000000033000000000000031130000000000031111300000000031111113000000031111111130000003111111111130000311311111131130311303111130311333000033330000330000000000000000000000000000000000000000000000"
  ],

  // ★ テトリベーダースキン（切り裂きバグ修正版）
  fighter: "000000033000000000000032230000000000032bb23000000000032bb23000000003332bb23330000032222bb2222300032bb22bb22bb23032bbbb2bb2bbbb233333333bb333333300000322223000000000032bb2300000000000333333300000000005555000000000000055000000000000000000000000000000000000000",
  banana: "00000000000003300000000000003883000000000003888300000000003888300000000003888300000000003888300000000003888300000000003888300000000038883000000000388830000000003888300000000038883000000000388830000000000388300000000000003300000000000000000000000000000000000",
  peperoncino: "0000000000000000000000000000000000000000000000000000000000003330000000000003388300000000003885830000000003855583000000003855558300000003855555830000003855555583000003855555588300003855555883300003855558833000003888883300000000333333000000000000000000000000",
  cannon: "000000000000000000000000000000000000000330000000000000033000000000000003300000000000000330000000000000333300000000000366663000000000036666663000000036666666630000003666666663000003aaaaaaaaaa300003a3a3a3a3a3300003aaaaaaaaaa3000003333333333300000000000000000",
  invader: [
    "000000333300000000003311113300000003113113113000003111111111130003113111111311300311311111131130031111111111113000311311113113000003300000033000000300000000300000300000000003000300000000000030000000000000000000000000000000000000000000000000",
    "000000333300000000003311113300000003113113113000003111111111130003113111111311300311311111131130031111111111113000031131111311300000330000003300000300300003003000300000000000030000000000000000000000000000000000000000000000000000000000000000"
  ],
  beam: "000000033000000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b300000000000003b3000000000000033000000000000000000000000000000",
  
  princess: "0000003333000000000003888830000000000384444830000000034344343000000003444444300000000034444300000000003cccc30000000003cccccc3000000038cccccc8300000038cccccc830000003ccccccc300000003cccccccc300000003cccccccc300000003333333333000000003cc30000000000003333000000",
  q_block: "0000000000000000033333333333333003888888888888300388833338888830038838888388883003883888838888300388888838888830038888838888883003888838888888300388883888888830038888888888883003888838888888300388883888888830038888888888883003333333333333300000000000000000",

  // === 8x8 タイル (64文字) ===
  grass: ["0000000000600666006000000000000000000000000000000000000000000000", "0000000000060066000000000000000000000000000000000000000000000000"],
  tree: "0003300000366300036666300366663003666630003663000009900000099000",
  mount: "000000000033000003aa30003aaaa3003aaa3aa33aa33aa33999999339999993",
  water: ["0000022000000000000000000002200000000000000000000000000000000000", "0000000000002200000000000000000000000000022000000000000000000000"],
  town: "0003300003ff30003ffff303ffffff3033333330032230000322300003330000",
  cave: "0033330003aaaa303aaaaaa33aaa3aa33aa33aa33aa33aa33aa33aa333333333",
  tower: "0022000002aa20002aaaa2002aaaa2002a22a2002aaaa2002aaaa2002a22a200",
  ruins: "0a000a000aa0aa00aaaaaa00aa33aa00aa33aa00aaaaaa000aa0aa000a000a00",
  demon: "0033000003553000355553003533530035555300355553003533530035555300",
  floor: "9999e9e99999e9e99999e9e99999e9e99999e9e99999e9e99999e9e99999e9e9",
  wall: "aaaaaaaa22222222aaaaaaaa22222222aaaaaaaa22222222aaaaaaaa22222222",
  stairs_up: "00000000000000000000000066666666a6666666aa666666aaa66666aaaa6666",
  stairs_dn: "000000000000000000000000333333333333333a333333aa3333aaa333aaaa33",
  sign: "00000000e99999e09222229092222290e99999e0009000000090000000900000",
  star: "0001000000111000011111001111111001111100001110000001000000000000",
  coin: ["0003300000388300038888300383830003838300038383000038830000033000", "0003300000388300038888300388883003888830038888300038830000033000"],
  pipe: "033333303666666336f6f663366666630333333003666630036f663003666630",
  spike: "000000000030030003aa33aa03aaaaaa0aaaaaaa3aaa3aaa3aa3aaaa3aaaaaaa"
};

const Menu = {
  cur: 0, apps: ['ゲーム解説館', 'テトリベーダー', '理不尽ブラザーズ', 'マイクロクエスト', 'ONLINE対戦', 'ローカルランキング', '設定'], selectHoldTimer: 0,
  init() { this.cur = 0; this.selectHoldTimer = 0; BGM.play('menu'); },
  update() {
    if (keys.select) { this.selectHoldTimer++; if (this.selectHoldTimer === 30) { SaveSys.data.bgTheme = (SaveSys.data.bgTheme + 1) % bgThemes.length; SaveSys.save(); playSnd('combo'); } } else { this.selectHoldTimer = 0; }
    if (keysDown.down) { this.cur = (this.cur + 1) % 7; playSnd('sel'); }
    if (keysDown.up) { this.cur = (this.cur + 6) % 7; playSnd('sel'); }
    if (keysDown.a) { playSnd('jmp'); const appObjs = [Guide, Tetri, Action, RPG, Online, Ranking, Settings]; activeApp = appObjs[this.cur]; activeApp.init(); }
  },
  draw() {
    bgThemes[SaveSys.data.bgTheme].draw(ctx);
    ctx.shadowBlur = 10; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('4in1 RETRO', 55, 30); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('ULTIMATE v5.0', 60, 45);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i === this.cur ? '#0f0' : '#aaa'; ctx.font = '11px monospace'; ctx.fillText((i === this.cur ? '> ' : '  ') + this.apps[i], 15, 75 + i * 28); }
    ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('PLAYER: ' + SaveSys.data.playerName, 10, 280); ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText(`BG: ${bgThemes[SaveSys.data.bgTheme].name}`, 10, 290);
    if (this.selectHoldTimer > 0) { const p = Math.min(30, this.selectHoldTimer); ctx.fillStyle = 'rgba(0,255,0,0.3)'; ctx.fillRect(10, 265, (180 * p / 30), 5); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 265, 180, 5); }
  }
};

const Ranking = {
  mode: 'normal', input: false, name: '', cursor: 0, menuCursor: 0, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-. ',
  init() { if (!this.input) this.mode = 'normal'; this.cursor = 0; this.menuCursor = 0; },
  update() {
    if (!this.input && (keysDown.select || keysDown.b)) { activeApp = Menu; Menu.init(); return; }
    if (this.input && keysDown.select) { this.input = false; this.name = ''; activeApp = Menu; Menu.init(); return; }
    if (!this.input) {
      if (keysDown.left || keysDown.right) { this.mode = this.mode === 'normal' ? 'hard' : 'normal'; playSnd('sel'); }
      if (keysDown.a) { this.input = true; this.name = SaveSys.data.playerName; this.cursor = 0; this.menuCursor = 0; playSnd('jmp'); }
    } else {
      if (this.menuCursor === 0) {
        if (keysDown.right) { this.cursor = (this.cursor + 1) % this.chars.length; playSnd('sel'); }
        if (keysDown.left) { this.cursor = (this.cursor + this.chars.length - 1) % this.chars.length; playSnd('sel'); }
        if (keysDown.down) { let nC = this.cursor + 10; if (nC >= this.chars.length) this.menuCursor = 1; else this.cursor = nC; playSnd('sel'); }
        if (keysDown.up) { let nC = this.cursor - 10; if (nC >= 0) { this.cursor = nC; playSnd('sel'); } }
        if (keysDown.a) { if (this.name.length < 10) { this.name += this.chars[this.cursor]; playSnd('jmp'); } else playSnd('hit'); }
        if (keysDown.b) { if (this.name.length > 0) { this.name = this.name.slice(0, -1); playSnd('hit'); } }
      } else if (this.menuCursor === 1) {
        if (keysDown.up) { this.menuCursor = 0; playSnd('sel'); }
        if (keysDown.down) { this.menuCursor = 2; playSnd('sel'); }
        if (keysDown.a) { if (this.name.length > 0) { this.name = this.name.slice(0, -1); playSnd('hit'); } }
      } else if (this.menuCursor === 2) {
        if (keysDown.up) { this.menuCursor = 1; playSnd('sel'); }
        if (keysDown.a && this.name.length > 0) { SaveSys.data.playerName = this.name; SaveSys.save(); this.input = false; playSnd('combo'); activeApp = Menu; Menu.init(); }
      }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    if (!this.input) {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace'; ctx.fillText('LOCAL RANKING', 50, 20); ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText((this.mode === 'normal' ? '[NORMAL]' : '<NORMAL>'), 30, 40); ctx.fillText((this.mode === 'hard' ? '[HARD]' : '<HARD>'), 120, 40);
      const rank = this.mode === 'normal' ? SaveSys.data.rankings.n : SaveSys.data.rankings.h;
      ctx.fillStyle = '#ff0'; ctx.font = '9px monospace'; ctx.fillText('RANK NAME       SCORE', 15, 58);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#aaa';
        if (rank[i]) { ctx.fillText(`${String(i + 1).padStart(2, ' ')}. ${rank[i].name.padEnd(10, ' ')} ${String(rank[i].score).padStart(6, ' ')}`, 15, 76 + i * 18); } 
        else { ctx.fillText(`${String(i + 1).padStart(2, ' ')}. ----------  ----`, 15, 76 + i * 18); }
      }
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace'; ctx.fillText('プレイヤー名: ' + SaveSys.data.playerName, 15, 270); ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A:名前変更 SELECT:戻る', 25, 285);
    } else {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('名前入力', 65, 25); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.fillText(this.name + '_', 100 - (this.name.length + 1) * 4.5, 50);
      ctx.font = '11px monospace';
      for (let i = 0; i < this.chars.length; i++) {
        const x = 15 + (i % 10) * 17; const y = 90 + Math.floor(i / 10) * 18;
        if (i === this.cursor && this.menuCursor === 0) { ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 13, 14, 15); ctx.fillStyle = '#0f0'; } else { ctx.fillStyle = '#aaa'; }
        ctx.fillText(this.chars[i], x, y);
      }
      ctx.fillStyle = this.menuCursor === 1 ? '#f00' : '#800'; ctx.fillRect(25, 175, 70, 22); ctx.strokeStyle = this.menuCursor === 1 ? '#fff' : '#666'; ctx.lineWidth = 2; ctx.strokeRect(25, 175, 70, 22);
      ctx.fillStyle = this.menuCursor === 1 ? '#fff' : '#ccc'; ctx.font = 'bold 11px monospace'; ctx.fillText('DELETE', 30, 191);
      const okEn = this.name.length > 0; ctx.fillStyle = this.menuCursor === 2 ? (okEn ? '#0f0' : '#444') : (okEn ? '#080' : '#222'); ctx.fillRect(105, 175, 70, 22);
      ctx.strokeStyle = this.menuCursor === 2 ? '#fff' : '#666'; ctx.strokeRect(105, 175, 70, 22); ctx.fillStyle = this.menuCursor === 2 ? '#fff' : (okEn ? '#ccc' : '#666'); ctx.fillText('OK', 130, 191);
      ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('↑↓←→:選択 A:追加 B:削除', 25, 215);
    }
  }
};

const Settings = {
  menuCursor: 0, init() { this.menuCursor = 0; },
  update() {
    if (keysDown.select || keysDown.b) { activeApp = Menu; Menu.init(); return; }
    if (keysDown.up) { this.menuCursor = 0; playSnd('sel'); }
    if (keysDown.down) { this.menuCursor = 1; playSnd('sel'); }
    if (keysDown.a) {
      if (this.menuCursor === 0) { activeApp = Ranking; activeApp.input = true; activeApp.name = SaveSys.data.playerName; activeApp.cursor = 0; activeApp.menuCursor = 0; activeApp.init(); } 
      else if (this.menuCursor === 1) { SaveSys.data.bgTheme = (SaveSys.data.bgTheme + 1) % bgThemes.length; SaveSys.save(); playSnd('combo'); }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【設定】', 70, 30);
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; ctx.fillText((this.menuCursor === 0 ? '> ' : '  ') + 'プレイヤー名変更', 20, 80); ctx.fillText((this.menuCursor === 1 ? '> ' : '  ') + '背景テーマ切替', 20, 110);
    ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText(`現在: ${SaveSys.data.playerName}`, 30, 95); ctx.fillText(`現在: ${bgThemes[SaveSys.data.bgTheme].name}`, 30, 125);
    ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 60, 280);
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

function loop() {
  for (let k in keys) { keysDown[k] = keys[k] && !prevKeys[k]; prevKeys[k] = keys[k]; }
  if (activeApp) { activeApp.update(); activeApp.draw(); }
  requestAnimationFrame(loop);
}
