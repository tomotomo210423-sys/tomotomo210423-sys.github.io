// === VIRTUAL PC EMULATOR (v86 Debug & Cloud Boot Edition) ===

const PCApp = {
    emu: null,
    st: 'boot',
    logs: [],
    progress: {},
    errorMsg: null,

    addLog(msg) {
        this.logs.push(`> ${msg}`);
        if(this.logs.length > 8) this.logs.shift();
        this.refreshScreen();
    },

    refreshScreen() {
        const screen = document.getElementById("v86-screen");
        if (!screen) return;

        let html = "<div style='font: 10px monospace; color: #0f0; background: #000; padding: 10px; border: 1px solid #0f0;'>";
        html += "<div style='color: #ff0; margin-bottom: 5px;'>SYSTEM DEPLOYMENT...</div>";
        
        // ログの表示
        this.logs.forEach(l => html += `<div>${l}</div>`);

        // プログレスバーの表示
        if (!this.errorMsg) {
            Object.keys(this.progress).forEach(file => {
                const p = this.progress[file];
                const barLen = 15;
                const filled = Math.floor((p.loaded / p.total) * barLen);
                const bar = "▓".repeat(filled) + "░".repeat(barLen - filled);
                const percent = Math.floor((p.loaded / p.total) * 100);
                html += `<div style='margin-top:5px;'>${file.padEnd(8)} [${bar}] ${percent}%</div>`;
            });
        } else {
            // エラー表示（赤色）
            html += `<div style='color: #f00; margin-top: 10px; border-top: 1px solid #f00;'>[FATAL ERROR]</div>`;
            html += `<div style='color: #f55; font-size: 9px;'>REASON: ${this.errorMsg}</div>`;
            html += `<div style='color: #aaa; margin-top: 5px;'>TIP: Check Network or Firewall</div>`;
        }

        html += "</div>";
        screen.innerHTML = html;
    },

    init() {
        this.st = 'boot';
        this.logs = [];
        this.progress = {};
        this.errorMsg = null;

        document.getElementById('gameCanvas').style.display = 'none';
        document.getElementById('v86-container').style.display = 'flex';
        BGM.stop();

        this.addLog("Initializing hardware...");

        if (typeof window.V86Starter === 'undefined') {
            this.errorMsg = "libv86.js not found in window object.";
            this.refreshScreen();
            return;
        }

        try {
            this.emu = new window.V86Starter({
                wasm_path: "https://copy.sh/v86/build/v86.wasm",
                memory_size: 32 * 1024 * 1024,
                vga_memory_size: 2 * 1024 * 1024,
                screen_container: document.getElementById("v86-screen"),
                bios: { url: "https://copy.sh/v86/bios/seabios.bin" },
                vga_bios: { url: "https://copy.sh/v86/bios/vgabios.bin" },
                fda: { url: "https://copy.sh/v86/images/freedos722.img" }, 
                autostart: true,
            });

            this.addLog("Network linking...");

            // ロード状況をフックしてプログレスバーに反映
            this.emu.add_listener("download-progress", (e) => {
                const fileName = e.file.split('/').pop();
                this.progress[fileName] = { loaded: e.loaded, total: e.total };
                this.refreshScreen();
            });

            this.emu.add_listener("download-error", (e) => {
                this.errorMsg = `Failed to load: ${e.file}`;
                this.refreshScreen();
            });

            // 起動成功時
            let hasStarted = false;
            this.emu.add_listener("emulator-started", () => {
                if(!hasStarted) {
                    this.addLog("Hardware Ready.");
                    this.addLog("Booting OS...");
                    hasStarted = true;
                    // OSが起動し始めたら画面をクリアして本物のPC画面に切り替える
                    setTimeout(() => {
                        if (this.emu) {
                            document.getElementById("v86-screen").innerHTML = "";
                            // v86が自動で生成するcanvasやdivがここに表示される
                        }
                    }, 2000);
                }
            });

        } catch (e) {
            this.errorMsg = e.message;
            this.refreshScreen();
        }
    },

    update() {
        if (keysDown.select) {
            if (this.emu) {
                this.emu.stop();
                this.emu = null;
            }
            document.getElementById('v86-container').style.display = 'none';
            document.getElementById('gameCanvas').style.display = 'block';
            switchApp(Menu);
            return;
        }
    },

    draw() {}
};
