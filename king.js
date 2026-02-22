// === KING'S ROOM (AI CHAT UI & MAGIC TRANSPARENCY) ===
const KingRoom = {
  st: 'init', img: null, loaded: false, emotion: 'normal',
  scroll: 0,
  logs: [
    { speaker: 'sys', text: "SYSTEM: 謁見の間に 入室しました" },
    { speaker: 'king', text: "おお ゆうしゃよ！\nよくぞ まいった！\nわしが このせかいの おうじゃ！" },
    { speaker: 'sys', text: "※現在は 表情テストモードです。\n Aボタンで 王様の表情が 変わります。" }
  ],
  
  init() {
    this.st = 'chat';
    this.scroll = 0;
    BGM.play('spell'); // ドラクエのお城風BGM
    
    if (!this.img) {
      const tempImg = new Image();
      tempImg.src = 'king.png';
      tempImg.onload = () => {
        // ★【魔法の処理】キャンバスを使って背景の黒だけを自動で透明にくり抜く！
        const offCvs = document.createElement('canvas');
        const w = tempImg.width; 
        const h = tempImg.height;
        offCvs.width = w; offCvs.height = h;
        const oCtx = offCvs.getContext('2d');
        oCtx.drawImage(tempImg, 0, 0);
        
        const imgData = oCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        // 塗りつぶしアルゴリズム（画像の四隅から繋がっている黒色だけを透明にする）
        const stack = [[0, 0], [w-1, 0], [0, h-1], [w-1, h-1]];
        const visited = new Uint8Array(w * h);
        
        while(stack.length > 0) {
          const [x, y] = stack.pop();
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          
          const pIdx = y * w + x;
          if (visited[pIdx]) continue;
          visited[pIdx] = 1;
          
          const i = pIdx * 4;
          // RGBがほぼ黒(30未満)なら透明にする
          if (data[i] < 30 && data[i+1] < 30 && data[i+2] < 30) {
            data[i+3] = 0; // Alpha(透明度)を0に
            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
          }
        }
        oCtx.putImageData(imgData, 0, 0);
        
        // 透明化済みのキャンバスをゲーム用の画像としてセット
        this.img = offCvs; 
        this.loaded = true;
      };
    }
  },
  
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    
    if (keys.up) { this.scroll = Math.max(0, this.scroll - 3); }
    if (keys.down) { this.scroll += 3; }
    
    // Aボタンで表情のテスト切り替え
    if (keysDown.a) {
      const emos = ['normal', 'thinking', 'angry', 'laughing', 'disappointed'];
      this.emotion = emos[(emos.indexOf(this.emotion) + 1) % emos.length];
      playSnd('sel');
    }
  },
  
  draw() {
    // === 背景の描画（お城の玉座風） ===
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    ctx.fillStyle = '#400'; ctx.fillRect(0, 0, 200, 150); // 壁
    
    // 壁のレンガ模様
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 100); ctx.stroke(); }
    for(let i=0; i<100; i+=15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); }

    ctx.fillStyle = '#a00'; ctx.fillRect(0, 100, 200, 50); // 絨毯
    
    // 王様の影
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(100, 135, 40, 10, 0, 0, Math.PI*2); ctx.fill();

    // === 王様の描画 ===
    if (this.loaded) {
      const sw = this.img.width / 3; 
      const sh = this.img.height / 2;
      let sx = 0, sy = 0;
      
      // ★ ズレ修正：下段の2つが中央寄りになっているため、X座標の切り抜き開始位置を調整
      switch(this.emotion) {
        case 'normal':       sx = 0;            sy = 0; break;
        case 'thinking':     sx = sw;           sy = 0; break;
        case 'angry':        sx = sw * 2;       sy = 0; break;
        case 'laughing':     sx = sw * 0.40;    sy = sh; break; // Xを少し右へズラす
        case 'disappointed': sx = sw * 1.60;    sy = sh; break; // Xを少し左へズラす
      }
      
      // 王様を画面中央に描画
      const drawW = 110;
      const drawH = 110 * (sh / sw);
      ctx.drawImage(this.img, sx, sy, sw, sh, 100 - drawW/2, 145 - drawH, drawW, drawH);
      
    } else {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText('Loading King...', 60, 80);
    }
    
    // 思考中のアニメーション演出
    if (this.emotion === 'thinking') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('...', 130 + Math.sin(Date.now() / 150) * 3, 50);
    }

    // === チャットログウィンドウの描画 ===
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(5, 145, 190, 150);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(5, 145, 190, 150);
    
    ctx.save();
    ctx.beginPath(); ctx.rect(10, 150, 180, 140); ctx.clip();
    
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    let drawY = 165 - this.scroll;
    
    for (let log of this.logs) {
      ctx.fillStyle = log.speaker === 'king' ? '#0f0' : '#aaa';
      let lines = log.text.split('\n');
      for (let line of lines) {
        ctx.fillText(line, 15, drawY);
        drawY += 15;
      }
      drawY += 5; 
    }
    ctx.restore();
    
    ctx.fillStyle = '#888'; ctx.font = '9px monospace';
    ctx.fillText('A:表情テスト ↑↓:スクロール SEL:戻る', 10, 290);
  }
};
