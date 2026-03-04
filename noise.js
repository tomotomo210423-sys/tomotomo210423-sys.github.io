// === NOISE AGENT (Phase 3: Puzzle & Full Voice/Subtitle Edition) ===

// ★ AI音声＆字幕システム
const VoiceSys = {
    voices: [],
    unlocked: false,
    init() {
        let loadV = () => { this.voices = speechSynthesis.getVoices().filter(v => v.lang.includes('ja')); };
        loadV();
        if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadV;

        // スマホ用：画面タップ時に無音を流して音声を強制アンロック
        const unlock = () => {
            if(!this.unlocked) {
                let u = new SpeechSynthesisUtterance('');
                u.volume = 0; speechSynthesis.speak(u);
                this.unlocked = true;
            }
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('mousedown', unlock);
        };
        window.addEventListener('touchstart', unlock, {passive: true});
        window.addEventListener('mousedown', unlock, {passive: true});
    },
    speak(char, txt) {
        // --- プレイ中の画面下部の字幕用 ---
        if (Noise.st === 'play' || Noise.st === 'gameover') {
            Noise.msg = char === 'ミュート' ? '……' : `エコー「${txt}」`;
            Noise.msgLife = 180; // 3秒間字幕を表示
        }
        
        speechSynthesis.cancel();
        if (char === 'ミュート') return; 
        
        try {
            let u = new SpeechSynthesisUtterance(txt);
            if (this.voices.length > 0) {
                u.voice = this.voices.find(v => v.name.includes('Google') || v.name.includes('Male') || v.name.includes('Taro')) || this.voices[0];
            }
            if (char === 'エコー') { u.pitch = 1.3; u.rate = 1.3; } // 若者風
            else if (char === '司令官ノイズ') { u.pitch = 0.5; u.rate = 0.9; } // 威圧的
            else { u.pitch = 1.0; u.rate = 1.0; }
            u.volume = 1.0;
            speechSynthesis.speak(u);
        } catch(e) { console.warn('Voice blocked'); } // 音声が出なくても字幕で進行可能
    },
    stop() { speechSynthesis.cancel(); }
};

// ★ キャラクタードット絵 (16x16)
const PAL = { '0':null, '1':'#000', '2':'#fff', '3':'#fca', '4':'#f00', '5':'#0ff', '6':'#0a0', '7':'#fa0', '8':'#444', '9':'#888' };
const CHAR_SPRITES = {
    'エコー': [ // ★ 人間の青年ハッカー（ヘッドホンとサングラス）に変更！
        "0000000000000000",
        "0000111111110000",
        "0001777777771000", // 金髪
        "0017777777777100",
        "0017733333377100",
        "0181333333331810", // 8: ヘッドホンの耳当て
        "0181311111131810", // 1: サングラス
        "0181315555131810", // 5: サングラスの反射
        "0011333333331100",
        "0001333333331000",
        "0000111111110000",
        "0001666666661000", // 緑のジャケット
        "0016661111666100",
        "0016661111666100",
        "0011110000111100",
        "0000000000000000"
    ],
    '司令官ノイズ': [ // 厳つい軍人ボス
        "0000111111110000","0001444444441000","0011444444441100","0111111111111110",
        "0003333333333000","0003113333113000","0003333333333000","0003333333333000",
        "0003331111333000","0000333333330000","0000888888880000","0008888888888000",
        "0088878888788800","0088878888788800","0088888888888800","0000000000000000"
    ],
    'ミュート': [ // ステルススーツの主人公
        "0000000000000000","0000111111110000","0001111111111000","0011111111111100",
        "0011111111111100","0011144114411100","0011144114411100","0011111111111100",
        "0001111111111000","0001111111111000","0000111111110000","0000888888880000",
        "0008888888888000","0088888888888800","0088888888888800","0000000000000000"
    ]
};

const SCENARIOS = [
    [
        { c: 'エコー', t: '聞こえるかミュート？ついに潜入作戦開始だ。' },
        { c: 'エコー', t: 'だが最悪なニュースがある。お前のブーツがハッキングされた！' },
        { c: 'エコー', t: '歩くたびに爆音と【巨大な文字】が出る呪いの靴になっちまったんだ！ｗ' },
        { c: 'ミュート', t: '……。' },
        { c: 'エコー', t: '文字が邪魔で前が見えないだろうが、Aで暗殺、Bでダンボールだ！' },
        { c: 'エコー', t: '青い【スイッチ】を踏んで扉を開け、緑のゴールを目指せ！' }
    ],
    [
        { c: '司令官ノイズ', t: '侵入者め...ネズミが迷い込んだようだな。' },
        { c: 'エコー', t: 'やべぇ！敵のボス「司令官ノイズ」に気づかれたぞ！' },
        { c: '司令官ノイズ', t: 'そのやかましい足音...貴様、スパイの風上にも置けん奴だ！' },
        { c: '司令官ノイズ', t: '警備を「レベル2」に引き上げろ！あのウルサイ奴を蜂の巣にしろ！' },
        { c: 'エコー', t: '敵もスイッチも増えたぞ！ダンボール(B)を駆使して切り抜けろ！' }
    ],
    [
        { c: '司令官ノイズ', t: 'ええい！なぜあんな騒がしい奴を捕まえられんのだ！！' },
        { c: '司令官ノイズ', t: '機密データルームに親衛隊を配置しろ！絶対にここを通すな！' },
        { c: 'エコー', t: '次が最終エリアだミュート！敵がウジャウジャいるぞ！' },
        { c: 'エコー', t: '自分の足音の「文字」で前が見えなくなったら終わりだ。慎重に行けよ！' }
    ],
    [
        { c: 'エコー', t: 'ミッション・コンプリート！！機密データを奪取したぞ！' },
        { c: '司令官ノイズ', t: 'バカな...あんなうるさいフザケた奴に...私の基地が...！ぐはぁっ！' },
        { c: 'ミュート', t: '……（サムズアップ）' },
        { c: 'エコー', t: 'さぁ帰ろうぜ、ミュート！俺のおごりでピザパだ！最高に笑える作戦だったぜ！' }
    ]
];

const Noise = {
    st: 'title', tmr: 0, level: 0,
    scIdx: 0, msgIdx: 0, charTimer: 0, strToShow: '',
    
    p: { x: 100, y: 280, r: 6, spd: 2.5, box: false },
    texts: [], enemies: [], walls: [], 
    doors: [], switches: [], // ★ パズル要素
    goal: { x: 100, y: 20, r: 15 },
    stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    msg: '', msgLife: 0,
    
    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.level = 0;
        this.msg = ''; this.msgLife = 0;
        VoiceSys.init();
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startStory(sIdx) {
        this.st = 'story'; this.scIdx = sIdx; this.msgIdx = 0; this.tmr = 0;
        this.setupMessage();
    },

    setupMessage() {
        let m = SCENARIOS[this.scIdx][this.msgIdx];
        this.strToShow = ''; this.charTimer = 0;
        VoiceSys.speak(m.c, m.t); 
    },

    loadLevel() {
        this.st = 'play';
        this.p = { x: 100, y: 280, r: 6, spd: 2.5, box: false };
        this.texts = []; this.tmr = 0;
        
        // ★ 各レベルのマップ設計（パズル要素あり）
        if (this.level === 0) {
            this.walls = [
                {x: 0, y: 60, w: 70, h: 20}, {x: 130, y: 60, w: 70, h: 20},
                {x: 40, y: 150, w: 120, h: 20}
            ];
            this.doors = [ {x: 70, y: 60, w: 60, h: 20, id: 1, open: false} ];
            this.switches = [ {x: 160, y: 220, r: 10, id: 1, active: false} ];
            this.enemies = [ { x: 50, y: 100, path: [{x:50,y:100}, {x:150,y:100}], pt: 0, spd: 1.0, dir: 0, wait: 0 } ];
            this.goal = { x: 100, y: 20, r: 15 };
        } 
        else if (this.level === 1) {
            this.walls = [
                {x: 60, y: 40, w: 20, h: 100}, {x: 120, y: 40, w: 20, h: 100},
                {x: 0, y: 180, w: 80, h: 20}, {x: 120, y: 180, w: 80, h: 20}
            ];
            this.doors = [ {x: 80, y: 80, w: 40, h: 20, id: 1, open: false} ];
            this.switches = [ {x: 30, y: 80, r: 10, id: 1, active: false} ];
            this.enemies = [
                { x: 100, y: 240, path: [{x:40,y:240}, {x:160,y:240}], pt: 0, spd: 1.2, dir: 0, wait: 0 },
                { x: 100, y: 140, path: [{x:100,y:140}, {x:100,y:200}], pt: 0, spd: 1.5, dir: 0, wait: 0 }
            ];
            this.goal = { x: 100, y: 20, r: 15 };
        }
        else if (this.level === 2) {
            this.walls = [
                {x: 40, y: 220, w: 120, h: 20},
                {x: 40, y: 140, w: 60, h: 20}, {x: 140, y: 140, w: 60, h: 20},
                {x: 80, y: 60, w: 40, h: 80}
            ];
            this.doors = [
                {x: 0, y: 220, w: 40, h: 20, id: 1, open: false},
                {x: 160, y: 220, w: 40, h: 20, id: 2, open: false},
                {x: 100, y: 140, w: 40, h: 20, id: 3, open: false}
            ];
            this.switches = [
                {x: 100, y: 180, r: 10, id: 1, active: false},
                {x: 20, y: 180, r: 10, id: 2, active: false},
                {x: 180, y: 180, r: 10, id: 3, active: false}
            ];
            this.enemies = [
                { x: 100, y: 260, path: [{x:20,y:260}, {x:180,y:260}], pt: 0, spd: 1.8, dir: 0, wait: 0 },
                { x: 40, y: 90, path: [{x:40,y:90}, {x:40,y:130}], pt: 0, spd: 1.5, dir: 0, wait: 0 },
                { x: 160, y: 90, path: [{x:160,y:90}, {x:160,y:130}], pt: 0, spd: 1.5, dir: 0, wait: 0 }
            ];
            this.goal = { x: 100, y: 20, r: 15 };
        }

        if (typeof BGM !== 'undefined') BGM.stop();
        VoiceSys.speak('エコー', '作戦開始だミュート！');
    },

    lineHitRect(x1, y1, x2, y2, rect) {
        let steps = 10;
        for(let i = 0; i <= steps; i++) {
            let px = x1 + (x2 - x1) * (i / steps);
            let py = y1 + (y2 - y1) * (i / steps);
            if (px > rect.x && px < rect.x + rect.w && py > rect.y && py < rect.y + rect.h) return true;
        }
        return false;
    },
    
    update() {
        if (keysDown.select) { VoiceSys.stop(); switchApp(Menu); return; }
        this.tmr++;

        if (this.st === 'title') {
            if (keysDown.a) { 
                this.stats = { kills: 0, noise: 0, boxTime: 0, time: 0 };
                this.level = 0;
                if(typeof playSnd !== 'undefined') playSnd('jmp');
                this.startStory(0); 
            }
            return;
        }

        if (this.st === 'story') {
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            if (this.tmr % 2 === 0 && this.strToShow.length < msg.t.length) {
                this.strToShow += msg.t[this.strToShow.length];
                if (this.strToShow.length % 3 === 0 && typeof playSnd !== 'undefined') playSnd('sel');
            }
            if (keysDown.a) {
                if (this.strToShow.length < msg.t.length) { this.strToShow = msg.t; } 
                else {
                    this.msgIdx++;
                    if (this.msgIdx < SCENARIOS[this.scIdx].length) { this.setupMessage(); } 
                    else {
                        VoiceSys.stop();
                        if (this.scIdx === 3) { this.st = 'result'; this.tmr = 0; } 
                        else { this.loadLevel(); }
                    }
                }
            }
            return;
        }

        if (this.st === 'gameover' || this.st === 'result') {
            if (this.msgLife > 0) this.msgLife--;
            if (this.tmr > 60 && (keysDown.a || keysDown.b)) { this.st = 'title'; this.tmr = 0; }
            return;
        }

        // ================= PLAY =================
        this.stats.time++;
        if (this.msgLife > 0) this.msgLife--;
        
        this.p.box = keys.b;
        if (this.p.box) {
            this.stats.boxTime++;
            if (this.tmr % 180 === 0) VoiceSys.speak('エコー', Math.random() < 0.5 ? 'おいゴミ箱、敵が来てるぞ！' : 'ダンボール光ってて草');
        }

        let moved = false; let vx = 0, vy = 0;
        let currentSpd = this.p.box ? this.p.spd * 0.4 : this.p.spd;
        if (keys.left)  { vx -= currentSpd; moved = true; }
        if (keys.right) { vx += currentSpd; moved = true; }
        if (keys.up)    { vy -= currentSpd; moved = true; }
        if (keys.down)  { vy += currentSpd; moved = true; }
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        
        let nx = this.p.x + vx; let ny = this.p.y + vy;
        let hitWall = false;
        
        // 閉まっている扉も壁として扱う
        let activeWalls = [...this.walls, ...this.doors.filter(d => !d.open)];
        for (let w of activeWalls) {
            if (nx + this.p.r > w.x && nx - this.p.r < w.x + w.w && ny + this.p.r > w.y && ny - this.p.r < w.y + w.h) { hitWall = true; break; }
        }
        if (!hitWall) { this.p.x = nx; this.p.y = ny; }
        this.p.x = Math.max(10, Math.min(190, this.p.x));
        this.p.y = Math.max(10, Math.min(290, this.p.y));

        // --- パズル：スイッチを踏む判定 ---
        for (let s of this.switches) {
            if (!s.active && Math.hypot(this.p.x - s.x, this.p.y - s.y) < s.r + this.p.r) {
                s.active = true;
                if(typeof playSnd !== 'undefined') playSnd('sel');
                VoiceSys.speak('エコー', 'よし、扉が開いたぞ！');
                this.texts.push({ x: s.x, y: s.y, text: 'CLICK!', col: '#0ff', life: 40, maxLife: 40, size: 20, rot: 0 });
                for (let d of this.doors) { if (d.id === s.id) d.open = true; }
            }
        }

        // --- ステルスキル ---
        if (keysDown.a && !this.p.box) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let e = this.enemies[i];
                if (Math.hypot(e.x - this.p.x, e.y - this.p.y) < 25) {
                    this.enemies.splice(i, 1);
                    this.stats.kills++;
                    this.texts.push({ x: 100, y: 150, text: 'NICE KILL!!!', col: '#0f0', life: 90, maxLife: 90, size: 30, rot: 0, center: true });
                    VoiceSys.speak('エコー', 'ひゅーっ！ナイスキル！');
                    if(typeof playSnd !== 'undefined') playSnd('combo');
                    if(typeof screenShake !== 'undefined') screenShake(10);
                    break;
                }
            }
        }
        
        // --- 📢 歩行ノイズ ---
        let noiseInterval = 15;
        if (moved && !this.p.box && this.tmr % noiseInterval === 0) {
            let words = ['ドスッ!', 'バァーン!', 'スサッ', 'ドン!'];
            let cols = ['#f00', '#ff0', '#f0f', '#0ff'];
            this.texts.push({
                x: this.p.x + (Math.random()-0.5)*80,
                y: this.p.y + (Math.random()-0.5)*80,
                text: words[Math.floor(Math.random()*words.length)],
                col: cols[Math.floor(Math.random()*cols.length)],
                life: 60, maxLife: 60, size: 20 + Math.random()*20, rot: (Math.random()-0.5)*0.5
            });
            this.stats.noise++;
            if (typeof playSnd !== 'undefined') playSnd(Math.random() < 0.5 ? 'hit' : 'jmp'); 
            if (this.stats.noise % 25 === 0) VoiceSys.speak('エコー', '足音デカすぎだろ！');
        }
        
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i];
            t.life--;
            if (!t.center) t.y -= 0.3; 
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        // --- ゴール判定 ---
        if (Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r) {
            this.level++;
            if(typeof playSnd !== 'undefined') playSnd('combo');
            this.startStory(this.level);
            return;
        }

        // --- 敵兵のAIと視界判定 ---
        for (let e of this.enemies) {
            let target = e.path[e.pt];
            let dx = target.x - e.x, dy = target.y - e.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist < 2) {
                if (e.wait > 0) e.wait--;
                else { e.pt = (e.pt + 1) % e.path.length; e.wait = 60; } 
            } else {
                e.dir = Math.atan2(dy, dx);
                e.x += Math.cos(e.dir) * e.spd;
                e.y += Math.sin(e.dir) * e.spd;
            }

            if (!this.p.box) {
                let pdx = this.p.x - e.x, pdy = this.p.y - e.y;
                if (Math.hypot(pdx, pdy) < 60) {
                    let angleDiff = Math.abs(Math.atan2(pdy, pdx) - e.dir);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    
                    if (angleDiff < 0.6) { 
                        let hidden = false;
                        for (let w of activeWalls) { // 閉まってる扉も遮蔽になる
                            if (this.lineHitRect(e.x, e.y, this.p.x, this.p.y, w)) { hidden = true; break; }
                        }
                        
                        if (!hidden) {
                            this.st = 'gameover'; this.tmr = 0;
                            VoiceSys.speak('エコー', 'あーあ、見つかっちゃった。俺のせいじゃないからなｗ');
                            if(typeof playSnd !== 'undefined') playSnd('hit');
                            if(typeof screenShake !== 'undefined') screenShake(15);
                            this.texts.push({ x: 100, y: 150, text: 'SPOTTED!!', col: '#f00', life: 120, maxLife: 120, size: 40, rot: 0, center: true });
                        }
                    }
                }
            }
        }
    },

    drawSpriteData(x, y, data, scale) {
        if(!data) return;
        for (let row = 0; row < 16; row++) {
            for (let col = 0; col < 16; col++) {
                let p = data[row][col];
                if (PAL[p]) { ctx.fillStyle = PAL[p]; ctx.fillRect(x + col * scale, y + row * scale, scale, scale); }
            }
        }
    },
    
    draw() {
        ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
        
        // ================= TITLE =================
        if (this.st === 'title') {
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.2;
            for(let i=0; i<200; i+=10) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(100,300); ctx.stroke(); }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = '#f80'; ctx.font = 'bold 26px "Arial Black", sans-serif';
            ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
            ctx.fillText('NOISE', 55, 100); ctx.fillText('AGENT', 55, 130);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('- 爆音スニーキング -', 45, 160);
            if (this.tmr % 60 < 30) { ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 45, 220); }
            return;
        }

        // ================= STORY =================
        if (this.st === 'story') {
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            ctx.fillStyle = '#112'; ctx.fillRect(0,0,200,300);
            ctx.strokeStyle = '#334'; ctx.lineWidth = 1;
            for(let i=0; i<300; i+=10) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }

            let spData = CHAR_SPRITES[msg.c];
            if (spData) this.drawSpriteData(60, 40, spData, 5); 

            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 180, 180, 110);
            ctx.strokeStyle = msg.c === '司令官ノイズ' ? '#f00' : '#0ff';
            ctx.lineWidth = 2; ctx.strokeRect(10, 180, 180, 110);

            ctx.fillStyle = msg.c === '司令官ノイズ' ? '#f55' : (msg.c === 'ミュート' ? '#aaa' : '#0f0');
            ctx.font = 'bold 12px monospace'; ctx.fillText(`【 ${msg.c} 】`, 15, 200);

            ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
            let textY = 220; let currentLine = '';
            for (let i = 0; i < this.strToShow.length; i++) {
                currentLine += this.strToShow[i];
                if (currentLine.length > 14) { ctx.fillText(currentLine, 20, textY); textY += 16; currentLine = ''; }
            }
            ctx.fillText(currentLine, 20, textY);

            if (this.strToShow.length === msg.t.length && this.tmr % 30 < 15) {
                ctx.fillStyle = '#ff0'; ctx.fillText('▼', 170, 280);
            }
            return;
        }

        // ================= PLAY & GAMEOVER =================
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke(); }
        for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }

        // 壁と扉の描画
        ctx.fillStyle = '#555';
        for (let w of this.walls) {
            ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeStyle = '#000'; ctx.strokeRect(w.x, w.y, w.w, w.h);
        }
        for (let d of this.doors) {
            if (!d.open) {
                ctx.fillStyle = '#05a'; ctx.fillRect(d.x, d.y, d.w, d.h);
                ctx.strokeStyle = '#0ff'; ctx.strokeRect(d.x, d.y, d.w, d.h);
            }
        }

        // スイッチの描画
        for (let s of this.switches) {
            ctx.fillStyle = s.active ? '#0a0' : '#00f';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = s.active ? '#0f0' : '#0ff'; ctx.stroke();
        }

        // ゴール
        ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})`;
        ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('GOAL', this.goal.x-12, this.goal.y+3);

        // 敵
        for (let e of this.enemies) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 60, e.dir - 0.6, e.dir + 0.6); ctx.fill();
            ctx.fillStyle = '#0a0'; ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir)*10, e.y + Math.sin(e.dir)*10); ctx.stroke();
        }

        // プレイヤー
        if (this.p.box) {
            let waveY = Math.sin(this.tmr * 0.2) * 2;
            ctx.fillStyle = `hsl(${(this.tmr * 5) % 360}, 100%, 50%)`;
            ctx.fillRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(this.p.x - 4, this.p.y - 2 + waveY, 8, 2);
        } else {
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        // ウザい文字
        for (let t of this.texts) {
            ctx.save();
            if (t.center) { ctx.translate(100, 150); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; } 
            else { ctx.translate(t.x, t.y); ctx.textAlign = 'left'; }
            ctx.rotate(t.rot);
            ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
            ctx.globalAlpha = t.life / t.maxLife; 
            ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0);
            ctx.globalAlpha = 1.0; ctx.restore();
        }

        // --- ★ プレイ中エコーの字幕（復活！） ---
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 260, 200, 40);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(2, 262, 196, 36);
        ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
        
        if (this.msgLife > 0 && this.msg !== '') {
            if (this.msg.length > 18) {
                ctx.fillText(this.msg.substring(0, 18), 10, 275);
                ctx.fillText(this.msg.substring(18), 10, 288);
            } else {
                ctx.fillText(this.msg, 10, 280);
            }
        } else {
            ctx.fillStyle = '#444'; ctx.fillText('NO SIGNAL...', 10, 280);
        }

        // レベル表示UI
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,200,15);
        ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
        ctx.fillText(`LEVEL: ${this.level + 1}`, 5, 11);

        // ================= RESULT =================
        if (this.st === 'result') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace';
            ctx.fillText('ALL CLEAR!!', 100, 50);
            
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(`KILLS : ${this.stats.kills}`, 100, 100);
            ctx.fillText(`NOISES: ${this.stats.noise}`, 100, 120);
            
            let title = "NORMAL SPY"; let tCol = '#fff';
            if (this.stats.kills === 0) { title = "GHOST (不殺)"; tCol = '#0ff'; }
            else if (this.stats.boxTime > this.stats.time / 2) { title = "BOX LOVER"; tCol = '#ff0'; }
            else if (this.stats.noise > 150) { title = "NOISY NINJA"; tCol = '#f0f'; }
            
            ctx.fillStyle = '#f80'; ctx.fillText('YOUR RANK:', 100, 160);
            ctx.fillStyle = tCol; ctx.font = 'bold 16px monospace';
            ctx.fillText(title, 100, 185);
            
            if (this.tmr > 60) {
                ctx.fillStyle = '#ccc'; ctx.font = '10px monospace';
                ctx.fillText('PRESS [A] TO RETURN', 100, 250);
            }
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        }
    }
};
