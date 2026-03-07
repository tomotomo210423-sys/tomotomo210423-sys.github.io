// === PIXEL BIOTOPE - AI EVOLUTION (WorldBOX Style Gen) ===
// 強化学習AI搭載、モールス会話、そしてWorldBOX風の自動マップ生成に対応！

const Biotope = {
    grid: [], entities: [], logs: [], 
    W: 50, H: 60, cellSize: 4, // 200x240 の描画エリア
    frame: 0, speed: 1,
    
    // パレット定義
    pals: [
        {id: 1, type:'M', name: '💧水', col: '#0af'},
        {id: 2, type:'M', name: '⏳砂', col: '#fd8'},
        {id: 3, type:'M', name: '🪨土', col: '#853'},
        {id: 4, type:'M', name: '🌿草', col: '#2c2'},
        {id: 5, type:'M', name: '🌲木', col: '#161'},
        {id: 6, type:'M', name: '🌋炎', col: '#f40'},
        {id: 7, type:'M', name: '🧱石', col: '#999'},
        {id: 10, type:'E', name: '🐇兎', col: '#fff'},
        {id: 11, type:'E', name: '🐺狼', col: '#666'},
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
            for(let y=0; y<this.H; y++) this.grid[x][y] = 0;
        }
        
        // ★ WorldBOX風：自動マップ生成（海、大地、山、森）
        this.generateWorld();

        // Qテーブルの初期化
        this.Q = Array(8).fill(0).map(() => Array(6).fill(0));
        
        this.addLog("WORLD GENERATED. WELCOME GOD.");
        this.addLog("Bボタンで倍速、仲間を投入して観察しましょう");
        BGM.play('menu');
    },

    // 🌎 世界の自動生成ロジック
    generateWorld() {
        // 1. 地下（石）と土台（土）
        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                if(y > this.H * 0.8) this.grid[x][y] = 7; // 最下層は石
                else if(y > this.H * 0.5) this.grid[x][y] = 3; // 下半分は土
            }
        }

        // 2. 地形の起伏（ランダムな山）
        for(let i=0; i<5; i++) {
            let cx = Math.floor(Math.random() * this.W);
            let cy = Math.floor(this.H * 0.5);
            let rad = 5 + Math.random() * 8;
            this.drawBlob(cx, cy, rad, 3); // 土の塊
            if(Math.random() < 0.5) this.drawBlob(cx, cy+5, rad*0.7, 7); // 芯に石
        }

        // 3. 海（水）の注入
        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                if(this.grid[x][y] === 0 && y > this.H * 0.6) {
                    this.grid[x][y] = 1; // 空白かつ一定の深さなら水
                }
            }
        }
        // 水辺に砂
        for(let i=0; i<3; i++) this.simPhysicalSteps(); // 物理を少し進めて水を落ち着かせる
        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                if(this.grid[x][y] === 3) { // 土
                    let isWaterNear = false;
                    for(let dx=-1; dx<=1; dx++) for(let dy=-1; dy<=1; dy++) if(this.getGrid(x+dx,y+dy)===1) isWaterNear=true;
                    if(isWaterNear && Math.random() < 0.7) this.grid[x][y] = 2; // 水辺の土を砂に
                }
            }
        }

        // 4. 生態系の初期配置（草、木）
        for(let x=0; x<this.W; x++) {
            for(let y=1; y<this.H; y++) {
                if(this.grid[x][y] === 3 && this.grid[x][y-1] === 0) { // 土の上
                    if(Math.random() < 0.3) this.grid[x][y-1] = 4; // 草
                    if(Math.random() < 0.05) this.grid[x][y-1] = 5; // 木
                }
            }
        }
    },

    // 円形の塊を描画する補助関数
    drawBlob(cx, cy, rad, id) {
        for(let x = Math.floor(cx-rad); x <= Math.ceil(cx+rad); x++) {
            for(let y = Math.floor(cy-rad); y <= Math.ceil(cy+rad); y++) {
                if(Math.hypot(x-cx, y-cy) < rad) this.setGrid(x, y, id);
            }
        }
    },

    addLog(msg) {
        this.logs.push({ text: msg, life: 180 });
        if(this.logs.length > 3) this.logs.shift();
    },

    getGrid(x, y) { if(x<0||x>=this.W||y<0||y>=this.H) return 7; return this.grid[x][y]; },
    setGrid(x, y, v) { if(x>=0&&x<this.W&&y>=0&&y<this.H) this.grid[x][y] = v; },

    // --- 物質の物理演算（砂・水・炎） ---
    simPhysicalSteps() {
        for(let y = this.H - 1; y >= 0; y--) {
            let xs = Array.from({length:this.W}, (_,i)=>i).sort(()=>Math.random()-0.5);
            for(let x of xs) {
                let id = this.grid[x][y];
                if(id === 0 || id === 7) continue;

                // 重力で落ちる粉体（砂2、土3）
                if(id === 2 || id === 3) {
                    let b = this.getGrid(x, y+1);
                    if(b === 0 || b === 1) { this.setGrid(x, y+1, id); this.setGrid(x, y, b); continue; }
                    let dir = Math.random() < 0.5 ? -1 : 1;
                    b = this.getGrid(x+dir, y+1);
                    if(b === 0 || b === 1) { this.setGrid(x+dir, y+1, id); this.setGrid(x, y, b); continue; }
                }
                // 流体（水1、炎/マグマ6）
                else if(id === 1 || id === 6) {
                    if(this.getGrid(x, y+1) === 0) { this.setGrid(x, y+1, id); this.setGrid(x, y, 0); continue; }
                    let dir = Math.random() < 0.5 ? -1 : 1;
                    if(this.getGrid(x+dir, y) === 0) { this.setGrid(x+dir, y, id); this.setGrid(x, y, 0); continue; }
                    
                    // 炎(6)の破壊と延焼
                    if(id === 6) {
                        let neighbors = [[x,y+1],[x,y-1],[x+1,y],[x-1,y]];
                        for(let [nx, ny] of neighbors) {
                            let n = this.getGrid(nx, ny);
                            if(n === 1) { this.setGrid(x, y, 7); this.setGrid(nx, ny, 0); break; } 
                            if(n === 4 || n === 5) { this.setGrid(nx, ny, 6); } // 草木に引火
                        }
                        if(Math.random()<0.1) this.setGrid(x,y,0); // 鎮火
                    }
                    // 水(1)の生命効果
                    if(id === 1 && Math.random() < 0.02) {
                        if((this.getGrid(x, y+1) === 3 || this.getGrid(x, y+1) === 2) && this.getGrid(x, y-1) === 0) this.setGrid(x, y-1, 4);
                    }
                }
            }
        }
    },

    simStep() {
        this.frame++;
        this.simPhysicalSteps();

        // 2. エンティティ（生物）の行動
        for(let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            e.hp--; 
            if(e.chatTimer > 0) e.chatTimer--;

            if(e.hp <= 0 || this.getGrid(e.x, e.y) === 6) {
                if(e.type === 12 && this.getGrid(e.x, e.y) === 6 && e.lastState !== undefined) {
                    this.Q[e.lastState][e.lastAction] -= 50; // マグマ死の学習
                    this.addLog("☠️ 人間が炎に焼かれた！");
                }
                this.entities.splice(i, 1);
                continue;
            }

            // 重力落下
            let foot = this.getGrid(e.x, e.y+1);
            if(foot === 0 || foot === 1) {
                e.y++; 
                if(foot === 1) e.hp -= 2; // 水中は少しダメージ
                continue; 
            }

            // AI行動
            if(e.type === 10) { // ウサギ: 草(4)を食う
                let dx = Math.random() < 0.5 ? -1 : 1;
                if(this.getGrid(e.x+dx, e.y) === 0) e.x += dx;
                if(this.getGrid(e.x, e.y+1) === 4) {
                    this.setGrid(e.x, e.y+1, 3); e.hp += 50;
                    if(e.hp > 200) { e.hp = 100; this.entities.push({type:10, x:e.x, y:e.y, hp:100, chatTimer:0}); }
                }
            } 
            else if (e.type === 11) { // オオカミ: 捕食
                let target = this.entities.find(t => (t.type===10 || t.type===12) && Math.abs(t.x-e.x)<12 && Math.abs(t.y-e.y)<6);
                if(target) {
                    e.x += (target.x > e.x ? 1 : -1);
                    if(Math.abs(target.x - e.x) <= 1 && Math.abs(target.y - e.y) <= 1) {
                        target.hp -= 200; e.hp += 150;
                        if(target.type === 12) this.addLog("🐺 オオカミが人間を襲った");
                        if(e.hp > 300) { e.hp = 150; this.entities.push({type:11, x:e.x, y:e.y, hp:150, chatTimer:0}); }
                    }
                } else if(Math.random() < 0.3) e.x += (Math.random() < 0.5 ? -1 : 1);
            }
            else if (e.type === 12) { // 人間
                this.humanAI(e);
            }
            
            // 画面外脱出防止
            e.x = Math.max(0, Math.min(this.W-1, e.x));
            e.y = Math.max(0, Math.min(this.H-1, e.y));
        }
    },

    // 🧠 強化学習AI & モールス会話
    humanAI(e) {
        let threatX = 0, resX = 0, friendX = 0;
        let threat = 0, res = 0, friend = 0;

        for(let t of this.entities) {
            if(t === e) continue;
            let dist = Math.abs(t.x - e.x) + Math.abs(t.y - e.y);
            if(dist < 7) {
                if(t.type === 11) { threat = 1; threatX = t.x; } 
                if(t.type === 12) { friend = 1; friendX = t.x; } 
                if(t.type === 10) { res = 1; resX = t.x; }       
            }
        }
        for(let dx=-3; dx<=3; dx++){
            for(let dy=-2; dy<=2; dy++){
                let v = this.getGrid(e.x+dx, e.y+dy);
                if(v === 6) { threat = 1; threatX = e.x+dx; } // 炎
                if(v === 5 || v === 4) { res = 1; resX = e.x+dx; } // 木
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

        // 行動実行
        if(action === 0) { // RAND
            if(Math.random() < 0.6) e.x += (Math.random()<0.5?1:-1);
        } 
        else if(action === 1 && threat) { // ESCAPE
            e.x += (e.x > threatX ? 1 : -1);
        } 
        else if(action === 2 && res) { // APPROACH
            e.x += (e.x < resX ? 1 : -1);
            if(this.getGrid(e.x, e.y+1) === 4 || this.getGrid(e.x, e.y+1) === 5) {
                this.setGrid(e.x, e.y+1, 3); e.hp += 120;
                if(e.hp > 300) { e.hp = 150; this.entities.push({type:12, x:e.x, y:e.y, hp:150, chatTimer:0}); this.addLog("🧍 人類が繁殖した！"); }
            }
        } 
        else if(action === 3) { // BUILD
            let dx = Math.random() < 0.5 ? -1 : 1;
            if(this.getGrid(e.x+dx, e.y) === 0) { this.setGrid(e.x+dx, e.y, 7); this.Q[state][action] += 2; }
        } 
        else if(action === 4 && threat) { // ATTACK
            let target = this.entities.find(t => t.type === 11 && Math.abs(t.x-e.x)<=2);
            if(target) { target.hp -= 120; this.Q[state][action] += 10; if(target.hp <= 0) this.addLog("⚔️ 人類が狼を討伐した！"); }
        } 
        else if(action === 5 && friend) { // 💬 COMMUNICATE (Morse)
            e.chatTimer = 40;
            e.chatMsg = ["・ー・", "ーー", "・・", "ー・"][Math.floor(Math.random()*4)];
            // 知識の共有（Qテーブルの同期）
            let count = 0;
            for(let t of this.entities) {
                if(t !== e && t.type === 12 && Math.abs(t.x-e.x)<10) {
                    for(let s=0; s<8; s++) for(let a=0; a<6; a++) this.Q[s][a] += (this.Q[s][a] - this.Q[s][a]) * 0.15;
                    t.chatTimer = 20; t.chatMsg = "！"; count++;
                }
            }
            if(count > 0 && Math.random() < 0.03) this.addLog(`💬 知識共有が発生(${count}人)`);
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
                if(pItem.type === 'M') { this.setGrid(px, py, pItem.id);
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
        
        // 物質
        const cols = {0:null, 1:'#08f', 2:'#fd8', 3:'#853', 4:'#2d2', 5:'#531', 6:'#f40', 7:'#999'};
        for(let x=0; x<this.W; x++){
            for(let y=0; y<this.H; y++){
                let id = this.grid[x][y];
                if(id !== 0) { ctx.fillStyle = cols[id]; ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize); }
            }
        }
        // 生物
        for(let e of this.entities) {
            let px = e.x * this.cellSize; let py = e.y * this.cellSize;
            ctx.fillStyle = (e.type===10)?'#fff':(e.type===11)?'#666':'#fcc';
            ctx.fillRect(px, py, 4, 4);
            if(e.type===12 && e.chatTimer > 0) { // モールス
                ctx.fillStyle = '#ff0'; ctx.font = '8px monospace'; ctx.fillText(e.chatMsg, px - 6, py - 4);
            }
        }
        ctx.restore();

        // ログ
        ctx.fillStyle = 'rgba(0, 15, 0, 0.8)'; ctx.fillRect(0, 0, 200, 30);
        ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(0,30); ctx.lineTo(200,30); ctx.stroke();
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 9px monospace';
        for(let i=0; i<this.logs.length; i++) { ctx.globalAlpha = Math.min(1.0, this.logs[i].life / 20); ctx.fillText(this.logs[i].text, 5, 10 + i * 10); }
        ctx.globalAlpha = 1.0;

        // UI
        ctx.fillStyle = '#111'; ctx.fillRect(0, 270, 200, 30);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`◀ [ ${this.pals[this.curPal].name} ] ▶`, 10, 288);
        ctx.fillStyle = (this.speed>1)?'#ff0':'#aaa'; ctx.fillText('>> x3 (B)', 130, 288);
    }
};
