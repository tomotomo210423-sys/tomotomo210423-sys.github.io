// === PIXEL BIOTOPE - AI EVOLUTION (Instinct & Balance Edition) ===
// 人類に「本能(初期Q値)」を与え、ウサギの繁殖速度など生態系バランスを調整！

const Biotope = {
    grid: [], entities: [], logs: [], 
    W: 50, H: 60, cellSize: 4, 
    frame: 0, speed: 1,
    
    pals: [
        {id: 3, type:'M', name: '🪨土(整地)', col: '#853'},
        {id: 1, type:'M', name: '💧水(海)', col: '#0af'},
        {id: 2, type:'M', name: '⏳砂', col: '#fd8'},
        {id: 4, type:'M', name: '🌿草', col: '#2c2'},
        {id: 5, type:'M', name: '🌲木', col: '#161'},
        {id: 6, type:'M', name: '🌋炎/マグマ', col: '#f40'},
        {id: 7, type:'M', name: '🧱石(山)', col: '#999'},
        {id: 10, type:'E', name: '🐇兎', col: '#fff', tick: 4}, 
        {id: 11, type:'E', name: '🐺狼', col: '#444', tick: 3},
        {id: 12, type:'E', name: '🧍人', col: '#fcc', tick: 5}
    ],
    curPal: 0,
    Q: [], 
    
    init() {
        this.grid = []; this.entities = []; this.logs = [];
        this.frame = 0; this.speed = 1;
        for(let x=0; x<this.W; x++) {
            this.grid[x] = [];
            for(let y=0; y<this.H; y++) this.grid[x][y] = 1; 
        }
        
        this.generateWorld();

        // ★ 人類の脳（Qテーブル）の初期化と「本能(DNA)」の注入
        this.Q = Array(8).fill(0).map(() => Array(12).fill(0));
        this.injectInstincts();
        
        this.addLog("WORLD GENERATED. ECOSYSTEM BALANCED.");
        this.addLog("人類は「本能」に目覚めました。");
        BGM.play('menu');
    },

    // 🧬 人類に最低限の基礎知識（本能）をセットする
    injectInstincts() {
        // 状態: (threat << 2) | (res << 1) | friend
        for (let s = 0; s < 8; s++) {
            let threat = (s & 4) !== 0;
            let res = (s & 2) !== 0;
            let friend = (s & 1) !== 0;

            // アクション対応表
            // 0:IDLE, 1:WANDER, 2:ESCAPE, 3:GATHER, 4:APPROACH, 5:BUILD
            // 6:DESTROY, 7:ATTACK, 8:PLANT, 9:IGNITE, 10:COMMUNICATE, 11:REPRODUCE

            if (threat) {
                this.Q[s][2] += 30;  // 脅威があれば「逃げる」のは本能！
                this.Q[s][7] += 5;   // 勇敢な奴は「戦う」
                this.Q[s][5] += 5;   // 「壁(家)を作る」のも生存本能
            }
            if (res) {
                this.Q[s][3] += 20;  // 飯(資源)があれば「採集」する
            }
            if (friend) {
                this.Q[s][4] += 10;  // 仲間に寄り添う
                this.Q[s][10] += 15; // 「会話」して知識を共有する
            }
            // 火遊びは危険だと最初から教えておく
            this.Q[s][9] -= 20; 
        }
    },

    generateWorld() {
        for(let i=0; i<12; i++) {
            let cx = 5 + Math.floor(Math.random() * (this.W - 10));
            let cy = 5 + Math.floor(Math.random() * (this.H - 10));
            let rad = 6 + Math.random() * 8;
            this.drawBlob(cx, cy, rad, 3); 
        }

        let newGrid = JSON.parse(JSON.stringify(this.grid));
        for(let x=1; x<this.W-1; x++) {
            for(let y=1; y<this.H-1; y++) {
                let landCount = 0;
                for(let dx=-1; dx<=1; dx++) for(let dy=-1; dy<=1; dy++) if(this.grid[x+dx][y+dy] === 3) landCount++;
                if(landCount >= 5) newGrid[x][y] = 3;
                else if(landCount <= 3) newGrid[x][y] = 1;
            }
        }
        this.grid = newGrid;

        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                if(this.grid[x][y] === 3) {
                    let isCoast = false;
                    for(let dx=-1; dx<=1; dx++) {
                        for(let dy=-1; dy<=1; dy++) {
                            if(this.getGrid(x+dx, y+dy) === 1) isCoast = true;
                        }
                    }
                    if(isCoast) {
                        this.grid[x][y] = 2; 
                    } else {
                        let r = Math.random();
                        if(r < 0.05) this.grid[x][y] = 7;      
                        else if(r < 0.25) this.grid[x][y] = 5;  
                        else if(r < 0.8) this.grid[x][y] = 4;  
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
        if(this.logs.length > 4) this.logs.shift();
    },

    getGrid(x, y) { if(x<0||x>=this.W||y<0||y>=this.H) return 1; return this.grid[x][y]; },
    setGrid(x, y, v) { if(x>=0&&x<this.W&&y>=0&&y<this.H) this.grid[x][y] = v; },

    simPhysicalSteps() {
        let updates = []; 
        for(let x=0; x<this.W; x++) {
            for(let y=0; y<this.H; y++) {
                let id = this.grid[x][y];
                if(id === 1 || id === 7 || id === 2) continue; 

                let neighbors = [[x,y-1], [x,y+1], [x-1,y], [x+1,y]];

                if(id === 6) { 
                    for(let [nx, ny] of neighbors) {
                        let n = this.getGrid(nx, ny);
                        if(n === 1) updates.push({x, y, v: 7}); 
                        if((n === 4 || n === 5) && Math.random() < 0.2) updates.push({x: nx, y: ny, v: 6}); 
                    }
                    if(Math.random() < 0.3) updates.push({x, y, v: 3}); 
                }
                
                if((id === 4 || id === 5) && Math.random() < 0.002) { 
                    let [nx, ny] = neighbors[Math.floor(Math.random()*4)];
                    if(this.getGrid(nx, ny) === 3) updates.push({x: nx, y: ny, v: id});
                }
            }
        }
        for(let u of updates) this.setGrid(u.x, u.y, u.v);
    },

    simStep() {
        this.frame++;
        if(this.frame % 10 === 0) this.simPhysicalSteps(); 

        for(let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            
            if(this.frame % e.tick !== 0) continue;

            e.hp--; 
            if(e.chatTimer > 0) e.chatTimer--;

            if(e.hp <= 0 || this.getGrid(e.x, e.y) === 6) {
                if(e.type === 12 && this.getGrid(e.x, e.y) === 6 && e.lastState !== undefined) {
                    this.Q[e.lastState][e.lastAction] -= 100; // マグマ死の強烈なペナルティ
                    if(Math.random() < 0.3) this.addLog("☠️ 人間が炎に焼かれた！");
                }
                this.entities.splice(i, 1);
                continue;
            }

            // --- ウサギ (大増殖を制限) ---
            if(e.type === 10) { 
                let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
                let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
                let nextGrid = this.getGrid(e.x+dx, e.y+dy);
                if(nextGrid !== 1 && nextGrid !== 7 && nextGrid !== 6) { e.x += dx; e.y += dy; } 
                
                if(this.getGrid(e.x, e.y) === 4) {
                    if(Math.random() < 0.3) this.setGrid(e.x, e.y, 3); // 確実に草を消費する確率アップ
                    e.hp += 40; 
                    // ★ 繁殖に必要なHPを激増させ、増殖スピードをマイルドに
                    if(e.hp > 400) { 
                        e.hp = 200; 
                        this.entities.push({type:10, x:e.x, y:e.y, hp:200, tick:4, chatTimer:0}); 
                    }
                }
            } 
            // --- オオカミ ---
            else if (e.type === 11) { 
                let target = this.entities.find(t => (t.type===10 || t.type===12) && Math.abs(t.x-e.x)<8 && Math.abs(t.y-e.y)<8);
                if(target) {
                    let dx = target.x > e.x ? 1 : (target.x < e.x ? -1 : 0);
                    let dy = target.y > e.y ? 1 : (target.y < e.y ? -1 : 0);
                    let nextGrid = this.getGrid(e.x+dx, e.y+dy);
                    if(nextGrid !== 1 && nextGrid !== 7 && nextGrid !== 6) { e.x += dx; e.y += dy; }

                    if(Math.abs(target.x - e.x) <= 1 && Math.abs(target.y - e.y) <= 1) {
                        target.hp -= 200; e.hp += 150;
                        if(target.type === 12) this.addLog("🐺 オオカミが人間を襲った");
                        if(e.hp > 350) { e.hp = 150; this.entities.push({type:11, x:e.x, y:e.y, hp:150, tick:3, chatTimer:0}); }
                    }
                } else if(Math.random() < 0.4) {
                    let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
                    let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
                    let n = this.getGrid(e.x+dx, e.y+dy);
                    if(n !== 1 && n !== 6) { e.x += dx; e.y += dy; }
                }
            }
            // --- 人間 ---
            else if (e.type === 12) { 
                this.humanAI(e);
            }
            
            e.x = Math.max(0, Math.min(this.W-1, e.x));
            e.y = Math.max(0, Math.min(this.H-1, e.y));
        }
    },

    // 🧠 12のアクションを持つ人類のガチAI
    humanAI(e) {
        let threatX = e.x, threatY = e.y, resX = e.x, resY = e.y, friendX = e.x, friendY = e.y;
        let threat = 0, res = 0, friend = 0;

        for(let t of this.entities) {
            if(t === e) continue;
            let dist = Math.abs(t.x - e.x) + Math.abs(t.y - e.y);
            if(dist < 8) {
                if(t.type === 11) { threat = 1; threatX = t.x; threatY = t.y; } 
                if(t.type === 12) { friend = 1; friendX = t.x; friendY = t.y; } 
                if(t.type === 10) { res = 1; resX = t.x; resY = t.y; }       
            }
        }
        for(let dx=-3; dx<=3; dx++){
            for(let dy=-3; dy<=3; dy++){
                let v = this.getGrid(e.x+dx, e.y+dy);
                if(v === 6) { threat = 1; threatX = e.x+dx; threatY = e.y+dy; } 
                if(v === 5 || v === 4) { res = 1; resX = e.x+dx; resY = e.y+dy; } 
            }
        }

        let state = (threat << 2) | (res << 1) | friend;
        
        if (e.lastState !== undefined) {
            let reward = -0.1; // 基礎生存コスト
            if (e.hp > e.lastHp) reward += 5; // 回復はプラス
            if (e.hp < e.lastHp) reward -= 15; // ダメージはマイナス
            let maxQ = Math.max(...this.Q[state]);
            this.Q[e.lastState][e.lastAction] += 0.2 * (reward + 0.9 * maxQ - this.Q[e.lastState][e.lastAction]);
        }

        let action = 0;
        if(Math.random() < 0.15) action = Math.floor(Math.random() * 12);
        else {
            let maxVal = -9999;
            for(let a=0; a<12; a++) if(this.Q[state][a] > maxVal) { maxVal = this.Q[state][a]; action = a; }
        }
        e.lastState = state; e.lastAction = action; e.lastHp = e.hp;

        let moveTowards = (tx, ty, isEscape) => {
            let dx = tx > e.x ? 1 : (tx < e.x ? -1 : 0);
            let dy = ty > e.y ? 1 : (ty < e.y ? -1 : 0);
            if(isEscape) { dx *= -1; dy *= -1; }
            if(Math.random()<0.5 && dx !== 0) dy = 0; else if(dy !== 0) dx = 0; 
            let n = this.getGrid(e.x+dx, e.y+dy);
            if(n !== 1 && n !== 7 && n !== 6) { e.x += dx; e.y += dy; } 
        };

        if(action === 0) { // 0: IDLE
            e.hp += 2; 
        } 
        else if(action === 1) { // 1: WANDER
            let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
            let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
            let n = this.getGrid(e.x+dx, e.y+dy);
            if(n !== 1 && n !== 6) { e.x += dx; e.y += dy; }
        } 
        else if(action === 2 && threat) { // 2: ESCAPE
            moveTowards(threatX, threatY, true);
        } 
        else if(action === 3 && res) { // 3: GATHER
            moveTowards(resX, resY, false);
            let foot = this.getGrid(e.x, e.y);
            if(foot === 4 || foot === 5) {
                this.setGrid(e.x, e.y, 3); e.hp += 100; // 人類は一気に回復
            }
        } 
        else if(action === 4 && friend) { // 4: APPROACH FRIEND
            moveTowards(friendX, friendY, false);
        }
        else if(action === 5) { // 5: BUILD
            let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
            let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
            let tg = this.getGrid(e.x+dx, e.y+dy);
            if(tg === 3 || tg === 2 || tg === 4) { 
                this.setGrid(e.x+dx, e.y+dy, 7); 
                this.Q[state][action] += 2; 
            }
        } 
        else if(action === 6) { // 6: DESTROY
            let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
            let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
            let tg = this.getGrid(e.x+dx, e.y+dy);
            if(tg === 7 || tg === 5) { 
                this.setGrid(e.x+dx, e.y+dy, 3); 
                this.Q[state][action] += 1;
            }
        }
        else if(action === 7 && threat) { // 7: ATTACK
            let target = this.entities.find(t => t.type === 11 && Math.abs(t.x-e.x)<=2 && Math.abs(t.y-e.y)<=2);
            if(target) { 
                target.hp -= 150; this.Q[state][action] += 15; 
                if(target.hp <= 0) this.addLog("⚔️ 人類が脅威を排除した！"); 
            }
        } 
        else if(action === 8) { // 8: PLANT
            let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
            let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
            if(this.getGrid(e.x+dx, e.y+dy) === 3) { 
                this.setGrid(e.x+dx, e.y+dy, 4); 
                this.Q[state][action] += 3;
            }
        }
        else if(action === 9) { // 9: IGNITE
            let dx = Math.random() < 0.5 ? (Math.random()<0.5?-1:1) : 0;
            let dy = dx === 0 ? (Math.random()<0.5?-1:1) : 0;
            let tg = this.getGrid(e.x+dx, e.y+dy);
            if(tg === 4 || tg === 5) { 
                this.setGrid(e.x+dx, e.y+dy, 6); 
                this.Q[state][action] -= 5; 
                if(Math.random() < 0.05) this.addLog("🔥 人間が森に火を放った！");
            }
        }
        else if(action === 10 && friend) { // 10: COMMUNICATE
            e.chatTimer = 40;
            e.chatMsg = ["・ー・", "ーー", "・・", "ー・", "SOS"][Math.floor(Math.random()*5)];
            let count = 0;
            for(let t of this.entities) {
                if(t !== e && t.type === 12 && Math.abs(t.x-e.x)<10 && Math.abs(t.y-e.y)<10) {
                    for(let s=0; s<8; s++) for(let a=0; a<12; a++) this.Q[s][a] += (this.Q[s][a] - this.Q[s][a]) * 0.15;
                    t.chatTimer = 20; t.chatMsg = "！"; count++;
                }
            }
            if(count > 0 && Math.random() < 0.03) this.addLog(`💬 知識の伝達(${count}人)`);
        }
        else if(action === 11) { // 11: REPRODUCE
            if(e.hp > 300) { // 十分に栄養があるときのみ
                e.hp -= 150;
                this.entities.push({type:12, x:e.x, y:e.y, hp:200, tick:5, chatTimer:0}); 
                this.addLog("👶 人類が新たな命を育んだ");
                this.Q[state][action] += 10; // 繁殖成功は最高の報酬
            } else {
                this.Q[state][action] -= 5; 
            }
        }
    },

    update() {
        if(keysDown.select) { this.init(); playSnd('hit'); screenShake(10); return; } 
        if(keysDown.b) { this.speed = this.speed === 1 ? 3 : 1; playSnd('sel'); } 

        if(keysDown.left) { this.curPal = (this.curPal - 1 + this.pals.length) % this.pals.length; playSnd('sel'); }
        if(keysDown.right) { this.curPal = (this.curPal + 1) % this.pals.length; playSnd('sel'); }

        if(pointer.active || keys.a) {
            let px = Math.floor(pointer.x / this.cellSize);
            let py = Math.floor((pointer.y - 30) / this.cellSize); 
            if(!pointer.active && keys.a) { px = Math.floor(this.W/2); py = Math.floor(this.H/2); }

            if(px >= 0 && px < this.W && py >= 0 && py < this.H) {
                let pItem = this.pals[this.curPal];
                if(pItem.type === 'M') { 
                    this.setGrid(px, py, pItem.id);
                } else if(pItem.type === 'E' && this.frame % 5 === 0) {
                    this.entities.push({ type: pItem.id, x: px, y: py, hp: 200, tick: pItem.tick, chatTimer: 0 });
                    playSnd('jmp');
                }
            }
        }

        for(let s=0; s<this.speed; s++) this.simStep();

        for(let i=this.logs.length-1; i>=0; i--) {
            this.logs[i].life--;
            if(this.logs[i].life <= 0) this.logs.splice(i, 1);
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
        ctx.save(); ctx.translate(0, 30);
        
        const cols = {0:null, 1:'#05a', 2:'#fd8', 3:'#853', 4:'#2a2', 5:'#151', 6:'#f40', 7:'#666'};
        for(let x=0; x<this.W; x++){
            for(let y=0; y<this.H; y++){
                let id = this.grid[x][y];
                if(id !== 0) { 
                    ctx.fillStyle = cols[id]; 
                    ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize); 
                    
                    if(id === 1 && Math.random()<0.05) { ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(x*this.cellSize+1, y*this.cellSize+1, 2, 1); } 
                    if(id === 4 && (x+y)%2===0) { ctx.fillStyle='#3c3'; ctx.fillRect(x*this.cellSize+1, y*this.cellSize+1, 2, 2); } 
                    if(id === 5) { ctx.fillStyle='#030'; ctx.fillRect(x*this.cellSize+1, y*this.cellSize+1, 2, 2); } 
                }
            }
        }
        
        for(let e of this.entities) {
            let px = e.x * this.cellSize; let py = e.y * this.cellSize;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(px, py+2, 4, 3);

            if(e.type === 10) { 
                ctx.fillStyle = '#fff'; ctx.fillRect(px, py, 4, 4);
                ctx.fillStyle = '#fbb'; ctx.fillRect(px+1, py+1, 1, 1);
            } else if (e.type === 11) { 
                ctx.fillStyle = '#444'; ctx.fillRect(px-1, py-1, 6, 5);
                ctx.fillStyle = '#f00'; ctx.fillRect(px, py, 1, 1); ctx.fillRect(px+2, py, 1, 1);
            } else if (e.type === 12) { 
                ctx.fillStyle = '#fcc'; ctx.fillRect(px+1, py-1, 2, 2); 
                ctx.fillStyle = '#00f'; ctx.fillRect(px, py+1, 4, 3);     
                
                if(e.chatTimer > 0) {
                    ctx.fillStyle = '#ff0'; ctx.font = '8px monospace'; ctx.fillText(e.chatMsg, px - 6, py - 4);
                }
            }
        }
        ctx.restore();

        ctx.fillStyle = 'rgba(0, 15, 0, 0.8)'; ctx.fillRect(0, 0, 200, 30);
        ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(0,30); ctx.lineTo(200,30); ctx.stroke();
        ctx.fillStyle = '#0f0'; ctx.font = 'bold 9px monospace';
        for(let i=0; i<this.logs.length; i++) { 
            ctx.globalAlpha = Math.min(1.0, this.logs[i].life / 20); 
            ctx.fillText(this.logs[i].text, 5, 10 + i * 10); 
        }
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = '#111'; ctx.fillRect(0, 270, 200, 30);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`◀ [ ${this.pals[this.curPal].name} ] ▶`, 10, 288);
        ctx.fillStyle = (this.speed>1)?'#ff0':'#aaa'; ctx.fillText('>> SPEED x3 (B)', 110, 288);
    }
};
