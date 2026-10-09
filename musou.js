// === 無限無双 (MUSOU INFINITY) v3 — 完全新規版 : ロジック部 ===
// 画面・描画は musou_draw.js
// ストーリー「乱世の門」: 異界の門が開き妖魔が溢れた。魔王・黒蓮を倒すため三人の武将が戦う。

// ---------- 武将 ----------
const MU_HEROES = [
  { id: 'jin', name: '刃', title: '剣豪', hp: 120, spd: 1.0, atk: 1.1, col: '#e44', hair: '#222', weapon: 'blade', ult: 'whirl', ultName: '旋風乱舞', unlock: -1,
    desc: '近接の達人。回転剣で周囲の敵を薙ぎ払う。' },
  { id: 'rin', name: '凛', title: '軍師', hp: 90, spd: 1.0, atk: 1.25, col: '#a5f', hair: '#cdf', weapon: 'magic', ult: 'thunder', ultName: '天雷乱舞', unlock: 0,
    desc: '魔法の使い手。追尾弾で戦う。' },
  { id: 'ao', name: '蒼', title: '弓将', hp: 100, spd: 1.1, atk: 1.0, col: '#4c8', hair: '#865', weapon: 'arrow', ult: 'arrows', ultName: '千本矢', unlock: 1,
    desc: '弓の名手。貫通矢が敵を貫く。' }
];

// ---------- 武器 / パッシブ ----------
const MU_WEAPONS = {
  blade:   { name: '回転剣',         ch: '剣', col: '#cdf', evo: '暴風剣',   need: 'spd',  desc: '周囲を回る剣' },
  magic:   { name: '魔法弾',         ch: '魔', col: '#c8f', evo: '流星群',   need: 'cool', desc: '追尾する弾を放つ' },
  arrow:   { name: '貫通矢',         ch: '弓', col: '#8e8', evo: '千本矢',   need: 'atk',  desc: '敵を貫く矢を放つ' },
  thunder: { name: '雷撃',           ch: '雷', col: '#ff6', evo: '天雷',     need: 'luck', desc: '敵に雷を落とす' },
  fire:    { name: '炎の輪',         ch: '炎', col: '#f84', evo: '業火',     need: 'hp',   desc: '周囲を燃やす炎' },
  bomb:    { name: '爆撃',           ch: '爆', col: '#fa4', evo: '大爆撃',   need: 'mag',  desc: '敵の足元を爆破' },
  hole:    { name: 'ブラックホール', ch: '穴', col: '#a6f', evo: '虚空',     need: 'cool', desc: '敵を吸い込み削る' },
  shuri:   { name: '手裏剣',         ch: '手', col: '#bcd', evo: '風魔手裏剣', need: 'spd', desc: '戻ってくる刃' },
  wave:    { name: '衝撃波',         ch: '波', col: '#6df', evo: '断空斬',   need: 'atk',  desc: '前方を薙ぐ斬撃' },
  spirit:  { name: '守護霊',         ch: '霊', col: '#9fd', evo: '百鬼夜行', need: 'hp',   desc: '舞い飛ぶ霊が敵を襲う' }
};
const MU_PASSIVES = {
  atk:  { name: '剛力',   ch: '力', col: '#f66', desc: '与ダメージ +10%' },
  hp:   { name: '鋼体',   ch: '体', col: '#6f6', desc: '最大HP +15%' },
  spd:  { name: '韋駄天', ch: '速', col: '#6cf', desc: '移動速度 +8%' },
  mag:  { name: '磁石',   ch: '磁', col: '#fc6', desc: '吸引範囲 +25%' },
  cool: { name: '迅速',   ch: '迅', col: '#f9f', desc: '攻撃間隔 -8%' },
  luck: { name: '幸運',   ch: '運', col: '#ff8', desc: 'ドロップ・経験値UP' }
};

// ---------- 敵 ----------
// r:当たり半径 sc:描画倍率 exp:経験値 gv:無双ゲージ
const MU_ENEMY = {
  zako:    { hp: 14,  spd: 0.55, dmg: 6,  r: 5,  sc: 2, exp: 1,  gv: 1,  spr: 'zako' },
  hayate:  { hp: 8,   spd: 1.0,  dmg: 5,  r: 4,  sc: 2, exp: 1,  gv: 1,  spr: 'hayate' },
  tate:    { hp: 45,  spd: 0.4,  dmg: 9,  r: 7,  sc: 2, exp: 3,  gv: 2,  spr: 'tate' },
  yumi:    { hp: 16,  spd: 0.45, dmg: 4,  r: 5,  sc: 2, exp: 2,  gv: 2,  spr: 'yumi', ranged: true },
  bakudan: { hp: 12,  spd: 0.85, dmg: 18, r: 5,  sc: 2, exp: 2,  gv: 1,  spr: 'bakudan' },
  hi:      { hp: 10,  spd: 0.7,  dmg: 7,  r: 5,  sc: 2, exp: 2,  gv: 1,  spr: 'hi' },
  oni:     { hp: 160, spd: 0.5,  dmg: 14, r: 10, sc: 3, exp: 14, gv: 6,  spr: 'oni', elite: true },
  ninja:   { hp: 24,  spd: 0.9,  dmg: 8,  r: 5,  sc: 2, exp: 3,  gv: 2,  spr: 'ninja' },
  mini:    { hp: 380, spd: 0.6,  dmg: 13, r: 14, sc: 4, exp: 70, gv: 20, spr: 'oni', elite: true }
};

// ---------- ステージ ----------
// 各ステージの敵出現表 (t秒以降に出現, w=重み)
const MU_STAGES = [
  { id: 1, name: '荒野の関', bossName: '鬼武者', boss: 'bk1', hpMul: 1.0, rateMul: 1.0, capMul: 1.0, dmgMul: 1.0,
    theme: { bg: '#6b5a3a', t1: '#76643f', t2: '#5d4d30', acc: '#8a7448' }, bossAt: 300, minis: [130, 230],
    pal: { zako: ['#c9a063', '#7a5a2a'], hayate: ['#d8b070', '#8a6a30'], tate: ['#a98050', '#6a8aa0'], yumi: ['#b89060', '#d8c090'], bakudan: ['#b05030', '#f8d040'], hi: ['#f08030', '#ffe060'], oni: ['#c04030', '#f0e0a0'], ninja: ['#3a3a4a', '#c04040'] },
    table: [{ t: 0, id: 'zako', w: 10 }, { t: 30, id: 'hayate', w: 5 }, { t: 70, id: 'yumi', w: 3 }, { t: 110, id: 'tate', w: 3 }, { t: 160, id: 'bakudan', w: 3 }, { t: 200, id: 'ninja', w: 2 }, { t: 240, id: 'oni', w: 0.7 }],
    pre: ['最初の門は 荒野の関に 開いていた。', '関を占拠した 妖魔どもを束ねるのは\n鬼武者。\n刃は 刀を抜き 一人 敵陣へ 向かった。'],
    post: ['鬼武者を 倒した！ 門は 静かに 閉じていく…', '「一人で 無茶を する人ね」\n軍師・凛が 仲間に 加わった！'] },
  { id: 2, name: '妖樹の森', bossName: '樹妖の主', boss: 'bk2', hpMul: 1.3, rateMul: 1.08, capMul: 1.1, dmgMul: 1.15,
    theme: { bg: '#27402a', t1: '#2e4a31', t2: '#1f3523', acc: '#3d6a42' }, bossAt: 300, minis: [130, 230],
    pal: { zako: ['#6aa84f', '#274e13'], hayate: ['#93c47d', '#38761d'], tate: ['#6a8a4a', '#8a6a3a'], yumi: ['#76a65a', '#c8e0a0'], bakudan: ['#8a4a8a', '#f0e060'], hi: ['#60d0a0', '#e0ffd0'], oni: ['#4a8a3a', '#e0c070'], ninja: ['#244a34', '#b0e080'] },
    table: [{ t: 0, id: 'zako', w: 8 }, { t: 20, id: 'hi', w: 4 }, { t: 40, id: 'hayate', w: 5 }, { t: 75, id: 'yumi', w: 4 }, { t: 110, id: 'tate', w: 4 }, { t: 150, id: 'bakudan', w: 3 }, { t: 190, id: 'ninja', w: 3 }, { t: 230, id: 'oni', w: 1.2 }],
    pre: ['二つ目の門は 妖樹の森に あった。', '森の木々は 妖気に 染まり\n人を 襲う 魔物と 化している。\n樹妖の主を 討たねば 森は 死ぬ…'],
    post: ['樹妖の主を 倒した！ 森に 光が 戻る。', '「見事な 腕前だ。 私も 同行しよう」\n弓将・蒼が 仲間に 加わった！'] },
  { id: 3, name: '魔王城', bossName: '魔王・黒蓮', boss: 'bk3', hpMul: 1.65, rateMul: 1.1, capMul: 1.1, dmgMul: 1.25,
    theme: { bg: '#2a1f3a', t1: '#33264a', t2: '#211830', acc: '#4a3a6a' }, bossAt: 300, minis: [150, 240],
    pal: { zako: ['#8a5ab0', '#2a1040'], hayate: ['#b070d0', '#401060'], tate: ['#6a4a8a', '#c04060'], yumi: ['#9a60b0', '#f0c0e0'], bakudan: ['#c03050', '#ffd060'], hi: ['#e05080', '#ffc0d0'], oni: ['#a02040', '#f0d0a0'], ninja: ['#201030', '#e04060'] },
    table: [{ t: 0, id: 'zako', w: 9 }, { t: 30, id: 'hayate', w: 4 }, { t: 50, id: 'hi', w: 3 }, { t: 80, id: 'yumi', w: 4 }, { t: 110, id: 'tate', w: 4 }, { t: 140, id: 'bakudan', w: 3 }, { t: 175, id: 'ninja', w: 3 }, { t: 210, id: 'oni', w: 1.5 }],
    pre: ['魔王城。 そこは 全ての門の 源だった。', '玉座に 座す 魔王・黒蓮。\n「よく ここまで 来た。 余興は 終わりだ」\n三人の 武将が 最後の 戦いに 挑む！'],
    post: ['黒蓮を 倒した…！ 最後の門が 閉じていく。', '乱世に 平和が 戻った。\n三人の 武将の 名は 永く 語り継がれるだろう。\n── 完 ──'] }
];

// ---------- 永続強化 ----------
const MU_SHOP = {
  atk:    { name: '攻撃力',     desc: '与ダメージ +8%',     base: 60, max: 10 },
  hp:     { name: '体力',       desc: '最大HP +10%',        base: 60, max: 10 },
  spd:    { name: '移動速度',   desc: '移動 +4%',           base: 60, max: 8 },
  mag:    { name: '吸引範囲',   desc: '吸引 +10%',          base: 50, max: 8 },
  exp:    { name: '経験値',     desc: '経験値 +8%',         base: 80, max: 8 },
  luck:   { name: '幸運',       desc: 'ドロップ率 +10%',    base: 80, max: 6 },
  revive: { name: '復活',       desc: '1回 復活できる',      base: 400, max: 2 },
  reroll: { name: 'リロール',   desc: '選択肢の振り直し+1', base: 200, max: 3 },
  gauge:  { name: '初期ゲージ', desc: '無双ゲージ +20',     base: 150, max: 4 }
};

// ---------- 効果音 ----------
const MU_SE = {
  gem:   { f: 900, f2: 1400, dur: 0.05, type: 'sine', v: 0.03, gap: 0.04 },
  coin:  { f: 1200, f2: 1800, dur: 0.08, type: 'square', v: 0.03, gap: 0.05 },
  hit:   { f: 220, f2: 110, dur: 0.05, type: 'square', v: 0.035, gap: 0.045 },
  kill:  { f: 380, f2: 140, dur: 0.07, type: 'triangle', v: 0.05, gap: 0.05 },
  hurt:  { f: 160, f2: 50, dur: 0.18, type: 'sawtooth', v: 0.08, gap: 0.1 },
  lvl:   { f: 520, f2: 1040, dur: 0.3, type: 'square', v: 0.06, gap: 0.2 },
  ult:   { f: 140, f2: 900, dur: 0.6, type: 'sawtooth', v: 0.08, gap: 0.5 },
  boss:  { f: 80, f2: 40, dur: 0.8, type: 'sawtooth', v: 0.1, gap: 1 },
  boom:  { f: 120, f2: 40, dur: 0.2, type: 'sawtooth', v: 0.06, gap: 0.08 },
  zap:   { f: 1500, f2: 300, dur: 0.12, type: 'square', v: 0.04, gap: 0.06 },
  sel:   { f: 880, f2: 880, dur: 0.05, type: 'sine', v: 0.06, gap: 0.02 },
  ok:    { f: 440, f2: 880, dur: 0.12, type: 'square', v: 0.05, gap: 0.05 }
};

const MU_BGM = {
  mu_title: { key: 57, scale: 'min', prog: [0, 5, 3, 4], spd: 260, dens: 0.6, oct: 1, arp: 'arp', bass: 'walk', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 101 },
  mu_s1:    { key: 50, scale: 'dor', prog: [0, 3, 6, 4], spd: 150, dens: 0.85, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 0, 1, 0, 1, 0], seed: 111 },
  mu_s2:    { key: 52, scale: 'phr', prog: [0, 1, 5, 4], spd: 145, dens: 0.88, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 1, 1, 0, 1, 0], seed: 112 },
  mu_s3:    { key: 47, scale: 'hm',  prog: [0, 5, 3, 4], spd: 140, dens: 0.9, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 1, 1, 0, 1, 0, 1, 1], seed: 113 },
  mu_endless: { key: 55, scale: 'min', prog: [0, 6, 5, 4], spd: 135, dens: 0.9, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 1, 1, 0, 1, 1], seed: 114 },
  mu_boss1: { key: 43, scale: 'min', prog: [0, 3, 6, 4], spd: 125, dens: 0.92, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 1, 1, 0, 1, 1, 1, 0], seed: 121 },
  mu_boss2: { key: 41, scale: 'phr', prog: [0, 1, 0, 6], spd: 122, dens: 0.92, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 0, 1, 1, 1, 1, 1, 0], seed: 122 },
  mu_boss3: { key: 40, scale: 'hm',  prog: [0, 1, 5, 4], spd: 115, dens: 0.95, oct: 1, arp: 'arp', bass: 'walk', noise: [1, 1, 1, 1, 1, 0, 1, 1], seed: 123 },
  mu_clear: { key: 60, scale: 'maj', prog: [0, 4, 5, 3], spd: 170, dens: 0.8, oct: 1, arp: 'arp', bass: 'walk', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 131 },
  mu_over:  { key: 48, scale: 'min', prog: [0, 6, 5, 4], spd: 400, dens: 0.35, oct: 1, arp: 'pad', bass: 'root', noise: [0, 0, 0, 0, 0, 0, 0, 0], seed: 132 }
};
function muRegisterBGM() {
  if (typeof BGM === 'undefined' || typeof MQ_MUSIC === 'undefined') return;
  BGM.extra = BGM.extra || {};
  if (BGM.extra.mu_title) return;
  for (const k in MU_BGM) BGM.extra[k] = MQ_MUSIC.make(MU_BGM[k]);
}

const Musou = {
  st: 'title', tmr: 0, cur: 0, scur: 0, hcur: 0,
  sv: null, seT: {},
  mode: 'stage', stageIdx: 0, hero: MU_HEROES[0], S: MU_STAGES[0],

  // ===================== セーブ =====================
  defSave() {
    return { coins: 0, shop: { atk: 0, hp: 0, spd: 0, mag: 0, exp: 0, luck: 0, revive: 0, reroll: 0, gauge: 0 }, clear: [false, false, false],
      rec: { endless: { time: 0, kills: 0 }, stage: [{ time: 0, kills: 0 }, { time: 0, kills: 0 }, { time: 0, kills: 0 }] }, runs: 0, totalKills: 0, seen: false };
  },
  loadSave() {
    const d = this.defSave();
    try {
      const p = JSON.parse(localStorage.getItem('musou_save_v2'));
      if (p && typeof p === 'object') {
        if (isFinite(p.coins)) d.coins = p.coins;
        for (const k in d.shop) if (p.shop && isFinite(p.shop[k])) d.shop[k] = Math.min(MU_SHOP[k].max, Math.max(0, p.shop[k] | 0));
        if (Array.isArray(p.clear)) d.clear = [!!p.clear[0], !!p.clear[1], !!p.clear[2]];
        if (p.rec && p.rec.endless) d.rec.endless = { time: +p.rec.endless.time || 0, kills: +p.rec.endless.kills || 0 };
        if (p.rec && Array.isArray(p.rec.stage)) for (let i = 0; i < 3; i++) if (p.rec.stage[i]) d.rec.stage[i] = { time: +p.rec.stage[i].time || 0, kills: +p.rec.stage[i].kills || 0 };
        d.runs = p.runs | 0; d.totalKills = p.totalKills | 0; d.seen = !!p.seen;
      }
    } catch (e) {}
    this.sv = d;
  },
  save() { try { localStorage.setItem('musou_save_v2', JSON.stringify(this.sv)); } catch (e) {} },

  heroUnlocked(i) { const u = MU_HEROES[i].unlock; return u < 0 || this.sv.clear[u]; },
  stageUnlocked(i) { return i === 0 || this.sv.clear[i - 1]; },

  // ===================== 効果音 =====================
  se(k) {
    if (typeof audioCtx === 'undefined' || !audioCtx || !SaveSys.data || SaveSys.data.seVol <= 0) return;
    const d = MU_SE[k]; if (!d) return;
    const now = audioCtx.currentTime;
    if (this.seT[k] && now - this.seT[k] < d.gap) return;
    this.seT[k] = now;
    try {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = d.type; o.frequency.setValueAtTime(d.f, now); o.frequency.exponentialRampToValueAtTime(Math.max(20, d.f2), now + d.dur);
      g.gain.setValueAtTime(d.v * SaveSys.data.seVol, now); g.gain.exponentialRampToValueAtTime(0.0005, now + d.dur);
      o.connect(g); g.connect(audioCtx.destination); o.start(now); o.stop(now + d.dur + 0.02);
    } catch (e) {}
  },
  bgm(n) { if (typeof BGM !== 'undefined') BGM.play(n); },

  // ===================== 初期化・画面遷移 =====================
  init() {
    document.getElementById('gameboy').classList.remove('mode-abyss');
    canvas.width = 200; canvas.height = 300;
    this.loadSave(); muRegisterBGM();
    this.st = 'title'; this.tmr = 0; this.cur = 0; this.story = null; this.res = null;
    this.bgm('mu_title');
  },

  // ===================== ラン開始 =====================
  startRun(mode, stageIdx, heroIdx) {
    this.mode = mode; this.stageIdx = stageIdx; this.hero = MU_HEROES[heroIdx];
    this.S = mode === 'stage' ? MU_STAGES[stageIdx] : MU_STAGES[0];
    const sh = this.sv.shop;
    this.t = 0; this.level = 1; this.exp = 0; this.kills = 0; this.coinsRun = 0; this.uid = 1;
    this.weap = {}; this.pass = {}; this.weap[this.hero.weapon] = { lv: 1, t: 30 };
    this.enemies = []; this.proj = []; this.ebul = []; this.items = []; this.fx = []; this.warn = []; this.parts = []; this.texts = [];
    this.budget = 0; this.boss = null; this.bossDone = false; this.clearT = 0; this.minisDone = {}; this.swarmDone = {}; this.bossCycle = 0;
    this.ult = null; this.gauge = Math.min(100, sh.gauge * 20); this.rerolls = 1 + sh.reroll; this.revive = sh.revive;
    this.p = { x: 0, y: 0, hp: 1, maxHp: 1, fx: 0, fy: 1, inv: 0, step: 0 };
    this.recalc(); this.p.hp = this.p.maxHp;
    this.shake = 0; this.flash = 0; this.msgT = 0; this.msg = '';
    this.cam = { x: 0, y: 0 };
    this.st = 'play';
    this.bgm(mode === 'endless' ? 'mu_endless' : 'mu_s' + (stageIdx + 1));
    if (mode === 'endless') this.themeIdx = 0;
  },

  recalc() {
    const sh = this.sv.shop, ps = this.pass, p = this.p, h = this.hero;
    const oldMax = p.maxHp || 1;
    p.maxHp = Math.round(h.hp * (1 + 0.1 * sh.hp) * (1 + 0.15 * (ps.hp || 0)));
    if (oldMax > 1) p.hp = Math.min(p.maxHp, Math.round(p.hp * p.maxHp / oldMax + (p.maxHp - oldMax) * 0));
    p.spd = 1.3 * h.spd * (1 + 0.04 * sh.spd) * (1 + 0.08 * (ps.spd || 0));
    p.magnet = 38 * (1 + 0.1 * sh.mag) * (1 + 0.25 * (ps.mag || 0));
    this.atk = h.atk * (1 + 0.08 * sh.atk) * (1 + 0.1 * (ps.atk || 0));
    this.cdr = Math.max(0.45, 1 - 0.08 * (ps.cool || 0));
    this.luck = 1 + 0.1 * sh.luck + 0.15 * (ps.luck || 0);
    this.xpMul = (1 + 0.08 * sh.exp) * (1 + 0.1 * (ps.luck || 0));
  },

  needExp() { return Math.round(5 + this.level * 4 + this.level * this.level * 0.3); },
  curStage() { return this.mode === 'endless' ? MU_STAGES[Math.floor(this.t / 10800) % 3] : this.S; },
  secs() { return this.t / 60; },
  // 敵の体力倍率 / ダメージ倍率
  hpMul() { const s = this.secs(); return this.mode === 'endless' ? (1 + s * 0.0085) * (1 + s * s / 150000) * 1.1 : this.S.hpMul * (1 + s * 0.0058); },
  dmgMulE() { const s = this.secs(); return this.mode === 'endless' ? 1 + s / 320 : this.S.dmgMul * (1 + s / 700); },

  // ===================== グリッド / 当たり判定 =====================
  buildGrid() {
    const g = this.grid = {};
    for (const e of this.enemies) { const k = Math.floor(e.x / 32) * 262144 + Math.floor(e.y / 32); (g[k] || (g[k] = [])).push(e); }
  },
  each(x, y, r, cb) {
    const x0 = Math.floor((x - r - 16) / 32), x1 = Math.floor((x + r + 16) / 32), y0 = Math.floor((y - r - 16) / 32), y1 = Math.floor((y + r + 16) / 32);
    for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
      const a = this.grid[cx * 262144 + cy]; if (!a) continue;
      for (let i = 0; i < a.length; i++) { const e = a[i]; if (!e.dead) cb(e); }
    }
  },
  // 円内の敵にダメージ(個体ごとに無敵間隔 icd)
  hitCircle(x, y, r, d, key, icd, kb) {
    let n = 0;
    this.each(x, y, r, e => {
      const dx = e.x - x, dy = e.y - y, rr = r + e.r;
      if (dx * dx + dy * dy > rr * rr) return;
      if (key) { if (!e.ic) e.ic = {}; if ((e.ic[key] || 0) > this.t) return; e.ic[key] = this.t + icd; }
      this.dmg(e, d, kb || 0, Math.atan2(dy, dx)); n++;
    });
    return n;
  },
  nearest(x, y, maxD, skip) {
    let best = null, bd = maxD * maxD;
    for (const e of this.enemies) { if (e.dead || (skip && skip.indexOf(e.uid) >= 0)) continue; const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = e; } }
    return best;
  },
  onScreen(e) { return Math.abs(e.x - this.p.x) < 105 && Math.abs(e.y - this.p.y) < 155; },

  // ===================== ダメージ / 撃破 =====================
  dmg(e, d, kb, ang) {
    if (e.dead) return;
    d = Math.max(1, Math.round(d));
    if (e.type === 'tate') d = Math.max(1, Math.round(d * 0.8));
    e.hp -= d; e.fl = 4;
    if (kb && !e.boss && !e.elite) { e.kx += Math.cos(ang) * kb; e.ky += Math.sin(ang) * kb; }
    if (this.texts.length < 22 && (d >= 18 || e.boss || Math.random() < 0.25)) this.text(e.x, e.y - 8, String(d), e.boss ? '#fc6' : '#fff');
    if (e.hp <= 0) this.kill(e); else this.se('hit');
  },
  kill(e) {
    if (e.dead) return;
    e.dead = true; this.kills++;
    const d = MU_ENEMY[e.type];
    this.gauge = Math.min(100, this.gauge + (e.boss ? 0 : d.gv * 0.7));
    this.part(e.x, e.y, e.boss ? 24 : e.elite ? 10 : 4, e.pal ? e.pal[0] : '#fff');
    if (e.boss) { this.onBossDead(e); return; }
    this.se('kill');
    const lk = this.luck;
    let gv = Math.max(1, Math.round(d.exp * this.xpMul));
    this.items.push({ k: 'gem', x: e.x, y: e.y, v: gv });
    if (Math.random() < 0.07 * lk) this.items.push({ k: 'coin', x: e.x + 4, y: e.y, v: 1 + Math.floor(this.secs() / 120) });
    if (Math.random() < 0.012 * lk) this.items.push({ k: 'meat', x: e.x - 4, y: e.y, v: 0.3 });
    if (Math.random() < 0.004 * lk) this.items.push({ k: 'magnet', x: e.x, y: e.y + 4, v: 0 });
    if (Math.random() < 0.003 * lk) this.items.push({ k: 'bomb', x: e.x, y: e.y - 4, v: 0 });
    if (e.type === 'mini' || (e.type === 'oni' && Math.random() < 0.25 * lk)) this.items.push({ k: 'chest', x: e.x, y: e.y, v: 0 });
    if (e.type === 'bakudan') { this.boomAt(e.x, e.y, 26, 0, true); }
    if (this.items.length > 360) { // 溢れたジェムは統合
      let cnt = 0; this.items = this.items.filter(i => { if (i.k === 'gem' && cnt++ < 60) { this.pendingExp = (this.pendingExp || 0) + i.v; return false; } return true; });
    }
  },
  text(x, y, t, c) { this.texts.push({ x, y, t, c, life: 28 }); },
  part(x, y, n, c) { for (let i = 0; i < n && this.parts.length < 160; i++) { const a = Math.random() * 6.283, s = 0.5 + Math.random() * 1.8; this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 16 + Math.random() * 12, c }); } },
  // 爆発(プレイヤー被弾時は enemyBlast=true)
  boomAt(x, y, r, d, enemyBlast) {
    this.fx.push({ k: 'boom', x, y, r, t: 0, life: 14 });
    this.se('boom');
    if (enemyBlast) { if (this.dist(this.p, { x, y }) < r + 4) this.hurt(18 * this.dmgMulE()); }
    else if (d > 0) this.hitCircle(x, y, r, d, null, 0, 4);
  },
  dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },

  hurt(d) {
    const p = this.p;
    if (p.inv > 0 || this.ult || this.clearT) return;
    d = Math.max(1, Math.round(d));
    p.hp -= d; p.inv = 36; this.shake = 6; this.flash = 6; this.se('hurt');
    this.text(p.x, p.y - 10, '-' + d, '#f55');
    if (p.hp <= 0) {
      if (this.revive > 0) {
        this.revive--; p.hp = Math.round(p.maxHp * 0.6); p.inv = 150; this.msg = '復活！'; this.msgT = 90; this.se('lvl');
        this.ebul.length = 0; this.enemies.forEach(e => { if (!e.boss && this.dist(e, p) < 90) { e.kx += (e.x - p.x) * 0.2; e.ky += (e.y - p.y) * 0.2; } });
        this.fx.push({ k: 'boom', x: p.x, y: p.y, r: 80, t: 0, life: 20 });
      } else this.endRun(false);
    }
  },

  // ===================== 敵の出現 =====================
  pickType() {
    const st = this.curStage(), s = this.secs();
    let tot = 0; const list = [];
    for (const r of st.table) if (s >= r.t) { list.push(r); tot += r.w; }
    let x = Math.random() * tot;
    for (const r of list) { x -= r.w; if (x <= 0) return r.id; }
    return 'zako';
  },
  spawn(type, ang, rad, extra) {
    const d = MU_ENEMY[type], st = this.curStage();
    const a = ang === undefined ? Math.random() * 6.283 : ang, rr = rad || 175 + Math.random() * 25;
    const hm = this.hpMul();
    const e = { uid: this.uid++, type, x: this.p.x + Math.cos(a) * rr, y: this.p.y + Math.sin(a) * rr, hp: Math.round(d.hp * hm * (type === 'mini' ? 1 + this.minisDoneCount() * 0.5 : 1)), r: d.r, kx: 0, ky: 0, fl: 0, t: Math.floor(Math.random() * 60),
      dmg: d.dmg * this.dmgMulE(), spd: d.spd * (0.92 + Math.random() * 0.16), elite: !!d.elite, pal: st.pal[type === 'mini' ? 'oni' : type] || ['#c96', '#963'], ph: 0 };
    e.mhp = e.hp;
    if (extra) Object.assign(e, extra);
    this.enemies.push(e); return e;
  },
  minisDoneCount() { return Object.keys(this.minisDone).length; },

  director() {
    const s = this.secs(), st = this.curStage();
    const fighting = !!this.boss;
    const rate = (this.mode === 'endless' ? 1.7 + s / 20 : 1.5 + s / 24) * st.rateMul * (fighting ? 0.45 : 1);
    this.budget += rate / 60;
    const cap = Math.min(360, (30 + s * 1.25) * st.capMul) * (fighting ? 0.6 : 1);
    while (this.budget >= 1) {
      this.budget--;
      if (this.enemies.length < cap) this.spawn(this.pickType());
    }
    if (this.budget > 3) this.budget = 3;
    // スウォーム(疾風の群れ)
    const k = Math.floor(s / 75);
    if (k >= 1 && !this.swarmDone[k] && !fighting) {
      this.swarmDone[k] = true;
      const n = 14 + k * 3, base = Math.random() * 6.283;
      for (let i = 0; i < n; i++) this.spawn('hayate', base + (i - n / 2) * 0.09, 175);
      this.msg = '妖魔の群れが 迫る！'; this.msgT = 100;
    }
    // 中ボス / ボス
    const minis = this.mode === 'endless' ? [140 + this.bossCycle * 300, 240 + this.bossCycle * 300] : st.minis;
    minis.forEach((t, i) => { if (s >= t && !this.minisDone[this.bossCycle + ':' + i] && !this.boss) { this.minisDone[this.bossCycle + ':' + i] = true; this.spawnMini(); } });
    const bossAt = this.mode === 'endless' ? 300 + this.bossCycle * 300 : st.bossAt;
    if (s >= bossAt && !this.boss && !this.bossDone) this.spawnBoss();
  },
  spawnMini() {
    const e = this.spawn('mini', undefined, 150);
    e.mini = true; this.msg = '強敵 出現！'; this.msgT = 100; this.se('boss');
  },
  spawnBoss() {
    const ids = ['bk1', 'bk2', 'bk3'];
    const bid = this.mode === 'endless' ? ids[this.bossCycle % 3] : this.S.boss;
    const base = { bk1: 3600, bk2: 5300, bk3: 8700 }[bid];
    const cyc = this.mode === 'endless' ? 1 + this.bossCycle * 0.9 : 1;
    const hp = Math.round(base * (this.mode === 'endless' ? this.hpMul() * 0.8 : this.S.hpMul * 0.85) * cyc);
    const e = this.spawn('mini', Math.random() * 6.283, 130, { boss: true, bid, hp, mhp: hp, r: bid === 'bk3' ? 17 : 16, dmg: (bid === 'bk3' ? 24 : 18) * this.dmgMulE(), spd: bid === 'bk2' ? 0.28 : 0.65, bt: 0, ph: 0, pal: ['#fff', '#fff'] });
    e.elite = true;
    this.boss = e; this.bossName = bid === 'bk1' ? '鬼武者' : bid === 'bk2' ? '樹妖の主' : '魔王・黒蓮';
    this.msg = '── ' + this.bossName + ' ──'; this.msgT = 150; this.se('boss');
    this.bgm(bid === 'bk1' ? 'mu_boss1' : bid === 'bk2' ? 'mu_boss2' : 'mu_boss3');
    // 雑魚を一部残して緊張感
    this.enemies.forEach(x => { if (!x.boss && Math.random() < 0.5) { x.hp = 0; x.dead = true; } });
  },
  onBossDead(e) {
    this.boss = null; this.se('boss');
    this.items.push({ k: 'chest', x: e.x, y: e.y, v: 0 }, { k: 'chest', x: e.x + 14, y: e.y, v: 0 });
    for (let i = 0; i < 14; i++) this.items.push({ k: 'coin', x: e.x + (Math.random() - 0.5) * 50, y: e.y + (Math.random() - 0.5) * 50, v: 4 });
    this.fx.push({ k: 'boom', x: e.x, y: e.y, r: 90, t: 0, life: 30 });
    this.ebul.length = 0; this.warn.length = 0;
    this.shake = 14;
    // ボス戦の二段階: 魔王の第二形態
    if (e.bid === 'bk3' && this.mode === 'stage' && !e.second) {
      const e2 = this.spawn('mini', Math.random() * 6.283, 100, { boss: true, bid: 'bk3', second: true, hp: Math.round(e.mhp * 0.8), mhp: Math.round(e.mhp * 0.8), r: 19, dmg: e.dmg * 1.2, spd: 0.8, bt: 0, ph: 0, pal: ['#fff', '#fff'] });
      e2.elite = true; this.boss = e2; this.bossName = '真・黒蓮'; this.msg = '── 真・黒蓮 ──'; this.msgT = 150;
      this.bgm('mu_boss3'); return;
    }
    if (this.mode === 'stage') { this.clearT = 1; this.bgm('mu_clear'); this.msg = 'STAGE CLEAR!!'; this.msgT = 200; }
    else { this.bossCycle++; this.bgm('mu_endless'); this.msg = '撃破！ さらに強い敵が来る…'; this.msgT = 150; }
  },

  // ===================== 敵の行動 =====================
  ebullet(x, y, a, sp, dmg, col, r) {
    if (this.ebul.length > 420) return;
    this.ebul.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, d: dmg, r: r || 3, life: 360, c: col || '#f64' });
  },
  updEnemies() {
    const p = this.p;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.t++;
      const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
      let mx = dx / dist, my = dy / dist, sp = e.spd;
      if (e.boss) this.bossAI(e, dx, dy, dist);
      else switch (e.type) {
        case 'yumi': // 距離をとって射撃
          if (dist < 80) sp = -e.spd * 0.8; else if (dist < 105) sp = 0;
          if (e.t % 130 === 0 && dist < 190) this.ebullet(e.x, e.y, Math.atan2(dy, dx), 1.5, 7 * this.dmgMulE(), '#fd8', 3);
          break;
        case 'hi': { const w = Math.sin(e.t * 0.08) * 0.9; const c = Math.cos(w), s2 = Math.sin(w); const nx = mx * c - my * s2, ny = mx * s2 + my * c; mx = nx; my = ny; break; }
        case 'ninja':
          if (e.t % 110 === 0) e.dash = 18;
          if (e.dash > 0) { e.dash--; sp = e.spd * 3.6; }
          break;
        case 'mini': this.miniAI(e, dx, dy, dist); sp = e.mv === undefined ? e.spd : e.mv; mx = e.dx !== undefined ? e.dx : mx; my = e.dy !== undefined ? e.dy : my; break;
      }
      if (!e.boss) {
        e.x += mx * sp + e.kx; e.y += my * sp + e.ky;
      } else { e.x += e.kx; e.y += e.ky; }
      e.kx *= 0.82; e.ky *= 0.82;
      if (e.fl > 0) e.fl--;
      // 離れすぎた敵は戻す
      if (!e.boss && dist > 420) { const a = Math.random() * 6.283; e.x = p.x + Math.cos(a) * 190; e.y = p.y + Math.sin(a) * 190; }
      // 接触
      if (dist < e.r + 5) {
        if (e.type === 'bakudan') { e.hp = 0; this.kill(e); }
        else this.hurt(e.dmg);
      }
    }
    // 重なり緩和(軽い分離): 近接セルのみ
    const g = this.grid;
    for (const e of this.enemies) {
      if (e.dead || e.boss) continue;
      const a = g[Math.floor(e.x / 32) * 262144 + Math.floor(e.y / 32)]; if (!a || a.length < 2) continue;
      for (let i = 0; i < a.length && i < 6; i++) { const o = a[i]; if (o === e || o.dead || o.boss) continue; const dx = e.x - o.x, dy = e.y - o.y, d2 = dx * dx + dy * dy, m = e.r + o.r - 2; if (d2 < m * m && d2 > 0.01) { const d = Math.sqrt(d2), f = (m - d) * 0.06; e.x += dx / d * f; e.y += dy / d * f; } }
    }
  },
  // 突進型の中ボス
  miniAI(e, dx, dy, dist) {
    e.bt = (e.bt || 0) + 1;
    const cyc = e.bt % 260;
    if (cyc < 120) { e.mv = e.spd; e.dx = undefined; e.dy = undefined; }
    else if (cyc < 150) { e.mv = 0; e.dx = dx / dist; e.dy = dy / dist; if (cyc === 120) this.warn.push({ k: 'line', x: e.x, y: e.y, ang: Math.atan2(dy, dx), len: 110, t: 0, max: 30, d: 0 }); }
    else if (cyc < 185) { e.mv = 4.2; if (cyc === 150) { e.dx = Math.cos(Math.atan2(dy, dx)); e.dy = Math.sin(Math.atan2(dy, dx)); } }
    else { e.mv = 0; e.dx = 0; e.dy = 0; }
  },
  bossAI(e, dx, dy, dist) {
    const p = this.p; e.bt++;
    const ratio = e.hp / e.mhp, ang = Math.atan2(dy, dx);
    const walk = (s) => { e.x += dx / dist * s; e.y += dy / dist * s; };
    if (e.bid === 'bk1') { // 鬼武者: 追跡→突進予告→突進→衝撃波
      const en = ratio < 0.5, cyc = e.bt % (en ? 230 : 290);
      if (cyc < (en ? 70 : 120)) walk(e.spd * (en ? 1.5 : 1));
      else if (cyc < (en ? 100 : 150)) { if (cyc === (en ? 70 : 120)) { e.ca = ang; this.warn.push({ k: 'line', x: e.x, y: e.y, ang, len: 140, t: 0, max: 30, d: 0 }); } }
      else if (cyc < (en ? 140 : 190)) { e.x += Math.cos(e.ca) * 4.8; e.y += Math.sin(e.ca) * 4.8; }
      else if (cyc === (en ? 150 : 200)) {
        const n = en ? 22 : 14; for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, i * 6.283 / n + e.bt * 0.01, 1.7, 12 * this.dmgMulE(), '#f64', 4);
        this.warn.push({ k: 'circle', x: e.x, y: e.y, r: 52, t: 0, max: 20, d: 20 * this.dmgMulE() }); this.shake = 8; this.se('boom');
        if (en) for (let i = 0; i < 4; i++) this.spawn('zako', Math.random() * 6.283, 70);
      }
    } else if (e.bid === 'bk2') { // 樹妖の主: 根の攻撃 + 螺旋弾
      const en = ratio < 0.5;
      walk(e.spd);
      if (e.bt % (en ? 120 : 170) === 0) { for (let i = 0; i < (en ? 5 : 3); i++) { const o = i === 0 ? 0 : 38; const a = Math.random() * 6.283; this.warn.push({ k: 'circle', x: p.x + Math.cos(a) * o, y: p.y + Math.sin(a) * o, r: 24, t: 0, max: 70, d: 24 * this.dmgMulE(), root: true }); } }
      if (e.bt % (en ? 7 : 10) === 0) { const n = en ? 3 : 2; for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, e.bt * 0.11 + i * 6.283 / n, 1.35, 9 * this.dmgMulE(), '#8e4', 3); }
      if (e.bt % 420 === 0) for (let i = 0; i < 6; i++) this.spawn('hi', undefined, 80);
    } else { // 魔王・黒蓮
      const p3 = ratio < 0.3 || e.second, p2 = ratio < 0.6;
      if (e.bt % (p3 ? 130 : 200) === 0) { const a = Math.random() * 6.283; e.x = p.x + Math.cos(a) * 95; e.y = p.y + Math.sin(a) * 95; this.fx.push({ k: 'boom', x: e.x, y: e.y, r: 30, t: 0, life: 12 }); e.fan = 24; }
      if (e.fan > 0) { e.fan--; if (e.fan === 12) { const n = p3 ? 7 : 5; for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, ang + (i - (n - 1) / 2) * 0.24, 1.9, 12 * this.dmgMulE(), '#c4f', 3); } }
      if (e.bt % (p3 ? 100 : 140) === 60) { const n = p3 ? 26 : 16; for (let i = 0; i < n; i++) this.ebullet(e.x, e.y, i * 6.283 / n + e.bt * 0.02, 1.3, 10 * this.dmgMulE(), '#f4a', 3); }
      if (p2 && e.bt % 6 === 0) { this.ebullet(e.x, e.y, e.bt * 0.16, 1.5, 8 * this.dmgMulE(), '#fa6', 3); if (p3) this.ebullet(e.x, e.y, e.bt * 0.16 + 3.14, 1.5, 8 * this.dmgMulE(), '#fa6', 3); }
      if (p2 && e.bt % 560 === 0) for (let i = 0; i < 3; i++) this.spawn('oni', undefined, 90);
      if (dist > 130) walk(0.5);
    }
  },
  updEbul() {
    const p = this.p;
    for (const b of this.ebul) {
      b.x += b.vx; b.y += b.vy; b.life--;
      if (Math.abs(b.x - p.x) < b.r + 4 && Math.abs(b.y - p.y) < b.r + 4 && Math.hypot(b.x - p.x, b.y - p.y) < b.r + 4) { b.life = 0; this.hurt(b.d); }
    }
    this.ebul = this.ebul.filter(b => b.life > 0 && Math.abs(b.x - p.x) < 260 && Math.abs(b.y - p.y) < 300);
  },
  updWarn() {
    for (const w of this.warn) {
      w.t++;
      if (w.t >= w.max) {
        w.done = true;
        if (w.k === 'circle') { this.fx.push({ k: 'boom', x: w.x, y: w.y, r: w.r, t: 0, life: 12, bad: true }); if (this.dist(this.p, w) < w.r + 3) this.hurt(w.d); }
      }
    }
    this.warn = this.warn.filter(w => !w.done);
  },

  // ===================== 武器 =====================
  addWeapon(id) { if (!this.weap[id]) this.weap[id] = { lv: 1, t: 20 }; else if (this.weap[id].lv < 8) this.weap[id].lv++; },
  facing() { const p = this.p; return Math.atan2(p.fy, p.fx); },
  updWeapons() {
    for (const id in this.weap) { const w = this.weap[id]; w.evo = w.lv >= 9; this[id + 'W'](w); }
  },
  dm(x) { return x * this.atk * this.ultMul(); },
  ultMul() { return 1; },
  cdOf(w, base) { return base * this.cdr; },

  bladeW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    const n = 2 + (lv >> 1) + (ev ? 3 : 0), R = (26 + lv * 1.6) * (ev ? 1.5 : 1), d = this.dm((8 + lv * 3.2) * (ev ? 2 : 1));
    w.ang = (w.ang || 0) + (0.07 + lv * 0.004) * (ev ? 1.4 : 1) / Math.max(0.6, this.cdr + 0.2);
    w.pos = [];
    for (let i = 0; i < n; i++) {
      const a = w.ang + i * 6.283 / n, x = this.p.x + Math.cos(a) * R, y = this.p.y + Math.sin(a) * R;
      w.pos.push({ x, y, a });
      this.hitCircle(x, y, ev ? 10 : 7, d, 'bl' + i, 14, 3);
    }
  },
  magicW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 46 - lv * 2.5 + (ev ? 14 : 0));
    const n = (ev ? 6 : 1 + ((lv + 1) / 3 | 0));
    for (let i = 0; i < n; i++) {
      const tg = this.nearest(this.p.x, this.p.y, 170) || null;
      const a = tg ? Math.atan2(tg.y - this.p.y, tg.x - this.p.x) : Math.random() * 6.283;
      this.proj.push({ k: 'bolt', x: this.p.x, y: this.p.y, vx: Math.cos(a + (i - n / 2) * 0.3) * 2.8, vy: Math.sin(a + (i - n / 2) * 0.3) * 2.8, d: this.dm((10 + lv * 4.2) * (ev ? 1.6 : 1)), pierce: 1, life: 110, r: 4, hits: [], home: true, splash: ev, c: '#c8f' });
    }
  },
  arrowW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 44 - lv * 2 + (ev ? 20 : 0));
    const tg = this.nearest(this.p.x, this.p.y, 190);
    const a0 = tg ? Math.atan2(tg.y - this.p.y, tg.x - this.p.x) : this.facing();
    const n = ev ? 14 : 1 + ((lv / 3) | 0);
    for (let i = 0; i < n; i++) {
      const a = ev ? a0 + i * 6.283 / n : a0 + (i - (n - 1) / 2) * 0.14;
      this.proj.push({ k: 'arrow', x: this.p.x, y: this.p.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, d: this.dm((10 + lv * 3.6) * (ev ? 1.4 : 1)), pierce: 2 + (lv >> 1) + (ev ? 3 : 0), life: 60, r: 4, hits: [], a, c: '#bf8' });
    }
    this.se('zap');
  },
  thunderW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 76 - lv * 4);
    const n = 1 + (lv >> 1) + (ev ? 3 : 0);
    const vis = this.enemies.filter(e => !e.dead && this.onScreen(e));
    for (let i = 0; i < n && vis.length; i++) {
      const e = vis.splice(Math.floor(Math.random() * vis.length), 1)[0];
      this.fx.push({ k: 'bolt', x: e.x, y: e.y, t: 0, life: 10 });
      this.hitCircle(e.x, e.y, 18 + (ev ? 10 : 0), this.dm((20 + lv * 7) * (ev ? 1.6 : 1)), null, 0, 3);
      this.se('zap');
    }
  },
  fireW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    w.R = (30 + lv * 3.2) * (ev ? 1.6 : 1);
    if (this.t % 15 === 0) this.hitCircle(this.p.x, this.p.y, w.R, this.dm((5 + lv * 2.4) * (ev ? 2 : 1)), 'fire', 14, 1);
  },
  bombW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 96 - lv * 5);
    const n = 1 + (lv / 3 | 0) + (ev ? 3 : 0);
    for (let i = 0; i < n; i++) {
      const tg = this.nearest(this.p.x + (Math.random() - 0.5) * 60, this.p.y + (Math.random() - 0.5) * 60, 150) || { x: this.p.x + (Math.random() - 0.5) * 100, y: this.p.y + (Math.random() - 0.5) * 100 };
      this.fx.push({ k: 'bomb', x: tg.x, y: tg.y, t: 0, life: 36, r: (26 + lv * 2) * (ev ? 1.5 : 1), d: this.dm((30 + lv * 9) * (ev ? 1.7 : 1)) });
    }
  },
  holeW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 250 - lv * 12);
    let tg = this.nearest(this.p.x, this.p.y, 140); if (!tg) return;
    this.fx.push({ k: 'hole', x: tg.x, y: tg.y, t: 0, life: 130 + lv * 10 + (ev ? 80 : 0), r: (60 + lv * 3) * (ev ? 1.5 : 1), d: this.dm((4 + lv * 1.6) * (ev ? 2 : 1)), ev });
  },
  shuriW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 84 - lv * 5);
    const n = 1 + (lv / 3 | 0) + (ev ? 2 : 0);
    for (let i = 0; i < n; i++) {
      const tg = this.nearest(this.p.x, this.p.y, 170); const a = (tg ? Math.atan2(tg.y - this.p.y, tg.x - this.p.x) : Math.random() * 6.283) + (i - (n - 1) / 2) * 0.5;
      this.proj.push({ k: 'shuri', x: this.p.x, y: this.p.y, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, d: this.dm((12 + lv * 4) * (ev ? 1.5 : 1)), pierce: 999, life: 100, r: ev ? 9 : 6, hits: [], out: 45, rehit: true, c: '#cde' });
    }
  },
  waveW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    if (--w.t > 0) return;
    w.t = this.cdOf(w, 76 - lv * 4);
    const a = this.facing(); const dirs = ev ? [a, a + Math.PI] : [a];
    for (const aa of dirs) this.proj.push({ k: 'wave', x: this.p.x + Math.cos(aa) * 10, y: this.p.y + Math.sin(aa) * 10, vx: Math.cos(aa) * 3.4, vy: Math.sin(aa) * 3.4, d: this.dm((14 + lv * 5) * (ev ? 1.5 : 1)), pierce: 999, life: 34, r: 15 + lv + (ev ? 6 : 0), hits: [], a: aa, c: '#8ef' });
    this.se('zap');
  },
  spiritW(w) {
    const lv = Math.min(8, w.lv), ev = w.evo;
    const n = 2 + (lv / 3 | 0) + (ev ? 3 : 0);
    w.ang = (w.ang || 0) + 0.045; w.pos = [];
    for (let i = 0; i < n; i++) {
      const a = w.ang * (1 + (i % 2) * 0.4) + i * 6.283 / n, R = 42 + Math.sin(this.t * 0.04 + i * 1.7) * 26;
      const x = this.p.x + Math.cos(a) * R, y = this.p.y + Math.sin(a) * R; w.pos.push({ x, y });
      this.hitCircle(x, y, 8 + (ev ? 3 : 0), this.dm((9 + lv * 3) * (ev ? 1.8 : 1)), 'sp' + i, 12, 2);
    }
  },

  updProj() {
    const p = this.p;
    for (const b of this.proj) {
      b.life--;
      if (b.k === 'bolt' && b.home) {
        const tg = this.nearest(b.x, b.y, 120, b.hits);
        if (tg) { const a = Math.atan2(tg.y - b.y, tg.x - b.x), c = Math.atan2(b.vy, b.vx); let da = a - c; while (da > 3.14) da -= 6.283; while (da < -3.14) da += 6.283; const na = c + Math.max(-0.12, Math.min(0.12, da)); b.vx = Math.cos(na) * 2.8; b.vy = Math.sin(na) * 2.8; }
      }
      if (b.k === 'shuri') {
        if (b.out > 0) b.out--; else { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1; b.vx = dx / d * 3.6; b.vy = dy / d * 3.6; if (d < 8) b.life = 0; if (b.out === 0) { b.out = -1; b.hits.length = 0; } }
      }
      b.x += b.vx; b.y += b.vy;
      this.each(b.x, b.y, b.r, e => {
        if (b.life <= 0 && b.k !== 'shuri') return;
        if (b.hits.indexOf(e.uid) >= 0) return;
        const dx = e.x - b.x, dy = e.y - b.y, rr = b.r + e.r; if (dx * dx + dy * dy > rr * rr) return;
        if (b.hits.length < 40) b.hits.push(e.uid);
        this.dmg(e, b.d, 2, Math.atan2(b.vy, b.vx));
        if (b.splash) this.hitCircle(e.x, e.y, 20, b.d * 0.5, null, 0, 2);
        if (--b.pierce <= 0) b.life = 0;
      });
    }
    this.proj = this.proj.filter(b => b.life > 0);
  },
  updFx() {
    for (const f of this.fx) {
      f.t++;
      if (f.k === 'bomb' && f.t === f.life) { this.boomAt(f.x, f.y, f.r, f.d, false); }
      if (f.k === 'hole') {
        this.each(f.x, f.y, f.r, e => { if (e.boss) return; const dx = f.x - e.x, dy = f.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < f.r) { e.x += dx / d * 1.3; e.y += dy / d * 1.3; } });
        if (f.t % 10 === 0) this.hitCircle(f.x, f.y, f.r * 0.55, f.d, 'hole' + (f.x | 0), 9, 0);
        if (f.ev && f.t === f.life) this.boomAt(f.x, f.y, f.r, f.d * 12, false);
      }
    }
    this.fx = this.fx.filter(f => f.t < f.life + (f.k === 'bomb' ? 14 : 0));
  },

  // ===================== 無双乱舞 =====================
  startUlt() {
    if (this.gauge < 100 || this.ult || this.clearT) return;
    this.gauge = 0; this.se('ult'); this.shake = 10; this.flash = 8;
    const k = this.hero.ult;
    this.ult = { k, t: 0, dur: k === 'whirl' ? 130 : k === 'thunder' ? 100 : 70 };
    this.ebul.length = 0;
  },
  updUlt() {
    const u = this.ult; if (!u) return;
    u.t++; const p = this.p, lvm = 1 + this.level * 0.05;
    if (u.k === 'whirl') {
      u.R = 70 + Math.min(40, u.t); this.hitCircle(p.x, p.y, u.R, 28 * this.atk * lvm, 'ult', 7, 7);
      if (u.t % 12 === 0) this.ebul = this.ebul.filter(b => Math.hypot(b.x - p.x, b.y - p.y) > u.R);
    } else if (u.k === 'thunder') {
      if (u.t % 3 === 0) { const vis = this.enemies.filter(e => !e.dead && this.onScreen(e)); if (vis.length) { const e = vis[Math.floor(Math.random() * vis.length)]; this.fx.push({ k: 'bolt', x: e.x, y: e.y, t: 0, life: 10 }); this.hitCircle(e.x, e.y, 30, 75 * this.atk * lvm, null, 0, 4); this.se('zap'); } }
    } else if (u.k === 'arrows') {
      if (u.t % 22 === 1) { const n = 30, o = u.t * 0.05; for (let i = 0; i < n; i++) { const a = o + i * 6.283 / n; this.proj.push({ k: 'arrow', x: p.x, y: p.y, vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2, d: 48 * this.atk * lvm, pierce: 99, life: 75, r: 4, hits: [], a, c: '#fe8' }); } this.se('zap'); }
    }
    if (u.t >= u.dur) this.ult = null;
  },

  // ===================== アイテム =====================
  updItems() {
    const p = this.p;
    if (this.pendingExp) { this.addExp(this.pendingExp); this.pendingExp = 0; }
    for (const it of this.items) {
      const dx = p.x - it.x, dy = p.y - it.y, d = Math.hypot(dx, dy);
      if (it.pull || (d < p.magnet && it.k !== 'chest')) { it.pull = true; const s = Math.min(d, 3.2 + (it.t = (it.t || 0) + 0.15)); it.x += dx / (d || 1) * s; it.y += dy / (d || 1) * s; }
      if (d < 9) it.got = true;
      if (it.got) this.pickup(it);
    }
    this.items = this.items.filter(i => !i.got);
  },
  pickup(it) {
    const p = this.p;
    if (it.k === 'gem') { this.addExp(it.v); this.se('gem'); }
    else if (it.k === 'coin') { this.coinsRun += it.v; this.se('coin'); }
    else if (it.k === 'meat') { p.hp = Math.min(p.maxHp, p.hp + p.maxHp * it.v); this.text(p.x, p.y - 10, '+' + Math.round(p.maxHp * it.v), '#6f6'); this.se('coin'); }
    else if (it.k === 'magnet') { this.items.forEach(i => { if (i.k !== 'chest') i.pull = true; }); this.msg = '吸引！'; this.msgT = 60; this.se('coin'); }
    else if (it.k === 'bomb') { this.enemies.forEach(e => { if (!e.boss && this.onScreen(e)) this.dmg(e, 80 * this.atk, 0, 0); }); this.fx.push({ k: 'boom', x: p.x, y: p.y, r: 120, t: 0, life: 20 }); this.shake = 10; this.se('boom'); }
    else if (it.k === 'chest') { this.openChest(); }
  },
  addExp(v) {
    this.exp += v;
    if (this.exp >= this.needExp() && this.st === 'play') {
      this.exp -= this.needExp(); this.level++; this.se('lvl');
      this.choices = this.genChoices(3); this.ccur = 0; this.st = 'levelup'; this.lvQueue = 0;
    } else if (this.exp >= this.needExp()) this.lvQueue = (this.lvQueue || 0) + 1;
  },

  // ===================== レベルアップ選択 =====================
  evoReady(id) { const w = this.weap[id]; return w && w.lv === 8 && (this.pass[MU_WEAPONS[id].need] || 0) >= 1; },
  genChoices(n) {
    const pool = [];
    for (const id in this.weap) {
      const w = this.weap[id];
      if (this.evoReady(id)) pool.push({ t: 'evo', id, w: 6 });
      else if (w.lv < 8) pool.push({ t: 'wup', id, w: 3 });
    }
    if (Object.keys(this.weap).length < 6) for (const id in MU_WEAPONS) if (!this.weap[id]) pool.push({ t: 'wnew', id, w: 2 });
    for (const id in MU_PASSIVES) { const lv = this.pass[id] || 0; if (lv < 5 && (lv > 0 || Object.keys(this.pass).length < 6)) pool.push({ t: 'pas', id, w: lv > 0 ? 2.5 : 1.5 }); }
    const out = [];
    while (out.length < n && pool.length) {
      let tot = 0; pool.forEach(c => tot += c.w); let x = Math.random() * tot, i = 0;
      for (; i < pool.length; i++) { x -= pool[i].w; if (x <= 0) break; }
      out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
    }
    if (!out.length) out.push({ t: 'heal' });
    return out;
  },
  choiceText(c) {
    if (c.t === 'evo') return { name: '【覚醒】' + MU_WEAPONS[c.id].evo, sub: MU_WEAPONS[c.id].name + 'が 究極形態へ！', ch: MU_WEAPONS[c.id].ch, col: '#fe4' };
    if (c.t === 'wup') { const w = this.weap[c.id]; return { name: MU_WEAPONS[c.id].name + ' Lv' + (w.lv + 1), sub: MU_WEAPONS[c.id].desc, ch: MU_WEAPONS[c.id].ch, col: MU_WEAPONS[c.id].col }; }
    if (c.t === 'wnew') return { name: '新: ' + MU_WEAPONS[c.id].name, sub: MU_WEAPONS[c.id].desc, ch: MU_WEAPONS[c.id].ch, col: MU_WEAPONS[c.id].col };
    if (c.t === 'pas') return { name: MU_PASSIVES[c.id].name + ' Lv' + ((this.pass[c.id] || 0) + 1), sub: MU_PASSIVES[c.id].desc, ch: MU_PASSIVES[c.id].ch, col: MU_PASSIVES[c.id].col };
    return { name: '回復', sub: 'HPを 全回復する', ch: '癒', col: '#6f6' };
  },
  applyChoice(c) {
    if (c.t === 'evo') { this.weap[c.id].lv = 9; this.msg = MU_WEAPONS[c.id].evo + ' 覚醒！'; this.msgT = 120; this.shake = 8; }
    else if (c.t === 'wup' || c.t === 'wnew') this.addWeapon(c.id);
    else if (c.t === 'pas') this.pass[c.id] = (this.pass[c.id] || 0) + 1;
    else this.p.hp = this.p.maxHp;
    this.recalc();
  },
  openChest() {
    const evo = Object.keys(this.weap).filter(id => this.evoReady(id));
    let c;
    if (evo.length) c = { t: 'evo', id: evo[0] };
    else { const ch = this.genChoices(3).filter(x => x.t !== 'heal'); c = ch.length ? ch[Math.floor(Math.random() * ch.length)] : { t: 'heal' }; }
    this.chestC = c; this.chestT = 0; this.st = 'chest'; this.se('lvl');
  },

  // ===================== 進行 =====================
  endRun(cleared) {
    const s = this.secs(), sv = this.sv;
    let coins = Math.floor(this.kills / 10) + this.coinsRun + (cleared ? 120 * (this.stageIdx + 1) : 0) + Math.floor(s / 30);
    sv.coins += coins; sv.runs++; sv.totalKills += this.kills;
    let nu = [];
    if (this.mode === 'endless') { const r = sv.rec.endless; if (s > r.time) { r.time = Math.round(s); r.kills = this.kills; r.nw = true; } }
    else { const r = sv.rec.stage[this.stageIdx]; if (cleared && (!r.time || s < r.time)) { r.time = Math.round(s); r.kills = this.kills; } if (cleared && !sv.clear[this.stageIdx]) { sv.clear[this.stageIdx] = true; if (this.stageIdx < 2) nu.push(MU_HEROES[this.stageIdx + 1].name); } }
    this.save();
    this.res = { cleared, coins, time: Math.round(s), kills: this.kills, level: this.level, nu, rec: this.mode === 'endless' ? sv.rec.endless.time === Math.round(s) && sv.rec.endless.nw : false };
    sv.rec.endless.nw = false;
    this.st = 'result'; this.tmr = 0; this.bgm(cleared ? 'mu_clear' : 'mu_over');
  },
  openStory(pages, cb) { this.story = { pages, i: 0, ci: 0, cb }; this.st = 'story'; },

  // ===================== メイン更新 =====================
  update() {
    this.tmr++;
    const kd = keysDown;
    switch (this.st) {
      case 'title': return this.updTitle(kd);
      case 'stages': return this.updStages(kd);
      case 'heroes': return this.updHeroes(kd);
      case 'shop': return this.updShop(kd);
      case 'records': if (kd.b || kd.a || kd.select) { this.st = 'title'; this.se('sel'); } return;
      case 'story': return this.updStory(kd);
      case 'play': return this.updPlay(kd);
      case 'pause': return this.updPause(kd);
      case 'levelup': return this.updLevelUp(kd);
      case 'chest': this.chestT++; if (this.chestT > 40 && kd.a) { this.applyChoice(this.chestC); this.st = 'play'; this.se('ok'); } return;
      case 'result': if (this.tmr > 40 && (kd.a || kd.b)) { this.afterResult(); } return;
    }
  },
  updTitle(kd) {
    const n = 5;
    if (kd.up) { this.cur = (this.cur + n - 1) % n; this.se('sel'); }
    if (kd.down) { this.cur = (this.cur + 1) % n; this.se('sel'); }
    if (kd.select || kd.b) { switchApp(Menu); return; }
    if (kd.a) {
      this.se('ok');
      if (this.cur === 0) { this.st = 'stages'; this.scur = 0; }
      else if (this.cur === 1) { this.pendingMode = 'endless'; this.st = 'heroes'; this.hcur = 0; }
      else if (this.cur === 2) { this.st = 'shop'; this.cur2 = 0; }
      else if (this.cur === 3) this.st = 'records';
      else switchApp(Menu);
    }
  },
  updStages(kd) {
    if (kd.up) { this.scur = (this.scur + 2) % 3; this.se('sel'); }
    if (kd.down) { this.scur = (this.scur + 1) % 3; this.se('sel'); }
    if (kd.b || kd.select) { this.st = 'title'; this.se('sel'); return; }
    if (kd.a) { if (!this.stageUnlocked(this.scur)) { this.se('hurt'); return; } this.pendingMode = 'stage'; this.st = 'heroes'; this.hcur = 0; this.se('ok'); }
  },
  updHeroes(kd) {
    if (kd.left) { this.hcur = (this.hcur + 2) % 3; this.se('sel'); }
    if (kd.right) { this.hcur = (this.hcur + 1) % 3; this.se('sel'); }
    if (kd.b || kd.select) { this.st = this.pendingMode === 'stage' ? 'stages' : 'title'; this.se('sel'); return; }
    if (kd.a) {
      if (!this.heroUnlocked(this.hcur)) { this.se('hurt'); return; }
      this.se('ok');
      if (this.pendingMode === 'stage') {
        const si = this.scur, hi = this.hcur, S = MU_STAGES[si];
        const pages = (si === 0 && !this.sv.seen ? ['乱世。 異界の門が 開き 妖魔の軍勢が 人の世に あふれ出した。', '門を操るのは 魔王・黒蓮。\nこの世を 闇に 沈めんとする 者…'] : []).concat(['第' + S.id + '章 「' + S.name + '」']).concat(S.pre);
        this.sv.seen = true; this.save();
        this.openStory(pages, () => this.startRun('stage', si, hi));
      } else this.startRun('endless', 0, this.hcur);
    }
  },
  updShop(kd) {
    const keys2 = Object.keys(MU_SHOP), n = keys2.length + 1;
    if (kd.up) { this.cur2 = (this.cur2 + n - 1) % n; this.se('sel'); }
    if (kd.down) { this.cur2 = (this.cur2 + 1) % n; this.se('sel'); }
    if (kd.b || kd.select) { this.st = 'title'; this.se('sel'); return; }
    if (kd.a) {
      if (this.cur2 === keys2.length) { this.st = 'title'; this.se('sel'); return; }
      const k = keys2[this.cur2], it = MU_SHOP[k], lv = this.sv.shop[k], cost = this.shopCost(k);
      if (lv >= it.max || this.sv.coins < cost) { this.se('hurt'); return; }
      this.sv.coins -= cost; this.sv.shop[k]++; this.save(); this.se('lvl');
    }
  },
  shopCost(k) { const it = MU_SHOP[k], lv = this.sv.shop[k]; return Math.round(it.base * (1 + lv * 0.9)); },
  updStory(kd) {
    const s = this.story; const len = s.pages[s.i].length;
    if (s.ci < len) { s.ci += 1.5; if (kd.a) s.ci = len; return; }
    if (kd.a) { s.i++; s.ci = 0; this.se('sel'); if (s.i >= s.pages.length) { const cb = s.cb; this.story = null; if (cb) cb(); } }
  },
  updPause(kd) {
    if (kd.up || kd.down) { this.pcur = ((this.pcur || 0) + 1) % 2; this.se('sel'); }
    if (kd.b || kd.select) { this.st = 'play'; this.se('sel'); return; }
    if (kd.a) { if ((this.pcur || 0) === 0) { this.st = 'play'; this.se('ok'); } else this.endRun(false); }
  },
  updLevelUp(kd) {
    const n = this.choices.length + 1; // 最後=リロール
    if (kd.up) { this.ccur = (this.ccur + n - 1) % n; this.se('sel'); }
    if (kd.down) { this.ccur = (this.ccur + 1) % n; this.se('sel'); }
    if (kd.a) {
      if (this.ccur < this.choices.length) {
        this.applyChoice(this.choices[this.ccur]); this.se('ok'); this.st = 'play';
        if (this.lvQueue > 0) { this.lvQueue--; if (this.exp >= this.needExp()) { this.exp -= this.needExp(); this.level++; this.choices = this.genChoices(3); this.ccur = 0; this.st = 'levelup'; this.se('lvl'); } }
      } else if (this.rerolls > 0) { this.rerolls--; this.choices = this.genChoices(3); this.ccur = 0; this.se('ok'); } else this.se('hurt');
    }
  },
  afterResult() {
    if (this.res.cleared && this.mode === 'stage') {
      const S = MU_STAGES[this.stageIdx];
      this.st = 'title'; this.cur = 0;
      this.bgm('mu_title');
      this.openStory(S.post.concat(this.res.nu.length ? [this.res.nu.join('・') + 'が 使えるようになった！'] : []), () => { this.st = 'title'; this.bgm('mu_title'); });
    } else { this.st = 'title'; this.cur = 0; this.bgm('mu_title'); }
  },

  updPlay(kd) {
    const p = this.p;
    if (kd.b || kd.select) { this.st = 'pause'; this.pcur = 0; this.se('sel'); return; }
    if (kd.a) this.startUlt();
    // 移動
    let mx = 0, my = 0;
    if (keys.left) mx--; if (keys.right) mx++; if (keys.up) my--; if (keys.down) my++;
    if (mx || my) { const l = Math.hypot(mx, my); mx /= l; my /= l; p.fx = mx; p.fy = my; p.step++; }
    const spd = this.ult && this.ult.k === 'whirl' ? p.spd * 0.6 : p.spd;
    p.x += mx * spd; p.y += my * spd;
    if (p.inv > 0) p.inv--;
    if (this.clearT) {
      this.clearT++;
      this.enemies.forEach(e => { if (!e.dead) { e.hp = 0; this.kill(e); } });
      this.ebul.length = 0;
      if (this.clearT === 150) { this.endRun(true); return; }
    } else this.t++;
    this.t += 0; // t は clearT 中は止める
    this.buildGrid();
    this.updWeapons(); this.updUlt(); this.updProj(); this.updFx();
    this.updEnemies(); this.updEbul(); this.updWarn();
    if (!this.clearT) this.director();
    this.updItems();
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.boss && this.boss.dead) this.boss = null;
    // 演出
    for (const q of this.parts) { q.x += q.vx; q.y += q.vy; q.vx *= 0.94; q.vy *= 0.94; q.life--; }
    this.parts = this.parts.filter(q => q.life > 0);
    for (const q of this.texts) { q.y -= 0.5; q.life--; }
    this.texts = this.texts.filter(q => q.life > 0);
    if (this.shake > 0) this.shake--; if (this.flash > 0) this.flash--; if (this.msgT > 0) this.msgT--;
    this.cam.x += (p.x - this.cam.x) * 0.2; this.cam.y += (p.y - this.cam.y) * 0.2;
    // 自然回復はなし。ステージモードの時間表示は t を使う
  }
};
