// === KING'S ROOM (AI CHAT UI & MAGIC TRANSPARENCY & POSITION FIX) ===
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
    BGM.play('spell'); 
    
    if (!this.img) {
      const tempImg = new Image();
      tempImg.src = 'king.png';
      tempImg.onload = () => {
        const offCvs = document.createElement('canvas');
        const w = tempImg.width; 
        const h = tempImg.height;
        offCvs.width = w; offCvs.height = h;
        const oCtx = offCvs.getContext('2d');
        oCtx.drawImage(tempImg, 0, 0);
        
        const imgData = oCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        
        const stack = [[0, 0], [w-1, 0], [0, h-1], [w-1, h-1]];
        const visited = new Uint8Array(w * h);
        
        while(stack.length > 0) {
          const [x, y] = stack.pop();
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          
          const pIdx = y * w + x;
          if (visited[pIdx]) continue;
          visited[pIdx] = 1;
          
          const i = pIdx * 4;
          if (data[i] < 30 && data[i+1] < 30 && data[i+2] < 30) {
            data[i+3] = 0; 
            stack.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
          }
        }
        oCtx.putImageData(imgData, 0, 0);
        this.img = offCvs; 
        this.loaded = true;
      };
    }
  },
  
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    if (keys.up) { this.scroll = Math.max(0, this.scroll - 3); }
    if (keys.down) { this.scroll += 3; }
    
    if (keysDown.a) {
      const emos = ['normal', 'thinking', 'angry', 'laughing', 'disappointed'];
      this.emotion = emos[(emos.indexOf(this.emotion) + 1) % emos.length];
      playSnd('sel');
    }
  },
  
  draw() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 200, 300);
    ctx.fillStyle = '#400'; ctx.fillRect(0, 0, 200, 150); 
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for(let i=0; i<200; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 100); ctx.stroke(); }
    for(let i=0; i<100; i+=15) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); }

    ctx.fillStyle = '#a00'; ctx.fillRect(0, 100, 200, 50); 
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(100, 135, 40, 10, 0, 0, Math.PI*2); ctx.fill();

    if (this.loaded) {
      // ★ 調整：画像を単純な3等分ではなく、「切り抜く枠を少し小さくする」ことで隣の王様を入れないようにする
      const cellW = this.img.width / 3;
      const cellH = this.img.height / 2;
      
      // 切り抜く実際のサイズ（少し小さくして余白をカット）
      const cropW = cellW * 0.9; 
      const cropH = cellH * 0.9;
      
      let sx = 0, sy = 0;
      // 描画位置の微調整用オフセット（王様がガタガタ動くのを防ぐ）
      let drawOffsetX = 0, drawOffsetY = 0;
      
      // ★ 各表情ごとの厳密なスライス座標設定
      switch(this.emotion) {
        case 'normal':       
          sx = cellW * 0.05; sy = cellH * 0.05; 
          break;
        case 'thinking':     
          sx = cellW * 1.05; sy = cellH * 0.05; 
          break;
        case 'angry':        
          sx = cellW * 2.05; sy = cellH * 0.05; 
          break;
        case 'laughing':     
          // 下段左は画像の中央寄りにあるため、手動でX座標を寄せる
          sx = cellW * 0.55; sy = cellH * 1.05; 
          drawOffsetY = -5; // 少し背が高い？ので上にズラす
          break; 
        case 'disappointed': 
          // 下段右も中央寄り
          sx = cellW * 1.65; sy = cellH * 1.05; 
          drawOffsetX = -5; // 少し右寄りなので左にズラす
          break;
      }
      
      // 王様を画面に描画（幅100px相当）
      const drawW = 100;
      const drawH = 100 * (cropH / cropW);
      ctx.drawImage(
        this.img, 
        sx, sy, cropW, cropH, 
        (100 - drawW/2) + drawOffsetX, (140 - drawH) + drawOffsetY, drawW, drawH
      );
      
    } else {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      ctx.fillText('Loading King...', 60, 80);
    }
    
    if (this.emotion === 'thinking') {
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('...', 130 + Math.sin(Date.now() / 150) * 3, 50);
    }

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
