// === PIXEL BIOTOPE - AI EVOLUTION (Top-Down WorldBOX Edition) ===
// 見下ろし型（トップビュー）に変更し、全方位の生態系シミュレーションを実現！

const Biotope = {
    grid: [], entities: [], logs: [], 
    W: 50, H: 60, cellSize: 4, // 200x240 の描画エリア
    frame: 0, speed: 1,
    
    // パレット定義 (0は整地用の土とする)
    pals: [
        {id: 3, type:'M', name: '🪨土(整地)', col: '#853'},
        {id: 1, type:'M', name: '💧水(海)', col: '#0af'},
        {id: 2, type:'M', name: '⏳砂', col: '#fd8'},
        {id: 4, type:'M', name: '🌿草', col: '#2c2'},
        {id: 5, type:'M', name: '🌲木', col: '#161'},
        {id: 6, type:'M', name: '🌋炎/マグマ', col: '#f40'},
        {id: 7, type:'M', name: '🧱石(山)', col: '#999'},
        {id: 10, type:'E', name: '🐇兎', col: '#fff'},
        {id: 11, type:'E', name: '🐺狼', col: '#444'},
        {id: 12, type:'E', name: '🧍人', col: '#fcc'}
    ],
    curPal: 0,
    
    // 人類共有のQテーブル
    Q: [], 
    
    init() {
        this.grid = []; this.entities = []; this.logs = [];
        this.frame = 0; this.speed = 1;
        for(let x=0; x<this.W; x++) {
            this.grid[x] = [];
            for(let y=0; y<this.H; y++) this.grid[x][y] = 1; // 初期状態はすべて海(水)
        }
        
        // ★ 見下ろし型・大陸の自動生成
        this.generateWorld();

        // Qテーブルの初期化 (0:ランダム, 1:逃避, 2:接近, 3:建築, 4:攻撃, 5:会話)
        this.Q = Array(8).fill(0).map(() => Array(6).fill(0));
        
        this.addLog("TOP-DOWN WORLD GENERATED.");
        this.addLog("大陸に生命を解き放ちましょう。");
        BGM.play('menu');
    },

    // 🌎 世界の自動生成ロジック（トップビュー用）
    generateWorld() {
        // 1. 大陸のベース（土）を複数の円で生成
        for(let i=0; i<12; i++) {
            let cx = 5 + Math.floor(Math.random() * (this.W - 10));
            let cy = 5 + Math.floor(Math.random() * (this.H - 10));
            let rad = 6 + Math.random() * 8;
            this.drawBlob(cx, cy, rad, 3); 
        }

        // 2. セルオートマトンで地形を滑らかにする
        let newGrid = JSON.parse(JSON.stringify(this.grid));
        for(let x=1; x<this.W-1; x++) {
            for(let y=1; y<this.H-1; y++) {
                let landCount = 0;
                for(let dx=-1; dx<=1; dx++) {
                    for(let dy=-1; dy<=1; dy++) {
                        if(this.grid[x+dx][y+dy] === 3) landCount++;
                    }
                }
                if(landCount >= 5) newGrid[x][y] = 3;
                else if(landCount <= 3) newGrid[x][y] = 1;
            }
        }
        this.grid = newGrid;

        // 3. 海岸線（砂）と山（石）、森（草・木）の生成
        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                if(this.grid[x][y] === 3) {
                    // 周囲に水があれば砂（ビーチ）にする
                    let isCoast = false;
                    for(let dx=-1; dx<=1; dx++) {
                        for(let dy=-1; dy<=1; dy++) {
                            if(this.getGrid(x+dx, y+dy) === 1) isCoast = true;
                        }
                    }
                    if(isCoast) {
                        this.grid[x][y] = 2; // 砂
                    } else {
                        // 内陸部
                        let r = Math.random();
                        if(r < 0.05) this.grid[x][y] = 7;      // 山(石)
                        else if(r < 0.2) this.grid[x][y] = 5;  // 森(木)
                        else if(r < 0.7) this.grid[x][y] = 4;  // 平野(草)
                    }
                }
            }
        }
    },

    drawBlob(cx, cy, rad, id) {
        for(let x = Math.floor(cx-rad); x <= Math.ceil(cx+rad); x++) {
            for(let y = Math.floor(cy-rad); y <= Math.ceil(cy+rad); y++) {
                if(x>=0 && x<this.W && y>=0 && y<this.H && Math.hypot(x-cx, y-cy) < rad) {
                    this.grid[x][y] = id;
                }
            }
        }
    },

    addLog(msg) {
        this.logs.push({ text: msg, life: 180 });
        if(this.logs.length > 3) this.logs.shift();
    },

    getGrid(x, y) { if(x<0||x>=this.W||y<0||y>=this.H) return 1; return this.grid[x][y]; },
    setGrid(x, y, v) { if(x>=0&&x<this.W&&y>=0&&y<this.H) this.grid[x][y] = v; },

    // --- 物質の環境シミュレーション（トップビュー版） ---
    simPhysicalSteps() {
        let updates = []; // 同時更新用
        
        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                let id = this.grid[x][y];
                if(id === 1 || id === 7 || id === 2) continue; // 水、山、砂は自発的には動かない

                let neighbors = [[x,y-1], [x,y+1], [x-1,y], [x+1,y]];

                // 炎(6)の延焼と鎮火
                if(id === 6) {
                    for(let [nx, ny] of neighbors) {
                        let n = this.getGrid(nx, ny);
                        if(n === 1) updates.push({x, y, v: 7}); // 水に触れると石になる
                        if(n === 4 || n === 5) updates.push({x: nx, y: ny, v: 6}); // 草木に引火
                    }
                    if(Math.random() < 0.15) updates.push({x, y, v: 3}); // 燃え尽きて土になる
                }
                
                // 草(4)・木(5)の繁殖（土に広がる）
                if((id === 4 || id === 5) && Math.random() < 0.005) {
                    let [nx, ny] = neighbors[Math.floor(Math.random()*4)];
                    if(this.getGrid(nx, ny) === 3) updates.push({x: nx, y: ny, v: id});
                }
            }
        }
        
        for(let u of updates) this.setGrid(u.x, u.y, u.v);
    },

    simStep() {
        this.frame++;
        if(this.frame % 2 === 0) this.simPhysicalSteps(); // 環境変化は少しゆっくり

        // エンティティ（生物）の行動
        for(let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            e.hp--; 
            if(e.chatTimer > 0) e.chatTimer--;

            // マグマや寿命で死亡
            if(e.hp <= 0 || this.getGrid(e.x, e.y) === 6) {
                if(e.type === 12 && this.getGrid(e.x, e.y) === 6 && e.lastState !== undefined) {
                    this.Q[e.lastState][e.lastAction] -= 50; 
                    this.addLog("☠️ 人間が炎に焼かれた！");
                }
                this.entities.splice(i, 1);
                continue;
            }

            // トップビューのAI行動（全方位移動）
            if(e.type === 10) { // ウサギ: 草(4)を食う
                let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
                let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
                
                let nextGrid = this.getGrid(e.x+dx, e.y+dy);
                if(nextGrid !== 1 && nextGrid !== 7) { e.x += dx; e.y += dy; } // 海と山以外は歩ける
                
                if(this.getGrid(e.x, e.y) === 4) {
                    this.setGrid(e.x, e.y, 3); e.hp += 60; // 草を食って土にする
                    if(e.hp > 200) { e.hp = 100; this.entities.push({type:10, x:e.x, y:e.y, hp:100, chatTimer:0}); }
                }
            } 
            else if (e.type === 11) { // オオカミ: 捕食
                let target = this.entities.find(t => (t.type===10 || t.type===12) && Math.abs(t.x-e.x)<10 && Math.abs(t.y-e.y)<10);
                if(target) {
                    let dx = target.x > e.x ? 1 : (target.x < e.x ? -1 : 0);
                    let dy = target.y > e.y ? 1 : (target.y < e.y ? -1 : 0);
                    let nextGrid = this.getGrid(e.x+dx, e.y+dy);
                    if(nextGrid !== 1 && nextGrid !== 7) { e.x += dx; e.y += dy; }

                    if(Math.abs(target.x - e.x) <= 1 && Math.abs(target.y - e.y) <= 1) {
                        target.hp -= 200; e.hp += 150;
                        if(target.type === 12) this.addLog("🐺 オオカミが人間を襲った");
                        if(e.hp > 300) { e.hp = 150; this.entities.push({type:11, x:e.x, y:e.y, hp:150, chatTimer:0}); }
                    }
                } else if(Math.random() < 0.4) {
                    let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
                    let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
                    if(this.getGrid(e.x+dx, e.y+dy) !== 1) { e.x += dx; e.y += dy; }
                }
            }
            else if (e.type === 12) { // 人間
                this.humanAI(e);
            }
            
            // 画面外脱出防止
            e.x = Math.max(0, Math.min(this.W-1, e.x));
            e.y = Math.max(0, Math.min(this.H-1, e.y));
        }
    },

    // 🧠 強化学習AI & モールス会話（全方位対応）
    humanAI(e) {
        let threatX = e.x, threatY = e.y, resX = e.x, resY = e.y;
        let threat = 0, res = 0, friend = 0;

        // 周囲スキャン
        for(let t of this.entities) {
            if(t === e) continue;
            if(Math.abs(t.x - e.x) < 8 && Math.abs(t.y - e.y) < 8) {
                if(t.type === 11) { threat = 1; threatX = t.x; threatY = t.y; } 
                if(t.type === 12) { friend = 1; } 
                if(t.type === 10) { res = 1; resX = t.x; resY = t.y; }       
            }
        }
        for(let dx=-3; dx<=3; dx++){
            for(let dy=-3; dy<=3; dy++){
                let v = this.getGrid(e.x+dx, e.y+dy);
                if(v === 6) { threat = 1; threatX = e.x+dx; threatY = e.y+dy; } // 炎
                if(v === 5 || v === 4) { res = 1; resX = e.x+dx; resY = e.y+dy; } // 草木
            }
        }

        let state = (threat << 2) | (res << 1) | friend;
        
        // 学習
        if (e.lastState !== undefined) {
            let reward = -0.1;
            if (e.hp > e.lastHp) reward += 10;
            if (e.hp < e.lastHp) reward -= 15;
            let maxQ = Math.max(...this.Q[state]);
            this.Q[e.lastState][e.lastAction] += 0.2 * (reward + 0.9 * maxQ - this.Q[e.lastState][e.lastAction]);
        }

        // 行動決定
        let action = 0;
        if(Math.random() < 0.1) action = Math.floor(Math.random() * 6);
        else {
            let maxVal = -9999;
            for(let a=0; a<6; a++) if(this.Q[state][a] > maxVal) { maxVal = this.Q[state][a]; action = a; }
        }
        e.lastState = state; e.lastAction = action; e.lastHp = e.hp;

        // 行動実行用ヘルパー関数
        let moveTowards = (tx, ty, isEscape) => {
            let dx = tx > e.x ? 1 : (tx < e.x ? -1 : 0);
            let dy = ty > e.y ? 1 : (ty < e.y ? -1 : 0);
            if(isEscape) { dx *= -1; dy *= -1; }
            if(Math.random()<0.5 && dx !== 0) dy = 0; else if(dy !== 0) dx = 0; // 上下左右移動に制限
            let nextGrid = this.getGrid(e.x+dx, e.y+dy);
            if(nextGrid !== 1 && nextGrid !== 7) { e.x += dx; e.y += dy; } // 海と山は避ける
        };

        if(action === 0) { // RAND
            if(Math.random() < 0.6) {
                let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
                let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
                if(this.getGrid(e.x+dx, e.y+dy) !== 1) { e.x += dx; e.y += dy; }
            }
        } 
        else if(action === 1 && threat) { // ESCAPE
            moveTowards(threatX, threatY, true);
        } 
        else if(action === 2 && res) { // APPROACH
            moveTowards(resX, resY, false);
            let foot = this.getGrid(e.x, e.y);
            if(foot === 4 || foot === 5) {
                this.setGrid(e.x, e.y, 3); e.hp += 120; // 伐採・収穫
                if(e.hp > 300) { e.hp = 150; this.entities.push({type:12, x:e.x, y:e.y, hp:150, chatTimer:0}); this.addLog("🧍 人類が村を拡大した！"); }
            }
        } 
        else if(action === 3) { // BUILD
            let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
            let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
            let target = this.getGrid(e.x+dx, e.y+dy);
            if(target === 3 || target === 2 || target === 4) { 
                this.setGrid(e.x+dx, e.y+dy, 7); // 石(壁)を置く
                this.Q[state][action] += 2; 
            }
        } 
        else if(action === 4 && threat) { // ATTACK
            let target = this.entities.find(t => t.type === 11 && Math.abs(t.x-e.x)<=2 && Math.abs(t.y-e.y)<=2);
            if(target) { target.hp -= 120; this.Q[state][action] += 10; if(target.hp <= 0) this.addLog("⚔️ 人類が脅威を排除した！"); }
        } 
        else if(action === 5 && friend) { // 💬 COMMUNICATE (Morse)
            e.chatTimer = 40;
            e.chatMsg = ["・ー・", "ーー", "・・", "ー・"][Math.floor(Math.random()*4)];
            let count = 0;
            for(let t of this.entities) {
                if(t !== e && t.type === 12 && Math.abs(t.x-e.x)<10 && Math.abs(t.y-e.y)<10) {
                    for(let s=0; s<8; s++) for(let a=0; a<6; a++) this.Q[s][a] += (this.Q[s][a] - this.Q[s][a]) * 0.15;
                    t.chatTimer = 20; t.chatMsg = "！"; count++;
                }
            }
            if(count > 0 && Math.random() < 0.05) this.addLog(`💬 知識の伝達(${count}人)`);
        }
    },

    update() {
        if(keysDown.select) { this.init(); playSnd('hit'); screenShake(10); return; } 
        if(keysDown.b) { this.speed = this.speed === 1 ? 3 : 1; playSnd('sel'); } 

        if(keysDown.left) { this.curPal = (this.curPal - 1 + this.pals.length) % this.pals.length; playSnd('sel'); }
        if(keysDown.right) { this.curPal = (this.curPal + 1) % this.pals.length; playSnd('sel'); }

        // TAP/Aボタン配置
        if(pointer.active || keys.a) {
            let px = Math.floor(pointer.x / this.cellSize);
            let py = Math.floor((pointer.y - 30) / this.cellSize); 
            if(!pointer.active && keys.a) { px = Math.floor(this.W/2); py = Math.floor(this.H/2); }

            if(px >= 0 && px < this.W && py >= 0 && py < this.H) {
                let pItem = this.pals[this.curPal];
                if(pItem.type === 'M') { 
                    this.setGrid(px, py, pItem.id);
                } else if(pItem.type === 'E' && this.frame % 5 === 0) {
                    this.entities.push({ type: pItem.id, x: px, y: py, hp: 200, chatTimer: 0 });
                    playSnd('jmp');
                }
            }
        }

        // 倍速対応ループ
        for(let s=0; s<this.speed; s++) this.simStep();

        for(let i=this.logs.length-1; i>=0; i--) {
            this.logs[i].life--;
            if(this.logs[i].life <= 0) this.logs.splice(i, 1);
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
        ctx.save(); ctx.translate(0, 30);
        
        // 物質の描画（トップビュー）
        const cols = {0:null, 1:'#05a', 2:'#fd8', 3:'#853', 4:'#2a2', 5:'#151', 6:'#f40', 7:'#666'};
        for(let x=0; x<this.W; x++){
            for(let y=0; y<this.H; y++){
                let id = this.grid[x][y];
                if(id !== 0) { 
                    ctx.fillStyle = cols[id]; 
                    ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize); 
                    
                    // 地形のディテール装飾
                    if(id === 1 && Math.random()<0.05) { ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x*this.cellSize+1, y*this.cellSize+1, 2, 1); } // 波
                    if(id === 4 && (x+y)%2===0) { ctx.fillStyle='#3c3'; ctx.fillRect(x*this.cellSize+1, y*this.cellSize+1, 2, 2); } // 草の模様
                    if(id === 5) { ctx.fillStyle='#030'; ctx.fillRect(x*this.cellSize+1, y*this.cellSize+1, 2, 2); } // 木の陰
                }
            }
        }
        
        // 生物の描画（トップビュー）
        for(let e of this.entities) {
            let px = e.x * this.cellSize; let py = e.y * this.cellSize;
            
            // 影
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(px, py+2, 4, 3);

            if(e.type === 10) { // ウサギ
                ctx.fillStyle = '#fff'; ctx.fillRect(px, py, 4, 4);
                ctx.fillStyle = '#fbb'; ctx.fillRect(px+1, py+1, 1, 1);
            } else if (e.type === 11) { // オオカミ
                ctx.fillStyle = '#444'; ctx.fillRect(px-1, py-1, 6, 5);
                ctx.fillStyle = '#f00'; ctx.fillRect(px, py, 1, 1); ctx.fillRect(px+2, py, 1, 1);
            } else if (e.type === 12) { // 人間
                ctx.fillStyle = '#fcc'; ctx.fillRect(px+1, py-1, 2, 2); // 頭
                ctx.fillStyle = '#00f'; ctx.fillRect(px, py+1, 4, 3);     // 肩
                
                // 💬 モールス会話
                if(e.chatTimer > 0) {
                    ctx.fillStyle = '#ff0'; ctx.font = '8px monospace'; ctx.fillText(e.chatMsg, px - 6, py - 4);
                }
            }
        }
        ctx.restore();

        // ログ領域
        ctx.fillStyle = 'rgba(0, 15, 0, 0.8)'; ctx.fillRect(0, 0, 200, 30);
        ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(0,30); ctx.lineTo(200,30); ctx.stroke();
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 9px monospace';
        for(let i=0; i<this.logs.length; i++) { 
            ctx.globalAlpha = Math.min(1.0, this.logs[i].life / 20); 
            ctx.fillText(this.logs[i].text, 5, 10 + i * 10); 
        }
        ctx.globalAlpha = 1.0;

        // UI領域
        ctx.fillStyle = '#111'; ctx.fillRect(0, 270, 200, 30);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`◀ [ ${this.pals[this.curPal].name} ] ▶`, 10, 288);
        ctx.fillStyle = (this.speed>1)?'#ff0':'#aaa'; ctx.fillText('>> x3 (B)', 130, 288);
    }
};
