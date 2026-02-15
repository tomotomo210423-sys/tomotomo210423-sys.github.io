// === MICRO QUEST ===
const RPG = {
  st: 'title', msg: '', mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleTextTimer: 0, battleWaitTimer: 0, chests: [],
  spells: [{name: 'ファイア', mp: 5, dmg: 15, desc: '火の魔法', element: 'fire'}, {name: 'サンダー', mp: 8, dmg: 25, desc: '雷の魔法', element: 'thunder'}, {name: 'ヒール', mp: 10, dmg: -20, desc: '回復魔法', element: 'heal'}, {name: 'ブリザド', mp: 12, dmg: 35, desc: '氷の魔法', element: 'ice'}],
  equipment: { weapons: [ {name: '木の剣', atk: 0, price: 0}, {name: '鉄の剣', atk: 8, price: 50}, {name: '鋼の剣', atk: 15, price: 120}, {name: '聖剣', atk: 25, price: 250} ], armors: [ {name: '布の服', def: 0, price: 0}, {name: '革の鎧', def: 5, price: 40}, {name: '鉄の鎧', def: 12, price: 100}, {name: '聖なる鎧', def: 20, price: 200} ] },
  monsterTypes: { slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, exp: 15, gld: 8}, skull: {name: 'スケルトン', spr: sprs.skull, c: '#aaa', hp: 25, atk: 5, def: 2, exp: 25, gld: 15}, mage: {name: 'ダークメイジ', spr: sprs.mage, c: '#60c', hp: 20, atk: 8, def: 1, exp: 30, gld: 20} },
  init() { this.st = 'title'; this.mIdx = 0; this.anim = 0; BGM.play('rpg'); },
  loadSave(slot) {
    const saveData = JSON.parse(localStorage.getItem(`4in1_rpg_slot${slot}`));
    if (saveData) {
      if (saveData.p) { this.p = JSON.parse(JSON.stringify(saveData.p)); if (saveData.dungeons) this.dungeons = JSON.parse(JSON.stringify(saveData.dungeons)); if (saveData.chests) this.chests = JSON.parse(JSON.stringify(saveData.chests)); } else { this.p = JSON.parse(JSON.stringify(saveData)); }
      if (!this.p.weapon) this.p.weapon = 0; if (!this.p.armor) this.p.armor = 0; if (!this.p.knownSpells) this.p.knownSpells = [];
      if (this.p.areaX === undefined) { this.p.areaX = 1; this.p.areaY = 1; this.p.story = 0; }
    } else {
      this.p = { x: 4, y: 8, areaX: 1, areaY: 1, story: 0, hp: 30, mhp: 30, mp: 15, mmp: 15, atk: 5, def: 3, gld: 0, lv: 1, exp: 0, knownSpells: [], weapon: 0, armor: 0 };
      this.dungeons = [{cleared: false}, {cleared: false}, {cleared: false}]; this.chests = [{ax: 2, ay: 1, x: 2, y: 2, opened: false}, {ax: 0, ay: 1, x: 8, y: 12, opened: false}];
    }
    this.saveSlot = slot; this.st = 'map'; this.genMap();
  },
  saveGame() {
    let saveObj = { p: JSON.parse(JSON.stringify(this.p)), dungeons: JSON.parse(JSON.stringify(this.dungeons)), chests: JSON.parse(JSON.stringify(this.chests)) };
    if (this.st === 'dungeon') { saveObj.p.x = this.p.worldX; saveObj.p.y = this.p.worldY; saveObj.p.areaX = this.p.worldAx; saveObj.p.areaY = this.p.worldAy; }
    localStorage.setItem(`4in1_rpg_slot${this.saveSlot}`, JSON.stringify(saveObj));
  },
  deleteSave(slot) { localStorage.removeItem(`4in1_rpg_slot${slot}`); },
  genMap() {
    this.map = Array(15).fill().map(() => Array(10).fill(0));
    let ax = this.p.areaX; let ay = this.p.areaY; let seed = ax * 10 + ay + 100;
    let rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        let v = rand();
        if (v < 0.15) this.map[r][c] = 1; else if (v < 0.25) this.map[r][c] = 2;
        if (ax === 0 && c === 0) this.map[r][c] = 3; if (ax === 2 && c === 9) this.map[r][c] = 3;
        if (ay === 0 && r === 0) this.map[r][c] = 3; if (ay === 2 && r === 14) this.map[r][c] = 3;
        if (ay === 2 && this.map[r][c] === 0) this.map[r][c] = 9;
      }
    }
    if (ax === 1 && ay === 1) { this.map[7][4] = 4; this.map[7][5] = 4; this.map[8][4] = 0; this.map[8][5] = 0; }
    if (ax === 2 && ay === 1) { this.map[5][5] = 5; this.map[6][5] = 0; }
    if (ax === 1 && ay === 0) { this.map[3][4] = 6; this.map[4][4] = 0; }
    if (ax === 0 && ay === 1) { this.map[8][2] = 7; this.map[9][2] = 0; }
    if (ax === 0 && ay === 0) { this.map[3][3] = 8; this.map[3][2] = 8; this.map[2][3] = 8; this.map[2][2] = 8; this.map[4][3] = 0; }
  },
  genDungeonMap(type) {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 10; c++) {
        if (type === 'cave') this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || Math.random() < 0.25) ? 10 : 11;
        else if (type === 'tower') this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || (r % 3 === 0 && Math.random() < 0.4)) ? 12 : 11;
        else this.map[r][c] = (r === 0 || r === 14 || c === 0 || c === 9 || Math.random() < 0.2) ? 13 : 11;
      }
    }
    this.p.x = 5; this.p.y = 13; this.map[13][5] = 11;
  },
  msgBox(t) { this.msg = t; this.st = 'msg'; playSnd('sel'); },
  setBattleText(text) { this.battleText = text; this.battleTextTimer = 60; this.battleWaitTimer = 60; },
  battle(bossType, monsterType = 'slime') {
    this.st = 'battle'; this.mIdx = 0; this.battleText = ''; this.battleTextTimer = 0; this.battleWaitTimer = 0;
    if (bossType === 'boss') { this.en = { n: '魔王', hp: 150, atk: 20, def: 10, max: 150, exp: 0, gld: 0, spr: sprs.dragon, c: '#808', monsterType: 'boss' }; } 
    else if (bossType === 'miniboss') { const l = this.p.lv; this.en = { n: 'エリアボス', hp: 50 + l * 10, atk: 10 + l * 3, def: 5 + l, max: 50 + l * 10, exp: 50, gld: 30 + l * 5, spr: sprs.boss, c: '#c0c', monsterType: 'boss' }; } 
    else { const l = this.p.lv; const mData = this.monsterTypes[monsterType]; this.en = { n: mData.name, hp: mData.hp + l * 5, atk: mData.atk + l * 2, def: mData.def + l, max: mData.hp + l * 5, exp: mData.exp, gld: mData.gld + l * 2, spr: mData.spr, c: mData.c, monsterType: monsterType }; }
    playSnd('hit');
  },
  enterDungeon(idx, type) {
    if (this.dungeons[idx] && this.dungeons[idx].cleared) { this.msgBox("すでに魔物は討伐したようだ。"); return; }
    this.st = 'dungeon'; this.dungeon = {idx: idx, floor: 1, maxFloor: 3, enemyCount: 0, type: type};
    this.p.worldX = this.p.x; this.p.worldY = this.p.y; this.p.worldAx = this.p.areaX; this.p.worldAy = this.p.areaY; this.worldMap = this.map.map(r => [...r]);
    this.genDungeonMap(type); this.msgBox(`${['洞窟', '塔', '遺跡'][idx]}に入った！\nF1`);
  },
  exitDungeon() { this.map = this.worldMap; this.p.x = this.p.worldX; this.p.y = this.p.worldY; this.st = 'map'; },
  calcStats() { return { atk: this.p.atk + this.equipment.weapons[this.p.weapon].atk, def: this.p.def + this.equipment.armors[this.p.armor].def }; },
  update() {
    this.anim++; if (this.battleWaitTimer > 0) { this.battleWaitTimer--; return; }
    if (keysDown.select) {
      if (this.st === 'title' || this.st === 'saveSelect') { activeApp = Menu; Menu.init(); return; }
      if (this.st === 'map' || this.st === 'dungeon') { this.st = 'menu'; this.mIdx = 0; playSnd('sel'); return; }
      if (this.st === 'menu') { this.st = this.dungeon ? 'dungeon' : 'map'; return; }
    }
    if (this.st === 'title') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(1, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) { if (this.mIdx === 0) { this.st = 'saveSelect'; this.mIdx = 0; } else { activeApp = Menu; Menu.init(); } playSnd('jmp'); }
      return;
    }
    if (this.st === 'saveSelect') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(3, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) { if (this.mIdx < 3) { this.loadSave(this.mIdx + 1); playSnd('jmp'); } else { this.st = 'title'; this.mIdx = 0; playSnd('sel'); } }
      if (keysDown.b) { if (this.mIdx < 3) { const slot = this.mIdx + 1; if (localStorage.getItem(`4in1_rpg_slot${slot}`)) { this.deleteSave(slot); playSnd('hit'); } } }
      return;
    }
    if (this.st === 'menu') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(3, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) { this.st = 'equipMenu'; this.mIdx = 0; playSnd('jmp'); } 
        else if (this.mIdx === 1) { this.st = 'spellMenu'; this.mIdx = 0; playSnd('jmp'); }
        else if (this.mIdx === 2) { this.saveGame(); this.msgBox("セーブしました！"); }
        else if (this.mIdx === 3) { this.st = 'title'; this.mIdx = 0; playSnd('sel'); }
      } return;
    }
    if (this.st === 'equipMenu' || this.st === 'spellMenu') { if (keysDown.b) { this.st = 'menu'; this.mIdx = 0; } return; }
    if (this.st === 'msg') { if (keysDown.a) { this.st = this.dungeon ? 'dungeon' : 'map'; } return; }
    if (this.st === 'town') {
      if (keysDown.up) { this.mIdx = Math.max(0, this.mIdx - 1); playSnd('sel'); }
      if (keysDown.down) { this.mIdx = Math.min(4, this.mIdx + 1); playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) {
          if (this.p.story === 0) this.msgBox("王様「勇者よ！\n東の洞窟の魔物を\n討伐してくれ！」");
          else if (this.p.story === 1) this.msgBox("王様「おお！次は\n北の塔へ向かうのじゃ！」");
          else if (this.p.story === 2) this.msgBox("王様「西の遺跡の力を\n得たようだな。\nいざ、北西の魔王城へ！」");
          else this.msgBox("王様「世界に平和が訪れた！\nありがとう勇者よ！」");
        } else if (this.mIdx === 1) {
          if (this.p.gld >= 15) { this.p.gld -= 15; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; playSnd('combo'); addParticle(100, 150, '#0f0', 'star'); this.msgBox("HP/MPが全回復した！"); } else playSnd('hit');
        } else if (this.mIdx === 2) {
          const w = this.equipment.weapons[this.p.weapon + 1];
          if (w && this.p.gld >= w.price) { this.p.gld -= w.price; this.p.weapon++; playSnd('combo'); this.msgBox(`${w.name}を手に入れた！`); } else playSnd('hit');
        } else if (this.mIdx === 3) {
          const a = this.equipment.armors[this.p.armor + 1];
          if (a && this.p.gld >= a.price) { this.p.gld -= a.price; this.p.armor++; playSnd('combo'); this.msgBox(`${a.name}を手に入れた！`); } else playSnd('hit');
        } else if (this.mIdx === 4) { this.st = 'map'; }
      }
      if (keysDown.b) this.st = 'map'; return;
    }
    if (this.st === 'map' || this.st === 'dungeon') {
      if (keysDown.a && this.st === 'map') {
        let curTile = this.map[this.p.y][this.p.x];
        if (curTile === 4) { this.st = 'town'; this.mIdx = 0; playSnd('sel'); return; } 
        else if (curTile === 5) { this.enterDungeon(0, 'cave'); return; }
        else if (curTile === 6) { if (this.p.story >= 1) this.enterDungeon(1, 'tower'); else this.msgBox("王様の許可がないと\n入れないようだ。"); return; }
        else if (curTile === 7) { if (this.p.story >= 2) this.enterDungeon(2, 'ruins'); else this.msgBox("強大な力で封印されている。"); return; }
        else if (curTile === 8) { if (this.p.story >= 3) this.battle('boss'); else this.msgBox("今の力では到底敵わない…"); return; }
        for (let chest of this.chests) {
          if (chest.ax === this.p.areaX && chest.ay === this.p.areaY && chest.x === this.p.x && chest.y === this.p.y && !chest.opened) {
            chest.opened = true; playSnd('combo'); this.p.gld += 100; this.msgBox("宝箱を開けた！\n100Gを手に入れた！"); return;
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
              if ((tile === 0 || tile === 9) && Math.random() < 0.1) { this.battle(false, ['slime', 'skull', 'mage'][Math.floor(Math.random() * 3)]); }
            }
          }
        } else if (this.st === 'dungeon') {
          if (nx >= 0 && nx < 10 && ny >= 0 && ny < 15 && this.map[ny][nx] !== 10 && this.map[ny][nx] !== 12 && this.map[ny][nx] !== 13) {
            this.p.x = nx; this.p.y = ny; playSnd('sel');
            if (Math.random() < 0.2) {
              this.dungeon.enemyCount++;
              if (this.dungeon.enemyCount >= 3) {
                this.dungeon.floor++; this.dungeon.enemyCount = 0;
                if (this.dungeon.floor > this.dungeon.maxFloor) { this.battle('miniboss'); } 
                else { this.genDungeonMap(this.dungeon.type); this.msgBox(`階段を見つけた！\nF${this.dungeon.floor}へ進んだ！`); }
              } else { this.battle(false, ['slime', 'skull', 'mage'][Math.floor(Math.random() * 3)]); }
            }
          }
        }
      }
    }
    if (this.st === 'battle') {
      if (keysDown.left || keysDown.right) { this.mIdx = this.mIdx === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.up || keysDown.down) { this.mIdx = this.mIdx < 2 ? this.mIdx + 2 : this.mIdx - 2; playSnd('sel'); }
      if (keysDown.a) {
        if (this.mIdx === 0) {
          playSnd('jmp'); const s = this.calcStats(); const d = Math.max(1, s.atk - this.en.def); this.en.hp -= d; this.setBattleText(`${this.en.n}に\n${d}のダメージ！`); screenShake(3); addParticle(100, 120, this.en.c, 'explosion');
          if (this.en.hp <= 0) setTimeout(() => this.winBattle(), 500); else setTimeout(() => this.enemyAttack(), 500);
        } else if (this.mIdx === 1) { this.st = 'magic'; this.mIdx = 0; playSnd('sel'); } 
        else if (this.mIdx === 2) {
          if (this.en.monsterType === 'boss') { this.setBattleText('ボスからは逃げられない！'); setTimeout(() => this.enemyAttack(), 500); }
          else { this.setBattleText('無事に逃げ切った！'); setTimeout(() => { if(this.dungeon) this.exitDungeon(); else this.st = 'map'; }, 500); }
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
            if (sp.dmg > 0) { this.en.hp -= sp.dmg; this.setBattleText(`${sp.name}！\n${this.en.n}に${sp.dmg}ダメージ！`); playSnd('combo'); addParticle(100, 120, '#f0f', 'explosion'); screenShake(5); if (this.en.hp <= 0) setTimeout(() => this.winBattle(), 500); else setTimeout(() => this.enemyAttack(), 500); } 
            else { this.p.hp = Math.min(this.p.mhp, this.p.hp - sp.dmg); this.setBattleText(`${sp.name}！\nHPが回復した！`); playSnd('combo'); addParticle(100, 200, '#0f0', 'star'); setTimeout(() => this.enemyAttack(), 500); }
            this.st = 'battle'; this.mIdx = 0;
          } else playSnd('hit');
        } else { this.st = 'battle'; this.mIdx = 0; }
      }
      if (keysDown.b) { this.st = 'battle'; this.mIdx = 0; }
    }
    updateParticles();
  },
  enemyAttack() {
    const s = this.calcStats(); const d = Math.max(1, this.en.atk - s.def); this.p.hp -= d; this.setBattleText(`${this.en.n}の攻撃！\n${d}のダメージを受けた！`); playSnd('hit'); screenShake(4);
    if (this.p.hp <= 0) {
      setTimeout(() => {
        if (this.dungeon) this.exitDungeon(); this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.p.x = 4; this.p.y = 8; this.p.areaX = 1; this.p.areaY = 1; this.dungeon = null;
        this.genMap(); this.msgBox("死んでしまった。\n城へ戻された...");
      }, 500);
    }
  },
  winBattle() {
    addParticle(100, 120, '#ff0', 'explosion');
    if (this.en.n === '魔王') { this.p.story = 4; this.msgBox("魔王を倒した！\n世界に平和が戻った！"); this.map[13][8] = 0; }
    else if (this.en.monsterType === 'boss') {
      this.dungeons[this.dungeon.idx].cleared = true; this.p.exp += this.en.exp; this.p.gld += this.en.gld;
      if (this.dungeon.idx === 0 && this.p.story === 0) this.p.story = 1;
      if (this.dungeon.idx === 1 && this.p.story === 1) this.p.story = 2;
      if (this.dungeon.idx === 2 && this.p.story === 2) this.p.story = 3;
      this.exitDungeon(); this.dungeon = null;
      if (this.p.exp >= this.p.lv * 25) { this.levelUp(); this.msgBox(`魔物を退治した！\nLvUP! ${this.en.gld}G獲得`); } else this.msgBox(`魔物を退治した！\n${this.en.gld}G獲得`);
    } else {
      this.p.exp += this.en.exp; this.p.gld += this.en.gld;
      if (this.p.exp >= this.p.lv * 25) { this.levelUp(); this.msgBox(`勝利！ LvUP！\n${this.en.gld}G獲得`); } else { this.st = this.dungeon ? 'dungeon' : 'map'; }
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
          ctx.fillStyle = sel ? 'rgba(0,255,0,0.2)' : 'rgba(100,100,100,0.2)'; ctx.fillRect(15, 50 + i * 65, 170, 55);
          ctx.strokeStyle = sel ? '#0f0' : '#666'; ctx.lineWidth = 2; ctx.strokeRect(15, 50 + i * 65, 170, 55); ctx.lineWidth = 1;
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
    if (this.st === 'menu' || this.st === 'equipMenu' || this.st === 'spellMenu' || this.st === 'town') {
      for (let r = 0; r < 15; r++) { for (let c = 0; c < 10; c++) { ctx.fillStyle = '#222'; ctx.fillRect(c * 20, r * 20 + 45, 20, 20); } }
      ctx.fillStyle = 'rgba(0,0,0,0.95)'; ctx.fillRect(10, 50, 180, 200); ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 50, 180, 200);
      if (this.st === 'menu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('SYSTEM MENU', 60, 75);
        const mItems = ['装備かくにん', '魔法リスト', 'セーブする', 'タイトルへ'];
        for (let i = 0; i < mItems.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '11px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + mItems[i], 30, 110 + i * 25); }
      } else if (this.st === 'equipMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('装備', 80, 75); const s = this.calcStats(); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`ATK: ${s.atk}   DEF: ${s.def}`, 30, 105);
        ctx.fillText('武器: ' + this.equipment.weapons[this.p.weapon].name, 30, 135); ctx.fillText('防具: ' + this.equipment.armors[this.p.armor].name, 30, 165);
      } else if (this.st === 'spellMenu') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('習得魔法', 65, 75); ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        if (this.p.knownSpells.length === 0) ctx.fillText('魔法を習得していない', 30, 120); else { let y = 105; for (let idx of this.p.knownSpells) { const sp = this.spells[idx]; ctx.fillText(`${sp.name} (MP${sp.mp})`, 30, y); ctx.font = '8px monospace'; ctx.fillText(sp.desc, 35, y + 12); ctx.font = '10px monospace'; y += 25; } }
      } else if (this.st === 'town') {
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('城下町', 80, 75); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`所持金: ${this.p.gld}G`, 120, 75);
        const wP = this.p.weapon < 3 ? this.equipment.weapons[this.p.weapon+1].price + 'G' : '済'; const aP = this.p.armor < 3 ? this.equipment.armors[this.p.armor+1].price + 'G' : '済';
        const mItems = ['王様と話す', '宿屋で休む (15G)', `武器屋 (${wP})`, `防具屋 (${aP})`, '町を出る'];
        for (let i = 0; i < mItems.length; i++) { ctx.fillStyle = this.mIdx === i ? '#0f0' : '#aaa'; ctx.font = '10px monospace'; ctx.fillText((this.mIdx === i ? '> ' : '  ') + mItems[i], 20, 110 + i * 25); }
      }
      ctx.fillStyle = '#666'; ctx.font = '9px monospace'; ctx.fillText(this.st==='menu'?'A:決定 SELECT:戻る':'B:戻る', 50, 235); resetShake(); return;
    }
    if (this.st === 'map' || this.st === 'msg' || this.st === 'dungeon') {
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
        }
      }
      for (let ch of this.chests) { if (!ch.opened && this.st === 'map' && ch.ax === this.p.areaX && ch.ay === this.p.areaY) { ctx.fillStyle = '#f90'; ctx.fillRect(ch.x * 20 + 5, ch.y * 20 + 50, 10, 10); ctx.strokeStyle = '#fc0'; ctx.strokeRect(ch.x * 20 + 5, ch.y * 20 + 50, 10, 10); } }
      drawSprite(this.p.x * 20, this.p.y * 20 + 45 + Math.sin(this.anim * 0.1) * 1, '#ff0', sprs.mage);
      const s = this.calcStats(); ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 42); ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
      ctx.fillText(`Lv${this.p.lv} HP${this.p.hp}/${this.p.mhp} MP${this.p.mp}/${this.p.mmp}`, 3, 10); ctx.fillText(`ATK${s.atk} DEF${s.def} G${this.p.gld}`, 3, 20);
      ctx.fillText(`武:${this.equipment.weapons[this.p.weapon].name}`, 3, 30); ctx.fillText(`防:${this.equipment.armors[this.p.armor].name}`, 3, 40);
      if (this.dungeon) { ctx.fillStyle = '#0ff'; ctx.fillText(`[${this.dungeon.type.toUpperCase()}] F${this.dungeon.floor}/${this.dungeon.maxFloor}`, 110, 30); } 
      else { ctx.fillStyle = '#ff0'; ctx.fillText(`[AREA ${this.p.areaX}-${this.p.areaY}]`, 140, 30); }
    }
    if (this.st === 'battle' || this.st === 'magic') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.fillText(this.en.n, 15, 30);
      ctx.fillStyle = '#f00'; ctx.fillRect(15, 38, 170, 8); ctx.fillStyle = '#0f0'; ctx.fillRect(15, 38, Math.max(0, 170 * (this.en.hp / this.en.max)), 8);
      ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText(`${this.en.hp}/${this.en.max}`, 75, 45);
      drawSprite(70, 70 + Math.sin(this.anim * 0.1) * 2, this.en.c, this.en.spr, 12);
      if (this.battleTextTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 140, 190, 40); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 140, 190, 40); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; let l = this.battleText.split('\n'); for (let i = 0; i < l.length; i++) { ctx.fillText(l[i], 15, 155 + i * 15); }
      }
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(5, 185, 190, 110); ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(5, 185, 190, 110); ctx.lineWidth = 1;
      if (this.st === 'battle') {
        const s = this.calcStats(); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`HP:${this.p.hp}/${this.p.mhp} MP:${this.p.mp}/${this.p.mmp}`, 15, 205);
        ctx.fillStyle = this.mIdx === 0 ? '#0f0' : '#888'; ctx.fillRect(15, 225, 80, 25); ctx.fillStyle = this.mIdx === 0 ? '#000' : '#444'; ctx.font = 'bold 11px monospace'; ctx.fillText('たたかう', 23, 242);
        ctx.fillStyle = this.mIdx === 1 ? '#0f0' : '#888'; ctx.fillRect(105, 225, 80, 25); ctx.fillStyle = this.mIdx === 1 ? '#000' : '#444'; ctx.fillText('まほう', 125, 242);
        ctx.fillStyle = this.mIdx === 2 ? '#0f0' : '#888'; ctx.fillRect(15, 255, 80, 25); ctx.fillStyle = this.mIdx === 2 ? '#000' : '#444'; ctx.fillText('にげる', 30, 272);
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
