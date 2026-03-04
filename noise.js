// === NOISE AGENT (Phase 5: Scroll Map, Puzzle & New Characters) ===

const VoiceSys = {
    voices: [], unlocked: false,
    init() {
        let loadV = () => { this.voices = speechSynthesis.getVoices().filter(v => v.lang.includes('ja')); };
        loadV();
        if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = loadV;
        const unlock = () => {
            if(!this.unlocked) { let u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u); this.unlocked = true; }
            window.removeEventListener('touchstart', unlock); window.removeEventListener('mousedown', unlock);
        };
        window.addEventListener('touchstart', unlock, {passive: true}); window.addEventListener('mousedown', unlock, {passive: true});
    },
    speak(char, txt) {
        if (Noise.st === 'play' || Noise.st === 'gameover') {
            Noise.msg = char === 'ミュート' ? '……' : `${char}「${txt}」`;
            Noise.msgLife = 180; 
        }
        speechSynthesis.cancel();
        if (char === 'ミュート' || char === 'SYSTEM') return; 
        try {
            let u = new SpeechSynthesisUtterance(txt);
            if (this.voices.length > 0) u.voice = this.voices.find(v => v.name.includes('Google') || v.name.includes('Male') || v.name.includes('Taro')) || this.voices[0];
            // キャラクターごとの声質設定
            if (char === 'エコー') { u.pitch = 1.3; u.rate = 1.3; } 
            else if (char === '司令官ノイズ') { u.pitch = 0.5; u.rate = 0.9; } 
            else if (char === 'ルナ') { u.pitch = 1.6; u.rate = 1.2; u.voice = this.voices.find(v => v.name.includes('Female') || v.name.includes('Hanako')) || u.voice; }
            else if (char === 'おやっさん') { u.pitch = 0.4; u.rate = 0.8; }
            else if (char === '副官ソナー') { u.pitch = 1.1; u.rate = 0.9; u.voice = this.voices.find(v => v.name.includes('Female') || v.name.includes('Hanako')) || u.voice; }
            else { u.pitch = 1.0; u.rate = 1.0; }
            u.volume = 1.0; speechSynthesis.speak(u);
        } catch(e) {} 
    },
    stop() { speechSynthesis.cancel(); }
};

const PAL = { '0':null, '1':'#000', '2':'#fff', '3':'#fca', '4':'#f00', '5':'#0ff', '6':'#0a0', '7':'#fa0', '8':'#444', '9':'#888', 'a':'#05f', 'b':'#940', 'c':'#a0a' };

// 24x24 キャラクタードット絵
const CHAR_SPRITES = {
    'エコー': [ 
        "000000000000000000000000","000000000111111000000000","000000011777777110000000","000000177777777771000000","000001777777777777100000",
        "000011777733333377110000","000181777333333337181000","000181111111111111181000","000181111555555111181000","000181111555555111181000",
        "000181773333333377181000","000011773333333377110000","000001773333333377100000","000000113333333311000000","000000001133331100000000",
        "000000016611116610000000","000000166666666661000000","000001666666666666100000","000001666111111666100000","000016661333333166610000",
        "000016661333333166610000","000016661111111166610000","000011110000000011110000","000000000000000000000000"
    ],
    '司令官ノイズ': [ 
        "000000000000000000000000","000000000111111000000000","000000011444444110000000","000000144444444441000000","000001444444444444100000",
        "000011111111111111110000","000000133333333331000000","000000133333333331000000","000000131133331131000000","000000131133331131000000",
        "000000133333333331000000","000000133311113331000000","000000013333333310000000","000000001111111100000000","000000018888888810000000",
        "000000188888888881000000","000001888888888888100000","000001888788887888100000","000018888788887888810000","000018888788887888810000",
        "000018888888888888810000","000018888888888888810000","000011111111111111110000","000000000000000000000000"
    ],
    'ルナ': [ 
        "000000000000000000000000","000000001111111000000000","000000017777777100000000","001100177777777710011000","017711771111111771177100",
        "017771715555555171777100","017771715555555171777100","001771733333333371771000","000110131133311310110000","000000133333333310000000",
        "000000133311133310000000","000000013333333100000000","000000001111111000000000","00000001aa111aa100000000","0000001aaa222aaa10000000",
        "000001aaaa222aaaa1000000","000001aaaa222aaaa1000000","00001aaaaa222aaaaa100000","00001aaaaa111aaaaa100000","00001aaaaa131aaaaa100000",
        "00001aaaaa131aaaaa100000","00001aaaaa111aaaaa100000","000011111100011111000000","000000000000000000000000"
    ],
    'おやっさん': [ 
        "000000000000000000000000","000000000111110000000000","000000001999991000000000","000000019999999100000000","000000199999999910000000",
        "000000193333333910000000","000000131133311310000000","000000131133311310000000","000000133333333310000000","000000133311133311110000",
        "000000199333339912410000","000000019933399111100000","000000001111111000000000","00000001bb111bb100000000","0000001bbbbbbbbb10000000",
        "000001bbbbbbbbbbb1000000","000001bbbb888bbbb1000000","00001bbbbb888bbbbb100000","00001bbbbb888bbbbb100000","00001bbbbb888bbbbb100000",
        "00001bbbbb111bbbbb100000","00001bbbb10001bbbb100000","000011111000001111000000","000000000000000000000000"
    ],
    '副官ソナー': [ 
        "000000000000000000000000","000000000111110000000000","000000001cccccc100000000","00000001ccccccc100000000","00000001ccccccc101100000",
        "00000011111111111cc10000","00000014444444411cc10000","000000144444444101100000","000000133333333100000000","000000133111133100000000",
        "000000133333333100000000","000000013333331000000000","000000001111110000000000","000000011111111000000000","000000111111111100000000",
        "000001111111111110000000","000001111111111110000000","000011111111111111000000","000011111111111111000000","000011111111111111000000",
        "000011111111111111000000","000011111100111111000000","000011111000011111000000","000000000000000000000000"
    ],
    'ミュート': [ 
        "000000000000000000000000","000000000111111000000000","000000011111111110000000","000000111111111111000000","000001111111111111100000",
        "000001111111111111100000","000001111441144111100000","000001111441144111100000","000001111111111111100000","000001111111111111100000",
        "000000111111111111000000","000000011111111110000000","000000001111111100000000","000000018888888810000000","000000188888888881000000",
        "000001888888888888100000","000001888888888888100000","000018888888888888810000","000018888888888888810000","000018888888888888810000",
        "000018888888888888810000","000018888888888888810000","000011111111111111110000","000000000000000000000000"
    ]
};

const SCENARIOS = [
    [ // Level 1
        { c: 'SYSTEM', t: '西暦20XX年。世界から「音」を奪おうとする悪の組織『サイレンス』。彼らの野望を阻止すべく、1人のエージェントが極秘基地に潜入した。' },
        { c: 'エコー', t: '聞こえるかミュート？潜入作戦開始だ。だが最悪なニュースがある。' },
        { c: 'エコー', t: 'お前のブーツがハッキングされた！歩くたびに爆音と【巨大な文字】が出る呪いの靴になっちまったんだ！ｗ' },
        { c: 'ミュート', t: '……。' },
        { c: 'ルナ', t: 'あっ、ミュートさん！私ルナです！ごめんなさい、靴のプログラム直せなくって…！' },
        { c: 'エコー', t: 'ルナも見てるぞ。文字が邪魔で前が見えないだろうが、Aで暗殺、Bでダンボールだ！' },
        { c: 'ルナ', t: '基地は広いです！【青いスイッチ】を踏むと【青い扉】が開きます。緑のゴールを目指してください！' }
    ],
    [ // Level 2
        { c: 'SYSTEM', t: '最初のエリアを突破したミュート。しかし、その足音は敵の耳に確実に届いていた。' },
        { c: '司令官ノイズ', t: '侵入者め...ネズミが迷い込んだようだな。' },
        { c: 'エコー', t: 'やべぇ！敵のボス「司令官ノイズ」に気づかれたぞ！' },
        { c: '司令官ノイズ', t: 'そのやかましい足音...貴様、スパイの風上にも置けん奴だ！警備を「レベル2」に引き上げろ！' },
        { c: 'おやっさん', t: '…坊主、油断するな。ここからは「赤いスイッチ」の仕掛けも追加される。パズルが複雑になるぞ。' },
        { c: 'エコー', t: 'おやっさん！ダンボール(B)を駆使して切り抜けろミュート！' }
    ],
    [ // Level 3
        { c: 'SYSTEM', t: 'さらに深部へ。そこには司令官の右腕が待ち受けていた。' },
        { c: '副官ソナー', t: 'フフフ…なんてうるさい侵入者。私の「可愛いペット」たちの餌にしてあげるわ。' },
        { c: 'ルナ', t: '気をつけて！【サイボーグ猟犬】が放たれました！移動速度がものすごく速いです！' },
        { c: 'おやっさん', t: '犬は視界は狭いが足が速い。文字で前が見えないお前にとっては最悪の敵だ。背後を取れ。' }
    ],
    [ // Level 4
        { c: 'SYSTEM', t: '基地の最深部、機密データルームへと続く最終通路。強固なパズルと親衛隊が待ち受ける。' },
        { c: '司令官ノイズ', t: 'ええい！なぜあんな騒がしい奴を捕まえられんのだ！！' },
        { c: '副官ソナー', t: '申し訳ありません司令官！直ちに「緑の隔壁」を封鎖し、親衛隊を総動員します！' },
        { c: 'エコー', t: '次が最終エリアだミュート！敵がウジャウジャいて、3色のスイッチが入り乱れてるぞ！' },
        { c: 'ルナ', t: '自分の足音の「文字」で前が見えなくなったら終わりです。慎重に行きましょう！' }
    ],
    [ // END
        { c: 'SYSTEM', t: '全てのパズルを解き、敵を退け、ミュートは機密データの奪取に成功した。' },
        { c: 'エコー', t: 'ミッション・コンプリート！！機密データを奪取したぞ！' },
        { c: '司令官ノイズ', t: 'バカな...あんなうるさいフザケた奴に...私の完璧な基地が...！ぐはぁっ！' },
        { c: 'おやっさん', t: 'よくやった坊主。伝説の誕生だな。やかましい伝説だがな。' },
        { c: 'ミュート', t: '……（サムズアップ）' },
        { c: 'ルナ', t: 'お疲れ様でした！早く帰ってきてくださいね！' },
        { c: 'エコー', t: 'さぁ帰ろうぜ！俺のおごりでピザパだ！最高に笑える作戦だったぜ！' }
    ]
];

const DB_ITEMS = [
    { title: 'エージェント「ミュート」', text: '寡黙で優秀なスパイ。しかし呪いの靴のせいで歩くたびに爆音と擬音語のホログラムが出てしまい、常に視界が塞がれている不憫な男。' },
    { title: 'ナビゲーター「エコー」', text: 'ミュートの相棒である天才若手ハッカー。親友が爆音を出して苦労している状況を完全に面白がっており、無駄な煽り通信を入れてくる。' },
    { title: 'メカニック「ルナ」', text: '武器やガジェットの開発を担当する少女。ミュートの靴をハッキングから守れなかったことを少し気にしている。' },
    { title: '伝説のスパイ「おやっさん」', text: 'かつて世界を救った伝説の男。今は第一線を退き、通信でアドバイスをくれる頼れる存在。' },
    { title: '司令官ノイズ', text: '世界から音と娯楽を奪おうとする組織「サイレンス」のボス。静寂を愛するがゆえに、ミュートのやかましい足音に激怒している。' },
    { title: '副官ソナー', text: '司令官の右腕である冷酷な女。サイボーグ猟犬を操り、侵入者を追い詰める。' },
    { title: '虹色ダンボール', text: '被ると敵の視界をやり過ごせる最強の装備。しかし内部はクラブ仕様になっており、パリピな虹色発光でプレイヤーの目を痛めつける。' }
];

const Noise = {
    st: 'title', tmr: 0, level: 0, menuCur: 0, dbCur: 0,
    scIdx: 0, msgIdx: 0, strToShow: '',
    
    // ★ スクロール用カメラとマップサイズ
    cam: { x: 0, y: 0 }, mapW: 200, mapH: 300,
    
    p: { x: 100, y: 280, r: 6, spd: 2.5, box: false },
    texts: [], enemies: [], walls: [], doors: [], switches: [], 
    goal: { x: 100, y: 20, r: 15 },
    stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    msg: '', msgLife: 0,
    
    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss'); canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.level = 0; this.menuCur = 0; this.msg = ''; this.msgLife = 0;
        VoiceSys.init(); if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startStory(sIdx) {
        if(sIdx >= SCENARIOS.length) { this.st = 'result'; this.tmr = 0; return; }
        this.st = 'story'; this.scIdx = sIdx; this.msgIdx = 0; this.tmr = 0; this.setupMessage();
    },

    setupMessage() {
        let m = SCENARIOS[this.scIdx][this.msgIdx];
        this.strToShow = ''; VoiceSys.speak(m.c, m.t); 
    },

    // 画面外への脱出を防ぐ壁
    addOuterWalls() {
        this.walls.push(
            {x: 0, y: 0, w: this.mapW, h: 10},  
            {x: 0, y: this.mapH - 10, w: this.mapW, h: 10}, 
            {x: 0, y: 0, w: 10, h: this.mapH},  
            {x: this.mapW - 10, y: 0, w: 10, h: this.mapH} 
        );
    },

    // ★ 全4ステージの広大なマップ構築
    loadLevel() {
        this.st = 'play'; this.p.box = false; this.texts = []; this.tmr = 0;
        this.walls = []; this.doors = []; this.switches = []; this.enemies = [];
        
        if (this.level === 0) { // L1: チュートリアル (縦長スクロール)
            this.mapW = 200; this.mapH = 500;
            this.p.x = 100; this.p.y = 460;
            this.walls.push( {x:10, y:300, w:80, h:20}, {x:130, y:300, w:60, h:20} );
            this.doors.push( {x:90, y:300, w:40, h:20, col: 'blue', open:false} );
            this.switches.push( {x: 170, y: 460, r:10, col: 'blue', active:false} );
            this.enemies.push( { x:100, y:380, path:[{x:40,y:380},{x:160,y:380}], pt: 0, spd: 1.0, dir: 0, wait: 0, type: 'soldier' } );
            this.enemies.push( { x:100, y:200, path:[{x:160,y:200},{x:40,y:200}], pt: 0, spd: 1.2, dir: 0, wait: 0, type: 'soldier' } );
            this.goal = { x: 100, y: 60, r: 15 };
        } 
        else if (this.level === 1) { // L2: 横長マップ (青・赤パズル)
            this.mapW = 400; this.mapH = 300;
            this.p.x = 40; this.p.y = 260;
            this.walls.push( {x:100, y:10, w:20, h:150}, {x:100, y:200, w:20, h:100}, {x:240, y:10, w:20, h:220} );
            this.doors.push( {x:100, y:160, w:20, h:40, col: 'blue', open:false}, {x:240, y:230, w:20, h:60, col: 'red', open:false} );
            this.switches.push( {x: 60, y: 60, r:10, col: 'blue', active:false}, {x: 200, y: 260, r:10, col: 'red', active:false} );
            this.enemies.push(
                {x:180, y:100, path:[{x:130,y:100},{x:220,y:100}], pt: 0, spd: 1.2, dir: 0, wait: 0, type: 'soldier'},
                {x:180, y:200, path:[{x:220,y:200},{x:130,y:200}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'},
                {x:320, y:150, path:[{x:280,y:150},{x:360,y:150}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 340, y: 150, r: 15 };
        }
        else if (this.level === 2) { // L3: 正方形マップ (犬登場)
            this.mapW = 400; this.mapH = 400;
            this.p.x = 40; this.p.y = 360;
            this.walls.push( {x:150, y:150, w:100, h:100}, {x:10, y:200, w:100, h:20}, {x:290, y:200, w:100, h:20} );
            this.doors.push( {x:110, y:200, w:40, h:20, col: 'blue', open:false}, {x:250, y:200, w:40, h:20, col: 'red', open:false} );
            this.switches.push( {x: 80, y: 100, r:10, col: 'blue', active:false}, {x: 320, y: 320, r:10, col: 'red', active:false} );
            // 猟犬 (足が速い)
            this.enemies.push(
                {x:200, y:360, path:[{x:20,y:360},{x:380,y:360}], pt: 0, spd: 3.0, dir: 0, wait: 0, type: 'dog'},
                {x:200, y:40, path:[{x:380,y:40},{x:20,y:40}], pt: 0, spd: 3.0, dir: 0, wait: 0, type: 'dog'},
                {x:200, y:100, path:[{x:100,y:100},{x:300,y:100}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 200, y: 200, r: 15 };
        }
        else if (this.level === 3) { // L4: 巨大要塞 (緑追加)
            this.mapW = 600; this.mapH = 400;
            this.p.x = 40; this.p.y = 360;
            this.walls.push( {x:150, y:10, w:20, h:300}, {x:300, y:100, w:20, h:290}, {x:450, y:10, w:20, h:300} );
            this.doors.push( 
                {x:150, y:310, w:20, h:80, col: 'blue', open:false},
                {x:300, y:10, w:20, h:90, col: 'red', open:false},
                {x:450, y:310, w:20, h:80, col: 'green', open:false} 
            );
            this.switches.push( 
                {x: 100, y: 100, r:10, col: 'blue', active:false}, 
                {x: 220, y: 360, r:10, col: 'red', active:false},
                {x: 380, y: 100, r:10, col: 'green', active:false} 
            );
            this.enemies.push(
                {x:220, y:200, path:[{x:180,y:200},{x:280,y:200}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'},
                {x:380, y:250, path:[{x:320,y:250},{x:430,y:250}], pt: 0, spd: 3.0, dir: 0, wait: 0, type: 'dog'},
                {x:520, y:200, path:[{x:480,y:200},{x:580,y:200}], pt: 0, spd: 1.8, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 550, y: 60, r: 15 };
        }

        this.addOuterWalls();
        if (typeof BGM !== 'undefined') BGM.stop();
        VoiceSys.speak('エコー', '作戦開始だミュート！');
    },

    lineHitRect(x1, y1, x2, y2, rect) {
        let steps = 15;
        for(let i = 0; i <= steps; i++) {
            let px = x1 + (x2 - x1) * (i / steps); let py = y1 + (y2 - y1) * (i / steps);
            if (px > rect.x && px < rect.x + rect.w && py > rect.y && py < rect.y + rect.h) return true;
        }
        return false;
    },
    
    update() {
        if (keysDown.select) { VoiceSys.stop(); switchApp(Menu); return; }
        this.tmr++;

        if (this.st === 'title') {
            if (keysDown.down) { this.menuCur = 1; playSnd('sel'); }
            if (keysDown.up) { this.menuCur = 0; playSnd('sel'); }
            if (keysDown.a) { 
                if (this.menuCur === 0) { this.stats = { kills:0, noise:0, boxTime:0, time:0 }; this.level = 0; playSnd('jmp'); this.startStory(0); } 
                else { this.st = 'database'; this.dbCur = 0; playSnd('sel'); }
            }
            return;
        }

        if (this.st === 'database') {
            if (keysDown.down) { this.dbCur = (this.dbCur + 1) % DB_ITEMS.length; playSnd('sel'); }
            if (keysDown.up) { this.dbCur = (this.dbCur - 1 + DB_ITEMS.length) % DB_ITEMS.length; playSnd('sel'); }
            if (keysDown.b) { this.st = 'title'; playSnd('hit'); }
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
                        if (this.scIdx === SCENARIOS.length - 1) { this.st = 'result'; this.tmr = 0; } 
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
        
        // ★ カメラスクロールの計算（プレイヤーを中央に）
        this.cam.x = Math.max(0, Math.min(this.mapW - 200, this.p.x - 100));
        this.cam.y = Math.max(0, Math.min(this.mapH - 300, this.p.y - 150));
        
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
        let activeWalls = [...this.walls, ...this.doors.filter(d => !d.open)];
        for (let w of activeWalls) {
            if (nx + this.p.r > w.x && nx - this.p.r < w.x + w.w && ny + this.p.r > w.y && ny - this.p.r < w.y + w.h) { hitWall = true; break; }
        }
        if (!hitWall) { this.p.x = nx; this.p.y = ny; }
        this.p.x = Math.max(0, Math.min(this.mapW, this.p.x));
        this.p.y = Math.max(0, Math.min(this.mapH, this.p.y));

        // パズルスイッチ判定
        for (let s of this.switches) {
            if (!s.active && Math.hypot(this.p.x - s.x, this.p.y - s.y) < s.r + this.p.r) {
                s.active = true; playSnd('sel');
                VoiceSys.speak('エコー', 'よし、扉が開いたぞ！');
                this.texts.push({ x: s.x, y: s.y, text: 'CLICK!', col: s.col === 'blue' ? '#0ff' : (s.col === 'red' ? '#f00' : '#0f0'), life: 40, maxLife: 40, size: 20, rot: 0 });
                for (let d of this.doors) { if (d.col === s.col) d.open = true; }
            }
        }

        // ステルスキル
        if (keysDown.a && !this.p.box) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let e = this.enemies[i];
                if (Math.hypot(e.x - this.p.x, e.y - this.p.y) < 25) {
                    this.enemies.splice(i, 1);
                    this.stats.kills++;
                    this.texts.push({ x: this.p.x, y: this.p.y - 30, text: 'NICE KILL!!!', col: '#0f0', life: 90, maxLife: 90, size: 30, rot: 0, screenCenter: true });
                    VoiceSys.speak('エコー', 'ひゅーっ！ナイスキル！');
                    playSnd('combo'); screenShake(10);
                    break;
                }
            }
        }
        
        let noiseInterval = 15;
        if (moved && !this.p.box && this.tmr % noiseInterval === 0) {
            let words = ['ドスッ!', 'バァーン!', 'スサッ', 'ドン!'];
            let cols = ['#f00', '#ff0', '#f0f', '#0ff'];
            this.texts.push({
                x: this.p.x + (Math.random()-0.5)*80, y: this.p.y + (Math.random()-0.5)*80,
                text: words[Math.floor(Math.random()*words.length)], col: cols[Math.floor(Math.random()*cols.length)],
                life: 60, maxLife: 60, size: 20 + Math.random()*20, rot: (Math.random()-0.5)*0.5
            });
            this.stats.noise++;
            playSnd(Math.random() < 0.5 ? 'hit' : 'jmp'); 
            if (this.stats.noise % 25 === 0) VoiceSys.speak('エコー', '足音デカすぎだろ！');
        }
        
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i]; t.life--;
            if (!t.screenCenter) t.y -= 0.3; 
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        // ゴール判定
        if (Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r + this.p.r) {
            playSnd('combo'); this.startStory(this.level + 1); return;
        }

        // 敵AIと視界
        for (let e of this.enemies) {
            let target = e.path[e.pt]; let dx = target.x - e.x, dy = target.y - e.y; let dist = Math.hypot(dx, dy);
            if (dist < 2) {
                if (e.wait > 0) e.wait--; else { e.pt = (e.pt + 1) % e.path.length; e.wait = 60; } 
            } else {
                e.dir = Math.atan2(dy, dx); e.x += Math.cos(e.dir) * e.spd; e.y += Math.sin(e.dir) * e.spd;
            }

            if (!this.p.box) {
                let pdx = this.p.x - e.x, pdy = this.p.y - e.y;
                let sightRadius = e.type === 'dog' ? 40 : 70; // 犬は視界が狭いが速い
                if (Math.hypot(pdx, pdy) < sightRadius) {
                    let angleDiff = Math.abs(Math.atan2(pdy, pdx) - e.dir);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    if (angleDiff < 0.6) { 
                        let hidden = false;
                        for (let w of activeWalls) { if (this.lineHitRect(e.x, e.y, this.p.x, this.p.y, w)) { hidden = true; break; } }
                        if (!hidden) {
                            this.st = 'gameover'; this.tmr = 0;
                            VoiceSys.speak('エコー', 'あーあ、見つかっちゃった。俺のせいじゃないからなｗ');
                            playSnd('hit'); screenShake(15);
                            this.texts.push({ x: this.p.x, y: this.p.y, text: 'SPOTTED!!', col: '#f00', life: 120, maxLife: 120, size: 40, rot: 0, screenCenter: true });
                        }
                    }
                }
            }
        }
    },

    drawSpriteData(x, y, data, scale) {
        if(!data) return;
        for (let row = 0; row < 24; row++) {
            if(!data[row]) continue;
            for (let col = 0; col < 24; col++) {
                let p = data[row][col];
                if (PAL[p]) { ctx.fillStyle = PAL[p]; ctx.fillRect(x + col * scale, y + row * scale, scale, scale); }
            }
        }
    },
    
    draw() {
        ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);
        
        if (this.st === 'title') {
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.2;
            for(let i=0; i<200; i+=10) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(100,300); ctx.stroke(); }
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#f80'; ctx.font = 'bold 26px "Arial Black", sans-serif';
            ctx.shadowBlur = 10; ctx.shadowColor = '#f00'; ctx.fillText('NOISE', 55, 80); ctx.fillText('AGENT', 55, 110); ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('- 爆音スニーキング -', 45, 140);
            ctx.fillStyle = this.menuCur === 0 ? '#0f0' : '#888'; ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'PLAY STORY', 60, 200);
            ctx.fillStyle = this.menuCur === 1 ? '#0f0' : '#888'; ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'DATABASE', 60, 220);
            return;
        }

        if (this.st === 'database') {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【 DATABASE 】', 45, 30);
            let item = DB_ITEMS[this.dbCur];
            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(`< ${item.title} >`, 10, 60);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            let textY = 90; let currentLine = '';
            for (let i = 0; i < item.text.length; i++) {
                currentLine += item.text[i];
                if (currentLine.length > 16) { ctx.fillText(currentLine, 15, textY); textY += 15; currentLine = ''; }
            }
            ctx.fillText(currentLine, 15, textY);
            ctx.fillStyle = '#888'; ctx.fillText('↑↓:選択  B:戻る', 50, 280);
            return;
        }

        if (this.st === 'story') {
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            ctx.fillStyle = '#112'; ctx.fillRect(0,0,200,300);
            ctx.strokeStyle = '#334'; ctx.lineWidth = 1;
            for(let i=0; i<300; i+=10) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(200,i); ctx.stroke(); }

            if (msg.c === 'SYSTEM') {
                ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
                let textY = 100; let currentLine = '';
                for (let i = 0; i < this.strToShow.length; i++) {
                    currentLine += this.strToShow[i];
                    if (currentLine.length > 16) { ctx.fillText(currentLine, 20, textY); textY += 16; currentLine = ''; }
                }
                ctx.fillText(currentLine, 20, textY);
                if (this.strToShow.length === msg.t.length && this.tmr % 30 < 15) ctx.fillText('▼', 90, 250);
            } else {
                let spData = CHAR_SPRITES[msg.c];
                if (spData) this.drawSpriteData(60, 20, spData, 3.5); 

                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 180, 180, 110);
                ctx.strokeStyle = msg.c === '司令官ノイズ' ? '#f00' : '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(10, 180, 180, 110);
                ctx.fillStyle = msg.c === '司令官ノイズ' ? '#f55' : (msg.c === 'ミュート' ? '#aaa' : '#0f0');
                ctx.font = 'bold 12px monospace'; ctx.fillText(`【 ${msg.c} 】`, 15, 200);

                ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
                let textY = 220; let currentLine = '';
                for (let i = 0; i < this.strToShow.length; i++) {
                    currentLine += this.strToShow[i];
                    if (currentLine.length > 14) { ctx.fillText(currentLine, 20, textY); textY += 16; currentLine = ''; }
                }
                ctx.fillText(currentLine, 20, textY);
                if (this.strToShow.length === msg.t.length && this.tmr % 30 < 15) { ctx.fillStyle = '#ff0'; ctx.fillText('▼', 170, 280); }
            }
            return;
        }

        // ================= PLAY & GAMEOVER =================
        // ★ マップスクロール適用
        ctx.save();
        ctx.translate(-this.cam.x, -this.cam.y);

        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=0; i<this.mapW; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,this.mapH); ctx.stroke(); }
        for(let i=0; i<this.mapH; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(this.mapW,i); ctx.stroke(); }

        ctx.fillStyle = '#555';
        for (let w of this.walls) { ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeStyle = '#000'; ctx.strokeRect(w.x, w.y, w.w, w.h); }
        
        // 色付き扉
        for (let d of this.doors) {
            if (!d.open) {
                ctx.fillStyle = d.col === 'blue' ? '#00f' : (d.col === 'red' ? '#f00' : '#0a0');
                ctx.globalAlpha = 0.5; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.globalAlpha = 1.0;
                ctx.strokeStyle = '#fff'; ctx.strokeRect(d.x, d.y, d.w, d.h);
            }
        }
        // 色付きスイッチ
        for (let s of this.switches) {
            ctx.fillStyle = s.active ? '#555' : (s.col === 'blue' ? '#00f' : (s.col === 'red' ? '#f00' : '#0a0'));
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})`;
        ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('GOAL', this.goal.x-12, this.goal.y+3);

        for (let e of this.enemies) {
            let sightRadius = e.type === 'dog' ? 40 : 70;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, sightRadius, e.dir - 0.6, e.dir + 0.6); ctx.fill();
            
            ctx.fillStyle = e.type === 'dog' ? '#fa0' : '#0a0'; 
            ctx.beginPath(); ctx.arc(e.x, e.y, e.type === 'dog' ? 4 : 6, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir)*10, e.y + Math.sin(e.dir)*10); ctx.stroke();
        }

        if (this.p.box) {
            let waveY = Math.sin(this.tmr * 0.2) * 2; ctx.fillStyle = `hsl(${(this.tmr * 5) % 360}, 100%, 50%)`;
            ctx.fillRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(this.p.x - 4, this.p.y - 2 + waveY, 8, 2);
        } else {
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(this.p.x, this.p.y, this.p.r, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        // マップ上の文字
        for (let t of this.texts) {
            if (t.screenCenter) continue; // 画面中央用は後で描画
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.globalAlpha = t.life / t.maxLife; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.globalAlpha = 1.0; ctx.restore();
        }
        
        ctx.restore(); // スクロール終了

        // ★ UIレイヤー（スクロールしない）
        for (let t of this.texts) {
            if (!t.screenCenter) continue;
            ctx.save(); ctx.translate(100, 150); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.rotate(t.rot); ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.globalAlpha = t.life / t.maxLife; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.globalAlpha = 1.0; ctx.restore();
        }

        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 260, 200, 40);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(2, 262, 196, 36);
        ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
        
        if (this.msgLife > 0 && this.msg !== '') {
            if (this.msg.length > 18) { ctx.fillText(this.msg.substring(0, 18), 10, 275); ctx.fillText(this.msg.substring(18), 10, 288); } 
            else { ctx.fillText(this.msg, 10, 280); }
        } else { ctx.fillStyle = '#444'; ctx.fillText('NO SIGNAL...', 10, 280); }

        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,200,15);
        ctx.fillStyle = '#0ff'; ctx.font = '10px monospace'; ctx.fillText(`LEVEL: ${this.level + 1}`, 5, 11);

        if (this.st === 'result') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('ALL CLEAR!!', 100, 50);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(`KILLS : ${this.stats.kills}`, 100, 100); ctx.fillText(`NOISES: ${this.stats.noise}`, 100, 120);
            
            let title = "NORMAL SPY"; let tCol = '#fff';
            if (this.stats.kills === 0) { title = "GHOST (不殺)"; tCol = '#0ff'; }
            else if (this.stats.boxTime > this.stats.time / 2) { title = "BOX LOVER"; tCol = '#ff0'; }
            else if (this.stats.noise > 150) { title = "NOISY NINJA"; tCol = '#f0f'; }
            
            ctx.fillStyle = '#f80'; ctx.fillText('YOUR RANK:', 100, 160);
            ctx.fillStyle = tCol; ctx.font = 'bold 16px monospace'; ctx.fillText(title, 100, 185);
            if (this.tmr > 60) { ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO RETURN', 100, 250); }
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        }
    }
};
