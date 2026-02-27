// === AUTO FIGHTER (Phase 16: BUG-FREE PERFECT ENGINE) ===

const Styles = {
    RUSH: { name: 'インファイター', desc: '常に前進し、接近戦でのコンボを狙う。手数が多く攻撃的。', aggro: 0.8, guard: 0.1, dodge: 0.1, range: 35 },
    ZONE: { name: 'アウトレンジャー', desc: '距離を保ち、遠距離技でじわじわ削る。近づかれると逃げる。', aggro: 0.3, guard: 0.2, dodge: 0.5, range: 120 },
    COUNTER: { name: 'カウンター特化', desc: 'ガードと回避を多用して敵の攻撃を誘い、隙に強烈な反撃を叩き込む。', aggro: 0.2, guard: 0.6, dodge: 0.2, range: 50 },
    TRICKY: { name: 'トリッキー', desc: '不規則なステップやワープ技を駆使し、相手を翻弄する変則スタイル。', aggro: 0.5, guard: 0.2, dodge: 0.3, range: 80 }
};

const Passives = {
    NONE: { name: 'なし', desc: '特別な効果を持たない。' },
    VAMPIRE: { name: '吸血鬼', desc: '与えたダメージの20%だけ、自身のHPを回復する。' },
    DESPERATION: { name: '背水の陣', desc: '自身のHPが30%以下の時、与えるダメージが1.5倍になる。' },
    GIANT: { name: '巨人の体', desc: '常に受けるダメージを20%カットする。重量級向け。' },
    NINJA: { name: '忍', desc: '移動スピードと回避距離がアップする。軽量級向け。' },
    LEARNING: { name: '成長AI (学習)', desc: '戦闘中、相手の行動をリアルタイムに学習し最適化する。' },
    MAHORAGA: { name: '摩虎羅 (耐性)', desc: '同じ技を5回受けると解析を開始し、3秒後に適応。以降その技のダメージ・怯みを半減。' }
};

const AwakenConds = {
    NONE: { name: 'なし', desc: '覚醒を行わない。' },
    HP20: { name: 'HP20%以下', desc: 'HPが残り20%を切ると、強力なオーラと共に覚醒する。' },
    TIME: { name: '30秒経過', desc: 'バトル開始から30秒経つと強制的に覚醒する。' }
};

const Skills = {
    jab: {name:'ジャブ', dmg: 10, kb: 2, range: 35, start: 4, act: 8, rec: 12, cd: 10, vx: 4, type: 'melee', desc: '発生が最速の基本技。コンボの起点になる。'},
    upper: {name:'アッパー', dmg: 20, kb: 2, range: 40, start: 7, act: 12, rec: 20, cd: 20, vx: 5, type: 'anti_air', desc: '相手を高く打ち上げる。空中コンボへ繋げやすい。'},
    smash: {name:'スマッシュ', dmg: 40, kb: 12, range: 45, start: 14, act: 15, rec: 35, cd: 40, vx: 8, type: 'melee', desc: '大振りだが、相手を強烈に吹き飛ばす必殺の一撃。'},
    meteor: {name:'メテオ', dmg: 50, kb: 15, range: 45, start: 10, act: 15, rec: 30, cd: 40, vx: 6, type: 'air', desc: '【空中専用】空中の敵を地面に叩き落とす。'},
    slide: {name:'スライド', dmg: 20, kb: 4, range: 45, start: 6, act: 20, rec: 20, cd: 25, vx: 12, type: 'melee', desc: '姿勢を低くして高速で突進する奇襲技。'},
    beam: {name:'ビーム', dmg: 40, kb: 10, range: 250, start: 25, act: 15, rec: 40, cd: 60, vx: -2, type: 'range', desc: '長距離レーザー。発生は遅いが画面端まで届く。'},
    sonic: {name:'ソニック', dmg: 25, kb: 4, range: 200, start: 12, act: 1, rec: 25, cd: 30, vx: 0, type: 'shot', desc: '前方に高速で飛んでいく衝撃波（飛び道具）を放つ。'},
    dive: {name:'急降下', dmg: 35, kb: 8, range: 60, start: 8, act: 15, rec: 25, cd: 30, vx: 10, type: 'air', desc: '【空中専用】空中から斜め下へ鋭く突進蹴りを行う。'},
    shoryu: {name:'昇龍拳', dmg: 30, kb: 10, range: 40, start: 5, act: 15, rec: 35, cd: 35, vx: 4, type: 'anti_air', desc: '飛び上がりながら攻撃。対空や打ち上げに優れる。'},
    heal: {name:'ヒール', dmg: 0, kb: 0, range: 0, start: 30, act: 5, rec: 30, cd: 120, vx: 0, type: 'buff', desc: '無防備な構えを取るが、自身のHPを200回復する。'},
    warpAtk: {name:'幻影斬', dmg: 25, kb: 5, range: 150, start: 15, act: 10, rec: 25, cd: 50, vx: 0, type: 'warp', desc: '相手の背後に一瞬でワープして斬りつける。'},
    throw: {name:'投げ技', dmg: 35, kb: 8, range: 30, start: 8, act: 10, rec: 20, cd: 25, vx: 5, type: 'throw', desc: 'ガードを完全に無視して相手を投げ飛ばす近距離技。'},
    physCounter: {name:'物理当て身', dmg: 0, kb: 0, range: 0, start: 2, act: 30, rec: 20, cd: 30, vx: 0, type: 'stance_phys', desc: '構え中に直接攻撃を受けると、無効化して超絶反撃を行う。'},
    magReflect: {name:'魔法反射', dmg: 0, kb: 0, range: 0, start: 2, act: 40, rec: 20, cd: 30, vx: 0, type: 'stance_mag', desc: '構え中に飛び道具を受けると、相手に跳ね返す。'}
};

const SkillKeys = Object.keys(Skills);
const CounterData = {name:'カウンター', dmg: 80, kb: 15, range: 45, start: 4, act: 15, rec: 20, cd: 0, vx: 8, type: 'melee'};

const getStyle = (key) => Styles[key] || Styles['RUSH'];
const getPassive = (key) => Passives[key] || Passives['NONE'];
const getAwaken = (key) => AwakenConds[key] || AwakenConds['NONE'];
const getSkill = (key) => Skills[key] || Skills['jab'];

const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0,
  stageWidth: 800, stageHeight: 500, groundY: 420, scale: 0.65, camX: 0, camY: 0,
  texts: [], vfx: [], bullets: [],
  isSim: false, simEpoch: 0, simMaxEpoch: 20, simWins: 0, isInfinite: false,
  
  myAI: {}, savedSlots: [null, null, null], labSt: 'main', labCur: 0, trainingMsg: '',

  // ★ 鉄壁のデータ初期化＆修復モジュール
  sanitizeAI(ai) {
      if (!ai) ai = {};
      if (typeof ai.body !== 'object' || !ai.body) ai.body = { width: 1.0, height: 1.0, head: 1.0 };
      if (typeof ai.color === 'string') ai.color = { body: ai.color, aura: '#ff0' };
      else if (typeof ai.color !== 'object' || !ai.color) ai.color = { body: '#0ff', aura: '#ff0' };
      if (typeof ai.physics !== 'object' || !ai.physics) ai.physics = { weight: 100 };
      if (typeof ai.base !== 'object' || !ai.base) ai.base = { atk: 1.0, res: 1.0, spd: 1.0 };
      if (typeof ai.bonus !== 'object' || !ai.bonus) ai.bonus = { atk: 0, res: 0, spd: 0 };
      if (!Styles[ai.styleKey]) ai.styleKey = 'RUSH';
      if (!Array.isArray(ai.skillKeys)) ai.skillKeys = ['jab', 'upper', 'smash', 'sonic'];
      while (ai.skillKeys.length < 4) ai.skillKeys.push('jab'); // 欠損技の補充
      for (let i = 0; i < 4; i++) if (!Skills[ai.skillKeys[i]]) ai.skillKeys[i] = 'jab';
      if (!Passives[ai.passiveKey]) ai.passiveKey = 'NONE';
      if (!AwakenConds[ai.awakenCond]) ai.awakenCond = 'NONE';
      if (!Passives[ai.awakenPassive]) ai.awakenPassive = 'NONE';
      if (typeof ai.learningLevel !== 'number' || isNaN(ai.learningLevel)) ai.learningLevel = 0;
      if (typeof ai.awakenColor !== 'string') ai.awakenColor = '#f00';
      if (!ai.name) ai.name = 'MY-AI';
      return ai;
  },

  play(snd) { if(!this.isSim && typeof playSnd !== 'undefined') playSnd(snd); },
  shake(val) { if(!this.isSim && typeof screenShake !== 'undefined') screenShake(val); },
  stop(val) { if(!this.isSim && typeof hitStop !== 'undefined') hitStop(val); },
  addText(x, y, text, color) { if(this.isSim) return; this.texts.push({x, y, text, color, life: 40}); },
  addVFX(type, x, y, color, extra={}) { if(this.isSim) return; this.vfx.push({type, x, y, color, life: extra.life||20, maxLife: extra.life||20, ...extra}); },

  init() { 
      this.st = 'menu'; this.menuCur = 0; this.isSim = false; this.isInfinite = false; BGM.play('menu'); 
      this.myAI = this.sanitizeAI({});
      try {
          let data = localStorage.getItem('5in1_ultima_ai_slots');
          if (data) this.savedSlots = JSON.parse(data);
          if (this.savedSlots && this.savedSlots[0]) { this.myAI = this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[0]))); }
      } catch(e) { console.log("Load Error", e); this.savedSlots = [null,null,null]; }
  },

  checkHealth() { if (!this.myAI || !this.myAI.bonus) this.myAI = this.sanitizeAI(this.myAI); },

  saveSlot(index) {
      this.savedSlots[index] = JSON.parse(JSON.stringify(this.myAI));
      localStorage.setItem('5in1_ultima_ai_slots', JSON.stringify(this.savedSlots));
  },
  loadSlot(index) {
      if (this.savedSlots && this.savedSlots[index]) { 
          this.myAI = this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[index]))); return true; 
      }
      return false;
  },

  createFighter(isP2, data) {
      let stKey = Styles[data.styleKey] ? data.styleKey : 'RUSH';
      let safeBonus = data.bonus || {atk:0, res:0, spd:0};
      let safeBase = data.base || {atk:1, res:1, spd:1};
      
      return {
          id: isP2 ? 2 : 1, x: isP2 ? 550 : 250, y: this.groundY, dir: isP2 ? -1 : 1, hp: 1000, maxHp: 1000, 
          base: { atk: safeBase.atk + safeBonus.atk, res: safeBase.res + safeBonus.res, spd: safeBase.spd + safeBonus.spd }, 
          body: data.body || {width:1, height:1, head:1}, color: data.color || {body:'#fff', aura:'#ff0'}, physics: data.physics || {weight:100}, 
          styleKey: stKey, skillKeys: data.skillKeys || ['jab','upper','smash','sonic'],
          passiveKey: data.passiveKey || 'NONE', awakenCond: data.awakenCond || 'NONE', awakenPassive: data.awakenPassive || 'NONE', awakenColor: data.awakenColor || '#f00',
          dynGuard: getStyle(stKey).guard, dynDodge: getStyle(stKey).dodge, hitHistory: {}, adapting: {}, adapted: {}, 
          state: 'idle', stateFrame: 0, prevState: 'idle', cd: 0, name: data.name || 'FIGHTER', vx: 0, vy: 0, guarding: false, justGuardWindow: 0, trail: [],
          hitCancel: false, hasHit: false, combo: 0, comboTimer: 0, comboDmg: 0, isAwakened: false
      };
  },

  setupSimBattle() {
      this.checkHealth();
      this.timer = 0; this.texts = []; this.vfx = []; this.bullets = [];
      this.p1 = this.createFighter(false, this.myAI);
      
      let isMirror = Math.random() < 0.25; 
      if (isMirror) {
          this.p2 = this.createFighter(true, this.myAI); this.p2.name = 'MIRROR'; this.p2.color = { body: '#555', aura: '#888' };
      } else {
          let eStyle = Object.keys(Styles)[Math.floor(Math.random()*4)];
          let dummyData = { 
              name: 'DUMMY-' + eStyle, body: { width: 1.0, height: 1.0, head: 1.0 }, color: { body: '#f0f', aura: '#f00' }, physics: { weight: 100 },
              base: { atk: 1.0, res: 1.0, spd: 1.0 }, bonus: {atk:0, res:0, spd:0}, styleKey: eStyle, skillKeys: [...SkillKeys].sort(()=>Math.random()-0.5).slice(0,4),
              passiveKey: ['NONE','MAHORAGA','GIANT'][Math.floor(Math.random()*3)], awakenCond: 'NONE', awakenPassive: 'NONE', awakenColor: '#f00'
          };
          this.p2 = this.createFighter(true, dummyData);
      }
      this.camX = (this.p1.x + this.p2.x) / 2 - (200 / this.scale) / 2; this.camY = this.groundY - (300 / this.scale) / 2;
  },

  updateBattleState() {
      this.timer++; let dist = Math.abs(this.p1.x - this.p2.x);
      if (dist < 15) { if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; } else { let push = (15 - dist) / 2; this.p1.x += (this.p1.x < this.p2.x) ? -push : push; this.p2.x += (this.p2.x < this.p1.x) ? -push : push; } }
      this.processFighter(this.p1, this.p2); this.processFighter(this.p2, this.p1);
      
      for(let i=this.bullets.length-1; i>=0; i--) {
          let b = this.bullets[i]; 
          // ★ 弾の安全処理と画面外消去
          if(!b || !b.owner || !b.owner.color || !b.skill || b.x < -500 || b.x > this.stageWidth + 500) { this.bullets.splice(i, 1); continue; }
          
          b.x += b.vx; b.y += b.vy; b.life--; 
          this.addVFX('slash', b.x, b.y, b.owner.color.aura || '#ff0', {size: 15, angle: b.vx>0?0:Math.PI, width: 4, life:2});
          
          let opp = b.owner.id === 1 ? this.p2 : this.p1; let hit = false;
          if (Math.abs(b.x - opp.x) < 30 && Math.abs(b.y - opp.y) < 50 && opp.state !== 'hurt' && opp.state !== 'stunned' && opp.state !== 'knockdown') {
              if (opp.state === 'atk_magReflect') { b.vx *= -1; b.owner = opp; b.life = 60; this.addVFX('impact', b.x, b.y, '#0ff', {size: 40}); this.addText(opp.x, opp.y - 40, "REFLECT!!", "#0ff"); this.play('combo'); } 
              else { hit = this.applyHit(b.owner, b.skill, opp, b.x, b.y); }
          }
          if(b.life <= 0 || hit) this.bullets.splice(i, 1);
      }

      [this.p1, this.p2].forEach(f => {
          if (f.comboTimer > 0) f.comboTimer--;
          if (f.comboTimer <= 0 && f.state !== 'hurt' && f.state !== 'stunned' && f.state !== 'knockdown') { let opp = f.id === 1 ? this.p2 : this.p1; opp.combo = 0; opp.comboDmg = 0; }
      });

      let viewW = 200 / this.scale; let viewH = 300 / this.scale;
      let targetX = (this.p1.x + this.p2.x) / 2 - viewW / 2; let targetY = (this.p1.y + this.p2.y) / 2 - viewH * 0.6; 
      targetX = Math.max(0, Math.min(this.stageWidth - viewW, targetX)); targetY = Math.max(0, Math.min(this.stageHeight - viewH, targetY));
      this.camX += (targetX - this.camX) * 0.1; this.camY += (targetY - this.camY) * 0.1;
  },

  update() {
    this.checkHealth(); 
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'menu') {
        if (keysDown.up) { this.menuCur = (this.menuCur - 1 + 3) % 3; this.play('sel'); }
        if (keysDown.down) { this.menuCur = (this.menuCur + 1) % 3; this.play('sel'); }
        if (keysDown.a) { 
            this.play('jmp'); 
            if (this.menuCur === 0) { this.setupSimBattle(); this.st = 'battle'; BGM.play('action'); } 
            else if (this.menuCur === 1) { this.st = 'lab_main'; this.labCur = 0; } 
            else { this.st = 'load_slot'; this.labCur = 0; }
        }
        for (let i = this.texts.length - 1; i >= 0; i--) { this.texts[i].life--; this.texts[i].y -= 0.5; if (this.texts[i].life <= 0) this.texts.splice(i, 1); }
        return;
    }

    if (this.st === 'load_slot') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; this.play('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; this.play('sel'); }
        if (keysDown.b) { this.st = 'menu'; this.play('hit'); return; }
        if (keysDown.a) { if (this.loadSlot(this.labCur)) { this.st = 'menu'; this.play('combo'); this.addText(100, 150, "LOAD SUCCESS!", "#0f0"); } else this.play('hit'); } return;
    }

    if (this.st === 'lab_main') {
        const labItems = ['戦闘スタイル設定', 'スキルセット(技)', 'パッシブ＆覚醒', 'ステータス配分', '体型＆カラー', '通常学習(20回)', '無限強化学習', '戻る'];
        if (keysDown.up) { this.labCur = (this.labCur - 1 + labItems.length) % labItems.length; this.play('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % labItems.length; this.play('sel'); }
        if (keysDown.a) {
            this.play('hit');
            if (this.labCur === 0) { this.st = 'lab_style'; this.labCur = 0; }
            else if (this.labCur === 1) { this.st = 'lab_skills'; this.labCur = 0; }
            else if (this.labCur === 2) { this.st = 'lab_awaken'; this.labCur = 0; }
            else if (this.labCur === 3) { this.st = 'lab_stats'; this.labCur = 0; }
            else if (this.labCur === 4) { this.st = 'lab_body'; this.labCur = 0; }
            else if (this.labCur === 5) { this.isSim = true; this.isInfinite = false; this.simEpoch = 0; this.simMaxEpoch = 20; this.simWins = 0; this.setupSimBattle(); this.st = 'training'; this.trainingMsg = '仮想敵 生成完了...'; BGM.play('action'); }
            else if (this.labCur === 6) { this.isSim = true; this.isInfinite = true; this.simEpoch = 0; this.simWins = 0; this.setupSimBattle(); this.st = 'training'; this.trainingMsg = '※Bボタンでいつでも中断・保存できます'; BGM.play('action'); }
            else { this.st = 'menu'; this.menuCur = 0; }
        }
        if (keysDown.b) { this.st = 'menu'; this.play('hit'); } return;
    }

    if (this.st === 'save_slot') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; this.play('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; this.play('sel'); }
        if (keysDown.b) { this.st = 'lab_main'; this.labCur = 5; this.play('hit'); return; }
        if (keysDown.a) { this.saveSlot(this.labCur); this.st = 'menu'; this.isSim = false; this.play('combo'); this.addText(100, 150, "SAVE COMPLETED!", "#0f0"); } return;
    }

    if (this.st === 'lab_style') { if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 0; this.play('hit'); return; } if (keysDown.right || keysDown.left) { this.play('sel'); let dir = keysDown.right ? 1 : -1; let keys = Object.keys(Styles); let idx = Math.max(0, keys.indexOf(this.myAI.styleKey)); this.myAI.styleKey = keys[(idx + dir + keys.length) % keys.length]; } return; }
    if (this.st === 'lab_skills') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 1; this.play('hit'); return; } if (keysDown.right || keysDown.left) { this.play('sel'); let dir = keysDown.right ? 1 : -1; let idx = Math.max(0, SkillKeys.indexOf(this.myAI.skillKeys[this.labCur])); this.myAI.skillKeys[this.labCur] = SkillKeys[(idx + dir + SkillKeys.length) % SkillKeys.length]; } return; }
    if (this.st === 'lab_awaken') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 2; this.play('hit'); return; } if (keysDown.right || keysDown.left) { this.play('sel'); let dir = keysDown.right ? 1 : -1; if (this.labCur === 0) { let keys = Object.keys(Passives); let idx = Math.max(0, keys.indexOf(this.myAI.passiveKey)); this.myAI.passiveKey = keys[(idx + dir + keys.length) % keys.length]; } else if (this.labCur === 1) { let keys = Object.keys(AwakenConds); let idx = Math.max(0, keys.indexOf(this.myAI.awakenCond)); this.myAI.awakenCond = keys[(idx + dir + keys.length) % keys.length]; } else if (this.labCur === 2) { let keys = Object.keys(Passives); let idx = Math.max(0, keys.indexOf(this.myAI.awakenPassive)); this.myAI.awakenPassive = keys[(idx + dir + keys.length) % keys.length]; } else if (this.labCur === 3 && keysDown.right) { this.myAI.awakenColor = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0'); } } return; }
    
    // ★ ステータス配分の浮動小数点誤差バグを完全に修正
    if (this.st === 'lab_stats') { 
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; this.play('sel'); } 
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; this.play('sel'); } 
        if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 3; this.play('hit'); return; } 
        
        let valChange = 0; if (keysDown.left) valChange = -1; if (keysDown.right) valChange = 1; 
        if (valChange !== 0) { 
            // 内部で10倍して整数計算することで計算誤差を完全に無くす
            let cAtk = Math.round(this.myAI.base.atk * 10); let cRes = Math.round(this.myAI.base.res * 10); let cSpd = Math.round(this.myAI.base.spd * 10);
            let total = cAtk + cRes + cSpd; 
            if (this.labCur === 0) { let next = Math.max(5, Math.min(20, cAtk + valChange)); if (total - cAtk + next <= 30) { this.myAI.base.atk = next / 10; this.play('sel'); } else this.play('hit'); } 
            else if (this.labCur === 1) { let next = Math.max(5, Math.min(20, cRes + valChange)); if (total - cRes + next <= 30) { this.myAI.base.res = next / 10; this.play('sel'); } else this.play('hit'); } 
            else if (this.labCur === 2) { let next = Math.max(5, Math.min(20, cSpd + valChange)); if (total - cSpd + next <= 30) { this.myAI.base.spd = next / 10; this.play('sel'); } else this.play('hit'); } 
        } return; 
    }
    
    if (this.st === 'lab_body') { if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; this.play('sel'); } if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; this.play('sel'); } if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 4; this.play('hit'); return; } let valChange = 0; if (keys.left) valChange = -0.05; if (keys.right) valChange = 0.05; if (valChange !== 0) { if (this.labCur === 0) this.myAI.body.width = Math.max(0.5, Math.min(2.0, this.myAI.body.width + valChange)); if (this.labCur === 1) this.myAI.body.height = Math.max(0.5, Math.min(2.0, this.myAI.body.height + valChange)); if (this.labCur === 2) this.myAI.physics.weight = Math.max(50, Math.min(200, this.myAI.physics.weight + valChange * 100)); if (this.labCur === 3 && keysDown.right) this.myAI.color.body = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0'); } return; }

    if (this.st === 'battle') {
        this.updateBattleState();
        for (let i = this.texts.length - 1; i >= 0; i--) { this.texts[i].life--; this.texts[i].y -= 0.5; if (this.texts[i].life <= 0) this.texts.splice(i, 1); }
        for (let i = this.vfx.length - 1; i >= 0; i--) { let v = this.vfx[i]; v.life--; if (v.type === 'slash') { v.x += v.vx || 0; v.y += v.vy || 0; } if (v.life <= 0) this.vfx.splice(i, 1); }
        if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; this.play('combo'); this.shake(10); }
        return;
    }

    if (this.st === 'training') {
        if (keysDown.b && this.isInfinite) {
            this.isSim = false; BGM.play('menu'); this.play('combo');
            this.st = 'save_slot'; this.labCur = 0; this.texts = [];
            this.addText(100, 150, `TRAINING STOPPED! WINS:${this.simWins}`, "#0f0");
            return;
        }

        for(let loop = 0; loop < 10; loop++) {
            this.updateBattleState();
            
            if (this.p1.hp <= 0 || this.p2.hp <= 0 || this.timer > 1500) {
                if (this.p1.hp > this.p2.hp && this.p1.hp > 0) this.simWins++;
                
                // ★ 学習ボーナスのステータス爆発防止（キャップ設定）
                let b = this.p1.hp > this.p2.hp ? 0.005 : 0.002;
                if (!this.myAI.bonus) this.myAI.bonus = {atk:0, res:0, spd:0};
                this.myAI.bonus.atk = Math.min(5.0, this.myAI.bonus.atk + b);
                this.myAI.bonus.res = Math.min(5.0, this.myAI.bonus.res + b);
                this.myAI.bonus.spd = Math.min(5.0, this.myAI.bonus.spd + b);
                this.myAI.learningLevel += 1;

                this.simEpoch++;
                if (!this.isInfinite && this.simEpoch >= this.simMaxEpoch) {
                    this.isSim = false; BGM.play('menu'); this.play('combo');
                    this.st = 'save_slot'; this.labCur = 0; this.texts = [];
                    this.addText(100, 150, `TRAINING FINISH! WINS:${this.simWins}`, "#0f0");
                    break;
                } else { 
                    this.setupSimBattle(); 
                }
            }
        }
        return;
    }

    if (this.st === 'result') { if (keysDown.a) { this.st = 'menu'; this.play('sel'); } return; }
  },

  applyHit(attacker, skill, victim, hx, hy) {
       if (!skill || !victim || !attacker) return false; 
       
       let sName = skill.name || '不明';
       let pKeyV = victim.isAwakened ? victim.awakenPassive : victim.passiveKey;
       let pKeyA = attacker.isAwakened ? attacker.awakenPassive : attacker.passiveKey;

       if (pKeyV === 'MAHORAGA' && victim.adapted && victim.adapted[sName]) {
           this.addVFX('impact', victim.x, victim.y-15, '#fff', {size: 30, life: 10});
           this.addText(victim.x, victim.y - 40, "完全適応", "#fff"); this.play('sel'); return true; 
       }

       if (victim.comboDmg > 100 || attacker.combo >= 6) {
           victim.vy = -8; victim.vx = attacker.dir * 15; victim.state = 'knockdown'; victim.stateFrame = 0;
           attacker.combo = 0; victim.comboDmg = 0; attacker.hitCancel = false; this.addText(victim.x, victim.y-30, "COMBO LIMIT", "#888"); return true;
       }

       if (victim.state === 'atk_physCounter' && skill.type !== 'shot' && skill.type !== 'range') {
           this.play('combo'); this.shake(15); this.stop(15);
           this.addVFX('impact', victim.x, victim.y, '#f00', {size: 70}); this.addText(victim.x, victim.y-50, "COUNTER!!", "#f00");
           attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 5;
           victim.state = 'atk_counter'; victim.stateFrame = 0; victim.vx = victim.dir * 8; return true;
       }

       if (victim.guarding && victim.justGuardWindow > 0 && skill.type !== 'throw') {
           this.play('sel'); this.shake(8); this.stop(10);
           this.addVFX('impact', victim.x, victim.y-20, '#0ff', {size: 50}); this.addText(victim.x, victim.y - 50, "PARRY!", "#0ff");
           attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 2; attacker.vy = -3; attacker.hitCancel = false;
           victim.guarding = false; victim.justGuardWindow = 0; victim.state = 'idle'; victim.cd = 0; return true; 
       }

       let safeAtk = attacker.base ? attacker.base.atk : 1.0;
       let damage = (skill.dmg || 10) * safeAtk; 
       if (pKeyA === 'DESPERATION' && (attacker.hp / attacker.maxHp) <= 0.3) damage *= 1.5;
       if (pKeyV === 'GIANT') damage *= 0.8;
       let safeWeight = victim.physics ? Math.max(1, victim.physics.weight) : 100;
       damage = Math.max(1, damage - ((safeWeight - 100) * 0.1)); 

       if (pKeyV === 'MAHORAGA') {
           if (!victim.hitHistory) victim.hitHistory = {};
           if (!victim.adapting) victim.adapting = {};
           victim.hitHistory[sName] = (victim.hitHistory[sName] || 0) + 1;
           if (victim.hitHistory[sName] === 5 && !victim.adapting[sName]) {
               victim.adapting[sName] = 180; this.addText(victim.x, victim.y - 50, "解析開始...", "#aaa");
           }
       }

       let kbForce = (skill.kb || 2) * safeAtk * (100 / safeWeight);
       let isGuarding = victim.guarding && skill.type !== 'throw'; 

       if (isGuarding) {
           victim.hp -= damage * 0.2; this.play('sel'); this.shake(2); victim.vx = attacker.dir * kbForce * 0.3; 
           this.addVFX('impact', victim.x, victim.y-15, '#888', {size: 15, life: 10}); return true;
       }

       victim.hp -= damage; 
       if (pKeyA === 'VAMPIRE') attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * 0.2);

       victim.state = 'hurt'; victim.stateFrame = 0; victim.comboTimer = 60; 
       victim.comboDmg += damage; attacker.hitCancel = true; attacker.combo++;

       if (victim.y < this.groundY - 10) victim.vy = -4; 
       if (skill.type === 'anti_air') { victim.vy = -16 * (100 / safeWeight); victim.y -= 5; } 
       else if (sName === 'メテオ') { victim.vy = 20; kbForce *= 0.5; }
       else if (skill.type === 'throw') { victim.vy = -10; kbForce *= 1.5; victim.y -= 5; } 
       else if (sName === 'スライド' || sName === '急降下') victim.vy = -8 * (100 / safeWeight);
       else if ((skill.kb||0) > 10) victim.vy = -6 - (Math.random()*2); 
       
       victim.vx = attacker.dir * kbForce;
       let auraCol = (attacker.color && attacker.color.aura) ? attacker.color.aura : '#ff0';
       
       if (sName === 'ジャブ') { this.play('hit'); this.shake(4); this.stop(3); this.addVFX('impact', hx, hy, '#fff', {size: 25}); } 
       else { this.play('combo'); this.shake(12); this.stop(8); this.addVFX('impact', hx, hy, auraCol, {size: 50}); this.addVFX('slash', hx, hy, '#fff', {size: 40, angle: Math.random()*Math.PI*2, width: 4}); }
       
       return true;
  },

  processFighter(f, opp) {
    if (!f || !opp) return;
    f.stateFrame++; 
    
    // ★ 状態が変わったらヒット判定をリセットする処理
    if (f.state !== f.prevState) {
        f.hasHit = false;
        f.prevState = f.state;
    }

    let safeSpd = f.base ? Math.max(0.5, f.base.spd) : 1.0;
    if (f.cd > 0) f.cd -= safeSpd;

    if (!f.isAwakened) {
        let awaken = false;
        if (f.awakenCond === 'HP20' && f.hp <= f.maxHp * 0.2) awaken = true;
        if (f.awakenCond === 'TIME' && this.timer > 1800) awaken = true; 
        if (awaken) {
            f.isAwakened = true; f.color = { body: (f.color?f.color.body:'#fff'), aura: f.awakenColor || '#f00' }; 
            f.hp = Math.min(f.maxHp, f.hp + 300); this.play('combo'); this.shake(20); this.stop(30);
            this.addVFX('shockwave', f.x, f.y, f.color.aura, {size: 150, life: 40}); this.addText(f.x, f.y - 60, "AWAKENING!!", f.color.aura);
            f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; return;
        }
    }

    let pKey = f.isAwakened ? f.awakenPassive : f.passiveKey;
    if (pKey === 'LEARNING' && f.stateFrame % 60 === 0) {
        if (opp.state.startsWith('atk_')) {
            let oppSkillType = opp.state.split('_')[1];
            let sObj = getSkill(oppSkillType);
            if (sObj) {
                if (sObj.type === 'shot' || sObj.type === 'range') f.dynDodge = Math.min(1.0, f.dynDodge + 0.05); 
                else f.dynGuard = Math.min(1.0, f.dynGuard + 0.05); 
                this.addVFX('impact', f.x, f.y-30, '#0f0', {size: 15, life: 5}); 
            }
        }
    }

    // ★ 摩虎羅の無限適応バグ修正（完了したらadaptingから削除）
    if (pKey === 'MAHORAGA' && f.adapting) {
        for (let sk in f.adapting) {
            if (f.adapting[sk] > 0) {
                f.adapting[sk]--;
                if (f.adapting[sk] === 0) {
                    if (!f.adapted) f.adapted = {};
                    f.adapted[sk] = true; this.addText(f.x, f.y - 70, "適応完了!!", "#fff");
                    this.play('combo'); this.shake(5); this.addVFX('shockwave', f.x, f.y, '#fff', {size: 80, life: 20});
                    delete f.adapting[sk]; 
                }
            }
        }
    }

    f.x += f.vx; f.y += f.vy; f.vx *= 0.85; 
    let safeWeight = f.physics ? f.physics.weight : 100;
    if (f.y < this.groundY) { f.vy += 0.6 + (safeWeight - 100)*0.005; } else { f.y = this.groundY; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4 || f.state.startsWith('atk_')) { f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state, frame: f.stateFrame}); if(f.trail.length > 5) f.trail.pop(); } else if (f.trail.length > 0) { f.trail.pop(); }
    if (f.state === 'idle' || f.state === 'move') { f.dir = (opp.x > f.x) ? 1 : -1; }

    if (f.state === 'hurt') { if (f.stateFrame > 25) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }
    if (f.state === 'knockdown') { if (f.stateFrame > 40) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; } 
    if (f.state === 'guard') { if (f.justGuardWindow > 0) f.justGuardWindow--; if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } return; }
    if (f.state === 'stunned') { if (f.stateFrame > 60) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }

    let isAtk = f.state.startsWith('atk_'); let sKey = isAtk ? f.state.split('_')[1] : ''; 
    let skill = isAtk ? (sKey === 'counter' ? CounterData : getSkill(sKey)) : null;
    
    // ★ 攻撃の「持続フレーム」すり抜け防止の神対応
    if (isAtk && skill) {
         let sFrame = Math.floor((skill.start||5) / safeSpd);
         let actFrame = Math.floor((skill.act||10) / safeSpd);
         let recFrame = Math.floor((skill.rec||15) / safeSpd);
         let sName = skill.name || '';
         
         if (f.stateFrame === sFrame - 2 && skill.type === 'warp') { f.x = opp.x - opp.dir * 40; f.dir = opp.dir; this.addVFX('shockwave', f.x, f.y, '#ccc', {size: 30, life: 10}); }
         
         if (f.stateFrame >= sFrame && f.stateFrame <= sFrame + actFrame) { 
             
             // 1フレーム目だけの処理（弾発射など）
             if (f.stateFrame === sFrame) {
                 if (skill.type === 'anti_air') { f.vy = -12; f.vx = f.dir * 4; }
                 if (sName === '急降下') { f.vy = 10; f.vx = f.dir * 12; }
                 if (skill.type === 'buff') { f.hp = Math.min(f.maxHp, f.hp + 200); this.addVFX('shockwave', f.x, f.y, '#0f0', {size: 50}); this.play('combo'); }
                 if (skill.type === 'shot') { this.play('jmp'); this.bullets.push({x: f.x + 20*f.dir, y: f.y - 20 * (f.body?f.body.height:1), vx: f.dir * 10, vy: 0, owner: f, skill: skill, life: 60}); } 
                 else if (skill.type === 'range') { this.addVFX('beam', f.x + 20*f.dir, f.y - 15 * (f.body?f.body.height:1), (f.color?f.color.body:'#fff'), {size: skill.range||250, dir: f.dir, life: 15}); this.shake(6); }
             }

             // 物理攻撃の持続判定（まだ当てていなければ毎フレーム判定）
             if (!f.hasHit && skill.type !== 'buff' && skill.type !== 'shot' && skill.type !== 'range' && !(skill.type||'').startsWith('stance')) {
                 let hitSuccess = this.createHitbox(f, skill, opp); 
                 if (hitSuccess) {
                     f.hasHit = true;
                     let angle = f.dir === 1 ? 0 : Math.PI; if (skill.type === 'anti_air') angle -= (Math.PI/4) * f.dir; if (skill.type === 'air') angle += (Math.PI/4) * f.dir; 
                     if (sName !== 'ジャブ') this.addVFX('slash', f.x + 20*f.dir, f.y - 20 * (f.body?f.body.height:1), (f.color?f.color.body:'#fff'), {size: (skill.range||30) * (f.body?f.body.width:1), angle: angle, width: 10});
                 }
             }
         }
         
         // 技の終了（硬直が終わったら）
         if (f.stateFrame > (sFrame + actFrame + recFrame)) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; f.hasHit = false; }
    }
    
    let canCancel = isAtk && f.hitCancel && skill && f.stateFrame > ((skill.start||5) + 5) / safeSpd;

    if ((f.state === 'idle' && f.cd <= 0) || canCancel) {
        let d = Math.abs(f.x - opp.x); let isAir = f.y < this.groundY - 10; let oppIsAir = opp.y < this.groundY - 10;
        let st = getStyle(f.styleKey); let ninjaSpd = pKey === 'NINJA' ? 1.5 : 1.0;

        if (opp.state.startsWith('atk_') && d < 80 && !isAir && !canCancel) {
            let dynG = f.dynGuard || 0.2; let dynD = f.dynDodge || 0.2;
            if (Math.random() < dynG + dynD) {
                if (Math.random() < (dynD / (dynG + dynD)) && d > 30) {
                    f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 12 * ninjaSpd; f.cd = 10;
                    this.addVFX('shockwave', f.x, f.y, '#fff', {size: 20, life: 10}); this.play('sel'); this.addText(f.x, f.y - 40, "DODGE", "#ccc"); return;
                } else { f.state = 'guard'; f.stateFrame = 0; f.guarding = true; f.justGuardWindow = 10; return; }
            }
        }

        let shouldAttack = false; let moveDir = 0;
        if (opp.state === 'hurt' || opp.state === 'stunned' || opp.state === 'knockdown') {
            shouldAttack = true; 
            if (oppIsAir && !isAir && d < 60 && f.state !== 'move') { f.state = 'move'; f.stateFrame = 0; f.vy = -16; f.vx = f.dir * 5; f.cd = 0; f.hitCancel = false; return; }
        } else {
            if (d < (st.range||50)) { if (Math.random() < (st.aggro||0.5)) shouldAttack = true; else moveDir = -f.dir; } else { moveDir = f.dir; }
        }

        if (shouldAttack) {
            let bestSkillKey = null; let bestScore = -100;
            let sKeys = Array.isArray(f.skillKeys) ? f.skillKeys : ['jab','upper','smash','sonic'];
            let safeWidth = f.body ? f.body.width : 1.0;

            for (let skey of sKeys) {
                let s = getSkill(skey); let score = 0; let sRange = s.range || 30; let sType = s.type || 'melee';
                if (d <= sRange * safeWidth) score += 10; else score -= (d - sRange) * 0.2;
                if (isAir) { if (sType === 'air') score += 30; else score -= 20; } else { if (sType === 'air') score -= 20; }
                if (oppIsAir && !isAir) { if (sType === 'anti_air') score += 20; }
                if (sType === 'buff' && f.hp < f.maxHp * 0.5 && d > 150) score += 40;
                if (sType.startsWith('stance')) { if (opp.state.startsWith('atk_')) score += 30; else score -= 50; }
                if (sType === 'throw') { if (opp.guarding && d < 40) score += 40; else score -= 10; }
                if (canCancel) { if ((s.start||5) < 10) score += 15; if (sType === 'shot' || sType === 'buff' || sType.startsWith('stance')) score -= 20; }
                score += Math.random() * 10;
                if (score > bestScore) { bestScore = score; bestSkillKey = skey; }
            }
            if (bestSkillKey) { let sData = getSkill(bestSkillKey); f.state = 'atk_' + bestSkillKey; f.stateFrame = 0; f.vx = f.dir * (sData.vx||0); f.cd = (sData.cd||20); f.hitCancel = false; }
        } else if (moveDir !== 0 && Math.random() < (safeSpd * 0.3) && !canCancel) { f.state = 'move'; f.stateFrame = 0; f.vx = moveDir * 6 * ninjaSpd; }
    }
    if (f.state === 'move' && Math.abs(f.vx) < 0.5 && f.y >= this.groundY) { f.state = 'idle'; f.stateFrame = 0; }
  },

  createHitbox(attacker, skill, victim) {
    let vDist = Math.abs(victim.x - attacker.x); let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 
    let actualRange = (skill.range||30) * (attacker.body ? attacker.body.width : 1.0);
    if (inFront && vDist <= actualRange + 15 && Math.abs(victim.y - attacker.y) < 60) {
        return this.applyHit(attacker, skill, victim, attacker.x + (vDist/2)*attacker.dir, victim.y - 15);
    }
    return false;
  },

  drawStickman(f, alpha = 1, isTrail = false) {
    if (!f || !f.body || !f.color) return; 
    let bW = f.body.width || 1.0; let bH = f.body.height || 1.0; let bHead = f.body.head || 1.0;
    let cBody = typeof f.color === 'string' ? f.color : (f.color.body || '#fff');
    let cAura = typeof f.color === 'string' ? '#ff0' : (f.color.aura || '#ff0');
    let useColor = f.isAwakened ? (f.awakenColor || '#f00') : (isTrail ? cAura : cBody);
    let shadowCol = f.isAwakened ? (f.awakenColor || '#f00') : cAura;

    ctx.strokeStyle = useColor; ctx.lineWidth = (isTrail ? 2 : 2.5) / Math.max(bW, bH); 
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
    
    let p = { h:{x:0,y:-12}, n:{x:0,y:0}, hip:{x:0,y:15}, sL:{x:-4,y:2}, sR:{x:4,y:2}, eL:{x:-8,y:10}, eR:{x:8,y:10}, hL:{x:-12,y:20}, hR:{x:12,y:20}, kL:{x:-4,y:25}, kR:{x:4,y:25}, fL:{x:-6,y:40}, fR:{x:6,y:40} };
    let sf = isTrail ? f.frame : f.stateFrame; 

    if (f.state === 'idle') { let t = Date.now()/200; p.h.y+=Math.sin(t); p.n.y+=Math.sin(t); p.hL.y+=Math.sin(t+1)*2; p.hR.y+=Math.sin(t+1)*2; p.hip.y+=2; p.kL.x-=2; p.kR.x+=2; p.kL.y-=2; p.kR.y-=2; } 
    else if (f.state === 'move') { if (f.y < this.groundY - 5) { p.hL.y-=20; p.hR.y-=20; p.eL.y-=10; p.eR.y-=10; p.kL.y-=15; p.kR.y-=5; p.fL.y-=15; p.h.x+=5; } else { let run = Math.sin(sf * 0.6) * 15; p.hL.x=-run; p.hR.x=run; p.eL.x=-run/2; p.eR.x=run/2; p.fL.x=run; p.fR.x=-run; p.kL.x=run/2; p.kR.x=-run/2; p.h.x+=5; p.n.x+=5; p.hip.x+=3; } }
    else if (f.state === 'atk_jab') { if (sf < 4) { p.hR={x:-5,y:10}; p.eR={x:0,y:15}; p.h.x-=2; } else if (sf < 12) { p.hR={x:35,y:0}; p.eR={x:15,y:5}; p.sR.x+=5; p.h.x+=5; p.fR.x+=10; } }
    else if (f.state === 'atk_upper' || f.state === 'atk_shoryu') { if (sf < 7) { p.hR={x:-5,y:25}; p.eR={x:5,y:20}; p.hip.y+=5; p.h.y+=5; p.kL.x-=5; p.kR.x+=5; } else { p.hR={x:20,y:-35}; p.eR={x:10,y:-15}; p.h.y-=8; p.h.x+=5; p.fL.y-=5; p.fR.y-=5; } }
    else if (f.state === 'atk_smash' || f.state === 'atk_tackle') { if (sf < 14) { p.hR={x:-15,y:-20}; p.eR={x:-5,y:-10}; p.h.x-=5; p.hip.x-=5; p.kL.x-=5; } else { p.hR={x:40,y:15}; p.eR={x:20,y:10}; p.h.x+=12; p.hip.x+=8; p.fL.x-=15; p.fR.x+=15; p.kR.x+=10; p.kR.y+=5; } }
    else if (f.state === 'atk_meteor' || f.state === 'atk_dive') { if (sf < 10) { p.hL={x:0,y:-25}; p.hR={x:0,y:-25}; p.eL={x:-10,y:-15}; p.eR={x:10,y:-15}; p.fL.y-=10; p.fR.y-=10; p.kL.y-=10; p.kR.y-=10; } else { p.hL={x:30,y:30}; p.hR={x:30,y:30}; p.eL={x:15,y:15}; p.eR={x:15,y:15}; p.h.x+=10; p.h.y+=5; p.hip.y+=5; p.kL.x-=5; } }
    else if (f.state === 'atk_slide') { if (sf < 6) { p.h={x:-5,y:5}; p.hip={x:0,y:15}; p.kL.x-=10; p.kL.y+=5; p.kR.x+=10; p.kR.y+=5; } else { p.h={x:15,y:10}; p.n={x:10,y:15}; p.hip={x:-5,y:25}; p.hR={x:20,y:25}; p.hL={x:5,y:25}; p.eR={x:15,y:20}; p.eL={x:0,y:20}; p.fR={x:35,y:35}; p.kR={x:15,y:30}; p.fL={x:-25,y:35}; p.kL={x:-15,y:30}; } }
    else if (f.state === 'atk_beam' || f.state === 'atk_sonic') { if (sf < 12) { p.hR={x:-15,y:10}; p.hL={x:-15,y:10}; p.h={x:-5,y:0}; p.hip={x:5,y:15}; p.kL.x+=5; p.kR.x-=5; } else { p.hR={x:30,y:0}; p.hL={x:30,y:0}; p.eR={x:15,y:5}; p.eL={x:15,y:5}; p.h={x:10,y:-5}; p.hip={x:-5,y:15}; p.fR.x+=10; p.fL.x-=10; } }
    else if (f.state === 'atk_heal') { p.hL={x:0,y:-20}; p.hR={x:0,y:-20}; p.h={x:0,y:-5}; p.hip={x:0,y:20}; p.kL={x:-10,y:30}; p.kR={x:10,y:30}; p.fL={x:-15,y:40}; p.fR={x:15,y:40}; }
    else if (f.state === 'atk_warpAtk' || f.state === 'atk_counter') { if (sf < 4) { p.hR={x:-20,y:15}; p.h.y+=5; p.hip.y+=5; p.kL.x-=8; p.kR.x+=8; } else { p.hR={x:25,y:-30}; p.h.x+=10; p.fR.x+=15; p.fR.y-=5; p.fL.x-=5; } }
    else if (f.state === 'atk_throw') { if (sf < 8) { p.hR={x:25,y:5}; p.eR={x:15,y:5}; p.h.x+=5; } else { p.hL={x:-15,y:25}; p.hR={x:-15,y:25}; p.h.x-=10; p.hip.x-=5; } }
    else if (f.state === 'atk_physCounter') { p.hL={x:5,y:-5}; p.hR={x:-5,y:-5}; p.eL={x:10,y:5}; p.eR={x:-10,y:5}; } 
    else if (f.state === 'atk_magReflect') { p.hR={x:25,y:-5}; p.eR={x:15,y:0}; if(!isTrail){ctx.shadowBlur=15; ctx.shadowColor='#0ff';} } 
    
    else if (f.state === 'hurt') { p.h={x:-15,y:-5}; p.hip={x:5,y:10}; p.sL={x:-10,y:5}; p.sR={x:-5,y:5}; p.eL={x:-15,y:15}; p.eR={x:-5,y:15}; p.hL={x:-20,y:25}; p.hR={x:-10,y:25}; p.fL={x:15,y:30}; p.fR={x:-5,y:35}; p.kL={x:20,y:20}; }
    else if (f.state === 'knockdown') { p.h={x:-20,y:15}; p.hip={x:0,y:25}; p.hL={x:-15,y:35}; p.hR={x:-5,y:35}; p.kL={x:15,y:35}; p.fL={x:30,y:40}; p.n.y+=10; } 
    else if (f.state === 'stunned') { p.h={x:-10,y:5}; p.hip={x:0,y:15}; p.hL={x:-5,y:30}; p.hR={x:5,y:30}; p.kL={x:10,y:30}; p.fL={x:15,y:40}; } 
    else if (f.state === 'guard') { p.hL={x:10,y:-5}; p.hR={x:10,y:5}; p.eL={x:5,y:5}; p.eR={x:5,y:10}; p.h.y+=3; p.hip.y+=5; p.kL.x-=5; p.kR.x+=5; if(!isTrail && f.justGuardWindow > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0ff'; ctx.strokeStyle = '#0ff'; } }

    let dx = f.x; let dy = f.y - 20 * bH;
    if ((f.state === 'stunned' || f.state === 'knockdown') && !isTrail) { dx += (Math.random()-0.5)*4; dy += (Math.random()-0.5)*4; ctx.strokeStyle = '#888'; }

    ctx.save(); ctx.translate(dx, dy); ctx.scale(bW, bH); if (f.dir === -1) ctx.scale(-1, 1);
    if (!isTrail && (f.state.startsWith('atk_') || f.state === 'move' || f.isAwakened)) { ctx.shadowBlur = f.isAwakened ? 20 : 12; ctx.shadowColor = shadowCol; }

    ctx.beginPath(); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.hip.x, p.hip.y); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sL.x, p.sL.y); ctx.lineTo(p.eL.x, p.eL.y); ctx.lineTo(p.hL.x, p.hL.y); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sR.x, p.sR.y); ctx.lineTo(p.eR.x, p.eR.y); ctx.lineTo(p.hR.x, p.hR.y); ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kL.x, p.kL.y); ctx.lineTo(p.fL.x, p.fL.y); ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kR.x, p.kR.y); ctx.lineTo(p.fR.x, p.fR.y); ctx.stroke();
    ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(p.h.x, p.h.y, Math.max(1, 6 * bHead), 0, Math.PI * 2); ctx.fillStyle = useColor; ctx.fill();
    
    let passKey = f.isAwakened ? f.awakenPassive : f.passiveKey;
    if (!isTrail && passKey === 'MAHORAGA' && f.hitHistory) {
        let maxAdapt = 0; for(let k in f.hitHistory) if(f.hitHistory[k] > maxAdapt) maxAdapt = f.hitHistory[k];
        if (maxAdapt > 0) {
            ctx.shadowBlur = 0; ctx.strokeStyle = '#ff0'; ctx.lineWidth = 1;
            let rot = (f.stateFrame * maxAdapt) * 0.1; ctx.beginPath();
            for(let i=0; i<8; i++){ ctx.moveTo(p.h.x, p.h.y-15); ctx.lineTo(p.h.x + Math.cos(rot+i*Math.PI/4)*10, p.h.y-15 + Math.sin(rot+i*Math.PI/4)*10); } ctx.stroke();
        }
    }
    ctx.restore(); ctx.globalAlpha = 1;
  },

  draw() {
    if (this.st === 'menu' || this.st.startsWith('lab_') || this.st === 'save_slot' || this.st === 'load_slot') {
        const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#001'); grad.addColorStop(1, '#003');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('ULTIMATE AI LAB', 25, 50);
            ctx.fillStyle = this.menuCur === 0 ? '#ff0' : '#fff'; ctx.font = '12px monospace'; ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'BATTLE START', 40, 150);
            ctx.fillStyle = this.menuCur === 1 ? '#ff0' : '#fff'; ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'AI FACTORY', 45, 180);
            ctx.fillStyle = this.menuCur === 2 ? '#ff0' : '#fff'; ctx.fillText((this.menuCur === 2 ? '> ' : '  ') + 'LOAD AI DATA', 35, 210);
            ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('最高に自由なAI育成', 45, 280);
        }
        else if (this.st === 'save_slot' || this.st === 'load_slot') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText(this.st === 'save_slot' ? 'SAVE SLOT' : 'LOAD SLOT', 50, 50);
            ctx.font = '12px monospace';
            for(let i=0; i<3; i++) {
                ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff';
                let txt = this.savedSlots[i] ? `SLOT ${i+1}: Lv.${Math.floor((this.savedSlots[i].learningLevel||0)/10)}` : `SLOT ${i+1}: NO DATA`;
                ctx.fillText((this.labCur === i ? '> ' : '  ') + txt, 20, 120 + i * 40);
            }
            ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText(this.st === 'save_slot' ? 'どこに保存しますか？' : 'どのAIを呼び出しますか？', 30, 270);
        }
        else {
            ctx.fillStyle = '#112'; ctx.fillRect(10, 10, 180, 90); ctx.strokeStyle = '#335'; ctx.strokeRect(10, 10, 180, 90);
            ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText(`Lv.${Math.floor((this.myAI.learningLevel||0)/10)}`, 20, 25); ctx.fillText('NORMAL', 55, 25); ctx.fillText('AWAKENED', 130, 25);
            let prevF = { x: 0, y: 0, dir: 1, state: 'idle', stateFrame: 0, body: this.myAI.body, color: this.myAI.color, isAwakened: false };
            ctx.save(); ctx.translate(50, 75); this.drawStickman(prevF); ctx.restore();
            prevF.isAwakened = true; prevF.color = {body: (this.myAI.color?.body||'#fff'), aura: (this.myAI.awakenColor||'#f00')}; ctx.save(); ctx.translate(145, 75); this.drawStickman(prevF); ctx.restore();

            ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace';
            
            if (this.st === 'lab_main') {
                ctx.fillText('【CUSTOMIZE MENU】', 30, 120); ctx.font = '10px monospace';
                const items = ['戦闘スタイル設定', 'スキルセット(技)', 'パッシブ＆覚醒', 'ステータス配分', '体型＆カラー', '通常学習(20回)', '無限強化学習', '戻る'];
                for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 138 + i * 16); }
            }
            else if (this.st === 'lab_style') { ctx.fillText('【BATTLE STYLE】', 40, 120); ctx.font = '11px monospace'; let sName = getStyle(this.myAI.styleKey).name; ctx.fillStyle = '#ff0'; ctx.fillText(`◀ ${sName.padEnd(8,' ')} ▶`, 35, 160); this.drawDescBox(`[ ${sName} ]`, getStyle(this.myAI.styleKey).desc); }
            else if (this.st === 'lab_skills') { ctx.fillText('【SKILL SETTING】', 40, 115); ctx.font = '10px monospace'; for(let i=0; i<4; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; let skName = getSkill(this.myAI.skillKeys[i]).name; ctx.fillText(`SLOT ${i+1}: ◀ ${skName.padEnd(5,' ')} ▶`, 20, 135 + i * 18); } let curSkill = getSkill(this.myAI.skillKeys[this.labCur]); this.drawDescBox(`[ ${curSkill.name} ] 威力:${curSkill.dmg} CD:${curSkill.cd}`, curSkill.desc); }
            else if (this.st === 'lab_awaken') { ctx.fillText('【PASSIVE & AWAKEN】', 25, 120); ctx.font = '10px monospace'; const items = [ `常時パッシブ : ${getPassive(this.myAI.passiveKey).name}`, `覚醒の条件　 : ${getAwaken(this.myAI.awakenCond).name}`, `覚醒パッシブ : ${getPassive(this.myAI.awakenPassive).name}`, `覚醒オーラ色 : [CHANGE]` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 5, 140 + i * 18); } let desc = ''; let title = ''; if(this.labCur===0){ title=`[ ${getPassive(this.myAI.passiveKey).name} ]`; desc=getPassive(this.myAI.passiveKey).desc; } else if(this.labCur===1){ title=`[ ${getAwaken(this.myAI.awakenCond).name} ]`; desc=getAwaken(this.myAI.awakenCond).desc; } else if(this.labCur===2){ title=`[ ${getPassive(this.myAI.awakenPassive).name} ]`; desc=getPassive(this.myAI.awakenPassive).desc; } else { title=`[ オーラ色変更 ]`; desc='覚醒（変身）した時に纏う激しいオーラの色を変更します。'; } this.drawDescBox(title, desc); }
            else if (this.st === 'lab_stats') { ctx.fillText('【STATUS POINT】', 40, 120); ctx.font = '10px monospace'; let safeBase = this.myAI.base || {atk:1,res:1,spd:1}; let pts = (3.0 - (safeBase.atk + safeBase.res + safeBase.spd)).toFixed(1); ctx.fillStyle = '#88f'; ctx.fillText(`残りポイント: ${pts}`, 40, 140); const items = [ `攻撃力(ATK) : ${safeBase.atk.toFixed(1)}`, `耐久力(RES) : ${safeBase.res.toFixed(1)}`, `素早さ(SPD) : ${safeBase.spd.toFixed(1)}` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 160 + i * 20); } let desc = this.labCur===0?'与えるダメージとノックバック力が上昇。':this.labCur===1?'受けるノックバックが減り、重い一撃にも耐える。':'技の発生、硬直、移動速度など全ての行動が速くなる。'; this.drawDescBox(`[ ステータス配分 ]`, desc); }
            else if (this.st === 'lab_body') { ctx.fillText('【BODY & PHYSICS】', 30, 120); ctx.font = '10px monospace'; let safeB = this.myAI.body || {width:1,height:1}; let safeP = this.myAI.physics || {weight:100}; const items = [ `横幅(W) : ${safeB.width.toFixed(2)}`, `縦幅(H) : ${safeB.height.toFixed(2)}`, `重量(WT): ${Math.floor(safeP.weight)}kg`, `ボディ色: [CHANGE]` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 140 + i * 18); } let desc = this.labCur===0?'当たり判定が横に広がるが、攻撃のリーチも伸びる。':this.labCur===1?'縦に大きくなる。ジャンプ力にも影響？':this.labCur===2?'重いほどダメージとノックバックを少し軽減する。':'ボディカラーをランダムに変更します。'; this.drawDescBox(`[ 体型＆物理設定 ]`, desc); }
        }
        for (let t of this.texts) { ctx.fillStyle = t.color; ctx.font = 'bold 16px monospace'; ctx.globalAlpha = t.life / 40; ctx.fillText(t.text, t.x - 20, t.y); ctx.globalAlpha = 1; }
        return;
    }

    let isHitStop = typeof hitStopTimer !== 'undefined' && hitStopTimer > 3;
    const grad = ctx.createLinearGradient(0, 0, 0, 300); if (isHitStop) { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); } else { grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    applyShake(); ctx.save(); ctx.scale(this.scale, this.scale); ctx.translate(-this.camX, -this.camY);

    ctx.strokeStyle = isHitStop ? '#000' : '#445'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(this.stageWidth, this.groundY); ctx.stroke();
    for(let i=0; i<this.stageWidth; i+=40) { ctx.beginPath(); ctx.moveTo(i, this.groundY); ctx.lineTo(i - 30, this.stageHeight); ctx.stroke(); }
    for(let i=0; i<=this.stageHeight; i+=60) { ctx.strokeStyle = isHitStop ? 'rgba(0,0,0,0.1)' : 'rgba(100,255,100,0.05)'; ctx.strokeRect(0, i, this.stageWidth, 1); }
    for(let i=0; i<=this.stageWidth; i+=60) { ctx.strokeRect(i, 0, 1, this.stageHeight); }

    [this.p1, this.p2].forEach(f => { if(!f)return; for(let i=0; i<f.trail.length; i++) { let tr = f.trail[i]; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state, frame: tr.frame}; this.drawStickman(tempF, 0.4 - (i*0.08), true); } });

    if(this.p1 && (!isHitStop || this.p1.state === 'hurt' || this.p1.state === 'stunned')) this.drawStickman(this.p1);
    if(this.p2 && (!isHitStop || this.p2.state === 'hurt' || this.p2.state === 'stunned')) this.drawStickman(this.p2);
    
    this.vfx.forEach(v => {
        let ratio = v.life / v.maxLife; ctx.globalAlpha = ratio;
        if (v.type === 'slash') { ctx.strokeStyle = v.color; ctx.lineWidth = v.width * ratio; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(v.x, v.y, v.size, v.angle - 1.0*ratio, v.angle + 1.0*ratio); ctx.stroke(); } 
        else if (v.type === 'impact') { ctx.fillStyle = isHitStop ? '#000' : v.color; ctx.beginPath(); let s = v.size * Math.pow((1 - ratio), 0.5) + 5; ctx.moveTo(v.x, v.y - s); ctx.lineTo(v.x + s/4, v.y - s/4); ctx.lineTo(v.x + s, v.y); ctx.lineTo(v.x + s/4, v.y + s/4); ctx.lineTo(v.x, v.y + s); ctx.lineTo(v.x - s/4, v.y + s/4); ctx.lineTo(v.x - s, v.y); ctx.lineTo(v.x - s/4, v.y - s/4); ctx.fill(); } 
        else if (v.type === 'shockwave') { ctx.strokeStyle = isHitStop ? '#000' : v.color; ctx.lineWidth = 4 * ratio; ctx.beginPath(); ctx.arc(v.x, v.y, v.size * (1-ratio)*2 + 10, 0, Math.PI*2); ctx.stroke(); } 
        else if (v.type === 'beam') { ctx.fillStyle = v.color; let h = 20 * ratio; let bx = v.dir === 1 ? v.x : v.x - v.size; ctx.fillRect(bx, v.y - h/2, v.size, h); ctx.fillStyle = '#fff'; ctx.fillRect(bx, v.y - h/6, v.size, h/3); }
    });
    ctx.globalAlpha = 1;
    for (let t of this.texts) { ctx.fillStyle = isHitStop ? '#000' : t.color; ctx.font = 'bold 24px monospace'; ctx.globalAlpha = t.life / 40; ctx.fillText(t.text, t.x - 30, t.y); ctx.globalAlpha = 1; }
    ctx.restore(); resetShake();

    if (this.st === 'training') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 200, 75);
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace'; 
        ctx.fillText(this.isInfinite ? '◆ 無限強化学習中 ◆' : '◆ AI TRAINING ◆', 25, 15);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; 
        ctx.fillText(`世代(EPOCH): ${this.simEpoch}`, 10, 35);
        ctx.fillStyle = '#ff0'; ctx.fillText(`WINS: ${this.simWins}`, 120, 35);
        
        let safeBonus = this.myAI.bonus || {atk:0,res:0,spd:0};
        ctx.fillStyle = '#aaf'; ctx.font = '9px monospace';
        ctx.fillText(`ATK+${safeBonus.atk.toFixed(3)} RES+${safeBonus.res.toFixed(3)} SPD+${safeBonus.spd.toFixed(3)}`, 5, 50);

        if (!this.isInfinite) {
            ctx.fillStyle = '#444'; ctx.fillRect(10, 60, 180, 6);
            ctx.fillStyle = '#0f0'; ctx.fillRect(10, 60, (this.simEpoch / this.simMaxEpoch) * 180, 6);
        } else {
            ctx.fillStyle = '#ccc'; ctx.fillText(this.trainingMsg, 10, 65);
        }
    } else if (this.p1 && this.p2) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 32); ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 80, 8); ctx.fillRect(110, 5, 80, 8);
        let p1Col = this.p1.isAwakened ? (this.p1.awakenColor||'#f00') : (this.p1.color?.body||'#fff');
        let p2Col = this.p2.isAwakened ? (this.p2.awakenColor||'#f00') : (this.p2.color?.body||'#fff');
        ctx.fillStyle = p1Col; ctx.fillRect(10, 5, Math.max(0, this.p1.hp/this.p1.maxHp)*80, 8);
        ctx.fillStyle = p2Col; let p2HpW = Math.max(0, this.p2.hp/this.p2.maxHp)*80; ctx.fillRect(190 - p2HpW, 5, p2HpW, 8);

        ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
        ctx.fillText(this.p1.name, 10, 25); ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5.5), 25);
        ctx.fillStyle = '#888'; ctx.font = '10px monospace'; let min = Math.floor(this.timer / 60); let sec = Math.floor((this.timer % 60) * 1.66); ctx.fillText(`${min}:${sec.toString().padStart(2,'0')}`, 85, 12);
        
        if (this.p1.combo > 1) { ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p1.combo + ' HITS!', 10, 45); }
        if (this.p2.combo > 1) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p2.combo + ' HITS!', 140, 45); }

        if (this.st === 'intro') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 130, 200, 40); ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('GET READY...', 50, 155); } 
        else if (this.st === 'result') { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 120, 200, 60); ctx.fillStyle = '#f0f'; ctx.font = 'bold 18px monospace'; let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name; ctx.fillText(winner + ' WIN!', 100 - (winner.length*6), 145); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('Press (A) to Menu', 45, 165); }
    }
  }
};
