// === MICRO QUEST - MEGA UPDATE ===
const RPG = {
  st: 'title', msg: '', mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleTextTimer: 0, battleWaitTimer: 0, chests: [],
  spells: [
    {name: 'ファイア', mp: 5, dmg: 15, desc: '火の攻撃', type: 'atk'}, {name: 'サンダー', mp: 8, dmg: 25, desc: '雷の攻撃', type: 'atk'}, {name: 'ブリザド', mp: 12, dmg: 35, desc: '氷の攻撃', type: 'atk'},
    {name: 'ヒール', mp: 10, dmg: -30, desc: 'HPを回復', type: 'heal'}, {name: 'ポイズン', mp: 8, dmg: 0, desc: '毎ターンダメージ', type: 'poison'}, {name: 'ドレイン', mp: 15, dmg: 20, desc: '攻撃＆回復', type: 'drain'}
  ],
  monsterTypes: {
    slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, exp: 15, gld: 8, spells: []},
    bat: {name: '大コウモリ', spr: sprs.enemyNew, c: '#80f', hp: 20, atk: 5, def: 1, exp: 20, gld: 12, spells: [5]},
    skeleton: {name: 'スケルトン', spr: sprs.skull, c: '#aaa', hp: 35, atk: 7, def: 3, exp: 30, gld: 20, spells: []},
    mage: {name: 'ダークメイジ', spr: sprs.mage, c: '#60c', hp: 25, atk: 10, def: 2, exp: 35, gld: 25, spells: [0, 1, 4]},
    golem: {name: 'ゴーレム', spr: sprs.boss, c: '#884', hp: 80, atk: 15, def: 10, exp: 100, gld: 80, spells: []},
    dragon: {name: 'ドラゴン', spr: sprs.dragon, c: '#f00', hp: 120, atk: 25, def: 8, exp: 200, gld: 150, spells: [0, 1]}
  },
  encounterTable: { '1,1': ['slime'], '2,1': ['slime', 'bat'], '1,0': ['bat', 'skeleton', 'mage'], '0,1': ['skeleton', 'mage', 'golem'], '0,0': ['mage', 'golem', 'dragon'], '2,2': ['skeleton', 'dragon'] },

  init() { this.st = 'title'; this.mIdx = 0; this.anim = 0; BGM.play('rpg_field'); },
  loadSave(slot) {
    const sd = JSON.parse(localStorage.getItem(`4in1_rpg_slot${slot}`));
    if (sd) {
      this.p = JSON.parse(JSON.stringify(sd.p)); this.dungeons = JSON.parse(JSON.stringify(sd.dungeons)); this.chests = JSON.parse(JSON.stringify(sd.chests));
      if (!this.p.knownSpells) this.p.knownSpells = []; if (!this.p.customWep) this.p.customWep = {atk: 0, lv: 0}; if (!this.p.customArm) this.p.customArm = {def: 0, lv: 0};
    } else {
      this.p = { x: 4, y: 8, areaX: 1, areaY: 1, story: 0, hp: 30, mhp: 30, mp: 15, mmp: 15, atk: 5, def: 3, gld: 0, lv: 1, exp: 0, knownSpells: [], customWep: {atk: 0, lv: 0}, customArm: {def: 0, lv: 0} };
      this.dungeons = [{cleared: false, boss: 'golem'}, {cleared: false, boss: 'dragon'}, {cleared: false, boss: 'dragon'}]; this.chests = [{ax: 2, ay: 1, x: 2, y: 2, opened: false}, {ax: 0, ay: 1, x: 8, y: 12, opened: false}];
    }
    this.saveSlot = slot; this.st = 'map'; this.genMap(); BGM.play('rpg_field');
  },
  saveGame() {
    let sObj = { p: JSON.parse(JSON.stringify(this.p)), dungeons: JSON.parse(JSON.stringify(this.dungeons)), chests: JSON.parse(JSON.stringify(this.chests)) };
    if (this.st === 'dungeon') { sObj.p.x = this.p.worldX; sObj.p.y = this.p.worldY; sObj.p.areaX = this.p.worldAx; sObj.p.areaY = this.p.worldAy; }
    else if (this.st === 'townMap') { sObj.p.x = this.p.worldX; sObj.p.y = this.p.worldY; }
    localStorage.setItem(`4in1_rpg_slot${this.saveSlot}`, JSON.stringify(sObj));
  },
  genMap() {
    this.map = Array(15).fill().map(() => Array(10).fill(0));
    let ax = this.p.areaX, ay = this.p.areaY, seed = ax * 10 + ay + 100;
    let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        let v = rand(); if (v < 0.15) this.map[r][c] = 1; else if (v < 0.25) this.map[r][c] = 2;
        if ((ax === 0 && c === 0) || (ax === 2 && c === 9) || (ay === 0 && r === 0) || (ay === 2 && r === 14)) this.map[r][c] = 3;
        if (ay === 2 && this.map[r][c] === 0) this.map[r][c] = 9;
      }
    }
    if (ax === 1 && ay === 1) { this.map[7][4] = 4; this.map[7][5] = 4; }
    if (ax === 2 && ay === 1) { this.map[5][5] = 5; }
    if (ax === 1 && ay === 0) { this.map[3][4] = 6; }
    if (ax === 0 && ay === 1) { this.map[8][2] = 7; }
    if (ax === 0 && ay === 0) { this.map[3][3] = 8; this.map[3][2] = 8; this.map[2][3] = 8; this.map[2][2] = 8; }
  },
  genTownMap() {
    this.map = Array(15).fill().map(() => Array(10).fill(0));
    for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { if (r === 0 || r === 14 || c === 0 || c === 9) this.map[r][c] = 1; else this.map[r][c] = 15; } }
    this.map[14][4] = 15; this.map[14][5] = 15; // 出口
    this.map[3][4] = 16; this.map[3][5] = 16; // 城
    this.map[8][2] = 17; this.map[8][7] = 18; // 宿屋・店
    this.map[11][5] = 19; // 工房
    this.p.worldX = this.p.x; this.p.worldY = this.p.y; this.p.x = 4; this.p.y = 13;
  },
  genDungeonMap(type) {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        if (type === 'cave') this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || Math.random() < 0.25) ? 10 : 11;
        else if (type === 'tower') this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || (r % 3 === 0 && Math.random() < 0.4)) ? 12 : 11;
        else this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || Math.random() < 0.2) ? 13 : 11;
      }
    }
    this.map[13][5] = 14; // 上り階段 (外へ、または前の階へ)
    this.p.x = 5; this.p.y = 13;
    let gx = Math.floor(Math.random()*8)+1; let gy = Math.floor(Math.random()*8)+1;
    this.map[gy][gx] = 20; // 下り階段 (次の階へ、またはボスへ)
  },
  msgBox(t) { this.msg = t; this.st = 'msg'; playSnd('sel'); },
  setBattleText(text) { this.battleText = text; this.battleTextTimer = 60; this.battleWaitTimer = 60; },
  enterDungeon(idx, type) {
    if (this.dungeons[idx] && this.dungeons[idx].cleared) { this.msgBox("魔物は討伐済みだ。"); return; }
    this.st = 'dungeon'; this.dungeon = {idx: idx, floor: 1, maxFloor: 3, type: type};
    this.p.worldX = this.p.x; this.p.worldY = this.p.y; this.p.worldAx = this.p.areaX; this.p.worldAy = this.p.areaY; this.worldMap = this.map.map(r => [...r]);
    this.genDungeonMap(type); BGM.play('rpg_dungeon'); this.msgBox(`${['洞窟', '塔', '遺跡'][idx]}に入った！\nF1`);
  },
  exitDungeon() { this.map = this.worldMap; this.p.x = this.p.worldX; this.p.y = this.p.worldY; this.st = 'map'; BGM.play('rpg_field'); },
  calcStats() { return { atk: this.p.atk + this.p.customWep.atk, def: this.p.def + this.p.customArm.def }; },
  
  update() {
    this.anim++; if (this.battleWaitTimer > 0) { this.battleWaitTimer--; return; }
    if (keysDown.select) {
      if (this.st === 'title' || this.st === 'saveSelect') { activeApp = Menu; Menu.init(); return; }
      if (this.st === 'map' || this.st === 'dungeon' || this.st === 'townMap') { this.st = 'menu'; this.mIdx = 0; playSnd('sel'); return; }
      if (this.st === 'menu') { this.st = this.dungeon ? 'dungeon' : this.map[0][0]===1? 'townMap' : 'map'; return; }
    }
    
    if (this.st === 'title' || this.st === 'saveSelect' || this.st === 'menu' || this.st === 'equipMenu' || this.st === 'spellMenu' || this.st === 'customMenu') {
      // メニュー系UI処理（前半）
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(this.st==='saveSelect'?3:this.st==='menu'?3:5, this.mIdx + 1); playSnd('sel'); }
      
      if (keysDown.a) {
        if (this.st === 'title') { if (this.mIdx === 0) { this.st = 'saveSelect'; this.mIdx = 0; } else { activeApp = Menu; Menu.init(); } playSnd('jmp'); }
        else if (this.st === 'saveSelect') { if (this.mIdx < 3) { this.loadSave(this.mIdx + 1); playSnd('jmp'); } else { this.st = 'title'; this.mIdx = 0; } }
        else if (this.st === 'menu') {
          if (this.mIdx === 0) { this.st = 'equipMenu'; playSnd('jmp'); } else if (this.mIdx === 1) { this.st = 'spellMenu'; this.mIdx = 0; playSnd('jmp'); }
          else if (this.mIdx === 2) { this.saveGame(); this.msgBox("セーブしました！"); } else if (this.mIdx === 3) { this.st = 'title'; this.mIdx = 0; }
        }
        else if (this.st === 'customMenu') {
          // カスタム工房
          if (this.mIdx === 0) { // 武器強化
            let cost = 100 + this.p.customWep.lv * 50;
            if (this.p.gld >= cost) { this.p.gld -= cost; this.p.customWep.atk += 5; this.p.customWep.lv++; playSnd('combo'); this.msgBox(`武器を強化した！\n(ATK+5)`); } else playSnd('hit');
          } else if (this.mIdx === 1) { // 防具強化
            let cost = 100 + this.p.customArm.lv * 50;
            if (this.p.gld >= cost) { this.p.gld -= cost; this.p.customArm.def += 3; this.p.customArm.lv++; playSnd('combo'); this.msgBox(`防具を強化した！\n(DEF+3)`); } else playSnd('hit');
          } else if (this.mIdx === 2) { // 闘技場（カスタムモンスター）
            this.battle('custom'); // 後で実装
          } else if (this.mIdx === 3) { this.st = 'townMap'; this.mIdx = 0; }
        }
      }
      if (keysDown.b) {
        if (this.st === 'saveSelect' && this.mIdx < 3) { if (localStorage.getItem(`4in1_rpg_slot${this.mIdx+1}`)) { this.deleteSave(this.mIdx+1); playSnd('hit'); } }
        if (this.st === 'equipMenu' || this.st === 'spellMenu') { this.st = 'menu'; this.mIdx = 0; }
        if (this.st === 'customMenu') { this.st = 'townMap'; this.mIdx = 0; }
      }
      return;
    }

    if (this.st === 'msg') { if (keysDown.a) { this.st = this.dungeon ? 'dungeon' : this.map[0][0]===1 ? 'townMap' : 'map'; } return; }

    if (this.st === 'map' || this.st === 'dungeon' || this.st === 'townMap') {
      if (keysDown.a) {
        let curTile = this.map[this.p.y][this.p.x];
        if (this.st === 'map') {
          if (curTile === 4) { this.st = 'townMap'; this.genTownMap(); BGM.play('rpg_town'); return; }
          else if (curTile === 5) { this.enterDungeon(0, 'cave'); return; }
          else if (curTile === 6) { if (this.p.story >= 1) this.enterDungeon(1, 'tower'); else this.msgBox("封鎖されている。"); return; }
          else if (curTile === 7) { if (this.p.story >= 2) this.enterDungeon(2, 'ruins'); else this.msgBox("封印されている。"); return; }
          else if (curTile === 8) { if (this.p.story >= 3) { this.battle('boss', 'demon_king'); } else this.msgBox("今の力では到底敵わない…"); return; }
          for (let chest of this.chests) { if (chest.ax === this.p.areaX && chest.ay === this.p.areaY && chest.x === this.p.x && chest.y === this.p.y && !chest.opened) { chest.opened = true; playSnd('combo'); this.p.gld += 100; this.msgBox("宝箱を開けた！\n100Gを手に入れた！"); return; } }
        } else if (this.st === 'dungeon') {
          if (curTile === 14) { // 上り階段
            if (this.dungeon.floor === 1) { this.exitDungeon(); } else { this.dungeon.floor--; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); }
          } else if (curTile === 20) { // 下り階段
            if (this.dungeon.floor === this.dungeon.maxFloor) { this.battle('miniboss', this.dungeons[this.dungeon.idx].boss); }
            else { this.dungeon.floor++; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); }
          }
        } else if (this.st === 'townMap') {
          // 町の施設との会話
          if (Math.abs(this.p.x - 4) < 2 && this.p.y === 4) { // 王様
            if (this.p.story === 0) this.msgBox("王様「勇者よ！\n東の洞窟の魔物を\n討伐してくれ！」");
            else if (this.p.story === 1) this.msgBox("王様「おお！次は\n北の塔へ向かうのじゃ！」");
            else if (this.p.story === 2) this.msgBox("王様「西の遺跡の力を\n得たようだな。\nいざ、北西の魔王城へ！」");
            else this.msgBox("王様「世界に平和が訪れた！\nありがとう勇者よ！」");
          } else if (this.p.x === 2 && this.p.y === 9) { // 宿屋
            if (this.p.gld >= 15) { this.p.gld -= 15; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; playSnd('combo'); addParticle(100, 150, '#0f0', 'star'); this.msgBox("15GでHP/MPが全回復した！"); } else this.msgBox("お金が足りないようだ。");
          } else if (this.p.x === 7 && this.p.y === 9) { // 魔法屋 (ランダムで1つ習得)
            const unlearned = [0,1,2,3,4,5].filter(x => !this.p.knownSpells.includes(x));
            if (unlearned.length > 0) {
              if (this.p.gld >= 50) {
                this.p.gld -= 50; const learn = unlearned[Math.floor(Math.random()*unlearned.length)]; this.p.knownSpells.push(learn); playSnd('combo'); this.msgBox(`50Gで ${this.spells[learn].name} を\n習得した！`);
              } else this.msgBox("魔法の習得には\n50G必要だ。");
            } else this.msgBox("全ての魔法を\n習得済みだ。");
          } else if (this.p.x === 5 && this.p.y === 12) { // カスタム工房
            this.st = 'customMenu'; this.mIdx = 0; playSnd('sel');
          }
        }
      }

      let nx = this.p.x, ny = this.p.y;
      if (keysDown.up) ny--; if (keysDown.down) ny++; if (keysDown.left) nx--; if (keysDown.right) nx++;
      if (nx !== this.p.x || ny !== this.p.y) {
        if (this.st === 'map') {
          if (nx < 0) { if (this.p.areaX > 0) { this.p.areaX--; this.p.x = 9; this.genMap(); playSnd('jmp'); } }
          else if (nx > 9) { if (this.p.areaX < 2) { this.p.areaX++; this.p.x = 0; this.genMap(); playSnd('jmp'); } }
          else if (ny < 0) { if (this.p.areaY > 0) { this.p.areaY--; this.p.y = 14; this.genMap(); playSnd('jmp'); } }
          else if (ny > 14) { if (this.p.areaY < 2) { this.p.areaY++; this.p.y = 0; this.genMap(); playSnd('jmp'); } }
          else {
            let tile = this.map[ny][nx];
            if (tile !== 1 && tile !== 2 && tile !== 3) {
              this.p.x = nx; this.p.y = ny; playSnd('sel');
              if ((tile === 0 || tile === 9) && Math.random() < 0.12) {
                const key = `${this.p.areaX},${this.p.areaY}`;
                const enc = this.encounterTable[key] || ['slime'];
                this.battle(false, enc[Math.floor(Math.random() * enc.length)]);
              }
            }
          }
        } else if (this.st === 'dungeon' || this.st === 'townMap') {
          let tile = this.map[ny][nx];
          if (tile !== 1 && tile !== 10 && tile !== 12 && tile !== 13) {
            this.p.x = nx; this.p.y = ny; playSnd('sel');
            if (this.st === 'dungeon' && Math.random() < 0.15) {
              const enc = this.encounterTable[`${this.p.worldAx},${this.p.worldAy}`] || ['slime'];
              this.battle(false, enc[Math.floor(Math.random() * enc.length)]);
            } else if (this.st === 'townMap' && ny > 14) {
              // 町から出る
              this.map = this.worldMap; this.p.x = this.p.worldX; this.p.y = this.p.worldY; this.st = 'map'; BGM.play('rpg_field');
            }
          }
        }
      }
    }
