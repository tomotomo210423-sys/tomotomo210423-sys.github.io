// === RETRO-OS (Canvas Fake Desktop System v2.0) ===
// 検索エンジンの刷新、スタートメニュー、ゴミ箱、アイコンの整理機能を搭載

const PCApp = {
    windows: [],
    icons: [
        { id: 'net', title: 'NetSurf', x: 10, y: 10, col: '#00f', txt: '🌐' },
        { id: 'file', title: 'FileDesk', x: 10, y: 60, col: '#da0', txt: '📁' },
        { id: 'task', title: 'TaskMgr', x: 10, y: 110, col: '#666', txt: '⚙️' },
        { id: 'calc', title: 'Calc', x: 10, y: 160, col: '#088', txt: '🧮' },
        { id: 'sys', title: 'SysInfo', x: 10, y: 210, col: '#a0a', txt: '💻' },
        { id: 'trash', title: 'Trash', x: 155, y: 235, col: '#444', txt: '🗑️' } // ゴミ箱追加
    ],
    dragTarget: null,
    dragType: '', // 'win' or 'icon'
    dragOffX: 0, dragOffY: 0,
    prevPtr: false,
    ptrStartX: 0, ptrStartY: 0,
    bootTimer: 60,
    startMenuOpen: false, // スタートメニューの状態
    
    init() {
        this.windows = [];
        this.dragTarget = null;
        this.prevPtr = false;
        this.bootTimer = 60;
        this.startMenuOpen = false;
        BGM.stop();
        
        if (!SaveSys.data.osFiles) {
            SaveSys.data.osFiles = { 
                'README.TXT': 'RETRO-OS v2.0へようこそ！\nアイコンのドラッグ移動や\nゴミ箱機能が追加されました。'
            };
        }
        if (!SaveSys.data.trashFiles) SaveSys.data.trashFiles = {};
        SaveSys.save();
    },

    openApp(id) {
        this.startMenuOpen = false;
        let exist = this.windows.find(w => w.id === id);
        if (exist) {
            this.windows = this.windows.filter(w => w !== exist);
            this.windows.push(exist);
            return;
        }

        let w = { id: id, x: 20 + this.windows.length * 10, y: 20 + this.windows.length * 10, w: 150, h: 180, data: {} };
        
        if (id === 'net') { w.title = 'NetSurf (Wiki)'; w.data.text = "Wiki-API 接続完了。\nタップして検索キーワードを入力。"; }
        if (id === 'file') { w.title = 'FileDesk (C:\\)'; }
        if (id === 'task') { w.title = 'Task Manager'; w.w = 140; w.h = 140; }
        if (id === 'calc') { w.title = 'Calculator'; w.w = 110; w.h = 150; w.data.val = '0'; }
        if (id === 'sys') { w.title = 'System Info'; w.w = 140; w.h = 100; }
        if (id === 'trash') { w.title = 'Recycle Bin'; w.w = 140; w.h = 140; }
        
        this.windows.push(w);
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.bootTimer > 0) { this.bootTimer--; return; }

        const ptr = pointer;
        const clicked = ptr.active && !this.prevPtr;
        const released = !ptr.active && this.prevPtr;
        
        if (clicked) {
            this.ptrStartX = ptr.x;
            this.ptrStartY = ptr.y;
        }

        // --- ドラッグ処理 ---
        if (this.dragTarget) {
            if (ptr.active) {
                // 移動量が3pxを超えたらドラッグと判定
                if (Math.hypot(ptr.x - this.ptrStartX, ptr.y - this.ptrStartY) > 3) {
                    this.dragTarget.x = ptr.x - this.dragOffX;
                    this.dragTarget.y = ptr.y - this.dragOffY;
                }
            } else {
                // アイコンをドロップした時に画面外に行かないように補正
                if (this.dragType === 'icon') {
                    this.dragTarget.x = Math.max(0, Math.min(160, this.dragTarget.x));
                    this.dragTarget.y = Math.max(0, Math.min(240, this.dragTarget.y));
                }
                this.dragTarget = null;
            }
        }

        // --- クリック・判定処理 ---
        if (clicked && !this.dragTarget) {
            // スタートメニューが開いている時の判定
            if (this.startMenuOpen) {
                if (ptr.x >= 2 && ptr.x <= 102 && ptr.y >= 140 && ptr.y <= 280) {
                    let idx = Math.floor((280 - ptr.y) / 23);
                    if (idx >= 0 && idx < this.icons.length) {
                        this.openApp(this.icons[this.icons.length - 1 - idx].id);
                    }
                    this.startMenuOpen = false;
                    return;
                } else {
                    this.startMenuOpen = false; // メニュー外タップで閉じる
                }
            }

            // スタートボタン判定
            if (ptr.x >= 2 && ptr.x <= 50 && ptr.y >= 282 && ptr.y <= 298) {
                this.startMenuOpen = !this.startMenuOpen;
                return;
            }

            // ウィンドウ判定 (手前から)
            for (let i = this.windows.length - 1; i >= 0; i--) {
                let w = this.windows[i];
                
                // 閉じるボタン
                if (ptr.x >= w.x + w.w - 18 && ptr.x <= w.x + w.w - 4 && ptr.y >= w.y + 4 && ptr.y <= w.y + 16) {
                    this.windows.splice(i, 1);
                    return;
                }
                
                // タイトルバー (ドラッグ開始)
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + 20) {
                    this.dragTarget = w;
                    this.dragType = 'win';
                    this.dragOffX = ptr.x - w.x;
                    this.dragOffY = ptr.y - w.y;
                    this.windows.push(this.windows.splice(i, 1)[0]);
                    return;
                }
                
                // ウィンドウ内クリック
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + w.h) {
                    this.windows.push(this.windows.splice(i, 1)[0]);
                    this.handleAppClick(this.windows[this.windows.length - 1], ptr.x - w.x, ptr.y - w.y);
                    return;
                }
            }

            // アイコン判定 (ドラッグ準備)
            for (let ic of this.icons) {
                if (ptr.x >= ic.x && ptr.x <= ic.x + 36 && ptr.y >= ic.y && ptr.y <= ic.y + 40) {
                    this.dragTarget = ic;
                    this.dragType = 'icon';
                    this.dragOffX = ptr.x - ic.x;
                    this.dragOffY = ptr.y - ic.y;
                    return;
                }
            }
        }

        // リリース時の処理 (アイコンのタップ起動)
        if (released && this.dragTarget && this.dragType === 'icon') {
            if (Math.hypot(ptr.x - this.ptrStartX, ptr.y - this.ptrStartY) <= 3) {
                this.openApp(this.dragTarget.id);
            }
            this.dragTarget = null;
        }

        this.prevPtr = ptr.active;
    },

    handleAppClick(w, lx, ly) {
        // 🌐 ブラウザ (Wikipedia API に変更！)
        if (w.id === 'net' && ly > 20) {
            let q = prompt("NetSurf: 検索キーワードを入力\n(Wikipediaから概要を取得します)");
            if (q) {
                w.data.text = "[SEARCHING...] データベース照会中...";
                const url = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=200&explaintext=1&titles=${encodeURIComponent(q)}&origin=*`;
                fetch(url)
                .then(r => r.json()).then(j => {
                    const pages = j.query.pages;
                    const pageId = Object.keys(pages)[0];
                    if (pageId == "-1") w.data.text = "データが見つかりません。別の単語をお試しください。";
                    else w.data.text = "【" + q + "】\n" + pages[pageId].extract;
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
                let files = Object.keys(SaveSys.data.osFiles);
                let idx = Math.floor((ly - 50) / 20);
                if (idx >= 0 && idx < files.length) {
                    let fname = files[idx];
                    let act = prompt(`ファイル [${fname}]\n内容: ${SaveSys.data.osFiles[fname]}\n\n編集する場合は新しい文字を入力。\n(削除する場合は "DEL" と入力)`);
                    if (act === "DEL") {
                        // ゴミ箱へ移動
                        SaveSys.data.trashFiles[fname] = SaveSys.data.osFiles[fname];
                        delete SaveSys.data.osFiles[fname];
                        SaveSys.save();
                    } else if (act) {
                        SaveSys.data.osFiles[fname] = act; SaveSys.save();
                    }
                }
            }
        }

        // 🗑️ ゴミ箱
        else if (w.id === 'trash' && ly > 20) {
            if (ly > 25 && ly < 45) {
                if (confirm("ゴミ箱を空にしますか？(完全削除)")) {
                    SaveSys.data.trashFiles = {}; SaveSys.save();
                }
            } else {
                let files = Object.keys(SaveSys.data.trashFiles);
                let idx = Math.floor((ly - 50) / 20);
                if (idx >= 0 && idx < files.length) {
                    let fname = files[idx];
                    if (confirm(`[${fname}]\nこのファイルを元に戻しますか？`)) {
                        SaveSys.data.osFiles[fname] = SaveSys.data.trashFiles[fname];
                        delete SaveSys.data.trashFiles[fname];
                        SaveSys.save();
                    }
                }
            }
        }
        
        // 📊 タスクマネージャー
        else if (w.id === 'task' && ly > 20) {
            let idx = Math.floor((ly - 25) / 20);
            if (idx >= 0 && idx < this.windows.length) {
                let target = this.windows[idx];
                if (target.id !== 'task') {
                    if (confirm(`プロセス [${target.title}] を強制終了しますか？`)) this.windows.splice(idx, 1);
                }
            }
        }
        
        // 🧮 電卓
        else if (w.id === 'calc' && ly > 40) {
            let btns = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
            let col = Math.floor((lx - 5) / 25); let row = Math.floor((ly - 45) / 25); let btnIdx = row * 4 + col;
            if (btnIdx >= 0 && btnIdx < btns.length) {
                let b = btns[btnIdx];
                if (b === 'C') w.data.val = '0';
                else if (b === '=') { try { w.data.val = eval(w.data.val).toString(); } catch(e) { w.data.val = 'ERR'; } }
                else { w.data.val = w.data.val === '0' || w.data.val === 'ERR' ? b : w.data.val + b; }
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

        // デスクトップ背景
        ctx.fillStyle = '#008080'; ctx.fillRect(0, 0, 200, 300);

        // アイコン描画
        for (let ic of this.icons) {
            ctx.fillStyle = ic.col; ctx.fillRect(ic.x, ic.y, 32, 32);
            ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.fillText(ic.txt, ic.x + 8, ic.y + 22);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText(ic.title, ic.x - 2, ic.y + 42);
        }

        // ウィンドウの描画
        for (let w of this.windows) {
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(w.x, w.y, w.w, 1); ctx.fillRect(w.x, w.y, 1, w.h);
            ctx.fillStyle = '#444'; ctx.fillRect(w.x, w.y + w.h - 1, w.w, 1); ctx.fillRect(w.x + w.w - 1, w.y, 1, w.h);
            
            // タイトルバー
            ctx.fillStyle = '#000080'; ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, 18);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText(w.title, w.x + 6, w.y + 14);
            
            // 閉じるボタン
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(w.x + w.w - 18, w.y + 4, 14, 14);
            ctx.fillStyle = '#fff'; ctx.fillRect(w.x + w.w - 18, w.y + 4, 14, 1); ctx.fillRect(w.x + w.w - 18, w.y + 4, 1, 14);
            ctx.fillStyle = '#000'; ctx.fillRect(w.x + w.w - 5, w.y + 4, 1, 14); ctx.fillRect(w.x + w.w - 18, w.y + 17, 14, 1);
            ctx.fillText('X', w.x + w.w - 14, w.y + 15);

            // ★ ここからクリッピング（文字のはみ出し防止）
            ctx.save();
            ctx.beginPath();
            ctx.rect(w.x + 2, w.y + 20, w.w - 4, w.h - 22);
            ctx.clip();

            ctx.fillStyle = '#000'; ctx.font = '9px monospace';
            
            if (w.id === 'net') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, w.h - 28);
                ctx.fillStyle = '#000'; 
                this.wrapText(ctx, w.data.text, w.x + 8, w.y + 36, w.w - 16, 12);
            }
            if (w.id === 'file') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 20);
                ctx.fillStyle = '#00f'; ctx.fillText('📝 ＋新規ファイル作成', w.x + 8, w.y + 38);
                let files = Object.keys(SaveSys.data.osFiles);
                ctx.fillStyle = '#000';
                for (let i = 0; i < files.length; i++) ctx.fillText('📄 ' + files[i], w.x + 8, w.y + 60 + i * 20);
            }
            if (w.id === 'trash') {
                ctx.fillStyle = '#aaa'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 20);
                ctx.fillStyle = '#f00'; ctx.fillText('🔥 ゴミ箱を空にする', w.x + 8, w.y + 38);
                let files = Object.keys(SaveSys.data.trashFiles);
                ctx.fillStyle = '#000';
                for (let i = 0; i < files.length; i++) ctx.fillText('🗑️ ' + files[i], w.x + 8, w.y + 60 + i * 20);
            }
            if (w.id === 'task') {
                ctx.fillText('起動中のプロセス一覧:', w.x + 6, w.y + 30);
                for (let i = 0; i < this.windows.length; i++) {
                    let tw = this.windows[i];
                    ctx.fillStyle = tw.id === 'task' ? '#888' : '#f00';
                    ctx.fillText('▶ ' + tw.title, w.x + 6, w.y + 45 + i * 20);
                    if (tw.id !== 'task') ctx.fillText('[KILL]', w.x + w.w - 35, w.y + 45 + i * 20);
                }
            }
            if (w.id === 'calc') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 16);
                ctx.fillStyle = '#000'; ctx.textAlign = 'right';
                ctx.fillText(w.data.val, w.x + w.w - 8, w.y + 35);
                ctx.textAlign = 'left';
                let btns = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
                for (let i = 0; i < 16; i++) {
                    let bx = w.x + 5 + (i % 4) * 25; let by = w.y + 45 + Math.floor(i / 4) * 25;
                    ctx.fillStyle = '#ddd'; ctx.fillRect(bx, by, 22, 22);
                    ctx.fillStyle = '#000'; ctx.fillText(btns[i], bx + 8, by + 14);
                }
            }
            if (w.id === 'sys') {
                ctx.fillText(`USER: ${SaveSys.data.playerName}`, w.x + 6, w.y + 40);
                ctx.fillText(`MEMORY: 1979 KB USED`, w.x + 6, w.y + 55);
                ctx.fillText(`OS: RETRO-OS v2.0`, w.x + 6, w.y + 70);
                ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, w.x + 6, w.y + 85);
            }
            
            ctx.restore(); // クリッピング解除
        }

        // タスクバー (最前面)
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 280, 200, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 280, 200, 1);
        
        // スタートボタン (押下状態の切り替え)
        if (this.startMenuOpen) {
            ctx.fillStyle = '#aaa'; ctx.fillRect(2, 282, 48, 16);
            ctx.fillStyle = '#000'; ctx.fillRect(2, 282, 48, 1); ctx.fillRect(2, 282, 1, 16);
        } else {
            ctx.fillStyle = '#ddd'; ctx.fillRect(2, 282, 48, 16);
            ctx.fillStyle = '#fff'; ctx.fillRect(2, 282, 48, 1); ctx.fillRect(2, 282, 1, 16);
        }
        ctx.fillStyle = '#000'; ctx.fillText('◆ START', 6, 294);
        ctx.fillText(new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0'), 165, 294);

        // --- スタートメニュー描画 ---
        if (this.startMenuOpen) {
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(2, 140, 100, 140);
            ctx.fillStyle = '#fff'; ctx.fillRect(2, 140, 100, 1); ctx.fillRect(2, 140, 1, 140);
            ctx.fillStyle = '#444'; ctx.fillRect(2, 279, 100, 1); ctx.fillRect(101, 140, 1, 140);
            
            // サイドバー装飾
            ctx.fillStyle = '#000080'; ctx.fillRect(4, 142, 16, 136);
            ctx.save(); ctx.translate(14, 270); ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.fillText('RETRO-OS', 0, 0);
            ctx.restore();

            // メニュー項目 (下から順に描画)
            for (let i = 0; i < this.icons.length; i++) {
                let ic = this.icons[this.icons.length - 1 - i];
                let itemY = 257 - i * 23;
                ctx.fillStyle = '#000'; ctx.font = '10px monospace';
                ctx.fillText(ic.txt + ' ' + ic.title, 25, itemY + 10);
            }
        }

        // 仮想マウスカーソル
        if (pointer.active) {
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(pointer.x + 10, pointer.y + 10); ctx.lineTo(pointer.x + 4, pointer.y + 12); ctx.lineTo(pointer.x, pointer.y + 16); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.stroke();
        }
    },
    
    // 日本語対応の自動改行ツール
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let line = '';
        for (let n = 0; n < text.length; n++) {
            let char = text[n];
            if (char === '\n') { ctx.fillText(line, x, y); line = ''; y += lineHeight; continue; }
            let testLine = line + char;
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                ctx.fillText(line, x, y); line = char; y += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x, y);
    }
};
