// === MICRO QUEST - NEW GAME BUG FIX ===
const RPG = {
  st: 'title', msg: '', msgNextSt: null, mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleWaitTimer: 0, chests: [], customBosses: [], isArena: false,
  fieldMonsters: [], fightingMonsterIdx: -1, 
  
  // 会話可能なNPCリスト
  npcs: [ {x: 8, y: 10, msg: "ようこそ！\nこのまちは　へいわだよ。"}, {x: 15, y: 5, msg: "みなみの　どうくつには\nおそろしい　まものが\nすんでいるらしい..."}, {x: 5, y: 15, msg: "ぶきや　ぼうぐは\nこうぼうで　きょうかできるよ。"} ],
  
  spells: [ {name: 'ファイア', mp: 5, dmg: 15, type: 'atk'}, {name: 'サンダー', mp: 8, dmg: 25, type: 'atk'}, {name: 'ブリザド', mp: 12, dmg: 35, type: 'atk'}, {name: 'ヒール', mp: 10, dmg: -30, type: 'heal'}, {name: 'ポイズン', mp: 8, dmg: 0, type: 'poison'}, {name: 'ドレイン', mp: 15, dmg: 20, type: 'drain'} ],
  monsterTypes: { slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, spd: 3, exp: 15, gld: 8, spells: []}, bat: {name: 'コウモリ', spr: sprs.enemyNew, c: '#80f', hp: 20, atk: 5, def: 1, spd: 8, exp: 20, gld: 12, spells: [5]}, skeleton: {name: '骨戦士', spr: sprs.skull, c: '#aaa', hp: 35, atk: 7, def: 3, spd: 6, exp: 30, gld: 20, spells: []}, mage: {name: '魔道士', spr: sprs.mage, c: '#60c', hp: 25, atk: 10, def: 2, spd: 5, exp: 35, gld: 25, spells: [0, 1, 4]}, golem: {name: 'ゴーレム', spr: sprs.boss, c: '#884', hp: 80, atk: 15, def: 10, spd: 2, exp: 100, gld: 80, spells: []}, dragon: {name: 'ドラゴン', spr: sprs.dragon, c: '#f00', hp: 120, atk: 25, def: 8, spd: 15, exp: 200, gld: 150, spells: [0, 1]} },
  encounterTable: { '1,1': ['slime'], '2,1': ['slime', 'bat'], '1,0': ['bat', 'skeleton', 'mage'], '0,1': ['skeleton', 'mage', 'golem'], '0,0': ['mage', 'golem', 'dragon'], '2,2': ['skeleton', 'dragon'] },

  menu: { open: false, cur: 0, items: ['ステータス', 'じゅもん', 'どうぐ', 'セーブ'] },
  magicMenu: { open: false, cur: 0 }, itemMenu: { open: false, cur: 0 },
  
  init() { this.st = 'title'; this.mIdx = 0; this.anim = 0; BGM.play('rpg_field'); },
  
  loadSave(slot) {
    const data = localStorage.getItem('4in1_rpg_slot' + slot); let sd = null; try { if (data) sd = JSON.parse(data); } catch(e) {}
    if (sd) {
      this.p = sd.p; this.dungeons = sd.dungeons; this.chests = sd.chests; this.customBosses = sd.customBosses || Array(10).fill(null);
      if(!this.p.bestiary) this.p.bestiary = []; if(!this.p.knownSpells) this.p.knownSpells = []; if(!this.p.customWep) this.p.customWep = {atk: 0, lv: 0}; if(!this.p.customArm) this.p.customArm = {def: 0, lv: 0};
    } else {
      this.startNewData(); // ロードデータがない場合は新規作成と同じ処理
    }
    this.saveSlot = slot; this.st = 'map'; this.genMap(); BGM.play('rpg_field');
  },
  
  startNew() {
    this.startNewData();
    this.enterTown();
  },

  // ★ 新規データ作成用（初期化漏れを防ぐため共通化）
  startNewData() {
    this.p = { 
        x: 4, y: 8, dir: 0, 
        hp: 30, mhp: 30, mp: 15, mmp: 15, 
        atk: 5, def: 3, spd: 5, 
        lv: 1, exp: 0, next: 20, gld: 50, 
        items: [], eq: {w:0, a:0}, 
        knownSpells: [], // ★ここが spells: [] だとバグになるので knownSpells に統一
        areaX: 1, areaY: 1, // ★ここが抜けていると街から出た瞬間にエラーになる
        story: 0,
        bestiary: [],
        customWep: {atk: 0, lv: 0}, customArm: {def: 0, lv: 0}
    };
    this.p.items.push({name: 'やくそう', type: 'heal', val: 20}, {name: 'まほうのせいすい', type: 'mp', val: 10});
    this.dungeons = [{cleared: false, boss: 'golem'}, {cleared: false, boss: 'dragon'}, {cleared: false, boss: 'dragon'}]; 
    this.chests = [{ax: 2, ay: 1, x: 2, y: 2, opened: false}, {ax: 0, ay: 1, x: 8, y: 12, opened: false}]; 
    this.customBosses = Array(10).fill(null);
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
    this.map[8][2]=4; this.map[8][7]=5; this.map[11][5]=6;
    this.npcs.forEach(n => { this.map[n.y][n.x] = 7; });
    
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
        else if (this.st === 'spellMenu') {
           let s = this.p.spells[this.mIdx];
           if (this.p.mp >= s.mp && s.type === 'heal') {
              this.p.mp -= s.mp; this.p.hp = Math.min(this.p.mhp, this.p.hp - s.dmg);
              this.msgBox("HPが かいふく した！", this.dungeon?'dungeon':(this.map[0][0]===1||this.map[0][0]===10)?'townMap':'map');
           } else { playSnd('hit'); }
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
          else if (t===8) { if (this.p.story >= 3) { this.battle('boss', 'boss'); } else this.msgBox("今は敵わない…"); return; }
          for (let ch of this.chests) { if (ch.ax===this.p.areaX && ch.ay===this.p.areaY && ch.x===this.p.x && ch.y===this.p.y && !ch.opened) { ch.opened = true; playSnd('combo'); this.p.gld += 100; this.msgBox("100Gを手に入れた！"); return; } }
        } else if (this.st === 'dungeon') {
          if (t===14) { if (this.dungeon.floor===1) this.exitDungeon(); else { this.dungeon.floor--; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); } }
          else if (t===20) { if (this.dungeon.floor===this.dungeon.maxFloor) this.battle('miniboss', this.dungeons[this.dungeon.idx].boss); else { this.dungeon.floor++; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); } }
        } else if (['townMap', 'castle'].includes(this.st)) {
          const adj = [ this.map[this.p.y][this.p.x], this.p.y>0?this.map[this.p.y-1][this.p.x]:0, this.p.y<14?this.map[this.p.y+1][this.p.x]:0, this.p.x>0?this.map[this.p.y][this.p.x-1]:0, this.p.x<9?this.map[this.p.y][this.p.x+1]:0 ];
          if (adj.includes(16)) { this.msgBox(this.p.story===0?"王様「東の洞窟へ行け！」":this.p.story===1?"王様「北の塔へ向かえ！」":this.p.story===2?"王様「北西の魔王城へ！」":"王様「世界に平和が！」"); }
          else if (adj.includes(5)) { if (this.p.gld >= 15) { this.p.gld -= 15; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; playSnd('combo'); this.msgBox("15GでHP/MPが全回復した！"); } else this.msgBox("お金が足りない。"); }
          else if (adj.includes(4)) { const un = [0,1,2,3,4,5].filter(x => !this.p.knownSpells.includes(x)); if (un.length > 0) { if (this.p.gld >= 50) { this.p.gld -= 50; const l = un[Math.floor(Math.random()*un.length)]; this.p.knownSpells.push(l); playSnd('combo'); this.msgBox(`50Gで魔法を習得した！`); } else this.msgBox("50G必要だ。"); } else this.msgBox("全て習得済みだ。"); }
          else if (adj.includes(6)) { this.st = 'customMenu'; this.mIdx = 0; playSnd('sel'); }
          else if (adj.includes(7)) {
             let tx = this.p.x, ty = this.p.y;
             if (this.p.dir === 0) ty++; if (this.p.dir === 3) ty--; if (this.p.dir === 1) tx--; if (this.p.dir === 2) tx++;
             let target = this.npcs.find(n => n.x === tx && n.y === ty);
             if (target) this.msgBox(target.msg);
          }
        }
      }
      
      let nx = this.p.x, ny = this.p.y, moved = false;
      if (keysDown.up) { ny--; this.p.dir = 3; } if (keysDown.down) { ny++; this.p.dir = 0; } if (keysDown.left) { nx--; this.p.dir = 1; } if (keysDown.right) { nx++; this.p.dir = 2; }
      
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
            // ★ 4,5,6,7は建物・NPCなので入れない
            else if (![1,10,12,13,16,17,18,19,21,4,5,6,7].includes(t)) { this.p.x = nx; this.p.y = ny; playSnd('sel'); moved = true; }
          }
        }
      }
      
      // シンボルモンスター移動
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
          const opts = ['たたかう', 'じゅもん', 'にげる'];
          for(let i=0; i<3; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#888'; ctx.fillRect(15 + (i%2)*90, 220 + Math.floor(i/2)*30, 80, 25); ctx.fillStyle='#000'; ctx.fillText(opts[i], 25 + (i%2)*90, 237 + Math.floor(i/2)*30); }
      }
    }
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 185, 190, 70); ctx.strokeStyle = '#0f0'; ctx.strokeRect(5, 185, 190, 70);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let l = this.msg.split('\n'); for (let i = 0; i < l.length; i++) ctx.fillText(l[i], 15, 205 + i * 18);
    }
    
    // ★バグ修正: 魔法メニューの文字色修正
    if (this.st === 'magic') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 45, 180, 230); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 45, 180, 230);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('習得済み魔法', 55, 70);
      if (this.p.knownSpells.length === 0) ctx.fillText("なし", 80, 100);
      else {
         this.p.knownSpells.forEach((idx, i) => {
           const s = this.spells[idx];
           ctx.fillStyle = this.mIdx === i ? '#0f0' : '#fff';
           ctx.fillText((this.mIdx === i ? '> ' : '  ') + s.name + ` (MP${s.mp})`, 25, 100 + i * 20);
         });
      }
    }
    
    drawParticles(); resetShake();
  }
};
