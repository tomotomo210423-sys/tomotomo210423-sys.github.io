// === MICRO QUEST (マイクロクエスト) — ドラクエ風 3章RPG (旧DUNGEON CRAWL) ===
// 1章:旅立ちの朝 / 2章:砂漠の王国 / 3章:魔王城  酒場で(ランダムな)仲間を集めて魔王を倒せ！

const MQ_TILE = 16, MQ_VW = 12, MQ_VH = 11;

// ---------- 職業 ----------
const MQ_CLS = {
  hero:    { name: '勇者',   base: { hp: 30, mp: 5,  str: 10, vit: 8,  agi: 8,  int: 6 },  grow: { hp: 9,  mp: 3,   str: 3,   vit: 2.5, agi: 2,   int: 2 },   spells: [['heal', 3], ['thunder', 7]], crit: 16, col: '#38f', hair: '#a62' },
  fighter: { name: '戦士',   base: { hp: 38, mp: 0,  str: 13, vit: 11, agi: 6,  int: 2 },  grow: { hp: 11, mp: 0.3, str: 3.8, vit: 3.2, agi: 1.5, int: 0.5 }, spells: [], crit: 16, col: '#c44', hair: '#643' },
  wizard:  { name: '魔法使い', base: { hp: 22, mp: 10, str: 6,  vit: 5,  agi: 9,  int: 12 }, grow: { hp: 6,  mp: 4.5, str: 1.5, vit: 1.5, agi: 2.2, int: 4 },   spells: [['fire', 1], ['blizzard', 5]], crit: 20, col: '#84c', hair: '#222' },
  priest:  { name: '僧侶',   base: { hp: 26, mp: 9,  str: 8,  vit: 7,  agi: 7,  int: 10 }, grow: { hp: 8,  mp: 4,   str: 2,   vit: 2.2, agi: 1.8, int: 3.2 }, spells: [['heal', 1], ['megaheal', 6]], crit: 20, col: '#eee', hair: '#ca6' },
  monk:    { name: '武闘家', base: { hp: 34, mp: 0,  str: 12, vit: 8,  agi: 13, int: 3 },  grow: { hp: 10, mp: 0.5, str: 3.5, vit: 2.4, agi: 3,   int: 0.5 }, spells: [], crit: 6, col: '#e92', hair: '#c33' }
};
const MQ_RECRUIT_CLS = ['fighter', 'wizard', 'priest', 'monk'];

const MQ_NAMES = ['ガイア', 'ミリア', 'ルカ', 'レオ', 'セリナ', 'ダン', 'ウォルフ', 'ソフィア', 'ロイ', 'カイト', 'アリス', 'ゼノ', 'ミナト', 'リナ', 'ハルト', 'ユナ',
  'ジン', 'エマ', 'ブレイズ', 'ノエル', 'トーマ', 'サラ', 'リク', 'メイ', 'アッシュ', 'フィオナ', 'ゲイル', 'ラナ', 'シド', 'ナナ', 'バルト', 'イリス'];
// 個性(能力補正)
const MQ_TRAITS = [
  { n: '力自慢', k: 'str', m: 1.2 }, { n: 'タフ', k: 'hp', m: 1.25 }, { n: '俊足', k: 'agi', m: 1.25 }, { n: '頭脳派', k: 'int', m: 1.25 },
  { n: '頑丈', k: 'vit', m: 1.2 }, { n: '魔力持ち', k: 'mp', m: 1.3 }, { n: '平凡', k: null, m: 1 }, { n: '不器用', k: 'str', m: 0.85 }
];

const MQ_SPELLS = {
  heal:     { name: 'ヒール',     mp: 3,  tg: 'ally',     pow: c => 30 + c.int * 1.2 },
  megaheal: { name: 'ベホイミ',   mp: 8,  tg: 'ally',     pow: c => 70 + c.int * 2.5 },
  fire:     { name: 'ファイア',   mp: 4,  tg: 'enemy',    pow: c => 14 + c.int * 1.3 },
  blizzard: { name: 'ブリザド',   mp: 8,  tg: 'allEnemy', pow: c => 10 + c.int * 0.9 },
  thunder:  { name: 'ライデイン', mp: 10, tg: 'enemy',    pow: c => 24 + c.int * 2.2 }
};

const MQ_WEAP = [
  { n: '棍棒', a: 0, p: 0 }, { n: '銅の剣', a: 4, p: 60 }, { n: '鉄の剣', a: 9, p: 180 },
  { n: '鋼の剣', a: 15, p: 400 }, { n: 'ミスリルソード', a: 22, p: 900 }, { n: '宝石の剣', a: 30, p: 1800 }
];
const MQ_ARM = [
  { n: '布の服', d: 0, p: 0 }, { n: '革の鎧', d: 3, p: 50 }, { n: '鎖かたびら', d: 7, p: 150 },
  { n: '鉄の鎧', d: 12, p: 350 }, { n: 'ミスリルメイル', d: 18, p: 800 }, { n: '聖なる鎧', d: 25, p: 1600 }
];
const MQ_ITEMS = {
  herb:  { name: '薬草',       price: 8,  desc: 'HPを30回復' },
  ether: { name: '魔法の聖水', price: 40, desc: 'MPを20回復' }
};

// ---------- 敵 ----------
const MQ_ENEMY = {
  slime:    { n: 'スライム',         hp: 14,  atk: 8,  def: 2,  agi: 5,  exp: 6,   g: 5,   spr: 'slime',    col: '#4af' },
  bat:      { n: 'コウモリ',         hp: 16,  atk: 11, def: 2,  agi: 12, exp: 8,   g: 6,   spr: 'bat',      col: '#a6c' },
  rabbit:   { n: '角ウサギ',         hp: 26,  atk: 14, def: 4,  agi: 9,  exp: 10,  g: 8,   spr: 'beast',    col: '#ddd' },
  goblin:   { n: 'ゴブリン',         hp: 80,  atk: 26, def: 8,  agi: 7,  exp: 16,  g: 11,  spr: 'humanoid', col: '#6a3' },
  skeleton: { n: 'ガイコツ',         hp: 100, atk: 32, def: 10, agi: 8,  exp: 20,  g: 14,  spr: 'skull',    col: '#eee' },
  king_slime: { n: 'スライムキング', hp: 480, atk: 30, def: 8,  agi: 8,  exp: 150, g: 150, spr: 'slime',    col: '#2c8', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'heavy', p: 0.3, n: 'のしかかり' }, { t: 'heal', p: 0.15, n: 'ぷるぷる', amt: 60 }] },
  scorpion: { n: 'サソリ',           hp: 150, atk: 42, def: 16, agi: 11, exp: 34,  g: 22,  spr: 'scorp',    col: '#c83' },
  mummy:    { n: 'ミイラ',           hp: 180, atk: 46, def: 18, agi: 6,  exp: 40,  g: 26,  spr: 'humanoid', col: '#dca' },
  harpy:    { n: 'ハーピー',         hp: 130, atk: 38, def: 14, agi: 16, exp: 38,  g: 24,  spr: 'bat',      col: '#e6a', skills: [{ t: 'fire', p: 0.25, n: '炎の息', pow: 26 }] },
  gargoyle: { n: 'ガーゴイル',       hp: 240, atk: 50, def: 24, agi: 9,  exp: 52,  g: 34,  spr: 'dragon',   col: '#889' },
  sorcerer: { n: '魔道士',           hp: 160, atk: 34, def: 16, agi: 12, exp: 56,  g: 38,  spr: 'ghost',    col: '#a4e', skills: [{ t: 'fire', p: 0.4, n: '火炎の術', pow: 30 }] },
  golem:    { n: '石のゴーレム',     hp: 340, atk: 54, def: 30, agi: 4,  exp: 70,  g: 45,  spr: 'golem',    col: '#aa8' },
  golem_king: { n: 'ゴーレムキング', hp: 1000, atk: 44, def: 34, agi: 7,  exp: 420, g: 400, spr: 'golem',    col: '#ca6', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'quake', p: 0.3, n: '地震', pow: 40 }, { t: 'heavy', p: 0.25, n: '必殺のパンチ' }] },
  orc:      { n: 'オーク',           hp: 400, atk: 70, def: 40, agi: 9,  exp: 96,  g: 60,  spr: 'humanoid', col: '#693' },
  deathknight: { n: 'デスナイト',    hp: 460, atk: 78, def: 44, agi: 12, exp: 130, g: 80,  spr: 'skull',    col: '#66a' },
  wyvern:   { n: 'ワイバーン',       hp: 460, atk: 74, def: 40, agi: 15, exp: 140, g: 84,  spr: 'dragon',   col: '#d63', skills: [{ t: 'fire', p: 0.35, n: '炎のブレス', pow: 45 }] },
  darkpriest: { n: '闇の僧侶',       hp: 400, atk: 60, def: 34, agi: 11, exp: 120, g: 80,  spr: 'ghost',    col: '#c3a', skills: [{ t: 'heal', p: 0.2, n: '闇のヒール', amt: 90 }, { t: 'fire', p: 0.3, n: '暗黒の炎', pow: 45 }] },
  demon:    { n: '悪魔',             hp: 540, atk: 82, def: 46, agi: 13, exp: 170, g: 100, spr: 'demon',    col: '#a33', skills: [{ t: 'double', p: 0.3, n: '連続攻撃' }] },
  demon_lord: { n: '魔王',           hp: 1500, atk: 66, def: 50, agi: 12, exp: 0,   g: 0,   spr: 'demon',    col: '#609', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'fire', p: 0.3, n: '獄炎', pow: 56 }, { t: 'heavy', p: 0.2, n: '闇の剣' }] },
  demon_true: { n: '真の魔王',       hp: 1200, atk: 72, def: 55, agi: 15, exp: 0,   g: 0,   spr: 'demon',    col: '#e22', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'double', p: 0.35, n: '破滅の爪' }, { t: 'fire', p: 0.3, n: '絶望の炎', pow: 65 }] }
};

// 8x8 ドット絵 (1=本体色 2=白)
const MQ_SPR = {
  slime:    ['........', '...11...', '..1111..', '.111111.', '.121121.', '11111111', '11111111', '.111111.'],
  bat:      ['1......1', '11.11.11', '11111111', '.121121.', '..1111..', '...11...', '........', '........'],
  beast:    ['1.....1.', '11...11.', '.1111111', '11111211', '11111111', '.1.11.1.', '.1.11.1.', '........'],
  humanoid: ['..1111..', '.112211.', '.111111.', '..1111..', '.111111.', '11.11.11', '..1..1..', '.11..11.'],
  skull:    ['.111111.', '11111111', '12211221', '11111111', '.111111.', '..1111..', '.1.11.1.', '........'],
  golem:    ['..1111..', '.122221.', '11111111', '11.11.11', '11111111', '11111111', '.11..11.', '111..111'],
  dragon:   ['11....11', '111..111', '.111111.', '11211211', '11111111', '.111111.', '..1111..', '.11..11.'],
  scorp:    ['1......1', '11....11', '.1.11.1.', '..1111..', '.121121.', '..1111..', '...11...', '..1.1...'],
  ghost:    ['..1111..', '.111111.', '12211221', '11111111', '11111111', '11111111', '1.11.11.', '.1.1.1.1'],
  demon:    ['1......1', '11.11.11', '11111111', '12211221', '11111111', '.111111.', '11.11.11', '1..11..1']
};

// ---------- マップ ----------
// 街・フィールド・ダンジョンは共通レイアウトを章ごとに反転して使う。建物の中は専用マップ。
// タイル: . 草 / , 道・床 / # 山 / T 木 / ~ 水 / h 家 / d 扉 / B 壁 / r 絨毯 / V 街 / D 洞窟
//         c カウンター / o テーブル / k 棚 / b ベッド
const MQ_TOWN = [
  'TTTTTTTTTTTTTT',
  'T............T',
  'T.hhhh..hhhh.T',
  'T.hhhh..hhhh.T',
  'T.hdhh..hhdh.T',
  'T.,,,,,,,,,,.T',
  'T.hhhh..hhhh.T',
  'T.hhhh..hhhh.T',
  'T.hdhh..hhdh.T',
  'T.,,,,,,,,,,.T',
  'T............T',
  'TTTTTT..TTTTTT'
];
const MQ_FIELD = [
  '####################',
  '#..T......~~~...T..#',
  '#......T..~~~......#',
  '#.T...........TT...#',
  '#.....~~~..........#',
  '#..T..~~~....##D##.#',
  '#....T.......T.....#',
  '#.......T..........#',
  '#..TT.........T....#',
  '#......~~~.........#',
  '#.T....~~~...T.....#',
  '#..........T.......#',
  '#...T..............#',
  '#...V..........T...#',
  '#..................#',
  '####################'
];
const MQ_DUN = [
  'BBBBBBBBBBBBBB',
  'BBBBBrrrrBBBBB',
  'BBBBBrrrrBBBBB',
  'BBBBBB,,BBBBBB',
  'B,,,,B,,B,,,,B',
  'B,BB,B,,B,BB,B',
  'B,B,,,,,,,,B,B',
  'B,B,BB,,BB,B,B',
  'B,,,B,,,,B,,,B',
  'BBB,B,BB,B,BBB',
  'B,,,,,B,,,,,,B',
  'B,BBBBB,BBBB,B',
  'B,,,,,,,,,,B,B',
  'BBBB,BBBB,,,,B',
  'B,,,,,,,B,BBBB',
  'BBBBBBBBBBBBBB'
];
// 建物の中 (10x8)。出口は下の中央2マス。
const MQ_INT = {
  a: ['BBBBBBBBBB', 'Bkk,,,,kkB', 'B,,c,cc,,B', 'B,,,,,,,,B', 'B,o,,,,o,B', 'B,,,,,,,,B', 'B,o,,,,o,B', 'BBBB,,BBBB'],
  b: ['BBBBBBBBBB', 'Bbb,,,,bbB', 'B,,,,,,,,B', 'B,,c,cc,,B', 'B,,,,,,,,B', 'B,,,,,,,,B', 'B,,,,,,,,B', 'BBBB,,BBBB'],
  c: ['BBBBBBBBBB', 'BkkkkkkkkB', 'B,,,,,,,,B', 'B,,c,cc,,B', 'B,,,,,,,,B', 'B,k,,,,k,B', 'B,,,,,,,,B', 'BBBB,,BBBB'],
  d: ['BBBBBBBBBB', 'Bkk,,,,kkB', 'B,,c,cc,,B', 'B,,,,,,,,B', 'B,,o,,o,,B', 'B,,,,,,,,B', 'B,,,,,,,,B', 'BBBB,,BBBB']
};
const MQ_INT_NAME = { a: '酒場', b: '宿屋', c: '道具屋', d: '長老の家' };
const MQ_SOLID = '#T~hBpcokb';

// 章ごとの設定
const MQ_CH = [
  {
    title: '1章 旅立ちの朝', town: 'ハジメの村', field: '緑の草原', dun: 'スライムの洞窟',
    theme: { grass: '#3a8a3a', path: '#c8a060', rock: '#777', tree: '#1d5e1d', water: '#2a5ad0', roof: '#c33', brick: '#554', floor: '#332', bg: '#001' },
    inn: 10, shopTier: 2,
    fieldEnemies: ['slime', 'slime', 'bat', 'rabbit'], dunEnemies: ['bat', 'rabbit', 'goblin', 'skeleton'], maxGroup: 2,
    boss: { ids: ['king_slime'], pre: ['ぷるぷる…！\nよくぞ ここまで 来たな 勇者よ。', 'この洞窟の水は わたしが いただいた！\nかかってこい！'],
            post: ['スライムキングを 倒した！', '洞窟の水は きれいに 戻った。'] },
    chests: [{ g: 40 }, { item: 'herb', n: 3 }, { g: 60 }, { item: 'ether', n: 1 }],
    elder: ['おお 勇者よ！ よく来てくれた。', '村はずれの洞窟に スライムキングが 住み着いてしまったのじゃ。\nそのせいで 村の水が 汚れておる…', 'まずは 酒場で 仲間を 見つけ\n宿屋で 休んで 旅の 支度を するのじゃ。'],
    elderDone: ['スライムキングを 倒したそうじゃな！\nおぬしこそ 真の勇者じゃ。'],
    npcs: [['村の子供', ['酒場には 強い人たちが 集まってるよ！', '洞窟の中は 真っ暗で 怖いんだ…']],
           ['おばさん', ['薬草は 道具屋で 買えるわよ。\nたくさん 持っていきなさい。']],
           ['旅の人', ['仲間がいれば 戦いも 楽になるぞ。\n最大4人まで パーティを 組めるんだ。\n仲間の「作戦」は オートにも 手動にも できるぞ。']]],
    rumors: ['スライムキングは ものすごく ぷるぷるしてるらしいぜ。', '酒場の顔ぶれは 入るたびに 違うんだ。 いい仲間が 来る日を 待つのも手だぜ。'],
    intro: ['むかし むかし…\nこの世界は 魔王の 闇に 覆われようとしていた。', 'ここは 小さな 村 ハジメ。\n勇者の素質を 持つ あなたは\n村の長老に 呼ばれた。'],
    end: ['しかし これは ほんの 始まりに すぎなかった…', 'スライムキングの 背後には\n魔王軍の影が 見え隠れしていた。']
  },
  {
    title: '2章 砂漠の王国', town: 'サンドラの街', field: '広がる砂漠', dun: '宝石の塔',
    theme: { grass: '#d8b868', path: '#a8844c', rock: '#a77', tree: '#2a7a2a', water: '#2ab0b0', roof: '#38c', brick: '#865', floor: '#432', bg: '#210' },
    inn: 20, shopTier: 4,
    fieldEnemies: ['scorpion', 'mummy', 'harpy', 'scorpion'], dunEnemies: ['gargoyle', 'sorcerer', 'golem', 'harpy'], maxGroup: 3,
    boss: { ids: ['golem_king'], pre: ['ゴゴゴ…！\n王女を 返してほしくば わしを 倒せ！', 'この 宝石の塔は 魔王様の ものだ！'],
            post: ['ゴーレムキングを 倒した！', '捕らわれていた 王女セレナを 救い出した！', '「ありがとう 勇者様…\n魔王は 北の 魔王城に います。\nどうか 世界を お救いください！」'] },
    chests: [{ g: 150 }, { item: 'herb', n: 5 }, { item: 'ether', n: 2 }, { g: 250 }],
    elder: ['ようこそ サンドラへ。 わしは この街の 長老。', '魔王軍が 王女セレナを さらい\n宝石の塔に 閉じ込めたのじゃ。', 'どうか 王女を 救ってくだされ！\n酒場には 新たな 仲間が いるはずじゃ。'],
    elderDone: ['王女様を 救ってくださり ありがとう！\nこの街は あなたのおかげで 平和じゃ。'],
    npcs: [['旅の商人', ['砂漠の モンスターは 強いぞ。\n武器や 防具を 揃えておくんだ。']],
           ['女の子', ['塔の中には ガーゴイルが いるんだって…\n怖いなあ。']],
           ['老人', ['魔法使いの ブリザドは\n敵全体に 効果が あるんじゃよ。']]],
    rumors: ['武闘家は すばやくて 会心の一撃が 出やすいぜ。', '王女様を 助けてくれ！'],
    intro: ['…砂漠の王国 サンドラ。', 'スライムキングを 倒した あなたの 噂は\n遠く 砂漠の街まで 届いていた。', 'そして この街も 魔王軍に 襲われていた…'],
    end: ['魔王は 北の 魔王城に いる。', '最後の 戦いが 近づいていた…']
  },
  {
    title: '3章 魔王城', town: 'ノースエンド', field: '滅びの荒野', dun: '魔王城',
    theme: { grass: '#6a5a6a', path: '#8a7a8a', rock: '#445', tree: '#3a2a3a', water: '#d04010', roof: '#639', brick: '#436', floor: '#223', bg: '#102' },
    inn: 40, shopTier: 5,
    fieldEnemies: ['orc', 'deathknight', 'wyvern', 'orc'], dunEnemies: ['deathknight', 'darkpriest', 'demon', 'wyvern'], maxGroup: 3,
    boss: { ids: ['demon_lord'], pre: ['ようこそ 勇者よ。\nわたしが この世界の 王だ。', '貴様らの 絶望を 見せてもらおう！'],
            post: ['魔王を 倒した…！', 'だが…\n魔王の 体から 黒い 光が あふれ出した！', 'ぐおおお…！\nこれが わたしの 真の姿だ！'],
            second: { ids: ['demon_true'], post: ['真の魔王を 倒した！！'] } },
    chests: [{ g: 500 }, { item: 'ether', n: 4 }, { item: 'herb', n: 8 }, { g: 800 }],
    elder: ['ここが 最後の村 ノースエンド。', 'この先の 魔王城に 魔王が いる。\n生きて 帰れる 保証は ない…', 'だが おぬしたちなら きっと やれるはずじゃ！'],
    elderDone: ['世界は 平和に なった。\nありがとう 勇者よ！'],
    npcs: [['老兵', ['魔王は 二段階に 変身するという…\n最後まで あきらめるな！']],
           ['村の子', ['勇者様 がんばって！']],
           ['魔女', ['宿屋で 休めば 体力も 魔力も 全回復じゃ。\n戦いの前に 必ず 休むのじゃ。']]],
    rumors: ['魔王城は 本当に 危ない 場所だ…', '最後の 仲間を 選ぶなら 今だぜ。'],
    intro: ['最後の村 ノースエンド。', 'ここから先は 魔王城。\n世界の運命は あなたたちに かかっている！'],
    end: []
  }
];

// ---------- オリジナルBGM (手続き型の作曲) ----------
const MQ_MUSIC = {
  scales: { maj: [0, 2, 4, 5, 7, 9, 11], min: [0, 2, 3, 5, 7, 8, 10], dor: [0, 2, 3, 5, 7, 9, 10], phr: [0, 1, 3, 5, 7, 8, 10], hm: [0, 2, 3, 5, 7, 8, 11], lyd: [0, 2, 4, 6, 7, 9, 11] },
  hz: m => 440 * Math.pow(2, (m - 69) / 12),
  rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
  // p: {key,scale,prog[4],spd,dens,oct,arp,bass,noise[8],seed}  → 32ステップ(4小節)
  make(p) {
    const R = this.rng(p.seed), sc = this.scales[p.scale];
    const deg = d => sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
    const motif = []; let last = 0;
    for (let s = 0; s < 8; s++) {
      const strong = s % 4 === 0;
      if (!strong && R() > p.dens) { motif.push(null); continue; }
      let o = strong ? [0, 2, 4][Math.floor(R() * 3)] : last + [-1, 1, 2, -2, 0][Math.floor(R() * 5)];
      o = Math.max(-2, Math.min(9, o)); motif.push(o); last = o;
    }
    motif[0] = 0;
    const t1 = [], t2 = [], t3 = [], n = [];
    for (let bar = 0; bar < 4; bar++) {
      const cd = p.prog[bar];
      const mv = motif.map((o, i) => (o !== null && bar % 2 === 1 && i >= 4 && R() < 0.5) ? o + [-1, 1, 2][Math.floor(R() * 3)] : o);
      if (bar === 3) mv[7] = 0;
      for (let s = 0; s < 8; s++) {
        t1.push(mv[s] === null ? 0 : this.hz(p.key + 12 * p.oct + deg(cd + mv[s])));
        const tones = [0, 2, 4, 2, 0, 2, 4, 2];
        if (p.arp === 'arp') t2.push(this.hz(p.key + 12 * (p.oct - 1) + deg(cd + tones[s])));
        else if (p.arp === 'pad') t2.push(s % 4 === 0 ? this.hz(p.key + 12 * (p.oct - 1) + deg(cd + (s === 0 ? 2 : 4))) : 0);
        else t2.push(s % 2 === 0 ? this.hz(p.key + 12 * (p.oct - 1) + deg(cd + [0, 4, 2, 4][(s / 2) | 0])) : 0);
        let b = 0;
        if (p.bass === 'walk') b = this.hz(p.key + 12 * (p.oct - 2) + deg(cd + [0, 0, 4, 0, 2, 0, 4, 2][s]));
        else if (s === 0) b = this.hz(p.key + 12 * (p.oct - 2) + deg(cd));
        else if (s === 4) b = this.hz(p.key + 12 * (p.oct - 2) + deg(cd + 4));
        t3.push(b);
        n.push(p.noise[s]);
      }
    }
    return { t1, t2, t3, n, spd: p.spd };
  }
};

const MQ_TRACKS = {
  mq_title:  { key: 57, scale: 'maj', prog: [0, 4, 5, 3], spd: 300, dens: 0.55, oct: 1, arp: 'arp', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 11 },
  mq_town0:  { key: 62, scale: 'maj', prog: [0, 3, 4, 0], spd: 250, dens: 0.7, oct: 1, arp: 'arp', bass: 'walk', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 21 },
  mq_town1:  { key: 57, scale: 'hm',  prog: [0, 5, 3, 4], spd: 270, dens: 0.6, oct: 1, arp: 'arp', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 22 },
  mq_town2:  { key: 52, scale: 'dor', prog: [0, 3, 5, 4], spd: 330, dens: 0.45, oct: 1, arp: 'pad', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 23 },
  mq_field0: { key: 55, scale: 'maj', prog: [0, 4, 5, 3], spd: 190, dens: 0.8, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 0, 0, 1, 0, 0, 0], seed: 31 },
  mq_field1: { key: 50, scale: 'dor', prog: [0, 6, 5, 4], spd: 220, dens: 0.75, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 0, 1, 0, 0, 1, 0], seed: 32 },
  mq_field2: { key: 47, scale: 'min', prog: [0, 5, 6, 4], spd: 240, dens: 0.65, oct: 1, arp: 'arp', bass: 'root', noise: [1, 0, 0, 0, 1, 0, 0, 0], seed: 33 },
  mq_dun0:   { key: 48, scale: 'min', prog: [0, 5, 3, 4], spd: 320, dens: 0.55, oct: 1, arp: 'pad', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 1, 0], seed: 41 },
  mq_dun1:   { key: 42, scale: 'phr', prog: [0, 1, 0, 6], spd: 300, dens: 0.45, oct: 1, arp: 'pad', bass: 'root', noise: [0, 0, 1, 0, 0, 0, 1, 0], seed: 42 },
  mq_dun2:   { key: 49, scale: 'hm',  prog: [0, 5, 4, 0], spd: 290, dens: 0.5, oct: 1, arp: 'arp', bass: 'root', noise: [0, 0, 0, 1, 0, 0, 0, 1], seed: 43 },
  mq_battle0: { key: 52, scale: 'min', prog: [0, 5, 6, 4], spd: 150, dens: 0.9, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 0, 1, 0, 1, 0], seed: 51 },
  mq_battle1: { key: 50, scale: 'phr', prog: [0, 1, 5, 4], spd: 145, dens: 0.9, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 1, 1, 0, 1, 0], seed: 52 },
  mq_battle2: { key: 54, scale: 'hm',  prog: [0, 5, 3, 4], spd: 140, dens: 0.92, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 1, 1, 0, 1, 0, 1, 1], seed: 53 },
  mq_boss0:  { key: 45, scale: 'min', prog: [0, 3, 6, 4], spd: 140, dens: 0.88, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 1, 1, 0, 1, 1], seed: 61 },
  mq_boss1:  { key: 43, scale: 'hm',  prog: [0, 6, 5, 4], spd: 135, dens: 0.88, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 1, 1, 0, 1, 1, 1, 0], seed: 62 },
  mq_boss2:  { key: 41, scale: 'phr', prog: [0, 1, 0, 6], spd: 130, dens: 0.9, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 1, 1, 1, 1, 0], seed: 63 },
  mq_boss3:  { key: 40, scale: 'hm',  prog: [0, 1, 5, 4], spd: 120, dens: 0.95, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 1, 1, 1, 1, 0, 1, 1], seed: 64 },
  mq_win:    { key: 60, scale: 'maj', prog: [0, 3, 4, 0], spd: 140, dens: 0.9, oct: 1, arp: 'arp', bass: 'walk', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 71 },
  mq_lose:   { key: 48, scale: 'min', prog: [0, 6, 5, 4], spd: 420, dens: 0.35, oct: 1, arp: 'pad', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 72 },
  mq_end:    { key: 60, scale: 'lyd', prog: [0, 4, 5, 3], spd: 340, dens: 0.6, oct: 1, arp: 'arp', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 81 }
};

function mqRegisterBGM() {
  if (typeof BGM === 'undefined') return;
  BGM.extra = BGM.extra || {};
  if (BGM.extra.mq_title) return;
  for (const k in MQ_TRACKS) BGM.extra[k] = MQ_MUSIC.make(MQ_TRACKS[k]);
}

// ---------- 純粋な計算関数 ----------
const MQ = {
  expFor(L) { return Math.round(4 * Math.pow(L - 1, 2.3)); },
  atk(c) { return c.str + MQ_WEAP[c.wlv].a; },
  def(c) { return Math.floor(c.vit / 2) + MQ_ARM[c.alv].d; },
  phys(atk, def) { return Math.max(1, Math.round((atk - def / 2) * (0.85 + Math.random() * 0.3))); },
  crit(atk) { return Math.max(1, Math.round(atk * (1 + Math.random() * 0.3))); },
  mkChar(name, cls, lv) {
    const B = MQ_CLS[cls].base;
    const c = { name, cls, lv: 1, exp: 0, wlv: 0, alv: 0, auto: false, acc: { hp: 0, mp: 0, str: 0, vit: 0, agi: 0, int: 0 },
      hp: B.hp, mhp: B.hp, mp: B.mp, mmp: B.mp, str: B.str, vit: B.vit, agi: B.agi, int: B.int };
    while (c.lv < (lv || 1)) MQ.levelUp(c);
    c.exp = MQ.expFor(c.lv); c.hp = c.mhp; c.mp = c.mmp;
    return c;
  },
  levelUp(c) {
    const G = MQ_CLS[c.cls].grow;
    c.lv++;
    for (const k of ['hp', 'mp', 'str', 'vit', 'agi', 'int']) {
      c.acc[k] += G[k];
      const g = Math.floor(c.acc[k]); c.acc[k] -= g;
      if (k === 'hp') { c.mhp += g; c.hp += g; }
      else if (k === 'mp') { c.mmp += g; c.mp += g; }
      else c[k] += g;
    }
    return MQ_CLS[c.cls].spells.filter(s => s[1] === c.lv).map(s => MQ_SPELLS[s[0]].name);
  },
  gainExp(c, n) {
    const learned = []; const ups = [];
    c.exp += n;
    while (c.lv < 30 && c.exp >= MQ.expFor(c.lv + 1)) { learned.push(...MQ.levelUp(c)); ups.push(c.lv); }
    return { ups, learned };
  },
  knownSpells(c) { return MQ_CLS[c.cls].spells.filter(s => c.lv >= s[1]).map(s => s[0]); },
  // 酒場の候補を完全ランダムに生成
  genCandidate(avgLv, ch, taken) {
    const pool = MQ_NAMES.filter(n => !taken.includes(n));
    const name = pool[Math.floor(Math.random() * pool.length)] || 'ナナシ';
    const cls = MQ_RECRUIT_CLS[Math.floor(Math.random() * MQ_RECRUIT_CLS.length)];
    const lv = Math.max(1, avgLv + Math.floor(Math.random() * 4) - 2);
    const trait = MQ_TRAITS[Math.floor(Math.random() * MQ_TRAITS.length)];
    return { name, cls, lv, trait, fee: Math.round(10 + lv * lv * 1.5) };
  },
  buildFromCandidate(cd) {
    const c = MQ.mkChar(cd.name, cd.cls, cd.lv);
    const t = cd.trait;
    if (t.k === 'hp') { c.mhp = Math.round(c.mhp * t.m); c.hp = c.mhp; }
    else if (t.k === 'mp') { c.mmp = Math.round(c.mmp * t.m); c.mp = c.mmp; }
    else if (t.k) c[t.k] = Math.round(c[t.k] * t.m);
    c.trait = t.n;
    return c;
  }
};

const DungeonCrawl = {
  st: 'title', tmr: 0, tcur: 0,
  party: [], reserve: [], gold: 0, items: { herb: 3, ether: 0 },
  ch: 0, mapId: 't0', px: 0, py: 0, dir: 1, trail: [],
  flags: {}, opened: {}, steps: 0, sinceEnc: 0, moveCd: 0, cands: null,
  dlg: null, menu: null, b: null, banner: 0, flash: 0, stIdx: 0, endTmr: 0,
  maps: null, hasSave: false,

  // ===================== マップ構築 =====================
  buildMaps() {
    if (this.maps) return;
    const make = (id, rows, events, npcs) => {
      const isI = id[0] === 'i';
      const c = isI ? +id[2] : +id[1];
      const f = isI ? { fx: false, fy: false } : { fx: c === 1, fy: c === 2 };
      let R = rows.slice();
      if (f.fy) R = R.slice().reverse();
      if (f.fx) R = R.map(r => r.split('').reverse().join(''));
      const w = R[0].length, h = R.length;
      const tr = (x, y) => [f.fx ? w - 1 - x : x, f.fy ? h - 1 - y : y];
      const ev = {};
      for (const e of events) { const [x, y] = tr(e.x, e.y); ev[x + ',' + y] = Object.assign({}, e, { x, y }); }
      const nn = (npcs || []).map(n => { const [x, y] = tr(n.x, n.y); return Object.assign({}, n, { x, y }); });
      return { id, rows: R, w, h, ev, npcs: nn, type: id[0], kind: isI ? id[1] : null, ch: c, tr };
    };
    this.maps = {};
    // 街の入口(ドア)の基準座標
    const doors = { a: [3, 4], b: [10, 4], c: [3, 8], d: [10, 8] };
    const labels = { a: '酒', b: '宿', c: '道', d: '長' };
    for (let c = 0; c < 3; c++) {
      const cfg = MQ_CH[c];
      const townEv = [
        { x: 6, y: 11, type: 'warp', to: 'f' + c, tx: 4, ty: 14 }, { x: 7, y: 11, type: 'warp', to: 'f' + c, tx: 4, ty: 14 }
      ];
      for (const k of 'abcd') townEv.push({ x: doors[k][0], y: doors[k][1], type: 'warp', to: 'i' + k + c, tx: 4, ty: 6, label: labels[k] });
      this.maps['t' + c] = make('t' + c, MQ_TOWN, townEv,
        cfg.npcs.map((n, i) => ({ x: [5, 11, 2][i], y: [1, 5, 9][i], name: n[0], lines: n[1], col: ['#fc6', '#f8a', '#8cf'][i] })));
      this.maps['f' + c] = make('f' + c, MQ_FIELD, [
        { x: 4, y: 13, type: 'warp', to: 't' + c, tx: 6, ty: 10 },
        { x: 15, y: 5, type: 'warp', to: 'd' + c, tx: 2, ty: 14 }
      ]);
      const chestPos = [[2, 4], [12, 4], [12, 8], [4, 10]];
      this.maps['d' + c] = make('d' + c, MQ_DUN, [
        { x: 1, y: 14, type: 'warp', to: 'f' + c, tx: 15, ty: 6 },
        ...chestPos.map((p, i) => ({ x: p[0], y: p[1], type: 'chest', item: cfg.chests[i] })),
        { x: 7, y: 2, type: 'boss' }
      ]);
      // 建物の中
      const roles = { a: ['酒場のマスター', 'tavern', 4, 2], b: ['宿屋の主人', 'inn', 4, 3], c: ['道具屋の店主', 'shop', 4, 3], d: ['長老', 'elder', 4, 2] };
      for (const k of 'abcd') {
        const r = roles[k];
        const npcs = [{ x: r[2], y: r[3], name: r[0], role: r[1], col: k === 'd' ? '#ddd' : '#fc6' }];
        if (k === 'a') npcs.push({ x: 7, y: 5, name: '常連客', lines: cfg.rumors, rumor: true, col: '#8cf' });
        this.maps['i' + k + c] = make('i' + k + c, MQ_INT[k], [
          { x: 4, y: 7, type: 'warp', to: 't' + c, tx: doors[k][0], ty: doors[k][1] + 1 },
          { x: 5, y: 7, type: 'warp', to: 't' + c, tx: doors[k][0], ty: doors[k][1] + 1 }
        ], npcs);
      }
    }
  },
  map() { return this.maps[this.mapId]; },

  // ===================== 開始・セーブ =====================
  init() {
    document.getElementById('gameboy').classList.remove('mode-abyss');
    canvas.width = 200; canvas.height = 300;
    this.buildMaps(); mqRegisterBGM();
    this.st = 'title'; this.tmr = 0; this.tcur = 0; this.dlg = null; this.menu = null; this.b = null;
    this.hasSave = !!(SaveSys.data.mq && SaveSys.data.mq.party);
    this.playBGM('mq_title');
  },

  playBGM(name) { if (typeof BGM !== 'undefined') BGM.play(name); },

  newGame() {
    const hero = MQ.mkChar('勇者', 'hero', 1);
    this.party = [hero]; this.reserve = [];
    this.gold = 90; this.items = { herb: 3, ether: 0 };
    this.flags = {}; this.opened = {}; this.cands = null;
    this.startChapter(0);
  },

  startChapter(c) {
    this.ch = c;
    for (const m of this.party.concat(this.reserve)) { m.hp = m.mhp; m.mp = m.mmp; }
    this.goMap('t' + c, 6, 10);
    this.st = 'map';
    this.saveGame();
    this.say([MQ_CH[c].title].concat(MQ_CH[c].intro));
  },

  saveGame() {
    SaveSys.data.mq = {
      ch: this.ch, mapId: this.mapId, px: this.px, py: this.py, gold: this.gold, items: this.items,
      flags: this.flags, opened: this.opened,
      party: JSON.parse(JSON.stringify(this.party)), reserve: JSON.parse(JSON.stringify(this.reserve))
    };
    SaveSys.save();
  },

  loadGame() {
    const s = SaveSys.data.mq;
    this.ch = s.ch; this.gold = s.gold; this.items = s.items; this.flags = s.flags; this.opened = s.opened;
    if (s.roster) { // 旧形式のセーブ
      this.party = s.party.map(i => s.roster[i]); this.reserve = s.roster.filter((c, i) => !s.party.includes(i));
    } else { this.party = s.party; this.reserve = s.reserve || []; }
    for (const c of this.party.concat(this.reserve)) { if (c.cls === 'hero') c.name = '勇者'; if (c.auto === undefined) c.auto = false; }
    this.cands = null;
    this.mapId = s.mapId; this.px = s.px; this.py = s.py;
    if (!this.maps[this.mapId]) { this.mapId = 't' + this.ch; this.px = 6; this.py = 10; }
    this.goMapRaw(this.mapId, this.px, this.py);
    this.st = 'map';
  },

  mapBGM() {
    const t = this.mapId[0], c = this.map().ch;
    this.playBGM(t === 'f' ? 'mq_field' + c : t === 'd' ? 'mq_dun' + c : 'mq_town' + c);
  },

  goMapRaw(id, x, y) {
    this.mapId = id; this.px = x; this.py = y; this.sinceEnc = 0; this.banner = 120;
    this.trail = [{ x, y }, { x, y }, { x, y }, { x, y }];
    this.mapBGM();
  },
  goMap(id, bx, by) {
    const m = this.maps[id]; const [x, y] = m.tr(bx, by);
    this.goMapRaw(id, x, y);
  },

  // ===================== メッセージ・メニュー =====================
  wrap(text) {
    ctx.font = '10px monospace';
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const ch of para) {
        if (ctx.measureText(line + ch).width > 172) { out.push(line); line = ch; } else line += ch;
      }
      out.push(line);
    }
    return out;
  },

  say(pages, cb, opt) {
    opt = opt || {};
    if (typeof pages === 'string') pages = [pages];
    const wrapped = [], fns = [];
    pages.forEach((p, i) => {
      const ls = this.wrap(p);
      for (let k = 0; k < ls.length; k += 5) { wrapped.push(ls.slice(k, k + 5)); fns.push(k === 0 && opt.fns ? opt.fns[i] : null); }
    });
    if (wrapped.length === 0) { if (cb) cb(); return; }
    this.dlg = { pages: wrapped, fns, pi: 0, ci: 0, cb, auto: !!opt.auto, wait: 0, started: false };
  },

  updDlg() {
    const d = this.dlg;
    if (!d.started) { d.started = true; if (d.fns[d.pi]) d.fns[d.pi](); }
    const total = d.pages[d.pi].join('').length;
    if (d.ci < total) { d.ci += 2; if (keysDown.a) d.ci = total; return; }
    d.wait++;
    if (keysDown.a || (d.auto && d.wait > 38)) {
      d.pi++;
      if (d.pi >= d.pages.length) { const cb = d.cb; this.dlg = null; if (cb) cb(); }
      else { d.ci = 0; d.wait = 0; d.started = false; playSnd('sel'); }
    }
  },

  openMenu(title, items, onSel, onBack, cur) {
    this.menu = { title, items, cur: cur || 0, top: 0, onSel, onBack };
  },

  updMenu() {
    const m = this.menu;
    const n = m.items.length;
    if (keysDown.up) { m.cur = (m.cur + n - 1) % n; playSnd('sel'); }
    if (keysDown.down) { m.cur = (m.cur + 1) % n; playSnd('sel'); }
    if (m.cur < m.top) m.top = m.cur;
    if (m.cur > m.top + 4) m.top = m.cur - 4;
    if (keysDown.a) {
      const it = m.items[m.cur];
      if (it.off) { playSnd('hit'); return; }
      playSnd('jmp');
      const cur = m.cur; this.menu = null; m.onSel(it, cur);
    } else if (keysDown.b && m.onBack) {
      playSnd('sel'); this.menu = null; m.onBack();
    }
  },

  memberLabel(c) { return c.name + '  HP' + c.hp + ' MP' + c.mp; },
  partyMenu(title, onSel, onBack, filter) {
    this.openMenu(title, this.party.map(c => ({ l: this.memberLabel(c), v: c, off: filter ? !filter(c) : false })), it => onSel(it.v), onBack);
  },

  // ===================== 更新 =====================
  update() {
    this.tmr++;
    if (this.banner > 0) this.banner--;
    if (this.flash > 0) this.flash--;
    if (this.st === 'title') { this.updTitle(); return; }
    if (keysDown.select && !this.dlg && !this.menu && this.st !== 'battle') { switchApp(Menu); return; }
    if (this.dlg) { this.updDlg(); return; }
    if (this.menu) { this.updMenu(); return; }
    if (this.st === 'map') this.updMap();
    else if (this.st === 'battle') this.updBattle();
    else if (this.st === 'status') this.updStatus();
    else if (this.st === 'ending') { this.endTmr++; if (this.endTmr > 200 && keysDown.a) { this.init(); } }
  },

  updTitle() {
    const n = this.hasSave ? 2 : 1;
    if (keysDown.up || keysDown.down) { this.tcur = (this.tcur + 1) % n; playSnd('sel'); }
    if (keysDown.select) { switchApp(Menu); return; }
    if (keysDown.a) {
      playSnd('jmp');
      if (this.tcur === 0) this.newGame(); else this.loadGame();
    }
  },

  // ---------- マップ ----------
  updMap() {
    if (keysDown.a) { this.openMapMenu(); return; }
    if (this.moveCd > 0) this.moveCd--;
    let dx = 0, dy = 0;
    const pick = (src) => { if (src.up) dy = -1; else if (src.down) dy = 1; else if (src.left) dx = -1; else if (src.right) dx = 1; };
    pick(keysDown);
    if (!dx && !dy && this.moveCd === 0) pick(keys);
    if (dx || dy) {
      this.dir = dy < 0 ? 0 : dy > 0 ? 1 : dx < 0 ? 2 : 3;
      this.moveCd = 7;
      this.tryMove(dx, dy);
    }
  },

  tryMove(dx, dy) {
    const m = this.map();
    const nx = this.px + dx, ny = this.py + dy;
    if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) return;
    if (MQ_SOLID.includes(m.rows[ny][nx])) return;
    const npc = m.npcs.find(n => n.x === nx && n.y === ny);
    if (npc) { this.talkNpc(npc); return; }
    this.trail.unshift({ x: this.px, y: this.py }); if (this.trail.length > 6) this.trail.pop();
    this.px = nx; this.py = ny; this.steps++;
    const ev = m.ev[nx + ',' + ny];
    if (ev && this.handleEvent(ev)) return;
    if (m.type === 'f' || m.type === 'd') {
      this.sinceEnc++;
      if (this.sinceEnc >= 4 && Math.random() < (m.type === 'f' ? 0.09 : 0.12)) this.randomBattle();
    }
  },

  talkNpc(npc) {
    if (npc.role === 'tavern') this.tavernMenu();
    else if (npc.role === 'inn') this.innMenu();
    else if (npc.role === 'shop') this.shopMenu(0);
    else if (npc.role === 'elder') { const cfg = MQ_CH[this.ch]; this.say(this.flags['b' + this.ch] ? cfg.elderDone : cfg.elder); }
    else if (npc.rumor) { this.say(npc.name + '「' + npc.lines[Math.floor(Math.random() * npc.lines.length)] + '」'); }
    else this.say(npc.name + '「' + npc.lines.join('\n') + '」');
  },

  handleEvent(ev) {
    if (ev.type === 'warp') {
      playSnd('sel'); this.flash = 10;
      if (ev.to[0] === 'i' && ev.to[1] === 'a') this.cands = null;   // 酒場の顔ぶれは入るたびに変わる
      this.goMap(ev.to, ev.tx, ev.ty);
      return true;
    }
    if (ev.type === 'chest') {
      const key = this.mapId + ':' + ev.x + ',' + ev.y;
      if (this.opened[key]) return false;
      this.opened[key] = true; playSnd('combo');
      const it = ev.item;
      if (it.g) { this.gold += it.g; this.say(['宝箱を 開けた！', it.g + 'ゴールドを 手に入れた！']); }
      else { this.items[it.item] = (this.items[it.item] || 0) + it.n; this.say(['宝箱を 開けた！', MQ_ITEMS[it.item].name + 'を ' + it.n + '個 手に入れた！']); }
      return true;
    }
    if (ev.type === 'boss') {
      if (this.flags['b' + this.ch]) return false;
      this.startBoss();
      return true;
    }
    return false;
  },

  // ---------- マップメニュー ----------
  openMapMenu(cur) {
    const inTown = this.mapId[0] === 't' || this.mapId[0] === 'i';
    this.openMenu('コマンド', [
      { l: '強さ', v: 'status' }, { l: '呪文', v: 'spell' }, { l: '道具', v: 'item' }, { l: '作戦', v: 'tactics', off: this.party.length < 2 },
      { l: 'セーブ' + (inTown ? '' : '(街のみ)'), v: 'save', off: !inTown }, { l: '閉じる', v: 'close' }
    ], (it) => {
      if (it.v === 'status') { this.st = 'status'; this.stIdx = 0; }
      else if (it.v === 'spell') this.fieldSpell();
      else if (it.v === 'item') this.fieldItem();
      else if (it.v === 'tactics') this.tacticsMenu(() => this.openMapMenu(3), 0);
      else if (it.v === 'save') { this.saveGame(); this.say('冒険の書に 記録した！'); }
    }, () => {}, cur);
  },

  // 仲間の作戦(オート/手動)切り替え
  tacticsMenu(back, cur) {
    const mem = this.party.slice(1);
    this.openMenu('作戦 (Aで切替)', mem.map(c => ({ l: c.name + ' [' + (c.auto ? 'オート' : '手動') + ']', v: c })), (it, i) => {
      it.v.auto = !it.v.auto; playSnd('combo');
      this.tacticsMenu(back, i);
    }, back, cur);
  },

  fieldSpell() {
    const healers = this.party.filter(c => MQ.knownSpells(c).some(s => MQ_SPELLS[s].tg === 'ally'));
    if (!healers.length) { this.say('使える 呪文が ない！'); return; }
    this.openMenu('誰が？', healers.map(c => ({ l: this.memberLabel(c), v: c })), it => {
      const c = it.v;
      const sp = MQ.knownSpells(c).filter(s => MQ_SPELLS[s].tg === 'ally');
      this.openMenu('呪文', sp.map(s => ({ l: MQ_SPELLS[s].name + ' MP' + MQ_SPELLS[s].mp, v: s, off: c.mp < MQ_SPELLS[s].mp })), it2 => {
        const S = MQ_SPELLS[it2.v];
        this.partyMenu('誰に？', t => {
          if (t.hp <= 0) { this.say('生きて いない！'); return; }
          c.mp -= S.mp; const h = Math.min(t.mhp - t.hp, Math.round(S.pow(c)));
          t.hp += h; playSnd('combo');
          this.say(t.name + 'の HPが ' + h + ' 回復した！', () => this.openMapMenu(1));
        }, () => this.fieldSpell());
      }, () => this.fieldSpell());
    }, () => this.openMapMenu(1));
  },

  fieldItem() {
    const list = Object.keys(MQ_ITEMS).filter(k => this.items[k] > 0);
    if (!list.length) { this.say('道具を 持っていない！'); return; }
    this.openMenu('道具', list.map(k => ({ l: MQ_ITEMS[k].name + ' x' + this.items[k], v: k })), it => {
      this.partyMenu('誰に？', t => {
        if (t.hp <= 0) { this.say('生きて いない！'); return; }
        this.useItem(it.v, t, (msg) => this.say(msg, () => this.openMapMenu(2)));
      }, () => this.fieldItem(), c => c.hp > 0);
    }, () => this.openMapMenu(2));
  },

  useItem(k, t, done) {
    this.items[k]--;
    if (k === 'herb') { const h = Math.min(t.mhp - t.hp, 30); t.hp += h; playSnd('combo'); done(t.name + 'の HPが ' + h + ' 回復した！'); }
    else { const h = Math.min(t.mmp - t.mp, 20); t.mp += h; playSnd('combo'); done(t.name + 'の MPが ' + h + ' 回復した！'); }
  },

  // ---------- ステータス画面 ----------
  updStatus() {
    if (keysDown.left) { this.stIdx = (this.stIdx + this.party.length - 1) % this.party.length; playSnd('sel'); }
    if (keysDown.right) { this.stIdx = (this.stIdx + 1) % this.party.length; playSnd('sel'); }
    if (keysDown.b || keysDown.a) { this.st = 'map'; playSnd('sel'); }
  },

  // ---------- 宿屋・酒場・道具屋 ----------
  innMenu() {
    const price = MQ_CH[this.ch].inn * this.party.length;
    this.say('いらっしゃいませ！\n一晩 ' + price + 'ゴールドです。 お泊まりになりますか？', () => {
      this.openMenu('泊まる？ (' + this.gold + 'G)', [{ l: 'はい', v: 1, off: this.gold < price }, { l: 'いいえ', v: 0 }], it => {
        if (!it.v) { this.say('また どうぞ！'); return; }
        this.gold -= price;
        for (const c of this.party.concat(this.reserve)) { c.hp = c.mhp; c.mp = c.mmp; }
        this.flash = 30; playSnd('combo'); this.saveGame();
        this.say(['…… ………', 'おはようございます！\n体力も 魔力も 全回復しました！', '冒険の書に 記録しました。']);
      }, () => {});
    });
  },

  tavernMenu() {
    this.say('いらっしゃい！\nここは 冒険者の 集まる 酒場さ。\n今日は どんな 顔ぶれかな…', () => this.tavernTop(0));
  },
  tavernTop(cur) {
    this.openMenu('酒場 (' + this.gold + 'G)', [
      { l: '仲間を 探す', v: 'hire' }, { l: '仲間と 別れる', v: 'leave', off: this.party.length <= 1 },
      { l: '噂を 聞く', v: 'talk' }, { l: '出る', v: 'exit' }
    ], (it) => {
      if (it.v === 'hire') this.tavernHire();
      else if (it.v === 'leave') this.tavernLeave();
      else if (it.v === 'talk') { const r = MQ_CH[this.ch].rumors; this.say(r[Math.floor(Math.random() * r.length)], () => this.tavernTop(2)); }
    }, () => {}, cur);
  },
  // 候補は入店のたびに完全ランダムで再抽選される
  makeCands() {
    const avg = Math.round(this.party.reduce((s, c) => s + c.lv, 0) / this.party.length);
    const taken = this.party.concat(this.reserve).map(c => c.name);
    const list = [];
    for (let i = 0; i < 3; i++) { const cd = MQ.genCandidate(avg, this.ch, taken.concat(list.map(x => x.name))); list.push(cd); }
    return list;
  },
  tavernHire() {
    if (!this.cands) this.cands = this.makeCands();
    const items = [];
    for (const r of this.reserve) items.push({ l: r.name + ' ' + MQ_CLS[r.cls].name + ' Lv' + r.lv + ' 再会', v: { reserve: r } });
    for (const cd of this.cands) if (!cd.hired) items.push({ l: cd.name + ' ' + MQ_CLS[cd.cls].name + ' Lv' + cd.lv + ' ' + cd.fee + 'G', v: { cd } });
    if (!items.length) { this.say('今は 誰も いないようだ。', () => this.tavernTop(0)); return; }
    this.openMenu('誰を 誘う？', items, it => {
      if (this.party.length >= 4) { this.say('パーティは いっぱいだ！\n誰かと 別れてから 誘おう。', () => this.tavernTop(0)); return; }
      const v = it.v;
      if (v.reserve) {
        this.reserve = this.reserve.filter(c => c !== v.reserve); this.party.push(v.reserve); playSnd('combo');
        this.say([v.reserve.name + 'が 再び 仲間に 加わった！'], () => this.tavernTop(0));
        return;
      }
      const cd = v.cd;
      if (this.gold < cd.fee) { this.say('お金が 足りないな…', () => this.tavernTop(0)); return; }
      const ch = MQ.buildFromCandidate(cd);
      const n = this.party.length;
      ch.wlv = Math.max(0, Math.round(this.party.reduce((s, c) => s + c.wlv, 0) / n) - 1);
      ch.alv = Math.max(0, Math.round(this.party.reduce((s, c) => s + c.alv, 0) / n) - 1);
      this.gold -= cd.fee; cd.hired = true; this.party.push(ch); playSnd('combo');
      this.say([cd.name + '(' + MQ_CLS[cd.cls].name + ' Lv' + cd.lv + ')が 仲間に 加わった！\n個性: ' + cd.trait.n, cd.name + '「よろしく 頼むぜ！」'], () => this.tavernTop(0));
    }, () => this.tavernTop(0));
  },
  tavernLeave() {
    this.openMenu('誰と 別れる？', this.party.slice(1).map(c => ({ l: c.name + ' Lv' + c.lv, v: c })), it => {
      this.party = this.party.filter(c => c !== it.v);
      it.v.auto = false; this.reserve.push(it.v);
      this.say(it.v.name + 'は 酒場に 戻っていった。\n「また 呼んでくれよ！」', () => this.tavernTop(1));
    }, () => this.tavernTop(1));
  },

  shopMenu(cur) {
    const tier = MQ_CH[this.ch].shopTier;
    this.openMenu('道具屋 (' + this.gold + 'G)', [
      { l: MQ_ITEMS.herb.name + ' ' + MQ_ITEMS.herb.price + 'G (' + (this.items.herb || 0) + ')', v: 'herb', off: this.gold < MQ_ITEMS.herb.price },
      { l: MQ_ITEMS.ether.name + ' ' + MQ_ITEMS.ether.price + 'G (' + (this.items.ether || 0) + ')', v: 'ether', off: this.gold < MQ_ITEMS.ether.price },
      { l: '武器を 買う', v: 'weap' }, { l: '防具を 買う', v: 'arm' }, { l: '出る', v: 'exit' }
    ], (it, c) => {
      if (it.v === 'herb' || it.v === 'ether') {
        this.gold -= MQ_ITEMS[it.v].price; this.items[it.v] = (this.items[it.v] || 0) + 1; playSnd('combo');
        this.shopMenu(c);
      } else if (it.v === 'weap' || it.v === 'arm') this.shopEquip(it.v, tier, c);
    }, () => {}, cur);
  },
  shopEquip(kind, tier, back) {
    const T = kind === 'weap' ? MQ_WEAP : MQ_ARM;
    const key = kind === 'weap' ? 'wlv' : 'alv';
    this.openMenu(kind === 'weap' ? '誰の 武器？' : '誰の 防具？', this.party.map(c => {
      const nx = c[key] + 1;
      const can = nx <= tier;
      return { l: c.name + ' ' + T[c[key]].n + (can ? '→' + T[nx].n + ' ' + T[nx].p + 'G' : ' (もう無い)'), v: c, off: !can || this.gold < T[nx].p };
    }), it => {
      const c = it.v; const nx = c[key] + 1;
      this.gold -= T[nx].p; c[key] = nx; playSnd('combo');
      this.say(c.name + 'は ' + T[nx].n + 'を 装備した！', () => this.shopEquip(kind, tier, back));
    }, () => this.shopMenu(kind === 'weap' ? 2 : 3));
  },

  // ===================== 戦闘 =====================
  randomBattle() {
    const cfg = MQ_CH[this.ch];
    const type = this.mapId[0];
    const table = type === 'f' ? cfg.fieldEnemies : cfg.dunEnemies;
    const n = 1 + Math.floor(Math.random() * cfg.maxGroup);
    const first = table[Math.floor(Math.random() * table.length)];
    const ids = [first];
    for (let i = 1; i < n; i++) ids.push(Math.random() < 0.6 ? first : table[Math.floor(Math.random() * table.length)]);
    this.startBattle(ids, null);
  },

  startBoss() {
    const cfg = MQ_CH[this.ch];
    this.say(cfg.boss.pre, () => { this.startBattle(cfg.boss.ids, { stage: 0 }); });
  },

  startBattle(ids, boss) {
    this.st = 'battle'; this.flash = 14; this.menu = null; this.sinceEnc = 0;
    playSnd('hit');
    const count = {};
    ids.forEach(i => count[i] = (count[i] || 0) + 1);
    const seen = {};
    const en = ids.map(id => {
      const d = MQ_ENEMY[id];
      seen[id] = (seen[id] || 0) + 1;
      const label = count[id] > 1 ? d.n + String.fromCharCode(64 + seen[id]) : d.n;
      return { id, d, n: label, hp: d.hp, mhp: d.hp, alive: true, vis: true, fl: 0 };
    });
    this.b = { en, boss, tcur: 0, phase: 'none', cmds: [], actors: [], ai: 0, exec: [], shake: 0 };
    this.playBGM(boss ? (boss.stage === 1 ? 'mq_boss3' : 'mq_boss' + this.ch) : 'mq_battle' + this.ch);
    const names = ids.filter((id, i) => ids.indexOf(id) === i).map(id => MQ_ENEMY[id].n).join('と ');
    this.say(boss ? [names + 'が 立ちはだかった！'] : [names + 'が 現れた！'], () => this.beginTurn(), { auto: true });
  },

  aliveParty() { return this.party.filter(c => c.hp > 0); },
  aliveEn() { return this.b.en.filter(e => e.alive); },

  beginTurn() {
    const b = this.b;
    b.cmds = []; b.actors = this.party.filter(c => c.hp > 0); b.ai = 0;
    this.advance();
  },

  // オートの仲間は自動でコマンドを決め、手動の仲間(と勇者)のときだけメニューを開く
  advance() {
    const b = this.b;
    while (b.ai < b.actors.length && b.actors[b.ai].auto && b.actors[b.ai] !== this.party[0]) {
      b.cmds.push(this.autoCmd(b.actors[b.ai])); b.ai++;
    }
    if (b.ai >= b.actors.length) { this.resolve(); return; }
    this.cmdMenu();
  },

  // オート時の行動AI
  autoCmd(c) {
    const b = this.b; const sp = MQ.knownSpells(c);
    const allies = this.aliveParty(); const en = this.aliveEn();
    const eIdx = e => b.en.indexOf(e);
    const weakest = en.slice().sort((x, y) => x.hp / x.mhp - y.hp / y.mhp)[0];
    const hurt = allies.filter(a => a.hp < a.mhp * 0.5).sort((x, y) => x.hp / x.mhp - y.hp / y.mhp)[0];
    const heals = sp.filter(s => MQ_SPELLS[s].tg === 'ally' && c.mp >= MQ_SPELLS[s].mp);
    if (hurt && heals.length && (c.cls === 'priest' || hurt.hp < hurt.mhp * 0.3)) {
      const s = (hurt.hp < hurt.mhp * 0.35 && heals.includes('megaheal')) ? 'megaheal' : heals[0];
      return { t: 'spell', a: c, s, tg: hurt };
    }
    if (hurt && hurt.hp < hurt.mhp * 0.25 && this.items.herb > 0 && !heals.length) return { t: 'item', a: c, k: 'herb', tg: hurt };
    const bossAlive = en.some(e => e.d.boss);
    if (sp.includes('thunder') && c.mp >= 10 && (bossAlive || en.length === 1)) return { t: 'spell', a: c, s: 'thunder', tg: eIdx(weakest) };
    if (sp.includes('blizzard') && c.mp >= 8 && en.length > 1) return { t: 'spell', a: c, s: 'blizzard' };
    if (sp.includes('fire') && c.mp >= 4) return { t: 'spell', a: c, s: 'fire', tg: eIdx(weakest) };
    return { t: 'atk', a: c, tg: eIdx(weakest) };
  },

  cmdMenu() {
    const b = this.b; const a = b.actors[b.ai];
    b.phase = 'cmd';
    this.openMenu(a.name, [{ l: '戦う', v: 0 }, { l: '呪文', v: 1 }, { l: '道具', v: 2 }, { l: '逃げる', v: 3 }, { l: '作戦', v: 4, off: this.party.length < 2 }], it => {
      if (it.v === 0) this.pickEnemy(t => this.pushCmd({ t: 'atk', a, tg: t }));
      else if (it.v === 1) this.battleSpell(a);
      else if (it.v === 2) this.battleItem(a);
      else if (it.v === 3) { b.cmds = [{ t: 'run', a }]; this.resolve(); }
      else this.tacticsMenu(() => this.advance(), 0);
    }, () => {
      let p = b.ai - 1;
      while (p >= 0 && b.actors[p].auto && b.actors[p] !== this.party[0]) p--;
      if (p >= 0) { b.cmds.length = p; b.ai = p; }
      this.cmdMenu();
    });
    this.menu.top = 0;
  },

  pushCmd(c) {
    const b = this.b;
    b.cmds.push(c); b.ai++; b.phase = 'none';
    this.advance();
  },

  pickEnemy(cb) {
    const b = this.b; const al = this.aliveEn();
    if (al.length === 1) { cb(b.en.indexOf(al[0])); return; }
    b.phase = 'target'; b.tcur = b.en.indexOf(al[0]); b.onTarget = cb;
  },

  battleSpell(a) {
    const sp = MQ.knownSpells(a);
    if (!sp.length) { this.say('使える 呪文が ない！', () => this.cmdMenu(), { auto: true }); return; }
    this.openMenu('呪文', sp.map(s => ({ l: MQ_SPELLS[s].name + ' MP' + MQ_SPELLS[s].mp, v: s, off: a.mp < MQ_SPELLS[s].mp })), it => {
      const S = MQ_SPELLS[it.v];
      if (S.tg === 'enemy') this.pickEnemy(t => this.pushCmd({ t: 'spell', a, s: it.v, tg: t }));
      else if (S.tg === 'allEnemy') this.pushCmd({ t: 'spell', a, s: it.v });
      else this.partyMenu('誰に？', t => this.pushCmd({ t: 'spell', a, s: it.v, tg: t }), () => this.battleSpell(a), c => c.hp > 0);
    }, () => this.cmdMenu());
  },

  battleItem(a) {
    const list = Object.keys(MQ_ITEMS).filter(k => this.items[k] > 0);
    if (!list.length) { this.say('道具を 持っていない！', () => this.cmdMenu(), { auto: true }); return; }
    this.openMenu('道具', list.map(k => ({ l: MQ_ITEMS[k].name + ' x' + this.items[k], v: k })), it => {
      this.partyMenu('誰に？', t => this.pushCmd({ t: 'item', a, k: it.v, tg: t }), () => this.battleItem(a), c => c.hp > 0);
    }, () => this.cmdMenu());
  },

  updBattle() {
    const b = this.b;
    if (b.phase === 'target') {
      const al = this.aliveEn(); const idx = al.map(e => b.en.indexOf(e));
      let p = idx.indexOf(b.tcur); if (p < 0) p = 0;
      if (keysDown.left || keysDown.up) { p = (p + idx.length - 1) % idx.length; playSnd('sel'); }
      if (keysDown.right || keysDown.down) { p = (p + 1) % idx.length; playSnd('sel'); }
      b.tcur = idx[p];
      if (keysDown.a) { playSnd('jmp'); b.phase = 'none'; b.onTarget(b.tcur); }
      else if (keysDown.b) { playSnd('sel'); this.cmdMenu(); }
    }
  },

  resolve() {
    const b = this.b; this.menu = null;
    const list = b.cmds.map(c => Object.assign({}, c, { sp: c.a.agi * (0.8 + Math.random() * 0.4) }));
    if (!(list.length === 1 && list[0].t === 'run')) {
      for (const e of this.aliveEn()) for (let k = 0; k < (e.d.acts || 1); k++) list.push({ t: 'en', e, sp: e.d.agi * (0.8 + Math.random() * 0.4) });
      list.sort((x, y) => y.sp - x.sp);
    }
    b.exec = list; b.phase = 'none';
    this.runNext();
  },

  runNext() {
    const b = this.b;
    if (b.exec.length === 0) { this.beginTurn(); return; }
    const act = b.exec.shift();
    const pages = [], fns = [];
    const P = (t, fn) => { pages.push(t); fns.push(fn || null); };
    const flashE = e => () => { e.fl = 10; b.shake = 6; playSnd('hit'); };
    const hurtP = () => { this.flash = 6; b.shake = 8; playSnd('hit'); };
    let fled = false;
    const killCheck = (e) => { if (e.hp <= 0) { e.hp = 0; e.alive = false; P(e.n + 'を 倒した！', () => { e.vis = false; playSnd('combo'); }); } };
    const dmgParty = (t, d) => {
      t.hp = Math.max(0, t.hp - d);
      P(t.name + 'は ' + d + 'の ダメージを 受けた！', hurtP);
      if (t.hp <= 0) P(t.name + 'は 倒れた！');
    };

    if (act.t === 'en') {
      const e = act.e;
      if (!e.alive || this.aliveParty().length === 0) { this.runNext(); return; }
      let skill = null; const r = Math.random(); let acc = 0;
      for (const s of (e.d.skills || [])) { acc += s.p; if (r < acc) { skill = s; break; } }
      const ps = this.aliveParty();
      const pick = () => ps[Math.floor(Math.random() * ps.length)];
      if (!skill) {
        const t = pick();
        P(e.n + 'の 攻撃！');
        if (Math.random() < 0.05) P('ミス！ ' + t.name + 'は ひらりと 身をかわした！');
        else dmgParty(t, MQ.phys(e.d.atk, MQ.def(t)));
      } else if (skill.t === 'heavy') {
        const t = pick(); P(e.n + 'の ' + skill.n + '！');
        dmgParty(t, MQ.phys(Math.round(e.d.atk * 1.5), MQ.def(t)));
      } else if (skill.t === 'double') {
        P(e.n + 'の ' + skill.n + '！');
        for (let i = 0; i < 2; i++) { const cur = this.aliveParty(); if (!cur.length) break; dmgParty(cur[Math.floor(Math.random() * cur.length)], MQ.phys(e.d.atk, 0)); }
      } else if (skill.t === 'fire' || skill.t === 'quake') {
        P(e.n + 'の ' + skill.n + '！');
        for (const t of ps) dmgParty(t, Math.max(1, Math.round(skill.pow * (0.8 + Math.random() * 0.4))));
      } else if (skill.t === 'heal') {
        P(e.n + 'は ' + skill.n + 'を 唱えた！');
        const h = Math.min(e.mhp - e.hp, skill.amt); e.hp += h; P(e.n + 'の HPが 回復した！');
      }
    } else {
      const a = act.a;
      if (a.hp <= 0) { this.runNext(); return; }
      if (act.t === 'atk') {
        let t = this.b.en[act.tg]; if (!t.alive) t = this.aliveEn()[0];
        if (!t) { this.runNext(); return; }
        P(a.name + 'の 攻撃！');
        const atk = MQ.atk(a);
        if (Math.random() < 1 / MQ_CLS[a.cls].crit) { const d = MQ.crit(atk); P('会心の 一撃！！'); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); }
        else if (Math.random() < 0.04) P('ミス！ ' + t.n + 'は ひらりと 身をかわした！');
        else { const d = MQ.phys(atk, t.d.def); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); }
        killCheck(t);
      } else if (act.t === 'spell') {
        const S = MQ_SPELLS[act.s];
        if (a.mp < S.mp) P(a.name + 'は ' + S.name + 'を 唱えた！\nしかし MPが 足りない！');
        else {
          a.mp -= S.mp; P(a.name + 'は ' + S.name + 'を 唱えた！');
          if (S.tg === 'enemy') {
            let t = this.b.en[act.tg]; if (!t.alive) t = this.aliveEn()[0];
            if (t) { const d = Math.max(1, Math.round(S.pow(a) * (0.9 + Math.random() * 0.2))); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); killCheck(t); }
          } else if (S.tg === 'allEnemy') {
            for (const t of this.aliveEn()) { const d = Math.max(1, Math.round(S.pow(a) * (0.9 + Math.random() * 0.2))); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); killCheck(t); }
          } else {
            const t = act.tg.hp > 0 ? act.tg : a;
            const h = Math.min(t.mhp - t.hp, Math.round(S.pow(a))); t.hp += h; P(t.name + 'の HPが ' + h + ' 回復した！', () => playSnd('combo'));
          }
        }
      } else if (act.t === 'item') {
        if (!(this.items[act.k] > 0)) P(a.name + 'は 道具を 使おうとしたが もう 無い！');
        else {
          const t = act.tg;
          this.items[act.k]--;
          P(a.name + 'は ' + MQ_ITEMS[act.k].name + 'を 使った！');
          if (act.k === 'herb') { const h = Math.min(t.mhp - t.hp, 30); t.hp += h; P(t.name + 'の HPが ' + h + ' 回復した！', () => playSnd('combo')); }
          else { const h = Math.min(t.mmp - t.mp, 20); t.mp += h; P(t.name + 'の MPが ' + h + ' 回復した！', () => playSnd('combo')); }
        }
      } else if (act.t === 'run') {
        P(a.name + 'たちは 逃げ出した！');
        const pa = this.aliveParty().reduce((s, c) => s + c.agi, 0) / Math.max(1, this.aliveParty().length);
        const ea = this.aliveEn().reduce((s, e) => s + e.d.agi, 0) / Math.max(1, this.aliveEn().length);
        if (b.boss) P('しかし 回り込まれてしまった！');
        else if (Math.random() < Math.min(0.9, Math.max(0.25, 0.55 + (pa - ea) * 0.02))) fled = true;
        else P('しかし 回り込まれてしまった！');
      }
    }

    this.say(pages, () => {
      if (fled) { this.endBattle(); return; }
      if (this.aliveEn().length === 0) { this.win(); return; }
      if (this.aliveParty().length === 0) { this.lose(); return; }
      this.runNext();
    }, { auto: true, fns });
  },

  endBattle() {
    this.st = 'map'; this.b = null; this.mapBGM();
  },

  win() {
    const b = this.b;
    let exp = 0, gold = 0;
    for (const e of b.en) { exp += e.d.exp; gold += e.d.g; }
    this.gold += gold;
    const pages = ['敵を やっつけた！', exp + 'の 経験値を 獲得！', gold + 'ゴールドを 手に入れた！'];
    for (const c of this.aliveParty()) {
      const r = MQ.gainExp(c, exp);
      for (const lv of r.ups) pages.push(c.name + 'は レベル' + lv + 'に 上がった！');
      for (const s of r.learned) pages.push(c.name + 'は ' + s + 'を 覚えた！');
    }
    playSnd('combo'); this.playBGM('mq_win');
    this.say(pages, () => {
      const bs = b.boss;
      this.endBattle();
      if (bs) this.afterBoss(bs);
    }, { auto: false });
  },

  afterBoss(bs) {
    const cfg = MQ_CH[this.ch];
    if (cfg.boss.second && bs.stage === 0) {
      this.say(cfg.boss.post, () => this.startBattle(cfg.boss.second.ids, { stage: 1 }));
      return;
    }
    const post = cfg.boss.second ? cfg.boss.second.post : cfg.boss.post;
    this.flags['b' + this.ch] = true;
    if (this.ch < 2) {
      this.say(post.concat(cfg.end), () => { this.flash = 40; this.startChapter(this.ch + 1); });
    } else {
      this.say(post, () => { this.st = 'ending'; this.endTmr = 0; SaveSys.data.mqClear = (SaveSys.data.mqClear || 0) + 1; SaveSys.save(); this.playBGM('mq_end'); });
    }
  },

  lose() {
    this.playBGM('mq_lose');
    this.say(['勇者たちは 全滅した…', '目の前が 真っ暗に なった…'], () => {
      this.gold = Math.floor(this.gold / 2);
      for (const c of this.party.concat(this.reserve)) { c.hp = c.mhp; c.mp = c.mmp; }
      this.endBattle();
      this.goMap('t' + this.ch, 6, 10);
      this.flash = 30;
      this.say('おお 勇者よ 死んでしまうとは 情けない…\nお金の 半分を 失った。\nさあ もう一度 旅立つのじゃ！');
    });
  },

  // ===================== 描画 =====================
  drawWin(x, y, w, h) {
    ctx.fillStyle = '#000a'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#001'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.strokeStyle = '#88f'; ctx.lineWidth = 1; ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
  },

  drawPartyRows(x, y, lh) {
    ctx.font = '9px monospace';
    this.party.forEach((c, i) => {
      const yy = y + i * lh;
      const dead = c.hp <= 0;
      ctx.fillStyle = dead ? '#f44' : '#fff'; ctx.fillText(c.name, x, yy);
      if (c.auto) { ctx.fillStyle = '#0ff'; ctx.fillText('A', x + 41, yy - 3); }
      ctx.fillStyle = '#8cf'; ctx.fillText('Lv' + c.lv, x + 52, yy);
      ctx.fillStyle = dead ? '#f44' : (c.hp < c.mhp * 0.3 ? '#fa0' : '#fff'); ctx.fillText('HP' + c.hp, x + 84, yy);
      ctx.fillStyle = '#6f6'; ctx.fillText('MP' + c.mp, x + 126, yy);
    });
  },

  drawBottom() {
    this.drawWin(2, 184, 196, 114);
    ctx.textAlign = 'left';
    if (this.dlg) {
      const d = this.dlg; const lines = d.pages[d.pi];
      ctx.font = '10px monospace'; ctx.fillStyle = '#fff';
      let left = d.ci;
      lines.forEach((ln, i) => {
        const s = ln.slice(0, Math.max(0, left)); left -= ln.length;
        ctx.fillText(s, 12, 203 + i * 17);
      });
      if (d.ci >= d.pages[d.pi].join('').length && this.tmr % 30 < 18) { ctx.fillStyle = '#ff0'; ctx.fillText('▼', 180, 290); }
    } else if (this.menu) {
      const m = this.menu;
      ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#ff0'; ctx.fillText(m.title, 12, 200);
      ctx.font = '10px monospace';
      for (let i = m.top; i < Math.min(m.items.length, m.top + 5); i++) {
        const y = 217 + (i - m.top) * 16;
        ctx.fillStyle = m.items[i].off ? '#667' : '#fff';
        ctx.fillText((i === m.cur ? '▶' : '　') + m.items[i].l, 12, y);
      }
      if (m.top > 0) { ctx.fillStyle = '#ff0'; ctx.fillText('▲', 182, 217); }
      if (m.top + 5 < m.items.length) { ctx.fillStyle = '#ff0'; ctx.fillText('▼', 182, 290); }
    } else if (this.st === 'battle' && this.b && this.b.phase === 'target') {
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('どの 敵を 狙う？', 12, 203);
      ctx.fillStyle = '#9ab'; ctx.fillText('◀▶:選ぶ A:決定 B:戻る', 12, 290);
    } else {
      this.drawPartyRows(12, 202, 20);
      ctx.fillStyle = '#ff0'; ctx.font = '9px monospace'; ctx.fillText(this.gold + 'G', 150, 290);
      ctx.fillStyle = '#9ab'; ctx.fillText('A:コマンド', 12, 290);
    }
  },

  drawTile(ch, px, py, m, th) {
    const T = MQ_TILE; const f = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); };
    const dun = m.type === 'd', inn = m.type === 'i';
    const c = m.ch;
    if (ch === 'B') {
      if (inn) { f('#7a5a3a', 0, 0, T, T); f('#0003', 0, 15, T, 1); f('#fff2', 0, 0, T, 1); f('#0002', 5, 0, 1, T); f('#0002', 11, 0, 1, T); return; }
      f(th.brick, 0, 0, T, T); f('#0004', 0, 7, T, 1); f('#0004', 7, 0, 1, 7); f('#0004', 3, 8, 1, 8); f('#fff1', 0, 0, T, 1); return;
    }
    if (ch === 'r') { f('#a22', 0, 0, T, T); f('#d55', 0, 0, T, 1); f('#d55', 0, 15, T, 1); return; }
    if (ch === ',') {
      if (inn) { f('#b08850', 0, 0, T, T); f('#0001', 0, 7, T, 1); f('#0001', 7, 0, 1, T); return; }
      f(dun ? th.floor : th.path, 0, 0, T, T); if (dun) f('#fff1', 0, 0, T, 1); return;
    }
    if (inn) {
      f('#b08850', 0, 0, T, T);
      if (ch === 'c') { f('#8a4a1a', 0, 3, T, 11); f('#c8803a', 0, 3, T, 4); f('#0003', 0, 13, T, 1); }
      else if (ch === 'o') { f('#6a3a10', 2, 3, 12, 8); f('#c8803a', 2, 3, 12, 3); f('#4a2a08', 3, 11, 2, 4); f('#4a2a08', 11, 11, 2, 4); }
      else if (ch === 'k') { f('#5a3a18', 0, 0, T, T); f('#c33', 2, 3, 3, 4); f('#38c', 7, 3, 3, 4); f('#3a3', 12, 3, 3, 4); f('#c93', 2, 10, 3, 4); f('#a4c', 7, 10, 3, 4); f('#0004', 0, 8, T, 1); }
      else if (ch === 'b') { f('#eee', 1, 3, 14, 11); f('#c33', 1, 8, 14, 6); f('#fff', 2, 4, 5, 3); f('#0003', 1, 13, 14, 1); }
      return;
    }
    // 草地ベース
    f(th.grass, 0, 0, T, T);
    if (ch === '.') { f('#0002', 3, 4, 2, 1); f('#0002', 10, 11, 2, 1); return; }
    if (ch === '#') {
      f(th.rock, 0, 0, T, T); f('#0003', 0, 10, T, 6); f('#fff3', 5, 2, 6, 3); f('#fff2', 3, 5, 10, 3);
      f('#0003', 0, 15, T, 1); return;
    }
    if (ch === 'T') {
      if (c === 1) { f('#4a7a2a', 7, 2, 2, 12); f('#4a7a2a', 3, 5, 4, 2); f('#4a7a2a', 3, 3, 2, 3); f('#4a7a2a', 9, 7, 4, 2); f('#4a7a2a', 11, 5, 2, 3); }
      else if (c === 2) { f('#5a3a2a', 7, 6, 3, 10); f(th.tree, 2, 1, 12, 7); f('#fff2', 4, 2, 3, 2); }
      else { f('#5a3a18', 7, 8, 3, 8); f(th.tree, 2, 1, 12, 9); f('#0003', 2, 8, 12, 2); }
      return;
    }
    if (ch === '~') { f(th.water, 0, 0, T, T); f('#fff5', 2, 4, 5, 1); f('#fff5', 8, 10, 5, 1); return; }
    if (ch === 'h') { f(th.roof, 0, 0, T, 9); f('#0003', 0, 8, T, 1); f('#ddc', 0, 9, T, 7); f('#48c', 3, 11, 3, 3); f('#48c', 10, 11, 3, 3); return; }
    if (ch === 'd') { f('#ddc', 0, 0, T, T); f('#640', 3, 3, 10, 13); f('#fc0', 10, 10, 2, 2); return; }
    if (ch === 'V') { f(th.roof, 2, 2, 12, 6); f('#ddc', 3, 8, 10, 7); f('#640', 7, 10, 3, 5); return; }
    if (ch === 'D') { f(th.rock, 0, 0, T, T); f('#000', 3, 4, 10, 12); f('#222', 5, 6, 6, 10); return; }
  },

  drawPerson(x, y, body, hair, dir) {
    ctx.fillStyle = '#0003'; ctx.fillRect(x + 3, y + 14, 10, 2);
    ctx.fillStyle = body; ctx.fillRect(x + 3, y + 8, 10, 5);
    ctx.fillStyle = '#333'; ctx.fillRect(x + 4, y + 13, 3, 3); ctx.fillRect(x + 9, y + 13, 3, 3);
    ctx.fillStyle = '#fc9'; ctx.fillRect(x + 4, y + 2, 8, 7);
    ctx.fillStyle = hair; ctx.fillRect(x + 4, y + 1, 8, 3); if (dir === 0) ctx.fillRect(x + 4, y + 1, 8, 6);
    if (dir !== 0) { ctx.fillStyle = '#000'; ctx.fillRect(x + (dir === 2 ? 5 : 6), y + 5, 2, 2); ctx.fillRect(x + (dir === 3 ? 9 : 8), y + 5, 2, 2); }
  },

  drawMap() {
    const m = this.map(); const th = MQ_CH[m.ch].theme;
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, 200, 184);
    const cx = m.w <= MQ_VW ? 0 : Math.max(0, Math.min(m.w - MQ_VW, this.px - 5));
    const cy = m.h <= MQ_VH ? 0 : Math.max(0, Math.min(m.h - MQ_VH, this.py - 5));
    const OX = 4 + (m.w < MQ_VW ? ((MQ_VW - m.w) * MQ_TILE) / 2 : 0), OY = 4 + (m.h < MQ_VH ? ((MQ_VH - m.h) * MQ_TILE) / 2 : 0);
    ctx.save(); ctx.beginPath(); ctx.rect(4, 4, MQ_VW * MQ_TILE, MQ_VH * MQ_TILE); ctx.clip();
    for (let y = 0; y < MQ_VH; y++) for (let x = 0; x < MQ_VW; x++) {
      const mx = cx + x, my = cy + y;
      if (mx >= m.w || my >= m.h) continue;
      const ch = m.rows[my][mx];
      const px = OX + x * MQ_TILE, py = OY + y * MQ_TILE;
      this.drawTile(ch, px, py, m, th);
      const ev = m.ev[mx + ',' + my];
      if (ev && ev.type === 'chest') {
        const op = this.opened[this.mapId + ':' + mx + ',' + my];
        ctx.fillStyle = op ? '#642' : '#a62'; ctx.fillRect(px + 2, py + 5, 12, 9);
        ctx.fillStyle = op ? '#000' : '#fc0'; ctx.fillRect(px + 2, py + 5, 12, 3); ctx.fillStyle = '#fc0'; ctx.fillRect(px + 7, py + 8, 2, 3);
      } else if (ev && ev.type === 'warp' && (m.type === 'd' || m.type === 'i')) {
        ctx.fillStyle = m.type === 'i' ? '#a64' : '#6cf'; ctx.fillRect(px + 1, py + 1, 14, 14);
        if (m.type === 'i') { ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.fillText('出口', px + 8, py + 11); ctx.textAlign = 'left'; }
      } else if (ev && ev.type === 'boss' && !this.flags['b' + this.ch]) {
        ctx.fillStyle = '#f33'; ctx.fillRect(px + 4, py + 2, 8, 12); ctx.fillStyle = '#ff0'; ctx.fillRect(px + 6, py + 5, 4, 3);
      } else if (ev && ev.label) {
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText(ev.label, px + 8, py + 6); ctx.textAlign = 'left';
      }
    }
    for (const n of m.npcs) {
      const x = OX + (n.x - cx) * MQ_TILE, y = OY + (n.y - cy) * MQ_TILE;
      this.drawPerson(x, y, n.col, '#543', 1);
    }
    // 街の外では仲間がついてくる
    if (m.type === 'f' || m.type === 'd') {
      for (let k = this.party.length - 1; k >= 1; k--) {
        const t = this.trail[k - 1] || this.trail[this.trail.length - 1];
        const cl = MQ_CLS[this.party[k].cls];
        this.drawPerson(OX + (t.x - cx) * MQ_TILE, OY + (t.y - cy) * MQ_TILE, cl.col, cl.hair, this.dir);
      }
    }
    this.drawPerson(OX + (this.px - cx) * MQ_TILE, OY + (this.py - cy) * MQ_TILE, MQ_CLS.hero.col, MQ_CLS.hero.hair, this.dir);
    ctx.restore();
    if (this.banner > 0) {
      const name = m.type === 't' ? MQ_CH[m.ch].town : m.type === 'f' ? MQ_CH[m.ch].field : m.type === 'd' ? MQ_CH[m.ch].dun : MQ_INT_NAME[m.kind];
      ctx.globalAlpha = Math.min(1, this.banner / 30);
      ctx.fillStyle = '#000c'; ctx.fillRect(40, 10, 120, 18); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(40, 10, 120, 18);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.fillText(name, 100, 23); ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  },

  drawSprite(id, cx, cy, scale, col, alpha) {
    const rows = MQ_SPR[id]; const w = 8 * scale;
    ctx.globalAlpha = alpha;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const p = rows[y][x]; if (p === '.') continue;
      ctx.fillStyle = p === '2' ? '#fff' : col;
      ctx.fillRect(cx - w / 2 + x * scale, cy - w / 2 + y * scale, scale, scale);
    }
    ctx.globalAlpha = 1;
  },

  drawBattle() {
    const b = this.b; const cfg = MQ_CH[this.ch];
    ctx.fillStyle = cfg.theme.bg; ctx.fillRect(0, 0, 200, 184);
    ctx.fillStyle = cfg.theme.grass; ctx.globalAlpha = 0.35; ctx.fillRect(0, 128, 200, 56); ctx.globalAlpha = 1;
    this.drawWin(2, 2, 196, 12 + this.party.length * 12);
    this.drawPartyRows(10, 20, 12);
    const n = b.en.length;
    const sx = (b.shake > 0) ? (Math.random() - 0.5) * b.shake : 0;
    if (b.shake > 0) b.shake--;
    b.en.forEach((e, i) => {
      if (!e.vis) return;
      const cx = (200 / (n + 1)) * (i + 1) + sx;
      const sc = e.d.scale || 4;
      const bob = Math.sin((this.tmr + i * 9) * 0.1) * 2;
      let col = e.d.col;
      if (e.fl > 0) { e.fl--; col = e.fl % 4 < 2 ? '#fff' : col; }
      this.drawSprite(e.d.spr, cx, 130 + bob - (sc > 4 ? 16 : 0), sc, col, e.alive ? 1 : 0.4);
      ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
      ctx.fillText(e.n, cx, 176);
      if (b.phase === 'target' && b.tcur === i) { ctx.fillStyle = '#ff0'; ctx.fillText('▼', cx, 130 - (sc > 4 ? 56 : 28)); }
      ctx.textAlign = 'left';
    });
  },

  drawStatus() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    this.drawWin(4, 4, 192, 292);
    const c = this.party[this.stIdx];
    ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
    ctx.fillText('◀ ' + c.name + ' ▶', 16, 28);
    ctx.fillStyle = '#8cf'; ctx.font = '10px monospace';
    ctx.fillText(MQ_CLS[c.cls].name + '  Lv' + c.lv + (c.trait ? '  [' + c.trait + ']' : ''), 16, 46);
    const rows = [['HP', c.hp + '/' + c.mhp], ['MP', c.mp + '/' + c.mmp], ['力', c.str], ['守り', c.vit], ['素早さ', c.agi], ['賢さ', c.int],
      ['攻撃力', MQ.atk(c)], ['防御力', MQ.def(c)]];
    ctx.fillStyle = '#fff';
    rows.forEach((r, i) => { ctx.fillText(r[0], 16, 68 + i * 15); ctx.fillText(String(r[1]), 100, 68 + i * 15); });
    ctx.fillText('武器: ' + MQ_WEAP[c.wlv].n, 16, 196);
    ctx.fillText('防具: ' + MQ_ARM[c.alv].n, 16, 212);
    const nxt = MQ.expFor(c.lv + 1);
    ctx.fillStyle = '#6f6'; ctx.fillText('次のレベルまで ' + Math.max(0, nxt - c.exp), 16, 232);
    const sp = MQ.knownSpells(c).map(s => MQ_SPELLS[s].name).join(' ');
    ctx.fillStyle = '#fc6'; ctx.fillText('呪文: ' + (sp || 'なし'), 16, 250);
    ctx.fillStyle = '#0ff'; ctx.fillText(this.stIdx === 0 ? '作戦: 手動' : '作戦: ' + (c.auto ? 'オート' : '手動'), 16, 266);
    ctx.fillStyle = '#9ab'; ctx.font = '9px monospace'; ctx.fillText('◀▶:切り替え  A/B:戻る', 24, 286);
  },

  drawTitle() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(this.tmr * 0.03 + i)); ctx.fillRect((i * 53) % 200, (i * 37) % 170, 1, 1); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#113';
    ctx.fillRect(60, 130, 80, 40); ctx.fillRect(55, 110, 14, 60); ctx.fillRect(131, 110, 14, 60); ctx.fillRect(88, 100, 24, 70);
    ctx.fillStyle = '#c33'; ctx.fillRect(92, 92, 16, 8); ctx.fillStyle = '#ff0'; ctx.fillRect(96, 140, 8, 14);
    ctx.shadowBlur = 14; ctx.shadowColor = '#4af'; ctx.textAlign = 'center';
    ctx.fillStyle = '#fc4'; ctx.font = 'bold 22px monospace'; ctx.fillText('MICRO', 100, 44);
    ctx.fillStyle = '#fff'; ctx.fillText('QUEST', 100, 70);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8cf'; ctx.font = '11px monospace'; ctx.fillText('マイクロクエスト', 100, 88);
    const items = this.hasSave ? ['はじめから', '続きから'] : ['はじめから'];
    ctx.font = 'bold 12px monospace';
    items.forEach((t, i) => { ctx.fillStyle = i === this.tcur ? '#ff0' : '#fff'; ctx.fillText((i === this.tcur ? '▶ ' : '  ') + t, 100, 208 + i * 20); });
    ctx.fillStyle = '#9ab'; ctx.font = '9px monospace';
    ctx.fillText('クリア回数: ' + (SaveSys.data.mqClear || 0), 100, 262);
    ctx.fillText('SELECT:戻る', 100, 284);
    ctx.textAlign = 'left';
  },

  drawEnding() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(this.tmr * 0.04 + i)); ctx.fillRect((i * 47) % 200, (i * 61) % 300, 1, 1); }
    ctx.globalAlpha = 1; ctx.textAlign = 'center';
    const lines = ['世界に 平和が 戻った…', '', '勇者と 仲間たちの', '冒険は ここに 終わる。', '', '── THE END ──', '', 'ご プレイ ありがとう！'];
    const y0 = 320 - this.endTmr * 0.8;
    ctx.font = '11px monospace';
    lines.forEach((l, i) => { const y = Math.max(60 + i * 22, y0 + i * 22); ctx.fillStyle = l.startsWith('──') ? '#fc4' : '#fff'; ctx.fillText(l, 100, y); });
    if (this.endTmr > 200 && this.tmr % 40 < 24) { ctx.fillStyle = '#0f0'; ctx.fillText('[A] タイトルへ', 100, 280); }
    ctx.textAlign = 'left';
  },

  draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = 'left'; ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    if (this.st === 'title') { this.drawTitle(); return; }
    if (this.st === 'ending') { this.drawEnding(); if (this.dlg) this.drawBottom(); return; }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    if (this.st === 'status') { this.drawStatus(); return; }
    if (this.st === 'map') this.drawMap();
    else if (this.st === 'battle') this.drawBattle();
    this.drawBottom();
    if (this.flash > 0) { ctx.fillStyle = '#fff'; ctx.globalAlpha = Math.min(0.8, this.flash / 20); ctx.fillRect(0, 0, 200, 300); ctx.globalAlpha = 1; }
  }
};
