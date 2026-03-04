// === NOISE AGENT (FINAL: Cinematic Muscle & Extreme Maze Edition) ===

const PAL = { '0':null, '1':'#000', '2':'#fff', '3':'#fca', '4':'#f00', '5':'#0ff', '6':'#0a0', '7':'#fa0', '8':'#444', '9':'#888', 'a':'#05f', 'b':'#940', 'c':'#a0a' };

// 24x24 キャラクタードット絵
const CHAR_SPRITES = {
    'エコー': [ // ハッカー
        "000000000000000000000000","000000000111111000000000","000000011777777110000000","000000177777777771000000",
        "000001777777777777100000","000011777733333377110000","000181777333333337181000","000181111111111111181000",
        "000181111555555111181000","000181111555555111181000","000181773333333377181000","000011773333333377110000",
        "000001773333333377100000","000000113333333311000000","000000001133331100000000","000000016611116610000000",
        "000000166666666661000000","000001666666666666100000","000001666111111666100000","000016661333333166610000",
        "000016661333333166610000","000016661111111166610000","000011110000000011110000","000000000000000000000000"
    ],
    'マキシマム': [ // 脳筋スキンヘッド
        "000000000000000000000000","000000000111110000000000","000000001333331000000000","000000013333333100000000",
        "000000133333333310000000","000000111111111110000000","000000115511155110000000","000000133333333310000000",
        "000000133111113310000000","000000013333333100000000","000000001111111000000000","000000013333333100000000",
        "000000133133313310000000","000001333133313331000000","000001333133313331000000","000013333133313333100000",
        "000013333133313333100000","000013333133313333100000","000011111111111111100000","000000000000000000000000"
    ],
    'ルナ': [ // メカニック少女
        "000000000000000000000000","000000001111111000000000","000000017777777100000000","001100177777777710011000",
        "017711771111111771177100","017771715555555171777100","017771715555555171777100","001771733333333371771000",
        "000110131133311310110000","000000133333333310000000","000000133311133310000000","000000013333333100000000",
        "000000001111111000000000","00000001aa111aa100000000","0000001aaa222aaa10000000","000001aaaa222aaaa1000000",
        "000001aaaa222aaaa1000000","00001aaaaa222aaaaa100000","00001aaaaa111aaaaa100000","00001aaaaa131aaaaa100000",
        "000011111100011111000000","000000000000000000000000"
    ],
    'おやっさん': [ // 伝説のスパイ
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

// ★ アクション映画風シナリオ
const SCENARIOS = [
    [
        { c: 'SYSTEM', t: '世界から「音」を奪う悪の組織『サイレンス』。彼らの野望を阻止すべく、1人の男が極秘基地に潜入した。' },
        { c: 'エコー', t: '作戦開始だ。だが最悪なニュースがある。靴がハッキングされた。' },
        { c: 'エコー', t: '歩くたびに爆音と【超巨大な文字】が出る最悪の靴だ。前見えないだろ？ｗ' },
        { c: 'エコー', t: 'しかも敵の設計者が性格悪くて、ステージ1から【ギチギチの迷路】だ！' },
        { c: 'マキシマム', t: 'ガハハ！迷路など筋肉で壁を破壊して直進すればよい！' },
        { c: 'ルナ', t: '壁は壊せません！Aで暗殺、Bでダンボール。色付きのスイッチを踏んで扉を開け、黄色い【端末】をハックして進んでください！' }
    ],
    [
        { c: '司令官ノイズ', t: '侵入者め...何だあのふざけたデカい文字は！私の静寂な基地を荒らすネズミめ！' },
        { c: 'エコー', t: 'やべぇ！ボスにバレたぞ！ここから警備がレベル2だ。' },
        { c: 'マキシマム', t: '敵が増えただと！？ならばプロテインを飲んで全員なぎ倒せ！！' },
        { c: 'おやっさん', t: '坊主、油断するな。ここからはマップもさらに広大になる。頭を使え。' }
    ],
    [
        { c: '副官ソナー', t: 'フフ…騒がしいネズミね。私の可愛い『サイボーグ猟犬』の餌にしてあげるわ。' },
        { c: 'ルナ', t: '気をつけて！猟犬は移動速度がものすごく速いです！' },
        { c: 'マキシマム', t: '犬だと！？ならば大胸筋で挟んで絞め落とせ！' },
        { c: 'エコー', t: '文字が邪魔で猟犬が見えねぇって？ 気合で躱せ！ｗ' }
    ],
    [
        { c: '司令官ノイズ', t: 'ええい！なぜあんな騒がしい奴を捕まえられんのだ！！' },
        { c: '副官ソナー', t: '申し訳ありません！緑の隔壁を封鎖し、親衛隊を総動員します！' },
        { c: 'ルナ', t: '最終エリアです！3色のパズルと複数の端末が入り乱れる超迷路です！' },
        { c: 'エコー', t: '地獄で会おうぜベイビー！派手にキメてこいミュート！' }
    ],
    [
        { c: 'エコー', t: 'データ奪取成功だ！ミッション・コンプリート！' },
        { c: '司令官ノイズ', t: 'バカな…あんなウルサイ奴に…！アイルビーバック……！ぐはぁっ！' },
        { c: 'マキシマム', t: '筋肉の勝利だな！！ガハハハ！' },
        { c: 'おやっさん', t: 'よくやった坊主。伝説の誕生だな。やかましい伝説だがな。' },
        { c: 'ミュート', t: '……（親指を立てて溶鉱炉に沈む）' },
        { c: 'ルナ', t: '沈まないでください！！早く帰ってきて！' }
    ]
];

// プレイ中のランダム掛け合い
const COMM_CONV = [
    [ {c:'エコー', t:'右見て、左見て、筋肉見ろ！'}, {c:'マキシマム', t:'素晴らしいアドバイスだ！'}, {c:'ルナ', t:'真面目にナビしてください！'} ],
    [ {c:'おやっさん', t:'坊主、足音の文字で前が見えん時は壁を頼れ。'}, {c:'マキシマム', t:'壁は殴って壊すものだ！'} ],
    [ {c:'ルナ', t:'ダンボールのO2ゲージに気をつけて！'}, {c:'エコー', t:'息止めてれば平気だろ？'}, {c:'ルナ', t:'死にますよ！？'} ],
    [ {c:'マキシマム', t:'ミュート！プロテインは足りているか！？'}, {c:'エコー', t:'彼はスパイであってボディビルダーじゃないぞ。'} ],
    [ {c:'副官ソナー', t:'そこら中で文字が光ってて目障りね。'}, {c:'エコー', t:'敵の通信に割り込むな！'} ],
    [ {c:'エコー', t:'おいミュート、今うしろに誰か……'}, {c:'エコー', t:'なーんてな！'} ],
    [ {c:'おやっさん', t:'昔は私もお前のように音を立てていた。'}, {c:'エコー', t:'嘘つけ！'} ],
    [ {c:'マキシマム', t:'ミュート、大胸筋が歩いているぞ！'}, {c:'ルナ', t:'足音の話ですよね？'} ],
    [ {c:'エコー', t:'この文字、フォントサイズデカすぎないか？視界ジャックにも程があるぞｗ'} ],
    [ {c:'マキシマム', t:'ハッキングなど軟弱だ！情報端末を粉砕しろ！'} ],
    [ {c:'司令官ノイズ', t:'館内放送！静かに歩け！'}, {c:'エコー', t:'お前が一番うるせぇよｗ'} ],
    [ {c:'ルナ', t:'ミュートさん、敵の視界は赤いエリアですよ！'}, {c:'マキシマム', t:'赤は闘牛の合図だ！突っ込め！'} ],
    [ {c:'おやっさん', t:'敵の背後に回ってAボタンだ。'}, {c:'エコー', t:'そして虹色に光る！パリピ暗殺！'} ],
    [ {c:'エコー', t:'文字で前が見えない？ 心の眼で見ろってやつだ。'} ]
];

// ★ DATABASE 
const DB = [
    {
        cat: 'キャラクター',
        items: [
            { title: 'ミュート', text: '寡黙なスパイ。呪いの靴のせいで歩くたびに爆音と文字が出る不憫な男。愛用の銃よりプロテインを好む。' },
            { title: 'エコー', text: '相棒の若手ハッカー。B級映画のセリフを引用して煽るのが趣味。ミュートが苦労している状況を楽しんでいる。' },
            { title: 'マキシマム', text: '筋肉で全てを解決しようとする元・伝説のスパイ。暗号解読はキーボードを粉砕して行い、潜入は壁を破壊して行う。' },
            { title: 'ルナ', text: '天才メカニックの少女。ミュートの装備をハッキングから守れず、毎晩徹夜でデバッグしている。' },
            { title: 'おやっさん', text: 'かつて冷戦時代を生き抜いた伝説の男。今は通信室から葉巻を咥えて的確な指示を出す。' },
            { title: '司令官ノイズ', text: '世界から音と娯楽を奪おうとするボズ。静寂を愛するがゆえにミュートの足音に激怒している。' },
            { title: '副官ソナー', text: '冷酷な女幹部。サイボーグ猟犬を操る。文字が大きすぎて彼女も前が見えていない説がある。' }
        ]
    },
    {
        cat: '世界観',
        items: [
            { title: '呪いのステルス靴', text: '歩くたびに「ドスッ」などの巨大文字ホログラムを放出し、使用者の視界を物理的に塞ぐ最悪の装備。アプデで文字がさらに巨大化した。' },
            { title: '虹色ダンボール', text: '被ると敵をやり過ごせるが、密閉性が高く長く被ると酸欠になる。しかも内部はクラブ仕様でパリピな虹色に発光する。' },
            { title: '情報端末', text: 'Aボタン長押しでハッキングできる黄色い端末。これを全てダウンロードしないとゴールへのロックが解除されない。' }
        ]
    },
    {
        cat: '組織',
        items: [
            { title: 'サイレンス', text: '人類から音楽や娯楽を奪い、完全な静寂をもたらそうとする悪の組織。無機質な基地を多数保有する。' },
            { title: 'サイボーグ猟犬', text: 'ソナーが操る機械の犬。視界は狭いが移動速度が異様に速く、音もなく背後から忍び寄る。' }
        ]
    }
];

const Noise = {
    st: 'title', tmr: 0, level: 0, menuCur: 0, dbCat: 0, dbItem: 0,
    scIdx: 0, msgIdx: 0, strToShow: '',
    
    cam: { x: 0, y: 0 }, mapW: 200, mapH: 300,
    
    p: { x: 100, y: 280, r: 6, spd: 3.0, box: false },
    o2: 100, o2Cd: 0, 
    
    texts: [], enemies: [], walls: [], doors: [], switches: [], terminals: [], 
    goal: { x: 100, y: 20, r: 15 },
    stats: { kills: 0, noise: 0, boxTime: 0, time: 0 },
    
    msg: '', msgLife: 0, commTmr: 100, commQueue: [],
    
    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss'); canvas.width = 200; canvas.height = 300;
        this.st = 'title'; this.tmr = 0; this.level = 0; this.menuCur = 0; 
        this.msg = ''; this.msgLife = 0; this.commQueue = [];
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    startStory(sIdx) {
        if(sIdx >= SCENARIOS.length) { 
            this.st = 'result'; this.tmr = 0; 
            if (typeof SaveSys !== 'undefined') SaveSys.addLog('NOISE AGENT', `任務完了！ KILLS:${this.stats.kills} NOISE:${this.stats.noise}`);
            return; 
        }
        this.st = 'story'; this.scIdx = sIdx; this.msgIdx = 0; this.tmr = 0; this.strToShow = '';
    },

    addOuterWalls() {
        this.walls.push(
            {x: 0, y: 0, w: this.mapW, h: 20},  
            {x: 0, y: this.mapH - 20, w: this.mapW, h: 20}, 
            {x: 0, y: 0, w: 20, h: this.mapH},  
            {x: this.mapW - 20, y: 0, w: 20, h: this.mapH} 
        );
    },

    // ★ ステージ1からギチギチの極悪迷路設計
    loadLevel() {
        this.st = 'play'; this.p.box = false; this.o2 = 100; this.o2Cd = 0;
        this.texts = []; this.tmr = 0; this.commTmr = 150; this.commQueue = [];
        this.walls = []; this.doors = []; this.switches = []; this.enemies = []; this.terminals = [];
        
        if (this.level === 0) { // L1: 最初から極悪
            this.mapW = 400; this.mapH = 400; this.p.x = 40; this.p.y = 360;
            this.walls.push( 
                {x:80, y:0, w:20, h:200}, {x:80, y:280, w:20, h:120},
                {x:200, y:100, w:20, h:300}, {x:200, y:100, w:100, h:20}, {x:200, y:260, w:100, h:20}
            );
            this.doors.push( 
                {x:80, y:200, w:20, h:80, col: 'blue', open:false},
                {x:300, y:100, w:100, h:20, col: 'red', open:false} 
            );
            this.switches.push( 
                {x:40, y:40, r:10, col: 'blue', active:false},
                {x:140, y:360, r:10, col: 'red', active:false} 
            );
            this.terminals.push({ x: 250, y: 180, r: 15, progress: 0, hacked: false });
            this.enemies.push( 
                {x:140, y:260, path:[{x:140,y:260},{x:140,y:60}], pt: 0, spd: 1.2, dir: 0, wait: 0, type: 'soldier'},
                {x:300, y:200, path:[{x:300,y:200},{x:300,y:360}], pt: 0, spd: 1.2, dir: 0, wait: 0, type: 'soldier'},
                {x:140, y:50, path:[{x:140,y:50},{x:360,y:50}], pt: 0, spd: 1.2, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 360, y: 50, r: 15 };
        } 
        else if (this.level === 1) { // L2
            this.mapW = 600; this.mapH = 400; this.p.x = 40; this.p.y = 360;
            this.walls.push( {x:150, y:20, w:20, h:200}, {x:150, y:280, w:20, h:100}, {x:300, y:120, w:20, h:260}, {x:170, y:120, w:130, h:20}, {x:450, y:20, w:20, h:200} );
            this.doors.push( {x:150, y:220, w:20, h:60, col: 'blue', open:false}, {x:300, y:20, w:20, h:100, col: 'red', open:false} );
            this.switches.push( {x: 60, y: 60, r:10, col: 'blue', active:false}, {x: 220, y: 360, r:10, col: 'red', active:false} );
            this.terminals.push({ x: 400, y: 200, r: 15, progress: 0, hacked: false });
            this.enemies.push(
                {x:250, y:80, path:[{x:180,y:80},{x:280,y:80}], pt: 0, spd: 1.2, dir: 0, wait: 0, type: 'soldier'},
                {x:400, y:300, path:[{x:340,y:300},{x:560,y:300}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 550, y: 150, r: 15 };
        }
        else if (this.level === 2) { // L3: 犬登場
            this.mapW = 700; this.mapH = 500; this.p.x = 40; this.p.y = 460;
            this.walls.push( {x:200, y:200, w:200, h:150}, {x:20, y:200, w:120, h:20}, {x:460, y:200, w:120, h:20}, {x:580, y:200, w:20, h:280} );
            this.doors.push( {x:140, y:200, w:60, h:20, col: 'blue', open:false}, {x:400, y:200, w:60, h:20, col: 'red', open:false} );
            this.switches.push( {x: 80, y: 100, r:10, col: 'blue', active:false}, {x: 650, y: 450, r:10, col: 'red', active:false} );
            this.terminals.push({ x: 300, y: 400, r: 15, progress: 0, hacked: false }, { x: 650, y: 80, r: 15, progress: 0, hacked: false });

            this.enemies.push(
                {x:300, y:460, path:[{x:40,y:460},{x:560,y:460}], pt: 0, spd: 4.5, dir: 0, wait: 0, type: 'dog'}, 
                {x:300, y:40, path:[{x:560,y:40},{x:40,y:40}], pt: 0, spd: 4.5, dir: 0, wait: 0, type: 'dog'},
                {x:300, y:120, path:[{x:100,y:120},{x:500,y:120}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 300, y: 100, r: 15 };
        }
        else if (this.level === 3) { // L4
            this.mapW = 900; this.mapH = 600; this.p.x = 40; this.p.y = 560;
            this.walls.push( {x:200, y:20, w:20, h:450}, {x:400, y:150, w:20, h:430}, {x:600, y:20, w:20, h:450} );
            this.doors.push( {x:200, y:470, w:20, h:110, col: 'blue', open:false}, {x:400, y:20, w:20, h:130, col: 'red', open:false}, {x:600, y:470, w:20, h:110, col: 'green', open:false} );
            this.switches.push( {x: 100, y: 100, r:10, col: 'blue', active:false}, {x: 300, y: 500, r:10, col: 'red', active:false}, {x: 500, y: 100, r:10, col: 'green', active:false} );
            this.terminals.push( { x: 300, y: 300, r: 15, progress: 0, hacked: false }, { x: 700, y: 500, r: 15, progress: 0, hacked: false }, { x: 800, y: 100, r: 15, progress: 0, hacked: false } );

            this.enemies.push(
                {x:300, y:200, path:[{x:240,y:200},{x:380,y:200}], pt: 0, spd: 1.5, dir: 0, wait: 0, type: 'soldier'},
                {x:500, y:400, path:[{x:440,y:400},{x:580,y:400}], pt: 0, spd: 5.0, dir: 0, wait: 0, type: 'dog'},
                {x:700, y:200, path:[{x:640,y:200},{x:860,y:200}], pt: 0, spd: 2.0, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 850, y: 60, r: 15 };
        }
        else { // L5: 巨大要塞
            this.mapW = 1000; this.mapH = 800; this.p.x = 40; this.p.y = 760;
            this.walls.push( {x:300, y:300, w:400, h:200}, {x:20, y:500, w:200, h:20}, {x:780, y:300, w:200, h:20} );
            this.doors.push( {x:220, y:500, w:80, h:20, col: 'blue', open:false}, {x:700, y:300, w:80, h:20, col: 'red', open:false} );
            this.switches.push( {x: 150, y: 150, r:10, col: 'blue', active:false}, {x: 850, y: 650, r:10, col: 'red', active:false} );
            this.terminals.push( { x: 500, y: 600, r: 15, progress: 0, hacked: false }, { x: 500, y: 200, r: 15, progress: 0, hacked: false } );

            this.enemies.push(
                {x:500, y:760, path:[{x:40,y:760},{x:960,y:760}], pt: 0, spd: 6.0, dir: 0, wait: 0, type: 'dog'},
                {x:500, y:40, path:[{x:960,y:40},{x:40,y:40}], pt: 0, spd: 6.0, dir: 0, wait: 0, type: 'dog'},
                {x:150, y:400, path:[{x:40,y:400},{x:260,y:400}], pt: 0, spd: 2.5, dir: 0, wait: 0, type: 'soldier'},
                {x:850, y:400, path:[{x:740,y:400},{x:960,y:400}], pt: 0, spd: 2.5, dir: 0, wait: 0, type: 'soldier'}
            );
            this.goal = { x: 500, y: 400, r: 20 };
        }

        this.addOuterWalls();
        if (typeof BGM !== 'undefined') BGM.stop();
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
        if (keysDown.select) { switchApp(Menu); return; }
        this.tmr++;

        // ================= TITLE =================
        if (this.st === 'title') {
            if (keysDown.down) { this.menuCur = 1; playSnd('sel'); }
            if (keysDown.up) { this.menuCur = 0; playSnd('sel'); }
            if (keysDown.a) { 
                if (this.menuCur === 0) { this.stats = { kills:0, noise:0, boxTime:0, time:0 }; this.level = 0; playSnd('jmp'); this.startStory(0); } 
                else { this.st = 'db_cat'; this.dbCat = 0; playSnd('sel'); }
            }
            return;
        }

        // ================= DATABASE =================
        if (this.st.startsWith('db_')) {
            if (this.st === 'db_cat') {
                if (keysDown.down) { this.dbCat = (this.dbCat + 1) % DB.length; playSnd('sel'); }
                if (keysDown.up) { this.dbCat = (this.dbCat - 1 + DB.length) % DB.length; playSnd('sel'); }
                if (keysDown.a) { this.st = 'db_list'; this.dbItem = 0; playSnd('sel'); }
                if (keysDown.b) { this.st = 'title'; playSnd('hit'); }
            } else if (this.st === 'db_list') {
                let items = DB[this.dbCat].items;
                if (keysDown.down) { this.dbItem = (this.dbItem + 1) % items.length; playSnd('sel'); }
                if (keysDown.up) { this.dbItem = (this.dbItem - 1 + items.length) % items.length; playSnd('sel'); }
                if (keysDown.a) { this.st = 'db_detail'; playSnd('sel'); }
                if (keysDown.b) { this.st = 'db_cat'; playSnd('hit'); }
            } else if (this.st === 'db_detail') {
                if (keysDown.b) { this.st = 'db_list'; playSnd('hit'); }
            }
            return;
        }

        // ================= STORY =================
        if (this.st === 'story') {
            if (!SCENARIOS[this.scIdx] || !SCENARIOS[this.scIdx][this.msgIdx]) return;
            let msg = SCENARIOS[this.scIdx][this.msgIdx];
            if (this.tmr % 2 === 0 && this.strToShow.length < msg.t.length) {
                this.strToShow += msg.t[this.strToShow.length];
                if (this.strToShow.length % 3 === 0 && typeof playSnd !== 'undefined') playSnd('sel');
            }
            if (keysDown.a) {
                if (this.strToShow.length < msg.t.length) { this.strToShow = msg.t; } 
                else {
                    this.msgIdx++;
                    if (this.msgIdx < SCENARIOS[this.scIdx].length) { 
                        this.strToShow = ''; 
                    } else {
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
        
        // 通信システム
        if (this.commQueue.length > 0) {
            if (this.msgLife <= 0) {
                let n = this.commQueue.shift();
                this.msg = `【${n.c}】${n.t}`; 
                this.msgLife = 120; 
            }
        } else {
            this.commTmr--;
            if (this.commTmr <= 0) {
                let conv = COMM_CONV[Math.floor(Math.random() * COMM_CONV.length)];
                this.commQueue = [...conv]; 
                this.commTmr = 400 + Math.random() * 300;
            }
        }
        if (this.msgLife > 0) this.msgLife--;
        
        this.cam.x = Math.max(0, Math.min(this.mapW - 200, this.p.x - 100));
        this.cam.y = Math.max(0, Math.min(this.mapH - 300, this.p.y - 150));
        
        let currentSpd = this.p.spd;
        if (keys.b && this.o2 > 0 && this.o2Cd <= 0) {
            this.p.box = true; currentSpd *= 0.2; 
            this.o2 -= 0.8; this.stats.boxTime++;
            if (this.o2 <= 0) {
                this.p.box = false; this.o2Cd = 120; 
                this.texts.push({x: this.p.x, y: this.p.y, text: '酸欠!!', col: '#0ff', life: 60, maxLife: 60, size: 30, rot: 0});
                playSnd('hit');
            }
        } else {
            this.p.box = false;
            if (this.o2 < 100) this.o2 += 0.4;
            if (this.o2Cd > 0) this.o2Cd--;
        }

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
                s.active = true; playSnd('sel');
                this.texts.push({ x: s.x, y: s.y, text: 'CLICK!', col: s.col === 'blue' ? '#0ff' : (s.col === 'red' ? '#f00' : '#0f0'), life: 40, maxLife: 40, size: 30, rot: 0 });
                for (let d of this.doors) { if (d.col === s.col) d.open = true; }
            }
        }

        let isHacking = false;
        for (let t of this.terminals) {
            if (!t.hacked && Math.hypot(this.p.x - t.x, this.p.y - t.y) < t.r + this.p.r + 15) {
                if (keys.a && !this.p.box) {
                    t.progress += 1.5; isHacking = true;
                    if (this.tmr % 5 === 0) playSnd('sel');
                    if (t.progress >= 100) {
                        t.hacked = true; playSnd('combo');
                        this.texts.push({ x: t.x, y: t.y - 20, text: 'HACKED!!', col: '#0f0', life: 60, maxLife: 60, size: 40, rot: 0 });
                        this.msg = '【ルナ】データ抽出完了です！'; this.msgLife = 120;
                    }
                }
            }
        }

        if (keysDown.a && !this.p.box && !isHacking) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                let e = this.enemies[i];
                if (Math.hypot(e.x - this.p.x, e.y - this.p.y) < 25) {
                    this.enemies.splice(i, 1); this.stats.kills++;
                    this.texts.push({ x: this.p.x, y: this.p.y - 30, text: 'NICE KILL!!!', col: '#0f0', life: 90, maxLife: 90, size: 60, rot: 0, screenCenter: true });
                    playSnd('combo'); screenShake(10);
                    break;
                }
            }
        }
        
        let noiseInterval = 15;
        if (moved && !this.p.box && this.tmr % noiseInterval === 0) {
            let words = ['ドスッ!', 'バァーン!', 'スサッ', 'ドン!'];
            let cols = ['#f00', '#ff0', '#f0f', '#0ff'];
            let cx = this.cam.x, cy = this.cam.y;
            let tx = this.p.x + (Math.random()-0.5)*80; let ty = this.p.y + (Math.random()-0.5)*80;
            tx = Math.max(cx + 40, Math.min(cx + 160, tx)); ty = Math.max(cy + 60, Math.min(cy + 240, ty));

            // ★ 文字を超巨大化（40〜80px）
            this.texts.push({ x: tx, y: ty, text: words[Math.floor(Math.random()*words.length)], col: cols[Math.floor(Math.random()*cols.length)], life: 60, maxLife: 60, size: 40 + Math.random()*40, rot: (Math.random()-0.5)*0.5 });
            this.stats.noise++;
            playSnd(Math.random() < 0.5 ? 'hit' : 'jmp'); 
        }
        
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i]; t.life--;
            if (!t.screenCenter) t.y -= 0.3; 
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        let canGoal = this.terminals.every(t => t.hacked);
        if (canGoal && Math.hypot(this.p.x - this.goal.x, this.p.y - this.goal.y) < this.goal.r + this.p.r) {
            playSnd('combo'); this.level++; this.startStory(this.level); return;
        }

        for (let e of this.enemies) {
            let target = e.path[e.pt]; let dx = target.x - e.x, dy = target.y - e.y; let dist = Math.hypot(dx, dy);
            if (dist < 2) { if (e.wait > 0) e.wait--; else { e.pt = (e.pt + 1) % e.path.length; e.wait = 60; } } 
            else { e.dir = Math.atan2(dy, dx); e.x += Math.cos(e.dir) * e.spd; e.y += Math.sin(e.dir) * e.spd; }

            if (!this.p.box) {
                let pdx = this.p.x - e.x, pdy = this.p.y - e.y;
                let sightRadius = e.type === 'dog' ? 45 : 75; 
                if (Math.hypot(pdx, pdy) < sightRadius) {
                    let angleDiff = Math.abs(Math.atan2(pdy, pdx) - e.dir);
                    if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                    if (angleDiff < 0.6) { 
                        let hidden = false;
                        for (let w of activeWalls) { if (this.lineHitRect(e.x, e.y, this.p.x, this.p.y, w)) { hidden = true; break; } }
                        if (!hidden) {
                            this.st = 'gameover'; this.tmr = 0;
                            this.msg = '【司令官ノイズ】捕らえろォォ！！'; this.msgLife = 180;
                            playSnd('hit'); screenShake(15);
                            this.texts.push({ x: this.p.x, y: this.p.y, text: 'SPOTTED!!', col: '#f00', life: 120, maxLife: 120, size: 60, rot: 0, screenCenter: true });
                            if (typeof SaveSys !== 'undefined') SaveSys.addLog('NOISE AGENT', `任務失敗… 見つかった。`);
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
            ctx.fillStyle = '#f80'; ctx.font = 'bold 26px "Arial Black", sans-serif'; ctx.shadowBlur = 10; ctx.shadowColor = '#f00';
            ctx.fillText('NOISE', 55, 80); ctx.fillText('AGENT', 55, 110); ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('- 爆音スニーキング -', 45, 140);
            ctx.fillStyle = this.menuCur === 0 ? '#0f0' : '#888'; ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'PLAY MOVIE', 60, 200);
            ctx.fillStyle = this.menuCur === 1 ? '#0f0' : '#888'; ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'DATABASE', 60, 220);
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

        // ================= PLAY & GAMEOVER =================
        ctx.save();
        ctx.translate(-this.cam.x, -this.cam.y);

        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        for(let i=0; i<=this.mapW; i+=20) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,this.mapH); ctx.stroke(); }
        for(let i=0; i<=this.mapH; i+=20) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(this.mapW,i); ctx.stroke(); }

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
        ctx.fillStyle = canGoal ? `rgba(0, 255, 0, ${0.5 + Math.sin(this.tmr*0.1)*0.3})` : `rgba(255, 0, 0, 0.5)`;
        ctx.beginPath(); ctx.arc(this.goal.x, this.goal.y, this.goal.r, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(canGoal ? 'GOAL' : 'LOCK', this.goal.x-12, this.goal.y+3);

        for (let e of this.enemies) {
            let sightRadius = e.type === 'dog' ? 45 : 75;
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

        for (let t of this.texts) {
            if (t.screenCenter) continue;
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.globalAlpha = t.life / t.maxLife; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.globalAlpha = 1.0; ctx.restore();
        }
        
        ctx.restore(); 

        for (let t of this.texts) {
            if (!t.screenCenter) continue;
            ctx.save(); ctx.translate(100, 150); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.rotate(t.rot); ctx.fillStyle = t.col; ctx.font = `900 ${t.size}px "Arial Black", Impact, sans-serif`;
            ctx.strokeStyle = '#000'; ctx.lineWidth = 5; ctx.globalAlpha = t.life / t.maxLife; ctx.strokeText(t.text, 0, 0); ctx.fillText(t.text, 0, 0); ctx.globalAlpha = 1.0; ctx.restore();
        }

        // ================= 映画風レターボックスUI =================
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
        
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`LV:${this.level + 1} KILLS:${this.stats.kills}`, 5, 16);
        ctx.fillStyle = '#444'; ctx.fillRect(110, 8, 80, 8);
        ctx.fillStyle = this.o2Cd > 0 ? '#f00' : '#0af'; ctx.fillRect(110, 8, 80 * (this.o2/100), 8);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('O2', 95, 15);

        ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
        if (this.msgLife > 0 && this.msg !== '') {
            if (this.msg.length > 20) { ctx.fillText(this.msg.substring(0, 20), 5, 285); ctx.fillText(this.msg.substring(20), 5, 295); } 
            else { ctx.fillText(this.msg, 5, 290); }
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
            else if (this.stats.noise > 200) { title = "NOISY NINJA"; tCol = '#f0f'; }
            
            ctx.fillStyle = '#f80'; ctx.fillText('YOUR RANK:', 100, 160);
            ctx.fillStyle = tCol; ctx.font = 'bold 16px monospace'; ctx.fillText(title, 100, 185);
            if (this.tmr > 60) { ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.fillText('PRESS [A] TO RETURN', 100, 250); }
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 25); ctx.fillRect(0, 275, 200, 25);
        }
    }
};
