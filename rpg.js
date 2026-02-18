// === MICRO QUEST - MAP GENERATION FIX & ID SEPARATION ===
const RPG = {
  // st: 'world'(フィールド), 'town'(街), 'dungeon'(ダンジョン)
  st: 'title', msg: '', msgNextSt: null, mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleWaitTimer: 0, chests: [], customBosses: [], isArena: false,
  fieldMonsters: [], fightingMonsterIdx: -1, 
  
  // 世界マップの一時保存用
  worldMapCache: null, worldPlayerPos: {x:0, y:0},

  npcs: [ {x: 8, y: 10, msg: "ようこそ！\nこのまちは　へいわだよ。"}, {x: 15, y: 5, msg: "みなみの　どうくつには\nおそろしい　まものが\nすんでいるらしい..."}, {x: 5, y: 15, msg: "ぶきや　ぼうぐは\nこうぼうで　きょうかできるよ。"} ],
  
  spells: [ {name: 'ファイア', mp: 5, dmg: 15, type: 'atk'}, {name: 'サンダー', mp: 8, dmg: 25, type: 'atk'}, {name: 'ブリザド', mp: 12, dmg: 35, type: 'atk'}, {name: 'ヒール', mp: 10, dmg: -30, type: 'heal'}, {name: 'ポイズン', mp: 8, dmg: 0, type: 'poison'}, {name: 'ドレイン', mp: 15, dmg: 20, type: 'drain'} ],
  monsterTypes: { slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, spd: 3, exp: 15, gld: 8, spells: []}, bat: {name: 'コウモリ', spr: sprs.enemyNew, c: '#80f', hp: 20, atk: 5, def: 1, spd: 8, exp: 20, gld: 12, spells: [5]}, skeleton: {name: '骨戦士', spr: sprs.skull, c: '#aaa', hp: 35, atk: 7, def: 3, spd: 6, exp: 30, gld: 20, spells: []}, mage: {name: '魔道士', spr: sprs.mage, c: '#60c', hp: 25, atk: 10, def: 2, spd: 5, exp: 35, gld: 25, spells: [0, 1, 4]}, golem: {name: 'ゴーレム', spr: sprs.boss, c: '#884', hp: 80, atk: 15, def: 10, spd: 2, exp: 100, gld: 80, spells: []}, dragon: {name: 'ドラゴン', spr: sprs.dragon, c: '#f00', hp: 120, atk: 25, def: 8, spd: 15, exp: 200, gld: 150, spells: [0, 1]} },
  
  menu: { open: false, cur: 0, items: ['ステータス', 'じゅもん', 'どうぐ', 'セーブ'] },
  magicMenu: { open: false, cur: 0 }, itemMenu: { open: false, cur: 0 },
  
  init() { this.st = 'title'; this.mIdx = 0; this.anim = 0; BGM.play('rpg_field'); },
  
  // ★ セーブデータロード時の処理修正
  loadSave(slot) {
    const data = localStorage.getItem('4in1_rpg_slot' + slot); let sd = null; try { if (data) sd = JSON.parse(data); } catch(e) {}
    if (sd) {
      this.p = sd.p; this.dungeons = sd.dungeons; this.chests = sd.chests; this.customBosses = sd.customBosses || Array(10).fill(null);
      if(!this.p.bestiary) this.p.bestiary = []; if(!this.p.knownSpells) this.p.knownSpells = []; if(!this.p.customWep) this.p.customWep = {atk: 0, lv: 0}; if(!this.p.customArm) this.p.customArm = {def: 0, lv: 0};
      
      // ロード時は強制的に街からスタート（安全のため）
      this.enterTown();
    } else {
      this.startNew();
    }
    this.saveSlot = slot;
  },
  
  startNew() {
    this.p = { x: 10, y: 10, dir: 0, hp: 30, mhp: 30, mp: 10, mmp: 10, atk: 8, def: 3, lv: 1, exp: 0, next: 20, gld: 50, items: [], eq: {w:0, a:0}, spells: [], story: 0 };
    this.p.items.push({name: 'やくそう', type: 'heal', val: 20}, {name: 'まほうのせいすい', type: 'mp', val: 10});
    this.dungeons = [{cleared: false}, {cleared: false}, {cleared: false}];
    this.enterTown();
  },
  
  saveGame() {
    let sObj = { p: this.p, dungeons: this.dungeons, chests: this.chests, customBosses: this.customBosses };
    localStorage.setItem('4in1_rpg_slot' + this.saveSlot, JSON.stringify(sObj));
  },
  deleteSave(slot) { localStorage.removeItem('4in1_rpg_slot' + slot); },

  // === 街の生成（きれいな箱庭） ===
  enterTown() {
    this.st = 'town'; this.mIdx = 0;
    this.map = this.generateTownMap();
    this.p.x = 10; this.p.y = 15; // 南から入場
    this.fieldMonsters = []; // ★ 街に敵はいない
    BGM.play('rpg_town');
  },

  generateTownMap() {
    let m = []; for(let y=0; y<20; y++) { let r = []; for(let x=0; x<20; x++) r.push(0); m.push(r); }
    // 床を敷く
    for(let y=2; y<18; y++) for(let x=2; x<18; x++) m[y][x] = 1;
    // 出口
    m[18][10] = 99; 
    
    // ★ 建物ID定義: 20:店, 21:宿, 22:工房, 23:城
    m[5][5] = 20; m[5][14] = 21; m[12][5] = 22; m[15][14] = 23;
    
    // NPC配置 (ID: 30)
    this.npcs.forEach(n => { m[n.y][n.x] = 30; });
    return m;
  },

  // === ワールドマップ生成（ランダムな地形） ===
  enterWorld() {
    this.st = 'world';
    // 前回のマップがあれば復元、なければ生成
    if (this.worldMapCache) { this.map = this.worldMapCache; } 
    else { this.map = this.generateWorldMap(); this.worldMapCache = this.map; }
    
    // 街から出た位置 or 初期位置
    this.p.x = this.worldPlayerPos.x || 10; this.p.y = this.worldPlayerPos.y || 10;
    
    // 敵を配置
    this.spawnFieldMonsters();
    BGM.play('rpg_field');
  },

  generateWorldMap() {
    let m = []; for(let y=0; y<20; y++) { let r = []; for(let x=0; x<20; x++) r.push(0); m.push(r); }
    for(let y=1; y<19; y++) for(let x=1; x<19; x++) m[y][x] = (Math.random()<0.15) ? 2 : 1; // 2:山, 1:平地
    
    // ★ ワールド上の施設ID: 10:街入口, 11:洞窟, 12:塔, 13:遺跡
    m[10][10] = 10; // 街の中心
    m[3][15] = 11; 
    m[15][3] = 12;
    m[2][2] = 13;
    
    return m;
  },
  
  spawnFieldMonsters() {
    this.fieldMonsters = [];
    let num = 5;
    for(let i=0; i<num; i++) {
       let rx = Math.floor(Math.random()*18)+1, ry = Math.floor(Math.random()*18)+1;
       if (this.map[ry][rx] === 1 && (Math.abs(rx-this.p.x)>2 || Math.abs(ry-this.p.y)>2)) {
           this.fieldMonsters.push({x:rx, y:ry, type: Math.random()>0.5 ? 'slime' : 'bat'});
       }
    }
  },

  // === ダンジョン生成 ===
  enterDungeon(type) {
    this.st = 'dungeon';
    this.map = this.generateDungeonMap();
    this.p.x = 1; this.p.y = 1;
    BGM.play('rpg_dungeon');
    this.spawnDungeonMonsters();
  },

  generateDungeonMap() {
    // 簡易迷路生成
    let m = []; for(let y=0; y<20; y++) { let r = []; for(let x=0; x<20; x++) r.push(0); m.push(r); }
    let rooms = [];
    for(let i=0; i<5; i++) {
        let w = 3+Math.floor(Math.random()*4), h = 3+Math.floor(Math.random()*4);
        let x = 1+Math.floor(Math.random()*(18-w)), y = 1+Math.floor(Math.random()*(18-h));
        rooms.push({x:x, y:y, w:w, h:h});
        for(let ry=y; ry<y+h; ry++) for(let rx=x; rx<x+w; rx++) m[ry][rx] = 11; // 11:床
    }
    // 通路
    for(let i=1; i<rooms.length; i++) {
        let r1 = rooms[i-1], r2 = rooms[i];
        let cx1=Math.floor(r1.x+r1.w/2), cy1=Math.floor(r1.y+r1.h/2);
        let cx2=Math.floor(r2.x+r2.w/2), cy2=Math.floor(r2.y+r2.h/2);
        while(cx1!==cx2) { m[cy1][cx1]=11; cx1+=(cx1<cx2?1:-1); }
        while(cy1!==cy2) { m[cy1][cx1]=11; cy1+=(cy1<cy2?1:-1); }
    }
    m[rooms[0].y][rooms[0].x] = 14; // 上り階段（脱出）
    m[rooms[rooms.length-1].y][rooms[rooms.length-1].x] = 15; // 下り階段/ボス
    return m;
  },
  
  spawnDungeonMonsters() {
    this.fieldMonsters = [];
    for(let i=0; i<6; i++) {
       let rx = Math.floor(Math.random()*18)+1, ry = Math.floor(Math.random()*18)+1;
       if (this.map[ry][rx] === 11) this.fieldMonsters.push({x:rx, y:ry, type: 'skeleton'});
    }
  },

  msgBox(t, nextSt = null) { this.msg = t; this.msgNextSt = nextSt; this.st = 'msg'; playSnd('sel'); },

  update() {
    if (this.st === 'title') { if (keysDown.a) { this.loadSave(1); } return; } // 簡易スタート
    
    // 移動処理
    if (['town', 'world', 'dungeon'].includes(this.st)) {
      if (this.menu.open) { this.updateMenu(); return; }
      if (keysDown.select) this.menu.open = true;

      let dx = 0, dy = 0;
      if (keys.up) { dy = -1; this.p.dir = 3; } else if (keys.down) { dy = 1; this.p.dir = 0; } else if (keys.left) { dx = -1; this.p.dir = 1; } else if (keys.right) { dx = 1; this.p.dir = 2; }
      
      if ((dx!==0 || dy!==0) && this.anim % 8 === 0) {
        let nx = this.p.x + dx, ny = this.p.y + dy;
        
        // 範囲外チェック
        if (nx < 0 || nx >= 20 || ny < 0 || ny >= 20) return;
        
        let tile = this.map[ny][nx];
        // 衝突判定 (0:壁)
        if (tile !== 0 && tile !== 30) { // 30:NPC
           this.p.x = nx; this.p.y = ny;
           
           // === イベント判定 ===
           // 街 -> 外へ
           if (this.st === 'town' && tile === 99) { this.enterWorld(); return; }
           // 外 -> 街へ
           if (this.st === 'world' && tile === 10) { 
               this.worldPlayerPos = {x: nx, y: ny}; // 位置記憶
               this.enterTown(); return; 
           }
           // 外 -> ダンジョンへ
           if (this.st === 'world' && (tile === 11 || tile === 12 || tile === 13)) {
               this.worldPlayerPos = {x: nx, y: ny};
               this.enterDungeon(); return;
           }
           // ダンジョン -> 外へ
           if (this.st === 'dungeon' && tile === 14) { this.enterWorld(); return; }
           
           // 建物メッセージ
           if (tile === 20) this.msgBox("道具屋だ。\n今は売り切れのようだ。");
           if (tile === 21) { this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.msgBox("宿屋に泊まった。\nHP/MPが全回復した！"); }
           if (tile === 22) this.msgBox("工房だ。\n準備中らしい。");
           if (tile === 23) this.msgBox("王様「魔王を倒すのじゃ！」");
        }
      }
      
      // NPC会話
      if (keysDown.a) {
        let tx = this.p.x, ty = this.p.y;
        if (this.p.dir === 0) ty++; if (this.p.dir === 3) ty--; if (this.p.dir === 1) tx--; if (this.p.dir === 2) tx++;
        if (ty>=0 && ty<20 && tx>=0 && tx<20 && this.map[ty][tx] === 30) {
           let target = this.npcs.find(n => n.x === tx && n.y === ty);
           if (target) this.msgBox(target.msg);
        }
      }
      this.anim++;
      
      // 敵との接触（バトル）
      for (let i=0; i<this.fieldMonsters.length; i++) {
          let m = this.fieldMonsters[i];
          // 簡易ランダム移動
          if (this.anim % 30 === 0 && Math.random() < 0.3) {
              let mx = m.x + (Math.random()<0.5?1:-1), my = m.y + (Math.random()<0.5?1:-1);
              if (mx>=0 && mx<20 && my>=0 && my<20 && this.map[my][mx]!==0) { m.x=mx; m.y=my; }
          }
          if (m.x === this.p.x && m.y === this.p.y) {
              this.fightingMonsterIdx = i;
              this.battle(false, m.type);
              break;
          }
      }
    }
    else if (this.st === 'msg') {
        if (keysDown.a) {
            if (this.msgNextSt) this.st = this.msgNextSt;
            else this.st = (this.map[0][0] === 0 ? 'town' : (this.map[0][0]===11 ? 'dungeon' : 'world')); // 簡易復帰
        }
    }
    else if (this.st === 'battle') {
        // バトル処理（簡易）
        if (this.battleWaitTimer > 0) {
            this.battleWaitTimer--;
            if (this.battleWaitTimer === 0) {
                // 敵ターン
                if (this.en.hp > 0) {
                    let dmg = Math.max(1, this.en.atk - this.p.def);
                    this.p.hp -= dmg;
                    this.battleText = `${this.en.n}の攻撃！\n${dmg}のダメージ！`;
                    playSnd('hit'); screenShake(5);
                    if (this.p.hp <= 0) { this.msgBox("全滅した..."); this.enterTown(); } // 敗北
                } else {
                    this.msgBox("勝利！");
                    this.fieldMonsters.splice(this.fightingMonsterIdx, 1); // 敵を消す
                    if (this.map[0][0] === 0) this.st = 'town';
                    else if (this.map[0][0] === 11) this.st = 'dungeon';
                    else this.st = 'world';
                    BGM.play(this.st === 'town' ? 'rpg_town' : this.st==='dungeon'?'rpg_dungeon':'rpg_field');
                }
            }
            return;
        }
        if (keysDown.a) {
            let dmg = Math.max(1, this.p.atk - this.en.def);
            this.en.hp -= dmg;
            this.battleText = `${this.en.n}に\n${dmg}のダメージ！`;
            playSnd('hit');
            this.battleWaitTimer = 60;
        }
    }
  },
  
  battle(boss, type) {
      this.st = 'battle';
      let d = this.monsterTypes[type];
      this.en = {n: d.name, hp: d.hp, max: d.hp, atk: d.atk, def: d.def, spr: d.spr, c: d.c};
      this.battleText = `${d.name}が現れた！\nAボタンで攻撃`;
      BGM.play('rpg_battle');
  },

  updateMenu() {
    if (keysDown.b) { this.menu.open = false; return; }
    if (keysDown.up) this.menu.cur = (this.menu.cur + 3) % 4;
    if (keysDown.down) this.menu.cur = (this.menu.cur + 1) % 4;
    if (keysDown.a) {
        if (this.menu.cur === 3) { this.saveGame(); this.msgBox("セーブしました。"); this.menu.open = false; }
    }
  },

  draw() {
    if (this.st === 'title') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
      ctx.fillStyle = '#fff'; ctx.font = '20px monospace'; ctx.fillText('MICRO QUEST', 40, 100);
      ctx.font = '12px monospace'; ctx.fillText('PRESS A', 75, 180);
      return;
    }
    
    // マップ描画
    let ox = this.p.x * 20 - 90, oy = this.p.y * 20 - 130;
    for(let y=0; y<20; y++) {
      for(let x=0; x<20; x++) {
        let tile = this.map[y][x];
        let sx = x * 20 - ox, sy = y * 20 - oy; // ★ px変数エラー修正済 (sxを使用)
        
        // 描画範囲外スキップ
        if (sx < -20 || sx > 220 || sy < -20 || sy > 320) continue;

        if (tile === 0) ctx.fillStyle = '#000'; 
        else if (tile === 1) ctx.fillStyle = '#484'; // 平地
        else if (tile === 2) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#262', sprs.mount, 2.5); continue; }
        else if (tile === 11) ctx.fillStyle = '#555'; // ダンジョン床
        
        // ワールド上のシンボル
        else if (tile === 10) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#fff', sprs.town, 2.5); continue; }
        else if (tile === 11) { drawSprite(sx, sy, '#888', sprs.cave, 2.5); continue; } // 洞窟入口
        else if (tile === 12) { drawSprite(sx, sy, '#ccc', sprs.tower, 2.5); continue; }
        else if (tile === 13) { drawSprite(sx, sy, '#aa8', sprs.ruins, 2.5); continue; }
        
        // 街中の建物 (20:店, 21:宿, 22:工房, 23:城, 30:NPC)
        else if (tile === 20) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#f80', sprs.shop, 2.5); continue; }
        else if (tile === 21) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#08f', sprs.inn, 2.5); continue; }
        else if (tile === 22) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#a44', sprs.forge, 2.5); continue; }
        else if (tile === 23) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#fff', sprs.boss, 2.5); continue; } // 簡易城
        else if (tile === 30) { ctx.fillStyle = '#484'; ctx.fillRect(sx, sy, 20, 20); drawSprite(sx, sy, '#fff', sprs.villager, 2.5); continue; }
        
        else if (tile === 14) { drawSprite(sx, sy, '#fff', sprs.stairs_up, 2.5); continue; }
        else if (tile === 15) { drawSprite(sx, sy, '#fff', sprs.stairs_dn, 2.5); continue; }
        else if (tile === 99) { ctx.fillStyle = '#440'; } // 街出口

        ctx.fillRect(sx, sy, 20, 20);
      }
    }
    
    // 敵描画
    for (let m of this.fieldMonsters) {
       let mD = this.monsterTypes[m.type];
       if (mD) drawSprite(m.x * 20 - ox, m.y * 20 - oy, mD.c, mD.spr, 2.5);
    }
    
    // プレイヤー描画
    drawSprite(90, 130, '#f00', sprs.player, 2.5);
    
    // UI
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 200, 180, 90); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 200, 180, 90);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; 
      let lines = this.msg.split('\n'); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 20, 225 + i*20);
    }
    
    // バトル画面
    if (this.st === 'battle') {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(this.en.n, 20, 30);
        drawSprite(70, 60, this.en.c, this.en.spr, 5);
        
        ctx.fillStyle = '#f00'; ctx.fillRect(50, 160, 100, 10);
        ctx.fillStyle = '#0f0'; ctx.fillRect(50, 160, 100 * (this.en.hp/this.en.max), 10);
        
        ctx.fillStyle = '#fff'; 
        let lines = this.battleText.split('\n');
        for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 20, 200 + i*20);
        
        ctx.fillText(`HP:${this.p.hp}`, 20, 280);
    }
    
    // メニュー
    if (this.menu.open) {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 10, 100, 100); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 100, 100);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      this.menu.items.forEach((item, i) => {
         ctx.fillText((i === this.menu.cur ? '> ' : '  ') + item, 20, 35 + i * 20);
      });
    }
  }
};
