// === ONLINE BATTLE - ROYAL JOKER (Phase 6.1: Result Menu Fix) ===
const S_NAMES = ["", "1:透視", "2:交換", "3:贈物", "4:目隠し", "5:鉄壁", "6:予言", "7:重力", "8:慈悲", "9:加速", "10:革命"];

const Online = {
  st: 'boot', role: '', peer: null, conn: null, peerId: '', targetId: '', msg: 'LOADING NETWORK...',
  cursor: 0, hostPass: '', myPass: '', guestJoined: false, isBot: false, botTimer: 0,
  roomName: '', roomList: [], roomCursor: 0,
  isSkillMenu: false, skillCursor: 0,
  confirmLeave: false, isResult: false, resultCursor: 0, myChoice: '', opChoice: '',
  skillFlash: 0, skillFlashColor: '#fff',
  cardPositions: [], cardTargetX: [], cardTargetY: [],
  opCardPositions: [], opCardTargetX: [], opCardTargetY: [],
  resultOverlay: 0, resultWin: false,
  state: {
    hostHand: [], guestHand: [],
    skills: { host: [], guest: [] },
    effects: { host: { shield: false, oracle: false, gravity: false, haste: 0 }, guest: { shield: false, oracle: false, gravity: false, haste: 0 }, global: { revolution: false } },
    turn: 'host', nextTurn: '', msg: 'GAME START!', wait: 60,
    shuffleTriggered: false, activeSkill: 0, pendingSkill: 0
  },
  
  async init() {
    this.st = 'boot'; this.msg = 'LOADING NETWORK...'; this.role = ''; 
    this.peerId = ''; this.targetId = ''; this.hostPass = ''; this.myPass = ''; 
    this.guestJoined = false; this.isBot = false; this.roomList = []; this.roomCursor = 0;
    this.isSkillMenu = false; this.skillCursor = 0;
    this.confirmLeave = false; this.isResult = false; this.myChoice = ''; this.opChoice = '';
    this.skillFlash = 0; this.skillFlashColor = '#fff';
    this.cardPositions = []; this.cardTargetX = []; this.cardTargetY = [];
    this.opCardPositions = []; this.opCardTargetX = []; this.opCardTargetY = [];
    this.resultOverlay = 0; this.resultWin = false;
    
    const loadScript = (src) => new Promise(r => {
      if (document.querySelector(`script[src="${src}"]`)) return r();
      const s = document.createElement('script'); s.src = src; s.onload = r; document.head.appendChild(s);
    });

    if (!window.firebase) {
      await loadScript("https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js");
      await loadScript("https://www.gstatic.com/firebasejs/10.8.1/firebase-database-compat.js");
    }
    
    if (window.firebase && !firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyDEfsFzw9CKmBDBDqP0L21uDVTZ80HWXPY",
        authDomain: "gorilla2-e0d2a.firebaseapp.com",
        databaseURL: "https://gorilla2-e0d2a-default-rtdb.firebaseio.com",
        projectId: "gorilla2-e0d2a"
      });
    } else if (window.firebase && firebase.apps.length > 0) {
      // main.jsで既に初期化されている場合はそれを使用
      console.log("🔥 Firebase already initialized, reusing app");
    }
    
    if (!window.Peer) await loadScript("https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js");
    this.st = 'menu';
  },

  leaveGame() {
    if (this.role === 'host' && this.peerId) firebase.database().ref('rooms/' + this.peerId).remove();
    if (this.conn) { this.conn.close(); }
    if (this.peer) { this.peer.destroy(); }
    firebase.database().ref('rooms').off(); 
    this.isResult = false; this.confirmLeave = false;
    switchApp(Menu); 
  },

  startPeer(isHost) {
    this.role = isHost ? 'host' : 'guest';
    this.st = 'connecting'; this.msg = 'CONNECTING TO SERVER...';
    const myId = 'RJ_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    this.peer = new Peer(myId);
    
    this.peer.on('open', (id) => {
      this.peerId = id;
      if (isHost) {
        const dbRef = firebase.database().ref('rooms/' + this.peerId);
        dbRef.set({ name: this.roomName, hasPass: !!this.hostPass, status: 'waiting' });
        dbRef.onDisconnect().remove();
        this.st = 'host_lobby';
        this.peer.on('connection', (c) => { this.conn = c; this.setupConn(); });
      } else {
        this.joinRoom();
      }
    });
  },

  joinRoom() {
    this.msg = 'CONNECTING TO ROOM...'; this.st = 'connecting';
    this.conn = this.peer.connect(this.targetId);
    this.setupConn();
  },

  setupConn() {
    this.conn.on('open', () => { if (this.role === 'guest') this.conn.send({ type: 'auth', pass: this.myPass }); });
    this.conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;
      // 未認証ピアからのゲーム操作は無視（パスワード保護の迂回防止）
      if (this.role === 'host' && !this.guestJoined && data.type !== 'auth') return;
      if (data.type === 'surrender') {
         this.state.msg = 'OPPONENT SURRENDERED!';
         if (this.role === 'host') this.state.guestHand = []; else this.state.hostHand = [];
         this.state.effects.global.revolution = false; 
         this.checkWinOrShuffle();
         if (this.role === 'host') this.syncState();
         return;
      }
      if (data.type === 'result_choice') {
         this.opChoice = data.choice; this.checkResultAction(); return;
      }
      
      if (this.role === 'host' && data.type === 'auth') {
        if (this.hostPass === '' || this.hostPass === data.pass) { this.guestJoined = true; playSnd('combo'); this.conn.send({ type: 'auth_ok' }); } 
        else { this.conn.send({ type: 'auth_fail' }); setTimeout(() => this.conn.close(), 500); }
      }
      if (this.role === 'host' && data.type === 'action') this.processAction(data.action, 'guest'); 
      
      if (this.role === 'guest') {
        if (data.type === 'auth_ok') { this.st = 'guest_lobby'; playSnd('sel'); }
        if (data.type === 'auth_fail') { this.st = 'error'; this.msg = 'PASSWORD INCORRECT!'; playSnd('hit'); }
        if (data.type === 'start_game') { this.st = 'play'; this.cursor = 0; playSnd('jmp'); }
        if (data.type === 'sync') { this.state = data.state; this.adjustCursor(); }
      }
    });
    this.conn.on('close', () => { 
      if (this.st === 'play' && this.isResult) {
         this.opChoice = 'title'; this.checkResultAction(); 
      } else {
         this.st = 'error'; this.msg = 'CONNECTION LOST...'; playSnd('hit'); this.guestJoined = false; 
      }
    });
  },

  syncState() { if (this.conn && this.conn.open) this.conn.send({ type: 'sync', state: this.state }); },

  startBotMatch() { this.isBot = true; this.role = 'host'; this.st = 'play'; this.cursor = 0; this.initGame(); playSnd('jmp'); },

  initGame() {
    let deck = [0]; 
    for(let i=1; i<=10; i++) deck.push(i, i);
    deck.sort(() => Math.random() - 0.5); 
    
    this.state.hostHand = deck.slice(0, 11).map((v, i) => ({v: v, id: 'h'+i}));
    this.state.guestHand = deck.slice(11, 21).map((v, i) => ({v: v, id: 'g'+i}));
    
    const getSkills = () => { let s = []; while(s.length < 2) { let r = Math.floor(Math.random() * 10) + 1; if(!s.includes(r)) s.push(r); } return s; };
    this.state.skills.host = getSkills(); this.state.skills.guest = getSkills();
    
    this.state.effects = { host: { shield: false, oracle: false, gravity: false, haste: 0 }, guest: { shield: false, oracle: false, gravity: false, haste: 0 }, global: { revolution: false } };
    this.state.turn = 'host'; this.state.nextTurn = ''; this.state.msg = 'GAME START!';
    this.state.wait = 60; this.state.shuffleTriggered = false; this.state.activeSkill = 0; this.state.pendingSkill = 0;
    
    this.isResult = false; this.myChoice = ''; this.opChoice = '';
    this.removePairs(); this.syncState();
  },

  removePairs() {
    const removeDuplicate = (hand) => {
      let result = [], seen = {}, toRemove = {};
      hand.forEach(c => { if(c.v === 0) return; if(seen[c.v]) { toRemove[c.v] = true; delete seen[c.v]; } else seen[c.v] = true; });
      hand.forEach(c => { if(c.v === 0 || (!toRemove[c.v] && seen[c.v])) result.push(c); });
      return result;
    };
    let oldHLen = this.state.hostHand.length, oldGLen = this.state.guestHand.length;
    this.state.hostHand = removeDuplicate(this.state.hostHand); this.state.guestHand = removeDuplicate(this.state.guestHand);
    let matched = (oldHLen !== this.state.hostHand.length || oldGLen !== this.state.guestHand.length);
    if(matched) playSnd('combo');
    return matched;
  },

  processAction(actionData, playerRole) {
    if (this.state.wait > 0 || this.state.turn !== playerRole) return;
    let opRole = playerRole === 'host' ? 'guest' : 'host';
    let myHand = this.state[playerRole + 'Hand'], opHand = this.state[opRole + 'Hand'];

    if (actionData.type === 'draw') {
      if (actionData.idx >= opHand.length) actionData.idx = Math.max(0, opHand.length - 1);
      if (this.state.effects[playerRole].gravity && opHand[actionData.idx].v === 0) {
        this.state.msg = 'GRAVITY: CANNOT DRAW!'; this.state.wait = 60; this.state.nextTurn = opRole; playSnd('hit'); this.syncState(); return;
      }
      myHand.push(opHand.splice(actionData.idx, 1)[0]); playSnd('sel');
      this.state.activeSkill = 0; 
      let matched = this.removePairs();
      this.state.msg = matched ? 'PAIR MATCHED!' : 'CARD DRAWN!'; this.state.wait = 60; 

      if (!this.checkWinOrShuffle()) {
         if (this.state.effects[playerRole].haste > 0) { this.state.effects[playerRole].haste--; this.state.msg = 'HASTE: DRAW AGAIN!'; } 
         else { this.state.nextTurn = opRole; }
      }
      this.syncState();
    }
    else if (actionData.type === 'skill') {
      let skillId = actionData.skillId;
      this.state.skills[playerRole].splice(this.state.skills[playerRole].indexOf(skillId), 1);
      this.state.msg = `SKILL: ${S_NAMES[skillId]}!`; this.state.wait = 90; playSnd('jmp');
      // Skill flash: color based on skill type
      const skillColors = { 1:'#0ff', 2:'#f0f', 3:'#0f0', 4:'#888', 5:'#ff0', 6:'#0ff', 7:'#84f', 8:'#0f0', 9:'#ff0', 10:'#f0f' };
      this.skillFlash = 2; this.skillFlashColor = skillColors[skillId] || '#fff';

      if (skillId === 1) { this.state.activeSkill = 1; }
      else if (skillId === 2) { let t = this.state.hostHand; this.state.hostHand = this.state.guestHand; this.state.guestHand = t; }
      else if (skillId === 3) { this.state.pendingSkill = 3; this.state.msg = 'CHOOSE OWN CARD!'; this.state.wait = 0; }
      else if (skillId === 4) { this.state[opRole+'Hand'].sort(() => Math.random() - 0.5); }
      else if (skillId === 5) { this.state.effects[playerRole].shield = true; }
      else if (skillId === 6) { this.state.effects[playerRole].oracle = true; }
      else if (skillId === 7) { this.state.effects[playerRole].gravity = true; }
      else if (skillId === 8) {
        let n = myHand.map((c, i) => ({c, i})).filter(x => x.c.v !== 0);
        if(n.length > 0) myHand.splice(n[Math.floor(Math.random() * n.length)].i, 1);
      }
      else if (skillId === 9) { this.state.effects[playerRole].haste = 1; }
      else if (skillId === 10) { this.state.effects.global.revolution = true; }
      
      if (skillId !== 3) { this.removePairs(); this.checkWinOrShuffle(); }
      this.syncState();
    }
    else if (actionData.type === 'give') {
      let card = myHand.splice(actionData.idx, 1)[0];
      opHand.push(card); opHand.sort(() => Math.random() - 0.5); 
      this.state.pendingSkill = 0; this.state.msg = 'CARD GIVEN!'; this.state.wait = 60; playSnd('sel');
      this.removePairs(); if(!this.checkWinOrShuffle()) this.state.nextTurn = opRole;
      this.syncState();
    }
  },

  checkWinOrShuffle() {
    let hLen = this.state.hostHand.length, gLen = this.state.guestHand.length;
    let rev = this.state.effects.global.revolution;

    if (hLen === 0 || gLen === 0) {
      if (!this.state.msg.includes('SURRENDER')) {
         if (rev) this.state.msg = hLen === 0 ? 'GUEST WINS(REV)!!' : 'HOST WINS(REV)!!';
         else this.state.msg = hLen === 0 ? 'HOST WINS!!' : 'GUEST WINS!!';
      }
      this.state.wait = 9999; 
      
      this.isResult = true; this.resultCursor = 0; this.myChoice = '';
      this.opChoice = this.isBot ? 'rematch' : '';
      // Determine win/lose for result screen effects
      let winMsg = this.state.msg;
      if (this.role === 'host') this.resultWin = winMsg.includes('HOST WINS') && !winMsg.includes('GUEST WINS');
      else this.resultWin = winMsg.includes('GUEST WINS') && !winMsg.includes('HOST WINS');
      if (winMsg.includes('SURRENDER')) this.resultWin = true;
      this.resultOverlay = 0;
      playSnd('combo'); return true;
    }
    if (!this.state.shuffleTriggered && (hLen === 3 || gLen === 3)) {
      this.state.shuffleTriggered = true; this.state.msg = '⚠️ CHAOS SHUFFLE ⚠️'; this.state.wait = 180; playSnd('hit'); return true;
    }
    return false;
  },

  checkResultAction() {
    if (this.myChoice === 'title' || this.opChoice === 'title') {
      if (this.myChoice === 'title') { this.leaveGame(); } 
      else { this.st = 'error'; this.msg = 'OPPONENT LEFT TO TITLE.'; playSnd('hit'); }
      return;
    }
    if (this.myChoice === '') return;

    if (this.myChoice === 'rematch' && this.opChoice === 'rematch') {
      this.isResult = false; this.myChoice = ''; this.opChoice = '';
      if (this.role === 'host') this.initGame();
      return;
    }

    if (this.opChoice !== '' && (this.myChoice === 'lobby' || this.opChoice === 'lobby')) {
      this.isResult = false; this.myChoice = ''; this.opChoice = '';
      this.st = this.role === 'host' ? 'host_lobby' : 'guest_lobby';
      if (this.role === 'host' && this.peerId) {
        firebase.database().ref('rooms/' + this.peerId).update({ status: 'waiting' });
      }
      playSnd('jmp'); return;
    }
  },

  handleLogicUpdate() {
    if (this.role !== 'host') return; 
    
    if (this.state.wait > 0 && !this.isResult) {
      this.state.wait--;
      if (this.state.wait === 0) {
        if (this.state.msg === '⚠️ CHAOS SHUFFLE ⚠️') {
          let allCards = this.state.hostHand.concat(this.state.guestHand); allCards.sort(() => Math.random() - 0.5);
          let half = Math.ceil(allCards.length / 2);
          this.state.hostHand = allCards.slice(0, half); this.state.guestHand = allCards.slice(half);
          this.state.msg = 'CARDS SHUFFLED!'; this.state.wait = 60; this.state.nextTurn = this.state.turn === 'host' ? 'guest' : 'host';
          this.removePairs(); this.syncState();
        } 
        else if (this.state.nextTurn !== '') {
          let next = this.state.nextTurn; let opRole = next === 'host' ? 'guest' : 'host';
          this.state.nextTurn = '';
          if (this.state.effects[opRole].shield) {
             this.state.effects[opRole].shield = false; this.state.msg = 'BLOCKED BY SHIELD!'; this.state.wait = 60; this.state.nextTurn = opRole;
          } else {
             this.state.turn = next; this.state.msg = next === 'host' ? 'HOST TURN' : 'GUEST TURN';
             this.state.activeSkill = 0; this.state.effects[next].oracle = false; this.state.effects[next].gravity = false;
          }
          this.syncState();
        } else {
          if (!this.state.msg.includes('WINS')) this.state.msg = this.state.turn === 'host' ? 'HOST TURN' : 'GUEST TURN';
          this.syncState();
        }
      }
    }
    
    if (this.isBot && this.state.turn === 'guest' && this.state.wait === 0 && !this.isResult) {
      if (this.state.pendingSkill === 3 && this.state.guestHand.length > 0) {
         this.processAction({ type: 'give', idx: Math.floor(Math.random() * this.state.guestHand.length) }, 'guest');
      } else {
        this.botTimer = (this.botTimer || 0) - 1;
        if (this.botTimer <= 0) {
          let mySkills = this.state.skills.guest;
          if (mySkills.length > 0 && Math.random() < 0.3) this.processAction({ type: 'skill', skillId: mySkills[0] }, 'guest');
          else if (this.state.hostHand.length > 0) this.processAction({ type: 'draw', idx: Math.floor(Math.random() * this.state.hostHand.length) }, 'guest');
          this.botTimer = 40;
        }
      }
    }
  },

  adjustCursor() {
    let len = this.state.pendingSkill === 3 ? (this.role === 'host' ? this.state.hostHand.length : this.state.guestHand.length) 
                                            : (this.role === 'host' ? this.state.guestHand.length : this.state.hostHand.length);
    if (this.cursor >= len) this.cursor = Math.max(0, len - 1);
  },

  update() {
    // Decrement flash/overlay timers
    if (this.skillFlash > 0) this.skillFlash--;
    if (this.isResult && this.resultOverlay < 60) this.resultOverlay++;

    if (keysDown.select && !this.confirmLeave) {
      keysDown.select = false;
      if (this.st === 'play' && !this.isResult) {
        this.confirmLeave = true; playSnd('sel');
      } else {
        this.leaveGame();
      }
      return; 
    }

    if (this.confirmLeave) {
      if (keysDown.a) {
        keysDown.a = false; this.confirmLeave = false;
        if (this.conn) this.conn.send({ type: 'surrender' }); 
        this.leaveGame(); 
      } else if (keysDown.b) {
        keysDown.b = false; this.confirmLeave = false; playSnd('sel');
      }
      return;
    }

    if (this.st === 'menu') {
      if (keysDown.down) { this.cursor = (this.cursor + 1) % 3; playSnd('sel'); }
      if (keysDown.up) { this.cursor = (this.cursor - 1 + 3) % 3; playSnd('sel'); }
      if (keysDown.a) {
        keysDown.a = false;
        if (this.cursor === 0) { let name = prompt("部屋名を入力", "ジョーカールーム"); if (name !== null) { let pass = prompt("パスワード", ""); if (pass !== null) { this.roomName = name; this.hostPass = pass; this.startPeer(true); } } }
        else if (this.cursor === 1) { this.st = 'lobby_list'; this.roomCursor = 0; playSnd('jmp'); firebase.database().ref('rooms').on('value', (snap) => { let rooms = []; snap.forEach(child => { if (child.val().status === 'waiting') rooms.push({ id: child.key, ...child.val() }); }); this.roomList = rooms; }); }
        else if (this.cursor === 2) { this.startBotMatch(); }
      }
    }
    else if (this.st === 'lobby_list') {
      if (keysDown.b) { firebase.database().ref('rooms').off(); this.st = 'menu'; playSnd('hit'); return; }
      if (this.roomList.length > 0) {
        if (keysDown.down) { this.roomCursor = (this.roomCursor + 1) % this.roomList.length; playSnd('sel'); }
        if (keysDown.up) { this.roomCursor = (this.roomCursor - 1 + this.roomList.length) % this.roomList.length; playSnd('sel'); }
        if (keysDown.a) { keysDown.a = false; let rm = this.roomList[this.roomCursor]; let p = ''; if (rm.hasPass) { p = prompt(`パスワード：`, ""); if (p === null) return; } firebase.database().ref('rooms').off(); this.targetId = rm.id; this.myPass = p; this.startPeer(false); }
      }
    }
    else if (this.st === 'host_lobby') { if (this.guestJoined && keysDown.a) { firebase.database().ref('rooms/' + this.peerId).update({ status: 'playing' }); this.conn.send({ type: 'start_game' }); this.st = 'play'; this.cursor = 0; this.initGame(); playSnd('jmp'); } }
    else if (this.st === 'play') {
      this.handleLogicUpdate(); 
      
      if (this.isResult) {
        if (this.myChoice === '') {
          // ★ BOT戦の場合は選択肢を2つにする（rematch と title）
          const choices = this.isBot ? ['rematch', 'title'] : ['rematch', 'lobby', 'title'];
          if (keysDown.down) { this.resultCursor = (this.resultCursor + 1) % choices.length; playSnd('sel'); }
          if (keysDown.up) { this.resultCursor = (this.resultCursor - 1 + choices.length) % choices.length; playSnd('sel'); }
          if (keysDown.a) {
            keysDown.a = false; playSnd('sel');
            this.myChoice = choices[this.resultCursor];
            if (this.conn) this.conn.send({ type: 'result_choice', choice: this.myChoice });
            this.checkResultAction();
          }
        }
        return; 
      }

      let myHand = this.role === 'host' ? this.state.hostHand : this.state.guestHand;
      let opLen = this.role === 'host' ? this.state.guestHand.length : this.state.hostHand.length;
      let mySkills = this.state.skills[this.role];

      if (this.isSkillMenu) {
        if (keysDown.b) { this.isSkillMenu = false; keysDown.b = false; playSnd('sel'); return; }
        if (keysDown.right && mySkills.length > 1) { this.skillCursor = 1; playSnd('sel'); }
        if (keysDown.left && mySkills.length > 1) { this.skillCursor = 0; playSnd('sel'); }
        if (keysDown.a && mySkills.length > 0) {
          keysDown.a = false; this.isSkillMenu = false;
          if (this.role === 'host') this.processAction({ type: 'skill', skillId: mySkills[this.skillCursor] }, 'host');
          else if (this.conn) this.conn.send({ type: 'action', action: { type: 'skill', skillId: mySkills[this.skillCursor] } });
        }
        return;
      }

      if (this.state.turn === this.role && this.state.wait === 0) {
        if (this.state.pendingSkill === 3) {
           if (keysDown.right) { this.cursor = (this.cursor + 1) % myHand.length; playSnd('sel'); }
           if (keysDown.left) { this.cursor = (this.cursor - 1 + myHand.length) % myHand.length; playSnd('sel'); }
           if (keysDown.a) {
             keysDown.a = false;
             if (this.role === 'host') this.processAction({ type: 'give', idx: this.cursor }, 'host');
             else if (this.conn) this.conn.send({ type: 'action', action: { type: 'give', idx: this.cursor } });
           }
           return;
        }

        if (keysDown.b && mySkills.length > 0) { this.isSkillMenu = true; this.skillCursor = 0; keysDown.b = false; playSnd('jmp'); return; }
        if (keysDown.right) { this.cursor = (this.cursor + 1) % opLen; playSnd('sel'); }
        if (keysDown.left) { this.cursor = (this.cursor - 1 + opLen) % opLen; playSnd('sel'); }
        if (keysDown.a && opLen > 0) {
          keysDown.a = false;
          if (this.role === 'host') this.processAction({ type: 'draw', idx: this.cursor }, 'host');
          else if (this.conn) this.conn.send({ type: 'action', action: { type: 'draw', idx: this.cursor } });
        }
      }
    }
  },

  draw() {
    ctx.fillStyle = '#012'; ctx.fillRect(0, 0, 200, 300);

    if (this.st === 'play') {
      let myHand = this.role === 'host' ? this.state.hostHand : this.state.guestHand;
      let opHand = this.role === 'host' ? this.state.guestHand : this.state.hostHand;

      // Turn indicator: current player area gets green glow, opponent gets red glow
      let myTurn = this.state.turn === this.role;
      ctx.shadowBlur = 12;
      // My area border
      ctx.strokeStyle = myTurn ? '#0f0' : '#f00';
      ctx.shadowColor = myTurn ? '#0f0' : '#f00';
      ctx.lineWidth = 2; ctx.strokeRect(2, 180, 196, 60); ctx.lineWidth = 1;
      // Opponent area border
      ctx.strokeStyle = myTurn ? '#f00' : '#0f0';
      ctx.shadowColor = myTurn ? '#f00' : '#0f0';
      ctx.lineWidth = 2; ctx.strokeRect(2, 10, 196, 55); ctx.lineWidth = 1;
      ctx.shadowBlur = 0;

      if (this.state.effects.global.revolution) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 10px monospace'; ctx.fillText('REVOLUTION ACTIVE!', 40, 100); }

      // Opponent cards - high quality design
      let opTargetStartX = 100 - (opHand.length * 15) / 2;
      for (let i = 0; i < opHand.length; i++) {
        // Lerp card positions for slide animation
        let tX = opTargetStartX + i * 15, tY = 20;
        if (!this.opCardPositions[i]) this.opCardPositions[i] = { x: tX, y: tY };
        this.opCardPositions[i].x += (tX - this.opCardPositions[i].x) * 0.2;
        this.opCardPositions[i].y += (tY - this.opCardPositions[i].y) * 0.2;
        let x = this.opCardPositions[i].x, y = this.opCardPositions[i].y;

        let isSelected = this.state.turn === this.role && this.cursor === i && !this.isSkillMenu && this.state.pendingSkill !== 3 && this.state.wait === 0 && !this.isResult;
        if (isSelected) y -= 6; // hover: card floats up

        ctx.save();

        // Cyan glow for selected card
        if (isSelected) {
            ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
        }

        // Card back: dark gradient background
        let r = 3;
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+25-r,y);
        ctx.arcTo(x+25,y,x+25,y+r,r); ctx.lineTo(x+25,y+35-r);
        ctx.arcTo(x+25,y+35,x+25-r,y+35,r); ctx.lineTo(x+r,y+35);
        ctx.arcTo(x,y+35,x,y+35-r,r); ctx.lineTo(x,y+r);
        ctx.arcTo(x,y,x+r,y,r); ctx.closePath();

        // Card back gradient (blue-based grid pattern)
        let cardGrad = ctx.createLinearGradient(x, y, x, y+35);
        cardGrad.addColorStop(0, '#1a2a6c');
        cardGrad.addColorStop(1, '#0d1a44');
        ctx.fillStyle = cardGrad; ctx.fill();

        // Grid pattern on card back
        ctx.save();
        ctx.clip(); // clip to card shape
        ctx.strokeStyle = 'rgba(100,150,255,0.25)'; ctx.lineWidth = 1;
        for (let gx = x; gx < x+25; gx += 5) {
            ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y+35); ctx.stroke();
        }
        for (let gy = y; gy < y+35; gy += 5) {
            ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x+25, gy); ctx.stroke();
        }
        // Gloss highlight top edge
        ctx.fillStyle = 'rgba(200,220,255,0.18)';
        ctx.fillRect(x+1, y+1, 23, 8);
        ctx.restore();

        // 2px black border
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+25-r,y);
        ctx.arcTo(x+25,y,x+25,y+r,r); ctx.lineTo(x+25,y+35-r);
        ctx.arcTo(x+25,y+35,x+25-r,y+35,r); ctx.lineTo(x+r,y+35);
        ctx.arcTo(x,y+35,x,y+35-r,r); ctx.lineTo(x,y+r);
        ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); ctx.stroke();

        // 1px inner highlight
        ctx.strokeStyle = isSelected ? '#0ff' : 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x+r+1,y+1); ctx.lineTo(x+25-r-1,y+1);
        ctx.arcTo(x+24,y+1,x+24,y+r+1,r-1); ctx.lineTo(x+24,y+35-r-1);
        ctx.arcTo(x+24,y+34,x+25-r-1,y+34,r-1); ctx.lineTo(x+r+1,y+34);
        ctx.arcTo(x+1,y+34,x+1,y+35-r-1,r-1); ctx.lineTo(x+1,y+r+1);
        ctx.arcTo(x+1,y+1,x+r+1,y+1,r-1); ctx.closePath(); ctx.stroke();

        ctx.shadowBlur = 0;

        // Suit symbol on back
        let suits = ['♠','♥','♦','♣']; let suit = suits[i % 4];
        ctx.fillStyle = 'rgba(150,180,255,0.35)'; ctx.font = '8px monospace';
        ctx.fillText(suit, x+8, y+14);

        ctx.restore();

        if (this.state.activeSkill === 1 && opHand[i].v === 0) { ctx.fillStyle = '#f00'; ctx.fillRect(x+2, y+2, 21, 31); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('J', x+8, y+20); }
        if (isSelected) {
          if (this.state.effects[this.role].oracle) {
             let isMatch = myHand.some(c => c.v === opHand[i].v && opHand[i].v !== 0);
             ctx.fillStyle = isMatch ? '#0f0' : '#f00'; ctx.font = 'bold 16px monospace'; ctx.fillText(isMatch ? 'O' : 'X', x + 8, y - 10);
          }
        }
      }

      if (this.state.shuffleTriggered && this.state.wait > 0 && this.state.msg === '⚠️ CHAOS SHUFFLE ⚠️') {
        if (Math.floor(this.state.wait / 20) % 2 === 0) { ctx.fillStyle = 'rgba(200, 0, 0, 0.4)'; ctx.fillRect(0,0,200,300); }
      }
      ctx.fillStyle = this.state.turn === this.role ? '#0f0' : '#f00'; ctx.font = '12px monospace';
      ctx.fillText(this.state.msg, 100 - (this.state.msg.length*3.5), 140);

      let myTargetStartX = 100 - (myHand.length * 15) / 2;
      for (let i = 0; i < myHand.length; i++) {
        let tX = myTargetStartX + i * 15, tY = 200;
        if (!this.cardPositions[i]) this.cardPositions[i] = { x: tX, y: tY };
        this.cardPositions[i].x += (tX - this.cardPositions[i].x) * 0.2;
        this.cardPositions[i].y += (tY - this.cardPositions[i].y) * 0.2;
        let x = this.cardPositions[i].x, y = this.cardPositions[i].y;

        let isGiveSelected = this.state.turn === this.role && this.cursor === i && this.state.pendingSkill === 3 && this.state.wait === 0 && !this.isResult;
        if (isGiveSelected) y -= 5;

        // Draw high quality face-up card (my hand)
        let r = 3;
        ctx.save();
        if (isGiveSelected) {
            ctx.shadowBlur = 10; ctx.shadowColor = '#0ff';
        }

        // Card face gradient
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+25-r,y);
        ctx.arcTo(x+25,y,x+25,y+r,r); ctx.lineTo(x+25,y+35-r);
        ctx.arcTo(x+25,y+35,x+25-r,y+35,r); ctx.lineTo(x+r,y+35);
        ctx.arcTo(x,y+35,x,y+35-r,r); ctx.lineTo(x,y+r);
        ctx.arcTo(x,y,x+r,y,r); ctx.closePath();

        let faceGrad = ctx.createLinearGradient(x, y, x, y+35);
        if (myHand[i].v === 0) {
            faceGrad.addColorStop(0, '#fff0f0');
            faceGrad.addColorStop(1, '#ffe0e0');
        } else {
            faceGrad.addColorStop(0, '#ffffff');
            faceGrad.addColorStop(1, '#e8e8f4');
        }
        ctx.fillStyle = faceGrad; ctx.fill();

        // Gloss on face card
        ctx.save(); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x+1, y+1, 23, 9);
        ctx.restore();

        // 2px black border
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+25-r,y);
        ctx.arcTo(x+25,y,x+25,y+r,r); ctx.lineTo(x+25,y+35-r);
        ctx.arcTo(x+25,y+35,x+25-r,y+35,r); ctx.lineTo(x+r,y+35);
        ctx.arcTo(x,y+35,x,y+35-r,r); ctx.lineTo(x,y+r);
        ctx.arcTo(x,y,x+r,y,r); ctx.closePath(); ctx.stroke();

        // 1px inner highlight
        ctx.strokeStyle = isGiveSelected ? '#0ff' : 'rgba(200,200,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x+r+1,y+1); ctx.lineTo(x+25-r-1,y+1);
        ctx.arcTo(x+24,y+1,x+24,y+r+1,r-1); ctx.lineTo(x+24,y+35-r-1);
        ctx.arcTo(x+24,y+34,x+25-r-1,y+34,r-1); ctx.lineTo(x+r+1,y+34);
        ctx.arcTo(x+1,y+34,x+1,y+35-r-1,r-1); ctx.lineTo(x+1,y+r+1);
        ctx.arcTo(x+1,y+1,x+r+1,y+1,r-1); ctx.closePath(); ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.restore();

        // Suit symbol (top-left, small)
        let suits = ['♠','♥','♦','♣']; let cardSuit = suits[i % 4];
        let isJoker = myHand[i].v === 0;
        let suitColor = (cardSuit === '♥' || cardSuit === '♦') ? '#cc0000' : '#000';
        ctx.fillStyle = isJoker ? '#cc0000' : suitColor;
        ctx.font = '7px monospace'; ctx.fillText(cardSuit, x+2, y+10);
        // Big center number with shadow
        ctx.save();
        ctx.shadowBlur = 2; ctx.shadowColor = 'rgba(0,0,0,0.25)';
        ctx.fillStyle = isJoker ? '#f00' : '#000'; ctx.font = 'bold 14px monospace';
        ctx.fillText(isJoker ? 'J' : myHand[i].v, x + 6, y + 24);
        // Bottom-right mirrored suit (small)
        ctx.fillStyle = isJoker ? '#cc0000' : suitColor;
        ctx.font = '7px monospace'; ctx.fillText(cardSuit, x+16, y+33);
        ctx.restore();
      }

      let mySkills = this.state.skills[this.role];
      ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
      if (mySkills.length > 0) { ctx.fillText(`[B] SKILLS: ${mySkills.length}`, 10, 280); }
      else { ctx.fillStyle = '#555'; ctx.fillText('NO SKILLS', 10, 280); }

      if (this.isSkillMenu) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(15, 160, 170, 60); ctx.strokeStyle = '#0ff'; ctx.strokeRect(15, 160, 170, 60);
        ctx.fillStyle = '#ff0'; ctx.fillText('SELECT SKILL (A:発動 B:戻る)', 20, 175);
        mySkills.forEach((sId, idx) => {
          ctx.fillStyle = this.skillCursor === idx ? '#0f0' : '#fff'; ctx.fillText((this.skillCursor===idx?'>':' ') + S_NAMES[sId], 25 + idx*70, 200);
        });
      }

      if (this.confirmLeave) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(15, 100, 170, 70);
        ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(15, 100, 170, 70); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('SURRENDER & LEAVE?', 30, 125);
        ctx.fillStyle = '#0f0'; ctx.fillText('A: YES(LOSE)  B: NO', 25, 150);
      }
      else if (this.isResult) {
        // Result screen: winning shows gold particle burst, losing shows red overlay fade
        if (this.resultWin) {
          // Gold particle burst using addParticle if available
          if (typeof addParticle === 'function' && Math.random() < 0.3) {
            addParticle(Math.random() * 200, Math.random() * 300, '#ff0', 'star');
          }
        } else {
          // Red overlay fade
          let alpha = Math.min(0.4, this.resultOverlay / 60 * 0.4);
          ctx.fillStyle = `rgba(200,0,0,${alpha})`; ctx.fillRect(0, 0, 200, 300);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(15, 80, 170, 110);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(15, 80, 170, 110); ctx.lineWidth = 1;
        ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('=== MATCH END ===', 35, 100);

        if (this.myChoice === '') {
          // ★ BOT戦の場合は選択肢を2つにして描画する
          const opts = this.isBot ? ['もう一度遊ぶ', 'タイトルに戻る'] : ['もう一度遊ぶ', 'ロビーに戻る', 'タイトルに戻る'];
          opts.forEach((opt, idx) => {
            ctx.fillStyle = this.resultCursor === idx ? '#0f0' : '#fff';
            ctx.fillText((this.resultCursor===idx?'>':' ') + opt, 25, 130 + idx * 25);
          });
        } else {
          ctx.fillStyle = '#fff'; ctx.fillText('WAITING RIVAL...', 35, 140);
        }
      }

      // Skill flash: 2-frame color overlay when skill activates
      if (this.skillFlash > 0) {
        let c = this.skillFlashColor;
        ctx.fillStyle = c.startsWith('rgba') ? c : c + '44';
        ctx.globalAlpha = this.skillFlash / 2 * 0.5;
        ctx.fillRect(0, 0, 200, 300);
        ctx.globalAlpha = 1;
      }
    }
    else {
      if (this.st === 'boot') { ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('CONNECTING DATABASE...', 20, 150); }
      else if (this.st === 'menu') {
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('ROYAL JOKER', 55, 40);
        const opts = ['部屋を作る (HOST)', '部屋を探す (GUEST)', 'ひとりで遊ぶ (BOT)'];
        for (let i = 0; i < 3; i++) { ctx.fillStyle = this.cursor === i ? '#0f0' : '#fff'; ctx.font = '11px monospace'; ctx.fillText((this.cursor===i?'> ':'  ') + opts[i], 15, 100 + i*30); }
        ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 決定  SELECT: 戻る', 45, 280);
      }
      else if (this.st === 'lobby_list') {
        ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ROOM LIST】', 45, 30);
        if (this.roomList.length === 0) { ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('待機中の部屋はありません', 15, 80); } 
        else {
          for (let i = 0; i < Math.min(this.roomList.length, 6); i++) {
            let rm = this.roomList[i]; ctx.fillStyle = this.roomCursor === i ? '#ff0' : '#fff'; if(this.roomCursor === i) ctx.fillRect(10, 55 + i*25, 180, 20);
            ctx.fillStyle = this.roomCursor === i ? '#000' : '#fff'; ctx.font = '11px monospace'; ctx.fillText(`${rm.hasPass ? '🔒' : '　'} ${rm.name.slice(0, 10)}`, 15, 70 + i*25);
          }
        }
        ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 入室  B: 戻る', 55, 280);
      }
      else if (this.st === 'host_lobby') {
        ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ROOM LOBBY】', 45, 50); ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`ROOM : ${this.roomName.slice(0, 10)}`, 20, 90);
        ctx.strokeStyle = '#555'; ctx.strokeRect(10, 140, 180, 80);
        if (this.guestJoined) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('★ RIVAL JOINED! ★', 35, 170); ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 35, 195); } 
        else { ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('WAITING FOR RIVAL...', 40, 180); }
      }
      else if (this.st === 'guest_lobby') { ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【WAITING HOST】', 40, 150); }
      else if (this.st === 'connecting' || this.st === 'error') {
        ctx.fillStyle = this.st === 'error' ? '#f00' : '#0f0'; ctx.font = '10px monospace'; let lines = this.msg.split('\n'); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 10, 140 + i*15);
        if (this.st === 'error') { ctx.fillStyle = '#fff'; ctx.fillText('SELECT TO RETURN', 45, 250); }
      }
    }
  }
};
