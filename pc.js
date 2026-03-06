// === RETRO-OS (Canvas Fake Desktop System) ===
// 究極の軽さとハッカー感を追求した、自作の擬似ウィンドウズシステム

const PCApp = {
    windows: [],
    icons: [
        { id: 'net', title: 'NetSurf', x: 10, y: 10, col: '#00f', txt: '🌐' },
        { id: 'file', title: 'FileDesk', x: 10, y: 60, col: '#da0', txt: '📁' },
        { id: 'task', title: 'TaskMgr', x: 10, y: 110, col: '#666', txt: '⚙️' },
        { id: 'calc', title: 'Calc', x: 10, y: 160, col: '#088', txt: '🧮' },
        { id: 'sys', title: 'SysInfo', x: 10, y: 210, col: '#a0a', txt: '💻' }
    ],
    dragTarget: null,
    dragOffX: 0, dragOffY: 0,
    prevPtr: false,
    bootTimer: 60,
    
    // OSの初期化
    init() {
        this.windows = [];
        this.dragTarget = null;
        this.prevPtr = false;
        this.bootTimer = 60; // 起動アニメーション用
        BGM.stop();
        
        // ローカルストレージにCドライブを作成
        if (!SaveSys.data.osFiles) {
            SaveSys.data.osFiles = { 
                'README.TXT': 'RETRO-OSへようこそ！\nここはCanvas上に作られた仮想空間です。\n指でドラッグ＆タップして操作できます。',
                'SECRET.LOG': 'SYSTEM OVERRIDE SUCCESS.\nHACKER ALIAS: ' + SaveSys.data.playerName
            };
            SaveSys.save();
        }
    },

    // アプリ（ウィンドウ）を立ち上げる関数
    openApp(id) {
        let exist = this.windows.find(w => w.id === id);
        if (exist) {
            // すでに開いていたら最前面へ
            this.windows = this.windows.filter(w => w !== exist);
            this.windows.push(exist);
            return;
        }

        let w = { id: id, x: 30 + this.windows.length * 15, y: 30 + this.windows.length * 15, w: 140, h: 160, data: {} };
        
        if (id === 'net') { w.title = 'NetSurf (Browser)'; w.data.text = "DuckDuckGo API 接続完了。\n\n画面をタップして検索キーワードを入力してください。"; }
        if (id === 'file') { w.title = 'FileDesk (C:\\)'; }
        if (id === 'task') { w.title = 'Task Manager'; w.w = 130; w.h = 140; }
        if (id === 'calc') { w.title = 'Calculator'; w.w = 110; w.h = 150; w.data.val = '0'; }
        if (id === 'sys') { w.title = 'System Properties'; w.w = 140; w.h = 100; }
        
        this.windows.push(w);
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; } // OSシャットダウン

        if (this.bootTimer > 0) { this.bootTimer--; return; }

        const ptr = pointer;
        const clicked = ptr.active && !this.prevPtr;
        this.prevPtr = ptr.active;

        // 【ウィンドウのドラッグ移動処理】
        if (this.dragTarget) {
            if (ptr.active) {
                this.dragTarget.x = ptr.x - this.dragOffX;
                this.dragTarget.y = ptr.y - this.dragOffY;
            } else {
                this.dragTarget = null;
            }
            return;
        }

        if (clicked) {
            // 1. ウィンドウのクリック判定（手前から奥へ）
            for (let i = this.windows.length - 1; i >= 0; i--) {
                let w = this.windows[i];
                
                // 閉じるボタン [X]
                if (ptr.x >= w.x + w.w - 18 && ptr.x <= w.x + w.w - 4 && ptr.y >= w.y + 4 && ptr.y <= w.y + 16) {
                    this.windows.splice(i, 1);
                    return;
                }
                
                // タイトルバー（ドラッグ開始）
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + 20) {
                    this.dragTarget = w;
                    this.dragOffX = ptr.x - w.x;
                    this.dragOffY = ptr.y - w.y;
                    this.windows.push(this.windows.splice(i, 1)[0]); // 最前面へ
                    return;
                }
                
                // ウィンドウの中身をクリック
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + w.h) {
                    this.windows.push(this.windows.splice(i, 1)[0]); // 最前面へ
                    this.handleAppClick(this.windows[this.windows.length - 1], ptr.x - w.x, ptr.y - w.y);
                    return;
                }
            }

            // 2. デスクトップアイコンのクリック判定
            for (let ic of this.icons) {
                if (ptr.x >= ic.x && ptr.x <= ic.x + 36 && ptr.y >= ic.y && ptr.y <= ic.y + 40) {
                    this.openApp(ic.id);
                    return;
                }
            }
            
            // 3. スタートボタン（ダミー）
            if (ptr.x >= 2 && ptr.x <= 50 && ptr.y >= 282 && ptr.y <= 298) {
                alert("START MENU: \n現在アップデート準備中です！\nSELECTボタンでシステムを終了できます。");
            }
        }
    },

    // アプリケーション内の動作（ハッキングの心臓部）
    handleAppClick(w, lx, ly) {
        // 🌐 ブラウザ機能 (DuckDuckGo API連携)
        if (w.id === 'net' && ly > 20) {
            let q = prompt("NetSurf: 検索キーワードを入力\n(※DuckDuckGoを使用します)");
            if (q) {
                w.data.text = "[SEARCHING...] 通信中...";
                fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`)
                .then(r => r.json()).then(j => {
                    w.data.text = j.AbstractText || "結果が見つかりません。別の単語をお試しください。";
                }).catch(e => { w.data.text = "通信エラーが発生しました。ネットワークを確認してください。"; });
            }
        }
        
        // 📁 フォルダ＆メモ帳 (localStorage保存)
        else if (w.id === 'file' && ly > 20) {
            if (ly > 25 && ly < 45) { // 新規作成ボタン
                let name = prompt("新しいファイル名を入力:");
                if (name) {
                    let content = prompt(`[${name}] の内容を入力してください:`);
                    if (content !== null) {
                        SaveSys.data.osFiles[name] = content;
                        SaveSys.save();
                    }
                }
            } else {
                let files = Object.keys(SaveSys.data.osFiles);
                let idx = Math.floor((ly - 50) / 20);
                if (idx >= 0 && idx < files.length) {
                    let fname = files[idx];
                    let act = prompt(`ファイル [${fname}]\n内容: ${SaveSys.data.osFiles[fname]}\n\n編集する場合は新しい文字を入力してください。\n(削除する場合は "DELETE" と入力)`);
                    if (act === "DELETE") {
                        delete SaveSys.data.osFiles[fname];
                        SaveSys.save();
                    } else if (act) {
                        SaveSys.data.osFiles[fname] = act;
                        SaveSys.save();
                    }
                }
            }
        }
        
        // 📊 タスクマネージャー (プロセスキル)
        else if (w.id === 'task' && ly > 20) {
            let idx = Math.floor((ly - 25) / 20);
            if (idx >= 0 && idx < this.windows.length) {
                let target = this.windows[idx];
                if (target.id !== 'task') {
                    if (confirm(`プロセス [${target.title}] を強制終了しますか？`)) {
                        this.windows.splice(idx, 1);
                    }
                }
            }
        }
        
        // 🧮 電卓
        else if (w.id === 'calc' && ly > 40) {
            let btns = ['7','8','9','/','4','5','6','*','1','2','3','-','C','0','=','+'];
            let col = Math.floor((lx - 5) / 25);
            let row = Math.floor((ly - 45) / 25);
            let btnIdx = row * 4 + col;
            if (btnIdx >= 0 && btnIdx < btns.length) {
                let b = btns[btnIdx];
                if (b === 'C') w.data.val = '0';
                else if (b === '=') { try { w.data.val = eval(w.data.val).toString(); } catch(e) { w.data.val = 'ERR'; } }
                else { w.data.val = w.data.val === '0' ? b : w.data.val + b; }
            }
        }
    },

    // UIの描画
    draw() {
        // 起動画面
        if (this.bootTimer > 0) {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
            ctx.fillText('BIOS Date 03/06/26', 10, 20);
            ctx.fillText('Memory Test: ' + (60 - this.bootTimer) * 1024 + ' KB OK', 10, 40);
            if (this.bootTimer < 20) ctx.fillText('Starting RETRO-OS...', 10, 70);
            return;
        }

        // デスクトップ背景 (Win95風ティールカラー)
        ctx.fillStyle = '#008080'; ctx.fillRect(0, 0, 200, 300);

        // アイコン描画
        for (let ic of this.icons) {
            ctx.fillStyle = ic.col; ctx.fillRect(ic.x, ic.y, 32, 32);
            ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.fillText(ic.txt, ic.x + 8, ic.y + 22);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText(ic.title, ic.x - 2, ic.y + 42);
        }

        // ウィンドウの描画 (3D風ボーダー)
        for (let w of this.windows) {
            // ベース
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

            // アプリ固有の中身
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
                for (let i = 0; i < files.length; i++) {
                    ctx.fillText('📄 ' + files[i], w.x + 8, w.y + 60 + i * 20);
                }
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
                ctx.fillText(`OS: RETRO-OS v1.0`, w.x + 6, w.y + 70);
                ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, w.x + 6, w.y + 85);
            }
        }

        // タスクバー (最前面)
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 280, 200, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 280, 200, 1);
        ctx.fillStyle = '#ddd'; ctx.fillRect(2, 282, 48, 16); // Start btn
        ctx.fillStyle = '#000'; ctx.fillText('◆ START', 6, 294);
        ctx.fillText(new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0'), 165, 294);
        
        // 仮想マウスカーソル（スマホのタップ位置に表示）
        if (pointer.active) {
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(pointer.x + 10, pointer.y + 10); ctx.lineTo(pointer.x + 4, pointer.y + 12); ctx.lineTo(pointer.x, pointer.y + 16); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.stroke();
        }
    },
    
    // Canvas上のテキストを自動改行する便利ツール
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let chars = text.split(''); let line = '';
        for (let n = 0; n < chars.length; n++) {
            let testLine = line + chars[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0) {
                ctx.fillText(line, x, y); line = chars[n]; y += lineHeight;
            } else { line = testLine; }
            if (chars[n] === '\n') { ctx.fillText(line, x, y); line = ''; y += lineHeight; }
        }
        ctx.fillText(line, x, y);
    }
};
