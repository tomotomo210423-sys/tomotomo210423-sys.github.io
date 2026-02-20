// === CORE SYSTEM - CLEAN UPDATE ===
const ctx = document.getElementById('gameCanvas').getContext('2d');
const keys = {up:false, down:false, left:false, right:false, a:false, b:false, select:false, l0:false, l1:false, l2:false, l3:false};
const keysDown = {up:false, down:false, left:false, right:false, a:false, b:false, select:false, l0:false, l1:false, l2:false, l3:false};
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

let bgmOsc = [], bgmInterval = null;
const BGM = {
  stop() { if (bgmInterval) { clearInterval(bgmInterval); bgmInterval = null; } },
  play(type) {
    this.stop(); if (!audioCtx) return;
    const mels = {
      menu: { t1:[262,330,392,523,392,330], t2:[131,165,196,262,196,165], t3:[65,0,98,0,65,0], n:[0,0,1,0,0,1], spd: 300 },
      tetri: { t1:[330,392,349,330,294,330,349,392], t2:[165,196,174,165,147,165,174,196], t3:[82,82,87,87,73,73,87,87], n:[1,0,1,0,1,0,1,0], spd: 200 },
      action: { t1:[392,440,494,523,494,440,392,349], t2:[196,220,247,262,247,220,196,174], t3:[98,0,123,0,131,0,98,0], n:[1,1,0,1,1,1,0,1], spd: 220 },
      rpg_field: { t1:[262,294,330,349,392,440,494,523], t2:[131,0,165,0,196,0,247,0], t3:[65,65,73,73,82,82,98,98], n:[0,0,0,0,0,0,0,0], spd: 350 },
      rpg_battle: { t1:[440,494,523,587,659,587,523,494], t2:[220,247,262,294,330,294,262,247], t3:[110,110,110,110,110,110,110,110], n:[1,0,1,0,1,0,1,0], spd: 150 },
      rpg_boss: { t1:[329,311,329,246,293,261,220,0], t2:[164,155,164,123,146,130,110,0], t3:[82,82,82,82,77,77,77,77], n:[1,1,1,1,1,1,1,1], spd: 180 },
      spell: { t1:[523,659,784,1046], t2:[0,0,0,0], t3:[0,0,0,0], n:[0,0,0,0], spd: 120 }
    };
    const track = mels[type] || mels.menu; let i = 0;
    bgmInterval = setInterval(() => {
      const now = audioCtx.currentTime; const duration = track.spd / 1000;
      const playNote = (freq, wave, vol) => {
        if (!freq) return;
        const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.type = wave; o.frequency.value = freq;
        g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.001, now + duration);
        o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + duration + 0.1); 
      };
      playNote(track.t1[i % track.t1.length], 'square', 0.05);
      playNote(track.t2[i % track.t2.length], 'square', 0.03);
      playNote(track.t3[i % track.t3.length], 'triangle', 0.08);
      if (track.n[i % track.n.length] > 0 && noiseBuffer) {
        const src = audioCtx.createBufferSource(); const g = audioCtx.createGain();
        src.buffer = noiseBuffer; g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        src.connect(g); g.connect(audioCtx.destination); src.start(now); src.stop(now + 0.2); 
      }
      i++;
    }, track.spd);
  }
};

let hitStopTimer = 0;
function hitStop(frames) { hitStopTimer = frames; }

function playSnd(t) {
  if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gn = audioCtx.createGain(); osc.connect(gn); gn.connect(audioCtx.destination); const n = audioCtx.currentTime;
  if (t === 'sel') { osc.type = 'sine'; osc.frequency.setValueAtTime(880, n); gn.gain.setValueAtTime(0.1, n); osc.start(n); osc.stop(n + 0.05); } 
  else if (t === 'jmp') { osc.type = 'square'; osc.frequency.setValueAtTime(300, n); osc.frequency.exponentialRampToValueAtTime(600, n+0.1); gn.gain.setValueAtTime(0.05, n); osc.start(n); osc.stop(n+0.1); } 
  else if (t === 'hit') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, n); osc.frequency.exponentialRampToValueAtTime(20, n+0.15); gn.gain.setValueAtTime(0.1, n); osc.start(n); osc.stop(n+0.15); screenShake(4); hitStop(3); } 
  else if (t === 'combo') { osc.type = 'sine'; osc.frequency.setValueAtTime(440, n); osc.frequency.setValueAtTime(880, n + 0.05); gn.gain.setValueAtTime(0.15, n); osc.start(n); osc.stop(n+0.15); screenShake(2); hitStop(2); }
}

const SaveSys = {
  data: (function() {
    let d = {}; try { let parsed = JSON.parse(localStorage.getItem('4in1_ultimate')); if (parsed && typeof parsed === 'object') d = parsed; } catch(e) {}
    if (!d.scores) d.scores = {n:0, h:0}; if (!d.rankings) d.rankings = {n:[], h:[]}; if (!d.rhythm) d.rhythm = {easy: 0, normal: 0, hard: 0};
    return { playerName: d.playerName || 'PLAYER', scores: d.scores, actStage: d.actStage || 1, actLives: d.actLives || 5, actSeed: d.actSeed || 1, rpg: d.rpg || null, rankings: d.rankings, bgTheme: d.bgTheme || 0, rhythm: d.rhythm };
  })(),
  save() { localStorage.setItem('4in1_ultimate', JSON.stringify(this.data)); },
  addScore(mode, score) { 
    const rank = mode === 'normal' ? this.data.rankings.n : this.data.rankings.h; 
    rank.push({name: this.data.playerName, score: score, date: Date.now()}); 
    rank.sort((a,b) => b.score - a.score); if (rank.length > 10) rank.splice(10); this.save(); 
  }
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
  if (!strData) return; const str = Array.isArray(strData) ? strData[Math.floor(Date.now() / 300) % strData.length] : strData; const len = str.length > 100 ? 16 : 8; const dotSize = (8 / len) * size;
  for (let i = 0; i < str.length; i++) { if (i >= len * len) break; const char = str[i]; if (char === '0') continue; ctx.fillStyle = (char === '1') ? color : (PALETTE[char] || color); ctx.fillRect(x + (i % len) * dotSize, y + Math.floor(i / len) * dotSize, dotSize, dotSize); }
};

const sprs = {
  player: ["0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000a031111300000000a031111300000000a033333300000008880330330000000080033033000000000033303330000", "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000003111130a00000003111130a00000003333330a00000330330888000003303300800000033303330000000"],
  heroNew: "0000003333000000000003999930000000003944449300000000343443430000000034444443000000000344443000000000311111130000000341111114300000344111111443000033311111133300000a031111300000000a031111300000000a033333300000008880330330000000080033033000000000033303330000",
  block: "999999999eeeeee99eeeeee99eeeeee99eeeeee99eeeeee99eeeeee999999999",
  slime: ["00000000000000000000000000000000000000000000000000000001100000000000001111000000000001121110000000001111111100000001111111111000000113111131100000111311113111000011111111111100001111111111110001111111111111100111111111111110001111111111100000000000000000", "0000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000011111000000000011211110000000011111111100000001131111311000001113111131110001111111111111100111111111111110011111111111111011111111111111110111111111111110"],
  boss: "000033333333000000031111111130000031131111311300003138311383130000311311113113000031111331111300000311111111300000003333333300000033a111111a330003aa31111113aa3003a3311111133a3003303111111303300000311331130000000031133113000000003330033300000000000000000000",
  skull: "0000033333300000000032222223000000032222222230000003233223323000000323322332300000032223322230000000322222230000000003233230000000000322223000000000003333000000000033a22a33000000032a2222a230000003222332223000000033300333000000003230032300000000333003330000",
  mage: "0000003333000000000003111130000000003111111300000003111111113000003133333333130000000344443000000000343443430000000034444443000000000311113080000000311111138000000311111111390000031311113139000003331111333900000003333330090000000330033009000000033003300000",
  dragon: "0000000003333000000000003111130000000000313113000000000031111130000000031113330000033331111300000031111111130000031111111111300031131111111113003113111111111300033031111111300000000311331130000000031133113000000003330033300000000000000000000000000000000000",
  enemyNew: [
    "0000000000000000000000000000000000000300000003000000313000003130000311300003113000311130003111300311113303311113311111133311111131111111111111113111111111111111311311111111131131303111111130313300033111330003000000033300000000000000000000000000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000000000000033000000000000031130000000000031111300000000031111113000000031111111130000003111111111130000311311111131130311303111130311333000033330000330000000000000000000000000000000000000000000000"
  ],
  fighter: "000000033000000000000032230000000000032bb23000000000032bb23000000003332bb23330000032222bb2222300032bb22bb22bb23032bbbb2bb2bbbb233333333bb333333300000322223000000000032bb2300000000000333333300000000005555000000000000055000000000000000000000000000000000000000",
  banana: "0000000000000330000000000000388300000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000388830000000000",
  peperoncino: "000000000000000000000000000000000000000000000000000000033300000000000038583000000000038258300000000038888888300000038898898830000032222222223000003a22a2a2a230000032a2a2a2a2300000032222222230000000333333330000000000000000000000000000000000000000000000000000",
  cannon: "000000000000000000000000000000000000000330000000000000033000000000000003300000000000000330000000000000333300000000000366663000000000036666663000000036666666630000003666666663000003aaaaaaaaaa300003a3a3a3a3a3300003aaaaaaaaaa3000003333333333300000000000000000",
  invader: [
    "000000333300000000003311113300000003113113113000003111111111130003113111111311300311311111131130031111111111113000311311113113000003300000033000000300000000300000300000000003000300000000000030000000000000000000000000000000000000000000000000",
    "000000333300000000003311113300000003113113113000003111111111130003113111111311300311311111131130031111111111113000031131111311300000330000003300000300300003003000300000000000030000000000000000000000000000000000000000000000000000000000000000"
  ],
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
  coin: ["0003300000388300038888300383830003838300038383000038830000033000", "00033000003883000388883003888830038888300038830000033000"],
  pipe: "033333303666666336f6f663366666630333333003666630036f663003666630",
  spike: "000000000030030003aa33aa03aaaaaa0aaaaaaa3aaa3aaa3aa3aaaa3aaaaaaa"
};

let transTimer = 0; let nextApp = null;
function switchApp(app) { nextApp = app; transTimer = 20; playSnd('sel'); }
function drawTransition() {
  if (transTimer > 0) { ctx.fillStyle = '#000'; for(let y=0; y<15; y++) { for(let x=0; x<10; x++) { if ((x+y) < (20 - transTimer)) ctx.fillRect(x*20, y*20, 20, 20); } } }
}

const Menu = {
  cur: 0, 
  apps: ['ゲーム解説館', 'テトリベーダー', '理不尽ブラザーズ', 'ONLINE対戦', 'BEAT BROS', 'ローカルランキング', '設定', 'データ引継ぎ'], 
  selectHoldTimer: 0,
  
  init() { this.cur = 0; this.selectHoldTimer = 0; BGM.play('menu'); },
  update() {
    if (keys.select) { this.selectHoldTimer++; if (this.selectHoldTimer === 30) { SaveSys.data.bgTheme = (SaveSys.data.bgTheme + 1) % bgThemes.length; SaveSys.save(); playSnd('combo'); } } else { this.selectHoldTimer = 0; }
    if (keysDown.down) { this.cur = (this.cur + 1) % 8; playSnd('sel'); }
    if (keysDown.up) { this.cur = (this.cur + 7) % 8; playSnd('sel'); }
    if (keysDown.a) { 
      const appObjs = [Guide, Tetri, Action, Online, Rhythm, Ranking, Settings, DataBackup]; 
      switchApp(appObjs[this.cur]); 
    }
  },
  draw() {
    bgThemes[SaveSys.data.bgTheme].draw(ctx);
    ctx.shadowBlur = 10; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace'; ctx.fillText('5in1 RETRO', 55, 25); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('ULTIMATE v8.0', 60, 40); 
    for (let i = 0; i < 8; i++) { 
        ctx.fillStyle = i === this.cur ? '#0f0' : '#aaa'; ctx.font = '11px monospace'; 
        ctx.fillText((i === this.cur ? '> ' : '  ') + this.apps[i], 15, 65 + i * 20); 
    }
    ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('PLAYER: ' + SaveSys.data.playerName, 10, 275); ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText(`BG: ${bgThemes[SaveSys.data.bgTheme].name}`, 10, 288);
    if (this.selectHoldTimer > 0) { const p = Math.min(30, this.selectHoldTimer); ctx.fillStyle = 'rgba(0,255,0,0.3)'; ctx.fillRect(10, 260, (180 * p / 30), 5); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 260, 180, 5); }
  }
};

const DataBackup = {
  st: 'map', px: 4.5, py: 6, anim: 0, msg: '', backupStr: '',
  init() { this.st = 'map'; this.px = 4.5; this.py = 6; this.msg = ''; this.anim = 0; BGM.play('spell'); }, 
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    if (this.st === 'msg') { if (keysDown.a || keysDown.b) { this.st = 'map'; playSnd('sel'); } return; }
    this.anim++;
    let nx = this.px, ny = this.py;
    if (keys.left) nx -= 0.15; if (keys.right) nx += 0.15;
    if (keys.up) ny -= 0.15; if (keys.down) ny += 0.15;
    nx = Math.max(1, Math.min(8, nx)); ny = Math.max(1.5, Math.min(7, ny)); this.px = nx; this.py = ny;
    if (keysDown.a) {
       if (Math.abs(this.px - 2) < 1.5 && Math.abs(this.py - 2) < 1.5) {
           try { 
             this.backupStr = btoa(unescape(encodeURIComponent(JSON.stringify(SaveSys.data))));
             if (navigator.clipboard && window.isSecureContext) {
                 navigator.clipboard.writeText(this.backupStr).then(()=> { this.msg = 'データをコピーした！\nメモ帳などに保存せよ。'; this.st = 'msg'; playSnd('combo'); 
                 }).catch(e=> { prompt("自動コピーがブロックされました。\n以下の呪文を手動でコピーしてください:", this.backupStr); this.msg = '呪文を表示したぞ。\n手動でコピーせよ。'; this.st = 'msg'; playSnd('combo'); });
             } else { prompt("以下の呪文を手動でコピーしてください:", this.backupStr); this.msg = '呪文を表示したぞ。\n手動でコピーせよ。'; this.st = 'msg'; playSnd('combo'); }
           } catch(e) { this.msg = 'データ変換エラー'; this.st = 'msg'; playSnd('hit'); }
       } 
       else if (Math.abs(this.px - 7) < 1.5 && Math.abs(this.py - 2) < 1.5) {
           const input = prompt("復活の呪文（パスワード）を入力してください:");
           if (input) {
             try {
               const parsed = JSON.parse(decodeURIComponent(escape(atob(input))));
               if (parsed && parsed.playerName) { SaveSys.data = parsed; SaveSys.save(); alert("データの復元に成功しました！\nゲームを再起動します。"); location.reload(); } else throw new Error('Invalid');
             } catch(e) { this.msg = '呪文が違います！'; this.st = 'msg'; playSnd('hit'); }
           }
       }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#400'; ctx.fillRect(20, 20, 160, 260); 
    ctx.strokeStyle = '#fa0'; ctx.lineWidth = 4; ctx.strokeRect(20, 20, 160, 260); ctx.lineWidth = 1;
    ctx.fillStyle = '#888'; ctx.fillRect(30, 30, 20, 240); ctx.fillRect(150, 30, 20, 240);
    const offsetY1 = Math.sin(this.anim * 0.1) * 2; ctx.fillStyle = '#ffe'; ctx.fillRect(35, 45, 30, 20); ctx.strokeStyle = '#840'; ctx.strokeRect(35, 45, 30, 20); ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('記録', 38, 58 + offsetY1); 
    const offsetY2 = Math.cos(this.anim * 0.1) * 2; ctx.fillStyle = '#ffe'; ctx.fillRect(135, 45, 30, 20); ctx.strokeStyle = '#840'; ctx.strokeRect(135, 45, 30, 20); ctx.fillStyle = '#0ff'; ctx.fillText('復活', 138, 58 + offsetY2);
    drawSprite(this.px * 20, this.py * 20, '#0ff', sprs.player || sprs.heroNew, 2.5);
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('王様に　はなしかけるのだ。', 40, 220); ctx.fillStyle = '#ccc'; ctx.fillText('SELECT: 城を出る', 60, 280);
    if (this.st === 'msg') { ctx.fillStyle = '#000'; ctx.fillRect(10, 150, 180, 80); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, 150, 180, 80); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let arr = this.msg.split('\n'); for(let i=0; i<arr.length; i++) ctx.fillText(arr[i], 20, 170 + i*15); }
  }
};

const Ranking = {
  mode: 'normal', input: false, name: '', cursor: 0, menuCursor: 0, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-. ',
  init() { if (!this.input) this.mode = 'normal'; this.cursor = 0; this.menuCursor = 0; },
  update() {
    if (!this.input && (keysDown.select || keysDown.b)) { switchApp(Menu); return; }
    if (this.input && keysDown.select) { this.input = false; this.name = ''; switchApp(Menu); return; }
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
        if (keysDown.a && this.name.length > 0) { SaveSys.data.playerName = this.name; SaveSys.save(); this.input = false; playSnd('combo'); switchApp(Menu); }
      }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    if (!this.input) {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace'; ctx.fillText('LOCAL RANKING', 50, 20); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText((this.mode === 'normal' ? '[NORMAL]' : '<NORMAL>'), 30, 40); ctx.fillText((this.mode === 'hard' ? '[HARD]' : '<HARD>'), 120, 40);
      const rank = this.mode === 'normal' ? SaveSys.data.rankings.n : SaveSys.data.rankings.h; ctx.fillStyle = '#ff0'; ctx.font = '9px monospace'; ctx.fillText('RANK NAME       SCORE', 15, 58);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : '#aaa';
        if (rank[i]) { ctx.fillText(`${String(i + 1).padStart(2, ' ')}. ${rank[i].name.padEnd(10, ' ')} ${String(rank[i].score).padStart(6, ' ')}`, 15, 76 + i * 18); } 
        else { ctx.fillText(`${String(i + 1).padStart(2, ' ')}. ----------  ----`, 15, 76 + i * 18); }
      }
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace'; ctx.fillText('プレイヤー名: ' + SaveSys.data.playerName, 15, 270); ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A:名前変更 SELECT:戻る', 25, 285);
    } else {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('名前入力', 65, 25); ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace'; ctx.fillText(this.name + '_', 100 - (this.name.length + 1) * 4.5, 50); ctx.font = '11px monospace';
      for (let i = 0; i < this.chars.length; i++) {
        const x = 15 + (i % 10) * 17; const y = 90 + Math.floor(i / 10) * 18;
        if (i === this.cursor && this.menuCursor === 0) { ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 13, 14, 15); ctx.fillStyle = '#0f0'; } else { ctx.fillStyle = '#aaa'; }
        ctx.fillText(this.chars[i], x, y);
      }
      ctx.fillStyle = this.menuCursor === 1 ? '#f00' : '#800'; ctx.fillRect(25, 175, 70, 22); ctx.strokeStyle = this.menuCursor === 1 ? '#fff' : '#666'; ctx.lineWidth = 2; ctx.strokeRect(25, 175, 70, 22); ctx.fillStyle = this.menuCursor === 1 ? '#fff' : '#ccc'; ctx.font = 'bold 11px monospace'; ctx.fillText('DELETE', 30, 191);
      const okEn = this.name.length > 0; ctx.fillStyle = this.menuCursor === 2 ? (okEn ? '#0f0' : '#444') : (okEn ? '#080' : '#222'); ctx.fillRect(105, 175, 70, 22); ctx.strokeStyle = this.menuCursor === 2 ? '#fff' : '#666'; ctx.strokeRect(105, 175, 70, 22); ctx.fillStyle = this.menuCursor === 2 ? '#fff' : (okEn ? '#ccc' : '#666'); ctx.fillText('OK', 130, 191);
      ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('↑↓←→:選択 A:追加 B:削除', 25, 215);
    }
  }
};

const Settings = {
  menuCursor: 0, init() { this.menuCursor = 0; },
  update() {
    if (keysDown.select || keysDown.b) { switchApp(Menu); return; }
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
    ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText(`現在: ${SaveSys.data.playerName}`, 30, 95); ctx.fillText(`現在: ${bgThemes[SaveSys.data.bgTheme].name}`, 30, 125); ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 60, 280);
  }
};

function loop() {
  try {
    if (hitStopTimer <= 0) { for (let k in keys) { keysDown[k] = keys[k] && !prevKeys[k]; prevKeys[k] = keys[k]; } }
    if (transTimer > 0) { transTimer--; if (transTimer === 0 && nextApp) { activeApp = nextApp; activeApp.init(); nextApp = null; } } 
    else if (hitStopTimer > 0) { hitStopTimer--; } 
    else { if (activeApp && activeApp.update) activeApp.update(); }
    if (activeApp && activeApp.draw) activeApp.draw(); drawTransition();
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
  let k = e.key.toLowerCase();
  if (e.key === 'ArrowUp') { keys.up = true; initAudio(); } 
  if (e.key === 'ArrowDown') { keys.down = true; initAudio(); }
  if (e.key === 'ArrowLeft') { keys.left = true; initAudio(); } 
  if (e.key === 'ArrowRight') { keys.right = true; initAudio(); }
  if (k === 'z' || e.key === ' ') { keys.a = true; initAudio(); } 
  if (k === 'x') { keys.b = true; initAudio(); } 
  if (e.key === 'Shift') { keys.select = true; initAudio(); }
  
  if (k === 'd') { keys.l0 = true; initAudio(); } 
  if (k === 'f') { keys.l1 = true; initAudio(); }
  if (k === 'j') { keys.l2 = true; initAudio(); } 
  if (k === 'k') { keys.l3 = true; initAudio(); }
});

window.addEventListener('keyup', e => {
  let k = e.key.toLowerCase();
  if (e.key === 'ArrowUp') keys.up = false; 
  if (e.key === 'ArrowDown') keys.down = false;
  if (e.key === 'ArrowLeft') keys.left = false; 
  if (e.key === 'ArrowRight') keys.right = false;
  if (k === 'z' || e.key === ' ') keys.a = false; 
  if (k === 'x') keys.b = false; 
  if (e.key === 'Shift') keys.select = false;
  
  if (k === 'd') keys.l0 = false; 
  if (k === 'f') keys.l1 = false;
  if (k === 'j') keys.l2 = false; 
  if (k === 'k') keys.l3 = false;
});
