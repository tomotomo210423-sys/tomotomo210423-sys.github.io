// === 無限無双 REMAKE v3.0 ===

const EDB = [
    { id: 'SLIME',    col: '#4f4', hp: 10,   spd: 1.0, sz: 8,  exp: 1,   coin: 0.04 },
    { id: 'SCOUT',    col: '#f0f', hp: 8,    spd: 2.2, sz: 6,  exp: 2,   coin: 0.03 },
    { id: 'TANK',     col: '#f44', hp: 60,   spd: 0.6, sz: 14, exp: 5,   coin: 0.08 },
    { id: 'ELITE',    col: '#ff4', hp: 500,  spd: 0.8, sz: 20, exp: 30,  coin: 0.15 },
    { id: 'RANGED',   col: '#0ff', hp: 20,   spd: 0.5, sz: 9,  exp: 4,   coin: 0.05 },
    { id: 'SPLITTER', col: '#f84', hp: 30,   spd: 0.9, sz: 11, exp: 6,   coin: 0.06 },
    { id: 'BOSS',     col: '#f00', hp: 2000, spd: 0.5, sz: 28, exp: 200, coin: 0.5  }
];

const Musou = {
    st: 'title',
    menuCur: 0,
    timer: 0,
    level: 1,
    exp: 0,
    maxExp: 10,
    kills: 0,
    phase: 0,
    bossActive: false,
    bossWarning: 0,

    p: { x:0, y:0, hp:100, maxHp:100, vx:0, vy:0, spd:3, magnet:40, atkMult:1.0, facing:1 },
    cam: { x:0, y:0 },

    enemies: [],
    bullets: [],
    enemyBullets: [],
    vfx: [],
    texts: [],
    items: [],
    choices: [],
    grid: {},
    maxEnemies: 300,

    saveData: { coins:0, maxKills:0, upg:{ atk:0, hp:0, mag:0, spd:0 } },

    shopData: {
        atk: { name:'攻撃力UP',   cost:50, val:0.1, max:20, desc:'全ダメージ+10%' },
        hp:  { name:'最大HPUP',   cost:50, val:20,  max:20, desc:'初期HP+20' },
        mag: { name:'吸引範囲UP', cost:50, val:15,  max:15, desc:'ジェムを遠くから吸う' },
        spd: { name:'移動速度UP', cost:50, val:0.2, max:10, desc:'足が速くなる' }
    },

    skills: {},
    skillDefs: {
        blade: { name:'回転剣',       maxLv:5, desc:'周囲を回る剣で敵を切り裂く' },
        magic: { name:'魔法弾',       maxLv:5, desc:'敵を自動追尾する弾を放つ' },
        laser: { name:'貫通ビーム',   maxLv:5, desc:'ランダムな敵へ貫通レーザー' },
        aura:  { name:'ダメージ円',   maxLv:5, desc:'近づく敵を自動で燃やす' },
        bomb:  { name:'ランダム爆撃', maxLv:5, desc:'敵の足元を定期的に爆破する' },
        haste: { name:'韋駄天',       maxLv:5, desc:'自身の移動速度がアップ(パッシブ)' },
        regen: { name:'自己再生',     maxLv:5, desc:'定期的にHPが少し回復(パッシブ)' },
        hole:  { name:'ブラックホール',maxLv:5, desc:'敵を吸い寄せて継続ダメージ' }
    },

    formatNum(n) {
        if (n < 1000) return Math.floor(n).toString();
        const s = ['','K','M','B'];
        const i = Math.floor(Math.log10(n) / 3);
        return (n / Math.pow(1000, i)).toFixed(1) + s[i];
    },

    loadSave() {
        try {
            let d = localStorage.getItem('musou_save_v1');
            if (d) this.saveData = JSON.parse(d);
            if (!this.saveData.upg) this.saveData.upg = { atk:0, hp:0, mag:0, spd:0 };
        } catch(e) {}
    },

    save() {
        try { localStorage.setItem('musou_save_v1', JSON.stringify(this.saveData)); } catch(e) {}
    },

    init() {
        this.loadSave();
        this.st = 'title';
        this.menuCur = 0;
        this.resetGame();
        if (typeof BGM !== 'undefined') BGM.play('menu');
    },

    resetGame() {
        this.timer = 0; this.level = 1; this.exp = 0; this.maxExp = 10;
        this.kills = 0; this.phase = 0; this.bossActive = false; this.bossWarning = 0;
        let u = this.saveData.upg;
        this.p = {
            x:0, y:0,
            maxHp: 100 + u.hp * 20,
            hp:    100 + u.hp * 20,
            vx:0, vy:0,
            spd:   2.5 + u.spd * 0.2,
            magnet:40  + u.mag * 15,
            atkMult: 1.0 + u.atk * 0.1,
            facing: 1
        };
        this.cam = { x:-100, y:-150 };
        this.enemies = []; this.bullets = []; this.enemyBullets = [];
        this.vfx = []; this.texts = []; this.items = [];
        this.skills = {
            blade: { lv:1, dmg:10, count:1, spd:0.1, range:45 },
            magic: { lv:0, dmg:15, cd:60,  timer:0, count:1 },
            laser: { lv:0, dmg:20, cd:120, timer:0, width:2 },
            aura:  { lv:0, dmg:3,  range:60 },
            bomb:  { lv:0, dmg:50, cd:150, timer:0, radius:50 },
            haste: { lv:0 },
            regen: { lv:0, timer:0 },
            hole:  { lv:0, dmg:2,  range:80, cd:300, timer:0 }
        };
    },

    addVFX(type, x, y, color, extra={}) {
        this.vfx.push({ type, x, y, color,
            life: extra.life||20, maxLife: extra.life||20,
            size: extra.size||10, angle: extra.angle||0,
            vx: extra.vx||0, vy: extra.vy||0 });
    },

    addText(x, y, text, color, life=30) {
        this.texts.push({ x, y, text, color, life, maxLife:life });
    },

    pickEnemyType() {
        let wt = [{ t:0, w:40 }];
        if (this.phase > 2)  wt.push({ t:1, w:20 });
        if (this.phase > 4)  wt.push({ t:2, w:10 });
        if (this.phase > 8)  wt.push({ t:3, w:2  });
        if (this.phase > 3)  wt.push({ t:4, w:15 });
        if (this.phase > 5)  wt.push({ t:5, w:8  });
        let total = wt.reduce((s,e) => s+e.w, 0);
        let r = Math.random() * total;
        for (let w of wt) { r -= w.w; if (r <= 0) return w.t; }
        return 0;
    },

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies || this.bossActive) return;
        let angle = Math.random() * Math.PI * 2;
        let dist  = 250 + Math.random() * 50;
        let ex = this.p.x + Math.cos(angle) * dist;
        let ey = this.p.y + Math.sin(angle) * dist;
        let hpM = Math.pow(1.15, this.phase);
        let expM = 1 + this.phase * 0.2;
        let ti = this.pickEnemyType();
        let tpl = EDB[ti];
        this.enemies.push({
            x:ex, y:ey, vx:0, vy:0,
            hp: tpl.hp * hpM, maxHp: tpl.hp * hpM,
            spd: tpl.spd, size: tpl.sz,
            exp: tpl.exp * expM, color: tpl.col,
            id: tpl.id, hitTimer:0,
            shotCd: ti===4 ? 90 : 0,
            splitDone: false, isBoss: false
        });
    },

    spawnBoss() {
        this.bossActive = true;
        let angle = Math.random() * Math.PI * 2;
        let tpl = EDB[6];
        let hpM = Math.pow(1.5, Math.floor(this.phase / 10));
        this.enemies.push({
            x: this.p.x + Math.cos(angle)*300,
            y: this.p.y + Math.sin(angle)*300,
            vx:0, vy:0,
            hp: tpl.hp * hpM, maxHp: tpl.hp * hpM,
            spd: tpl.spd, size: tpl.sz,
            exp: tpl.exp * hpM, color: tpl.col,
            id:'BOSS', hitTimer:0, shotCd:60, splitDone:false, isBoss:true
        });
        if (typeof BGM !== 'undefined') BGM.play('boss');
        if (typeof screenShake !== 'undefined') screenShake(15);
        if (typeof playSnd !== 'undefined') playSnd('combo');
    },

    dropItem(x, y, expVal, coinChance) {
        if (Math.random() < coinChance) {
            this.items.push({ type:'coin', x, y, val:1, state:'idle' });
        } else {
            let col = expVal>=30?'#f00': expVal>=10?'#ff0': expVal>=5?'#f84':'#0ff';
            let sz  = expVal>=30?7: expVal>=10?5: expVal>=5?4:3;
            this.items.push({ type:'gem', x, y, val:expVal, color:col, size:sz, state:'idle' });
        }
    },

    getNearestEnemy() {
        let minD=9999, tgt=null;
        for (let e of this.enemies) {
            if (e.hp<=0) continue;
            let d = Math.hypot(e.x-this.p.x, e.y-this.p.y);
            if (d < minD) { minD=d; tgt=e; }
        }
        return tgt;
    },

    updateGrid() {
        this.grid = {};
        const sz = 50;
        for (let e of this.enemies) {
            if (e.hp<=0) continue;
            let k = `${Math.floor(e.x/sz)},${Math.floor(e.y/sz)}`;
            if (!this.grid[k]) this.grid[k]=[];
            this.grid[k].push(e);
        }
    },

    checkHitRadius(cx, cy, radius, dmg, source='') {
        const sz=50, gx=Math.floor(cx/sz), gy=Math.floor(cy/sz), rng=Math.ceil(radius/sz);
        for (let x=gx-rng; x<=gx+rng; x++) {
            for (let y=gy-rng; y<=gy+rng; y++) {
                let cell = this.grid[`${x},${y}`];
                if (!cell) continue;
                for (let e of cell) {
                    if (source==='blade' && e.hitTimer>0) continue;
                    if (Math.hypot(e.x-cx, e.y-cy) < radius+e.size) {
                        this.damageEnemy(e, dmg);
                        if (source==='blade') e.hitTimer=10;
                    }
                }
            }
        }
    },

    damageEnemy(e, dmg) {
        if (e.hp<=0) return;
        let isCrit = Math.random()<0.1;
        let fd = Math.floor(isCrit ? dmg*3 : dmg);
        e.hp -= fd;
        this.addText(e.x+(Math.random()-0.5)*8, e.y-10, this.formatNum(fd), isCrit?'#f44':'#fff');
        if (isCrit) this.addVFX('hit', e.x, e.y, '#f44', { size:15 });

        if (e.hp<=0) {
            this.kills++;
            let tpl = EDB.find(t=>t.id===e.id)||EDB[0];
            this.dropItem(e.x, e.y, e.exp, tpl.coin);
            this.addVFX('explosion', e.x, e.y, e.color, { size:e.size*2 });

            if (e.id==='SPLITTER' && !e.splitDone) {
                for (let k=0; k<2; k++) {
                    let a = Math.random()*Math.PI*2;
                    this.enemies.push({
                        x:e.x+Math.cos(a)*15, y:e.y+Math.sin(a)*15, vx:0, vy:0,
                        hp:e.maxHp*0.3, maxHp:e.maxHp*0.3, spd:e.spd*1.5, size:e.size*0.65,
                        exp:e.exp*0.3, color:'#fa4', id:'SLIME',
                        hitTimer:0, shotCd:0, splitDone:true, isBoss:false
                    });
                }
            }
            if (e.isBoss) {
                this.bossActive = false;
                if (typeof BGM !== 'undefined') BGM.play('musou');
                if (typeof screenShake !== 'undefined') screenShake(20);
                if (typeof playSnd !== 'undefined') playSnd('combo');
                for (let k=0; k<10; k++) {
                    let a=Math.random()*Math.PI*2;
                    this.items.push({ type:'coin', x:e.x+Math.cos(a)*25, y:e.y+Math.sin(a)*25, val:5, state:'idle' });
                }
            }
            if (Math.random()<0.02) {
                this.p.hp = Math.min(this.p.maxHp, this.p.hp+5);
                this.addVFX('particle', this.p.x, this.p.y, '#0f0', { size:8 });
            }
        }
    },

    generateChoices() {
        this.choices = [];
        let pool = Object.keys(this.skills).filter(k=>this.skills[k].lv<this.skillDefs[k].maxLv);
        for (let i=pool.length-1; i>0; i--) {
            let j=Math.floor(Math.random()*(i+1));
            [pool[i],pool[j]]=[pool[j],pool[i]];
        }
        for (let i=0; i<Math.min(3,pool.length); i++) {
            let key=pool[i], nlv=this.skills[key].lv+1;
            this.choices.push({ key, name:this.skillDefs[key].name,
                tag: nlv===1?'NEW!':`LV${nlv}`, desc:this.skillDefs[key].desc });
        }
        if (this.choices.length>0) {
            this.st='levelup'; this.menuCur=0;
            if (typeof playSnd!=='undefined') playSnd('combo');
        } else {
            this.p.hp=this.p.maxHp; this.saveData.coins+=50;
            this.addText(this.p.x, this.p.y-30, 'ALL MAX! +50G', '#ff0', 60);
        }
    },

    applySkillUp(key) {
        let s=this.skills[key]; s.lv++;
        if (key==='blade') { s.count++; s.dmg*=1.2; s.range+=5; s.spd+=0.02; }
        if (key==='magic') { s.count++; s.dmg*=1.3; s.cd=Math.max(10,s.cd-5); }
        if (key==='laser') { s.width+=2; s.dmg*=1.5; s.cd=Math.max(30,s.cd-10); }
        if (key==='aura')  { s.range+=12; s.dmg*=1.5; }
        if (key==='bomb')  { s.radius+=15; s.dmg*=1.5; s.cd=Math.max(40,s.cd-15); }
        if (key==='haste') { this.p.spd+=0.3; }
        this.addVFX('levelUp', this.p.x, this.p.y, '#0f0', { size:100 });
        if (typeof playSnd!=='undefined') playSnd('jmp');
    },

    update() {
        if (typeof keysDown!=='undefined' && keysDown.select) {
            this.save();
            if (typeof BGM!=='undefined') BGM.stop();
            if (typeof switchApp!=='undefined') switchApp(Menu);
            return;
        }
        if (this.st==='play') this.updateGrid();

        if (this.st==='title') {
            if (typeof keysDown==='undefined') return;
            if (keysDown.left||keysDown.right) {
                this.menuCur = this.menuCur===0?1:0;
                if (typeof playSnd!=='undefined') playSnd('sel');
            }
            if (keysDown.a) {
                if (this.menuCur===0) {
                    this.resetGame(); this.st='play';
                    if (typeof BGM!=='undefined') BGM.play('musou');
                    if (typeof playSnd!=='undefined') playSnd('jmp');
                } else {
                    this.st='shop'; this.menuCur=0;
                    if (typeof playSnd!=='undefined') playSnd('sel');
                }
            }
            return;
        }

        if (this.st==='shop') {
            let sk = Object.keys(this.shopData);
            if (typeof keysDown==='undefined') return;
            if (keysDown.up)   { this.menuCur=(this.menuCur-1+sk.length)%sk.length; if (typeof playSnd!=='undefined') playSnd('sel'); }
            if (keysDown.down) { this.menuCur=(this.menuCur+1)%sk.length; if (typeof playSnd!=='undefined') playSnd('sel'); }
            if (keysDown.b)    { this.st='title'; this.menuCur=1; if (typeof playSnd!=='undefined') playSnd('hit'); }
            if (keysDown.a) {
                let key=sk[this.menuCur], item=this.shopData[key];
                if (this.saveData.upg[key]<item.max && this.saveData.coins>=item.cost) {
                    this.saveData.coins-=item.cost; this.saveData.upg[key]++; this.save();
                    if (typeof playSnd!=='undefined') playSnd('combo');
                } else { if (typeof playSnd!=='undefined') playSnd('hit'); }
            }
            return;
        }

        if (this.st==='levelup') {
            if (typeof keysDown==='undefined') return;
            if (keysDown.up)   { this.menuCur=(this.menuCur-1+this.choices.length)%this.choices.length; if (typeof playSnd!=='undefined') playSnd('sel'); }
            if (keysDown.down) { this.menuCur=(this.menuCur+1)%this.choices.length; if (typeof playSnd!=='undefined') playSnd('sel'); }
            if (keysDown.a)    { this.applySkillUp(this.choices[this.menuCur].key); this.st='play'; }
            return;
        }

        if (this.st==='over') {
            if (typeof keysDown!=='undefined' && keysDown.a) {
                this.st='title'; this.menuCur=0;
                if (typeof BGM!=='undefined') BGM.play('menu');
            }
            return;
        }

        // === PLAY LOOP ===
        this.timer++;

        if (this.timer % 1800 === 0) {
            this.phase++;
            if (this.phase % 10 === 0 && !this.bossActive) this.bossWarning = 180;
        }
        if (this.bossWarning > 0) { this.bossWarning--; if (this.bossWarning===0) this.spawnBoss(); }

        let spawnRate = Math.max(3, 20-this.phase);
        if (this.timer % spawnRate === 0) this.spawnEnemy();

        let mx=0, my=0;
        if (typeof keys!=='undefined') {
            if (keys.up)    my-=1;
            if (keys.down)  my+=1;
            if (keys.left)  mx-=1;
            if (keys.right) mx+=1;
        }
        if (mx!==0&&my!==0) { let l=Math.hypot(mx,my); mx/=l; my/=l; }
        if (mx>0) this.p.facing=1; else if (mx<0) this.p.facing=-1;
        this.p.vx += (mx*this.p.spd - this.p.vx)*0.2;
        this.p.vy += (my*this.p.spd - this.p.vy)*0.2;
        this.p.x += this.p.vx; this.p.y += this.p.vy;
        this.cam.x += (this.p.x-100-this.cam.x)*0.1;
        this.cam.y += (this.p.y-150-this.cam.y)*0.1;

        // Items
        for (let i=this.items.length-1; i>=0; i--) {
            let item=this.items[i];
            let d=Math.hypot(item.x-this.p.x, item.y-this.p.y);
            if (item.state==='idle' && d<this.p.magnet) item.state='magnet';
            if (item.state==='magnet') {
                if (d>0.1) { item.x+=(this.p.x-item.x)/d*8; item.y+=(this.p.y-item.y)/d*8; }
                if (d<10) {
                    if (item.type==='coin') {
                        this.saveData.coins+=item.val;
                        if (typeof playSnd!=='undefined') playSnd('sel');
                    } else {
                        this.exp+=item.val;
                        if (typeof playSnd!=='undefined'&&Math.random()<0.2) playSnd('sel');
                    }
                    this.items.splice(i,1);
                    if (this.exp>=this.maxExp) {
                        this.exp-=this.maxExp; this.level++;
                        this.maxExp=Math.floor(this.maxExp*1.3);
                        this.generateChoices();
                    }
                }
            }
        }

        // Skills
        let base = this.p.atkMult * Math.pow(1.1, this.level-1);
        let s = this.skills;

        if (s.regen.lv>0) {
            s.regen.timer--;
            if (s.regen.timer<=0) {
                s.regen.timer=120-s.regen.lv*10;
                this.p.hp=Math.min(this.p.maxHp, this.p.hp+s.regen.lv);
                this.addVFX('particle', this.p.x, this.p.y, '#0f0', {size:5});
            }
        }
        if (s.blade.lv>0) {
            for (let i=0; i<s.blade.count; i++) {
                let a=(this.timer*s.blade.spd)+(Math.PI*2/s.blade.count)*i;
                let bx=this.p.x+Math.cos(a)*s.blade.range, by=this.p.y+Math.sin(a)*s.blade.range;
                this.checkHitRadius(bx,by,15,s.blade.dmg*base,'blade');
                this.addVFX('slash',bx,by,'#0ff',{angle:a+Math.PI/2,size:20});
            }
        }
        if (s.magic.lv>0) {
            s.magic.timer--;
            if (s.magic.timer<=0) {
                s.magic.timer=s.magic.cd;
                for (let i=0; i<s.magic.count; i++) {
                    let tgt=this.getNearestEnemy();
                    if (tgt) {
                        let a=Math.atan2(tgt.y-this.p.y,tgt.x-this.p.x)+(Math.random()-0.5)*0.5;
                        this.bullets.push({ x:this.p.x,y:this.p.y, vx:Math.cos(a)*6,vy:Math.sin(a)*6, dmg:s.magic.dmg*base, life:60 });
                        if (typeof playSnd!=='undefined'&&Math.random()<0.3) playSnd('sel');
                    }
                }
            }
        }
        if (s.laser.lv>0) {
            s.laser.timer--;
            if (s.laser.timer<=0) {
                s.laser.timer=s.laser.cd;
                let tgt=this.getNearestEnemy();
                if (tgt) {
                    let a=Math.atan2(tgt.y-this.p.y,tgt.x-this.p.x);
                    this.addVFX('beam',this.p.x,this.p.y,'#f0f',{angle:a,size:400,life:10});
                    if (typeof playSnd!=='undefined') playSnd('hit');
                    if (typeof screenShake!=='undefined') screenShake(4);
                    for (let e of this.enemies) {
                        let ex=e.x-this.p.x, ey=e.y-this.p.y;
                        let dot=ex*Math.cos(a)+ey*Math.sin(a);
                        if (dot>0&&dot<400) {
                            let px=Math.cos(a)*dot, py=Math.sin(a)*dot;
                            if (Math.hypot(ex-px,ey-py)<s.laser.width*5+e.size) this.damageEnemy(e,s.laser.dmg*base);
                        }
                    }
                }
            }
        }
        if (s.aura.lv>0) {
            this.addVFX('ring',this.p.x,this.p.y,'#ff0',{size:s.aura.range,life:2});
            if (this.timer%15===0) this.checkHitRadius(this.p.x,this.p.y,s.aura.range,s.aura.dmg*base,'aura');
        }
        if (s.bomb.lv>0) {
            s.bomb.timer--;
            if (s.bomb.timer<=0) {
                s.bomb.timer=s.bomb.cd;
                let tgt=this.getNearestEnemy();
                if (tgt) {
                    this.addVFX('explosion',tgt.x,tgt.y,'#f80',{size:s.bomb.radius});
                    this.checkHitRadius(tgt.x,tgt.y,s.bomb.radius,s.bomb.dmg*base,'bomb');
                    if (typeof playSnd!=='undefined') playSnd('combo');
                    if (typeof screenShake!=='undefined') screenShake(8);
                }
            }
        }
        if (s.hole.lv>0) {
            s.hole.timer--;
            if (s.hole.timer<=0) s.hole.timer=s.hole.cd;
            if (s.hole.timer>s.hole.cd-60) {
                this.addVFX('ring',this.p.x,this.p.y,'#f0f',{size:s.hole.range,life:2});
                for (let e of this.enemies) {
                    let d=Math.hypot(e.x-this.p.x,e.y-this.p.y);
                    if (d<s.hole.range&&d>0) {
                        e.x+=(this.p.x-e.x)*0.05; e.y+=(this.p.y-e.y)*0.05;
                        if (this.timer%10===0) this.damageEnemy(e,s.hole.dmg*base);
                    }
                }
            }
        }

        // Player bullets
        for (let i=this.bullets.length-1; i>=0; i--) {
            let b=this.bullets[i]; b.x+=b.vx; b.y+=b.vy; b.life--;
            this.addVFX('particle',b.x,b.y,'#0ff',{size:4,life:5});
            let hit=false;
            let gx=Math.floor(b.x/50), gy=Math.floor(b.y/50);
            outer: for (let x=gx-1; x<=gx+1; x++) {
                for (let y=gy-1; y<=gy+1; y++) {
                    let cell=this.grid[`${x},${y}`]; if (!cell) continue;
                    for (let e of cell) {
                        if (Math.hypot(b.x-e.x,b.y-e.y)<e.size+5) { this.damageEnemy(e,b.dmg); hit=true; break outer; }
                    }
                }
            }
            if (hit||b.life<=0) this.bullets.splice(i,1);
        }

        // Enemies
        for (let i=this.enemies.length-1; i>=0; i--) {
            let e=this.enemies[i];
            if (e.hitTimer>0) e.hitTimer--;
            if (e.hp<=0) { this.enemies.splice(i,1); continue; }
            let dx=this.p.x-e.x, dy=this.p.y-e.y, dist=Math.hypot(dx,dy)||1;
            e.x+=dx/dist*e.spd; e.y+=dy/dist*e.spd;

            if (e.id==='RANGED'||e.isBoss) {
                e.shotCd--;
                if (e.shotCd<=0) {
                    e.shotCd=e.isBoss?45:90;
                    let a=Math.atan2(dy,dx), sp=e.isBoss?4:2.5;
                    this.enemyBullets.push({ x:e.x,y:e.y, vx:Math.cos(a)*sp,vy:Math.sin(a)*sp, dmg:e.isBoss?8:5, life:120, col:e.color });
                }
            }
            for (let j=Math.max(0,i-5); j<i; j++) {
                let e2=this.enemies[j];
                let edx=e.x-e2.x, edy=e.y-e2.y, ed=Math.hypot(edx,edy), md=e.size+e2.size;
                if (ed<md&&ed>0) { let p=(md-ed)*0.1; e.x+=edx/ed*p; e.y+=edy/ed*p; e2.x-=edx/ed*p; e2.y-=edy/ed*p; }
            }
            if (dist<e.size+8) { this.p.hp-=e.maxHp*0.05; if (typeof screenShake!=='undefined') screenShake(2); this.addVFX('hit',this.p.x,this.p.y,'#f00',{size:10}); }
        }

        // Enemy bullets
        for (let i=this.enemyBullets.length-1; i>=0; i--) {
            let b=this.enemyBullets[i]; b.x+=b.vx; b.y+=b.vy; b.life--;
            if (b.life<=0) { this.enemyBullets.splice(i,1); continue; }
            if (Math.hypot(b.x-this.p.x,b.y-this.p.y)<10) {
                this.p.hp-=b.dmg; this.addVFX('hit',this.p.x,this.p.y,'#f84',{size:8});
                this.enemyBullets.splice(i,1);
            }
        }

        // VFX + Text decay
        for (let i=this.vfx.length-1;   i>=0; i--) { let v=this.vfx[i]; v.life--; v.x+=v.vx; v.y+=v.vy; if(v.life<=0) this.vfx.splice(i,1); }
        for (let i=this.texts.length-1;  i>=0; i--) { let t=this.texts[i]; t.life--; t.y-=0.5; if(t.life<=0) this.texts.splice(i,1); }

        // Game over
        if (this.p.hp<=0) {
            if (this.kills>this.saveData.maxKills) this.saveData.maxKills=this.kills;
            this.save();
            if (typeof SaveSys!=='undefined') SaveSys.addLog('無限無双', `${this.kills}キル / Lv${this.level}`);
            this.st='over';
            if (typeof BGM!=='undefined') BGM.stop();
            if (typeof playSnd!=='undefined') playSnd('hit');
            if (typeof screenShake!=='undefined') screenShake(15);
        }
    },

    drawEnemy(e) {
        let sz=Math.max(0.5,e.size), col=e.hitTimer>0?'#fff':e.color;
        ctx.fillStyle=col;
        if (e.isBoss) {
            let pulse=1+Math.sin(this.timer*0.1)*0.15;
            ctx.shadowBlur=20; ctx.shadowColor='#f00';
            ctx.beginPath();
            for (let k=0;k<8;k++) {
                let a=(k*Math.PI/4)-Math.PI/8, r=k%2===0?sz*pulse:sz*0.45;
                k===0?ctx.moveTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r):ctx.lineTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r);
            }
            ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
            let bw=sz*2.8;
            ctx.fillStyle='#400'; ctx.fillRect(e.x-bw/2,e.y-sz-8,bw,4);
            ctx.fillStyle='#f44'; ctx.fillRect(e.x-bw/2,e.y-sz-8,bw*(e.hp/e.maxHp),4);
        } else if (e.id==='SLIME') {
            ctx.beginPath(); ctx.arc(e.x,e.y,sz,0,Math.PI*2); ctx.fill();
        } else if (e.id==='SCOUT') {
            ctx.beginPath(); ctx.moveTo(e.x,e.y-sz); ctx.lineTo(e.x+sz*0.7,e.y); ctx.lineTo(e.x,e.y+sz); ctx.lineTo(e.x-sz*0.7,e.y); ctx.closePath(); ctx.fill();
        } else if (e.id==='TANK') {
            ctx.fillRect(e.x-sz,e.y-sz,sz*2,sz*2);
            ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=2; ctx.strokeRect(e.x-sz,e.y-sz,sz*2,sz*2);
        } else if (e.id==='ELITE') {
            ctx.shadowBlur=12; ctx.shadowColor=col;
            ctx.beginPath();
            for (let k=0;k<5;k++) {
                let a=(k*Math.PI*2/5)-Math.PI/2, a2=a+Math.PI/5;
                k===0?ctx.moveTo(e.x+Math.cos(a)*sz,e.y+Math.sin(a)*sz):ctx.lineTo(e.x+Math.cos(a)*sz,e.y+Math.sin(a)*sz);
                ctx.lineTo(e.x+Math.cos(a2)*sz*0.4,e.y+Math.sin(a2)*sz*0.4);
            }
            ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
        } else if (e.id==='RANGED') {
            let a=Math.atan2(this.p.y-e.y,this.p.x-e.x);
            ctx.beginPath(); ctx.moveTo(e.x+Math.cos(a)*sz,e.y+Math.sin(a)*sz);
            ctx.lineTo(e.x+Math.cos(a+2.3)*sz,e.y+Math.sin(a+2.3)*sz);
            ctx.lineTo(e.x+Math.cos(a-2.3)*sz,e.y+Math.sin(a-2.3)*sz);
            ctx.closePath(); ctx.fill();
        } else if (e.id==='SPLITTER') {
            ctx.beginPath();
            for (let k=0;k<6;k++) { let a=k*Math.PI/3-Math.PI/6; k===0?ctx.moveTo(e.x+Math.cos(a)*sz,e.y+Math.sin(a)*sz):ctx.lineTo(e.x+Math.cos(a)*sz,e.y+Math.sin(a)*sz); }
            ctx.closePath(); ctx.fill();
        }
    },

    draw() {
        ctx.fillStyle='#000510'; ctx.fillRect(0,0,200,300);

        if (this.st==='title') {
            ctx.textAlign='center';
            ctx.fillStyle='#0ff'; ctx.font='bold 26px "Arial Black",sans-serif';
            ctx.shadowBlur=14; ctx.shadowColor='#0ff'; ctx.fillText('無限無双',100,68); ctx.shadowBlur=0;
            ctx.fillStyle='#ff4'; ctx.font='10px monospace'; ctx.fillText('MUSOU INFINITY',100,85);
            ctx.fillStyle='#fff'; ctx.font='9px monospace';
            ctx.fillText(`COIN: ${this.saveData.coins} G`,100,108);
            ctx.fillText(`MAX KILLS: ${this.formatNum(this.saveData.maxKills)}`,100,122);
            let t=Date.now()/1000;
            let cols=['#4f4','#f0f','#f44','#ff4','#0ff','#f84'];
            for (let k=0;k<6;k++) { let a=(k/6)*Math.PI*2+t*0.4; ctx.fillStyle=cols[k]; ctx.beginPath(); ctx.arc(100+Math.cos(a)*48,170+Math.sin(a)*22,5,0,Math.PI*2); ctx.fill(); }
            ctx.fillStyle=this.menuCur===0?'#0f0':'#aaa'; ctx.font='bold 12px monospace';
            ctx.fillText(this.menuCur===0?'▶ GAME START':'  GAME START',100,222);
            ctx.fillStyle=this.menuCur===1?'#0f0':'#aaa';
            ctx.fillText(this.menuCur===1?'▶ UPGRADE':'  UPGRADE',100,248);
            ctx.fillStyle='#444'; ctx.font='8px monospace'; ctx.fillText('←→:選択  A:決定',100,275);
            ctx.textAlign='left'; return;
        }

        if (this.st==='shop') {
            ctx.fillStyle='#ff0'; ctx.font='bold 12px monospace'; ctx.fillText(`【SHOP】 ${this.saveData.coins}G`,10,20);
            ctx.fillStyle='#aaa'; ctx.font='9px monospace'; ctx.fillText('A:強化  B:戻る',10,35);
            let sk=Object.keys(this.shopData);
            for (let i=0;i<sk.length;i++) {
                let k=sk[i], item=this.shopData[k], lv=this.saveData.upg[k], isMax=lv>=item.max, y=58+i*56;
                ctx.fillStyle=this.menuCur===i?'rgba(0,200,0,0.12)':'rgba(255,255,255,0.04)';
                ctx.fillRect(5,y-14,190,50);
                ctx.strokeStyle=this.menuCur===i?'#0f0':'#334'; ctx.lineWidth=1; ctx.strokeRect(5,y-14,190,50);
                ctx.fillStyle=this.menuCur===i?'#0f0':'#fff'; ctx.font='bold 11px monospace'; ctx.fillText(item.name,12,y);
                ctx.fillStyle=isMax?'#f0f':this.saveData.coins>=item.cost?'#ff0':'#888'; ctx.font='10px monospace';
                ctx.fillText(isMax?'MAX':`Lv${lv}  ${item.cost}G`,120,y);
                ctx.fillStyle='#666'; ctx.font='8px monospace'; ctx.fillText(item.desc,12,y+14);
                ctx.fillStyle='#222'; ctx.fillRect(12,y+26,140,4);
                ctx.fillStyle=isMax?'#f0f':'#0f0'; ctx.fillRect(12,y+26,140*(lv/item.max),4);
            }
            return;
        }

        ctx.save(); ctx.translate(-this.cam.x,-this.cam.y);

        // Background grid
        ctx.strokeStyle='#0a1a2a'; ctx.lineWidth=1;
        let sx=Math.floor(this.cam.x/40)*40, sy=Math.floor(this.cam.y/40)*40;
        for (let i=0;i<8;i++) { ctx.beginPath(); ctx.moveTo(sx+i*40,this.cam.y); ctx.lineTo(sx+i*40,this.cam.y+300); ctx.stroke(); }
        for (let i=0;i<10;i++){ ctx.beginPath(); ctx.moveTo(this.cam.x,sy+i*40); ctx.lineTo(this.cam.x+200,sy+i*40); ctx.stroke(); }

        // Items
        for (let item of this.items) {
            if (item.type==='coin') {
                ctx.fillStyle='#ff0'; ctx.beginPath(); ctx.arc(item.x,item.y,4,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='#a80'; ctx.lineWidth=1; ctx.stroke();
            } else {
                ctx.fillStyle=item.color; ctx.beginPath();
                ctx.moveTo(item.x,item.y-item.size); ctx.lineTo(item.x+item.size,item.y);
                ctx.lineTo(item.x,item.y+item.size); ctx.lineTo(item.x-item.size,item.y); ctx.closePath(); ctx.fill();
            }
        }

        // Enemies
        for (let e of this.enemies) { if (e.hp>0) this.drawEnemy(e); }

        // VFX
        ctx.globalCompositeOperation='lighter';
        for (let v of this.vfx) {
            let r=Math.max(0,v.life/v.maxLife); ctx.globalAlpha=r;
            if (v.type==='slash') { ctx.strokeStyle=v.color; ctx.lineWidth=3*r; ctx.beginPath(); ctx.arc(v.x,v.y,Math.max(0.1,v.size),v.angle-1,v.angle+1); ctx.stroke(); }
            else if (v.type==='explosion') { ctx.fillStyle=v.color; ctx.beginPath(); ctx.arc(v.x,v.y,Math.max(0.1,v.size*(1-r)),0,Math.PI*2); ctx.fill(); }
            else if (v.type==='particle'||v.type==='hit') { ctx.fillStyle=v.color; ctx.beginPath(); ctx.arc(v.x,v.y,Math.max(0.1,v.size*r),0,Math.PI*2); ctx.fill(); }
            else if (v.type==='ring') { ctx.strokeStyle=v.color; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(v.x,v.y,Math.max(0.1,v.size*(1-r)),0,Math.PI*2); ctx.stroke(); }
            else if (v.type==='beam') { ctx.save(); ctx.translate(v.x,v.y); ctx.rotate(v.angle); ctx.fillStyle=v.color; ctx.fillRect(0,-Math.max(0.1,v.size/2*r),400,Math.max(0.1,v.size*r)); ctx.fillStyle='#fff'; ctx.fillRect(0,-Math.max(0.1,v.size/4*r),400,Math.max(0.1,v.size/2*r)); ctx.restore(); }
            else if (v.type==='levelUp') { ctx.fillStyle=v.color; ctx.fillRect(v.x-10*r,v.y-150,20*r,300); }
        }
        ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1;

        // Enemy bullets
        for (let b of this.enemyBullets) {
            ctx.fillStyle=b.col; ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
        }

        // Player (cyberpunk style)
        let px=this.p.x, py=this.p.y, f=this.p.facing;
        ctx.shadowBlur=15; ctx.shadowColor='#0ff'; ctx.fillStyle='#0cf';
        ctx.fillRect(px-7,py-16,14,16); ctx.shadowBlur=0;
        ctx.fillStyle='#ddf'; ctx.fillRect(px-5,py-26,10,9);
        ctx.fillStyle='#0ff'; ctx.fillRect(px+(f>0?-3:-2),py-23,5,3);
        let moving=Math.abs(this.p.vx)>0.3||Math.abs(this.p.vy)>0.3;
        let lp=Math.floor(this.timer/4)%4;
        ctx.fillStyle='#08f';
        if (moving) {
            if (lp<2) { ctx.fillRect(px-6,py,5,6); ctx.fillRect(px+1,py-2,5,4); }
            else      { ctx.fillRect(px-6,py-2,5,4); ctx.fillRect(px+1,py,5,6); }
        } else { ctx.fillRect(px-6,py,5,5); ctx.fillRect(px+1,py,5,5); }

        // Damage texts
        for (let t of this.texts) {
            ctx.globalAlpha=Math.max(0,t.life/t.maxLife);
            ctx.fillStyle=t.color; ctx.font='bold 10px monospace';
            ctx.fillText(t.text,t.x-10,t.y);
        }
        ctx.globalAlpha=1; ctx.restore();

        // === HUD ===
        ctx.fillStyle='rgba(0,0,0,0.78)'; ctx.fillRect(0,0,200,28);
        ctx.fillStyle='#300'; ctx.fillRect(5,4,90,8);
        ctx.fillStyle=this.p.hp>this.p.maxHp*0.3?'#f44':'#f00';
        ctx.fillRect(5,4,Math.max(0,(this.p.hp/this.p.maxHp)*90),8);
        ctx.fillStyle='#fff'; ctx.font='7px monospace'; ctx.fillText(`HP ${Math.ceil(Math.max(0,this.p.hp))}/${this.p.maxHp}`,7,12);
        ctx.fillStyle='#040'; ctx.fillRect(5,14,90,5);
        ctx.fillStyle='#0f0'; ctx.fillRect(5,14,(this.exp/this.maxExp)*90,5);
        ctx.fillStyle='#ff4'; ctx.font='bold 12px monospace'; ctx.textAlign='right';
        ctx.fillText(`${this.formatNum(this.kills)} KILLS`,195,13);
        ctx.fillStyle='#88f'; ctx.font='8px monospace';
        ctx.fillText(`LV${this.level} P${this.phase}`,195,24);
        ctx.textAlign='left';

        // Boss HP bar
        let boss=this.enemies.find(e=>e.isBoss&&e.hp>0);
        if (boss) {
            ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,284,200,16);
            ctx.fillStyle='#600'; ctx.fillRect(5,287,190,7);
            ctx.fillStyle='#f44'; ctx.fillRect(5,287,190*(boss.hp/boss.maxHp),7);
            ctx.fillStyle='#fff'; ctx.font='7px monospace'; ctx.textAlign='center';
            ctx.fillText(`BOSS  ${this.formatNum(boss.hp)} / ${this.formatNum(boss.maxHp)}`,100,295);
            ctx.textAlign='left';
        }

        // Boss warning
        if (this.bossWarning>0) {
            ctx.globalAlpha=Math.abs(Math.sin(this.bossWarning*0.08))*0.9+0.1;
            ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,140,200,40);
            ctx.fillStyle='#f44'; ctx.font='bold 16px "Arial Black",sans-serif';
            ctx.shadowBlur=12; ctx.shadowColor='#f00'; ctx.textAlign='center';
            ctx.fillText('!! BOSS INCOMING !!',100,167);
            ctx.shadowBlur=0; ctx.textAlign='left'; ctx.globalAlpha=1;
        }

        // Level up overlay
        if (this.st==='levelup') {
            ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,200,300);
            ctx.textAlign='center'; ctx.fillStyle='#0f0'; ctx.font='bold 13px monospace';
            ctx.shadowBlur=8; ctx.shadowColor='#0f0'; ctx.fillText(`LEVEL UP!  LV${this.level}`,100,34); ctx.shadowBlur=0;
            for (let i=0;i<this.choices.length;i++) {
                let c=this.choices[i], y=52+i*72;
                ctx.fillStyle=this.menuCur===i?'rgba(0,255,0,0.15)':'rgba(20,20,50,0.7)'; ctx.fillRect(8,y,184,64);
                ctx.strokeStyle=this.menuCur===i?'#0f0':'#336'; ctx.lineWidth=this.menuCur===i?2:1; ctx.strokeRect(8,y,184,64);
                ctx.fillStyle='#fff'; ctx.font='bold 12px monospace'; ctx.textAlign='left'; ctx.fillText(c.name,16,y+18);
                ctx.fillStyle='#ff0'; ctx.font='9px monospace'; ctx.fillText(c.tag,150,y+18);
                ctx.fillStyle='#aaa'; let lines=[];
                for (let j=0;j<c.desc.length;j+=17) lines.push(c.desc.substring(j,j+17));
                for (let j=0;j<lines.length;j++) ctx.fillText(lines[j],16,y+33+j*12);
            }
            ctx.fillStyle='#444'; ctx.font='8px monospace'; ctx.textAlign='center'; ctx.fillText('↑↓:選択  A:決定',100,290);
            ctx.textAlign='left';
        }

        // Game over overlay
        if (this.st==='over') {
            ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,200,300);
            ctx.textAlign='center'; ctx.fillStyle='#f44'; ctx.font='bold 22px "Arial Black",sans-serif';
            ctx.shadowBlur=10; ctx.shadowColor='#f44'; ctx.fillText('GAME OVER',100,108); ctx.shadowBlur=0;
            ctx.fillStyle='#fff'; ctx.font='bold 12px monospace';
            ctx.fillText(`KILLS: ${this.formatNum(this.kills)}`,100,144);
            ctx.fillStyle='#88f'; ctx.font='10px monospace';
            ctx.fillText(`LEVEL ${this.level}   PHASE ${this.phase}`,100,164);
            ctx.fillStyle=this.kills>=this.saveData.maxKills?'#ff4':'#888';
            ctx.fillText(`MAX: ${this.formatNum(this.saveData.maxKills)}`,100,182);
            ctx.fillStyle='#ff4'; ctx.fillText(`COINS: ${this.saveData.coins} G`,100,202);
            if (Math.floor(Date.now()/400)%2===0) { ctx.fillStyle='#0f0'; ctx.font='bold 11px monospace'; ctx.fillText('PRESS [A] TO TITLE',100,248); }
            ctx.textAlign='left';
        }
    }
};
