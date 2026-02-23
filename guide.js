// === GUIDE APP (Phase 6.5: Corrected Manual) ===
const Guide = {
  cur: 0,
  page: 0,
  games: [
    { 
      name: 'テトリベーダー', 
      text: [
        '迫りくる ブロックの群れを',
        '下から 撃って 消すのじゃ！',
        '',
        '【操作】',
        '左右: 移動',
        'Aボタン: ビームを撃つ',
        'Bボタン: ブロックの落下を 早める',
        '',
        'ブロックが 一番下まで',
        '届いてしまうと ゲームオーバーじゃ！'
      ] 
    },
    { 
      name: '理不尽ブラザーズ', 
      text: [
        'ちょっとした ミスが 命取りの',
        '鬼畜 アクションゲームじゃ！',
        '',
        '【操作】',
        '左右: 移動',
        'Aボタン: ジャンプ',
        '',
        '見えないブロックや 取るとダメージを受ける',
        '偽コインなど 理不尽な罠に 気をつけろ！'
      ] 
    },
    { 
      name: 'ONLINE対戦', 
      text: [
        '【 現在 リニューアル中 じゃ！ 】',
        '',
        'さらに 白熱した バトルが できるよう',
        'わしが 魔法を かけ直しておる。',
        '',
        '完成を 楽しみに 待っておれ！'
      ] 
    },
    { 
      name: 'BEAT BROS', 
      text: [
        '自分の 好きな音楽ファイルを 読み込んで',
        '遊べる 本格リズムゲームじゃ！',
        '',
        '【操作】',
        '← ↓ ↑ → の 各ボタン',
        '（または PCの D, F, J, K キー）',
        '',
        '※スマホなら 画面のレーンを 直接',
        'タップしても 遊べるぞ！',
        '終わる時は 左上の「EXIT」を押すのじゃ。'
      ] 
    },
    { 
      name: 'レトロ・スロット', 
      text: [
        '手持ちのコインを増やして 一攫千金じゃ！',
        '',
        '【操作】',
        '上: ベット枚数を増やす（1〜3枚）',
        'Bボタン: MAXベット（3枚）',
        'Aボタン: スピン開始 ＆ リールを止める！',
        '',
        '「王冠」を３つ揃えると、',
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
          ctx.fillRect(10, 50 + i * 22, 180, 18);
          ctx.fillStyle = '#000';
        } else {
          ctx.fillStyle = i === 5 ? '#0ff' : '#aaa'; // 王様の間だけ水色
        }
        ctx.fillText((i === this.cur ? '▶ ' : '  ') + this.games[i].name, 15, 63 + i * 22);
      }
      
      ctx.fillStyle = '#888'; ctx.font = '9px monospace';
      ctx.fillText('A: 読む  SELECT: 戻る', 45, 290);
      
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
