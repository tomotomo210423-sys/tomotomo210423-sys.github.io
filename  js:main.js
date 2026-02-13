// js/main.js
(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let W = innerWidth, H = innerHeight;
  function fit(){
    W = canvas.width = innerWidth; H = canvas.height = innerHeight;
    document.getElementById('portraitOverlay').style.display = (W>H) ? 'none' : 'flex';
    // reposition hud elements if needed (CSS handles)
  }
  window.addEventListener('resize', fit);
  fit();

  // imports from GameModule
  const { MapGen, Actor, Chaser, GearPuzzle, applyLightMask, worldToScreen, roles } = window.GameModule;

  // game state
  let difficulty = 'normal';
  let roomsCountByDiff = { easy:5, normal:7, hard:10 };
  let roomsCount = roomsCountByDiff['normal'];
  let map = new MapGen(32, roomsCount);
  window.GameModule._internal.Map = map;

  // choose player role when start
  let playerRole = 'sprinter';
  let player = new Actor( map.roomCenters[0].x, map.roomCenters[0].y, playerRole );
  // allies
  let allies = [];
  // create 2 allies with remaining roles
  function setupAllies(){
    const rolesList = ['sprinter','hacker','trickster'].filter(r=>r!==playerRole);
    allies = [
      new Actor(map.roomCenters[Math.min(1,map.roomCenters.length-1)].x + 10, map.roomCenters[Math.min(1,map.roomCenters.length-1)].y, rolesList[0]),
      new Actor(map.roomCenters[Math.min(2,map.roomCenters.length-1)].x - 10, map.roomCenters[Math.min(2,map.roomCenters.length-1)].y, rolesList[1])
    ];
  }

  // chaser
  let chaser = new Chaser(map.roomCenters[map.roomCenters.length-1].x, map.roomCenters[map.roomCenters.length-1].y);
  // tile locks
  let tileLocks = [];

  chaser.onLock = (lx, ly) => {
    tileLocks.push({x: lx, y: ly, expires: performance.now() + 5000});
  };

  // puzzles placed
  let puzzles = map.puzzleRooms.map(p => new GearPuzzle(p.x, p.y));
  document.getElementById('puzzlesLeft').textContent = puzzles.filter(p=>!p.solved).length;

  // camera = follow player
  let camera = {x: player.x - W/2, y: player.y - H/2};

  // input handling: stick + action
  const stickBase = document.getElementById('stickBase');
  const knob = document.getElementById('stickKnob');
  const actionBtn = document.getElementById('actionBtn');
  const infoTime = document.getElementById('timeLeft');
  let input = { vx:0, vy:0 };
  let running = false;
  let startTime = null;
  let remainingMs = 5*60*1000; // 5 minutes

  // pointer input for stick
  let pointerId = null;
  stickBase.addEventListener('pointerdown', (e)=>{
    if(document.getElementById('portraitOverlay').style.display !== 'none') return;
    pointerId = e.pointerId;
    stickBase.setPointerCapture(pointerId);
    updateKnob(e);
  });
  stickBase.addEventListener('pointermove', (e)=>{
    if(e.pointerId !== pointerId) return;
    updateKnob(e);
  });
  stickBase.addEventListener('pointerup', (e)=>{
    if(e.pointerId !== pointerId) return;
    pointerId = null; stickBase.releasePointerCapture(e.pointerId);
    knob.style.transform = `translate(0px,0px)`; input.vx = 0; input.vy = 0;
  });
  function updateKnob(e){
    const rect = stickBase.getBoundingClientRect();
    const cx = rect.left + rect.width/2, cy = rect.top + rect.height/2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const max = 36;
    const len = Math.hypot(dx,dy);
    const nx = len > max ? dx/len*max : dx;
    const ny = len > max ? dy/len*max : dy;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
    input.vx = nx / max;
    input.vy = ny / max;
  }

  // action button
  actionBtn.addEventListener('pointerdown', ()=>{
    if(document.getElementById('portraitOverlay').style.display !== 'none') return;
    // check nearby puzzle
    for(const p of puzzles){
      const d = Math.hypot(player.x - p.x, player.y - p.y);
      if(d < 60 && !p.solved){
        p.open();
        playSfx('open');
        return;
      }
    }
    // toggle flashlight
    player.flashlight = !player.flashlight;
    playSfx('open');
  });

  // puzzle overlay tap handling:
  canvas.addEventListener('pointerdown', (e)=>{
    // if any puzzle active, handle overlay taps
    for(const p of puzzles){
      if(p.active && !p.solved){
        // screen coords: overlay centered UI uses screen mapping; compute centers
        const mx = e.clientX, my = e.clientY;
        const cx = W/2, cy = H/2 - 40;
        if(p.solved) return;
        // determine if in triangle area
        if(p.solved) return;
        if(p.solved) return;
        // if simon not used, we use gear taps directly here: three big gears
        for(let i=0;i<3;i++){
          const gx = cx + (i-1)*140, gy = cy + 40;
          if(Math.hypot(mx - gx, my - gy) < 70){
            p.tapGear(i);
            if(p.solved) { document.getElementById('puzzlesLeft').textContent = puzzles.filter(pp=>!pp.solved).length; playSfx('success'); checkWin(); }
            return;
          }
        }
      }
    }
  });

  // SFX wrapper
  function playSfx(name){ window.AudioManager.playSfx(name); }

  // start UI wiring
  const startScreen = document.getElementById('startScreen');
  const roleBtns = document.querySelectorAll('.roleBtn');
  roleBtns.forEach(b=>{
    b.addEventListener('click', ()=> {
      roleBtns.forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      playerRole = b.dataset.role;
    });
  });
  document.getElementById('startBtn').addEventListener('click', ()=>{
    // init audio
    AudioManager.init();
    // set up player role and allies
    player = new Actor(map.roomCenters[0].x, map.roomCenters[0].y, playerRole);
    setupAllies();
    chaser = new Chaser(map.roomCenters[map.roomCenters.length-1].x, map.roomCenters[map.roomCenters.length-1].y);
    chaser.onLock = (lx,ly) => tileLocks.push({x:lx, y:ly, expires: performance.now() + 5000});
    // hide start screen
    startScreen.style.display = 'none';
    running = true;
    startTime = performance.now();
    lastTick = performance.now();
    requestAnimationFrame(loop);
  });

  function setupAllies(){
    const otherRoles = ['sprinter','hacker','trickster'].filter(r=>r!==playerRole);
    allies = [];
    for(let i=0;i<2;i++){
      const rc = map.roomCenters[Math.min(i+1, map.roomCenters.length-1)];
      allies.push(new Actor(rc.x + (i*8), rc.y + (i*-8), otherRoles[i]));
    }
  }

  // game loop
  let lastTick = performance.now();
  function loop(ts){
    if(!running) return;
    const dt = (ts - lastTick)/16.666; lastTick = ts;

    // update time
    const elapsed = ts - startTime;
    remainingMs = Math.max(0, 5*60*1000 - elapsed);
    const mm = Math.floor(remainingMs / 60000), ss = Math.floor((remainingMs % 60000)/1000);
    document.getElementById('timeLeft').textContent = String(mm).padStart(2,'0') + ':' + String(ss).padStart(2,'0');
    if(remainingMs <= 0){
      endGame(false);
      return;
    }

    // update actors
    player.update(map, input, dt);
    allies.forEach(a=> a.update(map, {vx: (player.x - a.x)/Math.max(1,Math.hypot(player.x-a.x, player.y-a.y))*0.2, vy: (player.y - a.y)/Math.max(1,Math.hypot(player.x-a.x, player.y-a.y))*0.2}, dt));
    // allies simple behavior: hacker seeks puzzle
    for(const a of allies){
      if(a.role === 'hacker'){
        const nearestPuzzle = puzzles.filter(p=>!p.solved)[0];
        if(nearestPuzzle && Math.hypot(a.x-nearestPuzzle.x, a.y-nearestPuzzle.y) < 60){
          // accelerate puzzle progress occasionally if active
          if(nearestPuzzle.active && Math.random() < 0.02){
            // simulate assistance: rotate a gear randomly
            const randomIndex = Math.floor(Math.random()*3);
            nearestPuzzle.tapGear(randomIndex);
          }
        }
      }
    }

    // chaser update
    chaser.update([player, ...allies], map, dt);

    // check capture
    if(!player.caught && Math.hypot(player.x - chaser.x, player.y - chaser.y) < 22){
      player.caught = true;
      playSfx('caught');
      endGame(false);
      return;
    }

    // expire tile locks
    tileLocks = tileLocks.filter(l=> l.expires > performance.now());

    // camera follow
    camera.x = player.x - W/2; camera.y = player.y - H/2;

    // render
    render();

    requestAnimationFrame(loop);
  }

  function endGame(win){
    running = false;
    // show overlay
    const overlay = document.createElement('div');
    overlay.id = 'endOverlay';
    overlay.style.position = 'fixed'; overlay.style.inset = '0'; overlay.style.display='flex'; overlay.style.alignItems='center';
    overlay.style.justifyContent='center'; overlay.style.zIndex=300; overlay.style.background='linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.95))';
    overlay.innerHTML = `<div style="background:rgba(255,255,255,0.04);padding:18px;border-radius:12px;color:#fff;text-align:center">
      <h2 style="margin:0 0 8px 0">${win ? '逃走者の勝利！' : '追跡者の勝利'}</h2>
      <div style="margin:8px 0 12px 0">再スタートするにはタイトルへ戻ります。</div>
      <div><button id="backTitle" class="smallBtn">タイトルへ戻る</button></div>
    </div>`;
    document.body.appendChild(overlay);
    document.getElementById('backTitle').addEventListener('click', ()=>{
      document.body.removeChild(overlay);
      // reset minimal state
      map = new MapGen(32, roomsCount);
      puzzles = map.puzzleRooms.map(p => new GearPuzzle(p.x, p.y));
      document.getElementById('puzzlesLeft').textContent = puzzles.filter(p=>!p.solved).length;
      document.getElementById('startScreen').style.display = 'flex';
      player = new Actor(map.roomCenters[0].x, map.roomCenters[0].y, playerRole);
      chaser = new Chaser(map.roomCenters[map.roomCenters.length-1].x, map.roomCenters[map.roomCenters.length-1].y);
    });
  }

  function checkWin(){
    if(puzzles.every(p=>p.solved)){
      endGame(true);
    }
  }

  // render routine
  function render(){
    ctx.clearRect(0,0,W,H);
    // draw world with camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    // draw map
    map.draw(ctx);
    // draw puzzles markers (they are drawn in map)
    // draw actors
    allies.forEach(a=> a.draw(ctx, camera));
    player.draw(ctx, camera);
    chaser.draw(ctx, camera);

    // draw tile lock visuals
    for(const l of tileLocks){
      ctx.fillStyle = 'rgba(120,0,0,0.6)';
      ctx.fillRect(l.x - 12, l.y - 12, 24, 24);
    }

    ctx.restore();

    // apply light/dark overlay after world draw
    // create an overlay layer
    // we do simple approach: use a full-screen dark rect and cut out circles for vision by composite
    // create on-screen mask using globalCompositeOperation
    ctx.save();
    // draw darkness
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,W,H);
    // subtract base visibility circle around player (what you can see without flashlight)
    ctx.globalCompositeOperation = 'destination-out';
    const baseR = 160;
    const screenPx = player.x - camera.x;
    const screenPy = player.y - camera.y;
    // base soft circle
    const g = ctx.createRadialGradient(screenPx, screenPy, baseR*0.2, screenPx, screenPy, baseR);
    g.addColorStop(0, 'rgba(0,0,0,0.0)'); g.addColorStop(1,'rgba(0,0,0,1)');
    ctx.beginPath(); ctx.arc(screenPx, screenPy, baseR, 0, Math.PI*2);
    ctx.fillStyle = 'black'; ctx.fill();
    // flashlight cone if on
    if(player.flashlight && player.battery > 0){
      // player's facing direction derived from last input
      const ang = Math.atan2(input.vy, input.vx);
      const coneR = 350;
      const half = Math.PI/5;
      ctx.beginPath();
      ctx.moveTo(screenPx, screenPy);
      ctx.arc(screenPx, screenPy, coneR, ang - half, ang + half);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // draw hud info
    document.getElementById('puzzlesLeft').textContent = puzzles.filter(p=>!p.solved).length;
  }

  // small helper for SFX
  function playSfx(kind){ window.AudioManager.playSfx(kind); }

})(); // end main