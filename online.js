// === ONLINE BATTLE - ROYAL JOKER (Phase 6: Result & Surrender) ===
const S_NAMES = ["", "1:透視", "2:交換", "3:贈物", "4:目隠し", "5:鉄壁", "6:予言", "7:重力", "8:慈悲", "9:加速", "10:革命"];

const Online = {
  st: 'boot', role: '', peer: null, conn: null, peerId: '', targetId: '', msg: 'LOADING NETWORK...',
  cursor: 0, hostPass: '', myPass: '', guestJoined: false, isBot: false, botTimer: 0,
  roomName: '', roomList: [], roomCursor: 0,
  isSkillMenu: false, skillCursor: 0,
  confirmLeave: false, isResult: false, resultCursor: 0, myChoice: '', opChoice: '',
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
    const myId = 'RJ_' + Math.floor(1000 + Math.random() * 9000);
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
      // 共通イベント（降参＆リザルト選択）
      if (data.type === 'surrender') {
         this.state.msg = 'OPPONENT SURRENDERED!';
         if (this.role === 'host') this.state.guestHand = []; else this.state.hostHand = [];
         this.state.effects.global.revolution = false; // 降参した方が必ず負けるように
         this.checkWinOrShuffle();
         if (this.role === 'host') this.syncState();
         return;
      }
      if (data.type === 'result_choice') {
         this.opChoice = data.choice; this.checkResultAction(); return;
      }
      
      // ホスト側の受信
      if (this.role === 'host' && data.type === 'auth') {
        if (this.hostPass === '' || this.hostPass === data.pass) { this.guestJoined = true; playSnd('combo'); this.conn.send({ type: 'auth_ok' }); } 
        else { this.conn.send({ type: 'auth_fail' }); setTimeout(() => this.conn.close(), 500); }
      }
      if (this.role === 'host' && data.type === 'action') this.processAction(data.action, 'guest'); 
      
      // ゲスト側の受信
      if (this.role === 'guest') {
        if (data.type === 'auth_ok') { this.st = 'guest_lobby'; playSnd('sel'); }
        if (data.type === 'auth_fail') { this.st = 'error'; this.msg = 'PASSWORD INCORRECT!'; playSnd('hit'); }
        if (data.type === 'start_game') { this.st = 'play'; this.cursor = 0; playSnd('jmp'); }
        if (data.type === 'sync') { this.state = data.state; this.adjustCursor(); }
      }
    });
    this.conn.on('close', () => { 
      if (this.st === 'play' && this.isResult) {
         this.opChoice = 'title'; this.checkResultAction(); // リザルト中に相手が切断した場合
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
      
      // ★ リザルト画面への移行
      this.isResult = true; this.resultCursor = 0; this.myChoice = '';
      this.opChoice = this.isBot ? 'rematch' : ''; // BOT戦は常に「もう一度」を選ばせる
      playSnd('combo'); return true;
    }
    if (!this.state.shuffleTriggered && (hLen === 3 || gLen === 3)) {
      this.state.shuffleTriggered = true; this.state.msg = '⚠️ CHAOS SHUFFLE ⚠️'; this.state.wait = 180; playSnd('hit'); return true;
    }
    return false;
  },

  checkResultAction() {
    // どちらかがTitleを選んだ、または通信が切れた場合
    if (this.myChoice === 'title' || this.opChoice === 'title') {
      if (this.myChoice === 'title') { this.leaveGame(); } 
      else { this.st = 'error'; this.msg = 'OPPONENT LEFT TO TITLE.'; playSnd('hit'); }
      return;
    }
    if (this.myChoice === '') return;

    // 双方が「もう一度遊ぶ」
    if (this.myChoice === 'rematch' && this.opChoice === 'rematch') {
      this.isResult = false; this.myChoice = ''; this.opChoice = '';
      if (this.role === 'host') this.initGame();
      return;
    }

    // どちらかが「ロビー」で、もう一方が「ロビー」か「もう一度」を選んだ場合
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
    // SELECTボタン：即抜けから「降参確認」へ変更
    if (keysDown.select && !this.confirmLeave) {
      keysDown.select = false;
      if (this.st === 'play' && !this.isResult) {
        this.confirmLeave = true; playSnd('sel');
      } else {
        this.leaveGame();
      }
      return; 
    }

    // 降参確認画面の操作
    if (this.confirmLeave) {
      if (keysDown.a) {
        keysDown.a = false; this.confirmLeave = false;
        if (this.conn) this.conn.send({ type: 'surrender' }); // 相手に負けを送信
        this.leaveGame(); // 自分はタイトルへ
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
      
      // ★ リザルト画面の操作
      if (this.isResult) {
        if (this.myChoice === '') {
          if (keysDown.down) { this.resultCursor = (this.resultCursor + 1) % 3; playSnd('sel'); }
          if (keysDown.up) { this.resultCursor = (this.resultCursor - 1 + 3) % 3; playSnd('sel'); }
          if (keysDown.a) {
            keysDown.a = false; playSnd('sel');
            const choices = ['rematch', 'lobby', 'title'];
            this.myChoice = choices[this.resultCursor];
            if (this.conn) this.conn.send({ type: 'result_choice', choice: this.myChoice });
            this.checkResultAction();
          }
        }
        return; // リザルト中は他の操作を無視
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

      if (this.state.effects.global.revolution) { ctx.fillStyle = '#f0f'; ctx.font = 'bold 10px monospace'; ctx.fillText('REVOLUTION ACTIVE!', 40, 100); }

      let startX = 100 - (opHand.length * 15) / 2;
      for (let i = 0; i < opHand.length; i++) {
        let x = startX + i * 15; let y = 20;
        ctx.fillStyle = '#a00'; ctx.fillRect(x, y, 25, 35); ctx.strokeStyle = '#fff'; ctx.strokeRect(x, y, 25, 35);
        if (this.state.activeSkill === 1 && opHand[i].v === 0) { ctx.fillStyle = '#f00'; ctx.fillRect(x+2, y+2, 21, 31); ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('J', x+8, y+20); }
        if (this.state.turn === this.role && this.cursor === i && !this.isSkillMenu && this.state.pendingSkill !== 3 && this.state.wait === 0 && !this.isResult) {
          ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(x-2, y-6, 29, 39); ctx.lineWidth = 1;
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

      startX = 100 - (myHand.length * 15) / 2;
      for (let i = 0; i < myHand.length; i++) {
        let x = startX + i * 15; let y = 200;
        ctx.fillStyle = '#ddd'; ctx.fillRect(x, y, 25, 35); ctx.strokeStyle = '#000'; ctx.strokeRect(x, y, 25, 35);
        ctx.fillStyle = myHand[i].v === 0 ? '#f00' : '#000'; ctx.font = 'bold 14px monospace'; ctx.fillText(myHand[i].v === 0 ? 'J' : myHand[i].v, x + 6, y + 22);
        
        if (this.state.turn === this.role && this.cursor === i && this.state.pendingSkill === 3 && this.state.wait === 0 && !this.isResult) {
           ctx.strokeStyle = '#f0f'; ctx.lineWidth = 2; ctx.strokeRect(x-2, y-2, 29, 39); ctx.lineWidth = 1;
        }
      }

      let mySkills = this.state.skills[this.role];
      ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
      if (mySkills.length > 0) ctx.fillText(`[B] SKILLS: ${mySkills.length}`, 10, 280);
      else ctx.fillStyle = '#555'; ctx.fillText('NO SKILLS', 10, 280);

      if (this.isSkillMenu) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(15, 160, 170, 60); ctx.strokeStyle = '#0ff'; ctx.strokeRect(15, 160, 170, 60);
        ctx.fillStyle = '#ff0'; ctx.fillText('SELECT SKILL (A:発動 B:戻る)', 20, 175);
        mySkills.forEach((sId, idx) => {
          ctx.fillStyle = this.skillCursor === idx ? '#0f0' : '#fff'; ctx.fillText((this.skillCursor===idx?'>':' ') + S_NAMES[sId], 25 + idx*70, 200);
        });
      }

      // ★ 新UI：降参確認画面
      if (this.confirmLeave) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(15, 100, 170, 70);
        ctx.strokeStyle = '#f00'; ctx.lineWidth = 2; ctx.strokeRect(15, 100, 170, 70); ctx.lineWidth = 1;
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('SURRENDER & LEAVE?', 30, 125);
        ctx.fillStyle = '#0f0'; ctx.fillText('A: YES(LOSE)  B: NO', 25, 150);
      }
      // ★ 新UI：リザルト画面
      else if (this.isResult) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(15, 80, 170, 110);
        ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(15, 80, 170, 110); ctx.lineWidth = 1;
        ctx.fillStyle = '#ff0'; ctx.font = '12px monospace'; ctx.fillText('=== MATCH END ===', 35, 100);
        
        if (this.myChoice === '') {
          const opts = ['もう一度遊ぶ', 'ロビーに戻る', 'タイトルに戻る'];
          opts.forEach((opt, idx) => {
            ctx.fillStyle = this.resultCursor === idx ? '#0f0' : '#fff';
            ctx.fillText((this.resultCursor===idx?'>':' ') + opt, 25, 130 + idx * 22);
          });
        } else {
          ctx.fillStyle = '#fff'; ctx.fillText('WAITING RIVAL...', 35, 140);
        }
      }
    }
    else {
      // メニューやエラー画面などは省略せず記載
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
