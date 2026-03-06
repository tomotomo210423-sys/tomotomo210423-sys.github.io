// === RETRO-OS (Canvas Fake Desktop System v3.0) ===
// イルカアシスタント、プログラミング環境、OSサウンド、ゴミ箱の真の機能を搭載

const PCApp = {
    windows: [],
    icons: [
        { id: 'net', title: 'NetSurf', x: 10, y: 10, col: '#00f', txt: '🌐' },
        { id: 'file', title: 'FileDesk', x: 10, y: 60, col: '#da0', txt: '📁' },
        { id: 'term', title: 'Terminal', x: 10, y: 110, col: '#000', txt: '💻' }, // JSプログラミング
        { id: 'ecode', title: 'EasyCode', x: 10, y: 160, col: '#0a0', txt: '🧩' }, // ビジュアルプログラミング
        { id: 'task', title: 'TaskMgr', x: 10, y: 210, col: '#666', txt: '⚙️' },
        { id: 'trash', title: 'Trash', x: 155, y: 235, col: '#444', txt: '🗑️' }
    ],
    dragTarget: null,
    dragType: '', // 'win', 'icon', 'dolph'
    dragOffX: 0, dragOffY: 0,
    prevPtr: false, ptrStartX: 0, ptrStartY: 0,
    bootTimer: 60,
    startMenuOpen: false,
    flashTimer: 0, // 画面フラッシュ用
    
    // 🐬 イルカアシスタントのデータ
    dolph: {
        active: true, x: 150, y: 50, vx: -0.2, vy: 0.2,
        msg: "何かお困りですか？", msgTimer: 0, clickCount: 0
    },

    init() {
        this.windows = []; this.dragTarget = null; this.prevPtr = false;
        this.bootTimer = 60; this.startMenuOpen = false; this.flashTimer = 0;
        BGM.stop();
        
        // イルカの復活判定（消されていなければ出現）
        this.dolph.active = !SaveSys.data.dolphKilled;
        this.dolph.x = 120; this.dolph.y = 80;
        
        if (!SaveSys.data.osFiles) SaveSys.data.osFiles = { 'README.TXT': 'RETRO-OS v3.0\nイルカを消す方法を探してください。' };
        if (!SaveSys.data.trashFiles) SaveSys.data.trashFiles = {};
        SaveSys.save();
    },

    // 🔊 OS専用レトロサウンド生成
    sysSnd(type) {
        if (!audioCtx || SaveSys.data.seVol <= 0) return;
        const t = audioCtx.currentTime; const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        let vol = SaveSys.data.seVol * 0.3;
        if (type === 'click') { o.type = 'square'; o.frequency.setValueAtTime(1500, t); g.gain.setValueAtTime(vol, t); o.frequency.exponentialRampToValueAtTime(800, t+0.05); g.gain.exponentialRampToValueAtTime(0.01, t+0.05); o.start(t); o.stop(t+0.05); }
        if (type === 'err') { o.type = 'sawtooth'; o.frequency.setValueAtTime(120, t); g.gain.setValueAtTime(vol, t); o.frequency.exponentialRampToValueAtTime(80, t+0.3); g.gain.exponentialRampToValueAtTime(0.01, t+0.3); o.start(t); o.stop(t+0.3); }
        if (type === 'poof') { o.type = 'sine'; o.frequency.setValueAtTime(400, t); g.gain.setValueAtTime(vol*2, t); o.frequency.exponentialRampToValueAtTime(50, t+0.5); g.gain.exponentialRampToValueAtTime(0.01, t+0.5); o.start(t); o.stop(t+0.5); }
    },

    openApp(id) {
        this.startMenuOpen = false;
        let exist = this.windows.find(w => w.id === id);
        if (exist) { this.windows = this.windows.filter(w => w !== exist); this.windows.push(exist); this.sysSnd('click'); return; }
        
        let w = { id: id, x: 20 + this.windows.length * 10, y: 20 + this.windows.length * 10, w: 150, h: 180, data: {} };
        if (id === 'net') { w.title = 'NetSurf (Wiki)'; w.data.text = "Wiki-API 接続完了。\nタップして検索。"; }
        if (id === 'file') { w.title = 'FileDesk (C:\\)'; }
        if (id === 'term') { w.title = 'Terminal.exe'; w.data.logs = ["OS [Version 3.0]", "JS Engine Ready.", "> "]; }
        if (id === 'ecode') { w.title = 'EasyCode (Node)'; w.data.script = []; w.data.run = false; w.data.pc = 0; w.data.tmr = 0; }
        if (id === 'task') { w.title = 'Task Manager'; w.w = 140; w.h = 140; }
        if (id === 'trash') { w.title = 'Recycle Bin'; w.w = 140; w.h = 140; }
        
        this.windows.push(w);
        this.sysSnd('click');
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }
        if (this.bootTimer > 0) { this.bootTimer--; return; }
        if (this.flashTimer > 0) this.flashTimer--;

        // 🐬 イルカの自動移動とセリフタイマー
        if (this.dolph.active) {
            this.dolph.x += this.dolph.vx; this.dolph.y += this.dolph.vy;
            if (this.dolph.x < 0 || this.dolph.x > 170) this.dolph.vx *= -1;
            if (this.dolph.y < 0 || this.dolph.y > 240) this.dolph.vy *= -1;
            if (this.dolph.msgTimer > 0) this.dolph.msgTimer--;
        }

        // 🧩 EasyCode（ビジュアルプログラミング）のバックグラウンド実行処理
        for (let w of this.windows) {
            if (w.id === 'ecode' && w.data.run) {
                if (w.data.tmr > 0) { w.data.tmr--; continue; }
                let cmd = w.data.script[w.data.pc];
                if (!cmd) { w.data.run = false; this.sysSnd('click'); continue; } // 実行終了
                
                if (cmd.t === 1) { this.sysSnd('click'); w.data.tmr = 15; } // 音
                if (cmd.t === 2) { this.flashTimer = 5; this.sysSnd('click'); w.data.tmr = 20; } // フラッシュ
                if (cmd.t === 3) { w.data.tmr = parseInt(cmd.val) || 30; } // 待機
                if (cmd.t === 4) { alert("EasyCode: " + cmd.val); w.data.tmr = 5; } // 文字表示
                w.data.pc++;
            }
        }

        const ptr = pointer;
        const clicked = ptr.active && !this.prevPtr;
        const released = !ptr.active && this.prevPtr;
        
        if (clicked) { this.ptrStartX = ptr.x; this.ptrStartY = ptr.y; }

        // --- ドラッグ中の処理 ---
        if (this.dragTarget) {
            if (ptr.active) {
                if (Math.hypot(ptr.x - this.ptrStartX, ptr.y - this.ptrStartY) > 3) {
                    this.dragTarget.x = ptr.x - this.dragOffX; this.dragTarget.y = ptr.y - this.dragOffY;
                }
            } else {
                // 🐬 イルカをゴミ箱に落としたかの判定（お前を消す方法）
                if (this.dragType === 'dolph') {
                    let tr = this.icons.find(i => i.id === 'trash');
                    if (ptr.x > tr.x - 10 && ptr.x < tr.x + 40 && ptr.y > tr.y - 10 && ptr.y < tr.y + 40) {
                        this.dolph.active = false;
                        this.sysSnd('poof');
                        setTimeout(() => {
                            alert("🐬「ギャアーーー！！」\n\n【実績解除】イルカを消去しました。\nシステム権限が管理者モードに移行します。");
                        }, 100);
                        SaveSys.data.dolphKilled = true; SaveSys.save();
                    }
                }
                
                if (this.dragType === 'icon' || this.dragType === 'dolph') {
                    this.dragTarget.x = Math.max(0, Math.min(160, this.dragTarget.x));
                    this.dragTarget.y = Math.max(0, Math.min(240, this.dragTarget.y));
                }
                this.dragTarget = null;
            }
        }

        // --- クリック・判定処理 ---
        if (clicked && !this.dragTarget) {
            // 🐬 イルカクリック判定
            if (this.dolph.active && ptr.x >= this.dolph.x && ptr.x <= this.dolph.x + 25 && ptr.y >= this.dolph.y && ptr.y <= this.dolph.y + 25) {
                this.sysSnd('click');
                this.dolph.clickCount++;
                if (this.dolph.clickCount === 1) this.dolph.msg = "お呼びですか？";
                else if (this.dolph.clickCount === 3) this.dolph.msg = "用がないなら\n呼ばないで！";
                else if (this.dolph.clickCount >= 5) this.dolph.msg = "お前を消す方法？\nゴミ箱にドラッグ\nしてみろよ！";
                this.dolph.msgTimer = 180;
                this.dragTarget = this.dolph; this.dragType = 'dolph';
                this.dragOffX = ptr.x - this.dolph.x; this.dragOffY = ptr.y - this.dolph.y;
                return;
            }

            // スタートメニュー判定
            if (this.startMenuOpen) {
                if (ptr.x >= 2 && ptr.x <= 102 && ptr.y >= 140 && ptr.y <= 280) {
                    let idx = Math.floor((280 - ptr.y) / 23);
                    if (idx >= 0 && idx < this.icons.length) this.openApp(this.icons[this.icons.length - 1 - idx].id);
                    this.startMenuOpen = false; return;
                } else { this.startMenuOpen = false; }
            }
            if (ptr.x >= 2 && ptr.x <= 50 && ptr.y >= 282 && ptr.y <= 298) {
                this.startMenuOpen = !this.startMenuOpen; this.sysSnd('click'); return;
            }

            // ウィンドウ判定 (手前から)
            for (let i = this.windows.length - 1; i >= 0; i--) {
                let w = this.windows[i];
                if (ptr.x >= w.x + w.w - 18 && ptr.x <= w.x + w.w - 4 && ptr.y >= w.y + 4 && ptr.y <= w.y + 16) {
                    this.windows.splice(i, 1); this.sysSnd('click'); return;
                }
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + 20) {
                    this.dragTarget = w; this.dragType = 'win';
                    this.dragOffX = ptr.x - w.x; this.dragOffY = ptr.y - w.y;
                    this.windows.push(this.windows.splice(i, 1)[0]); return;
                }
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + w.h) {
                    this.windows.push(this.windows.splice(i, 1)[0]);
                    this.handleAppClick(this.windows[this.windows.length - 1], ptr.x - w.x, ptr.y - w.y);
                    return;
                }
            }

            // アイコン判定
            for (let ic of this.icons) {
                if (ptr.x >= ic.x && ptr.x <= ic.x + 36 && ptr.y >= ic.y && ptr.y <= ic.y + 40) {
                    this.dragTarget = ic; this.dragType = 'icon';
                    this.dragOffX = ptr.x - ic.x; this.dragOffY = ptr.y - ic.y;
                    return;
                }
            }
        }

        if (released && this.dragTarget && this.dragType === 'icon') {
            if (Math.hypot(ptr.x - this.ptrStartX, ptr.y - this.ptrStartY) <= 3) this.openApp(this.dragTarget.id);
            this.dragTarget = null;
        }

        this.prevPtr = ptr.active;
    },

    handleAppClick(w, lx, ly) {
        this.sysSnd('click');

        // 🌐 ブラウザ
        if (w.id === 'net' && ly > 20) {
            let q = prompt("NetSurf: 検索キーワードを入力");
            if (q) {
                w.data.text = "[SEARCHING...] 照会中...";
                fetch(`https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=200&explaintext=1&titles=${encodeURIComponent(q)}&origin=*`)
                .then(r => r.json()).then(j => {
                    const pages = j.query.pages; const pageId = Object.keys(pages)[0];
                    w.data.text = pageId == "-1" ? "データが見つかりません。" : "【" + q + "】\n" + pages[pageId].extract;
                    this.sysSnd('click');
                }).catch(e => { w.data.text = "通信エラーが発生しました。"; this.sysSnd('err'); });
            }
        }
        
        // 💻 ターミナル (本物のJavaScriptプログラミング環境！)
        else if (w.id === 'term' && ly > 20) {
            let code = prompt("Terminal: JSコードを入力\n(例: SaveSys.data.slotCoins = 9999)");
            if (code) {
                w.data.logs.push("> " + code);
                try {
                    let res = eval(code); // ⚠️本物のハッキング機能
                    w.data.logs.push(res !== undefined ? String(res) : "Done.");
                    SaveSys.save(); // データ書き換えに対応
                } catch(err) {
                    w.data.logs.push("Error: " + err.message);
                    this.sysSnd('err');
                }
                if (w.data.logs.length > 10) w.data.logs.shift();
            }
        }

        // 🧩 EasyCode (ビジュアルプログラミング)
        else if (w.id === 'ecode' && ly > 20) {
            if (ly > 25 && ly < 45) { // 新規ブロック追加
                let sel = prompt("【追加する命令を選んで番号を入力】\n1: 音を鳴らす\n2: 画面を光らせる\n3: 待機(時間)\n4: アラート(文字)");
                if (sel === '1') w.data.script.push({t: 1, label: '[音を鳴らす]'});
                if (sel === '2') w.data.script.push({t: 2, label: '[フラッシュ]'});
                if (sel === '3') { let v = prompt("待機時間(フレーム, 60=1秒):"); w.data.script.push({t: 3, val: v||60, label: `[待機: ${v||60}]`}); }
                if (sel === '4') { let v = prompt("表示する文字:"); w.data.script.push({t: 4, val: v||"HELLO", label: `[文字: ${v||"HELLO"}]`}); }
            } else if (ly > 45 && ly < 65) {
                // 実行ボタン
                if (w.data.script.length > 0) { w.data.run = true; w.data.pc = 0; w.data.tmr = 0; }
            } else if (ly > 65 && ly < 85) {
                // クリアボタン
                if(confirm("プログラムを全消去しますか？")) w.data.script = [];
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
                    let act = prompt(`ファイル [${fname}]\n内容: ${SaveSys.data.osFiles[fname]}\n\n編集は文字を入力(削除は "DEL")`);
                    if (act === "DEL") {
                        SaveSys.data.trashFiles[fname] = SaveSys.data.osFiles[fname];
                        delete SaveSys.data.osFiles[fname]; SaveSys.save(); this.sysSnd('trash'); // 擬似音
                    } else if (act) { SaveSys.data.osFiles[fname] = act; SaveSys.save(); }
                }
            }
        }

        // 🗑️ ゴミ箱
        else if (w.id === 'trash' && ly > 20) {
            if (ly > 25 && ly < 45) {
                if (confirm("ゴミ箱を空にしますか？(完全削除)")) { SaveSys.data.trashFiles = {}; SaveSys.save(); this.sysSnd('err'); }
            } else {
                let files = Object.keys(SaveSys.data.trashFiles); let idx = Math.floor((ly - 50) / 20);
                if (idx >= 0 && idx < files.length) {
                    let fname = files[idx];
                    if (confirm(`[${fname}]\n復元しますか？`)) {
                        SaveSys.data.osFiles[fname] = SaveSys.data.trashFiles[fname];
                        delete SaveSys.data.trashFiles[fname]; SaveSys.save();
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
                    if (confirm(`プロセス [${target.title}] を強制終了しますか？`)) { this.windows.splice(idx, 1); this.sysSnd('err'); }
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

        // デスクトップ＆フラッシュ効果
        ctx.fillStyle = this.flashTimer > 0 ? '#fff' : '#008080'; 
        ctx.fillRect(0, 0, 200, 300);

        // アイコン
        for (let ic of this.icons) {
            ctx.fillStyle = ic.col; ctx.fillRect(ic.x, ic.y, 32, 32);
            ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.fillText(ic.txt, ic.x + 8, ic.y + 22);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.fillText(ic.title, ic.x - 2, ic.y + 42);
        }

        // 🐬 イルカアシスタントの描画
        if (this.dolph.active) {
            ctx.font = '24px monospace'; ctx.fillText('🐬', this.dolph.x, this.dolph.y + 24);
            if (this.dolph.msgTimer > 0) {
                ctx.fillStyle = '#ffc'; ctx.fillRect(this.dolph.x - 30, this.dolph.y - 30, 90, 30);
                ctx.strokeStyle = '#000'; ctx.strokeRect(this.dolph.x - 30, this.dolph.y - 30, 90, 30);
                ctx.fillStyle = '#000'; ctx.font = '9px monospace';
                this.wrapText(ctx, this.dolph.msg, this.dolph.x - 26, this.dolph.y - 20, 80, 10);
            }
        }

        // ウィンドウ
        for (let w of this.windows) {
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(w.x, w.y, w.w, 1); ctx.fillRect(w.x, w.y, 1, w.h);
            ctx.fillStyle = '#444'; ctx.fillRect(w.x, w.y + w.h - 1, w.w, 1); ctx.fillRect(w.x + w.w - 1, w.y, 1, w.h);
            
            ctx.fillStyle = w.id === 'term' ? '#000' : '#000080'; ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, 18);
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
            if (w.id === 'term') { // ハッカーターミナル
                ctx.fillStyle = '#000'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, w.h - 28);
                ctx.fillStyle = '#0f0';
                for (let i = 0; i < w.data.logs.length; i++) ctx.fillText(w.data.logs[i], w.x + 8, w.y + 36 + i * 12);
                if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText("_", w.x + 8 + ctx.measureText(w.data.logs[w.data.logs.length-1]).width, w.y + 36 + (w.data.logs.length-1) * 12);
            }
            if (w.id === 'ecode') { // はじプロ風ビジュアルコード
                ctx.fillStyle = '#efe'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, w.h - 28);
                ctx.fillStyle = '#0a0'; ctx.fillRect(w.x + 6, w.y + 26, 60, 16); ctx.fillStyle = '#fff'; ctx.fillText('＋追加', w.x + 18, w.y + 37);
                ctx.fillStyle = w.data.run ? '#888' : '#00a'; ctx.fillRect(w.x + 6, w.y + 45, 60, 16); ctx.fillStyle = '#fff'; ctx.fillText(w.data.run ? '▶実行中' : '▶実行', w.x + 15, w.y + 56);
                ctx.fillStyle = '#a00'; ctx.fillRect(w.x + 6, w.y + 64, 60, 16); ctx.fillStyle = '#fff'; ctx.fillText('消去', w.x + 22, w.y + 75);
                
                ctx.fillStyle = '#000'; ctx.fillText('▼ PROGRAM ▼', w.x + 75, w.y + 37);
                for (let i = 0; i < w.data.script.length; i++) {
                    ctx.fillStyle = (w.data.run && w.data.pc === i) ? '#ff0' : '#ddd';
                    ctx.fillRect(w.x + 72, w.y + 42 + i * 16, 70, 14);
                    ctx.fillStyle = '#000'; ctx.fillText(w.data.script[i].label, w.x + 74, w.y + 52 + i * 16);
                }
            }
            if (w.id === 'file') {
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 20); ctx.fillStyle = '#00f'; ctx.fillText('📝 ＋新規ファイル', w.x + 8, w.y + 38);
                let files = Object.keys(SaveSys.data.osFiles); ctx.fillStyle = '#000';
                for (let i = 0; i < files.length; i++) ctx.fillText('📄 ' + files[i], w.x + 8, w.y + 60 + i * 20);
            }
            if (w.id === 'trash') {
                ctx.fillStyle = '#aaa'; ctx.fillRect(w.x + 4, w.y + 24, w.w - 8, 20); ctx.fillStyle = '#f00'; ctx.fillText('🔥 ゴミ箱を空にする', w.x + 8, w.y + 38);
                let files = Object.keys(SaveSys.data.trashFiles); ctx.fillStyle = '#000';
                for (let i = 0; i < files.length; i++) ctx.fillText('🗑️ ' + files[i], w.x + 8, w.y + 60 + i * 20);
            }
            if (w.id === 'task') {
                ctx.fillText('プロセス一覧:', w.x + 6, w.y + 30);
                for (let i = 0; i < this.windows.length; i++) {
                    let tw = this.windows[i]; ctx.fillStyle = tw.id === 'task' ? '#888' : '#f00';
                    ctx.fillText('▶ ' + tw.title, w.x + 6, w.y + 45 + i * 20);
                    if (tw.id !== 'task') ctx.fillText('[KILL]', w.x + w.w - 35, w.y + 45 + i * 20);
                }
            }
            ctx.restore();
        }

        // タスクバー
        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 280, 200, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 280, 200, 1);
        if (this.startMenuOpen) { ctx.fillStyle = '#aaa'; ctx.fillRect(2, 282, 48, 16); ctx.fillStyle = '#000'; ctx.fillRect(2, 282, 48, 1); ctx.fillRect(2, 282, 1, 16); } 
        else { ctx.fillStyle = '#ddd'; ctx.fillRect(2, 282, 48, 16); ctx.fillStyle = '#fff'; ctx.fillRect(2, 282, 48, 1); ctx.fillRect(2, 282, 1, 16); }
        ctx.fillStyle = '#000'; ctx.fillText('◆ START', 6, 294);
        ctx.fillText(new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0'), 165, 294);

        if (this.startMenuOpen) {
            ctx.fillStyle = '#c0c0c0'; ctx.fillRect(2, 140, 100, 140);
            ctx.fillStyle = '#fff'; ctx.fillRect(2, 140, 100, 1); ctx.fillRect(2, 140, 1, 140);
            ctx.fillStyle = '#444'; ctx.fillRect(2, 279, 100, 1); ctx.fillRect(101, 140, 1, 140);
            ctx.fillStyle = '#000080'; ctx.fillRect(4, 142, 16, 136);
            ctx.save(); ctx.translate(14, 270); ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; 
            ctx.fillText(SaveSys.data.dolphKilled ? 'SLAYER-OS' : 'RETRO-OS', 0, 0); ctx.restore();
            for (let i = 0; i < this.icons.length; i++) {
                let ic = this.icons[this.icons.length - 1 - i];
                ctx.fillStyle = '#000'; ctx.font = '10px monospace'; ctx.fillText(ic.txt + ' ' + ic.title, 25, 257 - i * 23 + 10);
            }
        }

        if (pointer.active) {
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(pointer.x + 10, pointer.y + 10); ctx.lineTo(pointer.x + 4, pointer.y + 12); ctx.lineTo(pointer.x, pointer.y + 16); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.stroke();
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
