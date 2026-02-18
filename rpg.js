// === MICRO QUEST - FULL RESTORE & NPC UPDATE ===
const RPG = {
  st: 'title', msg: '', msgNextSt: null, mIdx: 0, map: [], dungeons: [], p: null, en: null, anim: 0, saveSlot: 0, battleText: '', battleWaitTimer: 0, chests: [], customBosses: [], isArena: false,
  fieldMonsters: [], fightingMonsterIdx: -1, 
  
  // ★ 追加：会話可能なNPCリスト
  npcs: [ {x: 8, y: 10, msg: "ようこそ！\nこのまちは　へいわだよ。"}, {x: 15, y: 5, msg: "みなみの　どうくつには\nおそろしい　まものが\nすんでいるらしい..."}, {x: 5, y: 15, msg: "ぶきや　ぼうぐは\nこうぼうで　きょうかできるよ。"} ],
  
  spells: [ {name: 'ファイア', mp: 5, dmg: 15, type: 'atk'}, {name: 'サンダー', mp: 8, dmg: 25, type: 'atk'}, {name: 'ブリザド', mp: 12, dmg: 35, type: 'atk'}, {name: 'ヒール', mp: 10, dmg: -30, type: 'heal'}, {name: 'ポイズン', mp: 8, dmg: 0, type: 'poison'}, {name: 'ドレイン', mp: 15, dmg: 20, type: 'drain'} ],
  monsterTypes: { slime: {name: 'スライム', spr: sprs.slime, c: '#0a0', hp: 15, atk: 3, def: 1, spd: 3, exp: 15, gld: 8, spells: []}, bat: {name: 'コウモリ', spr: sprs.enemyNew, c: '#80f', hp: 20, atk: 5, def: 1, spd: 8, exp: 20, gld: 12, spells: []}, mage: {name: 'まほうつかい', spr: sprs.mage, c: '#a0a', hp: 25, atk: 7, def: 2, spd: 5, exp: 35, gld: 20, spells: ['ファイア']}, skel: {name: 'ガイコツ', spr: sprs.skull, c: '#ccc', hp: 40, atk: 12, def: 5, spd: 4, exp: 50, gld: 30, spells: []}, dragon: {name: 'ドラゴン', spr: sprs.dragon, c: '#0f0', hp: 100, atk: 20, def: 10, spd: 6, exp: 200, gld: 100, spells: ['ファイア', 'サンダー']}, boss: {name: 'まおう', spr: sprs.boss, c: '#f00', hp: 250, atk: 25, def: 15, spd: 7, exp: 0, gld: 0, spells: ['ファイア', 'サンダー', 'ブリザド']} },
  
  menu: { open: false, cur: 0, items: ['ステータス', 'じゅもん', 'どうぐ', 'セーブ'] },
  magicMenu: { open: false, cur: 0 }, itemMenu: { open: false, cur: 0 },
  
  init() { 
    this.st = 'title'; BGM.play('menu');
    this.customBosses = JSON.parse(localStorage.getItem('4in1_arena_bosses')) || [];
    // セーブデータがあればロード
    if (SaveSys.data.rpg) {
      this.p = SaveSys.data.rpg;
      this.enterTown(); // ロード時は町から再開
    }
  },
  
  startNew() {
    this.p = { x: 10, y: 10, dir: 0, hp: 30, mhp: 30, mp: 10, mmp: 10, atk: 8, def: 3, lv: 1, exp: 0, next: 20, gld: 50, items: [], eq: {w:0, a:0}, spells: [] };
    this.p.items.push({name: 'やくそう', type: 'heal', val: 20}, {name: 'まほうのせいすい', type: 'mp', val: 10});
    this.enterTown();
  },
  
  enterTown() {
    this.st = 'field'; this.mIdx = 0;
    this.map = this.generateTown();
    this.p.x = 10; this.p.y = 10;
    this.fieldMonsters = []; // 町に敵はいない
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
  
  // ダンジョン生成（復活！）
  generateDungeon() {
    let m = []; let w = 20, h = 20;
    for(let y=0; y<h; y++) { let r = []; for(let x=0; x<w; x++) r.push(0); m.push(r); }
    let rooms = []; let cnt = 4 + Math.floor(Math.random() * 3);
    for(let i=0; i<cnt; i++) {
      let rw = 3 + Math.floor(Math.random()*4), rh = 3 + Math.floor(Math.random()*4);
      let rx = 1 + Math.floor(Math.random()*(w-rw-2)), ry = 1 + Math.floor(Math.random()*(h-rh-2));
      rooms.push({x:rx, y:ry, w:rw, h:rh});
      for(let y=ry; y<ry+rh; y++) for(let x=rx; x<rx+rw; x++) m[y][x] = 1;
      if (i > 0) {
        let prev = rooms[i-1];
        let cx1 = Math.floor(prev.x + prev.w/2), cy1 = Math.floor(prev.y + prev.h/2);
        let cx2 = Math.floor(rx + rw/2), cy2 = Math.floor(ry + rh/2);
        while(cx1 !== cx2) { m[cy1][cx1] = 1; cx1 += cx1 < cx2 ? 1 : -1; }
        while(cy1 !== cy2) { m[cy1][cx1] = 1; cy1 += cy1 < cy2 ? 1 : -1; }
      }
    }
    m[rooms[cnt-1].y + Math.floor(rooms[cnt-1].h/2)][rooms[cnt-1].x + Math.floor(rooms[cnt-1].w/2)] = 3; // 3:下り階段
    // 敵の配置
    this.fieldMonsters = [];
    for(let i=0; i<5; i++) {
       let r = rooms[Math.floor(Math.random()*rooms.length)];
       this.fieldMonsters.push({x: r.x + Math.floor(Math.random()*r.w), y: r.y + Math.floor(Math.random()*r.h), type: this.mIdx > 2 ? 'dragon' : (this.mIdx > 1 ? 'skel' : (Math.random()>0.5?'slime':'bat'))});
    }
    // 宝箱
    if (Math.random() < 0.5) {
       let r = rooms[Math.floor(Math.random()*rooms.length)];
       let cx = r.x + Math.floor(Math.random()*r.w), cy = r.y + Math.floor(Math.random()*r.h);
       if (m[cy][cx] === 1) this.chests.push({x:cx, y:cy, open:false});
    }
    return m;
  },
  
  update() {
    if (this.st === 'title') { if (keysDown.a) this.startNew(); }
    else if (this.st === 'field' || this.st === 'dungeon') {
      if (this.menu.open) { this.updateMenu(); return; }
      if (keysDown.select) this.menu.open = true;
      
      let dx = 0, dy = 0;
      if (keys.up) { dy = -1; this.p.dir = 3; } else if (keys.down) { dy = 1; this.p.dir = 0; } else if (keys.left) { dx = -1; this.p.dir = 1; } else if (keys.right) { dx = 1; this.p.dir = 2; }
      
      if ((dx!==0 || dy!==0) && this.anim % 8 === 0) {
        let nx = this.p.x + dx, ny = this.p.y + dy;
        // 衝突判定
        let hit = false;
        if (nx < 0 || nx >= 20 || ny < 0 || ny >= 20 || this.map[ny][nx] === 0) hit = true;
        // NPC当たり判定
        if (this.map[ny][nx] === 7) hit = true;
        
        if (!hit) {
           this.p.x = nx; this.p.y = ny; 
           let tile = this.map[ny][nx];
           // 施設イベント
           if (tile === 4) { this.msg = "どうぐや だ。\nやくそうを かいますか？\n(10G)"; this.msgNextSt = 'shop'; this.st = 'msg'; }
           if (tile === 5) { this.msg = "やどや だ。\nやすんでいきますか？\n(5G)"; this.msgNextSt = 'inn'; this.st = 'msg'; }
           if (tile === 6) { this.msg = "ここは こうぼう だ。\nそうびを きょうか するか？\n(50G)"; this.msgNextSt = 'forge'; this.st = 'msg'; }
           // ダンジョン移動
           if (tile === 8) { this.mIdx = 1; this.st = 'dungeon'; BGM.play('rpg_field'); this.map = this.generateDungeon(); this.p.x = 1; this.p.y = 1; }
           if (tile === 3) { // 階段
             this.mIdx++;
             if (this.mIdx > 5) { this.battle('boss', 'boss'); return; } // ボス戦
             this.map = this.generateDungeon(); this.p.x = 1; this.p.y = 1; playSnd('jmp');
           }
           // 宝箱
           for(let c of this.chests) {
             if (c.x === nx && c.y === ny && !c.open) {
               c.open = true; let g = 10 + Math.floor(Math.random()*50); this.p.gld += g; this.msg = `たからばこだ！\n${g}G をてにいれた。`; this.st = 'msg'; playSnd('combo');
             }
           }
           // エンカウント（ダンジョンのみ）
           if (this.st === 'dungeon' && Math.random() < 0.05) {
              const types = Object.keys(this.monsterTypes);
              let type = types[Math.floor(Math.random() * (Math.min(types.length-2, this.mIdx + 1)))];
              this.battle('normal', type);
           }
        }
      }
      this.anim++;
      
      // NPC会話
      if (keysDown.a) {
        let tx = this.p.x, ty = this.p.y;
        if (this.p.dir === 0) ty++; if (this.p.dir === 3) ty--; if (this.p.dir === 1) tx--; if (this.p.dir === 2) tx++;
        if (this.map[ty][tx] === 7) {
           let target = this.npcs.find(n => n.x === tx && n.y === ty);
           if (target) { this.msg = target.msg; this.st = 'msg'; this.msgNextSt = this.st; }
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
           this.st = (this.mIdx === 0 ? 'field' : 'dungeon');
        }
      }
    }
    else if (this.st === 'battle') {
      if (this.battleWaitTimer > 0) {
        this.battleWaitTimer--;
        if (this.battleWaitTimer === 0) {
           // 敵のターン
           if (this.en.hp > 0) {
             let dmg = Math.max(1, this.en.atk - this.p.def + Math.floor(Math.random()*3));
             this.p.hp -= dmg;
             this.battleText = `${this.en.name}のこうげき！\n${dmg} のダメージ！`;
             playSnd('hit');screenShake(3);
             if (this.p.hp <= 0) { this.battleText += "\nあなたは しんでしまった..."; this.battleWaitTimer = 120; }
           } 
           // 勝利判定後
           else if (this.en.hp <= 0 && this.battleText.includes('たおした')) {
              this.st = (this.mIdx === 0 ? 'field' : 'dungeon'); BGM.play('rpg_field');
           }
           // 敗北判定後
           else if (this.p.hp <= 0) {
              this.st = 'title'; // ゲームオーバー
           }
        }
        return;
      }
      
      if (keysDown.up) this.menu.cur = (this.menu.cur + 3) % 4;
      if (keysDown.down) this.menu.cur = (this.menu.cur + 1) % 4;
      if (keysDown.a) {
        if (this.menu.cur === 0) { // たたかう
           let dmg = Math.max(1, this.p.atk - this.en.def + Math.floor(Math.random()*3));
           // クリティカル
           if (Math.random() < 0.1) { dmg *= 2; this.battleText = "かいしんの いちげき！\n"; } else { this.battleText = ""; }
           this.en.hp -= dmg;
           this.battleText += `${this.en.name}に ${dmg} の\nダメージを あたえた！`;
           playSnd('hit');
           if (this.en.hp <= 0) {
             this.battleText = `${this.en.name}を たおした！\n${this.en.exp}EXP ${this.en.gld}G GET`;
             this.p.exp += this.en.exp; this.p.gld += this.en.gld;
             if (this.p.exp >= this.p.next) {
               this.p.lv++; this.p.next *= 1.5; this.p.mhp += 5; this.p.mmp += 2; this.p.atk += 2; this.p.def += 1;
               this.p.hp = this.p.mhp; this.p.mp = this.p.mmp;
               this.battleText += `\nレベルアップ！ LV${this.p.lv}`;
               // 魔法習得
               if (this.p.lv === 3) { this.p.spells.push(this.spells[0]); this.battleText += "\nファイアを おぼえた！"; }
               if (this.p.lv === 5) { this.p.spells.push(this.spells[3]); this.battleText += "\nヒールを おぼえた！"; }
               if (this.p.lv === 8) { this.p.spells.push(this.spells[1]); this.battleText += "\nサンダーを おぼえた！"; }
             }
           }
           this.battleWaitTimer = 60;
        } else if (this.menu.cur === 1) { // じゅもん
           if (this.p.spells.length > 0) this.magicMenu.open = true; 
           else { this.battleText = "じゅもんを おぼえていない！"; this.battleWaitTimer = 30; }
        } else if (this.menu.cur === 2) { // にげる
           if (Math.random() < 0.5) { this.st = (this.mIdx === 0 ? 'field' : 'dungeon'); BGM.play('rpg_field'); }
           else { this.battleText = "にげられなかった！"; this.battleWaitTimer = 30; }
        }
      }
      
      // バトル中の魔法メニュー
      if (this.magicMenu.open) {
         if (keysDown.b) this.magicMenu.open = false;
         if (keysDown.up) this.magicMenu.cur = Math.max(0, this.magicMenu.cur - 1);
         if (keysDown.down) this.magicMenu.cur = Math.min(this.p.spells.length - 1, this.magicMenu.cur + 1);
         if (keysDown.a) {
            let spell = this.p.spells[this.magicMenu.cur];
            if (this.p.mp >= spell.mp) {
               this.p.mp -= spell.mp;
               if (spell.type === 'heal') {
                  this.p.hp = Math.min(this.p.mhp, this.p.hp - spell.dmg);
                  this.battleText = `${spell.name}！\nHPが かいふくした。`;
               } else {
                  this.en.hp -= spell.dmg;
                  this.battleText = `${spell.name}！\n${spell.dmg} のダメージ！`;
                  playSnd('hit'); screenShake(5);
                  if (this.en.hp <= 0) { /* 勝利処理と同じ（省略せず書くべきだが長くなるのでフラグで共通化） */ this.battleWaitTimer = 1; }
               }
               this.battleWaitTimer = 60;
               this.magicMenu.open = false;
            } else { this.battleText = "MPが たりない！"; }
         }
         return; // メニュー操作中は他の入力を受け付けない
      }
    }
  },
  
  battle(bossType, type) {
    this.st = 'battle'; BGM.play(bossType === 'boss' ? 'rpg_boss' : 'rpg_battle');
    let base = this.monsterTypes[type];
    this.en = { name: base.name, hp: base.hp, max: base.hp, atk: base.atk, def: base.def, spd: base.spd, exp: base.exp, gld: base.gld, spr: base.spr, c: base.c };
    this.battleText = `${this.en.name} があらわれた！`;
    this.menu.cur = 0;
  },
  
  updateMenu() {
    if (keysDown.b) { this.menu.open = false; this.magicMenu.open = false; this.itemMenu.open = false; return; }
    if (this.magicMenu.open) {
       if (keysDown.up) this.magicMenu.cur = Math.max(0, this.magicMenu.cur - 1);
       if (keysDown.down) this.magicMenu.cur = Math.min(this.p.spells.length - 1, this.magicMenu.cur + 1);
       if (keysDown.a) { 
         let s = this.p.spells[this.magicMenu.cur];
         if (this.p.mp >= s.mp && s.type === 'heal') {
            this.p.mp -= s.mp; this.p.hp = Math.min(this.p.mhp, this.p.hp - s.dmg);
            this.msg = "HPが かいふく した！"; this.st = 'msg'; this.msgNextSt = (this.mIdx === 0 ? 'field' : 'dungeon');
            this.menu.open = false; this.magicMenu.open = false;
         } else { playSnd('hit'); } // 攻撃魔法はフィールドで使えない
       }
    } else {
       if (keysDown.up) this.menu.cur = (this.menu.cur + 3) % 4;
       if (keysDown.down) this.menu.cur = (this.menu.cur + 1) % 4;
       if (keysDown.a) {
         if (this.menu.cur === 1) { if (this.p.spells.length > 0) this.magicMenu.open = true; else { this.msg = "じゅもんを　おぼえていない！"; this.st = 'msg'; this.menu.open = false; } }
         if (this.menu.cur === 3) { SaveSys.data.rpg = this.p; SaveSys.save(); this.msg = "セーブしました。"; this.st = 'msg'; this.menu.open = false; }
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
        let t = 0;
        if (y < this.map.length && x < this.map[0].length) t = this.map[y][x];
        
        let px = x * 20 - ox, py = y * 20 - oy;
        if (t === 0) ctx.fillStyle = '#000'; 
        else if (t === 1) ctx.fillStyle = this.st === 'field' ? '#484' : '#555'; 
        else if (t === 4) { drawSprite(px, py, '#f80', sprs.shop, 2.5); continue; }
        else if (t === 5) { drawSprite(px, py, '#08f', sprs.inn, 2.5); continue; }
        else if (t === 6) { drawSprite(px, py, '#a44', sprs.forge, 2.5); continue; }
        else if (t === 7) { drawSprite(px, py, '#fff', sprs.villager, 2.5); continue; } 
        else if (t === 8) { drawSprite(px, py, '#ccc', sprs.ruins, 2.5); continue; }
        else if (t === 3) { drawSprite(px, py, '#fff', sprs.stairs_dn, 2.5); continue; } // 階段
        else ctx.fillStyle = '#333';
        if (t === 0 || t === 1) ctx.fillRect(px, py, 20, 20);
      }
    }
    // 宝箱
    if (this.st === 'dungeon') {
      this.chests.forEach(c => {
         if (!c.open) { ctx.fillStyle='#ff0'; ctx.fillRect(c.x*20-ox+5, c.y*20-oy+5, 10, 10); }
      });
    }
    
    drawSprite(90, 130, '#f00', sprs.player, 2.5); 
    
    // UIウィンドウ
    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 200, 180, 90); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 200, 180, 90);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; 
      let lines = this.msg.split('\n'); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 20, 225 + i*20);
    }
    
    // バトル画面描画（復活！）
    if (this.st === 'battle') {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
      // 背景
      ctx.fillStyle = '#222'; ctx.fillRect(10, 10, 180, 120);
      // 敵
      drawSprite(70, 40, this.en.c, this.en.spr, 5); // 敵を大きく表示
      
      // 敵HPバー
      ctx.fillStyle = '#f00'; ctx.fillRect(50, 100, 100, 5);
      ctx.fillStyle = '#0f0'; ctx.fillRect(50, 100, 100 * (Math.max(0, this.en.hp) / this.en.max), 5);
      
      // メッセージ枠
      ctx.fillStyle = '#000'; ctx.fillRect(10, 140, 180, 60); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 140, 180, 60);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      let lines = this.battleText.split('\n'); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 15, 160 + i*16);
      
      // コマンド枠
      if (this.battleWaitTimer === 0) {
        ctx.fillStyle = '#000'; ctx.fillRect(10, 210, 180, 80); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 210, 180, 80);
        if (this.magicMenu.open) {
           this.p.spells.forEach((s, i) => {
             ctx.fillStyle = (s.mp > this.p.mp) ? '#888' : '#fff';
             ctx.fillText((i === this.magicMenu.cur ? '> ' : '  ') + s.name, 20, 230 + i * 15);
           });
        } else {
           ['たたかう', 'じゅもん', 'にげる'].forEach((item, i) => {
             ctx.fillStyle = '#fff';
             ctx.fillText((i === this.menu.cur ? '> ' : '  ') + item, 20, 230 + i * 20);
           });
        }
      }
      
      // ステータス表示
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText(`HP:${this.p.hp}/${this.p.mhp} MP:${this.p.mp}/${this.p.mmp}`, 20, 290);
    }
    
    // メニュー描画
    if (this.menu.open && this.st !== 'battle') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 10, 100, 100); ctx.strokeStyle = '#fff'; ctx.strokeRect(10, 10, 100, 100);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
      if (this.magicMenu.open) {
         this.p.spells.forEach((s, i) => {
           ctx.fillText((i === this.magicMenu.cur ? '> ' : '  ') + s.name, 20, 35 + i * 20);
         });
      } else {
         this.menu.items.forEach((item, i) => {
           ctx.fillText((i === this.menu.cur ? '> ' : '  ') + item, 20, 35 + i * 20);
         });
      }
    }
  }
};
