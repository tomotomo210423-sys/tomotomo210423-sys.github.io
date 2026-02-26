// === AUTO FIGHTER (Phase 3: High-Speed & Projectiles) ===
const AutoFighter = {
  st: 'intro', timer: 0,
  p1: null, p2: null,
  projectiles: [], // ★ 遠距離攻撃（飛び道具）の配列
  stageWidth: 300, 
  scale: 200 / 300, 
  
  init() {
    this.st = 'intro';
    this.timer = 0;
    this.projectiles = [];
    
    // スキルデータ定義 (★ 遠距離攻撃 shot を追加)
    const Skills = {
       jab: {name:'ジャブ', damage: 30, knockback: 3.5, range: 30, startup: 5, active: 10, recover: 15, cd: 15, vx: 3},
       smash: {name:'スマッシュ', damage: 80, knockback: 15.0, range: 35, startup: 12, active: 20, recover: 35, cd: 40, vx: 8},
       shot: {name:'気功波', damage: 40, knockback: 5.0, range: 0, startup: 15, active: 0, recover: 20, cd: 60, vx: 0}
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
      skills: [Skills.jab, Skills.smash, Skills.shot], // ★ スキルにshotを追加

      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', 
      name: isP2 ? 'BETA-' + personality : 'ALPHA-' + personality,
      vx: 0, vy: 0,
      guarding: false,
      trail: [] 
    });
    
    // 性格を変えてテスト（ALPHAは遠距離も撃つ、BETAはガン攻め）
    this.p1 = createFighter(false, 'tactical');
    this.p2 = createFighter(true, 'agressive');
    BGM.play('action');
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) this.init(); return; }

    // 押し出し判定
    let dist = Math.abs(this.p1.x - this.p2.x);
    if (dist < 15 && this.p1.y === 260 && this.p2.y === 260) { // 地上にいる時だけ押し出し
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

    // ★ 飛び道具（Projectile）の処理
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        let p = this.projectiles[i];
        p.x += p.vx;
        
        let target = p.ownerId === 1 ? this.p2 : this.p1;
        
        // 画面外で消去
        if (p.x < -50 || p.x > this.stageWidth + 50) {
            this.projectiles.splice(i, 1);
            continue;
        }

        // ヒット判定
        if (target.state !== 'hurt' && Math.abs(target.x - p.x) < 15 && Math.abs(target.y - p.y) < 30) {
            let dmg = p.damage * (p.ownerId===1 ? this.p1.atk : this.p2.atk);
            let kb = p.knockback * (target.guarding ? 0.3 : target.res);
            
            target.hp -= dmg;
            if (target.guarding) {
                playSnd('sel'); screenShake(1); target.vx = p.dir * kb; addParticle(target.x, target.y-10, '#0ff', 'star');
            } else {
                target.state = 'hurt'; target.stateFrame = 0;
                target.vx = p.dir * kb;
                playSnd('hit'); screenShake(4); if(typeof hitStop !== 'undefined') hitStop(3);
                addParticle(p.x, p.y, p.color, 'explosion');
            }
            this.projectiles.splice(i, 1); // 当たったら消える
        }
    }
    
    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.spd);

    // 物理演算
    f.x += f.vx; f.y += f.vy;
    f.vx *= 0.82; 
    if (f.y < 260) { f.vy += 0.6; } else { f.y = 260; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    // ★ 謎の点バグ修正：残像の記録を正しく行う
    if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4) {
        f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state, stateFrame: f.stateFrame});
        if(f.trail.length > 5) f.trail.pop();
    } else if (f.trail.length > 0) { f.trail.pop(); }

    // 向きの更新（攻撃中以外）
    if (f.state === 'idle' || f.state === 'move') { 
        f.dir = (opp.x > f.x) ? 1 : -1; 
    }

    if (f.state === 'hurt') { if (f.stateFrame > 15) { f.state = 'idle'; f.stateFrame = 0; } return; }
    if (f.state === 'guard') { if (f.stateFrame > 20) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } return; }

    // 攻撃処理
    if (f.state.startsWith('atk_')) {
      const skillName = f.state.split('_')[1];
      const sNameJP = skillName==='jab' ? 'ジャブ' : skillName==='smash' ? 'スマッシュ' : '気功波';
      const skill = f.skills.find(s => s.name === sNameJP);
      
      if (skill) {
         if (f.stateFrame === Math.floor(skill.startup)) { 
             if (skillName === 'shot') {
                 // ★ 飛び道具の発射
                 this.projectiles.push({
                     x: f.x + (15 * f.dir), y: f.y - 15, vx: f.dir * 12, dir: f.dir,
                     damage: skill.damage, knockback: skill.knockback, color: f.color, ownerId: f.id
                 });
                 playSnd('jmp');
             } else {
                 this.createHitbox(f, skill, opp); 
             }
         }
         if (f.stateFrame > (skill.startup + skill.recover)) { f.state = 'idle'; f.stateFrame = 0; }
      }
      return;
    }
    
    // --- 超高速 AI ロジック ---
    if (f.state === 'idle' && f.cd <= 0) {
      let d = Math.abs(f.x - opp.x);
      let rand = Math.random();

      // 防御・回避リアクション
      if (opp.state.startsWith('atk_') || this.projectiles.length > 0) {
         let reactChance = f.personality === 'defensive' ? 0.8 : f.personality === 'tactical' ? 0.5 : 0.2;
         if (rand < reactChance) {
             if (rand < reactChance * 0.4 && f.y === 260) {
                 // ★ ジャンプ回避
                 f.vy = -10; f.state = 'move'; f.stateFrame = 0; playSnd('jmp'); addParticle(f.x, f.y, '#fff', 'star'); return;
             } else if (d < 50) {
                 f.state = 'guard'; f.stateFrame = 0; f.guarding = true; return;
             }
         }
      }

      // スタイリッシュ回避（バックステップ）
      if (d < 35 && rand < (f.personality === 'defensive' ? 0.5 : 0.15)) {
         f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 10; f.cd = 5;
         playSnd('sel'); addParticle(f.x, f.y, '#aaa', 'star'); return;
      }

      // 攻撃か移動かの判断
      let shouldAttack = false;
      let targetSkill = null;

      if (f.personality === 'agressive') { 
          if (d < 45) { shouldAttack = true; targetSkill = d < 30 ? f.skills[0] : f.skills[1]; }
          else if (rand < 0.2) { shouldAttack = true; targetSkill = f.skills[2]; } // 遠くてもたまに撃つ
          else { f.state = 'move'; f.stateFrame = 0; f.vx = f.dir * 8; f.cd = 5; return; } // 超高速ダッシュ
      } 
      else if (f.personality === 'tactical') { 
          if (d < 35) { shouldAttack = true; targetSkill = d < 25 ? f.skills[0] : f.skills[1]; } 
          else if (d > 100 && rand < 0.6) { shouldAttack = true; targetSkill = f.skills[2]; } // 遠距離で撃つ
          else if (d > 60) { f.state = 'move'; f.stateFrame = 0; f.vx = f.dir * 6; return; }
      }

      // 技の実行
      if (shouldAttack) {
         f.state = 'atk_' + (targetSkill.name==='ジャブ'?'jab':targetSkill.name==='スマッシュ'?'smash':'shot'); f.stateFrame = 0;
         f.vx = f.dir * targetSkill.vx; f.cd = targetSkill.cd;
      } 
      else if (rand < 0.2) { 
         // 通常移動（歩き）
         f.state = 'move'; f.stateFrame = 0; f.vx = f.dir * 3;
      }
    }

    if (f.state === 'move' && Math.abs(f.vx) < 0.5 && f.y === 260) { f.state = 'idle'; f.stateFrame = 0; }
  },

  createHitbox(attacker, skill, victim) {
    let vDist = Math.abs(victim.x - attacker.x);
    let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 

    if (victim.state !== 'hurt' && inFront && vDist <= skill.range + 15) {
       let damage = skill.damage * attacker.atk;
       let kbForce = skill.knockback * attacker.atk * (victim.guarding ? 0.3 : victim.res);
       
       victim.hp -= damage;
       if (victim.guarding) { 
           playSnd('sel'); screenShake(1); victim.vx = attacker.dir * kbForce; addParticle(victim.x, victim.y-10, '#0ff', 'star');
       }
       else {
           victim.state = 'hurt'; victim.stateFrame = 0;
           victim.vx = attacker.dir * kbForce; 
           if (skill.knockback > 10) victim.vy = -5 - (Math.random()*2); 
           
           let hx = attacker.x + (vDist/2)*attacker.dir; let hy = attacker.y - 15;
           if (skill.name === 'ジャブ') {
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

    // ジャンプ中のポーズ
    if (f.y < 260) {
        armL={x:-15,y:-20}; armR={x:15,y:-20}; legL={x:-10,y:5}; legR={x:5,y:0};
    }
    else if (f.state === 'idle') { let breath = Math.sin(Date.now() / 200) * 2; head.y += breath; neck.y += breath; } 
    else if (f.state === 'move') { let run = Math.sin(f.stateFrame * 0.8) * 12; armL.x = -run; armR.x = run; legL.x = run; legR.x = -run; head.x += 8; }
    else if (f.state === 'atk_jab') { if (f.stateFrame < 10) { armR = {x: 25, y: -20}; armL = {x: 5, y: -15}; head.x += 5; } }
    else if (f.state === 'atk_smash') { if (f.stateFrame < 12) { armR = {x: -15, y: -35}; head.x -= 5; } else if (f.stateFrame < 25) { armR = {x: 30, y: -5}; head.x += 10; hip.x += 5; legL.x -= 10; legR.x += 15;} }
    // ★ 遠距離攻撃（気功波）のポーズ
    else if (f.state === 'atk_shot') { if (f.stateFrame < 15) { armR={x:-10,y:-10}; armL={x:-10,y:-5}; } else { armR={x:20,y:-15}; armL={x:18,y:-10}; head.x+=5; } }
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

    // ★ 残像の描画（バグ修正済）
    [this.p1, this.p2].forEach(f => {
        for(let i=0; i<f.trail.length; i++) {
            let tr = f.trail[i]; 
            // 過去の自分の状態を正確にコピーして薄く描画
            let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state, stateFrame: tr.stateFrame};
            this.drawStickman(tempF, 0.4 - (i*0.08));
        }
    });

    this.drawStickman(this.p1);
    this.drawStickman(this.p2);
    
    // ★ 飛び道具の描画
    for (let p of this.projectiles) {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
        // 飛び道具の残像
        ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(p.x - p.vx*1.5, p.y, 6, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.arc(p.x - p.vx*3, p.y, 4, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
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
