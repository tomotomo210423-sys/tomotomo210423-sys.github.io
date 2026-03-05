// === GUIDE APP (Phase 10: Noise Agent Added) ===
const Guide = {
  cur: 0,
  page: 0,
  scrollY: 0, // 縦スクロール位置
  scrollX: 0, // 横スクロール位置
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
      name: 'アビス・ジェネラル',
      text: [
        '魔王となって 無限に迫りくる勇者軍から',
        'コアを守り抜く 超マルチタスク防衛ゲームじゃ！',
        '起動すると 筐体が【横画面】に 変形するぞ！',
        '',
        '【操作】',
        '左手(十字キー): 触手を動かして 敵を直接殴る！',
        '右手(スワイプ): 画面に図形を描いて 魔法発動！',
        '右手(タップ): 右下のSHOPボタンで 強化を開く！',
        '右手(長押し): 左上のオルゴールの ネジを巻く！',
        '',
        '【ジェスチャー魔法】',
        '画面を 一筆書きで なぞるのじゃ！',
        ' | (縦線): メテオ！ 上から隕石を落とす',
        ' ― (横線): 眷属召喚！ 自動で敵に突撃する群れを出す',
        ' O (丸形): シールド！ 敵を弾き飛ばす防壁を張る',
        ' ※シールドは 連続で描けば 多重に張れるぞ！',
        '',
        '【⚠魔界のオルゴール (重要)】',
        '画面左上にある 四角い箱じゃ。',
        '放置して 緑のゲージが ゼロになると…',
        '狂気に飲まれて 【即ゲームオーバー】になるぞ！',
        '時々 指で【長押し】して ネジを巻くのじゃ！',
        '',
        '【クロノ・ドメイン (強化SHOP)】',
        '敵を倒すと「魂(SOUL)」が 手に入る。',
        '右下の SHOP を開くと 時間が「スロー」になり、',
        '魂を使って 魔王軍を 強化できるぞ！',
        ' 邪眼召喚: 自動で弾を撃つ 目玉を設置',
        ' コア修復: コアのHPを回復し 最大値もUP',
        ' 触手火力UP: 触手で殴った時の ダメージ増加',
        ' 触手分裂: なんと！ 触手の本数が 増えるぞ！',
        ' メテオ巨大化: 隕石の 範囲と威力がUP (最大Lv3)',
        '',
        '※ヒント：SHOPを開いている間も 左手で',
        '触手を動かして 敵を殴ることが 可能じゃ！',
        '',
        '【登場キャラクター設定】',
        '・魔王のコア: プレイヤーの本体。赤黒く脈打つ水晶体。',
        '・アビス・テンタクル(触手): コアを守る 恐ろしい腕。',
        '・アビス・スウォーム(眷属): 召喚される 赤い魔物。',
        '・邪眼: 敵を睨み 血玉を吐き出す 防衛器官。',
        '・勇者軍: 魔王討伐のため 無限に湧いてくる 人間たち。'
      ]
    },
    // ★ 爆音スニーキング を追加！
    {
      name: '爆音スニーキング',
      text: [
        '呪いの靴のせいで 歩くたびに爆音と',
        '超巨大な文字が出る 最悪のステルスゲームじゃ！',
        '',
        '【操作】',
        '十字キー: 移動',
        'Aボタン: 敵の背後で暗殺 / デコイシャウト',
        'Aボタン(長押し): 端末のハッキング',
        'Bボタン: 虹色ダンボールを被る',
        '',
        '【⚠呪いのステルス靴】',
        '歩くたびに 巨大な擬音語が 画面を覆い尽くし',
        '自分の視界が まったく見えなくなるぞ！',
        '敵の視界(赤い範囲)や レーザーに',
        '触れてしまうと 即ゲームオーバーじゃ！',
        '',
        '【Aボタンの デコイシャウト】',
        '敵がいない場所で Aボタンを押すと',
        '大声を出して 敵をおびき寄せることができる！',
        'ただし、超絶巨大な文字が出るので 注意じゃ。',
        '',
        '【虹色ダンボール と O2ゲージ】',
        'Bボタンで ダンボールを被ると',
        '敵の視界を やり過ごせるぞ！',
        'ただし、移動速度が 激減するうえに',
        '画面上の【O2ゲージ】が 減っていく。',
        'ゼロになると 酸欠で しばらく使えなくなるぞ！',
        '',
        '【ギミック解説】',
        '・青いロッカー: 重なると 完全に隠れられる！',
        '  （O2ゲージも 減らないぞ！）',
        '・カラー扉とスイッチ: 同じ色のスイッチを',
        '  踏まないと 扉は開かないぞ。',
        '・黄色い端末: 全てを 100%まで',
        '  ハッキングしないと ゴールが開かない！',
        '',
        '（※タイトル画面の DATABASE で',
        '  最高にくだらない 裏設定が 読めるぞ！）'
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
    this.scrollX = 0;
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

      // 横スクロール（最大200pxまで右にずらせるように設定）
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
      
      // 項目が増えたので、メニュー画面も少しスクロールさせる処理
      let startY = 50;
      let drawStart = Math.max(0, this.cur - 8);
      for (let i = drawStart; i < Math.min(this.games.length, drawStart + 10); i++) {
        if (i === this.cur) { ctx.fillStyle = '#ff0'; ctx.fillRect(10, startY + (i - drawStart) * 22 - 13, 180, 18); ctx.fillStyle = '#000'; } 
        else { ctx.fillStyle = i === this.games.length - 1 ? '#0ff' : '#aaa'; }
        ctx.fillText((i === this.cur ? '▶ ' : '  ') + this.games[i].name, 15, startY + (i - drawStart) * 22);
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
        
        // X座標を scrollX 分だけずらして描画
        ctx.fillText(lineStr, 10 - this.scrollX, 50 + i * 15);
      }
      
      // スクロールナビゲーション表示
      ctx.fillStyle = '#0ff'; ctx.font = 'bold 10px monospace';
      const maxScrollY = Math.max(0, game.text.length - 13);
      if (this.scrollY > 0) ctx.fillText('▲', 185, 45); // 上矢印
      if (this.scrollY < maxScrollY) ctx.fillText('▼', 185, 250); // 下矢印

      // 横スクロール矢印
      if (this.scrollX > 0) ctx.fillText('◀', 2, 150); // 左矢印
      if (this.scrollX < 200) ctx.fillText('▶', 190, 150); // 右矢印
      
      ctx.fillStyle = '#0f0'; ctx.font = '10px monospace';
      ctx.fillText('Bボタン で もどる', 50, 285);
    }
  }
};
