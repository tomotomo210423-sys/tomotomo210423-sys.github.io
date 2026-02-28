// === AUTO FIGHTER (Phase 22: PERFECT SINGLE FILE EDITION) ===

const Styles = {
    RUSH: { name: 'インファイター', desc: '常に前進し、接近戦でのコンボを狙う。', aggro: 0.8, guard: 0.1, dodge: 0.1, range: 35 },
    ZONE: { name: 'アウトレンジャー', desc: '距離を保ち、遠距離技でじわじわ削る。', aggro: 0.3, guard: 0.2, dodge: 0.5, range: 120 },
    COUNTER: { name: 'カウンター特化', desc: 'ガードと回避を多用して敵の攻撃を誘う。', aggro: 0.2, guard: 0.6, dodge: 0.2, range: 50 },
    TRICKY: { name: 'トリッキー', desc: '不規則なステップやワープ技を駆使する。', aggro: 0.5, guard: 0.2, dodge: 0.3, range: 80 },
    AERO: { name: '空の支配者', desc: '常に空中戦を好む。上空からの強襲を狙う。', aggro: 0.6, guard: 0.1, dodge: 0.4, range: 60 },
    BALANCE: { name: 'バランス', desc: '近・遠・防御を状況に応じて使い分ける。', aggro: 0.5, guard: 0.3, dodge: 0.3, range: 80 },
    DEVIL: { name: 'デビル', desc: '相手をハメることに全力を尽くす。', aggro: 1.0, guard: 0.0, dodge: 0.1, range: 45 },
    SANS: { name: 'Sans', desc: '【特殊】HPが回避ゲージとなり確定回避。', aggro: 0.4, guard: 0.0, dodge: 1.0, range: 150 }
};
const Passives = {
    NONE: { name: 'なし', desc: '特別な効果を持たない。' },
    VAMPIRE: { name: '吸血鬼', desc: '与えたダメージの20%だけ自身のHPを回復。' },
    DESPERATION: { name: '背水の陣', desc: '自身のHPが30%以下の時、与ダメ1.5倍。' },
    GIANT: { name: '巨人の体', desc: '常に受けるダメージを20%カットする。' },
    NINJA: { name: '忍', desc: '移動スピードと回避距離がアップする。' },
    LEARNING: { name: '成長AI', desc: '相手の行動をリアルタイムに学習し最適化。' },
    MAHORAGA: { name: '摩虎羅', desc: '同じ技を5回受けると適応。被ダメ半減。' },
    HOVER: { name: '浮遊', desc: '重力を完全に無視して自在に飛行できる。' },
    SANS_DODGE: { name: 'オート回避', desc: 'Sans専用。HPを消費して攻撃を確定回避。' }
};
const AwakenConds = { NONE: { name:'なし', desc:'覚醒を行わない。' }, HP20: { name:'HP20%以下', desc:'HPが残り20%を切ると覚醒。' }, TIME: { name:'30秒経過', desc:'30秒経つと覚醒。' } };
const AwakenPassives = { ...Passives, CLONE: { name: '影分身', desc: '自身と同じ動きをする分身を2体召喚する。' } };
const Skills = {
    jab: {name:'ジャブ', dmg:10, kb:2, range:35, start:4, act:8, rec:12, cd:10, vx:4, type:'melee', desc:'発生最速の基本技。'},
    upper: {name:'アッパー', dmg:20, kb:2, range:40, start:7, act:12, rec:20, cd:20, vx:5, type:'anti_air', desc:'相手を高く打ち上げる。'},
    smash: {name:'スマッシュ', dmg:40, kb:12, range:45, start:14, act:15, rec:35, cd:40, vx:8, type:'melee', desc:'強烈に吹き飛ばす必殺の一撃。'},
    meteor: {name:'メテオ', dmg:50, kb:15, range:45, start:10, act:15, rec:30, cd:40, vx:6, type:'air', desc:'【空中専用】敵を地面に叩き落とす。'},
    slide: {name:'スライド', dmg:20, kb:4, range:45, start:6, act:20, rec:20, cd:25, vx:12, type:'melee', desc:'高速で突進する奇襲技。'},
    beam: {name:'ビーム', dmg:40, kb:10, range:350, start:25, act:15, rec:40, cd:60, vx:-2, type:'range', desc:'正確に狙い撃つ長距離レーザー。'},
    sonic: {name:'ソニック', dmg:25, kb:4, range:200, start:12, act:1, rec:25, cd:30, vx:0, type:'shot', desc:'相手のいる方向へ飛ぶ衝撃波。'},
    dive: {name:'急降下', dmg:35, kb:8, range:60, start:8, act:15, rec:25, cd:30, vx:10, type:'air', desc:'【空中専用】斜め下へ突進蹴り。'},
    shoryu: {name:'昇龍拳', dmg:30, kb:10, range:40, start:5, act:15, rec:35, cd:35, vx:4, type:'anti_air', desc:'飛び上がりながら攻撃。対空に優れる。'},
    heal: {name:'ヒール', dmg:0, kb:0, range:0, start:30, act:5, rec:30, cd:120, vx:0, type:'buff', desc:'自身のHPを200回復する。'},
    warpAtk: {name:'幻影斬', dmg:25, kb:5, range:150, start:15, act:10, rec:25, cd:50, vx:0, type:'warp', desc:'相手の背後に一瞬でワープし斬る。'},
    throw: {name:'投げ技', dmg:35, kb:8, range:30, start:8, act:10, rec:20, cd:25, vx:5, type:'throw', desc:'ガード不能の投げ技。'},
    physCounter: {name:'物理当て身', dmg:0, kb:0, range:0, start:2, act:30, rec:20, cd:30, vx:0, type:'stance_phys', desc:'直接攻撃を無効化し超絶反撃。'},
    magReflect: {name:'魔法反射', dmg:0, kb:0, range:0, start:2, act:40, rec:20, cd:30, vx:0, type:'stance_mag', desc:'飛び道具を相手に跳ね返す。'},
    parapara: {name:'パラパラ', dmg:5, kb:1, range:0, start:10, act:5, rec:20, cd:90, vx:0, type:'summon', desc:'自機を追従し自動で弾を撃つUFO召喚。'},
    pull: {name:'追撃腕', dmg:15, kb:-15, range:150, start:8, act:10, rec:20, cd:30, vx:0, type:'pull', desc:'腕を伸ばして相手を引き寄せる。'},
    burst: {name:'爆裂拳', dmg:6, kb:1, range:40, start:6, act:40, rec:20, cd:35, vx:3, type:'multi', desc:'連続パンチ。最後は超威力で吹き飛ばす。'},
    random: {name:'RANDOM', dmg:0, kb:0, range:100, start:5, act:5, rec:15, cd:20, vx:0, type:'random', desc:'自爆か回復か謎の雷か...予測不可能。'},
    sans_bone: {name:'骨の壁', dmg:1, kb:0, range:200, start:10, act:30, rec:15, cd:20, vx:0, type:'sans_bone', desc:'地面から連続して骨を生やす。'},
    sans_blaster: {name:'ブラスター', dmg:2, kb:0, range:350, start:15, act:15, rec:25, cd:35, vx:0, type:'sans_blaster', desc:'極太ビームを放つ。'},
    sans_throw: {name:'通常骨', dmg:1, kb:0, range:250, start:5, act:15, rec:10, cd:15, vx:0, type:'sans_throw', desc:'様々なサイズの骨を大量に放つ。'},
    sans_warp: {name:'ちかみち', dmg:0, kb:0, range:0, start:2, act:5, rec:5, cd:30, vx:0, type:'sans_warp', desc:'一瞬で有利な位置へテレポートする。'}
};

// ★ Sansのスキルは通常選択画面に表示させない
const SkillKeys = Object.keys(Skills).filter(k => !k.startsWith('sans_'));
const CounterData = {name:'カウンター', dmg:80, kb:15, range:45, start:4, act:15, rec:20, cd:0, vx:8, type:'melee'};
const getStyle = (key) => Styles[key] || Styles['RUSH'];
const getPassive = (key) => Passives[key] || Passives['NONE'];
const getAwaken = (key) => AwakenConds[key] || AwakenConds['NONE'];
const getAwakenPassive = (key) => AwakenPassives[key] || AwakenPassives['NONE'];
const getSkill = (key) => Skills[key] || Skills['jab'];
const safeNum = (val, def) => { let n = Number(val); return (isNaN(n) || !isFinite(n)) ? def : n; };

const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0, stageWidth: 800, stageHeight: 500, groundY: 420, scale: 0.65, camX: 0, camY: 0,
  texts: [], vfx: [], bullets: [], isSim: false, simEpoch: 0, simMaxEpoch: 20, simWins: 0, isInfinite: false,
  myAI: {}, savedSlots: [null, null, null], labSt: 'main', labCur: 0, trainingMsg: '',

  sanitizeAI(ai) {
      if (!ai || typeof ai !== 'object') ai = {}; ai.name = ai.name || 'MY-AI';
      ai.body = ai.body || {}; ai.body.width = Math.max(0.1, safeNum(ai.body.width, 1.0)); ai.body.height = Math.max(0.1, safeNum(ai.body.height, 1.0)); ai.body.head = Math.max(0.1, safeNum(ai.body.head, 1.0));
      ai.color = ai.color || {}; ai.color.body = typeof ai.color.body === 'string' ? ai.color.body : '#0ff'; ai.color.aura = typeof ai.color.aura === 'string' ? ai.color.aura : '#ff0';
      ai.physics = ai.physics || {}; ai.physics.weight = Math.max(10, safeNum(ai.physics.weight, 100));
      ai.base = ai.base || {}; ai.base.atk = Math.max(0.1, safeNum(ai.base.atk, 1.0)); ai.base.res = Math.max(0.1, safeNum(ai.base.res, 1.0)); ai.base.spd = Math.max(0.1, safeNum(ai.base.spd, 1.0));
      ai.bonus = ai.bonus || {}; ai.bonus.atk = safeNum(ai.bonus.atk, 0); ai.bonus.res = safeNum(ai.bonus.res, 0); ai.bonus.spd = safeNum(ai.bonus.spd, 0);
      ai.styleKey = Styles[ai.styleKey] ? ai.styleKey : 'RUSH';
      
      // ★ Sansを選んだ時は専用スキルを強制セット
      if (ai.styleKey === 'SANS') { 
          ai.skillKeys = ['sans_bone', 'sans_blaster', 'sans_throw', 'sans_warp']; 
          ai.passiveKey = 'SANS_DODGE'; ai.color.body = '#fff'; ai.color.aura = '#0ff'; 
      } else { 
          if (!Array.isArray(ai.skillKeys)) ai.skillKeys = ['jab', 'upper', 'smash', 'sonic']; 
          while (ai.skillKeys.length < 4) ai.skillKeys.push('jab'); 
          for (let i = 0; i < 4; i++) if (!Skills[ai.skillKeys[i]] || ai.skillKeys[i].startsWith('sans_')) ai.skillKeys[i] = 'jab'; 
          ai.passiveKey = Passives[ai.passiveKey] && ai.passiveKey !== 'SANS_DODGE' ? ai.passiveKey : 'NONE'; 
      }
      ai.awakenCond = AwakenConds[ai.awakenCond] ? ai.awakenCond : 'NONE'; ai.awakenPassive = AwakenPassives[ai.awakenPassive] ? ai.awakenPassive : 'NONE'; ai.awakenColor = typeof ai.awakenColor === 'string' ? ai.awakenColor : '#f00'; ai.learningLevel = Math.max(0, safeNum(ai.learningLevel, 0)); return ai;
  },

  play(snd) { if(!this.isSim && typeof playSnd !== 'undefined') playSnd(snd); },
  shake(val) { if(!this.isSim && typeof screenShake !== 'undefined') screenShake(safeNum(val, 0)); },
  stop(val) { if(!this.isSim && typeof hitStop !== 'undefined') hitStop(safeNum(val, 0)); },
  addText(x, y, text, color) { if(this.isSim || !text) return; this.texts.push({x: safeNum(x,0), y: safeNum(y,0), text: String(text), color: color||'#fff', life: 40}); },
  addVFX(type, x, y, color, extra={}) { if(this.isSim) return; this.vfx.push({type, x: safeNum(x,0), y: safeNum(y,0), color: color||'#fff', life: safeNum(extra.life,20), maxLife: safeNum(extra.maxLife,20), ...extra}); },
  
  drawDescBox(title, descStr) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(5, 205, 190, 90); ctx.strokeStyle = '#555'; ctx.strokeRect(5, 205, 190, 90);
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 11px monospace'; ctx.fillText(title || '[ INFO ]', 15, 220); ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
      let safeDesc = descStr || ''; let lines = []; for(let i=0; i<safeDesc.length; i+=17) lines.push(safeDesc.substring(i, i+17)); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 15, 238 + i*13);
  },

  init() { 
      this.st = 'menu'; this.menuCur = 0; this.isSim = false; this.isInfinite = false; BGM.play('menu'); this.myAI = this.sanitizeAI({});
      try { let data = localStorage.getItem('5in1_ultima_ai_slots'); if (data) this.savedSlots = JSON.parse(data); if (this.savedSlots && this.savedSlots[0]) this.myAI = this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[0]))); } catch(e) { this.savedSlots = [null,null,null]; }
  },
  checkHealth() { this.myAI = this.sanitizeAI(this.myAI); },
  saveSlot(index) { this.checkHealth(); this.savedSlots[index] = JSON.parse(JSON.stringify(this.myAI)); localStorage.setItem('5in1_ultima_ai_slots', JSON.stringify(this.savedSlots)); },
  loadSlot(index) { if (this.savedSlots && this.savedSlots[index]) { this.myAI = this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[index]))); return true; } return false; },

  createFighter(isP2, data) {
      let stKey = Styles[data.styleKey] ? data.styleKey : 'RUSH'; let safeBonus = data.bonus || {atk:0, res:0, spd:0}; let safeBase = data.base || {atk:1, res:1, spd:1};
      return { id: isP2 ? 2 : 1, x: isP2 ? 550 : 250, y: this.groundY, dir: isP2 ? -1 : 1, hp: 1000, maxHp: 1000, kr: 0, base: { atk: safeBase.atk + safeBonus.atk, res: safeBase.res + safeBonus.res, spd: safeBase.spd + safeBonus.spd }, body: data.body || {width:1, height:1, head:1}, color: data.color || {body:'#fff', aura:'#ff0'}, physics: data.physics || {weight:100}, styleKey: stKey, skillKeys: data.skillKeys || ['jab','upper','smash','sonic'], passiveKey: data.passiveKey || 'NONE', awakenCond: data.awakenCond || 'NONE', awakenPassive: data.awakenPassive || 'NONE', awakenColor: data.awakenColor || '#f00', dynGuard: getStyle(stKey).guard, dynDodge: getStyle(stKey).dodge, hitHistory: {}, adapting: {}, adapted: {}, state: 'idle', stateFrame: 0, prevState: 'idle', cd: 0, name: data.name || 'FIGHTER', vx: 0, vy: 0, guarding: false, justGuardWindow: 0, trail: [], hitCancel: false, hasHit: false, combo: 0, comboTimer: 0, comboDmg: 0, isAwakened: false, funnelTimer: 0, hasClones: false };
  },

  setupSimBattle() {
      this.checkHealth(); this.timer = 0; this.texts = []; this.vfx = []; this.bullets = []; this.p1 = this.createFighter(false, this.myAI);
      let isMirror = Math.random() < 0.25; 
      if (isMirror) { this.p2 = this.createFighter(true, this.myAI); this.p2.name = 'MIRROR'; this.p2.color = { body: '#555', aura: '#888' }; } 
      else {
          let eStyle = Object.keys(Styles)[Math.floor(Math.random()*Object.keys(Styles).length)]; let dummySkills = []; let dummyPassive = 'NONE';
          if (eStyle === 'ZONE') { dummySkills = ['beam', 'sonic', 'parapara', 'magReflect']; dummyPassive = 'HOVER'; } else if (eStyle === 'RUSH' || eStyle === 'DEVIL') { dummySkills = ['jab', 'smash', 'burst', 'throw']; dummyPassive = 'VAMPIRE'; } else if (eStyle === 'AERO') { dummySkills = ['dive', 'meteor', 'sonic', 'upper']; dummyPassive = 'HOVER'; } else if (eStyle === 'COUNTER') { dummySkills = ['physCounter', 'magReflect', 'upper', 'pull']; dummyPassive = 'MAHORAGA'; } else if (eStyle === 'SANS') { dummySkills = ['sans_bone', 'sans_blaster', 'sans_throw', 'sans_warp']; dummyPassive = 'SANS_DODGE'; } else { dummySkills = [...SkillKeys].sort(()=>Math.random()-0.5).slice(0,4); dummyPassive = 'LEARNING'; }
          let dummyData = this.sanitizeAI({ name: 'DUMMY-' + eStyle, styleKey: eStyle, skillKeys: dummySkills, passiveKey: dummyPassive });
          if(eStyle === 'SANS') { dummyData.color = { body: '#fff', aura: '#0ff' }; } this.p2 = this.createFighter(true, dummyData);
      }
      this.camX = (this.p1.x + this.p2.x) / 2 - (200 / this.scale) / 2; this.camY = this.groundY - (300 / this.scale) / 2;
  },

  update() { try { this._update(); } catch(e) { console.error("SafeUpdate:", e); this.timer++; } },
  
  updateBattleState() {
      try {
          this.timer++; let dist = Math.abs(safeNum(this.p1.x,0) - safeNum(this.p2.x,0));
          if (dist < 15) { if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; } else { let push = (15 - dist) / 2; this.p1.x += (this.p1.x < this.p2.x) ? -push : push; this.p2.x += (this.p2.x < this.p1.x) ? -push : push; } }
          
          this.processFighter(this.p1, this.p2); this.processFighter(this.p2, this.p1);
          
          for(let i=this.bullets.length-1; i>=0; i--) {
              let b = this.bullets[i]; 
              if(!b || !b.owner || !b.skill || safeNum(b.x,0) < -1000 || safeNum(b.x,0) > this.stageWidth + 1000) { this.bullets.splice(i, 1); continue; }
              
              if (b.skill.type === 'homing') {
                  let opp = b.owner.id === 1 ? this.p2 : this.p1;
                  let dx = safeNum(opp.x, 0) - b.x; let dy = (safeNum(opp.y, this.groundY) - 20) - b.y;
                  let d_len = Math.hypot(dx, dy) || 1; b.vx += (dx/d_len) * 0.8; b.vy += (dy/d_len) * 0.8;
                  let spd = Math.hypot(b.vx, b.vy); if(spd > 12) { b.vx = (b.vx/spd)*12; b.vy = (b.vy/spd)*12; }
              }
              
              b.x += b.vx; b.y += b.vy; b.life--; 
              let auraCol = (b.owner.color && b.owner.color.aura) ? b.owner.color.aura : '#ff0';
              let bAngle = Math.atan2(b.vy, b.vx); 
              this.addVFX('slash', b.x, b.y, auraCol, {size: 15, angle: bAngle, width: 4, life:2});
              
              let opp = b.owner.id === 1 ? this.p2 : this.p1; let hit = false;
              if (Math.abs(b.x - safeNum(opp.x,0)) < 30 && Math.abs(b.y - safeNum(opp.y,0)) < 50 && opp.state !== 'hurt' && opp.state !== 'stunned' && opp.state !== 'knockdown') {
                  if (opp.state === 'atk_magReflect') { b.vx *= -1; b.owner = opp; b.life = 60; this.addVFX('impact', b.x, b.y, '#0ff', {size: 40}); this.addText(opp.x, opp.y - 40, "REFLECT!!", "#0ff"); this.play('combo'); } 
                  else { hit = this.applyHit(b.owner, b.skill, opp, b.x, b.y); }
              }
              if(b.life <= 0 || hit) this.bullets.splice(i, 1);
          }
          [this.p1, this.p2].forEach(f => { if(f){ if (f.comboTimer > 0) f.comboTimer--; if (f.comboTimer <= 0 && f.state !== 'hurt' && f.state !== 'stunned' && f.state !== 'knockdown') { let opp = f.id === 1 ? this.p2 : this.p1; if(opp){ opp.combo = 0; opp.comboDmg = 0; } } } });

          let viewW = 200 / this.scale; let viewH = 300 / this.scale;
          let targetX = (safeNum(this.p1.x,0) + safeNum(this.p2.x,0)) / 2 - viewW / 2; let targetY = (safeNum(this.p1.y,0) + safeNum(this.p2.y,0)) / 2 - viewH * 0.6; 
          targetX = Math.max(0, Math.min(this.stageWidth - viewW, targetX)); targetY = Math.max(0, Math.min(this.stageHeight - viewH, targetY));
          this.camX += (targetX - this.camX) * 0.1; this.camY += (targetY - this.camY) * 0.1;
      } catch(e) { console.error("BattleState Error:", e); }
  },

  _update() {
    this.checkHealth(); if (keysDown.select) { switchApp(Menu); return; }
    if (this.st === 'menu') {
        if (keysDown.up) { this.menuCur = (this.menuCur - 1 + 3) % 3; this.play('sel'); } if (keysDown.down) { this.menuCur = (this.menuCur + 1) % 3; this.play('sel'); }
        if (keysDown.a) { this.play('jmp'); if (this.menuCur === 0) { this.setupSimBattle(); this.st = 'battle'; BGM.play('action'); } else if (this.menuCur === 1) { this.st = 'lab_main'; this.labCur = 0; } else { this.st = 'load_slot'; this.labCur = 0; } }
        for (let i = this.texts.length - 1; i >= 0; i--) { this.texts[i].life--; this.texts[i].y -= 0.5; if (this.texts[i].life <= 0) this.texts.splice(i, 1); } return;
    }
    if (this.st === 'load_slot') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; this.play('sel'); }
        if (keysDown.b) { this.st = 'menu'; this.play('hit'); return; }
        if (keysDown.a) { if (this.loadSlot(this.labCur)) { this.st = 'menu'; this.play('combo'); this.addText(100, 150, "LOAD SUCCESS!", "#0f0"); } else this.play('hit'); } return;
    }
    if (this.st === 'lab_main') {
        const items = ['AI名前変更', '戦闘スタイル', 'スキルセット', 'パッシブ＆覚醒', 'ステータス', '体型＆カラー', '通常学習(20回)', '無限強化学習', 'AI初期化', '戻る'];
        if (keysDown.up) { this.labCur = (this.labCur - 1 + items.length) % items.length; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % items.length; this.play('sel'); }
        if (keysDown.a) {
            this.play('hit');
            if (this.labCur === 0) { let n = prompt("名前 (10文字)", this.myAI.name); if (n && n.trim() !== '') { this.myAI.name = n.substring(0, 10); this.play('combo'); } }
            else if (this.labCur === 1) { this.st = 'lab_style'; this.labCur = 0; } else if (this.labCur === 2) { this.st = 'lab_skills'; this.labCur = 0; }
            else if (this.labCur === 3) { this.st = 'lab_awaken'; this.labCur = 0; } else if (this.labCur === 4) { this.st = 'lab_stats'; this.labCur = 0; }
            else if (this.labCur === 5) { this.st = 'lab_body'; this.labCur = 0; }
            else if (this.labCur === 6) { this.isSim = true; this.isInfinite = false; this.simEpoch = 0; this.simWins = 0; this.setupSimBattle(); this.st = 'training'; this.trainingMsg = '仮想敵 生成...'; BGM.play('action'); }
            else if (this.labCur === 7) { this.isSim = true; this.isInfinite = true; this.simEpoch = 0; this.simWins = 0; this.setupSimBattle(); this.st = 'training'; this.trainingMsg = 'Bボタンで中断'; BGM.play('action'); }
            else if (this.labCur === 8) { this.myAI = this.sanitizeAI({}); this.texts = []; this.addText(100, 150, "INITIALIZED!", "#f00"); }
            else { this.st = 'menu'; this.menuCur = 0; }
        }
        if (keysDown.b) { this.st = 'menu'; this.play('hit'); } return;
    }
    if (this.st === 'save_slot') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; this.play('sel'); }
        if (keysDown.b) { this.st = 'lab_main'; this.labCur = 5; this.play('hit'); return; }
        if (keysDown.a) { this.saveSlot(this.labCur); this.st = 'menu'; this.isSim = false; this.play('combo'); this.addText(100, 150, "SAVE COMPLETED!", "#0f0"); } return;
    }
    if (this.st === 'lab_style') { if (keysDown.b || keysDown.a) { this.myAI = this.sanitizeAI(this.myAI); this.st = 'lab_main'; this.labCur = 1; this.play('hit'); return; } if (keysDown.right || keysDown.left) { this.play('sel'); let dir = keysDown.right ? 1 : -1; let keys = Object.keys(Styles); let idx = Math.max(0, keys.indexOf(this.myAI.styleKey)); this.myAI.styleKey = keys[(idx + dir + keys.length) % keys.length]; } return; }
    if (this.st === 'lab_skills') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 2; this.play('hit'); return; } if (keysDown.right || keysDown.left) { this.play('sel'); let dir = keysDown.right ? 1 : -1; let idx = Math.max(0, SkillKeys.indexOf(this.myAI.skillKeys[this.labCur])); this.myAI.skillKeys[this.labCur] = SkillKeys[(idx + dir + SkillKeys.length) % SkillKeys.length]; } return; }
    if (this.st === 'lab_awaken') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 3; this.play('hit'); return; } if (keysDown.right || keysDown.left) { this.play('sel'); let dir = keysDown.right ? 1 : -1; if (this.labCur === 0) { let keys = Object.keys(Passives); let idx = Math.max(0, keys.indexOf(this.myAI.passiveKey)); this.myAI.passiveKey = keys[(idx + dir + keys.length) % keys.length]; } else if (this.labCur === 1) { let keys = Object.keys(AwakenConds); let idx = Math.max(0, keys.indexOf(this.myAI.awakenCond)); this.myAI.awakenCond = keys[(idx + dir + keys.length) % keys.length]; } else if (this.labCur === 2) { let keys = Object.keys(AwakenPassives); let idx = Math.max(0, keys.indexOf(this.myAI.awakenPassive)); this.myAI.awakenPassive = keys[(idx + dir + keys.length) % keys.length]; } else if (this.labCur === 3 && keysDown.right) { this.myAI.awakenColor = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0'); } } return; }
    if (this.st === 'lab_stats') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 4; this.play('hit'); return; } let valChange = 0; if (keysDown.left) valChange = -1; if (keysDown.right) valChange = 1; if (valChange !== 0) { let cAtk = Math.round(this.myAI.base.atk * 10); let cRes = Math.round(this.myAI.base.res * 10); let cSpd = Math.round(this.myAI.base.spd * 10); let total = cAtk + cRes + cSpd; if (this.labCur === 0) { let next = Math.max(5, Math.min(20, cAtk + valChange)); if (total - cAtk + next <= 30) { this.myAI.base.atk = next / 10; this.play('sel'); } else this.play('hit'); } else if (this.labCur === 1) { let next = Math.max(5, Math.min(20, cRes + valChange)); if (total - cRes + next <= 30) { this.myAI.base.res = next / 10; this.play('sel'); } else this.play('hit'); } else if (this.labCur === 2) { let next = Math.max(5, Math.min(20, cSpd + valChange)); if (total - cSpd + next <= 30) { this.myAI.base.spd = next / 10; this.play('sel'); } else this.play('hit'); } } return; }
    if (this.st === 'lab_body') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 5; this.play('hit'); return; } let valChange = 0; if (keys.left) valChange = -0.05; if (keys.right) valChange = 0.05; if (valChange !== 0) { if (this.labCur === 0) this.myAI.body.width = Math.max(0.1, Math.min(2.0, this.myAI.body.width + valChange)); if (this.labCur === 1) this.myAI.body.height = Math.max(0.1, Math.min(2.0, this.myAI.body.height + valChange)); if (this.labCur === 2) this.myAI.physics.weight = Math.max(10, Math.min(200, this.myAI.physics.weight + valChange * 100)); if (this.labCur === 3 && keysDown.right) this.myAI.color.body = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0'); } return; }

    if (this.st === 'battle') {
        this.updateBattleState();
        for (let i = this.texts.length - 1; i >= 0; i--) { this.texts[i].life--; this.texts[i].y -= 0.5; if (this.texts[i].life <= 0) this.texts.splice(i, 1); }
        for (let i = this.vfx.length - 1; i >= 0; i--) { let v = this.vfx[i]; v.life--; if (v.type === 'slash') { v.x += v.vx || 0; v.y += v.vy || 0; } if (v.life <= 0) this.vfx.splice(i, 1); }
        if (safeNum(this.p1.hp,0) <= 0 || safeNum(this.p2.hp,0) <= 0) { this.st = 'result'; this.play('combo'); this.shake(10); } return;
    }

    if (this.st === 'training') {
        if (keysDown.b && this.isInfinite) { this.isSim = false; BGM.play('menu'); this.play('combo'); this.st = 'save_slot'; this.labCur = 0; this.texts = []; this.addText(100, 150, `TRAINING STOPPED! WINS:${this.simWins}`, "#0f0"); return; }
        for(let loop = 0; loop < 10; loop++) {
            this.updateBattleState();
            if (safeNum(this.p1.hp,0) <= 0 || safeNum(this.p2.hp,0) <= 0 || this.timer > 1500) {
                if (safeNum(this.p1.hp,0) > safeNum(this.p2.hp,0) && safeNum(this.p1.hp,0) > 0) this.simWins++;
                let b = safeNum(this.p1.hp,0) > safeNum(this.p2.hp,0) ? 0.005 : 0.002;
                this.myAI.bonus.atk = Math.min(5.0, safeNum(this.myAI.bonus.atk, 0) + b); this.myAI.bonus.res = Math.min(5.0, safeNum(this.myAI.bonus.res, 0) + b); this.myAI.bonus.spd = Math.min(5.0, safeNum(this.myAI.bonus.spd, 0) + b);
                this.myAI.learningLevel += 1; this.simEpoch++;
                if (!this.isInfinite && this.simEpoch >= this.simMaxEpoch) { this.isSim = false; BGM.play('menu'); this.play('combo'); this.st = 'save_slot'; this.labCur = 0; this.texts = []; this.addText(100, 150, `FINISH! WINS:${this.simWins}`, "#0f0"); break; } else { this.setupSimBattle(); }
            }
        } return;
    }
    if (this.st === 'result') { if (keysDown.a) { this.st = 'menu'; this.play('sel'); } return; }
  },

  applyHit(attacker, skill, victim, hx, hy) {
       try {
           if (!skill || !victim || !attacker) return false; 
           let sName = skill.name || '不明'; let pKeyV = victim.isAwakened ? victim.awakenPassive : victim.passiveKey; let pKeyA = attacker.isAwakened ? attacker.awakenPassive : attacker.passiveKey;
           let isSansAtk = attacker.styleKey === 'SANS'; let isSansDef = pKeyV === 'SANS_DODGE';

           if (victim.hasClones) { victim.hasClones = false; this.addVFX('shockwave', victim.x, victim.y, '#fff', {size: 80}); this.addText(victim.x, victim.y - 40, "身代わり!", "#fff"); this.play('hit'); return true; }
           if (pKeyV === 'MAHORAGA' && victim.adapted && victim.adapted[sName]) { this.addVFX('impact', victim.x, victim.y-15, '#fff', {size: 30, life: 10}); this.addText(victim.x, victim.y - 40, "完全適応", "#fff"); this.play('sel'); return true; }
           if (safeNum(victim.comboDmg,0) > 100 || safeNum(attacker.combo,0) >= 8) { victim.vy = -8; victim.vx = attacker.dir * 15; victim.state = 'knockdown'; victim.stateFrame = 0; attacker.combo = 0; victim.comboDmg = 0; attacker.hitCancel = false; this.addText(victim.x, victim.y-30, "COMBO LIMIT", "#888"); return true; }
           if (victim.state === 'atk_physCounter' && skill.type !== 'shot' && skill.type !== 'range' && !isSansAtk) { this.play('combo'); this.shake(15); this.stop(15); this.addVFX('impact', victim.x, victim.y, '#f00', {size: 70}); this.addText(victim.x, victim.y-50, "COUNTER!!", "#f00"); attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 5; victim.state = 'atk_counter'; victim.stateFrame = 0; victim.vx = victim.dir * 8; return true; }
           if (victim.guarding && victim.justGuardWindow > 0 && skill.type !== 'throw') { this.play('sel'); this.shake(8); this.stop(10); this.addVFX('impact', victim.x, victim.y-20, '#0ff', {size: 50}); this.addText(victim.x, victim.y - 50, "PARRY!", "#0ff"); attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 2; attacker.vy = -3; attacker.hitCancel = false; victim.guarding = false; victim.justGuardWindow = 0; victim.state = 'idle'; victim.cd = 0; return true; }

           let safeAtk = safeNum(attacker.base && attacker.base.atk, 1.0); let damage = safeNum(skill.dmg, 10) * safeAtk; let aHp = safeNum(attacker.hp, 1000); let aMax = Math.max(1, safeNum(attacker.maxHp, 1000));
           if (pKeyA === 'DESPERATION' && (aHp / aMax) <= 0.3) damage *= 1.5; if (pKeyV === 'GIANT') damage *= 0.8;
           let safeWeight = Math.max(10, safeNum(victim.physics && victim.physics.weight, 100)); damage = Math.max(1, damage - ((safeWeight - 100) * 0.1)); 

           if (isSansDef && skill.type !== 'throw') {
               let dodgeCost = damage * 1.5;
               if (safeNum(victim.hp,0) > dodgeCost + 10) { victim.hp -= dodgeCost; this.addText(victim.x, victim.y - 40, "MISS", "#ccc"); victim.x += (Math.random() < 0.5 ? -60 : 60); victim.x = Math.max(10, Math.min(this.stageWidth - 10, victim.x)); this.play('sel'); return true; } else { damage = 9999; }
           }
           let kbForce = safeNum(skill.kb, 2) * safeAtk * (100 / safeWeight);
           if (isSansAtk) { victim.kr = safeNum(victim.kr, 0) + damage * 2; damage = 1; kbForce = 0; }
           let isBurstFinish = (sName === '爆裂拳' && attacker.stateFrame >= Math.floor(safeNum(skill.start, 5) / Math.max(0.5, safeNum(attacker.base&&attacker.base.spd, 1.0))) + Math.floor(safeNum(skill.act, 40) / Math.max(0.5, safeNum(attacker.base&&attacker.base.spd, 1.0))) - 5);
           if (isBurstFinish) { damage *= 5; kbForce = 20 * safeAtk * (100 / safeWeight); } if (skill.type === 'pull') kbForce = -15;

           if (pKeyV === 'MAHORAGA' && !isSansAtk) { if (!victim.hitHistory) victim.hitHistory = {}; if (!victim.adapting) victim.adapting = {}; victim.hitHistory[sName] = (victim.hitHistory[sName] || 0) + 1; if (victim.hitHistory[sName] === 5 && !victim.adapting[sName]) { victim.adapting[sName] = 180; this.addText(victim.x, victim.y - 50, "解析開始...", "#aaa"); } }
           let isGuarding = victim.guarding && skill.type !== 'throw'; 
           if (isGuarding && !isSansAtk) { victim.hp -= damage * 0.2; this.play('sel'); this.shake(2); victim.vx = attacker.dir * kbForce * 0.3; this.addVFX('impact', victim.x, victim.y-15, '#888', {size: 15, life: 10}); return true; }

           victim.hp -= damage; if (pKeyA === 'VAMPIRE' && !isSansAtk) attacker.hp = Math.min(aMax, aHp + damage * 0.2);
           if (!isSansAtk) { victim.state = 'hurt'; victim.stateFrame = 0; victim.comboTimer = 60; victim.comboDmg = safeNum(victim.comboDmg,0) + damage; }
           attacker.hitCancel = true; attacker.combo = safeNum(attacker.combo,0) + 1;

           if (!isSansAtk) {
               if (victim.y < this.groundY - 10) victim.vy = -4; 
               if (skill.type === 'anti_air') { victim.vy = -16 * (100 / safeWeight); victim.y -= 5; } else if (sName === 'メテオ') { victim.vy = 20; kbForce *= 0.5; } else if (skill.type === 'throw') { victim.vy = -10; kbForce *= 1.5; victim.y -= 5; } else if (sName === 'スライド' || sName === '急降下') victim.vy = -8 * (100 / safeWeight); else if (safeNum(skill.kb, 0) > 10 || isBurstFinish) victim.vy = -8 - (Math.random()*2); 
               victim.vx = attacker.dir * kbForce;
           }
           let auraCol = isSansAtk ? '#fff' : ((attacker.color && attacker.color.aura) ? attacker.color.aura : '#ff0');
           if (sName === 'ジャブ' || isSansAtk) { this.play('hit'); this.shake(2); this.addVFX('impact', hx, hy, '#fff', {size: 20}); } else { this.play('combo'); this.shake(10); this.stop(5); this.addVFX('impact', hx, hy, auraCol, {size: 50}); this.addVFX('slash', hx, hy, '#fff', {size: 40, angle: Math.random()*Math.PI*2, width: 4}); } return true;
       } catch(e) { console.error("Hit Error:", e); return false; }
  },

  createHitbox(attacker, skill, victim, offsetX = 0) {
    try {
        let ax = safeNum(attacker.x, 0) + offsetX; let ay = safeNum(attacker.y, 0); let vx = safeNum(victim.x, 0); let vy = safeNum(victim.y, 0); let aDir = safeNum(attacker.dir, 1); let aWidth = Math.max(0.1, safeNum(attacker.body && attacker.body.width, 1.0));
        let vDist = Math.hypot(vx - ax, vy - ay); let inFront = (vx - ax) * aDir >= -15; let actualRange = safeNum(skill.range, 30) * aWidth;
        if (skill.type === 'multi' || skill.type === 'pull' || (skill.type||'').startsWith('sans_')) inFront = true;
        if (inFront && vDist <= actualRange + 15) { return this.applyHit(attacker, skill, victim, ax + ((vx-ax)/2), vy - 15); } return false;
    } catch(e) { return false; }
  },

  processFighter(f, opp) {
    try {
        if (!f || !opp) return;
        if (safeNum(f.kr, 0) > 0 && f.stateFrame % 3 === 0) { f.hp -= 1; f.kr -= 1; this.addVFX('impact', safeNum(f.x,0) + (Math.random()-0.5)*30, safeNum(f.y,this.groundY) - Math.random()*50, '#c0c', {size: 4, life: 5}); }
        if (f.funnelTimer > 0) { f.funnelTimer--; if (f.funnelTimer % 30 === 0) { let by = safeNum(f.y, this.groundY) - 60; let oy = safeNum(opp.y, this.groundY); let dx = safeNum(opp.x, 0) - safeNum(f.x, 0); let dy = oy - by; let dist = Math.hypot(dx, dy) || 1; this.bullets.push({x: safeNum(f.x, 0), y: by, vx: (dx/dist)*10, vy: (dy/dist)*10, owner: f, skill: {name:'パラ弾', dmg: 5, kb: 1, type: 'shot'}, life: 60}); this.addVFX('impact', safeNum(f.x, 0), by, '#0ff', {size: 15, life: 5}); } }
        if (f.state !== f.prevState) { f.hasHit = false; f.prevState = f.state; }
        f.stateFrame++; let safeSpd = Math.max(0.5, safeNum(f.base && f.base.spd, 1.0)); if (f.cd > 0) f.cd -= safeSpd;
        if (!f.isAwakened) {
            let awaken = false; if (f.awakenCond === 'HP20' && f.hp <= f.maxHp * 0.2) awaken = true; if (f.awakenCond === 'TIME' && this.timer > 1800) awaken = true; 
            if (awaken) { f.isAwakened = true; f.color = { body: (f.color?f.color.body:'#fff'), aura: f.awakenColor || '#f00' }; f.hp = Math.min(f.maxHp, f.hp + 300); this.play('combo'); this.shake(20); this.stop(30); this.addVFX('shockwave', f.x, f.y, f.color.aura, {size: 150, life: 40}); this.addText(f.x, f.y - 60, "AWAKENING!!", f.color.aura); if (f.awakenPassive === 'CLONE') f.hasClones = true; f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; return; }
        }
        let pKey = f.isAwakened ? f.awakenPassive : f.passiveKey; let fstStr = f.state || 'idle';
        if (pKey === 'LEARNING' && f.stateFrame % 60 === 0) { let oppStateStr = opp.state || ''; if (oppStateStr.startsWith('atk_')) { let sObj = getSkill(oppStateStr.substring(4)); if (sObj) { if (sObj.type === 'shot' || sObj.type === 'range') f.dynDodge = Math.min(1.0, safeNum(f.dynDodge,0) + 0.05); else f.dynGuard = Math.min(1.0, safeNum(f.dynGuard,0) + 0.05); this.addVFX('impact', f.x, f.y-30, '#0f0', {size: 15, life: 5}); } } }
        if (pKey === 'MAHORAGA' && f.adapting) { for (let sk in f.adapting) { if (f.adapting[sk] > 0) { f.adapting[sk]--; if (f.adapting[sk] === 0) { if (!f.adapted) f.adapted = {}; f.adapted[sk] = true; this.addText(f.x, f.y - 70, "適応完了!!", "#fff"); this.play('combo'); this.shake(5); this.addVFX('shockwave', f.x, f.y, '#fff', {size: 80, life: 20}); delete f.adapting[sk]; } } } }
        
        f.x = safeNum(f.x, 250); f.y = safeNum(f.y, this.groundY); f.vx = safeNum(f.vx, 0); f.vy = safeNum(f.vy, 0); f.x += f.vx; f.y += f.vy; let safeWeight = Math.max(10, safeNum(f.physics && f.physics.weight, 100));
        let isFloating = (pKey === 'HOVER' || f.styleKey === 'SANS'); 
        if (isFloating && !['hurt', 'knockdown', 'stunned'].includes(fstStr)) { f.vx *= 0.85; f.vy *= 0.85; } else { f.vx *= 0.85; if (f.y < this.groundY) { f.vy += 0.6 + (safeWeight - 100)*0.005; } else { f.y = this.groundY; f.vy = 0; } }
        f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x)); f.y = Math.max(30, Math.min(this.groundY, f.y)); 
        if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4 || fstStr.startsWith('atk_')) { if(!f.trail) f.trail = []; f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state, frame: f.stateFrame}); if(f.trail.length > 5) f.trail.pop(); } else if (f.trail && f.trail.length > 0) { f.trail.pop(); }
        if (f.state === 'idle' || f.state === 'move') { f.dir = (safeNum(opp.x,0) > f.x) ? 1 : -1; }
        if (f.state === 'hurt') { if (f.stateFrame > 25) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; } if (f.state === 'knockdown') { if (f.stateFrame > 40) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; } if (f.state === 'guard') { if (f.justGuardWindow > 0) f.justGuardWindow--; if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } return; } if (f.state === 'stunned') { if (f.stateFrame > 60) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }
        
        let isAtk = fstStr.startsWith('atk_'); let sKey = isAtk ? fstStr.substring(4) : ''; let skill = isAtk ? (sKey === 'counter' ? CounterData : getSkill(sKey)) : null;
        
        if (isAtk && skill) {
             let sFrame = Math.max(1, Math.floor(safeNum(skill.start, 5) / safeSpd)); let actFrame = Math.max(1, Math.floor(safeNum(skill.act, 10) / safeSpd)); let recFrame = Math.max(1, Math.floor(safeNum(skill.rec, 15) / safeSpd)); let sName = skill.name || ''; let sType = skill.type || '';
             if (f.stateFrame === sFrame && sType === 'random') {
                 let r = Math.random();
                 if (r < 0.15) { f.hp = Math.max(1, f.hp - 200); this.addText(f.x, f.y-40, "自爆!", "#f00"); this.addVFX('shockwave', f.x, f.y, '#f00', {size: 100}); f.state = 'idle'; return; }
                 else if (r < 0.30) { f.hp = Math.min(f.maxHp, f.hp + 300); this.addText(f.x, f.y-40, "大回復!", "#0f0"); this.addVFX('shockwave', f.x, f.y, '#0f0', {size: 100}); f.state = 'idle'; return; }
                 else if (r < 0.45) { opp.hp = Math.max(1, opp.hp - 300); this.addText(opp.x, opp.y-40, "謎の落雷!", "#ff0"); this.addVFX('beam', opp.x, 0, '#ff0', {size: 50, angle: Math.PI/2, life: 15}); opp.state='hurt'; opp.stateFrame=0; f.state = 'idle'; return; }
                 else { let rndKey = SkillKeys[Math.floor(Math.random() * SkillKeys.length)]; f.state = 'atk_' + rndKey; f.stateFrame = 0; return; }
             }
             if (f.stateFrame === sFrame - 2 && (sType === 'warp' || sType === 'sans_warp')) { f.x = safeNum(opp.x,0) - safeNum(opp.dir,1) * (Math.random()*100 + 40); f.dir = safeNum(opp.dir,1); this.addVFX('shockwave', f.x, f.y, '#ccc', {size: 30, life: 10}); }
             if (sType === 'multi' && f.stateFrame % 6 === 0) f.hasHit = false; if (sType === 'sans_bone' && f.stateFrame % 8 === 0 && f.stateFrame <= sFrame + actFrame) { f.hasHit = false; }
             if (f.stateFrame >= sFrame && f.stateFrame <= sFrame + actFrame) { 
                 let originX = f.x + 20*f.dir; let originY = f.y - 20 * Math.max(0.1, safeNum(f.body&&f.body.height, 1)); let targetX = safeNum(opp.x, 250); let targetY = safeNum(opp.y, this.groundY) - 20 * Math.max(0.1, safeNum(opp.body&&opp.body.height, 1)); let angleToOpp = Math.atan2(targetY - originY, targetX - originX);
                 if (f.stateFrame === sFrame) {
                     if (sType === 'anti_air') { f.vy = -12; f.vx = f.dir * 4; } if (sName === '急降下') { f.vy = 10; f.vx = f.dir * 12; } if (sType === 'buff') { f.hp = Math.min(f.maxHp, f.hp + 200); this.addVFX('shockwave', f.x, f.y, '#0f0', {size: 50}); this.play('combo'); } if (sType === 'summon') { f.funnelTimer = 180; this.play('jmp'); } 
                     if (sType === 'shot') { this.play('jmp'); this.bullets.push({x: originX, y: originY, vx: Math.cos(angleToOpp)*12, vy: Math.sin(angleToOpp)*12, owner: f, skill: skill, life: 60}); } else if (sType === 'range') { this.addVFX('beam', originX, originY, (f.color?f.color.body:'#fff'), {size: safeNum(skill.range, 350), angle: angleToOpp, life: 15}); this.shake(6); }
                     if (sType === 'sans_blaster') { this.addVFX('shockwave', originX, originY, '#fff', {size: 40}); this.bullets.push({x: originX, y: originY, vx: Math.cos(angleToOpp)*25, vy: Math.sin(angleToOpp)*25, owner: f, skill: skill, life: 30}); this.play('combo'); this.shake(15); }
                     if (sType === 'sans_throw') { for(let i=0; i<5; i++) { this.bullets.push({x: originX, y: originY - i*15, vx: f.dir*(10+Math.random()*5), vy: (Math.random()-0.5)*5, owner: f, skill: skill, life: 60}); } this.play('jmp'); }
                     if (sType === 'pull') { this.addVFX('hook', originX, originY, (f.color?f.color.body:'#fff'), {targetX: targetX, targetY: targetY, life: 10}); }
                 }
                 if (!f.hasHit && sType !== 'buff' && sType !== 'shot' && sType !== 'range' && sType !== 'summon' && sType !== 'sans_blaster' && sType !== 'sans_throw' && !sType.startsWith('stance')) {
                     let mainHit = false; if (sType === 'sans_bone') { mainHit = this.createHitbox({...f, x: f.x + f.dir*100}, {...skill, range: 200}, opp, 0); if(f.stateFrame % 8 === 0) this.addVFX('slash', f.x + f.dir*100, this.groundY, '#fff', {size: 80, angle: -Math.PI/2, width: 20}); } else { mainHit = this.createHitbox(f, skill, opp, 0); }
                     let cloneHit = false; if (!mainHit && f.hasClones) { cloneHit = this.createHitbox(f, skill, opp, -40) || this.createHitbox(f, skill, opp, 40); }
                     if (mainHit || cloneHit) { f.hasHit = true; let angle = f.dir === 1 ? 0 : Math.PI; if (sType === 'anti_air') angle -= (Math.PI/4) * f.dir; if (sType === 'air') angle += (Math.PI/4) * f.dir; if (sName !== 'ジャブ' && sType !== 'sans_bone') this.addVFX('slash', originX, originY, (f.color?f.color.body:'#fff'), {size: safeNum(skill.range, 30) * Math.max(0.1, safeNum(f.body&&f.body.width, 1)), angle: angle, width: 10}); }
                 }
             }
             if (f.stateFrame > (sFrame + actFrame + recFrame)) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; f.hasHit = false; }
        }
        
        let canCancel = isAtk && f.hitCancel && skill && f.stateFrame > (safeNum(skill.start, 5) + 5) / safeSpd;
        if ((f.state === 'idle' && f.cd <= 0) || canCancel) {
            let d = Math.abs(f.x - safeNum(opp.x,0)); let isAir = f.y < this.groundY - 10; let oppIsAir = safeNum(opp.y,this.groundY) < this.groundY - 10; let st = getStyle(f.styleKey); let ninjaSpd = pKey === 'NINJA' ? 1.5 : 1.0; let oppStateStr = opp.state || '';
            let dynG = st.name === 'デビル' ? 0 : safeNum(f.dynGuard, 0.2); let dynD = st.name === 'デビル' ? 0 : safeNum(f.dynDodge, 0.2);
            if (oppStateStr.startsWith('atk_') && d < 80 && !isAir && !canCancel && st.name !== 'デビル') { if (Math.random() < dynG + dynD) { if (Math.random() < (dynD / Math.max(0.01, dynG + dynD)) && d > 30) { f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 12 * ninjaSpd; f.cd = 10; this.addVFX('shockwave', f.x, f.y, '#fff', {size: 20, life: 10}); this.play('sel'); this.addText(f.x, f.y - 40, "DODGE", "#ccc"); return; } else { f.state = 'guard'; f.stateFrame = 0; f.guarding = true; f.justGuardWindow = 10; return; } } }
            let shouldAttack = false; let moveDir = 0;
            if (opp.state === 'hurt' || opp.state === 'stunned' || opp.state === 'knockdown') { shouldAttack = true; if (oppIsAir && !isAir && d < 60 && f.state !== 'move' && !isFloating) { f.state = 'move'; f.stateFrame = 0; f.vy = -16; f.vx = f.dir * 5; f.cd = 0; f.hitCancel = false; return; } } else { if ((st.name === '空の支配者' || f.styleKey === 'SANS') && !isAir && Math.random() < 0.2 && !canCancel && !isFloating) { f.state = 'move'; f.stateFrame = 0; f.vy = -18; f.vx = f.dir * 6; return; } if (d < safeNum(st.range, 50)) { if (Math.random() < safeNum(st.aggro, 0.5)) shouldAttack = true; else moveDir = -f.dir; } else { moveDir = f.dir; } }
            if (shouldAttack) {
                let bestSkillKey = null; let bestScore = -100; let sKeys = Array.isArray(f.skillKeys) ? f.skillKeys : ['jab','upper','smash','sonic']; let safeWidth = Math.max(0.1, safeNum(f.body&&f.body.width, 1.0));
                for (let skey of sKeys) {
                    let s = getSkill(skey); let score = 0; let sRange = safeNum(s.range, 30); let sType = s.type || 'melee';
                    if (d <= sRange * safeWidth) score += 10; else score -= (d - sRange) * 0.2;
                    if (isAir) { if (sType === 'air') score += 30; else score -= 20; } else { if (sType === 'air') score -= 20; }
                    if (oppIsAir && !isAir) { if (sType === 'anti_air') score += 20; }
                    if (sType === 'buff' && f.hp < f.maxHp * 0.5 && d > 150) score += 40; if (sType === 'summon' && f.funnelTimer <= 0) score += 30; 
                    if (sType.startsWith('stance')) { if (oppStateStr.startsWith('atk_')) score += 30; else score -= 50; }
                    if (sType === 'throw') { if (opp.guarding && d < 40) score += 40; else score -= 10; }
                    if (canCancel) { if (safeNum(s.start, 5) < 10) score += 15; if (sType === 'shot' || sType === 'buff' || sType === 'summon' || sType.startsWith('stance')) score -= 20; }
                    if (st.name === 'デビル') { if (sType === 'multi' || sType === 'pull') score += 20; }
                    score += Math.random() * 10; if (score > bestScore) { bestScore = score; bestSkillKey = skey; }
                }
                if (bestSkillKey) { let sData = getSkill(bestSkillKey); f.state = 'atk_' + bestSkillKey; f.stateFrame = 0; f.vx = f.dir * safeNum(sData.vx, 0); f.cd = safeNum(sData.cd, 20); f.hitCancel = false; }
            } else if (!canCancel) {
                if (isFloating) { let targetY = safeNum(opp.y, this.groundY) - 120; targetY = Math.max(50, Math.min(this.groundY - 50, targetY)); let dy = targetY - f.y; let isMoving = false; if (Math.abs(dy) > 20) { f.vy += (dy > 0 ? 1 : -1) * ninjaSpd; isMoving = true; } if (moveDir !== 0) { f.vx += moveDir * 1.5 * ninjaSpd; isMoving = true; } if (isMoving && f.state === 'idle') { f.state = 'move'; f.stateFrame = 0; } } else if (moveDir !== 0 && Math.random() < (safeSpd * 0.3)) { f.state = 'move'; f.stateFrame = 0; f.vx = moveDir * 6 * ninjaSpd; }
            }
        }
        if (f.state === 'move' && Math.abs(f.vx) < 0.5 && (f.y >= this.groundY || isFloating)) { f.state = 'idle'; f.stateFrame = 0; }
    } catch(e) { console.error("Fighter logic error:", e); }
  },

  draw() { try { this._draw(); } catch(e) { console.error("SafeDraw:", e); if(typeof ctx !== 'undefined') { ctx.restore(); ctx.globalAlpha = 1; } } },
  _draw() {
    if (this.st === 'menu' || this.st.startsWith('lab_') || this.st === 'save_slot' || this.st === 'load_slot') {
        const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#001'); grad.addColorStop(1, '#003'); ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
        if (this.st === 'menu') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('ULTIMATE AI LAB', 25, 50); ctx.fillStyle = this.menuCur === 0 ? '#ff0' : '#fff'; ctx.font = '12px monospace'; ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'BATTLE START', 40, 150); ctx.fillStyle = this.menuCur === 1 ? '#ff0' : '#fff'; ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'AI FACTORY', 45, 180); ctx.fillStyle = this.menuCur === 2 ? '#ff0' : '#fff'; ctx.fillText((this.menuCur === 2 ? '> ' : '  ') + 'LOAD AI DATA', 35, 210); ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('最高に自由なAI育成', 45, 280);
        } else if (this.st === 'save_slot' || this.st === 'load_slot') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText(this.st === 'save_slot' ? 'SAVE SLOT' : 'LOAD SLOT', 50, 50); ctx.font = '12px monospace';
            for(let i=0; i<3; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; let txt = (this.savedSlots && this.savedSlots[i]) ? `SLOT ${i+1}: ${this.savedSlots[i].name}` : `SLOT ${i+1}: NO DATA`; ctx.fillText((this.labCur === i ? '> ' : '  ') + txt, 20, 120 + i * 40); } ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText(this.st === 'save_slot' ? 'どこに保存しますか？' : 'どのAIを呼び出しますか？', 30, 270);
        } else {
            ctx.fillStyle = '#112'; ctx.fillRect(10, 10, 180, 90); ctx.strokeStyle = '#335'; ctx.strokeRect(10, 10, 180, 90); ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText(`[ ${this.myAI.name} ] Lv.${Math.floor(safeNum(this.myAI.learningLevel,0)/10)}`, 15, 25); ctx.fillText('NORMAL', 55, 35); ctx.fillText('AWAKENED', 130, 35); let safeC = this.myAI.color || {}; let safeAwkC = this.myAI.awakenColor || '#f00'; let prevF = { x: 0, y: 0, dir: 1, state: 'idle', stateFrame: 0, body: this.myAI.body, color: safeC, isAwakened: false }; ctx.save(); ctx.translate(50, 80); this.drawStickman(prevF); ctx.restore(); prevF.isAwakened = true; prevF.color = {body: safeC.body||'#fff', aura: safeAwkC}; ctx.save(); ctx.translate(145, 80); this.drawStickman(prevF); ctx.restore();
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace';
            if (this.st === 'lab_main') { ctx.fillText('【CUSTOMIZE MENU】', 30, 110); ctx.font = '10px monospace'; const items = ['AI名前変更', '戦闘スタイル', 'スキルセット', 'パッシブ＆覚醒', 'ステータス', '体型＆カラー', '通常学習(20回)', '無限強化学習', 'AI初期化', '戻る']; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 125 + i * 15); } }
            else if (this.st === 'lab_style') { ctx.fillText('【BATTLE STYLE】', 40, 120); ctx.font = '11px monospace'; let sName = getStyle(this.myAI.styleKey).name; ctx.fillStyle = '#ff0'; ctx.fillText(`◀ ${sName.padEnd(8,' ')} ▶`, 35, 160); this.drawDescBox(`[ ${sName} ]`, getStyle(this.myAI.styleKey).desc); }
            else if (this.st === 'lab_skills') { ctx.fillText('【SKILL SETTING】', 40, 115); ctx.font = '10px monospace'; let sKeys = this.myAI.skillKeys || []; if(this.myAI.styleKey === 'SANS') { ctx.fillStyle = '#888'; ctx.fillText("※Sans専用スキルで固定", 10, 135); } for(let i=0; i<4; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; let skName = getSkill(sKeys[i]).name; ctx.fillText(`SLOT ${i+1}: ◀ ${skName.padEnd(5,' ')} ▶`, 20, 150 + i * 15); } let curSkill = getSkill(sKeys[this.labCur]); this.drawDescBox(`[ ${curSkill.name} ] 威力:${curSkill.dmg} CD:${curSkill.cd}`, curSkill.desc); }
            else if (this.st === 'lab_awaken') { ctx.fillText('【PASSIVE & AWAKEN】', 25, 120); ctx.font = '10px monospace'; const items = [ `常時パッシブ : ${getPassive(this.myAI.passiveKey).name}`, `覚醒の条件　 : ${getAwaken(this.myAI.awakenCond).name}`, `覚醒パッシブ : ${getAwakenPassive(this.myAI.awakenPassive).name}`, `覚醒オーラ色 : [CHANGE]` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 5, 140 + i * 18); } let desc = ''; let title = ''; if(this.labCur===0){ title=`[ ${getPassive(this.myAI.passiveKey).name} ]`; desc=getPassive(this.myAI.passiveKey).desc; } else if(this.labCur===1){ title=`[ ${getAwaken(this.myAI.awakenCond).name} ]`; desc=getAwaken(this.myAI.awakenCond).desc; } else if(this.labCur===2){ title=`[ ${getAwakenPassive(this.myAI.awakenPassive).name} ]`; desc=getAwakenPassive(this.myAI.awakenPassive).desc; } else { title=`[ オーラ色変更 ]`; desc='覚醒（変身）した時に纏う激しいオーラの色を変更します。'; } this.drawDescBox(title, desc); }
            else if (this.st === 'lab_stats') { ctx.fillText('【STATUS POINT】', 40, 120); ctx.font = '10px monospace'; let safeBase = this.myAI.base || {atk:1,res:1,spd:1}; let pts = (3.0 - (safeBase.atk + safeBase.res + safeBase.spd)).toFixed(1); ctx.fillStyle = '#88f'; ctx.fillText(`残りポイント: ${pts}`, 40, 140); const items = [ `攻撃力(ATK) : ${safeBase.atk.toFixed(1)}`, `耐久力(RES) : ${safeBase.res.toFixed(1)}`, `素早さ(SPD) : ${safeBase.spd.toFixed(1)}` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 160 + i * 20); } let desc = this.labCur===0?'与えるダメージとノックバック力が上昇。':this.labCur===1?'受けるノックバックが減り、重い一撃にも耐える。':'技の発生、硬直、移動速度など全ての行動が速くなる。'; this.drawDescBox(`[ ステータス配分 ]`, desc); }
            else if (this.st === 'lab_body') { ctx.fillText('【BODY & PHYSICS】', 30, 120); ctx.font = '10px monospace'; let safeB = this.myAI.body || {width:1,height:1}; let safeP = this.myAI.physics || {weight:100}; const items = [ `横幅(W) : ${safeB.width.toFixed(2)}`, `縦幅(H) : ${safeB.height.toFixed(2)}`, `重量(WT): ${Math.floor(safeP.weight)}kg`, `ボディ色: [CHANGE]` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 140 + i * 18); } let desc = this.labCur===0?'当たり判定が横に広がるが、攻撃のリーチも伸びる。':this.labCur===1?'縦に大きくなる。ジャンプ力にも影響？':this.labCur===2?'重いほどダメージとノックバックを少し軽減する。':'ボディカラーをランダムに変更します。'; this.drawDescBox(`[ 体型＆物理設定 ]`, desc); }
        }
        for (let t of this.texts) { ctx.fillStyle = t.color; ctx.font = 'bold 16px monospace'; ctx.globalAlpha = Math.max(0, t.life / 40); ctx.fillText(t.text, t.x - 20, t.y); ctx.globalAlpha = 1; } return;
    }

    let isHitStop = typeof hitStopTimer !== 'undefined' && hitStopTimer > 3; const grad = ctx.createLinearGradient(0, 0, 0, 300); if (isHitStop) { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); } else { grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030'); } ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    applyShake(); ctx.save(); ctx.scale(this.scale, this.scale); ctx.translate(-this.camX, -this.camY);
    ctx.strokeStyle = '#445'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(this.stageWidth, this.groundY); ctx.stroke();
    for(let i=0; i<this.stageWidth; i+=40) { ctx.beginPath(); ctx.moveTo(i, this.groundY); ctx.lineTo(i - 30, this.stageHeight); ctx.stroke(); }
    for(let i=0; i<=this.stageHeight; i+=60) { ctx.strokeStyle = 'rgba(100,255,100,0.05)'; ctx.strokeRect(0, i, this.stageWidth, 1); }
    for(let i=0; i<=this.stageWidth; i+=60) { ctx.strokeRect(i, 0, 1, this.stageHeight); }
    [this.p1, this.p2].forEach(f => { if(!f)return; let tList = f.trail||[]; for(let i=0; i<tList.length; i++) { let tr = tList[i]; if(!tr)continue; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state, frame: tr.frame}; this.drawStickman(tempF, 0.4 - (i*0.08), true); } });
    if(this.p1 && (!isHitStop || this.p1.state === 'hurt' || this.p1.state === 'stunned')) this.drawStickman(this.p1);
    if(this.p2 && (!isHitStop || this.p2.state === 'hurt' || this.p2.state === 'stunned')) this.drawStickman(this.p2);
    
    this.vfx.forEach(v => {
        let ratio = Math.max(0, safeNum(v.life,1)) / Math.max(1, safeNum(v.maxLife,1)); ctx.globalAlpha = ratio; let vSize = Math.max(0.1, safeNum(v.size, 10));
        if (v.type === 'slash') { ctx.strokeStyle = v.color; ctx.lineWidth = Math.max(0.1, safeNum(v.width,2) * ratio); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(safeNum(v.x,0), safeNum(v.y,0), vSize, safeNum(v.angle,0) - 1.0*ratio, safeNum(v.angle,0) + 1.0*ratio); ctx.stroke(); } 
        else if (v.type === 'impact') { ctx.fillStyle = v.color; ctx.beginPath(); let s = Math.max(0.1, vSize * Math.pow(Math.max(0, 1 - ratio), 0.5) + 5); ctx.moveTo(v.x, v.y - s); ctx.lineTo(v.x + s/4, v.y - s/4); ctx.lineTo(v.x + s, v.y); ctx.lineTo(v.x + s/4, v.y + s/4); ctx.lineTo(v.x, v.y + s); ctx.lineTo(v.x - s/4, v.y + s/4); ctx.lineTo(v.x - s, v.y); ctx.lineTo(v.x - s/4, v.y - s/4); ctx.fill(); } 
        else if (v.type === 'shockwave') { ctx.strokeStyle = v.color; ctx.lineWidth = Math.max(0.1, 4 * ratio); ctx.beginPath(); ctx.arc(safeNum(v.x,0), safeNum(v.y,0), Math.max(0.1, vSize * Math.max(0, 1-ratio)*2 + 10), 0, Math.PI*2); ctx.stroke(); } 
        else if (v.type === 'beam') { ctx.save(); ctx.translate(safeNum(v.x,0), safeNum(v.y,0)); ctx.rotate(safeNum(v.angle,0)); let h = Math.max(0.1, 20 * ratio); ctx.fillStyle = v.color; ctx.fillRect(0, -h/2, vSize, h); ctx.fillStyle = '#fff'; ctx.fillRect(0, -h/6, vSize, h/3); ctx.restore(); }
        else if (v.type === 'hook') { ctx.strokeStyle = v.color; ctx.lineWidth = Math.max(0.1, 6 * ratio); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(safeNum(v.x,0), safeNum(v.y,0)); ctx.lineTo(safeNum(v.x,0) + (safeNum(v.targetX,0) - safeNum(v.x,0))*(1-ratio), safeNum(v.y,0) + (safeNum(v.targetY,0) - safeNum(v.y,0))*(1-ratio)); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
    for (let t of this.texts) { ctx.fillStyle = t.color; ctx.font = 'bold 24px monospace'; ctx.globalAlpha = Math.max(0, t.life / 40); ctx.fillText(t.text, t.x - 30, t.y); ctx.globalAlpha = 1; }
    ctx.restore(); resetShake();

    if (this.st === 'training') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 200, 75); ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.isInfinite ? '◆ 無限強化学習中 ◆' : '◆ AI TRAINING ◆', 25, 15); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`世代(EPOCH): ${this.simEpoch}`, 10, 35); ctx.fillStyle = '#ff0'; ctx.fillText(`WINS: ${this.simWins}`, 120, 35);
        let safeBonus = this.myAI.bonus || {atk:0,res:0,spd:0}; ctx.fillStyle = '#aaf'; ctx.font = '9px monospace'; ctx.fillText(`ATK+${safeNum(safeBonus.atk,0).toFixed(3)} RES+${safeNum(safeBonus.res,0).toFixed(3)} SPD+${safeNum(safeBonus.spd,0).toFixed(3)}`, 5, 50);
        if (!this.isInfinite) { ctx.fillStyle = '#444'; ctx.fillRect(10, 60, 180, 6); ctx.fillStyle = '#0f0'; ctx.fillRect(10, 60, (this.simEpoch / Math.max(1,this.simMaxEpoch)) * 180, 6); } else { ctx.fillStyle = '#ccc'; ctx.fillText(this.trainingMsg, 10, 65); }
    } else if (this.p1 && this.p2) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 32); ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 80, 8); ctx.fillRect(110, 5, 80, 8);
        let drawHpBar = (f, xBase, isP2) => {
            let maxHp = Math.max(1, safeNum(f.maxHp, 1000)); let hpRatio = Math.max(0, safeNum(f.hp, 0)) / maxHp; let krRatio = Math.max(0, safeNum(f.kr, 0)) / maxHp;
            let barW = hpRatio * 80; let krW = Math.min(80 - barW, krRatio * 80); let pCol = f.isAwakened ? (f.awakenColor||'#f00') : (f.color?.body||'#fff');
            if (isP2) { ctx.fillStyle = '#c0c'; ctx.fillRect(190 - barW - krW, 5, krW, 8); ctx.fillStyle = pCol; ctx.fillRect(190 - barW, 5, barW, 8); } else { ctx.fillStyle = pCol; ctx.fillRect(xBase, 5, barW, 8); ctx.fillStyle = '#c0c'; ctx.fillRect(xBase + barW, 5, krW, 8); }
        };
        drawHpBar(this.p1, 10, false); drawHpBar(this.p2, 110, true);
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText(this.p1.name, 10, 25); ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5.5), 25); ctx.fillStyle = '#888'; ctx.font = '10px monospace'; let min = Math.floor(this.timer / 60); let sec = Math.floor((this.timer % 60) * 1.66); ctx.fillText(`${min}:${sec.toString().padStart(2,'0')}`, 85, 12);
        if (this.p1.combo > 1) { ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p1.combo + ' HITS!', 10, 45); }
        if (this.p2.combo > 1) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p2.combo + ' HITS!', 140, 45); }
        if (this.st === 'intro') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 130, 200, 40); ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('GET READY...', 50, 155); } 
        else if (this.st === 'result') { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 120, 200, 60); ctx.fillStyle = '#f0f'; ctx.font = 'bold 18px monospace'; let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name; ctx.fillText(winner + ' WIN!', 100 - (winner.length*6), 145); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('Press (A) to Menu', 45, 165); }
    }
  },

  drawStickman(f, alpha = 1, isTrail = false) {
    if (!f) return; 
    let bW = Math.max(0.1, safeNum(f.body&&f.body.width, 1.0)); let bH = Math.max(0.1, safeNum(f.body&&f.body.height, 1.0)); let bHead = Math.max(0.1, safeNum(f.body&&f.body.head, 1.0));
    let cBody = typeof f.color === 'string' ? f.color : (f.color ? f.color.body : '#fff'); let cAura = typeof f.color === 'string' ? '#ff0' : (f.color ? f.color.aura : '#ff0');
    let useColor = f.isAwakened ? (f.awakenColor || '#f00') : (isTrail ? cAura : cBody); let shadowCol = f.isAwakened ? (f.awakenColor || '#f00') : cAura;
    let sf = isTrail ? safeNum(f.frame,0) : safeNum(f.stateFrame,0); let fst = f.state || 'idle'; let passKey = f.isAwakened ? f.awakenPassive : f.passiveKey;
    let isFloating = (passKey === 'HOVER' || f.styleKey === 'SANS') && !['hurt', 'knockdown', 'stunned'].includes(fst);

    let drawCore = (dx, dy, myAlpha) => {
        ctx.strokeStyle = useColor; ctx.lineWidth = Math.max(0.1, (isTrail ? 2 : 2.5) / Math.max(bW, bH)); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = myAlpha;
        let p = { h:{x:0,y:-12}, n:{x:0,y:0}, hip:{x:0,y:15}, sL:{x:-4,y:2}, sR:{x:4,y:2}, eL:{x:-8,y:10}, eR:{x:8,y:10}, hL:{x:-12,y:20}, hR:{x:12,y:20}, kL:{x:-4,y:25}, kR:{x:4,y:25}, fL:{x:-6,y:40}, fR:{x:6,y:40} };
        
        if (fst === 'idle' || fst === 'move') { 
            let t = Date.now()/200; p.h.y+=Math.sin(t); p.n.y+=Math.sin(t); p.hip.y+=2;
            if (isFloating) { p.hL={x:-15, y:5}; p.hR={x:15, y:5}; p.kL={x:-2, y:20}; p.kR={x:2, y:25}; p.fL={x:-2, y:35}; p.fR={x:2, y:40}; if (fst === 'move') { p.h.x+=5; p.n.x+=2; p.hip.x-=2; p.hL={x:-15, y:0}; p.hR={x:15, y:0}; } } 
            else { if (fst === 'idle') { p.hL.y+=Math.sin(t+1)*2; p.hR.y+=Math.sin(t+1)*2; p.kL.x-=2; p.kR.x+=2; p.kL.y-=2; p.kR.y-=2; } else if (safeNum(f.y, this.groundY) < this.groundY - 5) { p.hL.y-=20; p.hR.y-=20; p.eL.y-=10; p.eR.y-=10; p.kL.y-=15; p.kR.y-=5; p.fL.y-=15; p.h.x+=5; } else { let run = Math.sin(sf * 0.6) * 15; p.hL.x=-run; p.hR.x=run; p.eL.x=-run/2; p.eR.x=run/2; p.fL.x=run; p.fR.x=-run; p.kL.x=run/2; p.kR.x=-run/2; p.h.x+=5; p.n.x+=5; p.hip.x+=3; } }
        } 
        else if (fst === 'atk_jab') { if (sf < 4) { p.hR={x:-5,y:10}; p.eR={x:0,y:15}; p.h.x-=2; } else if (sf < 12) { p.hR={x:35,y:0}; p.eR={x:15,y:5}; p.sR.x+=5; p.h.x+=5; p.fR.x+=10; } }
        else if (fst === 'atk_upper' || fst === 'atk_shoryu') { if (sf < 7) { p.hR={x:-5,y:25}; p.eR={x:5,y:20}; p.hip.y+=5; p.h.y+=5; p.kL.x-=5; p.kR.x+=5; } else { p.hR={x:20,y:-35}; p.eR={x:10,y:-15}; p.h.y-=8; p.h.x+=5; p.fL.y-=5; p.fR.y-=5; } }
        else if (fst === 'atk_smash' || fst === 'atk_tackle') { if (sf < 14) { p.hR={x:-15,y:-20}; p.eR={x:-5,y:-10}; p.h.x-=5; p.hip.x-=5; p.kL.x-=5; } else { p.hR={x:40,y:15}; p.eR={x:20,y:10}; p.h.x+=12; p.hip.x+=8; p.fL.x-=15; p.fR.x+=15; p.kR.x+=10; p.kR.y+=5; } }
        else if (fst === 'atk_meteor' || fst === 'atk_dive') { if (sf < 10) { p.hL={x:0,y:-25}; p.hR={x:0,y:-25}; p.eL={x:-10,y:-15}; p.eR={x:10,y:-15}; p.fL.y-=10; p.fR.y-=10; p.kL.y-=10; p.kR.y-=10; } else { p.hL={x:30,y:30}; p.hR={x:30,y:30}; p.eL={x:15,y:15}; p.eR={x:15,y:15}; p.h.x+=10; p.h.y+=5; p.hip.y+=5; p.kL.x-=5; } }
        else if (fst === 'atk_slide') { if (sf < 6) { p.h={x:-5,y:5}; p.hip={x:0,y:15}; p.kL.x-=10; p.kL.y+=5; p.kR.x+=10; p.kR.y+=5; } else { p.h={x:15,y:10}; p.n={x:10,y:15}; p.hip={x:-5,y:25}; p.hR={x:20,y:25}; p.hL={x:5,y:25}; p.eR={x:15,y:20}; p.eL={x:0,y:20}; p.fR={x:35,y:35}; p.kR={x:15,y:30}; p.fL={x:-25,y:35}; p.kL={x:-15,y:30}; } }
        else if (fst.startsWith('atk_beam') || fst.startsWith('atk_sonic') || fst.startsWith('atk_parapara') || fst === 'atk_g_blaster' || fst === 'atk_bone_throw') { if (sf < 12) { p.hR={x:-15,y:10}; p.hL={x:-15,y:10}; p.h={x:-5,y:0}; p.hip={x:5,y:15}; p.kL.x+=5; p.kR.x-=5; } else { p.hR={x:30,y:0}; p.hL={x:30,y:0}; p.eR={x:15,y:5}; p.eL={x:15,y:5}; p.h={x:10,y:-5}; p.hip={x:-5,y:15}; p.fR.x+=10; p.fL.x-=10; } }
        else if (fst === 'atk_heal') { p.hL={x:0,y:-20}; p.hR={x:0,y:-20}; p.h={x:0,y:-5}; p.hip={x:0,y:20}; p.kL={x:-10,y:30}; p.kR={x:10,y:30}; p.fL={x:-15,y:40}; p.fR={x:15,y:40}; }
        else if (fst === 'atk_warpAtk' || fst === 'atk_counter' || fst === 'atk_shortcut') { if (sf < 4) { p.hR={x:-20,y:15}; p.h.y+=5; p.hip.y+=5; p.kL.x-=8; p.kR.x+=8; } else { p.hR={x:25,y:-30}; p.h.x+=10; p.fR.x+=15; p.fR.y-=5; p.fL.x-=5; } }
        else if (fst === 'atk_throw' || fst === 'atk_pull') { if (sf < 8) { p.hR={x:25,y:5}; p.eR={x:15,y:5}; p.h.x+=5; } else { p.hL={x:-15,y:25}; p.hR={x:-15,y:25}; p.h.x-=10; p.hip.x-=5; } }
        else if (fst === 'atk_physCounter') { p.hL={x:5,y:-5}; p.hR={x:-5,y:-5}; p.eL={x:10,y:5}; p.eR={x:-10,y:5}; } 
        else if (fst === 'atk_magReflect' || fst === 'atk_bone_up') { p.hR={x:25,y:-5}; p.eR={x:15,y:0}; if(!isTrail){ctx.shadowBlur=15; ctx.shadowColor='#0ff';} } 
        else if (fst === 'atk_burst') { if (sf % 8 < 4) { p.hR={x:25,y:0}; p.hL={x:-5,y:15}; p.h.x+=5; } else { p.hL={x:25,y:0}; p.hR={x:-5,y:15}; p.h.x-=5; } }
        else if (fst === 'hurt') { p.h={x:-15,y:-5}; p.hip={x:5,y:10}; p.sL={x:-10,y:5}; p.sR={x:-5,y:5}; p.eL={x:-15,y:15}; p.eR={x:-5,y:15}; p.hL={x:-20,y:25}; p.hR={x:-10,y:25}; p.fL={x:15,y:30}; p.fR={x:-5,y:35}; p.kL={x:20,y:20}; }
        else if (fst === 'knockdown') { p.h={x:-20,y:15}; p.hip={x:0,y:25}; p.hL={x:-15,y:35}; p.hR={x:-5,y:35}; p.kL={x:15,y:35}; p.fL={x:30,y:40}; p.n.y+=10; } 
        else if (fst === 'stunned') { p.h={x:-10,y:5}; p.hip={x:0,y:15}; p.hL={x:-5,y:30}; p.hR={x:5,y:30}; p.kL={x:10,y:30}; p.fL={x:15,y:40}; } 
        else if (fst === 'guard') { p.hL={x:10,y:-5}; p.hR={x:10,y:5}; p.eL={x:5,y:5}; p.eR={x:5,y:10}; p.h.y+=3; p.hip.y+=5; p.kL.x-=5; p.kR.x+=5; if(!isTrail && f.justGuardWindow > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0ff'; ctx.strokeStyle = '#0ff'; } }

        ctx.save(); ctx.translate(dx, dy); ctx.scale(bW, bH); if (safeNum(f.dir, 1) === -1) ctx.scale(-1, 1);
        if (!isTrail && (fst.startsWith('atk_') || fst === 'move' || f.isAwakened)) { ctx.shadowBlur = f.isAwakened ? 20 : 12; ctx.shadowColor = shadowCol; }

        ctx.beginPath(); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.hip.x, p.hip.y); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sL.x, p.sL.y); ctx.lineTo(p.eL.x, p.eL.y); ctx.lineTo(p.hL.x, p.hL.y); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sR.x, p.sR.y); ctx.lineTo(p.eR.x, p.eR.y); ctx.lineTo(p.hR.x, p.hR.y); ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kL.x, p.kL.y); ctx.lineTo(p.fL.x, p.fL.y); ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kR.x, p.kR.y); ctx.lineTo(p.fR.x, p.fR.y); ctx.stroke();
        ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(p.h.x, p.h.y, Math.max(0.1, 6 * bHead), 0, Math.PI * 2); ctx.fillStyle = isTrail ? cAura : useColor; ctx.fill();
        ctx.restore();
    };

    let dx = safeNum(f.x, 0); let dy = safeNum(f.y, 0) - 20 * bH;
    if ((fst === 'stunned' || fst === 'knockdown') && !isTrail) { dx += (Math.random()-0.5)*4; dy += (Math.random()-0.5)*4; ctx.strokeStyle = '#888'; }

    drawCore(dx, dy, alpha);
    if (f.hasClones && !isTrail) { drawCore(dx - 40, dy, 0.4); drawCore(dx + 40, dy, 0.4); }
    if (!isTrail && passKey === 'MAHORAGA' && f.hitHistory) {
        let maxAdapt = 0; for(let k in f.hitHistory) if(safeNum(f.hitHistory[k],0) > maxAdapt) maxAdapt = f.hitHistory[k];
        if (maxAdapt > 0) { ctx.shadowBlur = 0; ctx.strokeStyle = '#ff0'; ctx.lineWidth = 1; let rot = (sf * maxAdapt) * 0.1; ctx.beginPath(); for(let i=0; i<8; i++){ ctx.moveTo(dx, dy-15*bH); ctx.lineTo(dx + Math.cos(rot+i*Math.PI/4)*10, dy-15*bH + Math.sin(rot+i*Math.PI/4)*10); } ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    if (!isTrail && f.funnelTimer > 0) { ctx.fillStyle = cAura; ctx.shadowBlur = 10; ctx.shadowColor = cAura; let ufoY = dy - 30 + Math.sin(Date.now()/100)*5; ctx.fillRect(dx - 10, ufoY, 20, 4); ctx.fillRect(dx - 5, ufoY - 4, 10, 4); ctx.shadowBlur = 0; }
  }
};
