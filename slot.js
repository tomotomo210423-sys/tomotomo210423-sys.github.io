// === RETRO SLOT MACHINE ===
const Slot = {
  st: 'bet', // 状態: bet, spin, stop, payout, bankrupt
  coins: 100,
  bet: 1,
  winAmount: 0,
  msg: 'BET & PRESS A',
  timer: 0,
  
  // 1リールあたりのシンボル表示間隔（ピクセル）
  symHeight: 32,
  
  reels: [
    { pos: 0, speed: 0, stopped: true, finalIdx: 0, bounce: 0 },
    { pos: 0, speed: 0, stopped: true, finalIdx: 0, bounce: 0 },
    { pos: 0, speed: 0, stopped: true, finalIdx: 0, bounce: 0 }
  ],
  stopIndex: 0, // 今何個目のリールを止めるか
  
  // スロットの絵柄（8x8ドット）
  symSprs: {
    'seven': "0000000005555550000005500000550000055000005500000550000000000000",
    'bar':   "00000000033333303ffffff33f3333f33ffffff3033333300000000000000000",
    'bell':  "0000000000088000008888000088880008888880088888800000000000088000",
    'suika': "00000000006a6a0006a6a6a06a6a6a6a6a6a6a6a06a6a6a0006a6a0000000000",
    'cherry':"0000600000066000006006000600006055000055550005550000000000000000"
  },
  
  // 配当（倍率）
  payouts: { 'seven': 50, 'bar': 20, 'bell': 10, 'suika': 5, 'cherry': 2 },
  
  // リールの配列（各リール10個）
  layout: [
    ['seven', 'cherry', 'bell', 'bar', 'suika', 'bell', 'cherry', 'bar', 'suika', 'cherry'],
    ['bar', 'seven', 'cherry', 'suika', 'bell', 'cherry', 'bar', 'bell', 'suika', 'cherry'],
    ['suika', 'bell', 'seven', 'cherry', 'bar', 'bell', 'cherry', 'suika', 'bar', 'cherry']
  ],

  init() {
    if (SaveSys.data.slotCoins === undefined) SaveSys.data.slotCoins = 100;
    this.coins = SaveSys.data.slotCoins;
    if (this.coins <= 0) {
        this.coins = 10; // 救済措置
        SaveSys.data.slotCoins = this.coins; SaveSys.save();
    }
    this.bet = 1;
    this.st = 'bet';
    this.msg = 'BET: U/D or B  START: A';
    this.timer = 0;
    for(let i=0; i<3; i++) {
        this.reels[i].pos = Math.floor(Math.random() * 10) * this.symHeight;
        this.reels[i].speed = 0;
        this.reels[i].stopped = true;
        this.reels[i].bounce = 0;
    }
    BGM.stop();
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
        this.msg = 'PRESS A TO STOP!';
        for(let i=0; i<3; i++) {
            this.reels[i].stopped = false;
            this.reels[i].speed = 12 + i * 2; // 右のリールほど少し速く回る
        }
        playSnd('jmp');
      }
    } 
    else if (this.st === 'spin') {
      if (keysDown.a) {
        // 現在のリールを止める
        let r = this.reels[this.stopIndex];
        r.stopped = true;
        r.speed = 0;
        // 一番近いシンボルにピッタリ合わせる
        let idx = Math.round(r.pos / this.symHeight) % 10;
        r.pos = idx * this.symHeight;
        r.finalIdx = idx;
        r.bounce = 5; // 止まった時の「カクッ」という演出用
        playSnd('hit');
        
        this.stopIndex++;
        if (this.stopIndex >= 3) {
            this.st = 'payout';
            this.timer = 0;
            this.checkWin();
        }
      }
    }
    else if (this.st === 'payout') {
      if (this.timer === 30 && this.winAmount > 0) {
          playSnd('combo');
          this.coins += this.winAmount;
          SaveSys.data.slotCoins = this.coins; SaveSys.save();
          this.msg = `WIN ${this.winAmount} COINS!`;
      }
      if (this.timer > 90) {
          if (this.coins <= 0) {
              this.st = 'bankrupt';
              this.msg = 'GAME OVER... PRESS A';
          } else {
              this.st = 'bet';
              this.bet = Math.min(this.bet, this.coins);
              this.msg = 'BET & PRESS A';
          }
      }
    }
    else if (this.st === 'bankrupt') {
        if (keysDown.a) {
            this.coins = 50; // 破産からの復活ボーナス
            SaveSys.data.slotCoins = this.coins; SaveSys.save();
            this.st = 'bet';
            this.bet = 1;
            this.msg = 'BONUS 50 COINS!';
            playSnd('combo');
        }
    }

    // リールの位置更新
    for(let i=0; i<3; i++) {
        if (!this.reels[i].stopped) {
            this.reels[i].pos += this.reels[i].speed;
            if (this.reels[i].pos >= 10 * this.symHeight) this.reels[i].pos -= 10 * this.symHeight;
        }
        if (this.reels[i].bounce > 0) this.reels[i].bounce -= 1;
    }
  },

  checkWin() {
      // センターラインの絵柄を取得（配列は下から上へ流れるため、インデックスを逆算）
      const centerLine = [];
      for(let i=0; i<3; i++) {
          let idx = 10 - (this.reels[i].finalIdx % 10);
          if (idx === 10) idx = 0;
          centerLine.push(this.layout[i][idx]);
      }
      
      this.winAmount = 0;
      const s0 = centerLine[0]; const s1 = centerLine[1]; const s2 = centerLine[2];
      
      if (s0 === s1 && s1 === s2) {
          this.winAmount = this.bet * this.payouts[s0];
      }
      
      if (this.winAmount === 0) {
          this.msg = 'YOU LOSE...';
      }
  },

  draw() {
    ctx.fillStyle = '#222'; ctx.fillRect(0, 0, 200, 300);

    // 筐体デザイン
    ctx.fillStyle = '#a00'; ctx.fillRect(10, 10, 180, 280);
    ctx.fillStyle = '#f00'; ctx.fillRect(15, 15, 170, 270);
    ctx.fillStyle = '#000'; ctx.fillRect(20, 60, 160, 120);

    // タイトル
    ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace';
    ctx.fillText('★ RETRO SLOT ★', 25, 40);

    // リール背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(30, 70, 40, 100);
    ctx.fillRect(80, 70, 40, 100);
    ctx.fillRect(130, 70, 40, 100);

    // クリップしてリールを描画
    ctx.save();
    ctx.beginPath(); ctx.rect(30, 70, 140, 100); ctx.clip();

    for(let i=0; i<3; i++) {
        let r = this.reels[i];
        let rx = 30 + i * 50;
        let bounceOffset = r.bounce % 2 === 0 ? r.bounce : -r.bounce; // ガタガタ演出
        
        // 描画用に現在位置から上下のシンボルを計算して表示
        let baseIdx = Math.floor(r.pos / this.symHeight);
        let offset = r.pos % this.symHeight;
        
        for(let j = -1; j <= 4; j++) {
            let symIdx = (10 - ((baseIdx + j) % 10)) % 10;
            if (symIdx < 0) symIdx += 10;
            let symName = this.layout[i][symIdx];
            let ry = 70 - offset + j * this.symHeight + bounceOffset;
            
            // 少し中央に寄せるためのマージン
            drawSprite(rx + 4, ry, '#fff', this.symSprs[symName], 4.0);
        }
    }
    ctx.restore();

    // センターライン
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(25, 118, 150, 4);

    // 情報ディスプレイ
    ctx.fillStyle = '#000'; ctx.fillRect(20, 190, 160, 60);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(20, 190, 160, 60);
    
    ctx.fillStyle = '#0f0'; ctx.font = '12px monospace';
    ctx.fillText(`COIN: ${this.coins}`, 30, 210);
    ctx.fillStyle = '#ff0';
    ctx.fillText(`BET : ${this.bet}`, 120, 210);
    
    // メッセージ点滅
    if (this.st === 'bet' && this.timer % 60 < 30) {
        ctx.fillStyle = '#fff'; ctx.fillText(this.msg, 30, 235);
    } else if (this.st !== 'bet') {
        ctx.fillStyle = this.winAmount > 0 ? '#ff0' : '#fff';
        ctx.fillText(this.msg, 30, 235);
    }

    // 配当表（小さく）
    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText('777:x50  BAR:x20  BELL:x10', 20, 270);
    ctx.fillText('SUIKA:x5 CHERRY:x2', 20, 280);
    
    ctx.fillStyle = '#666'; ctx.font = '8px monospace';
    ctx.fillText('SELECT: EXIT', 130, 280);
  }
};
