// === GUIDE APP (Phase 6.3: King's Manual) ===
const Guide = {
  cur: 0,
  page: 0,
  games: [
    { 
      name: 'テトリベーダー', 
      text: [
        '上から落ちてくるブロックを',
        '隙間なく並べて 消すのじゃ！',
        '',
        '【操作】',
        '左右: 移動',
        '上: 一気に落とす（ハードドロップ）',
        '下: 早く落とす',
        'Aボタン: 回転',
        '',
        'たまに 敵が ビームを撃ってくるゆえ、',
        'ブロックで 防ぐんじゃぞ！'
      ] 
    },
    { 
      name: '理不尽ブラザーズ', 
      text: [
        'トゲに当たったり 穴に落ちると',
        '即ゲームオーバーの 鬼畜アクションじゃ！',
        '',
        '【操作】',
        '左右: 移動',
        'Aボタン: ジャンプ',
        '',
        '見えないブロックや 動く床など、',
        '理不尽な罠を 気合いで 乗り越えろ！'
      ] 
    },
    { 
      name: 'レトロ・スロット', 
      text: [
        '手持ちのコインを賭けて 一攫千金じゃ！',
        '',
        '【操作】',
        '上: ベット枚数を増やす（1〜3枚）',
        'Bボタン: MAXベット（3枚）',
        'Aボタン: スピン開始！',
        '',
        '「７」を３つ揃えると、',
        '溜まったジャックポットを 総取りできるぞ！'
      ] 
    },
    { 
      name: '王様の間 (AIチャット)', 
      text: [
        'なんと！ わし(AI)と 自由に',
        'おしゃべりが できる 魔法の部屋じゃ！',
        '',
        '【コマンド解説】',
        '・ほうこく: ゲームの記録を わしに教える',
        '・じゆうにはなす: 好きな言葉を 入力する',
        '',
        '【⚠王様の魔力について】',
        'わしも 歳じゃから、連続で 話しかけられると',
        '魔力が尽きて 疲れてしまうんじゃ。',
        '「休ませてくれ」と 言われた時は、',
        '【1分ほど】待ってから 話しかけてくれい！',
        '',
        '（※ヒント：わしは 甘いものが 大好物じゃ）'
      ] 
    }
  ],
  
  init() { 
    this.cur = 0; 
    this.page = 0; 
  },
  
  update() {
    if (this.page === 0) {
      if (keysDown.select || keysDown.b) { switchApp(Menu); return; }
      if (keysDown.down) { this.cur = (this.cur + 1) % this.games.length; playSnd('sel'); }
      if (keysDown.up) { this.cur = (this.cur - 1 + this.games.length) % this.games.length; playSnd('sel'); }
      if (keysDown.a) { this.page = 1; playSnd('jmp'); }
    } else {
      if (keysDown.b || keysDown.select || keysDown.a) { this.page = 0; playSnd('hit'); }
    }
  },
  
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    
    if (this.page === 0) {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace';
      ctx.fillText('【ゲーム解説館】', 40, 30);
      
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      for (let i = 0; i < this.games.length; i++) {
        if (i === this.cur) {
          ctx.fillStyle = '#ff0';
          ctx.fillRect(10, 55 + i * 25, 180, 18);
          ctx.fillStyle = '#000';
        } else {
          ctx.fillStyle = i === 3 ? '#0ff' : '#aaa'; // 王様の間だけ水色で目立たせる
        }
        ctx.fillText((i === this.cur ? '▶ ' : '  ') + this.games[i].name, 15, 68 + i * 25);
      }
      
      ctx.fillStyle = '#888'; ctx.font = '9px monospace';
      ctx.fillText('A: 読む  SELECT: 戻る', 45, 280);
      
    } else {
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`【${this.games[this.cur].name}】`, 10, 25);
      
      ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(5, 35); ctx.lineTo(195, 35); ctx.stroke();
      
      ctx.fillStyle = '#fff'; ctx.font = '9px monospace';
      const lines = this.games[this.cur].text;
      for (let i = 0; i < lines.length; i++) {
        // 特定のキーワードをハイライト
        if (lines[i].includes('⚠')) ctx.fillStyle = '#f55';
        else if (lines[i].includes('ヒント')) ctx.fillStyle = '#0ff';
        else ctx.fillStyle = '#fff';
        
        ctx.fillText(lines[i], 10, 50 + i * 14);
      }
      
      ctx.fillStyle = '#0f0'; ctx.font = '10px monospace';
      ctx.fillText('▼ Bボタン で もどる ▼', 35, 285);
    }
  }
};
