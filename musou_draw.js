// === 無限無双 v3 : 描画・画面部 (ロジックは musou.js) ===

// 8x8 ドット絵: a=主色 b=差し色 k=黒 w=白 s=肌 h=髪 r=赤
const MU_SPR = {
  hero1: ['..hhhh..', '.hhhhhh.', '.hskksh.', '..ssss..', '.aabbaa.', 'saaaaaas', '.aa..aa.', '.kk..kk.'],
  hero2: ['..hhhh..', '.hhhhhh.', '.hskksh.', '..ssss..', '.aabbaa.', 'saaaaaas', '..aaaa..', '..k..k..'],
  zako:    ['..aaaa..', '.aaaaaa.', '.akaaka.', '..aaaa..', '.aabbaa.', 'a.aaaa.a', '..a..a..', '.aa..aa.'],
  hayate:  ['........', '...aa...', '..aaaa..', '.akaaka.', '..aaaa..', '.a.aa.a.', 'a..aa..a', '........'],
  tate:    ['..aaaa..', '.aaaaaa.', '.akaaka.', 'bbaaaaa.', 'bbbaaaa.', 'bbb.aa..', 'bb..a.a.', '....a.a.'],
  yumi:    ['..aaaa..', '.aaaaaa.', '.akaaka.', 'b.aaaa..', 'b.aaaaa.', 'b..aaa..', 'b..a.a..', '...a.a..'],
  bakudan: ['....b...', '...b....', '..aaaa..', '.aaaaaa.', '.akaaka.', '.aaaaaa.', '.aaaaaa.', '..aaaa..'],
  hi:      ['...b....', '..bbb...', '.baaab..', '.baaab..', 'baaaaab.', 'baakaab.', '.baaab..', '..bbb...'],
  oni:     ['b..aa..b', 'bb.aa.bb', '.aaaaaa.', 'aakaakaa', 'aaaaaaaa', 'a.aaaa.a', '..a..a..', '.aa..aa.'],
  ninja:   ['..kkkk..', '.kkkkkk.', '.kwkkwk.', '..kkkk..', '.kbbbbk.', 'k.kkkk.k', '.kk..kk.', '.k....k.']
};

Object.assign(Musou, {
  // ---------- 共通部品 ----------
  win(x, y, w, h, c) {
    ctx.fillStyle = c || 'rgba(8,6,20,0.92)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = '#a84'; ctx.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
  },
  txt(s, x, y, c, f, al) { ctx.fillStyle = c || '#fff'; ctx.font = f || '10px monospace'; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); ctx.textAlign = 'left'; },
  wrapText(text, maxW) {
    ctx.font = '10px monospace'; const out = [];
    for (const para of String(text).split('\n')) { let line = ''; for (const ch of para) { if (ctx.measureText(line + ch).width > maxW) { out.push(line); line = ch; } else line += ch; } out.push(line); }
    return out;
  },
  spr(name, cx, cy, sc, pal, flip, flash, hair) {
    const rows = MU_SPR[name], s = 8 * sc, x0 = cx - s / 2, y0 = cy - s / 2;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const c = rows[y][x]; if (c === '.') continue;
      let col = c === 'a' ? pal[0] : c === 'b' ? pal[1] : c === 'k' ? '#111' : c === 'w' ? '#fff' : c === 's' ? '#fc9' : c === 'h' ? (hair || '#333') : '#e33';
      if (flash) col = '#fff';
      ctx.fillStyle = col; ctx.fillRect(Math.round(x0 + (flip ? 7 - x : x) * sc), Math.round(y0 + y * sc), sc, sc);
    }
  },
  fmtTime(sec) { sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); },

  // ---------- 背景 ----------
  drawBG() {
    const st = this.curStage(), th = st.theme, cx = this.cam.x - 100, cy = this.cam.y - 150;
    ctx.fillStyle = th.bg; ctx.fillRect(0, 0, 200, 300);
    const T = 24, x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
    for (let gy = y0; gy <= y0 + 13; gy++) for (let gx = x0; gx <= x0 + 9; gx++) {
      const h = ((gx * 73856093) ^ (gy * 19349663)) >>> 0, px = gx * T - cx, py = gy * T - cy;
      if ((gx + gy) & 1) { ctx.fillStyle = th.t1; ctx.fillRect(px, py, T, T); } else { ctx.fillStyle = th.t2; ctx.fillRect(px, py, T, T); }
      if (h % 7 < 2) { ctx.fillStyle = th.acc; ctx.fillRect(px + (h % 17), py + ((h >> 5) % 17), 3, 2); }
    }
  },

  // ---------- ワールド描画 ----------
  drawWorld() {
    const cx = this.cam.x - 100, cy = this.cam.y - 150;
    ctx.save();
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    this.drawBG();
    const X = x => x - cx, Y = y => y - cy;
    // 警告表示
    for (const w of this.warn) {
      const a = 0.25 + 0.35 * (w.t / w.max);
      ctx.fillStyle = 'rgba(255,40,40,' + a + ')';
      if (w.k === 'circle') { ctx.beginPath(); ctx.arc(X(w.x), Y(w.y), w.r, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#f66'; ctx.stroke(); }
      else { ctx.save(); ctx.translate(X(w.x), Y(w.y)); ctx.rotate(w.ang); ctx.fillRect(0, -6, w.len, 12); ctx.restore(); }
    }
    // アイテム
    for (const it of this.items) {
      const x = X(it.x), y = Y(it.y); if (x < -10 || x > 210 || y < -10 || y > 310) continue;
      if (it.k === 'gem') { ctx.fillStyle = it.v >= 20 ? '#f6c' : it.v >= 4 ? '#6f8' : '#6cf'; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.fill(); }
      else if (it.k === 'coin') { ctx.fillStyle = '#fc2'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.283); ctx.fill(); ctx.fillStyle = '#a80'; ctx.fillRect(x - 1, y - 1, 2, 2); }
      else if (it.k === 'meat') { ctx.fillStyle = '#c63'; ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillStyle = '#fed'; ctx.fillRect(x + 3, y - 1, 3, 2); }
      else if (it.k === 'magnet') { ctx.strokeStyle = '#f44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 4, 3.14, 6.283); ctx.stroke(); ctx.lineWidth = 1; }
      else if (it.k === 'bomb') { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.283); ctx.fill(); ctx.fillStyle = '#f84'; ctx.fillRect(x + 2, y - 6, 2, 3); }
      else if (it.k === 'chest') { ctx.fillStyle = '#a62'; ctx.fillRect(x - 6, y - 4, 12, 9); ctx.fillStyle = '#fc0'; ctx.fillRect(x - 6, y - 4, 12, 3); ctx.fillRect(x - 1, y, 2, 3); }
    }
    // 床エフェクト (ホール・爆弾)
    for (const f of this.fx) {
      const x = X(f.x), y = Y(f.y);
      if (f.k === 'hole') { const a = Math.min(1, f.t / 10, (f.life - f.t) / 10); ctx.globalAlpha = 0.7 * a; ctx.fillStyle = '#204'; ctx.beginPath(); ctx.arc(x, y, f.r * 0.6, 0, 6.283); ctx.fill(); ctx.strokeStyle = '#a6f'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y, f.r * (0.2 + 0.25 * i) + Math.sin(f.t * 0.2 + i) * 3, 0, 6.283); ctx.stroke(); } ctx.globalAlpha = 1; }
      else if (f.k === 'bomb' && f.t < f.life) { ctx.fillStyle = f.t % 6 < 3 ? '#f64' : '#fa4'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(255,100,40,0.5)'; ctx.beginPath(); ctx.arc(x, y, f.r * (f.t / f.life), 0, 6.283); ctx.stroke(); }
    }
    // 敵
    const ordered = this.enemies.slice().sort((a, b) => a.y - b.y);
    for (const e of ordered) {
      const x = X(e.x), y = Y(e.y); if (x < -30 || x > 230 || y < -30 || y > 330) continue;
      if (e.boss) { this.drawBoss(e, x, y); continue; }
      const d = MU_ENEMY[e.type], bob = Math.sin((e.t + e.uid) * 0.25) * 1;
      const st = d.sc;
      if (e.elite) { ctx.fillStyle = 'rgba(255,80,60,0.25)'; ctx.beginPath(); ctx.arc(x, y + 2, d.r + 3, 0, 6.283); ctx.fill(); }
      this.spr(e.type === 'mini' ? 'oni' : d.spr, x, y + bob, st, e.pal, e.x > this.p.x, e.fl > 0);
      if (e.mini || e.type === 'oni') { const w = d.r * 2; ctx.fillStyle = '#400'; ctx.fillRect(x - w / 2, y - d.r - 5, w, 2); ctx.fillStyle = '#f44'; ctx.fillRect(x - w / 2, y - d.r - 5, w * Math.max(0, e.hp / e.mhp), 2); }
    }
    // 武器描画
    this.drawWeapons(X, Y);
    // プレイヤー
    const p = this.p, px = X(p.x), py = Y(p.y);
    if (!(p.inv > 0 && this.t % 4 < 2)) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px, py + 9, 6, 2, 0, 0, 6.283); ctx.fill();
      this.spr(Math.floor(p.step / 6) % 2 ? 'hero2' : 'hero1', px, py, 2, [this.hero.col, '#fc4'], p.fx < 0, false, this.hero.hair);
    }
    if (this.ult) this.drawUlt(px, py);
    // 弾
    for (const b of this.ebul) { ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(X(b.x), Y(b.y), b.r, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(X(b.x) - 1, Y(b.y) - 1, 2, 2); }
    // 爆発・雷
    for (const f of this.fx) {
      const x = X(f.x), y = Y(f.y);
      if (f.k === 'boom') { const a = 1 - f.t / f.life; ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = f.bad ? '#f44' : '#fb4'; ctx.beginPath(); ctx.arc(x, y, f.r * (0.4 + 0.6 * (f.t / f.life)), 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
      else if (f.k === 'bolt') { ctx.strokeStyle = '#ffe'; ctx.lineWidth = 2; ctx.beginPath(); let cxx = x, cyy = y - 160; ctx.moveTo(cxx, cyy); for (let i = 0; i < 8; i++) { cxx += (Math.random() - 0.5) * 14; cyy += (y - (y - 160)) / 8; ctx.lineTo(cxx, cyy); } ctx.lineTo(x, y); ctx.stroke(); ctx.lineWidth = 1; ctx.fillStyle = 'rgba(255,255,160,0.5)'; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.283); ctx.fill(); }
    }
    for (const q of this.parts) { ctx.globalAlpha = Math.min(1, q.life / 10); ctx.fillStyle = q.c; ctx.fillRect(X(q.x), Y(q.y), 2, 2); } ctx.globalAlpha = 1;
    for (const q of this.texts) { ctx.globalAlpha = Math.min(1, q.life / 10); this.txt(q.t, X(q.x), Y(q.y), q.c, 'bold 9px monospace', 'center'); } ctx.globalAlpha = 1;
    ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + this.flash * 0.05 + ')'; ctx.fillRect(0, 0, 200, 300); }
    if (this.p.hp < this.p.maxHp * 0.3 && this.t % 40 < 20) { ctx.strokeStyle = 'rgba(255,0,0,0.5)'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, 196, 296); ctx.lineWidth = 1; }
  },

  drawWeapons(X, Y) {
    for (const id in this.weap) {
      const w = this.weap[id];
      if (id === 'blade' && w.pos) for (const q of w.pos) { ctx.save(); ctx.translate(X(q.x), Y(q.y)); ctx.rotate(q.a + 1.57); ctx.fillStyle = w.evo ? '#ffa' : '#dfe8ff'; ctx.fillRect(-1.5, -9, 3, 15); ctx.fillStyle = '#a63'; ctx.fillRect(-3, 5, 6, 2); ctx.restore(); }
      else if (id === 'spirit' && w.pos) for (const q of w.pos) { ctx.fillStyle = w.evo ? 'rgba(255,200,255,0.8)' : 'rgba(150,255,210,0.8)'; ctx.beginPath(); ctx.arc(X(q.x), Y(q.y), 5, 0, 6.283); ctx.fill(); ctx.fillRect(X(q.x) - 4, Y(q.y), 8, 5); ctx.fillStyle = '#012'; ctx.fillRect(X(q.x) - 2, Y(q.y) - 1, 1, 2); ctx.fillRect(X(q.x) + 1, Y(q.y) - 1, 1, 2); }
      else if (id === 'fire' && w.R) { const x = X(this.p.x), y = Y(this.p.y); ctx.strokeStyle = w.evo ? 'rgba(255,100,40,0.9)' : 'rgba(255,170,60,0.7)'; ctx.lineWidth = w.evo ? 4 : 3; ctx.beginPath(); ctx.arc(x, y, w.R + Math.sin(this.t * 0.2) * 2, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const a = this.t * 0.05 + i * 1.047; ctx.fillStyle = '#fd6'; ctx.fillRect(x + Math.cos(a) * w.R - 1, y + Math.sin(a) * w.R - 1, 3, 3); } }
    }
    for (const b of this.proj) {
      const x = X(b.x), y = Y(b.y);
      if (b.k === 'bolt') { ctx.fillStyle = '#c8f'; ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x - 1, y - 1, 2, 2); }
      else if (b.k === 'arrow') { ctx.save(); ctx.translate(x, y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.fillRect(-6, -1, 10, 2); ctx.fillStyle = '#fff'; ctx.fillRect(4, -2, 3, 4); ctx.restore(); }
      else if (b.k === 'shuri') { ctx.save(); ctx.translate(x, y); ctx.rotate(this.t * 0.4); ctx.fillStyle = b.c; ctx.fillRect(-b.r, -1.5, b.r * 2, 3); ctx.fillRect(-1.5, -b.r, 3, b.r * 2); ctx.restore(); }
      else if (b.k === 'wave') { ctx.save(); ctx.translate(x, y); ctx.rotate(b.a); ctx.strokeStyle = b.c; ctx.lineWidth = 4; ctx.globalAlpha = Math.min(1, b.life / 12); ctx.beginPath(); ctx.arc(-b.r * 0.6, 0, b.r, -1.0, 1.0); ctx.stroke(); ctx.restore(); ctx.lineWidth = 1; ctx.globalAlpha = 1; }
    }
  },

  drawUlt(px, py) {
    const u = this.ult;
    if (u.k === 'whirl') {
      ctx.strokeStyle = 'rgba(255,230,160,0.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(px, py, u.R, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) { const a = u.t * 0.35 + i * 0.785; ctx.save(); ctx.translate(px + Math.cos(a) * u.R * 0.8, py + Math.sin(a) * u.R * 0.8); ctx.rotate(a + 1.57); ctx.fillStyle = '#fff'; ctx.fillRect(-2, -14, 4, 28); ctx.restore(); }
    } else if (u.k === 'thunder') { ctx.fillStyle = 'rgba(200,170,255,' + (0.12 + 0.1 * Math.sin(u.t * 0.7)) + ')'; ctx.fillRect(0, 0, 200, 300); }
    else { ctx.strokeStyle = 'rgba(180,255,180,0.6)'; ctx.beginPath(); ctx.arc(px, py, 14 + u.t % 22, 0, 6.283); ctx.stroke(); }
  },

  drawBoss(e, x, y) {
    const t = e.bt || 0, fl = e.fl > 0;
    const body = fl ? '#fff' : null;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + e.r, e.r, 4, 0, 0, 6.283); ctx.fill();
    if (e.bid === 'bk1') { // 鬼武者
      const r = e.r;
      ctx.fillStyle = body || '#a22'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = body || '#611'; ctx.fillRect(x - r, y + 2, r * 2, 6);
      ctx.fillStyle = body || '#222'; ctx.fillRect(x - r - 3, y - r + 2, 8, 10); ctx.fillRect(x + r - 5, y - r + 2, 8, 10); // 兜の角台
      ctx.fillStyle = '#fd6'; ctx.beginPath(); ctx.moveTo(x - 6, y - r + 4); ctx.lineTo(x - 10, y - r - 12); ctx.lineTo(x - 2, y - r + 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 6, y - r + 4); ctx.lineTo(x + 10, y - r - 12); ctx.lineTo(x + 2, y - r + 2); ctx.fill();
      ctx.fillStyle = e.hp < e.mhp * 0.5 ? '#ff0' : '#fff'; ctx.fillRect(x - 8, y - 4, 5, 3); ctx.fillRect(x + 3, y - 4, 5, 3);
      ctx.fillStyle = '#000'; ctx.fillRect(x - 5, y + 4, 10, 2);
      if (e.bt % 290 > 120 && e.bt % 290 < 150) { ctx.strokeStyle = '#f66'; ctx.strokeRect(x - r - 2, y - r - 2, r * 2 + 4, r * 2 + 4); }
    } else if (e.bid === 'bk2') { // 樹妖の主
      ctx.fillStyle = body || '#5a3a1a'; ctx.fillRect(x - 11, y - 8, 22, 26);
      ctx.fillStyle = body || '#3a2410'; ctx.fillRect(x - 11, y - 8, 6, 26);
      ctx.fillStyle = body || '#2e7a2e'; for (const o of [[-14, -14, 12], [0, -22, 15], [14, -14, 12], [-6, -10, 11], [8, -10, 11]]) { ctx.beginPath(); ctx.arc(x + o[0], y + o[1], o[2], 0, 6.283); ctx.fill(); }
      ctx.fillStyle = e.hp < e.mhp * 0.5 ? '#f60' : '#ff6'; ctx.fillRect(x - 7, y - 2, 5, 5); ctx.fillRect(x + 2, y - 2, 5, 5);
      ctx.strokeStyle = body || '#5a3a1a'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 10 + i * 7, y + 17); ctx.quadraticCurveTo(x - 14 + i * 9 + Math.sin(t * 0.1 + i) * 4, y + 24, x - 16 + i * 11, y + 28); ctx.stroke(); } ctx.lineWidth = 1;
    } else { // 魔王
      const r = e.r, sec = !!e.second;
      ctx.fillStyle = sec ? 'rgba(255,40,40,0.25)' : 'rgba(150,60,255,0.25)'; ctx.beginPath(); ctx.arc(x, y, r + 8 + Math.sin(t * 0.1) * 3, 0, 6.283); ctx.fill();
      ctx.fillStyle = body || (sec ? '#411' : '#212'); ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r + 4, y + r); ctx.lineTo(x - r - 4, y + r); ctx.closePath(); ctx.fill();
      ctx.fillStyle = body || (sec ? '#a22' : '#639'); ctx.beginPath(); ctx.arc(x, y - 4, r * 0.6, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fd6'; ctx.beginPath(); ctx.moveTo(x - r * 0.5, y - 9); ctx.lineTo(x - r * 0.9, y - r - 8); ctx.lineTo(x - 2, y - 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + r * 0.5, y - 9); ctx.lineTo(x + r * 0.9, y - r - 8); ctx.lineTo(x + 2, y - 12); ctx.fill();
      ctx.fillStyle = '#f33'; ctx.fillRect(x - 6, y - 6, 4, 3); ctx.fillRect(x + 2, y - 6, 4, 3);
    }
  },

  // ---------- HUD ----------
  drawHUD() {
    const p = this.p;
    ctx.fillStyle = '#102'; ctx.fillRect(0, 0, 200, 4); ctx.fillStyle = '#4cf'; ctx.fillRect(0, 0, 200 * Math.min(1, this.exp / this.needExp()), 4);
    ctx.fillStyle = '#300'; ctx.fillRect(4, 8, 72, 8); ctx.fillStyle = p.hp < p.maxHp * 0.3 ? '#f44' : '#5d5'; ctx.fillRect(4, 8, 72 * Math.max(0, p.hp / p.maxHp), 8);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(4.5, 8.5, 71, 7);
    this.txt('Lv' + this.level, 80, 16, '#ff8', 'bold 9px monospace');
    this.txt(this.fmtTime(this.secs()), 196, 15, '#fff', 'bold 10px monospace', 'right');
    this.txt('撃破 ' + this.kills, 196, 25, '#fc8', '9px monospace', 'right');
    if (this.mode === 'stage' && !this.boss && !this.bossDone && !this.clearT) this.txt('ボスまで ' + this.fmtTime(Math.max(0, this.S.bossAt - this.secs())), 4, 26, '#f9a', '9px monospace');
    if (this.mode === 'endless') this.txt('第' + (this.bossCycle + 1) + '波', 4, 26, '#9cf', '9px monospace');
    if (this.boss) {
      const b = this.boss; ctx.fillStyle = '#300'; ctx.fillRect(14, 38, 172, 7); ctx.fillStyle = '#f33'; ctx.fillRect(14, 38, 172 * Math.max(0, b.hp / b.mhp), 7); ctx.strokeStyle = '#fff'; ctx.strokeRect(14.5, 38.5, 171, 6);
      this.txt(this.bossName, 100, 35, '#fcc', 'bold 9px monospace', 'center');
    }
    // 武器・パッシブ
    let i = 0;
    for (const id in this.weap) { const w = this.weap[id]; this.icon(4 + i * 15, 262, MU_WEAPONS[id].ch, MU_WEAPONS[id].col, w.lv >= 9 ? '★' : w.lv); i++; }
    i = 0;
    for (const id in this.pass) { this.icon(4 + i * 15, 277, MU_PASSIVES[id].ch, MU_PASSIVES[id].col, this.pass[id], true); i++; }
    // 無双ゲージ
    ctx.fillStyle = '#210'; ctx.fillRect(0, 292, 200, 8);
    const full = this.gauge >= 100; ctx.fillStyle = full ? (this.t % 10 < 5 ? '#fe4' : '#f84') : '#c63'; ctx.fillRect(0, 292, 200 * this.gauge / 100, 8);
    this.txt(full ? 'A: ' + this.hero.ultName + '！' : '無双ゲージ', 100, 299, full ? '#fff' : '#fc9', 'bold 8px monospace', 'center');
    if (this.msgT > 0) { ctx.globalAlpha = Math.min(1, this.msgT / 20); this.txt(this.msg, 100, 90, '#ff8', 'bold 13px monospace', 'center'); ctx.globalAlpha = 1; }
  },
  icon(x, y, ch, col, lv, pas) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, 14, 13); ctx.strokeStyle = col; ctx.strokeRect(x + 0.5, y + 0.5, 13, 12);
    this.txt(ch, x + 7, y + 10, col, 'bold 9px monospace', 'center');
    this.txt(String(lv), x + 13, y + 13, '#fff', 'bold 7px monospace', 'right');
  },

  // ---------- 各画面 ----------
  drawTitle() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, 200, 300);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,200,120,' + (0.2 + 0.5 * Math.abs(Math.sin(this.tmr * 0.02 + i))) + ')'; ctx.fillRect((i * 47) % 200, (i * 71 + this.tmr * 0.2) % 300, 1, 2); }
    // 山と月
    ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.arc(150, 70, 26, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#1a0f2a'; ctx.beginPath(); ctx.moveTo(0, 170); ctx.lineTo(50, 110); ctx.lineTo(95, 150); ctx.lineTo(140, 95); ctx.lineTo(200, 160); ctx.lineTo(200, 300); ctx.lineTo(0, 300); ctx.fill();
    // 三人の武将シルエット
    MU_HEROES.forEach((h, i) => this.spr('hero1', 55 + i * 45, 168 + (i === 1 ? -6 : 0), 4, [h.col, '#fc4'], i === 2, false, h.hair));
    ctx.shadowBlur = 14; ctx.shadowColor = '#f64';
    this.txt('無限無双', 100, 62, '#fc4', 'bold 30px monospace', 'center'); ctx.shadowBlur = 0;
    this.txt('MUSOU INFINITY', 100, 78, '#f98', 'bold 10px monospace', 'center');
    const items = ['ステージモード', '無限モード', '強化', '記録', 'もどる'];
    this.win(30, 205, 140, 86);
    items.forEach((s, i) => this.txt((i === this.cur ? '▶ ' : '  ') + s, 100, 224 + i * 15, i === this.cur ? '#ff6' : '#fff', 'bold 11px monospace', 'center'));
    this.txt('◎ ' + this.sv.coins, 196, 12, '#fc2', 'bold 9px monospace', 'right');
  },
  drawStages() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, 200, 300);
    this.txt('ステージ選択', 100, 24, '#fc4', 'bold 14px monospace', 'center');
    MU_STAGES.forEach((s, i) => {
      const y = 40 + i * 76, lock = !this.stageUnlocked(i), sel = i === this.scur;
      ctx.fillStyle = s.theme.bg; ctx.fillRect(10, y, 180, 68);
      ctx.fillStyle = s.theme.t1; for (let k = 0; k < 8; k++) ctx.fillRect(10 + k * 24, y + ((k & 1) ? 0 : 24), 12, 12);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(10, y, 180, 68);
      ctx.strokeStyle = sel ? '#ff6' : '#765'; ctx.lineWidth = sel ? 2 : 1; ctx.strokeRect(10, y, 180, 68); ctx.lineWidth = 1;
      this.txt('第' + s.id + '章', 18, y + 16, '#fa8', 'bold 10px monospace');
      this.txt(lock ? '？？？' : s.name, 18, y + 32, lock ? '#888' : '#fff', 'bold 13px monospace');
      if (lock) this.txt('前の章を クリアすると 解放', 18, y + 50, '#999', '9px monospace');
      else { this.txt('ボス: ' + s.bossName, 18, y + 48, '#f99', '9px monospace'); const r = this.sv.rec.stage[i]; this.txt(this.sv.clear[i] ? '★クリア ' + this.fmtTime(r.time) : '未クリア', 18, y + 61, this.sv.clear[i] ? '#ff8' : '#aaa', '9px monospace'); }
    });
    this.txt('A:決定  B:戻る', 100, 292, '#9ab', '9px monospace', 'center');
  },
  drawHeroes() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, 200, 300);
    this.txt('武将を選べ', 100, 24, '#fc4', 'bold 14px monospace', 'center');
    MU_HEROES.forEach((h, i) => {
      const x = 10 + i * 60, lock = !this.heroUnlocked(i), sel = i === this.hcur;
      ctx.fillStyle = sel ? '#3a2a1a' : '#1a1020'; ctx.fillRect(x, 36, 56, 76); ctx.strokeStyle = sel ? '#ff6' : '#765'; ctx.lineWidth = sel ? 2 : 1; ctx.strokeRect(x, 36, 56, 76); ctx.lineWidth = 1;
      if (lock) { this.txt('？', x + 28, 82, '#666', 'bold 30px monospace', 'center'); }
      else { this.spr(sel && this.tmr % 40 < 20 ? 'hero2' : 'hero1', x + 28, 66, 4, [h.col, '#fc4'], false, false, h.hair); this.txt(h.name, x + 28, 104, '#fff', 'bold 11px monospace', 'center'); }
    });
    const h = MU_HEROES[this.hcur], lock = !this.heroUnlocked(this.hcur);
    this.win(10, 122, 180, 150);
    if (lock) { this.txt('？？？', 100, 160, '#aaa', 'bold 14px monospace', 'center'); this.txt('ステージモードで 第' + (h.unlock + 1) + '章を\nクリアすると 仲間になる'.split('\n')[0], 100, 188, '#fa8', '10px monospace', 'center'); this.txt('クリアすると 仲間になる', 100, 202, '#fa8', '10px monospace', 'center'); }
    else {
      this.txt(h.title + ' ' + h.name, 100, 142, '#fc4', 'bold 12px monospace', 'center');
      let y = 160; for (const l of this.wrapText(h.desc, 160)) { this.txt(l, 20, y, '#fff'); y += 13; }
      y += 6; this.txt('体力 ' + h.hp + '  速度 ' + h.spd.toFixed(1) + '  攻撃 ' + h.atk.toFixed(2), 20, y, '#9cf', '9px monospace'); y += 16;
      this.txt('初期武器: ' + MU_WEAPONS[h.weapon].name, 20, y, MU_WEAPONS[h.weapon].col); y += 14;
      this.txt('無双乱舞: ' + h.ultName, 20, y, '#fa6', 'bold 10px monospace');
    }
    this.txt('◀▶:選択  A:出陣  B:戻る', 100, 292, '#9ab', '9px monospace', 'center');
  },
  drawShop() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, 200, 300);
    this.txt('強化', 100, 22, '#fc4', 'bold 14px monospace', 'center'); this.txt('◎ ' + this.sv.coins, 190, 22, '#fc2', 'bold 10px monospace', 'right');
    const keys2 = Object.keys(MU_SHOP), top = Math.max(0, Math.min(keys2.length + 1 - 8, this.cur2 - 3));
    for (let i = top; i < Math.min(keys2.length + 1, top + 8); i++) {
      const y = 34 + (i - top) * 31, sel = i === this.cur2;
      ctx.fillStyle = sel ? '#3a2a1a' : '#160e1e'; ctx.fillRect(8, y, 184, 28); ctx.strokeStyle = sel ? '#ff6' : '#543'; ctx.strokeRect(8.5, y + 0.5, 183, 27);
      if (i === keys2.length) { this.txt('もどる', 100, y + 18, '#fff', 'bold 11px monospace', 'center'); continue; }
      const k = keys2[i], it = MU_SHOP[k], lv = this.sv.shop[k], max = lv >= it.max;
      this.txt(it.name, 14, y + 12, '#fff', 'bold 10px monospace'); this.txt(it.desc, 14, y + 24, '#9ab', '8px monospace');
      this.txt('Lv' + lv + '/' + it.max, 186, y + 12, '#ff8', 'bold 9px monospace', 'right');
      this.txt(max ? 'MAX' : '◎' + this.shopCost(k), 186, y + 24, max ? '#8f8' : (this.sv.coins >= this.shopCost(k) ? '#fc2' : '#f66'), 'bold 9px monospace', 'right');
    }
  },
  drawRecords() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, 200, 300);
    this.txt('記録', 100, 24, '#fc4', 'bold 14px monospace', 'center'); this.win(10, 36, 180, 240);
    const r = this.sv.rec; let y = 56;
    this.txt('【無限モード】', 20, y, '#9cf', 'bold 10px monospace'); y += 15;
    this.txt('最長生存 ' + this.fmtTime(r.endless.time), 24, y); y += 13; this.txt('撃破数 ' + r.endless.kills, 24, y); y += 20;
    MU_STAGES.forEach((s, i) => { this.txt('【第' + s.id + '章 ' + s.name + '】', 20, y, '#fa8', 'bold 10px monospace'); y += 14; this.txt(this.sv.clear[i] ? 'クリア ' + this.fmtTime(r.stage[i].time) + ' 撃破' + r.stage[i].kills : '未クリア', 24, y, this.sv.clear[i] ? '#ff8' : '#888'); y += 20; });
    this.txt('総撃破数 ' + this.sv.totalKills, 20, y, '#fff'); y += 14; this.txt('出陣回数 ' + this.sv.runs, 20, y, '#fff');
    this.txt('A/B:戻る', 100, 292, '#9ab', '9px monospace', 'center');
  },
  drawStory() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = 'rgba(255,200,150,' + (0.2 + 0.4 * Math.abs(Math.sin(this.tmr * 0.03 + i))) + ')'; ctx.fillRect((i * 53) % 200, (i * 37) % 150, 1, 1); }
    ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.arc(150, 56, 22, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#1a0f2a'; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(60, 90); ctx.lineTo(110, 130); ctx.lineTo(160, 80); ctx.lineTo(200, 140); ctx.lineTo(200, 160); ctx.lineTo(0, 160); ctx.fill();
    const s = this.story; this.win(8, 170, 184, 122);
    const lines = this.wrapText(s.pages[s.i], 166); let left = Math.floor(s.ci), y = 192;
    for (const l of lines.slice(0, 6)) { this.txt(l.slice(0, Math.max(0, left)), 16, y, '#fff'); left -= l.length; y += 17; }
    if (s.ci >= s.pages[s.i].length && this.tmr % 30 < 18) this.txt('▼', 178, 286, '#ff0');
  },
  drawLevelUp() {
    this.drawWorld(); this.drawHUD();
    ctx.fillStyle = 'rgba(0,0,20,0.8)'; ctx.fillRect(0, 0, 200, 300);
    this.txt('LEVEL UP!', 100, 38, '#ff6', 'bold 18px monospace', 'center'); this.txt('Lv ' + this.level, 100, 54, '#fff', '10px monospace', 'center');
    this.choices.forEach((c, i) => {
      const t = this.choiceText(c), y = 66 + i * 58, sel = i === this.ccur;
      this.win(10, y, 180, 52, sel ? 'rgba(60,40,10,0.95)' : 'rgba(10,8,24,0.95)');
      if (sel) { ctx.strokeStyle = '#ff6'; ctx.lineWidth = 2; ctx.strokeRect(10, y, 180, 52); ctx.lineWidth = 1; }
      ctx.fillStyle = '#111'; ctx.fillRect(18, y + 10, 30, 30); ctx.strokeStyle = t.col; ctx.strokeRect(18.5, y + 10.5, 29, 29); this.txt(t.ch, 33, y + 32, t.col, 'bold 18px monospace', 'center');
      this.txt(t.name, 56, y + 22, '#fff', 'bold 11px monospace'); let yy = y + 36; for (const l of this.wrapText(t.sub, 128).slice(0, 2)) { this.txt(l, 56, yy, '#9ab', '9px monospace'); yy += 10; }
    });
    const yy = 66 + this.choices.length * 58, sel = this.ccur === this.choices.length;
    this.win(10, yy, 180, 24, sel ? 'rgba(60,40,10,0.95)' : 'rgba(10,8,24,0.95)');
    this.txt('振り直す (残り ' + this.rerolls + ')', 100, yy + 16, this.rerolls > 0 ? '#fff' : '#777', 'bold 10px monospace', 'center');
    this.txt('↑↓:選択  A:決定', 100, 292, '#9ab', '9px monospace', 'center');
  },
  drawChest() {
    this.drawWorld(); this.drawHUD(); ctx.fillStyle = 'rgba(0,0,20,0.8)'; ctx.fillRect(0, 0, 200, 300);
    const t = this.chestT, op = t > 40;
    ctx.save(); ctx.translate(100, 110); if (!op) ctx.translate((Math.random() - 0.5) * 3, 0);
    ctx.fillStyle = '#a62'; ctx.fillRect(-26, -10, 52, 36); ctx.fillStyle = '#fc0'; ctx.fillRect(-26, -10, 52, 10); ctx.fillRect(-4, 4, 8, 10);
    if (op) { ctx.fillStyle = '#6a3a10'; ctx.fillRect(-26, -26, 52, 16); ctx.fillStyle = 'rgba(255,240,150,' + Math.min(0.8, (t - 40) / 20) + ')'; ctx.beginPath(); ctx.moveTo(-20, -10); ctx.lineTo(0, -80); ctx.lineTo(20, -10); ctx.fill(); }
    ctx.restore();
    if (op) {
      const c = this.choiceText(this.chestC); this.win(14, 160, 172, 80);
      this.txt('宝箱から ' + (this.chestC.t === 'evo' ? '覚醒の力が！' : '力を 授かった！'), 100, 182, '#ff8', 'bold 11px monospace', 'center');
      this.txt(c.name, 100, 206, '#fff', 'bold 12px monospace', 'center'); this.txt(c.sub, 100, 224, '#9ab', '9px monospace', 'center');
      if (this.tmr % 30 < 20) this.txt('A:決定', 100, 292, '#ff0', '10px monospace', 'center');
    }
  },
  drawPause() {
    this.drawWorld(); this.drawHUD(); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, 200, 300);
    this.win(40, 100, 120, 80); this.txt('一時停止', 100, 122, '#ff6', 'bold 12px monospace', 'center');
    ['再開', 'リタイア'].forEach((s, i) => this.txt(((this.pcur || 0) === i ? '▶ ' : '  ') + s, 100, 148 + i * 18, (this.pcur || 0) === i ? '#ff6' : '#fff', 'bold 11px monospace', 'center'));
    this.txt('B:再開', 100, 292, '#9ab', '9px monospace', 'center');
  },
  drawResult() {
    ctx.fillStyle = '#0a0612'; ctx.fillRect(0, 0, 200, 300);
    const r = this.res;
    this.txt(r.cleared ? 'STAGE CLEAR!' : this.mode === 'endless' ? '力尽きた…' : 'GAME OVER', 100, 48, r.cleared ? '#fc4' : '#f66', 'bold 20px monospace', 'center');
    this.win(14, 66, 172, 170);
    let y = 90; const row = (a, b, c) => { this.txt(a, 26, y, '#9ab'); this.txt(b, 174, y, c || '#fff', 'bold 11px monospace', 'right'); y += 22; };
    row('武将', this.hero.name + '(' + this.hero.title + ')'); row('生存時間', this.fmtTime(r.time)); row('撃破数', String(r.kills)); row('到達レベル', 'Lv' + r.level);
    row('獲得コイン', '◎ ' + r.coins, '#fc2');
    if (r.rec) this.txt('★ 最長記録更新！', 100, 226, '#ff8', 'bold 11px monospace', 'center');
    if (r.nu.length) this.txt(r.nu.join('・') + ' が解放！', 100, 226, '#8f8', 'bold 11px monospace', 'center');
    if (this.tmr > 40 && this.tmr % 40 < 26) this.txt('A:つづける', 100, 280, '#ff0', '10px monospace', 'center');
  },

  // ---------- 描画ディスパッチ ----------
  draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'left'; ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    switch (this.st) {
      case 'title': return this.drawTitle();
      case 'stages': return this.drawStages();
      case 'heroes': return this.drawHeroes();
      case 'shop': return this.drawShop();
      case 'records': return this.drawRecords();
      case 'story': return this.drawStory();
      case 'play': this.drawWorld(); this.drawHUD(); return;
      case 'levelup': return this.drawLevelUp();
      case 'chest': return this.drawChest();
      case 'pause': return this.drawPause();
      case 'result': return this.drawResult();
    }
  }
});
