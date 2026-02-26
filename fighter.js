// === AUTO FIGHTER (Phase 1: Stickman Auto Battle Prototype) ===
const AutoFighter = {
  st: 'intro', timer: 0,
  p1: null, p2: null,
  hitboxes: [],
  
  init() {
    this.st = 'intro';
    this.timer = 0;
    this.hitboxes = [];
    
    // ファイターの初期化設定
    const createFighter = (isP2) => ({
      x: isP2 ? 160 : 40, y: 260, 
      dir: isP2 ? -1 : 1, // 1:右向き, -1:左向き
      hp: 1000, maxHp: 1000,
      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', // P1は水色、P2はピンク
      name: isP2 ? 'AI-BETA' : 'AI-ALPHA',
      vx: 0, vy: 0
    });
    
    this.p1 = createFighter(false);
    this.p2 = createFighter(true);
    BGM.play('action');
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'intro') {
      this.timer++;
      if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); }
      return;
    }

    if (this.st === 'result') {
      if (keysDown.a) this.init(); // Aボタンでリマッチ
      return;
    }

    // --- バトルメイン処理 ---
    this.hitboxes = [];
    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    
    // 勝敗判定
    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      this.st = 'result';
      playSnd('combo'); screenShake(10);
    }
  },

  // 各ファイターのAI思考と動きの処理
  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd--;

    // 物理演算（摩擦とノックバック）
    f.x += f.vx; f.y += f.vy;
    f.vx *= 0.8; 
    if (f.y < 260) { f.vy += 0.5; } else { f.y = 260; f.vy = 0; }
    f.x = Math.max(10, Math.min(190, f.x)); // 画面端の壁

    // 常に相手の方を向く（攻撃中・やられ中以外）
    if (f.state === 'idle' || f.state === 'move') {
      f.dir = (opp.x > f.x) ? 1 : -1;
    }

    // やられ状態の回復
    if (f.state === 'hurt') {
      if (f.stateFrame > 15) { f.state = 'idle'; f.stateFrame = 0; }
      return; // やられ中は行動できない
    }

    // 攻撃のモーション処理と当たり判定発生
    if (f.state === 'atk_jab') {
      if (f.stateFrame === 5) { // 発生5フレーム目
         this.createHitbox(f, 20, 15, 30, 'jab', opp);
      }
      if (f.stateFrame > 15) { f.state = 'idle'; f.stateFrame = 0; }
      return;
    }
    
    if (f.state === 'atk_smash') {
      if (f.stateFrame === 12) { // 発生12フレーム目（遅い）
         f.vx = f.dir * 5; // 踏み込み
         this.createHitbox(f, 25, 30, 80, 'smash', opp);
      }
      if (f.stateFrame > 35) { f.state = 'idle'; f.stateFrame = 0; }
      return;
    }

    // --- AIの行動決定ロジック ---
    if (f.state === 'idle' && f.cd <= 0) {
      let dist = Math.abs(f.x - opp.x);
      
      // 距離が遠い場合 -> ダッシュで近づく
      if (dist > 40) {
        f.state = 'move'; f.stateFrame = 0;
        f.vx = f.dir * 4;
        f.cd = 10;
      } 
      // 距離が近い場合 -> 確率で技を振る
      else {
        let rand = Math.random();
        f.stateFrame = 0;
        if (rand < 0.6) {
           f.state = 'atk_jab'; f.cd = 20;
        } else {
           f.state = 'atk_smash'; f.cd = 40;
        }
      }
    }

    // 移動状態の終了
    if (f.state === 'move' && Math.abs(f.vx) < 0.5) {
      f.state = 'idle'; f.stateFrame = 0;
    }
  },

  // 攻撃判定の生成とヒット処理
  createHitbox(attacker, range, size, dmg, type, victim) {
    let hx = attacker.x + (range * attacker.dir);
    let hy = attacker.y - 15;
    
    // 当たり判定の描画用（デバッグ・演出）
    this.hitboxes.push({x: hx, y: hy, s: size});

    // ヒットチェック（相手のX座標との距離）
    if (victim.state !== 'hurt' && Math.abs(victim.x - hx) < size + 10) {
       victim.hp -= dmg;
       victim.state = 'hurt'; victim.stateFrame = 0;
       
       // 技ごとのヒット演出
       if (type === 'jab') {
          victim.vx = attacker.dir * 2;
          playSnd('hit'); screenShake(3); 
          if(typeof hitStop !== 'undefined') hitStop(2);
          addParticle(hx, hy, '#fff', 'star');
       } else if (type === 'smash') {
          victim.vx = attacker.dir * 8; // 大きく吹っ飛ぶ
          victim.vy = -3;
          playSnd('hit'); screenShake(8); 
          if(typeof hitStop !== 'undefined') hitStop(5);
          addParticle(hx, hy, '#ff0', 'explosion');
       }
    }
  },

  // 棒人間の動的描画（関節アニメーション）
  drawStickman(f) {
    ctx.strokeStyle = f.color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 基本の関節位置（相対座標）
    let head = {x: 0, y: -30};
    let neck = {x: 0, y: -20};
    let hip = {x: 0, y: -5};
    let armL = {x: -10, y: -10}, armR = {x: 10, y: -10};
    let legL = {x: -8, y: 10}, legR = {x: 8, y: 10};

    // 状態によるポーズの変化
    if (f.state === 'idle') {
      let breath = Math.sin(Date.now() / 200) * 2;
      head.y += breath; neck.y += breath;
      armL.y += breath; armR.y += breath;
    } 
    else if (f.state === 'move') {
      let run = Math.sin(f.stateFrame * 0.5) * 10;
      armL.x = -run; armR.x = run;
      legL.x = run; legR.x = -run;
      head.x += 5; neck.x += 3; // 前のめり
    }
    else if (f.state === 'atk_jab') {
      if (f.stateFrame < 10) { armR = {x: 25, y: -20}; armL = {x: 5, y: -15}; head.x += 5; } // 突き出し
      else { armR = {x: 10, y: -15}; } // 戻し
    }
    else if (f.state === 'atk_smash') {
      if (f.stateFrame < 12) { armR = {x: -15, y: -35}; head.x -= 5; } // 振りかぶり
      else if (f.stateFrame < 25) { armR = {x: 30, y: -5}; head.x += 10; hip.x += 5; legL.x -= 10; legR.x += 15;} // 振り下ろし
      else { armR = {x: 15, y: -5}; } // 残心
    }
    else if (f.state === 'hurt') {
      head = {x: -10, y: -25}; neck = {x: -5, y: -15}; hip = {x: 5, y: -5};
      armL = {x: -15, y: -25}; armR = {x: 5, y: -20};
      legL = {x: 10, y: 5}; legR = {x: -5, y: 10};
    }

    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.dir === -1) ctx.scale(-1, 1); // 左向きの場合は反転

    // 描画実行
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(hip.x, hip.y); // 胴体
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armL.x, armL.y); // 左腕
    ctx.moveTo(neck.x, neck.y); ctx.lineTo(armR.x, armR.y); // 右腕
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legL.x, legL.y); // 左脚
    ctx.moveTo(hip.x, hip.y); ctx.lineTo(legR.x, legR.y); // 右脚
    ctx.stroke();

    // 頭（塗りつぶし）
    ctx.beginPath();
    ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();

    ctx.restore();
  },

  draw() {
    // 背景
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, '#112'); grad.addColorStop(1, '#334');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    // 地面
    ctx.strokeStyle = '#556'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 260); ctx.lineTo(200, 260); ctx.stroke();
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i + (Date.now()/50)%20, 260); ctx.lineTo(i - 10 + (Date.now()/50)%20, 300); ctx.stroke(); }

    applyShake();

    // ファイターの描画
    this.drawStickman(this.p1);
    this.drawStickman(this.p2);

    // ヒットエフェクト（一瞬だけ描画）
    for (let hb of this.hitboxes) {
       ctx.beginPath(); ctx.arc(hb.x, hb.y, hb.s, 0, Math.PI * 2);
       ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    }
    
    drawParticles();
    resetShake();

    // --- UI描画 ---
    // HPバー枠
    ctx.fillStyle = '#222'; ctx.fillRect(10, 10, 80, 8); ctx.fillRect(110, 10, 80, 8);
    // HPバー中身
    ctx.fillStyle = this.p1.color; ctx.fillRect(10, 10, Math.max(0, this.p1.hp/this.p1.maxHp)*80, 8);
    ctx.fillStyle = this.p2.color; 
    let p2HpW = Math.max(0, this.p2.hp/this.p2.maxHp)*80;
    ctx.fillRect(190 - p2HpW, 10, p2HpW, 8); // 右から減るように

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText(this.p1.name, 10, 28);
    ctx.fillText(this.p2.name, 190 - (this.p2.name.length*5), 28);

    // 演出テキスト
    if (this.st === 'intro') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 130, 200, 40);
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace';
      ctx.fillText('GET READY...', 50, 155);
    } 
    else if (this.st === 'result') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 120, 200, 60);
      ctx.fillStyle = '#f0f'; ctx.font = 'bold 18px monospace';
      let winner = this.p1.hp > 0 ? this.p1.name : this.p2.name;
      ctx.fillText(winner + ' WIN!', 30, 145);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText('Press (A) to Rematch', 40, 165);
    }

    ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('SELECT: 戻る', 65, 290);
  }
};
