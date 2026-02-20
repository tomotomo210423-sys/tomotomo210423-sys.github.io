// === RETRO SLOT MACHINE (PRO EDITION) ===
const Slot = {
  st: 'bet', // bet, spin, reach_wait, reach_action, payout, bankrupt
  coins: 100,
  bet: 1,
  winAmount: 0,
  winLines: [], 
  msg: 'BET & PRESS A',
  timer: 0,
  reachTimer: 0,
  
  // ★ 追加要素
  jackpotPool: 1000,
  freeSpins: 0,
  
  symHeight: 32, 
  
  reels: [
    { pos: 0, speed: 0, stopped: true, bounce: 0 },
    { pos: 0, speed: 0, stopped: true, bounce: 0 },
    { pos: 0, speed: 0, stopped: true, bounce: 0 }
  ],
  stopIndex: 0,
  
  // ★ 新しい絵柄（WILD, FREE, JP）を追加
  symSprs: {
    'seven': "0000000005555550000005500000550000055000005500000550000000000000",
    'bar':   "00000000033333303ffffff33f3333f33ffffff3033333300000000000000000",
    'bell':  "0000000000088000008888000088880008888880088888800000000000088000",
    'suika': "00000000006a6a0006a6a6a06a6a6a6a6a6a6a6a06a6a6a0006a6a0000000000",
    'cherry':"0000600000066000006006000600006055000055550005550000000000000000",
    'wild':  "ccccccccc22cc22cc22cc22cc22c222cc222222cc22cc22ccccccccc00000000", // Wの文字(ピンク)
    'free':  "bbbbbbbbb22222bbbb22bbbbbb2222bbbb22bbbbbb22bbbbbbbbbbbb00000000", // Fの文字(水色)
    'jp':    "8888888885888858858888588558855885555558855555588888888800000000"  // 王冠(黄色)
  },
  
  payouts: { 'seven': 50, 'bar': 20, 'bell': 10, 'suika': 5, 'cherry': 2 },
  
  // ★ リールの長さを20に拡張（リーチ発生率を調整し、特化絵柄を配置）
  layout: [
    ['cherry', 'suika', 'bell', 'bar', 'cherry', 'wild', 'suika', 'cherry', 'bell', 'seven', 'cherry', 'suika', 'free', 'cherry', 'bell', 'bar', 'suika', 'jp', 'cherry', 'seven'],
    ['bar', 'cherry', 'suika', 'bell', 'cherry', 'jp', 'suika', 'cherry', 'bell', 'seven', 'cherry', 'wild', 'free', 'cherry', 'suika', 'bar', 'bell', 'cherry', 'seven', 'suika'],
    ['suika', 'bell', 'cherry', 'bar', 'suika', 'seven', 'cherry', 'bell', 'wild', 'suika', 'cherry', 'jp', 'bar', 'cherry', 'bell', 'suika', 'free', 'cherry', 'seven', 'bell']
  ],

  init() {
    if (SaveSys.data.slotCoins === undefined) SaveSys.data.slotCoins = 100;
    if (SaveSys.data.jackpotPool === undefined) SaveSys.data.jackpotPool = 1000;
    
    this.coins = SaveSys.data.slotCoins;
    this.jackpotPool = SaveSys.data.jackpotPool;
    if (this.coins <= 0) { this.coins = 10; SaveSys.data.slotCoins = this.coins; SaveSys.save(); }
    
    this.bet = 1; this.st = 'bet'; this.timer = 0; this.freeSpins = 0;
    this.msg = 'BET: U/D or B  START: A'; 
    
    for(let i=0; i<3; i++) {
        this.reels[i].pos = Math.floor(Math.random() * 20) * this.symHeight;
        this.reels[i].speed = 0; this.reels[i].stopped = true; this.reels[i].bounce = 0;
    }
    BGM.stop();
  },

  getSymbols(reelIdx) {
    let r = this.reels[reelIdx];
    let baseIdx = Math.round(r.pos / this.symHeight) % 20; // 20個に拡張
    return {
        top: this.layout[reelIdx][baseIdx % 20],
        mid: this.layout[reelIdx][(baseIdx + 1) % 20],
        bot: this.layout[reelIdx][(baseIdx + 2) % 20]
    };
  },

  getActiveLines(sym0, sym1, sym2) {
    let lines = [];
    lines.push({name: 'mid', s0: sym0.mid, s1: sym1.mid, s2: sym2 ? sym2.mid : null});
    lines.push({name: 'top', s0: sym0.top, s1: sym1.top, s2: sym2 ? sym2.top : null});
    lines.push({name: 'bot', s0: sym0.bot, s1: sym1.bot, s2: sym2 ? sym2.bot : null});
    lines.push({name: 'cross1', s0: sym0.top, s1: sym1.mid, s2: sym2 ? sym2.bot : null});
    lines.push({name: 'cross2', s0: sym0.bot, s1: sym1.mid, s2: sym2 ? sym2.top : null});
    return lines;
  },

  // ★ ワイルド絵柄を考慮したリーチ判定
  checkTenpai() {
    let sym0 = this.getSymbols(0); let sym1 = this.getSymbols(1);
    let lines = this.getActiveLines(sym0, sym1, null);
    
    for (let l of lines) { 
        if (l.s0 === l.s1) return true;
        // どちらかがWILDの場合（ただしFREEとJPの代わりにはならない）
        if (l.s0 === 'wild' || l.s1 === 'wild') {
            if (l.s0 !== 'free' && l.s0 !== 'jp' && l.s1 !== 'free' && l.s1 !== 'jp') return true;
        }
    }
    return false;
  },

  // ★ ワイルド・フリースピン・JPを考慮した当たり判定
  checkWin() {
      let sym0 = this.getSymbols(0); let sym1 = this.getSymbols(1); let sym2 = this.getSymbols(2);
      let lines = this.getActiveLines(sym0, sym1, sym2);
      
      this.winAmount = 0;
      this.winLines = [];
      let triggerFree = 0;
      let triggerJP = false;
      
      for(let l of lines) {
          let syms = [l.s0, l.s1, l.s2];
          // ワイルド絵柄を除外して判定
          let normals = syms.filter(s => s !== 'wild');
          
          if (normals.length === 0) {
              // 3つともWILD
              this.winAmount += this.bet * 100; // 超特大配当
              this.winLines.push(l.name);
          } else {
              // 残りの絵柄がすべて同じなら当たり
              let isMatch = normals.every(s => s === normals[0]);
              if (isMatch) {
                  let sym = normals[0];
                  // FREEとJPはWILD代用不可（自力で3つ揃える必要がある）
                  if (sym === 'free' || sym === 'jp') {
                      if (normals.length === 3) {
                          if (sym === 'free') triggerFree += 10; // 10回フリースピン
                          if (sym === 'jp') triggerJP = true; // ジャックポット
                          this.winLines.push(l.name);
                      }
                  } else {
                      this.winAmount += this.bet * this.payouts[sym];
                      this.winLines.push(l.name);
                  }
              }
          }
      }
      
      // 当たりによる特別な演出メッセージ
      if (triggerJP) {
          this.winAmount += this.jackpotPool;
          this.jackpotPool = 1000; // JPプールリセット
          this.msg = 'JACKPOT!!!';
      } else if (triggerFree > 0) {
          this.freeSpins += triggerFree;
          this.msg = `GET ${triggerFree} FREE SPINS!`;
      } else if (this.winAmount === 0) {
          this.msg = 'YOU LOSE...';
      }
  },

  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    this.timer++;

    if (this.st === 'bet') {
      if (this.freeSpins > 0) {
          this.msg = `FREE SPIN: ${this.freeSpins}  PRESS A`;
          if (keysDown.a) {
              this.freeSpins--;
              this.startSpin();
          }
      } else {
          this.msg = 'BET: U/D or B  START: A';
          if (keysDown.up) { this.bet = Math.min(3, Math.min(this.coins, this.bet + 1)); playSnd('sel'); }
          if (keysDown.down) { this.bet = Math.max(1, this.bet - 1); playSnd('sel'); }
          if (keysDown.b) { this.bet = Math.min(3, this.coins); playSnd('combo'); }
          
          if (keysDown.a && this.coins >= this.bet) {
              this.coins -= this.bet;
              this.jackpotPool += this.bet; // BET額をJPに蓄積
              SaveSys.data.slotCoins = this.coins; 
              SaveSys.data.jackpotPool = this.jackpotPool;
              SaveSys.save();
              this.startSpin();
          }
      }
    } 
    else if (this.st === 'spin') {
      if (keysDown.a) {
        let r = this.reels[this.stopIndex];
        r.stopped = true; r.speed = 0;
        let idx = Math.round(r.pos / this.symHeight) % 20;
        r.pos = idx * this.symHeight;
        r.bounce = 5; 
        playSnd('hit');
        
        this.stopIndex++;
        
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
            this.st = 'reach_action'; this.reachTimer = 0;
            this.reels[2].speed = 4; this.msg = 'DOKI DOKI...'; playSnd('jmp'); 
        }
    }
    else if (this.st === 'reach_action') {
        this.reachTimer++;
        if (this.reachTimer % 15 === 0) playSnd('sel');
        if (this.reachTimer > 60) this.reels[2].speed = 2; 
        
        if (this.reachTimer > 100) { 
            let r = this.reels[2];
            r.stopped = true; r.speed = 0;
            let idx = Math.round(r.pos / this.symHeight) % 20;
            r.pos = idx * this.symHeight; r.bounce = 10; playSnd('hit');
            this.stopIndex++; this.st = 'payout'; this.timer = 0; this.checkWin();
        }
    }
    else if (this.st === 'payout') {
      if (this.timer === 30 && this.winAmount > 0) {
          playSnd('combo');
          this.coins += this.winAmount;
          SaveSys.data.slotCoins = this.coins; 
          SaveSys.data.jackpotPool = this.jackpotPool;
          SaveSys.save();
          if (!this.msg.includes('JACKPOT') && !this.msg.includes('FREE')) {
              this.msg = `WIN ${this.winAmount} COINS!`;
          }
      }
      if (this.timer > 100) {
          if (this.coins <= 0 && this.freeSpins <= 0) { 
              this.st = 'bankrupt'; this.msg = 'GAME OVER... PRESS A'; 
          } else { 
              this.st = 'bet'; this.bet = Math.min(this.bet, this.coins > 0 ? this.coins : this.bet); 
          }
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
            if (this.reels[i].pos >= 20 * this.symHeight) this.reels[i].pos -= 20 * this.symHeight;
        }
        if (this.reels[i].bounce > 0) this.reels[i].bounce -= 1;
    }
  },

  startSpin() {
      this.st = 'spin';
      this.stopIndex = 0;
      this.winLines = [];
      this.msg = 'PRESS A TO STOP!';
      for(let i=0; i<3; i++) {
          this.reels[i].stopped = false;
          this.reels[i].speed = 12 + i * 2; 
      }
      playSnd('jmp');
  },

  draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);

    // フリースピン中は筐体が青、リーチ中は赤く点滅
    if (this.st === 'reach_action' && this.reachTimer % 10 < 5) {
        ctx.fillStyle = '#f55';
    } else if (this.freeSpins > 0) {
        ctx.fillStyle = '#00a'; 
    } else {
        ctx.fillStyle = '#a00'; 
    }
    ctx.fillRect(10, 10, 180, 280);
    ctx.fillStyle = '#f00'; ctx.fillRect(15, 15, 170, 270);
    ctx.fillStyle = '#000'; ctx.fillRect(20, 50, 160, 130);

    // ★ ジャックポット額の表示
    ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
    ctx.fillText(`★ JACKPOT: ${this.jackpotPool} ★`, 20, 30);

    ctx.fillStyle = '#fff';
    ctx.fillRect(30, 60, 40, 100); ctx.fillRect(80, 60, 40, 100); ctx.fillRect(130, 60, 40, 100);

    ctx.save();
    ctx.beginPath(); ctx.rect(30, 60, 140, 100); ctx.clip();

    for(let i=0; i<3; i++) {
        let r = this.reels[i];
        let rx = 30 + i * 50;
        let bounceOffset = r.bounce % 2 === 0 ? r.bounce : -r.bounce; 
        
        let baseIdx = Math.floor(r.pos / this.symHeight);
        let offset = r.pos % this.symHeight;
        
        for(let j = -1; j <= 3; j++) {
            let symIdx = (baseIdx + j) % 20;
            if (symIdx < 0) symIdx += 20; 
            let symName = this.layout[i][symIdx];
            let ry = 60 - offset + j * this.symHeight + bounceOffset;
            drawSprite(rx + 4, ry, '#fff', this.symSprs[symName], 4.0);
        }
    }
    ctx.restore();

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath(); ctx.moveTo(25, 108); ctx.lineTo(175, 108); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 76); ctx.stroke();   
    ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 140); ctx.stroke(); 
    ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 140); ctx.stroke();  
    ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 76); ctx.stroke();  

    if (this.st === 'payout' && this.winAmount > 0 && this.timer % 10 < 5) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff0';
        if (this.winLines.includes('mid')) { ctx.beginPath(); ctx.moveTo(25, 108); ctx.lineTo(175, 108); ctx.stroke(); }
        if (this.winLines.includes('top')) { ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 76); ctx.stroke(); }
        if (this.winLines.includes('bot')) { ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 140); ctx.stroke(); }
        if (this.winLines.includes('cross1')) { ctx.beginPath(); ctx.moveTo(25, 76); ctx.lineTo(175, 140); ctx.stroke(); }
        if (this.winLines.includes('cross2')) { ctx.beginPath(); ctx.moveTo(25, 140); ctx.lineTo(175, 76); ctx.stroke(); }
    }

    ctx.fillStyle = '#000'; ctx.fillRect(20, 190, 160, 60);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 190, 160, 60);
    
    ctx.fillStyle = '#0f0'; ctx.font = '12px monospace';
    ctx.fillText(`COIN: ${this.coins}`, 30, 210);
    ctx.fillStyle = '#ff0'; ctx.fillText(`BET : ${this.bet}`, 120, 210);
    
    if ((this.st === 'bet' && this.timer % 60 < 30) || this.freeSpins > 0) {
        ctx.fillStyle = this.freeSpins > 0 ? '#0ff' : '#fff'; 
        ctx.fillText(this.msg, 30, 235);
    } else if (this.st !== 'bet') {
        ctx.fillStyle = this.winAmount > 0 ? '#ff0' : '#fff';
        ctx.fillText(this.msg, 30, 235);
    }

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText('777:x50 BAR:x20 BELL:x10', 20, 265);
    ctx.fillText('SUIKA:5 CHERRY:2 WLD:x100', 20, 275);
    ctx.fillStyle = '#0ff'; ctx.fillText('FREE:10SPINS JP:JACKPOT', 20, 285);
  }
};
