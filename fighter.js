// === AUTO FIGHTER (Phase 23: SANS ULTIMATE & SINGLE FILE) ===
const Styles={RUSH:{name:'インファイター',desc:'常に前進し、接近戦でのコンボを狙う。',aggro:0.8,guard:0.1,dodge:0.1,range:35},ZONE:{name:'アウトレンジャー',desc:'距離を保ち、遠距離技でじわじわ削る。',aggro:0.3,guard:0.2,dodge:0.5,range:120},COUNTER:{name:'カウンター特化',desc:'ガードと回避を多用して敵の攻撃を誘う。',aggro:0.2,guard:0.6,dodge:0.2,range:50},TRICKY:{name:'トリッキー',desc:'不規則なステップやワープ技を駆使する。',aggro:0.5,guard:0.2,dodge:0.3,range:80},AERO:{name:'空の支配者',desc:'常に空中戦を好む。上空からの強襲を狙う。',aggro:0.6,guard:0.1,dodge:0.4,range:60},BALANCE:{name:'バランス',desc:'近・遠・防御を状況に応じて使い分ける。',aggro:0.5,guard:0.3,dodge:0.3,range:80},DEVIL:{name:'デビル',desc:'相手をハメることに全力を尽くす。',aggro:1.0,guard:0.0,dodge:0.1,range:45},SANS:{name:'Sans',desc:'【特殊】HPが回避ゲージとなり確定回避。専用の全スキルを操る。',aggro:0.4,guard:0.0,dodge:1.0,range:150}};
const Passives={NONE:{name:'なし',desc:'特別な効果を持たない。'},VAMPIRE:{name:'吸血鬼',desc:'与えたダメージの20%だけ自身のHPを回復。'},DESPERATION:{name:'背水の陣',desc:'自身のHPが30%以下の時、与ダメ1.5倍。'},GIANT:{name:'巨人の体',desc:'常に受けるダメージを20%カットする。'},NINJA:{name:'忍',desc:'移動スピードと回避距離がアップする。'},LEARNING:{name:'成長AI',desc:'相手の行動をリアルタイムに学習し最適化。'},MAHORAGA:{name:'摩虎羅',desc:'同じ技を5回受けると適応。被ダメ半減。'},HOVER:{name:'浮遊',desc:'重力を完全に無視して自在に飛行できる。'},SANS_DODGE:{name:'オート回避',desc:'Sans専用。HPを消費して攻撃を確定回避。'}};
const AwakenConds={NONE:{name:'なし',desc:'覚醒を行わない。'},HP20:{name:'HP20%以下',desc:'HPが残り20%を切ると覚醒。'},TIME:{name:'30秒経過',desc:'30秒経つと覚醒。'}};
const AwakenPassives={...Passives,CLONE:{name:'影分身',desc:'自身と同じ動きをする分身を2体召喚する。'}};
const Skills={
    jab:{name:'ジャブ',dmg:10,kb:2,range:35,start:4,act:8,rec:12,cd:10,vx:4,type:'melee',desc:'発生最速の基本技。'},
    upper:{name:'アッパー',dmg:20,kb:2,range:40,start:7,act:12,rec:20,cd:20,vx:5,type:'anti_air',desc:'相手を高く打ち上げる。'},
    smash:{name:'スマッシュ',dmg:40,kb:12,range:45,start:14,act:15,rec:35,cd:40,vx:8,type:'melee',desc:'強烈に吹き飛ばす必殺の一撃。'},
    meteor:{name:'メテオ',dmg:50,kb:15,range:45,start:10,act:15,rec:30,cd:40,vx:6,type:'air',desc:'【空中専用】敵を地面に叩き落とす。'},
    slide:{name:'スライド',dmg:20,kb:4,range:45,start:6,act:20,rec:20,cd:25,vx:12,type:'melee',desc:'高速で突進する奇襲技。'},
    beam:{name:'ビーム',dmg:40,kb:10,range:350,start:25,act:15,rec:40,cd:60,vx:-2,type:'range',desc:'正確に狙い撃つ長距離レーザー。'},
    sonic:{name:'ソニック',dmg:25,kb:4,range:200,start:12,act:1,rec:25,cd:30,vx:0,type:'shot',desc:'相手のいる方向へ飛ぶ衝撃波。'},
    dive:{name:'急降下',dmg:35,kb:8,range:60,start:8,act:15,rec:25,cd:30,vx:10,type:'air',desc:'【空中専用】斜め下へ突進蹴り。'},
    shoryu:{name:'昇龍拳',dmg:30,kb:10,range:40,start:5,act:15,rec:35,cd:35,vx:4,type:'anti_air',desc:'飛び上がりながら攻撃。対空に優れる。'},
    heal:{name:'ヒール',dmg:0,kb:0,range:0,start:30,act:5,rec:30,cd:120,vx:0,type:'buff',desc:'自身のHPを200回復する。'},
    warpAtk:{name:'幻影斬',dmg:25,kb:5,range:150,start:15,act:10,rec:25,cd:50,vx:0,type:'warp',desc:'相手の背後に一瞬でワープし斬る。'},
    throw:{name:'投げ技',dmg:35,kb:8,range:30,start:8,act:10,rec:20,cd:25,vx:5,type:'throw',desc:'ガード不能の投げ技。'},
    physCounter:{name:'物理当て身',dmg:0,kb:0,range:0,start:2,act:30,rec:20,cd:30,vx:0,type:'stance_phys',desc:'直接攻撃を無効化し超絶反撃。'},
    magReflect:{name:'魔法反射',dmg:0,kb:0,range:0,start:2,act:40,rec:20,cd:30,vx:0,type:'stance_mag',desc:'飛び道具を相手に跳ね返す。'},
    parapara:{name:'パラパラ',dmg:5,kb:1,range:0,start:10,act:5,rec:20,cd:90,vx:0,type:'summon',desc:'自機を追従し自動で弾を撃つUFO召喚。'},
    pull:{name:'追撃腕',dmg:15,kb:-15,range:150,start:8,act:10,rec:20,cd:30,vx:0,type:'pull',desc:'腕を伸ばして相手を引き寄せる。'},
    burst:{name:'爆裂拳',dmg:6,kb:1,range:40,start:6,act:40,rec:20,cd:35,vx:3,type:'multi',desc:'連続パンチ。最後は超威力で吹き飛ばす。'},
    random:{name:'RANDOM',dmg:0,kb:0,range:100,start:5,act:5,rec:15,cd:20,vx:0,type:'random',desc:'自爆か回復か謎の雷か...予測不可能。'},
    sans_bone:{name:'骨の壁',dmg:1,kb:0,range:200,start:10,act:30,rec:15,cd:20,vx:0,type:'sans_bone',desc:'地面から連続して骨を生やす。'},
    sans_blaster:{name:'ブラスター',dmg:2,kb:0,range:500,start:15,act:15,rec:25,cd:35,vx:0,type:'sans_blaster',desc:'極太ビームを放つ。'},
    sans_throw:{name:'通常骨',dmg:1,kb:0,range:250,start:5,act:15,rec:10,cd:15,vx:0,type:'sans_throw',desc:'様々なサイズの骨を大量に放つ。'},
    sans_warp:{name:'ちかみち',dmg:0,kb:0,range:0,start:2,act:5,rec:5,cd:30,vx:0,type:'sans_warp',desc:'一瞬で有利な位置へテレポートする。'},
    sans_blue_bone:{name:'青骨',dmg:3,kb:0,range:300,start:10,act:15,rec:10,cd:25,vx:0,type:'sans_blue_bone',desc:'動いている相手にだけダメージを与える骨。'},
    sans_ride:{name:'ブラスター乗り',dmg:15,kb:15,range:0,start:5,act:120,rec:15,cd:45,vx:0,type:'sans_ride',desc:'ブラスターに乗って2秒間高速突進。'},
    sans_gravity:{name:'重力操作',dmg:0,kb:0,range:600,start:15,act:10,rec:30,cd:50,vx:0,type:'sans_gravity',desc:'相手を壁に叩きつける。トドメは刺せない。'}
};
const SkillKeys=Object.keys(Skills).filter(k=>!k.startsWith('sans_'));
const SansSkillKeys=['sans_bone','sans_blaster','sans_throw','sans_warp','sans_blue_bone','sans_ride','sans_gravity'];
const CounterData={name:'カウンター',dmg:80,kb:15,range:45,start:4,act:15,rec:20,cd:0,vx:8,type:'melee'};
const getStyle=k=>Styles[k]||Styles['RUSH']; const getPassive=k=>Passives[k]||Passives['NONE']; const getAwaken=k=>AwakenConds[k]||AwakenConds['NONE']; const getAwakenPassive=k=>AwakenPassives[k]||AwakenPassives['NONE']; const getSkill=k=>Skills[k]||Skills['jab'];
const safeNum=(v,d)=>{let n=Number(v);return(isNaN(n)||!isFinite(n))?d:n;};

const AutoFighter = {
  st:'menu',menuCur:0,timer:0,stageWidth:800,stageHeight:500,groundY:420,scale:0.65,camX:0,camY:0,
  texts:[],vfx:[],bullets:[],isSim:false,simEpoch:0,simMaxEpoch:20,simWins:0,isInfinite:false,darkoutTimer:0,
  myAI:{},savedSlots:[null,null,null],labSt:'main',labCur:0,trainingMsg:'',

  sanitizeAI(ai) {
      if(!ai||typeof ai!=='object')ai={}; ai.name=ai.name||'MY-AI';
      ai.body=ai.body||{}; ai.body.width=Math.max(0.1,safeNum(ai.body.width,1)); ai.body.height=Math.max(0.1,safeNum(ai.body.height,1)); ai.body.head=Math.max(0.1,safeNum(ai.body.head,1));
      ai.color=ai.color||{}; ai.color.body=typeof ai.color.body==='string'?ai.color.body:'#0ff'; ai.color.aura=typeof ai.color.aura==='string'?ai.color.aura:'#ff0';
      ai.physics=ai.physics||{}; ai.physics.weight=Math.max(10,safeNum(ai.physics.weight,100));
      ai.base=ai.base||{}; ai.base.atk=Math.max(0.1,safeNum(ai.base.atk,1)); ai.base.res=Math.max(0.1,safeNum(ai.base.res,1)); ai.base.spd=Math.max(0.1,safeNum(ai.base.spd,1));
      ai.bonus=ai.bonus||{}; ai.bonus.atk=safeNum(ai.bonus.atk,0); ai.bonus.res=safeNum(ai.bonus.res,0); ai.bonus.spd=safeNum(ai.bonus.spd,0);
      ai.styleKey=Styles[ai.styleKey]?ai.styleKey:'RUSH';
      if(ai.styleKey==='SANS'){ ai.skillKeys=[...SansSkillKeys]; ai.passiveKey='SANS_DODGE'; ai.color.body='#fff'; ai.color.aura='#0ff'; } 
      else { if(!Array.isArray(ai.skillKeys))ai.skillKeys=['jab','upper','smash','sonic']; while(ai.skillKeys.length<4)ai.skillKeys.push('jab'); for(let i=0;i<4;i++)if(!Skills[ai.skillKeys[i]]||ai.skillKeys[i].startsWith('sans_'))ai.skillKeys[i]='jab'; ai.passiveKey=Passives[ai.passiveKey]&&ai.passiveKey!=='SANS_DODGE'?ai.passiveKey:'NONE'; }
      ai.awakenCond=AwakenConds[ai.awakenCond]?ai.awakenCond:'NONE'; ai.awakenPassive=AwakenPassives[ai.awakenPassive]?ai.awakenPassive:'NONE'; ai.awakenColor=typeof ai.awakenColor==='string'?ai.awakenColor:'#f00'; ai.learningLevel=Math.max(0,safeNum(ai.learningLevel,0)); return ai;
  },

  play(s){if(!this.isSim&&typeof playSnd!=='undefined')playSnd(s);}, shake(v){if(!this.isSim&&typeof screenShake!=='undefined')screenShake(safeNum(v,0));}, stop(v){if(!this.isSim&&typeof hitStop!=='undefined')hitStop(safeNum(v,0));},
  addText(x,y,t,c){if(this.isSim||!t)return;this.texts.push({x:safeNum(x,0),y:safeNum(y,0),text:String(t),color:c||'#fff',life:40});},
  addVFX(t,x,y,c,e={}){if(this.isSim)return;this.vfx.push({type:t,x:safeNum(x,0),y:safeNum(y,0),color:c||'#fff',life:safeNum(e.life,20),maxLife:safeNum(e.maxLife,20),...e});},
  drawDescBox(t,d){ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(5,205,190,90);ctx.strokeStyle='#555';ctx.strokeRect(5,205,190,90);ctx.fillStyle='#ff0';ctx.font='bold 11px monospace';ctx.fillText(t||'[ INFO ]',15,220);ctx.fillStyle='#fff';ctx.font='9px monospace';let sd=d||'';let l=[];for(let i=0;i<sd.length;i+=17)l.push(sd.substring(i,i+17));for(let i=0;i<l.length;i++)ctx.fillText(l[i],15,238+i*13);},

  init(){this.st='menu';this.menuCur=0;this.isSim=false;this.isInfinite=false;this.darkoutTimer=0;BGM.play('menu');this.myAI=this.sanitizeAI({});try{let d=localStorage.getItem('5in1_ultima_ai_slots');if(d)this.savedSlots=JSON.parse(d);if(this.savedSlots&&this.savedSlots[0])this.myAI=this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[0])));}catch(e){this.savedSlots=[null,null,null];}},
  checkHealth(){this.myAI=this.sanitizeAI(this.myAI);}, saveSlot(i){this.checkHealth();this.savedSlots[i]=JSON.parse(JSON.stringify(this.myAI));localStorage.setItem('5in1_ultima_ai_slots',JSON.stringify(this.savedSlots));}, loadSlot(i){if(this.savedSlots&&this.savedSlots[i]){this.myAI=this.sanitizeAI(JSON.parse(JSON.stringify(this.savedSlots[i])));return true;}return false;},

  createFighter(isP2, d) {
      let stKey=Styles[d.styleKey]?d.styleKey:'RUSH'; let sb=d.bonus||{atk:0,res:0,spd:0}; let sbs=d.base||{atk:1,res:1,spd:1};
      return {id:isP2?2:1,x:isP2?550:250,y:this.groundY,dir:isP2?-1:1,hp:1000,maxHp:1000,kr:0,base:{atk:sbs.atk+sb.atk,res:sbs.res+sb.res,spd:sbs.spd+sb.spd},body:d.body||{width:1,height:1,head:1},color:d.color||{body:'#fff',aura:'#ff0'},physics:d.physics||{weight:100},styleKey:stKey,skillKeys:d.skillKeys||['jab','upper','smash','sonic'],passiveKey:d.passiveKey||'NONE',awakenCond:d.awakenCond||'NONE',awakenPassive:d.awakenPassive||'NONE',awakenColor:d.awakenColor||'#f00',dynGuard:getStyle(stKey).guard,dynDodge:getStyle(stKey).dodge,hitHistory:{},adapting:{},adapted:{},state:'idle',stateFrame:0,prevState:'idle',cd:0,name:d.name||'FIGHTER',vx:0,vy:0,guarding:false,justGuardWindow:0,trail:[],hitCancel:false,hasHit:false,combo:0,comboTimer:0,comboDmg:0,isAwakened:false,funnelTimer:0,hasClones:false};
  },

  setupSimBattle(){
      this.checkHealth();this.timer=0;this.texts=[];this.vfx=[];this.bullets=[];this.darkoutTimer=0;this.p1=this.createFighter(false,this.myAI);
      if(Math.random()<0.25){this.p2=this.createFighter(true,this.myAI);this.p2.name='MIRROR';this.p2.color={body:'#555',aura:'#888'};}else{
          let eSt=Object.keys(Styles)[Math.floor(Math.random()*Object.keys(Styles).length)];let dSk=[];let dPa='NONE';
          if(eSt==='ZONE'){dSk=['beam','sonic','parapara','magReflect'];dPa='HOVER';}else if(eSt==='RUSH'||eSt==='DEVIL'){dSk=['jab','smash','burst','throw'];dPa='VAMPIRE';}else if(eSt==='AERO'){dSk=['dive','meteor','sonic','upper'];dPa='HOVER';}else if(eSt==='COUNTER'){dSk=['physCounter','magReflect','upper','pull'];dPa='MAHORAGA';}else if(eSt==='SANS'){dSk=[...SansSkillKeys];dPa='SANS_DODGE';}else{dSk=[...SkillKeys].sort(()=>Math.random()-0.5).slice(0,4);dPa='LEARNING';}
          let dD=this.sanitizeAI({name:'DUMMY-'+eSt,styleKey:eSt,skillKeys:dSk,passiveKey:dPa});if(eSt==='SANS'){dD.color={body:'#fff',aura:'#0ff'};}this.p2=this.createFighter(true,dD);
      }
      this.camX=(this.p1.x+this.p2.x)/2-(200/this.scale)/2;this.camY=this.groundY-(300/this.scale)/2;
  },

  update(){try{this._update();}catch(e){console.error("UpdE:",e);this.timer++;}},
  updateBattleState(){
      this.timer++;let d=Math.abs(safeNum(this.p1.x,0)-safeNum(this.p2.x,0));
      if(d<15){if(this.p1.x===this.p2.x){this.p1.x-=1;this.p2.x+=1;}else{let p=(15-d)/2;this.p1.x+=(this.p1.x<this.p2.x)?-p:p;this.p2.x+=(this.p2.x<this.p1.x)?-p:p;}}
      this.processFighter(this.p1,this.p2);this.processFighter(this.p2,this.p1);
      
      for(let i=this.bullets.length-1;i>=0;i--){
          let b=this.bullets[i];if(!b||!b.owner||!b.skill||safeNum(b.x,0)<-1000||safeNum(b.x,0)>this.stageWidth+1000){this.bullets.splice(i,1);continue;}
          if(b.skill.type==='homing'){let o=b.owner.id===1?this.p2:this.p1;let dx=safeNum(o.x,0)-b.x;let dy=(safeNum(o.y,this.groundY)-20)-b.y;let dl=Math.hypot(dx,dy)||1;b.vx+=(dx/dl)*0.8;b.vy+=(dy/dl)*0.8;let spd=Math.hypot(b.vx,b.vy);if(spd>12){b.vx=(b.vx/spd)*12;b.vy=(b.vy/spd)*12;}}
          b.x+=b.vx;b.y+=b.vy;b.life--;let aCol=(b.owner.color&&b.owner.color.aura)?b.owner.color.aura:'#ff0';let bAng=Math.atan2(b.vy,b.vx);
          if(b.isBlueBone){ this.addVFX('bone',b.x,b.y,'#0ff',{angle:bAng,life:2}); } else if(b.isBone||(b.skill&&b.skill.type==='sans_throw')){ this.addVFX('bone',b.x,b.y,'#fff',{angle:bAng,life:2}); } else { this.addVFX('slash',b.x,b.y,aCol,{size:15,angle:bAng,width:4,life:2}); }
          
          let o=b.owner.id===1?this.p2:this.p1;let hit=false;
          if(Math.abs(b.x-safeNum(o.x,0))<30&&Math.abs(b.y-safeNum(o.y,0))<50&&o.state!=='hurt'&&o.state!=='stunned'&&o.state!=='knockdown'){
              if(o.state==='atk_magReflect'){b.vx*=-1;b.owner=o;b.life=60;this.addVFX('impact',b.x,b.y,'#0ff',{size:40});this.addText(o.x,o.y-40,"REFLECT!!","#0ff");this.play('combo');}
              else{
                  if(b.isBlueBone){ let isM=Math.abs(o.vx)>1||Math.abs(o.vy)>1||o.state==='move'||o.state.startsWith('atk_'); if(isM) hit=this.applyHit(b.owner,b.skill,o,b.x,b.y); }
                  else { hit=this.applyHit(b.owner,b.skill,o,b.x,b.y); }
              }
          }
          if(b.life<=0||hit)this.bullets.splice(i,1);
      }
      [this.p1,this.p2].forEach(f=>{if(f){if(f.comboTimer>0)f.comboTimer--;if(f.comboTimer<=0&&f.state!=='hurt'&&f.state!=='stunned'&&f.state!=='knockdown'){let o=f.id===1?this.p2:this.p1;if(o){o.combo=0;o.comboDmg=0;}}}});
      let vW=200/this.scale;let vH=300/this.scale;let tX=(safeNum(this.p1.x,0)+safeNum(this.p2.x,0))/2-vW/2;let tY=(safeNum(this.p1.y,0)+safeNum(this.p2.y,0))/2-vH*0.6;
      this.camX+=(Math.max(0,Math.min(this.stageWidth-vW,tX))-this.camX)*0.1;this.camY+=(Math.max(0,Math.min(this.stageHeight-vH,tY))-this.camY)*0.1;
  },

  _update() {
    this.checkHealth();if(keysDown.select){switchApp(Menu);return;}
    if(this.st==='menu'){if(keysDown.up){this.menuCur=(this.menuCur-1+3)%3;this.play('sel');}if(keysDown.down){this.menuCur=(this.menuCur+1)%3;this.play('sel');}if(keysDown.a){this.play('jmp');if(this.menuCur===0){this.setupSimBattle();this.st='battle';BGM.play('action');}else if(this.menuCur===1){this.st='lab_main';this.labCur=0;}else{this.st='load_slot';this.labCur=0;}}for(let i=this.texts.length-1;i>=0;i--){this.texts[i].life--;this.texts[i].y-=0.5;if(this.texts[i].life<=0)this.texts.splice(i,1);}return;}
    if(this.st==='load_slot'){if(keysDown.up){this.labCur=(this.labCur-1+3)%3;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%3;this.play('sel');}if(keysDown.b){this.st='menu';this.play('hit');return;}if(keysDown.a){if(this.loadSlot(this.labCur)){this.st='menu';this.play('combo');this.addText(100,150,"LOAD SUCCESS!","#0f0");}else this.play('hit');}return;}
    if(this.st==='lab_main'){
        const items=['AI名前変更','戦闘スタイル','スキルセット','パッシブ＆覚醒','ステータス','体型＆カラー','通常学習(20回)','無限強化学習','AI初期化','戻る'];
        if(keysDown.up){this.labCur=(this.labCur-1+items.length)%items.length;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%items.length;this.play('sel');}
        if(keysDown.a){this.play('hit');if(this.labCur===0){let n=prompt("名前 (10文字)",this.myAI.name);if(n&&n.trim()!==''){this.myAI.name=n.substring(0,10);this.play('combo');}}else if(this.labCur===1){this.st='lab_style';this.labCur=0;}else if(this.labCur===2){this.st='lab_skills';this.labCur=0;}else if(this.labCur===3){this.st='lab_awaken';this.labCur=0;}else if(this.labCur===4){this.st='lab_stats';this.labCur=0;}else if(this.labCur===5){this.st='lab_body';this.labCur=0;}else if(this.labCur===6){this.isSim=true;this.isInfinite=false;this.simEpoch=0;this.simWins=0;this.setupSimBattle();this.st='training';this.trainingMsg='仮想敵 生成...';BGM.play('action');}else if(this.labCur===7){this.isSim=true;this.isInfinite=true;this.simEpoch=0;this.simWins=0;this.setupSimBattle();this.st='training';this.trainingMsg='Bボタンで中断';BGM.play('action');}else if(this.labCur===8){this.myAI=this.sanitizeAI({});this.texts=[];this.addText(100,150,"INITIALIZED!","#f00");}else{this.st='menu';this.menuCur=0;}}if(keysDown.b){this.st='menu';this.play('hit');}return;
    }
    if(this.st==='save_slot'){if(keysDown.up){this.labCur=(this.labCur-1+3)%3;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%3;this.play('sel');}if(keysDown.b){this.st='lab_main';this.labCur=5;this.play('hit');return;}if(keysDown.a){this.saveSlot(this.labCur);this.st='menu';this.isSim=false;this.play('combo');this.addText(100,150,"SAVE COMPLETED!","#0f0");}return;}
    if(this.st==='lab_style'){if(keysDown.b||keysDown.a){this.myAI=this.sanitizeAI(this.myAI);this.st='lab_main';this.labCur=1;this.play('hit');return;}if(keysDown.right||keysDown.left){this.play('sel');let dir=keysDown.right?1:-1;let keys=Object.keys(Styles);let idx=Math.max(0,keys.indexOf(this.myAI.styleKey));this.myAI.styleKey=keys[(idx+dir+keys.length)%keys.length];}return;}
    if(this.st==='lab_skills'){if(keysDown.up){this.labCur=(this.labCur-1+4)%4;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%4;this.play('sel');}if(keysDown.b||keysDown.a){this.st='lab_main';this.labCur=2;this.play('hit');return;}if(keysDown.right||keysDown.left){this.play('sel');if(this.myAI.styleKey!=='SANS'){let dir=keysDown.right?1:-1;let idx=Math.max(0,SkillKeys.indexOf(this.myAI.skillKeys[this.labCur]));this.myAI.skillKeys[this.labCur]=SkillKeys[(idx+dir+SkillKeys.length)%SkillKeys.length];}}return;}
    if(this.st==='lab_awaken'){if(keysDown.up){this.labCur=(this.labCur-1+4)%4;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%4;this.play('sel');}if(keysDown.b||keysDown.a){this.st='lab_main';this.labCur=3;this.play('hit');return;}if(keysDown.right||keysDown.left){this.play('sel');let dir=keysDown.right?1:-1;if(this.labCur===0){if(this.myAI.styleKey!=='SANS'){let keys=Object.keys(Passives);let idx=Math.max(0,keys.indexOf(this.myAI.passiveKey));this.myAI.passiveKey=keys[(idx+dir+keys.length)%keys.length];}}else if(this.labCur===1){let keys=Object.keys(AwakenConds);let idx=Math.max(0,keys.indexOf(this.myAI.awakenCond));this.myAI.awakenCond=keys[(idx+dir+keys.length)%keys.length];}else if(this.labCur===2){let keys=Object.keys(AwakenPassives);let idx=Math.max(0,keys.indexOf(this.myAI.awakenPassive));this.myAI.awakenPassive=keys[(idx+dir+keys.length)%keys.length];}else if(this.labCur===3&&keysDown.right){this.myAI.awakenColor='#'+Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0');}}return;}
    if(this.st==='lab_stats'){if(keysDown.up){this.labCur=(this.labCur-1+3)%3;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%3;this.play('sel');}if(keysDown.b||keysDown.a){this.st='lab_main';this.labCur=4;this.play('hit');return;}let vC=0;if(keysDown.left)vC=-1;if(keysDown.right)vC=1;if(vC!==0){let cA=Math.round(this.myAI.base.atk*10);let cR=Math.round(this.myAI.base.res*10);let cS=Math.round(this.myAI.base.spd*10);let t=cA+cR+cS;if(this.labCur===0){let n=Math.max(1,Math.min(20,cA+vC));if(t-cA+n<=30){this.myAI.base.atk=n/10;this.play('sel');}else this.play('hit');}else if(this.labCur===1){let n=Math.max(1,Math.min(20,cR+vC));if(t-cR+n<=30){this.myAI.base.res=n/10;this.play('sel');}else this.play('hit');}else if(this.labCur===2){let n=Math.max(1,Math.min(20,cS+vC));if(t-cS+n<=30){this.myAI.base.spd=n/10;this.play('sel');}else this.play('hit');}}return;}
    if(this.st==='lab_body'){if(keysDown.up){this.labCur=(this.labCur-1+4)%4;this.play('sel');}if(keysDown.down){this.labCur=(this.labCur+1)%4;this.play('sel');}if(keysDown.b||keysDown.a){this.st='lab_main';this.labCur=5;this.play('hit');return;}let vC=0;if(keysDown.left)vC=-0.05;if(keysDown.right)vC=0.05;if(vC!==0){if(this.labCur===0)this.myAI.body.width=Math.max(0.1,Math.min(2.0,this.myAI.body.width+vC));if(this.labCur===1)this.myAI.body.height=Math.max(0.1,Math.min(2.0,this.myAI.body.height+vC));if(this.labCur===2)this.myAI.physics.weight=Math.max(10,Math.min(200,this.myAI.physics.weight+vC*100));if(this.labCur===3&&keysDown.right)this.myAI.color.body='#'+Math.floor(Math.random()*16777215).toString(16).padEnd(6,'0');}return;}

    if(this.st==='battle'){
        this.updateBattleState();
        for(let i=this.texts.length-1;i>=0;i--){this.texts[i].life--;this.texts[i].y-=0.5;if(this.texts[i].life<=0)this.texts.splice(i,1);}
        for(let i=this.vfx.length-1;i>=0;i--){let v=this.vfx[i];v.life--;if(v.type==='slash'){v.x+=v.vx||0;v.y+=v.vy||0;}if(v.life<=0)this.vfx.splice(i,1);}
        if(safeNum(this.p1.hp,0)<=0||safeNum(this.p2.hp,0)<=0){this.st='result';this.play('combo');this.shake(10);}return;
    }
    if(this.st==='training'){
        if(keysDown.b&&this.isInfinite){this.isSim=false;BGM.play('menu');this.play('combo');this.st='save_slot';this.labCur=0;this.texts=[];this.addText(100,150,`TRAINING STOPPED! WINS:${this.simWins}`,"#0f0");return;}
        for(let loop=0;loop<10;loop++){
            this.updateBattleState();
            if(safeNum(this.p1.hp,0)<=0||safeNum(this.p2.hp,0)<=0||this.timer>1500){
                if(safeNum(this.p1.hp,0)>safeNum(this.p2.hp,0)&&safeNum(this.p1.hp,0)>0)this.simWins++;
                let b=safeNum(this.p1.hp,0)>safeNum(this.p2.hp,0)?0.005:0.002;
                this.myAI.bonus.atk=Math.min(5.0,safeNum(this.myAI.bonus.atk,0)+b);this.myAI.bonus.res=Math.min(5.0,safeNum(this.myAI.bonus.res,0)+b);this.myAI.bonus.spd=Math.min(5.0,safeNum(this.myAI.bonus.spd,0)+b);
                this.myAI.learningLevel+=1;this.simEpoch++;
                if(!this.isInfinite&&this.simEpoch>=this.simMaxEpoch){this.isSim=false;BGM.play('menu');this.play('combo');this.st='save_slot';this.labCur=0;this.texts=[];this.addText(100,150,`FINISH! WINS:${this.simWins}`,"#0f0");break;}else{this.setupSimBattle();}
            }
        }return;
    }
    if(this.st==='result'){if(keysDown.a){this.st='menu';this.play('sel');}return;}
  },

  applyHit(atk, sk, vic, hx, hy) {
       try {
           if(!sk||!vic||!atk)return false; 
           let sN=sk.name||'不明';let pKV=vic.isAwakened?vic.awakenPassive:vic.passiveKey;let pKA=atk.isAwakened?atk.awakenPassive:atk.passiveKey;
           let isSAtk=atk.styleKey==='SANS';let isSDef=pKV==='SANS_DODGE';

           if(vic.hasClones){vic.hasClones=false;this.addVFX('shockwave',vic.x,vic.y,'#fff',{size:80});this.addText(vic.x,vic.y-40,"身代わり!","#fff");this.play('hit');return true;}
           if(pKV==='MAHORAGA'&&vic.adapted&&vic.adapted[sN]){this.addVFX('impact',vic.x,vic.y-15,'#fff',{size:30,life:10});this.addText(vic.x,vic.y-40,"完全適応","#fff");this.play('sel');return true;}
           if(safeNum(vic.comboDmg,0)>100||safeNum(atk.combo,0)>=8){vic.vy=-8;vic.vx=atk.dir*15;vic.state='knockdown';vic.stateFrame=0;atk.combo=0;vic.comboDmg=0;atk.hitCancel=false;this.addText(vic.x,vic.y-30,"COMBO LIMIT","#888");return true;}
           if(vic.state==='atk_physCounter'&&sk.type!=='shot'&&sk.type!=='range'&&!isSAtk){this.play('combo');this.shake(15);this.stop(15);this.addVFX('impact',vic.x,vic.y,'#f00',{size:70});this.addText(vic.x,vic.y-50,"COUNTER!!","#f00");atk.state='stunned';atk.stateFrame=0;atk.vx=-atk.dir*5;vic.state='atk_counter';vic.stateFrame=0;vic.vx=vic.dir*8;return true;}
           if(vic.guarding&&vic.justGuardWindow>0&&sk.type!=='throw'){this.play('sel');this.shake(8);this.stop(10);this.addVFX('impact',vic.x,vic.y-20,'#0ff',{size:50});this.addText(vic.x,vic.y-50,"PARRY!","#0ff");atk.state='stunned';atk.stateFrame=0;atk.vx=-atk.dir*2;atk.vy=-3;atk.hitCancel=false;vic.guarding=false;vic.justGuardWindow=0;vic.state='idle';vic.cd=0;return true;}

           let sA=safeNum(atk.base&&atk.base.atk,1.0);let dmg=safeNum(sk.dmg,10)*sA;let aHp=safeNum(atk.hp,1000);let aMax=Math.max(1,safeNum(atk.maxHp,1000));
           if(pKA==='DESPERATION'&&(aHp/aMax)<=0.3)dmg*=1.5;if(pKV==='GIANT')dmg*=0.8;
           let sW=Math.max(10,safeNum(vic.physics&&vic.physics.weight,100));dmg=Math.max(1,dmg-((sW-100)*0.1)); 

           if(isSDef&&sk.type!=='throw'){let dC=dmg*1.5;if(safeNum(vic.hp,0)>dC+10){vic.hp-=dC;this.addText(vic.x,vic.y-40,"MISS","#ccc");vic.x+=(Math.random()<0.5?-60:60);vic.x=Math.max(10,Math.min(this.stageWidth-10,vic.x));this.play('sel');return true;}else{dmg=9999;}}
           let kb=safeNum(sk.kb,2)*sA*(100/sW);if(isSAtk){vic.kr=safeNum(vic.kr,0)+dmg*2;dmg=1;kb=0;}
           let isBF=(sN==='爆裂拳'&&atk.stateFrame>=Math.floor(safeNum(sk.start,5)/Math.max(0.5,safeNum(atk.base&&atk.base.spd,1)))+Math.floor(safeNum(sk.act,40)/Math.max(0.5,safeNum(atk.base&&atk.base.spd,1)))-5);
           if(isBF){dmg*=5;kb=20*sA*(100/sW);}if(sk.type==='pull')kb=-15;

           if(pKV==='MAHORAGA'&&!isSAtk){if(!vic.hitHistory)vic.hitHistory={};if(!vic.adapting)vic.adapting={};vic.hitHistory[sN]=(vic.hitHistory[sN]||0)+1;if(vic.hitHistory[sN]===5&&!vic.adapting[sN]){vic.adapting[sN]=180;this.addText(vic.x,vic.y-50,"解析開始...","#aaa");}}
           let isG=vic.guarding&&sk.type!=='throw'; 
           if(isG&&!isSAtk){vic.hp-=dmg*0.2;this.play('sel');this.shake(2);vic.vx=atk.dir*kb*0.3;this.addVFX('impact',vic.x,vic.y-15,'#888',{size:15,life:10});return true;}

           vic.hp-=dmg;if(pKA==='VAMPIRE'&&!isSAtk)atk.hp=Math.min(aMax,aHp+dmg*0.2);
           if(!isSAtk){vic.state='hurt';vic.stateFrame=0;vic.comboTimer=60;vic.comboDmg=safeNum(vic.comboDmg,0)+dmg;}
           atk.hitCancel=true;atk.combo=safeNum(atk.combo,0)+1;

           if(!isSAtk){
               if(vic.y<this.groundY-10)vic.vy=-4; 
               if(sk.type==='anti_air'){vic.vy=-16*(100/sW);vic.y-=5;}else if(sN==='メテオ'){vic.vy=20;kb*=0.5;}else if(sk.type==='throw'){vic.vy=-10;kb*=1.5;vic.y-=5;}else if(sN==='スライド'||sN==='急降下')vic.vy=-8*(100/sW);else if(safeNum(sk.kb,0)>10||isBF)vic.vy=-8-(Math.random()*2); 
               vic.vx=atk.dir*kb;
           }
           let aC=isSAtk?'#fff':((atk.color&&atk.color.aura)?atk.color.aura:'#ff0');
           if(sN==='ジャブ'||isSAtk){this.play('hit');this.shake(2);this.addVFX('impact',hx,hy,'#fff',{size:20});}else{this.play('combo');this.shake(10);this.stop(5);this.addVFX('impact',hx,hy,aC,{size:50});this.addVFX('slash',hx,hy,'#fff',{size:40,angle:Math.random()*Math.PI*2,width:4});}return true;
       } catch(e) { console.error("HitErr:",e); return false; }
  },

  createHitbox(a, sk, v, ox=0) {
    try {
        let ax=safeNum(a.x,0)+ox;let ay=safeNum(a.y,0);let vx=safeNum(v.x,0);let vy=safeNum(v.y,0);let aD=safeNum(a.dir,1);let aW=Math.max(0.1,safeNum(a.body&&a.body.width,1));
        let vD=Math.hypot(vx-ax,vy-ay);let inF=(vx-ax)*aD>=-15;let aR=safeNum(sk.range,30)*aW;
        if(sk.type==='multi'||sk.type==='pull'||(sk.type||'').startsWith('sans_'))inF=true;
        if(inF&&vD<=aR+15){return this.applyHit(a,sk,v,ax+((vx-ax)/2),vy-15);}return false;
    } catch(e) { return false; }
  },

  processFighter(f, opp) {
    try {
        if(!f||!opp)return;
        if(safeNum(f.kr,0)>0&&f.stateFrame%3===0){f.hp-=1;f.kr-=1;this.addVFX('impact',safeNum(f.x,0)+(Math.random()-0.5)*30,safeNum(f.y,this.groundY)-Math.random()*50,'#c0c',{size:4,life:5});}
        if(f.funnelTimer>0){f.funnelTimer--;if(f.funnelTimer%30===0){let by=safeNum(f.y,this.groundY)-60;let oy=safeNum(opp.y,this.groundY);let dx=safeNum(opp.x,0)-safeNum(f.x,0);let dy=oy-by;let dt=Math.hypot(dx,dy)||1;this.bullets.push({x:safeNum(f.x,0),y:by,vx:(dx/dt)*10,vy:(dy/dt)*10,owner:f,skill:{name:'パラ弾',dmg:5,kb:1,type:'shot'},life:60});this.addVFX('impact',safeNum(f.x,0),by,'#0ff',{size:15,life:5});}}
        
        let fstStr=f.state||'idle';
        // ★ 重力操作の壁叩きつけ処理
        if(fstStr==='blue_soul_slam'){
            f.x+=f.vx;f.y+=f.vy;let hW=false;
            if(f.x<=10){f.x=10;hW=true;}if(f.x>=this.stageWidth-10){f.x=this.stageWidth-10;hW=true;}
            if(f.y<=30){f.y=30;hW=true;}if(f.y>=this.groundY){f.y=this.groundY;hW=true;}
            if(hW){this.shake(20);this.play('combo');this.addVFX('impact',f.x,f.y,'#00f',{size:80});let d=Math.floor(Math.random()*20+30);f.hp-=d;if(f.hp<1)f.hp=1;f.kr=safeNum(f.kr,0)+d;f.state='hurt';f.stateFrame=0;}
            return;
        }

        if(f.state!==f.prevState){f.hasHit=false;f.prevState=f.state;}
        f.stateFrame++;let sS=Math.max(0.5,safeNum(f.base&&f.base.spd,1));if(f.cd>0)f.cd-=sS;
        
        if(!f.isAwakened){let aW=false;if(f.awakenCond==='HP20'&&f.hp<=f.maxHp*0.2)aW=true;if(f.awakenCond==='TIME'&&this.timer>1800)aW=true;if(aW){f.isAwakened=true;f.color={body:(f.color?f.color.body:'#fff'),aura:f.awakenColor||'#f00'};f.hp=Math.min(f.maxHp,f.hp+300);this.play('combo');this.shake(20);this.stop(30);this.addVFX('shockwave',f.x,f.y,f.color.aura,{size:150,life:40});this.addText(f.x,f.y-60,"AWAKENING!!",f.color.aura);if(f.awakenPassive==='CLONE')f.hasClones=true;f.state='idle';f.stateFrame=0;f.hitCancel=false;return;}}
        
        let pKey=f.isAwakened?f.awakenPassive:f.passiveKey;
        if(pKey==='LEARNING'&&f.stateFrame%60===0){let oS=opp.state||'';if(oS.startsWith('atk_')){let sO=getSkill(oS.substring(4));if(sO){if(sO.type==='shot'||sO.type==='range')f.dynDodge=Math.min(1,safeNum(f.dynDodge,0)+0.05);else f.dynGuard=Math.min(1,safeNum(f.dynGuard,0)+0.05);this.addVFX('impact',f.x,f.y-30,'#0f0',{size:15,life:5});}}}
        if(pKey==='MAHORAGA'&&f.adapting){for(let sk in f.adapting){if(f.adapting[sk]>0){f.adapting[sk]--;if(f.adapting[sk]===0){if(!f.adapted)f.adapted={};f.adapted[sk]=true;this.addText(f.x,f.y-70,"適応完了!!","#fff");this.play('combo');this.shake(5);this.addVFX('shockwave',f.x,f.y,'#fff',{size:80,life:20});delete f.adapting[sk];}}}}
        
        f.x=safeNum(f.x,250);f.y=safeNum(f.y,this.groundY);f.vx=safeNum(f.vx,0);f.vy=safeNum(f.vy,0);f.x+=f.vx;f.y+=f.vy;let sW=Math.max(10,safeNum(f.physics&&f.physics.weight,100));
        let isF=(pKey==='HOVER'||fstStr==='atk_sans_ride');
        if(isF&&!['hurt','knockdown','stunned'].includes(fstStr)){f.vx*=0.85;f.vy*=0.85;}else{f.vx*=0.85;if(f.y<this.groundY){f.vy+=0.6+(sW-100)*0.005;}else{f.y=this.groundY;f.vy=0;}}
        f.x=Math.max(10,Math.min(this.stageWidth-10,f.x));f.y=Math.max(30,Math.min(this.groundY,f.y)); 
        if(Math.abs(f.vx)>4||Math.abs(f.vy)>4||fstStr.startsWith('atk_')){if(!f.trail)f.trail=[];f.trail.unshift({x:f.x,y:f.y,dir:f.dir,state:f.state,frame:f.stateFrame});if(f.trail.length>5)f.trail.pop();}else if(f.trail&&f.trail.length>0){f.trail.pop();}
        
        if(f.state==='idle'||f.state==='move'){f.dir=(safeNum(opp.x,0)>f.x)?1:-1;}
        if(f.state==='hurt'){if(f.stateFrame>25){f.state='idle';f.stateFrame=0;f.hitCancel=false;}return;}if(f.state==='knockdown'){if(f.stateFrame>40){f.state='idle';f.stateFrame=0;f.hitCancel=false;}return;}if(f.state==='guard'){if(f.justGuardWindow>0)f.justGuardWindow--;if(f.stateFrame>20){f.state='idle';f.stateFrame=0;f.guarding=false;}return;}if(f.state==='stunned'){if(f.stateFrame>60){f.state='idle';f.stateFrame=0;f.hitCancel=false;}return;}
        
        let isA=fstStr.startsWith('atk_');let sK=isA?fstStr.substring(4):'';let skL=isA?(sK==='counter'?CounterData:getSkill(sK)):null;
        
        if(isA&&skL){
             let sF=Math.max(1,Math.floor(safeNum(skL.start,5)/sS));let aF=Math.max(1,Math.floor(safeNum(skL.act,10)/sS));let rF=Math.max(1,Math.floor(safeNum(skL.rec,15)/sS));let sN=skL.name||'';let sT=skL.type||'';
             if(f.stateFrame===sF&&sT==='random'){
                 let r=Math.random();if(r<0.15){f.hp=Math.max(1,f.hp-200);this.addText(f.x,f.y-40,"自爆!","#f00");this.addVFX('shockwave',f.x,f.y,'#f00',{size:100});f.state='idle';return;}else if(r<0.30){f.hp=Math.min(f.maxHp,f.hp+300);this.addText(f.x,f.y-40,"大回復!","#0f0");this.addVFX('shockwave',f.x,f.y,'#0f0',{size:100});f.state='idle';return;}else if(r<0.45){opp.hp=Math.max(1,opp.hp-300);this.addText(opp.x,opp.y-40,"謎の落雷!","#ff0");this.addVFX('beam',opp.x,0,'#ff0',{size:50,angle:Math.PI/2,life:15});opp.state='hurt';opp.stateFrame=0;f.state='idle';return;}else{let rK=SkillKeys[Math.floor(Math.random()*SkillKeys.length)];f.state='atk_'+rK;f.stateFrame=0;return;}
             }
             if(f.stateFrame===sF-2&&(sT==='warp'||sT==='sans_warp')){f.x=safeNum(opp.x,0)-safeNum(opp.dir,1)*(Math.random()*100+40);f.dir=safeNum(opp.dir,1);this.addVFX('shockwave',f.x,f.y,'#ccc',{size:30,life:10});if(sT==='sans_warp'){this.darkoutTimer=10;}} // ★ちかみち演出
             
             if(sT==='multi'&&f.stateFrame%6===0)f.hasHit=false;if(sT==='sans_bone'&&f.stateFrame%8===0&&f.stateFrame<=sF+aF){f.hasHit=false;}
             
             if(f.stateFrame>=sF&&f.stateFrame<=sF+aF){ 
                 let oX=f.x+20*f.dir;let oY=f.y-20*Math.max(0.1,safeNum(f.body&&f.body.height,1));let tX=safeNum(opp.x,250);let tY=safeNum(opp.y,this.groundY)-20*Math.max(0.1,safeNum(opp.body&&opp.body.height,1));let aTO=Math.atan2(tY-oY,tX-oX);
                 if(f.stateFrame===sF){
                     if(sT==='anti_air'){f.vy=-12;f.vx=f.dir*4;}if(sN==='急降下'){f.vy=10;f.vx=f.dir*12;}if(sT==='buff'){f.hp=Math.min(f.maxHp,f.hp+200);this.addVFX('shockwave',f.x,f.y,'#0f0',{size:50});this.play('combo');}if(sT==='summon'){f.funnelTimer=180;this.play('jmp');} 
                     if(sT==='shot'){this.play('jmp');this.bullets.push({x:oX,y:oY,vx:Math.cos(aTO)*12,vy:Math.sin(aTO)*12,owner:f,skill:skL,life:60});}else if(sT==='range'){this.addVFX('beam',oX,oY,(f.color?f.color.body:'#fff'),{size:safeNum(skL.range,350),angle:aTO,life:15});this.shake(6);}
                     if(sT==='sans_blaster'){let bx=oX-f.dir*30;let by=oY-40;this.addVFX('g_blaster',bx,by,'#fff',{dir:f.dir,angle:aTO,life:25});this.addVFX('beam',bx,by,'#0ff',{size:800,angle:aTO,life:15,width:60});this.play('combo');this.shake(15);}
                     if(sT==='sans_throw'){for(let i=0;i<5;i++){this.bullets.push({x:oX,y:oY-i*20,vx:f.dir*(10+Math.random()*5),vy:(Math.random()-0.5)*5,owner:f,skill:skL,life:80,isBone:true});}this.play('jmp');}
                     if(sT==='sans_blue_bone'){for(let i=0;i<5;i++){this.bullets.push({x:oX+i*40*f.dir,y:this.groundY,vx:f.dir*6,vy:0,owner:f,skill:skL,life:90,isBlueBone:true});}this.play('jmp');}
                     if(sT==='pull'){this.addVFX('hook',oX,oY,(f.color?f.color.body:'#fff'),{targetX:tX,targetY:tY,life:10});}
                     if(sT==='sans_gravity'){this.play('combo');this.shake(10);this.addVFX('darkout',0,0,'rgba(0,0,255,0.3)',{life:15});let d=[{x:40,y:0},{x:-40,y:0},{x:0,y:-40},{x:0,y:40}];let rd=d[Math.floor(Math.random()*d.length)];opp.vx=rd.x;opp.vy=rd.y;opp.state='blue_soul_slam';opp.stateFrame=0;}
                 }
                 // ★ ブラスター乗りの突進処理
                 if(sT==='sans_ride'){
                     let rdX=tX-f.x;let rdY=tY-f.y;let rDist=Math.hypot(rdX,rdY)||1;
                     f.vx=(rdX/rDist)*15;f.vy=(rdY/rDist)*15;
                     if(!f.hasHit){if(this.createHitbox(f,skL,opp,0)){f.hasHit=true;this.addVFX('slash',f.x,f.y,'#fff',{size:50,angle:0,width:10});}}
                 }
                 if(!f.hasHit&&sT!=='buff'&&sT!=='shot'&&sT!=='range'&&sT!=='summon'&&sT!=='sans_throw'&&sT!=='sans_blue_bone'&&sT!=='sans_ride'&&sT!=='sans_gravity'&&!sT.startsWith('stance')){
                     let mH=false;if(sT==='sans_bone'){let hX=f.x+f.dir*100;mH=this.createHitbox({...f,x:hX},{...skL,range:150},opp,0);if(f.stateFrame%8===0)this.addVFX('bone_wall',hX+(Math.random()-0.5)*40,this.groundY,'#fff',{size:90,life:15});}else if(sT==='sans_blaster'){mH=this.createHitbox({...f,x:oX-f.dir*30,y:oY-40},{...skL,range:600},opp,0);}else{mH=this.createHitbox(f,skL,opp,0);}
                     let cH=false;if(!mH&&f.hasClones){cH=this.createHitbox(f,skL,opp,-40)||this.createHitbox(f,skL,opp,40);}
                     if(mH||cH){f.hasHit=true;let a=f.dir===1?0:Math.PI;if(sT==='anti_air')a-=(Math.PI/4)*f.dir;if(sT==='air')a+=(Math.PI/4)*f.dir;if(sN!=='ジャブ'&&sT!=='sans_bone'&&sT!=='sans_blaster')this.addVFX('slash',oX,oY,(f.color?f.color.body:'#fff'),{size:safeNum(skL.range,30)*Math.max(0.1,safeNum(f.body&&f.body.width,1)),angle:a,width:10});}
                 }
             }
             if(f.stateFrame>(sF+aF+rF)){f.state='idle';f.stateFrame=0;f.hitCancel=false;f.hasHit=false;}
        }
        
        let cC=isA&&f.hitCancel&&skL&&f.stateFrame>(safeNum(skL.start,5)+5)/sS;
        if((f.state==='idle'&&f.cd<=0)||cC){
            let d=Math.abs(f.x-safeNum(opp.x,0));let isA_f=f.y<this.groundY-10;let oA=safeNum(opp.y,this.groundY)<this.groundY-10;let st=getStyle(f.styleKey);let nS=pKey==='NINJA'?1.5:1.0;let oSS=opp.state||'';
            let dG=st.name==='デビル'?0:safeNum(f.dynGuard,0.2);let dD=st.name==='デビル'?0:safeNum(f.dynDodge,0.2);
            if(oSS.startsWith('atk_')&&d<80&&!isA_f&&!cC&&st.name!=='デビル'){if(Math.random()<dG+dD){if(Math.random()<(dD/Math.max(0.01,dG+dD))&&d>30){f.state='move';f.stateFrame=0;f.vx=-f.dir*12*nS;f.cd=10;this.addVFX('shockwave',f.x,f.y,'#fff',{size:20,life:10});this.play('sel');this.addText(f.x,f.y-40,"DODGE","#ccc");return;}else{f.state='guard';f.stateFrame=0;f.guarding=true;f.justGuardWindow=10;return;}}}
            let sA=false;let mD=0;
            if(opp.state==='hurt'||opp.state==='stunned'||opp.state==='knockdown'||opp.state==='blue_soul_slam'){sA=true;if(oA&&!isA_f&&d<60&&f.state!=='move'&&!isF){f.state='move';f.stateFrame=0;f.vy=-16;f.vx=f.dir*5;f.cd=0;f.hitCancel=false;return;}}else{if(st.name==='空の支配者'&&!isA_f&&Math.random()<0.2&&!cC&&!isF){f.state='move';f.stateFrame=0;f.vy=-18;f.vx=f.dir*6;return;}if(d<safeNum(st.range,50)){if(Math.random()<safeNum(st.aggro,0.5))sA=true;else mD=-f.dir;}else{mD=f.dir;}}
            
            // ★ Sans専用の回避ガンビット
            if(f.styleKey==='SANS'&&oSS.startsWith('atk_')&&d<150&&f.cd<=0&&!cC){
                if(Math.random()<0.6){let eS=['sans_warp','sans_ride'];let sk=eS[Math.floor(Math.random()*2)];f.state='atk_'+sk;f.stateFrame=0;f.cd=getSkill(sk).cd;return;}
            }

            if(sA){
                let bSK=null;let bS=-100;let sKys=Array.isArray(f.skillKeys)?f.skillKeys:['jab','upper','smash','sonic'];let sW=Math.max(0.1,safeNum(f.body&&f.body.width,1.0));
                for(let k of sKys){
                    let s=getSkill(k);let sc=0;let sR=safeNum(s.range,30);let sT=s.type||'melee';
                    if(d<=sR*sW)sc+=10;else sc-=(d-sR)*0.2;
                    if(isA_f){if(sT==='air')sc+=30;else sc-=20;}else{if(sT==='air')sc-=20;}if(oA&&!isA_f){if(sT==='anti_air')sc+=20;}
                    if(sT==='buff'&&f.hp<f.maxHp*0.5&&d>150)sc+=40;if(sT==='summon'&&f.funnelTimer<=0)sc+=30;if(sT.startsWith('stance')){if(oSS.startsWith('atk_'))sc+=30;else sc-=50;}if(sT==='throw'){if(opp.guarding&&d<40)sc+=40;else sc-=10;}
                    if(cC){if(safeNum(s.start,5)<10)sc+=15;if(sT==='shot'||sT==='buff'||sT==='summon'||sT.startsWith('stance'))sc-=20;}
                    if(st.name==='デビル'){if(sT==='multi'||sT==='pull')sc+=20;}
                    if(sT==='sans_gravity'&&d<200)sc+=20; if(sT==='sans_blue_bone'&&opp.state==='move')sc+=30;
                    sc+=Math.random()*10;if(sc>bS){bS=sc;bSK=k;}
                }
                if(bSK){let sD=getSkill(bSK);f.state='atk_'+bSK;f.stateFrame=0;f.vx=f.dir*safeNum(sD.vx,0);f.cd=safeNum(sD.cd,20);f.hitCancel=false;}
            }else if(!cC){
                if(isF){let tY=safeNum(opp.y,this.groundY)-120;tY=Math.max(50,Math.min(this.groundY-50,tY));let dy=tY-f.y;let iM=false;if(Math.abs(dy)>20){f.vy+=(dy>0?1:-1)*nS;iM=true;}if(mD!==0){f.vx+=mD*1.5*nS;iM=true;}if(iM&&f.state==='idle'){f.state='move';f.stateFrame=0;}}else if(mD!==0&&Math.random()<(sS*0.3)){f.state='move';f.stateFrame=0;f.vx=mD*6*nS;}
            }
        }
        if(f.state==='move'&&Math.abs(f.vx)<0.5&&(f.y>=this.groundY||isF)){f.state='idle';f.stateFrame=0;}
    } catch(e) { console.error("ProcErr:",e); }
  },

  draw() { try { this._draw(); } catch(e) { console.error("DrawProtected:",e); if(typeof ctx!=='undefined'){ctx.restore();ctx.globalAlpha=1;} } },
  _draw() {
    if(this.st==='menu'||this.st.startsWith('lab_')||this.st==='save_slot'||this.st==='load_slot'){
        const grad=ctx.createLinearGradient(0,0,0,300);grad.addColorStop(0,'#001');grad.addColorStop(1,'#003');ctx.fillStyle=grad;ctx.fillRect(0,0,200,300);
        if(this.st==='menu'){ctx.fillStyle='#0ff';ctx.font='bold 16px monospace';ctx.fillText('ULTIMATE AI LAB',25,50);ctx.fillStyle=this.menuCur===0?'#ff0':'#fff';ctx.font='12px monospace';ctx.fillText((this.menuCur===0?'> ':'  ')+'BATTLE START',40,150);ctx.fillStyle=this.menuCur===1?'#ff0':'#fff';ctx.fillText((this.menuCur===1?'> ':'  ')+'AI FACTORY',45,180);ctx.fillStyle=this.menuCur===2?'#ff0':'#fff';ctx.fillText((this.menuCur===2?'> ':'  ')+'LOAD AI DATA',35,210);ctx.fillStyle='#888';ctx.font='9px monospace';ctx.fillText('最高に自由なAI育成',45,280);}
        else if(this.st==='save_slot'||this.st==='load_slot'){ctx.fillStyle='#0ff';ctx.font='bold 16px monospace';ctx.fillText(this.st==='save_slot'?'SAVE SLOT':'LOAD SLOT',50,50);ctx.font='12px monospace';for(let i=0;i<3;i++){ctx.fillStyle=this.labCur===i?'#ff0':'#fff';let txt=(this.savedSlots&&this.savedSlots[i])?`SLOT ${i+1}: ${this.savedSlots[i].name}`:`SLOT ${i+1}: NO DATA`;ctx.fillText((this.labCur===i?'> ':'  ')+txt,20,120+i*40);}ctx.fillStyle='#888';ctx.font='9px monospace';ctx.fillText(this.st==='save_slot'?'どこに保存しますか？':'どのAIを呼び出しますか？',30,270);}
        else{
            ctx.fillStyle='#112';ctx.fillRect(10,10,180,90);ctx.strokeStyle='#335';ctx.strokeRect(10,10,180,90);ctx.fillStyle='#888';ctx.font='8px monospace';ctx.fillText(`[ ${this.myAI.name} ] Lv.${Math.floor(safeNum(this.myAI.learningLevel,0)/10)}`,15,25);ctx.fillText('NORMAL',55,35);ctx.fillText('AWAKENED',130,35);let sC=this.myAI.color||{};let sAC=this.myAI.awakenColor||'#f00';let pF={x:0,y:0,dir:1,state:'idle',stateFrame:0,body:this.myAI.body,color:sC,isAwakened:false};ctx.save();ctx.translate(50,80);this.drawStickman(pF);ctx.restore();pF.isAwakened=true;pF.color={body:sC.body||'#fff',aura:sAC};ctx.save();ctx.translate(145,80);this.drawStickman(pF);ctx.restore();ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';
            if(this.st==='lab_main'){ctx.fillText('【CUSTOMIZE MENU】',30,110);ctx.font='10px monospace';const i=['AI名前変更','戦闘スタイル','スキルセット','パッシブ＆覚醒','ステータス','体型＆カラー','通常学習(20回)','無限強化学習','AI初期化','戻る'];for(let n=0;n<i.length;n++){ctx.fillStyle=this.labCur===n?'#ff0':'#fff';ctx.fillText((this.labCur===n?'> ':'  ')+i[n],20,125+n*15);}}
            else if(this.st==='lab_style'){ctx.fillText('【BATTLE STYLE】',40,120);ctx.font='11px monospace';let sN=getStyle(this.myAI.styleKey).name;ctx.fillStyle='#ff0';ctx.fillText(`◀ ${sN.padEnd(8,' ')} ▶`,35,160);this.drawDescBox(`[ ${sN} ]`,getStyle(this.myAI.styleKey).desc);}
            else if(this.st==='lab_skills'){ctx.fillText('【SKILL SETTING】',40,115);ctx.font='10px monospace';let sK=this.myAI.skillKeys||[];if(this.myAI.styleKey==='SANS'){ctx.fillStyle='#888';ctx.fillText("※Sans専用スキルで固定",10,135);}for(let i=0;i<4;i++){ctx.fillStyle=this.labCur===i?'#ff0':'#fff';let sN=getSkill(sK[i]).name;ctx.fillText(`SLOT ${i+1}: ◀ ${sN.padEnd(5,' ')} ▶`,20,150+i*15);}let cS=getSkill(sK[this.labCur]);this.drawDescBox(`[ ${cS.name} ] 威力:${cS.dmg} CD:${cS.cd}`,cS.desc);}
            else if(this.st==='lab_awaken'){ctx.fillText('【PASSIVE & AWAKEN】',25,120);ctx.font='10px monospace';const i=[`常時パッシブ : ${getPassive(this.myAI.passiveKey).name}`,`覚醒の条件　 : ${getAwaken(this.myAI.awakenCond).name}`,`覚醒パッシブ : ${getAwakenPassive(this.myAI.awakenPassive).name}`,`覚醒オーラ色 : [CHANGE]`];for(let n=0;n<i.length;n++){ctx.fillStyle=this.labCur===n?'#ff0':'#fff';ctx.fillText((this.labCur===n?'> ':'  ')+i[n],5,140+n*18);}let d='';let t='';if(this.labCur===0){t=`[ ${getPassive(this.myAI.passiveKey).name} ]`;d=getPassive(this.myAI.passiveKey).desc;}else if(this.labCur===1){t=`[ ${getAwaken(this.myAI.awakenCond).name} ]`;d=getAwaken(this.myAI.awakenCond).desc;}else if(this.labCur===2){t=`[ ${getAwakenPassive(this.myAI.awakenPassive).name} ]`;d=getAwakenPassive(this.myAI.awakenPassive).desc;}else{t=`[ オーラ色変更 ]`;d='覚醒（変身）した時に纏う激しいオーラの色を変更します。';}this.drawDescBox(t,d);}
            else if(this.st==='lab_stats'){ctx.fillText('【STATUS POINT】',40,120);ctx.font='10px monospace';let sB=this.myAI.base||{atk:1,res:1,spd:1};let pts=(3.0-(sB.atk+sB.res+sB.spd)).toFixed(1);ctx.fillStyle='#88f';ctx.fillText(`残りポイント: ${pts}`,40,140);const i=[`攻撃力(ATK) : ${sB.atk.toFixed(1)}`,`耐久力(RES) : ${sB.res.toFixed(1)}`,`素早さ(SPD) : ${sB.spd.toFixed(1)}`];for(let n=0;n<i.length;n++){ctx.fillStyle=this.labCur===n?'#ff0':'#fff';ctx.fillText((this.labCur===n?'> ':'  ')+i[n],20,160+n*20);}let d=this.labCur===0?'与えるダメージとノックバック力が上昇。':this.labCur===1?'受けるノックバックが減り、重い一撃にも耐える。':'技の発生、硬直、移動速度など全ての行動が速くなる。';this.drawDescBox(`[ ステータス配分 ]`,d);}
            else if(this.st==='lab_body'){ctx.fillText('【BODY & PHYSICS】',30,120);ctx.font='10px monospace';let sB=this.myAI.body||{width:1,height:1};let sP=this.myAI.physics||{weight:100};const i=[`横幅(W) : ${sB.width.toFixed(2)}`,`縦幅(H) : ${sB.height.toFixed(2)}`,`重量(WT): ${Math.floor(sP.weight)}kg`,`ボディ色: [CHANGE]`];for(let n=0;n<i.length;n++){ctx.fillStyle=this.labCur===n?'#ff0':'#fff';ctx.fillText((this.labCur===n?'> ':'  ')+i[n],20,140+n*18);}let d=this.labCur===0?'当たり判定が横に広がるが、攻撃のリーチも伸びる。':this.labCur===1?'縦に大きくなる。ジャンプ力にも影響？':this.labCur===2?'重いほどダメージとノックバックを少し軽減する。':'ボディカラーをランダムに変更します。';this.drawDescBox(`[ 体型＆物理設定 ]`,d);}
        }
        for(let t of this.texts){ctx.fillStyle=t.color;ctx.font='bold 16px monospace';ctx.globalAlpha=Math.max(0,t.life/40);ctx.fillText(t.text,t.x-20,t.y);ctx.globalAlpha=1;}return;
    }

    let iH=typeof hitStopTimer!=='undefined'&&hitStopTimer>3;const g=ctx.createLinearGradient(0,0,0,300);if(iH){g.addColorStop(0,'#fff');g.addColorStop(1,'#ccc');}else{g.addColorStop(0,'#050510');g.addColorStop(1,'#202030');}ctx.fillStyle=g;ctx.fillRect(0,0,200,300);
    applyShake();ctx.save();ctx.scale(this.scale,this.scale);ctx.translate(-this.camX,-this.camY);
    ctx.strokeStyle='#445';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,this.groundY);ctx.lineTo(this.stageWidth,this.groundY);ctx.stroke();
    for(let i=0;i<this.stageWidth;i+=40){ctx.beginPath();ctx.moveTo(i,this.groundY);ctx.lineTo(i-30,this.stageHeight);ctx.stroke();}
    for(let i=0;i<=this.stageHeight;i+=60){ctx.strokeStyle='rgba(100,255,100,0.05)';ctx.strokeRect(0,i,this.stageWidth,1);}
    for(let i=0;i<=this.stageWidth;i+=60){ctx.strokeRect(i,0,1,this.stageHeight);}

    [this.p1,this.p2].forEach(f=>{if(!f)return;let tL=f.trail||[];for(let i=0;i<tL.length;i++){let tr=tL[i];if(!tr)continue;let tF={...f,x:tr.x,y:tr.y,dir:tr.dir,state:tr.state,frame:tr.frame};this.drawStickman(tF,0.4-(i*0.08),true);}});
    if(this.p1&&(!iH||this.p1.state==='hurt'||this.p1.state==='stunned'))this.drawStickman(this.p1);
    if(this.p2&&(!iH||this.p2.state==='hurt'||this.p2.state==='stunned'))this.drawStickman(this.p2);
    
    this.vfx.forEach(v=>{
        let r=Math.max(0,safeNum(v.life,1))/Math.max(1,safeNum(v.maxLife,1));ctx.globalAlpha=r;let vS=Math.max(0.1,safeNum(v.size,10));
        if(v.type==='bone'){ctx.save();ctx.translate(safeNum(v.x,0),safeNum(v.y,0));ctx.rotate(safeNum(v.angle,0)+Date.now()/100);ctx.fillStyle=v.color;ctx.fillRect(-12,-3,24,6);ctx.beginPath();ctx.arc(-12,-3,4,0,Math.PI*2);ctx.arc(-12,3,4,0,Math.PI*2);ctx.arc(12,-3,4,0,Math.PI*2);ctx.arc(12,3,4,0,Math.PI*2);ctx.fill();ctx.restore();}
        else if(v.type==='bone_wall'){let h=vS*Math.sin(r*Math.PI);ctx.fillStyle=v.color;ctx.fillRect(safeNum(v.x,0)-8,safeNum(v.y,0)-h,16,h);ctx.beginPath();ctx.arc(safeNum(v.x,0)-4,safeNum(v.y,0)-h,6,0,Math.PI*2);ctx.arc(safeNum(v.x,0)+4,safeNum(v.y,0)-h,6,0,Math.PI*2);ctx.fill();}
        else if(v.type==='g_blaster'){ctx.save();ctx.translate(safeNum(v.x,0),safeNum(v.y,0));ctx.rotate(safeNum(v.angle,0));ctx.scale(safeNum(v.dir,1),1);ctx.fillStyle=v.color;ctx.beginPath();ctx.moveTo(-15,-20);ctx.lineTo(15,-20);ctx.lineTo(20,0);ctx.lineTo(10,20);ctx.lineTo(-10,20);ctx.lineTo(-20,0);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-6,-5,4,0,Math.PI*2);ctx.arc(6,-5,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0ff';ctx.beginPath();ctx.arc(6,-5,2,0,Math.PI*2);ctx.shadowBlur=10;ctx.shadowColor='#0ff';ctx.fill();ctx.restore();}
        else if(v.type==='slash'){ctx.strokeStyle=v.color;ctx.lineWidth=Math.max(0.1,safeNum(v.width,2)*r);ctx.lineCap='round';ctx.beginPath();ctx.arc(safeNum(v.x,0),safeNum(v.y,0),vS,safeNum(v.angle,0)-1.0*r,safeNum(v.angle,0)+1.0*r);ctx.stroke();}
        else if(v.type==='impact'){ctx.fillStyle=v.color;ctx.beginPath();let s=Math.max(0.1,vS*Math.pow(Math.max(0,1-r),0.5)+5);ctx.moveTo(v.x,v.y-s);ctx.lineTo(v.x+s/4,v.y-s/4);ctx.lineTo(v.x+s,v.y);ctx.lineTo(v.x+s/4,v.y+s/4);ctx.lineTo(v.x,v.y+s);ctx.lineTo(v.x-s/4,v.y+s/4);ctx.lineTo(v.x-s,v.y);ctx.lineTo(v.x-s/4,v.y-s/4);ctx.fill();}
        else if(v.type==='shockwave'){ctx.strokeStyle=v.color;ctx.lineWidth=Math.max(0.1,4*r);ctx.beginPath();ctx.arc(safeNum(v.x,0),safeNum(v.y,0),Math.max(0.1,vS*Math.max(0,1-r)*2+10),0,Math.PI*2);ctx.stroke();}
        else if(v.type==='beam'){ctx.save();ctx.translate(safeNum(v.x,0),safeNum(v.y,0));ctx.rotate(safeNum(v.angle,0));let h=Math.max(0.1,safeNum(v.width,20)*r);ctx.fillStyle=v.color;ctx.fillRect(0,-h/2,vS,h);ctx.fillStyle='#fff';ctx.fillRect(0,-h/6,vS,h/3);ctx.restore();}
        else if(v.type==='hook'){ctx.strokeStyle=v.color;ctx.lineWidth=Math.max(0.1,6*r);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(safeNum(v.x,0),safeNum(v.y,0));ctx.lineTo(safeNum(v.x,0)+(safeNum(v.targetX,0)-safeNum(v.x,0))*(1-r),safeNum(v.y,0)+(safeNum(v.targetY,0)-safeNum(v.y,0))*(1-r));ctx.stroke();}
        else if(v.type==='darkout'){ctx.fillStyle=v.color;ctx.fillRect(-1000,-1000,this.stageWidth*3,this.stageHeight*3);}
    });
    ctx.globalAlpha=1;
    for(let t of this.texts){ctx.fillStyle=t.color;ctx.font='bold 24px monospace';ctx.globalAlpha=Math.max(0,t.life/40);ctx.fillText(t.text,t.x-30,t.y);ctx.globalAlpha=1;}
    ctx.restore();resetShake();

    if(this.st==='training'){
        ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(0,0,200,75);ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';ctx.fillText(this.isInfinite?'◆ 無限強化学習中 ◆':'◆ AI TRAINING ◆',25,15);ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.fillText(`世代(EPOCH): ${this.simEpoch}`,10,35);ctx.fillStyle='#ff0';ctx.fillText(`WINS: ${this.simWins}`,120,35);let sB=this.myAI.bonus||{atk:0,res:0,spd:0};ctx.fillStyle='#aaf';ctx.font='9px monospace';ctx.fillText(`ATK+${safeNum(sB.atk,0).toFixed(3)} RES+${safeNum(sB.res,0).toFixed(3)} SPD+${safeNum(sB.spd,0).toFixed(3)}`,5,50);
        if(!this.isInfinite){ctx.fillStyle='#444';ctx.fillRect(10,60,180,6);ctx.fillStyle='#0f0';ctx.fillRect(10,60,(this.simEpoch/Math.max(1,this.simMaxEpoch))*180,6);}else{ctx.fillStyle='#ccc';ctx.fillText(this.trainingMsg,10,65);}
    }else if(this.p1&&this.p2){
        ctx.fillStyle='#000';ctx.fillRect(0,0,200,32);ctx.fillStyle='#222';ctx.fillRect(10,5,80,8);ctx.fillRect(110,5,80,8);
        let dHB=(f,xB,iP)=>{let mH=Math.max(1,safeNum(f.maxHp,1000));let hR=Math.max(0,safeNum(f.hp,0))/mH;let kR=Math.max(0,safeNum(f.kr,0))/mH;let bW=hR*80;let kW=Math.min(80-bW,kR*80);let pC=f.isAwakened?(f.awakenColor||'#f00'):(f.color?.body||'#fff');if(iP){ctx.fillStyle='#c0c';ctx.fillRect(190-bW-kW,5,kW,8);ctx.fillStyle=pC;ctx.fillRect(190-bW,5,bW,8);}else{ctx.fillStyle=pC;ctx.fillRect(xB,5,bW,8);ctx.fillStyle='#c0c';ctx.fillRect(xB+bW,5,kW,8);}};
        dHB(this.p1,10,false);dHB(this.p2,110,true);
        ctx.fillStyle='#fff';ctx.font='9px monospace';ctx.fillText(this.p1.name,10,25);ctx.fillText(this.p2.name,190-(this.p2.name.length*5.5),25);ctx.fillStyle='#888';ctx.font='10px monospace';let m=Math.floor(this.timer/60);let s=Math.floor((this.timer%60)*1.66);ctx.fillText(`${m}:${s.toString().padStart(2,'0')}`,85,12);
        if(this.p1.combo>1){ctx.fillStyle='#0ff';ctx.font='bold 12px monospace';ctx.fillText(this.p1.combo+' HITS!',10,45);}if(this.p2.combo>1){ctx.fillStyle='#f0f';ctx.font='bold 12px monospace';ctx.fillText(this.p2.combo+' HITS!',140,45);}
        if(this.st==='intro'){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,130,200,40);ctx.fillStyle='#ff0';ctx.font='bold 16px monospace';ctx.fillText('GET READY...',50,155);}else if(this.st==='result'){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,120,200,60);ctx.fillStyle='#f0f';ctx.font='bold 18px monospace';let w=this.p1.hp>0?this.p1.name:this.p2.name;ctx.fillText(w+' WIN!',100-(w.length*6),145);ctx.fillStyle='#fff';ctx.font='10px monospace';ctx.fillText('Press (A) to Menu',45,165);}
    }
    
    // ★ ちかみち（暗転）の全画面描画を最前面に
    if(this.darkoutTimer>0){
        this.darkoutTimer--;
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle='rgba(0,0,0,0.9)';ctx.fillRect(0,0,200,300);
    }
  },

  drawStickman(f, alpha=1, isT=false) {
    if(!f)return;let bW=Math.max(0.1,safeNum(f.body&&f.body.width,1));let bH=Math.max(0.1,safeNum(f.body&&f.body.height,1));let bHead=Math.max(0.1,safeNum(f.body&&f.body.head,1));let cBody=typeof f.color==='string'?f.color:(f.color?f.color.body:'#fff');let cAura=typeof f.color==='string'?'#ff0':(f.color?f.color.aura:'#ff0');let uC=f.isAwakened?(f.awakenColor||'#f00'):(isT?cAura:cBody);let sC=f.isAwakened?(f.awakenColor||'#f00'):cAura;let sf=isT?safeNum(f.frame,0):safeNum(f.stateFrame,0);let fst=f.state||'idle';let pK=f.isAwakened?f.awakenPassive:f.passiveKey;let isF=(pK==='HOVER'||f.styleKey==='SANS')&&!['hurt','knockdown','stunned'].includes(fst);

    let dC=(dx,dy,mA)=>{
        ctx.strokeStyle=uC;ctx.lineWidth=Math.max(0.1,(isT?2:2.5)/Math.max(bW,bH));ctx.lineCap='round';ctx.lineJoin='round';ctx.globalAlpha=mA;
        let p={h:{x:0,y:-12},n:{x:0,y:0},hip:{x:0,y:15},sL:{x:-4,y:2},sR:{x:4,y:2},eL:{x:-8,y:10},eR:{x:8,y:10},hL:{x:-12,y:20},hR:{x:12,y:20},kL:{x:-4,y:25},kR:{x:4,y:25},fL:{x:-6,y:40},fR:{x:6,y:40}};
        
        if(fst==='idle'||fst==='move'){let t=Date.now()/200;p.h.y+=Math.sin(t);p.n.y+=Math.sin(t);p.hip.y+=2;if(isF){p.hL={x:-15,y:5};p.hR={x:15,y:5};p.kL={x:-2,y:20};p.kR={x:2,y:25};p.fL={x:-2,y:35};p.fR={x:2,y:40};if(fst==='move'){p.h.x+=5;p.n.x+=2;p.hip.x-=2;p.hL={x:-15,y:0};p.hR={x:15,y:0};}}else{if(fst==='idle'){p.hL.y+=Math.sin(t+1)*2;p.hR.y+=Math.sin(t+1)*2;p.kL.x-=2;p.kR.x+=2;p.kL.y-=2;p.kR.y-=2;}else if(safeNum(f.y,this.groundY)<this.groundY-5){p.hL.y-=20;p.hR.y-=20;p.eL.y-=10;p.eR.y-=10;p.kL.y-=15;p.kR.y-=5;p.fL.y-=15;p.h.x+=5;}else{let r=Math.sin(sf*0.6)*15;p.hL.x=-r;p.hR.x=r;p.eL.x=-r/2;p.eR.x=r/2;p.fL.x=r;p.fR.x=-r;p.kL.x=r/2;p.kR.x=-r/2;p.h.x+=5;p.n.x+=5;p.hip.x+=3;}}}
        else if(fst==='atk_jab'){if(sf<4){p.hR={x:-5,y:10};p.eR={x:0,y:15};p.h.x-=2;}else if(sf<12){p.hR={x:35,y:0};p.eR={x:15,y:5};p.sR.x+=5;p.h.x+=5;p.fR.x+=10;}}
        else if(fst==='atk_upper'||fst==='atk_shoryu'){if(sf<7){p.hR={x:-5,y:25};p.eR={x:5,y:20};p.hip.y+=5;p.h.y+=5;p.kL.x-=5;p.kR.x+=5;}else{p.hR={x:20,y:-35};p.eR={x:10,y:-15};p.h.y-=8;p.h.x+=5;p.fL.y-=5;p.fR.y-=5;}}
        else if(fst==='atk_smash'||fst==='atk_tackle'){if(sf<14){p.hR={x:-15,y:-20};p.eR={x:-5,y:-10};p.h.x-=5;p.hip.x-=5;p.kL.x-=5;}else{p.hR={x:40,y:15};p.eR={x:20,y:10};p.h.x+=12;p.hip.x+=8;p.fL.x-=15;p.fR.x+=15;p.kR.x+=10;p.kR.y+=5;}}
        else if(fst==='atk_meteor'||fst==='atk_dive'){if(sf<10){p.hL={x:0,y:-25};p.hR={x:0,y:-25};p.eL={x:-10,y:-15};p.eR={x:10,y:-15};p.fL.y-=10;p.fR.y-=10;p.kL.y-=10;p.kR.y-=10;}else{p.hL={x:30,y:30};p.hR={x:30,y:30};p.eL={x:15,y:15};p.eR={x:15,y:15};p.h.x+=10;p.h.y+=5;p.hip.y+=5;p.kL.x-=5;}}
        else if(fst==='atk_slide'){if(sf<6){p.h={x:-5,y:5};p.hip={x:0,y:15};p.kL.x-=10;p.kL.y+=5;p.kR.x+=10;p.kR.y+=5;}else{p.h={x:15,y:10};p.n={x:10,y:15};p.hip={x:-5,y:25};p.hR={x:20,y:25};p.hL={x:5,y:25};p.eR={x:15,y:20};p.eL={x:0,y:20};p.fR={x:35,y:35};p.kR={x:15,y:30};p.fL={x:-25,y:35};p.kL={x:-15,y:30};}}
        else if(fst.startsWith('atk_beam')||fst.startsWith('atk_sonic')||fst.startsWith('atk_parapara')||fst==='atk_g_blaster'||fst==='atk_bone_throw'||fst==='atk_sans_blue_bone'){if(sf<12){p.hR={x:-15,y:10};p.hL={x:-15,y:10};p.h={x:-5,y:0};p.hip={x:5,y:15};p.kL.x+=5;p.kR.x-=5;}else{p.hR={x:30,y:0};p.hL={x:30,y:0};p.eR={x:15,y:5};p.eL={x:15,y:5};p.h={x:10,y:-5};p.hip={x:-5,y:15};p.fR.x+=10;p.fL.x-=10;}}
        else if(fst==='atk_heal'||fst==='atk_sans_gravity'){p.hL={x:0,y:-20};p.hR={x:0,y:-20};p.h={x:0,y:-5};p.hip={x:0,y:20};p.kL={x:-10,y:30};p.kR={x:10,y:30};p.fL={x:-15,y:40};p.fR={x:15,y:40};if(fst==='atk_sans_gravity'&&sf>15){p.hR={x:30,y:0};}}
        else if(fst==='atk_warpAtk'||fst==='atk_counter'||fst==='atk_shortcut'){if(sf<4){p.hR={x:-20,y:15};p.h.y+=5;p.hip.y+=5;p.kL.x-=8;p.kR.x+=8;}else{p.hR={x:25,y:-30};p.h.x+=10;p.fR.x+=15;p.fR.y-=5;p.fL.x-=5;}}
        else if(fst==='atk_throw'||fst==='atk_pull'){if(sf<8){p.hR={x:25,y:5};p.eR={x:15,y:5};p.h.x+=5;}else{p.hL={x:-15,y:25};p.hR={x:-15,y:25};p.h.x-=10;p.hip.x-=5;}}
        else if(fst==='atk_physCounter'||fst==='atk_sans_bone'){p.hL={x:5,y:-5};p.hR={x:-5,y:-5};p.eL={x:10,y:5};p.eR={x:-10,y:5};if(fst==='atk_sans_bone'){p.hR={x:25,y:10};p.eR={x:15,y:15};}} 
        else if(fst==='atk_magReflect'){p.hR={x:25,y:-5};p.eR={x:15,y:0};if(!isT){ctx.shadowBlur=15;ctx.shadowColor='#0ff';}}
        else if(fst==='atk_burst'){if(sf%8<4){p.hR={x:25,y:0};p.hL={x:-5,y:15};p.h.x+=5;}else{p.hL={x:25,y:0};p.hR={x:-5,y:15};p.h.x-=5;}}
        else if(fst==='atk_sans_ride'){p.hL={x:-15,y:20};p.hR={x:15,y:20};p.kL={x:-10,y:30};p.kR={x:10,y:30};p.fL={x:-10,y:30};p.fR={x:10,y:30};p.h.x+=5;p.hip.y+=10;if(!isT){ctx.save();ctx.translate(dx,dy+30);ctx.scale(safeNum(f.vx,1)>0?1:-1,1);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(-15,-10);ctx.lineTo(15,-10);ctx.lineTo(20,10);ctx.lineTo(10,20);ctx.lineTo(-10,20);ctx.lineTo(-20,10);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-6,-5,4,0,Math.PI*2);ctx.arc(6,-5,4,0,Math.PI*2);ctx.fill();ctx.restore();}}
        else if(fst==='hurt'){p.h={x:-15,y:-5};p.hip={x:5,y:10};p.sL={x:-10,y:5};p.sR={x:-5,y:5};p.eL={x:-15,y:15};p.eR={x:-5,y:15};p.hL={x:-20,y:25};p.hR={x:-10,y:25};p.fL={x:15,y:30};p.fR={x:-5,y:35};p.kL={x:20,y:20};}
        else if(fst==='knockdown'||fst==='blue_soul_slam'){p.h={x:-20,y:15};p.hip={x:0,y:25};p.hL={x:-15,y:35};p.hR={x:-5,y:35};p.kL={x:15,y:35};p.fL={x:30,y:40};p.n.y+=10;if(fst==='blue_soul_slam'){ctx.shadowBlur=15;ctx.shadowColor='#00f';}} 
        else if(fst==='stunned'){p.h={x:-10,y:5};p.hip={x:0,y:15};p.hL={x:-5,y:30};p.hR={x:5,y:30};p.kL={x:10,y:30};p.fL={x:15,y:40};} 
        else if(fst==='guard'){p.hL={x:10,y:-5};p.hR={x:10,y:5};p.eL={x:5,y:5};p.eR={x:5,y:10};p.h.y+=3;p.hip.y+=5;p.kL.x-=5;p.kR.x+=5;if(!isT&&f.justGuardWindow>0){ctx.shadowBlur=15;ctx.shadowColor='#0ff';ctx.strokeStyle='#0ff';}}

        ctx.save();ctx.translate(dx,dy);ctx.scale(bW,bH);if(safeNum(f.dir,1)===-1)ctx.scale(-1,1);
        if(!isT&&(fst.startsWith('atk_')||fst==='move'||f.isAwakened)){ctx.shadowBlur=f.isAwakened?20:12;ctx.shadowColor=sC;}

        ctx.beginPath();ctx.moveTo(p.n.x,p.n.y);ctx.lineTo(p.hip.x,p.hip.y);ctx.moveTo(p.n.x,p.n.y);ctx.lineTo(p.sL.x,p.sL.y);ctx.lineTo(p.eL.x,p.eL.y);ctx.lineTo(p.hL.x,p.hL.y);ctx.moveTo(p.n.x,p.n.y);ctx.lineTo(p.sR.x,p.sR.y);ctx.lineTo(p.eR.x,p.eR.y);ctx.lineTo(p.hR.x,p.hR.y);ctx.moveTo(p.hip.x,p.hip.y);ctx.lineTo(p.kL.x,p.kL.y);ctx.lineTo(p.fL.x,p.fL.y);ctx.moveTo(p.hip.x,p.hip.y);ctx.lineTo(p.kR.x,p.kR.y);ctx.lineTo(p.fR.x,p.fR.y);ctx.stroke();
        ctx.shadowBlur=0;ctx.beginPath();ctx.arc(p.h.x,p.h.y,Math.max(0.1,6*bHead),0,Math.PI*2);ctx.fillStyle=isT?cAura:uC;ctx.fill();
        ctx.restore();
    };

    let dx=safeNum(f.x,0);let dy=safeNum(f.y,0)-20*bH;
    if((fst==='stunned'||fst==='knockdown'||fst==='blue_soul_slam')&&!isT){dx+=(Math.random()-0.5)*4;dy+=(Math.random()-0.5)*4;ctx.strokeStyle='#888';}

    drawCore(dx,dy,alpha);
    if(f.hasClones&&!isT){drawCore(dx-40,dy,0.4);drawCore(dx+40,dy,0.4);}
    if(!isT&&pK==='MAHORAGA'&&f.hitHistory){
        let mA=0;for(let k in f.hitHistory)if(safeNum(f.hitHistory[k],0)>mA)mA=f.hitHistory[k];
        if(mA>0){ctx.shadowBlur=0;ctx.strokeStyle='#ff0';ctx.lineWidth=1;let r=(sf*mA)*0.1;ctx.beginPath();for(let i=0;i<8;i++){ctx.moveTo(dx,dy-15*bH);ctx.lineTo(dx+Math.cos(r+i*Math.PI/4)*10,dy-15*bH+Math.sin(r+i*Math.PI/4)*10);}ctx.stroke();}
    }
    ctx.globalAlpha=1;
    if(!isT&&f.funnelTimer>0){ctx.fillStyle=cAura;ctx.shadowBlur=10;ctx.shadowColor=cAura;let uY=dy-30+Math.sin(Date.now()/100)*5;ctx.fillRect(dx-10,uY,20,4);ctx.fillRect(dx-5,uY-4,10,4);ctx.shadowBlur=0;}
  }
};
