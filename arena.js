// === CUSTOM ARENA SYSTEM (APPEARANCE & UI UPDATE) ===
const Arena = {
  st: 'arenaMenu',
  mIdx: 0,
  selectedSlot: 0,
  editBoss: null,
  nameStr: '',
  nameCursor: 0,
  menuCursor: 0, // 0:文字盤, 1:DEL, 2:OK
  spriteKeys: ['slime', 'skull', 'mage', 'boss', 'dragon', 'enemyNew'],
  spriteNames: ['スライム', 'ドクロ', '魔道士', '魔神', 'ドラゴン', '飛行獣'],
  colors: ['#0a0', '#aaa', '#60c', '#884', '#f00', '#08f', '#f80', '#0ff', '#f0f'],
  colorNames: ['緑', '灰/白', '紫', '茶/黄', '赤', '青', 'オレンジ', 'シアン', 'マゼンタ'],
  
  init() {
    this.st = 'arenaMenu';
    this.mIdx = 0;
    
    // RPGの戦闘システムに見た目変更機能を裏側から追加
    if (!this.hooked) {
      const origBattle = RPG.battle;
      RPG.battle = function(bossType, monsterType = 'slime') {
        origBattle.call(this, bossType, monsterType);
        if (bossType === 'custom') {
          const b = this.customBosses[monsterType];
          this.en.spr = sprs[Arena.spriteKeys[b.sprId || 3]] || sprs.boss;
          this.en.c = Arena.colors[b.colorId || 7] || '#0ff';
        }
      };
      this.hooked = true;
    }
  },
  
  update() {
    if (keysDown.select) { activeApp = RPG; RPG.st = 'customMenu'; RPG.mIdx = 2; return; }
    
    if (this.st === 'arenaMenu') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(9, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) { this.selectedSlot = this.mIdx; this.st = 'arenaSubMenu'; this.mIdx = 0; playSnd('jmp'); }
      if (keysDown.b) { activeApp = RPG; RPG.st = 'customMenu'; RPG.mIdx = 2; }
    }
    else if (this.st === 'arenaSubMenu') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(RPG.customBosses[this.selectedSlot] ? 3 : 1, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) {
        if (RPG.customBosses[this.selectedSlot]) {
          if (this.mIdx === 0) { RPG.startArenaBattle(this.selectedSlot); } 
          else if (this.mIdx === 1) { 
            this.editBoss = JSON.parse(JSON.stringify(RPG.customBosses[this.selectedSlot])); 
            if (this.editBoss.sprId === undefined) this.editBoss.sprId = 3;
            if (this.editBoss.colorId === undefined) this.editBoss.colorId = 7;
            this.st = 'bossEdit'; this.mIdx = 0; playSnd('jmp'); 
          }
          else if (this.mIdx === 2) { RPG.customBosses[this.selectedSlot] = null; RPG.saveGame(); this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; playSnd('hit'); }
          else if (this.mIdx === 3) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
        } else {
          if (this.mIdx === 0) { 
            this.editBoss = { name: 'カスタムボス', hp: 100, mp: 20, atk: 10, def: 5, spd: 5, sprId: 3, colorId: 7 }; 
            this.st = 'bossEdit'; this.mIdx = 0; playSnd('jmp'); 
          }
          else if (this.mIdx === 1) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
        }
      }
      if (keysDown.b) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
    }
    else if (this.st === 'bossEdit') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(8, this.mIdx + 1); playSnd('sel'); }
      let d = keys.a ? 100 : 10;
      if (keysDown.left || keysDown.right) {
         let val = d * (keysDown.right ? 1 : -1);
         let val1 = keysDown.right ? 1 : -1;
         if (this.mIdx === 1) this.editBoss.hp = Math.max(1, Math.min(9999, this.editBoss.hp + val));
         if (this.mIdx === 2) this.editBoss.mp = Math.max(0, Math.min(999, this.editBoss.mp + val));
         if (this.mIdx === 3) this.editBoss.atk = Math.max(1, Math.min(999, this.editBoss.atk + val));
         if (this.mIdx === 4) this.editBoss.def = Math.max(0, Math.min(999, this.editBoss.def + val));
         if (this.mIdx === 5) this.editBoss.spd = Math.max(1, Math.min(999, this.editBoss.spd + val));
         if (this.mIdx === 6) this.editBoss.sprId = (this.editBoss.sprId + val1 + this.spriteKeys.length) % this.spriteKeys.length;
         if (this.mIdx === 7) this.editBoss.colorId = (this.editBoss.colorId + val1 + this.colors.length) % this.colors.length;
         if (this.mIdx >= 1 && this.mIdx <= 7) playSnd('sel');
      }
      if (keysDown.a && !keys.left && !keys.right) {
         if (this.mIdx === 0) { this.st = 'bossNameEdit'; this.nameCursor = 0; this.menuCursor = 0; this.nameStr = this.editBoss.name; playSnd('jmp'); }
         else if (this.mIdx === 8) { RPG.customBosses[this.selectedSlot] = JSON.parse(JSON.stringify(this.editBoss)); RPG.saveGame(); this.st = 'arenaSubMenu'; this.mIdx = 0; playSnd('combo'); }
      }
      if (keysDown.b) { this.st = 'arenaSubMenu'; this.mIdx = 0; }
    }
    else if (this.st === 'bossNameEdit') {
      const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789!?ー';
      if (this.menuCursor === 0) {
        if (keysDown.up) { if (this.nameCursor >= 10) this.nameCursor -= 10; playSnd('sel'); }
        if (keysDown.down) { 
           if (this.nameCursor + 10 < chars.length) this.nameCursor += 10; 
           else this.menuCursor = 1; // 下に行ったらボタンへ移動
           playSnd('sel'); 
        }
        if (keysDown.left) { this.nameCursor = Math.max(0, this.nameCursor - 1); playSnd('sel'); }
        if (keysDown.right) { this.nameCursor = Math.min(chars.length - 1, this.nameCursor + 1); playSnd('sel'); }
        if (keysDown.a) { if (this.nameStr.length < 8) { this.nameStr += chars[this.nameCursor]; playSnd('jmp'); } else playSnd('hit'); }
        if (keysDown.b) { if (this.nameStr.length > 0) { this.nameStr = this.nameStr.slice(0, -1); playSnd('hit'); } else { this.st = 'bossEdit'; } }
      } else if (this.menuCursor === 1) { // DELETEボタン
        if (keysDown.up) { this.menuCursor = 0; playSnd('sel'); }
        if (keysDown.right) { this.menuCursor = 2; playSnd('sel'); }
        if (keysDown.a) { if (this.nameStr.length > 0) { this.nameStr = this.nameStr.slice(0, -1); playSnd('hit'); } }
        if (keysDown.b) { this.st = 'bossEdit'; }
      } else if (this.menuCursor === 2) { // 決定(OK)ボタン
        if (keysDown.up) { this.menuCursor = 0; playSnd('sel'); }
        if (keysDown.left) { this.menuCursor = 1; playSnd('sel'); }
        if (keysDown.a) { this.editBoss.name = this.nameStr; this.st = 'bossEdit'; playSnd('combo'); }
        if (keysDown.b) { this.st = 'bossEdit'; }
      }
      // サブ操作（SELECTでも決定可能）
      if (keys.select) { this.editBoss.name = this.nameStr; this.st = 'bossEdit'; playSnd('combo'); }
    }
  },
  
  draw() {
    applyShake();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { ctx.fillStyle = '#222'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); } }
    ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(10, 45, 180, 210); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 45, 180, 210);

    if (this.st === 'arenaMenu') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('カスタム闘技場', 45, 65);
      for (let i = 0; i < 10; i++) {
        const b = RPG.customBosses[i]; ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '9px monospace';
        let txt = b ? `${b.name} (HP${b.hp}/ATK${b.atk})` : `--- 空きスロット ---`;
        ctx.fillText((this.mIdx === i ? '> ' : '  ') + `[${i+1}] ${txt}`, 15, 85 + i * 15);
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('A:決定 B:戻る', 50, 245);
    }
    else if (this.st === 'arenaSubMenu') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ボス操作', 70, 70);
      const b = RPG.customBosses[this.selectedSlot];
      if (b) {
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`選択中: ${b.name}`, 30, 95);
        const opts = ['戦う', '編集', '削除', '戻る'];
        for (let i=0; i<4; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + opts[i], 30, 130 + i * 20); }
      } else {
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`空きスロット`, 30, 95);
        const opts = ['新規作成', '戻る'];
        for (let i=0; i<2; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + opts[i], 30, 130 + i * 20); }
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('A:決定 B:戻る', 50, 245);
    }
    else if (this.st === 'bossEdit') {
      ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ボスの設定', 60, 25);
      const b = this.editBoss;
      const items = [ 
        `名前: ${b.name}`, `ＨＰ: ${b.hp}`, `ＭＰ: ${b.mp}`, `攻撃: ${b.atk}`, `防御: ${b.def}`, `速度: ${b.spd}`,
        `姿　: < ${this.spriteNames[b.sprId]} >`,
        `色　: < ${this.colorNames[b.colorId]} >`,
        `保存して戻る`
      ];
      for (let i = 0; i < items.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#fff'; ctx.font = '11px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + items[i], 15, 45 + i * 22); }
      
      // カスタムボスの見た目プレビュー
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(135, 120, 50, 50); ctx.strokeStyle = '#0f0'; ctx.strokeRect(135, 120, 50, 50);
      const preSpr = sprs[this.spriteKeys[b.sprId]];
      const preCol = this.colors[b.colorId];
      drawSprite(140, 125, preCol, preSpr, 5);

      ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('A+左右:±100  左右:±10  B:戻る', 15, 280);
    }
    else if (this.st === 'bossNameEdit') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('名前: ' + this.nameStr + '_', 10, 20);
      const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789!?ー';
      ctx.font = '10px monospace';
      for (let i=0; i<chars.length; i++) {
        let x = 10 + (i%10)*18; let y = 50 + Math.floor(i/10)*18;
        if (i === this.nameCursor && this.menuCursor === 0) { ctx.fillStyle = '#f00'; ctx.fillRect(x-2, y-10, 14, 14); ctx.fillStyle = '#fff'; } else { ctx.fillStyle = '#aaa'; }
        ctx.fillText(chars[i], x, y);
      }
      
      // ボタンUIの描画
      ctx.fillStyle = this.menuCursor === 1 ? '#f00' : '#800'; ctx.fillRect(25, 240, 70, 22); ctx.strokeStyle = this.menuCursor === 1 ? '#fff' : '#666'; ctx.lineWidth = 2; ctx.strokeRect(25, 240, 70, 22);
      ctx.fillStyle = this.menuCursor === 1 ? '#fff' : '#ccc'; ctx.font = 'bold 11px monospace'; ctx.fillText('DELETE', 40, 256);
      
      const okEn = this.nameStr.length > 0;
      ctx.fillStyle = this.menuCursor === 2 ? (okEn ? '#0f0' : '#444') : (okEn ? '#080' : '#222'); ctx.fillRect(105, 240, 70, 22); ctx.strokeStyle = this.menuCursor === 2 ? '#fff' : '#666'; ctx.strokeRect(105, 240, 70, 22);
      ctx.fillStyle = this.menuCursor === 2 ? '#fff' : (okEn ? '#ccc' : '#666'); ctx.fillText('決定(OK)', 115, 256);

      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('十字:選択 A:入力/決定 B:戻る', 10, 280);
    }
    resetShake();
  }
};
