// === MUSOU INFINITY (Phase 1: INFINITE SLASH EDITION) ===

const Musou = {
    st: 'title',
    timer: 0,
    level: 1,
    exp: 0,
    maxExp: 10,
    kills: 0,
    phase: 0,
    
    p: { x: 0, y: 0, hp: 100, maxHp: 100, vx: 0, vy: 0 },
    cam: { x: 0, y: 0 },
    
    enemies: [],
    bullets: [],
    vfx: [],
    texts: [],
    
    maxEnemies: 200, // バグらず爽快感がある限界数
    skills: {},

    // 数字を K, M, B, T に変換してインフレ感を出す関数
    formatNum(num) {
        if (num < 1000) return Math.floor(num).toString();
        const s = ["", "K", "M", "B", "T", "Qa", "Qi"];
        const i = Math.floor(Math.log10(num) / 3);
        return (num / Math.pow(1000, i)).toFixed(1) + s[i];
    },

    init() {
        this.st = 'title';
        this.timer = 0;
        this.level = 1;
        this.exp = 0;
        this.maxExp = 10;
        this.kills = 0;
        this.phase = 0;
        
        this.p = { x: 0, y: 0, hp: 100, maxHp: 100, vx: 0, vy: 0 };
        this.cam = { x: -100, y: -150 };
        
        this.enemies = [];
        this.bullets = [];
        this.vfx = [];
        this.texts = [];
        
        // スキル（武器）の初期状態
        this.skills = {
            blade: { active: true, level: 1, dmg: 10, count: 1, spd: 0.1, range: 40 },
            magic: { active: false, level: 0, dmg: 15, cd: 60, timer: 0, count: 1 },
            laser: { active: false, level: 0, dmg: 5, cd: 120, timer: 0, width: 2 },
            aura:  { active: false, level: 0, dmg: 2, range: 60 },
            bomb:  { active: false, level: 0, dmg: 50, cd: 180, timer: 0, radius: 50 }
        };

        if (typeof BGM !== 'undefined') BGM.play('action');
    },

    addVFX(type, x, y, color, extra = {}) {
        this.vfx.push({
            type, x, y, color,
            life: extra.life || 20,
            maxLife: extra.life || 20,
            size: extra.size || 10,
            angle: extra.angle || 0,
            vx: extra.vx || 0,
            vy: extra.vy || 0
        });
    },

    addText(x, y, text, color, life = 30) {
        this.texts.push({ x, y, text, color, life, maxLife: life });
    },

    spawnEnemy() {
        if (this.enemies.length >= this.maxEnemies) return;

        // プレイヤーの画面外、円周上にスポーン
        let angle = Math.random() * Math.PI * 2;
        let dist = 250 + Math.random() * 50;
        let ex = this.p.x + Math.cos(angle) * dist;
        let ey = this.p.y + Math.sin(angle) * dist;

        // 時間経過(phase)で敵がインフレ
        let hpMult = Math.pow(1.15, this.phase);
        let expMult = 1 + this.phase * 0.5;

        let r = Math.random();
        let type = { color: '#0f0', hp: 10, spd: 1.0, size: 8, exp: 1 }; // Slime

        if (this.phase > 2 && r < 0.3) {
            type = { color: '#f0f', hp: 15, spd: 1.8, size: 6, exp: 2 }; // Bat
        } else if (this.phase > 5 && r < 0.1) {
            type = { color: '#f00', hp: 50, spd: 0.6, size: 14, exp: 5 }; // Tank
        } else if (this.phase > 10 && Math.random() < 0.01) {
            type = { color: '#ff0', hp: 500, spd: 0.8, size: 25, exp: 50 }; // Boss
        }

        this.enemies.push({
            x: ex, y: ey,
            vx: 0, vy: 0,
            hp: type.hp * hpMult,
            maxHp: type.hp * hpMult,
            spd: type.spd,
            size: type.size,
            exp: type.exp * expMult,
            color: type.color,
            hitTimer: 0
        });
    },

    getNearestEnemy() {
        let minDist = 9999;
        let target = null;
        for (let e of this.enemies) {
            let d = Math.hypot(e.x - this.p.x, e.y - this.p.y);
            if (d < minDist) { minDist = d; target = e; }
        }
        return target;
    },

    getRandomEnemy() {
        if (this.enemies.length === 0) return null;
        return this.enemies[Math.floor(Math.random() * this.enemies.length)];
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

        // 敵撃破時
        if (e.hp <= 0) {
            this.kills++;
            this.exp += e.exp;
            this.addVFX('explosion', e.x, e.y, e.color, { size: e.size * 2 });
            
            // たまに回復
            if (Math.random() < 0.05) {
                this.p.hp = Math.min(this.p.maxHp, this.p.hp + 2);
            }
            this.checkLevelUp();
        }
    },

    checkLevelUp() {
        if (this.exp >= this.maxExp) {
            this.exp -= this.maxExp;
            this.maxExp = Math.floor(this.maxExp * 1.4);
            this.level++;
            
            this.p.maxHp += 10;
            this.p.hp = this.p.maxHp;

            // ランダムなスキルを強化（究極のインフレ）
            let sKeys = Object.keys(this.skills);
            let upKey = sKeys[Math.floor(Math.random() * sKeys.length)];
            let s = this.skills[upKey];
            s.active = true;
            s.level++;

            if (upKey === 'blade') { s.count++; s.dmg *= 1.2; s.range += 5; s.spd += 0.01; }
            if (upKey === 'magic') { s.count++; s.dmg *= 1.3; s.cd = Math.max(5, s.cd - 2); }
            if (upKey === 'laser') { s.width += 2; s.dmg *= 1.5; s.cd = Math.max(30, s.cd - 5); }
            if (upKey === 'aura')  { s.range += 10; s.dmg *= 1.4; }
            if (upKey === 'bomb')  { s.radius += 15; s.dmg *= 1.5; s.cd = Math.max(60, s.cd - 10); }

            this.addText(this.p.x, this.p.y - 40, "LEVEL UP!", "#0f0", 60);
            this.addText(this.p.x, this.p.y - 20, upKey.toUpperCase() + " UP!", "#ff0", 60);
            this.addVFX('levelUp', this.p.x, this.p.y, '#0f0', { size: 100 });
            
            if (typeof playSnd !== 'undefined') playSnd('combo');
            if (typeof screenShake !== 'undefined') screenShake(5);
        }
    },

    update() {
        if (typeof keysDown !== 'undefined' && keysDown.select) {
            if (typeof switchApp !== 'undefined' && typeof Menu !== 'undefined') {
                switchApp(Menu); return;
            }
        }

        if (this.st === 'title') {
            if (typeof keysDown !== 'undefined' && keysDown.a) {
                this.init();
                this.st = 'play';
                if (typeof playSnd !== 'undefined') playSnd('jmp');
            }
            return;
        }

        if (this.st === 'over') {
            if (typeof keysDown !== 'undefined' && keysDown.a) {
                this.init();
            }
            return;
        }

        this.timer++;
        
        // 30秒ごとにフェーズ進行（敵が強くなる）
        if (this.timer % 1800 === 0) this.phase++;

        // 敵のスポーン
        let spawnRate = Math.max(5, 30 - this.phase * 2);
        if (this.timer % spawnRate === 0) this.spawnEnemy();

        // プレイヤーの移動
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
        
        let pSpd = 3 + (this.level * 0.05); // レベルで足も速くなる
        this.p.vx += (moveX * pSpd - this.p.vx) * 0.2;
        this.p.vy += (moveY * pSpd - this.p.vy) * 0.2;
        this.p.x += this.p.vx;
        this.p.y += this.p.vy;

        // カメラ追従
        this.cam.x += (this.p.x - 100 - this.cam.x) * 0.1;
        this.cam.y += (this.p.y - 150 - this.cam.y) * 0.1;

        // ダメージインフレの基礎値
        let baseDmg = Math.pow(1.2, this.level - 1);

        // --- スキル処理 ---
        let s = this.skills;

        // 1. BLADE（回転剣）
        if (s.blade.active) {
            for (let i = 0; i < s.blade.count; i++) {
                let angle = (this.timer * s.blade.spd) + (Math.PI * 2 / s.blade.count) * i;
                let bx = this.p.x + Math.cos(angle) * s.blade.range;
                let by = this.p.y + Math.sin(angle) * s.blade.range;
                this.checkHitRadius(bx, by, 15, s.blade.dmg * baseDmg, 'blade');
                this.addVFX('slash', bx, by, '#0ff', { angle: angle + Math.PI/2, size: 20 });
            }
        }

        // 2. MAGIC（追尾弾）
        if (s.magic.active) {
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
                        if (typeof playSnd !== 'undefined') playSnd('sel');
                    }
                }
            }
        }

        // 3. LASER（貫通ビーム）
        if (s.laser.active) {
            s.laser.timer--;
            if (s.laser.timer <= 0) {
                s.laser.timer = s.laser.cd;
                let target = this.getRandomEnemy();
                if (target) {
                    let angle = Math.atan2(target.y - this.p.y, target.x - this.p.x);
                    this.addVFX('beam', this.p.x, this.p.y, '#f0f', { angle: angle, size: 400, life: 10 });
                    if (typeof playSnd !== 'undefined') playSnd('hit');
                    if (typeof screenShake !== 'undefined') screenShake(4);
                    // ビームの当たり判定（簡易的な線分判定）
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

        // 4. AURA（周囲持続ダメージ）
        if (s.aura.active) {
            this.addVFX('ring', this.p.x, this.p.y, '#ff0', { size: s.aura.range, life: 2 });
            if (this.timer % 15 === 0) {
                this.checkHitRadius(this.p.x, this.p.y, s.aura.range, s.aura.dmg * baseDmg, 'aura');
            }
        }

        // 5. BOMB（爆撃）
        if (s.bomb.active) {
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

            // プレイヤーへ向かう
            let dx = this.p.x - e.x;
            let dy = this.p.y - e.y;
            let dist = Math.hypot(dx, dy) || 1;
            e.x += (dx / dist) * e.spd;
            e.y += (dy / dist) * e.spd;

            // 敵同士の押し出し（軽量化のため近くの数体だけ判定）
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

            // プレイヤーへのダメージ
            if (dist < e.size + 8) {
                this.p.hp -= (e.maxHp * 0.05); // 敵が強いほど痛い
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
            this.st = 'over';
            if (typeof playSnd !== 'undefined') playSnd('hit');
            if (typeof screenShake !== 'undefined') screenShake(15);
        }
    },

    draw() {
        // 背景クリア
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 16px monospace';
            ctx.fillText('MUSOU INFINITY', 30, 100);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('圧倒的インフレ無双アクション', 15, 130);
            ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? '#ff0' : '#fff';
            ctx.fillText('PRESS (A) TO START', 45, 200);
            return;
        }

        if (typeof applyShake !== 'undefined') applyShake();
        ctx.save();
        ctx.translate(-this.cam.x, -this.cam.y);

        // 無限背景グリッド描画
        ctx.strokeStyle = '#113'; ctx.lineWidth = 1;
        let startX = Math.floor(this.cam.x / 40) * 40;
        let startY = Math.floor(this.cam.y / 40) * 40;
        for (let i = 0; i < 240; i += 40) {
            ctx.beginPath(); ctx.moveTo(startX + i, this.cam.y); ctx.lineTo(startX + i, this.cam.y + 300); ctx.stroke();
        }
        for (let i = 0; i < 340; i += 40) {
            ctx.beginPath(); ctx.moveTo(this.cam.x, startY + i); ctx.lineTo(this.cam.x + 200, startY + i); ctx.stroke();
        }

        // 敵の描画
        for (let e of this.enemies) {
            ctx.fillStyle = e.color;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // VFXの描画 (合成モードで光らせる)
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

        // ダメージテキスト描画
        for (let t of this.texts) {
            ctx.fillStyle = t.color;
            ctx.font = 'bold 10px monospace';
            ctx.globalAlpha = t.life / t.maxLife;
            ctx.fillText(t.text, t.x - 10, t.y);
        }
        ctx.globalAlpha = 1;

        ctx.restore();
        if (typeof resetShake !== 'undefined') resetShake();

        // UI描画
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, 200, 25);
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
        ctx.fillText(`LV:${this.level}  PHASE:${this.phase}`, 5, 10);
        ctx.fillStyle = '#ff0'; ctx.fillText(`KILLS: ${this.formatNum(this.kills)}`, 110, 10);
        
        // HPバー
        ctx.fillStyle = '#400'; ctx.fillRect(5, 15, 80, 5);
        ctx.fillStyle = '#f00'; ctx.fillRect(5, 15, (Math.max(0, this.p.hp) / this.p.maxHp) * 80, 5);
        // EXPバー
        ctx.fillStyle = '#040'; ctx.fillRect(110, 15, 80, 5);
        ctx.fillStyle = '#0f0'; ctx.fillRect(110, 15, (this.exp / this.maxExp) * 80, 5);

        if (this.st === 'over') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 16px monospace';
            ctx.fillText('GAME OVER', 60, 120);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText(`FINAL LEVEL : ${this.level}`, 50, 150);
            ctx.fillText(`TOTAL KILLS : ${this.formatNum(this.kills)}`, 50, 170);
            ctx.fillStyle = '#ff0'; ctx.fillText('PRESS (A) TO RETRY', 45, 220);
        }
    }
};
