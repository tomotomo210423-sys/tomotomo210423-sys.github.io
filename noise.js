// === NOISE AGENT (Phase 2: Story Mode & AI Voice Edition) ===

// ★ AI音声システム（アンロック機構付き・複数キャラ対応）
const VoiceSys = {
    voices: [],
    unlocked: false,
    init() {
        let loadV = () => { this.voices = speechSynthesis.getVoices().filter(v => v.lang.includes('ja')); };
        loadV();
        if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadV;

        // ★ 音声ブロック解除システム（画面タップ時に強制アンロック）
        const unlock = () => {
            if(!this.unlocked) {
                let u = new SpeechSynthesisUtterance('');
                u.volume = 0; // 無音で再生してエンジンを起動
                speechSynthesis.speak(u);
                this.unlocked = true;
            }
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('mousedown', unlock);
        };
        window.addEventListener('touchstart', unlock, {once:true});
        window.addEventListener('mousedown', unlock, {once:true});
    },
    speak(char, txt) {
        speechSynthesis.cancel(); // 前の音声を消す
        if (char === 'ミュート') return; // 主人公は喋らない
        
        let u = new SpeechSynthesisUtterance(txt);
        // 男性の声を優先的に探す
        if (this.voices.length > 0) {
            u.voice = this.voices.find(v => v.name.includes('Google') || v.name.includes('Male') || v.name.includes('Taro')) || this.voices[0];
        }
        
        // キャラクターごとの声質調整
        if (char === 'エコー') { 
            u.pitch = 1.3; u.rate = 1.3; // 軽快な若者
        } else if (char === '司令官ノイズ') { 
            u.pitch = 0.5; u.rate = 0.9; // 低く威圧的な声
        } else {
            u.pitch = 1.0; u.rate = 1.0;
        }
        
        u.volume = 1.0;
        speechSynthesis.speak(u);
    },
    stop() { speechSynthesis.cancel(); }
};

// ★ キャラクターのドット絵データ (16x16)
const PAL = { '0':null, '1':'#000', '2':'#fff', '3':'#fca', '4':'#f00', '5':'#0ff', '6':'#0a0', '7':'#fa0', '8':'#444', '9':'#888' };
const CHAR_SPRITES = {
    'エコー': [ // ヘッドホンをつけたお調子者ハッカー
        "0000000000000000","0001111111111000","0011111111111100","0113311111133110",
        "0133331111333310","0133333333333310","0113333333333110","001155f55f551100",
        "0003333333333000","0003333113333000","0000333333330000","0000111111110000",
        "0001551111551000","0011555555551100","0011555555551100","0000000000000000"
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

// ★ ストーリーのシナリオデータ
const SCENARIOS = [
    // 0: オープニング (Level 1 前)
    [
        { c: 'エコー', t: '聞こえるかミュート？ついに敵基地への潜入作戦開始だ。' },
        { c: 'エコー', t: 'だが最悪なニュースがある。お前のステルスブーツがハッキングされた！' },
        { c: 'エコー', t: '歩くたびに爆音と【巨大な文字】が出る、呪いの靴になっちまったんだ！ｗ' },
        { c: 'ミュート', t: '……。' },
        { c: 'エコー', t: '文字が邪魔で前が見えないだろうが、Aボタンで暗殺、Bボタンでダンボールだ！' },
        { c: 'エコー', t: '敵の赤い視界を避けて、緑のゴールを目指せ！死ぬなよ！ｗ' }
    ],
    // 1: Level 1 クリア後 (Level 2 前)
    [
        { c: '司令官ノイズ', t: '侵入者め...ネズミが迷い込んだようだな。' },
        { c: 'エコー', t: 'やべぇ！敵のボス「司令官ノイズ」に気づかれたぞ！' },
        { c: '司令官ノイズ', t: 'そのやかましい足音...貴様、スパイの風上にも置けん奴だ！' },
        { c: '司令官ノイズ', t: '警備システムを「レベル2」に引き上げろ！あのウルサイ奴を蜂の巣にしろ！' },
        { c: 'ミュート', t: '……！' },
        { c: 'エコー', t: '敵の数が増えたぞ！ダンボール(B)を駆使して切り抜けろ！' }
    ],
    // 2: Level 2 クリア後 (Level 3 前)
    [
        { c: '司令官ノイズ', t: 'ええい！なぜあんな騒がしい奴を捕まえられんのだ！！' },
        { c: '司令官ノイズ', t: '機密データルームに親衛隊を配置しろ！絶対にここを通すな！' },
        { c: 'エコー', t: '次が最終エリアだミュート！敵がウジャウジャいるぞ！' },
        { c: 'エコー', t: '自分の足音の「文字」で前が見えなくなったら終わりだ。慎重に行けよ！' }
    ],
    // 3: エンディング (全クリア後)
    [
        { c: 'エコー', t: 'ミッション・コンプリート！！機密データを奪取したぞ！' },
        { c: '司令官ノイズ', t: 'バカな...あんなうるさいフザケた奴に...私の基地が...！ぐはぁっ！' },
        { c: 'ミュート', t: '……（サムズアップ）' },
        { c: 'エコー', t: 'さぁ帰ろうぜ、ミュート！俺のおごりでピザパだ！最高に笑える作戦だったぜ！' }
    ]
];


const Noise = {
    st: 'title', // title, story, play, gameover, result
    tmr: 0,
    level: 0, // 現在のステージレベル (0〜2)
    
    // ストーリー用変数
    scIdx: 0, msgIdx: 0, charTimer: 0, strToShow: '',
    
    p: { x: 100, y: 280, r: 6, spd: 2.5, box: false },
    texts: [], enemies: [], walls: [], goal: { x: 100, y: 20, r: 15 },
    stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    
    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        
        this.st = 'title'; this.tmr = 0; this.level = 0;
        VoiceSys.init();
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    // ノベルモードの開始
    startStory(sIdx) {
        this.st = 'story';
        this.scIdx = sIdx;
        this.msgIdx = 0;
        this.tmr = 0;
        this.setupMessage();
    },

    setupMessage() {
        let msg = SCENARIOS[this.scIdx][this.msgIdx];
        this.strToShow = '';
        this.charTimer = 0;
        VoiceSys.speak(msg.c, msg.t); // 音声再生
    },

    // レベルのロード
    loadLevel() {
        this.st = 'play';
        this.p = { x: 100, y: 280, r: 6, spd: 2.5, box: false };
        this.texts = []; this.tmr = 0;
        
        // レベルごとのマップ構成
        if (this.level === 0) {
            // Level 1: チュートリアル
            this.walls = [ {x: 40, y: 60, w: 120, h: 20}, {x: 40, y: 150, w: 120, h: 20} ];
            this.enemies = [
                { x: 30, y: 120, path: [{x:30,y:120}, {x:170,y:120}], pt: 0, spd: 1.0, dir: 0, wait: 0 },
                { x: 170, y: 200, path: [{x:170,y:200}, {x:30,y:200}], pt: 0, spd: 1.0, dir: 0, wait: 0 }
            ];
            this.goal = { x: 100, y: 20, r: 15 };
        } 
        else if (this.level === 1) {
            // Level 2: 迷路
            this.walls = [
                {x: 0, y: 230, w: 80, h: 20}, {x: 120, y: 230, w: 80, h: 20},
                {x: 40, y: 120, w: 20, h: 110}, {x: 140, y: 120, w: 20, h: 110},
                {x: 60, y: 60, w: 80, h: 20}
            ];
            this.enemies = [
                { x: 100, y: 250, path: [{x:100,y:250}, {x:100,y:140}], pt: 0, spd: 1.2, dir: 0, wait: 0 },
                { x: 20, y: 80, path: [{x:20,y:80}, {x:20,y:200}, {x:80,y:200}], pt: 0, spd: 1.5, dir: 0, wait: 0 },
                { x: 180, y: 80, path: [{x:180,y:80}, {x:180,y:200}, {x:120,y:200}], pt: 0, spd: 1.5, dir: 0, wait: 0 }
            ];
            this.goal = { x: 100, y: 20, r: 15 };
        }
        else if (this.level === 2) {
            // Level 3: 親衛隊
            this.walls = [
                {x: 40, y: 200, w: 40, h: 40}, {x: 120, y: 200, w: 40, h: 40},
                {x: 80, y: 120, w: 40, h: 40}, {x: 20, y: 60, w: 60, h: 20}, {x: 120, y: 60, w: 60, h: 20}
            ];
            this.enemies = [
                { x: 100, y: 260, path: [{x:20,y:260}, {x:180,y:260}], pt: 0, spd: 1.8, dir: 0, wait: 0 },
                { x: 40, y: 150, path: [{x:40,y:150}, {x:40,y:90}], pt: 0, spd: 1.2, dir: 0, wait: 0 },
                { x: 160, y: 150, path: [{x:160,y:150}, {x:160,y:90}], pt: 0, spd: 1.2, dir: 0, wait: 0 },
                { x: 100, y: 90, path: [{x:100,y:90}, {x:100,y:40}], pt: 0, spd: 2.0, dir: 0, wait: 0 } // ゴール前の速い敵
            ];
            this.goal = { x: 100, y: 20, r: 15 };
        }

        if (typeof BGM !== 'undefined') BGM.stop();
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

        // ================= TITLE =================
        if (this.st === 'title') {
            if (keysDown.a) { 
                this.stats = { kills: 0, noise: 0, boxTime: 0, time: 0 };
                this.level = 0;
                if(typeof playSnd !== 'undefined') playSnd('jmp');
                this.startStory(0); // OPストーリーへ
            }
            return;
        }

        // ================= STORY (ノベルモード) =================
        if (this.st === 'story') {
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            
            // 文字送りアニメーション
            if (this.tmr % 2 === 0 && this.strToShow.length < msg.t.length) {
                this.strToShow += msg.t[this.strToShow.length];
                if (this.strToShow.length % 3 === 0 && typeof playSnd !== 'undefined') playSnd('sel');
            }

            // Aボタンで次へ
            if (keysDown.a) {
                if (this.strToShow.length < msg.t.length) {
                    this.strToShow = msg.t; // 全表示
                } else {
                    this.msgIdx++;
                    if (this.msgIdx < SCENARIOS[this.scIdx].length) {
                        this.setupMessage();
                    } else {
                        // シナリオ終了後の遷移
                        VoiceSys.stop();
                        if (this.scIdx === 3) {
                            this.st = 'result'; // エンディング後はリザルトへ
                            this.tmr = 0;
                        } else {
                            this.loadLevel(); // それ以外は次のゲームレベルへ
                        }
                    }
                }
            }
            return;
        }

        // ================= GAMEOVER & RESULT =================
        if (this.st === 'gameover' || this.st === 'result') {
            if (this.tmr > 60 && (keysDown.a || keysDown.b)) {
                this.st = 'title'; this.tmr = 0;
            }
            return;
        }

        // ================= PLAY =================
        this.stats.time++;
        
        // --- ダンボールモード ---
        this.p.box = keys.b;
        if (this.p.box) {
            this.stats.boxTime++;
            if (this.tmr % 180 === 0) VoiceSys.speak('エコー', Math.random() < 0.5 ? 'おいゴミ箱、敵が来てるぞ！' : 'ダンボール光ってて草');
        }

        // --- プレイヤー移動 ---
        let moved = false;
        let vx = 0, vy = 0;
        let currentSpd = this.p.box ? this.p.spd * 0.4 : this.p.spd;
        
        if (keys.left)  { vx -= currentSpd; moved = true; }
        if (keys.right) { vx += currentSpd; moved = true; }
        if (keys.up)    { vy -= currentSpd; moved = true; }
        if (keys.down)  { vy += currentSpd; moved = true; }
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        
        let nx = this.p.x + vx; let ny = this.p.y + vy;
        let hitWall = false;
        for (let w of this.walls) {
            if (nx + this.p.r > w.x && nx - this.p.r < w.x + w.w && ny + this.p.r > w.y && ny - this.p.r < w.y + w.h) {
                hitWall = true; break;
            }
        }
        if (!hitWall) { this.p.x = nx; this.p.y = ny; }
        this.p.x = Math.max(10, Math.min(190, this.p.x));
        this.p.y = Math.max(10, Math.min(290, this.p.y));

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

        // --- ゴール判定（次のレベルへ） ---
        if (Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r) {
            this.level++;
            if(typeof playSnd !== 'undefined') playSnd('combo');
            // 次のシナリオへ移行
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
                        for (let w of this.walls) {
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

    // ドット絵描画ヘルパー
    drawSpriteData(x, y, data, scale) {
        if(!data) return;
        for (let row = 0; row < 16; row++) {
            for (let col = 0; col < 16; col++) {
                let p = data[row][col];
                if (PAL[p]) {
                    ctx.fillStyle = PAL[p];
                    ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
                }
            }
        }
    },
    
    draw() {
        ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
        
        // ================= TITLE =================
        if (this.st === 'title') {
            // サイバーパンク風グリッド
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.2;
            for(let i=0; i<200; i+=10) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(100,300); ctx.stroke(); }
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = '#f80'; ctx.font = 'bold 26px "Arial Black", sans-serif';
            ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
            ctx.fillText('NOISE', 55, 100);
            ctx.fillText('AGENT', 55, 130);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('- 爆音スニーキング -', 45, 160);

            if (this.tmr % 60 < 30) {
                ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 45, 220);
            }
            return;
        }

        // ================= STORY (ノベルモード) =================
        if (this.st === 'story') {
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            
            // 背景演出
            ctx.fillStyle = '#112'; ctx.fillRect(0,0,200,300);
            ctx.strokeStyle = '#334'; ctx.lineWidth = 1;
            for(let i=0; i<300; i+=10) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }

            // キャラクター描画 (中央上部)
            let spData = CHAR_SPRITES[msg.c];
            if (spData) {
                this.drawSpriteData(60, 40, spData, 5); // 16x5=80px
            }

            // メッセージウィンドウ
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 180, 180, 110);
            ctx.strokeStyle = msg.c === '司令官ノイズ' ? '#f00' : '#0ff';
            ctx.lineWidth = 2; ctx.strokeRect(10, 180, 180, 110);

            // 話者名
            ctx.fillStyle = msg.c === '司令官ノイズ' ? '#f55' : (msg.c === 'ミュート' ? '#aaa' : '#0f0');
            ctx.font = 'bold 12px monospace';
            ctx.fillText(`【 ${msg.c} 】`, 15, 200);

            // テキスト（折り返し処理）
            ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
            let textY = 220;
            let currentLine = '';
            for (let i = 0; i < this.strToShow.length; i++) {
                currentLine += this.strToShow[i];
                if (currentLine.length > 14) {
                    ctx.fillText(currentLine, 20, textY);
                    textY += 16;
                    currentLine = '';
                }
            }
            ctx.fillText(currentLine, 20, textY);

            // 次へマーカー
            if (this.strToShow.length === msg.t.length && this.tmr % 30 < 15) {
                ctx.fillStyle = '#ff0'; ctx.fillText('▼', 170, 280);
            }
            return;
        }

        // ================= PLAY & RESULT =================
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke(); }
        for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }

        ctx.fillStyle = '#555';
        for (let w of this.walls) {
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeStyle = '#000'; ctx.strokeRect(w.x, w.y, w.w, w.h);
        }

        ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})`;
        ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('GOAL', this.goal.x-12, this.goal.y+3);

        for (let e of this.enemies) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, 60, e.dir - 0.6, e.dir + 0.6); ctx.fill();
            ctx.fillStyle = '#0a0';
            ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir)*10, e.y + Math.sin(e.dir)*10); ctx.stroke();
        }

        if (this.p.box) {
            let waveY = Math.sin(this.tmr * 0.2) * 2;
            ctx.fillStyle = `hsl(${(this.tmr * 5) % 360}, 100%, 50%)`;
            ctx.fillRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(this.p.x - 4, this.p.y - 2 + waveY, 8, 2);
        } else {
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        for (let t of this.texts) {
            ctx.save();
            if (t.center) { ctx.translate(100, 150); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; } 
            else { ctx.translate(t.x, t.y); ctx.textAlign = 'left'; }
            ctx.rotate(t.rot);
            ctx.fillStyle = t.col;
            ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
            ctx.globalAlpha = t.life / t.maxLife; 
            ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0);
            ctx.globalAlpha = 1.0; ctx.restore();
        }

        // ステータスUI (Level)
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,200,15);
        ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
        ctx.fillText(`LEVEL: ${this.level + 1}`, 5, 11);

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
