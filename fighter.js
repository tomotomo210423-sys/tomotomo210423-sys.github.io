// === AUTO FIGHTER (Phase 8-1: ULTIMATE AI LABORATORY) ===

// 1. 基盤となる列挙型（定数）の定義
const PassiveType = { NONE: 'なし', VAMPIRE: '吸血鬼', DESPERATION: '背水の陣', GIANT: '巨人の体', NINJA: '忍' };
const IntroType = { DROP: 'メテオ落下', WARP: '瞬間移動', TAUNT: '挑発' };
const AtkAttr = { NEUTRAL: '無属性', FIRE: '炎', ICE: '氷', THUNDER: '雷' };
const AwakenCondition = { NONE: 'なし', HP_UNDER_20: 'HP20%以下', TIME_60S: '60秒経過' };

const AutoFighter = {
  st: 'menu', menuCur: 0, timer: 0,
  
  // ★ 究極のAIデータ構造（C#の設計図をJSに翻訳）
  myAI: {
      name: 'ULTIMA-AI',
      
      // Part 1: Body & Physics
      body: { width: 1.0, height: 1.0, head: 1.0 },
      color: { body: '#0ff', aura: '#ff0' },
      physics: { weight: 100, centerOfMassY: 0 },
      
      // ベースステータス（コスト制用）
      base: { hp: 1000, atk: 1.0, res: 1.0, spd: 1.0 },
      
      // Part 2: Passives & Intro
      passive: PassiveType.NONE,
      intro: IntroType.WARP,
      
      // Part 3: Awakening
      awakening: {
          condition: AwakenCondition.HP_UNDER_20,
          color: { body: '#000', aura: '#f00' },
          passive: PassiveType.DESPERATION
      },
      
      // AI Logic (ガンビットは第2回で実装)
      aggro: 0.5, guardRate: 0.2, dodgeRate: 0.2, prefRange: 40,
      
      skillKeys: ['jab', 'upper', 'smash', 'meteor']
  },

  // 育成UI用の変数
  labSt: 'main', labCur: 0, labVals: [0, 0, 0], // 体型変更などの一時保存用

  init() { 
      this.st = 'menu'; this.menuCur = 0; 
      BGM.play('menu'); 
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }

    // --- メインメニュー ---
    if (this.st === 'menu') {
        if (keysDown.up) { this.menuCur = (this.menuCur - 1 + 2) % 2; playSnd('sel'); }
        if (keysDown.down) { this.menuCur = (this.menuCur + 1) % 2; playSnd('sel'); }
        if (keysDown.a) {
            playSnd('jmp');
            if (this.menuCur === 0) { 
                // バトル開始（第3回で実装）
                alert("バトルシステムは現在改修中じゃ！育成を試してくれい！");
            }
            else { 
                // 究極のAIラボへ
                this.st = 'lab_main'; this.labCur = 0; 
            }
        }
        return;
    }

    // --- 究極のAIラボ（メインメニュー） ---
    if (this.st === 'lab_main') {
        const labItems = ['体型＆カラー設定', 'パッシブ＆覚醒', 'ステータス調整', '戻る'];
        if (keysDown.up) { this.labCur = (this.labCur - 1 + labItems.length) % labItems.length; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % labItems.length; playSnd('sel'); }
        if (keysDown.a) {
            playSnd('hit');
            if (this.labCur === 0) { this.st = 'lab_body'; this.labCur = 0; }
            else if (this.labCur === 1) { this.st = 'lab_awaken'; this.labCur = 0; }
            else if (this.labCur === 2) { this.st = 'lab_stats'; this.labCur = 0; }
            else { this.st = 'menu'; this.menuCur = 0; }
        }
        if (keysDown.b) { this.st = 'menu'; playSnd('hit'); }
        return;
    }

    // --- 体型＆カラー設定 ---
    if (this.st === 'lab_body') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 4) % 4; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 4; playSnd('sel'); }
        if (keysDown.b) { this.st = 'lab_main'; this.labCur = 0; playSnd('hit'); return; }

        let valChange = 0;
        if (keys.left) valChange = -0.05;
        if (keys.right) valChange = 0.05;

        if (valChange !== 0) {
            if (this.labCur === 0) this.myAI.body.width = Math.max(0.5, Math.min(2.0, this.myAI.body.width + valChange));
            if (this.labCur === 1) this.myAI.body.height = Math.max(0.5, Math.min(2.0, this.myAI.body.height + valChange));
            if (this.labCur === 2) this.myAI.physics.weight = Math.max(50, Math.min(200, this.myAI.physics.weight + valChange * 100));
            // 色はとりあえずランダム変更（後で詳細パレット化可能）
            if (this.labCur === 3 && keysDown.right) this.myAI.color.body = '#' + Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0');
        }
        return;
    }

    // --- パッシブ＆覚醒設定 ---
    if (this.st === 'lab_awaken') {
        if (keysDown.up) { this.labCur = (this.labCur - 1 + 3) % 3; playSnd('sel'); }
        if (keysDown.down) { this.labCur = (this.labCur + 1) % 3; playSnd('sel'); }
        if (keysDown.b) { this.st = 'lab_main'; this.labCur = 1; playSnd('hit'); return; }

        if (keysDown.right || keysDown.left) {
            playSnd('sel');
            let dir = keysDown.right ? 1 : -1;
            if (this.labCur === 0) {
                let keys = Object.keys(PassiveType);
                let idx = keys.indexOf(Object.keys(PassiveType).find(k => PassiveType[k] === this.myAI.passive));
                this.myAI.passive = PassiveType[keys[(idx + dir + keys.length) % keys.length]];
            }
            else if (this.labCur === 1) {
                let keys = Object.keys(AwakenCondition);
                let idx = keys.indexOf(Object.keys(AwakenCondition).find(k => AwakenCondition[k] === this.myAI.awakening.condition));
                this.myAI.awakening.condition = AwakenCondition[keys[(idx + dir + keys.length) % keys.length]];
            }
            else if (this.labCur === 2) {
                let keys = Object.keys(IntroType);
                let idx = keys.indexOf(Object.keys(IntroType).find(k => IntroType[k] === this.myAI.intro));
                this.myAI.intro = IntroType[keys[(idx + dir + keys.length) % keys.length]];
            }
        }
        return;
    }
  },

  // プレビュー用の棒人間描画（体型スケール対応）
  drawPreviewStickman(x, y, aiData, isAwakened = false) {
      let b = aiData.body;
      let c = isAwakened ? aiData.awakening.color : aiData.color;
      
      ctx.save();
      ctx.translate(x, y);
      
      // ★ C#の ApplyBodyScale を Canvas の scale で再現
      ctx.scale(b.width, b.height); 
      
      ctx.strokeStyle = c.body; ctx.lineWidth = 3 / Math.max(b.width, b.height); 
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      
      // 息継ぎアニメーション
      let t = Date.now() / 300;
      let breath = Math.sin(t) * 2;
      
      let p = { h:{x:0,y:-30+breath}, n:{x:0,y:-20+breath}, hip:{x:0,y:-5}, sL:{x:-10,y:-10+breath}, sR:{x:10,y:-10+breath}, eL:{x:-15,y:5+breath}, eR:{x:15,y:5+breath}, hL:{x:-10,y:15+breath}, hR:{x:10,y:15+breath}, kL:{x:-10,y:10}, kR:{x:10,y:10}, fL:{x:-15,y:25}, fR:{x:15,y:25} };

      // オーラ（覚醒時は激しく）
      ctx.shadowBlur = isAwakened ? 20 + Math.random()*10 : 10; 
      ctx.shadowColor = c.aura;

      ctx.beginPath();
      ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.hip.x, p.hip.y); // 胴
      ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sL.x, p.sL.y); ctx.lineTo(p.eL.x, p.eL.y); ctx.lineTo(p.hL.x, p.hL.y); // 左腕
      ctx.moveTo(p.n.x, p.n.y); ctx.lineTo(p.sR.x, p.sR.y); ctx.lineTo(p.eR.x, p.eR.y); ctx.lineTo(p.hR.x, p.hR.y); // 右腕
      ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kL.x, p.kL.y); ctx.lineTo(p.fL.x, p.fL.y); // 左脚
      ctx.moveTo(p.hip.x, p.hip.y); ctx.lineTo(p.kR.x, p.kR.y); ctx.lineTo(p.fR.x, p.fR.y); // 右脚
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(p.h.x, p.h.y, 8 * b.head, 0, Math.PI * 2); 
      ctx.fillStyle = c.body; ctx.fill();

      ctx.restore();
  },

  draw() {
    // --- 共通背景 ---
    const grad = ctx.createLinearGradient(0, 0, 0, 300); grad.addColorStop(0, '#001'); grad.addColorStop(1, '#003');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 200, 300);

    // --- メインメニュー ---
    if (this.st === 'menu') {
        ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace'; ctx.fillText('ULTIMATE AI LAB', 25, 50);
        ctx.fillStyle = this.menuCur === 0 ? '#ff0' : '#fff'; ctx.font = '12px monospace';
        ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'BATTLE START', 40, 150);
        ctx.fillStyle = this.menuCur === 1 ? '#ff0' : '#fff';
        ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'AI CUSTOMIZE', 40, 180);
    }
    
    // --- AIラボ（育成画面共通 UI） ---
    else if (this.st.startsWith('lab_')) {
        // 上部に常にプレビューを表示
        ctx.fillStyle = '#112'; ctx.fillRect(10, 10, 180, 110);
        ctx.strokeStyle = '#335'; ctx.strokeRect(10, 10, 180, 110);
        
        // 通常状態と覚醒状態のプレビュー
        ctx.fillStyle = '#888'; ctx.font = '8px monospace';
        ctx.fillText('NORMAL', 40, 25); ctx.fillText('AWAKENED', 130, 25);
        this.drawPreviewStickman(50, 70, this.myAI, false);
        this.drawPreviewStickman(145, 70, this.myAI, true);

        // 各種設定メニュー
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace';
        
        if (this.st === 'lab_main') {
            ctx.fillText('【CUSTOMIZE MENU】', 30, 145);
            const items = ['体型＆カラー設定', 'パッシブ＆覚醒', 'ステータス調整', '戻る'];
            ctx.font = '10px monospace';
            for(let i=0; i<items.length; i++) {
                ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff';
                ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 170 + i * 25);
            }
        }
        else if (this.st === 'lab_body') {
            ctx.fillText('【BODY & PHYSICS】', 30, 145);
            ctx.font = '10px monospace';
            const items = [
                `横幅(W) : ${this.myAI.body.width.toFixed(2)}`,
                `縦幅(H) : ${this.myAI.body.height.toFixed(2)}`,
                `重量(WT): ${Math.floor(this.myAI.physics.weight)}kg`,
                `ボディ色: [CHANGE]`
            ];
            for(let i=0; i<items.length; i++) {
                ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff';
                ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 20, 170 + i * 25);
            }
            ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右キーで調整 ▶', 45, 275);
        }
        else if (this.st === 'lab_awaken') {
            ctx.fillText('【SKILL & AWAKEN】', 30, 145);
            ctx.font = '10px monospace';
            const items = [
                `常時 : ${this.myAI.passive}`,
                `条件 : ${this.myAI.awakening.condition}`,
                `登場 : ${this.myAI.intro}`
            ];
            for(let i=0; i<items.length; i++) {
                ctx.fillStyle = this.labCur === i ? '#ff0' : '#fff';
                ctx.fillText((this.labCur === i ? '> ' : '  ') + items[i], 15, 170 + i * 30);
            }
            ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('◀ 左右キーで変更 ▶', 45, 275);
        }
    }
  }
};
