// js/audio.js
(function(window){
  const AudioManager = {
    ctx: null,
    bgmGain: null,
    init(){
      if(this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.14;
      this.bgmGain.connect(this.ctx.destination);
      this._startBgmLoop();
    },
    _startBgmLoop(){
      const ctx = this.ctx;
      const base = [110,146.83,164.81,220]; // low drone notes
      const step = 1.2;
      let t0 = ctx.currentTime + 0.05;
      const scheduleChunk = ()=>{
        for(let i=0;i<base.length;i++){
          const t = t0 + i*step;
          const o = ctx.createOscillator(); o.type='sine'; o.frequency.value = base[i];
          const g = ctx.createGain(); g.gain.value = 0.0001;
          o.connect(g); g.connect(this.bgmGain);
          g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.08,t+0.02); g.gain.linearRampToValueAtTime(0.0001,t+step-0.02);
          o.start(t); o.stop(t+step);
        }
        t0 += base.length * step;
      };
      scheduleChunk();
      this._bgmTimer = setInterval(()=> scheduleChunk(), base.length * step * 1000);
    },
    stopBgm(){
      if(this._bgmTimer) clearInterval(this._bgmTimer);
      if(this.bgmGain) this.bgmGain.gain.value = 0;
    },
    playSfx(name){
      if(!this.ctx) return;
      const now = this.ctx.currentTime;
      if(name === 'step'){
        const o = this.ctx.createOscillator(); o.type='square'; o.frequency.value = 260 + Math.random()*40;
        const g = this.ctx.createGain(); g.gain.value = 0.0001;
        o.connect(g); g.connect(this.ctx.destination);
        g.gain.exponentialRampToValueAtTime(0.06, now+0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now+0.18);
        o.start(now); o.stop(now+0.18);
      } else if(name==='open'){
        const o = this.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value = 520;
        const g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.06, now+0.02); g.gain.linearRampToValueAtTime(0.0001, now+0.36);
        o.start(now); o.stop(now+0.36);
      } else if(name==='success'){
        [660,880,990].forEach((f,i)=>{
          const o = this.ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
          const g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
          g.gain.setValueAtTime(0.0001, now + i*0.02);
          g.gain.linearRampToValueAtTime(0.08, now + 0.06 + i*0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
          o.start(now + i*0.02); o.stop(now + 1.0);
        });
      } else if(name==='caught'){
        const o = this.ctx.createOscillator(); o.type='square'; o.frequency.value = 110;
        const g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.18, now+0.02); g.gain.exponentialRampToValueAtTime(0.0001, now+1.2);
        o.start(now); o.stop(now+1.2);
      } else if(name==='fail'){
        const o = this.ctx.createOscillator(); o.type='sawtooth'; o.frequency.value = 180;
        const g = this.ctx.createGain(); o.connect(g); g.connect(this.ctx.destination);
        g.gain.setValueAtTime(0.0001, now); g.gain.linearRampToValueAtTime(0.12, now+0.01); g.gain.exponentialRampToValueAtTime(0.0001, now+0.6);
        o.start(now); o.stop(now+0.6);
      }
    }
  };

  window.AudioManager = AudioManager;
})(window);