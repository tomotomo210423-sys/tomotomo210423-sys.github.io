// === MUSOU INFINITY (Phase 2: DADA-SURVIVOR EDITION - Part 1) ===

const Musou = {
    st: 'title', // title, shop, play, levelup, over
    menuCur: 0,
    timer: 0,
    level: 1,
    exp: 0,
    maxExp: 10,
    kills: 0,
    phase: 0,
    
    p: { x: 0, y: 0, hp: 100, maxHp: 100, vx: 0, vy: 0, spd: 3, magnet: 40, atkMult: 1.0 },
    cam: { x: 0, y: 0 },
    
    enemies: [],
    bullets: [],
    vfx: [],
    texts: [],
    items: [], // ドロップアイテム（ジェム、コイン）
    choices: [], // レベルアップ時の3択
    
    maxEnemies: 250,
    
    // セーブデータ（永続強化とコイン）
    saveData: {
        coins: 0,
        maxKills: 0,
        upg: { atk: 0, hp: 0, mag: 0, spd: 0 }
    },
    
    // 永続強化のコストと効果
    shopData: {
        atk: { name: '攻撃力UP', cost: 50, val: 0.1, max: 20, desc: '全ダメージ+10%' },
        hp:  { name: '最大HPUP', cost: 50, val: 20, max: 20, desc: '初期HP+20' },
        mag: { name: '吸引範囲UP', cost: 50, val: 15, max: 15, desc: 'ジェムを遠くから吸う' },
        spd: { name: '移動速度UP', cost: 50, val: 0.2, max: 10, desc: '足が速くなる' }
    },

    skills: {},
    skillDefs: {
        blade: { name: '回転剣', maxLv: 5, desc: '周囲を回る剣で敵を切り裂く' },
        magic: { name: '魔法弾', maxLv: 5, desc: '敵を自動追尾する弾を放つ' },
        laser: { name: '貫通ビーム', maxLv: 5, desc: 'ランダムな敵へ貫通レーザー' },
        aura:  { name: 'ダメージ円', maxLv: 5, desc: '近づく敵を自動で燃やす' },
        bomb:  { name: 'ランダム爆撃', maxLv: 5, desc: '敵の足元を定期的に爆破する' },
        haste: { name: '韋駄天', maxLv: 5, desc: '自身の移動速度がアップ(パッシブ)' },
        regen: { name: '自己再生', maxLv: 5, desc: '定期的にHPが少し回復(パッシブ)' }
    },

    formatNum(num) {
        if (num < 1000) return Math.floor(num).toString();
        const s = ["", "K", "M", "B", "T"];
        const i = Math.floor(Math.log10(num) / 3);
        return (num / Math.pow(1000, i)).toFixed(1) + s[i];
    },

    loadSave() {
        try {
            let data = localStorage.getItem('musou_save_v1');
            if (data) this.saveData = JSON.parse(data);
            if (!this.saveData.upg) this.saveData.upg = { atk: 0, hp: 0, mag: 0, spd: 0 };
        } catch(e) {}
    },

    save() {
        try {
            localStorage.setItem('musou_save_v1', JSON.stringify(this.saveData));
        } catch(e) {}
    },

    init() {
        this.loadSave();
        this.st = 'title';
        this.menuCur = 0;
        this.resetGame();
    },

    resetGame() {
        this.timer = 0;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 10;
        this.kills = 0;
        this.phase = 0;
        
        let u = this.saveData.upg;
        this.p = { 
            x: 0, y: 0, 
            maxHp: 100 + (u.hp * this.shopData.hp.val),
            hp: 100 + (u.hp * this.shopData.hp.val), 
            vx: 0, vy: 0,
            spd: 2.5 + (u.spd * this.shopData.spd.val),
            magnet: 40 + (u.mag * this.shopData.mag.val),
            atkMult: 1.0 + (u.atk * this.shopData.atk.val)
        };
        this.cam = { x: -100, y: -150 };
        
        this.enemies = [];
        this.bullets = [];
        this.vfx = [];
        this.texts = [];
        this.items = [];
        
        this.skills = {
            blade: { lv: 1, dmg: 10, count: 1, spd: 0.1, range: 45 },
            magic: { lv: 0, dmg: 15, cd: 60, timer: 0, count: 1 },
            laser: { lv: 0, dmg: 20, cd: 120, timer: 0, width: 2 },
            aura:  { lv: 0, dmg: 3, range: 60 },
            bomb:  { lv: 0, dmg: 50, cd: 150, timer: 0, radius: 50 },
            haste: { lv: 0 },
            regen: { lv: 0, timer: 0 }
        };
    },

    addVFX(type, x, y, color, extra = {}) {
        this.vfx.push({
            type, x, y, color,
            life: extra.life || 20, maxLife: extra.life || 20,
            size: extra.size || 10, angle: extra.angle || 0,
            vx: extra.vx || 0, vy: extra.vy || 0
        });
    },

    addText(x, y, text, color, life = 30) {
        this.texts.push({ x, y, text, color, life, maxLife: life });
    },

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        let angle = Math.random() * Math.PI * 2;
        let dist = 250 + Math.random() * 50;
        let ex = this.p.x + Math.cos(angle) * dist;
        let ey = this.p.y + Math.sin(angle) * dist;

        let hpMult = Math.pow(1.2, this.phase);
        let expMult = 1 + this.phase * 0.2;

        let r = Math.random();
        let type = { color: '#0f0', hp: 10, spd: 1.0, size: 8, exp: 1 }; 

        if (this.phase > 2 && r < 0.3) {
            type = { color: '#f0f', hp: 15, spd: 1.8, size: 6, exp: 2 }; 
        } else if (this.phase > 5 && r < 0.15) {
            type = { color: '#f00', hp: 60, spd: 0.6, size: 14, exp: 5 }; 
        } else if (this.phase > 10 && Math.random() < 0.02) {
            type = { color: '#ff0', hp: 500, spd: 0.8, size: 25, exp: 30 }; 
        }

        this.enemies.push({
            x: ex, y: ey, vx: 0, vy: 0,
            hp: type.hp * hpMult, maxHp: type.hp * hpMult,
            spd: type.spd, size: type.size,
            exp: type.exp * expMult, color: type.color, hitTimer: 0
        });
    },

    dropItem(x, y, expVal) {
        // 5%の確率でコイン、それ以外は経験値ジェム
        if (Math.random() < 0.05) {
            this.items.push({ type: 'coin', x, y, val: 1, vx: 0, vy: 0, state: 'idle' });
        } else {
            let col = expVal >= 10 ? '#f00' : (expVal >= 5 ? '#ff0' : '#0ff');
            let sz = expVal >= 10 ? 6 : (expVal >= 5 ? 4 : 3);
            this.items.push({ type: 'gem', x, y, val: expVal, color: col, size: sz, vx: 0, vy: 0, state: 'idle' });
        }
    },

    getNearestEnemy() {
        let minDist = 9999; let target = null;
        for (let e of this.enemies) {
            let d = Math.hypot(e.x - this.p.x, e.y - this.p.y);
            if (d < minDist) { minDist = d; target = e; }
        }
        return target;
    },

    checkHitRadius(cx, cy, radius, dmg, source = '') {
        for (let e of this.enemies) {
            if (e.hp <= 0) continue;
            let d = Math.hypot(e.x - cx, e.y - cy);
            if (d < radius + e.size) {
                if (source === 'blade' && e.hitTimer > 0) continue;
                this.damageEnemy(e, dmg);
                if (source === 'blade') e.hitTimer = 10;
            }
        }
    },

    damageEnemy(e, dmg) {
        let isCrit = Math.random() < 0.1;
        let finalDmg = isCrit ? dmg * 3 : dmg;
        e.hp -= finalDmg;
        
        let tCol = isCrit ? '#f00' : '#fff';
        this.addText(e.x, e.y - 10, this.formatNum(finalDmg), tCol);
        if (isCrit) this.addVFX('hit', e.x, e.y, '#f00', { size: 15 });

        if (e.hp <= 0) {
            this.kills++;
            this.dropItem(e.x, e.y, e.exp);
            this.addVFX('explosion', e.x, e.y, e.color, { size: e.size * 2 });
            
            if (Math.random() < 0.02) {
                this.p.hp = Math.min(this.p.maxHp, this.p.hp + 5);
                this.addVFX('particle', this.p.x, this.p.y, '#0f0', { size: 8 });
            }
        }
    },

    generateChoices() {
        this.choices = [];
        let pool = Object.keys(this.skills).filter(k => this.skills[k].lv < this.skillDefs[k].maxLv);
        
        // シャッフルして最大3つ選ぶ
        for (let i = pool.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        for (let i = 0; i < Math.min(3, pool.length); i++) {
            let key = pool[i];
            let nextLv = this.skills[key].lv + 1;
            let typeText = nextLv === 1 ? 'NEW!' : `LV UP! (${nextLv})`;
            this.choices.push({ key: key, name: this.skillDefs[key].name, tag: typeText, desc: this.skillDefs[key].desc });
        }
        
        if (this.choices.length > 0) {
            this.st = 'levelup';
            this.menuCur = 0;
            if (typeof playSnd !== 'undefined') playSnd('combo');
        } else {
            // カンスト時は全回復＋コイン付与
            this.p.hp = this.p.maxHp;
            this.saveData.coins += 50;
            this.addText(this.p.x, this.p.y - 30, "ALL MAX! +50G", "#ff0", 60);
        }
    },

    applySkillUp(key) {
        let s = this.skills[key];
        s.lv++;
        if (key === 'blade') { s.count++; s.dmg *= 1.2; s.range += 5; s.spd += 0.02; }
        if (key === 'magic') { s.count++; s.dmg *= 1.3; s.cd = Math.max(10, s.cd - 5); }
        if (key === 'laser') { s.width += 2; s.dmg *= 1.5; s.cd = Math.max(30, s.cd - 10); }
        if (key === 'aura')  { s.range += 12; s.dmg *= 1.5; }
        if (key === 'bomb')  { s.radius += 15; s.dmg *= 1.5; s.cd = Math.max(40, s.cd - 15); }
        if (key === 'haste') { this.p.spd += 0.3; }
        
        this.addVFX('levelUp', this.p.x, this.p.y, '#0f0', { size: 100 });
        if (typeof playSnd !== 'undefined') playSnd('jmp');
    },

// === Part 1 はここまで（次のPart 2に続く） ===
    update() {
        // SELECTボタンでメニューに戻る＆セーブ
        if (typeof keysDown !== 'undefined' && keysDown.select) {
            if (typeof switchApp !== 'undefined' && typeof Menu !== 'undefined') {
                this.save();
                switchApp(Menu); return;
            }
        }

        if (this.st === 'title') {
            if (typeof keysDown !== 'undefined') {
                if (keysDown.left || keysDown.right) {
                    this.menuCur = this.menuCur === 0 ? 1 : 0;
                    if (typeof playSnd !== 'undefined') playSnd('sel');
                }
                if (keysDown.a) {
                    if (this.menuCur === 0) {
                        this.resetGame();
                        this.st = 'play';
                        if (typeof playSnd !== 'undefined') playSnd('jmp');
                    } else {
                        this.st = 'shop';
                        this.menuCur = 0;
                        if (typeof playSnd !== 'undefined') playSnd('sel');
                    }
                }
            }
            return;
        }

        if (this.st === 'shop') {
            let shopKeys = Object.keys(this.shopData);
            if (typeof keysDown !== 'undefined') {
                if (keysDown.up) { 
                    this.menuCur = (this.menuCur - 1 + shopKeys.length) % shopKeys.length; 
                    if (typeof playSnd !== 'undefined') playSnd('sel'); 
                }
                if (keysDown.down) { 
                    this.menuCur = (this.menuCur + 1) % shopKeys.length; 
                    if (typeof playSnd !== 'undefined') playSnd('sel'); 
                }
                if (keysDown.b) { 
                    this.st = 'title'; 
                    this.menuCur = 1; 
                    if (typeof playSnd !== 'undefined') playSnd('hit'); 
                }
                if (keysDown.a) {
                    let key = shopKeys[this.menuCur];
                    let item = this.shopData[key];
                    if (this.saveData.upg[key] < item.max && this.saveData.coins >= item.cost) {
                        this.saveData.coins -= item.cost;
                        this.saveData.upg[key]++;
                        this.save();
                        if (typeof playSnd !== 'undefined') playSnd('combo');
                    } else {
                        if (typeof playSnd !== 'undefined') playSnd('hit');
                    }
                }
            }
            return;
        }

        // レベルアップ時は時間が止まり、3択を選ぶ
        if (this.st === 'levelup') {
            if (typeof keysDown !== 'undefined') {
                if (keysDown.up) { 
                    this.menuCur = (this.menuCur - 1 + this.choices.length) % this.choices.length; 
                    if (typeof playSnd !== 'undefined') playSnd('sel'); 
                }
                if (keysDown.down) { 
                    this.menuCur = (this.menuCur + 1) % this.choices.length; 
                    if (typeof playSnd !== 'undefined') playSnd('sel'); 
                }
                if (keysDown.a) {
                    this.applySkillUp(this.choices[this.menuCur].key);
                    this.st = 'play';
                }
            }
            return;
        }

        if (this.st === 'over') {
            if (typeof keysDown !== 'undefined' && keysDown.a) {
                this.st = 'title';
                this.menuCur = 0;
            }
            return;
        }

        // === ここからプレイ中のメインループ ===
        this.timer++;
        
        if (this.timer % 1800 === 0) this.phase++;

        let spawnRate = Math.max(3, 20 - this.phase);
        if (this.timer % spawnRate === 0) this.spawnEnemy();

        let moveX = 0; let moveY = 0;
        if (typeof keys !== 'undefined') {
            if (keys.up) moveY -= 1;
            if (keys.down) moveY += 1;
            if (keys.left) moveX -= 1;
            if (keys.right) moveX += 1;
        }
        if (moveX !== 0 && moveY !== 0) {
            let len = Math.hypot(moveX, moveY);
            moveX /= len; moveY /= len;
        }
        
        this.p.vx += (moveX * this.p.spd - this.p.vx) * 0.2;
        this.p.vy += (moveY * this.p.spd - this.p.vy) * 0.2;
        this.p.x += this.p.vx;
        this.p.y += this.p.vy;

        this.cam.x += (this.p.x - 100 - this.cam.x) * 0.1;
        this.cam.y += (this.p.y - 150 - this.cam.y) * 0.1;

        // --- アイテム吸引と回収（マグネット処理） ---
        for (let i = this.items.length - 1; i >= 0; i--) {
            let item = this.items[i];
            let d = Math.hypot(item.x - this.p.x, item.y - this.p.y);
            
            if (item.state === 'idle' && d < this.p.magnet) {
                item.state = 'magnet';
            }
            
            if (item.state === 'magnet') {
                let speed = 8;
                item.x += ((this.p.x - item.x) / d) * speed;
                item.y += ((this.p.y - item.y) / d) * speed;
                
                // 取得判定
                if (d < 10) {
                    if (item.type === 'coin') {
                        this.saveData.coins += item.val;
                        if (typeof playSnd !== 'undefined') playSnd('sel');
                    } else {
                        this.exp += item.val;
                        // 効果音が連続しすぎないように間引く
                        if (typeof playSnd !== 'undefined' && Math.random() < 0.2) playSnd('sel');
                    }
                    this.items.splice(i, 1);
                    
                    // レベルアップ判定
                    if (this.exp >= this.maxExp) {
                        this.exp -= this.maxExp;
                        this.maxExp = Math.floor(this.maxExp * 1.3);
                        this.generateChoices();
                    }
                }
            }
        }

        // --- スキル攻撃の実行 ---
        let baseDmg = this.p.atkMult * Math.pow(1.1, this.level - 1);
        let s = this.skills;

        if (s.regen.lv > 0) {
            s.regen.timer--;
            if (s.regen.timer <= 0) {
                s.regen.timer = 120 - (s.regen.lv * 10);
                this.p.hp = Math.min(this.p.maxHp, this.p.hp + s.regen.lv);
                this.addVFX('particle', this.p.x, this.p.y, '#0f0', { size: 5 });
            }
        }

        if (s.blade.lv > 0) {
            for (let i = 0; i < s.blade.count; i++) {
                let angle = (this.timer * s.blade.spd) + (Math.PI * 2 / s.blade.count) * i;
                let bx = this.p.x + Math.cos(angle) * s.blade.range;
                let by = this.p.y + Math.sin(angle) * s.blade.range;
                this.checkHitRadius(bx, by, 15, s.blade.dmg * baseDmg, 'blade');
                this.addVFX('slash', bx, by, '#0ff', { angle: angle + Math.PI/2, size: 20 });
            }
        }

// === Part 2 はここまで（次のPart 3に続く） ===
        if (s.magic.lv > 0) {
            s.magic.timer--;
            if (s.magic.timer <= 0) {
                s.magic.timer = s.magic.cd;
                for (let i = 0; i < s.magic.count; i++) {
                    let target = this.getNearestEnemy();
                    if (target) {
                        let angle = Math.atan2(target.y - this.p.y, target.x - this.p.x) + (Math.random()-0.5)*0.5;
                        this.bullets.push({
                            x: this.p.x, y: this.p.y,
                            vx: Math.cos(angle) * 6, vy: Math.sin(angle) * 6,
                            type: 'magic', dmg: s.magic.dmg * baseDmg, life: 60
                        });
                        if (typeof playSnd !== 'undefined' && Math.random() < 0.3) playSnd('sel');
                    }
                }
            }
        }

        if (s.laser.lv > 0) {
            s.laser.timer--;
            if (s.laser.timer <= 0) {
                s.laser.timer = s.laser.cd;
                let target = this.getRandomEnemy();
                if (target) {
                    let angle = Math.atan2(target.y - this.p.y, target.x - this.p.x);
                    this.addVFX('beam', this.p.x, this.p.y, '#f0f', { angle: angle, size: 400, life: 10 });
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                    if (typeof screenShake !== 'undefined') screenShake(4);
                    for (let e of this.enemies) {
                        let ex = e.x - this.p.x; let ey = e.y - this.p.y;
                        let dot = ex * Math.cos(angle) + ey * Math.sin(angle);
                        if (dot > 0 && dot < 400) {
                            let projX = Math.cos(angle) * dot; let projY = Math.sin(angle) * dot;
                            let dist = Math.hypot(ex - projX, ey - projY);
                            if (dist < s.laser.width * 5 + e.size) {
                                this.damageEnemy(e, s.laser.dmg * baseDmg);
                            }
                        }
                    }
                }
            }
        }

        if (s.aura.lv > 0) {
            this.addVFX('ring', this.p.x, this.p.y, '#ff0', { size: s.aura.range, life: 2 });
            if (this.timer % 15 === 0) {
                this.checkHitRadius(this.p.x, this.p.y, s.aura.range, s.aura.dmg * baseDmg, 'aura');
            }
        }

        if (s.bomb.lv > 0) {
            s.bomb.timer--;
            if (s.bomb.timer <= 0) {
                s.bomb.timer = s.bomb.cd;
                let target = this.getRandomEnemy();
                if (target) {
                    this.addVFX('explosion', target.x, target.y, '#f80', { size: s.bomb.radius });
                    this.checkHitRadius(target.x, target.y, s.bomb.radius, s.bomb.dmg * baseDmg, 'bomb');
                    if (typeof playSnd !== 'undefined') playSnd('combo');
                    if (typeof screenShake !== 'undefined') screenShake(8);
                }
            }
        }

        // --- 弾の更新 ---
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            let b = this.bullets[i];
            b.x += b.vx; b.y += b.vy; b.life--;
            this.addVFX('particle', b.x, b.y, '#0ff', { size: 4, life: 5 });

            let hit = false;
            for (let e of this.enemies) {
                if (e.hp <= 0) continue;
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.size + 5) {
                    this.damageEnemy(e, b.dmg);
                    hit = true; break;
                }
            }
            if (hit || b.life <= 0) this.bullets.splice(i, 1);
        }

        // --- 敵の更新 ---
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            let e = this.enemies[i];
            if (e.hitTimer > 0) e.hitTimer--;

            if (e.hp <= 0) {
                this.enemies.splice(i, 1);
                continue;
            }

            let dx = this.p.x - e.x;
            let dy = this.p.y - e.y;
            let dist = Math.hypot(dx, dy) || 1;
            e.x += (dx / dist) * e.spd;
            e.y += (dy / dist) * e.spd;

            // 敵同士の重なり防止（軽量版）
            for (let j = Math.max(0, i - 5); j < i; j++) {
                let e2 = this.enemies[j];
                let edx = e.x - e2.x; let edy = e.y - e2.y;
                let edist = Math.hypot(edx, edy);
                let minDist = e.size + e2.size;
                if (edist < minDist && edist > 0) {
                    let push = (minDist - edist) * 0.1;
                    e.x += (edx / edist) * push; e.y += (edy / edist) * push;
                    e2.x -= (edx / edist) * push; e2.y -= (edy / edist) * push;
                }
            }

            // プレイヤー被弾判定
            if (dist < e.size + 8) {
                this.p.hp -= (e.maxHp * 0.05); 
                if (typeof screenShake !== 'undefined') screenShake(2);
                this.addVFX('hit', this.p.x, this.p.y, '#f00', { size: 10 });
            }
        }

        // --- VFXとテキストの更新 ---
        for (let i = this.vfx.length - 1; i >= 0; i--) {
            let v = this.vfx[i];
            v.life--;
            v.x += v.vx; v.y += v.vy;
            if (v.life <= 0) this.vfx.splice(i, 1);
        }
        for (let i = this.texts.length - 1; i >= 0; i--) {
            let t = this.texts[i];
            t.life--; t.y -= 0.5;
            if (t.life <= 0) this.texts.splice(i, 1);
        }

        // ゲームオーバー判定
        if (this.p.hp <= 0) {
            if (this.kills > this.saveData.maxKills) this.saveData.maxKills = this.kills;
            this.save();
            this.st = 'over';
            if (typeof playSnd !== 'undefined') playSnd('hit');
            if (typeof screenShake !== 'undefined') screenShake(15);
        }
    },

    draw() {
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace';
            ctx.fillText('MUSOU INFINITY', 30, 80);
            
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('SURVIVOR EDITION', 50, 100);
            
            ctx.fillStyle = '#ff0';
            ctx.fillText(`COIN: ${this.saveData.coins} G`, 10, 20);
            ctx.fillText(`MAX KILLS: ${this.formatNum(this.saveData.maxKills)}`, 10, 35);
            
            ctx.fillStyle = this.menuCur === 0 ? '#0f0' : '#aaa';
            ctx.fillText((this.menuCur === 0 ? '> ' : '  ') + 'GAME START', 50, 180);
            
            ctx.fillStyle = this.menuCur === 1 ? '#0f0' : '#aaa';
            ctx.fillText((this.menuCur === 1 ? '> ' : '  ') + 'SHOP (UPGRADE)', 50, 210);
            return;
        }

        if (this.st === 'shop') {
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
            ctx.fillText(`【SHOP】 COIN: ${this.saveData.coins}G`, 10, 20);
            
            ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
            ctx.fillText('A:強化 B:戻る', 10, 35);

            let keys = Object.keys(this.shopData);
            for (let i = 0; i < keys.length; i++) {
                let k = keys[i];
                let item = this.shopData[k];
                let lv = this.saveData.upg[k];
                let isMax = lv >= item.max;
                
                ctx.fillStyle = this.menuCur === i ? '#0f0' : '#fff';
                ctx.fillText((this.menuCur === i ? '>' : ' ') + item.name, 10, 60 + i * 35);
                
                ctx.fillStyle = isMax ? '#f0f' : (this.saveData.coins >= item.cost ? '#ff0' : '#888');
                ctx.fillText(isMax ? 'MAX' : `Lv.${lv} -> ${item.cost}G`, 120, 60 + i * 35);
                
                ctx.fillStyle = '#666';
                ctx.fillText(item.desc, 20, 72 + i * 35);
            }
            return;
        }

        if (typeof applyShake !== 'undefined') applyShake();
        ctx.save();
        ctx.translate(-this.cam.x, -this.cam.y);

        // 背景グリッド描画
        ctx.strokeStyle = '#113'; ctx.lineWidth = 1;
        let startX = Math.floor(this.cam.x / 40) * 40;
        let startY = Math.floor(this.cam.y / 40) * 40;
        for (let i = 0; i < 240; i += 40) {
            ctx.beginPath(); ctx.moveTo(startX + i, this.cam.y); ctx.lineTo(startX + i, this.cam.y + 300); ctx.stroke();
        }
        for (let i = 0; i < 340; i += 40) {
            ctx.beginPath(); ctx.moveTo(this.cam.x, startY + i); ctx.lineTo(this.cam.x + 200, startY + i); ctx.stroke();
        }

        // ジェム・コイン描画
        for (let item of this.items) {
            ctx.fillStyle = item.type === 'coin' ? '#ff0' : item.color;
            ctx.beginPath();
            if (item.type === 'coin') {
                ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#a80'; ctx.lineWidth=1; ctx.stroke();
            } else {
                ctx.moveTo(item.x, item.y - item.size);
                ctx.lineTo(item.x + item.size, item.y);
                ctx.lineTo(item.x, item.y + item.size);
                ctx.lineTo(item.x - item.size, item.y);
                ctx.fill();
            }
        }

        // 敵描画
        for (let e of this.enemies) {
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // VFX描画
        ctx.globalCompositeOperation = 'lighter';
        for (let v of this.vfx) {
            let ratio = v.life / v.maxLife;
            ctx.globalAlpha = ratio;
            if (v.type === 'slash') {
                ctx.strokeStyle = v.color; ctx.lineWidth = 3 * ratio;
                ctx.beginPath(); ctx.arc(v.x, v.y, v.size, v.angle - 1, v.angle + 1); ctx.stroke();
            } else if (v.type === 'explosion') {
                ctx.fillStyle = v.color;
                ctx.beginPath(); ctx.arc(v.x, v.y, v.size * (1 - ratio), 0, Math.PI * 2); ctx.fill();
            } else if (v.type === 'particle' || v.type === 'hit') {
                ctx.fillStyle = v.color;
                ctx.beginPath(); ctx.arc(v.x, v.y, v.size * ratio, 0, Math.PI * 2); ctx.fill();
            } else if (v.type === 'ring') {
                ctx.strokeStyle = v.color; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(v.x, v.y, v.size * (1 - ratio), 0, Math.PI * 2); ctx.stroke();
            } else if (v.type === 'beam') {
                ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle);
                ctx.fillStyle = v.color; ctx.fillRect(0, -v.size/2 * ratio, 400, v.size * ratio);
                ctx.fillStyle = '#fff'; ctx.fillRect(0, -v.size/4 * ratio, 400, v.size/2 * ratio);
                ctx.restore();
            } else if (v.type === 'levelUp') {
                ctx.fillStyle = v.color;
                ctx.fillRect(v.x - 10 * ratio, v.y - 150, 20 * ratio, 300);
            }
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;

        // プレイヤー描画
        ctx.fillStyle = '#0ff';
        ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
        ctx.beginPath(); ctx.arc(this.p.x, this.p.y, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.p.x, this.p.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // ダメージテキスト
        for (let t of this.texts) {
            ctx.fillStyle = t.color;
            ctx.font = 'bold 10px monospace';
            ctx.globalAlpha = t.life / t.maxLife;
            ctx.fillText(t.text, t.x - 10, t.y);
        }
        ctx.globalAlpha = 1;

        ctx.restore();
        if (typeof resetShake !== 'undefined') resetShake();

        // プレイ中UI
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, 200, 25);
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
        ctx.fillText(`LV:${this.level}  PHASE:${this.phase}`, 5, 10);
        ctx.fillStyle = '#ff0'; ctx.fillText(`KILLS: ${this.formatNum(this.kills)}`, 110, 10);
        
        ctx.fillStyle = '#400'; ctx.fillRect(5, 15, 80, 5);
        ctx.fillStyle = '#f00'; ctx.fillRect(5, 15, (Math.max(0, this.p.hp) / this.p.maxHp) * 80, 5);
        ctx.fillStyle = '#040'; ctx.fillRect(110, 15, 80, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(110, 15, (this.exp / this.maxExp) * 80, 5);

        // レベルアップ画面 (3択)
        if (this.st === 'levelup') {
            ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace';
            ctx.fillText('LEVEL UP!', 65, 40);
            
            for (let i = 0; i < this.choices.length; i++) {
                let c = this.choices[i];
                let y = 70 + i * 70;
                
                ctx.strokeStyle = this.menuCur === i ? '#0f0' : '#555';
                ctx.lineWidth = 2;
                ctx.strokeRect(10, y, 180, 60);
                ctx.fillStyle = this.menuCur === i ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.5)';
                ctx.fillRect(10, y, 180, 60);
                
                ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
                ctx.fillText(c.name, 20, y + 20);
                ctx.fillStyle = '#ff0'; ctx.font = '9px monospace';
                ctx.fillText(c.tag, 130, y + 20);
                ctx.fillStyle = '#aaa';
                
                let lines = [];
                for(let j=0; j<c.desc.length; j+=16) lines.push(c.desc.substring(j, j+16));
                for(let j=0; j<lines.length; j++) ctx.fillText(lines[j], 20, y + 35 + j*12);
            }
        }

        // ゲームオーバー画面
        if (this.st === 'over') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace';
            ctx.fillText('GAME OVER', 60, 120);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText(`FINAL LEVEL : ${this.level}`, 50, 150);
            ctx.fillText(`TOTAL KILLS : ${this.formatNum(this.kills)}`, 50, 170);
            ctx.fillStyle = '#ff0'; ctx.fillText('PRESS (A) TO TITLE', 40, 220);
        }
    }
};
