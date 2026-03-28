// === RIFUJIN BROTHERS (Action) - Texture Embedded & Smooth Camera Edition ===
// テクスチャバグとカメラの爆速移動を完全修正した理不尽アクション！

// ★ アクションゲーム専用の独立テクスチャ（これでもうバグらない！）
const ACT_SPRS = {
    p: { d: "........01111000121121001111110004444000404404003003300300033000", pal: {'1':'#f00', '2':'#000', '3':'#222', '4':'#08f'} }, // 主人公（赤）
    e: { d: "........00550000055550005255250055555500557755005555550050000500", pal: {'5':'#a52', '2':'#fff', '7':'#000'} }, // クリボー風の敵
    c: { d: "........0088000008aa80008a88a8008a88a8008a88a80008aa800000880000", pal: {'8':'#da0', 'a':'#ff0'} }, // コイン
    b: { d: "4444444443333334433333344333333443333334433333344333333444444444", pal: {'3':'#c84', '4':'#000'} }, // レンガブロック
    s: { d: "....................................66....6666..666666.666666666", pal: {'6':'#ddd'} }, // トゲ
    f: { d: "........00880000085580008588580085885800858858000855800000880000", pal: {'8':'#da0', '5':'#f00'} }  // 偽コイン（少し赤い）
};

const Action = {
    st: 'title', 
    stage: 1, maxStage: 5, lives: 3, 
    camX: 0, 
    p: { x: 30, y: 100, vx: 0, vy: 0, w: 12, h: 14, grounded: false, coyote: 0, state: 'idle' },
    objs: [], particles: [], 
    ts: 16, // タイルサイズ

    // マップデータ (0:空, 1:床/ブロック, 2:トゲ, 3:コイン, 4:隠しブロック, 5:偽コイン(死), 6:敵, 9:ゴール)
    maps: [
        // Stage 1: 理不尽の始まり（隠しブロックの罠）
        [
            "                                                  ",
            "                                                  ",
            "                                                  ",
            "                                                  ",
            "                                                  ",
            "          4       3    b     4    6             9 ",
            "      111111     111        111  11111       11111",
            "                                                  ",
            "11111        111     222222            22222      ",
            "11111111111111111111111111111111111111111111111111"
        ],
        // Stage 2: 偽コインの誘惑
        [
            "                                                  ",
            "                                                  ",
            "                                                  ",
            "                                333               ",
            "           111                  111               ",
            "      6   1   1  3 5 3    6               6     9 ",
            "    111111     1 11111  1111111      111111  11111",
            "                                                  ",
            "111                             2222              ",
            "11111111111111111111111111111111111111111111111111"
        ]
        // ※コード軽量化のため2ステージ構成でループします
    ],
    mapW: 50, mapH: 10, currentMap: [],

    init() {
        this.st = 'title';
        this.stage = SaveSys.data.actStage || 1;
        this.lives = SaveSys.data.actLives || 5;
        BGM.play('menu');
    },

    loadStage() {
        let mIdx = (this.stage - 1) % this.maps.length;
        let rawMap = this.maps[mIdx];
        this.mapW = rawMap[0].length;
        this.mapH = rawMap.length;
        this.currentMap = [];
        this.objs = [];

        for (let y = 0; y < this.mapH; y++) {
            let row = [];
            for (let x = 0; x < this.mapW; x++) {
                let c = rawMap[y][x];
                let t = 0;
                if (c === '1') t = 1;
                else if (c === '2') t = 2;
                else if (c === '3') t = 3;
                else if (c === '4') t = 4;
                else if (c === '5') t = 5;
                else if (c === '6') { t = 0; this.objs.push({ type: 'enemy', x: x * this.ts, y: y * this.ts, vx: -0.5, vy: 0, w: 12, h: 12 }); }
                else if (c === '9') t = 9;
                else if (c === 'b') t = 1; // 見た目だけ変えたい場合は拡張可能
                row.push(t);
            }
            this.currentMap.push(row);
        }

        this.p = { x: 30, y: 50, vx: 0, vy: 0, w: 12, h: 14, grounded: false, coyote: 0, state: 'idle' };
        this.camX = 0;
        this.st = 'play';
        BGM.play('action');
    },

    getTile(tx, ty) {
        if (tx < 0 || tx >= this.mapW || ty < 0 || ty >= this.mapH) return 0;
        return this.currentMap[ty][tx];
    },

    setTile(tx, ty, val) {
        if (tx >= 0 && tx < this.mapW && ty >= 0 && ty < this.mapH) {
            this.currentMap[ty][tx] = val;
        }
    },

    die() {
        this.st = 'miss';
        this.lives--;
        playSnd('hit');
        screenShake(10);
        BGM.stop();
        this.p.vy = -5; // 死亡ジャンプ
        SaveSys.data.actLives = this.lives;
        SaveSys.save();
    },

    drawActSprite(x, y, sName) {
        let s = ACT_SPRS[sName];
        if (!s) return;
        let scale = 2; // 16x16に拡大表示
        let ox = x - 2; let oy = y - 2;
        for (let i = 0; i < 64; i++) {
            let p = s.d[i];
            if (p !== '0' && p !== '.') {
                ctx.fillStyle = s.pal[p];
                ctx.fillRect(ox + (i % 8) * scale, oy + Math.floor(i / 8) * scale, scale, scale);
            }
        }
    },

    update() {
        let kD = typeof keysDown !== 'undefined' ? keysDown : {};
        let k = typeof keys !== 'undefined' ? keys : {};

        if (this.st === 'title') {
            if (kD.a) { this.loadStage(); playSnd('jmp'); }
            return;
        }
        
        if (this.st === 'miss') {
            this.p.y += this.p.vy;
            this.p.vy += 0.3;
            if (this.p.y > 400) {
                if (this.lives > 0) {
                    this.loadStage();
                } else {
                    this.st = 'gameover';
                    SaveSys.data.actStage = 1; SaveSys.data.actLives = 5; SaveSys.save();
                }
            }
            return;
        }

        if (this.st === 'gameover') {
            if (kD.a) { this.init(); }
            return;
        }

        if (this.st === 'clear') {
            if (kD.a) {
                this.stage++;
                SaveSys.data.actStage = this.stage; SaveSys.save();
                this.loadStage();
            }
            return;
        }

        // --- プレイヤー移動処理 ---
        if (k.left) this.p.vx -= 0.5;
        if (k.right) this.p.vx += 0.5;
        
        this.p.vx *= 0.8; // 摩擦
        if (Math.abs(this.p.vx) < 0.1) this.p.vx = 0;
        this.p.vy += 0.3; // 重力

        // コヨーテタイム（落下直後でもジャンプできる猶予）
        if (this.p.grounded) this.p.coyote = 5;
        else if (this.p.coyote > 0) this.p.coyote--;

        if (kD.a && this.p.coyote > 0) {
            this.p.vy = -6;
            this.p.grounded = false;
            this.p.coyote = 0;
            playSnd('jmp');
        }

        // X軸移動と衝突
        this.p.x += this.p.vx;
        let colX = false;
        let pL = this.p.x, pR = this.p.x + this.p.w, pT = this.p.y, pB = this.p.y + this.p.h;
        
        // 判定用のタイル座標
        let tx1 = Math.floor(pL / this.ts), tx2 = Math.floor(pR / this.ts);
        let ty1 = Math.floor(pT / this.ts), ty2 = Math.floor(pB / this.ts);

        for (let ty = ty1; ty <= ty2; ty++) {
            for (let tx = tx1; tx <= tx2; tx++) {
                let t = this.getTile(tx, ty);
                if (t === 1) { colX = true; break; }
                if (t === 9) { this.st = 'clear'; playSnd('combo'); return; }
                if (t === 2) { this.die(); return; } // トゲ
                if (t === 3) { this.setTile(tx, ty, 0); playSnd('sel'); } // コイン
                if (t === 5) { this.die(); return; } // 偽コイン(即死罠)
            }
            if (colX) break;
        }

        if (colX) {
            this.p.x -= this.p.vx;
            this.p.vx = 0;
        }

        // Y軸移動と衝突
        this.p.y += this.p.vy;
        let colY = false;
        this.p.grounded = false;
        
        pL = this.p.x; pR = this.p.x + this.p.w; pT = this.p.y; pB = this.p.y + this.p.h;
        tx1 = Math.floor(pL / this.ts); tx2 = Math.floor(pR / this.ts);
        ty1 = Math.floor(pT / this.ts); ty2 = Math.floor(pB / this.ts);

        for (let ty = ty1; ty <= ty2; ty++) {
            for (let tx = tx1; tx <= tx2; tx++) {
                let t = this.getTile(tx, ty);
                
                // 下から叩いた時の隠しブロック出現処理
                if (t === 4 && this.p.vy < 0 && Math.abs(this.p.y - ((ty+1)*this.ts)) < 5) {
                    this.setTile(tx, ty, 1); // ブロック実体化
                    playSnd('hit');
                    this.p.y = (ty + 1) * this.ts;
                    this.p.vy = 0;
                    colY = true;
                    break;
                }

                if (t === 1) { 
                    colY = true; 
                    if (this.p.vy > 0) { // 着地
                        this.p.y = ty * this.ts - this.p.h;
                        this.p.grounded = true;
                    } else if (this.p.vy < 0) { // 天井ヒット
                        this.p.y = (ty + 1) * this.ts;
                    }
                    break; 
                }
            }
            if (colY) { this.p.vy = 0; break; }
        }

        // 落下死
        if (this.p.y > 300) { this.die(); return; }

        // 敵の処理
        for (let i = this.objs.length - 1; i >= 0; i--) {
            let e = this.objs[i];
            if (e.type === 'enemy') {
                e.vy += 0.3;
                e.x += e.vx; e.y += e.vy;
                
                // 敵の床判定
                let eTx = Math.floor((e.x + e.w/2) / this.ts);
                let eTy = Math.floor((e.y + e.h) / this.ts);
                if (this.getTile(eTx, eTy) === 1) {
                    e.y = eTy * this.ts - e.h;
                    e.vy = 0;
                }
                
                // 敵の壁反転
                if (this.getTile(Math.floor((e.x + (e.vx>0?e.w:0))/this.ts), Math.floor((e.y+e.h/2)/this.ts)) === 1) {
                    e.vx *= -1;
                }

                // プレイヤーとの当たり判定
                if (this.p.x < e.x + e.w && this.p.x + this.p.w > e.x && this.p.y < e.y + e.h && this.p.y + this.p.h > e.y) {
                    if (this.p.vy > 0 && this.p.y + this.p.h < e.y + e.h / 2) {
                        // 踏んで倒す
                        this.p.vy = -4;
                        playSnd('hit');
                        this.objs.splice(i, 1);
                    } else {
                        this.die(); return;
                    }
                }
            }
        }

        // ★ カメラの爆速スクロールを完全修正！
        // プレイヤーの位置を基準に、滑らかに追従する（lerp）
        let targetCamX = this.p.x - 90; // 画面の中心より少し左にプレイヤーを置く
        if (targetCamX < 0) targetCamX = 0;
        if (targetCamX > this.mapW * this.ts - 200) targetCamX = this.mapW * this.ts - 200;
        
        // 0.1の速度でフワッと追従する（これが酔わない秘訣！）
        this.camX += (targetCamX - this.camX) * 0.1;
    },

    draw() {
        ctx.fillStyle = '#5af'; ctx.fillRect(0, 0, 200, 300); // 空の背景

        if (this.st === 'title') {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0,0,200,300);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.fillText('理不尽ブラザーズ', 15, 100);
            ctx.fillStyle = '#ff0'; ctx.font = '10px monospace'; ctx.fillText('PRESS A TO START', 55, 180);
            return;
        }

        ctx.save();
        ctx.translate(-Math.floor(this.camX), 0); // カメラの小数点切り捨てでチラつき防止

        // マップ描画
        for (let y = 0; y < this.mapH; y++) {
            for (let x = 0; x < this.mapW; x++) {
                let px = x * this.ts, py = y * this.ts;
                if (px < this.camX - this.ts || px > this.camX + 200) continue; // 画面外は描画スキップ

                let t = this.currentMap[y][x];
                if (t === 1) this.drawActSprite(px, py, 'b');
                if (t === 2) this.drawActSprite(px, py, 's');
                if (t === 3) this.drawActSprite(px, py, 'c');
                if (t === 5) this.drawActSprite(px, py, 'f'); // 偽コイン
                if (t === 9) { ctx.fillStyle = '#fff'; ctx.fillRect(px, py, this.ts, this.ts); ctx.fillStyle='#000'; ctx.fillText('G', px+2, py+12); }
            }
        }

        // オブジェクト描画
        for (let e of this.objs) {
            if (e.type === 'enemy') this.drawActSprite(e.x, e.y, 'e');
        }

        // プレイヤー描画 (ミス時は逆さまに)
        if (this.st === 'miss') {
            ctx.save(); ctx.translate(this.p.x + this.p.w/2, this.p.y + this.p.h/2); ctx.scale(1, -1);
            this.drawActSprite(-this.p.w/2, -this.p.h/2, 'p');
            ctx.restore();
        } else {
            this.drawActSprite(this.p.x, this.p.y, 'p');
        }

        ctx.restore();

        // UI描画
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 20);
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
        ctx.fillText(`STAGE: ${this.stage}`, 10, 14);
        ctx.fillStyle = '#f00'; ctx.fillText(`LIVES: ${this.lives}`, 140, 14);

        if (this.st === 'gameover') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            ctx.fillStyle = '#f00'; ctx.font = 'bold 24px monospace'; ctx.fillText('GAME OVER', 40, 140);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS A TO RESTART', 50, 180);
        }
        
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,200,300);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText('STAGE CLEAR!', 35, 140);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('PRESS A TO NEXT', 55, 180);
        }
    }
};
