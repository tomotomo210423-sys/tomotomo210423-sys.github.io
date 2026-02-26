// === AUTO FIGHTER (Phase 3: PARRY, COUNTER & REGEN) ===
const AutoFighter = {
  st: 'intro', timer: 0,
  p1: null, p2: null,
  stageWidth: 300, 
  scale: 200 / 300, 
  texts: [], // PARRY! などのポップアップテキスト用
  
  init() {
    this.st = 'intro';
    this.timer = 0;
    this.texts = [];
    
    // スキルデータ定義
    const Skills = {
       jab: {name:'ジャブ', damage: 30, knockback: 3.5, range: 30, startup: 5, active: 10, recover: 15, cd: 20, vx: 2},
       smash: {name:'スマッシュ', damage: 80, knockback: 12.0, range: 35, startup: 12, active: 20, recover: 35, cd: 40, vx: 6},
       counter: {name:'カウンター', damage: 100, knockback: 15.0, range: 40, startup: 4, active: 15, recover: 20, cd: 0, vx: 8} // パリィ成功時の専用技
    };

    const createFighter = (isP2, personality) => ({
      id: isP2 ? 2 : 1,
      x: isP2 ? 240 : 60, y: 260, 
      dir: isP2 ? -1 : 1, 
      hp: 1000, maxHp: 1000,
      
      atk: isP2 ? 1.2 : 1.0, 
      res: isP2 ? 0.8 : 1.0, 
      spd: isP2 ? 0.9 : 1.1, 
      
      personality: personality,
      skills: [Skills.jab, Skills.smash],
      counterSkill: Skills.counter,

      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', 
      name: isP2 ? 'BETA-' + personality : 'ALPHA-' + personality,
      vx: 0, vy: 0,
      guarding: false,
      justGuardWindow: 0, // パリィ受付フレーム
      trail: [],
      regenTimer: 0
    });
    
    // 性格を少し変えてテスト
    this.p1 = createFighter(false, 'tactical'); // パリィ・回避を狙う
    this.p2 = createFighter(true, 'agressive'); // ガンガン攻める
    BGM.play('action');
  },

  addText(x, y, text, color) {
    this.texts.push({x: x, y: y, text: text, color: color, life: 40});
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) this.init(); return; }

    // 押し出し判定（密着バグ防止）
    let dist = Math.abs(this.p1.x - this.p2.x);
    if (dist < 15) {
        if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; }
        else {
            let push = (15 - dist) / 2;
            this.p1.x += (this.p1.x < this.p2.x) ? -push : push;
            this.p2.x += (this.p2.x < this.p1.x) ? -push : push;
        }
    }

    // AI処理
    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    
    // テキストのエフェクト処理
    for (let i = this.texts.length - 1; i >= 0; i--) {
        this.texts[i].life--;
        this.texts[i].y -= 0.5;
        if (this.texts[i].life <= 0) this.texts.splice(i, 1);
    }

    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.spd);

    // ★ 自動回復 (Idle状態 または ガード中で、ダメージを受けていない時に少しずつ回復)
    if ((f.state === 'idle' || f.state === 'guard') && f.hp < f.maxHp) {
        f.regenTimer++;
        if (f.regenTimer > 30) { f.hp = Math.min(f.maxHp, f.hp + 5); f.regenTimer = 0; }
    } else { f.regenTimer = 0; }

    // 物理演算
    f.x += f.vx; f.y += f.vy;
    f.vx *= 0.82; 
    if (f.y < 260) { f.vy += 0.5; } else { f.y = 260; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    // 残像
    if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4) {
        f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state});
        if(f.trail.length > 5) f.trail.pop();
    } else if (f.trail.length > 0) { f.trail.pop(); }

    if (f.state === 'idle' || f.state === 'move') { f.dir = (opp.x > f.x) ? 1 : -1; }

    if (f.state === 'hurt') { if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; } return; }
    
    // ガード状態の処理（パリィ受付時間の減算）
    if (f.state === 'guard') { 
        if (f.justGuardWindow > 0) f.justGuardWindow--;
        if (f.stateFrame > 30) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } 
        return; 
    }

    // パリィ成功後の相手のよろけ状態（隙だらけ）
    if (f.state === 'stunned') {
        if (f.stateFrame > 40) { f.state = 'idle'; f.stateFrame = 0; }
        return;
    }

    // 攻撃処理
    if (f.state.startsWith('atk_')) {
      const skillName = f.state.split('_')[1];
      const skill = skillName === 'counter' ? f.counterSkill : f.skills.find(s => s.name.includes(skillName==='jab'?'ジャブ':'スマッシュ'));
      
      if (skill) {
         if (f.stateFrame === Math.floor(skill.startup)) { this.createHitbox(f, skill, opp); }
         if (f.stateFrame > (skill.startup + skill.recover)) { f.state = 'idle'; f.stateFrame = 0; }
      }
      return;
    }
    
    // --- AI ロジック ---
    if (f.state === 'idle' && f.cd <= 0) {
      let d = Math.abs(f.x - opp.x);
      let rand = Math.random();
      let shouldAttack = false;
      let moveDir = f.dir;

      // 相手が攻撃してきた時の防御・回避リアクション
      if (opp.state.startsWith('atk_') && d < 60) {
         let reactChance = f.personality === 'defensive' ? 0.8 : f.personality === 'tactical' ? 0.6 : 0.3;
         
         if (rand < reactChance) {
             let reactType = Math.random();
             // ★ バックステップ回避
             if (reactType < 0.4 && d > 20) {
                 f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 10; f.cd = 15;
                 playSnd('sel'); addParticle(f.x, f.y, '#aaa', 'star');
                 this.addText(f.x, f.y - 40, "DODGE", "#ccc");
                 return;
             } 
             // ★ ガード（出始めはパリィ受付状態）
             else {
                 f.state = 'guard'; f.stateFrame = 0; f.guarding = true; 
                 f.justGuardWindow = 8; // ガード開始から8フレームがパリィ受付時間
                 return;
             }
         }
      }

      if (f.personality === 'agressive') { if (d < 40) shouldAttack = true; else moveDir = f.dir; } 
      else if (f.personality === 'tactical') { if (d < 35) shouldAttack = true; else if (d > 70) moveDir = f.dir; else moveDir = 0; }
      else if (f.personality === 'defensive') { if (d < 25) shouldAttack = true; else moveDir = -f.dir; }

      if (shouldAttack && rand < 0.8) {
         let targetSkill = d < 28 ? f.skills[0] : f.skills[1]; 
         f.state = 'atk_' + (targetSkill.name.includes('ジャブ') ? 'jab' : 'smash'); f.stateFrame = 0;
         f.vx = f.dir * targetSkill.vx; f.cd = targetSkill.cd;
      } 
      else if (moveDir !== 0 && rand < (f.spd * 0.15)) { 
         f.state = 'move'; f.stateFrame = 0; f.vx = moveDir * 4;
      }
    }

    if (f.state === 'move' && Math.abs(f.vx) < 0.5) { f.state = 'idle'; f.stateFrame = 0; }
  },

  createHitbox(attacker, skill, victim) {
    let vDist = Math.abs(victim.x - attacker.x);
    let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 

    if (victim.state !== 'hurt' && inFront && vDist <= skill.range + 10) {
       
       // ★ パリィ（ジャストガード）判定
       if (victim.guarding && victim.justGuardWindow > 0) {
           playSnd('sel'); screenShake(4); if(typeof hitStop !== 'undefined') hitStop(8);
           addParticle(victim.x, victim.y-15, '#0ff', 'explosion');
           this.addText(victim.x, victim.y - 40, "PARRY!", "#0ff");
           
           // 攻撃側は大きくよろける（スタン）
           attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 3;
           
           // パリィ側は即座にカウンター技を発動
           victim.state = 'atk_counter'; victim.stateFrame = 0; victim.guarding = false;
           victim.vx = victim.dir * victim.counterSkill.vx;
           return; // ダメージは受けない
       }

       let damage = skill.damage * attacker.atk;
       let kbForce = skill.knockback * attacker.atk * (victim.guarding ? 0.2 : victim.res);
       
       victim.hp -= damage;
       
       if (victim.guarding) { 
           playSnd('sel'); screenShake(1); victim.vx = attacker.dir * kbForce; 
           addParticle(victim.x, victim.y-10, '#444', 'star'); // 通常ガードのエフェクトは控えめに
           this.addText(victim.x, victim.y - 40, "GUARD", "#888");
       }
       else {
           victim.state = 'hurt'; victim.stateFrame = 0;
           victim.vx = attacker.dir * kbForce; 
           if (skill.knockback > 10) victim.vy = -4 - (Math.random()*2); 
           
           let hx = attacker.x + (vDist/2)*attacker.dir; let hy = attacker.y - 15;
           if (skill.name.includes('ジャブ')) {
              playSnd('hit'); screenShake(3); if(typeof hitStop !== 'undefined') hitStop(2); 
              addParticle(hx, hy, '#fff', 'star');
           } else if (skill.name.includes('カウンター')) {
              playSnd('combo'); screenShake(12); if(typeof hitStop !== 'undefined') hitStop(10); 
              addParticle(hx, hy, '#0ff', 'explosion'); addParticle(hx, hy, attacker.color, 'explosion');
              this.addText(hx, hy - 20, "COUNTER!!", "#f0f");
           } else {
              playSnd('combo'); screenShake(8); if(typeof hitStop !== 'undefined') hitStop(5); 
              addParticle(hx, hy, '#ff0', 'explosion');
           }
       }
    }
  },

  drawStickman(f, alpha = 1) {
    ctx.strokeStyle = f.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.globalAlpha = alpha;
    let head={x:0,y:-30}, neck={x:0,y:-20}, hip={x:0,y:-5}, armL={x:-10,y:-10}, armR={x:10,y:-10}, legL={x:-8,y:10}, legR={x:8,y:10};

    if (f.state === 'idle') { let breath = Math.sin(Date.now() / 200) * 2; head.y += breath; neck.y += breath; } 
    else if (f.state === 'move') { let run = Math.sin(f.stateFrame * 0.5) * 10; armL.x = -run; armR.x = run; legL.x = run; legR.x = -run; head.x += 5; }
    else if (f.state === 'atk_jab') { if (f.stateFrame < 10) { armR = {x: 25, y: -20}; armL = {x: 5, y: -15}; head.x += 5; } }
    else if (f.state === 'atk_smash') { if (f.stateFrame < 12) { armR = {x: -15, y: -35}; head.x -= 5; } else if (f.stateFrame < 25) { armR = {x: 30, y: -5}; head.x += 10; hip.x += 5; legL.x -= 10; legR.x += 15;} }
    // ★ カウンター技の専用モーション（大きく踏み込んでのアッパー）
    else if (f.state === 'atk_counter') { if (f.stateFrame < 8) { armR = {x: -20, y: 0}; head.y += 10; hip.y += 10; legL.x -= 15; } else if (f.stateFrame < 20) { armR = {x: 20, y: -45}; head.y -= 5; hip.y -= 5; legR.x += 10; } }
    else if (f.state === 'hurt') { head={x:-10,y:-25}, neck={x:-5,y:-15}, hip={x:5,y:-5}, armL={x:-15,y:-25}, armR={x:5,y:-20}; }
    else if (f.state === 'stunned') { head={x:-15,y:-20}, neck={x:-10,y:-10}, hip={x:0,y:0}, armL={x:-5,y:5}, armR={x:-5,y:10}, legL={x:15,y:10}; } // パリィされた後の隙だらけポーズ
    else if (f.state === 'guard') { 
        armL = {x:15, y:-25}; armR = {x:15, y:-15}; head.y += 5; hip.y += 3; 
        if(f.justGuardWindow > 0) { ctx.shadowBlur = 10; ctx.shadowColor = '#0ff'; } // パリィ受付中は光る
    }

    ctx.save(); ctx.translate(f.x, f.y); if (f.dir === -1) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(hip.x, hip.y); 
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armL.x, armL.y); 
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armR.x, armR.y); 
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legL.x, legL.y); 
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legR.x, legR.y); 
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(head.x, head.y, 6, 0, Math.PI * 2); ctx.fillStyle = f.color; ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  },

  draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    ctx.strokeStyle = '#445'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 260); ctx.lineTo(200, 260); ctx.stroke();
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i + (Date.now()/50)%20, 260); ctx.lineTo(i - 10 + (Date.now()/50)%20, 300); ctx.stroke(); }
    for(let i=0; i<300; i+=20) { ctx.strokeStyle = 'rgba(100,255,100,0.05)'; ctx.strokeRect(0, i, 200, 1); ctx.strokeRect(i, 0, 1, 300); }

    applyShake();
    ctx.save(); ctx.scale(this.scale, 1); 

    [this.p1, this.p2].forEach(f => {
        for(let i=0; i<f.trail.length; i++) {
            let tr = f.trail[i]; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state};
            this.drawStickman(tempF, 0.4 - (i*0.1));
        }
    });

    this.drawStickman(this.p1);
    this.drawStickman(this.p2);
    
    // ★ ポップアップテキストの描画
    for (let t of this.texts) {
        ctx.fillStyle = t.color; ctx.font = 'bold 16px monospace'; ctx.globalAlpha = t.life / 40;
        ctx.fillText(t.text, t.x - 20, t.y); ctx.globalAlpha = 1;
    }

    drawParticles();
    ctx.restore(); 
    resetShake();

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 32); 
    ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 80, 8); ctx.fillRect(110, 5, 80, 8);
    ctx.fillStyle = this.p1.color; ctx.fillRect(10, 5, Math.max(0, this.p1.hp/this.p1.maxHp)*80, 8);
    ctx.fillStyle = this.p2.color; let p2HpW = Math.max(0, this.p2.hp/this.p2.maxHp)*80; ctx.fillRect(190 - p2HpW, 5, p2HpW, 8);

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText(this.p1.name, 10, 25);
    ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5.5), 25);
    
    ctx.fillStyle = '#888'; ctx.font = '8px monospace';
    ctx.fillText(`spd:${this.p1.spd} atk:${this.p1.atk}`, 10, 35);
    ctx.fillText(`spd:${this.p2.spd} atk:${this.p2.atk}`, 190 - (18*5), 35);

    if (this.st === 'intro') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 130, 200, 40);
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('GET READY...', 50, 155);
    } else if (this.st === 'result') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 120, 200, 60);
      ctx.fillStyle = '#f0f'; ctx.font = 'bold 18px monospace';
      let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name;
      ctx.fillText(winner + ' WIN!', 100 - (winner.length*6), 145);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('Press (A) to Rematch', 40, 165);
    }
    ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 292);
  }
};
