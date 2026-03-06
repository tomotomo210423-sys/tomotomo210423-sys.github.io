// === HACKER'S 15 (Image Upload & Cheat Puzzle) ===
// 好きな画像をロード可能。解けない時はハッキング（チート）で破壊しろ！

const PCApp = {
    st: 'title',
    mode: 0, // 0: PURE, 1: HACKER
    img: null,
    board: [], // 盤面の状態 (0〜15, -1は空白)
    cursor: 0,
    hp: 100,
    timer: 0,
    scanTimer: 0,
    cheatSel: 0,
    swap1: -1,
    titleCur: 0,

    init() {
        this.st = 'title';
        this.img = null;
        BGM.stop();
        this.createUI();
    },

    // ★ HTMLをいじらずに画像アップロードボタンを動的生成する魔法
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
            lbl.style.background = '#0f0'; lbl.style.color = '#000';
            lbl.style.padding = '12px 20px'; lbl.style.fontFamily = 'monospace';
            lbl.style.fontWeight = 'bold'; lbl.style.cursor = 'pointer';
            lbl.style.border = '2px solid #fff'; lbl.style.borderRadius = '8px';
            lbl.style.boxShadow = '0 4px 0 #080';
            lbl.innerText = '📁 画像をアップロード';
            
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
            cancel.innerText = 'デフォルト画像で遊ぶ';
            cancel.style.background = '#444'; cancel.style.color = '#fff';
            cancel.style.border = '1px solid #888'; cancel.style.padding = '8px 15px';
            cancel.style.fontFamily = 'monospace'; cancel.style.borderRadius = '5px';
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

    // どんな画像でもパズル用に160x160の正方形に自動トリミング
    setupImage(img) {
        let size = Math.min(img.width, img.height);
        let sx = (img.width - size) / 2;
        let sy = (img.height - size) / 2;
        let offC = document.createElement('canvas');
        offC.width = 160; offC.height = 160;
        let offCtx = offC.getContext('2d');
        offCtx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160);
        let newImg = new Image();
        newImg.onload = () => { this.img = newImg; this.startPuzzle(); };
        newImg.src = offC.toDataURL();
    },

    generateDefaultImage() {
        let offC = document.createElement('canvas');
        offC.width = 160; offC.height = 160;
        let c = offC.getContext('2d');
        c.fillStyle = '#000'; c.fillRect(0,0,160,160);
        c.strokeStyle = '#0f0'; c.lineWidth = 2;
        for(let i=0; i<8; i++) { c.beginPath(); c.arc(80, 80, i*15, 0, Math.PI*2); c.stroke(); }
        c.fillStyle = '#f0f'; c.font = 'bold 24px monospace'; c.textAlign='center';
        c.fillText('SYSTEM', 80, 70); c.fillText('HACKED', 80, 100);
        let newImg = new Image();
        newImg.onload = () => { this.img = newImg; this.startPuzzle(); };
        newImg.src = offC.toDataURL();
    },

    startPuzzle() {
        this.board = [];
        for(let i=0; i<16; i++) this.board.push(i);
        this.board[15] = -1; // 15番は「空白」
        
        // 確実に解けるように、逆算してシャッフルする
        let empty = 15;
        for(let i=0; i<250; i++) {
            let valid = [];
            if (empty >= 4) valid.push(-4); // 上
            if (empty <= 11) valid.push(4); // 下
            if (empty % 4 !== 0) valid.push(-1); // 左
            if (empty % 4 !== 3) valid.push(1); // 右
            
            let m = valid[Math.floor(Math.random() * valid.length)];
            this.board[empty] = this.board[empty + m];
            this.board[empty + m] = -1;
            empty += m;
        }
        
        this.st = 'play'; this.hp = 100; this.timer = 0; this.scanTimer = 0;
        this.cursor = 0; this.swap1 = -1;
        BGM.play('action'); 
    },

    checkClear() {
        let ok = true;
        for(let i=0; i<16; i++) {
            // 元の場所にあるか、またはDELETEで破壊されて空白(-1)になっていればOK
            if (this.board[i] !== i && this.board[i] !== -1) ok = false;
        }
        if (ok) { this.st = 'clear'; playSnd('combo'); }
    },

    update() {
        if (keysDown.select) { this.hideUI(); switchApp(Menu); return; }

        if (this.st === 'title') {
            if (keysDown.up || keysDown.down) { this.titleCur = this.titleCur === 0 ? 1 : 0; playSnd('sel'); }
            if (keysDown.a) {
                this.mode = this.titleCur; // 0: PURE, 1: HACKER
                this.st = 'upload';
                document.getElementById('hacker-file-wrap').style.display = 'flex'; // ボタン表示
                playSnd('jmp');
            }
            return;
        }
        
        if (this.st === 'upload') return; // UI操作待ち
        if (this.st === 'clear') { if (keysDown.a) { this.hideUI(); this.init(); } return; }

        this.timer++;
        if (this.scanTimer > 0) this.scanTimer--;

        if (this.st === 'play') {
            // 十字キーでカーソル移動
            if (keysDown.up && this.cursor >= 4) { this.cursor -= 4; playSnd('sel'); }
            if (keysDown.down && this.cursor <= 11) { this.cursor += 4; playSnd('sel'); }
            if (keysDown.left && this.cursor % 4 !== 0) { this.cursor -= 1; playSnd('sel'); }
            if (keysDown.right && this.cursor % 4 !== 3) { this.cursor += 1; playSnd('sel'); }

            // HACKER MODE でBボタン：チートメニュー起動
            if (keysDown.b && this.mode === 1) { this.st = 'cheat'; this.cheatSel = 0; playSnd('jmp'); }

            // Aボタン：スライド実行
            if (keysDown.a && this.board[this.cursor] !== -1) {
                let c = this.cursor; let moves = [];
                if (c >= 4) moves.push(-4); if (c <= 11) moves.push(4);
                if (c % 4 !== 0) moves.push(-1); if (c % 4 !== 3) moves.push(1);

                for (let m of moves) {
                    if (this.board[c + m] === -1) { // 隣が空白ならスライド
                        this.board[c + m] = this.board[c];
                        this.board[c] = -1;
                        playSnd('hit');
                        
                        // 正解の場所に置けたらHP回復！
                        if (this.mode === 1 && this.board[c + m] === c + m) {
                            this.hp = Math.min(100, this.hp + 5);
                        }
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
                else { playSnd('hit'); } // HP不足
            }
        }
        else if (this.st === 'cheat_swap1' || this.st === 'cheat_swap2' || this.st === 'cheat_del') {
            if (keysDown.up && this.cursor >= 4) { this.cursor -= 4; playSnd('sel'); }
            if (keysDown.down && this.cursor <= 11) { this.cursor += 4; playSnd('sel'); }
            if (keysDown.left && this.cursor % 4 !== 0) { this.cursor -= 1; playSnd('sel'); }
            if (keysDown.right && this.cursor % 4 !== 3) { this.cursor += 1; playSnd('sel'); }
            
            if (keysDown.b) { this.st = 'play'; playSnd('sel'); } // キャンセル

            if (keysDown.a) {
                if (this.st === 'cheat_swap1') {
                    if (this.board[this.cursor] !== -1) { this.swap1 = this.cursor; this.st = 'cheat_swap2'; playSnd('jmp'); }
                } else if (this.st === 'cheat_swap2') {
                    if (this.cursor !== this.swap1 && this.board[this.cursor] !== -1) {
                        // 強制入れ替え！
                        let tmp = this.board[this.swap1]; this.board[this.swap1] = this.board[this.cursor]; this.board[this.cursor] = tmp;
                        this.st = 'play'; playSnd('combo'); screenShake(3); this.checkClear();
                    }
                } else if (this.st === 'cheat_del') {
                    if (this.board[this.cursor] !== -1) {
                        // ピースを物理的に破壊！！
                        this.board[this.cursor] = -1; 
                        this.st = 'play'; playSnd('hit');
                        addParticle(20 + (this.cursor%4)*40 + 20, 50 + Math.floor(this.cursor/4)*40 + 20, '#f00', 'explosion');
                        screenShake(5); this.checkClear();
                    }
                }
            }
        }
    },

    draw() {
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);

        if (this.st === 'title') {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText("HACKER'S 15", 35, 80);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('～ズルできるパズル～', 40, 105);
            
            ctx.fillStyle = this.titleCur === 0 ? '#ff0' : '#fff'; ctx.fillText((this.titleCur===0 ? '▶ ' : '  ') + 'PURE MODE', 50, 180);
            ctx.fillStyle = this.titleCur === 1 ? '#ff0' : '#fff'; ctx.fillText((this.titleCur===1 ? '▶ ' : '  ') + 'HACKER MODE', 50, 200);
            ctx.fillStyle = '#888'; ctx.fillText('A:決定  SEL:戻る', 50, 280);
            return;
        }

        if (this.st === 'upload') { ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 200, 300); return; } // UI表示用

        // === プレイ画面描画 ===
        
        let glitchX = 0; let glitchY = 0;
        if (this.mode === 1 && this.timer % 60 < 5) {
            glitchX = (Math.random() - 0.5) * 4; glitchY = (Math.random() - 0.5) * 4;
        }

        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(19, 49, 162, 162); ctx.lineWidth = 1;

        for (let i = 0; i < 16; i++) {
            let bx = 20 + (i % 4) * 40; let by = 50 + Math.floor(i / 4) * 40;
            let val = this.board[i];
            
            if (val !== -1) {
                let sx = (val % 4) * 40; let sy = Math.floor(val / 4) * 40;
                if (this.mode === 1 && Math.random() < 0.01) ctx.filter = 'invert(100%)';
                
                if (this.img) ctx.drawImage(this.img, sx, sy, 40, 40, bx + glitchX, by + glitchY, 40, 40);
                ctx.filter = 'none';

                ctx.strokeStyle = '#000'; ctx.strokeRect(bx, by, 40, 40);

                if (this.scanTimer > 0) {
                    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(bx, by, 40, 40);
                    ctx.fillStyle = '#0f0'; ctx.font = 'bold 20px monospace'; ctx.fillText(val + 1, bx + 8, by + 28);
                }
            } else {
                ctx.fillStyle = '#222'; ctx.fillRect(bx, by, 40, 40); // 空白
            }
        }

        // カーソル
        let cx = 20 + (this.cursor % 4) * 40; let cy = 50 + Math.floor(this.cursor / 4) * 40;
        ctx.strokeStyle = (this.st.includes('cheat')) ? '#f00' : '#ff0';
        ctx.lineWidth = 3; ctx.strokeRect(cx, cy, 40, 40); ctx.lineWidth = 1;

        if (this.swap1 !== -1) {
            let s1x = 20 + (this.swap1 % 4) * 40; let s1y = 50 + Math.floor(this.swap1 / 4) * 40;
            ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(s1x, s1y, 40, 40);
        }

        ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
        let timeStr = Math.floor(this.timer / 60) + 's';
        ctx.fillText(`TIME:${timeStr}`, 20, 25);
        if (this.mode === 1) { ctx.fillStyle = '#0f0'; ctx.fillText(`HP:${this.hp}`, 120, 25); }

        ctx.fillStyle = '#aaa'; ctx.font = '9px monospace';
        if (this.st === 'play') {
            ctx.fillText('A:スライド', 20, 230);
            if (this.mode === 1) ctx.fillText('B:ハッキング(チート)', 80, 230);
        } else if (this.st === 'cheat_swap1') { ctx.fillStyle = '#f00'; ctx.fillText('1つ目のピースを選択 (A)', 20, 230);
        } else if (this.st === 'cheat_swap2') { ctx.fillStyle = '#f00'; ctx.fillText('2つ目のピースを選択 (A)', 20, 230);
        } else if (this.st === 'cheat_del') { ctx.fillStyle = '#f00'; ctx.fillText('破壊するピースを選択 (A)', 20, 230); }

        if (this.st === 'cheat') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(20, 100, 160, 100); ctx.strokeStyle = '#0f0'; ctx.strokeRect(20, 100, 160, 100);
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 12px monospace'; ctx.fillText('HACK MENU', 60, 120);
            
            let cheats = [ { name: 'SWAP', cost: 30 }, { name: 'SCAN', cost: 20 }, { name: 'DELETE', cost: 50 } ];
            ctx.font = '10px monospace';
            for(let i=0; i<3; i++) {
                let mark = (this.cheatSel === i) ? '▶' : ' ';
                ctx.fillStyle = (this.hp >= cheats[i].cost) ? (this.cheatSel === i ? '#ff0' : '#fff') : '#555';
                ctx.fillText(`${mark}${cheats[i].name} (${cheats[i].cost}HP)`, 40, 145 + i * 20);
            }
        }

        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(20, 100, 160, 80);
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 20px monospace'; ctx.fillText('CLEAR!!', 60, 135);
            ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText(`TIME: ${timeStr}`, 70, 155); ctx.fillText('PRESS [A]', 75, 170);
        }
    }
};
