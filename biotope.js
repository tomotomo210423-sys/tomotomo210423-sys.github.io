// === PIXEL BIOTOPE - AI EVOLUTION (Landscape Edition) ===
// 強化学習AI搭載の人間、モールス信号による知識共有、横画面・高解像度シミュレーション

const Biotope = {
    grid: [], entities: [], logs: [], 
    // ★ 解像度を横長（400x240）に拡張！
    W: 100, H: 45, cellSize: 4, 
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
    
    // 人類共有のQテーブル (8状態 × 6行動)
    Q: [], 
    
    init() {
        // ★ ここでゲーム機を横画面に変形し、Canvas解像度を2倍にする！
        document.getElementById('gameboy').className = 'mode-landscape';
        canvas.width = 400;
        canvas.height = 240;

        this.grid = []; this.entities = []; this.logs = [];
        this.frame = 0; this.speed = 1;
        for(let x=0; x<this.W; x++) {
            this.grid[x] = [];
            for(let y=0; y<this.H; y++) this.grid[x][y] = 0;
        }
        
        // Qテーブルの初期化 (0:ランダム, 1:逃避, 2:接近, 3:建築, 4:攻撃, 5:会話)
        this.Q = Array(8).fill(0).map(() => Array(6).fill(0));
        
        this.addLog("SYSTEM BOOT: BIOTOPE V1");
        this.addLog("神(あなた)の力で世界を創造してください");
        BGM.play('menu');
    },

    addLog(msg) {
        this.logs.push({ text: msg, life: 240 });
        if(this.logs.length > 3) this.logs.shift();
    },

    getGrid(x, y) { if(x<0||x>=this.W||y<0||y>=this.H) return 7; return this.grid[x][y]; },
    setGrid(x, y, v) { if(x>=0&&x<this.W&&y>=0&&y<this.H) this.grid[x][y] = v; },

    // --- メインシミュレーションステップ ---
    simStep() {
        this.frame++;

        // 1. セルオートマトン（物質の物理演算）
        for(let y = this.H - 1; y >= 0; y--) {
            // 左右ランダムに走査して自然な動きに
            let xs = Array.from({length:this.W}, (_,i)=>i).sort(()=>Math.random()-0.5);
            for(let x of xs) {
                let id = this.grid[x][y];
                if(id === 0 || id === 7) continue; 

                if(id === 2 || id === 3) {
                    let b = this.getGrid(x, y+1);
                    if(b === 0 || b === 1) { this.setGrid(x, y+1, id); this.setGrid(x, y, b); continue; }
                    let dir = Math.random() < 0.5 ? -1 : 1;
                    b = this.getGrid(x+dir, y+1);
                    if(b === 0 || b === 1) { this.setGrid(x+dir, y+1, id); this.setGrid(x, y, b); continue; }
                }
                else if(id === 1 || id === 6) {
                    if(this.getGrid(x, y+1) === 0) { this.setGrid(x, y+1, id); this.setGrid(x, y, 0); continue; }
                    let dir = Math.random() < 0.5 ? -1 : 1;
                    if(this.getGrid(x+dir, y) === 0) { this.setGrid(x+dir, y, id); this.setGrid(x, y, 0); continue; }
                    
                    if(id === 6) {
                        let neighbors = [[x,y+1],[x,y-1],[x+1,y],[x-1,y]];
                        for(let [nx, ny] of neighbors) {
                            let n = this.getGrid(nx, ny);
                            if(n === 1) { this.setGrid(x, y, 7); this.setGrid(nx, ny, 0); break; } 
                            if(n === 4 || n === 5) { this.setGrid(nx, ny, 6); } 
                        }
                    }
                    if(id === 1 && Math.random() < 0.05) {
                        if(this.getGrid(x, y+1) === 3 && this.getGrid(x, y-1) === 0) this.setGrid(x, y-1, 4);
                    }
                }
                else if(id === 4 && Math.random() < 0.01) {
                    if(this.getGrid(x, y-1) === 0) this.setGrid(x, y-1, 5); 
                }
            }
        }

        // 2. エンティティ（生物）の行動
        for(let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            e.hp--; 
            if(e.chatTimer > 0) e.chatTimer--;

            if(e.hp <= 0 || this.getGrid(e.x, e.y) === 6) {
                if(e.type === 12 && this.getGrid(e.x, e.y) === 6 && e.lastState !== undefined) {
                    this.Q[e.lastState][e.lastAction] -= 50; 
                    this.addLog("☠️ 人間がマグマに飲まれた！");
                }
                this.entities.splice(i, 1);
                continue;
            }

            if(this.getGrid(e.x, e.y+1) === 0 || this.getGrid(e.x, e.y+1) === 1) {
                e.y++; continue; 
            }

            if(e.type === 10) { 
                let dx = Math.random() < 0.5 ? -1 : 1;
                if(this.getGrid(e.x+dx, e.y) === 0) e.x += dx;
                if(this.getGrid(e.x, e.y) === 4 || this.getGrid(e.x, e.y+1) === 4) {
                    this.setGrid(e.x, e.y, 0); this.setGrid(e.x, e.y+1, 3); 
                    e.hp += 50;
                    if(e.hp > 200) { e.hp = 100; this.entities.push({type:10, x:e.x, y:e.y-1, hp:100, chatTimer:0}); } 
                }
            } 
            else if (e.type === 11) { 
                let target = this.entities.find(t => (t.type===10 || t.type===12) && Math.abs(t.x-e.x)<10 && Math.abs(t.y-e.y)<5);
                if(target) {
                    e.x += (target.x > e.x ? 1 : -1);
                    if(Math.abs(target.x - e.x) <= 1 && Math.abs(target.y - e.y) <= 1) {
                        target.hp -= 200; e.hp += 100; 
                        if(target.type === 12) this.addLog("🐺 オオカミが人間を捕食した");
                        if(e.hp > 300) { e.hp = 100; this.entities.push({type:11, x:e.x, y:e.y-1, hp:150, chatTimer:0}); }
                    }
                } else {
                    if(Math.random() < 0.3) e.x += (Math.random() < 0.5 ? -1 : 1);
                }
            }
            else if (e.type === 12) { 
                this.humanAI(e);
            }
            
            e.x = Math.max(0, Math.min(this.W-1, e.x));
            e.y = Math.max(0, Math.min(this.H-1, e.y));
        }
    },

    // 🧠 人類の強化学習AIエンジン
    humanAI(e) {
        let threatX = 0, resX = 0, friendX = 0;
        let threat = 0, res = 0, friend = 0;

        for(let t of this.entities) {
            if(t === e) continue;
            let dist = Math.abs(t.x - e.x) + Math.abs(t.y - e.y);
            if(dist < 5) {
                if(t.type === 11) { threat = 1; threatX = t.x; } 
                if(t.type === 12) { friend = 1; friendX = t.x; } 
                if(t.type === 10) { res = 1; resX = t.x; }       
            }
        }
        for(let dx=-3; dx<=3; dx++){
            for(let dy=-3; dy<=3; dy++){
                let v = this.getGrid(e.x+dx, e.y+dy);
                if(v === 6) { threat = 1; threatX = e.x+dx; } 
                if(v === 5 || v === 4) { res = 1; resX = e.x+dx; } 
            }
        }

        let state = (threat << 2) | (res << 1) | friend;
        
        if (e.lastState !== undefined) {
            let reward = -0.1; 
            if (e.hp > e.lastHp) reward += 5; 
            if (e.hp < e.lastHp) reward -= 10; 
            
            let maxQ = Math.max(...this.Q[state]);
            this.Q[e.lastState][e.lastAction] += 0.2 * (reward + 0.9 * maxQ - this.Q[e.lastState][e.lastAction]);
        }

        let action = 0;
        if(Math.random() < 0.1) {
            action = Math.floor(Math.random() * 6);
        } else {
            let maxVal = -9999;
            for(let a=0; a<6; a++) {
                if(this.Q[state][a] > maxVal) { maxVal = this.Q[state][a]; action = a; }
            }
        }

        e.lastState = state; e.lastAction = action; e.lastHp = e.hp;

        if(action === 0) { 
            if(Math.random() < 0.5 && this.getGrid(e.x+(Math.random()<0.5?1:-1), e.y) === 0) e.x += (Math.random()<0.5?1:-1);
        } 
        else if(action === 1 && threat) { 
            e.x += (e.x > threatX ? 1 : -1);
        } 
        else if(action === 2 && res) { 
            e.x += (e.x < resX ? 1 : -1);
            let foot = this.getGrid(e.x, e.y); let head = this.getGrid(e.x, e.y-1);
            if(foot === 4 || foot === 5 || head === 4 || head === 5) {
                this.setGrid(e.x, e.y, 0); this.setGrid(e.x, e.y-1, 0);
                e.hp += 100;
                if(e.hp > 300) { e.hp = 150; this.entities.push({type:12, x:e.x, y:e.y-1, hp:150, chatTimer:0}); this.addLog("🧍 人類が繁殖した！"); }
            }
        } 
        else if(action === 3) { 
            let dx = Math.random() < 0.5 ? -1 : 1;
            if(this.getGrid(e.x+dx, e.y) === 0) {
                this.setGrid(e.x+dx, e.y, 7); 
                this.Q[state][action] += 1; 
            }
        } 
        else if(action === 4 && threat) { 
            let target = this.entities.find(t => t.type===11 && Math.abs(t.x-e.x)<=2 && Math.abs(t.y-e.y)<=2);
            if(target) {
                target.hp -= 100; 
                this.Q[state][action] += 5; 
                if(target.hp <= 0) this.addLog("⚔️ 人類がオオカミを討伐した！");
            }
        } 
        else if(action === 5 && friend) { 
            e.chatTimer = 30;
            e.chatMsg = ["・ー・", "ーー・", "・・・", "ー・ー"][Math.floor(Math.random()*4)];
            let count = 0;
            for(let t of this.entities) {
                if(t !== e && t.type === 12 && Math.abs(t.x-e.x)<8 && Math.abs(t.y-e.y)<8) {
                    for(let s=0; s<8; s++) {
                        for(let a=0; a<6; a++) {
                            this.Q[s][a] += (this.Q[s][a] - this.Q[s][a]) * 0.1; 
                        }
                    }
                    t.chatTimer = 15; t.chatMsg = "！"; count++;
                }
            }
            if(count > 0 && Math.random() < 0.05) this.addLog(`💬 人間が知識を共有した(${count}人)`);
        }
    },

    update() {
        if(keysDown.select) { this.init(); playSnd('hit'); screenShake(10); return; } 
        if(keysDown.b) { this.speed = this.speed === 1 ? 3 : 1; playSnd('sel'); } 

        if(keysDown.left) { this.curPal = (this.curPal - 1 + this.pals.length) % this.pals.length; playSnd('sel'); }
        if(keysDown.right) { this.curPal = (this.curPal + 1) % this.pals.length; playSnd('sel'); }

        if(pointer.active || keys.a) {
            // ★ 解像度400x240に合わせた座標計算！
            let px = Math.floor(pointer.x / this.cellSize);
            let py = Math.floor((pointer.y - 30) / this.cellSize); 
            
            if(!pointer.active && keys.a) { px = Math.floor(this.W/2); py = Math.floor(this.H/2); }

            if(px >= 0 && px < this.W && py >= 0 && py < this.H) {
                let pItem = this.pals[this.curPal];
                if(pItem.type === 'M') { 
                    this.setGrid(px, py, pItem.id);
                } else if(pItem.type === 'E') { 
                    if(this.frame % 5 === 0) {
                        this.entities.push({ type: pItem.id, x: px, y: py, hp: 200, chatTimer: 0 });
                        playSnd('jmp');
                    }
                }
            }
        }

        for(let s=0; s<this.speed; s++) {
            this.simStep();
        }

        for(let i=this.logs.length-1; i>=0; i--) {
            this.logs[i].life--;
            if(this.logs[i].life <= 0) this.logs.splice(i, 1);
        }
    },

    draw() {
        // ★ 背景 400x240！
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 400, 240);

        // 1. シミュレーション領域 (Y: 30 ~ 210)
        ctx.save();
        ctx.translate(0, 30);
        
        const cols = {0:null, 1:'#0af', 2:'#fd8', 3:'#853', 4:'#2c2', 5:'#161', 6:'#f40', 7:'#999'};
        for(let x=0; x<this.W; x++){
            for(let y=0; y<this.H; y++){
                let id = this.grid[x][y];
                if(id !== 0) {
                    ctx.fillStyle = cols[id];
                    ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    if(id === 6) { ctx.fillStyle = '#ff0'; ctx.fillRect(x * this.cellSize + 1, y * this.cellSize + 1, 2, 2); }
                }
            }
        }

        for(let e of this.entities) {
            let px = e.x * this.cellSize; let py = e.y * this.cellSize;
            if(e.type === 10) { 
                ctx.fillStyle = '#fff'; ctx.fillRect(px, py, 4, 4);
                ctx.fillStyle = '#fbb'; ctx.fillRect(px, py-2, 1, 2); ctx.fillRect(px+3, py-2, 1, 2);
            } else if (e.type === 11) { 
                ctx.fillStyle = '#666'; ctx.fillRect(px-1, py-1, 6, 5);
                ctx.fillStyle = '#f00'; ctx.fillRect(px, py, 1, 1); 
            } else if (e.type === 12) { 
                ctx.fillStyle = '#fcc'; ctx.fillRect(px+1, py-2, 2, 2); 
                ctx.fillStyle = '#00f'; ctx.fillRect(px, py, 4, 4);     
                
                if(e.chatTimer > 0) {
                    ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
                    ctx.fillText(e.chatMsg, px - 8, py - 4);
                }
            }
        }
        ctx.restore();

        // 2. ログ領域 (Y: 0 ~ 30) 幅400
        ctx.fillStyle = 'rgba(0, 10, 0, 0.8)'; ctx.fillRect(0, 0, 400, 30);
        ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,30); ctx.lineTo(400,30); ctx.stroke();
        ctx.fillStyle = '#0f0'; ctx.font = '12px monospace';
        for(let i=0; i<this.logs.length; i++) {
            ctx.globalAlpha = Math.min(1.0, this.logs[i].life / 20);
            ctx.fillText(this.logs[i].text, 10, 12 + i * 14);
        }
        ctx.globalAlpha = 1.0;

        // 3. UI・パレット領域 (Y: 210 ~ 240) 幅400
        ctx.fillStyle = '#111'; ctx.fillRect(0, 210, 400, 30);
        ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(0,210); ctx.lineTo(400,210); ctx.stroke();
        
        ctx.fillStyle = '#fff'; ctx.font = '14px monospace';
        let pName = this.pals[this.curPal].name;
        ctx.fillText(`◀ [ ${pName} ] ▶`, 15, 230);
        
        if(this.speed > 1) {
            ctx.fillStyle = '#ff0'; ctx.fillText('>> SPEED x3', 150, 230);
        } else {
            ctx.fillStyle = '#aaa'; ctx.fillText('SPEED x1 (B)', 150, 230);
        }
        
        ctx.fillStyle = '#666'; ctx.font = '12px monospace'; 
        ctx.fillText('A/TAP:配置   SEL:全消去', 260, 230);
    }
};
