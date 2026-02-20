// === GAME GUIDE (PRO SLOT UPDATE) ===
const Guide = {
  st: 'list', cur: 0, scroll: 0,
  
  pages: [
    {
      title: "テトリベーダー",
      lines: [
        "【ジャンル】パズル＆シューティング",
        "",
        "落ちてくるブロックを揃えて消し、",
        "迫りくる侵略者を迎撃せよ！",
        "ブロックを消すとビームが発射される。",
        "",
        "[操作方法]",
        " ← → : ブロックの移動",
        "  ↑  : ハードドロップ(瞬時に落下)",
        "  ↓  : ソフトドロップ(加速)",
        " A / B : ブロックの回転"
      ]
    },
    {
      title: "理不尽ブラザーズ",
      lines: [
        "【ジャンル】即死系アクション",
        "",
        "理不尽な罠が待ち受けるステージを",
        "駆け抜け、ゴール(★)を目指せ！",
        "",
        "[操作方法]",
        " ← → : プレイヤーの移動",
        "   A   : ジャンプ",
        "",
        "※注意※",
        "乗ると落ちる床、見えないブロック、",
        "偽物のコインなどトラップが満載です。"
      ]
    },
    {
      title: "ONLINE対戦",
      lines: [
        "【ジャンル】エアホッケー対戦",
        "",
        "シンプルで熱いボールの打ち合い。",
        "相手の背後にボールを抜けさせれば",
        "スコアが入るぞ！",
        "",
        "[操作方法]",
        "  ↑  : パドルを上へ移動",
        "  ↓  : パドルを下へ移動",
        "",
        "※現在は疑似対戦モードです。"
      ]
    },
    {
      title: "BEAT BROS",
      lines: [
        "【ジャンル】リズムアクション",
        "",
        "スマホやPCに入っている自分の好きな",
        "音楽ファイルを読み込んで遊べる音ゲー！",
        "",
        "[操作方法]",
        "下から降ってくるノーツが円に",
        "重なるタイミングでボタンを押せ！",
        "",
        "PC: [D] [F] [J] [K] キー",
        "スマホ: 画面の4つのレーンをタップ",
        "",
        "※A/B/十字キーでも代用可能。"
      ]
    },
    {
      title: "レトロ・スロット",
      lines: [
        "【ジャンル】カジノゲーム",
        "",
        "PRO仕様に進化した本格スロット！",
        "全5ラインが常に有効で、BET数に",
        "応じて当たった時の配当が倍増するぞ。",
        "",
        "[操作方法]",
        " BET(↑) : BET数の変更(ループ)",
        " MAX(B) : MAX BET(3枚賭け)",
        " SPIN(A): スピン ＆ リール停止",
        "",
        "[特殊絵柄]",
        " [W] : 全ての通常絵柄の代用になる",
        " [F] : 3つで10回のフリースピン！",
        " [王冠]: 3つでジャックポット！！"
      ]
    },
    {
      title: "システム機能について",
      lines: [
        "【ローカルランキング】",
        "ゲームのハイスコアを記録します。",
        "Aボタンでプレイヤー名の変更が可能。",
        "",
        "【設定】",
        "画面の背景テーマを変更できます。",
        "",
        "【データ引継ぎ】",
        "セーブデータを「ふっかつのじゅもん」",
        "として文字列化し、コピーできます。",
        "別の端末で入力すればデータが復元！"
      ]
    }
  ],

  init() { this.st = 'list'; this.cur = 0; this.scroll = 0; },
  update() {
    if (this.st === 'list') {
      if (keysDown.select) { switchApp(Menu); return; }
      if (keysDown.down) { this.cur = (this.cur + 1) % this.pages.length; playSnd('sel'); }
      if (keysDown.up) { this.cur = (this.cur - 1 + this.pages.length) % this.pages.length; playSnd('sel'); }
      if (keysDown.a) { this.st = 'detail'; this.scroll = 0; playSnd('jmp'); }
    } else if (this.st === 'detail') {
      if (keysDown.b || keysDown.select) { this.st = 'list'; playSnd('sel'); return; }
      if (keys.down) { this.scroll += 2; }
      if (keys.up) { this.scroll -= 2; }
      const maxScroll = Math.max(0, this.pages[this.cur].lines.length * 15 - 150);
      this.scroll = Math.max(0, Math.min(this.scroll, maxScroll));
    }
  },
  draw() {
    ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
    if (this.st === 'list') {
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText('【ゲーム解説館】', 45, 30);
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      for (let i = 0; i < this.pages.length; i++) {
        const prefix = (i === this.cur) ? '> ' : '  ';
        ctx.fillStyle = (i === this.cur) ? '#ff0' : '#aaa';
        ctx.fillText(prefix + this.pages[i].title, 20, 70 + i * 25);
      }
      ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('A: 読む  SELECT: 戻る', 35, 280);
    } else if (this.st === 'detail') {
      const page = this.pages[this.cur];
      ctx.fillStyle = '#030'; ctx.fillRect(0, 0, 200, 40);
      ctx.fillStyle = '#0f0'; ctx.font = 'bold 14px monospace'; ctx.fillText(page.title, 10, 25);
      ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(200, 40); ctx.stroke();
      
      ctx.save(); ctx.beginPath(); ctx.rect(0, 41, 200, 230); ctx.clip();
      ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
      for (let i = 0; i < page.lines.length; i++) {
        const y = 60 + i * 15 - this.scroll;
        if (y > 30 && y < 280) { ctx.fillText(page.lines[i], 10, y); }
      }
      ctx.restore();
      
      const maxScroll = Math.max(0, page.lines.length * 15 - 150);
      if (maxScroll > 0) {
        ctx.fillStyle = '#333'; ctx.fillRect(190, 45, 5, 220);
        const barH = Math.max(20, 220 * (220 / (220 + maxScroll)));
        const barY = 45 + (220 - barH) * (this.scroll / maxScroll);
        ctx.fillStyle = '#888'; ctx.fillRect(190, barY, 5, barH);
      }
      ctx.fillStyle = '#888'; ctx.font = '10px monospace'; ctx.fillText('↑↓: スクロール  B: 戻る', 25, 285);
    }
  }
};
