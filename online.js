// === ONLINE BATTLE - ROYAL MEMORY (Phase 1: P2P & Core Logic) ===
const Online = {
  st: 'boot', role: '', peer: null, conn: null, peerId: '', targetId: '', msg: 'LOADING NETWORK...',
  cursor: 0, 
  // ゲームの状態（ホストが管理してゲストに同期する）
  state: {
    brd: [], // 盤面（20枚）
    turn: 'host', // 'host' or 'guest'
    sc: { host: 0, guest: 0 },
    skills: { host: [1, 2], guest: [1, 2] }, // スキル（1:透視, 2:連続）
    openIdx: [], // 現在めくっているカードのインデックス
    wait: 0,
    msg: 'GAME START!'
  },
  
  init() {
    this.st = 'boot'; this.msg = 'LOADING NETWORK...'; this.role = ''; this.peerId = ''; this.targetId = '';
    // PeerJSを動的に読み込む
    if (!window.Peer) {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
      script.onload = () => { this.st = 'menu'; };
      document.head.appendChild(script);
    } else {
      this.st = 'menu';
    }
  },

  // --- 通信周りの処理 ---
  startPeer(isHost) {
    this.role = isHost ? 'host' : 'guest';
    this.st = 'connecting'; this.msg = 'CONNECTING TO SERVER...';
    
    // ランダムな4桁のIDを生成
    const myId = 'RMB_' + Math.floor(1000 + Math.random() * 9000);
    this.peer = new Peer(myId);
    
    this.peer.on('open', (id) => {
      this.peerId = id.replace('RMB_', '');
      if (isHost) {
        this.msg = `YOUR ROOM ID: ${this.peerId}\nWAITING FOR RIVAL...`;
        this.peer.on('connection', (c) => {
          this.conn = c; this.setupConn();
          this.initGame(); // ホストがゲームの初期化を行う
        });
      } else {
        this.st = 'join'; this.targetId = '';
      }
    });
  },

  setupConn() {
    this.conn.on('open', () => {
      this.st = 'play'; this.cursor = 0;
      if (this.role === 'host') this.syncState();
    });
    this.conn.on('data', (data) => {
      if (this.role === 'guest' && data.type === 'sync') {
        this.state = data.state; // ゲストはホストの状態を丸呑みする
      }
      if (this.role === 'host' && data.type === 'action') {
        this.processAction(data.action, 'guest'); // ホストがゲストの行動を処理
      }
    });
    this.conn.on('close', () => { this.st = 'error'; this.msg = 'CONNECTION LOST...'; });
  },

  joinRoom() {
    this.msg = 'CONNECTING...'; this.st = 'connecting';
    this.conn = this.peer.connect('RMB_' + this.targetId);
    this.setupConn();
  },

  syncState() {
    if (this.conn && this.conn.open) {
      this.conn.send({ type: 'sync', state: this.state });
    }
  },

  // --- ゲームロジック（ホストのみが実行） ---
  initGame() {
    let deck = [1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10];
    deck.sort(() => Math.random() - 0.5); // シャッフル
    this.state.brd = deck.map(val => ({ v: val, st: 'hidden' })); // hidden, open, matched
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

      if (this.state.openIdx.length === 2) {
        this.state.wait = 60; // 判定を見せるためのウェイト（1秒）
      }
    }
    this.syncState();
  },

  handleLogicUpdate() {
    if (this.role !== 'host') return; // ロジックの進行はホストの特権
    
    if (this.state.wait > 0) {
      this.state.wait--;
      if (this.state.wait === 0 && this.state.openIdx.length === 2) {
        let i1 = this.state.openIdx[0], i2 = this.state.openIdx[1];
        
        // ペア判定
        if (this.state.brd[i1].v === this.state.brd[i2].v) {
          this.state.brd[i1].st = 'matched'; this.state.brd[i2].st = 'matched';
          this.state.sc[this.state.turn]++;
          this.state.msg = 'NICE MATCH!';
          playSnd('combo');
          this.checkPlanA(); // ★ A案：強制リセットのチェック
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
  },

  // ★ A案：残り3ペア（6枚）になったらスコアを半分こ！
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
      if (keysDown.up || keysDown.down) { this.cursor = this.cursor === 0 ? 1 : 0; playSnd('sel'); }
      if (keysDown.a) { playSnd('jmp'); this.startPeer(this.cursor === 0); }
    }
    else if (this.st === 'join') {
      if (keysDown.up) { let n = Number(this.targetId || 0); this.targetId = String(Math.min(9999, n + 1)).padStart(4, '0'); }
      if (keysDown.down) { let n = Number(this.targetId || 0); this.targetId = String(Math.max(0, n - 1)).padStart(4, '0'); }
      if (keysDown.a && this.targetId.length === 4) { playSnd('jmp'); this.joinRoom(); }
    }
    else if (this.st === 'play') {
      this.handleLogicUpdate(); // ホスト側でのみ進行
      
      // 自分のターンなら操作可能
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
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 16px monospace'; ctx.fillText('ROYAL MEMORY', 45, 50);
      ctx.fillStyle = this.cursor === 0 ? '#0f0' : '#fff'; ctx.font = '12px monospace'; ctx.fillText((this.cursor===0?'> ':'  ')+'ルームを作る(HOST)', 20, 120);
      ctx.fillStyle = this.cursor === 1 ? '#0f0' : '#fff'; ctx.fillText((this.cursor===1?'> ':'  ')+'ルームに入る(GUEST)', 20, 150);
    }
    else if (this.st === 'join') {
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.fillText('ENTER ROOM ID:', 40, 100);
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 24px monospace'; ctx.fillText(this.targetId || '0000', 65, 140);
      ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('↑↓: 数字変更  A: 決定', 30, 200);
    }
    else if (this.st === 'connecting' || this.st === 'error') {
      ctx.fillStyle = this.st === 'error' ? '#f00' : '#0f0'; ctx.font = '10px monospace';
      let lines = this.msg.split('\n');
      for(let i=0; i<lines.length; i++) ctx.fillText(lines[i], 10, 140 + i*15);
    }
    else if (this.st === 'play') {
      // スコアと情報
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      let mySc = this.state.sc[this.role]; let enSc = this.state.sc[this.role === 'host' ? 'guest' : 'host'];
      ctx.fillText(`YOU: ${mySc}`, 10, 20); ctx.fillText(`RIVAL: ${enSc}`, 130, 20);
      
      ctx.fillStyle = this.state.turn === this.role ? '#0f0' : '#f00';
      ctx.fillText(this.state.msg, 100 - (this.state.msg.length*3), 40);

      // カード描画 (4列 x 5段)
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
        // カーソル
        if (this.state.turn === this.role && this.cursor === i) {
          ctx.strokeStyle = '#0f0'; ctx.lineWidth = 2; ctx.strokeRect(x-2, y-2, 34, 39); ctx.lineWidth = 1;
        }
      }

      // 自分の所持スキル（今は表示だけ）
      ctx.fillStyle = '#0ff'; ctx.font = '9px monospace';
      ctx.fillText('SKILL [B]:', 10, 280);
      let mySkills = this.state.skills[this.role];
      mySkills.forEach((s, idx) => {
         ctx.fillText(s === 1 ? '[1:透視]' : '[2:連続]', 65 + idx*45, 280);
      });
    }
  }
};
