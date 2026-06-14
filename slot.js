// === RETRO SLOT MACHINE v2 — FEVER & JACKPOT EVOLUTION ===
const Slot = {
    st: 'title', // title/bet/spin/reach_W/reach_A/nudge/pay/bank/shop/freeze/fever_anim
    coins: 100, bet: 1, win: 0, lines: [], msg: '', tmr: 0, rTmr: 0,
    jp: 500, free: 0, symH: 32, stoppedCount: 0,
    reels: [{ p: 0, s: 0, st: true, b: 0 }, { p: 0, s: 0, st: true, b: 0 }, { p: 0, s: 0, st: true, b: 0 }],
    winCoins: [],
    auto: false, autoTmr: 0,
    feverMode: false, feverMult: 1, feverAnim: 0,
    coinDisplay: 100, coinTarget: 100,

    shopData: [
        { id: 'f_ticket', name: 'Fスピン券', cost: 120, desc: '即座にフリースピン10回獲得!' },
        { id: 'safety',   name: 'お守り',    cost: 30,  desc: '次スピン外れで30G返金' },
        { id: 'hack',     name: 'ハッキング', cost: 300, desc: 'ランダムな図柄を強制揃え' },
        { id: 'bibine',   name: 'バイバイン', cost: 500, desc: '全所持金を1.2〜2倍にする!' },
        { id: 'remote',   name: 'リモコン',   cost: 1500, desc: '次スピンで強制JP発生(1回)' },
        { id: 'exit',     name: 'EXIT CASINO', cost: 0, desc: 'カジノを出てメニューに戻ります' }
    ],
    shopCur: 0, activeItem: null, targetSym: null, slipCount: 0,

    // Title screen mini-reels
    titleReels: [{ p: 0 }, { p: 7 }, { p: 13 }],

    sprs: {
        '7':   "0000000005555550000005500000550000055000005500000550000000000000",
        'BAR': "00000000033333303ffffff33f3333f33ffffff3033333300000000000000000",
        'BEL': "0000000000088000008888000088880008888880088888800000000000088000",
        'SUI': "00000000006a6a0006a6a6a06a6a6a6a6a6a6a6a06a6a6a0006a6a0000000000",
        'CHE': "0000600000066000006006000600006055000055550005550000000000000000",
        'WLD': "0cc00cc00cc00cc00cc00cc00cccccc00cccccc000cccc00000cc00000000000",
        'FRE': "0bbbbbb00bb000000bb000000bbbbb000bb000000bb000000bb0000000000000",
        'JP':  "0800008008800880088888800888888008588580088888800888888000000000"
    },

    // High-quality pixel art symbol renderer (40x40 space, using fillRect only)
    drawSymHQ(x, y, symStr) {
        if (!symStr) return;
        ctx.save();
        ctx.translate(x, y);
        // Outer glow/background panel
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(1, 1, 30, 30);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let p = symStr[r * 8 + c];
                if (p !== '0') {
                    let baseCol;
                    switch(p) {
                        case '3': baseCol = '#555'; break;
                        case '5': baseCol = '#f22'; break;
                        case '6': baseCol = '#0f0'; break;
                        case '8': baseCol = '#ff0'; break;
                        case 'a': baseCol = '#0ff'; break;
                        case 'b': baseCol = '#fa0'; break;
                        case 'c': baseCol = '#f8f'; break;
                        default:  baseCol = '#fff'; break;
                    }
                    let px = c * 4, py = r * 4;
                    // Main pixel
                    ctx.fillStyle = baseCol;
                    ctx.fillRect(px, py, 4, 4);
                    // Highlight top-left pixel (brighten)
                    ctx.fillStyle = 'rgba(255,255,255,0.38)';
                    ctx.fillRect(px, py, 2, 2);
                    // Shadow bottom-right pixel
                    ctx.fillStyle = 'rgba(0,0,0,0.30)';
                    ctx.fillRect(px+2, py+2, 2, 2);
                }
            }
        }
        // Gold border around the whole symbol
        ctx.strokeStyle = '#aa8800';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 32, 32);
        ctx.restore();
    },
    pays: { '7': 50, 'BAR': 20, 'BEL': 10, 'SUI': 5, 'CHE': 2 },
    lay: [
        ['CHE','SUI','BEL','BAR','CHE','SUI','CHE','BEL','7','CHE','SUI','FRE','CHE','BEL','BAR','SUI','WLD','CHE','7','SUI'],
        ['BAR','CHE','SUI','BEL','CHE','SUI','CHE','BEL','7','CHE','WLD','FRE','CHE','SUI','BAR','BEL','CHE','7','SUI','BAR'],
        ['SUI','BEL','CHE','BAR','SUI','7','CHE','BEL','SUI','CHE','JP','BAR','CHE','BEL','SUI','FRE','WLD','CHE','7','BEL']
    ],

    drawSym(x, y, symStr, scale) {
        if (!symStr) return;
        ctx.save(); ctx.translate(x, y);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                let p = symStr[r * 8 + c];
                if (p !== '0') {
                    ctx.fillStyle = p==='3'?'#444':p==='5'?'#f22':p==='6'?'#0f0':p==='8'?'#ff0':p==='a'?'#0ff':p==='b'?'#fa0':p==='c'?'#f8f':'#fff';
                    ctx.fillRect(c * scale, r * scale, Math.ceil(scale), Math.ceil(scale));
                }
            }
        }
        ctx.restore();
    },

    init() {
        let d = SaveSys.data;
        this.coins = d.slotCoins || 100; if (this.coins <= 0) this.coins = 10;
        this.jp = d.jackpotPool || 500; if (this.jp < 500) this.jp = 500;
        this.coinDisplay = this.coinTarget = this.coins;
        this.bet = 1; this.st = 'title'; this.tmr = 0; this.free = 0;
        this.msg = 'A:PLAY / ▶:SHOP / SEL:AUTO';
        for (let i = 0; i < 3; i++) { this.reels[i].p = Math.floor(Math.random() * 20) * this.symH; this.reels[i].s = 0; this.reels[i].st = true; this.reels[i].b = 0; }
        this.titleReels = [{ p: 0 }, { p: 7 * this.symH }, { p: 13 * this.symH }];
        this.activeItem = null; this.shopCur = 0; this.targetSym = null; this.slipCount = 0;
        this.winCoins = []; this.auto = false; this.autoTmr = 0; this.stoppedCount = 0;
        this.feverMode = false; this.feverMult = 1; this.feverAnim = 0;
        BGM.stop();
    },

    getSyms(i) {
        let bIdx = Math.round(this.reels[i].p / this.symH) % 20;
        return { t: this.lay[i][bIdx % 20], m: this.lay[i][(bIdx + 1) % 20], b: this.lay[i][(bIdx + 2) % 20] };
    },

    getLines(s0, s1, s2) {
        return [
            { n: 'mid', s: [s0?.m, s1?.m, s2?.m] }, { n: 'top', s: [s0?.t, s1?.t, s2?.t] },
            { n: 'bot', s: [s0?.b, s1?.b, s2?.b] }, { n: 'cr1', s: [s0?.t, s1?.m, s2?.b] },
            { n: 'cr2', s: [s0?.b, s1?.m, s2?.t] }
        ];
    },

    chkTen() {
        let stopped = [this.reels[0].st, this.reels[1].st, this.reels[2].st];
        if (stopped.filter(Boolean).length !== 2) return false;
        let s0 = stopped[0] ? this.getSyms(0) : null, s1 = stopped[1] ? this.getSyms(1) : null, s2 = stopped[2] ? this.getSyms(2) : null;
        for (let l of this.getLines(s0, s1, s2)) {
            let syms = l.s.filter(x => x !== null);
            if (syms[0] === syms[1]) return true;
            if ((syms[0] === 'WLD' || syms[1] === 'WLD') && !['FRE','JP'].includes(syms[0]) && !['FRE','JP'].includes(syms[1])) return true;
        }
        return false;
    },

    chkWin() {
        let lines = this.getLines(this.getSyms(0), this.getSyms(1), this.getSyms(2));
        this.win = 0; this.lines = []; let tF = 0, tJ = false, tFever = false;
        for (let l of lines) {
            let n = l.s.filter(s => s !== 'WLD');
            if (n.length === 0) { this.win += this.bet * 100; this.lines.push(l.n); }
            else if (n.every(s => s === n[0])) {
                let sym = n[0];
                if (sym === 'FRE' || sym === 'JP') {
                    if (n.length === 3) { if (sym === 'FRE') tF += 10; if (sym === 'JP') tJ = true; this.lines.push(l.n); }
                } else if (sym === 'BAR' && n.length === 3) {
                    // BAR × 3 → FEVER
                    tFever = true;
                    this.win += this.bet * this.pays['BAR'] * this.feverMult;
                    this.lines.push(l.n);
                } else {
                    this.win += this.bet * this.pays[sym] * this.feverMult;
                    this.lines.push(l.n);
                }
            }
        }

        // Safety: only trigger on loss, consume after
        if (this.win === 0 && this.activeItem === 'safety') { this.win += 30; this.msg = 'OMAMORI SAFE! +30G'; }
        if (this.activeItem === 'safety' && this.win > 0) this.activeItem = null;
        else if (this.activeItem === 'safety') this.activeItem = null;

        if (tJ) {
            this.win += this.jp; this.jp = 500; this.msg = 'JACKPOT!!!'; screenShake(8);
            SaveSys.addLog('スロット', 'ジャックポットを当てて大儲けした！');
        } else if (tFever) {
            this.feverMode = true; this.feverMult = 2; this.free += 5; this.feverAnim = 120;
            this.msg = 'FEVER!! 5 FREE ×2!!'; playSnd('combo');
        } else if (tF > 0) {
            this.free += tF; this.msg = 'GET ' + tF + ' FREE SPINS!';
        } else if (this.win === 0) {
            this.msg = 'YOU LOSE...';
            if (this.feverMode && this.free <= 0) { this.feverMode = false; this.feverMult = 1; }
        }

        if (this.win > 0) {
            this.winCoins = [];
            let coinAmt = Math.min(40, this.win);
            for (let i = 0; i < coinAmt; i++) { this.winCoins.push({ x: 100, y: 150, vx: (Math.random()-0.5)*8, vy: (Math.random()-1)*8-2 }); }
        }
    },

    spin() {
        if (this.activeItem === 'remote') { this.st = 'freeze'; this.tmr = 0; this.activeItem = null; playSnd('hit'); return; }
        if (this.activeItem === 'hack') { this.targetSym = ['7','BAR','BEL','SUI','CHE'][Math.floor(Math.random()*5)]; this.activeItem = null; }
        else { this.targetSym = null; }
        this.st = 'spin'; this.stoppedCount = 0; this.lines = []; this.msg = 'PRESS L/C/R or A!';
        for (let i = 0; i < 3; i++) { this.reels[i].st = false; this.reels[i].s = 12 + i * 2; }
        if (typeof BGM !== 'undefined') BGM.play('slots');
        playSnd('jmp');
        this.jp += 2;
    },

    update() {
        if (this.st === 'title') {
            this.tmr++;
            // Animate title reels
            for (let r of this.titleReels) { r.p = (r.p + 1.5) % (20 * this.symH); }
            if (keysDown.a) { this.st = 'bet'; BGM.play('menu'); playSnd('jmp'); }
            if (keysDown.select) { switchApp(Menu); return; }
            return;
        }

        if (keysDown.select) { this.auto = false; switchApp(Menu); return; }

        if (this.auto) {
            this.autoTmr++;
            if (this.st === 'bet' && this.autoTmr > 20) { if (this.coins >= this.bet || this.free > 0) { keysDown.a = true; } else { this.auto = false; } this.autoTmr = 0; }
            else if (this.st === 'spin' && this.autoTmr > 15) { keysDown.a = true; this.autoTmr = 0; }
            else if (this.st === 'reach_W' && this.autoTmr > 30) { keysDown.a = true; this.autoTmr = 0; }
            else if (this.st === 'bank' && this.autoTmr > 60) { keysDown.a = true; this.autoTmr = 0; }
        }

        this.tmr++;
        if (this.feverAnim > 0) this.feverAnim--;

        // Coin counter animation
        this.coinDisplay += (this.coinTarget - this.coinDisplay) * 0.12;
        if (Math.abs(this.coinTarget - this.coinDisplay) < 0.5) this.coinDisplay = this.coinTarget;

        if (this.winCoins.length > 0) {
            for (let c of this.winCoins) { c.x += c.vx; c.y += c.vy; c.vy += 0.5; }
            this.winCoins = this.winCoins.filter(c => c.y < 320);
        }

        if (this.st === 'shop') {
            if (keysDown.left || keysDown.b) { this.st = 'bet'; playSnd('sel'); }
            if (keysDown.up) { this.shopCur = (this.shopCur - 1 + this.shopData.length) % this.shopData.length; playSnd('sel'); }
            if (keysDown.down) { this.shopCur = (this.shopCur + 1) % this.shopData.length; playSnd('sel'); }
            if (keysDown.a) {
                let item = this.shopData[this.shopCur];
                if (item.id === 'exit') { this.auto = false; switchApp(Menu); return; }
                if (this.coins >= item.cost) {
                    if (item.id === 'f_ticket') { this.coins -= item.cost; this.free += 10; playSnd('combo'); this.msg = 'GET 10 FREE SPINS!!'; }
                    else if (item.id === 'bibine') {
                        if (this.coins >= 9999) { this.msg = 'COINS LIMIT!'; playSnd('hit'); }
                        else { let gain = Math.floor(this.coins * (1.2 + Math.random()*0.8)) - this.coins; this.coins += gain; playSnd('combo'); this.msg = 'CREDIT +' + gain + ' !!'; }
                    } else {
                        if (this.activeItem !== item.id) { this.coins -= item.cost; this.activeItem = item.id; playSnd('combo'); this.msg = item.name + ' SET!'; }
                        else { playSnd('hit'); this.msg = 'ALREADY ACTIVE!'; }
                    }
                    this.coinTarget = this.coins;
                    SaveSys.data.slotCoins = this.coins; SaveSys.save();
                } else { playSnd('hit'); }
            }
            return;
        }

        if (this.st === 'bet') {
            if (this.free > 0) {
                this.msg = 'FREE SPIN: ' + this.free + '  PRESS A';
                if (keysDown.a) { this.free--; this.spin(); }
            } else {
                if (keysDown.right) { this.st = 'shop'; this.shopCur = 0; playSnd('sel'); return; }
                if (keysDown.up) { this.bet++; if (this.bet > 3 || this.bet > this.coins) this.bet = 1; playSnd('sel'); }
                if (keysDown.down) { this.bet = Math.max(1, this.bet - 1); playSnd('sel'); }
                if (keysDown.b) { this.bet = Math.min(3, this.coins); playSnd('combo'); }
                if (keysDown.a && this.coins >= this.bet) {
                    this.coins -= this.bet; this.jp += 2;
                    this.coinTarget = this.coins;
                    SaveSys.data.slotCoins = this.coins; SaveSys.data.jackpotPool = this.jp; SaveSys.save();
                    this.spin();
                }
            }
        } else if (this.st === 'freeze') {
            if (this.tmr === 60) { playSnd('combo'); screenShake(15); this.msg = 'SYSTEM OVERRIDE!'; }
            if (this.tmr > 130) {
                for (let i = 0; i < 3; i++) { let ti = this.lay[i].indexOf('JP'); let cp = (ti - 1 + 20) % 20; this.reels[i].p = cp * this.symH; this.reels[i].st = true; this.reels[i].b = 10; }
                this.stoppedCount = 3; this.st = 'pay'; this.tmr = 0; playSnd('hit'); this.chkWin();
            }
        } else if (this.st === 'spin') {
            let tr = -1;
            if (keysDown.left && !this.reels[0].st) tr = 0;
            else if (keysDown.down && !this.reels[1].st) tr = 1;
            else if (keysDown.right && !this.reels[2].st) tr = 2;
            else if (keysDown.a) { tr = this.reels.findIndex(r => !r.st); }
            if (tr !== -1) {
                let r = this.reels[tr]; r.st = true; r.s = 0;
                if (this.targetSym) {
                    let ti = this.lay[tr].indexOf(this.targetSym), cp = (ti - 1 + 20) % 20;
                    if (this.stoppedCount < 2) { r.p = cp * this.symH; }
                    else { this.slipCount = Math.floor(Math.random()*3)+1; r.p = ((cp - this.slipCount + 20) % 20) * this.symH; }
                } else { r.p = (Math.round(r.p / this.symH) % 20) * this.symH; }
                r.b = 6; playSnd('hit'); this.stoppedCount++;
                if (this.stoppedCount === 2) { if (this.chkTen()) { this.st = 'reach_W'; this.msg = 'REACH!! PRESS A!'; this.autoTmr = 0; } }
                else if (this.stoppedCount >= 3) {
                    if (this.targetSym && this.slipCount > 0) { this.st = 'nudge'; this.tmr = 0; }
                    else { this.st = 'pay'; this.tmr = 0; this.chkWin(); }
                }
            }
        } else if (this.st === 'reach_W') {
            if (keysDown.a) { this.st = 'reach_A'; this.rTmr = 0; this.reels.find(x => !x.st).s = 4; this.msg = 'DOKI DOKI...'; playSnd('jmp'); }
        } else if (this.st === 'reach_A') {
            this.rTmr++;
            if (this.rTmr % 15 === 0) playSnd('sel');
            if (this.rTmr > 60) { let tr = this.reels.find(x => !x.st); if (tr) tr.s = 2; }
            if (this.rTmr > 100) {
                let tri = this.reels.findIndex(x => !x.st), r = this.reels[tri]; r.st = true; r.s = 0;
                if (this.targetSym) { let ti = this.lay[tri].indexOf(this.targetSym), cp = (ti - 1 + 20) % 20; this.slipCount = Math.floor(Math.random()*3)+1; r.p = ((cp - this.slipCount + 20) % 20) * this.symH; }
                else { r.p = (Math.round(r.p / this.symH) % 20) * this.symH; }
                r.b = 10; playSnd('hit'); this.stoppedCount++;
                if (this.targetSym && this.slipCount > 0) { this.st = 'nudge'; this.tmr = 0; } else { this.st = 'pay'; this.tmr = 0; this.chkWin(); }
            }
        } else if (this.st === 'nudge') {
            if (this.tmr > 20 && this.tmr % 15 === 0) {
                let r = this.reels.find(x => x.b === 10) || this.reels[2];
                r.p = (r.p + this.symH) % (20 * this.symH); r.b = 5; this.slipCount--; playSnd('hit'); this.msg = 'NUDGE! (HACKING)'; screenShake(3);
                if (this.slipCount <= 0) { this.st = 'pay'; this.tmr = 0; this.targetSym = null; this.chkWin(); }
            }
        } else if (this.st === 'pay') {
            if (this.tmr === 30 && this.win > 0) {
                playSnd('combo'); this.coins += this.win; this.coinTarget = this.coins;
                SaveSys.data.slotCoins = this.coins; SaveSys.data.jackpotPool = this.jp; SaveSys.save();
                if (!this.msg.includes('JACKPOT') && !this.msg.includes('FREE') && !this.msg.includes('OMAMORI') && !this.msg.includes('FEVER')) this.msg = 'PAYOUT: ' + this.win;
            }
            if (this.tmr > 100) {
                if (this.coins <= 0 && this.free <= 0) { this.st = 'bank'; this.msg = 'GAME OVER... PRESS A'; this.auto = false; SaveSys.addLog('スロット','全財産をすって破産した…'); }
                else { this.st = 'bet'; this.bet = Math.min(this.bet, this.coins > 0 ? this.coins : 1); this.msg = 'A:PLAY / ▶:SHOP / SEL:AUTO'; }
            }
        } else if (this.st === 'bank') {
            if (keysDown.a) { this.coins = 50; this.coinTarget = 50; SaveSys.data.slotCoins = 50; SaveSys.save(); this.st = 'bet'; this.bet = 1; this.msg = 'BONUS 50 CREDITS!'; playSnd('combo'); }
        }

        for (let i = 0; i < 3; i++) {
            if (!this.reels[i].st) { this.reels[i].p += this.reels[i].s; if (this.reels[i].p >= 20 * this.symH) this.reels[i].p -= 20 * this.symH; }
            if (this.reels[i].b > 0) this.reels[i].b--;
        }
    },

    drawLEDs(y, count) {
        let t = this.tmr;
        for (let i = 0; i < count; i++) {
            let phase = (i + t) % 6;
            let col = phase < 2 ? '#f00' : phase < 4 ? '#ff0' : '#0ff';
            let bright = phase < 2 ? '#f44' : phase < 4 ? '#ff4' : '#4ff';
            ctx.fillStyle = (i % 3 === t % 3) ? bright : col.replace(/[0-9a-f]/gi, c => Math.max(0, parseInt(c,16)-8).toString(16));
            let lx = 16 + i * (168 / (count - 1));
            ctx.beginPath(); ctx.arc(lx, y, 2.5, 0, Math.PI * 2); ctx.fill();
        }
    },

    draw() {
        if (this.st === 'title') {
            // Title screen
            let g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#200'); g.addColorStop(1, '#401'); ctx.fillStyle = g; ctx.fillRect(0, 0, 200, 300);
            // Cabinet silhouette
            ctx.fillStyle = '#333'; ctx.fillRect(25, 40, 150, 220);
            ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.strokeRect(25, 40, 150, 220); ctx.lineWidth = 1;

            // LED strip
            this.drawLEDs(48, 14);
            this.drawLEDs(252, 14);

            // Mini reel preview
            ctx.fillStyle = '#111'; ctx.fillRect(35, 60, 130, 80);
            ctx.save(); ctx.beginPath(); ctx.rect(35, 60, 130, 80); ctx.clip();
            for (let i = 0; i < 3; i++) {
                let r = this.titleReels[i], p = r.p;
                let bIdx = Math.floor(p / this.symH), off = p % this.symH;
                for (let j = -1; j <= 3; j++) {
                    let sIdx = (bIdx + j + 20) % 20;
                    this.drawSym(38 + i * 43, 64 - off + j * this.symH, this.sprs[this.lay[i][sIdx]], 2.8);
                }
            }
            ctx.restore();
            ctx.fillStyle = '#333'; ctx.fillRect(35+42, 60, 3, 80); ctx.fillRect(35+85, 60, 3, 80);
            let shadow2 = ctx.createLinearGradient(0, 60, 0, 140); shadow2.addColorStop(0, 'rgba(0,0,0,0.7)'); shadow2.addColorStop(0.2, 'rgba(0,0,0,0)'); shadow2.addColorStop(0.8, 'rgba(0,0,0,0)'); shadow2.addColorStop(1, 'rgba(0,0,0,0.7)');
            ctx.fillStyle = shadow2; ctx.fillRect(35, 60, 130, 80);

            // Title text
            ctx.textAlign = 'center';
            ctx.shadowBlur = 16; ctx.shadowColor = '#f00';
            ctx.fillStyle = '#ff0'; ctx.font = 'bold 20px monospace'; ctx.fillText('RETRO SLOT', 100, 168);
            ctx.shadowBlur = 8; ctx.shadowColor = '#fa0';
            ctx.fillStyle = '#fa0'; ctx.font = '9px monospace'; ctx.fillText('FEVER & JACKPOT EVOLUTION', 100, 182);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#888'; ctx.font = '8px monospace';
            if (Math.floor(this.tmr / 30) % 2 === 0) ctx.fillText('[ A ] INSERT COIN', 100, 220);
            return;
        }

        // Main game background
        let bgGrad = ctx.createLinearGradient(0, 0, 0, 300); bgGrad.addColorStop(0, '#100'); bgGrad.addColorStop(1, '#301');
        ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 200, 300);

        // Cabinet
        let cabG = ctx.createLinearGradient(10, 10, 190, 10); cabG.addColorStop(0, '#333'); cabG.addColorStop(0.5, '#555'); cabG.addColorStop(1, '#333');
        ctx.fillStyle = cabG; ctx.fillRect(10, 10, 180, 280);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, 180, 280); ctx.lineWidth = 1;

        // RGB LED strips
        this.drawLEDs(55, 14);
        for (let i = 0; i < 10; i++) { let ly = 65 + i * 12.2; let phase = (i + this.tmr) % 6; ctx.fillStyle = phase<2?'#f44':phase<4?'#ff4':'#4ff'; ctx.beginPath(); ctx.arc(16, ly, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(184, ly, 2, 0, Math.PI*2); ctx.fill(); }
        this.drawLEDs(185, 14);

        // FEVER rainbow overlay
        if (this.feverAnim > 0) {
            let hue = (this.tmr * 8) % 360;
            ctx.fillStyle = `hsla(${hue},100%,50%,${this.feverAnim / 120 * 0.25})`;
            ctx.fillRect(0, 0, 200, 300);
        }

        if (this.st === 'shop') {
            ctx.fillStyle = 'rgba(0,10,0,0.92)'; ctx.fillRect(15, 20, 170, 260);
            ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1.5; ctx.strokeRect(15, 20, 170, 260); ctx.lineWidth = 1;
            ctx.fillStyle = '#0f0'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText('── BLACK MARKET ──', 100, 42);
            ctx.font = '10px monospace'; ctx.textAlign = 'left';
            for (let i = 0; i < this.shopData.length; i++) {
                let itm = this.shopData[i], sel = this.shopCur === i;
                ctx.fillStyle = sel ? '#ff0' : '#0f0';
                if (sel) { ctx.shadowBlur = 6; ctx.shadowColor = '#ff0'; }
                ctx.fillText((sel ? '> ' : '  ') + itm.name, 24, 65 + i * 23);
                ctx.shadowBlur = 0;
                ctx.fillStyle = this.coins >= itm.cost || itm.cost === 0 ? '#0ff' : '#055';
                if (itm.cost > 0) ctx.fillText(itm.cost + 'G', 148, 65 + i * 23);
                if (this.activeItem === itm.id) { ctx.fillStyle = '#f44'; ctx.font = '7px monospace'; ctx.fillText('ACTIVE', 155, 57 + i * 23); ctx.font = '10px monospace'; }
            }
            ctx.fillStyle = '#0a0'; ctx.fillRect(20, 212, 160, 1);
            ctx.fillStyle = '#aaa'; ctx.font = '8px monospace'; ctx.fillText(this.shopData[this.shopCur].desc, 22, 226);
            ctx.fillStyle = '#555'; ctx.fillText('A:BUY / B,◀:EXIT', 50, 252);
            return;
        }

        // Shop arrow
        if (this.st === 'bet') {
            ctx.fillStyle = '#ff0'; ctx.fillRect(180, 120, 10, 40);
            ctx.fillStyle = '#000'; ctx.font = '8px monospace';
            'SHOP'.split('').forEach((c, i) => ctx.fillText(c, 182, 130 + i * 8));
            if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText('▶', 182, 164);
        }

        // JP display
        ctx.fillStyle = '#000'; ctx.fillRect(25, 20, 150, 28);
        ctx.fillStyle = '#100'; for (let y = 22; y < 48; y += 2) ctx.fillRect(25, y, 150, 1);
        ctx.shadowBlur = 6; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
        ctx.fillText('★ JACKPOT: ' + this.jp, 30, 40);
        if (this.feverMode) { ctx.fillStyle = '#fa0'; ctx.shadowColor = '#fa0'; ctx.font = 'bold 9px monospace'; ctx.fillText('FEVER×2', 138, 32); }
        if (this.auto) { ctx.fillStyle = '#f00'; ctx.fillRect(25, 23, 28, 10); ctx.fillStyle = '#fff'; ctx.font = '7px monospace'; ctx.fillText('AUTO', 28, 31); }
        ctx.shadowBlur = 0;

        // Reel window
        ctx.fillStyle = '#ddd'; ctx.fillRect(25, 62, 150, 116);
        ctx.save(); ctx.beginPath(); ctx.rect(25, 62, 150, 116); ctx.clip();
        for (let i = 0; i < 3; i++) {
            let r = this.reels[i], rx = 29 + i * 50;
            let bOff = r.b % 2 === 0 ? r.b : -r.b;
            let bIdx = Math.floor(r.p / this.symH), off = r.p % this.symH;
            for (let j = -1; j <= 4; j++) {
                let sIdx = (bIdx + j + 20) % 20;
                this.drawSymHQ(rx, 68 - off + j * this.symH + bOff, this.sprs[this.lay[i][sIdx]]);
            }
        }
        ctx.restore();

        // Reel shadows
        let sh = ctx.createLinearGradient(0, 62, 0, 178);
        sh.addColorStop(0, 'rgba(0,0,0,0.8)'); sh.addColorStop(0.15, 'rgba(0,0,0,0)');
        sh.addColorStop(0.85, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = sh; ctx.fillRect(25, 62, 150, 116);
        ctx.fillStyle = '#333'; ctx.fillRect(73, 62, 4, 116); ctx.fillRect(123, 62, 4, 116);
        ctx.fillStyle = '#ccc'; ctx.fillRect(74, 62, 2, 116); ctx.fillRect(124, 62, 2, 116);

        // Freeze overlay
        if (this.st === 'freeze') {
            ctx.fillStyle = this.tmr < 60 ? 'rgba(0,0,0,0.9)' : (this.tmr%4<2 ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,200,0.5)');
            ctx.fillRect(25, 62, 150, 116);
            if (this.tmr >= 60) { ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace'; ctx.fillText('SYSTEM OVERRIDE', 100, 125); }
        }

        // Win line flash
        if (this.st === 'pay' && this.win > 0) {
            // Screen glow
            let glow = Math.abs(Math.sin(this.tmr * 0.2));
            ctx.fillStyle = `rgba(255,220,0,${glow * 0.12})`; ctx.fillRect(0, 0, 200, 300);

            if (this.tmr % 10 < 5) {
                ctx.lineWidth = 4; ctx.shadowBlur = 12; ctx.shadowColor = '#ff0'; ctx.strokeStyle = '#ff0';
                if (this.lines.includes('mid')) { ctx.beginPath(); ctx.moveTo(25, 120); ctx.lineTo(175, 120); ctx.stroke(); }
                if (this.lines.includes('top')) { ctx.beginPath(); ctx.moveTo(25, 78); ctx.lineTo(175, 78); ctx.stroke(); }
                if (this.lines.includes('bot')) { ctx.beginPath(); ctx.moveTo(25, 162); ctx.lineTo(175, 162); ctx.stroke(); }
                if (this.lines.includes('cr1')) { ctx.beginPath(); ctx.moveTo(25, 78); ctx.lineTo(175, 162); ctx.stroke(); }
                if (this.lines.includes('cr2')) { ctx.beginPath(); ctx.moveTo(25, 162); ctx.lineTo(175, 78); ctx.stroke(); }
                ctx.shadowBlur = 0; ctx.lineWidth = 1;
            }
        } else {
            ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            [78, 120, 162].forEach(y => { ctx.beginPath(); ctx.moveTo(25, y); ctx.lineTo(175, y); ctx.stroke(); });
            ctx.beginPath(); ctx.moveTo(25, 78); ctx.lineTo(175, 162); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(25, 162); ctx.lineTo(175, 78); ctx.stroke();
            ctx.lineWidth = 1;
        }

        // FEVER text overlay
        if (this.feverAnim > 0 && this.feverAnim > 60) {
            let alpha = Math.min(1, (this.feverAnim - 60) / 30);
            ctx.textAlign = 'center'; ctx.shadowBlur = 20; ctx.shadowColor = '#fa0';
            ctx.fillStyle = `rgba(255,160,0,${alpha})`;
            ctx.font = 'bold 28px monospace'; ctx.fillText('FEVER!!', 100, 125);
            ctx.font = 'bold 11px monospace'; ctx.fillText('5 FREE SPINS ×2', 100, 145);
            ctx.shadowBlur = 0;
        }

        // Bottom credit panel
        ctx.fillStyle = '#000'; ctx.fillRect(25, 192, 150, 50);
        ctx.fillStyle = '#100'; for (let y = 194; y < 240; y += 2) ctx.fillRect(25, y, 150, 1);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f0'; ctx.font = '11px monospace';
        ctx.fillText('CREDIT ' + Math.floor(this.coinDisplay), 30, 208);
        ctx.fillStyle = '#ff0'; ctx.fillText('BET ' + this.bet, 128, 208);

        if (this.activeItem) {
            ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
            ctx.fillText('[' + (this.shopData.find(i => i.id === this.activeItem)?.name || '') + ']', 30, 224);
        } else {
            ctx.fillStyle = this.st === 'pay' && this.win > 0 ? '#ff0' : (this.free > 0 ? '#0ff' : '#aaa');
            ctx.font = '9px monospace'; ctx.fillText(this.msg, 30, 224);
        }
        if (this.st === 'spin') { ctx.fillStyle = '#0f0'; ctx.font = '9px monospace'; ctx.fillText('◀:L ▼:C ▶:R A:AUTO', 28, 238); }
        else if (this.st === 'bet' && this.tmr % 40 < 20) { ctx.fillStyle = '#0f0'; ctx.font = '9px monospace'; ctx.fillText('PRESS A TO PLAY', 40, 238); }

        // Pay table
        ctx.fillStyle = '#111'; ctx.fillRect(20, 250, 160, 30);
        ctx.fillStyle = '#888'; ctx.font = '7px monospace';
        ctx.fillText('7:×50 BAR:×20 BEL:×10 SUI:×5 CHE:×2', 23, 261);
        ctx.fillStyle = '#f8f'; ctx.fillText('[W]:WILD', 23, 272);
        ctx.fillStyle = '#0ff'; ctx.fillText('[F]:FREE', 78, 272);
        ctx.fillStyle = '#ff0'; ctx.fillText('[JP]:JACKPOT', 122, 272);

        // Coin particles
        if (this.winCoins.length > 0) {
            ctx.strokeStyle = '#a80'; ctx.lineWidth = 1;
            for (let c of this.winCoins) {
                ctx.fillStyle = '#ff0'; ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            }
            ctx.lineWidth = 1;
        }
    }
};
