// === MICRO QUEST (マイクロクエスト) — ドラクエ風 3章RPG (旧DUNGEON CRAWL) ===
// 1章:旅立ちの朝 / 2章:さばくの王国 / 3章:まおうじょう  酒場で仲間を集めて魔王を倒せ！

const MQ_TILE = 16, MQ_VW = 12, MQ_VH = 11;

// ---------- 職業 ----------
const MQ_CLS = {
  hero:    { name: 'ゆうしゃ',     base: { hp: 30, mp: 5,  str: 10, vit: 8,  agi: 8,  int: 6 },  grow: { hp: 9,  mp: 3,   str: 3,   vit: 2.5, agi: 2,   int: 2 },   spells: [['heal', 3], ['thunder', 7]], crit: 16 },
  fighter: { name: 'せんし',       base: { hp: 38, mp: 0,  str: 13, vit: 11, agi: 6,  int: 2 },  grow: { hp: 11, mp: 0.3, str: 3.8, vit: 3.2, agi: 1.5, int: 0.5 }, spells: [], crit: 16 },
  wizard:  { name: 'まほうつかい', base: { hp: 22, mp: 10, str: 6,  vit: 5,  agi: 9,  int: 12 }, grow: { hp: 6,  mp: 4.5, str: 1.5, vit: 1.5, agi: 2.2, int: 4 },   spells: [['fire', 1], ['blizzard', 5]], crit: 20 },
  priest:  { name: 'そうりょ',     base: { hp: 26, mp: 9,  str: 8,  vit: 7,  agi: 7,  int: 10 }, grow: { hp: 8,  mp: 4,   str: 2,   vit: 2.2, agi: 1.8, int: 3.2 }, spells: [['heal', 1], ['megaheal', 6]], crit: 20 },
  monk:    { name: 'ぶとうか',     base: { hp: 34, mp: 0,  str: 12, vit: 8,  agi: 13, int: 3 },  grow: { hp: 10, mp: 0.5, str: 3.5, vit: 2.4, agi: 3,   int: 0.5 }, spells: [], crit: 6 }
};

const MQ_SPELLS = {
  heal:     { name: 'ヒール',     mp: 3,  tg: 'ally',     pow: c => 30 + c.int * 1.2 },
  megaheal: { name: 'ベホイミ',   mp: 8,  tg: 'ally',     pow: c => 70 + c.int * 2.5 },
  fire:     { name: 'ファイア',   mp: 4,  tg: 'enemy',    pow: c => 14 + c.int * 1.3 },
  blizzard: { name: 'ブリザド',   mp: 8,  tg: 'allEnemy', pow: c => 10 + c.int * 0.9 },
  thunder:  { name: 'ライデイン', mp: 10, tg: 'enemy',    pow: c => 24 + c.int * 2.2 }
};

const MQ_WEAP = [
  { n: 'こんぼう', a: 0, p: 0 }, { n: 'どうのつるぎ', a: 4, p: 60 }, { n: 'てつのつるぎ', a: 9, p: 180 },
  { n: 'はがねのつるぎ', a: 15, p: 400 }, { n: 'ミスリルソード', a: 22, p: 900 }, { n: 'ほうせきのけん', a: 30, p: 1800 }
];
const MQ_ARM = [
  { n: 'ぬののふく', d: 0, p: 0 }, { n: 'かわのよろい', d: 3, p: 50 }, { n: 'くさりかたびら', d: 7, p: 150 },
  { n: 'てつのよろい', d: 12, p: 350 }, { n: 'ミスリルメイル', d: 18, p: 800 }, { n: 'せいなるよろい', d: 25, p: 1600 }
];
const MQ_ITEMS = {
  herb:  { name: 'やくそう',         price: 8,  desc: 'HPを30かいふく' },
  ether: { name: 'まほうのせいすい', price: 40, desc: 'MPを20かいふく' }
};

// ---------- 敵 ----------
const MQ_ENEMY = {
  slime:    { n: 'スライム',         hp: 14, atk: 8, def: 2, agi: 5, exp: 6, g: 5,   spr: 'slime',    col: '#4af' },
  bat:      { n: 'コウモリ',         hp: 16, atk: 11, def: 2, agi: 12, exp: 8, g: 6,   spr: 'bat',      col: '#a6c' },
  rabbit:   { n: 'ツノウサギ',       hp: 26, atk: 14, def: 4, agi: 9, exp: 10, g: 8,   spr: 'beast',    col: '#ddd' },
  goblin:   { n: 'ゴブリン',         hp: 80, atk: 26, def: 8, agi: 7, exp: 16, g: 11,  spr: 'humanoid', col: '#6a3' },
  skeleton: { n: 'ホネホネ',         hp: 100, atk: 32, def: 10, agi: 8, exp: 20, g: 14,  spr: 'skull',    col: '#eee' },
  king_slime: { n: 'スライムキング', hp: 480, atk: 30, def: 8, agi: 8, exp: 150, g: 150, spr: 'slime',    col: '#2c8', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'heavy', p: 0.3, n: 'のしかかり' }, { t: 'heal', p: 0.15, n: 'ぷるぷる', amt: 60 }] },
  scorpion: { n: 'サソリ',           hp: 150, atk: 42, def: 16, agi: 11, exp: 34, g: 22,  spr: 'scorp',    col: '#c83' },
  mummy:    { n: 'ミイラ',           hp: 180, atk: 46, def: 18, agi: 6, exp: 40, g: 26,  spr: 'humanoid', col: '#dca' },
  harpy:    { n: 'ハーピー',         hp: 130, atk: 38, def: 14, agi: 16, exp: 38, g: 24,  spr: 'bat',      col: '#e6a', skills: [{ t: 'fire', p: 0.25, n: 'かえんのいき', pow: 26 }] },
  gargoyle: { n: 'ガーゴイル',       hp: 240, atk: 50, def: 24, agi: 9, exp: 52, g: 34,  spr: 'dragon',   col: '#889' },
  sorcerer: { n: 'まどうし',         hp: 160, atk: 34, def: 16, agi: 12, exp: 56, g: 38,  spr: 'ghost',    col: '#a4e', skills: [{ t: 'fire', p: 0.4, n: 'メラミ', pow: 30 }] },
  golem:    { n: 'ストーンゴーレム', hp: 340, atk: 54, def: 30, agi: 4, exp: 70, g: 45,  spr: 'golem',    col: '#aa8' },
  golem_king: { n: 'ゴーレムキング', hp: 1000, atk: 44, def: 34, agi: 7, exp: 420, g: 400, spr: 'golem',    col: '#ca6', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'quake', p: 0.3, n: 'じしん', pow: 40 }, { t: 'heavy', p: 0.25, n: 'ひっさつのパンチ' }] },
  orc:      { n: 'オーク',           hp: 400, atk: 70, def: 40, agi: 9, exp: 96, g: 60,  spr: 'humanoid', col: '#693' },
  deathknight: { n: 'デスナイト',    hp: 460, atk: 78, def: 44, agi: 12, exp: 130, g: 80,  spr: 'skull',    col: '#66a' },
  wyvern:   { n: 'ワイバーン',       hp: 460, atk: 74, def: 40, agi: 15, exp: 140, g: 84,  spr: 'dragon',   col: '#d63', skills: [{ t: 'fire', p: 0.35, n: 'ほのおのブレス', pow: 45 }] },
  darkpriest: { n: 'ダークプリースト', hp: 400, atk: 60, def: 34, agi: 11, exp: 120, g: 80, spr: 'ghost',   col: '#c3a', skills: [{ t: 'heal', p: 0.2, n: 'ヒール', amt: 90 }, { t: 'fire', p: 0.3, n: 'ダークフレア', pow: 45 }] },
  demon:    { n: 'あくま',           hp: 540, atk: 82, def: 46, agi: 13, exp: 170, g: 100, spr: 'demon',    col: '#a33', skills: [{ t: 'double', p: 0.3, n: 'れんぞくこうげき' }] },
  demon_lord: { n: 'まおう',         hp: 1500, atk: 66, def: 50, agi: 12, exp: 0, g: 0,   spr: 'demon',    col: '#609', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'fire', p: 0.3, n: 'ごくえんのほのお', pow: 56 }, { t: 'heavy', p: 0.2, n: 'やみのつるぎ' }] },
  demon_true: { n: 'しんの まおう',  hp: 1200, atk: 72, def: 55, agi: 15, exp: 0, g: 0,   spr: 'demon',    col: '#e22', boss: true, scale: 8, acts: 2,
    skills: [{ t: 'double', p: 0.35, n: 'しんえんのつめ' }, { t: 'fire', p: 0.3, n: 'ぜつぼうのほのお', pow: 65 }] }
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

// ---------- マップ (共通の3レイアウト。章ごとに反転して使う) ----------
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
const MQ_SOLID = '#T~hBp';

// 章ごとの設定
const MQ_CH = [
  {
    title: '1章 旅立ちの朝', town: 'ハジメのむら', field: 'みどりの草原', dun: 'スライムの洞くつ',
    theme: { grass: '#3a8a3a', path: '#c8a060', rock: '#777', tree: '#1d5e1d', water: '#2a5ad0', roof: '#c33', brick: '#554', floor: '#332', bg: '#001' },
    inn: 10, shopTier: 2,
    fieldEnemies: ['slime', 'slime', 'bat', 'rabbit'], dunEnemies: ['bat', 'rabbit', 'goblin', 'skeleton'], maxGroup: 2,
    recruits: [{ id: 'gaia', name: 'ガイア', cls: 'fighter', fee: 40 }, { id: 'miria', name: 'ミリア', cls: 'wizard', fee: 40 }, { id: 'luka', name: 'ルカ', cls: 'priest', fee: 40 }],
    boss: { ids: ['king_slime'], pre: ['ぷるぷる…！\nよくぞ ここまで きたな ゆうしゃよ。', 'このどうくつの みずは わたしが いただいた！\nかかってこい！'],
            post: ['スライムキングを たおした！', 'どうくつの みずは きれいに もどった。'] },
    chests: [{ g: 40 }, { item: 'herb', n: 3 }, { g: 60 }, { item: 'ether', n: 1 }],
    elder: ['おお ゆうしゃよ！ よくぞ きてくれた。', 'むらの ほこらの どうくつに スライムキングが すみついてしまったのじゃ。\nそのせいで むらの みずが よごれておる…', 'まずは さかばで なかまを みつけ\nやどやで やすんで たびの したくを するのじゃ。'],
    elderDone: ['スライムキングを たおしたそうじゃな！\nおぬしこそ まことの ゆうしゃじゃ。'],
    npcs: [['むらの こども', ['さかばには つよい ひとたちが あつまってるよ！', 'どうくつの なかは まっくらで こわいんだ…']],
           ['おばさん', ['やくそうは どうぐやで かえるわよ。\nたくさん もっていきなさい。']],
           ['たびのひと', ['なかまが いれば センとうも らくになるぞ。\nさいだい 4にんまで パーティを くめるんだ。']]],
    rumors: ['スライムキングは ものすごく ぷるぷるしてるらしいぜ。', 'ここの なかまは みんな じつりょくしゃ ぞろいだ。'],
    intro: ['むかし むかし…\nこの せかいは まおうの やみに おおわれようとしていた。', 'ここは ちいさな むら ハジメ。\nゆうしゃの そしつを もつ あなたは\nむらの ちょうろうに よばれた。'],
    end: ['しかし これは ほんの はじまりに すぎなかった…', 'スライムキングの うしろには\nまおうぐんの かげが みえかくれしていた。']
  },
  {
    title: '2章 さばくの王国', town: 'サンドラのまち', field: 'ひろがる さばく', dun: 'ほうせきの とう',
    theme: { grass: '#d8b868', path: '#a8844c', rock: '#a77', tree: '#2a7a2a', water: '#2ab0b0', roof: '#38c', brick: '#865', floor: '#432', bg: '#210' },
    inn: 20, shopTier: 4,
    fieldEnemies: ['scorpion', 'mummy', 'harpy', 'scorpion'], dunEnemies: ['gargoyle', 'sorcerer', 'golem', 'harpy'], maxGroup: 3,
    recruits: [{ id: 'leo', name: 'レオ', cls: 'monk', fee: 120 }, { id: 'serina', name: 'セリナ', cls: 'wizard', fee: 120 }, { id: 'dan', name: 'ダン', cls: 'fighter', fee: 120 }],
    boss: { ids: ['golem_king'], pre: ['ゴゴゴ…！\nおうじょを かえしてほしくば わしを たおせ！', 'この ほうせきの とうは まおうさまの ものだ！'],
            post: ['ゴーレムキングを たおした！', 'とらわれていた おうじょ セレナを すくいだした！', '「ありがとう ゆうしゃさま…\nまおうは きたの まおうじょうに います。\nどうか せかいを おすくいください！」'] },
    chests: [{ g: 150 }, { item: 'herb', n: 5 }, { item: 'ether', n: 2 }, { g: 250 }],
    elder: ['ようこそ サンドラへ。 わしは このまちの ちょうろう。', 'まおうぐんが おうじょセレナを さらい\nほうせきの とうに とじこめたのじゃ。', 'どうか おうじょを すくってくだされ！\nさかばには あらたな なかまが いるはずじゃ。'],
    elderDone: ['おうじょさまを すくってくださり ありがとう！\nこのまちは あなたの おかげで へいわじゃ。'],
    npcs: [['たびのしょうにん', ['さばくの モンスターは つよいぞ。\nぶきや ぼうぐを そろえておくんだ。']],
           ['おんなのこ', ['とうの なかには ガーゴイルが いるんだって…\nこわいなあ。']],
           ['ろうじん', ['まほうつかいの ブリザドは\nてきぜんたいに こうかが あるんじゃよ。']]],
    rumors: ['ぶとうかは すばやくて かいしんの いちげきが でやすいぜ。', 'おうじょさまを たすけてくれ！'],
    intro: ['…さばくの おうこく サンドラ。', 'スライムキングを たおした あなたの うわさは\nとおく さばくの まちまで とどいていた。', 'そして この まちも まおうぐんに おそわれていた…'],
    end: ['まおうは きたの まおうじょうに いる。', 'さいごの たたかいが ちかづいていた…']
  },
  {
    title: '3章 まおうじょう', town: 'ノースエンド', field: 'ほろびの こうや', dun: 'まおうじょう',
    theme: { grass: '#6a5a6a', path: '#8a7a8a', rock: '#445', tree: '#3a2a3a', water: '#d04010', roof: '#639', brick: '#436', floor: '#223', bg: '#102' },
    inn: 40, shopTier: 5,
    fieldEnemies: ['orc', 'deathknight', 'wyvern', 'orc'], dunEnemies: ['deathknight', 'darkpriest', 'demon', 'wyvern'], maxGroup: 3,
    recruits: [{ id: 'wolf', name: 'ウォルフ', cls: 'fighter', fee: 300 }, { id: 'sophia', name: 'ソフィア', cls: 'priest', fee: 300 }, { id: 'roy', name: 'ロイ', cls: 'monk', fee: 300 }],
    boss: { ids: ['demon_lord'], pre: ['ようこそ ゆうしゃよ。\nわたしが この せかいの おうだ。', 'きさまらの ぜつぼうを みせてもらおう！'],
            post: ['まおうを たおした…！', 'だが…\nまおうの からだから くろい ひかりが あふれだした！', 'ぐおおお…！\nこれが わたしの しんの すがただ！'],
            second: { ids: ['demon_true'], post: ['しんの まおうを たおした！！'] } },
    chests: [{ g: 500 }, { item: 'ether', n: 4 }, { item: 'herb', n: 8 }, { g: 800 }],
    elder: ['ここが さいごの むら ノースエンド。', 'この さきの まおうじょうに まおうが いる。\nいきて かえれる ほしょうは ない…', 'だが おぬしたちなら きっと やれるはずじゃ！'],
    elderDone: ['せかいは へいわに なった。\nありがとう ゆうしゃよ！'],
    npcs: [['ふるいへいし', ['まおうは にだんかいに へんしんするという…\nさいごまで あきらめるな！']],
           ['むらのこ', ['ゆうしゃさま がんばって！']],
           ['まじょ', ['やどやで やすめば たいりょくも まりょくも ぜんかいふくじゃ。\nたたかいの まえに かならず やすむのじゃ。']]],
    rumors: ['まおうじょうは ほんとうに あぶない ばしょだ…', 'さいごの なかまを えらぶなら いまだぜ。'],
    intro: ['さいごの むら ノースエンド。', 'ここから さきは まおうじょう。\nせかいの うんめいは あなたたちに かかっている！'],
    end: []
  }
];

// ---------- 純粋な計算関数 ----------
const MQ = {
  expFor(L) { return Math.round(4 * Math.pow(L - 1, 2.3)); },
  atk(c) { return c.str + MQ_WEAP[c.wlv].a; },
  def(c) { return Math.floor(c.vit / 2) + MQ_ARM[c.alv].d; },
  phys(atk, def) { return Math.max(1, Math.round((atk - def / 2) * (0.85 + Math.random() * 0.3))); },
  crit(atk) { return Math.max(1, Math.round(atk * (1 + Math.random() * 0.3))); },
  mkChar(name, cls, lv) {
    const B = MQ_CLS[cls].base;
    const c = { name, cls, lv: 1, exp: 0, wlv: 0, alv: 0, acc: { hp: 0, mp: 0, str: 0, vit: 0, agi: 0, int: 0 },
      hp: B.hp, mhp: B.hp, mp: B.mp, mmp: B.mp, str: B.str, vit: B.vit, agi: B.agi, int: B.int };
    while (c.lv < (lv || 1)) MQ.levelUp(c);
    c.exp = MQ.expFor(c.lv); c.hp = c.mhp; c.mp = c.mmp;
    return c;
  },
  // レベルアップ(習得した呪文名の配列を返す)
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
  knownSpells(c) { return MQ_CLS[c.cls].spells.filter(s => c.lv >= s[1]).map(s => s[0]); }
};

const DungeonCrawl = {
  st: 'title', tmr: 0, tcur: 0,
  party: [], roster: [], gold: 0, items: { herb: 3, ether: 0 },
  ch: 0, mapId: 't0', px: 0, py: 0, dir: 1,
  flags: {}, opened: {}, hired: {}, steps: 0, sinceEnc: 0, moveCd: 0,
  dlg: null, menu: null, b: null, banner: 0, flash: 0, stIdx: 0, endTmr: 0,
  maps: null, hasSave: false,

  // ===================== マップ構築 =====================
  buildMaps() {
    if (this.maps) return;
    const flipOf = c => ({ fx: c === 1, fy: c === 2 });
    const T = (id) => flipOf(+id[1]);
    const make = (id, rows, events, npcs) => {
      const f = T(id);
      let R = rows.slice();
      if (f.fy) R = R.slice().reverse();
      if (f.fx) R = R.map(r => r.split('').reverse().join(''));
      const w = R[0].length, h = R.length;
      const tr = (x, y) => [f.fx ? w - 1 - x : x, f.fy ? h - 1 - y : y];
      const ev = {};
      for (const e of events) { const [x, y] = tr(e.x, e.y); ev[x + ',' + y] = Object.assign({}, e, { x, y }); }
      const nn = (npcs || []).map(n => { const [x, y] = tr(n.x, n.y); return Object.assign({}, n, { x, y }); });
      return { id, rows: R, w, h, ev, npcs: nn, type: id[0], ch: +id[1], tr };
    };
    this.maps = {};
    for (let c = 0; c < 3; c++) {
      const cfg = MQ_CH[c];
      this.maps['t' + c] = make('t' + c, MQ_TOWN, [
        { x: 3, y: 4, type: 'tavern' }, { x: 10, y: 4, type: 'inn' }, { x: 3, y: 8, type: 'shop' }, { x: 10, y: 8, type: 'elder' },
        { x: 6, y: 11, type: 'warp', to: 'f' + c, tx: 4, ty: 14 }, { x: 7, y: 11, type: 'warp', to: 'f' + c, tx: 4, ty: 14 }
      ], cfg.npcs.map((n, i) => ({ x: [5, 11, 2][i], y: [1, 5, 9][i], name: n[0], lines: n[1], col: ['#fc6', '#f8a', '#8cf'][i] })));
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
    }
  },
  map() { return this.maps[this.mapId]; },

  // ===================== 開始・セーブ =====================
  init() {
    document.getElementById('gameboy').classList.remove('mode-abyss');
    canvas.width = 200; canvas.height = 300;
    this.buildMaps();
    this.st = 'title'; this.tmr = 0; this.tcur = 0; this.dlg = null; this.menu = null; this.b = null;
    this.hasSave = !!(SaveSys.data.mq && SaveSys.data.mq.party);
    if (typeof BGM !== 'undefined') BGM.play('menu');
  },

  newGame() {
    const hero = MQ.mkChar('ゆうしゃ', 'hero', 1);
    this.roster = [hero]; this.party = [hero];
    this.gold = 90; this.items = { herb: 3, ether: 0 };
    this.flags = {}; this.opened = {}; this.hired = {};
    this.startChapter(0);
  },

  startChapter(c) {
    this.ch = c;
    for (const m of this.roster) { m.hp = m.mhp; m.mp = m.mmp; }
    this.goMap('t' + c, 6, 10);
    this.st = 'map';
    this.saveGame(true);
    this.say([MQ_CH[c].title].concat(MQ_CH[c].intro));
  },

  saveGame(silent) {
    SaveSys.data.mq = {
      ch: this.ch, mapId: this.mapId, px: this.px, py: this.py, gold: this.gold, items: this.items,
      flags: this.flags, opened: this.opened, hired: this.hired,
      roster: JSON.parse(JSON.stringify(this.roster)), party: this.party.map(c => this.roster.indexOf(c))
    };
    SaveSys.save();
  },

  loadGame() {
    const s = SaveSys.data.mq;
    this.ch = s.ch; this.gold = s.gold; this.items = s.items; this.flags = s.flags; this.opened = s.opened; this.hired = s.hired || {};
    this.roster = s.roster; this.party = s.party.map(i => this.roster[i]);
    this.mapId = s.mapId; this.px = s.px; this.py = s.py;
    this.goMapRaw(this.mapId, this.px, this.py);
    this.st = 'map';
  },

  mapBGM() {
    const t = this.mapId[0];
    if (typeof BGM === 'undefined') return;
    BGM.play(t === 't' ? 'menu' : t === 'f' ? 'puzzle' : 'dungeon');
  },

  goMapRaw(id, x, y) { this.mapId = id; this.px = x; this.py = y; this.sinceEnc = 0; this.banner = 120; this.mapBGM(); },
  // 基準座標(未反転)で指定して移動
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

  // items: [{l, off, v}]
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
    this.openMenu(title, this.party.map((c, i) => ({ l: this.memberLabel(c), v: c, off: filter ? !filter(c) : false })), it => onSel(it.v), onBack);
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
    this.tmr++;
    const n = this.hasSave ? 2 : 1;
    if (keysDown.up || keysDown.down) { this.tcur = (this.tcur + 1) % n; playSnd('sel'); }
    if (keysDown.select) { switchApp(Menu); return; }
    if (keysDown.a) {
      playSnd('jmp');
      if (this.tcur === 0 && !this.hasSave) this.newGame();
      else if (this.tcur === 0) this.newGame();
      else this.loadGame();
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
    if (npc) { this.say(npc.name + '「' + npc.lines.join('\n') + '」'); return; }
    this.px = nx; this.py = ny; this.steps++;
    const ev = m.ev[nx + ',' + ny];
    if (ev && this.handleEvent(ev)) return;
    if (m.type === 'f' || m.type === 'd') {
      this.sinceEnc++;
      if (this.sinceEnc >= 4 && Math.random() < (m.type === 'f' ? 0.09 : 0.12)) this.randomBattle();
    }
  },

  handleEvent(ev) {
    const cfg = MQ_CH[this.ch];
    if (ev.type === 'warp') {
      playSnd('sel'); this.flash = 10;
      this.goMap(ev.to, ev.tx, ev.ty);
      return true;
    }
    if (ev.type === 'chest') {
      const key = this.mapId + ':' + ev.x + ',' + ev.y;
      if (this.opened[key]) return false;
      this.opened[key] = true; playSnd('combo');
      const it = ev.item;
      if (it.g) { this.gold += it.g; this.say(['たからばこを あけた！', it.g + 'ゴールドを てにいれた！']); }
      else { this.items[it.item] = (this.items[it.item] || 0) + it.n; this.say(['たからばこを あけた！', MQ_ITEMS[it.item].name + 'を ' + it.n + 'こ てにいれた！']); }
      return true;
    }
    if (ev.type === 'boss') {
      if (this.flags['b' + this.ch]) return false;
      this.startBoss();
      return true;
    }
    if (ev.type === 'elder') {
      this.say(this.flags['b' + this.ch] ? cfg.elderDone : cfg.elder);
      return true;
    }
    if (ev.type === 'inn') { this.innMenu(); return true; }
    if (ev.type === 'tavern') { this.tavernMenu(); return true; }
    if (ev.type === 'shop') { this.shopMenu(0); return true; }
    return false;
  },

  // ---------- マップメニュー ----------
  openMapMenu(cur) {
    const inTown = this.mapId[0] === 't';
    this.openMenu('コマンド', [
      { l: 'つよさ', v: 'status' }, { l: 'じゅもん', v: 'spell' }, { l: 'どうぐ', v: 'item' },
      { l: 'セーブ' + (inTown ? '' : '(まちのみ)'), v: 'save', off: !inTown }, { l: 'とじる', v: 'close' }
    ], (it, c) => {
      if (it.v === 'status') { this.st = 'status'; this.stIdx = 0; }
      else if (it.v === 'spell') this.fieldSpell();
      else if (it.v === 'item') this.fieldItem();
      else if (it.v === 'save') { this.saveGame(); this.say('ぼうけんの しょを きろくした！'); }
    }, () => {}, cur);
  },

  fieldSpell() {
    const healers = this.party.filter(c => MQ.knownSpells(c).some(s => MQ_SPELLS[s].tg === 'ally'));
    if (!healers.length) { this.say('つかえる じゅもんが ない！'); return; }
    this.openMenu('だれが？', healers.map(c => ({ l: this.memberLabel(c), v: c })), it => {
      const c = it.v;
      const sp = MQ.knownSpells(c).filter(s => MQ_SPELLS[s].tg === 'ally');
      this.openMenu('じゅもん', sp.map(s => ({ l: MQ_SPELLS[s].name + ' MP' + MQ_SPELLS[s].mp, v: s, off: c.mp < MQ_SPELLS[s].mp })), it2 => {
        const S = MQ_SPELLS[it2.v];
        this.partyMenu('だれに？', t => {
          if (t.hp <= 0) { this.say('いきて いない！'); return; }
          c.mp -= S.mp; const h = Math.min(t.mhp - t.hp, Math.round(S.pow(c)));
          t.hp += h; playSnd('combo');
          this.say(t.name + 'の HPが ' + h + ' かいふくした！', () => this.openMapMenu(1));
        }, () => this.fieldSpell());
      }, () => this.fieldSpell());
    }, () => this.openMapMenu(1));
  },

  fieldItem() {
    const list = Object.keys(MQ_ITEMS).filter(k => this.items[k] > 0);
    if (!list.length) { this.say('どうぐを もっていない！'); return; }
    this.openMenu('どうぐ', list.map(k => ({ l: MQ_ITEMS[k].name + ' x' + this.items[k], v: k })), it => {
      this.partyMenu('だれに？', t => {
        if (t.hp <= 0) { this.say('いきて いない！'); return; }
        this.useItem(it.v, t, (msg) => this.say(msg, () => this.openMapMenu(2)));
      }, () => this.fieldItem(), c => c.hp > 0);
    }, () => this.openMapMenu(2));
  },

  useItem(k, t, done) {
    this.items[k]--;
    if (k === 'herb') { const h = Math.min(t.mhp - t.hp, 30); t.hp += h; playSnd('combo'); done(t.name + 'の HPが ' + h + ' かいふくした！'); }
    else { const h = Math.min(t.mmp - t.mp, 20); t.mp += h; playSnd('combo'); done(t.name + 'の MPが ' + h + ' かいふくした！'); }
  },

  // ---------- ステータス画面 ----------
  updStatus() {
    if (keysDown.left) { this.stIdx = (this.stIdx + this.party.length - 1) % this.party.length; playSnd('sel'); }
    if (keysDown.right) { this.stIdx = (this.stIdx + 1) % this.party.length; playSnd('sel'); }
    if (keysDown.b || keysDown.a) { this.st = 'map'; playSnd('sel'); }
  },

  // ---------- 宿屋・酒場・ショップ ----------
  innMenu() {
    const price = MQ_CH[this.ch].inn * this.party.length;
    this.say('いらっしゃいませ！\nひとばん ' + price + 'ゴールドです。 とまりますか？', () => {
      this.openMenu('とまる？ (' + this.gold + 'G)', [{ l: 'はい', v: 1, off: this.gold < price }, { l: 'いいえ', v: 0 }], it => {
        if (!it.v) { this.say('また どうぞ！'); return; }
        this.gold -= price;
        for (const c of this.party) { c.hp = c.mhp; c.mp = c.mmp; }
        for (const c of this.roster) if (!this.party.includes(c)) { c.hp = c.mhp; c.mp = c.mmp; }
        this.flash = 30; playSnd('combo'); this.saveGame();
        this.say(['…… ………', 'おはようございます！\nたいりょくも まりょくも ぜんかいふくしました！', 'ぼうけんの しょに きろくしました。']);
      }, () => {});
    });
  },

  tavernMenu(cur) {
    const cfg = MQ_CH[this.ch];
    this.say('さかばへ ようこそ！\nここは ぼうけんしゃの あつまる ばしょさ。', () => this.tavernTop(0));
  },
  tavernTop(cur) {
    this.openMenu('さかば (' + this.gold + 'G)', [
      { l: 'なかまを さがす', v: 'hire' }, { l: 'なかまと わかれる', v: 'leave', off: this.party.length <= 1 },
      { l: 'うわさを きく', v: 'talk' }, { l: 'でる', v: 'exit' }
    ], (it, c) => {
      if (it.v === 'hire') this.tavernHire();
      else if (it.v === 'leave') this.tavernLeave();
      else if (it.v === 'talk') { const r = MQ_CH[this.ch].rumors; this.say(r[Math.floor(Math.random() * r.length)], () => this.tavernTop(2)); }
    }, () => {}, cur);
  },
  tavernHire() {
    const cand = [];
    for (let c = 0; c <= this.ch; c++) for (const r of MQ_CH[c].recruits) {
      if (!this.party.some(p => p.rid === r.id)) cand.push(r);
    }
    if (!cand.length) { this.say('いまは だれも いないようだ。', () => this.tavernTop(0)); return; }
    this.openMenu('だれを さそう？', cand.map(r => {
      const first = !this.hired[r.id];
      return { l: r.name + '(' + MQ_CLS[r.cls].name + ')' + (first ? ' ' + r.fee + 'G' : ' さいかい'), v: r, off: false };
    }), it => {
      const r = it.v;
      if (this.party.length >= 4) { this.say('パーティは いっぱいだ！\nだれかと わかれてから さそおう。', () => this.tavernTop(0)); return; }
      const first = !this.hired[r.id];
      if (first && this.gold < r.fee) { this.say('おかねが たりないな…', () => this.tavernTop(0)); return; }
      let ch = this.roster.find(c => c.rid === r.id);
      if (!ch) {
        const avg = Math.round(this.party.reduce((s, c) => s + c.lv, 0) / this.party.length);
        ch = MQ.mkChar(r.name, r.cls, Math.max(1, avg - 1)); ch.rid = r.id;
        // 装備は仲間の平均に合わせる
        ch.wlv = Math.max(0, Math.round(this.party.reduce((s, c) => s + c.wlv, 0) / this.party.length) - 1);
        ch.alv = Math.max(0, Math.round(this.party.reduce((s, c) => s + c.alv, 0) / this.party.length) - 1);
        this.roster.push(ch);
      }
      if (first) { this.gold -= r.fee; this.hired[r.id] = true; }
      this.party.push(ch); playSnd('combo');
      this.say([r.name + 'が なかまに くわわった！', r.name + '「よろしく たのむぜ！」'], () => this.tavernTop(0));
    }, () => this.tavernTop(0));
  },
  tavernLeave() {
    this.openMenu('だれと わかれる？', this.party.slice(1).map(c => ({ l: c.name + ' Lv' + c.lv, v: c })), it => {
      this.party = this.party.filter(c => c !== it.v);
      this.say(it.v.name + 'は さかばに もどっていった。\n「また よんでくれよ！」', () => this.tavernTop(1));
    }, () => this.tavernTop(1));
  },

  shopMenu(cur) {
    const tier = MQ_CH[this.ch].shopTier;
    this.openMenu('どうぐや (' + this.gold + 'G)', [
      { l: 'やくそう ' + MQ_ITEMS.herb.price + 'G (' + (this.items.herb || 0) + ')', v: 'herb', off: this.gold < MQ_ITEMS.herb.price },
      { l: 'せいすい ' + MQ_ITEMS.ether.price + 'G (' + (this.items.ether || 0) + ')', v: 'ether', off: this.gold < MQ_ITEMS.ether.price },
      { l: 'ぶきを かう', v: 'weap' }, { l: 'ぼうぐを かう', v: 'arm' }, { l: 'でる', v: 'exit' }
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
    this.openMenu(kind === 'weap' ? 'だれの ぶき？' : 'だれの ぼうぐ？', this.party.map(c => {
      const nx = c[key] + 1;
      const can = nx <= tier;
      return { l: c.name + ' ' + T[c[key]].n + (can ? '→' + T[nx].n + ' ' + T[nx].p + 'G' : ' (もうない)'), v: c, off: !can || this.gold < T[nx].p };
    }), it => {
      const c = it.v; const nx = c[key] + 1;
      this.gold -= T[nx].p; c[key] = nx; playSnd('combo');
      this.say(c.name + 'は ' + T[nx].n + 'を そうびした！', () => this.shopEquip(kind, tier, back));
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
    this.say(cfg.boss.pre, () => {
      this.startBattle(cfg.boss.ids, { stage: 0 });
    });
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
    if (typeof BGM !== 'undefined') BGM.play(boss ? 'boss' : 'action');
    const names = ids.filter((id, i) => ids.indexOf(id) === i).map(id => MQ_ENEMY[id].n).join('と ');
    this.say(boss ? [names + 'が たちはだかった！'] : [names + 'が あらわれた！'], () => this.beginTurn(), { auto: true });
  },

  aliveParty() { return this.party.filter(c => c.hp > 0); },
  aliveEn() { return this.b.en.filter(e => e.alive); },

  beginTurn() {
    const b = this.b;
    b.cmds = []; b.actors = this.party.filter(c => c.hp > 0); b.ai = 0;
    this.cmdMenu();
  },

  cmdMenu() {
    const b = this.b; const a = b.actors[b.ai];
    b.phase = 'cmd';
    this.openMenu(a.name, [{ l: 'たたかう', v: 0 }, { l: 'じゅもん', v: 1 }, { l: 'どうぐ', v: 2 }, { l: 'にげる', v: 3 }], it => {
      if (it.v === 0) this.pickEnemy(t => this.pushCmd({ t: 'atk', a, tg: t }));
      else if (it.v === 1) this.battleSpell(a);
      else if (it.v === 2) this.battleItem(a);
      else { b.cmds = [{ t: 'run', a }]; this.resolve(); }
    }, () => {
      if (b.ai > 0) { b.cmds.pop(); b.ai--; this.cmdMenu(); } else this.cmdMenu();
    });
    this.menu.top = 0;
  },

  pushCmd(c) {
    const b = this.b;
    b.cmds.push(c); b.ai++; b.phase = 'none';
    if (b.ai >= b.actors.length) this.resolve(); else this.cmdMenu();
  },

  pickEnemy(cb) {
    const b = this.b; const al = this.aliveEn();
    if (al.length === 1) { cb(b.en.indexOf(al[0])); return; }
    b.phase = 'target'; b.tcur = b.en.indexOf(al[0]); b.onTarget = cb;
  },

  battleSpell(a) {
    const sp = MQ.knownSpells(a);
    if (!sp.length) { this.say('つかえる じゅもんが ない！', () => this.cmdMenu(), { auto: true }); return; }
    this.openMenu('じゅもん', sp.map(s => ({ l: MQ_SPELLS[s].name + ' MP' + MQ_SPELLS[s].mp, v: s, off: a.mp < MQ_SPELLS[s].mp })), it => {
      const S = MQ_SPELLS[it.v];
      if (S.tg === 'enemy') this.pickEnemy(t => this.pushCmd({ t: 'spell', a, s: it.v, tg: t }));
      else if (S.tg === 'allEnemy') this.pushCmd({ t: 'spell', a, s: it.v });
      else this.partyMenu('だれに？', t => this.pushCmd({ t: 'spell', a, s: it.v, tg: t }), () => this.battleSpell(a), c => c.hp > 0);
    }, () => this.cmdMenu());
  },

  battleItem(a) {
    const list = Object.keys(MQ_ITEMS).filter(k => this.items[k] > 0);
    if (!list.length) { this.say('どうぐを もっていない！', () => this.cmdMenu(), { auto: true }); return; }
    this.openMenu('どうぐ', list.map(k => ({ l: MQ_ITEMS[k].name + ' x' + this.items[k], v: k })), it => {
      this.partyMenu('だれに？', t => this.pushCmd({ t: 'item', a, k: it.v, tg: t }), () => this.battleItem(a), c => c.hp > 0);
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
    const killCheck = (e) => { if (e.hp <= 0) { e.hp = 0; e.alive = false; P(e.n + 'を たおした！', () => { e.vis = false; playSnd('combo'); }); } };
    const dmgParty = (t, d) => {
      t.hp = Math.max(0, t.hp - d);
      P(t.name + 'は ' + d + 'の ダメージを うけた！', hurtP);
      if (t.hp <= 0) P(t.name + 'は たおれた！');
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
        P(e.n + 'の こうげき！');
        if (Math.random() < 0.05) P('ミス！ ' + t.name + 'は ひらりと みをかわした！');
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
        P(e.n + 'は ' + skill.n + 'を となえた！');
        const h = Math.min(e.mhp - e.hp, skill.amt); e.hp += h; P(e.n + 'の HPが かいふくした！');
      }
    } else {
      const a = act.a;
      if (a.hp <= 0) { this.runNext(); return; }
      if (act.t === 'atk') {
        let t = this.b.en[act.tg]; if (!t.alive) t = this.aliveEn()[0];
        if (!t) { this.runNext(); return; }
        P(a.name + 'の こうげき！');
        const atk = MQ.atk(a);
        if (Math.random() < 1 / MQ_CLS[a.cls].crit) { const d = MQ.crit(atk); P('かいしんの いちげき！！'); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); }
        else if (Math.random() < 0.04) P('ミス！ ' + t.n + 'は ひらりと みをかわした！');
        else { const d = MQ.phys(atk, t.d.def); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); }
        killCheck(t);
      } else if (act.t === 'spell') {
        const S = MQ_SPELLS[act.s];
        if (a.mp < S.mp) P(a.name + 'は ' + S.name + 'を となえた！\nしかし MPが たりない！');
        else {
          a.mp -= S.mp; P(a.name + 'は ' + S.name + 'を となえた！');
          if (S.tg === 'enemy') {
            let t = this.b.en[act.tg]; if (!t.alive) t = this.aliveEn()[0];
            if (t) { const d = Math.max(1, Math.round(S.pow(a) * (0.9 + Math.random() * 0.2))); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); killCheck(t); }
          } else if (S.tg === 'allEnemy') {
            for (const t of this.aliveEn()) { const d = Math.max(1, Math.round(S.pow(a) * (0.9 + Math.random() * 0.2))); t.hp -= d; P(t.n + 'に ' + d + 'の ダメージ！', flashE(t)); killCheck(t); }
          } else {
            const t = act.tg.hp > 0 ? act.tg : a;
            const h = Math.min(t.mhp - t.hp, Math.round(S.pow(a))); t.hp += h; P(t.name + 'の HPが ' + h + ' かいふくした！', () => playSnd('combo'));
          }
        }
      } else if (act.t === 'item') {
        if (!(this.items[act.k] > 0)) P(a.name + 'は どうぐを つかおうとしたが もう ない！');
        else {
          const t = act.tg;
          this.items[act.k]--;
          P(a.name + 'は ' + MQ_ITEMS[act.k].name + 'を つかった！');
          if (act.k === 'herb') { const h = Math.min(t.mhp - t.hp, 30); t.hp += h; P(t.name + 'の HPが ' + h + ' かいふくした！', () => playSnd('combo')); }
          else { const h = Math.min(t.mmp - t.mp, 20); t.mp += h; P(t.name + 'の MPが ' + h + ' かいふくした！', () => playSnd('combo')); }
        }
      } else if (act.t === 'run') {
        P(a.name + 'たちは にげだした！');
        const pa = this.aliveParty().reduce((s, c) => s + c.agi, 0) / Math.max(1, this.aliveParty().length);
        const ea = this.aliveEn().reduce((s, e) => s + e.d.agi, 0) / Math.max(1, this.aliveEn().length);
        if (b.boss) P('しかし まわりこまれてしまった！');
        else if (Math.random() < Math.min(0.9, Math.max(0.25, 0.55 + (pa - ea) * 0.02))) fled = true;
        else P('しかし まわりこまれてしまった！');
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
    const pages = ['てきを やっつけた！', exp + 'の けいけんちを かくとく！', gold + 'ゴールドを てにいれた！'];
    for (const c of this.aliveParty()) {
      const r = MQ.gainExp(c, exp);
      for (const lv of r.ups) pages.push(c.name + 'は レベル' + lv + 'に あがった！');
      for (const s of r.learned) pages.push(c.name + 'は ' + s + 'を おぼえた！');
    }
    playSnd('combo');
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
      this.say(post, () => { this.st = 'ending'; this.endTmr = 0; SaveSys.data.mqClear = (SaveSys.data.mqClear || 0) + 1; SaveSys.save(); if (typeof BGM !== 'undefined') BGM.play('menu'); });
    }
  },

  lose() {
    this.say(['ゆうしゃたちは ぜんめつした…', 'めのまえが まっくらに なった…'], () => {
      this.gold = Math.floor(this.gold / 2);
      for (const c of this.roster) { c.hp = c.mhp; c.mp = c.mmp; }
      this.endBattle();
      this.goMap('t' + this.ch, 6, 10);
      this.flash = 30;
      this.say('おお ゆうしゃよ しんでしまうとは なさけない…\nおかねの はんぶんを うしなった。\nさあ もういちど たびだつのじゃ！');
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
      ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('どの てきを ねらう？', 12, 203);
      ctx.fillStyle = '#9ab'; ctx.fillText('◀▶:えらぶ A:けってい B:もどる', 12, 290);
    } else {
      this.drawPartyRows(12, 202, 20);
      ctx.fillStyle = '#ff0'; ctx.font = '9px monospace'; ctx.fillText(this.gold + 'G', 150, 290);
      ctx.fillStyle = '#9ab'; ctx.fillText('A:コマンド', 12, 290);
    }
  },

  drawTile(ch, px, py, m, th) {
    const T = MQ_TILE; const f = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(px + x, py + y, w, h); };
    const dun = m.type === 'd';
    const c = this.ch;
    if (ch === 'B') { f(th.brick, 0, 0, T, T); f('#0004', 0, 7, T, 1); f('#0004', 7, 0, 1, 7); f('#0004', 3, 8, 1, 8); f('#fff1', 0, 0, T, 1); return; }
    if (ch === 'r') { f('#a22', 0, 0, T, T); f('#d55', 0, 0, T, 1); f('#d55', 0, 15, T, 1); return; }
    if (ch === ',') { f(dun ? th.floor : th.path, 0, 0, T, T); if (dun) f('#fff1', 0, 0, T, 1); return; }
    // 草地ベース
    f(th.grass, 0, 0, T, T);
    if (ch === '.') { f('#0002', 3, 4, 2, 1); f('#0002', 10, 11, 2, 1); return; }
    if (ch === '#') {
      f(th.rock, 0, 0, T, T); f('#0003', 0, 10, T, 6); f('#fff3', 5, 2, 6, 3); f('#fff2', 3, 5, 10, 3);
      f('#0003', 0, 15, T, 1); return;
    }
    if (ch === 'T') {
      if (c === 1) { f('#4a7a2a', 7, 2, 2, 12); f('#4a7a2a', 3, 5, 4, 2); f('#4a7a2a', 3, 3, 2, 3); f('#4a7a2a', 9, 7, 4, 2); f('#4a7a2a', 11, 5, 2, 3); }
      else if (c === 2) { f(th.tree, 7, 1, 2, 14); f(th.tree, 3, 6, 4, 2); f(th.tree, 9, 4, 4, 2); }
      else { f('#5a3a2a', 7, 6, 3, 10); f(th.tree, 2, 1, 12, 7); f('#fff2', 4, 2, 3, 2); }
      return;
    }
    if (ch === '~') { f(th.water, 0, 0, T, T); f('#fff5', 2, 4, 5, 1); f('#fff5', 8, 10, 5, 1); return; }
    if (ch === 'h') { f(th.roof, 0, 0, T, 9); f('#0003', 0, 8, T, 1); f('#ddc', 0, 9, T, 7); f('#48c', 3, 11, 3, 3); f('#48c', 10, 11, 3, 3); return; }
    if (ch === 'd') { f('#ddc', 0, 0, T, T); f('#640', 3, 3, 10, 13); f('#fc0', 10, 10, 2, 2); return; }
    if (ch === 'V') { f(th.grass, 0, 0, T, T); f(th.roof, 2, 2, 12, 6); f('#ddc', 3, 8, 10, 7); f('#640', 7, 10, 3, 5); return; }
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
    const cx = Math.max(0, Math.min(m.w - MQ_VW, this.px - 5));
    const cy = Math.max(0, Math.min(m.h - MQ_VH, this.py - 5));
    const OX = 4, OY = 4;
    ctx.save(); ctx.beginPath(); ctx.rect(OX, OY, MQ_VW * MQ_TILE, MQ_VH * MQ_TILE); ctx.clip();
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
      } else if (ev && ev.type === 'warp' && m.type === 'd') {
        ctx.fillStyle = '#6cf'; ctx.fillRect(px + 3, py + 3, 10, 10);
      } else if (ev && ev.type === 'boss' && !this.flags['b' + this.ch]) {
        ctx.fillStyle = '#f33'; ctx.fillRect(px + 4, py + 2, 8, 12); ctx.fillStyle = '#ff0'; ctx.fillRect(px + 6, py + 5, 4, 3);
      } else if (ev && ['tavern', 'inn', 'shop', 'elder'].includes(ev.type)) {
        const lab = { tavern: '酒', inn: '宿', shop: '道', elder: '長' }[ev.type];
        ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText(lab, px + 8, py + 6); ctx.textAlign = 'left';
      }
    }
    for (const n of m.npcs) {
      const x = OX + (n.x - cx) * MQ_TILE, y = OY + (n.y - cy) * MQ_TILE;
      this.drawPerson(x, y, n.col, '#543', 1);
    }
    this.drawPerson(OX + (this.px - cx) * MQ_TILE, OY + (this.py - cy) * MQ_TILE, '#38f', '#a62', this.dir);
    ctx.restore();
    if (this.banner > 0) {
      const name = m.type === 't' ? MQ_CH[m.ch].town : m.type === 'f' ? MQ_CH[m.ch].field : MQ_CH[m.ch].dun;
      ctx.globalAlpha = Math.min(1, this.banner / 30);
      ctx.fillStyle = '#000c'; ctx.fillRect(40, 10, 120, 18); ctx.strokeStyle = '#fff'; ctx.strokeRect(40, 10, 120, 18);
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
    // 地面
    ctx.fillStyle = cfg.theme.grass; ctx.globalAlpha = 0.35; ctx.fillRect(0, 128, 200, 56); ctx.globalAlpha = 1;
    // パーティ状態
    this.drawWin(2, 2, 196, 12 + this.party.length * 12);
    this.drawPartyRows(10, 20, 12);
    // 敵
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
    ctx.fillText(MQ_CLS[c.cls].name + '  Lv' + c.lv, 16, 46);
    const rows = [['HP', c.hp + '/' + c.mhp], ['MP', c.mp + '/' + c.mmp], ['ちから', c.str], ['みのまもり', c.vit], ['すばやさ', c.agi], ['かしこさ', c.int],
      ['こうげき', MQ.atk(c)], ['ぼうぎょ', MQ.def(c)]];
    ctx.fillStyle = '#fff';
    rows.forEach((r, i) => { ctx.fillText(r[0], 16, 68 + i * 15); ctx.fillText(String(r[1]), 100, 68 + i * 15); });
    ctx.fillText('ぶき: ' + MQ_WEAP[c.wlv].n, 16, 196);
    ctx.fillText('ぼうぐ: ' + MQ_ARM[c.alv].n, 16, 212);
    const nxt = MQ.expFor(c.lv + 1);
    ctx.fillStyle = '#6f6'; ctx.fillText('つぎのレベルまで ' + Math.max(0, nxt - c.exp), 16, 232);
    const sp = MQ.knownSpells(c).map(s => MQ_SPELLS[s].name).join(' ');
    ctx.fillStyle = '#fc6'; ctx.fillText('じゅもん: ' + (sp || 'なし'), 16, 250);
    ctx.fillStyle = '#9ab'; ctx.font = '9px monospace'; ctx.fillText('◀▶:きりかえ  A/B:もどる', 24, 282);
  },

  drawTitle() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    for (let i = 0; i < 50; i++) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(this.tmr * 0.03 + i)); ctx.fillRect((i * 53) % 200, (i * 37) % 170, 1, 1); }
    ctx.globalAlpha = 1;
    // 城のシルエット
    ctx.fillStyle = '#113';
    ctx.fillRect(60, 130, 80, 40); ctx.fillRect(55, 110, 14, 60); ctx.fillRect(131, 110, 14, 60); ctx.fillRect(88, 100, 24, 70);
    ctx.fillStyle = '#c33'; ctx.fillRect(92, 92, 16, 8); ctx.fillStyle = '#ff0'; ctx.fillRect(96, 140, 8, 14);
    ctx.shadowBlur = 14; ctx.shadowColor = '#4af';
    ctx.fillStyle = '#fc4'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'; ctx.fillText('MICRO', 100, 44);
    ctx.fillStyle = '#fff'; ctx.fillText('QUEST', 100, 70);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8cf'; ctx.font = '11px monospace'; ctx.fillText('マイクロクエスト', 100, 88);
    const items = this.hasSave ? ['はじめから', 'つづきから'] : ['はじめから'];
    ctx.font = 'bold 12px monospace';
    items.forEach((t, i) => { ctx.fillStyle = i === this.tcur ? '#ff0' : '#fff'; ctx.fillText((i === this.tcur ? '▶ ' : '  ') + t, 100, 208 + i * 20); });
    ctx.fillStyle = '#9ab'; ctx.font = '9px monospace';
    ctx.fillText('CLEAR: ' + (SaveSys.data.mqClear || 0) + '回', 100, 262);
    ctx.fillText('SELECT:もどる', 100, 284);
    ctx.textAlign = 'left';
  },

  drawEnding() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    for (let i = 0; i < 60; i++) { ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(this.tmr * 0.04 + i)); ctx.fillRect((i * 47) % 200, (i * 61) % 300, 1, 1); }
    ctx.globalAlpha = 1; ctx.textAlign = 'center';
    const lines = ['せかいに へいわが もどった…', '', 'ゆうしゃと なかまたちの', 'ぼうけんは ここに おわる。', '', '── THE END ──', '', 'ごプレイ ありがとう！'];
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
