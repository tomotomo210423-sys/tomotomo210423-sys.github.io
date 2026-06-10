// === HACKER'S 15 — CYBER PUZZLE SYSTEM v2.0 ===
const PCApp = {
    st: 'title', // title/upload/play/cheat/cheat_swap1/cheat_swap2/clear
    difficulty: 'normal', // easy/normal/hard
    cols: 4, cellSize: 40, boardX: 20, boardY: 50,
    img: null, board: [], cursor: 0,
    hp: 100, timer: 0, clearTime: 0,
    scanTimer: 0, hintPiece: -1,
    cheatSel: 0, swap1: -1,
    titleCur: 1, // 0=easy 1=normal 2=hard
    drops: [], slideAnim: [],
    clearFlash: 0, newRecord: false,

    init() {
        this.st = 'title';
        this.img = null;
        this.slideAnim = [];
        this.timer = 0;
        this.titleCur = 1;
        BGM.stop();
        this.createUI();
        this.drops = [];
        for (let i = 0; i < 20; i++) {
            this.drops.push({ x: i * 10, y: Math.random() * -300, speed: 1 + Math.random() * 2 });
        }
    },

    createUI() {
        let wrap = document.getElementById('hacker-file-wrap');
        if (!wrap) {
            wrap = document.createElement('div');
            wrap.id = 'hacker-file-wrap';
            wrap.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100;display:none;flex-direction:column;gap:15px;align-items:center;width:100%';

            let lbl = document.createElement('label');
            lbl.style.cssText = 'background:#000;color:#0f0;padding:12px 20px;font-family:monospace;font-weight:bold;cursor:pointer;border:2px solid #0f0;box-shadow:0 0 10px #0f0,inset 0 0 10px #0f0;text-shadow:0 0 5px #0f0';
            lbl.innerText = '> UPLOAD_IMAGE.exe';

            let inp = document.createElement('input');
            inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none';
            inp.onchange = (e) => {
                let file = e.target.files[0];
                if (file) {
                    let r = new FileReader();
                    r.onload = ev => { let i = new Image(); i.onload = () => this.setupImage(i); i.src = ev.target.result; };
                    r.readAsDataURL(file);
                }
                wrap.style.display = 'none';
            };

            let cancel = document.createElement('button');
            cancel.innerText = '> LOAD_DEFAULT.bat';
            cancel.style.cssText = 'background:#000;color:#aaa;border:1px solid #aaa;padding:8px 15px;font-family:monospace;box-shadow:0 0 5px #aaa';
            cancel.onclick = () => { wrap.style.display = 'none'; this.generateDefaultImage(); };

            lbl.appendChild(inp); wrap.appendChild(lbl); wrap.appendChild(cancel);
            document.getElementById('screen-container').appendChild(wrap);
        }
    },

    hideUI() { let w = document.getElementById('hacker-file-wrap'); if (w) w.style.display = 'none'; },

    setupDifficulty(diff) {
        this.difficulty = diff;
        if (diff === 'easy')   { this.cols = 3; this.cellSize = 60; this.boardX = 10; this.boardY = 60; }
        if (diff === 'normal') { this.cols = 4; this.cellSize = 40; this.boardX = 20; this.boardY = 50; }
        if (diff === 'hard')   { this.cols = 5; this.cellSize = 32; this.boardX = 20; this.boardY = 50; }
    },

    setupImage(img) {
        let n = this.cols, sz = n * this.cellSize;
        let side = Math.min(img.width, img.height);
        let sx = (img.width - side) / 2, sy = (img.height - side) / 2;
        let offC = document.createElement('canvas'); offC.width = sz; offC.height = sz;
        offC.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, sz, sz);
        let ni = new Image(); ni.onload = () => { this.img = ni; this.startPuzzle(); }; ni.src = offC.toDataURL();
    },

    generateDefaultImage() {
        let n = this.cols, sz = n * this.cellSize;
        let offC = document.createElement('canvas'); offC.width = sz; offC.height = sz;
        let c = offC.getContext('2d');
        let g = c.createLinearGradient(0, 0, sz, sz);
        g.addColorStop(0, '#000510'); g.addColorStop(0.5, '#001a2e'); g.addColorStop(1, '#000510');
        c.fillStyle = g; c.fillRect(0, 0, sz, sz);
        c.strokeStyle = '#0f0'; c.lineWidth = 0.5;
        for (let i = 0; i <= sz; i += sz / n) {
            c.beginPath(); c.moveTo(i, 0); c.lineTo(i, sz); c.stroke();
            c.beginPath(); c.moveTo(0, i); c.lineTo(sz, i); c.stroke();
        }
        c.shadowBlur = 10; c.textAlign = 'center';
        c.fillStyle = '#f0f'; c.shadowColor = '#f0f'; c.font = `bold ${Math.floor(sz/5)}px monospace`;
        c.fillText('SYS', sz / 2, sz * 0.42);
        c.fillStyle = '#0ff'; c.shadowColor = '#0ff';
        c.fillText('HACK', sz / 2, sz * 0.72);
        c.shadowBlur = 0;
        let ni = new Image(); ni.onload = () => { this.img = ni; this.startPuzzle(); }; ni.src = offC.toDataURL();
    },

    startPuzzle() {
        let n = this.cols, total = n * n;
        this.board = [];
        for (let i = 0; i < total; i++) this.board.push(i);
        this.board[total - 1] = -1;
        let empty = total - 1;
        let shuffles = 300 + n * 60;
        for (let i = 0; i < shuffles; i++) {
            let valid = [];
            if (empty >= n) valid.push(-n); if (empty < total - n) valid.push(n);
            if (empty % n !== 0) valid.push(-1); if (empty % n !== n - 1) valid.push(1);
            let m = valid[Math.floor(Math.random() * valid.length)];
            this.board[empty] = this.board[empty + m]; this.board[empty + m] = -1; empty += m;
        }
        this.slideAnim = new Array(total).fill(null).map(() => ({ dx: 0, dy: 0 }));
        this.st = 'play'; this.hp = 100; this.timer = 0;
        this.scanTimer = 0; this.hintPiece = -1;
        this.cursor = 0; this.swap1 = -1; this.clearFlash = 0; this.newRecord = false;
        BGM.play('puzzle');
    },

    checkClear() {
        let n = this.cols, total = n * n;
        for (let i = 0; i < total; i++) { if (this.board[i] !== i && this.board[i] !== -1) return; }
        this.st = 'clear'; this.clearTime = this.timer; this.clearFlash = 60;
        playSnd('combo'); screenShake(4);
        for (let i = 0; i < total; i++) {
            if (this.board[i] === -1) continue;
            let bx = this.boardX + (i % n) * this.cellSize + this.cellSize / 2;
            let by = this.boardY + Math.floor(i / n) * this.cellSize + this.cellSize / 2;
            addParticle(bx, by, '#0ff', 'explosion');
        }
        let diff = this.difficulty, t = this.clearTime;
        if (!SaveSys.data.pcBest) SaveSys.data.pcBest = { easy: 0, normal: 0, hard: 0 };
        if (!SaveSys.data.pcBest[diff] || t < SaveSys.data.pcBest[diff]) {
            SaveSys.data.pcBest[diff] = t; SaveSys.save(); this.newRecord = true;
        }
    },

    update() {
        if (keysDown.select) { this.hideUI(); switchApp(Menu); return; }
        this.timer++;
        let n = this.cols;

        if (this.st === 'title') {
            if (keysDown.up || keysDown.down) {
                this.titleCur = (this.titleCur + (keysDown.up ? -1 : 1) + 3) % 3; playSnd('sel');
            }
            if (keysDown.a) {
                let diffs = ['easy', 'normal', 'hard'];
                this.setupDifficulty(diffs[this.titleCur]);
                this.st = 'upload';
                document.getElementById('hacker-file-wrap').style.display = 'flex';
                playSnd('jmp');
            }
            return;
        }
        if (this.st === 'upload') return;
        if (this.st === 'clear') {
            if (this.clearFlash > 0) this.clearFlash--;
            if (keysDown.a) { this.hideUI(); this.init(); }
            return;
        }
        if (this.scanTimer > 0) this.scanTimer--;

        if (this.st === 'play') {
            if (keysDown.up && this.cursor >= n) { this.cursor -= n; playSnd('sel'); }
            if (keysDown.down && this.cursor < n * n - n) { this.cursor += n; playSnd('sel'); }
            if (keysDown.left && this.cursor % n !== 0) { this.cursor -= 1; playSnd('sel'); }
            if (keysDown.right && this.cursor % n !== n - 1) { this.cursor += 1; playSnd('sel'); }
            if (keysDown.b) { this.st = 'cheat'; this.cheatSel = 0; playSnd('jmp'); }
            if (keysDown.a && this.board[this.cursor] !== -1) {
                let c = this.cursor, moves = [];
                if (c >= n) moves.push(-n); if (c < n * n - n) moves.push(n);
                if (c % n !== 0) moves.push(-1); if (c % n !== n - 1) moves.push(1);
                for (let m of moves) {
                    if (this.board[c + m] === -1) {
                        let dx = 0, dy = 0;
                        if (m === 1)  dx = -this.cellSize; else if (m === -1) dx = this.cellSize;
                        else if (m === n)  dy = -this.cellSize; else if (m === -n) dy = this.cellSize;
                        this.slideAnim[c + m] = { dx, dy };
                        this.board[c + m] = this.board[c]; this.board[c] = -1;
                        playSnd('hit'); this.checkClear(); break;
                    }
                }
            }
        } else if (this.st === 'cheat') {
            if (keysDown.up) { this.cheatSel = (this.cheatSel - 1 + 3) % 3; playSnd('sel'); }
            if (keysDown.down) { this.cheatSel = (this.cheatSel + 1) % 3; playSnd('sel'); }
            if (keysDown.b) { this.st = 'play'; playSnd('sel'); }
            if (keysDown.a) {
                if (this.cheatSel === 0 && this.hp >= 30) {
                    this.hp -= 30; this.st = 'cheat_swap1'; this.swap1 = -1; playSnd('combo');
                } else if (this.cheatSel === 1 && this.hp >= 20) {
                    this.hp -= 20; this.scanTimer = 180; this.st = 'play'; playSnd('combo');
                } else if (this.cheatSel === 2 && this.hp >= 15) {
                    this.hp -= 15; this.hintPiece = -1;
                    for (let i = 0; i < n * n; i++) {
                        if (this.board[i] !== -1 && this.board[i] !== i) { this.hintPiece = i; break; }
                    }
                    this.st = 'play'; playSnd('combo');
                } else { playSnd('hit'); }
            }
        } else if (this.st === 'cheat_swap1' || this.st === 'cheat_swap2') {
            if (keysDown.up && this.cursor >= n) { this.cursor -= n; playSnd('sel'); }
            if (keysDown.down && this.cursor < n * n - n) { this.cursor += n; playSnd('sel'); }
            if (keysDown.left && this.cursor % n !== 0) { this.cursor -= 1; playSnd('sel'); }
            if (keysDown.right && this.cursor % n !== n - 1) { this.cursor += 1; playSnd('sel'); }
            if (keysDown.b) { this.st = 'play'; playSnd('sel'); }
            if (keysDown.a) {
                if (this.st === 'cheat_swap1') {
                    if (this.board[this.cursor] !== -1) { this.swap1 = this.cursor; this.st = 'cheat_swap2'; playSnd('jmp'); }
                } else {
                    if (this.cursor !== this.swap1 && this.board[this.cursor] !== -1) {
                        let tmp = this.board[this.swap1]; this.board[this.swap1] = this.board[this.cursor]; this.board[this.cursor] = tmp;
                        this.st = 'play'; playSnd('combo'); screenShake(3); this.checkClear();
                    }
                }
            }
        }

        for (let s of this.slideAnim) {
            s.dx *= 0.5; s.dy *= 0.5;
            if (Math.abs(s.dx) < 0.5) s.dx = 0;
            if (Math.abs(s.dy) < 0.5) s.dy = 0;
        }
    },

    drawScanlines() {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 300; i += 2) ctx.fillRect(0, i, 200, 1);
    },

    draw() {
        ctx.fillStyle = '#000510'; ctx.fillRect(0, 0, 200, 300);
        let offset = (this.timer * 0.3) % 20;
        ctx.strokeStyle = 'rgba(0,255,255,0.07)'; ctx.lineWidth = 0.5;
        for (let i = 0; i <= 200; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 300); ctx.stroke(); }
        for (let i = -20; i <= 300; i += 20) { ctx.beginPath(); ctx.moveTo(0, i + offset); ctx.lineTo(200, i + offset); ctx.stroke(); }
        ctx.lineWidth = 1;

        if (this.st === 'title') {
            ctx.font = '10px monospace';
            for (let d of this.drops) {
                d.y += d.speed; if (d.y > 310) d.y = -20;
                ctx.fillStyle = `rgba(0,255,0,${0.2 + Math.random() * 0.8})`;
                ctx.fillText(String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96)), d.x, d.y);
            }
            let logoY = 72 + Math.sin(this.timer / 20) * 3;
            ctx.textAlign = 'center';
            if (Math.random() < 0.07) {
                ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.font = 'bold 17px monospace';
                ctx.fillText("HACKER'S 15", 100 + (Math.random()-0.5)*5, logoY + (Math.random()-0.5)*3);
                ctx.fillStyle = 'rgba(0,255,255,0.5)';
                ctx.fillText("HACKER'S 15", 100 - (Math.random()-0.5)*5, logoY + (Math.random()-0.5)*3);
            }
            ctx.shadowBlur = 16; ctx.shadowColor = '#0f0'; ctx.fillStyle = '#0f0';
            ctx.font = 'bold 17px monospace'; ctx.fillText("HACKER'S 15", 100, logoY); ctx.shadowBlur = 0;
            ctx.fillStyle = '#555'; ctx.font = '7px monospace';
            ctx.fillText('CYBER PUZZLE SYSTEM v2.0', 100, logoY + 14);

            ctx.fillStyle = 'rgba(0,0,20,0.88)'; ctx.fillRect(25, 108, 150, 118);
            ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1.5; ctx.strokeRect(25, 108, 150, 118); ctx.lineWidth = 1;
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 9px monospace'; ctx.fillText('SELECT DIFFICULTY', 100, 124);
            ctx.fillStyle = '#0a0'; ctx.fillRect(30, 128, 140, 1);

            let diffs = [
                { key: 'easy',   label: 'EASY   3x3', col: '#4f4' },
                { key: 'normal', label: 'NORMAL 4x4', col: '#ff4' },
                { key: 'hard',   label: 'HARD   5x5', col: '#f44' }
            ];
            ctx.textAlign = 'left';
            if (!SaveSys.data.pcBest) SaveSys.data.pcBest = { easy: 0, normal: 0, hard: 0 };
            for (let i = 0; i < 3; i++) {
                let d = diffs[i], sel = this.titleCur === i;
                ctx.fillStyle = sel ? d.col : '#555';
                ctx.font = sel ? 'bold 11px monospace' : '10px monospace';
                ctx.fillText((sel ? '>' : ' ') + ' ' + d.label, 34, 147 + i * 26);
                let best = SaveSys.data.pcBest[d.key];
                if (best) {
                    ctx.fillStyle = '#888'; ctx.font = '7px monospace';
                    let bs = Math.floor(best / 60);
                    ctx.fillText('BEST ' + bs + 's', 142, 147 + i * 26);
                }
            }
            ctx.textAlign = 'center';
            ctx.fillStyle = '#555'; ctx.font = '8px monospace';
            if (Math.floor(this.timer / 30) % 2 === 0) ctx.fillText('[ A ] EXECUTE', 100, 245);
            this.drawScanlines(); return;
        }

        if (this.st === 'upload') {
            ctx.fillStyle = 'rgba(0,0,0,0.88)'; ctx.fillRect(0, 0, 200, 300);
            this.drawScanlines(); return;
        }

        let n = this.cols, cs = this.cellSize, bx0 = this.boardX, by0 = this.boardY;

        // Difficulty-based board background color
        let boardBgColor = { easy: 'rgba(0,30,10,0.55)', normal: 'rgba(0,15,40,0.55)', hard: 'rgba(30,5,0,0.55)' }[this.difficulty] || 'rgba(0,20,40,0.55)';
        ctx.fillStyle = boardBgColor; ctx.fillRect(bx0 - 3, by0 - 3, n * cs + 6, n * cs + 6);

        // Board glow border
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2;
        ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
        ctx.strokeRect(bx0 - 3, by0 - 3, n * cs + 6, n * cs + 6);
        ctx.shadowBlur = 0; ctx.lineWidth = 1;

        // Clear flash
        if (this.clearFlash > 0) {
            ctx.fillStyle = `rgba(0,255,200,${this.clearFlash / 60 * 0.45})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        for (let i = 0; i < n * n; i++) {
            let col = i % n, row = Math.floor(i / n);
            let sa = this.slideAnim[i] || { dx: 0, dy: 0 };
            let bx = bx0 + col * cs + sa.dx;
            let by = by0 + row * cs + sa.dy;
            let val = this.board[i];

            if (val === -1) {
                // Empty cell: dark grid pattern
                ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(bx, by, cs, cs);
                ctx.strokeStyle = 'rgba(0,100,100,0.3)'; ctx.lineWidth = 0.5;
                for (let gx = 0; gx < cs; gx += 8) {
                    ctx.beginPath(); ctx.moveTo(bx+gx, by); ctx.lineTo(bx+gx, by+cs); ctx.stroke();
                }
                for (let gy = 0; gy < cs; gy += 8) {
                    ctx.beginPath(); ctx.moveTo(bx, by+gy); ctx.lineTo(bx+cs, by+gy); ctx.stroke();
                }
                ctx.lineWidth = 1;
                continue;
            }

            ctx.save();

            // Correct position glow (green)
            let isCorrect = (val === i);
            // Wrong position (subtle red glow)
            let isWrong = !isCorrect;

            if (isCorrect) {
                ctx.shadowBlur = 6; ctx.shadowColor = '#00ff44';
            } else if (isWrong && this.scanTimer <= 0 && this.hintPiece !== i) {
                ctx.shadowBlur = 3; ctx.shadowColor = 'rgba(255,50,50,0.5)';
            }

            if (this.img) {
                ctx.drawImage(this.img, (val % n) * cs, Math.floor(val / n) * cs, cs, cs, bx, by, cs, cs);
            }

            // Piece gradient overlay (makes it look 3D)
            let pieceGrad = ctx.createLinearGradient(bx, by, bx, by+cs);
            pieceGrad.addColorStop(0, 'rgba(255,255,255,0.12)');
            pieceGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
            pieceGrad.addColorStop(1, 'rgba(0,0,0,0.15)');
            ctx.fillStyle = pieceGrad; ctx.fillRect(bx, by, cs, cs);

            // SCAN overlay with large centered number
            if (this.scanTimer > 0) {
                ctx.fillStyle = 'rgba(0,18,0,0.78)'; ctx.fillRect(bx, by, cs, cs);
                ctx.shadowBlur = 6; ctx.shadowColor = '#0f0';
                ctx.fillStyle = '#0f0'; ctx.font = `bold ${cs > 40 ? 18 : cs > 32 ? 14 : 11}px monospace`;
                ctx.textAlign = 'center'; ctx.fillText(val + 1, bx + cs / 2, by + cs / 2 + 5);
                ctx.shadowBlur = 0;
            } else {
                // Piece number overlay (large, centered, with shadow)
                ctx.save();
                ctx.shadowBlur = 3; ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.font = `bold ${cs > 40 ? 14 : cs > 32 ? 11 : 9}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(val + 1, bx + cs / 2, by + cs / 2 + (cs > 32 ? 4 : 3));
                ctx.restore();
            }

            // HINT glow
            if (this.hintPiece === i) {
                let pulse = Math.abs(Math.sin(this.timer * 0.12));
                ctx.strokeStyle = `rgba(255,255,0,${0.5 + pulse * 0.5})`;
                ctx.lineWidth = 3; ctx.shadowBlur = 8 + pulse * 12; ctx.shadowColor = '#ff0';
                ctx.strokeRect(bx + 1.5, by + 1.5, cs - 3, cs - 3);
                ctx.shadowBlur = 0; ctx.lineWidth = 1;
            }

            ctx.restore();

            // 2px black border on every piece
            ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2;
            ctx.strokeRect(bx, by, cs, cs);
            // 1px inner highlight
            ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1;
            ctx.strokeRect(bx + 1, by + 1, cs - 2, cs - 2);
        }

        // Cursor (pulsing cyan glow for selection)
        let cc = this.cursor % n, cr = Math.floor(this.cursor / n);
        let cxp = bx0 + cc * cs, cyp = by0 + cr * cs;
        let isCheat = this.st === 'cheat' || this.st === 'cheat_swap1' || this.st === 'cheat_swap2';
        let pulse = 3 + Math.sin(this.timer * 0.18) * 3;
        let cursorColor = isCheat ? '#f44' : '#0ff';
        ctx.strokeStyle = cursorColor;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = pulse * 2.5; ctx.shadowColor = cursorColor;
        ctx.strokeRect(cxp + 1, cyp + 1, cs - 2, cs - 2);
        // Pulsing fill overlay for cursor
        ctx.fillStyle = isCheat ? `rgba(255,60,60,${0.08 + Math.sin(this.timer*0.18)*0.06})` : `rgba(0,255,255,${0.08 + Math.sin(this.timer*0.18)*0.06})`;
        ctx.fillRect(cxp + 1, cyp + 1, cs - 2, cs - 2);
        ctx.shadowBlur = 0; ctx.lineWidth = 1;

        // Swap1 highlight
        if (this.swap1 !== -1) {
            let s1x = bx0 + (this.swap1 % n) * cs, s1y = by0 + Math.floor(this.swap1 / n) * cs;
            let fp = Math.abs(Math.sin(this.timer * 0.2));
            ctx.fillStyle = `rgba(255,0,0,${0.2 + fp * 0.25})`; ctx.fillRect(s1x, s1y, cs, cs);
            ctx.strokeStyle = '#f44'; ctx.lineWidth = 2; ctx.strokeRect(s1x, s1y, cs, cs); ctx.lineWidth = 1;
        }

        // HUD
        ctx.fillStyle = 'rgba(0,0,0,0.82)'; ctx.fillRect(0, 0, 200, 48);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0ff'; ctx.font = 'bold 8px monospace'; ctx.fillText('TIME:', 8, 15);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace';
        ctx.fillText(Math.floor(this.timer / 60) + 's', 47, 15);
        if (this.scanTimer > 0) {
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 8px monospace';
            ctx.fillText('SCAN:' + Math.ceil(this.scanTimer / 60) + 's', 90, 15);
        }
        ctx.fillStyle = '#333'; ctx.fillRect(8, 22, 90, 9);
        ctx.fillStyle = this.hp < 30 ? '#f44' : (this.hp < 60 ? '#fa0' : '#0f0');
        ctx.fillRect(8, 22, 90 * this.hp / 100, 9);
        ctx.strokeStyle = '#0f0'; ctx.strokeRect(8, 22, 90, 9);
        ctx.fillStyle = '#0f0'; ctx.font = '7px monospace'; ctx.fillText('HP', 102, 30);
        let dColor = { easy: '#4f4', normal: '#ff4', hard: '#f44' }[this.difficulty];
        ctx.fillStyle = dColor; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'right';
        ctx.fillText(this.difficulty.toUpperCase(), 194, 15); ctx.textAlign = 'left';

        // Hint text below board
        let boardBottom = by0 + n * cs;
        if (boardBottom < 278) {
            ctx.fillStyle = '#555'; ctx.font = '7px monospace';
            if (this.st === 'play') ctx.fillText('A:スライド  B:HACKメニュー', 8, boardBottom + 14);
            else if (this.st === 'cheat_swap1') { ctx.fillStyle = '#f44'; ctx.fillText('1枚目を選択 [A]  戻る[B]', 8, boardBottom + 14); }
            else if (this.st === 'cheat_swap2') { ctx.fillStyle = '#f44'; ctx.fillText('2枚目を選択 [A]  戻る[B]', 8, boardBottom + 14); }
        }

        // Cheat menu overlay
        if (this.st === 'cheat') {
            ctx.fillStyle = 'rgba(0,0,18,0.93)'; ctx.fillRect(15, 98, 170, 112);
            ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(15, 98, 170, 112); ctx.lineWidth = 1;
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
            ctx.fillText('OVERRIDE MENU', 100, 116);
            ctx.fillStyle = '#0a0'; ctx.fillRect(20, 120, 160, 1);
            let cheats = [
                { name: 'SWAP  入替', cost: 30 },
                { name: 'SCAN  透視', cost: 20 },
                { name: 'HINT  ヒント', cost: 15 }
            ];
            ctx.textAlign = 'left';
            for (let i = 0; i < 3; i++) {
                let sel = this.cheatSel === i, canAff = this.hp >= cheats[i].cost;
                ctx.fillStyle = sel ? (canAff ? '#ff0' : '#840') : (canAff ? '#888' : '#444');
                ctx.font = sel ? 'bold 10px monospace' : '10px monospace';
                if (sel) { ctx.shadowBlur = 6; ctx.shadowColor = '#ff0'; }
                ctx.fillText((sel ? '>' : ' ') + ' ' + cheats[i].name, 28, 138 + i * 26);
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#555'; ctx.font = '8px monospace';
                ctx.fillText(cheats[i].cost + 'HP', 155, 138 + i * 26);
            }
            ctx.fillStyle = '#444'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
            ctx.fillText('[B] CANCEL', 100, 202);
        }

        // Clear overlay
        if (this.st === 'clear') {
            ctx.fillStyle = 'rgba(0,18,0,0.92)'; ctx.fillRect(20, 88, 160, 112);
            ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(20, 88, 160, 112); ctx.lineWidth = 1;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 14; ctx.shadowColor = '#0f0';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 14px monospace'; ctx.fillText('ACCESS GRANTED', 100, 112);
            ctx.shadowBlur = 0;
            let s = Math.floor(this.clearTime / 60), ms = Math.floor((this.clearTime % 60) * 100 / 60);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText('CLEAR: ' + s + '.' + String(ms).padStart(2, '0') + 's', 100, 132);
            let best = SaveSys.data.pcBest && SaveSys.data.pcBest[this.difficulty];
            if (best) {
                let bs = Math.floor(best / 60), bm = Math.floor((best % 60) * 100 / 60);
                ctx.fillStyle = '#888';
                ctx.fillText('BEST: ' + bs + '.' + String(bm).padStart(2, '0') + 's', 100, 148);
            }
            if (this.newRecord) {
                if (Math.floor(this.timer / 20) % 2 === 0) {
                    ctx.shadowBlur = 10; ctx.shadowColor = '#ff0';
                    ctx.fillStyle = '#ff0'; ctx.font = 'bold 9px monospace';
                    ctx.fillText('*** NEW RECORD! ***', 100, 168);
                    ctx.shadowBlur = 0;
                }
            }
            if (Math.floor(this.timer / 30) % 2 === 0) {
                ctx.fillStyle = '#0f0'; ctx.font = '8px monospace'; ctx.fillText('[A] RETURN', 100, 190);
            }
        }

        this.drawScanlines();
    }
};
