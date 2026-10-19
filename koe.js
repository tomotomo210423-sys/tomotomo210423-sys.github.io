// === KOE (声) — フォルマント音声合成エンジン ===
// サンプル音声も読み上げ機能も使わず、声帯の波形と口の共鳴フィルタから声を1サンプルずつ合成する。
// 元: koe.html(ゼロから作った声)のエンジン部分をそのまま切り出し、ゲームから使えるAPIを追加。
const KOE = (function(){

const SR = 22050, PI = Math.PI, TWO_PI = PI * 2, HALF_PI = PI / 2;
const SING_T0 = 0.15; // 歌モードの最初の音を置く時刻(子音の助走ぶん)

function makeRng(seed){ let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2147483648 - 1; }; }

// 区分線形トラック(時間→値)
class Track{
  constructor(v){ this.p = [[0, v]]; this.sorted = false; }
  add(t, v){ this.p.push([t, v]); this.sorted = false; }
  prep(){ if(this.sorted) return; this.p = this.p.map((x, i) => [x[0], x[1], i]).sort((a, b) => a[0] - b[0] || a[2] - b[2]); this.sorted = true; }
  at(t){
    const p = this.p; let lo = 0, hi = p.length - 1;
    if(t <= p[0][0]) return p[0][1];
    if(t >= p[hi][0]) return p[hi][1];
    while(hi - lo > 1){ const m = (lo + hi) >> 1; if(p[m][0] <= t) lo = m; else hi = m; }
    const a = p[lo], b = p[hi];
    if(b[0] === a[0]) return b[1];
    return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
  }
}

// 母音のフォルマント [F1,F2,F3]
const VF = { a:[800,1300,2500], i:[290,2250,3000], u:[340,1300,2300], e:[470,1950,2600], o:[500,880,2400] };
// 自己校正で埋まる音量バランス
const G = { AF:1, ASP:1, VG:{ a:1, i:1, u:1, e:1, o:1 } };

/* ---------- かな解析 ---------- */
const KANA = {};
(function(){
  const rows = [['','あいうえお'],['k','かきくけこ'],['g','がぎぐげご'],['s','さしすせそ'],['z','ざじずぜぞ'],['t','たちつてと'],['d','だぢづでど'],['n','なにぬねの'],['h','はひふへほ'],['b','ばびぶべぼ'],['p','ぱぴぷぺぽ'],['m','まみむめも'],['y','や_ゆ_よ'],['r','らりるれろ'],['w','わ___を']];
  rows.forEach(([c, str]) => { [...str].forEach((ch, i) => { if(ch !== '_') KANA[ch] = [c, 'aiueo'[i]]; }); });
  Object.assign(KANA, { 'し':['sh','i'], 'ち':['ch','i'], 'つ':['ts','u'], 'ふ':['f','u'], 'じ':['j','i'], 'ぢ':['j','i'], 'づ':['z','u'], 'ひ':['hy','i'], 'を':['','o'], 'ゔ':['b','u'], 'ゐ':['','i'], 'ゑ':['','e'] });
})();
const SMALL_Y = { 'ゃ':'a', 'ゅ':'u', 'ょ':'o' };
const SMALL_V = { 'ぁ':'a', 'ぃ':'i', 'ぅ':'u', 'ぇ':'e', 'ぉ':'o' };
const VL = new Set(['k','s','sh','t','ch','ts','h','hy','f','p']);
const GEM_OK = new Set(['k','t','p','ts','ch','s','sh','h','hy','f','g','d','b','j','z']);

function kataToHira(s){ return s.replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)); }

function particleMarks(s){
  const wa = new Set(), he = new Set();
  const sep = /[\s、。,.!?！？「」]/;
  const re = /こんにちは|こんばんは|では|には|とは/g; let m;
  while((m = re.exec(s))){ const i = m.index + m[0].length - 1; if(s[i] === 'は') wa.add(i); }
  for(let i = 0; i < s.length; i++){
    const ch = s[i]; if(ch !== 'は' && ch !== 'へ') continue;
    const nx = s[i + 1];
    if(!(nx === undefined || sep.test(nx))) continue;
    let j = i; while(j > 0 && !sep.test(s[j - 1])) j--;
    const seg = s.slice(j, i + 1);
    if(seg.length < 2) continue;
    if([...seg].every(c => c === 'は' || c === 'ー')) continue;
    (ch === 'は' ? wa : he).add(i);
  }
  return { wa, he };
}

function parse(text, o){
  const s = kataToHira(text.normalize('NFKC'));
  const marks = o.particle ? particleMarks(s) : { wa:new Set(), he:new Set() };
  const items = []; let pendingGem = false;
  const last = () => items[items.length - 1];
  const pause = (dur, punct) => {
    if(pendingGem){ items.push({ type:'gap', dur:0.08 }); pendingGem = false; }
    const l = last();
    if(l && l.type === 'pause'){ l.dur = Math.max(l.dur, dur); if(punct !== '_') l.punct = punct; }
    else if(l) items.push({ type:'pause', dur, punct });
  };
  for(let i = 0; i < s.length; i++){
    const ch = s[i];
    if(/\s/.test(ch)){ pause(0.12, '_'); continue; }
    if(ch === '、' || ch === ','){ pause(0.2, ','); continue; }
    if(ch === '。' || ch === '.' || ch === '．'){ pause(0.38, '.'); continue; }
    if(ch === '!' ){ pause(0.38, '!'); continue; }
    if(ch === '?' ){ pause(0.4, '?'); continue; }
    if(ch === 'っ'){ pendingGem = true; continue; }
    if(ch === 'ー'){ const l = last(); if(l && l.type === 'mora' && l.c !== 'N') items.push({ type:'mora', c:'', v:l.v, cont:true, src:'ー' }); continue; }
    if(ch === 'ん'){ items.push({ type:'mora', c:'N', v:'a', gem:false, src:'ん' }); pendingGem = false; continue; }
    const base = KANA[ch]; if(!base) continue;
    let c = base[0], v = base[1], glide = false, src = ch;
    if(marks.wa.has(i) && ch === 'は'){ c = 'w'; v = 'a'; }
    if(marks.he.has(i) && ch === 'へ'){ c = ''; v = 'e'; }
    const nx = s[i + 1];
    let small = false;
    if(nx && SMALL_Y[nx]){ v = SMALL_Y[nx]; glide = true; src += nx; i++; small = true; }
    else if(nx && SMALL_V[nx]){ v = SMALL_V[nx]; src += nx; i++; small = true; if(c === '' && ch === 'う') c = 'w'; }
    const l = last();
    if(o.longv && !small && c === '' && l && l.type === 'mora' && l.c !== 'N' &&
       ((ch === 'う' && l.v === 'o') || (ch === 'い' && l.v === 'e'))){
      items.push({ type:'mora', c:'', v:l.v, cont:true, src }); pendingGem = false; continue;
    }
    items.push({ type:'mora', c, v, glide, gem:pendingGem, src });
    pendingGem = false;
  }
  if(pendingGem) items.push({ type:'gap', dur:0.08 });
  while(items.length && items[items.length - 1].type !== 'mora') items.pop();
  return items;
}

/* ---------- 韻律(アクセント風のピッチ曲線、半音単位) ---------- */
function assignProsody(items, ins){
  let phraseIdx = 0, cur = [];
  const flush = (punct) => {
    if(cur.length){
      const n = cur.length;
      cur.forEach((m, i) => {
        let st;
        if(n === 1) st = 1; else if(i === 0) st = -2; else if(i === 1) st = (n === 2 ? 0.5 : 1.5); else st = 1.5 - 2.5 * (i - 1) / (n - 2);
        m.st = (st - Math.min(4, 0.9 * phraseIdx)) * ins;
      });
      const lastM = cur[n - 1], pre = cur[n - 2];
      if(punct === '?'){ lastM.st += 5 * ins; if(pre) pre.st += 2 * ins; }
      else if(punct === '.' || punct === 'end'){ lastM.st -= (punct === '.' ? 2.5 : 1.5) * ins; if(pre) pre.st -= 0.8 * ins; }
      else if(punct === '!'){ cur.forEach(m => m.st += 1.2 * ins); lastM.st -= 2.5 * ins; }
      else if(punct === ','){ lastM.st += 0.8 * ins; }
      phraseIdx = (punct === '.' || punct === '?' || punct === '!' || punct === 'end') ? 0 : phraseIdx + 1;
    }
    cur = [];
  };
  for(const it of items){
    if(it.type === 'mora') cur.push(it);
    else if(it.type === 'pause') flush(it.punct);
  }
  flush('end');
}

/* ---------- 発話計画(各パラメータの時間軌道を作る) ---------- */
function locus(c, v){
  const vf = VF[v];
  switch(c){
    case 'k': case 'g': return [300, vf[1] * 0.6 + 800, vf[2]];
    case 't': case 'd': case 'n': case 's': case 'z': case 'r': case 'ts': return [300, vf[1] * 0.5 + 900, vf[2] * 0.5 + 1400];
    case 'p': case 'b': case 'm': case 'f': return [300, vf[1] * 0.6 + 340, vf[2] * 0.8 + 440];
    case 'sh': case 'ch': case 'j': case 'hy': return [300, 1000 + vf[1] * 0.5, 2800];
    default: return vf;
  }
}
const moraF = m => m.c === 'N' ? [250, 1100, 2300] : VF[m.v];

function plan(items, o){
  const k = 1 / Math.max(0.3, o.speed), M = 0.13 * k;
  const sing = !!o.sing, T0 = SING_T0;
  const mk = v => new Track(v);
  const tr = { f1:mk(500), f2:mk(1500), f3:mk(2500), av:mk(0), ah:mk(0), af:mk(0), fc:mk(5000), fb:mk(2000), fm:mk(0), nas:mk(0), nz:mk(1000), st:mk(0), vb:mk(0) };
  let t = 0, lastF = [500, 1500, 2500];
  const DEF = { av:0, ah:0, af:0, fm:0, nas:0, nz:1000, fc:5000, fb:2000, rF:0.03, rG:0.01 };

  function ph(dur, s){
    s = Object.assign({}, DEF, s);
    const te = t + dur, rF = Math.min(s.rF, dur * 0.8), rG = Math.min(s.rG, dur * 0.8);
    if(s.F){
      tr.f1.add(t + rF, s.F[0]); tr.f1.add(te, s.F[0]);
      tr.f2.add(t + rF, s.F[1]); tr.f2.add(te, s.F[1]);
      tr.f3.add(t + rF, s.F[2]); tr.f3.add(te, s.F[2]);
      lastF = s.F;
    }
    tr.nas.add(t + rF, s.nas); tr.nas.add(te, s.nas);
    tr.nz.add(t + rF, s.nz); tr.nz.add(te, s.nz);
    for(const key of ['av','ah','af','fm','fc','fb']){ tr[key].add(t + rG, s[key]); tr[key].add(te, s[key]); }
    t = te;
  }
  const nextF = idx => { for(let j = idx + 1; j < items.length; j++) if(items[j].type === 'mora') return moraF(items[j]); return null; };
  // ビブラート: 音が長いほど深く、立ち上がりはゆっくり
  function vibrato(v0, d){ const pk = Math.max(0, Math.min(1, (d - 0.15) / 0.4)); tr.vb.add(v0 + 0.001, 0); tr.vb.add(v0 + d * 0.6, pk); tr.vb.add(v0 + d, pk * 0.7); }

  const firstM = items.find(i => i.type === 'mora');
  if(firstM) tr.st.add(0, firstM.st || 0);
  ph(0.05, { F: firstM ? moraF(firstM) : lastF, rF:0.01 });

  const moras = []; let prevDevo = false;

  function cons(m, first, devo, Gx){
    const c = m.c, v = m.v, L = locus(c, v);
    switch(c){
      case '': break;
      case 'k': case 't': case 'p': {
        ph((first ? 0.02 : 0.045) * k + Gx, { F:L, rF:0.02, rG:0.008 });
        const bf = c === 'k' ? (v === 'i' || v === 'e' ? 3300 : 1900) : (c === 't' ? 4200 : 1400);
        const bb = c === 'k' ? 1300 : (c === 't' ? 2400 : 2600);
        const ba = c === 'k' ? 1 : (c === 't' ? 0.85 : 0.55);
        ph(0.008, { F:L, af:ba, ah:0.2, fc:bf, fb:bb, rF:0.01, rG:0.001 });
        ph((c === 'k' ? 0.028 : c === 'p' ? 0.02 : 0.024) * k, { F:L, af:ba * 0.2, ah:0.65, fc:bf, fb:bb, rF:0.025, rG:0.004 });
      } break;
      case 'g': case 'd': case 'b': {
        const bf = c === 'g' ? (v === 'i' || v === 'e' ? 3000 : 1700) : (c === 'd' ? 4000 : 1300);
        const ba = c === 'g' ? 0.7 : (c === 'd' ? 0.6 : 0.4);
        ph((first ? 0.025 : 0.04) * k + Gx, { F:[200, L[1], L[2]], av:0.22, rF:0.02, rG:0.008 });
        ph(0.008, { F:L, av:0.45, af:ba, fm:1, fc:bf, fb:2200, rF:0.01, rG:0.001 });
      } break;
      case 's': ph(0.085 * k + Gx, { F:L, af:1.0, fc:6800, fb:2800, rF:0.03, rG:0.014 }); break;
      case 'sh': ph(0.095 * k + Gx, { F:L, af:1.15, fc:3800, fb:1700, rF:0.03, rG:0.014 }); break;
      case 'h': ph(0.065 * k + Gx, { F:VF[v], ah:0.8, rF:0.02, rG:0.012 }); break;
      case 'hy': ph(0.07 * k + Gx, { F:VF.i, ah:0.5, af:0.3, fc:3500, fb:2200, rF:0.02, rG:0.012 }); break;
      case 'f': ph(0.075 * k + Gx, { F:VF.u, ah:0.45, af:0.18, fc:2200, fb:5000, rF:0.02, rG:0.012 }); break;
      case 'ts':
        ph((first ? 0.025 : 0.04) * k + Gx, { F:L, rF:0.02, rG:0.008 });
        ph(0.065 * k, { F:L, af:1.0, fc:6800, fb:2800, rF:0.02, rG:0.003 }); break;
      case 'ch':
        ph((first ? 0.025 : 0.04) * k + Gx, { F:L, rF:0.02, rG:0.008 });
        ph(0.075 * k, { F:L, af:1.15, fc:3800, fb:1700, rF:0.02, rG:0.003 }); break;
      case 'z': case 'j': {
        const pal = c === 'j', fc = pal ? 3800 : 6800, fb = pal ? 1700 : 2800, af = pal ? 0.75 : 0.6;
        if(first || m.gem){
          ph(0.035 * k + Gx, { F:[200, L[1], L[2]], av:0.22, rF:0.02, rG:0.008 });
          ph(0.055 * k, { F:L, av:0.45, af, fm:1, fc, fb, rF:0.02, rG:0.004 });
        } else ph(0.075 * k, { F:L, av:0.5, af, fm:1, fc, fb, rF:0.025, rG:0.01 });
      } break;
      case 'm': ph(0.06 * k, { F:[250, L[1], L[2]], av:0.6, nas:1, nz:850, rF:0.02, rG:0.01 }); break;
      case 'n': ph(0.055 * k, { F:[250, L[1], L[2]], av:0.6, nas:1, nz:1450, rF:0.02, rG:0.01 }); break;
      case 'r': ph(0.028 * k, { F:[330, L[1], 2400], av:0.3, rF:0.015, rG:0.008 }); break;
      case 'y': ph(0.055 * k, { F:VF.i, av:0.9, rF:0.025, rG:0.01 }); break;
      case 'w': ph(0.055 * k, { F:[300, 700, 2300], av:0.85, rF:0.025, rG:0.01 }); break;
    }
    if(m.glide) ph(0.04 * k, { F:VF.i, av:0.9, rF:0.02, rG:0.008 });
  }

  for(let idx = 0; idx < items.length; idx++){
    const it = items[idx];
    if(it.type === 'pause'){ ph(it.dur * k, { F: nextF(idx) || lastF, rF:0.02, rG:0.035 }); continue; }
    if(it.type === 'gap'){ ph(it.dur * k, { rG:0.02 }); continue; }
    const m = it, tStart = t;
    const prevIt = items[idx - 1], nxtIt = items[idx + 1];
    const first = sing ? (idx === 0 || m.at > prevIt.at + prevIt.dur + 0.01) : (idx === 0 || prevIt.type === 'pause');
    // 歌: 母音が拍の頭に来るよう、子音ぶん手前から始める。次の音が続くなら次の子音の手前までのばす
    const vEndOf = () => (nxtIt && nxtIt.type === 'mora' && nxtIt.at <= m.at + m.dur + 0.005)
      ? T0 + nxtIt.at - Math.min(nxtIt.used || 0, 0.12) : T0 + m.at + m.dur - 0.02;
    if(sing){
      const startT = T0 + m.at - Math.min(m.used || 0, 0.12);
      if(t < startT) ph(startT - t, { F:moraF(m), rF:0.02, rG:0.03 });
    }
    if(m.c === 'N'){
      const nx = items[idx + 1]; const nc = nx && nx.type === 'mora' ? nx.c : '';
      let F, nz;
      if(['p','b','m'].includes(nc)){ F = [250, 1000, 2200]; nz = 850; }
      else if(['t','d','n','ts','ch','j','z','s','sh','r'].includes(nc)){ F = [250, 1500, 2500]; nz = 1450; }
      else if(['k','g'].includes(nc)){ F = [250, 1800, 2600]; nz = 2000; }
      else { F = [300, 1050, 2300]; nz = 900; }
      const d = sing ? Math.max(0.04, vEndOf() - t) : M * 0.95;
      if(sing){ tr.st.add(t + 0.02, m.st); tr.st.add(t + d, m.st); vibrato(t, d); } else tr.st.add(t + d * 0.5, m.st || 0);
      m.used = 0;
      ph(d, { F, av:0.7, nas:1, nz, rF:0.04, rG:0.015 });
    } else if(m.cont){
      const d = sing ? Math.max(0.04, vEndOf() - t) : M;
      if(sing){ tr.st.add(t + 0.02, m.st); tr.st.add(t + d, m.st); vibrato(t, d); } else tr.st.add(t + M * 0.5, m.st || 0);
      m.used = 0;
      ph(d, { F:VF[m.v], av:G.VG[m.v], rF:0.02, rG:0.01 });
    } else {
      if(m.gem && !GEM_OK.has(m.c)) ph(0.08 * k, { rG:0.02 });
      const Gx = (m.gem && GEM_OK.has(m.c)) ? 0.09 * k : 0;
      let devo = false;
      if(o.devoice && !m.glide && (m.v === 'i' || m.v === 'u') && VL.has(m.c) && !prevDevo){
        const nx = items[idx + 1];
        if(nx && nx.type === 'mora' && VL.has(nx.c)) devo = true;
        else if((!nx || nx.type === 'pause') && (m.c === 's' || m.c === 'sh' || m.c === 'ts')) devo = true;
      }
      prevDevo = devo;
      const t0 = t;
      cons(m, first, devo, Gx);
      const used = t - t0 - Gx;
      m.used = used;
      if(devo){
        tr.st.add(t + 0.03 * k, m.st || 0);
        ph(0.065 * k, { F:VF[m.v], ah:0.8, rF:0.02, rG:0.01 });
      } else {
        const vdur = sing ? Math.max(0.04, vEndOf() - t) : Math.max(0.06 * Math.min(1, k), M - used);
        if(sing){ tr.st.add(t + 0.02, m.st); tr.st.add(t + vdur, m.st); vibrato(t, vdur); } else tr.st.add(t + vdur * 0.4, m.st || 0);
        ph(vdur, { F:VF[m.v], av:G.VG[m.v], rF:0.03, rG:0.012 });
      }
    }
    moras.push({ item:m, t0:tStart, t1:t });
  }
  ph(0.12, { rG:0.03 });
  return { tr, total: t + 0.05, moras };
}

/* ---------- 合成器本体 ---------- */
function synth(plan, p){
  const T = plan.tr; for(const key in T) T[key].prep();
  const N = Math.ceil(plan.total * SR), out = new Float32Array(N), rng = makeRng(p.seed || 1);
  const fsc = p.fs, base = p.f0, breath = p.breath || 0;
  const oq = 0.56 + 0.22 * breath, tp = 0.62 * oq;
  const bwBase = [80, 100, 140, 250, 300];
  const r1 = new Float64Array(5), r2 = new Float64Array(5), cA = new Float64Array(5), cB = new Float64Array(5), cC = new Float64Array(5);
  let x1 = 0, x2 = 0, nA = 1, nB = 0, nC = 0;
  let fs1 = 0, fs2 = 0, fA = 0, fB = 0, fC = 0, fNorm = 1;
  let phi = 0, gprev = 0, jit = 1, shim = 1, drift = 0, f0s = base, lp = 0, dcx = 0, dcy = 0;
  let av = 0, ah = 0, af = 0, fm = 0, nas = 0, f0t = base, vbv = 0, vibPh = 0;
  const aF0 = 1 - Math.exp(-1 / (SR * 0.02)), aLP = 0.55;
  const clampF = f => Math.max(60, Math.min(f, SR * 0.45));
  const coef = (f, bw) => { const r = Math.exp(-PI * bw / SR); const C = -r * r, B = 2 * r * Math.cos(TWO_PI * clampF(f) / SR); return [1 - B - C, B, C]; };

  for(let n = 0; n < N; n++){
    const t = n / SR;
    if((n & 7) === 0){
      av = T.av.at(t); ah = T.ah.at(t); af = T.af.at(t); fm = T.fm.at(t); nas = T.nas.at(t); vbv = T.vb ? T.vb.at(t) : 0;
      const F = [T.f1.at(t) * fsc, T.f2.at(t) * fsc, T.f3.at(t) * fsc, 3300 * fsc, 3750 * fsc];
      for(let q = 0; q < 5; q++){
        const c = coef(F[q], bwBase[q] + (q === 0 ? 60 * nas : 0));
        cA[q] = c[0]; cB[q] = c[1]; cC[q] = c[2];
      }
      if(nas > 0.001){ const c = coef(T.nz.at(t) * fsc, 160); nA = c[0]; nB = c[1]; nC = c[2]; }
      if(af > 0.0005){
        const c = coef(T.fc.at(t), Math.max(300, T.fb.at(t)));
        fA = c[0]; fB = c[1]; fC = c[2];
        const den = (1 + fC) * ((1 - fC) * (1 - fC) - fB * fB);
        const vg = den > 1e-9 ? fA * fA * (1 - fC) / den / 3 : 1;
        fNorm = 1 / Math.sqrt(Math.max(vg, 1e-9));
      }
      f0t = base * Math.pow(2, T.st.at(t) / 12);
    }
    if(n === 0) f0s = f0t;
    f0s += (f0t - f0s) * aF0;
    drift = drift * 0.9995 + rng() * 0.00015;
    let vm = 1;
    if(p.vib && vbv > 0.001){ vibPh += TWO_PI * 5.6 / SR; vm = Math.pow(2, p.vib * vbv * Math.sin(vibPh) / 1200); }
    const dphi = f0s * vm * jit * (1 + drift) / SR;
    phi += dphi;
    if(phi >= 1){ phi -= 1; jit = 1 + 0.004 * rng(); shim = 1 + 0.05 * rng(); }
    let g;
    if(phi < tp) g = 0.5 * (1 - Math.cos(PI * phi / tp));
    else if(phi < oq) g = Math.cos(HALF_PI * (phi - tp) / (oq - tp));
    else g = 0;
    const d = (g - gprev) / dphi * 0.1; gprev = g;

    const noise = rng();
    let src = av * shim * d + av * breath * noise * 0.06 * (0.3 + g) + ah * G.ASP * noise;
    lp += aLP * (src - lp);
    let s = lp;
    for(let q = 0; q < 5; q++){ const y = cA[q] * s + cB[q] * r1[q] + cC[q] * r2[q]; r2[q] = r1[q]; r1[q] = y; s = y; }
    if(nas > 0.001){
      const an = (s - nB * x1 - nC * x2) / nA;
      x2 = x1; x1 = s;
      s = s * (1 - nas) + an * nas;
    }
    let fr = 0;
    if(af > 0.0005){
      const nf = rng();
      const fy = fA * nf + fB * fs1 + fC * fs2; fs2 = fs1; fs1 = fy;
      fr = fy * fNorm * af * G.AF;
      if(fm > 0.01) fr *= 1 - fm * (1 - (0.3 + 0.7 * g));
    }
    const y = s + fr;
    const o = y - dcx + 0.995 * dcy; dcx = y; dcy = o;
    out[n] = o;
  }
  if(!p.raw){
    let acc = 0, cnt = 0, peak = 0;
    for(let n = 0; n < N; n++){ const a = Math.abs(out[n]); if(a > peak) peak = a; }
    const thr = peak * 0.01;
    for(let n = 0; n < N; n++){ if(Math.abs(out[n]) > thr){ acc += out[n] * out[n]; cnt++; } }
    const rms = Math.sqrt(acc / Math.max(1, cnt)) || 1;
    const sc = 0.2 / rms;
    for(let n = 0; n < N; n++) out[n] = Math.tanh(out[n] * sc) * 0.95;
  }
  return out;
}

/* ---------- 楽譜(歌モード) ---------- */
// 書式: 音名[#/b][オクターブ][,拍]:歌詞   例) ド:ど ソ5,2:そ R,1(休符)
function parseScore(text, bpm, trans){
  const beat = 60 / Math.max(20, bpm), items = [], notes = [], errors = [];
  const toks = text.normalize('NFKC').split(/[\s|]+/).filter(Boolean);
  const PN = { 'ど':'C','ド':'C','れ':'D','レ':'D','み':'E','ミ':'E','ふぁ':'F','ファ':'F','そ':'G','ソ':'G','ら':'A','ラ':'A','し':'B','シ':'B' };
  const SEMI = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
  const re = /^(ふぁ|ファ|ど|ド|れ|レ|み|ミ|そ|ソ|ら|ラ|し|シ|[A-Ga-g])([#♯♭b]?)(\d)?(?:,(\d*\.?\d+))?(?::(.*))?$/;
  const reRest = /^[Rr休](?:,(\d*\.?\d+))?$/;
  let at = 0;
  for(const tok of toks){
    let m = reRest.exec(tok);
    if(m){ at += (m[1] ? +m[1] : 1) * beat; continue; }
    m = re.exec(tok);
    if(!m){ errors.push(tok); continue; }
    const letter = PN[m[1]] || m[1].toUpperCase();
    const acc = (m[2] === '#' || m[2] === '♯') ? 1 : (m[2] === '♭' || m[2] === 'b') ? -1 : 0;
    const oct = m[3] ? +m[3] : 4;
    const midi = 12 * (oct + 1) + SEMI[letter] + acc + (trans || 0);
    const dur = (m[4] ? +m[4] : 1) * beat;
    const lyr = (m[5] || '').trim();
    let ms;
    if(lyr === 'ー' || lyr === '-'){
      const pv = items.length ? items[items.length - 1].v : 'a';
      ms = [{ type:'mora', c:'', v:pv, cont:true, src:'ー' }];
    } else {
      const opt = { particle:false, longv:false, devoice:false };
      ms = parse(lyr || 'ら', opt).filter(x => x.type === 'mora');
      if(!ms.length) ms = parse('ら', opt).filter(x => x.type === 'mora');
    }
    const n = ms.length;
    ms.forEach((mo, i) => { Object.assign(mo, { gem:false, st:midi - 69, at:at + i * dur / n, dur:dur / n }); items.push(mo); });
    notes.push({ midi, at, dur, label:lyr || 'ら' });
    at += dur;
  }
  return { items, notes, errors };
}
// 子音の長さを1回目で測り、2回目で拍に合わせて配置する
function planSing(items, o){ plan(items, o); return plan(items, o); }

/* ---------- 自己校正(母音ごとの音量・雑音の大きさをそろえる) ---------- */
function constPlan(F, o, dur){
  o = o || {}; const mk = v => new Track(v);
  return { tr:{ f1:mk(F[0]), f2:mk(F[1]), f3:mk(F[2]), av:mk(o.av || 0), ah:mk(o.ah || 0), af:mk(o.af || 0), fc:mk(o.fc || 5000), fb:mk(o.fb || 2000), fm:mk(0), nas:mk(o.nas || 0), nz:mk(1000), st:mk(0), vb:mk(0) }, total: dur || 0.35 };
}
function rmsOf(a, from){ const s = Math.floor((from || 0.06) * SR); let acc = 0; for(let i = s; i < a.length; i++) acc += a[i] * a[i]; return Math.sqrt(acc / Math.max(1, a.length - s)); }
function calibrate(){
  const P = { f0:130, fs:1, breath:0, seed:7, raw:true };
  const rv = {};
  for(const v of 'aiueo') rv[v] = rmsOf(synth(constPlan(VF[v], { av:1 }), P));
  const ra = rv.a;
  for(const v of 'aiueo') G.VG[v] = Math.max(0.5, Math.min(2.5, ra / rv[v]));
  G.AF = 0.45 * ra;
  G.ASP = 1;
  const rAsp = rmsOf(synth(constPlan(VF.a, { ah:1 }), P));
  G.ASP = 0.45 * ra / rAsp;
  return { rv, AF:G.AF, ASP:G.ASP, VG:G.VG };
}
calibrate();

  // ---------- ゲーム用API ----------
  const VOICES = {
    'おとこ':   { f0:110, fs:0.9,  ins:1,   br:0.2 },
    'おんな':   { f0:215, fs:1.15, ins:1.1, br:0.25 },
    'こども':   { f0:300, fs:1.32, ins:1.3, br:0.1 },
    'ロボット': { f0:120, fs:1,    ins:0,   br:0 },
    'ささやき': { f0:140, fs:1,    ins:0.6, br:1 },
    'まおう':   { f0:72,  fs:0.82, ins:0.8, br:0.35 }
  };
  const cache = new Map();
  let enabled = true;
  try { const s = JSON.parse(localStorage.getItem('koelab_v1')); if (s && s.gameVoice === false) enabled = false; } catch (e) {}

  // テキストを波形(Float32Array, SR=22050)に。o: {f0,fs,speed,ins,breath,devoice,longv,particle}
  function render(text, o){
    o = Object.assign({ f0:125, fs:1, speed:1, ins:1, breath:0.2, devoice:true, longv:true, particle:true }, o || {});
    const items = parse(String(text).slice(0, 400), o);
    if (!items.some(i => i.type === 'mora')) return null;
    assignProsody(items, o.ins);
    const pl = plan(items, o);
    const pcm = synth(pl, { f0:o.f0, fs:o.fs, breath:o.breath, seed:1 });
    return { pcm, plan:pl, items };
  }
  function renderSong(score, o){
    o = Object.assign({ bpm:100, trans:0, fs:1, breath:0.2, vib:30 }, o || {});
    const sc = parseScore(score, o.bpm, o.trans);
    if (!sc.items.length) return null;
    const pl = planSing(sc.items, { sing:true, speed:1, devoice:false });
    const pcm = synth(pl, { f0:440, fs:o.fs, breath:o.breath, vib:o.vib, seed:1 });
    return { pcm, plan:pl, notes:sc.notes };
  }
  // 再生(全体のaudioCtxを使用)。戻り値: { src, start }
  function playPcm(pcm, vol){
    if (typeof audioCtx === 'undefined' || !audioCtx) return null;
    const buf = audioCtx.createBuffer(1, pcm.length, SR); buf.getChannelData(0).set(pcm);
    const src = audioCtx.createBufferSource(), g = audioCtx.createGain();
    g.gain.value = vol === undefined ? 1 : vol;
    src.buffer = buf; src.connect(g); g.connect(audioCtx.destination);
    const start = audioCtx.currentTime + 0.03; src.start(start);
    return { src, start, dur: pcm.length / SR };
  }
  // ゲーム内のかけ声。同じ台詞はキャッシュして2回目以降は即再生
  function voiceOpts(v){ if (typeof v === 'string') v = VOICES[v] || VOICES['おとこ']; return { f0:v.f0, fs:v.fs, ins:v.ins, breath:v.br !== undefined ? v.br : v.breath, speed:v.speed || 1 }; }
  function prepare(text, voice){
    const key = text + '|' + JSON.stringify(voice);
    if (!cache.has(key)) { const r = render(text, voiceOpts(voice)); cache.set(key, r ? r.pcm : null); if (cache.size > 40) cache.delete(cache.keys().next().value); }
    return cache.get(key);
  }
  function shout(text, voice, vol){
    if (!enabled) return;
    const sv = (typeof SaveSys !== 'undefined' && SaveSys.data) ? SaveSys.data.seVol : 0.8;
    if (sv <= 0) return;
    const pcm = prepare(text, voice);
    if (pcm) playPcm(pcm, (vol === undefined ? 1 : vol) * Math.min(1, sv * 1.2));
  }
  return { SR, SING_T0, VF, VOICES, parse, assignProsody, plan, synth, parseScore, planSing, calibrate,
           render, renderSong, playPcm, prepare, shout,
           get enabled(){ return enabled; }, set enabled(v){ enabled = !!v; } };
})();
