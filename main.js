// === BLOCK CRAFT (3D) - FIX COLLISION & RESIZE ===
const Mine = {
  st: 'init',
  scene: null, camera: null, renderer: null,
  textureAtlas: null, materials: [],
  player: { x: 8, y: 5, z: 8, vy: 0, isGrounded: false, speed: 0.12, jumpPower: 0.18 },
  controls: { moveX: 0, moveZ: 0, yaw: 0, pitch: 0 },
  blocks: [], // 衝突判定用のブロックリスト
  joystick: { active: false, startX: 0, startY: 0 },
  touchZone: { active: false, lastX: 0, lastY: 0 },
  initialized: false,
  
  init() {
    // ゲームボーイ(2D)を隠し、フルスクリーンコンテナを表示
    document.getElementById('gameboy').style.display = 'none';
    document.getElementById('mine-container').classList.add('active');
    
    if (!this.initialized) {
      this.setup3D();
      this.bindEvents();
      this.initialized = true;
    }
    
    this.st = 'play';
    // ★ 初期位置を少し高めに設定。少し下を向かせる
    this.player.x = 8; this.player.y = 10; this.player.z = 8;
    this.player.vy = 0;
    this.controls.yaw = 0; this.controls.pitch = -0.5; 
    
    // 画面サイズを確実にフィットさせる
    setTimeout(() => this.resize(), 50);
    setTimeout(() => this.resize(), 500); // スマホの回転遅延対策
  },
  
  setup3D() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // 空色
    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 30);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.zIndex = '1';
    canvas.style.width = '100%'; canvas.style.height = '100%';
    document.getElementById('mine-container').insertBefore(canvas, document.getElementById('mine-ui'));
    
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(10, 20, 10);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    
    const loader = new THREE.TextureLoader();
    this.textureAtlas = loader.load('atlas.png');
    this.textureAtlas.magFilter = THREE.NearestFilter;
    this.textureAtlas.minFilter = THREE.NearestFilter;
    
    const getUVs = (col, row) => {
      const u = col * 0.25; const v = row * 0.25;
      return [ u, v+0.25, u+0.25, v+0.25, u, v, u+0.25, v ];
    };

    const grassGeo = new THREE.BoxGeometry(1, 1, 1);
    const setFaceUV = (geo, faceIndex, col, row) => {
        const u = getUVs(col, row);
        geo.attributes.uv.setXY(faceIndex*4+0, u[0], u[1]);
        geo.attributes.uv.setXY(faceIndex*4+1, u[2], u[3]);
        geo.attributes.uv.setXY(faceIndex*4+2, u[4], u[5]);
        geo.attributes.uv.setXY(faceIndex*4+3, u[6], u[7]);
    };
    setFaceUV(grassGeo, 0, 1, 3); setFaceUV(grassGeo, 1, 1, 3);
    setFaceUV(grassGeo, 2, 0, 3); setFaceUV(grassGeo, 3, 2, 3);
    setFaceUV(grassGeo, 4, 1, 3); setFaceUV(grassGeo, 5, 1, 3);
    
    const mat = new THREE.MeshLambertMaterial({ map: this.textureAtlas });
    
    // 平坦な地形を生成（16x16マス）
    for (let x = 0; x < 16; x++) {
      for (let z = 0; z < 16; z++) {
        const mesh = new THREE.Mesh(grassGeo, mat);
        mesh.position.set(x, 0, z);
        this.scene.add(mesh);
        this.blocks.push({ x: x, y: 0, z: z });
      }
    }
    
    // ちょっとした段差
    const mesh2 = new THREE.Mesh(grassGeo, mat); mesh2.position.set(8, 1, 5); this.scene.add(mesh2); this.blocks.push({x:8, y:1, z:5});
    const mesh3 = new THREE.Mesh(grassGeo, mat); mesh3.position.set(9, 1, 5); this.scene.add(mesh3); this.blocks.push({x:9, y:1, z:5});
    const mesh4 = new THREE.Mesh(grassGeo, mat); mesh4.position.set(9, 2, 4); this.scene.add(mesh4); this.blocks.push({x:9, y:2, z:4});
  },
  
  bindEvents() {
    window.addEventListener('resize', () => { setTimeout(() => this.resize(), 100); }, false);
    window.addEventListener('orientationchange', () => { setTimeout(() => this.resize(), 200); }, false);
    
    document.getElementById('btn-mine-exit').addEventListener('touchstart', (e) => { e.preventDefault(); this.exitGame(); }, {passive: false});
    document.getElementById('btn-mine-exit').addEventListener('mousedown', (e) => { e.preventDefault(); this.exitGame(); });
    
    const jumpBtn = document.getElementById('btn-jump');
    const doJump = (e) => { e.preventDefault(); if (this.player.isGrounded) { this.player.vy = this.player.jumpPower; this.player.isGrounded = false; } };
    jumpBtn.addEventListener('touchstart', doJump, {passive: false});
    jumpBtn.addEventListener('mousedown', doJump);

    const joyZone = document.getElementById('joystick-zone');
    const joyKnob = document.getElementById('joystick-knob');
    let joyRect = null;
    
    const handleJoyStart = (e) => {
        e.preventDefault();
        joyRect = joyZone.getBoundingClientRect();
        this.joystick.active = true;
        handleJoyMove(e);
    };
    const handleJoyMove = (e) => {
        if (!this.joystick.active) return;
        e.preventDefault();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const centerX = joyRect.left + joyRect.width / 2;
        const centerY = joyRect.top + joyRect.height / 2;
        let dx = clientX - centerX; let dy = clientY - centerY;
        const distance = Math.min(40, Math.hypot(dx, dy)); 
        const angle = Math.atan2(dy, dx);
        
        joyKnob.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`;
        this.controls.moveX = (Math.cos(angle)*distance) / 40;
        this.controls.moveZ = (Math.sin(angle)*distance) / 40;
    };
    const handleJoyEnd = (e) => {
        e.preventDefault();
        this.joystick.active = false;
        joyKnob.style.transform = `translate(0px, 0px)`;
        this.controls.moveX = 0; this.controls.moveZ = 0;
    };
    joyZone.addEventListener('touchstart', handleJoyStart, {passive: false});
    joyZone.addEventListener('touchmove', handleJoyMove, {passive: false});
    joyZone.addEventListener('touchend', handleJoyEnd, {passive: false});
    
    const touchZone = document.getElementById('touch-zone');
    const handleTouchStart = (e) => {
        e.preventDefault();
        this.touchZone.active = true;
        this.touchZone.lastX = e.touches ? e.touches[0].clientX : e.clientX;
        this.touchZone.lastY = e.touches ? e.touches[0].clientY : e.clientY;
    };
    const handleTouchMove = (e) => {
        if (!this.touchZone.active) return;
        e.preventDefault();
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;
        const dx = x - this.touchZone.lastX;
        const dy = y - this.touchZone.lastY;
        
        this.controls.yaw -= dx * 0.005; 
        this.controls.pitch -= dy * 0.005; 
        this.controls.pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, this.controls.pitch));
        
        this.touchZone.lastX = x; this.touchZone.lastY = y;
    };
    const handleTouchEnd = (e) => { e.preventDefault(); this.touchZone.active = false; };
    touchZone.addEventListener('touchstart', handleTouchStart, {passive: false});
    touchZone.addEventListener('touchmove', handleTouchMove, {passive: false});
    touchZone.addEventListener('touchend', handleTouchEnd, {passive: false});
  },
  
  resize() {
    if (!this.camera || !this.renderer) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    
    // ★ 縦画面の時は警告を出す
    const warn = document.getElementById('rotate-warning');
    if (warn) {
        if (h > w) warn.style.display = 'flex';
        else warn.style.display = 'none';
    }
  },
  
  exitGame() {
    this.st = 'exit';
    document.getElementById('mine-container').classList.remove('active');
    document.getElementById('gameboy').style.display = 'flex';
    switchApp(Menu);
  },
  
  // ★ バグ修正：当たったブロックそのものを返すように変更
  getCollidingBlock(nx, ny, nz) {
    const pSize = 0.3; 
    const pHeight = 1.6; 
    for (let b of this.blocks) {
      if (nx + pSize > b.x - 0.5 && nx - pSize < b.x + 0.5 &&
          nz + pSize > b.z - 0.5 && nz - pSize < b.z + 0.5 &&
          ny > b.y - 0.5 && ny - pHeight < b.y + 0.5) {
        return b;
      }
    }
    return null;
  },

  update() {
    if (this.st !== 'play') return;
    
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.controls.yaw;
    this.camera.rotation.x = this.controls.pitch;
    
    const dir = new THREE.Vector3(this.controls.moveX, 0, this.controls.moveZ);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);
    
    let nx = this.player.x + dir.x * this.player.speed;
    let nz = this.player.z + dir.z * this.player.speed;
    
    if (!this.getCollidingBlock(nx, this.player.y, this.player.z)) { this.player.x = nx; }
    if (!this.getCollidingBlock(this.player.x, this.player.y, nz)) { this.player.z = nz; }
    
    this.player.vy -= 0.01; // 重力
    let ny = this.player.y + this.player.vy;
    
    let hitBlock = this.getCollidingBlock(this.player.x, ny, this.player.z);
    if (hitBlock) {
        if (this.player.vy < 0) {
            this.player.vy = 0;
            this.player.isGrounded = true;
            ny = hitBlock.y + 0.5 + 1.6; // ブロックの上面＋身長にピッタリ合わせる
        } else {
            this.player.vy = 0;
            ny = hitBlock.y - 0.5; // 天井にぶつかる
        }
    } else {
        this.player.isGrounded = false;
    }
    
    // 奈落落下防止（落ちたら初期位置に戻る）
    if (ny < -10) { ny = 10; this.player.x = 8; this.player.z = 8; this.player.vy = 0; }
    this.player.y = ny;
    
    this.camera.position.set(this.player.x, this.player.y, this.player.z);
  },
  
  draw() {
    if (this.st !== 'play' || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }
};
