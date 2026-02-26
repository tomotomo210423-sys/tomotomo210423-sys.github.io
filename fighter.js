// === AUTO FIGHTER (Phase 9: ULTIMATE BATTLE INTEGRATION) ===

const PassiveType = { NONE: 'なし', VAMPIRE: '吸血鬼', DESPERATION: '背水の陣', GIANT: '巨人の体', NINJA: '忍' };
const IntroType = { DROP: 'メテオ落下', WARP: '瞬間移動', TAUNT: '挑発' };
const AwakenCondition = { NONE: 'なし', HP_UNDER_20: 'HP20%以下', TIME_60S: '60秒経過' };

const CondType = { FAR: '敵と距離が遠い時', AIR: '敵が空中にいる時', HP_LOW: '自分のHP30%以下', DEFAULT: 'それ以外の基本行動' };
const ActType = { COMBO: 'コンボ始動', BEAM: 'ビーム(遠距離)', SLIDE: 'スライド(突進)', RETREAT: '後退・様子見', GUARD: 'ガード・待機' };
const SkillDict = { jab: 'ジャブ', upper: 'アッパー', smash: 'スマッシュ', meteor: 'メテオ', slide: 'スライド', beam: 'ビーム' };

const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0,
  stageWidth: 800, stageHeight: 500, groundY: 420, scale: 0.65, camX: 0, camY: 0,
  texts: [], vfx: [],
  
  myAI: {
      name: 'MY-ULTIMA',
      body: { width: 1.0, height: 1.0, head: 1.0 },
      color: { body: '#0ff', aura: '#ff0' },
      physics: { weight: 100, centerOfMassY: 0 },
      base: { atk: 1.0, res: 1.0, spd: 1.0 }, // ステータス割り振り用（合計3.0）
      passive: PassiveType.NONE,
      intro: IntroType.WARP,
      awakening: { condition: AwakenCondition.HP_UNDER_20, color: { body: '#000', aura: '#f00' }, passive: PassiveType.DESPERATION },
      gambits: [
          { cond: CondType.HP_LOW, act: ActType.RETREAT }, 
          { cond: CondType.FAR, act: ActType.BEAM },       
          { cond: CondType.AIR, act: ActType.GUARD },      
          { cond: CondType.DEFAULT, act: ActType.COMBO }   
      ],
      comboRoute: ['jab', 'upper', 'meteor'] 
  },

  Skills: {
      jab: {name:'ジャブ', dmg: 15, kb: 2, range: 35, start: 4, act: 10, rec: 15, cd: 15, vx: 4, hitType: 'jab'},
      upper: {name:'アッパー', dmg: 25, kb: 2, range: 40, start: 7, act: 15, rec: 20, cd: 25, vx: 5, hitType: 'upper'},
      smash: {name:'スマッシュ', dmg: 50, kb: 14, range: 45, start: 14, act: 20, rec: 35, cd: 40, vx: 8, hitType: 'smash'},
      meteor: {name:'メテオ', dmg: 60, kb: 18, range: 45, start: 10, act: 15, rec: 30, cd: 40, vx: 6, hitType: 'meteor'},
      slide: {name:'スライド', dmg: 20, kb: 4, range: 45, start: 6, act: 20, rec: 20, cd: 25, vx: 12, hitType: 'slide'}, 
      beam: {name:'ビーム', dmg: 40, kb: 10, range: 250, start: 25, act: 15, rec: 40, cd: 60, vx: -2, hitType: 'beam'},
      counter: {name:'カウンター', dmg: 90, kb: 15, range: 45, start: 4, act: 15, rec: 20, cd: 0, vx: 8, hitType: 'counter'} 
  },

  labSt: 'main', labCur: 0, 

  init() { this.st = 'menu'; this.menuCur = 0; BGM.play('menu'); },

  // ★ バトルセットアップ
  startBattle() {
    this.st = 'intro'; this.timer = 0; this.texts = []; this.vfx = [];
    
    const createFighter = (isP2, data) => ({
      id: isP2 ? 2 : 1, x: isP2 ? 550 : 250, y: this.groundY, dir: isP2 ? -1 : 1, 
      hp: 1000, maxHp: 1000, 
      base: data.base, body: data.body, color: data.color, physics: data.physics,
      passive: data.passive, intro: data.intro, awakening: data.awakening,
      gambits: data.gambits, comboRoute: data.comboRoute,
      
      counterSkill: this.Skills.counter,
      state: 'idle', stateFrame: 0, cd: 0, name: data.name,
      vx: 0, vy: 0, guarding: false, justGuardWindow: 0, trail: [],
      hitCancel: false, combo: 0, comboTimer: 0, comboIndex: 0,
      isAwakened: false
    });
    
    this.p1 = createFighter(false, this.myAI);
    
    // CPU側の設定（強力なボス仕様）
    let cpuAI = {
        name: 'CPU-BOSS',
        body: { width: 1.2, height: 1.2, head: 0.9 }, color: { body: '#500', aura: '#f00' }, physics: { weight: 140, centerOfMassY: 0 },
        base: { atk: 1.2, res: 1.2, spd: 0.6 }, // 鈍重だが高火力
        passive: PassiveType.GIANT, intro: IntroType.DROP,
        awakening: { condition: AwakenCondition.TIME_60S, color: { body: '#000', aura: '#f0f' }, passive: PassiveType.VAMPIRE },
        gambits: [
            { cond: CondType.HP_LOW, act: ActType.BEAM },
            { cond: CondType.FAR, act: ActType.SLIDE },
            { cond: CondType.AIR, act: ActType.COMBO },
            { cond: CondType.DEFAULT, act: ActType.COMBO }
        ],
        comboRoute: ['slide', 'upper', 'meteor']
    };
    this.p2 = createFighter(true, cpuAI);
    
    this.camX = (this.p1.x + this.p2.x) / 2 - (200 / this.scale) / 2; 
    this.camY = this.groundY - (300 / this.scale) / 2;
    BGM.play('action');
  },

  addText(x, y, text, color) { this.texts.push({x, y, text, color, life: 40}); },
  addVFX(type, x, y, color, extra={}) { this.vfx.push({type, x, y, color, life: extra.life||20, maxLife: extra.life||20, ...extra}); },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'menu') {
        if (keysDown.up) { this.menuCur = (this.menuCur - 1 + 2) % 2; playSnd('sel'); }
        if (keysDown.down) { this.menuCur = (this.menuCur + 1) % 2; playSnd('sel'); }
        if (keysDown.a) { playSnd('jmp'); if (this.menuCur === 0) { this.startBattle(); } else { this.st = 'lab_main'; this.labCur = 0; } }
        return;
    }

    if (this.st === 'lab_main') {
        const labItems = ['体型＆カラー設定', 'ステータス配分', 'パッシブ＆覚醒', 'ガンビット(思考AI)', 'コンボルート', '戻る'];
        if (keysDown.up) { this.labCur = (this.labCur - 1 + labItems.length) % labItems.length; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % labItems.length; playSnd('sel'); }
        if (keysDown.a) {
            playSnd('hit');
            if (this.labCur === 0) { this.st = 'lab_body'; this.labCur = 0; }
            else if (this.labCur === 1) { this.st = 'lab_stats'; this.labCur = 0; }
            else if (this.labCur === 2) { this.st = 'lab_awaken'; this.labCur = 0; }
            else if (this.labCur === 3) { this.st = 'lab_gambit'; this.labCur = 0; }
            else if (this.labCur === 4) { this.st = 'lab_combo'; this.labCur = 0; }
            else { this.st = 'menu'; this.menuCur = 0; }
        }
        if (keysDown.b) { this.st = 'menu'; playSnd('hit'); } return;
    }

    // --- UI: ステータス配分 ---
    if (this.st === 'lab_stats') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; playSnd('sel'); }
        if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 1; playSnd('hit'); return; }

        let valChange = 0; if (keysDown.left) valChange = -0.1; if (keysDown.right) valChange = 0.1;
        if (valChange !== 0) {
            let total = this.myAI.base.atk + this.myAI.base.res + this.myAI.base.spd;
            let current = this.labCur === 0 ? this.myAI.base.atk : this.labCur === 1 ? this.myAI.base.res : this.myAI.base.spd;
            let next = Math.max(0.5, Math.min(2.0, current + valChange));
            if (total - current + next <= 3.01) { // 3.0ポイント制
                if (this.labCur === 0) this.myAI.base.atk = next;
                if (this.labCur === 1) this.myAI.base.res = next;
                if (this.labCur === 2) this.myAI.base.spd = next;
                playSnd('sel');
            } else { playSnd('hit'); } // コストオーバー
        }
        return;
    }

    if (this.st === 'lab_body') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; playSnd('sel'); }
        if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 0; playSnd('hit'); return; }
        let valChange = 0; if (keys.left) valChange = -0.05; if (keys.right) valChange = 0.05;
        if (valChange !== 0) {
            if (this.labCur === 0) this.myAI.body.width = Math.max(0.5, Math.min(2.0, this.myAI.body.width + valChange));
            if (this.labCur === 1) this.myAI.body.height = Math.max(0.5, Math.min(2.0, this.myAI.body.height + valChange));
            if (this.labCur === 2) this.myAI.physics.weight = Math.max(50, Math.min(200, this.myAI.physics.weight + valChange * 100));
            if (this.labCur === 3 && keysDown.right) this.myAI.color.body = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0');
        } return;
    }

    if (this.st === 'lab_awaken') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; playSnd('sel'); }
        if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 2; playSnd('hit'); return; }
        if (keysDown.right || keysDown.left) {
            playSnd('sel'); let dir = keysDown.right ? 1 : -1;
            if (this.labCur === 0) { let keys = Object.keys(PassiveType); let idx = keys.indexOf(Object.keys(PassiveType).find(k => PassiveType[k] === this.myAI.passive)); this.myAI.passive = PassiveType[keys[(idx + dir + keys.length) % keys.length]]; }
            else if (this.labCur === 1) { let keys = Object.keys(AwakenCondition); let idx = keys.indexOf(Object.keys(AwakenCondition).find(k => AwakenCondition[k] === this.myAI.awakening.condition)); this.myAI.awakening.condition = AwakenCondition[keys[(idx + dir + keys.length) % keys.length]]; }
            else if (this.labCur === 2) { let keys = Object.keys(IntroType); let idx = keys.indexOf(Object.keys(IntroType).find(k => IntroType[k] === this.myAI.intro)); this.myAI.intro = IntroType[keys[(idx + dir + keys.length) % keys.length]]; }
        } return;
    }

    if (this.st === 'lab_gambit') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; playSnd('sel'); }
        if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 3; playSnd('hit'); return; }
        if (keysDown.right || keysDown.left) {
            playSnd('sel'); let dir = keysDown.right ? 1 : -1; let keys = Object.keys(ActType); 
            let idx = keys.indexOf(Object.keys(ActType).find(k => ActType[k] === this.myAI.gambits[this.labCur].act));
            this.myAI.gambits[this.labCur].act = ActType[keys[(idx + dir + keys.length) % keys.length]];
        } return;
    }

    if (this.st === 'lab_combo') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; playSnd('sel'); }
        if (keysDown.b || keysDown.a) { this.st = 'lab_main'; this.labCur = 4; playSnd('hit'); return; }
        if (keysDown.right || keysDown.left) {
            playSnd('sel'); let dir = keysDown.right ? 1 : -1; let keys = Object.keys(SkillDict); 
            let idx = keys.indexOf(this.myAI.comboRoute[this.labCur]);
            this.myAI.comboRoute[this.labCur] = keys[(idx + dir + keys.length) % keys.length];
        } return;
    }

    // --- バトル進行 ---
    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) { this.st = 'menu'; playSnd('sel'); } return; }

    this.timer++; // バトルの経過時間
    let dist = Math.abs(this.p1.x - this.p2.x);
    if (dist < 15) {
        if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; }
        else { let push = (15 - dist) / 2; this.p1.x += (this.p1.x < this.p2.x) ? -push : push; this.p2.x += (this.p2.x < this.p1.x) ? -push : push; }
    }

    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    
    [this.p1, this.p2].forEach(f => {
        if (f.comboTimer > 0) f.comboTimer--;
        if (f.comboTimer <= 0 && f.state !== 'hurt' && f.state !== 'stunned') { let opp = f.id === 1 ? this.p2 : this.p1; opp.combo = 0; }
    });

    for (let i = this.texts.length - 1; i >= 0; i--) { this.texts[i].life--; this.texts[i].y -= 0.5; if (this.texts[i].life <= 0) this.texts.splice(i, 1); }
    for (let i = this.vfx.length - 1; i >= 0; i--) { let v = this.vfx[i]; v.life--; if (v.type === 'slash') { v.x += v.vx || 0; v.y += v.vy || 0; } if (v.life <= 0) this.vfx.splice(i, 1); }

    let viewW = 200 / this.scale; let viewH = 300 / this.scale;
    let targetX = (this.p1.x + this.p2.x) / 2 - viewW / 2; let targetY = (this.p1.y + this.p2.y) / 2 - viewH * 0.6; 
    targetX = Math.max(0, Math.min(this.stageWidth - viewW, targetX)); targetY = Math.max(0, Math.min(this.stageHeight - viewH, targetY));
    this.camX += (targetX - this.camX) * 0.1; this.camY += (targetY - this.camY) * 0.1;

    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  // ★ AIとシステムが完全に統合されたバトルロジック
  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.base.spd);

    // ★ 覚醒システムのチェック
    if (!f.isAwakened) {
        let awaken = false;
        if (f.awakening.condition === AwakenCondition.HP_UNDER_20 && f.hp <= f.maxHp * 0.2) awaken = true;
        if (f.awakening.condition === AwakenCondition.TIME_60S && this.timer > 3600) awaken = true;
        
        if (awaken) {
            f.isAwakened = true; f.color = f.awakening.color; f.passive = f.awakening.passive;
            f.hp = Math.min(f.maxHp, f.hp + 300); // 覚醒回復
            playSnd('combo'); screenShake(20); if(typeof hitStop !== 'undefined') hitStop(30);
            this.addVFX('shockwave', f.x, f.y, f.color.aura, {size: 150, life: 40});
            this.addText(f.x, f.y - 60, "AWAKENING!!", f.color.aura);
            f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; return;
        }
    }

    f.x += f.vx; f.y += f.vy; f.vx *= 0.85; 
    if (f.y < this.groundY) { f.vy += 0.6 + (f.physics.weight - 100)*0.005; } else { f.y = this.groundY; f.vy = 0; } // 重量が落下速度に影響
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4 || f.state.startsWith('atk_')) {
        f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state, frame: f.stateFrame}); if(f.trail.length > 5) f.trail.pop();
    } else if (f.trail.length > 0) { f.trail.pop(); }

    if (f.state === 'idle' || f.state === 'move') { f.dir = (opp.x > f.x) ? 1 : -1; }

    if (f.state === 'hurt') { if (f.stateFrame > 25) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }
    if (f.state === 'guard') { if (f.justGuardWindow > 0) f.justGuardWindow--; if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } return; }
    if (f.state === 'stunned') { if (f.stateFrame > 60) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }

    let isAtk = f.state.startsWith('atk_');
    let sName = isAtk ? f.state.split('_')[1] : '';
    let skill = isAtk ? (sName === 'counter' ? f.counterSkill : this.Skills[sName]) : null;
    
    if (isAtk && skill) {
         if (f.stateFrame === Math.floor(skill.start / f.base.spd)) { // SPDが技の発生も早くする
             this.createHitbox(f, skill, opp); 
             if (sName === 'beam') {
                 this.addVFX('beam', f.x + 20*f.dir, f.y - 15 * f.body.height, f.color.body, {size: skill.range, dir: f.dir, life: 15}); screenShake(6);
             } else {
                 let angle = f.dir === 1 ? 0 : Math.PI;
                 if (sName === 'upper') angle -= (Math.PI/4) * f.dir;
                 if (sName === 'meteor') angle += (Math.PI/4) * f.dir;
                 if (sName !== 'jab') this.addVFX('slash', f.x + 20*f.dir, f.y - 20 * f.body.height, f.color.body, {size: skill.range * f.body.width, angle: angle, width: 10, vx: f.vx*0.5, vy: f.vy*0.5});
             }
         }
         if (f.stateFrame > ((skill.start + skill.rec) / f.base.spd)) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; }
    }
    
    let canCancel = isAtk && f.hitCancel && f.stateFrame > (skill.start + 5) / f.base.spd;

    // --- ★ ガンビット ＆ コンボツリーの評価 ---
    if ((f.state === 'idle' && f.cd <= 0) || canCancel) {
        let d = Math.abs(f.x - opp.x);
        let isAir = f.y < this.groundY - 10;
        let oppIsAir = opp.y < this.groundY - 10;
        let hpRatio = f.hp / f.maxHp;

        let chosenAct = ActType.COMBO; 
        
        // パッシブ効果の取得
        let ninjaSpd = f.passive === PassiveType.NINJA ? 1.5 : 1.0;

        if (canCancel) {
            if (f.comboIndex < f.comboRoute.length - 1) chosenAct = ActType.COMBO;
            else f.hitCancel = false; 
        } else {
            f.comboIndex = 0; 
            for (let g of f.gambits) {
                let match = false;
                if (g.cond === CondType.HP_LOW && hpRatio <= 0.3) match = true;
                else if (g.cond === CondType.FAR && d > 120) match = true;
                else if (g.cond === CondType.AIR && oppIsAir) match = true;
                else if (g.cond === CondType.DEFAULT) match = true;
                if (match) { chosenAct = g.act; break; }
            }
        }

        // 行動の実行
        if (f.state === 'idle' || canCancel) {
            if (chosenAct === ActType.RETREAT && !canCancel) {
                f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 8 * ninjaSpd; f.cd = 15;
            } else if (chosenAct === ActType.GUARD && !canCancel) {
                f.state = 'guard'; f.stateFrame = 0; f.guarding = true; f.justGuardWindow = 10;
            } else if (chosenAct === ActType.BEAM || chosenAct === ActType.SLIDE) {
                let sn = chosenAct === ActType.BEAM ? 'beam' : 'slide'; let sData = this.Skills[sn];
                f.state = 'atk_' + sn; f.stateFrame = 0; f.vx = f.dir * sData.vx; f.cd = sData.cd; f.hitCancel = false;
            } else if (chosenAct === ActType.COMBO) {
                let sn = f.comboRoute[f.comboIndex]; let sData = this.Skills[sn];
                // コンボが届かない距離なら自動で近づく
                if (!canCancel && d > (sData.range * f.body.width) + 20 && !isAir) {
                    f.state = 'move'; f.stateFrame = 0; f.vx = f.dir * 6 * ninjaSpd; f.cd = 0;
                } else {
                    f.state = 'atk_' + sn; f.stateFrame = 0; f.vx = f.dir * sData.vx; f.cd = sData.cd; f.hitCancel = false;
                    if (canCancel) f.comboIndex++;
                }
            }
        }
    }
    if (f.state === 'move' && Math.abs(f.vx) < 0.5 && f.y >= this.groundY) { f.state = 'idle'; f.stateFrame = 0; }
  },

  createHitbox(attacker, skill, victim) {
    let vDist = Math.abs(victim.x - attacker.x); 
    let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 
    let yDist = Math.abs(victim.y - attacker.y); 

    // 体型スケールによるリーチ拡張
    let actualRange = skill.range * attacker.body.width;

    if (inFront && vDist <= actualRange + 15 && yDist < 60) {
       
       if (victim.guarding && victim.justGuardWindow > 0) {
           playSnd('sel'); screenShake(8); if(typeof hitStop !== 'undefined') hitStop(10);
           this.addVFX('impact', victim.x, victim.y-20, '#0ff', {size: 50}); this.addText(victim.x, victim.y - 50, "PARRY!", "#0ff");
           attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 2; attacker.vy = -3; attacker.hitCancel = false;
           victim.guarding = false; victim.justGuardWindow = 0; victim.state = 'idle'; victim.cd = 0; return; 
       }

       if (victim.state === 'hurt' || victim.state === 'stunned' || victim.state === 'idle' || victim.state.startsWith('atk_') || victim.state === 'move') {
           
           // ★ ATKとパッシブスキルによるダメージ計算
           let damage = skill.dmg * attacker.base.atk;
           if (attacker.passive === PassiveType.DESPERATION && (attacker.hp / attacker.maxHp) <= 0.3) damage *= 1.5;
           if (victim.passive === PassiveType.GIANT) damage *= 0.8;
           // 重いほどダメージ軽減
           damage = Math.max(1, damage - ((victim.physics.weight - 100) * 0.1));

           // ★ 重量とATKによるノックバック計算
           let kbForce = skill.kb * attacker.base.atk * (100 / victim.physics.weight);

           if (victim.guarding) {
               victim.hp -= damage * 0.2; playSnd('sel'); screenShake(2); victim.vx = attacker.dir * kbForce * 0.3; 
               this.addVFX('impact', victim.x, victim.y-15, '#888', {size: 15, life: 10}); return;
           }

           victim.hp -= damage; 
           
           // ★ 吸血鬼パッシブの回復
           if (attacker.passive === PassiveType.VAMPIRE) attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage * 0.2);

           victim.state = 'hurt'; victim.stateFrame = 0; victim.comboTimer = 60; 
           attacker.hitCancel = true; attacker.combo++;

           if (victim.y < this.groundY - 10) victim.vy = -4; 
           if (skill.hitType === 'upper' || skill.hitType === 'counter') victim.vy = -16 * (100 / victim.physics.weight);
           else if (skill.hitType === 'meteor') { victim.vy = 20; kbForce *= 0.5; }
           else if (skill.hitType === 'slide') victim.vy = -8 * (100 / victim.physics.weight);
           else if (skill.kb > 10) victim.vy = -6 - (Math.random()*2); 
           
           victim.vx = attacker.dir * kbForce;
           let hx = attacker.x + (vDist/2)*attacker.dir; let hy = victim.y - 15;
           
           if (skill.hitType === 'jab') {
              playSnd('hit'); screenShake(4); if(typeof hitStop !== 'undefined') hitStop(3); this.addVFX('impact', hx, hy, '#fff', {size: 25});
           } else {
              playSnd('combo'); screenShake(12); if(typeof hitStop !== 'undefined') hitStop(8); 
              this.addVFX('impact', hx, hy, attacker.color.aura, {size: 50});
              this.addVFX('slash', hx, hy, '#fff', {size: 40, angle: Math.random()*Math.PI*2, width: 4}); 
           }
       }
    }
  },

  // 描画処理（体型スケール適用）
  drawStickman(f, alpha = 1, isTrail = false) {
    let c = f.isAwakened ? f.awakening.color : f.color;
    ctx.strokeStyle = isTrail ? c.aura : '#fff'; ctx.lineWidth = (isTrail ? 2 : 2.5) / Math.max(f.body.width, f.body.height); 
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = alpha;
    
    let p = { h:{x:0,y:-12}, n:{x:0,y:0}, hip:{x:0,y:15}, sL:{x:-4,y:2}, sR:{x:4,y:2}, eL:{x:-8,y:10}, eR:{x:8,y:10}, hL:{x:-12,y:20}, hR:{x:12,y:20}, kL:{x:-4,y:25}, kR:{x:4,y:25}, fL:{x:-6,y:40}, fR:{x:6,y:40} };
    let sf = isTrail ? f.frame : f.stateFrame; 

    if (f.state === 'idle') { let t = Date.now()/200; p.h.y+=Math.sin(t); p.n.y+=Math.sin(t); p.hL.y+=Math.sin(t+1)*2; p.hR.y+=Math.sin(t+1)*2; p.hip.y+=2; p.kL.x-=2; p.kR.x+=2; p.kL.y-=2; p.kR.y-=2; } 
    else if (f.state === 'move') { 
        if (f.y < this.groundY - 5) { p.hL.y-=20; p.hR.y-=20; p.eL.y-=10; p.eR.y-=10; p.kL.y-=15; p.kR.y-=5; p.fL.y-=15; p.h.x+=5; } 
        else { let run = Math.sin(sf * 0.6) * 15; p.hL.x=-run; p.hR.x=run; p.eL.x=-run/2; p.eR.x=run/2; p.fL.x=run; p.fR.x=-run; p.kL.x=run/2; p.kR.x=-run/2; p.h.x+=5; p.n.x+=5; p.hip.x+=3; }
    }
    else if (f.state === 'atk_jab') { if (sf < 4) { p.hR={x:-5,y:10}; p.eR={x:0,y:15}; p.h.x-=2; } else if (sf < 12) { p.hR={x:35,y:0}; p.eR={x:15,y:5}; p.sR.x+=5; p.h.x+=5; p.fR.x+=10; } }
    else if (f.state === 'atk_smash') { if (sf < 14) { p.hR={x:-15,y:-20}; p.eR={x:-5,y:-10}; p.h.x-=5; p.hip.x-=5; p.kL.x-=5; } else { p.hR={x:40,y:15}; p.eR={x:20,y:10}; p.h.x+=12; p.hip.x+=8; p.fL.x-=15; p.fR.x+=15; p.kR.x+=10; p.kR.y+=5; } }
    else if (f.state === 'atk_upper') { if (sf < 7) { p.hR={x:-5,y:25}; p.eR={x:5,y:20}; p.hip.y+=5; p.h.y+=5; p.kL.x-=5; p.kR.x+=5; } else { p.hR={x:20,y:-35}; p.eR={x:10,y:-15}; p.h.y-=8; p.h.x+=5; p.fL.y-=5; p.fR.y-=5; } }
    else if (f.state === 'atk_meteor') { if (sf < 10) { p.hL={x:0,y:-25}; p.hR={x:0,y:-25}; p.eL={x:-10,y:-15}; p.eR={x:10,y:-15}; p.fL.y-=10; p.fR.y-=10; p.kL.y-=10; p.kR.y-=10; } else { p.hL={x:30,y:30}; p.hR={x:30,y:30}; p.eL={x:15,y:15}; p.eR={x:15,y:15}; p.h.x+=10; p.h.y+=5; p.hip.y+=5; p.kL.x-=5; } }
    else if (f.state === 'atk_counter') { if (sf < 4) { p.hR={x:-20,y:15}; p.h.y+=5; p.hip.y+=5; p.kL.x-=8; p.kR.x+=8; } else { p.hR={x:25,y:-30}; p.h.x+=10; p.fR.x+=15; p.fR.y-=5; p.fL.x-=5; } }
    else if (f.state === 'atk_slide') { if (sf < 6) { p.h={x:-5,y:5}; p.hip={x:0,y:15}; p.kL.x-=10; p.kL.y+=5; p.kR.x+=10; p.kR.y+=5; } else { p.h={x:15,y:10}; p.n={x:10,y:15}; p.hip={x:-5,y:25}; p.hR={x:20,y:25}; p.hL={x:5,y:25}; p.eR={x:15,y:20}; p.eL={x:0,y:20}; p.fR={x:35,y:35}; p.kR={x:15,y:30}; p.fL={x:-25,y:35}; p.kL={x:-15,y:30}; } }
    else if (f.state === 'atk_beam') { if (sf < 20) { p.hR={x:-15,y:10}; p.hL={x:-15,y:10}; p.eR={x:-5,y:15}; p.eL={x:-5,y:15}; p.h={x:-5,y:0}; p.hip={x:5,y:15}; p.kL.x+=5; p.kR.x-=5; let t = Date.now()/50; p.h.x+=Math.sin(t); p.h.y+=Math.cos(t); } else { p.hR={x:30,y:0}; p.hL={x:30,y:0}; p.eR={x:15,y:5}; p.eL={x:15,y:5}; p.h={x:10,y:-5}; p.hip={x:-5,y:15}; p.fR.x+=10; p.fL.x-=10; } }
    else if (f.state === 'hurt') { p.h={x:-15,y:-5}; p.hip={x:5,y:10}; p.sL={x:-10,y:5}; p.sR={x:-5,y:5}; p.eL={x:-15,y:15}; p.eR={x:-5,y:15}; p.hL={x:-20,y:25}; p.hR={x:-10,y:25}; p.fL={x:15,y:30}; p.fR={x:-5,y:35}; p.kL={x:20,y:20}; }
    else if (f.state === 'stunned') { p.h={x:-10,y:5}; p.hip={x:0,y:15}; p.hL={x:-5,y:30}; p.hR={x:5,y:30}; p.kL={x:10,y:30}; p.fL={x:15,y:40}; } 
    else if (f.state === 'guard') { p.hL={x:10,y:-5}; p.hR={x:10,y:5}; p.eL={x:5,y:5}; p.eR={x:5,y:10}; p.h.y+=3; p.hip.y+=5; p.kL.x-=5; p.kR.x+=5; if(!isTrail && f.justGuardWindow > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0ff'; ctx.strokeStyle = '#0ff'; } }

    let dx = f.x; let dy = f.y - 20 * f.body.height;
    if (f.state === 'stunned' && !isTrail) { dx += (Math.random()-0.5)*6; dy += (Math.random()-0.5)*6; ctx.strokeStyle = '#888'; }

    ctx.save(); ctx.translate(dx, dy); 
    ctx.scale(f.body.width, f.body.height); // ★ 骨格スケール適用
    if (f.dir === -1) ctx.scale(-1, 1);
    if (!isTrail && (f.state.startsWith('atk_') || f.state === 'move' || f.isAwakened)) { ctx.shadowBlur = f.isAwakened ? 20 : 12; ctx.shadowColor = c.aura; }

    ctx.beginPath(); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.hip.x, p.hip.y); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sL.x, p.sL.y); ctx.lineTo(p.eL.x, p.eL.y); ctx.lineTo(p.hL.x, p.hL.y); ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sR.x, p.sR.y); ctx.lineTo(p.eR.x, p.eR.y); ctx.lineTo(p.hR.x, p.hR.y); ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kL.x, p.kL.y); ctx.lineTo(p.fL.x, p.fL.y); ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kR.x, p.kR.y); ctx.lineTo(p.fR.x, p.fR.y); ctx.stroke();
    
    ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(p.h.x, p.h.y, 6 * f.body.head, 0, Math.PI * 2); ctx.fillStyle = isTrail ? c.aura : c.body; ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  },

  draw() {
    if (this.st === 'menu' || this.st.startsWith('lab_')) {
        const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#001'); grad.addColorStop(1, '#003');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('ULTIMATE AI LAB', 25, 50);
            ctx.fillStyle = this.menuCur === 0 ? '#ff0' : '#fff'; ctx.font = '12px monospace'; ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'BATTLE START', 40, 150);
            ctx.fillStyle = this.menuCur === 1 ? '#ff0' : '#fff'; ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'AI CUSTOMIZE', 40, 180);
        }
        else {
            ctx.fillStyle = '#112'; ctx.fillRect(10, 10, 180, 110); ctx.strokeStyle = '#335'; ctx.strokeRect(10, 10, 180, 110);
            ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('NORMAL', 40, 25); ctx.fillText('AWAKENED', 130, 25);
            // プレビュー用に描画
            let prevF = { x: 0, y: 0, dir: 1, state: 'idle', stateFrame: 0, body: this.myAI.body, color: this.myAI.color, awakening: this.myAI.awakening, isAwakened: false };
            ctx.save(); ctx.translate(50, 90); this.drawStickman(prevF); ctx.restore();
            prevF.isAwakened = true; ctx.save(); ctx.translate(145, 90); this.drawStickman(prevF); ctx.restore();

            ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace';
            
            if (this.st === 'lab_main') {
                ctx.fillText('【CUSTOMIZE MENU】', 30, 140); ctx.font = '10px monospace';
                const items = ['体型＆カラー設定', 'ステータス配分', 'パッシブ＆覚醒', 'ガンビット(思考AI)', 'コンボルート', '戻る'];
                for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 155 + i * 20); }
            }
            else if (this.st === 'lab_stats') { // ★ ステータス配分UI
                ctx.fillText('【STATUS POINT】', 40, 140); ctx.font = '10px monospace';
                let pts = (3.0 - (this.myAI.base.atk + this.myAI.base.res + this.myAI.base.spd)).toFixed(1);
                ctx.fillStyle = '#88f'; ctx.fillText(`残りポイント: ${pts}`, 40, 155);
                const items = [ `攻撃力(ATK) : ${this.myAI.base.atk.toFixed(1)}`, `耐久力(RES) : ${this.myAI.base.res.toFixed(1)}`, `素早さ(SPD) : ${this.myAI.base.spd.toFixed(1)}` ];
                for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 180 + i * 25); }
                ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右で増減 (上限あり) ▶', 30, 280);
            }
            else if (this.st === 'lab_body') {
                ctx.fillText('【BODY & PHYSICS】', 30, 140); ctx.font = '10px monospace';
                const items = [ `横幅(W) : ${this.myAI.body.width.toFixed(2)}`, `縦幅(H) : ${this.myAI.body.height.toFixed(2)}`, `重量(WT): ${Math.floor(this.myAI.physics.weight)}kg`, `ボディ色: [CHANGE]` ];
                for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 165 + i * 25); }
                ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右キーで調整 ▶', 45, 280);
            }
            else if (this.st === 'lab_awaken') {
                ctx.fillText('【SKILL & AWAKEN】', 30, 140); ctx.font = '10px monospace';
                const items = [ `常時 : ${this.myAI.passive}`, `条件 : ${this.myAI.awakening.condition}`, `登場 : ${this.myAI.intro}` ];
                for(let i=0; i<items.length; i++) { ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 10, 170 + i * 30); }
                ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右キーで変更 ▶', 45, 280);
            }
            else if (this.st === 'lab_gambit') {
                ctx.fillText('【GAMBIT AI SETTING】', 20, 140); ctx.font = '9px monospace';
                for(let i=0; i<4; i++) {
                    ctx.fillStyle = this.labCur === i ? '#ff0' : '#888'; ctx.fillText(`優先度${i+1}: ${this.myAI.gambits[i].cond}`, 10, 160 + i * 30);
                    ctx.fillStyle = this.labCur === i ? '#fff' : '#aaa'; ctx.fillText(` └ 行動: ◀ ${this.myAI.gambits[i].act.padEnd(8, ' ')} ▶`, 10, 172 + i * 30);
                }
                ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右で行動を変更 ▶', 45, 285);
            }
            else if (this.st === 'lab_combo') {
                ctx.fillText('【COMBO ROUTE】', 40, 140); ctx.font = '10px monospace'; ctx.fillStyle = '#88f'; ctx.fillText('「コンボ始動」時の連携', 25, 155);
                for(let i=0; i<3; i++) {
                    ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff'; let skillName = SkillDict[this.myAI.comboRoute[i]];
                    ctx.fillText(`HIT ${i+1}: ◀ ${skillName.padEnd(6,' ')} ▶`, 30, 185 + i * 35);
                    if (i < 2) { ctx.fillStyle = '#666'; ctx.fillText('  ↓ Cancel', 60, 205 + i * 35); }
                }
                ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右で技を変更 ▶', 45, 285);
            }
        }
        return;
    }

    // --- バトル描画 ---
    let isHitStop = typeof hitStopTimer !== 'undefined' && hitStopTimer > 3;
    const grad = ctx.createLinearGradient(0, 0, 0, 300); 
    if (isHitStop) { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); } else { grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    applyShake();
    ctx.save(); ctx.scale(this.scale, this.scale); ctx.translate(-this.camX, -this.camY);

    ctx.strokeStyle = isHitStop ? '#000' : '#445'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(this.stageWidth, this.groundY); ctx.stroke();
    for(let i=0; i<this.stageWidth; i+=40) { ctx.beginPath(); ctx.moveTo(i, this.groundY); ctx.lineTo(i - 30, this.stageHeight); ctx.stroke(); }
    for(let i=0; i<=this.stageHeight; i+=60) { ctx.strokeStyle = isHitStop ? 'rgba(0,0,0,0.1)' : 'rgba(100,255,100,0.05)'; ctx.strokeRect(0, i, this.stageWidth, 1); }
    for(let i=0; i<=this.stageWidth; i+=60) { ctx.strokeRect(i, 0, 1, this.stageHeight); }

    [this.p1, this.p2].forEach(f => {
        for(let i=0; i<f.trail.length; i++) {
            let tr = f.trail[i]; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state, frame: tr.frame};
            this.drawStickman(tempF, 0.4 - (i*0.08), true);
        }
    });

    if(!isHitStop || this.p1.state === 'hurt' || this.p1.state === 'stunned') this.drawStickman(this.p1);
    if(!isHitStop || this.p2.state === 'hurt' || this.p2.state === 'stunned') this.drawStickman(this.p2);
    
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

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 32); 
    ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 80, 8); ctx.fillRect(110, 5, 80, 8);
    ctx.fillStyle = this.p1.isAwakened ? this.p1.color.aura : this.p1.color.body; ctx.fillRect(10, 5, Math.max(0, this.p1.hp/this.p1.maxHp)*80, 8);
    ctx.fillStyle = this.p2.isAwakened ? this.p2.color.aura : this.p2.color.body; let p2HpW = Math.max(0, this.p2.hp/this.p2.maxHp)*80; ctx.fillRect(190 - p2HpW, 5, p2HpW, 8);

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText(this.p1.name, 10, 25); ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5.5), 25);
    ctx.fillStyle = '#888'; ctx.font = '10px monospace';
    let min = Math.floor(this.timer / 60); let sec = Math.floor((this.timer % 60) * 1.66); ctx.fillText(`${min}:${sec.toString().padStart(2,'0')}`, 85, 12);
    
    if (this.p1.combo > 1) { ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p1.combo + ' HITS!', 10, 45); }
    if (this.p2.combo > 1) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p2.combo + ' HITS!', 140, 45); }

    if (this.st === 'intro') { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 130, 200, 40); ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('GET READY...', 50, 155); } 
    else if (this.st === 'result') { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 120, 200, 60); ctx.fillStyle = '#f0f'; ctx.font = 'bold 18px monospace'; let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name; ctx.fillText(winner + ' WIN!', 100 - (winner.length*6), 145); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('Press (A) to Menu', 45, 165); }
  }
};
