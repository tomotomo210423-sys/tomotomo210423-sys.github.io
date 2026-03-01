// === AUTO FIGHTER (Phase 36: PURE BRAIN & SPLIT EDITION - Part 1) ===

const Styles = {
    RUSH: { name: 'インファイター', desc: '常に前進し、接近戦でのコンボを狙う。', aggro: 0.8, guard: 0.1, dodge: 0.1, range: 35 },
    ZONE: { name: 'アウトレンジャー', desc: '距離を保ち、遠距離技でじわじわ削る。', aggro: 0.3, guard: 0.2, dodge: 0.5, range: 120 },
    COUNTER: { name: 'カウンター特化', desc: 'ガードと回避を多用して敵の攻撃を誘う。', aggro: 0.2, guard: 0.6, dodge: 0.2, range: 50 },
    TRICKY: { name: 'トリッキー', desc: '不規則なステップやワープ技を駆使する。', aggro: 0.5, guard: 0.2, dodge: 0.3, range: 80 },
    AERO: { name: '空の支配者', desc: '常に空中戦を好む。上空からの強襲を狙う。', aggro: 0.6, guard: 0.1, dodge: 0.4, range: 60 },
    BALANCE: { name: 'バランス', desc: '近・遠・防御を状況に応じて使い分ける。', aggro: 0.5, guard: 0.3, dodge: 0.3, range: 80 },
    DEVIL: { name: 'デビル', desc: '相手をハメることに全力を尽くす。', aggro: 1.0, guard: 0.0, dodge: 0.1, range: 45 },
    SANS: { name: 'Sans', desc: '【特殊】絶対回避＆遠距離からの弾幕。', aggro: 1.0, guard: 0.0, dodge: 1.0, range: 300 }
};
const Policies = {
    BALANCE: { name: 'バランス', desc: '攻防をバランスよく学習する。迷ったらこれ。' },
    AGGRESSIVE: { name: '超攻撃的', desc: '被弾を恐れず、手数を増やすことを最優先で学習する。' },
    DEFENSIVE: { name: '鉄壁防御', desc: 'ガードと反撃を最優先で学習する。' },
    EVADING: { name: '回避特化', desc: '回避を最優先で学習する。Sans等に推奨。' }
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
    SANS_DODGE: { name: 'オート回避', desc: 'Sans専用。HPを消費して攻撃を確定回避。' },
    CHAOS: { name: 'CHAOS', desc: 'サイズ・速度が常にランダム変動するカオス。' }
};
const AwakenConds = { NONE: { name:'なし', desc:'覚醒を行わない。' }, HP20: { name:'HP20%以下', desc:'HPが残り20%を切ると覚醒。' }, TIME: { name:'30秒経過', desc:'バトル開始から30秒経つと覚醒。' } };
const AwakenPassives = { ...Passives, CLONE: { name: '影分身', desc: '自身と同じ動きをする分身を2体召喚する。' } };
const Ultimates = {
    ult_regen: {name:'超再生', dmg:0, kb:0, range:0, start:10, act:10, rec:10, cd:9999, type:'ult_regen', desc:'【1回限定】10秒間、HPが超回復し続ける。'},
    ult_stop: {name:'世界停止', dmg:0, kb:0, range:0, start:10, act:10, rec:10, cd:9999, type:'ult_stop', desc:'【1回限定】5秒間、相手と弾の時間を完全に止める。'},
    ult_clone: {name:'増殖', dmg:0, kb:0, range:0, start:15, act:15, rec:15, cd:9999, type:'ult_clone', desc:'【1回限定】独自の意思で動く分身を最大3体生成。'},
    ult_all41: {name:'オールフォーワン', dmg:100, kb:20, range:800, start:30, act:30, rec:0, cd:9999, type:'ult_all41', desc:'【1回限定】全技を同時発動。直後に自身は即死。'}
};
const UltimateKeys = Object.keys(Ultimates);
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
    random: {name:'RANDOM', dmg:0, kb:0, range:150, start:5, act:5, rec:15, cd:40, vx:0, type:'random', desc:'超カオス。隕石、ミクロ化、強制ワープ等。'},
    telekinesis: {name:'念力', dmg:25, kb:10, range:400, start:15, act:90, rec:20, cd:60, vx:0, type:'telekinesis', desc:'地面をくり抜き、3秒間自由に操りぶつける。'},
    sans_bone: {name:'骨の壁', dmg:1, kb:0, range:200, start:10, act:30, rec:15, cd:20, vx:0, type:'sans_bone', desc:'地面から連続して骨を生やす。'},
    sans_blue_bone: {name:'青骨', dmg:1, kb:0, range:400, start:5, act:15, rec:10, cd:15, vx:0, type:'sans_blue_bone', desc:'動かなければ当たらない青い骨。'},
    sans_throw: {name:'通常骨', dmg:1, kb:0, range:400, start:5, act:15, rec:10, cd:15, vx:0, type:'sans_throw', desc:'様々なサイズの骨を大量に放つ。'},
    sans_blaster_shoot: {name:'ブラスター(射)', dmg:2, kb:0, range:600, start:15, act:15, rec:25, cd:30, vx:0, type:'sans_blaster', desc:'極太ビームを放つ。'},
    sans_blaster_ride: {name:'ブラスター(突)', dmg:2, kb:0, range:400, start:10, act:20, rec:20, cd:30, vx:15, type:'sans_blaster_ride', desc:'ブラスターに乗って突撃する。'},
    sans_warp: {name:'ちかみち', dmg:0, kb:0, range:0, start:2, act:5, rec:5, cd:15, vx:0, type:'sans_warp', desc:'一瞬で有利な位置へテレポートする。'}
};
const SkillKeys = Object.keys(Skills).filter(k => !k.startsWith('sans_'));
const SansSkillKeys = ['sans_bone', 'sans_blue_bone', 'sans_throw', 'sans_blaster_shoot', 'sans_blaster_ride', 'sans_warp'];
const CounterData = {name:'カウンター', dmg:80, kb:15, range:45, start:4, act:15, rec:20, cd:0, vx:8, type:'melee'};

const getStyle = (key) => Styles[key] || Styles['RUSH'];
const getPassive = (key) => Passives[key] || Passives['NONE'];
const getAwaken = (key) => AwakenConds[key] || AwakenConds['NONE'];
const getAwakenPassive = (key) => AwakenPassives[key] || AwakenPassives['NONE'];
const getSkill = (key) => Skills[key] || Skills['jab'];
const getUlt = (key) => Ultimates[key] || Ultimates['ult_regen'];
const safeNum = (val, def) => { let n = Number(val); return (isNaN(n) || !isFinite(n)) ? def : n; };

const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0, stageWidth: 800, stageHeight: 500, groundY: 420, scale: 0.65, camX: 0, camY: 0,
  texts: [], vfx: [], bullets: [], clones: [], timeStopTimer: 0, timeStopOwner: 0,
  isSim: false, simEpoch: 0, simMaxEpoch: 30, simWins: 0, isInfinite: false,
  myAI: {}, savedSlots: [null, null, null], labSt: 'main', labCur: 0, trainingMsg: '',

  sanitizeAI(ai) {
      if (!ai || typeof ai !== 'object') ai = {}; ai.name = ai.name || 'MY-AI';
      ai.policy = Policies[ai.policy] ? ai.policy : 'BALANCE'; 
      ai.body = ai.body || {}; ai.body.width = Math.max(0.1, safeNum(ai.body.width, 1.0)); ai.body.height = Math.max(0.1, safeNum(ai.body.height, 1.0)); ai.body.head = Math.max(0.1, safeNum(ai.body.head, 1.0));
      ai.color = ai.color || {}; ai.color.body = typeof ai.color.body === 'string' ? ai.color.body : '#0ff'; ai.color.aura = typeof ai.color.aura === 'string' ? ai.color.aura : '#ff0';
      ai.physics = ai.physics || {}; ai.physics.weight = Math.max(10, safeNum(ai.physics.weight, 100));
      ai.base = ai.base || {}; ai.base.atk = Math.max(0.1, safeNum(ai.base.atk, 1.0)); ai.base.res = Math.max(0.1, safeNum(ai.base.res, 1.0)); ai.base.spd = Math.max(0.1, safeNum(ai.base.spd, 1.0));
      ai.styleKey = Styles[ai.styleKey] ? ai.styleKey : 'RUSH';
      ai.ultimateKey = Ultimates[ai.ultimateKey] ? ai.ultimateKey : 'ult_regen';
      
      ai.brain = ai.brain || {}; 
      ai.brain.aggro = Math.max(0.1, safeNum(ai.brain.aggro, 1.0)); 
      ai.brain.defend = Math.max(0.1, safeNum(ai.brain.defend, 1.0)); 
      ai.brain.skills = ai.brain.skills || {};
      ai.brain.bestDist = safeNum(ai.brain.bestDist, 100);

      if (ai.styleKey === 'SANS') { 
          ai.skillKeys = [...SansSkillKeys]; ai.passiveKey = 'SANS_DODGE'; ai.color.body = '#fff'; ai.color.aura = '#0ff'; 
      } else { 
          if (!Array.isArray(ai.skillKeys)) ai.skillKeys = ['jab', 'upper', 'smash', 'sonic']; 
          while (ai.skillKeys.length < 4) ai.skillKeys.push('jab'); 
          for (let i = 0; i < 4; i++) if (!Skills[ai.skillKeys[i]] || ai.skillKeys[i].startsWith('sans_')) ai.skillKeys[i] = 'jab'; 
          ai.passiveKey = Passives[ai.passiveKey] && ai.passiveKey !== 'SANS_DODGE' ? ai.passiveKey : 'NONE'; 
      }
      ai.awakenCond = AwakenConds[ai.awakenCond] ? ai.awakenCond : 'NONE'; 
      ai.awakenPassive = AwakenPassives[ai.awakenPassive] ? ai.awakenPassive : 'NONE'; 
      ai.awakenColor = typeof ai.awakenColor === 'string' ? ai.awakenColor : '#f00'; 
      ai.learningLevel = Math.max(0, safeNum(ai.learningLevel, 0)); 
      return ai;
  },

  play(snd) { if(!this.isSim && typeof playSnd !== 'undefined') playSnd(snd); },
  shake(val) { if(!this.isSim && typeof screenShake !== 'undefined') screenShake(safeNum(val, 0)); },
  stop(val) { if(!this.isSim && typeof hitStop !== 'undefined') hitStop(safeNum(val, 0)); },
  addText(x, y, text, color) { if(this.isSim || !text) return; this.texts.push({x: safeNum(x,0), y: safeNum(y,0), text: String(text), color: color||'#fff', life: 40}); },
  addVFX(type, x, y, color, extra={}) { if(this.isSim) return; this.vfx.push({type, x: safeNum(x,0), y: safeNum(y,0), color: color||'#fff', life: safeNum(extra.life,20), maxLife: safeNum(extra.maxLife, extra.life||20), vx: safeNum(extra.vx,0), vy: safeNum(extra.vy,0), ...extra}); },
  
  drawDescBox(title, descStr) {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(5, 205, 190, 90); ctx.strokeStyle = '#555'; ctx.strokeRect(5, 205, 190, 90);
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 11px monospace'; ctx.fillText(title || '[ INFO ]', 15, 220); ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
      let safeDesc = descStr || ''; let lines = []; for(let i=0; i<safeDesc.length; i+=17) lines.push(safeDesc.substring(i, i+17)); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 15, 238 + i*13);
  },

  init() { 
      this.st = 'menu'; this.menuCur = 0; this.isSim = false; this.isInfinite = false; BGM.play('menu'); 
      this.myAI = this.sanitizeAI({}); 
      try { let data = localStorage.getItem('5in1_ultima_ai_slots'); if (data) this.savedSlots = JSON.parse(data); if (this.savedSlots && this.savedSlots[0]) this.myAI = this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[0]))); } catch(e) { this.savedSlots = [null,null,null]; } 
  },
  checkHealth() { this.myAI = this.sanitizeAI(this.myAI); },
  saveSlot(index) { this.checkHealth(); this.savedSlots[index] = JSON.parse(JSON.stringify(this.myAI)); localStorage.setItem('5in1_ultima_ai_slots', JSON.stringify(this.savedSlots)); },
  loadSlot(index) { if (this.savedSlots && this.savedSlots[index]) { this.myAI = this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[index]))); return true; } return false; },

  createFighter(isP2, data) {
      let stKey = Styles[data.styleKey] ? data.styleKey : 'RUSH'; 
      let b = data.base || {atk:1, res:1, spd:1};
      let br = data.brain || {aggro:1, defend:1, skills:{}, bestDist:100};
      return { 
          id: isP2 ? 2 : 1, isClone: false, x: isP2 ? 550 : 250, y: this.groundY, dir: isP2 ? -1 : 1, hp: 1000, maxHp: 1000, kr: 0, hitCount: 0, dodgeCount: 0, hasDoneFirstAttack: false, usedUlt: false, regenTimer: 0, tkTimer: 0, chaosTimer: 0, policy: data.policy || 'BALANCE', 
          base: { atk: safeNum(b.atk, 1.0), res: safeNum(b.res, 1.0), spd: safeNum(b.spd, 1.0) }, 
          brain: { aggro: safeNum(br.aggro, 1.0), defend: safeNum(br.defend, 1.0), skills: br.skills||{}, bestDist: safeNum(br.bestDist, 100) }, 
          body: data.body || {width:1, height:1, head:1}, color: data.color || {body:'#fff', aura:'#ff0'}, physics: data.physics || {weight:100}, 
          styleKey: stKey, skillKeys: data.skillKeys || ['jab','upper','smash','sonic'], ultimateKey: data.ultimateKey || 'ult_regen', 
          passiveKey: data.passiveKey || 'NONE', awakenCond: data.awakenCond || 'NONE', awakenPassive: data.awakenPassive || 'NONE', awakenColor: data.awakenColor || '#f00', 
          dynGuard: getStyle(stKey).guard, dynDodge: getStyle(stKey).dodge, hitHistory: {}, adapting: {}, adapted: {}, 
          state: 'idle', stateFrame: 0, prevState: 'idle', cd: 0, name: data.name || 'FIGHTER', vx: 0, vy: 0, guarding: false, justGuardWindow: 0, trail: [], hitCancel: false, hasHit: false, combo: 0, comboTimer: 0, comboDmg: 0, isAwakened: false, funnelTimer: 0, hasClones: false 
      };
  },

  setupSimBattle() {
      this.checkHealth(); this.timer = 0; this.texts = []; this.vfx = []; this.bullets = []; this.clones = []; this.timeStopTimer = 0; 
      this.p1 = this.createFighter(false, this.myAI);
      
      let isMirror = Math.random() < 0.25; 
      if (isMirror) { 
          this.p2 = this.createFighter(true, this.myAI); this.p2.name = 'MIRROR'; this.p2.color = { body: '#555', aura: '#888' }; 
      } else {
          let eStyle = Object.keys(Styles)[Math.floor(Math.random()*Object.keys(Styles).length)]; 
          let dummySkills = []; let dummyPassive = 'NONE';
          
          if (eStyle === 'ZONE') { dummySkills = Math.random()<0.5 ? ['beam', 'sonic', 'parapara', 'magReflect'] : ['beam', 'slide', 'telekinesis', 'random']; dummyPassive = Math.random()<0.5 ? 'HOVER' : 'NINJA'; } 
          else if (eStyle === 'RUSH' || eStyle === 'DEVIL') { dummySkills = Math.random()<0.5 ? ['jab', 'smash', 'burst', 'throw'] : ['slide', 'upper', 'pull', 'burst']; dummyPassive = Math.random()<0.5 ? 'VAMPIRE' : 'DESPERATION'; } 
          else if (eStyle === 'AERO') { dummySkills = Math.random()<0.5 ? ['dive', 'meteor', 'sonic', 'upper'] : ['dive', 'smash', 'beam', 'telekinesis']; dummyPassive = 'HOVER'; } 
          else if (eStyle === 'COUNTER') { dummySkills = Math.random()<0.5 ? ['physCounter', 'magReflect', 'upper', 'pull'] : ['physCounter', 'slide', 'smash', 'heal']; dummyPassive = 'MAHORAGA'; } 
          else if (eStyle === 'TRICKY') { dummySkills = ['warpAtk', 'parapara', 'random', 'pull']; dummyPassive = Math.random()<0.5 ? 'CHAOS' : 'NINJA'; }
          else if (eStyle === 'SANS') { dummySkills = [...SansSkillKeys]; dummyPassive = 'SANS_DODGE'; } 
          else { let shuffled = [...SkillKeys].sort(()=>Math.random()-0.5); dummySkills = shuffled.slice(0,4); let pKeys = Object.keys(Passives).filter(k=>k!=='SANS_DODGE'); dummyPassive = pKeys[Math.floor(Math.random()*pKeys.length)]; }
          
          let dummyData = this.sanitizeAI({ name: 'NPC-' + eStyle, styleKey: eStyle, skillKeys: dummySkills, passiveKey: dummyPassive, ultimateKey: UltimateKeys[Math.floor(Math.random()*UltimateKeys.length)], policy: Object.keys(Policies)[Math.floor(Math.random()*4)] });
          if(eStyle === 'SANS') { dummyData.color = { body: '#fff', aura: '#0ff' }; dummyData.ultimateKey = 'ult_all41'; } 
          this.p2 = this.createFighter(true, dummyData);
      }
      this.camX = (this.p1.x + this.p2.x) / 2 - (200 / this.scale) / 2; this.camY = this.groundY - (300 / this.scale) / 2;
  },

  update() { try { this._update(); } catch(e) { console.error("SafeUpdate Error:", e); this.timer++; } },
  
  updateBattleState() {
      try {
          if (this.timeStopTimer > 0) this.timeStopTimer--;
          this.timer++; let dist = Math.abs(safeNum(this.p1.x,0) - safeNum(this.p2.x,0));
          if (dist < 15) { if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; } else { let push = (15 - dist) / 2; this.p1.x += (this.p1.x < this.p2.x) ? -push : push; this.p2.x += (this.p2.x < this.p1.x) ? -push : push; } }
          
          if (this.timeStopTimer === 0 || this.timeStopOwner === 1) this.processFighter(this.p1, this.p2);
          if (this.timeStopTimer === 0 || this.timeStopOwner === 2) this.processFighter(this.p2, this.p1);
          
          for(let i=this.clones.length-1; i>=0; i--) {
              let cl = this.clones[i]; cl.life--; let opp = cl.id === 1 ? this.p2 : this.p1;
              if (this.timeStopTimer === 0 || this.timeStopOwner === cl.id) this.processFighter(cl, opp);
              if(cl.life <= 0 || cl.hp <= 0) { this.addVFX('shockwave', cl.x, cl.y, '#fff', {size: 40}); this.clones.splice(i, 1); }
          }

          for(let i=this.bullets.length-1; i>=0; i--) {
              let b = this.bullets[i]; 
              if(!b || !b.owner || !b.skill || safeNum(b.x,0) < -1000 || safeNum(b.x,0) > this.stageWidth + 1000) { this.bullets.splice(i, 1); continue; }
              if (this.timeStopTimer > 0 && b.owner.id !== this.timeStopOwner) continue;

              if (b.skill.type === 'homing' || b.skill.type === 'telekinesis') {
                  let opp = b.owner.id === 1 ? this.p2 : this.p1;
                  let dx = safeNum(opp.x, 0) - b.x; let dy = (safeNum(opp.y, this.groundY) - 20) - b.y;
                  let d_len = Math.hypot(dx, dy) || 1; let homingForce = b.skill.type === 'telekinesis' ? 1.5 : 0.8;
                  b.vx += (dx/d_len) * homingForce; b.vy += (dy/d_len) * homingForce;
                  let maxSpd = b.skill.type === 'telekinesis' ? 18 : 12;
                  let spd = Math.hypot(b.vx, b.vy); if(spd > maxSpd) { b.vx = (b.vx/spd)*maxSpd; b.vy = (b.vy/spd)*maxSpd; }
              }
              b.x += b.vx; b.y += b.vy; b.life--; 
              let auraCol = (b.owner.color && b.owner.color.aura) ? b.owner.color.aura : '#ff0'; let bAngle = Math.atan2(b.vy, b.vx); 
              
              if (b.isBone || (b.skill && (b.skill.type === 'sans_throw' || b.skill.type === 'sans_blue_bone'))) { this.addVFX('bone', b.x, b.y, b.color || '#fff', {angle: bAngle + Date.now()/100, life: 2}); } 
              else if (b.skill.type === 'telekinesis') { this.addVFX('rock', b.x, b.y, '#885', {angle: bAngle + Date.now()/50, size: 30, life: 2}); }
              else { this.addVFX('slash', b.x, b.y, auraCol, {size: 15, angle: bAngle, width: 4, life:2}); }
              
              let opp = b.owner.id === 1 ? this.p2 : this.p1; let hit = false;
              if (Math.abs(b.x - safeNum(opp.x,0)) < 30 && Math.abs(b.y - safeNum(opp.y,0)) < 50 && opp.state !== 'hurt' && opp.state !== 'stunned' && opp.state !== 'knockdown') {
                  if (opp.state === 'atk_magReflect') { b.vx *= -1; b.owner = opp; b.life = 60; this.addVFX('impact', b.x, b.y, '#0ff', {size: 40}); this.addText(opp.x, opp.y - 40, "REFLECT!!", "#0ff"); this.play('combo'); } 
                  else { hit = this.applyHit(b.owner, b.skill, opp, b.x, b.y); }
              }
              if(b.life <= 0 || hit) { if(b.skill.type==='telekinesis') this.addVFX('shockwave', b.x, b.y, '#aaa', {size: 60}); this.bullets.splice(i, 1); }
          }
          [this.p1, this.p2, ...this.clones].forEach(f => { if(f){ if (f.comboTimer > 0) f.comboTimer--; if (f.comboTimer <= 0 && f.state !== 'hurt' && f.state !== 'stunned' && f.state !== 'knockdown') { let opp = f.id === 1 ? this.p2 : this.p1; if(opp){ opp.combo = 0; opp.comboDmg = 0; } } } });

          let viewW = 200 / this.scale; let viewH = 300 / this.scale;
          let targetX = (safeNum(this.p1.x,0) + safeNum(this.p2.x,0)) / 2 - viewW / 2; let targetY = (safeNum(this.p1.y,0) + safeNum(this.p2.y,0)) / 2 - viewH * 0.6; 
          targetX = Math.max(0, Math.min(this.stageWidth - viewW, targetX)); targetY = Math.max(0, Math.min(this.stageHeight - viewH, targetY));
          this.camX += (targetX - this.camX) * 0.1; this.camY += (targetY - this.camY) * 0.1;
      } catch(e) { console.error("BattleState Error:", e); }
  }
// ==== 続く（Part 2をそのまま下に貼り付けてください） ====
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
            if (this.st === 'lab_main') { ctx.fillText('【CUSTOMIZE MENU】', 30, 110); ctx.font = '10px monospace'; const items = ['AI名前変更', '教育方針', '戦闘スタイル', 'スキルセット', 'パッシブ＆覚醒', 'ステータス', '体型＆カラー', '通常学習(30試合)', '超・無限強化学習', 'AI初期化', '戻る']; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 125 + i * 13); } }
            else if (this.st === 'lab_policy') { ctx.fillText('【EDUCATION POLICY】', 40, 120); ctx.font = '11px monospace'; let pName = Policies[this.myAI.policy].name; ctx.fillStyle = '#ff0'; ctx.fillText(`◀ ${pName.padEnd(8,' ')} ▶`, 35, 160); this.drawDescBox(`[ ${pName} ]`, Policies[this.myAI.policy].desc); }
            else if (this.st === 'lab_style') { ctx.fillText('【BATTLE STYLE】', 40, 120); ctx.font = '11px monospace'; let sName = getStyle(this.myAI.styleKey).name; ctx.fillStyle = '#ff0'; ctx.fillText(`◀ ${sName.padEnd(8,' ')} ▶`, 35, 160); this.drawDescBox(`[ ${sName} ]`, getStyle(this.myAI.styleKey).desc); }
            else if (this.st === 'lab_skills') { 
                ctx.fillText('【SKILL SETTING】', 40, 110); ctx.font = '10px monospace'; 
                if(this.myAI.styleKey === 'SANS') { 
                    ctx.fillStyle = '#888'; ctx.fillText("※Sans専用スキル全解放中", 10, 125); ctx.fillStyle = '#0ff'; ctx.fillText("1:骨の壁    2:青骨", 20, 140); ctx.fillText("3:通常骨    4:ブラスター(射)", 20, 155); ctx.fillText("5:ブラ(突)  6:ちかみち", 20, 170); this.drawDescBox(`[ Sansの真骨頂 ]`, '6つの専用スキルを駆使して戦う。変更不可。');
                } else { 
                    let sKeys = this.myAI.skillKeys || []; for(let i=0; i<4; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; let skName = getSkill(sKeys[i]).name; ctx.fillText(`SLOT ${i+1}: ◀ ${skName.padEnd(5,' ')} ▶`, 20, 125 + i * 15); } 
                    ctx.fillStyle = this.labCur === 4 ? '#f0f' : '#f88'; ctx.fillText(`SLOT 5(必殺): ◀ ${getUlt(this.myAI.ultimateKey).name} ▶`, 10, 185);
                    let curSkill = this.labCur < 4 ? getSkill(sKeys[this.labCur]) : getUlt(this.myAI.ultimateKey); this.drawDescBox(`[ ${curSkill.name} ] 威力:${curSkill.dmg} CD:${curSkill.cd}`, curSkill.desc); 
                } 
            }
            else if (this.st === 'lab_awaken') { ctx.fillText('【PASSIVE & AWAKEN】', 25, 120); ctx.font = '10px monospace'; const items = [ `常時パッシブ : ${getPassive(this.myAI.passiveKey).name}`, `覚醒の条件　 : ${getAwaken(this.myAI.awakenCond).name}`, `覚醒パッシブ : ${getAwakenPassive(this.myAI.awakenPassive).name}`, `覚醒オーラ色 : [CHANGE]` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 5, 140 + i * 18); } let desc = ''; let title = ''; if(this.labCur===0){ title=`[ ${getPassive(this.myAI.passiveKey).name} ]`; desc=getPassive(this.myAI.passiveKey).desc; } else if(this.labCur===1){ title=`[ ${getAwaken(this.myAI.awakenCond).name} ]`; desc=getAwaken(this.myAI.awakenCond).desc; } else if(this.labCur===2){ title=`[ ${getAwakenPassive(this.myAI.awakenPassive).name} ]`; desc=getAwakenPassive(this.myAI.awakenPassive).desc; } else { title=`[ オーラ色変更 ]`; desc='覚醒（変身）した時に纏う激しいオーラの色を変更します。'; } this.drawDescBox(title, desc); }
            else if (this.st === 'lab_stats') { ctx.fillText('【STATUS POINT】', 40, 120); ctx.font = '10px monospace'; let safeBase = this.myAI.base || {atk:1,res:1,spd:1}; let pts = (3.0 - (safeBase.atk + safeBase.res + safeBase.spd)).toFixed(1); ctx.fillStyle = '#88f'; ctx.fillText(`残りポイント: ${pts}`, 40, 140); const items = [ `攻撃力(ATK) : ${safeBase.atk.toFixed(1)}`, `耐久力(RES) : ${safeBase.res.toFixed(1)}`, `素早さ(SPD) : ${safeBase.spd.toFixed(1)}` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 160 + i * 20); } let desc = this.labCur===0?'与えるダメージとノックバック力が上昇。':this.labCur===1?'受けるノックバックが減り、重い一撃にも耐える。':'技の発生、硬直、移動速度など全ての行動が速くなる。'; this.drawDescBox(`[ ステータス配分 ]`, desc); }
            else if (this.st === 'lab_body') { ctx.fillText('【BODY & PHYSICS】', 30, 120); ctx.font = '10px monospace'; let safeB = this.myAI.body || {width:1,height:1}; let safeP = this.myAI.physics || {weight:100}; const items = [ `横幅(W) : ${safeB.width.toFixed(2)}`, `縦幅(H) : ${safeB.height.toFixed(2)}`, `重量(WT): ${Math.floor(safeP.weight)}kg`, `ボディ色: [CHANGE]` ]; for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 140 + i * 18); } let desc = this.labCur===0?'当たり判定が横に広がるが、攻撃のリーチも伸びる。':this.labCur===1?'縦に大きくなる。ジャンプ力にも影響？':this.labCur===2?'重いほどダメージとノックバックを少し軽減する。':'ボディカラーをランダムに変更します。'; this.drawDescBox(`[ 体型＆物理設定 ]`, desc); }
        }
        for (let t of this.texts) { ctx.fillStyle = t.color; ctx.font = 'bold 16px monospace'; ctx.globalAlpha = Math.max(0, t.life / 40); ctx.fillText(t.text, t.x - 20, t.y); ctx.globalAlpha = 1; } return;
    }

    let isHitStop = typeof hitStopTimer !== 'undefined' && hitStopTimer > 3; let isTimeStop = this.timeStopTimer > 0;
    const grad = ctx.createLinearGradient(0, 0, 0, 300); if (isHitStop) { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); } else if (isTimeStop) { grad.addColorStop(0, '#300'); grad.addColorStop(1, '#505'); } else { grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030'); } ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    applyShake(); ctx.save(); ctx.scale(this.scale, this.scale); ctx.translate(-this.camX, -this.camY);
    ctx.strokeStyle = isTimeStop ? '#f0f' : '#445'; ctx.lineWidth = 2; let bgOffset = isTimeStop ? 0 : (this.timer * 2) % 40;
    ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(this.stageWidth, this.groundY); ctx.stroke();
    for(let i=0; i<this.stageWidth+40; i+=40) { ctx.beginPath(); ctx.moveTo(i - bgOffset, this.groundY); ctx.lineTo(i - 30 - bgOffset, this.stageHeight); ctx.stroke(); }
    for(let i=0; i<=this.stageHeight; i+=60) { ctx.strokeStyle = isTimeStop ? 'rgba(255,0,255,0.1)' : 'rgba(100,255,100,0.05)'; ctx.strokeRect(0, i, this.stageWidth, 1); }
    for(let i=0; i<=this.stageWidth; i+=60) { ctx.strokeRect(i, 0, 1, this.stageHeight); }

    [this.p1, this.p2, ...this.clones].forEach(f => { if(!f)return; let tList = f.trail||[]; for(let i=0; i<tList.length; i++) { let tr = tList[i]; if(!tr)continue; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state, frame: tr.frame}; this.drawStickman(tempF, 0.4 - (i*0.08), true); } });
    if(this.p1 && (!isHitStop || this.p1.state === 'hurt' || this.p1.state === 'stunned')) this.drawStickman(this.p1);
    if(this.p2 && (!isHitStop || this.p2.state === 'hurt' || this.p2.state === 'stunned')) this.drawStickman(this.p2);
    this.clones.forEach(cl => this.drawStickman(cl));
    
    this.vfx.forEach(v => {
        let ratio = Math.max(0, safeNum(v.life,1)) / Math.max(1, safeNum(v.maxLife,1)); ctx.globalAlpha = ratio; let vSize = Math.max(0.1, safeNum(v.size, 10));
        
        if (v.type === 'bone') {
            ctx.save(); ctx.translate(safeNum(v.x,0), safeNum(v.y,0)); ctx.rotate(safeNum(v.angle,0));
            ctx.fillStyle = v.color || '#fff'; ctx.fillRect(-12, -3, 24, 6);
            ctx.beginPath(); ctx.arc(-12, -3, 4, 0, Math.PI*2); ctx.arc(-12, 3, 4, 0, Math.PI*2); ctx.arc(12, -3, 4, 0, Math.PI*2); ctx.arc(12, 3, 4, 0, Math.PI*2); ctx.fill();
            ctx.restore();
        }
        else if (v.type === 'bone_wall') {
            let h = vSize * Math.sin((1 - ratio) * Math.PI); 
            ctx.fillStyle = v.color || '#fff'; ctx.fillRect(safeNum(v.x,0) - 6, safeNum(v.y,0) - h, 12, h);
            ctx.beginPath(); ctx.arc(safeNum(v.x,0) - 3, safeNum(v.y,0) - h, 4, 0, Math.PI*2); ctx.arc(safeNum(v.x,0) + 3, safeNum(v.y,0) - h, 4, 0, Math.PI*2); ctx.fill();
        }
        else if (v.type === 'g_blaster') {
            ctx.save(); ctx.translate(safeNum(v.x,0), safeNum(v.y,0)); ctx.rotate(safeNum(v.angle,0) - Math.PI/2); 
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(15, -20); ctx.lineTo(25, 0); ctx.lineTo(10, 25); ctx.lineTo(-10, 25); ctx.lineTo(-25, 0); ctx.fill();
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-8, -5, 5, 0, Math.PI*2); ctx.arc(8, -5, 5, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#0ff'; ctx.beginPath(); ctx.arc(8, -5, 2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=15; ctx.shadowColor='#0ff'; ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(-5, 25); ctx.moveTo(5, 15); ctx.lineTo(5, 25); ctx.stroke();
            ctx.restore();
        }
        else if (v.type === 'particle') { ctx.fillStyle = v.color; ctx.beginPath(); ctx.arc(safeNum(v.x,0), safeNum(v.y,0), vSize * ratio, 0, Math.PI*2); ctx.fill(); }
        else if (v.type === 'ring') { ctx.strokeStyle = v.color; ctx.lineWidth = 3 * ratio; ctx.beginPath(); ctx.arc(safeNum(v.x,0), safeNum(v.y,0), vSize * (1-ratio), 0, Math.PI*2); ctx.stroke(); }
        else if (v.type === 'rock') { ctx.save(); ctx.translate(safeNum(v.x,0), safeNum(v.y,0)); ctx.rotate(safeNum(v.angle,0)); ctx.fillStyle = v.color; ctx.beginPath(); ctx.moveTo(-vSize,-vSize); ctx.lineTo(vSize,-vSize*0.5); ctx.lineTo(vSize*0.8,vSize); ctx.lineTo(-vSize*0.5,vSize); ctx.fill(); ctx.restore(); }
        else if (v.type === 'slash') { ctx.strokeStyle = v.color; ctx.lineWidth = Math.max(0.1, safeNum(v.width,2) * ratio); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(safeNum(v.x,0), safeNum(v.y,0), vSize, safeNum(v.angle,0) - 1.0*ratio, safeNum(v.angle,0) + 1.0*ratio); ctx.stroke(); } 
        else if (v.type === 'impact') { ctx.fillStyle = v.color; ctx.beginPath(); let s = Math.max(0.1, vSize * Math.pow(Math.max(0, 1 - ratio), 0.5) + 5); ctx.moveTo(v.x, v.y - s); ctx.lineTo(v.x + s/4, v.y - s/4); ctx.lineTo(v.x + s, v.y); ctx.lineTo(v.x + s/4, v.y + s/4); ctx.lineTo(v.x, v.y + s); ctx.lineTo(v.x - s/4, v.y + s/4); ctx.lineTo(v.x - s, v.y); ctx.lineTo(v.x - s/4, v.y - s/4); ctx.fill(); } 
        else if (v.type === 'shockwave') { ctx.strokeStyle = v.color; ctx.lineWidth = Math.max(0.1, 4 * ratio); ctx.beginPath(); ctx.arc(safeNum(v.x,0), safeNum(v.y,0), Math.max(0.1, vSize * Math.max(0, 1-ratio)*2 + 10), 0, Math.PI*2); ctx.stroke(); } 
        else if (v.type === 'beam') { ctx.save(); ctx.translate(safeNum(v.x,0), safeNum(v.y,0)); ctx.rotate(safeNum(v.angle,0)); let h = Math.max(0.1, safeNum(v.width, 20) * ratio); ctx.fillStyle = v.color; ctx.fillRect(0, -h/2, vSize, h); ctx.fillStyle = '#fff'; ctx.fillRect(0, -h/4, vSize, h/2); ctx.restore(); }
        else if (v.type === 'hook') { ctx.strokeStyle = v.color; ctx.lineWidth = Math.max(0.1, 6 * ratio); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(safeNum(v.x,0), safeNum(v.y,0)); ctx.lineTo(safeNum(v.x,0) + (safeNum(v.targetX,0) - safeNum(v.x,0))*(1-ratio), safeNum(v.y,0) + (safeNum(v.targetY,0) - safeNum(v.y,0))*(1-ratio)); ctx.stroke(); }
    });
    ctx.globalAlpha = 1;
    for (let t of this.texts) { ctx.fillStyle = t.color; ctx.font = 'bold 24px monospace'; ctx.globalAlpha = Math.max(0, t.life / 40); ctx.fillText(t.text, t.x - 30, t.y); ctx.globalAlpha = 1; }
    ctx.restore(); resetShake();

    if (this.st === 'training') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 200, 75); ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.isInfinite ? '◆ 無限強化学習中 ◆' : '◆ AI TRAINING ◆', 25, 15); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`世代(EPOCH): ${this.simEpoch}`, 10, 35); ctx.fillStyle = '#ff0'; ctx.fillText(`WINS: ${this.simWins}`, 120, 35);
        if (!this.isInfinite) { ctx.fillStyle = '#444'; ctx.fillRect(10, 70, 180, 3); ctx.fillStyle = '#0f0'; ctx.fillRect(10, 70, (this.simEpoch / Math.max(1,this.simMaxEpoch)) * 180, 3); }
        ctx.fillStyle = '#ccc'; ctx.fillText(this.trainingMsg, 10, 55);
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
    let isFloating = (passKey === 'HOVER' || f.styleKey === 'AERO') && !['hurt', 'knockdown', 'stunned'].includes(fst);

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
        else if (fst.startsWith('atk_beam') || fst.startsWith('atk_sonic') || fst.startsWith('atk_parapara') || fst === 'atk_sans_throw' || fst === 'atk_sans_blue_bone' || fst === 'atk_sans_bone' || fst === 'atk_sans_blaster_shoot' || fst === 'atk_ult_all41') { if (sf < 12) { p.hR={x:-15,y:10}; p.hL={x:-15,y:10}; p.h={x:-5,y:0}; p.hip={x:5,y:15}; p.kL.x+=5; p.kR.x-=5; } else { p.hR={x:30,y:0}; p.hL={x:30,y:0}; p.eR={x:15,y:5}; p.eL={x:15,y:5}; p.h={x:10,y:-5}; p.hip={x:-5,y:15}; p.fR.x+=10; p.fL.x-=10; } }
        else if (fst === 'atk_sans_blaster_ride') { 
            p.hL={x:10, y:20}; p.hR={x:-10, y:20}; p.kL={x:15, y:20}; p.kR={x:-15, y:20}; p.fL={x:20, y:30}; p.fR={x:-20, y:30}; p.h.x += 5; 
            if (!isTrail) {
                ctx.save(); ctx.translate(dx, dy + 30); ctx.rotate((safeNum(f.dir, 1) === 1 ? 0 : Math.PI));
                ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-15, -20); ctx.lineTo(15, -20); ctx.lineTo(25, 0); ctx.lineTo(10, 25); ctx.lineTo(-10, 25); ctx.lineTo(-25, 0); ctx.fill();
                ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-8, -5, 5, 0, Math.PI*2); ctx.arc(8, -5, 5, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#0ff'; ctx.beginPath(); ctx.arc(8, -5, 2, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=15; ctx.shadowColor='#0ff'; ctx.fill();
                ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, 15); ctx.lineTo(-5, 25); ctx.moveTo(5, 15); ctx.lineTo(5, 25); ctx.stroke();
                ctx.restore();
            }
        }
        else if (fst === 'atk_telekinesis') { p.hL={x:15,y:-30}; p.hR={x:15,y:-30}; p.eL={x:5,y:-10}; p.eR={x:5,y:-10}; p.h={x:5,y:-5}; p.kL.x+=5; p.kR.x-=5; }
        else if (fst === 'atk_heal' || fst === 'atk_ult_regen') { p.hL={x:0,y:-20}; p.hR={x:0,y:-20}; p.h={x:0,y:-5}; p.hip={x:0,y:20}; p.kL={x:-10,y:30}; p.kR={x:10,y:30}; p.fL={x:-15,y:40}; p.fR={x:15,y:40}; }
        else if (fst === 'atk_warpAtk' || fst === 'atk_counter' || fst === 'atk_sans_warp' || fst === 'atk_ult_stop' || fst === 'atk_ult_clone') { if (sf < 4) { p.hR={x:-20,y:15}; p.h.y+=5; p.hip.y+=5; p.kL.x-=8; p.kR.x+=8; } else { p.hR={x:25,y:-30}; p.h.x+=10; p.fR.x+=15; p.fR.y-=5; p.fL.x-=5; } }
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
    
    if (!isTrail && passKey === 'MAHORAGA' && f.hitHistory) {
        let maxAdapt = 0; for(let k in f.hitHistory) if(safeNum(f.hitHistory[k],0) > maxAdapt) maxAdapt = f.hitHistory[k];
        if (maxAdapt > 0) { ctx.shadowBlur = 0; ctx.strokeStyle = '#ff0'; ctx.lineWidth = 1; let rot = (sf * maxAdapt) * 0.1; ctx.beginPath(); for(let i=0; i<8; i++){ ctx.moveTo(dx, dy-15*bH); ctx.lineTo(dx + Math.cos(rot+i*Math.PI/4)*10, dy-15*bH + Math.sin(rot+i*Math.PI/4)*10); } ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    if (!isTrail && f.funnelTimer > 0) { ctx.fillStyle = cAura; ctx.shadowBlur = 10; ctx.shadowColor = cAura; let ufoY = dy - 30 + Math.sin(Date.now()/100)*5; ctx.fillRect(dx - 10, ufoY, 20, 4); ctx.fillRect(dx - 5, ufoY - 4, 10, 4); ctx.shadowBlur = 0; }
  }
};
