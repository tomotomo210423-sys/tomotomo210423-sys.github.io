// === PIXEL BIOTOPE - AI EVOLUTION (Reinforcement Learning & Ecosystem) ===
// 強化学習AI搭載の人間、モールス信号による知識共有、生態系シミュレーション

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
    
    // 人類共有のQテーブル (8状態 × 6行動)
    Q: [], 
    
    init() {
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
        this.logs.push({ text: msg, life: 180 });
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
                if(id === 0 || id === 7) continue; // 空白と石は動かない

                // 重力で落ちる粉体（砂、土）
                if(id === 2 || id === 3) {
                    let b = this.getGrid(x, y+1);
                    if(b === 0 || b === 1) { this.setGrid(x, y+1, id); this.setGrid(x, y, b); continue; }
                    let dir = Math.random() < 0.5 ? -1 : 1;
                    b = this.getGrid(x+dir, y+1);
                    if(b === 0 || b === 1) { this.setGrid(x+dir, y+1, id); this.setGrid(x, y, b); continue; }
                }
                // 流体（水、マグマ）
                else if(id === 1 || id === 6) {
                    if(this.getGrid(x, y+1) === 0) { this.setGrid(x, y+1, id); this.setGrid(x, y, 0); continue; }
                    let dir = Math.random() < 0.5 ? -1 : 1;
                    if(this.getGrid(x+dir, y) === 0) { this.setGrid(x+dir, y, id); this.setGrid(x, y, 0); continue; }
                    
                    // マグマ(6)の破壊効果（水に触れると石になる、草木を燃やす）
                    if(id === 6) {
                        let neighbors = [[x,y+1],[x,y-1],[x+1,y],[x-1,y]];
                        for(let [nx, ny] of neighbors) {
                            let n = this.getGrid(nx, ny);
                            if(n === 1) { this.setGrid(x, y, 7); this.setGrid(nx, ny, 0); break; } // 水と反応して石化
                            if(n === 4 || n === 5) { this.setGrid(nx, ny, 6); } // 燃え広がる
                        }
                    }
                    // 水(1)の生命効果（土の上に草を生やす）
                    if(id === 1 && Math.random() < 0.05) {
                        if(this.getGrid(x, y+1) === 3 && this.getGrid(x, y-1) === 0) this.setGrid(x, y-1, 4);
                    }
                }
                // 植物の成長（草、木）
                else if(id === 4 && Math.random() < 0.01) {
                    if(this.getGrid(x, y-1) === 0) this.setGrid(x, y-1, 5); // 木に成長
                }
            }
        }

        // 2. エンティティ（生物）の行動
        for(let i = this.entities.length - 1; i >= 0; i--) {
            let e = this.entities[i];
            e.hp--; // お腹が減る
            if(e.chatTimer > 0) e.chatTimer--;

            if(e.hp <= 0 || this.getGrid(e.x, e.y) === 6) {
                // マグマや寿命で死亡
                if(e.type === 12 && this.getGrid(e.x, e.y) === 6 && e.lastState !== undefined) {
                    // 人間がマグマで死んだ場合、AIに強烈な罰を与え、種族全体に恐怖を刻み込む
                    this.Q[e.lastState][e.lastAction] -= 50; 
                    this.addLog("☠️ 人間がマグマに飲まれた！");
                }
                this.entities.splice(i, 1);
                continue;
            }

            // 重力
            if(this.getGrid(e.x, e.y+1) === 0 || this.getGrid(e.x, e.y+1) === 1) {
                e.y++; continue; // 落下中は行動できない
            }

            // --- 生物のAI行動 ---
            if(e.type === 10) { // ウサギ: 草(4)を探して食う
                let dx = Math.random() < 0.5 ? -1 : 1;
                if(this.getGrid(e.x+dx, e.y) === 0) e.x += dx;
                if(this.getGrid(e.x, e.y) === 4 || this.getGrid(e.x, e.y+1) === 4) {
                    this.setGrid(e.x, e.y, 0); this.setGrid(e.x, e.y+1, 3); // 食い尽くす
                    e.hp += 50;
                    if(e.hp > 200) { e.hp = 100; this.entities.push({type:10, x:e.x, y:e.y-1, hp:100, chatTimer:0}); } // 繁殖
                }
            } 
            else if (e.type === 11) { // オオカミ: 人間かウサギを食う
                let target = this.entities.find(t => (t.type===10 || t.type===12) && Math.abs(t.x-e.x)<10 && Math.abs(t.y-e.y)<5);
                if(target) {
                    e.x += (target.x > e.x ? 1 : -1);
                    if(Math.abs(target.x - e.x) <= 1 && Math.abs(target.y - e.y) <= 1) {
                        target.hp -= 200; e.hp += 100; // 捕食
                        if(target.type === 12) this.addLog("🐺 オオカミが人間を捕食した");
                        if(e.hp > 300) { e.hp = 100; this.entities.push({type:11, x:e.x, y:e.y-1, hp:150, chatTimer:0}); }
                    }
                } else {
                    if(Math.random() < 0.3) e.x += (Math.random() < 0.5 ? -1 : 1);
                }
            }
            else if (e.type === 12) { // ★ 人間（ガチ強化学習AI）
                this.humanAI(e);
            }
            
            // 画面外脱出防止
            e.x = Math.max(0, Math.min(this.W-1, e.x));
            e.y = Math.max(0, Math.min(this.H-1, e.y));
        }
    },

    // 🧠 人類の強化学習AIエンジン
    humanAI(e) {
        // 【状態認識】周囲3マスをスキャン
        let threatX = 0, resX = 0, friendX = 0;
        let threat = 0, res = 0, friend = 0;

        for(let t of this.entities) {
            if(t === e) continue;
            let dist = Math.abs(t.x - e.x) + Math.abs(t.y - e.y);
            if(dist < 5) {
                if(t.type === 11) { threat = 1; threatX = t.x; } // 狼
                if(t.type === 12) { friend = 1; friendX = t.x; } // 仲間
                if(t.type === 10) { res = 1; resX = t.x; }       // 兎(食料)
            }
        }
        // マグマや木も認識
        for(let dx=-3; dx<=3; dx++){
            for(let dy=-3; dy<=3; dy++){
                let v = this.getGrid(e.x+dx, e.y+dy);
                if(v === 6) { threat = 1; threatX = e.x+dx; } // マグマ
                if(v === 5 || v === 4) { res = 1; resX = e.x+dx; } // 木・草
            }
        }

        // 状態ID (0〜7) の生成
        let state = (threat << 2) | (res << 1) | friend;
        
        // 前回の行動に対する報酬の評価と学習（Q値の更新）
        if (e.lastState !== undefined) {
            let reward = -0.1; // 生存コスト
            if (e.hp > e.lastHp) reward += 5; // 飯を食えた
            if (e.hp < e.lastHp) reward -= 10; // ダメージを受けた
            
            let maxQ = Math.max(...this.Q[state]);
            this.Q[e.lastState][e.lastAction] += 0.2 * (reward + 0.9 * maxQ - this.Q[e.lastState][e.lastAction]);
        }

        // 次の行動の決定 (ε-greedy法: たまにランダム行動で探索)
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

        // 行動の実行
        if(action === 0) { // RAND: ウロウロ
            if(Math.random() < 0.5 && this.getGrid(e.x+(Math.random()<0.5?1:-1), e.y) === 0) e.x += (Math.random()<0.5?1:-1);
        } 
        else if(action === 1 && threat) { // ESCAPE: 脅威から逃げる
            e.x += (e.x > threatX ? 1 : -1);
        } 
        else if(action === 2 && res) { // APPROACH: 資源に近づく
            e.x += (e.x < resX ? 1 : -1);
            // 木(5)や草(4)があれば食べて回復＆増殖
            let foot = this.getGrid(e.x, e.y); let head = this.getGrid(e.x, e.y-1);
            if(foot === 4 || foot === 5 || head === 4 || head === 5) {
                this.setGrid(e.x, e.y, 0); this.setGrid(e.x, e.y-1, 0);
                e.hp += 100;
                if(e.hp > 300) { e.hp = 150; this.entities.push({type:12, x:e.x, y:e.y-1, hp:150, chatTimer:0}); this.addLog("🧍 人類が繁殖した！"); }
            }
        } 
        else if(action === 3) { // BUILD: 壁（石）を置く（建築）
            let dx = Math.random() < 0.5 ? -1 : 1;
            if(this.getGrid(e.x+dx, e.y) === 0) {
                this.setGrid(e.x+dx, e.y, 7); // 石を置く
                this.Q[state][action] += 1; // 建築は本能的に少し気持ちいい
            }
        } 
        else if(action === 4 && threat) { // ATTACK: 攻撃
            let target = this.entities.find(t => t.type===11 && Math.abs(t.x-e.x)<=2 && Math.abs(t.y-e.y)<=2);
            if(target) {
                target.hp -= 100; 
                this.Q[state][action] += 5; // 敵を撃退すると快感
                if(target.hp <= 0) this.addLog("⚔️ 人類がオオカミを討伐した！");
            }
        } 
        else if(action === 5 && friend) { // 💬 COMMUNICATE: モールス信号で知識共有！
            e.chatTimer = 30;
            e.chatMsg = ["・ー・", "ーー・", "・・・", "ー・ー"][Math.floor(Math.random()*4)];
            // 周囲の仲間のQ値を、自分のQ値に少し近づける（文化・技術の伝達）
            let count = 0;
            for(let t of this.entities) {
                if(t !== e && t.type === 12 && Math.abs(t.x-e.x)<8 && Math.abs(t.y-e.y)<8) {
                    for(let s=0; s<8; s++) {
                        for(let a=0; a<6; a++) {
                            this.Q[s][a] += (this.Q[s][a] - this.Q[s][a]) * 0.1; // 集合知の平均化
                        }
                    }
                    t.chatTimer = 15; t.chatMsg = "！"; count++;
                }
            }
            if(count > 0 && Math.random() < 0.05) this.addLog(`💬 人間が知識を共有した(${count}人)`);
        }
    },

    update() {
        // 操作処理
        if(keysDown.select) { this.init(); playSnd('hit'); screenShake(10); return; } // 神の怒り（全リセット）
        if(keysDown.b) { this.speed = this.speed === 1 ? 3 : 1; playSnd('sel'); } // 倍速切り替え

        // パレット切り替え
        if(keysDown.left) { this.curPal = (this.curPal - 1 + this.pals.length) % this.pals.length; playSnd('sel'); }
        if(keysDown.right) { this.curPal = (this.curPal + 1) % this.pals.length; playSnd('sel'); }

        // 配置（画面タップ または Aボタン押しっぱなし）
        if(pointer.active || keys.a) {
            let px = Math.floor(pointer.x / this.cellSize);
            let py = Math.floor((pointer.y - 30) / this.cellSize); // 上部30pxはログ領域
            
            // 仮想十字キーからの配置（画面中央付近にドロップ）
            if(!pointer.active && keys.a) { px = Math.floor(this.W/2); py = Math.floor(this.H/2); }

            if(px >= 0 && px < this.W && py >= 0 && py < this.H) {
                let pItem = this.pals[this.curPal];
                if(pItem.type === 'M') { // 物質
                    this.setGrid(px, py, pItem.id);
                } else if(pItem.type === 'E') { // 生物（連打防止）
                    if(this.frame % 5 === 0) {
                        this.entities.push({ type: pItem.id, x: px, y: py, hp: 200, chatTimer: 0 });
                        playSnd('jmp');
                    }
                }
            }
        }

        // シミュレーション実行（倍速対応）
        for(let s=0; s<this.speed; s++) {
            this.simStep();
        }

        // ログの寿命処理
        for(let i=this.logs.length-1; i>=0; i--) {
            this.logs[i].life--;
            if(this.logs[i].life <= 0) this.logs.splice(i, 1);
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        // 1. シミュレーション領域の描画 (Y: 30 ~ 270)
        ctx.save();
        ctx.translate(0, 30);
        
        // 物質の描画
        const cols = {0:null, 1:'#08f', 2:'#fd8', 3:'#853', 4:'#2c2', 5:'#531', 6:'#f40', 7:'#888'};
        for(let x=0; x<this.W; x++){
            for(let y=0; y<this.H; y++){
                let id = this.grid[x][y];
                if(id !== 0) {
                    ctx.fillStyle = cols[id];
                    ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
                    // マグマは光る
                    if(id === 6) { ctx.fillStyle = '#ff0'; ctx.fillRect(x * this.cellSize + 1, y * this.cellSize + 1, 2, 2); }
                }
            }
        }

        // 生物の描画
        for(let e of this.entities) {
            let px = e.x * this.cellSize; let py = e.y * this.cellSize;
            if(e.type === 10) { // ウサギ
                ctx.fillStyle = '#fff'; ctx.fillRect(px, py, 4, 4);
                ctx.fillStyle = '#fbb'; ctx.fillRect(px, py-2, 1, 2); ctx.fillRect(px+3, py-2, 1, 2);
            } else if (e.type === 11) { // オオカミ
                ctx.fillStyle = '#666'; ctx.fillRect(px-1, py-1, 6, 5);
                ctx.fillStyle = '#f00'; ctx.fillRect(px, py, 1, 1); // 赤い目
            } else if (e.type === 12) { // 人間
                ctx.fillStyle = '#fcc'; ctx.fillRect(px+1, py-2, 2, 2); // 頭
                ctx.fillStyle = '#00f'; ctx.fillRect(px, py, 4, 4);     // 体
                
                // 💬 モールス会話エフェクトの描画
                if(e.chatTimer > 0) {
                    ctx.fillStyle = '#ff0'; ctx.font = '8px monospace';
                    ctx.fillText(e.chatMsg, px - 6, py - 4);
                }
            }
        }
        ctx.restore();

        // 2. ログ領域の描画 (Y: 0 ~ 30)
        ctx.fillStyle = 'rgba(0, 10, 0, 0.8)'; ctx.fillRect(0, 0, 200, 30);
        ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0,30); ctx.lineTo(200,30); ctx.stroke();
        ctx.fillStyle = '#0f0'; ctx.font = '9px monospace';
        for(let i=0; i<this.logs.length; i++) {
            ctx.globalAlpha = Math.min(1.0, this.logs[i].life / 20);
            ctx.fillText(this.logs[i].text, 5, 10 + i * 10);
        }
        ctx.globalAlpha = 1.0;

        // 3. UI・パレット領域の描画 (Y: 270 ~ 300)
        ctx.fillStyle = '#111'; ctx.fillRect(0, 270, 200, 30);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        
        let pName = this.pals[this.curPal].name;
        ctx.fillText(`◀ [ ${pName} ] ▶`, 10, 288);
        
        // 倍速表示
        if(this.speed > 1) {
            ctx.fillStyle = '#ff0'; ctx.fillText('>> SPEED x3', 120, 288);
        } else {
            ctx.fillStyle = '#aaa'; ctx.fillText('SPEED x1 (B)', 120, 288);
        }
        
        ctx.fillStyle = '#666'; ctx.font = '8px monospace'; ctx.fillText('A/TAP:配置  SEL:全消去', 40, 298);
    }
};
