// === CUSTOM ARENA SYSTEM ===
const Arena = {
  st: 'arenaMenu',
  mIdx: 0,
  selectedSlot: 0,
  editBoss: null,
  nameStr: '',
  nameCursor: 0,
  
  init() {
    this.st = 'arenaMenu';
    this.mIdx = 0;
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
          if (this.mIdx === 0) { RPG.startArenaBattle(this.selectedSlot); } // RPGの戦闘システムを呼び出す
          else if (this.mIdx === 1) { this.editBoss = JSON.parse(JSON.stringify(RPG.customBosses[this.selectedSlot])); this.st = 'bossEdit'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 2) { RPG.customBosses[this.selectedSlot] = null; RPG.saveGame(); this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; playSnd('hit'); }
          else if (this.mIdx === 3) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
        } else {
          if (this.mIdx === 0) { this.editBoss = { name: 'カスタムボス', hp: 100, mp: 20, atk: 10, def: 5, spd: 5 }; this.st = 'bossEdit'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 1) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
        }
      }
      if (keysDown.b) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
    }
    else if (this.st === 'bossEdit') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(6, this.mIdx + 1); playSnd('sel'); }
      let d = keys.a ? 100 : 10;
      if (keysDown.left || keysDown.right) {
         let val = d * (keysDown.right ? 1 : -1);
         if (this.mIdx === 1) this.editBoss.hp = Math.max(1, Math.min(9999, this.editBoss.hp + val));
         if (this.mIdx === 2) this.editBoss.mp = Math.max(0, Math.min(999, this.editBoss.mp + val));
         if (this.mIdx === 3) this.editBoss.atk = Math.max(1, Math.min(999, this.editBoss.atk + val));
         if (this.mIdx === 4) this.editBoss.def = Math.max(0, Math.min(999, this.editBoss.def + val));
         if (this.mIdx === 5) this.editBoss.spd = Math.max(1, Math.min(999, this.editBoss.spd + val));
         if (this.mIdx >= 1 && this.mIdx <= 5) playSnd('sel');
      }
      if (keysDown.a && !keys.left && !keys.right) {
         if (this.mIdx === 0) { this.st = 'bossNameEdit'; this.nameCursor = 0; this.nameStr = this.editBoss.name; playSnd('jmp'); }
         else if (this.mIdx === 6) { RPG.customBosses[this.selectedSlot] = JSON.parse(JSON.stringify(this.editBoss)); RPG.saveGame(); this.st = 'arenaSubMenu'; this.mIdx = 0; playSnd('combo'); }
      }
      if (keysDown.b) { this.st = 'arenaSubMenu'; this.mIdx = 0; }
    }
    else if (this.st === 'bossNameEdit') {
      const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789!?ー';
      if (keysDown.up) { this.nameCursor = Math.max(0, this.nameCursor - 10); playSnd('sel'); }
      if (keysDown.down) { this.nameCursor = Math.min(99, this.nameCursor + 10); playSnd('sel'); }
      if (keysDown.left) { this.nameCursor = Math.max(0, this.nameCursor - 1); playSnd('sel'); }
      if (keysDown.right) { this.nameCursor = Math.min(99, this.nameCursor + 1); playSnd('sel'); }
      if (keysDown.a) { if (this.nameStr.length < 8) { this.nameStr += chars[this.nameCursor]; playSnd('jmp'); } else playSnd('hit'); }
      if (keysDown.b) { if (this.nameStr.length > 0) { this.nameStr = this.nameStr.slice(0, -1); playSnd('hit'); } else { this.st = 'bossEdit'; } }
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
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ボスの設定', 60, 30);
      const b = this.editBoss;
      const items = [ `名前: ${b.name}`, `ＨＰ: ${b.hp}`, `ＭＰ: ${b.mp}`, `攻撃: ${b.atk}`, `防御: ${b.def}`, `速度: ${b.spd}`, `保存して戻る` ];
      for (let i = 0; i < items.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#fff'; ctx.font = '11px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + items[i], 30, 70 + i * 25); }
      ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('A+左右:±100  左右:±10  B:戻る', 15, 280);
    }
    else if (this.st === 'bossNameEdit') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300); ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('名前: ' + this.nameStr + '_', 10, 20);
      const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789!?ー';
      ctx.font = '10px monospace';
      for (let i=0; i<100; i++) {
        let x = 10 + (i%10)*18; let y = 50 + Math.floor(i/10)*18;
        if (i === this.nameCursor) { ctx.fillStyle = '#f00'; ctx.fillRect(x-2, y-10, 14, 14); ctx.fillStyle = '#fff'; } else { ctx.fillStyle = '#aaa'; }
        ctx.fillText(chars[i], x, y);
      }
      ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('A:入力 B:削除 SELECT:決定', 10, 280);
    }
    resetShake();
  }
};
