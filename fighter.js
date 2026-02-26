// === AUTO FIGHTER (Phase 4: LIMIT BREAK - Joints, Air Combat & Hyper VFX) ===
const AutoFighter = {
  st: 'intro', timer: 0,
  p1: null, p2: null,
  stageWidth: 300, 
  scale: 200 / 300, 
  texts: [], 
  vfx: [], // ★ 独自の超強化エフェクトシステム
  
  init() {
    this.st = 'intro';
    this.timer = 0;
    this.texts = [];
    this.vfx = [];
    
    // ★ スキルデータ（打ち上げ技とメテオを追加）
    const Skills = {
       jab: {name:'ジャブ', dmg: 20, kb: 3, range: 30, start: 5, act: 10, rec: 15, cd: 20, vx: 3, hitType: 'jab'},
       smash: {name:'スマッシュ', dmg: 60, kb: 12, range: 35, start: 12, act: 20, rec: 35, cd: 40, vx: 7, hitType: 'smash'},
       upper: {name:'アッパー', dmg: 40, kb: 4, range: 35, start: 8, act: 15, rec: 25, cd: 30, vx: 4, hitType: 'upper'}, // 相手を上に浮かせる
       meteor: {name:'メテオ', dmg: 70, kb: 15, range: 40, start: 10, act: 15, rec: 30, cd: 45, vx: 5, hitType: 'meteor'}, // 空中から叩き落とす
       counter: {name:'カウンター', dmg: 90, kb: 15, range: 45, start: 4, act: 15, rec: 20, cd: 0, vx: 8, hitType: 'counter'} 
    };

    const createFighter = (isP2, personality) => ({
      id: isP2 ? 2 : 1,
      x: isP2 ? 240 : 60, y: 260, 
      dir: isP2 ? -1 : 1, 
      hp: 1000, maxHp: 1000,
      atk: isP2 ? 1.2 : 1.0, res: isP2 ? 0.8 : 1.0, spd: isP2 ? 0.9 : 1.1, 
      personality: personality,
      skills: [Skills.jab, Skills.smash, Skills.upper, Skills.meteor],
      counterSkill: Skills.counter,
      state: 'idle', stateFrame: 0, cd: 0,
      color: isP2 ? '#f0f' : '#0ff', 
      name: isP2 ? 'BETA-' + personality : 'ALPHA-' + personality,
      vx: 0, vy: 0, guarding: false, justGuardWindow: 0, trail: [], regenTimer: 0
    });
    
    this.p1 = createFighter(false, 'agressive');
    this.p2 = createFighter(true, 'tactical');
    BGM.play('action');
  },

  addText(x, y, text, color) { this.texts.push({x, y, text, color, life: 40}); },
  
  // ★ ド派手なVFXを追加する関数
  addVFX(type, x, y, color, extra={}) {
      this.vfx.push({type, x, y, color, life: extra.life||20, maxLife: extra.life||20, ...extra});
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    if (this.st === 'intro') { this.timer++; if (this.timer > 60) { this.st = 'battle'; playSnd('jmp'); } return; }
    if (this.st === 'result') { if (keysDown.a) this.init(); return; }

    // 押し出し判定
    let dist = Math.abs(this.p1.x - this.p2.x);
    if (dist < 15) {
        if (this.p1.x === this.p2.x) { this.p1.x -= 1; this.p2.x += 1; }
        else { let push = (15 - dist) / 2; this.p1.x += (this.p1.x < this.p2.x) ? -push : push; this.p2.x += (this.p2.x < this.p1.x) ? -push : push; }
    }

    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    
    // テキスト更新
    for (let i = this.texts.length - 1; i >= 0; i--) {
        this.texts[i].life--; this.texts[i].y -= 0.5;
        if (this.texts[i].life <= 0) this.texts.splice(i, 1);
    }

    // ★ VFXの更新
    for (let i = this.vfx.length - 1; i >= 0; i--) {
        let v = this.vfx[i]; v.life--;
        if (v.type === 'slash') { v.x += v.vx || 0; v.y += v.vy || 0; }
        if (v.life <= 0) this.vfx.splice(i, 1);
    }

    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); screenShake(10); }
  },

  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.spd);

    if ((f.state === 'idle' || f.state === 'guard') && f.hp < f.maxHp) {
        f.regenTimer++; if (f.regenTimer > 30) { f.hp = Math.min(f.maxHp, f.hp + 5); f.regenTimer = 0; }
    } else { f.regenTimer = 0; }

    // 物理演算（重力と摩擦）
    f.x += f.vx; f.y += f.vy;
    f.vx *= 0.85; 
    if (f.y < 260) { f.vy += 0.6; } else { f.y = 260; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    // 残像（軌跡）の記録
    if (Math.abs(f.vx) > 4 || Math.abs(f.vy) > 4 || f.state.startsWith('atk_')) {
        f.trail.unshift({x: f.x, y: f.y, dir: f.dir, state: f.state, frame: f.stateFrame});
        if(f.trail.length > 5) f.trail.pop();
    } else if (f.trail.length > 0) { f.trail.pop(); }

    // 振り向き制御
    if (f.state === 'idle' || f.state === 'move') { f.dir = (opp.x > f.x) ? 1 : -1; }

    if (f.state === 'hurt') { if (f.stateFrame > 25) { f.state = 'idle'; f.stateFrame = 0; } return; }
    if (f.state === 'guard') { 
        if (f.justGuardWindow > 0) f.justGuardWindow--;
        if (f.stateFrame > 25) { f.state = 'idle'; f.stateFrame = 0; f.guarding = false; } 
        return; 
    }
    if (f.state === 'stunned') { if (f.stateFrame > 40) { f.state = 'idle'; f.stateFrame = 0; } return; }

    // 攻撃処理
    if (f.state.startsWith('atk_')) {
      const sName = f.state.split('_')[1];
      const skill = sName === 'counter' ? f.counterSkill : f.skills.find(s => s.hitType === sName);
      
      if (skill) {
         if (f.stateFrame === Math.floor(skill.start)) { 
             this.createHitbox(f, skill, opp); 
             // ★ 攻撃時の軌跡エフェクト（スウィッシュ）
             let angle = f.dir === 1 ? 0 : Math.PI;
             if (sName === 'upper') angle -= (Math.PI/4) * f.dir;
             if (sName === 'meteor') angle += (Math.PI/4) * f.dir;
             this.addVFX('slash', f.x + 15*f.dir, f.y - 20, f.color, {size: skill.range, angle: angle, width: 8, vx: f.vx*0.5, vy: f.vy*0.5});
         }
         if (f.stateFrame > (skill.start + skill.rec)) { f.state = 'idle'; f.stateFrame = 0; }
      }
      return;
    }
    
    // --- ★ 空中戦対応 AI ロジック ---
    if (f.state === 'idle' && f.cd <= 0) {
      let d = Math.abs(f.x - opp.x);
      let rand = Math.random();
      let shouldAttack = false;
      let moveDir = f.dir;
      let isAir = f.y < 250;
      let oppIsAir = opp.y < 250;

      // 相手の攻撃へのリアクション
      if (opp.state.startsWith('atk_') && d < 60 && !isAir) {
         if (rand < (f.personality === 'defensive' ? 0.8 : 0.4)) {
             if (Math.random() < 0.3 && d > 20) {
                 f.state = 'move'; f.stateFrame = 0; f.vx = -f.dir * 12; f.cd = 10;
                 this.addVFX('shockwave', f.x, f.y, '#fff', {size: 20, life: 10});
                 playSnd('sel'); this.addText(f.x, f.y - 40, "DODGE", "#ccc"); return;
             } else {
                 f.state = 'guard'; f.stateFrame = 0; f.guarding = true; f.justGuardWindow = 8; return;
             }
         }
      }

      // ★ 空中戦（エリアル）ロジック
      if (oppIsAir && !isAir && d < 50 && rand < 0.6) {
          // 相手が浮いているなら自分もジャンプして追撃！
          f.state = 'move'; f.stateFrame = 0; f.vy = -14; f.vx = f.dir * 4; f.cd = 5; return;
      }

      if (isAir) {
          // 自分が空中にいる時はメテオを狙う
          if (d < 40 && rand < 0.7) {
              f.state = 'atk_meteor'; f.stateFrame = 0; f.cd = 20; f.vy = 2; f.vx = f.dir * 3; return;
          }
      } else {
          // 地上の立ち回り
          if (f.personality === 'agressive') { if (d < 40) shouldAttack = true; else moveDir = f.dir; } 
          else if (f.personality === 'tactical') { if (d < 35) shouldAttack = true; else if (d > 70) moveDir = f.dir; else moveDir = 0; }
          else if (f.personality === 'defensive') { if (d < 25) shouldAttack = true; else moveDir = -f.dir; }

          if (shouldAttack && rand < 0.8) {
             // 距離に応じてジャブ、スマッシュ、アッパーを使い分ける
             let skillName = d < 25 ? (rand < 0.5 ? 'jab' : 'upper') : 'smash';
             f.state = 'atk_' + skillName; f.stateFrame = 0;
             f.vx = f.dir * f.skills.find(s=>s.hitType===skillName).vx; 
             f.cd = f.skills.find(s=>s.hitType===skillName).cd;
          } 
          else if (moveDir !== 0 && rand < (f.spd * 0.15)) { 
             f.state = 'move'; f.stateFrame = 0; f.vx = moveDir * 4;
          }
      }
    }

    if (f.state === 'move' && Math.abs(f.vx) < 0.5 && f.y >= 260) { f.state = 'idle'; f.stateFrame = 0; }
  },

  createHitbox(attacker, skill, victim) {
    let vDist = Math.abs(victim.x - attacker.x);
    let inFront = (victim.x - attacker.x) * attacker.dir >= -15; 
    let yDist = Math.abs(victim.y - attacker.y); // Y軸の判定も追加

    if (victim.state !== 'hurt' && inFront && vDist <= skill.range + 10 && yDist < 40) {
       
       // パリィ判定
       if (victim.guarding && victim.justGuardWindow > 0) {
           playSnd('sel'); screenShake(6); if(typeof hitStop !== 'undefined') hitStop(8);
           this.addVFX('impact', victim.x, victim.y-20, '#0ff', {size: 40});
           this.addText(victim.x, victim.y - 40, "PARRY!", "#0ff");
           attacker.state = 'stunned'; attacker.stateFrame = 0; attacker.vx = -attacker.dir * 4;
           victim.state = 'atk_counter'; victim.stateFrame = 0; victim.guarding = false; victim.vx = victim.dir * victim.counterSkill.vx;
           return; 
       }

       let damage = skill.dmg * attacker.atk;
       let kbForce = skill.kb * attacker.atk * (victim.guarding ? 0.2 : victim.res);
       victim.hp -= damage;
       
       if (victim.guarding) { 
           playSnd('sel'); screenShake(2); victim.vx = attacker.dir * kbForce; 
           this.addVFX('impact', victim.x, victim.y-15, '#888', {size: 15, life: 10});
       } else {
           victim.state = 'hurt'; victim.stateFrame = 0;
           victim.vx = attacker.dir * kbForce; 
           
           // ★ 技ごとの特殊な吹き飛び（Z軸方向）
           if (skill.hitType === 'upper' || skill.hitType === 'counter') victim.vy = -12; // 大きく打ち上げる
           else if (skill.hitType === 'meteor') victim.vy = 15; // 地面に叩きつける
           else if (skill.kb > 10) victim.vy = -5 - (Math.random()*2); 
           
           let hx = attacker.x + (vDist/2)*attacker.dir; let hy = victim.y - 15;
           
           // ★ ヒットエフェクトの極限強化
           if (skill.hitType === 'jab') {
              playSnd('hit'); screenShake(3); if(typeof hitStop !== 'undefined') hitStop(3); 
              this.addVFX('impact', hx, hy, '#fff', {size: 25});
           } else if (skill.hitType === 'counter') {
              playSnd('combo'); screenShake(15); if(typeof hitStop !== 'undefined') hitStop(12); 
              this.addVFX('impact', hx, hy, '#f0f', {size: 60});
              this.addVFX('shockwave', hx, hy, attacker.color, {size: 80});
              this.addText(hx, hy - 30, "COUNTER!!", "#f0f");
           } else {
              playSnd('combo'); screenShake(10); if(typeof hitStop !== 'undefined') hitStop(6); 
              this.addVFX('impact', hx, hy, '#ff0', {size: 40});
              this.addVFX('slash', hx, hy, '#fff', {size: 30, angle: Math.random()*Math.PI*2, width: 4}); // 飛び散る火花
           }
       }
    }
  },

  // ★ 関節(IK風)アニメーションによる超絶ヌルヌル描画システム
  drawStickman(f, alpha = 1, isTrail = false) {
    ctx.strokeStyle = isTrail ? f.color : '#fff'; // 本体は白枠、残像はオーラ色
    ctx.lineWidth = isTrail ? 2 : 2.5; 
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha;
    
    // 各関節のローカル座標定義 (首を原点とする)
    let p = { h:{x:0,y:-12}, n:{x:0,y:0}, hip:{x:0,y:15}, sL:{x:-4,y:2}, sR:{x:4,y:2}, eL:{x:-8,y:10}, eR:{x:8,y:10}, hL:{x:-12,y:20}, hR:{x:12,y:20}, kL:{x:-4,y:25}, kR:{x:4,y:25}, fL:{x:-6,y:40}, fR:{x:6,y:40} };

    let sf = isTrail ? f.frame : f.stateFrame; // 残像用フレーム対応

    // ★ 状態ごとの関節移動（数学的補間で滑らかに）
    if (f.state === 'idle') { 
        let t = Date.now()/200; p.h.y += Math.sin(t); p.n.y += Math.sin(t); p.hL.y += Math.sin(t+1)*2; p.hR.y += Math.sin(t+1)*2; p.hip.y += 2; p.kL.x -= 2; p.kR.x += 2; p.kL.y -= 2; p.kR.y -= 2;
    } 
    else if (f.state === 'move') { 
        if (f.y < 260) { // ジャンプ・落下中
            p.hL.y -= 20; p.hR.y -= 20; p.eL.y -= 10; p.eR.y -= 10; p.kL.y -= 15; p.kR.y -= 5; p.fL.y -= 15; p.h.x += 5;
        } else { // ダッシュ
            let run = Math.sin(sf * 0.5) * 12;
            p.hL.x = -run; p.hR.x = run; p.eL.x = -run/2; p.eR.x = run/2; p.fL.x = run; p.fR.x = -run; p.kL.x = run/2; p.kR.x = -run/2; p.h.x += 5; p.n.x += 5; p.hip.x += 3;
        }
    }
    else if (f.state === 'atk_jab') { 
        if (sf < 5) { p.hR={x:-5,y:10}; p.eR={x:0,y:15}; p.h.x-=2; } 
        else if (sf < 15) { p.hR={x:30,y:0}; p.eR={x:15,y:5}; p.sR.x+=5; p.h.x+=5; p.fR.x+=10; } 
    }
    else if (f.state === 'atk_smash') { 
        if (sf < 12) { p.hR={x:-15,y:-20}; p.eR={x:-5,y:-10}; p.h.x-=5; p.hip.x-=5; p.kL.x-=5; } 
        else { p.hR={x:35,y:15}; p.eR={x:20,y:10}; p.h.x+=10; p.hip.x+=8; p.fL.x-=15; p.fR.x+=15; p.kR.x+=10; p.kR.y+=5; } 
    }
    else if (f.state === 'atk_upper') { // 浮かせ技
        if (sf < 8) { p.hR={x:-5,y:25}; p.eR={x:5,y:20}; p.hip.y+=5; p.h.y+=5; p.kL.x-=5; p.kR.x+=5; } 
        else { p.hR={x:15,y:-25}; p.eR={x:10,y:-10}; p.h.y-=5; p.h.x+=5; p.fL.y-=5; p.fR.y-=5; } 
    }
    else if (f.state === 'atk_meteor') { // 叩き落とし
        if (sf < 10) { p.hL={x:0,y:-25}; p.hR={x:0,y:-25}; p.eL={x:-10,y:-15}; p.eR={x:10,y:-15}; p.fL.y-=10; p.fR.y-=10; p.kL.y-=10; p.kR.y-=10; } 
        else { p.hL={x:25,y:25}; p.hR={x:25,y:25}; p.eL={x:15,y:15}; p.eR={x:15,y:15}; p.h.x+=10; p.h.y+=5; p.hip.y+=5; p.kL.x-=5; } 
    }
    else if (f.state === 'atk_counter') { // パリィ専用
        if (sf < 4) { p.hR={x:-20,y:15}; p.h.y+=5; p.hip.y+=5; p.kL.x-=8; p.kR.x+=8; } 
        else { p.hR={x:25,y:-30}; p.h.x+=10; p.fR.x+=15; p.fR.y-=5; p.fL.x-=5; } 
    }
    else if (f.state === 'hurt') { 
        p.h={x:-10,y:-5}; p.hip={x:5,y:10}; p.sL={x:-10,y:5}; p.sR={x:-5,y:5}; p.eL={x:-15,y:15}; p.eR={x:-5,y:15}; p.hL={x:-20,y:25}; p.hR={x:-10,y:25}; p.fL={x:10,y:30}; p.fR={x:-5,y:35}; p.kL={x:15,y:20}; 
    }
    else if (f.state === 'stunned') { 
        p.h={x:-15,y:5}; p.hip={x:0,y:15}; p.hL={x:-5,y:30}; p.hR={x:5,y:30}; p.kL={x:10,y:30}; p.fL={x:15,y:40}; 
    }
    else if (f.state === 'guard') { 
        p.hL={x:10,y:-5}; p.hR={x:10,y:5}; p.eL={x:5,y:5}; p.eR={x:5,y:10}; p.h.y+=3; p.hip.y+=5; p.kL.x-=5; p.kR.x+=5; 
        if(!isTrail && f.justGuardWindow > 0) { ctx.shadowBlur = 15; ctx.shadowColor = '#0ff'; ctx.strokeStyle = '#0ff'; } // パリィ受付中は発光
    }

    ctx.save(); ctx.translate(f.x, f.y - 20); if (f.dir === -1) ctx.scale(-1, 1);
    
    // ★ 本体のみ、キャラの色の「オーラ」を背後に描く
    if (!isTrail && (f.state.startsWith('atk_') || f.state === 'move')) {
        ctx.shadowBlur = 10; ctx.shadowColor = f.color;
    }

    ctx.beginPath();
    ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.hip.x, p.hip.y); // 胴体
    ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sL.x, p.sL.y); ctx.lineTo(p.eL.x, p.eL.y); ctx.lineTo(p.hL.x, p.hL.y); // 左腕
    ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sR.x, p.sR.y); ctx.lineTo(p.eR.x, p.eR.y); ctx.lineTo(p.hR.x, p.hR.y); // 右腕
    ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kL.x, p.kL.y); ctx.lineTo(p.fL.x, p.fL.y); // 左脚
    ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kR.x, p.kR.y); ctx.lineTo(p.fR.x, p.fR.y); // 右脚
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(p.h.x, p.h.y, 6, 0, Math.PI * 2); 
    ctx.fillStyle = isTrail ? f.color : '#fff'; ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
  },

  draw() {
    // ヒットストップ中の背景色反転（超激しい演出用）
    let isHitStop = typeof hitStopTimer !== 'undefined' && hitStopTimer > 3;
    const grad = ctx.createLinearGradient(0, 0, 0, 300); 
    if (isHitStop) { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#ccc'); }
    else { grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#202030'); }
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);
    
    // 背景グリッド
    ctx.strokeStyle = isHitStop ? '#000' : '#445'; ctx.lineWidth = 1; 
    ctx.beginPath(); ctx.moveTo(0, 260); ctx.lineTo(200, 260); ctx.stroke();
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i + (Date.now()/50)%20, 260); ctx.lineTo(i - 10 + (Date.now()/50)%20, 300); ctx.stroke(); }
    for(let i=0; i<300; i+=20) { ctx.strokeStyle = isHitStop ? 'rgba(0,0,0,0.1)' : 'rgba(100,255,100,0.05)'; ctx.strokeRect(0, i, 200, 1); ctx.strokeRect(i, 0, 1, 300); }

    applyShake();
    ctx.save(); ctx.scale(this.scale, 1); 

    // 残像（軌跡）
    [this.p1, this.p2].forEach(f => {
        for(let i=0; i<f.trail.length; i++) {
            let tr = f.trail[i]; let tempF = {...f, x: tr.x, y: tr.y, dir: tr.dir, state: tr.state, frame: tr.frame};
            this.drawStickman(tempF, 0.4 - (i*0.08), true);
        }
    });

    // ファイター本体
    if(!isHitStop || this.p1.state === 'hurt' || this.p1.state === 'atk_counter') this.drawStickman(this.p1);
    if(!isHitStop || this.p2.state === 'hurt' || this.p2.state === 'atk_counter') this.drawStickman(this.p2);
    
    // ★ VFXの描画（斬撃、衝撃波、ヒットスパーク）
    this.vfx.forEach(v => {
        let ratio = v.life / v.maxLife; ctx.globalAlpha = ratio;
        if (v.type === 'slash') {
            ctx.strokeStyle = v.color; ctx.lineWidth = v.width * ratio; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.arc(v.x, v.y, v.size, v.angle - 0.8*ratio, v.angle + 0.8*ratio); ctx.stroke();
        } else if (v.type === 'impact') {
            ctx.fillStyle = isHitStop ? '#000' : v.color; ctx.beginPath();
            let s = v.size * Math.pow((1 - ratio), 0.5) + 5; // 鋭く広がる
            ctx.moveTo(v.x, v.y - s); ctx.lineTo(v.x + s/4, v.y - s/4); ctx.lineTo(v.x + s, v.y); ctx.lineTo(v.x + s/4, v.y + s/4);
            ctx.lineTo(v.x, v.y + s); ctx.lineTo(v.x - s/4, v.y + s/4); ctx.lineTo(v.x - s, v.y); ctx.lineTo(v.x - s/4, v.y - s/4);
            ctx.fill();
        } else if (v.type === 'shockwave') {
            ctx.strokeStyle = isHitStop ? '#000' : v.color; ctx.lineWidth = 3 * ratio;
            ctx.beginPath(); ctx.arc(v.x, v.y, v.size * (1-ratio)*2 + 10, 0, Math.PI*2); ctx.stroke();
        }
    });
    ctx.globalAlpha = 1;

    // ポップアップテキスト
    for (let t of this.texts) {
        ctx.fillStyle = isHitStop ? '#000' : t.color; ctx.font = 'bold 18px monospace'; ctx.globalAlpha = t.life / 40;
        ctx.fillText(t.text, t.x - 20, t.y); ctx.globalAlpha = 1;
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
    ctx.fillStyle = '#888'; ctx.font = '8px monospace';
    ctx.fillText(`spd:${this.p1.spd} atk:${this.p1.atk}`, 10, 35); ctx.fillText(`spd:${this.p2.spd} atk:${this.p2.atk}`, 190 - (18*5), 35);

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
