// === VIRTUAL PC EMULATOR (v86 Engine - Cloud Boot Edition) ===

const PCApp = {
    emu: null,
    st: 'boot',

    init() {
        this.st = 'run';
        // 8in1のゲーム画面を隠し、PC用の黒いモニターを表示
        document.getElementById('gameCanvas').style.display = 'none';
        const v86Container = document.getElementById('v86-container');
        v86Container.style.display = 'flex';

        BGM.stop(); // 起動音に集中するためBGM停止

        if (!this.emu) {
            // V86Starterが読み込まれるまで少し待つ処理
            if (typeof window.V86Starter === 'undefined') {
                document.getElementById("v86-screen").innerHTML = "<div style='color:#0f0'>LOADING SYSTEM FROM CLOUD...</div>";
                setTimeout(() => this.init(), 500);
                return;
            }

            document.getElementById("v86-screen").innerHTML = "<div style='white-space: pre; font: 14px monospace; line-height: 14px; color: #fff;'></div><canvas style='display: none'></canvas>";

            // エミュレータの構築（すべてv86公式サーバーから直接ダウンロードして起動！）
            this.emu = new window.V86Starter({
                wasm_path: "https://copy.sh/v86/build/v86.wasm",
                memory_size: 32 * 1024 * 1024,
                vga_memory_size: 2 * 1024 * 1024,
                screen_container: document.getElementById("v86-screen"),
                // マザーボードシステム
                bios: { url: "https://copy.sh/v86/bios/seabios.bin" },
                vga_bios: { url: "https://copy.sh/v86/bios/vgabios.bin" },
                // テスト用OS（FreeDOS）
                fda: { url: "https://copy.sh/v86/images/freedos722.img" }, 
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
