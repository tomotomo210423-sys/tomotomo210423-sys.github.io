// === BLOCK CRAFT (3D) - MINECRAFT PE TOUCH & PHYSICS PERFECTED ===
const Mine = {
  st: 'init',
  scene: null, camera: null, renderer: null,
  textureAtlas: null, geometries: {}, materials: {},
  mobTexture: null,
  
  // 本家準拠：身長1.8、目線1.62
  player: { x: 8, y: 15, z: 8, vy: 0, isGrounded: false, speed: 0.07, crouchSpeed: 0.025, jumpPower: 0.16, isCrouching: false, currentEyeHeight: 1.62 },
  controls: { moveX: 0, moveZ: 0, yaw: 0, pitch: -0.5 },
  
  blocks: [], blockMeshes: [], drops: [], mobs: [],
  
  // ★ 修正：本家マイクラの破壊時間（素手）をフレーム(60fps)で完全再現
  hardness: {
      grass: 54, dirt: 45, sand: 45, leaves: 18, glass: 18,
      wood: 180, plank: 120, crafting: 120,
      stone: 450, cobblestone: 450, coal: 500, iron: 500, diamond: 600
  },
  
  targetHighlight: null, currentTarget: null, currentIntersect: null,
  digging: false, digProgress: 0,
  
  joystick: { active: false, pointerId: null },
  touchZone: { active: false, pointerId: null, lastX: 0, lastY: 0, mode: 'waiting' }, // モード: waiting, camera, digging
  digTimer: null,
  
  currentSlot: 0, // 選択中のホットバー
  inventory: Array(9).fill(null), // 手持ちのブロック用配列
  
  initialized: false,
  
  init() {
    document.getElementById('gameboy').style.display = 'none';
    document.getElementById('mine-container').classList.add('active');
    
    if (!this.initialized) {
      this.setup3D();
      this.bindUI();
      this.bindEvents();
      this.initialized = true;
    }
    
    this.st = 'play';
    this.player.x = 8; this.player.y = 15; this.player.z = 8; this.player.vy = 0;
    this.controls.yaw = 0; this.controls.pitch = -0.5; 
    
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
    canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0'; 
    canvas.style.zIndex = '1'; canvas.style.width = '100vw'; canvas.style.height = '100vh';
    document.getElementById('mine-container').insertBefore(canvas, document.getElementById('mine-ui'));
    
    const light = new THREE.DirectionalLight(0xffffff, 1.0); light.position.set(10, 20, 10); this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const loader = new THREE.TextureLoader();
    this.textureAtlas = loader.load('atlas.png');
    this.textureAtlas.magFilter = THREE.NearestFilter; this.textureAtlas.minFilter = THREE.NearestFilter;
    
    this.mobTexture = loader.load('mobs.png');
    this.mobTexture.magFilter = THREE.NearestFilter; this.mobTexture.minFilter = THREE.NearestFilter;
    
    this.materials.opaque = new THREE.MeshLambertMaterial({ map: this.textureAtlas });
    this.materials.transparent = new THREE.MeshLambertMaterial({ map: this.textureAtlas, transparent: true, alphaTest: 0.5 });
    
    const getUVs = (col, row) => [ col*0.25, 0.75-row*0.25, (col+1)*0.25, 0.75-row*0.25, col*0.25, 1.0-row*0.25, (col+1)*0.25, 1.0-row*0.25 ];
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
        dirt: createGeo(Array(6).fill({c:2,r:0})), stone: createGeo(Array(6).fill({c:3,r:0})),
        cobblestone: createGeo(Array(6).fill({c:0,r:1})), wood: createGeo([{c:1,r:1}, {c:1,r:1}, {c:2,r:1}, {c:2,r:1}, {c:1,r:1}, {c:1,r:1}]),
        leaves: createGeo(Array(6).fill({c:3,r:1}))
    };

    const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.005, 1.005, 1.005));
    const edgesMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.targetHighlight = new THREE.LineSegments(edgesGeo, edgesMat);
    this.targetHighlight.visible = false;
    this.scene.add(this.targetHighlight);

    this.generateTerrain();
    
    // ★ ゾンビの召喚
    this.spawnZombie(10, 5, 10);
  },

  generateTerrain() {
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        for (let y = 0; y <= 4; y++) {
          this.addBlock(x, y, z, (y === 4) ? 'grass' : (y === 3) ? 'dirt' : 'stone');
        }
      }
    }
    this.addBlock(8, 5, 8, 'wood'); this.addBlock(8, 6, 8, 'wood'); this.addBlock(8, 7, 8, 'wood');
    for(let lx=7; lx<=9; lx++) for(let lz=7; lz<=9; lz++) for(let ly=7; ly<=8; ly++) { if(lx===8 && lz===8 && ly===7) continue; this.addBlock(lx, ly, lz, 'leaves'); }
    this.addBlock(8, 9, 8, 'leaves');
  },

  addBlock(x, y, z, type) {
    const mat = (type === 'leaves') ? this.materials.transparent : this.materials.opaque;
    const mesh = new THREE.Mesh(this.geometries[type], mat);
    mesh.position.set(x, y, z);
    mesh.userData = { x, y, z, type, matCloned: false }; 
    this.scene.add(mesh); this.blockMeshes.push(mesh); this.blocks.push({ x, y, z, mesh, type });
  },

  // ★ 修正：ゾンビの見た目を直す関数
  spawnZombie(x, y, z) {
    // mobs.png (4x4) の一番上の行(row=0)がゾンビ
    const mat = new THREE.MeshLambertMaterial({ map: this.mobTexture });
    const getUV = (col, row) => [ col*0.25, 0.75-row*0.25, (col+1)*0.25, 0.75-row*0.25, col*0.25, 1.0-row*0.25, (col+1)*0.25, 1.0-row*0.25 ];
    
    // 頭 (顔はcol=0、横はcol=1)
    const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const u = getUV(0, 0); const uSide = getUV(1, 0);
    [0,1,2,3,4,5].forEach((f, i) => {
        const uv = (i===4) ? u : uSide; // 前面だけ顔
        headGeo.attributes.uv.setXY(i*4+0, uv[0], uv[1]); headGeo.attributes.uv.setXY(i*4+1, uv[2], uv[3]);
        headGeo.attributes.uv.setXY(i*4+2, uv[4], uv[5]); headGeo.attributes.uv.setXY(i*4+3, uv[6], uv[7]);
    });
    const head = new THREE.Mesh(headGeo, mat);
    head.position.set(0, 0.4, 0); // 体の上に乗せる
    
    // 体 (服はcol=3)
    const bodyGeo = new THREE.BoxGeometry(0.8, 1.2, 0.4);
    const uBody = getUV(3, 0);
    [0,1,2,3,4,5].forEach((f, i) => {
        bodyGeo.attributes.uv.setXY(i*4+0, uBody[0], uBody[1]); bodyGeo.attributes.uv.setXY(i*4+1, uBody[2], uBody[3]);
        bodyGeo.attributes.uv.setXY(i*4+2, uBody[4], uBody[5]); bodyGeo.attributes.uv.setXY(i*4+3, uBody[6], uBody[7]);
    });
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.set(0, -0.6, 0);
    
    const group = new THREE.Group();
    group.add(head); group.add(body);
    group.position.set(x, y + 1.2, z);
    this.scene.add(group);
    
    this.mobs.push({ mesh: group, type: 'zombie', x, y, z, hp: 20 });
  },

  breakBlock(mesh) {
    const type = mesh.userData.type; const pos = mesh.position.clone();
    if(mesh.userData.matCloned) mesh.material.dispose();
    this.scene.remove(mesh);
    this.blockMeshes = this.blockMeshes.filter(m => m !== mesh);
    this.blocks = this.blocks.filter(b => b.mesh !== mesh);
    if(typeof playSnd === 'function') playSnd('sel');
    if(navigator.vibrate) navigator.vibrate(50);
    this.spawnDrop(type, pos.x, pos.y, pos.z);
    this.targetHighlight.visible = false; this.currentTarget = null;
  },

  placeBlock() {
    if (!this.currentIntersect) return;
    // 選択中のブロックがない場合は置けない
    const placeType = this.inventory[this.currentSlot] || 'cobblestone'; // テスト用デフォルト
    
    const normal = this.currentIntersect.face.normal; const pos = this.currentIntersect.object.position;
    const nx = pos.x + normal.x; const ny = pos.y + normal.y; const nz = pos.z + normal.z;

    const pSize = 0.3, pHeight = 1.8;
    if (nx + 0.5 > this.player.x - pSize && nx - 0.5 < this.player.x + pSize && nz + 0.5 > this.player.z - pSize && nz - 0.5 < this.player.z + pSize && ny + 0.5 > this.player.y && ny - 0.5 < this.player.y + pHeight) return; 
    
    this.addBlock(nx, ny, nz, placeType);
    if(typeof playSnd === 'function') playSnd('jmp');
  },

  spawnDrop(type, x, y, z) {
    let dropType = type === 'stone' ? 'cobblestone' : type; 
    const mat = (dropType === 'leaves') ? this.materials.transparent : this.materials.opaque;
    const mesh = new THREE.Mesh(this.geometries[dropType], mat);
    mesh.position.set(x, y, z); mesh.scale.set(0.25, 0.25, 0.25); 
    this.scene.add(mesh);
    this.drops.push({ mesh: mesh, type: dropType, vx: (Math.random()-0.5)*0.1, vy: 0.15, vz: (Math.random()-0.5)*0.1, time: 0 });
  },

  // ★ UIイベント（ホットバーの選択切り替え）
  bindUI() {
    for(let i=0; i<9; i++) {
        document.getElementById(`slot-${i}`).addEventListener('mousedown', (e) => {
            document.getElementById(`slot-${this.currentSlot}`).classList.remove('active');
            this.currentSlot = i;
            document.getElementById(`slot-${i}`).classList.add('active');
            if(typeof playSnd === 'function') playSnd('sel');
        });
    }
  },
  
  bindEvents() {
    window.addEventListener('resize', () => { setTimeout(() => this.resize(), 100); }, false);
    
    const jumpBtn = document.getElementById('btn-jump');
    jumpBtn.addEventListener('pointerdown', (e) => { 
      e.preventDefault(); if (this.player.isGrounded) { this.player.vy = this.player.jumpPower; this.player.isGrounded = false; } 
    });

    const crouchBtn = document.getElementById('btn-crouch');
    crouchBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.player.isCrouching = true; crouchBtn.style.background = 'rgba(255,255,255,0.6)'; });
    const crouchEnd = (e) => { e.preventDefault(); this.player.isCrouching = false; crouchBtn.style.background = 'rgba(0,0,0,0.4)'; };
    crouchBtn.addEventListener('pointerup', crouchEnd); crouchBtn.addEventListener('pointercancel', crouchEnd);
    
    document.getElementById('btn-mine-exit').addEventListener('pointerdown', (e) => { e.preventDefault(); this.exitGame(); });

    // ジョイスティック
    const joyZone = document.getElementById('joystick-zone'); const joyKnob = document.getElementById('joystick-knob'); let joyRect = null;
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
    joyZone.addEventListener('pointerup', endJoy); joyZone.addEventListener('pointercancel', endJoy);
    
    // ★ 修正：右画面（タッチ操作の完全切り分け）
    const touchZone = document.getElementById('touch-zone');
    
    touchZone.addEventListener('pointerdown', (e) => {
        if (this.touchZone.active) return;
        e.preventDefault();
        touchZone.setPointerCapture(e.pointerId);
        this.touchZone.active = true;
        this.touchZone.pointerId = e.pointerId;
        this.touchZone.lastX = e.clientX;
        this.touchZone.lastY = e.clientY;
        this.touchZone.mode = 'waiting'; // 待機モードから開始
        
        // 200ミリ秒後に指が動いていなければ「掘りモード」へ
        this.digTimer = setTimeout(() => {
            if (this.touchZone.mode === 'waiting') {
                this.touchZone.mode = 'digging';
                this.digging = true;
                this.digProgress = 0;
            }
        }, 200);
    });
    
    touchZone.addEventListener('pointermove', (e) => {
        if (!this.touchZone.active || this.touchZone.pointerId !== e.pointerId) return;
        e.preventDefault();
        const dx = e.clientX - this.touchZone.lastX;
        const dy = e.clientY - this.touchZone.lastY;
        
        // 指が大きく動いた場合
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            // 掘り始める前に動かした場合は「カメラ専用モード」になり、掘らなくなる
            if (this.touchZone.mode === 'waiting') {
                this.touchZone.mode = 'camera';
                clearTimeout(this.digTimer);
                this.digging = false;
            }
        }
        
        this.controls.yaw -= dx * 0.005; 
        this.controls.pitch -= dy * 0.005; 
        this.controls.pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, this.controls.pitch));
        
        this.touchZone.lastX = e.clientX;
        this.touchZone.lastY = e.clientY;
    });
    
    const endTouch = (e) => {
        if (!this.touchZone.active || this.touchZone.pointerId !== e.pointerId) return;
        e.preventDefault();
        clearTimeout(this.digTimer);
        
        // 待機モードのまま（動かさずにすぐ離した）なら「置く」
        if (this.touchZone.mode === 'waiting') {
            this.placeBlock();
        }
        
        try { touchZone.releasePointerCapture(e.pointerId); } catch(err) {}
        this.touchZone.active = false;
        this.touchZone.pointerId = null;
        this.touchZone.mode = 'none';
        this.digging = false;
    };
    touchZone.addEventListener('pointerup', endTouch);
    touchZone.addEventListener('pointercancel', endTouch);
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
    switchApp(Menu);
  },
  
  getCollidingBlock(nx, ny, nz, isWall = false) {
    const pSize = 0.3; const pHeight = 1.8; const yOffset = isWall ? 0.1 : 0; 
    for (let b of this.blocks) {
      if (nx - pSize < b.x + 0.5 && nx + pSize > b.x - 0.5 && nz - pSize < b.z + 0.5 && nz + pSize > b.z - 0.5 && ny + yOffset < b.y + 0.5 && ny + pHeight > b.y - 0.5) return b;
    }
    return null;
  },

  update() {
    if (this.st !== 'play') return;
    
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.controls.yaw; this.camera.rotation.x = this.controls.pitch;
    
    const currentSpeed = this.player.isCrouching ? this.player.crouchSpeed : this.player.speed;
    const dir = new THREE.Vector3(this.controls.moveX, 0, this.controls.moveZ);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);
    
    let nx = this.player.x + dir.x * currentSpeed; let nz = this.player.z + dir.z * currentSpeed;
    if (!this.getCollidingBlock(nx, this.player.y, this.player.z, true)) { this.player.x = nx; }
    if (!this.getCollidingBlock(this.player.x, this.player.y, nz, true)) { this.player.z = nz; }
    
    this.player.vy -= 0.008; let ny = this.player.y + this.player.vy;
    let hitBlock = this.getCollidingBlock(this.player.x, ny, this.player.z, false);
    if (hitBlock) {
        if (this.player.vy < 0) { this.player.vy = 0; this.player.isGrounded = true; ny = hitBlock.y + 0.5; } 
        else { this.player.vy = 0; ny = hitBlock.y - 0.5 - 1.8; }
    } else { this.player.isGrounded = false; }
    
    if (ny < -10) { ny = 15; this.player.x = 8; this.player.z = 8; this.player.vy = 0; }
    this.player.y = ny;
    
    const targetEyeHeight = this.player.isCrouching ? 1.27 : 1.62;
    this.player.currentEyeHeight += (targetEyeHeight - this.player.currentEyeHeight) * 0.3;
    this.camera.position.set(this.player.x, this.player.y + this.player.currentEyeHeight, this.player.z);
    
    const raycaster = new THREE.Raycaster(); raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = raycaster.intersectObjects(this.blockMeshes);
    let newTarget = null; let newIntersect = null;
    if (intersects.length > 0 && intersects[0].distance < 5) { newTarget = intersects[0].object; newIntersect = intersects[0]; }

    if (newTarget !== this.currentTarget) {
        if (this.currentTarget && this.currentTarget.userData.matCloned) this.currentTarget.material.color.setScalar(1.0);
        this.currentTarget = newTarget; this.currentIntersect = newIntersect; this.digProgress = 0;
        if (newTarget) { this.targetHighlight.position.copy(newTarget.position); this.targetHighlight.visible = true; } 
        else { this.targetHighlight.visible = false; }
    }
    
    // ★ 修正：本家の硬さに基づいた破壊ダメージ演出
    if (this.digging && this.currentTarget) {
        this.digProgress++;
        const type = this.currentTarget.userData.type;
        const maxDig = this.hardness[type] || 45; // デフォルトは土レベル
        
        const darken = 1.0 - (this.digProgress / maxDig) * 0.5;
        if (!this.currentTarget.userData.matCloned) {
            this.currentTarget.material = this.currentTarget.material.clone();
            this.currentTarget.userData.matCloned = true;
        }
        this.currentTarget.material.color.setScalar(darken);

        // わずかに震えさせる
        const intensity = (this.digProgress / maxDig) * 0.05;
        this.currentTarget.position.x = this.currentTarget.userData.x + (Math.random()-0.5)*intensity;
        this.currentTarget.position.y = this.currentTarget.userData.y + (Math.random()-0.5)*intensity;

        if (this.digProgress >= maxDig) {
            this.breakBlock(this.currentTarget);
            this.digProgress = 0; 
        }
    } else {
        this.digProgress = 0;
        if (this.currentTarget && this.currentTarget.userData.matCloned) {
            this.currentTarget.material.color.setScalar(1.0);
            this.currentTarget.position.set(this.currentTarget.userData.x, this.currentTarget.userData.y, this.currentTarget.userData.z);
        }
    }

    // ゾンビの簡易AI（こちらを向く）
    for(let m of this.mobs) {
        m.mesh.lookAt(this.player.x, m.mesh.position.y, this.player.z);
    }

    // ドロップアイテム回収
    for (let i = this.drops.length - 1; i >= 0; i--) {
        let d = this.drops[i];
        d.vy -= 0.005; d.mesh.position.x += d.vx; d.mesh.position.y += d.vy; d.mesh.position.z += d.vz;
        
        let floorY = -999; const bx = Math.round(d.mesh.position.x); const bz = Math.round(d.mesh.position.z);
        for(let b of this.blocks) { if(b.x === bx && b.z === bz && b.y <= d.mesh.position.y) { if(b.y > floorY) floorY = b.y; } }
        if (d.mesh.position.y < floorY + 0.5 + 0.125) { d.mesh.position.y = floorY + 0.5 + 0.125; d.vy = 0; d.vx *= 0.5; d.vz *= 0.5; }
        
        d.time += 0.05; d.mesh.rotation.y += 0.05; d.mesh.position.y += Math.sin(d.time) * 0.005; 
        
        const dist = Math.hypot(d.mesh.position.x - this.player.x, d.mesh.position.y - (this.player.y + 0.9), d.mesh.position.z - this.player.z);
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
