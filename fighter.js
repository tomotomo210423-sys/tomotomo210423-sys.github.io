// === ULTIMATE AI FIGHTER (Phase 9: UNITY LOGIC INTEGRATION) ===
const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0,
  p1: null, p2: null,
  stageWidth: 800, stageHeight: 500, groundY: 420,
  scale: 0.6, camX: 0, camY: 0,
  texts: [], vfx: [],
  
  // ==========================================
  // 1. 基盤データ（Enumsの代替）
  // ==========================================
  PassiveTypes: { NONE:0, VAMPIRE:1, DESPERATION:2, GIANT:3, NINJA:4 },
  Attributes: { NEUTRAL:0, FIRE:1, ICE:2, THUNDER:3 },
  BodyParts: { HEAD:0, TORSO:1, ARMS:2, LEGS:3 },
  AIStates: { ENEMY_FAR:0, ENEMY_DOWN:1, SELF_LOW_HP:2, DEFAULT:3 },

  // ==========================================
  // 2. カスタムAIデータ（セーブ対応）
  // ==========================================
  myAI: {
      name: SaveSys.data.playerName || 'AI-PROTOTYPE',
      // Body & Color
      body: { width: 1.0, height: 1.0, head: 1.0, color: '#0ff', aura: '#ff0' },
      // Physics
      weight: 100, massY: 0,
      partMultipliers: [2.0, 1.0, 0.5, 1.0], // HEAD, TORSO, ARMS, LEGS
      // Combat & Skills
      passive: 0, 
      skillKeys: ['jab', 'upper', 'smash', 'beam'],
      // Awakening
      awakening: { active: false, trigger: 'hp20', triggered: false },
      // AI Logic (Gambit System)
      gambits: {
          ENEMY_FAR: 'beam',
          SELF_LOW_HP: 'move_back',
          DEFAULT: 'attack_combo'
      },
      aggressiveness: 0.5
  },

  Skills: {
      jab:   {name:'ジャブ', dmg:15, kb:2,  range:35,  start:4,  act:10, rec:10, cd:15, vx:3,  type:'jab', attr:0},
      upper: {name:'アッパー', dmg:25, kb:2,  range:40,  start:7,  act:15, rec:20, cd:25, vx:5,  type:'upper', attr:0},
      smash: {name:'スマッシュ', dmg:50, kb:14, range:45,  start:14, act:20, rec:30, cd:40, vx:8,  type:'smash', attr:1},
      beam:  {name:'ビーム', dmg:40, kb:10, range:250, start:25, act:15, rec:40, cd:60, vx:-2, type:'beam', attr:3},
      meteor:{name:'メテオ', dmg:60, kb:18, range:45,  start:10, act:15, rec:30, cd:45, vx:6,  type:'meteor', attr:0}
  },

  // ==========================================
  // 3. エンジンコア
  // ==========================================
  init() { this.st = 'menu'; this.menuCur = 0; BGM.play('menu'); },

  startBattle() {
    this.st = 'intro'; this.timer = 0; this.texts = []; this.vfx = [];
    
    const createFighter = (isP2, data) => ({
      ...data, id: isP2?2:1, x: isP2?550:250, y: this.groundY, dir: isP2?-1:1,
      hp: 1000, maxHp: 1000, vx:0, vy:0, state:'idle', stateFrame:0, cd:0,
      guarding: false, justGuardWindow: 0, trail: [], combo: 0, hitCancel: false,
      isAwakened: false,
      // 内部計算用
      get curAtk() { return (this.isAwakened ? 1.5 : 1.0) * (this.passive === 2 && this.hp < 300 ? 1.5 : 1.0); },
      get curRes() { return (this.passive === 3 ? 1.2 : 1.0); }
    });

    this.p1 = createFighter(false, JSON.parse(JSON.stringify(this.myAI)));
    // P2はランダム生成
    this.p2 = createFighter(true, JSON.parse(JSON.stringify(this.myAI)));
    this.p2.name = "CPU-ULTIMATE"; this.p2.body.color = '#f55';

    this.camX = (this.p1.x + this.p2.x)/2 - 100/this.scale;
    this.camY = this.groundY - 150/this.scale;
    BGM.play('action');
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    if (this.st === 'menu') {
        if (keysDown.up) { this.menuCur = (this.menuCur - 1 + 2) % 2; playSnd('sel'); }
        if (keysDown.down) { this.menuCur = (this.menuCur + 1) % 2; playSnd('sel'); }
        if (keysDown.a) { if(this.menuCur===0) this.startBattle(); else this.st = 'lab'; }
        return;
    }
    if (this.st === 'lab') { /* ラボ画面は後述のUI拡張で実装 */ if(keysDown.b) this.st='menu'; return; }

    // --- バトル中 ---
    this.processFighter(this.p1, this.p2);
    this.processFighter(this.p2, this.p1);
    this.updateVFX();

    // 覚醒チェック
    [this.p1, this.p2].forEach(f => {
        if (!f.isAwakened && f.hp < 200) { 
            f.isAwakened = true; playSnd('combo'); screenShake(20);
            this.addText(f.x, f.y-60, "AWAKEN!!", f.body.aura);
            this.addVFX('shockwave', f.x, f.y, f.body.aura, {size:100, life:30});
        }
    });

    // カメラ
    let targetX = (this.p1.x + this.p2.x)/2 - (200/this.scale)/2;
    let targetY = (this.p1.y + this.p2.y)/2 - (300/this.scale)*0.6;
    this.camX += (targetX - this.camX) * 0.1; this.camY += (targetY - this.camY) * 0.1;

    if (this.p1.hp <= 0 || this.p2.hp <= 0) { this.st = 'result'; playSnd('combo'); }
  },

  processFighter(f, opp) {
    f.stateFrame++;
    if (f.cd > 0) f.cd -= (f.spd);

    // 物理
    f.x += f.vx; f.y += f.vy; f.vx *= 0.85;
    if (f.y < this.groundY) f.vy += 0.6; else { f.y = this.groundY; f.vy = 0; }
    f.x = Math.max(10, Math.min(this.stageWidth - 10, f.x));

    // ガンビットAIロジック
    if (f.state === 'idle' && f.cd <= 0) {
        let dist = Math.abs(f.x - opp.x);
        let condition = this.AIStates.DEFAULT;
        if (dist > 150) condition = this.AIStates.ENEMY_FAR;
        if (f.hp < 300) condition = this.AIStates.SELF_LOW_HP;

        let command = f.gambits[Object.keys(this.AIStates)[condition]];
        this.executeCommand(f, opp, command, dist);
    }

    // 攻撃演出
    if (f.state.startsWith('atk_')) {
        let s = this.Skills[f.state.split('_')[1]];
        if (f.stateFrame === s.start) this.createHitbox(f, s, opp);
        if (f.stateFrame > s.start + s.rec) { f.state = 'idle'; f.stateFrame = 0; }
    }
    
    // 残像
    if (Math.abs(f.vx) > 5 || f.isAwakened) {
        f.trail.unshift({x:f.x, y:f.y, f:f.stateFrame});
        if (f.trail.length > 6) f.trail.pop();
    } else if (f.trail.length > 0) f.trail.pop();
  },

  executeCommand(f, opp, cmd, dist) {
    if (cmd === 'beam') { f.state = 'atk_beam'; f.stateFrame = 0; f.cd = 60; }
    else if (cmd === 'move_back') { f.vx = -f.dir * 8; f.cd = 20; }
    else {
        if (dist < 40) { f.state = 'atk_jab'; f.stateFrame = 0; f.cd = 15; }
        else { f.vx = f.dir * 5; }
    }
  },

  createHitbox(attacker, skill, victim) {
    let dist = Math.abs(attacker.x - victim.x);
    if (dist < skill.range) {
        // 部位判定（簡易）
        let hitPart = this.BodyParts.TORSO;
        if (victim.y < this.groundY - 20) hitPart = this.BodyParts.LEGS;
        if (Math.random() > 0.8) hitPart = this.BodyParts.HEAD;

        // ダメージ計算（Unityロジック移植）
        let baseDmg = skill.dmg * attacker.curAtk;
        let partMul = victim.partMultipliers[hitPart];
        let finalDmg = (baseDmg * partMul) - (victim.weight - 100) * 0.1;
        
        // パッシブ（巨人の体）
        if (victim.passive === 3) finalDmg *= 0.8;

        victim.hp -= Math.max(1, finalDmg);
        victim.vx = attacker.dir * skill.kb * (1/victim.curRes);
        victim.state = 'hurt'; victim.stateFrame = 0;
        
        // パッシブ（吸血鬼）
        if (attacker.passive === 1) attacker.hp = Math.min(attacker.maxHp, attacker.hp + finalDmg * 0.2);

        this.addVFX('impact', victim.x, victim.y-20, attacker.body.color, {size: 30});
        if (hitPart === this.BodyParts.HEAD) this.addText(victim.x, victim.y-50, "CRITICAL!!", "#ff0");
        playSnd('hit');
    }
  },

  updateVFX() {
    for (let i = this.texts.length - 1; i >= 0; i--) { this.texts[i].life--; if (this.texts[i].life <= 0) this.texts.splice(i,1); }
    for (let i = this.vfx.length - 1; i >= 0; i--) { this.vfx[i].life--; if (this.vfx[i].life <= 0) this.vfx.splice(i,1); }
    if (typeof updateParticles === 'function') updateParticles();
  },

  // ==========================================
  // 4. レンダリング（多関節＆体型反映）
  // ==========================================
  draw() {
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, '#050510'); grad.addColorStop(1, '#101025');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);

    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(-this.camX, -this.camY);

    // 地面
    ctx.strokeStyle = '#334'; ctx.strokeRect(0, this.groundY, this.stageWidth, 100);

    [this.p1, this.p2].forEach(f => this.drawFighter(f));
    this.vfx.forEach(v => this.drawVFX(v));
    this.texts.forEach(t => { ctx.fillStyle=t.color; ctx.font="bold 20px monospace"; ctx.fillText(t.text, t.x-30, t.y); });

    ctx.restore();
    
    // UI
    this.drawUI();
  },

  drawFighter(f) {
    let b = f.body;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.dir === -1) ctx.scale(-1, 1);
    
    // ★ 覚醒オーラ
    if (f.isAwakened) {
        ctx.shadowBlur = 15; ctx.shadowColor = b.aura;
        this.addVFX('aura', f.x, f.y, b.aura, {life:1, size: 40});
    }

    // ★ Unityロジックの体型反映
    // 横幅(width), 縦幅(height), 頭(headSize)
    ctx.strokeStyle = b.color; ctx.lineWidth = 3;
    let hY = -35 * b.height;
    let headR = 7 * b.head;
    
    // 胴体
    ctx.beginPath();
    ctx.moveTo(0, hY + 5); ctx.lineTo(0, -5); // 背骨
    // 腕（横幅反映）
    ctx.moveTo(-15 * b.width, hY + 15); ctx.lineTo(15 * b.width, hY + 15);
    // 脚
    ctx.moveTo(0, -5); ctx.lineTo(-10 * b.width, 0);
    ctx.moveTo(0, -5); ctx.lineTo(10 * b.width, 0);
    ctx.stroke();

    // 頭
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(0, hY, headR, 0, Math.PI*2); ctx.fill();
    
    ctx.restore();
  },

  drawVFX(v) {
    ctx.globalAlpha = v.life / v.maxLife;
    ctx.fillStyle = v.color;
    if (v.type === 'impact') ctx.fillRect(v.x-v.size/2, v.y-v.size/2, v.size, v.size);
    if (v.type === 'shockwave') { ctx.strokeStyle=v.color; ctx.beginPath(); ctx.arc(v.x, v.y, v.size*(1-v.life/v.maxLife), 0, Math.PI*2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  },

  drawUI() {
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,200,40);
    [this.p1, this.p2].forEach((f, i) => {
        let x = i===0?10:110;
        ctx.fillStyle = '#333'; ctx.fillRect(x, 10, 80, 10);
        ctx.fillStyle = f.hp > 300 ? f.body.color : '#f00';
        ctx.fillRect(x, 10, (f.hp/1000)*80, 10);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
        ctx.fillText(f.name, x, 30);
    });
  }
};
