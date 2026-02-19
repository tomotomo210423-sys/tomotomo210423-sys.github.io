// === BLOCK CRAFT (3D) - MINECRAFT UI/UX OVERHAUL ===
const Mine = {
  st: 'init',
  scene: null, camera: null, renderer: null,
  textureAtlas: null, geometries: {}, materials: {},
  
  player: { x: 8, y: 15, z: 8, vy: 0, isGrounded: false, speed: 0.05, jumpPower: 0.15, isCrouching: false },
  controls: { moveX: 0, moveZ: 0, yaw: 0, pitch: -0.5 },
  
  blocks: [], blockMeshes: [], drops: [],
  
  // ★ ターゲット選択と破壊用の変数
  targetHighlight: null,   // 黒い枠線メッシュ
  currentTarget: null,     // 今狙っているブロックのMesh
  currentIntersect: null,  // Raycasterの交差情報
  digging: false,          // 画面長押し中フラグ
  digProgress: 0,          // 破壊の進行度
  
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
    this.player.x = 8; this.player.y = 15; this.player.z = 8;
    this.player.vy = 0;
    this.player.isCrouching = false;
    this.controls.yaw = 0; this.controls.pitch = -0.5; 
    
    setTimeout(() => this.resize(), 50);
    setTimeout(() => this.resize(), 500); 
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
    canvas.style.position = 'absolute';
    canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.zIndex = '1';
    canvas.style.width = '100vw'; canvas.style.height = '100vh';
    document.getElementById('mine-container').insertBefore(canvas, document.getElementById('mine-ui'));
    
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(10, 20, 10);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const loader = new THREE.TextureLoader();
    this.textureAtlas = loader.load('atlas.png');
    this.textureAtlas.magFilter = THREE.NearestFilter;
    this.textureAtlas.minFilter = THREE.NearestFilter;
    
    this.materials.opaque = new THREE.MeshLambertMaterial({ map: this.textureAtlas });
    this.materials.transparent = new THREE.MeshLambertMaterial({ map: this.textureAtlas, transparent: true, alphaTest: 0.5 });
    
    const getUVs = (col, row) => {
      const u = col * 0.25; const v = 0.75 - row * 0.25; 
      return [ u, v+0.25, u+0.25, v+0.25, u, v, u+0.25, v ];
    };
    const createGeo = (faces) => {
        const geo = new THREE.BoxGeometry(1, 1, 1);
        faces.forEach((f, i) => {
            const u = getUVs(f.c, f.r);
            geo.attributes.uv.setXY(i*4+0, u[0], u[1]); geo.attributes.uv.setXY(i*4+1, u[2], u[3]);
            geo.attributes.uv.setXY(i*4+2, u[4], u[5]); geo.attributes.uv.setXY(i*4+3, u[6], u[7]);
        });
        return geo;
    };

    this.geometries = {
        grass: createGeo([{c:1,r:0}, {c:1,r:0}, {c:0,r:0}, {c:2,r:0}, {c:1,r:0}, {c:1,r:0}]),
        dirt: createGeo(Array(6).fill({c:2,r:0})),
        stone: createGeo(Array(6).fill({c:3,r:0})),
        cobblestone: createGeo(Array(6).fill({c:0,r:1})),
        wood: createGeo([{c:1,r:1}, {c:1,r:1}, {c:2,r:1}, {c:2,r:1}, {c:1,r:1}, {c:1,r:1}]),
        leaves: createGeo(Array(6).fill({c:3,r:1})),
        plank: createGeo(Array(6).fill({c:0,r:2})),
        sand: createGeo(Array(6).fill({c:1,r:2})),
        glass: createGeo(Array(6).fill({c:2,r:2})),
        diamond: createGeo(Array(6).fill({c:3,r:2})),
        iron: createGeo(Array(6).fill({c:0,r:3})),
        coal: createGeo(Array(6).fill({c:1,r:3}))
    };

    // ★ 選択ブロックを囲む黒い枠線（本家のハイライト）を作成
    const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.targetHighlight = new THREE.LineSegments(edgesGeo, edgesMat);
    this.targetHighlight.visible = false;
    this.scene.add(this.targetHighlight);

    this.generateTerrain();
  },

  generateTerrain() {
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y <= 4; y++) {
          let type = 'stone';
          if (y === 4) type = 'grass';
          else if (y === 3) type = 'dirt';
          else if (y < 3 && Math.random() < 0.1) type = 'coal'; 
          this.addBlock(x, y, z, type);
        }
      }
    }
    this.addBlock(8, 5, 8, 'wood'); this.addBlock(8, 6, 8, 'wood'); this.addBlock(8, 7, 8, 'wood');
    for (let lx = 7; lx <= 9; lx++) {
      for (let lz = 7; lz <= 9; lz++) {
        for (let ly = 7; ly <= 8; ly++) {
          if (lx === 8 && lz === 8 && ly === 7) continue;
          this.addBlock(lx, ly, lz, 'leaves');
        }
      }
    }
    this.addBlock(8, 9, 8, 'leaves');
  },

  addBlock(x, y, z, type) {
    const geo = this.geometries[type];
    const mat = (type === 'leaves' || type === 'glass') ? this.materials.transparent : this.materials.opaque;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { x, y, z, type }; 
    this.scene.add(mesh);
    this.blockMeshes.push(mesh);
    this.blocks.push({ x, y, z, mesh, type });
  },

  // ★ 破壊処理
  breakBlock(mesh) {
    const type = mesh.userData.type;
    const pos = mesh.position.clone();
    this.scene.remove(mesh);
    this.blockMeshes = this.blockMeshes.filter(m => m !== mesh);
    this.blocks = this.blocks.filter(b => b.mesh !== mesh);
    
    if(typeof playSnd === 'function') playSnd('sel');
    if(navigator.vibrate) navigator.vibrate(50);
    
    this.spawnDrop(type, pos.x, pos.y, pos.z);
    
    // 破壊後、ハイライトを消す
    this.targetHighlight.visible = false;
    this.currentTarget = null;
  },

  // ★ 設置処理
  placeBlock() {
    if (!this.currentIntersect) return;
    const normal = this.currentIntersect.face.normal;
    const pos = this.currentIntersect.object.position;
    const nx = pos.x + normal.x;
    const ny = pos.y + normal.y;
    const nz = pos.z + normal.z;

    // プレイヤーが重なっている場所には置けない
    const px = this.player.x, py = this.player.y, pz = this.player.z;
    const pSize = 0.3, pHeight = 1.6;
    if (nx + 0.5 > px - pSize && nx - 0.5 < px + pSize &&
        nz + 0.5 > pz - pSize && nz - 0.5 < pz + pSize &&
        ny + 0.5 > py - pHeight && ny - 0.5 < py + 0.5) {
        return; 
    }
    
    // （※インベントリが未実装なので、置くのはとりあえず「丸石」で固定）
    this.addBlock(nx, ny, nz, 'cobblestone');
    if(typeof playSnd === 'function') playSnd('jmp');
  },

  spawnDrop(type, x, y, z) {
    let dropType = type;
    if (type === 'stone') dropType = 'cobblestone'; 
    const geo = this.geometries[dropType];
    const mat = (dropType === 'leaves' || dropType === 'glass') ? this.materials.transparent : this.materials.opaque;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(0.25, 0.25, 0.25); 
    this.scene.add(mesh);
    this.drops.push({ mesh: mesh, type: dropType, vx: (Math.random()-0.5)*0.1, vy: 0.15, vz: (Math.random()-0.5)*0.1, time: 0 });
  },
  
  bindEvents() {
    window.addEventListener('resize', () => { setTimeout(() => this.resize(), 100); }, false);
    document.getElementById('btn-mine-exit').addEventListener('pointerdown', (e) => { e.preventDefault(); this.exitGame(); });
    
    document.getElementById('btn-jump').addEventListener('pointerdown', (e) => { 
      e.preventDefault(); if (this.player.isGrounded) { this.player.vy = this.player.jumpPower; this.player.isGrounded = false; } 
    });

    const crouchBtn = document.getElementById('btn-crouch');
    crouchBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.player.isCrouching = true; crouchBtn.style.background = 'rgba(255,255,255,0.6)'; });
    const crouchEnd = (e) => { e.preventDefault(); this.player.isCrouching = false; crouchBtn.style.background = 'rgba(0,0,0,0.4)'; };
    crouchBtn.addEventListener('pointerup', crouchEnd); crouchBtn.addEventListener('pointercancel', crouchEnd); crouchBtn.addEventListener('pointerout', crouchEnd);

    // ジョイスティック
    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    let joyRect = null;
    
    const updateJoy = (e) => {
        const centerX = joyRect.left + joyRect.width / 2; const centerY = joyRect.top + joyRect.height / 2;
        let dx = e.clientX - centerX; let dy = e.clientY - centerY;
        const distance = Math.min(35, Math.hypot(dx, dy)); const angle = Math.atan2(dy, dx);
        joyKnob.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`;
        this.controls.moveX = (Math.cos(angle)*distance) / 35; this.controls.moveZ = (Math.sin(angle)*distance) / 35;
    };

    joyZone.addEventListener('pointerdown', (e) => {
        if (this.joystick.active) return;
        e.preventDefault(); joyZone.setPointerCapture(e.pointerId); this.joystick.active = true; this.joystick.pointerId = e.pointerId;
        joyRect = joyZone.getBoundingClientRect(); updateJoy(e);
    });
    joyZone.addEventListener('pointermove', (e) => { if (!this.joystick.active || this.joystick.pointerId !== e.pointerId) return; e.preventDefault(); updateJoy(e); });
    const endJoy = (e) => {
        if (!this.joystick.active || this.joystick.pointerId !== e.pointerId) return;
        e.preventDefault(); try { joyZone.releasePointerCapture(e.pointerId); } catch(err) {}
        this.joystick.active = false; this.joystick.pointerId = null;
        joyKnob.style.transform = `translate(0px, 0px)`; this.controls.moveX = 0; this.controls.moveZ = 0;
    };
    joyZone.addEventListener('pointerup', endJoy); joyZone.addEventListener('pointercancel', endJoy); joyZone.addEventListener('pointerout', endJoy); 
    
    // ★ 右画面（視点・タップ・長押し）
    const touchZone = document.getElementById('touch-zone');
    
    touchZone.addEventListener('pointerdown', (e) => {
        if (this.touchZone.active) return;
        e.preventDefault();
        touchZone.setPointerCapture(e.pointerId);
        this.touchZone.active = true;
        this.touchZone.pointerId = e.pointerId;
        this.touchZone.lastX = e.clientX;
        this.touchZone.lastY = e.clientY;
        this.touchZone.startT = Date.now();
        this.touchZone.moved = false;
        
        // タッチ開始と同時に「掘る」フラグをONにする
        this.digging = true;
        this.digProgress = 0;
    });
    
    touchZone.addEventListener('pointermove', (e) => {
        if (!this.touchZone.active || this.touchZone.pointerId !== e.pointerId) return;
        e.preventDefault();
        const dx = e.clientX - this.touchZone.lastX;
        const dy = e.clientY - this.touchZone.lastY;
        
        // 指が大きく動いたら「視点移動」とみなし、掘るのをやめる
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            this.touchZone.moved = true;
            this.digging = false;
        }
        
        this.controls.yaw -= dx * 0.006; 
        this.controls.pitch -= dy * 0.006; 
        this.controls.pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, this.controls.pitch));
        
        this.touchZone.lastX = e.clientX;
        this.touchZone.lastY = e.clientY;
    });
    
    const endTouch = (e) => {
        if (!this.touchZone.active || this.touchZone.pointerId !== e.pointerId) return;
        e.preventDefault();
        
        // ★ 指を離した時、時間が短くて動いていなければ「置く」アクション！
        if (!this.touchZone.moved && (Date.now() - this.touchZone.startT < 200)) {
            this.placeBlock();
        }
        
        try { touchZone.releasePointerCapture(e.pointerId); } catch(err) {}
        this.touchZone.active = false;
        this.touchZone.pointerId = null;
        this.digging = false;
    };
    touchZone.addEventListener('pointerup', endTouch);
    touchZone.addEventListener('pointercancel', endTouch);
    touchZone.addEventListener('pointerout', endTouch);

    window.addEventListener('pointerup', (e) => {
        if (this.joystick.active && this.joystick.pointerId === e.pointerId) endJoy(e);
        if (this.touchZone.active && this.touchZone.pointerId === e.pointerId) endTouch(e);
        crouchEnd(e);
    });
  },
  
  resize() {
    if (!this.camera || !this.renderer) return;
    const w = window.innerWidth; const h = window.innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.renderer.setSize(w, h);
    const warn = document.getElementById('rotate-warning');
    if (warn) { if (h > w) warn.style.display = 'flex'; else warn.style.display = 'none'; }
  },
  
  exitGame() {
    this.st = 'exit';
    document.getElementById('mine-container').classList.remove('active');
    document.getElementById('gameboy').style.display = 'flex';
    this.joystick.active = false; this.touchZone.active = false; this.digging = false;
    document.getElementById('joystick-knob').style.transform = `translate(0px, 0px)`;
    this.controls.moveX = 0; this.controls.moveZ = 0;
    switchApp(Menu);
  },
  
  getCollidingBlock(nx, ny, nz, isWall = false) {
    const pSize = 0.3; const pHeight = 1.6; const yOffset = isWall ? 0.05 : 0; 
    for (let b of this.blocks) {
      if (nx + pSize > b.x - 0.5 && nx - pSize < b.x + 0.5 && nz + pSize > b.z - 0.5 && nz - pSize < b.z + 0.5 && ny > b.y - 0.5 && (ny - pHeight + yOffset) < b.y + 0.5) return b;
    }
    return null;
  },

  update() {
    if (this.st !== 'play') return;
    
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.controls.yaw;
    this.camera.rotation.x = this.controls.pitch;
    
    const currentSpeed = this.player.isCrouching ? this.player.speed * 0.4 : this.player.speed;
    const dir = new THREE.Vector3(this.controls.moveX, 0, this.controls.moveZ);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);
    
    let nx = this.player.x + dir.x * currentSpeed;
    let nz = this.player.z + dir.z * currentSpeed;
    if (!this.getCollidingBlock(nx, this.player.y, this.player.z, true)) { this.player.x = nx; }
    if (!this.getCollidingBlock(this.player.x, this.player.y, nz, true)) { this.player.z = nz; }
    
    this.player.vy -= 0.006; let ny = this.player.y + this.player.vy;
    let hitBlock = this.getCollidingBlock(this.player.x, ny, this.player.z, false);
    if (hitBlock) {
        if (this.player.vy < 0) { this.player.vy = 0; this.player.isGrounded = true; ny = hitBlock.y + 0.5 + 1.6; } 
        else { this.player.vy = 0; ny = hitBlock.y - 0.5; }
    } else { this.player.isGrounded = false; }
    
    if (ny < -10) { ny = 15; this.player.x = 8; this.player.z = 8; this.player.vy = 0; }
    this.player.y = ny;
    
    const eyeHeight = this.player.isCrouching ? -0.4 : 0;
    this.camera.position.set(this.player.x, this.player.y + eyeHeight, this.player.z);
    
    // ==========================================
    // ★ ターゲット探索（Raycast）と破壊アニメーション
    // ==========================================
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = raycaster.intersectObjects(this.blockMeshes);
    
    let newTarget = null;
    let newIntersect = null;
    if (intersects.length > 0 && intersects[0].distance < 6) {
        newTarget = intersects[0].object;
        newIntersect = intersects[0];
    }

    // 狙っているブロックが変わったらハイライトを移動＆破壊リセット
    if (newTarget !== this.currentTarget) {
        this.currentTarget = newTarget;
        this.currentIntersect = newIntersect;
        this.digProgress = 0;
        
        // 前のブロックの揺れを元に戻す
        for(let b of this.blocks) { b.mesh.position.set(b.x, b.y, b.z); }
        
        if (newTarget) {
            this.targetHighlight.position.copy(newTarget.position);
            this.targetHighlight.visible = true;
        } else {
            this.targetHighlight.visible = false;
        }
    }
    
    // 長押し中の破壊アニメーション
    if (this.digging && this.currentTarget) {
        this.digProgress++;
        
        // 激しくガタガタ揺れる（壊れかけの表現）
        const intensity = (this.digProgress / 30) * 0.05;
        this.currentTarget.position.x = this.currentTarget.userData.x + (Math.random()-0.5)*intensity;
        this.currentTarget.position.y = this.currentTarget.userData.y + (Math.random()-0.5)*intensity;
        this.currentTarget.position.z = this.currentTarget.userData.z + (Math.random()-0.5)*intensity;
        
        // 約0.5秒(30フレーム)で破壊！
        if (this.digProgress > 30) {
            this.breakBlock(this.currentTarget);
            this.digProgress = 0; // そのまま次のブロックを連続で掘れる
        }
    } else {
        this.digProgress = 0;
        if (this.currentTarget) {
            this.currentTarget.position.set(this.currentTarget.userData.x, this.currentTarget.userData.y, this.currentTarget.userData.z);
        }
    }

    // ドロップアイテムの処理
    for (let i = this.drops.length - 1; i >= 0; i--) {
        let d = this.drops[i];
        d.vy -= 0.005; d.mesh.position.x += d.vx; d.mesh.position.y += d.vy; d.mesh.position.z += d.vz;
        
        let floorY = -999;
        const bx = Math.round(d.mesh.position.x); const bz = Math.round(d.mesh.position.z);
        for(let b of this.blocks) { if(b.x === bx && b.z === bz && b.y <= d.mesh.position.y) { if(b.y > floorY) floorY = b.y; } }
        
        if (d.mesh.position.y < floorY + 0.5 + 0.125) {
            d.mesh.position.y = floorY + 0.5 + 0.125;
            d.vy = 0; d.vx *= 0.5; d.vz *= 0.5; 
        }
        
        d.time += 0.05; d.mesh.rotation.y += 0.05; d.mesh.position.y += Math.sin(d.time) * 0.005; 
        
        const dist = Math.hypot(d.mesh.position.x - this.player.x, d.mesh.position.y - this.player.y, d.mesh.position.z - this.player.z);
        if (dist < 1.5) {
            this.scene.remove(d.mesh); this.drops.splice(i, 1);
            if(typeof playSnd === 'function') playSnd('jmp'); 
        }
    }
  },
  
  draw() {
    if (this.st !== 'play' || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }
};
