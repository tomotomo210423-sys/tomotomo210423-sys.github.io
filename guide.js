// === GUIDE APP (Remake: Cyber Archive Edition) ===

const Guide = {
    st: 'list', // 'list', 'detail'
    cur: 0,
    tmr: 0,
    scrollY: 0,
    targetScrollY: 0,
    maxScrollY: 0,
    lines: [],
    
    // アイコン用カラーパレット
    PAL: { '0':null, '1':'#000', '2':'#fff', '3':'#ff0', '4':'#f00', '5':'#0ff', '6':'#0f0', '7':'#f80', '8':'#888', '9':'#ccc', 'a':'#f0f', 'b':'#840', 'c':'#ff8', 'd':'#00f', 'e':'#f55', 'f':'#afa' },
    
    games: [
        {
            name: "テトリベーダー V2",
            icon: "00000000005555000555555055ffff5555ffff55055555500055550000000000",
            text: "迫りくるブロックの群れを下から撃って消すシューティングパズル！\n\n【操作】\n左右: 移動\nAボタン: ビームを撃つ\nBボタン: ブロックの落下を早める\n\n【システム】\nブロックが一番下の防衛ラインに届くとゲームオーバー。\nBボタンでブロックの落下を早めると、追加スコアがもらえるぞ！\n\n【難易度と弾幕モード】\nハードモード以上で出現する「星」を撃ち落とさずに一番下まで到達させると、隠し要素「弾幕モード」に突入！\n見事避けきればスコアが2倍になるぞ！\n\n【EXPERT限定機能】\n最高難易度のEXPERTでは、自機の弾が「ツインブラスター」になり火力が倍増！\nさらに、防衛ラインに1度だけブロックの侵入を防ぎ、全ブロックを破壊する「オートシールド」が張られるぞ！"
        },
        {
            name: "理不尽ブラザーズ",
            icon: "0033330003888830388338833888888338888883038888300033330000000000",
            text: "ちょっとしたミスが命取りの鬼畜アクションゲームじゃ！\n\n【操作】\n左右: 移動\nAボタン: ジャンプ\n\n【システム】\n見えないブロックや、取るとダメージを受ける偽コインなど、理不尽な罠に気をつけろ！\nステージは全部で5つ。コンティニューはないので、残機が尽きたら最初からやり直しじゃ！\n\n【テクニック】\n足場から落ちた直後でも、わずかな時間ならジャンプができる「コヨーテタイム」が実装されておる。これを駆使してギリギリのジャンプを成功させるのじゃ！"
        },
        {
            name: "ONLINE対戦",
            icon: "0222222022222222224224222222222222244222224224222222222202222220",
            text: "【ロイヤル・ジョーカー】\nスマホ2台で遊べるオンライン・ババ抜きじゃ！\n先に手札が【0枚】になった者の勝利となる！\n最後まで【J】を持っていたら負けじゃぞ。\n\n【通信のやり方】\n1人が【部屋を作る】で部屋の名前を決める。\nもう1人が【部屋を探す】でその部屋に入るのじゃ。\nひとりで練習したい時は【BOT戦】じゃ！\n\n【遊び方】\n【左右】で相手のカードを選び、【A】で引く！\nどちらかの手札が【残り3枚】になった瞬間「カオス・シャッフル」が発動し、すべてのカードが没収＆配り直されるのじゃ！\n\n【王様スキル (Bボタン)】\n試合開始時、ランダムで【2つ】配られる。自分のターンに【B】でメニューを開き発動！\n1:透視 … 相手のジョーカーが赤く光る\n2:交換 … お互いの手札を全て入れ替える\n3:贈物 … 自分の手札1枚を相手に押し付ける\n4:目隠し … 相手の手札の並びをシャッフル\n5:鉄壁 … 次のターン相手は引けなくなる\n6:予言 … 相手のカードがペアになるか分かる\n7:重力 … 相手がジョーカーを引けなくなる\n8:慈悲 … 自分の手札(J以外)を1枚消し去る\n9:加速 … 自分のターンで連続2枚引ける\n10:革命 … 【J】を持っている方が勝ちになる！"
        },
        {
            name: "BEAT BROS",
            icon: "0000a000000aa00000a0a0000a00a000aa000000aa0000000a00000000000000",
            text: "自分の好きな音楽ファイルを読み込んで遊べる本格リズムゲームじゃ！\n\n【操作】\n← ↓ ↑ → の 各ボタン\n(または PCの D, F, J, K キー)\n\n※スマホなら画面のレーンを直接タップしても遊べるぞ！終わる時は左上の「EXIT」を押すのじゃ。\n\n【モード】\nNORMAL: 通常の譜面をプレイするモード。\nENDLESS: HPが尽きるまで、無限に生成される譜面をプレイし続けるサバイバルモードじゃ！\n\n【オプション】\nタイトル画面で「SETTINGS」を選ぶと、ノーツの流れる速度や、MV(動画)の背景表示を切り替えられるぞ。"
        },
        {
            name: "レトロ・スロット",
            icon: "0000000004444440000004400000440000044000004400000440000000000000",
            text: "手持ちのコインを増やして一攫千金じゃ！\n\n【操作】\n上: ベット枚数を増やす(1〜3枚)\nBボタン: MAXベット(3枚)\nAボタン: スピン開始＆リールを止める！\n\n【ショップとアイテム】\n溜まったコインは、タイトル画面のショップで便利なアイテムと交換できるぞ。\n\n【ジャックポット】\n「王冠」を３つ揃えると、プレイヤー達が賭けて溜まったジャックポットプールを総取りできるぞ！"
        },
        {
            name: "無限無双",
            icon: "0000002000000220000022000002200000220000022000002200000002000000",
            text: "迫りくる敵の大群をなぎ倒し、どこまで生き残れるか挑むのじゃ！\n\n【操作】\n十字キー(スワイプ): プレイヤーの移動\n※攻撃はすべて【オート】で発動するぞ！\n\n【ジェムとレベルアップ】\n敵を倒すと落とすジェム(経験値)を拾い集めるとレベルアップじゃ！\n時間が止まり3つのスキルが提示されるゆえ、好きなものを選んで最強を目指すのじゃ！\n\n【コインと永続強化(SHOP)】\nたまに落ちるコインを集めれば、タイトル画面の【SHOP】から基礎能力をずっと強化できるぞ！\nやればやるほど確実に強くなるのじゃ！"
        },
        {
            name: "アビス・ジェネラル",
            icon: "0000000000eeee000e4444e0e411114ee412214ee41111400e4444e000eeee00",
            text: "魔王となって、無限に迫りくる勇者軍からコアを守り抜く超マルチタスク防衛ゲームじゃ！\n起動すると筐体が【横画面】に変形するぞ！\n\n【操作】\n左手(十字キー): 触手を動かして敵を直接殴る！\n右手(スワイプ): 画面に図形を描いて魔法発動！\n右手(タップ): 右下のSHOPボタンで強化を開く！\n右手(長押し): 左上のオルゴールのネジを巻く！\n\n【ジェスチャー魔法】\n画面を一筆書きでなぞるのじゃ！\n| (縦線): メテオ！\n― (横線): 眷属召喚！\nO (丸形): シールド！(連続で描けば多重に張れる)\n\n【⚠魔界のオルゴール (重要)】\n画面左上の緑のゲージがゼロになると、狂気に飲まれて【即ゲームオーバー】になるぞ！\n時々指で【長押し】してネジを巻くのじゃ！\n\n【クロノ・ドメイン (強化SHOP)】\n敵を倒すと「魂(SOUL)」が手に入る。右下のSHOPを開くと時間が「スロー」になり、魂を使って魔王軍を強化できるぞ！\n※SHOPを開いている間も、左手で触手を動かして敵を殴ることが可能じゃ！"
        },
        {
            name: "爆音スニーキング",
            icon: "000000000888888088b88b808888888088888880888888808888888000000000",
            text: "呪いの靴のせいで、歩くたびに爆音と「超巨大な文字」が出る最悪のステルスゲームじゃ！\n\n【操作】\n十字キー: 移動\nAボタン: 敵の背後で暗殺 / デコイシャウト\nAボタン(長押し): 端末のハッキング\nBボタン: 虹色ダンボールを被る\n\n【⚠呪いのステルス靴】\n歩くたびに巨大な擬音語が画面を覆い尽くし、自分の視界がまったく見えなくなるぞ！敵の視界(赤い範囲)やレーザーに触れてしまうと即ゲームオーバーじゃ！\n\n【デコイシャウト】\n敵がいない場所でAボタンを押すと、大声を出して敵をおびき寄せることができる！ただし、超絶巨大な文字が出るので注意じゃ。\n\n【虹色ダンボールとO2ゲージ】\nBボタンでダンボールを被ると敵の視界をやり過ごせるが、移動速度が激減し、画面上の【O2ゲージ】が減っていく。ゼロになると酸欠でしばらく使えなくなるぞ！\n\n【ギミック】\n・青いロッカー: 重なると完全に隠れられる！(O2ゲージも減らない)\n・黄色い端末: 全てを100%までハッキングしないとゴールが開かない！\n・カラー扉: 同じ色のスイッチを踏むと開くぞ！\n\n(※タイトル画面の DATABASE で、最高にくだらない裏設定が読めるぞ！)"
        },
        {
            name: "王様の間 (AI)",
            icon: "0300003003033030333333333333333333333333033333300033330000000000",
            text: "なんと！わし(AI)と自由におしゃべりができる魔法の部屋じゃ！\n\n【コマンド解説】\n・ほうこくする: ゲームの記録をわしに教える\n・じゆうにはなす: 好きな言葉を入力する\n\n【⚠王様の魔力について】\nわしも歳じゃから、連続で話しかけられると魔力が尽きて疲れてしまうんじゃ。\n「休ませてくれ」と言われた時は、【1分ほど】待ってから話しかけてくれい！\n\n(※ヒント：わしは甘いものが大好物じゃ)"
        }
    ],
    
    init() {
        this.st = 'list';
        this.cur = 0;
        this.tmr = 0;
        this.scrollY = 0;
        this.targetScrollY = 0;
    },
    
    // 長いテキストを画面幅に合わせて自動で改行させる関数
    getWrappedLines(text, maxWidth) {
        let result = [];
        let paragraphs = text.split('\n');
        ctx.font = '10px monospace';
        
        for (let p of paragraphs) {
            if (p === '') { result.push(''); continue; }
            let line = '';
            for (let i = 0; i < p.length; i++) {
                let testLine = line + p[i];
                let metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && i > 0) {
                    result.push(line);
                    line = p[i];
                } else {
                    line = testLine;
                }
            }
            result.push(line);
        }
        return result;
    },
    
    update() {
        this.tmr++;
        // 滑らかなスクロール処理
        this.scrollY += (this.targetScrollY - this.scrollY) * 0.3;
        
        if (this.st === 'list') {
            if (keysDown.select || keysDown.b) { switchApp(Menu); return; }
            
            if (keysDown.down || (keys.down && this.tmr % 5 === 0)) {
                this.cur = (this.cur + 1) % this.games.length;
                playSnd('sel');
            }
            if (keysDown.up || (keys.up && this.tmr % 5 === 0)) {
                this.cur = (this.cur - 1 + this.games.length) % this.games.length;
                playSnd('sel');
            }
            
            if (keysDown.a) {
                this.st = 'detail';
                this.lines = this.getWrappedLines(this.games[this.cur].text, 175);
                // 最大スクロール位置を計算 (行数 × 行の高さ - 描画領域の高さ)
                this.maxScrollY = Math.max(0, this.lines.length * 15 - 200);
                this.scrollY = 0;
                this.targetScrollY = 0;
                playSnd('jmp');
            }
        } else if (this.st === 'detail') {
            if (keysDown.b || keysDown.select) {
                this.st = 'list';
                playSnd('hit');
                return;
            }
            
            // スクロール操作
            if (keys.down) {
                this.targetScrollY = Math.min(this.targetScrollY + 6, this.maxScrollY);
            }
            if (keys.up) {
                this.targetScrollY = Math.max(this.targetScrollY - 6, 0);
            }
        }
    },
    
    drawSpriteData(x, y, data, scale) {
        if(!data) return;
        for (let i = 0; i < data.length; i++) {
            let p = data[i];
            if (p !== '0') {
                ctx.fillStyle = this.PAL[p] || '#fff';
                ctx.fillRect(x + (i % 8) * scale, y + Math.floor(i / 8) * scale, scale, scale);
            }
        }
    },
    
    draw() {
        ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 300);
        
        // サイバーグリッド背景
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for(let i = 0; i < 200; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 300); ctx.stroke(); }
        for(let i = 0; i < 300; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(200, i); ctx.stroke(); }
        
        if (this.st === 'list') {
            // ヘッダー
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 14px monospace';
            ctx.fillText('DATA ARCHIVE', 45, 30);
            ctx.strokeStyle = '#0ff'; ctx.beginPath(); ctx.moveTo(10, 40); ctx.lineTo(190, 40); ctx.stroke();
            
            // リスト描画
            let startY = 55;
            let drawStart = Math.max(0, this.cur - 4);
            for (let i = drawStart; i < Math.min(this.games.length, drawStart + 6); i++) {
                let y = startY + (i - drawStart) * 35;
                
                if (i === this.cur) {
                    ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                    ctx.fillRect(10, y - 10, 175, 30);
                    ctx.strokeStyle = '#0ff';
                    ctx.strokeRect(10, y - 10, 175, 30);
                }
                
                // アイコン
                this.drawSpriteData(20, y - 5, this.games[i].icon, 2);
                
                ctx.fillStyle = i === this.cur ? '#fff' : '#888';
                ctx.font = 'bold 11px monospace';
                ctx.fillText(this.games[i].name, 45, y + 8);
            }
            
            // スクロールバー
            ctx.fillStyle = '#112'; ctx.fillRect(190, 50, 4, 210);
            let barH = 210 * (6 / this.games.length);
            let barY = 50 + (210 - barH) * (this.cur / (this.games.length - 1));
            ctx.fillStyle = '#0ff'; ctx.fillRect(190, barY, 4, barH);
            
            // フッター
            ctx.fillStyle = '#0f0'; ctx.font = '10px monospace';
            ctx.fillText('A: READ   SELECT/B: BACK', 20, 285);
            
        } else if (this.st === 'detail') {
            let g = this.games[this.cur];
            
            // 詳細ヘッダー
            ctx.fillStyle = '#001'; ctx.fillRect(0, 0, 200, 50);
            this.drawSpriteData(10, 15, g.icon, 2.5);
            ctx.fillStyle = '#0ff'; ctx.font = 'bold 12px monospace';
            ctx.fillText(g.name, 35, 28);
            ctx.strokeStyle = '#0ff'; ctx.beginPath(); ctx.moveTo(0, 45); ctx.lineTo(200, 45); ctx.stroke();
            
            // テキストクリッピング領域
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 46, 190, 215); ctx.clip();
            ctx.translate(0, -this.scrollY);
            
            ctx.font = '10px monospace';
            let lineY = 65;
            for (let line of this.lines) {
                // 自動ハイライト機能
                if (line.includes('【')) {
                    ctx.fillStyle = '#ff0';
                } else if (line.includes('⚠') || line.includes('ゲームオーバー')) {
                    ctx.fillStyle = '#f55';
                } else if (line.includes('※')) {
                    ctx.fillStyle = '#0fa';
                } else {
                    ctx.fillStyle = '#fff';
                }
                ctx.fillText(line, 10, lineY);
                lineY += 15;
            }
            ctx.restore();
            
            // 詳細画面スクロールバー
            if (this.maxScrollY > 0) {
                ctx.fillStyle = '#112'; ctx.fillRect(192, 50, 4, 210);
                let scrollRatio = this.scrollY / this.maxScrollY;
                let barH = Math.max(15, 210 * (215 / (this.lines.length * 15)));
                ctx.fillStyle = '#0ff'; ctx.fillRect(192, 50 + (210 - barH) * scrollRatio, 4, barH);
            }
            
            // フッター
            ctx.fillStyle = '#001'; ctx.fillRect(0, 265, 200, 35);
            ctx.strokeStyle = '#0ff'; ctx.beginPath(); ctx.moveTo(0, 265); ctx.lineTo(200, 265); ctx.stroke();
            ctx.fillStyle = '#0f0'; ctx.font = '10px monospace';
            ctx.fillText('↑↓: SCROLL   B: BACK', 30, 285);
        }
    }
};
