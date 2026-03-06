// === RETRO-OS (Canvas Fake Desktop System v2.0) ===
// 検索エンジンをWikipedia全文検索に換装＆PC必須ツールを多数追加！

const PCApp = {
    windows: [],
    icons: [
        { id: 'net', title: 'NetSurf', x: 10, y: 10, col: '#00f', txt: '🌐' },
        { id: 'file', title: 'FileDesk', x: 10, y: 60, col: '#da0', txt: '📁' },
        { id: 'cmd', title: 'Terminal', x: 10, y: 110, col: '#000', txt: '💻' },
        { id: 'media', title: 'AudioPlyr', x: 10, y: 160, col: '#f0f', txt: '🎵' },
        { id: 'task', title: 'TaskMgr', x: 60, y: 10, col: '#666', txt: '⚙️' },
        { id: 'calc', title: 'Calc', x: 60, y: 60, col: '#088', txt: '🧮' },
        { id: 'sys', title: 'SysInfo', x: 60, y: 110, col: '#a0a', txt: '🖥️' }
    ],
    dragTarget: null,
    dragOffX: 0, dragOffY: 0,
    prevPtr: false,
    bootTimer: 60,
    
    init() {
        this.windows = [];
        this.dragTarget = null;
        this.prevPtr = false;
        this.bootTimer = 60; 
        BGM.stop();
        
        if (!SaveSys.data.osFiles) {
            SaveSys.data.osFiles = { 
                'README.TXT': 'RETRO-OS v2.0 へようこそ！\n新機能：\n・ブラウザの検索精度向上\n・ターミナル搭載\n・メディアプレイヤー搭載',
                'SECRET.LOG': 'SYSTEM OVERRIDE SUCCESS.\nHACKER ALIAS: ' + SaveSys.data.playerName
            };
            SaveSys.save();
        }
    },

    openApp(id) {
        let exist = this.windows.find(w => w.id === id);
        if (exist) {
            this.windows = this.windows.filter(w => w !== exist);
            this.windows.push(exist);
            return;
        }

        let w = { id: id, x: 20 + this.windows.length * 10, y: 20 + this.windows.length * 10, w: 140, h: 160, data: {} };
        
        if (id === 'net') { 
            w.title = 'NetSurf v2.0'; w.w = 160; w.h = 200; 
            w.data = { url: 'http://home.retro', text: 'Welcome to NetSurf.\n\n上の【URLバー】をタップして\n検索キーワードを入力してください。' }; 
        }
        else if (id === 'file') { w.title = 'FileDesk (C:\\)'; }
        else if (id === 'cmd') { 
            w.title = 'C:\\CMD.EXE'; w.w = 150; w.h = 130; 
            w.data.log = ['RETRO-OS MS-DOS v2.0', '(C) RETRO Corp.', '']; 
        }
        else if (id === 'media') { 
            w.title = 'Media Player'; w.w = 130; w.h = 120; 
            w.data = { track: 'menu', playing: false }; 
        }
        else if (id === 'task') { w.title = 'Task Manager'; w.w = 130; w.h = 140; }
        else if (id === 'calc') { w.title = 'Calculator'; w.w = 110; w.h = 150; w.data.val = '0'; }
        else if (id === 'sys') { w.title = 'System Properties'; w.w = 140; w.h = 100; }
        
        this.windows.push(w);
    },

    update() {
        if (keysDown.select) { switchApp(Menu); return; }

        if (this.bootTimer > 0) { this.bootTimer--; return; }

        const ptr = pointer;
        const clicked = ptr.active && !this.prevPtr;
        this.prevPtr = ptr.active;

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
            for (let i = this.windows.length - 1; i >= 0; i--) {
                let w = this.windows[i];
                if (ptr.x >= w.x + w.w - 18 && ptr.x <= w.x + w.w - 4 && ptr.y >= w.y + 4 && ptr.y <= w.y + 16) {
                    this.windows.splice(i, 1);
                    return;
                }
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + 20) {
                    this.dragTarget = w;
                    this.dragOffX = ptr.x - w.x;
                    this.dragOffY = ptr.y - w.y;
                    this.windows.push(this.windows.splice(i, 1)[0]);
                    return;
                }
                if (ptr.x >= w.x && ptr.x <= w.x + w.w && ptr.y >= w.y && ptr.y <= w.y + w.h) {
                    this.windows.push(this.windows.splice(i, 1)[0]);
                    this.handleAppClick(this.windows[this.windows.length - 1], ptr.x - w.x, ptr.y - w.y);
                    return;
                }
            }

            for (let ic of this.icons) {
                if (ptr.x >= ic.x && ptr.x <= ic.x + 36 && ptr.y >= ic.y && ptr.y <= ic.y + 40) {
                    this.openApp(ic.id);
                    return;
                }
            }
            
            if (ptr.x >= 2 && ptr.x <= 50 && ptr.y >= 282 && ptr.y <= 298) {
                alert("START MENU: \n現在アップデート準備中です！\nSELECTボタンでシステムを終了できます。");
            }
        }
    },

    handleAppClick(w, lx, ly) {
        // 🌐 ブラウザ機能 (Wikipedia全文検索API連携)
        if (w.id === 'net' && ly > 20) {
            // URLバー周辺をタップした場合のみ検索を起動
            if (ly > 20 && ly < 45) {
                let q = prompt("NetSurf: 検索キーワードを入力\n例：「エビ」「足首 捻挫 どうすればいい」");
                if (q) {
                    w.data.url = `search://?q=${encodeURIComponent(q).substring(0, 15)}...`;
                    w.data.text = "検索中... ネットワークを解析しています。";
                    
                    fetch(`https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&utf8=&format=json&origin=*`)
                    .then(r => r.json()).then(j => {
                        if (j.query && j.query.search && j.query.search.length > 0) {
                            let res = `[検索結果: ${q}]\n\n`;
                            // 上位3件の結果をスニペット表示
                            for(let i=0; i<Math.min(3, j.query.search.length); i++) {
                                let item = j.query.search[i];
                                let snip = item.snippet.replace(/<[^>]*>?/gm, '').substring(0, 45) + '...';
                                res += `■ ${item.title}\n  ${snip}\n\n`;
                            }
                            w.data.text = res;
                        } else {
                            w.data.text = `"${q}" に一致する情報は見つかりませんでした。\n別のキーワードをお試しください。`;
                        }
                    }).catch(e => { w.data.text = "通信エラーが発生しました。ネットワークを確認してください。"; });
                }
            }
        }
        
        // 💻 コマンドプロンプト (Terminal)
        else if (w.id === 'cmd' && ly > 20) {
            let cmd = prompt("C:\\> コマンドを入力 (help, dir, date, clear, echo)");
            if (cmd !== null) {
                w.data.log.push(`C:\\>${cmd}`);
                let c = cmd.trim().toLowerCase();
                if (c === 'help') w.data.log.push('COMMANDS: help, dir, date, clear, echo');
                else if (c === 'dir') w.data.log.push(' Volume in drive C has no label.\n README.TXT\n SECRET.LOG');
                else if (c === 'date') w.data.log.push(new Date().toString().substring(0, 24));
                else if (c === 'clear' || c === 'cls') w.data.log = [''];
                else if (c.startsWith('echo ')) w.data.log.push(cmd.substring(5));
                else if (c !== '') w.data.log.push(`Bad command or file name`);
                w.data.log.push('');
                if(w.data.log.length > 7) w.data.log = w.data.log.slice(w.data.log.length - 7);
            }
        }

        // 🎵 メディアプレイヤー
        else if (w.id === 'media' && ly > 20) {
            if (ly > 25 && ly < 45) w.data.track = 'menu';
            if (ly > 45 && ly < 65) w.data.track = 'action';
            if (ly > 65 && ly < 85) w.data.track = 'tetri';
            
            if (ly > 90) { 
                if (lx < w.w / 2) { BGM.play(w.data.track); w.data.playing = true; } // PLAY
                else { BGM.stop(); w.data.playing = false; } // STOP
            }
        }

        // 📁 フォルダ＆メモ帳
        else if (w.id === 'file' && ly > 20) {
            if (ly > 25 && ly < 45) { 
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
                        delete SaveSys.data.osFiles[fname]; SaveSys.save();
                    } else if (act) {
                        SaveSys.data.osFiles[fname] = act; SaveSys.save();
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

    draw() {
        if (this.bootTimer > 0) {
            ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
            ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
            ctx.fillText('BIOS Date 03/06/26', 10, 20);
            ctx.fillText('Memory Test: ' + (60 - this.bootTimer) * 1024 + ' KB OK', 10, 40);
            if (this.bootTimer < 20) ctx.fillText('Starting RETRO-OS...', 10, 70);
            return;
        }

        ctx.fillStyle = '#008080'; ctx.fillRect(0, 0, 200, 300); // Desktop Background

        for (let ic of this.icons) {
            ctx.fillStyle = ic.col; ctx.fillRect(ic.x, ic.y, 32, 32);
            ctx.fillStyle = '#fff'; ctx.font = '16px monospace'; ctx.fillText(ic.txt, ic.x + 8, ic.y + 22);
            ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
            ctx.fillText(ic.title, ic.x - 2, ic.y + 42);
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

            ctx.fillStyle = '#000'; ctx.font = '9px monospace';
            
            if (w.id === 'net') {
                // アドレスバーの描画
                ctx.fillStyle = '#ddd'; ctx.fillRect(w.x + 2, w.y + 20, w.w - 4, 18);
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 4, w.y + 22, w.w - 24, 14);
                ctx.fillStyle = '#000'; ctx.fillText(w.data.url, w.x + 6, w.y + 32);
                ctx.fillStyle = '#888'; ctx.fillRect(w.x + w.w - 18, w.y + 22, 14, 14);
                ctx.fillStyle = '#fff'; ctx.fillText('🔍', w.x + w.w - 18, w.y + 32);
                
                // コンテンツエリア
                ctx.fillStyle = '#fff'; ctx.fillRect(w.x + 2, w.y + 40, w.w - 4, w.h - 42);
                ctx.fillStyle = '#000'; 
                this.wrapText(ctx, w.data.text, w.x + 6, w.y + 52, w.w - 12, 12);
            }
            if (w.id === 'cmd') {
                ctx.fillStyle = '#000'; ctx.fillRect(w.x + 2, w.y + 20, w.w - 4, w.h - 22);
                ctx.fillStyle = '#0f0';
                for (let i = 0; i < w.data.log.length; i++) {
                    ctx.fillText(w.data.log[i], w.x + 4, w.y + 32 + i * 12);
                }
                if (Date.now() % 1000 < 500) ctx.fillRect(w.x + 4 + ctx.measureText(w.data.log[w.data.log.length-1] || '').width, w.y + 24 + (w.data.log.length-1) * 12, 5, 9);
            }
            if (w.id === 'media') {
                ctx.fillStyle = '#333'; ctx.fillRect(w.x + 2, w.y + 20, w.w - 4, w.h - 22);
                let tracks = ['menu', 'action', 'tetri'];
                for (let i = 0; i < tracks.length; i++) {
                    ctx.fillStyle = w.data.track === tracks[i] ? '#00f' : '#555';
                    ctx.fillRect(w.x + 4, w.y + 24 + i * 20, w.w - 8, 18);
                    ctx.fillStyle = '#fff'; ctx.fillText('🎵 ' + tracks[i].toUpperCase(), w.x + 8, w.y + 36 + i * 20);
                }
                ctx.fillStyle = '#0a0'; ctx.fillRect(w.x + 4, w.y + 90, w.w/2 - 6, 20);
                ctx.fillStyle = '#fff'; ctx.fillText('▶ PLAY', w.x + 12, w.y + 104);
                ctx.fillStyle = '#a00'; ctx.fillRect(w.x + w.w/2 + 2, w.y + 90, w.w/2 - 6, 20);
                ctx.fillStyle = '#fff'; ctx.fillText('■ STOP', w.x + w.w/2 + 10, w.y + 104);
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
                ctx.fillText(`OS: RETRO-OS v2.0`, w.x + 6, w.y + 70);
                ctx.fillText(`TIME: ${new Date().toLocaleTimeString()}`, w.x + 6, w.y + 85);
            }
        }

        ctx.fillStyle = '#c0c0c0'; ctx.fillRect(0, 280, 200, 20);
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 280, 200, 1);
        ctx.fillStyle = '#ddd'; ctx.fillRect(2, 282, 48, 16); 
        ctx.fillStyle = '#000'; ctx.fillText('◆ START', 6, 294);
        ctx.fillText(new Date().getHours() + ':' + String(new Date().getMinutes()).padStart(2, '0'), 165, 294);
        
        if (pointer.active) {
            ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(pointer.x, pointer.y); ctx.lineTo(pointer.x + 10, pointer.y + 10); ctx.lineTo(pointer.x + 4, pointer.y + 12); ctx.lineTo(pointer.x, pointer.y + 16); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.stroke();
        }
    },
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        let chars = text.split(''); let line = '';
        for (let n = 0; n < chars.length; n++) {
            let testLine = line + chars[n];
            if (ctx.measureText(testLine).width > maxWidth && n > 0 && chars[n] !== '\n') {
                ctx.fillText(line, x, y); line = chars[n]; y += lineHeight;
            } else if (chars[n] === '\n') {
                ctx.fillText(line, x, y); line = ''; y += lineHeight;
            } else { line = testLine; }
        }
        ctx.fillText(line, x, y);
    }
};
