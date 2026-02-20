// === RETRO SLOT MACHINE (TRANSFORM EDITION) ===
const Slot = {
  st: 'bet', coins: 100, bet: 1, winAmount: 0, winLines: [], msg: 'BET & PRESS A', timer: 0, reachTimer: 0,
  jackpotPool: 1000, freeSpins: 0, symHeight: 32, 
  reels: [{ pos:0, speed:0, stopped:true, bounce:0 }, { pos:0, speed:0, stopped:true, bounce:0 }, { pos:0, speed:0, stopped:true, bounce:0 }],
  stopIndex: 0,
  
  symSprs: {
    'seven': "0000000005555550000005500000550000055000005500000550000000000000",
    'bar':   "00000000033333303ffffff33f3333f33ffffff3033333300000000000000000",
    'bell':  "0000000000088000008888000088880008888880088888800000000000088000",
    'suika': "00000000006a6a0006a6a6a06a6a6a6a6a6a6a6a06a6a6a0006a6a0000000000",
    'cherry':"0000600000066000006006000600006055000055550005550000000000000000",
    'wild':  "ccccccccc22cc22cc22cc22cc22c222cc222222cc22cc22ccccccccc00000000",
    'free':  "bbbbbbbbb22222bbbb22bbbbbb2222bbbb22bbbbbb22bbbbbbbbbbbb00000000",
    'jp':    "8888888885888858858888588558855885555558855555588888888800000000"
  },
  payouts: { 'seven': 50, 'bar': 20, 'bell': 10, 'suika': 5, 'cherry': 2 },
  
  layout: [
    ['cherry', 'suika', 'bell', 'bar', 'cherry', 'wild', 'suika', 'cherry', 'bell', 'seven', 'cherry', 'suika', 'free', 'cherry', 'bell', 'bar', 'suika', 'jp', 'cherry', 'seven'],
    ['bar', 'cherry', 'suika', 'bell', 'cherry', 'jp', 'suika', 'cherry', 'bell', 'seven', 'cherry', 'wild', 'free', 'cherry', 'suika', 'bar', 'bell', 'cherry', 'seven', 'suika'],
    ['suika', 'bell', 'cherry', 'bar', 'suika', 'seven', 'cherry', 'bell', 'wild', 'suika', 'cherry', 'jp', 'bar', 'cherry', 'bell', 'suika', 'free', 'cherry', 'seven', 'bell']
  ],

  init() {
    // ★ 起動時にゲーム機をスロット筐体に変形させる！
    document.getElementById('gameboy').classList.add('mode-slot');
    
    if (SaveSys.data.slotCoins === undefined) SaveSys.data.slotCoins = 100;
    if (SaveSys.data.jackpotPool === undefined) SaveSys.data.jackpotPool = 1000;
    this.coins = SaveSys.data.slotCoins; this.jackpotPool = SaveSys.data.jackpotPool;
    if (this.coins <= 0) { this.coins = 10; SaveSys.data.slotCoins = this.coins; SaveSys.save(); }
    
    this.bet = 1; this.st = 'bet'; this.timer = 0; this.freeSpins = 0;
    this.msg = 'BET: U/D or B  START: A'; 
    for(let i=0; i<3; i++) {
        this.reels[i].pos = Math.floor(Math.random() * 20) * this.symHeight;
        this.reels[i].speed = 0; this.reels[i].stopped = true; this.reels[i].bounce = 0;
    }
    BGM.stop();
  },

  getSymbols(idx) {
    let r = this.reels[idx]; let bIdx = Math.round(r.pos / this.symHeight) % 20;
    return { top: this.layout[idx][bIdx%20], mid: this.layout[idx][(bIdx+1)%20], bot: this.layout[idx][(bIdx+2)%20] };
  },
  
  getActiveLines(s0, s1, s2) {
    return [
      {name:'mid', s0:s0.mid, s1:s1.mid, s2:s2?s2.mid:null}, {name:'top', s0:s0.top, s1:s1.top, s2:s2?s2.top:null},
      {name:'bot', s0:s0.bot, s1:s1.bot, s2:s2?s2.bot:null}, {name:'cross1', s0:s0.top, s1:s1.mid, s2:s2?s2.bot:null},
      {name:'cross2', s0:s0.bot, s1:s1.mid, s2:s2?s2.top:null}
    ];
  },

  checkTenpai() {
    let lines = this.getActiveLines(this.getSymbols(0), this.getSymbols(1), null);
    for (let l of lines) {
        if (l.s0 === l.s1) return true;
        if (l.s0 === 'wild' || l.s1 === 'wild') {
            if (l.s0 !== 'free' && l.s0 !== 'jp' && l.s1 !== 'free' && l.s1 !== 'jp') return true;
        }
    }
    return false;
  },

  checkWin() {
      let lines = this.getActiveLines(this.getSymbols(0), this.getSymbols(1), this.getSymbols(2));
      this.winAmount = 0; this.winLines = []; let tFree = 0, tJP = false;
      
      for(let l of lines) {
          let syms = [l.s0, l.s1, l.s2];
          let norms = syms.filter(s => s !== 'wild');
          
          if (norms.length === 0) {
              this.winAmount += this.bet * 100; this.winLines.push(l.name);
          } else {
              if (norms.every(s => s === norms[0])) {
                  let sym = norms[0];
                  if (sym === 'free' || sym === 'jp') {
                      if (norms.length === 3) {
                          if (sym === 'free') tFree += 10;
                          if (sym === 'jp') tJP = true;
                          this.winLines.push(l.name);
                      }
                  } else {
                      this.winAmount += this.bet * this.payouts[sym];
                      this.winLines.push(l.name);
                  }
              }
          }
      }
      
      if (tJP) { this.winAmount += this.jackpotPool; this.jackpotPool = 1000; this.msg = 'JACKPOT!!!'; } 
      else if (tFree > 0) { this.freeSpins += tFree; this.msg = `GET ${tFree} FREE SPINS!`; } 
      else if (this.winAmount === 0) { this.msg = 'YOU LOSE...'; }
  },

  startSpin() {
      this.st = 'spin'; this.stopIndex = 0; this.winLines = []; this.msg = 'PRESS A TO STOP!';
      for(let i=0; i<3; i++) { this.reels[i].stopped = false; this.reels[i].speed = 12 + i * 2; }
      playSnd('jmp');
  },

  update() {
    if (keysDown.select) { 
        // ★ やめる時は変形を解除して元に戻す！
        document.getElementById('gameboy').classList.remove('mode-slot');
        switchApp(Menu); return; 
    }
    this.timer++;

    if (this.st === 'bet') {
      if (this.freeSpins > 0) {
          this.msg = `FREE SPIN: ${this.freeSpins}  PRESS A`;
          if (keysDown.a) { this.freeSpins--; this.startSpin(); }
      } else {
          this.msg = 'BET: U/D or B  START: A';
          if (keysDown.up) { this.bet = Math.min(3, Math.min(this.coins, this.bet + 1)); playSnd('sel'); }
          if (keysDown.down) { this.bet = Math.max(1, this.bet - 1); playSnd('sel'); }
          if (keysDown.b) { this.bet = Math.min(3, this.coins); playSnd('combo'); }
          if (keysDown.a && this.coins >= this.bet) {
              this.coins -= this.bet; this.jackpotPool += this.bet; 
              SaveSys.data.slotCoins = this.coins; SaveSys.data.jackpotPool = this.jackpotPool; SaveSys.save();
              this.startSpin();
          }
      }
    } 
    else if (this.st === 'spin') {
      if (keysDown.a) {
        let r = this.reels[this.stopIndex];
        r.stopped = true; r.speed = 0; r.pos = (Math.round(r.pos / this.symHeight) % 20) * this.symHeight; r.bounce = 5; playSnd('hit');
        this.stopIndex++;
        if (this.stopIndex === 2) {
            if (this.checkTenpai()) { this.st = 'reach_wait'; this.msg = 'REACH!! PRESS A!'; }
        } else if (this.stopIndex >= 3) {
            this.st = 'payout'; this.timer = 0; this.checkWin();
        }
      }
    }
    else if (this.st === 'reach_wait') {
        if (keysDown.a) { this.st = 'reach_action'; this.reachTimer = 0; this.reels[2].speed = 4; this.msg = 'DOKI DOKI...'; playSnd('jmp'); }
    }
    else if (this.st === 'reach_action') {
        this.reachTimer++;
        if (this.reachTimer % 15 === 0) playSnd('sel');
        if (this.reachTimer > 60) this.reels[2].speed = 2; 
        if (this.reachTimer > 100) { 
            let r = this.reels[2]; r.stopped = true; r.speed = 0; r.pos = (Math.round(r.pos / this.symHeight) % 20) * this.symHeight; r.bounce = 10; playSnd('hit');
            this.stopIndex++; this.st = 'payout'; this.timer = 0; this.checkWin();
        }
    }
    else if (this.st === 'payout') {
      if (this.timer === 30 && this.winAmount > 0) {
          playSnd('combo'); this.coins += this.winAmount; SaveSys.data.slotCoins = this.coins; SaveSys.data.jackpotPool = this.jackpotPool; SaveSys.save();
          if (!this.msg.includes('JACKPOT') && !this.msg.includes('FREE')) this.msg = `WIN ${this.winAmount} COINS!`;
      }
      if (this.timer > 100) {
          if (this.coins <= 0 && this.freeSpins <= 0) { this.st = 'bankrupt'; this.msg = 'GAME OVER... PRESS A'; } 
          else { this.st = 'bet'; this.bet = Math.min(this.bet, this.coins > 0 ? this.coins : this.bet); }
      }
    }
    else if (this.st === 'bankrupt') {
        if (keysDown.a) { this.coins = 50; SaveSys.data.slotCoins = this.coins; SaveSys.save(); this.st = 'bet'; this.bet = 1; this.msg = 'BONUS 50 COINS!'; playSnd('combo'); }
    }

    for(let i=0; i<3; i++) {
        if (!this.reels[i].stopped) { this.reels[i].pos += this.reels[i].speed; if (this.reels[i].pos >= 20 * this.symHeight) this.reels[i].pos -= 20 * this.symHeight; }
        if (this.reels[i].bounce > 0) this.reels[i].bounce -= 1;
    }
  },

  draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);

    if (this.st === 'reach_action' && this.reachTimer % 10 < 5) ctx.fillStyle = '#f55';
    else if (this.freeSpins > 0) ctx.fillStyle = '#00a'; 
    else ctx.fillStyle = '#a00'; 
    ctx.fillRect(10, 10, 180, 280); ctx.fillStyle = '#f00'; ctx.fillRect(15, 15, 170, 270); ctx.fillStyle = '#000'; ctx.fillRect(20, 50, 160, 130);

    ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText(`★ JACKPOT: ${this.jackpotPool} ★`, 20, 30);
    ctx.fillStyle = '#fff'; ctx.fillRect(30, 60, 40, 100); ctx.fillRect(80, 60, 40, 100); ctx.fillRect(130, 60, 40, 100);

    ctx.save(); ctx.beginPath(); ctx.rect(30, 60, 140, 100); ctx.clip();
    for(let i=0; i<3; i++) {
        let r = this.reels[i]; let rx = 30 + i * 50; let bOff = r.bounce % 2 === 0 ? r.bounce : -r.bounce; 
        let bIdx = Math.floor(r.pos / this.symHeight); let off = r.pos % this.symHeight;
        for(let j = -1; j <= 3; j++) {
            let sIdx = (bIdx + j) % 20; if (sIdx < 0) sIdx += 20; 
            drawSprite(rx + 4, 60 - off + j * this.symHeight + bOff, '#fff', this.symSprs[this.layout[i][sIdx]], 4.0);
        }
    }
    ctx.restore();

    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath(); ctx.moveTo(25, 108); ctx.lineTo(175, 108); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 76); ctx.stroke();   
    ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 140); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 140); ctx.stroke();  
    ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 76); ctx.stroke();  

    if (this.st === 'payout' && this.winAmount > 0 && this.timer % 10 < 5) {
        ctx.lineWidth = 4; ctx.strokeStyle = '#ff0';
        if (this.winLines.includes('mid')) { ctx.beginPath(); ctx.moveTo(25, 108); ctx.lineTo(175, 108); ctx.stroke(); }
        if (this.winLines.includes('top')) { ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 76); ctx.stroke(); }
        if (this.winLines.includes('bot')) { ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 140); ctx.stroke(); }
        if (this.winLines.includes('cross1')) { ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 140); ctx.stroke(); }
        if (this.winLines.includes('cross2')) { ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 76); ctx.stroke(); }
    }

    ctx.fillStyle = '#000'; ctx.fillRect(20, 190, 160, 60); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 190, 160, 60);
    ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText(`COIN: ${this.coins}`, 30, 210); ctx.fillStyle = '#ff0'; ctx.fillText(`BET : ${this.bet}`, 120, 210);
    
    if ((this.st === 'bet' && this.timer % 60 < 30) || this.freeSpins > 0) { ctx.fillStyle = this.freeSpins > 0 ? '#0ff' : '#fff'; ctx.fillText(this.msg, 30, 235); } 
    else if (this.st !== 'bet') { ctx.fillStyle = this.winAmount > 0 ? '#ff0' : '#fff'; ctx.fillText(this.msg, 30, 235); }

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText('777:x50 BAR:x20 BELL:x10', 20, 265); ctx.fillText('SUIKA:5 CHERRY:2 WLD:x100', 20, 275);
    ctx.fillStyle = '#0ff'; ctx.fillText('FREE:10SPINS JP:JACKPOT', 20, 285);
  }
};
