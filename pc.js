// === VIRTUAL PC EMULATOR (v86 Engine - Global CDN Edition) ===
// ファイヤーウォールを突破し、世界最強のCDNからシステムを構築する

const PCApp = {
    emu: null,
    st: 'boot',
    retryCount: 0,

    init() {
        this.st = 'run';
        // 8in1のゲーム画面を隠し、PC用の黒いモニターを表示
        document.getElementById('gameCanvas').style.display = 'none';
        const v86Container = document.getElementById('v86-container');
        v86Container.style.display = 'flex';

        BGM.stop(); // 起動音に集中するためBGM停止

        if (!this.emu) {
            // V86Starterが読み込まれるまでリトライし続ける（最大10回）
            if (typeof window.V86Starter === 'undefined') {
                this.retryCount++;
                document.getElementById("v86-screen").innerHTML = `<div style='color:#0f0'>LOADING SYSTEM FROM CDN... (ATTEMPT ${this.retryCount})</div>`;
                
                if (this.retryCount > 10) {
                    // 10回やってもダメならハッキング失敗画面
                    document.getElementById("v86-screen").innerHTML = "<div style='color:#f00'>[FATAL ERROR]<br>NETWORK BLOCKED OR OFFLINE.<br>PRESS [SELECT] TO RETURN.</div>";
                } else {
                    setTimeout(() => this.init(), 1000);
                }
                return;
            }

            // 読み込み成功！PCの画面の土台を作る
            document.getElementById("v86-screen").innerHTML = "<div style='white-space: pre; font: 14px monospace; line-height: 14px; color: #fff;'></div><canvas style='display: none'></canvas>";

            // エミュレータの構築（すべてCDNから直接ダウンロード）
            this.emu = new window.V86Starter({
                wasm_path: "https://cdn.jsdelivr.net/gh/copy/v86@master/build/v86.wasm",
                memory_size: 32 * 1024 * 1024,
                vga_memory_size: 2 * 1024 * 1024,
                screen_container: document.getElementById("v86-screen"),
                // マザーボードシステム
                bios: { url: "https://cdn.jsdelivr.net/gh/copy/v86@master/bios/seabios.bin" },
                vga_bios: { url: "https://cdn.jsdelivr.net/gh/copy/v86@master/bios/vgabios.bin" },
                // テスト用OS（FreeDOS）
                fda: { url: "https://cdn.jsdelivr.net/gh/copy/v86@master/images/freedos722.img" }, 
                autostart: true,
            });
        } else {
            this.emu.run(); 
        }
    },

    update() {
        // SELECTボタンでPCの電源を切り、8in1メニューに戻る
        if (keysDown.select) {
            if (this.emu) this.emu.stop();
            document.getElementById('v86-container').style.display = 'none';
            document.getElementById('gameCanvas').style.display = 'block';
            switchApp(Menu);
            return;
        }
    },

    draw() {
        // 描画はv86が自動で行うためJS側からはノータッチ
    }
};
