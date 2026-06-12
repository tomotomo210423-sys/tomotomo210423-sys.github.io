// === NOISE AGENT (Ultimate Cinematic & Escape Edition - FINAL) ===

const playSE = (id) => { if(typeof playSnd === 'function') playSnd(id); };
const shakeCam = (val) => { if(typeof screenShake === 'function') screenShake(val); };

const CommSys = {
    msg: '', msgLife: 0,
    speak(char, txt) {
        if (Noise.st === 'play' || Noise.st === 'gameover') {
            this.msg = char === 'ミュート' ? '……' : `【${char}】 ${txt}`;
            this.msgLife = 180; 
        }
    }
};

const PAL = { '0':null, '1':'#000', '2':'#fff', '3':'#fca', '4':'#f00', '5':'#0ff', '6':'#0a0', '7':'#fa0', '8':'#444', '9':'#888', 'a':'#05f', 'b':'#940', 'c':'#a0a' };

const CHAR_SPRITES = {
    'エコー': [ 
        "000000000000000000000000","000000000111111000000000","000000011777777110000000","000000177777777771000000",
        "000001777777777777100000","000011777733333377110000","000181777333333337181000","000181111111111111181000",
        "000181111555555111181000","000181111555555111181000","000181773333333377181000","000011773333333377110000",
        "000001773333333377100000","000000113333333311000000","000000001133331100000000","000000016611116610000000",
        "000000166666666661000000","000001666666666666100000","000001666111111666100000","000016661333333166610000",
        "000016661333333166610000","000016661111111166610000","000011110000000011110000","000000000000000000000000"
    ],
    'マキシマム': [ 
        "000000000000000000000000","000000000111110000000000","000000001333331000000000","000000013333333100000000",
        "000000133333333310000000","000000111111111110000000","000000115511155110000000","000000133333333310000000",
        "000000133111113310000000","000000013333333100000000","000000001111111000000000","000000013333333100000000",
        "000000133133313310000000","000001333133313331000000","000001333133313331000000","000013333133313333100000",
        "000013333133313333100000","000013333133313333100000","000011111111111111100000","000000000000000000000000"
    ],
    'ルナ': [ 
        "000000000000000000000000","000000001111111000000000","000000017777777100000000","001100177777777710011000",
        "017711771111111771177100","017771715555555171777100","017771715555555171777100","001771733333333371771000",
        "000110131133311310110000","000000133333333310000000","000000133311133310000000","000000013333333100000000",
        "000000001111111000000000","00000001aa111aa100000000","0000001aaa222aaa10000000","000001aaaa222aaaa1000000",
        "000001aaaa222aaaa1000000","00001aaaaa222aaaaa100000","00001aaaaa111aaaaa100000","00001aaaaa131aaaaa100000",
        "000011111100011111000000","000000000000000000000000"
    ],
    'おやっさん': [ 
        "000000000000000000000000","000000000111110000000000","000000001999991000000000","000000019999999100000000",
        "000000199999999910000000","000000193333333910000000","000000131133311310000000","000000131133311310000000",
        "000000133333333310000000","000000133311133311110000","000000199333339912410000","000000019933399111100000",
        "000000001111111000000000","00000001bb111bb100000000","0000001bbbbbbbbb10000000","000001bbbbbbbbbbb1000000",
        "000001bbbb888bbbb1000000","00001bbbbb888bbbbb100000","00001bbbbb888bbbbb100000","00001bbbbb111bbbbb100000",
        "000011111000001111000000","000000000000000000000000"
    ],
    '司令官ノイズ': [ 
        "000000000000000000000000","000000000111111000000000","000000011444444110000000","000000144444444441000000",
        "000001444444444444100000","000011111111111111110000","000000133333333331000000","000000131133331131000000",
        "000000131133331131000000","000000133333333331000000","000000133311113331000000","000000013333333310000000",
        "000000001111111100000000","000000018888888810000000","000000188888888881000000","000001888888888888100000",
        "000001888788887888100000","000018888788887888810000","000018888888888888810000","000011111111111111110000"
    ],
    '副官ソナー': [ 
        "000000000000000000000000","000000000111110000000000","000000001cccccc100000000","00000001ccccccc100000000",
        "00000001ccccccc101100000","00000011111111111cc10000","00000014444444411cc10000","000000144444444101100000",
        "000000133333333100000000","000000133111133100000000","000000133333333100000000","000000013333331000000000",
        "000000001111110000000000","000000011111111000000000","000000111111111100000000","000001111111111110000000",
        "000011111111111111000000","000011111111111111000000","000011111100111111000000","000000000000000000000000"
    ],
    'ミュート': [ 
        "000000000000000000000000","000000000111111000000000","000000011111111110000000","000000111111111111000000",
        "000001111111111111100000","000001111441144111100000","000001111441144111100000","000001111111111111100000",
        "000000111111111111000000","000000011111111110000000","000000001111111100000000","000000018888888810000000",
        "000000188888888881000000","000001888888888888100000","000018888888888888810000","000018888888888888810000",
        "000018888888888888810000","000018888888888888810000","000011111111111111110000","000000000000000000000000"
    ]
};

const SCENARIOS = [
    [
        { c: 'SYSTEM', t: '世界から「音」を奪おうとする悪の組織『サイレンス』に、1人の男が潜入した。' },
        { c: 'エコー', t: '作戦開始だ。だが最悪なニュースがある。靴がハッキングされた。' },
        { c: 'エコー', t: '歩くたびに爆音と【超絶巨大な文字】が出る最悪の靴だ。前見えないだろ？ｗ' },
        { c: 'マキシマム', t: 'ガハハ！足音など筋肉でかき消せばよい！正面突破だ！' },
        { c: 'ルナ', t: 'マキシマムさん無茶言わないで！Aで暗殺、Bでダンボールです！青いスイッチを踏んでください！' }
    ],
    [
        { c: '司令官ノイズ', t: '侵入者め...何だあのふざけた足音は！警備をレベル2に引き上げろ！' },
        { c: 'エコー', t: 'やべぇボスにバレた！「俺、この任務が終わったら結婚するんだ…」って死亡フラグ立てとく？' },
        { c: 'おやっさん', t: '坊主、油断するな。ここからは「赤いスイッチ」の仕掛けも追加される。' },
        { c: 'ルナ', t: 'ステージが広くなりました！行き止まりに注意して大回りしてくださいね！' }
    ],
    [
        { c: '副官ソナー', t: 'フフ…騒がしいネズミね。私の可愛い『サイボーグ猟犬』の餌にしてあげるわ。' },
        { c: 'ルナ', t: '猟犬は移動速度がものすごく速いです！あと【赤いレーザー】には絶対触れないで！' },
        { c: 'ルナ', t: '今回から【黄色いハッキング端末】が登場します！近くで【Aボタンを長押し】してデータを抜いて！' },
        { c: 'エコー', t: '文字が邪魔で見えねぇって？「Aボタン空振り」で大声を出して敵を誘い出せ！' }
    ],
    [
        { c: '司令官ノイズ', t: 'ええい！なぜあんな騒がしい奴を捕まえられんのだ！！' },
        { c: 'マキシマム', t: '情報端末が複数あるだと！？筋肉で全て粉砕してやる！' },
        { c: 'ルナ', t: '壊さないでください！全部ハッキングしないと進めません！迷路になってますから気をつけて！' }
    ],
    [
        { c: '副官ソナー', t: '緑の隔壁を封鎖！親衛隊を総動員します！' },
        { c: 'おやっさん', t: '坊主、次が親衛隊の最終防衛ラインだ。3色の鍵が入り乱れている。' },
        { c: 'ルナ', t: '青いロッカーを見つけたら、重なって隠れることができますよ！' },
        { c: 'エコー', t: 'B級映画なら、ここらで主人公がピンチになる展開だな。アスタラビスタ、ベイビー！' }
    ],
    [
        { c: 'SYSTEM', t: '親衛隊を退けたミュートの前に、ついに組織のボスが立ちはだかる。' },
        { c: '司令官ノイズ', t: '貴様か…私の完璧な静寂を汚す、その下品な靴音は！' },
        { c: '司令官ノイズ', t: 'この司令官自ら、貴様を永遠の沈黙に沈めてやろう！！' },
        { c: 'ルナ', t: '司令官の視界はとんでもなく広いです！死角を突いて！' },
        { c: 'マキシマム', t: 'ボスの背後に回り込んで、Aボタンで脳天に筋肉を叩き込め！！' }
    ],
    [
        { c: 'SYSTEM', t: '見事司令官を打倒したミュート。しかし、基地は自爆装置が作動した！' },
        { c: '司令官ノイズ', t: 'ガハッ…道連れだ…基地ごと吹き飛べ！！' },
        { c: 'ルナ', t: '基地が爆発します！！制限時間は60秒！早く脱出して！！' },
        { c: 'エコー', t: '全力で走れミュート！もう文字で前が見えなくても気合で避けろ！' },
        { c: 'マキシマム', t: '筋肉を信じて限界を超えろォォ！！' }
    ],
    [
        { c: 'SYSTEM', t: '爆発の炎を背に、ミュートは間一髪で生還した。' },
        { c: 'エコー', t: 'ミッション・コンプリート！ハリウッド映画顔負けの脱出だったぜ！' },
        { c: 'マキシマム', t: '筋肉の勝利だな！！ガハハハ！' },
        { c: 'おやっさん', t: 'よくやった坊主。伝説の誕生だな。やかましい伝説だがな。' },
        { c: 'ルナ', t: '沈まないでください！！早く帰ってきて！エンドロール流しますよ！' }
    ]
];

const COMM_CONV = [
    [ {c:'エコー', t:'右見て、左見て、筋肉見ろ！'}, {c:'マキシマム', t:'素晴らしいアドバイスだ！'}, {c:'ルナ', t:'真面目にナビしてください！'} ],
    [ {c:'おやっさん', t:'坊主、足音の文字で前が見えん時は壁を頼れ。'}, {c:'マキシマム', t:'壁は殴って壊すものだ！'} ],
    [ {c:'ルナ', t:'ダンボールのO2ゲージに気をつけて！'}, {c:'エコー', t:'息止めてれば平気だろ？'}, {c:'ルナ', t:'死にますよ！？'} ],
    [ {c:'エコー', t:'この作戦が終わったら、俺…'}, {c:'おやっさん', t:'バカヤロウ！その言葉は口にするな！死亡フラグだ！'} ],
    [ {c:'マキシマム', t:'ミュート！プロテインは足りているか！？'}, {c:'エコー', t:'彼はスパイであってボディビルダーじゃないぞ。'} ],
    [ {c:'副官ソナー', t:'そこら中で文字が光ってて目障りね。'}, {c:'エコー', t:'敵の通信に割り込むな！'} ],
    [ {c:'エコー', t:'おいミュート、今うしろに誰か……'}, {c:'エコー', t:'なーんてな！'} ],
    [ {c:'おやっさん', t:'昔は私もお前のように音を立てていた。'}, {c:'エコー', t:'嘘つけ！'} ],
    [ {c:'マキシマム', t:'ミュート、大胸筋が歩いているぞ！'}, {c:'ルナ', t:'足音の話ですよね？'} ],
    [ {c:'エコー', t:'この文字、フォントサイズデカすぎないか？視界ジャックにも程があるぞｗ'} ],
    [ {c:'マキシマム', t:'ハッキングなど軟弱だ！情報端末を粉砕しろ！'} ],
    [ {c:'エコー', t:'Yippee-ki-yay, mother f**ker!'}, {c:'ルナ', t:'放送禁止用語やめてください！'} ],
    [ {c:'おやっさん', t:'落ち着け坊主。文字の裏には必ず道がある。'} ],
    [ {c:'エコー', t:'俺、昨日徹夜でFPSやってたから超眠いんだわ。'}, {c:'ルナ', t:'命かかってるんですよ！？'} ],
    [ {c:'副官ソナー', t:'ネズミ一匹にどんだけ手間取ってるの！'} ],
    [ {c:'マキシマム', t:'ダンボールは燃えるゴミに出せ！！'} ],
    [ {c:'エコー', t:'俺がもし死んだら、ブラウザの履歴を消しておいてくれ。'} ],
    [ {c:'ルナ', t:'レーザーには気をつけて！丸焦げになりますよ！'} ],
    [ {c:'おやっさん', t:'敵の背中を取れ。漢は背中で語るものだ。'} ],
    [ {c:'エコー', t:'ポップコーン美味いなー。お前も食うか？あ、任務中だったなｗ'} ],
    [ {c:'マキシマム', t:'筋肉痛はスパイの勲章だ！'} ],
    [ {c:'エコー', t:'お前のその靴、暗闇で光る機能もつけようぜ！'}, {c:'ルナ', t:'絶対にやめてください！'} ],
    [ {c:'マキシマム', t:'壁に阻まれたらどうする！？'}, {c:'エコー', t:'迂回する。'}, {c:'マキシマム', t:'違う！己の拳で道を作るのだ！'} ],
    [ {c:'ルナ', t:'青いロッカーに隠れれば、敵は絶対に見つけられません！'} ]
];

const DB = [
    {
        cat: 'キャラクター',
        items: [
            { title: 'ミュート', text: '一切言葉を発さない寡黙なスパイ。呪いの靴のせいで歩くたびに爆音と文字が出る不憫な男。愛用の銃よりプロテインを好む。' },
            { title: 'エコー', text: '相棒の若手ハッカー。B級映画のセリフを引用して煽るのが趣味。ミュートが苦労している状況を映画を観るように楽しんでいる。' },
            { title: 'マキシマム', text: '筋肉で全てを解決しようとする元・伝説のスパイ。暗号解読はキーボードを粉砕して行い、潜入は壁を破壊して行う。' },
            { title: 'ルナ', text: '飛び級で博士号を取得した天才メカニック。ミュートの装備をハッキングから守れず、毎晩徹夜でデバッグしている。' },
            { title: 'おやっさん', text: 'かつて冷戦時代を生き抜いた伝説の男。今は通信室から葉巻を咥えて的確な指示を出す。' },
            { title: '司令官ノイズ', text: '世界から音と娯楽を奪おうとする「サイレンス」のボス。静寂を愛するがゆえにミュートの足音に激怒している。' },
            { title: '副官ソナー', text: '冷酷な女幹部。サイボーグ猟犬を操る。文字が大きすぎて彼女も前が見えていない説がある。' }
        ]
    },
    {
        cat: '世界観',
        items: [
            { title: '呪いのステルス靴', text: '歩くたびに「ドスッ」などの超巨大文字ホログラムを放出し、使用者の視界を物理的に塞ぐ最悪の装備。最大200pxの文字が出る。' },
            { title: '虹色ダンボール', text: '被ると敵をやり過ごせるが、密閉性が高く長く被ると酸欠になる。しかも内部はクラブ仕様でパリピな虹色に発光する。' },
            { title: 'Aボタンの叫び', text: '敵がいない場所でAボタンを押すと、ミュートが「HEY!!」と叫び敵を誘い出すデコイ機能。文字がデカすぎて自分も前が見えなくなる。' },
            { title: 'ハッキング端末', text: '機密データが入った黄色い端末。Aボタン長押しでダウンロードできるが、その間は完全に無防備になる。' }
        ]
    },
    {
        cat: '組織',
        items: [
            { title: 'サイレンス', text: '人類から音楽や娯楽を奪い、完全な静寂をもたらそうとする悪の組織。無機質な基地を多数保有する。' },
            { title: '親衛隊', text: '最深部を守るエリート兵士。視界が広く、足も速い。' },
            { title: 'スナイパー', text: '移動せず定点から超遠距離の視界を確保する防衛部隊。' },
            { title: 'サイボーグ猟犬', text: 'ソナーが操る機械の犬。視界は狭いが移動速度が異様に速く、音もなく背後から忍び寄る。' },
            { title: 'レーザーフェンス', text: '一定間隔で点滅する赤い防衛システム。触れると即座に発見されゲームオーバーとなる。' }
        ]
    }
];

const Noise = {
    st: 'title', tmr: 0, level: 0, maxLevel: 0, menuCur: 0, dbCat: 0, dbItem: 0, gameOverCur: 0,
    scIdx: 0, msgIdx: 0, strToShow: '',
    cam: { x: 0, y: 0 }, mapW: 200, mapH: 300,
    p: { x: 100, y: 280, r: 6, spd: 3.0, box: false }, o2: 100, o2Cd: 0, 
    texts: [], enemies: [], walls: [], doors: [], switches: [], terminals: [], lasers: [], lockers: [],
    goal: { x: 100, y: 20, r: 15 }, stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    commTmr: 100, commQueue: [], escapeTimer: -1, dialogSkipHold: 0,
    
    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss'); canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.level = 0; this.menuCur = 0; 
        CommSys.msg = ''; CommSys.msgLife = 0; this.commQueue = [];
        
        let saved = localStorage.getItem('noiseAgentMaxLevel');
        if (saved !== null) { this.maxLevel = parseInt(saved, 10) || 0; } else { this.maxLevel = 0; }
        
        if (typeof BGM !== 'undefined') BGM.play('boss');
    },

    startStory(sIdx) {
        if(sIdx >= SCENARIOS.length) { this.st = 'result'; this.tmr = 0; return; }
        this.st = 'story'; this.scIdx = sIdx; this.msgIdx = 0; this.tmr = 0; this.strToShow = '';
    },

    wL(x,y,w,h) { this.walls.push({x,y,w,h}); },
    dL(x,y,w,h,col,id) { this.doors.push({x,y,w,h,col,open:false,id}); },
    sL(x,y,col,id) { this.switches.push({x,y,r:15,col,active:false,id}); },
    eL(x,y,pts,spd,type) { this.enemies.push({x,y,path:pts,pt:0,spd,dir:0,wait:0,type,sweepTmr:0}); },
    tL(x,y) { this.terminals.push({x,y,r:20,progress:0,hacked:false}); },
    lL(x,y,w,h,maxTmr) { this.lasers.push({x,y,w,h,tmr:0,maxTmr}); },
    hL(x,y,w,h) { this.lockers.push({x,y,w,h}); },

    addOuterWalls() {
        this.wL(0,0,this.mapW,20); this.wL(0,this.mapH-20,this.mapW,20);
        this.wL(0,0,20,this.mapH); this.wL(this.mapW-20,0,20,this.mapH);
    },

    lineHitRect(x1, y1, x2, y2, rect) {
        let dist = Math.hypot(x2 - x1, y2 - y1); let steps = Math.ceil(dist / 5);
        for (let i = 0; i <= steps; i++) {
            let px = x1 + (x2 - x1) * (i / steps); let py = y1 + (y2 - y1) * (i / steps);
            if (px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h) return true;
        }
        return false;
    },

    loadLevel() {
        this.st = 'play'; this.p.box = false; this.o2 = 100; this.o2Cd = 0;
        this.texts = []; this.tmr = 0; this.commTmr = 150; this.commQueue = [];
        this.walls = []; this.doors = []; this.switches = []; this.enemies = []; this.terminals = []; this.lasers = []; this.lockers = [];
        this.escapeTimer = -1;
        
        if (this.level === 0) {
            this.mapW=400; this.mapH=600; this.p.x=200; this.p.y=500;
            this.wL(0,300,160,40); this.wL(240,300,160,40); 
            this.dL(160,300,80,40,'blue',1); this.sL(320,450,'blue',1);
            this.wL(100,150,200,40); 
            this.eL(200,400,[{x:40,y:400},{x:360,y:400}], 1.2, 'soldier');
            this.goal = {x:200, y:80, r:20};
        } 
        else if (this.level === 1) { 
            this.mapW=600; this.mapH=500; this.p.x=50; this.p.y=450;
            this.wL(280,0,40,200); this.wL(280,300,40,200); 
            this.wL(0,240,100,40); this.wL(180,240,100,40); 
            this.dL(280,200,40,100,'red',2); 
            this.dL(100,240,80,40,'blue',1); 
            this.sL(200, 400, 'blue', 1); 
            this.sL(100, 100, 'red', 2);  
            this.eL(400,350,[{x:320,y:350},{x:550,y:350}], 1.5, 'soldier');
            this.eL(150,150,[{x:50,y:150},{x:250,y:150}], 1.5, 'soldier');
            this.goal = {x:500, y:100, r:20};
        }
        else if (this.level === 2) { 
            this.mapW=600; this.mapH=600; this.p.x=100; this.p.y=500;
            this.wL(0,380,450,40); this.wL(150,180,450,40);
            this.lL(450,380,150,10,120); this.lL(450,410,150,10,120); 
            this.lL(0,180,150,10,100); this.lL(0,210,150,10,100); 
            this.eL(300,480,[{x:100,y:480},{x:500,y:480}], 4.0, 'dog');
            this.eL(300,280,[{x:500,y:280},{x:100,y:280}], 4.0, 'dog');
            this.tL(50, 280); 
            this.goal = {x:500, y:80, r:20};
        }
        else if (this.level === 3) { 
            this.mapW=800; this.mapH=600; this.p.x=400; this.p.y=500;
            this.wL(200,150,40,300); this.wL(560,150,40,300);
            this.wL(350,150,100,40); this.wL(350,410,100,40);
            this.tL(100,100); this.tL(700,100); this.tL(100,500); this.tL(700,500);
            this.eL(400,280,[{x:400,y:280}], 0, 'sniper'); 
            this.eL(120,300,[{x:120,y:150},{x:120,y:450}], 4.5, 'dog');
            this.eL(680,300,[{x:680,y:450},{x:680,y:150}], 4.5, 'dog');
            this.hL(280, 260, 40, 60); 
            this.goal = {x:400, y:80, r:20};
        }
        else if (this.level === 4) { 
            this.mapW=800; this.mapH=800; this.p.x=100; this.p.y=700;
            this.wL(240,20,40,580); this.dL(240,600,40,180,'red',1); 
            this.wL(520,20,40,580); this.dL(520,600,40,180,'blue',2);
            this.wL(560,380,80,40); this.dL(640,380,80,40,'green',3); this.wL(720,380,60,40);
            this.wL(280,380,160,40); 

            this.sL(100,100,'red',1); this.sL(400,100,'blue',2); this.sL(700,700,'green',3);
            
            this.eL(150,400,[{x:50,y:400},{x:200,y:400}], 2.5, 'soldier');
            this.eL(400,600,[{x:300,y:600},{x:500,y:600}], 2.5, 'soldier');
            this.eL(400,200,[{x:300,y:200},{x:500,y:200}], 4.0, 'dog');
            this.eL(650,550,[{x:580,y:550},{x:750,y:550}], 5.0, 'dog');
            
            this.lL(280,500,240,10,80); 
            this.hL(450, 700, 50, 50); 
            this.goal = {x:700, y:100, r:20};
        }
        else if (this.level === 5) { 
            this.mapW=600; this.mapH=600; this.p.x=300; this.p.y=550;
            this.wL(150,150,60,60); this.wL(390,150,60,60); this.wL(150,390,60,60); this.wL(390,390,60,60); 
            this.eL(300,300,[{x:300,y:300}], 0, 'boss');
            this.eL(300,100,[{x:100,y:100},{x:500,y:100},{x:500,y:500},{x:100,y:500}], 4.0, 'dog');
            this.goal = {x:-100,y:-100,r:1}; 
        }
        else if (this.level === 6) { 
            this.mapW=400; this.mapH=1600; this.p.x=200; this.p.y=1500;
            this.escapeTimer = 3600; 
            for(let y=150; y<1400; y+=200) {
                let gap = 60 + Math.random()*200;
                this.wL(20,y,gap-40,40); this.wL(gap+60,y,360-(gap+60),40);
                this.eL(200,y+100,[{x:50,y:y+100},{x:350,y:y+100}], 5.0, 'dog');
                this.lL(20,y+160,360,10,50); 
            }
            this.goal = {x:200, y:60, r:30};
        }
        this.addOuterWalls();
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        // ================= TITLE =================
        if (this.st === 'title') {
            if (keysDown.down) { this.menuCur = (this.menuCur + 1) % 3; playSE('sel'); }
            if (keysDown.up) { this.menuCur = (this.menuCur - 1 + 3) % 3; playSE('sel'); }
            if (keysDown.a) { 
                if (this.menuCur === 0) { 
                    this.stats = { kills:0, noise:0, boxTime:0, time:0 }; 
                    this.level = 0; playSE('jmp'); this.startStory(0); 
                } 
                else if (this.menuCur === 1) {
                    if (this.maxLevel > 0) {
                        this.stats = { kills:0, noise:0, boxTime:0, time:0 }; 
                        this.level = this.maxLevel; playSE('jmp'); this.startStory(this.level); 
                    } else { playSE('hit'); }
                }
                else { this.st = 'db_cat'; this.dbCat = 0; playSE('sel'); }
            }
            return;
        }

        // ================= DATABASE =================
        if (this.st.startsWith('db_')) {
            if (this.st === 'db_cat') {
                if (keysDown.down) { this.dbCat = (this.dbCat + 1) % DB.length; playSE('sel'); }
                if (keysDown.up) { this.dbCat = (this.dbCat - 1 + DB.length) % DB.length; playSE('sel'); }
                if (keysDown.a) { this.st = 'db_list'; this.dbItem = 0; playSE('sel'); }
                if (keysDown.b) { this.st = 'title'; playSE('hit'); }
            } else if (this.st === 'db_list') {
                let items = DB[this.dbCat].items;
                if (keysDown.down) { this.dbItem = (this.dbItem + 1) % items.length; playSE('sel'); }
                if (keysDown.up) { this.dbItem = (this.dbItem - 1 + items.length) % items.length; playSE('sel'); }
                if (keysDown.a) { this.st = 'db_detail'; playSE('sel'); }
                if (keysDown.b) { this.st = 'db_cat'; playSE('hit'); }
            } else if (this.st === 'db_detail') {
                if (keysDown.b) { this.st = 'db_list'; playSE('hit'); }
            }
            return;
        }

        // ================= STORY =================
        if (this.st === 'story') {
            if (!SCENARIOS[this.scIdx] || !SCENARIOS[this.scIdx][this.msgIdx]) return;
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            if (this.tmr % 2 === 0 && this.strToShow.length < msg.t.length) {
                this.strToShow += msg.t[this.strToShow.length];
                if (this.strToShow.length % 3 === 0) playSE('sel');
            }
            // ★ ダイアログスキップ: Aボタン長押し15フレームで全スキップ
            if (keys.a) {
                this.dialogSkipHold++;
                if (this.dialogSkipHold >= 15) {
                    this.dialogSkipHold = 0;
                    playSE('hit');
                    if (this.scIdx === SCENARIOS.length - 1) { this.st = 'result'; this.tmr = 0; }
                    else { this.loadLevel(); }
                    return;
                }
            } else {
                this.dialogSkipHold = 0;
            }
            if (keysDown.a) {
                if (this.strToShow.length < msg.t.length) { this.strToShow = msg.t; }
                else {
                    this.msgIdx++;
                    if (this.msgIdx < SCENARIOS[this.scIdx].length) { this.strToShow = ''; }
                    else {
                        if (this.scIdx === SCENARIOS.length - 1) { this.st = 'result'; this.tmr = 0; }
                        else { this.loadLevel(); }
                    }
                }
            }
            return;
        }

        // ================= GAMEOVER (コンティニュー機能) =================
        if (this.st === 'gameover') {
            if (CommSys.msgLife > 0) CommSys.msgLife--;
            if (this.tmr > 60) {
                if (keysDown.down) { this.gameOverCur = 1; playSE('sel'); }
                if (keysDown.up) { this.gameOverCur = 0; playSE('sel'); }
                if (keysDown.a) {
                    if (this.gameOverCur === 0) {
                        playSE('jmp');
                        this.startStory(this.level); // 現在のレベルからリトライ
                    } else {
                        playSE('hit');
                        this.st = 'title'; this.tmr = 0;
                    }
                }
            }
            return;
        }

        if (this.st === 'result') {
            if (CommSys.msgLife > 0) CommSys.msgLife--;
            if (this.tmr > 60 && (keysDown.a || keysDown.b)) { this.st = 'title'; this.tmr = 0; }
            return;
        }

        // ================= PLAY =================
        this.stats.time++;
        
        if (this.escapeTimer > 0) {
            this.escapeTimer--;
            if (this.escapeTimer <= 0) {
                CommSys.speak('ルナ', '基地が爆発しました！！');
                playSE('hit'); shakeCam(30);
                this.texts.push({ x: this.p.x, y: this.p.y, text: 'TIME OVER', col: '#f00', life: 120, maxLife: 120, size: 60, rot: 0, screenCenter: true });
                this.st = 'gameover'; this.tmr = 0; this.gameOverCur = 0; return;
            }
        }

        let inLocker = false;
        for (let l of this.lockers) {
            if (this.p.x > l.x && this.p.x < l.x+l.w && this.p.y > l.y && this.p.y < l.y+l.h) { inLocker = true; break; }
        }

        if (this.commQueue.length > 0) {
            if (CommSys.msgLife <= 0) { let n = this.commQueue.shift(); CommSys.speak(n.c, n.t); }
        } else {
            this.commTmr--;
            if (this.commTmr <= 0) {
                let conv = COMM_CONV[Math.floor(Math.random() * COMM_CONV.length)];
                this.commQueue = [...conv]; this.commTmr = 300 + Math.random() * 300;
            }
        }
        if (CommSys.msgLife > 0) CommSys.msgLife--;
        
        this.cam.x = Math.max(0, Math.min(this.mapW - 200, this.p.x - 100));
        this.cam.y = Math.max(0, Math.min(this.mapH - 300, this.p.y - 150));
        
        let currentSpd = this.p.spd;
        if (keys.b && this.o2 > 0 && this.o2Cd <= 0 && !inLocker) {
            this.p.box = true; currentSpd *= 0.2; this.o2 -= 0.8; this.stats.boxTime++;
            if (this.o2 <= 0) {
                this.p.box = false; this.o2Cd = 120; 
                this.texts.push({x: this.p.x, y: this.p.y, text: '酸欠!!', col: '#0ff', life: 60, maxLife: 60, size: 30, rot: 0}); playSE('hit');
            }
        } else {
            this.p.box = false;
            if (this.o2 < 100) this.o2 += 0.4;
            if (this.o2Cd > 0) this.o2Cd--;
        }
        // ★ O2自動回復: 30フレームごとに+0.5 (ボックス中も適用)
        if (this.tmr % 30 === 0 && this.o2 < 100) this.o2 = Math.min(100, this.o2 + 0.5);

        let moved = false; let vx = 0, vy = 0;
        if (keys.left)  { vx -= currentSpd; moved = true; }
        if (keys.right) { vx += currentSpd; moved = true; }
        if (keys.up)    { vy -= currentSpd; moved = true; }
        if (keys.down)  { vy += currentSpd; moved = true; }
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
        
        let nx = this.p.x + vx; let ny = this.p.y + vy;
        let hitWall = false;
        let activeWalls = [...this.walls, ...this.doors.filter(d => !d.open)];
        for (let w of activeWalls) { if (nx + this.p.r > w.x && nx - this.p.r < w.x + w.w && ny + this.p.r > w.y && ny - this.p.r < w.y + w.h) { hitWall = true; break; } }
        if (!hitWall) { this.p.x = nx; this.p.y = ny; }

        for (let s of this.switches) {
            if (!s.active && Math.hypot(this.p.x - s.x, this.p.y - s.y) < s.r + this.p.r) {
                s.active = true; playSE('sel');
                this.texts.push({ x: s.x, y: s.y, text: 'CLICK!', col: s.col === 'blue' ? '#0ff' : (s.col === 'red' ? '#f00' : '#0f0'), life: 40, maxLife: 40, size: 30, rot: 0 });
                for (let d of this.doors) { if (d.col === s.col) d.open = true; }
            }
        }

        let isHacking = false; let nearTerminal = false;
        for (let t of this.terminals) {
            if (!t.hacked && Math.hypot(this.p.x - t.x, this.p.y - t.y) < t.r + this.p.r + 20) {
                nearTerminal = true;
                if (keys.a && !this.p.box) {
                    t.progress += 1.5; isHacking = true;
                    if (this.tmr % 5 === 0) playSE('sel');
                    if (t.progress >= 100) {
                        t.hacked = true; playSE('combo');
                        this.texts.push({ x: t.x, y: t.y - 20, text: 'HACKED!!', col: '#0f0', life: 60, maxLife: 60, size: 50, rot: 0 });
                        CommSys.speak('ルナ', 'ダウンロード完了です！');
                    }
                }
            }
        }

        if (keysDown.a && !this.p.box && !isHacking && !inLocker) {
            let killed = false;
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let e = this.enemies[i];
                if (Math.hypot(e.x - this.p.x, e.y - this.p.y) < 35) {
                    if (e.type === 'boss') {
                        this.enemies.splice(i, 1); killed = true;
                        this.texts.push({ x: this.p.x, y: this.p.y - 30, text: 'BOSS KILLED!!', col: '#f0f', life: 120, maxLife: 120, size: 80, rot: 0, screenCenter: true });
                        playSE('combo'); shakeCam(30);
                        if (this.level > this.maxLevel) { this.maxLevel = this.level; localStorage.setItem('noiseAgentMaxLevel', this.maxLevel); }
                        setTimeout(() => { this.level++; this.startStory(this.level); }, 2000);
                        return;
                    } else {
                        this.enemies.splice(i, 1); this.stats.kills++; killed = true;
                        this.texts.push({ x: this.p.x, y: this.p.y - 30, text: 'NICE KILL!!!', col: '#0f0', life: 90, maxLife: 90, size: 70, rot: (Math.random()-0.5)*0.3, screenCenter: true });
                        playSE('combo'); shakeCam(10);
                    }
                    break;
                }
            }
            if (!killed) { 
                let shout = ['HEY!!', 'MUSCLE!!', 'HERE!!'][Math.floor(Math.random()*3)];
                this.texts.push({ x: this.p.x, y: this.p.y, text: shout, col: '#ff0', life: 60, maxLife: 60, size: 140, rot: (Math.random()-0.5) });
                this.stats.noise += 5; playSE('jmp'); shakeCam(5);
                for (let e of this.enemies) { if (e.type !== 'boss' && Math.hypot(e.x - this.p.x, e.y - this.p.y) < 250) e.inv = { x: this.p.x, y: this.p.y, tmr: 120 }; }
            }
        }
        
        if (moved && !this.p.box && !inLocker && this.tmr % 15 === 0) {
            let words = ['ドスッ!', 'バァーン!', 'スサッ', 'ドン!'];
            let cols = ['#f00', '#ff0', '#f0f', '#0ff'];
            let cx = this.cam.x, cy = this.cam.y;
            let tx = this.p.x + (Math.random()-0.5)*80; let ty = this.p.y + (Math.random()-0.5)*80;
            tx = Math.max(cx + 40, Math.min(cx + 160, tx)); ty = Math.max(cy + 60, Math.min(cy + 240, ty));

            this.texts.push({ x: tx, y: ty, text: words[Math.floor(Math.random()*words.length)], col: cols[Math.floor(Math.random()*cols.length)], life: 60, maxLife: 60, size: 80 + Math.random()*120, rot: (Math.random()-0.5)*0.5 });
            this.stats.noise++; playSE(Math.random() < 0.5 ? 'hit' : 'jmp'); 
        }
        
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i]; t.life--;
            if (!t.screenCenter) t.y -= 0.3; 
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        let canGoal = this.terminals.every(t => t.hacked);
        if (canGoal && this.goal.r > 0 && Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r + this.p.r) {
            playSE('combo'); 
            if (this.level > this.maxLevel) { this.maxLevel = this.level; localStorage.setItem('noiseAgentMaxLevel', this.maxLevel); }
            this.level++; this.startStory(this.level); return;
        }

        let spotted = false;

        for(let l of this.lasers) {
            l.tmr++; let isOn = (l.tmr % l.maxTmr) > (l.maxTmr / 2);
            if (isOn && !this.p.box && !inLocker && this.p.x > l.x && this.p.x < l.x+l.w && this.p.y > l.y && this.p.y < l.y+l.h) { spotted = true; break; }
        }

        if (!spotted) {
            for (let e of this.enemies) {
                let prevX = e.x, prevY = e.y;
                if (e.type === 'boss') { e.dir += 0.03; }
                else if (e.type === 'sniper') {
                    // ★ スナイパー: sweepAngleが±45°(0.785rad)を0.8°/frame(0.01396rad/frame)で往復
                    if (e.sweepAngle === undefined) { e.sweepAngle = 0; e.sweepDir = 1; }
                    e.sweepAngle += 0.01396 * e.sweepDir;
                    if (e.sweepAngle > 0.785 || e.sweepAngle < -0.785) e.sweepDir *= -1;
                    e.dir = Math.PI / 2 + e.sweepAngle;
                }
                else {
                    let moveX = 0, moveY = 0;
                    if (e.inv && e.inv.tmr > 0) { 
                        let dx = e.inv.x - e.x, dy = e.inv.y - e.y;
                        if (Math.hypot(dx, dy) > 5) { 
                            e.dir = Math.atan2(dy, dx); 
                            moveX = Math.cos(e.dir) * e.spd; moveY = Math.sin(e.dir) * e.spd; 
                        }
                        e.inv.tmr--;
                    } else {
                        let target = e.path[e.pt]; 
                        if(target) {
                            let dx = target.x - e.x, dy = target.y - e.y; let dist = Math.hypot(dx, dy);
                            if (dist < 2) { if (e.wait > 0) e.wait--; else { e.pt = (e.pt + 1) % e.path.length; e.wait = 60; } } 
                            else { 
                                e.dir = Math.atan2(dy, dx); 
                                moveX = Math.cos(e.dir) * e.spd; moveY = Math.sin(e.dir) * e.spd; 
                            }
                        }
                    }

                    let er = e.type === 'dog' ? 4 : 8;
                    e.x += moveX;
                    let hitX = false;
                    for (let w of activeWalls) { if (e.x + er > w.x && e.x - er < w.x + w.w && e.y + er > w.y && e.y - er < w.y + w.h) { hitX = true; break; } }
                    if (hitX) { e.x -= moveX; if(e.inv) e.inv.tmr = 0; }
                    
                    e.y += moveY;
                    let hitY = false;
                    for (let w of activeWalls) { if (e.x + er > w.x && e.x - er < w.x + w.w && e.y + er > w.y && e.y - er < w.y + w.h) { hitY = true; break; } }
                    if (hitY) { e.y -= moveY; if(e.inv) e.inv.tmr = 0; }
                }

                if (!this.p.box && !inLocker) {
                    let pdx = this.p.x - e.x, pdy = this.p.y - e.y;
                    let sightRadius = e.type === 'dog' ? 50 : (e.type === 'boss' ? 220 : (e.type === 'sniper' ? 300 : 90)); 
                    let fov = e.type === 'boss' ? 1.309 : (e.type === 'sniper' ? 0.2 : 0.6); // ★ ボスFOV=150°(half=75°=1.309rad)
                    if (Math.hypot(pdx, pdy) < sightRadius) {
                        let angleDiff = Math.abs(Math.atan2(pdy, pdx) - e.dir);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (angleDiff < fov) { 
                            let hidden = false;
                            for (let w of activeWalls) { if (this.lineHitRect(e.x, e.y, this.p.x, this.p.y, w)) { hidden = true; break; } }
                            if (!hidden) { spotted = true; break; }
                        }
                    }
                }
            }
        }

        if (spotted) {
            this.st = 'gameover'; this.tmr = 0; this.gameOverCur = 0;
            CommSys.speak('司令官ノイズ', '捕らえろォォ！！');
            playSE('hit'); shakeCam(15);
            this.texts.push({ x: this.p.x, y: this.p.y, text: 'SPOTTED!!', col: '#f00', life: 120, maxLife: 120, size: 70, rot: 0, screenCenter: true });
            return; 
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
        
        if (this.escapeTimer > 0 && this.tmr % 60 < 30) { ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; ctx.fillRect(0, 0, 200, 300); }
        
        if (this.st === 'title') {
            ctx.strokeStyle = '#0ff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.2;
            for(let i=0; i<200; i+=10) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(100,300); ctx.stroke(); }
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = '#f80'; ctx.font = 'bold 26px "Arial Black", sans-serif'; ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
            ctx.fillText('NOISE', 55, 80); ctx.fillText('AGENT', 55, 110); ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('- 爆音スニーキング -', 45, 140);
            
            ctx.fillStyle = this.menuCur === 0 ? '#0f0' : '#888'; ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'NEW GAME', 60, 180);
            ctx.fillStyle = this.menuCur === 1 ? '#0f0' : '#888'; 
            let contText = this.maxLevel > 0 ? `CONTINUE (LV${this.maxLevel + 1})` : 'CONTINUE';
            if (this.maxLevel === 0) ctx.fillStyle = '#444'; 
            ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + contText, 60, 200);
            ctx.fillStyle = this.menuCur === 2 ? '#0f0' : '#888'; ctx.fillText((this.menuCur === 2 ? '> ' : '  ') + 'DATABASE', 60, 220);
            
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
            return;
        }

        if (this.st.startsWith('db_')) {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【 DATABASE 】', 45, 30);
            if (this.st === 'db_cat') {
                for(let i=0; i<DB.length; i++) {
                    ctx.fillStyle = this.dbCat === i ? '#ff0' : '#aaa';
                    ctx.fillText((this.dbCat === i ? '> ' : '  ') + DB[i].cat, 40, 80 + i * 30);
                }
            } else if (this.st === 'db_list') {
                ctx.fillStyle = '#0ff'; ctx.font = '10px monospace'; ctx.fillText(`< ${DB[this.dbCat].cat} >`, 10, 50);
                let items = DB[this.dbCat].items;
                for(let i=0; i<items.length; i++) {
                    ctx.fillStyle = this.dbItem === i ? '#ff0' : '#aaa';
                    ctx.fillText((this.dbItem === i ? '> ' : '  ') + items[i].title, 10, 75 + i * 20);
                }
            } else if (this.st === 'db_detail') {
                let item = DB[this.dbCat].items[this.dbItem];
                ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText(`[ ${item.title} ]`, 10, 60);
                ctx.fillStyle = '#fff'; 
                let textY = 90; let currentLine = '';
                for (let i = 0; i < item.text.length; i++) {
                    currentLine += item.text[i];
                    if (currentLine.length > 18) { ctx.fillText(currentLine, 10, textY); textY += 15; currentLine = ''; }
                }
                ctx.fillText(currentLine, 10, textY);
            }
            ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('A:決定  B:戻る  ↑↓:選択', 25, 280);
            return;
        }

        if (this.st === 'story') {
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            if(!msg) return; 
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
                if (spData) this.drawSpriteData(60, 40, spData, 3.5); 

                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(10, 180, 180, 110);
                ctx.strokeStyle = msg.c === 'マキシマム' ? '#f00' : (msg.c === 'ルナ' ? '#f0f' : (msg.c === 'おやっさん' ? '#ff0' : '#0ff')); 
                ctx.lineWidth = 2; ctx.strokeRect(10, 180, 180, 110);
                ctx.fillStyle = msg.c === 'マキシマム' ? '#f55' : (msg.c === 'ミュート' ? '#aaa' : '#0f0');
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
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
            return;
        }

        // ★ ゲームオーバー画面（コンティニュー）
        if (this.st === 'gameover') {
            if (this.tmr > 60) {
                ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = '#f00'; ctx.font = 'bold 24px monospace'; ctx.fillText('GAME OVER', 100, 100);
                ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
                
                ctx.fillStyle = this.gameOverCur === 0 ? '#0f0' : '#888';
                ctx.font = '12px monospace';
                ctx.fillText((this.gameOverCur === 0 ? '> ' : '  ') + 'RETRY', 70, 160);
                ctx.fillStyle = this.gameOverCur === 1 ? '#0f0' : '#888';
                ctx.fillText((this.gameOverCur === 1 ? '> ' : '  ') + 'GIVE UP', 70, 180);
            }
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
            return;
        }

        ctx.save(); ctx.translate(-this.cam.x, -this.cam.y);
        
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=0; i<=this.mapW; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,this.mapH); ctx.stroke(); }
        for(let i=0; i<=this.mapH; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(this.mapW,i); ctx.stroke(); }

        ctx.fillStyle = '#148';
        for(let l of this.lockers) {
            ctx.fillRect(l.x, l.y, l.w, l.h);
            ctx.strokeStyle = '#0af'; ctx.strokeRect(l.x, l.y, l.w, l.h);
            ctx.fillStyle = '#000'; ctx.fillRect(l.x+5, l.y+5, l.w-10, 5); 
        }

        for(let l of this.lasers) {
            let isOn = (l.tmr % l.maxTmr) > (l.maxTmr / 2);
            ctx.fillStyle = isOn ? `rgba(255, 0, 0, ${0.5 + Math.random()*0.3})` : 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(l.x, l.y, l.w, l.h);
        }

        for (let t of this.terminals) {
            ctx.fillStyle = t.hacked ? '#555' : '#ff0'; ctx.fillRect(t.x - t.r, t.y - t.r, t.r*2, t.r*2);
            ctx.strokeStyle = '#000'; ctx.strokeRect(t.x - t.r, t.y - t.r, t.r*2, t.r*2);
            if (!t.hacked) {
                ctx.fillStyle = '#000'; ctx.fillRect(t.x - t.r, t.y + t.r + 2, t.r*2, 4);
                ctx.fillStyle = '#0f0'; ctx.fillRect(t.x - t.r, t.y + t.r + 2, (t.progress/100)*t.r*2, 4);
                ctx.fillStyle = '#000'; ctx.font = '8px monospace'; ctx.fillText('HOLD A', t.x - 12, t.y + 4);
            }
        }

        ctx.fillStyle = '#555';
        for (let w of this.walls) { ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeStyle = '#000'; ctx.strokeRect(w.x, w.y, w.w, w.h); }
        for (let d of this.doors) {
            if (!d.open) {
                ctx.fillStyle = d.col === 'blue' ? '#00f' : (d.col === 'red' ? '#f00' : '#0a0');
                ctx.globalAlpha = 0.5; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.globalAlpha = 1.0;
                ctx.strokeStyle = '#fff'; ctx.strokeRect(d.x, d.y, d.w, d.h);
            }
        }
        for (let s of this.switches) {
            ctx.fillStyle = s.active ? '#555' : (s.col === 'blue' ? '#00f' : (s.col === 'red' ? '#f00' : '#0a0'));
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke();
        }

        let canGoal = this.terminals.every(t => t.hacked);
        if (this.goal.r > 0) {
            ctx.fillStyle = canGoal ? `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})` : `rgba(255, 0, 0, 0.5)`;
            ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(canGoal ? 'GOAL' : 'LOCK', this.goal.x-12, this.goal.y+3);
        }

        for (let e of this.enemies) {
            let sightRadius = e.type === 'dog' ? 50 : (e.type === 'boss' ? 220 : (e.type === 'sniper' ? 300 : 90));
            let fov = e.type === 'boss' ? 1.309 : (e.type === 'sniper' ? 0.2 : 0.6); // ★ ボスFOV=150°(half=75°=1.309rad)
            ctx.fillStyle = e.type === 'boss' ? 'rgba(255, 0, 255, 0.3)' : (e.type === 'sniper' ? 'rgba(255, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'); 
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.arc(e.x, e.y, sightRadius, e.dir - fov, e.dir + fov); ctx.fill();
            
            ctx.fillStyle = e.type === 'dog' ? '#fa0' : (e.type === 'boss' ? '#f0f' : '#0a0'); 
            ctx.beginPath(); ctx.arc(e.x, e.y, e.type === 'dog' ? 4 : (e.type === 'boss' ? 15 : 6), 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = e.type === 'boss' ? 4 : 2; 
            ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.dir)*(e.type==='boss'?25:10), e.y + Math.sin(e.dir)*(e.type==='boss'?25:10)); ctx.stroke();
            if(e.inv && e.inv.tmr > 0) { ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('?', e.x-5, e.y-15); }
        }

        let inLocker = false;
        for (let l of this.lockers) { if (this.p.x > l.x && this.p.x < l.x+l.w && this.p.y > l.y && this.p.y < l.y+l.h) { inLocker = true; break; } }

        if (this.p.box) {
            let waveY = Math.sin(this.tmr * 0.2) * 2; ctx.fillStyle = `hsl(${(this.tmr * 5) % 360}, 100%, 50%)`;
            ctx.fillRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(this.p.x - 8, this.p.y - 8 + waveY, 16, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(this.p.x - 4, this.p.y - 2 + waveY, 8, 2);
        } else if (!inLocker) {
            // === STEALTH AGENT 8×8 pixel art ===
            // Determine facing direction from last movement
            let facingRight = (Math.cos(this.enemies.length > 0 ? 0 : 0) >= 0); // default right
            // Use velocity direction if moving
            let vx = (keys && keys.right ? 1 : 0) - (keys && keys.left ? 1 : 0);
            if (vx !== 0) facingRight = vx > 0;

            let ax = this.p.x - 4; // anchor: center the 8-wide sprite
            let ay = this.p.y - 6; // anchor: center the 8-tall sprite
            const S = 2; // each dot = 2px
            function dot(col, row, w, h) {
                ctx.fillRect(ax + col * S, ay + row * S, (w||1)*S, (h||1)*S);
            }
            // Black bodysuit (full silhouette)
            ctx.fillStyle = '#111';
            dot(1,0,2,1); // top of head
            dot(0,1,4,1); // head row1
            dot(0,2,4,1); // head row2
            dot(0,3,4,1); // neck+shoulder
            dot(0,4,4,2); // torso
            dot(0,6,2,2); // left leg
            dot(2,6,2,2); // right leg

            // Goggles/visor (white glow)
            ctx.fillStyle = '#fff';
            if (facingRight) {
                dot(1,1,2,1); // left goggle
                dot(3,1,1,1); // right goggle
            } else {
                dot(0,1,1,1); // left goggle (mirrored)
                dot(1,1,2,1); // right goggle
            }

            // Goggle shine (light blue tint)
            ctx.fillStyle = '#9ef';
            if (facingRight) {
                dot(1,1,1,1);
            } else {
                dot(2,1,1,1);
            }

            // Dark edge outline
            ctx.fillStyle = '#000';
            dot(0,0,1,1); dot(3,0,1,1); // head top corners
            dot(4,1,1,1); dot(4,2,1,1); // right side head
            dot(4,3,1,3); // right torso edge
            dot(0,6,1,1); dot(4,6,1,1); // leg tops outer

            // Belt / equipment detail
            ctx.fillStyle = '#333';
            dot(0,5,4,1); // belt line
            ctx.fillStyle = '#555';
            dot(1,5,1,1); // belt buckle highlight

            // Shoe soles
            ctx.fillStyle = '#222';
            dot(0,7,2,1); // left shoe
            dot(2,7,2,1); // right shoe

            // Walk animation shimmer (subtle)
            if (this.tmr % 20 < 10) {
                ctx.fillStyle = 'rgba(0,255,255,0.18)';
                dot(1,4,2,1);
            }
        }

        for (let t of this.texts) {
            if (t.screenCenter) continue;
            let alpha = Math.max(0, Math.min(1, t.life / t.maxLife));
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.globalAlpha = alpha; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.globalAlpha = 1.0; ctx.restore();
        }
        ctx.restore(); 

        for (let t of this.texts) {
            if (!t.screenCenter) continue;
            let alpha = Math.max(0, Math.min(1, t.life / t.maxLife));
            ctx.save(); ctx.translate(100, 150); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.rotate(t.rot); ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.globalAlpha = alpha; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.globalAlpha = 1.0; ctx.restore();
        }

        // ================= 映画風レターボックスUI =================
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
        
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`LV:${this.level + 1} KILLS:${this.stats.kills}`, 5, 16);
        ctx.fillStyle = '#444'; ctx.fillRect(110, 8, 80, 8);
        ctx.fillStyle = this.o2Cd > 0 ? '#f00' : '#0af'; ctx.fillRect(110, 8, 80 * (this.o2/100), 8);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('O2', 95, 15);

        if (this.escapeTimer > 0) { ctx.fillStyle = '#f00'; ctx.font = 'bold 14px monospace'; ctx.fillText(`TIME: ${Math.ceil(this.escapeTimer/60)}`, 130, 35); }

        ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
        if (CommSys.msgLife > 0 && CommSys.msg !== '') {
            if (CommSys.msg.length > 20) { ctx.fillText(CommSys.msg.substring(0, 20), 5, 285); ctx.fillText(CommSys.msg.substring(20), 5, 295); } 
            else { ctx.fillText(CommSys.msg, 5, 290); }
        }

        if (this.st === 'result') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('ALL CLEAR!!', 100, 50);
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
            ctx.fillText(`KILLS : ${this.stats.kills}`, 100, 100); ctx.fillText(`NOISES: ${this.stats.noise}`, 100, 120);
            
            let title = "NORMAL SPY"; let tCol = '#fff';
            if (this.stats.kills === 0) { title = "GHOST (不殺)"; tCol = '#0ff'; }
            else if (this.stats.boxTime > this.stats.time / 2) { title = "BOX LOVER"; tCol = '#ff0'; }
            else if (this.stats.noise > 400) { title = "NOISY NINJA"; tCol = '#f0f'; }
            
            ctx.fillStyle = '#f80'; ctx.fillText('YOUR RANK:', 100, 160);
            ctx.fillStyle = tCol; ctx.font = 'bold 16px monospace'; ctx.fillText(title, 100, 185);
            if (this.tmr > 60) { ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO RETURN', 100, 250); }
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
        }
    }
};
