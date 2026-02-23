// === ONLINE BATTLE - ROYAL MEMORY (Phase 2: Lobby & Bot Match) ===
const Online = {
  st: 'boot', role: '', peer: null, conn: null, peerId: '', targetId: '', msg: 'LOADING NETWORK...',
  cursor: 0, hostPass: '', myPass: '', guestJoined: false, isBot: false, botTimer: 0,
  state: {
    brd: [], turn: 'host', sc: { host: 0, guest: 0 },
    skills: { host: [1, 2], guest: [1, 2] }, openIdx: [], wait: 0, msg: 'GAME START!'
  },
  
  init() {
    this.st = 'boot'; this.msg = 'LOADING NETWORK...'; this.role = ''; this.peerId = ''; 
    this.targetId = ''; this.hostPass = ''; this.myPass = ''; this.guestJoined = false; this.isBot = false;
    
    if (!window.Peer) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
      script.onload = () => { this.st = 'menu'; };
      document.head.appendChild(script);
    } else {
      this.st = 'menu';
    }
  },

  // --- 通信＆ロビー管理 ---
  startPeer(isHost) {
    this.role = isHost ? 'host' : 'guest';
    this.st = 'connecting'; this.msg = 'CONNECTING TO SERVER...';
    
    const myId = 'RMB_' + Math.floor(1000 + Math.random() * 9000);
    this.peer = new Peer(myId);
    
    this.peer.on('open', (id) => {
      this.peerId = id.replace('RMB_', '');
      if (isHost) {
        this.st = 'host_lobby';
        this.peer.on('connection', (c) => {
          this.conn = c; this.setupConn();
        });
      } else {
        this.joinRoom();
      }
    });
  },

  joinRoom() {
    this.msg = 'CONNECTING TO ROOM...'; this.st = 'connecting';
    this.conn = this.peer.connect('RMB_' + this.targetId);
    this.setupConn();
  },

  setupConn() {
    this.conn.on('open', () => {
      if (this.role === 'guest') {
        // ゲストは接続できたらパスワードを送信して認証を求める
        this.conn.send({ type: 'auth', pass: this.myPass });
      }
    });
    this.conn.on('data', (data) => {
      // ホスト側の処理：ゲストからの認証パスワードをチェック
      if (this.role === 'host' && data.type === 'auth') {
        if (this.hostPass === '' || this.hostPass === data.pass) {
          this.guestJoined = true; playSnd('combo');
          this.conn.send({ type: 'auth_ok' });
        } else {
          this.conn.send({ type: 'auth_fail' });
          setTimeout(() => this.conn.close(), 500);
        }
      }
      
      // ゲスト側の処理：ホストからの返答を受け取る
      if (this.role === 'guest') {
        if (data.type === 'auth_ok') { this.st = 'guest_lobby'; playSnd('sel'); }
        if (data.type === 'auth_fail') { this.st = 'error'; this.msg = 'PASSWORD INCORRECT!'; playSnd('hit'); }
        if (data.type === 'start_game') { this.st = 'play'; this.cursor = 0; playSnd('jmp'); }
        if (data.type === 'sync') this.state = data.state; 
      }
      
      // ゲームプレイ中のアクション受信
      if (this.role === 'host' && data.type === 'action') {
        this.processAction(data.action, 'guest'); 
      }
    });
    this.conn.on('close', () => { 
      this.st = 'error'; this.msg = 'CONNECTION LOST...'; playSnd('hit');
      this.guestJoined = false; 
    });
  },

  syncState() {
    if (this.conn && this.conn.open) this.conn.send({ type: 'sync', state: this.state });
  },

  // --- ゲームロジック ---
  startBotMatch() {
    this.isBot = true; this.role = 'host'; this.st = 'play'; this.cursor = 0;
    this.initGame(); playSnd('jmp');
  },

  initGame() {
    let deck = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10];
    deck.sort(() => Math.random() - 0.5); 
    this.state.brd = deck.map(val => ({ v: val, st: 'hidden' })); 
    this.state.turn = 'host'; this.state.sc = { host: 0, guest: 0 };
    this.state.openIdx = []; this.state.wait = 0; this.state.msg = 'MATCH START!';
    this.syncState();
  },

  processAction(actionData, playerRole) {
    if (this.state.turn !== playerRole || this.state.wait > 0) return;

    if (actionData.type === 'flip') {
      let idx = actionData.idx;
      if (this.state.brd[idx].st !== 'hidden' || this.state.openIdx.length >= 2) return;
      
      this.state.brd[idx].st = 'open';
      this.state.openIdx.push(idx);
      playSnd('sel');

      if (this.state.openIdx.length === 2) this.state.wait = 60; 
    }
    this.syncState();
  },

  handleLogicUpdate() {
    if (this.role !== 'host') return; 
    
    // カード判定ウェイト処理
    if (this.state.wait > 0) {
      this.state.wait--;
      if (this.state.wait === 0 && this.state.openIdx.length === 2) {
        let i1 = this.state.openIdx[0], i2 = this.state.openIdx[1];
        
        if (this.state.brd[i1].v === this.state.brd[i2].v) {
          this.state.brd[i1].st = 'matched'; this.state.brd[i2].st = 'matched';
          this.state.sc[this.state.turn]++;
          this.state.msg = 'NICE MATCH!';
          playSnd('combo');
          this.checkPlanA(); 
        } else {
          this.state.brd[i1].st = 'hidden'; this.state.brd[i2].st = 'hidden';
          this.state.turn = this.state.turn === 'host' ? 'guest' : 'host';
          this.state.msg = this.state.turn === 'host' ? 'YOUR TURN' : 'RIVAL TURN';
          playSnd('hit');
        }
        this.state.openIdx = [];
        this.syncState();
      }
    }

    // Bot（AI）の思考ルーチン
    if (this.isBot && this.state.turn === 'guest' && this.state.wait === 0 && this.state.openIdx.length < 2) {
      this.botTimer = (this.botTimer || 0) - 1;
      if (this.botTimer <= 0) {
        let hidden = [];
        this.state.brd.forEach((c, i) => { if (c.st === 'hidden') hidden.push(i); });
        if (hidden.length > 0) {
          let pick = hidden[Math.floor(Math.random() * hidden.length)];
          this.processAction({ type: 'flip', idx: pick }, 'guest');
        }
        this.botTimer = 30; // 次めくるまでの間隔（0.5秒）
      }
    }
  },

  checkPlanA() {
    let remain = this.state.brd.filter(c => c.st === 'hidden').length;
    if (remain === 6) {
      let total = this.state.sc.host + this.state.sc.guest;
      let half = Math.floor(total / 2);
      this.state.sc.host = half;
      this.state.sc.guest = total - half;
      this.state.msg = '★ EQUALIZE EFFECT! ★';
      this.state.wait = 120;
    }
  },

  // --- 入力と描画 ---
  update() {
    if (keysDown.select) { if(this.peer) this.peer.destroy(); switchApp(Menu); return; }

    if (this.st === 'menu') {
      if (keysDown.down) { this.cursor = (this.cursor + 1) % 3; playSnd('sel'); }
      if (keysDown.up) { this.cursor = (this.cursor - 1 + 3) % 3; playSnd('sel'); }
      
      if (keysDown.a) {
        keysDown.a = false;
        if (this.cursor === 0) {
          // ホスト（部屋作成）
          let pass = prompt("部屋のパスワードを設定しますか？\n（不要な場合は空欄のままOKを押してください）", "");
          if (pass !== null) { this.hostPass = pass; playSnd('jmp'); this.startPeer(true); }
        }
        else if (this.cursor === 1) {
          // ゲスト（部屋に入る）
          let id = prompt("入室する4桁のルームIDを入力してください:", "");
          if (id && id.length === 4 && !isNaN(id)) {
            let pass = prompt("パスワードを入力してください\n（設定されていない場合は空欄のままOK）", "");
            if (pass !== null) { this.targetId = id; this.myPass = pass; playSnd('jmp'); this.startPeer(false); }
          } else if (id) { alert("エラー：4桁の数字を入力してください！"); }
        }
        else if (this.cursor === 2) {
          // Bot対戦（ひとりで遊ぶ）
          this.startBotMatch();
        }
      }
    }
    else if (this.st === 'host_lobby') {
      // ゲストが参加後、ホストがAボタンで試合開始！
      if (this.guestJoined && keysDown.a) {
        this.conn.send({ type: 'start_game' });
        this.st = 'play'; this.cursor = 0; this.initGame(); playSnd('jmp');
      }
    }
    else if (this.st === 'play') {
      this.handleLogicUpdate(); 
      
      if (this.state.turn === this.role && this.state.wait === 0) {
        if (keysDown.right) { this.cursor = (this.cursor + 1) % 20; playSnd('sel'); }
        if (keysDown.left) { this.cursor = (this.cursor - 1 + 20) % 20; playSnd('sel'); }
        if (keysDown.down) { this.cursor = (this.cursor + 4) % 20; playSnd('sel'); }
        if (keysDown.up) { this.cursor = (this.cursor - 4 + 20) % 20; playSnd('sel'); }
        
        if (keysDown.a) {
          if (this.role === 'host') this.processAction({ type: 'flip', idx: this.cursor }, 'host');
          else if (this.conn) this.conn.send({ type: 'action', action: { type: 'flip', idx: this.cursor } });
        }
      }
    }
  },

  draw() {
    ctx.fillStyle = '#012'; ctx.fillRect(0, 0, 200, 300);
    
    if (this.st === 'boot') {
      ctx.fillStyle = '#0f0'; ctx.font = '12px monospace'; ctx.fillText('LOADING PEER.JS...', 30, 150);
    }
    else if (this.st === 'menu') {
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('ROYAL MEMORY', 45, 40);
      
      const opts = ['ルームを作る (HOST)', 'ルームに入る (GUEST)', 'ひとりで遊ぶ (BOT)'];
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = this.cursor === i ? '#0f0' : '#fff';
        ctx.font = '11px monospace'; 
        ctx.fillText((this.cursor===i?'> ':'  ') + opts[i], 15, 100 + i*30);
      }
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 決定  SELECT: 戻る', 45, 280);
    }
    else if (this.st === 'host_lobby') {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ROOM LOBBY】', 45, 50);
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; 
      ctx.fillText(`ROOM ID : ${this.peerId}`, 20, 90);
      ctx.fillText(`PASSWORD: ${this.hostPass ? 'YES' : 'NONE'}`, 20, 115);
      
      ctx.strokeStyle = '#555'; ctx.strokeRect(10, 140, 180, 80);
      
      if (this.guestJoined) {
        ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace'; ctx.fillText('★ RIVAL JOINED! ★', 35, 170);
        ctx.fillStyle = '#0f0'; ctx.fillText('PRESS [A] TO START', 35, 195);
      } else {
        ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('WAITING FOR RIVAL...', 40, 180);
      }
    }
    else if (this.st === 'guest_lobby') {
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ROOM LOBBY】', 45, 50);
      ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('WAITING FOR HOST', 50, 160);
      ctx.fillText('TO START THE MATCH...', 35, 180);
    }
    else if (this.st === 'connecting' || this.st === 'error') {
      ctx.fillStyle = this.st === 'error' ? '#f00' : '#0f0'; ctx.font = '10px monospace';
      let lines = this.msg.split('\n');
      for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 10, 140 + i*15);
      if (this.st === 'error') { ctx.fillStyle = '#fff'; ctx.fillText('SELECT TO RETURN', 45, 250); }
    }
    else if (this.st === 'play') {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      let mySc = this.state.sc[this.role]; let enSc = this.state.sc[this.role === 'host' ? 'guest' : 'host'];
      ctx.fillText(`YOU: ${mySc}`, 10, 20); 
      ctx.fillText(`${this.isBot ? 'BOT' : 'RIVAL'}: ${enSc}`, 130, 20);
      
      ctx.fillStyle = this.state.turn === this.role ? '#0f0' : '#f00';
      ctx.fillText(this.state.msg, 100 - (this.state.msg.length*3), 40);

      for (let i = 0; i < 20; i++) {
        let x = 20 + (i % 4) * 40; let y = 60 + Math.floor(i / 4) * 40;
        let c = this.state.brd[i];
        
        if (c.st === 'matched') {
          ctx.strokeStyle = '#333'; ctx.strokeRect(x, y, 30, 35);
        } else {
          ctx.fillStyle = c.st === 'hidden' ? '#a00' : '#ddd'; ctx.fillRect(x, y, 30, 35);
          ctx.strokeStyle = '#fff'; ctx.strokeRect(x, y, 30, 35);
          if (c.st === 'open') {
            ctx.fillStyle = '#000'; ctx.font = 'bold 16px monospace'; ctx.fillText(c.v, x + 10, y + 22);
          } else {
            ctx.fillStyle = '#f88'; ctx.font = '10px monospace'; ctx.fillText('R', x + 12, y + 20);
          }
        }
        if (this.state.turn === this.role && this.cursor === i && this.state.wait === 0) {
          ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(x-2, y-2, 34, 39); ctx.lineWidth = 1;
        }
      }

      ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
      ctx.fillText('SKILL [B]:', 10, 280);
      let mySkills = this.state.skills[this.role];
      mySkills.forEach((s, idx) => {
         ctx.fillText(s === 1 ? '[1:透視]' : '[2:連続]', 65 + idx*45, 280);
      });
    }
  }
};
