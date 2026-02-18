// === MICRO QUEST - BUG FIX & NPC UPDATE ===
const RPG = {
  st: 'title', msg: '', msgNextSt: null, mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleWaitTimer: 0, chests: [], customBosses: [], isArena: false,
  fieldMonsters: [], fightingMonsterIdx: -1, 
  // ★ 会話可能なNPCのリスト
  npcs: [ {x: 8, y: 10, msg: "ようこそ！\nこのまちは　へいわだよ。"}, {x: 15, y: 5, msg: "みなみの　どうくつには\nおそろしい　まものが\nすんでいるらしい..."}, {x: 5, y: 15, msg: "ぶきや　ぼうぐは\nこうぼうで　きょうかできるよ。"} ],
  spells: [ {name: 'ファイア', mp: 5, dmg: 15, type: 'atk'}, {name: 'サンダー', mp: 8, dmg: 25, type: 'atk'}, {name: 'ブリザド', mp: 12, dmg: 35, type: 'atk'}, {name: 'ヒール', mp: 10, dmg: -30, type: 'heal'}, {name: 'ポイズン', mp: 8, dmg: 0, type: 'poison'}, {name: 'ドレイン', mp: 15, dmg: 20, type: 'drain'} ],
  monsterTypes: { slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, spd: 3, exp: 15, gld: 8, spells: []}, bat: {name: 'コウモリ', spr: sprs.enemyNew, c: '#80f', hp: 20, atk: 5, def: 1, spd: 8, exp: 20, gld: 12, spells: []}, mage: {name: 'まほうつかい', spr: sprs.mage, c: '#a0a', hp: 25, atk: 7, def: 2, spd: 5, exp: 35, gld: 20, spells: ['ファイア']}, skel: {name: 'ガイコツ', spr: sprs.skull, c: '#ccc', hp: 40, atk: 12, def: 5, spd: 4, exp: 50, gld: 30, spells: []}, dragon: {name: 'ドラゴン', spr: sprs.dragon, c: '#0f0', hp: 100, atk: 20, def: 10, spd: 6, exp: 200, gld: 100, spells: ['ファイア', 'サンダー']}, boss: {name: 'まおう', spr: sprs.boss, c: '#f00', hp: 250, atk: 25, def: 15, spd: 7, exp: 0, gld: 0, spells: ['ファイア', 'サンダー', 'ブリザド']} },
  menu: { open: false, cur: 0, items: ['ステータス', 'じゅもん', 'どうぐ', 'セーブ'] },
  magicMenu: { open: false, cur: 0 }, itemMenu: { open: false, cur: 0 },
  
  init() { 
    this.st = 'title'; BGM.play('menu');
    this.customBosses = JSON.parse(localStorage.getItem('4in1_arena_bosses')) || [];
  },
  
  startNew() {
    this.p = { x: 10, y: 10, dir: 0, hp: 30, mhp: 30, mp: 10, mmp: 10, atk: 8, def: 3, lv: 1, exp: 0, next: 20, gld: 50, items: [], eq: {w:0, a:0}, spells: [] };
    this.p.items.push({name: 'やくそう', type: 'heal', val: 20}, {name: 'まほうのせいすい', type: 'mp', val: 10});
    this.enterTown();
  },
  
  enterTown() {
    this.st = 'field'; this.mIdx = 0;
    this.map = this.generateTown(); // 町を生成
    this.p.x = 10; this.p.y = 10;
    BGM.play('rpg_field');
  },
  
  generateTown() {
    let m = []; for(let y=0; y<20; y++) { let r = []; for(let x=0; x<20; x++) r.push(0); m.push(r); }
    for(let y=1; y<19; y++) for(let x=1; x<19; x++) m[y][x] = 1;
    // 建物（4:店, 5:宿, 6:工房, 8:城/出口）
    m[5][5] = 4; m[5][14] = 5; m[12][5] = 6; m[15][10] = 8;
    // NPC配置（マップデータ上には 7 で記録）
    this.npcs.forEach(n => { m[n.y][n.x] = 7; });
    return m;
  },
  
  update() {
    if (this.st === 'title') { if (keysDown.a) this.startNew(); }
    else if (this.st === 'field') {
      if (this.menu.open) { this.updateMenu(); return; }
      if (keysDown.select) this.menu.open = true;
      
      let dx = 0, dy = 0;
      if (keys.up) { dy = -1; this.p.dir = 3; } else if (keys.down) { dy = 1; this.p.dir = 0; } else if (keys.left) { dx = -1; this.p.dir = 1; } else if (keys.right) { dx = 1; this.p.dir = 2; }
      
      if ((dx!==0 || dy!==0) && this.anim % 8 === 0) {
        let nx = this.p.x + dx, ny = this.p.y + dy;
        let tile = this.map[ny][nx];
        if (tile !== 0 && tile !== 7) { // 7はNPCなので入れない
           this.p.x = nx; this.p.y = ny; 
           // 施設イベント
           if (tile === 4) { this.msg = "どうぐや だ。\nやくそうを かいますか？\n(10G)"; this.msgNextSt = 'shop'; this.st = 'msg'; }
           if (tile === 5) { this.msg = "やどや だ。\nやすんでいきますか？\n(5G)"; this.msgNextSt = 'inn'; this.st = 'msg'; }
           if (tile === 6) { this.msg = "ここは こうぼう だ。\nそうびを きょうか するか？\n(50G)"; this.msgNextSt = 'forge'; this.st = 'msg'; }
           if (tile === 8) { this.st = 'dungeon'; BGM.play('rpg_field'); this.map = this.generateDungeon(); this.p.x = 1; this.p.y = 1; }
        }
      }
      this.anim++;
      
      // ★ NPCに話しかける処理
      if (keysDown.a) {
        let tx = this.p.x, ty = this.p.y;
        if (this.p.dir === 0) ty++; if (this.p.dir === 3) ty--; if (this.p.dir === 1) tx--; if (this.p.dir === 2) tx++;
        if (this.map[ty][tx] === 7) {
           let target = this.npcs.find(n => n.x === tx && n.y === ty);
           if (target) { this.msg = target.msg; this.st = 'msg'; this.msgNextSt = 'field'; }
        }
      }
    }
    else if (this.st === 'msg') {
      if (keysDown.a) {
        if (this.msgNextSt === 'shop') {
           if (this.p.gld >= 10) { this.p.gld -= 10; this.p.items.push({name:'やくそう', type:'heal', val:20}); this.msg="まいどあり！"; } else { this.msg="おかねが　たりないよ。"; }
           this.msgNextSt = 'field';
        } else if (this.msgNextSt === 'inn') {
           if (this.p.gld >= 5) { this.p.gld -= 5; this.p.hp = this.p.mhp; this.p.mp = this.p.mmp; this.msg="ゆうべは　よくねむれた。"; } else { this.msg="おかねが　ないなら\nとまれないよ。"; }
           this.msgNextSt = 'field';
        } else if (this.msgNextSt === 'forge') {
           if (this.p.gld >= 50) { this.p.gld -= 50; this.p.atk += 2; this.p.def += 1; this.msg="そうびが　つよくなった！"; } else { this.msg="おかねが　たりないな。"; }
           this.msgNextSt = 'field';
        } else {
           this.st = this.msgNextSt || 'field';
        }
      }
    }
    // バトル等の処理は省略（長くなるため）
  },
  
  // ★ メニュー・魔法選択の描画修正
  updateMenu() {
    if (keysDown.b) { this.menu.open = false; this.magicMenu.open = false; this.itemMenu.open = false; return; }
    if (this.magicMenu.open) {
       if (keysDown.up) this.magicMenu.cur = Math.max(0, this.magicMenu.cur - 1);
       if (keysDown.down) this.magicMenu.cur = Math.min(this.p.spells.length - 1, this.magicMenu.cur + 1);
       if (keysDown.a) { /* 魔法使用処理 */ this.menu.open = false; this.magicMenu.open = false; }
    } else if (this.itemMenu.open) {
       // アイテム処理
    } else {
       if (keysDown.up) this.menu.cur = (this.menu.cur + 3) % 4;
       if (keysDown.down) this.menu.cur = (this.menu.cur + 1) % 4;
       if (keysDown.a) {
         if (this.menu.cur === 1) { if (this.p.spells.length > 0) this.magicMenu.open = true; else { this.msg = "じゅもんを　おぼえていない！"; this.st = 'msg'; this.menu.open = false; } }
         // ...他メニュー処理
       }
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
        let t = this.map[y][x];
        let px = x * 20 - ox, py = y * 20 - oy;
        if (t === 0) ctx.fillStyle = '#000'; 
        else if (t === 1) ctx.fillStyle = '#484'; // 草地
        else if (t === 4) { drawSprite(px, py, '#f80', sprs.shop, 2.5); continue; }
        else if (t === 5) { drawSprite(px, py, '#08f', sprs.inn, 2.5); continue; }
        else if (t === 6) { drawSprite(px, py, '#a44', sprs.forge, 2.5); continue; }
        else if (t === 7) { drawSprite(px, py, '#fff', sprs.villager, 2.5); continue; } // NPC
        else if (t === 8) { drawSprite(px, py, '#ccc', sprs.ruins, 2.5); continue; }
        else ctx.fillStyle = '#333';
        if (t === 0 || t === 1) ctx.fillRect(px, py, 20, 20);
      }
    }
    drawSprite(90, 130, '#f00', sprs.player, 2.5); // プレイヤー
    
    // UIウィンドウ
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 200, 180, 90); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 200, 180, 90);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; 
      let lines = this.msg.split('\n'); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 20, 225 + i*20);
    }
    
    // メニュー描画
    if (this.menu.open) {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 10, 100, 100); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 100, 100);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      if (this.magicMenu.open) {
         // ★ 魔法リストの文字色修正
         this.p.spells.forEach((s, i) => {
           ctx.fillText((i === this.magicMenu.cur ? '> ' : '  ') + s.name, 20, 35 + i * 20);
         });
      } else {
         this.menu.items.forEach((item, i) => {
           ctx.fillText((i === this.menu.cur ? '> ' : '  ') + item, 20, 35 + i * 20);
         });
      }
    }
  },
  
  generateDungeon() { /* 簡易ダンジョン生成（省略） */ return []; }
};
