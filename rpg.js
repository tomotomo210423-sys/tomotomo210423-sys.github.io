// === MICRO QUEST - BUG FIX & DELETE CONFIRMATION UPDATE ===
const RPG = {
  st: 'title', msg: '', msgNextSt: null, mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleWaitTimer: 0, chests: [], customBosses: [], isArena: false,
  fieldMonsters: [], fightingMonsterIdx: -1, 
  spells: [ {name: 'ファイア', mp: 5, dmg: 15, type: 'atk'}, {name: 'サンダー', mp: 8, dmg: 25, type: 'atk'}, {name: 'ブリザド', mp: 12, dmg: 35, type: 'atk'}, {name: 'ヒール', mp: 10, dmg: -30, type: 'heal'}, {name: 'ポイズン', mp: 8, dmg: 0, type: 'poison'}, {name: 'ドレイン', mp: 15, dmg: 20, type: 'drain'} ],
  monsterTypes: { slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, spd: 3, exp: 15, gld: 8, spells: []}, bat: {name: 'コウモリ', spr: sprs.enemyNew, c: '#80f', hp: 20, atk: 5, def: 1, spd: 8, exp: 20, gld: 12, spells: [5]}, skeleton: {name: '骨戦士', spr: sprs.skull, c: '#aaa', hp: 35, atk: 7, def: 3, spd: 6, exp: 30, gld: 20, spells: []}, mage: {name: '魔道士', spr: sprs.mage, c: '#60c', hp: 25, atk: 10, def: 2, spd: 5, exp: 35, gld: 25, spells: [0, 1, 4]}, golem: {name: 'ゴーレム', spr: sprs.boss, c: '#884', hp: 80, atk: 15, def: 10, spd: 2, exp: 100, gld: 80, spells: []}, dragon: {name: 'ドラゴン', spr: sprs.dragon, c: '#f00', hp: 120, atk: 25, def: 8, spd: 15, exp: 200, gld: 150, spells: [0, 1]} },
  encounterTable: { '1,1': ['slime'], '2,1': ['slime', 'bat'], '1,0': ['bat', 'skeleton', 'mage'], '0,1': ['skeleton', 'mage', 'golem'], '0,0': ['mage', 'golem', 'dragon'], '2,2': ['skeleton', 'dragon'] },

  init() { this.st = 'title'; this.mIdx = 0; this.anim = 0; BGM.play('rpg_field'); },
  
  loadSave(slot) {
    const data = localStorage.getItem('4in1_rpg_slot' + slot); let sd = null; try { if (data) sd = JSON.parse(data); } catch(e) {}
    if (sd) {
      this.p = sd.p; this.dungeons = sd.dungeons; this.chests = sd.chests; this.customBosses = sd.customBosses || Array(10).fill(null);
      if(!this.p.bestiary) this.p.bestiary = []; if(!this.p.knownSpells) this.p.knownSpells = []; if(!this.p.customWep) this.p.customWep = {atk: 0, lv: 0}; if(!this.p.customArm) this.p.customArm = {def: 0, lv: 0};
    } else {
      this.p = { x: 4, y: 8, areaX: 1, areaY: 1, story: 0, hp: 30, mhp: 30, mp: 15, mmp: 15, atk: 5, def: 3, spd: 5, gld: 0, lv: 1, exp: 0, knownSpells: [], customWep: {atk: 0, lv: 0}, customArm: {def: 0, lv: 0}, bestiary: [] };
      this.dungeons = [{cleared: false, boss: 'golem'}, {cleared: false, boss: 'dragon'}, {cleared: false, boss: 'dragon'}]; this.chests = [{ax: 2, ay: 1, x: 2, y: 2, opened: false}, {ax: 0, ay: 1, x: 8, y: 12, opened: false}]; this.customBosses = Array(10).fill(null);
    }
    this.saveSlot = slot; this.st = 'map'; this.genMap(); BGM.play('rpg_field');
  },
  
  saveGame() {
    let sObj = { p: this.p, dungeons: this.dungeons, chests: this.chests, customBosses: this.customBosses };
    if (this.st !== 'map' && this.p.worldX !== undefined) { sObj.p.x = this.p.worldX; sObj.p.y = this.p.worldY; if (this.st === 'dungeon') { sObj.p.areaX = this.p.worldAx; sObj.p.areaY = this.p.worldAy; } }
    localStorage.setItem('4in1_rpg_slot' + this.saveSlot, JSON.stringify(sObj));
  },
  deleteSave(slot) { localStorage.removeItem('4in1_rpg_slot' + slot); },

  genMap() {
    this.map = Array(15).fill().map(() => Array(10).fill(0));
    let ax = this.p.areaX, ay = this.p.areaY, seed = ax * 10 + ay + 100; let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) {
        let v = rand(); if (v < 0.15) this.map[r][c] = 1; else if (v < 0.25) this.map[r][c] = 2;
        if ((ax===0 && c===0)||(ax===2 && c===9)||(ay===0 && r===0)||(ay===2 && r===14)) this.map[r][c] = 3;
        if (ay===2 && this.map[r][c]===0) this.map[r][c] = 9;
    } }
    if (ax===1 && ay===1) { this.map[7][4] = 4; this.map[7][5] = 4; } if (ax===2 && ay===1) { this.map[5][5] = 5; } if (ax===1 && ay===0) { this.map[3][4] = 6; }
    if (ax===0 && ay===1) { this.map[8][2] = 7; } if (ax===0 && ay===0) { this.map[3][3]=8; this.map[3][2]=8; this.map[2][3]=8; this.map[2][2]=8; }
    
    this.fieldMonsters = [];
    let numMonsters = 4 + this.p.areaX + this.p.areaY;
    for(let i = 0; i < numMonsters; i++) {
       let rx = Math.floor(Math.random() * 10); let ry = Math.floor(Math.random() * 15);
       if((this.map[ry][rx] === 0 || this.map[ry][rx] === 9) && (rx !== this.p.x || ry !== this.p.y)) {
           const enc = this.encounterTable[`${this.p.areaX},${this.p.areaY}`] || ['slime'];
           this.fieldMonsters.push({x: rx, y: ry, type: enc[Math.floor(Math.random() * enc.length)]});
       }
    }
  },
  
  genTownMap() {
    this.worldMap = this.map.map(r => [...r]); this.map = Array(15).fill().map(() => Array(10).fill(0));
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { this.map[r][c] = (r===0||r===14||c===0||c===9) ? 1 : 15; } }
    this.map[14][4]=15; this.map[14][5]=15; this.map[1][4]=21; this.map[1][5]=21;
    this.map[8][2]=17; this.map[8][7]=18; this.map[11][5]=19;
    this.p.worldX = this.p.x; this.p.worldY = this.p.y; this.p.x = 4; this.p.y = 13;
    this.fieldMonsters = [];
  },

  genCastleMap() {
    this.map = Array(15).fill().map(() => Array(10).fill(10));
    for (let r = 1; r < 14; r++) { for (let c = 2; c < 8; c++) { this.map[r][c] = 15; } }
    for (let r = 2; r < 14; r++) { this.map[r][4] = 22; this.map[r][5] = 22; }
    this.map[14][4]=15; this.map[14][5]=15; this.map[2][4]=16; this.map[2][5]=16;
    this.p.x = 4; this.p.y = 13;
    this.fieldMonsters = [];
  },
  
  genDungeonMap(type) {
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) {
        if (type==='cave') this.map[r][c] = (r===0||r===14||c===0||c===9||Math.random()<0.25)?10:11;
        else if (type==='tower') this.map[r][c] = (r===0||r===14||c===0||c===9||(r%3===0&&Math.random()<0.4))?12:11;
        else this.map[r][c] = (r===0||r===14||c===0||c===9||Math.random()<0.2)?13:11;
    } }
    this.map[13][5] = 14; this.p.x = 5; this.p.y = 13; this.map[Math.floor(Math.random()*8)+1][Math.floor(Math.random()*8)+1] = 20;
    
    this.fieldMonsters = [];
    let numMonsters = 5 + this.dungeon.floor * 2;
    for(let i = 0; i < numMonsters; i++) {
       let rx = Math.floor(Math.random() * 10); let ry = Math.floor(Math.random() * 15);
       if(this.map[ry][rx] === 11 && (rx !== this.p.x || ry !== this.p.y)) {
           const enc = this.encounterTable[`${this.p.worldAx},${this.p.worldAy}`] || ['slime'];
           this.fieldMonsters.push({x: rx, y: ry, type: enc[Math.floor(Math.random() * enc.length)]});
       }
    }
  },
  
  msgBox(t, nextSt = null) { this.msg = t; this.msgNextSt = nextSt; this.st = 'msg'; playSnd('sel'); },
  
  enterDungeon(idx, type) {
    if (this.dungeons[idx] && this.dungeons[idx].cleared) { this.msgBox("魔物は討伐済みだ。"); return; }
    this.st = 'dungeon'; this.dungeon = {idx: idx, floor: 1, maxFloor: 3, type: type};
    this.p.worldX = this.p.x; this.p.worldY = this.p.y; this.p.worldAx = this.p.areaX; this.p.worldAy = this.p.areaY; this.worldMap = this.map.map(r => [...r]);
    this.genDungeonMap(type); BGM.play('rpg_dungeon'); this.msgBox(`ダンジョンに入った！\nF1`);
  },
  
  exitDungeon() { this.map = this.worldMap; this.p.x = this.p.worldX; this.p.y = this.p.worldY; this.st = 'map'; BGM.play('rpg_field'); this.fieldMonsters = []; this.genMap(); },
  calcStats() { return { atk: this.p.atk + this.p.customWep.atk, def: this.p.def + this.p.customArm.def, spd: this.p.spd }; },
  startArenaBattle(slot) { this.isArena = true; this.battle('custom', slot); activeApp = this; },

  update() {
    this.anim++; if (this.battleWaitTimer > 0) { this.battleWaitTimer--; return; }
    if (this.st === 'battleProcessing') return;

    if (keysDown.select) {
      if (this.st === 'title' || this.st === 'saveSelect') { activeApp = Menu; Menu.init(); return; }
      if (['map', 'dungeon', 'townMap', 'castle'].includes(this.st)) { this.st = 'menu'; this.mIdx = 0; playSnd('sel'); return; }
      if (this.st === 'menu') { this.st = this.dungeon ? 'dungeon' : (this.map[0][0]===1 || this.map[0][0]===10) ? 'townMap' : 'map'; return; }
    }
    
    if (['title', 'saveSelect', 'menu', 'equipMenu', 'spellMenu', 'customMenu', 'bestiary'].includes(this.st)) {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { 
        let max = this.st==='menu'?4 : this.st==='bestiary'?Math.max(0,this.p.bestiary.length-1) : 3;
        this.mIdx = Math.min(max, this.mIdx + 1); playSnd('sel'); 
      }
      if (keysDown.a) {
        if (this.st === 'title') { if (this.mIdx === 0) { this.st = 'saveSelect'; this.mIdx = 0; } else { activeApp = Menu; Menu.init(); } playSnd('jmp'); }
        else if (this.st === 'saveSelect') { if (this.mIdx < 3) { this.loadSave(this.mIdx + 1); playSnd('jmp'); } else { this.st = 'title'; this.mIdx = 0; } }
        else if (this.st === 'menu') {
          if (this.mIdx === 0) { this.st = 'equipMenu'; playSnd('jmp'); } 
          else if (this.mIdx === 1) { this.st = 'spellMenu'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 2) { this.st = 'bestiary'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 3) { this.saveGame(); this.msgBox("セーブしました！"); } 
          else if (this.mIdx === 4) { this.st = 'title'; this.mIdx = 0; }
        }
        else if (this.st === 'customMenu') {
          if (this.mIdx === 0) { let cost = 100 + this.p.customWep.lv * 50; if (this.p.gld >= cost) { this.p.gld -= cost; this.p.customWep.atk += 5; this.p.customWep.lv++; playSnd('combo'); this.msgBox(`武器を強化した！`); } else playSnd('hit'); }
          else if (this.mIdx === 1) { let cost = 100 + this.p.customArm.lv * 50; if (this.p.gld >= cost) { this.p.gld -= cost; this.p.customArm.def += 3; this.p.customArm.lv++; playSnd('combo'); this.msgBox(`防具を強化した！`); } else playSnd('hit'); }
          else if (this.mIdx === 2) { activeApp = Arena; Arena.init(); playSnd('sel'); } 
          else if (this.mIdx === 3) { this.st = 'townMap'; this.mIdx = 0; }
        }
      }
      if (keysDown.b) {
        if (this.st === 'saveSelect' && this.mIdx < 3) { 
          if (localStorage.getItem('4in1_rpg_slot' + (this.mIdx+1))) { 
            this.st = 'confirmDelete'; this.selectedSlot = this.mIdx; this.mIdx = 1; playSnd('sel'); 
          } 
        } else if (['equipMenu', 'spellMenu', 'bestiary'].includes(this.st)) { this.st = 'menu'; this.mIdx = 0; }
        else if (this.st === 'customMenu') { this.st = 'townMap'; this.mIdx = 0; }
      } return;
    }

    if (this.st === 'confirmDelete') {
        if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
        if (keysDown.a) {
            if (this.mIdx === 0) { this.deleteSave(this.selectedSlot + 1); playSnd('hit'); this.st = 'saveSelect'; this.mIdx = 0; }
            else { this.st = 'saveSelect'; this.mIdx = 0; playSnd('sel'); }
        }
        if (keysDown.b) { this.st = 'saveSelect'; this.mIdx = 0; }
        return;
    }

    if (this.st === 'msg') { if (keysDown.a) { if (this.msgNextSt) { this.st = this.msgNextSt; this.msgNextSt = null; } else { this.st = this.dungeon ? 'dungeon' : (this.map[0][0]===1 || this.map[0][0]===10) ? 'townMap' : 'map'; } } return; }

    if (['map', 'dungeon', 'townMap', 'castle'].includes(this.st)) {
      if (keysDown.a) {
        let t = this.map[this.p.y][this.p.x];
        if (this.st === 'map') {
          if (t===4) { this.st = 'townMap'; this.genTownMap(); BGM.play('rpg_town'); return; }
          else if (t===5) { this.enterDungeon(0, 'cave'); return; } 
          else if (t===6) { if (this.p.story >= 1) this.enterDungeon(1, 'tower'); else this.msgBox("封鎖されている。"); return; }
          else if (t===7) { if (this.p.story >= 2) this.enterDungeon(2, 'ruins'); else this.msgBox("封印されている。"); return; }
          else if (t===8) { if (this.p.story >= 3) { this.battle('boss', 'demon_king'); } else this.msgBox("今は敵わない…"); return; }
          for (let ch of this.chests) { if (ch.ax===this.p.areaX && ch.ay===this.p.areaY && ch.x===this.p.x && ch.y===this.p.y && !ch.opened) { ch.opened = true; playSnd('combo'); this.p.gld += 100; this.msgBox("100Gを手に入れた！"); return; } }
        } else if (this.st === 'dungeon') {
          if (t===14) { if (this.dungeon.floor===1) this.exitDungeon(); else { this.dungeon.floor--; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); } }
          else if (t===20) { if (this.dungeon.floor===this.dungeon.maxFloor) this.battle('miniboss', this.dungeons[this.dungeon.idx].boss); else { this.dungeon.floor++; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); } }
        } else if (['townMap', 'castle'].includes(this.st)) {
          const adj = [ this.map[this.p.y][this.p.x], this.p.y>0?this.map[this.p.y-1][this.p.x]:0, this.p.y<14?this.map[this.p.y+1][this.p.x]:0, this.p.x>0?this.map[this.p.y][this.p.x-1]:0, this.p.x<9?this.map[this.p.y][this.p.x+1]:0 ];
          if (adj.includes(16)) { this.msgBox(this.p.story===0?"王様「東の洞窟へ行け！」":this.p.story===1?"王様「北の塔へ向かえ！」":this.p.story===2?"王様「北西の魔王城へ！」":"王様「世界に平和が！」"); }
          else if (adj.includes(17)) { if (this.p.gld >= 15) { this.p.gld -= 15; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; playSnd('combo'); this.msgBox("15GでHP/MPが全回復した！"); } else this.msgBox("お金が足りない。"); }
          else if (adj.includes(18)) { const un = [0,1,2,3,4,5].filter(x => !this.p.knownSpells.includes(x)); if (un.length > 0) { if (this.p.gld >= 50) { this.p.gld -= 50; const l = un[Math.floor(Math.random()*un.length)]; this.p.knownSpells.push(l); playSnd('combo'); this.msgBox(`50Gで魔法を習得した！`); } else this.msgBox("50G必要だ。"); } else this.msgBox("全て習得済みだ。"); }
          else if (adj.includes(19)) { this.st = 'customMenu'; this.mIdx = 0; playSnd('sel'); }
        }
      }
      
      let nx = this.p.x, ny = this.p.y, moved = false;
      if (keysDown.up) ny--; if (keysDown.down) ny++; if (keysDown.left) nx--; if (keysDown.right) nx++;
      
      if (nx !== this.p.x || ny !== this.p.y) {
        if (this.st === 'map') {
          if (nx < 0) { if (this.p.areaX > 0) { this.p.areaX--; this.p.x = 9; this.genMap(); moved = true; playSnd('jmp'); } } 
          else if (nx > 9) { if (this.p.areaX < 2) { this.p.areaX++; this.p.x = 0; this.genMap(); moved = true; playSnd('jmp'); } }
          else if (ny < 0) { if (this.p.areaY > 0) { this.p.areaY--; this.p.y = 14; this.genMap(); moved = true; playSnd('jmp'); } } 
          else if (ny > 14) { if (this.p.areaY < 2) { this.p.areaY++; this.p.y = 0; this.genMap(); moved = true; playSnd('jmp'); } }
          else if (![1,2,3].includes(this.map[ny][nx])) { this.p.x = nx; this.p.y = ny; playSnd('sel'); moved = true; }
        } else if (['dungeon', 'townMap', 'castle'].includes(this.st)) {
          if (this.st === 'townMap' && ny > 14) { this.map = this.worldMap; this.p.x = this.p.worldX; this.p.y = this.p.worldY; this.st = 'map'; BGM.play('rpg_field'); this.genMap(); }
          else if (this.st === 'castle' && ny > 14) { this.st = 'townMap'; this.genTownMap(); this.p.x = 4; this.p.y = 2; playSnd('jmp'); }
          else if (ny >= 0 && ny < 15 && nx >= 0 && nx < 10) {
            let t = this.map[ny][nx]; 
            if (this.st === 'townMap' && t === 21) { this.st = 'castle'; this.genCastleMap(); playSnd('jmp'); } 
            else if (this.st === 'castle') { if ([15, 22].includes(t)) { this.p.x = nx; this.p.y = ny; playSnd('sel'); moved = true; } }
            else if (![1,10,12,13,16,17,18,19,21].includes(t)) { this.p.x = nx; this.p.y = ny; playSnd('sel'); moved = true; }
          }
        }
      }
      
      // シンボルモンスター移動処理
      if (moved && this.fieldMonsters.length > 0) {
          for (let i = 0; i < this.fieldMonsters.length; i++) {
              let m = this.fieldMonsters[i];
              let dirs = [{dx:0,dy:-1}, {dx:0,dy:1}, {dx:-1,dy:0}, {dx:1,dy:0}];
              let dir = dirs[Math.floor(Math.random() * dirs.length)];
              let mx = m.x + dir.dx, my = m.y + dir.dy;
              if (mx >= 0 && mx < 10 && my >= 0 && my < 15) {
                  let mt = this.map[my][mx];
                  if (((this.st === 'map' && [0,9].includes(mt)) || (this.st === 'dungeon' && mt===11)) && !this.fieldMonsters.some(o => o.x === mx && o.y === my)) { m.x = mx; m.y = my; }
              }
              if (m.x === this.p.x && m.y === this.p.y) { this.fightingMonsterIdx = i; this.battle(false, m.type); break; }
          }
      }
    }

    if (['battle', 'magic'].includes(this.st)) {
      if (this.st === 'magic') {
        if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); } if (keysDown.down) { this.mIdx = Math.min(this.p.knownSpells.length, this.mIdx + 1); playSnd('sel'); }
        if (keysDown.a) { if (this.mIdx < this.p.knownSpells.length) { this.executeTurn('magic', this.mIdx); } else { this.st = 'battle'; this.mIdx = 0; } }
        if (keysDown.b) { this.st = 'battle'; this.mIdx = 0; } return;
      }
      if (keysDown.left || keysDown.right) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); } if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx < 2 ? this.mIdx + 2 : this.mIdx - 2; playSnd('sel'); }
      if (keysDown.a) { if (this.mIdx === 0) this.executeTurn('atk'); else if (this.mIdx === 1) { this.st = 'magic'; this.mIdx = 0; playSnd('sel'); } else if (this.mIdx === 2) this.executeTurn('run'); }
    }
  },

  executeTurn(act, spIdx = -1) {
    this.st = 'battleProcessing';
    let pSpd = this.p.spd * (0.8 + Math.random()*0.4), eSpd = (this.en.spd || 5) * (0.8 + Math.random()*0.4);
    let playerFirst = pSpd >= eSpd || act === 'run', step = 0, sequence = [];
    const pAction = () => {
      if (this.p.hp <= 0 || this.en.hp <= 0) return nextStep();
      if (act === 'atk') {
        playSnd('jmp'); const s = this.calcStats(); let baseDmg = s.atk - this.en.def, isCrit = Math.random() < 0.1; if (isCrit) baseDmg = s.atk * 1.5;
        let d = Math.max(1, Math.floor(baseDmg * (0.8 + Math.random() * 0.4))); this.en.hp -= d; this.battleText = `${isCrit?'CRITICAL!\n':''}${this.en.n}に\n${d}のダメージ！`; this.battleWaitTimer = 60; screenShake(3); addParticle(100, 120, this.en.c, 'explosion'); setTimeout(nextStep, 1000);
      } else if (act === 'magic') {
        const sp = this.spells[this.p.knownSpells[spIdx]];
        if (this.p.mp >= sp.mp) {
          this.p.mp -= sp.mp;
          if (sp.type === 'atk') { let d = Math.max(1, Math.floor(sp.dmg * (0.8 + Math.random()*0.4))); this.en.hp -= d; this.battleText = `${sp.name}！\n${this.en.n}に${d}ダメージ！`; playSnd('combo'); addParticle(100, 120, '#f0f', 'explosion'); screenShake(5); } 
          else if (sp.type === 'heal') { let heal = Math.abs(sp.dmg); this.p.hp = Math.min(this.p.mhp, this.p.hp + heal); this.battleText = `${sp.name}！\nHPが${heal}回復した！`; playSnd('combo'); addParticle(100, 200, '#0f0', 'star'); } 
          else if (sp.type === 'poison') { this.en.poisoned = true; this.battleText = `${sp.name}！\n${this.en.n}は毒を浴びた！`; playSnd('combo'); } 
          else if (sp.type === 'drain') { let d = Math.max(1, Math.floor(sp.dmg)); this.en.hp -= d; this.p.hp = Math.min(this.p.mhp, this.p.hp + Math.floor(d/2)); this.battleText = `${sp.name}！\n${d}ダメージ与え、回復した！`; playSnd('combo'); addParticle(100, 120, '#f0f', 'explosion'); screenShake(5); }
          this.battleWaitTimer = 60; setTimeout(nextStep, 1000);
        } else { this.battleText = `MPが足りない！`; this.battleWaitTimer = 60; playSnd('hit'); setTimeout(nextStep, 800); }
      } else if (act === 'run') {
        if (['boss', 'custom'].includes(this.en.monsterType)) { this.battleText = '逃げられない！'; this.battleWaitTimer = 60; setTimeout(nextStep, 1000); } 
        else { 
          this.battleText = '逃げ切った！'; this.battleWaitTimer = 60; 
          setTimeout(() => { 
            // ★バグ修正：逃走時に敵のインデックスを確実にリセットし、マップ外へ飛ばす
            if (this.fightingMonsterIdx > -1 && this.fieldMonsters[this.fightingMonsterIdx]) this.fieldMonsters[this.fightingMonsterIdx].x = -1;
            this.fightingMonsterIdx = -1;
            if(this.isArena){this.isArena=false; activeApp=Arena; Arena.init(); } else if(this.dungeon){this.st='dungeon';BGM.play('rpg_dungeon');} else{this.st='map';BGM.play('rpg_field');} 
          }, 800); return; 
        }
      }
    };
    const eAction = () => {
      if (this.p.hp <= 0 || this.en.hp <= 0) return nextStep();
      if (this.en.spells && this.en.spells.length > 0 && Math.random() < 0.3) {
        const sp = this.spells[this.en.spells[Math.floor(Math.random() * this.en.spells.length)]];
        if (sp.type === 'atk' || sp.type === 'drain') { let d = Math.max(1, Math.floor(sp.dmg * 0.8)); this.p.hp -= d; this.battleText = `${this.en.n}の${sp.name}！\n${d}のダメージを受けた！`; playSnd('hit'); screenShake(4); } 
        else if (sp.type === 'heal') { this.en.hp = Math.min(this.en.max, this.en.hp + Math.abs(sp.dmg)); this.battleText = `${this.en.n}の${sp.name}！\n敵のHPが回復した！`; playSnd('combo'); } else this.battleText = `${this.en.n}の不気味な魔法！\n効果はなかった。`;
      } else {
        const s = this.calcStats(), d = Math.max(1, Math.floor(this.en.atk * (0.8+Math.random()*0.4)) - s.def); this.p.hp -= d;
        this.battleText = `${this.en.n}の攻撃！\n${d}のダメージを受けた！`; playSnd('hit'); screenShake(4);
      }
      this.battleWaitTimer = 60; setTimeout(nextStep, 1000);
    };
    const checkEnd = () => { if (this.p.hp <= 0) this.loseBattle(); else if (this.en.hp <= 0) this.winBattle(); else { this.st = 'battle'; this.mIdx = 0; } };
    const endAction = () => { if (this.en.poisoned && this.en.hp > 0 && this.p.hp > 0) { this.en.hp -= 5; this.battleText = `毒のダメージ！\n${this.en.n}に5ダメージ！`; this.battleWaitTimer = 60; playSnd('hit'); setTimeout(() => checkEnd(), 800); } else checkEnd(); };
    if (!playerFirst && act !== 'run') { this.battleText = `${this.en.n}が素早い！\n先制攻撃！`; this.battleWaitTimer = 60; }
    sequence = playerFirst ? [pAction, eAction, endAction] : [eAction, pAction, endAction];
    const nextStep = () => { if (step < sequence.length) sequence[step++](); };
    if (!playerFirst && act !== 'run') setTimeout(nextStep, 1000); else nextStep();
  },

  battle(bossType, monsterType = 'slime') {
    this.st = 'battle'; this.mIdx = 0; this.battleText = ''; this.battleWaitTimer = 0; BGM.play(bossType ? 'rpg_boss' : 'rpg_battle');
    if (bossType === 'custom') {
      const b = this.customBosses[monsterType];
      this.en = { n: b.name, hp: b.hp, atk: b.atk, def: b.def, spd: b.spd, max: b.hp, exp: Math.floor((b.hp+b.atk+b.def)*1.5), gld: Math.floor((b.hp+b.atk)*1.0), spr: b.sprData || sprs.boss, c: '#0ff', monsterType: 'custom', spells: b.spells||[], poisoned: false };
    } else if (bossType === 'boss') this.en = { n: '魔王', hp: 200, atk: 25, def: 15, spd: 25, max: 200, exp: 0, gld: 0, spr: sprs.dragon, c: '#808', monsterType: 'boss', spells: [0, 1, 4, 5], poisoned: false }; 
    else if (bossType === 'miniboss') { const mData = this.monsterTypes[monsterType]; this.en = { n: mData.name+'の主', hp: mData.hp*3, atk: mData.atk*1.5, def: mData.def*1.5, spd: mData.spd*1.2, max: mData.hp*3, exp: mData.exp*3, gld: mData.gld*3, spr: sprs.boss, c: '#c0c', monsterType: 'boss', spells: mData.spells, poisoned: false }; } 
    else { const l = this.p.lv, mData = this.monsterTypes[monsterType] || this.monsterTypes['slime']; this.en = { n: mData.name, hp: mData.hp + l * 5, atk: mData.atk + l * 2, def: mData.def + l, spd: mData.spd, max: mData.hp + l * 5, exp: mData.exp, gld: mData.gld + l * 2, spr: mData.spr, c: mData.c, monsterType: monsterType, spells: mData.spells || [], poisoned: false }; }
    playSnd('hit');
  },

  loseBattle() { this.p.hp = 0; setTimeout(() => { this.fightingMonsterIdx = -1; if (this.isArena) { this.p.hp = 1; this.isArena = false; BGM.play('rpg_town'); this.msgBox("闘技場で敗北した...", 'customMenu'); } else { if (this.dungeon) this.exitDungeon(); this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.p.x = 4; this.p.y = 8; this.p.areaX = 1; this.p.areaY = 1; this.dungeon = null; this.worldMap = null; this.genMap(); this.msgBox("死んでしまった。\n拠点へ戻された..."); BGM.play('rpg_field'); } }, 500); },
  winBattle() {
    addParticle(100, 120, '#ff0', 'explosion');
    if (this.en.monsterType !== 'boss' && this.en.monsterType !== 'custom' && !this.p.bestiary.includes(this.en.monsterType)) this.p.bestiary.push(this.en.monsterType);
    if (this.fightingMonsterIdx > -1) { this.fieldMonsters.splice(this.fightingMonsterIdx, 1); this.fightingMonsterIdx = -1; }
    if (this.en.n === '魔王') { this.p.story = 4; this.msgBox("魔王を倒した！\n世界に平和が戻った！"); BGM.play('rpg_field'); }
    else if (this.en.monsterType === 'custom') { this.p.exp += this.en.exp; this.p.gld += this.en.gld; this.isArena = false; BGM.play('rpg_town'); this.msgBox(`見事な戦いぶりだ！\n${this.en.gld}G獲得！`, 'customMenu'); }
    else if (this.en.monsterType === 'boss') {
      this.dungeons[this.dungeon.idx].cleared = true; this.p.exp += this.en.exp; this.p.gld += this.en.gld;
      if (this.dungeon.idx === 0 && this.p.story === 0) this.p.story = 1; else if (this.dungeon.idx === 1 && this.p.story === 1) this.p.story = 2; else if (this.dungeon.idx === 2 && this.p.story === 2) this.p.story = 3;
      this.exitDungeon(); this.dungeon = null; this.msgBox(`勝利！ ${this.en.gld}G獲得`);
    } else {
      this.p.exp += this.en.exp; this.p.gld += this.en.gld;
      if (this.p.exp >= this.p.lv * 25) { this.levelUp(); this.msgBox(`勝利！ LvUP！\n${this.en.gld}G獲得`); } 
      else { BGM.play(this.dungeon ? 'rpg_dungeon' : 'rpg_field'); this.msgBox(`勝利！\n${this.en.gld}G獲得`); }
    }
  },
  levelUp() { this.p.lv++; this.p.mhp += 15; this.p.mmp += 8; this.p.atk += 3; this.p.def += 2; this.p.spd += 2; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.p.exp = 0; playSnd('combo'); },
  
  draw() {
    applyShake(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    if (['title', 'saveSelect'].includes(this.st)) {
      const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#001'); g.addColorStop(1, '#103'); ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 300);
      ctx.shadowBlur = 20; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0'; ctx.font = 'bold 24px monospace'; ctx.fillText('MICRO', 65, 80); ctx.fillText('QUEST', 65, 110); ctx.shadowBlur = 0;
      if (this.st === 'title') {
        ctx.fillStyle = this.mIdx === 0 ? '#0f0' : '#aaa'; ctx.font = 'bold 14px monospace'; ctx.fillText((this.mIdx === 0 ? '> ' : '  ') + 'はじめる', 60, 180);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === 1 ? '> ' : '  ') + 'もどる', 60, 210);
      } else {
        for (let i = 0; i < 3; i++) {
          const data = localStorage.getItem('4in1_rpg_slot' + (i+1)); let sd = null; try { if (data) sd = JSON.parse(data); } catch(e) {}
          const sel = this.mIdx === i; ctx.fillStyle = sel ? 'rgba(0,255,0,0.2)' : 'rgba(100,100,100,0.2)'; ctx.fillRect(15, 50 + i * 65, 170, 55); ctx.strokeStyle = sel ? '#0f0' : '#666'; ctx.strokeRect(15, 50 + i * 65, 170, 55);
          ctx.fillStyle = sel ? '#0f0' : '#aaa'; ctx.font = 'bold 12px monospace'; ctx.fillText(`スロット ${i + 1}`, 25, 70 + i * 65);
          if (sd) { ctx.fillStyle = sel ? '#fff' : '#888'; ctx.font = '9px monospace'; const dP = sd.p || sd; ctx.fillText(`Lv${dP.lv} HP${dP.hp}/${dP.mhp}`, 25, 85 + i * 65); } else { ctx.fillStyle = sel ? '#fff' : '#666'; ctx.font = '9px monospace'; ctx.fillText('データなし', 25, 85 + i * 65); }
        }
        ctx.fillStyle = this.mIdx === 3 ? '#0f0' : '#aaa'; ctx.font = 'bold 12px monospace'; ctx.fillText((this.mIdx === 3 ? '> ' : '  ') + 'もどる', 65, 260);
      }
      resetShake(); return;
    }
    
    if (this.st === 'confirmDelete') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(15, 100, 170, 100); ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(15, 100, 170, 100);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.fillText("本当に削除しますか？", 35, 130);
        ctx.fillStyle = this.mIdx === 0 ? '#f00' : '#aaa'; ctx.fillText((this.mIdx === 0 ? "> " : "  ") + "はい", 60, 160);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === 1 ? "> " : "  ") + "いいえ", 60, 180);
        resetShake(); return;
    }

    if (['menu', 'equipMenu', 'spellMenu', 'customMenu', 'bestiary'].includes(this.st)) {
      ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(10, 45, 180, 230); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 45, 180, 230);
      if (this.st === 'menu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM MENU', 60, 70);
        const mItems = ['ステータス', '魔法リスト', 'モンスター図鑑', 'セーブする', 'タイトルへ'];
        for (let i = 0; i < mItems.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '11px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + mItems[i], 30, 105 + i * 25); }
      } else if (this.st === 'bestiary') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('モンスター図鑑', 45, 70);
        if (this.p.bestiary.length === 0) { ctx.fillStyle = '#fff'; ctx.fillText('まだ情報がない', 50, 110); } 
        else {
          let st = Math.max(0, this.mIdx - 2), en = Math.min(this.p.bestiary.length, st + 5), y = 95;
          for (let i = st; i < en; i++) {
            let mD = this.monsterTypes[this.p.bestiary[i]]; if(!mD) continue;
            ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.fillText(`${this.mIdx === i ? '>' : ' '} ${mD.name}`, 20, y);
            if (this.mIdx === i) { drawSprite(120, 100, mD.c, mD.spr, 4); } y += 22;
          }
        }
      } else if (this.st === 'equipMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ステータス', 60, 70); const s = this.calcStats(); ctx.fillStyle = '#fff'; 
        ctx.fillText(`Lv: ${this.p.lv} ATK: ${s.atk} DEF: ${s.def}`, 25, 100);
      } else if (this.st === 'customMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('町外れの工房', 55, 70);
        const wC = 100 + this.p.customWep.lv * 50, aC = 100 + this.p.customArm.lv * 50;
        const mI = [`武器強化 (${wC}G)`, `防具強化 (${aC}G)`, '闘技場', '工房を出る'];
        for (let i = 0; i < mI.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + mI[i], 20, 110 + i * 30); }
      }
      resetShake(); return;
    }

    if (['map', 'dungeon', 'townMap', 'castle'].includes(this.st)) {
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 10; c++) {
          let v = this.map[r][c], sx = c * 20, sy = r * 20 + 45;
          if (v === 0) { ctx.fillStyle = '#141'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '', sprs.grass, 2.5); }
          else if (v === 1) { ctx.fillStyle = '#141'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '', sprs.tree, 2.5); }
          else if (v === 2) { ctx.fillStyle = '#141'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '', sprs.mount, 2.5); }
          else if (v === 3) drawSprite(sx, sy, '', sprs.water, 2.5);
          else if (v === 4) { ctx.fillStyle = '#141'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '', sprs.town, 2.5); }
          else if (v === 5) { ctx.fillStyle = '#141'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '', sprs.cave, 2.5); }
          else if (v === 10 || v === 11) drawSprite(sx, sy, '', (v===10?sprs.wall:sprs.floor), 2.5);
          else if (v === 14) drawSprite(sx, sy, '', sprs.stairs_up, 2.5);
          else if (v === 15) drawSprite(sx, sy, '', sprs.floor, 2.5);
          else if (v === 16) { drawSprite(sx, sy, '', sprs.floor, 2.5); ctx.fillStyle = '#ffd700'; ctx.fillText('王', sx+4, sy+15); }
          else if (v === 21) { drawSprite(sx, sy, '', sprs.wall, 2.5); ctx.fillStyle = '#000'; ctx.fillRect(sx+4, sy+8, 12, 12); }
          else if (v === 22) { drawSprite(sx, sy, '', sprs.floor, 2.5); ctx.fillStyle = 'rgba(200,0,0,0.5)'; ctx.fillRect(sx, sy, 20, 20); }
        }
      }
      for (let m of this.fieldMonsters) {
         let mD = this.monsterTypes[m.type];
         if (mD) drawSprite(m.x * 20, m.y * 20 + 43, mD.c, mD.spr, 2.5);
      }
      drawSprite(this.p.x * 20, this.p.y * 20 + 43, '#ff0', sprs.player, 2.5);
      const s = this.calcStats(); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 35); ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
      ctx.fillText(`Lv${this.p.lv} HP${this.p.hp}/${this.p.mhp} MP${this.p.mp} G${this.p.gld}`, 5, 12);
      ctx.fillText(this.st.toUpperCase(), 150, 12);
    }

    if (['battle', 'magic', 'battleProcessing'].includes(this.st)) {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.fillText(this.en.n, 15, 30);
      ctx.fillStyle = '#f00'; ctx.fillRect(15, 38, 170, 8); ctx.fillStyle = '#0f0'; ctx.fillRect(15, 38, Math.max(0, 170 * (this.en.hp / this.en.max)), 8);
      drawSprite(70, 70, this.en.c, this.en.spr, 12);
      if (this.battleText !== '') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 140, 190, 40); ctx.strokeStyle = '#0f0'; ctx.strokeRect(5, 140, 190, 40);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let lines = this.battleText.split('\n'); for (let i=0; i<lines.length; i++) ctx.fillText(lines[i], 15, 155 + i*15);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 185, 190, 110); ctx.strokeStyle = '#0f0'; ctx.strokeRect(5, 185, 190, 110);
      const s = this.calcStats(); ctx.fillStyle = '#fff'; ctx.fillText(`HP:${this.p.hp}/${this.p.mhp} MP:${this.p.mp}`, 15, 205);
      if (this.st === 'battle') {
          const opts = ['たたかう', 'まほう', 'にげる'];
          for(let i=0; i<3; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#888'; ctx.fillRect(15 + (i%2)*90, 220 + Math.floor(i/2)*30, 80, 25); ctx.fillStyle='#000'; ctx.fillText(opts[i], 25 + (i%2)*90, 237 + Math.floor(i/2)*30); }
      }
    }
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 185, 190, 70); ctx.strokeStyle = '#0f0'; ctx.strokeRect(5, 185, 190, 70);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let l = this.msg.split('\n'); for (let i = 0; i < l.length; i++) ctx.fillText(l[i], 15, 205 + i * 18);
    }
    drawParticles(); resetShake();
  }
};
