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
    this.map[13][5] = 14; // 上り階段
    this.p.x = 5; this.p.y = 13;
    let gx = Math.floor(Math.random()*8)+1; let gy = Math.floor(Math.random()*8)+1;
    this.map[gy][gx] = 20; // 下り階段
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
          if (this.mIdx === 0) {
            let cost = 100 + this.p.customWep.lv * 50;
            if (this.p.gld >= cost) { this.p.gld -= cost; this.p.customWep.atk += 5; this.p.customWep.lv++; playSnd('combo'); this.msgBox(`武器を強化した！\n(ATK+5)`); } else playSnd('hit');
          } else if (this.mIdx === 1) {
            let cost = 100 + this.p.customArm.lv * 50;
            if (this.p.gld >= cost) { this.p.gld -= cost; this.p.customArm.def += 3; this.p.customArm.lv++; playSnd('combo'); this.msgBox(`防具を強化した！\n(DEF+3)`); } else playSnd('hit');
          } else if (this.mIdx === 2) { this.battle('custom'); } else if (this.mIdx === 3) { this.st = 'townMap'; this.mIdx = 0; }
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
          if (curTile === 14) {
            if (this.dungeon.floor === 1) { this.exitDungeon(); } else { this.dungeon.floor--; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); }
          } else if (curTile === 20) {
            if (this.dungeon.floor === this.dungeon.maxFloor) { this.battle('miniboss', this.dungeons[this.dungeon.idx].boss); }
            else { this.dungeon.floor++; this.genDungeonMap(this.dungeon.type); playSnd('jmp'); }
          }
        } else if (this.st === 'townMap') {
          // ★ バグ修正：周囲のタイルをチェックして会話できるように改善
          const getAdj = () => [
            this.map[this.p.y][this.p.x],
            this.p.y > 0 ? this.map[this.p.y - 1][this.p.x] : 0,
            this.p.y < 14 ? this.map[this.p.y + 1][this.p.x] : 0,
            this.p.x > 0 ? this.map[this.p.y][this.p.x - 1] : 0,
            this.p.x < 9 ? this.map[this.p.y][this.p.x + 1] : 0
          ];
          const adj = getAdj();
          if (adj.includes(16)) {
            if (this.p.story === 0) this.msgBox("王様「勇者よ！\n東の洞窟の魔物を\n討伐してくれ！」");
            else if (this.p.story === 1) this.msgBox("王様「おお！次は\n北の塔へ向かうのじゃ！」");
            else if (this.p.story === 2) this.msgBox("王様「西の遺跡の力を\n得たようだな。\nいざ、北西の魔王城へ！」");
            else this.msgBox("王様「世界に平和が訪れた！\nありがとう勇者よ！」");
          } else if (adj.includes(17)) {
            if (this.p.gld >= 15) { this.p.gld -= 15; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; playSnd('combo'); addParticle(100, 150, '#0f0', 'star'); this.msgBox("15GでHP/MPが全回復した！"); } else this.msgBox("お金が足りないようだ。");
          } else if (adj.includes(18)) {
            const unlearned = [0,1,2,3,4,5].filter(x => !this.p.knownSpells.includes(x));
            if (unlearned.length > 0) {
              if (this.p.gld >= 50) { this.p.gld -= 50; const learn = unlearned[Math.floor(Math.random()*unlearned.length)]; this.p.knownSpells.push(learn); playSnd('combo'); this.msgBox(`50Gで ${this.spells[learn].name} を\n習得した！`); } else this.msgBox("魔法の習得には\n50G必要だ。");
            } else this.msgBox("全ての魔法を\n習得済みだ。");
          } else if (adj.includes(19)) { this.st = 'customMenu'; this.mIdx = 0; playSnd('sel'); }
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
                const key = `${this.p.areaX},${this.p.areaY}`; const enc = this.encounterTable[key] || ['slime']; this.battle(false, enc[Math.floor(Math.random() * enc.length)]);
              }
            }
          }
        } else if (this.st === 'dungeon' || this.st === 'townMap') {
          // ★ バグ修正：町から出る時にエラーにならないよう境界条件を厳格化
          if (this.st === 'townMap' && ny > 14) {
            this.map = this.worldMap; this.p.x = this.p.worldX; this.p.y = this.p.worldY; this.st = 'map'; BGM.play('rpg_field');
          } else if (ny >= 0 && ny < 15 && nx >= 0 && nx < 10) {
            let tile = this.map[ny][nx];
            // NPCや施設（16〜19）の上には乗れないようにブロック
            if (tile !== 1 && tile !== 10 && tile !== 12 && tile !== 13 && tile !== 16 && tile !== 17 && tile !== 18 && tile !== 19) {
              this.p.x = nx; this.p.y = ny; playSnd('sel');
              if (this.st === 'dungeon' && Math.random() < 0.15) {
                const enc = this.encounterTable[`${this.p.worldAx},${this.p.worldAy}`] || ['slime']; this.battle(false, enc[Math.floor(Math.random() * enc.length)]);
              }
            }
          }
        }
      }
    }
    if (this.st === 'battle') {
      if (this.en.poisoned && this.battleWaitTimer === 0 && this.mIdx >= 0) {
        this.en.hp -= 5; this.setBattleText(`毒のダメージ！\n${this.en.n}に5ダメージ！`); playSnd('hit');
        if (this.en.hp <= 0) setTimeout(() => this.winBattle(), 500); return;
      }
      
      if (keysDown.left || keysDown.right) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx < 2 ? this.mIdx + 2 : this.mIdx - 2; playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) {
          playSnd('jmp'); const s = this.calcStats();
          let baseDmg = s.atk - this.en.def; let rand = 0.8 + Math.random() * 0.4; let isCrit = Math.random() < 0.1;
          if (isCrit) { baseDmg = s.atk * 1.5; }
          let d = Math.max(1, Math.floor(baseDmg * rand));
          this.en.hp -= d; this.setBattleText(`${isCrit?'クリティカル！\n':''}${this.en.n}に\n${d}のダメージ！`); screenShake(3); addParticle(100, 120, this.en.c, 'explosion');
          if (this.en.hp <= 0) setTimeout(() => this.winBattle(), 500); else setTimeout(() => this.enemyAttack(), 500);
        } else if (this.mIdx === 1) { this.st = 'magic'; this.mIdx = 0; playSnd('sel'); } 
        else if (this.mIdx === 2) {
          if (this.en.monsterType === 'boss') { this.setBattleText('ボスからは逃げられない！'); setTimeout(() => this.enemyAttack(), 500); }
          else { this.setBattleText('無事に逃げ切った！'); setTimeout(() => { if(this.dungeon) this.st='dungeon'; else this.st = 'map'; BGM.play(this.dungeon?'rpg_dungeon':'rpg_field'); }, 500); }
        }
      }
    }
    if (this.st === 'magic') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(this.p.knownSpells.length, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx < this.p.knownSpells.length) {
          const sp = this.spells[this.p.knownSpells[this.mIdx]];
          if (this.p.mp >= sp.mp) {
            this.p.mp -= sp.mp;
            if (sp.type === 'atk') {
              let d = Math.max(1, Math.floor((sp.dmg) * (0.8 + Math.random()*0.4)));
              this.en.hp -= d; this.setBattleText(`${sp.name}！\n${this.en.n}に${d}ダメージ！`); playSnd('combo'); addParticle(100, 120, '#f0f', 'explosion'); screenShake(5);
              if (this.en.hp <= 0) setTimeout(() => this.winBattle(), 500); else setTimeout(() => this.enemyAttack(), 500);
            } else if (sp.type === 'heal') {
              let heal = Math.abs(sp.dmg); this.p.hp = Math.min(this.p.mhp, this.p.hp + heal); this.setBattleText(`${sp.name}！\nHPが${heal}回復した！`); playSnd('combo'); addParticle(100, 200, '#0f0', 'star'); setTimeout(() => this.enemyAttack(), 500);
            } else if (sp.type === 'poison') {
              this.en.poisoned = true; this.setBattleText(`${sp.name}！\n${this.en.n}は毒を浴びた！`); playSnd('combo'); setTimeout(() => this.enemyAttack(), 500);
            } else if (sp.type === 'drain') {
              let d = Math.max(1, Math.floor(sp.dmg)); this.en.hp -= d; this.p.hp = Math.min(this.p.mhp, this.p.hp + Math.floor(d/2)); this.setBattleText(`${sp.name}！\n${d}ダメージ与え、回復した！`); playSnd('combo'); addParticle(100, 120, '#f0f', 'explosion'); screenShake(5);
              if (this.en.hp <= 0) setTimeout(() => this.winBattle(), 500); else setTimeout(() => this.enemyAttack(), 500);
            }
            this.st = 'battle'; this.mIdx = -1; // ターン終了待ちフラグ
          } else playSnd('hit');
        } else { this.st = 'battle'; this.mIdx = 0; }
      }
      if (keysDown.b) { this.st = 'battle'; this.mIdx = 0; }
    }
    updateParticles();
  },

  battle(bossType, monsterType = 'slime') {
    this.st = 'battle'; this.mIdx = 0; this.battleText = ''; this.battleTextTimer = 0; this.battleWaitTimer = 0; BGM.play(bossType ? 'rpg_boss' : 'rpg_battle');
    if (bossType === 'custom') {
      const l = this.p.lv + 5;
      this.en = { n: '破壊闘神', hp: 100 + l * 15, atk: 15 + l * 3, def: 10 + l * 2, max: 100 + l * 15, exp: 500, gld: 500, spr: sprs.dragon, c: '#0ff', monsterType: 'boss', spells: [0, 1, 3] };
    } else if (bossType === 'boss') {
      this.en = { n: '魔王', hp: 200, atk: 25, def: 15, max: 200, exp: 0, gld: 0, spr: sprs.dragon, c: '#808', monsterType: 'boss', spells: [0, 1, 4, 5] };
    } else if (bossType === 'miniboss') {
      const mData = this.monsterTypes[monsterType];
      this.en = { n: mData.name+'の主', hp: mData.hp*3, atk: mData.atk*1.5, def: mData.def*1.5, max: mData.hp*3, exp: mData.exp*3, gld: mData.gld*3, spr: sprs.boss, c: '#c0c', monsterType: 'boss', spells: mData.spells };
    } else {
      const l = this.p.lv; const mData = this.monsterTypes[monsterType] || this.monsterTypes['slime'];
      this.en = { n: mData.name, hp: mData.hp + l * 5, atk: mData.atk + l * 2, def: mData.def + l, max: mData.hp + l * 5, exp: mData.exp, gld: mData.gld + l * 2, spr: mData.spr, c: mData.c, monsterType: monsterType, spells: mData.spells || [] };
    }
    playSnd('hit');
  },

  enemyAttack() {
    if (this.en.spells && this.en.spells.length > 0 && Math.random() < 0.3) {
      const spIdx = this.en.spells[Math.floor(Math.random() * this.en.spells.length)];
      const sp = this.spells[spIdx];
      if (sp.type === 'atk' || sp.type === 'drain') {
        let d = Math.max(1, Math.floor(sp.dmg * 0.8)); this.p.hp -= d; this.setBattleText(`${this.en.n}の${sp.name}！\n${d}のダメージを受けた！`); playSnd('hit'); screenShake(4);
      } else if (sp.type === 'heal') {
        this.en.hp = Math.min(this.en.max, this.en.hp + Math.abs(sp.dmg)); this.setBattleText(`${this.en.n}の${sp.name}！\n敵のHPが回復した！`); playSnd('combo');
      } else {
        this.setBattleText(`${this.en.n}の不気味な魔法！\nしかし効果はなかった。`);
      }
    } else {
      const s = this.calcStats(); const d = Math.max(1, Math.floor(this.en.atk * (0.8+Math.random()*0.4)) - s.def); this.p.hp -= d;
      this.setBattleText(`${this.en.n}の攻撃！\n${d}のダメージを受けた！`); playSnd('hit'); screenShake(4);
    }
    
    if (this.p.hp <= 0) {
      setTimeout(() => {
        if (this.dungeon) this.exitDungeon(); this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.p.x = 4; this.p.y = 8; this.p.areaX = 1; this.p.areaY = 1; this.dungeon = null;
        this.worldMap = null; this.genMap(); this.msgBox("死んでしまった。\n拠点へ戻された..."); BGM.play('rpg_field');
      }, 500);
    } else {
      this.mIdx = 0;
    }
  },

  winBattle() {
    addParticle(100, 120, '#ff0', 'explosion');
    if (this.en.n === '魔王') { this.p.story = 4; this.msgBox("魔王を倒した！\n世界に平和が戻った！"); this.map[13][8] = 0; BGM.play('rpg_field'); }
    else if (this.en.n === '破壊闘神') { this.msgBox("見事な戦いぶりだ！\n500Gと莫大な経験値を得た！"); this.p.exp += 500; this.p.gld += 500; this.st = 'townMap'; BGM.play('rpg_town'); }
    else if (this.en.monsterType === 'boss') {
      this.dungeons[this.dungeon.idx].cleared = true; this.p.exp += this.en.exp; this.p.gld += this.en.gld;
      if (this.dungeon.idx === 0 && this.p.story === 0) this.p.story = 1;
      if (this.dungeon.idx === 1 && this.p.story === 1) this.p.story = 2;
      if (this.dungeon.idx === 2 && this.p.story === 2) this.p.story = 3;
      this.exitDungeon(); this.dungeon = null;
      if (this.p.exp >= this.p.lv * 25) { this.levelUp(); this.msgBox(`魔物を退治した！\nLvUP! ${this.en.gld}G獲得`); } else this.msgBox(`魔物を退治した！\n${this.en.gld}G獲得`);
    } else {
      this.p.exp += this.en.exp; this.p.gld += this.en.gld;
      if (this.p.exp >= this.p.lv * 25) { this.levelUp(); this.msgBox(`勝利！ LvUP！\n${this.en.gld}G獲得`); } else { this.st = this.dungeon ? 'dungeon' : 'map'; BGM.play(this.dungeon?'rpg_dungeon':'rpg_field'); }
    }
  },
  levelUp() { this.p.lv++; this.p.mhp += 15; this.p.mmp += 8; this.p.atk += 3; this.p.def += 2; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.p.exp = 0; playSnd('combo'); },
  
  draw() {
    applyShake(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    if (this.st === 'title' || this.st === 'saveSelect') {
      const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#001'); g.addColorStop(1, '#103'); ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 300);
      ctx.shadowBlur = 20; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0'; ctx.font = 'bold 24px monospace'; ctx.fillText('MICRO', 65, 80); ctx.fillText('QUEST', 65, 110); ctx.shadowBlur = 0;
      ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('～広大なる冒険～', 55, 135);
      if (this.st === 'title') {
        ctx.fillStyle = this.mIdx === 0 ? '#0f0' : '#aaa'; ctx.font = 'bold 14px monospace'; ctx.fillText((this.mIdx === 0 ? '> ' : '  ') + 'はじめる', 60, 180);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#aaa'; ctx.fillText((this.mIdx === 1 ? '> ' : '  ') + 'もどる', 60, 210);
        ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText('↑↓: 選択  A: 決定', 50, 270);
      } else {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('セーブデータ', 50, 30);
        for (let i = 0; i < 3; i++) {
          const sd = JSON.parse(localStorage.getItem(`4in1_rpg_slot${i + 1}`)); const sel = this.mIdx === i;
          ctx.fillStyle = sel ? 'rgba(0,255,0,0.2)' : 'rgba(100,100,100,0.2)'; ctx.fillRect(15, 50 + i * 65, 170, 55); ctx.strokeStyle = sel ? '#0f0' : '#666'; ctx.lineWidth = 2; ctx.strokeRect(15, 50 + i * 65, 170, 55); ctx.lineWidth = 1;
          ctx.fillStyle = sel ? '#0f0' : '#aaa'; ctx.font = 'bold 12px monospace'; ctx.fillText(`スロット ${i + 1}`, 25, 70 + i * 65);
          if (sd) {
            ctx.fillStyle = sel ? '#fff' : '#888'; ctx.font = '9px monospace'; const dP = sd.p || sd;
            ctx.fillText(`Lv${dP.lv} HP${dP.hp}/${dP.mhp} G:${dP.gld}`, 25, 85 + i * 65);
            if (sel) { ctx.fillStyle = '#f00'; ctx.font = '8px monospace'; ctx.fillText('[B:削除]', 140, 98 + i * 65); }
          } else { ctx.fillStyle = sel ? '#fff' : '#666'; ctx.font = '9px monospace'; ctx.fillText('データなし', 25, 85 + i * 65); }
        }
        ctx.fillStyle = this.mIdx === 3 ? '#0f0' : '#aaa'; ctx.font = 'bold 12px monospace'; ctx.fillText((this.mIdx === 3 ? '> ' : '  ') + 'もどる', 65, 260);
      }
      resetShake(); return;
    }
    
    if (this.st === 'menu' || this.st === 'equipMenu' || this.st === 'spellMenu' || this.st === 'customMenu') {
      for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { ctx.fillStyle = '#222'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); } }
      ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(10, 50, 180, 200); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 50, 180, 200);
      if (this.st === 'menu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM MENU', 60, 75);
        const mItems = ['ステータス', '魔法リスト', 'セーブする', 'タイトルへ'];
        for (let i = 0; i < mItems.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '11px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + mItems[i], 30, 110 + i * 25); }
      } else if (this.st === 'equipMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ステータス', 60, 75); const s = this.calcStats(); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`Lv: ${this.p.lv}  EXP: ${this.p.exp}`, 30, 105); ctx.fillText(`ATK: ${s.atk}   DEF: ${s.def}`, 30, 125);
        ctx.fillText('武器: CUSTOM WEP Lv.' + this.p.customWep.lv, 30, 155); ctx.fillText('防具: CUSTOM ARM Lv.' + this.p.customArm.lv, 30, 175);
      } else if (this.st === 'spellMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('習得魔法', 65, 75); ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        if (this.p.knownSpells.length === 0) ctx.fillText('魔法を習得していない', 30, 120); else { let y = 105; for (let idx of this.p.knownSpells) { const sp = this.spells[idx]; ctx.fillStyle = sp.type==='heal'?'#0f0':sp.type==='poison'?'#a0f':'#fff'; ctx.fillText(`${sp.name} (MP${sp.mp})`, 30, y); ctx.fillStyle='#aaa'; ctx.font = '8px monospace'; ctx.fillText(sp.desc, 35, y + 12); ctx.font = '10px monospace'; y += 25; } }
      } else if (this.st === 'customMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('町外れの工房', 55, 75); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`所持金: ${this.p.gld}G`, 120, 75);
        const wC = 100 + this.p.customWep.lv * 50; const aC = 100 + this.p.customArm.lv * 50;
        const mItems = [`武器強化 (${wC}G)`, `防具強化 (${aC}G)`, '闘技場 (カスタムボス)', '工房を出る'];
        for (let i = 0; i < mItems.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '10px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + mItems[i], 20, 110 + i * 25); }
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText(this.st==='menu'?'A:決定 SELECT:戻る':'B:戻る', 50, 235); resetShake(); return;
    }

    if (this.st === 'map' || this.st === 'dungeon' || this.st === 'townMap' || this.st === 'town') {
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 10; c++) {
          let v = this.map[r][c];
          if (v === 0) { ctx.fillStyle = '#282'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#171'; ctx.fillRect(c*20+2, r*20+47, 4, 4); }
          else if (v === 1) { ctx.fillStyle = '#151'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#040'; ctx.fillRect(c*20+10, r*20+45, 8, 16); }
          else if (v === 2) { ctx.fillStyle = '#555'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#777'; ctx.beginPath(); ctx.moveTo(c*20+10,r*20+45); ctx.lineTo(c*20+20,r*20+65); ctx.lineTo(c*20,r*20+65); ctx.fill(); }
          else if (v === 3) { ctx.fillStyle = '#00a'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#08f'; ctx.fillRect(c*20+5, r*20+55, 10, 2); }
          else if (v === 4) { ctx.fillStyle = '#e90'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans'; ctx.fillText('町', c * 20 + 4, r * 20 + 59); }
          else if (v >= 5 && v <= 7) { ctx.fillStyle = '#808'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans'; ctx.fillText('D', c * 20 + 5, r * 20 + 59); }
          else if (v === 8) { ctx.fillStyle = '#f00'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); }
          else if (v === 9) { ctx.fillStyle = '#ca6'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#dca'; ctx.fillRect(c*20+5, r*20+47, 3, 3); }
          else if (v === 10) { ctx.fillStyle = '#333'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); }
          else if (v === 11) { ctx.fillStyle = '#555'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); }
          else if (v === 12) { ctx.fillStyle = '#777'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); }
          else if (v === 13) { ctx.fillStyle = '#654'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); }
          else if (v === 14) { ctx.fillStyle = '#0f0'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#000'; ctx.font = 'bold 14px monospace'; ctx.fillText('<', c * 20 + 5, r * 20 + 60); }
          else if (v === 15) { ctx.fillStyle = '#753'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#975'; ctx.fillRect(c*20, r*20+45, 20, 10); }
          else if (v === 16) { ctx.fillStyle = '#ccf'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#00f'; ctx.font = 'bold 10px monospace'; ctx.fillText('王', c * 20 + 5, r * 20 + 60); }
          else if (v === 17) { ctx.fillStyle = '#fcc'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#f00'; ctx.font = 'bold 10px monospace'; ctx.fillText('宿', c * 20 + 5, r * 20 + 60); }
          else if (v === 18) { ctx.fillStyle = '#cfc'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#0a0'; ctx.font = 'bold 10px monospace'; ctx.fillText('魔', c * 20 + 5, r * 20 + 60); }
          else if (v === 19) { ctx.fillStyle = '#ffc'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#a80'; ctx.font = 'bold 10px monospace'; ctx.fillText('工', c * 20 + 5, r * 20 + 60); }
          else if (v === 20) { ctx.fillStyle = '#f00'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.fillText('>', c * 20 + 5, r * 20 + 60); }
        }
      }
      for (let ch of this.chests) { if (!ch.opened && this.st === 'map' && ch.ax === this.p.areaX && ch.ay === this.p.areaY) { ctx.fillStyle = '#f90'; ctx.fillRect(ch.x * 20 + 5, ch.y * 20 + 50, 10, 10); ctx.strokeStyle = '#fc0'; ctx.strokeRect(ch.x * 20 + 5, ch.y * 20 + 50, 10, 10); } }
      drawSprite(this.p.x * 20, this.p.y * 20 + 45 + Math.sin(this.anim * 0.1) * 1, '#ff0', sprs.mage);
      
      const s = this.calcStats(); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 42); ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
      ctx.fillText(`Lv${this.p.lv} HP${this.p.hp}/${this.p.mhp} MP${this.p.mp}/${this.p.mmp}`, 3, 10); ctx.fillText(`ATK${s.atk} DEF${s.def} G${this.p.gld}`, 3, 20);
      ctx.fillText(`武:C-WEP Lv${this.p.customWep.lv}`, 3, 30); ctx.fillText(`防:C-ARM Lv${this.p.customArm.lv}`, 3, 40);
      if (this.st === 'dungeon') { ctx.fillStyle = '#0ff'; ctx.fillText(`[${this.dungeon.type.toUpperCase()}] F${this.dungeon.floor}/${this.dungeon.maxFloor}`, 110, 30); } 
      else if (this.st === 'townMap') { ctx.fillStyle = '#0ff'; ctx.fillText(`[TOWN]`, 160, 30); }
      else { ctx.fillStyle = '#ff0'; ctx.fillText(`[AREA ${this.p.areaX}-${this.p.areaY}]`, 140, 30); }
    }

    if (this.st === 'battle' || this.st === 'magic') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.fillText(this.en.n, 15, 30);
      ctx.fillStyle = '#f00'; ctx.fillRect(15, 38, 170, 8); ctx.fillStyle = '#0f0'; ctx.fillRect(15, 38, Math.max(0, 170 * (this.en.hp / this.en.max)), 8);
      ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText(`${this.en.hp}/${this.en.max}`, 75, 45);
      if (this.en.poisoned) { ctx.fillStyle = '#a0f'; ctx.fillText('POISON', 140, 45); }
      drawSprite(70, 70 + Math.sin(this.anim * 0.1) * 2, this.en.c, this.en.spr, 12);
      
      if (this.battleTextTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 140, 190, 40); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 140, 190, 40); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let l = this.battleText.split('\n'); for (let i = 0; i < l.length; i++) { ctx.fillText(l[i], 15, 155 + i * 15); }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 185, 190, 110); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 185, 190, 110); ctx.lineWidth = 1;
      
      if (this.st === 'battle') {
        const s = this.calcStats(); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`HP:${this.p.hp}/${this.p.mhp} MP:${this.p.mp}/${this.p.mmp}`, 15, 205);
        if (this.mIdx >= 0) {
          ctx.fillStyle = this.mIdx === 0 ? '#0f0' : '#888'; ctx.fillRect(15, 225, 80, 25); ctx.fillStyle = this.mIdx === 0 ? '#000' : '#444'; ctx.font = 'bold 11px monospace'; ctx.fillText('たたかう', 23, 242);
          ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#888'; ctx.fillRect(105, 225, 80, 25); ctx.fillStyle = this.mIdx === 1 ? '#000' : '#444'; ctx.fillText('まほう', 125, 242);
          ctx.fillStyle = this.mIdx === 2 ? '#0f0' : '#888'; ctx.fillRect(15, 255, 80, 25); ctx.fillStyle = this.mIdx === 2 ? '#000' : '#444'; ctx.fillText('にげる', 30, 272);
        }
      } else if (this.st === 'magic') {
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`MP:${this.p.mp}/${this.p.mmp}`, 15, 200); let y = 215;
        for (let i = 0; i < this.p.knownSpells.length; i++) { const sp = this.spells[this.p.knownSpells[i]]; ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.fillText(`${this.mIdx === i ? '> ' : '  '}${sp.name}(${sp.mp})`, 15, y); y += 15; }
        ctx.fillStyle = this.mIdx === this.p.knownSpells.length ? '#0f0' : '#aaa'; ctx.fillText(`${this.mIdx === this.p.knownSpells.length ? '> ' : '  '}もどる`, 15, y);
      }
    }
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 185, 190, 70); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 185, 190, 70); ctx.lineWidth = 1;
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let l = this.msg.split('\n'); for (let i = 0; i < l.length; i++) { ctx.fillText(l[i], 15, 205 + i * 18); } ctx.fillText('▼(A)', 155, 245);
    }
    drawParticles(); resetShake();
  }
};
