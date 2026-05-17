// === PIXEL BIOTOPE v2.0 — Balanced Ecosystem + Q-Learning Fix ===

const Biotope = {
    st: 'title', // title / play
    grid: [], entities: [], logs: [],
    W: 50, H: 60, cellSize: 4,
    frame: 0, speed: 1, paused: false,
    epsilon: 0.3, // exploration rate (decays over time)

    pals: [
        {id:3,  type:'M',   name:'土(整地)',  col:'#853'},
        {id:1,  type:'M',   name:'水(海)',    col:'#0af'},
        {id:2,  type:'M',   name:'砂',       col:'#fd8'},
        {id:4,  type:'M',   name:'草',       col:'#2c2'},
        {id:5,  type:'M',   name:'木',       col:'#161'},
        {id:6,  type:'M',   name:'炎/マグマ', col:'#f40'},
        {id:7,  type:'M',   name:'石(山)',   col:'#999'},
        {id:10, type:'E',   name:'草食(兎)', col:'#fff', tick:4},
        {id:11, type:'E',   name:'捕食(狼)', col:'#444', tick:6},
        {id:12, type:'E',   name:'人間',     col:'#fcc', tick:5},
        {id:13, type:'SYS', name:'全消去',   col:'#f00'}
    ],
    curPal: 0,
    Q: [],
    wasPointerActive: false,
    particles: [], // death particles

    // Population caps
    MAX_HERB: 25, MAX_WOLF: 8, MAX_HUMAN: 12,

    // Lifespans (ticks before aging death)
    LIFESPAN: { 10: 600, 11: 500, 12: 800 },

    init() {
        document.getElementById('gameboy').classList.remove('mode-abyss');
        canvas.width = 200; canvas.height = 300;
        this.st = 'title';
        this.frame = 0; this.speed = 1; this.paused = false;
        this.epsilon = 0.3;
        this.particles = [];
        this.wasPointerActive = false;
        if (typeof BGM !== 'undefined') BGM.play('puzzle');
    },

    startSim() {
        this.grid = []; this.entities = []; this.logs = [];
        this.frame = 0; this.epsilon = 0.3; this.particles = [];
        for (let x = 0; x < this.W; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.H; y++) this.grid[x][y] = 1;
        }
        this.generateWorld();
        this.Q = Array(8).fill(0).map(() => Array(12).fill(0));
        this.injectInstincts();
        // Spawn initial population
        for (let i = 0; i < 8; i++) this.spawnEntity(10);
        for (let i = 0; i < 3; i++) this.spawnEntity(11);
        for (let i = 0; i < 2; i++) this.spawnEntity(12);
        this.addLog('WORLD GENERATED.', '#0ff');
        this.st = 'play';
    },

    spawnEntity(type) {
        for (let tries = 0; tries < 30; tries++) {
            let x = Math.floor(Math.random() * this.W);
            let y = Math.floor(Math.random() * this.H);
            let g = this.getGrid(x, y);
            if (g === 4 || g === 3) {
                this.entities.push({
                    type, x, y, hp: 200,
                    tick: this.pals.find(p => p.id === type).tick,
                    age: 0, chatTimer: 0, chatMsg: ''
                });
                return;
            }
        }
    },

    injectInstincts() {
        for (let s = 0; s < 8; s++) {
            let threat = (s & 4) !== 0, res = (s & 2) !== 0, friend = (s & 1) !== 0;
            if (threat) { this.Q[s][2] += 30; this.Q[s][7] += 5; this.Q[s][5] += 5; }
            if (res)    { this.Q[s][3] += 20; }
            if (friend) { this.Q[s][4] += 10; this.Q[s][10] += 15; }
            this.Q[s][9] -= 20;
        }
    },

    generateWorld() {
        for (let i = 0; i < 12; i++) {
            let cx = 5 + Math.floor(Math.random() * (this.W - 10));
            let cy = 5 + Math.floor(Math.random() * (this.H - 10));
            this.drawBlob(cx, cy, 6 + Math.random() * 8, 3);
        }
        // Cellular automata smoothing
        let ng = this.grid.map(col => [...col]);
        for (let x = 1; x < this.W-1; x++) for (let y = 1; y < this.H-1; y++) {
            let lc = 0;
            for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++) if (this.grid[x+dx][y+dy] === 3) lc++;
            ng[x][y] = lc >= 5 ? 3 : (lc <= 3 ? 1 : this.grid[x][y]);
        }
        this.grid = ng;
        // Assign terrain types
        for (let x = 0; x < this.W; x++) for (let y = 0; y < this.H; y++) {
            if (this.grid[x][y] === 3) {
                let coast = false;
                for (let dx=-1; dx<=1; dx++) for (let dy=-1; dy<=1; dy++) if (this.getGrid(x+dx,y+dy)===1) coast = true;
                if (coast) { this.grid[x][y] = 2; }
                else {
                    let r = Math.random();
                    if (r < 0.05) this.grid[x][y] = 7;
                    else if (r < 0.25) this.grid[x][y] = 5;
                    else if (r < 0.80) this.grid[x][y] = 4;
                }
            }
        }
    },

    drawBlob(cx, cy, rad, id) {
        for (let x = Math.floor(cx-rad); x <= Math.ceil(cx+rad); x++)
            for (let y = Math.floor(cy-rad); y <= Math.ceil(cy+rad); y++)
                if (x>=0&&x<this.W&&y>=0&&y<this.H&&Math.hypot(x-cx,y-cy)<rad) this.grid[x][y] = id;
    },

    addLog(msg, col='#0f0') {
        this.logs.push({ text: msg, life: 200, col });
        if (this.logs.length > 4) this.logs.shift();
    },

    getGrid(x, y) { return (x<0||x>=this.W||y<0||y>=this.H) ? 1 : this.grid[x][y]; },
    setGrid(x, y, v) { if (x>=0&&x<this.W&&y>=0&&y<this.H) this.grid[x][y] = v; },

    countType(t) { return this.entities.filter(e => e.type === t).length; },

    addParticle(x, y, col) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                x: x * this.cellSize + 2, y: y * this.cellSize + 30 + 2,
                vx: (Math.random()-0.5)*2, vy: -Math.random()*2-0.5,
                col, life: 20+Math.floor(Math.random()*20)
            });
        }
    },

    simPhysicalSteps() {
        let updates = [];
        for (let x = 0; x < this.W; x++) for (let y = 0; y < this.H; y++) {
            let id = this.grid[x][y];
            if (id === 1 || id === 7 || id === 2) continue;
            let nb = [[x,y-1],[x,y+1],[x-1,y],[x+1,y]];
            if (id === 6) {
                for (let [nx,ny] of nb) {
                    let n = this.getGrid(nx,ny);
                    if (n === 1) updates.push({x,y,v:7});
                    if ((n===4||n===5) && Math.random()<0.15) updates.push({x:nx,y:ny,v:6});
                }
                if (Math.random()<0.25) updates.push({x,y,v:3});
            }
            // Grass/tree spread (faster: 8% chance)
            if ((id===4||id===5) && Math.random()<0.08) {
                let [nx,ny] = nb[Math.floor(Math.random()*4)];
                if (this.getGrid(nx,ny)===3) updates.push({x:nx,y:ny,v:id});
            }
        }
        for (let u of updates) this.setGrid(u.x, u.y, u.v);
    },

    simStep() {
        this.frame++;
        this.epsilon = Math.max(0.05, this.epsilon * 0.9999); // decay exploration
        if (this.frame % 10 === 0) this.simPhysicalSteps();

        for (let i = this.entities.length-1; i >= 0; i--) {
            let e = this.entities[i];
            if (this.frame % e.tick !== 0) continue;
            e.hp--; e.age++;
            if (e.chatTimer > 0) e.chatTimer--;

            let lifespan = this.LIFESPAN[e.type] || 600;
            let dead = e.hp <= 0 || this.getGrid(e.x, e.y) === 6 || e.age > lifespan;

            if (dead) {
                if (e.type===12&&this.getGrid(e.x,e.y)===6&&e.lastState!==undefined)
                    this.Q[e.lastState][e.lastAction] -= 100;
                let col = e.type===10?'#fff':e.type===11?'#888':'#faa';
                this.addParticle(e.x, e.y, col);
                this.entities.splice(i, 1);
                continue;
            }

            if (e.type === 10) this.herbivoreAI(e);
            else if (e.type === 11) this.wolfAI(e);
            else if (e.type === 12) this.humanAI(e);

            e.x = Math.max(0, Math.min(this.W-1, e.x));
            e.y = Math.max(0, Math.min(this.H-1, e.y));
        }
    },

    herbivoreAI(e) {
        let dx = Math.random()<0.5?(Math.random()<0.5?-1:1):0;
        let dy = dx===0?(Math.random()<0.5?-1:1):0;
        let ng = this.getGrid(e.x+dx, e.y+dy);
        if (ng!==1&&ng!==7&&ng!==6) { e.x+=dx; e.y+=dy; }
        if (this.getGrid(e.x,e.y)===4) {
            if (Math.random()<0.3) this.setGrid(e.x,e.y,3);
            e.hp += 40;
            // Reproduce if under cap
            if (e.hp > 400 && this.countType(10) < this.MAX_HERB) {
                e.hp = 200;
                this.entities.push({type:10,x:e.x,y:e.y,hp:200,tick:4,age:0,chatTimer:0,chatMsg:''});
            }
        }
    },

    wolfAI(e) {
        let target = this.entities.find(t=>(t.type===10||t.type===12)&&Math.abs(t.x-e.x)<6&&Math.abs(t.y-e.y)<6);
        if (target) {
            let dx = target.x>e.x?1:(target.x<e.x?-1:0);
            let dy = target.y>e.y?1:(target.y<e.y?-1:0);
            let ng = this.getGrid(e.x+dx,e.y+dy);
            if (ng!==1&&ng!==7&&ng!==6) { e.x+=dx; e.y+=dy; }
            if (Math.abs(target.x-e.x)<=1&&Math.abs(target.y-e.y)<=1) {
                target.hp -= 200; e.hp += 80;
                if (target.type===12) this.addLog('狼が人間を襲った', '#f84');
                // Reproduce if under cap
                if (e.hp > 500 && this.countType(11) < this.MAX_WOLF) {
                    e.hp = 200;
                    this.entities.push({type:11,x:e.x,y:e.y,hp:200,tick:6,age:0,chatTimer:0,chatMsg:''});
                }
            }
        } else if (Math.random()<0.3) {
            let dx=Math.random()<0.5?(Math.random()<0.5?-1:1):0;
            let dy=dx===0?(Math.random()<0.5?-1:1):0;
            let ng=this.getGrid(e.x+dx,e.y+dy);
            if (ng!==1&&ng!==6) { e.x+=dx; e.y+=dy; }
        }
    },

    humanAI(e) {
        let threatX=e.x,threatY=e.y,resX=e.x,resY=e.y,friendX=e.x,friendY=e.y;
        let threat=0,res=0,friend=0;
        for (let t of this.entities) {
            if (t===e) continue;
            let dist=Math.abs(t.x-e.x)+Math.abs(t.y-e.y);
            if (dist<8) {
                if (t.type===11){threat=1;threatX=t.x;threatY=t.y;}
                if (t.type===12){friend=1;friendX=t.x;friendY=t.y;}
                if (t.type===10){res=1;resX=t.x;resY=t.y;}
            }
        }
        for (let dx=-3;dx<=3;dx++) for(let dy=-3;dy<=3;dy++){
            let v=this.getGrid(e.x+dx,e.y+dy);
            if(v===6){threat=1;threatX=e.x+dx;threatY=e.y+dy;}
            if(v===5||v===4){res=1;resX=e.x+dx;resY=e.y+dy;}
        }
        let state=(threat<<2)|(res<<1)|friend;
        if (e.lastState!==undefined){
            let reward=-0.1;
            if(e.hp>e.lastHp) reward+=5;
            if(e.hp<e.lastHp) reward-=15;
            let maxQ=Math.max(...this.Q[state]);
            // Proper Q-learning: discount factor 0.9
            this.Q[e.lastState][e.lastAction]+=0.2*(reward+0.9*maxQ-this.Q[e.lastState][e.lastAction]);
        }
        let action=0;
        // Epsilon-greedy exploration (decays over time)
        if (Math.random()<this.epsilon) { action=Math.floor(Math.random()*12); }
        else {
            let maxVal=-9999;
            for(let a=0;a<12;a++) if(this.Q[state][a]>maxVal){maxVal=this.Q[state][a];action=a;}
        }
        e.lastState=state; e.lastAction=action; e.lastHp=e.hp;

        let moveTowards=(tx,ty,escape)=>{
            let dx=tx>e.x?1:(tx<e.x?-1:0),dy=ty>e.y?1:(ty<e.y?-1:0);
            if(escape){dx*=-1;dy*=-1;}
            if(Math.random()<0.5&&dx!==0)dy=0;else if(dy!==0)dx=0;
            let ng=this.getGrid(e.x+dx,e.y+dy);
            if(ng!==1&&ng!==7&&ng!==6){e.x+=dx;e.y+=dy;}
        };

        if(action===0){e.hp+=5;}
        else if(action===1){let dx=Math.random()<0.5?(Math.random()<0.5?-1:1):0,dy=dx===0?(Math.random()<0.5?-1:1):0;let ng=this.getGrid(e.x+dx,e.y+dy);if(ng!==1&&ng!==6){e.x+=dx;e.y+=dy;}}
        else if(action===2&&threat){moveTowards(threatX,threatY,true);}
        else if(action===3&&res){moveTowards(resX,resY,false);let ft=this.getGrid(e.x,e.y);if(ft===4||ft===5){this.setGrid(e.x,e.y,3);e.hp+=150;}}
        else if(action===4&&friend){moveTowards(friendX,friendY,false);}
        else if(action===5){let dx=Math.random()<0.5?(Math.random()<0.5?-1:1):0,dy=dx===0?(Math.random()<0.5?-1:1):0;let tg=this.getGrid(e.x+dx,e.y+dy);if(tg===3||tg===2||tg===4){this.setGrid(e.x+dx,e.y+dy,7);this.Q[state][action]+=2;}}
        else if(action===6){let dx=Math.random()<0.5?(Math.random()<0.5?-1:1):0,dy=dx===0?(Math.random()<0.5?-1:1):0;let tg=this.getGrid(e.x+dx,e.y+dy);if(tg===7||tg===5){this.setGrid(e.x+dx,e.y+dy,3);this.Q[state][action]+=1;}}
        else if(action===7&&threat){let tgt=this.entities.find(t=>t.type===11&&Math.abs(t.x-e.x)<=2&&Math.abs(t.y-e.y)<=2);if(tgt){tgt.hp-=150;this.Q[state][action]+=15;if(tgt.hp<=0)this.addLog('人類が脅威を排除！','#0ff');}}
        else if(action===8){let dx=Math.random()<0.5?(Math.random()<0.5?-1:1):0,dy=dx===0?(Math.random()<0.5?-1:1):0;if(this.getGrid(e.x+dx,e.y+dy)===3){this.setGrid(e.x+dx,e.y+dy,4);this.Q[state][action]+=3;}}
        else if(action===9){let dx=Math.random()<0.5?(Math.random()<0.5?-1:1):0,dy=dx===0?(Math.random()<0.5?-1:1):0;let tg=this.getGrid(e.x+dx,e.y+dy);if(tg===4||tg===5){this.setGrid(e.x+dx,e.y+dy,6);this.Q[state][action]-=5;if(Math.random()<0.05)this.addLog('人間が火を放った！','#f40');}}
        else if(action===10&&friend){
            e.chatTimer=40;e.chatMsg=["SOS","！","知","??"][Math.floor(Math.random()*4)];
            let cnt=0;
            for(let t of this.entities){
                if(t!==e&&t.type===12&&Math.abs(t.x-e.x)<10&&Math.abs(t.y-e.y)<10){
                    // Share Q-values (knowledge propagation)
                    for(let s=0;s<8;s++) for(let a=0;a<12;a++) t.Q_personal?t.Q_personal[s][a]=this.Q[s][a]:null;
                    t.chatTimer=20;t.chatMsg="！";cnt++;
                }
            }
            if(cnt>0&&Math.random()<0.05)this.addLog(`知識の伝達(${cnt}人)`,'#ff0');
        }
        else if(action===11){
            if(e.hp>300&&this.countType(12)<this.MAX_HUMAN){
                e.hp-=150;
                this.entities.push({type:12,x:e.x,y:e.y,hp:200,tick:5,age:0,chatTimer:0,chatMsg:''});
                this.addLog('人類が新たな命を育んだ','#f0f');
                this.Q[state][action]+=10;
            } else { this.Q[state][action]-=5; }
        }
    },

    update() {
        if (keysDown.select) { if (typeof BGM !== 'undefined') BGM.stop(); switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.a) { this.startSim(); playSnd('jmp'); }
            return;
        }

        // Play state
        if (keysDown.b) { this.paused = !this.paused; playSnd('sel'); }
        if (keysDown.left)  { this.curPal=(this.curPal-1+this.pals.length)%this.pals.length; playSnd('sel'); }
        if (keysDown.right) { this.curPal=(this.curPal+1)%this.pals.length; playSnd('sel'); }

        // Pointer/touch input
        let pointerDown = pointer.active && !this.wasPointerActive;
        this.wasPointerActive = pointer.active;
        if ((pointer.active||keys.a) && !this.paused) {
            let px=Math.floor(pointer.x/this.cellSize);
            let py=Math.floor((pointer.y-30)/this.cellSize);
            if (!pointer.active&&keys.a){px=Math.floor(this.W/2);py=Math.floor(this.H/2);}
            let pItem=this.pals[this.curPal];
            if (pItem.type==='SYS'&&(pointerDown||keysDown.a)){if(pItem.id===13){this.startSim();playSnd('hit');screenShake(10);return;}}
            else if (px>=0&&px<this.W&&py>=0&&py<this.H){
                if(pItem.type==='M'){this.setGrid(px,py,pItem.id);}
                else if(pItem.type==='E'&&this.frame%5===0){
                    let cap=pItem.id===10?this.MAX_HERB:pItem.id===11?this.MAX_WOLF:this.MAX_HUMAN;
                    if(this.countType(pItem.id)<cap){
                        this.entities.push({type:pItem.id,x:px,y:py,hp:200,tick:pItem.tick,age:0,chatTimer:0,chatMsg:''});
                        playSnd('jmp');
                    }
                }
            }
        }

        if (!this.paused) {
            let steps = this.speed === 1 ? 1 : 3;
            for (let s = 0; s < steps; s++) this.simStep();
        }

        // Update particles
        for (let i = this.particles.length-1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        for (let i = this.logs.length-1; i >= 0; i--) {
            this.logs[i].life--;
            if (this.logs[i].life <= 0) this.logs.splice(i, 1);
        }
    },

    drawTerrain() {
        const COLS = {1:'#05a',2:'#fd8',3:'#853',4:'#2a2',5:'#151',6:'#f40',7:'#666'};
        // Slight noise per tile for texture
        for (let x=0; x<this.W; x++) for (let y=0; y<this.H; y++) {
            let id=this.grid[x][y];
            if (!id||!COLS[id]) continue;
            ctx.fillStyle=COLS[id];
            ctx.fillRect(x*this.cellSize, y*this.cellSize, this.cellSize, this.cellSize);
            // Texture details
            if (id===1&&(x*31+y*17)%7===0){ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(x*this.cellSize+1,y*this.cellSize+1,2,1);}
            if (id===4&&(x+y)%2===0){ctx.fillStyle='#3c3';ctx.fillRect(x*this.cellSize+1,y*this.cellSize+1,2,2);}
            if (id===5){ctx.fillStyle='#030';ctx.fillRect(x*this.cellSize+1,y*this.cellSize+1,2,2);}
            if (id===6&&this.frame%4<2){ctx.fillStyle='#ff4';ctx.fillRect(x*this.cellSize+1,y*this.cellSize+1,2,1);}
            if (id===7){ctx.fillStyle='rgba(255,255,255,0.1)';ctx.fillRect(x*this.cellSize,y*this.cellSize,2,1);}
        }
    },

    drawEntity(e) {
        let px=e.x*this.cellSize, py=e.y*this.cellSize;
        ctx.fillStyle='rgba(0,0,0,0.4)';
        ctx.fillRect(px-1,py+2,6,3);
        if (e.type===10) {
            // Herbivore: white body + pink ears
            ctx.fillStyle='#eee'; ctx.fillRect(px,py,4,4);
            ctx.fillStyle='#faa'; ctx.fillRect(px,py-1,1,2); ctx.fillRect(px+3,py-1,1,2); // ears
            ctx.fillStyle='#000'; ctx.fillRect(px+1,py+1,1,1); ctx.fillRect(px+3,py+1,1,1); // eyes
        } else if (e.type===11) {
            // Wolf: grey angular silhouette + red eyes
            ctx.fillStyle='#555'; ctx.fillRect(px-1,py-1,7,5);
            ctx.fillStyle='#333'; ctx.fillRect(px+1,py-2,2,2); ctx.fillRect(px+4,py-2,2,2); // ears
            ctx.fillStyle='#f00'; ctx.fillRect(px,py,1,1); ctx.fillRect(px+3,py,1,1); // eyes
        } else if (e.type===12) {
            // Human: triangle head + blue body
            ctx.fillStyle='#fcc'; ctx.fillRect(px+1,py-2,2,3); // head
            ctx.fillStyle='#35f'; ctx.fillRect(px,py+1,4,3);   // body
            ctx.fillStyle='#fcc'; ctx.fillRect(px,py+4,1,2); ctx.fillRect(px+3,py+4,1,2); // legs
            if (e.chatTimer>0) {
                ctx.fillStyle='rgba(255,255,0,0.9)';ctx.fillRect(px-8,py-10,18,8);
                ctx.fillStyle='#000';ctx.font='7px monospace';ctx.fillText(e.chatMsg,px-6,py-4);
            }
        }
    },

    draw() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300);

        if (this.st === 'title') {
            // Animated background: floating eco particles
            let t = this.frame * 0.03;
            let colors = ['#2a2','#05a','#444','#fcc','#f40'];
            for (let i = 0; i < 20; i++) {
                let x = ((Math.sin(t*0.7+i*1.3)*60+100)+200)%200;
                let y = ((Math.cos(t*0.5+i*0.9)*80+150)+300)%300;
                ctx.fillStyle = colors[i%5];
                ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
            }
            // Title
            ctx.textAlign='center';
            ctx.fillStyle='#0f0'; ctx.font='bold 9px "Press Start 2P",monospace';
            ctx.shadowBlur=14; ctx.shadowColor='#0f0';
            ctx.fillText('PIXEL',100,80);
            ctx.fillStyle='#4f8'; ctx.shadowColor='#4f8';
            ctx.fillText('BIOTOPE',100,100);
            ctx.shadowBlur=0;
            ctx.fillStyle='#888'; ctx.font='8px monospace';
            ctx.fillText('生態系AIシミュレーター',100,120);
            ctx.fillStyle='#0ff'; ctx.font='7px monospace';
            ctx.fillText('草食×25  捕食×8  人間×12',100,148);
            ctx.fillText('Q-Learningで人間が進化する',100,160);
            ctx.fillText('←→:パレット  B:ポーズ',100,172);
            if (Math.floor(Date.now()/400)%2===0){
                ctx.fillStyle='#0f0'; ctx.font='bold 10px "Press Start 2P",monospace';
                ctx.fillText('[A]START',100,220);
            }
            ctx.textAlign='left';
            this.frame++;
            return;
        }

        // Play state
        ctx.save(); ctx.translate(0,30);
        this.drawTerrain();
        for (let e of this.entities) this.drawEntity(e);

        // Death particles
        for (let p of this.particles) {
            ctx.globalAlpha=p.life/40;
            ctx.fillStyle=p.col;
            ctx.beginPath(); ctx.arc(p.x-0,p.y-30,2,0,Math.PI*2); ctx.fill();
        }
        ctx.globalAlpha=1;
        ctx.restore();

        // Top HUD
        ctx.fillStyle='rgba(0,10,0,0.88)'; ctx.fillRect(0,0,200,30);
        ctx.strokeStyle='#0a0'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(0,30); ctx.lineTo(200,30); ctx.stroke();

        // Population bars
        let herbC=this.countType(10), wolfC=this.countType(11), humC=this.countType(12);
        ctx.fillStyle='#0a0'; ctx.font='7px monospace';
        ctx.fillText(`🐇${herbC}/${this.MAX_HERB}`,3,10);
        ctx.fillStyle='#060'; ctx.fillRect(3,11,60*(herbC/this.MAX_HERB),3);
        ctx.fillStyle='#f44'; ctx.font='7px monospace';
        ctx.fillText(`🐺${wolfC}/${this.MAX_WOLF}`,68,10);
        ctx.fillStyle='#600'; ctx.fillRect(68,11,40*(wolfC/this.MAX_WOLF),3);
        ctx.fillStyle='#aaf'; ctx.font='7px monospace';
        ctx.fillText(`👤${humC}/${this.MAX_HUMAN}`,118,10);
        ctx.fillStyle='#008'; ctx.fillRect(118,11,50*(humC/this.MAX_HUMAN),3);
        // Speed indicator
        ctx.fillStyle=this.paused?'#f44':'#888'; ctx.font='7px monospace';
        ctx.fillText(this.paused?'PAUSE':'SPD x'+(this.speed===1?1:3),158,10);

        // Logs
        for (let i=0;i<this.logs.length;i++){
            ctx.globalAlpha=Math.min(1,this.logs[i].life/30);
            ctx.fillStyle=this.logs[i].col;
            ctx.font='7px monospace';
            ctx.fillText(this.logs[i].text,3,22+i*8);
        }
        ctx.globalAlpha=1;

        // Bottom palette bar
        ctx.fillStyle='rgba(0,10,0,0.85)'; ctx.fillRect(0,270,200,30);
        let pItem=this.pals[this.curPal];
        ctx.fillStyle=pItem.type==='SYS'?'#f44':'#0f0';
        ctx.font='9px monospace';
        ctx.fillText(`◀ [ ${pItem.name} ] ▶`,8,285);
        ctx.fillStyle='#333'; ctx.font='7px monospace';
        ctx.fillText('B:停止/再開  SEL:メニュー',8,297);
    }
};
