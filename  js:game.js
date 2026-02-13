// js/game.js
(function(window){
  // util
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function randInt(a,b){ return Math.floor(a + Math.random()*(b-a+1)); }

  /* ---------------- Map generator (room templates combined)
     We'll implement a simple node-based generator:
     produce N room centers on a grid and connect with corridors.
  */
  class MapGen {
    constructor(tileSize, roomsCount){
      this.tileSize = tileSize;
      this.roomsCount = roomsCount;
      this.rooms = []; // {x,y,w,h,tiles}
      this.width = 32 * tileSize;
      this.height = 32 * tileSize;
      this.obstacles = [];
      this.generate();
    }
    generate(){
      this.rooms = [];
      const gridW = 8, gridH = 8;
      const used = new Set();
      // place rooms by random walk ensuring connectivity
      let cx = Math.floor(gridW/2), cy = Math.floor(gridH/2);
      used.add(cx + ',' + cy);
      this.rooms.push({gx:cx, gy:cy});
      while(this.rooms.length < this.roomsCount){
        const dir = [[1,0],[-1,0],[0,1],[0,-1]][randInt(0,3)];
        cx += dir[0]; cy += dir[1];
        cx = clamp(cx,0,gridW-1); cy = clamp(cy,0,gridH-1);
        const key = cx + ',' + cy;
        if(!used.has(key)){
          used.add(key);
          this.rooms.push({gx:cx, gy:cy});
        }
      }
      // convert grid coords to pixel centers
      const cellW = Math.floor(this.width / gridW);
      const cellH = Math.floor(this.height / gridH);
      this.roomCenters = this.rooms.map(r=>({x: r.gx*cellW + cellW/2, y: r.gy*cellH + cellH/2}));
      // place obstacles inside rooms and corridors
      this.obstacles = [];
      for(let i=0;i< this.roomCenters.length;i++){
        const rc = this.roomCenters[i];
        // scatter some boxes around
        const count = randInt(2,6);
        for(let k=0;k<count;k++){
          const ox = rc.x + randInt(-cellW/3, cellW/3);
          const oy = rc.y + randInt(-cellH/3, cellH/3);
          this.obstacles.push({x:ox, y:oy, w:randInt(24,48), h:randInt(24,48)});
        }
      }
      // add corridor obstacles (sparse)
      for(let i=0;i<10;i++){
        this.obstacles.push({x: randInt(80,this.width-80), y: randInt(80,this.height-80), w: randInt(20,40), h: randInt(20,40)});
      }
      // choose puzzle rooms indices
      this.puzzleRooms = [];
      const pcount = Math.max(1, Math.floor(this.roomsCount*0.5));
      const shuffled = [...Array(this.roomCenters.length).keys()].sort(()=>Math.random()-0.5);
      for(let i=0;i<pcount;i++) this.puzzleRooms.push(this.roomCenters[shuffled[i]]);
    }
    draw(ctx){
      // floor
      ctx.fillStyle = '#121217';
      ctx.fillRect(0,0,this.width,this.height);
      // tiles for feel
      ctx.strokeStyle = '#15151a';
      for(let x=0;x<this.width;x+=64){
        ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,this.height); ctx.stroke();
      }
      for(let y=0;y<this.height;y+=64){
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(this.width,y); ctx.stroke();
      }
      // obstacles
      this.obstacles.forEach(o=>{
        ctx.fillStyle = '#5a4f3f';
        ctx.fillRect(o.x - o.w/2, o.y - o.h/2, o.w, o.h);
      });
      // puzzle markers
      this.puzzleRooms.forEach(p=>{
        ctx.fillStyle = '#2c2b17';
        ctx.fillRect(p.x-20, p.y-20, 40, 40);
        // small triangles
        for(let i=0;i<3;i++){
          ctx.save();
          ctx.translate(p.x + (i-1)*18, p.y - 8);
          ctx.fillStyle = '#f2d86b';
          ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(-6,8); ctx.lineTo(6,8); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      });
    }
    clampPos(obj){
      obj.x = clamp(obj.x, 20, this.width - 20);
      obj.y = clamp(obj.y, 20, this.height - 20);
      // naive obstacle collision pushback
      for(const o of this.obstacles){
        const left = o.x - o.w/2, right = o.x + o.w/2, top = o.y - o.h/2, bottom = o.y + o.h/2;
        if(obj.x > left - 12 && obj.x < right + 12 && obj.y > top - 12 && obj.y < bottom + 12){
          // push out simple
          if(Math.abs(obj.x - o.x) > Math.abs(obj.y - o.y)){
            if(obj.x < o.x) obj.x = left - 12; else obj.x = right + 12;
          } else {
            if(obj.y < o.y) obj.y = top - 12; else obj.y = bottom + 12;
          }
        }
      }
    }
  }

  /* ---------------- Player / Ally / Chaser classes */
  class Actor {
    constructor(x,y,role){
      this.x = x; this.y = y; this.role = role || 'sprinter';
      this.size = 12;
      this.speed = (role && roles[role]) ? roles[role].speed : 0.12;
      this.vx = 0; this.vy = 0;
      this.flashlight = false;
      this.battery = 100; // %
      this.caught = false;
    }
    setRole(role){
      this.role = role;
      this.speed = roles[role].speed;
    }
    draw(ctx, camera){
      const p = worldToScreen(this.x, this.y, camera);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(p.x - 12, p.y - 6, 24, 6);
      // body
      const color = roles[this.role].color;
      ctx.fillStyle = color; ctx.beginPath();
      ctx.ellipse(p.x, p.y - 14, 12, 10, 0, 0, Math.PI*2); ctx.fill();
      // head/mark per role
      ctx.fillStyle = '#fff';
      if(this.role === 'sprinter'){
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(p.x-6, p.y-24, 12, 6);
      } else if(this.role === 'hacker'){
        ctx.fillStyle = '#111'; ctx.fillRect(p.x-8, p.y-26, 16, 6);
      } else {
        ctx.fillStyle = '#7a2bff'; ctx.fillRect(p.x-8, p.y-24, 16, 4);
      }
    }
    update(map, input, dt){
      // input: {vx, vy}
      if(this.caught) return;
      this.x += (input.vx || 0) * this.speed * dt * 40;
      this.y += (input.vy || 0) * this.speed * dt * 40;
      // battery drain if flashlight on
      if(this.flashlight && this.battery > 0){
        this.battery -= 0.03 * dt;
        if(this.battery < 0) this.battery = 0;
      }
      map.clampPos(this);
    }
  }

  /* static role defs */
  const roles = {
    sprinter: {color:'#17dbe6', speed:0.14, hint:'高速移動'},
    hacker:   {color:'#ffd166', speed:0.10, hint:'パズル処理が速い'},
    trickster:{color:'#7ad07a', speed:0.11, hint:'偽足音で撹乱'}
  };

  /* ---------------- Chaser */
  class Chaser {
    constructor(x,y){
      this.x = x; this.y = y; this.size = 14;
      this.speed = 0.09; // tile momentum
      this.lockUsed = false;
    }
    update(targets, map, dt){
      // targets: array of actors
      // pick nearest (alive)
      let nearest = null; let nd = 1e9;
      for(const t of targets){
        if(t.caught) continue;
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if(d < nd){ nd = d; nearest = t; }
      }
      if(!nearest) return;
      const dx = nearest.x - this.x, dy = nearest.y - this.y;
      const dist = Math.hypot(dx,dy);
      if(dist > 0.02){
        this.x += (dx/dist) * this.speed * dt * 40;
        this.y += (dy/dist) * this.speed * dt * 40;
        map.clampPos(this);
      }
      // occasionally use lock near player
      if(!this.lockUsed && Math.random() < 0.0008 && dist < 6){
        this.lockUsed = true;
        // mark tile lock externally (caller adds)
        if(typeof this.onLock === 'function'){
          this.onLock(Math.round(this.x), Math.round(this.y));
        }
      }
    }
    draw(ctx, camera){
      const p = worldToScreen(this.x, this.y, camera);
      ctx.fillStyle = '#6b1f23';
      ctx.beginPath(); ctx.ellipse(p.x, p.y-12, 14, 11,0,0,Math.PI*2); ctx.fill();
      // eyes
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x-5,p.y-18,3.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(p.x-5,p.y-18,1.3,0,Math.PI*2); ctx.fill();
    }
  }

  /* ---------------- Light system (dark overlay + player light) */
  function applyLightMask(ctx, camera, players, width, height){
    // draw darkness overlay then clear light shapes
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0,0,width,height);
    ctx.globalCompositeOperation = 'destination-out';
    players.forEach(pl=>{
      const screen = worldToScreen(pl.x, pl.y, camera);
      // base circle (what you can see even without flashlight)
      const baseR = 160;
      const grd = ctx.createRadialGradient(screen.x, screen.y, baseR*0.25, screen.x, screen.y, baseR);
      grd.addColorStop(0, 'rgba(0,0,0,0.0)');
      grd.addColorStop(1, 'rgba(0,0,0,0.55)');
      // cut circle
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, baseR, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fill(); // fill so gradient below will be subtracted by dst-out
      // flashlight (if on): draw a larger cone to remove more darkness
      if(pl.flashlight && pl.battery > 0){
        const ang = pl._facingAngle || 0;
        const coneRadius = 350;
        const half = Math.PI/5;
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y);
        ctx.arc(screen.x, screen.y, coneRadius, ang - half, ang + half);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  /* ---------------- Gear Puzzle (time-consuming) */
  class GearPuzzle {
    constructor(x,y){
      this.x = x; this.y = y;
      // three gear angles (deg)
      this.gears = [ randInt(0,3)*90, randInt(0,3)*90, randInt(0,3)*90 ];
      this.active = false;
      this.solved = false;
    }
    open(){
      if(this.solved) return;
      this.active = true;
      // show sequence of slow animation to emphasize length
      this._displayPhase = 'simon'; // not used, but length will be controlled by requirement
    }
    tapGear(i){
      if(!this.active) return;
      // rotating gear rotates neighbors (coupled)
      this.gears[i] = (this.gears[i] + 90) % 360;
      // neighbor coupling
      if(i===0){ this.gears[1] = (this.gears[1] + 90) % 360; }
      if(i===1){ this.gears[0] = (this.gears[0] + 90) % 360; this.gears[2] = (this.gears[2] + 90) % 360; }
      if(i===2){ this.gears[1] = (this.gears[1] + 90) % 360; }
      // check solved: all zero orientation
      if(this.gears.every(g => ((g%360)+360)%360 === 0)){
        this.solved = true; this.active = false;
        if(typeof this.onSolved === 'function') this.onSolved();
      }
    }
    drawOverlay(ctx, W, H){
      // draw big overlay with 3 gears for tap
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff'; ctx.textAlign='center'; ctx.font='18px sans-serif';
      ctx.fillText('歯車パズル：全て上向きに揃えてください（タップで回転）', W/2, 60);
      // draw 3 gears
      for(let i=0;i<3;i++){
        const cx = W/2 + (i-1)*150, cy = H/2;
        ctx.save();
        ctx.translate(cx,cy);
        ctx.rotate(this.gears[i] * Math.PI/180);
        // gear body - simplified triangle-based gear look
        ctx.fillStyle = '#f2d86b';
        ctx.beginPath();
        ctx.moveTo(0,-48);
        ctx.lineTo(-36,44);
        ctx.lineTo(36,44);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // label
        ctx.fillStyle = '#ddd'; ctx.font = '14px sans-serif';
        ctx.fillText('歯車 ' + (i+1), cx, cy + 80);
      }
    }
  }

  /* ---------------- helper: worldToScreen simple camera mapping (no iso - we use topdown for simplicity with pseudo-iso) */
  function worldToScreen(x,y,camera){
    // use pseudo-iso transform as spec: screenX = (x - y) * tile/2 - camera.x + W/2
    const tile = 32;
    const sx = (x - y) * tile/2 - camera.x + (Map.width ? (Map.width/2) : 640);
    const sy = (x + y) * tile/4 - camera.y + 120;
    // For simplicity in this combined structure, camera will be in world coords (units same as x,y)
    // We'll return simple mapping (we control camera externally)
    return {x: x - camera.x + 0, y: y - camera.y + 0};
  }

  /* We'll export key classes and state */
  window.GameModule = {
    MapGen, Actor, Chaser, GearPuzzle, applyLightMask, worldToScreen, roles,
    // small proxies for global dimensions (set by main)
    _internal: { Map: null }
  };
})(window);