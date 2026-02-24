// === ONLINE BATTLE - ROYAL JOKER (Phase 4: Old Maid Core) ===
const Online = {
  st: 'boot', role: '', peer: null, conn: null, peerId: '', targetId: '', msg: 'LOADING NETWORK...',
  cursor: 0, hostPass: '', myPass: '', guestJoined: false, isBot: false, botTimer: 0,
  roomName: '', roomList: [], roomCursor: 0,
  isSkillMenu: false, skillCursor: 0,
  state: {
    hostHand: [], guestHand: [],
    skills: { host: [], guest: [] },
    turn: 'host', msg: 'GAME START!', wait: 0,
    shuffleTriggered: false, activeSkill: 0
  },
  
  async init() {
    this.st = 'boot'; this.msg = 'LOADING NETWORK...'; this.role = ''; 
    this.peerId = ''; this.targetId = ''; this.hostPass = ''; this.myPass = ''; 
    this.guestJoined = false; this.isBot = false; this.roomList = []; this.roomCursor = 0;
    this.isSkillMenu = false; this.skillCursor = 0;
    
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

  // --- 通信＆ロビー管理 (Phase 3と同じ) ---
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
    this.conn.on('open', () => {
      if (this.role === 'guest') this.conn.send({ type: 'auth', pass: this.myPass });
    });
    this.conn.on('data', (data) => {
      if (this.role === 'host' && data.type === 'auth') {
        if (this.hostPass === '' || this.hostPass === data.pass) {
          this.guestJoined = true; playSnd('combo'); this.conn.send({ type: 'auth_ok' });
        } else {
          this.conn.send({ type: 'auth_fail' }); setTimeout(() => this.conn.close(), 500);
        }
      }
      if (this.role === 'guest') {
        if (data.type === 'auth_ok') { this.st = 'guest_lobby'; playSnd('sel'); }
        if (data.type === 'auth_fail') { this.st = 'error'; this.msg = 'PASSWORD INCORRECT!'; playSnd('hit'); }
        if (data.type === 'start_game') { this.st = 'play'; this.cursor = 0; playSnd('jmp'); }
        if (data.type === 'sync') { this.state = data.state; this.adjustCursor(); }
      }
      if (this.role === 'host' && data.type === 'action') this.processAction(data.action, 'guest'); 
    });
    this.conn.on('close', () => { 
      this.st = 'error'; this.msg = 'CONNECTION LOST...'; playSnd('hit'); this.guestJoined = false; 
    });
  },

  syncState() { if (this.conn && this.conn.open) this.conn.send({ type: 'sync', state: this.state }); },

  // --- ゲームロジック (ババ抜き専用) ---
  startBotMatch() {
    this.isBot = true; this.role = 'host'; this.st = 'play'; this.cursor = 0;
    this.initGame(); playSnd('jmp');
  },

  initGame() {
    let deck = [0]; // 0 = Joker
    for(let i=1; i<=10; i++) { deck.push(i, i); }
    deck.sort(() => Math.random() - 0.5); 
    
    this.state.hostHand = deck.slice(0, 11).map((v, i) => ({v: v, id: 'h'+i}));
    this.state.guestHand = deck.slice(11, 21).map((v, i) => ({v: v, id: 'g'+i}));
    
    const getSkills = () => {
      let s = []; while(s.length < 2) { let r = Math.floor(Math.random() * 10) + 1; if(!s.includes(r)) s.push(r); }
      return s;
    };
    this.state.skills.host = getSkills();
    this.state.skills.guest = getSkills();
    
    this.state.turn = 'host'; this.state.msg = 'MATCH START!';
    this.state.wait = 30; this.state.shuffleTriggered = false; this.state.activeSkill = 0;
    this.removePairs();
    this.syncState();
  },

  removePairs() {
    const removeDuplicate = (hand) => {
      let result = [], seen = {}, toRemove = {};
      hand.forEach(c => {
        if(c.v === 0) return; // Jokerは消えない
        if(seen[c.v]) { toRemove[c.v] = true; delete seen[c.v]; } else { seen[c.v] = true; }
      });
      hand.forEach(c => { if(c.v === 0 || (!toRemove[c.v] && seen[c.v])) result.push(c); });
      return result;
    };
    let oldHLen = this.state.hostHand.length, oldGLen = this.state.guestHand.length;
    this.state.hostHand = removeDuplicate(this.state.hostHand);
    this.state.guestHand = removeDuplicate(this.state.guestHand);
    if(oldHLen !== this.state.hostHand.length || oldGLen !== this.state.guestHand.length) playSnd('combo');
  },

  processAction(actionData, playerRole) {
    if (this.state.wait > 0) return;

    if (actionData.type === 'draw' && this.state.turn === playerRole) {
      let myHand = playerRole === 'host' ? this.state.hostHand : this.state.guestHand;
      let opHand = playerRole === 'host' ? this.state.guestHand : this.state.hostHand;
      
      let drawnCard = opHand.splice(actionData.idx, 1)[0];
      myHand.push(drawnCard);
      playSnd('sel');
      
      this.state.activeSkill = 0; // スキル効果リセット
      this.removePairs();
      this.checkWinOrShuffle();
      
      if(this.state.wait === 0) {
        this.state.turn = playerRole === 'host' ? 'guest' : 'host';
        this.state.msg = this.state.turn === 'host' ? 'YOUR TURN' : 'RIVAL TURN';
      }
      this.syncState();
    }
    else if (actionData.type === 'skill') {
      let skillId = actionData.skillId;
      // スキルの消費
      let mySkills = this.state.skills[playerRole];
      mySkills.splice(mySkills.indexOf(skillId), 1);
      
      // スキル効果の発動
      if (skillId === 1) { // 透視
        this.state.activeSkill = 1;
        this.state.msg = '★ IMPERIAL EYE! ★';
        playSnd('jmp');
      }
      // ※ここに2〜10のスキル効果を後で追加します
      
      this.syncState();
    }
  },

  checkWinOrShuffle() {
    if (this.state.hostHand.length === 0 || this.state.guestHand.length === 0) {
      this.state.msg = this.state.hostHand.length === 0 ? 'HOST WINS!!' : 'GUEST WINS!!';
      this.state.wait = 9999; playSnd('combo'); return;
    }
    
    if (!this.state.shuffleTriggered && (this.state.hostHand.length === 3 || this.state.guestHand.length === 3)) {
      this.state.shuffleTriggered = true;
      this.state.msg = '⚠️ CHAOS SHUFFLE ⚠️';
      this.state.wait = 120; // 約2秒フラッシュ＆停止
      playSnd('hit');
    }
  },

  handleLogicUpdate() {
    if (this.role !== 'host') return; 
    
    if (this.state.wait > 0) {
      this.state.wait--;
      if (this.state.wait === 0 && this.state.shuffleTriggered && this.state.msg === '⚠️ CHAOS SHUFFLE ⚠️') {
        // カオスシャッフルの発動！
        let allCards = this.state.hostHand.concat(this.state.guestHand);
        allCards.sort(() => Math.random() - 0.5);
        let half = Math.ceil(allCards.length / 2);
        this.state.hostHand = allCards.slice(0, half);
        this.state.guestHand = allCards.slice(half);
        this.state.turn = this.state.turn === 'host' ? 'guest' : 'host';
        this.state.msg = 'CARDS SHUFFLED!';
        playSnd('combo'); this.syncState();
      }
    }
    
    if (this.isBot && this.state.turn === 'guest' && this.state.wait === 0) {
      this.botTimer = (this.botTimer || 0) - 1;
      if (this.botTimer <= 0) {
        if (this.state.hostHand.length > 0) {
          this.processAction({ type: 'draw', idx: Math.floor(Math.random() * this.state.hostHand.length) }, 'guest');
        }
        this.botTimer = 40;
      }
    }
  },

  adjustCursor() {
    let opLen = this.role === 'host' ? this.state.guestHand.length : this.state.hostHand.length;
    if (this.cursor >= opLen) this.cursor = Math.max(0, opLen - 1);
  },

  // --- 入力と描画 ---
  update() {
    if (keysDown.select) { 
      if(this.role === 'host' && this.peerId) firebase.database().ref('rooms/' + this.peerId).remove();
      if(this.peer) this.peer.destroy(); firebase.database().ref('rooms').off(); switchApp(Menu); return; 
    }

    if (this.st === 'menu') {
      if (keysDown.down) { this.cursor = (this.cursor + 1) % 3; playSnd('sel'); }
      if (keysDown.up) { this.cursor = (this.cursor - 1 + 3) % 3; playSnd('sel'); }
      if (keysDown.a) {
        keysDown.a = false;
        if (this.cursor === 0) {
          let name = prompt("部屋の名前を入力してください", "ジョーカールーム");
          if (name !== null) { let pass = prompt("パスワード（空欄でフリー）", ""); if (pass !== null) { this.roomName = name; this.hostPass = pass; this.startPeer(true); } }
        }
        else if (this.cursor === 1) {
          this.st = 'lobby_list'; this.roomCursor = 0; playSnd('jmp');
          firebase.database().ref('rooms').on('value', (snap) => {
            let rooms = []; snap.forEach(child => { if (child.val().status === 'waiting') rooms.push({ id: child.key, ...child.val() }); });
            this.roomList = rooms;
          });
        }
        else if (this.cursor === 2) { this.startBotMatch(); }
      }
    }
    else if (this.st === 'lobby_list') {
      if (keysDown.b) { firebase.database().ref('rooms').off(); this.st = 'menu'; playSnd('hit'); return; }
      if (this.roomList.length > 0) {
        if (keysDown.down) { this.roomCursor = (this.roomCursor + 1) % this.roomList.length; playSnd('sel'); }
        if (keysDown.up) { this.roomCursor = (this.roomCursor - 1 + this.roomList.length) % this.roomList.length; playSnd('sel'); }
        if (keysDown.a) {
          keysDown.a = false; let targetRoom = this.roomList[this.roomCursor]; let pass = '';
          if (targetRoom.hasPass) { pass = prompt(`パスワードを入力：`, ""); if (pass === null) return; }
          firebase.database().ref('rooms').off(); this.targetId = targetRoom.id; this.myPass = pass; this.startPeer(false);
        }
      }
    }
    else if (this.st === 'host_lobby') {
      if (this.guestJoined && keysDown.a) {
        firebase.database().ref('rooms/' + this.peerId).update({ status: 'playing' });
        this.conn.send({ type: 'start_game' }); this.st = 'play'; this.cursor = 0; this.initGame(); playSnd('jmp');
      }
    }
    else if (this.st === 'play') {
      this.handleLogicUpdate(); 
      let opLen = this.role === 'host' ? this.state.guestHand.length : this.state.hostHand.length;
      let mySkills = this.state.skills[this.role];

      // スキルメニュー操作
      if (this.isSkillMenu) {
        if (keysDown.b) { this.isSkillMenu = false; keysDown.b = false; playSnd('sel'); return; }
        if (keysDown.right && mySkills.length > 1) { this.skillCursor = 1; playSnd('sel'); }
        if (keysDown.left && mySkills.length > 1) { this.skillCursor = 0; playSnd('sel'); }
        if (keysDown.a && mySkills.length > 0) {
          keysDown.a = false; this.isSkillMenu = false;
          let sId = mySkills[this.skillCursor];
          if (this.role === 'host') this.processAction({ type: 'skill', skillId: sId }, 'host');
          else if (this.conn) this.conn.send({ type: 'action', action: { type: 'skill', skillId: sId } });
        }
        return;
      }

      // 通常ドロー操作
      if (this.state.turn === this.role && this.state.wait === 0) {
        if (keysDown.b && mySkills.length > 0) { this.isSkillMenu = true; this.skillCursor = 0; keysDown.b = false; playSnd('jmp'); return; }
        if (keysDown.right) { this.cursor = (this.cursor + 1) % opLen; playSnd('sel'); }
        if (keysDown.left) { this.cursor = (this.cursor - 1 + opLen) % opLen; playSnd('sel'); }
        if (keysDown.a) {
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

      // 相手の手札（上部）
      let startX = 100 - (opHand.length * 15) / 2;
      for (let i = 0; i < opHand.length; i++) {
        let x = startX + i * 15; let y = 20;
        ctx.fillStyle = '#a00'; ctx.fillRect(x, y, 25, 35); 
        ctx.strokeStyle = '#fff'; ctx.strokeRect(x, y, 25, 35);
        
        // ★ スキル1：透視（Jokerが赤く光る）
        if (this.state.activeSkill === 1 && opHand[i].v === 0) {
           ctx.fillStyle = '#f00'; ctx.fillRect(x+2, y+2, 21, 31);
           ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText('J', x+8, y+20);
        }
        
        if (this.state.turn === this.role && this.cursor === i && !this.isSkillMenu && this.state.wait === 0) {
          ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(x-2, y-6, 29, 39); ctx.lineWidth = 1;
        }
      }

      // 中央情報
      ctx.fillStyle = this.state.turn === this.role ? '#0f0' : '#f00';
      if (this.state.shuffleTriggered && this.state.wait > 0 && this.state.wait % 10 < 5) {
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,200,300); // カオスフラッシュ！
      }
      ctx.font = '12px monospace';
      ctx.fillText(this.state.msg, 100 - (this.state.msg.length*3.5), 140);

      // 自分の手札（下部）
      startX = 100 - (myHand.length * 15) / 2;
      for (let i = 0; i < myHand.length; i++) {
        let x = startX + i * 15; let y = 200;
        ctx.fillStyle = '#ddd'; ctx.fillRect(x, y, 25, 35); ctx.strokeStyle = '#000'; ctx.strokeRect(x, y, 25, 35);
        ctx.fillStyle = myHand[i].v === 0 ? '#f00' : '#000'; ctx.font = 'bold 14px monospace'; 
        ctx.fillText(myHand[i].v === 0 ? 'J' : myHand[i].v, x + 6, y + 22);
      }

      // スキル表示
      let mySkills = this.state.skills[this.role];
      ctx.fillStyle = '#0ff'; ctx.font = '10px monospace';
      if (mySkills.length > 0) {
        ctx.fillText(`[B] SKILLS: ${mySkills.length}`, 10, 280);
      } else {
        ctx.fillStyle = '#555'; ctx.fillText('NO SKILLS', 10, 280);
      }

      // スキルメニュー展開時
      if (this.isSkillMenu) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(20, 160, 160, 60);
        ctx.strokeStyle = '#0ff'; ctx.strokeRect(20, 160, 160, 60);
        ctx.fillStyle = '#ff0'; ctx.fillText('SELECT SKILL (A:発動 B:戻る)', 25, 175);
        mySkills.forEach((sId, idx) => {
          ctx.fillStyle = this.skillCursor === idx ? '#0f0' : '#fff';
          let sName = sId === 1 ? '1:透視' : `${sId}:????`; // 後で全部名前入れます
          ctx.fillText((this.skillCursor===idx?'>':' ') + sName, 30 + idx*70, 200);
        });
      }
    }
    // メニューやロビー画面の描画はPhase 3のまま（省略せず書いてあります）
    else {
      if (this.st === 'boot') { ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('CONNECTING DATABASE...', 20, 150); }
      else if (this.st === 'menu') {
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('ROYAL JOKER', 55, 40);
        const opts = ['部屋を作る (HOST)', '部屋を探す (GUEST)', 'ひとりで遊ぶ (BOT)'];
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = this.cursor === i ? '#0f0' : '#fff'; ctx.font = '11px monospace'; 
          ctx.fillText((this.cursor===i?'> ':'  ') + opts[i], 15, 100 + i*30);
        }
        ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 決定  SELECT: 戻る', 45, 280);
      }
      else if (this.st === 'lobby_list') {
        ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ROOM LIST】', 45, 30);
        if (this.roomList.length === 0) { ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('現在、待機中の部屋はありません', 15, 80); } 
        else {
          for (let i = 0; i < Math.min(this.roomList.length, 6); i++) {
            let rm = this.roomList[i];
            ctx.fillStyle = this.roomCursor === i ? '#ff0' : '#fff'; if(this.roomCursor === i) ctx.fillRect(10, 55 + i*25, 180, 20);
            ctx.fillStyle = this.roomCursor === i ? '#000' : '#fff'; ctx.font = '11px monospace';
            ctx.fillText(`${rm.hasPass ? '🔒' : '　'} ${rm.name.slice(0, 10)}`, 15, 70 + i*25);
          }
        }
        ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 入室  B: 戻る', 55, 280);
      }
      else if (this.st === 'host_lobby') {
        ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ROOM LOBBY】', 45, 50);
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText(`ROOM : ${this.roomName.slice(0, 10)}`, 20, 90);
        ctx.strokeStyle = '#555'; ctx.strokeRect(10, 140, 180, 80);
        if (this.guestJoined) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('★ RIVAL JOINED! ★', 35, 170); ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 35, 195); } 
        else { ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('WAITING FOR RIVAL...', 40, 180); }
      }
      else if (this.st === 'guest_lobby') { ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【WAITING HOST】', 40, 150); }
      else if (this.st === 'connecting' || this.st === 'error') {
        ctx.fillStyle = this.st === 'error' ? '#f00' : '#0f0'; ctx.font = '10px monospace';
        let lines = this.msg.split('\n'); for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 10, 140 + i*15);
      }
    }
  }
};
