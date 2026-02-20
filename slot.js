// === RETRO SLOT MACHINE ===
const Slot = {
  st: 'bet', // bet, spin, reach_wait, reach_action, payout, bankrupt
  coins: 100,
  bet: 1,
  winAmount: 0,
  winLines: [], 
  msg: 'BET & PRESS A',
  timer: 0,
  reachTimer: 0,
  
  symHeight: 32, 
  
  reels: [
    { pos: 0, speed: 0, stopped: true, bounce: 0 },
    { pos: 0, speed: 0, stopped: true, bounce: 0 },
    { pos: 0, speed: 0, stopped: true, bounce: 0 }
  ],
  stopIndex: 0,
  
  symSprs: {
    'seven': "0000000005555550000005500000550000055000005500000550000000000000",
    'bar':   "00000000033333303ffffff33f3333f33ffffff3033333300000000000000000",
    'bell':  "0000000000088000008888000088880008888880088888800000000000088000",
    'suika': "00000000006a6a0006a6a6a06a6a6a6a6a6a6a6a06a6a6a0006a6a0000000000",
    'cherry':"0000600000066000006006000600006055000055550005550000000000000000"
  },
  
  payouts: { 'seven': 50, 'bar': 20, 'bell': 10, 'suika': 5, 'cherry': 2 },
  
  layout: [
    ['seven', 'cherry', 'bell', 'bar', 'suika', 'bell', 'cherry', 'bar', 'suika', 'cherry'],
    ['bar', 'seven', 'cherry', 'suika', 'bell', 'cherry', 'bar', 'bell', 'suika', 'cherry'],
    ['suika', 'bell', 'seven', 'cherry', 'bar', 'bell', 'cherry', 'suika', 'bar', 'cherry']
  ],

  init() {
    if (SaveSys.data.slotCoins === undefined) SaveSys.data.slotCoins = 100;
    this.coins = SaveSys.data.slotCoins;
    if (this.coins <= 0) { this.coins = 10; SaveSys.data.slotCoins = this.coins; SaveSys.save(); }
    this.bet = 1; this.st = 'bet'; this.msg = 'BET: U/D or B  START: A'; this.timer = 0;
    for(let i=0; i<3; i++) {
        this.reels[i].pos = Math.floor(Math.random() * 10) * this.symHeight;
        this.reels[i].speed = 0; this.reels[i].stopped = true; this.reels[i].bounce = 0;
    }
    BGM.stop();
  },

  getSymbols(reelIdx) {
    let r = this.reels[reelIdx];
    let baseIdx = Math.round(r.pos / this.symHeight) % 10;
    return {
        top: this.layout[reelIdx][baseIdx % 10],
        mid: this.layout[reelIdx][(baseIdx + 1) % 10],
        bot: this.layout[reelIdx][(baseIdx + 2) % 10]
    };
  },

  // ★ 修正：BET数に関係なく、常に全5ライン（横3＋斜め2）を当たり判定にする！
  getActiveLines(sym0, sym1, sym2) {
    let lines = [];
    lines.push({name: 'mid', s0: sym0.mid, s1: sym1.mid, s2: sym2 ? sym2.mid : null});
    lines.push({name: 'top', s0: sym0.top, s1: sym1.top, s2: sym2 ? sym2.top : null});
    lines.push({name: 'bot', s0: sym0.bot, s1: sym1.bot, s2: sym2 ? sym2.bot : null});
    lines.push({name: 'cross1', s0: sym0.top, s1: sym1.mid, s2: sym2 ? sym2.bot : null});
    lines.push({name: 'cross2', s0: sym0.bot, s1: sym1.mid, s2: sym2 ? sym2.top : null});
    return lines;
  },

  checkTenpai() {
    let sym0 = this.getSymbols(0); let sym1 = this.getSymbols(1);
    let lines = this.getActiveLines(sym0, sym1, null);
    for (let l of lines) { if (l.s0 === l.s1) return true; }
    return false;
  },

  checkWin() {
      let sym0 = this.getSymbols(0); let sym1 = this.getSymbols(1); let sym2 = this.getSymbols(2);
      let lines = this.getActiveLines(sym0, sym1, sym2);
      
      this.winAmount = 0;
      this.winLines = [];
      
      for(let l of lines) {
          if (l.s0 === l.s1 && l.s1 === l.s2) {
              // BET数が多いほど配当が倍増する
              this.winAmount += this.bet * this.payouts[l.s0];
              this.winLines.push(l.name);
          }
      }
      if (this.winAmount === 0) this.msg = 'YOU LOSE...';
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    this.timer++;

    if (this.st === 'bet') {
      if (keysDown.up) { this.bet = Math.min(3, Math.min(this.coins, this.bet + 1)); playSnd('sel'); }
      if (keysDown.down) { this.bet = Math.max(1, this.bet - 1); playSnd('sel'); }
      if (keysDown.b) { this.bet = Math.min(3, this.coins); playSnd('combo'); }
      
      if (keysDown.a && this.coins >= this.bet) {
        this.coins -= this.bet;
        SaveSys.data.slotCoins = this.coins; SaveSys.save();
        this.st = 'spin';
        this.stopIndex = 0;
        this.winLines = [];
        this.msg = 'PRESS A TO STOP!';
        for(let i=0; i<3; i++) {
            this.reels[i].stopped = false;
            this.reels[i].speed = 12 + i * 2; 
        }
        playSnd('jmp');
      }
    } 
    else if (this.st === 'spin') {
      if (keysDown.a) {
        let r = this.reels[this.stopIndex];
        r.stopped = true; r.speed = 0;
        let idx = Math.round(r.pos / this.symHeight) % 10;
        r.pos = idx * this.symHeight;
        r.bounce = 5; 
        playSnd('hit');
        
        this.stopIndex++;
        
        // 第2リール停止時、リーチチェック！
        if (this.stopIndex === 2) {
            if (this.checkTenpai()) {
                this.st = 'reach_wait';
                this.msg = 'REACH!! PRESS A!';
            }
        } else if (this.stopIndex >= 3) {
            this.st = 'payout'; this.timer = 0; this.checkWin();
        }
      }
    }
    else if (this.st === 'reach_wait') {
        if (keysDown.a) {
            // リーチ演出開始！
            this.st = 'reach_action';
            this.reachTimer = 0;
            this.reels[2].speed = 4; // スロー回転になる
            this.msg = 'DOKI DOKI...';
            playSnd('jmp'); 
        }
    }
    else if (this.st === 'reach_action') {
        this.reachTimer++;
        if (this.reachTimer % 15 === 0) playSnd('sel'); // 心音
        
        if (this.reachTimer > 60) this.reels[2].speed = 2; // さらに遅くなる
        
        // 約1.5秒焦らして自動停止
        if (this.reachTimer > 100) { 
            let r = this.reels[2];
            r.stopped = true; r.speed = 0;
            let idx = Math.round(r.pos / this.symHeight) % 10;
            r.pos = idx * this.symHeight;
            r.bounce = 10; // ドンッ！と強めに止まる
            playSnd('hit');
            
            this.stopIndex++;
            this.st = 'payout';
            this.timer = 0;
            this.checkWin();
        }
    }
    else if (this.st === 'payout') {
      if (this.timer === 30 && this.winAmount > 0) {
          playSnd('combo');
          this.coins += this.winAmount;
          SaveSys.data.slotCoins = this.coins; SaveSys.save();
          this.msg = `WIN ${this.winAmount} COINS!`;
      }
      if (this.timer > 100) {
          if (this.coins <= 0) { this.st = 'bankrupt'; this.msg = 'GAME OVER... PRESS A'; } 
          else { this.st = 'bet'; this.bet = Math.min(this.bet, this.coins); this.msg = 'BET & PRESS A'; }
      }
    }
    else if (this.st === 'bankrupt') {
        if (keysDown.a) {
            this.coins = 50; SaveSys.data.slotCoins = this.coins; SaveSys.save();
            this.st = 'bet'; this.bet = 1; this.msg = 'BONUS 50 COINS!'; playSnd('combo');
        }
    }

    for(let i=0; i<3; i++) {
        if (!this.reels[i].stopped) {
            this.reels[i].pos += this.reels[i].speed;
            if (this.reels[i].pos >= 10 * this.symHeight) this.reels[i].pos -= 10 * this.symHeight;
        }
        if (this.reels[i].bounce > 0) this.reels[i].bounce -= 1;
    }
  },

  draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);

    // リーチ中は筐体が赤く点滅する演出
    if (this.st === 'reach_action' && this.reachTimer % 10 < 5) {
        ctx.fillStyle = '#f55';
    } else {
        ctx.fillStyle = '#a00'; 
    }
    ctx.fillRect(10, 10, 180, 280);
    ctx.fillStyle = '#f00'; ctx.fillRect(15, 15, 170, 270);
    ctx.fillStyle = '#000'; ctx.fillRect(20, 60, 160, 120);

    ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace';
    ctx.fillText('★ RETRO SLOT ★', 25, 40);

    ctx.fillStyle = '#fff';
    ctx.fillRect(30, 70, 40, 100); ctx.fillRect(80, 70, 40, 100); ctx.fillRect(130, 70, 40, 100);

    ctx.save();
    ctx.beginPath(); ctx.rect(30, 70, 140, 100); ctx.clip();

    for(let i=0; i<3; i++) {
        let r = this.reels[i];
        let rx = 30 + i * 50;
        let bounceOffset = r.bounce % 2 === 0 ? r.bounce : -r.bounce; 
        
        let baseIdx = Math.floor(r.pos / this.symHeight);
        let offset = r.pos % this.symHeight;
        
        for(let j = -1; j <= 3; j++) {
            let symIdx = (baseIdx + j) % 10;
            if (symIdx < 0) symIdx += 10; 
            let symName = this.layout[i][symIdx];
            let ry = 70 - offset + j * this.symHeight + bounceOffset;
            drawSprite(rx + 4, ry, '#fff', this.symSprs[symName], 4.0);
        }
    }
    ctx.restore();

    // ★ 修正：全ラインが常に有効であることを示すため、薄い線を5本描画
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath(); ctx.moveTo(25, 118); ctx.lineTo(175, 118); ctx.stroke(); // 中
    ctx.beginPath(); ctx.moveTo(25, 86); ctx.lineTo(175, 86); ctx.stroke();   // 上
    ctx.beginPath(); ctx.moveTo(25, 150); ctx.lineTo(175, 150); ctx.stroke(); // 下
    ctx.beginPath(); ctx.moveTo(25, 86); ctx.lineTo(175, 150); ctx.stroke();  // 斜め1
    ctx.beginPath(); ctx.moveTo(25, 150); ctx.lineTo(175, 86); ctx.stroke();  // 斜め2

    // ★ 当たったラインを太く光らせる演出
    if (this.st === 'payout' && this.winAmount > 0 && this.timer % 10 < 5) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff0';
        if (this.winLines.includes('mid')) { ctx.beginPath(); ctx.moveTo(25, 118); ctx.lineTo(175, 118); ctx.stroke(); }
        if (this.winLines.includes('top')) { ctx.beginPath(); ctx.moveTo(25, 86); ctx.lineTo(175, 86); ctx.stroke(); }
        if (this.winLines.includes('bot')) { ctx.beginPath(); ctx.moveTo(25, 150); ctx.lineTo(175, 150); ctx.stroke(); }
        if (this.winLines.includes('cross1')) { ctx.beginPath(); ctx.moveTo(25, 86); ctx.lineTo(175, 150); ctx.stroke(); }
        if (this.winLines.includes('cross2')) { ctx.beginPath(); ctx.moveTo(25, 150); ctx.lineTo(175, 86); ctx.stroke(); }
    }

    ctx.fillStyle = '#000'; ctx.fillRect(20, 190, 160, 60);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 190, 160, 60);
    
    ctx.fillStyle = '#0f0'; ctx.font = '12px monospace';
    ctx.fillText(`COIN: ${this.coins}`, 30, 210);
    ctx.fillStyle = '#ff0'; ctx.fillText(`BET : ${this.bet}`, 120, 210);
    
    if (this.st === 'bet' && this.timer % 60 < 30) {
        ctx.fillStyle = '#fff'; ctx.fillText(this.msg, 30, 235);
    } else if (this.st !== 'bet') {
        ctx.fillStyle = this.winAmount > 0 ? '#ff0' : '#fff';
        ctx.fillText(this.msg, 30, 235);
    }

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText('777:x50  BAR:x20  BELL:x10', 20, 270);
    ctx.fillText('SUIKA:x5 CHERRY:x2', 20, 280);
    ctx.fillStyle = '#666'; ctx.font = '8px monospace';
    ctx.fillText('SELECT: EXIT', 130, 280);
  }
};
