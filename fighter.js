// === AUTO FIGHTER (Phase 6: AI LABORATORY & QUIZ) ===
const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0,
  p1: null, p2: null,
  stageWidth: 800, stageHeight: 500, groundY: 420,
  scale: 0.65, camX: 0, camY: 0,
  texts: [], vfx: [],
  
  // ★ 自分専用のAIデータ（アンケートで変動）
  myAI: {
      name: 'MY-AI',
      hp: 1000, maxHp: 1000, atk: 1.0, res: 1.0, spd: 1.0,
      personality: '未設定',
      // 隠しAIパラメータ（0.0 〜 1.0）
      aggro: 0.5, guard: 0.2, dodge: 0.2, prefRange: 40,
      skills: [] // スキルは後でセット
  },

  // ★ アンケートのデータ
  quizCur: 0, quizAns: 0,
  quizData: [
      {
          q: "Q1. 相手が大きな隙を見せた！ どうする？",
          a: [
              { text: "最大の技を全力で叩き込む！", eff: { aggro: 0.3, dodge: -0.1, prefRange: -10 } },
              { text: "罠かもしれない。警戒して近づく", eff: { guard: 0.2, aggro: -0.1, prefRange: 10 } },
              { text: "あえて煽って、さらに隙を誘う", eff: { dodge: 0.3, guard: -0.1, prefRange: 20 } }
          ]
      },
      {
          q: "Q2. 相手の猛攻！ あなたの防御スタイルは？",
          a: [
              { text: "攻撃こそ最大の防御。殴り返す", eff: { aggro: 0.3, guard: -0.2 } },
              { text: "ギリギリで見切る（パリィ狙い）", eff: { guard: 0.4, dodge: -0.1 } },
              { text: "バックステップで華麗に躱す", eff: { dodge: 0.4, guard: -0.1 } }
          ]
      },
      {
          q: "Q3. 戦いにおいて一番美しいと思うものは？",
          a: [
              { text: "「圧倒的な暴力（パワー）」", eff: { atk: 1.2, spd: 0.8, aggro: 0.2 } },
              { text: "「手数の多さ（スピード）」", eff: { atk: 0.8, spd: 1.2, dodge: 0.2 } },
              { text: "「後の先（カウンター）」", eff: { atk: 1.0, spd: 1.0, guard: 0.3, prefRange: 10 } }
          ]
      }
  ],
  
  Skills: {
      jab: {name:'ジャブ', dmg: 15, kb: 2, range: 35, start: 4, act: 10, rec: 15, cd: 15, vx: 3, hitType: 'jab'},
      upper: {name:'アッパー', dmg: 25, kb: 2, range: 40, start: 7, act: 15, rec: 20, cd: 25, vx: 5, hitType: 'upper'},
      smash: {name:'スマッシュ', dmg: 50, kb: 14, range: 45, start: 14, act: 20, rec: 35, cd: 40, vx: 8, hitType: 'smash'},
      meteor: {name:'メテオ', dmg: 60, kb: 18, range: 45, start: 10, act: 15, rec: 30, cd: 40, vx: 6, hitType: 'meteor'},
      counter: {name:'カウンター', dmg: 90, kb: 15, range: 45, start: 4, act: 15, rec: 20, cd: 0, vx: 8, hitType: 'counter'}
  },

  init() {
    this.st = 'menu'; this.menuCur = 0;
    BGM.play('menu');
  },

  startBattle() {
    this.st = 'intro'; this.timer = 0;
    this.texts = []; this.vfx = [];
    
    // myAIをベースにP1を作成
    this.myAI.skills = [this.Skills.jab, this.Skills.smash, this.Skills.upper, this.Skills.meteor]; // ひとまず全技装備
    
    const createFighter = (isP2, baseData) => ({
      id: isP2 ? 2 : 1,
      x: isP2 ? 500 : 300, y: this.groundY, 
      dir: isP2 ? -1 : 1, 
      hp: baseData.hp, maxHp: baseData.maxHp,
      atk: baseData.atk, res: baseData.res, spd: baseData.spd, 
      
      // ★ アンケートで決まった詳細パラメータを引き継ぎ
      aggro: baseData.aggro || 0.5, 
      guardRate: baseData.guard || 0.2, 
      dodgeRate: baseData.dodge || 0.2, 
      prefRange: baseData.prefRange || 40,
      
      personality: baseData.personality,
      skills: baseData.skills,
      counterSkill: this.Skills.counter,
      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', 
      name: isP2 ? 'CPU-TEST' : baseData.name,
      vx: 0, vy: 0, guarding: false, justGuardWindow: 0, trail: [], regenTimer: 0,
      hitCancel: false, combo: 0, comboTimer: 0
    });
    
    this.p1 = createFighter(false, this.myAI);
    
    // P2はテスト用の標準的な敵
    let enemyData = { hp:1000, maxHp:1000, atk:1.0, res:1.0, spd:1.0, aggro:0.6, guard:0.1, dodge:0.1, prefRange:35, personality:'汎用型', skills:this.myAI.skills };
    this.p2 = createFighter(true, enemyData);
    
    this.camX = (this.p1.x + this.p2.x) / 2 - (200 / this.scale) / 2;
    this.camY = this.groundY - (300 / this.scale) / 2;
    BGM.play('action');
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    // --- メニュー画面 ---
    if (this.st === 'menu') {
        if (keysDown.up || keysDown.down) { this.menuCur = this.menuCur === 0 ? 1 : 0; playSnd('sel'); }
        if (keysDown.a) {
            playSnd('jmp');
            if (this.menuCur === 0) { this.startBattle(); }
            else { this.st = 'quiz'; this.quizCur = 0; this.quizAns = 0; }
        }
        return;
    }

    // --- アンケート画面（AIラボ） ---
    if (this.st === 'quiz') {
        let qData = this.quizData[this.quizCur];
        if (keysDown.up) { this.quizAns = (this.quizAns - 1 + qData.a.length) % qData.a.length; playSnd('sel'); }
        if (keysDown.down) { this.quizAns = (this.quizAns + 1) % qData.a.length; playSnd('sel'); }
        if (keysDown.a) {
            // パラメータの加算
            let eff = qData.a[this.quizAns].eff;
            for (let key in eff) {
                if (this.myAI[key] !== undefined) this.myAI[key] += eff[key];
            }
            playSnd('hit');
            this.quizCur++; this.quizAns = 0;
            
            // クイズ終了時の処理
            if (this.quizCur >= this.quizData.length) {
                // パラメータを0〜1の範囲に丸める
                this.myAI.aggro = Math.max(0.1, Math.min(1.0, this.myAI.aggro));
                this.myAI.guard = Math.max(0.1, Math.min(1.0, this.myAI.guard));
                this.myAI.dodge = Math.max(0.1, Math.min(1.0, this.myAI.dodge));
                
                // 称号の決定
                if (this.myAI.aggro > 0.7) this.myAI.personality = '狂戦士(Berserker)';
                else if (this.myAI.guard > 0.6) this.myAI.personality = '鉄壁(Fortress)';
                else if (this.myAI.dodge > 0.6) this.myAI.personality = '幻影(Phantom)';
                else if (this.myAI.guard > 0.4 && this.myAI.prefRange > 45) this.myAI.personality = '策士(Tactician)';
                else this.myAI.personality = '万能型(All-Rounder)';
                
                this.st = 'quiz_result';
            }
        }
        return;
    }

    if (this.st === 'quiz_result') {
        if (keysDown.a) { this.st = 'menu'; playSnd('sel'); }
        return;
    }

    // --- バトル ---
    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) { this.st = 'menu'; playSnd('sel'); } return; }

    let dist = Math.abs(this.p1.x - this.p2.x);
    if (dist < 15) {
        if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; }
        else { let push = (15 - dist) / 2; this.p1.x += (this.p1.x < this.p2.x) ? -push : push; this.p2.x += (this.p2.x < this.p1.x) ? -push : push; }
    }

    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    
    [this.p1, this.p2].forEach(f => {
        if (f.comboTimer > 0) f.comboTimer--;
        if (f.comboTimer <= 0 && f.state !== 'hurt' && f.state !== 'stunned') {
            let opp = f.id === 1 ? this.p2 : this.p1; opp.combo = 0; 
        }
    });

    for (let i = this.texts.length - 1; i >= 0; i--) {
        this.texts[i].life--; this.texts[i].y -= 0.5;
        if (this.texts[i].life <= 0) this.texts.splice(i, 1);
    }
    for (let i = this.vfx.length - 1; i >= 0; i--) {
        let v = this.vfx[i]; v.life--;
        if (v.type === 'slash') { v.x += v.vx || 0; v.y += v.vy || 0; }
        if (v.life <= 0) this.vfx.splice(i, 1);
    }

    let viewW = 200 / this.scale; let viewH = 300 / this.scale;
    let targetX = (this.p1.x + this.p2.x) / 2 - viewW / 2;
    let targetY = (this.p1.y + this.p2.y) / 2 - viewH * 0.6; 
    targetX = Math.max(0, Math.min(this.stageWidth - viewW, targetX));
    targetY = Math.max(0, Math.min(this.stageHeight - viewH, targetY));
    this.camX += (targetX - this.camX) * 0.1;
    this.camY += (targetY - this.camY) * 0.1;

    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  // ★ 汎用化されたAI処理（パラメータによって動きが変わる）
  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.spd);

    if ((f.state === 'idle' || f.state === 'guard') && f.hp < f.maxHp) {
        f.regenTimer++; if (f.regenTimer > 30) { f.hp = Math.min(f.maxHp, f.hp + 3); f.regenTimer = 0; }
    }

    f.x += f.vx; f.y += f.vy; f.vx *= 0.85; 
    if (f.y < this.groundY) { f.vy += 0.6; } else { f.y = this.groundY; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4 || f.state.startsWith('atk_')) {
        f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state, frame: f.stateFrame});
        if(f.trail.length > 5) f.trail.pop();
    } else if (f.trail.length > 0) { f.trail.pop(); }

    if (f.state === 'idle' || f.state === 'move') { f.dir = (opp.x > f.x) ? 1 : -1; }

    if (f.state === 'hurt') { if (f.stateFrame > 25) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }
    if (f.state === 'guard') { 
        if (f.justGuardWindow > 0) f.justGuardWindow--;
        if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } 
        return; 
    }
    if (f.state === 'stunned') { if (f.stateFrame > 60) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; } return; }

    let isAtk = f.state.startsWith('atk_');
    let skill = isAtk ? f.skills.find(s => s.hitType === f.state.split('_')[1]) || f.counterSkill : null;
    
    if (isAtk && skill) {
         if (f.stateFrame === Math.floor(skill.start)) { 
             this.createHitbox(f, skill, opp); 
             let angle = f.dir === 1 ? 0 : Math.PI;
             if (skill.hitType === 'upper') angle -= (Math.PI/4) * f.dir;
             if (skill.hitType === 'meteor') angle += (Math.PI/4) * f.dir;
             this.addVFX('slash', f.x + 20*f.dir, f.y - 20, f.color, {size: skill.range, angle: angle, width: 10, vx: f.vx*0.5, vy: f.vy*0.5});
         }
         if (f.stateFrame > (skill.start + skill.rec)) { f.state = 'idle'; f.stateFrame = 0; f.hitCancel = false; }
    }
    
    let canCancel = isAtk && f.hitCancel && f.stateFrame > skill.start + 5;

    // ★ 詳細パラメータによるAI行動の決定
    if ((f.state === 'idle' && f.cd <= 0) || canCancel) {
      let d = Math.abs(f.x - opp.x);
      let rand = Math.random();
      let isAir = f.y < this.groundY - 10;
      let oppIsAir = opp.y < this.groundY - 10;
      let oppVulnerable = opp.state === 'hurt' || opp.state === 'stunned';

      // 相手の攻撃へのリアクション（guardRate, dodgeRate が影響）
      if (opp.state.startsWith('atk_') && d < 70 && !isAir && !canCancel && !oppVulnerable) {
         if (rand < (f.guardRate + f.dodgeRate)) { // 防御行動を取る確率
             // ガードするか回避するか
             let doDodge = Math.random() < (f.dodgeRate / (f.guardRate + f.dodgeRate));
             if (doDodge && d > 30) {
                 f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 12; f.cd = 10;
                 this.addVFX('shockwave', f.x, f.y, '#fff', {size: 20, life: 10});
                 playSnd('sel'); this.addText(f.x, f.y - 40, "DODGE", "#ccc"); return;
             } else {
                 f.state = 'guard'; f.stateFrame = 0; f.guarding = true; f.justGuardWindow = 8; return;
             }
         }
      }

      let shouldAttack = false;
      let moveDir = 0;

      if (oppVulnerable) {
          shouldAttack = true;
          if (oppIsAir && !isAir && d < 60 && f.state !== 'move') {
              f.state = 'move'; f.stateFrame = 0; f.vy = -16; f.vx = f.dir * 5; f.cd = 0; f.hitCancel = false; return;
          }
      } else {
          // ★ aggro（攻撃性）と prefRange（好む距離）による立ち回り
          if (d < f.prefRange) {
              if (rand < f.aggro) shouldAttack = true;
              else moveDir = -f.dir; // 距離を取り直す
          } else {
              moveDir = f.dir; // 近づく
          }
      }

      if (shouldAttack) {
         let nextSkill = 'jab';
         if (isAir) { nextSkill = (d < 35 && oppIsAir && opp.y > f.y) ? 'meteor' : 'smash'; }
         else {
             if (canCancel) {
                 if (f.state === 'atk_jab') nextSkill = 'upper';
                 else if (f.state === 'atk_upper') nextSkill = 'smash';
                 else nextSkill = 'jab';
             } else {
                 nextSkill = d < 35 ? (rand < 0.6 ? 'jab' : 'upper') : 'smash';
             }
         }

         let sData = f.skills.find(s=>s.hitType===nextSkill);
         f.state = 'atk_' + nextSkill; f.stateFrame = 0;
         f.vx = f.dir * sData.vx; f.cd = sData.cd; f.hitCancel = false;
      } 
      else if (moveDir !== 0 && rand < (f.spd * 0.2) && !canCancel) { 
         f.state = 'move'; f.stateFrame = 0; f.vx = moveDir * 5;
      }
    }

    if (f.state === 'move' && Math.abs(f.vx) < 0.5 && f.y >= this.groundY) { f.state = 'idle'; f.stateFrame = 0; }
  },

  createHitbox(attacker, skill, victim) {
    let vDist = Math.abs(victim.x - attacker.x);
    let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 
    let yDist = Math.abs(victim.y - attacker.y); 

    if (inFront && vDist <= skill.range + 10 && yDist < 50) {
       if (victim.guarding && victim.justGuardWindow > 0) {
           playSnd('sel'); screenShake(8); if(typeof hitStop !== 'undefined') hitStop(10);
           this.addVFX('impact', victim.x, victim.y-20, '#0ff', {size: 50});
           this.addText(victim.x, victim.y - 50, "PARRY!", "#0ff");
           attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 2; attacker.vy = -3; attacker.hitCancel = false;
           victim.guarding = false; victim.justGuardWindow = 0; victim.state = 'idle'; victim.cd = 0; return; 
       }

       if (victim.state === 'hurt' || victim.state === 'stunned' || victim.state === 'idle' || victim.state.startsWith('atk_') || victim.state === 'move') {
           let damage = skill.dmg * attacker.atk; let kbForce = skill.kb * attacker.atk;
           if (victim.guarding) {
               victim.hp -= damage * 0.2; playSnd('sel'); screenShake(2); victim.vx = attacker.dir * kbForce * 0.3; 
               this.addVFX('impact', victim.x, victim.y-15, '#888', {size: 15, life: 10}); return;
           }

           victim.hp -= damage; victim.state = 'hurt'; victim.stateFrame = 0; victim.comboTimer = 60; 
           attacker.hitCancel = true; attacker.combo++;

           if (victim.y < this.groundY - 10) victim.vy = -4; 
           if (skill.hitType === 'upper') victim.vy = -16;
           else if (skill.hitType === 'meteor') { victim.vy = 20; kbForce *= 0.5; }
           else if (skill.kb > 10) victim.vy = -6 - (Math.random()*2); 
           
           victim.vx = attacker.dir * kbForce;
           
           let hx = attacker.x + (vDist/2)*attacker.dir; let hy = victim.y - 15;
           
           if (skill.hitType === 'jab') {
              playSnd('hit'); screenShake(4); if(typeof hitStop !== 'undefined') hitStop(3); this.addVFX('impact', hx, hy, '#fff', {size: 25});
           } else {
              playSnd('combo'); screenShake(12); if(typeof hitStop !== 'undefined') hitStop(8); 
              this.addVFX('impact', hx, hy, attacker.color, {size: 50});
              this.addVFX('slash', hx, hy, '#fff', {size: 40, angle: Math.random()*Math.PI*2, width: 4}); 
           }
       }
    }
  },

  drawStickman(f, alpha = 1, isTrail = false) {
    ctx.strokeStyle = isTrail ? f.color : '#fff'; 
    ctx.lineWidth = isTrail ? 2 : 2.5; 
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
    else if (f.state === 'hurt') { p.h={x:-15,y:-5}; p.hip={x:5,y:10}; p.sL={x:-10,y:5}; p.sR={x:-5,y:5}; p.eL={x:-15,y:15}; p.eR={x:-5,y:15}; p.hL={x:-20,y:25}; p.hR={x:-10,y:25}; p.fL={x:15,y:30}; p.fR={x:-5,y:35}; p.kL={x:20,y:20}; }
    else if (f.state === 'stunned') { p.h={x:-10,y:5}; p.hip={x:0,y:15}; p.hL={x:-5,y:30}; p.hR={x:5,y:30}; p.kL={x:10,y:30}; p.fL={x:15,y:40}; } 
    else if (f.state === 'guard') { p.hL={x:10,y:-5}; p.hR={x:10,y:5}; p.eL={x:5,y:5}; p.eR={x:5,y:10}; p.h.y+=3; p.hip.y+=5; p.kL.x-=5; p.kR.x+=5; if(!isTrail && f.justGuardWindow > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0ff'; ctx.strokeStyle = '#0ff'; } }

    let dx = f.x; let dy = f.y - 20;
    if (f.state === 'stunned' && !isTrail) { dx += (Math.random()-0.5)*6; dy += (Math.random()-0.5)*6; ctx.strokeStyle = '#888'; }

    ctx.save(); ctx.translate(dx, dy); if (f.dir === -1) ctx.scale(-1, 1);
    
    if (!isTrail && (f.state.startsWith('atk_') || f.state === 'move')) { ctx.shadowBlur = 12; ctx.shadowColor = f.color; }

    ctx.beginPath();
    ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.hip.x, p.hip.y); 
    ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sL.x, p.sL.y); ctx.lineTo(p.eL.x, p.eL.y); ctx.lineTo(p.hL.x, p.hL.y); 
    ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sR.x, p.sR.y); ctx.lineTo(p.eR.x, p.eR.y); ctx.lineTo(p.hR.x, p.hR.y); 
    ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kL.x, p.kL.y); ctx.lineTo(p.fL.x, p.fL.y); 
    ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kR.x, p.kR.y); ctx.lineTo(p.fR.x, p.fR.y); 
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(p.h.x, p.h.y, 6, 0, Math.PI * 2); 
    ctx.fillStyle = isTrail ? f.color : '#fff'; ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  },

  draw() {
    // --- UI（メニュー ＆ クイズ）描画 ---
    if (this.st === 'menu' || this.st === 'quiz' || this.st === 'quiz_result') {
        const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#001'); grad.addColorStop(1, '#003');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'menu') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('AI LABORATORY', 40, 50);
            ctx.fillStyle = this.menuCur === 0 ? '#ff0' : '#fff'; ctx.font = '12px monospace';
            ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'TEST BATTLE', 45, 120);
            ctx.fillStyle = this.menuCur === 1 ? '#ff0' : '#fff';
            ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + '性格診断テスト', 35, 150);
            
            ctx.fillStyle = '#888'; ctx.font = '10px monospace';
            ctx.fillText(`現在のAI: [${this.myAI.personality}]`, 20, 250);
        }
        else if (this.st === 'quiz') {
            let qData = this.quizData[this.quizCur];
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 10px monospace';
            // 問題文の折り返し描画（簡易）
            let qLines = qData.q.match(/.{1,14}/g);
            for(let i=0; i<qLines.length; i++) ctx.fillText(qLines[i], 10, 30 + i*15);

            ctx.font = '9px monospace';
            for (let i = 0; i < qData.a.length; i++) {
                ctx.fillStyle = i === this.quizAns ? '#0ff' : '#aaa';
                let aLines = qData.a[i].text.match(/.{1,18}/g);
                ctx.fillText((i === this.quizAns ? '> ' : '  ') + aLines[0], 10, 100 + i * 40);
                if(aLines[1]) ctx.fillText('  ' + aLines[1], 10, 110 + i * 40);
            }
        }
        else if (this.st === 'quiz_result') {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('解析完了...', 60, 50);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('あなたのAIの性格は', 40, 100);
            ctx.fillStyle = '#f0f'; ctx.font = 'bold 14px monospace'; ctx.fillText(`【${this.myAI.personality}】`, 100 - (this.myAI.personality.length*7), 130);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('に決定しました！', 50, 160);
            ctx.fillStyle = '#888'; ctx.fillText('Press (A) to Return', 45, 250);
        }
        return;
    }

    // --- バトル描画 ---
    let isHitStop = typeof hitStopTimer !== 'undefined' && hitStopTimer > 3;
    const grad = ctx.createLinearGradient(0, 0, 0, 300); 
    if (isHitStop) { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); }
    else { grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    applyShake();
    ctx.save(); ctx.scale(this.scale, this.scale); ctx.translate(-this.camX, -this.camY);

    ctx.strokeStyle = isHitStop ? '#000' : '#445'; ctx.lineWidth = 2; 
    ctx.beginPath(); ctx.moveTo(0, this.groundY); ctx.lineTo(this.stageWidth, this.groundY); ctx.stroke();
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
        if (v.type === 'slash') {
            ctx.strokeStyle = v.color; ctx.lineWidth = v.width * ratio; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(v.x, v.y, v.size, v.angle - 1.0*ratio, v.angle + 1.0*ratio); ctx.stroke();
        } else if (v.type === 'impact') {
            ctx.fillStyle = isHitStop ? '#000' : v.color; ctx.beginPath();
            let s = v.size * Math.pow((1 - ratio), 0.5) + 5; 
            ctx.moveTo(v.x, v.y - s); ctx.lineTo(v.x + s/4, v.y - s/4); ctx.lineTo(v.x + s, v.y); ctx.lineTo(v.x + s/4, v.y + s/4);
            ctx.lineTo(v.x, v.y + s); ctx.lineTo(v.x - s/4, v.y + s/4); ctx.lineTo(v.x - s, v.y); ctx.lineTo(v.x - s/4, v.y - s/4);
            ctx.fill();
        } else if (v.type === 'shockwave') {
            ctx.strokeStyle = isHitStop ? '#000' : v.color; ctx.lineWidth = 4 * ratio;
            ctx.beginPath(); ctx.arc(v.x, v.y, v.size * (1-ratio)*2 + 10, 0, Math.PI*2); ctx.stroke();
        }
    });
    ctx.globalAlpha = 1;

    for (let t of this.texts) {
        ctx.fillStyle = isHitStop ? '#000' : t.color; ctx.font = 'bold 24px monospace'; ctx.globalAlpha = t.life / 40;
        ctx.fillText(t.text, t.x - 30, t.y); ctx.globalAlpha = 1;
    }

    ctx.restore(); 
    resetShake();

    // --- UI描画 ---
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 32); 
    ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 80, 8); ctx.fillRect(110, 5, 80, 8);
    ctx.fillStyle = this.p1.color; ctx.fillRect(10, 5, Math.max(0, this.p1.hp/this.p1.maxHp)*80, 8);
    ctx.fillStyle = this.p2.color; let p2HpW = Math.max(0, this.p2.hp/this.p2.maxHp)*80; ctx.fillRect(190 - p2HpW, 5, p2HpW, 8);

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText(this.p1.name, 10, 25); ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5.5), 25);
    
    if (this.p1.combo > 1) { ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p1.combo + ' HITS!', 10, 45); }
    if (this.p2.combo > 1) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 12px monospace'; ctx.fillText(this.p2.combo + ' HITS!', 140, 45); }

    if (this.st === 'intro') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 130, 200, 40);
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('GET READY...', 50, 155);
    } else if (this.st === 'result') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 120, 200, 60);
      ctx.fillStyle = '#f0f'; ctx.font = 'bold 18px monospace';
      let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name;
      ctx.fillText(winner + ' WIN!', 100 - (winner.length*6), 145);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('Press (A) to Menu', 45, 165);
    }
  }
};
