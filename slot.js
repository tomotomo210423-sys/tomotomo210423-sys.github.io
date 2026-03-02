// === RETRO SLOT MACHINE - CASINO EVOLUTION v2 ===
const Slot={
  st:'bet', coins:100, bet:1, win:0, lines:[], msg:'BET & PRESS A', tmr:0, rTmr:0,
  jp:1000, free:0, symH:32, stopIdx:0,
  reels:[{p:0,s:0,st:true,b:0},{p:0,s:0,st:true,b:0},{p:0,s:0,st:true,b:0}],
  
  // イカサマアイテムのラインナップ（初心者に優しいアイテムを追加！）
  shopData: [
    { id: 'f_ticket', name: 'Fスピン券', cost: 120, desc: '即座にフリースピン10回獲得!' },
    { id: 'safety', name: 'お守り', cost: 30, desc: '次スピンで外れても30G返金' },
    { id: 'hack', name: 'ハッキング', cost: 300, desc: 'ランダムな図柄を強制揃え' },
    { id: 'bibine', name: 'バイバイン', cost: 500, desc: '所持金(最大2千)が1.2～2倍!' },
    { id: 'remote', name: 'リモコン', cost: 1500, desc: '次スピンで強制JP発生(1回)' }
  ],
  shopCur: 0,
  activeItem: null,
  targetSym: null,
  slipCount: 0,

  sprs:{
    '7':  "0000000005555550000005500000550000055000005500000550000000000000",
    'BAR':"00000000033333303ffffff33f3333f33ffffff3033333300000000000000000",
    'BEL':"0000000000088000008888000088880008888880088888800000000000088000",
    'SUI':"00000000006a6a0006a6a6a06a6a6a6a6a6a6a6a06a6a6a0006a6a0000000000",
    'CHE':"0000600000066000006006000600006055000055550005550000000000000000",
    'WLD':"0cc00cc00cc00cc00cc00cc00cccccc00cccccc000cccc00000cc00000000000", 
    'FRE':"0bbbbbb00bb000000bb000000bbbbb000bb000000bb000000bb0000000000000", 
    'JP': "0800008008800880088888800888888008588580088888800888888000000000"  
  },
  pays:{'7':50,'BAR':20,'BEL':10,'SUI':5,'CHE':2},
  lay:[
    ['CHE','SUI','BEL','BAR','CHE','WLD','SUI','CHE','BEL','7','CHE','SUI','FRE','CHE','BEL','BAR','SUI','JP','CHE','7'],
    ['BAR','CHE','SUI','BEL','CHE','JP','SUI','CHE','BEL','7','CHE','WLD','FRE','CHE','SUI','BAR','BEL','CHE','7','SUI'],
    ['SUI','BEL','CHE','BAR','SUI','7','CHE','BEL','WLD','SUI','CHE','JP','BAR','CHE','BEL','SUI','FRE','CHE','7','BEL']
  ],

  init(){
    document.getElementById('gameboy').classList.add('mode-slot');
    let d=SaveSys.data; this.coins=d.slotCoins||100; this.jp=d.jackpotPool||1000;
    if(this.coins<=0)this.coins=10;
    this.bet=1; this.st='bet'; this.tmr=0; this.free=0; 
    this.msg='SET BET (RIGHT:SHOP)';
    for(let i=0;i<3;i++){this.reels[i].p=Math.floor(Math.random()*20)*this.symH;this.reels[i].s=0;this.reels[i].st=true;this.reels[i].b=0;}
    BGM.stop();
    this.activeItem = null;
    this.shopCur = 0;
    this.targetSym = null;
    this.slipCount = 0;
  },

  getSyms(i){
    let bIdx=Math.round(this.reels[i].p/this.symH)%20;
    return{t:this.lay[i][bIdx%20],m:this.lay[i][(bIdx+1)%20],b:this.lay[i][(bIdx+2)%20]};
  },
  
  getLines(s0,s1,s2){
    return [
      {n:'mid',s0:s0.m,s1:s1.m,s2:s2?s2.m:null},{n:'top',s0:s0.t,s1:s1.t,s2:s2?s2.t:null},
      {n:'bot',s0:s0.b,s1:s1.b,s2:s2?s2.b:null},{n:'cr1',s0:s0.t,s1:s1.m,s2:s2?s2.b:null},
      {n:'cr2',s0:s0.b,s1:s1.m,s2:s2?s2.t:null}
    ];
  },

  chkTen(){
    let lines=this.getLines(this.getSyms(0),this.getSyms(1),null);
    for(let l of lines){
      if(l.s0===l.s1) return true;
      if(l.s0==='WLD'||l.s1==='WLD'){ if(l.s0!=='FRE'&&l.s0!=='JP'&&l.s1!=='FRE'&&l.s1!=='JP') return true; }
    } return false;
  },

  chkWin(){
    let lines=this.getLines(this.getSyms(0),this.getSyms(1),this.getSyms(2));
    this.win=0; this.lines=[]; let tF=0,tJ=false;
    for(let l of lines){
      let n=[l.s0,l.s1,l.s2].filter(s=>s!=='WLD');
      if(n.length===0){ this.win+=this.bet*100; this.lines.push(l.n); }
      else if(n.every(s=>s===n[0])){
        let sym=n[0];
        if(sym==='FRE'||sym==='JP'){
          if(n.length===3){ if(sym==='FRE')tF+=10; if(sym==='JP')tJ=true; this.lines.push(l.n); }
        } else {
          this.win+=this.bet*this.pays[sym]; this.lines.push(l.n);
        }
      }
    }

    // ★ お守りアイテムの処理
    let usedSafety = false;
    if (this.win === 0 && this.activeItem === 'safety') {
        this.win += 30; // 外れても30Gバック
        usedSafety = true;
    }

    if(tJ){ 
      this.win+=this.jp; this.jp=1000; this.msg='JACKPOT!!!'; 
      SaveSys.addLog('スロット', 'ジャックポットを当てて大儲けした！'); 
    }
    else if(tF>0){ this.free+=tF; this.msg=`GET ${tF} FREE SPINS!`; }
    else if(usedSafety) { this.msg='OMAMORI SAFE! +30G'; }
    else if(this.win===0) this.msg='YOU LOSE...';

    // お守りは1回で必ず消費
    if (this.activeItem === 'safety') this.activeItem = null;
  },

  spin(){
    // リモコン（フリーズ演出）の処理
    if(this.activeItem === 'remote') {
        this.st = 'freeze'; this.tmr = 0; 
        this.activeItem = null;
        playSnd('hit'); // フリーズのプチュン音
        return;
    }
    
    // ハッキング（ナッジ演出）の図柄決定
    if(this.activeItem === 'hack') {
        this.targetSym = ['7','BAR','BEL','SUI','CHE'][Math.floor(Math.random()*5)];
        this.activeItem = null;
    } else {
        this.targetSym = null;
    }

    this.st='spin'; this.stopIdx=0; this.lines=[]; this.msg='PRESS SPIN TO STOP!';
    for(let i=0;i<3;i++){this.reels[i].st=false;this.reels[i].s=12+i*2;} 
    playSnd('jmp');
  },

  update(){
    if(keysDown.select){document.getElementById('gameboy').classList.remove('mode-slot');switchApp(Menu);return;}
    this.tmr++;
    
    // --- 裏カジノ SHOP モード ---
    if(this.st === 'shop') {
        if(keysDown.left || keysDown.b) { this.st = 'bet'; playSnd('sel'); }
        if(keysDown.up) { this.shopCur = (this.shopCur - 1 + this.shopData.length) % this.shopData.length; playSnd('sel'); }
        if(keysDown.down) { this.shopCur = (this.shopCur + 1) % this.shopData.length; playSnd('sel'); }
        if(keysDown.a) {
           let item = this.shopData[this.shopCur];
           if (this.coins >= item.cost) {
               
               if (item.id === 'f_ticket') {
                   // Fスピン券は買った瞬間に発動
                   this.coins -= item.cost;
                   this.free += 10;
                   playSnd('combo');
                   this.msg = 'GET 10 FREE SPINS!!';
               } 
               else if (item.id === 'bibine') {
                   // バイバインは最大2000枚の範囲で計算（無限増殖バグ防止）
                   this.coins -= item.cost;
                   let target = Math.min(this.coins, 2000);
                   let multi = 1.2 + Math.random() * 0.8;
                   let gain = Math.floor(target * multi) - target;
                   this.coins += gain;
                   playSnd('combo');
                   this.msg = `COIN +${gain}G !!`;
               } 
               else {
                   // リモコン、ハッキング、お守りは「セット」される
                   if (this.activeItem !== item.id) {
                       this.coins -= item.cost;
                       this.activeItem = item.id;
                       playSnd('combo');
                       this.msg = `${item.name} SET!`;
                   } else { playSnd('hit'); }
               }
               SaveSys.data.slotCoins = this.coins; SaveSys.save();
           } else { playSnd('hit'); }
        }
        return;
    }

    if(this.st==='bet'){
      if(this.free>0){
        this.msg=`FREE SPIN: ${this.free}  PRESS SPIN`; if(keysDown.a){this.free--;this.spin();}
      }else{
        this.msg='SET BET (RIGHT:SHOP)';
        if(keysDown.right){this.st='shop'; this.shopCur=0; playSnd('sel'); return;}
        
        if(keysDown.up){this.bet++; if(this.bet>3||this.bet>this.coins)this.bet=1; playSnd('sel');}
        if(keysDown.down){this.bet=Math.max(1,this.bet-1);playSnd('sel');}
        if(keysDown.b){this.bet=Math.min(3,this.coins);playSnd('combo');}
        if(keysDown.a&&this.coins>=this.bet){
          this.coins-=this.bet; this.jp+=this.bet; SaveSys.data.slotCoins=this.coins; SaveSys.data.jackpotPool=this.jp; SaveSys.save(); this.spin();
        }
      }
    }
    
    // --- フリーズ（確定暗転）演出 ---
    else if(this.st === 'freeze') {
        if(this.tmr === 60) {
            playSnd('combo'); screenShake(15); this.msg = 'SYSTEM HACKED!!';
        }
        if(this.tmr > 130) {
            for(let i=0; i<3; i++) {
                let targetIdx = this.lay[i].indexOf('JP');
                let centerPos = (targetIdx - 1 + 20) % 20;
                this.reels[i].p = centerPos * this.symH;
                this.reels[i].st = true;
                this.reels[i].b = 10;
            }
            this.stopIdx = 3; this.st = 'pay'; this.tmr = 0; playSnd('hit'); this.chkWin();
        }
    }

    else if(this.st==='spin'){
      if(keysDown.a){
        let r=this.reels[this.stopIdx]; r.st=true; r.s=0; 
        
        if (this.targetSym) {
            let targetIdx = this.lay[this.stopIdx].indexOf(this.targetSym);
            let centerPos = (targetIdx - 1 + 20) % 20;
            
            if (this.stopIdx < 2) {
                r.p = centerPos * this.symH;
            } else {
                // ハッキング時は最後のリールをワザとズラして止める（ナッジの準備）
                this.slipCount = Math.floor(Math.random() * 3) + 1;
                r.p = ((centerPos - this.slipCount + 20) % 20) * this.symH;
            }
        } else {
            r.p=(Math.round(r.p/this.symH)%20)*this.symH; 
        }
        
        r.b=5; playSnd('hit'); this.stopIdx++;
        
        if(this.stopIdx===2){ if(this.chkTen()){this.st='reach_W';this.msg='REACH!! PRESS SPIN!';} }
        else if(this.stopIdx>=3){ 
            if(this.targetSym && this.slipCount > 0) { this.st = 'nudge'; this.tmr = 0; }
            else { this.st='pay'; this.tmr=0; this.chkWin(); }
        }
      }
    }
    else if(this.st==='reach_W'){ if(keysDown.a){this.st='reach_A';this.rTmr=0;this.reels[2].s=4;this.msg='DOKI DOKI...';playSnd('jmp');} }
    else if(this.st==='reach_A'){
      this.rTmr++; if(this.rTmr%15===0)playSnd('sel'); if(this.rTmr>60)this.reels[2].s=2;
      if(this.rTmr>100){ 
        let r=this.reels[2];r.st=true;r.s=0;
        if(this.targetSym) {
            let targetIdx = this.lay[2].indexOf(this.targetSym);
            let centerPos = (targetIdx - 1 + 20) % 20;
            this.slipCount = Math.floor(Math.random() * 3) + 1;
            r.p = ((centerPos - this.slipCount + 20) % 20) * this.symH;
        } else {
            r.p=(Math.round(r.p/this.symH)%20)*this.symH;
        }
        r.b=10; playSnd('hit'); this.stopIdx++;
        
        if(this.targetSym && this.slipCount > 0) { this.st = 'nudge'; this.tmr = 0; }
        else { this.st='pay'; this.tmr=0; this.chkWin(); }
      }
    }
    
    // --- ナッジ（滑り・逆転）演出 ---
    else if(this.st === 'nudge') {
        if (this.tmr > 20 && this.tmr % 15 === 0) {
            let r = this.reels[2];
            r.p += this.symH; if (r.p >= 20 * this.symH) r.p -= 20 * this.symH;
            r.b = 5; this.slipCount--;
            playSnd('hit'); this.msg = 'NUDGE...! (HACKING)'; screenShake(3);
            if (this.slipCount <= 0) { this.st = 'pay'; this.tmr = 0; this.targetSym = null; this.chkWin(); }
        }
    }

    else if(this.st==='pay'){
      if(this.tmr===30&&this.win>0){
        playSnd('combo'); this.coins+=this.win; SaveSys.data.slotCoins=this.coins; SaveSys.data.jackpotPool=this.jp; SaveSys.save();
        
        // メッセージを上書きしないための処理（お守り等のテキストを保護）
        if(!this.msg.includes('JACKPOT') && !this.msg.includes('FREE') && !this.msg.includes('OMAMORI')){
            this.msg=`WIN ${this.win} COINS!`;
        }
      }
      if(this.tmr>100){
        if(this.coins<=0&&this.free<=0){
          this.st='bank';this.msg='GAME OVER... PRESS SPIN';
          SaveSys.addLog('スロット', '全財産をすって破産した…'); 
        }
        else{this.st='bet';this.bet=Math.min(this.bet,this.coins>0?this.coins:this.bet);}
      }
    }
    else if(this.st==='bank'){ if(keysDown.a){this.coins=50;SaveSys.data.slotCoins=this.coins;SaveSys.save();this.st='bet';this.bet=1;this.msg='BONUS 50 COINS!';playSnd('combo');} }

    for(let i=0;i<3;i++){
      if(!this.reels[i].st){this.reels[i].p+=this.reels[i].s;if(this.reels[i].p>=20*this.symH)this.reels[i].p-=20*this.symH;}
      if(this.reels[i].b>0)this.reels[i].b--;
    }
  },

  draw(){
    ctx.fillStyle='#222'; ctx.fillRect(0,0,200,300);
    if(this.st==='reach_A'&&this.rTmr%10<5)ctx.fillStyle='#f55'; else if(this.free>0)ctx.fillStyle='#00a'; else ctx.fillStyle='#a00';
    ctx.fillRect(10,10,180,280); ctx.fillStyle='#f00'; ctx.fillRect(15,15,170,270); 
    
    ctx.fillStyle='#000'; ctx.fillRect(20,50,160,130);

    ctx.fillStyle='#ff0'; ctx.font='bold 12px monospace'; ctx.fillText(`★ JACKPOT: ${this.jp} ★`,20,30);
    
    // アイテム使用中表示
    if (this.activeItem) {
        let itmName = this.shopData.find(i=>i.id===this.activeItem).name;
        ctx.fillStyle='#0ff'; ctx.font='10px monospace';
        ctx.fillText(`[${itmName} READY]`, 25, 45); 
    }

    // --- ショップ画面描画 ---
    if (this.st === 'shop') {
        ctx.fillStyle='#0f0'; ctx.font='bold 10px monospace';
        ctx.fillText('-- BLACK MARKET --', 45, 50);
        for(let i=0; i<this.shopData.length; i++) {
            let itm = this.shopData[i];
            ctx.fillStyle = this.shopCur === i ? '#ff0' : '#fff';
            ctx.fillText((this.shopCur === i ? '> ' : '  ') + itm.name, 25, 75 + i*20);
            ctx.fillStyle = this.coins >= itm.cost ? '#0ff' : '#555';
            ctx.fillText(itm.cost + 'G', 135, 75 + i*20);
        }
        let desc = this.shopData[this.shopCur].desc;
        ctx.fillStyle = '#aaa'; ctx.font='9px monospace'; ctx.fillText(desc, 25, 185);
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('A:BUY  B/LEFT:BACK', 50, 205);
    } 
    // --- 通常リール描画 ---
    else {
        ctx.fillStyle='#fff'; ctx.fillRect(30,60,40,100); ctx.fillRect(80,60,40,100); ctx.fillRect(130,60,40,100);

        ctx.save(); ctx.beginPath(); ctx.rect(30,60,140,100); ctx.clip();
        for(let i=0;i<3;i++){
          let r=this.reels[i], rx=30+i*50, bOff=r.b%2===0?r.b:-r.b, bIdx=Math.floor(r.p/this.symH), off=r.p%this.symH;
          for(let j=-1;j<=3;j++){ let sIdx=(bIdx+j)%20;if(sIdx<0)sIdx+=20; drawSprite(rx+4,60-off+j*this.symH+bOff,'#fff',this.sprs[this.lay[i][sIdx]],4.0); }
        } ctx.restore();

        // フリーズ演出オーバーレイ
        if (this.st === 'freeze') {
            if (this.tmr < 60) {
                ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(20,50,160,130);
            } else {
                ctx.fillStyle= (this.tmr%4<2) ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.5)';
                ctx.fillRect(20,50,160,130);
                ctx.fillStyle='#fff'; ctx.font='bold 16px monospace';
                ctx.fillText('SYSTEM OVERRIDE', 28, 120);
            }
        }

        ctx.lineWidth=1; ctx.strokeStyle='rgba(255,255,255,0.2)';
        ctx.beginPath();ctx.moveTo(25,108);ctx.lineTo(175,108);ctx.stroke(); ctx.beginPath();ctx.moveTo(25,76);ctx.lineTo(175,76);ctx.stroke();
        ctx.beginPath();ctx.moveTo(25,140);ctx.lineTo(175,140);ctx.stroke(); ctx.beginPath();ctx.moveTo(25,76);ctx.lineTo(175,140);ctx.stroke();
        ctx.beginPath();ctx.moveTo(25,140);ctx.lineTo(175,76);ctx.stroke();

        if(this.st==='pay'&&this.win>0&&this.tmr%10<5){
          ctx.lineWidth=4; ctx.strokeStyle='#ff0';
          if(this.lines.includes('mid')){ctx.beginPath();ctx.moveTo(25,108);ctx.lineTo(175,108);ctx.stroke();}
          if(this.lines.includes('top')){ctx.beginPath();ctx.moveTo(25,76);ctx.lineTo(175,76);ctx.stroke();}
          if(this.lines.includes('bot')){ctx.beginPath();ctx.moveTo(25,140);ctx.lineTo(175,140);ctx.stroke();}
          if(this.lines.includes('cr1')){ctx.beginPath();ctx.moveTo(25,76);ctx.lineTo(175,140);ctx.stroke();}
          if(this.lines.includes('cr2')){ctx.beginPath();ctx.moveTo(25,140);ctx.lineTo(175,76);ctx.stroke();}
        }
    }

    ctx.fillStyle='#000'; ctx.fillRect(20,190,160,50); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(20,190,160,50);
    ctx.fillStyle='#0f0'; ctx.font='12px monospace'; ctx.fillText(`COIN: ${this.coins}`,25,208); ctx.fillStyle='#ff0'; ctx.fillText(`BET: ${this.bet}`,115,208);
    if((this.st==='bet'&&this.tmr%60<30)||this.free>0){ctx.fillStyle=this.free>0?'#0ff':'#fff';ctx.fillText(this.msg,25,230);}else if(this.st!=='bet'&&this.st!=='shop'){ctx.fillStyle=this.win>0?'#ff0':'#fff';ctx.fillText(this.msg,25,230);}

    ctx.fillStyle='#fff'; ctx.font='9px monospace';
    ctx.fillText('7:x50 BAR:x20 BEL:x10 SUI:x5 CHE:x2', 17, 255);
    ctx.fillStyle='#f8f'; ctx.fillText('[W]:WILD(代用)', 17, 270);
    ctx.fillStyle='#0ff'; ctx.fillText('[F]:FREE(10回)', 105, 270);
    ctx.fillStyle='#ff0'; ctx.fillText('[王冠]:JACKPOT', 17, 282);
  }
};
