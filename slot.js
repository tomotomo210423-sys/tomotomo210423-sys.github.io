// === RETRO SLOT MACHINE - AUTO & PACHISLO EVOLUTION (FIXED v2) ===
const Slot={
  st:'bet', coins:100, bet:1, win:0, lines:[], msg:'', tmr:0, rTmr:0,
  jp:1000, free:0, symH:32, stoppedCount:0,
  reels:[{p:0,s:0,st:true,b:0},{p:0,s:0,st:true,b:0},{p:0,s:0,st:true,b:0}],
  winCoins: [], 
  auto: false, autoTmr: 0,
  
  shopData: [
    { id: 'f_ticket', name: 'Fスピン券', cost: 120, desc: '即座にフリースピン10回獲得!' },
    { id: 'safety', name: 'お守り', cost: 30, desc: '次スピンで外れても30G返金' },
    { id: 'hack', name: 'ハッキング', cost: 300, desc: 'ランダムな図柄を強制揃え' },
    { id: 'bibine', name: 'バイバイン', cost: 500, desc: '全所持金を1.2～2倍にする!' }, // ★説明文も変更
    { id: 'remote', name: 'リモコン', cost: 1500, desc: '次スピンで強制JP発生(1回)' },
    { id: 'exit', name: 'EXIT CASINO', cost: 0, desc: 'カジノを出てメニューに戻ります' }
  ],
  shopCur: 0, activeItem: null, targetSym: null, slipCount: 0,

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
    let d=SaveSys.data; this.coins=d.slotCoins||100; this.jp=d.jackpotPool||1000;
    if(this.coins<=0)this.coins=10;
    this.bet=1; this.st='bet'; this.tmr=0; this.free=0; 
    this.msg='A:PLAY / ▶:SHOP / SEL:AUTO';
    for(let i=0;i<3;i++){this.reels[i].p=Math.floor(Math.random()*20)*this.symH;this.reels[i].s=0;this.reels[i].st=true;this.reels[i].b=0;}
    BGM.stop();
    this.activeItem = null; this.shopCur = 0; this.targetSym = null; this.slipCount = 0;
    this.winCoins = []; this.auto = false; this.autoTmr = 0; this.stoppedCount = 0;
  },

  getSyms(i){
    let bIdx=Math.round(this.reels[i].p/this.symH)%20;
    return{t:this.lay[i][bIdx%20],m:this.lay[i][(bIdx+1)%20],b:this.lay[i][(bIdx+2)%20]};
  },
  
  getLines(s0,s1,s2){
    return [
      {n:'mid',s:[s0?.m, s1?.m, s2?.m]}, {n:'top',s:[s0?.t, s1?.t, s2?.t]},
      {n:'bot',s:[s0?.b, s1?.b, s2?.b]}, {n:'cr1',s:[s0?.t, s1?.m, s2?.b]},
      {n:'cr2',s:[s0?.b, s1?.m, s2?.t]}
    ];
  },

  chkTen(){
    let stopped = [this.reels[0].st, this.reels[1].st, this.reels[2].st];
    if (stopped.filter(Boolean).length !== 2) return false;
    
    let s0 = stopped[0] ? this.getSyms(0) : null;
    let s1 = stopped[1] ? this.getSyms(1) : null;
    let s2 = stopped[2] ? this.getSyms(2) : null;
    let lines = this.getLines(s0, s1, s2);
    
    for (let l of lines) {
       let syms = l.s.filter(x => x !== null);
       if (syms[0] === syms[1]) return true;
       if (syms[0] === 'WLD' || syms[1] === 'WLD') {
           if (!['FRE','JP'].includes(syms[0]) && !['FRE','JP'].includes(syms[1])) return true;
       }
    }
    return false;
  },

  chkWin(){
    let lines=this.getLines(this.getSyms(0),this.getSyms(1),this.getSyms(2));
    this.win=0; this.lines=[]; let tF=0,tJ=false;
    for(let l of lines){
      let n=l.s.filter(s=>s!=='WLD');
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

    let usedSafety = false;
    if (this.win === 0 && this.activeItem === 'safety') {
        this.win += 30; usedSafety = true;
    }

    if(tJ){ 
      this.win+=this.jp; this.jp=1000; this.msg='JACKPOT!!!'; 
      SaveSys.addLog('スロット', 'ジャックポットを当てて大儲けした！'); 
    }
    else if(tF>0){ this.free+=tF; this.msg=`GET ${tF} FREE SPINS!`; }
    else if(usedSafety) { this.msg='OMAMORI SAFE! +30G'; }
    else if(this.win===0) { this.msg='YOU LOSE...'; }

    if (this.activeItem === 'safety') this.activeItem = null;

    if (this.win > 0) {
        this.winCoins = [];
        let coinAmt = Math.min(50, this.win);
        for(let i=0; i<coinAmt; i++) {
            this.winCoins.push({ x: 100, y: 150, vx: (Math.random()-0.5)*8, vy: (Math.random()-1)*8 - 2 });
        }
    }
  },

  spin(){
    if(this.activeItem === 'remote') {
        this.st = 'freeze'; this.tmr = 0; this.activeItem = null; playSnd('hit'); return;
    }
    if(this.activeItem === 'hack') {
        this.targetSym = ['7','BAR','BEL','SUI','CHE'][Math.floor(Math.random()*5)];
        this.activeItem = null;
    } else { this.targetSym = null; }

    this.st='spin'; this.stoppedCount=0; this.lines=[]; this.msg='PRESS L/C/R or A!';
    for(let i=0;i<3;i++){this.reels[i].st=false;this.reels[i].s=12+i*2;} 
    playSnd('jmp');
  },

  update(){
    if(keysDown.select) {
        this.auto = !this.auto; playSnd('sel'); this.autoTmr = 0;
    }

    if (this.auto) {
        this.autoTmr++;
        if (this.st === 'bet' && this.autoTmr > 20) {
            if (this.coins >= this.bet || this.free > 0) { keysDown.a = true; } else { this.auto = false; }
            this.autoTmr = 0;
        } else if (this.st === 'spin' && this.autoTmr > 15) {
            keysDown.a = true; this.autoTmr = 0;
        } else if (this.st === 'reach_W' && this.autoTmr > 30) {
            keysDown.a = true; this.autoTmr = 0;
        } else if (this.st === 'bank' && this.autoTmr > 60) {
            keysDown.a = true; this.autoTmr = 0;
        }
    }

    this.tmr++;
    
    if (this.winCoins.length > 0) {
        for(let c of this.winCoins) { c.x += c.vx; c.y += c.vy; c.vy += 0.5; }
        this.winCoins = this.winCoins.filter(c => c.y < 350);
    }

    if(this.st === 'shop') {
        if(keysDown.left || keysDown.b) { this.st = 'bet'; playSnd('sel'); }
        if(keysDown.up) { this.shopCur = (this.shopCur - 1 + this.shopData.length) % this.shopData.length; playSnd('sel'); }
        if(keysDown.down) { this.shopCur = (this.shopCur + 1) % this.shopData.length; playSnd('sel'); }
        if(keysDown.a) {
           let item = this.shopData[this.shopCur];
           
           if (item.id === 'exit') {
               this.auto = false;
               switchApp(Menu); return;
           }

           if (this.coins >= item.cost) {
               if (item.id === 'f_ticket') {
                   this.coins -= item.cost; this.free += 10; playSnd('combo'); this.msg = 'GET 10 FREE SPINS!!';
               } else if (item.id === 'bibine') {
                   // ★バグ修正ポイント：バイバインの詐欺処理を修正
                   // 500Gは没収せず、そのまま所持金を倍加させる！
                   if (this.coins >= 9999) {
                       this.msg = 'COINS LIMIT REACHED!'; playSnd('hit');
                   } else {
                       let multi = 1.2 + Math.random() * 0.8;
                       let gain = Math.floor(this.coins * multi) - this.coins;
                       this.coins += gain; 
                       playSnd('combo'); this.msg = `CREDIT +${gain} !!`;
                   }
               } else {
                   if (this.activeItem !== item.id) {
                       this.coins -= item.cost; this.activeItem = item.id; playSnd('combo'); this.msg = `${item.name} SET!`;
                   } else { playSnd('hit'); }
               }
               SaveSys.data.slotCoins = this.coins; SaveSys.save();
           } else { playSnd('hit'); }
        }
        return;
    }

    if(this.st==='bet'){
      if(this.free>0){
        this.msg=`FREE SPIN: ${this.free}  PRESS A`; if(keysDown.a){this.free--;this.spin();}
      }else{
        if(keysDown.right){this.st='shop'; this.shopCur=0; playSnd('sel'); return;}
        if(keysDown.up){this.bet++; if(this.bet>3||this.bet>this.coins)this.bet=1; playSnd('sel');}
        if(keysDown.down){this.bet=Math.max(1,this.bet-1);playSnd('sel');}
        if(keysDown.b){this.bet=Math.min(3,this.coins);playSnd('combo');}
        if(keysDown.a&&this.coins>=this.bet){
          this.coins-=this.bet; this.jp+=this.bet; SaveSys.data.slotCoins=this.coins; SaveSys.data.jackpotPool=this.jp; SaveSys.save(); this.spin();
        }
      }
    }
    else if(this.st === 'freeze') {
        if(this.tmr === 60) { playSnd('combo'); screenShake(15); this.msg = 'SYSTEM OVERRIDE!'; }
        if(this.tmr > 130) {
            for(let i=0; i<3; i++) {
                let targetIdx = this.lay[i].indexOf('JP'); let centerPos = (targetIdx - 1 + 20) % 20;
                this.reels[i].p = centerPos * this.symH; this.reels[i].st = true; this.reels[i].b = 10;
            }
            this.stoppedCount = 3; this.st = 'pay'; this.tmr = 0; playSnd('hit'); this.chkWin();
        }
    }
    else if(this.st==='spin'){
      let targetReel = -1;
      
      if (keysDown.left && !this.reels[0].st) targetReel = 0;
      else if (keysDown.down && !this.reels[1].st) targetReel = 1;
      else if (keysDown.right && !this.reels[2].st) targetReel = 2;
      else if (keysDown.a) { targetReel = this.reels.findIndex(r => !r.st); }

      if (targetReel !== -1) {
        let r=this.reels[targetReel]; r.st=true; r.s=0; 
        if (this.targetSym) {
            let targetIdx = this.lay[targetReel].indexOf(this.targetSym);
            let centerPos = (targetIdx - 1 + 20) % 20;
            if (this.stoppedCount < 2) { r.p = centerPos * this.symH; } 
            else { this.slipCount = Math.floor(Math.random() * 3) + 1; r.p = ((centerPos - this.slipCount + 20) % 20) * this.symH; }
        } else { 
            r.p=(Math.round(r.p/this.symH)%20)*this.symH; 
        }
        
        r.b=5; playSnd('hit'); this.stoppedCount++;
        
        if(this.stoppedCount===2){ 
            if(this.chkTen()){this.st='reach_W';this.msg='REACH!! PRESS A!'; this.autoTmr=0;} 
        }
        else if(this.stoppedCount>=3){ 
            if(this.targetSym && this.slipCount > 0) { this.st = 'nudge'; this.tmr = 0; }
            else { this.st='pay'; this.tmr=0; this.chkWin(); }
        }
      }
    }
    else if(this.st==='reach_W'){ if(keysDown.a){this.st='reach_A';this.rTmr=0; this.reels.find(x=>!x.st).s=4; this.msg='DOKI DOKI...';playSnd('jmp');} }
    else if(this.st==='reach_A'){
      this.rTmr++; if(this.rTmr%15===0)playSnd('sel'); 
      if(this.rTmr>60) { let tr = this.reels.find(x=>!x.st); if(tr) tr.s = 2; }
      
      if(this.rTmr>100){ 
        let targetReel = this.reels.findIndex(x=>!x.st);
        let r=this.reels[targetReel]; r.st=true; r.s=0;
        
        if(this.targetSym) {
            let targetIdx = this.lay[targetReel].indexOf(this.targetSym); let centerPos = (targetIdx - 1 + 20) % 20;
            this.slipCount = Math.floor(Math.random() * 3) + 1; r.p = ((centerPos - this.slipCount + 20) % 20) * this.symH;
        } else { r.p=(Math.round(r.p/this.symH)%20)*this.symH; }
        r.b=10; playSnd('hit'); this.stoppedCount++;
        
        if(this.targetSym && this.slipCount > 0) { this.st = 'nudge'; this.tmr = 0; } else { this.st='pay'; this.tmr=0; this.chkWin(); }
      }
    }
    else if(this.st === 'nudge') {
        if (this.tmr > 20 && this.tmr % 15 === 0) {
            let r = this.reels.find(x=>x.b===10) || this.reels[2]; 
            r.p += this.symH; if (r.p >= 20 * this.symH) r.p -= 20 * this.symH;
            r.b = 5; this.slipCount--; playSnd('hit'); this.msg = 'NUDGE...! (HACKING)'; screenShake(3);
            if (this.slipCount <= 0) { this.st = 'pay'; this.tmr = 0; this.targetSym = null; this.chkWin(); }
        }
    }
    else if(this.st==='pay'){
      if(this.tmr===30&&this.win>0){
        playSnd('combo'); this.coins+=this.win; SaveSys.data.slotCoins=this.coins; SaveSys.data.jackpotPool=this.jp; SaveSys.save();
        if(!this.msg.includes('JACKPOT') && !this.msg.includes('FREE') && !this.msg.includes('OMAMORI')){ this.msg=`PAYOUT: ${this.win}`; }
      }
      if(this.tmr>100){
        if(this.coins<=0&&this.free<=0){ this.st='bank';this.msg='GAME OVER... PRESS A'; this.auto=false; SaveSys.addLog('スロット', '全財産をすって破産した…'); }
        else{this.st='bet';this.bet=Math.min(this.bet,this.coins>0?this.coins:this.bet); this.msg='A:PLAY / ▶:SHOP / SEL:AUTO';}
      }
    }
    else if(this.st==='bank'){ if(keysDown.a){this.coins=50;SaveSys.data.slotCoins=this.coins;SaveSys.save();this.st='bet';this.bet=1;this.msg='BONUS 50 CREDITS!';playSnd('combo');} }

    for(let i=0;i<3;i++){
      if(!this.reels[i].st){this.reels[i].p+=this.reels[i].s;if(this.reels[i].p>=20*this.symH)this.reels[i].p-=20*this.symH;}
      if(this.reels[i].b>0)this.reels[i].b--;
    }
  },

  draw(){
    const bgGrad = ctx.createLinearGradient(0,0,0,300);
    bgGrad.addColorStop(0, '#100'); bgGrad.addColorStop(1, '#301');
    ctx.fillStyle = bgGrad; ctx.fillRect(0,0,200,300);

    let cabG = ctx.createLinearGradient(10,10,190,10);
    cabG.addColorStop(0,'#333'); cabG.addColorStop(0.5,'#555'); cabG.addColorStop(1,'#333');
    ctx.fillStyle = cabG; ctx.fillRect(10,10,180,280);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(10,10,180,280);

    let t = Date.now()/100;
    for(let i=0; i<14; i++) {
        let lx = 16 + i*12.8;
        ctx.fillStyle = (i%3 === Math.floor(t)%3) ? '#f00' : '#400';
        ctx.beginPath(); ctx.arc(lx, 55, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(lx, 185, 2, 0, Math.PI*2); ctx.fill();
    }
    for(let i=0; i<10; i++) {
        let ly = 65 + i*12.2;
        ctx.fillStyle = (i%3 === Math.floor(t)%3) ? '#f00' : '#400';
        ctx.beginPath(); ctx.arc(16, ly, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(184, ly, 2, 0, Math.PI*2); ctx.fill();
    }

    if (this.st === 'shop') {
        ctx.fillStyle='rgba(0,10,0,0.9)'; ctx.fillRect(15, 20, 170, 260);
        ctx.fillStyle='#0f0'; ctx.font='bold 12px monospace';
        ctx.fillText('-- BLACK MARKET --', 30, 45);
        ctx.font='10px monospace';
        for(let i=0; i<this.shopData.length; i++) {
            let itm = this.shopData[i];
            ctx.fillStyle = this.shopCur === i ? '#ff0' : '#0f0';
            ctx.fillText((this.shopCur === i ? '▶ ' : '  ') + itm.name, 25, 70 + i*22);
            ctx.fillStyle = this.coins >= itm.cost || itm.cost === 0 ? '#0ff' : '#050';
            if (itm.cost > 0) ctx.fillText(itm.cost + 'G', 145, 70 + i*22);
        }
        ctx.fillStyle = '#080'; ctx.fillRect(20, 210, 160, 1);
        ctx.fillStyle = '#fff'; ctx.font='9px monospace'; 
        let desc = this.shopData[this.shopCur].desc;
        ctx.fillText(desc, 25, 230);
        ctx.fillStyle = '#888'; ctx.font = '8px monospace'; ctx.fillText('A:BUY / B,◀:EXIT', 50, 255);
    } else {
        
        if (this.st === 'bet') {
            ctx.fillStyle = '#ff0'; ctx.fillRect(180, 120, 10, 40);
            ctx.fillStyle = '#000'; ctx.font = '8px monospace';
            ctx.fillText('S', 182, 130); ctx.fillText('H', 182, 138); 
            ctx.fillText('O', 182, 146); ctx.fillText('P', 182, 154);
            if(Math.floor(Date.now()/500)%2===0) ctx.fillText('▶', 182, 164);
        }

        ctx.fillStyle = '#000'; ctx.fillRect(25, 20, 150, 28);
        ctx.fillStyle = '#100'; for(let y=22;y<48;y+=2) ctx.fillRect(25,y,150,1); 
        ctx.shadowBlur = 5; ctx.shadowColor = '#f00'; ctx.fillStyle = '#f00'; 
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`★ JACKPOT: ${this.jp}`, 30, 40);
        
        if (this.auto) {
            ctx.fillStyle = '#f00'; ctx.fillRect(25, 23, 30, 10);
            ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.fillText('AUTO', 28, 31);
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ddd'; ctx.fillRect(25, 62, 150, 116);
        ctx.save();
        ctx.beginPath(); ctx.rect(25,62,150,116); ctx.clip();
        for(let i=0;i<3;i++){
            let r=this.reels[i], rx=29+i*50, bOff=r.b%2===0?r.b:-r.b, bIdx=Math.floor(r.p/this.symH), off=r.p%this.symH;
            for(let j=-1;j<=4;j++){ 
                let sIdx=(bIdx+j)%20; if(sIdx<0)sIdx+=20; 
                drawSprite(rx, 68-off+j*this.symH+bOff, '#fff', this.sprs[this.lay[i][sIdx]], 4.0); 
            }
        }
        ctx.restore();

        let shadow = ctx.createLinearGradient(0,62,0,178);
        shadow.addColorStop(0, 'rgba(0,0,0,0.8)'); shadow.addColorStop(0.15, 'rgba(0,0,0,0)');
        shadow.addColorStop(0.85, 'rgba(0,0,0,0)'); shadow.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = shadow; ctx.fillRect(25,62,150,116);

        ctx.fillStyle = '#333'; ctx.fillRect(73, 62, 4, 116); ctx.fillRect(123, 62, 4, 116);
        ctx.fillStyle = '#ccc'; ctx.fillRect(74, 62, 2, 116); ctx.fillRect(124, 62, 2, 116);

        if (this.st === 'freeze') {
            ctx.fillStyle = (this.tmr < 60) ? 'rgba(0,0,0,0.9)' : ((this.tmr%4<2) ? 'rgba(255,0,0,0.6)' : 'rgba(0,0,255,0.6)');
            ctx.fillRect(25,62,150,116);
            if (this.tmr >= 60) { ctx.fillStyle='#fff'; ctx.font='bold 14px monospace'; ctx.fillText('SYSTEM OVERRIDE', 30, 125); }
        }

        ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.1)';
        let linesY = [78, 120, 162];
        linesY.forEach(y => { ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(175,y);ctx.stroke(); });
        ctx.beginPath();ctx.moveTo(25,78);ctx.lineTo(175,162);ctx.stroke();
        ctx.beginPath();ctx.moveTo(25,162);ctx.lineTo(175,78);ctx.stroke();

        if(this.st==='pay'&&this.win>0&&this.tmr%10<5){
          ctx.lineWidth=4; ctx.strokeStyle='#ff0'; ctx.shadowBlur=10; ctx.shadowColor='#ff0';
          if(this.lines.includes('mid')){ctx.beginPath();ctx.moveTo(25,120);ctx.lineTo(175,120);ctx.stroke();}
          if(this.lines.includes('top')){ctx.beginPath();ctx.moveTo(25,78);ctx.lineTo(175,78);ctx.stroke();}
          if(this.lines.includes('bot')){ctx.beginPath();ctx.moveTo(25,162);ctx.lineTo(175,162);ctx.stroke();}
          if(this.lines.includes('cr1')){ctx.beginPath();ctx.moveTo(25,78);ctx.lineTo(175,162);ctx.stroke();}
          if(this.lines.includes('cr2')){ctx.beginPath();ctx.moveTo(25,162);ctx.lineTo(175,78);ctx.stroke();}
          ctx.shadowBlur=0;
        }

        ctx.fillStyle = '#000'; ctx.fillRect(25, 192, 150, 50);
        ctx.fillStyle = '#100'; for(let y=194;y<240;y+=2) ctx.fillRect(25,y,150,1);
        
        ctx.fillStyle = '#0f0'; ctx.font = '11px monospace'; ctx.fillText(`CREDIT ${this.coins}`, 30, 208);
        ctx.fillStyle = '#ff0'; ctx.fillText(`BET ${this.bet}`, 125, 208);
        
        if (this.activeItem) {
            let itmName = this.shopData.find(i=>i.id===this.activeItem).name;
            ctx.fillStyle='#0ff'; ctx.font='10px monospace'; ctx.fillText(`[${itmName} READY]`, 30, 225);
        } else {
            ctx.fillStyle = (this.st==='pay' && this.win>0) ? '#ff0' : (this.free>0 ? '#0ff' : '#fff');
            ctx.font='9px monospace'; ctx.fillText(this.msg, 30, 225);
        }
        
        ctx.fillStyle = '#0f0'; ctx.font = '9px monospace'; 
        if (this.st === 'spin') {
            ctx.fillText('◀:L  ▼:C  ▶:R  A:AUTO', 28, 238);
        } else if (this.st === 'bet' && this.tmr%40<20) {
            ctx.fillText('PRESS A TO PLAY', 30, 238);
        }

        ctx.fillStyle='#111'; ctx.fillRect(20,250,160,30);
        ctx.fillStyle='#fff'; ctx.font='8px monospace';
        ctx.fillText('7:x50 BAR:x20 BEL:x10 SUI:x5 CHE:x2', 23, 260);
        ctx.fillStyle='#f8f'; ctx.fillText('[W]:WILD', 23, 273);
        ctx.fillStyle='#0ff'; ctx.fillText('[F]:FREE', 75, 273);
        ctx.fillStyle='#ff0'; ctx.fillText('[王冠]:JACKPOT', 120, 273);

        if (this.winCoins.length > 0) {
            ctx.fillStyle = '#ff0'; ctx.strokeStyle = '#a80'; ctx.lineWidth = 1;
            for(let c of this.winCoins) {
                ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
            }
        }
    }
  }
};
