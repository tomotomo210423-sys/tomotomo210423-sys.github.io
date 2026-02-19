// === BLOCK CRAFT (3D) - PHASE 1 & 2 ===
const Mine = {
  st: 'init',
  scene: null, camera: null, renderer: null,
  textureAtlas: null, materials: [],
  player: { x: 8, y: 5, z: 8, vy: 0, isGrounded: false, speed: 0.1, jumpPower: 0.15 },
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
    this.player.x = 8; this.player.y = 5; this.player.z = 8;
    this.controls.yaw = 0; this.controls.pitch = 0;
    this.resize();
  },
  
  setup3D() {
    // 1. シーン、カメラ、レンダラーの準備
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // 空色
    this.scene.fog = new THREE.Fog(0x87CEEB, 10, 30);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    
    // キャンバスをフルスクリーンコンテナに追加（UIの裏に配置）
    const canvas = this.renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0'; canvas.style.left = '0'; canvas.style.zIndex = '1';
    document.getElementById('mine-container').insertBefore(canvas, document.getElementById('mine-ui'));
    
    // 2. 光源の追加
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(10, 20, 10);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6)); // 環境光
    
    // 3. テクスチャアトラスの読み込みとマテリアルの作成
    const loader = new THREE.TextureLoader();
    this.textureAtlas = loader.load('atlas.png');
    this.textureAtlas.magFilter = THREE.NearestFilter; // ドット絵をくっきり表示
    this.textureAtlas.minFilter = THREE.NearestFilter;
    
    // UVマッピング用のヘルパー関数（4x4の画像分割）
    const getUVs = (col, row) => {
      const u = col * 0.25;
      const v = row * 0.25; // 左下原点
      return [ u, v+0.25, u+0.25, v+0.25, u, v, u+0.25, v ];
    };

    // 草ブロックのGeometry設定（上：草、下：土、横：草横）
    const grassGeo = new THREE.BoxGeometry(1, 1, 1);
    const uvs = grassGeo.attributes.uv;
    // 面の順序: Right(0), Left(1), Top(2), Bottom(3), Front(4), Back(5)
    // 画像座標: 行3(上)が画像上部。草上(0,3), 草横(1,3), 土(2,3)
    const setFaceUV = (geo, faceIndex, col, row) => {
        const u = getUVs(col, row);
        geo.attributes.uv.setXY(faceIndex*4+0, u[0], u[1]);
        geo.attributes.uv.setXY(faceIndex*4+1, u[2], u[3]);
        geo.attributes.uv.setXY(faceIndex*4+2, u[4], u[5]);
        geo.attributes.uv.setXY(faceIndex*4+3, u[6], u[7]);
    };
    setFaceUV(grassGeo, 0, 1, 3); setFaceUV(grassGeo, 1, 1, 3); // 側面
    setFaceUV(grassGeo, 2, 0, 3); // 上面
    setFaceUV(grassGeo, 3, 2, 3); // 下面
    setFaceUV(grassGeo, 4, 1, 3); setFaceUV(grassGeo, 5, 1, 3); // 側面
    
    const mat = new THREE.MeshLambertMaterial({ map: this.textureAtlas });
    
    // 4. 平坦な地形を生成（16x16マス）
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
    window.addEventListener('resize', () => this.resize(), false);
    
    // EXITボタン
    document.getElementById('btn-mine-exit').addEventListener('touchstart', (e) => { e.preventDefault(); this.exitGame(); }, {passive: false});
    document.getElementById('btn-mine-exit').addEventListener('mousedown', (e) => { e.preventDefault(); this.exitGame(); });
    
    // ジャンプボタン
    const jumpBtn = document.getElementById('btn-jump');
    const doJump = (e) => { e.preventDefault(); if (this.player.isGrounded) { this.player.vy = this.player.jumpPower; this.player.isGrounded = false; } };
    jumpBtn.addEventListener('touchstart', doJump, {passive: false});
    jumpBtn.addEventListener('mousedown', doJump);

    // 左：ジョイスティック
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
        const distance = Math.min(40, Math.hypot(dx, dy)); // ノブの移動限界
        const angle = Math.atan2(dy, dx);
        
        joyKnob.style.transform = `translate(${Math.cos(angle)*distance}px, ${Math.sin(angle)*distance}px)`;
        // 入力値（-1.0 ~ 1.0）
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
    
    // 右：視点移動（スワイプ）
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
        
        this.controls.yaw -= dx * 0.005; // 左右回転
        this.controls.pitch -= dy * 0.005; // 上下回転
        // 真上・真下を向けすぎないよう制限
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
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },
  
  exitGame() {
    this.st = 'exit';
    document.getElementById('mine-container').classList.remove('active');
    document.getElementById('gameboy').style.display = 'flex';
    switchApp(Menu);
  },
  
  // マイクラ風の当たり判定
  checkCollision(nx, ny, nz) {
    const pSize = 0.3; // プレイヤーの太さ
    const pHeight = 1.6; // プレイヤーの高さ
    for (let b of this.blocks) {
      if (nx + pSize > b.x - 0.5 && nx - pSize < b.x + 0.5 &&
          nz + pSize > b.z - 0.5 && nz - pSize < b.z + 0.5 &&
          ny > b.y - 0.5 && ny - pHeight < b.y + 0.5) {
        return true;
      }
    }
    return false;
  },

  update() {
    if (this.st !== 'play') return;
    
    // 視点の回転
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.controls.yaw;
    this.camera.rotation.x = this.controls.pitch;
    
    // 移動ベクトルをカメラの向きに合わせて変換
    const dir = new THREE.Vector3(this.controls.moveX, 0, this.controls.moveZ);
    dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw);
    
    let nx = this.player.x + dir.x * this.player.speed;
    let nz = this.player.z + dir.z * this.player.speed;
    
    // X軸の壁判定
    if (!this.checkCollision(nx, this.player.y, this.player.z)) { this.player.x = nx; }
    // Z軸の壁判定
    if (!this.checkCollision(this.player.x, this.player.y, nz)) { this.player.z = nz; }
    
    // 重力と落下処理
    this.player.vy -= 0.01; // 重力
    let ny = this.player.y + this.player.vy;
    
    if (this.checkCollision(this.player.x, ny, this.player.z)) {
        if (this.player.vy < 0) {
            // 床に着地
            this.player.vy = 0;
            this.player.isGrounded = true;
            // ブロックの上面にスナップ
            ny = Math.floor(ny) + 0.5 + 1.6; 
        } else {
            // 天井に頭をぶつけた
            this.player.vy = 0;
            ny = this.player.y;
        }
    } else {
        this.player.isGrounded = false;
    }
    
    // 奈落落下防止
    if (ny < -5) { ny = 10; this.player.x = 8; this.player.z = 8; this.player.vy = 0; }
    this.player.y = ny;
    
    // カメラをプレイヤーの目の位置へ
    this.camera.position.set(this.player.x, this.player.y, this.player.z);
  },
  
  draw() {
    if (this.st !== 'play' || !this.renderer) return;
    this.renderer.render(this.scene, this.camera);
  }
};
