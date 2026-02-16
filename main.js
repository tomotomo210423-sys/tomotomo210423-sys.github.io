// ★ 究極進化4: セーブデータ永久保存（「引き継ぎ部屋」マップにリメイク！）
const DataBackup = {
  st: 'map', px: 4.5, py: 6, anim: 0, msg: '', backupStr: '',
  init() { this.st = 'map'; this.px = 4.5; this.py = 6; this.msg = ''; this.anim = 0; BGM.play('menu'); },
  update() {
    if (keysDown.select) { switchApp(Menu); return; }
    if (this.st === 'msg') { if (keysDown.a || keysDown.b) { this.st = 'map'; playSnd('sel'); } return; }
    
    this.anim++;
    let nx = this.px, ny = this.py;
    if (keys.left) nx -= 0.15; if (keys.right) nx += 0.15;
    if (keys.up) ny -= 0.15; if (keys.down) ny += 0.15;
    
    // 部屋の外に出られないように制限
    nx = Math.max(1, Math.min(8, nx));
    ny = Math.max(1.5, Math.min(7, ny));
    this.px = nx; this.py = ny;

    if (keysDown.a) {
       // 左の端末（コピー）
       if (Math.abs(this.px - 2) < 1.5 && Math.abs(this.py - 2) < 1.5) {
           try { 
             this.backupStr = btoa(unescape(encodeURIComponent(JSON.stringify(SaveSys.data))));
             navigator.clipboard.writeText(this.backupStr).then(()=> { 
               this.msg = 'データをコピーした！\nメモ帳などに保存せよ。'; this.st = 'msg'; playSnd('combo'); 
             }).catch(e=> { this.msg = 'コピー失敗...'; this.st = 'msg'; });
           } catch(e) { this.msg = 'データ変換エラー'; this.st = 'msg'; playSnd('hit'); }
       } 
       // 右の端末（復元）
       else if (Math.abs(this.px - 7) < 1.5 && Math.abs(this.py - 2) < 1.5) {
           const input = prompt("復活の呪文（パスワード）を入力してください:");
           if (input) {
             try {
               const parsed = JSON.parse(decodeURIComponent(escape(atob(input))));
               if (parsed && parsed.playerName) { 
                 SaveSys.data = parsed; SaveSys.save(); 
                 this.msg = 'データの復元に成功した！'; this.st = 'msg'; playSnd('combo'); 
               } else throw new Error('Invalid');
             } catch(e) { this.msg = '呪文が違います！'; this.st = 'msg'; playSnd('hit'); }
           }
       }
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    
    // サイバーなデータ管理室の壁と床
    ctx.fillStyle = '#034'; ctx.fillRect(20, 20, 160, 140);
    ctx.strokeStyle = '#0ff'; ctx.lineWidth = 2; ctx.strokeRect(20, 20, 160, 140); ctx.lineWidth = 1;
    for(let i=20; i<180; i+=20) { ctx.beginPath(); ctx.moveTo(i, 20); ctx.lineTo(i, 160); ctx.stroke(); }
    
    // 端末A（左：コピー）
    const offsetY1 = Math.sin(this.anim * 0.1) * 2;
    ctx.fillStyle = '#0f0'; ctx.fillRect(35, 35, 20, 20); ctx.fillStyle = '#fff'; ctx.fillRect(38, 38, 14, 14);
    ctx.fillStyle = '#0f0'; ctx.font = '8px monospace'; ctx.fillText('コピー', 32, 28 + offsetY1);
    ctx.fillStyle = '#0f0'; ctx.fillText('▲', 42, 65);

    // 端末B（右：復元）
    const offsetY2 = Math.cos(this.anim * 0.1) * 2;
    ctx.fillStyle = '#f80'; ctx.fillRect(145, 35, 20, 20); ctx.fillStyle = '#fff'; ctx.fillRect(148, 38, 14, 14);
    ctx.fillStyle = '#f80'; ctx.fillText('復元', 145, 28 + offsetY2);
    ctx.fillStyle = '#f80'; ctx.fillText('▼', 152, 65);

    // プレイヤー描画
    drawSprite(this.px * 20, this.py * 20, '#0ff', sprs.player || sprs.heroNew, 2.5);

    ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
    ctx.fillText('端末の前でAボタンを押すんだ。', 25, 180);
    ctx.fillStyle = '#666'; ctx.fillText('SELECT: 戻る', 65, 280);

    if (this.st === 'msg') {
      ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(10, 100, 180, 60); 
      ctx.strokeStyle = '#0f0'; ctx.strokeRect(10, 100, 180, 60);
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; 
      let arr = this.msg.split('\n'); for(let i=0; i<arr.length; i++) ctx.fillText(arr[i], 20, 120 + i*15);
    }
  }
};
