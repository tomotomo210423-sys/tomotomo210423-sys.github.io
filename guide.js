// === GUIDE APP (Phase 8.1: Musou Infinity Added) ===
const Guide = {
  cur: 0,
  page: 0,
  scrollY: 0, // 縦スクロール位置
  scrollX: 0, // 横スクロール位置 ★追加
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
        '【ロイヤル・ジョーカー】',
        'スマホ2台で遊べる オンライン・ババ抜きじゃ！',
        '手札のペアを 揃えて 捨てていき、',
        '先に 手札が【0枚】になった者の 勝利となる！',
        '最後まで【J】を持っていたら 負けじゃぞ。',
        '------------------------------------------', 
        '【通信のやり方】',
        '1人が【部屋を作る】で 部屋の名前を決める。',
        'もう1人が【部屋を探す】で その部屋に入るのじゃ。',
        'ひとりで 練習したい時は【BOT戦】じゃ！',
        '',
        '【遊び方と カオス・シャッフル】',
        '【左右】で 相手のカードを選び 【A】で 引く！',
        'どちらかの手札が【残り3枚】になった瞬間…',
        '【カオス・シャッフル】が 発動するぞ！',
        'すべてのカードが 没収＆配り直されるのじゃ！',
        '',
        '【降参と リザルト】',
        '負けを認めるなら 試合中に【SELECTボタン】。',
        '試合後は お互いに【もう一度遊ぶ】を選べば',
        '即座に 再戦できるぞ！',
        '',
        '【王様スキル (Bボタン)】',
        '試合開始時、ランダムで【2つ】配られる。',
        '自分のターンに【B】で メニューを開き 発動！',
        ' 1:透視 … 相手のジョーカーが 赤く光る',
        ' 2:交換 … お互いの手札を 全て入れ替える',
        ' 3:贈物 … 自分の手札1枚を 相手に押し付ける',
        ' 4:目隠し … 相手の手札の並びを シャッフル',
        ' 5:鉄壁 … 次のターン 相手は引けなくなる',
        ' 6:予言 … 相手のカードが ペアになるか分かる',
        ' 7:重力 … 相手が ジョーカーを 引けなくなる',
        ' 8:慈悲 … 自分の手札(J以外)を 1枚消し去る',
        ' 9:加速 … 自分のターンで 連続2枚 引ける',
        '10:革命 … 【J】を持っている方が勝ちになる！'
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
    // ★ 無限無双 を追加！
    {
      name: '無限無双',
      text: [
        '迫りくる 敵の大群を なぎ倒し',
        'どこまで 生き残れるか 挑むのじゃ！',
        '',
        '【操作】',
        '十字キー(スワイプ): プレイヤーの移動',
        '※攻撃は すべて【オート】で 発動するぞ！',
        '',
        '【ジェムと レベルアップ】',
        '敵を倒すと落とす ジェム(経験値)を',
        '拾い集めると レベルアップじゃ！',
        '時間が止まり 3つのスキルが 提示されるゆえ',
        '好きなものを選んで 最強を目指すのじゃ！',
        '',
        '【コインと 永続強化(SHOP)】',
        'たまに落ちる コインを集めれば',
        'タイトル画面の【SHOP】から',
        '基礎能力を ずっと強化できるぞ！',
        'やればやるほど 確実に 強くなるのじゃ！'
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
    this.scrollY = 0;
    this.scrollX = 0; // ★初期化
  },
  
  update() {
    if (this.page === 0) {
      if (keysDown.select || keysDown.b) { switchApp(Menu); return; }
      if (keysDown.down) { this.cur = (this.cur + 1) % this.games.length; playSnd('sel'); }
      if (keysDown.up) { this.cur = (this.cur - 1 + this.games.length) % this.games.length; playSnd('sel'); }
      if (keysDown.a) { this.page = 1; this.scrollY = 0; this.scrollX = 0; playSnd('jmp'); }
    } else {
      if (keysDown.b || keysDown.select) { this.page = 0; playSnd('hit'); }
      
      // 縦スクロール
      const maxScrollY = Math.max(0, this.games[this.cur].text.length - 13); 
      if (keysDown.down) { this.scrollY = Math.min(this.scrollY + 3, maxScrollY); playSnd('sel'); }
      if (keysDown.up) { this.scrollY = Math.max(this.scrollY - 3, 0); playSnd('sel'); }

      // ★横スクロール（最大200pxまで右にずらせるように設定）
      const maxScrollX = 200;
      if (keysDown.right) { this.scrollX = Math.min(this.scrollX + 10, maxScrollX); playSnd('sel'); }
      if (keysDown.left) { this.scrollX = Math.max(this.scrollX - 10, 0); playSnd('sel'); }
    }
  },
  
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    
    if (this.page === 0) {
      // メニュー画面
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ゲーム解説館】', 40, 30);
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      for (let i = 0; i < this.games.length; i++) {
        if (i === this.cur) { ctx.fillStyle = '#ff0'; ctx.fillRect(10, 50 + i * 22, 180, 18); ctx.fillStyle = '#000'; } 
        // ★ リストの一番最後（王様の間）だけシアン色にするように修正
        else { ctx.fillStyle = i === this.games.length - 1 ? '#0ff' : '#aaa'; }
        ctx.fillText((i === this.cur ? '▶ ' : '  ') + this.games[i].name, 15, 63 + i * 22);
      }
      ctx.fillStyle = '#888'; ctx.font = '9px monospace'; ctx.fillText('A: 読む  SELECT: 戻る', 45, 290);
      
    } else {
      // 本文画面
      const game = this.games[this.cur];
      ctx.fillStyle = '#ff0'; ctx.font = 'bold 12px monospace';
      ctx.fillText(`【${game.name}】`, 10, 25);
      ctx.strokeStyle = '#333'; ctx.beginPath(); ctx.moveTo(5, 35); ctx.lineTo(195, 35); ctx.stroke();
      
      // テキスト描画（横スクロール適用）
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace';
      for (let i = 0; i < 13; i++) {
        const lineIdx = i + this.scrollY;
        if (lineIdx >= game.text.length) break;
        
        let lineStr = game.text[lineIdx];
        if (lineStr.includes('⚠')) ctx.fillStyle = '#f55';
        else if (lineStr.includes('ヒント')) ctx.fillStyle = '#0ff';
        else if (lineStr.includes('【') && !lineStr.includes('操作')) ctx.fillStyle = '#ff0';
        else ctx.fillStyle = '#fff';
        
        // ★ X座標を scrollX 分だけずらして描画
        ctx.fillText(lineStr, 10 - this.scrollX, 50 + i * 15);
      }
      
      // スクロールナビゲーション表示
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 10px monospace';
      const maxScrollY = Math.max(0, game.text.length - 13);
      if (this.scrollY > 0) ctx.fillText('▲', 185, 45); // 上矢印
      if (this.scrollY < maxScrollY) ctx.fillText('▼', 185, 250); // 下矢印

      // ★ 横スクロール矢印
      if (this.scrollX > 0) ctx.fillText('◀', 2, 150); // 左矢印
      if (this.scrollX < 200) ctx.fillText('▶', 190, 150); // 右矢印
      
      ctx.fillStyle = '#0f0'; ctx.font = '10px monospace';
      ctx.fillText('Bボタン で もどる', 50, 285);
    }
  }
};
