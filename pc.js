// === VIRTUAL PC EMULATOR (Auto-Hacking Bootloader Edition) ===
// 複数の世界的サーバーへ順番にアタックし、ファイヤーウォールを自動突破する

const PCApp = {
    emu: null,
    st: 'boot',
    scriptLoaded: false,

    init() {
        this.st = 'run';
        // 8in1のゲーム画面を隠し、PC用の黒いモニターを表示
        document.getElementById('gameCanvas').style.display = 'none';
        const v86Container = document.getElementById('v86-container');
        v86Container.style.display = 'flex';

        BGM.stop(); // 起動音に集中

        // 既にどこかの回線からシステムが読み込めていればスキップ
        if (typeof window.V86Starter !== 'undefined') {
            this.scriptLoaded = true;
        }

        if (!this.scriptLoaded) {
            this.hackAndLoad(); // ハッキング開始！
        } else if (!this.emu) {
            this.startV86("https://unpkg.com/v86@latest/build/");
        } else {
            this.emu.run(); 
        }
    },

    // 突破口を探す自動アタックプログラム
    hackAndLoad() {
        const screen = document.getElementById("v86-screen");
        
        // アタックを仕掛ける世界中のサーバー（ミラー）一覧
        const mirrors = [
            "https://unpkg.com/v86@latest/build/",
            "https://cdn.jsdelivr.net/npm/v86@latest/build/",
            "https://github.com/copy/v86/releases/download/latest/"
        ];
        
        let current = 0;

        const tryMirror = () => {
            // 全てのサーバーが弾かれた場合の最終エラー
            if (current >= mirrors.length) {
                screen.innerHTML = "<div style='color:#f00; font-family:monospace;'>[FATAL ERROR]<br>ALL CLOUD MIRRORS BLOCKED BY FIREWALL.<br><br>GIVE UP...<br>PRESS [SELECT] TO RETURN.</div>";
                return;
            }
            
            // 画面にハッキングの経過を表示する
            screen.innerHTML = `<div style='color:#0f0; font-family:monospace; font-size:12px;'>[AUTO HACKING PROTOCOL INITIATED]<br>Bypassing Firewall...<br>Connecting to Mirror ${current + 1}...<br>> ${mirrors[current]}</div>`;
            
            const script = document.createElement('script');
            script.src = mirrors[current] + "libv86.js";
            
            // 突破成功時の処理
            script.onload = () => {
                screen.innerHTML = `<div style='color:#0f0; font-family:monospace; font-size:12px;'>[ACCESS GRANTED]<br>Engine Downloaded Successfully!<br>Injecting WASM Core...</div>`;
                this.scriptLoaded = true;
                // 1秒後にPC本体の電源を入れる
                setTimeout(() => this.startV86(mirrors[current]), 1000);
            };
            
            // ブロック（失敗）されたら次のサーバーへ！
            script.onerror = () => {
                screen.innerHTML += `<br><span style='color:#f00'>[FAILED] Connection Blocked.</span>`;
                current++;
                setTimeout(tryMirror, 800); // 0.8秒後に再アタック
            };
            
            document.body.appendChild(script);
        };
        
        tryMirror();
    },

    // PCハードウェアの組み立てと起動
    startV86(baseUrl) {
        document.getElementById("v86-screen").innerHTML = "<div style='white-space: pre; font: 14px monospace; line-height: 14px; color: #fff;'></div><canvas style='display: none'></canvas>";

        // BIOSの取得先を調整
        let biosBase = baseUrl.includes("github") ? "https://unpkg.com/v86@latest/bios/" : baseUrl.replace("build/", "bios/");

        this.emu = new window.V86Starter({
            wasm_path: baseUrl + "v86.wasm",
            memory_size: 32 * 1024 * 1024,
            vga_memory_size: 2 * 1024 * 1024,
            screen_container: document.getElementById("v86-screen"),
            bios: { url: biosBase + "seabios.bin" },
            vga_bios: { url: biosBase + "vgabios.bin" },
            autostart: true,
        });
    },

    update() {
        // SELECTボタンでPCの電源を強制シャットダウン
        if (keysDown.select) {
            if (this.emu) this.emu.stop();
            document.getElementById('v86-container').style.display = 'none';
            document.getElementById('gameCanvas').style.display = 'block';
            switchApp(Menu);
            return;
        }
    },

    draw() {}
};
