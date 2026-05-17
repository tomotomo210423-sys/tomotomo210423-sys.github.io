// === CURSED MANOR V10 — DARKNESS REBORN ===

function playHSnd(t, param) {
    if (!audioCtx || SaveSys.data.seVol <= 0) return;
    let n = audioCtx.currentTime, vol = SaveSys.data.seVol;
    let o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (t === 'heart') {
        o.type = 'sine'; o.frequency.setValueAtTime(40, n); o.frequency.exponentialRampToValueAtTime(10, n+0.3);
        g.gain.setValueAtTime(0.8*vol, n); g.gain.exponentialRampToValueAtTime(0.01, n+0.3);
        o.start(n); o.stop(n+0.3);
    } else if (t === 'roar') {
        o.type = 'sawtooth'; o.frequency.setValueAtTime(120, n); o.frequency.exponentialRampToValueAtTime(30, n+1.2);
        g.gain.setValueAtTime(0.5*vol, n); g.gain.exponentialRampToValueAtTime(0.01, n+1.2);
        o.start(n); o.stop(n+1.2);
    } else if (t === 'note') {
        o.type = 'triangle'; let freqs = [261.63,293.66,329.63,349.23,392.00,440.00,493.88];
        o.frequency.setValueAtTime(freqs[param]||440, n);
        g.gain.setValueAtTime(0.4*vol, n); g.gain.exponentialRampToValueAtTime(0.01, n+0.5);
        o.start(n); o.stop(n+0.5);
    } else if (t === 'error') {
        o.type = 'square'; o.frequency.setValueAtTime(100, n); o.frequency.setValueAtTime(80, n+0.1);
        g.gain.setValueAtTime(0.3*vol, n); g.gain.linearRampToValueAtTime(0.01, n+0.3);
        o.start(n); o.stop(n+0.3);
    } else if (t === 'open') {
        o.type = 'square'; o.frequency.setValueAtTime(300, n); o.frequency.exponentialRampToValueAtTime(50, n+0.2);
        g.gain.setValueAtTime(0.2*vol, n); g.gain.linearRampToValueAtTime(0.01, n+0.2);
        o.start(n); o.stop(n+0.2);
    } else if (t === 'type') {
        o.type = 'square'; o.frequency.setValueAtTime(800, n); o.frequency.exponentialRampToValueAtTime(300, n+0.05);
        g.gain.setValueAtTime(0.05*vol, n); g.gain.linearRampToValueAtTime(0.01, n+0.05);
        o.start(n); o.stop(n+0.05);
    }
}

const diaryStory = [
    ["【×月×日】","あの館の主は狂っている。","『永遠の命』などと嘯きながら、","迷い込んだ者たちを次々と","地下室の実験台にしているのだ。","隠し金庫の暗証番号は...奴の異常な","絵画の数、『目・指・首』の順だ。"],
    ["【△月〇日】","地下から恐ろしい呻き声がする。","肉が裂け、骨が軋む音...","奴はついに自らの体で実験を始めた。","隠し扉の仕掛けは呪われたピアノ。","『ド・ミ・ファ・ソ』と弾けば開くが、","間違えれば、奴が飛んでくるぞ。"],
    ["【？月？日】","配電盤さえ直せれば外に出られる。","だが、もう遅いかもしれない。","巨大な肉塊と化した『元・館の主』が","今もこの廊下を徘徊している。","お願いだ、これを読んだなら、","私の代わりに生きて脱出してくれ..."]
];

const Horror = {
    st: 'menu', timer: 0,
    camX: 0, camY: 0,
    p: { x: 30, y: 30, r: 6, spd: 1.4, isHide: false },
    e: { x: 350, y: 350, r: 8, spd: 1.0, state: 'patrol', alert: 0, path: [] },
    keys: 0, maxKeys: 3, diaries: 0,
    msg: '', msgTimer: 0,
    failCount: 0, needsPath: false, hideTimer: 0,
    ripples: [], // footstep ripples

    bgmOsc: null, bgmGain: null, bgmLfo: null,

    startBGM() {
        if (!audioCtx || SaveSys.data.bgmVol <= 0) return;
        if (typeof BGM !== 'undefined') BGM.stop();
        this.stopBGM();
        let n = audioCtx.currentTime;
        this.bgmOsc = audioCtx.createOscillator(); this.bgmOsc.type = 'sine'; this.bgmOsc.frequency.setValueAtTime(45, n);
        this.bgmGain = audioCtx.createGain(); this.bgmGain.gain.setValueAtTime(0.4*SaveSys.data.bgmVol, n);
        this.bgmLfo = audioCtx.createOscillator(); this.bgmLfo.type = 'sine'; this.bgmLfo.frequency.setValueAtTime(0.15, n);
        let lfoGain = audioCtx.createGain(); lfoGain.gain.setValueAtTime(0.2*SaveSys.data.bgmVol, n);
        this.bgmLfo.connect(lfoGain); lfoGain.connect(this.bgmGain.gain);
        this.bgmOsc.connect(this.bgmGain); this.bgmGain.connect(audioCtx.destination);
        this.bgmOsc.start(n); this.bgmLfo.start(n);
    },

    stopBGM() {
        if (this.bgmOsc) { try{this.bgmOsc.stop();}catch(e){} this.bgmOsc.disconnect(); this.bgmOsc = null; }
        if (this.bgmLfo) { try{this.bgmLfo.stop();}catch(e){} this.bgmLfo.disconnect(); this.bgmLfo = null; }
        if (this.bgmGain) { this.bgmGain.disconnect(); this.bgmGain = null; }
    },

    pzSafe: [0,0,0], pzSafeCur: 0,
    pzPiano: [], pzPianoAns: [0,2,3,4], pzPianoCur: 0,
    pzPanel: 0,
    novelDiaryIdx: 0, novelLine: 0, novelChar: 0, novelTimer: 0,
    mapW: 20, mapH: 20, ts: 20,

    baseMap: [
        1,1,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,1,6,0,0,0,0,0,0,0,1,0,0,0,0,1,
        1,0,3,0,0,1,0,1,1,1,1,1,1,0,1,0,3,0,0,1,
        1,0,0,0,0,0,0,1,0,0,0,9,1,0,1,1,1,0,0,1,
        1,1,1,0,1,1,0,1,0,3,0,0,1,0,0,0,0,0,8,1,
        1,0,0,0,1,0,0,1,1,1,0,1,1,1,1,1,1,1,0,1,
        1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,
        1,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1,0,1,
        1,1,1,0,1,0,1,9,0,0,0,0,0,0,0,1,0,1,0,1,
        1,8,1,0,1,0,1,0,3,0,0,0,3,0,0,1,0,1,0,1,
        1,0,1,0,1,0,1,1,1,1,0,1,1,1,1,1,0,1,0,1,
        1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,
        1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,1,0,1,5,0,0,0,0,0,0,0,1,
        1,0,3,0,0,0,3,0,1,0,1,0,0,3,0,0,3,0,0,1,
        1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,1,
        1,7,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    ],
    map: [],

    init() {
        this.st = 'menu'; this.timer = 0;
        this.p = { x: 30, y: 30, r: 6, spd: 1.4, isHide: false };
        this.e = { x: 350, y: 350, r: 8, spd: 1.0, state: 'patrol', alert: 0, path: [] };
        this.keys = 0; this.diaries = 0; this.msg = ''; this.msgTimer = 0;
        this.pzSafe = [0,0,0]; this.pzSafeCur = 0;
        this.pzPiano = []; this.pzPanel = 0;
        this.map = [...this.baseMap];
        this.failCount = 0; this.needsPath = false; this.hideTimer = 0;
        this.ripples = [];
        if (typeof BGM !== 'undefined') BGM.stop();
        this.startBGM();
    },

    setMsg(text) { this.msg = text; this.msgTimer = 150; },

    getTile(x, y) {
        let tx = Math.floor(x/this.ts), ty = Math.floor(y/this.ts);
        if (tx<0||tx>=this.mapW||ty<0||ty>=this.mapH) return 1;
        return this.map[ty*this.mapW+tx];
    },

    colSq(nx, ny, r) {
        for (let pt of [[nx-r+2,ny-r+2],[nx+r-2,ny-r+2],[nx-r+2,ny+r-2],[nx+r-2,ny+r-2]]) {
            let t = this.getTile(pt[0], pt[1]);
            if (t===1||t===2||t===5||t===6||t===7) return true;
        }
        return false;
    },

    canSee(px, py, ex, ey) {
        let dist = Math.hypot(px-ex, py-ey);
        if (dist > 150) return false;
        let steps = dist / 4;
        for (let i = 0; i <= steps; i++) {
            let t = this.getTile(ex+(px-ex)*(i/steps), ey+(py-ey)*(i/steps));
            if (t===1||t===2||t===5||t===6||t===7) return false;
        }
        return true;
    },

    getPath(sx, sy, gx, gy) {
        let stx=Math.floor(sx/this.ts), sty=Math.floor(sy/this.ts);
        let gtx=Math.floor(gx/this.ts), gty=Math.floor(gy/this.ts);
        let q=[{x:stx,y:sty,path:[]}], visited=new Set(); visited.add(stx+','+sty);
        while (q.length>0) {
            let cur=q.shift();
            if (cur.x===gtx&&cur.y===gty) return cur.path;
            for (let [ax,ay] of [[0,-1],[1,0],[0,1],[-1,0]]) {
                let nx=cur.x+ax, ny=cur.y+ay;
                if (nx>=0&&nx<this.mapW&&ny>=0&&ny<this.mapH) {
                    let t=this.map[ny*this.mapW+nx];
                    if (t!==1&&t!==2&&t!==5&&t!==6&&t!==7&&!visited.has(nx+','+ny)) {
                        visited.add(nx+','+ny); q.push({x:nx,y:ny,path:[...cur.path,{x:nx,y:ny}]});
                    }
                }
            }
        }
        return [];
    },

    update() {
        this.timer++;
        let kD = typeof keysDown!=='undefined'?keysDown:{};
        let k  = typeof keys!=='undefined'?keys:{};

        if (this.st === 'menu') {
            if (kD.select) { this.stopBGM(); switchApp(Menu); return; }
            if (kD.a) { this.st='play'; playSnd('jmp'); this.setMsg('3つの謎を解き、鍵を探せ...'); }
            return;
        }
        else if (this.st === 'safe_puzzle') {
            if (kD.b) { this.st='play'; return; }
            if (kD.left)  { this.pzSafeCur=(this.pzSafeCur+2)%3; playSnd('sel'); }
            if (kD.right) { this.pzSafeCur=(this.pzSafeCur+1)%3; playSnd('sel'); }
            if (kD.up)    { this.pzSafe[this.pzSafeCur]=(this.pzSafe[this.pzSafeCur]+1)%10; playSnd('sel'); }
            if (kD.down)  { this.pzSafe[this.pzSafeCur]=(this.pzSafe[this.pzSafeCur]+9)%10; playSnd('sel'); }
            if (kD.a) {
                if (this.pzSafe[0]===3&&this.pzSafe[1]===4&&this.pzSafe[2]===2) {
                    playHSnd('open'); this.keys++; this.failCount=0;
                    this.setMsg('金庫が開いた！ 鍵をゲット！ ('+this.keys+'/'+this.maxKeys+')');
                    this.map[this.targetTy*this.mapW+this.targetTx]=0; this.st='play';
                } else {
                    playHSnd('error'); screenShake(3); this.failCount++;
                    this.setMsg(this.failCount>=3 ? '暗証番号が違う...（ヒント: 3-?-2）' : '暗証番号が違うようだ...');
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'piano_puzzle') {
            if (kD.b) { this.st='play'; return; }
            if (kD.left)  { this.pzPianoCur=(this.pzPianoCur+6)%7; playSnd('sel'); }
            if (kD.right) { this.pzPianoCur=(this.pzPianoCur+1)%7; playSnd('sel'); }
            if (kD.a) {
                this.pzPiano.push(this.pzPianoCur); playHSnd('note', this.pzPianoCur);
                if (this.pzPiano.length>=4) {
                    let ok=true; for(let i=0;i<4;i++) if(this.pzPiano[i]!==this.pzPianoAns[i]) ok=false;
                    if (ok) {
                        setTimeout(()=>playHSnd('open'),500); this.keys++; this.failCount=0;
                        this.setMsg('隠し扉が開いた！ 鍵をゲット！ ('+this.keys+'/'+this.maxKeys+')');
                        this.map[this.targetTy*this.mapW+this.targetTx]=0; this.st='play';
                    } else {
                        playHSnd('error'); screenShake(10); this.failCount++;
                        this.setMsg('不協和音が響き渡った！！'); this.e.alert=100; playHSnd('roar');
                        this.pzPiano=[]; this.st='play';
                    }
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'panel_puzzle') {
            if (kD.b) { this.st='play'; return; }
            if (kD.a) { this.pzPanel+=5; playHSnd('open'); }
            this.pzPanel-=0.5; if (this.pzPanel<0) this.pzPanel=0;
            if (this.pzPanel>=100) {
                playHSnd('open'); this.keys++;
                this.setMsg('電力が復旧した！ 鍵をゲット！ ('+this.keys+'/'+this.maxKeys+')');
                this.map[this.targetTy*this.mapW+this.targetTx]=0; this.st='play';
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'novel') {
            this.novelTimer++;
            let cur = diaryStory[this.novelDiaryIdx][this.novelLine];
            if (this.novelChar<cur.length && this.novelTimer%3===0) { playHSnd('type'); this.novelChar++; }
            if (kD.a||kD.b) {
                if (this.novelChar<cur.length) { this.novelChar=cur.length; }
                else {
                    this.novelLine++; this.novelChar=0; this.novelTimer=0;
                    if (this.novelLine>=diaryStory[this.novelDiaryIdx].length) {
                        this.st='play'; this.map[this.targetTy*this.mapW+this.targetTx]=0; this.diaries++;
                    }
                }
            }
            this.updateEnemyInPuzzle();
        }
        else if (this.st === 'play') {
            if (kD.select) { this.stopBGM(); switchApp(Menu); return; }

            if (!this.p.isHide) {
                let dx=0, dy=0;
                if (k.left) dx=-1; if (k.right) dx=1;
                if (k.up)   dy=-1; if (k.down)  dy=1;
                if (dx!==0&&dy!==0) { dx*=0.707; dy*=0.707; }
                let moved=false;
                let nx=this.p.x+dx*this.p.spd, ny=this.p.y+dy*this.p.spd;
                if (!this.colSq(nx,this.p.y,this.p.r)) { this.p.x=nx; if(dx!==0)moved=true; }
                if (!this.colSq(this.p.x,ny,this.p.r)) { this.p.y=ny; if(dy!==0)moved=true; }
                if (moved) {
                    this.needsPath=true;
                    // Footstep ripple
                    if (this.timer%12===0) this.ripples.push({x:this.p.x, y:this.p.y, r:2, life:20});
                }
                this.hideTimer=0;
            } else {
                // Locker detection: after 300 frames, enemy senses location
                this.hideTimer++;
                if (this.hideTimer>300 && this.e.alert<60) this.e.alert+=0.3;
            }

            // Update ripples
            this.ripples=this.ripples.filter(r=>r.life>0);
            for (let r of this.ripples) { r.r+=1.5; r.life--; }

            if (kD.a) {
                let tx=Math.floor(this.p.x/this.ts), ty=Math.floor(this.p.y/this.ts);
                let tile=this.map[ty*this.mapW+tx];
                for (let [ax,ay] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
                    let ct=this.map[(ty+ay)*this.mapW+(tx+ax)];
                    if (ct>=3&&ct<=9) { tile=ct; tx+=ax; ty+=ay; break; }
                }
                if (this.p.isHide) {
                    this.p.isHide=false; this.hideTimer=0; this.setMsg('ロッカーから出た。'); playHSnd('open');
                } else if (tile===3) {
                    this.p.isHide=true; this.setMsg('ロッカーに息を潜めた...'); playHSnd('open');
                } else if (tile===5) { this.st='piano_puzzle'; this.pzPiano=[]; this.pzPianoCur=0; this.targetTx=tx; this.targetTy=ty; }
                else if (tile===6) { this.st='safe_puzzle'; this.pzSafe=[0,0,0]; this.pzSafeCur=0; this.targetTx=tx; this.targetTy=ty; }
                else if (tile===7) { this.st='panel_puzzle'; this.pzPanel=0; this.targetTx=tx; this.targetTy=ty; }
                else if (tile===8) {
                    let hints=["肖像画：目が『３つ』描かれている","油絵：手が『４本』描かれている","写真：首が『２つ』写っている"];
                    this.setMsg(hints[Math.floor(Math.random()*hints.length)]); playSnd('sel');
                } else if (tile===9) {
                    this.st='novel'; this.novelDiaryIdx=this.diaries; this.novelLine=0; this.novelChar=0; this.novelTimer=0;
                    this.targetTx=tx; this.targetTy=ty; playSnd('sel');
                } else if (ty<=1&&tile===0&&this.p.y<30) {
                    if (this.keys>=this.maxKeys) { this.st='clear'; playHSnd('open'); this.stopBGM(); }
                    else { this.setMsg('鍵がかかっている...あと'+(this.maxKeys-this.keys)+'個必要だ。'); playHSnd('error'); }
                }
            }

            this.updateEnemyAI();
            if (this.msgTimer>0) this.msgTimer--;
            this.camX=this.p.x-100; this.camY=this.p.y-150;
            if(this.camX<0)this.camX=0; if(this.camY<0)this.camY=0;
            if(this.camX>this.mapW*this.ts-200)this.camX=this.mapW*this.ts-200;
            if(this.camY>this.mapH*this.ts-300)this.camY=this.mapH*this.ts-300;
        }
        else if (this.st === 'jumpscare') {
            if (this.timer===1) { this.stopBGM(); playHSnd('roar'); }
            if (this.timer>80) this.init();
        }
        else if (this.st === 'clear') {
            if (kD.select) { this.stopBGM(); switchApp(Menu); return; }
            if (kD.a||kD.start) this.init();
        }
    },

    updateEnemyInPuzzle() {
        this.updateEnemyAI();
        if (Math.hypot(this.p.x-this.e.x,this.p.y-this.e.y) < this.p.r+this.e.r+5) {
            this.st='jumpscare'; this.timer=0; screenShake(20);
        }
    },

    updateEnemyAI() {
        let dist=Math.hypot(this.p.x-this.e.x,this.p.y-this.e.y);
        let isVisible=this.canSee(this.p.x,this.p.y,this.e.x,this.e.y);
        if (isVisible&&!this.p.isHide) { if(this.e.state!=='chase')playHSnd('roar'); this.e.alert=100; }
        if (this.p.isHide&&this.e.alert>0) this.e.alert-=0.5;

        if (this.timer%5===0 && (this.needsPath||this.e.path.length===0)) {
            this.needsPath=false;
            if (this.e.alert>50&&!this.p.isHide) {
                this.e.state='chase'; this.e.spd=1.2;
                this.e.path=this.getPath(this.e.x,this.e.y,this.p.x,this.p.y);
            } else {
                this.e.state='patrol'; this.e.spd=0.6;
                if (this.e.path.length===0) {
                    let rx=Math.floor(Math.random()*this.mapW)*this.ts+10;
                    let ry=Math.floor(Math.random()*this.mapH)*this.ts+10;
                    if (this.getTile(rx,ry)===0) this.e.path=this.getPath(this.e.x,this.e.y,rx,ry);
                }
            }
        }

        if (this.e.path&&this.e.path.length>0) {
            let nn=this.e.path[0], tX=nn.x*this.ts+this.ts/2, tY=nn.y*this.ts+this.ts/2;
            let edx=tX-this.e.x, edy=tY-this.e.y, el=Math.hypot(edx,edy);
            if (el<this.e.spd) { this.e.path.shift(); }
            else { this.e.x+=edx/el*this.e.spd; this.e.y+=edy/el*this.e.spd; }
        }

        // Heartbeat: distance-based frequency
        let heartRate = dist < 40 ? 8 : dist < 80 ? 20 : Math.max(30, Math.floor(dist/3));
        if (dist<150&&!this.p.isHide&&this.timer%heartRate===0) playHSnd('heart');

        // Gradual jumpscare: 15px = GAME OVER
        if (dist<15&&!this.p.isHide&&this.st==='play') { this.st='jumpscare'; this.timer=0; screenShake(20); }
    },

    drawGhost(x, y) {
        let r=this.e.r, t=this.timer;
        ctx.shadowBlur=12; ctx.shadowColor='#f00';
        ctx.fillStyle=this.e.state==='chase'?'#f00':'#800';
        ctx.beginPath();
        ctx.arc(x, y-r*0.2, r*0.9, Math.PI, 0);
        let waves=4, ww=r*1.8/waves;
        ctx.lineTo(x+r*0.9, y+r*0.8);
        for (let i=waves; i>=0; i--) {
            let wx=x-r*0.9+i*ww;
            let wy=y+r*0.8-Math.sin(t*0.08+i*1.2)*r*0.4;
            ctx.lineTo(wx, wy);
        }
        ctx.closePath(); ctx.fill();
        ctx.shadowBlur=0;
        // Eyes
        ctx.fillStyle=this.e.state==='chase'?'#ff0':'#faa';
        ctx.beginPath(); ctx.arc(x-r*0.3,y-r*0.3,2,0,Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(x+r*0.3,y-r*0.3,2,0,Math.PI*2); ctx.fill();
    },

    drawMinimap() {
        let mw=40, mh=40, mx=158, my=258, sc=mw/this.mapW;
        ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(mx-1,my-1,mw+2,mh+2);
        ctx.strokeStyle='#400'; ctx.strokeRect(mx-1,my-1,mw+2,mh+2);
        for (let y=0; y<this.mapH; y++) {
            for (let x=0; x<this.mapW; x++) {
                let t=this.map[y*this.mapW+x];
                if (t===1) ctx.fillStyle='#422';
                else if (t===2) ctx.fillStyle='#040';
                else ctx.fillStyle='rgba(80,40,40,0.6)';
                ctx.fillRect(mx+x*sc, my+y*sc, sc, sc);
            }
        }
        // Player dot
        ctx.fillStyle='#0f0'; ctx.fillRect(mx+this.p.x/this.ts*sc-1, my+this.p.y/this.ts*sc-1, 2, 2);
        // Enemy dot
        ctx.fillStyle='#f00'; ctx.fillRect(mx+this.e.x/this.ts*sc-1, my+this.e.y/this.ts*sc-1, 2, 2);
    },

    draw() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300);

        if (this.st==='menu') {
            // Candle flicker
            let flicker=0.8+Math.sin(this.timer*0.13)*0.2;
            let cg=ctx.createRadialGradient(100,220,5,100,220,80);
            cg.addColorStop(0,`rgba(255,180,50,${0.35*flicker})`);
            cg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=cg; ctx.fillRect(0,0,200,300);
            // Candle
            ctx.fillStyle='#fa0'; ctx.fillRect(97,222,6,20);
            ctx.fillStyle=`rgba(255,220,80,${flicker})`; ctx.beginPath(); ctx.arc(100,218,4,0,Math.PI*2); ctx.fill();

            // Shadow figure swaying
            let sw=Math.sin(this.timer*0.02)*10;
            ctx.fillStyle='rgba(80,0,0,0.7)';
            ctx.beginPath(); ctx.ellipse(100+sw,90,18,25,0,0,Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(100+sw,130,12,40,sw*0.02,0,Math.PI*2); ctx.fill();

            if (Math.random()<0.04) { ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.fillRect(0,0,200,300); }
            ctx.shadowBlur=15; ctx.shadowColor='#800';
            ctx.fillStyle='#c00'; ctx.font='bold 20px monospace'; ctx.textAlign='center'; ctx.fillText('呪われた洋館',100,80);
            ctx.shadowBlur=0;
            ctx.fillStyle='#f88'; ctx.font='9px monospace'; ctx.fillText('TRUE SURVIVAL HORROR',100,96);
            ctx.fillStyle=this.timer%60<30?'#fcc':'#866'; ctx.fillText('Aボタンで進入...',100,180);
            ctx.fillStyle='#533'; ctx.font='8px monospace'; ctx.fillText('SELECT: メニューに戻る',100,280);
            return;
        }

        if (this.st==='jumpscare') {
            ctx.fillStyle=this.timer%4<2?'#f00':'#000'; ctx.fillRect(0,0,200,300);
            ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(100,150,80,0,Math.PI*2); ctx.fill();
            ctx.strokeStyle='#f00'; ctx.lineWidth=2;
            for (let i=0;i<20;i++) { ctx.beginPath(); ctx.moveTo(100,150); ctx.lineTo(100+(Math.random()-0.5)*200,150+(Math.random()-0.5)*200); ctx.stroke(); }
            ctx.fillStyle='#fff'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.fillText('YOU ARE DEAD...',100,220);
            return;
        }

        if (this.st==='clear') {
            ctx.fillStyle='#000'; ctx.fillRect(0,0,200,300);
            ctx.shadowBlur=12; ctx.shadowColor='#0f0';
            ctx.fillStyle='#0f0'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.fillText('脱出成功！',100,90);
            ctx.shadowBlur=0;
            if (this.diaries>=3) {
                ctx.fillStyle='#ff0'; ctx.font='11px monospace'; ctx.fillText('TRUE ENDING',100,120);
                ctx.fillStyle='#fff'; ctx.font='9px monospace'; ctx.fillText('全ての日記を読み、恐ろしい真相を知った...',100,145);
            } else {
                ctx.fillStyle='#888'; ctx.font='11px monospace'; ctx.fillText('NORMAL ENDING',100,120);
                ctx.fillStyle='#aaa'; ctx.font='9px monospace'; ctx.fillText('生き延びたが、真相は闇の中だ...',100,145);
            }
            ctx.fillStyle='#555'; ctx.font='8px monospace'; ctx.fillText('A: 再挑戦   SELECT: メニュー',100,280);
            return;
        }

        ctx.save();
        ctx.translate(-this.camX,-this.camY);

        for (let y=0; y<this.mapH; y++) {
            for (let x=0; x<this.mapW; x++) {
                let px=x*this.ts, py=y*this.ts;
                if (px<this.camX-this.ts||px>this.camX+200||py<this.camY-this.ts||py>this.camY+300) continue;
                let t=this.map[y*this.mapW+x];
                ctx.fillStyle='#1a0d0d'; ctx.fillRect(px,py,this.ts,this.ts);
                if (t===1) {
                    let g=ctx.createLinearGradient(px,py,px,py+this.ts);
                    g.addColorStop(0,'#3a2020'); g.addColorStop(0.4,'#251414'); g.addColorStop(1,'#0d0808');
                    ctx.fillStyle=g; ctx.fillRect(px,py,this.ts,this.ts);
                    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=0.5; ctx.strokeRect(px,py,this.ts,this.ts);
                    ctx.strokeStyle='rgba(70,20,20,0.3)';
                    ctx.beginPath(); ctx.moveTo(px,py+this.ts/2); ctx.lineTo(px+this.ts,py+this.ts/2); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(px+this.ts/2,py); ctx.lineTo(px+this.ts/2,py+this.ts/2); ctx.stroke();
                } else if (t===2) { ctx.fillStyle='#0a3010'; ctx.fillRect(px,py,this.ts,this.ts); ctx.fillStyle='#0f0'; ctx.font='7px monospace'; ctx.fillText('EXIT',px+2,py+12); }
                else if (t===3) { ctx.fillStyle='#1a3050'; ctx.fillRect(px+2,py+2,this.ts-4,this.ts-4); ctx.fillStyle='#0d2240'; ctx.fillRect(px+4,py+4,4,12); ctx.fillRect(px+12,py+4,4,12); }
                else if (t===5) { ctx.fillStyle='#110d08'; ctx.fillRect(px,py+5,20,15); ctx.fillStyle='#f0f0e0'; ctx.fillRect(px+2,py+10,16,5); }
                else if (t===6) { ctx.fillStyle='#555'; ctx.fillRect(px+2,py+2,16,16); ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(px+10,py+10,4,0,Math.PI*2); ctx.fill(); }
                else if (t===7) { ctx.fillStyle='#600'; ctx.fillRect(px+4,py,12,20); ctx.fillStyle='#ff0'; ctx.fillRect(px+8,py+8,4,4); }
                else if (t===8) { ctx.fillStyle='#432'; ctx.fillRect(px+2,py,16,4); ctx.fillStyle='#800'; ctx.fillRect(px+4,py+1,12,2); }
                else if (t===9) { ctx.fillStyle='#ccc'; ctx.fillRect(px+5,py+5,10,10); ctx.fillStyle='#f00'; ctx.fillRect(px+7,py+7,6,2); }
            }
        }

        // Footstep ripples
        for (let r of this.ripples) {
            let alpha=r.life/20*0.4;
            ctx.strokeStyle=`rgba(180,100,100,${alpha})`; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,Math.PI*2); ctx.stroke();
        }

        // Enemy ghost
        this.drawGhost(this.e.x, this.e.y);

        // Player sprite
        if (!this.p.isHide) {
            let px=this.p.x, py=this.p.y;
            ctx.fillStyle='#fcc'; ctx.beginPath(); ctx.arc(px,py-4,4,0,Math.PI*2); ctx.fill();
            ctx.fillStyle='#48a'; ctx.fillRect(px-3,py,6,8);
            ctx.fillStyle='#fcc'; ctx.fillRect(px-5,py+1,3,6); ctx.fillRect(px+2,py+1,3,6);
            ctx.fillStyle='#333'; ctx.fillRect(px-3,py+8,3,6); ctx.fillRect(px+1,py+8,3,6);
        } else {
            // Show shadow in locker
            ctx.fillStyle='rgba(60,100,150,0.5)';
            let lx=Math.floor(this.p.x/this.ts)*this.ts;
            let ly=Math.floor(this.p.y/this.ts)*this.ts;
            ctx.fillRect(lx+2,ly+2,this.ts-4,this.ts-4);
        }

        ctx.restore();

        // Darkness overlay (radial visibility)
        let plx=this.p.x-this.camX, ply=this.p.y-this.camY;
        let darkG=ctx.createRadialGradient(plx,ply,35,plx,ply,130);
        darkG.addColorStop(0,'rgba(0,0,0,0)');
        darkG.addColorStop(0.6,'rgba(0,0,0,0.5)');
        darkG.addColorStop(1,'rgba(0,0,0,0.97)');
        ctx.fillStyle=darkG; ctx.fillRect(0,0,200,300);

        // Distance-based vignette
        let dist=Math.hypot(this.p.x-this.e.x,this.p.y-this.e.y);
        if (dist<80&&!this.p.isHide) {
            let intensity=1-(dist/80);
            let pulse=(Math.sin(this.timer*0.15*(dist<40?2:1))+1)/2;
            // Edge vignette
            let vig=ctx.createRadialGradient(100,150,50,100,150,160);
            vig.addColorStop(0,'rgba(255,0,0,0)');
            vig.addColorStop(1,`rgba(255,0,0,${pulse*intensity*0.55})`);
            ctx.fillStyle=vig; ctx.fillRect(0,0,200,300);
        }

        // Puzzles UI
        if (this.st==='safe_puzzle') {
            ctx.fillStyle='rgba(0,0,0,0.92)'; ctx.fillRect(20,100,160,100);
            ctx.strokeStyle='#888'; ctx.strokeRect(20,100,160,100);
            ctx.fillStyle='#ff0'; ctx.font='10px monospace'; ctx.textAlign='left'; ctx.fillText('ダイヤル式金庫',55,120);
            ctx.font='24px monospace';
            for (let i=0;i<3;i++) {
                let sel=i===this.pzSafeCur;
                if (sel) { ctx.shadowBlur=8; ctx.shadowColor='#0ff'; }
                ctx.fillStyle=sel?'#0ff':'#fff'; ctx.fillText(this.pzSafe[i],60+i*30,160);
                ctx.shadowBlur=0;
                if (sel) { ctx.font='10px monospace'; ctx.fillText('▲',62+i*30,178); ctx.fillText('▼',62+i*30,138); ctx.font='24px monospace'; }
            }
            // Hint after 3 failures: glow the correct digit
            if (this.failCount>=3) {
                ctx.fillStyle='rgba(255,255,0,0.15)';
                ctx.fillRect(50,125,30,42); // hint: first digit glow = 3
                ctx.fillStyle='#888'; ctx.font='8px monospace'; ctx.fillText('!',52,175);
            }
            ctx.fillStyle='#aaa'; ctx.font='9px monospace'; ctx.fillText('A: 決定   B: 戻る',55,190);
        }
        else if (this.st==='piano_puzzle') {
            ctx.fillStyle='rgba(0,0,0,0.92)'; ctx.fillRect(10,100,180,100);
            ctx.strokeStyle='#888'; ctx.strokeRect(10,100,180,100);
            ctx.fillStyle='#ff0'; ctx.font='10px monospace'; ctx.textAlign='left'; ctx.fillText('呪われたピアノ',60,120);
            for (let i=0;i<7;i++) {
                let sel=i===this.pzPianoCur;
                let isHint=this.failCount>=3&&(i===0||i===2||i===3||i===4);
                ctx.fillStyle=sel?'#888':'#fff'; ctx.fillRect(25+i*22,130,20,40);
                ctx.strokeStyle='#000'; ctx.strokeRect(25+i*22,130,20,40);
                if (isHint) {
                    ctx.fillStyle='rgba(255,255,0,0.3)'; ctx.fillRect(25+i*22,130,20,40);
                }
            }
            ctx.fillStyle='#0f0'; ctx.beginPath(); ctx.arc(35+this.pzPianoCur*22,180,4,0,Math.PI*2); ctx.fill();
            let notes=["ド","レ","ミ","ファ","ソ","ラ","シ"];
            ctx.fillStyle='#0ff'; ctx.font='10px monospace'; ctx.fillText('入力: '+this.pzPiano.map(n=>notes[n]).join(' '),25,190);
        }
        else if (this.st==='panel_puzzle') {
            ctx.fillStyle='rgba(0,0,0,0.92)'; ctx.fillRect(20,100,160,100);
            ctx.strokeStyle='#888'; ctx.strokeRect(20,100,160,100);
            ctx.fillStyle='#f44'; ctx.font='10px monospace'; ctx.textAlign='left'; ctx.fillText('配電盤の修理！',55,120);
            ctx.fillStyle='#aaa'; ctx.fillText('Aボタン連打で電力を送れ！',25,140);
            ctx.fillStyle='#222'; ctx.fillRect(30,155,140,15);
            let barCol=this.pzPanel>80?'#ff4':this.pzPanel>40?'#fa0':'#0f0';
            ctx.fillStyle=barCol; ctx.fillRect(30,155,140*(this.pzPanel/100),15);
            ctx.strokeStyle='#555'; ctx.strokeRect(30,155,140,15);
        }
        else if (this.st==='novel') {
            ctx.fillStyle='rgba(0,0,0,0.85)'; ctx.fillRect(0,0,200,300);
            ctx.strokeStyle='#800'; ctx.lineWidth=2; ctx.strokeRect(5,148,190,147); ctx.lineWidth=1;
            ctx.fillStyle='rgba(18,0,0,0.95)'; ctx.fillRect(5,148,190,147);
            ctx.font='10px monospace'; ctx.textAlign='left';
            let y=168;
            for (let i=0;i<this.novelLine;i++) { ctx.fillStyle='#c88'; ctx.fillText(diaryStory[this.novelDiaryIdx][i],14,y); y+=18; }
            let cur=diaryStory[this.novelDiaryIdx][this.novelLine];
            ctx.fillStyle='#fcc'; ctx.fillText(cur.substring(0,this.novelChar),14,y);
            if (this.novelChar>=cur.length) {
                ctx.fillStyle=this.timer%30<15?'#ff0':'rgba(0,0,0,0)'; ctx.fillText('▼ Aボタン',130,280);
            }
        }

        // HUD
        if (this.st==='play'||this.st.includes('puzzle')||this.st==='novel') {
            ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,200,18);
            ctx.fillStyle='#ff0'; ctx.font='9px monospace'; ctx.textAlign='left';
            ctx.fillText('鍵: '+this.keys+'/'+this.maxKeys, 5, 13);
            if (this.msgTimer>0) {
                ctx.fillStyle='rgba(0,0,0,0.8)'; ctx.fillRect(0,258,200,30);
                ctx.fillStyle='#fff'; ctx.font='9px monospace'; ctx.textAlign='center';
                ctx.fillText(this.msg,100,278);
            }
        }

        // Minimap
        if (this.st==='play') this.drawMinimap();
    }
};
