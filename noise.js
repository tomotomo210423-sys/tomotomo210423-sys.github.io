// === NOISE AGENT (Phase 4: Scroll Map, Puzzles & Database) ===

const PAL = { '0':null, '1':'#000', '2':'#fff', '3':'#fca', '4':'#f00', '5':'#0ff', '6':'#0a0', '7':'#ff0', '8':'#444', '9':'#888', 'a':'#00f', 'b':'#f0f', 'c':'#fa0', 'd':'#ccc' };
const CHAR_SPRITES = {
    'エコー': [
        "0000000000000000","0000111111110000","0001777777771000","0017777777777100",
        "0017733333377100","0181333333331810","0181311111131810","0181315555131810",
        "0011333333331100","0001333333331000","0000111111110000","0001666666661000",
        "0016661111666100","0016661111666100","0011110000111100","0000000000000000"
    ],
    'クロエ': [ // ピンク髪のメカニック
        "0000000000000000","0000bbbbbbbb0000","000bbbbbbbbbb000","00bb33333333bb00",
        "00bb31333313bb00","00bb33333333bb00","000bb333333bb000","0002822222282000",
        "0002222222222000","0002222222222000","0000222222220000","0000111111110000",
        "0000888888880000","0000888888880000","0001111001111000","0000000000000000"
    ],
    'ジャック': [ // 筋肉バンダナ
        "0000000000000000","0000444444440000","0004444444444000","0033333333333300",
        "0033313333133300","0033333333333300","0003333333333000","0000111111110000",
        "0001666666661000","0016666666666100","0016666666666100","0000111111110000",
        "0000888888880000","0000888888880000","0001111001111000","0000000000000000"
    ],
    '司令官ノイズ': [
        "0000111111110000","0001444444441000","0011444444441100","0111111111111110",
        "0003333333333000","0003113333113000","0003333333333000","0003333333333000",
        "0003331111333000","0000333333330000","0000888888880000","0008888888888000",
        "0088878888788800","0088878888788800","0088888888888800","0000000000000000"
    ],
    'ミュート': [
        "0000000000000000","0000111111110000","0001111111111000","0011111111111100",
        "0011111111111100","0011155115511100","0011155115511100","0011111111111100",
        "0001111111111000","0001111111111000","0000111111110000","0000888888880000",
        "0008888888888000","0088888888888800","0088888888888800","0000000000000000"
    ]
};

// 映画風ストーリー
const SCENARIOS = [
    [
        { c: 'エコー', t: 'ミュート、お前に良いニュースと悪いニュースがある。' },
        { c: 'エコー', t: '良いニュースは、敵基地への潜入に成功したことだ！' },
        { c: 'エコー', t: '悪いニュースは…お前のブーツのハッキングが直ってない事だ！ｗ' },
        { c: 'クロエ', t: 'ごめんなさいミュート！歩くたびに爆音と文字が出るわ！' },
        { c: 'クロエ', t: '代わりに私の特製「虹色ダンボール(Bボタン)」を使って！' },
        { c: 'クロエ', t: 'ただしバッテリー制だから、ゲージ切れには気をつけてね！' }
    ],
    [
        { c: 'ジャック', t: 'こちらジャック。東ルートで敵と交戦中だ！派手にいくぜ！' },
        { c: 'ジャック', t: '俺、この任務が終わったら…腹いっぱいピザを食うんだ…！' },
        { c: 'エコー', t: 'おいバカ！見事な死亡フラグを建てるな！' },
        { c: 'エコー', t: 'ミュート、このフロアは【黄色い鍵】を探さないと扉が開かないぞ！' }
    ],
    [
        { c: '司令官ノイズ', t: 'ええい！なぜあんなパリピみたいに光るダンボールを捕まえられん！' },
        { c: '司令官ノイズ', t: 'アサシン部隊「サイレント」を放て！静寂の恐怖を教えてやれ！' },
        { c: 'エコー', t: 'やべぇぞ！黒い服の敵は視界が広くて速いプロだ！' },
        { c: 'クロエ', t: '文字で前が見えない時は、立ち止まって文字が消えるのを待ってね！' }
    ],
    [
        { c: 'ジャック', t: 'ハァ…ハァ…なんとか生き延びたぜ。ピザの出前はまだか？' },
        { c: 'エコー', t: 'ミュート！次が機密データのある最深部だ！' },
        { c: 'エコー', t: '重装甲のバズが巡回してる！絶対に見つかるなよ！！' }
    ],
    [
        { c: 'エコー', t: 'ミッション・コンプリート！！機密データを奪取したぞ！' },
        { c: '司令官ノイズ', t: 'バカな...あんなうるさいフザケた奴に...私の基地が...！ぐはぁっ！' },
        { c: 'ミュート', t: '……（サムズアップ）' },
        { c: 'エコー', t: 'さぁ帰ろうぜ！ジャックも無事だ！俺のおごりでピザパだ！' }
    ]
];

const DB_DATA = [
    { title: '【キャラクター図鑑】', items: [
        { n: 'ミュート', t: '主人公。呪いの靴のせいで歩くたびに爆音と擬音語のホログラムが出てしまう。不憫。' },
        { n: 'エコー', t: '相棒のハッカー。ミュートの悲惨な状況を完全に面白がっており、ひたすら煽ってくる。' },
        { n: 'クロエ', t: '兵器開発担当。無駄に虹色に光るダンボールを開発した張本人。' },
        { n: 'ジャック', t: '別ルートを潜入中の脳筋エージェント。すぐ死亡フラグを建てるが、なぜか死なない。' }
    ]},
    { title: '【敵対組織サイレンス】', items: [
        { n: '司令官ノイズ', t: '世界から娯楽と音を奪おうとする悪のボス。実は名前がノイズ。' },
        { n: 'アサシン・サイレント', t: '青い視界を持つ暗殺者。非常に素早く、執拗にプレイヤーを追う。' },
        { n: '重装甲兵バズ', t: '超巨大な視界を持つ最終兵器。見つかったら最後。' }
    ]}
];

// ★ 広大なレベルデータ設計
const LEVELS = [
    { // Level 1: チュートリアル (400x400)
        w: 400, h: 400,
        start: {x: 50, y: 350}, goal: {x: 350, y: 50},
        walls: [ {x:0, y:200, w:250, h:40}, {x:150, y:80, w:40, h:120}, {x:-10, y:-10, w:420, h:10}, {x:-10, y:400, w:420, h:10}, {x:-10, y:0, w:10, h:400}, {x:400, y:0, w:10, h:400} ],
        doors: [ {x:250, y:200, w:60, h:40, type:'switch', reqId:1, open:false} ],
        switches: [ {x:50, y:100, r:15, id:1, active:false} ],
        keys: [],
        enemies: [ {x:200, y:300, path:[{x:100,y:300},{x:300,y:300}], pt:0, spd:1.0, type:'normal', wait:0} ]
    },
    { // Level 2: 鍵パズル (600x400)
        w: 600, h: 400,
        start: {x: 50, y: 350}, goal: {x: 550, y: 50},
        walls: [ {x:200, y:0, w:40, h:300}, {x:400, y:100, w:40, h:300} ],
        doors: [ {x:200, y:300, w:40, h:60, type:'key', reqId:1, open:false}, {x:400, y:40, w:40, h:60, type:'switch', reqId:2, open:false} ],
        switches: [ {x:300, y:350, r:15, id:2, active:false} ],
        keys: [ {x:100, y:50, r:10, id:1, taken:false} ],
        enemies: [
            {x:100, y:200, path:[{x:50,y:200},{x:150,y:200}], pt:0, spd:1.2, type:'normal', wait:0},
            {x:300, y:100, path:[{x:300,y:50},{x:300,y:250}], pt:0, spd:1.5, type:'normal', wait:0},
            {x:500, y:200, path:[{x:450,y:200},{x:550,y:200}], pt:0, spd:1.2, type:'normal', wait:0}
        ]
    },
    { // Level 3: アサシン登場 (600x600)
        w: 600, h: 600,
        start: {x: 50, y: 550}, goal: {x: 550, y: 50},
        walls: [ {x:0, y:200, w:400, h:40}, {x:200, y:400, w:400, h:40}, {x:200, y:0, w:40, h:100} ],
        doors: [ {x:400, y:200, w:80, h:40, type:'key', reqId:1, open:false} ],
        switches: [],
        keys: [ {x:50, y:50, r:10, id:1, taken:false} ],
        enemies: [
            {x:200, y:300, path:[{x:50,y:300},{x:350,y:300}], pt:0, spd:2.0, type:'silent', wait:0}, // サイレント！
            {x:400, y:500, path:[{x:250,y:500},{x:550,y:500}], pt:0, spd:1.5, type:'normal', wait:0},
            {x:300, y:100, path:[{x:300,y:50},{x:300,y:150}], pt:0, spd:1.5, type:'normal', wait:0}
        ]
    },
    { // Level 4: 最終防衛線 バズ登場 (800x400)
        w: 800, h: 400,
        start: {x: 50, y: 200}, goal: {x: 750, y: 200},
        walls: [ {x:300, y:100, w:40, h:200}, {x:500, y:100, w:40, h:200} ],
        doors: [ {x:300, y:50, w:40, h:50, type:'switch', reqId:1, open:false}, {x:500, y:300, w:40, h:50, type:'switch', reqId:2, open:false} ],
        switches: [ {x:150, y:50, r:15, id:1, active:false}, {x:400, y:350, r:15, id:2, active:false} ],
        keys: [],
        enemies: [
            {x:200, y:300, path:[{x:100,y:300},{x:250,y:300}], pt:0, spd:1.5, type:'silent', wait:0},
            {x:400, y:200, path:[{x:350,y:200},{x:450,y:200}], pt:0, spd:2.5, type:'silent', wait:0},
            {x:650, y:200, path:[{x:600,y:100},{x:600,y:300},{x:750,y:300},{x:750,y:100}], pt:0, spd:1.0, type:'buzz', wait:0} // バズ！
        ]
    }
];

const Noise = {
    st: 'title', tmr: 0, level: 0,
    scIdx: 0, msgIdx: 0, strToShow: '',
    dbCur: 0, dbMode: 0, // DATABASE用
    
    lvl: null, // 現在のレベルデータ参照
    p: { x: 0, y: 0, r: 6, spd: 3, box: false, energy: 100 },
    cam: { x: 0, y: 0 },
    texts: [], 
    stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    
    radioQ: [], msg: '', msgChar: '', msgLife: 0,

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.level = 0; this.dbCur = 0; this.dbMode = 0;
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    pushRadio(c, t) { this.radioQ.push({c, t}); },

    startStory(sIdx) {
        this.st = 'story'; this.scIdx = sIdx; this.msgIdx = 0; this.tmr = 0;
        this.strToShow = '';
        if (typeof playSnd !== 'undefined') playSnd('sel');
    },

    loadLevel() {
        this.st = 'play';
        this.lvl = JSON.parse(JSON.stringify(LEVELS[this.level])); // ディープコピー
        this.p.x = this.lvl.start.x; this.p.y = this.lvl.start.y;
        this.p.box = false; this.p.energy = 100;
        this.texts = []; this.radioQ = []; this.msgLife = 0;
        this.tmr = 0;

        if (this.level === 0) {
            this.pushRadio('エコー', '十字キーで移動、Aで暗殺、Bで箱だ。');
            this.pushRadio('クロエ', '青いスイッチを踏むと青い扉が開くわ！');
        } else if (this.level === 1) {
            this.pushRadio('エコー', '黄色い鍵を拾わないと扉が開かないぞ！');
        } else if (this.level === 2) {
            this.pushRadio('ジャック', '黒い服の奴には気をつけろ！視界が広いぞ！');
        } else if (this.level === 3) {
            this.pushRadio('エコー', 'デカい重装甲がいる！見つかったら終わりだ！');
        }

        if (typeof BGM !== 'undefined') BGM.stop();
    },

    lineHitRect(x1, y1, x2, y2, rect) {
        let steps = 15;
        for(let i = 0; i <= steps; i++) {
            let px = x1 + (x2 - x1) * (i / steps);
            let py = y1 + (y2 - y1) * (i / steps);
            if (px > rect.x && px < rect.x + rect.w && py > rect.y && py < rect.y + rect.h) return true;
        }
        return false;
    },
    
    update() {
        if (keysDown.select && this.st !== 'title') { switchApp(Menu); return; }
        this.tmr++;

        // ================= TITLE =================
        if (this.st === 'title') {
            if (keysDown.up || keysDown.down) { this.dbCur = this.dbCur === 0 ? 1 : 0; if(typeof playSnd !== 'undefined') playSnd('sel'); }
            if (keysDown.a) {
                if(typeof playSnd !== 'undefined') playSnd('jmp');
                if (this.dbCur === 0) {
                    this.stats = { kills: 0, noise: 0, boxTime: 0, time: 0 };
                    this.level = 0; this.startStory(0); 
                } else {
                    this.st = 'database'; this.dbCur = 0; this.dbMode = 0;
                }
            }
            return;
        }

        // ================= DATABASE =================
        if (this.st === 'database') {
            if (keysDown.b) { 
                if (this.dbMode === 1) { this.dbMode = 0; if(typeof playSnd !== 'undefined') playSnd('hit'); }
                else { this.st = 'title'; this.dbCur = 1; if(typeof playSnd !== 'undefined') playSnd('hit'); }
                return;
            }
            if (this.dbMode === 0) {
                if (keysDown.up) { this.dbCur = (this.dbCur - 1 + DB_DATA.length) % DB_DATA.length; if(typeof playSnd !== 'undefined') playSnd('sel'); }
                if (keysDown.down) { this.dbCur = (this.dbCur + 1) % DB_DATA.length; if(typeof playSnd !== 'undefined') playSnd('sel'); }
                if (keysDown.a) { this.dbMode = 1; this.tmr = 0; if(typeof playSnd !== 'undefined') playSnd('jmp'); }
            } else {
                if (keysDown.down && this.tmr < DB_DATA[this.dbCur].items.length * 20) this.tmr += 10;
                if (keysDown.up && this.tmr > 0) this.tmr -= 10;
            }
            return;
        }

        // ================= STORY =================
        if (this.st === 'story') {
            let m = SCENARIOS[this.scIdx][this.msgIdx];
            if (this.tmr % 2 === 0 && this.strToShow.length < m.t.length) {
                this.strToShow += m.t[this.strToShow.length];
                if (this.strToShow.length % 3 === 0 && typeof playSnd !== 'undefined') playSnd('sel');
            }
            if (keysDown.a) {
                if (this.strToShow.length < m.t.length) { this.strToShow = m.t; } 
                else {
                    this.msgIdx++;
                    if (this.msgIdx < SCENARIOS[this.scIdx].length) { this.strToShow = ''; this.tmr = 0; } 
                    else {
                        if (this.scIdx === 4) { this.st = 'result'; this.tmr = 0; } // END
                        else { this.loadLevel(); }
                    }
                }
            }
            return;
        }

        // ================= GAMEOVER & RESULT =================
        if (this.st === 'gameover' || this.st === 'result') {
            if (this.tmr > 60 && (keysDown.a || keysDown.b)) { this.st = 'title'; this.tmr = 0; }
            return;
        }

        // ================= PLAY =================
        this.stats.time++;
        
        // --- 字幕通信システム ---
        if (this.msgLife > 0) {
            this.msgLife--;
        } else if (this.radioQ.length > 0) {
            let rm = this.radioQ.shift();
            this.msgChar = rm.c; this.msg = rm.t; this.msgLife = 150;
            if(typeof playSnd !== 'undefined') playSnd('sel');
        }

        // --- ダンボール バッテリー管理 ---
        if (keys.b && this.p.energy > 0) {
            this.p.box = true;
            this.p.energy -= 0.5; // 消費
            this.stats.boxTime++;
            if (this.p.energy <= 0) { this.pushRadio('クロエ', 'バッテリー切れよ！オーバーヒート！'); if(typeof playSnd !== 'undefined') playSnd('hit'); }
        } else {
            this.p.box = false;
            this.p.energy = Math.min(100, this.p.energy + 0.15); // ゆっくり回復
        }

        // --- プレイヤー移動 ---
        let moved = false; let vx = 0, vy = 0;
        let currentSpd = this.p.box ? this.p.spd * 0.4 : this.p.spd;
        if (keys.left)  { vx -= currentSpd; moved = true; }
        if (keys.right) { vx += currentSpd; moved = true; }
        if (keys.up)    { vy -= currentSpd; moved = true; }
        if (keys.down)  { vy += currentSpd; moved = true; }
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        
        let nx = this.p.x + vx; let ny = this.p.y + vy;
        let hitWall = false;
        
        let activeWalls = [...this.lvl.walls, ...this.lvl.doors.filter(d => !d.open)];
        for (let w of activeWalls) {
            if (nx + this.p.r > w.x && nx - this.p.r < w.x + w.w && ny + this.p.r > w.y && ny - this.p.r < w.y + w.h) { hitWall = true; break; }
        }
        if (!hitWall) { this.p.x = nx; this.p.y = ny; }
        this.p.x = Math.max(10, Math.min(this.lvl.w - 10, this.p.x));
        this.p.y = Math.max(10, Math.min(this.lvl.h - 10, this.p.y));

        // --- カメラ追従 ---
        this.cam.x = this.p.x - 100; this.cam.y = this.p.y - 150;
        this.cam.x = Math.max(0, Math.min(this.lvl.w - 200, this.cam.x));
        this.cam.y = Math.max(0, Math.min(this.lvl.h - 300, this.cam.y));

        // --- パズル：スイッチ＆鍵 ---
        for (let s of this.lvl.switches) {
            if (!s.active && Math.hypot(this.p.x - s.x, this.p.y - s.y) < s.r + this.p.r) {
                s.active = true;
                if(typeof playSnd !== 'undefined') playSnd('jmp');
                this.texts.push({ x: s.x, y: s.y, text: 'CLICK!', col: '#0ff', life: 40, maxLife: 40, size: 20 });
                for (let d of this.lvl.doors) { if (d.type === 'switch' && d.reqId === s.id) d.open = true; }
            }
        }
        for (let k of this.lvl.keys) {
            if (!k.taken && Math.hypot(this.p.x - k.x, this.p.y - k.y) < k.r + this.p.r) {
                k.taken = true;
                if(typeof playSnd !== 'undefined') playSnd('combo');
                this.pushRadio('エコー', '鍵をゲットしたぜ！');
                this.texts.push({ x: k.x, y: k.y, text: 'GET KEY!', col: '#ff0', life: 40, maxLife: 40, size: 20 });
                for (let d of this.lvl.doors) { if (d.type === 'key' && d.reqId === k.id) d.open = true; }
            }
        }

        // --- ステルスキル ---
        if (keysDown.a && !this.p.box) {
            for (let i = this.lvl.enemies.length - 1; i >= 0; i--) {
                let e = this.lvl.enemies[i];
                if (Math.hypot(e.x - this.p.x, e.y - this.p.y) < (e.type==='buzz'? 35 : 25)) {
                    this.lvl.enemies.splice(i, 1);
                    this.stats.kills++;
                    this.texts.push({ x: this.cam.x+100, y: this.cam.y+150, text: 'NICE KILL!!!', col: '#0f0', life: 90, maxLife: 90, size: 30, center: true });
                    if (e.type === 'buzz') this.pushRadio('ジャック', 'うおぉ！あのデカブツを倒すとはな！');
                    else this.pushRadio('エコー', 'ひゅーっ！ナイスキル！');
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
            if (this.stats.noise % 30 === 0) this.pushRadio('エコー', '文字で前が見えないだろ？ｗ');
        }
        
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i]; t.life--;
            if (!t.center) t.y -= 0.3; 
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        // --- ゴール判定 ---
        if (Math.hypot(this.p.x - this.lvl.goal.x, this.p.y - this.lvl.goal.y) < this.lvl.goal.r) {
            this.level++;
            if(typeof playSnd !== 'undefined') playSnd('combo');
            this.startStory(this.level);
            return;
        }

        // --- 敵兵AIと視界 ---
        for (let e of this.lvl.enemies) {
            let target = e.path[e.pt];
            let dx = target.x - e.x, dy = target.y - e.y;
            let dist = Math.hypot(dx, dy);
            
            if (dist < 2) {
                if (e.wait > 0) e.wait--;
                else { e.pt = (e.pt + 1) % e.path.length; e.wait = 30; } 
            } else {
                e.dir = Math.atan2(dy, dx);
                e.x += Math.cos(e.dir) * e.spd;
                e.y += Math.sin(e.dir) * e.spd;
            }

            if (!this.p.box) {
                let pdx = this.p.x - e.x, pdy = this.p.y - e.y;
                let vRange = e.type === 'buzz' ? 120 : (e.type === 'silent' ? 100 : 60);
                if (Math.hypot(pdx, pdy) < vRange) {
                    let angleDiff = Math.abs(Math.atan2(pdy, pdx) - e.dir);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    
                    if (angleDiff < 0.6) { 
                        let hidden = false;
                        for (let w of activeWalls) { if (this.lineHitRect(e.x, e.y, this.p.x, this.p.y, w)) { hidden = true; break; } }
                        
                        if (!hidden) {
                            this.st = 'gameover'; this.tmr = 0;
                            this.pushRadio('エコー', 'あーあ、見つかっちゃった。俺のせいじゃないからなｗ');
                            if(typeof playSnd !== 'undefined') playSnd('hit');
                            if(typeof screenShake !== 'undefined') screenShake(15);
                            this.texts.push({ x: this.cam.x+100, y: this.cam.y+150, text: 'SPOTTED!!', col: '#f00', life: 120, maxLife: 120, size: 40, center: true });
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

            ctx.fillStyle = '#f80'; ctx.font = 'bold 28px "Arial Black", sans-serif';
            ctx.shadowBlur = 15; ctx.shadowColor = '#f00';
            ctx.fillText('NOISE', 45, 90); ctx.fillText('AGENT', 45, 125);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('- 爆音スニーキング -', 45, 150);

            ctx.fillStyle = this.dbCur === 0 ? '#0f0' : '#888';
            ctx.fillText((this.dbCur === 0 ? '▶ ' : '  ') + 'START MISSION', 45, 220);
            ctx.fillStyle = this.dbCur === 1 ? '#0ff' : '#888';
            ctx.fillText((this.dbCur === 1 ? '▶ ' : '  ') + 'DATABASE', 45, 240);
            return;
        }

        // ================= DATABASE =================
        if (this.st === 'database') {
            ctx.fillStyle = '#002'; ctx.fillRect(0,0,200,300);
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【 DATABASE 】', 40, 25);
            
            if (this.dbMode === 0) {
                for(let i=0; i<DB_DATA.length; i++) {
                    ctx.fillStyle = this.dbCur === i ? '#ff0' : '#aaa';
                    ctx.font = '12px monospace';
                    ctx.fillText((this.dbCur===i?'▶ ':'  ')+DB_DATA[i].title, 10, 60 + i*30);
                }
                ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 開く  B: 戻る', 50, 280);
            } else {
                let data = DB_DATA[this.dbCur].items;
                ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText(DB_DATA[this.dbCur].title, 10, 50);
                
                let y = 70 - this.tmr; // スクロール
                for (let item of data) {
                    if (y > 300) break;
                    if (y > 40) {
                        ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace'; ctx.fillText('■ ' + item.n, 10, y);
                        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
                        
                        let words = item.t; let lineY = y + 15;
                        while(words.length > 0) {
                            ctx.fillText(words.substring(0, 16), 15, lineY);
                            words = words.substring(16); lineY += 12;
                        }
                        y = lineY + 15;
                    } else {
                        y += 15 + Math.ceil(item.t.length/16)*12 + 15;
                    }
                }
                ctx.fillStyle = '#000'; ctx.fillRect(0, 260, 200, 40);
                ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('上下: スクロール  B: 戻る', 30, 280);
            }
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
        ctx.save();
        ctx.translate(-this.cam.x, -this.cam.y); // ★ カメラ適用

        // 広大な床テクスチャ
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        let sx = this.cam.x % 20; let sy = this.cam.y % 20;
        for(let i = this.cam.x - sx; i < this.cam.x + 200; i += 20) { ctx.beginPath(); ctx.moveTo(i, this.cam.y); ctx.lineTo(i, this.cam.y+300); ctx.stroke(); }
        for(let i = this.cam.y - sy; i < this.cam.y + 300; i += 20) { ctx.beginPath(); ctx.moveTo(this.cam.x, i); ctx.lineTo(this.cam.x+200, i); ctx.stroke(); }

        // 壁と扉
        for (let w of this.lvl.walls) {
            ctx.fillStyle = '#111'; ctx.fillRect(w.x+5, w.y+5, w.w, w.h); // 影
            ctx.fillStyle = '#555'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeStyle = '#000'; ctx.strokeRect(w.x, w.y, w.w, w.h);
        }
        for (let d of this.lvl.doors) {
            if (!d.open) {
                ctx.fillStyle = d.type === 'key' ? '#550' : '#05a'; 
                ctx.fillRect(d.x, d.y, d.w, d.h);
                ctx.strokeStyle = d.type === 'key' ? '#ff0' : '#0ff'; 
                ctx.strokeRect(d.x, d.y, d.w, d.h);
            }
        }

        // スイッチと鍵
        for (let s of this.lvl.switches) {
            ctx.fillStyle = s.active ? '#0a0' : '#00f';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = s.active ? '#0f0' : '#0ff'; ctx.stroke();
        }
        for (let k of this.lvl.keys) {
            if (!k.taken) {
                ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(k.x, k.y, k.r, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#000'; ctx.fillRect(k.x-2, k.y-4, 4, 8);
            }
        }

        // ゴール
        ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})`;
        ctx.beginPath(); ctx.arc(this.lvl.goal.x, this.lvl.goal.y, this.lvl.goal.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('GOAL', this.lvl.goal.x-12, this.lvl.goal.y+3);

        // 敵
        for (let e of this.lvl.enemies) {
            let vCol = e.type === 'silent' ? 'rgba(0, 0, 255, 0.3)' : (e.type === 'buzz' ? 'rgba(255, 100, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)');
            let vRange = e.type === 'buzz' ? 120 : (e.type === 'silent' ? 100 : 60);
            let eSize = e.type === 'buzz' ? 12 : 6;
            
            ctx.fillStyle = vCol;
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, vRange, e.dir - 0.6, e.dir + 0.6); ctx.fill();
            
            ctx.fillStyle = e.type === 'silent' ? '#111' : (e.type === 'buzz' ? '#888' : '#0a0');
            ctx.beginPath(); ctx.arc(e.x, e.y, eSize, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = e.type === 'silent' ? '#f00' : '#fff'; ctx.lineWidth = 2;
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

        // 文字（カメラ適用内）
        for (let t of this.texts) {
            ctx.save();
            if (t.center) { ctx.translate(t.x, t.y); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; } 
            else { ctx.translate(t.x, t.y); ctx.textAlign = 'left'; }
            ctx.rotate(t.rot);
            ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
            ctx.globalAlpha = t.life / t.maxLife; 
            ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0);
            ctx.globalAlpha = 1.0; ctx.restore();
        }

        ctx.restore(); // ★ カメラ適用解除 (UIレイヤーへ)

        // --- バッテリー UI ---
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(5, 235, 100, 15);
        ctx.fillStyle = this.p.energy < 30 ? '#f00' : '#0f0';
        ctx.fillRect(5, 235, this.p.energy, 15);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('BOX BATTERY', 10, 246);

        // --- 字幕 UI ---
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 255, 200, 45);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(2, 257, 196, 41);
        
        if (this.msgLife > 0 && this.msg !== '') {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace';
            ctx.fillText(`【${this.msgChar}】`, 5, 270);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            if (this.msg.length > 18) {
                ctx.fillText(this.msg.substring(0, 18), 10, 282);
                ctx.fillText(this.msg.substring(18), 10, 293);
            } else {
                ctx.fillText(this.msg, 10, 282);
            }
        } else {
            ctx.fillStyle = '#444'; ctx.font = '9px monospace'; ctx.fillText('NO SIGNAL...', 10, 275);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,200,15);
        ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
        ctx.fillText(`LV:${this.level + 1}  KILLS:${this.stats.kills}`, 5, 11);

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
