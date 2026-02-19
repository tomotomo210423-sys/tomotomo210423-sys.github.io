　// === BLOCK CRAFT (3D) - MOBS, HOTBAR & EXTREME OPTIMIZATION ===
const Mine = {
  st: 'init',
  scene: null, camera: null, renderer: null,
  textureAtlas: null, mobAtlas: null,
  geometries: {}, materials: {},
  
  player: { x: 8, y: 15, z: 8, vy: 0, isGrounded: false, speed: 0.07, crouchSpeed: 0.025, jumpPower: 0.16, isCrouching: false, currentEyeHeight: 1.62 },
  controls: { moveX: 0, moveZ: 0, yaw: 0, pitch: -0.5 },
  
  blocks: [], blockMeshes: [], drops: [], mobs: [],
  
  // ★ ホットバー（選択中のアイテム）
  hotbarItems: ['dirt', 'cobblestone', 'wood', 'plank', 'glass'],
  activeSlot: 0,
  
  hardness: { grass: 15, dirt: 15, sand: 15, leaves: 10, glass: 10, wood: 30, plank: 30, stone: 45, cobblestone: 45, coal: 50 },
  
  targetHighlight: null, currentTarget: null, currentIntersect: null,
  digging: false, digProgress: 0,
  
  joystick: { active: false, pointerId: null },
  touchZone: { active: false, pointerId: null, lastX: 0, lastY: 0, startT: 0, moved: false },
  initialized: false,
  
  init() {
    document.getElementById('gameboy').style.display = 'none';
    document.getElementById('mine-container').classList.add('active');
    
    if (!this.initialized) {
      this.setup3D();
      this.bindEvents();
      this.initialized = true;
    }
    
    this.st = 'play';
    this.player.x = 8; this.player.y = 15; this.player.z = 8; this.player.vy = 0;
    setTimeout(() => this.resize(), 50); setTimeout(() => this.resize(), 500); 
  },
  
  setup3D() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); 
    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 30);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.zIndex = '1'; canvas.style.width = '100vw'; canvas.style.height = '100vh';
    document.getElementById('mine-container').insertBefore(canvas, document.getElementById('mine-ui'));
    
    const light = new THREE.DirectionalLight(0xffffff, 1.0); light.position.set(10, 20, 10); this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const loader = new THREE.TextureLoader();
    this.textureAtlas = loader.load('atlas.png');
    this.textureAtlas.magFilter = THREE.NearestFilter; this.textureAtlas.minFilter = THREE.NearestFilter;
    
    // ★ モブ用テクスチャの読み込み
    this.mobAtlas = loader.load('mobs.png');
    this.mobAtlas.magFilter = THREE.NearestFilter; this.mobAtlas.minFilter = THREE.NearestFilter;
    this.materials.mob = new THREE.MeshLambertMaterial({ map: this.mobAtlas, transparent: true, alphaTest: 0.5 });
    
    this.materials.opaque = new THREE.MeshLambertMaterial({ map: this.textureAtlas });
    this.materials.transparent = new THREE.MeshLambertMaterial({ map: this.textureAtlas, transparent: true, alphaTest: 0.5 });
    
    const getUVs = (col, row) => { const u = col * 0.25; const v = 0.75 - row * 0.25; return [ u, v+0.25, u+0.25, v+0.25, u, v, u+0.25, v ]; };
    const createGeo = (faces) => {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        faces.forEach((f, i) => { const u = getUVs(f.c, f.r); geo.attributes.uv.setXY(i*4+0, u[0], u[1]); geo.attributes.uv.setXY(i*4+1, u[2], u[3]); geo.attributes.uv.setXY(i*4+2, u[4], u[5]); geo.attributes.uv.setXY(i*4+3, u[6], u[7]); });
        return geo;
    };

    this.geometries = {
        grass: createGeo([{c:1,r:0}, {c:1,r:0}, {c:0,r:0}, {c:2,r:0}, {c:1,r:0}, {c:1,r:0}]),
        dirt: createGeo(Array(6).fill({c:2,r:0})), stone: createGeo(Array(6).fill({c:3,r:0})),
        cobblestone: createGeo(Array(6).fill({c:0,r:1})), wood: createGeo([{c:1,r:1}, {c:1,r:1}, {c:2,r:1}, {c:2,r:1}, {c:1,r:1}, {c:1,r:1}]),
        leaves: createGeo(Array(6).fill({c:3,r:1})), plank: createGeo(Array(6).fill({c:0,r:2})),
        sand: createGeo(Array(6).fill({c:1,r:2})), glass: createGeo(Array(6).fill({c:2,r:2})),
        diamond: createGeo(Array(6).fill({c:3,r:2})), iron: createGeo(Array(6).fill({c:0,r:3})), coal: createGeo(Array(6).fill({c:1,r:3}))
    };

    const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.targetHighlight = new THREE.LineSegments(edgesGeo, edgesMat);
    this.targetHighlight.visible = false;
    this.scene.add(this.targetHighlight);

    this.generateTerrain();
    this.spawnMobs();
  },

  // ★ 究極の軽量化：静的ブロックの演算をストップ
  addBlock(x, y, z, type) {
    const geo = this.geometries[type];
    const mat = (type === 'leaves' || type === 'glass') ? this.materials.transparent : this.materials.opaque;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { x, y, z, type, matCloned: false }; 
    
    // 【軽量化の要】動かないブロックの計算をスキップしてCPU負荷を劇的に下げる
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
    
    this.scene.add(mesh);
    this.blockMeshes.push(mesh);
    this.blocks.push({ x, y, z, mesh, type });
  },

  generateTerrain() {
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y <= 4; y++) {
          let type = 'stone';
          if (y === 4) type = 'grass'; else if (y === 3) type = 'dirt'; else if (y < 3 && Math.random() < 0.1) type = 'coal'; 
          this.addBlock(x, y, z, type);
        }
      }
    }
    this.addBlock(8, 5, 8, 'wood'); this.addBlock(8, 6, 8, 'wood'); this.addBlock(8, 7, 8, 'wood');
    for (let lx = 7; lx <= 9; lx++) {
      for (let lz = 7; lz <= 9; lz++) {
        for (let ly = 7; ly <= 8; ly++) { if (lx === 8 && lz === 8 && ly === 7) continue; this.addBlock(lx, ly, lz, 'leaves'); }
      }
    }
    this.addBlock(8, 9, 8, 'leaves');
  },

  // ★ モブの生成（ゾンビと豚）
  spawnMobs() {
    const createMob = (type, x, z, row, w, h, d, scale) => {
        // 顔のUVを割り当ててボックスを作る簡易モブ
        const u = 0 * 0.25; const v = 0.75 - row * 0.25; // 顔はcol=0
        const geo = new THREE.BoxGeometry(w, h, d);
        geo.attributes.uv.setXY(16, u, u+0.25); geo.attributes.uv.setXY(17, u+0.25, u+0.25); geo.attributes.uv.setXY(18, u, v); geo.attributes.uv.setXY(19, u+0.25, v); // Front(4)の修正用簡易処理（全面を顔で代用）
        
        const mesh = new THREE.Mesh(geo, this.materials.mob);
        mesh.position.set(x, 10, z);
        mesh.scale.set(scale, scale, scale);
        this.scene.add(mesh);
        
        // ゾンビはrow=0、豚はrow=2
        this.mobs.push({ type: type, mesh: mesh, vx: 0, vy: 0, vz: 0, height: h * scale, isGrounded: false, timer: Math.random() * 100 });
    };
    
    createMob('zombie', 12, 12, 0, 0.6, 1.8, 0.4, 1.0);
    createMob('pig', 4, 4, 2, 0.5, 0.5, 0.8, 1.2);
  },

  breakBlock(mesh) {
    const type = mesh.userData.type;
    const pos = mesh.position.clone();
    if(mesh.userData.matCloned) mesh.material.dispose();
    this.scene.remove(mesh);
    this.blockMeshes = this.blockMeshes.filter(m => m !== mesh);
    this.blocks = this.blocks.filter(b => b.mesh !== mesh);
    
    if(typeof playSnd === 'function') playSnd('sel');
    this.spawnDrop(type, pos.x, pos.y, pos.z);
    this.targetHighlight.visible = false;
    this.currentTarget = null;
  },

  placeBlock() {
    if (!this.currentIntersect) return;
    const normal = this.currentIntersect.face.normal;
    const pos = this.currentIntersect.object.position;
    const nx = pos.x + normal.x; const ny = pos.y + normal.y; const nz = pos.z + normal.z;

    const px = this.player.x, py = this.player.y, pz = this.player.z;
    if (nx + 0.5 > px - 0.3 && nx - 0.5 < px + 0.3 && nz + 0.5 > pz - 0.3 && nz - 0.5 < pz + 0.3 && ny + 0.5 > py && ny - 0.5 < py + 1.8) return; 
    
    // ★ 選択中のアイテムを置く
    const blockType = this.hotbarItems[this.activeSlot];
    this.addBlock(nx, ny, nz, blockType);
    if(typeof playSnd === 'function') playSnd('jmp');
  },

  spawnDrop(type, x, y, z) {
    let dropType = type; if (type === 'stone') dropType = 'cobblestone'; 
    const geo = this.geometries[dropType];
    const mat = (dropType === 'leaves' || dropType === 'glass') ? this.materials.transparent : this.materials.opaque;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z); mesh.scale.set(0.25, 0.25, 0.25); 
    this.scene.add(mesh);
    this.drops.push({ mesh: mesh, type: dropType, vx: (Math.random()-0.5)*0.1, vy: 0.15, vz: (Math.random()-0.5)*0.1, time: 0 });
  },
  
  bindEvents() {
    window.addEventListener('resize', () => { setTimeout(() => this.resize(), 100); }, false);
    document.getElementById('btn-mine-exit').addEventListener('pointerdown', (e) => { e.preventDefault(); this.exitGame(); });
    
    document.getElementById('btn-jump').addEventListener('pointerdown', (e) => { e.preventDefault(); if (this.player.isGrounded) { this.player.vy = this.player.jumpPower; this.player.isGrounded = false; } });
    
    const crouchBtn = document.getElementById('btn-crouch');
    crouchBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.player.isCrouching = true; crouchBtn.style.background = 'rgba(255,255,255,0.6)'; });
    const crouchEnd = (e) => { e.preventDefault(); this.player.isCrouching = false; crouchBtn.style.background = 'rgba(0,0,0,0.4)'; };
    crouchBtn.addEventListener('pointerup', crouchEnd); crouchBtn.addEventListener('pointercancel', crouchEnd); crouchBtn.addEventListener('pointerout', crouchEnd);

    // ★ ホットバーの選択イベント
    const slots = document.querySelectorAll('.slot');
    slots.forEach((slot, index) => {
        slot.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation(); // 視点移動が暴発しないようにする
            slots.forEach(s => s.classList.remove('active'));
            slot.classList.add('active');
            this.activeSlot = index;
            if(typeof playSnd === 'function') playSnd('sel');
        });
    });

    const joyZone = document.getElementById('joystick-zone'); const joyKnob = document.getElementById('joystick-knob'); let joyRect = null;
    const updateJoy = (e) => {
        const cx = joyRect.left + joyRect.width / 2; const cy = joyRect.top + joyRect.height / 2;
        let dx = e.clientX - cx; let dy = e.clientY - cy; const distance = Math.min(35, Math.hypot(dx, dy)); const angle = Math.atan2(dy, dx);
        joyKnob.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`;
        this.controls.moveX = (Math.cos(angle)*distance) / 35; this.controls.moveZ = (Math.sin(angle)*distance) / 35;
    };
    joyZone.addEventListener('pointerdown', (e) => { if (this.joystick.active) return; e.preventDefault(); joyZone.setPointerCapture(e.pointerId); this.joystick.active = true; this.joystick.pointerId = e.pointerId; joyRect = joyZone.getBoundingClientRect(); updateJoy(e); });
    joyZone.addEventListener('pointermove', (e) => { if (!this.joystick.active || this.joystick.pointerId !== e.pointerId) return; e.preventDefault(); updateJoy(e); });
    const endJoy = (e) => { if (!this.joystick.active || this.joystick.pointerId !== e.pointerId) return; e.preventDefault(); try { joyZone.releasePointerCapture(e.pointerId); } catch(err) {} this.joystick.active = false; this.joystick.pointerId = null; joyKnob.style.transform = `translate(0px, 0px)`; this.controls.moveX = 0; this.controls.moveZ = 0; };
    joyZone.addEventListener('pointerup', endJoy); joyZone.addEventListener('pointercancel', endJoy); joyZone.addEventListener('pointerout', endJoy); 
    
    const touchZone = document.getElementById('touch-zone');
    touchZone.addEventListener('pointerdown', (e) => {
        if (this.touchZone.active) return; e.preventDefault(); touchZone.setPointerCapture(e.pointerId); this.touchZone.active = true; this.touchZone.pointerId = e.pointerId;
        this.touchZone.lastX = e.clientX; this.touchZone.lastY = e.clientY; this.touchZone.startT = Date.now(); this.touchZone.moved = false; this.digging = true;
    });
    touchZone.addEventListener('pointermove', (e) => {
        if (!this.touchZone.active || this.touchZone.pointerId !== e.pointerId) return; e.preventDefault();
        const dx = e.clientX - this.touchZone.lastX; const dy = e.clientY - this.touchZone.lastY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.touchZone.moved = true;
        this.controls.yaw -= dx * 0.005; this.controls.pitch -= dy * 0.005; this.controls.pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, this.controls.pitch));
        this.touchZone.lastX = e.clientX; this.touchZone.lastY = e.clientY;
    });
    const endTouch = (e) => {
        if (!this.touchZone.active || this.touchZone.pointerId !== e.pointerId) return; e.preventDefault();
        if (!this.touchZone.moved && (Date.now() - this.touchZone.startT < 250)) this.placeBlock();
        try { touchZone.releasePointerCapture(e.pointerId); } catch(err) {}
        this.touchZone.active = false; this.touchZone.pointerId = null; this.digging = false;
    };
    touchZone.addEventListener('pointerup', endTouch); touchZone.addEventListener('pointercancel', endTouch); touchZone.addEventListener('pointerout', endTouch);

    window.addEventListener('pointerup', (e) => { if (this.joystick.active && this.joystick.pointerId === e.pointerId) endJoy(e); if (this.touchZone.active && this.touchZone.pointerId === e.pointerId) endTouch(e); crouchEnd(e); });
  },
  
  resize() { if (!this.camera || !this.renderer) return; const w = window.innerWidth; const h = window.innerHeight; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h); const warn = document.getElementById('rotate-warning'); if (warn) { if (h > w) warn.style.display = 'flex'; else warn.style.display = 'none'; } },
  
  exitGame() {
    this.st = 'exit'; document.getElementById('mine-container').classList.remove('active'); document.getElementById('gameboy').style.display = 'flex';
    this.joystick.active = false; this.touchZone.active = false; this.digging = false; document.getElementById('joystick-knob').style.transform = `translate(0px, 0px)`; this.controls.moveX = 0; this.controls.moveZ = 0;
    if (this.currentTarget && this.currentTarget.userData.matCloned) { this.currentTarget.material.color.setScalar(1.0); }
    switchApp(Menu);
  },
  
  getCollidingBlock(nx, ny, nz, pHeight, isWall = false) {
    const pSize = 0.3; const yOffset = isWall ? 0.1 : 0; 
    for (let b of this.blocks) {
      if (nx - pSize < b.x + 0.5 && nx + pSize > b.x - 0.5 && nz - pSize < b.z + 0.5 && nz + pSize > b.z - 0.5 && ny + yOffset < b.y + 0.5 && ny + pHeight > b.y - 0.5) return b;
    }
    return null;
  },

  update() {
    if (this.st !== 'play') return;
    
    // ===== プレイヤー移動 =====
    this.camera.rotation.order = 'YXZ'; this.camera.rotation.y = this.controls.yaw; this.camera.rotation.x = this.controls.pitch;
    const currentSpeed = this.player.isCrouching ? this.player.crouchSpeed : this.player.speed;
    const dir = new THREE.Vector3(this.controls.moveX, 0, this.controls.moveZ); dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);
    
    let nx = this.player.x + dir.x * currentSpeed; let nz = this.player.z + dir.z * currentSpeed;
    if (!this.getCollidingBlock(nx, this.player.y, this.player.z, 1.8, true)) this.player.x = nx;
    if (!this.getCollidingBlock(this.player.x, this.player.y, nz, 1.8, true)) this.player.z = nz;
    
    this.player.vy -= 0.008; let ny = this.player.y + this.player.vy;
    let hitBlock = this.getCollidingBlock(this.player.x, ny, this.player.z, 1.8, false);
    if (hitBlock) {
        if (this.player.vy < 0) { this.player.vy = 0; this.player.isGrounded = true; ny = hitBlock.y + 0.5; } 
        else { this.player.vy = 0; ny = hitBlock.y - 0.5 - 1.8; }
    } else { this.player.isGrounded = false; }
    
    if (ny < -10) { ny = 15; this.player.x = 8; this.player.z = 8; this.player.vy = 0; }
    this.player.y = ny;
    
    const targetEyeHeight = this.player.isCrouching ? 1.27 : 1.62;
    this.player.currentEyeHeight += (targetEyeHeight - this.player.currentEyeHeight) * 0.3;
    this.camera.position.set(this.player.x, this.player.y + this.player.currentEyeHeight, this.player.z);
    
    // ===== モブのAI処理 =====
    for (let m of this.mobs) {
        m.vy -= 0.008; m.mesh.position.y += m.vy;
        let floorY = -999;
        const bx = Math.round(m.mesh.position.x); const bz = Math.round(m.mesh.position.z);
        for(let b of this.blocks) { if(b.x === bx && b.z === bz && b.y <= m.mesh.position.y) { if(b.y > floorY) floorY = b.y; } }
        
        if (m.mesh.position.y < floorY + 0.5 + m.height/2) { m.mesh.position.y = floorY + 0.5 + m.height/2; m.vy = 0; m.isGrounded = true; }
        
        if (m.type === 'zombie') {
            m.mesh.lookAt(this.player.x, m.mesh.position.y, this.player.z); // プレイヤーの方を向く
            let dist = Math.hypot(this.player.x - m.mesh.position.x, this.player.z - m.mesh.position.z);
            if (dist < 8 && dist > 1) m.mesh.translateZ(0.015); // プレイヤーを追いかける
        } else if (m.type === 'pig') {
            m.timer--;
            if (m.timer <= 0) { m.mesh.rotation.y = Math.random() * Math.PI * 2; m.timer = 60 + Math.random() * 60; }
            if (m.timer > 30) m.mesh.translateZ(0.01); // ランダムに歩き回る
        }
    }

    // ===== 採掘システム =====
    const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = raycaster.intersectObjects(this.blockMeshes);
    
    let newTarget = null; let newIntersect = null;
    if (intersects.length > 0 && intersects[0].distance < 5) { newTarget = intersects[0].object; newIntersect = intersects[0]; }

    if (newTarget !== this.currentTarget) {
        if (this.currentTarget && this.currentTarget.userData.matCloned) {
            this.currentTarget.material.color.setScalar(1.0); 
            // 揺れのリセット
            this.currentTarget.position.set(this.currentTarget.userData.x, this.currentTarget.userData.y, this.currentTarget.userData.z);
            this.currentTarget.updateMatrix(); this.currentTarget.matrixAutoUpdate = false;
        }
        this.currentTarget = newTarget; this.currentIntersect = newIntersect; this.digProgress = 0;
        
        if (newTarget) { this.targetHighlight.position.copy(newTarget.position); this.targetHighlight.visible = true;
        } else { this.targetHighlight.visible = false; }
    }
    
    if (this.digging && this.currentTarget) {
        this.digProgress++;
        const type = this.currentTarget.userData.type; const maxDig = this.hardness[type] || 30;
        
        this.currentTarget.matrixAutoUpdate = true; // 揺れる間だけ演算ON
        const intensity = (this.digProgress / maxDig) * 0.05;
        this.currentTarget.position.x = this.currentTarget.userData.x + (Math.random()-0.5)*intensity;
        this.currentTarget.position.y = this.currentTarget.userData.y + (Math.random()-0.5)*intensity;
        this.currentTarget.position.z = this.currentTarget.userData.z + (Math.random()-0.5)*intensity;
        
        const darken = 1.0 - (this.digProgress / maxDig) * 0.5;
        if (!this.currentTarget.userData.matCloned) { this.currentTarget.material = this.currentTarget.material.clone(); this.currentTarget.userData.matCloned = true; }
        this.currentTarget.material.color.setScalar(darken);

        if (this.digProgress >= maxDig) { this.breakBlock(this.currentTarget); this.digProgress = 0; }
    } else {
        this.digProgress = 0;
        if (this.currentTarget && this.currentTarget.userData.matCloned) {
            this.currentTarget.material.color.setScalar(1.0);
            this.currentTarget.position.set(this.currentTarget.userData.x, this.currentTarget.userData.y, this.currentTarget.userData.z);
            this.currentTarget.updateMatrix(); this.currentTarget.matrixAutoUpdate = false;
        }
    }

    // ===== ドロップアイテム =====
    for (let i = this.drops.length - 1; i >= 0; i--) {
        let d = this.drops[i];
        d.vy -= 0.005; d.mesh.position.x += d.vx; d.mesh.position.y += d.vy; d.mesh.position.z += d.vz;
        let floorY = -999;
        const bx = Math.round(d.mesh.position.x); const bz = Math.round(d.mesh.position.z);
        for(let b of this.blocks) { if(b.x === bx && b.z === bz && b.y <= d.mesh.position.y) { if(b.y > floorY) floorY = b.y; } }
        
        if (d.mesh.position.y < floorY + 0.5 + 0.125) { d.mesh.position.y = floorY + 0.5 + 0.125; d.vy = 0; d.vx *= 0.5; d.vz *= 0.5; }
        d.time += 0.05; d.mesh.rotation.y += 0.05; d.mesh.position.y += Math.sin(d.time) * 0.005; 
        
        const dist = Math.hypot(d.mesh.position.x - this.player.x, d.mesh.position.y - (this.player.y + 0.9), d.mesh.position.z - this.player.z);
        if (dist < 1.5) { this.scene.remove(d.mesh); this.drops.splice(i, 1); if(typeof playSnd === 'function') playSnd('jmp'); }
    }
  },
  
  draw() {
    if (this.st !== 'play' || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }
};
