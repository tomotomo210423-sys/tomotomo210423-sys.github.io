// === NOISE AGENT (Ultimate Stealth & AI Voice Edition) ===

// ★ 相棒エコーのAI音声システム
const Echo = {
    voices: [],
    lastTime: 0,
    init() {
        // 日本語の音声をロード
        let getV = () => { this.voices = speechSynthesis.getVoices().filter(v => v.lang.includes('ja')); };
        getV();
        if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = getV;
    },
    speak(txt, force = false) {
        if (!force && Date.now() - this.lastTime < 4000) return; // 連続で喋りすぎないように
        let u = new SpeechSynthesisUtterance(txt);
        // 男性っぽい声やGoogleの声を優先
        if (this.voices.length > 0) {
            u.voice = this.voices.find(v => v.name.includes('Google') || v.name.includes('Male')) || this.voices[0];
        }
        u.pitch = 0.8; // 少し低めの声
        u.rate = 1.3;  // お調子者っぽく少し早口
        u.volume = 1.0;
        speechSynthesis.speak(u);
        this.lastTime = Date.now();
        
        // 画面下部の字幕も更新
        Noise.msg = `エコー「${txt}」`;
        Noise.msgLife = 180;
    },
    stop() {
        speechSynthesis.cancel();
    }
};

const Noise = {
    st: 'title', // title, play, gameover, result
    tmr: 0,
    p: { x: 100, y: 280, r: 6, spd: 2.5, box: false },
    texts: [],
    enemies: [],
    walls: [
        {x: 40, y: 50, w: 120, h: 20},
        {x: 40, y: 120, w: 20, h: 100},
        {x: 140, y: 120, w: 20, h: 100},
        {x: 0, y: 250, w: 80, h: 20}
    ],
    goal: { x: 100, y: 20, r: 15 },
    
    stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    msg: '', msgLife: 0,
    
    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss'); // 縦画面に戻す
        canvas.width = 200; canvas.height = 300;
        
        this.st = 'title'; this.tmr = 0;
        Echo.init(); // 音声システムの初期化
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startGame() {
        this.st = 'play';
        this.p = { x: 100, y: 280, r: 6, spd: 2.5, box: false };
        this.texts = [];
        this.stats = { kills: 0, noise: 0, boxTime: 0, time: 0 };
        this.tmr = 0;
        
        // 敵の配置（パトロールルート設定）
        this.enemies = [
            { x: 30, y: 100, path: [{x:30,y:100}, {x:170,y:100}], pt: 0, spd: 1, dir: 0, wait: 0 },
            { x: 100, y: 220, path: [{x:100,y:220}, {x:100,y:140}, {x:170,y:140}, {x:170,y:220}], pt: 0, spd: 1.2, dir: 0, wait: 0 },
            { x: 170, y: 30, path: [{x:170,y:30}, {x:30,y:30}], pt: 0, spd: 0.8, dir: 0, wait: 0 }
        ];

        Echo.stop();
        Echo.speak('作戦開始だミュート！呪いの靴の調子はどうだ？ｗ', true);
        if (typeof BGM !== 'undefined') BGM.stop();
    },

    // 簡易的な線分と矩形（壁）の交差判定
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
        if (keysDown.select) { Echo.stop(); switchApp(Menu); return; }
        
        this.tmr++;
        if (this.msgLife > 0) this.msgLife--;

        // ================= TITLE =================
        if (this.st === 'title') {
            if (keysDown.a) { this.startGame(); if(typeof playSnd !== 'undefined') playSnd('jmp'); }
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
        
        // --- ダンボールモード（Bボタン） ---
        this.p.box = keys.b;
        if (this.p.box) {
            this.stats.boxTime++;
            if (this.tmr % 180 === 0) Echo.speak(Math.random() < 0.5 ? 'おいゴミ箱、敵が来てるぞ！' : 'ダンボール光ってて草');
        }

        // --- プレイヤー移動 ---
        let moved = false;
        let vx = 0, vy = 0;
        let currentSpd = this.p.box ? this.p.spd * 0.4 : this.p.spd; // 箱の中は遅い
        
        if (keys.left)  { vx -= currentSpd; moved = true; }
        if (keys.right) { vx += currentSpd; moved = true; }
        if (keys.up)    { vy -= currentSpd; moved = true; }
        if (keys.down)  { vy += currentSpd; moved = true; }
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        
        // 壁との当たり判定（仮移動して当たるなら戻す）
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

        // --- ステルスキル（Aボタン） ---
        if (keysDown.a && !this.p.box) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let e = this.enemies[i];
                if (Math.hypot(e.x - this.p.x, e.y - this.p.y) < 25) {
                    this.enemies.splice(i, 1);
                    this.stats.kills++;
                    // ★ パリピ文字演出
                    this.texts.push({ x: 100, y: 150, text: 'NICE KILL!!!', col: '#0f0', life: 90, maxLife: 90, size: 30, rot: 0, center: true });
                    Echo.speak('ひゅーっ！ナイスキル！80点！', true);
                    if(typeof playSnd !== 'undefined') playSnd('combo');
                    if(typeof screenShake !== 'undefined') screenShake(10);
                    break;
                }
            }
        }
        
        // --- 📢 歩行ノイズ（視界塞ぎ） ---
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
            
            if (this.stats.noise % 20 === 0) Echo.speak('足音デカすぎ！忍者の才能ねーな！');
        }
        
        // 文字の更新
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i];
            t.life--;
            if (!t.center) t.y -= 0.3; 
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        // --- ゴール判定 ---
        if (Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r) {
            this.st = 'result'; this.tmr = 0;
            Echo.speak('ミッション・コンプリート！帰ってピザ食おうぜ！', true);
            if(typeof playSnd !== 'undefined') playSnd('combo');
            return;
        }

        // --- 敵兵のAIと視界判定 ---
        for (let e of this.enemies) {
            // 移動（パトロール）
            let target = e.path[e.pt];
            let dx = target.x - e.x, dy = target.y - e.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist < 2) {
                if (e.wait > 0) e.wait--;
                else { e.pt = (e.pt + 1) % e.path.length; e.wait = 60; } // 1秒待って次へ
            } else {
                e.dir = Math.atan2(dy, dx);
                e.x += Math.cos(e.dir) * e.spd;
                e.y += Math.sin(e.dir) * e.spd;
            }

            // 視界判定（見つかったか？）
            // ダンボール中（box）なら見逃してくれる
            if (!this.p.box) {
                let pdx = this.p.x - e.x, pdy = this.p.y - e.y;
                let pDist = Math.hypot(pdx, pdy);
                if (pDist < 60) { // 視界の距離
                    let pAngle = Math.atan2(pdy, pdx);
                    let angleDiff = Math.abs(pAngle - e.dir);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    
                    if (angleDiff < 0.6) { // 視野角（約70度）
                        // 壁の遮蔽判定
                        let hidden = false;
                        for (let w of this.walls) {
                            if (this.lineHitRect(e.x, e.y, this.p.x, this.p.y, w)) { hidden = true; break; }
                        }
                        
                        if (!hidden) {
                            // 発見された！！即ゲームオーバー
                            this.st = 'gameover'; this.tmr = 0;
                            Echo.speak('あーあ、見つかっちゃった。俺のせいじゃないからなｗ', true);
                            if(typeof playSnd !== 'undefined') playSnd('hit');
                            if(typeof screenShake !== 'undefined') screenShake(15);
                            this.texts.push({ x: 100, y: 150, text: 'SPOTTED!!', col: '#f00', life: 120, maxLife: 120, size: 40, rot: 0, center: true });
                        }
                    }
                }
            }
        }
    },
    
    draw() {
        // 背景とグリッド
        ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,300); ctx.stroke(); }
        for(let i=0; i<300; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }

        // 壁の描画
        ctx.fillStyle = '#555';
        for (let w of this.walls) {
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeStyle = '#000'; ctx.strokeRect(w.x, w.y, w.w, w.h);
        }

        // ゴールの描画
        ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})`;
        ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('GOAL', this.goal.x-12, this.goal.y+3);

        if (this.st === 'title') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            ctx.fillStyle = '#f80'; ctx.font = 'bold 24px monospace'; ctx.fillText('NOISE AGENT', 20, 100);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('- 爆音スニーキング -', 45, 120);
            if (this.tmr % 60 < 30) { ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 45, 200); }
            return;
        }

        // 敵の描画と視界コーン
        for (let e of this.enemies) {
            // 視界（赤い扇形）
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.arc(e.x, e.y, 60, e.dir - 0.6, e.dir + 0.6);
            ctx.fill();

            // 敵本体
            ctx.fillStyle = '#0a0';
            ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, Math.PI*2); ctx.fill();
            // 目線
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir)*10, e.y + Math.sin(e.dir)*10); ctx.stroke();
        }

        // プレイヤーの描画
        if (this.p.box) {
            // ★ 虹色にウェーブして光るダンボール！
            let waveY = Math.sin(this.tmr * 0.2) * 2;
            ctx.fillStyle = `hsl(${(this.tmr * 5) % 360}, 100%, 50%)`;
            ctx.fillRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.strokeRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            // 目の穴
            ctx.fillStyle = '#000'; ctx.fillRect(this.p.x - 4, this.p.y - 2 + waveY, 8, 2);
        } else {
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        // ウザい文字の描画
        for (let t of this.texts) {
            ctx.save();
            // centerフラグがある場合は画面の中央（文字ズレ修正！）
            if (t.center) {
                ctx.translate(100, 150);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
            } else {
                ctx.translate(t.x, t.y);
                ctx.textAlign = 'left';
            }
            
            ctx.rotate(t.rot);
            ctx.fillStyle = t.col;
            ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
            
            ctx.globalAlpha = t.life / t.maxLife; 
            ctx.strokeText(t.text, 0, 0);
            ctx.fillText(t.text, 0, 0);
            ctx.globalAlpha = 1.0;
            
            ctx.restore();
        }

        // 画面下部のUI（通信兵エコーのメッセージ）
        ctx.fillStyle = '#000'; ctx.fillRect(0, 260, 200, 40);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(2, 262, 196, 36);
        ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
        
        // 文字列の折り返し表示
        if (this.msgLife > 0) {
            let words = this.msg;
            if (words.length > 18) {
                ctx.fillText(words.substring(0, 18), 10, 275);
                ctx.fillText(words.substring(18), 10, 288);
            } else {
                ctx.fillText(words, 10, 280);
            }
        }

        // === リザルト画面 ===
        if (this.st === 'result') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            
            // ★ 文字ズレを完全に修正したセンタリング描画
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace';
            ctx.fillText('MISSION COMPLETE', 100, 50);
            
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(`KILLS : ${this.stats.kills}`, 100, 100);
            ctx.fillText(`NOISES: ${this.stats.noise}`, 100, 120);
            
            // 称号判定
            let title = "NORMAL SPY"; let tCol = '#fff';
            if (this.stats.kills === 0) { title = "GHOST (不殺)"; tCol = '#0ff'; }
            else if (this.stats.boxTime > this.stats.time / 2) { title = "BOX LOVER"; tCol = '#ff0'; }
            else if (this.stats.noise > 50) { title = "NOISY NINJA"; tCol = '#f0f'; }
            
            ctx.fillStyle = '#f80'; ctx.fillText('YOUR RANK:', 100, 160);
            ctx.fillStyle = tCol; ctx.font = 'bold 16px monospace';
            ctx.fillText(title, 100, 185);
            
            if (this.tmr > 60) {
                ctx.fillStyle = '#ccc'; ctx.font = '10px monospace';
                ctx.fillText('PRESS [A] TO RETURN', 100, 250);
            }
            
            // ★ 他の描画に影響しないように左揃えに戻す
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
        }
    }
};
