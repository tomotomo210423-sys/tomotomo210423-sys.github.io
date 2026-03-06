// === RETRO-OS (Canvas Fake Desktop System v2.1) ===
// 起動バグ修正、Wikiあいまい検索対応、マインスイーパー実装

const PCApp = {
    windows: [],
    icons: [
        { id: 'net', title: 'NetSurf', x: 10, y: 10, col: '#00f', txt: '🌐' },
        { id: 'file', title: 'FileDesk', x: 10, y: 60, col: '#da0', txt: '📁' },
        { id: 'task', title: 'TaskMgr', x: 10, y: 110, col: '#666', txt: '⚙️' },
        { id: 'calc', title: 'Calc', x: 10, y: 160, col: '#088', txt: '🧮' },
        { id: 'sys', title: 'SysInfo', x: 10, y: 210, col: '#a0a', txt: '💻' },
        { id: 'mine', title: 'Minesweep', x: 70, y: 10, col: '#808', txt: '💣' }, // ★ 忘れ物追加！
        { id: 'trash', title: 'Trash', x: 155, y: 235, col: '#444', txt: '🗑️' }
    ],
    dragTarget: null, dragType: '',
    dragOffX: 0, dragOffY: 0,
    prevPtr: false, ptrStartX: 0, ptrStartY: 0,
    bootTimer: 60, startMenuOpen: false,
    
    init() {
        this.windows = []; this.dragTarget = null; this.prevPtr = false;
        this.bootTimer = 60; this.startMenuOpen = false;
        BGM.stop();
        
        if (!SaveSys.data.osFiles) {
            SaveSys.data.osFiles = { 'README.TXT': 'RETRO-OS v2.1へようこそ！\nマインスイーパーが追加されました。' };
        }
        if (!SaveSys.data.trashFiles) SaveSys.data.trashFiles = {};
        SaveSys.save();
    },

    openApp(id) {
        this.startMenuOpen = false;
        let exist = this.windows.find(w => w.id === id);
        if (exist) {
            this.windows = this.windows.filter(w => w !== exist);
            this.windows.push(exist); return;
        }

        let w = { id: id, x: 20 + this.windows.length * 10, y: 20 + this.windows.length * 10, w: 150, h: 180, data: {} };
        
        if (id === 'net') { w.title = 'NetSurf (Wiki)'; w.data.text = "Wiki-API 接続完了。\nタップして検索キーワードを入力。"; }
        if (id === 'file') { w.title = 'FileDesk (C:\\)'; }
        if (id === 'task') { w.title = 'Task Manager'; w.w = 140; w.h = 140; }
        if (id === 'calc') { w.title = 'Calculator'; w.w = 110; w.h = 150; w.data.val = '0'; }
        if (id === 'sys') { w.title = 'System Info'; w.w = 140; w.h = 100; }
        if (id === 'trash') { w.title = 'Recycle Bin'; w.w = 140; w.h = 140; }
        if (id === 'mine') { w.title = 'Minesweeper'; w.w = 120; w.h = 140; w.data = this.initMine(); } // マインスイーパー初期化
        
        this.windows.push(w);
    },

    // マインスイーパー（6x6の盤面生成）
    initMine() {
        let grid = Array(36).fill(0).map(()=>({m:false, o:false, n:0}));
        let mines = 0;
        while(mines < 5) { // 爆弾は5個
            let r = Math.floor(Math.random()*36);
            if(!grid[r].m) { grid[r].m = true; mines++; }
        }
        // 周りの爆弾の数を計算
        for(let i=0; i<36; i++) {
            if(grid[i].m) continue;
            let x = i%6, y = Math.floor(i/6), n = 0;
            for(let dx=-1; dx<=1; dx++) {
                for(let dy=-1; dy<=1; dy++) {
                    let nx = x+dx, ny = y+dy;
                    if(nx>=0 && nx<6 && ny>=0 && ny<6 && grid[ny*6+nx].m) n++;
                }
            }
            grid[i].n = n;
        }
        return { g: grid, over: false, clear: false };
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        if (this.bootTimer > 0) { this.bootTimer--; return; }

        const ptr = pointer;
        const clicked = ptr.active && !this.prevPtr;
        
        if (clicked) { this.ptrStartX = ptr.x; this.ptrStartY = ptr.y; }

        // --- ★バグ修正：ドラッグ＆タップ判定 ---
        if (this.dragTarget) {
            if (ptr.active) {
                // 指を動かしている間は追従
                if (Math.hypot(ptr.x - this.ptrStartX, ptr.y - this.ptrStartY) > 3) {
                    this.dragTarget.x = ptr.x - this.dragOffX;
                    this.dragTarget.y = ptr.y - this.dragOffY;
                }
            } else {
                // 指を離した時の処理
                if (this.dragType === 'icon') {
                    this.dragTarget.x = Math.max(0, Math.min(160, this.dragTarget.x));
                    this.dragTarget.y = Math.max(0, Math.min(240, this.dragTarget.y));
                    
                    // 指がほとんど動いていなければ「タップ（起動）」と判定！
                    if (Math.hypot(ptr.x - this.ptrStartX, ptr.y - this.ptrStartY) <= 3) {
                        this.openApp(this.dragTarget.id);
                    }
                }
                this.dragTarget = null;
            }
        }

        // --- ウィンドウやアイコンのクリック判定 ---
        if (clicked && !this.dragTarget) {
            if (this.startMenuOpen) {
                if (ptr.x >= 2 && ptr.x <= 102 && ptr.y >= 140 && ptr.y <= 280) {
                    let idx = Math.floor((280 - ptr.y) / 23);
                    if (idx >= 0 && idx < this.icons.length) this.openApp(this.icons[this.icons.length - 1 - idx].id);
                    this.startMenuOpen = false; return;
                } else { this.startMenuOpen = false; }
            }

            if (ptr.x >= 2 && ptr.x <= 50 && ptr.y >= 282 && ptr.y <= 298) { this.startMenuOpen = !this.startMenuOpen; return; }

            for (let i = this.windows.length - 1; i >= 0; i--) {
                let w = this.windows[i];
                if (ptr.x >= w.x + w.w - 18 && ptr.x <= w.x + w.w - 4 && ptr.y >= w.y + 4 && ptr.y <= w.y + 16) { this.windows.splice(i, 1); return; }
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + 20) {
                    this.dragTarget = w; this.dragType = 'win'; this.dragOffX = ptr.x - w.x; this.dragOffY = ptr.y - w.y;
                    this.windows.push(this.windows.splice(i, 1)[0]); return;
                }
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + w.h) {
                    this.windows.push(this.windows.splice(i, 1)[0]);
                    this.handleAppClick(this.windows[this.windows.length - 1], ptr.x - w.x, ptr.y - w.y); return;
                }
            }

            for (let ic of this.icons) {
                if (ptr.x >= ic.x && ptr.x <= ic.x + 36 && ptr.y >= ic.y && ptr.y <= ic.y + 40) {
                    this.dragTarget = ic; this.dragType = 'icon'; this.dragOffX = ptr.x - ic.x; this.dragOffY = ptr.y - ic.y; return;
                }
            }
        }
        this.prevPtr = ptr.active;
    },

    handleAppClick(w, lx, ly) {
        // 🌐 ★バグ修正：あいまい検索対応（generator=search使用）
        if (w.id === 'net' && ly > 20) {
            let q = prompt("NetSurf: 検索キーワードを入力\n(文章でも最も近い記事を探します)");
            if (q) {
                w.data.text = "[SEARCHING...] データベース照会中...";
                const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=200&explaintext=1&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&origin=*`;
                fetch(url).then(r => r.json()).then(j => {
                    if (!j.query || !j.query.pages) {
                        w.data.text = "検索結果が見つかりませんでした。別の言葉で試してください。";
                    } else {
                        const pages = j.query.pages;
                        const pageId = Object.keys(pages)[0];
                        w.data.text = "【" + pages[pageId].title + "】\n" + pages[pageId].extract;
                    }
                }).catch(e => { w.data.text = "通信エラーが発生しました。"; });
            }
        }
        
        // 📁 フォルダ
        else if (w.id === 'file' && ly > 20) {
            if (ly > 25 && ly < 45) { 
                let name = prompt("新しいファイル名を入力:");
                if (name) {
                    let content = prompt(`[${name}] の内容を入力:`);
                    if (content !== null) { SaveSys.data.osFiles[name] = content; SaveSys.save(); }
                }
            } else {
                let files = Object.keys(SaveSys.data.osFiles); let idx = Math.floor((ly - 50) / 20);
                if (idx >= 0 && idx < files.length) {
                    let fname = files[idx];
                    let act = prompt(`ファイル [${fname}]\n内容: ${SaveSys.data.osFiles[fname]}\n\n編集する場合は新しい文字を入力。\n(削除する場合は "DEL" と入力)`);
                    if (act === "DEL") { SaveSys.data.trashFiles[fname] = SaveSys.data.osFiles[fname]; delete SaveSys.data.osFiles[fname]; SaveSys.save(); } 
                    else if (act) { SaveSys.data.osFiles[fname] = act; SaveSys.save(); }
                }
            }
        }

        // 🗑️ ゴミ箱
        else if (w.id === 'trash' && ly > 20) {
            if (ly > 25 && ly < 45) { if (confirm("ゴミ箱を空にしますか？(完全削除)")) { SaveSys.data.trashFiles = {}; SaveSys.save(); } } 
            else {
                let files = Object.keys(SaveSys.data.trashFiles); let idx = Math.floor((ly - 50) / 20);
                if (idx >= 0 && idx < files.length) {
                    let fname = files[idx];
                    if (confirm(`[${fname}]\nこのファイルを元に戻しますか？`)) {
                        SaveSys.data.osFiles[fname] = SaveSys.data.trashFiles[fname]; delete SaveSys.data.trashFiles[fname]; SaveSys.save();
                    }
                }
            }
        }
        
        // 📊 タスクマネージャー
        else if (w.id === 'task' && ly > 20) {
            let idx = Math.floor((ly - 25) / 20);
            if (idx >= 0 && idx < this.windows.length) {
                let target = this.windows[idx];
                if (target.id !== 'task') { if (confirm(`プロセス [${target.title}] を強制終了しますか？`)) this.windows.splice(idx, 1); }
            }
        }
        
        // 🧮 電卓
        else if (w.id === 'calc' && ly > 40) {
            let btns = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
            let col = Math.floor((lx - 5) / 25), row = Math.floor((ly - 45) / 25), btnIdx = row * 4 + col;
            if (btnIdx >= 0 && btnIdx < btns.length) {
                let b = btns[btnIdx];
                if (b === 'C') w.data.val = '0';
                else if (b === '=') { try { w.data.val = eval(w.data.val).toString(); } catch(e) { w.data.val = 'ERR'; } }
                else { w.data.val = w.data.val === '0' || w.data.val === 'ERR' ? b : w.data.val + b; }
            }
        }

        // 💣 ★新規：マインスイーパーのクリック処理
        else if (w.id === 'mine' && ly > 20) {
            if (w.data.over || w.data.clear) { w.data = this.initMine(); return; } // タップでリトライ
            let col = Math.floor((lx - 10) / 16);
            let row = Math.floor((ly - 30) / 16);
            if (col >= 0 && col < 6 && row >= 0 && row < 6) {
                let idx = row * 6 + col;
                let cell = w.data.g[idx];
                if (!cell.o) {
                    cell.o = true;
                    if (cell.m) w.data.over = true; // 爆発
                    else {
                        // クリア判定 (36マス - 5爆弾 = 31マス開けたらクリア)
                        let opened = w.data.g.filter(c => c.o).length;
                        if (opened === 31) w.data.clear = true;
                    }
                }
            }
        }
    },

    draw() {
        if (this.bootTimer > 0) {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
            ctx.fillText('BIOS Date 03/06/26', 10, 20);
            ctx.fillText('Memory Test: ' + (60 - this.bootTimer) * 1024 + ' KB OK', 10, 40);
            if (this.bootTimer < 20) ctx.fillText('Starting RETRO-OS...', 10, 70);
            return;
        }

        ctx.fillStyle = '#008080'; ctx.fillRect(0, 0, 200, 300);

        for (let ic of this.icons) {
            ctx.fillStyle = ic.col; ctx.fillRect(ic.x, ic.y, 32, 32);
            ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.fillText(ic.txt, ic.x + 8, ic.y + 22);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText(ic.title, ic.x - 2, ic.y + 42);
        }

        for (let w of this.windows) {
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(w.x, w.y, w.w, 1); ctx.fillRect(w.x, w.y, 1, w.h);
            ctx.fillStyle = '#444'; ctx.fillRect(w.x, w.y + w.h - 1, w.w, 1); ctx.fillRect(w.x + w.w - 1, w.y, 1, w.h);
            
            ctx.fillStyle = '#000080'; ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, 18);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText(w.title, w.x + 6, w.y + 14);
            
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(w.x + w.w - 18, w.y + 4, 14, 14);
            ctx.fillStyle = '#fff'; ctx.fillRect(w.x + w.w - 18, w.y + 4, 14, 1); ctx.fillRect(w.x + w.w - 18, w.y + 4, 1, 14);
            ctx.fillStyle = '#000'; ctx.fillRect(w.x + w.w - 5, w.y + 4, 1, 14); ctx.fillRect(w.x + w.w - 18, w.y + 17, 14, 1);
            ctx.fillText('X', w.x + w.w - 14, w.y + 15);

            ctx.save(); ctx.beginPath(); ctx.rect(w.x + 2, w.y + 20, w.w - 4, w.h - 22); ctx.clip();
            ctx.fillStyle = '#000'; ctx.font = '9px monospace';
            
            if (w.id === 'net') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, w.h - 28);
                ctx.fillStyle = '#000'; this.wrapText(ctx, w.data.text, w.x + 8, w.y + 36, w.w - 16, 12);
            }
            if (w.id === 'file') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 20);
                ctx.fillStyle = '#00f'; ctx.fillText('📝 ＋新規ファイル作成', w.x + 8, w.y + 38);
                let files = Object.keys(SaveSys.data.osFiles); ctx.fillStyle = '#000';
                for (let i = 0; i < files.length; i++) ctx.fillText('📄 ' + files[i], w.x + 8, w.y + 60 + i * 20);
            }
            if (w.id === 'trash') {
                ctx.fillStyle = '#aaa'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 20);
                ctx.fillStyle = '#f00'; ctx.fillText('🔥 ゴミ箱を空にする', w.x + 8, w.y + 38);
                let files = Object.keys(SaveSys.data.trashFiles); ctx.fillStyle = '#000';
                for (let i = 0; i < files.length; i++) ctx.fillText('🗑️ ' + files[i], w.x + 8, w.y + 60 + i * 20);
            }
            if (w.id === 'task') {
                ctx.fillText('起動中のプロセス一覧:', w.x + 6, w.y + 30);
                for (let i = 0; i < this.windows.length; i++) {
                    let tw = this.windows[i]; ctx.fillStyle = tw.id === 'task' ? '#888' : '#f00';
                    ctx.fillText('▶ ' + tw.title, w.x + 6, w.y + 45 + i * 20);
                    if (tw.id !== 'task') ctx.fillText('[KILL]', w.x + w.w - 35, w.y + 45 + i * 20);
                }
            }
            if (w.id === 'calc') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 16);
                ctx.fillStyle = '#000'; ctx.textAlign = 'right'; ctx.fillText(w.data.val, w.x + w.w - 8, w.y + 35); ctx.textAlign = 'left';
                let btns = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
                for (let i = 0; i < 16; i++) {
                    let bx = w.x + 5 + (i % 4) * 25, by = w.y + 45 + Math.floor(i / 4) * 25;
                    ctx.fillStyle = '#ddd'; ctx.fillRect(bx, by, 22, 22);
                    ctx.fillStyle = '#000'; ctx.fillText(btns[i], bx + 8, by + 14);
                }
            }
            if (w.id === 'sys') {
                ctx.fillText(`USER: ${SaveSys.data.playerName}`, w.x + 6, w.y + 40);
                ctx.fillText(`MEMORY: 1979 KB USED`, w.x + 6, w.y + 55);
                ctx.fillText(`OS: RETRO-OS v2.1`, w.x + 6, w.y + 70);
                ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, w.x + 6, w.y + 85);
            }

            // 💣 ★新規：マインスイーパー描画
            if (w.id === 'mine') {
                ctx.fillStyle = '#c0c0c0'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, w.h - 28);
                for(let i=0; i<36; i++) {
                    let cell = w.data.g[i];
                    let cx = w.x + 10 + (i%6)*16, cy = w.y + 30 + Math.floor(i/6)*16;
                    if (!cell.o) {
                        ctx.fillStyle = '#ddd'; ctx.fillRect(cx, cy, 15, 15);
                        ctx.fillStyle = '#fff'; ctx.fillRect(cx, cy, 15, 1); ctx.fillRect(cx, cy, 1, 15);
                        ctx.fillStyle = '#888'; ctx.fillRect(cx, cy+14, 15, 1); ctx.fillRect(cx+14, cy, 1, 15);
                    } else {
                        ctx.fillStyle = '#bbb'; ctx.fillRect(cx, cy, 15, 15);
                        ctx.fillStyle = '#000'; ctx.strokeRect(cx, cy, 15, 15);
                        if (cell.m) { ctx.font = '10px monospace'; ctx.fillText('💣', cx+2, cy+11); }
                        else if (cell.n > 0) { 
                            ctx.fillStyle = ['#00f','#080','#f00','#008','#800','#088','#000','#888'][cell.n-1];
                            ctx.font = 'bold 12px monospace'; ctx.fillText(cell.n, cx+4, cy+12);
                        }
                    }
                }
                ctx.fillStyle = '#000'; ctx.font = '9px monospace';
                if(w.data.over) { ctx.fillStyle = '#f00'; ctx.fillText('GAME OVER (Tap)', w.x+10, w.y+132); }
                if(w.data.clear) { ctx.fillStyle = '#00f'; ctx.fillText('CLEAR!! (Tap)', w.x+15, w.y+132); }
            }
            
            ctx.restore();
        }

        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 280, 200, 20); ctx.fillStyle = '#fff'; ctx.fillRect(0, 280, 200, 1);
        if (this.startMenuOpen) {
            ctx.fillStyle = '#aaa'; ctx.fillRect(2, 282, 48, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(2, 282, 48, 1); ctx.fillRect(2, 282, 1, 16);
        } else {
            ctx.fillStyle = '#ddd'; ctx.fillRect(2, 282, 48, 16);
            ctx.fillStyle = '#fff'; ctx.fillRect(2, 282, 48, 1); ctx.fillRect(2, 282, 1, 16);
        }
        ctx.fillStyle = '#000'; ctx.fillText('◆ START', 6, 294);
        ctx.fillText(new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0'), 165, 294);

        if (this.startMenuOpen) {
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(2, 140, 100, 140);
            ctx.fillStyle = '#fff'; ctx.fillRect(2, 140, 100, 1); ctx.fillRect(2, 140, 1, 140);
            ctx.fillStyle = '#444'; ctx.fillRect(2, 279, 100, 1); ctx.fillRect(101, 140, 1, 140);
            ctx.fillStyle = '#000080'; ctx.fillRect(4, 142, 16, 136);
            ctx.save(); ctx.translate(14, 270); ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('RETRO-OS', 0, 0); ctx.restore();
            for (let i = 0; i < this.icons.length; i++) {
                let ic = this.icons[this.icons.length - 1 - i], itemY = 257 - i * 23;
                ctx.fillStyle = '#000'; ctx.font = '10px monospace'; ctx.fillText(ic.txt + ' ' + ic.title, 25, itemY + 10);
            }
        }

        if (pointer.active) {
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(pointer.x + 10, pointer.y + 10); ctx.lineTo(pointer.x + 4, pointer.y + 12); ctx.lineTo(pointer.x, pointer.y + 16); ctx.fill(); ctx.strokeStyle = '#000'; ctx.stroke();
        }
    },
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let line = '';
        for (let n = 0; n < text.length; n++) {
            let char = text[n];
            if (char === '\n') { ctx.fillText(line, x, y); line = ''; y += lineHeight; continue; }
            let testLine = line + char;
            if (ctx.measureText(testLine).width > maxWidth && n > 0) { ctx.fillText(line, x, y); line = char; y += lineHeight; } 
            else { line = testLine; }
        }
        ctx.fillText(line, x, y);
    }
};
