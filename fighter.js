// === AUTO FIGHTER (Phase 2:STICKMAN BATTLE - Knockback & Wide Stage) ===
const AutoFighter = {
  st: 'intro', timer: 0,
  p1: null, p2: null,
  hitboxes: [],
  // ★ ステージ幅を 画面の1.5倍に設定。画面固定で縮小描画することで広く見せる
  stageWidth: 300, 
  scale: 200 / 300, // 描画時の縮小倍率
  
  init() {
    this.st = 'intro';
    this.timer = 0;
    this.hitboxes = [];
    
    // スキルデータ定義（技のパラメータ）
    const Skills = {
       jab: {name:'ジャブ', damage: 30, knockback: 3.5, range: 25, startup: 5, active: 10, recover: 15, cd: 20, vx: 0},
       smash: {name:'スマッシュ', damage: 80, knockback: 14.0, range: 30, startup: 12, active: 20, recover: 35, cd: 40, vx: 5}
    };

    // ファイターの初期化設定（育成・性格対応）
    const createFighter = (isP2, personality) => ({
      x: isP2 ? 260 : 40, y: 260, // ★ 広い座標系に配置
      dir: isP2 ? -1 : 1, 
      hp: 1000, maxHp: 1000,
      
      // パラメータ
      atk: isP2 ? 1.2 : 1.0, // 攻撃力倍率
      res: isP2 ? 0.8 : 1.0, // ノックバック耐性倍率（低いほうが吹っ飛ぶ）
      spd: isP2 ? 0.9 : 1.1, // 行動速度倍率
      
      personality: personality, // agressive, tactical, defensive
      skills: [Skills.jab, Skills.smash],

      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', 
      name: isP2 ? 'BETA-' + personality : 'ALPHA-' + personality,
      vx: 0, vy: 0,
      guarding: false
    });
    
    this.p1 = createFighter(false, 'agressive');
    this.p2 = createFighter(true, 'tactical');
    BGM.play('action');
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) this.init(); return; }

    // --- バトルメイン処理 ---
    this.hitboxes = []; // 攻撃判定リストをリセット
    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    
    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  // 各ファイターのAI思考と動きの処理
  processFighter(f, opp) {
    f.stateFrame++;
    // ★ spd（素早さ）パラメータに応じてクールダウンを減らす
    if (f.cd > 0) f.cd -= (f.spd);

    // 物理演算（摩擦とノックバック）
    f.x += f.vx; f.y += f.vy;
    f.vx *= 0.85; // 空中摩擦を少し弱めて吹っ飛ぶように
    if (f.y < 260) { f.vy += 0.5; } else { f.y = 260; f.vy = 0; }
    
    // ★ ステージの壁判定を広くした座標に合わせる (0 〜 stageWidth)
    f.x = Math.max(0, Math.min(this.stageWidth, f.x));

    if (f.state === 'idle' || f.state === 'move') { f.dir = (opp.x > f.x) ? 1 : -1; }

    if (f.state === 'hurt') { if (f.stateFrame > 15) { f.state = 'idle'; f.stateFrame = 0; } return; }
    if (f.state === 'guard') { if (f.stateFrame > 30) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } return; }

    // 攻撃のモーション処理と当たり判定発生
    if (f.state.startsWith('atk_')) {
      const skillName = f.state.split('_')[1];
      const skill = f.skills.find(s => s.name.includes(skillName));
      
      if (skill) {
         if (f.stateFrame === Math.floor(skill.startup)) { // 発生
            this.createHitbox(f, skill, opp);
         }
         if (f.stateFrame > (skill.startup + skill.recover)) { f.state = 'idle'; f.stateFrame = 0; }
      }
      return;
    }
    
    // --- スキルベース AI 行動決定ロジック ---
    if (f.state === 'idle' && f.cd <= 0) {
      let dist = Math.abs(f.x - opp.x);
      let rand = Math.random();

      // 性格による行動優先度
      let shouldAttack = false;
      let targetSkill = null;
      let moveDir = f.dir;

      // ガード試行（相手が攻撃中かつ近ければ、性格に応じて確率でガード）
      if (opp.state.startsWith('atk_') && dist < 40) {
         let guardChance = f.personality === 'defensive' ? 0.6 : f.personality === 'tactical' ? 0.3 : 0.1;
         if (rand < guardChance) { f.state = 'guard'; f.stateFrame = 0; f.guarding = true; playSnd('hit'); return; }
      }

      // 性格別AI処理
      if (f.personality === 'agressive') {
         if (dist < 40) shouldAttack = true; else moveDir = f.dir;
      } 
      else if (f.personality === 'tactical') {
         if (dist < 30) { shouldAttack = true; } // 近すぎれば攻撃
         else if (dist > 70) { moveDir = f.dir; } // 遠ければ近づく
         else { moveDir = 0; } // 中距離を保つ
      }
      else if (f.personality === 'defensive') {
         if (dist < 25) shouldAttack = true; else moveDir = -f.dir; // 基本は逃げる
      }

      // 行動実行
      if (shouldAttack && rand < 0.8) {
         // 確率で技を選ぶ。atkパラメータによって吹っ飛びを強化
         targetSkill = dist < 25 ? f.skills[0] : f.skills[1]; 
         f.state = 'atk_' + (targetSkill.name.includes('ジャブ') ? 'jab' : 'smash'); f.stateFrame = 0;
         f.vx = f.dir * targetSkill.vx; f.cd = targetSkill.cd;
      } 
      else if (moveDir !== 0 && rand < (f.spd * 0.1)) { // 移動 spdパラメータで頻度を調整
         f.state = 'move'; f.stateFrame = 0;
         f.vx = moveDir * 4;
      }
    }

    if (f.state === 'move' && Math.abs(f.vx) < 0.5) { f.state = 'idle'; f.stateFrame = 0; }
  },

  // 攻撃判定の生成とノックバックヒット処理
  createHitbox(attacker, skill, victim) {
    let hx = attacker.x + (skill.range * attacker.dir);
    let hy = attacker.y - 15;
    
    // ★ デバッグ用の点は追加しない（削除）

    // ヒットチェック
    if (victim.state !== 'hurt' && Math.abs(victim.x - hx) < (skill.active + 10)) {
       
       // ダメージとノックバック計算（params、guard対応）
       let damage = skill.damage * attacker.atk;
       let kbForce = skill.knockback * attacker.atk * (victim.guarding ? 0.3 : victim.res);
       
       victim.hp -= damage;
       if (victim.guarding) { playSnd('hit'); screenShake(1); victim.vx = attacker.dir * kbForce; }
       else {
           victim.state = 'hurt'; victim.stateFrame = 0;
           victim.vx = attacker.dir * kbForce; // ★ 強烈なノックバック
           if (skill.knockback > 10) victim.vy = -5 - (Math.random()*2); // スマッシュなら大きく上へも飛ぶ
           
           // ヒット演出
           if (skill.name.includes('ジャブ')) {
              playSnd('hit'); screenShake(3); if(typeof hitStop !== 'undefined') hitStop(2); addParticle(hx, hy, '#fff', 'star');
           } else {
              playSnd('hit'); screenShake(8); if(typeof hitStop !== 'undefined') hitStop(5); addParticle(hx, hy, '#ff0', 'explosion'); addParticle(hx, hy, attacker.color, 'explosion');
           }
       }
    }
  },

  drawStickman(f) {
    ctx.strokeStyle = f.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    let head={x:0,y:-30}, neck={x:0,y:-20}, hip={x:0,y:-5}, armL={x:-10,y:-10}, armR={x:10,y:-10}, legL={x:-8,y:10}, legR={x:8,y:10};

    // 状態によるポーズ（技・ガード・やられ）
    if (f.state === 'idle') { let breath = Math.sin(Date.now() / 200) * 2; head.y += breath; neck.y += breath; } 
    else if (f.state === 'move') { let run = Math.sin(f.stateFrame * 0.5) * 10; armL.x = -run; armR.x = run; legL.x = run; legR.x = -run; head.x += 5; }
    else if (f.state === 'atk_jab') { if (f.stateFrame < 10) { armR = {x: 25, y: -20}; armL = {x: 5, y: -15}; head.x += 5; } }
    else if (f.state === 'atk_smash') { if (f.stateFrame < 12) { armR = {x: -15, y: -35}; head.x -= 5; } else if (f.stateFrame < 25) { armR = {x: 30, y: -5}; head.x += 10; hip.x += 5; legL.x -= 10; legR.x += 15;} }
    else if (f.state === 'hurt') { head={x:-10,y:-25}, neck={x:-5,y:-15}, hip={x:5,y:-5}, armL={x:-15,y:-25}, armR={x:5,y:-20}; }
    else if (f.state === 'guard') { armL = {x:15, y:-25}; armR = {x:15, y:-15}; head.y += 5; hip.y += 3; }

    ctx.save(); ctx.translate(f.x, f.y); if (f.dir === -1) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(hip.x, hip.y); // Body
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armL.x, armL.y); // ArmL
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armR.x, armR.y); // ArmR
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legL.x, legL.y); // LegL
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legR.x, legR.y); // LegR
    ctx.stroke();
    // Head
    ctx.beginPath(); ctx.arc(head.x, head.y, 6, 0, Math.PI * 2); ctx.fillStyle = f.color; ctx.fill();
    ctx.restore();
  },

  draw() {
    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#112'); grad.addColorStop(1, '#334');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    // ★ 地面と背景のグリッドを描画。これらは縮小しない。
    ctx.strokeStyle = '#556'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 260); ctx.lineTo(200, 260); ctx.stroke();
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i + (Date.now()/50)%20, 260); ctx.lineTo(i - 10 + (Date.now()/50)%20, 300); ctx.stroke(); }
    for(let i=0; i<300; i+=20) { ctx.strokeStyle = 'rgba(100,255,100,0.1)'; ctx.strokeRect(0, i, 200, 1); ctx.strokeRect(i, 0, 1, 300); }

    applyShake();

    // ★ ここからファイター描画。scale関数を使って縮小描画し、ステージを広く見せる
    ctx.save();
    ctx.scale(this.scale, 1); // 画面を横方向に縮小

    this.drawStickman(this.p1);
    this.drawStickman(this.p2);
    
    // パーティクルも縮小された座標系で描画
    drawParticles();
    
    ctx.restore(); // 元の描画スケールに戻す

    resetShake();

    // --- UI描画 (UIは縮小しない) ---
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 32); 
    // HPバー
    ctx.fillStyle = '#222'; ctx.fillRect(10, 5, 80, 8); ctx.fillRect(110, 5, 80, 8);
    ctx.fillStyle = this.p1.color; ctx.fillRect(10, 5, Math.max(0, this.p1.hp/this.p1.maxHp)*80, 8);
    ctx.fillStyle = this.p2.color; let p2HpW = Math.max(0, this.p2.hp/this.p2.maxHp)*80; ctx.fillRect(190 - p2HpW, 5, p2HpW, 8);

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText(this.p1.name, 10, 25);
    ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5.5), 25);
    
    // ★ 性格表示UI
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
