// === CUSTOM ARENA SYSTEM (FULL FEATURES UPDATE) ===
const Arena = {
  st: 'arenaMenu', mIdx: 0, selectedSlot: 0, editBoss: null, nameStr: '', nameCursor: 0, menuCursor: 0,
  numTarget: '', numStr: '', numCursor: 0, numKeys: ['1','2','3','4','5','6','7','8','9','DEL','0','OK'],
  spellCursor: 0, dotCursor: {x:0, y:0}, dotData: [], hooked: false,
  colors: ['#0a0', '#aaa', '#60c', '#884', '#f00', '#08f', '#f80', '#0ff', '#f0f'], colorNames: ['緑', '灰/白', '紫', '茶/黄', '赤', '青', 'オレンジ', 'シアン', 'マゼンタ'],
  
  init() {
    this.st = 'arenaMenu'; this.mIdx = 0;
    if (!this.hooked) {
      const origBattle = RPG.battle;
      RPG.battle = function(bossType, monsterType = 'slime') {
        origBattle.call(this, bossType, monsterType);
        if (bossType === 'custom') {
          const b = RPG.customBosses[monsterType];
          this.en.spr = b.sprData || sprs.boss;
          this.en.c = Arena.colors[b.colorId || 7] || '#0ff';
          this.en.spells = b.spells || [];
        }
      };
      this.hooked = true;
    }
  },
  
  update() {
    if (keysDown.select && (this.st==='arenaMenu' || this.st==='arenaSubMenu')) { activeApp = RPG; RPG.st = 'customMenu'; RPG.mIdx = 2; return; }
    
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
          else if (this.mIdx === 1) { this.editBoss = JSON.parse(JSON.stringify(RPG.customBosses[this.selectedSlot])); this.st = 'bossEdit'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 2) { RPG.customBosses[this.selectedSlot] = null; RPG.saveGame(); this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; playSnd('hit'); }
          else if (this.mIdx === 3) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
        } else {
          if (this.mIdx === 0) { this.editBoss = { name: 'カスタムボス', hp: 100, mp: 20, atk: 10, def: 5, spd: 5, spells: [], sprData: sprs.boss, colorId: 7 }; this.st = 'bossEdit'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 1) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
        }
      }
      if (keysDown.b) { this.st = 'arenaMenu'; this.mIdx = this.selectedSlot; }
    }
    else if (this.st === 'bossEdit') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(9, this.mIdx + 1); playSnd('sel'); }
      if (this.mIdx === 8) {
        if (keysDown.left) { this.editBoss.colorId = (this.editBoss.colorId + this.colors.length - 1) % this.colors.length; playSnd('sel'); }
        if (keysDown.right) { this.editBoss.colorId = (this.editBoss.colorId + 1) % this.colors.length; playSnd('sel'); }
      }
      if (keysDown.a && !keys.left && !keys.right) {
         if (this.mIdx === 0) { this.st = 'bossNameEdit'; this.nameCursor = 0; this.menuCursor = 0; this.nameStr = this.editBoss.name; playSnd('jmp'); }
         else if (this.mIdx >= 1 && this.mIdx <= 5) { this.st = 'numInput'; this.numTarget = ['hp','mp','atk','def','spd'][this.mIdx-1]; this.numStr = String(this.editBoss[this.numTarget]); this.numCursor = 0; playSnd('jmp'); }
         else if (this.mIdx === 6) { this.st = 'spellEdit'; this.spellCursor = 0; playSnd('jmp'); }
         else if (this.mIdx === 7) { this.st = 'dotEdit'; this.dotCursor = {x:0, y:0}; this.dotData = this.editBoss.sprData.split(''); playSnd('jmp'); }
         else if (this.mIdx === 9) { RPG.customBosses[this.selectedSlot] = JSON.parse(JSON.stringify(this.editBoss)); RPG.saveGame(); this.st = 'arenaSubMenu'; this.mIdx = 0; playSnd('combo'); }
      }
      if (keysDown.b) { this.st = 'arenaSubMenu'; this.mIdx = 0; }
    }
    else if (this.st === 'numInput') {
      if (keysDown.up) { this.numCursor = Math.max(0, this.numCursor - 3); playSnd('sel'); }
      if (keysDown.down) { this.numCursor = Math.min(11, this.numCursor + 3); playSnd('sel'); }
      if (keysDown.left) { this.numCursor = Math.max(0, this.numCursor - 1); playSnd('sel'); }
      if (keysDown.right) { this.numCursor = Math.min(11, this.numCursor + 1); playSnd('sel'); }
      if (keysDown.a) {
        let k = this.numKeys[this.numCursor];
        if (k === 'DEL') { this.numStr = this.numStr.slice(0, -1); playSnd('hit'); }
        else if (k === 'OK') { this.editBoss[this.numTarget] = parseInt(this.numStr) || 0; this.st = 'bossEdit'; playSnd('combo'); }
        else { if (this.numStr.length < 4) { this.numStr += k; playSnd('jmp'); } else playSnd('hit'); }
      }
      if (keysDown.b) { this.st = 'bossEdit'; }
    }
    else if (this.st === 'spellEdit') {
      if (keysDown.up) { this.spellCursor = Math.max(0, this.spellCursor - 1); playSnd('sel'); }
      if (keysDown.down) { this.spellCursor = Math.min(5, this.spellCursor + 1); playSnd('sel'); }
      if (keysDown.a) {
        let idx = this.editBoss.spells.indexOf(this.spellCursor);
        if (idx > -1) this.editBoss.spells.splice(idx, 1); else this.editBoss.spells.push(this.spellCursor); playSnd('jmp');
      }
      if (keysDown.b) { this.st = 'bossEdit'; }
    }
    else if (this.st === 'dotEdit') {
      if (keysDown.up) { this.dotCursor.y = (this.dotCursor.y + 7) % 8; playSnd('sel'); }
      if (keysDown.down) { this.dotCursor.y = (this.dotCursor.y + 1) % 8; playSnd('sel'); }
      if (keysDown.left) { this.dotCursor.x = (this.dotCursor.x + 7) % 8; playSnd('sel'); }
      if (keysDown.right) { this.dotCursor.x = (this.dotCursor.x + 1) % 8; playSnd('sel'); }
      if (keysDown.a) { let i = this.dotCursor.y * 8 + this.dotCursor.x; this.dotData[i] = this.dotData[i] === '1' ? '0' : '1'; playSnd('jmp'); }
      if (keysDown.b || keysDown.select) { this.editBoss.sprData = this.dotData.join(''); this.st = 'bossEdit'; playSnd('combo'); }
    }
    else if (this.st === 'bossNameEdit') {
      const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789!?ー';
      if (this.menuCursor === 0) {
        if (keysDown.up) { if (this.nameCursor >= 10) this.nameCursor -= 10; playSnd('sel'); }
        if (keysDown.down) { if (this.nameCursor + 10 < chars.length) this.nameCursor += 10; else this.menuCursor = 1; playSnd('sel'); }
        if (keysDown.left) { this.nameCursor = Math.max(0, this.nameCursor - 1); playSnd('sel'); }
        if (keysDown.right) { this.nameCursor = Math.min(chars.length - 1, this.nameCursor + 1); playSnd('sel'); }
        if (keysDown.a) { if (this.nameStr.length < 8) { this.nameStr += chars[this.nameCursor]; playSnd('jmp'); } else playSnd('hit'); }
        if (keysDown.b) { if (this.nameStr.length > 0) { this.nameStr = this.nameStr.slice(0, -1); playSnd('hit'); } else { this.st = 'bossEdit'; } }
      } else if (this.menuCursor === 1) {
        if (keysDown.up) { this.menuCursor = 0; playSnd('sel'); } if (keysDown.right) { this.menuCursor = 2; playSnd('sel'); }
        if (keysDown.a) { if (this.nameStr.length > 0) { this.nameStr = this.nameStr.slice(0, -1); playSnd('hit'); } } if (keysDown.b) { this.st = 'bossEdit'; }
      } else if (this.menuCursor === 2) {
        if (keysDown.up) { this.menuCursor = 0; playSnd('sel'); } if (keysDown.left) { this.menuCursor = 1; playSnd('sel'); }
        if (keysDown.a) { this.editBoss.name = this.nameStr; this.st = 'bossEdit'; playSnd('combo'); } if (keysDown.b) { this.st = 'bossEdit'; }
      }
    }
  },
  
  draw() {
    applyShake(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { ctx.fillStyle = '#222'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); } }
    ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(10, 45, 180, 230); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 45, 180, 230);

    if (this.st === 'arenaMenu') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('闘技場', 70, 65);
      for (let i = 0; i < 10; i++) {
        const b = RPG.customBosses[i]; ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '9px monospace';
        let txt = b ? `${b.name} (HP${b.hp}/ATK${b.atk})` : `--- 空き ---`;
        ctx.fillText((this.mIdx === i ? '> ' : '  ') + `[${i+1}] ${txt}`, 15, 85 + i * 16);
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('A:決定 B:戻る', 50, 265);
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
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('A:決定 B:戻る', 50, 265);
    }
    else if (this.st === 'bossEdit') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ボスの設定', 60, 65);
      const b = this.editBoss;
      const items = [ `名前: ${b.name}`, `ＨＰ: ${b.hp}`, `ＭＰ: ${b.mp}`, `攻撃: ${b.atk}`, `防御: ${b.def}`, `速度: ${b.spd}`, `技　: 設定する`, `姿　: (Aで作成)`, `色　: < ${this.colorNames[b.colorId]} >`, `[保存して戻る]` ];
      for (let i = 0; i < items.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#fff'; ctx.font = '10px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + items[i], 15, 85 + i * 16); }
      
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(135, 120, 45, 45); ctx.strokeStyle = '#0f0'; ctx.strokeRect(135, 120, 45, 45);
      drawSprite(138, 123, this.colors[b.colorId], b.sprData, 5);
      ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('A:変更/入力  B:戻る', 50, 265);
    }
    else if (this.st === 'numInput') {
      ctx.fillStyle = '#0f0'; ctx.font = '14px monospace'; ctx.fillText(`入力: ${this.numStr}_`, 25, 70);
      ctx.font = '16px monospace';
      for (let i = 0; i < 12; i++) {
        let x = 40 + (i % 3) * 45; let y = 110 + Math.floor(i / 3) * 40;
        if (this.numCursor === i) { ctx.fillStyle = '#f00'; ctx.fillRect(x-8, y-16, 36, 22); ctx.fillStyle = '#fff'; } else ctx.fillStyle = '#aaa';
        ctx.fillText(this.numKeys[i], x, y);
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('十字:選択  A:入力  B:戻る', 25, 265);
    }
    else if (this.st === 'spellEdit') {
      ctx.fillStyle = '#0f0'; ctx.font = '14px monospace'; ctx.fillText('技の設定(Aで切替)', 30, 70);
      const spells = RPG.spells;
      for (let i = 0; i < 6; i++) {
        let on = this.editBoss.spells.includes(i);
        ctx.fillStyle = this.spellCursor === i ? '#0f0' : (on ? '#fff' : '#666');
        ctx.font = '10px monospace'; ctx.fillText(`${this.spellCursor === i ? '>' : ' '}[${on ? 'X' : ' '}] ${spells[i].name}`, 30, 100 + i * 25);
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('B:戻る', 80, 265);
    }
    else if (this.st === 'dotEdit') {
      ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('ドット絵エディタ', 50, 70);
      let ox = 50, oy = 90, sz = 12;
      for (let i = 0; i < 64; i++) {
        let cx = i % 8, cy = Math.floor(i / 8);
        ctx.fillStyle = this.dotData[i] === '1' ? this.colors[this.editBoss.colorId] : '#333'; ctx.fillRect(ox + cx * sz, oy + cy * sz, sz - 1, sz - 1);
      }
      ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(ox + this.dotCursor.x * sz, oy + this.dotCursor.y * sz, sz - 1, sz - 1); ctx.lineWidth = 1;
      ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText('A:塗る/消す B:完了', 45, 265);
    }
    else if (this.st === 'bossNameEdit') {
      ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('名前: ' + this.nameStr + '_', 15, 65);
      const chars = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789!?ー';
      ctx.font = '10px monospace';
      for (let i=0; i<chars.length; i++) {
        let x = 15 + (i%10)*17; let y = 90 + Math.floor(i/10)*18;
        if (i === this.nameCursor && this.menuCursor === 0) { ctx.fillStyle = '#f00'; ctx.fillRect(x-2, y-10, 14, 14); ctx.fillStyle = '#fff'; } else { ctx.fillStyle = '#aaa'; }
        ctx.fillText(chars[i], x, y);
      }
      ctx.fillStyle = this.menuCursor === 1 ? '#f00' : '#800'; ctx.fillRect(25, 240, 70, 22); ctx.strokeStyle = this.menuCursor === 1 ? '#fff' : '#666'; ctx.lineWidth = 2; ctx.strokeRect(25, 240, 70, 22);
      ctx.fillStyle = this.menuCursor === 1 ? '#fff' : '#ccc'; ctx.font = 'bold 11px monospace'; ctx.fillText('DELETE', 40, 256);
      
      const okEn = this.nameStr.length > 0;
      ctx.fillStyle = this.menuCursor === 2 ? (okEn ? '#0f0' : '#444') : (okEn ? '#080' : '#222'); ctx.fillRect(105, 240, 70, 22); ctx.strokeStyle = this.menuCursor === 2 ? '#fff' : '#666'; ctx.strokeRect(105, 240, 70, 22);
      ctx.fillStyle = this.menuCursor === 2 ? '#fff' : (okEn ? '#ccc' : '#666'); ctx.fillText('決定', 125, 256);
    }
    resetShake();
  }
};
