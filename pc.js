// === HACKER'S 15 (Image Upload & Cheat Puzzle - Visual Enhanced) ===
// マトリックス風演出、グリッチエフェクト、サイバーUIを搭載した完全ハッカー仕様

const PCApp = {
    st: 'title',
    mode: 0, // 0: PURE, 1: HACKER
    img: null,
    board: [], 
    cursor: 0,
    hp: 100,
    timer: 0,
    scanTimer: 0,
    cheatSel: 0,
    swap1: -1,
    titleCur: 0,
    drops: [], // デジタルレイン用

    init() {
        this.st = 'title';
        this.img = null;
        BGM.stop();
        this.createUI();
        
        // デジタルレイン（マトリックスの雨）初期化
        this.drops = [];
        for(let i=0; i<20; i++) {
            this.drops.push({ x: i*10, y: Math.random()*-300, speed: 1 + Math.random()*2 });
        }
    },

    // ★ 画像アップロードボタンもハッカー（CUIターミナル）風に魔改造！
    createUI() {
        let wrap = document.getElementById('hacker-file-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'hacker-file-wrap';
            wrap.style.position = 'absolute';
            wrap.style.top = '50%'; wrap.style.left = '50%';
            wrap.style.transform = 'translate(-50%, -50%)';
            wrap.style.zIndex = '100';
            wrap.style.display = 'none';
            wrap.style.flexDirection = 'column';
            wrap.style.gap = '15px';
            wrap.style.alignItems = 'center';
            wrap.style.width = '100%';
            
            let lbl = document.createElement('label');
            lbl.style.background = '#000'; lbl.style.color = '#0f0';
            lbl.style.padding = '12px 20px'; lbl.style.fontFamily = 'monospace';
            lbl.style.fontWeight = 'bold'; lbl.style.cursor = 'pointer';
            lbl.style.border = '2px solid #0f0'; lbl.style.borderRadius = '0px';
            lbl.style.boxShadow = '0 0 10px #0f0, inset 0 0 10px #0f0';
            lbl.style.textShadow = '0 0 5px #0f0';
            lbl.innerText = '> UPLOAD_IMAGE.exe';
            
            let inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
            inp.onchange = (e) => {
                let file = e.target.files[0];
                if(file) {
                    let r = new FileReader();
                    r.onload = ev => {
                        let i = new Image(); i.onload = () => this.setupImage(i); i.src = ev.target.result;
                    };
                    r.readAsDataURL(file);
                }
                wrap.style.display = 'none';
            };
            
            let cancel = document.createElement('button');
            cancel.innerText = '> LOAD_DEFAULT.bat';
            cancel.style.background = '#000'; cancel.style.color = '#aaa';
            cancel.style.border = '1px solid #aaa'; cancel.style.padding = '8px 15px';
            cancel.style.fontFamily = 'monospace'; cancel.style.borderRadius = '0px';
            cancel.style.boxShadow = '0 0 5px #aaa';
            cancel.onclick = () => {
                wrap.style.display = 'none';
                this.generateDefaultImage();
            };

            lbl.appendChild(inp);
            wrap.appendChild(lbl);
            wrap.appendChild(cancel);
            document.getElementById('screen-container').appendChild(wrap);
        }
    },

    hideUI() {
        let wrap = document.getElementById('hacker-file-wrap');
        if (wrap) wrap.style.display = 'none';
    },

    setupImage(img) {
        let size = Math.min(img.width, img.height);
        let sx = (img.width - size) / 2; let sy = (img.height - size) / 2;
        let offC = document.createElement('canvas'); offC.width = 160; offC.height = 160;
        let offCtx = offC.getContext('2d');
        offCtx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160);
        let newImg = new Image();
        newImg.onload = () => { this.img = newImg; this.startPuzzle(); };
        newImg.src = offC.toDataURL();
    },

    generateDefaultImage() {
        let offC = document.createElement('canvas'); offC.width = 160; offC.height = 160;
        let c = offC.getContext('2d');
        c.fillStyle = '#001'; c.fillRect(0,0,160,160);
        c.strokeStyle = '#0f0'; c.lineWidth = 1;
        for(let i=0; i<=160; i+=10) { c.beginPath(); c.moveTo(i,0); c.lineTo(i,160); c.stroke(); c.beginPath(); c.moveTo(0,i); c.lineTo(160,i); c.stroke(); }
        c.fillStyle = '#f0f'; c.font = 'bold 24px monospace'; c.textAlign='center';
        c.fillText('SYSTEM', 80, 70); c.fillText('HACKED', 80, 100);
        let newImg = new Image();
        newImg.onload = () => { this.img = newImg; this.startPuzzle(); };
        newImg.src = offC.toDataURL();
    },

    startPuzzle() {
        this.board = [];
        for(let i=0; i<16; i++) this.board.push(i);
        this.board[15] = -1; 
        
        let empty = 15;
        for(let i=0; i<250; i++) {
            let valid = [];
            if (empty >= 4) valid.push(-4); 
            if (empty <= 11) valid.push(4); 
            if (empty % 4 !== 0) valid.push(-1); 
            if (empty % 4 !== 3) valid.push(1); 
            
            let m = valid[Math.floor(Math.random() * valid.length)];
            this.board[empty] = this.board[empty + m]; this.board[empty + m] = -1; empty += m;
        }
        
        this.st = 'play'; this.hp = 100; this.timer = 0; this.scanTimer = 0;
        this.cursor = 0; this.swap1 = -1;
        BGM.play('puzzle');
    },

    checkClear() {
        let ok = true;
        for(let i=0; i<16; i++) { if (this.board[i] !== i && this.board[i] !== -1) ok = false; }
        if (ok) { this.st = 'clear'; playSnd('combo'); }
    },

    update() {
        if (keysDown.select) { this.hideUI(); switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.up || keysDown.down) { this.titleCur = this.titleCur === 0 ? 1 : 0; playSnd('sel'); }
            if (keysDown.a) {
                this.mode = this.titleCur; 
                this.st = 'upload';
                document.getElementById('hacker-file-wrap').style.display = 'flex'; 
                playSnd('jmp');
            }
            return;
        }
        
        if (this.st === 'upload') return; 
        if (this.st === 'clear') { if (keysDown.a) { this.hideUI(); this.init(); } return; }

        if (this.scanTimer > 0) this.scanTimer--;

        if (this.st === 'play') {
            if (keysDown.up && this.cursor >= 4) { this.cursor -= 4; playSnd('sel'); }
            if (keysDown.down && this.cursor <= 11) { this.cursor += 4; playSnd('sel'); }
            if (keysDown.left && this.cursor % 4 !== 0) { this.cursor -= 1; playSnd('sel'); }
            if (keysDown.right && this.cursor % 4 !== 3) { this.cursor += 1; playSnd('sel'); }

            if (keysDown.b && this.mode === 1) { this.st = 'cheat'; this.cheatSel = 0; playSnd('jmp'); }

            if (keysDown.a && this.board[this.cursor] !== -1) {
                let c = this.cursor; let moves = [];
                if (c >= 4) moves.push(-4); if (c <= 11) moves.push(4);
                if (c % 4 !== 0) moves.push(-1); if (c % 4 !== 3) moves.push(1);

                for (let m of moves) {
                    if (this.board[c + m] === -1) { 
                        this.board[c + m] = this.board[c]; this.board[c] = -1; playSnd('hit');
                        if (this.mode === 1 && this.board[c + m] === c + m) this.hp = Math.min(100, this.hp + 5);
                        this.checkClear(); break;
                    }
                }
            }
        } 
        else if (this.st === 'cheat') {
            if (keysDown.up) { this.cheatSel = (this.cheatSel - 1 + 3) % 3; playSnd('sel'); }
            if (keysDown.down) { this.cheatSel = (this.cheatSel + 1) % 3; playSnd('sel'); }
            if (keysDown.b) { this.st = 'play'; playSnd('sel'); }
            if (keysDown.a) {
                if (this.cheatSel === 0 && this.hp >= 30) { this.hp -= 30; this.st = 'cheat_swap1'; this.swap1 = -1; playSnd('combo'); } 
                else if (this.cheatSel === 1 && this.hp >= 20) { this.hp -= 20; this.scanTimer = 300; this.st = 'play'; playSnd('combo'); } 
                else if (this.cheatSel === 2 && this.hp >= 50) { this.hp -= 50; this.st = 'cheat_del'; playSnd('combo'); } 
                else { playSnd('hit'); } 
            }
        }
        else if (this.st === 'cheat_swap1' || this.st === 'cheat_swap2' || this.st === 'cheat_del') {
            if (keysDown.up && this.cursor >= 4) { this.cursor -= 4; playSnd('sel'); }
            if (keysDown.down && this.cursor <= 11) { this.cursor += 4; playSnd('sel'); }
            if (keysDown.left && this.cursor % 4 !== 0) { this.cursor -= 1; playSnd('sel'); }
            if (keysDown.right && this.cursor % 4 !== 3) { this.cursor += 1; playSnd('sel'); }
            if (keysDown.b) { this.st = 'play'; playSnd('sel'); } 

            if (keysDown.a) {
                if (this.st === 'cheat_swap1') {
                    if (this.board[this.cursor] !== -1) { this.swap1 = this.cursor; this.st = 'cheat_swap2'; playSnd('jmp'); }
                } else if (this.st === 'cheat_swap2') {
                    if (this.cursor !== this.swap1 && this.board[this.cursor] !== -1) {
                        let tmp = this.board[this.swap1]; this.board[this.swap1] = this.board[this.cursor]; this.board[this.cursor] = tmp;
                        this.st = 'play'; playSnd('combo'); screenShake(3); this.checkClear();
                    }
                } else if (this.st === 'cheat_del') {
                    if (this.board[this.cursor] !== -1) {
                        this.board[this.cursor] = -1; this.st = 'play'; playSnd('hit');
                        addParticle(20 + (this.cursor%4)*40 + 20, 50 + Math.floor(this.cursor/4)*40 + 20, '#f00', 'explosion');
                        screenShake(5); this.checkClear();
                    }
                }
            }
        }
    },

    // 画面全体にブラウン管風のスキャンラインを描画する関数
    drawScanlines() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 300; i += 2) { ctx.fillRect(0, i, 200, 1); }
    },

    draw() {
        this.timer++;
        
        // 全体の背景とサイバーグリッド
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)'; ctx.lineWidth = 1;
        let tOffset = (this.timer * 0.5) % 20;
        for (let i = 0; i <= 200; i += 20) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 300); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i + tOffset); ctx.lineTo(200, i + tOffset); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i + tOffset + 100); ctx.lineTo(200, i + tOffset + 100); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, i + tOffset + 200); ctx.lineTo(200, i + tOffset + 200); ctx.stroke();
        }

        if (this.st === 'title') {
            // デジタルレイン（マトリックス風）
            ctx.font = '10px monospace';
            for (let d of this.drops) {
                d.y += d.speed; if (d.y > 300) d.y = -20;
                let char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
                ctx.fillStyle = `rgba(0, 255, 0, ${Math.random()})`;
                ctx.fillText(char, d.x, d.y);
            }

            // タイトルロゴ（グリッチ＆ネオン発光）
            let logoY = 90 + Math.sin(this.timer / 20) * 5;
            ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
            
            // ランダムに発生する色ズレ（色収差グリッチ）
            if (Math.random() < 0.1) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.fillText("HACKER'S 15", 100 - 2 + (Math.random()-0.5)*6, logoY + (Math.random()-0.5)*4);
                ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
                ctx.fillText("HACKER'S 15", 100 + 2 + (Math.random()-0.5)*6, logoY + (Math.random()-0.5)*4);
            }

            ctx.shadowBlur = 15; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0';
            ctx.fillText("HACKER'S 15", 100, logoY); ctx.shadowBlur = 0;

            ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
            ctx.fillText('SYSTEM OVERRIDE PUZZLE', 100, logoY + 25);
            
            // ターミナル風のモード選択UI
            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; ctx.fillRect(15, 170, 170, 60);
            ctx.strokeStyle = '#0f0'; ctx.strokeRect(15, 170, 170, 60);

            ctx.fillStyle = this.titleCur === 0 ? '#ff0' : '#080'; 
            ctx.fillText((this.titleCur===0 ? '> ' : '  ') + 'PURE MODE', 30, 195);
            ctx.fillStyle = this.titleCur === 1 ? '#ff0' : '#080'; 
            ctx.fillText((this.titleCur===1 ? '> ' : '  ') + 'HACKER MODE', 30, 215);

            ctx.fillStyle = '#666'; ctx.textAlign = 'center';
            if (Math.floor(this.timer / 30) % 2 === 0) ctx.fillText('PRESS [A] TO EXECUTE', 100, 260);
            
            this.drawScanlines();
            return;
        }

        if (this.st === 'upload') { 
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 300); 
            this.drawScanlines(); return; 
        }

        // === プレイ画面描画 ===
        
        // ハッカーモード特有の画面揺れ（グリッチ）
        let glitchX = 0; let glitchY = 0;
        if (this.mode === 1 && this.timer % 100 < 5) {
            glitchX = (Math.random() - 0.5) * 6; glitchY = (Math.random() - 0.5) * 6;
        }

        // パズル枠（サイバー風）
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = '#0ff';
        ctx.strokeRect(19, 49, 162, 162); ctx.lineWidth = 1; ctx.shadowBlur = 0;

        for (let i = 0; i < 16; i++) {
            let bx = 20 + (i % 4) * 40; let by = 50 + Math.floor(i / 4) * 40;
            let val = this.board[i];
            
            if (val !== -1) {
                let sx = (val % 4) * 40; let sy = Math.floor(val / 4) * 40;
                
                // 色反転バグエフェクト
                if (this.mode === 1 && Math.random() < 0.01) ctx.filter = 'invert(100%) hue-rotate(90deg)';
                
                if (this.img) ctx.drawImage(this.img, sx, sy, 40, 40, bx + glitchX, by + glitchY, 40, 40);
                ctx.filter = 'none';

                // ピースの境界線（立体感）
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'; ctx.strokeRect(bx, by, 40, 40);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; ctx.strokeRect(bx+1, by+1, 38, 38);

                // SCAN(透視)チート発動中
                if (this.scanTimer > 0) {
                    ctx.fillStyle = 'rgba(0,25,0,0.7)'; ctx.fillRect(bx, by, 40, 40);
                    ctx.shadowBlur = 5; ctx.shadowColor = '#0f0';
                    ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; 
                    ctx.fillText(val + 1, bx + 10, by + 28);
                    ctx.shadowBlur = 0;
                }
            } else {
                ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(bx, by, 40, 40); // 空白（黒抜き）
            }
        }

        // カーソル描画（チート時は赤色、通常は黄色）
        let cx = 20 + (this.cursor % 4) * 40; let cy = 50 + Math.floor(this.cursor / 4) * 40;
        ctx.strokeStyle = (this.st.includes('cheat')) ? '#f00' : '#ff0';
        ctx.lineWidth = 3; ctx.strokeRect(cx, cy, 40, 40); ctx.lineWidth = 1;

        // SWAPチート選択中の1つ目のピース
        if (this.swap1 !== -1) {
            let s1x = 20 + (this.swap1 % 4) * 40; let s1y = 50 + Math.floor(this.swap1 / 4) * 40;
            ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(s1x, s1y, 40, 40);
        }

        // UI（時間・HP）
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, 200, 30);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px monospace';
        let timeStr = Math.floor(this.timer / 60) + 's';
        ctx.fillText(`TIME: ${timeStr}`, 15, 20);
        
        if (this.mode === 1) { 
            ctx.fillStyle = '#0f0'; ctx.fillText(`HP:`, 110, 20); 
            ctx.fillStyle = this.hp < 30 ? '#f00' : '#0f0';
            ctx.fillRect(135, 12, 50 * (this.hp/100), 8); // HPバー
            ctx.strokeStyle = '#fff'; ctx.strokeRect(135, 12, 50, 8);
        }

        // 操作説明（下部）
        ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
        if (this.st === 'play') {
            ctx.fillText('A:スライド', 20, 230);
            if (this.mode === 1) { ctx.fillStyle='#0ff'; ctx.fillText('B:HACK MENU(チート)', 80, 230); }
        } else if (this.st === 'cheat_swap1') { ctx.fillStyle = '#f00'; ctx.fillText('1つ目のピースを選択 (A)', 20, 230);
        } else if (this.st === 'cheat_swap2') { ctx.fillStyle = '#f00'; ctx.fillText('2つ目のピースを選択 (A)', 20, 230);
        } else if (this.st === 'cheat_del') { ctx.fillStyle = '#f00'; ctx.fillText('破壊するピースを選択 (A)', 20, 230); }

        // ハックメニュー（チート）
        if (this.st === 'cheat') {
            ctx.fillStyle = 'rgba(0,0,20,0.9)'; ctx.fillRect(15, 90, 170, 100); 
            ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(15, 90, 170, 100); ctx.lineWidth=1;
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace'; ctx.fillText('OVERRIDE MENU', 55, 110);
            ctx.fillStyle = '#0a0'; ctx.fillRect(20, 115, 160, 1);
            
            let cheats = [ { name: 'SWAP(強制入替)', cost: 30 }, { name: 'SCAN(透視)', cost: 20 }, { name: 'DELETE(破壊)', cost: 50 } ];
            ctx.font = '10px monospace';
            for(let i=0; i<3; i++) {
                let mark = (this.cheatSel === i) ? '▶' : ' ';
                ctx.fillStyle = (this.hp >= cheats[i].cost) ? (this.cheatSel === i ? '#ff0' : '#fff') : '#555';
                ctx.fillText(`${mark}${cheats[i].name}`, 30, 135 + i * 20);
                ctx.fillText(`${cheats[i].cost}HP`, 135, 135 + i * 20);
            }
        }

        // クリア画面
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,20,0,0.9)'; ctx.fillRect(20, 100, 160, 80);
            ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(20, 100, 160, 80);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 20px monospace'; ctx.fillText('ACCESS GRANTED', 25, 135);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`CLEAR TIME: ${timeStr}`, 55, 155); 
            ctx.fillText('PRESS [A] TO RETURN', 45, 170);
        }

        // 全体にブラウン管の走査線を重ねる
        this.drawScanlines();
    }
};
