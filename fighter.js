// === AUTO FIGHTER (Phase 2.5: Bug Fix & Backstep AI) ===
const AutoFighter = {
  st: 'intro', timer: 0,
  p1: null, p2: null,
  stageWidth: 300, 
  scale: 200 / 300, 
  
  init() {
    this.st = 'intro';
    this.timer = 0;
    
    // スキルデータ定義
    const Skills = {
       jab: {name:'ジャブ', damage: 30, knockback: 3.5, range: 30, startup: 5, active: 10, recover: 15, cd: 20, vx: 2},
       smash: {name:'スマッシュ', damage: 80, knockback: 12.0, range: 35, startup: 12, active: 20, recover: 35, cd: 40, vx: 6}
    };

    const createFighter = (isP2, personality) => ({
      id: isP2 ? 2 : 1, // ★ 個別ID
      x: isP2 ? 240 : 60, y: 260, 
      dir: isP2 ? -1 : 1, 
      hp: 1000, maxHp: 1000,
      
      atk: isP2 ? 1.2 : 1.0, 
      res: isP2 ? 0.8 : 1.0, 
      spd: isP2 ? 0.9 : 1.1, 
      
      personality: personality,
      skills: [Skills.jab, Skills.smash],

      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', 
      name: isP2 ? 'BETA-' + personality : 'ALPHA-' + personality,
      vx: 0, vy: 0,
      guarding: false,
      trail: [] // ★ スタイリッシュ残像用
    });
    
    this.p1 = createFighter(false, 'agressive');
    this.p2 = createFighter(true, 'tactical');
    BGM.play('action');
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) this.init(); return; }

    // --- ★ 押し出し判定（キャラ同士が完全に重ならないようにする） ---
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
    
    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.spd);

    // 物理演算
    f.x += f.vx; f.y += f.vy;
    f.vx *= 0.82; 
    if (f.y < 260) { f.vy += 0.5; } else { f.y = 260; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    // 残像の記録
    if (Math.abs(f.vx) > 3 || Math.abs(f.vy) > 3) {
        f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state});
        if(f.trail.length > 4) f.trail.pop();
    } else if (f.trail.length > 0) { f.trail.pop(); }

    if (f.state === 'idle' || f.state === 'move') { 
        f.dir = (opp.x > f.x) ? 1 : -1; 
    }

    if (f.state === 'hurt') { if (f.stateFrame > 15) { f.state = 'idle'; f.stateFrame = 0; } return; }
    if (f.state === 'guard') { if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } return; }

    // 攻撃処理
    if (f.state.startsWith('atk_')) {
      const skillName = f.state.split('_')[1];
      const skill = f.skills.find(s => s.name.includes(skillName==='jab'?'ジャブ':'スマッシュ'));
      
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

      // ★ スタイリッシュ回避（近すぎたら一定確率でバックステップ）
      if (d < 30 && rand < (f.personality === 'defensive' ? 0.4 : 0.15)) {
         f.state = 'move'; f.stateFrame = 0;
         f.vx = -f.dir * 8; // 後ろへ高速ダッシュ
         f.cd = 10;
         playSnd('sel'); addParticle(f.x, f.y, '#aaa', 'star');
         return;
      }

      if (opp.state.startsWith('atk_') && d < 45) {
         let guardChance = f.personality === 'defensive' ? 0.7 : f.personality === 'tactical' ? 0.4 : 0.1;
         if (rand < guardChance) { f.state = 'guard'; f.stateFrame = 0; f.guarding = true; return; }
      }

      if (f.personality === 'agressive') { if (d < 45) shouldAttack = true; else moveDir = f.dir; } 
      else if (f.personality === 'tactical') { if (d < 35) shouldAttack = true; else if (d > 80) moveDir = f.dir; else moveDir = 0; }
      else if (f.personality === 'defensive') { if (d < 25) shouldAttack = true; else moveDir = -f.dir; }

      if (shouldAttack && rand < 0.8) {
         let targetSkill = d < 30 ? f.skills[0] : f.skills[1]; 
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
    // ★ 密着すっぽ抜けバグの修正（相手が自分の少し後ろにいても当たるようにする）
    let vDist = Math.abs(victim.x - attacker.x);
    let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 

    if (victim.state !== 'hurt' && inFront && vDist <= skill.range + 10) {
       let damage = skill.damage * attacker.atk;
       let kbForce = skill.knockback * attacker.atk * (victim.guarding ? 0.3 : victim.res);
       
       victim.hp -= damage;
       if (victim.guarding) { 
           playSnd('sel'); screenShake(1); victim.vx = attacker.dir * kbForce; addParticle(victim.x, victim.y-10, '#0ff', 'star');
       }
       else {
           victim.state = 'hurt'; victim.stateFrame = 0;
           victim.vx = attacker.dir * kbForce; 
           if (skill.knockback > 10) victim.vy = -4 - (Math.random()*2); 
           
           let hx = attacker.x + (vDist/2)*attacker.dir; let hy = attacker.y - 15;
           if (skill.name.includes('ジャブ')) {
              playSnd('hit'); screenShake(3); if(typeof hitStop !== 'undefined') hitStop(2); addParticle(hx, hy, '#fff', 'star');
           } else {
              playSnd('combo'); screenShake(8); if(typeof hitStop !== 'undefined') hitStop(5); addParticle(hx, hy, '#ff0', 'explosion'); addParticle(hx, hy, attacker.color, 'explosion');
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
    else if (f.state === 'hurt') { head={x:-10,y:-25}, neck={x:-5,y:-15}, hip={x:5,y:-5}, armL={x:-15,y:-25}, armR={x:5,y:-20}; }
    else if (f.state === 'guard') { armL = {x:15, y:-25}; armR = {x:15, y:-15}; head.y += 5; hip.y += 3; }

    ctx.save(); ctx.translate(f.x, f.y); if (f.dir === -1) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(hip.x, hip.y); 
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armL.x, armL.y); 
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armR.x, armR.y); 
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legL.x, legL.y); 
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legR.x, legR.y); 
    ctx.stroke();
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

    // 残像の描画（Y.O.M.I っぽさ）
    [this.p1, this.p2].forEach(f => {
        for(let i=0; i<f.trail.length; i++) {
            let tr = f.trail[i]; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state};
            this.drawStickman(tempF, 0.4 - (i*0.1));
        }
    });

    this.drawStickman(this.p1);
    this.drawStickman(this.p2);
    
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
